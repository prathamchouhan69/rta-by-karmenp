// The law: a number on a KARM screen came from Zoho Books, exactly as Zoho sent it. JSON numbers lose their
// original text (450.00 becomes 450), so figures are turned into strings before parsing.
const KEYS = ['total', 'sub_total', 'balance', 'tax_total', 'adjustment', 'rate', 'amount', 'bcy_total', 'bcy_balance', 'bcy_sub_total', 'bcy_rate', 'item_total', 'discount', 'discount_amount', 'tax_amount', 'tax_percentage', 'payment_made', 'credits_applied', 'write_off_amount', 'shipping_charge', 'quantity', 'outstanding_receivable_amount', 'outstanding_payable_amount', 'unused_credits_receivable_amount'];
const RE = new RegExp(`"(${KEYS.join('|')})"\\s*:\\s*(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)(?=\\s*[,}\\]])`, 'g');
export const parseZohoJson = (text) => JSON.parse(String(text).replace(RE, '"$1":"$2"'));
export const MONEY_KEYS = KEYS;
