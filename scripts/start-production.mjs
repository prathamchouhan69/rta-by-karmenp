import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { startGateway } from '../apps/gateway/src/server.mjs';

const uiHost = '127.0.0.1';
const uiPort = process.env.FLUX_UI_PORT || '3000';
const fluxPort = process.env.FLUX_PORT || '8788';
const uiDir = fileURLToPath(new URL('../apps/flux-ui', import.meta.url));
const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));

process.env.FLUX_PORT ||= fluxPort;
process.env.FLUX_BIND_HOST ||= '127.0.0.1';
process.env.FLUX_UI_URL ||= `http://127.0.0.1:${uiPort}`;

if (process.env.NODE_ENV === 'production' && String(process.env.FLUX_OWNER_PASSWORD || '').length < 12) {
  console.error('FLUX_OWNER_PASSWORD must be at least 12 characters so the Flux interface can sign in.');
  process.exit(1);
}

let ui = null;
let gateway = null;
let stopping = false;

function startUi() {
  ui = spawn(process.execPath, [nextBin, 'start', '-H', uiHost, '-p', uiPort], {
    cwd: uiDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      FLUX_API_URL: process.env.FLUX_API_URL || `http://127.0.0.1:${fluxPort}`,
    },
    stdio: 'inherit',
  });
  ui.once('error', (error) => {
    if (stopping) return;
    console.error(`flux-ui failed to start: ${error.message}`);
    void stop(1);
  });
  ui.once('exit', (code) => {
    if (stopping) return;
    console.error(`flux-ui exited unexpectedly with code ${code ?? 'unknown'}`);
    void stop(1);
  });
}

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (gateway) await gateway.close().catch(() => {});
  if (ui && ui.exitCode === null && !ui.killed) ui.kill('SIGTERM');
  await delay(100);
  process.exit(code);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    console.log(`Received ${signal}; shutting down KARM`);
    void stop(0);
  });
}

async function waitForUi() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`http://${uiHost}:${uiPort}/login`, { signal: AbortSignal.timeout(1_000) });
      if (response.status < 500) return;
    } catch {
      // Next.js is still starting.
    }
    await delay(500);
  }
  throw new Error(`flux-ui did not become ready on ${uiHost}:${uiPort}`);
}

try {
  // Start Flux first so the interface's server-side session check has a live
  // backend while the login page is being rendered.
  gateway = await startGateway();
  startUi();
  await waitForUi();
} catch (error) {
  console.error(`KARM production start failed: ${error.message}`);
  await stop(1);
}
