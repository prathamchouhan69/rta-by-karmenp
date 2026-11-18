#!/usr/bin/env node
// Health monitoring script for KARM OS
// Checks all services and alerts on failures
// Usage: node scripts/health-monitor.mjs [--url=...] [--metrics-token=...] [--alert-webhook=...]

import { spawn } from 'node:child_process';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8787';

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    return { status: response.status, data, ok: response.ok };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkEndpoint(name, url, expectedStatus = 200, validate) {
  try {
    const result = await fetchJson(url);
    if (result.status !== expectedStatus) {
      return { name, ok: false, error: `HTTP ${result.status}`, status: result.status };
    }
    if (validate && !validate(result.data)) {
      return { name, ok: false, error: 'Validation failed', data: result.data };
    }
    return { name, ok: true, status: result.status, data: result.data };
  } catch (error) {
    return { name, ok: false, error: error.message };
  }
}

async function checkDockerContainers() {
  const proc = spawn('docker', ['ps', '--format', '{{.Names}}\t{{.Status}}\t{{.Health}}'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return new Promise((resolve) => {
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', () => {
      const lines = stdout.trim().split('\n').filter(l => l);
      const containers = lines.map(l => {
        const [name, status, health] = l.split('\t');
        return { name, status, health: health || 'none' };
      });
      resolve(containers);
    });
  });
}

async function checkDiskSpace() {
  const proc = spawn('df', ['-h', '/'], { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve) => {
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', () => {
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        resolve({
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parseInt(parts[4]),
          mounted: parts[5]
        });
      }
      resolve(null);
    });
  });
}

async function checkMemory() {
  const proc = spawn('free', ['-h'], { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve) => {
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', () => {
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        resolve({
          total: parts[1],
          used: parts[2],
          free: parts[3],
          available: parts[6]
        });
      }
      resolve(null);
    });
  });
}

async function sendAlert(webhook, message, level = 'warning') {
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, level })
    });
  } catch {}
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = (args.find(a => a.startsWith('--url=')) || '').split('=')[1] || DEFAULT_BASE_URL;
  const metricsToken = (args.find(a => a.startsWith('--metrics-token=')) || '').split('=')[1] || process.env.METRICS_TOKEN;
  const alertWebhook = (args.find(a => a.startsWith('--alert-webhook=')) || '').split('=')[1] || process.env.ALERT_WEBHOOK;
  const verbose = args.includes('--verbose');

  console.log(`Health Check: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const checks = [];

  // Gateway health
  checks.push(await checkEndpoint('gateway liveness', `${baseUrl}/healthz`, 200, d => d?.ok === true));
  checks.push(await checkEndpoint('gateway readiness', `${baseUrl}/readyz`, 200, d => d?.ok === true));
  checks.push(await checkEndpoint('proxy health', `${baseUrl}/api/v1/health`, 200, d => d?.ok === true && d?.data?.mode === 'mock'));
  checks.push(await checkEndpoint('flux health', `${baseUrl}/flux/health`, 200, d => d?.ok === true));

  // Metrics endpoint (if token provided)
  if (metricsToken) {
    checks.push(await checkEndpoint('prometheus metrics', `${baseUrl}/metrics`, 200, 
      d => typeof d === 'string' && d.includes('karm_gateway_requests_total')));
  }

  // Docker containers
  let containers = [];
  try {
    containers = await checkDockerContainers();
    for (const c of containers) {
      const healthy = c.health === 'healthy' || c.health === 'none' || c.status.startsWith('Up');
      checks.push({
        name: `docker:${c.name}`,
        ok: healthy,
        status: c.status,
        health: c.health,
        error: healthy ? undefined : `Container unhealthy: ${c.status} / ${c.health}`
      });
    }
  } catch {
    checks.push({ name: 'docker', ok: false, error: 'Docker not accessible' });
  }

  // Disk space
  const disk = await checkDiskSpace();
  if (disk) {
    checks.push({
      name: 'disk space',
      ok: disk.usePercent < 85,
      status: `${disk.usePercent}% used`,
      error: disk.usePercent >= 85 ? `Disk usage critical: ${disk.usePercent}%` : undefined,
      data: disk
    });
  }

  // Memory
  const memory = await checkMemory();
  if (memory) {
    checks.push({ name: 'memory', ok: true, data: memory });
  }

  // Summary
  const failed = checks.filter(c => !c.ok);
  const passed = checks.filter(c => c.ok);

  console.log(`\nResults: ${passed.length} passed, ${failed.length} failed`);
  console.log('-'.repeat(60));

  for (const check of checks) {
    const icon = check.ok ? '✅' : '❌';
    const detail = check.error ? ` - ${check.error}` : check.status ? ` (${check.status})` : '';
    console.log(`${icon} ${check.name}${detail}`);
    if (verbose && check.data) {
      console.log(`    ${JSON.stringify(check.data)}`);
    }
  }

  // Alert on failures
  if (failed.length > 0) {
    const msg = `⚠️ KARM OS Health Check Failed: ${failed.length} checks failing\n` +
      failed.map(f => `• ${f.name}: ${f.error}`).join('\n');
    await sendAlert(alertWebhook, msg, 'critical');
    console.log('\n🔔 Alert sent');
    process.exit(1);
  } else {
    console.log('\n✅ All checks passed');
    if (alertWebhook && args.includes('--alert-on-success')) {
      await sendAlert(alertWebhook, '✅ KARM OS Health Check: All systems operational', 'info');
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});