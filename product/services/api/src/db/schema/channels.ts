/**
 * Sales channels (erd 4.1 `channel`, `channel_commission_rate`; BR-901, BR-112; DATA Q-11). Owned by the
 * platform module (BE-B). Property-level: FKs use the (property_id, x_id) pair (erd 1).
 * `listChannels` reads them; reservations (BE-A) and quotes (sales) resolve channel_group from here.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  integer,
  numeric,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { property } from './platform';

export const CHANNEL_GROUPS = ['direct', 'agent', 'ota', 'internal'] as const;
export type ChannelGroup = (typeof CHANNEL_GROUPS)[number];

export const channel = pgTable(
  'channel',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    channelGroup: text('channel_group').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    requiresOtaRef: boolean('requires_ota_ref').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns(),
  },
  (t) => [
    unique('channel_property_id_key').on(t.propertyId, t.id),
    unique('channel_property_code_key').on(t.propertyId, t.code),
    foreignKey({
      name: 'channel_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('channel_group_check', sql`${t.channelGroup} IN ('direct', 'agent', 'ota', 'internal')`),
    check('channel_code_check', sql`${t.code} ~ '^[a-z][a-z0-9_]{1,31}$'`),
  ],
);

/** Effective-dated channel fee rate (BR-901). Only OWN edits (rbac A102 – endpoint R3). */
export const channelCommissionRate = pgTable(
  'channel_commission_rate',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    channelId: uuid('channel_id').notNull(),
    effectiveFrom: date('effective_from', { mode: 'string' }).notNull(),
    ratePct: numeric('rate_pct', { precision: 5, scale: 2 }).notNull(),
    createdBy: uuid('created_by'),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (t) => [
    unique('channel_commission_rate_from_key').on(t.channelId, t.effectiveFrom),
    foreignKey({
      name: 'channel_commission_rate_channel_fk',
      columns: [t.propertyId, t.channelId],
      foreignColumns: [channel.propertyId, channel.id],
    }),
    check('channel_commission_rate_pct_check', sql`${t.ratePct} >= 0 AND ${t.ratePct} <= 100`),
  ],
);
