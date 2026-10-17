/**
 * FD_MINIBAR_PORT (frontdesk/public/ports.ts, BE-A) implemented by the inventory module (BE-B):
 * - checkoutStatus: blocker `minibar_not_checked` of B18 (EP03-05 5.2/5.5) – required when the FRIDGE (stay ×
 *   room, mô hình M-1) holds a chargeable item (BR-701; free-only fridge → step 1 passes by itself), checked when
 *   a live `checkout` count of that fridge exists; uncheckedRooms: every fridge of the stay still to count
 *   (old room after B14 included – BUG-R2-136, R9).
 * - onCheckedOut: B18 refill task (`minibar_refill`, US-035) for EVERY live checkout count of the fridge that used
 *   anything and has no task yet (free items included – they are restocked too; DOM BR-703-02 note 4: one task
 *   per live count with use, every period); the task id is kept on the count (`refill_task_id`).
 * Runs in the caller's (check-out) transaction. The housekeeping task row follows the shape of the desk's
 * own tasks (source `system`, `refill_items` = what was used); a count already linked to a task is skipped, so
 * a retried B18 never creates a second refill.
 * Also MINIBAR_REFILL_DONE_PORT (housekeeping/public, ARC 16.16): a refill done while the stay is in that room
 * opens a `refill` period (onRefillDone).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { businessDate, localDate } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';
import type { FrontdeskMinibarPort, MinibarCheckoutStatus } from '../../frontdesk/public/ports';
import type { MinibarRefillDonePort } from '../../housekeeping/public/minibar-refill-done.port';
import { ParameterService } from '../../platform/public/parameter.service';
import { publishEvent } from '../../platform/public/staff-notify';
import {
  type FridgeItem,
  catalogueFridge,
  fridgeItems,
  latestFill,
  primaryOf,
  registerFridge,
  stayIsInRoom,
  stayRooms,
  writeFill,
} from '../internal/fridge';

/** Low priority: refill after the checkout clean (desk TASK_RANK.low). */
const REFILL_RANK = 7;

