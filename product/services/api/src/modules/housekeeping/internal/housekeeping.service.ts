/**
 * Housekeeping (EP07 – US-052…055; OpenAPI 0.3.7 nhóm H, B-02…B-07, B-14; BE-C R2 Sprint 4):
 * - listRoomStatuses / transitionRoomStatus (SM-03 R1/R2/R3/R8 – R4 is the inspection, R5 is read-time + J11);
 * - listHkTasks / createHkTask / transitionHkTask (SM-14, BR-807 ranks computed when read);
 * - getInspectionChecklist / recordInspection / listInspections (BR-808, R4).
 * HK row scope T (EP07 0, DOM D-12 a): rooms with a task of today assigned to the caller or to nobody. Rooms
 * outside it are listed (status, arrival yes/no + time) without any guest name; writes there → 404.
 * MT reads only (no guest name – D01 is denied by the serializer as well). C3 never appears here (SR-DEV-09).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { RoomStatusCode } from '../../../db/schema/frontdesk';
import { HK_TASK_TYPES, type HkTaskType } from '../../../db/schema/reservations';
import { decodeCursor, page, parseLimit } from '../../../shared/http/pagination';
import { type FieldError, problem } from '../../../shared/problem';
import { type LocalDate, addDays, atLocal } from '../../../shared/time';
import { assertNoCardNumber, stripControlChars } from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';
import { AttachmentService } from '../../files/public/attachment.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { roomReturnsOn } from '../../reservations/public/room-return';
import {
  GUEST_REQUEST_STATUS_PORT,
  type GuestRequestStatusPort,
} from '../public/guest-request-work.port';
import { RoomStatusService } from '../public/room-status.service';
import {
  type ChecklistItemDef,
  type ChecklistLocale,
  DEFAULT_CHECKLIST,
  EXTRA_KIT_CODE,
  extraKitItem,
  parseChecklist,
} from './checklist';
import {
  CLEAN_TYPES,
  FDL_PLUS,
  FD_PLUS,
  HK,
  HK_CANCELLABLE,
  MANUAL_TASK_TYPES,
  type RoomAction,
  type RoomEvent,
  STATUS_LABEL,
  allowedEvents,
  has,
  isHkOnly,
  matchesFilter,
  performedAtInRange,
  priorityRank,
  roomTarget,
} from './rules';

export interface HkActor {
  userId: string;
  roles: readonly string[];
  requestId?: string;
}

export interface HkCtx {
  actor: HkActor;
  now: Date;
  today: LocalDate;
  tz: string;
  iso(instant: Date): string;
}

interface RoomRow {
  id: string;
  room_no: string;
  name: string | null;
  floor: number | null;
  group_code: string;
  since: Date | null;
  version: number | null;
  created_at: Date;
}

export interface TaskRow {
  id: string;
  room_id: string;
  room_no: string;
  room_name: string | null;
  reservation_id: string | null;
  reservation_status: string | null;
  type: HkTaskType;
  quantity: number;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  due_at: Date | null;
  due_date: string;
  window_start: string | null;
  window_end: string | null;
  not_before_time: string | null;
  assigned_user_id: string | null;
  source: 'system' | 'manual' | 'guest_app';
  guest_request_id: string | null;
  note: string | null;
  refill_items: unknown;
  done_at: Date | null;
  cancel_reason_code: string | null;
  cancel_note: string | null;
  linen_change: boolean;
  carried_over: boolean;
  created_at: Date;
  version: number;
}

const TASK_COLUMNS = `t.id, t.room_id, rm.room_no, rm.name AS room_name, t.reservation_id, r.status AS reservation_status,
  t.type, t.quantity, t.status, t.due_at, t.due_date::text AS due_date, to_char(t.window_start, 'HH24:MI') AS window_start,
  to_char(t.window_end, 'HH24:MI') AS window_end,
  to_char(COALESCE(t.not_before_time, CASE WHEN t.type = 'checkout_clean' THEN r.agreed_checkout_time END), 'HH24:MI')
    AS not_before_time,
  t.assigned_user_id, t.source, t.guest_request_id, t.note, t.refill_items, t.done_at, t.cancel_reason_code,
  t.cancel_note, t.linen_change, t.carried_over, t.created_at, t.version`;
const TASK_FROM = `hk_task t JOIN room rm ON rm.id = t.room_id LEFT JOIN reservation r ON r.id = t.reservation_id`;
// S4-31 (US-029 AC4, EP07 3.1): a check-out clean shows "dọn sau <giờ trả>" – the checkout time agreed at B15 /
// US-030 (read from the booking when B18 created the task without one).

/** Tasks of the business day `d`: due that day, or still open from an earlier day (carried over). */
const OF_DAY = `(t.due_date = $1::date OR (t.due_date < $1::date AND t.status IN ('open', 'in_progress')))`;

const VIP = new Set(['vip', 'khach quen', 'khách quen', 'returning', 'regular']);

interface InspectionRow {
  id: string;
  room_id: string;
  result: 'pass' | 'fail';
  self_inspection: boolean;
  inspected_at: Date;
  inspected_by_name: string;
  checklist_version: number;
  items: Array<{ code: string; passed: boolean; note?: string }>;
  photo_attachment_ids: string[];
  room_status_after: RoomStatusCode;
  redo_task_id: string | null;
}

