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

export const VITAL_TYPES = new Set([
  'weight', 'blood_pressure', 'heart_rate', 'spo2', 'blood_sugar',
  'temperature', 'sleep', 'hydration', 'steps', 'body_fat', 'mood', 'energy'
]);

export function vitalsCheck(input) {
  const checks = [];
  if (input.systolic != null && input.diastolic != null) {
    const sys = num(input.systolic, 'systolic', { min: 40, max: 300 });
    const dia = num(input.diastolic, 'diastolic', { min: 20, max: 200 });
    let bpCategory = 'normal';
    if (sys >= 180 || dia >= 120) bpCategory = 'hypertensive crisis';
    else if (sys >= 140 || dia >= 90) bpCategory = 'hypertension stage 2';
    else if (sys >= 130 || dia >= 80) bpCategory = 'hypertension stage 1';
    else if (sys >= 120 && dia < 80) bpCategory = 'elevated';
    checks.push({ vital: 'blood_pressure', value: `${sys}/${dia}`, category: bpCategory, confidence: 'medium' });
  }
  if (input.heartRate != null) {
    const hr = num(input.heartRate, 'heartRate', { min: 20, max: 300 });
    let hrCategory = 'normal';
    if (hr < 50 || hr > 120) hrCategory = 'outside normal range';
    checks.push({ vital: 'heart_rate', value: hr, unit: 'bpm', category: hrCategory, confidence: 'medium' });
  }
  if (input.spo2Percent != null) {
    const spo2 = num(input.spo2Percent, 'spo2Percent', { min: 50, max: 100 });
    let spo2Category = 'normal';
    if (spo2 < 95) spo2Category = 'below normal';
    checks.push({ vital: 'spo2', value: spo2, unit: '%', category: spo2Category, confidence: 'high' });
  }
  if (input.fastingGlucoseMgDl != null) {
    const glu = num(input.fastingGlucoseMgDl, 'fastingGlucoseMgDl', { min: 30, max: 600 });
    let gluCategory = 'normal';
    if (glu >= 126) gluCategory = 'diabetic range';
    else if (glu >= 100) gluCategory = 'pre-diabetic range';
    checks.push({ vital: 'blood_sugar', value: glu, unit: 'mg/dL', category: gluCategory, confidence: 'medium' });
  }
  if (input.temperatureC != null) {
    const temp = num(input.temperatureC, 'temperatureC', { min: 30, max: 45 });
    let tempCategory = 'normal';
    if (temp >= 38) tempCategory = 'fever';
    else if (temp < 35) tempCategory = 'hypothermia risk';
    checks.push({ vital: 'temperature', value: temp, unit: '°C', category: tempCategory, confidence: 'high' });
  }
  if (input.sleepHours != null) {
    const slp = num(input.sleepHours, 'sleepHours', { min: 0, max: 24 });
    let slpCategory = 'adequate';
    if (slp < 6) slpCategory = 'insufficient';
    else if (slp > 9) slpCategory = 'long';
    checks.push({ vital: 'sleep', value: slp, unit: 'hours', category: slpCategory, confidence: 'low' });
  }
  if (input.hydrationMl != null && input.weightKg != null) {
    const h = num(input.hydrationMl, 'hydrationMl', { min: 0, max: 10000 });
    const w = num(input.weightKg, 'weightKg', { min: 20, max: 500, allowZero: false });
    const target = w * 35;
    const pct = Math.round((h / target) * 100);
    let hydCategory = 'adequate';
    if (pct < 60) hydCategory = 'below target';
    checks.push({ vital: 'hydration', value: h, unit: 'mL', targetMl: target, percentage: pct, category: hydCategory, confidence: 'low' });
  }
  if (input.steps != null) {
    const s = num(input.steps, 'steps', { min: 0, max: 100000 });
    let stepCategory = 'low';
    if (s >= 10000) stepCategory = 'active';
    else if (s >= 7500) stepCategory = 'moderate';
    else if (s >= 5000) stepCategory = 'light';
    checks.push({ vital: 'steps', value: s, unit: 'steps', category: stepCategory, confidence: 'low' });
  }
  return { ok: true, checks, disclaimer: HEALTH_DISCLAIMER, limitations: ['These checks are general awareness prompts, not clinical thresholds.'] };
}

export function emergencyCheck(text) {
  const t = String(text || '').toLowerCase();
  const critical = ['chest pain', 'heart attack', 'stroke', 'cannot breathe', 'difficulty breathing', 'unconscious', 'severe bleeding', 'choking', 'severe allergic reaction', 'anaphylaxis', 'suicide', 'self-harm'];
  const emergency = critical.some(kw => t.includes(kw));
  return { ok: true, emergency, disclaimer: emergency ? 'This may be a medical emergency. Call emergency services (112 in India) immediately.' : HEALTH_DISCLAIMER };
}