/**
 * 2FA state of a user (US-143, SR-AUTH-06, erd 4.15) – the ONE place that reads the TOTP secret and consumes a
 * second factor (login step 2, S2 step-up, enrolment). Used by AuthService, the 2FA endpoints and
 * StrongReauthService; other modules go through StrongReauthService / PasswordReauth only.
 * - Secret: C3, envelope-encrypted with ONE DEK per enrolment (purpose `mfa_secret`). data_key is property-level
 *   RLS, so the DEK lives under `app_user.mfa_key_property_id`; every transaction that decrypts it runs with that
 *   property in its context (`keyContext`).
 * - TOTP anti-replay (SEC 06.18): `mfa_last_used_step` only increases, in ONE conditional UPDATE – two requests
 *   with the same code: exactly one wins.
 * - Recovery code (SEC 06.14): removed from the hash array in ONE `UPDATE … WHERE $hash = ANY(…)` – atomic.
 * - Never logs, audits or returns a code, the secret, the URI or the mfaToken (SEC 06.22).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import { defineAuditEntity } from '../../audit/public/audit-fields';
import { AuditService } from '../../audit/public/audit.service';
import { CryptoService, type FieldAad } from '../../crypto/public/crypto.service';
import { EventsService } from '../../events/public/events.service';
import { notifyStaff } from '../../platform/public/staff-notify';
import { matchTotp, normaliseRecoveryCode, recoveryCodeHash, RECOVERY_CODES_LOW } from './totp';

defineAuditEntity('app_user', [
  'amr',
  'method',
  'operationId',
  'recoveryCodesRemaining',
  'targetUserId',
  'ticketRef',
  'channel',
]);

/** Columns the 2FA code reads (FOR UPDATE where it changes them). */
export interface MfaUserRow {
  id: string;
  username: string;
  organization_id: string;
  password_hash: string;
  status: string;
  mfa_enabled: boolean;
  mfa_secret_enc: Buffer | null;
  mfa_pending_secret_enc: Buffer | null;
  mfa_pending_expires_at: Date | null;
  mfa_data_key_id: string | null;
  mfa_key_property_id: string | null;
  mfa_last_used_step: string | number | null;
  mfa_recovery_codes_hash: string[] | null;
  mfa_enrolled_at: Date | null;
  approval_pin_failed_count: number;
  approval_pin_locked_until: Date | null;
}

export const MFA_USER_COLUMNS = `id, username, organization_id, password_hash, status, mfa_enabled, mfa_secret_enc,
  mfa_pending_secret_enc, mfa_pending_expires_at, mfa_data_key_id, mfa_key_property_id, mfa_last_used_step,
  mfa_recovery_codes_hash, mfa_enrolled_at, approval_pin_failed_count, approval_pin_locked_until`;

export type SecondFactor = 'totp' | 'recovery_code';

/** Security events of SEC 06.34 (audit_event category security). */
export type MfaSecurityEvent =
  | 'mfa.setup_started'
  | 'mfa.enrolled'
  | 'mfa.verify_failed'
  | 'mfa.locked'
  | 'mfa.recovery_code_used'
  | 'mfa.recovery_codes_regenerated'
  | 'mfa.disabled'
  | 'mfa.reset_by_owner'
  | 'mfa.reset_by_operator'
  | 'stepup.s2_granted'
  | 'stepup.s2_failed';

export function secretAad(
  userId: string,
  column: 'mfa_secret_enc' | 'mfa_pending_secret_enc',
): FieldAad {
  return { table: 'app_user', column, recordId: userId };
}

/** Roles that make 2FA mandatory (SEC 06.2). */
export const MFA_REQUIRED_ROLES = ['owner', 'manager'] as const;

@Injectable()
export class MfaStore {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(CryptoService) private readonly crypto: CryptoService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /**
   * Context for a transaction that may decrypt the user's secret: organisation of `ctx`, property = the DEK's
   * property (else `ctx.propertyId`, else the user's first property with a live role).
   */
  async keyContext(ctx: TenantContext, userId: string): Promise<TenantContext> {
    const prop = await this.db.withContext(
      { ...ctx, propertyId: null },
      async (tx) => {
        const { rows } = await tx.query<{
          key_property: string | null;
          first_property: string | null;
        }>(
          `SELECT u.mfa_key_property_id AS key_property,
                  (SELECT r.property_id FROM user_property_role r JOIN property p ON p.id = r.property_id
                    WHERE r.user_id = u.id AND r.revoked_at IS NULL ORDER BY p.code LIMIT 1) AS first_property
             FROM app_user u WHERE u.id = $1`,
          [userId],
        );
        const r = rows[0];
        return r ? (r.key_property ?? ctx.propertyId ?? r.first_property) : ctx.propertyId;
      },
      { readOnly: true },
    );
    return { ...ctx, propertyId: prop ?? null };
  }

