import { z } from 'zod';

const finite = z.number().finite();
const nonNegative = finite.nonnegative();
const positive = finite.positive();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Use a real calendar date');
const percent = finite.min(0).max(100);
const currency = z.string().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase()).default('INR');
const shortText = (max = 120) => z.string().trim().min(1).max(max);
const optionalText = (max = 300) => z.string().trim().max(max).optional();

const expenseItem = z.object({
  category: shortText(80),
  amount: nonNegative,
  essential: z.boolean().default(true),
}).strict();

const assetItem = z.object({
  name: optionalText(120),
  class: z.enum(['cash', 'fixed_deposit', 'debt', 'equity', 'real_estate', 'gold', 'business', 'retirement', 'other']).default('other'),
  value: nonNegative,
}).strict();

const liabilityItem = z.object({
  name: optionalText(120),
  class: z.enum(['home_loan', 'vehicle_loan', 'personal_loan', 'business_loan', 'credit_card', 'tax', 'other']).default('other'),
  value: nonNegative,
  interestRatePercent: percent.optional(),
}).strict();

export const budgetPlanSchema = z.object({
  monthlyIncome: positive,
  expenses: z.array(expenseItem).max(100).default([]),
  debtPayments: nonNegative.default(0),
  savingsGoal: nonNegative.default(0),
  liquidSavings: nonNegative.default(0),
  currency,
  notes: z.array(z.string().trim().max(300)).max(20).default([]),
}).strict();

export const savingsGoalSchema = z.object({
  targetAmount: positive,
  currentSavings: nonNegative.default(0),
  monthlyContribution: nonNegative.default(0),
  annualReturnPercent: finite.min(-99).max(100).nullable().default(null),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  currency,
}).strict();

export const expenseReviewSchema = z.object({
  expenses: z.array(expenseItem).min(1).max(100),
  monthlyIncome: positive.nullable().default(null),
  currency,
}).strict();

