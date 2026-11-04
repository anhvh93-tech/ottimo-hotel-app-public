/**
 * Staff security e-mail (R4 v1.0.3, BUG-R3-032, SEC-on-B2-readiness 1.5, OpenAPI 0.3.10; ARC v1.0.3-contract-email 3–4).
 * Shared by `setMyEmail` (via `self`) and `updateUser.email` (via `owner`):
 * - `check`: trim + lower case, V-03 → 422 EMAIL_INVALID; a shared mailbox (v1.0.4: EMAIL_SHARED_MAILBOXES +
 *   `info@`/`booking@` at the mail domains + EMAIL_FROM, compared without `+…` – shared-mailboxes.ts)
 *   → 422 EMAIL_SHARED_MAILBOX. Called BEFORE S2 (no factor burnt on a refused value, nothing counted).
 * - `recordChange`: in the business transaction, only when the value really changed –
 *   `user_email_change` row (old address kept until the notice to it is sent), audit security `user.email_changed`
 *   (masked only), in-app `account_security_change` to the person + the owners of the context property, outbox
 *   `staff.email` `email_changed` with ids only (dispatcher resolves new / previous / owner addresses at send time).
 *   No session is revoked.
 * - EM-09 (v1.0.4 P4-06, SEC FB-R4-SEC-ARC-EM-09, ARC plan v1.0.4 6.6): at most EMAIL_CHANGE_LIMIT.max real
 *   changes per person CHANGED (`user_email_change.user_id`, any `via`) in a sliding 24 h window. The 6th → 429
 *   RATE_LIMITED + Retry-After (seconds until the change that must leave the window does). Checked after RBAC and
 *   the address rules, BEFORE S2 (`assertChangeAllowed`, no factor burnt), and again in `recordChange` under the
 *   app_user row lock (two concurrent requests cannot both pass at 4). Same address (no-op) is never limited.
 *   Removal (`null`) is never refused (SEC FB-R4-SEC-BE-V104-01: an owner must be able to delete an address an
 *   attacker set 5 times) – it is still recorded and counted; it sends no notice to a new address.
 * A full address is never logged, audited, put in a Problem, a notification or the outbox.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { EMAIL_CHANGED_TEMPLATE, maskEmail, normalizeSecurityEmail } from '../../../shared/email';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';
import { notifyStaff } from '../../platform/public/staff-notify';
import { IDENTITY_OPTIONS, type IdentityOptions } from '../public/identity-options';
import { SharedMailboxRule } from '../public/shared-mailboxes';
import '../audit-entities';

export const EMAIL_CHANGED_EVENT = 'user.email_changed';

export type EmailChangeVia = 'self' | 'owner';

/** EM-09: real e-mail changes per person changed, sliding window (security constant – SEC EM-09). */
export const EMAIL_CHANGE_LIMIT = { max: 5, windowMs: 24 * 60 * 60_000 } as const;

@Injectable()
export class SecurityEmailService {
  private readonly sharedMailboxes: SharedMailboxRule;

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(IDENTITY_OPTIONS) options: IdentityOptions,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {
    this.sharedMailboxes = new SharedMailboxRule({
      sharedMailboxes: options.sharedMailboxes,
      emailFrom: options.emailFrom,
    });
  }

  /** Normalised address, or null (= remove). 422 EMAIL_INVALID / EMAIL_SHARED_MAILBOX on `field`. */
  check(field: string, raw: string | null): string | null {
    if (raw === null) return null;
    const email = normalizeSecurityEmail(raw);
    if (!email) {
      throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'EMAIL_INVALID' }] });
    }
    if (this.sharedMailboxes.isShared(email)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'EMAIL_SHARED_MAILBOX' }] });
    }
    return email;
  }

  /**
   * EM-09 before S2 (read-only transaction of the caller): 429 RATE_LIMITED when `email` would be a real change and
   * the person already had EMAIL_CHANGE_LIMIT.max changes in the window. Same address → never limited (200 no-op).
   */
  async assertChangeAllowed(tx: Tx, userId: string, email: string | null): Promise<void> {
    const { rows } = await tx.query<{ email: string | null }>(
      'SELECT email::text AS email FROM app_user WHERE id = $1',
      [userId],
    );
    if (rows[0] && SecurityEmailService.same(rows[0].email, email)) return;
    if (email === null) return; // SEC V104-01: removal is never limited (still counted)
    await this.assertWithinLimit(tx, userId);
  }

  private async assertWithinLimit(tx: Tx, userId: string): Promise<void> {
    const { max, windowMs } = EMAIL_CHANGE_LIMIT;
    const now = this.clock.now().getTime();
    const { rows } = await tx.query<{ changed_at: Date }>(
      `SELECT changed_at FROM user_email_change
        WHERE user_id = $1 AND changed_at > $2
        ORDER BY changed_at DESC
        LIMIT $3`,
      [userId, new Date(now - windowMs), max],
    );
    const leaving = rows[max - 1];
    if (!leaving) return;
    // The window drops below `max` when the max-th most recent change leaves it.
    const wait = Math.max(1, Math.ceil((leaving.changed_at.getTime() + windowMs - now) / 1000));
    throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(wait) } });
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
    // EM-09 again, inside the write transaction (callers hold the app_user row lock – setOwn / UsersService.load).
    if (input.newEmail !== null) await this.assertWithinLimit(tx, input.userId); // removal: SEC V104-01
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
