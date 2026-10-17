/**
 * inventory module tables (BE-B Sprint 3, migration 0041): `item` (minibar/consumable goods – erd 4.14 BL 4.13),
 * `minibar_check` + `minibar_check_line` (US-035, BR-701/702/703, OpenAPI E05-04). Stock movements, stocktake
 * and average cost are R3. A count is a record: lines are INSERT-only; a second `checkout` count of the same
 * booking replaces the first (`replaced_by_check_id`, partial unique index) and the folio lines of the old count
 * are reversed (BR-008).
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
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { folioLine } from './folio';
import { appUser } from './identity';
import { property } from './platform';
import { reservation } from './reservations';
import { room } from './rooms';

export const item = pgTable(
  'item',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    code: text('code').notNull(),
    kind: text('kind').notNull().default('minibar'),
    name: text('name').notNull(),
    /** 0061 (BE-D, US-066): names per language {vi, en, ru} as typed (ItemInput.name); `name` = vi. */
    nameI18n: jsonb('name_i18n').$type<Record<string, string>>(),
    unit: text('unit').notNull(),
    /** C2 – owner/manager only (rbac M3). */
    costPriceVnd: bigint('cost_price_vnd', { mode: 'number' }),
    /** null or 0 = complimentary (BR-701). */
    salePriceVnd: bigint('sale_price_vnd', { mode: 'number' }),
    minibarStandardQty: integer('minibar_standard_qty').notNull().default(0),
    minStockQty: integer('min_stock_qty').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...auditColumns(),
  },
  (t) => [
    unique('item_property_id_key').on(t.propertyId, t.id),
    unique('item_property_code_key').on(t.propertyId, t.code),
    foreignKey({
      name: 'item_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('item_kind_check', sql`${t.kind} IN ('minibar', 'consumable', 'fnb')`),
    check(
      'item_price_check',
      sql`(${t.costPriceVnd} IS NULL OR ${t.costPriceVnd} >= 0) AND (${t.salePriceVnd} IS NULL OR ${t.salePriceVnd} >= 0)`,
    ),
    check('item_qty_check', sql`${t.minibarStandardQty} >= 0 AND ${t.minStockQty} >= 0`),
    check(
      'item_name_i18n_check',
      sql`${t.nameI18n} IS NULL OR jsonb_typeof(${t.nameI18n}) = 'object'`,
    ),
  ],
);

export const minibarCheck = pgTable(
  'minibar_check',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    roomId: uuid('room_id').notNull(),
    mode: text('mode').notNull(),
    businessDate: date('business_date', { mode: 'string' }).notNull(),
    checkedBy: uuid('checked_by').notNull(),
    checkedAt: instant('checked_at').notNull(),
    replacesCheckId: uuid('replaces_check_id'),
    replacedByCheckId: uuid('replaced_by_check_id'),
    totalVnd: bigint('total_vnd', { mode: 'number' }).notNull().default(0),
    refillTaskId: uuid('refill_task_id'),
    createdAt: instant('created_at').notNull(),
  },
  (t) => [
    unique('minibar_check_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'minibar_check_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'minibar_check_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'minibar_check_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'minibar_check_checked_by_fk',
      columns: [t.organizationId, t.checkedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'minibar_check_replaces_fk',
      columns: [t.propertyId, t.replacesCheckId],
      foreignColumns: [t.propertyId, t.id],
    }),
    foreignKey({
      name: 'minibar_check_replaced_by_fk',
      columns: [t.propertyId, t.replacedByCheckId],
      foreignColumns: [t.propertyId, t.id],
    }),
    check('minibar_check_mode_check', sql`${t.mode} IN ('checkout', 'stayover')`),
    check('minibar_check_total_check', sql`${t.totalVnd} >= 0`),
    // 0065 (mô hình minibar M-1, ARC R1 – BUG-R2-136): one live `checkout` count per FRIDGE = (stay, room); a
    // mid-stay room change (B14) leaves two fridges, never one replacing the other.
    uniqueIndex('minibar_check_live_checkout_key')
      .on(t.reservationId, t.roomId)
      .where(sql`${t.mode} = 'checkout' AND ${t.replacedByCheckId} IS NULL`),
    index('minibar_check_reservation_idx').on(t.propertyId, t.reservationId, t.checkedAt),
  ],
);

