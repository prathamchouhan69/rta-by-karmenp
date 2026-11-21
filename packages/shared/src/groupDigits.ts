// Digit grouping in Indian numbering system by string slicing only.
// Zero float arithmetic, zero Number(), zero Intl.
export function groupDigits(rawInput: string): string {
  const str = String(rawInput || '').trim();
  if (!str) return '';

  const isNegative = str.startsWith('-');
  const unsigned = isNegative ? str.slice(1) : str;

  const dotIdx = unsigned.indexOf('.');
  const integerPart = dotIdx === -1 ? unsigned : unsigned.slice(0, dotIdx);
  const fractionPart = dotIdx === -1 ? '' : unsigned.slice(dotIdx);

  if (integerPart.length <= 3) {
    return (isNegative ? '-' : '') + integerPart + fractionPart;
  }

  // Last 3 digits
  const lastThree = integerPart.slice(-3);
  let remaining = integerPart.slice(0, -3);
  const chunks: string[] = [];

  while (remaining.length > 2) {
    chunks.unshift(remaining.slice(-2));
    remaining = remaining.slice(0, -2);
  }
  if (remaining.length > 0) {
    chunks.unshift(remaining);
  }

  const groupedInteger = chunks.join(',') + ',' + lastThree;
  return (isNegative ? '-' : '') + groupedInteger + fractionPart;
}
