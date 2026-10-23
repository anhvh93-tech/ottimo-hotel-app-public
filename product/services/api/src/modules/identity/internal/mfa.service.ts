/**
 * US-143 – 2FA of the signed-in user and the owner reset (OpenAPI 0.3.8 getMy2fa, startMy2faSetup, confirmMy2fa,
 * disableMy2fa, regenerateMyRecoveryCodes, resetUser2fa; SEC A.1–A.6).
 * - setup/confirm/regenerate have NO Idempotency-Key (SEC 06.9): a response holding the secret, the URI or the
 *   recovery codes is never stored. A repeated setup issues a NEW pending secret (the old QR dies); a repeated
 *   confirm answers 409 (already enabled).
 * - setup and confirm are allowed in the restricted session (SEC 06.4).
 * - Every transaction that reads/writes the secret runs in the DEK's property (MfaStore.keyContext).
 * - Failures that must be counted although the request fails (wrong TOTP at confirm – SR-RL-02) are committed
 *   in the use case's own transaction and the error is thrown afterwards.
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { CryptoService } from '../../crypto/public/crypto.service';
import { IDENTITY_OPTIONS, type IdentityOptions } from '../public/identity-options';
import { IdentityParamsService } from '../public/identity-params';
import { MFA_REQUIRED_ROLES, MfaStore, type MfaUserRow, secretAad } from '../public/mfa-store';
import { REAUTH_LOCK_MS, REAUTH_MAX_FAILURES } from '../public/password-reauth';
import { type ClientOrigin, type NewSession, SessionService } from '../public/session.service';
import {
  hashRecoveryCodes,
  matchTotp,
  newRecoveryCodes,
  newTotpSecret,
  otpauthUri,
} from '../public/totp';

/** Pending secret lifetime (erd 4.15, OpenAPI startMy2faSetup). */
export const MFA_PENDING_TTL_MS = 10 * 60_000;

export interface My2fa {
  enabled: boolean;
  required: boolean;
  enforced: boolean;
  pendingSetup: boolean;
  enrolledAt?: string;
  recoveryCodesRemaining?: number;
  soleOwner?: boolean;
}

