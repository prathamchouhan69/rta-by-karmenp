import { convert, parseConversion } from '../measurements/engine.js';
import { listUnits } from '../measurements/units.js';
import {
  gstBreakdown, emi, loanEligibility, breakEven, workingCapital,
  cashFlowForecast, financialHealthScore, businessValuation, unitEconomics,
  emergencyFundPlan, debtReductionPlan, taxAwarenessChecklist, investmentAwareness, FINANCE_DISCLAIMER,
} from '../finance/engine.js';
import {
  estimateProject, concreteMix, steelWeight, projectProfit, materialPriceImpact, PROJECT_TYPES,
} from '../construction/cost.js';
import { bmi, bmr, tdee, waterTarget, macros, vitalsCheck, emergencyCheck, lifestylePlan, workforceHeatGuidance, HEALTH_DISCLAIMER } from '../health/engine.js';
import { advise } from '../jugaad/advisor.js';
import { economyBrief, priceTrendSummary } from '../economy/mode.js';
import { opportunityAlerts, trendRadar } from '../opportunities/radar.js';
import { localInsights } from '../intelligence/local.js';
import { evaluateBusinessRules, evaluateHealthRules } from '../automations/engine.js';
import { structureMeeting } from '../meeting/assistant.js';
import { budgetPlan, savingsGoalPlan, expenseReview } from '../money/mode.js';
import { netWorthSnapshot, compoundScenario, retirementGap } from '../wealth/mode.js';
import { runway, burnMultiple, dilution, startupSnapshot } from '../startup/mode.js';
import { liveStatus, liveDomain } from '../live/status.js';
import { listSchemes, findSchemes, schemeGuidance } from '../opportunities/schemes.js';
import { ocrStatus, extractDocumentText } from '../ocr/extract.js';
import { getKnowledge, listCategories, knowledgeStats, recommendKnowledge, searchKnowledge, KNOWLEDGE_DISCLAIMER } from '../knowledge/library.js';
import {
  convertSchema, parseConversionSchema, gstSchema, emiSchema, loanSchema, breakEvenSchema,
  workingCapitalSchema, cashFlowSchema, healthScoreSchema, valuationSchema, unitEconomicsSchema,
  emergencyFundSchema, debtPlanSchema, taxChecklistSchema, projectEstimateSchema, concreteSchema,
  steelWeightSchema, projectProfitSchema, priceImpactSchema, priceRecordSchema, priceListQuerySchema,
  priceTrendQuerySchema, priceCompareQuerySchema, priceImpactQuerySchema, bmiSchema, bmrSchema,
  tdeeSchema, waterSchema, macrosSchema, vitalsCheckSchema, emergencyCheckSchema, lifestyleSchema,
  heatSchema, healthProfileSchema, vitalSchema, vitalsQuerySchema, jugaadSchema, knowledgeSearchSchema,
  knowledgeRecommendSchema, parseInput,
} from './schemas.js';
import {
  budgetPlanSchema, savingsGoalSchema, expenseReviewSchema, netWorthSchema, compoundSchema,
  retirementGapSchema, runwaySchema, burnMultipleSchema, dilutionSchema, startupSnapshotSchema,
  ocrExtractSchema, schemeSearchSchema,
  economyBriefSchema, trendRadarSchema, opportunityAlertsSchema, localInsightsSchema,
  businessRulesSchema, healthRulesSchema, meetingSchema, priceTrendRowsSchema,
} from './modeSchemas.js';
import { HttpError } from './server.js';

const finance = (result) => (result && result.ok === false ? result : { ...result, investmentDisclaimer: FINANCE_DISCLAIMER });
const health = (result) => (result && result.ok === false ? result : { ...result, disclaimer: HEALTH_DISCLAIMER });

