// Honest live-data status. Flux has no live market, news, tender, currency or
// economy feed configured in this build. These endpoints say so plainly instead
// of inventing a number or a headline.
const SOURCES = {
  economy: [
    { name: 'Reserve Bank of India', url: 'https://www.rbi.org.in' },
    { name: 'Ministry of Statistics and Programme Implementation', url: 'https://www.mospi.gov.in' },
  ],
  currency: [
    { name: 'Financial Benchmarks India (FBIL)', url: 'https://www.fbil.org.in' },
    { name: 'Reserve Bank of India reference rate', url: 'https://www.rbi.org.in' },
  ],
  tenders: [
    { name: 'Government e-Marketplace', url: 'https://gem.gov.in' },
    { name: 'Central Public Procurement Portal', url: 'https://eprocure.gov.in' },
  ],
  schemes: [
    { name: 'Udyam registration', url: 'https://udyamregistration.gov.in' },
    { name: 'Startup India', url: 'https://www.startupindia.gov.in' },
    { name: 'MSME Samadhaan', url: 'https://samadhaan.msme.gov.in' },
  ],
  news: [
    { name: 'Press Information Bureau', url: 'https://pib.gov.in' },
  ],
  market_prices: [
    { name: 'Your dated material-price book', url: '/v1/material-prices' },
  ],
  local: [
    { name: 'District administration and municipal corporation websites', url: null },
  ],
};

const DOMAINS = Object.freeze({
  economy: {
    label: 'Economy indicators',
    why: 'GDP, inflation, industrial output and policy rates need a verified series with a date and definition.',
    alternative: 'Ask a general concept question through the knowledge library, or supply a dated official figure yourself.',
  },
  currency: {
    label: 'Currency rates',
    why: 'A currency rate changes constantly and must carry a timestamp and source.',
    alternative: 'Use the measurement converter with your own verified rates; it will refuse to guess.',
  },
  tenders: {
    label: 'Live tenders',
    why: 'A tender is only actionable from the official portal, with the current dates and documents.',
    alternative: 'Use the tender checklist and the official portal links. Flux will not invent a tender.',
  },
  schemes: {
    label: 'Government schemes',
    why: 'Eligibility, amounts and deadlines change; only the official portal is authoritative.',
    alternative: 'Use the curated scheme directory with its official links and verify before applying.',
  },
  news: {
    label: 'News',
    why: 'A headline without a source, date and context is easy to misunderstand.',
    alternative: 'Use the read-only public-page tool on an allowlisted official domain, or supply the text yourself.',
  },
  market_prices: {
    label: 'Market prices',
    why: 'Steel, cement and other prices vary by grade, location, quantity and date.',
    alternative: 'Record dated, source-labelled observations in the material price book. Flux will show the trend and uncertainty.',
  },
  local: {
    label: 'Local intelligence',
    why: 'Local opportunities, closures, approvals and events need a verified local source.',
    alternative: 'Use the local checklist and verify with the municipal or district office.',
  },
});

const item = (key) => ({
  domain: key, label: DOMAINS[key].label, live: false, status: 'not_configured', confidence: 'uncertain',
  lastUpdated: null, configuredSource: null, officialSources: SOURCES[key] || [],
  whyItMatters: DOMAINS[key].why, alternative: DOMAINS[key].alternative,
  guardrail: 'Flux will not invent a live value, headline, tender, scheme, price or rate for this domain.',
});

export function liveStatus() {
  return {
    ok: true, liveDataAvailable: false, code: 'LIVE_DATA_NOT_CONFIGURED',
    message: 'No live economy, currency, tender, scheme, news, market-price or local feed is configured on this server. Flux will not invent one.',
    domains: Object.keys(DOMAINS).map(item),
    safeAlternatives: [
      'Currency conversion with caller-supplied rates.',
      'Dated material prices recorded with a source and verification date.',
      'Curated knowledge search with cited sources.',
      'Read-only public-page reading on an operator-configured allowlist.',
    ],
    limitations: ['A feed being added later must include a source, timestamp, definition and freshness check before Flux presents it as live.'],
  };
}

export function liveDomain(domain) {
  const key = String(domain || '').toLowerCase();
  if (!DOMAINS[key]) return { ok: false, code: 'UNKNOWN_DOMAIN', message: `Unknown live-data domain. Choose one of: ${Object.keys(DOMAINS).join(', ')}.`, confidence: 'high' };
  return { ok: false, code: 'LIVE_DATA_NOT_CONFIGURED', message: `${DOMAINS[key].label} are not connected to a verified live source on this server.`, item: item(key) };
}

export { DOMAINS as LIVE_DOMAINS };
