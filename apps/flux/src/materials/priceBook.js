import { newId } from '../util/ids.js';
import { resolveUnit } from '../measurements/units.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const fail = (code, message, extra = {}) => ({ ok: false, code, message, confidence: 'uncertain', ...extra });

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// A dated, source-labelled price book. There are no built-in prices: an empty
// book returns "uncertain" rather than a made-up market rate.
export class MaterialPriceBook {
  constructor({ store, audit, now = () => new Date() }) { this.col = store.collection('material_prices'); this.audit = audit; this.now = now; }

  add(record, actor = { id: 'system' }) {
    const material = String(record?.material || '').trim();
    const location = String(record?.location || '').trim();
    const unit = String(record?.unit || '').trim();
    const source = String(record?.source || '').trim();
    const price = Number(record?.price);
    if (!material || material.length > 120) return fail('BAD_MATERIAL', 'material is required (maximum 120 characters)');
    if (!location || location.length > 120) return fail('BAD_LOCATION', 'location is required (maximum 120 characters)');
    if (!unit || unit.length > 40) return fail('BAD_UNIT', 'unit is required (maximum 40 characters)');
    if (!Number.isFinite(price) || price <= 0) return fail('BAD_PRICE', 'price must be a positive number');
    if (!source || source.length > 300) return fail('SOURCE_REQUIRED', 'Say where the price came from (supplier quotation, invoice, portal or verified market source).');
    if (!validDate(record?.verifiedAt)) return fail('BAD_DATE', 'verifiedAt must be a real date in YYYY-MM-DD format');
    let sourceUrl = null;
    if (record?.sourceUrl) {
      try { const u = new URL(record.sourceUrl); if (u.protocol !== 'https:') return fail('BAD_URL', 'sourceUrl must use HTTPS'); sourceUrl = u.toString(); }
      catch { return fail('BAD_URL', 'sourceUrl must be a valid HTTPS URL'); }
    }
    const unitInfo = resolveUnit(unit);
    const row = {
      id: newId('price'), material, location, unit,
      unitFamily: unitInfo?.group || null,
      unitKey: unitInfo?.unit || null,
      price: round2(price), currency: String(record?.currency || 'INR').toUpperCase().slice(0, 3),
      source, sourceUrl, verifiedAt: record.verifiedAt,
      notes: String(record?.notes || '').slice(0, 500),
      enteredBy: actor.id, enteredAt: this.now().toISOString(),
      confidence: sourceUrl ? 'medium' : 'low',
      limitations: ['A supplier quotation is not a market index. Verify before committing a project price.'],
    };
    this.col.put(row.id, row);
    this.audit.append({ actor: actor.id, action: 'material_price.added', data: { id: row.id, material, location, unit, price: row.price, source, verifiedAt: row.verifiedAt } });
    return { ok: true, ...row };
  }

  get(id) { return this.col.get(id); }

  list({ material = null, location = null, unit = null, latestOnly = false, limit = 100 } = {}) {
    const wantMaterial = material ? String(material).toLowerCase() : null;
    const wantLocation = location ? String(location).toLowerCase() : null;
    const wantUnit = unit ? String(unit).toLowerCase() : null;
    let rows = this.col.all().filter((r) =>
      (!wantMaterial || r.material.toLowerCase().includes(wantMaterial)) &&
      (!wantLocation || r.location.toLowerCase().includes(wantLocation)) &&
      (!wantUnit || r.unit.toLowerCase() === wantUnit || (resolveUnit(r.unit)?.unit === resolveUnit(wantUnit)?.unit)));
    rows.sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt) || b.enteredAt.localeCompare(a.enteredAt));
    if (latestOnly) {
      const seen = new Set();
      rows = rows.filter((r) => { const k = `${r.material.toLowerCase()}|${r.location.toLowerCase()}|${r.unit.toLowerCase()}`; if (seen.has(k)) return false; seen.add(k); return true; });
    }
    return rows.slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
  }

  trend({ material, location = null, unit = null, currency = 'INR' } = {}) {
    const rows = this.list({ material, location, unit, latestOnly: false }).filter((r) => r.currency === String(currency).toUpperCase());
    if (!rows.length) return fail('NO_PRICE_DATA', `No verified price record for ${material || 'this material'}${location ? ` in ${location}` : ''}. Add a dated source before using a price.`, { material, location, unit });
    const [current, previous] = rows;
    const change = previous ? current.price - previous.price : null;
    const changePercent = previous && previous.price ? change / previous.price * 100 : null;
    return {
      ok: true, material: current.material, location: current.location, unit: current.unit, currency: current.currency,
      currentPrice: current.price, previousPrice: previous?.price ?? null,
      priceChange: change == null ? null : round2(change), priceChangePercent: changePercent == null ? null : round2(changePercent),
      priceTrend: change == null ? 'uncertain' : change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable',
      source: current.source, sourceUrl: current.sourceUrl, verifiedAt: current.verifiedAt,
      confidence: previous ? current.confidence : 'uncertain',
      observations: rows.length,
      limitations: previous ? ['Two dated observations show direction, not a full market trend.'] : ['Only one observation exists, so no trend can be established.', ...current.limitations],
      updatedAt: current.enteredAt,
    };
  }

  compareLocations({ material, unit = null } = {}) {
    const rows = this.list({ material, unit, latestOnly: true, limit: 500 });
    if (!rows.length) return fail('NO_PRICE_DATA', `No verified price record for ${material || 'this material'}.`);
    return {
      ok: true, material: rows[0].material,
      prices: rows.map((r) => ({ location: r.location, price: r.price, unit: r.unit, currency: r.currency, source: r.source, verifiedAt: r.verifiedAt, confidence: r.confidence })),
      confidence: 'low', limitations: ['Locations may use different specifications, freight terms, taxes or payment terms. Compare like with like.'],
    };
  }

  projectImpact({ material, location = null, unit = null, quantity } = {}) {
    const t = this.trend({ material, location, unit });
    if (!t.ok) return t;
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) return fail('BAD_QUANTITY', 'quantity must be a positive number');
    return {
      ok: true, material: t.material, location: t.location, unit: t.unit, quantity: q,
      unitPrice: t.currentPrice, estimatedCost: round2(t.currentPrice * q),
      previousCost: t.previousPrice == null ? null : round2(t.previousPrice * q),
      changeAmount: t.priceChange == null ? null : round2(t.priceChange * q),
      trend: t.priceTrend, verifiedAt: t.verifiedAt, source: t.source, sourceUrl: t.sourceUrl,
      confidence: t.confidence, limitations: t.limitations,
      assumptions: ['The same unit price applies to the whole quantity.', 'Taxes, freight, wastage and payment terms are excluded unless included in the recorded unit price.'],
    };
  }

  remove(id, actor) {
    const row = this.col.get(id);
    if (!row) return fail('NOT_FOUND', 'Price record not found');
    this.col.del(id);
    this.audit.append({ actor: actor.id, action: 'material_price.removed', data: { id, material: row.material, location: row.location, price: row.price } });
    return { ok: true, removed: id };
  }
}
