/**
 * Append-only audit writers (erd 4.3): audit_event and c3_access_log.
 * - Callers pass `before`/`after` already reduced to the entity's allowlisted fields (SR-AUD-03):
 *   `_enc` columns and C3 values never go in. This service adds no fields of its own.
 * - Always written inside the caller's transaction (same commit as the change it records), except
 *   access.denied which is written in its own transaction because the request itself fails.
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import type { AuditCategory } from '../../../db/schema';

export interface AuditEntry {
  category: AuditCategory;
  action: string;
  entityType?: string;
  entityId?: string;
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
    | 'mfa_secret';
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
    const { ctx } = tx;
    if (!ctx.organizationId) throw new Error('audit_event needs an organization context');
    await tx.query(
      `INSERT INTO audit_event (organization_id, property_id, occurred_at, actor_type, actor_user_id,
         category, action, entity_type, entity_id, before, after, reason, request_id, ip_hmac,
         session_id, trusted_device_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
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
        entry.before ?? null,
        entry.after ?? null,
        entry.reason ?? null,
        entry.requestId ?? null,
        entry.ipHmac ?? null,
        entry.sessionId ?? null,
        entry.trustedDeviceId ?? null,
      ],
    );
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
