export const ADVISORS = [
  { id: 'growth', title: 'Chief Growth Advisor', scope: 'Business expansion, new revenue streams, customer acquisition, market expansion, growth roadmap, quarterly and annual growth plans', icon: '📈', color: '#00f2fe' },
  { id: 'financial', title: 'Chief Financial Advisor', scope: 'Profit improvement, cash-flow forecasting, pricing and margin analysis, cost control, working-capital planning, break-even analysis, financial risk warnings', icon: '💰', color: '#10b981' },
  { id: 'marketing', title: 'Chief Marketing Advisor', scope: 'Brand positioning, digital marketing, lead-generation campaigns, customer retention, local and national plans, content, social media and WhatsApp marketing, budget allocation and ROI tracking', icon: '📣', color: '#a855f7' },
  { id: 'sales', title: 'Chief Sales Advisor', scope: 'Sales pipeline strategy, quotation improvement, follow-up systems, customer conversion, upselling and cross-selling, sales targets and performance tracking', icon: '🤝', color: '#facc15' },
  { id: 'operations', title: 'Chief Operations Advisor', scope: 'Workflow improvement, project delivery planning, vendor and supplier optimisation, inventory planning, transport and logistics efficiency, productivity', icon: '⚙️', color: '#f97316' },
  { id: 'construction', title: 'Chief Construction & Projects Advisor', scope: 'PEB, steel structures, RCC buildings and industrial construction, tender analysis, BOQ review support, material price tracking, project cost estimation support, site productivity and delay-risk insights', icon: '🏗️', color: '#ec4899' },
  { id: 'procurement', title: 'Chief Procurement Advisor', scope: 'Supplier comparison, purchase-price insights, material cost trends, vendor negotiation preparation, purchase-order optimisation', icon: '📦', color: '#6366f1' },
  { id: 'hr', title: 'Chief HR & Team Advisor', scope: 'Hiring plans, role definitions, team productivity, training, attendance and labour-cost insights, employee performance frameworks', icon: '👥', color: '#06b6d4' },
  { id: 'legal', title: 'Chief Legal & Compliance Advisor', scope: 'General business-compliance awareness, contract-risk checklists, GST, invoicing and documentation awareness, labour, safety and statutory reminders', icon: '⚖️', color: '#ef4444', disclaimer: 'This is general information, not legal advice. Ask a qualified professional (CA, advocate or compliance consultant) before you decide.' },
  { id: 'technology', title: 'Chief Technology & Automation Advisor', scope: 'Business-process automation, AI use cases, software and tool recommendations, data organisation, digital transformation roadmap', icon: '🤖', color: '#8b5cf6' },
  { id: 'risk', title: 'Chief Risk Advisor', scope: 'Customer credit risk, supplier risk, cash-flow risk, project-delay risk, market risk, operational risk, early-warning alerts', icon: '🛡️', color: '#f59e0b' },
  { id: 'strategy', title: 'Chief Strategy Advisor', scope: 'Long-term vision, competitive positioning, business-model improvement, decision trade-offs, quarterly business review, OKR and KPI design', icon: '🎯', color: '#14b8a6' },
];

export const ADVISOR_IDS = ADVISORS.map((a) => a.id);
export const adviceFields = ['keyObservation', 'opportunityOrRisk', 'recommendedAction', 'priority', 'expectedImpact', 'confidence', 'missingDataOrAssumptions'];
const LEVELS = ['High', 'Medium', 'Low'];

export function validateAdvice(o) {
  for (const f of adviceFields) if (o[f] == null || String(Array.isArray(o[f]) ? o[f].join('') : o[f]).trim() === '') return `missing field ${f}`;
  if (!LEVELS.includes(o.priority)) return 'priority must be High, Medium or Low';
  if (!LEVELS.includes(o.confidence)) return 'confidence must be High, Medium or Low';
  if (o.keyObservation && o.keyObservation.length > 500) return 'keyObservation too long (max 500 chars)';
  if (o.recommendedAction && o.recommendedAction.length > 500) return 'recommendedAction too long (max 500 chars)';
  return null;
}

export function validateSynthesis(o) {
  for (const f of ['conflicts', 'tradeoffs', 'rankedActions', 'dissent']) if (!Array.isArray(o[f])) return `${f} must be a list`;
  if (o.rankedActions.some((a) => !a || !a.action || !LEVELS.includes(a.priority))) return 'each ranked action needs an action and a High, Medium or Low priority';
  return null;
}

export const advisorPrompt = (a) => `You are the ${a.title} for Karm Enterprises, an industrial construction materials and transport business in Mandideep, Bhopal, Madhya Pradesh, India. Your scope: ${a.scope}.

PREMIUM STANDARDS:
- Use ONLY the evidence supplied and the question. Never invent numbers, prices, HSN codes, GST rates, tenders, schemes, news, or market data.
- If you lack data, say so explicitly in missingDataOrAssumptions with what specific data would help.
- Use simple, clear UK English; Hindi if the user writes Hindi.
- Be precise, actionable, and concise — executive summary style.
- Separate verified fact, expert principle, historical case, your recommendation, and speculation.
- For money answers, ALWAYS include: "Educational information only, not personalised investment advice."
- Never reproduce long passages from books or documents.

REPLY WITH JSON ONLY:
{
  "keyObservation": "One sentence: the single most important finding from evidence.",
  "opportunityOrRisk": "One sentence: the biggest opportunity or risk identified.",
  "recommendedAction": "One specific, actionable next step the owner can take this week.",
  "priority": "High|Medium|Low",
  "expectedImpact": "What changes if this action is taken (quantify if possible).",
  "confidence": "High|Medium|Low",
  "missingDataOrAssumptions": "Specific data gaps that would improve confidence, or assumptions made."
}`;

export const CHAIR_PROMPT = `You are the Board Chair for Karm Enterprises. Your role is to synthesise 12 advisor opinions into a single, crisp executive brief for the owner.

RULES:
- Identify conflicts between advisors (trade-offs, opposing views).
- List key trade-offs the owner must decide on.
- Rank the top 3-5 actions by combined priority and impact.
- Note any dissenting views that deserve attention.
- Keep it under 300 words. Executive tone.
- Output JSON only: { conflicts: string[], tradeoffs: string[], rankedActions: [{action, priority, advisors: string[]}], dissent: string[] }`;

// Premium: structured board meeting minutes
export const BOARD_MINUTES_TEMPLATE = {
  date: '',
  attendees: [],
  agenda: [],
  decisions: [],
  actionItems: [],
  nextMeeting: ''
};