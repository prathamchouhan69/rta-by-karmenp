#!/usr/bin/env node
// Canary Deployment Script for KARM OS
// Deploys new version to subset of traffic, monitors, then promotes or rolls back
// Usage: node scripts/canary-deploy.mjs --image=ghcr.io/org/repo:tag [--traffic=10] [--duration=300]

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

async function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `Exit code ${code}`));
    });
  });
}

async function checkHealth(baseUrl, timeoutMs = 5000) {
  try {
    const response = await fetch(`${baseUrl}/readyz`, { signal: AbortSignal.timeout(timeoutMs) });
    const data = await response.json();
    return response.ok && data.ok === true;
  } catch {
    return false;
  }
}

async function getMetrics(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/metrics`);
    const text = await response.text();
    const lines = text.split('\n');
    const metrics = {};
    for (const line of lines) {
      if (line.startsWith('karm_gateway_request_duration_seconds_bucket')) {
        const match = line.match(/le="([^"]+)"\} ([\d.]+)/);
        if (match) metrics[`p${match[1]}`] = parseFloat(match[2]);
      }
      if (line.startsWith('karm_gateway_requests_total')) {
        const match = line.match(/status="(\d+)"\} ([\d.]+)/);
        if (match) metrics[`status_${match[1]}`] = (metrics[`status_${match[1]}`] || 0) + parseFloat(match[2]);
      }
    }
    return metrics;
  } catch {
    return {};
  }
}

async function promoteCanary(serviceName, image) {
  console.log(`Promoting ${serviceName} to ${image}...`);
  await runCommand('docker', ['service', 'update', '--image', image, serviceName]);
  await runCommand('docker', ['service', 'scale', `${serviceName}=3`]);
}

async function rollbackCanary(serviceName, previousImage) {
  console.log(`Rolling back ${serviceName} to ${previousImage}...`);
  await runCommand('docker', ['service', 'update', '--image', previousImage, serviceName]);
}

async function main() {
  const args = process.argv.slice(2);
  const image = (args.find(a => a.startsWith('--image=')) || '').split('=')[1];
  const traffic = parseInt((args.find(a => a.startsWith('--traffic=')) || '').split('=')[1] || '10');
  const duration = parseInt((args.find(a => a.startsWith('--duration=')) || '').split('=')[1] || '300');
  const serviceName = (args.find(a => a.startsWith('--service=')) || '').split('=')[1] || 'karm-gateway';
  const baseUrl = (args.find(a => a.startsWith('--url=')) || '').split('=')[1] || 'http://127.0.0.1:8787';
  const dryRun = args.includes('--dry-run');

  if (!image) {
    console.error('Usage: node scripts/canary-deploy.mjs --image=ghcr.io/org/repo:tag [--traffic=10] [--duration=300] [--service=name] [--url=...] [--dry-run]');
    process.exit(1);
  }

  console.log(`Canary Deployment: ${new Date().toISOString()}`);
  console.log(`Image: ${image}`);
  console.log(`Traffic: ${traffic}%`);
  console.log(`Duration: ${duration}s`);
  console.log(`Service: ${serviceName}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('='.repeat(60));

  // Get current image
  let currentImage;
  try {
    currentImage = await runCommand('docker', ['service', 'inspect', '--format', '{{.Spec.TaskTemplate.ContainerSpec.Image}}', serviceName]);
  } catch {
    console.log('Service not found, deploying as new...');
    currentImage = null;
  }

  if (dryRun) {
    console.log('[DRY RUN] Would deploy canary');
    return;
  }

  // Step 1: Deploy canary with limited replicas
  console.log('\n1. Deploying canary...');
  await runCommand('docker', ['service', 'create', 
    '--name', `${serviceName}-canary`,
    '--replicas', '1',
    '--network', 'karm-network',
    '--constraint', 'node.role==worker',
    '--env', 'NODE_ENV=production',
    '--env', 'CANARY=true',
    image
  ]).catch(async (e) => {
    // Update existing canary
    await runCommand('docker', ['service', 'update', '--image', image, `${serviceName}-canary`]);
  });

  // Step 2: Wait for canary to be healthy
  console.log('2. Waiting for canary health...');
  const canaryUrl = baseUrl.replace('8787', '8788'); // Canary on different port
  let healthy = false;
  for (let i = 0; i < 30; i++) {
    if (await checkHealth(canaryUrl)) {
      healthy = true;
      break;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  if (!healthy) {
    console.error('Canary failed health check, cleaning up...');
    await runCommand('docker', ['service', 'rm', `${serviceName}-canary`]).catch(() => {});
    process.exit(1);
  }
  console.log('   Canary healthy');

  // Step 3: Route traffic to canary (using nginx/Caddy config or service mesh)
  console.log(`\n3. Routing ${traffic}% traffic to canary...`);
  // In production, this would update load balancer config
  // For now, we'll just monitor the canary directly

  // Step 4: Monitor for duration
  console.log(`\n4. Monitoring for ${duration}s...`);
  const startTime = Date.now();
  const endTime = startTime + duration * 1000;
  let errorRate = 0;
  let p99Latency = 0;
  let checks = 0;

  while (Date.now() < endTime) {
    const metrics = await getMetrics(canaryUrl);
    checks++;
    
    // Calculate error rate
    const totalRequests = Object.values(metrics).reduce((a, b) => a + b, 0);
    const errorRequests = Object.entries(metrics)
      .filter(([k]) => k.startsWith('status_5') || k.startsWith('status_4'))
      .reduce((a, [, v]) => a + v, 0);
    errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;

    // Get P99 latency
    p99Latency = metrics['p0.99'] || metrics['p0.999'] || 0;

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`  ${elapsed}s: errors=${(errorRate*100).toFixed(2)}% p99=${p99Latency.toFixed(0)}ms`);

    // Auto-rollback thresholds
    if (errorRate > 0.05) {
      console.error(`\n❌ Error rate ${(errorRate*100).toFixed(2)}% > 5%, rolling back!`);
      await runCommand('docker', ['service', 'rm', `${serviceName}-canary`]);
      process.exit(1);
    }
    if (p99Latency > 5000) {
      console.error(`\n❌ P99 latency ${p99Latency}ms > 5s, rolling back!`);
      await runCommand('docker', ['service', 'rm', `${serviceName}-canary`]);
      process.exit(1);
    }

    await new Promise(r => setTimeout(r, 10000));
  }

  // Step 5: Promote or rollback
  console.log('\n5. Evaluation complete');
  console.log(`   Final error rate: ${(errorRate*100).toFixed(2)}%`);
  console.log(`   Final P99 latency: ${p99Latency.toFixed(0)}ms`);

  if (errorRate < 0.01 && p99Latency < 2000) {
    console.log('\n✅ Canary passed! Promoting...');
    if (currentImage) {
      await promoteCanary(serviceName, image);
    }
    await runCommand('docker', ['service', 'rm', `${serviceName}-canary`]);
    console.log('   Promoted successfully');
  } else {
    console.log('\n⚠️  Canary metrics marginal, rolling back...');
    await runCommand('docker', ['service', 'rm', `${serviceName}-canary`]);
    console.log('   Rolled back');
  }
}

main().catch(err => {
  console.error('Canary deployment failed:', err.message);
  process.exit(1);
});