/**
 * Room changes of a booking as recorded in `reservation_change` (field `room`: B7/B8, B7a, K12 swap, B12 restore –
 * the whole booking moves). S4-38 (S438-REGR-02/-03): a booking moved before 0059, or by a path that did not store
 * `reservation.origin_room_id` / `stay_night.extra_person_base`, gets them back from this history:
 * - origin room (BR-424 v0.3.8): the first room ever assigned = the OLD room of the earliest change that left a
 *   room;
 * - protected BR-110 base (BR-429 (b2)): max(base of the rooms the booking left by OTTIMO moves since the last
 *   guest-requested move, base of the room now) – a guest request drops the protection.
 * The values are room numbers (older B12 rows wrote the room id – both are resolved).
 */
import type { Tx } from '../../../db/database';

export interface RoomChange {
  oldRoomId: string | null;
  newRoomId: string | null;
  oldBase: number | null;
  newBase: number | null;
  guestRequest: boolean;
}

export async function roomChangeHistory(tx: Tx, reservationId: string): Promise<RoomChange[]> {
  const { rows } = await tx.query<{
    old_id: string | null;
    new_id: string | null;
    old_base: number | null;
    new_base: number | null;
    reason: string | null;
  }>(
    `SELECT o.id AS old_id, n.id AS new_id, o.base_occupancy AS old_base, n.base_occupancy AS new_base, c.reason
       FROM reservation_change c
       LEFT JOIN room o ON (o.room_no = c.old_value OR o.id::text = c.old_value)
       LEFT JOIN room n ON (n.room_no = c.new_value OR n.id::text = c.new_value)
      WHERE c.reservation_id = $1 AND c.field = 'room'
      ORDER BY c.changed_at, c.id`,
    [reservationId],
  );
  return rows.map((r) => ({
    oldRoomId: r.old_id,
    newRoomId: r.new_id,
    oldBase: r.old_base,
    newBase: r.new_base,
    guestRequest: r.reason === 'guest_request',
  }));
}

/**
 * The first room ever assigned: the OLD room of the earliest change that left a room (null = none recorded – a
 * first assignment from the unassigned lane keeps the planner's own rule: requested / upgraded room).
 */
export function firstRoomOf(history: readonly RoomChange[]): string | null {
  return history.find((c) => c.oldRoomId !== null)?.oldRoomId ?? null;
}

/**
 * BR-417-07 / BR-429 (b1) v0.3.8 bổ sung 18/10 (BUG-R2-134): the room the guest BOUGHT – the room of the last
 * guest-requested move, else the booking's origin room (stored, else the first room of the history). null = the
 * booking never changed room (it is in the room it bought).
 */
export function boughtRoomOf(
  history: readonly RoomChange[],
  originRoomId: string | null,
): string | null {
  let bought: string | null = null;
  for (const c of history) if (c.guestRequest && c.newRoomId) bought = c.newRoomId;
  return bought ?? originRoomId ?? firstRoomOf(history);
}

/** Protected base kept by OTTIMO moves since the last guest-requested move (null = none). */
export function protectedBaseOf(history: readonly RoomChange[]): number | null {
  let base: number | null = null;
  for (const c of history) {
    if (c.guestRequest) {
      base = null;
      continue;
    }
    for (const b of [c.oldBase, c.newBase]) {
      if (b !== null && (base === null || b > base)) base = b;
    }
  }
  return base;
}
