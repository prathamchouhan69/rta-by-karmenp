// Class B estimates: deterministic, labelled, never written to Zoho or put on documents.
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export function fuelTrip(i) {
  const need = ['distanceKm', 'loadedKmpl', 'dieselPrice', 'loadMt'];
  const bad = need.filter((k) => !(Number(i[k]) > 0));
  if (bad.length) return { ok: false, error: `Enter a positive number for: ${bad.join(', ')}. Flux never guesses the diesel price.` };
  const mode = i.returnMode || 'empty';
  if (mode === 'empty' && !(Number(i.emptyKmpl) > 0)) return { ok: false, error: 'Enter empty-truck mileage (emptyKmpl) for an empty return.' };
  const d = +i.distanceKm, lk = +i.loadedKmpl, ek = +i.emptyKmpl, price = +i.dieselPrice, load = +i.loadMt, other = +(i.otherCosts || 0);
  const loadedL = d / lk;
  const returnL = mode === 'oneway' ? 0 : mode === 'loaded' ? d / lk : d / ek;
  const litres = loadedL + returnL, fuel = litres * price;
  const out = { ok: true, estimate: true, litresPerTrip: r2(litres), fuelCost: r2(fuel), fuelPlusOther: r2(fuel + other), fuelPerMt: r2(fuel / load), breakEvenFreightPerMt: r2((fuel + other) / load), fuelPerMtKm: r2(fuel / (load * d)),
    formulas: { litres: 'distance / loaded km per litre + return distance / return km per litre', fuelCost: 'litres x diesel price', breakEven: '(fuel cost + other costs) / load in MT' } };
  if (Number(i.freightPerMt) > 0) { const fr = +i.freightPerMt * load; out.freight = r2(fr); out.leftAfterCosts = r2(fr - fuel - other); out.fuelShareOfFreightPct = r2((fuel / fr) * 100); }
  if (Number(i.actualLitres) > 0) {
    const diff = +i.actualLitres - litres, pct = (diff / litres) * 100, alert = Number(i.alertPct ?? 10);
    out.variance = { litres: r2(diff), pct: r2(pct), flagged: Math.abs(pct) > alert, alertPct: alert };
  }
  return out;
}
