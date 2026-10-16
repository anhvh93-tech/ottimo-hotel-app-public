/**
 * Registration facts the booking shows (BE-A, Sprint 3 testing fix BUG-R2-031): OpenAPI 0.3.6
 * `Reservation.registrationId/registrationStatus/registrationDeadlineAt`, read through
 * `ReservationHooks.provideRegistrationSummary` (registered by RegistrationModule) – the reservations module
 * never reads the `registration` table itself.
 */
import type { Tx } from '../../../db/database';

export async function registrationSummary(
  tx: Tx,
  reservationId: string,
): Promise<{ id: string; status: string; deadlineAt: Date | null } | null> {
  const { rows } = await tx.query<{ id: string; status: string; deadline_at: Date | null }>(
    'SELECT id, status, deadline_at FROM registration WHERE reservation_id = $1',
    [reservationId],
  );
  const r = rows[0];
  return r ? { id: r.id, status: r.status, deadlineAt: r.deadline_at } : null;
}
