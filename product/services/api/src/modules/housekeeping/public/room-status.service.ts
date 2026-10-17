/**
 * Room status SM-03 store (erd 4.8 `room_status`, BL 4.5): one row per room, history in state_transition
 * (machine SM-03). Owned by the housekeeping module since OpenAPI 0.3.7 B-14 (BE-C, Sprint 4 – moved from
 * frontdesk/public, which re-exports it for the front desk: B9 → OC/OD, B17 → back, B14 old room → VD/OD and
 * new room → OC, B18 → VD unless CL). The housekeeping module writes the cleaning transitions (R1–R4, R8),
 * R5 (BR-805) and the OOO exits (R11) through the same service. B13 → OD also gives the room its stay-over clean
 * of the day (S4-31 – `stayContinues`).
 *
 * A room without a row yet has a derived status: OOO when an OOO block is active today, OC when a booking is
 * in house on it today, else VC (the rack rule of Sprint 2). An active OOO block always wins.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { RoomStatusCode } from '../../../db/schema/frontdesk';
import type { LocalDate } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { linenChangeDue } from '../internal/rules';

export type { RoomStatusCode };

@Injectable()
export class RoomStatusService {
  constructor(
    @Inject(EventsService) private readonly events: EventsService,
    @Optional() @Inject(ParameterService) private readonly params?: ParameterService,
  ) {}

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
    input: {
      today: LocalDate;
      now: Date;
      event: string;
      reason?: string | null;
      /** Device time of the action (PWA offline queue, ADR-005 / SR-PWA-05) – kept in the SM-03 history. */
      performedAt?: Date | null;
    },
  ): Promise<RoomStatusCode> {
    const stored = await tx.query<{ status: RoomStatusCode }>(
      'SELECT status FROM room_status WHERE room_id = $1 FOR UPDATE',
      [roomId],
    );
    const row = stored.rows[0];
    if (row?.status === status) return status;
    // BR-807-01 (DOM, v0.3.8): a guest who arrived today is not a stay-over yet – an extension (B13) on the
    // arrival day keeps the room OC, without a stay-over clean (07:00 J8 of the next day does both).
    if (
      status === 'OD' &&
      input.event === 'B13' &&
      (await this.arrivedToday(tx, roomId, input.today))
    ) {
      return row?.status ?? (await this.of(tx, roomId, input.today));
    }
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
         event_code, actor_type, actor_user_id, reason_note, occurred_at, performed_at)
       VALUES ($1, $2, 'SM-03', $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
        input.performedAt ?? null,
      ],
    );
    await this.events.publish(tx, 'room.status_changed', roomId);
    if (status === 'OD' && input.event === 'B13') await this.stayContinues(tx, roomId, input);
    return before;
  }

  /** The in-house stay of the room arrived on `today` (an extension child counts its parent's arrival). */
  private async arrivedToday(tx: Tx, roomId: string, today: LocalDate): Promise<boolean> {
    const { rows } = await tx.query<{ arrival: string }>(
      `SELECT COALESCE(p.arrival_date, r.arrival_date)::text AS arrival
         FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
         LEFT JOIN reservation p ON p.id = r.parent_reservation_id
        WHERE s.room_id = $1 AND s.active AND r.status = 'in_house' AND s.from_date <= $2::date
          AND s.to_date > $2::date
        ORDER BY s.from_date DESC LIMIT 1`,
      [roomId, today],
    );
    return !!rows[0] && rows[0].arrival >= today;
  }

  /**
   * S4-31 (US-028 AC4, EP07 2.4 "Gia hạn B13: OC → OD + việc dọn"): the stay goes on, so the room gets the
   * stay-over clean of the day – J8 skipped it while the guest was leaving today. One per room and day
   * (`hk_task_clean_uk`); a check-out clean of that room still open today becomes this stay-over clean.
   */
  private async stayContinues(
    tx: Tx,
    roomId: string,
    input: { today: LocalDate; now: Date },
  ): Promise<void> {
    const { rows: stay } = await tx.query<{ reservation_id: string; nights: number }>(
      `SELECT s.reservation_id, ($2::date - COALESCE(p.arrival_date, r.arrival_date)) AS nights
         FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
         LEFT JOIN reservation p ON p.id = r.parent_reservation_id
        WHERE s.room_id = $1 AND s.active AND r.status = 'in_house' AND s.from_date <= $2::date
          AND s.to_date > $2::date
        ORDER BY s.from_date DESC LIMIT 1`,
      [roomId, input.today],
    );
    const reservationId = stay[0]?.reservation_id ?? null;
    // DOM-S4-16 (a): the same linen rule as J8 (every `linen_change_every_nights` nights of the stay).
    const every = this.params
      ? await this.params.get<number>(tx, 'linen_change_every_nights', input.today)
      : 0;
    const linen = linenChangeDue(every, stay[0]?.nights ?? 0);
    const { rows: changed } = await tx.query<{ id: string }>(
      `UPDATE hk_task SET type = 'stayover_clean', reservation_id = COALESCE($3, reservation_id),
              not_before_time = NULL, linen_change = $5, updated_at = $4, version = version + 1
        WHERE room_id = $1 AND due_date = $2::date AND type = 'checkout_clean' AND status = 'open'
          AND NOT EXISTS (SELECT 1 FROM hk_task o WHERE o.room_id = $1 AND o.due_date = $2::date
                            AND o.type = 'stayover_clean' AND o.status IN ('open', 'in_progress'))
        RETURNING id`,
      [roomId, input.today, reservationId, input.now, linen],
    );
    const id = changed[0]?.id ?? uuidv7();
    if (!changed[0]) {
      const { rows } = await tx.query<{ id: string }>(
        `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date,
           source, linen_change, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'stayover_clean', 'open', $6, 'system', $8, $7, $7)
         ON CONFLICT DO NOTHING RETURNING id`,
        [
          id,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          roomId,
          reservationId,
          input.today,
          input.now,
          linen,
        ],
      );
      if (!rows[0]) return;
    }
    await this.events.publish(tx, 'hk_task.changed', id);
  }
}
