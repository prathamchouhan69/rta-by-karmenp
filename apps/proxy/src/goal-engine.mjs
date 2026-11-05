const metricDirections = {
  monthly_revenue: 'increase',
  profit_margin: 'increase',
  collections: 'increase',
  overdue_recovery: 'increase',
  leads: 'increase',
  quotations: 'increase',
  quotation_conversion: 'increase',
  new_customers: 'increase',
  projects_completed: 'increase',
  delivery_milestones: 'increase',
  material_cost_control: 'decrease',
  inventory_reduction: 'decrease',
  vendor_payments: 'increase',
  team_productivity: 'increase',
  marketing_growth: 'increase',
  tender_submissions: 'increase',
  business_expansion: 'increase',
};

const moneyMetrics = new Set(['monthly_revenue', 'collections', 'overdue_recovery', 'material_cost_control', 'vendor_payments']);
const percentMetrics = new Set(['profit_margin', 'quotation_conversion', 'team_productivity', 'marketing_growth']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const decimalPattern = /^-?(?:0|[1-9]\d{0,14})(?:\.\d{1,2})?$/;
const DAY_MS = 86_400_000;

function businessToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

export class GoalValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GoalValidationError';
  }
}

export function validateGoalInput(input, today = businessToday(), { allowPastDeadline = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new GoalValidationError('Goal details must be an object');
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length < 3 || title.length > 120) throw new GoalValidationError('Goal title must contain 3 to 120 characters');

  const metric = input.metric;
  const direction = metricDirections[metric];
  if (!direction) throw new GoalValidationError('Choose a supported business goal metric');
  const unit = typeof input.unit === 'string' ? input.unit.trim() : '';
  const expectedUnit = moneyMetrics.has(metric) ? 'INR' : percentMetrics.has(metric) ? '%' : 'count';
  if (unit !== expectedUnit) throw new GoalValidationError(`The ${metric.replaceAll('_', ' ')} metric must use ${expectedUnit}`);

  const values = {};
  for (const key of ['baseline', 'currentValue', 'minimumTarget', 'target', 'stretchTarget']) {
    if (typeof input[key] !== 'string' && typeof input[key] !== 'number') {
      throw new GoalValidationError(`${key} is required`);
    }
    const raw = String(input[key]);
    if (!decimalPattern.test(raw)) throw new GoalValidationError(`${key} must be a plain decimal with at most two fractional digits`);
    values[key] = toMinorUnits(raw);
  }
  const ordered = direction === 'increase'
    ? values.baseline < values.minimumTarget && values.minimumTarget <= values.target && values.target <= values.stretchTarget
    : values.baseline > values.minimumTarget && values.minimumTarget >= values.target && values.target >= values.stretchTarget;
  if (!ordered) {
    throw new GoalValidationError(direction === 'increase'
      ? 'Targets must be ordered baseline < minimum acceptable ≤ target ≤ stretch'
      : 'Targets must be ordered baseline > minimum acceptable ≥ target ≥ stretch');
  }

  const baselineDate = validateDate(input.baselineDate, 'baselineDate');
  const currentDate = validateDate(input.currentDate, 'currentDate');
  const deadline = validateDate(input.deadline, 'deadline');
  if (baselineDate > currentDate) throw new GoalValidationError('baselineDate must not be after currentDate');
  if (currentDate > today) throw new GoalValidationError('currentDate must not be in the future');
  if (allowPastDeadline ? deadline <= baselineDate : deadline <= today || deadline <= currentDate) {
    throw new GoalValidationError(allowPastDeadline ? 'deadline must be after baselineDate' : 'deadline must be after today and currentDate');
  }

  const owner = typeof input.owner === 'string' ? input.owner.trim() : '';
  if (owner.length < 2 || owner.length > 100) throw new GoalValidationError('Goal owner must contain 2 to 100 characters');

  let capacityPerWeek;
  if (input.capacityPerWeek !== undefined && input.capacityPerWeek !== null && input.capacityPerWeek !== '') {
    const raw = String(input.capacityPerWeek);
    if (!decimalPattern.test(raw) || raw.startsWith('-')) throw new GoalValidationError('capacityPerWeek must be a non-negative decimal');
    capacityPerWeek = raw;
  }

  return {
    title,
    metric,
    unit,
    direction,
    baseline: String(input.baseline),
    currentValue: String(input.currentValue),
    minimumTarget: String(input.minimumTarget),
    target: String(input.target),
    stretchTarget: String(input.stretchTarget),
    baselineDate,
    currentDate,
    deadline,
    owner,
    ...(capacityPerWeek !== undefined ? { capacityPerWeek } : {}),
  };
}

