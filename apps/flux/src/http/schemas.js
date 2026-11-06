import { z } from 'zod';
import { HttpError } from './server.js';

const finite = z.number().finite();
const positive = finite.positive();
const nonNegative = finite.nonnegative();
const percent = finite.min(0).max(100);
const shortText = (max = 120) => z.string().trim().min(1).max(max);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Use a real calendar date');
const rates = z.record(z.string().min(1).max(8), positive).optional();

export const measurementOptions = {
  rates,
  bighaSqm: positive.optional(),
  iuToMg: positive.optional(),
  densityKgPerL: positive.optional(),
  bagKg: positive.max(1000).optional(),
  glassMl: positive.max(5000).optional(),
};

export const convertSchema = z.object({
  value: finite,
  from: shortText(40),
  to: shortText(40),
  ...measurementOptions,
}).strict();

export const parseConversionSchema = z.object({ text: z.string().trim().min(1).max(300), ...measurementOptions }).strict();

export const gstSchema = z.object({
  taxableValue: nonNegative,
  gstRate: percent.default(18),
  cessRate: percent.default(0),
  supplyType: z.enum(['intra', 'inter']).default('intra'),
  inclusive: z.boolean().default(false),
  rounding: z.enum(['nearest-rupee', 'paise']).default('nearest-rupee'),
}).strict();

export const emiSchema = z.object({
  principal: positive,
  annualRatePercent: percent.default(0),
  months: z.number().int().min(1).max(600),
  includeSchedule: z.boolean().default(false),
}).strict();

export const loanSchema = z.object({
  monthlyIncome: positive,
  existingMonthlyEmi: nonNegative.default(0),
  foirPercent: percent.min(1).default(50),
  annualRatePercent: percent.default(9),
  months: z.number().int().min(1).max(600).default(240),
}).strict();

export const breakEvenSchema = z.object({ fixedCosts: nonNegative, pricePerUnit: positive, variableCostPerUnit: nonNegative }).strict();
export const workingCapitalSchema = z.object({ currentAssets: nonNegative, currentLiabilities: positive, inventory: nonNegative.default(0) }).strict();

const series = z.union([z.array(nonNegative).max(120), nonNegative]);
export const cashFlowSchema = z.object({
  openingBalance: finite.default(0),
  monthlyInflows: series,
  monthlyOutflows: series,
  months: z.number().int().min(1).max(120).optional(),
}).strict();

export const healthScoreSchema = z.object({
  monthlyIncome: positive,
  monthlyExpenses: nonNegative,
  liquidSavings: nonNegative.default(0),
  totalDebt: nonNegative.default(0),
  monthlyDebtPayments: nonNegative.default(0),
  receivablesTotal: nonNegative.default(0),
  receivablesOverdue: nonNegative.default(0),
  incomeStreams: z.number().int().min(1).max(20).default(1),
  emergencyMonthsTarget: finite.min(1).max(36).default(6),
}).strict();

export const valuationSchema = z.object({
  method: z.enum(['ebitda', 'revenue']).default('ebitda'),
  ebitda: finite.optional(),
  annualRevenue: finite.optional(),
  multipleLow: finite.optional(),
  multipleBase: finite.optional(),
  multipleHigh: finite.optional(),
  netDebt: finite.default(0),
  cash: nonNegative.default(0),
  multipleSource: z.string().trim().max(300).default(''),
}).strict();

export const unitEconomicsSchema = z.object({
  pricePerUnit: positive,
  variableCostPerUnit: nonNegative,
  customerAcquisitionCost: nonNegative.default(0),
  lifetimeMonths: finite.min(1).max(600).default(12),
}).strict();

export const emergencyFundSchema = z.object({
  monthlyEssentialExpenses: positive,
  targetMonths: finite.min(1).max(36).default(6),
  currentSavings: nonNegative.default(0),
  monthlyContribution: nonNegative.default(0),
}).strict();

export const debtPlanSchema = z.object({
  debts: z.array(z.object({
    name: z.string().trim().max(80).optional(),
    balance: positive,
    annualRatePercent: percent,
    minimumPayment: nonNegative,
  }).strict()).min(1).max(50),
  extraPayment: nonNegative.default(0),
}).strict();

export const taxChecklistSchema = z.object({
  entityType: z.string().trim().max(40).default('proprietorship'),
  gstRegistered: z.boolean().default(true),
  turnover: nonNegative.nullable().default(null),
}).strict();

