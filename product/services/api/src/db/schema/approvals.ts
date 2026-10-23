/**
 * approvals module table (erd 4.9 `approval_request`, SM-10; BR-431…436; rbac 5).
 * Business row: never deleted (no DELETE grant); state changes through ApprovalService only.
 *
 * Columns beyond erd 0.3.2 (proposed to ARC in s1-be-a.md):
 * - `target_code` – display code of the target (OTM-…, F26-…) for ApprovalRequest.reservationCode without a
 *   join to tables that do not exist yet (no C2/C3);
 * - `limit_basis_vnd` – snapshot of "1 night rate" used by the manager per-time limit (BR-433 "≤ giá 1 đêm");
 * - `self_applied` – A2 self-application within the requester's own limit (BR-436, rbac 5.2 point 2).
 * FKs to folio_line / reservation are added by the migrations that create those tables.
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
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, bytea, instant } from './common';
import { appUser } from './identity';
import { property } from './platform';

export const APPROVAL_TYPES = [
  'foc',
  'special_discount',
  'refund',
  'contract_override',
  'checkin_room_not_ready',
  'late_checkout_conflict',
  'meter_lower_than_previous',
  'stocktake_variance',
  'damage_pricing',
  'quote_extension',
  'no_show_restore',
  'debt_on_checkout',
] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'escalated',
  'cancelled',
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVER_ROLES = ['front_desk_lead', 'manager', 'owner'] as const;
export type ApproverRole = (typeof APPROVER_ROLES)[number];

/** 0055 (OpenAPI 0.3.7 D1): ApprovalRequest.focState / focCancelReason / autoCancelReason. */
export const FOC_STATES = ['applied', 'dormant', 'suspended', 'cancelled'] as const;
export type FocState = (typeof FOC_STATES)[number];
export const FOC_CANCEL_REASONS = [
  'night_removed',
  'reservation_cancelled',
  'settled_while_dormant',
] as const;
export type FocCancelReason = (typeof FOC_CANCEL_REASONS)[number];
export const AUTO_CANCEL_REASONS = [
  'line_removed',
  'reservation_cancelled',
  'reservation_no_show',
  'superseded',
] as const;
export type AutoCancelReason = (typeof AUTO_CANCEL_REASONS)[number];

