import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

console.log('Starting npm run dev...');
const child = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  detached: true
});

let output = '';
child.stdout.on('data', (d) => { output += d.toString(); });
child.stderr.on('data', (d) => { output += d.toString(); });

await sleep(20000);

console.log('20 seconds elapsed. Checking status of gateway & mock...');
let gatewayStatus = 'DOWN';
let mockStatus = 'DOWN';

try {
  const gRes = await fetch('http://127.0.0.1:8787/readyz');
  gatewayStatus = `HTTP ${gRes.status}`;
} catch (e) {
  gatewayStatus = `FAILED: ${e.message}`;
}

try {
  const mRes = await fetch('http://127.0.0.1:4010');
  mockStatus = `HTTP ${mRes.status}`;
} catch (e) {
  mockStatus = `FAILED: ${e.message}`;
}

console.log('Gateway status on :8787:', gatewayStatus);
console.log('Mock status on :4010:', mockStatus);

try {
  process.kill(-child.pid);
} catch (e) {
  child.kill();
}

console.log('\n=== Process Output Sample ===\n', output.slice(0, 1000));
