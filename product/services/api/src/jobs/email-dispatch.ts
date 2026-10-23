/**
 * Staff e-mail dispatcher (INT R3 – outbox topic `staff.email`, SEC 06.15 / 06.33 / Q51-6; ARC s1-contracts R2).
 * Writers put ids + a template name in the outbox inside their business transaction (mfa-store.email, …); this
 * worker resolves the addresses at send time (never stored in the outbox) and sends through the e-mail adapter
 * (SMTP Google Workspace in production, mock elsewhere).
 *
 * Per property, every worker tick:
 *   tx 1  claim ≤ batch rows FOR UPDATE SKIP LOCKED → status in_flight, attempts+1, lease (next_attempt_at)
 *         + resolve recipients and render parameters
 *   —     send outside any transaction (SMTP can take seconds; no DB lock is held meanwhile)
 *   tx 2  done | failed (back-off) | dead; recipients already served are kept in payload.sentUserIds, so a retry
 *         never e-mails them twice. A crash between tx 1 and tx 2 leaves the row in_flight: it is taken again
 *         when the lease ends (at-least-once; the deterministic Message-ID lets mail clients spot the copy).
 * Logs carry the outbox id, the template, the attempt and an error code – never an address, a name or a body.
 */
import type {
  IntegrationContext,
  IntegrationError,
  NotificationAdapter,
} from '@ottimo/integrations/contracts';
import { isStaffEmailTemplate } from '@ottimo/integrations/notification';
import type { Clock } from '../clock';
import type { Database, Tx } from '../db/database';
import type { PropertyRef } from './job-runner';

export const STAFF_EMAIL_TOPIC = 'staff.email';
/** Retry delays after attempt 1, 2, … (minutes); after the last one the row is `dead`. */
export const EMAIL_BACKOFF_MINUTES = [1, 5, 15, 60, 180] as const;
export const EMAIL_MAX_ATTEMPTS = EMAIL_BACKOFF_MINUTES.length + 1;
/** A claimed row nobody finished (crash) is taken again after this. */
export const EMAIL_LEASE_MS = 10 * 60_000;
const DEFAULT_BATCH = 10;
/**
 * ARC-03 / SEC-02: a run stops sending once it has used half of the lease, so a slow SMTP server can never make it
 * outlive the lease (another run would take the row again and e-mail twice). The rows not reached are released
 * (attempt not counted, due now) for the next tick.
 */
export const EMAIL_SEND_BUDGET_MS = EMAIL_LEASE_MS / 2;

export type EmailLog = (
  level: 'info' | 'warn' | 'error',
  msg: string,
  extra: Record<string, unknown>,
) => void;

interface Payload {
  template?: unknown;
  userIds?: unknown;
  owners?: unknown;
  effectiveDate?: unknown;
  sentUserIds?: unknown;
  skippedUserIds?: unknown;
}

interface Recipient {
  userId: string;
  email: string;
  audience: 'self' | 'owner';
}

interface Claimed {
  id: string;
  attempts: number;
  template: string;
  recipients: Recipient[];
  params: Record<string, string>;
  sentUserIds: string[];
  skippedUserIds: string[];
  /** Set when the row cannot be sent at all (bad payload, nobody with an address). */
  deadReason?: string;
}

export interface EmailDispatchStats {
  sent: number;
  done: number;
  retry: number;
  dead: number;
  /** Released unfinished because the run used half of the lease (attempt not counted). */
  deferred: number;
}

interface Outcome {
  newlySent: string[];
  newlySkipped: string[];
  retryError: IntegrationError | null;
  /** Stopped before the end because the send budget was used up. */
  deferred: boolean;
}

type FinalStatus = 'done' | 'failed' | 'dead' | 'deferred';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ids = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && UUID_RE.test(x)) : [];

