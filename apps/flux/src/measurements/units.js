// Unit catalogue and aliases for the Measurement Intelligence Engine.
// Factors are exact SI / international definitions unless a unit is explicitly marked
// local or assumption-based. No currency rate or medical factor is stored here.

const MASS = {
  mg: { factor: 1e-6, label: 'milligram', aliases: ['milligram', 'milligrams'] },
  g: { factor: 0.001, label: 'gram', aliases: ['gram', 'grams', 'gm', 'gms'] },
  kg: { factor: 1, label: 'kilogram', aliases: ['kilogram', 'kilograms', 'kgs'] },
  tonne: { factor: 1000, label: 'tonne', aliases: ['tonne', 'tonnes', 'ton', 'tons', 'mt', 'metric_ton', 'metric_tonne'] },
  quintal: { factor: 100, label: 'quintal', aliases: ['quintal', 'quintals'] },
  ounce: { factor: 0.028349523125, label: 'ounce', aliases: ['ounce', 'ounces', 'oz'] },
  pound: { factor: 0.45359237, label: 'pound', aliases: ['pound', 'pounds', 'lb', 'lbs'] },
  stone: { factor: 6.35029318, label: 'stone', aliases: ['stone', 'stones'] },
};

const LENGTH = {
  mm: { factor: 0.001, label: 'millimetre', aliases: ['millimetre', 'millimetres', 'millimeter', 'millimeters'] },
  cm: { factor: 0.01, label: 'centimetre', aliases: ['centimetre', 'centimetres', 'centimeter', 'centimeters'] },
  m: { factor: 1, label: 'metre', aliases: ['metre', 'metres', 'meter', 'meters'] },
  km: { factor: 1000, label: 'kilometre', aliases: ['kilometre', 'kilometres', 'kilometer', 'kilometers'] },
  inch: { factor: 0.0254, label: 'inch', aliases: ['inch', 'inches', 'in', '"'] },
  foot: { factor: 0.3048, label: 'foot', aliases: ['foot', 'feet', 'ft', "'"] },
  yard: { factor: 0.9144, label: 'yard', aliases: ['yard', 'yards', 'yd'] },
  mile: { factor: 1609.344, label: 'mile', aliases: ['mile', 'miles', 'mi'] },
  nautical_mile: { factor: 1852, label: 'nautical mile', aliases: ['nautical_mile', 'nmi'] },
  running_foot: { factor: 0.3048, label: 'running foot', aliases: ['running_foot', 'running_feet', 'rft', 'running_ft'] },
  running_metre: { factor: 1, label: 'running metre', aliases: ['running_metre', 'running_meter', 'rmt', 'running_m'] },
};

const VOLUME = {
  ml: { factor: 0.001, label: 'millilitre', aliases: ['millilitre', 'millilitres', 'milliliter', 'milliliters'] },
  litre: { factor: 1, label: 'litre', aliases: ['litre', 'litres', 'liter', 'liters', 'l', 'lt'] },
  cubic_metre: { factor: 1000, label: 'cubic metre', aliases: ['cubic_metre', 'cubic_metres', 'cubic_meter', 'cubic_meters', 'm3', 'cum', 'cbm'] },
  cubic_foot: { factor: 28.316846592, label: 'cubic foot', aliases: ['cubic_foot', 'cubic_feet', 'cft', 'cuft', 'cu_ft', 'ft3'] },
  gallon_us: { factor: 3.785411784, label: 'US gallon', aliases: ['gallon_us', 'us_gallon', 'gallon', 'gallons', 'gal'] },
  gallon_uk: { factor: 4.54609, label: 'UK gallon', aliases: ['gallon_uk', 'imperial_gallon', 'uk_gallon'] },
  quart_us: { factor: 0.946352946, label: 'US quart', aliases: ['quart', 'quarts', 'qt'] },
  pint_us: { factor: 0.473176473, label: 'US pint', aliases: ['pint', 'pints', 'pt'] },
  cup_us: { factor: 0.2365882365, label: 'US cup', aliases: ['cup', 'cups'] },
  tablespoon_us: { factor: 0.01478676478125, label: 'US tablespoon', aliases: ['tablespoon', 'tablespoons', 'tbsp'] },
  teaspoon_us: { factor: 0.00492892159375, label: 'US teaspoon', aliases: ['teaspoon', 'teaspoons', 'tsp'] },
  glass: { factor: 0.25, label: 'glass (assumed 250 ml)', aliases: ['glass', 'glasses'], assumption: 'A glass is assumed to be 250 ml. Change the assumption if your glass differs.' },
};

