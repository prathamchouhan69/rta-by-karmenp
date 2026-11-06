// Construction cost and quantity intelligence for RTA by KARM.
// No market rate is built in. Every rate must come from the caller or a dated
// material-price record. Missing rates are reported, never guessed.

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const round = (n, sig = 10) => { if (!Number.isFinite(n)) return null; if (n === 0) return 0; const m = Math.floor(Math.log10(Math.abs(n))); const f = 10 ** (sig - m - 1); return Math.round(n * f) / f; };
const num = (v, name, { min = 0, max = Infinity, allowZero = true } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw Object.assign(new Error(`${name} must be a number`), { status: 422, code: 'BAD_INPUT' });
  if (!allowZero && n === 0) throw Object.assign(new Error(`${name} must not be zero`), { status: 422, code: 'BAD_INPUT' });
  if (n < min || n > max) throw Object.assign(new Error(`${name} is out of range`), { status: 422, code: 'BAD_INPUT' });
  return n;
};
const fail = (code, message, extra = {}) => ({ ok: false, code, message, ...extra });

export const PROJECT_TYPES = Object.freeze({
  peb_shed: { label: 'PEB shed', categories: ['PEB steel', 'purlins', 'roofing sheets', 'insulation', 'foundation', 'erection labour', 'transport'] },
  warehouse: { label: 'Warehouse', categories: ['foundation', 'PEB steel', 'roofing', 'flooring', 'walls', 'electrical', 'transport'] },
  factory_building: { label: 'Factory building', categories: ['foundation', 'structural steel', 'roofing', 'walls', 'flooring', 'utilities', 'transport'] },
  rcc_building: { label: 'RCC building', categories: ['cement', 'steel', 'sand', 'aggregate', 'shuttering', 'labour', 'transport'] },
  industrial_flooring: { label: 'Industrial flooring', categories: ['concrete', 'steel mesh', 'surface hardener', 'joints', 'labour', 'equipment'] },
  boundary_wall: { label: 'Boundary wall', categories: ['excavation', 'brickwork', 'cement', 'steel', 'plaster', 'labour'] },
  internal_road: { label: 'Internal road', categories: ['excavation', 'aggregate', 'cement', 'bitumen or concrete', 'compaction', 'labour'] },
  utilities: { label: 'Utilities', categories: ['piping', 'electrical', 'cabling', 'fixtures', 'labour'] },
  turnkey: { label: 'Turnkey project', categories: ['civil', 'structural', 'materials', 'labour', 'equipment', 'transport', 'utilities', 'overheads'] },
});

const CATEGORY_KEYS = new Set(['material', 'labour', 'equipment', 'transport', 'other']);

