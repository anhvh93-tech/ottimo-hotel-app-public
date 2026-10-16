/**
 * reservations module tables (erd 4.5, 4.12 channel, 7, 8; ADR-009) – R2 Sprint 2 (BE-A).
 *
 * - reservation (SM-01), reservation_segment (room × [from, to)), room_occupancy (the ONE inventory table,
 *   EXCLUDE … DEFERRABLE – hand-written in the custom migration because drizzle-kit does not know it),
 *   stay_night (room-night facts for DATA), reservation_change (field history), overbooking_incident (erd 7).
 *
 * FKs to property-level tables are (property_id, x_id) pairs (erd 1, K11). `reservation.folio_id` has no FK
 * yet: the folio table belongs to the folio module (BE-B), which adds the DEFERRABLE FK in its migration and
 * fills the column through the reservation-created hook (reservations/public/reservation-hooks.ts).
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  time,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { guest } from './guests';
import { channel } from './channels';
import { appUser } from './identity';
import { property } from './platform';
import { room } from './rooms';

/** PostgreSQL daterange, always '[)' (BR-002). Written as `[from,to)` text. */
export const daterange = customType<{ data: string }>({
  dataType() {
    return 'daterange';
  },
});

export const RESERVATION_STATUSES = [
  'hold',
  'confirmed',
  'in_house',
  'checked_out',
  'cancelled',
  'no_show',
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const CANCEL_REASON_CODES = [
  'guest_cancelled',
  'guest_changed_mind',
  'found_other',
  'price',
  'date_change',
  'unreachable',
  'hold_expired',
  'ota_cancelled',
  'overbooking_relocated',
  'group_partial',
  'other',
] as const;
export type CancelReasonCode = (typeof CANCEL_REASON_CODES)[number];

export const reservation = pgTable(
  'reservation',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    code: text('code').notNull(),
    status: text('status').notNull(),
    stayType: text('stay_type').notNull(),
    channelId: uuid('channel_id').notNull(),
    paymentModel: text('payment_model').notNull(),
    otaRef: text('ota_ref'),
    otaBookedAt: instant('ota_booked_at'),
    directSource: text('direct_source'),
    bookerGuestId: uuid('booker_guest_id').notNull(),
    closerUserId: uuid('closer_user_id'),
    parentReservationId: uuid('parent_reservation_id'),
    stayGroupId: uuid('stay_group_id'),
    quoteId: uuid('quote_id'),
    groupId: uuid('group_id'),
    // NOT NULL since 0016 (FB-R2-ARC-BE-S2-04); FK → folio DEFERRABLE INITIALLY DEFERRED in 0014.
    folioId: uuid('folio_id').notNull(),
    arrivalDate: date('arrival_date', { mode: 'string' }).notNull(),
    departureDate: date('departure_date', { mode: 'string' }).notNull(),
    bookedArrivalDate: date('booked_arrival_date', { mode: 'string' }),
    bookedDepartureDate: date('booked_departure_date', { mode: 'string' }),
    adults: smallint('adults').notNull(),
    children611: smallint('children_6_11').notNull().default(0),
    childrenUnder6: smallint('children_under_6').notNull().default(0),
    etaTime: time('eta_time'),
    isComplimentary: boolean('is_complimentary').notNull().default(false),
    conflictState: text('conflict_state').notNull().default('none'),
    // DOM D-1 / 0.3.5 A-20: OTA booking taken above the room's max occupancy (BR-312 (1)) – separate from
    // conflict_state (unassigned lane only). Cleared when the head count fits the assigned room.
    capacityConflictAt: instant('capacity_conflict_at'),
    capacityAckReason: text('capacity_ack_reason'),
    capacityAckBy: uuid('capacity_ack_by'),
    holdCreatedAt: instant('hold_created_at'),
    holdHours: smallint('hold_hours'),
    holdExpiresAt: instant('hold_expires_at'),
    holdExtendedCount: smallint('hold_extended_count').notNull().default(0),
    depositRequiredVnd: bigint('deposit_required_vnd', { mode: 'number' }).notNull().default(0),
    // 0040 (BE-B, B-29 / DOM BE-11): MGR+ accepted a short deposit at B4 (confirmDeposit.acceptShortfallReason).
    depositShortfallVnd: bigint('deposit_shortfall_vnd', { mode: 'number' }),
    depositShortfallAcceptedAt: instant('deposit_shortfall_accepted_at'),
    depositShortfallAcceptedBy: uuid('deposit_shortfall_accepted_by'),
    depositShortfallReason: text('deposit_shortfall_reason'),
    totalRoomVnd: bigint('total_room_vnd', { mode: 'number' }).notNull().default(0),
    pricingSnapshot: jsonb('pricing_snapshot').notNull(),
    cancelledAt: instant('cancelled_at'),
    cancelledByType: text('cancelled_by_type'),
    cancelledBy: uuid('cancelled_by'),
    cancelReasonCode: text('cancel_reason_code'),
    cancelNote: text('cancel_note'),
    statusBeforeCancel: text('status_before_cancel'),
    confirmedAt: instant('confirmed_at'),
    noShowMarkedAt: instant('no_show_marked_at'),
    noShowMarkedBy: uuid('no_show_marked_by'),
    noShowContactNote: text('no_show_contact_note'),
    rescheduleCount: smallint('reschedule_count').notNull().default(0),
    actualCheckinAt: instant('actual_checkin_at'),
    actualCheckoutAt: instant('actual_checkout_at'),
    agreedCheckoutTime: time('agreed_checkout_time'),
    internalNote: text('internal_note'),
    externalContract: boolean('external_contract').notNull().default(false),
    manualLongStay: jsonb('manual_long_stay'),
    // 0030 (BE-A Sprint 3, erd 0.3.3/0.3.6): check-in / stay / check-out facts (EP03-05). No door code here.
    cardsIssued: smallint('cards_issued'),
    houseRulesSentAt: instant('house_rules_sent_at'),
    houseRulesSentBy: uuid('house_rules_sent_by'),
    checkinDocumentOverrideReason: text('checkin_document_override_reason'),
    checkinDocumentOverrideBy: uuid('checkin_document_override_by'),
    checkinRoomOverrideReason: text('checkin_room_override_reason'),
    checkinRoomOverrideBy: uuid('checkin_room_override_by'),
    checkinRoomStatusBefore: text('checkin_room_status_before'),
    doorAccessHandedOverAt: instant('door_access_handed_over_at'),
    doorAccessHandedOverBy: uuid('door_access_handed_over_by'),
    checkoutMode: text('checkout_mode'),
    debtDueDate: date('debt_due_date', { mode: 'string' }),
    debtReason: text('debt_reason'),
    earlyDepartureNoticeAt: instant('early_departure_notice_at'),
    // B15 conflict sent for approval (late_checkout_conflict): applied as agreed_checkout_time when approved.
    lateCheckoutRequestedTime: time('late_checkout_requested_time'),
    partyVersion: integer('party_version').notNull().default(1),
    ...auditColumns(),
  },
  (t) => [
    unique('reservation_property_id_key').on(t.propertyId, t.id),
    unique('reservation_property_code_key').on(t.propertyId, t.code),
    foreignKey({
      name: 'reservation_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'reservation_channel_fk',
      columns: [t.propertyId, t.channelId],
      foreignColumns: [channel.propertyId, channel.id],
    }),
    foreignKey({
      name: 'reservation_booker_fk',
      columns: [t.organizationId, t.bookerGuestId],
      foreignColumns: [guest.organizationId, guest.id],
    }),
    foreignKey({
      name: 'reservation_closer_fk',
      columns: [t.organizationId, t.closerUserId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'reservation_parent_fk',
      columns: [t.propertyId, t.parentReservationId],
      foreignColumns: [t.propertyId, t.id],
    }),
    check(
      'reservation_status_check',
      sql`${t.status} IN ('hold', 'confirmed', 'in_house', 'checked_out', 'cancelled', 'no_show')`,
    ),
    check('reservation_stay_type_check', sql`${t.stayType} IN ('short', 'long')`),
    check(
      'reservation_payment_model_check',
      sql`${t.paymentModel} IN ('direct', 'ota_prepaid', 'ota_pay_at_property')`,
    ),
    check(
      'reservation_direct_source_check',
      sql`${t.directSource} IS NULL OR ${t.directSource} IN ('website', 'zalo_phone', 'walk_in', 'returning', 'sales_staff')`,
    ),
    check('reservation_dates_check', sql`${t.departureDate} > ${t.arrivalDate}`),
    check(
      'reservation_people_check',
      sql`${t.adults} >= 1 AND ${t.children611} >= 0 AND ${t.childrenUnder6} >= 0`,
    ),
    check(
      'reservation_conflict_state_check',
      sql`${t.conflictState} IN ('none', 'open', 'resolved')`,
    ),
    check('reservation_hold_check', sql`${t.status} <> 'hold' OR ${t.holdExpiresAt} IS NOT NULL`),
    check(
      'reservation_cancel_reason_check',
      sql`${t.cancelReasonCode} IS NULL OR ${t.cancelReasonCode} IN ('guest_cancelled', 'guest_changed_mind', 'found_other', 'price', 'date_change', 'unreachable', 'hold_expired', 'ota_cancelled', 'overbooking_relocated', 'group_partial', 'other')`,
    ),
    check(
      'reservation_cancelled_check',
      sql`${t.status} <> 'cancelled' OR (${t.cancelReasonCode} IS NOT NULL AND ${t.cancelledAt} IS NOT NULL)`,
    ),
    check(
      'reservation_status_before_cancel_check',
      sql`${t.status} NOT IN ('cancelled', 'no_show') OR ${t.statusBeforeCancel} IN ('hold', 'confirmed')`,
    ),
    check(
      'reservation_external_contract_check',
      sql`NOT ${t.externalContract} OR ${t.stayType} = 'long'`,
    ),
    check(
      'reservation_deposit_shortfall_check',
      sql`(${t.depositShortfallAcceptedAt} IS NULL AND ${t.depositShortfallVnd} IS NULL AND ${t.depositShortfallAcceptedBy} IS NULL AND ${t.depositShortfallReason} IS NULL) OR (${t.depositShortfallAcceptedAt} IS NOT NULL AND ${t.depositShortfallVnd} > 0 AND ${t.depositShortfallAcceptedBy} IS NOT NULL AND char_length(${t.depositShortfallReason}) BETWEEN 3 AND 500)`,
    ),
    check('reservation_money_check', sql`${t.depositRequiredVnd} >= 0 AND ${t.totalRoomVnd} >= 0`),
    check(
      'reservation_cards_issued_check',
      sql`${t.cardsIssued} IS NULL OR ${t.cardsIssued} BETWEEN 0 AND 2`,
    ),
    check(
      'reservation_checkout_mode_check',
      sql`${t.checkoutMode} IS NULL OR ${t.checkoutMode} IN ('desk', 'self_service', 'debt')`,
    ),
    check(
      'reservation_debt_check',
      sql`(${t.debtDueDate} IS NULL AND ${t.debtReason} IS NULL) OR (${t.checkoutMode} = 'debt' AND ${t.debtDueDate} IS NOT NULL AND ${t.debtReason} IS NOT NULL)`,
    ),
    check(
      'reservation_room_status_before_check',
      sql`${t.checkinRoomStatusBefore} IS NULL OR ${t.checkinRoomStatusBefore} IN ('VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO')`,
    ),
    foreignKey({
      name: 'reservation_door_access_by_fk',
      columns: [t.organizationId, t.doorAccessHandedOverBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'reservation_house_rules_by_fk',
      columns: [t.organizationId, t.houseRulesSentBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    index('reservation_parent_idx')
      .on(t.propertyId, t.parentReservationId)
      .where(sql`${t.parentReservationId} IS NOT NULL`),
    uniqueIndex('reservation_ota_ref_uk')
      .on(t.propertyId, t.channelId, t.otaRef)
      .where(sql`${t.otaRef} IS NOT NULL AND ${t.status} <> 'cancelled'`),
    index('reservation_status_arrival_idx').on(t.propertyId, t.status, t.arrivalDate),
    index('reservation_departure_idx').on(t.propertyId, t.departureDate),
    index('reservation_closer_idx').on(t.propertyId, t.closerUserId),
    index('reservation_created_by_idx').on(t.propertyId, t.createdBy),
    index('reservation_hold_expiry_idx')
      .on(t.propertyId, t.holdExpiresAt)
      .where(sql`${t.status} = 'hold'`),
    index('reservation_external_contract_idx')
      .on(t.propertyId)
      .where(sql`${t.externalContract}`),
    index('reservation_conflict_open_idx')
      .on(t.propertyId)
      .where(sql`${t.conflictState} = 'open'`),
  ],
);

export const reservationSegment = pgTable(
  'reservation_segment',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    // NULL only for an OTA booking in the "unassigned" lane (erd 7).
    roomId: uuid('room_id'),
    fromDate: date('from_date', { mode: 'string' }).notNull(),
    toDate: date('to_date', { mode: 'string' }).notNull(),
    active: boolean('active').notNull().default(true),
    changeReasonCode: text('change_reason_code'),
    changeNote: text('change_note'),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (t) => [
    unique('reservation_segment_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'reservation_segment_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'reservation_segment_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    check('reservation_segment_dates_check', sql`${t.toDate} > ${t.fromDate}`),
    // 0.3.5 A-19 MoveReasonCode (DOM D-5).
    check(
      'reservation_segment_reason_check',
      sql`${t.changeReasonCode} IS NULL OR ${t.changeReasonCode} IN ('guest_request', 'property_fault', 'overbooking', 'upgrade', 'inventory_optimize', 'force_majeure', 'other')`,
    ),
    index('reservation_segment_reservation_idx').on(t.reservationId),
    index('reservation_segment_room_idx')
      .on(t.propertyId, t.roomId, t.fromDate)
      .where(sql`${t.active}`),
    // Rack window over all rooms (FB-R2-ARC-BE-S2-11): to_date > from AND from_date < to.
    index('reservation_segment_window_idx')
      .on(t.propertyId, t.toDate, t.fromDate)
      .where(sql`${t.active}`),
  ],
);

export const ROOM_BLOCK_STATUSES = ['planned', 'active', 'released', 'cancelled'] as const;
export type RoomBlockStatus = (typeof ROOM_BLOCK_STATUSES)[number];

/** SM-02 OOO block, half-open [start_date, end_date) like stays (BR-804 v0.2). */
export const roomBlock = pgTable(
  'room_block',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    roomId: uuid('room_id').notNull(),
    status: text('status').notNull(),
    reason: text('reason').notNull(),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDatePlanned: date('end_date_planned', { mode: 'string' }).notNull(),
    endDateActual: date('end_date_actual', { mode: 'string' }),
    // FK to work_order is added by the maintenance module (BE-B Sprint 4).
    workOrderId: uuid('work_order_id'),
    affectedReservationAckBy: uuid('affected_reservation_ack_by'),
    releasedAt: instant('released_at'),
    releasedBy: uuid('released_by'),
    releaseReason: text('release_reason'),
    ...auditColumns(),
  },
  (t) => [
    unique('room_block_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'room_block_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'room_block_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'room_block_ack_by_fk',
      columns: [t.organizationId, t.affectedReservationAckBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'room_block_released_by_fk',
      columns: [t.organizationId, t.releasedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'room_block_status_check',
      sql`${t.status} IN ('planned', 'active', 'released', 'cancelled')`,
    ),
    check('room_block_dates_check', sql`${t.endDatePlanned} > ${t.startDate}`),
    check(
      'room_block_actual_check',
      sql`${t.endDateActual} IS NULL OR ${t.endDateActual} >= ${t.startDate}`,
    ),
    index('room_block_room_idx').on(t.propertyId, t.roomId, t.startDate),
  ],
);

export const OCCUPANCY_KINDS = ['reservation', 'hold', 'ooo'] as const;
export type OccupancyKind = (typeof OCCUPANCY_KINDS)[number];

/**
 * The ONE inventory table (ADR-009). EXCLUDE USING gist (room_id WITH =, stay_range WITH &&) WHERE (active)
 * DEFERRABLE INITIALLY IMMEDIATE + CHECK NOT isempty(stay_range) live in the custom migration.
 * Only OccupancyService writes this table (coding-standards 6 "Tồn phòng").
 */
export const roomOccupancy = pgTable(
  'room_occupancy',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    roomId: uuid('room_id').notNull(),
    stayRange: daterange('stay_range').notNull(),
    kind: text('kind').notNull(),
    reservationSegmentId: uuid('reservation_segment_id'),
    roomBlockId: uuid('room_block_id'),
    active: boolean('active').notNull().default(true),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (t) => [
    foreignKey({
      name: 'room_occupancy_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'room_occupancy_segment_fk',
      columns: [t.propertyId, t.reservationSegmentId],
      foreignColumns: [reservationSegment.propertyId, reservationSegment.id],
    }),
    foreignKey({
      name: 'room_occupancy_block_fk',
      columns: [t.propertyId, t.roomBlockId],
      foreignColumns: [roomBlock.propertyId, roomBlock.id],
    }),
    check('room_occupancy_kind_check', sql`${t.kind} IN ('reservation', 'hold', 'ooo')`),
    check(
      'room_occupancy_source_check',
      sql`num_nonnulls(${t.reservationSegmentId}, ${t.roomBlockId}) = 1`,
    ),
    // K9: one occupancy row per OOO block; one per segment.
    uniqueIndex('room_occupancy_block_uk').on(t.roomBlockId),
    uniqueIndex('room_occupancy_segment_uk').on(t.reservationSegmentId),
  ],
);

export const NIGHT_STATES = ['hold', 'sold', 'void'] as const;
export type NightState = (typeof NIGHT_STATES)[number];

/** Room-night facts (erd 4.5 stay_night, section 8) – updated in the same transaction as the booking. */
export const stayNight = pgTable(
  'stay_night',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    reservationSegmentId: uuid('reservation_segment_id'),
    roomId: uuid('room_id'),
    stayDate: date('stay_date', { mode: 'string' }).notNull(),
    nightState: text('night_state').notNull(),
    // 0.3.5 A-22 (DOM D-8): calendar price before the BR-107 tier; NULL for OTA/lease nights.
    calendarRateVnd: bigint('calendar_rate_vnd', { mode: 'number' }),
    roomRevenueGrossVnd: bigint('room_revenue_gross_vnd', { mode: 'number' }).notNull(),
    discountVnd: bigint('discount_vnd', { mode: 'number' }).notNull().default(0),
    roomRevenueVnd: bigint('room_revenue_vnd', { mode: 'number' }).notNull(),
    channelFeeVnd: bigint('channel_fee_vnd', { mode: 'number' }).notNull().default(0),
    channelFeeIsEstimate: boolean('channel_fee_is_estimate').notNull().default(true),
    agentCommissionVnd: bigint('agent_commission_vnd', { mode: 'number' }).notNull().default(0),
    staffCommissionVnd: bigint('staff_commission_vnd', { mode: 'number' }).notNull().default(0),
    serviceFeeAllocVnd: bigint('service_fee_alloc_vnd', { mode: 'number' }).notNull().default(0),
    soldAt: instant('sold_at'),
    voidedAt: instant('voided_at'),
    voidReason: text('void_reason'),
    prevState: text('prev_state'),
    vatRatePct: numeric('vat_rate_pct'),
    isComplimentary: boolean('is_complimentary').notNull().default(false),
    rateSource: text('rate_source').notNull(),
    channelId: uuid('channel_id').notNull(),
    stayType: text('stay_type').notNull(),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (t) => [
    // Target of the (property_id, stay_night_id) FK of folio_line (FB-R2-SEC-BE-30, ARC-BE-S2-09).
    unique('stay_night_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'stay_night_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'stay_night_segment_fk',
      columns: [t.propertyId, t.reservationSegmentId],
      foreignColumns: [reservationSegment.propertyId, reservationSegment.id],
    }),
    foreignKey({
      name: 'stay_night_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    check('stay_night_state_check', sql`${t.nightState} IN ('hold', 'sold', 'void')`),
    check(
      'stay_night_void_check',
      sql`${t.nightState} <> 'void' OR (${t.voidedAt} IS NOT NULL AND ${t.voidReason} IN ('hold_expired', 'cancelled', 'no_show', 'early_departure', 'lease_terminated', 'date_change', 'relocated_external', 'channel_cancelled') AND ${t.prevState} IN ('hold', 'sold'))`,
    ),
    check(
      'stay_night_money_check',
      sql`${t.roomRevenueGrossVnd} >= 0 AND ${t.discountVnd} >= 0 AND ${t.roomRevenueVnd} = ${t.roomRevenueGrossVnd} - ${t.discountVnd}`,
    ),
    check(
      'stay_night_rate_source_check',
      sql`${t.rateSource} IN ('short_stay_rate', 'lease_allocation', 'extra_night_early_late', 'extension', 'odd_days')`,
    ),
    uniqueIndex('stay_night_reservation_date_uk')
      .on(t.reservationId, t.stayDate)
      .where(sql`${t.nightState} <> 'void'`),
    index('stay_night_sold_idx')
      .on(t.propertyId, t.stayDate)
      .where(sql`${t.nightState} = 'sold'`),
    index('stay_night_void_idx')
      .on(t.propertyId, t.stayDate)
      .where(sql`${t.nightState} = 'void'`),
  ],
);

/** Field history of a booking – append-only, source of truth for metrics (erd 4.5, DATA FB-05). */
export const reservationChange = pgTable(
  'reservation_change',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    changedAt: instant('changed_at').notNull(),
    changedBy: uuid('changed_by'),
    field: text('field').notNull(),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    reason: text('reason'),
  },
  (t) => [
    foreignKey({
      name: 'reservation_change_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    index('reservation_change_reservation_idx').on(t.reservationId, t.changedAt),
  ],
);

/** OTA conflict record (erd 4.5 overbooking_incident, section 7; BR-312, BR-317). */
export const overbookingIncident = pgTable(
  'overbooking_incident',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    requestedRoomId: uuid('requested_room_id'),
    stayFrom: date('stay_from', { mode: 'string' }).notNull(),
    stayTo: date('stay_to', { mode: 'string' }).notNull(),
    conflictingReservationIds: uuid('conflicting_reservation_ids').array().notNull(),
    source: text('source').notNull(),
    cause: text('cause').notNull(),
    detectedAt: instant('detected_at').notNull(),
    handleBy: instant('handle_by'),
    status: text('status').notNull(),
    resolution: text('resolution'),
    costVnd: bigint('cost_vnd', { mode: 'number' }),
    decidedBy: uuid('decided_by'),
    decisionNote: text('decision_note'),
    resolvedAt: instant('resolved_at'),
    resolvedBy: uuid('resolved_by'),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    foreignKey({
      name: 'overbooking_incident_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'overbooking_incident_room_fk',
      columns: [t.propertyId, t.requestedRoomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    check(
      'overbooking_incident_source_check',
      sql`${t.source} IN ('desk', 'channel_sync', 'no_show_restore')`,
    ),
    check(
      'overbooking_incident_cause_check',
      sql`${t.cause} IN ('sync_delay', 'manual_entry', 'channel_overbooked', 'other')`,
    ),
    check('overbooking_incident_status_check', sql`${t.status} IN ('open', 'resolved')`),
    check(
      'overbooking_incident_resolution_check',
      sql`${t.resolution} IS NULL OR ${t.resolution} IN ('reassigned_same_group', 'upgraded', 'relocated_external', 'cancelled_by_channel')`,
    ),
    check(
      'overbooking_incident_resolved_check',
      sql`${t.status} <> 'resolved' OR (${t.resolution} IS NOT NULL AND ${t.resolvedAt} IS NOT NULL)`,
    ),
    check('overbooking_incident_cost_check', sql`${t.costVnd} IS NULL OR ${t.costVnd} >= 0`),
    index('overbooking_incident_status_idx').on(t.propertyId, t.status, t.detectedAt),
    index('overbooking_incident_reservation_idx').on(t.reservationId),
  ],
);

export const HK_TASK_TYPES = [
  'checkout_clean',
  'stayover_clean',
  'long_stay_clean',
  'minibar_refill',
  'guest_request',
  'after_repair_clean',
  'adhoc_clean',
  'priority_clean',
  'extra_guest_kit_prepare',
  'extra_guest_kit_collect',
  'extra_guest_kit_transfer',
] as const;
export type HkTaskType = (typeof HK_TASK_TYPES)[number];

/**
 * Housekeeping task (erd 4.8, SM-14). Created here (BE-A Sprint 2) because BR-812 needs the extra-guest-kit
 * tasks in the same transaction as the booking transition; the housekeeping module (BE-B Sprint 4) owns
 * the remaining flows (assignment, offline queue, guest requests) and adds its FKs.
 */
export const hkTask = pgTable(
  'hk_task',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    roomId: uuid('room_id').notNull(),
    reservationId: uuid('reservation_id'),
    type: text('type').notNull(),
    quantity: smallint('quantity').notNull().default(1),
    status: text('status').notNull(),
    dueAt: instant('due_at'),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    windowStart: time('window_start'),
    windowEnd: time('window_end'),
    notBeforeTime: time('not_before_time'),
    priorityRank: smallint('priority_rank').notNull().default(0),
    assignedUserId: uuid('assigned_user_id'),
    source: text('source').notNull(),
    guestRequestId: uuid('guest_request_id'),
    note: text('note'),
    refillItems: jsonb('refill_items'),
    startedAt: instant('started_at'),
    doneAt: instant('done_at'),
    doneBy: uuid('done_by'),
    cancelReason: text('cancel_reason'),
    clientMutationId: text('client_mutation_id'),
    performedAt: instant('performed_at'),
    ...auditColumns(),
  },
  (t) => [
    unique('hk_task_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'hk_task_room_fk',
      columns: [t.propertyId, t.roomId],
      foreignColumns: [room.propertyId, room.id],
    }),
    foreignKey({
      name: 'hk_task_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    check(
      'hk_task_type_check',
      sql`${t.type} IN ('checkout_clean', 'stayover_clean', 'long_stay_clean', 'minibar_refill', 'guest_request', 'after_repair_clean', 'adhoc_clean', 'priority_clean', 'extra_guest_kit_prepare', 'extra_guest_kit_collect', 'extra_guest_kit_transfer')`,
    ),
    check('hk_task_status_check', sql`${t.status} IN ('open', 'in_progress', 'done', 'cancelled')`),
    check('hk_task_source_check', sql`${t.source} IN ('system', 'manual', 'guest_app')`),
    check('hk_task_quantity_check', sql`${t.quantity} >= 1`),
    check(
      'hk_task_kit_reservation_check',
      sql`${t.type} NOT LIKE 'extra_guest_kit_%' OR (${t.reservationId} IS NOT NULL AND ${t.source} = 'system')`,
    ),
    uniqueIndex('hk_task_clean_uk')
      .on(t.roomId, t.type, t.dueDate)
      .where(
        sql`${t.status} IN ('open', 'in_progress') AND ${t.type} IN ('stayover_clean', 'long_stay_clean', 'checkout_clean')`,
      ),
    uniqueIndex('hk_task_kit_uk')
      .on(t.reservationId, t.roomId, t.type)
      .where(sql`${t.status} IN ('open', 'in_progress') AND ${t.type} LIKE 'extra_guest_kit_%'`),
    index('hk_task_due_idx').on(t.propertyId, t.dueDate, t.status),
  ],
);
