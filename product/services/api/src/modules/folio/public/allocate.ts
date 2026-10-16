/**
 * Integer allocation (coding-standards 4.4, erd 8, DATA FB-01): split `total` VND over parts in proportion
 * to `weights`, whole VND per part, the remainder on the LAST part – Σ parts = total, always.
 * Used for channel fee, commissions and whole-booking discounts over the room nights.
 */
export function allocate(total: number, weights: readonly number[]): number[] {
  if (!Number.isSafeInteger(total)) throw new RangeError('allocate: total must be a safe integer');
  if (weights.length === 0) {
    if (total !== 0) throw new RangeError('allocate: no parts for a non-zero total');
    return [];
  }
  if (weights.some((w) => !Number.isSafeInteger(w) || w < 0)) {
    throw new RangeError('allocate: weights must be non-negative safe integers');
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  const out = new Array<number>(weights.length).fill(0);
  if (sum === 0) {
    // No revenue to weigh by (complimentary nights): everything on the last part.
    out[weights.length - 1] = total;
    return out;
  }
  let used = 0;
  for (let i = 0; i < weights.length - 1; i++) {
    // floor(total × w / sum) with BigInt: total × w may exceed 2^53 for long stays.
    const share = Number((BigInt(total) * BigInt(weights[i] as number)) / BigInt(sum));
    out[i] = share;
    used += share;
  }
  out[weights.length - 1] = total - used;
  return out;
}
