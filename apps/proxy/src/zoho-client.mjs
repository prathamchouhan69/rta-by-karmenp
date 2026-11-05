const dataCenters = {
  au: 'www.zohoapis.com.au',
  ca: 'www.zohoapis.ca',
  eu: 'www.zohoapis.eu',
  in: 'www.zohoapis.in',
  jp: 'www.zohoapis.jp',
  sa: 'www.zohoapis.sa',
  uk: 'www.zohoapis.uk',
  com: 'www.zohoapis.com'
};
const accountCenters = {
  au: 'accounts.zoho.com.au',
  ca: 'accounts.zohocloud.ca',
  eu: 'accounts.zoho.eu',
  in: 'accounts.zoho.in',
  jp: 'accounts.zoho.jp',
  sa: 'accounts.zoho.sa',
  uk: 'accounts.zoho.uk',
  com: 'accounts.zoho.com'
};

export class ZohoApiError extends Error {
  constructor(message, status = 502, code = 'ZOHO_ERROR') {
    super(message);
    this.name = 'ZohoApiError';
    this.status = status;
    this.code = code;
  }
}

export function validateZohoConfig(env) {
  const dc = (env.ZOHO_DC ?? 'in').toLowerCase();
  if (!dataCenters[dc]) throw new Error(`Unsupported ZOHO_DC "${dc}"`);
  const required = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 'ZOHO_ORG_ID'];
  const missing = required.filter((name) => !env[name] || env[name].startsWith('replace-'));
  if (missing.length) throw new Error(`Live Zoho mode requires: ${missing.join(', ')}`);
  return { dc, apiHost: dataCenters[dc], accountsHost: accountCenters[dc] };
}

export function selectZohoOrganization(organizations, organizationId) {
  if (!Array.isArray(organizations)) return null;
  return organizations.find((organization) => String(organization?.organization_id) === String(organizationId)) ?? null;
}

export class ZohoBooksClient {
  constructor(env, fetchImpl = fetch) {
    this.env = env;
    this.fetch = fetchImpl;
    this.config = validateZohoConfig(env);
    this.accessToken = null;
    this.expiresAt = 0;
  }

  async getAccessToken(forceRefresh = false) {
    if (!forceRefresh && this.accessToken && this.expiresAt > Date.now() + 60_000) return this.accessToken;
    const url = `https://${this.config.accountsHost}/oauth/v2/token`;
    const form = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.env.ZOHO_CLIENT_ID,
      client_secret: this.env.ZOHO_CLIENT_SECRET,
      refresh_token: this.env.ZOHO_REFRESH_TOKEN
    });
    let response;
    try {
      response = await this.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
        signal: AbortSignal.timeout(15000)
      });
    } catch (error) {
      throw new ZohoApiError(`Could not reach Zoho authentication service: ${error.message}`, 502, 'ZOHO_AUTH_UNAVAILABLE');
    }
    const payload = await this.readJson(response);
    if (!response.ok || !payload.access_token) {
      throw new ZohoApiError('Zoho authentication failed; check the data centre, client, and refresh-token configuration', 502, 'ZOHO_AUTH_FAILED');
    }
    this.accessToken = payload.access_token;
    this.expiresAt = Date.now() + (Number(payload.expires_in) || 3600) * 1000;
    return this.accessToken;
  }

  async request(method, resource, { query = {}, body, includeOrganization = true } = {}) {
    const path = resource.replace(/^\/+/, '');
    if (!/^[a-z0-9/_-]+$/i.test(path)) throw new Error('Invalid internal Zoho resource path');
    const url = new URL(`https://${this.config.apiHost}/books/v3/${path}`);
    if (includeOrganization) url.searchParams.set('organization_id', this.env.ZOHO_ORG_ID);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = await this.getAccessToken(attempt === 1);
      let response;
      try {
        response = await this.fetch(url, {
          method,
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            Accept: 'application/json',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: AbortSignal.timeout(30000)
        });
      } catch (error) {
        throw new ZohoApiError(`Zoho Books request failed: ${error.message}`, 502, 'ZOHO_UPSTREAM_UNAVAILABLE');
      }
      const payload = await this.readJson(response);
      if (response.status === 401 && attempt === 0) {
        this.accessToken = null;
        continue;
      }
      if (!response.ok || (payload.code !== undefined && payload.code !== 0)) {
        const status = response.status === 429 ? 503 : 502;
        throw new ZohoApiError(
          `Zoho Books rejected the request${payload.message ? `: ${payload.message}` : ''}${payload.code === undefined ? '' : ` (Zoho code ${payload.code})`}`,
          status,
          response.status === 429 ? 'ZOHO_RATE_LIMITED' : 'ZOHO_REQUEST_REJECTED'
        );
      }
      return payload;
    }
    throw new ZohoApiError('Zoho authorization expired; retry the request', 502, 'ZOHO_AUTH_FAILED');
  }

  async readJson(response) {
    try { return await response.json(); } catch { return {}; }
  }
}