export const approvalRequest = pgTable(
  'approval_request',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    type: text('type').notNull(),
    status: text('status').notNull(),
    targetType: text('target_type'),
    targetId: uuid('target_id'),
    targetCode: text('target_code'),
    folioLineId: uuid('folio_line_id'),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
    limitBasisVnd: bigint('limit_basis_vnd', { mode: 'number' }),
    reasonCode: text('reason_code').notNull(),
    reasonNote: text('reason_note'),
    requestedBy: uuid('requested_by').notNull(),
    requestedAt: instant('requested_at').notNull(),
    requiredRole: text('required_role').notNull(),
    refundAccountEnc: bytea('refund_account_enc'),
    approverId: uuid('approver_id'),
    approverRoleSnapshot: text('approver_role_snapshot'),
    approverLimitSnapshot: jsonb('approver_limit_snapshot'),
    authMethod: text('auth_method'),
    selfApplied: boolean('self_applied').notNull().default(false),
    decidedAt: instant('decided_at'),
    decisionNote: text('decision_note'),
    escalatedAt: instant('escalated_at'),
    // 0040 (BE-B Sprint 3, OpenAPI 0.3.6 A-33): refund destination – method, masked parts, the C3 envelope
    // (refund_account_enc + CryptoService key id), who set it; amount paid out so far (≤ amount_vnd).
    refundMethod: text('refund_method'),
    refundBankBin: text('refund_bank_bin'),
    refundAccountLast4: text('refund_account_last4'),
    refundAccountKeyId: uuid('refund_account_key_id'),
    refundDestinationSetAt: instant('refund_destination_set_at'),
    refundDestinationSetBy: uuid('refund_destination_set_by'),
    refundedVnd: bigint('refunded_vnd', { mode: 'number' }).notNull().default(0),
    // 0055 (OpenAPI 0.3.7 D1, erd 4.6; BR-434 v0.3.5, BR-315 (g), BR-433): life of an APPROVED foc /
    // special_discount – set iff (type IN foc/special_discount AND status = approved). The approval writes
    // `applied` (the meaning of every approved FOC before 0.3.7); S4-02/S4-18/S4-22 move it. The monthly
    // limit counts only `applied`/`dormant`.
    focState: text('foc_state'),
    // Set iff foc_state = cancelled (same transaction as audit folio.foc_cancelled).
    focCancelReason: text('foc_cancel_reason'),
    // S4-18: last re-write of the reduced line while the request is pending (ApprovalRequest.lineChangedNote).
    lineChange: jsonb('line_change'),
    // Why the server cancelled a pending request by itself (only on status = cancelled).
    autoCancelReason: text('auto_cancel_reason'),
    // 0077 (FB-R2-SEC-BE-80, BR-525): the most a `debt_write_off` FOC may ever apply – fixed when it is applied
    // (min(approved, open debt then)); NULL = the request's amount.
    appliedCapVnd: bigint('applied_cap_vnd', { mode: 'number' }),
    // 0060 (BE-B S4-02/S4-18): current service date of the FOC KEY of a request on a room / extra-person line
    // (BR-434 (1)–(3): moves with the nights, also while dormant/pending). NULL for other lines.
    focServiceDate: date('foc_service_date', { mode: 'string' }),
    // 0085 (BE-B, BR-433 (e) v0.4.3 – SEC FZ-02, ARC/SEC ADD3-01): on a `refund` of a folio where someone below the
    // owner made an A32 reduction after check-out – EVERY such person (and the one whose A32 made it): none of them
    // ever approves it. Written at INSERT only (no UPDATE grant – SEC ADD3-03); a `superseded` replacement copies it.
    originActorIds: uuid('origin_actor_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    // 0085 (ADD3-01): how a `refund` came to be – `a32` = made by the server from an A32 reduction (routed on the
    // folio's Σ of A32 refunds vs the protected basis), `other` = any other path (by hand, a receipt, a cancellation…;
    // on a folio with such an A32 → owner). NULL on other types and on refunds before 0085.
    refundSource: text('refund_source'),
    ...auditColumns(),
  },
  (t) => [
    unique('approval_request_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'approval_request_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'approval_request_requested_by_fk',
      columns: [t.organizationId, t.requestedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'approval_request_approver_fk',
      columns: [t.organizationId, t.approverId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'approval_request_type_check',
      sql`${t.type} IN ('foc', 'special_discount', 'refund', 'contract_override', 'checkin_room_not_ready', 'late_checkout_conflict', 'meter_lower_than_previous', 'stocktake_variance', 'damage_pricing', 'quote_extension', 'no_show_restore', 'debt_on_checkout')`,
    ),
    check(
      'approval_request_status_check',
      sql`${t.status} IN ('pending', 'approved', 'rejected', 'escalated', 'cancelled')`,
    ),
    check(
      'approval_request_required_role_check',
      sql`${t.requiredRole} IN ('front_desk_lead', 'manager', 'owner')`,
    ),
    check('approval_request_amount_check', sql`${t.amountVnd} >= 0`),
    check(
      'approval_request_auth_method_check',
      sql`${t.authMethod} IS NULL OR ${t.authMethod} IN ('password', 'pin')`,
    ),
    // K6 / BR-432: nobody approves their own request, except owner/manager within their limit and the
    // narrow self-application (A2) – and a self-application is always by the requester.
    check(
      'approval_request_no_self_approval',
      sql`${t.approverId} IS NULL OR ${t.approverId} <> ${t.requestedBy} OR ${t.selfApplied} OR ${t.approverRoleSnapshot} IN ('owner', 'manager')`,
    ),
    // 0085 (BR-433 (e), ADD3-01): nobody who made an A32 reduction on the folio approves its refunds.
    check(
      'approval_request_origin_scope_check',
      sql`cardinality(${t.originActorIds}) = 0 OR ${t.type} = 'refund'`,
    ),
    check(
      'approval_request_origin_check',
      sql`${t.approverId} IS NULL OR NOT (${t.approverId} = ANY(${t.originActorIds}))`,
    ),
    check(
      'approval_request_refund_source_check',
      sql`${t.refundSource} IS NULL OR (${t.type} = 'refund' AND ${t.refundSource} IN ('a32', 'other'))`,
    ),
    check(
      'approval_request_self_applied_check',
      sql`NOT ${t.selfApplied} OR (${t.approverId} = ${t.requestedBy} AND ${t.status} = 'approved')`,
    ),
    check(
      'approval_request_decided_check',
      sql`${t.status} NOT IN ('approved', 'rejected') OR (${t.approverId} IS NOT NULL AND ${t.decidedAt} IS NOT NULL)`,
    ),
    // 0040 (BE-B): refund rows of `payment` point at (id, requested_by) – SEC F8 payer ≠ requester.
    unique('approval_request_requester_key').on(t.propertyId, t.id, t.requestedBy),
    check(
      'approval_request_refund_method_check',
      sql`${t.refundMethod} IS NULL OR (${t.type} = 'refund' AND ${t.refundMethod} IN ('cash', 'bank_transfer', 'original_method'))`,
    ),
    check(
      'approval_request_refund_account_check',
      // 0042: IS NOT DISTINCT FROM – a NULL method with an account no longer passes (ARC 12).
      sql`${t.refundMethod} IS NOT DISTINCT FROM 'bank_transfer' OR (${t.refundAccountEnc} IS NULL AND ${t.refundAccountLast4} IS NULL)`,
    ),
    check(
      'approval_request_refund_last4_check',
      sql`${t.refundAccountLast4} IS NULL OR ${t.refundAccountLast4} ~ '^[0-9]{4}$'`,
    ),
    check(
      'approval_request_refund_bin_check',
      sql`${t.refundBankBin} IS NULL OR ${t.refundBankBin} ~ '^[0-9]{6}$'`,
    ),
    check(
      'approval_request_refunded_check',
      sql`${t.refundedVnd} >= 0 AND ${t.refundedVnd} <= ${t.amountVnd} AND (${t.type} = 'refund' OR ${t.refundedVnd} = 0)`,
    ),
    check(
      'approval_request_refund_no_self_approval',
      sql`${t.type} <> 'refund' OR ${t.approverId} IS NULL OR ${t.approverId} <> ${t.requestedBy}`,
    ),
    // 0031 (BE-A, SEC-BE-37): who set the refund destination never approves it – 0042 (BE-B, PO 17/10): except
    // an OWN approving a refund not paid in cash.
    check(
      'approval_request_refund_destination_not_approver',
      sql`${t.type} <> 'refund' OR ${t.approverId} IS NULL OR ${t.refundDestinationSetBy} IS NULL OR ${t.approverId} <> ${t.refundDestinationSetBy} OR (${t.approverRoleSnapshot} = 'owner' AND COALESCE(${t.refundMethod}, 'cash') <> 'cash')`,
    ),
    // 0055 (OpenAPI 0.3.7 D1, erd 4.6): FOC state machine of an approved foc / special_discount.
    check(
      'approval_request_foc_state_check',
      sql`${t.focState} IS NULL OR ${t.focState} IN ('applied', 'dormant', 'suspended', 'cancelled')`,
    ),
    check(
      'approval_request_foc_state_scope_check',
      sql`(${t.focState} IS NOT NULL) = (${t.type} IN ('foc', 'special_discount') AND ${t.status} = 'approved')`,
    ),
    check(
      'approval_request_foc_cancel_reason_check',
      sql`${t.focCancelReason} IS NULL OR ${t.focCancelReason} IN ('night_removed', 'reservation_cancelled', 'settled_while_dormant')`,
    ),
    check(
      'approval_request_foc_cancelled_check',
      sql`(${t.focCancelReason} IS NOT NULL) = (${t.focState} IS NOT DISTINCT FROM 'cancelled')`,
    ),
    check(
      'approval_request_line_change_check',
      sql`${t.lineChange} IS NULL OR jsonb_typeof(${t.lineChange}) = 'object'`,
    ),
    check(
      'approval_request_auto_cancel_reason_check',
      // 0063 (0.3.7 bổ sung 4, S438-CANCEL-03): + no_show_restored – B12 auto-cancels the refund of the no-show.
      // 0077 (FB-R2-SEC-BE-80): + debt_cleared – a `debt_write_off` approved when no debt is left is cancelled.
      sql`${t.autoCancelReason} IS NULL OR (${t.autoCancelReason} IN ('line_removed', 'reservation_cancelled', 'reservation_no_show', 'superseded', 'no_show_restored', 'debt_cleared') AND ${t.status} = 'cancelled')`,
    ),
    check(
      'approval_request_applied_cap_check',
      sql`${t.appliedCapVnd} IS NULL OR (${t.appliedCapVnd} >= 0 AND ${t.type} = 'foc')`,
    ),
    // 0060 (BE-B S4-02): the key date exists only on foc / special_discount requests.
    check(
      'approval_request_foc_service_date_check',
      sql`${t.focServiceDate} IS NULL OR ${t.type} IN ('foc', 'special_discount')`,
    ),
    index('approval_request_queue_idx').on(t.propertyId, t.status, t.requestedAt.desc()),
    index('approval_request_requester_idx').on(t.propertyId, t.requestedBy, t.requestedAt.desc()),
    index('approval_request_approver_idx').on(t.propertyId, t.approverId, t.decidedAt),
    // pendingFor(): checkout guard 409 PENDING_APPROVALS (AC5) – open requests of one target only.
    index('approval_request_open_target_idx')
      .on(t.propertyId, t.targetType, t.targetId)
      .where(sql`${t.status} IN ('pending', 'escalated')`),
  ],
);
