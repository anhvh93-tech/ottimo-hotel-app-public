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
import { Inject, Injectable, Optional } from '@nestjs/common';
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
import { EventsService } from '../../events/public/events.service';
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
/** BR-525: the FOC reason that writes a debt off after check-out (MGR+ only – folio `DEBT_WRITE_OFF`). */
const DEBT_WRITE_OFF_REASON = 'debt_write_off';

export const FOC_REASON_CODES = [
  'regular_vip',
  'room_ready_no_impact',
  'service_recovery',
  'long_stay_guest',
  'other',
  // ARC 16.27 (2), R7LOCK-02 (DOM 18/10, BR-525): writing a debt off after check-out – FolioFocService only
  // accepts it on a settled / closed folio with an open debt (OWN/MGR, `kind = foc`, note).
  'debt_write_off',
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
  /**
   * BR-416-07 (BUG-R2-153): never self-applied by the requester – another person decides it in the same
   * transaction (the approver who confirmed at the desk, `approve`).
   */
  noSelfApply?: boolean;
  /**
   * BR-433 (a)(b) v0.4.0 (R3 – FB-R2-SEC-BE-83, "chống chia nhỏ"): the amount the PER-TIME limit and the routing
   * are compared with – the cumulative Σ of the same write-off folio / FOC key (applied + still asked + this
   * request), computed by the caller under the folio lock. Absent → the request's own amount (every other type).
   * The monthly limit keeps counting the request's own amount.
   */
  perTimeAmountVnd?: number;
  requestId?: string;
}

/** BR-433 (a)(b): what the per-time limit is compared with (see `SubmitInput.perTimeAmountVnd`). */
function perTimeVnd(input: SubmitInput): number {
  return Math.max(input.amountVnd, input.perTimeAmountVnd ?? 0);
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
  // 0055 (OpenAPI 0.3.7 D1): FOC life of an approved foc / special_discount (BE-B S4-02 moves it).
  foc_state?: 'applied' | 'dormant' | 'suspended' | 'cancelled' | null;
  foc_cancel_reason?: string | null;
  line_change?: Record<string, unknown> | null;
  auto_cancel_reason?: string | null;
  /** 0077 (FB-R2-SEC-BE-80): the most a `debt_write_off` FOC applies, fixed when it was applied. */
  applied_cap_vnd?: number | string | null;
  // 0060 (BE-B S4-02): current service date of the FOC key (room / extra-person line).
  foc_service_date?: string | null;
}

/** 0.3.7 D1 FOC states (erd 4.6) – what the folio sync writes through setFocState(). */
export type FocState = 'applied' | 'dormant' | 'suspended' | 'cancelled';
export type FocCancelReason = 'night_removed' | 'reservation_cancelled' | 'settled_while_dormant';
export type AutoCancelReason =
  | 'line_removed'
  | 'reservation_cancelled'
  | 'reservation_no_show'
  | 'superseded'
  // 0.3.7 bổ sung 4 (migration 0063): B12 cancels the refund request the no-show created (S438-CANCEL-03).
  | 'no_show_restored'
  // 0077 (FB-R2-SEC-BE-80, BR-525): a `debt_write_off` FOC approved when no debt is left any more.
  | 'debt_cleared';

/** OpenAPI ApprovalRequest.lineChangedNote (BR-434 v0.3.5, S4-18). */
export interface LineChange {
  oldLineVnd: number;
  newLineVnd: number;
  fromServiceDate?: string;
  toServiceDate?: string;
  cause:
    | 'move'
    | 'postpone'
    | 'prior_night'
    | 'extend'
    | 'room_change'
    | 'early_departure'
    | 'los_reprice'
    | 'party_change'
    | 'checkout_time_change'
    | 'manual_adjust';
  /** ISO instant. */
  changedAt: string;
}

/**
 * What the folio module computes for a foc / special_discount request when it is shown (OpenAPI 0.3.7 D1):
 * `effectiveAmountVnd` (pending: "khi duyệt sẽ áp X"; approved: applied now; settled folio: really applied) and
 * the CURRENT FOC line of the request (it follows the re-posted line – ApprovalRequest.folioLineId).
 */
export interface FocView {
  effectiveAmountVnd: number;
  folioLineId: string | null;
}
export type FocViewProvider = (
  tx: Tx,
  rows: readonly ApprovalRow[],
) => Promise<ReadonlyMap<string, FocView>>;

