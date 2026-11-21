// RTA by KARM — High-Craft Indian Financial & Operational Formatters (UK English)

/**
 * Formats a numeric value into the Indian Rupee numbering system (Lakhs and Crores)
 * e.g. 1250000 -> ₹12,50,000
 * e.g. 4500000 with compact -> ₹45.00 L
 * e.g. 12500000 with compact -> ₹1.25 Cr
 */
export function formatRupees(amount: number, compact: boolean = false): string {
  if (isNaN(amount)) return '₹0';

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 10000000) {
      return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      return `${sign}₹${(abs / 100000).toFixed(2)} L`;
    }
    if (abs >= 1000) {
      return `${sign}₹${(abs / 1000).toFixed(1)} k`;
    }
    return `${sign}₹${abs.toLocaleString('en-IN')}`;
  }

  // Standard Indian comma grouping: 3 digits, then groups of 2 digits
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Deconstructs an amount into Lakhs / Crores unit pair for typographic display
 */
export function formatLakhsCrores(amount: number): { value: string; unit: string; full: string } {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return {
      value: `${sign}${(abs / 10000000).toFixed(2)}`,
      unit: 'Crore',
      full: `${sign}₹${(abs / 10000000).toFixed(2)} Cr`
    };
  }
  if (abs >= 100000) {
    return {
      value: `${sign}${(abs / 100000).toFixed(2)}`,
      unit: 'Lakh',
      full: `${sign}₹${(abs / 100000).toFixed(2)} L`
    };
  }
  return {
    value: `${sign}${abs.toLocaleString('en-IN')}`,
    unit: 'INR',
    full: `${sign}₹${abs.toLocaleString('en-IN')}`
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
 */
export function formatPercent(value: number, decimals: number = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}
