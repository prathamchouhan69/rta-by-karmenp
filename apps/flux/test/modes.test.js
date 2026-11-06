import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { createFlux } from '../src/app.js';
import { createServer } from '../src/http/server.js';
import { buildRoutes } from '../src/http/routes.js';
import { budgetPlan, savingsGoalPlan, expenseReview } from '../src/money/mode.js';
import { netWorthSnapshot, compoundScenario, retirementGap } from '../src/wealth/mode.js';
import { runway, burnMultiple, dilution, startupSnapshot } from '../src/startup/mode.js';
import { liveStatus, liveDomain } from '../src/live/status.js';
import { listSchemes, findSchemes, schemeGuidance } from '../src/opportunities/schemes.js';
import { ocrStatus, extractDocumentText } from '../src/ocr/extract.js';

const cleanups = [];
after(() => Promise.all(cleanups.map((c) => c())));
const S = (c) => c.repeat(40);
const DISCLAIMER = 'Educational information only, not personalised investment advice.';

test('money mode: deterministic budget, goal and expense review', () => {
  const plan = budgetPlan({
    monthlyIncome: 100000,
    expenses: [{ category: 'Rent', amount: 25000 }, { category: 'Food', amount: 15000 }, { category: 'Travel', amount: 10000, essential: false }],
    debtPayments: 10000, savingsGoal: 20000, liquidSavings: 300000,
  });
  assert.equal(plan.totals.essential, 40000);
  assert.equal(plan.totals.discretionary, 10000);
  assert.equal(plan.totals.outgoings, 60000);
  assert.equal(plan.surplus, 40000);
  assert.equal(plan.savingsRatePercent, 40);
  assert.equal(plan.savingsGoal.covered, true);
  assert.equal(plan.disclaimer, DISCLAIMER);
  const short = budgetPlan({ monthlyIncome: 30000, expenses: [{ category: 'Rent', amount: 25000 }], debtPayments: 10000 });
  assert.ok(short.surplus < 0);
  assert.ok(short.recommendations.some((r) => r.priority === 'high'));
  const goal = savingsGoalPlan({ targetAmount: 1000000, currentSavings: 100000, monthlyContribution: 20000 });
  assert.equal(goal.gap, 900000);
  assert.equal(goal.monthsToTarget, 45);
  assert.equal(goal.annualReturnPercent, null);
  const withReturn = savingsGoalPlan({ targetAmount: 1000000, currentSavings: 100000, monthlyContribution: 20000, annualReturnPercent: 8 });
  assert.ok(withReturn.monthsToTarget < goal.monthsToTarget);
  assert.equal(withReturn.confidence, 'medium');
  const review = expenseReview({ expenses: [{ category: 'Rent', amount: 25000 }, { category: 'Food', amount: 15000 }], monthlyIncome: 100000 });
  assert.equal(review.total, 40000);
  assert.equal(review.largest[0].category, 'Rent');
  assert.equal(review.largest[0].sharePercent, 62.5);
});

test('wealth mode: balance sheet, compound scenario and retirement gap', () => {
  const net = netWorthSnapshot({
    assets: [{ name: 'Bank', class: 'cash', value: 500000 }, { name: 'Fund', class: 'equity', value: 300000 }],
    liabilities: [{ name: 'Home loan', class: 'home_loan', value: 400000, interestRatePercent: 8.5 }],
  });
  assert.equal(net.totalAssets, 800000);
  assert.equal(net.totalLiabilities, 400000);
  assert.equal(net.netWorth, 400000);
  assert.equal(net.allocationPercent.cash, 62.5);
  assert.equal(net.confidence, 'high');
  assert.equal(net.disclaimer, DISCLAIMER);
  const compound = compoundScenario({ principal: 100000, monthlyContribution: 10000, annualRatePercent: 10, years: 10, inflationPercent: 6 });
  assert.equal(compound.futureValue, 2319153.94);
  assert.ok(compound.realValueToday < compound.futureValue);
  assert.equal(compound.disclaimer, DISCLAIMER);
  const gap = retirementGap({ currentAge: 30, retirementAge: 60, monthlyExpensesToday: 100000, inflationPercent: 6, preRetirementReturnPercent: 10, postRetirementReturnPercent: 7, currentCorpus: 500000, monthlyContribution: 20000 });
  assert.equal(gap.yearsToRetirement, 30);
  assert.ok(gap.corpusNeededTodayRupees > 0);
  assert.equal(gap.status, 'projected shortfall');
  assert.ok(gap.requiredMonthlyContributionTodayRupees > 0);
});

