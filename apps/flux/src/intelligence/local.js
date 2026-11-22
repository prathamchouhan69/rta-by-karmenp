// Flux Local Intelligence — Mandideep, Bhopal, Madhya Pradesh, India, Global.
// All entries are caller-supplied or explicitly uncertain.

export const LOCAL_DISCLAIMER = 'Local observations are caller-supplied and should be verified before you act on them.';
export const LOCAL_AREAS = ['Mandideep', 'Bhopal', 'Madhya Pradesh', 'India', 'Global'];

const LOCAL_CATEGORIES = [
  'tender', 'price', 'policy', 'infrastructure', 'market', 'weather', 'regulation',
  'opportunity', 'risk', 'networking', 'technology', 'skill', 'funding', 'compliance'
];

function clip(s, n = 400) { return String(s || '').slice(0, n); }

export function localInsights(input = {}) {
  const items = Array.isArray(input.insights) ? input.insights : [];
  const out = items.map((i) => {
    const area = LOCAL_AREAS.includes(String(i.area)) ? String(i.area) : 'uncertain';
    const category = LOCAL_CATEGORIES.includes(String(i.category)) ? String(i.category) : 'general';
    return {
      id: i.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      area,
      category,
      whatHappened: clip(i.whatHappened, 500),
      whyItMatters: clip(i.whyItMatters, 500),
      opportunity: clip(i.opportunity, 500),
      whoToContact: clip(i.whoToContact, 300),
      howToEarn: clip(i.howToEarn, 500),
      jugaadApproach: clip(i.jugaadApproach, 500),
      risk: clip(i.risk, 500),
      actionItems: Array.isArray(i.actionItems) ? i.actionItems.map(a => clip(a, 300)).slice(0, 5) : [],
      source: clip(i.source, 160),
      sourceUrl: i.sourceUrl == null ? null : String(i.sourceUrl).slice(0, 500),
      verifiedAt: i.verifiedAt == null ? null : String(i.verifiedAt).slice(0, 40),
      confidence: i.confidence === 'high' || i.confidence === 'medium' || i.confidence === 'low' ? i.confidence : 'uncertain',
      tags: Array.isArray(i.tags) ? i.tags.map(t => String(t).trim().slice(0, 40)).slice(0, 5) : [],
      impactScore: typeof i.impactScore === 'number' ? Math.max(0, Math.min(10, Math.round(i.impactScore))) : null,
      relatedInsights: Array.isArray(i.relatedInsights) ? i.relatedInsights.slice(0, 5) : [],
    };
  });

  // Premium: group by area and category
  const byArea = {};
  const byCategory = {};
  for (const item of out) {
    if (!byArea[item.area]) byArea[item.area] = [];
    byArea[item.area].push(item);
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  return {
    ok: true,
    disclaimer: LOCAL_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    insights: out,
    byArea,
    byCategory,
    summary: {
      total: out.length,
      byArea: Object.fromEntries(Object.entries(byArea).map(([k, v]) => [k, v.length])),
      byCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])),
      highConfidence: out.filter(i => i.confidence === 'high').length,
      withActionItems: out.filter(i => i.actionItems.length > 0).length,
    },
    limitations: ['No live local feed is configured. Verify tenders, prices and government notifications on the official source before acting.'],
  };
}

/** Premium: trend analysis for local insights */
export function localTrends(insights, { days = 30 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const recent = insights.filter(i => i.verifiedAt && i.verifiedAt >= since);
  if (!recent.length) return { ok: true, trends: [], disclaimer: LOCAL_DISCLAIMER };

  const byCategory = {};
  for (const i of recent) {
    if (!byCategory[i.category]) byCategory[i.category] = [];
    byCategory[i.category].push(i);
  }

  const trends = Object.entries(byCategory).map(([cat, items]) => ({
    category: cat,
    count: items.length,
    avgConfidence: items.reduce((sum, i) => sum + (i.confidence === 'high' ? 3 : i.confidence === 'medium' ? 2 : 1), 0) / items.length,
    topAreas: Object.entries(items.reduce((acc, i) => { acc[i.area] = (acc[i.area] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3).map(a => a[0]),
    actionableCount: items.filter(i => i.actionItems.length > 0).length,
  })).sort((a, b) => b.count - a.count);

  return { ok: true, trends, periodDays: days, disclaimer: LOCAL_DISCLAIMER };
}

/** Premium: opportunity scoring for local insights */
export function scoreLocalOpportunity(insight) {
  const weights = { high: 3, medium: 2, low: 1, uncertain: 0, 'uncertain': 0 };
  const confidenceScore = weights[insight.confidence] || 0;
  const impactScore = insight.impactScore || 0;
  const actionScore = insight.actionItems?.length > 0 ? 2 : 0;
  const sourceScore = insight.sourceUrl ? 1 : 0;
  const total = Math.min(100, Math.round((confidenceScore * 15) + (impactScore * 8) + (actionScore * 10) + (sourceScore * 5)));
  
  let tier = 'monitor';
  if (total >= 70) tier = 'act_now';
  else if (total >= 50) tier = 'evaluate';
  else if (total >= 30) tier = 'watch';
  
  return { score: total, tier, confidence: insight.confidence, factors: { confidence: confidenceScore, impact: impactScore, action: actionScore, source: sourceScore } };
}