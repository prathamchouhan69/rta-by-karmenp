import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { startMockZoho } from './helpers/mockZoho.js';
import { startMockLLM } from './helpers/mockLLM.js';
import { Store } from '../src/store/store.js';
import { AuditLog } from '../src/audit/auditLog.js';
import { Approvals } from '../src/approvals/approvals.js';
import { ZohoTokens } from '../src/zoho/auth.js';
import { ZohoReader } from '../src/zoho/client.js';
import { ZohoWriter } from '../src/zoho/writer.js';
import { ModelRegistry } from '../src/models/registry.js';
import { Gateway } from '../src/models/gateway.js';
import { CostGuard } from '../src/models/costGuard.js';
import { Usage } from '../src/models/usage.js';
import { ModelRouter } from '../src/models/router.js';
import { HsnService, checkCodeFormat } from '../src/hsn/hsn.js';
import { DocumentEngine } from '../src/documents/documents.js';
import { buildBriefing, BriefingScheduler, SECTION_DEFS } from '../src/briefing/briefing.js';
import { nextRun } from '../src/util/time.js';

const servers = []; after(() => Promise.all(servers.map((s) => s.close())));
const owner = { id: 'pratham', role: 'owner' }, acct = { id: 'acct', role: 'accountant' };
const INSTR = 'Make an invoice for Sharma Constructions for 20 MT TMT Steel Bar at 62000 per MT, GST 18%, delivery to Mandideep, payment terms 30 days';
const GOOD = { customerName: 'Sharma Constructions', date: null, paymentTermsDays: '30', delivery: 'Mandideep', notes: null, items: [{ name: 'TMT Steel Bar', quantity: '20', unit: 'MT', rate: '62000', discount: null, gstRatePercent: '18' }], missing: [] };

async function build({ extract = GOOD, write = true, zohoOpts } = {}) {
  const z = await startMockZoho(zohoOpts); servers.push(z);
  const llm = await startMockLLM({ models: [{ id: 'v/json', pricing: { prompt: '0', completion: '0' }, context_length: 8000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, supported_parameters: ['response_format'] }], script: { 'v/json': [{ text: JSON.stringify(extract) }] } }); servers.push(llm);
  const store = new Store(), audit = new AuditLog({ key: 'k'.repeat(40) }), registry = new ModelRegistry(store); registry.setProviderTrust('openrouter', 'T2');
  const router = new ModelRouter({ registry, gateways: { openrouter: new Gateway({ name: 'openrouter', base: llm.base, key: 'x' }) }, usage: new Usage(store), guard: new CostGuard({ registry }), audit, config: { costPolicy: 'free-only', freeDailyCap: null, briefingReserve: 0 }, sleep: async () => {} });
  await router.sync();
  const creds = { clientId: 'a', clientSecret: 'b', refreshToken: 'c' };
  const mkTok = () => new ZohoTokens({ accountsBase: z.accountsBase, creds });
  const reader = new ZohoReader({ apiBase: z.apiBase, orgId: 'ORG1', tokens: mkTok() });
  const writer = write ? new ZohoWriter({ apiBase: z.apiBase, orgId: 'ORG1', tokens: mkTok() }) : null;
  const approvals = new Approvals({ store, secret: 'p'.repeat(40), audit }); const hsn = new HsnService({ store, reader, audit });
  const docs = new DocumentEngine({ router, reader, hsn, approvals, writer, store, audit });
  return { z, llm, store, audit, router, reader, approvals, hsn, docs };
}

