/** Parse a VND amount typed with separators ("11.500.000", "11 500 000") into an integer (V-07, BR-004). */
export function parseVnd(input: string): number | null {
  const digits = input.replace(/vnd/gi, '').replace(/[\s.,_đ]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}

/** BR-101 + BR-005: nightly list price = monthly ÷ divisor, rounded to `step` VND (half up). */
export function nightlyFromMonthly(monthly: number, divisor = 12, step = 1000): number {
  return Math.round(monthly / divisor / step) * step;
}
