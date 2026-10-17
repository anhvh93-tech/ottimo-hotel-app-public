/**
 * Money tables (erd 4.6 folio, folio_line, payment, channel_fee, commission) + deposit_notice (A53).
 * Owned by BE-B (folio / payments modules, Sprint 2). Property-level, RLS in 0012. `stay_night` belongs to
 * the reservations schema (BE-A creates the nights); the folio module writes its money allocations
 * (channel fee, commissions, approved discounts – erd 8).
 *
 * - folio_line and payment are append-only for amounts (BR-008, coding-standards 4.5): ottimo_app gets
 *   column-level UPDATE only on state columns (0012) – an amount is never rewritten, a correction is a
 *   reversal + new line.
 * - Columns pointing at reservation / reservation_segment (BE-A tables, created in parallel) carry no FK
 *   here; BE-A's migration adds `(property_id, reservation_id)` FKs once `reservation` exists
 *   (reservation.folio_id → folio is DEFERRABLE INITIALLY DEFERRED, erd 4.6 BE-ARC-09).
 * - revenue_group is a plain column set by FolioService (erd says "generated": the group of a FOC/discount
 *   line follows the line it reduces, which a generated expression cannot read) – proposed to ARC.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { channel } from './channels';
import { approvalRequest } from './approvals';
import { appUser } from './identity';
import { property } from './platform';

export const FOLIO_LINE_CATEGORIES = [
  'room',
  'early_checkin',
  'late_checkout',
  'extra_person',
  'minibar',
  'fnb',
  'laundry',
  'cleaning',
  'service_fee',
  'utilities',
  'penalty',
  'damage',
  'cancellation_fee',
  'no_show_fee',
  'early_departure_fee',
  'deposit_forfeit',
  'discount',
  'foc',
  'adjustment',
  'room_change_difference',
] as const;
export type FolioLineCategory = (typeof FOLIO_LINE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'vietqr',
  'bank_transfer',
  'cash',
  'card_pos',
  'vnpay',
  'momo',
  'ota_collect',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TYPES = [
  'charge',
  'deposit',
  'security_deposit',
  'refund',
  'deposit_deduction',
] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const folio = pgTable(
  'folio',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    primaryReservationId: uuid('primary_reservation_id').notNull(),
    status: text('status').notNull().default('open'),
    billNo: text('bill_no'),
    settledAt: instant('settled_at'),
    settledBy: uuid('settled_by'),
    closedAt: instant('closed_at'),
    postCheckoutWindowUntil: instant('post_checkout_window_until'),
    debtDueDate: date('debt_due_date', { mode: 'string' }),
    debtApprovedBy: uuid('debt_approved_by'),
    // 0055 (OpenAPI 0.3.7 D1, BR-012 (5)): `{room_id: room name}` of the folio's rooms, captured in the
    // settling transaction (with bill_no); Bill.roomName and labelParams.room/from/to of a settled folio
    // read it, so renaming a room later does not change the bill. folio_line stays append-only.
    settledRoomNames: jsonb('settled_room_names'),
    ...auditColumns(),
  },
  (t) => [
    unique('folio_property_id_key').on(t.propertyId, t.id),
    unique('folio_primary_reservation_key').on(t.primaryReservationId),
    unique('folio_bill_no_key').on(t.propertyId, t.billNo),
    foreignKey({
      name: 'folio_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('folio_status_check', sql`${t.status} IN ('open', 'settled', 'closed')`),
    check('folio_bill_no_check', sql`${t.status} = 'open' OR ${t.billNo} IS NOT NULL`),
    check(
      'folio_settled_room_names_check',
      sql`${t.settledRoomNames} IS NULL OR jsonb_typeof(${t.settledRoomNames}) = 'object'`,
    ),
  ],
);

export const folioLine = pgTable(
  'folio_line',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    folioId: uuid('folio_id').notNull(),
    reservationId: uuid('reservation_id'),
    category: text('category').notNull(),
    adjustsGroup: text('adjusts_group'),
    revenueGroup: text('revenue_group').notNull(),
    description: text('description').notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    unitPriceVnd: bigint('unit_price_vnd', { mode: 'number' }).notNull(),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
    vatRatePct: numeric('vat_rate_pct', { precision: 5, scale: 2 }),
    serviceDate: date('service_date', { mode: 'string' }),
    periodFrom: date('period_from', { mode: 'string' }),
    periodTo: date('period_to', { mode: 'string' }),
    stayNightId: uuid('stay_night_id'),
    lineState: text('line_state').notNull().default('posted'),
    relatedLineId: uuid('related_line_id'),
    reversalOfId: uuid('reversal_of_id'),
    approvalRequestId: uuid('approval_request_id'),
    source: text('source').notNull(),
    postedAt: instant('posted_at').notNull(),
    postedBy: uuid('posted_by'),
    createdAt: instant('created_at').notNull(),
    // 0040 (Sprint 3): catalogue code, adjustment reason, evidence (US-032 AC2), post-checkout charge (BR-427).
    chargeCode: text('charge_code'),
    reason: text('reason'),
    note: text('note'),
    evidenceAttachmentIds: uuid('evidence_attachment_ids').array(),
    postCheckout: boolean('post_checkout').notNull().default(false),
    // 0042 (review S3, DOM BE-21): params of the printable label `labelKey` (bill.line.*).
    labelParams: jsonb('label_params').$type<Record<string, string | number>>(),
  },
  (t) => [
    unique('folio_line_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'folio_line_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'folio_line_folio_fk',
      columns: [t.propertyId, t.folioId],
      foreignColumns: [folio.propertyId, folio.id],
    }),
    foreignKey({
      name: 'folio_line_related_fk',
      columns: [t.propertyId, t.relatedLineId],
      foreignColumns: [t.propertyId, t.id],
    }),
    foreignKey({
      name: 'folio_line_reversal_fk',
      columns: [t.propertyId, t.reversalOfId],
      foreignColumns: [t.propertyId, t.id],
    }),
    check(
      'folio_line_category_check',
      sql`${t.category} IN ('room', 'early_checkin', 'late_checkout', 'extra_person', 'minibar', 'fnb', 'laundry', 'cleaning', 'service_fee', 'utilities', 'penalty', 'damage', 'cancellation_fee', 'no_show_fee', 'early_departure_fee', 'deposit_forfeit', 'discount', 'foc', 'adjustment', 'room_change_difference')`,
    ),
    check(
      'folio_line_revenue_group_check',
      sql`${t.revenueGroup} IN ('room', 'other', 'non_revenue')`,
    ),
    check(
      'folio_line_adjusts_group_check',
      sql`(${t.category} = 'adjustment') = (${t.adjustsGroup} IS NOT NULL) AND (${t.adjustsGroup} IS NULL OR ${t.adjustsGroup} IN ('room', 'other', 'non_revenue'))`,
    ),
    check(
      'folio_line_state_check',
      sql`${t.lineState} IN ('posted', 'pending_approval', 'rejected')`,
    ),
    check(
      'folio_line_source_check',
      sql`${t.source} IN ('manual', 'system', 'minibar_check', 'extension', 'checkin', 'checkout', 'guest_app')`,
    ),
    // Discounts / FOC are negative, charges positive (a reversal flips the sign of its original).
    check(
      'folio_line_sign_check',
      sql`${t.reversalOfId} IS NOT NULL OR (${t.category} IN ('discount', 'foc') AND ${t.amountVnd} <= 0) OR (${t.category} NOT IN ('discount', 'foc') AND ${t.amountVnd} >= 0) OR ${t.category} = 'adjustment'`,
    ),
    check('folio_line_quantity_check', sql`${t.quantity} > 0`),
    check(
      'folio_line_reason_check',
      sql`${t.reason} IS NULL OR char_length(${t.reason}) BETWEEN 3 AND 500`,
    ),
    check(
      'folio_line_label_params_check',
      sql`${t.labelParams} IS NULL OR jsonb_typeof(${t.labelParams}) = 'object'`,
    ),
    uniqueIndex('folio_line_one_reversal_key')
      .on(t.reversalOfId)
      .where(sql`${t.reversalOfId} IS NOT NULL`),
    index('folio_line_folio_idx').on(t.propertyId, t.folioId, t.postedAt),
    index('folio_line_night_idx')
      .on(t.stayNightId)
      .where(sql`${t.stayNightId} IS NOT NULL`),
  ],
);

export const payment = pgTable(
  'payment',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    code: text('code').notNull(),
    folioId: uuid('folio_id').notNull(),
    reservationId: uuid('reservation_id'),
    billingPeriodId: uuid('billing_period_id'),
    type: text('type').notNull(),
    method: text('method').notNull(),
    methodDetail: text('method_detail'),
    reconciliation: text('reconciliation').notNull(),
    reconciledAt: instant('reconciled_at'),
    reconciledBy: uuid('reconciled_by'),
    reconciliationNote: text('reconciliation_note'),
    shiftId: uuid('shift_id'),
    reservationGroupId: uuid('reservation_group_id'),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
    status: text('status').notNull(),
    provider: text('provider'),
    providerTxnId: text('provider_txn_id'),
    payerName: text('payer_name'),
    cardBrand: text('card_brand'),
    cardLast4: text('card_last4'),
    authCode: text('auth_code'),
    expiresAt: instant('expires_at'),
    receivedAt: instant('received_at'),
    recordedBy: uuid('recorded_by'),
    reversalOfId: uuid('reversal_of_id'),
    reversalReason: text('reversal_reason'),
    approvalRequestId: uuid('approval_request_id'),
    note: text('note'),
    attachmentId: uuid('attachment_id'),
    confirmedAt: instant('confirmed_at'),
    confirmedBy: uuid('confirmed_by'),
    ...auditColumns(),
    // 0040 (Sprint 3, OpenAPI 0.3.6): role snapshot (A-40), refund requester snapshot (SEC F8, checked by the
    // composite FK), owner self-reconciliation flag (SEC F5), cash short-handover amount (A46a), VietQR
    // over-balance reason (E15-03), bank reference of a refund (E15-02).
    recordedByRole: text('recorded_by_role'),
    approvalRequestedBy: uuid('approval_requested_by'),
    selfReconciled: boolean('self_reconciled').notNull().default(false),
    receivedAmountVnd: bigint('received_amount_vnd', { mode: 'number' }),
    overBalanceReason: text('over_balance_reason'),
    bankReference: text('bank_reference'),
    // 0042 (review S3, SEC F5 / ARC 12): role snapshot of the reconciler (self-reconcile = owner only).
    reconciledByRole: text('reconciled_by_role'),
  },
  (t) => [
    unique('payment_property_id_key').on(t.propertyId, t.id),
    unique('payment_property_code_key').on(t.propertyId, t.code),
    foreignKey({
      name: 'payment_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'payment_folio_fk',
      columns: [t.propertyId, t.folioId],
      foreignColumns: [folio.propertyId, folio.id],
    }),
    foreignKey({
      name: 'payment_reversal_fk',
      columns: [t.propertyId, t.reversalOfId],
      foreignColumns: [t.propertyId, t.id],
    }),
    foreignKey({
      name: 'payment_recorded_by_fk',
      columns: [t.organizationId, t.recordedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'payment_type_check',
      sql`${t.type} IN ('charge', 'deposit', 'security_deposit', 'refund', 'deposit_deduction')`,
    ),
    check(
      'payment_method_check',
      sql`${t.method} IN ('vietqr', 'bank_transfer', 'cash', 'card_pos', 'vnpay', 'momo', 'ota_collect')`,
    ),
    check(
      'payment_method_detail_check',
      sql`${t.methodDetail} IS NULL OR ${t.methodDetail} IN ('qr', 'atm', 'intl_card', 'wallet')`,
    ),
    check(
      'payment_reconciliation_check',
      sql`${t.reconciliation} IN ('not_required', 'pending', 'reconciled', 'disputed')`,
    ),
    check(
      'payment_status_check',
      sql`${t.status} IN ('pending', 'succeeded', 'failed', 'expired', 'reversed')`,
    ),
    // Refund = its own negative row (BR-522); everything else positive.
    check(
      'payment_amount_sign_check',
      sql`(${t.type} = 'refund' AND ${t.amountVnd} < 0) OR (${t.type} <> 'refund' AND ${t.amountVnd} > 0) OR ${t.reversalOfId} IS NOT NULL`,
    ),
    check('payment_card_last4_check', sql`${t.cardLast4} IS NULL OR ${t.cardLast4} ~ '^[0-9]{4}$'`),
    check(
      'payment_auth_code_check',
      sql`${t.authCode} IS NULL OR ${t.authCode} ~ '^[A-Za-z0-9]{1,12}$'`,
    ),
    check(
      'payment_recorded_by_role_check',
      sql`${t.recordedByRole} IS NULL OR ${t.recordedByRole} IN ('owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff', 'collaborator', 'housekeeping', 'maintenance')`,
    ),
    check(
      'payment_received_amount_check',
      sql`${t.receivedAmountVnd} IS NULL OR ${t.receivedAmountVnd} >= 0`,
    ),
    check(
      'payment_bank_reference_check',
      sql`${t.bankReference} IS NULL OR ${t.bankReference} ~ '^[A-Za-z0-9./_-]{1,64}$'`,
    ),
    check(
      'payment_refund_approval_check',
      sql`(${t.type} = 'refund' AND (${t.approvalRequestId} IS NOT NULL OR ${t.reversalOfId} IS NOT NULL)) OR (${t.type} <> 'refund' AND ${t.approvalRequestId} IS NULL)`,
    ),
    check(
      'payment_refund_not_requester_check',
      // 0042 (PO 17/10): an OWN may pay a transfer refund they requested; cash never (A47a).
      sql`${t.approvalRequestId} IS NULL OR (${t.approvalRequestedBy} IS NOT NULL AND ${t.recordedBy} IS NOT NULL AND (${t.recordedBy} <> ${t.approvalRequestedBy} OR (${t.recordedByRole} = 'owner' AND ${t.method} <> 'cash')))`,
    ),
    check(
      'payment_reconcile_separation_check',
      sql`${t.reconciledBy} IS NULL OR ${t.selfReconciled} OR (${t.reconciledBy} IS DISTINCT FROM ${t.recordedBy} AND ${t.reconciledBy} IS DISTINCT FROM ${t.confirmedBy})`,
    ),
    // 0042: COALESCE closes the NULL-role hole of 0040.
    check(
      'payment_cash_handover_not_self_check',
      sql`NOT ${t.selfReconciled} OR NOT (${t.method} = 'cash' AND COALESCE(${t.recordedByRole}, '') IN ('sales_staff', 'collaborator'))`,
    ),
    check(
      'payment_reconciled_by_role_check',
      sql`${t.reconciledByRole} IS NULL OR ${t.reconciledByRole} IN ('owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff', 'collaborator', 'housekeeping', 'maintenance')`,
    ),
    check(
      'payment_recorded_by_role_required_check',
      sql`${t.recordedBy} IS NULL OR ${t.recordedByRole} IS NOT NULL`,
    ),
    check(
      'payment_reconciled_by_check',
      sql`(${t.reconciliation} NOT IN ('reconciled', 'disputed') OR ${t.reconciledBy} IS NOT NULL) AND (${t.reconciledBy} IS NULL OR ${t.reconciledByRole} IS NOT NULL)`,
    ),
    check(
      'payment_self_reconciled_fact_check',
      sql`${t.selfReconciled} = (COALESCE(${t.reconciledBy} = ${t.recordedBy}, false) OR COALESCE(${t.reconciledBy} = ${t.confirmedBy}, false))`,
    ),
    check(
      'payment_self_reconcile_owner_check',
      sql`NOT ${t.selfReconciled} OR ${t.reconciledByRole} = 'owner'`,
    ),
    uniqueIndex('payment_one_reversal_key')
      .on(t.reversalOfId)
      .where(sql`${t.reversalOfId} IS NOT NULL`),
    foreignKey({
      name: 'payment_approval_request_fk',
      columns: [t.propertyId, t.approvalRequestId, t.approvalRequestedBy],
      foreignColumns: [approvalRequest.propertyId, approvalRequest.id, approvalRequest.requestedBy],
    }),
    index('payment_approval_request_idx')
      .on(t.approvalRequestId)
      .where(sql`${t.approvalRequestId} IS NOT NULL`),
    index('payment_list_idx').on(t.propertyId, t.receivedAt, t.id),
    uniqueIndex('payment_provider_txn_key')
      .on(t.provider, t.providerTxnId)
      .where(sql`${t.providerTxnId} IS NOT NULL`),
    uniqueIndex('payment_one_pending_qr_per_folio')
      .on(t.folioId)
      .where(sql`${t.method} = 'vietqr' AND ${t.status} = 'pending'`),
    index('payment_folio_idx').on(t.propertyId, t.folioId, t.receivedAt),
    index('payment_reconcile_idx')
      .on(t.propertyId, t.reconciliation, t.receivedAt)
      .where(sql`${t.reconciliation} = 'pending'`),
  ],
);

export const channelFee = pgTable(
  'channel_fee',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    channelId: uuid('channel_id').notNull(),
    baseAmountVnd: bigint('base_amount_vnd', { mode: 'number' }).notNull(),
    ratePctSnapshot: numeric('rate_pct_snapshot', { precision: 5, scale: 2 }).notNull(),
    amountEstimatedVnd: bigint('amount_estimated_vnd', { mode: 'number' }).notNull(),
    amountActualVnd: bigint('amount_actual_vnd', { mode: 'number' }),
    source: text('source').notNull(),
    reconciledAt: instant('reconciled_at'),
    recognizedOn: date('recognized_on', { mode: 'string' }),
    amountOnCancellationVnd: bigint('amount_on_cancellation_vnd', { mode: 'number' }),
    ...auditColumns(),
  },
  (t) => [
    unique('channel_fee_reservation_key').on(t.reservationId),
    foreignKey({
      name: 'channel_fee_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'channel_fee_channel_fk',
      columns: [t.propertyId, t.channelId],
      foreignColumns: [channel.propertyId, channel.id],
    }),
    check(
      'channel_fee_source_check',
      sql`${t.source} IN ('channel_manager', 'manual_reconcile', 'estimate')`,
    ),
    check(
      'channel_fee_amount_check',
      sql`${t.baseAmountVnd} >= 0 AND ${t.amountEstimatedVnd} >= 0 AND (${t.amountActualVnd} IS NULL OR ${t.amountActualVnd} >= 0)`,
    ),
  ],
);

export const commission = pgTable(
  'commission',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id'),
    leaseContractId: uuid('lease_contract_id'),
    payeeType: text('payee_type').notNull(),
    payeeUserId: uuid('payee_user_id').notNull(),
    ratePctSnapshot: numeric('rate_pct_snapshot', { precision: 5, scale: 2 }).notNull(),
    baseAmountVnd: bigint('base_amount_vnd', { mode: 'number' }).notNull(),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
    status: text('status').notNull(),
    recognizedAt: instant('recognized_at'),
    voidReason: text('void_reason'),
    ...auditColumns(),
  },
  (t) => [
    unique('commission_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'commission_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'commission_payee_fk',
      columns: [t.organizationId, t.payeeUserId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'commission_target_check',
      sql`num_nonnulls(${t.reservationId}, ${t.leaseContractId}) = 1`,
    ),
    check('commission_payee_type_check', sql`${t.payeeType} IN ('agent', 'staff')`),
    check(
      'commission_status_check',
      sql`${t.status} IN ('projected', 'earned', 'payable', 'paid', 'void')`,
    ),
    check('commission_void_check', sql`${t.status} <> 'void' OR ${t.voidReason} IS NOT NULL`),
    // One live short-stay commission per reservation and payee (B12 creates a NEW row after void – SM-11).
    uniqueIndex('commission_live_key')
      .on(t.reservationId, t.payeeUserId)
      .where(sql`${t.status} <> 'void' AND ${t.reservationId} IS NOT NULL`),
    index('commission_payee_idx').on(t.propertyId, t.payeeUserId, t.createdAt),
  ],
);

/** "Khách đã chuyển cọc" notices of SAL/CTV (A53, US-086 AC4) – FD/SAL confirm with B4. */
export const depositNotice = pgTable(
  'deposit_notice',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
    attachmentId: uuid('attachment_id'),
    note: text('note'),
    status: text('status').notNull().default('open'),
    handledPaymentId: uuid('handled_payment_id'),
    ...auditColumns(),
  },
  (t) => [
    unique('deposit_notice_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'deposit_notice_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    // FB-R2-ARC-BE-S2-09: the receipt that handled the notice stays in the same property.
    foreignKey({
      name: 'deposit_notice_handled_payment_fk',
      columns: [t.propertyId, t.handledPaymentId],
      foreignColumns: [payment.propertyId, payment.id],
    }),
    check('deposit_notice_amount_check', sql`${t.amountVnd} > 0`),
    check('deposit_notice_status_check', sql`${t.status} IN ('open', 'handled')`),
    index('deposit_notice_reservation_idx').on(t.propertyId, t.reservationId, t.createdAt),
  ],
);

