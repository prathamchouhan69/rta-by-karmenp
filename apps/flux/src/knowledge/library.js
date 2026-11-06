import { FINANCE_ENTRIES } from './entries/finance.js';
import { BUSINESS_ENTRIES } from './entries/business.js';
import { STARTUP_ENTRIES } from './entries/startups.js';
import { MARKETING_ENTRIES } from './entries/marketing.js';
import { OPERATIONS_ENTRIES } from './entries/operations.js';
import { ECONOMICS_ENTRIES } from './entries/economics.js';
import { HEALTH_ENTRIES } from './entries/health.js';
import { INDIA_ENTRIES } from './entries/india.js';
import { AI_ENTRIES } from './entries/ai.js';
import { CASE_ENTRIES } from './entries/cases.js';

export const KNOWLEDGE_DISCLAIMER = 'Flux extracts principles, frameworks and lessons in its own words. It does not reproduce book text or claim to have read a book as a person does.';
export const INVESTMENT_DISCLAIMER = 'Educational information only, not personalised investment advice.';
export const HEALTH_DISCLAIMER = 'This is general health information, not medical advice.';
export const INDIA_VERIFY_NOTE = 'For India-specific tax, legal, GST, company or regulatory questions, verify with a qualified CA, CS, advocate or the official government source.';

const ALL = [
  ...FINANCE_ENTRIES, ...BUSINESS_ENTRIES, ...STARTUP_ENTRIES, ...MARKETING_ENTRIES,
  ...OPERATIONS_ENTRIES, ...ECONOMICS_ENTRIES, ...HEALTH_ENTRIES, ...INDIA_ENTRIES,
  ...AI_ENTRIES, ...CASE_ENTRIES,
];

const REQUIRED = ['id', 'title', 'author', 'category', 'coreIdeas', 'practicalLessons', 'source', 'confidence'];
const ids = new Set();
for (const entry of ALL) {
  for (const key of REQUIRED) {
    const value = entry[key];
    if (value == null || (Array.isArray(value) && value.length === 0) || value === '') throw new Error(`Knowledge entry ${entry.id || '(no id)'} is missing ${key}`);
  }
  if (ids.has(entry.id)) throw new Error(`Duplicate knowledge id: ${entry.id}`);
  ids.add(entry.id);
}

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'with', 'is', 'are', 'how', 'what', 'why', 'from', 'by', 'at', 'as', 'it', 'this', 'that']);
const tokens = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, ' ').trim().split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));

const INDEX = new Map(ALL.map((entry) => {
  const parts = [
    entry.title, entry.author, entry.category, entry.type,
    ...(entry.coreIdeas || []), ...(entry.frameworks || []), ...(entry.practicalLessons || []),
    ...(entry.mistakesToAvoid || []), ...(entry.lessons || []), ...(entry.warningSigns || []),
    entry.situation || '', entry.whatHappened || '',
    ...Object.values(entry.applications || {}),
  ];
  return [entry.id, new Set(tokens(parts.join(' ')))];
}));

const publicEntry = (entry) => ({
  id: entry.id, type: entry.type, title: entry.title, author: entry.author, year: entry.year,
  category: entry.category, source: entry.source, confidence: entry.confidence, reviewedAt: entry.reviewedAt,
  coreIdeas: entry.coreIdeas, frameworks: entry.frameworks || [], practicalLessons: entry.practicalLessons,
  mistakesToAvoid: entry.mistakesToAvoid || [], applications: entry.applications || {},
  limitations: entry.limitations || [], ...(entry.disclaimer ? { disclaimer: entry.disclaimer } : {}),
  ...(entry.situation ? { situation: entry.situation, whatHappened: entry.whatHappened } : {}),
});

export function knowledgeStats() {
  const byCategory = {};
  const byType = {};
  for (const entry of ALL) { byCategory[entry.category] = (byCategory[entry.category] || 0) + 1; byType[entry.type] = (byType[entry.type] || 0) + 1; }
  return { total: ALL.length, byCategory, byType, reviewedAt: '2026-11-06', disclaimer: KNOWLEDGE_DISCLAIMER };
}

export function listCategories() {
  const stats = knowledgeStats();
  return Object.entries(stats.byCategory).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}

