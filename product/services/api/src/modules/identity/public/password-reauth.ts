/**
 * Re-authentication with the signed-in user's own password (SR-RL-02: 5 failures → 15 min lock), for
 * changeMyPassword and trustCurrentDevice. ONE counter per user shared with the approvals module
 * (approvals/internal/reauth.ts – same columns, same limits): app_user.approval_pin_failed_count /
 * approval_pin_locked_until, so failures on any re-auth screen add up and survive restarts/replicas.
 * - Runs in its OWN transaction so a failure is counted (and audited) although the request fails.
 * - Locked → 429 RATE_LIMITED + Retry-After; wrong password → 401 REAUTH_FAILED (errors[] on `field`).
 * TODO(BE-A): approvals/internal/reauth.ts can delegate its password branch to this class.
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { verifyPassword } from './passwords';

export const REAUTH_MAX_FAILURES = 5;
export const REAUTH_LOCK_MS = 15 * 60_000;

@Injectable()
export class PasswordReauth {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async verify(
    ctx: TenantContext,
    password: string,
    opts: { field: string; purpose: string; requestId?: string },
  ): Promise<void> {
    const userId = ctx.userId;
    if (!userId) throw problem('UNAUTHENTICATED');
    const outcome = await this.db.withContext(ctx, async (tx) => {
      const { rows } = await tx.query<{
        password_hash: string;
        status: string;
        approval_pin_failed_count: number;
        approval_pin_locked_until: Date | null;
      }>(
        `SELECT password_hash, status, approval_pin_failed_count, approval_pin_locked_until
           FROM app_user WHERE id = $1 FOR UPDATE`,
        [userId],
      );
      const u = rows[0];
      if (!u || u.status !== 'active') return { kind: 'unauthenticated' as const };
      const now = this.clock.now();
      if (u.approval_pin_locked_until && u.approval_pin_locked_until > now) {
        const wait = Math.ceil((u.approval_pin_locked_until.getTime() - now.getTime()) / 1000);
        return { kind: 'locked' as const, wait };
      }
      if (await verifyPassword(u.password_hash, password)) {
        if (u.approval_pin_failed_count > 0 || u.approval_pin_locked_until) {
          await tx.query(
            `UPDATE app_user SET approval_pin_failed_count = 0, approval_pin_locked_until = NULL WHERE id = $1`,
            [userId],
          );
        }
        return { kind: 'ok' as const };
      }
      const failed = u.approval_pin_failed_count + 1;
      const lock = failed >= REAUTH_MAX_FAILURES ? new Date(now.getTime() + REAUTH_LOCK_MS) : null;
      await tx.query(
        `UPDATE app_user SET approval_pin_failed_count = $2, approval_pin_locked_until = $3 WHERE id = $1`,
        [userId, lock ? 0 : failed, lock],
      );
      await this.audit.record(tx, {
        category: 'security',
        action: lock ? `${opts.purpose}.reauth_locked` : `${opts.purpose}.reauth_failed`,
        entityType: 'app_user',
        entityId: userId,
        after: {
          authMethod: 'password',
          failedCount: failed,
          lockedUntil: lock ? lock.toISOString() : null,
        },
        ...(opts.requestId ? { requestId: opts.requestId } : {}),
      });
      return { kind: 'failed' as const };
    });
    if (outcome.kind === 'ok') return;
    if (outcome.kind === 'locked') {
      throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(outcome.wait) } });
    }
    if (outcome.kind === 'unauthenticated') throw problem('UNAUTHENTICATED');
    throw problem('REAUTH_FAILED', { errors: [{ field: opts.field, code: 'REAUTH_FAILED' }] });
  }
}