/** HĐ GTGT công ty (US-039, D16 C2) – one per folio; MISA issuance R3 (einvoice_status stays not_requested). */
export const invoiceRequest = pgTable(
  'invoice_request',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    folioId: uuid('folio_id').notNull(),
    buyerType: text('buyer_type').notNull(),
    companyName: text('company_name'),
    taxCode: text('tax_code'),
    address: text('address'),
    email: text('email'),
    einvoiceStatus: text('einvoice_status').notNull().default('not_requested'),
    ...auditColumns(),
  },
  (t) => [
    unique('invoice_request_property_id_key').on(t.propertyId, t.id),
    unique('invoice_request_folio_key').on(t.folioId),
    foreignKey({
      name: 'invoice_request_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'invoice_request_folio_fk',
      columns: [t.propertyId, t.folioId],
      foreignColumns: [folio.propertyId, folio.id],
    }),
    check(
      'invoice_request_buyer_type_check',
      sql`${t.buyerType} IN ('company', 'individual', 'retail')`,
    ),
    check(
      'invoice_request_company_check',
      sql`${t.buyerType} <> 'company' OR (${t.companyName} IS NOT NULL AND ${t.taxCode} IS NOT NULL AND ${t.email} IS NOT NULL)`,
    ),
    check(
      'invoice_request_tax_code_check',
      sql`${t.taxCode} IS NULL OR ${t.taxCode} ~ '^[0-9]{10}(-?[0-9]{3})?$'`,
    ),
    check(
      'invoice_request_status_check',
      sql`${t.einvoiceStatus} IN ('not_requested', 'pending', 'issued', 'failed')`,
    ),
  ],
);