const lineItem = z.object({
  name: z.string().trim().max(160).optional(),
  category: z.enum(['material', 'labour', 'equipment', 'transport', 'other']).default('material'),
  quantity: positive.optional(),
  unit: z.string().trim().max(40).optional(),
  rate: positive.optional(),
  wastagePercent: percent.optional(),
  rateSource: z.string().trim().max(300).optional(),
  rateDate: dateOnly.optional(),
}).strict();

export const projectEstimateSchema = z.object({
  projectType: z.enum(['peb_shed', 'warehouse', 'factory_building', 'rcc_building', 'industrial_flooring', 'boundary_wall', 'internal_road', 'utilities', 'turnkey']).default('turnkey'),
  location: z.string().trim().max(120).default(''),
  areaSqm: positive.optional(),
  areaSqft: positive.optional(),
  lineItems: z.array(lineItem).max(300).default([]),
  labourCost: nonNegative.default(0),
  equipmentCost: nonNegative.default(0),
  transportCost: nonNegative.default(0),
  otherCost: nonNegative.default(0),
  overheads: nonNegative.default(0),
  overheadsPercent: percent.default(0),
  wastagePercent: percent.default(0),
  contingencyPercent: percent.default(0),
  profitPercent: percent.default(0),
  gstRate: percent.default(18),
  assumptions: z.array(z.string().max(300)).max(50).default([]),
  sources: z.array(z.object({ name: z.string().trim().max(160).optional(), url: z.string().url().max(500).optional(), note: z.string().trim().max(300).optional() }).strict()).max(50).default([]),
  priceBasis: z.string().trim().max(60).default('user-supplied'),
}).strict();

export const concreteSchema = z.object({
  volumeM3: positive,
  mixRatio: z.string().trim().max(20).default('1:1.5:3'),
  dryFactor: positive.max(3).default(1.54),
  cementDensityKgM3: positive.max(3000).default(1440),
  bagKg: positive.max(1000).default(50),
  wastagePercent: percent.default(0),
}).strict();

export const steelWeightSchema = z.object({
  diameterMm: positive.max(100),
  lengthM: positive,
  bars: positive.default(1),
  wastagePercent: percent.default(0),
}).strict();

export const projectProfitSchema = z.object({
  contractValue: positive,
  estimatedCost: positive,
  gstRate: percent.default(18),
  gstIncluded: z.boolean().default(false),
}).strict();

export const priceImpactSchema = z.object({ materialCost: nonNegative, oldPrice: positive, newPrice: positive, quantity: positive.optional() }).strict();

export const priceRecordSchema = z.object({
  material: shortText(120),
  location: shortText(120),
  unit: shortText(40),
  price: positive,
  source: shortText(300),
  sourceUrl: z.string().url().max(500).refine((v) => v.startsWith('https://'), 'sourceUrl must use HTTPS').optional(),
  verifiedAt: dateOnly,
  currency: z.string().regex(/^[A-Za-z]{3}$/).transform((v) => v.toUpperCase()).default('INR'),
  notes: z.string().trim().max(500).optional(),
}).strict();

export const priceListQuerySchema = z.object({
  material: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  unit: z.string().trim().max(40).optional(),
  latestOnly: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
}).strict();

export const priceTrendQuerySchema = z.object({ material: shortText(120), location: z.string().trim().max(120).optional(), unit: z.string().trim().max(40).optional(), currency: z.string().regex(/^[A-Za-z]{3}$/).optional() }).strict();
export const priceCompareQuerySchema = z.object({ material: shortText(120), unit: z.string().trim().max(40).optional() }).strict();
export const priceImpactQuerySchema = z.object({ material: shortText(120), location: z.string().trim().max(120).optional(), unit: z.string().trim().max(40).optional(), quantity: z.coerce.number().positive() }).strict();

