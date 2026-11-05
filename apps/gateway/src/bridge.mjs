import { randomBytes } from 'node:crypto';
import { createAuth } from '../../proxy/src/auth.mjs';
import { signToken, verifyToken } from '../../flux/src/security/tokens.js';

const bearer = (value) => {
  const header = String(value || '');
  return header.startsWith('Bearer ') ? header.slice(7) : '';
};

/**
 * The web app signs in once (owner setup code -> proxy JWT). The gateway verifies that
 * JWT and mints a short-lived Flux session for the mapped Flux user, so Flux RBAC,
 * audit attribution and per-user rate limits stay real instead of being bypassed.
 */
export function createAuthBridge({
  setupCode,
  sessionSecret,
  authRequired,
  fluxAuthSecret,
  users,
  ownerId,
  now = () => Date.now(),
  ttlSec = 12 * 3600,
}) {
  const proxyAuth = createAuth({ setupCode, secret: sessionSecret, required: false });
  const owner = () => users.get(ownerId);
  const mint = (user) => signToken(
    { typ: 'session', sub: user.id, role: user.role, ver: user.sessionVersion || 0 },
    fluxAuthSecret,
    ttlSec,
    now(),
  );

  return {
    authRequired,
    owner,
    mintFor: mint,
    resolve(authorizationHeader) {
      const token = bearer(authorizationHeader);
      if (!token) {
        if (authRequired) return null;
        const user = owner();
        return user ? { token: mint(user), user } : null;
      }
      const fluxClaims = verifyToken(token, fluxAuthSecret, 'session', now());
      if (fluxClaims) {
        const user = users.get(fluxClaims.sub);
        if (user && (fluxClaims.ver || 0) === (user.sessionVersion || 0)) return { token, user };
      }
      if (proxyAuth.verifyToken(token)) {
        const user = owner();
        if (user) return { token: mint(user), user };
      }
      return null;
    },
  };
}

export async function ensureFluxOwner(users, { id, name, password = '' }) {
  const existing = users.getRecord(id);
  if (existing) {
    if (!existing.active || existing.role !== 'owner') throw new Error(`Configured Flux owner "${id}" must exist and remain active with the owner role`);
    return users.get(id);
  }
  const secret = password.length >= 12 ? password : randomBytes(24).toString('hex');
  try {
    await users.create({ id, name, role: 'owner', password: secret });
  } catch (error) {
    // A concurrent boot could create the same owner between the read and write.
    if (!/already exists/i.test(error.message)) throw error;
  }
  const created = users.get(id);
  if (!created) throw new Error(`Flux owner "${id}" could not be created`);
  return created;
}
