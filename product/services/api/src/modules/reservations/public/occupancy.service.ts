/**
 * OccupancyService – the ONLY writer of room_occupancy (ADR-009, coding-standards 6 "Tồn phòng").
 *
 * Double booking is prevented by the EXCLUDE constraint room_occupancy_no_overlap, never by
 * SELECT-then-INSERT. Each write runs inside a SAVEPOINT: on 23P01 the savepoint is rolled back and the
 * active rows overlapping the range are read to build `conflicts[]` + `suggestions[]` for
 * 409 ROOM_UNAVAILABLE (or ROOM_BLOCKED when only OOO blocks are in the way). The caller's transaction
 * then fails with that problem and rolls back as a whole (UnitOfWork).
 *
 * Lock order (deadlock rule, erd 4.5): reservation FOR UPDATE → room rows by room_id ascending
 * (lockRooms) → folio.
 */
import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { type Tx, pgCode } from '../../../db/database';
import type { OccupancyKind } from '../../../db/schema';
import { ProblemError, problem } from '../../../shared/problem';
import { type LocalDate, addDays } from '../../../shared/time';
import { nightDates, orphanNightsLeft } from './pricing';

export interface OccupancyConflict {
  roomNo: string;
  nights: LocalDate[];
  kind: 'reservation' | 'hold' | 'ooo';
  reservationCode?: string;
  guestDisplayName?: string;
  /** Internal (not sent): which booking/block occupies the room. */
  reservationId?: string;
  roomBlockId?: string;
  status?: string;
}

export interface RoomSuggestion {
  roomId: string;
  roomNo: string;
  roomGroupCode: string;
  upgrade: boolean;
  orphanNight?: boolean;
}

export interface SuggestFor {
  /** Requested room (its group comes first; never suggested itself). */
  roomId?: string | null;
  roomGroupId?: string | null;
  from: LocalDate;
  to: LocalDate;
  /** Counted persons (BR-110) – rooms with a smaller max occupancy are skipped. */
  persons: number;
  limit?: number;
  /** Segments whose own occupancy does not count as busy (assigning/moving that booking). */
  excludeSegmentIds?: string[];
  /** Mark each suggestion with `orphanNight` (BR-113 a – 0.3.5 A-05). */
  withOrphanFlag?: boolean;
}

export interface ConflictView {
  /** Show the booker name (FD+ only – spec EP02 3.5, `booking.error.conflict` vs `_noname`). */
  withNames: boolean;
}

const MAX_SUGGESTIONS = 6;

function rangeLiteral(from: LocalDate, to: LocalDate): string {
  return `[${from},${to})`;
}

/** `[2026-10-20,2026-10-22)` → { from, to } */
export function parseRange(r: string): { from: LocalDate; to: LocalDate } {
  const m = /^[[(](\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})[\])]$/.exec(r);
  if (!m) throw new Error(`unexpected daterange ${r}`);
  return { from: m[1] as LocalDate, to: m[2] as LocalDate };
}

@Injectable()
export class OccupancyService {
  /** Lock room rows in ascending id order (ADR-009 point 7, erd 4.5 lock order). */
  async lockRooms(tx: Tx, roomIds: readonly string[]): Promise<void> {
    const ids = [...new Set(roomIds)].sort();
    if (ids.length === 0) return;
    await tx.query('SELECT id FROM room WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE', [ids]);
  }

