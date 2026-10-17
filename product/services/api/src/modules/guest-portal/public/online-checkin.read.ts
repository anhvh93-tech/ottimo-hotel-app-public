/**
 * Read side of `online_checkin` for the registration module (ARC FB-R2-ARC-BE-S3-15 (f)): the Desk summary
 * of US-107 (Registration.onlineCheckin), and the one write the registration module needs (S4-39 slot shift).
 * Only the guest-portal module reads or writes the table itself.
 */
import type { Tx } from '../../../db/database';

export interface OnlineCheckinSummaryRow {
  completedAt: Date | null;
  etaTime: string | null;
  lateArrival: boolean;
  /** C2, D23 – Desk (FD+) only; the serializer removes it for any other role. */
  arrivalNote: string | null;
  deferredPeople: number[];
}

export async function onlineCheckinSummary(
  tx: Tx,
  reservationId: string,
): Promise<OnlineCheckinSummaryRow | null> {
  const { rows } = await tx.query<{
    completed_at: Date | null;
    eta_time: string | null;
    late_arrival: boolean;
    arrival_note: string | null;
    deferred_people: number[] | null;
  }>(
    `SELECT completed_at, to_char(eta_time, 'HH24:MI') AS eta_time, late_arrival, arrival_note, deferred_people
       FROM online_checkin WHERE reservation_id = $1`,
    [reservationId],
  );
  const r = rows[0];
  return r
    ? {
        completedAt: r.completed_at,
        etaTime: r.eta_time,
        lateArrival: r.late_arrival,
        arrivalNote: r.arrival_note,
        deferredPeople: r.deferred_people ?? [],
      }
    : null;
}

/**
 * S4-39 (SEC-BE-53 main approach): the desk said guest-link slot `removedSlot` ("Khách n") was the removed
 * person's – the slots behind it move down by one, so the guest's "add at reception" choices follow their
 * person (n is dropped, n+1 → n, …). Same transaction as the removal; no-op without an online check-in row.
 */
export async function shiftDeferredPeople(
  tx: Tx,
  reservationId: string,
  removedSlot: number,
): Promise<void> {
  await tx.query(
    `UPDATE online_checkin
        SET deferred_people = ARRAY(
              SELECT (CASE WHEN p > $2 THEN p - 1 ELSE p END)::smallint
                FROM unnest(deferred_people) AS p WHERE p <> $2 ORDER BY 1)
      WHERE reservation_id = $1 AND deferred_people IS NOT NULL AND cardinality(deferred_people) > 0`,
    [reservationId, removedSlot],
  );
}
