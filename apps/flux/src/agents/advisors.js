export const ADVISORS = [
  { id: 'growth', title: 'Chief Growth Advisor', scope: 'Business expansion, new revenue streams, customer acquisition, market expansion, growth roadmap, quarterly and annual growth plans' },
  { id: 'financial', title: 'Chief Financial Advisor', scope: 'Profit improvement, cash-flow forecasting, pricing and margin analysis, cost control, working-capital planning, break-even analysis, financial risk warnings' },
  { id: 'marketing', title: 'Chief Marketing Advisor', scope: 'Brand positioning, digital marketing, lead-generation campaigns, customer retention, local and national plans, content, social media and WhatsApp marketing, budget allocation and ROI tracking' },
  { id: 'sales', title: 'Chief Sales Advisor', scope: 'Sales pipeline strategy, quotation improvement, follow-up systems, customer conversion, upselling and cross-selling, sales targets and performance tracking' },
  { id: 'operations', title: 'Chief Operations Advisor', scope: 'Workflow improvement, project delivery planning, vendor and supplier optimisation, inventory planning, transport and logistics efficiency, productivity' },
  { id: 'construction', title: 'Chief Construction & Projects Advisor', scope: 'PEB, steel structures, RCC buildings and industrial construction, tender analysis, BOQ review support, material price tracking, project cost estimation support, site productivity and delay-risk insights' },
  { id: 'procurement', title: 'Chief Procurement Advisor', scope: 'Supplier comparison, purchase-price insights, material cost trends, vendor negotiation preparation, purchase-order optimisation' },
  { id: 'hr', title: 'Chief HR & Team Advisor', scope: 'Hiring plans, role definitions, team productivity, training, attendance and labour-cost insights, employee performance frameworks' },
  { id: 'legal', title: 'Chief Legal & Compliance Advisor', scope: 'General business-compliance awareness, contract-risk checklists, GST, invoicing and documentation awareness, labour, safety and statutory reminders', disclaimer: 'This is general information, not legal advice. Ask a qualified professional (CA, advocate or compliance consultant) before you decide.' },
  { id: 'technology', title: 'Chief Technology & Automation Advisor', scope: 'Business-process automation, AI use cases, software and tool recommendations, data organisation, digital transformation roadmap' },
  { id: 'risk', title: 'Chief Risk Advisor', scope: 'Customer credit risk, supplier risk, cash-flow risk, project-delay risk, market risk, operational risk, early-warning alerts' },
  { id: 'strategy', title: 'Chief Strategy Advisor', scope: 'Long-term vision, competitive positioning, business-model improvement, decision trade-offs, quarterly business review, OKR and KPI design' },
];
export const ADVISOR_IDS = ADVISORS.map((a) => a.id);
export const adviceFields = ['keyObservation', 'opportunityOrRisk', 'recommendedAction', 'priority', 'expectedImpact', 'confidence', 'missingDataOrAssumptions'];
const LEVELS = ['High', 'Medium', 'Low'];

export function validateAdvice(o) {
  for (const f of adviceFields) if (o[f] == null || String(Array.isArray(o[f]) ? o[f].join('') : o[f]).trim() === '') return `missing field ${f}`;
  if (!LEVELS.includes(o.priority)) return 'priority must be High, Medium or Low';
  if (!LEVELS.includes(o.confidence)) return 'confidence must be High, Medium or Low';
  return null;
}
export function validateSynthesis(o) {
  for (const f of ['conflicts', 'tradeoffs', 'rankedActions', 'dissent']) if (!Array.isArray(o[f])) return `${f} must be a list`;
  if (o.rankedActions.some((a) => !a || !a.action || !LEVELS.includes(a.priority))) return 'each ranked action needs an action and a High, Medium or Low priority';
  return null;
}
export const advisorPrompt = (a) => `You are the ${a.title} for Karm Enterprises, an industrial construction materials and transport business in Mandideep, Bhopal, Madhya Pradesh, India. Your scope: ${a.scope}.
Use only the evidence supplied and the question. Never invent numbers, prices, HSN codes, GST rates, tenders, schemes or news. If you lack data, say so in missingDataOrAssumptions. Use simple, clear language.
Reply with JSON only: {"keyObservation": string, "opportunityOrRisk": string, "recommendedAction": string, "priority": "High"|"Medium"|"Low", "expectedImpact": string, "confidence": "High"|"Medium"|"Low", "missingDataOrAssumptions": string}`;
