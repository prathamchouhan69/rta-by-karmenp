import { createHmac, timingSafeEqual } from 'node:crypto';

export function createWriteApprovalToken(secret, operation, fingerprint, idempotencyKey, expiresAt) {
  const payload = Buffer.from(JSON.stringify({ operation, fingerprint, idempotencyKey, expiresAt })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function isValidWriteApproval(secret, token, operation, fingerprint, idempotencyKey, now = Date.now()) {
  if (!secret || typeof token !== 'string') return false;
  const [payload, signature, ...rest] = token.split('.');
  if (!payload || !signature || rest.length) return false;
  const expected = createHmac('sha256', secret).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.operation === operation
      && data.fingerprint === fingerprint
      && data.idempotencyKey === idempotencyKey
      && Number.isInteger(data.expiresAt)
      && data.expiresAt > now;
  } catch {
    return false;
  }
}
