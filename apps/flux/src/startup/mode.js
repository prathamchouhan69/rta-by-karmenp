// Startup Founder Mode: runway, burn efficiency, dilution arithmetic and a
// combined snapshot. Inputs are caller-supplied; Flux does not invent valuations,
// benchmarks or market data.
import { DISCLAIMER, round2, number, fail } from '../finance/shared.js';
import { breakEven, unitEconomics } from '../finance/engine.js';
import { financialHealthScore } from '../finance/planning.js';

const CURRENCY = (value) => String(value || 'INR').toUpperCase().slice(0, 3);

export function runway({
  cashBalance, monthlyRevenue = 0, monthlyExpenses, monthlyRevenueGrowthPercent = 0,
  months = 36, currency = 'INR',
} = {}) {
  const cash = number(cashBalance, 'cashBalance');
  const revenue = number(monthlyRevenue, 'monthlyRevenue');
  const expenses = number(monthlyExpenses, 'monthlyExpenses', { allowZero: false });
  const growth = number(monthlyRevenueGrowthPercent, 'monthlyRevenueGrowthPercent', { min: -100, max: 500 });
  const count = Math.min(120, Math.round(number(months, 'months', { min: 1, max: 120 })));
  let balance = cash; let currentRevenue = revenue; let zeroMonth = null; let lowest = cash; const rows = [];
  for (let month = 1; month <= count; month++) {
    const net = currentRevenue - expenses;
    balance += net;
    if (balance < lowest) lowest = balance;
    if (balance < 0 && zeroMonth == null) zeroMonth = month;
    rows.push({ month, revenue: round2(currentRevenue), expenses: round2(expenses), net: round2(net), closingCash: round2(balance) });
    currentRevenue *= 1 + growth / 100;
  }
  return {
    ok: true, currency: CURRENCY(currency), openingCash: round2(cash), monthlyRevenue: round2(revenue), monthlyExpenses: round2(expenses),
    monthlyNetBurn: round2(expenses - revenue), revenueGrowthPercent: round2(growth),
    runwayMonths: zeroMonth == null ? null : zeroMonth, lowestCash: round2(lowest),
    status: zeroMonth == null ? 'cash stays positive in this scenario' : `cash falls below zero in month ${zeroMonth}`,
    rows, confidence: 'medium',
    assumptions: ['Revenue grows at a constant monthly rate supplied by the caller.', 'Expenses stay constant and are paid in the same month.', 'No new funding, loan, tax refund or one-off receipt is included.'],
    source: 'Deterministic month-by-month runway arithmetic.',
    limitations: ['Runway is a scenario, not a prediction. Update it with the bank balance and committed costs.', 'Collections timing, GST and payroll cycles can make the real low point earlier.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}

export function burnMultiple({ netBurn, netNewRevenue, periodMonths = 12 } = {}) {
  const burn = number(netBurn, 'netBurn', { min: 0, allowZero: false });
  const added = number(netNewRevenue, 'netNewRevenue');
  const period = number(periodMonths, 'periodMonths', { min: 1, max: 120 });
  if (added <= 0) return fail('NO_REVENUE_GROWTH', 'Net new revenue must be greater than zero to calculate burn multiple.', { confidence: 'high' });
  const value = burn / added;
  return {
    ok: true, netBurn: round2(burn), netNewRevenue: round2(added), periodMonths: period,
    burnMultiple: round2(value), interpretation: value <= 1 ? 'efficient in this period' : value <= 2 ? 'moderate' : value <= 3 ? 'stretched' : 'cash-intensive relative to added revenue',
    confidence: 'high', assumptions: ['Net burn and net new revenue are for the same period and use the same accounting basis.'],
    source: 'Deterministic burn-multiple arithmetic.', limitations: ['A single period can mislead. Track the ratio over several periods and note seasonality.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}

export function dilution({ preMoneyValuation, investmentAmount, optionPoolPercent = 0, existingInvestorPercent = 0 } = {}) {
  const pre = number(preMoneyValuation, 'preMoneyValuation', { allowZero: false });
  const investment = number(investmentAmount, 'investmentAmount', { allowZero: false });
  const pool = number(optionPoolPercent, 'optionPoolPercent', { min: 0, max: 100 });
  const existing = number(existingInvestorPercent, 'existingInvestorPercent', { min: 0, max: 100 });
  if (pool + existing > 100) return fail('BAD_OWNERSHIP', 'Option pool plus existing investor ownership cannot exceed 100%.', { confidence: 'high' });
  const post = pre + investment;
  const investorPercent = investment / post * 100;
  const foundersBefore = 100 - existing;
  const foundersAfter = foundersBefore - investorPercent - pool;
  return {
    ok: true, preMoneyValuation: round2(pre), investmentAmount: round2(investment), postMoneyValuation: round2(post),
    investorOwnershipPercent: round2(investorPercent), optionPoolPercent: round2(pool), existingInvestorPercent: round2(existing),
    foundersBeforePercent: round2(foundersBefore), foundersAfterPercent: round2(foundersAfter), foundersDilutionPercent: round2(foundersBefore - foundersAfter),
    confidence: 'high',
    assumptions: ['The pre-money valuation is supplied by the caller and is not a Flux opinion.', 'The option pool is created or expanded before the round and dilutes founders in this model.', 'No convertible notes, SAFE instruments, liquidation preferences or tranches are modelled.'],
    source: 'Deterministic ownership arithmetic.',
    limitations: ['This is cap-table arithmetic, not a valuation or a legal opinion. Use a lawyer and a cap-table tool for an actual round.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}

export function startupSnapshot({
  cashBalance, monthlyRevenue = 0, monthlyExpenses, monthlyRevenueGrowthPercent = 0,
  pricePerUnit, variableCostPerUnit, customerAcquisitionCost = 0, lifetimeMonths = 12,
  fixedCosts = 0, existingMonthlyEmi = 0, currency = 'INR',
} = {}) {
  const cash = number(cashBalance, 'cashBalance');
  const revenue = number(monthlyRevenue, 'monthlyRevenue');
  const expenses = number(monthlyExpenses, 'monthlyExpenses', { allowZero: false });
  const price = number(pricePerUnit, 'pricePerUnit', { allowZero: false });
  const variable = number(variableCostPerUnit, 'variableCostPerUnit');
  const fixed = number(fixedCosts, 'fixedCosts');
  const emiValue = number(existingMonthlyEmi, 'existingMonthlyEmi');
  const run = runway({ cashBalance: cash, monthlyRevenue: revenue, monthlyExpenses: expenses, monthlyRevenueGrowthPercent, months: 36, currency });
  const unit = unitEconomics({ pricePerUnit: price, variableCostPerUnit: variable, customerAcquisitionCost, lifetimeMonths });
  const breakEvenResult = breakEven({ fixedCosts: fixed + emiValue, pricePerUnit: price, variableCostPerUnit: variable });
  const health = financialHealthScore({
    monthlyIncome: revenue > 0 ? revenue : 1, monthlyExpenses: expenses + emiValue,
    liquidSavings: cash, monthlyDebtPayments: emiValue, incomeStreams: 1,
  });
  return {
    ok: true, currency: CURRENCY(currency),
    runway: { months: run.runwayMonths, status: run.status, monthlyNetBurn: run.monthlyNetBurn, lowestCash: run.lowestCash },
    unitEconomics: { grossMarginPerUnit: unit.grossMarginPerUnit, grossMarginPercent: unit.grossMarginPercent, paybackMonths: unit.paybackMonths, ltvToCac: unit.ltvToCac },
    breakEven: breakEvenResult.ok === false
      ? { available: false, code: breakEvenResult.code, message: breakEvenResult.message }
      : { available: true, unitsPerMonth: breakEvenResult.breakEvenUnits, revenuePerMonth: breakEvenResult.breakEvenRevenue, contributionPerUnit: breakEvenResult.contributionPerUnit },
    financialHealth: { score: health.score, band: health.band },
    alerts: [
      ...(run.runwayMonths != null && run.runwayMonths <= 6 ? [{ severity: 'high', message: `Cash falls below zero in month ${run.runwayMonths} under this scenario.` }] : []),
      ...(unit.grossMarginPerUnit <= 0 ? [{ severity: 'high', message: 'Variable cost is at or above price, so every unit destroys contribution.' }] : []),
      ...(unit.paybackMonths != null && unit.paybackMonths > 18 ? [{ severity: 'medium', message: 'Customer payback is longer than 18 months in this model.' }] : []),
      ...(revenue > 0 && expenses > revenue ? [{ severity: 'medium', message: 'Monthly expenses exceed monthly revenue. Validate the path to contribution margin.' }] : []),
    ],
    confidence: 'medium',
    assumptions: ['All inputs are supplied by the caller and treated as monthly unless stated otherwise.', 'Runway assumes constant expenses and caller-stated revenue growth.', 'The financial-health score is an educational planning model, not a credit score or investor rating.'],
    source: 'Deterministic combination of runway, unit-economics, break-even and financial-health calculations.',
    limitations: ['This snapshot is not a valuation, investment recommendation or audited financial statement.', 'Tax, working-capital timing and one-off costs are excluded unless supplied.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}
