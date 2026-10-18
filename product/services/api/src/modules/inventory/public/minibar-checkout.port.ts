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
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { type LocalDate, businessDate, localDate } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';
import type { FrontdeskMinibarPort, MinibarCheckoutStatus } from '../../frontdesk/public/ports';
import type { MinibarRefillDonePort } from '../../housekeeping/public/minibar-refill-done.port';
import { ParameterService } from '../../platform/public/parameter.service';
import {
  type FridgeItem,
  fridgeItems,
  latestFill,
  lockFridge,
  lockFridgeParents,
  lockStayFolio,
  primaryOf,
  refillFillItems,
  registerFridge,
  stayIsInRoom,
  stayRooms,
  writeFill,
} from '../internal/fridge';
import { type FridgeLock, completedAt, reconcileRefillTasks } from '../internal/refill-tasks';

@Injectable()
export class MinibarCheckoutPort implements FrontdeskMinibarPort, MinibarRefillDonePort {
  private readonly log = new Logger(MinibarCheckoutPort.name);

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /**
   * The fridge (stay × room – mô hình M-1, R1/R9) needs a count when it holds a chargeable item (its latest fill,
   * else the catalogue now – R3), and is checked when a live `checkout` count of THAT fridge exists in its current
   * period – for the fridge of the room the stay is in, a count of TODAY's business day (B18's – K11-09, DOM BR-703
   * note 7, ARC 16.19 bổ sung); the fridge of a room left keeps any live count after the mark (R9). Inside B18 the
   * fridge's writers are kept out by B18's room lock (L2 FOR UPDATE against their KEY SHARE – ARC 16.19).
   */
  async checkoutStatus(
    tx: Tx,
    reservationId: string,
    roomId: string,
  ): Promise<MinibarCheckoutStatus> {
    const primaryId = (await primaryOf(tx, reservationId)) ?? reservationId;
    const st = await this.fridgeState(tx, primaryId, roomId);
    return { required: st.required, checked: st.checked };
  }

  private async fridgeState(
    tx: Tx,
    primaryId: string,
    roomId: string,
  ): Promise<{ required: boolean; checked: boolean; live: boolean }> {
    const { fill, items } = await fridgeItems(tx, primaryId, roomId);
    // ARC R9 (BUG-R2-144): "counted" = a live count AFTER the latest mark – in the current period (a new period
    // opens when the stay goes on in a counted fridge; a count made stale is not live).
    const { rows } = await tx.query<{ business_date: string }>(
      `SELECT business_date::text AS business_date FROM minibar_check
        WHERE reservation_id = $1 AND room_id = $2 AND mode = 'checkout' AND replaced_by_check_id IS NULL
          AND fill_id IS NOT DISTINCT FROM $3::uuid
        ORDER BY created_at DESC, id DESC LIMIT 1`,
      [primaryId, roomId, fill?.id ?? null],
    );
    const live = rows[0];
    let checked = !!live;
    if (live) {
      const today = await this.today(tx, this.clock.now());
      // K11-09: the room the stay is in → the count must be of the departure day (business day of B18).
      if (live.business_date !== today && (await stayIsInRoom(tx, primaryId, roomId, today))) {
        checked = false;
      }
    }
    return { required: items.some((i) => i.priceVnd !== null), checked, live: !!live };
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
    // ARC 16.16 bổ sung: folio → fridge (B13 posts to the folio only after this port), then read under the lock.
    await lockStayFolio(tx, primaryId);
    const lock = await lockFridge(tx, primaryId, roomId);
    // ARC 16.17 1b: the tasks first (B13 → the live count with use gets its task now, as B18), then the period.
    const now = this.clock.now();
    await reconcileRefillTasks(tx, lock, {
      create: reason === 'extended',
      now,
      today: await this.today(tx, now),
      events: this.events,
    });
    if (reason === 'room_entered') {
      // (y) the stay left this room through B14 / the room return, whose onCheckedOut gave every live count with
      // use its task – one without a task here breaks that invariant: logged (ids only), no task (ORC, ARC 16.16
      // bổ sung 2).
      const { rows: orphans } = await tx.query<{ id: string }>(
        `SELECT c.id FROM minibar_check c
          WHERE c.reservation_id = $1 AND c.room_id = $2 AND c.mode = 'checkout'
            AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id)
            AND c.refill_task_id IS NULL
            AND EXISTS (SELECT 1 FROM minibar_check_line l WHERE l.check_id = c.id AND l.used_qty > 0)`,
        [primaryId, roomId],
      );
      if (orphans.length > 0) {
        this.log.warn(
          `minibar room_entered: ${orphans.length} live count(s) with use and no refill task – reservation ` +
            `${primaryId}, room ${roomId}, counts ${orphans.map((o) => o.id).join(',')}`,
        );
      }
    }
    await this.openNextPeriod(tx, lock, now);
  }

