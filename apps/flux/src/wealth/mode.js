// Wealth Mode: balance-sheet snapshots and caller-defined scenarios.
// No market return, inflation rate, valuation or product is assumed.
import { DISCLAIMER, round2, number, fail } from '../finance/shared.js';

const CURRENCY = (value) => String(value || 'INR').toUpperCase().slice(0, 3);
const ASSET_CLASSES = ['cash', 'fixed_deposit', 'debt', 'equity', 'real_estate', 'gold', 'business', 'retirement', 'other'];
const LIABILITY_CLASSES = ['home_loan', 'vehicle_loan', 'personal_loan', 'business_loan', 'credit_card', 'tax', 'other'];

export function netWorthSnapshot({ assets = [], liabilities = [], currency = 'INR', asOf = null } = {}) {
  if (!Array.isArray(assets) || !Array.isArray(liabilities)) return fail('BAD_BALANCE_SHEET', 'assets and liabilities must be lists.', { confidence: 'uncertain' });
  const assetRows = assets.map((item, index) => ({
    name: String(item?.name || `Asset ${index + 1}`).slice(0, 120),
    class: ASSET_CLASSES.includes(item?.class) ? item.class : 'other',
    value: round2(number(item?.value, `assets[${index}].value`)),
  }));
  const liabilityRows = liabilities.map((item, index) => ({
    name: String(item?.name || `Liability ${index + 1}`).slice(0, 120),
    class: LIABILITY_CLASSES.includes(item?.class) ? item.class : 'other',
    value: round2(number(item?.value, `liabilities[${index}].value`)),
    interestRatePercent: item?.interestRatePercent == null ? null : round2(number(item.interestRatePercent, `liabilities[${index}].interestRatePercent`, { min: 0, max: 100 })),
  }));
  const totalAssets = assetRows.reduce((sum, row) => sum + row.value, 0);
  const totalLiabilities = liabilityRows.reduce((sum, row) => sum + row.value, 0);
  const net = totalAssets - totalLiabilities;
  const allocation = {};
  for (const row of assetRows) allocation[row.class] = round2((allocation[row.class] || 0) + row.value);
  const allocationPercent = Object.fromEntries(Object.entries(allocation).map(([key, value]) => [key, totalAssets > 0 ? round2(value / totalAssets * 100) : 0]));
  const debtToAssets = totalAssets > 0 ? totalLiabilities / totalAssets : null;
  const highCostDebt = liabilityRows.filter((row) => row.interestRatePercent != null && row.interestRatePercent >= 15);
  const warnings = [];
  if (net < 0) warnings.push('Liabilities exceed assets in this snapshot. Focus on the gap and the cost of each liability before adding risk.');
  if (debtToAssets != null && debtToAssets > 0.5) warnings.push('Debt is more than half of assets in this snapshot. Stress-test repayment under a lower-income month.');
  if (highCostDebt.length) warnings.push('At least one liability carries a stated rate of 15% or more. Compare the cost of that debt with any expected investment return.');
  const missing = [];
  if (!assetRows.length) missing.push('assets');
  if (!liabilityRows.length) missing.push('liabilities');
  return {
    ok: true, currency: CURRENCY(currency), asOf, assets: assetRows, liabilities: liabilityRows,
    totalAssets: round2(totalAssets), totalLiabilities: round2(totalLiabilities), netWorth: round2(net),
    allocation, allocationPercent, debtToAssetsPercent: debtToAssets == null ? null : round2(debtToAssets * 100),
    highCostDebt: highCostDebt.map((row) => ({ name: row.name, interestRatePercent: row.interestRatePercent })),
    warnings, missingInputs: missing, confidence: missing.length ? 'low' : 'high',
    assumptions: ['Every value is supplied by the caller and is not independently verified.', 'Assets are valued at the caller\'s chosen date and basis.', 'No tax on unrealised gains or exit costs is included.'],
    source: 'Deterministic balance-sheet arithmetic.',
    limitations: ['A net-worth snapshot is not a valuation report or an investment recommendation.', 'Property, business and unlisted assets may be hard to sell at the stated value.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}

export function compoundScenario({
  principal = 0, monthlyContribution = 0, annualRatePercent, years,
  inflationPercent = 0, currency = 'INR',
} = {}) {
  const start = number(principal, 'principal');
  const monthly = number(monthlyContribution, 'monthlyContribution');
  const annual = number(annualRatePercent, 'annualRatePercent', { min: -99, max: 100 });
  const term = number(years, 'years', { min: 0, max: 80, allowZero: false });
  const inflation = number(inflationPercent, 'inflationPercent', { min: -50, max: 100 });
  const r = annual / 1200; const months = Math.round(term * 12);
  let balance = start; const rows = [];
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + r) + monthly;
    if (m % 12 === 0 || m === months) rows.push({ year: Math.round(m / 12 * 100) / 100, balance: round2(balance) });
  }
  const totalContributions = start + monthly * months;
  const nominalGain = balance - totalContributions;
  const realValue = balance / (1 + inflation / 100) ** term;
  return {
    ok: true, currency: CURRENCY(currency), principal: round2(start), monthlyContribution: round2(monthly),
    annualRatePercent: round2(annual), inflationPercent: round2(inflation), years: round2(term), months,
    futureValue: round2(balance), totalContributions: round2(totalContributions), nominalGain: round2(nominalGain),
    realValueToday: round2(realValue), rows, confidence: 'medium',
    assumptions: [`A constant nominal return of ${round2(annual)}% per year is assumed.`, 'Contributions are made at the end of each month.', `Inflation is assumed to be ${round2(inflation)}% per year.`, 'No tax, fees, exit load or sequence-of-return risk is modelled.'],
    source: 'Deterministic compound-growth arithmetic using caller-supplied rates.',
    limitations: ['This is a scenario, not a forecast or a promise. Real returns vary and can be negative.', 'Tax and fees reduce the actual outcome.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}

export function retirementGap({
  currentAge, retirementAge, lifeExpectancy = 85, monthlyExpensesToday,
  inflationPercent, preRetirementReturnPercent, postRetirementReturnPercent,
  currentCorpus = 0, monthlyContribution = 0, currency = 'INR',
} = {}) {
  const age = number(currentAge, 'currentAge', { min: 15, max: 100 });
  const retire = number(retirementAge, 'retirementAge', { min: age + 1, max: 100 });
  const life = number(lifeExpectancy, 'lifeExpectancy', { min: retire + 1, max: 120 });
  const expenses = number(monthlyExpensesToday, 'monthlyExpensesToday', { allowZero: false });
  const inflation = number(inflationPercent, 'inflationPercent', { min: -50, max: 100 });
  const pre = number(preRetirementReturnPercent, 'preRetirementReturnPercent', { min: -99, max: 100 });
  const post = number(postRetirementReturnPercent, 'postRetirementReturnPercent', { min: -99, max: 100 });
  const corpus = number(currentCorpus, 'currentCorpus');
  const monthly = number(monthlyContribution, 'monthlyContribution');
  const yearsToRetire = retire - age; const retirementYears = life - retire;
  const realPre = (1 + pre / 100) / (1 + inflation / 100) - 1;
  const realPost = (1 + post / 100) / (1 + inflation / 100) - 1;
  const annualExpensesToday = expenses * 12;
  const corpusNeeded = realPost > 0
    ? annualExpensesToday * (1 - (1 + realPost) ** -retirementYears) / realPost
    : annualExpensesToday * retirementYears;
  const growth = (1 + realPre) ** yearsToRetire;
  const annuity = Math.abs(realPre) < 1e-9 ? yearsToRetire * 12 : ((growth - 1) / realPre) * 12;
  const projected = corpus * growth + monthly * annuity;
  const gap = corpusNeeded - projected;
  const requiredMonthly = gap > 0 && annuity > 0 ? gap / annuity : 0;
  return {
    ok: true, currency: CURRENCY(currency), currentAge: round2(age), retirementAge: round2(retire), lifeExpectancy: round2(life),
    yearsToRetirement: yearsToRetire, retirementYears: round2(retirementYears),
    annualExpensesToday: round2(annualExpensesToday),
    assumptionsUsed: { inflationPercent: round2(inflation), preRetirementReturnPercent: round2(pre), postRetirementReturnPercent: round2(post) },
    realReturnPreRetirementPercent: round2(realPre * 100), realReturnPostRetirementPercent: round2(realPost * 100),
    corpusNeededTodayRupees: round2(corpusNeeded), currentCorpus: round2(corpus), projectedCorpusTodayRupees: round2(projected),
    gapTodayRupees: round2(gap), requiredMonthlyContributionTodayRupees: round2(requiredMonthly),
    status: gap <= 0 ? 'projected corpus covers the stated plan' : 'projected shortfall',
    confidence: 'medium',
    assumptions: ['All figures are in today\'s purchasing power after subtracting the stated inflation rate.', 'Expenses continue at the same real level through retirement.', 'Returns, inflation and contributions are constant; real life is uneven.', 'No pension, rental income, inheritance, tax or healthcare shock is included.'],
    source: 'Deterministic real-return retirement projection using caller-supplied rates.',
    limitations: ['A retirement projection is not a guarantee. Review it with a qualified financial planner and update it yearly.', 'Healthcare costs often rise faster than general inflation.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}

export { ASSET_CLASSES, LIABILITY_CLASSES };
