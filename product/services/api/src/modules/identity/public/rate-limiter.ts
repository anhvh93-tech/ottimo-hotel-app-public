/**
 * Fixed-window in-memory counters for SR-RL-01/07 (login per IP; guest contact probes by SAL/CTV –
 * searchGuests, lookupGuestByContact, createGuest/updateGuest with a phone/e-mail share one counter).
 * Per api process: with one api replica (R2 hosting plan, decision-log assumption accepted by SEC –
 * FB-R2-SEC-BE-14) this is exact; restarts reset the windows and several replicas count separately
 * (limit × replicas) – move to a PostgreSQL rate_limit_counter table (atomic UPSERT) before scaling out
 * (R3, before GL). Account lockout and re-auth counters are already in PostgreSQL.
 * Window lengths and limits are technical security constants (SEC section 5), not business parameters.
 */
import type { Clock } from '../../../clock';
import { problem } from '../../../shared/problem';

export interface RateRule {
  limit: number;
  windowMs: number;
}

/** SR-RL table (security-requirements.md section 5). */
export const RATE_RULES = {
  loginPerIp: { limit: 20, windowMs: 15 * 60_000 },
  guestLookupPerUser: { limit: 30, windowMs: 60 * 60_000 },
} as const satisfies Record<string, RateRule>;

export class RateLimiter {
  private readonly buckets = new Map<
    string,
    { count: number; resetAt: number; refusalReported?: boolean }
  >();

  constructor(private readonly clock: Pick<Clock, 'now'>) {}

  /**
   * A bucket whose end lies more than one window ahead was opened at a later time than now – the clock went
   * back (MutableClock reset in dev/test – BUG-R2-051): it no longer counts.
   */
  private live(
    b: { count: number; resetAt: number } | undefined,
    now: number,
    rule: RateRule,
  ): boolean {
    return !!b && b.resetAt > now && b.resetAt - now <= rule.windowMs;
  }

  /** Seconds until the window resets when the key is over the limit, else 0 (does not count). */
  retryAfter(key: string, rule: RateRule): number {
    const now = this.clock.now().getTime();
    const b = this.buckets.get(key);
    if (!b || !this.live(b, now, rule) || b.count < rule.limit) return 0;
    return Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  }

  /** Count one event. */
  hit(key: string, rule: RateRule): void {
    const now = this.clock.now().getTime();
    const b = this.buckets.get(key);
    if (!b || !this.live(b, now, rule)) {
      this.buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
      this.sweep(now);
      return;
    }
    b.count++;
  }

  /** Throw 429 RATE_LIMITED (Retry-After) when over the limit. */
  assert(key: string, rule: RateRule): void {
    const wait = this.retryAfter(key, rule);
    if (wait > 0) throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(wait) } });
  }

  /** Count and throw when the event itself goes over the limit (lookups: every call counts). */
  consume(key: string, rule: RateRule): void {
    this.assert(key, rule);
    this.hit(key, rule);
  }

  /**
   * True exactly once per window for a key that is over its limit – the caller writes one security event
   * per IP/user and window instead of one per refused request.
   */
  firstRefusal(key: string): boolean {
    const b = this.buckets.get(key);
    if (!b || b.refusalReported) return false;
    b.refusalReported = true;
    return true;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  /** Test support (FB-R2-QA-BE-07): forget every window. Never called by production code. */
  resetAll(): void {
    this.buckets.clear();
  }

  private sweep(now: number): void {
    if (this.buckets.size < 10_000) return;
    for (const [k, v] of this.buckets) if (v.resetAt <= now) this.buckets.delete(k);
  }
}

export const RATE_LIMITER = Symbol('RATE_LIMITER');

/**
 * Process clock for windows that must never follow the business clock (BUG-R2-051): monotonic
 * (`performance.now()`), so moving the shared dev/test clock (dev_clock, ADR-008) neither opens nor
 * freezes a window. Used by the SR-RL-09 per-user limit of the guard.
 */
export const MONOTONIC_CLOCK: Pick<Clock, 'now'> = {
  now: () => new Date(Math.round(performance.timeOrigin + performance.now())),
};
