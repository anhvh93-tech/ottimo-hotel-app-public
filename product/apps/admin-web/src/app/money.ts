/** Parse a VND amount typed with separators ("11.500.000", "11 500 000") into an integer (V-07, BR-004). */
export function parseVnd(input: string): number | null {
  const digits = input.replace(/vnd/gi, '').replace(/[\s.,_đ]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}

/** BR-005: list prices are whole thousands of VND. */
export function isVndStep(amount: number, step = 1000): boolean {
  return Number.isSafeInteger(amount) && amount % step === 0;
}

/**
 * Monthly price spread over 30 days (BR-102 convention), rounded to 1.000 – used ONLY as the
 * soft "nightly looks low" reference on the room drawer. The nightly list price is never derived
 * from the monthly one (FB-INV-005, BR-101 v0.4.7).
 */
export function perDayOfMonthly(monthly: number, step = 1000): number {
  return Math.round(monthly / 30 / step) * step;
}
