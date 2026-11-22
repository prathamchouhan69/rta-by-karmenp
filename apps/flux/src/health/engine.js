import { newId } from '../util/ids.js';
import { bmi, bmr, tdee, waterTarget, macros } from './calculations.js';
import { vitalsCheck, emergencyCheck, VITAL_TYPES } from './vitals.js';
import { lifestylePlan, workforceHeatGuidance } from './lifestyle.js';
import { HEALTH_DISCLAIMER } from './calculations.js';

export { HEALTH_DISCLAIMER, bmi, bmr, tdee, waterTarget, macros } from './calculations.js';
export { vitalsCheck, emergencyCheck, VITAL_TYPES } from './vitals.js';
export { lifestylePlan, workforceHeatGuidance } from './lifestyle.js';

export class HealthEngine {
  constructor({ store, audit, now = () => new Date() }) {
    this.profiles = store.collection('health_profiles');
    this.vitals = store.collection('health_vitals');
    this.goals = store.collection('health_goals');
    this.audit = audit;
    this.now = now;
  }

  setProfile(userId, input, actor = { id: userId }) {
    const consent = input?.consent === true;
    if (!consent) throw Object.assign(new Error('Consent is required to store health data'), { status: 422, code: 'CONSENT_REQUIRED' });
    const s = String(input?.sex || '').toLowerCase();
    if (s && !['male', 'female'].includes(s)) throw Object.assign(new Error('sex must be male or female'), { status: 422, code: 'BAD_SEX' });
    const profile = {
      id: userId,
      sex: s || null,
      ageYears: input?.ageYears ? num(input.ageYears, 'ageYears', { min: 1, max: 120, allowZero: false }) : null,
      heightCm: input?.heightCm ? num(input.heightCm, 'heightCm', { min: 50, max: 300, allowZero: false }) : null,
      weightKg: input?.weightKg ? num(input.weightKg, 'weightKg', { min: 20, max: 500, allowZero: false }) : null,
      activityLevel: input?.activityLevel || 'sedentary',
      dietaryPreference: input?.dietaryPreference || 'vegetarian',
      medicalConditions: Array.isArray(input?.medicalConditions) ? input.medicalConditions.map(String).slice(0, 20) : [],
      medications: Array.isArray(input?.medications) ? input.medications.map(String).slice(0, 20) : [],
      allergies: Array.isArray(input?.allergies) ? input.allergies.map(String).slice(0, 20) : [],
      goals: Array.isArray(input?.goals) ? input.goals.map(String).slice(0, 20) : [],
      language: String(input?.language || 'en').slice(0, 10),
      updatedBy: actor.id,
      updatedAt: this.now().toISOString(),
      disclaimer: HEALTH_DISCLAIMER
    };
    this.profiles.put(userId, profile);
    this.audit.append({ actor: actor.id, action: 'health.profile_saved', data: { userId } });
    return { ok: true, profile };
  }

  saveProfile(userId, input, actor = { id: userId }) {
    return this.setProfile(userId, input, actor);
  }

  getProfile(userId) { return this.profiles.get(userId); }

  deleteProfile(userId, actor = { id: userId }) {
    const had = this.profiles.del(userId);
    this.audit.append({ actor: actor.id, action: 'health.profile_deleted', data: { userId, removed: had } });
    return { ok: true, removed: had, disclaimer: HEALTH_DISCLAIMER };
  }

  addVital(userId, input, actor = { id: userId }) {
    const type = String(input?.type || '');
    if (!VITAL_TYPES.has(type)) throw Object.assign(new Error(`type must be one of ${[...VITAL_TYPES].join(', ')}`), { status: 422, code: 'BAD_TYPE' });
    let value = input.value;
    if (type === 'blood_pressure') {
      if (!input.value || typeof input.value !== 'object') throw Object.assign(new Error('blood_pressure value must be {systolic, diastolic}'), { status: 422, code: 'BAD_VALUE' });
      value = { systolic: num(input.value.systolic, 'systolic', { min: 40, max: 300 }), diastolic: num(input.value.diastolic, 'diastolic', { min: 20, max: 200 }) };
    } else {
      value = num(input.value, 'value', { min: 0, max: 1000000 });
    }
    const measuredAt = input.measuredAt || this.now().toISOString();
    if (Number.isNaN(new Date(measuredAt).getTime())) throw Object.assign(new Error('measuredAt must be a valid date'), { status: 422, code: 'BAD_DATE' });
    const row = { id: newId('vital'), userId, type, value, unit: String(input.unit || '').slice(0, 20), measuredAt, notes: String(input.notes || '').slice(0, 300), enteredBy: actor.id, enteredAt: this.now().toISOString(), disclaimer: HEALTH_DISCLAIMER };
    this.vitals.put(row.id, row);
    this.audit.append({ actor: actor.id, action: 'health.vital_added', data: { id: row.id, userId, type, measuredAt } });
    return { ok: true, vital: row };
  }

