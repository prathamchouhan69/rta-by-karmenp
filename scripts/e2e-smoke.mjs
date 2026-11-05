import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dataDirectory = await mkdtemp(join(tmpdir(), 'karm-e2e-'));
const portProbe = createServer();
await new Promise((resolve, reject) => {
  portProbe.once('error', reject);
  portProbe.listen(0, '127.0.0.1', resolve);
});
const { port } = portProbe.address();
await new Promise((resolve, reject) => portProbe.close((error) => error ? reject(error) : resolve()));
const proxyEnvironment = {
  ...process.env,
  PORT: String(port),
  HOST: '127.0.0.1',
  DATA_DIR: dataDirectory,
  ZOHO_MODE: 'mock'
};
for (const name of ['APP_ORIGIN', 'SETUP_CODE', 'SESSION_SECRET', 'ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 'ZOHO_ORG_ID']) {
  delete proxyEnvironment[name];
}
const proxy = spawn(process.execPath, ['apps/proxy/src/server.mjs'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: proxyEnvironment
});
let proxyOutput = '';
proxy.stdout.on('data', (chunk) => { proxyOutput += chunk; });
proxy.stderr.on('data', (chunk) => { proxyOutput += chunk; });

const call = (path, method = 'GET', body, headers = {}) => new Promise((resolve, reject) => {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const req = request({
    hostname: '127.0.0.1', port, path, method,
    headers: { ...(payload === undefined ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }), ...headers }
  }, (res) => {
    let responseBody = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(responseBody) }));
  });
  req.on('error', reject);
  if (payload !== undefined) req.write(payload);
  req.end();
});

const waitForProxy = async () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await call('/api/v1/health');
      if (response.status === 200 && response.body.ok && response.body.data?.mode === 'mock' && !response.body.data.authenticated) return response;
    } catch { /* Wait for the child server to become ready. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`proxy did not start: ${proxyOutput}`);
};

try {
  const health = await waitForProxy();
  const invoices = await call('/api/v1/invoices');
  const taxes = await call('/api/v1/taxes');
  const search = await call('/api/v1/search?q=dilip');
  const computed = await call('/api/v1/invoices', 'POST', { customer_id: 'c1', total: '12.00' }, { 'Idempotency-Key': 'e2e-computed' });
  const firstWrite = await call('/api/v1/invoices', 'POST', { customer_id: 'c1', line_items: [{ item_id: 'i1', quantity: '1', rate: '950.00' }] }, { 'Idempotency-Key': 'e2e-idempotent' });
  const secondWrite = await call('/api/v1/invoices', 'POST', { customer_id: 'c1', line_items: [{ item_id: 'i1', quantity: '1', rate: '950.00' }] }, { 'Idempotency-Key': 'e2e-idempotent' });
  if (health.status !== 200 || health.body.ok !== true) throw new Error('health check failed');
  if (invoices.status !== 200 || invoices.body.data?.[0]?.total_formatted !== '₹64,944.84') throw new Error('golden invoice check failed');
  if (taxes.status !== 200 || taxes.body.data?.[0]?.tax_percentage !== '18.000') throw new Error('tax contract failed');
  if (search.status !== 200 || search.body.data?.contacts?.length !== 1) throw new Error('search contract failed');
  if (computed.status !== 422 || computed.body.error?.code !== 'COMPUTED_FIELD') throw new Error('computed-field rejection failed');
  if (firstWrite.status !== 201 || JSON.stringify(firstWrite.body) !== JSON.stringify(secondWrite.body)) throw new Error('idempotency check failed');
  console.log('E2E smoke PASS: health, golden invoice, computed-field rejection, idempotency');
} finally {
  if (proxy.exitCode === null) {
    await new Promise((resolve) => {
      proxy.once('exit', resolve);
      proxy.kill('SIGTERM');
    });
  }
  await rm(dataDirectory, { recursive: true, force: true });
}
