/**
 * Minibar refill tasks per PERIOD of a fridge (ARC `openapi-0.3.7.md` 16.17, BUG-R2-159/163, DOM BR-703-02 note 4).
 * Invariants:
 * - I1 – a period (the `fill_id` of the fridge's counts) has at most ONE open `minibar_refill` task;
 * - I2 – the live task of a period = the task its live count points to (`refill_task_id`; a count made stale – "used
 *   0, count again" – is live); a task only a replaced count points to is not live (never open, never added to a
 *   mark by onRefillDone);
 * - I3 – once the fridge is "closed" for the stay (B14/B18 left, B13 after a charged count), its live count with use
 *   has exactly one live task, whose `refill_items` = what is still to refill = max(0, used of the live count − Σ
 *   items of the DONE tasks of the period) per item;
 * - I4 – only reconcileRefillTasks writes system `minibar_refill` tasks and `minibar_check.refill_task_id`, always
 *   under lockFridge (the FridgeLock it takes is the proof).
 * Plain SQL in the caller's transaction (RLS by property). Order of tasks: created_at, id (server time).
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import type { EventsService } from '../../events/public/events.service';
import { publishEvent } from '../../platform/public/staff-notify';
import { latestFill } from './fridge';

/** Proof that lockFridge(tx, primaryId, roomId) was taken in this transaction (lockFridge returns it). */
export type FridgeLock = {
  readonly primaryId: string;
  readonly roomId: string;
  readonly __brand: 'FridgeLock';
};

/** Low priority: refill after the checkout clean (desk TASK_RANK.low). */
const REFILL_RANK = 7;

/** Cancel notes (constants – traceable): the live count used nothing / a second open task of one period. */
export const RECOUNT_ZERO_NOTE = 'minibar_recount_zero';
export const DUPLICATE_REFILL_NOTE = 'minibar_duplicate_refill';

interface TaskRow {
  id: string;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  refill_items: Array<{ itemId: string; quantity: number; itemName?: string }> | null;
  quantity: number;
}

const itemsOf = (raw: TaskRow['refill_items']): Map<string, number> => {
  const out = new Map<string, number>();
  for (const r of Array.isArray(raw) ? raw : []) {
    const q = Number(r?.quantity);
    if (typeof r?.itemId === 'string' && Number.isFinite(q) && q > 0) {
      out.set(r.itemId, (out.get(r.itemId) ?? 0) + q);
    }
  }
  return out;
};

const sameItems = (a: Map<string, number>, b: Map<string, number>) =>
  a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

/**
 * The only writer of system `minibar_refill` tasks and of `minibar_check.refill_task_id` (ARC 16.17 I1–I4).
 * For every period of the fridge that has a live count: done = Σ items of DONE tasks of the period's counts,
 * need = max(0, used of the live count − done) per item.
 *  - need empty → cancel every open task of the period (`reservation_changed`, note `minibar_recount_zero`);
 *    the live count points to the latest done task of the period (or null).
 *  - an open task exists → keep the newest, set its `refill_items`/`quantity` = need, cancel the other open ones
 *    (note `minibar_duplicate_refill`), point the live count to it (transfer from the replaced count).
 *  - no open task and `create` → insert one task with need (as B18 does), point the live count to it.
 * Returns the live open task id of the CURRENT period (null when none). `today` = due date of a created task;
 * `events` = SSE `hk_task.changed` (optional, like the callers' own).
 */
