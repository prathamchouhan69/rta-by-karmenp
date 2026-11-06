import { GROUPS, ISO_CURRENCIES, resolveUnit } from './units.js';

const round = (n, sig = 10) => {
  if (!Number.isFinite(n)) return null;
  if (n === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(n)));
  const factor = 10 ** (sig - magnitude - 1);
  return Math.round(n * factor) / factor;
};

const fail = (code, message, extra = {}) => ({ ok: false, code, message, confidence: 'uncertain', ...extra });

function temperature(value, from, to) {
  let kelvin;
  if (from === 'celsius') kelvin = value + 273.15;
  else if (from === 'fahrenheit') kelvin = (value - 32) * 5 / 9 + 273.15;
  else if (from === 'kelvin') kelvin = value;
  else return null;
  if (to === 'celsius') return kelvin - 273.15;
  if (to === 'fahrenheit') return (kelvin - 273.15) * 9 / 5 + 32;
  if (to === 'kelvin') return kelvin;
  return null;
}

function formulaText(value, fromLabel, factor, toLabel, converted) {
  if (!factor) return `${value} ${fromLabel} = ${converted} ${toLabel}`;
  return `${value} ${fromLabel} × ${factor} = ${round(converted)} ${toLabel}`;
}

export function convert({ value, from, to, rates = null, bighaSqm = null, iuToMg = null, densityKgPerL = null, bagKg = 50, glassMl = 250 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fail('BAD_VALUE', 'Value must be a finite number');

  const fromCurrency = ISO_CURRENCIES.has(String(from).trim().toUpperCase());
  const toCurrency = ISO_CURRENCIES.has(String(to).trim().toUpperCase());
  if (fromCurrency || toCurrency) {
    if (!fromCurrency || !toCurrency) return fail('INCOMPATIBLE_UNITS', 'Currency can be converted only to another currency');
    if (!rates || typeof rates !== 'object') return fail('RATES_REQUIRED', 'Currency conversion needs user-provided or verified live rates', { needsInput: 'rates' });
    const fromRate = Number(rates[String(from).trim().toUpperCase()]);
    const toRate = Number(rates[String(to).trim().toUpperCase()]);
    if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate <= 0 || toRate <= 0) {
      return fail('RATES_REQUIRED', `Rates must include positive values for ${String(from).toUpperCase()} and ${String(to).toUpperCase()}`, { needsInput: 'rates' });
    }
    const out = n * toRate / fromRate;
    return { ok: true, category: 'currency', input: { value: n, unit: String(from).toUpperCase() }, output: { value: round(out), unit: String(to).toUpperCase() },
      formula: `${n} × ${toRate} ÷ ${fromRate}`, confidence: 'uncertain', assumptions: ['The supplied rates are current and from a verifiable source.'],
      source: 'User-provided rates; not a live market quote.', limitations: ['Currency rates change continuously. Verify before making a payment or commitment.'] };
  }

  const source = resolveUnit(from);
  const target = resolveUnit(to);
  if (!source) return fail('UNKNOWN_UNIT', `I do not recognise the unit "${from}"`);
  if (!target) return fail('UNKNOWN_UNIT', `I do not recognise the unit "${to}"`);

  if (source.special === 'cement_bag' || target.special === 'cement_bag') {
    if (!Number.isFinite(Number(bagKg)) || Number(bagKg) <= 0) return fail('BAG_SIZE_REQUIRED', 'Cement bag size is required', { needsInput: 'bagKg' });
    const kg = n * Number(bagKg);
    if (source.special === 'cement_bag' && target.group === 'mass') {
      const f = GROUPS.mass.units[target.unit].factor;
      return { ok: true, category: 'construction', input: { value: n, unit: 'bag' }, output: { value: round(kg / f), unit: target.unit },
        formula: `${n} bag × ${bagKg} kg/bag ÷ ${f} kg/${target.unit}`, confidence: 'medium', assumptions: [`One cement bag is assumed to be ${bagKg} kg.`],
        source: 'Bag mass is a market convention, not a scientific constant.', limitations: ['Confirm the bag mass printed on the supplier invoice.'] };
    }
    if (target.special === 'cement_bag' && source.group === 'mass') {
      const f = GROUPS.mass.units[source.unit].factor;
      return { ok: true, category: 'construction', input: { value: n, unit: from }, output: { value: round(n * f / Number(bagKg)), unit: 'bag' },
        formula: `${n} ${from} × ${f} kg/${from} ÷ ${bagKg} kg/bag`, confidence: 'medium', assumptions: [`One cement bag is assumed to be ${bagKg} kg.`],
        source: 'Bag mass is a market convention, not a scientific constant.', limitations: ['Confirm the bag mass printed on the supplier invoice.'] };
    }
    return fail('UNSUPPORTED_BAG_CONVERSION', 'A cement bag can be converted only to or from mass.');
  }

  if (source.group === 'medical' || target.group === 'medical') {
    if (source.group === 'medical' && target.group === 'medical') {
      if (source.unit === 'iu' || target.unit === 'iu') {
        if (!iuToMg || !Number.isFinite(Number(iuToMg))) return fail('IU_FACTOR_REQUIRED', 'IU cannot be converted without a substance-specific factor', { needsInput: 'iuToMg' });
        const mg = source.unit === 'iu' ? n * Number(iuToMg) : n;
        const out = target.unit === 'iu' ? mg / Number(iuToMg) : (target.unit === 'mcg' ? mg * 1000 : mg);
        return { ok: true, category: 'medical', input: { value: n, unit: from }, output: { value: round(out), unit: to }, formula: `Using ${iuToMg} mg per IU`, confidence: 'medium', assumptions: ['The supplied substance-specific factor is correct.'], source: 'User-supplied conversion factor.', limitations: ['Never reuse an IU factor for a different substance.'] };
      }
      const f = GROUPS.medical.units[source.unit].factor;
      const t = GROUPS.medical.units[target.unit].factor;
      if (f == null || t == null) return fail('MEDICAL_FACTOR_REQUIRED', 'This medical conversion needs a reference factor', { needsInput: 'specific factor' });
      return { ok: true, category: 'medical', input: { value: n, unit: from }, output: { value: round(n * f / t), unit: to }, formula: `${n} ${from} × ${f} ÷ ${t}`, confidence: 'high', assumptions: [], source: GROUPS.medical.source, limitations: ['Mass conversions do not establish a safe dose. Ask a qualified clinician or pharmacist.'] };
    }
    if ((source.unit === 'ml' || target.unit === 'ml') && densityKgPerL != null) {
      const density = Number(densityKgPerL);
      if (!Number.isFinite(density) || density <= 0) return fail('BAD_DENSITY', 'Density must be a positive number');
      if (source.unit === 'ml') {
        const grams = n * density;
        return { ok: true, category: 'medical', input: { value: n, unit: 'ml' }, output: { value: round(grams / GROUPS.medical.units[target.unit].factor), unit: target.unit }, formula: `${n} ml × ${density} kg/L = ${round(grams)} g`, confidence: 'medium', assumptions: ['The supplied density applies to this liquid.'], source: 'User-supplied density.', limitations: ['Do not use for medicines unless the label states the density or strength.'] };
      }
    }
    return fail('MEDICAL_CONTEXT_REQUIRED', 'This medical conversion needs a substance-specific factor or density', { needsInput: 'substance-specific factor or density' });
  }

  if (source.group === 'fuel_efficiency' || target.group === 'fuel_efficiency') {
    if (source.group !== 'fuel_efficiency' || target.group !== 'fuel_efficiency') return fail('MIXED_FUEL_UNITS', 'Fuel volume cannot be converted directly to fuel efficiency. Supply distance as well.');
    if (source.unit === 'l_per_100km' || target.unit === 'l_per_100km') {
      if (n === 0 && source.unit === 'l_per_100km') return fail('ZERO_CONSUMPTION', 'Zero litres per 100 km has no finite efficiency');
      const kmpl = source.unit === 'l_per_100km' ? 100 / n : n * GROUPS.fuel_efficiency.units[source.unit].factor;
      const out = target.unit === 'l_per_100km' ? 100 / kmpl : kmpl / GROUPS.fuel_efficiency.units[target.unit].factor;
      return { ok: true, category: 'fuel_efficiency', input: { value: n, unit: from }, output: { value: round(out), unit: to }, formula: 'Fuel efficiency is the inverse of fuel consumption.', confidence: 'high', assumptions: [], source: GROUPS.fuel_efficiency.source, limitations: [] };
    }
    const f = GROUPS.fuel_efficiency.units[source.unit].factor;
    const t = GROUPS.fuel_efficiency.units[target.unit].factor;
    return { ok: true, category: 'fuel_efficiency', input: { value: n, unit: from }, output: { value: round(n * f / t), unit: to }, formula: `${n} ${from} × ${f} ÷ ${t}`, confidence: 'high', assumptions: [], source: GROUPS.fuel_efficiency.source, limitations: [] };
  }

  if (source.group !== target.group) return fail('INCOMPATIBLE_UNITS', `${from} and ${to} are different kinds of measurement`);

  const group = GROUPS[source.group];
  const fromDef = group.units[source.unit];
  const toDef = group.units[target.unit];
  if (source.group === 'temperature') {
    return { ok: true, category: 'temperature', input: { value: n, unit: from }, output: { value: round(temperature(n, source.unit, target.unit)), unit: to }, formula: `${n} ${fromDef.label} converted to ${toDef.label}`, confidence: 'high', assumptions: [], source: group.source, limitations: [] };
  }
  if (source.unit === 'bigha' || target.unit === 'bigha') {
    if (!Number.isFinite(Number(bighaSqm)) || Number(bighaSqm) <= 0) return fail('BIGHA_DEFINITION_REQUIRED', 'Bigha varies by district. Supply bighaSqm from a verified local source.', { needsInput: 'bighaSqm' });
    const bighaFactor = Number(bighaSqm);
    const fromFactor = source.unit === 'bigha' ? bighaFactor : fromDef.factor;
    const toFactor = target.unit === 'bigha' ? bighaFactor : toDef.factor;
    return { ok: true, category: 'area', input: { value: n, unit: from }, output: { value: round(n * fromFactor / toFactor), unit: to }, formula: `${n} × ${fromFactor} ÷ ${toFactor}`, confidence: 'medium', assumptions: [`One bigha is taken as ${bighaFactor} square metres, as supplied.`], source: 'Bigha definition supplied by the user; verify locally.', limitations: ['Bigha is not standardised across India.'] };
  }
  if (fromDef.factor == null || toDef.factor == null) return fail('FACTOR_REQUIRED', `A verified conversion factor is required for ${from} or ${to}`, { needsInput: 'conversion factor' });

  const out = n * fromDef.factor / toDef.factor;
  const assumptions = [];
  if (source.unit === 'glass' || target.unit === 'glass') assumptions.push(`A glass is assumed to be ${glassMl || 250} ml.`);
  if (source.group === 'energy' && (source.unit === 'calorie' || target.unit === 'calorie')) assumptions.push('A lower-case calorie is 4.184 J. Food labels usually mean kilocalories (kcal), so 1 food Calorie = 1 kcal.');
  return {
    ok: true, category: source.group, input: { value: n, unit: from }, output: { value: round(out), unit: to },
    formula: formulaText(n, fromDef.label, fromDef.factor / toDef.factor, toDef.label, out),
    confidence: assumptions.length ? 'medium' : 'high', assumptions, source: group.source,
    limitations: source.group === 'medical' ? ['This is a unit conversion, not medical advice.'] : [],
  };
}

