// Deterministic number checker: every figure in an answer must appear in the evidence (question, fetched data,
// tool results). It cannot judge claims written in words; the verifier pass covers those.
const TOKEN = /(?<![\w.])(?:₹\s?|Rs\.?\s?|INR\s?)?\d[\d,]*(?:\.\d+)?\s?%?/g;
const toValue = (t) => Number(t.replace(/[^\d.]/g, ''));

function numbersIn(text) {
  const out = [];
  for (const line of String(text ?? '').split('\n')) {
    const body = line.replace(/^\s*(?:[-*•]\s*)?\d{1,2}[.)]\s+/, (m) => ' '.repeat(m.length)); // list markers are not figures
    for (const m of body.matchAll(TOKEN)) {
      const t = m[0].trim(); const v = toValue(t);
      if (Number.isFinite(v)) out.push({ text: t, value: v, strict: /₹|Rs|INR|%|\./.test(t) || v >= 100 });
    }
  }
  return out;
}
const isYear = (v) => Number.isInteger(v) && v >= 1990 && v <= 2100;

export function checkNumbers(answer, evidenceTexts = []) {
  const known = new Set();
  for (const e of evidenceTexts) for (const n of numbersIn(e)) known.add(n.value);
  const found = numbersIn(answer);
  const unsupported = found.filter((n) => n.strict && !isYear(n.value) && !known.has(n.value));
  return { checked: found.length, unsupported: unsupported.map((n) => n.text) };
}

/** Returns the answer with each unsupported figure labelled, plus the list. */
export function guardNumbers(answer, evidenceTexts = []) {
  const { checked, unsupported } = checkNumbers(answer, evidenceTexts);
  let out = String(answer ?? '');
  for (const t of new Set(unsupported)) out = out.split(t).join(`[uncertain: ${t}]`);
  return { answer: out, checked, unsupported };
}
