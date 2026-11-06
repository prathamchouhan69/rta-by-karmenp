import { newId } from '../util/ids.js';

// General health information only. This module never diagnoses, prescribes or
// replaces emergency care. Every response carries a non-medical-advice notice.

export const HEALTH_DISCLAIMER = 'This is general health information, not medical advice.';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v, name, { min = -Infinity, max = Infinity, allowZero = true } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw Object.assign(new Error(`${name} must be a number`), { status: 422, code: 'BAD_INPUT' });
  if (!allowZero && n === 0) throw Object.assign(new Error(`${name} must not be zero`), { status: 422, code: 'BAD_INPUT' });
  if (n < min || n > max) throw Object.assign(new Error(`${name} is out of range`), { status: 422, code: 'BAD_INPUT' });
  return n;
};

const ACTIVITY = {
  sedentary: { label: 'sedentary (little or no exercise)', factor: 1.2 },
  light: { label: 'light activity (1–3 days/week)', factor: 1.375 },
  moderate: { label: 'moderate activity (3–5 days/week)', factor: 1.55 },
  very_active: { label: 'very active (6–7 days/week)', factor: 1.725 },
  extra_active: { label: 'extra active (physical job or twice-daily training)', factor: 1.9 },
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
  const activityExtra = Math.ceil(minutes / 30) * 350;
  const climateExtra = hot ? 500 : 0;
  return {
    ok: true, baselineMl: { low: Math.round(baseLow), high: Math.round(baseHigh) }, activityExtraMl: activityExtra, climateExtraMl: climateExtra,
    totalMl: { low: Math.round(baseLow + activityExtra + climateExtra), high: Math.round(baseHigh + activityExtra + climateExtra) },
    glasses250Ml: { low: Math.ceil((baseLow + activityExtra + climateExtra) / 250), high: Math.ceil((baseHigh + activityExtra + climateExtra) / 250) },
    confidence: 'medium', assumptions: ['General adult hydration estimate. Food and other drinks also contribute water.'],
    source: 'Common 30–35 ml/kg adult hydration guidance plus activity and heat allowances.',
    limitations: ['Needs differ with kidney, heart, pregnancy, medication and medical conditions. Ask a qualified clinician if you have fluid restrictions.', HEALTH_DISCLAIMER],
  };
}

export function macros({ calories, proteinPercent, carbsPercent, fatPercent } = {}) {
  const kcal = num(calories, 'calories', { min: 500, max: 10000, allowZero: false });
  const p = num(proteinPercent, 'proteinPercent', { min: 0, max: 100 });
  const c = num(carbsPercent, 'carbsPercent', { min: 0, max: 100 });
  const f = num(fatPercent, 'fatPercent', { min: 0, max: 100 });
  if (Math.abs(p + c + f - 100) > 0.5) throw Object.assign(new Error('proteinPercent + carbsPercent + fatPercent must equal 100'), { status: 422, code: 'BAD_INPUT' });
  return {
    ok: true, calories: round2(kcal), protein: { grams: round2(kcal * p / 100 / 4), percent: p, kcalPerGram: 4 }, carbs: { grams: round2(kcal * c / 100 / 4), percent: c, kcalPerGram: 4 }, fat: { grams: round2(kcal * f / 100 / 9), percent: f, kcalPerGram: 9 },
    confidence: 'high', assumptions: ['Protein and carbohydrate provide 4 kcal/g; fat provides 9 kcal/g.'],
    source: 'Atwater energy factors.', limitations: ['Macro targets are general planning figures, not medical or sports nutrition prescriptions.', HEALTH_DISCLAIMER],
  };
}