export function estimateProject({
  projectType = 'turnkey', location = '', areaSqm = null, areaSqft = null,
  lineItems = [], labourCost = 0, equipmentCost = 0, transportCost = 0, otherCost = 0,
  overheads = 0, overheadsPercent = 0, wastagePercent = 0, contingencyPercent = 0,
  profitPercent = 0, gstRate = 18, assumptions = [], sources = [], priceBasis = 'user-supplied',
} = {}) {
  if (!PROJECT_TYPES[projectType]) throw Object.assign(new Error(`projectType must be one of ${Object.keys(PROJECT_TYPES).join(', ')}`), { status: 422, code: 'BAD_TYPE' });
  if (!Array.isArray(lineItems)) throw Object.assign(new Error('lineItems must be a list'), { status: 422, code: 'BAD_INPUT' });
  const globalWastage = num(wastagePercent, 'wastagePercent', { max: 100 });
  const lines = []; const missingInputs = []; const warnings = [];
  const totals = { material: 0, labour: 0, equipment: 0, transport: 0, other: 0 };
  lineItems.forEach((raw, i) => {
    const category = CATEGORY_KEYS.has(raw?.category) ? raw.category : 'material';
    const name = String(raw?.name || `Line ${i + 1}`).slice(0, 160);
    const quantity = raw?.quantity == null || raw.quantity === '' ? null : num(raw.quantity, `lineItems[${i}].quantity`, { allowZero: false });
    const rate = raw?.rate == null || raw?.rate === '' ? null : num(raw.rate, `lineItems[${i}].rate`, { allowZero: false });
    const lineWastage = raw?.wastagePercent == null ? (category === 'material' ? globalWastage : 0) : num(raw.wastagePercent, `lineItems[${i}].wastagePercent`, { max: 100 });
    if (quantity == null) missingInputs.push({ line: i + 1, field: 'quantity', message: `${name}: quantity is missing` });
    if (rate == null) missingInputs.push({ line: i + 1, field: 'rate', message: `${name}: rate is missing` });
    const base = quantity != null && rate != null ? quantity * rate : 0;
    const wastage = base * lineWastage / 100;
    const total = base + wastage;
    if (quantity != null && rate != null) totals[category] += total;
    lines.push({ line: i + 1, name, category, quantity, unit: raw?.unit || null, rate, wastagePercent: lineWastage, baseCost: round2(base), wastageCost: round2(wastage), total: round2(total), rateSource: raw?.rateSource || null, rateDate: raw?.rateDate || null });
  });
  const addLabour = num(labourCost, 'labourCost');
  const addEquipment = num(equipmentCost, 'equipmentCost');
  const addTransport = num(transportCost, 'transportCost');
  const addOther = num(otherCost, 'otherCost');
  totals.labour += addLabour; totals.equipment += addEquipment; totals.transport += addTransport; totals.other += addOther;
  const directCost = Object.values(totals).reduce((s, v) => s + v, 0);
  const overheadAmount = num(overheads, 'overheads') + directCost * num(overheadsPercent, 'overheadsPercent', { max: 100 }) / 100;
  const contingency = (directCost + overheadAmount) * num(contingencyPercent, 'contingencyPercent', { max: 100 }) / 100;
  const profit = (directCost + overheadAmount + contingency) * num(profitPercent, 'profitPercent', { max: 100 }) / 100;
  const preTax = directCost + overheadAmount + contingency + profit;
  const gst = preTax * num(gstRate, 'gstRate', { max: 100 }) / 100;
  const total = preTax + gst;
  const sqm = areaSqm != null ? num(areaSqm, 'areaSqm', { allowZero: false }) : areaSqft != null ? num(areaSqft, 'areaSqft', { allowZero: false }) / 10.7639104167 : null;
  const sqft = sqm != null ? sqm * 10.7639104167 : null;
  if (sqm == null) missingInputs.push({ field: 'area', message: 'Built-up area is missing, so cost per square foot/metre cannot be calculated.' });
  const complete = missingInputs.length === 0;
  return {
    ok: true, projectType, projectLabel: PROJECT_TYPES[projectType].label, location: String(location || '').slice(0, 120),
    area: { sqft: sqft == null ? null : round2(sqft), sqm: sqm == null ? null : round2(sqm) },
    lines,
    costs: {
      material: round2(totals.material), labour: round2(totals.labour), equipment: round2(totals.equipment), transport: round2(totals.transport), other: round2(totals.other),
      direct: round2(directCost), overheads: round2(overheadAmount), contingency: round2(contingency), profit: round2(profit), preTax: round2(preTax), gst: round2(gst), total: round2(total),
    },
    perUnit: sqm == null ? null : { perSqft: round2(preTax / sqft), perSqm: round2(preTax / sqm), perSqftIncludingGst: round2(total / sqft), perSqmIncludingGst: round2(total / sqm) },
    priceBasis, confidence: complete ? (priceBasis === 'verified-price-book' ? 'high' : 'medium') : 'uncertain',
    assumptions: [
      'All rates are supplied by the caller. Flux did not invent a market rate.',
      `Wastage defaults to ${globalWastage}% on material lines unless a line overrides it.`,
      `Overheads: ${num(overheadsPercent, 'overheadsPercent')}% of direct cost plus any fixed amount.`,
      `Contingency: ${num(contingencyPercent, 'contingencyPercent')}% after overheads.`,
      `Profit: ${num(profitPercent, 'profitPercent')}% after contingency.`,
      `GST: ${num(gstRate, 'gstRate')}% applied to the pre-tax project value.`,
      ...assumptions.map((a) => String(a).slice(0, 300)),
    ],
    missingInputs, warnings,
    sources: sources.map((s) => ({ ...s, note: String(s?.note || '') })).slice(0, 50),
    source: 'Deterministic construction-cost build-up. Rates and assumptions are caller-supplied.',
    limitations: ['This is an estimate, not a quotation. Verify quantities against drawings, BOQ, site conditions and current supplier quotations.', 'GST treatment depends on the contract and place of supply; confirm with a CA.'],
  };
}

