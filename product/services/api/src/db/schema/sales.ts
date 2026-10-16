/**
 * Sales tables (erd 4.5 `quote` SM-08, `lead` SM-09) – owned by BE-B (sales module, Sprint 2).
 * Property-level (RLS in 0012). Scope M (SAL/CTV see only their own): `created_by` / `closer_user_id` of
 * a quote, `owner_user_id` of a lead – filtered in SQL (coding-standards 7.7).
 * `converted_reservation_id` points at BE-A's `reservation` (FK added by BE-A's migration).
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  foreignKey,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { channel } from './channels';
import { guest } from './guests';
import { appUser } from './identity';
import { property } from './platform';
import { room, roomGroup } from './rooms';

export const LEAD_STATUSES = ['new', 'quoted', 'holding', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const QUOTE_STATUSES = ['active', 'expired', 'converted', 'withdrawn'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const lead = pgTable(
  'lead',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    guestId: uuid('guest_id').notNull(),
    need: text('need'),
    estimatedValueVnd: bigint('estimated_value_vnd', { mode: 'number' }),
    source: text('source'),
    status: text('status').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    lostReasonCode: text('lost_reason_code'),
    lostNote: text('lost_note'),
    lastInteractionAt: instant('last_interaction_at').notNull(),
    ...auditColumns(),
  },
  (t) => [
    unique('lead_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'lead_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'lead_guest_fk',
      columns: [t.organizationId, t.guestId],
      foreignColumns: [guest.organizationId, guest.id],
    }),
    foreignKey({
      name: 'lead_owner_fk',
      columns: [t.organizationId, t.ownerUserId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check('lead_status_check', sql`${t.status} IN ('new', 'quoted', 'holding', 'won', 'lost')`),
    check('lead_lost_check', sql`${t.status} <> 'lost' OR ${t.lostReasonCode} IS NOT NULL`),
    check(
      'lead_estimated_value_check',
      sql`${t.estimatedValueVnd} IS NULL OR ${t.estimatedValueVnd} >= 0`,
    ),
    index('lead_owner_idx').on(t.propertyId, t.ownerUserId, t.id),
  ],
);

export const quote = pgTable(
  'quote',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    code: text('code').notNull(),
    type: text('type').notNull(),
    status: text('status').notNull(),
    leadId: uuid('lead_id'),
    guestId: uuid('guest_id').notNull(),
    roomId: uuid('room_id'),
    roomGroupId: uuid('room_group_id'),
    channelId: uuid('channel_id').notNull(),
    closerUserId: uuid('closer_user_id'),
    arrivalDate: date('arrival_date', { mode: 'string' }).notNull(),
    nights: smallint('nights'),
    termMonths: smallint('term_months'),
    adults: smallint('adults').notNull(),
    childrenBands: jsonb('children_bands').notNull(),
    guestCategory: text('guest_category'),
    cleaningPerWeek: smallint('cleaning_per_week'),
    pricingSnapshot: jsonb('pricing_snapshot').notNull(),
    totalVnd: bigint('total_vnd', { mode: 'number' }).notNull(),
    depositVnd: bigint('deposit_vnd', { mode: 'number' }).notNull(),
    commissionVnd: bigint('commission_vnd', { mode: 'number' }),
    ottimoRemainingVnd: bigint('ottimo_remaining_vnd', { mode: 'number' }),
    startedAt: instant('started_at'),
    sentAt: instant('sent_at'),
    expiresAt: instant('expires_at').notNull(),
    convertedReservationId: uuid('converted_reservation_id'),
    withdrawnAt: instant('withdrawn_at'),
    ...auditColumns(),
  },
  (t) => [
    unique('quote_property_id_key').on(t.propertyId, t.id),
    unique('quote_property_code_key').on(t.propertyId, t.code),
    foreignKey({
      name: 'quote_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'quote_guest_fk',
      columns: [t.organizationId, t.guestId],
      foreignColumns: [guest.organizationId, guest.id],
    }),
    foreignKey({
      name: 'quote_lead_fk',
      columns: [t.propertyId, t.leadId],
      foreignColumns: [lead.propertyId, lead.id],
    }),
    foreignKey({
      name: 'quote_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'quote_room_group_fk',
      columns: [t.propertyId, t.roomGroupId],
      foreignColumns: [roomGroup.propertyId, roomGroup.id],
    }),
    foreignKey({
      name: 'quote_channel_fk',
      columns: [t.propertyId, t.channelId],
      foreignColumns: [channel.propertyId, channel.id],
    }),
    foreignKey({
      name: 'quote_closer_fk',
      columns: [t.organizationId, t.closerUserId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check('quote_type_check', sql`${t.type} IN ('short', 'long')`),
    check(
      'quote_status_check',
      sql`${t.status} IN ('active', 'expired', 'converted', 'withdrawn')`,
    ),
    check(
      'quote_short_check',
      sql`${t.type} <> 'short' OR (${t.nights} IS NOT NULL AND ${t.nights} >= 1)`,
    ),
    check(
      'quote_converted_check',
      sql`${t.status} <> 'converted' OR ${t.convertedReservationId} IS NOT NULL`,
    ),
    check(
      'quote_amount_check',
      sql`${t.totalVnd} >= 0 AND ${t.depositVnd} >= 0 AND (${t.commissionVnd} IS NULL OR ${t.commissionVnd} >= 0)`,
    ),
    check(
      'quote_guest_category_check',
      sql`${t.guestCategory} IS NULL OR ${t.guestCategory} IN ('vn', 'foreigner')`,
    ),
    index('quote_list_idx').on(t.propertyId, t.status, t.id),
    index('quote_owner_idx').on(t.propertyId, t.createdBy, t.id),
    index('quote_closer_idx').on(t.propertyId, t.closerUserId, t.id),
  ],
);
