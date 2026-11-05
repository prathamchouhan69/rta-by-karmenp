import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export const canonical = (v) => JSON.stringify(sortKeys(v));
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}
export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const hmac = (key, s) => createHmac('sha256', key).update(s).digest('hex');
export function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
export const b64u = (b) => Buffer.from(b).toString('base64url');
export const unb64u = (s) => Buffer.from(s, 'base64url').toString('utf8');
