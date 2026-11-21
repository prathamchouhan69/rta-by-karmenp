import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

console.log('Starting dev environment for Money Law audit...');
const child = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  detached: true
});

await sleep(5000);

try {
  // Test M2: GET /api/v1/invoices
  console.log('\n--- M2: Fetch Invoices List ---');
  const resList = await fetch('http://127.0.0.1:8787/api/v1/invoices');
  const listJson = await resList.json();
  console.log('Status:', resList.status);
  console.log('Sample invoice fields:');
  const sample = listJson.data?.invoices?.[0] || listJson.invoices?.[0] || listJson;
  console.log(JSON.stringify(sample, null, 2));

  // Test M3: Golden invoice INV-KE-270031
  console.log('\n--- M3: Golden Invoice INV-KE-270031 ---');
  const invoices = Array.isArray(listJson.data) ? listJson.data : (listJson.data?.invoices || listJson.invoices || []);
  const golden = invoices.find(i => i.invoice_number === 'INV-KE-270031') || invoices[0];
  console.log('Golden invoice found in list:', JSON.stringify(golden, null, 2));

  const resDetail = await fetch('http://127.0.0.1:8787/api/v1/invoices/inv-golden');
  console.log('Detail status:', resDetail.status);
  const detailJson = await resDetail.json();
  console.log('Golden invoice detail:', JSON.stringify(detailJson, null, 2));

  // Test M6: POST containing calculated fields (total, balance) rejected with 422
  console.log('\n--- M6: POST with calculated field (total) ---');
  const postRes = await fetch('http://127.0.0.1:8787/api/v1/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': 'test-idemp-key-audit-001'
    },
    body: JSON.stringify({
      customer_id: 'cust-1',
      total: '64944.84', // Should be rejected by KARM Money Law
      line_items: [{ item_id: 'item-1', rate: '100.00', quantity: '2' }]
    })
  });
  console.log('POST status:', postRes.status);
  const postJson = await postRes.json();
  console.log('POST response:', JSON.stringify(postJson, null, 2));

  // Test M6 without Idempotency-Key
  console.log('\n--- P4: POST without Idempotency-Key ---');
  const noKeyRes = await fetch('http://127.0.0.1:8787/api/v1/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: 'cust-1',
      line_items: [{ item_id: 'item-1', rate: '100.00', quantity: '2' }]
    })
  });
  console.log('No-key POST status:', noKeyRes.status);
  const noKeyJson = await noKeyRes.json();
  console.log('No-key response:', JSON.stringify(noKeyJson, null, 2));

} catch (err) {
  console.error('Test error:', err);
} finally {
  try {
    process.kill(-child.pid);
  } catch (e) {
    child.kill();
  }
}
