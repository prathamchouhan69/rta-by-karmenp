export const STATES = { '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', 10: 'Bihar', 11: 'Sikkim', 12: 'Arunachal Pradesh', 13: 'Nagaland', 14: 'Manipur', 15: 'Mizoram', 16: 'Tripura', 17: 'Meghalaya', 18: 'Assam', 19: 'West Bengal', 20: 'Jharkhand', 21: 'Odisha', 22: 'Chhattisgarh', 23: 'Madhya Pradesh', 24: 'Gujarat', 26: 'Dadra and Nagar Haveli and Daman and Diu', 27: 'Maharashtra', 29: 'Karnataka', 30: 'Goa', 31: 'Lakshadweep', 32: 'Kerala', 33: 'Tamil Nadu', 34: 'Puducherry', 35: 'Andaman and Nicobar Islands', 36: 'Telangana', 37: 'Andhra Pradesh', 38: 'Ladakh', 97: 'Other Territory', 99: 'Centre Jurisdiction' };
const CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function gstinCheckChar(first14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) { const v = CH.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2); sum += Math.floor(v / 36) + (v % 36); }
  return CH[(36 - (sum % 36)) % 36];
}
/** Structure, state code and checksum only. This is NOT a live check that the registration is active. */
export function validateGstin(input) {
  const g = String(input ?? '').trim().toUpperCase(); const reasons = [];
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) reasons.push('Does not match the 15-character GSTIN structure');
  const state = g.slice(0, 2);
  if (g.length === 15 && !STATES[state]) reasons.push(`Unknown state code ${state}`);
  const checksumOk = g.length === 15 && gstinCheckChar(g.slice(0, 14)) === g[14];
  if (g.length === 15 && !checksumOk) reasons.push('Check character does not match');
  return { gstin: g, valid: reasons.length === 0, reasons, state, stateName: STATES[state] || null, pan: g.slice(2, 12), checksumOk, note: 'Format and checksum only. Not a live registration check.' };
}
