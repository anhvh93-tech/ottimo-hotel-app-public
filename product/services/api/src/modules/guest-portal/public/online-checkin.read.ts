/**
 * Read side of `online_checkin` for the registration module (ARC FB-R2-ARC-BE-S3-15 (f)): the Desk summary
 * of US-107 (Registration.onlineCheckin). Only the guest-portal module reads or writes the table itself.
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
