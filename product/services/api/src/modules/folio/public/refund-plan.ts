/**
 * DOM-S4-14 (BR-522 v0.3.8) – pure: which refund requests a cancellation / no-show leaves (FolioService
 * closeStayPreview / closeStayCredit). No I/O.
 */

/** An open refund request of a folio's bookings: pending / escalated / approved and not paid in full. */
export interface OpenRefund {
  id: string;
  status: string;
  remainingVnd: number;
}

/**
 * DOM-S4-14 (BR-522 v0.3.8) – the refund requests a cancellation / no-show leaves for the overpayment `excessVnd`
 * (after the fee and the reversals; never OTA money). The amount of an open request never changes (SM-10):
 * - open total < excess → one supplementary request for the shortfall;
 * - open total > excess → every PENDING (pending / escalated) request is auto-cancelled and one request of the
 *   right amount is made again (excess − what approved requests still owe; each payout stays ≤ the credit then).
 */
export function refundPlan(
  excessVnd: number,
  open: readonly OpenRefund[],
): { cancelIds: string[]; createVnd: number } {
  const excess = Math.max(0, excessVnd);
  const total = open.reduce((a, r) => a + r.remainingVnd, 0);
  if (total <= excess) return { cancelIds: [], createVnd: excess - total };
  const pending = open.filter((r) => r.status === 'pending' || r.status === 'escalated');
  const approvedLeft = total - pending.reduce((a, r) => a + r.remainingVnd, 0);
  return { cancelIds: pending.map((r) => r.id), createVnd: Math.max(0, excess - approvedLeft) };
}
