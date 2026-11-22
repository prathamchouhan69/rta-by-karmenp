// RTA by KARM — High-Craft Indian Financial & Operational Formatters (UK English)
// MONEY LAW: All inputs are Zoho verbatim strings. No parseFloat, no Number(), no arithmetic.

import { 
  cleanMoneyString, 
  groupIndian, 
  formatCompactCr, 
  formatCompactL, 
  formatCompactK 
} from './formatters-helpers';

/**
 * Formats a Zoho verbatim money string into the Indian Rupee numbering system (Lakhs and Crores)
 * e.g. "1250000" -> "₹12,50,000"
 * e.g. "4500000" with compact -> "₹45.00 L"
 * e.g. "12500000" with compact -> "₹1.25 Cr"
 */
export function formatRupees(amount: string | number, compact: boolean = false): string {
  const amountStr = typeof amount === 'number' ? String(amount) : amount;
  const cleaned = cleanMoneyString(amount);
  if (!cleaned) return '₹0';

  const sign = cleaned.startsWith('-') ? '-' : '';
  const abs = cleaned.replace(/^-/, '');

  if (compact) {
    if (abs.length >= 9) { // >= 10,000,000 (1 Crore)
      return `${sign}₹${formatCompactCr(abs)} Cr`;
    }
    if (abs.length >= 6) { // >= 100,000 (1 Lakh)
      return `${sign}₹${formatCompactL(abs)} L`;
    }
    if (abs.length >= 4) { // >= 1,000
      return `${sign}₹${formatCompactK(abs)} k`;
    }
    return `${sign}₹${groupIndian(abs)}`;
  }

  return `₹${groupIndian(abs)}`;
}

/**
 * Deconstructs a Zoho verbatim money string into Lakhs / Crores unit pair for typographic display
 */
export function formatLakhsCrores(amount: string | number): { value: string; unit: string; full: string } {
  const amountStr = typeof amount === 'number' ? String(amount) : amount;
  const cleaned = cleanMoneyString(amount);
  if (!cleaned) return { value: '0', unit: 'INR', full: '₹0' };

  const sign = cleaned.startsWith('-') ? '-' : '';
  const abs = cleaned.replace(/^-/, '');

  if (abs.length >= 9) { // >= 1 Crore
    return {
      value: `${sign}${formatCompactCr(abs)}`,
      unit: 'Crore',
      full: `${sign}₹${formatCompactCr(abs)} Cr`
    };
  }
  if (abs.length >= 6) { // >= 1 Lakh
    return {
      value: `${sign}${formatCompactL(abs)}`,
      unit: 'Lakh',
      full: `${sign}₹${formatCompactL(abs)} L`
    };
  }
  return {
    value: `${sign}${groupIndian(abs)}`,
    unit: 'INR',
    full: `${sign}₹${groupIndian(abs)}`
  };
}

/**
 * Formats dates in standard UK English (e.g. "15 Nov 2026")
 */
export function formatDateUK(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats timestamps in UK English with 24h clock (e.g. "20 Nov 2026, 14:30")
 */
export function formatTimestampUK(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return dateStr || '';
  const dateFormatted = formatDateUK(d.toISOString());
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${dateFormatted}, ${hours}:${minutes}`;
}

/**
 * Formats percentages with tabular precision
 * Input is a string representing the percentage value (e.g. "12.5" for 12.5%)
 */
export function formatPercent(value: string | number, decimals: number = 1): string {
  const valueStr = typeof value === 'number' ? String(value) : value;
  const cleaned = cleanMoneyString(valueStr);
  if (!cleaned) return '0%';
  const sign = valueStr.startsWith('-') ? '-' : (valueStr.startsWith('+') ? '+' : '+');
  const abs = valueStr.replace(/^[+-]/, '');
  const parts = abs.split('.');
  const intPart = parts[0] || '0';
  const decPart = parts[1] || '';
  const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals);
  return `${sign}${intPart}.${paddedDec}%`;
}