import { DISCLAIMER, TAX_NOTE, round2, number, fail } from './shared.js';

export function gstBreakdown({ taxableValue, gstRate = 18, cessRate = 0, supplyType = 'intra', inclusive = false, rounding = 'nearest-rupee' } = {}) {
  const value = number(taxableValue, 'taxableValue', { min: 0 });
  const rate = number(gstRate, 'gstRate', { min: 0, max: 100 });
  const cess = number(cessRate, 'cessRate', { min: 0, max: 100 });
  if (!['intra', 'inter'].includes(supplyType)) throw Object.assign(new Error('supplyType must be intra or inter'), { status: 422, code: 'BAD_INPUT' });
  const base = inclusive ? value / (1 + (rate + cess) / 100) : value;
  const gstAmount = base * rate / 100;
  const cessAmount = base * cess / 100;
  const beforeRounding = base + gstAmount + cessAmount;
  const total = rounding === 'nearest-rupee' ? Math.round(beforeRounding) : round2(beforeRounding);
  return {
    ok: true, taxableValue: round2(base), gstRate: rate, cessRate: cess, supplyType,
    cgst: supplyType === 'intra' ? round2(gstAmount / 2) : 0,
    sgst: supplyType === 'intra' ? round2(gstAmount / 2) : 0,
    igst: supplyType === 'inter' ? round2(gstAmount) : 0,
    cess: round2(cessAmount), gstAmount: round2(gstAmount), total: round2(total),
    roundingDifference: round2(total - beforeRounding),
    confidence: 'high',
    assumptions: [inclusive ? 'The supplied value already includes GST.' : 'The supplied value excludes GST.', `Rounding: ${rounding}.`],
    source: 'Deterministic GST arithmetic. Rates are supplied by the caller.',
    limitations: [TAX_NOTE, 'Zoho Books remains the source of truth for tax invoices.'],
  };
}

export function emi({ principal, annualRatePercent = 0, months, includeSchedule = false } = {}) {
  const p = number(principal, 'principal', { min: 0, allowZero: false });
  const annual = number(annualRatePercent, 'annualRatePercent', { min: 0, max: 100 });
  const n = Math.round(number(months, 'months', { min: 1, max: 600 }));
  const r = annual / 1200;
  const payment = r === 0 ? p / n : p * r * (1 + r) ** n / ((1 + r) ** n - 1);
  const totalPayment = payment * n;
  const totalInterest = totalPayment - p;
  const schedule = [];
  if (includeSchedule) {
    let balance = p;
    for (let month = 1; month <= n; month++) {
      const interest = balance * r;
      let principalPart = payment - interest;
      if (month === n) principalPart = balance;
      const closing = Math.max(0, balance - principalPart);
      schedule.push({ month, opening: round2(balance), payment: round2(principalPart + interest), interest: round2(interest), principal: round2(principalPart), closing: round2(closing) });
      balance = closing;
    }
  }
  return {
    ok: true, principal: round2(p), annualRatePercent: annual, months: n,
    monthlyEmi: round2(payment), totalPayment: round2(totalPayment), totalInterest: round2(totalInterest), interestSharePercent: round2(totalInterest / totalPayment * 100),
    ...(includeSchedule ? { schedule } : {}),
    confidence: 'high', assumptions: ['The interest rate stays fixed for the full term.', 'Payments are made on time and no fees are added.'],
    source: 'Standard reducing-balance EMI formula.',
    limitations: ['Banks may use a different day-count, compounding or fee structure. Confirm the sanction letter.', 'This is a planning estimate, not a loan offer.'],
    disclaimer: DISCLAIMER,
  };
}

export function loanEligibility({ monthlyIncome, existingMonthlyEmi = 0, foirPercent = 50, annualRatePercent = 9, months = 240 } = {}) {
  const income = number(monthlyIncome, 'monthlyIncome', { min: 0, allowZero: false });
  const existing = number(existingMonthlyEmi, 'existingMonthlyEmi', { min: 0 });
  const foir = number(foirPercent, 'foirPercent', { min: 1, max: 100 });
  const annual = number(annualRatePercent, 'annualRatePercent', { min: 0, max: 100 });
  const n = Math.round(number(months, 'months', { min: 1, max: 600 }));
  const maxEmi = Math.max(0, income * foir / 100 - existing);
  const r = annual / 1200;
  const maxPrincipal = maxEmi === 0 ? 0 : (r === 0 ? maxEmi * n : maxEmi * ((1 + r) ** n - 1) / (r * (1 + r) ** n));
  return {
    ok: true, monthlyIncome: round2(income), existingMonthlyEmi: round2(existing), foirPercent: foir,
    maximumMonthlyEmi: round2(maxEmi), estimatedMaximumLoan: round2(maxPrincipal), annualRatePercent: annual, months: n,
    confidence: 'medium',
    assumptions: [`FOIR is assumed at ${foir}% and the rate stays fixed.`, 'Lenders also assess credit score, age, collateral, business income stability and existing obligations.'],
    source: 'Standard FOIR and reducing-balance loan arithmetic.',
    limitations: ['This is eligibility awareness, not a sanction, approval or guarantee.', DISCLAIMER],
  };
}

export function breakEven({ fixedCosts, pricePerUnit, variableCostPerUnit } = {}) {
  const fixed = number(fixedCosts, 'fixedCosts', { min: 0 });
  const price = number(pricePerUnit, 'pricePerUnit', { min: 0, allowZero: false });
  const variable = number(variableCostPerUnit, 'variableCostPerUnit', { min: 0 });
  const contribution = price - variable;
  if (contribution <= 0) return fail('NO_CONTRIBUTION', 'Price must be higher than variable cost per unit for a break-even point to exist.', { confidence: 'high' });
  const units = fixed / contribution;
  return {
    ok: true, pricePerUnit: round2(price), variableCostPerUnit: round2(variable), contributionPerUnit: round2(contribution),
    contributionMarginPercent: round2(contribution / price * 100), breakEvenUnits: Math.ceil(units), breakEvenRevenue: round2(Math.ceil(units) * price),
    confidence: 'high', assumptions: ['Fixed and variable costs are complete and stay constant in the period.'],
    source: 'Standard contribution-margin break-even formula.',
    limitations: ['Volume discounts, mixed products and step costs can change the result.'],
  };
}

export function workingCapital({ currentAssets, currentLiabilities, inventory = 0 } = {}) {
  const assets = number(currentAssets, 'currentAssets', { min: 0 });
  const liabilities = number(currentLiabilities, 'currentLiabilities', { min: 0 });
  const stock = number(inventory, 'inventory', { min: 0 });
  if (liabilities === 0) return fail('NO_LIABILITIES', 'Current liabilities must be greater than zero for ratio analysis.', { confidence: 'high' });
  const wc = assets - liabilities;
  return {
    ok: true, currentAssets: round2(assets), currentLiabilities: round2(liabilities), inventory: round2(stock), workingCapital: round2(wc),
    currentRatio: round2(assets / liabilities), quickRatio: round2((assets - stock) / liabilities),
    status: wc > 0 ? 'positive working capital' : wc === 0 ? 'balanced' : 'negative working capital',
    confidence: 'high', assumptions: ['The supplied figures are from the same date and use the same accounting basis.'],
    source: 'Standard current-ratio and quick-ratio arithmetic.',
    limitations: ['Ratios hide timing, quality of receivables and inventory obsolescence.'],
  };
}
