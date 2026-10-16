/**
 * VND rounding (BR-005, coding-standards 4.2): nearest multiple of `unit`, the midpoint rounds UP in
 * absolute value (712.500 → 713.000; −712.500 → −713.000). Integer arithmetic only.
 * TODO(BE-B → ARC): move to packages/contracts/src/money.ts (coding-standards 1.1) when that file exists;
 * this copy keeps the api independent until then.
 */
export function roundVnd(amount: number, unit: number): number {
  if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(unit) || unit <= 0) {
    throw new RangeError('roundVnd needs safe integers and a positive unit');
  }
  const sign = amount < 0 ? -1 : 1;
  const abs = Math.abs(amount);
  const q = Math.floor(abs / unit);
  const r = abs - q * unit;
  const rounded = (r * 2 >= unit ? q + 1 : q) * unit;
  return sign * rounded;
}

/**
 * `numerator / divisor` rounded to `unit` (BR-101: nightly list price = monthly ÷ 12 → 1.000).
 * Exact for integers: compares 2·remainder with the divisor·unit instead of using floats.
 */
export function divideRoundVnd(numerator: number, divisor: number, unit: number): number {
  if (
    !Number.isSafeInteger(numerator) ||
    !Number.isSafeInteger(divisor) ||
    divisor <= 0 ||
    !Number.isSafeInteger(unit) ||
    unit <= 0
  ) {
    throw new RangeError('divideRoundVnd needs safe integers and positive divisor/unit');
  }
  const sign = numerator < 0 ? -1 : 1;
  const abs = Math.abs(numerator);
  const step = divisor * unit; // abs / divisor rounded to unit == round(abs / step) * unit
  const q = Math.floor(abs / step);
  const r = abs - q * step;
  return sign * (r * 2 >= step ? q + 1 : q) * unit;
}
