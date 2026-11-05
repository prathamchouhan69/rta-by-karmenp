import { istDate } from '../util/time.js';
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, ' ').trim();

/** Code format only (not whether it is the right code for the item). */
export function checkCodeFormat(code) {
  const c = String(code ?? '').trim();
  if (!/^\d+$/.test(c)) return { valid: false, reason: 'Code must be digits only' };
  if (c.startsWith('99')) return c.length === 6 ? { valid: true, kind: 'SAC' } : { valid: false, reason: 'A SAC code has 6 digits' };
  return [2, 4, 6, 8].includes(c.length) ? { valid: true, kind: 'HSN' } : { valid: false, reason: 'An HSN code has 2, 4, 6 or 8 digits' };
}

// Source order: owner-confirmed mapping, then the Zoho item master, then an official lookup adapter (if one is plugged in).
// Nothing is ever invented: with no source, the answer is "Needs verification" and no code.
export class HsnService {
  constructor({ store, reader = null, audit, lookup = null, now = () => new Date() }) { this.col = store.collection('hsn_mappings'); Object.assign(this, { reader, audit, lookup, now }); }
  list() { return this.col.all().sort((a, b) => a.itemName.localeCompare(b.itemName)); }

  async resolve(itemName, { statedRate = null, date = istDate(this.now()) } = {}) {
    const key = norm(itemName); const warnings = [];
    const base = { itemName, needsOwnerConfirmation: true };
    const m = this.col.get(key);
    if (m) {
      if (m.effectiveFrom > date) warnings.push({ code: 'NOT_YET_IN_FORCE', message: `This mapping starts on ${m.effectiveFrom}, after the document date ${date}` });
      if (statedRate != null && String(statedRate) !== String(m.gstRate)) warnings.push({ code: 'RATE_MISMATCH', message: `You stated ${statedRate}% but the confirmed rate for this code is ${m.gstRate}%` });
      return { ...base, status: 'Confirmed by owner', code: m.code, kind: m.kind, description: m.description, gstRate: m.gstRate, source: m.source, verifiedOn: m.verifiedOn, needsOwnerConfirmation: false, warnings };
    }
    if (this.reader) {
      try {
        const items = await this.reader.listItems({ search: itemName });
        const hit = items.find((i) => norm(i.name) === key && i.hsn_or_sac);
        if (hit) {
          const fmt = checkCodeFormat(hit.hsn_or_sac);
          if (statedRate != null && hit.tax_percentage != null && String(statedRate) !== String(hit.tax_percentage)) warnings.push({ code: 'RATE_MISMATCH', message: `You stated ${statedRate}% but your Zoho item uses ${hit.tax_percentage}%` });
          return { ...base, status: 'Likely', code: String(hit.hsn_or_sac), kind: fmt.kind || null, description: hit.name, gstRate: hit.tax_percentage != null ? String(hit.tax_percentage) : null, source: 'Your Zoho Books item master (not an official source)', verifiedOn: null, warnings: fmt.valid ? warnings : [...warnings, { code: 'BAD_FORMAT', message: fmt.reason }] };
        }
      } catch (e) { warnings.push({ code: 'ZOHO_UNAVAILABLE', message: `Could not read your Zoho item master: ${e.message}` }); }
    }
    if (this.lookup) {
      try {
        const c = (await this.lookup(itemName, { date }))?.find((x) => checkCodeFormat(x.code).valid);
        if (c) return { ...base, status: c.exactMatch && c.rateInForceOn === date ? 'Verified' : 'Likely', code: String(c.code), kind: checkCodeFormat(c.code).kind, description: c.description, gstRate: String(c.gstRate), source: c.source, sourceUrl: c.url || null, verifiedOn: c.checkedOn || null, warnings };
      } catch (e) { warnings.push({ code: 'LOOKUP_FAILED', message: `Official lookup failed: ${e.message}` }); }
    }
    return { ...base, status: 'Needs verification', code: null, kind: null, description: null, gstRate: null, source: null, verifiedOn: null, warnings: [...warnings, { code: 'NO_SOURCE', message: 'No verified source found. Flux does not guess HSN or SAC codes. Enter the code you have verified.' }] };
  }

  /** Saving a confirmed mapping is an explicit owner/accountant action (audited). */
  confirm({ itemName, code, gstRate, description = '', source, actor }) {
    const fmt = checkCodeFormat(code); if (!fmt.valid) throw Object.assign(new Error(fmt.reason), { status: 422, code: 'BAD_CODE' });
    const rate = String(gstRate ?? '').trim(); if (!/^\d{1,2}(\.\d{1,2})?$/.test(rate)) throw Object.assign(new Error('GST rate must be a number such as 18'), { status: 422, code: 'BAD_RATE' });
    if (!String(source || '').trim()) throw Object.assign(new Error('Say where you verified this code and rate (for example the GST portal or your CA)'), { status: 422, code: 'NO_SOURCE' });
    const today = istDate(this.now()); const key = norm(itemName); if (!key) throw Object.assign(new Error('Item name is required'), { status: 422, code: 'NO_NAME' });
    const m = { itemName: String(itemName).trim(), code: String(code).trim(), kind: fmt.kind, gstRate: rate, description: String(description).slice(0, 200), source: String(source).slice(0, 200), verifiedOn: today, effectiveFrom: today, confirmedBy: actor.id };
    this.col.put(key, m); this.audit.append({ actor: actor.id, action: 'hsn.confirmed', data: m }); return m;
  }
}
