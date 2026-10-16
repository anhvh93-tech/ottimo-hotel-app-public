/**
 * Room status SM-03 store (erd 4.1 `room_status`, BL 4.5): one row per room, history in state_transition
 * (machine SM-03). Written by the front desk in Sprint 3 (B9 → OC/OD, B17 → back, B14 old room → VD/OD and
 * new room → OC, B18 → VD unless CL); the housekeeping module (Sprint 4, transitionRoomStatus) takes the
 * cleaning transitions over through the same service.
 *
 * A room without a row yet has a derived status: OOO when an OOO block is active today, OC when a booking is
 * in house on it today, else VC (the rack rule of Sprint 2). An active OOO block always wins.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { RoomStatusCode } from '../../../db/schema/frontdesk';
import type { LocalDate } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';

export type { RoomStatusCode };

@Injectable()
export class RoomStatusService {
  constructor(@Inject(EventsService) private readonly events: EventsService) {}

  /** Current status of each room (derived when no row). */
  async current(
    tx: Tx,
    roomIds: readonly string[],
    today: LocalDate,
  ): Promise<Map<string, RoomStatusCode>> {
    const out = new Map<string, RoomStatusCode>();
    if (roomIds.length === 0) return out;
    const { rows } = await tx.query<{ id: string; status: RoomStatusCode }>(
      `SELECT rm.id,
              CASE
                WHEN EXISTS (SELECT 1 FROM room_block b WHERE b.room_id = rm.id AND b.status = 'active'
                              AND b.start_date <= $2::date
                              AND COALESCE(b.end_date_actual, b.end_date_planned) > $2::date) THEN 'OOO'
                WHEN rs.status IS NOT NULL THEN rs.status
                WHEN EXISTS (SELECT 1 FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
                              WHERE s.room_id = rm.id AND s.active AND r.status = 'in_house'
                                AND s.from_date <= $2::date AND s.to_date > $2::date) THEN 'OC'
                ELSE 'VC'
              END AS status
         FROM room rm LEFT JOIN room_status rs ON rs.room_id = rm.id
        WHERE rm.id = ANY($1::uuid[])`,
      [[...roomIds], today],
    );
    for (const r of rows) out.set(r.id, r.status);
    return out;
  }

  async of(tx: Tx, roomId: string, today: LocalDate): Promise<RoomStatusCode> {
    const s = (await this.current(tx, [roomId], today)).get(roomId);
    if (!s) throw new Error(`room ${roomId} not visible`);
    return s;
  }

  /**
   * Set the status (upsert, version + 1), SM-03 history row and SSE `room.status_changed`. No-op when the
   * STORED status is already `status` (a derived status is always materialised). Returns the previous status.
   */
  async set(
    tx: Tx,
    roomId: string,
    status: RoomStatusCode,
    input: { today: LocalDate; now: Date; event: string; reason?: string | null },
  ): Promise<RoomStatusCode> {
    const stored = await tx.query<{ status: RoomStatusCode }>(
      'SELECT status FROM room_status WHERE room_id = $1 FOR UPDATE',
      [roomId],
    );
    const row = stored.rows[0];
    if (row?.status === status) return status;
    const before = row?.status ?? (await this.of(tx, roomId, input.today));
    const userId = tx.ctx.actorType === 'user' ? tx.ctx.userId : null;
    await tx.query(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, since = EXCLUDED.since,
         updated_by = EXCLUDED.updated_by, version = room_status.version + 1`,
      [roomId, tx.ctx.organizationId, tx.ctx.propertyId, status, input.now, userId],
    );
    await tx.query(
      `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
         event_code, actor_type, actor_user_id, reason_note, occurred_at)
       VALUES ($1, $2, 'SM-03', $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        roomId,
        before,
        status,
        input.event,
        tx.ctx.actorType,
        userId,
        input.reason ?? null,
        input.now,
      ],
    );
    await this.events.publish(tx, 'room.status_changed', roomId);
    return before;
  }
}