@Injectable()
export class HousekeepingService {
  constructor(
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(RoomStatusService) private readonly rooms: RoomStatusService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AttachmentService) private readonly attachments: AttachmentService,
    @Optional()
    @Inject(GUEST_REQUEST_STATUS_PORT)
    private readonly guestRequests?: GuestRequestStatusPort,
  ) {}

  async ctx(tx: Tx, actor: HkActor): Promise<HkCtx> {
    const p = await this.property.now(tx);
    return { actor, now: p.now, today: p.today, tz: p.timezone, iso: p.iso };
  }

  // ───────────────────────── scope T ─────────────────────────

  /** Rooms in the HK scope T of the business day (assigned to the caller or unassigned, not cancelled). */
  async scopeRooms(tx: Tx, c: HkCtx): Promise<Set<string>> {
    const { rows } = await tx.query<{ room_id: string }>(
      `SELECT DISTINCT t.room_id FROM hk_task t
        WHERE ${OF_DAY} AND t.status <> 'cancelled'
          AND (t.assigned_user_id IS NULL OR t.assigned_user_id = $2)`,
      [c.today, c.actor.userId],
    );
    return new Set(rows.map((r) => r.room_id));
  }

  private async inScope(tx: Tx, c: HkCtx, roomId: string): Promise<boolean> {
    if (!isHkOnly(c.actor.roles)) return true;
    return (await this.scopeRooms(tx, c)).has(roomId);
  }

  // ───────────────────────── room statuses (US-052, US-053) ─────────────────────────

  /** BR-805 at read time (B-03): VI for `vacant_reinspect_days` (72 h is "over") reads VC from that moment. */
  private async r5(tx: Tx, c: HkCtx): Promise<number> {
    return this.params.get<number>(tx, 'vacant_reinspect_days', c.today);
  }

  async listRoomStatuses(tx: Tx, c: HkCtx, filterRaw: string | undefined) {
    const filter = (filterRaw ?? 'all') as 'all' | 'needs_cleaning' | 'occupied' | 'ready';
    if (!['all', 'needs_cleaning', 'occupied', 'ready'].includes(filter)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'filter', code: 'NOT_IN_LIST' }] });
    }
    const rooms = await this.roomRows(tx, c);
    const status = await this.rooms.current(
      tx,
      rooms.map((r) => r.id),
      c.today,
    );
    const days = await this.r5(tx, c);
    const self = await this.params.get<boolean>(tx, 'hk_self_inspection_enabled', c.today);
    const hkOnly = isHkOnly(c.actor.roles);
    const scope = hkOnly ? await this.scopeRooms(tx, c) : null;
    const desk = has(c.actor.roles, FD_PLUS);
    const named = (roomId: string) => desk || (hkOnly && !!scope?.has(roomId));
    const inHouse = await this.inHouseByRoom(tx, c.today);
    const arrivals = await this.nextArrivals(tx, c.today);
    const failed = await this.failedRooms(tx);
    const tasks = await this.openTasksByRoom(tx, c);
    const out: Array<Record<string, unknown> & { _rank: number; _no: string }> = [];
    for (const r of rooms) {
      let st = status.get(r.id) ?? 'VC';
      let since = r.since ?? r.created_at;
      if (st === 'VI' && r.since && r.since.getTime() + days * 86_400_000 <= c.now.getTime()) {
        st = 'VC';
        since = new Date(r.since.getTime() + days * 86_400_000);
      }
      const stay = inHouse.get(r.id);
      if (!matchesFilter(filter, st, !!stay)) continue;
      const next = arrivals.get(r.id);
      const own = tasks.get(r.id) ?? [];
      out.push({
        roomId: r.id,
        roomNo: r.room_no,
        roomName: r.name,
        ...(r.floor !== null ? { floor: r.floor } : {}),
        roomGroupCode: r.group_code,
        status: st,
        statusLabel: STATUS_LABEL[st],
        since: c.iso(since),
        ...(stay && named(r.id) ? { currentGuest: `${stay.name} · ${r.room_no}` } : {}),
        ...(next
          ? {
              nextArrival: {
                date: next.date,
                ...(next.eta ? { etaTime: next.eta } : {}),
                ...(named(r.id) ? { guestDisplayName: next.name } : {}),
              },
            }
          : {}),
        ...(stay && named(r.id) && stay.serviceNotes.length > 0
          ? { serviceNotes: stay.serviceNotes }
          : {}),
        allowedEvents: allowedEvents(st, c.actor.roles, {
          inScope: !hkOnly || !!scope?.has(r.id),
          selfInspection: self,
        }),
        openTaskIds: own.map((t) => t.id),
        inspectionFailed: failed.has(r.id),
        version: r.version ?? 0,
        _rank: own[0]?.rank ?? 99,
        _no: r.room_no,
      });
    }
    out.sort((a, b) => a._rank - b._rank || a._no.localeCompare(b._no));
    return {
      asOf: c.iso(c.now),
      data: out.map((row) => {
        const { _rank: rank, _no: no, ...rest } = row;
        void rank;
        void no;
        return rest;
      }),
    };
  }

  private async roomRows(tx: Tx, c: HkCtx, roomId?: string): Promise<RoomRow[]> {
    const { rows } = await tx.query<RoomRow>(
      `SELECT rm.id, rm.room_no, rm.name, rm.floor, g.code AS group_code, rs.since, rs.version, rm.created_at
         FROM room rm JOIN room_group g ON g.id = rm.room_group_id
         LEFT JOIN room_status rs ON rs.room_id = rm.id
        WHERE rm.active_from <= $1::date AND (rm.active_to IS NULL OR rm.active_to > $1::date)
          AND ($2::uuid IS NULL OR rm.id = $2::uuid)
        ORDER BY rm.room_no`,
      [c.today, roomId ?? null],
    );
    return rows;
  }

  /** In-house bookings per room today (the guest is in the room until checked out). */
  private async inHouseByRoom(
    tx: Tx,
    today: LocalDate,
  ): Promise<
    Map<
      string,
      {
        reservationId: string;
        name: string;
        stayType: string;
        serviceNotes: string[];
        vip: boolean;
      }
    >
  > {
    const { rows } = await tx.query<{
      room_id: string;
      reservation_id: string;
      full_name: string;
      stay_type: string;
      service_notes: string[] | null;
      tags: string[] | null;
    }>(
      `SELECT DISTINCT ON (s.room_id) s.room_id, r.id AS reservation_id, g.full_name, r.stay_type,
              g.service_notes, g.tags
         FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
         JOIN guest g ON g.id = r.booker_guest_id
        WHERE s.active AND r.status = 'in_house' AND s.from_date <= $1::date AND s.to_date >= $1::date
        ORDER BY s.room_id, s.to_date DESC`,
      [today],
    );
    return new Map(
      rows.map((r) => [
        r.room_id,
        {
          reservationId: r.reservation_id,
          name: r.full_name,
          stayType: r.stay_type,
          serviceNotes: r.service_notes ?? [],
          vip: (r.tags ?? []).some((t) => VIP.has(t.trim().toLowerCase())),
        },
      ]),
    );
  }

  private async nextArrivals(
    tx: Tx,
    today: LocalDate,
  ): Promise<Map<string, { date: string; eta: string | null; name: string }>> {
    const { rows } = await tx.query<{
      room_id: string;
      from_date: string;
      eta: string | null;
      full_name: string;
    }>(
      `SELECT DISTINCT ON (s.room_id) s.room_id, s.from_date::text AS from_date,
              to_char(r.eta_time, 'HH24:MI') AS eta, g.full_name
         FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
         JOIN guest g ON g.id = r.booker_guest_id
        WHERE s.active AND r.status IN ('hold', 'confirmed') AND s.from_date >= $1::date
        ORDER BY s.room_id, s.from_date`,
      [today],
    );
    return new Map(
      rows.map((r) => [r.room_id, { date: r.from_date, eta: r.eta, name: r.full_name }]),
    );
  }

  /** `inspectionFailed`: the latest inspection of the room is `fail` (no pass after it). */
  private async failedRooms(tx: Tx): Promise<Set<string>> {
    const { rows } = await tx.query<{ room_id: string }>(
      `SELECT room_id FROM (
         SELECT DISTINCT ON (room_id) room_id, result FROM inspection ORDER BY room_id, inspected_at DESC, id DESC
       ) x WHERE result = 'fail'`,
    );
    return new Set(rows.map((r) => r.room_id));
  }

  private async openTasksByRoom(
    tx: Tx,
    c: HkCtx,
  ): Promise<Map<string, Array<{ id: string; rank: number }>>> {
    const ranked = await this.ranked(
      tx,
      c,
      (await this.taskRows(tx, c.today)).filter(
        (t) => t.status === 'open' || t.status === 'in_progress',
      ),
    );
    const out = new Map<string, Array<{ id: string; rank: number }>>();
    for (const t of ranked) {
      const list = out.get(t.row.room_id) ?? [];
      list.push({ id: t.row.id, rank: t.rank });
      out.set(t.row.room_id, list);
    }
    return out;
  }

  async transitionRoomStatus(
    tx: Tx,
    c: HkCtx,
    roomId: string,
    body: { event: RoomEvent; expectedFrom: RoomStatusCode; performedAt: Date; taskId?: string },
  ) {
    const [room] = await this.roomRows(tx, c, roomId);
    if (!room) throw problem('NOT_FOUND');
    // EP07 2.3: scope T before anything else – a room outside it does not exist for that HK.
    if (!(await this.inScope(tx, c, roomId))) throw problem('NOT_FOUND');
    await tx.query('SELECT 1 FROM room WHERE id = $1 FOR UPDATE', [roomId]);
    const current = await this.statusOf(tx, c, roomId);
    if (
      !performedAtInRange(body.performedAt, c.now) ||
      body.performedAt.getTime() < current.since.getTime()
    ) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' }],
      });
    }
    if (body.expectedFrom !== current.status) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: current.status } });
    }
    const inHouse = (await this.inHouseByRoom(tx, c.today)).has(roomId);
    const target = roomTarget(current.status, body.event, inHouse);
    if (!target) throw problem('INVALID_TRANSITION', { extras: { currentState: current.status } });
    const roomTasks = (await this.taskRows(tx, c.today, { roomId })).filter(
      (t) => t.status === 'open' || t.status === 'in_progress',
    );
    let task: TaskRow | null = null;
    if (body.taskId) {
      task = roomTasks.find((t) => t.id === body.taskId) ?? null;
      if (!task) {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'taskId', code: 'NOT_IN_LIST' }] });
      }
    } else {
      const ranked = await this.ranked(
        tx,
        c,
        roomTasks.filter((t) => CLEAN_TYPES.includes(t.type)),
      );
      task = ranked[0]?.row ?? null;
    }
    await this.rooms.set(tx, roomId, target.to, {
      today: c.today,
      now: c.now,
      event: target.code,
      performedAt: body.performedAt,
    });
    if (body.event === 'start_cleaning') {
      // R1 without a task (nothing generated yet) → an ad-hoc one, so the work is visible on the desk.
      if (!task) {
        task = await this.insertTask(tx, c, {
          roomId,
          reservationId: null,
          type: 'adhoc_clean',
          dueDate: c.today,
          source: 'manual',
          note: null,
        });
      }
      if (task.status === 'open')
        await this.setTaskStatus(tx, c, task, 'in_progress', body.performedAt);
    } else if (body.event === 'finish_cleaning') {
      // US-053 AC2: the first open cleaning task of the room is done.
      if (task) await this.setTaskStatus(tx, c, task, 'done', body.performedAt);
      if (
        target.to === 'VC' &&
        !(await this.params.get<boolean>(tx, 'hk_self_inspection_enabled', c.today))
      ) {
        await this.events.notify(
          tx,
          {
            kind: 'room_awaiting_inspection',
            roles: FDL_PLUS,
            refType: 'hk_task',
            refId: task?.id ?? roomId,
            refCode: room.room_no,
          },
          c.now,
        );
      }
    } else if (!roomTasks.some((t) => t.type === 'stayover_clean')) {
      // R8a: OC → OD with a stay-over cleaning task (one per room and day – hk_task_clean_uk).
      const stay = (await this.inHouseByRoom(tx, c.today)).get(roomId);
      await this.insertTask(tx, c, {
        roomId,
        reservationId: stay?.reservationId ?? null,
        type: 'stayover_clean',
        dueDate: c.today,
        source: 'manual',
        note: null,
      });
    }
    return this.roomEntry(tx, c, roomId);
  }

  private async statusOf(
    tx: Tx,
    c: HkCtx,
    roomId: string,
  ): Promise<{ status: RoomStatusCode; since: Date }> {
    const [room] = await this.roomRows(tx, c, roomId);
    if (!room) throw problem('NOT_FOUND');
    let status = await this.rooms.of(tx, roomId, c.today);
    let since = room.since ?? room.created_at;
    const days = await this.r5(tx, c);
    if (
      status === 'VI' &&
      room.since &&
      room.since.getTime() + days * 86_400_000 <= c.now.getTime()
    ) {
      // R5 not yet written by J11: materialise it before the next transition (VI → VC).
      await this.rooms.set(tx, roomId, 'VC', { today: c.today, now: c.now, event: 'R5' });
      status = 'VC';
      since = c.now;
    }
    return { status, since };
  }

  private async roomEntry(tx: Tx, c: HkCtx, roomId: string): Promise<Record<string, unknown>> {
    const all = await this.listRoomStatuses(tx, c, 'all');
    const entry = all.data.find((r) => r.roomId === roomId);
    if (!entry) throw problem('NOT_FOUND');
    return entry;
  }

  /**
   * R10 (SM-02 O1/O2): the room is OOO from today – its open cleaning tasks are cancelled (`room_blocked`); the
   * HK they were assigned to is told (`hk_task_cancelled`). Idempotent (J11 calls it for blocks J9 activated).
   */
  async onRoomBlocked(tx: Tx, c: Omit<HkCtx, 'iso' | 'tz'>, roomId: string): Promise<number> {
    const { rows } = await tx.query<TaskRow>(
      `SELECT ${TASK_COLUMNS} FROM ${TASK_FROM}
        WHERE t.room_id = $1 AND t.status IN ('open', 'in_progress') AND t.type = ANY($2::text[])
        FOR UPDATE OF t`,
      [roomId, [...CLEAN_TYPES.filter((x) => x !== 'guest_request')]],
    );
    for (const t of rows) {
      await this.setTaskStatus(
        tx,
        { ...c, tz: 'UTC', iso: (d) => d.toISOString() },
        t,
        'cancelled',
        c.now,
        {
          code: 'room_blocked',
          note: null,
        },
      );
      if (t.assigned_user_id) {
        await this.events.notify(
          tx,
          {
            kind: 'hk_task_cancelled',
            userIds: [t.assigned_user_id],
            refType: 'hk_task',
            refId: t.id,
            refCode: t.room_no,
          },
          c.now,
        );
      }
    }
    return rows.length;
  }

  /** A system cancellation of one open task (EP14 decline – BE-D's port), with the SM-14 history row. */
  async cancelBySystem(
    tx: Tx,
    c: HkCtx,
    taskId: string,
    code: 'other' | 'reservation_changed',
    note: string,
  ): Promise<void> {
    const t = await this.taskById(tx, taskId, true);
    if (!t || t.status !== 'open') return;
    await this.setTaskStatus(tx, c, t, 'cancelled', c.now, { code, note });
    if (t.assigned_user_id) {
      await this.events.notify(
        tx,
        {
          kind: 'hk_task_cancelled',
          userIds: [t.assigned_user_id],
          refType: 'hk_task',
          refId: t.id,
          refCode: t.room_no,
        },
        c.now,
      );
    }
  }

  /** R11 (SM-02 O4): the OOO block was released – room VD + an after-repair cleaning for today. */
  async onRoomReleased(tx: Tx, c: HkCtx, roomId: string): Promise<void> {
    if ((await this.rooms.of(tx, roomId, c.today)) === 'OOO') return; // another block still covers today
    await this.rooms.set(tx, roomId, 'VD', { today: c.today, now: c.now, event: 'R11' });
    await this.insertTask(tx, c, {
      roomId,
      reservationId: null,
      type: 'after_repair_clean',
      dueDate: c.today,
      source: 'system',
      note: null,
    });
  }

  // ───────────────────────── tasks (US-054, SM-14) ─────────────────────────

  private async taskRows(
    tx: Tx,
    day: LocalDate,
    opts: { roomId?: string; taskId?: string; status?: string } = {},
  ): Promise<TaskRow[]> {
    const { rows } = await tx.query<TaskRow>(
      `SELECT ${TASK_COLUMNS} FROM ${TASK_FROM}
        WHERE ${OF_DAY} AND ($2::uuid IS NULL OR t.room_id = $2::uuid) AND ($3::uuid IS NULL OR t.id = $3::uuid)
          AND ($4::text IS NULL OR t.status = $4::text)
        ORDER BY t.created_at, t.id`,
      [day, opts.roomId ?? null, opts.taskId ?? null, opts.status ?? null],
    );
    return rows;
  }

  private async taskById(tx: Tx, id: string, lock = false): Promise<TaskRow | null> {
    const { rows } = await tx.query<TaskRow>(
      `SELECT ${TASK_COLUMNS} FROM ${TASK_FROM} WHERE t.id = $1 ${lock ? 'FOR UPDATE OF t' : ''}`,
      [id],
    );
    return rows[0] ?? null;
  }

  /** BR-807 ranks computed when read (arrivals / VIP change during the day – EP07 3.3). */
  private async ranked(
    tx: Tx,
    c: HkCtx,
    tasks: readonly TaskRow[],
  ): Promise<Array<{ row: TaskRow; rank: number; key: string }>> {
    if (tasks.length === 0) return [];
    const { rows: arr } = await tx.query<{ room_id: string; eta: string | null }>(
      `SELECT s.room_id, min(to_char(r.eta_time, 'HH24:MI')) AS eta
         FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
        WHERE s.active AND r.status IN ('hold', 'confirmed') AND s.from_date = $1::date
        GROUP BY s.room_id`,
      [c.today],
    );
    const checkin = await this.params.get<string>(tx, 'checkin_time', c.today);
    const arrival = new Map(arr.map((a) => [a.room_id, a.eta ?? checkin]));
    // BR-424-05 (S4-09): the room a guest returns to today (move "until the primary departure") is an arrival
    // by `checkout_time` – its cleaning ranks "arrival today", a `priority_clean` included.
    const returning = new Set((await roomReturnsOn(tx, c.today)).map((r) => r.returnRoomId));
    if (returning.size > 0) {
      const checkout = await this.params.get<string>(tx, 'checkout_time', c.today);
      for (const room of returning) if (!arrival.has(room)) arrival.set(room, checkout);
    }
    const inHouse = await this.inHouseByRoom(tx, c.today);
    const out = tasks.map((t) => {
      const stay = inHouse.get(t.room_id);
      let rank = priorityRank({
        type: t.type,
        arrivalToday: arrival.has(t.room_id),
        reservationInHouse: t.reservation_status === 'in_house',
        vip: !!stay?.vip,
      });
      if (returning.has(t.room_id) && CLEAN_TYPES.includes(t.type) && t.type !== 'guest_request') {
        rank = 2;
      }
      let key: string;
      if (rank === 1) key = t.due_at ? t.due_at.toISOString() : t.created_at.toISOString();
      else if (rank === 2) key = arrival.get(t.room_id) ?? checkin;
      else if (rank === 3 || rank === 5) key = t.created_at.toISOString();
      else if (rank === 6) key = `${t.window_start ?? '99:99'}|${t.room_no}`;
      else key = t.room_no;
      return { row: t, rank, key };
    });
    out.sort(
      (a, b) =>
        a.rank - b.rank ||
        a.key.localeCompare(b.key) ||
        a.row.room_no.localeCompare(b.row.room_no) ||
        a.row.created_at.getTime() - b.row.created_at.getTime(),
    );
    return out;
  }

  /** HK: own or unassigned (scope T) gets every field; a task of someone else shows room, type, status only. */
  private taskDto(c: HkCtx, t: TaskRow, rank: number): Record<string, unknown> {
    const hkOnly = isHkOnly(c.actor.roles);
    const desk = has(c.actor.roles, FD_PLUS);
    const mine = !hkOnly || t.assigned_user_id === null || t.assigned_user_id === c.actor.userId;
    const details = desk || (hkOnly && mine);
    return {
      id: t.id,
      roomId: t.room_id,
      roomNo: t.room_no,
      roomName: t.room_name,
      type: t.type,
      status: t.status,
      dueDate: t.due_date,
      ...(t.due_at ? { dueAt: c.iso(t.due_at) } : {}),
      reservationId: t.reservation_id,
      quantity: t.quantity,
      ...(t.window_start ? { windowStart: t.window_start } : {}),
      ...(t.window_end ? { windowEnd: t.window_end } : {}),
      ...(t.not_before_time ? { notBeforeTime: t.not_before_time } : {}),
      priorityRank: rank,
      source: t.source,
      ...(details && t.note ? { note: t.note } : {}),
      ...(details && Array.isArray(t.refill_items) ? { refillItems: t.refill_items } : {}),
      ...(t.assigned_user_id ? { assignedUserId: t.assigned_user_id } : {}),
      ...(t.done_at ? { doneAt: c.iso(t.done_at) } : {}),
      linenChange: t.linen_change,
      carriedOver: t.carried_over,
      ...(t.cancel_reason_code ? { cancelReasonCode: t.cancel_reason_code } : {}),
      ...(t.cancel_note && details ? { cancelNote: t.cancel_note } : {}),
      version: t.version,
    };
  }

  async listHkTasks(tx: Tx, c: HkCtx, q: { date?: string; status?: string }) {
    const errors: FieldError[] = [];
    if (q.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(q.date)) {
      errors.push({ field: 'date', code: 'VALIDATION_FAILED' });
    }
    if (
      q.status !== undefined &&
      !['open', 'in_progress', 'done', 'cancelled'].includes(q.status)
    ) {
      errors.push({ field: 'status', code: 'NOT_IN_LIST' });
    }
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    const day = q.date ?? c.today;
    // x-scope HK `today`: only the business day.
    if (isHkOnly(c.actor.roles) && day !== c.today) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'date', code: 'NOT_IN_LIST' }] });
    }
    const rows = await this.taskRows(tx, day, q.status ? { status: q.status } : {});
    const ranked = await this.ranked(tx, c, rows);
    const hkOnly = isHkOnly(c.actor.roles);
    const counted = ranked.filter(
      (r) =>
        r.row.status !== 'cancelled' &&
        (!hkOnly || r.row.assigned_user_id === null || r.row.assigned_user_id === c.actor.userId),
    );
    return {
      summary: {
        done: counted.filter((r) => r.row.status === 'done').length,
        total: counted.length,
      },
      data: ranked.map((r) => this.taskDto(c, r.row, r.rank)),
    };
  }

  async createHkTask(
    tx: Tx,
    c: HkCtx,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const errors: FieldError[] = [];
    const roomId = typeof body.roomId === 'string' ? body.roomId : null;
    if (!roomId) errors.push({ field: 'roomId', code: 'REQUIRED' });
    const type = body.type as HkTaskType | undefined;
    if (type === undefined) errors.push({ field: 'type', code: 'REQUIRED' });
    else if (
      !(HK_TASK_TYPES as readonly string[]).includes(type) ||
      !MANUAL_TASK_TYPES.includes(type)
    ) {
      errors.push({ field: 'type', code: 'NOT_IN_LIST' });
    }
    const dueDate = typeof body.dueDate === 'string' ? body.dueDate : null;
    if (!dueDate) errors.push({ field: 'dueDate', code: 'REQUIRED' });
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
      errors.push({ field: 'dueDate', code: 'VALIDATION_FAILED' });
    else if (dueDate < c.today) errors.push({ field: 'dueDate', code: 'DATE_IN_PAST' });
    else if (dueDate > addDays(c.today, 7))
      errors.push({ field: 'dueDate', code: 'VALUE_OUT_OF_RANGE' });
    let note: string | null = null;
    if (body.note !== undefined && body.note !== null) {
      if (typeof body.note !== 'string') errors.push({ field: 'note', code: 'VALIDATION_FAILED' });
      else {
        note = stripControlChars(body.note).trim() || null;
        if (note && note.length > 300) errors.push({ field: 'note', code: 'TOO_LONG' });
      }
    }
    const assignee = typeof body.assignedUserId === 'string' ? body.assignedUserId : null;
    if (body.assignedUserId !== undefined && !assignee) {
      errors.push({ field: 'assignedUserId', code: 'NOT_IN_LIST' });
    }
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    assertNoCardNumber('note', note);
    const [room] = await this.roomRows(tx, c, roomId as string).catch(() => []);
    if (!room)
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
    if (assignee && !(await this.hasRole(tx, assignee, [HK]))) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'assignedUserId', code: 'NOT_IN_LIST' }],
      });
    }
    if ((await this.rooms.of(tx, room.id, c.today)) === 'OOO') throw problem('ROOM_BLOCKED');
    const task = await this.insertTask(tx, c, {
      roomId: room.id,
      reservationId:
        type === 'stayover_clean'
          ? ((await this.inHouseByRoom(tx, c.today)).get(room.id)?.reservationId ?? null)
          : null,
      type: type as HkTaskType,
      dueDate: dueDate as string,
      source: 'manual',
      note,
      assignedUserId: assignee,
    });
    if (type === 'priority_clean') {
      await this.events.notify(
        tx,
        {
          kind: 'hk_task_urgent',
          ...(assignee ? { userIds: [assignee] } : { roles: [HK] }),
          refType: 'hk_task',
          refId: task.id,
          refCode: room.room_no,
        },
        c.now,
      );
    }
    const [ranked] = await this.ranked(tx, c, [task]);
    return this.taskDto(c, task, ranked?.rank ?? 7);
  }

  private async hasRole(tx: Tx, userId: string, roles: readonly string[]): Promise<boolean> {
    const { rows } = await tx.query(
      `SELECT 1 FROM user_property_role WHERE user_id = $1 AND property_id = $2 AND revoked_at IS NULL
          AND role = ANY($3::text[])`,
      [userId, tx.ctx.propertyId, [...roles]],
    );
    return rows.length > 0;
  }

  /** Inserts a task (stay-over / checkout / long stay are unique per room and day: the open one is reused). */
  async insertTask(
    tx: Tx,
    c: Pick<HkCtx, 'now' | 'today'> & { actor: { userId: string | null } },
    t: {
      roomId: string;
      reservationId: string | null;
      type: HkTaskType;
      dueDate: LocalDate;
      source: 'system' | 'manual' | 'guest_app';
      note: string | null;
      assignedUserId?: string | null;
      guestRequestId?: string | null;
    },
  ): Promise<TaskRow> {
    const id = uuidv7();
    const r = await tx.query<{ id: string }>(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date,
         assigned_user_id, source, guest_request_id, note, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $9, $10, $11, $12, $13, $12)
       ON CONFLICT DO NOTHING RETURNING id`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        t.roomId,
        t.reservationId,
        t.type,
        t.dueDate,
        t.assignedUserId ?? null,
        t.source,
        t.guestRequestId ?? null,
        t.note,
        c.now,
        c.actor.userId || null,
      ],
    );
    let taskId = r.rows[0]?.id ?? null;
    if (!taskId) {
      const { rows } = await tx.query<{ id: string }>(
        `SELECT id FROM hk_task WHERE room_id = $1 AND type = $2 AND due_date = $3
            AND status IN ('open', 'in_progress') LIMIT 1`,
        [t.roomId, t.type, t.dueDate],
      );
      taskId = rows[0]?.id ?? null;
      if (!taskId) throw new Error('hk_task insert conflicted without an open row');
    } else {
      await this.taskChanged(tx, taskId);
    }
    return (await this.taskById(tx, taskId)) as TaskRow;
  }

  private async taskChanged(tx: Tx, taskId: string): Promise<void> {
    await this.events.publish(tx, 'hk_task.changed', taskId);
  }

  private async setTaskStatus(
    tx: Tx,
    c: HkCtx,
    t: TaskRow,
    to: 'in_progress' | 'done' | 'cancelled',
    performedAt: Date,
    cancel?: { code: string; note: string | null },
  ): Promise<void> {
    await tx.query(
      `UPDATE hk_task SET status = $2,
              started_at = CASE WHEN $2 = 'in_progress' THEN $3 ELSE started_at END,
              done_at = CASE WHEN $2 = 'done' THEN $3 ELSE done_at END,
              done_by = CASE WHEN $2 = 'done' THEN $4::uuid ELSE done_by END,
              cancel_reason_code = CASE WHEN $2 = 'cancelled' THEN $5 ELSE cancel_reason_code END,
              cancel_note = CASE WHEN $2 = 'cancelled' THEN $6 ELSE cancel_note END,
              performed_at = $3, updated_at = $7, version = version + 1
        WHERE id = $1`,
      [
        t.id,
        to,
        performedAt,
        c.actor.userId || null,
        cancel?.code ?? null,
        cancel?.note ?? null,
        c.now,
      ],
    );
    await tx.query(
      `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
         event_code, actor_type, actor_user_id, reason_note, occurred_at, performed_at)
       VALUES ($1, $2, 'SM-14', $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        t.id,
        t.status,
        to,
        to === 'in_progress' ? 'start' : to === 'done' ? 'complete' : 'cancel',
        tx.ctx.actorType,
        tx.ctx.actorType === 'user' ? tx.ctx.userId : null,
        cancel?.note ?? cancel?.code ?? null,
        c.now,
        performedAt,
      ],
    );
    await this.taskChanged(tx, t.id);
    // SM-15: the guest request behind a task follows it (BE-D's port; no-op until it is bound).
    if (t.guest_request_id && this.guestRequests) {
      if (to === 'in_progress')
        await this.guestRequests.onLinkedWorkStarted(tx, t.guest_request_id, c.now);
      else if (to === 'done')
        await this.guestRequests.onLinkedWorkDone(tx, t.guest_request_id, c.now);
      else await this.guestRequests.onLinkedWorkCancelled(tx, t.guest_request_id, c.now);
    }
  }

  async transitionHkTask(
    tx: Tx,
    c: HkCtx,
    taskId: string,
    action: string,
    body: Record<string, unknown>,
    performedAt: Date,
  ): Promise<Record<string, unknown>> {
    if (!['start', 'complete', 'cancel'].includes(action)) throw problem('NOT_FOUND');
    const t = await this.taskById(tx, taskId, true);
    if (!t) throw problem('NOT_FOUND');
    const hkOnly = isHkOnly(c.actor.roles);
    if (hkOnly) {
      // x-scope `today`: tasks of the business day assigned to the caller or to nobody.
      const today =
        t.due_date === c.today ||
        (t.due_date < c.today && ['open', 'in_progress'].includes(t.status));
      const mine = t.assigned_user_id === null || t.assigned_user_id === c.actor.userId;
      if (!today || !mine) throw problem('NOT_FOUND');
    }
    const errors: FieldError[] = [];
    let cancel: { code: string; note: string | null } | undefined;
    if (action === 'cancel') {
      const code = body.cancelReasonCode;
      if (code === undefined) errors.push({ field: 'cancelReasonCode', code: 'REQUIRED' });
      else if (!['guest_refused', 'dnd', 'other'].includes(code as string)) {
        errors.push({ field: 'cancelReasonCode', code: 'NOT_IN_LIST' });
      }
      let note: string | null = null;
      if (body.cancelNote !== undefined && body.cancelNote !== null) {
        note = typeof body.cancelNote === 'string' ? stripControlChars(body.cancelNote).trim() : '';
        if (note.length < 3) errors.push({ field: 'cancelNote', code: 'REQUIRED' });
        else if (note.length > 300) errors.push({ field: 'cancelNote', code: 'TOO_LONG' });
      } else if (code === 'other') {
        errors.push({ field: 'cancelNote', code: 'REQUIRED' });
      }
      if (errors.length === 0) {
        assertNoCardNumber('cancelNote', note);
        cancel = { code: code as string, note: note && note.length > 0 ? note : null };
      }
    }
    if (!performedAtInRange(performedAt, c.now)) {
      errors.push({ field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' });
    }
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    if (action === 'cancel') {
      // rbac note 33: HK cancels only a stay-over cleaning (guest refused / DND); desk: any open task.
      if (hkOnly && !HK_CANCELLABLE.includes(t.type)) throw problem('FORBIDDEN_ACTION');
      if (!hkOnly && !has(c.actor.roles, FD_PLUS)) throw problem('FORBIDDEN_ACTION');
    }
    const from = t.status;
    const ok =
      (action === 'start' && from === 'open') ||
      (action === 'complete' && (from === 'open' || from === 'in_progress')) ||
      (action === 'cancel' && from === 'open');
    if (!ok) throw problem('INVALID_TRANSITION', { extras: { currentState: from } });
    const to = action === 'start' ? 'in_progress' : action === 'complete' ? 'done' : 'cancelled';
    await this.setTaskStatus(tx, c, t, to, performedAt, cancel);
    if (cancel?.code === 'dnd') {
      // BR-807 "hoãn, báo FD": the desk sees the cancelled task (SSE) and re-creates it when the guest agrees.
      await this.events.publish(tx, 'hk_task.changed', t.id, { roles: FD_PLUS });
    }
    const fresh = (await this.taskById(tx, t.id)) as TaskRow;
    const [ranked] = await this.ranked(tx, c, [fresh]);
    return this.taskDto(c, fresh, ranked?.rank ?? 7);
  }

  // ───────────────────────── inspections (US-055, R4) ─────────────────────────

  private async checklistBase(tx: Tx): Promise<{ version: number; items: ChecklistItemDef[] }> {
    const { rows } = await tx.query<{ version: number; items: unknown }>(
      'SELECT version, items FROM inspection_checklist WHERE property_id = $1',
      [tx.ctx.propertyId],
    );
    const parsed = rows[0] ? parseChecklist(rows[0].items) : null;
    return parsed
      ? { version: rows[0]!.version, items: parsed }
      : { version: 1, items: [...DEFAULT_CHECKLIST] };
  }

  /** Kit items expected in the room: kit tasks of a booking about to arrive / in house (BR-812 (5)). */
  private async kitCount(tx: Tx, roomId: string): Promise<number> {
    const { rows } = await tx.query<{ n: number }>(
      `SELECT coalesce(sum(t.quantity), 0)::int AS n FROM hk_task t JOIN reservation r ON r.id = t.reservation_id
        WHERE t.room_id = $1 AND t.type IN ('extra_guest_kit_prepare', 'extra_guest_kit_transfer')
          AND t.status <> 'cancelled' AND r.status IN ('confirmed', 'in_house')`,
      [roomId],
    );
    return rows[0]?.n ?? 0;
  }

  async checklist(
    tx: Tx,
    c: HkCtx,
    roomId: string | null,
  ): Promise<{ version: number; items: ChecklistItemDef[] }> {
    const base = await this.checklistBase(tx);
    if (!roomId) return base;
    const n = await this.kitCount(tx, roomId);
    if (n === 0) return { version: base.version * 100, items: base.items };
    return {
      version: base.version * 100 + Math.min(n, 99),
      items: [...base.items, extraKitItem(n)],
    };
  }

  async getInspectionChecklist(
    tx: Tx,
    c: HkCtx,
    roomId: string | undefined,
    locale: ChecklistLocale,
  ) {
    if (roomId !== undefined) {
      const [room] = await this.roomRows(tx, c, roomId).catch(() => []);
      if (!room)
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
    }
    const list = await this.checklist(tx, c, roomId ?? null);
    const selfInspector = isHkOnly(c.actor.roles);
    return {
      version: list.version,
      items: list.items.map((i) => ({
        code: i.code,
        label: i.label[locale],
        required: i.required,
        ...(i.photo ? { photoRequired: selfInspector } : {}),
        ...(i.code === EXTRA_KIT_CODE ? { dynamic: true } : {}),
      })),
    };
  }

  async recordInspection(
    tx: Tx,
    c: HkCtx,
    roomId: string,
    body: {
      checklistVersion: number;
      items: Array<{ code: string; passed: boolean; note?: string | undefined }>;
      photoAttachmentIds: string[];
      performedAt: Date;
    },
    locale: ChecklistLocale,
  ) {
    const [room] = await this.roomRows(tx, c, roomId);
    if (!room) throw problem('NOT_FOUND');
    const self = isHkOnly(c.actor.roles);
    if (self) {
      // A81 ◐: HK inspects only with `hk_self_inspection_enabled` (+ photos), inside scope T.
      if (!(await this.params.get<boolean>(tx, 'hk_self_inspection_enabled', c.today))) {
        throw problem('FORBIDDEN_ACTION');
      }
      if (!(await this.inScope(tx, c, roomId))) throw problem('NOT_FOUND');
    }
    await tx.query('SELECT 1 FROM room WHERE id = $1 FOR UPDATE', [roomId]);
    const list = await this.checklist(tx, c, roomId);
    const current = await this.statusOf(tx, c, roomId);
    const errors: FieldError[] = [];
    if (!performedAtInRange(body.performedAt, c.now) || body.performedAt < current.since) {
      errors.push({ field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' });
    }
    const codes = new Set(list.items.map((i) => i.code));
    const seen = new Set<string>();
    body.items.forEach((i, idx) => {
      if (!codes.has(i.code) || seen.has(i.code)) {
        errors.push({ field: `items[${idx}].code`, code: 'NOT_IN_LIST' });
      }
      seen.add(i.code);
      if (i.passed === false) {
        const note = i.note ? stripControlChars(i.note).trim() : '';
        if (note.length < 3) errors.push({ field: `items[${idx}].note`, code: 'REQUIRED' });
        else if (note.length > 300) errors.push({ field: `items[${idx}].note`, code: 'TOO_LONG' });
      }
    });
    if (body.photoAttachmentIds.length > 4) {
      errors.push({ field: 'photoAttachmentIds', code: 'VALUE_OUT_OF_RANGE' });
    }
    if (self && body.photoAttachmentIds.length === 0) {
      errors.push({ field: 'photoAttachmentIds', code: 'REQUIRED' });
    }
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    if (body.checklistVersion !== list.version) {
      throw problem('CHECKLIST_OUTDATED', { extras: { currentVersion: list.version } });
    }
    if (current.status !== 'VC') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: current.status } });
    }
    for (const [i, id] of body.photoAttachmentIds.entries()) {
      await this.attachments.assertUsable(tx, c.actor, id, 'inspection', {
        field: `photoAttachmentIds[${i}]`,
      });
    }
    for (const i of body.items) assertNoCardNumber('items.note', i.note ?? null);
    const byCode = new Map(body.items.map((i) => [i.code, i]));
    // A missing required item is not an error but a fail (OpenAPI B-07).
    const failedItems = list.items.filter(
      (d) => d.required && !d.photo && byCode.get(d.code)?.passed !== true,
    );
    const result: 'pass' | 'fail' = failedItems.length === 0 ? 'pass' : 'fail';
    const id = uuidv7();
    let redoTaskId: string | null = null;
    if (result === 'fail') {
      const redo = await this.insertTask(tx, c, {
        roomId,
        reservationId: null,
        type: 'adhoc_clean',
        dueDate: c.today,
        source: 'system',
        note: `Dọn lại theo kiểm phòng: ${failedItems.map((d) => d.label.vi).join(', ')}`.slice(
          0,
          300,
        ),
      });
      redoTaskId = redo.id;
    } else {
      await this.rooms.set(tx, roomId, 'VI', {
        today: c.today,
        now: c.now,
        event: 'R4',
        performedAt: body.performedAt,
      });
    }
    const items = list.items.map((d) => {
      const got = byCode.get(d.code);
      return {
        code: d.code,
        passed: got?.passed === true,
        ...(got?.note ? { note: stripControlChars(got.note).trim() } : {}),
        ...(d.code === EXTRA_KIT_CODE ? { dynamic: true } : {}),
      };
    });
    await tx.query(
      `INSERT INTO inspection (id, organization_id, property_id, room_id, result, self_inspection, inspected_by,
         inspected_at, received_at, checklist_version, items, photo_attachment_ids, room_status_after, redo_task_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        roomId,
        result,
        self,
        c.actor.userId,
        body.performedAt,
        c.now,
        list.version,
        JSON.stringify(items),
        body.photoAttachmentIds,
        result === 'pass' ? 'VI' : 'VC',
        redoTaskId,
      ],
    );
    for (const [i, photo] of body.photoAttachmentIds.entries()) {
      await this.attachments.bindTo(
        tx,
        photo,
        { type: 'inspection', id },
        {
          field: `photoAttachmentIds[${i}]`,
        },
      );
    }
    await this.audit.record(tx, {
      category: 'state',
      action: 'room.inspected',
      entityType: 'inspection',
      entityId: id,
      entityCode: room.room_no,
      after: { result, selfInspection: self, checklistVersion: list.version },
      ...(c.actor.requestId ? { requestId: c.actor.requestId } : {}),
    });
    await this.events.publish(tx, 'room.status_changed', roomId);
    return this.inspectionDto(
      c,
      (await this.inspectionRows(tx, roomId, { id }))[0]!,
      list.items,
      locale,
    );
  }

  private async inspectionRows(
    tx: Tx,
    roomId: string,
    q: {
      id?: string;
      from?: string;
      to?: string;
      by?: string;
      after?: [string, string];
      limit?: number;
    },
  ): Promise<InspectionRow[]> {
    const { rows } = await tx.query<InspectionRow>(
      `SELECT i.id, i.room_id, i.result, i.self_inspection, i.inspected_at, u.display_name AS inspected_by_name,
              i.checklist_version, i.items, i.photo_attachment_ids, i.room_status_after, i.redo_task_id
         FROM inspection i JOIN app_user u ON u.id = i.inspected_by
        WHERE i.room_id = $1 AND ($2::uuid IS NULL OR i.id = $2::uuid)
          AND ($3::timestamptz IS NULL OR i.inspected_at >= $3::timestamptz)
          AND ($4::timestamptz IS NULL OR i.inspected_at < $4::timestamptz)
          AND ($5::uuid IS NULL OR i.inspected_by = $5::uuid)
          AND ($6::timestamptz IS NULL OR (i.inspected_at, i.id) < ($6::timestamptz, $7::uuid))
        ORDER BY i.inspected_at DESC, i.id DESC
        LIMIT $8`,
      [
        roomId,
        q.id ?? null,
        q.from ?? null,
        q.to ?? null,
        q.by ?? null,
        q.after?.[0] ?? null,
        q.after?.[1] ?? null,
        q.limit ?? 1,
      ],
    );
    return rows;
  }

  private inspectionDto(
    c: HkCtx,
    i: InspectionRow,
    defs: readonly ChecklistItemDef[],
    locale: ChecklistLocale,
  ): Record<string, unknown> {
    const label = new Map(defs.map((d) => [d.code, d.label[locale]]));
    return {
      id: i.id,
      roomId: i.room_id,
      result: i.result,
      selfInspection: i.self_inspection,
      inspectedAt: c.iso(i.inspected_at),
      inspectedBy: i.inspected_by_name,
      roomStatusAfter: i.room_status_after,
      checklistVersion: i.checklist_version,
      items: i.items.map((x) => ({
        code: x.code,
        ...(label.has(x.code)
          ? { label: label.get(x.code) }
          : x.code === EXTRA_KIT_CODE
            ? { label: extraKitItem(1).label[locale].replace(/ × \d+$/, '') }
            : {}),
        passed: x.passed,
        ...(x.note ? { note: x.note } : {}),
      })),
      photoAttachmentIds: i.photo_attachment_ids,
      ...(i.redo_task_id ? { redoTaskId: i.redo_task_id } : {}),
    };
  }

  async listInspections(
    tx: Tx,
    c: HkCtx,
    roomId: string,
    q: { from?: string; to?: string; cursor?: string; limit?: string },
    locale: ChecklistLocale,
  ) {
    const [room] = await this.roomRows(tx, c, roomId);
    if (!room) throw problem('NOT_FOUND');
    const limit = parseLimit(q.limit, 20);
    const isDate = (v: string | undefined) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v);
    const errors: FieldError[] = [];
    if (!isDate(q.from)) errors.push({ field: 'from', code: 'VALIDATION_FAILED' });
    if (!isDate(q.to)) errors.push({ field: 'to', code: 'VALIDATION_FAILED' });
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    const to = q.to ?? c.today;
    const from = q.from ?? addDays(to, -30);
    if (from > to)
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'from', code: 'DATE_ORDER' }] });
    if (addDays(from, 92) < to) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'to', code: 'DATE_RANGE_TOO_LONG' }],
      });
    }
    const cursor = decodeCursor(q.cursor, 2) as [string, string] | null;
    const rows = await this.inspectionRows(tx, roomId, {
      from: atLocal(from, '00:00', c.tz).toISOString(),
      to: atLocal(addDays(to, 1), '00:00', c.tz).toISOString(),
      ...(isHkOnly(c.actor.roles) ? { by: c.actor.userId } : {}),
      ...(cursor ? { after: cursor } : {}),
      limit: limit + 1,
    });
    const defs = (await this.checklistBase(tx)).items;
    const res = page(rows, limit, (r) => [r.inspected_at.toISOString(), r.id]);
    return { data: res.data.map((r) => this.inspectionDto(c, r, defs, locale)), page: res.page };
  }
}

export type { RoomAction };
