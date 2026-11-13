// Flux World Economy Mode.
// Every figure is caller-supplied or explicitly marked uncertain. No invented market data.

export const ECONOMY_DISCLAIMER = 'Educational information only, not personalised investment advice.';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const pct = (n) => round2(n * 100) / 100;

/** Build a structured economy impact brief from caller-supplied observations. */
export function economyBrief(input = {}) {
  const events = Array.isArray(input.events) ? input.events : [];
  const out = events.map((e) => {
    const date = e.date ? String(e.date).slice(0, 10) : null;
    const source = String(e.source || '').trim();
    const rawConf = e.confidence === 'high' || e.confidence === 'medium' || e.confidence === 'low' ? e.confidence : 'uncertain';
    // An entry without a named source cannot be trusted at high confidence.
    const confidence = source ? rawConf : 'uncertain';
    return {
      event: String(e.event || '').slice(0, 200),
      date,
      source: String(e.source || '').slice(0, 160),
      sourceUrl: e.sourceUrl == null ? null : String(e.sourceUrl).slice(0, 500),
      whatHappened: String(e.whatHappened || '').slice(0, 600),
      whyItMatters: String(e.whyItMatters || '').slice(0, 600),
      impactOnRTA: String(e.impactOnRTA || '').slice(0, 400),
      impactOnMyMoney: String(e.impactOnMyMoney || '').slice(0, 400),
      opportunity: String(e.opportunity || '').slice(0, 400),
      risk: String(e.risk || '').slice(0, 400),
      recommendedAction: String(e.recommendedAction || '').slice(0, 400),
      jugaadAction: String(e.jugaadAction || '').slice(0, 400),
      confidence,
    };
  });
  return {
    ok: true,
    disclaimer: ECONOMY_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    events: out,
    limitations: [
      'No live market feed is configured. Every entry above was supplied by the caller.',
      'Do not trade, commit to a supplier or sign a contract on the basis of this brief alone.',
    ],
    confidence: out.length ? 'medium' : 'uncertain',
  };
}

/** Convert a list of price observations into a trend summary. */
export function priceTrendSummary(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const byMaterial = new Map();
  for (const r of list) {
    const key = String(r.material || '').toLowerCase();
    if (!key) continue;
    const price = Number(r.price);
    if (!Number.isFinite(price)) continue;
    const arr = byMaterial.get(key) || [];
    arr.push({ price, date: String(r.date || r.recordedAt || '').slice(0, 10) });
    byMaterial.set(key, arr);
  }
  const summary = [];
  for (const [material, points] of byMaterial.entries()) {
    points.sort((a, b) => a.date.localeCompare(b.date));
    const first = points[0].price;
    const last = points[points.length - 1].price;
    const change = last - first;
    const trend = change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable';
    summary.push({
      material,
      observations: points.length,
      firstPrice: round2(first),
      lastPrice: round2(last),
      change: round2(change),
      changePercent: first ? round2(change / first * 100) : null,
      trend,
      confidence: points.length >= 3 ? 'medium' : 'low',
    });
  }
  return { ok: true, summary, limitations: ['Trends are computed from caller-supplied observations, not a live index.'] };
}