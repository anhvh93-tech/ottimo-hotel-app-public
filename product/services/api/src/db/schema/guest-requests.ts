/**
 * Guest requests of the guest app (erd 4.11 `guest_request`, SM-15; US-109, US-110; OpenAPI 0.3.6 B-14…B-16,
 * 0.3.7) – BE-D Sprint 4, migration 0058_guest_request.
 *
 * - `note` is C2 (D23): plain text ≤ 500, never in push/outbox/logs; T13 empties it (and `reply_note`) after
 *   `retention.guest_request_months` from `closed_at` – `note_purged_at` (R3-Q15, 0083), row kept.
 * - `routed_to` + `ack_due_at` are set at creation (BR-811 – auto reply out of hours: `auto_replied_at`).
 * - `fee_vnd_snapshot` = the BR-506 fee the guest accepted (`fee_accepted_at`); posted to the folio once,
 *   when the request becomes `done` (`fee_folio_line_id`).
 * - `hk_task_id` / `work_order_id` = the job created by the housekeeping / maintenance port (BE-C).
 * - `declined_reason_code` (+ `reply_note`, required for `other`) is what the guest sees when declined.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { instant } from './common';
import { folioLine } from './folio';
import { appUser } from './identity';
import { property } from './platform';
import { hkTask, reservation } from './reservations';
import { room } from './rooms';

export const GUEST_REQUEST_TYPES = [
  'extra_cleaning',
  'amenities',
  'report_issue',
  'transport_tour',
  'late_checkout',
  'other',
] as const;
export type GuestRequestType = (typeof GUEST_REQUEST_TYPES)[number];

export const GUEST_REQUEST_STATUSES = [
  'new',
  'acknowledged',
  'in_progress',
  'done',
  'declined',
] as const;
export type GuestRequestStatus = (typeof GUEST_REQUEST_STATUSES)[number];

export const GUEST_REQUEST_DECLINE_CODES = [
  'not_available_now',
  'outside_service_hours',
  'needs_front_desk',
  'duplicate',
  'other',
] as const;
export type GuestRequestDeclineCode = (typeof GUEST_REQUEST_DECLINE_CODES)[number];

export const guestRequest = pgTable(
  'guest_request',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    roomId: uuid('room_id'),
    type: text('type').notNull(),
    note: text('note'),
    status: text('status').notNull().default('new'),
    routedTo: text('routed_to').notNull(),
    ackDueAt: instant('ack_due_at').notNull(),
    acknowledgedAt: instant('acknowledged_at'),
    acknowledgedBy: uuid('acknowledged_by'),
    autoRepliedAt: instant('auto_replied_at'),
    hkTaskId: uuid('hk_task_id'),
    workOrderId: uuid('work_order_id'),
    feeVndSnapshot: bigint('fee_vnd_snapshot', { mode: 'number' }),
    feeAcceptedAt: instant('fee_accepted_at'),
    feeFolioLineId: uuid('fee_folio_line_id'),
    declinedReasonCode: text('declined_reason_code'),
    replyNote: text('reply_note'),
    overdueNotifiedAt: instant('overdue_notified_at'),
    closedAt: instant('closed_at'),
    closedBy: uuid('closed_by'),
    purgeAfter: instant('purge_after'),
    /** R3-Q15 T13 (migration 0083): `note` / `reply_note` emptied after `retention.guest_request_months`. */
    notePurgedAt: instant('note_purged_at'),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by'),
    updatedAt: instant('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    unique('guest_request_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'guest_request_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'guest_request_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'guest_request_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'guest_request_hk_task_fk',
      columns: [t.propertyId, t.hkTaskId],
      foreignColumns: [hkTask.propertyId, hkTask.id],
    }),
    foreignKey({
      name: 'guest_request_fee_line_fk',
      columns: [t.propertyId, t.feeFolioLineId],
      foreignColumns: [folioLine.propertyId, folioLine.id],
    }),
    foreignKey({
      name: 'guest_request_ack_by_fk',
      columns: [t.organizationId, t.acknowledgedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'guest_request_closed_by_fk',
      columns: [t.organizationId, t.closedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'guest_request_type_check',
      sql`${t.type} IN ('extra_cleaning', 'amenities', 'report_issue', 'transport_tour', 'late_checkout', 'other')`,
    ),
    check(
      'guest_request_status_check',
      sql`${t.status} IN ('new', 'acknowledged', 'in_progress', 'done', 'declined')`,
    ),
    check(
      'guest_request_routed_to_check',
      sql`${t.routedTo} IN ('housekeeping', 'maintenance', 'front_desk')`,
    ),
    check('guest_request_note_check', sql`${t.note} IS NULL OR char_length(${t.note}) <= 500`),
    check(
      'guest_request_reply_note_check',
      sql`${t.replyNote} IS NULL OR char_length(${t.replyNote}) <= 300`,
    ),
    check(
      'guest_request_declined_reason_check',
      sql`${t.declinedReasonCode} IS NULL OR ${t.declinedReasonCode} IN ('not_available_now', 'outside_service_hours', 'needs_front_desk', 'duplicate', 'other')`,
    ),
    check(
      'guest_request_declined_check',
      sql`(${t.status} = 'declined') = (${t.declinedReasonCode} IS NOT NULL)`,
    ),
    check(
      'guest_request_declined_other_check',
      sql`${t.declinedReasonCode} IS DISTINCT FROM 'other' OR ${t.notePurgedAt} IS NOT NULL OR (${t.replyNote} IS NOT NULL AND btrim(${t.replyNote}) <> '')`,
    ),
    check(
      'guest_request_fee_check',
      sql`${t.feeVndSnapshot} IS NULL OR (${t.feeVndSnapshot} > 0 AND ${t.feeAcceptedAt} IS NOT NULL)`,
    ),
    check(
      'guest_request_ack_check',
      sql`${t.acknowledgedBy} IS NULL OR ${t.acknowledgedAt} IS NOT NULL`,
    ),
    check(
      'guest_request_closed_check',
      sql`(${t.closedAt} IS NOT NULL) = (${t.status} IN ('done', 'declined'))`,
    ),
    index('guest_request_open_idx')
      .on(t.propertyId, t.ackDueAt)
      .where(sql`${t.status} IN ('new', 'acknowledged', 'in_progress')`),
    index('guest_request_reservation_idx').on(t.reservationId, t.createdAt),
    // R3-Q15 T13: requests still carrying free text – closed (by `closed_at`) and open ones whose stay may have
    // ended (by `created_at`, SEC BED-02). The purge job's scan.
    index('guest_request_t13_idx')
      .on(t.propertyId, t.closedAt, t.createdAt)
      .where(sql`${t.note} IS NOT NULL OR ${t.replyNote} IS NOT NULL`),
  ],
);
