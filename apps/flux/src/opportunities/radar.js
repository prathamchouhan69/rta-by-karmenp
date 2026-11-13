// Flux Opportunity Radar and Trend Radar.
// Curated, caller-supplied, or explicitly-uncertain. Never invented.

export const RADAR_DISCLAIMER = 'Educational information only, not personalised investment advice.';

function clip(s, n = 400) { return String(s || '').slice(0, n); }

export function opportunityAlerts(input = {}) {
  const alerts = Array.isArray(input.alerts) ? input.alerts : [];
  const out = alerts.map((a) => {
    const source = String(a.source || '').trim();
    const rawConf = a.confidence === 'high' || a.confidence === 'medium' || a.confidence === 'low' ? a.confidence : 'uncertain';
    const confidence = source ? rawConf : 'uncertain';
    return {
      id: String(a.id || '').slice(0, 80),
      type: String(a.type || 'opportunity').slice(0, 40),
      whatHappened: clip(a.whatHappened, 400),
      whyItMatters: clip(a.whyItMatters, 400),
      moneyOpportunity: clip(a.moneyOpportunity, 400),
      deadline: a.deadline == null ? null : String(a.deadline).slice(0, 40),
      firstAction: clip(a.firstAction, 400),
      jugaadAction: clip(a.jugaadAction, 400),
      risk: clip(a.risk, 400),
      source: clip(a.source, 160),
      sourceUrl: a.sourceUrl == null ? null : String(a.sourceUrl).slice(0, 500),
      confidence,
      approvalRequired: a.approvalRequired !== false,
    };
  });
  return {
    ok: true,
    disclaimer: RADAR_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    alerts: out,
    limitations: ['Every alert is caller-supplied or marked uncertain. No live tender, scheme or price feed is built in.'],
  };
}

export function trendRadar(input = {}) {
  const trends = Array.isArray(input.trends) ? input.trends : [];
  const out = trends.map((t) => ({
    id: String(t.id || '').slice(0, 80),
    trend: clip(t.trend, 200),
    category: String(t.category || 'general').slice(0, 40),
    whatChanged: clip(t.whatChanged, 400),
    whyItMatters: clip(t.whyItMatters, 400),
    impactOnRTA: clip(t.impactOnRTA, 400),
    opportunity: clip(t.opportunity, 400),
    risk: clip(t.risk, 400),
    timeHorizon: String(t.timeHorizon || 'unknown').slice(0, 40),
    recommendedAction: clip(t.recommendedAction, 400),
    confidence: t.confidence === 'high' || t.confidence === 'medium' || t.confidence === 'low' ? t.confidence : 'uncertain',
  }));
  return {
    ok: true,
    disclaimer: RADAR_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    trends: out,
    limitations: ['Trends are observations, not predictions. Verify before acting.'],
  };
}