  listVitals(userId, { type = null, limit = 50, since = null, until = null } = {}) {
    let results = this.vitals.all().filter((v) => v.userId === userId);
    if (type) results = results.filter((v) => v.type === type);
    if (since) results = results.filter((v) => new Date(v.measuredAt) >= new Date(since));
    if (until) results = results.filter((v) => new Date(v.measuredAt) <= new Date(until));
    return results.sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)).slice(0, Math.max(1, Math.min(Number(limit) || 50, 200)));
  }

  getVitalTrends(userId, { type, days = 30 } = {}) {
    const since = new Date(this.now().getTime() - days * 86400000).toISOString();
    const vitals = this.listVitals(userId, { type, since, limit: 200 });
    if (!vitals.length) return { ok: true, userId, type, trends: [], disclaimer: HEALTH_DISCLAIMER };

    const byType = {};
    for (const v of vitals) {
      if (!byType[v.type]) byType[v.type] = [];
      byType[v.type].push(v);
    }

    const trends = Object.entries(byType).map(([t, arr]) => {
      if (arr.length < 2) return { type: t, trend: 'insufficient_data', points: arr.length };
      const values = arr.map(v => typeof v.value === 'object' ? (v.value.systolic ? v.value.systolic : null) : v.value).filter(n => n != null);
      if (values.length < 2) return { type: t, trend: 'insufficient_data', points: arr.length };
      const first = values[values.length - 1];
      const last = values[0];
      const change = last - first;
      const pctChange = first !== 0 ? round2((change / first) * 100) : null;
      const direction = change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable';
      return { type: t, trend: direction, change: round2(change), changePercent: pctChange, firstValue: first, lastValue: last, points: arr.length, timeRangeDays: days };
    });

    return { ok: true, userId, trends: type ? trends.filter(t => t.type === type) : trends, disclaimer: HEALTH_DISCLAIMER };
  }

  setGoal(userId, input, actor = { id: userId }) {
    const goal = {
      id: newId('goal'),
      userId,
      type: String(input?.type || ''),
      target: input?.target,
      unit: String(input?.unit || ''),
      frequency: String(input?.frequency || 'daily'),
      startDate: input?.startDate || this.now().toISOString(),
      targetDate: input?.targetDate || null,
      notes: String(input?.notes || '').slice(0, 500),
      status: 'active',
      createdBy: actor.id,
      createdAt: this.now().toISOString(),
      progress: [],
      disclaimer: HEALTH_DISCLAIMER
    };
    if (!goal.type) throw Object.assign(new Error('type is required'), { status: 422, code: 'BAD_INPUT' });
    this.goals.put(goal.id, goal);
    this.audit.append({ actor: actor.id, action: 'health.goal_created', data: { id: goal.id, userId, type: goal.type } });
    return { ok: true, goal };
  }

  listGoals(userId, { status = 'active' } = {}) {
    return this.goals.all().filter(g => g.userId === userId && (!status || g.status === status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  updateGoalProgress(goalId, value, actor = { id: 'system' }) {
    const goal = this.goals.get(goalId);
    if (!goal) throw Object.assign(new Error('Goal not found'), { status: 404, code: 'NOT_FOUND' });
    const entry = { value, at: this.now().toISOString(), enteredBy: actor.id };
    goal.progress.push(entry);
    if (goal.target && ((goal.target > goal.progress[0]?.value && value >= goal.target) || (goal.target < goal.progress[0]?.value && value <= goal.target))) {
      goal.status = 'achieved';
      goal.achievedAt = this.now().toISOString();
    }
    this.goals.put(goalId, goal);
    this.audit.append({ actor: actor.id, action: 'health.goal_progress', data: { id: goalId, value } });
    return { ok: true, goal };
  }

  insights(userId) {
    const profile = this.getProfile(userId);
    const latest = {};
    for (const v of this.listVitals(userId, { limit: 200 })) if (!latest[v.type]) latest[v.type] = v;
    const result = [];
    if (profile?.weightKg && profile?.heightCm) result.push(bmi({ weightKg: profile.weightKg, heightCm: profile.heightCm }));
    if (latest.blood_pressure?.value) result.push(vitalsCheck({ systolic: latest.blood_pressure.value.systolic, diastolic: latest.blood_pressure.value.diastolic }));
    if (latest.heart_rate) result.push(vitalsCheck({ heartRate: latest.heart_rate.value }));
    if (latest.spo2) result.push(vitalsCheck({ spo2Percent: latest.spo2.value }));
    if (latest.blood_sugar) result.push(vitalsCheck({ fastingGlucoseMgDl: latest.blood_sugar.value }));
    if (latest.temperature) result.push(vitalsCheck({ temperatureC: latest.temperature.value }));
    if (latest.sleep) result.push(vitalsCheck({ sleepHours: latest.sleep.value }));
    if (latest.hydration && profile?.weightKg) result.push(vitalsCheck({ hydrationMl: latest.hydration.value, weightKg: profile.weightKg }));
    return { ok: true, userId, profile: profile || null, latestVitals: Object.values(latest), insights: result, disclaimer: HEALTH_DISCLAIMER, limitations: ['Insights use only recorded values. Missing or stale data is not inferred.'] };
  }
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v, name, { min = -Infinity, max = Infinity, allowZero = true } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw Object.assign(new Error(`${name} must be a number`), { status: 422, code: 'BAD_INPUT' });
  if (!allowZero && n === 0) throw Object.assign(new Error(`${name} must not be zero`), { status: 422, code: 'BAD_INPUT' });
  if (n < min || n > max) throw Object.assign(new Error(`${name} is out of range`), { status: 422, code: 'BAD_INPUT' });
  return n;
};

export const HealthStore = HealthEngine;