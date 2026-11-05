import { ZohoError } from './auth.js';
import { parseZohoJson } from './money.js';

export const DOC_TYPES = {
  invoice: { path: '/invoices', key: 'invoice', party: 'customer_id', label: 'Tax invoice' },
  quotation: { path: '/estimates', key: 'estimate', party: 'customer_id', label: 'Quotation' },
  purchase_order: { path: '/purchaseorders', key: 'purchaseorder', party: 'vendor_id', label: 'Purchase order' },
  credit_note: { path: '/creditnotes', key: 'creditnote', party: 'customer_id', label: 'Credit note' },
  delivery_challan: { path: '/deliverychallans', key: 'deliverychallan', party: 'customer_id', label: 'Delivery challan' },
};
const TOP = ['customer_id', 'vendor_id', 'date', 'due_date', 'expiry_date', 'payment_terms', 'payment_terms_label', 'reference_number', 'notes', 'terms', 'place_of_supply', 'gst_treatment', 'gst_no', 'is_inclusive_tax', 'line_items', 'delivery_date', 'shipping_address', 'billing_address'];
const LINE = ['item_id', 'name', 'description', 'rate', 'quantity', 'unit', 'hsn_or_sac', 'tax_id', 'discount', 'product_type'];
const DECIMAL = /^\d+(\.\d{1,4})?$/;

/** Only raw user inputs may be sent. Totals, tax splits, status and send flags belong to Zoho and are refused. */
export function validateDocPayload(docType, p) {
  const t = DOC_TYPES[docType]; const errors = [];
  if (!t) return ['Unsupported document type'];
  if (!p || typeof p !== 'object') return ['Payload must be an object'];
  for (const k of Object.keys(p)) if (!TOP.includes(k)) errors.push(`Field "${k}" is not allowed. Zoho Books calculates totals, tax and status itself.`);
  if (!p[t.party]) errors.push(`${t.party} is required`);
  if (!Array.isArray(p.line_items) || !p.line_items.length) errors.push('At least one line item is required');
  (p.line_items || []).forEach((l, i) => {
    for (const k of Object.keys(l)) if (!LINE.includes(k)) errors.push(`Line ${i + 1}: field "${k}" is not allowed`);
    for (const k of ['rate', 'quantity']) if (typeof l[k] !== 'string' || !DECIMAL.test(l[k])) errors.push(`Line ${i + 1}: ${k} must be the number as typed, written as text (for example "62000")`);
    if (l.discount !== undefined && !/^\d+(\.\d{1,4})?%?$/.test(String(l.discount))) errors.push(`Line ${i + 1}: discount is not valid`);
    if (!l.item_id && !l.name) errors.push(`Line ${i + 1}: item_id or name is required`);
  });
  return errors;
}

export class ZohoWriter {
  constructor({ apiBase, orgId, tokens, fetchFn = fetch }) { Object.assign(this, { apiBase, orgId, tokens, fetchFn }); }
  // The only write this class can do: create a draft. There is no update, delete, send or payment method.
  async createDraft(docType, payload) {
    const errors = validateDocPayload(docType, payload);
    if (errors.length) throw new ZohoError('INVALID_PAYLOAD', errors.join('; '), 422);
    const t = DOC_TYPES[docType];
    let res;
    try { res = await this.fetchFn(`${this.apiBase}${t.path}?${new URLSearchParams({ organization_id: this.orgId })}`, { method: 'POST', headers: { Authorization: `Zoho-oauthtoken ${await this.tokens.get()}`, 'content-type': 'application/json' }, body: JSON.stringify(payload) }); }
    catch (e) { if (e instanceof ZohoError) throw e; throw new ZohoError('ZOHO_UNREACHABLE', 'Could not reach Zoho Books'); }
    let data; try { data = parseZohoJson(await res.text()); } catch { throw new ZohoError('ZOHO_BAD_RESPONSE', `Unreadable response from Zoho Books (${res.status})`, res.status); }
    if (!res.ok || Number(data.code) !== 0) throw new ZohoError('ZOHO_ERROR', String(data.message || `Zoho Books error ${res.status}`).slice(0, 200), res.status);
    const doc = data[t.key];
    return { id: doc?.[`${t.key}_id`], number: doc?.[`${t.key}_number`], status: doc?.status, total: doc?.total, unexpectedStatus: doc?.status !== 'draft', document: doc };
  }
}