const NUMBER = String.raw`-?\d+(?:,\d{3})*(?:\.\d+)?`;

export function parseConversion(text, options = {}) {
  const raw = String(text ?? '').trim();
  if (!raw) return fail('EMPTY', 'Enter a conversion such as "Convert 20 MT into kg"');
  const clean = raw.replace(/,/g, '').replace(/[–—]/g, '-');
  const lower = clean.toLowerCase();

  const bp = lower.match(new RegExp(`(${NUMBER})\\s*/\\s*(${NUMBER})\\s*([a-z%µ°]+)?\\s*(?:to|into|in|as)\\s*([a-z%µ° ]+)$`, 'i'));
  if (bp) {
    const from = bp[3] || 'mmhg', to = bp[4].trim();
    const one = convert({ value: bp[1], from, to, ...options });
    const two = convert({ value: bp[2], from, to, ...options });
    if (!one.ok) return one;
    if (!two.ok) return two;
    return { ok: true, category: one.category, input: { value: `${bp[1]}/${bp[2]}`, unit: from }, output: { value: `${one.output.value}/${two.output.value}`, unit: to }, formula: 'Both systolic and diastolic values are converted with the same factor.', confidence: one.confidence, assumptions: one.assumptions, source: one.source, limitations: ['Blood pressure is not diagnosed from a single reading. Ask a qualified clinician.'] };
  }

  const compound = lower.match(new RegExp(`(${NUMBER})\\s*(?:feet|foot|ft)\\s*(${NUMBER})\\s*(?:inches|inch|in|")\\s*(?:to|into|in|as)\\s*([a-z%µ° ]+)$`, 'i'));
  if (compound) {
    const feet = Number(compound[1]), inches = Number(compound[2]);
    const meters = feet * 0.3048 + inches * 0.0254;
    const target = resolveUnit(compound[3]);
    if (!target || target.group !== 'length') return fail('UNKNOWN_UNIT', `I do not recognise the target unit "${compound[3]}"`);
    const out = convert({ value: meters, from: 'm', to: compound[3], ...options });
    if (!out.ok) return out;
    return { ...out, input: { value: `${feet} ft ${inches} in`, unit: 'ft+in' }, formula: `${feet} × 0.3048 + ${inches} × 0.0254 = ${round(meters)} m`, assumptions: ['Feet and inches are international feet and inches.'] };
  }

  const m = lower.match(new RegExp(`(?:convert\\s+)?(${NUMBER})\\s*([a-z%µ°"']+)?.{0,80}?\\s(?:to|into|in|as)\\s+([a-z%µ° ]+)$`, 'i'));
  if (!m) return fail('PARSE_FAILED', 'I could not find a value, source unit and target unit. Example: "Convert 20 MT into kg".');
  const result = convert({ value: Number(m[1]), from: m[2] || '', to: m[3].trim(), ...options });
  return result.ok ? { ...result, originalText: raw } : result;
}
