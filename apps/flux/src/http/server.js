import http from 'node:http';
import { randomUUID } from 'node:crypto';

const MAX_BODY = 256 * 1024;
const SECURITY = { 'x-content-type-options': 'nosniff', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'", 'strict-transport-security': 'max-age=31536000', 'x-frame-options': 'DENY' };

export class HttpError extends Error { constructor(status, code, message, extra) { super(message); this.status = status; this.code = code; this.extra = extra; } }

function compile(path) { const keys = []; const re = new RegExp('^' + path.replace(/:([a-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$'); return { re, keys }; }

/** Tiny router: routes are [method, path, handler]. Handlers get ({params, query, body, user, req}) and return data, {raw, type} for files, or {http, body} for a custom status. */
export function createServer({ routes, log = () => {}, allowedOrigins = [], limiter, authenticate }) {
  const table = routes.map(([method, path, handler, opts = {}]) => ({ method, handler, opts, ...compile(path) }));
  return http.createServer(async (req, res) => {
    const id = randomUUID().slice(0, 12); const origin = req.headers.origin;
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = process.env.FLUX_TRUST_PROXY === 'true' && forwarded ? forwarded : (req.socket.remoteAddress || 'x');
    const send = (status, body, extra = {}) => { res.writeHead(status, { ...SECURITY, 'x-request-id': id, 'content-type': 'application/json; charset=utf-8', ...extra }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
    const cors = origin && allowedOrigins.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'access-control-max-age': '600' } : {};
    try {
      if (req.method === 'OPTIONS') { res.writeHead(204, { ...SECURITY, ...cors }); return res.end(); }
      const url = new URL(req.url, 'http://local');
      const g = limiter.hit(`ip:${ip}`, 240, 60000); if (!g.ok) throw new HttpError(429, 'RATE_LIMIT', 'Too many requests. Try again shortly.', { retryAfterSec: g.retryAfterSec });
      let route, m; for (const r of table) { if (r.method !== req.method) continue; m = r.re.exec(url.pathname); if (m) { route = r; break; } }
      if (!route) throw new HttpError(404, 'NOT_FOUND', 'No such endpoint');
      const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      let user = null;
      if (!route.opts.public) { user = await authenticate(req); if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in required'); if (route.opts.permission && !user.can(route.opts.permission)) throw new HttpError(403, 'FORBIDDEN', 'Your role does not allow this'); }
      if (route.opts.limit && user) { const l = limiter.hit(`u:${user.id}:${route.opts.limit.name}`, route.opts.limit.max, route.opts.limit.windowMs); if (!l.ok) throw new HttpError(429, 'RATE_LIMIT', 'Too many requests for this action. Try again shortly.', { retryAfterSec: l.retryAfterSec }); }
      let body = {};
      if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
        let size = 0; const chunks = []; for await (const c of req) { size += c.length; if (size > MAX_BODY) throw new HttpError(413, 'TOO_LARGE', 'Request is too large'); chunks.push(c); }
        if (chunks.length) { // an empty POST (approve, propose) is fine; a body must be JSON
          if (!String(req.headers['content-type'] || '').includes('application/json')) throw new HttpError(415, 'UNSUPPORTED_MEDIA', 'Send JSON with content-type: application/json');
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'BAD_JSON', 'Body is not valid JSON'); }
          if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'BAD_JSON', 'Body must be a JSON object');
        }
      }
      const out = await route.handler({ params, query: Object.fromEntries(url.searchParams), body, user, req, ip });
      if (out && out.raw) return send(200, out.raw, { ...cors, 'content-type': out.type });
      if (out && typeof out === 'object' && Number.isInteger(out.http)) return send(out.http, out.body ?? {}, cors); // opt-in only: a data field called "status" must never become the HTTP code
      return send(200, out ?? {}, cors);
    } catch (e) {
      const status = e.status && e.status < 600 ? e.status : 500;
      if (status >= 500) log(`[${id}] ${e.code || 'ERROR'}: ${e.message}`);
      const extra = e.retryAfterSec || e.extra?.retryAfterSec ? { 'retry-after': String(e.extra?.retryAfterSec ?? e.retryAfterSec) } : {};
      send(status, { error: { code: e.code || 'INTERNAL', message: status >= 500 && !e.code?.startsWith?.('ZOHO') && !e.code?.startsWith?.('NO_') ? 'Something went wrong. Quote request id ' + id + '.' : e.message, ...(e.extra && status < 500 ? { details: e.extra } : {}), requestId: id } }, { ...cors, ...extra });
    }
  });
}
