/**
 * Staff security e-mail (R4 v1.0.3, BUG-R3-032, SEC-on-B2-readiness 1.5, OpenAPI 0.3.10; ARC v1.0.3-contract-email 3–4).
 * Shared by `setMyEmail` (via `self`) and `updateUser.email` (via `owner`):
 * - `check`: trim + lower case, V-03 → 422 EMAIL_INVALID; the server's sending mailbox (EMAIL_FROM, the shared
 *   `info@` box) → 422 EMAIL_SHARED_MAILBOX. Called BEFORE S2 (no factor burnt on a refused value, nothing counted).
 * - `recordChange`: in the business transaction, only when the value really changed –
 *   `user_email_change` row (old address kept until the notice to it is sent), audit security `user.email_changed`
 *   (masked only), in-app `account_security_change` to the person + the owners of the context property, outbox
 *   `staff.email` `email_changed` with ids only (dispatcher resolves new / previous / owner addresses at send time).
 *   No session is revoked.
 * A full address is never logged, audited, put in a Problem, a notification or the outbox.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import {
  EMAIL_CHANGED_TEMPLATE,
  mailboxAddress,
  maskEmail,
  normalizeSecurityEmail,
} from '../../../shared/email';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';
import { notifyStaff } from '../../platform/public/staff-notify';
import { IDENTITY_OPTIONS, type IdentityOptions } from '../public/identity-options';
import '../audit-entities';

export const EMAIL_CHANGED_EVENT = 'user.email_changed';

export type EmailChangeVia = 'self' | 'owner';

@Injectable()
export class SecurityEmailService {
  private readonly sharedMailbox: string | null;

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(IDENTITY_OPTIONS) options: IdentityOptions,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {
    this.sharedMailbox = mailboxAddress(options.emailFrom);
  }

  /** Normalised address, or null (= remove). 422 EMAIL_INVALID / EMAIL_SHARED_MAILBOX on `field`. */
  check(field: string, raw: string | null): string | null {
    if (raw === null) return null;
    const email = normalizeSecurityEmail(raw);
    if (!email) {
      throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'EMAIL_INVALID' }] });
    }
    if (this.sharedMailbox && email === this.sharedMailbox) {
      throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'EMAIL_SHARED_MAILBOX' }] });
    }
    return email;
  }

  /** Same address? (citext semantics: case-insensitive; null = null). */
  static same(a: string | null | undefined, b: string | null | undefined): boolean {
    return (a ?? null)?.toLowerCase() === (b ?? null)?.toLowerCase();
  }

  /**
   * setMyEmail: lock the caller's row, no-op when equal (no audit, no e-mail, no version bump), otherwise write the
   * column (+ version) and the side effects.
   */
  async setOwn(
    tx: Tx,
    userId: string,
    email: string | null,
    meta: { requestId: string; sessionId?: string },
  ): Promise<{ email: string | null }> {
    const { rows } = await tx.query<{ email: string | null }>(
      'SELECT email::text AS email FROM app_user WHERE id = $1 FOR UPDATE',
      [userId],
    );
    const row = rows[0];
    if (!row) throw problem('UNAUTHENTICATED');
    if (SecurityEmailService.same(row.email, email)) return { email: row.email };
    await tx.query(
      'UPDATE app_user SET email = $2, version = version + 1, updated_at = $3 WHERE id = $1',
      [userId, email, this.clock.now()],
    );
    await this.recordChange(tx, {
      userId,
      oldEmail: row.email,
      newEmail: email,
      changedBy: userId,
      via: 'self',
      ...meta,
    });
    return { email };
  }

  /** Side effects of a real change (the caller has already written app_user.email). */
  async recordChange(
    tx: Tx,
    input: {
      userId: string;
      oldEmail: string | null;
      newEmail: string | null;
      changedBy: string;
      via: EmailChangeVia;
      requestId: string;
      sessionId?: string;
    },
  ): Promise<string> {
    const now = this.clock.now();
    const changeId = uuidv7();
    await tx.query(
      `INSERT INTO user_email_change (id, organization_id, user_id, old_email, changed_by, via, changed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        changeId,
        tx.ctx.organizationId,
        input.userId,
        input.oldEmail,
        input.changedBy,
        input.via,
        now,
      ],
    );
    await this.audit.record(tx, {
      category: 'security',
      action: EMAIL_CHANGED_EVENT,
      entityType: 'app_user',
      entityId: input.userId,
      before: { emailMasked: maskEmail(input.oldEmail) },
      after: { emailMasked: maskEmail(input.newEmail), via: input.via },
      requestId: input.requestId,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    });
    // In-app: the person + the owners of the context property (same rule as MfaStore.notify – needs a property).
    if (tx.ctx.propertyId) {
      await notifyStaff(
        tx,
        this.events,
        {
          kind: 'account_security_change',
          userIds: [input.userId],
          roles: ['owner'],
          refType: 'user',
          refId: input.userId,
          refCode: EMAIL_CHANGED_EVENT,
        },
        now,
      );
    }
    // E-mail: ids only – the dispatcher reads the new address (app_user), the old one (user_email_change) and the
    // owners' addresses when it sends (one copy per address).
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'staff.email', $4, $5)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        JSON.stringify({
          template: EMAIL_CHANGED_TEMPLATE,
          userIds: [input.userId],
          owners: true,
          emailChangeId: changeId,
        }),
        `email:${EMAIL_CHANGED_TEMPLATE}:${changeId}`,
      ],
    );
    return changeId;
  }
}
