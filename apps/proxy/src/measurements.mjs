const UNITS = [
  { id: 'mm', name: 'millimetres', category: 'length', factor: 0.001, aliases: ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'] },
  { id: 'cm', name: 'centimetres', category: 'length', factor: 0.01, aliases: ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'] },
  { id: 'm', name: 'metres', category: 'length', factor: 1, aliases: ['m', 'meter', 'meters', 'metre', 'metres'] },
  { id: 'km', name: 'kilometres', category: 'length', factor: 1000, aliases: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'] },
  { id: 'in', name: 'inches', category: 'length', factor: 0.0254, aliases: ['in', 'inch', 'inches'] },
  { id: 'ft', name: 'feet', category: 'length', factor: 0.3048, aliases: ['ft', 'foot', 'feet'] },
  { id: 'yd', name: 'yards', category: 'length', factor: 0.9144, aliases: ['yd', 'yard', 'yards'] },
  { id: 'mi', name: 'miles', category: 'length', factor: 1609.344, aliases: ['mi', 'mile', 'miles'] },
  { id: 'mg', name: 'milligrams', category: 'mass', factor: 0.000001, aliases: ['mg', 'milligram', 'milligrams'] },
  { id: 'mcg', name: 'micrograms', category: 'mass', factor: 0.000000001, aliases: ['mcg', 'microgram', 'micrograms', 'ug'] },
  { id: 'g', name: 'grams', category: 'mass', factor: 0.001, aliases: ['g', 'gram', 'grams'] },
  { id: 'kg', name: 'kilograms', category: 'mass', factor: 1, aliases: ['kg', 'kilogram', 'kilograms'] },
  { id: 'mt', name: 'metric tonnes', category: 'mass', factor: 1000, aliases: ['mt', 'tonne', 'tonnes', 'metric ton', 'metric tons', 'metric tonne', 'metric tonnes'] },
  { id: 'oz', name: 'ounces', category: 'mass', factor: 0.028349523125, aliases: ['oz', 'ounce', 'ounces'] },
  { id: 'lb', name: 'pounds', category: 'mass', factor: 0.45359237, aliases: ['lb', 'lbs', 'pound', 'pounds'] },
  { id: 'st', name: 'stone', category: 'mass', factor: 6.35029318, aliases: ['st', 'stone', 'stones'] },
  { id: 'ml', name: 'millilitres', category: 'volume', factor: 0.001, aliases: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'] },
  { id: 'l', name: 'litres', category: 'volume', factor: 1, aliases: ['l', 'liter', 'liters', 'litre', 'litres'] },
  { id: 'm3', name: 'cubic metres', category: 'volume', factor: 1000, aliases: ['m3', 'cubic meter', 'cubic meters', 'cubic metre', 'cubic metres'] },
  { id: 'gal_us', name: 'US gallons', category: 'volume', factor: 3.785411784, aliases: ['us gal', 'us gallon', 'us gallons', 'gal', 'gallon', 'gallons'] },
  { id: 'qt_us', name: 'US quarts', category: 'volume', factor: 0.946352946, aliases: ['us qt', 'us quart', 'us quarts', 'qt', 'quart', 'quarts'] },
  { id: 'pt_us', name: 'US pints', category: 'volume', factor: 0.473176473, aliases: ['us pt', 'us pint', 'us pints', 'pt', 'pint', 'pints'] },
  { id: 'cup_us', name: 'US cups', category: 'volume', factor: 0.2365882365, aliases: ['us cup', 'us cups', 'cup', 'cups'] },
  { id: 'tbsp_us', name: 'US tablespoons', category: 'volume', factor: 0.01478676478125, aliases: ['us tbsp', 'tablespoon', 'tablespoons', 'tbsp'] },
  { id: 'tsp_us', name: 'US teaspoons', category: 'volume', factor: 0.00492892159375, aliases: ['us tsp', 'teaspoon', 'teaspoons', 'tsp'] },
  { id: 'sqft', name: 'square feet', category: 'area', factor: 0.09290304, aliases: ['sq ft', 'sqft', 'square foot', 'square feet', 'ft2'] },
  { id: 'sqm', name: 'square metres', category: 'area', factor: 1, aliases: ['sq m', 'sqm', 'square meter', 'square meters', 'square metre', 'square metres', 'm2'] },
  { id: 'sqyd', name: 'square yards', category: 'area', factor: 0.83612736, aliases: ['sq yd', 'sqyd', 'square yard', 'square yards', 'yd2'] },
  { id: 'acre', name: 'acres', category: 'area', factor: 4046.8564224, aliases: ['acre', 'acres'] },
  { id: 'ha', name: 'hectares', category: 'area', factor: 10000, aliases: ['ha', 'hectare', 'hectares'] },
  { id: 'c', name: 'degrees Celsius', category: 'temperature', aliases: ['c', '°c', 'deg c', 'degree c', 'degrees c', 'celsius'] },
  { id: 'f', name: 'degrees Fahrenheit', category: 'temperature', aliases: ['f', '°f', 'deg f', 'degree f', 'degrees f', 'fahrenheit'] },
  { id: 'k', name: 'kelvin', category: 'temperature', aliases: ['k', 'kelvin', 'kelvins'] },
  { id: 'psi', name: 'pounds per square inch', category: 'pressure', factor: 6894.757293168, aliases: ['psi'] },
  { id: 'bar', name: 'bar', category: 'pressure', factor: 100000, aliases: ['bar', 'bars'] },
  { id: 'kpa', name: 'kilopascals', category: 'pressure', factor: 1000, aliases: ['kpa', 'kilopascal', 'kilopascals'] },
  { id: 'mpa', name: 'megapascals', category: 'pressure', factor: 1000000, aliases: ['mpa', 'megapascal', 'megapascals'] },
  { id: 'mmhg', name: 'millimetres of mercury', category: 'pressure', factor: 133.322387415, aliases: ['mmhg', 'mm hg'] },
  { id: 'cal', name: 'small calories', category: 'energy', factor: 4.184, aliases: ['cal', 'small calorie', 'small calories'] },
  { id: 'kcal', name: 'kilocalories (food Calories)', category: 'energy', factor: 4184, aliases: ['kcal', 'kilocalorie', 'kilocalories', 'calorie', 'calories', 'food calorie', 'food calories'] },
  { id: 'j', name: 'joules', category: 'energy', factor: 1, aliases: ['j', 'joule', 'joules'] },
  { id: 'kj', name: 'kilojoules', category: 'energy', factor: 1000, aliases: ['kj', 'kilojoule', 'kilojoules'] },
  { id: 'ms', name: 'metres per second', category: 'speed', factor: 1, aliases: ['m/s', 'meter per second', 'meters per second', 'metre per second', 'metres per second'] },
  { id: 'kmh', name: 'kilometres per hour', category: 'speed', factor: 1 / 3.6, aliases: ['km/h', 'kph', 'kilometer per hour', 'kilometers per hour', 'kilometre per hour', 'kilometres per hour'] },
  { id: 'mph', name: 'miles per hour', category: 'speed', factor: 0.44704, aliases: ['mph', 'mile per hour', 'miles per hour'] },
  { id: 'knot', name: 'knots', category: 'speed', factor: 0.5144444444444445, aliases: ['kn', 'knot', 'knots'] },
  { id: 'bpm', name: 'beats per minute', category: 'medical', aliases: ['bpm', 'beats per minute'] },
  { id: 'spo2', name: 'SpO2 percent', category: 'medical', aliases: ['spo2', 'spo2 percent', 'oxygen saturation percent'] },
  { id: 'inr', name: 'INR', category: 'currency', aliases: ['inr', 'rupee', 'rupees', '₹'] },
  { id: 'usd', name: 'USD', category: 'currency', aliases: ['usd', 'us dollar', 'us dollars', '$'] },
  { id: 'eur', name: 'EUR', category: 'currency', aliases: ['eur', 'euro', 'euros', '€'] },
  { id: 'gbp', name: 'GBP', category: 'currency', aliases: ['gbp', 'pound sterling', 'pounds sterling', '£'] },
  { id: 'aud', name: 'AUD', category: 'currency', aliases: ['aud', 'australian dollar', 'australian dollars'] },
  { id: 'cad', name: 'CAD', category: 'currency', aliases: ['cad', 'canadian dollar', 'canadian dollars'] },
  { id: 'jpy', name: 'JPY', category: 'currency', aliases: ['jpy', 'japanese yen', 'yen'] },
  { id: 'cny', name: 'CNY', category: 'currency', aliases: ['cny', 'chinese yuan', 'yuan'] },
  { id: 'sgd', name: 'SGD', category: 'currency', aliases: ['sgd', 'singapore dollar', 'singapore dollars'] },
  { id: 'aed', name: 'AED', category: 'currency', aliases: ['aed', 'uae dirham', 'uae dirhams'] },
  { id: 'chf', name: 'CHF', category: 'currency', aliases: ['chf', 'swiss franc', 'swiss francs'] },
  { id: 'nzd', name: 'NZD', category: 'currency', aliases: ['nzd', 'new zealand dollar', 'new zealand dollars'] },
  { id: 'hkd', name: 'HKD', category: 'currency', aliases: ['hkd', 'hong kong dollar', 'hong kong dollars'] },
];

const AMBIGUOUS_UNITS = [
  { aliases: ['glass', 'glasses'], message: 'Glass capacity varies. Provide the capacity in ml for a reliable conversion.' },
  { aliases: ['bag', 'bags', 'cement bag', 'cement bags'], message: 'Bag weight varies by product and region. Provide the bag weight in kg.' },
  { aliases: ['bigha', 'bighas'], message: 'Bigha size varies by region. Provide the local square-metre or square-foot conversion.' },
  { aliases: ['iu', 'international unit', 'international units'], message: 'IU-to-mass conversion depends on the substance. Provide the specific substance and verified conversion.' },
  { aliases: ['mmol/l'], message: 'mmol/L-to-mg/dL conversion depends on the analyte. Provide the analyte or molar mass.' },
  { aliases: ['gallon', 'gallons', 'gal', 'quart', 'quarts', 'qt', 'pint', 'pints', 'pt', 'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp'], message: 'This volume unit differs between US, Imperial, and metric conventions. Specify the exact convention, such as “US gallon”.' },
];

const normalize = (value) => String(value)
  .toLowerCase()
  .replaceAll('°', ' ')
  .replaceAll('²', '2')
  .replaceAll('³', '3')
  .replace(/[.,;:!?()[\]{}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const aliases = UNITS.flatMap((unit) => unit.aliases.map((alias) => ({ alias: normalize(alias), unit })))
  .sort((a, b) => b.alias.length - a.alias.length);

function findUnit(value) {
  const text = normalize(value);
  return aliases.find(({ alias }) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll(' ', '\\s+');
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(text);
  })?.unit;
}

function findAmbiguousUnit(value) {
  const text = normalize(value);
  const explicitVolumeSystem = /\b(?:us|imperial|metric)\b/.test(text);
  return AMBIGUOUS_UNITS.find(({ aliases: names, message }) => {
    if (explicitVolumeSystem && message.startsWith('This volume unit')) return false;
    return names.some((name) => {
    const alias = normalize(name);
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll(' ', '\\s+');
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(text);
    });
  });
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return null;
  const rounded = Number(value.toPrecision(12));
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 12 }).format(rounded);
}

function unsupported(message, original = '', medical = false) {
  const disclaimer = medical ? 'This is general health information, not medical advice.' : null;
  return {
    supported: false,
    original,
    converted: null,
    formula: null,
    confidence: 'uncertain',
    explanation: `${message} Needs verification.${disclaimer ? ` ${disclaimer}` : ''}`,
    disclaimer,
  };
}

function parseTarget(message) {
  const normalized = normalize(message);
  const connector = /\b(?:into|to)\b/g;
  let match;
  let last;
  while ((match = connector.exec(normalized))) last = match;
  if (!last) return null;
  const targetText = normalized.slice(last.index + last[0].length).trim();
  const targetUnit = findUnit(targetText);
  const ambiguous = AMBIGUOUS_UNITS.find(({ aliases: names }) => names.some((name) => {
    const normalizedName = normalize(name);
    return targetText === normalizedName || targetText.startsWith(`${normalizedName} `);
  }));
  return { targetText, targetUnit, ambiguous, sourceEnd: last.index };
}

function parseQuantity(sourceText) {
  const feetInches = sourceText.match(/(?:convert|please|from|about|approximately)?\s*(-?\d+(?:\.\d+)?)\s*(?:ft|feet|foot)\s+(\d+(?:\.\d+)?)\s*(?:in|inch|inches)\b/i);
  if (feetInches) {
    return {
      amount: Number(feetInches[1]) * 12 + Number(feetInches[2]),
      unit: UNITS.find((item) => item.id === 'in'),
      original: `${feetInches[1]} feet ${feetInches[2]} inches`,
      compound: true,
    };
  }

  const pressureRatio = sourceText.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)\s*(mm\s*hg|mmhg|psi|bar|kpa|mpa)\b/i);
  if (pressureRatio) {
    return {
      amount: [Number(pressureRatio[1]), Number(pressureRatio[2])],
      unit: findUnit(pressureRatio[3]),
      original: `${pressureRatio[1]}/${pressureRatio[2]} ${pressureRatio[3]}`,
      ratio: true,
    };
  }

  const amountMatch = sourceText.match(/(?:₹|\$|€|£)?\s*-?\d+(?:,\d{3})*(?:\.\d+)?/);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[0].replace(/[₹$€£,\s]/g, ''));
  if (!Number.isFinite(amount)) return null;
  const afterAmount = sourceText.slice(amountMatch.index + amountMatch[0].length);
  const unit = findUnit(`${amountMatch[0].match(/[₹$€£]/)?.[0] ?? ''} ${afterAmount}`);
  const ambiguous = findAmbiguousUnit(afterAmount);
  if (ambiguous) {
    return { amount, unit: null, ambiguous, original: `${amountMatch[0].trim()} ${normalize(afterAmount)}` };
  }
  return unit ? { amount, unit, original: `${amountMatch[0]} ${unit.name}` } : null;
}

