import { ZohoError } from './auth.js';
import { parseZohoJson } from './money.js';

// Read-only by construction: this class has no method that sends anything but GET.
export class ZohoReader {
  constructor({ apiBase, orgId, tokens, fetchFn = fetch }) { Object.assign(this, { apiBase, orgId, tokens, fetchFn }); }

  async #get(path, query = {}, { binary = false } = {}) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const url = `${this.apiBase}${path}?${new URLSearchParams({ organization_id: this.orgId, ...query })}`;
      let res;
      try { res = await this.fetchFn(url, { method: 'GET', headers: { Authorization: `Zoho-oauthtoken ${await this.tokens.get()}` } }); }
      catch (e) { if (e instanceof ZohoError) throw e; throw new ZohoError('ZOHO_UNREACHABLE', 'Could not reach Zoho Books'); }
      if (res.status === 401 && attempt === 0) { this.tokens.invalidate(); continue; }
      if (res.status === 429) throw new ZohoError('ZOHO_RATE_LIMIT', 'Zoho Books rate limit reached. Try again shortly.', 429);
      if (binary && res.ok) return Buffer.from(await res.arrayBuffer());
      const text = await res.text(); let data;
      try { data = parseZohoJson(text); } catch { throw new ZohoError('ZOHO_BAD_RESPONSE', `Zoho Books returned an unreadable response (${res.status})`, res.status); }
      if (!res.ok || (data.code !== undefined && Number(data.code) !== 0)) throw new ZohoError('ZOHO_ERROR', String(data.message || `Zoho Books error ${res.status}`).slice(0, 200), res.status);
      return data;
    }
    throw new ZohoError('ZOHO_AUTH', 'Zoho Books rejected the access token', 401);
  }
  async listInvoices({ status, page = 1, perPage = 50, customerId, search } = {}) {
    const q = { page, per_page: perPage }; if (status) q.status = status; if (customerId) q.customer_id = customerId; if (search) q.invoice_number_contains = search;
    const d = await this.#get('/invoices', q); return { items: d.invoices || [], hasMore: !!d.page_context?.has_more_page };
  }
  async getInvoice(id) { return (await this.#get(`/invoices/${encodeURIComponent(id)}`)).invoice; }
  async invoicePdf(id) { return this.#get(`/invoices/${encodeURIComponent(id)}`, { accept: 'pdf' }, { binary: true }); }
  async listContacts({ search, page = 1 } = {}) { const q = { page }; if (search) q.contact_name_contains = search; return (await this.#get('/contacts', q)).contacts || []; }
  async getContact(id) { return (await this.#get(`/contacts/${encodeURIComponent(id)}`)).contact; }
  async listItems({ search } = {}) { const q = {}; if (search) q.name_contains = search; return (await this.#get('/items', q)).items || []; }
  async listBills({ status, page = 1 } = {}) { const q = { page }; if (status) q.status = status; return (await this.#get('/bills', q)).bills || []; }
}