/** '23/10/2026 14:05 (GMT+7)' in the property time zone. */
export function formatLocalTime(at: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'shortOffset',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute} (${parts.timeZoneName})`;
}

function formatLocalDate(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : undefined;
}

export class StaffEmailDispatcher {
  private readonly batch: number;
  /** Monotonic milliseconds for the send budget (not business time – ADR-008 Clock stays for timestamps). */
  private readonly elapsed: () => number;

  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
    private readonly adapter: NotificationAdapter,
    private readonly log: EmailLog,
    opts: { batch?: number; elapsed?: () => number } = {},
  ) {
    this.batch = opts.batch ?? DEFAULT_BATCH;
    this.elapsed = opts.elapsed ?? (() => performance.now());
  }

  async runForProperty(p: PropertyRef): Promise<EmailDispatchStats> {
    const stats: EmailDispatchStats = { sent: 0, done: 0, retry: 0, dead: 0, deferred: 0 };
    const ctx = {
      organizationId: p.organizationId,
      propertyId: p.propertyId,
      userId: null,
      actorType: 'system' as const,
    };
    const started = this.elapsed();
    const overBudget = () => this.elapsed() - started > EMAIL_SEND_BUDGET_MS;
    const claimed = await this.db.withContext(ctx, (tx) => this.claim(tx, p));
    for (const row of claimed) {
      const outcome: Outcome | null = row.deadReason
        ? null
        : overBudget()
          ? { newlySent: [], newlySkipped: [], retryError: null, deferred: true }
          : await this.deliver(p, row, overBudget);
      await this.db.withContext(ctx, (tx) => this.finish(tx, row, outcome));
      if (outcome) stats.sent += outcome.newlySent.length;
      const status = this.statusOf(row, outcome);
      stats[status === 'failed' ? 'retry' : status] += 1;
    }
    return stats;
  }

  private async claim(tx: Tx, p: PropertyRef): Promise<Claimed[]> {
    const now = this.clock.now();
    const { rows } = await tx.query<{
      id: string;
      property_id: string | null;
      payload: Payload;
      attempts: number;
      created_at: Date;
    }>(
      `SELECT id, property_id, payload, attempts, created_at FROM outbox_message
        WHERE topic = $1
          AND ((status IN ('pending', 'failed') AND (next_attempt_at IS NULL OR next_attempt_at <= $2))
               OR (status = 'in_flight' AND next_attempt_at <= $2))
        ORDER BY created_at, id
        LIMIT $3
        FOR UPDATE SKIP LOCKED`,
      [STAFF_EMAIL_TOPIC, now, this.batch],
    );
    const out: Claimed[] = [];
    for (const r of rows) {
      const attempts = r.attempts + 1;
      await tx.query(
        `UPDATE outbox_message SET status = 'in_flight', attempts = $2, next_attempt_at = $3 WHERE id = $1`,
        [r.id, attempts, new Date(now.getTime() + EMAIL_LEASE_MS)],
      );
      const payload = r.payload ?? {};
      const template = typeof payload.template === 'string' ? payload.template : '';
      const sentUserIds = ids(payload.sentUserIds);
      const skippedUserIds = ids(payload.skippedUserIds);
      const base: Claimed = {
        id: r.id,
        attempts,
        template,
        recipients: [],
        params: {},
        sentUserIds,
        skippedUserIds,
      };
      if (!isStaffEmailTemplate(template)) {
        out.push({ ...base, deadReason: 'BAD_TEMPLATE' });
        continue;
      }
      const subjectIds = ids(payload.userIds);
      const owners = payload.owners === true;
      const { rows: users } = await tx.query<{ id: string; email: string; display_name: string }>(
        `SELECT u.id, u.email::text AS email, u.display_name FROM app_user u
          WHERE u.email IS NOT NULL AND u.email::text <> ''
            AND ((u.id = ANY($1::uuid[]) AND u.status IN ('active', 'locked'))
              OR ($2 AND u.status = 'active' AND EXISTS (
                    SELECT 1 FROM user_property_role r
                     WHERE r.user_id = u.id AND r.role = 'owner' AND r.revoked_at IS NULL
                       AND ($3::uuid IS NULL OR r.property_id = $3))))
          ORDER BY u.id`,
        [subjectIds, owners, r.property_id],
      );
      const recipients: Recipient[] = users.map((u) => ({
        userId: u.id,
        email: u.email,
        audience: subjectIds.includes(u.id) ? 'self' : 'owner',
      }));
      if (recipients.length === 0) {
        out.push({ ...base, deadReason: 'NO_RECIPIENT' });
        continue;
      }
      // Name of the person concerned for the owners' copy (staff display name – no username, no contact).
      let staffName = '';
      if (subjectIds[0]) {
        const { rows: n } = await tx.query<{ display_name: string }>(
          'SELECT display_name FROM app_user WHERE id = $1',
          [subjectIds[0]],
        );
        staffName = n[0]?.display_name ?? '';
      }
      const params: Record<string, string> = {
        occurredAt: formatLocalTime(r.created_at, p.timezone),
        ...(staffName ? { staffName } : {}),
      };
      const eff = formatLocalDate(payload.effectiveDate);
      if (eff) params.effectiveDate = eff;
      out.push({ ...base, recipients, params });
    }
    return out;
  }

  private async deliver(p: PropertyRef, row: Claimed, overBudget: () => boolean): Promise<Outcome> {
    const done = new Set([...row.sentUserIds, ...row.skippedUserIds]);
    const newlySent: string[] = [];
    const newlySkipped: string[] = [];
    let retryError: IntegrationError | null = null;
    const ictx: IntegrationContext = {
      propertyId: p.propertyId,
      credentialsRef: 'env:EMAIL_SMTP',
      requestId: row.id,
    };
    for (const rcpt of row.recipients) {
      if (done.has(rcpt.userId)) continue;
      if (overBudget()) return { newlySent, newlySkipped, retryError: null, deferred: true };
      try {
        await this.adapter.send(ictx, {
          channel: 'email',
          purpose: 'security_alert',
          to: rcpt.email,
          templateId: row.template,
          locale: 'en',
          params: { ...row.params, audience: rcpt.audience },
          idempotencyKey: `${row.id}:${rcpt.userId}`,
        });
        newlySent.push(rcpt.userId);
      } catch (err) {
        const e = asIntegrationError(err);
        if (e.code === 'INVALID_REQUEST') {
          // This address is refused for good (or malformed): skip it, keep serving the others.
          newlySkipped.push(rcpt.userId);
          this.log('warn', 'email recipient skipped', {
            outboxId: row.id,
            template: row.template,
            code: e.providerMessage ?? e.code,
          });
          continue;
        }
        // Connection, authentication, rate limit…: the whole row waits for the next attempt.
        retryError = e;
        break;
      }
    }
    return { newlySent, newlySkipped, retryError, deferred: false };
  }

  private statusOf(row: Claimed, outcome: Outcome | null): FinalStatus {
    if (!outcome) return 'dead';
    if (!outcome.retryError) return outcome.deferred ? 'deferred' : 'done';
    return row.attempts >= EMAIL_MAX_ATTEMPTS ? 'dead' : 'failed';
  }

  private async finish(tx: Tx, row: Claimed, outcome: Outcome | null): Promise<void> {
    const now = this.clock.now();
    const status = this.statusOf(row, outcome);
    const sent = [...row.sentUserIds, ...(outcome?.newlySent ?? [])];
    const skipped = [...row.skippedUserIds, ...(outcome?.newlySkipped ?? [])];
    const lastError = row.deadReason
      ? row.deadReason
      : outcome?.retryError
        ? (outcome.retryError.providerMessage ?? outcome.retryError.code)
        : skipped.length > 0
          ? 'RECIPIENT_SKIPPED'
          : null;
    const delayMin =
      EMAIL_BACKOFF_MINUTES[Math.min(row.attempts, EMAIL_BACKOFF_MINUTES.length) - 1] ?? 1;
    // deferred: released for the next tick – the attempt is given back, due now, earlier error kept.
    const dbStatus =
      status === 'deferred' ? (row.attempts - 1 === 0 ? 'pending' : 'failed') : status;
    const r = await tx.query(
      `UPDATE outbox_message
          SET status = $3,
              attempts = CASE WHEN $9 THEN attempts - 1 ELSE attempts END,
              payload = payload || jsonb_build_object('sentUserIds', $4::jsonb, 'skippedUserIds', $5::jsonb),
              last_error = CASE WHEN $9 THEN last_error ELSE $6 END,
              next_attempt_at = CASE WHEN $9 THEN $8::timestamptz
                                     WHEN $3 = 'failed' THEN $7::timestamptz ELSE NULL END,
              dispatched_at = CASE WHEN $3 = 'done' THEN $8::timestamptz ELSE dispatched_at END
        WHERE id = $1 AND status = 'in_flight' AND attempts = $2`,
      [
        row.id,
        row.attempts,
        dbStatus,
        JSON.stringify(sent),
        JSON.stringify(skipped),
        lastError,
        new Date(now.getTime() + delayMin * 60_000),
        now,
        status === 'deferred',
      ],
    );
    const extra = {
      outboxId: row.id,
      template: row.template,
      attempt: row.attempts,
      code: lastError,
    };
    if ((r.rowCount ?? 0) === 0) {
      // Another run took the row after the lease (ARC-03): this run's progress is not recorded.
      this.log('warn', 'email lease lost', {
        outboxId: row.id,
        template: row.template,
        attempt: row.attempts,
      });
      return;
    }
    if (status === 'dead') this.log('error', 'email dead', extra);
    else if (status === 'failed') this.log('warn', 'email retry', extra);
    else if (status === 'deferred')
      this.log('info', 'email deferred', { outboxId: row.id, template: row.template });
  }
}

function asIntegrationError(err: unknown): IntegrationError {
  if (err && typeof err === 'object' && 'code' in err && 'retryable' in err) {
    return err as IntegrationError;
  }
  // Not an adapter error (bug): retry, without its message (it may contain anything).
  return {
    code: 'UNKNOWN',
    retryable: true,
    name: 'IntegrationError',
    message: 'unknown',
  } as IntegrationError;
}
