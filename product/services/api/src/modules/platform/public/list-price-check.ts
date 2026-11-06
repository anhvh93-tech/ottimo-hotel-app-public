/**
 * V5-1A (OpenAPI 0.3.13 addendum 1, SEC ARC-12; DOM BR-101 (4) v0.5.13 – addendum 1d): the soft check of the two prices
 * of one list price row, shared by `createRoom`, `updateRoom` and the room catalogue import. Warns, never blocks.
 */
/** BR-101 (4) bounds (v0.5.13, contract 0.3.13 addendum 1d): constants, not parameters. */
const NIGHTS_LOWER = 30n;
const NIGHTS_UPPER = 5n;

/**
 * BR-101 (4), OpenAPI 0.3.13 addendum 1 (V5-1A): the nightly price of a list price row is unusual next to the
 * monthly price of the SAME row when nightly × 30 < monthly (below monthly ÷ 30) or nightly × 5 > monthly (above
 * monthly ÷ 5). Integer comparison, no division (BigInt: a MoneyVnd may be up to MAX_SAFE_INTEGER, × 30 is not
 * safe); exactly on a bound → not unusual. Never blocks the write – the caller only adds the warning.
 */
export function nightlyPriceUnusual(nightlyVnd: number, monthlyVnd: number): boolean {
  if (!Number.isSafeInteger(nightlyVnd) || !Number.isSafeInteger(monthlyVnd)) {
    throw new RangeError('nightlyPriceUnusual needs safe integers');
  }
  const n = BigInt(nightlyVnd);
  const m = BigInt(monthlyVnd);
  return n * NIGHTS_LOWER < m || n * NIGHTS_UPPER > m;
}
