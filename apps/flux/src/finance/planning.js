import { DISCLAIMER, TAX_NOTE, round2, number, fail } from './shared.js';

export function cashFlowForecast({ openingBalance = 0, monthlyInflows = [], monthlyOutflows = [], months = null } = {}) {
  const opening = number(openingBalance, 'openingBalance');
  const inflows = Array.isArray(monthlyInflows) ? monthlyInflows.map((v) => number(v, 'monthlyInflows', { min: 0 })) : [number(monthlyInflows, 'monthlyInflows', { min: 0 })];
  const outflows = Array.isArray(monthlyOutflows) ? monthlyOutflows.map((v) => number(v, 'monthlyOutflows', { min: 0 })) : [number(monthlyOutflows, 'monthlyOutflows', { min: 0 })];
  const count = months == null ? Math.max(inflows.length, outflows.length, 1) : Math.round(number(months, 'months', { min: 1, max: 120 }));
  let balance = opening; const rows = []; let lowest = opening; let lowestMonth = 0; let firstNegative = null; let cumulativeIn = 0; let cumulativeOut = 0;
  for (let i = 0; i < count; i++) {
    const inflow = inflows[i] ?? inflows[inflows.length - 1] ?? 0;
    const outflow = outflows[i] ?? outflows[outflows.length - 1] ?? 0;
    const net = inflow - outflow; balance += net; cumulativeIn += inflow; cumulativeOut += outflow;
    if (balance < lowest) { lowest = balance; lowestMonth = i + 1; }
    if (balance < 0 && firstNegative == null) firstNegative = i + 1;
    rows.push({ month: i + 1, inflow: round2(inflow), outflow: round2(outflow), net: round2(net), closingBalance: round2(balance) });
  }
  return {
    ok: true, openingBalance: round2(opening), rows, totalInflow: round2(cumulativeIn), totalOutflow: round2(cumulativeOut), closingBalance: round2(balance),
    lowestBalance: round2(lowest), lowestBalanceMonth: lowestMonth, firstNegativeMonth: firstNegative,
    runwayMonths: firstNegative == null ? null : firstNegative,
    status: firstNegative == null ? 'positive through the forecast' : balance < 0 ? 'cash shortfall projected' : 'dips below zero',
    confidence: 'medium', assumptions: ['Inflows and outflows are the caller\'s own forecast, not bank-verified data.', 'No new borrowing, tax refund or one-off receipt is assumed.'],
    source: 'Deterministic month-by-month cash-flow arithmetic.',
    limitations: ['A forecast is not a guarantee. Update it with actual bank and ledger data.'],
  };
}

