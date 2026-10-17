/**
 * Guest requests (EP14 3–4; US-109, US-110; BR-811, BR-506 + ESC-016 A, BR-809; SM-15; OpenAPI 0.3.6 B-14…B-16,
 * 0.3.7) – BE-D Sprint 4.
 *
 * Guest side (level-1 session, one booking – `x-after-checkout: blocked`):
 * - options        the types usable now + fee (listGuestRequestOptions): HK/MT types only in house (EP14 3.1);
 *                  `extra_cleaning` is charged for a long stay, and for a short stay only as the SECOND full clean
 *                  of the day (BR-506, ESC-016 A); a charged type is unavailable after 3 open paid requests.
 * - create         validation (type, note per type, V-09, `feeAccepted` when charged), ≤ 20 per booking and
 *                  business day (SR-RL-05 → 429), routing + `ackDueAt` + auto reply out of hours (BR-811), the job
 *                  of the department through GUEST_REQUEST_WORK_PORT (BE-C), notification `guest_request_new`
 *                  to the department + desk, SSE `guest_request.changed` (department + FD+), SM-15 history.
 * - listMine       the booking's requests, newest first, `statusLabel` / `autoReply` in the session language.
 * Staff side (S30): list (HK/MT only what is routed to them – US-110 AC3) and transition (acknowledge /
 * complete / decline – SM-15; decline FD+ only; `replyNote` V-09 + SEC B-15 digits rule).
 * Linked work (BE-C → GuestRequestStatusPort): started → in_progress, done → done.
 * `done` posts the accepted fee ONCE to the folio through FolioService.postLines (BE-B FolioPort – category
 * `cleaning`, source `guest_app`, charge code `adhoc_cleaning`).
 * J10 `guest_request.sla` + "Cần chú ý" `guest_request_overdue`: requests still `new` after `ackDueAt` (US-110 AC2).
 * The note (C2, D23) never goes into a notification, push, SSE payload or log.
 */