export function getKnowledge(id) {
  const entry = ALL.find((e) => e.id === id);
  if (!entry) return null;
  return {
    ...publicEntry(entry),
    howToUse: 'Apply the principle to the actual decision. Separate verified fact, expert principle, historical case, Flux recommendation and speculation. Cite the source when you share it.',
    disclaimers: [KNOWLEDGE_DISCLAIMER, ...(entry.category === 'health' ? [HEALTH_DISCLAIMER] : []), ...(entry.category === 'personal_finance' || entry.category === 'india_business' ? [INVESTMENT_DISCLAIMER, INDIA_VERIFY_NOTE] : [])],
  };
}

export function searchKnowledge({ query = '', category = null, type = null, limit = 20 } = {}) {
  const q = tokens(query);
  const cat = category ? String(category).toLowerCase() : null;
  const kind = type ? String(type).toLowerCase() : null;
  const pool = ALL.filter((entry) => (!cat || entry.category === cat) && (!kind || entry.type === kind));
  if (!q.length) {
    return {
      ok: true, query: '', count: Math.min(pool.length, Math.max(1, Math.min(Number(limit) || 20, 100))),
      results: pool.slice(0, Math.max(1, Math.min(Number(limit) || 20, 100))).map((e) => ({ id: e.id, title: e.title, author: e.author, category: e.category, type: e.type, confidence: e.confidence })),
      disclaimer: KNOWLEDGE_DISCLAIMER,
    };
  }
  const scored = pool.map((entry) => {
    const doc = INDEX.get(entry.id);
    let score = 0;
    for (const token of q) {
      if (doc.has(token)) score += 2;
      else if ([...doc].some((d) => d.startsWith(token) || token.startsWith(d))) score += 1;
    }
    const titleText = `${entry.title} ${entry.author}`.toLowerCase();
    for (const token of q) if (titleText.includes(token)) score += 4;
    return { entry, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  const max = Math.max(1, Math.min(Number(limit) || 20, 100));
  return {
    ok: true, query: String(query).slice(0, 300), count: Math.min(scored.length, max),
    results: scored.slice(0, max).map(({ entry, score }) => ({
      id: entry.id, title: entry.title, author: entry.author, category: entry.category, type: entry.type,
      confidence: entry.confidence, relevance: score, summary: entry.coreIdeas[0],
    })),
    totalMatches: scored.length,
    disclaimer: KNOWLEDGE_DISCLAIMER,
    limitations: ['Search is keyword-based over curated summaries, not a live web search or a full-text book index.'],
  };
}

const CONTEXT_MAP = {
  money: ['personal_finance', 'economics'],
  wealth: ['personal_finance', 'economics'],
  business: ['business_strategy', 'marketing_sales', 'operations'],
  construction: ['operations', 'business_strategy', 'case_studies'],
  startup: ['startups', 'case_studies', 'ai_technology'],
  health: ['health'],
  india: ['india_business', 'government_schemes'],
  ai: ['ai_technology'],
  marketing: ['marketing_sales'],
  operations: ['operations'],
};

export function recommendKnowledge({ context = 'business', limit = 8 } = {}) {
  const key = String(context || 'business').toLowerCase();
  const categories = CONTEXT_MAP[key] || [key];
  const chosen = ALL.filter((e) => categories.includes(e.category)).slice(0, Math.max(1, Math.min(Number(limit) || 8, 30)));
  return {
    ok: true, context: key, categories,
    recommendations: chosen.map((e) => ({ id: e.id, title: e.title, author: e.author, category: e.category, coreIdea: e.coreIdeas[0], application: e.applications?.[key === 'money' || key === 'wealth' ? 'money' : key] || null })),
    disclaimer: KNOWLEDGE_DISCLAIMER,
    ...(key === 'health' ? { healthDisclaimer: HEALTH_DISCLAIMER } : {}),
    ...(key === 'money' || key === 'wealth' ? { investmentDisclaimer: INVESTMENT_DISCLAIMER } : {}),
    ...(key === 'india' ? { verifyNote: INDIA_VERIFY_NOTE } : {}),
    limitations: ['Recommendations are curated starting points, not personalised professional advice.'],
  };
}
