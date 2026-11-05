import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const helper = new URL('./backup-crypto.mjs', import.meta.url);
const key = 'karm-test-backup-key-0123456789abcdef';

test('backup encryption round-trips data and rejects tampering', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'karm-backup-crypto-'));
  try {
    const source = join(directory, 'source.dump');
    const encrypted = join(directory, 'source.dump.enc');
    const restored = join(directory, 'restored.dump');
    const tampered = join(directory, 'tampered.dump.enc');
    const rejected = join(directory, 'rejected.dump');
    const content = Buffer.from('synthetic backup data; no customer records');
    await writeFile(source, content);

    const encrypt = spawnSync(process.execPath, [helper.pathname, 'encrypt', source, encrypted], {
      env: { ...process.env, BACKUP_ENCRYPTION_KEY: key },
      encoding: 'utf8',
    });
    assert.equal(encrypt.status, 0, encrypt.stderr);
    assert.equal((await readFile(encrypted)).includes(content), false);

    const decrypt = spawnSync(process.execPath, [helper.pathname, 'decrypt', encrypted, restored], {
      env: { ...process.env, BACKUP_ENCRYPTION_KEY: key },
      encoding: 'utf8',
    });
    assert.equal(decrypt.status, 0, decrypt.stderr);
    assert.deepEqual(await readFile(restored), content);

    const altered = await readFile(encrypted);
    altered[altered.length - 1] ^= 1;
    await writeFile(tampered, altered);
    const attack = spawnSync(process.execPath, [helper.pathname, 'decrypt', tampered, rejected], {
      env: { ...process.env, BACKUP_ENCRYPTION_KEY: key },
      encoding: 'utf8',
    });
    assert.notEqual(attack.status, 0);
    await assert.rejects(readFile(rejected), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('backup encryption requires a strong local key', () => {
  const result = spawnSync(process.execPath, [helper.pathname, 'encrypt', '/does-not-need-to-exist', '/tmp/no-backup-output'], {
    env: { ...process.env, BACKUP_ENCRYPTION_KEY: 'short' },
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /at least 32 characters/);
});
