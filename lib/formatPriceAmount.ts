/**
 * Display amounts as plain numbers (zh-CN grouping), no currency symbol or code.
 * Product UX treats amounts as RMB; stored `Item.currency` is unchanged by this helper.
 */
export function formatPriceAmount(value: number): string {
  return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}