  async lockUser(tx: Tx, userId: string): Promise<MfaUserRow | undefined> {
    const { rows } = await tx.query<MfaUserRow>(
      `SELECT ${MFA_USER_COLUMNS} FROM app_user WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    return rows[0];
  }

  async decryptSecret(tx: Tx, u: MfaUserRow, which: 'live' | 'pending'): Promise<Buffer | null> {
    const enc = which === 'live' ? u.mfa_secret_enc : u.mfa_pending_secret_enc;
    if (!enc || !u.mfa_data_key_id) return null;
    if (tx.ctx.propertyId !== u.mfa_key_property_id) {
      throw new Error('2FA secret read outside its key property context');
    }
    return this.crypto.decrypt(
      tx,
      u.mfa_data_key_id,
      secretAad(u.id, which === 'live' ? 'mfa_secret_enc' : 'mfa_pending_secret_enc'),
      enc,
    );
  }

  /**
   * Check and CONSUME a second factor of an enrolled user (the row should be locked by the caller). Exactly one
   * of `totpCode`, `recoveryCode`. Returns the method, or null for any failure (wrong, replayed, already used).
   */
  async consumeSecondFactor(
    tx: Tx,
    u: MfaUserRow,
    input: { totpCode?: string | undefined; recoveryCode?: string | undefined },
  ): Promise<{ method: SecondFactor; recoveryCodesRemaining?: number } | null> {
    if (!u.mfa_enabled) return null;
    if (input.totpCode !== undefined) {
      const secret = await this.decryptSecret(tx, u, 'live');
      if (!secret) return null;
      const last = u.mfa_last_used_step === null ? null : Number(u.mfa_last_used_step);
      const step = matchTotp(secret, input.totpCode, this.clock.now(), last);
      secret.fill(0);
      if (step === null) return null;
      const r = await tx.query(
        `UPDATE app_user SET mfa_last_used_step = $2
          WHERE id = $1 AND mfa_enabled AND (mfa_last_used_step IS NULL OR mfa_last_used_step < $2)`,
        [u.id, step],
      );
      if ((r.rowCount ?? 0) !== 1) return null;
      u.mfa_last_used_step = step;
      return { method: 'totp' };
    }
    if (input.recoveryCode !== undefined) {
      const norm = normaliseRecoveryCode(input.recoveryCode);
      if (!norm) return null;
      const { rows } = await tx.query<{ remaining: number }>(
        `UPDATE app_user SET mfa_recovery_codes_hash = array_remove(mfa_recovery_codes_hash, $2)
          WHERE id = $1 AND mfa_enabled AND $2 = ANY(mfa_recovery_codes_hash)
          RETURNING coalesce(cardinality(mfa_recovery_codes_hash), 0) AS remaining`,
        [u.id, recoveryCodeHash(norm)],
      );
      const row = rows[0];
      if (!row) return null;
      return { method: 'recovery_code', recoveryCodesRemaining: row.remaining };
    }
    return null;
  }

  /** Security audit row (SEC 06.34) – never with a code/secret. */
  async record(
    tx: Tx,
    action: MfaSecurityEvent,
    userId: string,
    extra: {
      requestId?: string;
      sessionId?: string;
      after?: Record<string, unknown>;
      reason?: string;
    } = {},
  ): Promise<void> {
    await this.audit.record(tx, {
      category: 'security',
      action,
      entityType: 'app_user',
      entityId: userId,
      ...(extra.after ? { after: extra.after } : {}),
      ...(extra.reason ? { reason: extra.reason } : {}),
      ...(extra.requestId ? { requestId: extra.requestId } : {}),
      ...(extra.sessionId ? { sessionId: extra.sessionId } : {}),
    });
  }

  /**
   * In-app notification `account_security_change` (SR-AUTH-07 / SEC 06.34) to the user and, when `owners`,
   * every owner of the context property; `refCode` = the event (no code, no name). Needs a property context.
   */
  async notify(
    tx: Tx,
    userId: string,
    event: MfaSecurityEvent,
    opts: { owners?: boolean; kind?: 'account_security_change' | 'security_alert' } = {},
  ): Promise<void> {
    if (!tx.ctx.propertyId) return;
    await notifyStaff(
      tx,
      this.events,
      {
        kind: opts.kind ?? 'account_security_change',
        userIds: [userId],
        ...(opts.owners ? { roles: ['owner'] } : {}),
        refType: 'user',
        refId: userId,
        refCode: event,
      },
      this.clock.now(),
    );
  }

  /**
   * Email (SEC 06.15, 06.33) through the outbox, topic `staff.email` – ids and a template name only; the
   * dispatcher (INT/BE-D, US-141 mock adapter) resolves the addresses. [GIẢ ĐỊNH – ARC s1-contracts R2.]
   */
  async email(
    tx: Tx,
    template: 'mfa_recovery_code_used' | 'mfa_reset' | 'mfa_reset_by_operator',
    userId: string,
    opts: { owners?: boolean } = {},
  ): Promise<void> {
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'staff.email', $4, $5)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        JSON.stringify({ template, userIds: [userId], owners: opts.owners === true }),
        `email:${template}:${userId}:${uuidv7()}`,
      ],
    );
  }

  /** A recovery code was used (login step 2 or S2): audit + notify user and owners + email (SEC 06.15). */
  async recoveryCodeUsed(
    tx: Tx,
    userId: string,
    remaining: number,
    extra: { requestId?: string; sessionId?: string; channel: 'login' | 'step_up' },
  ): Promise<void> {
    await this.record(tx, 'mfa.recovery_code_used', userId, {
      ...extra,
      after: { recoveryCodesRemaining: remaining, channel: extra.channel },
    });
    await this.notify(tx, userId, 'mfa.recovery_code_used', { owners: true });
    await this.email(tx, 'mfa_recovery_code_used', userId, { owners: true });
  }

  /**
   * Remove every 2FA trace of a user (disable, owner reset, operator reset – SEC 06.25/06.32/06.33): secret and
   * pending secret (DEK destroyed – crypto-shredding), recovery codes, anti-replay step. Caller revokes sessions.
   */
  async clear(
    tx: Tx,
    u: MfaUserRow,
    reason: 'disabled' | 'reset',
  ): Promise<{ pendingKey: { dataKeyId: string; propertyId: string } | null }> {
    let pendingKey: { dataKeyId: string; propertyId: string } | null = null;
    if (u.mfa_data_key_id && u.mfa_key_property_id) {
      if (tx.ctx.propertyId === u.mfa_key_property_id) {
        await this.destroyKeyIn(tx, u.mfa_data_key_id, u.id);
      } else {
        // The ciphertexts are NULLed below; the DEK of another property is destroyed after this transaction.
        pendingKey = { dataKeyId: u.mfa_data_key_id, propertyId: u.mfa_key_property_id };
      }
    }
    await tx.query(
      `UPDATE app_user SET mfa_enabled = false, mfa_secret_enc = NULL, mfa_pending_secret_enc = NULL,
           mfa_pending_expires_at = NULL, mfa_data_key_id = NULL, mfa_key_property_id = NULL,
           mfa_recovery_codes_hash = NULL, mfa_last_used_step = NULL, mfa_enrolled_at = NULL,
           mfa_reset_at = CASE WHEN $2 THEN $3 ELSE mfa_reset_at END,
           roles_version = roles_version + 1, updated_at = $3, version = version + 1
        WHERE id = $1`,
      [u.id, reason === 'reset', this.clock.now()],
    );
    return { pendingKey };
  }

  async destroyKeyIn(tx: Tx, dataKeyId: string, userId: string): Promise<void> {
    await this.crypto.destroy(tx, dataKeyId, {
      subjectType: 'app_user',
      subjectId: userId,
      policyKey: 'mfa_reset',
    });
  }

  /** Destroy a DEK left by `clear` (own transaction in the key's property – call after the unit of work). */
  async destroyKeyLater(
    ctx: TenantContext,
    key: { dataKeyId: string; propertyId: string },
    userId: string,
  ): Promise<void> {
    await this.db.withContext({ ...ctx, propertyId: key.propertyId }, (tx) =>
      this.destroyKeyIn(tx, key.dataKeyId, userId),
    );
  }

  /** Me / getMy2fa helpers. */
  static recoveryCodesLow(remaining: number, enabled: boolean): boolean {
    return enabled && remaining <= RECOVERY_CODES_LOW;
  }
}
