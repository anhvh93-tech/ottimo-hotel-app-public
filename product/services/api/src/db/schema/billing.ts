/**
 * FB-INV-012 (R5, INV 17/11; contract `rounds/round-05/fb-inv-012/contract.md` mục 2, DOM BR-LS-01…16) – the monthly
 * statement of a long stay ("Monthly statement / Phiếu thanh toán tháng"), migration 0099 (additive only):
 * - `meter_reading`: one reading of BOTH meters (electricity, water) of one room of a booking. INV 17/11 (bổ sung,
 *   decision-log f28bd8e8): the OPENING reading of each period is typed by the desk (`period_start`, or `checkin` /
 *   `room_change_in`), never taken from the previous closing; the previous closing is kept as a reference
 *   (`previous_reading_id`) and the difference opening − previous closing is the vacancy gap (viewings, housekeeping
 *   water) – stored on the row (`*_gap`) for OWN, never billed to the guest.
 * - `billing_period`: the statement (ERD 4.11 name). A draft stores no line (D4 – read = computed now); `issue` freezes
 *   the lines into `billing_period_line` and posts the folio lines (D5).
 * - `billing_period_line`: the lines frozen at issue, each pointing at its folio line.
 * RLS + FORCE on the three tables (0099), policy on `property_id` as the folio tables.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { attachment } from './files';
import { folio, folioLine } from './folio';
import { appUser } from './identity';
import { property } from './platform';
import { reservation } from './reservations';
import { room } from './rooms';

/** Opening kinds start a meter segment of a room, closing kinds end it. */
export const METER_READING_KINDS = [
  'checkin',
  'period_start',
  'period_end',
  'room_change_out',
  'room_change_in',
  'checkout',
] as const;
export type MeterReadingKind = (typeof METER_READING_KINDS)[number];

export const BILLING_PERIOD_STATUSES = [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'void',
] as const;
export type BillingPeriodStatus = (typeof BILLING_PERIOD_STATUSES)[number];

export const BILLING_LINE_KINDS = [
  'rent',
  'electricity',
  'water',
  'service',
  'rounding',
  'prior_adjustment',
] as const;
export type BillingLineKind = (typeof BILLING_LINE_KINDS)[number];

export const meterReading = pgTable(
  'meter_reading',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    roomId: uuid('room_id').notNull(),
    kind: text('kind').notNull(),
    /** Day 01 of the month the reading opens (`period_start`) or closes (`period_end`); null for the other kinds. */
    periodMonth: date('period_month', { mode: 'string' }),
    readOn: date('read_on', { mode: 'string' }).notNull(),
    electricityValue: numeric('electricity_value', { precision: 10, scale: 0 }).notNull(),
    waterValue: numeric('water_value', { precision: 10, scale: 1 }).notNull(),
    electricityException: jsonb('electricity_exception'),
    waterException: jsonb('water_exception'),
    /** INV 17/11: the valid closing reading of the same room just before this opening (reference only). */
    previousReadingId: uuid('previous_reading_id'),
    /** INV 17/11: opening − previous closing (vacancy usage, not billed); null when not an opening or no previous. */
    electricityGap: numeric('electricity_gap', { precision: 10, scale: 0 }),
    waterGap: numeric('water_gap', { precision: 10, scale: 1 }),
    photoAttachmentId: uuid('photo_attachment_id'),
    photoWaivedBy: uuid('photo_waived_by'),
    exceptionApprovedBy: uuid('exception_approved_by'),
    note: text('note'),
    /** ARC BE-190-03: a reading typed after its window – FDL+ only, with a reason (3–300). */
    lateReason: text('late_reason'),
    lateApprovedBy: uuid('late_approved_by'),
    readBy: uuid('read_by').notNull(),
    readByRole: text('read_by_role').notNull(),
    voidedAt: instant('voided_at'),
    voidedBy: uuid('voided_by'),
    voidReason: text('void_reason'),
    ...auditColumns(),
  },
  (t) => [
    unique('meter_reading_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'meter_reading_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'meter_reading_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'meter_reading_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'meter_reading_previous_fk',
      columns: [t.propertyId, t.previousReadingId],
      foreignColumns: [t.propertyId, t.id],
    }),
    foreignKey({
      name: 'meter_reading_photo_fk',
      columns: [t.photoAttachmentId],
      foreignColumns: [attachment.id],
    }),
    foreignKey({
      name: 'meter_reading_read_by_fk',
      columns: [t.organizationId, t.readBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'meter_reading_kind_check',
      sql`${t.kind} IN ('checkin', 'period_start', 'period_end', 'room_change_out', 'room_change_in', 'checkout')`,
    ),
    check(
      'meter_reading_period_month_check',
      sql`(${t.kind} IN ('period_start', 'period_end')) = (${t.periodMonth} IS NOT NULL) AND (${t.periodMonth} IS NULL OR extract(day FROM ${t.periodMonth}) = 1)`,
    ),
    check('meter_reading_values_check', sql`${t.electricityValue} >= 0 AND ${t.waterValue} >= 0`),
    check(
      'meter_reading_exception_check',
      sql`(${t.electricityException} IS NULL OR jsonb_typeof(${t.electricityException}) = 'object') AND (${t.waterException} IS NULL OR jsonb_typeof(${t.waterException}) = 'object')`,
    ),
    check(
      'meter_reading_photo_check',
      sql`${t.photoAttachmentId} IS NOT NULL OR ${t.photoWaivedBy} IS NOT NULL`,
    ),
    check(
      'meter_reading_exception_approved_check',
      sql`(${t.electricityException} IS NULL AND ${t.waterException} IS NULL) OR ${t.exceptionApprovedBy} IS NOT NULL`,
    ),
    check(
      'meter_reading_note_check',
      sql`${t.note} IS NULL OR char_length(${t.note}) BETWEEN 3 AND 300`,
    ),
    check(
      'meter_reading_late_check',
      sql`(${t.lateReason} IS NULL) = (${t.lateApprovedBy} IS NULL) AND (${t.lateReason} IS NULL OR char_length(${t.lateReason}) BETWEEN 3 AND 300)`,
    ),
    check(
      'meter_reading_void_check',
      sql`(${t.voidedAt} IS NULL) = (${t.voidReason} IS NULL) AND (${t.voidReason} IS NULL OR char_length(${t.voidReason}) BETWEEN 3 AND 300)`,
    ),
    check(
      'meter_reading_read_by_role_check',
      sql`${t.readByRole} IN ('owner', 'manager', 'front_desk_lead', 'front_desk')`,
    ),
    // One live reading per room, kind and period (period kinds) or day (the others) – contract 2.1.
    uniqueIndex('meter_reading_live_key')
      .on(t.reservationId, t.roomId, t.kind, sql`COALESCE(${t.periodMonth}, ${t.readOn})`)
      .where(sql`${t.voidedAt} IS NULL`),
    index('meter_reading_reservation_idx').on(t.reservationId, t.roomId, t.readOn),
  ],
);

