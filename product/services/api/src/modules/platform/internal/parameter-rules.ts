/**
 * erd 9.1a "Khóa dạng khác" – structured keys and cross-key rules checked by the setParameter use case
 * (ParameterService.validate already covers type, SEC hard bounds and the scalar min–max/allowed bounds).
 * Every violation → 422 PARAM_OUT_OF_RANGE (with min/max or allowed when meaningful), like the scalar case.
 *
 * Covered in Sprint 1: rate floor/ceiling cross rule, time cross rules, hold_hours_options
 * ↔ hold_hours_default (BR-302 – the default must be one of the options, BUG-R2-007),
 * session_policy / login_lockout cross rule (their bounds are SEC hard bounds – x-security-parameters
 * 0.3.4, checked by ParameterService.validate), foc_limits, foc_self_apply.front_desk.*,
 * foc_approval_push_roles (used by approvals since Sprint 1 – FB-R2-ARC-BE-10).
 * v1.0.5 V5-25 (BUG-R5-001, BUG-R5-003; DOM rules-v1.0.5 8.4, 12; ARC 0.3.13 bổ sung 1, 1.24) – the shapes of
 * platform/public/parameter-shapes.ts, the same ones the price engine reads: weekend_nights (weekday codes),
 * min_stay (DOM 12.1 + nights ≤ short_stay_max_nights, both directions), and the other structured keys of the
 * quote / booking / web estimate / check-in / check-out paths: special_dates, los_discount, cancel_policy_direct,
 * early_checkin_tiers, late_checkout_tiers, early_departure_refund, checkout_reminders, weekend_uplift_channels,
 * special_uplift_channels, max_open_holds_per_user, lease_terms (what the quote reads).
 * Left for R5-B-05 (B-KYTHUAT): long_stay_cleaning_window, front_desk_hours, wo_sla, registration_*,
 * extra_guest_kit_items, damage_catalog, room_move_pricing, utility_estimate, early_termination, commission_payout.
 */
import { problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';
import { NOTICE_TEXT_VERSIONS } from '../public/notice-versions';
import {
  type ShapeIssue,
  cancelPolicyIssue,
  checkoutRemindersIssue,
  earlyCheckinTiersIssue,
  earlyDepartureRefundIssue,
  lateCheckoutTiersIssue,
  leaseTermsIssue,
  losDiscountIssue,
  maxOpenHoldsIssue,
  minStayIssue,
  minStayLargestNights,
  minStayNightsCap,
  specialDatesIssue,
  upliftChannelsIssue,
  weekendNightsIssue,
} from '../public/parameter-shapes';

/** Value of another key in force on the `effectiveFrom` of the save (throws ParameterMissingError when none). */
export type OtherValue = (key: string) => Promise<unknown>;
/** Rows of a key scheduled AFTER the `effectiveFrom` of the save, oldest first. */
export type ScheduledValues = (
  key: string,
) => Promise<ReadonlyArray<{ effectiveFrom: LocalDate; value: unknown }>>;

const outOfRange = (extras: Record<string, unknown> = {}): never => {
  throw problem('PARAM_OUT_OF_RANGE', {
    errors: [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }],
    extras,
  });
};

const isInt = (v: unknown): v is number => Number.isSafeInteger(v);

/** V5-25: the first problem of a structured value (field `value[<i>].<key>`, field code, min/max/allowed). */
const fail = (i: ShapeIssue): never => {
  throw problem('PARAM_OUT_OF_RANGE', {
    errors: [{ field: i.field, code: i.code }],
    extras: i.extras,
  });
};

/**
 * The values of `key` that will be in force while the row being saved for `own` is: the one in force on its
 * `effectiveFrom`, then every row of `key` scheduled after it and before the next row of `own` (DOM 12.2: the
 * min_stay ↔ short_stay_max_nights pair is checked both ways, like the time pairs).
 */
async function valuesDuringOwnRow(
  own: string,
  key: string,
  other: OtherValue,
  scheduled: ScheduledValues,
): Promise<unknown[]> {
  const ownNext = (await scheduled(own))[0]?.effectiveFrom ?? null;
  const later = (await scheduled(key))
    .filter((r) => ownNext === null || r.effectiveFrom < ownNext)
    .map((r) => r.value);
  return [await other(key).catch(() => null), ...later];
}

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

/** erd 9.1a `ota_base_rate` (ARC s2-contract 8.1): one price per room-group code. */
export const OTA_BASE_RATE_MIN_VND = 100_000;
export const OTA_BASE_RATE_MAX_VND = 20_000_000;