export const netWorthSchema = z.object({
  assets: z.array(assetItem).max(100).default([]),
  liabilities: z.array(liabilityItem).max(100).default([]),
  currency,
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export const compoundSchema = z.object({
  principal: nonNegative.default(0),
  monthlyContribution: nonNegative.default(0),
  annualRatePercent: finite.min(-99).max(100),
  years: positive.max(80),
  inflationPercent: finite.min(-50).max(100).default(0),
  currency,
}).strict();

export const retirementGapSchema = z.object({
  currentAge: finite.min(15).max(100),
  retirementAge: finite.min(16).max(100),
  lifeExpectancy: finite.min(30).max(120).default(85),
  monthlyExpensesToday: positive,
  inflationPercent: finite.min(-50).max(100),
  preRetirementReturnPercent: finite.min(-99).max(100),
  postRetirementReturnPercent: finite.min(-99).max(100),
  currentCorpus: nonNegative.default(0),
  monthlyContribution: nonNegative.default(0),
  currency,
}).strict();

export const runwaySchema = z.object({
  cashBalance: nonNegative,
  monthlyRevenue: nonNegative.default(0),
  monthlyExpenses: positive,
  monthlyRevenueGrowthPercent: finite.min(-100).max(500).default(0),
  months: z.number().int().min(1).max(120).default(36),
  currency,
}).strict();

export const burnMultipleSchema = z.object({
  netBurn: positive,
  netNewRevenue: nonNegative,
  periodMonths: z.number().int().min(1).max(120).default(12),
}).strict();

export const dilutionSchema = z.object({
  preMoneyValuation: positive,
  investmentAmount: positive,
  optionPoolPercent: percent.default(0),
  existingInvestorPercent: percent.default(0),
}).strict();

export const startupSnapshotSchema = z.object({
  cashBalance: nonNegative,
  monthlyRevenue: nonNegative.default(0),
  monthlyExpenses: positive,
  monthlyRevenueGrowthPercent: finite.min(-100).max(500).default(0),
  pricePerUnit: positive,
  variableCostPerUnit: nonNegative,
  customerAcquisitionCost: nonNegative.default(0),
  lifetimeMonths: finite.min(1).max(600).default(12),
  fixedCosts: nonNegative.default(0),
  existingMonthlyEmi: nonNegative.default(0),
  currency,
}).strict();

export const ocrExtractSchema = z.object({
  text: z.string().max(100000).optional(),
  filename: z.string().trim().max(200).optional(),
  textSource: z.string().trim().max(80).default('caller-supplied'),
}).strict();

export const schemeSearchSchema = z.object({
  query: z.string().trim().max(300).default(''),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

const economyEvent = z.object({
  event: z.string().trim().max(200),
  date: z.string().trim().max(40).optional(),
  source: z.string().trim().max(160),
  sourceUrl: z.string().url().max(500).optional(),
  whatHappened: z.string().trim().max(600),
  whyItMatters: z.string().trim().max(600),
  impactOnRTA: z.string().trim().max(400),
  impactOnMyMoney: z.string().trim().max(400),
  opportunity: z.string().trim().max(400),
  risk: z.string().trim().max(400),
  recommendedAction: z.string().trim().max(400),
  jugaadAction: z.string().trim().max(400),
  confidence: z.enum(['high', 'medium', 'low', 'uncertain']).default('uncertain'),
}).strict();

export const economyBriefSchema = z.object({ events: z.array(economyEvent).max(200).default([]) }).strict();

export const priceTrendRowsSchema = z.object({
  rows: z.array(z.object({
    material: z.string().trim().min(1).max(120),
    price: positive,
    date: dateOnly,
  }).strict()).max(500).default([]),
}).strict();

export const trendRadarSchema = z.object({
  trends: z.array(z.object({
    id: z.string().trim().max(80).optional(),
    trend: z.string().trim().max(200),
    category: z.string().trim().max(40).default('general'),
    whatChanged: z.string().trim().max(400),
    whyItMatters: z.string().trim().max(400),
    impactOnRTA: z.string().trim().max(400),
    opportunity: z.string().trim().max(400),
    risk: z.string().trim().max(400),
    timeHorizon: z.string().trim().max(40).default('unknown'),
    recommendedAction: z.string().trim().max(400),
    confidence: z.enum(['high', 'medium', 'low', 'uncertain']).default('uncertain'),
  }).strict()).max(200).default([]),
}).strict();

export const opportunityAlertsSchema = z.object({
  alerts: z.array(z.object({
    id: z.string().trim().max(80).optional(),
    type: z.string().trim().max(40).default('opportunity'),
    whatHappened: z.string().trim().max(400),
    whyItMatters: z.string().trim().max(400),
    moneyOpportunity: z.string().trim().max(400),
    deadline: z.string().trim().max(40).optional(),
    firstAction: z.string().trim().max(400),
    jugaadAction: z.string().trim().max(400),
    risk: z.string().trim().max(400),
    source: z.string().trim().max(160),
    sourceUrl: z.string().url().max(500).optional(),
    confidence: z.enum(['high', 'medium', 'low', 'uncertain']).default('uncertain'),
    approvalRequired: z.boolean().default(true),
  }).strict()).max(200).default([]),
}).strict();

const localInsight = z.object({
  area: z.string().trim().max(40).default('uncertain'),
  whatHappened: z.string().trim().max(400),
  whyItMatters: z.string().trim().max(400),
  opportunity: z.string().trim().max(400),
  whoToContact: z.string().trim().max(300),
  howToEarn: z.string().trim().max(400),
  jugaadApproach: z.string().trim().max(400),
  risk: z.string().trim().max(400),
  source: z.string().trim().max(160),
  sourceUrl: z.string().url().max(500).optional(),
  verifiedAt: z.string().trim().max(40).optional(),
  confidence: z.enum(['high', 'medium', 'low', 'uncertain']).default('uncertain'),
}).strict();

export const localInsightsSchema = z.object({ insights: z.array(localInsight).max(200).default([]) }).strict();

export const businessRulesSchema = z.object({
  invoices: z.array(z.object({
    id: z.string().trim().max(80),
    number: z.string().trim().max(80).optional(),
    customerName: z.string().trim().max(160).optional(),
    dueDate: z.string().trim().max(40),
    balance: z.string().trim().max(40).optional(),
  }).strict()).max(500).default([]),
  projects: z.array(z.object({
    id: z.string().trim().max(80),
    name: z.string().trim().max(160).optional(),
    marginPercent: finite,
  }).strict()).max(200).default([]),
  materialPrices: z.array(z.object({
    material: z.string().trim().max(120),
    location: z.string().trim().max(120),
    unit: z.string().trim().max(40),
    currentPrice: finite,
    priceChangePercent: finite,
    confidence: z.string().trim().max(20).optional(),
  }).strict()).max(200).default([]),
  marginThreshold: percent.default(10),
  priceRiseThreshold: percent.default(5),
}).strict();

export const healthRulesSchema = z.object({
  profile: z.object({
    weightKg: finite.min(20).max(500).optional(),
    medicines: z.array(z.string().trim().max(160)).max(50).default([]),
  }).optional(),
  vitals: z.array(z.object({
    type: z.string().trim().max(40),
    value: z.union([finite, z.object({ systolic: finite, diastolic: finite }).strict()]),
  }).strict()).max(200).default([]),
}).strict();

export const meetingSchema = z.object({
  text: z.string().trim().min(1).max(20000),
  title: z.string().trim().max(120).optional(),
  date: z.string().trim().max(40).optional(),
  owner: z.string().trim().max(80).optional(),
  due: z.string().trim().max(40).optional(),
  attendees: z.array(z.string().trim().max(80)).max(50).default([]),
  summary: z.string().trim().max(600).optional(),
}).strict();

export { z };
