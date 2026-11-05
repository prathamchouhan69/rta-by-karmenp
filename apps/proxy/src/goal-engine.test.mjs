import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGoal, GoalValidationError, updateGoalActual, validateGoalInput } from './goal-engine.mjs';

const dateOffset = (offset) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const date = new Date(`${fields.year}-${fields.month}-${fields.day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const goalInput = (patch = {}) => ({
  title: 'Grow monthly revenue',
  metric: 'monthly_revenue',
  unit: 'INR',
  baseline: '2500000',
  currentValue: '2800000',
  minimumTarget: '3000000',
  target: '3500000',
  stretchTarget: '4000000',
  baselineDate: dateOffset(-30),
  currentDate: dateOffset(0),
  deadline: dateOffset(30),
  owner: 'Workspace owner',
  capacityPerWeek: '200000',
  ...patch,
});

describe('goal engine', () => {
  it('creates evidence-labeled weekly, monthly, and quarterly checkpoints', () => {
    const goal = evaluateGoal(goalInput());
    assert.equal(goal.status, 'at_risk');
    assert.equal(goal.progressPercent, 30);
    assert.equal(goal.requiredWeeklyPace, '163333.34');
    assert.equal(goal.projectedAtDeadline, '3100000.00');
    assert.equal(goal.missingInputs.length, 0);
    assert.equal(goal.weeklyMilestones.length, 5);
    assert.equal(goal.monthlyOutcomes.length, 1);
    assert.equal(goal.dailyActions[0].owner, 'Workspace owner');
  });

  it('marks feasibility as uncertain when capacity is missing', () => {
    const goal = evaluateGoal(goalInput({ capacityPerWeek: undefined }));
    assert.equal(goal.status, 'needs_inputs');
    assert.deepEqual(goal.missingInputs, ['Available weekly capacity for this metric']);
  });

  it('handles goals where lower values are better', () => {
    const goal = evaluateGoal(goalInput({
      title: 'Reduce material cost',
      metric: 'material_cost_control',
      baseline: '100',
      currentValue: '95',
      minimumTarget: '90',
      target: '80',
      stretchTarget: '70',
      unit: 'INR',
      capacityPerWeek: '20',
    }));
    assert.equal(goal.direction, 'decrease');
    assert.equal(goal.progressPercent, 25);
    assert.equal(goal.status, 'at_risk');
  });

  it('keeps overdue goals visible and marks unmet targets behind', () => {
    const goal = evaluateGoal(goalInput({
      currentDate: dateOffset(-2),
      deadline: dateOffset(-1),
    }));
    assert.equal(goal.status, 'behind');
    assert.equal(goal.daysRemaining, 0);
    assert.equal(goal.weeklyMilestones.length, 0);
  });

  it('rejects invented ordering, unsupported units, and invalid dates', () => {
    assert.throws(() => validateGoalInput(goalInput({ target: '2000000' })), GoalValidationError);
    assert.throws(() => validateGoalInput(goalInput({ unit: '%' })), /must use INR/);
    assert.throws(() => validateGoalInput(goalInput({ deadline: '2026-02-30' })), /valid calendar date/);
  });

  it('accepts late actuals but rejects progress dates in the future', () => {
    const goal = validateGoalInput(goalInput());
    assert.equal(updateGoalActual(goal, '2900000', dateOffset(0)).currentValue, '2900000');
    assert.equal(updateGoalActual(goal, '2900000', dateOffset(31), dateOffset(31)).currentDate, dateOffset(31));
    assert.throws(() => updateGoalActual(goal, '2900000', dateOffset(1), dateOffset(0)), /must not be in the future/);
  });
});
