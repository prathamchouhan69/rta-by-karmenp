// Flux Local Aunty Mode — Mandideep, Bhopal, Madhya Pradesh, India, Global.
// All entries are caller-supplied or explicitly uncertain.

export const LOCAL_DISCLAIMER = 'Local observations are caller-supplied and should be verified before you act on them.';

function clip(s, n = 400) { return String(s || '').slice(0, n); }

export function localInsights(input = {}) {
  const areas = ['Mandideep', 'Bhopal', 'Madhya Pradesh', 'India', 'Global'];
  const items = Array.isArray(input.insights) ? input.insights : [];
  const out = items.map((i) => {
    const area = areas.includes(String(i.area)) ? String(i.area) : 'uncertain';
    return {
      area,
      whatHappened: clip(i.whatHappened, 400),
      whyItMatters: clip(i.whyItMatters, 400),
      opportunity: clip(i.opportunity, 400),
      whoToContact: clip(i.whoToContact, 300),
      howToEarn: clip(i.howToEarn, 400),
      jugaadApproach: clip(i.jugaadApproach, 400),
      risk: clip(i.risk, 400),
      source: clip(i.source, 160),
      sourceUrl: i.sourceUrl == null ? null : String(i.sourceUrl).slice(0, 500),
      verifiedAt: i.verifiedAt == null ? null : String(i.verifiedAt).slice(0, 40),
      confidence: i.confidence === 'high' || i.confidence === 'medium' || i.confidence === 'low' ? i.confidence : 'uncertain',
    };
  });
  return {
    ok: true,
    disclaimer: LOCAL_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    insights: out,
    limitations: ['No live local feed is configured. Verify tenders, prices and government notifications on the official source before acting.'],
  };
}