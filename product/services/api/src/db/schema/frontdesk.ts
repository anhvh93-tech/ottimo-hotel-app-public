/**
 * Front desk + events tables (BE-A Sprint 3, migration 0030 – hand-written SQL is the source of truth,
 * ARC s3-contract 4.2): room_status (SM-03 store, erd 4.1), checkout_confirmation (US-030),
 * reservation_guest (US-022 party, erd 4.5 – child data C3 ciphertext only), staff_notification and
 * attention_event (erd BE-ARC-06). RLS policies and grants live in the SQL file.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { instant } from './common';
import { dataKey } from './crypto';
import { guest } from './guests';
import { appUser } from './identity';
import { property } from './platform';
import { reservation } from './reservations';
import { room } from './rooms';

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const ROOM_STATUS_CODES = ['VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO'] as const;
export type RoomStatusCode = (typeof ROOM_STATUS_CODES)[number];

export const roomStatus = pgTable(
  'room_status',
  {
    roomId: uuid('room_id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    status: text('status').notNull(),
    since: instant('since').notNull(),
    updatedBy: uuid('updated_by'),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    foreignKey({
      name: 'room_status_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'room_status_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'room_status_updated_by_fk',
      columns: [t.organizationId, t.updatedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'room_status_status_check',
      sql`${t.status} IN ('VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO')`,
    ),
  ],
);

export const checkoutConfirmation = pgTable(
  'checkout_confirmation',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    recordedAt: instant('recorded_at').notNull(),
    recordedBy: uuid('recorded_by'),
    channel: text('channel').notNull(),
    replyType: text('reply_type').notNull(),
    confirmedTime: time('confirmed_time'),
    note: text('note'),
  },
  (t) => [
    foreignKey({
      name: 'checkout_confirmation_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'checkout_confirmation_recorded_by_fk',
      columns: [t.organizationId, t.recordedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'checkout_confirmation_channel_check',
      sql`${t.channel} IN ('phone', 'app', 'zalo_copy', 'in_person')`,
    ),
    check(
      'checkout_confirmation_reply_check',
      sql`${t.replyType} IN ('on_time', 'time', 'late', 'extend')`,
    ),
    check(
      'checkout_confirmation_time_check',
      sql`${t.replyType} NOT IN ('time', 'late') OR ${t.confirmedTime} IS NOT NULL`,
    ),
    index('checkout_confirmation_reservation_idx').on(t.reservationId, t.recordedAt),
  ],
);

export const reservationGuest = pgTable(
  'reservation_guest',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    guestId: uuid('guest_id'),
    role: text('role').notNull(),
    relationship: text('relationship'),
    childNameEnc: bytea('child_name_enc'),
    childBirthYearEnc: bytea('child_birth_year_enc'),
    childNameHmac: text('child_name_hmac'),
    // FK to data_key (BE-C crypto) is added once that table is on main (s3-contract 4.2 rule 6).
    childDataKeyId: uuid('child_data_key_id'),
    isMinorData: boolean('is_minor_data').notNull().default(false),
    priceAgeBand: text('price_age_band').notNull(),
    effectiveFrom: date('effective_from', { mode: 'string' }),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by'),
    removedAt: instant('removed_at'),
    removedBy: uuid('removed_by'),
  },
  (t) => [
    unique('reservation_guest_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'reservation_guest_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'reservation_guest_guest_fk',
      columns: [t.organizationId, t.guestId],
      foreignColumns: [guest.organizationId, guest.id],
    }),
    foreignKey({
      name: 'reservation_guest_child_key_fk',
      columns: [t.childDataKeyId],
      foreignColumns: [dataKey.id],
    }),
    foreignKey({
      name: 'reservation_guest_created_by_fk',
      columns: [t.organizationId, t.createdBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'reservation_guest_removed_by_fk',
      columns: [t.organizationId, t.removedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'reservation_guest_removed_check',
      sql`${t.removedBy} IS NULL OR ${t.removedAt} IS NOT NULL`,
    ),
    check(
      'reservation_guest_removed_hmac_check',
      sql`${t.removedAt} IS NULL OR ${t.childNameHmac} IS NULL`,
    ),
    check('reservation_guest_role_check', sql`${t.role} IN ('companion', 'child')`),
    check(
      'reservation_guest_relationship_check',
      sql`${t.relationship} IS NULL OR ${t.relationship} IN ('spouse', 'partner', 'family', 'friend', 'colleague', 'unknown')`,
    ),
    check(
      'reservation_guest_band_check',
      sql`${t.priceAgeBand} IN ('adult', 'child_6_11', 'child_under_6')`,
    ),
    check(
      'reservation_guest_subject_check',
      sql`(${t.role} = 'companion' AND ${t.guestId} IS NOT NULL AND ${t.childNameEnc} IS NULL) OR (${t.role} = 'child' AND ${t.guestId} IS NULL AND ${t.childNameEnc} IS NOT NULL AND ${t.childDataKeyId} IS NOT NULL)`,
    ),
    uniqueIndex('reservation_guest_guest_uk')
      .on(t.reservationId, t.guestId)
      .where(sql`${t.removedAt} IS NULL AND ${t.guestId} IS NOT NULL`),
    uniqueIndex('reservation_guest_child_uk')
      .on(t.reservationId, t.childNameHmac)
      .where(sql`${t.removedAt} IS NULL AND ${t.childNameHmac} IS NOT NULL`),
    index('reservation_guest_reservation_idx')
      .on(t.reservationId)
      .where(sql`${t.removedAt} IS NULL`),
  ],
);

export const STAFF_NOTIFICATION_KINDS = [
  'hold_expired',
  'hold_expiring',
  'deposit_notice',
  'deposit_after_cancel',
  'guest_request_new',
  'guest_request_overdue',
  'work_order_overdue',
  'approval_requested',
  'approval_decided',
  'registration_due',
  'checkout_call_needed',
  'security_alert',
  'account_security_change',
  'online_checkin_completed',
  'payment_disputed',
  'deposit_shortfall_accepted',
  'receiving_account_changed',
  'refund_ready',
  // 0055 (OpenAPI 0.3.7 B-08): housekeeping / maintenance inbox.
  'work_order_new',
  'work_order_high_new',
  'work_order_block_requested',
  'hk_task_urgent',
  'room_awaiting_inspection',
  'hk_task_cancelled',
  // 0055 (OpenAPI 0.3.7 D1): FOC auto-cancelled (BR-434), US-136 AC4 no-show marked / restored.
  'approval_cancelled',
  'no_show_marked',
  'no_show_restored',
  // 0072 (BR-525 G-4, BE-A): a receipt reversed after check-out left a debt – OWN + MGR.
  'debt_recorded',
  // 0082 (0.3.8 – BR-433 (c) v0.4.0, ESC-026 A, BE-B): waivers on one stay above the threshold – every OWN.
  'foc_stay_total_exceeded',
] as const;
export type StaffNotificationKind = (typeof STAFF_NOTIFICATION_KINDS)[number];

export const NOTIFICATION_REF_TYPES = [
  'reservation',
  'guest_request',
  'work_order',
  'approval_request',
  'registration',
  'user',
  'payment',
  'property',
  'hk_task', // 0055 (OpenAPI 0.3.7 B-08)
] as const;
export type NotificationRefType = (typeof NOTIFICATION_REF_TYPES)[number];

export const staffNotification = pgTable(
  'staff_notification',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    userId: uuid('user_id').notNull(),
    kind: text('kind').notNull(),
    refType: text('ref_type'),
    refId: uuid('ref_id'),
    refCode: text('ref_code'),
    createdAt: instant('created_at').notNull(),
    readAt: instant('read_at'),
  },
  (t) => [
    foreignKey({
      name: 'staff_notification_user_fk',
      columns: [t.organizationId, t.userId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'staff_notification_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check(
      'staff_notification_kind_check',
      sql`${t.kind} IN ('hold_expired', 'hold_expiring', 'deposit_notice', 'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue', 'work_order_overdue', 'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed', 'security_alert', 'account_security_change', 'online_checkin_completed', 'payment_disputed', 'deposit_shortfall_accepted', 'receiving_account_changed', 'refund_ready', 'work_order_new', 'work_order_high_new', 'work_order_block_requested', 'hk_task_urgent', 'room_awaiting_inspection', 'hk_task_cancelled', 'approval_cancelled', 'no_show_marked', 'no_show_restored', 'debt_recorded', 'foc_stay_total_exceeded')`,
    ),
    check(
      'staff_notification_ref_type_check',
      sql`${t.refType} IS NULL OR ${t.refType} IN ('reservation', 'guest_request', 'work_order', 'approval_request', 'registration', 'user', 'payment', 'property', 'hk_task')`,
    ),
    check('staff_notification_ref_check', sql`(${t.refType} IS NULL) = (${t.refId} IS NULL)`),
    check(
      'staff_notification_ref_code_check',
      sql`${t.refCode} IS NULL OR length(${t.refCode}) <= 40`,
    ),
    index('staff_notification_inbox_idx').on(
      t.userId,
      t.readAt.asc().nullsFirst(),
      t.createdAt.desc(),
      t.id.desc(),
    ),
  ],
);

export const attentionEvent = pgTable(
  'attention_event',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    kind: text('kind').notNull(),
    severity: text('severity').notNull(),
    refType: text('ref_type'),
    refId: uuid('ref_id'),
    refCode: text('ref_code'),
    dedupeKey: text('dedupe_key').notNull(),
    details: jsonb('details')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: instant('created_at').notNull(),
    resolvedAt: instant('resolved_at'),
    resolvedBy: uuid('resolved_by'),
    resolutionNote: text('resolution_note'),
  },
  (t) => [
    foreignKey({
      name: 'attention_event_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'attention_event_resolved_by_fk',
      columns: [t.organizationId, t.resolvedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'attention_event_resolved_check',
      sql`${t.resolvedBy} IS NULL OR ${t.resolvedAt} IS NOT NULL`,
    ),
    check('attention_event_ref_check', sql`(${t.refType} IS NULL) = (${t.refId} IS NULL)`),
    check('attention_event_severity_check', sql`${t.severity} IN ('info', 'warning', 'critical')`),
    check(
      'attention_event_ref_code_check',
      sql`${t.refCode} IS NULL OR length(${t.refCode}) <= 40`,
    ),
    uniqueIndex('attention_event_open_uk')
      .on(t.propertyId, t.dedupeKey)
      .where(sql`${t.resolvedAt} IS NULL`),
    index('attention_event_open_idx')
      .on(t.propertyId, t.createdAt)
      .where(sql`${t.resolvedAt} IS NULL`),
  ],
);