const AREA = {
  sq_mm: { factor: 1e-6, label: 'square millimetre', aliases: ['sq_mm', 'sqmm', 'square_millimetre', 'square_millimeter'] },
  sq_cm: { factor: 0.0001, label: 'square centimetre', aliases: ['sq_cm', 'sqcm', 'square_centimetre', 'square_centimeter'] },
  sq_m: { factor: 1, label: 'square metre', aliases: ['sq_m', 'sqm', 'sq_meter', 'sq_meters', 'sq_metre', 'sq_metres', 'square_metre', 'square_metres', 'square_meter', 'square_meters', 'm2'] },
  sq_km: { factor: 1e6, label: 'square kilometre', aliases: ['sq_km', 'sqkm', 'sq_kilometre', 'sq_kilometer', 'square_kilometre', 'square_kilometer'] },
  sq_in: { factor: 0.00064516, label: 'square inch', aliases: ['sq_in', 'sqin', 'sq_inch', 'sq_inches', 'square_inch', 'square_inches'] },
  sq_ft: { factor: 0.09290304, label: 'square foot', aliases: ['sq_ft', 'sqft', 'sq_foot', 'sq_feet', 'square_foot', 'square_feet', 'sft', 'ft2'] },
  sq_yd: { factor: 0.83612736, label: 'square yard', aliases: ['sq_yd', 'sqyd', 'sq_yard', 'sq_yards', 'square_yard', 'square_yards', 'gaj'] },
  acre: { factor: 4046.8564224, label: 'acre', aliases: ['acre', 'acres'] },
  hectare: { factor: 10000, label: 'hectare', aliases: ['hectare', 'hectares', 'ha'] },
  guntha: { factor: 101.17141056, label: 'guntha', aliases: ['guntha', 'gunthas', 'gunta'] },
  bigha: { factor: null, label: 'bigha (local definition required)', aliases: ['bigha', 'bighas'], assumption: 'Bigha is not a single national unit. Supply bighaSqm from a verified local source; Flux will not guess it.' },
};

const TEMPERATURE = {
  celsius: { label: 'degree Celsius', aliases: ['celsius', 'centigrade', 'c', '°c'] },
  fahrenheit: { label: 'degree Fahrenheit', aliases: ['fahrenheit', 'f', '°f'] },
  kelvin: { label: 'kelvin', aliases: ['kelvin', 'k'] },
};

const PRESSURE = {
  pa: { factor: 1, label: 'pascal', aliases: ['pascal', 'pascals', 'pa'] },
  kpa: { factor: 1000, label: 'kilopascal', aliases: ['kilopascal', 'kilopascals', 'kpa'] },
  mpa: { factor: 1e6, label: 'megapascal', aliases: ['megapascal', 'megapascals', 'mpa'] },
  bar: { factor: 100000, label: 'bar', aliases: ['bar', 'bars'] },
  psi: { factor: 6894.757293168, label: 'pound per square inch', aliases: ['psi', 'pound_per_square_inch'] },
  mmhg: { factor: 133.322387415, label: 'millimetre of mercury', aliases: ['mmhg', 'millimetre_of_mercury', 'millimeter_of_mercury', 'torr'] },
  atm: { factor: 101325, label: 'atmosphere', aliases: ['atm', 'atmosphere', 'atmospheres'] },
};

const ENERGY = {
  joule: { factor: 1, label: 'joule', aliases: ['joule', 'joules', 'j'] },
  kilojoule: { factor: 1000, label: 'kilojoule', aliases: ['kilojoule', 'kilojoules', 'kj'] },
  calorie: { factor: 4.184, label: 'calorie (small)', aliases: ['calorie', 'calories', 'cal'] },
  kilocalorie: { factor: 4184, label: 'kilocalorie', aliases: ['kilocalorie', 'kilocalories', 'kcal', 'food_calorie', 'food_calories'] },
  kwh: { factor: 3600000, label: 'kilowatt-hour', aliases: ['kwh', 'kilowatt_hour', 'kilowatt_hours'] },
};

const SPEED = {
  ms: { factor: 1, label: 'metre per second', aliases: ['ms', 'm_s', 'metre_per_second', 'meter_per_second'] },
  kmh: { factor: 0.2777777777777778, label: 'kilometre per hour', aliases: ['kmh', 'kmph', 'kph', 'km_h', 'kilometre_per_hour', 'kilometer_per_hour'] },
  mph: { factor: 0.44704, label: 'mile per hour', aliases: ['mph', 'mile_per_hour', 'miles_per_hour'] },
  knot: { factor: 0.5144444444444445, label: 'knot', aliases: ['knot', 'knots', 'kn'] },
};

