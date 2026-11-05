export type ZohoMoney = string & { readonly __brand: 'ZohoMoney' };

export const asZohoMoney = (raw: string): ZohoMoney => raw as ZohoMoney;

export function formatIndianGrouping(rawDecimalText: string): string {
  const sign = rawDecimalText.startsWith('-') ? '-' : '';
  const unsigned = sign.length > 0 ? rawDecimalText.slice(1) : rawDecimalText;
  const [whole = '0', fraction] = unsigned.split('.');
  const normalised = whole.replace(/^0+(?=\d)/, '');
  const lastThree = normalised.slice(-3);
  const leading = normalised.slice(0, -3);
  const groupedLeading = leading.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = groupedLeading ? `${groupedLeading},${lastThree}` : lastThree;
  return `${sign}${grouped}${fraction === undefined ? '' : `.${fraction}`}`;
}

export type PracticeStatus = 'draft' | 'sent' | 'overdue' | 'paid';
export interface MoneyText { value: ZohoMoney; formatted: string; }
export interface InvoiceSummary {
  id: string; number: string; customer: string; status: PracticeStatus;
  date: string; dueDate: string; balance: MoneyText; total: MoneyText; daysOverdue?: number;
}
export interface Contact { id: string; name: string; kind: 'customer' | 'vendor'; outstanding: MoneyText; }
export interface Item { id: string; name: string; hsn: string; unit: string; rate: MoneyText; }

export const API_VERSION = 'v1';
