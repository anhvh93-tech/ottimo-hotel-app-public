/**
 * Maintenance (EP08 – US-057, US-061, US-062; SM-04 W1…W6, SM-02 O1/O4/O5; BR-804, BR-809; OpenAPI 0.3.7
 * B-09…B-11 – BE-C R2 Sprint 4).
 * - createWorkOrder: HK reports (no block – A86, `blockRequested` instead), FD+/MT may add a block (one
 *   transaction: work order + block + occupancy; a 409 of the block leaves no half-made work order);
 *   severity defaults by BR-809 when not sent; deadlines from `wo_sla`; notifications B-08.
 * - updateWorkOrder (If-Match): assignee, severity (deadlines recomputed from the creation time), parts note,
 *   withdraw the block request.
 * - transitionWorkOrder (If-Match): accept / wait-parts / resume / complete / cancel / reopen; complete and
 *   cancel close the linked block (O4 released → room OOO → VD + `after_repair_clean`; O5 planned cancelled).
 * - history[] = audit_event `work_order.*` of the work order (erd 4.9 – no table), never a guest name.
 * HK sees its own reports and the work orders of rooms in its scope T (`own_or_room_today`); MT reads all.
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import {
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_SEVERITIES,
  type WorkOrderCategory,
  type WorkOrderSeverity,
  type WorkOrderSource,
  type WorkOrderStatus,
} from '../../../db/schema/housekeeping';
import { decodeCursor, page, parseLimit } from '../../../shared/http/pagination';
import { assertVersion } from '../../../shared/http/precondition';
import { type FieldError, problem } from '../../../shared/problem';
import { type LocalDate, addDays } from '../../../shared/time';
import { assertNoCardNumber, stripControlChars } from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';
import { AttachmentService } from '../../files/public/attachment.service';
import { isActiveStaff } from '../../identity/public/staff-directory';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { RoomBlockPort } from '../../reservations/public/room-block.port';
import { RoomStatusService } from '../public/room-status.service';
import { type HkCtx, HousekeepingService } from './housekeeping.service';
import {
  FD_PLUS,
  MGR_PLUS,
  MT,
  WO_ACTIONS,
  WO_CODE,
  type WoAction,
  type WoSla,
  deadlines,
  defaultSeverity,
  has,
  isHkOnly,
  woAllowedActions,
  woTarget,
} from './rules';

export interface WorkOrderRow {
  id: string;
  code: string;
  room_id: string;
  room_no: string;
  room_name: string | null;
  title: string;
  description: string;
  category: WorkOrderCategory;
  severity: WorkOrderSeverity;
  status: WorkOrderStatus;
  source: WorkOrderSource;
  reported_by: string | null;
  reported_by_name: string | null;
  assignee_user_id: string | null;
  assignee_name: string | null;
  accepted_at: Date | null;
  ack_due_at: Date | null;
  resolve_due_at: Date | null;
  paused_at: Date | null;
  parts_note: string | null;
  parts_expected_date: string | null;
  result_note: string | null;
  photo_attachment_ids: string[];
  done_photo_attachment_ids: string[];
  done_at: Date | null;
  cancel_reason: string | null;
  reopened_count: number;
  block_requested: boolean;
  remedy_suggested_at: Date | null;
  guest_request_id: string | null;
  created_at: Date;
  created_by: string | null;
  version: number;
}

const COLUMNS = `w.id, w.code, w.room_id, rm.room_no, rm.name AS room_name, w.title, w.description, w.category,
  w.severity, w.status, w.source, w.reported_by, ru.display_name AS reported_by_name, w.assignee_user_id,
  au.display_name AS assignee_name, w.accepted_at, w.ack_due_at, w.resolve_due_at, w.paused_at, w.parts_note,
  w.parts_expected_date::text AS parts_expected_date, w.result_note, w.photo_attachment_ids,
  w.done_photo_attachment_ids, w.done_at, w.cancel_reason, w.reopened_count, w.block_requested,
  w.remedy_suggested_at, w.guest_request_id, w.created_at, w.created_by, w.version`;
const FROM = `work_order w JOIN room rm ON rm.id = w.room_id
  LEFT JOIN app_user ru ON ru.id = w.reported_by LEFT JOIN app_user au ON au.id = w.assignee_user_id`;
const OPEN: readonly WorkOrderStatus[] = ['new', 'in_progress', 'waiting_parts'];
const SEVERITY_ORDER: Record<WorkOrderSeverity, number> = { high: 0, medium: 1, low: 2 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the work order is past a deadline that still runs (paused deadlines do not count). */
export function isOverdue(
  w: Pick<WorkOrderRow, 'status' | 'accepted_at' | 'ack_due_at' | 'resolve_due_at' | 'paused_at'>,
  now: Date,
): boolean {
  if (!OPEN.includes(w.status)) return false;
  if (w.ack_due_at && !w.accepted_at && w.ack_due_at <= now) return true;
  if (w.resolve_due_at && !w.paused_at && w.resolve_due_at <= now) return true;
  return false;
}

