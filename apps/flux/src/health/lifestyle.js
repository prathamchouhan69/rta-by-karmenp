import { newId } from '../util/ids.js';
import { tdee } from './calculations.js';

export const HEALTH_DISCLAIMER = 'This is general health information, not medical advice.';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v, name, { min = -Infinity, max = Infinity, allowZero = true } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw Object.assign(new Error(`${name} must be a number`), { status: 422, code: 'BAD_INPUT' });
  if (!allowZero && n === 0) throw Object.assign(new Error(`${name} must not be zero`), { status: 422, code: 'BAD_INPUT' });
  if (n < min || n > max) throw Object.assign(new Error(`${name} is out of range`), { status: 422, code: 'BAD_INPUT' });
  return n;
};

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
    assumptions: ['Temperature reading is accurate. Humidity and work intensity are estimates.'],
    limitations: ['This is not a Wet Bulb Globe Temperature (WBGT) assessment. For regulatory compliance, use calibrated instruments and occupational health professionals.', HEALTH_DISCLAIMER],
  };
}