export function evaluateGoal(input, today = businessToday()) {
  const goal = validateGoalInput(input, today, { allowPastDeadline: true });
  const baseline = toMinorUnits(goal.baseline);
  const current = toMinorUnits(goal.currentValue);
  const target = toMinorUnits(goal.target);
  const minimum = toMinorUnits(goal.minimumTarget);
  const stretch = toMinorUnits(goal.stretchTarget);
  const goalDelta = target - baseline;
  const remainingDelta = target - current;
  const daysRemaining = Math.max(0, daysBetween(today, goal.deadline));
  const observationDays = daysBetween(goal.baselineDate, goal.currentDate);
  const progressPercent = clampPercent((current - baseline) * 10_000n / goalDelta);
  const paceDays = BigInt(Math.max(1, daysRemaining));
  const requiredPerDay = divideRoundingUp(abs(remainingDelta), paceDays);
  const requiredPerWeek = divideRoundingUp(abs(remainingDelta) * 7n, paceDays);
  const projected = observationDays <= 0
    ? current
    : current + (current - baseline) * BigInt(daysRemaining) / BigInt(observationDays);
  const enoughHistory = observationDays >= 7;
  const missingInputs = [];
  if (!enoughHistory) missingInputs.push('At least 7 days between the baseline and current actuals');
  if (goal.capacityPerWeek === undefined) missingInputs.push('Available weekly capacity for this metric');

  const capacityMinor = goal.capacityPerWeek === undefined ? null : toMinorUnits(goal.capacityPerWeek);
  const capacitySufficient = capacityMinor !== null && capacityMinor >= requiredPerWeek;
  const reachesTarget = goal.direction === 'increase' ? projected >= target : projected <= target;
  const reachesMinimum = goal.direction === 'increase' ? projected >= minimum : projected <= minimum;
  const completed = goal.direction === 'increase' ? current >= target : current <= target;
  const deadlinePassed = goal.deadline < today;
  const status = completed
    ? 'completed'
    : deadlinePassed
      ? 'behind'
    : missingInputs.length
      ? 'needs_inputs'
      : reachesTarget && capacitySufficient
        ? 'on_track'
        : reachesMinimum && capacitySufficient
          ? 'at_risk'
          : 'behind';
  const risks = [];
  if (!enoughHistory) risks.push('Historical trend is not established from at least seven days of actuals.');
  if (!capacitySufficient && capacityMinor !== null) risks.push('Required weekly pace exceeds the capacity entered for this goal.');
  if (enoughHistory && !reachesMinimum) risks.push('The current historical pace does not project the minimum acceptable target by the deadline.');
  if (deadlinePassed && !completed) risks.push('The deadline has passed without reaching the target.');
  if (status === 'needs_inputs') risks.push('Feasibility remains uncertain until the missing inputs are provided.');

  const dailyActions = completed ? [] : [{
    title: `Record and review ${goal.metric.replaceAll('_', ' ')} progress`,
    owner: goal.owner,
    deadline: today,
    expectedOutcome: `Compare the verified actual with the required pace of ${formatMinorUnits(requiredPerDay, goal.unit)} ${goal.unit} per day.`,
    priority: status === 'behind' || status === 'at_risk' ? 'high' : 'normal',
    reason: 'Regular actuals are needed to detect a missed pace before the deadline.',
  }];
  const weeklyMilestones = completed || deadlinePassed ? [] : makeMilestones(goal, today, 7, 13);
  const monthlyOutcomes = completed || deadlinePassed ? [] : makeMilestones(goal, today, 30, 12);
  const quarterlyObjectives = completed || deadlinePassed ? [] : makeMilestones(goal, today, 90, 4);

  return {
    ...goal,
    ...(typeof input.goal_id === 'string' ? { goal_id: input.goal_id } : {}),
    status,
    progressPercent,
    daysRemaining,
    requiredDailyPace: formatMinorUnits(requiredPerDay, goal.unit),
    requiredWeeklyPace: formatMinorUnits(requiredPerWeek, goal.unit),
    projectedAtDeadline: formatMinorUnits(projected, goal.unit),
    capacitySufficient,
    missingInputs,
    risks,
    dailyActions,
    weeklyMilestones,
    monthlyOutcomes,
    quarterlyObjectives,
  };
}