test('startup mode: runway, burn multiple, dilution and combined snapshot', () => {
  const run = runway({ cashBalance: 1000000, monthlyRevenue: 200000, monthlyExpenses: 300000 });
  assert.equal(run.monthlyNetBurn, 100000);
  assert.equal(run.runwayMonths, 11);
  assert.equal(run.status, 'cash falls below zero in month 11');
  assert.equal(run.rows.length, 36);
  const burn = burnMultiple({ netBurn: 500000, netNewRevenue: 400000 });
  assert.equal(burn.burnMultiple, 1.25);
  assert.equal(burn.interpretation, 'moderate');
  assert.equal(burnMultiple({ netBurn: 1, netNewRevenue: 0 }).code, 'NO_REVENUE_GROWTH');
  const cap = dilution({ preMoneyValuation: 40000000, investmentAmount: 10000000, optionPoolPercent: 10 });
  assert.equal(cap.postMoneyValuation, 50000000);
  assert.equal(cap.investorOwnershipPercent, 20);
  assert.equal(cap.foundersAfterPercent, 70);
  const snapshot = startupSnapshot({ cashBalance: 1000000, monthlyRevenue: 200000, monthlyExpenses: 300000, pricePerUnit: 5000, variableCostPerUnit: 3000, customerAcquisitionCost: 10000, fixedCosts: 50000 });
  assert.equal(snapshot.runway.months, 11);
  assert.equal(snapshot.unitEconomics.grossMarginPercent, 40);
  assert.ok(snapshot.alerts.some((a) => a.severity === 'medium'));
  assert.equal(snapshot.disclaimer, DISCLAIMER);
  assert.equal(startupSnapshot({ cashBalance: 1000000, monthlyRevenue: 0, monthlyExpenses: 300000, pricePerUnit: 100, variableCostPerUnit: 200 }).breakEven.available, false);
});

test('live status is honest about every unconfigured domain', () => {
  const status = liveStatus();
  assert.equal(status.ok, true);
  assert.equal(status.liveDataAvailable, false);
  assert.equal(status.code, 'LIVE_DATA_NOT_CONFIGURED');
  assert.equal(status.domains.length, 7);
  assert.ok(status.domains.every((domain) => domain.live === false && domain.status === 'not_configured'));
  assert.ok(status.domains.every((domain) => domain.officialSources.length > 0));
  assert.equal(liveDomain('currency').code, 'LIVE_DATA_NOT_CONFIGURED');
  assert.equal(liveDomain('currency').item.label, 'Currency rates');
  assert.equal(liveDomain('astrology').code, 'UNKNOWN_DOMAIN');
});

test('scheme directory is curated, official and verification-first', () => {
  const directory = listSchemes();
  assert.equal(directory.live, false);
  assert.equal(directory.sourceType, 'curated_static');
  assert.equal(directory.count, 8);
  assert.ok(directory.schemes.every((scheme) => scheme.officialUrl && scheme.officialUrl.startsWith('https://')));
  assert.equal(directory.verificationRequired, true);
  const found = findSchemes({ query: 'credit guarantee' });
  assert.ok(found.schemes.some((scheme) => scheme.id === 'cgtmse'));
  assert.equal(found.live, false);
  assert.ok(schemeGuidance().checklist.length >= 5);
});

test('OCR status and extraction are honest and deterministic', () => {
  assert.equal(ocrStatus().code, 'OCR_NOT_CONFIGURED');
  assert.equal(extractDocumentText({ text: '' }).code, 'OCR_NOT_CONFIGURED');
  const result = extractDocumentText({ text: 'Tax Invoice No: INV/2026/45 Date: 05/11/2026 GSTIN: 23ABCDE1234F1Z5 Total: Rs. 1,18,000 GST 18% HSN 7308' });
  assert.equal(result.ok, true);
  assert.equal(result.fields.invoiceNumber, 'INV/2026/45');
  assert.deepEqual(result.fields.dates, ['2026-11-05']);
  assert.equal(result.fields.largestAmount, 118000);
  assert.equal(result.fields.gstins[0].valid, false);
  assert.deepEqual(result.fields.hsnSac, ['7308']);
  assert.deepEqual(result.fields.gstRates, [18]);
  assert.equal(result.missing.length, 0);
  assert.ok(result.warnings.some((warning) => warning.includes('OCR was not run')));
});

