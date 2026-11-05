import http from 'node:http';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { prepareEnvironment, gatewaySettings } from './config.mjs';
import { createAuthBridge, ensureFluxOwner } from './bridge.mjs';
import { createMetrics } from './metrics.mjs';
import { measurementAnswer, mergeBriefing, normalizeFluxAnswer } from './unify.mjs';
import { convertMeasurementText } from '../../proxy/src/measurements.mjs';

const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'host',
]);

const isLoopback = (ip) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);

function cleanHeaders(headers) {
  const output = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && value !== undefined) output[key] = value;
  }
  return output;
}

function bearer(value) {
  const header = String(value || '');
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

async function readBody(req, limit) {
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.toLowerCase().includes('application/json')) {
    const error = new Error('Send a JSON request body');
    error.status = 415;
    error.code = 'UNSUPPORTED_MEDIA_TYPE';
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error('Request body is too large');
      error.status = 413;
      error.code = 'BODY_TOO_LARGE';
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: { code: 'BAD_UPSTREAM_RESPONSE', message: text.slice(0, 300) } };
  }
}

function createIpLimiter({ max, windowMs, enabled }) {
  const buckets = new Map();
  return {
    hit(ip) {
      if (!enabled || max <= 0) return null;
      const now = Date.now();
      const current = buckets.get(ip);
      if (!current || current.resetAt <= now) {
        buckets.set(ip, { count: 1, resetAt: now + windowMs });
        return null;
      }
      if (current.count >= max) return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      current.count += 1;
      if (buckets.size > 5000) {
        for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
      }
      return null;
    },
  };
}

