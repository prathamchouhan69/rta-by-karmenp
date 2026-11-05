import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

const derive = (base, label) => createHmac('sha256', base).update(`karm-gateway:${label}`).digest('hex');
const integer = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
};

function validateProductionOrigin(value) {
  let origin;
  try {
    origin = new URL(value);
  } catch {
    throw new Error('Production requires APP_ORIGIN to be an exact public HTTPS origin');
  }
  const hostname = origin.hostname.toLowerCase();
  const reserved = ['.localhost', '.local', '.internal', '.test', '.example', '.invalid', '.onion', '.arpa'];
  const isDnsHostname = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname);
  if (
    origin.protocol !== 'https:' ||
    origin.origin !== value ||
    origin.username ||
    origin.password ||
    origin.port ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    isIP(hostname) ||
    !isDnsHostname ||
    !hostname.includes('.') ||
    hostname === 'localhost' ||
    hostname === 'example.com' ||
    hostname.endsWith('.example.com') ||
    hostname === 'example.net' ||
    hostname.endsWith('.example.net') ||
    hostname === 'example.org' ||
    hostname.endsWith('.example.org') ||
    reserved.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new Error('Production requires APP_ORIGIN to be an exact public HTTPS origin');
  }
}

/**
 * One process needs both backends configured before either module is imported.
 * In development the three Flux secrets are derived from the proxy session secret,
 * so a fresh checkout runs without a second secret file. Production never derives
 * secrets: the container refuses to boot until all three are supplied.
 */
export function prepareEnvironment(env = process.env) {
  const production = env.NODE_ENV === 'production';

  if (!production) {
    const base = env.SESSION_SECRET || env.SETUP_CODE || 'karm-local-development-only';
    const keys = [
      ['FLUX_AUTH_SECRET', 'auth'],
      ['FLUX_APPROVAL_SECRET', 'approval'],
      ['FLUX_AUDIT_KEY', 'audit'],
    ];
    for (const [key, label] of keys) {
      if (!env[key] || env[key].length < 32) env[key] = derive(base, label);
    }
  }

  if (!env.FLUX_DATA_DIR) env.FLUX_DATA_DIR = production ? '/data/flux' : '.data/flux';
  if (!env.FLUX_OWNER_ID) env.FLUX_OWNER_ID = 'owner';
  if (!env.FLUX_OWNER_NAME) env.FLUX_OWNER_NAME = 'Workspace owner';
  if (!env.FLUX_ALLOWED_ORIGINS && env.APP_ORIGIN) env.FLUX_ALLOWED_ORIGINS = env.APP_ORIGIN;
  // Flux is only reachable on loopback behind this gateway, so the gateway may set the client IP.
  env.FLUX_TRUST_PROXY = 'true';
  if (!env.ZOHO_WRITE_ENABLED) env.ZOHO_WRITE_ENABLED = 'false';

  // Flux reads through its own credential slot. In live mode, reuse the proxy's read
  // credentials when dedicated Flux credentials are not supplied; writes are never
  // reused implicitly. Practice mode keeps Flux unconfigured unless asked otherwise.
  if (env.FLUX_ZOHO_READ_FROM_PROXY !== 'false' && env.ZOHO_MODE === 'live') {
    const readPairs = [
      ['ZOHO_READ_CLIENT_ID', 'ZOHO_CLIENT_ID'],
      ['ZOHO_READ_CLIENT_SECRET', 'ZOHO_CLIENT_SECRET'],
      ['ZOHO_READ_REFRESH_TOKEN', 'ZOHO_REFRESH_TOKEN'],
    ];
    for (const [target, source] of readPairs) {
      if (!env[target] && env[source]) env[target] = env[source];
    }
  }

  if (!/^[a-z0-9._-]{3,40}$/.test(env.FLUX_OWNER_ID)) {
    throw new Error('FLUX_OWNER_ID must be 3 to 40 characters: lower-case letters, digits, dot, dash or underscore');
  }
  return env;
}

export function gatewaySettings(env = process.env) {
  const settings = {
    host: env.GATEWAY_HOST || env.HOST || '0.0.0.0',
    port: integer(env.PORT, 8787),
    fluxPort: 0,
    appOrigin: env.APP_ORIGIN || '',
    trustProxy: env.TRUST_PROXY === 'true',
    metricsToken: env.METRICS_TOKEN || '',
    timeoutMs: integer(env.GATEWAY_UPSTREAM_TIMEOUT_MS, 60_000),
    bodyLimit: integer(env.GATEWAY_BODY_LIMIT_BYTES, 2 * 1024 * 1024),
    rateLimitMax: integer(env.GATEWAY_RATE_LIMIT_MAX, 600),
    rateLimitWindowMs: integer(env.GATEWAY_RATE_LIMIT_WINDOW_MS, 60_000),
    rateLimitEnabled: env.GATEWAY_RATE_LIMIT !== 'false',
    logFormat: env.LOG_FORMAT || 'text',
    ownerId: env.FLUX_OWNER_ID,
    ownerName: env.FLUX_OWNER_NAME,
    ownerPassword: env.FLUX_OWNER_PASSWORD || '',
    production: env.NODE_ENV === 'production',
  };
  if (settings.production) validateProductionOrigin(settings.appOrigin);
  if (settings.port < 1 || settings.port > 65_535) throw new Error('PORT must be an integer from 1 to 65535');
  if (settings.rateLimitMax < 0) throw new Error('GATEWAY_RATE_LIMIT_MAX must be zero or greater');
  if (settings.rateLimitWindowMs < 1_000) throw new Error('GATEWAY_RATE_LIMIT_WINDOW_MS must be at least 1000');
  if (settings.bodyLimit < 1_024) throw new Error('GATEWAY_BODY_LIMIT_BYTES must be at least 1024');
  return settings;
}
