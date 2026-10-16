/**
 * Approval limits (BR-433, BR-436, rbac 5.1–5.2, SM-10 A2–A4) – pure functions, no I/O.
 * Every number comes from parameters (`foc_limits`, `foc_self_apply.front_desk.*`), never from code.
 *
 * `foc_limits` (DS-E, INV-007):
 *   { front_desk_lead: { perTimeVnd, perMonthVnd }, manager: { perTime: "one_night_rate" }, owner: { perTime: "unlimited" } }
 * Also accepted per role: numeric `perTimeVnd` / `perMonthVnd`, `perTime: "unlimited"`, `perMonth: "unlimited"`.
 * "one_night_rate" uses the request's `limit_basis_vnd` snapshot (the night rate of the stay, BR-433); when
 * the caller could not give one the manager limit is unknown → treated as exceeded (goes to the owner).
 */
import type { ApprovalType, ApproverRole } from '../../../db/schema';

export const APPROVER_RANK: Record<ApproverRole, number> = {
  front_desk_lead: 1,
  manager: 2,
  owner: 3,
};
const LADDER: ApproverRole[] = ['front_desk_lead', 'manager', 'owner'];

/** Types whose approval is limited by an amount (BR-433); the others only by role (rbac 5.1). */
export const MONEY_LIMITED: ReadonlySet<ApprovalType> = new Set([
  'foc',
  'special_discount',
  'refund',
]);

/** Lowest role that may decide a request type (rbac 5.1). */
export function minRoleFor(type: ApprovalType): ApproverRole {
  return type === 'foc' || type === 'checkin_room_not_ready' ? 'front_desk_lead' : 'manager';
}

export type Amount = number | 'unlimited';

export interface RoleLimit {
  /** null = unknown (one_night_rate without a basis) → never sufficient. */
  perTime: Amount | null;
  perMonth: Amount;
}

type RawRoleLimit = {
  perTimeVnd?: unknown;
  perMonthVnd?: unknown;
  perTime?: unknown;
  perMonth?: unknown;
};

function amount(v: unknown): Amount | undefined {
  if (v === 'unlimited') return 'unlimited';
  if (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) return v;
  return undefined;
}

/** Limit of one approver role from the `foc_limits` parameter value. Missing role → no authority. */
export function roleLimit(
  focLimits: unknown,
  role: ApproverRole,
  limitBasisVnd: number | null,
): RoleLimit {
  const raw = (focLimits as Record<string, RawRoleLimit> | null)?.[role];
  if (!raw)
    return role === 'owner'
      ? { perTime: 'unlimited', perMonth: 'unlimited' }
      : { perTime: 0, perMonth: 0 };
  let perTime: Amount | null = amount(raw.perTimeVnd) ?? amount(raw.perTime) ?? null;
  if (raw.perTime === 'one_night_rate') perTime = limitBasisVnd;
  const perMonth = amount(raw.perMonthVnd) ?? amount(raw.perMonth) ?? 'unlimited';
  return { perTime, perMonth };
}

export function within(value: number, limit: Amount | null): boolean {
  if (limit === null) return false;
  return limit === 'unlimited' || value <= limit;
}

/** Highest approver role among the caller's roles (owner > manager > front_desk_lead), or null. */
export function approverRoleOf(roles: readonly string[]): ApproverRole | null {
  for (const r of [...LADDER].reverse()) if (roles.includes(r)) return r;
  return null;
}

/** Lowest role whose per-time limit covers the request (A1: routing; BR-432 "vai thấp nhất đủ hạn mức"). */
export function requiredRoleFor(
  type: ApprovalType,
  amountVnd: number,
  focLimits: unknown,
  limitBasisVnd: number | null,
): ApproverRole {
  const start = LADDER.indexOf(minRoleFor(type));
  for (const role of LADDER.slice(start)) {
    if (!MONEY_LIMITED.has(type)) return role;
    if (within(amountVnd, roleLimit(focLimits, role, limitBasisVnd).perTime)) return role;
  }
  return 'owner';
}

export type Decision =
  { ok: true; limit: RoleLimit } | { ok: false; escalateTo: ApproverRole; limit: RoleLimit | null };

/**
 * Can `approverRole` approve this request now (A3), given what that approver already approved for others
 * this calendar month? If not, the request escalates to the next sufficient role above the approver (A4).
 */
export function decide(input: {
  type: ApprovalType;
  amountVnd: number;
  requiredRole: ApproverRole;
  approverRole: ApproverRole;
  focLimits: unknown;
  limitBasisVnd: number | null;
  monthlyUsedVnd: number;
}): Decision {
  const rank = APPROVER_RANK[input.approverRole];
  const above = (): ApproverRole => {
    const needed = requiredRoleFor(
      input.type,
      input.amountVnd,
      input.focLimits,
      input.limitBasisVnd,
    );
    const next = LADDER.find((r) => APPROVER_RANK[r] > rank) ?? 'owner';
    return APPROVER_RANK[needed] > APPROVER_RANK[next] ? needed : next;
  };
  if (rank < APPROVER_RANK[minRoleFor(input.type)] || rank < APPROVER_RANK[input.requiredRole]) {
    // The request is routed above this approver: no decision possible at this level.
    const target = APPROVER_RANK[input.requiredRole] > rank ? input.requiredRole : above();
    return { ok: false, escalateTo: target, limit: null };
  }
  if (!MONEY_LIMITED.has(input.type)) {
    return { ok: true, limit: { perTime: 'unlimited', perMonth: 'unlimited' } };
  }
  const limit = roleLimit(input.focLimits, input.approverRole, input.limitBasisVnd);
  const perMonthOk =
    limit.perMonth === 'unlimited' || input.monthlyUsedVnd + input.amountVnd <= limit.perMonth;
  if (within(input.amountVnd, limit.perTime) && perMonthOk) return { ok: true, limit };
  if (input.approverRole === 'owner') return { ok: true, limit }; // owner: no limit above (BR-433)
  return { ok: false, escalateTo: above(), limit };
}

/** Remaining monthly amount for the viewer (ApprovalRequest.approverRemainingMonthlyVnd); null = unlimited. */
export function remainingMonthly(limit: RoleLimit, usedVnd: number): number | null {
  if (limit.perMonth === 'unlimited') return null;
  return Math.max(0, limit.perMonth - usedVnd);
}

/**
 * BR-432 v0.3 push targets (`foc_approval_push_roles` = "lowest_sufficient_role_plus_manager"): the lowest
 * sufficient role and the manager; the owner only when the request needs the owner or the property has no
 * active manager. A parameter value that is a role list is used as is.
 */
export function pushRoles(
  setting: unknown,
  requiredRole: ApproverRole,
  hasActiveManager: boolean,
): ApproverRole[] {
  if (Array.isArray(setting)) {
    return setting.filter((r): r is ApproverRole => LADDER.includes(r as ApproverRole));
  }
  const roles = new Set<ApproverRole>([requiredRole]);
  if (hasActiveManager) roles.add('manager');
  if (requiredRole === 'owner' || !hasActiveManager) roles.add('owner');
  if (requiredRole === 'manager' && !hasActiveManager) roles.add('owner');
  return LADDER.filter((r) => roles.has(r));
}