function convertTemperature(value, source, target) {
  const celsius = source.id === 'c' ? value : source.id === 'f' ? (value - 32) * 5 / 9 : value - 273.15;
  if (target.id === 'c') return { value: celsius, formula: source.id === 'f' ? '(°F − 32) × 5 ÷ 9' : 'K − 273.15' };
  if (target.id === 'f') return { value: celsius * 9 / 5 + 32, formula: source.id === 'c' ? '(°C × 9 ÷ 5) + 32' : '((K − 273.15) × 9 ÷ 5) + 32' };
  return { value: celsius + 273.15, formula: source.id === 'c' ? '°C + 273.15' : '((°F − 32) × 5 ÷ 9) + 273.15' };
}

function convertAmount(value, source, target) {
  if (source.category !== target.category) return unsupported(`Cannot convert ${source.name} to ${target.name}; the dimensions do not match.`);
  if (source.category === 'temperature') return convertTemperature(value, source, target);
  if (source.category === 'medical') {
    if (source.id !== target.id) return unsupported(`Medical measure ${source.name} cannot be converted to ${target.name} as a different kind of measurement.`);
    return { value, formula: 'No conversion required; units are identical.' };
  }
  if (source.category === 'currency') {
    if (source.id === target.id) return { value, formula: 'No conversion required; currencies are identical.' };
    return null;
  }
  const result = value * source.factor / target.factor;
  return {
    value: result,
    formula: `${formatNumber(value)} × ${source.factor} ÷ ${target.factor}`,
  };
}

