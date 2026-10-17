/**
 * housekeeping + maintenance tables (erd 4.8 `inspection`, 4.9 `work_order`; OpenAPI 0.3.7 nhóm H – BE-C,
 * R2 Sprint 4, migration 0056_housekeeping_maintenance). `room_status` (frontdesk.ts) and `hk_task`
 * (reservations.ts) already exist; `room_block.work_order_id` gets its FK in SQL only (cross-module, 4.2a-2e).
 *
 * - work_order (SM-04, BR-809): the history of a work order is NOT a table – it is read back from
 *   `state_transition` (machine SM-04) + `audit_event` (`work_order.*`), erd 4.9.
 * - inspection (BR-808, US-055): one row per check of a room; `inspectionFailed` of a room = its latest
 *   inspection is `fail` (computed when read).
 * - inspection_checklist: the property's checklist (BR-808 "cấu hình được"); no row = the default of the
 *   code (12 points of BR-808, version 1).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { appUser } from './identity';
import { property } from './platform';
import { hkTask } from './reservations';
import { room } from './rooms';

export const WORK_ORDER_STATUSES = [
  'new',
  'in_progress',
  'waiting_parts',
  'done',
  'cancelled',
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];
export const WORK_ORDER_SEVERITIES = ['high', 'medium', 'low'] as const;
export type WorkOrderSeverity = (typeof WORK_ORDER_SEVERITIES)[number];
export const WORK_ORDER_CATEGORIES = [
  'hot_water',
  'power',
  'leak',
  'door_lock',
  'wifi',
  'broken_item',
  'drain',
  'other',
] as const;
export type WorkOrderCategory = (typeof WORK_ORDER_CATEGORIES)[number];
export const WORK_ORDER_SOURCES = [
  'housekeeping',
  'front_desk',
  'maintenance',
  'guest_app',
  'system',
] as const;
export type WorkOrderSource = (typeof WORK_ORDER_SOURCES)[number];

export const workOrder = pgTable(
  'work_order',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    /** WO-00034 (doc_code_format.work_order, BR-007). */
    code: text('code').notNull(),
    roomId: uuid('room_id').notNull(),
    title: text('title').notNull(),
    /** C1 – what is broken, never a guest name or document (SEC). */
    description: text('description').notNull(),
    category: text('category').notNull(),
    severity: text('severity').notNull(),
    status: text('status').notNull().default('new'),
    source: text('source').notNull(),
    reportedBy: uuid('reported_by'),
    assigneeUserId: uuid('assignee_user_id'),
    acceptedAt: instant('accepted_at'),
    /** BR-809 deadlines from `wo_sla` at creation / re-open; `resolve_due_at` moves on by the paused time. */
    ackDueAt: instant('ack_due_at'),
    resolveDueAt: instant('resolve_due_at'),
    /** `waiting_parts` with a parts date (medium/low): the deadline is paused from this instant. */
    pausedAt: instant('paused_at'),
    partsNote: text('parts_note'),
    partsExpectedDate: date('parts_expected_date', { mode: 'string' }),
    resultNote: text('result_note'),
    photoAttachmentIds: uuid('photo_attachment_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    donePhotoAttachmentIds: uuid('done_photo_attachment_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    doneAt: instant('done_at'),
    doneBy: uuid('done_by'),
    cancelReason: text('cancel_reason'),
    reopenedCount: smallint('reopened_count').notNull().default(0),
    /** B-09: HK asked for a block (no block made by HK – A86). */
    blockRequested: boolean('block_requested').notNull().default(false),
    /** J11: a deadline passed (notified once per deadline – `work_order_overdue`). */
    overdueNotifiedAt: instant('overdue_notified_at'),
    /** B-11: J11 – high work order of an occupied room past the remedy deadline (US-062 AC3). */
    remedySuggestedAt: instant('remedy_suggested_at'),
    /** EP14 (BE-D): the guest request that created the work order – FK added with `guest_request` (0058). */
    guestRequestId: uuid('guest_request_id'),
    ...auditColumns(),
  },
  (t) => [
    unique('work_order_property_id_key').on(t.propertyId, t.id),
    unique('work_order_code_key').on(t.propertyId, t.code),
    foreignKey({
      name: 'work_order_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'work_order_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'work_order_reported_by_fk',
      columns: [t.organizationId, t.reportedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'work_order_assignee_fk',
      columns: [t.organizationId, t.assigneeUserId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'work_order_status_check',
      sql`${t.status} IN ('new', 'in_progress', 'waiting_parts', 'done', 'cancelled')`,
    ),
    check('work_order_severity_check', sql`${t.severity} IN ('high', 'medium', 'low')`),
    check(
      'work_order_category_check',
      sql`${t.category} IN ('hot_water', 'power', 'leak', 'door_lock', 'wifi', 'broken_item', 'drain', 'other')`,
    ),
    check(
      'work_order_source_check',
      sql`${t.source} IN ('housekeeping', 'front_desk', 'maintenance', 'guest_app', 'system')`,
    ),
    check('work_order_title_check', sql`char_length(${t.title}) BETWEEN 1 AND 120`),
    check('work_order_description_check', sql`char_length(${t.description}) BETWEEN 1 AND 2000`),
    // erd 4.9 (0.3.7 B-10): a done work order has its result note.
    check(
      'work_order_result_note_check',
      sql`${t.status} <> 'done' OR (${t.resultNote} IS NOT NULL AND char_length(btrim(${t.resultNote})) >= 3)`,
    ),
    check(
      'work_order_cancel_reason_check',
      sql`${t.status} <> 'cancelled' OR (${t.cancelReason} IS NOT NULL AND char_length(btrim(${t.cancelReason})) >= 3)`,
    ),
    check(
      'work_order_photos_check',
      sql`cardinality(${t.photoAttachmentIds}) <= 4 AND cardinality(${t.donePhotoAttachmentIds}) <= 8`,
    ),
    index('work_order_status_idx').on(t.propertyId, t.status),
    index('work_order_room_idx').on(t.roomId, t.createdAt),
  ],
);

export const inspection = pgTable(
  'inspection',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    roomId: uuid('room_id').notNull(),
    result: text('result').notNull(),
    selfInspection: boolean('self_inspection').notNull().default(false),
    inspectedBy: uuid('inspected_by').notNull(),
    /** `performedAt` of the device (offline queue, ADR-005). */
    inspectedAt: instant('inspected_at').notNull(),
    receivedAt: instant('received_at').notNull(),
    checklistVersion: integer('checklist_version').notNull(),
    /** [{code, passed, note?, dynamic?}] – labels are read from the checklist in the reader's language. */
    items: jsonb('items').notNull(),
    photoAttachmentIds: uuid('photo_attachment_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    roomStatusAfter: text('room_status_after').notNull(),
    redoTaskId: uuid('redo_task_id'),
  },
  (t) => [
    unique('inspection_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'inspection_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'inspection_inspected_by_fk',
      columns: [t.organizationId, t.inspectedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'inspection_redo_task_fk',
      columns: [t.propertyId, t.redoTaskId],
      foreignColumns: [hkTask.propertyId, hkTask.id],
    }),
    check('inspection_result_check', sql`${t.result} IN ('pass', 'fail')`),
    check('inspection_items_check', sql`jsonb_typeof(${t.items}) = 'array'`),
    check(
      'inspection_room_status_after_check',
      sql`${t.roomStatusAfter} IN ('VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO')`,
    ),
    check('inspection_photos_check', sql`cardinality(${t.photoAttachmentIds}) <= 4`),
    index('inspection_room_idx').on(t.roomId, t.inspectedAt),
  ],
);

export const inspectionChecklist = pgTable(
  'inspection_checklist',
  {
    propertyId: uuid('property_id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    version: integer('version').notNull().default(1),
    /** [{code, label: {vi, en, ru}, required, photoRequired?}] (BR-808). */
    items: jsonb('items').notNull(),
    updatedAt: instant('updated_at').notNull(),
    updatedBy: uuid('updated_by'),
  },
  (t) => [
    foreignKey({
      name: 'inspection_checklist_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('inspection_checklist_items_check', sql`jsonb_typeof(${t.items}) = 'array'`),
    check('inspection_checklist_version_check', sql`${t.version} >= 1`),
  ],
);