export const bmiSchema = z.object({ weightKg: finite.min(1).max(500), heightCm: finite.min(50).max(300) }).strict();
export const bmrSchema = z.object({
  sex: z.enum(['male', 'female']),
  ageYears: finite.min(15).max(120),
  weightKg: finite.min(20).max(500),
  heightCm: finite.min(100).max(300),
  bodyFatPercent: percent.optional(),
}).strict();
export const tdeeSchema = z.object({
  bmr: finite.min(500).max(10000).optional(),
  sex: z.enum(['male', 'female']).optional(),
  ageYears: finite.min(15).max(120).optional(),
  weightKg: finite.min(20).max(500).optional(),
  heightCm: finite.min(100).max(300).optional(),
  bodyFatPercent: percent.optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active']).default('sedentary'),
}).strict();
export const waterSchema = z.object({ weightKg: finite.min(20).max(500), activityMinutes: finite.min(0).max(1440).default(0), climate: z.enum(['temperate', 'hot', 'very_hot', 'humid']).default('temperate') }).strict();
export const macrosSchema = z.object({ calories: finite.min(500).max(10000), proteinPercent: percent, carbsPercent: percent, fatPercent: percent }).strict();

const optionalVital = finite.optional();
export const vitalsCheckSchema = z.object({
  systolic: optionalVital, diastolic: optionalVital, heartRate: optionalVital, spo2Percent: optionalVital,
  fastingGlucoseMgDl: optionalVital, temperatureC: optionalVital, sleepHours: optionalVital,
  hydrationMl: optionalVital, weightKg: optionalVital, activityMinutes: finite.min(0).max(1440).default(0),
  climate: z.enum(['temperate', 'hot', 'very_hot', 'humid']).default('temperate'),
}).strict();

export const emergencyCheckSchema = z.object({ text: z.string().trim().min(1).max(2000) }).strict();
export const lifestyleSchema = z.object({
  weightKg: finite.min(20).max(500), heightCm: finite.min(100).max(300), ageYears: finite.min(15).max(120),
  sex: z.enum(['male', 'female']), activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active']).default('light'),
  goal: z.string().trim().max(120).default('general_fitness'), dietaryPreference: z.string().trim().max(80).default('vegetarian'),
}).strict();
export const heatSchema = z.object({ temperatureC: finite.min(-20).max(60), humidityPercent: percent.optional(), workIntensity: z.enum(['light', 'moderate', 'heavy']).default('moderate') }).strict();

export const healthProfileSchema = z.object({
  consent: z.literal(true),
  ageYears: finite.min(1).max(120).optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  heightCm: finite.min(30).max(300).optional(),
  weightKg: finite.min(1).max(500).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active']).optional(),
  dietaryPreference: z.string().trim().max(80).optional(),
  goals: z.array(z.string().trim().max(120)).max(20).default([]),
  allergies: z.array(z.string().trim().max(120)).max(30).default([]),
  conditions: z.array(z.string().trim().max(160)).max(30).default([]),
  medicines: z.array(z.string().trim().max(160)).max(50).default([]),
  language: z.enum(['en', 'hi']).default('en'),
}).strict();

export const vitalSchema = z.object({
  type: z.enum(['blood_pressure', 'heart_rate', 'spo2', 'blood_sugar', 'weight', 'temperature', 'sleep', 'hydration', 'steps', 'exercise']),
  value: z.union([finite, z.object({ systolic: finite.min(40).max(300), diastolic: finite.min(20).max(200) }).strict()]),
  unit: z.string().trim().max(20).default(''),
  measuredAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().trim().max(300).optional(),
}).strict();

export const vitalsQuerySchema = z.object({
  type: z.enum(['blood_pressure', 'heart_rate', 'spo2', 'blood_sugar', 'weight', 'temperature', 'sleep', 'hydration', 'steps', 'exercise']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
}).strict();

export { z };

export function parseInput(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => ({ path: issue.path.join('.') || issue.keys?.join(',') || '(body)', message: issue.message }));
  throw new HttpError(422, 'VALIDATION_ERROR', `Invalid input: ${issues.map((i) => `${i.path} ${i.message}`).join('; ')}`, { issues });
}

export const jugaadSchema = z.object({
  problem: z.string().trim().min(1).max(4000),
  category: z.string().trim().max(40).optional(),
  budget: z.string().trim().max(80).optional(),
  timeAvailable: z.string().trim().max(80).optional(),
  constraints: z.array(z.string().trim().max(160)).max(10).default([]),
}).strict();

export const knowledgeSearchSchema = z.object({
  query: z.string().trim().max(300).default(''),
  category: z.string().trim().max(80).optional(),
  type: z.string().trim().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export const knowledgeRecommendSchema = z.object({ context: z.string().trim().max(40).default('business'), limit: z.coerce.number().int().min(1).max(30).default(8) }).strict();