export async function reconcileRefillTasks(
  tx: Tx,
  lock: FridgeLock,
  opts: { create: boolean; now: Date; today: LocalDate; events?: EventsService | undefined },
): Promise<string | null> {
  const { primaryId, roomId } = lock;
  const current = await latestFill(tx, primaryId, roomId);
  const { rows: lives } = await tx.query<{
    id: string;
    fill_id: string | null;
    refill_task_id: string | null;
  }>(
    `SELECT c.id, c.fill_id, c.refill_task_id FROM minibar_check c
      WHERE c.reservation_id = $1 AND c.room_id = $2 AND c.mode = 'checkout'
        AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id)
      ORDER BY c.created_at, c.id`,
    [primaryId, roomId],
  );
  let currentTask: string | null = null;
  for (const live of lives) {
    const { rows: usedRows } = await tx.query<{ item_id: string; used_qty: number }>(
      'SELECT item_id, used_qty FROM minibar_check_line WHERE check_id = $1 AND used_qty > 0',
      [live.id],
    );
    // Tasks of the period = the tasks its counts (live or replaced) point to, oldest first.
    const { rows: tasks } = await tx.query<TaskRow>(
      `SELECT t.id, t.status, t.refill_items, t.quantity FROM hk_task t
        WHERE t.type = 'minibar_refill'
          AND t.id IN (SELECT k.refill_task_id FROM minibar_check k
                        WHERE k.reservation_id = $1 AND k.room_id = $2 AND k.mode = 'checkout'
                          AND k.fill_id IS NOT DISTINCT FROM $3::uuid AND k.refill_task_id IS NOT NULL)
        ORDER BY t.created_at, t.id`,
      [primaryId, roomId, live.fill_id],
    );
    const done = new Map<string, number>();
    for (const t of tasks.filter((x) => x.status === 'done')) {
      for (const [k, v] of itemsOf(t.refill_items)) done.set(k, (done.get(k) ?? 0) + v);
    }
    const need = new Map<string, number>();
    for (const u of usedRows) {
      const q = Number(u.used_qty) - (done.get(u.item_id) ?? 0);
      if (q > 0) need.set(u.item_id, q);
    }
    const open = tasks.filter((x) => x.status === 'open' || x.status === 'in_progress');
    let liveTask: string | null;
    if (need.size === 0) {
      for (const t of open) await cancelTask(tx, t, RECOUNT_ZERO_NOTE, opts);
      const lastDone = tasks.filter((x) => x.status === 'done').at(-1);
      await pointTo(tx, live.id, live.refill_task_id, lastDone?.id ?? null);
      liveTask = null;
    } else if (open.length > 0) {
      const keep = open[open.length - 1] as TaskRow;
      for (const t of open.slice(0, -1)) await cancelTask(tx, t, DUPLICATE_REFILL_NOTE, opts);
      // UXR P-04: a task written before the item names were kept gets them at its next reconcile too.
      const named = (keep.refill_items ?? []).every((r) => typeof r?.itemName === 'string');
      if (
        (!sameItems(itemsOf(keep.refill_items), need) || !named) &&
        (await lockOpenTask(tx, keep.id))
      ) {
        await tx.query(
          `UPDATE hk_task SET refill_items = $2, quantity = $3, updated_at = $4, version = version + 1
            WHERE id = $1`,
          [keep.id, await refillItemsJson(tx, need), total(need), opts.now],
        );
        await publishEvent(tx, opts.events, 'hk_task.changed', keep.id);
      }
      await pointTo(tx, live.id, live.refill_task_id, keep.id);
      liveTask = keep.id;
    } else if (opts.create) {
      const id = await insertTask(tx, lock, need, opts);
      await pointTo(tx, live.id, live.refill_task_id, id);
      liveTask = id;
    } else {
      liveTask = null;
    }
    if ((live.fill_id ?? null) === (current?.id ?? null)) currentTask = liveTask;
  }
  return currentTask;
}

const total = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
/**
 * `hk_task.refill_items` = what to refill, with the item's name as it is now (UXR P-04: the HK PWA showed "1, 1"
 * without names – `HkTask.refillItems[].itemName` comes straight from this JSON). Sorted by item id.
 */
async function refillItemsJson(tx: Tx, m: Map<string, number>): Promise<string> {
  const ids = [...m.keys()].sort();
  const { rows } = await tx.query<{ id: string; name: string }>(
    'SELECT id, name FROM item WHERE id = ANY($1::uuid[])',
    [ids],
  );
  const names = new Map(rows.map((r) => [r.id, r.name]));
  return JSON.stringify(
    ids.map((itemId) => ({
      itemId,
      quantity: m.get(itemId) as number,
      ...(names.has(itemId) ? { itemName: names.get(itemId) } : {}),
    })),
  );
}

