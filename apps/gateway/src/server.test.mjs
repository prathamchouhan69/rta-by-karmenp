import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { startGateway } from './server.mjs';

const freePort = async () => {
  const probe = createServer();
  await new Promise((resolveListen, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolveListen);
  });
  const { port } = probe.address();
  await new Promise((resolveClose) => probe.close(resolveClose));
  return port;
};

let directory;
let gateway;
let base;
let token;

const call = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* text response */ }
  return { status: response.status, headers: response.headers, text, body: parsed };
};

const auth = () => ({ authorization: `Bearer ${token}` });

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'karm-gateway-test-'));
  const web = join(directory, 'web');
  await writeFile(join(directory, 'placeholder'), 'x');
  await import('node:fs/promises').then(({ mkdir }) => mkdir(web, { recursive: true }));
  await writeFile(join(web, 'index.html'), '<!doctype html><title>KARM test</title>');

  process.env.NODE_ENV = 'test';
  process.env.HOST = '127.0.0.1';
  process.env.PORT = String(await freePort());
  process.env.ZOHO_MODE = 'mock';
  process.env.DATA_DIR = join(directory, 'proxy-data');
  process.env.FLUX_DATA_DIR = join(directory, 'flux-data');
  process.env.STATIC_ROOT = web;
  process.env.SETUP_CODE = 'test-owner-code-12345';
  process.env.SESSION_SECRET = 's'.repeat(48);
  process.env.FLUX_AUTH_SECRET = 'a'.repeat(48);
  process.env.FLUX_APPROVAL_SECRET = 'b'.repeat(48);
  process.env.FLUX_AUDIT_KEY = 'c'.repeat(48);
  process.env.FLUX_OWNER_ID = 'owner';
  process.env.FLUX_OWNER_NAME = 'Test Owner';
  process.env.FLUX_BRIEFING_ENABLED = 'false';
  process.env.METRICS_TOKEN = 'metrics-test-token';
  process.env.TRUST_PROXY = 'false';
  for (const name of [
    'DATABASE_URL', 'APP_ORIGIN', 'ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN',
    'ZOHO_ORG_ID', 'ZOHO_READ_CLIENT_ID', 'ZOHO_READ_CLIENT_SECRET', 'ZOHO_READ_REFRESH_TOKEN',
    'ZOHO_WRITE_CLIENT_ID', 'ZOHO_WRITE_CLIENT_SECRET', 'ZOHO_WRITE_REFRESH_TOKEN',
    'OPENROUTER_API_KEY', 'OMNIROUTE_API_KEY', 'OMNIROUTE_BASE_URL', 'FLUX_ALLOWED_ORIGINS',
  ]) delete process.env[name];

  gateway = await startGateway({ env: process.env, logger: { log: () => {}, error: () => {} } });
  const { port } = gateway.server.address();
  base = `http://127.0.0.1:${port}`;
  const login = await call('/api/v1/auth/session', { method: 'POST', body: { setup_code: process.env.SETUP_CODE } });
  assert.equal(login.status, 200);
  token = login.body.data.access_token;
});

after(async () => {
  if (gateway) await gateway.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe('KARM production gateway', () => {
  it('serves liveness, readiness, the web app and the proxy API', async () => {
    const health = await call('/healthz');
    assert.equal(health.status, 200);
    assert.equal(health.body.service, 'karm-gateway');

    const ready = await call('/readyz');
    assert.equal(ready.status, 200);
    assert.equal(ready.body.ok, true);

    const proxyHealth = await call('/api/v1/health');
    assert.equal(proxyHealth.status, 200);
    assert.equal(proxyHealth.body.data.service, 'karm-proxy');

    const page = await call('/');
    assert.equal(page.status, 200);
    assert.match(page.text, /KARM test/);
  });

  it('bridges the owner session into real Flux RBAC', async () => {
    const fluxHealth = await call('/flux/health');
    assert.equal(fluxHealth.status, 200);
    assert.equal(fluxHealth.body.service, 'flux');

    const me = await call('/flux/v1/me', { headers: auth() });
    assert.equal(me.status, 200);
    assert.equal(me.body.id, 'owner');
    assert.equal(me.body.role, 'owner');
    assert.ok(me.body.permissions.includes('*'));

    const models = await call('/flux/v1/models', { headers: auth() });
    assert.equal(models.status, 200);
    assert.ok(Array.isArray(models.body.models));

    const anonymous = await call('/flux/v1/me');
    assert.equal(anonymous.status, 401);
  });

  it('reports unified gateway, proxy and Flux status', async () => {
    const status = await call('/api/v1/flux/status', { headers: auth() });
    assert.equal(status.status, 200);
    assert.equal(status.body.data.proxy.mode, 'mock');
    assert.equal(status.body.data.flux.audit.ok, true);
    assert.equal(status.body.data.security.ownerId, 'owner');
    assert.ok(status.body.data.gateway.requests >= 1);

    const denied = await call('/api/v1/flux/status');
    assert.equal(denied.status, 401);
  });

  it('serves the real Flux briefing with a deterministic proxy fallback in practice mode', async () => {
    const briefing = await call('/api/v1/flux/briefing', { headers: auth() });
    assert.equal(briefing.status, 200);
    assert.equal(briefing.body.ok, true);
    assert.equal(briefing.body.data.engine.name, 'karm-proxy');
    assert.equal(briefing.body.data.engine.degraded, true);
    assert.ok(briefing.body.data.counts);
  });

  it('answers measurements deterministically and falls back for chat without a model', async () => {
    const measurement = await call('/api/v1/flux/ask', {
      method: 'POST',
      headers: auth(),
      body: { message: 'Convert 20 MT TMT steel into kg.' },
    });
    assert.equal(measurement.status, 200);
    assert.equal(measurement.body.data.engine.name, 'flux-measurement');
    assert.equal(measurement.body.data.measurement.supported, true);

    const chat = await call('/api/v1/flux/ask', {
      method: 'POST',
      headers: auth(),
      body: { message: 'What needs attention in this workspace?', context: { page: 'home' } },
    });
    assert.equal(chat.status, 200);
    assert.equal(chat.body.data.engine.name, 'deterministic-fallback');
    assert.ok(typeof chat.body.data.answer === 'string' && chat.body.data.answer.length > 10);
  });

  it('protects Prometheus metrics with a token', async () => {
    const denied = await call('/metrics');
    assert.equal(denied.status, 404);

    const allowed = await call('/metrics', { headers: { authorization: 'Bearer metrics-test-token' } });
    assert.equal(allowed.status, 200);
    assert.match(allowed.text, /karm_gateway_requests_total/);
    assert.match(allowed.text, /karm_gateway_request_duration_seconds_count/);
  });
});
