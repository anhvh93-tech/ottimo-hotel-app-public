/**
 * erd 9.1a "Khóa dạng khác" – structured keys and cross-key rules checked by the setParameter use case
 * (ParameterService.validate already covers type, SEC hard bounds and the scalar min–max/allowed bounds).
 * Every violation → 422 PARAM_OUT_OF_RANGE (with min/max or allowed when meaningful), like the scalar case.
 *
 * Covered in Sprint 1: rate floor/ceiling cross rule, time cross rules, weekend_nights, hold_hours_options,
 * min_stay, session_policy, login_lockout. TODO(BE-B Sprint 2): tier lists (early_checkin_tiers,
 * late_checkout_tiers, long_stay_cleaning_window, front_desk_hours), %-by-step lists (los_discount,
 * cancel_policy_direct, …, commission_payout Σ = 100), foc_limits, wo_sla, text enums.
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
const isPosInt = (v: unknown): v is number => isInt(v) && v > 0;

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
      const v = value as Record<string, { idleMinutes?: unknown; maxHours?: unknown }> | null;
      const ok =
        !!v &&
        ['admin', 'staff_pwa'].every((k) => {
          const p = v[k];
          return (
            !!p &&
            isPosInt(p.idleMinutes) &&
            isPosInt(p.maxHours) &&
            p.idleMinutes <= p.maxHours * 60 &&
            p.maxHours <= 720
          );
        });
      if (!ok) outOfRange({ min: 1, max: 720 });
      return;
    }
    case 'login_lockout': {
      const v = value as Record<string, unknown> | null;
      const ok =
        !!v &&
        isInt(v.maxFailures) &&
        v.maxFailures >= 3 &&
        v.maxFailures <= 10 &&
        isPosInt(v.lockMinutes) &&
        v.lockMinutes <= 1440 &&
        isPosInt(v.hardLockAfterLocks) &&
        v.hardLockAfterLocks <= 10 &&
        isPosInt(v.lockWindowHours) &&
        v.lockWindowHours <= 168;
      if (!ok) outOfRange({ min: 1 });
      return;
    }
    default:
      await checkTimeOrder(key, value, other);
  }
}
