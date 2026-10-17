/**
 * FD_MINIBAR_PORT (frontdesk/public/ports.ts, BE-A) implemented by the inventory module (BE-B):
 * - checkoutStatus: blocker `minibar_not_checked` of B18 (EP03-05 5.2/5.5) – required when the FRIDGE (stay ×
 *   room, mô hình M-1) holds a chargeable item (BR-701; free-only fridge → step 1 passes by itself), checked when
 *   a live `checkout` count of that fridge exists; uncheckedRooms: every fridge of the stay still to count
 *   (old room after B14 included – BUG-R2-136, R9).
 * - onCheckedOut: B18 refill task (`minibar_refill`, US-035) when the live checkout count used anything
 *   (free items included – they are restocked too); the task id is kept on the count (`refill_task_id`).
 * Runs in the caller's (check-out) transaction. The housekeeping task row follows the shape of the desk's
 * own tasks (source `system`, `refill_items` = what was used); a count already linked to a task is skipped, so
 * a retried B18 never creates a second refill.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { businessDate, localDate } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';
import type { FrontdeskMinibarPort, MinibarCheckoutStatus } from '../../frontdesk/public/ports';
import { ParameterService } from '../../platform/public/parameter.service';
import { publishEvent } from '../../platform/public/staff-notify';
import { fridgeItems, primaryOf, registerFridge, stayRooms } from '../internal/fridge';

/** Low priority: refill after the checkout clean (desk TASK_RANK.low). */
const REFILL_RANK = 7;

@Injectable()
export class MinibarCheckoutPort implements FrontdeskMinibarPort {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /**
   * The fridge (stay × room – mô hình M-1, R1/R9) needs a count when it holds a chargeable item (its latest fill,
   * else the catalogue now – R3), and is checked when a live `checkout` count of THAT fridge exists.
   */
  async checkoutStatus(
    tx: Tx,
    reservationId: string,
    roomId: string,
  ): Promise<MinibarCheckoutStatus> {
    const primaryId = (await primaryOf(tx, reservationId)) ?? reservationId;
    const { items } = await fridgeItems(tx, primaryId, roomId);
    const { rows } = await tx.query<{ checked: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM minibar_check WHERE reservation_id = $1 AND room_id = $2
                        AND mode = 'checkout' AND replaced_by_check_id IS NULL) AS checked`,
      [primaryId, roomId],
    );
    return { required: items.some((i) => i.priceVnd !== null), checked: !!rows[0]?.checked };
  }

  /** BUG-R2-136 / R9: the fridges of the stay (every room it lived in) still to count before B18. */
  async uncheckedRooms(
    tx: Tx,
    reservationId: string,
  ): Promise<Array<{ roomId: string; roomNo: string }>> {
    const primaryId = (await primaryOf(tx, reservationId)) ?? reservationId;
    const now = this.clock.now();
    const { rows: tzRows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = tzRows[0]?.timezone ?? 'Asia/Ho_Chi_Minh';
    const rollover = await this.params.get<string>(tx, 'business_day_rollover', localDate(now, tz));
    const out: Array<{ roomId: string; roomNo: string }> = [];
    for (const room of await stayRooms(tx, primaryId, businessDate(now, tz, rollover))) {
      const st = await this.checkoutStatus(tx, primaryId, room.roomId);
      if (st.required && !st.checked) out.push(room);
    }
    return out;
  }

  async onCheckedOut(tx: Tx, reservationId: string, roomId: string): Promise<string | null> {
    const primaryId = (await primaryOf(tx, reservationId)) ?? reservationId;
    // R1/R9: the fridge of the room left (B14) stays a fridge of the stay (count it later with `roomId`).
    await registerFridge(tx, {
      primaryId,
      roomId,
      now: this.clock.now(),
      userId: tx.ctx.userId ?? null,
    });
    const { rows } = await tx.query<{ id: string; used: number }>(
      `SELECT c.id, COALESCE(SUM(l.used_qty), 0)::int AS used
         FROM minibar_check c JOIN minibar_check_line l ON l.check_id = c.id
        WHERE c.reservation_id = $1 AND c.room_id = $2 AND c.mode = 'checkout'
          AND c.replaced_by_check_id IS NULL AND c.refill_task_id IS NULL
        GROUP BY c.id`,
      [primaryId, roomId],
    );
    const check = rows[0];
    if (!check || check.used <= 0) return null;
    const now = this.clock.now();
    const { rows: tzRows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = tzRows[0]?.timezone ?? 'Asia/Ho_Chi_Minh';
    const rollover = await this.params.get<string>(tx, 'business_day_rollover', localDate(now, tz));
    const { rows: items } = await tx.query<{ item_id: string; used_qty: number }>(
      `SELECT item_id, used_qty FROM minibar_check_line WHERE check_id = $1 AND used_qty > 0 ORDER BY item_id`,
      [check.id],
    );
    const id = uuidv7();
    const { rows: created } = await tx.query<{ id: string }>(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, quantity, status,
         due_date, priority_rank, source, refill_items, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'minibar_refill', $6, 'open', $7, $8, 'system', $11, $9, $10, $9)
       ON CONFLICT DO NOTHING RETURNING id`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        roomId,
        primaryId,
        check.used,
        businessDate(now, tz, rollover),
        REFILL_RANK,
        now,
        tx.ctx.userId ?? null,
        JSON.stringify(items.map((i) => ({ itemId: i.item_id, quantity: i.used_qty }))),
      ],
    );
    const taskId = created[0]?.id ?? null;
    if (!taskId) return null;
    await tx.query('UPDATE minibar_check SET refill_task_id = $2 WHERE id = $1', [
      check.id,
      taskId,
    ]);
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'hk_task.changed', $4, $5)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        JSON.stringify({ taskId, reservationId: primaryId }),
        `hk_task.changed:${taskId}:${uuidv7()}`,
      ],
    );
    await publishEvent(tx, this.events, 'hk_task.changed', taskId);
    return taskId;
  }
}
