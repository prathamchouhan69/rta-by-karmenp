import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { gzipSync } from 'node:zlib';
import { mkdtemp, rm } from 'node:fs/promises';
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
let uiServer;
let gateway;
let base;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'karm-gateway-ui-test-'));
  const uiPort = await freePort();

  uiServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/auth/login') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        res.writeHead(200, {
          'content-type': 'application/json',
          'set-cookie': 'flux_session=test-token; Path=/; HttpOnly; SameSite=Strict',
        });
        res.end(JSON.stringify({
          echo: body,
          host: req.headers.host,
          forwardedHost: req.headers['x-forwarded-host'],
        }));
      });
      return;
    }
    if (req.url === '/gzip') {
      const body = gzipSync('<!doctype html><title>Compressed Flux UI</title>');
      res.writeHead(200, {
        'content-type': 'text/html',
        'content-encoding': 'gzip',
        'content-length': body.length,
      });
      res.end(body);
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html', 'x-ui': 'flux-ui' });
    res.end('<!doctype html><title>Flux UI</title>');
  });
  await new Promise((resolveListen, reject) => {
    uiServer.once('error', reject);
    uiServer.listen(uiPort, '127.0.0.1', resolveListen);
  });

  process.env.NODE_ENV = 'test';
  process.env.HOST = '127.0.0.1';
  process.env.PORT = String(await freePort());
  process.env.ZOHO_MODE = 'mock';
  process.env.DATA_DIR = join(directory, 'proxy-data');
  process.env.FLUX_DATA_DIR = join(directory, 'flux-data');
  process.env.SETUP_CODE = 'test-owner-code-12345';
  process.env.SESSION_SECRET = 's'.repeat(48);
  process.env.FLUX_AUTH_SECRET = 'a'.repeat(48);
  process.env.FLUX_APPROVAL_SECRET = 'b'.repeat(48);
  process.env.FLUX_AUDIT_KEY = 'c'.repeat(48);
  process.env.FLUX_OWNER_ID = 'owner';
  process.env.FLUX_OWNER_NAME = 'Test Owner';
  process.env.FLUX_BRIEFING_ENABLED = 'false';
  process.env.FLUX_UI_URL = `http://127.0.0.1:${uiPort}`;
  process.env.FLUX_PORT = '0';
  for (const name of [
    'DATABASE_URL', 'APP_ORIGIN', 'ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN',
    'ZOHO_ORG_ID', 'ZOHO_READ_CLIENT_ID', 'ZOHO_READ_CLIENT_SECRET', 'ZOHO_READ_REFRESH_TOKEN',
    'ZOHO_WRITE_CLIENT_ID', 'ZOHO_WRITE_CLIENT_SECRET', 'ZOHO_WRITE_REFRESH_TOKEN',
    'OPENROUTER_API_KEY', 'OMNIROUTE_API_KEY', 'OMNIROUTE_BASE_URL', 'FLUX_ALLOWED_ORIGINS',
  ]) delete process.env[name];

  gateway = await startGateway({ env: process.env, logger: { log: () => {}, error: () => {} } });
  base = `http://127.0.0.1:${gateway.server.address().port}`;
});

after(async () => {
  if (gateway) await gateway.close();
  if (uiServer) await new Promise((resolveClose) => uiServer.close(resolveClose));
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe('gateway interface proxy', () => {
  it('serves the Next.js interface and reports it in readiness', async () => {
    const page = await fetch(`${base}/login`);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('x-ui'), 'flux-ui');
    assert.match(await page.text(), /Flux UI/);

    const ready = await fetch(`${base}/readyz`).then((response) => response.json());
    assert.equal(ready.ok, true);
    assert.equal(ready.ui.ok, true);
  });

  it('forwards interface API calls, bodies, host headers and cookies', async () => {
    const body = JSON.stringify({ id: 'owner', password: 'secret' });
    const response = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie') || '', /flux_session=test-token/);
    const data = await response.json();
    assert.equal(data.echo, body);
    assert.equal(data.forwardedHost, new URL(base).host);
  });

  it('strips upstream compression metadata after decoding', async () => {
    const response = await fetch(`${base}/gzip`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-encoding'), null);
    assert.equal(response.headers.get('content-length'), null);
    assert.match(await response.text(), /Compressed Flux UI/);
  });

  it('keeps the proxy API on the gateway instead of the interface', async () => {
    const health = await fetch(`${base}/api/v1/health`).then((response) => response.json());
    assert.equal(health.data.service, 'karm-proxy');
  });
});