import { Inject, Injectable, type OnModuleInit, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import {
  GUEST_REQUEST_DECLINE_CODES,
  GUEST_REQUEST_STATUSES,
  GUEST_REQUEST_TYPES,
  type GuestRequestStatus,
  type GuestRequestType,
} from '../../../db/schema/guest-requests';
import { GUEST_REQUEST_COPY } from '../../../generated/guest-request-copy';
import { JobRegistry } from '../../../jobs/job-runner';
import type { GuestPrincipal } from '../../../shared/http/guest-session';
import { problem } from '../../../shared/problem';
import { type LocalDate, type LocalTime, atLocal, toZonedIso } from '../../../shared/time';
import { containsCardNumber, stripControlChars } from '../../../shared/validation';
import { EventsService, FD_PLUS, type AttentionSource } from '../../events/public/events.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { guestRoomView } from '../../reservations/public/guest-room-view';
import type { StayView } from '../../registration/public/registration.service';
import {
  GUEST_REQUEST_WORK_PORT,
  type GuestRequestWork,
  UnwiredGuestRequestWorkPort,
} from '../public/guest-request-ports';
import { guestRequestSlaJob } from '../public/guest-request-jobs';
import { GuestRequestLifecycle, sseRoles } from './guest-request-lifecycle';
import {
  GUEST_REQUESTS_PER_DAY,
  OPEN_PAID_REQUESTS_MAX,
  type RoutedTo,
  ackDueOf,
  cleaningFee,
  deskHoursOf,
  hasSensitiveDigits,
  needsInHouse,
  noteRequired,
  renderAutoReply,
  routeOf,
} from './guest-request-rules';

const OPEN: readonly GuestRequestStatus[] = ['new', 'acknowledged', 'in_progress'];
const DESK = ['front_desk_lead', 'front_desk'] as const;
const FULL_CLEAN_TYPES = ['stayover_clean', 'long_stay_clean', 'adhoc_clean', 'priority_clean'];

export interface GuestRequestRow {
  id: string;
  reservation_id: string;
  room_id: string | null;
  type: GuestRequestType;
  note: string | null;
  status: GuestRequestStatus;
  routed_to: RoutedTo;
  ack_due_at: Date;
  acknowledged_at: Date | null;
  auto_replied_at: Date | null;
  hk_task_id: string | null;
  work_order_id: string | null;
  fee_vnd_snapshot: number | string | null;
  fee_folio_line_id: string | null;
  declined_reason_code: string | null;
  reply_note: string | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

export interface StaffActor {
  userId: string;
  roles: readonly string[];
  requestId?: string;
}

export interface RequestOption {
  type: GuestRequestType;
  available: boolean;
  unavailableReason:
    'outside_service_hours' | 'not_in_house' | 'paid_limit_reached' | 'not_offered' | null;
  feeVnd: number | null;
  feeReason: 'second_full_clean' | 'long_stay_adhoc' | null;
  lastFullCleanTime: string | null;
  noteRequired: boolean;
}

interface PropCtx {
  tz: string;
  now: Date;
  today: LocalDate;
  iso(d: Date): string;
}

const fieldError = (field: string, code: string, extras: Record<string, unknown> = {}) =>
  problem('VALIDATION_FAILED', { errors: [{ field, code }], extras });

/** Department roles notified with the desk (EP14 4.1 "bộ phận được định tuyến + FD"). */
function rolesFor(routed: RoutedTo): string[] {
  if (routed === 'housekeeping') return ['housekeeping', ...DESK];
  if (routed === 'maintenance') return ['maintenance', ...DESK];
  return [...DESK];
}

const copy = (locale: string, key: string): string | undefined =>
  (GUEST_REQUEST_COPY[locale] ?? GUEST_REQUEST_COPY.en)?.[key] ?? GUEST_REQUEST_COPY.en?.[key];

@Injectable()
export class GuestRequestsService implements OnModuleInit {
  private readonly work: GuestRequestWork;

  constructor(
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(GuestRequestLifecycle) private readonly lifecycle: GuestRequestLifecycle,
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(GUEST_REQUEST_WORK_PORT) work?: GuestRequestWork,
  ) {
    this.work = work ?? new UnwiredGuestRequestWorkPort();
  }

  onModuleInit(): void {
    this.events.registerAttentionSource(guestRequestOverdueSource);
    const j10 = guestRequestSlaJob(this.events);
    if (!this.jobs.get(j10.key)) this.jobs.register(j10);
  }

  /** True when BE-C has bound the work port (tests / diagnostics). */
  get workPortWired(): boolean {
    return !(this.work instanceof UnwiredGuestRequestWorkPort);
  }

  private async ctx(tx: Tx): Promise<PropCtx> {
    const p = await this.property.now(tx);
    return { tz: p.timezone, now: p.now, today: p.today, iso: p.iso };
  }

  private async startOfBusinessDay(tx: Tx, c: PropCtx): Promise<Date> {
    const rollover = await this.params.get<LocalTime>(tx, 'business_day_rollover', c.today);
    return atLocal(c.today, rollover, c.tz);
  }

  // ───────────────────────── guest side ─────────────────────────

  async options(tx: Tx, stay: StayView): Promise<RequestOption[]> {
    const c = await this.ctx(tx);
    const inHouse = stay.status === 'in_house';
    const room = await guestRoomView(tx, stay.reservationId);
    const clean = inHouse
      ? cleaningFee({
          stayType: stay.stayType,
          feeVnd: await this.params.get<number>(tx, 'adhoc_cleaning_fee', c.today),
          lastFullCleanTime: room?.roomId
            ? await this.lastFullClean(tx, room.roomId, stay, c)
            : null,
        })
      : { feeVnd: null, feeReason: null, lastFullCleanTime: null };
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM guest_request
        WHERE reservation_id = $1 AND fee_vnd_snapshot > 0 AND status = ANY($2::text[])`,
      [stay.reservationId, [...OPEN]],
    );
    const openPaid = rows[0]?.n ?? 0;
    return GUEST_REQUEST_TYPES.map((type): RequestOption => {
      const fee = type === 'extra_cleaning' ? clean : null;
      const base = {
        type,
        feeVnd: fee?.feeVnd ?? null,
        feeReason: fee?.feeReason ?? null,
        lastFullCleanTime: fee?.lastFullCleanTime ?? null,
        noteRequired: noteRequired(type),
      };
      if (needsInHouse(type) && !inHouse) {
        return { ...base, available: false, unavailableReason: 'not_in_house' };
      }
      if ((fee?.feeVnd ?? 0) > 0 && openPaid >= OPEN_PAID_REQUESTS_MAX) {
        return { ...base, available: false, unavailableReason: 'paid_limit_reached' };
      }
      return { ...base, available: true, unavailableReason: null };
    });
  }

  /**
   * BR-506 short stay: time of the last FULL clean of this stay done today (business day) in the room – the
   * daily clean, a long-stay/ad-hoc/priority clean, or an earlier `extra_cleaning` request's task. A clean
   * before this guest checked in (room preparation) does not count.
   */
  private async lastFullClean(
    tx: Tx,
    roomId: string,
    stay: StayView,
    c: PropCtx,
  ): Promise<string | null> {
    const dayStart = await this.startOfBusinessDay(tx, c);
    const since =
      stay.actualCheckinAt && stay.actualCheckinAt.getTime() > dayStart.getTime()
        ? stay.actualCheckinAt
        : dayStart;
    const { rows } = await tx.query<{ done_at: Date }>(
      `SELECT t.done_at FROM hk_task t
         LEFT JOIN guest_request g ON g.id = t.guest_request_id
        WHERE t.room_id = $1 AND t.status = 'done' AND t.done_at >= $2 AND t.done_at <= $3
          AND (t.type = ANY($4::text[]) OR (t.type = 'guest_request' AND g.type = 'extra_cleaning'))
        ORDER BY t.done_at DESC LIMIT 1`,
      [roomId, since, c.now, FULL_CLEAN_TYPES],
    );
    const at = rows[0]?.done_at;
    return at ? toZonedIso(at, c.tz).slice(11, 16) : null;
  }

  async listMine(tx: Tx, g: GuestPrincipal): Promise<Array<Record<string, unknown>>> {
    const c = await this.ctx(tx);
    const { rows } = await tx.query<GuestRequestRow>(
      `SELECT * FROM guest_request WHERE reservation_id = $1 ORDER BY created_at DESC, id DESC LIMIT 200`,
      [g.reservationId],
    );
    const auto = await this.autoReplyContext(tx, c);
    return rows.map((r) => this.guestDto(r, g.locale, c, auto));
  }

  async create(
    tx: Tx,
    g: GuestPrincipal,
    stay: StayView,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const c = await this.ctx(tx);
    const type = body.type;
    if (type === undefined || type === null || type === '') throw fieldError('type', 'REQUIRED');
    if (typeof type !== 'string' || !(GUEST_REQUEST_TYPES as readonly string[]).includes(type)) {
      throw fieldError('type', 'NOT_IN_LIST');
    }
    const t = type as GuestRequestType;
    const note = this.note(t, body.note);
    // SR-RL-05: ≤ 20 requests per booking and business day.
    const since = await this.startOfBusinessDay(tx, c);
    const { rows: today } = await tx.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM guest_request WHERE reservation_id = $1 AND created_at >= $2',
      [stay.reservationId, since],
    );
    if ((today[0]?.n ?? 0) >= GUEST_REQUESTS_PER_DAY) {
      // Retry when the next business day starts (one day after this one's start – Vietnam has no DST).
      const wait = since.getTime() + 86_400_000 - c.now.getTime();
      throw problem('RATE_LIMITED', {
        headers: { 'Retry-After': String(Math.max(1, Math.ceil(wait / 1000))) },
      });
    }
    const option = (await this.options(tx, stay)).find((o) => o.type === t);
    if (!option?.available) {
      throw fieldError('type', 'REQUEST_TYPE_NOT_AVAILABLE', {
        unavailableReason: option?.unavailableReason ?? 'not_offered',
      });
    }
    const fee = option.feeVnd ?? 0;
    if (fee > 0 && body.feeAccepted !== true) throw fieldError('feeAccepted', 'FEE_NOT_ACCEPTED');
    const routed = routeOf(t);
    const hours = deskHoursOf(await this.params.get<unknown>(tx, 'front_desk_hours', c.today));
    const minutes = await this.params.get<number>(tx, 'guest_request_response_minutes', c.today);
    const due = ackDueOf(c.now, c.tz, hours, minutes);
    const room = await guestRoomView(tx, stay.reservationId);
    const id = uuidv7();
    await tx.query(
      `INSERT INTO guest_request (id, organization_id, property_id, reservation_id, room_id, type, note, status,
         routed_to, ack_due_at, auto_replied_at, fee_vnd_snapshot, fee_accepted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', $8, $9, $10, $11, $12, $13, $13)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        stay.reservationId,
        room?.roomId ?? null,
        t,
        note,
        routed,
        due.ackDueAt,
        due.inHours ? null : c.now,
        fee > 0 ? fee : null,
        fee > 0 ? c.now : null,
        c.now,
      ],
    );
    await this.lifecycle.history(
      tx,
      id,
      null,
      'new',
      'guest_request_created',
      c.now,
      'guest',
      null,
    );
    // The department's job, same transaction (BE-C port; null = not wired yet → handled from the list).
    if (room?.roomId && (t === 'extra_cleaning' || t === 'amenities')) {
      const task = await this.work.createTask(tx, {
        guestRequestId: id,
        reservationId: stay.reservationId,
        roomId: room.roomId,
        note,
        dueDate: c.today,
        now: c.now,
      });
      if (task) {
        await tx.query('UPDATE guest_request SET hk_task_id = $2 WHERE id = $1', [
          id,
          task.hkTaskId,
        ]);
      }
    } else if (room?.roomId && t === 'report_issue') {
      // BR-811 "báo ngay" out of hours: BE-C notifies maintenance at once whatever the hour.
      const wo = await this.work.createWorkOrder(tx, {
        guestRequestId: id,
        reservationId: stay.reservationId,
        roomId: room.roomId,
        description: note,
        now: c.now,
      });
      if (wo) {
        await tx.query('UPDATE guest_request SET work_order_id = $2 WHERE id = $1', [
          id,
          wo.workOrderId,
        ]);
      }
    }
    await this.events.notify(
      tx,
      {
        kind: 'guest_request_new',
        roles: rolesFor(routed),
        refType: 'guest_request',
        refId: id,
        refCode: room?.roomNo ?? stay.code,
      },
      c.now,
    );
    await this.events.publish(tx, 'guest_request.changed', id, { roles: sseRoles(routed) });
    const row = await this.row(tx, id);
    return this.guestDto(row, g.locale, c, await this.autoReplyContext(tx, c));
  }

  /** EP14 3.2: note required for report_issue / transport_tour / other (3–500), V-09, plain text. */
  private note(type: GuestRequestType, raw: unknown): string | null {
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      throw fieldError('note', 'VALIDATION_FAILED');
    }
    const text = typeof raw === 'string' ? stripControlChars(raw).trim() : '';
    if (noteRequired(type) && text.length < 3) throw fieldError('note', 'REQUIRED');
    if (text.length > 500) throw fieldError('note', 'TOO_LONG');
    if (text && containsCardNumber(text)) {
      throw problem('CARD_NUMBER_DETECTED', {
        errors: [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }],
      });
    }
    return text === '' ? null : text;
  }

  private async autoReplyContext(
    tx: Tx,
    c: PropCtx,
  ): Promise<{ openTime: string; phone: string | null }> {
    const hours = deskHoursOf(await this.params.get<unknown>(tx, 'front_desk_hours', c.today));
    const { rows } = await tx.query<{ phone_public: string | null }>(
      'SELECT phone_public FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    return { openTime: hours.from, phone: rows[0]?.phone_public ?? null };
  }

  /** OpenAPI GuestRequestForGuest (level 1 – the guest's own note and the staff reply only). */
  private guestDto(
    r: GuestRequestRow,
    locale: string,
    c: PropCtx,
    auto: { openTime: string; phone: string | null },
  ): Record<string, unknown> {
    const template = r.auto_replied_at ? copy(locale, 'guest.req.auto_reply') : undefined;
    const fee = r.fee_vnd_snapshot === null ? null : Number(r.fee_vnd_snapshot);
    return {
      id: r.id,
      type: r.type,
      ...(r.note ? { note: r.note } : {}),
      status: r.status,
      statusLabel: copy(locale, `guest.req.status.${r.status}`) ?? r.status,
      ...(template && r.auto_replied_at
        ? {
            autoReply: renderAutoReply(template, {
              time: c.iso(r.auto_replied_at).slice(11, 16),
              openTime: auto.openTime,
              phone: auto.phone,
            }),
          }
        : {}),
      ...(r.declined_reason_code ? { declinedReasonCode: r.declined_reason_code } : {}),
      ...(r.reply_note ? { replyNote: r.reply_note } : {}),
      feeVnd: fee,
      createdAt: c.iso(r.created_at),
      updatedAt: c.iso(r.updated_at),
    };
  }

  // ───────────────────────── staff side (S30) ─────────────────────────

  /** HK/MT see only what is routed to them (x-scope routed_to_me, US-110 AC3); FD+ everything. */
  private scope(roles: readonly string[]): RoutedTo[] | null {
    if (roles.some((r) => (FD_PLUS as readonly string[]).includes(r))) return null;
    const out: RoutedTo[] = [];
    if (roles.includes('housekeeping')) out.push('housekeeping');
    if (roles.includes('maintenance')) out.push('maintenance');
    return out;
  }

  async list(
    tx: Tx,
    actor: StaffActor,
    status: string | undefined,
  ): Promise<Array<Record<string, unknown>>> {
    const c = await this.ctx(tx);
    let statuses: readonly string[] = OPEN;
    if (status !== undefined && status !== '') {
      if (!(GUEST_REQUEST_STATUSES as readonly string[]).includes(status)) {
        throw fieldError('status', 'NOT_IN_LIST');
      }
      statuses = [status];
    }
    const scope = this.scope(actor.roles);
    const { rows } = await tx.query<
      GuestRequestRow & { room_no: string | null; room_name: string | null }
    >(
      `SELECT g.*, rm.room_no, rm.name AS room_name FROM guest_request g
         LEFT JOIN room rm ON rm.id = g.room_id
        WHERE g.status = ANY($1::text[]) AND ($2::text[] IS NULL OR g.routed_to = ANY($2::text[]))
        ORDER BY (g.status = 'new' AND g.ack_due_at <= $3) DESC, g.ack_due_at, g.created_at, g.id
        LIMIT 200`,
      [[...statuses], scope, c.now],
    );
    const out: Array<Record<string, unknown>> = [];
    for (const r of rows) out.push(await this.staffDto(tx, r, c));
    return out;
  }

  /** OpenAPI GuestRequest (the serializer drops `feeVnd` for HK/MT, `note` D23 for SAL/CTV). */
  private async staffDto(
    tx: Tx,
    r: GuestRequestRow & { room_no?: string | null; room_name?: string | null },
    c: PropCtx,
  ): Promise<Record<string, unknown>> {
    let roomNo = r.room_no ?? null;
    let roomName = r.room_name ?? null;
    if (roomNo === null) {
      // Request taken before the booking had a room (front-desk types before arrival): its room now.
      const v = await guestRoomView(tx, r.reservation_id);
      roomNo = v?.roomNo ?? null;
      roomName = v?.roomName ?? null;
    }
    return {
      id: r.id,
      reservationId: r.reservation_id,
      // 0.3.7 bổ sung 1 (ARC 11.2 #10): null while the booking has no room – never ''.
      roomNo,
      roomName,
      type: r.type,
      ...(r.note ? { note: r.note } : {}),
      status: r.status,
      routedTo: r.routed_to,
      ackDueAt: c.iso(r.ack_due_at),
      isAckOverdue: r.status === 'new' && r.ack_due_at.getTime() <= c.now.getTime(),
      ...(r.hk_task_id ? { hkTaskId: r.hk_task_id } : {}),
      ...(r.work_order_id ? { workOrderId: r.work_order_id } : {}),
      createdAt: c.iso(r.created_at),
      updatedAt: c.iso(r.updated_at),
      feeVnd: r.fee_vnd_snapshot === null ? null : Number(r.fee_vnd_snapshot),
      ...(r.declined_reason_code ? { declinedReasonCode: r.declined_reason_code } : {}),
      ...(r.reply_note ? { replyNote: r.reply_note } : {}),
    };
  }

  private async row(tx: Tx, id: string, lock = false): Promise<GuestRequestRow> {
    const { rows } = await tx.query<GuestRequestRow>(
      `SELECT * FROM guest_request WHERE id = $1${lock ? ' FOR UPDATE' : ''}`,
      [id],
    );
    const r = rows[0];
    if (!r) throw problem('NOT_FOUND');
    return r;
  }

  async transition(
    tx: Tx,
    actor: StaffActor,
    id: string,
    action: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const c = await this.ctx(tx);
    const r = await this.row(tx, id, true);
    const scope = this.scope(actor.roles);
    // HK/MT: a request routed elsewhere does not exist for them (no existence leak).
    if (scope && !scope.includes(r.routed_to)) throw problem('NOT_FOUND');
    const fd = scope === null;
    const invalid = () => problem('INVALID_TRANSITION', { extras: { currentState: r.status } });
    let to: GuestRequestStatus;
    if (action === 'acknowledge') {
      if (r.status !== 'new') throw invalid();
      to = 'acknowledged';
      await tx.query(
        `UPDATE guest_request SET status = 'acknowledged', acknowledged_at = $2, acknowledged_by = $3,
                updated_at = $2, version = version + 1 WHERE id = $1`,
        [id, c.now, actor.userId],
      );
    } else if (action === 'complete') {
      // FD+; HK/MT only while no task / work order carries the request (port not wired – EP14 4.4).
      if (!fd && (r.hk_task_id || r.work_order_id)) throw problem('FORBIDDEN_ACTION');
      if (r.status !== 'acknowledged' && r.status !== 'in_progress') throw invalid();
      const reply = await this.replyNote(tx, body.replyNote, false);
      to = 'done';
      await tx.query(
        `UPDATE guest_request SET status = 'done', reply_note = COALESCE($3, reply_note), closed_at = $2,
                closed_by = $4, updated_at = $2, version = version + 1 WHERE id = $1`,
        [id, c.now, reply, actor.userId],
      );
      await this.lifecycle.postFee(tx, r, actor.userId, actor.requestId);
    } else if (action === 'decline') {
      if (!fd) throw problem('FORBIDDEN_ACTION');
      if (r.status !== 'new' && r.status !== 'acknowledged') throw invalid();
      const code = body.declinedReasonCode;
      if (code === undefined || code === null || code === '') {
        throw fieldError('declinedReasonCode', 'REQUIRED');
      }
      if (
        typeof code !== 'string' ||
        !(GUEST_REQUEST_DECLINE_CODES as readonly string[]).includes(code)
      ) {
        throw fieldError('declinedReasonCode', 'NOT_IN_LIST');
      }
      const reply = await this.replyNote(tx, body.replyNote, code === 'other');
      to = 'declined';
      await tx.query(
        `UPDATE guest_request SET status = 'declined', declined_reason_code = $3,
                reply_note = COALESCE($4, reply_note), closed_at = $2, closed_by = $5, updated_at = $2,
                version = version + 1 WHERE id = $1`,
        [id, c.now, code, reply, actor.userId],
      );
      if (r.hk_task_id) await this.work.cancelTask(tx, r.hk_task_id, c.now);
    } else {
      throw problem('NOT_FOUND');
    }
    await this.lifecycle.history(
      tx,
      id,
      r.status,
      to,
      `guest_request_${action}`,
      c.now,
      'user',
      actor.userId,
    );
    await this.events.publish(tx, 'guest_request.changed', id, { roles: sseRoles(r.routed_to) });
    const { rows } = await tx.query<
      GuestRequestRow & { room_no: string | null; room_name: string | null }
    >(
      `SELECT g.*, rm.room_no, rm.name AS room_name FROM guest_request g LEFT JOIN room rm ON rm.id = g.room_id
        WHERE g.id = $1`,
      [id],
    );
    return this.staffDto(tx, rows[0] as GuestRequestRow, c);
  }

  /** `replyNote` (B-15): ≤ 300, plain text, V-09 and the SEC digits rule; required for `other`. */
  private async replyNote(tx: Tx, raw: unknown, required: boolean): Promise<string | null> {
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      throw fieldError('replyNote', 'VALIDATION_FAILED');
    }
    const text = typeof raw === 'string' ? stripControlChars(raw).trim() : '';
    if (required && text.length === 0) throw fieldError('replyNote', 'REQUIRED');
    if (text.length > 300) throw fieldError('replyNote', 'TOO_LONG');
    if (!text) return null;
    if (containsCardNumber(text)) {
      throw problem('CARD_NUMBER_DETECTED', {
        errors: [{ field: 'replyNote', code: 'CARD_NUMBER_DETECTED' }],
      });
    }
    const { rows } = await tx.query<{ phone_public: string | null }>(
      'SELECT phone_public FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    if (hasSensitiveDigits(text, rows[0]?.phone_public ?? null)) {
      throw fieldError('replyNote', 'SENSITIVE_DATA_DETECTED');
    }
    return text;
  }
}

/**
 * "Cần chú ý" `guest_request_overdue` (EP14 4.3, US-110 AC2; FD+): requests still `new` after their reply
 * deadline – one line with the count, the earliest deadline and the rooms (no note, no name – SEC J).
 */
export const guestRequestOverdueSource: AttentionSource = async (tx, ctx) => {
  const { rows } = await tx.query<{ ack_due_at: Date; room_no: string | null }>(
    `SELECT g.ack_due_at, rm.room_no FROM guest_request g LEFT JOIN room rm ON rm.id = g.room_id
      WHERE g.status = 'new' AND g.ack_due_at <= $1 ORDER BY g.ack_due_at LIMIT 100`,
    [ctx.now],
  );
  const first = rows[0];
  if (!first) return [];
  return [
    {
      kind: 'guest_request_overdue',
      source: 'computed',
      severity: 'warning',
      count: rows.length,
      dueAt: ctx.iso(first.ack_due_at),
      roomNos: [...new Set(rows.map((r) => r.room_no).filter((n): n is string => !!n))],
      link: '/guest-requests',
      params: { count: rows.length },
    },
  ];
};
