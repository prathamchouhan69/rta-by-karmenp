export class ZohoError extends Error {
  constructor(code, message, status) { super(message); this.code = code; this.status = status; }
}
// Exchanges a refresh token for short-lived access tokens. One instance per credential set (read, write).
export class ZohoTokens {
  constructor({ accountsBase, creds, fetchFn = fetch, now = () => Date.now() }) { Object.assign(this, { accountsBase, creds, fetchFn, now }); this.cached = null; this.inflight = null; }
  invalidate() { this.cached = null; }
  async get() {
    if (this.cached && this.cached.exp - 60000 > this.now()) return this.cached.token;
    this.inflight ??= this.#refresh().finally(() => { this.inflight = null; });
    return this.inflight;
  }
  async #refresh() {
    const body = new URLSearchParams({ refresh_token: this.creds.refreshToken, client_id: this.creds.clientId, client_secret: this.creds.clientSecret, grant_type: 'refresh_token' });
    let res, data;
    try { res = await this.fetchFn(`${this.accountsBase}/oauth/v2/token`, { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } }); data = await res.json(); }
    catch { throw new ZohoError('ZOHO_UNREACHABLE', 'Could not reach the Zoho sign-in service'); }
    if (!res.ok || !data.access_token) throw new ZohoError('ZOHO_AUTH', `Zoho refused the credentials (${data.error || res.status})`, 401);
    this.cached = { token: data.access_token, exp: this.now() + (Number(data.expires_in) || 3600) * 1000 };
    return this.cached.token;
  }
}
