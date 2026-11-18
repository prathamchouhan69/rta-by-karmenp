import { startGateway } from '../apps/gateway/src/server.mjs';

process.env.FLUX_PORT ||= '8788';
process.env.FLUX_BIND_HOST ||= '127.0.0.1';

if (process.env.NODE_ENV === 'production' && String(process.env.FLUX_OWNER_PASSWORD || '').length < 12) {
  console.error('FLUX_OWNER_PASSWORD must be at least 12 characters so the Flux owner can sign in.');
  process.exit(1);
}

let gateway = null;
let stopping = false;

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (gateway) await gateway.close().catch(() => {});
  process.exit(code);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    console.log(`Received ${signal}; shutting down KARM`);
    void stop(0);
  });
}

try {
  gateway = await startGateway();
} catch (error) {
  console.error(`KARM production start failed: ${error.message}`);
  await stop(1);
}
