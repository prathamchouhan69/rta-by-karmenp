#!/usr/bin/env node
// Load test script for KARM OS
// Usage: node scripts/load-test.mjs [--url=...] [--duration=60] [--rps=10] [--concurrency=5]

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = (args.find(a => a.startsWith('--url=')) || '').split('=')[1] || 'http://127.0.0.1:8787';
  const duration = parseInt((args.find(a => a.startsWith('--duration=')) || '').split('=')[1] || '60');
  const targetRps = parseInt((args.find(a => a.startsWith('--rps=')) || '').split('=')[1] || '10');
  const concurrency = parseInt((args.find(a => a.startsWith('--concurrency=')) || '').split('=')[1] || '5');
  const setupCode = process.env.SETUP_CODE;
  const ownerPassword = process.env.FLUX_OWNER_PASSWORD;

  if (!setupCode || !ownerPassword) {
    console.error('SETUP_CODE and FLUX_OWNER_PASSWORD required in environment');
    process.exit(1);
  }

  console.log(`Load Test: ${new Date().toISOString()}`);
  console.log(`Target: ${baseUrl}`);
  console.log(`Duration: ${duration}s, Target RPS: ${targetRps}, Concurrency: ${concurrency}`);
  console.log('='.repeat(60));

  // Authenticate first
  let authToken = null;
  try {
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setup_code: setupCode }),
    });
    const loginData = await loginRes.json();
    authToken = loginData.data?.access_token;
    if (!authToken) throw new Error('Login failed');
    console.log('✓ Authenticated');
  } catch (error) {
    console.error('Auth failed:', error.message);
    process.exit(1);
  }

  // Test endpoints
  const endpoints = [
    { path: '/healthz', method: 'GET', auth: false },
    { path: '/readyz', method: 'GET', auth: false },
    { path: '/api/v1/health', method: 'GET', auth: true },
    { path: '/flux/health', method: 'GET', auth: true },
    { path: '/api/v1/flux/status', method: 'GET', auth: true },
    { path: '/api/v1/flux/briefing', method: 'GET', auth: true },
    { path: '/api/v1/invoices', method: 'GET', auth: true },
    { path: '/api/v1/tasks', method: 'GET', auth: true },
    { path: '/api/v1/goals', method: 'GET', auth: true },
    { path: '/login', method: 'GET', auth: false },
  ];

  const results = {
    total: 0,
    success: 0,
    errors: 0,
    latencies: [],
    statusCodes: {},
    errorsByType: {},
  };

  const startTime = Date.now();
  const endTime = startTime + duration * 1000;
  const intervalMs = 1000 / targetRps;

  // Worker function
  async function worker(id) {
    while (Date.now() < endTime) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const reqStart = Date.now();
      
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (endpoint.auth && authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers,
          signal: AbortSignal.timeout(10000),
        });
        
        const latency = Date.now() - reqStart;
        results.latencies.push(latency);
        results.total++;
        results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;
        
        if (response.ok) {
          results.success++;
        } else {
          results.errors++;
          const errorKey = `HTTP ${response.status}`;
          results.errorsByType[errorKey] = (results.errorsByType[errorKey] || 0) + 1;
        }
      } catch (error) {
        const latency = Date.now() - reqStart;
        results.latencies.push(latency);
        results.total++;
        results.errors++;
        const errorKey = error.name || error.message;
        results.errorsByType[errorKey] = (results.errorsByType[errorKey] || 0) + 1;
      }
      
      // Rate limiting per worker
      await new Promise(r => setTimeout(r, intervalMs * concurrency));
    }
  }

  // Start workers
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker(i));
  }

  // Progress reporting
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rps = results.total / elapsed;
    console.log(`  ${elapsed.toFixed(0)}s: ${results.total} req, ${results.success} ok, ${results.errors} err, ${rps.toFixed(1)} req/s`);
  }, 5000);

  await Promise.all(workers);
  clearInterval(progressInterval);

  // Calculate percentiles
  const sorted = results.latencies.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
  const p90 = sorted[Math.floor(sorted.length * 0.90)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length || 0;

  console.log('\n' + '='.repeat(60));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log(`Total Requests: ${results.total}`);
  console.log(`Successful: ${results.success} (${((results.success / results.total) * 100).toFixed(1)}%)`);
  console.log(`Errors: ${results.errors} (${((results.errors / results.total) * 100).toFixed(1)}%)`);
  console.log(`Actual RPS: ${(results.total / ((Date.now() - startTime) / 1000)).toFixed(1)}`);
  console.log('\nLatency (ms):');
  console.log(`  Avg: ${avg.toFixed(1)}`);
  console.log(`  P50: ${p50}`);
  console.log(`  P90: ${p90}`);
  console.log(`  P95: ${p95}`);
  console.log(`  P99: ${p99}`);
  console.log('\nStatus Codes:');
  for (const [code, count] of Object.entries(results.statusCodes).sort((a, b) => a[0] - b[0])) {
    console.log(`  ${code}: ${count}`);
  }
  console.log('\nErrors by Type:');
  for (const [type, count] of Object.entries(results.errorsByType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  // Exit code based on error rate
  const errorRate = results.errors / results.total;
  if (errorRate > 0.05) {
    console.log('\n❌ FAIL: Error rate > 5%');
    process.exit(1);
  }
  if (p99 > 5000) {
    console.log('\n⚠️  WARNING: P99 latency > 5s');
  }
  console.log('\n✅ PASS');
}