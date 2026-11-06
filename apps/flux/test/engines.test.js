import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/store/store.js';
import { AuditLog } from '../src/audit/auditLog.js';
import { convert, parseConversion } from '../src/measurements/engine.js';
import {
  gstBreakdown, emi, cashFlowForecast, financialHealthScore, businessValuation, investmentAwareness, FINANCE_DISCLAIMER,
} from '../src/finance/engine.js';
import { estimateProject, concreteMix, steelWeight, projectProfit, materialPriceImpact } from '../src/construction/cost.js';
import { MaterialPriceBook } from '../src/materials/priceBook.js';
import { HealthStore, bmi, waterTarget, emergencyCheck, HEALTH_DISCLAIMER } from '../src/health/engine.js';
import { advise } from '../src/jugaad/advisor.js';
import { knowledgeStats, searchKnowledge, getKnowledge, recommendKnowledge } from '../src/knowledge/library.js';

const S = (c) => c.repeat(40);
const audit = () => new AuditLog({ key: S('c') });

test('measurement engine: exact conversions, compound units, pressure, energy and honest gaps', () => {
  assert.equal(convert({ value: 20, from: 'MT', to: 'kg' }).output.value, 20000);
  assert.equal(convert({ value: 100, from: 'kg', to: 'MT' }).output.value, 0.1);
  assert.equal(parseConversion('Convert 5 feet 8 inches into cm').output.value, 172.72);
  assert.equal(parseConversion('Convert 98.6°F into Celsius').output.value, 37);
  assert.equal(parseConversion('Convert 1 acre into square feet').output.value, 43560);
  assert.equal(parseConversion('Convert 2 litres into glasses').output.value, 8);
  assert.equal(parseConversion('Convert 10 km into miles').output.value, 6.213711922);
  assert.equal(parseConversion('Convert 120/80 mmHg into kPa').output.value, '15.99868649/10.66579099');
  assert.equal(convert({ value: 1, from: 'bag', to: 'kg', bagKg: 50 }).output.value, 50);
  const kcal = parseConversion('Convert 500 kilocalories into kilojoules');
  assert.equal(kcal.output.value, 2092);
  assert.equal(kcal.confidence, 'high');
  assert.equal(parseConversion('Convert 1 bigha into square feet').code, 'BIGHA_DEFINITION_REQUIRED');
  assert.equal(parseConversion('Convert 1 bigha into square feet', { bighaSqm: 2500 }).ok, true);
  assert.equal(convert({ value: 100, from: 'USD', to: 'INR' }).code, 'RATES_REQUIRED');
  assert.equal(convert({ value: 100, from: 'USD', to: 'INR', rates: { USD: 1, INR: 83.2 } }).output.value, 8320);
  assert.equal(convert({ value: 1, from: 'kg', to: 'litre' }).code, 'INCOMPATIBLE_UNITS');
});

test('finance engine: GST, EMI, cash flow, score and valuation gating', () => {
  const gst = gstBreakdown({ taxableValue: 100000, gstRate: 18 });
  assert.equal(gst.total, 118000);
  assert.equal(gst.cgst, 9000);
  assert.equal(gst.sgst, 9000);
  assert.equal(gst.igst, 0);
  assert.equal(gstBreakdown({ taxableValue: 100000, supplyType: 'inter' }).igst, 18000);
  assert.equal(emi({ principal: 1000000, annualRatePercent: 9, months: 120 }).monthlyEmi, 12667.58);
  assert.equal(emi({ principal: 120000, annualRatePercent: 0, months: 12 }).monthlyEmi, 10000);
  const flow = cashFlowForecast({ openingBalance: 100000, monthlyInflows: [50000, 50000, 50000], monthlyOutflows: [60000, 60000, 60000] });
  assert.equal(flow.closingBalance, 70000);
  assert.equal(flow.firstNegativeMonth, null);
  const shortfall = cashFlowForecast({ openingBalance: 10000, monthlyInflows: [0, 0], monthlyOutflows: [20000, 20000] });
  assert.equal(shortfall.firstNegativeMonth, 1);
  assert.equal(financialHealthScore({ monthlyIncome: 100000, monthlyExpenses: 60000, liquidSavings: 300000, monthlyDebtPayments: 10000 }).score, 82.55);
  const noMultiples = businessValuation({ ebitda: 1000000 });
  assert.equal(noMultiples.code, 'MULTIPLE_REQUIRED');
  const valued = businessValuation({ ebitda: 1000000, multipleLow: 4, multipleBase: 5, multipleHigh: 6, netDebt: 500000, cash: 100000, multipleSource: 'Owner-supplied comparable transactions' });
  assert.equal(valued.enterpriseValue.base, 5000000);
  assert.equal(valued.equityValue.base, 4600000);
  assert.equal(investmentAwareness().disclaimer, FINANCE_DISCLAIMER);
});