export function convertMeasurementText(message) {
  if (typeof message !== 'string' || !/\b(convert|how many|into|to)\b/i.test(message)) return null;
  const medicalContext = /\b(blood pressure|medical|vital|glucose|blood sugar|bpm|spo2|iu|mmol\/l|mmhg)\b/i.test(message);
  const target = parseTarget(message);
  if (!target) {
    if (!/\b(convert|how many)\b/i.test(message)) return null;
    return unsupported('Specify both the source and target units, for example “convert 10 km to miles”.', message.trim(), medicalContext);
  }

  const sourceText = message.slice(0, target.sourceEnd);
  const quantity = parseQuantity(sourceText);
  if (!quantity) {
    if (!/\b(convert|how many)\b/i.test(message)) return null;
    return unsupported('I could not identify a supported source value and unit. Include both, for example “convert 10 km to miles”.', message.trim(), medicalContext);
  }
  if (quantity.ambiguous) return unsupported(quantity.ambiguous.message, quantity.original, medicalContext);
  if (target.ambiguous) return unsupported(target.ambiguous.message, quantity.original, medicalContext);
  if (!target.targetUnit) return unsupported(`“${target.targetText}” is not a fixed, supported unit.`, quantity.original, medicalContext);

  const source = quantity.unit;
  const targetUnit = target.targetUnit;
  const hasRate = message.match(/\b(?:at|rate(?:\s+is)?)\s*(\d+(?:\.\d+)?)/i);
  const userRate = hasRate ? Number(hasRate[1]) : null;
  if (source.category === 'currency' && source.id !== targetUnit.id && hasRate && (!Number.isFinite(userRate) || userRate <= 0)) {
    return unsupported('The supplied exchange rate must be a positive finite number.', quantity.original);
  }
  let converted;
  let formula;
  if (quantity.ratio) {
    const one = convertAmount(quantity.amount[0], source, targetUnit);
    const two = convertAmount(quantity.amount[1], source, targetUnit);
    if (!one || !two || one.supported === false || two.supported === false || !Number.isFinite(one.value) || !Number.isFinite(two.value)) {
      if (source.category === 'currency' && userRate !== null) {
        converted = quantity.amount.map((value) => value * userRate);
        formula = `Each ${source.name} value × user-provided rate ${userRate} ${targetUnit.name} per ${source.name}`;
      } else {
        return unsupported(source.category === 'currency'
          ? 'No live exchange rate is configured. Supply an explicit rate using “at rate 83.2” (target currency units per source currency unit).'
          : `Cannot convert ${source.name} to ${targetUnit.name}.`, quantity.original, medicalContext);
      }
    } else {
      converted = [one.value, two.value];
      formula = `${one.formula}; applied separately to both values`;
    }
  } else {
    const conversion = convertAmount(quantity.amount, source, targetUnit);
    if (!conversion) {
      if (source.category === 'currency' && userRate !== null) {
        converted = quantity.amount * userRate;
        formula = `${formatNumber(quantity.amount)} × user-provided rate ${userRate} ${targetUnit.name} per ${source.name}`;
      } else {
        return unsupported(source.category === 'currency'
          ? 'No live exchange rate is configured. Supply an explicit rate using “at rate 83.2” (target currency units per source currency unit).'
          : `Cannot convert ${source.name} to ${targetUnit.name}.`, quantity.original, medicalContext);
      }
    } else if (conversion.value === undefined || !Number.isFinite(conversion.value)) {
      return conversion.supported === false && medicalContext
        ? { ...conversion, disclaimer: 'This is general health information, not medical advice.', explanation: `${conversion.explanation} This is general health information, not medical advice.` }
        : conversion;
    } else {
      converted = conversion.value;
      formula = conversion.formula;
    }
  }

  const convertedValues = Array.isArray(converted) ? converted : [converted];
  if (convertedValues.some((value) => !Number.isFinite(value))) {
    return unsupported('The result exceeds the supported numeric range.', quantity.original, medicalContext);
  }

  const isMedical = source.category === 'medical' || targetUnit.category === 'medical'
    || medicalContext
    || source.id === 'mmhg' || targetUnit.id === 'mmhg';
  const original = quantity.original;
  const convertedText = Array.isArray(converted)
    ? `${formatNumber(converted[0])}/${formatNumber(converted[1])} ${targetUnit.name}`
    : `${formatNumber(converted)} ${targetUnit.name}`;
  if (source.category === 'energy' && source.id === 'kcal') {
    formula += '; “calories” interpreted as food kilocalories (kcal)';
  }
  const disclaimer = isMedical ? 'This is general health information, not medical advice.' : null;
  const rateNote = source.category === 'currency' && source.id !== targetUnit.id
    ? 'Exchange rate supplied in the request; not independently verified.'
    : null;

  return {
    supported: true,
    original,
    converted: convertedText,
    formula,
    confidence: 'high',
    explanation: [
      `${original} = ${convertedText}.`,
      `Formula: ${formula}.`,
      source.category === 'volume' && (source.id.endsWith('_us') || targetUnit.id.endsWith('_us')) ? 'US customary volume units used.' : null,
      rateNote,
      disclaimer,
    ].filter(Boolean).join(' '),
    disclaimer,
  };
}