  /**
   * ARC R9 / 16.17 mục 2: a new period when the live count of the current period is charged ((t)): mark per item =
   * left after that count + Σ items of its LIVE task when that task was completed after the count – both in
   * processing time (`state_transition.occurred_at` of `complete` vs `minibar_check.created_at`); Σ > 0 → `refill`
   * (price = the catalogue now, off-catalogue items keep the period's), Σ = 0 → `carry` (mark = what was left, 0
   * kept, price of the period). A count without money → no new period; it is made stale (16.15 (v)).
   */
  private async openNextPeriod(tx: Tx, lock: FridgeLock, now: Date): Promise<void> {
    const { primaryId, roomId } = lock;
    const fill = await latestFill(tx, primaryId, roomId);
    const { rows: counts } = await tx.query<{
      id: string;
      created_at: Date;
      refill_task_id: string | null;
      charged: boolean;
    }>(
      `SELECT c.id, c.created_at, c.refill_task_id,
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
    const userId = tx.ctx.userId ?? null;
    if (!count.charged) {
      // A count of nothing chargeable used: the period goes on, the count must be taken again (it replaces this
      // one). ARC 16.15 (v): the only writer of the self-reference; no query follows it recursively.
      await tx.query('UPDATE minibar_check SET replaced_by_check_id = id WHERE id = $1', [
        count.id,
      ]);
      return;
    }
    // The live task of the period (I2), completed after the count in processing time (BUG-R2-163).
    const refill = new Map<string, number>();
    let doneAt: Date | null = null;
    if (count.refill_task_id) {
      const { rows } = await tx.query<{
        status: string;
        done_at: Date | null;
        refill_items: Array<{ itemId: string; quantity: number }> | null;
      }>(`SELECT status, done_at, refill_items FROM hk_task WHERE id = $1`, [count.refill_task_id]);
      const t = rows[0];
      const completed = t?.status === 'done' ? await completedAt(tx, count.refill_task_id) : null;
      if (t && completed && completed.getTime() > count.created_at.getTime()) {
        for (const r of Array.isArray(t.refill_items) ? t.refill_items : []) {
          const q = Number(r.quantity);
          if (q > 0) refill.set(r.itemId, (refill.get(r.itemId) ?? 0) + q);
        }
        doneAt = t.done_at;
      }
    }
    if (refill.size > 0) {
      const items = await refillFillItems(tx, fill?.id ?? null, count.id, refill);
      if (items.length > 0) {
        await writeFill(tx, {
          primaryId,
          roomId,
          // filled_at = when HK did it (display only – 16.17 mục 2); the order of periods is created_at.
          at: doneAt ?? now,
          now,
          userId,
          items,
          source: 'refill',
        });
        return;
      }
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
    // ARC 16.16 bổ sung: HK task (locked by setTaskStatus) → fridge; the fill and the latest count are read after.
    await lockFridgeParents(tx, primaryId, task.roomId); // E2: L4 (held) → L1/L2 KEY SHARE → L5
    await lockFridge(tx, primaryId, task.roomId);
    // ARC 16.17 I2: only the LIVE task of a period (a live count – a stale one included – points to it) refills;
    // a task left on a replaced count adds nothing to a mark (BUG-R2-159).
    const { rows: liveRows } = await tx.query<{ live: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM minibar_check c
                       WHERE c.refill_task_id = $1 AND c.mode = 'checkout'
                         AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id)) AS live`,
      [task.id],
    );
    if (!liveRows[0]?.live) return;
    const today = await this.today(tx, at.now);
    if (!(await stayIsInRoom(tx, primaryId, task.roomId, today))) return;
    const userId = tx.ctx.userId ?? null;
    await registerFridge(tx, { primaryId, roomId: task.roomId, now: at.now, userId });
    const fill = await latestFill(tx, primaryId, task.roomId);
    const { rows: lastRows } = await tx.query<{ id: string; stale: boolean }>(
      `SELECT id, replaced_by_check_id = id AS stale FROM minibar_check
        WHERE reservation_id = $1 AND room_id = $2 AND mode = 'checkout'
          AND fill_id IS NOT DISTINCT FROM $3::uuid
          AND (replaced_by_check_id IS NULL OR replaced_by_check_id = id)
        ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE`,
      [primaryId, task.roomId, fill?.id ?? null],
    );
    const last = lastRows[0];
    const refill = new Map<string, number>();
    for (const r of task.refillItems) refill.set(r.itemId, (refill.get(r.itemId) ?? 0) + r.qty);
    const items = await refillFillItems(tx, fill?.id ?? null, last?.id ?? null, refill);
    if (items.length === 0) return;
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
      reason: 'never_counted' | 'stay_continued' | 'new_fill' | 'not_today';
    }>
  > {
    const primaryId = (await primaryOf(tx, reservationId)) ?? reservationId;
    const now = this.clock.now();
    const { tz, rollover } = await this.dayOf(tx, now);
    const out: Array<{
      roomId: string;
      roomNo: string;
      reason: 'never_counted' | 'stay_continued' | 'new_fill' | 'not_today';
    }> = [];
    for (const room of await stayRooms(tx, primaryId, businessDate(now, tz, rollover))) {
      const st = await this.fridgeState(tx, primaryId, room.roomId);
      if (!st.required || st.checked) continue;
      // K11-09 (ARC 16.19 bổ sung): counted in the current period, but not on the departure day.
      if (st.live) {
        out.push({ ...room, reason: 'not_today' });
        continue;
      }
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
    // ARC 16.16 bổ sung: folio (held by B18 / B14 / record already) → fridge.
    await lockStayFolio(tx, primaryId);
    const lock = await lockFridge(tx, primaryId, roomId);
    const now = this.clock.now();
    // R1/R9: the fridge of the room left (B14) stays a fridge of the stay (count it later with `roomId`).
    await registerFridge(tx, { primaryId, roomId, now, userId: tx.ctx.userId ?? null });
    // ARC 16.17 I3: the fridge is closed for the stay – every period's live count with use has its live task.
    const before = new Set(await this.openRefillTaskIds(tx, lock));
    await reconcileRefillTasks(tx, lock, {
      create: true,
      now,
      today: await this.today(tx, now),
      events: this.events,
    });
    // The port's contract (BE-A, `createdTaskIds` of B18): the task created by THIS call – a retried B18 or a
    // fridge whose task already exists gives null.
    const created = (await this.openRefillTaskIds(tx, lock)).filter((id) => !before.has(id));
    return created[created.length - 1] ?? null;
  }

  private async openRefillTaskIds(tx: Tx, lock: FridgeLock): Promise<string[]> {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM hk_task
        WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill'
          AND status IN ('open', 'in_progress')
        ORDER BY created_at, id`,
      [lock.primaryId, lock.roomId],
    );
    return rows.map((r) => r.id);
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

  private async today(tx: Tx, now: Date): Promise<LocalDate> {
    const { tz, rollover } = await this.dayOf(tx, now);
    return businessDate(now, tz, rollover);
  }
}