test('construction engine: missing rates stay uncertain and quantities follow stated assumptions', () => {
  const incomplete = estimateProject({ projectType: 'peb_shed', areaSqft: 10000, lineItems: [{ name: 'PEB steel', quantity: 20, unit: 'MT' }] });
  assert.equal(incomplete.confidence, 'uncertain');
  assert.ok(incomplete.missingInputs.some((m) => m.field === 'rate'));
  const complete = estimateProject({
    projectType: 'warehouse', areaSqft: 10000,
    lineItems: [{ name: 'PEB steel', quantity: 20, unit: 'MT', rate: 62000 }],
    labourCost: 500000, transportCost: 100000, wastagePercent: 2, contingencyPercent: 5, profitPercent: 10, gstRate: 18,
  });
  assert.equal(complete.confidence, 'medium');
  assert.ok(complete.costs.total > complete.costs.preTax);
  assert.ok(complete.perUnit.perSqft > 0);
  assert.equal(concreteMix({ volumeM3: 10 }).cementBags, 81);
  assert.equal(steelWeight({ diameterMm: 12, lengthM: 12, bars: 10 }).totalKg, 106.67);
  const profit = projectProfit({ contractValue: 1000000, estimatedCost: 800000, gstIncluded: false });
  assert.equal(profit.profit, 200000);
  assert.equal(profit.marginPercent, 20);
  const impact = materialPriceImpact({ materialCost: 1000, oldPrice: 50, newPrice: 60 });
  assert.equal(impact.changePercent, 20);
  assert.equal(impact.projectedMaterialCost, 1200);
});

test('material price book: no invented prices, dated observations, trend and project impact', () => {
  const book = new MaterialPriceBook({ store: new Store(null), audit: audit() });
  assert.equal(book.trend({ material: 'TMT steel', location: 'Mandideep' }).code, 'NO_PRICE_DATA');
  assert.equal(book.add({ material: 'TMT steel', location: 'Mandideep', unit: 'MT', price: 62000, source: 'Supplier quotation', verifiedAt: '2026-11-01' }).ok, true);
  const one = book.trend({ material: 'TMT steel', location: 'Mandideep' });
  assert.equal(one.currentPrice, 62000);
  assert.equal(one.priceTrend, 'uncertain');
  assert.equal(one.confidence, 'uncertain');
  book.add({ material: 'TMT steel', location: 'Mandideep', unit: 'MT', price: 65000, source: 'Revised quotation', sourceUrl: 'https://supplier.example.net/quote', verifiedAt: '2026-11-05' });
  const two = book.trend({ material: 'TMT steel', location: 'Mandideep' });
  assert.equal(two.priceTrend, 'rising');
  assert.equal(two.priceChange, 3000);
  assert.equal(two.priceChangePercent, 4.84);
  const impact = book.projectImpact({ material: 'TMT steel', location: 'Mandideep', quantity: 20 });
  assert.equal(impact.estimatedCost, 1300000);
  assert.equal(impact.changeAmount, 60000);
  assert.equal(book.add({ material: 'Cement', location: 'Bhopal', unit: 'bag', price: -1, source: 'x', verifiedAt: '2026-11-01' }).code, 'BAD_PRICE');
  assert.equal(book.add({ material: 'Cement', location: 'Bhopal', unit: 'bag', price: 400, source: '', verifiedAt: '2026-11-01' }).code, 'SOURCE_REQUIRED');
});