  /** Insert an occupancy row; 23P01 → 409 with conflicts + suggestions. Returns the row id. */
  async claim(
    tx: Tx,
    input: {
      roomId: string;
      from: LocalDate;
      to: LocalDate;
      kind: OccupancyKind;
      segmentId?: string;
      roomBlockId?: string;
      now: Date;
    },
    view: ConflictView & { persons: number },
  ): Promise<string> {
    // S438-MOVE-04: a segment keeps ONE occupancy row (`room_occupancy_segment_uk`). A released row (no-show
    // restored into the unassigned lane, BR-315 (g)(b)) is reactivated on the new room, never inserted twice.
    if (input.segmentId) {
      const { rows } = await tx.query<{ id: string }>(
        'SELECT id FROM room_occupancy WHERE reservation_segment_id = $1',
        [input.segmentId],
      );
      const existing = rows[0];
      if (existing) {
        await this.update(
          tx,
          { segmentId: input.segmentId },
          { roomId: input.roomId, from: input.from, to: input.to, active: true, kind: input.kind },
          input.now,
          { ...view, excludeSegmentIds: [input.segmentId] },
        );
        return existing.id;
      }
    }
    const id = uuidv7();
    await this.guarded(
      tx,
      () =>
        tx.query(
          `INSERT INTO room_occupancy (id, organization_id, property_id, room_id, stay_range, kind,
             reservation_segment_id, room_block_id, active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5::daterange, $6, $7, $8, true, $9, $9)`,
          [
            id,
            tx.ctx.organizationId,
            tx.ctx.propertyId,
            input.roomId,
            rangeLiteral(input.from, input.to),
            input.kind,
            input.segmentId ?? null,
            input.roomBlockId ?? null,
            input.now,
          ],
        ),
      { roomId: input.roomId, from: input.from, to: input.to, persons: view.persons },
      view,
    );
    return id;
  }

  /**
   * Move/resize/reactivate the occupancy of a segment or block in place (B7, B7a, B12, O3, swap).
   * `active` true re-checks the constraint; 23P01 → 409.
   */
  async update(
    tx: Tx,
    where: { segmentId?: string; roomBlockId?: string },
    set: { roomId: string; from: LocalDate; to: LocalDate; active?: boolean; kind?: OccupancyKind },
    now: Date,
    view: ConflictView & { persons: number; excludeSegmentIds?: string[] },
  ): Promise<void> {
    const col = where.segmentId ? 'reservation_segment_id' : 'room_block_id';
    const key = where.segmentId ?? where.roomBlockId;
    await this.guarded(
      tx,
      () =>
        tx.query(
          `UPDATE room_occupancy SET room_id = $2, stay_range = $3::daterange, active = $4,
                  kind = COALESCE($5, kind), updated_at = $6
            WHERE ${col} = $1`,
          [
            key,
            set.roomId,
            rangeLiteral(set.from, set.to),
            set.active ?? true,
            set.kind ?? null,
            now,
          ],
        ),
      {
        roomId: set.roomId,
        from: set.from,
        to: set.to,
        persons: view.persons,
        exclude: view.excludeSegmentIds,
      },
      view,
    );
  }

  /** Free the room (cancel, no-show, hold expiry, block cancelled) – same transaction as the transition. */
  async release(tx: Tx, where: { segmentId?: string; roomBlockId?: string }, now: Date) {
    const col = where.segmentId ? 'reservation_segment_id' : 'room_block_id';
    await tx.query(
      `UPDATE room_occupancy SET active = false, updated_at = $2 WHERE ${col} = $1 AND active`,
      [where.segmentId ?? where.roomBlockId, now],
    );
  }

  /** Change the kind (hold → reservation on B4). No overlap change. */
  async setKind(tx: Tx, segmentId: string, kind: OccupancyKind, now: Date): Promise<void> {
    await tx.query(
      'UPDATE room_occupancy SET kind = $2, updated_at = $3 WHERE reservation_segment_id = $1',
      [segmentId, kind, now],
    );
  }

  /**
   * Run `write` in a savepoint; on exclusion violation roll back to it and throw the 409 problem with the
   * current conflicts (read AFTER the competing transaction committed – READ COMMITTED new snapshot).
   */
  async guarded(
    tx: Tx,
    write: () => Promise<unknown>,
    range: {
      roomId: string;
      from: LocalDate;
      to: LocalDate;
      persons: number;
      exclude?: string[] | undefined;
    },
    view: ConflictView,
  ): Promise<void> {
    await tx.query('SAVEPOINT occupancy_write');
    try {
      await write();
      await tx.query('RELEASE SAVEPOINT occupancy_write');
    } catch (err) {
      await tx.query('ROLLBACK TO SAVEPOINT occupancy_write');
      if (pgCode(err) !== '23P01') throw err;
      throw await this.unavailable(tx, range, view);
    }
  }

