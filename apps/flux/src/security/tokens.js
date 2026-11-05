import { b64u, hmac, safeEqual, unb64u } from '../util/json.js';

/** Compact signed token: base64url(payload).HMAC. `typ` stops a token minted for one purpose being used for another. */
export function signToken(payload, secret, ttlSec, now = Date.now()) {
  const body = b64u(JSON.stringify({ ...payload, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + ttlSec }));
  return `${body}.${hmac(secret, body)}`;
}
export function verifyToken(token, secret, typ, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 4096) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac || !safeEqual(mac, hmac(secret, body))) return null;
  let p; try { p = JSON.parse(unb64u(body)); } catch { return null; }
  if (p.typ !== typ || !p.exp || p.exp * 1000 <= now) return null;
  return p;
}
