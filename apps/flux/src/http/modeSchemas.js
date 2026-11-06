import { z } from 'zod';

const finite = z.number().finite();
const nonNegative = finite.nonnegative();
const positive = finite.positive();
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

export { z };
