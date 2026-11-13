#!/usr/bin/env node
// Automated backup verification script
// Runs restore rehearsal on latest backup and validates integrity
// Usage: node scripts/verify-backups.mjs [--latest-only] [--retention-days=30]

import { readFile, readdir, stat, access } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const BACKUP_ROOT = resolve(PROJECT_ROOT, 'backups');

async function getDatabaseUrl() {
  try {
    const content = await readFile(resolve(PROJECT_ROOT, '.env.production'), 'utf8');
    for (const line of content.split('\n')) {
      const [key, ...valueParts] = line.split('=');
      if (key?.trim() === 'DATABASE_URL' && valueParts.length) {
        return valueParts.join('=').trim();
      }
    }
  } catch {}
  return process.env.DATABASE_URL;
}

async function getBackups() {
  try {
    const entries = await readdir(BACKUP_ROOT, { withFileTypes: true });
    const backups = [];
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('karm-')) {
        const backupPath = join(BACKUP_ROOT, entry.name);
        const stats = await stat(backupPath);
        const manifestPath = join(backupPath, 'manifest.txt');
        let createdAt = stats.mtime;
        try {
          const manifest = await readFile(manifestPath, 'utf8');
          const match = manifest.match(/created_at=(.+)/);
          if (match) createdAt = new Date(match[1]);
        } catch {}
        backups.push({ name: entry.name, path: backupPath, createdAt, stats });
      }
    }
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

async function verifyBackup(backupPath, dbUrl, encryptionKey) {
  const requiredFiles = ['database.dump.enc', 'app-data.tar.gz.enc', 'manifest.txt', 'SHA256SUMS'];
  
  for (const file of requiredFiles) {
    try {
      await access(join(backupPath, file));
    } catch {
      throw new Error(`Missing required file: ${file}`);
    }
  }

  // Verify checksums
  await runCommand('sha256sum', ['-c', 'SHA256SUMS'], { cwd: backupPath }, 'Checksum verification');

  // Create temporary database for restore
  const restoreDb = `karm_verify_${Date.now()}_${process.pid}`;
  const targetUrl = new URL(dbUrl);
  targetUrl.pathname = `/${restoreDb}`;

  try {
    // Create database
    await runCommand('createdb', ['--maintenance-db', dbUrl, restoreDb], {}, 'Create restore database');

    // Decrypt and restore
    const tempDir = await runCommand('mktemp', ['-d'], {}, 'Create temp directory');
    const tempDirClean = tempDir.trim();

    await runCommand('node', [join(__dirname, 'backup-crypto.mjs'), 'decrypt', 
      join(backupPath, 'database.dump.enc'), join(tempDirClean, 'database.dump')], {}, 'Decrypt database dump');
    
    await runCommand('node', [join(__dirname, 'backup-crypto.mjs'), 'decrypt',
      join(backupPath, 'app-data.tar.gz.enc'), join(tempDirClean, 'app-data.tar.gz')], {}, 'Decrypt app data');

    await runCommand('pg_restore', ['--exit-on-error', '--no-owner', '--no-acl', '--dbname', targetUrl.toString(), 
      join(tempDirClean, 'database.dump')], {}, 'Restore database');

    // Verify tables exist
    const tableCount = await runCommand('psql', [targetUrl.toString(), '--no-psqlrc', '--tuples-only', '--no-align',
      '--set=ON_ERROR_STOP=1', '--command', 
      "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')"], 
      {}, 'Count restored tables');

    if (parseInt(tableCount.trim()) < 1) {
      throw new Error('No application tables found in restored database');
    }

    // Verify app data
    await runCommand('tar', ['-tzf', join(tempDirClean, 'app-data.tar.gz')], {}, 'List app data archive');
    
    await runCommand('mkdir', ['-p', join(tempDirClean, 'app-data')], {}, 'Create app data dir');
    await runCommand('tar', ['-xzf', join(tempDirClean, 'app-data.tar.gz'), '--no-same-owner', '-C', join(tempDirClean, 'app-data')], {}, 'Extract app data');

    const userFile = join(tempDirClean, 'app-data', 'flux', 'users.json');
    try {
      await access(userFile);
    } catch {
      throw new Error('Flux users.json not found in restored app data');
    }

    return { tableCount: parseInt(tableCount.trim()), backupPath };
  } finally {
    // Cleanup
    await runCommand('dropdb', ['--if-exists', '--maintenance-db', dbUrl, restoreDb], {}, 'Drop restore database').catch(() => {});
  }
}

function runCommand(cmd, args, options, description) {
  console.log(`  ${description}...`);
  const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  return new Promise((resolve, reject) => {
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${description} failed: ${stderr.trim() || `exit code ${code}`}`));
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const latestOnly = args.includes('--latest-only');
  const retentionDays = parseInt((args.find(a => a.startsWith('--retention-days=')) || '').split('=')[1] || '30');

  console.log('Backup Verification');
  console.log('='.repeat(60));

  const dbUrl = await getDatabaseUrl();
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL not configured');
    process.exit(1);
  }

  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length < 32) {
    console.error('ERROR: BACKUP_ENCRYPTION_KEY must be set (min 32 chars)');
    process.exit(1);
  }

  const backups = await getBackups();
  if (!backups.length) {
    console.log('No backups found');
    process.exit(0);
  }

  console.log(`Found ${backups.length} backup(s)`);
  
  const toVerify = latestOnly ? [backups[0]] : backups.filter(b => {
    const ageDays = (Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= retentionDays;
  });

  console.log(`Will verify ${toVerify.length} backup(s) within ${retentionDays} days retention\n`);

  let passed = 0, failed = 0;
  
  for (const backup of toVerify) {
    console.log(`Verifying: ${backup.name} (${backup.createdAt.toISOString()})`);
    try {
      const result = await verifyBackup(backup.path, dbUrl, encryptionKey);
      console.log(`  ✅ PASS: ${result.tableCount} tables restored\n`);
      passed++;
    } catch (error) {
      console.error(`  ❌ FAIL: ${error.message}\n`);
      failed++;
    }
  }

  console.log('='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});