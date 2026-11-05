import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { startMockLLM } from './helpers/mockLLM.js';
import { Store } from '../src/store/store.js';
import { AuditLog } from '../src/audit/auditLog.js';
import { ModelRegistry } from '../src/models/registry.js';
import { Gateway } from '../src/models/gateway.js';
import { CostGuard } from '../src/models/costGuard.js';
import { Usage } from '../src/models/usage.js';
import { ModelRouter } from '../src/models/router.js';

const servers = []; after(() => Promise.all(servers.map((s) => s.close())));
const arch = (img = false) => ({ input_modalities: img ? ['text', 'image'] : ['text'], output_modalities: ['text'] });
const FREE = { prompt: '0', completion: '0' }, PAID = { prompt: '0.000001', completion: '0.000002' };
const LIST = [
  { id: 'v/free-a', pricing: FREE, context_length: 32000, architecture: arch(), supported_parameters: ['response_format', 'reasoning'] },
  { id: 'v/free-b:free', pricing: FREE, context_length: 16000, architecture: arch(), supported_parameters: [] },
  { id: 'v/paid-a', pricing: PAID, context_length: 64000, architecture: arch(), supported_parameters: ['response_format', 'reasoning'] },
  { id: 'v/vision-free', pricing: FREE, context_length: 8000, architecture: arch(true), supported_parameters: [] },
  { id: 'v/old', pricing: FREE, context_length: 8000, architecture: arch(), expiration_date: '2020-01-01' },
  { id: 'v/mystery', context_length: 8000, architecture: arch() },
];
const K = (id) => `openrouter::${id}`;
async function build({ script = {}, cost = 'free-only', cap = null, trust = 'T2' } = {}) {
  const llm = await startMockLLM({ script, models: LIST }); servers.push(llm);
  const store = new Store(), registry = new ModelRegistry(store), audit = new AuditLog({ key: 'k'.repeat(40) }), usage = new Usage(store), guard = new CostGuard({ registry });
  if (trust) registry.setProviderTrust('openrouter', trust);
  const sleeps = [];
  const router = new ModelRouter({ registry, gateways: { openrouter: new Gateway({ name: 'openrouter', base: llm.base, key: 'sk-test-KEY' }), omniroute: new Gateway({ name: 'omniroute', base: '' }) }, usage, guard, audit, config: { costPolicy: cost, freeDailyCap: cap, briefingReserve: 2 }, sleep: async (ms) => { sleeps.push(ms); } });
  await router.sync(); return { router, registry, audit, usage, llm, sleeps };
}
const msg = (c) => [{ role: 'user', content: c }];

