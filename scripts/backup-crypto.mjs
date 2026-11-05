import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { open, stat, unlink } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

const MAGIC = Buffer.from('KARM1');
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const HEADER_LENGTH = MAGIC.length + SALT_LENGTH + IV_LENGTH;

function keyFor(salt) {
  const passphrase = process.env.BACKUP_ENCRYPTION_KEY || '';
  if (passphrase.length < 32) throw new Error('BACKUP_ENCRYPTION_KEY must be at least 32 characters');
  return scryptSync(passphrase, salt, 32);
}

async function encrypt(inputPath, outputPath) {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', keyFor(salt), iv);
  const header = Buffer.concat([MAGIC, salt, iv]);
  const output = createWriteStream(outputPath, { flags: 'wx', mode: 0o600 });
  output.write(header);
  const appendTag = new Transform({
    transform(chunk, _encoding, callback) { callback(null, chunk); },
    flush(callback) { this.push(cipher.getAuthTag()); callback(); },
  });
  try {
    await pipeline(createReadStream(inputPath), cipher, appendTag, output);
  } catch (error) {
    await unlink(outputPath).catch(() => {});
    throw error;
  }
}

async function readAt(file, buffer, position) {
  const { bytesRead } = await file.read(buffer, 0, buffer.length, position);
  if (bytesRead !== buffer.length) throw new Error('Encrypted backup is truncated');
}

async function decrypt(inputPath, outputPath) {
  const size = (await stat(inputPath)).size;
  if (size <= HEADER_LENGTH + TAG_LENGTH) throw new Error('Encrypted backup is truncated');
  const file = await open(inputPath, 'r');
  const header = Buffer.alloc(HEADER_LENGTH);
  const tag = Buffer.alloc(TAG_LENGTH);
  try {
    await readAt(file, header, 0);
    await readAt(file, tag, size - TAG_LENGTH);
  } finally {
    await file.close();
  }
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Encrypted backup format is not supported');

  const saltStart = MAGIC.length;
  const ivStart = saltStart + SALT_LENGTH;
  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyFor(header.subarray(saltStart, ivStart)),
    header.subarray(ivStart),
  );
  decipher.setAuthTag(tag);
  const output = createWriteStream(outputPath, { flags: 'wx', mode: 0o600 });
  try {
    await pipeline(
      createReadStream(inputPath, { start: HEADER_LENGTH, end: size - TAG_LENGTH - 1 }),
      decipher,
      output,
    );
  } catch (error) {
    await unlink(outputPath).catch(() => {});
    throw new Error('Encrypted backup authentication failed');
  }
}

async function main() {
  const [, , operation, input, output] = process.argv;
  if (!['encrypt', 'decrypt'].includes(operation) || !input || !output || resolve(input) === resolve(output)) {
    throw new Error('Usage: node backup-crypto.mjs <encrypt|decrypt> INPUT OUTPUT');
  }
  await (operation === 'encrypt' ? encrypt(input, output) : decrypt(input, output));
  console.log(`${operation}ed ${basename(input)}`);
}

main().catch((error) => {
  console.error(`Backup encryption failed: ${error.message}`);
  process.exitCode = 1;
});
