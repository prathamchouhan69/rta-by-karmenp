import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { createFlux } from '../src/app.js';
import { createServer } from '../src/http/server.js';
import { buildRoutes } from '../src/http/routes.js';

const cleanups = [];
after(() => Promise.all(cleanups.map((c) => c())));
const S = (c) => c.repeat(40);

async function boot() {
  const config = loadConfig({
    FLUX_DATA_DIR: 'memory', FLUX_OWNER_ID: 'owner1',
    FLUX_AUTH_SECRET: S('a'), FLUX_APPROVAL_SECRET: S('b'), FLUX_AUDIT_KEY: S('c'),
    FLUX_BRIEFING_ENABLED: 'false',
  });
  const flux = createFlux({ config, sleep: async () => {} });
  for (const [id, role] of [['owner1', 'owner'], ['acct1', 'accountant'], ['staff1', 'staff'], ['view1', 'viewer']]) {
    await flux.users.create({ id, role, password: `${id}-long-password` });
  }
  const { routes, authenticate } = buildRoutes(flux);
  const server = createServer({ routes, authenticate, limiter: flux.limiter, allowedOrigins: config.allowedOrigins });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  cleanups.push(async () => { flux.stop(); server.closeAllConnections(); await new Promise((r) => server.close(r)); });
  const call = async (method, path, { token, body } = {}) => {
    const r = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: await r.json() };
  };
  const login = async (id) => (await call('POST', '/v1/auth/login', { body: { id, password: `${id}-long-password` } })).body.token;
  return { flux, call, tok: { owner: await login('owner1'), acct: await login('acct1'), staff: await login('staff1'), view: await login('view1') } };
}

