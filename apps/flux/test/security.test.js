import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentRegistry } from '../src/agents/registry.js';
import { ADVISORS, validateAdvice } from '../src/agents/advisors.js';
import { CORE_TOOLS } from '../src/agents/orchestrator.js';
import { createTools } from '../src/agents/tools.js';
import { ZohoReader } from '../src/zoho/client.js';

test('quality gates pass: no hard-coded models, keys, forbidden names, placeholders; Zoho writes only in the writer', () => {
  const out = execFileSync('node', ['scripts/scan.js'], { encoding: 'utf8' }); assert.match(out, /Scan passed/);
});
test('the scan really catches problems (it is not a rubber stamp)', async () => {
  const { mkdirSync, writeFileSync, rmSync } = await import('node:fs'); const bad = new URL('../src/_scan_probe.js', import.meta.url).pathname;
  writeFileSync(bad, "const m = 'gpt-4';\nconst k = '" + 'sk-' + 'abcdefghijklmnopqrstuvwxyz123456' + "';\n// TODO later\nfetch(u, { method: 'POST' });\n");
  try { assert.throws(() => execFileSync('node', ['scripts/scan.js'], { encoding: 'utf8', stdio: 'pipe' }), (e) => /hard-coded model/.test(e.stderr) && /key-like secret/.test(e.stderr) && /placeholder/.test(e.stderr) && /HTTP write verb/.test(e.stderr)); } finally { rmSync(bad); }
});
test('agent registry refuses agents without a contract, tool allow-list, budget or autonomy level, and refuses L3', () => {
  const r = new AgentRegistry(['ist_now']); const ok = { id: 'good_agent', autonomy: 'L1', tools: ['ist_now'], budget: { maxSteps: 2, maxModelCalls: 1 }, contract: 'Does one clearly described job and nothing else.' };
  assert.ok(r.register(ok));
  for (const [why, bad] of [['no contract', { ...ok, id: 'a_one', contract: '' }], ['no budget', { ...ok, id: 'a_two', budget: undefined }], ['unknown tool', { ...ok, id: 'a_three', tools: ['delete_everything'] }], ['L3', { ...ok, id: 'a_four', autonomy: 'L3' }], ['no autonomy', { ...ok, id: 'a_five', autonomy: undefined }], ['duplicate', ok]]) assert.throws(() => r.register(bad), /rejected|already/, why);
});
test('twelve advisors exist, each with a scope, and an advice object missing any of the seven fields is rejected', () => {
  assert.equal(ADVISORS.length, 12); assert.ok(ADVISORS.every((a) => a.scope.length > 30));
  const good = { keyObservation: 'a', opportunityOrRisk: 'b', recommendedAction: 'c', priority: 'High', expectedImpact: 'd', confidence: 'Low', missingDataOrAssumptions: 'e' };
  assert.equal(validateAdvice(good), null); for (const k of Object.keys(good)) assert.ok(validateAdvice({ ...good, [k]: '' }), k);
  assert.ok(validateAdvice({ ...good, priority: 'Urgent' }));
});
test('no tool the model can reach is able to write, send, approve or pay', () => {
  const disabled = createTools({ reader: {}, hsn: {}, memory: {} });
  assert.ok(!disabled.names.includes('read_public_page'), 'web reading stays disabled without an allowlist');
  const tools = createTools({ reader: {}, hsn: {}, memory: {}, browserReader: async () => ({ source: 'https://trusted.gov.in', text: 'page text' }) });
  const bad = tools.names.filter((n) => /create|update|delete|send|approve|pay|write|post/i.test(n));
  assert.deepEqual(bad, []); assert.ok(CORE_TOOLS.every((n) => tools.names.includes(n)));
  assert.ok(!Object.getOwnPropertyNames(ZohoReader.prototype).some((n) => /create|update|delete|send|pay/i.test(n)));
});
test('real process: starts from environment, creates a user from the script, signs in, serves health, and stops cleanly', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'flux-run-')); const port = 18700 + Math.floor(Math.random() * 200);
  const env = { ...process.env, PORT: String(port), FLUX_DATA_DIR: dir, FLUX_AUTH_SECRET: 'a'.repeat(40), FLUX_APPROVAL_SECRET: 'b'.repeat(40), FLUX_AUDIT_KEY: 'c'.repeat(40), FLUX_BRIEFING_ENABLED: 'false', FLUX_BROWSER_ALLOWED_DOMAINS: '' };
  const add = spawn('node', ['scripts/add-user.js'], { env, stdio: ['pipe', 'pipe', 'pipe'] }); add.stdin.end('smoke.owner\nSmoke Owner\nowner\nsmoke-owner-pass-123\n');
  assert.equal(await new Promise((r) => add.on('close', r)), 0);
  const srv = spawn('node', ['src/server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('server did not start')), 8000); srv.stdout.on('data', (d) => { if (String(d).includes('listening')) { clearTimeout(t); res(); } }); srv.on('exit', () => rej(new Error('server exited early'))); });
    const base = `http://127.0.0.1:${port}`;
    assert.equal((await (await fetch(`${base}/health`)).json()).ok, true);
    const login = await (await fetch(`${base}/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: 'smoke.owner', password: 'smoke-owner-pass-123' }) })).json();
    assert.ok(login.token); const me = await (await fetch(`${base}/v1/me`, { headers: { authorization: `Bearer ${login.token}` } })).json(); assert.equal(me.role, 'owner');
    const v = await (await fetch(`${base}/v1/audit/verify`, { headers: { authorization: `Bearer ${login.token}` } })).json(); assert.equal(v.ok, true); assert.ok(v.count >= 1);
  } finally { srv.kill('SIGTERM'); await new Promise((r) => srv.on('close', r)); }
  const again = spawn('node', ['src/server.js'], { env: { ...env, FLUX_AUDIT_KEY: 'c'.repeat(40) }, stdio: ['ignore', 'pipe', 'pipe'] }); // restart on the same data directory
  try { await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('restart failed')), 8000); again.stdout.on('data', (d) => { if (String(d).includes('listening')) { clearTimeout(t); res(); } }); }); const r = await fetch(`http://127.0.0.1:${port}/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: 'smoke.owner', password: 'smoke-owner-pass-123' }) }); assert.equal(r.status, 200, 'user and audit chain survive a restart'); } finally { again.kill('SIGTERM'); await new Promise((r) => again.on('close', r)); }
});
test('the server refuses to start with weak or missing secrets', () => {
  assert.throws(() => execFileSync('node', ['src/server.js'], { env: { PATH: process.env.PATH, FLUX_DATA_DIR: 'memory' }, encoding: 'utf8', stdio: 'pipe', timeout: 8000 }), (e) => /at least 32 characters/.test(e.stderr));
});
