// Flux Premium Opportunity Radar and Trend Radar.
// Curated, caller-supplied, or explicitly-uncertain. Never invented.

export const RADAR_DISCLAIMER = 'Educational information only, not personalised investment advice.';

function clip(s, n = 400) { return String(s || '').slice(0, n); }

const ALERT_TYPES = ['tender', 'scheme', 'grant', 'subsidy', 'policy', 'market', 'partnership', 'acquisition', 'hiring', 'technology', 'regulation', 'esg', 'other'];
const TREND_CATEGORIES = ['technology', 'market', 'policy', 'consumer', 'competitive', 'regulatory', 'macroeconomic', 'esg', 'supply_chain', 'other'];

export function opportunityAlerts(input = {}) {
  const alerts = Array.isArray(input.alerts) ? input.alerts : [];
  const out = alerts.map((a) => {
    const source = String(a.source || '').trim();
    const rawConf = a.confidence === 'high' || a.confidence === 'medium' || a.confidence === 'low' ? a.confidence : 'uncertain';
    const confidence = source ? rawConf : 'uncertain';
    const alertType = ALERT_TYPES.includes(a.type) ? a.type : 'other';
    const deadline = a.deadline ? String(a.deadline).slice(0, 40) : null;
    const daysUntil = deadline ? Math.max(0, Math.ceil((new Date(deadline) - new Date()) / 86400000)) : null;
    const urgency = daysUntil !== null ? (daysUntil <= 3 ? 'critical' : daysUntil <= 7 ? 'high' : daysUntil <= 30 ? 'medium' : 'low') : 'unknown';
    
    return {
      id: String(a.id || `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 80),
      type: alertType,
      whatHappened: clip(a.whatHappened, 500),
      whyItMatters: clip(a.whyItMatters, 500),
      moneyOpportunity: clip(a.moneyOpportunity, 500),
      deadline,
      daysUntil,
      urgency,
      firstAction: clip(a.firstAction, 400),
      jugaadAction: clip(a.jugaadAction, 400),
      risk: clip(a.risk, 500),
      source: clip(a.source, 160),
      sourceUrl: a.sourceUrl == null ? null : String(a.sourceUrl).slice(0, 500),
      confidence,
      approvalRequired: a.approvalRequired !== false,
      tags: Array.isArray(a.tags) ? a.tags.map(t => String(t).trim().slice(0, 40)).slice(0, 5) : [],
      sector: String(a.sector || 'general').slice(0, 80),
      geography: String(a.geography || 'India').slice(0, 80),
      estimatedValue: a.estimatedValue ? { amount: Number(a.estimatedValue.amount), currency: String(a.estimatedValue.currency || 'INR'), confidence: a.estimatedValue.confidence || 'uncertain' } : null,
      relatedAlerts: Array.isArray(a.relatedAlerts) ? a.relatedAlerts.slice(0, 5) : [],
    };
  });
  
  // Premium: group by type, urgency, sector
  const byType = {};
  const byUrgency = {};
  const bySector = {};
  for (const a of out) {
    if (!byType[a.type]) byType[a.type] = [];
    byType[a.type].push(a);
    if (!byUrgency[a.urgency]) byUrgency[a.urgency] = [];
    byUrgency[a.urgency].push(a);
    if (!bySector[a.sector]) bySector[a.sector] = [];
    bySector[a.sector].push(a);
  }
  
  return {
    ok: true,
    disclaimer: RADAR_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    alerts: out,
    byType,
    byUrgency,
    bySector,
    summary: {
      total: out.length,
      critical: out.filter(a => a.urgency === 'critical').length,
      high: out.filter(a => a.urgency === 'high').length,
      medium: out.filter(a => a.urgency === 'medium').length,
      low: out.filter(a => a.urgency === 'low').length,
      withDeadline: out.filter(a => a.deadline).length,
      requiringApproval: out.filter(a => a.approvalRequired).length,
      byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, v.length])),
      byUrgency: Object.fromEntries(Object.entries(byUrgency).map(([k, v]) => [k, v.length])),
    },
    limitations: ['Every alert is caller-supplied or marked uncertain. No live tender, scheme or price feed is built in.'],
  };
}

export function trendRadar(input = {}) {
  const trends = Array.isArray(input.trends) ? input.trends : [];
  const out = trends.map((t) => {
    const category = TREND_CATEGORIES.includes(t.category) ? t.category : 'other';
    const momentum = t.momentum === 'accelerating' || t.momentum === 'decelerating' || t.momentum === 'stable' ? t.momentum : 'stable';
    const confidence = t.confidence === 'high' || t.confidence === 'medium' || t.confidence === 'low' ? t.confidence : 'uncertain';
    
    return {
      id: String(t.id || `trend-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 80),
      trend: clip(t.trend, 300),
      category,
      whatChanged: clip(t.whatChanged, 500),
      whyItMatters: clip(t.whyItMatters, 500),
      impactOnRTA: clip(t.impactOnRTA, 500),
      opportunity: clip(t.opportunity, 500),
      risk: clip(t.risk, 500),
      timeHorizon: String(t.timeHorizon || 'unknown').slice(0, 40),
      recommendedAction: clip(t.recommendedAction, 500),
      jugaadAction: clip(t.jugaadAction, 500),
      confidence,
      momentum,
      tags: Array.isArray(t.tags) ? t.tags.map(tag => String(tag).trim().slice(0, 40)).slice(0, 5) : [],
      sector: String(t.sector || 'general').slice(0, 80),
      geography: String(t.geography || 'India').slice(0, 80),
      relatedTrends: Array.isArray(t.relatedTrends) ? t.relatedTrends.slice(0, 5) : [],
      evidence: Array.isArray(t.evidence) ? t.evidence.map(e => ({ claim: clip(e.claim, 300), source: clip(e.source, 160), sourceUrl: e.sourceUrl, confidence: e.confidence })).slice(0, 5) : [],
    };
  });
  
  // Premium: group by category, momentum
  const byCategory = {};
  const byMomentum = {};
  for (const t of out) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
    if (!byMomentum[t.momentum]) byMomentum[t.momentum] = [];
    byMomentum[t.momentum].push(t);
  }
  
  return {
    ok: true,
    disclaimer: RADAR_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    trends: out,
    byCategory,
    byMomentum,
    summary: {
      total: out.length,
      byCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])),
      byMomentum: Object.fromEntries(Object.entries(byMomentum).map(([k, v]) => [k, v.length])),
      highConfidence: out.filter(t => t.confidence === 'high').length,
      accelerating: out.filter(t => t.momentum === 'accelerating').length,
    },
    limitations: ['Trends are observations, not predictions. Verify before acting.'],
  };
}

