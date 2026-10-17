/**
 * Housekeeping / maintenance jobs (architecture 9.1 – BE-C R2 Sprint 4), registered by the module (api +
 * test-support job runner) and by the worker (plain objects, no Nest container – light dependencies only):
 *
 * - J8 `hk.daily` (daily at `daily_clean_status_time`, catch-up always): (f) open `stayover_clean` /
 *   `long_stay_clean` of an earlier day → `cancelled` `day_ended`, other open tasks of an earlier day →
 *   `carried_over`; (a) R8: every SHORT stay in house tonight (not leaving today) `OC → OD` + one
 *   `stayover_clean` (linen change every `linen_change_every_nights` nights – BR-807, ESC-008); long stays only
 *   by their cleaning plan (US-056 – R3, nothing here). (b) R3; (c) ranks are computed when read; (d) R5 is J11;
 *   (e) BR-806 is the computed "Cần chú ý" source `room_status_mismatch`. BR-424-05: the room a guest returns
 *   to today after a move "until the primary departure" is prepared as an arrival, not as a stay-over.
 * - J11 `work_order.sla` (every tick – idempotent by row conditions): R5 `VI` for `vacant_reinspect_days` →
 *   `VC` (B-03); rooms OOO today lose their open cleaning tasks (`room_blocked` – R10, also for blocks J9
 *   activated); work orders past a running deadline are notified ONCE (`work_order_overdue`: MT + FD/FDL, high
 *   also MGR/OWN), a high one of a room with a guest in house gets `remedy_suggested_at` (US-062 AC3);
 *   `waiting_parts` past its parts date is warned again (W3).
 * Business date via `business_day_rollover` (BR-010), Clock time from the runner – never SQL now().
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { JobDefinition } from '../../../jobs/job-runner';
import { type LocalDate, type LocalTime, atLocal, businessDate } from '../../../shared/time';
import type { EventsService } from '../../events/public/events.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import { type RoomReturn, roomReturnsOn } from '../../reservations/public/room-return';
import { linenChangeDue } from '../internal/rules';
import { RoomStatusService } from './room-status.service';
import { STAY_ARRIVAL_SQL } from './stay-arrival';

export const HK_DAILY_JOB_KEY = 'hk.daily';
export const WO_SLA_JOB_KEY = 'work_order.sla';

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'] as const;
const DESK = ['front_desk_lead', 'front_desk'] as const;
const MT = 'maintenance';
const CLEANING = [
  'priority_clean',
  'checkout_clean',
  'after_repair_clean',
  'stayover_clean',
  'long_stay_clean',
  'adhoc_clean',
];

async function businessToday(
  params: ParameterService,
  tx: Tx,
  now: Date,
  tz: string,
  local: LocalDate,
): Promise<LocalDate> {
  const rollover = await params.get<LocalTime>(tx, 'business_day_rollover', local);
  return businessDate(now, tz, rollover);
}

async function taskLog(
  tx: Tx,
  id: string,
  from: string,
  to: string,
  event: string,
  note: string | null,
  now: Date,
): Promise<void> {
  await tx.query(
    `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
       event_code, actor_type, actor_user_id, reason_note, occurred_at)
     VALUES ($1, $2, 'SM-14', $3, $4, $5, $6, 'system', NULL, $7, $8)`,
    [tx.ctx.organizationId, tx.ctx.propertyId, id, from, to, event, note, now],
  );
}

/** J8 – exported for tests (runs the same body as the job). */
export async function runHkDaily(
  tx: Tx,
  deps: { params: ParameterService; events: EventsService; rooms: RoomStatusService },
  now: Date,
  today: LocalDate,
): Promise<{
  dayEnded: number;
  carriedOver: number;
  stayover: number;
  markedDirty: number;
  returnPrepared: number;
}> {
  const ended = await tx.query<{ id: string; status: string }>(
    `UPDATE hk_task t SET status = 'cancelled', cancel_reason_code = 'day_ended', updated_at = $2,
            version = t.version + 1
       FROM hk_task old
      WHERE t.id = old.id AND t.due_date < $1::date AND t.status IN ('open', 'in_progress')
        AND t.type IN ('stayover_clean', 'long_stay_clean')
      RETURNING t.id, old.status`,
    [today, now],
  );
  for (const r of ended.rows) {
    await taskLog(tx, r.id, r.status, 'cancelled', 'cancel', 'day_ended', now);
    await deps.events.publish(tx, 'hk_task.changed', r.id);
  }
  const carried = await tx.query<{ id: string }>(
    `UPDATE hk_task SET carried_over = true, updated_at = $2, version = version + 1
      WHERE due_date < $1::date AND status IN ('open', 'in_progress') AND NOT carried_over
      RETURNING id`,
    [today, now],
  );
  for (const r of carried.rows) await deps.events.publish(tx, 'hk_task.changed', r.id);
  const every = await deps.params.get<number>(tx, 'linen_change_every_nights', today);
  const { rows: stays } = await tx.query<{
    room_id: string;
    reservation_id: string;
    nights: number;
  }>(
    `SELECT DISTINCT ON (s.room_id) s.room_id, r.id AS reservation_id,
            ($1::date - ${STAY_ARRIVAL_SQL}) AS nights
       FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
      WHERE s.active AND r.status = 'in_house' AND r.stay_type = 'short'
        AND s.from_date <= $1::date AND s.to_date > $1::date
        -- BR-807-01 (DOM, v0.3.8): a stay-over guest is "arrival < business date < departure" – a guest arriving
        -- today keeps OC and gets no stay-over clean, even when J8 runs late (catch-up after the check-in).
        -- The arrival of the stay (stay-arrival.ts): an extension child counts its parent's, an OTA booking its
        -- B9a night before (BUG-R2-151).
        AND ${STAY_ARRIVAL_SQL} < $1::date
      ORDER BY s.room_id, s.from_date DESC`,
    [today],
  );
  // BR-424-05 (S4-09): on the return day of a move "until the primary departure" the child's room is NOT a
  // stay-over – the guest is still in the other room and comes back later today (see prepareReturnRooms).
  const returns = await roomReturnsOn(tx, today);
  const returning = new Set(returns.map((r) => r.returnRoomId));
  let stayover = 0;
  let dirty = 0;
  for (const s of stays) {
    if (returning.has(s.room_id)) continue;
    const status = await deps.rooms.of(tx, s.room_id, today);
    if (status === 'OC') {
      await deps.rooms.set(tx, s.room_id, 'OD', { today, now, event: 'R8' });
      dirty++;
    }
    if (status === 'OOO') continue;
    const linen = linenChangeDue(every, s.nights);
    const id = uuidv7();
    const r = await tx.query<{ id: string }>(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date,
         source, linen_change, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'stayover_clean', 'open', $6, 'system', $7, $8, $8)
       ON CONFLICT DO NOTHING RETURNING id`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        s.room_id,
        s.reservation_id,
        today,
        linen,
        now,
      ],
    );
    if (r.rows[0]) {
      stayover++;
      await deps.events.publish(tx, 'hk_task.changed', id);
    }
  }
  const returnPrepared = await prepareReturnRooms(tx, deps, returns, now, today);
  return {
    dayEnded: ended.rows.length,
    carriedOver: carried.rows.length,
    stayover,
    markedDirty: dirty,
    returnPrepared,
  };
}

/**
 * BR-424-05 (S4-09, `reservations/public/room-return.ts`): the room the guest comes back to is a room WITH AN
 * ARRIVAL – clean (VC/VI, or OC) → nothing; not clean (VD/OD/CL) → its open cleaning task is due at
 * `checkout_time` (the guest leaves the other room by then), or a `priority_clean` due then when none is open.
 * Both rank "arrival today" when read (HousekeepingService.ranked). The room the guest leaves (`movedRoomId`) is
 * untouched – no VD at 07:00: the desk records the move back (`recordRoomReturn`, BE-A). Still OOO → nothing
 * (J11 cancels its cleaning). Returns the number of tasks created or re-dated.
 */
async function prepareReturnRooms(
  tx: Tx,
  deps: { params: ParameterService; events: EventsService; rooms: RoomStatusService },
  returns: readonly RoomReturn[],
  now: Date,
  today: LocalDate,
): Promise<number> {
  const pending = returns.filter((r) => !r.recorded);
  if (pending.length === 0) return 0;
  const { rows: prop } = await tx.query<{ timezone: string }>(
    'SELECT timezone FROM property WHERE id = $1',
    [tx.ctx.propertyId],
  );
  const checkout = await deps.params.get<LocalTime>(tx, 'checkout_time', today);
  const dueAt = atLocal(today, checkout, prop[0]?.timezone ?? 'Asia/Ho_Chi_Minh');
  let n = 0;
  for (const r of pending) {
    const status = await deps.rooms.of(tx, r.returnRoomId, today);
    if (!['VD', 'OD', 'CL'].includes(status)) continue;
    const { rows: open } = await tx.query<{ id: string }>(
      `UPDATE hk_task SET due_at = $3, updated_at = $4, version = version + 1
        WHERE id = (SELECT id FROM hk_task WHERE room_id = $1 AND status IN ('open', 'in_progress')
                       AND type = ANY($2::text[]) AND due_date <= $5::date
                     ORDER BY created_at LIMIT 1 FOR UPDATE)
          AND (due_at IS NULL OR due_at > $3)
        RETURNING id`,
      [r.returnRoomId, CLEANING, dueAt, now, today],
    );
    if (open[0]) {
      n++;
      await deps.events.publish(tx, 'hk_task.changed', open[0].id);
      continue;
    }
    const { rows: stillOpen } = await tx.query(
      `SELECT 1 FROM hk_task WHERE room_id = $1 AND status IN ('open', 'in_progress')
          AND type = ANY($2::text[]) AND due_date <= $3::date LIMIT 1`,
      [r.returnRoomId, CLEANING, today],
    );
    if (stillOpen.length > 0) continue; // already due by then
    const id = uuidv7();
    await tx.query(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date,
         due_at, priority_rank, source, note, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'priority_clean', 'open', $6, $7, 2, 'system', 'room_return', $8, $8)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        r.returnRoomId,
        r.childReservationId,
        today,
        dueAt,
        now,
      ],
    );
    n++;
    await deps.events.publish(tx, 'hk_task.changed', id);
  }
  return n;
}

/** J11 – exported for tests. */
export async function runWorkOrderSla(
  tx: Tx,
  deps: { params: ParameterService; events: EventsService; rooms: RoomStatusService },
  now: Date,
  today: LocalDate,
): Promise<{ reinspect: number; blockedTasks: number; overdue: number; remedy: number }> {
  // R5 (BR-805): VI for `vacant_reinspect_days` (72 h is "over") → VC.
  const days = await deps.params.get<number>(tx, 'vacant_reinspect_days', today);
  const { rows: vi } = await tx.query<{ room_id: string }>(
    `SELECT room_id FROM room_status WHERE status = 'VI' AND since <= $1 FOR UPDATE SKIP LOCKED`,
    [new Date(now.getTime() - days * 86_400_000)],
  );
  for (const r of vi) await deps.rooms.set(tx, r.room_id, 'VC', { today, now, event: 'R5' });
  // R10: rooms OOO today – their open cleaning tasks are cancelled (`room_blocked`), the assignee is told.
  const { rows: blocked } = await tx.query<{
    id: string;
    status: string;
    assigned_user_id: string | null;
    room_no: string;
  }>(
    `SELECT t.id, t.status, t.assigned_user_id, rm.room_no FROM hk_task t JOIN room rm ON rm.id = t.room_id
      WHERE t.status IN ('open', 'in_progress') AND t.type = ANY($2::text[])
        AND EXISTS (SELECT 1 FROM room_block b WHERE b.room_id = t.room_id AND b.status = 'active'
                     AND b.start_date <= $1::date AND COALESCE(b.end_date_actual, b.end_date_planned) > $1::date)
      FOR UPDATE OF t SKIP LOCKED`,
    [today, CLEANING],
  );
  for (const t of blocked) {
    await tx.query(
      `UPDATE hk_task SET status = 'cancelled', cancel_reason_code = 'room_blocked', updated_at = $2,
              version = version + 1 WHERE id = $1`,
      [t.id, now],
    );
    await taskLog(tx, t.id, t.status, 'cancelled', 'cancel', 'room_blocked', now);
    await deps.events.publish(tx, 'hk_task.changed', t.id);
    if (t.assigned_user_id) {
      await deps.events.notify(
        tx,
        {
          kind: 'hk_task_cancelled',
          userIds: [t.assigned_user_id],
          refType: 'hk_task',
          refId: t.id,
          refCode: t.room_no,
        },
        now,
      );
    }
  }
  // Work orders past a running deadline: notified once per deadline.
  const { rows: late } = await tx.query<{
    id: string;
    code: string;
    severity: string;
    room_id: string;
    resolve_due_at: Date | null;
    remedy_suggested_at: Date | null;
  }>(
    `SELECT id, code, severity, room_id, resolve_due_at, remedy_suggested_at FROM work_order
      WHERE status IN ('new', 'in_progress', 'waiting_parts') AND overdue_notified_at IS NULL
        AND ((ack_due_at IS NOT NULL AND accepted_at IS NULL AND ack_due_at <= $1)
          OR (resolve_due_at IS NOT NULL AND paused_at IS NULL AND resolve_due_at <= $1)
          OR (status = 'waiting_parts' AND parts_expected_date IS NOT NULL AND parts_expected_date < $2::date))
      ORDER BY created_at FOR UPDATE SKIP LOCKED`,
    [now, today],
  );
  let remedy = 0;
  for (const w of late) {
    await tx.query('UPDATE work_order SET overdue_notified_at = $2 WHERE id = $1', [w.id, now]);
    await deps.events.notify(
      tx,
      {
        kind: 'work_order_overdue',
        roles: w.severity === 'high' ? [MT, ...FD_PLUS] : [MT, ...DESK],
        refType: 'work_order',
        refId: w.id,
        refCode: w.code,
      },
      now,
    );
    if (
      w.severity === 'high' &&
      !w.remedy_suggested_at &&
      w.resolve_due_at &&
      w.resolve_due_at <= now
    ) {
      const occupied = await tx.query(
        `SELECT 1 FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
          WHERE s.room_id = $1 AND s.active AND r.status = 'in_house' AND s.from_date <= $2::date
            AND s.to_date >= $2::date LIMIT 1`,
        [w.room_id, today],
      );
      if (occupied.rows.length > 0) {
        await tx.query('UPDATE work_order SET remedy_suggested_at = $2 WHERE id = $1', [w.id, now]);
        remedy++;
      }
    }
    await deps.events.publish(tx, 'work_order.changed', w.id);
  }
  return { reinspect: vi.length, blockedTasks: blocked.length, overdue: late.length, remedy };
}

export function housekeepingJobs(deps: {
  params: ParameterService;
  events: EventsService;
  rooms?: RoomStatusService;
}): JobDefinition[] {
  const rooms = deps.rooms ?? new RoomStatusService(deps.events, deps.params);
  const d = { params: deps.params, events: deps.events, rooms };
  return [
    {
      key: HK_DAILY_JOB_KEY,
      schedule: { kind: 'daily', atParam: 'daily_clean_status_time', catchUp: 'always' },
      async handler(tx, ctx) {
        const today = await businessToday(deps.params, tx, ctx.now, ctx.timezone, ctx.date);
        return { ...(await runHkDaily(tx, d, ctx.now, today)) };
      },
    },
    {
      key: WO_SLA_JOB_KEY,
      schedule: { kind: 'tick' },
      async handler(tx, ctx) {
        const today = await businessToday(deps.params, tx, ctx.now, ctx.timezone, ctx.date);
        return { ...(await runWorkOrderSla(tx, d, ctx.now, today)) };
      },
    },
  ];
}

/** Worker composition (worker.ts: one import line). */
export function housekeepingWorkerJobs(deps: {
  parameters: ParameterService;
  events: EventsService;
}): JobDefinition[] {
  return housekeepingJobs({ params: deps.parameters, events: deps.events });
}