  /** Build the 409 problem (ROOM_BLOCKED when every conflict is an OOO block). */
  async unavailable(
    tx: Tx,
    range: {
      roomId: string;
      from: LocalDate;
      to: LocalDate;
      persons: number;
      exclude?: string[] | undefined;
    },
    view: ConflictView,
  ): Promise<ProblemError> {
    const conflicts = await this.conflicts(tx, range.roomId, range.from, range.to, range.exclude);
    const suggestions = await this.suggest(tx, {
      roomId: range.roomId,
      from: range.from,
      to: range.to,
      persons: range.persons,
    });
    const onlyBlocks = conflicts.length > 0 && conflicts.every((c) => c.kind === 'ooo');
    return problem(onlyBlocks ? 'ROOM_BLOCKED' : 'ROOM_UNAVAILABLE', {
      extras: {
        conflicts: conflicts.map((c) => publicConflict(c, view)),
        suggestions,
      },
    });
  }

  /** Active rows overlapping [from, to) on a room (excluding the caller's own segments). */
  async conflicts(
    tx: Tx,
    roomId: string,
    from: LocalDate,
    to: LocalDate,
    excludeSegmentIds: readonly string[] = [],
  ): Promise<OccupancyConflict[]> {
    const { rows } = await tx.query<{
      kind: 'reservation' | 'hold' | 'ooo';
      range: string;
      room_no: string;
      code: string | null;
      reservation_id: string | null;
      status: string | null;
      full_name: string | null;
      room_block_id: string | null;
    }>(
      `SELECT o.kind, o.stay_range::text AS range, rm.room_no, r.code, r.id AS reservation_id, r.status,
              g.full_name, o.room_block_id
         FROM room_occupancy o
         JOIN room rm ON rm.id = o.room_id
         LEFT JOIN reservation_segment s ON s.id = o.reservation_segment_id
         LEFT JOIN reservation r ON r.id = s.reservation_id
         LEFT JOIN guest g ON g.id = r.booker_guest_id
        WHERE o.room_id = $1 AND o.active AND o.stay_range && $2::daterange
          AND (o.reservation_segment_id IS NULL OR NOT (o.reservation_segment_id = ANY($3::uuid[])))
        ORDER BY lower(o.stay_range)`,
      [roomId, rangeLiteral(from, to), [...excludeSegmentIds]],
    );
    const wanted = new Set(nightDates(from, to));
    return rows.map((r) => {
      const occ = parseRange(r.range);
      return {
        roomNo: r.room_no,
        nights: nightDates(occ.from, occ.to).filter((d) => wanted.has(d)),
        kind: r.kind,
        ...(r.code ? { reservationCode: r.code } : {}),
        ...(r.full_name ? { guestDisplayName: r.full_name } : {}),
        ...(r.reservation_id ? { reservationId: r.reservation_id } : {}),
        ...(r.room_block_id ? { roomBlockId: r.room_block_id } : {}),
        ...(r.status ? { status: r.status } : {}),
      };
    });
  }

  /** Is the room free for [from, to) (no active row) – read-only helper for availability/no-show checks. */
  async isFree(
    tx: Tx,
    roomId: string,
    from: LocalDate,
    to: LocalDate,
    excludeSegmentIds: readonly string[] = [],
  ): Promise<boolean> {
    const { rows } = await tx.query(
      `SELECT 1 FROM room_occupancy
        WHERE room_id = $1 AND active AND stay_range && $2::daterange
          AND (reservation_segment_id IS NULL OR NOT (reservation_segment_id = ANY($3::uuid[])))
        LIMIT 1`,
      [roomId, rangeLiteral(from, to), [...excludeSegmentIds]],
    );
    return rows.length === 0;
  }

