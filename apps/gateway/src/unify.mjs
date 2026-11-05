const RISK_STATUSES = new Set(['behind', 'at_risk', 'needs_inputs']);
const asArray = (value) => (Array.isArray(value) ? value : []);
const unique = (values) => [...new Set(values.filter(Boolean))];
const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Flux stamps its briefing in IST text; the web UI needs an ISO instant. */
export function parseIstStamp(value, fallback = new Date()) {
  if (typeof value !== 'string' || !value.trim()) return fallback.toISOString();
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?\s*IST$/.exec(value.trim());
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
  }
  const parsed = new Date(`${match[1]}T${match[2]}:${match[3] || '00'}+05:30`);
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

export function buildHealth({ counts = {}, goalStatuses = [], sources = [] } = {}) {
  const overdue = number(counts.overdueInvoices);
  const goalRiskCount = asArray(goalStatuses).filter((goal) => RISK_STATUSES.has(goal.status)).length;
  const openTasks = number(counts.openTasks);
  const sourceCoverage = asArray(sources).reduce((total, item) => total + number(item.records), 0);
  const score = Math.min(100, Math.max(0, Math.round(
    100 - overdue * 12 - goalRiskCount * 14 - Math.max(0, openTasks - 2) * 6 + Math.min(15, sourceCoverage / 10)
  )));

  let riskLevel = 'low';
  if (score < 35) riskLevel = 'critical';
  else if (score < 55) riskLevel = 'high';
  else if (score < 75) riskLevel = 'medium';

  const nextBestActions = [];
  if (overdue > 0) nextBestActions.push(`Clear ${overdue} overdue invoice issue${overdue === 1 ? '' : 's'} before taking on new commitments.`);
  if (goalRiskCount > 0) nextBestActions.push(`Reconfirm ${goalRiskCount} goal${goalRiskCount === 1 ? '' : 's'} with the owner and review the assumptions behind the slippage.`);
  else nextBestActions.push('Keep the goal rhythm stable; review the target only when the current week closes or the assumptions change.');
  if (openTasks > 0) nextBestActions.push(`Reduce the queue by giving ownership to the ${Math.min(3, openTasks)} highest-impact task${Math.min(3, openTasks) === 1 ? '' : 's'} that are still open.`);
  else nextBestActions.push('The queue is light; use the next block for conversion, margin, or learning work rather than more admin.');

  const summary = overdue > 0 || goalRiskCount > 0 || openTasks > 0
    ? `Flux sees ${overdue} overdue invoice signal${overdue === 1 ? '' : 's'}, ${goalRiskCount} goal risk${goalRiskCount === 1 ? '' : 's'}, and ${openTasks} active task${openTasks === 1 ? '' : 's'} in the current operating snapshot.`
    : 'Flux is stable right now: there are no active blockers in the currently loaded source set.';

  return {
    score,
    riskLevel,
    summary,
    nextBestAction: nextBestActions[0],
    nextBestActions: nextBestActions.slice(0, 3),
    sourceCoverage,
  };
}

export function fallbackBriefing(proxy, reason) {
  return {
    ...proxy,
    engine: {
      name: 'karm-proxy',
      degraded: true,
      reason,
      modelConfigured: false,
    },
  };
}

/**
 * The proxy briefing owns KARM goals/tasks and practice records. Flux owns the
 * Zoho-backed briefing sections and their verification status. Merge both without
 * double-counting overdue invoices, then recompute one health profile.
 */