export async function startGateway({ env = process.env, logger = console } = {}) {
  prepareEnvironment(env);
  if (!env.STATIC_ROOT) env.STATIC_ROOT = 'apps/web/dist';
  const settings = gatewaySettings(env);

  const proxyModule = await import('../../proxy/src/server.mjs');
  const proxyApp = proxyModule.app;
  const proxyConfig = proxyModule.serviceBase(env);

  const { loadConfig, describeConfig } = await import('../../flux/src/config.js');
  const { createFlux } = await import('../../flux/src/app.js');
  const { buildRoutes } = await import('../../flux/src/http/routes.js');
  const { createServer: createFluxServer } = await import('../../flux/src/http/server.js');
  const { ROLES } = await import('../../flux/src/security/roles.js');

  const fluxConfig = loadConfig(env);
  const flux = createFlux({ config: fluxConfig });
  const owner = await ensureFluxOwner(flux.users, {
    id: settings.ownerId,
    name: settings.ownerName,
    password: settings.ownerPassword,
  });

  const built = buildRoutes(flux);
  const fluxServer = createFluxServer({
    routes: built.routes,
    authenticate: built.authenticate,
    limiter: flux.limiter,
    allowedOrigins: fluxConfig.allowedOrigins,
    log: (message) => (logger.error || logger.log)?.(message),
  });
  await new Promise((resolveListen, reject) => {
    const onError = (error) => { fluxServer.off('listening', onListening); reject(error); };
    const onListening = () => { fluxServer.off('error', onError); resolveListen(); };
    fluxServer.once('error', onError);
    fluxServer.once('listening', onListening);
    fluxServer.listen(0, '127.0.0.1');
  });
  const fluxPort = fluxServer.address().port;

  const bridge = createAuthBridge({
    setupCode: env.SETUP_CODE,
    sessionSecret: env.SESSION_SECRET,
    authRequired: proxyConfig.auth.required,
    fluxAuthSecret: fluxConfig.authSecret,
    users: flux.users,
    ownerId: settings.ownerId,
  });
  const metrics = createMetrics();
  const limiter = createIpLimiter({
    max: settings.rateLimitMax,
    windowMs: settings.rateLimitWindowMs,
    enabled: settings.rateLimitEnabled,
  });

  const clientIp = (req) => {
    if (settings.trustProxy) {
      const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      if (isIP(forwarded)) return forwarded;
    }
    return req.socket.remoteAddress || 'unknown';
  };

  const sendJson = (res, status, body, headers = {}) => {
    if (res.headersSent) return res.end();
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    });
    res.end(JSON.stringify(body));
  };

  const sendError = (res, status, code, message) => sendJson(res, status, {
    ok: false,
    error: { code, message },
  });

  const proxyFetch = async (pathname, { method = 'GET', headers = {}, body, stream = false, ip = '127.0.0.1' } = {}) => {
    const init = { method, headers: cleanHeaders(headers) };
    if (body !== undefined) {
      init.body = body;
      if (stream) init.duplex = 'half';
    }
    const request = new Request(`http://karm.internal${pathname}`, init);
    return proxyApp.fetch(request, { incoming: { socket: { remoteAddress: ip } } });
  };

  const fluxJson = async (pathname, { method = 'GET', token, body, timeoutMs = settings.timeoutMs } = {}) => {
    const headers = {};
    if (token) headers.authorization = `Bearer ${token}`;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const response = await fetch(`http://127.0.0.1:${fluxPort}${pathname}`, {
      method,
      headers,
      ...(body !== undefined ? { body } : {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 500) }; }
    return { response, status: response.status, data };
  };

  const forwardResponse = (res, response, req) => {
    const headers = cleanHeaders(Object.fromEntries(response.headers));
    const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    if (cookies.length) headers['set-cookie'] = cookies;
    if (res.headersSent) return res.end();
    res.writeHead(response.status, headers);
    if (req.method === 'HEAD' || !response.body) return res.end();
    const stream = Readable.fromWeb(response.body);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
    return undefined;
  };

  const requireProxyAuth = (req, res) => {
    if (!proxyConfig.auth.required) return true;
    if (proxyConfig.auth.verifyToken(bearer(req.headers.authorization))) return true;
    sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'Sign in to use this API');
    return false;
  };

  const readiness = async () => {
    const [proxyResult, fluxResult] = await Promise.allSettled([
      proxyFetch('/api/v1/health', { ip: '127.0.0.1' }).then(async (response) => ({ status: response.status, body: await safeJson(response) })),
      fluxJson('/health'),
    ]);
    const proxy = proxyResult.status === 'fulfilled'
      ? { ok: proxyResult.value.body?.ok === true, status: proxyResult.value.status, mode: proxyResult.value.body?.data?.mode || null }
      : { ok: false, error: proxyResult.reason?.message || 'proxy unavailable' };
    const flux = fluxResult.status === 'fulfilled'
      ? { ok: fluxResult.value.status === 200 && fluxResult.value.data?.ok === true, status: fluxResult.value.status }
      : { ok: false, error: fluxResult.reason?.message || 'flux unavailable' };
    return { ok: proxy.ok && flux.ok, proxy, flux };
  };

  const handleMetrics = (req, res, ip) => {
    if (settings.metricsToken) {
      const url = new URL(req.url || '/', 'http://karm.local');
      const token = bearer(req.headers.authorization) || url.searchParams.get('token') || '';
      if (token !== settings.metricsToken) return sendError(res, 404, 'NOT_FOUND', 'Not found');
    } else if (!isLoopback(ip)) {
      return sendError(res, 404, 'NOT_FOUND', 'Not found');
    }
    if (res.headersSent) return res.end();
    res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4; charset=utf-8', 'cache-control': 'no-store' });
    res.end(metrics.prometheus());
    return undefined;
  };

  const handleStatus = (req, res, ip) => {
    if (req.method !== 'GET') return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use GET for this endpoint');
    if (!requireProxyAuth(req, res)) return undefined;
    return (async () => {
      const proxyHealth = await proxyFetch('/api/v1/health', { ip }).then(async (response) => ({
        status: response.status,
        body: await safeJson(response),
      })).catch((error) => ({ status: 0, body: { ok: false, error: { message: error.message } } }));
      const briefing = flux.briefing.today();
      const data = {
        ok: proxyHealth.body?.ok === true,
        data: {
          gateway: metrics.snapshot(),
          proxy: {
            ok: proxyHealth.body?.ok === true,
            status: proxyHealth.status,
            ...(proxyHealth.body?.data || {}),
          },
          flux: {
            ok: true,
            config: describeConfig(fluxConfig),
            users: flux.users.list(),
            models: flux.registry.all().length,
            providers: flux.router.enabledProviders,
            audit: flux.audit.verify(),
            usage: flux.usage.today(),
            briefing: briefing ? {
              date: briefing.date,
              status: briefing.status,
              unverified: Array.isArray(briefing.unverified) ? briefing.unverified.length : 0,
            } : null,
          },
          security: {
            authRequired: proxyConfig.auth.required,
            authMode: proxyConfig.auth.required ? 'setup-code JWT → Flux RBAC bridge' : 'local development (no auth)',
            ownerId: owner.id,
            roles: ROLES,
          },
        },
      };
      sendJson(res, 200, data);
      return undefined;
    })();
  };

  const handleBriefing = (req, res, ip) => {
    if (req.method !== 'GET') return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use GET for this endpoint');
    if (!requireProxyAuth(req, res)) return undefined;
    return (async () => {
      const proxyHeaders = req.headers.authorization ? { authorization: req.headers.authorization } : {};
      const proxyResponse = await proxyFetch('/api/v1/flux/briefing', { headers: proxyHeaders, ip });
      const proxyData = await safeJson(proxyResponse);
      if (!proxyResponse.ok || !proxyData.ok) {
        return sendJson(res, proxyResponse.status, proxyData);
      }

      let fluxBriefing = null;
      let reason = '';
      if (!fluxConfig.zoho.readConfigured) {
        reason = 'Flux Zoho read credentials are not configured.';
      } else {
        const token = bridge.resolve(req.headers.authorization)?.token;
        try {
          let today = await fluxJson('/v1/briefing/today', { token });
          if (today.status === 404) {
            await fluxJson('/v1/briefing/run', { method: 'POST', token, body: '{}' });
            today = await fluxJson('/v1/briefing/today', { token });
          }
          if (today.status === 200 && Array.isArray(today.data?.sections)) fluxBriefing = today.data;
          else reason = today.data?.error?.message || `Flux briefing returned HTTP ${today.status}.`;
        } catch (error) {
          reason = `Flux briefing failed: ${error.message}`;
        }
      }

      const merged = mergeBriefing({
        proxy: proxyData.data,
        flux: fluxBriefing,
        modelConfigured: flux.router.enabledProviders.length > 0,
      });
      if (!fluxBriefing && merged.engine) merged.engine.reason = reason || merged.engine.reason;
      return sendJson(res, 200, { ok: true, data: merged });
    })();
  };

  const handleAsk = (req, res, ip) => {
    if (req.method !== 'POST') return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use POST for this endpoint');
    if (!requireProxyAuth(req, res)) return undefined;
    return (async () => {
      const raw = await readBody(req, settings.bodyLimit);
      let body;
      try { body = JSON.parse(raw.toString('utf8')); } catch {
        return sendError(res, 400, 'INVALID_JSON', 'Request body must be valid JSON');
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return sendError(res, 422, 'INVALID_BODY', 'Request body must be a JSON object');
      }
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (message.length < 2 || message.length > 500) {
        return sendError(res, 422, 'INVALID_MESSAGE', 'message must contain 2 to 500 characters');
      }
      const context = body.context && typeof body.context === 'object' ? body.context : null;

      const measurement = convertMeasurementText(message);
      if (measurement) return sendJson(res, 200, { ok: true, data: measurementAnswer(measurement) });

      let reason = '';
      if (!flux.router.enabledProviders.length) {
        reason = 'No Flux model gateway is configured; using the deterministic KARM assistant.';
      } else {
        try {
          const token = bridge.resolve(req.headers.authorization)?.token;
          const fluxBody = JSON.stringify({
            message,
            context: context ? { screen: context.page || context.screen || null, recordId: context.recordId || null } : null,
            deep: Boolean(body.deep),
            verify: Boolean(body.verify),
          });
          const answer = await fluxJson('/v1/chat', { method: 'POST', token, body: fluxBody });
          if (answer.status === 200) {
            const normalized = normalizeFluxAnswer(answer.data, { context });
            if (normalized) return sendJson(res, 200, { ok: true, data: normalized });
          }
          reason = answer.data?.error?.message || `Flux chat returned HTTP ${answer.status}.`;
        } catch (error) {
          reason = `Flux chat failed: ${error.message}`;
        }
      }

      const fallback = await proxyFetch('/api/v1/flux/ask', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        },
        body: raw,
        ip,
      });
      const fallbackData = await safeJson(fallback);
      if (fallback.ok && fallbackData.ok && fallbackData.data) {
        fallbackData.data = {
          ...fallbackData.data,
          engine: { name: 'deterministic-fallback', reason },
        };
        return sendJson(res, fallback.status, fallbackData);
      }
      return sendError(res, 502, 'FLUX_UNAVAILABLE', reason || 'Flux and the deterministic assistant are both unavailable.');
    })();
  };

  const handleFlux = (req, res, url, ip, requestId) => {
    const path = url.pathname.replace(/^\/flux/, '') || '/';
    const publicPath = req.method === 'OPTIONS' || path === '/health' || path === '/v1/auth/login';
    const resolved = bridge.resolve(req.headers.authorization);
    if (!publicPath && !resolved) {
      return sendJson(res, 401, { error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } });
    }

    return (async () => {
      const headers = cleanHeaders(req.headers);
      delete headers.authorization;
      if (resolved?.token) headers.authorization = `Bearer ${resolved.token}`;
      headers['x-forwarded-for'] = ip;
      headers['x-forwarded-proto'] = String(req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http'));
      headers['x-request-id'] = requestId;

      const init = { method: req.method, headers, signal: AbortSignal.timeout(120_000) };
      const hasBody = !['GET', 'HEAD'].includes(req.method)
        && (Number(req.headers['content-length'] || 0) > 0 || Boolean(req.headers['transfer-encoding']));
      if (hasBody) {
        init.body = Readable.toWeb(req);
        init.duplex = 'half';
      }
      const response = await fetch(`http://127.0.0.1:${fluxPort}${path}${url.search}`, init);
      return forwardResponse(res, response, req);
    })().catch((error) => {
      if (res.headersSent) return res.destroy();
      return sendError(res, 502, 'FLUX_UNAVAILABLE', `Flux is unavailable: ${error.message}`);
    });
  };

  const handleProxy = (req, res, url, ip) => {
    const headers = cleanHeaders(req.headers);
    const init = { headers, ip };
    const hasBody = !['GET', 'HEAD'].includes(req.method)
      && (Number(req.headers['content-length'] || 0) > 0 || Boolean(req.headers['transfer-encoding']));
    if (hasBody) {
      init.body = Readable.toWeb(req);
      init.stream = true;
    }
    return (async () => {
      const response = await proxyFetch(`${url.pathname}${url.search}`, { ...init, method: req.method });
      return forwardResponse(res, response, req);
    })().catch((error) => {
      if (res.headersSent) return res.destroy();
      return sendError(res, 502, 'PROXY_UNAVAILABLE', `The KARM API is unavailable: ${error.message}`);
    });
  };

  const gatewayServer = http.createServer((req, res) => {
    const started = Date.now();
    const requestId = String(req.headers['x-request-id'] || randomUUID()).slice(0, 100);
    const url = new URL(req.url || '/', 'http://karm.local');
    const ip = clientIp(req);
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    res.setHeader('x-frame-options', 'DENY');
    res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    if (/^https:\/\//i.test(settings.appOrigin)) {
      res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
    }
    res.once('finish', () => {
      const ms = Date.now() - started;
      metrics.observe({ method: req.method, path: url.pathname, status: res.statusCode, ms });
      if (settings.logFormat === 'json') {
        logger.log?.(JSON.stringify({ time: new Date().toISOString(), id: requestId, method: req.method, path: url.pathname, status: res.statusCode, ms, ip }));
      } else {
        logger.log?.(`[${requestId}] ${req.method} ${url.pathname} ${res.statusCode} ${ms}ms`);
      }
    });

    const run = async () => {
      if (url.pathname === '/healthz') {
        return sendJson(res, 200, { ok: true, service: 'karm-gateway', time: new Date().toISOString() });
      }
      if (url.pathname === '/readyz') {
        const ready = await readiness();
        return sendJson(res, ready.ok ? 200 : 503, ready);
      }
      if (url.pathname === '/metrics') return handleMetrics(req, res, ip);

      const retryAfter = limiter.hit(ip);
      if (retryAfter) {
        res.setHeader('retry-after', String(retryAfter));
        return sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Try again shortly.');
      }

      if (url.pathname === '/api/v1/flux/status') return handleStatus(req, res, ip);
      if (url.pathname === '/api/v1/flux/briefing') return handleBriefing(req, res, ip);
      if (url.pathname === '/api/v1/flux/ask') return handleAsk(req, res, ip);
      if (url.pathname === '/flux' || url.pathname.startsWith('/flux/')) return handleFlux(req, res, url, ip, requestId);
      return handleProxy(req, res, url, ip);
    };

    run().catch((error) => {
      if (res.headersSent) return res.destroy();
      const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 500;
      const code = typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR';
      return sendError(res, status, code, status >= 500 ? 'The gateway could not complete the request' : error.message);
    });
  });

  gatewayServer.requestTimeout = 60_000;
  gatewayServer.headersTimeout = 15_000;
  gatewayServer.keepAliveTimeout = 65_000;
  fluxServer.requestTimeout = 120_000;

  await new Promise((resolveListen, reject) => {
    const onError = (error) => { gatewayServer.off('listening', onListening); reject(error); };
    const onListening = () => { gatewayServer.off('error', onError); resolveListen(); };
    gatewayServer.once('error', onError);
    gatewayServer.once('listening', onListening);
    gatewayServer.listen(settings.port, settings.host);
  });

  flux.startBriefing();
  logger.log?.(`KARM gateway listening on http://${settings.host}:${settings.port} (proxy + Flux on 127.0.0.1:${fluxPort})`);

  const closeServer = (server) => new Promise((resolveClose) => {
    if (!server.listening) return resolveClose();
    server.close(() => resolveClose());
    const timer = setTimeout(() => { server.closeAllConnections?.(); resolveClose(); }, 3_000);
    timer.unref?.();
  });

  const close = async () => {
    flux.stop();
    await closeServer(gatewayServer);
    await closeServer(fluxServer);
    await proxyModule.closeStorage?.();
  };

  return { server: gatewayServer, fluxServer, flux, proxyConfig, fluxConfig, settings, owner, metrics, close, port: settings.port, fluxPort };
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    const gateway = await startGateway();
    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`Received ${signal}; shutting down KARM gateway`);
      await gateway.close();
      process.exit(0);
    };
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { shutdown(signal).catch((error) => { console.error(error); process.exit(1); }); });
  } catch (error) {
    console.error(`KARM gateway failed to start: ${error.message}`);
    process.exit(1);
  }
}
