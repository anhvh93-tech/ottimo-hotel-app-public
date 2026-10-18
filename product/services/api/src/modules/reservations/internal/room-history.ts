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
  changedAt: Date;
}

export async function roomChangeHistory(tx: Tx, reservationId: string): Promise<RoomChange[]> {
  const { rows } = await tx.query<{
    old_id: string | null;
    new_id: string | null;
    old_base: number | null;
    new_base: number | null;
    reason: string | null;
    changed_at: Date;
  }>(
    `SELECT o.id AS old_id, n.id AS new_id, o.base_occupancy AS old_base, n.base_occupancy AS new_base, c.reason,
            c.changed_at
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
    changedAt: r.changed_at,
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
 * BR-417 appendix 5A step 1 (DOM 18/10, vòng sửa 5 – BUG-R2-160; replaces BUG-R2-134/145 "null unless an OTTIMO move
 * follows the guest's last own move"): the room the guest BOUGHT (CKM) after `history` – the origin room (BR-424:
 * the first room assigned; a first assignment from the unassigned lane is not a move), then:
 * - a change counts only when the room differs (same room again – dates, price – is not one; to the lane is one);
 * - a guest request (`guest_request`, B7/B8/B14) → the new room; to the lane → the room assigned next;
 * - any OTTIMO change (fault, overbooking, upgrade, swap K12, B7a re-assignment, B12 restore…) → unchanged: a room
 *   OTTIMO chose never becomes the room bought.
 * The S4-09 move "until the primary departure" is in the primary's history only – the nights from the return day
 * (the children's) read the history through `stayRoomHistory`, so they keep the room bought before it.
 * null = no room known (never assigned): the caller takes the room of the added night.
 */
export function boughtRoomOf(
  history: readonly RoomChange[],
  originRoomId: string | null,
): string | null {
  let bought: string | null = originRoomId;
  let guestToLane = false;
  for (const c of history) {
    if (c.oldRoomId === c.newRoomId) continue;
    if (bought === null && c.oldRoomId !== null) bought = c.oldRoomId;
    if (c.guestRequest) {
      if (c.newRoomId !== null) bought = c.newRoomId;
      guestToLane = c.newRoomId === null;
    } else if (c.oldRoomId === null && c.newRoomId !== null) {
      // An assignment from the unassigned lane: the first one is the origin; after a guest request, their room.
      if (guestToLane || bought === null) bought = c.newRoomId;
      guestToLane = false;
    }
  }
  return bought;
}

/**
 * Appendix 5A step 1 – "the history of the whole stay" as the booking holding a night sees it: a primary its own
 * room changes; a child booking (B13 extension / B9a night of an OTA stay, BR-422) continues the booking next to
 * it – that booking's view up to the child's creation, then the child's own changes. A B14 of the whole stay is
 * recorded on every booking it moves; an S4-09 move "until the primary departure" on the primary only, so the
 * children (the nights from the return day) keep the room bought before it (AN-09…AN-12). `originRoomId` = the
 * stay's origin (the primary's stored origin, else the first room of its history).
 */
export async function stayRoomHistory(
  tx: Tx,
  reservationId: string,
): Promise<{ history: RoomChange[]; originRoomId: string | null }> {
  const { rows } = await tx.query<{
    id: string;
    parent_id: string | null;
    arrival: string;
    departure: string;
    created_at: Date;
    origin_room_id: string | null;
  }>(
    `SELECT r.id, r.parent_reservation_id AS parent_id, r.arrival_date::text AS arrival,
            r.departure_date::text AS departure, r.created_at, r.origin_room_id
       FROM reservation r
      WHERE r.id = (SELECT COALESCE(x.parent_reservation_id, x.id) FROM reservation x WHERE x.id = $1)
         OR r.parent_reservation_id = (SELECT COALESCE(x.parent_reservation_id, x.id) FROM reservation x WHERE x.id = $1)`,
    [reservationId],
  );
  const byId = new Map(rows.map((r) => [r.id, r]));
  const primary = rows.find((r) => r.parent_id === null);
  const own = new Map<string, RoomChange[]>();
  const historyOf = async (id: string) => {
    let h = own.get(id);
    if (!h) {
      h = await roomChangeHistory(tx, id);
      own.set(id, h);
    }
    return h;
  };
  const view = async (id: string, depth: number): Promise<RoomChange[]> => {
    const me = byId.get(id);
    const mine = await historyOf(id);
    if (!me || me.parent_id === null || depth > rows.length) return mine;
    // The booking this child continues: the one it follows (B13), else the one it precedes (B9a), else the primary.
    const others = rows.filter((r) => r.id !== id && r.created_at <= me.created_at);
    const before =
      others.find((r) => r.departure === me.arrival) ??
      others.find((r) => r.arrival === me.departure) ??
      primary;
    if (!before) return mine;
    const inherited = (await view(before.id, depth + 1)).filter((c) => c.changedAt < me.created_at);
    return [...inherited, ...mine];
  };
  const history = await view(reservationId, 0);
  const root = primary ?? byId.get(reservationId);
  const originRoomId =
    root?.origin_room_id ??
    (root
      ? ((await upgradedFromRoom(tx, root.id)) ?? firstRoomOf(await historyOf(root.id)))
      : null);
  return { history, originRoomId };
}

/**
 * BUG-R2-133: the room an OTA conflict booking was booked in when OTTIMO settled it with an upgrade (B7a
 * `upgraded`) – its origin (BR-424) when the booking stored none (rows before 0059). null = not such a booking.
 */
export async function upgradedFromRoom(tx: Tx, reservationId: string): Promise<string | null> {
  const { rows } = await tx.query<{ room_id: string }>(
    `SELECT requested_room_id AS room_id FROM overbooking_incident
      WHERE reservation_id = $1 AND resolution = 'upgraded' AND requested_room_id IS NOT NULL
      ORDER BY detected_at, id LIMIT 1`,
    [reservationId],
  );
  return rows[0]?.room_id ?? null;
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
