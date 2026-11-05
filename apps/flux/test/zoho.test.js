import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { startMockZoho } from './helpers/mockZoho.js';
import { ZohoTokens } from '../src/zoho/auth.js';
import { ZohoReader } from '../src/zoho/client.js';
import { ZohoWriter, validateDocPayload } from '../src/zoho/writer.js';
import { parseZohoJson } from '../src/zoho/money.js';

const creds = { clientId: 'cid', clientSecret: 'csec', refreshToken: 'rtok' };
const servers = []; after(() => Promise.all(servers.map((s) => s.close())));
const mk = async (opts) => { const z = await startMockZoho(opts); servers.push(z); const tokens = new ZohoTokens({ accountsBase: z.accountsBase, creds }); return { z, reader: new ZohoReader({ apiBase: z.apiBase, orgId: 'ORG1', tokens }), writer: new ZohoWriter({ apiBase: z.apiBase, orgId: 'ORG1', tokens }), tokens }; };

test('money figures stay exactly as Zoho wrote them (verbatim strings, trailing zeros kept)', () => {
  const d = parseZohoJson('{"invoice":{"total":64944.84,"balance":450.00,"rate":62000.0,"quantity":20,"tax_percentage":18,"invoice_number":"INV-KE-270031","note_total_x":5}}');
  assert.deepEqual([d.invoice.total, d.invoice.balance, d.invoice.rate, d.invoice.quantity, d.invoice.tax_percentage], ['64944.84', '450.00', '62000.0', '20', '18']);
  assert.equal(d.invoice.note_total_x, 5);
});
test('reader sends the org id and Zoho auth header, and returns money as strings', async () => {
  const { z, reader } = await mk();
  const r = await reader.listInvoices({ status: 'overdue' });
  assert.equal(r.items[0].invoice_number, 'INV-KE-270031'); assert.equal(r.items[0].total, '64944.84'); assert.equal(typeof r.items[0].balance, 'string');
  const api = z.calls.find((c) => c.path === '/books/v3/invoices');
  assert.equal(api.query.organization_id, 'ORG1'); assert.match(api.auth, /^Zoho-oauthtoken tok/); assert.equal(api.query.status, 'overdue');
  await z.close();
});
test('reader refreshes once on a 401 and retries; token is cached between calls', async () => {
  const { z, reader } = await mk({ failFirstApi: true });
  assert.equal((await reader.listInvoices()).items.length, 3); assert.equal(z.tokenCount, 2);
  await reader.listItems(); assert.equal(z.tokenCount, 2);
  await z.close();
});
test('reader is read-only: only GET requests ever leave it, and it has no write methods', async () => {
  const { z, reader } = await mk();
  await reader.listInvoices(); await reader.getInvoice('9001'); await reader.listContacts({ search: 'sharma' }); await reader.listItems({ search: 'tmt' }); await reader.listBills({});
  assert.ok(z.calls.filter((c) => c.path.startsWith('/books')).every((c) => c.method === 'GET'));
  const names = Object.getOwnPropertyNames(ZohoReader.prototype);
  assert.ok(!names.some((n) => /create|update|delete|send|post|put|pay/i.test(n)), names.join());
  assert.equal((await reader.invoicePdf('9001')).toString().startsWith('%PDF'), true);
  await z.close();
});
test('Zoho errors surface as clear errors without leaking credentials', async () => {
  const { z, reader } = await mk();
  await assert.rejects(reader.getInvoice('nope'), (e) => e.code === 'ZOHO_ERROR' && !/csec|rtok/.test(e.message));
  const bad = new ZohoReader({ apiBase: z.apiBase, orgId: 'WRONG', tokens: new ZohoTokens({ accountsBase: z.accountsBase, creds }) });
  await assert.rejects(bad.listInvoices(), (e) => e.code === 'ZOHO_ERROR' && e.status === 401);
  await z.close();
});
test('writer validation refuses totals, status, send flags, numbers instead of text, and unknown fields', () => {
  const ok = { customer_id: 'c1', line_items: [{ item_id: 'i1', quantity: '20', rate: '62000' }] };
  assert.deepEqual(validateDocPayload('invoice', ok), []);
  for (const bad of [{ ...ok, total: '1' }, { ...ok, status: 'sent' }, { ...ok, send: true }, { ...ok, sub_total: '5' }]) assert.ok(validateDocPayload('invoice', bad).length, JSON.stringify(Object.keys(bad)));
  assert.ok(validateDocPayload('invoice', { customer_id: 'c1', line_items: [{ name: 'x', quantity: 20, rate: '5' }] })[0].includes('written as text'));
  assert.ok(validateDocPayload('invoice', { line_items: [] }).length >= 2); assert.ok(validateDocPayload('purchase_order', { customer_id: 'c1', line_items: [{ name: 'x', quantity: '1', rate: '1' }] }).some((e) => e.includes('vendor_id')));
});
test('writer creates a draft only, returns Zoho figures verbatim, and flags a non-draft result', async () => {
  const { z, writer } = await mk();
  const r = await writer.createDraft('invoice', { customer_id: 'c1', line_items: [{ item_id: 'i1', quantity: '20', rate: '62000' }] });
  assert.deepEqual([r.number, r.status, r.total, r.unexpectedStatus], ['INV-KE-270099', 'draft', '1234567.80', false]);
  const post = z.calls.find((c) => c.method === 'POST' && c.path.endsWith('/invoices')); assert.ok(!('total' in JSON.parse(post.body)));
  assert.deepEqual(Object.getOwnPropertyNames(ZohoWriter.prototype).sort(), ['constructor', 'createDraft']);
  await z.close();
});