export function updateGoalActual(goalInput, value, date, today = businessToday()) {
  const raw = String(value ?? '');
  if (!decimalPattern.test(raw)) throw new GoalValidationError('Actual value must be a plain decimal with at most two fractional digits');
  const actualDate = validateDate(date, 'date');
  if (actualDate > today) throw new GoalValidationError('Progress date must not be in the future');
  if (actualDate < goalInput.baselineDate) throw new GoalValidationError('Progress date must not be before the goal baseline');
  return { ...goalInput, currentValue: raw, currentDate: actualDate };
}

function makeMilestones(goal, fromDate, intervalDays, limit) {
  const start = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${goal.deadline}T00:00:00.000Z`);
  const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY_MS));
  const count = Math.min(limit, Math.ceil(total / intervalDays));
  const baseline = toMinorUnits(goal.currentValue);
  const target = toMinorUnits(goal.target);
  const delta = target - baseline;
  return Array.from({ length: count }, (_, index) => {
    const elapsed = Math.min(total, (index + 1) * intervalDays);
    const value = baseline + delta * BigInt(elapsed) / BigInt(total);
    const date = new Date(Math.min(end.getTime(), start.getTime() + elapsed * DAY_MS)).toISOString().slice(0, 10);
    return {
      date,
      targetValue: formatMinorUnits(value, goal.unit),
      owner: goal.owner,
      expectedOutcome: `Reach ${formatMinorUnits(value, goal.unit)} ${goal.unit} by ${date}.`,
    };
  });
}

function validateDate(value, field) {
  if (typeof value !== 'string' || !datePattern.test(value)) throw new GoalValidationError(`${field} must use YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new GoalValidationError(`${field} must be a valid calendar date`);
  }
  return value;
}

function toMinorUnits(value) {
  const [whole, fraction = ''] = String(value).split('.');
  const sign = whole.startsWith('-') ? -1n : 1n;
  const unsignedWhole = whole.replace('-', '');
  return sign * (BigInt(unsignedWhole) * 100n + BigInt(fraction.padEnd(2, '0') || '0'));
}

function formatMinorUnits(value, unit) {
  const negative = value < 0n;
  const absolute = abs(value);
  const whole = (absolute / 100n).toString();
  const fraction = (absolute % 100n).toString().padStart(2, '0');
  const text = unit === 'count' && fraction === '00' ? whole : `${whole}.${fraction}`;
  return `${negative ? '-' : ''}${text}`;
}

function daysBetween(start, end) {
  return Math.round((new Date(`${end}T00:00:00.000Z`).getTime() - new Date(`${start}T00:00:00.000Z`).getTime()) / DAY_MS);
}

function divideRoundingUp(numerator, denominator) {
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator;
}

function clampPercent(value) {
  if (value <= 0n) return 0;
  if (value >= 10_000n) return 100;
  return Number(value) / 100;
}

function abs(value) {
  return value < 0n ? -value : value;
}
