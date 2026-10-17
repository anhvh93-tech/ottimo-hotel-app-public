/**
 * The room of a booking as the guest app needs it (BR-012 (1), (4), (5); OpenAPI 0.3.7 bổ sung D1
 * `GuestStay`/`GuestSession.roomName` + `publicRoomType`, `GuestRequest.roomNo`/`roomName`) – BE-D Sprint 4,
 * read-only port of the reservations module (ARC s3-contract 4.3: guest-portal never reads the reservation
 * tables itself). BE-A review.
 *
 * Room = the booking's latest active segment (the current room in house – a guest moved by B7/B14 sees the new
 * name). For the GUEST: `guestRoomName` only when the guest was told the concrete room
 * (`reservation.room_disclosed_to_guest`, BR-012 (4)) – otherwise the guest page shows `publicRoomType`; the
 * room NUMBER is never part of what the guest sees (`roomNo` here is for staff screens only).
 */
import type { Tx } from '../../../db/database';

export interface GuestRoomView {
  roomId: string | null;
  /** Staff only (BR-012 (2) "401 · The Pine"). */
  roomNo: string | null;
  /** Staff only: the room's name whatever the disclosure flag. */
  roomName: string | null;
  /** Guest-facing name: null while the room is not disclosed / not named / unassigned. */
  guestRoomName: string | null;
  publicRoomType: string | null;
}

export async function guestRoomView(tx: Tx, reservationId: string): Promise<GuestRoomView | null> {
  const { rows } = await tx.query<{
    room_id: string | null;
    room_no: string | null;
    name: string | null;
    public_room_type: string | null;
    disclosed: boolean;
  }>(
    `SELECT seg.room_id, rm.room_no, rm.name, rm.public_room_type,
            r.room_disclosed_to_guest AS disclosed
       FROM reservation r
       LEFT JOIN LATERAL (SELECT s.room_id FROM reservation_segment s
                           WHERE s.reservation_id = r.id AND s.active
                           ORDER BY s.from_date DESC LIMIT 1) seg ON true
       LEFT JOIN room rm ON rm.id = seg.room_id
      WHERE r.id = $1`,
    [reservationId],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    roomId: r.room_id,
    roomNo: r.room_no,
    roomName: r.name,
    guestRoomName: r.disclosed && r.name ? r.name : null,
    publicRoomType: r.public_room_type,
  };
}
