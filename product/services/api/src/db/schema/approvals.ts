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
    check(
      'approval_request_self_applied_check',
      sql`NOT ${t.selfApplied} OR (${t.approverId} = ${t.requestedBy} AND ${t.status} = 'approved')`,
    ),
    check(
      'approval_request_decided_check',
      sql`${t.status} NOT IN ('approved', 'rejected') OR (${t.approverId} IS NOT NULL AND ${t.decidedAt} IS NOT NULL)`,
    ),
    index('approval_request_queue_idx').on(t.propertyId, t.status, t.requestedAt.desc()),
    index('approval_request_requester_idx').on(t.propertyId, t.requestedBy, t.requestedAt.desc()),
    index('approval_request_approver_idx').on(t.propertyId, t.approverId, t.decidedAt),
  ],
);