async function pointTo(
  tx: Tx,
  checkId: string,
  was: string | null,
  taskId: string | null,
): Promise<void> {
  if (was === taskId) return;
  await tx.query('UPDATE minibar_check SET refill_task_id = $2 WHERE id = $1', [checkId, taskId]);
}

/**
 * Lock an existing task before writing it, without waiting (lock order: a HK task is locked BEFORE a fridge –
 * HousekeepingService holds its task, then onRefillDone waits for the fridge): busy → 55P03 → 409
 * CONCURRENT_UPDATE, retried by the client. record() locked the open tasks before the fridge already (no wait).
 * False when the task is not open any more (finished / cancelled meanwhile) – then it is left as it is.
 */
async function lockOpenTask(tx: Tx, taskId: string): Promise<'open' | 'in_progress' | null> {
  const { rows } = await tx.query<{ status: string }>(
    'SELECT status FROM hk_task WHERE id = $1 FOR UPDATE NOWAIT',
    [taskId],
  );
  const st = rows[0]?.status;
  return st === 'open' || st === 'in_progress' ? st : null;
}

async function cancelTask(
  tx: Tx,
  t: TaskRow,
  note: string,
  opts: { now: Date; events?: EventsService | undefined },
): Promise<void> {
  const from = await lockOpenTask(tx, t.id);
  if (!from) return;
  await tx.query(
    `UPDATE hk_task SET status = 'cancelled', cancel_reason_code = 'reservation_changed', cancel_note = $2,
            updated_at = $3, version = version + 1
      WHERE id = $1`,
    [t.id, note, opts.now],
  );
  // SM-14 history like HousekeepingService.setTaskStatus (system cancel).
  await tx.query(
    `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
       event_code, actor_type, actor_user_id, reason_note, occurred_at, performed_at)
     VALUES ($1, $2, 'SM-14', $3, $4, 'cancelled', 'cancel', $5, $6, $7, $8, $8)`,
    [
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      t.id,
      from,
      tx.ctx.actorType,
      tx.ctx.actorType === 'user' ? tx.ctx.userId : null,
      note,
      opts.now,
    ],
  );
  await publishEvent(tx, opts.events, 'hk_task.changed', t.id);
}

async function insertTask(
  tx: Tx,
  lock: FridgeLock,
  need: Map<string, number>,
  opts: { now: Date; today: LocalDate; events?: EventsService | undefined },
): Promise<string> {
  const id = uuidv7();
  await tx.query(
    `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, quantity, status,
       due_date, priority_rank, source, refill_items, created_at, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'minibar_refill', $6, 'open', $7, $8, 'system', $11, $9, $10, $9)`,
    [
      id,
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      lock.roomId,
      lock.primaryId,
      total(need),
      opts.today,
      REFILL_RANK,
      opts.now,
      tx.ctx.userId ?? null,
      await refillItemsJson(tx, need),
    ],
  );
  await tx.query(
    `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
     VALUES ($1, $2, $3, 'hk_task.changed', $4, $5)`,
    [
      uuidv7(),
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      JSON.stringify({ taskId: id, reservationId: lock.primaryId }),
      `hk_task.changed:${id}:${uuidv7()}`,
    ],
  );
  await publishEvent(tx, opts.events, 'hk_task.changed', id);
  return id;
}

/**
 * ARC 16.17 mục 2 – processing time of a task's completion: `state_transition.occurred_at` of its `complete`
 * (never `hk_task.done_at` / `performedAt` – the time HK did it, for display only). Null = not completed.
 */
export async function completedAt(tx: Tx, taskId: string): Promise<Date | null> {
  const { rows } = await tx.query<{ at: Date }>(
    `SELECT max(occurred_at) AS at FROM state_transition
      WHERE machine = 'SM-14' AND entity_id = $1 AND event_code = 'complete'`,
    [taskId],
  );
  return rows[0]?.at ?? null;
}
