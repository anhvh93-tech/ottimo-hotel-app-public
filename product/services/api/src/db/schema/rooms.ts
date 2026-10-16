/**
 * Room catalogue (erd 4.1, US-004): room groups, rooms (base/max occupancy per room – BR-110 v0.3.1,
 * ESC-014) and effective-dated list prices (BR-101). Property-level tables: FKs are always the
 * (property_id, x_id) pair so a row can never point to another property (erd 1, BE-ARC-09).
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
  pgTable,
  smallint,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { property } from './platform';

export const roomGroup = pgTable(
  'room_group',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    // Defaults copied into a NEW room only; the real values live on room (BR-110 v0.3.1).
    baseOccupancy: smallint('base_occupancy').notNull(),
    maxOccupancy: smallint('max_occupancy').notNull(),
    otaRoomRef: text('ota_room_ref'),
    // BR-204 fixed monthly service fee of the group (BR-108 one-month comparison in short quotes; HĐ R3).
    serviceFeeMonthlyVnd: bigint('service_fee_monthly_vnd', { mode: 'number' }),
    ...auditColumns(),
  },
  (t) => [
    unique('room_group_property_id_key').on(t.propertyId, t.id),
    unique('room_group_property_code_key').on(t.propertyId, t.code),
    foreignKey({
      name: 'room_group_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('room_group_base_occupancy_check', sql`${t.baseOccupancy} BETWEEN 1 AND 10`),
    check('room_group_max_occupancy_check', sql`${t.maxOccupancy} >= ${t.baseOccupancy}`),
    check(
      'room_group_service_fee_check',
      sql`${t.serviceFeeMonthlyVnd} IS NULL OR ${t.serviceFeeMonthlyVnd} >= 0`,
    ),
  ],
);

export const room = pgTable(
  'room',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    roomGroupId: uuid('room_group_id').notNull(),
    roomNo: text('room_no').notNull(),
    name: text('name'),
    floor: integer('floor'),
    areaM2: integer('area_m2'),
    bedSetup: text('bed_setup'),
    bedCount: smallint('bed_count'),
    baseOccupancy: smallint('base_occupancy').notNull(),
    maxOccupancy: smallint('max_occupancy').notNull(),
    // Random slug of the public unit page (QR in the room – SR-GST-12): not guessable from room_no.
    publicSlug: text('public_slug').notNull(),
    isSellable: boolean('is_sellable').notNull().default(true),
    activeFrom: date('active_from', { mode: 'string' }).notNull(),
    activeTo: date('active_to', { mode: 'string' }),
    lockRef: text('lock_ref'),
    ...auditColumns(),
  },
  (t) => [
    unique('room_property_id_key').on(t.propertyId, t.id),
    unique('room_property_room_no_key').on(t.propertyId, t.roomNo),
    unique('room_property_public_slug_key').on(t.propertyId, t.publicSlug),
    foreignKey({
      name: 'room_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'room_room_group_fk',
      columns: [t.propertyId, t.roomGroupId],
      foreignColumns: [roomGroup.propertyId, roomGroup.id],
    }),
    check('room_base_occupancy_check', sql`${t.baseOccupancy} BETWEEN 1 AND 10`),
    // DB keeps max >= base only; the "+1" policy (ESC-014) is checked by the application (erd 4.1).
    check(
      'room_max_occupancy_check',
      sql`${t.maxOccupancy} >= ${t.baseOccupancy} AND ${t.maxOccupancy} <= 11`,
    ),
    check('room_room_no_check', sql`${t.roomNo} ~ '^[0-9A-Z]{1,6}$'`),
    check('room_public_slug_check', sql`length(${t.publicSlug}) >= 8`),
    check(
      'room_active_range_check',
      sql`${t.activeTo} IS NULL OR ${t.activeTo} >= ${t.activeFrom}`,
    ),
    index('room_group_idx').on(t.propertyId, t.roomGroupId),
  ],
);

/** List price by effective date (BR-101, US-004 AC1). Nightly price is stored ROUNDED (erd 4.1, BE-ARC-15). */
export const roomListPrice = pgTable(
  'room_list_price',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    roomId: uuid('room_id').notNull(),
    effectiveFrom: date('effective_from', { mode: 'string' }).notNull(),
    monthlyListPriceVnd: bigint('monthly_list_price_vnd', { mode: 'number' }).notNull(),
    nightlyListPriceVnd: bigint('nightly_list_price_vnd', { mode: 'number' }).notNull(),
    changedBy: uuid('changed_by'),
    reason: text('reason'),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (t) => [
    unique('room_list_price_room_from_key').on(t.roomId, t.effectiveFrom),
    foreignKey({
      name: 'room_list_price_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    check('room_list_price_monthly_check', sql`${t.monthlyListPriceVnd} > 0`),
    check('room_list_price_nightly_check', sql`${t.nightlyListPriceVnd} > 0`),
  ],
);
