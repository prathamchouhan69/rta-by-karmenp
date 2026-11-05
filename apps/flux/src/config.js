// Environment-only configuration. Secrets never leave this module except through the objects built from it.
const num = (v, d) => { const n = Number(v); return v != null && v !== '' && Number.isFinite(n) ? n : d; };
const flag = (v, d = false) => (v == null || v === '' ? d : /^(1|true|yes|on)$/i.test(String(v).trim()));
const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
const domainList = (v) => {
  const domains = list(v).map((domain) => domain.toLowerCase());
  const invalid = domains.filter((domain) => !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain));
  if (invalid.length) throw new Error('FLUX_BROWSER_ALLOWED_DOMAINS must contain exact public DNS hostnames (no wildcards, IPs, ports or paths)');
  if (domains.some((domain) => /\.(local|internal|test|example|invalid|localhost|onion|arpa)$/.test(domain) || /(^|\.)example\.(com|net|org)$/.test(domain))) {
    throw new Error('FLUX_BROWSER_ALLOWED_DOMAINS cannot include reserved or local hostnames');
  }
  return [...new Set(domains)];
};

export function loadConfig(env = process.env) {
  const errors = [];
  const secret = (k) => {
    const v = env[k] || '';
    if (v.length < 32) errors.push(`${k} must be set to a random value of at least 32 characters`);
    return v;
  };
  const authSecret = secret('FLUX_AUTH_SECRET');
  const approvalSecret = secret('FLUX_APPROVAL_SECRET');
  const auditKey = secret('FLUX_AUDIT_KEY');
  if (new Set([authSecret, approvalSecret, auditKey]).size < 3) errors.push('FLUX_AUTH_SECRET, FLUX_APPROVAL_SECRET and FLUX_AUDIT_KEY must all be different');

  const dc = env.ZOHO_DC || 'in';
  const creds = (p) => ({ clientId: env[`ZOHO_${p}_CLIENT_ID`] || '', clientSecret: env[`ZOHO_${p}_CLIENT_SECRET`] || '', refreshToken: env[`ZOHO_${p}_REFRESH_TOKEN`] || '' });
  const complete = (c) => c.clientId && c.clientSecret && c.refreshToken;
  const writeEnabled = flag(env.ZOHO_WRITE_ENABLED);
  const write = creds('WRITE');
  if (writeEnabled && !complete(write)) errors.push('ZOHO_WRITE_ENABLED is on but the separate ZOHO_WRITE_* credentials are incomplete');
  if (writeEnabled && !env.ZOHO_ORG_ID) errors.push('ZOHO_ORG_ID is required for Zoho writes');

  const costPolicy = env.FLUX_COST_POLICY || 'free-only';
  if (!['free-only', 'paid-per-use'].includes(costPolicy)) errors.push('FLUX_COST_POLICY must be free-only or paid-per-use');

  if (errors.length) throw new Error('Invalid configuration:\n- ' + errors.join('\n- '));
  return Object.freeze({
    port: num(env.PORT, 8788),
    dataDir: env.FLUX_DATA_DIR === 'memory' ? null : env.FLUX_DATA_DIR || './data',
    authSecret, approvalSecret, auditKey,
    allowedOrigins: list(env.FLUX_ALLOWED_ORIGINS),
    zoho: Object.freeze({
      orgId: env.ZOHO_ORG_ID || '',
      accountsBase: env.ZOHO_ACCOUNTS_BASE || `https://accounts.zoho.${dc}`,
      apiBase: env.ZOHO_API_BASE || `https://www.zohoapis.${dc}/books/v3`,
      read: Object.freeze(creds('READ')), readConfigured: !!(env.ZOHO_ORG_ID && complete(creds('READ'))),
      write: Object.freeze(write), writeEnabled: writeEnabled && complete(write),
    }),
    providers: Object.freeze({
      openrouter: Object.freeze({ base: env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1', key: env.OPENROUTER_API_KEY || '' }),
      omniroute: Object.freeze({ base: env.OMNIROUTE_BASE_URL || '', key: env.OMNIROUTE_API_KEY || '' }),
    }),
    costPolicy,
    freeDailyCap: env.FLUX_FREE_DAILY_CAP ? num(env.FLUX_FREE_DAILY_CAP, null) : null,
    briefingReserve: num(env.FLUX_BRIEFING_RESERVE, 5),
    briefingEnabled: flag(env.FLUX_BRIEFING_ENABLED, true),
    briefingHour: num(env.FLUX_BRIEFING_HOUR_IST, 8),
    browserAllowedDomains: Object.freeze(domainList(env.FLUX_BROWSER_ALLOWED_DOMAINS)),
  });
}

// Safe to log or return from /health: says what is configured, never what the secrets are.
export function describeConfig(c) {
  return {
    zohoRead: c.zoho.readConfigured, zohoWrite: c.zoho.writeEnabled, zohoApi: c.zoho.apiBase,
    openrouter: !!c.providers.openrouter.key, omniroute: !!c.providers.omniroute.base,
    costPolicy: c.costPolicy, briefing: c.briefingEnabled, persistent: !!c.dataDir,
    browserRead: c.browserAllowedDomains.length > 0,
  };
}