test('discovery classifies free, paid, unknown-priced, vision and expiring models from the listing', async () => {
  const { registry } = await build();
  const c = (id) => registry.get(K(id));
  assert.deepEqual([c('v/free-a').costClass, c('v/free-b:free').costClass, c('v/paid-a').costClass, c('v/mystery').costClass], ['free', 'free', 'paid', 'unknown']);
  assert.ok(c('v/vision-free').inputModalities.includes('image')); assert.equal(c('v/old').expiresAt, '2020-01-01');
});
test('free-only: paid and unproven models are never candidates, even when pinned', async () => {
  const { registry } = await build(); registry.setPin('fast', { primary: K('v/paid-a'), fallbacks: [K('v/mystery')] });
  const ids = registry.candidates('fast', { policy: 'free-only', enabledProviders: ['openrouter'], privacy: 'D0' }).map((m) => m.id);
  assert.ok(!ids.includes('v/paid-a') && !ids.includes('v/mystery') && !ids.includes('v/old')); assert.ok(ids.includes('v/free-a'));
});
test('failover: primary fails twice with backoff, a same-class fallback serves, and the badge says so', async () => {
  const { router, registry, sleeps, usage } = await build({ script: { 'v/free-a': [{ status: 500 }], 'v/free-b:free': [{ text: 'from b' }] } });
  registry.setPin('fast', { primary: K('v/free-a'), fallbacks: [K('v/free-b:free')] });
  const r = await router.run({ role: 'fast', messages: msg('hi'), privacy: 'D0' });
  assert.equal(r.text, 'from b'); assert.equal(r.fallbackUsed, true); assert.equal(r.model.costClass, 'free'); assert.equal(sleeps.length, 1);
  assert.equal(usage.today().models[K('v/free-a')].errors, 2); assert.equal(usage.today().models[K('v/free-b:free')].fallbacks, 1);
});
test('a non-retryable error (bad key) skips straight to the fallback without waiting', async () => {
  const { router, registry, sleeps } = await build({ script: { 'v/free-a': [{ status: 401 }] } });
  registry.setPin('fast', { primary: K('v/free-a'), fallbacks: [K('v/free-b:free')] });
  assert.equal((await router.run({ role: 'fast', messages: msg('hi'), privacy: 'D0' })).model.requested, 'v/free-b:free'); assert.equal(sleeps.length, 0);
});
test('COST GUARD: a gateway that silently answers with a paid model is blocked, output discarded, alert audited', async () => {
  const sneaky = [{ text: 'PAID SECRET ANSWER', answeredBy: 'v/paid-a' }];
  const { router, audit, usage } = await build({ script: { 'v/free-a': sneaky, 'v/free-b:free': sneaky, 'v/vision-free': sneaky } });
  await assert.rejects(router.run({ role: 'fast', messages: msg('hi'), privacy: 'D0' }), (e) => e.code === 'COST_GUARD' && !e.message.includes('PAID SECRET'));
  assert.ok(audit.rows.some((r) => r.action === 'cost.blocked' && r.data.answeredBy === 'v/paid-a')); assert.ok(usage.today().models[K('v/free-a')].blocked >= 1);
});
test('cost guard: an unknown substitute model is blocked too, but a free neighbour can still serve', async () => {
  const { router, registry } = await build({ script: { 'v/free-a': [{ text: 'x', answeredBy: 'v/never-heard-of' }], 'v/free-b:free': [{ text: 'clean' }] } });
  registry.setPin('fast', { primary: K('v/free-a'), fallbacks: [K('v/free-b:free')] });
  const r = await router.run({ role: 'fast', messages: msg('hi'), privacy: 'D0' }); assert.equal(r.text, 'clean'); assert.ok(r.attempts.some((a) => a.blocked));
});
test('D3 data (PAN, Aadhaar, card) is redacted before any model sees it', async () => {
  const { router, llm } = await build();
  const r = await router.run({ role: 'fast', messages: msg('Customer PAN ABCDE1234F, aadhaar 1234 5678 9012, invoice INV-KE-270031'), privacy: 'D2' });
  const sent = JSON.stringify(llm.calls[0].body); assert.ok(!sent.includes('ABCDE1234F') && !sent.includes('5678 9012')); assert.ok(sent.includes('INV-KE-270031')); assert.ok(r.redactions.includes('PAN'));
});
test('customer data (D2) is refused on an unvetted provider until the owner vets it', async () => {
  const { router, registry } = await build({ trust: null });
  await assert.rejects(router.run({ role: 'fast', messages: msg('hi'), privacy: 'D2' }), /vetted/);
  assert.equal((await router.run({ role: 'fast', messages: msg('market news'), privacy: 'D0' })).text, 'ok');
  registry.setProviderTrust('openrouter', 'T2'); assert.equal((await router.run({ role: 'fast', messages: msg('hi'), privacy: 'D2' })).text, 'ok');
});
test('paid-per-use: a paid model runs only when this call is explicitly approved as paid', async () => {
  const { router, registry, llm } = await build({ cost: 'paid-per-use' }); registry.setPin('fast', { primary: K('v/paid-a'), fallbacks: [] });
  const free = await router.run({ role: 'fast', messages: msg('hi'), privacy: 'D0' }); assert.equal(free.model.costClass, 'free');
  const paid = await router.run({ role: 'fast', messages: msg('hi'), privacy: 'D0', paidApproved: true }); assert.equal(paid.model.requested, 'v/paid-a'); assert.equal(paid.model.costClass, 'paid');
  assert.equal(llm.calls.length, 2);
});
test('expired models are never used; the vision role never falls back to a text-only model', async () => {
  const { router, registry, llm } = await build({ script: { 'v/vision-free': [{ status: 500 }] } });
  registry.setPin('fast', { primary: K('v/old'), fallbacks: [] });
  assert.notEqual((await router.run({ role: 'fast', messages: msg('hi'), privacy: 'D0' })).model.requested, 'v/old');
  await assert.rejects(router.run({ role: 'vision', messages: msg('read this'), privacy: 'D0' }), (e) => e.code === 'ALL_FAILED');
  assert.ok(llm.calls.filter((c) => c.body.model === 'v/vision-free').length >= 1); assert.ok(!llm.calls.slice(-2).some((c) => c.body.model === 'v/free-a'));
});
test('free-request cap holds a reserve back for the briefing', async () => {
  const { router } = await build({ cap: 4 });
  for (let i = 0; i < 2; i++) await router.run({ role: 'fast', messages: msg('q'), privacy: 'D0' });
  await assert.rejects(router.run({ role: 'fast', messages: msg('q'), purpose: 'chat', privacy: 'D0' }), (e) => e.code === 'QUOTA');
  assert.equal((await router.run({ role: 'fast', messages: msg('b'), purpose: 'briefing', privacy: 'D0' })).text, 'ok');
});
test('runJson repairs one bad reply and gives up visibly after that', async () => {
  const { router, registry } = await build({ script: { 'v/free-a': [{ text: 'sorry, not json' }, { text: '```json\n{"a":1}\n```' }], 'v/free-b:free': [{ text: 'nope' }] } });
  registry.setPin('structured', { primary: K('v/free-a'), fallbacks: [] });
  const r = await router.runJson({ role: 'structured', messages: msg('give json'), privacy: 'D0' }, (o) => ('a' in o ? null : 'missing a')); assert.equal(r.data.a, 1);
  registry.setPin('structured', { primary: K('v/free-b:free'), fallbacks: [] });
  await assert.rejects(router.runJson({ role: 'structured', messages: msg('x'), privacy: 'D0' }, () => 'bad'), /did not return a usable answer/);
});
test('the API key is sent only as a server-side header and never lands in audit or usage records', async () => {
  const { router, llm, audit, usage } = await build(); await router.run({ role: 'fast', messages: msg('hi'), privacy: 'D0' });
  assert.equal(llm.calls[0].auth, 'Bearer sk-test-KEY'); assert.ok(!JSON.stringify(audit.rows).includes('sk-test-KEY') && !JSON.stringify(usage.today()).includes('sk-test-KEY'));
});
