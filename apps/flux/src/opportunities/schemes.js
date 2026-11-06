// Curated government-scheme discovery. This is a static, reviewed directory,
// not a live eligibility engine. Every entry points to an official source and
// requires verification before applying.
import { searchKnowledge, getKnowledge, KNOWLEDGE_DISCLAIMER, INDIA_VERIFY_NOTE } from '../knowledge/library.js';

const LAST_REVIEWED = '2026-11-06';
const urlFromSource = (source) => {
  const match = String(source || '').match(/https:\/\/[^\s)]+/);
  return match ? match[0] : null;
};

const publicScheme = (entry) => ({
  id: entry.id, title: entry.title, author: entry.author, year: entry.year,
  officialUrl: urlFromSource(entry.source), source: entry.source,
  whatItIs: entry.coreIdeas?.[0] || null, practicalSteps: entry.practicalLessons || [],
  avoid: entry.mistakesToAvoid || [], limitations: entry.limitations || [], confidence: entry.confidence || 'medium',
});

export function listSchemes() {
  const search = searchKnowledge({ category: 'government_schemes', limit: 100 });
  const schemes = search.results.map((result) => getKnowledge(result.id)).filter(Boolean).map(publicScheme);
  return {
    ok: true, count: schemes.length, lastReviewed: LAST_REVIEWED, live: false, sourceType: 'curated_static',
    schemes, verificationRequired: true, verifyNote: INDIA_VERIFY_NOTE,
    disclaimer: KNOWLEDGE_DISCLAIMER,
    limitations: ['This directory does not check your eligibility, turnover, entity age, location or documents.', 'Rules, amounts and deadlines change. Always use the official portal linked on each entry.'],
  };
}

export function findSchemes({ query = '', limit = 20 } = {}) {
  const search = searchKnowledge({ query, category: 'government_schemes', limit });
  const schemes = search.results.map((result) => getKnowledge(result.id)).filter(Boolean).map(publicScheme);
  return {
    ok: true, query: String(query || '').slice(0, 300), count: schemes.length, lastReviewed: LAST_REVIEWED, live: false,
    sourceType: 'curated_static', schemes, verificationRequired: true, verifyNote: INDIA_VERIFY_NOTE,
    disclaimer: KNOWLEDGE_DISCLAIMER,
    limitations: ['Keyword matching over a small curated directory, not a live government database.', 'A scheme appearing here does not mean you qualify or that funding is available.'],
  };
}

export function schemeGuidance() {
  return {
    ok: true, lastReviewed: LAST_REVIEWED,
    checklist: [
      { step: 'Identify the exact scheme and the official portal', detail: 'Prefer a .gov.in or official institutional domain. Ignore forwarded screenshots and unofficial agents.' },
      { step: 'Match the entity and activity', detail: 'Check entity type, age, turnover, sector, location and ownership against the current guidelines.' },
      { step: 'Prepare primary documents', detail: 'PAN, GST, Udyam, bank details, incorporation documents, financial statements and project report as applicable.' },
      { step: 'Model the cash flow, not only the subsidy', detail: 'A subsidised loan is still a loan. Check repayment, margin money, processing fees and timelines.' },
      { step: 'Apply only through the official channel', detail: 'Keep acknowledgement numbers, receipts and copies. Never pay an unofficial agent for a guaranteed approval.' },
      { step: 'Verify tax and legal treatment with a professional', detail: 'Subsidy, grant and incentive treatment can differ. Ask a CA or CS before filing.' },
    ],
    commonTraps: ['Guaranteed-approval agents', 'Fees paid before reading the guidelines', 'Borrowing more than the cash flow can service', 'Assuming a scheme is live because an old article says so'],
    verifyNote: INDIA_VERIFY_NOTE, disclaimer: KNOWLEDGE_DISCLAIMER,
  };
}