  /**
   * Free rooms for [from, to) (BR-316): same group first – fewest orphan nights left, then room number –,
   * then other groups by room_group.sort_order marked `upgrade` (suggestion only, never auto-assigned).
   */
  async suggest(tx: Tx, f: SuggestFor): Promise<RoomSuggestion[]> {
    let { rows } = await tx.query<{
      id: string;
      room_no: string;
      group_id: string;
      group_code: string;
      sort_order: number;
    }>(
      `SELECT rm.id, rm.room_no, rg.id AS group_id, rg.code AS group_code, rg.sort_order
         FROM room rm JOIN room_group rg ON rg.id = rm.room_group_id
        WHERE rm.is_sellable AND rm.active_from <= $1 AND (rm.active_to IS NULL OR rm.active_to >= $2)
          AND rm.max_occupancy >= $3
          AND ($4::uuid IS NULL OR rm.id <> $4::uuid)
          AND NOT EXISTS (SELECT 1 FROM room_occupancy o
                           WHERE o.room_id = rm.id AND o.active AND o.stay_range && $5::daterange
                             AND (o.reservation_segment_id IS NULL
                                  OR NOT (o.reservation_segment_id = ANY($6::uuid[]))))`,
      [
        f.from,
        f.to,
        f.persons,
        f.roomId ?? null,
        rangeLiteral(f.from, f.to),
        f.excludeSegmentIds ?? [],
      ],
    );
    let groupId = f.roomGroupId ?? null;
    if (!groupId && f.roomId) {
      const g = await tx.query<{ room_group_id: string }>(
        'SELECT room_group_id FROM room WHERE id = $1',
        [f.roomId],
      );
      groupId = g.rows[0]?.room_group_id ?? null;
    }
    // BR-312 / BUG-R2-020: same group or HIGHER groups only (room_group.sort_order); a lower group is
    // never suggested (it would be a downgrade, not an "upgrade").
    const refOrder = groupId ? rows.find((r) => r.group_id === groupId)?.sort_order : undefined;
    let refSort = refOrder;
    if (groupId && refSort === undefined) {
      const g = await tx.query<{ sort_order: number }>(
        'SELECT sort_order FROM room_group WHERE id = $1',
        [groupId],
      );
      refSort = g.rows[0]?.sort_order;
    }
    if (refSort !== undefined) {
      const ref = refSort;
      rows = rows.filter((r) => r.group_id === groupId || r.sort_order > ref);
    }
    if (rows.length === 0) return [];
    // Neighbouring occupancy (±2 days) to count the orphan nights a booking would leave (BR-316 (2)).
    const near = await tx.query<{ room_id: string; range: string }>(
      `SELECT room_id, stay_range::text AS range FROM room_occupancy
        WHERE active AND room_id = ANY($1::uuid[]) AND stay_range && $2::daterange`,
      [rows.map((r) => r.id), rangeLiteral(addDays(f.from, -2), addDays(f.to, 2))],
    );
    const occ = new Map<string, Array<{ from: LocalDate; to: LocalDate }>>();
    for (const n of near.rows) {
      const list = occ.get(n.room_id) ?? [];
      list.push(parseRange(n.range));
      occ.set(n.room_id, list);
    }
    const orphanOf = (roomId: string): boolean => {
      const occ2 = occ.get(roomId) ?? [];
      return occ2.some((o) => o.to === f.from) && occ2.some((o) => o.from === f.to);
    };
    const ranked = rows.map((r) => ({
      r,
      same: groupId !== null && r.group_id === groupId,
      orphans: orphanNightsLeft(f.from, f.to, occ.get(r.id) ?? []),
    }));
    ranked.sort((a, b) => {
      if (a.same !== b.same) return a.same ? -1 : 1;
      if (!a.same && a.r.sort_order !== b.r.sort_order) return a.r.sort_order - b.r.sort_order;
      if (a.orphans !== b.orphans) return a.orphans - b.orphans;
      return a.r.room_no.localeCompare(b.r.room_no);
    });
    return ranked.slice(0, f.limit ?? MAX_SUGGESTIONS).map(({ r, same }) => ({
      roomId: r.id,
      roomNo: r.room_no,
      roomGroupCode: r.group_code,
      upgrade: groupId !== null && !same,
      ...(f.withOrphanFlag ? { orphanNight: orphanOf(r.id) } : {}),
    }));
  }
}

/** Problem extension `conflicts[]` (OpenAPI RoomUnavailable example) – names only for FD+. */
export function publicConflict(c: OccupancyConflict, view: ConflictView): Record<string, unknown> {
  return {
    roomNo: c.roomNo,
    nights: c.nights,
    kind: c.kind,
    // SEC-BE-25: booking codes and names of other people's bookings only for FD+ (SAL/CTV/MT see
    // "sold out", like their rack – availability_only).
    ...(view.withNames && c.reservationCode ? { reservationCode: c.reservationCode } : {}),
    ...(view.withNames && c.guestDisplayName ? { guestDisplayName: c.guestDisplayName } : {}),
  };
}
