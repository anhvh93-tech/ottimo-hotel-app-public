/**
 * Approval requests – SM-10 (US-007; BR-431…436; rbac 5; SR-AZ-07).
 *
 * Public API for other modules (folio, reservations, contracts…):
 * - submit(tx, …)        A1 pending / A2 self-applied, in the caller's business transaction.
 * - onDecided(type, fn)  hook run in the SAME transaction when a request becomes approved/rejected/cancelled
 *                        (the folio module adds the negative FOC line there – BR-434).
 * - pendingFor(tx, …)    open requests of a target (checkout guard 409 PENDING_APPROVALS – AC5).
 * HTTP use cases (approve, reject, cancel, list) are called by ApprovalsController.
 *
 * Rules: nobody chooses the approver (BR-432) – every account with enough authority sees the request; the
 * approver re-authenticates with their OWN password (R2); nobody approves their own request except
 * owner/manager within their own limit and the A2 self-application; limits per time and per calendar month
 * from `foc_limits` (BR-433); above the limit → `escalated` + 403 APPROVAL_LIMIT_EXCEEDED (A4) with the
 * escalation committed. Push (BR-432 v0.3, `foc_approval_push_roles`) goes to the outbox (Mock in R2).
 *
 * Monthly limits (BR-433/436, FB-R2-ARC-BE-04): per user one advisory lock `approval-limit:<userId>` taken by
 * approve() AND by a submit() that may self-apply, so two concurrent decisions/self-applications of the same
 * person never both use the same remainder. Lock order everywhere: approval row (FOR UPDATE) → limit lock.
 * What counts against which budget (`monthlyApprovedBy` scope):
 *   owner/manager  – ONE monthly budget: approvals for others + own self-applications ('all');
 *   front_desk_lead – approvals for others ('others', BR-433 "duyệt cho người khác");
 *   front_desk/front_desk_lead self-applied minibar FOC – separate budget foc_self_apply.front_desk.per_month
 *   ('self', BR-436).
 * Routing (FB-R2-ARC-BE-09, assumption until BA/DOM confirm BR-433 wording): a request submitted by a
 * front_desk_lead (not the BR-436 self-application) needs at least a manager – two leads never approve
 * each other's requests.
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import {
  APPROVAL_TYPES,
  type ApprovalStatus,
  type ApprovalType,
  type ApproverRole,
} from '../../../db/schema';
import { problem } from '../../../shared/problem';
import { type LocalDate, atLocal, localDate, toZonedIso } from '../../../shared/time';
import { assertNoCardNumber, requireReason } from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';
import { ParameterService } from '../../platform/public/parameter.service';
import {
  APPROVER_RANK,
  MONEY_LIMITED,
  MONEY_TYPES,
  approverRoleOf,
  minRoleFor,
  decide,
  pushRoles,
  remainingMonthly,
  requiredRoleFor,
  roleLimit,
  within,
} from '../internal/limits';

/** Reason codes of BR-432 (FocRequestInput.reasonCode). Other request types pass their own code. */
export const FOC_REASON_CODES = [
  'regular_vip',
  'room_ready_no_impact',
  'service_recovery',
  'long_stay_guest',
  'other',
] as const;

export interface Actor {
  userId: string;
  roles: readonly string[];
}

export interface SubmitInput {
  type: ApprovalType;
  amountVnd: number;
  reasonCode: string;
  reasonNote?: string | null;
  targetType?: string;
  targetId?: string;
  /** Display code of the target (OTM-…) – no C2/C3. */
  targetCode?: string;
  folioLineId?: string;
  /** Night rate of the stay: base of the manager per-time limit (BR-433 "≤ giá 1 đêm"). */
  limitBasisVnd?: number | null;
  /** Folio line category (minibar…) – for the FD/FDL self-application of BR-436. */
  lineCategory?: string;
  /** The caller has re-authenticated the requester (required for the FD/FDL self-application, AC6). */
  requesterReauthenticated?: boolean;
  requestId?: string;
}

