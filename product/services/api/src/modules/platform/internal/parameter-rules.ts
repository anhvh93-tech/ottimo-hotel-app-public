/**
 * erd 9.1a "Khóa dạng khác" – structured keys and cross-key rules checked by the setParameter use case
 * (ParameterService.validate already covers type, SEC hard bounds and the scalar min–max/allowed bounds).
 * Every violation → 422 PARAM_OUT_OF_RANGE (with min/max or allowed when meaningful), like the scalar case.
 *
 * Covered in Sprint 1: rate floor/ceiling cross rule, time cross rules, weekend_nights, hold_hours_options
 * ↔ hold_hours_default (BR-302 – the default must be one of the options, BUG-R2-007), min_stay,
 * session_policy / login_lockout cross rule (their bounds are SEC hard bounds – x-security-parameters
 * 0.3.4, checked by ParameterService.validate), foc_limits, foc_self_apply.front_desk.*,
 * foc_approval_push_roles (used by approvals since Sprint 1 – FB-R2-ARC-BE-10).
 * TODO(BE-B Sprint 2): tier lists (early_checkin_tiers, late_checkout_tiers, long_stay_cleaning_window,
 * front_desk_hours), %-by-step lists (los_discount, cancel_policy_direct, …, commission_payout Σ = 100),
 * wo_sla, other text enums.
 */
import { problem } from '../../../shared/problem';

export type OtherValue = (key: string) => Promise<unknown>;

const outOfRange = (extras: Record<string, unknown> = {}): never => {
  throw problem('PARAM_OUT_OF_RANGE', {
    errors: [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }],
    extras,
  });
};

const isInt = (v: unknown): v is number => Number.isSafeInteger(v);

/** erd 9.1b: every FOC amount 0–100.000.000 VND. */
export const FOC_MAX_VND = 100_000_000;
const APPROVER_ROLES = ['front_desk_lead', 'manager', 'owner'] as const;
/** BR-432 v0.3 named setting; a list of approver roles is also accepted (approvals/limits.ts pushRoles). */
export const FOC_PUSH_SETTINGS = ['lowest_sufficient_role_plus_manager'] as const;

const isVnd = (v: unknown): v is number => isInt(v) && v >= 0 && v <= FOC_MAX_VND;

/**
 * One role of foc_limits (shape read by approvals/limits.ts roleLimit): perTimeVnd (VND) or perTime
 * ("unlimited" | "one_night_rate"); perMonthVnd (VND) or perMonth ("unlimited"); nothing else.
 * Returns the per-time amount in VND when numeric (for the FDL ≤ manager rule), null otherwise.
 */
function focRole(raw: unknown): {
  ok: boolean;
  perTimeVnd: number | null;
  perMonthVnd: number | null;
} {
  const bad = { ok: false, perTimeVnd: null, perMonthVnd: null };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return bad;
  const r = raw as Record<string, unknown>;
  const allowedKeys = ['perTimeVnd', 'perTime', 'perMonthVnd', 'perMonth'];
  if (Object.keys(r).some((k) => !allowedKeys.includes(k))) return bad;
  if ((r.perTimeVnd !== undefined) === (r.perTime !== undefined)) return bad; // exactly one
  if (r.perTimeVnd !== undefined && !isVnd(r.perTimeVnd)) return bad;
  if (r.perTime !== undefined && r.perTime !== 'unlimited' && r.perTime !== 'one_night_rate')
    return bad;
  if (r.perMonthVnd !== undefined && r.perMonth !== undefined) return bad;
  if (r.perMonthVnd !== undefined && !isVnd(r.perMonthVnd)) return bad;
  if (r.perMonth !== undefined && r.perMonth !== 'unlimited') return bad;
  return {
    ok: true,
    perTimeVnd: typeof r.perTimeVnd === 'number' ? r.perTimeVnd : null,
    perMonthVnd: typeof r.perMonthVnd === 'number' ? r.perMonthVnd : null,
  };
}

function checkFocLimits(value: unknown): void {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    outOfRange({ min: 0, max: FOC_MAX_VND });
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some((k) => !(APPROVER_ROLES as readonly string[]).includes(k))) {
    outOfRange({ allowed: [...APPROVER_ROLES] });
  }
  // Every approver level must be configured: a missing role silently routes every FOC to the owner.
  if (APPROVER_ROLES.some((role) => v[role] === undefined))
    outOfRange({ allowed: [...APPROVER_ROLES] });
  const roles = Object.fromEntries(APPROVER_ROLES.map((role) => [role, focRole(v[role])]));
  if (Object.values(roles).some((r) => !r.ok)) outOfRange({ min: 0, max: FOC_MAX_VND });
  // BR-433: the front-desk lead never gets more than the manager.
  const fdl = roles.front_desk_lead;
  const mgr = roles.manager;
  if (fdl && mgr) {
    if (fdl.perTimeVnd !== null && mgr.perTimeVnd !== null && fdl.perTimeVnd > mgr.perTimeVnd) {
      outOfRange({ max: mgr.perTimeVnd });
    }
    if (fdl.perMonthVnd !== null && mgr.perMonthVnd !== null && fdl.perMonthVnd > mgr.perMonthVnd) {
      outOfRange({ max: mgr.perMonthVnd });
    }
  }
}

/** "HH:mm" → minutes since midnight (values were already type-checked as `time`). */
const minutes = (t: unknown): number | null => {
  if (typeof t !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number) as [number, number];
  return h * 60 + m;
};

/** Pairs [earlier, later] that must satisfy earlier < later (strict) or ≤ (allowEqual). */
const TIME_ORDER: Array<{ a: string; b: string; allowEqual: boolean }> = [
  { a: 'checkout_time', b: 'late_grace_until', allowEqual: false },
  { a: 'no_show_call_time', b: 'no_show_mark_time', allowEqual: false },
  { a: 'hold_latest_time_on_arrival', b: 'checkin_time', allowEqual: true },
];