async function boot() {
  const config = loadConfig({
    FLUX_DATA_DIR: 'memory', FLUX_OWNER_ID: 'owner1',
    FLUX_AUTH_SECRET: S('a'), FLUX_APPROVAL_SECRET: S('b'), FLUX_AUDIT_KEY: S('c'),
    FLUX_BRIEFING_ENABLED: 'false',
  });
  const flux = createFlux({ config, sleep: async () => {} });
  for (const [id, role] of [['owner1', 'owner'], ['acct1', 'accountant'], ['staff1', 'staff'], ['view1', 'viewer']]) await flux.users.create({ id, role, password: `${id}-long-password` });
  const { routes, authenticate } = buildRoutes(flux);
  const server = createServer({ routes, authenticate, limiter: flux.limiter, allowedOrigins: config.allowedOrigins });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  cleanups.push(async () => { flux.stop(); server.closeAllConnections(); await new Promise((r) => server.close(r)); });
  const call = async (method, path, { token, body } = {}) => {
    const response = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  };
  const login = async (id) => (await call('POST', '/v1/auth/login', { body: { id, password: `${id}-long-password` } })).body.token;
  return { call, tok: { owner: await login('owner1'), acct: await login('acct1'), staff: await login('staff1'), view: await login('view1') } };
}

test('mode APIs are permissioned, validated and disclaimed', async () => {
  const { call, tok } = await boot();
  const plan = await call('POST', '/v1/money/plan', { token: tok.staff, body: { monthlyIncome: 100000, expenses: [{ category: 'Rent', amount: 25000 }], debtPayments: 10000 } });
  assert.equal(plan.status, 200);
  assert.equal(plan.body.surplus, 65000);
  assert.equal(plan.body.investmentDisclaimer, DISCLAIMER);
  const goal = await call('POST', '/v1/money/goal', { token: tok.staff, body: { targetAmount: 100000, monthlyContribution: 10000 } });
  assert.equal(goal.body.monthsToTarget, 10);
  const net = await call('POST', '/v1/wealth/net-worth', { token: tok.staff, body: { assets: [{ class: 'cash', value: 100000 }], liabilities: [{ class: 'personal_loan', value: 40000, interestRatePercent: 18 }] } });
  assert.equal(net.body.netWorth, 60000);
  assert.ok(net.body.warnings.length >= 1);
  const run = await call('POST', '/v1/startup/runway', { token: tok.staff, body: { cashBalance: 100000, monthlyRevenue: 0, monthlyExpenses: 20000 } });
  assert.equal(run.body.runwayMonths, 6);
  const snapshot = await call('POST', '/v1/startup/snapshot', { token: tok.staff, body: { cashBalance: 100000, monthlyRevenue: 0, monthlyExpenses: 20000, pricePerUnit: 100, variableCostPerUnit: 60 } });
  assert.equal(snapshot.body.ok, true);
  assert.equal((await call('POST', '/v1/money/plan', { token: tok.view, body: { monthlyIncome: 1000 } })).status, 403);
  assert.equal((await call('POST', '/v1/money/plan', { token: tok.staff, body: { monthlyIncome: -1 } })).status, 422);
  assert.equal((await call('POST', '/v1/money/plan', { token: tok.staff, body: { monthlyIncome: 1000, surprise: true } })).status, 422);
  const live = await call('GET', '/v1/live/status', { token: tok.view });
  assert.equal(live.status, 200);
  assert.equal(live.body.liveDataAvailable, false);
  const schemes = await call('GET', '/v1/opportunities/schemes', { token: tok.view });
  assert.equal(schemes.body.count, 8);
  const ocr = await call('GET', '/v1/ocr/status', { token: tok.acct });
  assert.equal(ocr.body.code, 'OCR_NOT_CONFIGURED');
  assert.equal((await call('GET', '/v1/ocr/status', { token: tok.staff })).status, 403);
  const extracted = await call('POST', '/v1/ocr/extract', { token: tok.acct, body: { text: 'Invoice No: A-1 Date: 2026-11-01 Total: INR 5000' } });
  assert.equal(extracted.body.fields.invoiceNumber, 'A-1');
  assert.equal((await call('POST', '/v1/ocr/extract', { token: tok.acct, body: {} })).body.code, 'OCR_NOT_CONFIGURED');
});
