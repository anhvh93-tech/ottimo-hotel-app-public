/**
 * Limit on comparing a value with the caller's OWN login password (rule id: `CALLER_PASSWORD_COMPARE_RULE`; SEC
 * 06/11, OpenAPI 0.3.13 bổ sung 1e – BE C0313-23, ORC on C0313-24) for a field that must never hold it
 * (setPropertyWifi `password`, V5-58). Not a re-authentication: a match is a refusal of the value, never a proof of
 * identity, and nothing here unlocks anything.
 * - EVERY comparison counts, match or not: at most `CALLER_PASSWORD_COMPARE_LIMIT` per user in a fixed 24 h window.
 *   Over the limit the comparison is SKIPPED (the caller applies its other rules and saves as usual) – no 429, no new
 *   code, no change in the answer.
 * - The counter lives in PostgreSQL `rate_limit_counter` (the keyed, atomic UPSERT store of migration 0086 – no new
 *   table or column, no migration), bucket `<bucket>:<user_id>` (Wi-Fi: `wifi_pw_cmp:<user_id>`). It is NOT the
 *   login lockout (`app_user.failed_*`, `locked_until`) nor the re-auth counter (SR-RL-02, `approval_pin_*`): a
 *   leaked session must not lock the owner out, and the account is never locked from here.
 * - Runs in its OWN transaction, committed before the caller answers (like PasswordReauth): a 422 that rolls the
 *   request back keeps the count and the security audit. Callers run it BEFORE UnitOfWork.run.
 * - Security audit, never with a value (`after.rule` = the rule id only): `matchAction` on a match; `skippedAction`
 *   once per window (the first attempt over the limit).
 * - Compares against the caller's hash only (never another account – no probing channel, outside SR-AUTH-11).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { verifyPassword } from './passwords';

/** The security requirement this limit implements – the one place to change if SEC renumbers it. */
export const CALLER_PASSWORD_COMPARE_RULE = 'SR-RL-10';
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
    const start = callerPasswordWindowStart(this.clock.now());
    return this.db.withContext(ctx, async (tx) => {
      const { rows } = await tx.query<{ count: number }>(
        `INSERT INTO rate_limit_counter (bucket_key, window_start, count, expires_at) VALUES ($1, $2, 1, $3)
         ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = rate_limit_counter.count + 1
         RETURNING count`,
        [
          callerPasswordBucket(opts.bucket, userId),
          start,
          new Date(start.getTime() + CALLER_PASSWORD_COMPARE_WINDOW_MS),
        ],
      );
      const count = Number(rows[0]?.count ?? 0);
      const trace = {
        category: 'security' as const,
        entityType: opts.entityType,
        entityId: opts.entityId,
        after: { rule: CALLER_PASSWORD_COMPARE_RULE },
        ...(opts.requestId ? { requestId: opts.requestId } : {}),
        ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
      };
      if (count > CALLER_PASSWORD_COMPARE_LIMIT) {
        // Once per window: the first attempt over the limit (the UPSERT hands out each count once).
        if (count === CALLER_PASSWORD_COMPARE_LIMIT + 1) {
          await this.audit.record(tx, { ...trace, action: opts.skippedAction });
        }
        return 'skipped';
      }
      const { rows: users } = await tx.query<{ password_hash: string | null }>(
        'SELECT password_hash FROM app_user WHERE id = $1',
        [userId],
      );
      // One argon2 verification on the caller's own hash (the dummy hash when there is none).
      if (!(await verifyPassword(users[0]?.password_hash ?? null, candidate))) return 'no_match';
      await this.audit.record(tx, { ...trace, action: opts.matchAction });
      return 'match';
    });
  }
}