/**
 * 0055 (erd 4.6): `foc_state` is set iff the request is an approved foc / special_discount (DB CHECK
 * approval_request_foc_state_scope_check). Approving writes `applied` – the meaning every approved FOC had
 * before 0.3.7; dormant / suspended / cancelled are BE-B's FOC sync (S4-02, S4-18, S4-22).
 */
const FOC_STATE_ON_APPROVE = `CASE WHEN type IN ('foc', 'special_discount') THEN 'applied' END`;

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
  // 0.3.7 D1 (BR-434 v0.3.5, BR-433, BR-315 (g); S4-02/S4-18/S4-22) – foc / special_discount only.
  effectiveAmountVnd?: number;
  focState?: FocState;
  focCancelReason?: FocCancelReason;
  lineChangedNote?: LineChange | null;
  autoCancelReason?: AutoCancelReason;
  /** 0.3.7 B-6: optimistic version (refund approve/reject send it back as expectedVersion). */
  version?: number;
}

export type DecidedHook = (tx: Tx, request: ApprovalRow) => Promise<void>;
/** Runs BEFORE the request row is locked by a decision (S4-13 lock order folio → approval_request). */
export type PreLockHook = (tx: Tx, approvalId: string) => Promise<void>;

const MONEY_CATEGORY = (type: ApprovalType) => (MONEY_TYPES.has(type) ? 'money' : 'state');

/**
 * Desk roles that pay out an approved cash refund (rbac A47a – FD+; OWN/MGR already see every request).
 * They see the refund pay-out queue in the listing (see `list`).
 */