test('HSN code format: HSN 2/4/6/8 digits, SAC 6 digits starting 99, nothing else', () => {
  assert.deepEqual([checkCodeFormat('7214').kind, checkCodeFormat('998519').kind, checkCodeFormat('99851').valid, checkCodeFormat('72A4').valid, checkCodeFormat('72141').valid], ['HSN', 'SAC', false, false, false]);
});
test('HSN never invents: with no source the answer is "Needs verification" and no code', async () => {
  const { hsn } = await build(); const r = await hsn.resolve('Quantum Widget 9000');
  assert.deepEqual([r.status, r.code, r.gstRate], ['Needs verification', null, null]); assert.ok(r.warnings.some((w) => w.code === 'NO_SOURCE'));
});
test('HSN from the Zoho item master is only "Likely"; owner confirmation makes it usable; rate mismatch is warned', async () => {
  const { hsn } = await build(); let r = await hsn.resolve('TMT Steel Bar', { statedRate: '18' });
  assert.deepEqual([r.status, r.code, r.gstRate, r.needsOwnerConfirmation], ['Likely', '7214', '18', true]);
  r = await hsn.resolve('TMT Steel Bar', { statedRate: '5' }); assert.ok(r.warnings.some((w) => w.code === 'RATE_MISMATCH'));
  assert.throws(() => hsn.confirm({ itemName: 'TMT Steel Bar', code: '7214', gstRate: '18', source: '', actor: owner }), /where you verified/);
  assert.throws(() => hsn.confirm({ itemName: 'TMT Steel Bar', code: '72', gstRate: 'abc', source: 's', actor: owner }), /GST rate/);
  hsn.confirm({ itemName: 'TMT Steel Bar', code: '7214', gstRate: '18', source: 'GST portal, checked by owner', actor: owner });
  r = await hsn.resolve('tmt steel  bar', { statedRate: '18' }); assert.deepEqual([r.status, r.needsOwnerConfirmation], ['Confirmed by owner', false]);
  assert.ok((await hsn.resolve('TMT Steel Bar', { statedRate: '12' })).warnings.some((w) => w.code === 'RATE_MISMATCH'));
});
test('an official lookup adapter can mark an exact in-force match Verified; anything weaker stays Likely', async () => {
  const { store, audit } = await build(); const mk = (c) => new HsnService({ store: new Store(), audit, lookup: async () => [c], now: () => new Date('2026-11-01T05:00:00Z') });
  const exact = await mk({ code: '7214', description: 'bars', gstRate: '18', source: 'official', exactMatch: true, rateInForceOn: '2026-11-01', checkedOn: '2026-11-01' }).resolve('x');
  const weak = await mk({ code: '7214', description: 'bars', gstRate: '18', source: 'blog', exactMatch: false, rateInForceOn: '2026-11-01' }).resolve('x');
  assert.deepEqual([exact.status, weak.status], ['Verified', 'Likely']);
});
test('one sentence becomes a draft: customer found, numbers kept as typed, totals left to Zoho, HSN blocks until confirmed', async () => {
  const { docs } = await build(); const d = await docs.draftFromText(INSTR, owner);
  assert.equal(d.customer.status, 'matched'); assert.equal(d.items[0].quantity, '20'); assert.equal(d.items[0].rate, '62000'); assert.equal(d.preview.totals, 'Total will be calculated by Zoho Books');
  assert.equal(d.status, 'needs_input'); assert.ok(d.blockers.some((b) => b.code === 'HSN')); assert.throws(() => docs.propose(d.id, owner), (e) => e.code === 'BLOCKED');
  assert.ok(!JSON.stringify(d.preview).match(/total":\s*"?\d/i));
});
test('numbers the model added that are not in your instruction are dropped and reported, never used', async () => {
  const bad = { ...GOOD, items: [{ ...GOOD.items[0], rate: '58000', quantity: '20' }] };
  const { docs } = await build({ extract: bad }); const d = await docs.draftFromText(INSTR, owner);
  assert.equal(d.items[0].rate, null); assert.ok(d.warnings.some((w) => w.includes('58000'))); assert.ok(d.blockers.some((b) => b.code === 'RATE'));
});
test('unknown customer is a blocker, not a guess', async () => {
  const { docs } = await build({ extract: { ...GOOD, customerName: 'Nobody Traders' } }); const d = await docs.draftFromText(INSTR, owner);
  assert.equal(d.customer.status, 'not_found'); assert.ok(d.blockers.some((b) => b.code === 'CUSTOMER'));
});
test('full approved flow: confirm HSN, propose (G2), approve as owner, execute, Zoho creates a DRAFT and its figures are shown verbatim', async () => {
  const { docs, hsn, approvals, z, audit } = await build();
  hsn.confirm({ itemName: 'TMT Steel Bar', code: '7214', gstRate: '18', source: 'GST portal', actor: owner });
  const d = await docs.draftFromText(INSTR, acct); assert.equal(d.status, 'ready');
  const p = docs.propose(d.id, acct); assert.equal(p.gate, 'G2'); assert.equal(p.payload.customer_id, 'c1'); assert.ok(!('total' in p.payload));
  assert.equal(z.calls.filter((c) => c.method === 'POST' && c.path.endsWith('/invoices')).length, 0, 'nothing written before approval');
  assert.throws(() => approvals.approve(p.id, acct), /cannot approve G2/);
  const { token } = approvals.approve(p.id, owner);
  const r = await docs.execute(p.id, token, owner);
  assert.deepEqual([r.number, r.status, r.total, r.unexpectedStatus], ['INV-KE-270099', 'draft', '1234567.80', false]);
  const sent = JSON.parse(z.calls.find((c) => c.method === 'POST' && c.path.endsWith('/invoices')).body); assert.deepEqual(sent.line_items[0], { item_id: 'i1', quantity: '20', rate: '62000', unit: 'MT', hsn_or_sac: '7214' }); assert.equal(sent.payment_terms, 30);
  assert.equal(docs.get(d.id).status, 'created'); await assert.rejects(docs.execute(p.id, token, owner), /already used|not in an approved/);
  assert.ok(['document.drafted', 'proposal.created', 'proposal.approved', 'proposal.executed'].every((a) => audit.rows.some((x) => x.action === a)));
});
test('with Zoho writes switched off, executing is refused and the approval token is NOT burned', async () => {
  const { docs, hsn, approvals, z } = await build({ write: false });
  hsn.confirm({ itemName: 'TMT Steel Bar', code: '7214', gstRate: '18', source: 'GST portal', actor: owner });
  const d = await docs.draftFromText(INSTR, owner); const p = docs.propose(d.id, owner); const { token } = approvals.approve(p.id, owner);
  await assert.rejects(docs.execute(p.id, token, owner), (e) => e.code === 'WRITE_DISABLED');
  assert.equal(approvals.get(p.id).status, 'approved'); assert.equal(z.calls.filter((c) => c.method === 'POST' && c.path.includes('/invoices')).length, 0);
});
test('editing keeps every version and can restore one; an edit that breaks the draft re-opens blockers', async () => {
  const { docs, hsn } = await build(); hsn.confirm({ itemName: 'TMT Steel Bar', code: '7214', gstRate: '18', source: 's', actor: owner });
  const d = await docs.draftFromText(INSTR, owner); const e = await docs.update(d.id, { items: [{ ...d.items[0], rate: null }] }, owner);
  assert.equal(e.version, 2); assert.ok(e.blockers.some((b) => b.code === 'RATE'));
  const back = await docs.revert(d.id, 1, owner); assert.equal(back.items[0].rate, '62000'); assert.equal(back.version, 3); assert.equal(back.status, 'ready');
});
test('text drafts are saved as drafts, labelled not sent, with unsupported numbers marked', async () => {
  const { docs, llm } = await build(); llm.calls.length = 0;
  const t = await docs.writeText({ kind: 'payment_reminder', instruction: 'Remind Sharma about INV-KE-270031', facts: 'Balance 64,944.84, 27 days overdue', actor: owner });
  assert.match(t.notice, /Not sent/); assert.ok(Array.isArray(t.unsupportedNumbers)); await assert.rejects(docs.writeText({ kind: 'nonsense', instruction: 'x', actor: owner }), /kind must be/);
});
test('briefing: 13 sections, Zoho overdue shown verbatim, unsupported areas say "Could not verify", no research means no invented news', async () => {
  const { reader } = await build(); const b = await buildBriefing({ reader, now: new Date('2026-11-01T02:30:00Z') });
  assert.equal(b.sections.length, SECTION_DEFS.length); const get = (id) => b.sections.find((s) => s.id === id);
  assert.equal(get('overdue').status, 'Verified'); assert.match(get('overdue').items[0].text, /INV-KE-270031 · Sharma Constructions · due 2026-10-05 · 27 days overdue · balance ₹64944.84/);
  for (const id of ['headlines', 'markets', 'schemes', 'materials', 'customers', 'projects', 'inventory', 'leads']) assert.equal(get(id).status, 'Could not verify', id);
  assert.ok(get('headlines').reason.includes('No research source')); assert.equal(get('actions').items.length, 1); assert.match(b.headline, /1 overdue invoice/);
});
test('briefing research: claims without a source link and date are dropped; uncertain ones are labelled', async () => {
  const { reader } = await build();
  const research = { fetch: async (t) => (t.includes('Sensex') ? [{ claim: 'Sensex closed up', value: '1', unit: 'point', sourceUrl: 'https://example.org/a', checkedOn: '2026-11-01', confidence: 'high' }, { claim: 'Gold is rising', sourceUrl: '', checkedOn: '2026-11-01' }] : t.includes('headlines') ? [{ claim: 'x', sourceUrl: 'https://e.org', checkedOn: '2026-11-01', confidence: 'low' }] : (() => { throw new Error('timeout'); })()) };
  const b = await buildBriefing({ reader, research, now: new Date('2026-11-01T02:30:00Z') }); const get = (id) => b.sections.find((s) => s.id === id);
  assert.equal(get('markets').status, 'Partial'); assert.equal(get('markets').items.length, 1); assert.equal(get('headlines').status, 'Uncertain'); assert.equal(get('schemes').status, 'Could not verify'); assert.match(get('schemes').reason, /timeout/);
  assert.ok(b.unverified.length > 0);
});
test('briefing survives Zoho being down and says exactly what it could not verify', async () => {
  const bad = { listInvoices: async () => { throw new Error('Zoho is down'); }, listBills: async () => { throw new Error('Zoho is down'); } };
  const b = await buildBriefing({ reader: bad, now: new Date('2026-11-01T02:30:00Z') }); const o = b.sections.find((s) => s.id === 'overdue');
  assert.equal(o.status, 'Could not verify'); assert.match(o.reason, /Zoho is down/); assert.equal(o.items.length, 0);
});
test('scheduler fires at 8:00 IST, catches up when started late, and does not double-fire', async () => {
  const timers = []; let runs = 0; let now = new Date('2026-11-01T01:00:00Z'); // 06:30 IST
  const s = new BriefingScheduler({ run: async () => { runs++; }, nextAt: (n) => nextRun(n, 8), hour: 8, now: () => now, setTimer: (fn, ms) => { timers.push({ fn, ms }); return {}; }, clearTimer: () => {}, hasToday: () => false });
  s.start(); assert.equal(runs, 0); assert.equal(timers[0].ms, 90 * 60000);
  now = new Date('2026-11-01T02:30:00Z'); await timers[0].fn(); assert.equal(runs, 1); assert.equal(timers.length, 2);
  runs = 0; now = new Date('2026-11-01T06:00:00Z'); const late = new BriefingScheduler({ run: async () => { runs++; }, nextAt: (n) => nextRun(n, 8), hour: 8, now: () => now, setTimer: () => ({}), clearTimer: () => {}, hasToday: () => false }); late.start(); await new Promise((r) => setImmediate(r)); assert.equal(runs, 1);
  runs = 0; const done = new BriefingScheduler({ run: async () => { runs++; }, nextAt: (n) => nextRun(n, 8), hour: 8, now: () => now, setTimer: () => ({}), clearTimer: () => {}, hasToday: () => true }); done.start(); assert.equal(runs, 0);
});
