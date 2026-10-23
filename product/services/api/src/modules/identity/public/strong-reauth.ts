/**
 * S2 step-up (OpenAPI 0.3.8 `StrongReauth`, SEC A.5 06.23–06.28, ARC s1-contracts 1.2) – the ONE server
 * function every operation marked `x-strong-reauth` calls (other modules through `identity/public`).
 * - Proof sent IN the request, checked once, no window, not reusable: TOTP anti-replay by step, a recovery code
 *   is consumed. Two S2 operations in the same 30 s therefore need the code of the next step.
 * - Caller with 2FA: password + exactly one of totpCode / recoveryCode. Missing factor → 422 VALIDATION_FAILED
 *   `STRONG_REAUTH_REQUIRED` (not counted). Caller without 2FA (only possible while MFA_ENFORCED = false, or a
 *   voluntary role): password alone.
 * - Any wrong element → the SAME 401 REAUTH_FAILED (never says which factor), counted on the SR-RL-02 counter
 *   shared with PasswordReauth (app_user.approval_pin_*): 5 → 15 min → 429. The factor is only checked when the
 *   password is right, so a wrong password never burns a recovery code.
 * - Own transaction (counted although the request fails) – call it BEFORE UnitOfWork.run, like PasswordReauth.
 * - Audit security `stepup.s2_granted` / `stepup.s2_failed` with the operationId, never a value.
 */
import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { MfaStore, type SecondFactor } from './mfa-store';
import { REAUTH_LOCK_MS, REAUTH_MAX_FAILURES } from './password-reauth';
import { verifyPassword } from './passwords';

/** OpenAPI `StrongReauth` body (0.3.8) – parse it with the operation's schema, then call `verify`. */
export const strongReauthSchema = z
  .object({
    password: z.string().min(1).max(256),
    totpCode: z
      .string()
      .regex(/^[0-9]{6}$/)
      .optional(),
    recoveryCode: z
      .string()
      .regex(/^[0-9A-Za-z]{4}[- ]?[0-9A-Za-z]{4}[- ]?[0-9A-Za-z]{4}[- ]?[0-9A-Za-z]{4}$/)
      .optional(),
  })
  .strict();

export interface StrongReauthInput {
  password?: string | undefined;
  totpCode?: string | undefined;
  recoveryCode?: string | undefined;
}

export interface StrongReauthOptions {
  /** OpenAPI operationId (audit + documentation list `STRONG_REAUTH_OPERATIONS`). */
  operationId: string;
  /** Field reported on 401 / missing password (default `reauth`). */
  passwordField?: string;
  /** Field reported when the second factor is missing (default `<passwordField>.totpCode`). */
  factorField?: string;
  requestId?: string;
  sessionId?: string;
}

export interface StrongReauthResult {
  method: 'password' | SecondFactor;
  mfaEnabled: boolean;
}

/**
 * Operations that call StrongReauthService (OpenAPI `x-strong-reauth`, ARC 1.2). Kept in code and compared with
 * the spec by test/be-c-r3-s1-units.test.ts. `setParameter` (payment_receiving_account), `cancelScheduledParameter`
 * are wired by BE-B (R3-Q51) – listed here as owned by identity's contract list.
 */
export const STRONG_REAUTH_OPERATIONS = [
  'createUser',
  'updateUser',
  'setUserRoles',
  'trustCurrentDevice',
  'revokeTrustedDevice',
  'changeMyPassword',
  'disableMy2fa',
  'regenerateMyRecoveryCodes',
  'resetUser2fa',
  'cancelScheduledParameter',
  'setParameter',
] as const;

@Injectable()
export class StrongReauthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(MfaStore) private readonly mfa: MfaStore,
  ) {}

  async verify(
    ctx: TenantContext,
    input: StrongReauthInput | undefined,
    opts: StrongReauthOptions,
  ): Promise<StrongReauthResult> {
    const userId = ctx.userId;
    if (!userId) throw problem('UNAUTHENTICATED');
    const passwordField = opts.passwordField ?? 'reauth';
    const factorField = opts.factorField ?? `${passwordField}.totpCode`;
    if (!input || typeof input.password !== 'string' || input.password.length === 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: passwordField, code: 'STRONG_REAUTH_REQUIRED' }],
      });
    }
    if (input.totpCode !== undefined && input.recoveryCode !== undefined) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: factorField, code: 'INVALID_FORMAT' }],
      });
    }
    const keyCtx = await this.mfa.keyContext(ctx, userId);
    const outcome = await this.db.withContext(keyCtx, async (tx) => {
      const u = await this.mfa.lockUser(tx, userId);
      if (!u || u.status !== 'active') return { kind: 'unauthenticated' as const };
      const now = this.clock.now();
      if (u.approval_pin_locked_until && u.approval_pin_locked_until > now) {
        const wait = Math.ceil((u.approval_pin_locked_until.getTime() - now.getTime()) / 1000);
        return { kind: 'locked' as const, wait };
      }
      if (u.mfa_enabled && input.totpCode === undefined && input.recoveryCode === undefined) {
        return { kind: 'factor_missing' as const };
      }
      const passwordOk = await verifyPassword(u.password_hash, input.password as string);
      let factor: Awaited<ReturnType<MfaStore['consumeSecondFactor']>> = null;
      if (passwordOk && u.mfa_enabled) factor = await this.mfa.consumeSecondFactor(tx, u, input);
      const ok = passwordOk && (!u.mfa_enabled || factor !== null);
      const extra = {
        ...(opts.requestId ? { requestId: opts.requestId } : {}),
        ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
      };
      if (ok) {
        if (u.approval_pin_failed_count > 0 || u.approval_pin_locked_until) {
          await tx.query(
            `UPDATE app_user SET approval_pin_failed_count = 0, approval_pin_locked_until = NULL WHERE id = $1`,
            [userId],
          );
        }
        const method: StrongReauthResult['method'] = factor?.method ?? 'password';
        await this.mfa.record(tx, 'stepup.s2_granted', userId, {
          ...extra,
          after: { operationId: opts.operationId, method },
        });
        if (factor?.method === 'recovery_code') {
          await this.mfa.recoveryCodeUsed(tx, userId, factor.recoveryCodesRemaining ?? 0, {
            ...extra,
            channel: 'step_up',
          });
        }
        return { kind: 'ok' as const, result: { method, mfaEnabled: u.mfa_enabled } };
      }
      const failed = u.approval_pin_failed_count + 1;
      const lock = failed >= REAUTH_MAX_FAILURES ? new Date(now.getTime() + REAUTH_LOCK_MS) : null;
      await tx.query(
        `UPDATE app_user SET approval_pin_failed_count = $2, approval_pin_locked_until = $3 WHERE id = $1`,
        [userId, lock ? 0 : failed, lock],
      );
      await this.mfa.record(tx, 'stepup.s2_failed', userId, {
        ...extra,
        after: { operationId: opts.operationId },
      });
      if (lock) await this.mfa.notify(tx, userId, 'stepup.s2_failed', { kind: 'security_alert' });
      return { kind: 'failed' as const };
    });
    switch (outcome.kind) {
      case 'ok':
        return outcome.result;
      case 'unauthenticated':
        throw problem('UNAUTHENTICATED');
      case 'locked':
        throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(outcome.wait) } });
      case 'factor_missing':
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: factorField, code: 'STRONG_REAUTH_REQUIRED' }],
        });
      default:
        throw problem('REAUTH_FAILED', {
          errors: [{ field: passwordField, code: 'REAUTH_FAILED' }],
        });
    }
  }
}
