/**
 * Append-only audit writers (erd 4.3): audit_event and c3_access_log.
 * - `before`/`after` are reduced to the fields registered for the entity type (audit-fields.ts,
 *   SR-AUD-03): `_enc` columns and C3 values never go in; an unregistered entity type is refused.
 * - recordMoney(): the shared writer for money operations (US-006, BR-008, SR-AUD-01) – folio lines,
 *   discounts, FOC, payments, reversals, refunds, cancellation fees – with the document code shown in S27.
 * - Always written inside the caller's transaction (same commit as the change it records), except
 *   access.denied which is written in its own transaction because the request itself fails.
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import type { AuditCategory } from '../../../db/schema';
import type { GuardedRequest } from '../../../shared/http/auth.guard';
import { pickAuditFields } from './audit-fields';
import { isMoneyAuditAction } from './money-actions';

export interface AuditEntry {
  category: AuditCategory;
  action: string;
  entityType?: string;
  entityId?: string;
  /** Display code (OTM-00171, F26-000123…) shown in the S27 log. No C2/C3. */
  entityCode?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string;
  requestId?: string;
  sessionId?: string;
  trustedDeviceId?: string;
  ipHmac?: string;
}

export interface C3AccessEntry {
  subjectType:
    | 'guest_document'
    | 'document_image'
    | 'door_credential'
    | 'payee_account'
    | 'portal_data'
    | 'mfa_secret'
    // 0.3.6 (BE-B, SEC F8): refund destination account (D15).
    | 'refund_account';
  subjectId: string;
  action: 'view' | 'create' | 'update' | 'copy' | 'delete' | 'purge';
  reservationId?: string;
  reasonCode?: string;
  requestId?: string;
  sessionId?: string;
  trustedDeviceId?: string;
  ipHmac?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async record(tx: Tx, entry: AuditEntry): Promise<void> {
    // 0.3.6 bổ sung 2: `money` actions are a closed set (the money log has one sentence per action). Outside
    // production an unlisted action fails loudly (tests catch it); production keeps the audit row.
    if (
      entry.category === 'money' &&
      !isMoneyAuditAction(entry.action) &&
      process.env.NODE_ENV !== 'production'
    ) {
      throw new Error(`money audit action "${entry.action}" is not in the contract list`);
    }
    const { ctx } = tx;
    if (!ctx.organizationId) throw new Error('audit_event needs an organization context');
    const before = pickAuditFields(entry.entityType, entry.before);
    const after = pickAuditFields(entry.entityType, entry.after);
    await tx.query(
      `INSERT INTO audit_event (organization_id, property_id, occurred_at, actor_type, actor_user_id,
         category, action, entity_type, entity_id, before, after, reason, request_id, ip_hmac,
         session_id, trusted_device_id, entity_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        ctx.organizationId,
        ctx.propertyId,
        this.clock.now(),
        ctx.actorType,
        ctx.userId,
        entry.category,
        entry.action,
        entry.entityType ?? null,
        entry.entityId ?? null,
        before,
        after,
        entry.reason ?? null,
        entry.requestId ?? null,
        entry.ipHmac ?? null,
        entry.sessionId ?? null,
        entry.trustedDeviceId ?? null,
        entry.entityCode ?? null,
      ],
    );
  }

  /**
   * Money operation (category `money`): who (from the transaction context), when (Clock), before/after,
   * reason and the document code (BR-008, US-006 AC1). Same transaction as the money write.
   */
  async recordMoney(
    tx: Tx,
    entry: Omit<AuditEntry, 'category'> & { entityType: string; entityId: string },
  ): Promise<void> {
    await this.record(tx, { ...entry, category: 'money' });
  }

  /** Written BEFORE the C3 value is returned / in the same transaction as the C3 write (ADR-013). */
  async recordC3Access(tx: Tx, entry: C3AccessEntry): Promise<void> {
    const { ctx } = tx;
    if (!ctx.organizationId || !ctx.propertyId) {
      throw new Error('c3_access_log needs a property context');
    }
    await tx.query(
      `INSERT INTO c3_access_log (organization_id, property_id, occurred_at, actor_type, user_id,
         session_id, trusted_device_id, ip_hmac, subject_type, subject_id, reservation_id, action,
         reason_code, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        ctx.organizationId,
        ctx.propertyId,
        this.clock.now(),
        ctx.actorType,
        ctx.actorType === 'user' ? ctx.userId : null,
        entry.sessionId ?? null,
        entry.trustedDeviceId ?? null,
        entry.ipHmac ?? null,
        entry.subjectType,
        entry.subjectId,
        entry.reservationId ?? null,
        entry.action,
        entry.reasonCode ?? null,
        entry.requestId ?? null,
      ],
    );
  }

  /** access.denied in its own transaction (the failing request rolls back its own work). */
  async recordDenied(ctx: TenantContext, entry: Omit<AuditEntry, 'category'>): Promise<void> {
    await this.db.withContext(ctx, (tx) => this.record(tx, { ...entry, category: 'access' }));
  }
}

/** requestId / session / trusted device of a guarded request, for audit entries. */
export function auditContextOf(
  req: GuardedRequest,
): Pick<AuditEntry, 'requestId' | 'sessionId' | 'trustedDeviceId'> {
  const p = req.ottimoAuth?.principal;
  return {
    requestId: req.id,
    ...(p ? { sessionId: p.sessionId } : {}),
    ...(p?.trustedDeviceId ? { trustedDeviceId: p.trustedDeviceId } : {}),
  };
}