const MEDICAL = {
  mg: { factor: 1e-3, label: 'milligram', aliases: ['milligram', 'milligrams', 'mg'], category: 'mass' },
  mcg: { factor: 1e-6, label: 'microgram', aliases: ['microgram', 'micrograms', 'mcg', 'ug', 'µg'], category: 'mass' },
  g: { factor: 1, label: 'gram', aliases: ['gram', 'grams', 'g'], category: 'mass' },
  ml: { factor: 1, label: 'millilitre', aliases: ['millilitre', 'milliliter', 'ml'], category: 'volume' },
  iu: { factor: null, label: 'international unit', aliases: ['iu', 'international_unit', 'international_units'], category: 'activity' },
};

const FUEL_EFFICIENCY = {
  kmpl: { factor: 1, label: 'kilometres per litre', aliases: ['kmpl', 'km_l', 'km_per_litre', 'km_per_liter'] },
  mpg_us: { factor: 0.425143707, label: 'US miles per gallon', aliases: ['mpg', 'mpg_us', 'miles_per_gallon'] },
  mpg_uk: { factor: 0.35400619, label: 'UK miles per gallon', aliases: ['mpg_uk', 'imperial_mpg'] },
  l_per_100km: { factor: null, label: 'litres per 100 km', aliases: ['l_per_100km', 'l_100km', 'litres_per_100km'] },
};

export const GROUPS = {
  length: { base: 'm', units: LENGTH, source: 'SI / BIPM definitions and exact international yard-pound definitions.' },
  mass: { base: 'kg', units: MASS, source: 'SI / BIPM definitions and exact international avoirdupois definitions.' },
  volume: { base: 'litre', units: VOLUME, source: 'SI and exact US/UK customary definitions.' },
  area: { base: 'sq_m', units: AREA, source: 'SI and exact international area definitions; guntha is 1/40 acre.' },
  temperature: { base: 'kelvin', units: TEMPERATURE, source: 'SI temperature scales.' },
  pressure: { base: 'pa', units: PRESSURE, source: 'SI pressure definitions and standard atmosphere.' },
  energy: { base: 'joule', units: ENERGY, source: 'SI energy definitions; thermochemical calorie = 4.184 J.' },
  speed: { base: 'ms', units: SPEED, source: 'SI speed definitions and exact international mile definitions.' },
  medical: { base: null, units: MEDICAL, source: 'SI medical mass/volume units. IU and mmol/L conversions require a substance-specific factor.' },
  fuel_efficiency: { base: null, units: FUEL_EFFICIENCY, source: 'Exact conversion from US gallon and international mile; fuel consumption is the inverse of efficiency.' },
};

const ALIASES = new Map();
for (const [groupName, group] of Object.entries(GROUPS)) {
  for (const [unit, def] of Object.entries(group.units)) {
    for (const name of [unit, ...(def.aliases || [])]) ALIASES.set(normaliseUnit(name), { group: groupName, unit });
  }
}

const EXTRA_ALIASES = {
  bag: { special: 'cement_bag' }, bags: { special: 'cement_bag' },
  cement_bag: { special: 'cement_bag' }, cement_bags: { special: 'cement_bag' },
  mt: { group: 'mass', unit: 'tonne' }, t: { group: 'mass', unit: 'tonne' },
  cft: { group: 'volume', unit: 'cubic_foot' }, cum: { group: 'volume', unit: 'cubic_metre' },
  sqft: { group: 'area', unit: 'sq_ft' }, sft: { group: 'area', unit: 'sq_ft' },
  rft: { group: 'length', unit: 'running_foot' }, rmt: { group: 'length', unit: 'running_metre' },
  mmhg: { group: 'pressure', unit: 'mmhg' },
};

export function normaliseUnit(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[°]/g, '')
    .replace(/\b(square|sq\.?)\s+/g, 'sq_')
    .replace(/\b(cubic|cu\.?)\s+/g, 'cubic_')
    .replace(/[^a-z0-9%µ]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function resolveUnit(value) {
  const key = normaliseUnit(value);
  return EXTRA_ALIASES[key] || ALIASES.get(key) || null;
}

export function listUnits() {
  return Object.fromEntries(Object.entries(GROUPS).map(([name, group]) => [name, {
    base: group.base,
    source: group.source,
    units: Object.entries(group.units).map(([unit, def]) => ({ unit, label: def.label, aliases: def.aliases || [], ...(def.assumption ? { assumption: def.assumption } : {}) })),
  }]));
}

export const ISO_CURRENCIES = new Set([
  'INR', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'SGD', 'HKD', 'NZD',
  'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'MYR', 'THB', 'IDR', 'PHP', 'VND', 'KRW',
  'BRL', 'MXN', 'ZAR', 'NGN', 'KES', 'EGP', 'TRY', 'RUB', 'PLN', 'SEK', 'NOK', 'DKK',
  'CZK', 'HUF', 'RON', 'ILS', 'PKR', 'BDT', 'LKR', 'NPR', 'MMK', 'KHR', 'TWD',
]);
