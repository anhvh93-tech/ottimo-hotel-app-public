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
] as const;
export type SseEventType = (typeof SSE_EVENT_TYPES)[number];

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'] as const;
const MGR_PLUS = ['owner', 'manager'] as const;

/** Default audience per type (OpenAPI A-35): registration → FD+, payment → MGR+ (+ the recorder). */
const DEFAULT_ROLES: Partial<Record<SseEventType, readonly string[]>> = {
  'registration.changed': FD_PLUS,
  'payment.changed': MGR_PLUS,
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
  | 'guest_request_overdue';

/**
 * B-21 / SEC J: the ONLY `params` keys an item of a kind may carry (counts, codes, room numbers, dates –
 * never names, phones, notes or guest money details). A kind missing here carries no params.
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
  data_quality: ['check'],
  unassigned_with_free_room: ['count'],
  security_alert: ['code'],
  foc_threshold: ['pct'],
};

const PARAM_MAX_STRING = 40;

/** Throws on a key outside the allowlist of the kind or a value that is not a short string / number. */
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
    const ok =
      (typeof v === 'number' && Number.isFinite(v)) ||
      (typeof v === 'string' && v.length <= PARAM_MAX_STRING);
    if (!ok) throw new Error(`attention ${kind}: param "${k}" must be a number or ≤ 40 chars`);
  }
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

  /** Light SSE event, delivered after COMMIT (pg_notify is transactional). */
  async publish(tx: Tx, type: SseEventType, id: string, audience?: SseAudience): Promise<void> {
    if (!(SSE_EVENT_TYPES as readonly string[]).includes(type)) {
      throw new Error(`unknown SSE event type ${type}`);
    }
    if (!UUID.test(id)) throw new Error('SSE event id must be a uuid (no data in the payload)');
    const propertyId = tx.ctx.propertyId;
    if (!propertyId) throw new Error('SSE publish needs a property context');
    const roles = audience?.roles ?? DEFAULT_ROLES[type];
    const wire: SseWireEvent = {
      p: propertyId,
      t: type,
      id,
      ...(roles ? { r: [...roles] } : {}),
      ...(audience?.userIds ? { u: [...audience.userIds] } : {}),
    };
    await tx.query('SELECT pg_notify($1, $2)', [SSE_CHANNEL, JSON.stringify(wire)]);
  }

  /** Inbox rows + push (outbox) + `notification.created` to each recipient. Returns the recipient ids. */
  async notify(tx: Tx, input: NotifyInput, now: Date): Promise<string[]> {
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
    if (recipients.length > 0) {
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

  /** Computed "Cần chú ý" items of a module (registered once at module init). */
  registerAttentionSource(source: AttentionSource): void {
    this.sources.push(source);
  }

  attentionSources(): readonly AttentionSource[] {
    return this.sources;
  }
}
