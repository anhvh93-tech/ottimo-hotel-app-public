/**
 * 0.3.13 V5-18 (FB-R4-SEC-FE-HOLDS-03) + bổ sung 1 (BE C0313-13) – the part of `depositPaidVnd` still waiting for the
 * desk / bank check: Σ succeeded `deposit` receipts, not reversal rows, `reconciliation = pending`, capped by
 * `depositPaidVnd` (never more than the deposit still held after a partial refund). The ONE query behind
 * `Reservation.depositUnverifiedVnd` (FD+) and the audit `reservation.deposit_confirmed` `after.unverifiedPaidVnd`.
 */
import type { Tx } from '../../../db/database';

export async function depositUnverifiedVnd(
  tx: Tx,
  folioId: string,
  depositPaidVnd: number,
): Promise<number> {
  const { rows } = await tx.query<{ v: string | number }>(
    `SELECT COALESCE(SUM(amount_vnd), 0) AS v FROM payment
      WHERE folio_id = $1 AND type = 'deposit' AND status = 'succeeded' AND reversal_of_id IS NULL
        AND reconciliation = 'pending'`,
    [folioId],
  );
  return Math.max(0, Math.min(depositPaidVnd, Number(rows[0]?.v ?? 0)));
}
