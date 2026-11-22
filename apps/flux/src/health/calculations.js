import { newId } from '../util/ids.js';

export const HEALTH_DISCLAIMER = 'This is general health information, not medical advice.';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v, name, { min = -Infinity, max = Infinity, allowZero = true } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw Object.assign(new Error(`${name} must be a number`), { status: 422, code: 'BAD_INPUT' });
  if (!allowZero && n === 0) throw Object.assign(new Error(`${name} must not be zero`), { status: 422, code: 'BAD_INPUT' });
  if (n < min || n > max) throw Object.assign(new Error(`${name} is out of range`), { status: 422, code: 'BAD_INPUT' });
  return n;
};

export function bmi({ weightKg, heightCm } = {}) {
  const weight = num(weightKg, 'weightKg', { min: 1, max: 500, allowZero: false });
  const height = num(heightCm, 'heightCm', { min: 50, max: 300, allowZero: false }) / 100;
  const value = weight / (height * height);
  const category = value < 18.5 ? 'underweight' : value < 25 ? 'normal weight' : value < 30 ? 'overweight' : 'obese';
  const healthyLow = 18.5 * height * height;
  const healthyHigh = 24.9 * height * height;
  return {
    ok: true, bmi: round2(value), category,
    healthyWeightRangeKg: { low: round2(healthyLow), high: round2(healthyHigh) },
    confidence: 'high', source: 'WHO adult BMI classification.',
    assumptions: ['Adult, non-pregnant classification.'],
    limitations: ['BMI does not measure body fat, muscle, bone density or fat distribution. Indian guidelines may use different waist and BMI thresholds; ask a qualified clinician.', HEALTH_DISCLAIMER],
  };
}

export function bmr({ sex, ageYears, weightKg, heightCm, bodyFatPercent = null } = {}) {
  const s = String(sex || '').toLowerCase();
  if (!['male', 'female'].includes(s)) throw Object.assign(new Error('sex must be male or female for this formula'), { status: 422, code: 'BAD_INPUT' });
  const age = num(ageYears, 'ageYears', { min: 15, max: 120, allowZero: false });
  const weight = num(weightKg, 'weightKg', { min: 20, max: 500, allowZero: false });
  const height = num(heightCm, 'heightCm', { min: 100, max: 300, allowZero: false });
  if (bodyFatPercent != null) {
    const fat = num(bodyFatPercent, 'bodyFatPercent', { min: 3, max: 70 });
    const lean = weight * (1 - fat / 100);
    const value = 370 + 21.6 * lean;
    return { ok: true, formula: 'Katch–McArdle', bmr: round2(value), leanBodyMassKg: round2(lean), confidence: 'medium', assumptions: ['Body-fat percentage is accurate.'], source: 'Katch–McArdle equation.', limitations: ['Estimates vary with measurement method and individual physiology.', HEALTH_DISCLAIMER] };
  }
  const value = 10 * weight + 6.25 * height - 5 * age + (s === 'male' ? 5 : -161);
  return {
    ok: true, formula: 'Mifflin–St Jeor', bmr: round2(value),
    calculation: `10 × ${weight} + 6.25 × ${height} − 5 × ${age} ${s === 'male' ? '+ 5' : '− 161'}`,
    confidence: 'medium', source: 'Mifflin–St Jeor equation.',
    assumptions: ['Age, height and weight are accurate.'],
    limitations: ['A BMR estimate is not a measured metabolic rate and is not a prescription for calorie intake.', HEALTH_DISCLAIMER],
  };
}

export function tdee({ bmr: basal = null, sex, ageYears, weightKg, heightCm, bodyFatPercent = null, activityLevel = 'sedentary' } = {}) {
  const ACTIVITY = {
    sedentary: { label: 'sedentary (little or no exercise)', factor: 1.2 },
    light: { label: 'light activity (1–3 days/week)', factor: 1.375 },
    moderate: { label: 'moderate activity (3–5 days/week)', factor: 1.55 },
    very_active: { label: 'very active (6–7 days/week)', factor: 1.725 },
    extra_active: { label: 'extra active (physical job or twice-daily training)', factor: 1.9 },
  };
  const activity = ACTIVITY[activityLevel];
  if (!activity) throw Object.assign(new Error(`activityLevel must be one of ${Object.keys(ACTIVITY).join(', ')}`), { status: 422, code: 'BAD_INPUT' });
  const b = basal != null ? { ok: true, bmr: num(basal, 'bmr', { min: 500, max: 10000, allowZero: false }) } : bmr({ sex, ageYears, weightKg, heightCm, bodyFatPercent });
  const value = b.bmr * activity.factor;
  return {
    ok: true, bmr: b.bmr, activityLevel, activityFactor: activity.factor, tdee: round2(value),
    confidence: 'medium', source: 'Mifflin–St Jeor / Katch–McArdle plus standard activity factors.',
    assumptions: ['The activity multiplier is an estimate, not a measurement.'],
    limitations: ['Use trends in weight and energy over 2–4 weeks with a qualified professional rather than treating this as a prescription.', HEALTH_DISCLAIMER],
  };
}

export function waterTarget({ weightKg, activityMinutes = 0, climate = 'temperate' } = {}) {
  const weight = num(weightKg, 'weightKg', { min: 20, max: 500, allowZero: false });
  const minutes = num(activityMinutes, 'activityMinutes', { min: 0, max: 1440 });
  const hot = ['hot', 'very_hot', 'humid'].includes(String(climate).toLowerCase());
  const baseLow = weight * 30;
  const baseHigh = weight * 35;
  const activityAdd = Math.round(minutes / 20) * 150;
  const climateAdd = hot ? 500 : 0;
  return {
    ok: true,
    totalMl: { low: baseLow + activityAdd + climateAdd, high: baseHigh + activityAdd + climateAdd },
    targetMlLow: baseLow + activityAdd + climateAdd,
    targetMlHigh: baseHigh + activityAdd + climateAdd,
    confidence: 'low', source: 'General hydration guidance (30–35 mL/kg + activity + climate).',
    assumptions: ['Weight is accurate. Climate classification is subjective.'],
    limitations: ['Individual needs vary. Thirst, urine colour and medical conditions override this estimate.', HEALTH_DISCLAIMER],
  };
}

export function macros({ weightKg, heightCm, ageYears, sex, activityLevel = 'sedentary', goal = 'maintain' } = {}) {
  const energy = tdee({ sex, ageYears, weightKg, heightCm, activityLevel });
  const tdeeVal = energy.tdee;
  let targetCalories = tdeeVal;
  if (goal === 'lose') targetCalories = Math.round(tdeeVal * 0.8);
  else if (goal === 'gain') targetCalories = Math.round(tdeeVal * 1.15);
  const proteinG = Math.round(weightKg * 1.8);
  const fatG = Math.round(targetCalories * 0.25 / 9);
  const carbG = Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4);
  return {
    ok: true, tdee: tdeeVal, goal, targetCalories,
    macros: { proteinG, fatG, carbG, proteinPct: round2(proteinG * 4 / targetCalories * 100), fatPct: round2(fatG * 9 / targetCalories * 100), carbPct: round2(carbG * 4 / targetCalories * 100) },
    confidence: 'low', source: 'General macronutrient distribution estimates.',
    assumptions: ['Weight, height, age, sex and activity level are accurate.'],
    limitations: ['This is not a personalised nutrition prescription. Consult a registered dietitian for individual needs.', HEALTH_DISCLAIMER],
  };
}