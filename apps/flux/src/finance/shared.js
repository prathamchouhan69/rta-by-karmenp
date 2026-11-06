export const DISCLAIMER = 'Educational information only, not personalised investment advice.';
export const TAX_NOTE = 'Tax and GST figures are estimates for planning. Verify with a qualified CA and the official GST portal before filing or invoicing.';

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const finite = (v) => Number.isFinite(Number(v));
export const fail = (code, message, extra = {}) => ({ ok: false, code, message, ...extra });

export function number(value, name, { min = -Infinity, max = Infinity, allowZero = true } = {}) {
  const n = Number(value);
  if (!finite(n)) throw Object.assign(new Error(`${name} must be a number`), { status: 422, code: 'BAD_INPUT' });
  if (!allowZero && n === 0) throw Object.assign(new Error(`${name} must not be zero`), { status: 422, code: 'BAD_INPUT' });
  if (n < min || n > max) throw Object.assign(new Error(`${name} must be between ${min} and ${max}`), { status: 422, code: 'BAD_INPUT' });
  return n;
}