export interface ApprovalRow {
  id: string;
  property_id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  target_type: string | null;
  target_id: string | null;
  target_code: string | null;
  folio_line_id: string | null;
  amount_vnd: number;
  limit_basis_vnd: number | null;
  reason_code: string;
  reason_note: string | null;
  requested_by: string;
  requested_at: Date;
  required_role: ApproverRole;
  approver_id: string | null;
  /** Role of the decider at decision time (front_desk for the BR-436 self-application). */
  approver_role_snapshot: string | null;
  self_applied: boolean;
  decided_at: Date | null;
  decision_note: string | null;
  escalated_at: Date | null;
  version: number;
  // 0040 (BE-B, A-33): refund destination – masked parts only; the C3 account number never leaves BE-B.
  refund_method?: 'cash' | 'bank_transfer' | 'original_method' | null;
  refund_bank_bin?: string | null;
  refund_account_last4?: string | null;
  refund_destination_set_at?: Date | null;
  refunded_vnd?: number | string | null;
}

/** OpenAPI ApprovalRequest (the role serializer removes approverRemainingMonthlyVnd for other roles). */
export interface ApprovalDto {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  reservationCode?: string;
  folioLineId?: string;
  amountVnd: number;
  reasonCode: string;
  reasonNote?: string;
  requestedBy: string;
  requestedAt: string;
  requiredRole: ApproverRole;
  approverName?: string;
  approverRole?: string;
  decidedAt?: string;
  decisionNote?: string;
  approverRemainingMonthlyVnd?: number;
  targetType?: string;
  targetCode?: string;
  selfApplied?: boolean;
  refundDestination?: {
    method: 'cash' | 'bank_transfer' | 'original_method';
    bankBin?: string;
    accountNoLast4?: string;
    setAt?: string;
  };
  refundedVnd?: number;
}

export type DecidedHook = (tx: Tx, request: ApprovalRow) => Promise<void>;

const MONEY_CATEGORY = (type: ApprovalType) => (MONEY_TYPES.has(type) ? 'money' : 'state');

/** Which decisions count against a monthly limit (see header). */
export type MonthlyScope = 'all' | 'others' | 'self';

/** Monthly budget of an approver role when deciding/self-applying (owner/manager share one budget). */
function budgetScope(role: ApproverRole): MonthlyScope {
  return role === 'front_desk_lead' ? 'others' : 'all';
}

export interface ApprovalContext {
  propertyId: string;
  tz: string;
  today: LocalDate;
  now: Date;
}

@Injectable()
export class ApprovalService {
  private readonly hooks = new Map<ApprovalType, DecidedHook[]>();
  /** Per-transaction memo: time zone/today and foc_limits are read once per request (FB-R2-ARC-BE-06). */
  private readonly perTx = new WeakMap<
    Tx,
    { ctx?: Promise<ApprovalContext>; focLimits?: Promise<unknown> }
  >();

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Register a same-transaction hook for decisions of a request type (folio FOC line, refunds…). */
  onDecided(type: ApprovalType, hook: DecidedHook): void {
    this.hooks.set(type, [...(this.hooks.get(type) ?? []), hook]);
  }

  // ───────────────────────── A1 / A2 ─────────────────────────