/** Standard concrete mix estimate. Dry-volume factor and cement density are stated assumptions. */
export function concreteMix({ volumeM3, mixRatio = '1:1.5:3', dryFactor = 1.54, cementDensityKgM3 = 1440, bagKg = 50, wastagePercent = 0 } = {}) {
  const volume = num(volumeM3, 'volumeM3', { allowZero: false });
  const parts = String(mixRatio).split(':').map((p) => num(p.trim(), 'mixRatio', { allowZero: false, max: 20 }));
  if (parts.length !== 3) return fail('BAD_MIX', 'mixRatio must look like 1:1.5:3 (cement:sand:aggregate).', { confidence: 'high' });
  const dry = volume * num(dryFactor, 'dryFactor', { allowZero: false });
  const sum = parts.reduce((s, p) => s + p, 0);
  const cementM3 = dry * parts[0] / sum;
  const sandM3 = dry * parts[1] / sum;
  const aggregateM3 = dry * parts[2] / sum;
  const cementKg = cementM3 * num(cementDensityKgM3, 'cementDensityKgM3', { allowZero: false });
  const wastage = num(wastagePercent, 'wastagePercent', { max: 100 }) / 100;
  const bags = cementKg / num(bagKg, 'bagKg', { allowZero: false });
  return {
    ok: true, volumeM3: volume, mixRatio, dryFactor, cementDensityKgM3, bagKg,
    dryVolumeM3: round2(dry), cementM3: round2(cementM3), sandM3: round2(sandM3), aggregateM3: round2(aggregateM3),
    cementKg: round2(cementKg), cementBags: Math.ceil(bags), sandM3WithWastage: round2(sandM3 * (1 + wastage)), aggregateM3WithWastage: round2(aggregateM3 * (1 + wastage)), cementBagsWithWastage: Math.ceil(bags * (1 + wastage)),
    confidence: 'medium', assumptions: [`Dry-volume factor ${dryFactor}.`, `Cement density ${cementDensityKgM3} kg/m³.`, `Bag size ${bagKg} kg.`, `Wastage ${wastagePercent}%.`],
    source: 'Standard volumetric concrete-mix arithmetic with stated assumptions.',
    limitations: ['Actual yield depends on moisture, compaction, admixtures and site practice. Confirm with a qualified engineer.'],
  };
}

export function rebarWeightPerMetre(diameterMm) {
  const d = num(diameterMm, 'diameterMm', { allowZero: false, max: 100 });
  return round(d * d / 162, 6);
}

export function steelWeight({ diameterMm, lengthM, bars = 1, wastagePercent = 0 } = {}) {
  const d = num(diameterMm, 'diameterMm', { allowZero: false, max: 100 });
  const length = num(lengthM, 'lengthM', { allowZero: false });
  const count = num(bars, 'bars', { allowZero: false });
  const wastage = num(wastagePercent, 'wastagePercent', { max: 100 });
  const perMetre = d * d / 162;
  const kg = perMetre * length * count * (1 + wastage / 100);
  return {
    ok: true, diameterMm: d, lengthM: length, bars: count, weightPerMetreKg: round(perMetre, 6), totalKg: round2(kg), totalMt: round(kg / 1000, 6),
    formula: `d²/162 = ${round(perMetre, 6)} kg/m; × ${length} m × ${count} bars × (1 + ${wastage}%)`,
    confidence: 'medium', assumptions: ['The d²/162 formula is an approximation for plain round bars and is commonly used for TMT rebar.', `Wastage ${wastage}%.`],
    source: 'Standard rebar weight approximation.',
    limitations: ['Use the manufacturer\'s unit weight for final billing; rib pattern and tolerance can change the value slightly.'],
  };
}

export function projectProfit({ contractValue, estimatedCost, gstRate = 18, gstIncluded = false } = {}) {
  const contract = num(contractValue, 'contractValue', { allowZero: false });
  const cost = num(estimatedCost, 'estimatedCost', { allowZero: false });
  const gst = num(gstRate, 'gstRate', { max: 100 });
  const revenueExGst = gstIncluded ? contract / (1 + gst / 100) : contract;
  const profit = revenueExGst - cost;
  const margin = profit / revenueExGst * 100;
  const markup = profit / cost * 100;
  return {
    ok: true, contractValue: round2(contract), gstIncluded, revenueExGst: round2(revenueExGst), estimatedCost: round2(cost), profit: round2(profit),
    marginPercent: round2(margin), markupPercent: round2(markup),
    status: profit > 0 ? 'profit' : profit === 0 ? 'break-even' : 'loss',
    breakEvenContractValue: round2(cost * (1 + (gstIncluded ? gst / 100 : 0))),
    confidence: 'high', assumptions: ['The cost figure is complete and excludes any contingency the caller has not included.', gstIncluded ? `The contract value includes ${gst}% GST.` : 'The contract value excludes GST.'],
    source: 'Deterministic project profit arithmetic.', limitations: ['Margin is not cash. Check retention, payment terms, escalation and financing cost.'],
  };
}

export function materialPriceImpact({ materialCost, oldPrice, newPrice, quantity = null } = {}) {
  const cost = num(materialCost, 'materialCost', { min: 0 });
  const oldP = num(oldPrice, 'oldPrice', { allowZero: false });
  const newP = num(newPrice, 'newPrice', { allowZero: false });
  const change = (newP - oldP) / oldP * 100;
  const projected = cost * (1 + change / 100);
  return {
    ok: true, oldPrice: round2(oldP), newPrice: round2(newP), changePercent: round2(change), direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'flat',
    currentMaterialCost: round2(cost), projectedMaterialCost: round2(projected), impactAmount: round2(projected - cost),
    ...(quantity != null ? { quantity: num(quantity, 'quantity'), impactPerUnit: round2(newP - oldP) } : {}),
    confidence: 'high', assumptions: ['The old cost used the old price for the same quantity and specification.'], source: 'Deterministic price-impact arithmetic.',
    limitations: ['Freight, GST, wastage and payment terms are not included unless they were in the original cost.'],
  };
}
