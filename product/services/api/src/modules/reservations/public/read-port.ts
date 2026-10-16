/**
 * ReservationReadPort (FB-R2-ARC-BE-S3-16): the booking facts other modules READ – ownership, stay info, the
 * stay view – with NO service dependency (only the transaction), so a module low in the graph (files'
 * AttachmentService, payments) can take it in its constructor without the provider cycle
 * PaymentService → AttachmentService → ReservationSalesAdapter → ReservationsService → MoneyBridge →
 * PaymentService. RESERVATION_SALES_PORT keeps the same reads (it delegates here) for existing callers.
 */
import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { Actor } from '../internal/reservation-store';
import type { ReservationOwnership, StayInfo } from './sales-port';
import { type StayViewRow, stayView, stayViews } from './stay-view';

export async function readStayInfo(tx: Tx, reservationId: string): Promise<StayInfo | null> {
  const { rows } = await tx.query<{
    id: string;
    code: string;
    status: string;
    stay_type: 'short' | 'long';
    channel_group: string;
    payment_model: string;
    folio_id: string | null;
    parent_reservation_id: string | null;
    arrival_date: string;
    departure_date: string;
    room_id: string | null;
    room_no: string | null;
    adults: number;
    children_6_11: number;
    children_under_6: number;
    external_contract: boolean;
  }>(
    `SELECT r.id, r.code, r.status, r.stay_type, c.channel_group, r.payment_model, r.folio_id,
            r.parent_reservation_id, r.arrival_date::text AS arrival_date,
            r.departure_date::text AS departure_date, s.room_id, rm.room_no, r.adults, r.children_6_11,
            r.children_under_6, r.external_contract
       FROM reservation r JOIN channel c ON c.id = r.channel_id
       LEFT JOIN LATERAL (SELECT room_id FROM reservation_segment
                           WHERE reservation_id = r.id AND active ORDER BY from_date DESC LIMIT 1) s ON true
       LEFT JOIN room rm ON rm.id = s.room_id
      WHERE r.id = $1`,
    [reservationId],
  );
  const v = rows[0];
  if (!v) return null;
  return {
    id: v.id,
    code: v.code,
    status: v.status,
    stayType: v.stay_type,
    channelGroup: v.channel_group,
    paymentModel: v.payment_model,
    folioId: v.folio_id,
    parentReservationId: v.parent_reservation_id,
    arrivalDate: v.arrival_date,
    departureDate: v.departure_date,
    roomId: v.room_id,
    roomNo: v.room_no,
    adults: v.adults,
    children6to11: v.children_6_11,
    childrenUnder6: v.children_under_6,
    externalContract: v.external_contract,
  };
}

export async function readOwnership(
  tx: Tx,
  reservationId: string,
): Promise<ReservationOwnership | null> {
  const { rows } = await tx.query<{
    id: string;
    code: string;
    status: string;
    created_by: string | null;
    closer_user_id: string | null;
  }>('SELECT id, code, status, created_by, closer_user_id FROM reservation WHERE id = $1', [
    reservationId,
  ]);
  const r = rows[0];
  return r
    ? {
        id: r.id,
        code: r.code,
        status: r.status,
        createdBy: r.created_by,
        closerUserId: r.closer_user_id,
      }
    : null;
}

@Injectable()
export class ReservationReadPort {
  ownership(tx: Tx, reservationId: string): Promise<ReservationOwnership | null> {
    return readOwnership(tx, reservationId);
  }

  /** Booking facts without personal data (folio, payments – ARC-BE-S3-24.5: no actor needed, SEC H2 ok). */
  stayInfo(tx: Tx, reservationId: string): Promise<StayInfo | null> {
    return readStayInfo(tx, reservationId);
  }

  /** Stay view read with the caller's actor (SEC H2 – SAL/CTV own scope). */
  stayView(tx: Tx, reservationId: string, actor: Actor): Promise<StayViewRow | null> {
    return stayView(tx, reservationId, actor);
  }

  stayViews(tx: Tx, ids: readonly string[], actor: Actor): Promise<Map<string, StayViewRow>> {
    return stayViews(tx, ids, actor);
  }
}
