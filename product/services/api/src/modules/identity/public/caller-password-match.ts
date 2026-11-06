/**
 * Limit on comparing a value with the caller's OWN login password (rule id: `CALLER_PASSWORD_COMPARE_RULE`; SEC
 * `SEC-responses.md` 2 and 3, OpenAPI 0.3.13 bổ sung 1e – BE C0313-23, 24) for a field that must never hold it
 * (setPropertyWifi `password`, V5-58). Not a re-authentication: a match is a refusal of the value, never a proof of
 * identity, and nothing here unlocks anything.
 * - EVERY comparison counts, match or not, and so does an attempt over the limit: at most
 *   `CALLER_PASSWORD_COMPARE_LIMIT` comparisons per user in a fixed 24 h window. Over the limit the comparison is
 *   SKIPPED (the caller applies its other rules and saves as usual) – no 429, no new code, no change in the answer.
 * - The counter is PostgreSQL `rate_limit_counter` (migration 0086 – no new table or column, no migration) through
 *   its one UPSERT (public-site `bumpRateLimitCounter`), bucket `<bucket>:<user_id>` (Wi-Fi: `wifi_pw_cmp:<user_id>`),
 *   `window_start` = start, `expires_at` = end of the window. It is NOT the login lockout (`app_user.failed_*`,
 *   `locked_until`) nor the re-auth counter (SR-RL-02, `approval_pin_*`): a leaked session must not lock the owner
 *   out, and the account is never locked from here.
 * - Own transactions, like PasswordReauth (callers run this BEFORE UnitOfWork.run):
 *   1. count (+ the `skippedAction` audit when this attempt is the first over the limit – count = limit + 1, once
 *      per window) and read the caller's hash – COMMITTED before the comparison;
 *   2. one argon2 verification, outside any transaction;
 *   3. on a match: the `matchAction` audit, committed before the caller answers 422.
 *   A 422 that rolls the request back therefore keeps the count and both audits.
 * - Security audit, never with a value (`after.rule` = the rule id only).
 * - Compares against the caller's hash only (never another account – no probing channel, outside SR-AUTH-11).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { bumpRateLimitCounter } from '../../public-site/public/rate-limit-counter';
import { verifyPassword } from './passwords';

/** The security requirement this limit implements – the one place to change if SEC renumbers it. */
export const CALLER_PASSWORD_COMPARE_RULE = 'SR-RL-15';
/** 5 comparisons per user and fixed 24 h window – technical security constants, not business parameters. */
export const CALLER_PASSWORD_COMPARE_LIMIT = 5;
export const CALLER_PASSWORD_COMPARE_WINDOW_MS = 24 * 3600_000;

export type CallerPasswordMatchResult = 'match' | 'no_match' | 'skipped';

/** Row key in `rate_limit_counter`: ids only (the table's documented RLS exception, erd 4.14). */
export function callerPasswordBucket(bucket: string, userId: string): string {
  return `${bucket}:${userId}`;
}

/** Start of the fixed window holding `now`. */
export function callerPasswordWindowStart(now: Date): Date {
  return new Date(
    Math.floor(now.getTime() / CALLER_PASSWORD_COMPARE_WINDOW_MS) *
      CALLER_PASSWORD_COMPARE_WINDOW_MS,
  );
}

@Injectable()
export class CallerPasswordMatch {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async check(
    ctx: TenantContext,
    candidate: string,
    opts: {
      /** Counter prefix of the field, e.g. `wifi_pw_cmp`. */
      bucket: string;
      entityType: string;
      entityId: string;
      matchAction: string;
      skippedAction: string;
      requestId?: string;
      sessionId?: string;
    },
  ): Promise<CallerPasswordMatchResult> {
    const userId = ctx.userId;
    if (!userId) throw problem('UNAUTHENTICATED');
    const trace = (action: string) => ({
      category: 'security' as const,
      action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      after: { rule: CALLER_PASSWORD_COMPARE_RULE },
      ...(opts.requestId ? { requestId: opts.requestId } : {}),
      ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
    });
    // 1. Count first, committed before any comparison.
    const counted = await this.db.withContext(ctx, async (tx) => {
      const count = await bumpRateLimitCounter(
        tx,
        callerPasswordBucket(opts.bucket, userId),
        callerPasswordWindowStart(this.clock.now()),
        CALLER_PASSWORD_COMPARE_WINDOW_MS,
      );
      if (count > CALLER_PASSWORD_COMPARE_LIMIT) {
        // Once per window: the first attempt over the limit (the UPSERT hands out each count once).
        if (count === CALLER_PASSWORD_COMPARE_LIMIT + 1) {
          await this.audit.record(tx, trace(opts.skippedAction));
        }
        return { skipped: true as const };
      }
      const { rows } = await tx.query<{ password_hash: string | null }>(
        'SELECT password_hash FROM app_user WHERE id = $1',
        [userId],
      );
      return { skipped: false as const, hash: rows[0]?.password_hash ?? null };
    });
    if (counted.skipped) return 'skipped';
    // 2. One argon2 verification on the caller's own hash (the dummy hash when there is none).
    if (!(await verifyPassword(counted.hash, candidate))) return 'no_match';
    // 3. The match is audited in its own committed transaction (kept when the request answers 422).
    await this.db.withContext(ctx, (tx) => this.audit.record(tx, trace(opts.matchAction)));
    return 'match';
  }
}