/** Premium: combine alerts and trends into a unified radar view */
export function unifiedRadar(input = {}) {
  const alerts = opportunityAlerts({ alerts: input.alerts || [] });
  const trends = trendRadar({ trends: input.trends || [] });
  
  // Cross-reference alerts and trends
  const crossRefs = [];
  for (const alert of alerts.alerts) {
    for (const trend of trends.trends) {
      // Simple keyword matching for cross-references
      const alertKeywords = (alert.whatHappened + ' ' + alert.type + ' ' + (alert.tags || []).join(' ')).toLowerCase();
      const trendKeywords = (trend.trend + ' ' + trend.category + ' ' + (trend.tags || []).join(' ')).toLowerCase();
      const common = alertKeywords.split(' ').filter(w => w.length > 3 && trendKeywords.includes(w));
      if (common.length >= 2) {
        crossRefs.push({
          alertId: alert.id,
          trendId: trend.id,
          commonKeywords: common.slice(0, 5),
          relevance: common.length / Math.max(alertKeywords.split(' ').length, trendKeywords.split(' ').length),
        });
      }
    }
  }
  
  return {
    ok: true,
    disclaimer: RADAR_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    alerts: alerts.alerts,
    trends: trends.trends,
    crossReferences: crossRefs.slice(0, 20),
    summary: {
      totalAlerts: alerts.alerts.length,
      totalTrends: trends.trends.length,
      crossReferences: crossRefs.length,
      criticalAlerts: alerts.alerts.filter(a => a.urgency === 'critical').length,
      acceleratingTrends: trends.trends.filter(t => t.momentum === 'accelerating').length,
    },
    limitations: ['Cross-references are based on keyword matching, not causal analysis.'],
  };
}