test('health engine: BMI, hydration, emergency detection and per-user storage with consent', () => {
  assert.equal(bmi({ weightKg: 70, heightCm: 170 }).bmi, 24.22);
  assert.equal(waterTarget({ weightKg: 70 }).totalMl.low, 2100);
  assert.equal(emergencyCheck('I have chest pain and cannot breathe').emergency, true);
  assert.equal(emergencyCheck('I feel fine').emergency, false);
  const store = new HealthStore({ store: new Store(null), audit: audit() });
  assert.throws(() => store.saveProfile('u1', { weightKg: 70 }), (e) => e.code === 'CONSENT_REQUIRED');
  store.saveProfile('u1', { consent: true, weightKg: 70, heightCm: 170, ageYears: 30, sex: 'male', goals: ['fitness'], allergies: [], conditions: [], medicines: [], language: 'en' });
  store.addVital('u1', { type: 'blood_pressure', value: { systolic: 120, diastolic: 80 }, unit: 'mmHg' });
  store.addVital('u1', { type: 'sleep', value: 7, unit: 'hours' });
  const insights = store.insights('u1');
  assert.equal(insights.profile.weightKg, 70);
  assert.equal(insights.disclaimer, HEALTH_DISCLAIMER);
  assert.ok(insights.latestVitals.length >= 2);
  assert.equal(store.insights('u2').profile, null);
  assert.equal(store.deleteProfile('u1').removed, true);
  assert.equal(store.getProfile('u1'), null);
});

test('jugaad advisor: three tiers and safety guardrails', () => {
  const advice = advise({ problem: 'Steel price increased and project margin is falling' });
  assert.equal(advice.category, 'steel_price');
  assert.equal(advice.proper.steps.length > 0, true);
  assert.equal(advice.fast.steps.length > 0, true);
  assert.equal(advice.jugaad.steps.length > 0, true);
  assert.ok(advice.guardrails.length > 0);
  assert.equal(advice.confidence, 'medium');
  assert.equal(advise({ problem: 'health and sleep problem' }).category, 'health');
  assert.equal(advise({ problem: 'something unusual' }).category, 'generic');
});

test('knowledge library: curated, searchable and correctly disclaimed', () => {
  const stats = knowledgeStats();
  assert.ok(stats.total >= 90);
  assert.ok(stats.byCategory.health >= 8);
  assert.ok(stats.byCategory.case_studies >= 12);
  assert.ok(searchKnowledge({ query: 'sleep' }).results.some((r) => r.id === 'why-we-sleep'));
  assert.ok(searchKnowledge({ query: 'cash flow' }).results.length > 0);
  const health = getKnowledge('why-we-sleep');
  assert.equal(health.disclaimer, 'This is general health information, not medical advice.');
  assert.ok(health.disclaimers.includes(HEALTH_DISCLAIMER));
  const finance = getKnowledge('psychology-of-money');
  assert.ok(finance.disclaimers.includes('Educational information only, not personalised investment advice.'));
  const webvan = getKnowledge('case-webvan');
  assert.ok(webvan.situation.includes('grocery'));
  assert.equal(recommendKnowledge({ context: 'health' }).healthDisclaimer, HEALTH_DISCLAIMER);
  assert.equal(recommendKnowledge({ context: 'money' }).investmentDisclaimer, 'Educational information only, not personalised investment advice.');
  assert.equal(getKnowledge('does-not-exist'), null);
});
