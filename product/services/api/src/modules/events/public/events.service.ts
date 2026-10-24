/**
 * Events hub – public API for every module (ARC s3-contract 4.3; architecture 12; erd BE-ARC-06).
 *
 * - publish(tx, type, id)   light SSE event `{id}` (OpenAPI streamEvents): `pg_notify` inside the business
 *                           transaction, so PostgreSQL delivers it ONLY after COMMIT (a rolled-back use case
 *                           never notifies). Payload = type + id + audience – never C2/C3 (SR-C3-02, SEC A5).
 * - notify(tx, …)           staff inbox rows (`staff_notification`, kinds = OpenAPI StaffNotification.kind) for
 *                           the users holding the given roles in the property (and/or explicit users), plus
 *                           the push through the outbox (`staff.push`, Mock in R2) and `notification.created`
 *                           to each recipient only. `refCode` is a display code (OTM-…, room no.), max 40 chars.
 * - openAttention / resolveAttention   "Cần chú ý" items that cannot be computed from state (attention_event,
 *                           one open row per dedupe key). `params` keys are allow-listed per kind IN CODE
 *                           (SEC J / B-21): an unknown key is a programming error, never silently dropped.
 * - registerAttentionSource()  computed items contributed by the owning module (read at list time).
 */
import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import {
  NOTIFICATION_REF_TYPES,
  type NotificationRefType,
  STAFF_NOTIFICATION_KINDS,
  type StaffNotificationKind,
} from '../../../db/schema/frontdesk';

export const SSE_CHANNEL = 'ottimo_sse';

export const SSE_EVENT_TYPES = [
  'reservation.changed',
  'room.status_changed',
  'attention.changed',
  'hk_task.changed',
  'work_order.changed',
  'guest_request.changed',
  'notification.created',
  'registration.changed',
  'payment.changed',
  // 0.3.7 bổ sung 2 (US-155 – BE-D R3 Sprint 1): website booking requests (floor FD+; SAL added per request).
  'website_request.changed',
] as const;
export type SseEventType = (typeof SSE_EVENT_TYPES)[number];

export const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'] as const;
export const MGR_PLUS = ['owner', 'manager'] as const;
const OWNER_ONLY = ['owner'] as const;

/** `data_quality` check of J16's safety net (SEC FB-R2-SEC-BE-84 (a), OpenAPI 0.3.8 AttentionItem.params). */
export const ATTACHMENT_ANCHOR_MISSING_CHECK = 'attachment_retention_anchor_missing';
const HK = 'housekeeping';
const MT = 'maintenance';

/**
 * Audience floor per type – OpenAPI 0.3.7 "người nhận theo vai" (BE-D Sprint 4): FD+ every type (except
 * `payment.changed`: MGR+ and the recorder – A-35); HK `room.status_changed`, `hk_task.changed`; MT
 * `room.status_changed`, `work_order.changed`; `guest_request.changed` FD+ and the department the request is
 * routed to (the publisher adds `housekeeping`/`maintenance`); `notification.created` the recipient only.
 * SAL/CTV only receive `reservation.changed` of their own bookings (creator/closer) and their notifications.
 * A publisher's `audience.roles` is ADDED to the floor (never narrows it); `userIds` are added too.
 */
export const SSE_ROLE_FLOOR: Readonly<Record<SseEventType, readonly string[]>> = {
  'reservation.changed': FD_PLUS,
  'room.status_changed': [...FD_PLUS, HK, MT],
  'attention.changed': FD_PLUS,
  'hk_task.changed': [...FD_PLUS, HK],
  'work_order.changed': [...FD_PLUS, MT],
  'guest_request.changed': FD_PLUS,
  'notification.created': [],
  'registration.changed': FD_PLUS,
  'payment.changed': MGR_PLUS,
  'website_request.changed': FD_PLUS,
};

export interface SseAudience {
  roles?: readonly string[];
  userIds?: readonly string[];
}