export function financialHealthScore({ monthlyIncome, monthlyExpenses, liquidSavings = 0, totalDebt = 0, monthlyDebtPayments = 0, receivablesTotal = 0, receivablesOverdue = 0, incomeStreams = 1, emergencyMonthsTarget = 6 } = {}) {
  const income = number(monthlyIncome, 'monthlyIncome', { min: 0, allowZero: false });
  const expenses = number(monthlyExpenses, 'monthlyExpenses', { min: 0 });
  const savings = number(liquidSavings, 'liquidSavings', { min: 0 });
  const debt = number(totalDebt, 'totalDebt', { min: 0 });
  const debtPay = number(monthlyDebtPayments, 'monthlyDebtPayments', { min: 0 });
  const recTotal = number(receivablesTotal, 'receivablesTotal', { min: 0 });
  const recOverdue = number(receivablesOverdue, 'receivablesOverdue', { min: 0 });
  const streams = Math.max(1, Math.round(number(incomeStreams, 'incomeStreams', { min: 1, max: 20 })));
  const targetMonths = number(emergencyMonthsTarget, 'emergencyMonthsTarget', { min: 1, max: 36 });
  const monthlyProfit = income - expenses;
  const savingsRate = income > 0 ? monthlyProfit / income : 0;
  const emergencyMonths = expenses > 0 ? savings / expenses : 0;
  const dti = income > 0 ? debtPay / income : 1;
  const overdueShare = recTotal > 0 ? recOverdue / recTotal : 0;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const components = {
    savingsRate: { score: round2(clamp(savingsRate / 0.30) * 25), max: 25, value: round2(savingsRate * 100), unit: '%' },
    emergencyFund: { score: round2(clamp(emergencyMonths / targetMonths) * 20), max: 20, value: round2(emergencyMonths), unit: 'months' },
    debtLoad: { score: round2(clamp(1 - dti / 0.50) * 20), max: 20, value: round2(dti * 100), unit: '% of income' },
    receivables: recTotal > 0 ? { score: round2(clamp(1 - overdueShare) * 15), max: 15, value: round2(overdueShare * 100), unit: '% overdue' } : { score: null, max: 15, value: null, note: 'No receivables data supplied.' },
    incomeDiversity: { score: round2(Math.min(streams, 4) / 4 * 10), max: 10, value: streams, unit: 'streams' },
    liquidity: { score: round2(clamp(emergencyMonths / 3) * 10), max: 10, value: round2(emergencyMonths), unit: 'months' },
  };
  const available = Object.values(components).filter((c) => c.score != null);
  const earned = available.reduce((s, c) => s + c.score, 0);
  const possible = available.reduce((s, c) => s + c.max, 0);
  const score = possible > 0 ? round2(earned / possible * 100) : 0;
  return {
    ok: true, score, band: score >= 80 ? 'strong' : score >= 60 ? 'stable' : score >= 40 ? 'fragile' : 'at risk', components,
    availableWeight: possible, monthlyProfit: round2(monthlyProfit), savingsRatePercent: round2(savingsRate * 100), emergencyMonths: round2(emergencyMonths), debtToIncomePercent: round2(dti * 100),
    confidence: possible >= 85 ? 'high' : possible >= 60 ? 'medium' : 'low',
    missingData: Object.entries(components).filter(([, c]) => c.score == null).map(([k]) => k),
    assumptions: ['Scores use only the values supplied. A missing component is excluded rather than assumed.'],
    source: 'Flux financial-health scoring model; not a credit score or lender rating.',
    limitations: ['This is an educational planning score, not a loan decision, credit score or investment recommendation.', DISCLAIMER],
  };
}

export function businessValuation({ method = 'ebitda', ebitda = null, annualRevenue = null, multipleLow = null, multipleBase = null, multipleHigh = null, netDebt = 0, cash = 0, multipleSource = '' } = {}) {
  const debt = number(netDebt, 'netDebt');
  const cashValue = number(cash, 'cash', { min: 0 });
  const metric = method === 'revenue' ? annualRevenue : ebitda;
  const m = number(metric, method === 'revenue' ? 'annualRevenue' : 'ebitda');
  if (![multipleLow, multipleBase, multipleHigh].every((v) => v != null && Number.isFinite(Number(v)))) return fail('MULTIPLE_REQUIRED', 'Supply low, base and high multiples from a cited market source. Flux does not invent valuation multiples.', { confidence: 'uncertain' });
  if (!String(multipleSource).trim()) return fail('MULTIPLE_SOURCE_REQUIRED', 'Say where the valuation multiples came from.', { confidence: 'uncertain' });
  const low = number(multipleLow, 'multipleLow', { min: 0 });
  const base = number(multipleBase, 'multipleBase', { min: 0 });
  const high = number(multipleHigh, 'multipleHigh', { min: 0 });
  if (!(low <= base && base <= high)) return fail('BAD_MULTIPLE_RANGE', 'Multiples must satisfy low ≤ base ≤ high.', { confidence: 'high' });
  const values = { low: m * low, base: m * base, high: m * high };
  const equity = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, round2(v - debt + cashValue)]));
  return {
    ok: true, method, metricValue: round2(m), multiples: { low, base, high }, enterpriseValue: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, round2(v)])),
    equityValue: equity, netDebt: round2(debt), cash: round2(cashValue), confidence: 'medium',
    assumptions: ['The metric and multiples are supplied by the caller.', 'Multiples are assumed to apply to the chosen metric.'],
    source: `Valuation multiples supplied by caller: ${String(multipleSource).slice(0, 300)}`,
    limitations: ['A valuation range is not a price guarantee or an offer.', 'Verify the metric, date and comparables with a qualified valuation professional.', DISCLAIMER],
  };
}

