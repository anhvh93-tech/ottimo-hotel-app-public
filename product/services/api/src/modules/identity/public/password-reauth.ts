/**
 * Re-authentication with the signed-in user's own password (SR-RL-02: 5 failures → 15 min lock), for
 * changeMyPassword, trustCurrentDevice and approveRequest/rejectRequest (approvals, purpose 'approval').
 * The ONE implementation (FB-R2-ARC-BE-02): one counter per user in app_user.approval_pin_failed_count /
 * approval_pin_locked_until, so failures on any re-auth screen add up and survive restarts/replicas.
 * Callers run it BEFORE UnitOfWork.run (never inside – nested connection, FB-R2-ARC-BE-01).
 * - Runs in its OWN transaction so a failure is counted (and audited) although the request fails.
 * - Locked → 429 RATE_LIMITED + Retry-After; wrong password → 401 REAUTH_FAILED (errors[] on `field`).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { defineAuditEntity } from '../../audit/public/audit-fields';
import { AuditService } from '../../audit/public/audit.service';
import { verifyPassword } from './passwords';

// verifyApprover (BR-416-06): a confirmation names the desk user it was typed for; a success records the failures
// it cleared (BUG-R2-167, SEC 12.3).
defineAuditEntity('app_user', ['confirmingFor', 'failedCountCleared']);

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

  /**
   * 0.3.7 bổ sung 4 (ARC 16.6 (d), BR-416-06 – BE-A; SEC `s4-SEC-lateFee-reauth.md` BE-59/60/63): a SECOND person
   * confirms at the desk with their own credentials – `username` (null = the signed-in user re-enters their own
   * password). Its own function (never `verify`: that one only knows `ctx.userId` and answers UNAUTHENTICATED).
   * - The approver is looked up under RLS in the caller's organisation and is ELIGIBLE only when `active`, not
   *   locked, not `must_change_password`, without MFA (fail-closed, R2) and holding one of `roles` (not revoked)
   *   at the caller's property. argon2 runs exactly once: on the approver's hash when eligible, else on the dummy
   *   hash – an ineligible account's password is never checked.
   * - Every failure is the same 401 REAUTH_FAILED on `opts.field`; the caller or an eligible approver already
   *   locked → 429 RATE_LIMITED (+ Retry-After), before any password is checked.
   * - A failure adds one to the SR-RL-02 counter of the caller AND of the eligible approver (atomically, in this
   *   own transaction – counted although the request fails); a success clears the approver's only.
   * - Security audit per counter moved, never with the typed name; `onLocked` runs in the same transaction for a
   *   user just locked (the caller sends `security_alert`).
   * - BUG-R2-167 (SEC 12.3, BE-62 / SR-AUTH-11 (6)): a success for ANOTHER user than the caller leaves its trace in
   *   this own transaction – kept when the request fails afterwards: security audit `${purpose}.reauth_succeeded`
   *   on the approver (`confirmingFor` = the caller, `failedCountCleared` = the failures the success cleared, if any)
   *   and `onSucceeded` (the caller sends `account_security_change`). A user confirming their own request: neither.
   * Runs BEFORE the unit of work, like `verify`.
   */
  async verifyApprover(
    ctx: TenantContext,
    input: { username: string | null; password: string },
    opts: {
      field: string;
      purpose: string;
      roles: readonly string[];
      requestId?: string;
      onLocked?: (tx: Tx, userIds: string[]) => Promise<void>;
      /** BUG-R2-167: the approver (≠ caller) confirmed – same transaction as the `reauth_succeeded` audit. */
      onSucceeded?: (tx: Tx, approverId: string) => Promise<void>;
    },
  ): Promise<{ userId: string; username: string; roles: string[]; self: boolean }> {
    const callerId = ctx.userId;
    if (!callerId) throw problem('UNAUTHENTICATED');
    type Row = {
      id: string;
      username: string;
      password_hash: string;
      status: string;
      must_change_password: boolean;
      mfa_enabled: boolean;
      /** Login lock (SR-RL-01) – a locked account never confirms (BUG-R2-146). */
      locked_until: Date | null;
      approval_pin_failed_count: number;
      approval_pin_locked_until: Date | null;
      roles: string[];
    };
    const outcome = await this.db.withContext(ctx, async (tx) => {
      const { rows: found } = await tx.query<{ id: string }>(
        input.username === null
          ? 'SELECT id FROM app_user WHERE id = $1'
          : 'SELECT id FROM app_user WHERE username = $1 AND organization_id = $2',
        input.username === null ? [callerId] : [input.username, ctx.organizationId],
      );
      const approverId = found[0]?.id ?? null;
      // Both counters move together: lock the rows in id order.
      const { rows } = await tx.query<Row>(
        `SELECT u.id, u.username, u.password_hash, u.status, u.must_change_password, u.mfa_enabled,
                u.locked_until, u.approval_pin_failed_count, u.approval_pin_locked_until,
                COALESCE((SELECT array_agg(r.role) FROM user_property_role r
                           WHERE r.user_id = u.id AND r.property_id = $2 AND r.revoked_at IS NULL), '{}') AS roles
           FROM app_user u WHERE u.id = ANY($1::uuid[]) ORDER BY u.id FOR UPDATE OF u`,
        [[...new Set([callerId, ...(approverId ? [approverId] : [])])], ctx.propertyId],
      );
      const caller = rows.find((r) => r.id === callerId);
      const approver = approverId ? rows.find((r) => r.id === approverId) : undefined;
      if (!caller) return { kind: 'unauthenticated' as const };
      const now = this.clock.now();
      const lockedFor = (u: Row) =>
        u.approval_pin_locked_until && u.approval_pin_locked_until > now
          ? Math.ceil((u.approval_pin_locked_until.getTime() - now.getTime()) / 1000)
          : 0;
      // BUG-R2-146 (SEC BE-59): an account locked at login (`locked_until` in the future) is NOT eligible – the
      // dummy hash is checked, never its real password, and the answer is the same 401.
      const eligible =
        !!approver &&
        approver.status === 'active' &&
        (approver.locked_until === null || approver.locked_until <= now) &&
        !approver.must_change_password &&
        !approver.mfa_enabled &&
        approver.roles.some((r) => opts.roles.includes(r));
      const wait = Math.max(lockedFor(caller), eligible && approver ? lockedFor(approver) : 0);
      if (wait > 0) return { kind: 'locked' as const, wait };
      const ok = await verifyPassword(
        eligible && approver ? approver.password_hash : null,
        input.password,
      );
      if (ok && eligible && approver) {
        if (approver.approval_pin_failed_count > 0 || approver.approval_pin_locked_until) {
          await tx.query(
            `UPDATE app_user SET approval_pin_failed_count = 0, approval_pin_locked_until = NULL WHERE id = $1`,
            [approver.id],
          );
        }
        if (approver.id !== callerId) {
          await this.audit.record(tx, {
            category: 'security',
            action: `${opts.purpose}.reauth_succeeded`,
            entityType: 'app_user',
            entityId: approver.id,
            after: {
              authMethod: 'password',
              confirmingFor: callerId,
              ...(approver.approval_pin_failed_count > 0
                ? { failedCountCleared: approver.approval_pin_failed_count }
                : {}),
            },
            ...(opts.requestId ? { requestId: opts.requestId } : {}),
          });
          if (opts.onSucceeded) await opts.onSucceeded(tx, approver.id);
        }
        return {
          kind: 'ok' as const,
          user: {
            userId: approver.id,
            username: approver.username,
            roles: approver.roles,
            self: approver.id === callerId,
          },
        };
      }
      const counted = [
        caller,
        ...(eligible && approver && approver.id !== callerId ? [approver] : []),
      ];
      const locked: string[] = [];
      for (const u of counted) {
        const failed = u.approval_pin_failed_count + 1;
        const lock =
          failed >= REAUTH_MAX_FAILURES ? new Date(now.getTime() + REAUTH_LOCK_MS) : null;
        await tx.query(
          `UPDATE app_user SET approval_pin_failed_count = $2, approval_pin_locked_until = $3 WHERE id = $1`,
          [u.id, lock ? 0 : failed, lock],
        );
        if (lock) locked.push(u.id);
        await this.audit.record(tx, {
          category: 'security',
          action: lock ? `${opts.purpose}.reauth_locked` : `${opts.purpose}.reauth_failed`,
          entityType: 'app_user',
          entityId: u.id,
          after: {
            authMethod: 'password',
            failedCount: failed,
            lockedUntil: lock ? lock.toISOString() : null,
            ...(u.id === callerId ? {} : { confirmingFor: callerId }),
          },
          ...(opts.requestId ? { requestId: opts.requestId } : {}),
        });
      }
      if (locked.length > 0 && opts.onLocked) await opts.onLocked(tx, locked);
      return { kind: 'failed' as const };
    });
    if (outcome.kind === 'ok') return outcome.user;
    if (outcome.kind === 'unauthenticated') throw problem('UNAUTHENTICATED');
    if (outcome.kind === 'locked') {
      throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(outcome.wait) } });
    }
    throw problem('REAUTH_FAILED', { errors: [{ field: opts.field, code: 'REAUTH_FAILED' }] });
  }
}