export function vitalsCheck({ systolic = null, diastolic = null, heartRate = null, spo2Percent = null, fastingGlucoseMgDl = null, temperatureC = null, sleepHours = null, hydrationMl = null, weightKg = null, activityMinutes = 0, climate = 'temperate' } = {}) {
  const flags = [];
  const add = (metric, value, unit, status, note) => flags.push({ metric, value, unit, status, note });
  if (systolic != null || diastolic != null) {
    const s = num(systolic, 'systolic', { min: 40, max: 300 }); const d = num(diastolic, 'diastolic', { min: 20, max: 200 });
    const status = s >= 180 || d >= 120 ? 'emergency range' : s >= 140 || d >= 90 ? 'high range' : s >= 130 || d >= 80 ? 'elevated range' : s < 90 || d < 60 ? 'low range' : 'commonly quoted normal range';
    add('blood pressure', `${s}/${d}`, 'mmHg', status, status === 'emergency range' ? 'Seek urgent medical care now.' : 'A single reading is not a diagnosis. Recheck and consult a qualified clinician.');
  }
  if (heartRate != null) { const v = num(heartRate, 'heartRate', { min: 20, max: 300 }); add('resting heart rate', v, 'bpm', v < 50 || v > 100 ? 'outside commonly quoted resting range' : 'commonly quoted resting range', 'Athletes and some medical conditions change this range.'); }
  if (spo2Percent != null) { const v = num(spo2Percent, 'spo2Percent', { min: 50, max: 100 }); add('SpO2', v, '%', v < 90 ? 'emergency range' : v < 95 ? 'below commonly quoted range' : 'commonly quoted normal range', v < 90 ? 'Seek emergency medical help.' : 'Measure with a properly fitted device and confirm with a clinician if unwell.'); }
  if (fastingGlucoseMgDl != null) { const v = num(fastingGlucoseMgDl, 'fastingGlucoseMgDl', { min: 20, max: 800 }); add('fasting glucose', v, 'mg/dL', v < 70 ? 'low range' : v < 100 ? 'commonly quoted normal range' : v < 126 ? 'elevated range' : 'high range', 'Diabetes is diagnosed only by a qualified clinician using confirmatory tests.'); }
  if (temperatureC != null) { const v = num(temperatureC, 'temperatureC', { min: 30, max: 45 }); add('temperature', v, '°C', v >= 39.5 ? 'high fever range' : v >= 38 ? 'fever range' : v < 35 ? 'low range' : 'commonly quoted normal range', v >= 39.5 || v < 35 ? 'Seek medical advice promptly.' : 'Use a reliable thermometer and consider context.'); }
  if (sleepHours != null) { const v = num(sleepHours, 'sleepHours', { min: 0, max: 24 }); add('sleep', v, 'hours', v < 6 ? 'short sleep' : v > 10 ? 'long sleep' : 'commonly quoted adult range', 'Sleep needs vary; persistent problems deserve clinical advice.'); }
  if (hydrationMl != null && weightKg != null) { const water = waterTarget({ weightKg, activityMinutes, climate }); const v = num(hydrationMl, 'hydrationMl', { min: 0, max: 20000 }); add('hydration', v, 'ml', v < water.totalMl.low ? 'below general target' : 'within general target', `General estimate: ${water.totalMl.low}–${water.totalMl.high} ml.`); }
  const emergency = flags.some((f) => f.status === 'emergency range');
  return {
    ok: true, flags, emergency,
    summary: emergency ? 'One or more readings are in an emergency range. Contact emergency services or a qualified doctor now.' : flags.length ? 'Readings are summarised against commonly quoted adult ranges. This is not a diagnosis.' : 'No readings supplied.',
    confidence: 'low', source: 'Commonly quoted adult reference ranges; not a clinical guideline for an individual.',
    limitations: ['Reference ranges vary by laboratory, age, pregnancy, medication and medical history.', 'Do not start, stop or change medicine based on this output.', HEALTH_DISCLAIMER],
  };
}

const EMERGENCY_PATTERNS = [
  /chest pain|pressure in (the )?chest|heart attack/i,
  /cannot breathe|can't breathe|difficulty breathing|shortness of breath|breathless/i,
  /face droop|arm weakness|slurred speech|sudden weakness|stroke/i,
  /severe bleeding|bleeding heavily|blood loss|uncontrolled bleeding/i,
  /unconscious|unresponsive|fainted|seizure|convulsion/i,
  /suicid|kill myself|end my life|self harm/i,
  /overdose|poisoning|anaphylaxis|severe allergic reaction/i,
  /saans nahi|sans nahi|behosh|bahut khoon|seene mein dard/i,
];

export function emergencyCheck(text) {
  const value = String(text || '');
  const matched = EMERGENCY_PATTERNS.filter((re) => re.test(value));
  return {
    ok: true, emergency: matched.length > 0,
    message: matched.length ? 'This may be an emergency. Contact local emergency services or a qualified doctor immediately. Do not wait for an AI response.' : 'No emergency phrase was detected. This does not rule out an emergency.',
    confidence: matched.length ? 'high' : 'low',
    limitations: ['A keyword check cannot assess your actual condition.', HEALTH_DISCLAIMER],
  };
}

const VITAL_TYPES = new Set(['blood_pressure', 'heart_rate', 'spo2', 'blood_sugar', 'weight', 'temperature', 'sleep', 'hydration', 'steps', 'exercise']);

export class HealthStore {
  constructor({ store, audit, now = () => new Date() }) {
    this.profiles = store.collection('health_profiles');
    this.vitals = store.collection('health_vitals');
    this.audit = audit; this.now = now;
  }

