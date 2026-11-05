// D3 data (PAN, Aadhaar, bank details, passwords, cards) must never reach a model or a log.
const luhn = (s) => { let sum = 0, alt = false; for (let i = s.length - 1; i >= 0; i--) { let n = +s[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return sum % 10 === 0; };
// Order matters: the most specific patterns run first so a card number is not chopped up by the Aadhaar rule.
const RULES = [
  ['PAN', /\b[A-Z]{5}\d{4}[A-Z]\b/g],
  ['IFSC', /\b[A-Z]{4}0[A-Z0-9]{6}\b/g],
  ['SECRET', /\b(password|passcode|pin|otp|cvv)\b\s*[:=]\s*\S+/gi],
  ['CARD', /\b(?:\d[ -]?){13,19}\b/g, (m) => luhn(m.replace(/\D/g, ''))],
  ['ACCOUNT', /(?<=(?:account|a\/c|acct|acc)\s*(?:no\.?|number|#)?\s*[:\-]?\s*)\d{9,18}\b/gi],
  ['AADHAAR', /\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b/g],
];
export function redactText(text) {
  let out = String(text ?? ''); const found = new Set();
  for (const [type, re, guard] of RULES) {
    out = out.replace(re, (m) => { if (guard && !guard(m)) return m; found.add(type); return `[REDACTED-${type}]`; });
  }
  return { text: out, found: [...found] };
}
const SECRET_KEY = /(secret|token|password|passcode|authorization|api[-_]?key|refresh|cookie)/i;
export function redactDeep(v, depth = 0) {
  if (depth > 8) return '[depth-limit]';
  if (typeof v === 'string') return redactText(v).text;
  if (Array.isArray(v)) return v.map((x) => redactDeep(x, depth + 1));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, SECRET_KEY.test(k) ? '[REDACTED-KEY]' : redactDeep(x, depth + 1)]));
  return v;
}
