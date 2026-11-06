// Deterministic field extraction from text the caller already has. Flux does not
// run OCR, read files or call a vision service in this build. If no text is
// supplied the answer is OCR_NOT_CONFIGURED, never a guessed document.
import { validateGstin } from '../checks/gstin.js';
import { fail } from '../finance/shared.js';

const MAX_TEXT = 100000;
const unique = (list) => [...new Set(list)];

const amountNumber = (raw) => {
  const value = Number(String(raw).replace(/,/g, ''));
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
};

const isoDate = (raw) => {
  const value = String(raw).trim();
  let year, month, day;
  let match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) [, year, month, day] = match;
  else {
    match = value.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
    if (!match) return null;
    day = match[1]; month = match[2]; year = match[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === `${year}-${month}-${day}` ? `${year}-${month}-${day}` : null;
};

const matches = (text, regex, max = 20) => {
  const found = [];
  for (const match of text.matchAll(regex)) { found.push(match); if (found.length >= max) break; }
  return found;
};

export function ocrStatus() {
  return {
    ok: true, configured: false, code: 'OCR_NOT_CONFIGURED',
    message: 'No OCR or vision engine is configured on this server. Flux can extract fields from text that a scanner, phone or PDF tool has already produced.',
    supported: ['Paste or upload extracted plain text', 'Deterministic GSTIN, PAN, date, invoice-number, amount, HSN/SAC, GST-rate, email and phone extraction'],
    notSupported: ['Reading an image or scanned PDF directly', 'Guessing a missing field', 'Calling an external vision service without an approved configuration'],
    alternatives: ['Use your scanner or phone text recognition, then paste the text into the extractor.', 'Type the invoice fields into the document draft flow and review every value before approval.'],
  };
}

export function extractDocumentText({ text, filename = null, textSource = 'caller-supplied' } = {}) {
  if (typeof text !== 'string' || !text.trim()) {
    return fail('OCR_NOT_CONFIGURED', 'No text was supplied, and no OCR engine is configured. Scan or copy the text first, then submit it.', { confidence: 'uncertain', status: ocrStatus() });
  }
  if (text.length > MAX_TEXT) return fail('TEXT_TOO_LONG', `Extracted text must be at most ${MAX_TEXT} characters.`, { confidence: 'high' });
  const raw = text.replace(/\r\n?/g, '\n');
  const gstinCandidates = unique(matches(raw.toUpperCase(), /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g, 10).map((m) => m[0]));
  const gstins = gstinCandidates.map((value) => validateGstin(value));
  const pans = unique(matches(raw.toUpperCase(), /\b[A-Z]{5}\d{4}[A-Z]\b/g, 10).map((m) => m[0]));
  const invoiceMatch = raw.match(/(?:invoice|inv|bill)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\/\-_.]{2,40})/i);
  const dates = unique(matches(raw, /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\b/g, 20).map((m) => isoDate(m[0])).filter(Boolean));
  const amountMatches = matches(raw, /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi, 30);
  const amounts = amountMatches.map((m) => amountNumber(m[1])).filter((v) => v != null);
  const hsnSac = unique(matches(raw, /(?:HSN|SAC)\s*(?:code)?\s*[:\-]?\s*(\d{4,8})\b/gi, 20).map((m) => m[1]));
  const gstRates = unique(matches(raw, /(?:GST|tax)\s*(?:@|at)?\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/gi, 10).map((m) => Number(m[1])));
  const emails = unique(matches(raw, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, 10).map((m) => m[0]));
  const phones = unique(matches(raw, /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g, 10).map((m) => m[0].replace(/\s/g, '')));
  const missing = [];
  if (!invoiceMatch) missing.push('invoiceNumber');
  if (!dates.length) missing.push('date');
  if (!amounts.length) missing.push('amount');
  if (!gstins.length) missing.push('gstin');
  if (!hsnSac.length) missing.push('hsnSac');
  const signals = [invoiceMatch, dates.length, amounts.length, gstins.length, hsnSac.length].filter(Boolean).length;
  return {
    ok: true, filename: filename ? String(filename).slice(0, 200) : null, textSource: String(textSource).slice(0, 80),
    chars: text.length, fields: {
      invoiceNumber: invoiceMatch ? invoiceMatch[1] : null,
      dates, amounts: unique(amounts), largestAmount: amounts.length ? Math.max(...amounts) : null,
      gstins, pans, hsnSac, gstRates, emails, phones,
    },
    missing, signals,
    confidence: signals >= 4 ? 'medium' : signals >= 2 ? 'low' : 'uncertain',
    warnings: ['OCR was not run. Every field comes from the text supplied by the caller.', 'Dates written as day/month/year are read in that order for Indian documents.', 'A GSTIN check is format and checksum only, not a live registration check.'],
    disclaimer: 'This is field extraction from caller-supplied text, not document verification, tax advice or a substitute for reading the original.',
    limitations: ['Handwriting, poor scans, merged lines and unusual layouts can defeat pattern extraction.', 'Always compare every extracted value with the original document before using it.'],
  };
}