  async submit(tx: Tx, actor: Actor, input: SubmitInput): Promise<ApprovalRow> {
    if (!APPROVAL_TYPES.includes(input.type)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'type', code: 'NOT_IN_LIST' }] });
    }
    if (!Number.isSafeInteger(input.amountVnd) || input.amountVnd < 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'AMOUNT_INVALID' }],
      });
    }
    if (MONEY_TYPES.has(input.type) && input.amountVnd <= 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }],
      });
    }
    if (!input.reasonCode) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'reasonCode', code: 'REQUIRED' }] });
    }
    if (
      (input.type === 'foc' || input.type === 'special_discount') &&
      !(FOC_REASON_CODES as readonly string[]).includes(input.reasonCode)
    ) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'reasonCode', code: 'NOT_IN_LIST' }],
      });
    }
    // BR-432: reason "other" needs a note (V-08); every note goes through V-09.
    const note =
      input.reasonCode === 'other'
        ? requireReason('note', input.reasonNote)
        : input.reasonNote?.trim() || null;
    if (note && note.length > 500) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'note', code: 'TOO_LONG' }] });
    }
    assertNoCardNumber('note', note);

    const { propertyId, tz, today, now } = await this.context(tx);
    const focLimits = await this.focLimits(tx);
    const basis = input.limitBasisVnd ?? null;
    let requiredRole = requiredRoleFor(input.type, input.amountVnd, focLimits, basis);
    // FB-R2-ARC-BE-09: a lead's own request is decided above the lead level.
    if (
      approverRoleOf(actor.roles) === 'front_desk_lead' &&
      APPROVER_RANK[requiredRole] < APPROVER_RANK.manager
    ) {
      requiredRole = 'manager';
    }

    // A2 – self-application within the requester's own limit (rbac 5.2 point 2). Serialised per user with
    // approve() (same advisory lock) so concurrent self-applications cannot both use the remainder.
    if (this.maySelfApply(actor, input)) await this.lockLimit(tx, actor.userId);
    const self = await this.selfApplication(tx, actor, input, { focLimits, basis, tz, now, today });

    const id = uuidv7();
    const { rows } = await tx.query<ApprovalRow>(
      `INSERT INTO approval_request (id, organization_id, property_id, type, status, target_type, target_id,
         target_code, folio_line_id, amount_vnd, limit_basis_vnd, reason_code, reason_note, requested_by,
         requested_at, required_role, approver_id, approver_role_snapshot, approver_limit_snapshot,
         self_applied, decided_at, auth_method, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
         $21, $22, $15, $14, $15)
       RETURNING *`,
      [
        id,
        tx.ctx.organizationId,
        propertyId,
        input.type,
        self ? 'approved' : 'pending',
        input.targetType ?? null,
        input.targetId ?? null,
        input.targetCode ?? null,
        input.folioLineId ?? null,
        input.amountVnd,
        basis,
        input.reasonCode,
        note,
        actor.userId,
        now,
        requiredRole,
        self ? actor.userId : null,
        self ? self.role : null,
        self ? JSON.stringify(self.snapshot) : null,
        !!self,
        self ? now : null,
        self && input.requesterReauthenticated ? 'password' : null,
      ],
    );
    const row = rows[0] as ApprovalRow;
    await this.audit.record(tx, {
      category: MONEY_CATEGORY(row.type),
      action: self ? 'approval.self_applied' : 'approval.requested',
      entityType: 'approval_request',
      entityId: row.id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      after: {
        type: row.type,
        status: row.status,
        amountVnd: row.amount_vnd,
        reasonCode: row.reason_code,
        reasonNote: row.reason_note,
        requiredRole: row.required_role,
        selfApplied: row.self_applied,
        targetType: row.target_type,
        targetCode: row.target_code,
      },
      ...(note ? { reason: note } : {}),
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    if (self) await this.runHooks(tx, row);
    else await this.pushToApprovers(tx, row, actor.userId, today);
    return row;
  }

  private async selfApplication(
    tx: Tx,
    actor: Actor,
    input: SubmitInput,
    c: { focLimits: unknown; basis: number | null; tz: string; now: Date; today: LocalDate },
  ): Promise<{ role: string; snapshot: Record<string, unknown> } | null> {
    // SEC F8 (BE-B, 0.3.6): a refund is never self-applied, owner/manager included (CHECK in 0040).
    if (input.type === 'refund') return null;
    const role = approverRoleOf(actor.roles);
    // (a) owner / manager within their own BR-433 limit.
    if (role === 'owner' || role === 'manager') {
      if (
        APPROVER_RANK[role] < APPROVER_RANK[requiredRoleFor(input.type, 0, c.focLimits, c.basis)]
      ) {
        return null;
      }
      const limit = MONEY_LIMITED.has(input.type)
        ? roleLimit(c.focLimits, role, c.basis)
        : { perTime: 'unlimited' as const, perMonth: 'unlimited' as const };
      if (!within(input.amountVnd, limit.perTime)) return null;
      const used = await this.monthlyApprovedBy(tx, actor.userId, c.tz, c.now, 'all');
      if (limit.perMonth !== 'unlimited' && used + input.amountVnd > limit.perMonth) return null;
      return {
        role,
        snapshot: { perTime: limit.perTime, perMonth: limit.perMonth, usedVnd: used },
      };
    }
    // (b) FD / FDL: FOC on a minibar line within foc_self_apply.front_desk.* (BR-436), after re-auth.
    const fd = actor.roles.includes('front_desk') || actor.roles.includes('front_desk_lead');
    if (!fd || input.type !== 'foc' || !input.requesterReauthenticated) return null;
    const categories = await this.params.get<unknown>(
      tx,
      'foc_self_apply.front_desk.categories',
      c.today,
    );
    if (
      !Array.isArray(categories) ||
      !input.lineCategory ||
      !categories.includes(input.lineCategory)
    ) {
      return null;
    }
    const perTime = await this.params.get<number>(
      tx,
      'foc_self_apply.front_desk.per_time',
      c.today,
    );
    const perMonth = await this.params.get<number>(
      tx,
      'foc_self_apply.front_desk.per_month',
      c.today,
    );
    if (input.amountVnd > perTime) return null;
    const used = await this.monthlyApprovedBy(tx, actor.userId, c.tz, c.now, 'self');
    if (used + input.amountVnd > perMonth) return null;
    return {
      role: actor.roles.includes('front_desk_lead') ? 'front_desk_lead' : 'front_desk',
      snapshot: { selfApply: 'front_desk', perTime, perMonth, usedVnd: used },
    };
  }

  /** Could this submission be self-applied (A2)? Then the per-user limit lock is needed. */
  private maySelfApply(actor: Actor, input: SubmitInput): boolean {
    if (input.type === 'refund') return false;
    const role = approverRoleOf(actor.roles);
    if (role === 'owner' || role === 'manager') return true;
    const fd = actor.roles.includes('front_desk') || actor.roles.includes('front_desk_lead');
    return fd && input.type === 'foc' && !!input.requesterReauthenticated;
  }

  /** Transaction-scoped advisory lock on one user's monthly limits (released at COMMIT/ROLLBACK). */
  private async lockLimit(tx: Tx, userId: string): Promise<void> {
    await tx.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`approval-limit:${userId}`]);
  }

  // ───────────────────────── A3 / A4 ─────────────────────────

  async approve(
    tx: Tx,
    actor: Actor,
    approvalId: string,
    input: { authMethod: 'password' | 'pin'; note: string | null; requestId?: string },
  ): Promise<{ row: ApprovalRow } | { escalatedTo: ApproverRole; row: ApprovalRow }> {
    const row = await this.lockOpen(tx, approvalId);
    const role = approverRoleOf(actor.roles);
    if (!role) throw problem('FORBIDDEN_ACTION');
    this.assertNotSelf(row, actor, role);
    // FB-R2-ARC-BE-08: a request routed above this approver is decided at that level – 403, nothing written
    // (same as reject). Escalation (A4) is only for an approver of the routed level who exceeds a limit.
    const needed =
      APPROVER_RANK[row.required_role] >= APPROVER_RANK[minRoleFor(row.type)]
        ? row.required_role
        : minRoleFor(row.type);
    if (APPROVER_RANK[role] < APPROVER_RANK[needed]) {
      throw problem('APPROVAL_LIMIT_EXCEEDED', { extras: { approver: needed } });
    }

    const { tz, today, now } = await this.context(tx);
    const focLimits = await this.focLimits(tx);
    // Serialise the monthly limit of this approver (two approvals at once cannot both use the remainder).
    await this.lockLimit(tx, actor.userId);
    const used = await this.monthlyApprovedBy(tx, actor.userId, tz, now, budgetScope(role));
    const d = decide({
      type: row.type,
      amountVnd: row.amount_vnd,
      requiredRole: row.required_role,
      approverRole: role,
      focLimits,
      limitBasisVnd: row.limit_basis_vnd,
      monthlyUsedVnd: used,
    });

    if (!d.ok) {
      const target =
        APPROVER_RANK[d.escalateTo] > APPROVER_RANK[row.required_role]
          ? d.escalateTo
          : row.required_role;
      const { rows } = await tx.query<ApprovalRow>(
        `UPDATE approval_request SET status = 'escalated', required_role = $2,
            escalated_at = COALESCE(escalated_at, $3), updated_at = $3, version = version + 1
          WHERE id = $1 RETURNING *`,
        [row.id, target, now],
      );
      const escalated = rows[0] as ApprovalRow;
      await this.audit.record(tx, {
        category: 'state',
        action: 'approval.escalated',
        entityType: 'approval_request',
        entityId: row.id,
        ...(row.target_code ? { entityCode: row.target_code } : {}),
        before: { status: row.status, requiredRole: row.required_role },
        after: {
          status: 'escalated',
          requiredRole: target,
          approverRole: role,
          monthlyUsedVnd: used,
          ...(d.limit && typeof d.limit.perTime === 'number' ? { limitVnd: d.limit.perTime } : {}),
        },
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
      if (target !== row.required_role || row.status !== 'escalated') {
        await this.pushToApprovers(tx, escalated, row.requested_by, today);
      }
      return { escalatedTo: target, row: escalated };
    }

    const { rows } = await tx.query<ApprovalRow>(
      `UPDATE approval_request SET status = 'approved', approver_id = $2, approver_role_snapshot = $3,
          approver_limit_snapshot = $4, auth_method = $5, decided_at = $6, decision_note = $7,
          updated_at = $6, version = version + 1
        WHERE id = $1 RETURNING *`,
      [
        row.id,
        actor.userId,
        role,
        JSON.stringify({ perTime: d.limit.perTime, perMonth: d.limit.perMonth, usedVnd: used }),
        input.authMethod,
        now,
        input.note,
      ],
    );
    const approved = rows[0] as ApprovalRow;
    await this.audit.record(tx, {
      category: MONEY_CATEGORY(row.type),
      action: 'approval.approved',
      entityType: 'approval_request',
      entityId: row.id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      before: { status: row.status },
      after: {
        status: 'approved',
        type: row.type,
        amountVnd: row.amount_vnd,
        approverRole: role,
        decisionNote: input.note,
        monthlyUsedVnd: used,
      },
      ...(input.note ? { reason: input.note } : {}),
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    await this.runHooks(tx, approved);
    await this.pushDecision(tx, approved);
    return { row: approved };
  }

  // ───────────────────────── A5 / A6 ─────────────────────────

  async reject(
    tx: Tx,
    actor: Actor,
    approvalId: string,
    input: { authMethod: 'password' | 'pin'; reason: string; requestId?: string },
  ): Promise<ApprovalRow> {
    const row = await this.lockOpen(tx, approvalId);
    const role = approverRoleOf(actor.roles);
    if (!role) throw problem('FORBIDDEN_ACTION');
    this.assertNotSelf(row, actor, role);
    // A request routed above this approver is decided at that level (no change, no escalation).
    if (APPROVER_RANK[role] < APPROVER_RANK[row.required_role]) {
      throw problem('APPROVAL_LIMIT_EXCEEDED', { extras: { approver: row.required_role } });
    }
    const now = this.clock.now();
    const { rows } = await tx.query<ApprovalRow>(
      `UPDATE approval_request SET status = 'rejected', approver_id = $2, approver_role_snapshot = $3,
          auth_method = $4, decided_at = $5, decision_note = $6, updated_at = $5, version = version + 1
        WHERE id = $1 RETURNING *`,
      [row.id, actor.userId, role, input.authMethod, now, input.reason],
    );
    const rejected = rows[0] as ApprovalRow;
    await this.audit.record(tx, {
      category: MONEY_CATEGORY(row.type),
      action: 'approval.rejected',
      entityType: 'approval_request',
      entityId: row.id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      before: { status: row.status },
      after: { status: 'rejected', type: row.type, amountVnd: row.amount_vnd, approverRole: role },
      reason: input.reason,
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    await this.runHooks(tx, rejected);
    await this.pushDecision(tx, rejected);
    return rejected;
  }

  /** A6: only the requester (x-scope own → someone else's id is 404), only while `pending`. */
  async cancel(tx: Tx, actor: Actor, approvalId: string, requestId?: string): Promise<ApprovalRow> {
    const { rows } = await tx.query<ApprovalRow>(
      `SELECT * FROM approval_request WHERE id = $1 AND requested_by = $2 FOR UPDATE`,
      [approvalId, actor.userId],
    );
    const row = rows[0];
    if (!row) throw problem('NOT_FOUND');
    if (row.status !== 'pending') throw problem('INVALID_TRANSITION');
    const now = this.clock.now();
    const updated = await tx.query<ApprovalRow>(
      `UPDATE approval_request SET status = 'cancelled', updated_at = $2, version = version + 1
        WHERE id = $1 RETURNING *`,
      [row.id, now],
    );
    const cancelled = updated.rows[0] as ApprovalRow;
    await this.audit.record(tx, {
      category: MONEY_CATEGORY(row.type),
      action: 'approval.cancelled',
      entityType: 'approval_request',
      entityId: row.id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      before: { status: row.status },
      after: { status: 'cancelled' },
      ...(requestId ? { requestId } : {}),
    });
    await this.runHooks(tx, cancelled);
    return cancelled;
  }

  /** Open requests (pending/escalated) of a target – checkout guard (AC5, 409 PENDING_APPROVALS). */
  async pendingFor(tx: Tx, targetType: string, targetId: string): Promise<ApprovalRow[]> {
    const propertyId = tx.ctx.propertyId;
    if (!propertyId) throw new Error('approvals need a property context');
    // Index approval_request_open_target_idx (partial, pending/escalated – FB-R2-ARC-BE-16).
    const { rows } = await tx.query<ApprovalRow>(
      `SELECT * FROM approval_request
        WHERE property_id = $1 AND target_type = $2 AND target_id = $3
          AND status IN ('pending', 'escalated')
        ORDER BY requested_at`,
      [propertyId, targetType, targetId],
    );
    return rows;
  }

  // ───────────────────────── list (S23) ─────────────────────────

  /**
   * x-scope: OWN/MGR all; FDL `within_limit_or_own` = requests routed to FDL + own + decided by me;
   * FD/HK/MT/SAL/CTV `own`. Multi-role callers get the widest scope of their roles.
   */
  async list(
    tx: Tx,
    actor: Actor,
    q: { status?: ApprovalStatus; limit: number; after?: { at: string; id: string } | null },
  ): Promise<{
    rows: (ApprovalRow & { requester_name: string; approver_name: string | null })[];
    remainingMonthlyVnd: number | null;
  }> {
    const role = approverRoleOf(actor.roles);
    const params: unknown[] = [];
    const where: string[] = [];
    const p = (v: unknown) => {
      params.push(v);
      return `$${params.length}`;
    };
    if (role === 'front_desk_lead') {
      const me = p(actor.userId);
      where.push(
        `(a.requested_by = ${me} OR a.approver_id = ${me} OR a.required_role = 'front_desk_lead')`,
      );
    } else if (role !== 'owner' && role !== 'manager') {
      where.push(`a.requested_by = ${p(actor.userId)}`);
    }
    if (q.status) where.push(`a.status = ${p(q.status)}`);
    if (q.after) {
      where.push(
        `(a.requested_at, a.id) < (${p(q.after.at)}::timestamptz, ${p(q.after.id)}::uuid)`,
      );
    }
    const sqlText = `SELECT a.*, r.display_name AS requester_name, ap.display_name AS approver_name
        FROM approval_request a
        JOIN app_user r ON r.id = a.requested_by
        LEFT JOIN app_user ap ON ap.id = a.approver_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY a.requested_at DESC, a.id DESC
       LIMIT ${p(q.limit + 1)}`;
    const { rows } = await tx.query<
      ApprovalRow & { requester_name: string; approver_name: string | null }
    >(sqlText, params);
    let remainingMonthlyVnd: number | null = null;
    if (role) {
      const { tz, now } = await this.context(tx);
      const focLimits = await this.focLimits(tx);
      const limit = roleLimit(focLimits, role, null);
      if (limit.perMonth !== 'unlimited') {
        const used = await this.monthlyApprovedBy(tx, actor.userId, tz, now, budgetScope(role));
        remainingMonthlyVnd = remainingMonthly(limit, used);
      }
    }
    return { rows, remainingMonthlyVnd };
  }

  async toDto(
    tx: Tx,
    row: ApprovalRow & { requester_name?: string; approver_name?: string | null },
    remainingMonthlyVnd: number | null = null,
  ): Promise<ApprovalDto> {
    const { tz } = await this.context(tx);
    let requester = row.requester_name;
    let approver = row.approver_name;
    if (requester === undefined || (row.approver_id && approver === undefined)) {
      const names = await tx.query<{ id: string; display_name: string }>(
        `SELECT id, display_name FROM app_user WHERE id = ANY($1::uuid[])`,
        [[row.requested_by, row.approver_id].filter(Boolean)],
      );
      const byId = new Map(names.rows.map((n) => [n.id, n.display_name]));
      requester = byId.get(row.requested_by) ?? '';
      approver = row.approver_id ? (byId.get(row.approver_id) ?? null) : null;
    }
    return toApprovalDto(row, tz, requester ?? '', approver ?? null, remainingMonthlyVnd);
  }

  // ───────────────────────── helpers ─────────────────────────

  private async lockOpen(tx: Tx, approvalId: string): Promise<ApprovalRow> {
    const { rows } = await tx.query<ApprovalRow>(
      `SELECT * FROM approval_request WHERE id = $1 FOR UPDATE`,
      [approvalId],
    );
    const row = rows[0];
    if (!row) throw problem('NOT_FOUND');
    // Decided by someone else meanwhile (two approvers at once – the row lock serialises them).
    if (row.status !== 'pending' && row.status !== 'escalated') throw problem('INVALID_TRANSITION');
    return row;
  }

  /** BR-432 / K6: only owner/manager may decide their own request (within limits – checked after). */
  private assertNotSelf(row: ApprovalRow, actor: Actor, role: ApproverRole): void {
    // SEC F8 (BE-B, 0.3.6): nobody approves the refund they requested – no owner/manager exception.
    if (row.type === 'refund' && row.requested_by === actor.userId) {
      throw problem('SELF_APPROVAL_FORBIDDEN');
    }
    if (row.requested_by === actor.userId && role !== 'owner' && role !== 'manager') {
      throw problem('SELF_APPROVAL_FORBIDDEN');
    }
  }

  /**
   * Property time zone, clock instant and calendar date of this request – read once per transaction.
   * Calendar (not business) date on purpose: monthly limits follow the calendar month (BR-433).
   */
  context(tx: Tx): Promise<ApprovalContext> {
    const memo = this.memo(tx);
    memo.ctx ??= (async () => {
      const propertyId = tx.ctx.propertyId;
      if (!propertyId) throw new Error('approvals need a property context');
      const { rows } = await tx.query<{ timezone: string }>(
        'SELECT timezone FROM property WHERE id = $1',
        [propertyId],
      );
      const tz = rows[0]?.timezone;
      if (!tz) throw problem('NOT_FOUND');
      const now = this.clock.now();
      return { propertyId, tz, now, today: localDate(now, tz) };
    })();
    return memo.ctx;
  }

  private focLimits(tx: Tx): Promise<unknown> {
    const memo = this.memo(tx);
    memo.focLimits ??= this.context(tx).then((c) => this.params.get(tx, 'foc_limits', c.today));
    return memo.focLimits;
  }

  private memo(tx: Tx): { ctx?: Promise<ApprovalContext>; focLimits?: Promise<unknown> } {
    let m = this.perTx.get(tx);
    if (!m) {
      m = {};
      this.perTx.set(tx, m);
    }
    return m;
  }

  /**
   * Σ approved amounts of money-limited requests decided by `userId` in the current calendar month
   * (property time zone). Scope: 'others' = approved for other people, 'self' = own self-applications
   * (BR-436 budget), 'all' = both (owner/manager – one budget, FB-R2-ARC-BE-04).
   */
  async monthlyApprovedBy(
    tx: Tx,
    userId: string,
    tz: string,
    now: Date,
    scope: MonthlyScope,
  ): Promise<number> {
    const today = localDate(now, tz);
    const monthStart = `${today.slice(0, 7)}-01`;
    const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const { rows } = await tx.query<{ total: string | number | null }>(
      `SELECT COALESCE(SUM(amount_vnd), 0) AS total FROM approval_request
        WHERE approver_id = $1 AND status = 'approved' AND ($2::boolean IS NULL OR self_applied = $2)
          AND type = ANY($3::text[]) AND decided_at >= $4 AND decided_at < $5`,
      [
        userId,
        scope === 'all' ? null : scope === 'self',
        [...MONEY_LIMITED],
        atLocal(monthStart, '00:00', tz),
        atLocal(next, '00:00', tz),
      ],
    );
    return Number(rows[0]?.total ?? 0);
  }

  private async runHooks(tx: Tx, row: ApprovalRow): Promise<void> {
    for (const hook of this.hooks.get(row.type) ?? []) await hook(tx, row);
  }

  /** BR-432 v0.3 push (outbox, Mock adapter in R2): never the requester; no C2/C3 in the payload. */
  private async pushToApprovers(
    tx: Tx,
    row: ApprovalRow,
    requesterId: string,
    today: LocalDate,
  ): Promise<void> {
    const setting = await this.params.get<unknown>(tx, 'foc_approval_push_roles', today);
    const { rows: mgr } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM user_property_role upr JOIN app_user u ON u.id = upr.user_id
        WHERE upr.property_id = $1 AND upr.role = 'manager' AND upr.revoked_at IS NULL AND u.status = 'active'`,
      [row.property_id],
    );
    const roles = pushRoles(setting, row.required_role, (mgr[0]?.n ?? 0) > 0);
    const { rows: users } = await tx.query<{ user_id: string }>(
      `SELECT DISTINCT upr.user_id FROM user_property_role upr JOIN app_user u ON u.id = upr.user_id
        WHERE upr.property_id = $1 AND upr.role = ANY($2::text[]) AND upr.revoked_at IS NULL
          AND u.status = 'active' AND upr.user_id <> $3
        ORDER BY upr.user_id`,
      [row.property_id, roles, requesterId],
    );
    await this.outbox(tx, row, `approval_requested:${row.id}:${row.required_role}`, {
      kind: 'approval_requested',
      roles,
      userIds: users.map((u) => u.user_id),
    });
  }

  private async pushDecision(tx: Tx, row: ApprovalRow): Promise<void> {
    await this.outbox(tx, row, `approval_decided:${row.id}`, {
      kind: 'approval_decided',
      status: row.status,
      userIds: [row.requested_by],
    });
  }

  private async outbox(
    tx: Tx,
    row: ApprovalRow,
    dedupeKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'staff.push', $4, $5) ON CONFLICT (dedupe_key) DO NOTHING`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        row.property_id,
        JSON.stringify({
          ...payload,
          refType: 'approval_request',
          refId: row.id,
          ...(row.target_code ? { refCode: row.target_code } : {}),
        }),
        dedupeKey,
      ],
    );
  }
}

export function toApprovalDto(
  row: ApprovalRow,
  tz: string,
  requesterName: string,
  approverName: string | null,
  remainingMonthlyVnd: number | null,
): ApprovalDto {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    ...(row.target_code ? { reservationCode: row.target_code } : {}),
    ...(row.folio_line_id ? { folioLineId: row.folio_line_id } : {}),
    amountVnd: row.amount_vnd,
    reasonCode: row.reason_code,
    ...(row.reason_note ? { reasonNote: row.reason_note } : {}),
    requestedBy: requesterName,
    requestedAt: toZonedIso(row.requested_at, tz),
    requiredRole: row.required_role,
    ...(approverName ? { approverName } : {}),
    ...(row.approver_role_snapshot ? { approverRole: row.approver_role_snapshot } : {}),
    ...(row.decided_at ? { decidedAt: toZonedIso(row.decided_at, tz) } : {}),
    ...(row.decision_note ? { decisionNote: row.decision_note } : {}),
    ...(remainingMonthlyVnd !== null ? { approverRemainingMonthlyVnd: remainingMonthlyVnd } : {}),
    ...(row.target_type ? { targetType: row.target_type } : {}),
    ...(row.target_code ? { targetCode: row.target_code } : {}),
    selfApplied: row.self_applied,
    // A-33 (D15): masked destination of a refund request – never the full account number.
    ...(row.type === 'refund' && row.refund_method
      ? {
          refundDestination: {
            method: row.refund_method,
            ...(row.refund_bank_bin ? { bankBin: row.refund_bank_bin } : {}),
            ...(row.refund_account_last4 ? { accountNoLast4: row.refund_account_last4 } : {}),
            ...(row.refund_destination_set_at
              ? { setAt: toZonedIso(row.refund_destination_set_at, tz) }
              : {}),
          },
        }
      : {}),
    ...(row.type === 'refund' ? { refundedVnd: Number(row.refunded_vnd ?? 0) } : {}),
  };
}