@Injectable()
export class MinibarCheckoutPort implements FrontdeskMinibarPort, MinibarRefillDonePort {
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
    const { fill, items } = await fridgeItems(tx, primaryId, roomId);
    // ARC R9 (BUG-R2-144): "counted" = a live count AFTER the latest mark – in the current period (a new period
    // opens when the stay goes on in a counted fridge; a count made stale is not live).
    const { rows } = await tx.query<{ checked: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM minibar_check WHERE reservation_id = $1 AND room_id = $2
                        AND mode = 'checkout' AND replaced_by_check_id IS NULL
                        AND fill_id IS NOT DISTINCT FROM $3::uuid) AS checked`,
      [primaryId, roomId, fill?.id ?? null],
    );
    return { required: items.some((i) => i.priceVnd !== null), checked: !!rows[0]?.checked };
  }

  /**
   * ARC R9 / 16.13 (BUG-R2-144, DOM BR-703-02 – note 18/10) – the stay goes on in a fridge (B14 into a room – a
   * return included –, S4-09 room return: `room_entered`; B13: `extended`; never B18's "one more night"). A
   * fridge already counted in its current period is "not counted" any more – B18 asks again:
   * - the latest count of the period is CHARGED ((t): an item with a sale price in the period used > 0 – by
   *   quantity, whatever FOC / edit / void did to the money) → a NEW period: from a `refill` fill when the refill
   *   task of the room was done after that count (mark, price = the catalogue now – (s) until R3; `filled_at` = the
   *   done time), else a `carry` fill from that count (mark = what was left, price of the period). The refill task
   *   still open is KEPT (DOM note 1 – HK refills as usual; onRefillDone opens the next period);
   * - a count without money → no new period; that count is made stale (`replaced_by_check_id = id`, ARC 16.15
   *   (v)): the next count of the period replaces it (R6).
   * `extended`: every live count of the fridge with use and no refill task gets one now (DOM note 1/4 – as B18).
   */
  async onStayContinued(
    tx: Tx,
    reservationId: string,
    roomId: string,
    reason: 'room_entered' | 'extended',
  ): Promise<void> {
    const primaryId = (await primaryOf(tx, reservationId)) ?? reservationId;
    await this.openNextPeriod(tx, primaryId, roomId);
    // After the period is settled: a count made stale above is not live – it gets no task (its replacement will).
    if (reason === 'extended') await this.createRefillTasks(tx, primaryId, roomId);
  }

  private async openNextPeriod(tx: Tx, primaryId: string, roomId: string): Promise<void> {
    const fill = await latestFill(tx, primaryId, roomId);
    const { rows: counts } = await tx.query<{ id: string; created_at: Date; charged: boolean }>(
      `SELECT c.id, c.created_at,
              EXISTS (SELECT 1 FROM minibar_check_line l
                       WHERE l.check_id = c.id AND l.used_qty > 0
                         AND COALESCE((SELECT fl.unit_price_vnd_snapshot FROM minibar_fill_line fl
                                        WHERE fl.fill_id = c.fill_id AND fl.item_id = l.item_id),
                                      l.unit_price_vnd_snapshot) > 0) AS charged
         FROM minibar_check c
        WHERE c.reservation_id = $1 AND c.room_id = $2 AND c.mode = 'checkout'
          AND c.replaced_by_check_id IS NULL AND c.fill_id IS NOT DISTINCT FROM $3::uuid
        ORDER BY c.created_at DESC LIMIT 1 FOR UPDATE`,
      [primaryId, roomId, fill?.id ?? null],
    );
    const count = counts[0];
    if (!count) return; // nothing counted in this period – B18 asks for a count anyway
    const now = this.clock.now();
    const userId = tx.ctx.userId ?? null;
    if (!count.charged) {
      // A count of nothing chargeable used: the period goes on, the count must be taken again (it replaces this
      // one). ARC 16.15 (v): the only writer of the self-reference; no query follows it recursively.
      await tx.query('UPDATE minibar_check SET replaced_by_check_id = id WHERE id = $1', [
        count.id,
      ]);
      return;
    }
    const { rows: done } = await tx.query<{ id: string; done_at: Date }>(
      `SELECT id, done_at FROM hk_task
        WHERE room_id = $1 AND reservation_id = $2 AND type = 'minibar_refill' AND status = 'done'
          AND done_at > $3
        ORDER BY done_at DESC LIMIT 1`,
      [roomId, primaryId, count.created_at],
    );
    if (done[0]) {
      // ARC 16.15 (s): the fill is dated when HK finished; mark and price are the catalogue now (until R3).
      await writeFill(tx, {
        primaryId,
        roomId,
        at: done[0].done_at,
        now,
        userId,
        items: await catalogueFridge(tx),
        source: 'refill',
      });
      return;
    }
    // Not refilled: the period carries on from that count – mark = what was left, same prices.
    const { items } = await fridgeItems(tx, primaryId, roomId);
    const price = new Map(items.map((i) => [i.itemId, i]));
    const { rows: left } = await tx.query<{ item_id: string; remaining_qty: number }>(
      'SELECT item_id, remaining_qty FROM minibar_check_line WHERE check_id = $1',
      [count.id],
    );
    await writeFill(tx, {
      primaryId,
      roomId,
      at: now,
      now,
      userId,
      items: left
        .filter((l) => price.has(l.item_id))
        .map((l) => ({ ...(price.get(l.item_id) as FridgeItem), mark: Number(l.remaining_qty) })),
      source: 'carry',
    });
  }

  /**
   * MINIBAR_REFILL_DONE_PORT (ARC 16.16, DOM BR-703-02 note 2): HK finished a refill. Only when the task's stay is
   * in house AND in that room now: a `refill` fill opens a new period – mark per item = what the system knows is
   * left (the latest count of the current period, a stale "used 0" count included; no count → the period's
   * mark) + what the task refills; items at 0 dropped; price = the catalogue now, an item off the catalogue keeps
   * the price of the period. The task stays on the count that raised it. Otherwise (stay gone – the refill
   * prepares the room for the next guest, DOM note 3 –, manual task without booking or items) → nothing.
   */
  async onRefillDone(
    tx: Tx,
    task: {
      id: string;
      reservationId: string | null;
      roomId: string;
      refillItems: ReadonlyArray<{ itemId: string; qty: number }> | null;
    },
    at: { now: Date; performedAt: Date },
  ): Promise<void> {
    if (!task.reservationId || !task.refillItems || task.refillItems.length === 0) return;
    const primaryId = (await primaryOf(tx, task.reservationId)) ?? task.reservationId;
    const { tz, rollover } = await this.dayOf(tx, at.now);
    if (!(await stayIsInRoom(tx, primaryId, task.roomId, businessDate(at.now, tz, rollover))))
      return;
    const userId = tx.ctx.userId ?? null;
    await registerFridge(tx, { primaryId, roomId: task.roomId, now: at.now, userId });
    const fill = await latestFill(tx, primaryId, task.roomId);
    // The period's own lines (a `carry` keeps its zeros) – the mark when nothing was counted in it.
    const { rows: period } = fill
      ? await tx.query<{
          item_id: string;
          code: string;
          name: string;
          qty: number;
          unit_price_vnd_snapshot: string | number | null;
          unit_cost_vnd_snapshot: string | number | null;
        }>(
          `SELECT l.item_id, i.code, i.name, l.qty, l.unit_price_vnd_snapshot, l.unit_cost_vnd_snapshot
             FROM minibar_fill_line l JOIN item i ON i.id = l.item_id
            WHERE l.fill_id = $1`,
          [fill.id],
        )
      : { rows: [] };
    const { rows: lastRows } = await tx.query<{ id: string; stale: boolean }>(
      `SELECT id, replaced_by_check_id = id AS stale FROM minibar_check
        WHERE reservation_id = $1 AND room_id = $2 AND mode = 'checkout'
          AND fill_id IS NOT DISTINCT FROM $3::uuid
          AND (replaced_by_check_id IS NULL OR replaced_by_check_id = id)
        ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE`,
      [primaryId, task.roomId, fill?.id ?? null],
    );
    const last = lastRows[0];
    const left = new Map<string, number>();
    if (last) {
      const { rows } = await tx.query<{ item_id: string; remaining_qty: number }>(
        'SELECT item_id, remaining_qty FROM minibar_check_line WHERE check_id = $1',
        [last.id],
      );
      for (const r of rows) left.set(r.item_id, Number(r.remaining_qty));
    }
    const refill = new Map<string, number>();
    for (const r of task.refillItems) refill.set(r.itemId, (refill.get(r.itemId) ?? 0) + r.qty);
    const catalogue = new Map((await catalogueFridge(tx)).map((i) => [i.itemId, i]));
    const num = (v: string | number | null) => (v === null ? null : Number(v));
    const kept = new Map<string, FridgeItem>(
      period.map((r) => [
        r.item_id,
        {
          itemId: r.item_id,
          code: r.code,
          name: r.name,
          mark: Number(r.qty),
          priceVnd:
            (num(r.unit_price_vnd_snapshot) ?? 0) > 0 ? num(r.unit_price_vnd_snapshot) : null,
          costVnd: num(r.unit_cost_vnd_snapshot),
        },
      ]),
    );
    // An item of the task that is not in the period (not expected – the task comes from a count of the stay):
    // the catalogue, else the goods row as it is now.
    const missing = [...refill.keys()].filter((id) => !kept.has(id) && !catalogue.has(id));
    if (missing.length > 0) {
      const { rows } = await tx.query<{
        id: string;
        code: string;
        name: string;
        sale_price_vnd: string | number | null;
        cost_price_vnd: string | number | null;
      }>(
        `SELECT id, code, name, sale_price_vnd, cost_price_vnd FROM item WHERE id = ANY($1::uuid[])`,
        [missing],
      );
      for (const r of rows) {
        kept.set(r.id, {
          itemId: r.id,
          code: r.code,
          name: r.name,
          mark: 0,
          priceVnd: (num(r.sale_price_vnd) ?? 0) > 0 ? num(r.sale_price_vnd) : null,
          costVnd: num(r.cost_price_vnd),
        });
      }
    }
    const items: FridgeItem[] = [];
    for (const id of new Set([...kept.keys(), ...refill.keys()])) {
      const base = kept.get(id) ?? catalogue.get(id);
      if (!base) continue;
      const before = last ? (left.get(id) ?? kept.get(id)?.mark ?? 0) : (kept.get(id)?.mark ?? 0);
      const mark = before + (refill.get(id) ?? 0);
      if (mark <= 0) continue;
      const cat = catalogue.get(id);
      items.push({
        ...base,
        mark,
        priceVnd: cat ? cat.priceVnd : base.priceVnd,
        costVnd: cat ? cat.costVnd : base.costVnd,
      });
    }
    if (items.length === 0) return;
    items.sort((a, b) => a.code.localeCompare(b.code));
    await writeFill(tx, {
      primaryId,
      roomId: task.roomId,
      at: at.performedAt,
      now: at.now,
      userId,
      items,
      source: 'refill',
    });
    // The period is closed by this fill: a count made stale in it (ARC 16.15 (v)) is its final count again – no
    // self-reference is left behind (B18 counts the new period), and B18 gives it its own task if it used anything.
    if (last?.stale) {
      await tx.query('UPDATE minibar_check SET replaced_by_check_id = NULL WHERE id = $1', [
        last.id,
      ]);
    }
  }

  /**
   * BUG-R2-136 / R9: the fridges of the stay (every room it lived in) still to count before B18, with why (ARC
   * 16.14): `never_counted` – no count of this fridge in the stay; `stay_continued` – counted, then the stay went
   * on (back in the room, B13 – a period opened by `refill` or `carry`, or a count made stale); `new_fill` – a
   * period opened by a mid-stay refill without such an event (R3 – not written in R2). Priority stay_continued >
   * new_fill > never_counted.
   */
  async uncheckedRooms(
    tx: Tx,
    reservationId: string,
  ): Promise<
    Array<{
      roomId: string;
      roomNo: string;
      reason: 'never_counted' | 'stay_continued' | 'new_fill';
    }>
  > {
    const primaryId = (await primaryOf(tx, reservationId)) ?? reservationId;
    const now = this.clock.now();
    const { tz, rollover } = await this.dayOf(tx, now);
    const out: Array<{
      roomId: string;
      roomNo: string;
      reason: 'never_counted' | 'stay_continued' | 'new_fill';
    }> = [];
    for (const room of await stayRooms(tx, primaryId, businessDate(now, tz, rollover))) {
      const st = await this.checkoutStatus(tx, primaryId, room.roomId);
      if (!st.required || st.checked) continue;
      // R2: a fridge counted before and not counted now = the stay went on in it (a later period is written by
      // onStayContinued, or by onRefillDone while the stay is back in the room / extended; a stale count only by
      // onStayContinued); `new_fill` belongs to R3's mid-stay refill without such an event.
      const { rows } = await tx.query<{ counted: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM minibar_check WHERE reservation_id = $1 AND room_id = $2
                          AND mode = 'checkout') AS counted`,
        [primaryId, room.roomId],
      );
      out.push({ ...room, reason: rows[0]?.counted ? 'stay_continued' : 'never_counted' });
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
    const ids = await this.createRefillTasks(tx, primaryId, roomId);
    return ids[ids.length - 1] ?? null;
  }

  private async dayOf(tx: Tx, now: Date): Promise<{ tz: string; rollover: string }> {
    const { rows: tzRows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = tzRows[0]?.timezone ?? 'Asia/Ho_Chi_Minh';
    const rollover = await this.params.get<string>(tx, 'business_day_rollover', localDate(now, tz));
    return { tz, rollover };
  }

  /**
   * DOM BR-703-02 note 4 (ARC R9 invariant): one `minibar_refill` task per live count of the fridge that used
   * something (every period – a count of an earlier period included), oldest first; a count already linked is
   * skipped (a retried B18 / B13 never doubles it). A stale count (`replaced_by_check_id = id`) is not live: the
   * count replacing it carries the use. Returns the ids created.
   */
  private async createRefillTasks(tx: Tx, primaryId: string, roomId: string): Promise<string[]> {
    const { rows: counts } = await tx.query<{ id: string; used: number }>(
      `SELECT c.id, COALESCE(SUM(l.used_qty), 0)::int AS used
         FROM minibar_check c JOIN minibar_check_line l ON l.check_id = c.id
        WHERE c.reservation_id = $1 AND c.room_id = $2 AND c.mode = 'checkout'
          AND c.replaced_by_check_id IS NULL AND c.refill_task_id IS NULL
        GROUP BY c.id
       HAVING COALESCE(SUM(l.used_qty), 0) > 0
        ORDER BY max(c.created_at), c.id`,
      [primaryId, roomId],
    );
    if (counts.length === 0) return [];
    const now = this.clock.now();
    const { tz, rollover } = await this.dayOf(tx, now);
    const out: string[] = [];
    for (const check of counts) {
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
      if (!taskId) continue;
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
      out.push(taskId);
    }
    return out;
  }
}