/** Wire format of one NOTIFY payload (also parsed by the SSE hub). */
export interface SseWireEvent {
  /** property id */
  p: string;
  /** event type */
  t: SseEventType;
  id: string;
  /** roles allowed to receive (absent = every staff member of the property) */
  r?: string[];
  /** users allowed to receive in addition to `r` (absent = none) */
  u?: string[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AttentionKind =
  | 'vip_arrival'
  | 'room_ooo'
  | 'rent_due_soon'
  | 'lease_expiring'
  | 'registration_due'
  | 'registration_overdue'
  | 'visa_expiring'
  | 'work_order_high_open'
  | 'hold_expiring'
  | 'meter_not_read'
  | 'channel_sync_error'
  | 'foc_threshold'
  | 'overbooking'
  | 'unassigned_with_free_room'
  | 'data_quality'
  | 'deposit_after_cancel'
  | 'no_show_call'
  | 'no_show_mark'
  | 'security_alert'
  | 'capacity_conflict'
  | 'work_order_overdue'
  | 'extra_guest_kit_overdue'
  | 'room_status_mismatch'
  | 'reconcile_overdue'
  | 'ooo_ending_work_open'
  | 'guest_request_overdue'
  // 0.3.7 bổ sung D1: US-136 AC2/AC5 (event, `params.action` report|revoke) and S4-06 (event, BE-B).
  | 'ota_no_show_report'
  | 'closed_reservation_credit'
  // BR-525 (18/10 – G-4, BE-A): open guest debts of checked-out stays (B18 debt or a receipt reversed after it).
  | 'checkout_debt'
  // 0.3.8 – BR-433 (c) v0.4.0, ESC-026 A (BE-B): waivers on one stay above the threshold – OWN only, one per stay.
  | 'foc_stay_total_exceeded'
  // 0.3.7 bổ sung 2 (US-155 AC8 – BE-D R3, v1.0): website booking requests still `new` (computed, FD+).
  | 'website_request_new';

/**
 * B-21 / SEC J: the ONLY `params` keys an item of a kind may carry (counts, codes, room numbers, dates –
 * never names, phones, notes or guest money details). A kind missing here carries no params.
 * 0.3.7 (BE-D): `ota_no_show_report` → `action`, `channel`; `ooo_ending_work_open` → `roomNo`, `endDate`
 * (contract); `foc_threshold` (BR-435, OWN only) → `check` (`foc_pct_of_room_revenue` |
 * `foc_count_per_approver`), `pct`, `threshold`, `count`, `max` – the approver is never named in params (the
 * item's `link` filters the approvals list); keys reported to ARC for the contract text.
 */
export const ATTENTION_PARAM_KEYS: Partial<Record<AttentionKind, readonly string[]>> = {
  reconcile_overdue: ['count', 'oldestDays'],
  capacity_conflict: ['count'],
  overbooking: ['count'],
  no_show_call: ['count', 'time'],
  no_show_mark: ['count', 'time'],
  extra_guest_kit_overdue: ['count'],
  hold_expiring: ['count'],
  room_ooo: ['count'],
  registration_due: ['count', 'deadline'],
  registration_overdue: ['count'],
  deposit_after_cancel: ['code'],
  // `count`: 0.3.8 (SEC B.6 a1) – attachment_retention_anchor_missing carries the number of photos.
  data_quality: ['check', 'count'],
  unassigned_with_free_room: ['count'],
  security_alert: ['code'],
  foc_threshold: ['check', 'pct', 'threshold', 'count', 'max'],
  ota_no_show_report: ['action', 'channel'],
  ooo_ending_work_open: ['roomNo', 'endDate'],
  guest_request_overdue: ['count'],
  checkout_debt: ['count'],
  foc_stay_total_exceeded: ['count'],
  website_request_new: ['count'],
};

/**
 * Who sees an item of `listAttentionItems` (EP01 3.1; rbac S02 note 1; US-012 AC6, US-003 AC4) – filtered on the
 * server, never in the client:
 * - OWN only: `foc_threshold` (BR-435), `security_alert`, `data_quality` of the DATA checks (J17 R-04/R-05/R-06a);
 * - MGR+: `reconcile_overdue` (money – FDL/FD ✖), `checkout_debt` (BR-525 – the debt is OWN/MGR's, A19);
 * - FD+: everything else, including `data_quality` whose `check` is a registration check
 *   (`registration_stay_not_closed`, `registration_party_docs_unlinked` – the desk links/closes them, S4-39)
 *   and `closed_reservation_credit` (S4-06 – OWN/MGR/FDL/FD like `deposit_after_cancel`).
 */
export function attentionAudience(item: Pick<AttentionItem, 'kind' | 'params'>): readonly string[] {
  switch (item.kind) {
    case 'foc_threshold':
    case 'security_alert':
    case 'foc_stay_total_exceeded':
      return OWNER_ONLY;
    case 'reconcile_overdue':
    case 'checkout_debt':
      return MGR_PLUS;
    case 'data_quality': {
      const check = item.params?.check;
      // 0.3.8 (SEC FB-R2-SEC-BE-84 a / B.6 – ARC a1): photos without retention anchor → OWN/MGR only.
      if (check === ATTACHMENT_ANCHOR_MISSING_CHECK) return MGR_PLUS;
      return typeof check === 'string' && check.startsWith('registration_') ? FD_PLUS : OWNER_ONLY;
    }
    default:
      return FD_PLUS;
  }
}

export function attentionVisibleTo(
  item: Pick<AttentionItem, 'kind' | 'params'>,
  roles: readonly string[],
): boolean {
  const audience = attentionAudience(item);
  return roles.some((r) => audience.includes(r));
}

/**
 * Event items that are closed by the system only (EP01 3.2; 0.3.7): `overbooking` and
 * `unassigned_with_free_room` close when the booking is assigned/cancelled, `closed_reservation_credit` when the
 * refund is paid out or the guest leaves the money (BE-B, S4-06). `resolveAttentionEvent` refuses them.
 */
export const ATTENTION_SYSTEM_CLOSED: readonly AttentionKind[] = [
  'overbooking',
  'unassigned_with_free_room',
  'closed_reservation_credit',
];

const PARAM_MAX_STRING = 40;

const isCount = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0;
/**
 * SEC-BE-52 (1): the FORMAT of each allowed key – counts are integers, times HH:mm, codes look like a
 * document code (OTM-00171, WO-…), checks are snake_case ids. A short name or phone number never fits.
 */
const PARAM_FORMATS: Record<string, (v: unknown) => boolean> = {
  count: isCount,
  oldestDays: isCount,
  pct: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000,
  time: (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
  deadline: (v) =>
    typeof v === 'string' &&
    (/^([01]\d|2[0-3]):[0-5]\d$/.test(v) ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?([+-]\d{2}:\d{2}|Z)$/.test(v)),
  code: (v) => typeof v === 'string' && /^[A-Z]{1,5}\d{0,2}-[A-Z0-9-]{1,30}$/.test(v),
  check: (v) => typeof v === 'string' && /^[a-z][a-z0-9_.]{0,39}$/.test(v),
  // 0.3.7 (BE-D): closed enums / codes only – a name never fits.
  action: (v) => v === 'report' || v === 'revoke',
  channel: (v) => typeof v === 'string' && /^[a-z][a-z0-9_]{0,39}$/.test(v),
  roomNo: (v) => typeof v === 'string' && /^[A-Za-z0-9-]{1,10}$/.test(v),
  endDate: (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v),
  threshold: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000,
  max: isCount,
};

/** Throws on a key outside the allowlist of the kind or a value not in the key's format. */
export function assertAttentionParams(
  kind: AttentionKind,
  params: Record<string, string | number> | undefined,
): void {
  if (!params) return;
  const allowed = ATTENTION_PARAM_KEYS[kind] ?? [];
  for (const [k, v] of Object.entries(params)) {
    if (!allowed.includes(k)) {
      throw new Error(`attention ${kind}: param "${k}" is not allow-listed (SEC J / B-21)`);
    }
    const format = PARAM_FORMATS[k];
    const ok = format
      ? format(v)
      : (typeof v === 'number' && Number.isFinite(v)) ||
        (typeof v === 'string' && v.length <= PARAM_MAX_STRING);
    if (!ok) throw new Error(`attention ${kind}: param "${k}" is not in its format (SEC-BE-52)`);
  }
}

/**
 * Light SSE event, delivered after COMMIT (pg_notify is transactional) – the ONE implementation behind
 * EventsService.publish, usable where no container exists (worker jobs, stay-view – ARC-BE-S3-23.5).
 * Every event carries its audience (0.3.7 – SSE_ROLE_FLOOR ∪ the publisher's roles/users); no event goes to
 * "everyone". `reservation.changed` without users goes to FD+ and the booking's creator / closer (SEC-BE-40).
 */
export async function publishSse(
  tx: Tx,
  type: SseEventType,
  id: string,
  audience?: SseAudience,
): Promise<void> {
  if (!(SSE_EVENT_TYPES as readonly string[]).includes(type)) {
    throw new Error(`unknown SSE event type ${type}`);
  }
  if (!UUID.test(id)) throw new Error('SSE event id must be a uuid (no data in the payload)');
  const propertyId = tx.ctx.propertyId;
  if (!propertyId) throw new Error('SSE publish needs a property context');
  const roles = [...new Set([...SSE_ROLE_FLOOR[type], ...(audience?.roles ?? [])])];
  let userIds = audience?.userIds ? [...new Set(audience.userIds)] : undefined;
  if (!audience?.userIds && type === 'reservation.changed') {
    const { rows } = await tx.query<{ created_by: string | null; closer_user_id: string | null }>(
      'SELECT created_by, closer_user_id FROM reservation WHERE id = $1',
      [id],
    );
    const r = rows[0];
    userIds = [...new Set([r?.created_by, r?.closer_user_id].filter((u): u is string => !!u))];
  }
  if (roles.length === 0 && !userIds?.length) {
    throw new Error(`SSE ${type} has no recipient (explicit users required)`);
  }
  const wire: SseWireEvent = {
    p: propertyId,
    t: type,
    id,
    r: roles,
    ...(userIds?.length ? { u: userIds } : {}),
  };
  await tx.query('SELECT pg_notify($1, $2)', [SSE_CHANNEL, JSON.stringify(wire)]);
}

export interface AttentionItem {
  kind: AttentionKind;
  source: 'computed' | 'event';
  severity: 'info' | 'warning' | 'critical';
  eventId?: string;
  count?: number;
  dueAt?: string;
  reservationIds?: string[];
  roomNos?: string[];
  link?: string;
  refCode?: string;
  params?: Record<string, string | number>;
}

export interface AttentionSourceContext {
  tz: string;
  now: Date;
  today: string;
  iso(instant: Date): string;
  param<T>(key: string): Promise<T | undefined>;
}

/** A computed attention source: reads its own module's tables, returns zero or more items. */
export type AttentionSource = (tx: Tx, ctx: AttentionSourceContext) => Promise<AttentionItem[]>;

export interface NotifyInput {
  kind: StaffNotificationKind;
  roles?: readonly string[];
  userIds?: readonly string[];
  /** e.g. the requester of an approval should not be notified of their own request */
  excludeUserIds?: readonly string[];
  refType: NotificationRefType;
  refId: string;
  refCode?: string | null;
}

export interface AttentionHistoryRow {
  id: string;
  params: Record<string, string | number>;
  createdAt: Date;
  resolvedAt: Date | null;
  /** null on a resolved row = closed by the system. */
  resolvedBy: string | null;
}

export interface OpenAttentionInput {
  kind: AttentionKind;
  severity: 'info' | 'warning' | 'critical';
  dedupeKey: string;
  refType?: string;
  refId?: string;
  refCode?: string;
  params?: Record<string, string | number>;
  now: Date;
}

@Injectable()
export class EventsService {
  private readonly sources: AttentionSource[] = [];

  /** Light SSE event, delivered after COMMIT (pg_notify is transactional) – see publishSse. */
  publish(tx: Tx, type: SseEventType, id: string, audience?: SseAudience): Promise<void> {
    return publishSse(tx, type, id, audience);
  }

  /** Inbox rows + push (outbox) + `notification.created` to each recipient. Returns the recipient ids. */
  async notify(
    tx: Tx,
    input: NotifyInput,
    now: Date,
    opts: { push?: boolean } = {},
  ): Promise<string[]> {
    if (!(STAFF_NOTIFICATION_KINDS as readonly string[]).includes(input.kind)) {
      throw new Error(`unknown notification kind ${input.kind}`);
    }
    if (!(NOTIFICATION_REF_TYPES as readonly string[]).includes(input.refType)) {
      throw new Error(`unknown notification refType ${input.refType}`);
    }
    if (input.refCode && input.refCode.length > PARAM_MAX_STRING) {
      throw new Error('notification refCode is a display code (≤ 40 chars)');
    }
    const propertyId = tx.ctx.propertyId;
    if (!propertyId) throw new Error('notify needs a property context');
    const { rows } = await tx.query<{ id: string }>(
      `SELECT DISTINCT u.id FROM app_user u
         JOIN user_property_role upr ON upr.user_id = u.id AND upr.property_id = $1 AND upr.revoked_at IS NULL
        WHERE u.status = 'active'
          AND (upr.role = ANY($2::text[]) OR u.id = ANY($3::uuid[]))
          AND NOT (u.id = ANY($4::uuid[]))
        ORDER BY u.id`,
      [
        propertyId,
        [...(input.roles ?? [])],
        [...(input.userIds ?? [])],
        [...(input.excludeUserIds ?? [])],
      ],
    );
    const recipients = rows.map((r) => r.id);
    for (const userId of recipients) {
      const id = uuidv7();
      await tx.query(
        `INSERT INTO staff_notification (id, organization_id, property_id, user_id, kind, ref_type, ref_id,
           ref_code, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          tx.ctx.organizationId,
          propertyId,
          userId,
          input.kind,
          input.refType,
          input.refId,
          input.refCode ?? null,
          now,
        ],
      );
      await this.publish(tx, 'notification.created', id, { roles: [], userIds: [userId] });
    }
    if (recipients.length > 0 && opts.push !== false) {
      // Push (Mock in R2): kind, ids and display code only – no guest data (SEC A5).
      await tx.query(
        `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
         VALUES ($1, $2, $3, 'staff.push', $4, $5) ON CONFLICT (dedupe_key) DO NOTHING`,
        [
          uuidv7(),
          tx.ctx.organizationId,
          propertyId,
          JSON.stringify({
            kind: input.kind,
            roles: [...(input.roles ?? [])],
            userIds: recipients,
            refType: input.refType,
            refId: input.refId,
            ...(input.refCode ? { refCode: input.refCode } : {}),
          }),
          `notify:${input.kind}:${input.refId}:${uuidv7()}`,
        ],
      );
    }
    return recipients;
  }

  /** One open attention row per dedupe key (re-opening an open key is a no-op). Returns its id. */
  async openAttention(tx: Tx, input: OpenAttentionInput): Promise<string | null> {
    assertAttentionParams(input.kind, input.params);
    if (input.refCode && input.refCode.length > PARAM_MAX_STRING) {
      throw new Error('attention refCode is a display code (≤ 40 chars)');
    }
    const id = uuidv7();
    const r = await tx.query<{ id: string }>(
      `INSERT INTO attention_event (id, organization_id, property_id, kind, severity, ref_type, ref_id, ref_code,
         dedupe_key, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (property_id, dedupe_key) WHERE resolved_at IS NULL DO NOTHING
       RETURNING id`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        input.kind,
        input.severity,
        input.refType ?? null,
        input.refId ?? null,
        input.refCode ?? null,
        input.dedupeKey,
        JSON.stringify(input.params ?? {}),
        input.now,
      ],
    );
    const created = r.rows[0]?.id ?? null;
    if (created) await this.publish(tx, 'attention.changed', created, { roles: FD_PLUS });
    return created;
  }

  /**
   * ARC S1-11 (US-007 AC7 "mỗi lần vượt thêm cập nhật cùng một dòng"): new params of an OPEN event item (same keys
   * rule as openAttention). false = the item is closed (or unknown) – the caller opens a new one if it must.
   */
  async updateAttentionParams(
    tx: Tx,
    id: string,
    kind: AttentionKind,
    params: Record<string, string | number>,
  ): Promise<boolean> {
    assertAttentionParams(kind, params);
    const r = await tx.query<{ id: string }>(
      `UPDATE attention_event SET details = $3 WHERE id = $1 AND kind = $2 AND resolved_at IS NULL RETURNING id`,
      [id, kind, JSON.stringify(params)],
    );
    if (r.rows.length === 0) return false;
    await this.publish(tx, 'attention.changed', id, { roles: FD_PLUS });
    return true;
  }

  async resolveAttention(
    tx: Tx,
    dedupeKey: string,
    now: Date,
    note: string | null = null,
  ): Promise<number> {
    const r = await tx.query<{ id: string }>(
      `UPDATE attention_event SET resolved_at = $2, resolved_by = $3, resolution_note = $4
        WHERE dedupe_key = $1 AND resolved_at IS NULL RETURNING id`,
      [dedupeKey, now, tx.ctx.actorType === 'user' ? tx.ctx.userId : null, note],
    );
    for (const row of r.rows) {
      await this.publish(tx, 'attention.changed', row.id, { roles: FD_PLUS });
    }
    return r.rows.length;
  }

  /**
   * History of the event items of one subject (ARC 11.4 C2 – owners never touch `attention_event` themselves):
   * newest first, rows LOCKED (`FOR UPDATE`) so a decision taken on the history cannot race another one in the
   * caller's transaction. `resolvedBy` null on a resolved row = closed by the system.
   */
  async attentionHistory(
    tx: Tx,
    subject: { kind: AttentionKind; refType: string; refId: string },
  ): Promise<AttentionHistoryRow[]> {
    const { rows } = await tx.query<{
      id: string;
      details: Record<string, string | number> | null;
      created_at: Date;
      resolved_at: Date | null;
      resolved_by: string | null;
    }>(
      `SELECT id, details, created_at, resolved_at, resolved_by FROM attention_event
        WHERE kind = $1 AND ref_type = $2 AND ref_id = $3
        ORDER BY created_at DESC, id DESC FOR UPDATE`,
      [subject.kind, subject.refType, subject.refId],
    );
    return rows.map((r) => ({
      id: r.id,
      params: r.details ?? {},
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      resolvedBy: r.resolved_by,
    }));
  }

  /**
   * Close one event item BY THE SYSTEM (`resolved_by` NULL – the person who triggered the business action did not
   * handle the item), with a technical note; no-op when already closed. Publishes `attention.changed`.
   */
  async resolveAttentionById(tx: Tx, id: string, now: Date, note: string): Promise<boolean> {
    const r = await tx.query<{ id: string }>(
      `UPDATE attention_event SET resolved_at = $2, resolved_by = NULL, resolution_note = $3
        WHERE id = $1 AND resolved_at IS NULL RETURNING id`,
      [id, now, note],
    );
    if (r.rows.length === 0) return false;
    await this.publish(tx, 'attention.changed', id, { roles: FD_PLUS });
    return true;
  }

  /** Computed "Cần chú ý" items of a module (registered once at module init). */
  registerAttentionSource(source: AttentionSource): void {
    this.sources.push(source);
  }

  attentionSources(): readonly AttentionSource[] {
    return this.sources;
  }
}