export const minibarCheckLine = pgTable(
  'minibar_check_line',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    checkId: uuid('check_id').notNull(),
    itemId: uuid('item_id').notNull(),
    standardQty: integer('standard_qty').notNull(),
    remainingQty: integer('remaining_qty').notNull(),
    usedQty: integer('used_qty').generatedAlwaysAs(sql`standard_qty - remaining_qty`),
    unitPriceVndSnapshot: bigint('unit_price_vnd_snapshot', { mode: 'number' }),
    unitCostVndSnapshot: bigint('unit_cost_vnd_snapshot', { mode: 'number' }),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull().default(0),
    folioLineId: uuid('folio_line_id'),
  },
  (t) => [
    foreignKey({
      name: 'minibar_check_line_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'minibar_check_line_check_fk',
      columns: [t.propertyId, t.checkId],
      foreignColumns: [minibarCheck.propertyId, minibarCheck.id],
    }),
    foreignKey({
      name: 'minibar_check_line_item_fk',
      columns: [t.propertyId, t.itemId],
      foreignColumns: [item.propertyId, item.id],
    }),
    foreignKey({
      name: 'minibar_check_line_folio_line_fk',
      columns: [t.propertyId, t.folioLineId],
      foreignColumns: [folioLine.propertyId, folioLine.id],
    }),
    unique('minibar_check_line_item_key').on(t.checkId, t.itemId),
    check(
      'minibar_check_line_qty_check',
      sql`${t.standardQty} >= 0 AND ${t.remainingQty} >= 0 AND ${t.remainingQty} <= ${t.standardQty}`,
    ),
    check(
      'minibar_check_line_amount_check',
      sql`${t.amountVnd} >= 0 AND (${t.unitPriceVndSnapshot} IS NULL OR ${t.unitPriceVndSnapshot} >= 0)`,
    ),
  ],
);

/**
 * 0065 (mô hình minibar M-1, ARC `openapi-0.3.7.md` mục 16.3; BR-702-02, BUG-R2-138): a FILL of a fridge = the
 * level and the sale price of each item put in it (R2: at check-in / moving in – written copy-on-write when the
 * catalogue changes during a stay; R3: mid-stay refill). The latest fill of a fridge (largest `filled_at`) gives
 * its items, their mark (`qty`) and their price (R3–R5). Records: INSERT-only.
 */
export const minibarFill = pgTable(
  'minibar_fill',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    /** The primary booking of the stay (its folio). */
    reservationId: uuid('reservation_id').notNull(),
    roomId: uuid('room_id').notNull(),
    source: text('source').notNull(),
    filledAt: instant('filled_at').notNull(),
    createdBy: uuid('created_by'),
    createdAt: instant('created_at').notNull(),
  },
  (t) => [
    unique('minibar_fill_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'minibar_fill_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'minibar_fill_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'minibar_fill_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'minibar_fill_created_by_fk',
      columns: [t.organizationId, t.createdBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check('minibar_fill_source_check', sql`${t.source} IN ('check_in', 'refill', 'backfill')`),
    index('minibar_fill_fridge_idx').on(t.propertyId, t.reservationId, t.roomId, t.filledAt),
  ],
);

export const minibarFillLine = pgTable(
  'minibar_fill_line',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    fillId: uuid('fill_id').notNull(),
    itemId: uuid('item_id').notNull(),
    qty: integer('qty').notNull(),
    /** null = complimentary at that fill (BR-701). */
    unitPriceVndSnapshot: bigint('unit_price_vnd_snapshot', { mode: 'number' }),
    /** C2 – owner/manager only. */
    unitCostVndSnapshot: bigint('unit_cost_vnd_snapshot', { mode: 'number' }),
  },
  (t) => [
    foreignKey({
      name: 'minibar_fill_line_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'minibar_fill_line_fill_fk',
      columns: [t.propertyId, t.fillId],
      foreignColumns: [minibarFill.propertyId, minibarFill.id],
    }),
    foreignKey({
      name: 'minibar_fill_line_item_fk',
      columns: [t.propertyId, t.itemId],
      foreignColumns: [item.propertyId, item.id],
    }),
    unique('minibar_fill_line_item_key').on(t.fillId, t.itemId),
    check('minibar_fill_line_qty_check', sql`${t.qty} >= 1`),
    check(
      'minibar_fill_line_price_check',
      sql`(${t.unitPriceVndSnapshot} IS NULL OR ${t.unitPriceVndSnapshot} >= 0) AND (${t.unitCostVndSnapshot} IS NULL OR ${t.unitCostVndSnapshot} >= 0)`,
    ),
  ],
);