export function buildExtendedRoutes(f) {
  const { materials, health: healthStore, economy, radar, local, automations } = f;
  const R = (method, path, handler, opts) => [method, path, handler, opts];
  const id = (user) => user.id;

  return [
    // Deterministic measurement conversions.
    R('POST', '/v1/measurements/convert', async ({ body }) => convert(parseInput(convertSchema, body)), { permission: 'measure:convert' }),
    R('POST', '/v1/measurements/parse', async ({ body }) => { const input = parseInput(parseConversionSchema, body); return parseConversion(input.text, input); }, { permission: 'measure:convert' }),
    R('GET', '/v1/measurements/units', async () => ({ groups: listUnits(), limitations: ['Bigha, currency rates, IU factors and cement-bag mass require verified caller-supplied values.'], disclaimer: 'Conversions are mathematical; they are not financial, medical or engineering advice.' }), { permission: 'measure:convert' }),

    // Financial intelligence.
    R('POST', '/v1/finance/gst', async ({ body }) => finance(gstBreakdown(parseInput(gstSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/emi', async ({ body }) => finance(emi(parseInput(emiSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/loan-eligibility', async ({ body }) => finance(loanEligibility(parseInput(loanSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/break-even', async ({ body }) => finance(breakEven(parseInput(breakEvenSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/working-capital', async ({ body }) => finance(workingCapital(parseInput(workingCapitalSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/cash-flow', async ({ body }) => finance(cashFlowForecast(parseInput(cashFlowSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/health-score', async ({ body }) => finance(financialHealthScore(parseInput(healthScoreSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/valuation', async ({ body }) => finance(businessValuation(parseInput(valuationSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/unit-economics', async ({ body }) => finance(unitEconomics(parseInput(unitEconomicsSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/emergency-fund', async ({ body }) => finance(emergencyFundPlan(parseInput(emergencyFundSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/debt-plan', async ({ body }) => finance(debtReductionPlan(parseInput(debtPlanSchema, body))), { permission: 'finance:read' }),
    R('POST', '/v1/finance/tax-awareness', async ({ body }) => finance(taxAwarenessChecklist(parseInput(taxChecklistSchema, body))), { permission: 'finance:read' }),
    R('GET', '/v1/finance/investment-awareness', async () => finance(investmentAwareness()), { permission: 'finance:read' }),

    // Money Mode: deterministic budgeting and goals from caller-supplied numbers.
    R('POST', '/v1/money/plan', async ({ body }) => finance(budgetPlan(parseInput(budgetPlanSchema, body))), { permission: 'money:read' }),
    R('POST', '/v1/money/goal', async ({ body }) => finance(savingsGoalPlan(parseInput(savingsGoalSchema, body))), { permission: 'money:read' }),
    R('POST', '/v1/money/expense-review', async ({ body }) => finance(expenseReview(parseInput(expenseReviewSchema, body))), { permission: 'money:read' }),

    // Wealth Mode: balance sheet and scenarios, never market predictions.
    R('POST', '/v1/wealth/net-worth', async ({ body }) => finance(netWorthSnapshot(parseInput(netWorthSchema, body))), { permission: 'wealth:read' }),
    R('POST', '/v1/wealth/compound', async ({ body }) => finance(compoundScenario(parseInput(compoundSchema, body))), { permission: 'wealth:read' }),
    R('POST', '/v1/wealth/retirement-gap', async ({ body }) => finance(retirementGap(parseInput(retirementGapSchema, body))), { permission: 'wealth:read' }),

    // Startup Founder Mode.
    R('POST', '/v1/startup/runway', async ({ body }) => finance(runway(parseInput(runwaySchema, body))), { permission: 'startup:read' }),
    R('POST', '/v1/startup/burn-multiple', async ({ body }) => finance(burnMultiple(parseInput(burnMultipleSchema, body))), { permission: 'startup:read' }),
    R('POST', '/v1/startup/dilution', async ({ body }) => finance(dilution(parseInput(dilutionSchema, body))), { permission: 'startup:read' }),
    R('POST', '/v1/startup/snapshot', async ({ body }) => finance(startupSnapshot(parseInput(startupSnapshotSchema, body))), { permission: 'startup:read' }),

    // Honest live-data status. No feed is invented when none is configured.
    R('GET', '/v1/live/status', async () => liveStatus(), { permission: 'live:read' }),
    R('GET', '/v1/live/:domain', async ({ params }) => liveDomain(params.domain), { permission: 'live:read' }),

    // Curated scheme discovery and application guidance.
    R('GET', '/v1/opportunities/schemes', async () => listSchemes(), { permission: 'knowledge:read' }),
    R('POST', '/v1/opportunities/schemes/search', async ({ body }) => findSchemes(parseInput(schemeSearchSchema, body)), { permission: 'knowledge:read' }),
    R('GET', '/v1/opportunities/schemes/guidance', async () => schemeGuidance(), { permission: 'knowledge:read' }),

    // OCR status and deterministic extraction from text the caller already has.
    R('GET', '/v1/ocr/status', async () => ocrStatus(), { permission: 'documents:draft' }),
    R('POST', '/v1/ocr/extract', async ({ body }) => extractDocumentText(parseInput(ocrExtractSchema, body)), { permission: 'documents:draft' }),

    // Construction cost, quantity and profit.
    R('GET', '/v1/construction/project-types', async () => ({ projectTypes: PROJECT_TYPES }), { permission: 'construction:read' }),
    R('POST', '/v1/construction/estimate', async ({ body }) => estimateProject(parseInput(projectEstimateSchema, body)), { permission: 'construction:read' }),
    R('POST', '/v1/construction/concrete-mix', async ({ body }) => concreteMix(parseInput(concreteSchema, body)), { permission: 'construction:read' }),
    R('POST', '/v1/construction/steel-weight', async ({ body }) => steelWeight(parseInput(steelWeightSchema, body)), { permission: 'construction:read' }),
    R('POST', '/v1/construction/project-profit', async ({ body }) => projectProfit(parseInput(projectProfitSchema, body)), { permission: 'construction:read' }),
    R('POST', '/v1/construction/price-impact', async ({ body }) => materialPriceImpact(parseInput(priceImpactSchema, body)), { permission: 'construction:read' }),

    // Dated, source-labelled material prices. No built-in market rates.
    R('GET', '/v1/material-prices', async ({ query }) => { const q = parseInput(priceListQuerySchema, query); return { prices: materials.list({ ...q, latestOnly: q.latestOnly === 'true' }), disclaimer: 'Prices are user-recorded observations, not a live market index.' }; }, { permission: 'materials:read' }),
    R('POST', '/v1/material-prices', async ({ user, body }) => materials.add(parseInput(priceRecordSchema, body), { id: user.id }), { permission: 'materials:write' }),
    R('DELETE', '/v1/material-prices/:id', async ({ params, user }) => materials.remove(params.id, { id: user.id }), { permission: 'materials:write' }),
    R('GET', '/v1/material-prices/trend', async ({ query }) => { const q = parseInput(priceTrendQuerySchema, query); return materials.trend(q); }, { permission: 'materials:read' }),
    R('GET', '/v1/material-prices/compare', async ({ query }) => { const q = parseInput(priceCompareQuerySchema, query); return materials.compareLocations(q); }, { permission: 'materials:read' }),
    R('GET', '/v1/material-prices/project-impact', async ({ query }) => { const q = parseInput(priceImpactQuerySchema, query); return materials.projectImpact(q); }, { permission: 'materials:read' }),

    // Health self-service. Every read and write is scoped to the signed-in user.
    R('GET', '/v1/health/profile', async ({ user }) => health({ ok: true, profile: healthStore.getProfile(id(user)) || null }), { permission: 'health:read' }),
    R('PUT', '/v1/health/profile', async ({ user, body }) => health(healthStore.saveProfile(id(user), parseInput(healthProfileSchema, body), { id: user.id })), { permission: 'health:write' }),
    R('DELETE', '/v1/health/profile', async ({ user }) => health(healthStore.deleteProfile(id(user), { id: user.id })), { permission: 'health:write' }),
    R('POST', '/v1/health/vitals', async ({ user, body }) => health(healthStore.addVital(id(user), parseInput(vitalSchema, body), { id: user.id })), { permission: 'health:write' }),
    R('GET', '/v1/health/vitals', async ({ user, query }) => { const q = parseInput(vitalsQuerySchema, query); return health({ ok: true, vitals: healthStore.listVitals(id(user), q) }); }, { permission: 'health:read' }),
    R('GET', '/v1/health/insights', async ({ user }) => health(healthStore.insights(id(user))), { permission: 'health:read' }),
    R('POST', '/v1/health/bmi', async ({ body }) => health(bmi(parseInput(bmiSchema, body))), { permission: 'health:read' }),
    R('POST', '/v1/health/bmr', async ({ body }) => health(bmr(parseInput(bmrSchema, body))), { permission: 'health:read' }),
    R('POST', '/v1/health/tdee', async ({ body }) => health(tdee(parseInput(tdeeSchema, body))), { permission: 'health:read' }),
    R('POST', '/v1/health/water-target', async ({ body }) => health(waterTarget(parseInput(waterSchema, body))), { permission: 'health:read' }),
    R('POST', '/v1/health/macros', async ({ body }) => health(macros(parseInput(macrosSchema, body))), { permission: 'health:read' }),
    R('POST', '/v1/health/vitals-check', async ({ body }) => health(vitalsCheck(parseInput(vitalsCheckSchema, body))), { permission: 'health:read' }),
    R('POST', '/v1/health/emergency-check', async ({ body }) => health(emergencyCheck(parseInput(emergencyCheckSchema, body).text)), { permission: 'health:read' }),
    R('POST', '/v1/health/lifestyle-plan', async ({ body }) => health(lifestylePlan(parseInput(lifestyleSchema, body))), { permission: 'health:read' }),
    R('POST', '/v1/health/heat-guidance', async ({ body }) => health(workforceHeatGuidance(parseInput(heatSchema, body))), { permission: 'health:read' }),

    // Jugaad three-tier advisor.
    R('POST', '/v1/jugaad/advise', async ({ body }) => advise(parseInput(jugaadSchema, body)), { permission: 'jugaad:read' }),

    // Curated knowledge library. Keyword search, never live web data.
    R('GET', '/v1/knowledge/stats', async () => knowledgeStats(), { permission: 'knowledge:read' }),
    R('GET', '/v1/knowledge/categories', async () => ({ categories: listCategories(), disclaimer: KNOWLEDGE_DISCLAIMER }), { permission: 'knowledge:read' }),
    R('GET', '/v1/knowledge/search', async ({ query }) => searchKnowledge(parseInput(knowledgeSearchSchema, query)), { permission: 'knowledge:read' }),
    R('POST', '/v1/knowledge/search', async ({ body }) => searchKnowledge(parseInput(knowledgeSearchSchema, body)), { permission: 'knowledge:read' }),
    R('POST', '/v1/knowledge/recommend', async ({ body }) => recommendKnowledge(parseInput(knowledgeRecommendSchema, body)), { permission: 'knowledge:read' }),
    R('GET', '/v1/knowledge/:id', async ({ params }) => getKnowledge(params.id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Knowledge entry not found'); })(), { permission: 'knowledge:read' }),

    // World Economy Mode — every entry is caller-supplied or explicitly uncertain.
    R('POST', '/v1/economy/brief', async ({ body }) => economyBrief(parseInput(economyBriefSchema, body)), { permission: 'economy:read' }),
    R('POST', '/v1/economy/price-trend', async ({ body }) => {
      const { rows } = parseInput(priceTrendRowsSchema, body);
      return { ...priceTrendSummary(rows), investmentDisclaimer: FINANCE_DISCLAIMER };
    }, { permission: 'materials:read' }),

    // Opportunity and Trend Radars.
    R('POST', '/v1/radar/opportunities', async ({ body }) => opportunityAlerts(parseInput(opportunityAlertsSchema, body)), { permission: 'opportunities:read' }),
    R('POST', '/v1/radar/trends', async ({ body }) => trendRadar(parseInput(trendRadarSchema, body)), { permission: 'opportunities:read' }),

    // Local Aunty Mode.
    R('POST', '/v1/local/insights', async ({ body }) => localInsights(parseInput(localInsightsSchema, body)), { permission: 'local:read' }),

    // Automations — prepare drafts and reminders only.
    R('POST', '/v1/automations/business', async ({ body, user }) => automations.business(parseInput(businessRulesSchema, body)), { permission: 'automations:read' }),
    R('POST', '/v1/automations/health', async ({ body, user }) => ({ ...automations.health(parseInput(healthRulesSchema, body)), userId: user.id }), { permission: 'health:read' }),

    // Meeting Assistant.
    R('POST', '/v1/meeting/structure', async ({ body }) => structureMeeting(parseInput(meetingSchema, body)), { permission: 'documents:draft' }),
  ];
}
