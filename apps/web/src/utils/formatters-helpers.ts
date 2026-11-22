// RTA by KARM — Private formatter helpers
// MONEY LAW: All inputs are Zoho verbatim strings. No parseFloat, no Number(), no arithmetic.

/** Clean money string: remove currency symbols, commas, spaces */
export function cleanMoneyString(s: string | number): string {
  if (!s) return '';
  const str = typeof s === 'number' ? String(s) : s;
  return str.trim().replace(/[₹,\s]/g, '');
}

/** Group digits in Indian format: 3 digits, then groups of 2 */
export function groupIndian(numStr: string | number): string {
  const str = typeof numStr === 'number' ? String(numStr) : numStr;
  const parts = str.split('.');
  const intPart = parts[0] ?? '';
  const decPart = parts[1] ? '.' + parts[1] : '';

  if (intPart.length <= 3) return intPart + decPart;

  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const groups = rest.match(/.{1,2}/g) || [];
  return groups.join(',') + ',' + last3 + decPart;
}

/** Format as Crores with 2 decimals using string slicing */
export function formatCompactCr(numStr: string): string {
  const len = numStr.length;
  const wholePart = numStr.slice(0, len - 7);
  const decimalPart = numStr.slice(len - 7, len - 5);
  return `${wholePart}.${decimalPart}`;
}

/** Format as Lakhs with 2 decimals using string slicing */
export function formatCompactL(numStr: string): string {
  const len = numStr.length;
  const wholePart = numStr.slice(0, len - 5);
  const decimalPart = numStr.slice(len - 5, len - 3);
  return `${wholePart}.${decimalPart}`;
}

/** Format as thousands with 1 decimal using string slicing */
export function formatCompactK(numStr: string): string {
  const len = numStr.length;
  const wholePart = numStr.slice(0, len - 3);
  const decimalPart = numStr.slice(len - 3, len - 2);
  return `${wholePart}.${decimalPart}`;
}