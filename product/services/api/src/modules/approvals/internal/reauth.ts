/**
 * Approver re-authentication (BR-432 "xác nhận bằng mật khẩu/PIN của chính người duyệt", SR-AUTH-09,
 * SR-RL-02, OpenAPI approveRequest/rejectRequest).
 *
 * - R2: `authMethod = password` – the password of the account that is signed in (never a chosen name).
 *   `pin` is R3 (SR-AUTH-09) → 422 NOT_IN_LIST until then.
 * - 5 failures → approvals locked 15 minutes (shared counter for approve + reject, persisted in
 *   app_user.approval_pin_failed_count / approval_pin_locked_until so it survives restarts and replicas).
 *   While locked → 429 RATE_LIMITED with Retry-After. A failure → 401 REAUTH_FAILED.
 * - The counter is written in its OWN transaction (committed even though the request fails) and audited
 *   (category security). The secret is never logged or stored.
 * Limits are SEC technical constants (security-requirements 5, SR-RL-02), not business parameters.
 */
import type { Clock } from '../../../clock';
import type { Database, TenantContext } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type { AuditService } from '../../audit/public/audit.service';
import { verifyPassword } from '../../identity/public/passwords';

export const REAUTH_MAX_FAILURES = 5;
export const REAUTH_LOCK_MS = 15 * 60_000;

export interface ReauthInput {
  authMethod: unknown;
  secret: unknown;
}

interface UserRow {
  password_hash: string;
  status: string;
  approval_pin_failed_count: number;
  approval_pin_locked_until: Date | null;
}

export class ApproverReauth {
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
    private readonly audit: AuditService,
  ) {}

  /** Throws 422 (bad input), 429 (locked), 401 (wrong secret). Resolves when the secret is correct. */
  async verify(ctx: TenantContext, input: ReauthInput, requestId?: string): Promise<'password'> {
    if (input.authMethod !== 'password') {
      throw problem('VALIDATION_FAILED', {
        errors: [
          {
            field: 'authMethod',
            code: input.authMethod === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
          },
        ],
      });
    }
    const secret = input.secret;
    if (typeof secret !== 'string' || secret.length < 6 || secret.length > 256) {
      throw problem('VALIDATION_FAILED', {
        errors: [
          { field: 'secret', code: secret === undefined ? 'REQUIRED' : 'VALIDATION_FAILED' },
        ],
      });
    }
    const userId = ctx.userId;
    if (!userId) throw problem('UNAUTHENTICATED');

    const outcome = await this.db.withContext(ctx, async (tx) => {
      const { rows } = await tx.query<UserRow>(
        `SELECT password_hash, status, approval_pin_failed_count, approval_pin_locked_until
           FROM app_user WHERE id = $1 FOR UPDATE`,
        [userId],
      );
      const u = rows[0];
      if (!u || u.status !== 'active') return { kind: 'unauthenticated' as const };
      const now = this.clock.now();
      if (u.approval_pin_locked_until && u.approval_pin_locked_until.getTime() > now.getTime()) {
        const wait = Math.ceil((u.approval_pin_locked_until.getTime() - now.getTime()) / 1000);
        return { kind: 'locked' as const, wait };
      }
      if (await verifyPassword(u.password_hash, secret)) {
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
        action: lock ? 'approval.reauth_locked' : 'approval.reauth_failed',
        entityType: 'app_user',
        entityId: userId,
        after: {
          authMethod: 'password',
          failedCount: failed,
          lockedUntil: lock ? lock.toISOString() : null,
        },
        ...(requestId ? { requestId } : {}),
      });
      return { kind: 'failed' as const };
    });

    switch (outcome.kind) {
      case 'ok':
        return 'password';
      case 'locked':
        throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(outcome.wait) } });
      case 'unauthenticated':
        throw problem('UNAUTHENTICATED');
      default:
        throw problem('REAUTH_FAILED');
    }
  }
}
