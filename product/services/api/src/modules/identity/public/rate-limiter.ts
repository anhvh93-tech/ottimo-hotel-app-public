/**
 * Fixed-window in-memory counters for SR-RL-01/07 (login per IP, guest
 * lookups by SAL/CTV). Per api process: with one api replica (R2 hosting plan) this is exact; with several
 * replicas each one counts separately (limit × replicas) – move to PostgreSQL/Redis before scaling out.
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
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly clock: Clock) {}

  /** Seconds until the window resets when the key is over the limit, else 0 (does not count). */
  retryAfter(key: string, rule: RateRule): number {
    const now = this.clock.now().getTime();
    const b = this.buckets.get(key);
    if (!b || b.resetAt <= now || b.count < rule.limit) return 0;
    return Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  }

  /** Count one event. */
  hit(key: string, rule: RateRule): void {
    const now = this.clock.now().getTime();
    const b = this.buckets.get(key);
    if (!b || b.resetAt <= now) {
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

  reset(key: string): void {
    this.buckets.delete(key);
  }

  private sweep(now: number): void {
    if (this.buckets.size < 10_000) return;
    for (const [k, v] of this.buckets) if (v.resetAt <= now) this.buckets.delete(k);
  }
}

export const RATE_LIMITER = Symbol('RATE_LIMITER');