export function mergeBriefing({ proxy = {}, flux = null, modelConfigured = false } = {}) {
  if (!flux || !asArray(flux.sections).length) {
    return fallbackBriefing(proxy, 'Flux has not produced a briefing yet; showing the proxy briefing.');
  }

  const sections = asArray(flux.sections);
  const overdueSection = sections.find((section) => section.id === 'overdue');
  const zohoReadable = Boolean(overdueSection) && !/could not read zoho/i.test(String(overdueSection.reason || ''));
  const overdueItems = zohoReadable ? asArray(overdueSection.items) : [];
  const proxyAttention = asArray(proxy.attention);
  const baseAttention = zohoReadable ? proxyAttention.filter((item) => item.kind !== 'overdue_invoice') : proxyAttention;
  const attention = [...baseAttention];

  if (zohoReadable) {
    for (const item of overdueItems) {
      attention.push({
        kind: 'overdue_invoice',
        title: 'Review overdue invoice',
        detail: item.text,
        source: item.evidence || 'zoho:invoices:overdue',
        action: 'Review the Zoho invoice and confirm the follow-up.',
      });
    }
  }

  for (const section of sections) {
    if (section.id === 'overdue') continue;
    if (section.status === 'Verified') continue;
    const items = asArray(section.items);
    if (!items.length) continue;
    for (const item of items.slice(0, 2)) {
      attention.push({
        kind: `flux_${section.id}`,
        title: `${section.title} · ${section.status}`,
        detail: item.text,
        source: item.evidence || `flux:${section.id}`,
        action: section.reason || 'Review this section before acting on it.',
      });
    }
  }

  const seen = new Set();
  const dedupedAttention = attention.filter((item) => {
    const key = `${item.kind}|${item.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const sources = [...asArray(proxy.sources)];
  const fluxItemCount = sections.reduce((total, section) => total + asArray(section.items).length, 0);
  if (!sources.some((source) => source.name === 'Flux briefing')) {
    sources.push({
      name: 'Flux briefing',
      records: fluxItemCount,
      scope: `${sections.length} sections · ${asArray(flux.unverified).length} unverified`,
    });
  }

  const counts = {
    ...(proxy.counts || {}),
    overdueInvoices: zohoReadable ? overdueItems.length : number(proxy.counts?.overdueInvoices),
  };
  const goalStatuses = asArray(proxy.goalStatuses);
  const health = buildHealth({ counts, goalStatuses, sources });

  return {
    ...proxy,
    generatedAt: parseIstStamp(flux.generatedAt),
    mode: zohoReadable ? 'live' : proxy.mode,
    headline: flux.headline || proxy.headline,
    counts,
    attention: dedupedAttention,
    sources,
    health,
    engine: {
      name: 'flux',
      modelConfigured: Boolean(modelConfigured),
      briefingDate: flux.date || null,
      status: flux.status || null,
      unverified: asArray(flux.unverified),
      zohoReadable,
      degraded: !zohoReadable,
    },
    fluxSections: sections,
    unverified: asArray(flux.unverified),
  };
}

export function normalizeFluxAnswer(result, { context = null } = {}) {
  if (!result || typeof result !== 'object') return null;
  const answer = typeof result.answer === 'string' ? result.answer.trim() : '';
  if (!answer) return null;

  const warnings = asArray(result.warnings).filter((item) => typeof item === 'string' && item.trim());
  const unsupportedNumbers = asArray(result.unsupportedNumbers);
  const verificationUnsupported = asArray(result.verification?.unsupported);
  const limitations = unique([
    ...warnings,
    ...(unsupportedNumbers.length ? ['Some figures could not be matched to the evidence and were removed from the answer.'] : []),
    ...verificationUnsupported.map((item) => `Not supported by the evidence: ${String(item).slice(0, 300)}`),
  ]);

  let confidence = 'medium';
  if (result.verification?.done && verificationUnsupported.length === 0 && warnings.length === 0 && unsupportedNumbers.length === 0) confidence = 'high';
  if (result.verification?.done && verificationUnsupported.length > 0) confidence = 'low';

  const evidence = asArray(result.evidence).map((item) => {
    const source = typeof item?.source === 'string' ? item.source : 'Flux';
    const parts = source.split(':');
    return {
      name: item?.label || item?.id || 'Flux evidence',
      source,
      ...(parts.length > 2 && parts[2] ? { recordId: parts.slice(2).join(':') } : {}),
    };
  });

  const screen = typeof context?.page === 'string' && context.page ? ` · screen ${context.page}` : '';
  return {
    answer,
    confidence,
    dataSources: evidence,
    limitations,
    recommendedActions: [],
    draft: null,
    approval: { required: false },
    source: `Flux · ${result.model || 'configured model'}`,
    modelConfigured: true,
    evidence,
    scope: evidence.length
      ? `Grounded on ${evidence.length} server-fetched source${evidence.length === 1 ? '' : 's'}${screen}`
      : `No server-side evidence was needed for this answer${screen}`,
    verification: result.verification || { done: false },
    auditId: result.auditId ?? null,
    engine: {
      name: 'flux',
      model: result.model || null,
      fallbackUsed: Boolean(result.fallbackUsed),
    },
  };
}

export function measurementAnswer(measurement) {
  return {
    answer: measurement.explanation,
    confidence: measurement.confidence,
    dataSources: [{ name: 'Deterministic measurement constants', source: 'Flux measurement engine; no live values assumed' }],
    limitations: measurement.supported ? [] : [measurement.explanation],
    recommendedActions: measurement.supported
      ? []
      : ['Provide the missing fixed unit, local factor, analyte, or verified exchange rate and ask again.'],
    draft: null,
    approval: null,
    source: 'Flux Measurement Engine',
    modelConfigured: false,
    evidence: [],
    scope: measurement.supported ? 'Formula-based unit conversion' : 'Conversion requires additional verified context',
    measurement,
    engine: { name: 'flux-measurement', deterministic: true },
  };
}
