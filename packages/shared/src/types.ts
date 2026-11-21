/**
 * ZohoMoney: Branded type representing monetary values verbatim from Zoho Books.
 * Never constructed directly; only created by the proxy response mapper.
 */
declare const __brand: unique symbol;

export type ZohoMoney = string & { readonly [__brand]: 'ZohoMoney' };

export function createZohoMoney(raw: string): ZohoMoney {
  return raw as ZohoMoney;
}