export async function checkStructuredParameter(
  key: string,
  value: unknown,
  other: OtherValue,
  roomGroupCodes: () => Promise<string[]> = async () => [],
  scheduled: ScheduledValues = async () => [],
): Promise<void> {
  const check = (bad: ShapeIssue | null): void => {
    if (bad) fail(bad);
  };
  switch (key) {
    case 'web_estimate.open_until': {
      // R4 LP-v2 (BR-115 (6)): the last night with a confirmed calendar – a real calendar date.
      const ok =
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
      if (!ok) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'value', code: 'VALIDATION_FAILED' }],
        });
      }
      return;
    }
    case 'ota_base_rate': {
      // Every active room-group code exactly once, each 100.000–20.000.000 VND (BR-103).
      const codes = await roomGroupCodes();
      const v = value as Record<string, unknown>;
      const ok =
        !!v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        Object.keys(v).length === codes.length &&
        codes.every((c) => isInt(v[c])) &&
        Object.values(v).every(
          (n) => isInt(n) && n >= OTA_BASE_RATE_MIN_VND && n <= OTA_BASE_RATE_MAX_VND,
        );
      if (!ok) {
        outOfRange({ allowed: codes, min: OTA_BASE_RATE_MIN_VND, max: OTA_BASE_RATE_MAX_VND });
      }
      return;
    }
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
    case 'weekend_nights':
      // BUG-R5-001 / DOM 8.4: weekday codes, the form the price engine reads (`["FRI","SAT"]` in production).
      check(weekendNightsIssue(value));
      return;
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
      // BUG-R5-003 / DOM 12.1: only the list of rules the engine reads; nights ≤ min(7, short_stay_max_nights).
      const caps = (
        await valuesDuringOwnRow('min_stay', 'short_stay_max_nights', other, scheduled)
      ).filter(isInt);
      check(minStayIssue(value, minStayNightsCap(caps.length ? Math.min(...caps) : null)));
      return;
    }
    case 'short_stay_max_nights': {
      // DOM 12.2 reverse check: never below the largest `nights` of a min_stay rule in force meanwhile.
      if (!isInt(value)) return;
      const need = Math.max(
        0,
        ...(await valuesDuringOwnRow('short_stay_max_nights', 'min_stay', other, scheduled)).map(
          minStayLargestNights,
        ),
      );
      if (value < need) fail({ field: 'value', code: 'VALUE_OUT_OF_RANGE', extras: { min: need } });
      return;
    }
    // V5-25 rà khóa (QA BUG-R5-003 (f)): structured keys read by quote / booking / web estimate / check-in / out.
    case 'special_dates':
      check(specialDatesIssue(value));
      return;
    case 'los_discount':
      check(losDiscountIssue(value));
      return;
    case 'cancel_policy_direct':
      check(cancelPolicyIssue(value));
      return;
    case 'early_checkin_tiers':
      check(earlyCheckinTiersIssue(value));
      return;
    case 'late_checkout_tiers':
      check(lateCheckoutTiersIssue(value, await other('business_day_rollover').catch(() => null)));
      return;
    case 'early_departure_refund':
      check(earlyDepartureRefundIssue(value));
      return;
    case 'checkout_reminders':
      check(checkoutRemindersIssue(value));
      return;
    case 'weekend_uplift_channels':
    case 'special_uplift_channels':
      check(upliftChannelsIssue(value));
      return;
    case 'max_open_holds_per_user':
      check(maxOpenHoldsIssue(value));
      return;
    case 'lease_terms':
      check(leaseTermsIssue(value));
      return;
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
    case 'property_map_url': {
      // S4-51 / P-S4-7 (BE-D, 0058): the guest app opens this link – https on the SEC E14-08 hosts only
      // (OpenAPI GuestStay.property.mapUrl: "kiểm khi OWN lưu (422 NOT_IN_LIST)").
      if (!isAllowedMapUrl(value)) {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'value', code: 'NOT_IN_LIST' }] });
      }
      return;
    }
    case 'privacy_notice_version': {
      // v1.0.4 P4-16 (SEC-BA-104-09 a): only a version that has a text on guest-web and on the desk sheet –
      // exact match (no trim, no case folding). Anything else, `privacy-2026-10-v1` included → 422 + allowed.
      if (typeof value !== 'string' || !NOTICE_TEXT_VERSIONS.includes(value)) {
        outOfRange({ allowed: [...NOTICE_TEXT_VERSIONS] });
      }
      return;
    }
    default:
      await checkTimeOrder(key, value, other);
  }
}

/** SEC E14-08: https, no credentials/port, exact host (www.google.com only under /maps). */
export function isAllowedMapUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
    if (
      ['maps.google.com', 'maps.app.goo.gl', 'maps.apple.com', 'www.openstreetmap.org'].includes(
        u.hostname,
      )
    ) {
      return true;
    }
    return u.hostname === 'www.google.com' && u.pathname.startsWith('/maps');
  } catch {
    return false;
  }
}