function text(
  errors: FieldError[],
  field: string,
  v: unknown,
  o: { required?: boolean; min?: number; max: number },
): string | null {
  if (v === undefined || v === null) {
    if (o.required) errors.push({ field, code: 'REQUIRED' });
    return null;
  }
  if (typeof v !== 'string') {
    errors.push({ field, code: 'VALIDATION_FAILED' });
    return null;
  }
  const t = stripControlChars(v).trim();
  if (t.length === 0 || t.length < (o.min ?? 1)) {
    if (o.required || t.length > 0) errors.push({ field, code: 'REQUIRED' });
    return null;
  }
  if (t.length > o.max) {
    errors.push({ field, code: 'TOO_LONG' });
    return null;
  }
  return t;
}

function photos(errors: FieldError[], field: string, v: unknown, max: number): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !UUID.test(x))) {
    errors.push({ field, code: 'NOT_IN_LIST' });
    return [];
  }
  if (v.length > max) {
    errors.push({ field, code: 'VALUE_OUT_OF_RANGE' });
    return [];
  }
  if (new Set(v).size !== v.length) {
    errors.push({ field, code: 'NOT_IN_LIST' });
    return [];
  }
  return v as string[];
}

@Injectable()
export class WorkOrdersService {
  constructor(
    @Inject(HousekeepingService) private readonly hk: HousekeepingService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(DocNumberService) private readonly docNumbers: DocNumberService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AttachmentService) private readonly attachments: AttachmentService,
    @Inject(RoomBlockPort) private readonly blocks: RoomBlockPort,
    @Inject(RoomStatusService) private readonly rooms: RoomStatusService,
  ) {}

  // ───────────────────────── reads ─────────────────────────

  private async row(tx: Tx, id: string, lock = false): Promise<WorkOrderRow | null> {
    const { rows } = await tx.query<WorkOrderRow>(
      `SELECT ${COLUMNS} FROM ${FROM} WHERE w.id = $1 ${lock ? 'FOR UPDATE OF w' : ''}`,
      [id],
    );
    return rows[0] ?? null;
  }

  /** HK `own_or_room_today`: reported by the caller, or a room in its scope T today. */
  private async visible(tx: Tx, c: HkCtx, w: WorkOrderRow): Promise<boolean> {
    if (!isHkOnly(c.actor.roles)) return true;
    if (w.reported_by === c.actor.userId) return true;
    return (await this.hk.scopeRooms(tx, c)).has(w.room_id);
  }

  private async history(tx: Tx, c: HkCtx, id: string) {
    const { rows } = await tx.query<{
      occurred_at: Date;
      actor_name: string | null;
      after: { change?: string; from?: string | null; to?: string | null } | null;
      reason: string | null;
    }>(
      `SELECT e.occurred_at, u.display_name AS actor_name, e.after, e.reason
         FROM audit_event e LEFT JOIN app_user u ON u.id = e.actor_user_id
        WHERE e.entity_type = 'work_order' AND e.entity_id = $1
        ORDER BY e.occurred_at, e.id`,
      [id],
    );
    return rows
      .filter((r) => r.after?.change)
      .map((r) => ({
        at: c.iso(r.occurred_at),
        ...(r.actor_name ? { actorName: r.actor_name } : {}),
        change: r.after!.change as string,
        from: r.after!.from ?? null,
        to: r.after!.to ?? null,
        ...(r.reason ? { note: r.reason } : {}),
      }));
  }

  async dto(
    tx: Tx,
    c: HkCtx,
    w: WorkOrderRow,
    opts: { history?: boolean; liveBlock?: boolean } = {},
  ): Promise<Record<string, unknown>> {
    const block = await this.blocks.ofWorkOrder(tx, w.id);
    const live =
      opts.liveBlock ?? (!!block && ['planned', 'active'].includes(block.status as string));
    return {
      id: w.id,
      code: w.code,
      roomId: w.room_id,
      roomNo: w.room_no,
      roomName: w.room_name,
      title: w.title,
      description: w.description,
      severity: w.severity,
      status: w.status,
      source: w.source,
      ...(w.reported_by_name ? { reportedBy: w.reported_by_name } : {}),
      ...(w.assignee_name ? { assigneeName: w.assignee_name } : {}),
      ...(w.ack_due_at ? { ackDueAt: c.iso(w.ack_due_at) } : {}),
      ...(w.resolve_due_at ? { resolveDueAt: c.iso(w.resolve_due_at) } : {}),
      isOverdue:
        isOverdue(w, c.now) ||
        (w.status === 'waiting_parts' &&
          !!w.parts_expected_date &&
          w.parts_expected_date < c.today),
      ...(block ? { roomBlock: block } : {}),
      photoAttachmentIds: [...w.photo_attachment_ids, ...w.done_photo_attachment_ids],
      category: w.category,
      // B-09: the request ends once a live block exists for the work order.
      blockRequested: w.block_requested && !live,
      ...(w.parts_note ? { partsNote: w.parts_note } : {}),
      ...(w.parts_expected_date ? { partsExpectedDate: w.parts_expected_date } : {}),
      ...(w.result_note ? { resultNote: w.result_note } : {}),
      ...(w.accepted_at ? { acceptedAt: c.iso(w.accepted_at) } : {}),
      ...(w.done_at ? { doneAt: c.iso(w.done_at) } : {}),
      // US-062 AC3 – a desk decision (B14 + service-recovery FOC): FD+ only.
      remedySuggested:
        !!w.remedy_suggested_at && OPEN.includes(w.status) && has(c.actor.roles, FD_PLUS),
      ...(opts.history ? { history: await this.history(tx, c, w.id) } : {}),
      allowedActions: woAllowedActions(
        {
          status: w.status,
          createdBy: w.created_by,
          ...(w.status === 'done' ? { reopenable: await this.reopenable(tx, c, w) } : {}),
        },
        c.actor.roles,
        c.actor.userId,
      ),
      version: w.version,
    };
  }

  /** DOM D-12 g: a done work order reopens during the stay of the guest in that room, or ≤ 7 days after `done`. */
  private async reopenable(
    tx: Tx,
    c: HkCtx,
    w: Pick<WorkOrderRow, 'done_at' | 'room_id'>,
  ): Promise<boolean> {
    if (w.done_at && c.now.getTime() - w.done_at.getTime() <= 7 * 86_400_000) return true;
    return (await this.occupancy(tx, w.room_id, c.today)) !== 'none';
  }

  async get(tx: Tx, c: HkCtx, id: string) {
    const w = await this.row(tx, id);
    if (!w || !(await this.visible(tx, c, w))) throw problem('NOT_FOUND');
    return this.dto(tx, c, w, { history: true });
  }

  async list(tx: Tx, c: HkCtx, q: { status?: string; cursor?: string; limit?: string }) {
    if (
      q.status !== undefined &&
      !(['new', 'in_progress', 'waiting_parts', 'done', 'cancelled'] as string[]).includes(q.status)
    ) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'status', code: 'NOT_IN_LIST' }] });
    }
    const limit = parseLimit(q.limit, 50);
    const offset = Number((decodeCursor(q.cursor, 1) ?? [0])[0]) || 0;
    const statuses = q.status ? [q.status] : [...OPEN];
    const { rows } = await tx.query<WorkOrderRow>(
      `SELECT ${COLUMNS} FROM ${FROM} WHERE w.status = ANY($1::text[]) ORDER BY w.created_at, w.id`,
      [statuses],
    );
    const scope = isHkOnly(c.actor.roles) ? await this.hk.scopeRooms(tx, c) : null;
    const visible = rows.filter(
      (w) => !scope || w.reported_by === c.actor.userId || scope.has(w.room_id),
    );
    // EP07 6.7: overdue first, then severity (high → low), then the deadline.
    visible.sort((a, b) => {
      const oa = isOverdue(a, c.now) ? 0 : 1;
      const ob = isOverdue(b, c.now) ? 0 : 1;
      const da =
        (a.ack_due_at && !a.accepted_at ? a.ack_due_at : a.resolve_due_at)?.getTime() ?? Infinity;
      const db =
        (b.ack_due_at && !b.accepted_at ? b.ack_due_at : b.resolve_due_at)?.getTime() ?? Infinity;
      return (
        oa - ob ||
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        da - db ||
        a.code.localeCompare(b.code)
      );
    });
    const slice = visible.slice(offset, offset + limit + 1);
    const live = await this.blocks.liveBlockWorkOrders(
      tx,
      slice.map((w) => w.id),
    );
    const res = page(
      slice.map((w, i) => ({ w, i })),
      limit,
      (x) => [offset + x.i + 1],
    );
    const data: Array<Record<string, unknown>> = [];
    for (const x of res.data)
      data.push(await this.dto(tx, c, x.w, { liveBlock: live.has(x.w.id) }));
    return { data, page: res.page };
  }

  // ───────────────────────── create (US-057, US-061) ─────────────────────────

  private async occupancy(
    tx: Tx,
    roomId: string,
    today: LocalDate,
  ): Promise<'none' | 'short' | 'long'> {
    const { rows } = await tx.query<{ stay_type: string }>(
      `SELECT r.stay_type FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
        WHERE s.room_id = $1 AND s.active AND r.status = 'in_house' AND s.from_date <= $2::date
          AND s.to_date >= $2::date LIMIT 1`,
      [roomId, today],
    );
    const st = rows[0]?.stay_type;
    return st === 'long' ? 'long' : st ? 'short' : 'none';
  }

  async create(tx: Tx, c: HkCtx, body: Record<string, unknown>) {
    const roles = c.actor.roles;
    const hkOnly = isHkOnly(roles);
    // A86: HK never makes a block – the request is refused before anything is read (B-09).
    if (hkOnly && body.block !== undefined && body.block !== null)
      throw problem('FORBIDDEN_ACTION');
    const errors: FieldError[] = [];
    const roomId = typeof body.roomId === 'string' && UUID.test(body.roomId) ? body.roomId : null;
    if (!roomId)
      errors.push({
        field: 'roomId',
        code: body.roomId === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    const title = text(errors, 'title', body.title, { required: true, max: 120 });
    const description = text(errors, 'description', body.description, {
      required: true,
      max: 2000,
    });
    const category = body.category as WorkOrderCategory | undefined;
    if (category === undefined) errors.push({ field: 'category', code: 'REQUIRED' });
    else if (!(WORK_ORDER_CATEGORIES as readonly string[]).includes(category)) {
      errors.push({ field: 'category', code: 'NOT_IN_LIST' });
    }
    let severity = body.severity as WorkOrderSeverity | undefined;
    if (
      severity !== undefined &&
      !(WORK_ORDER_SEVERITIES as readonly string[]).includes(severity)
    ) {
      errors.push({ field: 'severity', code: 'NOT_IN_LIST' });
    }
    const assignee =
      body.assigneeUserId === undefined || body.assigneeUserId === null
        ? null
        : typeof body.assigneeUserId === 'string' && UUID.test(body.assigneeUserId)
          ? body.assigneeUserId
          : (errors.push({ field: 'assigneeUserId', code: 'NOT_IN_LIST' }), null);
    const photoIds = photos(errors, 'photoAttachmentIds', body.photoAttachmentIds, 4);
    if (body.blockRequested !== undefined && typeof body.blockRequested !== 'boolean') {
      errors.push({ field: 'blockRequested', code: 'VALIDATION_FAILED' });
    }
    const block = this.parseBlock(errors, body.block, roles, c.today);
    // BR-804: the block ends `ooo_reopen_buffer_days` after the expected end of the repair – with a buffer of 0 an
    // expected end on the start day would be an empty block (review BE-A 17/10).
    if (block?.expectedDoneDate && !errors.some((e) => e.field === 'block.expectedDoneDate')) {
      const buffer = await this.params.get<number>(tx, 'ooo_reopen_buffer_days', c.today);
      if (addDays(block.expectedDoneDate, buffer) <= block.startDate) {
        errors.push({ field: 'block.expectedDoneDate', code: 'DATE_ORDER' });
      }
    }
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    assertNoCardNumber('title', title);
    assertNoCardNumber('description', description);
    const room = await tx.query<{ id: string; room_no: string }>(
      'SELECT id, room_no FROM room WHERE id = $1',
      [roomId],
    );
    if (!room.rows[0]) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
    }
    if (assignee && !(await this.hasRole(tx, assignee, [MT, ...FD_PLUS]))) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'assigneeUserId', code: 'NOT_IN_LIST' }],
      });
    }
    for (const [i, id] of photoIds.entries()) {
      await this.attachments.assertUsable(tx, c.actor, id, 'work_order', {
        field: `photoAttachmentIds[${i}]`,
      });
    }
    severity ??= defaultSeverity(
      category as WorkOrderCategory,
      await this.occupancy(tx, roomId as string, c.today),
    );
    const source: WorkOrderSource = hkOnly
      ? 'housekeeping'
      : roles.includes(MT) && !has(roles, FD_PLUS)
        ? 'maintenance'
        : 'front_desk';
    const created = await this.insert(tx, c, {
      roomId: roomId as string,
      title: title as string,
      description: description as string,
      category: category as WorkOrderCategory,
      severity,
      source,
      assignee,
      photoIds,
      blockRequested: body.blockRequested === true && !block,
      guestRequestId: null,
    });
    if (block) {
      await this.blocks.createForWorkOrder(tx, c.actor, c.actor.requestId, {
        roomId: roomId as string,
        startDate: block.startDate,
        endDatePlanned: block.endDatePlanned,
        expectedDoneDate: block.expectedDoneDate,
        reason: block.reason,
        workOrderId: created.id,
        affectedReservationsAcknowledged: block.ack,
      });
      await this.record(
        tx,
        c,
        created.id,
        created.code,
        'block',
        null,
        block.startDate,
        block.reason,
      );
      if (block.startDate <= c.today) await this.hk.onRoomBlocked(tx, c, roomId as string);
    }
    if (created.blockRequested) {
      await this.events.notify(
        tx,
        {
          kind: 'work_order_block_requested',
          roles: [...FD_PLUS, MT],
          refType: 'work_order',
          refId: created.id,
          refCode: created.code,
        },
        c.now,
      );
    }
    return this.get(tx, c, created.id);
  }

  private parseBlock(
    errors: FieldError[],
    raw: unknown,
    roles: readonly string[],
    today: LocalDate,
  ): {
    startDate: string;
    endDatePlanned?: string;
    expectedDoneDate?: string;
    reason: string;
    ack?: boolean;
  } | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push({ field: 'block', code: 'VALIDATION_FAILED' });
      return null;
    }
    const b = raw as Record<string, unknown>;
    const date = (f: string, v: unknown, required: boolean): string | undefined => {
      if (v === undefined || v === null) {
        if (required) errors.push({ field: `block.${f}`, code: 'REQUIRED' });
        return undefined;
      }
      if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        errors.push({ field: `block.${f}`, code: 'VALIDATION_FAILED' });
        return undefined;
      }
      return v;
    };
    const startDate = date('startDate', b.startDate, true);
    const hasEnd = b.endDatePlanned !== undefined && b.endDatePlanned !== null;
    const hasExpected = b.expectedDoneDate !== undefined && b.expectedDoneDate !== null;
    if (hasEnd && hasExpected)
      errors.push({ field: 'block.expectedDoneDate', code: 'NOT_ALLOWED' });
    if (!hasEnd && !hasExpected) errors.push({ field: 'block.expectedDoneDate', code: 'REQUIRED' });
    const endDatePlanned = hasEnd ? date('endDatePlanned', b.endDatePlanned, false) : undefined;
    const expectedDoneDate = hasExpected
      ? date('expectedDoneDate', b.expectedDoneDate, false)
      : undefined;
    if (startDate && startDate < today)
      errors.push({ field: 'block.startDate', code: 'DATE_IN_PAST' });
    if (startDate && expectedDoneDate && expectedDoneDate < startDate) {
      errors.push({ field: 'block.expectedDoneDate', code: 'DATE_ORDER' });
    }
    if (startDate && endDatePlanned && endDatePlanned <= startDate) {
      errors.push({ field: 'block.endDatePlanned', code: 'DATE_ORDER' });
    }
    let reason: string | null = null;
    if (typeof b.reason !== 'string' || stripControlChars(b.reason).trim().length < 3) {
      errors.push({ field: 'block.reason', code: 'REASON_REQUIRED' });
    } else {
      reason = stripControlChars(b.reason).trim();
      if (reason.length > 500) errors.push({ field: 'block.reason', code: 'TOO_LONG' });
    }
    if (b.affectedReservationsAcknowledged === true && !has(roles, MGR_PLUS)) {
      // Only a MGR+ acknowledgement is recorded (O1) – FD/MT sending it is refused (EP07 6.2).
      throw problem('FORBIDDEN_ACTION');
    }
    if (!startDate || !reason) return null;
    return {
      startDate,
      ...(endDatePlanned ? { endDatePlanned } : {}),
      ...(expectedDoneDate ? { expectedDoneDate } : {}),
      reason,
      ...(b.affectedReservationsAcknowledged === true ? { ack: true } : {}),
    };
  }

  /** Active staff of the property with one of `roles` (0.3.7 bổ sung 3: "đang hoạt động" – identity/public). */
  private hasRole(tx: Tx, userId: string, roles: readonly string[]): Promise<boolean> {
    return isActiveStaff(tx, userId, roles);
  }

  /** Inserts a work order (code, deadlines, history, notifications W1). */
  async insert(
    tx: Tx,
    c: HkCtx,
    w: {
      roomId: string;
      title: string;
      description: string;
      category: WorkOrderCategory;
      severity: WorkOrderSeverity;
      source: WorkOrderSource;
      assignee: string | null;
      photoIds: string[];
      blockRequested: boolean;
      guestRequestId: string | null;
    },
  ): Promise<{ id: string; code: string; blockRequested: boolean }> {
    const id = uuidv7();
    const code = await this.docNumbers.allocate(tx, 'work_order');
    const sla = await this.params.get<WoSla>(tx, 'wo_sla', c.today);
    const due = deadlines(sla, w.severity, c.now);
    const userId = c.actor.userId || null;
    await tx.query(
      `INSERT INTO work_order (id, organization_id, property_id, code, room_id, title, description, category,
         severity, status, source, reported_by, assignee_user_id, ack_due_at, resolve_due_at,
         photo_attachment_ids, block_requested, guest_request_id, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', $10, $11, $12, $13, $14, $15, $16, $17, $18, $11, $18)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        w.roomId,
        w.title,
        w.description,
        w.category,
        w.severity,
        w.source,
        userId,
        w.assignee,
        due.ackDueAt,
        due.resolveDueAt,
        w.photoIds,
        w.blockRequested,
        w.guestRequestId,
        c.now,
      ],
    );
    for (const [i, photo] of w.photoIds.entries()) {
      await this.attachments.bindTo(
        tx,
        photo,
        { type: 'work_order', id },
        {
          field: `photoAttachmentIds[${i}]`,
        },
      );
    }
    await this.transitionLog(tx, c, id, null, 'new', 'W1', null);
    await this.record(tx, c, id, code, 'created', null, 'new', null);
    // B-08: high → MT + FD + MGR (and "Cần chú ý" – computed source); others → MT. Content: kind + code only.
    await this.events.notify(
      tx,
      w.severity === 'high'
        ? {
            kind: 'work_order_high_new',
            roles: [MT, ...FD_PLUS],
            refType: 'work_order',
            refId: id,
            refCode: code,
          }
        : { kind: 'work_order_new', roles: [MT], refType: 'work_order', refId: id, refCode: code },
      c.now,
    );
    await this.events.publish(tx, 'work_order.changed', id);
    return { id, code, blockRequested: w.blockRequested };
  }

  private async transitionLog(
    tx: Tx,
    c: HkCtx,
    id: string,
    from: string | null,
    to: string,
    code: string,
    note: string | null,
  ): Promise<void> {
    await tx.query(
      `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
         event_code, actor_type, actor_user_id, reason_note, occurred_at)
       VALUES ($1, $2, 'SM-04', $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        id,
        from,
        to,
        code,
        tx.ctx.actorType,
        tx.ctx.actorType === 'user' ? tx.ctx.userId : null,
        note,
        c.now,
      ],
    );
  }

  /** One history entry (audit_event `work_order.<change>`): before → after values only, note as reason. */
  private async record(
    tx: Tx,
    c: HkCtx,
    id: string,
    code: string,
    change: string,
    from: string | null,
    to: string | null,
    note: string | null,
  ): Promise<void> {
    await this.audit.record(tx, {
      category: 'state',
      action: `work_order.${change}`,
      entityType: 'work_order',
      entityId: id,
      entityCode: code,
      after: { change, from, to },
      ...(note ? { reason: note } : {}),
      ...(c.actor.requestId ? { requestId: c.actor.requestId } : {}),
    });
  }

  // ───────────────────────── update (A85) ─────────────────────────

  async update(
    tx: Tx,
    c: HkCtx,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ) {
    const w = await this.row(tx, id, true);
    if (!w) throw problem('NOT_FOUND');
    assertVersion(w.version, expectedVersion);
    const errors: FieldError[] = [];
    const known = ['assigneeUserId', 'severity', 'partsNote', 'blockRequested'];
    for (const k of Object.keys(body))
      if (!known.includes(k)) errors.push({ field: k, code: 'NOT_ALLOWED' });
    let assignee: string | null | undefined;
    if (body.assigneeUserId !== undefined) {
      if (body.assigneeUserId === null) assignee = null;
      else if (typeof body.assigneeUserId === 'string' && UUID.test(body.assigneeUserId)) {
        assignee = body.assigneeUserId;
      } else errors.push({ field: 'assigneeUserId', code: 'NOT_IN_LIST' });
    }
    const severity = body.severity as WorkOrderSeverity | undefined;
    if (
      severity !== undefined &&
      !(WORK_ORDER_SEVERITIES as readonly string[]).includes(severity)
    ) {
      errors.push({ field: 'severity', code: 'NOT_IN_LIST' });
    }
    const partsNote =
      body.partsNote === undefined
        ? undefined
        : text(errors, 'partsNote', body.partsNote, { max: 500 });
    if (body.blockRequested !== undefined && body.blockRequested !== false) {
      // B-09: FD+/MT withdraw the request; a block is made with createRoomBlock + workOrderId.
      errors.push({ field: 'blockRequested', code: 'NOT_ALLOWED' });
    }
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    assertNoCardNumber('partsNote', partsNote ?? null);
    if (assignee && !(await this.hasRole(tx, assignee, [MT, ...FD_PLUS]))) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'assigneeUserId', code: 'NOT_IN_LIST' }],
      });
    }
    if (assignee !== undefined && assignee !== w.assignee_user_id) {
      await tx.query('UPDATE work_order SET assignee_user_id = $2 WHERE id = $1', [id, assignee]);
      await this.record(
        tx,
        c,
        id,
        w.code,
        'assignee',
        w.assignee_name,
        assignee ? await this.nameOf(tx, assignee) : null,
        null,
      );
    }
    if (severity !== undefined && severity !== w.severity) {
      // EP07 6.3: new deadlines from the creation time with the new severity.
      const due = deadlines(
        await this.params.get<WoSla>(tx, 'wo_sla', c.today),
        severity,
        w.created_at,
      );
      await tx.query(
        `UPDATE work_order SET severity = $2, ack_due_at = $3, resolve_due_at = $4, overdue_notified_at = NULL
          WHERE id = $1`,
        [id, severity, due.ackDueAt, due.resolveDueAt],
      );
      await this.record(tx, c, id, w.code, 'severity', w.severity, severity, null);
      if (severity === 'high') {
        await this.events.notify(
          tx,
          {
            kind: 'work_order_high_new',
            roles: [MT, ...FD_PLUS],
            refType: 'work_order',
            refId: id,
            refCode: w.code,
          },
          c.now,
        );
      }
    }
    if (partsNote !== undefined && partsNote !== w.parts_note) {
      await tx.query('UPDATE work_order SET parts_note = $2 WHERE id = $1', [id, partsNote]);
      await this.record(tx, c, id, w.code, 'note', null, null, partsNote);
    }
    if (body.blockRequested === false && w.block_requested) {
      await tx.query('UPDATE work_order SET block_requested = false WHERE id = $1', [id]);
      await this.record(tx, c, id, w.code, 'block_requested', 'true', 'false', null);
    }
    await tx.query('UPDATE work_order SET updated_at = $2, version = version + 1 WHERE id = $1', [
      id,
      c.now,
    ]);
    await this.events.publish(tx, 'work_order.changed', id);
    return this.get(tx, c, id);
  }

  private async nameOf(tx: Tx, userId: string): Promise<string | null> {
    const { rows } = await tx.query<{ display_name: string }>(
      'SELECT display_name FROM app_user WHERE id = $1',
      [userId],
    );
    return rows[0]?.display_name ?? null;
  }

  // ───────────────────────── transitions (SM-04) ─────────────────────────

  async transition(
    tx: Tx,
    c: HkCtx,
    id: string,
    actionRaw: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ) {
    if (!(WO_ACTIONS as readonly string[]).includes(actionRaw)) throw problem('NOT_FOUND');
    const action = actionRaw as WoAction;
    const w = await this.row(tx, id, true);
    if (!w) throw problem('NOT_FOUND');
    assertVersion(w.version, expectedVersion);
    const desk = has(c.actor.roles, FD_PLUS);
    if (action === 'reopen' && !desk) throw problem('FORBIDDEN_ACTION');
    if (action === 'cancel' && !desk && !(w.created_by === c.actor.userId && w.status === 'new')) {
      // EP07 6.1: MT cancels only a work order it created, still `new`.
      throw problem('FORBIDDEN_ACTION');
    }
    const to = woTarget(w.status, action);
    if (!to) throw problem('INVALID_TRANSITION', { extras: { currentState: w.status } });
    const errors: FieldError[] = [];
    let note: string | null = null;
    if (action === 'wait-parts' || action === 'reopen') {
      note = text(errors, 'note', body.note, { required: true, min: 3, max: 500 });
    } else if (body.note !== undefined) {
      note = text(errors, 'note', body.note, { max: 500 });
    }
    let partsDate: string | null = null;
    if (action === 'wait-parts') {
      const v = body.partsExpectedDate;
      if (v === undefined || v === null) {
        if (w.severity !== 'high') errors.push({ field: 'partsExpectedDate', code: 'REQUIRED' });
      } else if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        errors.push({ field: 'partsExpectedDate', code: 'VALIDATION_FAILED' });
      } else if (v < c.today) errors.push({ field: 'partsExpectedDate', code: 'DATE_IN_PAST' });
      else partsDate = v;
    }
    let resultNote: string | null = null;
    let donePhotos: string[] = [];
    if (action === 'complete') {
      resultNote = text(errors, 'resultNote', body.resultNote, {
        required: true,
        min: 3,
        max: 500,
      });
      donePhotos = photos(errors, 'photoAttachmentIds', body.photoAttachmentIds, 4);
      const required = await this.params.get<string[]>(
        tx,
        'wo_done_photo_required_severities',
        c.today,
      );
      if (donePhotos.length === 0 && Array.isArray(required) && required.includes(w.severity)) {
        errors.push({ field: 'photoAttachmentIds', code: 'EVIDENCE_REQUIRED' });
      }
    }
    let cancelReason: string | null = null;
    if (action === 'cancel') {
      cancelReason = text(errors, 'cancelReason', body.cancelReason, {
        required: true,
        min: 3,
        max: 500,
      });
      if (!cancelReason && !errors.some((e) => e.field === 'cancelReason')) {
        errors.push({ field: 'cancelReason', code: 'REASON_REQUIRED' });
      }
    }
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    assertNoCardNumber('note', note);
    assertNoCardNumber('resultNote', resultNote);
    assertNoCardNumber('cancelReason', cancelReason);
    if (action === 'reopen' && !(await this.reopenable(tx, c, w))) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: w.status } });
    }
    for (const [i, photo] of donePhotos.entries()) {
      await this.attachments.assertUsable(tx, c.actor, photo, 'work_order', {
        field: `photoAttachmentIds[${i}]`,
      });
    }
    const sets: string[] = ['status = $2', 'updated_at = $3', 'version = version + 1'];
    const args: unknown[] = [id, to, c.now];
    const put = (sql: string, v: unknown) => {
      args.push(v);
      sets.push(sql.replace('?', `$${args.length}`));
    };
    if (action === 'accept') {
      put('accepted_at = ?', c.now);
      if (!w.assignee_user_id) put('assignee_user_id = ?', c.actor.userId);
    } else if (action === 'wait-parts') {
      put('parts_note = ?', note);
      put('parts_expected_date = ?', partsDate);
      // BR-809: medium/low pause their deadline while waiting for parts with a date; high never pauses.
      if (w.severity !== 'high' && partsDate) put('paused_at = ?', c.now);
    } else if (action === 'resume') {
      if (w.paused_at && w.resolve_due_at) {
        put(
          'resolve_due_at = ?',
          new Date(w.resolve_due_at.getTime() + (c.now.getTime() - w.paused_at.getTime())),
        );
      }
      put('paused_at = ?', null);
    } else if (action === 'complete') {
      put('result_note = ?', resultNote);
      put('done_photo_attachment_ids = ?', donePhotos);
      put('done_at = ?', c.now);
      put('done_by = ?', c.actor.userId);
      put('paused_at = ?', null);
      put('block_requested = ?', false);
    } else if (action === 'cancel') {
      put('cancel_reason = ?', cancelReason);
      put('paused_at = ?', null);
      put('block_requested = ?', false);
    } else if (action === 'reopen') {
      const due = deadlines(await this.params.get<WoSla>(tx, 'wo_sla', c.today), w.severity, c.now);
      put('ack_due_at = ?', due.ackDueAt);
      put('resolve_due_at = ?', due.resolveDueAt);
      put('reopened_count = ?', w.reopened_count + 1);
      put('done_at = ?', null);
      put('overdue_notified_at = ?', null);
      put('remedy_suggested_at = ?', null);
    }
    await tx.query(`UPDATE work_order SET ${sets.join(', ')} WHERE id = $1`, args);
    for (const [i, photo] of donePhotos.entries()) {
      await this.attachments.bindTo(
        tx,
        photo,
        { type: 'work_order', id },
        {
          field: `photoAttachmentIds[${i}]`,
        },
      );
    }
    await this.transitionLog(
      tx,
      c,
      id,
      w.status,
      to,
      WO_CODE[action],
      note ?? cancelReason ?? resultNote,
    );
    await this.record(tx, c, id, w.code, 'status', w.status, to, note ?? cancelReason);
    if (action === 'wait-parts' && partsDate) {
      await this.record(
        tx,
        c,
        id,
        w.code,
        'parts_expected_date',
        w.parts_expected_date,
        partsDate,
        null,
      );
    }
    if (action === 'complete' || action === 'cancel') {
      // O4 / O5 (US-062 AC1, EP07 6.5): the linked block closes; an active one gives the room back as VD with
      // an after-repair cleaning (R11).
      const closed = await this.blocks.closeForWorkOrder(
        tx,
        c.actor,
        c.actor.requestId,
        id,
        action === 'complete' ? `Phiếu ${w.code} đã sửa xong` : `Phiếu ${w.code} đã hủy`,
      );
      if (closed) {
        await this.record(tx, c, id, w.code, 'block', null, closed.action, null);
        if (closed.action === 'released') await this.hk.onRoomReleased(tx, c, closed.roomId);
      }
    }
    await this.events.publish(tx, 'work_order.changed', id);
    return this.get(tx, c, id);
  }

  // ───────────────────────── EP14 (BE-D's guest requests) ─────────────────────────

  async createFromGuestRequest(
    tx: Tx,
    c: HkCtx,
    input: { guestRequestId: string; roomId: string; description: string | null },
  ): Promise<{ workOrderId: string; code: string }> {
    const room = (
      await tx.query<{ room_no: string }>('SELECT room_no FROM room WHERE id = $1', [input.roomId])
    ).rows[0];
    if (!room) throw new Error(`room ${input.roomId} not visible`);
    const created = await this.insert(tx, c, {
      roomId: input.roomId,
      title: `Khách báo hỏng – căn ${room.room_no}`,
      description: (input.description ?? '').trim() || 'Khách báo hỏng qua app khách',
      category: 'other',
      severity: 'medium',
      source: 'guest_app',
      assignee: null,
      photoIds: [],
      blockRequested: false,
      guestRequestId: input.guestRequestId,
    });
    return { workOrderId: created.id, code: created.code };
  }
}
