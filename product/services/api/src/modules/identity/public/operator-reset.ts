/**
 * SEC 06.33 / BR-437 / ESC-027 B – "đường 3": the ONLY owner lost both the phone and the recovery codes.
 * There is NO HTTP endpoint: this function is run by OPS on the server through the admin command
 * (`src/admin/mfa-operator-reset-cli.ts`, wrapper `scripts/mfa-operator-reset.sh`). The identity-verification
 * procedure (who may run it, how the person is verified) is written by OPS, approved by SEC and kept OUTSIDE
 * this public repository – the repo only records that it exists.
 * Effect = owner reset (06.32): 2FA secret + pending secret destroyed (DEK crypto-shredded), recovery codes
 * removed, every session revoked, pending login challenges deleted, next sign-in must enrol again (restricted
 * session under MFA_ENFORCED). Audit security `mfa.reset_by_operator` (operator name, reason, verification
 * ticket reference – never identity documents) and an email to the person through the outbox.
 */
import { Logger } from '@nestjs/common';
import type { Clock } from '../../../clock';
import type { Database, TenantContext } from '../../../db/database';
import { AuditService } from '../../audit/public/audit.service';
import type { CryptoService } from '../../crypto/public/crypto.service';
import { defineAuditEntity } from '../../audit/public/audit-fields';
import { MfaStore } from './mfa-store';

defineAuditEntity('app_user', ['operator']);

export interface OperatorResetInput {
  username: string;
  /** Who runs the command (OPS person) – recorded in the audit row. */
  operator: string;
  /** Reference of the off-repo verification record (no personal data in it). */
  ticketRef: string;
  reason: string;
}

export async function resetMfaByOperator(
  db: Database,
  input: OperatorResetInput & { clock: Clock; crypto: CryptoService },
): Promise<{ reset: boolean; userId: string }> {
  for (const [k, v] of Object.entries({
    operator: input.operator,
    ticketRef: input.ticketRef,
    reason: input.reason,
  })) {
    if (!v || v.trim().length < 1 || v.length > 300) throw new Error(`${k} is required (≤ 300)`);
  }
  const found = await db.entry(async (tx) => {
    const r = await tx.query<{ user_id: string; organization_id: string }>(
      'SELECT user_id, organization_id FROM auth_find_user($1)',
      [input.username.trim().toLowerCase()],
    );
    return r.rows[0];
  });
  if (!found) throw new Error('user not found');
  const audit = new AuditService(input.clock, db);
  const store = new MfaStore(db, input.clock, input.crypto, audit);
  const system: TenantContext = {
    organizationId: found.organization_id,
    propertyId: null,
    userId: null,
    actorType: 'system',
  };
  const keyCtx = await store.keyContext(system, found.user_id);
  const pending = await db.withContext(keyCtx, async (tx) => {
    const u = await store.lockUser(tx, found.user_id);
    if (!u) throw new Error('user not found');
    if (!u.mfa_enabled && !u.mfa_secret_enc && !u.mfa_pending_secret_enc) return { reset: false };
    const cleared = await store.clear(tx, u, 'reset');
    await tx.query(
      `UPDATE user_session SET revoked_at = $2, revoked_reason = 'mfa_reset'
        WHERE user_id = $1 AND revoked_at IS NULL`,
      [u.id, input.clock.now()],
    );
    await tx.query(`DELETE FROM mfa_login_challenge WHERE user_id = $1`, [u.id]);
    await store.record(tx, 'mfa.reset_by_operator', u.id, {
      reason: input.reason,
      after: { operator: input.operator, ticketRef: input.ticketRef },
    });
    await store.notify(tx, u.id, 'mfa.reset_by_operator', { owners: true });
    await store.email(tx, 'mfa_reset_by_operator', u.id);
    return { reset: true, key: cleared.pendingKey };
  });
  if ('key' in pending && pending.key) {
    await store.destroyKeyLater(system, pending.key, found.user_id);
  }
  new Logger('OperatorReset').log(`mfa.reset_by_operator done reset=${pending.reset}`);
  return { reset: pending.reset, userId: found.user_id };
}