export const billingPeriod = pgTable(
  'billing_period',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    folioId: uuid('folio_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    leaseContractId: uuid('lease_contract_id'),
    code: text('code'),
    statementMonth: date('statement_month', { mode: 'string' }).notNull(),
    kind: text('kind').notNull(),
    rentPeriodFrom: date('rent_period_from', { mode: 'string' }),
    rentPeriodTo: date('rent_period_to', { mode: 'string' }),
    utilityPeriodFrom: date('utility_period_from', { mode: 'string' }),
    utilityPeriodTo: date('utility_period_to', { mode: 'string' }),
    servicePeriodFrom: date('service_period_from', { mode: 'string' }),
    servicePeriodTo: date('service_period_to', { mode: 'string' }),
    dueDate: date('due_date', { mode: 'string' }),
    status: text('status').notNull().default('draft'),
    excludedFolioLineIds: uuid('excluded_folio_line_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    priorAdjustmentVnd: bigint('prior_adjustment_vnd', { mode: 'number' }),
    priorAdjustmentReason: text('prior_adjustment_reason'),
    note: text('note'),
    replacesId: uuid('replaces_id'),
    ratesSnapshot: jsonb('rates_snapshot'),
    netVnd: bigint('net_vnd', { mode: 'number' }),
    vatVnd: bigint('vat_vnd', { mode: 'number' }),
    roundingVnd: bigint('rounding_vnd', { mode: 'number' }),
    totalVnd: bigint('total_vnd', { mode: 'number' }),
    paidVnd: bigint('paid_vnd', { mode: 'number' }).notNull().default(0),
    issuedAt: instant('issued_at'),
    issuedBy: uuid('issued_by'),
    paidAt: instant('paid_at'),
    voidedAt: instant('voided_at'),
    voidedBy: uuid('voided_by'),
    voidReason: text('void_reason'),
    ...auditColumns(),
  },
  (t) => [
    unique('billing_period_property_id_key').on(t.propertyId, t.id),
    unique('billing_period_code_key').on(t.propertyId, t.code),
    foreignKey({
      name: 'billing_period_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'billing_period_folio_fk',
      columns: [t.propertyId, t.folioId],
      foreignColumns: [folio.propertyId, folio.id],
    }),
    foreignKey({
      name: 'billing_period_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'billing_period_replaces_fk',
      columns: [t.propertyId, t.replacesId],
      foreignColumns: [t.propertyId, t.id],
    }),
    check('billing_period_kind_check', sql`${t.kind} IN ('regular', 'final')`),
    check(
      'billing_period_status_check',
      sql`${t.status} IN ('draft', 'issued', 'partially_paid', 'paid', 'void')`,
    ),
    check('billing_period_month_check', sql`extract(day FROM ${t.statementMonth}) = 1`),
    // A draft has no code; an issued statement has one; a void one keeps what it had (contract 2.2).
    check(
      'billing_period_code_check',
      sql`(${t.status} = 'draft' AND ${t.code} IS NULL AND ${t.issuedAt} IS NULL) OR (${t.status} IN ('issued', 'partially_paid', 'paid') AND ${t.code} IS NOT NULL AND ${t.issuedAt} IS NOT NULL) OR ${t.status} = 'void'`,
    ),
    check(
      'billing_period_void_check',
      sql`(${t.status} = 'void') = (${t.voidedAt} IS NOT NULL) AND (${t.voidReason} IS NULL OR char_length(${t.voidReason}) BETWEEN 3 AND 300)`,
    ),
    check(
      'billing_period_prior_adjustment_check',
      sql`(${t.priorAdjustmentVnd} IS NULL) = (${t.priorAdjustmentReason} IS NULL) AND (${t.priorAdjustmentReason} IS NULL OR char_length(${t.priorAdjustmentReason}) BETWEEN 3 AND 300)`,
    ),
    check(
      'billing_period_note_check',
      sql`${t.note} IS NULL OR char_length(${t.note}) BETWEEN 3 AND 300`,
    ),
    check(
      'billing_period_rates_snapshot_check',
      sql`${t.ratesSnapshot} IS NULL OR jsonb_typeof(${t.ratesSnapshot}) = 'object'`,
    ),
    check('billing_period_paid_check', sql`${t.paidVnd} >= 0`),
    // One live statement per booking, month and kind (contract 2.2).
    uniqueIndex('billing_period_live_key')
      .on(t.reservationId, t.statementMonth, t.kind)
      .where(sql`${t.status} <> 'void'`),
    index('billing_period_due_idx').on(t.propertyId, t.status, t.dueDate),
  ],
);

export const billingPeriodLine = pgTable(
  'billing_period_line',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    billingPeriodId: uuid('billing_period_id').notNull(),
    kind: text('kind').notNull(),
    folioLineId: uuid('folio_line_id').notNull(),
    /** true = the statement posted the folio line (reversed when the statement is voided); false = referenced. */
    postedByStatement: boolean('posted_by_statement').notNull(),
    meterFromReadingId: uuid('meter_from_reading_id'),
    meterToReadingId: uuid('meter_to_reading_id'),
    roomId: uuid('room_id'),
    quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
    unit: text('unit').notNull(),
    unitPriceNetVnd: bigint('unit_price_net_vnd', { mode: 'number' }).notNull(),
    vatRatePct: numeric('vat_rate_pct', { precision: 5, scale: 2 }),
    netVnd: bigint('net_vnd', { mode: 'number' }).notNull(),
    vatVnd: bigint('vat_vnd', { mode: 'number' }).notNull(),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
    labelKey: text('label_key').notNull(),
    labelParams: jsonb('label_params').$type<Record<string, string | number>>(),
    /** Frozen display data of the line (meter from/to, exception, service date) – shown as issued. */
    details: jsonb('details').$type<Record<string, unknown>>(),
    sortOrder: integer('sort_order').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: instant('created_at').notNull(),
  },
  (t) => [
    foreignKey({
      name: 'billing_period_line_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'billing_period_line_period_fk',
      columns: [t.propertyId, t.billingPeriodId],
      foreignColumns: [billingPeriod.propertyId, billingPeriod.id],
    }),
    foreignKey({
      name: 'billing_period_line_folio_line_fk',
      columns: [t.propertyId, t.folioLineId],
      foreignColumns: [folioLine.propertyId, folioLine.id],
    }),
    foreignKey({
      name: 'billing_period_line_from_fk',
      columns: [t.propertyId, t.meterFromReadingId],
      foreignColumns: [meterReading.propertyId, meterReading.id],
    }),
    foreignKey({
      name: 'billing_period_line_to_fk',
      columns: [t.propertyId, t.meterToReadingId],
      foreignColumns: [meterReading.propertyId, meterReading.id],
    }),
    check(
      'billing_period_line_kind_check',
      sql`${t.kind} IN ('rent', 'electricity', 'water', 'service', 'rounding', 'prior_adjustment')`,
    ),
    check(
      'billing_period_line_unit_check',
      sql`${t.unit} IN ('month', 'day', 'kwh', 'm3', 'item')`,
    ),
    check('billing_period_line_amount_check', sql`${t.amountVnd} = ${t.netVnd} + ${t.vatVnd}`),
    check(
      'billing_period_line_details_check',
      sql`(${t.details} IS NULL OR jsonb_typeof(${t.details}) = 'object') AND (${t.labelParams} IS NULL OR jsonb_typeof(${t.labelParams}) = 'object')`,
    ),
    // One folio line on one live statement only (contract 2.3 – a service never billed twice).
    uniqueIndex('billing_period_line_live_folio_line_key')
      .on(t.folioLineId)
      .where(sql`${t.active}`),
    index('billing_period_line_period_idx').on(t.billingPeriodId, t.sortOrder),
  ],
);
