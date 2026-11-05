import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const secureEqual = (left, right) => {
  const a = createHmac('sha256', 'karm-compare').update(left).digest();
  const b = createHmac('sha256', 'karm-compare').update(right).digest();
  return timingSafeEqual(a, b);
};

export function createAuth({ setupCode, secret, required }) {
  if (required && (!setupCode || !secret)) throw new Error('SETUP_CODE and SESSION_SECRET are required when API authentication is enabled');
  if (required && setupCode.length < 16) throw new Error('SETUP_CODE must contain at least 16 characters');
  if (required && setupCode.startsWith('replace-')) throw new Error('Replace the example SETUP_CODE before enabling authentication');
  if (secret && Buffer.byteLength(secret) < 32) throw new Error('SESSION_SECRET must contain at least 32 bytes');
  if (required && secret.startsWith('replace-')) throw new Error('Replace the example SESSION_SECRET before enabling authentication');

  return {
    required,
    authenticateSetupCode(value) {
      return Boolean(setupCode && typeof value === 'string' && secureEqual(value, setupCode));
    },
    issueToken() {
      const now = Math.floor(Date.now() / 1000);
      const header = encode({ alg: 'HS256', typ: 'JWT' });
      const payload = encode({ sub: 'owner', iat: now, exp: now + 60 * 60 * 12, jti: randomBytes(16).toString('hex') });
      const unsigned = `${header}.${payload}`;
      const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
      return { access_token: `${unsigned}.${signature}`, token_type: 'Bearer', expires_in: 43200 };
    },
    verifyToken(token) {
      if (!secret || typeof token !== 'string') return false;
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const [header, payload, signature] = parts;
      const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
      let actual;
      try { actual = Buffer.from(signature, 'base64url'); } catch { return false; }
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
      try {
        const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return claims.sub === 'owner' && Number.isInteger(claims.exp) && claims.exp > Math.floor(Date.now() / 1000);
      } catch {
        return false;
      }
    }
  };
}

export function createLoginLimiter({ maxAttempts = 8, windowMs = 60_000 } = {}) {
  const attempts = new Map();
  const currentFor = (key) => {
    const now = Date.now();
    const previous = attempts.get(key);
    return previous && previous.resetAt > now ? previous : { count: 0, resetAt: now + windowMs };
  };
  const pruneExpired = () => {
    if (attempts.size > 2000) {
      const now = Date.now();
      for (const [candidate, item] of attempts) if (item.resetAt <= now) attempts.delete(candidate);
    }
  };
  return {
    beginAttempt(key) {
      const current = currentFor(key);
      if (current.count >= maxAttempts) return false;
      current.count += 1;
      attempts.set(key, current);
      pruneExpired();
      return true;
    },
    clear(key) {
      attempts.delete(key);
    }
  };
}