@Injectable()
export class MfaService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(MfaStore) private readonly mfa: MfaStore,
    @Inject(CryptoService) private readonly crypto: CryptoService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(IdentityParamsService) private readonly identityParams: IdentityParamsService,
    @Inject(IDENTITY_OPTIONS) private readonly options: IdentityOptions,
  ) {}

  /** Roles of the user at every property (organisation-level RLS on user_property_role). */
  private async roles(tx: Tx, userId: string): Promise<string[]> {
    const { rows } = await tx.query<{ role: string }>(
      `SELECT DISTINCT role FROM user_property_role WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
    return rows.map((r) => r.role);
  }

  private async soleOwner(tx: Tx, userId: string): Promise<boolean> {
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(DISTINCT r.user_id)::int AS n FROM user_property_role r JOIN app_user o ON o.id = r.user_id
        WHERE r.role = 'owner' AND r.revoked_at IS NULL AND o.status <> 'disabled' AND r.user_id <> $1`,
      [userId],
    );
    return (rows[0]?.n ?? 0) === 0;
  }

  async status(ctx: TenantContext, userId: string): Promise<My2fa> {
    return this.db.withContext(
      ctx,
      async (tx) => {
        const { rows } = await tx.query<{
          mfa_enabled: boolean;
          mfa_pending_expires_at: Date | null;
          mfa_enrolled_at: Date | null;
          remaining: number;
        }>(
          `SELECT mfa_enabled, mfa_pending_expires_at, mfa_enrolled_at,
                  coalesce(cardinality(mfa_recovery_codes_hash), 0) AS remaining
             FROM app_user WHERE id = $1`,
          [userId],
        );
        const u = rows[0];
        if (!u) throw problem('UNAUTHENTICATED');
        const roles = await this.roles(tx, userId);
        const now = this.clock.now();
        return {
          enabled: u.mfa_enabled,
          required: roles.some((r) => (MFA_REQUIRED_ROLES as readonly string[]).includes(r)),
          enforced: this.options.mfaEnforced === true,
          pendingSetup:
            !u.mfa_enabled && !!u.mfa_pending_expires_at && u.mfa_pending_expires_at > now,
          ...(u.mfa_enrolled_at ? { enrolledAt: u.mfa_enrolled_at.toISOString() } : {}),
          ...(u.mfa_enabled ? { recoveryCodesRemaining: u.remaining } : {}),
          ...(roles.includes('owner') ? { soleOwner: await this.soleOwner(tx, userId) } : {}),
        };
      },
      { readOnly: true },
    );
  }

  /**
   * startMy2faSetup (SEC 06.7, 06.8, 06.11). currentPassword is checked by the controller (PasswordReauth,
   * SR-RL-02) before this. New 160-bit secret, sealed with a NEW DEK (the previous pending DEK is destroyed).
   */
  async startSetup(
    ctx: TenantContext,
    userId: string,
    meta: { requestId: string; sessionId: string },
  ): Promise<{ otpauthUri: string; expiresAt: Date }> {
    const keyCtx = await this.mfa.keyContext(ctx, userId);
    if (!keyCtx.propertyId) throw problem('FORBIDDEN_ACTION', { detail: 'no property' });
    return this.db.withContext(keyCtx, async (tx) => {
      const u = await this.mfa.lockUser(tx, userId);
      if (!u) throw problem('UNAUTHENTICATED');
      if (u.mfa_enabled) throw problem('INVALID_TRANSITION');
      if (u.mfa_data_key_id && u.mfa_key_property_id === keyCtx.propertyId) {
        await this.mfa.destroyKeyIn(tx, u.mfa_data_key_id, userId);
      }
      const now = this.clock.now();
      const expiresAt = new Date(now.getTime() + MFA_PENDING_TTL_MS);
      const secret = newTotpSecret();
      const sealed = await this.crypto.seal(
        tx,
        {
          purpose: 'mfa_secret',
          subjectId: userId,
          aad: secretAad(userId, 'mfa_pending_secret_enc'),
          expiresAt,
        },
        secret,
      );
      await tx.query(
        `UPDATE app_user SET mfa_pending_secret_enc = $2, mfa_pending_expires_at = $3, mfa_data_key_id = $4,
             mfa_key_property_id = $5, mfa_secret_enc = NULL
          WHERE id = $1`,
        [userId, sealed.ciphertext, expiresAt, sealed.dataKeyId, keyCtx.propertyId],
      );
      await this.audit.recordC3Access(tx, {
        subjectType: 'mfa_secret',
        subjectId: userId,
        action: 'create',
        requestId: meta.requestId,
        sessionId: meta.sessionId,
      });
      await this.mfa.record(tx, 'mfa.setup_started', userId, meta);
      const uri = otpauthUri(u.username, secret);
      secret.fill(0);
      return { otpauthUri: uri, expiresAt };
    });
  }

  /**
   * confirmMy2fa (SEC 06.10, 06.12): right TOTP of the pending secret → enabled, 10 recovery codes, every
   * session of the user revoked (also this one), a NEW full session for the calling client.
   */
  async confirm(
    ctx: TenantContext,
    input: { userId: string; sessionId: string; totpCode: string; requestId: string },
  ): Promise<{ recoveryCodes: string[]; session: NewSession }> {
    const keyCtx = await this.mfa.keyContext(ctx, input.userId);
    const { session: sessionPolicy } = await this.identityParams.forUser(ctx);
    const outcome = await this.db.withContext(keyCtx, async (tx) => {
      const u = await this.mfa.lockUser(tx, input.userId);
      if (!u || u.status !== 'active') return { kind: 'unauthenticated' as const };
      const now = this.clock.now();
      if (u.approval_pin_locked_until && u.approval_pin_locked_until > now) {
        const wait = Math.ceil((u.approval_pin_locked_until.getTime() - now.getTime()) / 1000);
        return { kind: 'locked' as const, wait };
      }
      if (u.mfa_enabled || !u.mfa_pending_expires_at || u.mfa_pending_expires_at <= now) {
        return { kind: 'conflict' as const };
      }
      const secret = await this.mfa.decryptSecret(tx, u, 'pending');
      if (!secret) return { kind: 'conflict' as const };
      const step = matchTotp(secret, input.totpCode, now, null);
      if (step === null) {
        secret.fill(0);
        await this.countFailure(tx, u, now, input.requestId);
        return { kind: 'wrong' as const };
      }
      const liveEnc = await this.crypto.encrypt(
        tx,
        u.mfa_data_key_id as string,
        secretAad(u.id, 'mfa_secret_enc'),
        secret,
      );
      secret.fill(0);
      const codes = newRecoveryCodes();
      await tx.query(
        `UPDATE app_user SET mfa_enabled = true, mfa_secret_enc = $2, mfa_pending_secret_enc = NULL,
             mfa_pending_expires_at = NULL, mfa_last_used_step = $3, mfa_recovery_codes_hash = $4,
             mfa_enrolled_at = $5, approval_pin_failed_count = 0, approval_pin_locked_until = NULL,
             roles_version = roles_version + 1, updated_at = $5, version = version + 1
          WHERE id = $1`,
        [u.id, liveEnc, step, hashRecoveryCodes(codes), now],
      );
      const { rows: cur } = await tx.query<{
        client_origin: ClientOrigin;
        active_property_id: string | null;
      }>(`SELECT client_origin, active_property_id FROM user_session WHERE id = $1`, [
        input.sessionId,
      ]);
      await this.sessions.revokeAll(tx, u.id, 'mfa_enrolled');
      const session = await this.sessions.create(tx, {
        userId: u.id,
        organizationId: u.organization_id,
        activePropertyId: cur[0]?.active_property_id ?? keyCtx.propertyId,
        clientOrigin: cur[0]?.client_origin ?? 'admin',
        policy: sessionPolicy,
        amr: 'totp',
      });
      // x-c3-log (0.3.8 BE-C fix): the recovery codes leave the server once.
      await this.audit.recordC3Access(tx, {
        subjectType: 'mfa_secret',
        subjectId: u.id,
        action: 'create',
        requestId: input.requestId,
        sessionId: session.id,
      });
      await this.mfa.record(tx, 'mfa.enrolled', u.id, {
        requestId: input.requestId,
        sessionId: session.id,
      });
      await this.mfa.notify(tx, u.id, 'mfa.enrolled');
      return { kind: 'ok' as const, codes, session };
    });
    switch (outcome.kind) {
      case 'ok':
        return { recoveryCodes: outcome.codes, session: outcome.session };
      case 'unauthenticated':
        throw problem('UNAUTHENTICATED');
      case 'locked':
        throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(outcome.wait) } });
      case 'conflict':
        throw problem('INVALID_TRANSITION');
      default:
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'totpCode', code: 'INVALID_CODE' }],
        });
    }
  }

  /** SR-RL-02 counter shared with PasswordReauth / StrongReauthService. */
  private async countFailure(tx: Tx, u: MfaUserRow, now: Date, requestId: string): Promise<void> {
    const failed = u.approval_pin_failed_count + 1;
    const lock = failed >= REAUTH_MAX_FAILURES ? new Date(now.getTime() + REAUTH_LOCK_MS) : null;
    await tx.query(
      `UPDATE app_user SET approval_pin_failed_count = $2, approval_pin_locked_until = $3 WHERE id = $1`,
      [u.id, lock ? 0 : failed, lock],
    );
    await this.mfa.record(tx, 'mfa.verify_failed', u.id, { requestId });
  }

  /** Pre-check for the S2 operations that need an enrolled user (regenerate) or a voluntary one (disable). */
  async assertState(
    ctx: TenantContext,
    userId: string,
    need: 'disable' | 'regenerate',
  ): Promise<void> {
    const { enabled, roles } = await this.db.withContext(
      ctx,
      async (tx) => {
        const { rows } = await tx.query<{ mfa_enabled: boolean }>(
          'SELECT mfa_enabled FROM app_user WHERE id = $1',
          [userId],
        );
        return { enabled: rows[0]?.mfa_enabled === true, roles: await this.roles(tx, userId) };
      },
      { readOnly: true },
    );
    if (
      need === 'disable' &&
      roles.some((r) => (MFA_REQUIRED_ROLES as readonly string[]).includes(r))
    ) {
      throw problem('FORBIDDEN_ACTION', { detail: 'mandatory role' });
    }
    if (!enabled) throw problem('INVALID_TRANSITION');
  }

  /** disableMy2fa (SEC 06.25) after S2: clear everything, revoke every session (also this one). */
  async disable(ctx: TenantContext, userId: string, requestId: string): Promise<void> {
    const keyCtx = await this.mfa.keyContext(ctx, userId);
    await this.db.withContext(keyCtx, async (tx) => {
      const u = await this.mfa.lockUser(tx, userId);
      if (!u || !u.mfa_enabled) throw problem('INVALID_TRANSITION');
      const roles = await this.roles(tx, userId);
      if (roles.some((r) => (MFA_REQUIRED_ROLES as readonly string[]).includes(r))) {
        throw problem('FORBIDDEN_ACTION', { detail: 'mandatory role' });
      }
      await this.mfa.clear(tx, u, 'disabled');
      await this.sessions.revokeAll(tx, userId, 'mfa_disabled');
      await this.mfa.record(tx, 'mfa.disabled', userId, { requestId });
      await this.mfa.notify(tx, userId, 'mfa.disabled');
    });
  }

  /** regenerateMyRecoveryCodes (SEC 06.16) after S2: the old set dies now. */
  async regenerate(ctx: TenantContext, userId: string, requestId: string): Promise<string[]> {
    return this.db.withContext(ctx, async (tx) => {
      const codes = newRecoveryCodes();
      const r = await tx.query(
        `UPDATE app_user SET mfa_recovery_codes_hash = $2 WHERE id = $1 AND mfa_enabled`,
        [userId, hashRecoveryCodes(codes)],
      );
      if ((r.rowCount ?? 0) !== 1) throw problem('INVALID_TRANSITION');
      await this.audit.recordC3Access(tx, {
        subjectType: 'mfa_secret',
        subjectId: userId,
        action: 'create',
        requestId,
      });
      await this.mfa.record(tx, 'mfa.recovery_codes_regenerated', userId, { requestId });
      await this.mfa.notify(tx, userId, 'mfa.recovery_codes_regenerated');
      return codes;
    });
  }

  /**
   * resetUser2fa (SEC 06.32) inside the unit of work: the caller must own every property of the person
   * (same rule as updateUser – FB-R2-SEC-BE-07); clears 2FA, revokes every session; audit + notify + email.
   * Returns a DEK of another property to destroy after the unit of work.
   */
  async resetByOwner(
    tx: Tx,
    input: {
      ownerId: string;
      targetId: string;
      reason: string;
      requestId: string;
      owned: string[];
    },
  ): Promise<{ pendingKey: { dataKeyId: string; propertyId: string } | null }> {
    if (input.targetId === input.ownerId) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'userId', code: 'NOT_ALLOWED' }] });
    }
    const { rows: vis } = await tx.query<{ id: string }>(
      `SELECT u.id FROM app_user u
        WHERE u.id = $1 AND EXISTS (SELECT 1 FROM user_property_role r
                                     WHERE r.user_id = u.id AND r.property_id = ANY($2::uuid[]))`,
      [input.targetId, input.owned],
    );
    if (!vis[0]) throw problem('NOT_FOUND');
    const { rows: other } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM user_property_role
        WHERE user_id = $1 AND revoked_at IS NULL AND NOT (property_id = ANY($2::uuid[]))`,
      [input.targetId, input.owned],
    );
    if ((other[0]?.n ?? 0) > 0) throw problem('FORBIDDEN_ACTION', { detail: 'other property' });
    const u = await this.mfa.lockUser(tx, input.targetId);
    if (!u) throw problem('NOT_FOUND');
    if (!u.mfa_enabled) throw problem('INVALID_TRANSITION');
    const cleared = await this.mfa.clear(tx, u, 'reset');
    await this.sessions.revokeAll(tx, u.id, 'mfa_reset');
    await this.mfa.record(tx, 'mfa.reset_by_owner', u.id, {
      requestId: input.requestId,
      reason: input.reason,
      after: { targetUserId: u.id },
    });
    await this.mfa.notify(tx, u.id, 'mfa.reset_by_owner', { owners: true });
    await this.mfa.email(tx, 'mfa_reset', u.id, { owners: true });
    return cleared;
  }
}
