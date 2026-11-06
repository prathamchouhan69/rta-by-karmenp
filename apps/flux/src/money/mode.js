// Money Mode: deterministic personal and business cash planning.
// Every rate, expense and goal comes from the caller. Flux does not invent prices,
// returns or product recommendations.
import { DISCLAIMER, round2, number, fail } from '../finance/shared.js';

const CURRENCY = (value) => String(value || 'INR').toUpperCase().slice(0, 3);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function budgetPlan({
  monthlyIncome, expenses = [], debtPayments = 0, savingsGoal = 0,
  liquidSavings = 0, currency = 'INR', notes = [],
} = {}) {
  const income = number(monthlyIncome, 'monthlyIncome', { allowZero: false });
  const debt = number(debtPayments, 'debtPayments');
  const goal = number(savingsGoal, 'savingsGoal');
  const liquid = number(liquidSavings, 'liquidSavings');
  if (!Array.isArray(expenses)) return fail('BAD_EXPENSES', 'expenses must be a list of {category, amount, essential}.', { confidence: 'uncertain' });
  const rows = expenses.map((item, index) => {
    const amount = number(item?.amount, `expenses[${index}].amount`);
    return {
      category: String(item?.category || `Expense ${index + 1}`).slice(0, 80),
      amount: round2(amount),
      essential: item?.essential !== false,
    };
  });
  const essential = rows.filter((r) => r.essential).reduce((sum, r) => sum + r.amount, 0);
  const discretionary = rows.filter((r) => !r.essential).reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = essential + discretionary;
  const totalOutflow = totalExpenses + debt;
  const surplus = income - totalOutflow;
  const savingsRate = surplus / income;
  const savingsGoalGap = Math.max(0, goal - surplus);
  const recommendations = [];

  if (surplus < 0) recommendations.push({ priority: 'high', action: 'Close the monthly gap before adding new commitments.', detail: `Outgoings exceed income by ${round2(Math.abs(surplus))} ${CURRENCY(currency)} per month.` });
  if (essential / income > 0.5) recommendations.push({ priority: 'high', action: 'Review fixed essential costs.', detail: 'Essentials take more than half of income. Renegotiate rent, utilities, subscriptions or delivery costs where possible.' });
  if (debt / income > 0.36) recommendations.push({ priority: 'high', action: 'Treat debt servicing as a constraint.', detail: 'Debt payments exceed 36% of income in this plan. List every debt with its rate and minimum payment before borrowing more.' });
  if (savingsRate < 0.2 && surplus >= 0) recommendations.push({ priority: 'medium', action: 'Move savings automatically on income day.', detail: 'The plan saves less than 20% of income. A smaller automatic transfer is more reliable than a large intention.' });
  if (goal > 0) recommendations.push({ priority: savingsGoalGap === 0 ? 'low' : 'medium', action: savingsGoalGap === 0 ? 'Fund the savings goal from this month\'s surplus.' : 'Reduce the goal, raise income or lengthen the timeline.', detail: savingsGoalGap === 0 ? `The surplus covers the ${round2(goal)} ${CURRENCY(currency)} monthly goal.` : `The plan is short by ${round2(savingsGoalGap)} ${CURRENCY(currency)} per month for the stated goal.` });
  if (liquid > 0 && totalExpenses > 0) recommendations.push({ priority: liquid / totalExpenses < 3 ? 'medium' : 'low', action: liquid / totalExpenses < 3 ? 'Build the liquid buffer toward three to six months of essentials.' : 'Keep the buffer liquid and review it when essentials change.', detail: `Current liquid savings cover ${round2(liquid / totalExpenses)} months of total expenses.` });

  return {
    ok: true, currency: CURRENCY(currency), monthlyIncome: round2(income), rows,
    totals: { essential: round2(essential), discretionary: round2(discretionary), expenses: round2(totalExpenses), debtPayments: round2(debt), outgoings: round2(totalOutflow) },
    surplus: round2(surplus), savingsRatePercent: round2(savingsRate * 100),
    splitPercent: { essential: round2(essential / income * 100), discretionary: round2(discretionary / income * 100), debt: round2(debt / income * 100), surplus: round2(surplus / income * 100) },
    ruleOfThumb: { needs: round2(income * 0.5), wants: round2(income * 0.3), savings: round2(income * 0.2), label: '50/30/20 starting point, not a rule that fits every household.' },
    savingsGoal: { amount: round2(goal), gap: round2(savingsGoalGap), covered: savingsGoalGap === 0 },
    liquidCoverMonths: totalExpenses > 0 ? round2(liquid / totalExpenses) : null,
    recommendations, confidence: 'high',
    assumptions: ['All amounts are caller-supplied and treated as monthly.', 'No tax, investment return, inflation or irregular income is modelled.', 'Essential versus discretionary is the caller\'s own classification.', ...(notes || []).map((note) => String(note).slice(0, 300))],
    source: 'Deterministic monthly cash-flow arithmetic.',
    limitations: ['A budget is a plan, not a guarantee. Reconcile it with bank and ledger records.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}

export function savingsGoalPlan({
  targetAmount, currentSavings = 0, monthlyContribution = 0, annualReturnPercent = null,
  targetDate = null, currency = 'INR',
} = {}) {
  const target = number(targetAmount, 'targetAmount', { allowZero: false });
  const current = number(currentSavings, 'currentSavings');
  const monthly = number(monthlyContribution, 'monthlyContribution');
  const hasReturn = annualReturnPercent != null && annualReturnPercent !== '';
  const annual = hasReturn ? number(annualReturnPercent, 'annualReturnPercent', { min: -99, max: 100 }) : null;
  const gap = Math.max(0, target - current);
  let monthsToTarget = null;
  if (gap === 0) monthsToTarget = 0;
  else if (monthly > 0) {
    if (!hasReturn) monthsToTarget = Math.ceil(gap / monthly);
    else {
      const r = annual / 1200;
      let balance = current;
      for (let m = 1; m <= 1200; m++) {
        balance = balance * (1 + r) + monthly;
        if (balance >= target) { monthsToTarget = m; break; }
      }
    }
  }
  let targetDatePlan = null;
  if (targetDate) {
    const end = new Date(`${targetDate}T23:59:59Z`);
    if (Number.isNaN(end.getTime())) return fail('BAD_TARGET_DATE', 'targetDate must be a real date in YYYY-MM-DD form.', { confidence: 'high' });
    const now = new Date();
    const monthsAvailable = Math.max(0, (end.getUTCFullYear() - now.getUTCFullYear()) * 12 + (end.getUTCMonth() - now.getUTCMonth()));
    const required = monthsAvailable === 0 ? gap : gap / monthsAvailable;
    targetDatePlan = { targetDate, monthsAvailable, requiredMonthlyWithoutReturn: round2(required), onTrack: monthly >= required && gap > 0 ? true : gap === 0 };
  }
  return {
    ok: true, currency: CURRENCY(currency), targetAmount: round2(target), currentSavings: round2(current), gap: round2(gap),
    monthlyContribution: round2(monthly), annualReturnPercent: hasReturn ? round2(annual) : null,
    monthsToTarget, yearsToTarget: monthsToTarget == null ? null : round2(monthsToTarget / 12),
    totalContributions: monthsToTarget == null ? null : round2(monthly * monthsToTarget),
    targetDatePlan, confidence: hasReturn ? 'medium' : 'high',
    assumptions: [hasReturn ? `A constant nominal return of ${round2(annual)}% per year is assumed, with monthly compounding.` : 'No investment return is assumed. Only contributions are counted.', 'Contributions are made at the end of each month.', 'No tax, fees or inflation is modelled.'],
    source: 'Deterministic savings-goal arithmetic.',
    limitations: ['A positive return is a scenario, not a promise. Actual returns can be negative.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}

export function expenseReview({ expenses = [], monthlyIncome = null, currency = 'INR' } = {}) {
  if (!Array.isArray(expenses) || !expenses.length) return fail('NO_EXPENSES', 'Supply at least one expense with a category and amount.', { confidence: 'high' });
  const rows = expenses.map((item, index) => ({
    category: String(item?.category || `Expense ${index + 1}`).slice(0, 80),
    amount: round2(number(item?.amount, `expenses[${index}].amount`)),
    essential: item?.essential !== false,
  }));
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const sorted = [...rows].sort((a, b) => b.amount - a.amount);
  const income = monthlyIncome == null ? null : number(monthlyIncome, 'monthlyIncome', { allowZero: false });
  return {
    ok: true, currency: CURRENCY(currency), total: round2(total),
    shareOfIncomePercent: income ? round2(total / income * 100) : null,
    essential: round2(sorted.filter((r) => r.essential).reduce((s, r) => s + r.amount, 0)),
    discretionary: round2(sorted.filter((r) => !r.essential).reduce((s, r) => s + r.amount, 0)),
    largest: sorted.slice(0, 5).map((row) => ({ ...row, sharePercent: total > 0 ? round2(row.amount / total * 100) : 0 })),
    concentration: total > 0 ? round2(clamp(sorted[0].amount / total, 0, 1) * 100) : 0,
    confidence: 'high', assumptions: ['Amounts are caller-supplied and may be monthly or annual as long as they are used consistently.'],
    source: 'Deterministic expense-share arithmetic.',
    limitations: ['Concentration is descriptive, not a judgement about whether an expense is worthwhile.', DISCLAIMER],
    disclaimer: DISCLAIMER,
  };
}