test('measurement APIs enforce RBAC and return formulas, confidence and honest uncertainty', async () => {
  const { call, tok } = await boot();
  const r = await call('POST', '/v1/measurements/convert', { token: tok.staff, body: { value: 20, from: 'MT', to: 'kg' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.output.value, 20000);
  assert.ok(r.body.formula);
  assert.equal(r.body.confidence, 'high');
  const parsed = await call('POST', '/v1/measurements/parse', { token: tok.staff, body: { text: 'Convert 5 feet 8 inches into cm' } });
  assert.equal(parsed.status, 200);
  assert.equal(parsed.body.output.value, 172.72);
  const uncertain = await call('POST', '/v1/measurements/convert', { token: tok.staff, body: { value: 100, from: 'USD', to: 'INR' } });
  assert.equal(uncertain.status, 200);
  assert.equal(uncertain.body.ok, false);
  assert.equal(uncertain.body.code, 'RATES_REQUIRED');
  assert.equal(uncertain.body.confidence, 'uncertain');
  assert.equal((await call('POST', '/v1/measurements/convert', { token: tok.view, body: { value: 1, from: 'm', to: 'cm' } })).status, 403);
  const units = await call('GET', '/v1/measurements/units', { token: tok.staff });
  assert.equal(units.status, 200);
  assert.ok(units.body.groups.mass);
});

test('finance APIs cover GST, EMI, cash flow and gated valuation with the investment disclaimer', async () => {
  const { call, tok } = await boot();
  const gst = await call('POST', '/v1/finance/gst', { token: tok.acct, body: { taxableValue: 100000, gstRate: 18 } });
  assert.equal(gst.status, 200);
  assert.equal(gst.body.total, 118000);
  assert.equal(gst.body.investmentDisclaimer, 'Educational information only, not personalised investment advice.');
  const emiResult = await call('POST', '/v1/finance/emi', { token: tok.acct, body: { principal: 1000000, annualRatePercent: 9, months: 120 } });
  assert.equal(emiResult.body.monthlyEmi, 12667.58);
  const flow = await call('POST', '/v1/finance/cash-flow', { token: tok.acct, body: { openingBalance: 10000, monthlyInflows: [0, 0], monthlyOutflows: [20000, 20000] } });
  assert.equal(flow.body.firstNegativeMonth, 1);
  const valuation = await call('POST', '/v1/finance/valuation', { token: tok.acct, body: { ebitda: 1000000 } });
  assert.equal(valuation.body.ok, false);
  assert.equal(valuation.body.code, 'MULTIPLE_REQUIRED');
  assert.equal((await call('POST', '/v1/finance/gst', { token: tok.staff, body: { taxableValue: 100 } })).status, 403);
  const awareness = await call('GET', '/v1/finance/investment-awareness', { token: tok.acct });
  assert.equal(awareness.body.principles.length > 0, true);
});

test('construction APIs return estimates, quantities and profit while refusing to invent rates', async () => {
  const { call, tok } = await boot();
  const incomplete = await call('POST', '/v1/construction/estimate', { token: tok.staff, body: { projectType: 'peb_shed', areaSqft: 10000, lineItems: [{ name: 'PEB steel', quantity: 20, unit: 'MT' }] } });
  assert.equal(incomplete.status, 200);
  assert.equal(incomplete.body.confidence, 'uncertain');
  assert.ok(incomplete.body.missingInputs.length > 0);
  const complete = await call('POST', '/v1/construction/estimate', { token: tok.staff, body: { projectType: 'warehouse', areaSqft: 10000, lineItems: [{ name: 'PEB steel', quantity: 20, unit: 'MT', rate: 62000 }], labourCost: 500000, gstRate: 18 } });
  assert.equal(complete.body.confidence, 'medium');
  assert.ok(complete.body.costs.total > complete.body.costs.preTax);
  const concrete = await call('POST', '/v1/construction/concrete-mix', { token: tok.staff, body: { volumeM3: 10 } });
  assert.equal(concrete.body.cementBags, 81);
  const steel = await call('POST', '/v1/construction/steel-weight', { token: tok.staff, body: { diameterMm: 12, lengthM: 12, bars: 10 } });
  assert.equal(steel.body.totalKg, 106.67);
  const profit = await call('POST', '/v1/construction/project-profit', { token: tok.staff, body: { contractValue: 1000000, estimatedCost: 800000 } });
  assert.equal(profit.body.marginPercent, 20);
  const types = await call('GET', '/v1/construction/project-types', { token: tok.staff });
  assert.ok(types.body.projectTypes.peb_shed);
});

test('material price API stores dated sources, computes trends and audits writes', async () => {
  const { call, tok, flux } = await boot();
  const empty = await call('GET', '/v1/material-prices/trend?material=TMT%20steel&location=Mandideep', { token: tok.staff });
  assert.equal(empty.status, 200);
  assert.equal(empty.body.ok, false);
  assert.equal(empty.body.code, 'NO_PRICE_DATA');
  const first = await call('POST', '/v1/material-prices', { token: tok.acct, body: { material: 'TMT steel', location: 'Mandideep', unit: 'MT', price: 62000, source: 'Supplier quotation', verifiedAt: '2026-11-01' } });
  assert.equal(first.status, 200);
  assert.equal(first.body.confidence, 'low');
  const one = await call('GET', '/v1/material-prices/trend?material=TMT%20steel&location=Mandideep', { token: tok.staff });
  assert.equal(one.body.priceTrend, 'uncertain');
  const second = await call('POST', '/v1/material-prices', { token: tok.acct, body: { material: 'TMT steel', location: 'Mandideep', unit: 'MT', price: 65000, source: 'Revised quotation', sourceUrl: 'https://supplier.example.net/quote', verifiedAt: '2026-11-05' } });
  assert.equal(second.status, 200);
  const trend = await call('GET', '/v1/material-prices/trend?material=TMT%20steel&location=Mandideep', { token: tok.staff });
  assert.equal(trend.body.priceTrend, 'rising');
  assert.equal(trend.body.priceChange, 3000);
  const impact = await call('GET', '/v1/material-prices/project-impact?material=TMT%20steel&location=Mandideep&quantity=20', { token: tok.staff });
  assert.equal(impact.body.estimatedCost, 1300000);
  const listed = await call('GET', '/v1/material-prices', { token: tok.staff });
  assert.equal(listed.body.prices.length, 2);
  assert.equal((await call('POST', '/v1/material-prices', { token: tok.staff, body: { material: 'Cement', location: 'Bhopal', unit: 'bag', price: 400, source: 'x', verifiedAt: '2026-11-01' } })).status, 403);
  assert.equal((await call('DELETE', `/v1/material-prices/${first.body.id}`, { token: tok.acct })).status, 200);
  assert.equal(flux.audit.verify().ok, true);
  assert.ok(flux.audit.list({ limit: 100 }).some((r) => r.action === 'material_price.added'));
});

test('health APIs are self-scoped, consent-gated and always disclaimed', async () => {
  const { call, tok } = await boot();
  const noConsent = await call('PUT', '/v1/health/profile', { token: tok.staff, body: { weightKg: 70 } });
  assert.equal(noConsent.status, 422);
  assert.equal(noConsent.body.error.code, 'VALIDATION_ERROR');
  const saved = await call('PUT', '/v1/health/profile', { token: tok.staff, body: { consent: true, weightKg: 70, heightCm: 170, ageYears: 30, sex: 'male', goals: ['fitness'], allergies: [], conditions: [], medicines: [], language: 'en' } });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.disclaimer, 'This is general health information, not medical advice.');
  const own = await call('GET', '/v1/health/profile', { token: tok.staff });
  assert.equal(own.body.profile.weightKg, 70);
  const other = await call('GET', '/v1/health/profile', { token: tok.owner });
  assert.equal(other.status, 200);
  assert.equal(other.body.profile, null);
  const vital = await call('POST', '/v1/health/vitals', { token: tok.staff, body: { type: 'blood_pressure', value: { systolic: 120, diastolic: 80 }, unit: 'mmHg' } });
  assert.equal(vital.status, 200);
  assert.equal(vital.body.disclaimer, 'This is general health information, not medical advice.');
  const insights = await call('GET', '/v1/health/insights', { token: tok.staff });
  assert.equal(insights.body.profile.weightKg, 70);
  assert.ok(insights.body.latestVitals.some((v) => v.type === 'blood_pressure'));
  const bmiResult = await call('POST', '/v1/health/bmi', { token: tok.staff, body: { weightKg: 70, heightCm: 170 } });
  assert.equal(bmiResult.body.bmi, 24.22);
  const emergency = await call('POST', '/v1/health/emergency-check', { token: tok.staff, body: { text: 'chest pain and cannot breathe' } });
  assert.equal(emergency.body.emergency, true);
  assert.match(emergency.body.message, /emergency services/i);
  const deleted = await call('DELETE', '/v1/health/profile', { token: tok.staff });
  assert.equal(deleted.body.removed, true);
  assert.equal((await call('GET', '/v1/health/profile', { token: tok.view })).status, 403);
});

test('jugaad and knowledge APIs are permissioned and labelled', async () => {
  const { call, tok } = await boot();
  const advice = await call('POST', '/v1/jugaad/advise', { token: tok.staff, body: { problem: 'Receivables are overdue and cash flow is tight', constraints: ['No new borrowing'] } });
  assert.equal(advice.status, 200);
  assert.equal(advice.body.category, 'receivables');
  assert.ok(advice.body.proper.steps.length > 0);
  assert.ok(advice.body.jugaad.steps.length > 0);
  assert.ok(advice.body.guardrails.length > 0);
  assert.equal((await call('POST', '/v1/jugaad/advise', { token: tok.view, body: { problem: 'cash flow' } })).status, 403);
  const stats = await call('GET', '/v1/knowledge/stats', { token: tok.view });
  assert.equal(stats.status, 200);
  assert.ok(stats.body.total >= 90);
  const search = await call('GET', '/v1/knowledge/search?query=sleep', { token: tok.view });
  assert.equal(search.status, 200);
  assert.ok(search.body.results.some((r) => r.id === 'why-we-sleep'));
  const entry = await call('GET', '/v1/knowledge/why-we-sleep', { token: tok.view });
  assert.equal(entry.status, 200);
  assert.equal(entry.body.disclaimer, 'This is general health information, not medical advice.');
  assert.equal((await call('GET', '/v1/knowledge/not-real', { token: tok.view })).status, 404);
  const recommend = await call('POST', '/v1/knowledge/recommend', { token: tok.staff, body: { context: 'money' } });
  assert.equal(recommend.body.investmentDisclaimer, 'Educational information only, not personalised investment advice.');
});

test('economy price trend validates caller-supplied rows before calculation', async () => {
  const { call, tok } = await boot();
  const valid = await call('POST', '/v1/economy/price-trend', {
    token: tok.staff,
    body: { rows: [
      { material: 'TMT steel', price: 60000, date: '2026-10-01' },
      { material: 'TMT steel', price: 62000, date: '2026-11-01' },
    ] },
  });
  assert.equal(valid.status, 200);
  assert.equal(valid.body.summary[0].trend, 'rising');
  assert.equal(valid.body.summary[0].observations, 2);
  assert.match(valid.body.investmentDisclaimer, /not personalised investment advice/);

  const invalid = await call('POST', '/v1/economy/price-trend', {
    token: tok.staff,
    body: { rows: [{ material: 'TMT steel', price: -1, date: '2026-02-31', source: 'unverified' }] },
  });
  assert.equal(invalid.status, 422);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
});

test('Zod rejects unknown fields and invalid values with a structured 422', async () => {
  const { call, tok } = await boot();
  const unknown = await call('POST', '/v1/finance/emi', { token: tok.acct, body: { principal: 100000, months: 12, surprise: true } });
  assert.equal(unknown.status, 422);
  assert.equal(unknown.body.error.code, 'VALIDATION_ERROR');
  assert.ok(unknown.body.error.details.issues.some((i) => i.path === 'surprise'));
  const bad = await call('POST', '/v1/health/bmi', { token: tok.staff, body: { weightKg: -5, heightCm: 170 } });
  assert.equal(bad.status, 422);
  assert.equal(bad.body.error.code, 'VALIDATION_ERROR');
  const badDate = await call('POST', '/v1/material-prices', { token: tok.acct, body: { material: 'Cement', location: 'Bhopal', unit: 'bag', price: 400, source: 'x', verifiedAt: '2026-02-30' } });
  assert.equal(badDate.status, 422);
});