async function checkTimeOrder(key: string, value: unknown, other: OtherValue): Promise<void> {
  for (const rule of TIME_ORDER) {
    if (key !== rule.a && key !== rule.b) continue;
    const otherKey = key === rule.a ? rule.b : rule.a;
    const mine = minutes(value);
    const theirs = minutes(await other(otherKey).catch(() => null));
    if (mine === null || theirs === null) continue;
    const [early, late] = key === rule.a ? [mine, theirs] : [theirs, mine];
    const ok = rule.allowEqual ? early <= late : early < late;
    if (!ok) {
      const otherValue = await other(otherKey);
      outOfRange(key === rule.a ? { max: otherValue } : { min: otherValue });
    }
  }
}

export async function checkStructuredParameter(
  key: string,
  value: unknown,
  other: OtherValue,
): Promise<void> {
  switch (key) {
    case 'rate_floor_pct': {
      const ceiling = await other('rate_ceiling_pct').catch(() => null);
      if (typeof value === 'number' && value > 100) outOfRange({ max: 100 });
      if (typeof value === 'number' && typeof ceiling === 'number' && value > ceiling) {
        outOfRange({ max: ceiling });
      }
      return;
    }
    case 'rate_ceiling_pct': {
      const floor = await other('rate_floor_pct').catch(() => null);
      if (typeof value === 'number' && value < 100) outOfRange({ min: 100 });
      if (typeof value === 'number' && typeof floor === 'number' && value < floor) {
        outOfRange({ min: floor });
      }
      return;
    }
    case 'weekend_nights': {
      const ok =
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((d) => isInt(d) && d >= 1 && d <= 7) &&
        new Set(value).size === value.length;
      if (!ok) outOfRange({ allowed: [1, 2, 3, 4, 5, 6, 7] });
      return;
    }
    case 'hold_hours_options': {
      const ok =
        Array.isArray(value) &&
        value.length >= 1 &&
        value.length <= 5 &&
        value.every((h) => isInt(h) && h >= 1 && h <= 72) &&
        new Set(value).size === value.length;
      if (!ok) outOfRange({ min: 1, max: 72 });
      // The options must keep containing the current default (BR-302, erd 9.1a "chéo").
      const dflt = await other('hold_hours_default').catch(() => null);
      if (isInt(dflt) && !(value as number[]).includes(dflt)) outOfRange({});
      return;
    }
    case 'hold_hours_default': {
      // BR-302 / erd 9.1a "chéo: ∈ hold_hours_options" (BUG-R2-007): 36 with options 12/24/48 → 422.
      const options = await other('hold_hours_options').catch(() => null);
      if (Array.isArray(options) && !options.includes(value)) outOfRange({ allowed: options });
      return;
    }
    case 'foc_limits':
      checkFocLimits(value);
      return;
    case 'foc_self_apply.front_desk.per_time':
    case 'foc_self_apply.front_desk.per_month': {
      if (!isVnd(value)) outOfRange({ min: 0, max: FOC_MAX_VND });
      // Per-time never above per-month (BR-436).
      const isTime = key.endsWith('per_time');
      const otherValue = await other(
        isTime ? 'foc_self_apply.front_desk.per_month' : 'foc_self_apply.front_desk.per_time',
      ).catch(() => null);
      if (isInt(otherValue)) {
        if (isTime && (value as number) > otherValue) outOfRange({ max: otherValue });
        if (!isTime && (value as number) < otherValue) outOfRange({ min: otherValue });
      }
      return;
    }
    case 'foc_self_apply.front_desk.categories': {
      const ok =
        Array.isArray(value) &&
        value.every((c) => typeof c === 'string' && /^[a-z_]{1,40}$/.test(c)) &&
        new Set(value).size === value.length;
      if (!ok) outOfRange({});
      return;
    }
    case 'foc_approval_push_roles': {
      const ok =
        (typeof value === 'string' && (FOC_PUSH_SETTINGS as readonly string[]).includes(value)) ||
        (Array.isArray(value) &&
          value.length > 0 &&
          value.every((r) => (APPROVER_ROLES as readonly string[]).includes(r)) &&
          new Set(value).size === value.length);
      if (!ok) outOfRange({ allowed: [...FOC_PUSH_SETTINGS, ...APPROVER_ROLES] });
      return;
    }
    case 'min_stay': {
      if (isInt(value)) {
        if (value < 1 || value > 7) outOfRange({ min: 1, max: 7 });
        return;
      }
      // Object form {nights, …}: every numeric "nights" 1–7.
      const nights = (value as { nights?: unknown } | null)?.nights;
      if (nights !== undefined && (!isInt(nights) || nights < 1 || nights > 7)) {
        outOfRange({ min: 1, max: 7 });
      }
      return;
    }
    case 'session_policy': {
      // Sub-key bounds: SEC hard bounds (x-security-parameters 0.3.4, ParameterService.validate).
      // Cross rule here: idleMinutes ≤ maxHours × 60 per client.
      const v = value as Record<string, { idleMinutes?: unknown; maxHours?: unknown }> | null;
      for (const k of ['admin', 'staff_pwa']) {
        const p = v?.[k];
        if (p && isInt(p.idleMinutes) && isInt(p.maxHours) && p.idleMinutes > p.maxHours * 60) {
          throw problem('PARAM_OUT_OF_RANGE', {
            errors: [{ field: `value.${k}.idleMinutes`, code: 'PARAM_OUT_OF_RANGE' }],
            extras: { max: p.maxHours * 60 },
          });
        }
      }
      return;
    }
    default:
      await checkTimeOrder(key, value, other);
  }
}