export function unitEconomics({ pricePerUnit, variableCostPerUnit, customerAcquisitionCost = 0, lifetimeMonths = 12 } = {}) {
  const price = number(pricePerUnit, 'pricePerUnit', { min: 0, allowZero: false });
  const variable = number(variableCostPerUnit, 'variableCostPerUnit', { min: 0 });
  const cac = number(customerAcquisitionCost, 'customerAcquisitionCost', { min: 0 });
  const life = number(lifetimeMonths, 'lifetimeMonths', { min: 1, max: 600 });
  const gross = price - variable; const ltv = gross * life;
  return {
    ok: true, pricePerUnit: round2(price), variableCostPerUnit: round2(variable), grossMarginPerUnit: round2(gross), grossMarginPercent: round2(gross / price * 100),
    customerAcquisitionCost: round2(cac), lifetimeMonths: round2(life), lifetimeGrossProfit: round2(ltv),
    paybackMonths: gross > 0 && cac > 0 ? round2(cac / gross) : null, ltvToCac: cac > 0 ? round2(ltv / cac) : null,
    confidence: 'medium', assumptions: ['One unit per customer per month unless the caller states otherwise.', 'Gross profit is price minus variable cost only.'],
    source: 'Deterministic unit-economics arithmetic.', limitations: ['Excludes fixed costs, churn, discounting, refunds and working-capital timing.'],
  };
}

export function emergencyFundPlan({ monthlyEssentialExpenses, targetMonths = 6, currentSavings = 0, monthlyContribution = 0 } = {}) {
  const expenses = number(monthlyEssentialExpenses, 'monthlyEssentialExpenses', { min: 0, allowZero: false });
  const months = number(targetMonths, 'targetMonths', { min: 1, max: 36 });
  const savings = number(currentSavings, 'currentSavings', { min: 0 });
  const contribution = number(monthlyContribution, 'monthlyContribution', { min: 0 });
  const target = expenses * months; const gap = Math.max(0, target - savings);
  const monthsToTarget = contribution > 0 ? Math.ceil(gap / contribution) : null;
  return {
    ok: true, targetAmount: round2(target), currentSavings: round2(savings), gap: round2(gap), monthlyContribution: round2(contribution), monthsToTarget, targetMonths: months,
    status: gap === 0 ? 'target met' : contribution === 0 ? 'contribution needed' : monthsToTarget > months ? 'longer than target window' : 'on track',
    confidence: 'high', assumptions: ['Essential expenses stay constant.', 'Savings earn no return and inflation is ignored.'],
    source: 'Deterministic emergency-fund arithmetic.', limitations: ['Keep the fund liquid and review it when expenses change.', DISCLAIMER],
  };
}

export function debtReductionPlan({ debts = [], extraPayment = 0 } = {}) {
  if (!Array.isArray(debts) || !debts.length) return fail('NO_DEBTS', 'Supply at least one debt with balance, annual rate and minimum payment.', { confidence: 'high' });
  const rows = debts.map((d, i) => ({
    name: String(d.name || `Debt ${i + 1}`).slice(0, 80),
    balance: number(d.balance, `debts[${i}].balance`, { min: 0, allowZero: false }),
    annualRatePercent: number(d.annualRatePercent ?? d.annualRate, `debts[${i}].annualRatePercent`, { min: 0, max: 100 }),
    minimumPayment: number(d.minimumPayment, `debts[${i}].minimumPayment`, { min: 0 }),
  }));
  const extra = number(extraPayment, 'extraPayment', { min: 0 });
  const ordered = [...rows].sort((a, b) => b.annualRatePercent - a.annualRatePercent || a.balance - b.balance);
  let totalInterest = 0; const payoff = []; const balances = ordered.map((d) => d.balance);
  for (let month = 1; month <= 600; month++) {
    let pool = extra;
    for (let i = 0; i < ordered.length; i++) {
      if (balances[i] <= 0) continue;
      const interest = balances[i] * ordered[i].annualRatePercent / 1200;
      totalInterest += interest; balances[i] += interest;
      const pay = Math.min(balances[i], ordered[i].minimumPayment + pool);
      balances[i] -= pay; pool = Math.max(0, pool - Math.max(0, pay - ordered[i].minimumPayment));
      if (balances[i] <= 0 && !payoff.find((p) => p.name === ordered[i].name)) payoff.push({ name: ordered[i].name, month });
    }
    if (balances.every((b) => b <= 0.01)) break;
  }
  return {
    ok: true, strategy: 'avalanche (highest interest first)', order: ordered.map((d) => d.name), payoffOrder: payoff,
    totalInterest: round2(totalInterest), extraPayment: round2(extra), months: payoff.length ? Math.max(...payoff.map((p) => p.month)) : null,
    confidence: 'medium', assumptions: ['No new borrowing is added.', 'Rates stay fixed and minimum payments are made every month.'],
    source: 'Deterministic debt amortisation simulation.', limitations: ['Check prepayment penalties and variable-rate terms with each lender.', DISCLAIMER],
  };
}