  saveProfile(userId, input, actor = { id: userId }) {
    if (input?.consent !== true) throw Object.assign(new Error('Explicit consent is required before storing health data.'), { status: 422, code: 'CONSENT_REQUIRED' });
    const profile = {
      userId,
      ageYears: input.ageYears == null ? null : num(input.ageYears, 'ageYears', { min: 1, max: 120 }),
      sex: input.sex || null, heightCm: input.heightCm == null ? null : num(input.heightCm, 'heightCm', { min: 30, max: 300 }),
      weightKg: input.weightKg == null ? null : num(input.weightKg, 'weightKg', { min: 1, max: 500 }),
      activityLevel: input.activityLevel || 'sedentary', dietaryPreference: input.dietaryPreference || null,
      goals: Array.isArray(input.goals) ? input.goals.map((g) => String(g).slice(0, 120)).slice(0, 20) : [],
      allergies: Array.isArray(input.allergies) ? input.allergies.map((g) => String(g).slice(0, 120)).slice(0, 30) : [],
      conditions: Array.isArray(input.conditions) ? input.conditions.map((g) => String(g).slice(0, 160)).slice(0, 30) : [],
      medicines: Array.isArray(input.medicines) ? input.medicines.map((g) => String(g).slice(0, 160)).slice(0, 50) : [],
      language: input.language === 'hi' ? 'hi' : 'en',
      consent: true, consentAt: this.now().toISOString(), updatedAt: this.now().toISOString(),
      disclaimer: HEALTH_DISCLAIMER,
    };
    this.profiles.put(userId, profile);
    this.audit.append({ actor: actor.id, action: 'health.profile_saved', data: { userId } });
    return { ok: true, profile };
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

  listVitals(userId, { type = null, limit = 50 } = {}) {
    return this.vitals.all().filter((v) => v.userId === userId && (!type || v.type === type)).sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)).slice(0, Math.max(1, Math.min(Number(limit) || 50, 200)));
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

export function lifestylePlan({ weightKg, heightCm, ageYears, sex, activityLevel = 'light', goal = 'general_fitness', dietaryPreference = 'vegetarian' } = {}) {
  const energy = tdee({ sex, ageYears, weightKg, heightCm, activityLevel });
  const vegetarian = String(dietaryPreference).toLowerCase().includes('veg') && !String(dietaryPreference).toLowerCase().includes('non');
  const plan = {
    goal, energyEstimate: energy.tdee, activityLevel,
    movement: [
      'Build a consistent weekly routine: 150 minutes of moderate movement plus 2 strength sessions is a common adult baseline.',
      activityLevel === 'sedentary' ? 'Start with a 10-minute walk after one meal and add 5 minutes each week.' : 'Keep at least one recovery day and monitor sleep and soreness.',
      'Site workers: use micro-breaks, shade and hydration; avoid strenuous work in peak heat.',
    ],
    nutrition: [
      'Build each main meal around a protein source, vegetables, and a measured staple portion.',
      vegetarian ? 'Indian vegetarian protein ideas: dal, rajma, chana, paneer, curd, soy, peanuts and seeds.' : 'Indian protein ideas: dal, eggs, chicken, fish, paneer, curd, soy and pulses.',
      'Use home-cooked meals as the default; watch sugary drinks, deep-fried snacks and large restaurant portions.',
      'Drink water through the day; use the hydration estimate as a general starting point, not a fixed rule.',
    ],
    recovery: ['Aim for a consistent sleep window.', 'Track energy and mood weekly, not just weight.', 'Do not use exercise to compensate for unsafe calorie restriction.'],
    confidence: 'low', assumptions: ['General lifestyle guidance based on the supplied profile.'], source: 'General public-health lifestyle guidance.',
    limitations: ['This plan is not personalised medical or dietetic advice.', 'Stop and seek professional advice if exercise causes chest pain, dizziness or unusual breathlessness.', HEALTH_DISCLAIMER],
  };
  return { ok: true, ...plan };
}

export function workforceHeatGuidance({ temperatureC, humidityPercent = null, workIntensity = 'moderate' } = {}) {
  const temp = num(temperatureC, 'temperatureC', { min: -20, max: 60 });
  const humidity = humidityPercent == null ? null : num(humidityPercent, 'humidityPercent', { min: 0, max: 100 });
  const level = temp >= 40 ? 'extreme' : temp >= 35 ? 'high' : temp >= 30 ? 'elevated' : 'normal';
  return {
    ok: true, temperatureC: temp, humidityPercent: humidity, workIntensity, heatLevel: level,
    guidance: level === 'extreme' ? ['Reschedule heavy outdoor work if possible.', 'Provide shaded rest, cool water and close supervision.', 'Have an emergency plan and do not work alone.'] : level === 'high' ? ['Increase shade and rest breaks.', 'Provide water at the work area, not only at the office.', 'Watch new workers and anyone in heavy PPE.'] : level === 'elevated' ? ['Encourage frequent water breaks.', 'Provide shade and monitor fatigue.'] : ['Maintain normal water access and shade.'],
    confidence: 'low', source: 'General heat-safety awareness, not a WBGT or occupational-health measurement.',
    limitations: ['Humidity, radiant heat, clothing, workload and individual health change the real risk. Use a qualified safety professional and local regulations.', HEALTH_DISCLAIMER],
  };
}
