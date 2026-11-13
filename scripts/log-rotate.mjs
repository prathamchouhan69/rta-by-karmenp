#!/usr/bin/env node
// Log rotation and cleanup script for KARM OS
// Rotates application logs, Docker logs, and cleans old files
// Usage: node scripts/log-rotate.mjs [--max-size=100M] [--max-age=30] [--dry-run]

import { readdir, stat, writeFile, unlink, mkdir } from 'node:fs/promises';
import { resolve, join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const LOG_DIRS = [
  resolve(PROJECT_ROOT, 'logs'),
  '/var/log/karm-os',
  '/var/log/containers',
];

function parseSize(str) {
  const match = str.match(/^(\d+)([KMGT]?)$/i);
  if (!match) return 100 * 1024 * 1024; // 100MB default
  const size = parseInt(match[1]);
  const unit = (match[2] || '').toUpperCase();
  const multipliers = { K: 1024, M: 1024**2, G: 1024**3, T: 1024**4 };
  return size * (multipliers[unit] || 1);
}

async function rotateFile(filePath, maxSize, maxAge, dryRun) {
  const stats = await stat(filePath);
  const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
  
  if (stats.size < maxSize && ageDays < maxAge) {
    return { rotated: false, reason: 'within limits' };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = resolve(filePath, '..');
  const base = basename(filePath, extname(filePath));
  const rotatedName = `${base}.${timestamp}${extname(filePath)}`;
  const rotatedPath = join(dir, rotatedName);

  if (dryRun) {
    return { rotated: true, from: filePath, to: rotatedPath, size: stats.size, ageDays: Math.round(ageDays) };
  }

  // Compress and move
  await pipeline(
    createReadStream(filePath),
    createGzip({ level: 6 }),
    createWriteStream(`${rotatedPath}.gz`)
  );

  // Truncate original
  await writeFile(filePath, '');
  
  return { rotated: true, from: filePath, to: `${rotatedPath}.gz`, size: stats.size, ageDays: Math.round(ageDays) };
}

async function cleanOldLogs(dir, maxAge, dryRun) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let cleaned = 0;
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.gz') || entry.name.match(/\.\d{4}-\d{2}-\d{2}T/))) {
        const filePath = join(dir, entry.name);
        const stats = await stat(filePath);
        const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        if (ageDays > maxAge) {
          if (!dryRun) await unlink(filePath);
          cleaned++;
        }
      }
    }
    return cleaned;
  } catch {
    return 0;
  }
}

async function rotateDockerLogs(maxSize, maxAge, dryRun) {
  // Docker has its own log rotation via daemon.json, but we can clean old container logs
  const proc = await import('node:child_process').then(m => m.spawn('docker', ['ps', '-a', '--format', '{{.ID}}'], { stdio: ['ignore', 'pipe', 'pipe'] }));
  return new Promise((resolve) => {
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', () => {
      resolve(stdout.trim().split('\n').filter(Boolean));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const maxSize = parseSize((args.find(a => a.startsWith('--max-size=')) || '').split('=')[1] || '100M');
  const maxAge = parseInt((args.find(a => a.startsWith('--max-age=')) || '').split('=')[1] || '30');
  const dryRun = args.includes('--dry-run');

  console.log(`Log Rotation: ${new Date().toISOString()}`);
  console.log(`Max size: ${maxSize} bytes, Max age: ${maxAge} days${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('='.repeat(60));

  let totalRotated = 0;
  let totalCleaned = 0;

  // Ensure log directories exist
  for (const dir of LOG_DIRS) {
    await mkdir(dir, { recursive: true }).catch(() => {});
  }

  // Rotate application logs
  for (const dir of LOG_DIRS) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.log') || entry.name.endsWith('.json'))) {
          const filePath = join(dir, entry.name);
          const result = await rotateFile(filePath, maxSize, maxAge, dryRun);
          if (result.rotated) {
            totalRotated++;
            console.log(`  Rotated: ${entry.name} -> ${result.to} (${Math.round(result.size/1024)}KB, ${result.ageDays}d)`);
          }
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  // Clean old rotated logs
  for (const dir of LOG_DIRS) {
    const cleaned = await cleanOldLogs(dir, maxAge, dryRun);
    if (cleaned > 0) {
      totalCleaned += cleaned;
      console.log(`  Cleaned ${cleaned} old log files from ${dir}`);
    }
  }

  // Docker log paths
  const dockerLogPath = '/var/lib/docker/containers';
  try {
    const entries = await readdir(dockerLogPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const logFile = join(dockerLogPath, entry.name, `${entry.name}-json.log`);
        try {
          const result = await rotateFile(logFile, maxSize, maxAge, dryRun);
          if (result.rotated) {
            totalRotated++;
            console.log(`  Rotated Docker log: ${entry.name} (${Math.round(result.size/1024)}KB)`);
          }
        } catch {}
      }
    }
  } catch {}

  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${totalRotated} files rotated, ${totalCleaned} old files cleaned`);
  if (dryRun) console.log('(DRY RUN - no changes made)');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});