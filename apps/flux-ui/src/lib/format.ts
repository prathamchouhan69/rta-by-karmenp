const ACRONYMS: Record<string, string> = {
  gst: 'GST', cgst: 'CGST', sgst: 'SGST', emi: 'EMI', bmi: 'BMI', bmr: 'BMR',
  tdee: 'TDEE', cac: 'CAC', ltv: 'LTV', roi: 'ROI', sip: 'SIP', hsn: 'HSN',
  sac: 'SAC', gstin: 'GSTIN', pan: 'PAN', ocr: 'OCR', m3: 'm³', kg: 'kg',
  sqft: 'sq ft', sqm: 'sq m', id: 'ID', url: 'URL', pct: '%',
};

export function humanLabel(key: string): string {
  const spaced = String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced
    .split(/\s+/)
    .map((word) => ACRONYMS[word.toLowerCase()] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const PERCENT = /(percent|percentage|pct|share|margin|rate)$/i;
const COUNT = /(months?|years?|days?|count|units?|bars|bags|observations|signals|chars|score|rank|age|people|hours?|minutes?|sessions?|yearsToRetirement|retirementYears)$/i;
const MONEY = /(amount|cost|price|value|balance|revenue|income|savings|principal|emi|payment|outflow|inflow|cash|worth|gap|corpus|burn|tax|gst|total|subtotal|contribution|profit|loss|expense|budget|goal|valuation|investment|liquid|debt|receivable|payable|salary|wage|freight|overhead|contingency|allocation|needed|target|surplus|installment|interest|cess|cgst|sgst|charge|premium|fee|proceeds|pricePerUnit)$/i;

export function isPercentKey(key: string): boolean {
  return PERCENT.test(key);
}

export function formatMoney(value: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString('en-IN')}`;
  }
}

export function formatValue(key: string, value: unknown, currency = 'INR'): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—';
    if (PERCENT.test(key)) return `${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
    if (MONEY.test(key) && !COUNT.test(key)) return formatMoney(value, currency);
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function isScalar(value: unknown): boolean {
  return value == null || ['string', 'number', 'boolean'].includes(typeof value);
}

export function titleCase(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
