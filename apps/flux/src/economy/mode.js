// Flux Premium World Economy Mode.
// Every figure is caller-supplied or explicitly marked uncertain. No invented market data.

export const ECONOMY_DISCLAIMER = 'Educational information only, not personalised investment advice.';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((n + Number.EPSILON) * 10000) / 10000;
const pct = (n) => round2(n * 100) / 100;

/** Build a structured economy impact brief from caller-supplied observations. */
export function economyBrief(input = {}) {
  const events = Array.isArray(input.events) ? input.events : [];
  const out = events.map((e) => {
    const date = e.date ? String(e.date).slice(0, 10) : null;
    const source = String(e.source || '').trim();
    const rawConf = e.confidence === 'high' || e.confidence === 'medium' || e.confidence === 'low' ? e.confidence : 'uncertain';
    const confidence = source ? rawConf : 'uncertain';
    return {
      id: e.id || `econ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
      tags: Array.isArray(e.tags) ? e.tags.map(t => String(t).trim().slice(0, 40)).slice(0, 5) : [],
      sector: String(e.sector || 'general').slice(0, 80),
      geography: String(e.geography || 'India').slice(0, 80),
      severity: e.severity === 'critical' || e.severity === 'high' || e.severity === 'medium' || e.severity === 'low' ? e.severity : 'medium',
    };
  });
  return {
    ok: true,
    disclaimer: ECONOMY_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    events: out,
    summary: {
      total: out.length,
      highConfidence: out.filter(e => e.confidence === 'high').length,
      critical: out.filter(e => e.severity === 'critical').length,
      bySector: Object.fromEntries(Object.entries(out.reduce((acc, e) => { acc[e.sector] = (acc[e.sector] || 0) + 1; return acc; }, {})).map(([k, v]) => [k, v])),
      bySeverity: Object.fromEntries(Object.entries(out.reduce((acc, e) => { acc[e.severity] = (acc[e.severity] || 0) + 1; return acc; }, {})).map(([k, v]) => [k, v])),
    },
    limitations: [
      'No live market feed is configured. Every entry above was supplied by the caller.',
      'Do not trade, commit to a supplier or sign a contract on the basis of this brief alone.',
    ],
    confidence: out.length ? 'medium' : 'uncertain',
  };
}

/** Convert a list of price observations into a trend summary with technical indicators. */
export function priceTrendSummary(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const byMaterial = new Map();
  for (const r of list) {
    const key = String(r.material || '').toLowerCase();
    if (!key) continue;
    const price = Number(r.price);
    if (!Number.isFinite(price)) continue;
    const arr = byMaterial.get(key) || [];
    arr.push({ price, date: String(r.date || r.recordedAt || '').slice(0, 10), volume: Number(r.volume) || 0 });
    byMaterial.set(key, arr);
  }
  const summary = [];
  for (const [material, points] of byMaterial.entries()) {
    points.sort((a, b) => a.date.localeCompare(b.date));
    const prices = points.map(p => p.price);
    const volumes = points.map(p => p.volume);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = last - first;
    const trend = change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable';
    
    // Premium: technical indicators
    const sma5 = prices.length >= 5 ? round2(prices.slice(-5).reduce((a, b) => a + b, 0) / 5) : null;
    const sma20 = prices.length >= 20 ? round2(prices.slice(-20).reduce((a, b) => a + b, 0) / 20) : null;
    const volatility = prices.length >= 2 ? round4(Math.sqrt(prices.slice(1).reduce((sum, p, i) => sum + Math.pow(p - prices[i], 2), 0) / (prices.length - 1))) : 0;
    
    // Support/Resistance levels
    const highs = prices.slice(-20);
    const lows = prices.slice(-20);
    const resistance = highs.length ? round2(Math.max(...highs)) : null;
    const support = lows.length ? round2(Math.min(...lows)) : null;
    
    // Volume trend
    const avgVolume = volumes.length ? round2(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0;
    const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const volumeTrend = avgVolume > 0 ? (recentVolume > avgVolume * 1.2 ? 'increasing' : recentVolume < avgVolume * 0.8 ? 'decreasing' : 'stable') : 'unknown';
    
    summary.push({
      material,
      observations: points.length,
      firstPrice: round2(first),
      lastPrice: round2(last),
      change: round2(change),
      changePercent: first ? round2(change / first * 100) : null,
      trend,
      sma5,
      sma20,
      volatility,
      resistance,
      support,
      volumeTrend,
      avgVolume,
      confidence: points.length >= 3 ? 'medium' : 'low',
      signal: (sma5 && sma20 && last > sma5 && last > sma20) ? 'bullish' : (sma5 && sma20 && last < sma5 && last < sma20) ? 'bearish' : 'neutral',
    });
  }
  return { ok: true, summary, limitations: ['Trends are computed from caller-supplied observations, not a live index.'] };
}

/** Premium: correlation analysis between materials */
export function materialCorrelation(rows = []) {
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
  
  // Align dates
  const materials = Array.from(byMaterial.keys());
  if (materials.length < 2) return { ok: true, correlations: [], limitations: ['Need at least 2 materials with aligned dates for correlation.'] };
  
  // Find common dates
  const dateSets = materials.map(m => new Set(byMaterial.get(m).map(p => p.date)));
  const commonDates = [...dateSets[0]].filter(d => dateSets.every(s => s.has(d))).sort();
  if (commonDates.length < 5) return { ok: true, correlations: [], limitations: ['Insufficient overlapping date range (need 5+ common dates).'] };
  
  // Build price series for common dates
  const series = {};
  for (const m of materials) {
    const priceMap = new Map(byMaterial.get(m).map(p => [p.date, p.price]));
    series[m] = commonDates.map(d => priceMap.get(d));
  }
  
  // Calculate correlations
  const correlations = [];
  for (let i = 0; i < materials.length; i++) {
    for (let j = i + 1; j < materials.length; j++) {
      const a = series[materials[i]];
      const b = series[materials[j]];
      const n = a.length;
      const meanA = a.reduce((s, v) => s + v, 0) / n;
      const meanB = b.reduce((s, v) => s + v, 0) / n;
      let cov = 0, varA = 0, varB = 0;
      for (let k = 0; k < n; k++) {
        const da = a[k] - meanA;
        const db = b[k] - meanB;
        cov += da * db;
        varA += da * da;
        varB += db * db;
      }
      const corr = varA > 0 && varB > 0 ? round4(cov / Math.sqrt(varA * varB)) : 0;
      correlations.push({
        materialA: materials[i],
        materialB: materials[j],
        correlation: corr,
        strength: Math.abs(corr) > 0.7 ? 'strong' : Math.abs(corr) > 0.4 ? 'moderate' : 'weak',
        direction: corr > 0 ? 'positive' : 'negative',
        sampleSize: n,
      });
    }
  }
  
  return { ok: true, correlations, limitations: ['Correlation does not imply causation. Based on caller-supplied data only.'] };
}

/** Premium: scenario analysis for material prices */
export function scenarioAnalysis(material, currentPrice, scenarios = {}) {
  const base = Number(currentPrice);
  if (!Number.isFinite(base) || base <= 0) return { ok: false, error: 'Invalid current price' };
  
  const results = [];
  for (const [name, params] of Object.entries(scenarios)) {
    const change = Number(params.changePercent || 0);
    const volatility = Number(params.volatility || 0);
    const horizon = Number(params.horizonDays || 30);
    const newPrice = round2(base * (1 + change / 100));
    const range = round2(newPrice * volatility / 100);
    results.push({
      scenario: name,
      projectedPrice: newPrice,
      changePercent: change,
      volatility,
      horizonDays: horizon,
      priceRange: { low: Math.max(0, round2(newPrice - range)), high: round2(newPrice + range) },
      confidence: params.confidence || 'medium',
    });
  }
  
  return { ok: true, material, currentPrice: base, scenarios: results, disclaimer: ECONOMY_DISCLAIMER };
}