#!/usr/bin/env node
// Backup encryption key rotation script
// Re-encrypts all backups with a new key
// Usage: node scripts/rotate-backup-key.mjs --old-key=... --new-key=... [--dry-run]

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const BACKUP_ROOT = resolve(PROJECT_ROOT, 'backups');

function deriveKey(password) {
  return scryptSync(password, 'karm-backup-salt', 32);
}

async function decryptFile(inputPath, outputPath, key) {
  const keyBuffer = deriveKey(key);
  const content = await readFile(inputPath);
  const iv = content.subarray(0, 16);
  const encrypted = content.subarray(16);
  const decipher = createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(encrypted.subarray(-16));
  const decrypted = Buffer.concat([decipher.update(encrypted.subarray(0, -16)), decipher.final()]);
  await writeFile(outputPath, decrypted);
}

async function encryptFile(inputPath, outputPath, key) {
  const keyBuffer = deriveKey(key);
  const content = await readFile(inputPath);
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
  const output = Buffer.concat([iv, encrypted, cipher.getAuthTag()]);
  await writeFile(outputPath, output);
}

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(stderr)));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const oldKey = (args.find(a => a.startsWith('--old-key=')) || '').split('=')[1];
  const newKey = (args.find(a => a.startsWith('--new-key=')) || '').split('=')[1];
  const dryRun = args.includes('--dry-run');

  if (!oldKey || !newKey) {
    console.error('Usage: node scripts/rotate-backup-key.mjs --old-key=OLD --new-key=NEW [--dry-run]');
    process.exit(1);
  }

  if (oldKey.length < 32 || newKey.length < 32) {
    console.error('Keys must be at least 32 characters');
    process.exit(1);
  }

  console.log(`Backup Key Rotation: ${new Date().toISOString()}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('='.repeat(60));

  try {
    const entries = await readdir(BACKUP_ROOT, { withFileTypes: true });
    const backups = entries.filter(e => e.isDirectory() && e.name.startsWith('karm-')).map(e => e.name).sort();

    if (!backups.length) {
      console.log('No backups found');
      return;
    }

    console.log(`Found ${backups.length} backup(s)`);

    for (const backup of backups) {
      const backupPath = join(BACKUP_ROOT, backup);
      const dbEnc = join(backupPath, 'database.dump.enc');
      const appEnc = join(backupPath, 'app-data.tar.gz.enc');
      const manifest = join(backupPath, 'manifest.txt');
      const sums = join(backupPath, 'SHA256SUMS');

      console.log(`\nProcessing: ${backup}`);

      // Check files exist
      for (const f of [dbEnc, appEnc, manifest, sums]) {
        try { await stat(f); } catch { console.log(`  Missing: ${f}`); continue; }
      }

      if (dryRun) {
        console.log('  [DRY RUN] Would re-encrypt database.dump.enc and app-data.tar.gz.enc');
        continue;
      }

      const tempDir = await runCommand('mktemp', ['-d']);
      const tempDirClean = tempDir.trim();

      try {
        // Decrypt with old key
        console.log('  Decrypting database...');
        await decryptFile(dbEnc, join(tempDirClean, 'database.dump'), oldKey);
        console.log('  Decrypting app-data...');
        await decryptFile(appEnc, join(tempDirClean, 'app-data.tar.gz'), oldKey);

        // Encrypt with new key
        console.log('  Encrypting database with new key...');
        await encryptFile(join(tempDirClean, 'database.dump'), join(tempDirClean, 'database.dump.enc.new'), newKey);
        console.log('  Encrypting app-data with new key...');
        await encryptFile(join(tempDirClean, 'app-data.tar.gz'), join(tempDirClean, 'app-data.tar.gz.enc.new'), newKey);

        // Verify new encryption
        await decryptFile(join(tempDirClean, 'database.dump.enc.new'), join(tempDirClean, 'database.dump.verify'), newKey);
        await decryptFile(join(tempDirClean, 'app-data.tar.gz.enc.new'), join(tempDirClean, 'app-data.tar.gz.verify'), newKey);

        // Replace files
        await writeFile(dbEnc, await readFile(join(tempDirClean, 'database.dump.enc.new')));
        await writeFile(appEnc, await readFile(join(tempDirClean, 'app-data.tar.gz.enc.new')));

        // Update SHA256SUMS
        await runCommand('sha256sum', [join(backupPath, 'database.dump.enc'), join(backupPath, 'app-data.tar.gz.enc'), manifest], { cwd: backupPath });

        console.log('  ✓ Rotated successfully');
      } finally {
        await runCommand('rm', ['-rf', tempDirClean]).catch(() => {});
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Key rotation complete');
    console.log('IMPORTANT: Update BACKUP_ENCRYPTION_KEY in .env.production and all backup service configs');
  } catch (error) {
    console.error('Rotation failed:', error.message);
    process.exit(1);
  }
}

main();