const REFUND_PAYOUT_DESK_ROLES: ReadonlySet<string> = new Set(['front_desk', 'front_desk_lead']);

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
  private readonly preLocks = new Map<ApprovalType, PreLockHook[]>();
  /** Hooks registered without types (older form – they filter by type themselves); not counted as declared. */
  private readonly untypedPreLocks: PreLockHook[] = [];
  private focView: FocViewProvider | null = null;
  /** Per-transaction memo: time zone/today and foc_limits are read once per request (FB-R2-ARC-BE-06). */
  private readonly perTx = new WeakMap<
    Tx,
    { ctx?: Promise<ApprovalContext>; focLimits?: Promise<unknown> }
  >();

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(AuditService) private readonly audit: AuditService,
    /** Staff inbox rows of requests/decisions (ARC-BE-S3-23 – approvals is the ONE place that tells people). */
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /** Register a same-transaction hook for decisions of a request type (folio FOC line, refunds…). */
  onDecided(type: ApprovalType, hook: DecidedHook): void {
    this.hooks.set(type, [...(this.hooks.get(type) ?? []), hook]);
  }

  /**
   * S4-13 / ARC 16.19 bổ sung 4 (BUG-R2-198): the preLock of a request type – it locks what that type's
   * onDecided hook will change (booking L1, room L2, folio L3 – 16.19) BEFORE the request row (L4) is locked, on
   * every decision path (approve, reject, cancel, autoCancel, cancelSuperseded). Every type whose onDecided writes
   * outside the approvals module MUST declare one (`decisionHooks()` – checked by a test). Runs with no lock on
   * the request (its type is read plainly); a caller already holding those locks (B18) does not wait.
   */
  onBeforeDecide(types: ApprovalType | readonly ApprovalType[], hook: PreLockHook): void;
  /** @deprecated declare the types – an untyped hook runs for every type and is not counted by decisionHooks(). */
  onBeforeDecide(hook: PreLockHook): void;
  onBeforeDecide(
    types: ApprovalType | readonly ApprovalType[] | PreLockHook,
    hook?: PreLockHook,
  ): void {
    if (typeof types === 'function') {
      this.untypedPreLocks.push(types);
      return;
    }
    for (const type of typeof types === 'string' ? [types] : types) {
      this.preLocks.set(type, [...(this.preLocks.get(type) ?? []), hook as PreLockHook]);
    }
  }

  /** BUG-R2-198: every type with an onDecided hook and whether it declared its preLock (structural test). */
  decisionHooks(): Array<{ type: ApprovalType; preLock: boolean }> {
    return [...this.hooks.keys()].sort().map((type) => ({
      type,
      preLock: (this.preLocks.get(type)?.length ?? 0) > 0,
    }));
  }

  /** OpenAPI 0.3.7 D1: the folio module provides effectiveAmountVnd / the current FOC line (FocView). */
  provideFocView(provider: FocViewProvider): void {
    this.focView = provider;
  }

  private async preLock(tx: Tx, approvalId: string): Promise<void> {
    const { rows } = await tx.query<{ type: ApprovalType }>(
      'SELECT type FROM approval_request WHERE id = $1',
      [approvalId],
    );
    const type = rows[0]?.type;
    if (!type) return;
    for (const h of this.preLocks.get(type) ?? []) await h(tx, approvalId);
    for (const h of this.untypedPreLocks) await h(tx, approvalId);
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
    let requiredRole = requiredRoleFor(input.type, perTimeVnd(input), focLimits, basis);
    // FB-R2-ARC-BE-09: a lead's own request is decided above the lead level.
    if (
      approverRoleOf(actor.roles) === 'front_desk_lead' &&
      APPROVER_RANK[requiredRole] < APPROVER_RANK.manager
    ) {
      requiredRole = 'manager';
    }
    // BUG-R3-003 (fuzz R3-Q30, BR-525 / BR-433 (a)): a debt write-off is decided by MGR+ only – never routed to the
    // lead however small (a protected basis lowered below the lead's 300.000 sent it there): within the manager's
    // limit (Σ ≤ the folio's protected basis) → manager, else (or no night at all) → owner.
    if (
      input.reasonCode === DEBT_WRITE_OFF_REASON &&
      APPROVER_RANK[requiredRole] < APPROVER_RANK.manager
    ) {
      requiredRole = within(perTimeVnd(input), roleLimit(focLimits, 'manager', basis).perTime)
        ? 'manager'
        : 'owner';
    }

    // A2 – self-application within the requester's own limit (rbac 5.2 point 2). Serialised per user with
    // approve() (same advisory lock) so concurrent self-applications cannot both use the remainder.
    if (!input.noSelfApply && this.maySelfApply(actor, input))
      await this.lockLimit(tx, actor.userId);
    const self = input.noSelfApply
      ? null
      : await this.selfApplication(tx, actor, input, { focLimits, basis, tz, now, today });

    const id = uuidv7();
    const { rows } = await tx.query<ApprovalRow>(
      `INSERT INTO approval_request (id, organization_id, property_id, type, status, target_type, target_id,
         target_code, folio_line_id, amount_vnd, limit_basis_vnd, reason_code, reason_note, requested_by,
         requested_at, required_role, approver_id, approver_role_snapshot, approver_limit_snapshot,
         self_applied, decided_at, auth_method, foc_state, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
         $21, $22, CASE WHEN $5::text = 'approved' AND $4::text IN ('foc', 'special_discount') THEN 'applied' END,
         $15, $14, $15)
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
        ...(input.perTimeAmountVnd !== undefined ? { cumulativeVnd: perTimeVnd(input) } : {}),
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
      if (!within(perTimeVnd(input), limit.perTime)) return null;
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
    if (perTimeVnd(input) > perTime) return null;
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
    input: {
      authMethod: 'password' | 'pin';
      note: string | null;
      requestId?: string;
      /** 0.3.7 B-6: required for a `refund` (what the approver saw – destination, amount, state). */
      expectedVersion?: number;
    },
  ): Promise<{ row: ApprovalRow } | { escalatedTo: ApproverRole; row: ApprovalRow }> {
    await this.preLock(tx, approvalId);
    const row = await this.lockOpen(tx, approvalId);
    assertExpectedVersion(row, input.expectedVersion);
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
          foc_state = ${FOC_STATE_ON_APPROVE}, updated_at = $6, version = version + 1
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
    // FB-R2-SEC-BE-80: a hook may have capped the request (`applied_cap_vnd`) or cancelled it (`debt_cleared`) –
    // the answer is the request as it is now; a cancelled one was told to its requester by cancelApproved.
    const { rows: now2 } = await tx.query<ApprovalRow>(
      'SELECT * FROM approval_request WHERE id = $1',
      [row.id],
    );
    const final = (now2[0] ?? approved) as ApprovalRow;
    if (final.status === 'approved') await this.pushDecision(tx, final);
    return { row: final };
  }

  /**
   * FB-R2-SEC-BE-80 (BR-525): the money of an approved `debt_write_off` FOC is applied only up to the open debt at
   * that moment (the owner of the folio – FolioFocService – decides in its onDecided hook, under L1 → L3):
   * - `setAppliedCap`: the most it applies, now and at every later re-sync (`applied_cap_vnd`, SM-10 keeps
   *   `amount_vnd`); money audit `approval.applied_capped` when it is less than asked (reason code
   *   `debt_collected_before_approval`);
   * - `cancelApproved`: no debt left → the request is cancelled by the system (`debt_cleared`), nothing applied,
   *   the requester and the approvers asked are told (`approval_cancelled`), the approver's limit is not used.
   */
  async setAppliedCap(
    tx: Tx,
    approvalId: string,
    capVnd: number,
    ctx: { openDebtVnd: number; requestId?: string },
  ): Promise<void> {
    const { rows } = await tx.query<ApprovalRow>(
      `UPDATE approval_request SET applied_cap_vnd = $2 WHERE id = $1 AND type = 'foc' RETURNING *`,
      [approvalId, capVnd],
    );
    const row = rows[0];
    if (!row || capVnd >= Number(row.amount_vnd)) return;
    // The money log of the Desk reads `money` only (FE-A); the reason is a CODE the Desk looks up.
    await this.audit.record(tx, {
      category: MONEY_CATEGORY(row.type),
      action: 'approval.applied_capped',
      entityType: 'approval_request',
      entityId: row.id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      before: { amountVnd: Number(row.amount_vnd) },
      after: { appliedVnd: capVnd, openDebtVnd: ctx.openDebtVnd, reasonCode: row.reason_code },
      reason: 'debt_collected_before_approval',
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
  }

  async cancelApproved(
    tx: Tx,
    approvalId: string,
    reason: Extract<AutoCancelReason, 'debt_cleared'>,
    requestId?: string,
  ): Promise<ApprovalRow | null> {
    const { now } = await this.context(tx);
    const { rows } = await tx.query<ApprovalRow>(
      `UPDATE approval_request SET status = 'cancelled', auto_cancel_reason = $2, foc_state = NULL,
          foc_cancel_reason = NULL, decision_note = $3, updated_at = $4, version = version + 1
        WHERE id = $1 AND status = 'approved' RETURNING *`,
      [approvalId, reason, `auto: ${reason}`, now],
    );
    const cancelled = rows[0];
    if (!cancelled) return null;
    await this.audit.record(tx, {
      category: MONEY_CATEGORY(cancelled.type),
      action: 'approval.cancelled',
      entityType: 'approval_request',
      entityId: cancelled.id,
      ...(cancelled.target_code ? { entityCode: cancelled.target_code } : {}),
      before: { status: 'approved' },
      after: { status: 'cancelled', type: cancelled.type, amountVnd: cancelled.amount_vnd },
      reason: `auto: ${reason}`,
      ...(requestId ? { requestId } : {}),
    });
    const { rows: asked } = await tx.query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM staff_notification
        WHERE kind = 'approval_requested' AND ref_type = 'approval_request' AND ref_id = $1`,
      [cancelled.id],
    );
    const userIds = [...new Set([cancelled.requested_by, ...asked.map((a) => a.user_id)])];
    await this.outbox(tx, cancelled, `approval_cancelled:${cancelled.id}`, {
      kind: 'approval_cancelled',
      reason,
      userIds,
    });
    if (this.events) {
      await this.events.notify(
        tx,
        {
          kind: 'approval_cancelled',
          userIds,
          refType: 'approval_request',
          refId: cancelled.id,
          ...(cancelled.target_code ? { refCode: cancelled.target_code } : {}),
        },
        now,
        { push: false },
      );
    }
    return cancelled;
  }

  // ───────────────────────── A5 / A6 ─────────────────────────

  async reject(
    tx: Tx,
    actor: Actor,
    approvalId: string,
    input: {
      authMethod: 'password' | 'pin';
      reason: string;
      requestId?: string;
      /** 0.3.7 B-6: required for a `refund`. */
      expectedVersion?: number;
    },
  ): Promise<ApprovalRow> {
    await this.preLock(tx, approvalId);
    const row = await this.lockOpen(tx, approvalId);
    assertExpectedVersion(row, input.expectedVersion);
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

  /**
   * ARC-BE-S3-15 d (BE-B refunds): an `approved` request goes back to `pending` because what was approved
   * changed (refund destination changed after approval – SEC F8). Decision fields are cleared (the monthly
   * budget no longer counts it), audited, approvers pushed again. Only through this service (SM-10).
   */
  async reopenForRedecision(
    tx: Tx,
    approvalId: string,
    input: { reason: string; byUserId: string; requestId?: string },
  ): Promise<ApprovalRow> {
    const { rows: cur } = await tx.query<ApprovalRow>(
      'SELECT * FROM approval_request WHERE id = $1 FOR UPDATE',
      [approvalId],
    );
    const row = cur[0];
    if (!row) throw problem('NOT_FOUND');
    if (row.status !== 'approved') return row;
    const { today, now } = await this.context(tx);
    const { rows } = await tx.query<ApprovalRow>(
      `UPDATE approval_request SET status = 'pending', approver_id = NULL, approver_role_snapshot = NULL,
          approver_limit_snapshot = NULL, auth_method = NULL, decided_at = NULL, decision_note = NULL,
          foc_state = NULL, foc_cancel_reason = NULL, updated_at = $2, version = version + 1
        WHERE id = $1 RETURNING *`,
      [approvalId, now],
    );
    const reopened = rows[0] as ApprovalRow;
    await this.audit.record(tx, {
      category: MONEY_CATEGORY(row.type),
      action: 'approval.reopened',
      entityType: 'approval_request',
      entityId: row.id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      before: { status: 'approved' },
      after: { status: 'pending', type: row.type, amountVnd: row.amount_vnd },
      reason: input.reason,
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    await this.pushToApprovers(tx, reopened, row.requested_by, today);
    return reopened;
  }

  /** ARC-BE-S3-15 d: amount paid out on a `refund` request (negative = a pay-out reversed). */
  async addRefunded(tx: Tx, approvalId: string, deltaVnd: number): Promise<void> {
    if (!Number.isSafeInteger(deltaVnd)) throw new RangeError('refund delta must be an integer');
    const { now } = await this.context(tx);
    await tx.query(
      `UPDATE approval_request SET refunded_vnd = refunded_vnd + $2, updated_at = $3, version = version + 1
        WHERE id = $1 AND type = 'refund'`,
      [approvalId, deltaVnd, now],
    );
  }

  // ───────────────────────── FOC life (0.3.7 D1 – BE-B folio sync S4-02/S4-18/S4-22) ─────────────────────────

  /**
   * BR-434 / BR-433 / BR-315 (g): the folio sync moves an APPROVED foc / special_discount between applied,
   * dormant, suspended and cancelled (erd 4.6 CHECKs: cancel reason ⇔ cancelled). The audit `folio.foc_*` is
   * written by the caller (it knows the amounts and the stay). No-op when nothing changes.
   */
  async setFocState(
    tx: Tx,
    approvalId: string,
    next: { focState: FocState; focCancelReason?: FocCancelReason | null },
  ): Promise<void> {
    const { now } = await this.context(tx);
    await tx.query(
      `UPDATE approval_request SET foc_state = $2, foc_cancel_reason = $3, updated_at = $4, version = version + 1
        WHERE id = $1 AND type IN ('foc', 'special_discount') AND status = 'approved'
          AND (foc_state IS DISTINCT FROM $2 OR foc_cancel_reason IS DISTINCT FROM $3)`,
      [
        approvalId,
        next.focState,
        next.focState === 'cancelled' ? (next.focCancelReason ?? null) : null,
        now,
      ],
    );
  }

  /** 0060: the key of a request on a room / extra-person line moves to another date (BR-434 (2)). */
  async setFocKeyDate(tx: Tx, approvalId: string, serviceDate: string): Promise<void> {
    await tx.query(
      `UPDATE approval_request SET foc_service_date = $2
        WHERE id = $1 AND type IN ('foc', 'special_discount')
          AND foc_service_date IS DISTINCT FROM $2::date`,
      [approvalId, serviceDate],
    );
  }

  /** S4-18: the line of a PENDING request was re-written – "Dòng đã đổi: old → new, khi duyệt sẽ áp X". */
  async setLineChange(tx: Tx, approvalId: string, change: LineChange): Promise<void> {
    const { now } = await this.context(tx);
    await tx.query(
      `UPDATE approval_request SET line_change = $2, updated_at = $3, version = version + 1
        WHERE id = $1 AND type IN ('foc', 'special_discount') AND status IN ('pending', 'escalated')`,
      [approvalId, JSON.stringify(change), now],
    );
  }

  /**
   * BR-434 (S4-18) / BR-315 (g): the server cancels a PENDING foc / special_discount by itself – no line left
   * (night dropped without a counterpart), booking cancelled, booking no-show. `cancelled` (never `rejected`),
   * audit `approval.cancelled`, hooks (the FOC line → rejected), the requester and everyone who was asked to
   * decide get `approval_cancelled`; nothing counts against a monthly limit. Returns null when the request was
   * no longer open.
   */
  async autoCancel(
    tx: Tx,
    approvalId: string,
    reason: AutoCancelReason,
    requestId?: string,
  ): Promise<ApprovalRow | null> {
    await this.preLock(tx, approvalId); // 16.19 bổ sung 4: L1–L3 of the hook before L4
    const { rows: cur } = await tx.query<ApprovalRow>(
      `SELECT * FROM approval_request WHERE id = $1 FOR UPDATE`,
      [approvalId],
    );
    const row = cur[0];
    if (!row || (row.status !== 'pending' && row.status !== 'escalated')) return null;
    const { now } = await this.context(tx);
    const { rows } = await tx.query<ApprovalRow>(
      `UPDATE approval_request SET status = 'cancelled', auto_cancel_reason = $2, decision_note = $3,
          updated_at = $4, version = version + 1
        WHERE id = $1 RETURNING *`,
      [row.id, reason, `auto: ${reason}`, now],
    );
    const cancelled = rows[0] as ApprovalRow;
    await this.audit.record(tx, {
      category: MONEY_CATEGORY(row.type),
      action: 'approval.cancelled',
      entityType: 'approval_request',
      entityId: row.id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      before: { status: row.status },
      after: { status: 'cancelled', type: row.type, amountVnd: row.amount_vnd },
      reason: `auto: ${reason}`,
      ...(requestId ? { requestId } : {}),
    });
    await this.runHooks(tx, cancelled);
    // The requester + every account that was asked to decide (approval_requested inbox rows).
    const { rows: asked } = await tx.query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM staff_notification
        WHERE kind = 'approval_requested' AND ref_type = 'approval_request' AND ref_id = $1`,
      [row.id],
    );
    const userIds = [...new Set([row.requested_by, ...asked.map((a) => a.user_id)])];
    await this.outbox(tx, cancelled, `approval_cancelled:${row.id}`, {
      kind: 'approval_cancelled',
      reason,
      userIds,
    });
    if (this.events) {
      await this.events.notify(
        tx,
        {
          kind: 'approval_cancelled',
          userIds,
          refType: 'approval_request',
          refId: row.id,
          ...(row.target_code ? { refCode: row.target_code } : {}),
        },
        now,
        { push: false },
      );
    }
    return cancelled;
  }

  /** A6: only the requester (x-scope own → someone else's id is 404), only while `pending`. */
  async cancel(tx: Tx, actor: Actor, approvalId: string, requestId?: string): Promise<ApprovalRow> {
    await this.preLock(tx, approvalId);
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

  /**
   * DOM S3-10 (FB-R2-DOM-BE-20): open OPERATIONAL requests that lost their purpose (check-in done another way,
   * guest checked out / extended) are cancelled by the system with the reason `superseded` – SM-10 through
   * this service only (audit + hooks + the requester is told). Returns the cancelled rows.
   */
  async cancelSuperseded(
    tx: Tx,
    input: {
      targetType: string;
      targetId: string;
      types: readonly ApprovalType[];
      reason: string;
      requestId?: string;
    },
  ): Promise<ApprovalRow[]> {
    // 16.19 bổ sung 4: the preLock of each open request first (B18 holds L1/L3 already – no wait), then L4.
    const { rows: ids } = await tx.query<{ id: string }>(
      `SELECT id FROM approval_request
        WHERE target_type = $1 AND target_id = $2 AND type = ANY($3::text[])
          AND status IN ('pending', 'escalated')
        ORDER BY requested_at, id`,
      [input.targetType, input.targetId, [...input.types]],
    );
    for (const r of ids) await this.preLock(tx, r.id);
    const { rows: open } = await tx.query<ApprovalRow>(
      `SELECT * FROM approval_request
        WHERE target_type = $1 AND target_id = $2 AND type = ANY($3::text[])
          AND status IN ('pending', 'escalated')
        ORDER BY requested_at FOR UPDATE`,
      [input.targetType, input.targetId, [...input.types]],
    );
    if (open.length === 0) return [];
    const { now } = await this.context(tx);
    const out: ApprovalRow[] = [];
    for (const row of open) {
      const { rows } = await tx.query<ApprovalRow>(
        `UPDATE approval_request SET status = 'cancelled', decision_note = $3, updated_at = $2,
            version = version + 1
          WHERE id = $1 RETURNING *`,
        [row.id, now, `superseded: ${input.reason}`.slice(0, 500)],
      );
      const cancelled = rows[0] as ApprovalRow;
      await this.audit.record(tx, {
        category: MONEY_CATEGORY(row.type),
        // Money audit set is closed (AuditEvent.action): a superseded request is an `approval.cancelled`.
        action: 'approval.cancelled',
        entityType: 'approval_request',
        entityId: row.id,
        ...(row.target_code ? { entityCode: row.target_code } : {}),
        before: { status: row.status },
        after: { status: 'cancelled', type: row.type },
        reason: input.reason,
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
      await this.runHooks(tx, cancelled);
      await this.pushDecision(tx, cancelled);
      out.push(cancelled);
    }
    return out;
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
   *
   * Refund pay-out queue (UXR #4, QC-S3-08; BR-522 a/b, rbac A47a, EP03-05 2.6.3): FD and FDL pay out an
   * APPROVED cash refund someone else asked for, so they also see every `refund` that is `approved` and not
   * fully paid yet – whoever requested or approved it. Transfer refunds are in the queue too (masked
   * destination only, D15): the desk tells the guest it waits for MGR/OWN (`refund.transfer_waits_manager`);
   * paying one stays MGR/OWN (A47, executeRefund role gate). Pending refunds of others stay out of the FD/FDL
   * view (they are decided by MGR/OWN – S23 inbox unchanged); a fully paid refund leaves the queue.
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
    const payoutQueue = actor.roles.some((r) => REFUND_PAYOUT_DESK_ROLES.has(r))
      ? ` OR (a.type = 'refund' AND a.status = 'approved' AND a.refunded_vnd < a.amount_vnd)`
      : '';
    if (role === 'front_desk_lead') {
      const me = p(actor.userId);
      where.push(
        `(a.requested_by = ${me} OR a.approver_id = ${me} OR a.required_role = 'front_desk_lead'${payoutQueue})`,
      );
    } else if (role !== 'owner' && role !== 'manager') {
      where.push(`(a.requested_by = ${p(actor.userId)}${payoutQueue})`);
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
    const views = await this.focViews(tx, [row]);
    return toApprovalDto(
      row,
      tz,
      requester ?? '',
      approver ?? null,
      remainingMonthlyVnd,
      views.get(row.id),
    );
  }

  /** FocView of the foc / special_discount rows (one folio computation per folio – list pages). */
  async focViews(tx: Tx, rows: readonly ApprovalRow[]): Promise<ReadonlyMap<string, FocView>> {
    const foc = rows.filter((r) => r.type === 'foc' || r.type === 'special_discount');
    if (!this.focView || foc.length === 0) return new Map();
    return this.focView(tx, foc);
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
    // SEC-BE-37 (BE-B, review S3): whoever set the refund destination does not approve it (CHECK 0031/0042).
    // PO 17/10: except an OWN (role at the time of the action) on a transfer refund – OWN may route, approve and
    // pay the same refund; cash refunds (A47a) keep the rule for everyone.
    const refund = row as ApprovalRow & {
      refund_destination_set_by?: string | null;
      refund_method?: string | null;
    };
    const setBy = refund.refund_destination_set_by;
    const ownerTransfer =
      role === 'owner' && !!refund.refund_method && refund.refund_method !== 'cash';
    if (row.type === 'refund' && setBy && setBy === actor.userId && !ownerTransfer) {
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
    // BR-433 v0.3.5/v0.3.6 (S4-18): a foc / special_discount counts while it is ALIVE – applied or dormant in a
    // stay not settled yet (its approved amount); once the folio is settled, what it really applied (S4-23 split
    // by approval order). Suspended (no-show), cancelled by rule, pending, rejected, auto-cancelled: nothing.
    const { rows } = await tx.query<{ total: string | number | null }>(
      `SELECT COALESCE(SUM(
           CASE WHEN a.type NOT IN ('foc', 'special_discount') THEN a.amount_vnd
                WHEN a.foc_state IS NULL OR a.foc_state NOT IN ('applied', 'dormant') THEN 0
                WHEN f.status IS NOT NULL AND f.status <> 'open' THEN COALESCE((
                  SELECT -SUM(l.amount_vnd) FROM folio_line l
                   WHERE (l.approval_request_id = a.id OR l.id = a.folio_line_id)
                     AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
                     AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)), 0)
                ELSE a.amount_vnd END), 0) AS total
         FROM approval_request a
         LEFT JOIN folio_line o ON o.id = a.folio_line_id AND a.type IN ('foc', 'special_discount')
         LEFT JOIN folio f ON f.id = o.folio_id
        WHERE a.approver_id = $1 AND a.status = 'approved' AND ($2::boolean IS NULL OR a.self_applied = $2)
          AND a.type = ANY($3::text[]) AND a.decided_at >= $4 AND a.decided_at < $5`,
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
    await this.inbox(
      tx,
      row,
      'approval_requested',
      users.map((u) => u.user_id),
    );
  }

  /** Inbox rows + `notification.created` (no second push – the outbox row above is the push). */
  private async inbox(
    tx: Tx,
    row: ApprovalRow,
    kind: 'approval_requested' | 'approval_decided',
    userIds: readonly string[],
  ): Promise<void> {
    if (!this.events || userIds.length === 0) return;
    const { now } = await this.context(tx);
    await this.events.notify(
      tx,
      {
        kind,
        userIds,
        refType: 'approval_request',
        refId: row.id,
        ...(row.target_code ? { refCode: row.target_code } : {}),
      },
      now,
      { push: false },
    );
  }

  private async pushDecision(tx: Tx, row: ApprovalRow): Promise<void> {
    await this.outbox(tx, row, `approval_decided:${row.id}`, {
      kind: 'approval_decided',
      status: row.status,
      userIds: [row.requested_by],
    });
    await this.inbox(tx, row, 'approval_decided', [row.requested_by]);
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

/**
 * 0.3.7 B-6 (CỔNG – BE-B + FE-A one PR): a `refund` is decided on the version the approver saw – missing → 422
 * REQUIRED, another version (destination changed / reopened meanwhile – SEC F8) → 412 VERSION_CONFLICT with
 * `currentVersion`, nothing written. Other types: optional, checked when given.
 */
export function assertExpectedVersion(row: ApprovalRow, expected: number | undefined): void {
  if (expected === undefined) {
    if (row.type === 'refund') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'expectedVersion', code: 'REQUIRED' }],
      });
    }
    return;
  }
  if (expected !== row.version) {
    throw problem('VERSION_CONFLICT', { extras: { currentVersion: row.version } });
  }
}

export function toApprovalDto(
  row: ApprovalRow,
  tz: string,
  requesterName: string,
  approverName: string | null,
  remainingMonthlyVnd: number | null,
  focView?: FocView,
): ApprovalDto {
  const focType = row.type === 'foc' || row.type === 'special_discount';
  // 0.3.7 D1: the CURRENT FOC line of the request (follows the re-posted line); before the folio module answers,
  // the line it was made with.
  const lineId = focView?.folioLineId ?? row.folio_line_id;
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    ...(row.target_code ? { reservationCode: row.target_code } : {}),
    ...(lineId ? { folioLineId: lineId } : {}),
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
    // 0.3.7 D1 FOC life (BR-434 v0.3.5): only foc / special_discount.
    ...(focType && focView ? { effectiveAmountVnd: focView.effectiveAmountVnd } : {}),
    ...(focType && row.status === 'approved' && row.foc_state ? { focState: row.foc_state } : {}),
    ...(focType && row.foc_state === 'cancelled' && row.foc_cancel_reason
      ? { focCancelReason: row.foc_cancel_reason as FocCancelReason }
      : {}),
    ...(focType
      ? { lineChangedNote: (row.line_change as LineChange | null | undefined) ?? null }
      : {}),
    ...(row.status === 'cancelled' && row.auto_cancel_reason
      ? { autoCancelReason: row.auto_cancel_reason as AutoCancelReason }
      : {}),
    version: row.version,
  };
}
