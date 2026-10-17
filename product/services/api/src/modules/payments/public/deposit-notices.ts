/**
 * OpenAPI 0.3.7 bổ sung 1 (ARC 11.3 (2); FE-B s4 mục 5 – BUG-R2-081, US-086 AC4): `Reservation.depositNotices[]` – the
 * "khách đã chuyển cọc" notices of a booking (`createDepositNotice`, A53), newest first. The table belongs to the
 * payments module, so reservations reads it through `ReservationHooks.provideDepositNotices(reader)` (same pattern
 * as `provideRegistrationSummary` – no import cycle). Visibility is the serializer's job: the array is FD+ / SAL /
 * CTV (own bookings by the `getReservation` scope), `note` (D12c) and `createdByName` (D27) FD+ only.
 * Read-only, in the caller's transaction (RLS: property of the context).
 */
import type { Tx } from '../../../db/database';
import { toZonedIso } from '../../../shared/time';

export interface DepositNoticeDto {
  id: string;
  /** What the sale/CTV declared (latest report) – not money received yet (that is depositPaidVnd after B4). */
  amountVnd: number;
  note: string | null;
  attachmentId: string | null;
  createdAt: string;
  /** Latest report / update (= createdAt when never re-reported) – the time the desk shows. */
  updatedAt: string;
  createdByName?: string;
  status: 'open' | 'handled';
}

export type DepositNoticesReader = (tx: Tx, reservationId: string) => Promise<DepositNoticeDto[]>;

export const readDepositNotices: DepositNoticesReader = async (tx, reservationId) => {
  const { rows } = await tx.query<{
    id: string;
    amount_vnd: string | number;
    note: string | null;
    attachment_id: string | null;
    created_at: Date;
    updated_at: Date | null;
    created_by_name: string | null;
    status: 'open' | 'handled';
    timezone: string;
  }>(
    `SELECT n.id, n.amount_vnd, n.note, n.attachment_id, n.created_at, n.updated_at, n.status,
            u.display_name AS created_by_name, p.timezone
       FROM deposit_notice n
       JOIN property p ON p.id = n.property_id
       LEFT JOIN app_user u ON u.id = n.created_by
      WHERE n.reservation_id = $1
      ORDER BY n.created_at DESC, n.id DESC`,
    [reservationId],
  );
  return rows.map((r) => ({
    id: r.id,
    amountVnd: Number(r.amount_vnd),
    note: r.note,
    attachmentId: r.attachment_id,
    createdAt: toZonedIso(r.created_at, r.timezone),
    updatedAt: toZonedIso(r.updated_at ?? r.created_at, r.timezone),
    ...(r.created_by_name ? { createdByName: r.created_by_name } : {}),
    status: r.status,
  }));
};