export function taxAwarenessChecklist({ entityType = 'proprietorship', gstRegistered = true, turnover = null } = {}) {
  const items = [
    { topic: 'GST returns', why: 'Monthly, quarterly and annual returns have different due dates.', action: 'Confirm your filing frequency and reconcile GSTR-1, GSTR-2B and GSTR-3B with your books.', verifyWith: 'CA or GST portal' },
    { topic: 'TDS', why: 'Payments to contractors, professionals, rent and certain vendors can attract TDS.', action: 'Check each vendor payment against the current TDS sections and thresholds; deposit and file on time.', verifyWith: 'CA or Income Tax Department' },
    { topic: 'Advance tax', why: 'Business and other income may require quarterly advance-tax instalments.', action: 'Estimate annual income and pay the applicable instalments; avoid interest under 234B/234C.', verifyWith: 'CA' },
    { topic: 'Input-tax credit', why: 'Unmatched or ineligible credit becomes a cost.', action: 'Match purchase invoices, check supplier filing status and block ineligible credits.', verifyWith: 'CA or GST portal' },
    { topic: 'Records', why: 'Audit and assessment require a clean trail.', action: 'Keep invoices, e-way bills, delivery proofs, bank statements and approvals for the required period.', verifyWith: 'CA' },
  ];
  return {
    ok: true, entityType, gstRegistered, turnover, checklist: items, confidence: 'high',
    source: 'General India tax-awareness checklist. It is not a legal or tax opinion.',
    limitations: [TAX_NOTE, 'Tax law and thresholds change. Verify every item against the current official rules.'],
    disclaimer: 'This is general tax-awareness information, not tax, legal or accounting advice.',
  };
}

export function investmentAwareness() {
  return {
    ok: true,
    principles: [
      { principle: 'Emergency fund first', why: 'It prevents forced selling or expensive borrowing during a shock.', action: 'Keep 3–6 months of essential expenses in a liquid, low-risk place.' },
      { principle: 'Risk and return travel together', why: 'Higher expected return normally comes with a real chance of loss.', action: 'Write down the maximum loss you can tolerate before choosing any product.' },
      { principle: 'Diversify', why: 'Concentration magnifies both gains and losses.', action: 'Spread exposure across assets, sectors and time; understand what you own.' },
      { principle: 'Costs compound too', why: 'Fees reduce the amount that can grow.', action: 'Read every fee, exit load, premium and penalty before investing.' },
      { principle: 'No guaranteed returns', why: 'Anyone promising a guaranteed high return is a red flag.', action: 'Verify the product, issuer, registration and regulator; walk away from pressure.' },
      { principle: 'Match the horizon', why: 'Money needed soon should not be exposed to volatile assets.', action: 'Separate short-term needs, emergency money and long-term wealth.' },
    ],
    disclaimer: DISCLAIMER,
    source: 'General financial-literacy principles. Not a recommendation of any security, scheme or product.',
    limitations: ['Flux does not manage money, execute trades or provide personalised investment advice.'],
  };
}
