/**
 * Staff Google Chat dispatcher – outbox topic `staff.chat` (ARC gchat-booking-request-notify 1.4, 3.3, 8; SEC
 * GCHAT-02, ESC-041 ★2/★3/★5/★6). Same pattern as StaffEmailDispatcher (email-dispatch.ts):
 *
 * Per property, every worker tick:
 *   tx 1  claim ≤ 5 rows FOR UPDATE SKIP LOCKED → in_flight, attempts+1, lease 2 min; for each row decide skip
 *         (disabled, stale > 12 h, bad payload) or render the text with the module renderer (reads the request).
 *   —     POST outside any transaction (timeout 5 s, no redirect), one after the other, ≤ 1 min per run (budget):
 *         rows not reached are released (`deferred`, attempt given back).
 *   tx 2  done | failed (back-off 1, 5, 15, 60, 180 min) | dead (6th attempt, or Chat refused the webhook 4xx).
 * At-least-once: a crash between POST and tx 2 may post twice (messageId, once INT confirms it, makes Chat refuse
 * the copy). Chat off (no/invalid webhook, invalid Desk link base) → due rows are closed `done` + SKIPPED_DISABLED,
 * so the outbox never grows and turning Chat on never floods the room with old requests.
 * Logs: outbox id, kind, attempt, a short code – never the URL, its key/token, the text or the response.
 */
import type { ChatPostOptions, ChatPostResult } from '@ottimo/integrations/notification';
import type { Clock } from '../clock';
import type { Database, Tx } from '../db/database';
import {
  STAFF_CHAT_TOPIC,
  type StaffChatKind,
  isStaffChatKind,
} from '../modules/events/public/staff-chat';
import type { ChatDetailLevel, ChatRenderer } from '../modules/public-site/public/chat-message';
import type { PropertyRef } from './job-runner';

export const CHAT_BACKOFF_MINUTES = [1, 5, 15, 60, 180] as const;
export const CHAT_MAX_ATTEMPTS = CHAT_BACKOFF_MINUTES.length + 1;
export const CHAT_LEASE_MS = 2 * 60_000;
/** A run stops posting after this (half the lease – see EMAIL_SEND_BUDGET_MS): never outlives its lease. */
export const CHAT_SEND_BUDGET_MS = 60_000;
/** A message older than this when its turn comes is not posted (Desk stays the source of truth). */
export const CHAT_STALE_MS = 12 * 3_600_000;
const DEFAULT_BATCH = 5;
/**
 * `messageId=client-<outbox id>` on the request (Chat refuses a duplicate id → at most one copy). OFF until INT
 * confirms on the test room that incoming webhooks accept it (ARC 1.4) – a refused parameter would kill every message.
 */
export const CHAT_USE_MESSAGE_ID = false;

export type ChatLog = (
  level: 'info' | 'warn' | 'error',
  msg: string,
  extra: Record<string, unknown>,
) => void;

export type ChatPost = (
  url: string,
  text: string,
  opts: ChatPostOptions,
) => Promise<ChatPostResult>;

/** The worker's resolved Chat configuration (src/worker-chat.ts). */
export type ChatTarget =
  | { mode: 'on'; url: string; level: ChatDetailLevel; linkBase: string; appEnv: string }
  | { mode: 'off' };

export interface ChatDispatchStats {
  sent: number;
  done: number;
  retry: number;
  dead: number;
  skipped: number;
  /** Released unfinished because the run used its budget (attempt not counted). */
  deferred: number;
  /** Sent as A although B/C is configured (notice gate ★2). */
  levelCapped: number;
}

type Decision =
  | { kind: 'send'; text: string; threadKey: string; levelCapped: boolean }
  | { kind: 'skip'; code: string }
  | { kind: 'retry'; code: string }
  | { kind: 'dead'; code: string };

interface Claimed {
  id: string;
  attempts: number;
  chatKind: string;
  decision: Decision;
}

type Final =
  | { status: 'done'; code: string | null }
  | { status: 'failed'; code: string }
  | { status: 'dead'; code: string }
  | { status: 'deferred' };

export class ChatDispatcher {
  private readonly batch: number;
  private readonly elapsed: () => number;

  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
    private readonly target: ChatTarget,
    private readonly renderers: Readonly<Partial<Record<StaffChatKind, ChatRenderer>>>,
    private readonly post: ChatPost,
    private readonly log: ChatLog,
    opts: { batch?: number; elapsed?: () => number } = {},
  ) {
    this.batch = opts.batch ?? DEFAULT_BATCH;
    this.elapsed = opts.elapsed ?? (() => performance.now());
  }

  get enabled(): boolean {
    return this.target.mode === 'on';
  }

  async runForProperty(p: PropertyRef): Promise<ChatDispatchStats> {
    const stats: ChatDispatchStats = {
      sent: 0,
      done: 0,
      retry: 0,
      dead: 0,
      skipped: 0,
      deferred: 0,
      levelCapped: 0,
    };
    const ctx = {
      organizationId: p.organizationId,
      propertyId: p.propertyId,
      userId: null,
      actorType: 'system' as const,
    };
    const started = this.elapsed();
    const overBudget = () => this.elapsed() - started > CHAT_SEND_BUDGET_MS;
    const claimed = await this.db.withContext(ctx, (tx) => this.claim(tx, p));
    for (const row of claimed) {
      let final: Final;
      const d = row.decision;
      if (d.kind === 'skip') final = { status: 'done', code: d.code };
      else if (d.kind === 'dead') final = { status: 'dead', code: d.code };
      else if (d.kind === 'retry')
        final =
          row.attempts >= CHAT_MAX_ATTEMPTS
            ? { status: 'dead', code: d.code }
            : { status: 'failed', code: d.code };
      else if (overBudget()) final = { status: 'deferred' };
      else final = await this.deliver(row, d);
      const recorded = await this.db.withContext(ctx, (tx) => this.finish(tx, row, final));
      if (!recorded) continue;
      if (final.status === 'done') {
        if (d.kind === 'skip') stats.skipped += 1;
        else {
          stats.sent += 1;
          stats.done += 1;
          if (d.kind === 'send' && d.levelCapped) stats.levelCapped += 1;
        }
      } else if (final.status === 'failed') stats.retry += 1;
      else stats[final.status] += 1;
    }
    return stats;
  }

  private async claim(tx: Tx, p: PropertyRef): Promise<Claimed[]> {
    const now = this.clock.now();
    const { rows } = await tx.query<{
      id: string;
      payload: { kind?: unknown; refType?: unknown; refId?: unknown } | null;
      attempts: number;
      created_at: Date;
    }>(
      `SELECT id, payload, attempts, created_at FROM outbox_message
        WHERE topic = $1 AND property_id = $4
          AND ((status IN ('pending', 'failed') AND (next_attempt_at IS NULL OR next_attempt_at <= $2))
               OR (status = 'in_flight' AND next_attempt_at <= $2))
        ORDER BY created_at, id
        LIMIT $3
        FOR UPDATE SKIP LOCKED`,
      [STAFF_CHAT_TOPIC, now, this.batch, p.propertyId],
    );
    const out: Claimed[] = [];
    for (const r of rows) {
      const attempts = r.attempts + 1;
      await tx.query(
        `UPDATE outbox_message SET status = 'in_flight', attempts = $2, next_attempt_at = $3 WHERE id = $1`,
        [r.id, attempts, new Date(now.getTime() + CHAT_LEASE_MS)],
      );
      const payload = r.payload ?? {};
      const chatKind = typeof payload.kind === 'string' ? payload.kind.slice(0, 40) : '';
      const base = { id: r.id, attempts, chatKind };
      const renderer = isStaffChatKind(payload.kind) ? this.renderers[payload.kind] : undefined;
      if (!renderer || typeof payload.refId !== 'string') {
        out.push({ ...base, decision: { kind: 'dead', code: 'BAD_PAYLOAD' } });
        continue;
      }
      if (this.target.mode === 'off') {
        out.push({ ...base, decision: { kind: 'skip', code: 'SKIPPED_DISABLED' } });
        continue;
      }
      if (now.getTime() - r.created_at.getTime() > CHAT_STALE_MS) {
        out.push({ ...base, decision: { kind: 'skip', code: 'SKIPPED_STALE' } });
        continue;
      }
      // A savepoint keeps one bad request from aborting the claim of the others.
      await tx.query('SAVEPOINT chat_render');
      try {
        const rendered = await renderer(tx, payload.kind as StaffChatKind, payload.refId, {
          level: this.target.level,
          timezone: p.timezone,
          linkBase: this.target.linkBase,
          appEnv: this.target.appEnv,
          now,
        });
        await tx.query('RELEASE SAVEPOINT chat_render');
        out.push({
          ...base,
          decision: rendered.send
            ? {
                kind: 'send',
                text: rendered.text,
                threadKey: rendered.threadKey,
                levelCapped: rendered.levelCapped,
              }
            : { kind: 'skip', code: rendered.code },
        });
      } catch (err) {
        await tx.query('ROLLBACK TO SAVEPOINT chat_render');
        // Name only (a DB message may carry values – SEC S-1); retried like a failed post.
        const name = err instanceof Error ? err.name : 'error';
        this.log('error', 'chat render failed', { outboxId: r.id, kind: chatKind, err: name });
        out.push({ ...base, decision: { kind: 'retry', code: 'RENDER_FAILED' } });
      }
    }
    return out;
  }

  private async deliver(row: Claimed, d: Extract<Decision, { kind: 'send' }>): Promise<Final> {
    if (this.target.mode !== 'on') return { status: 'done', code: 'SKIPPED_DISABLED' };
    let res: ChatPostResult;
    try {
      res = await this.post(this.target.url, d.text, {
        threadKey: d.threadKey,
        ...(CHAT_USE_MESSAGE_ID ? { messageId: `client-${row.id}` } : {}),
      });
    } catch {
      res = { ok: false, retryable: true, code: 'UNKNOWN' };
    }
    if (res.ok) return { status: 'done', code: null };
    if (!res.retryable) return { status: 'dead', code: res.code };
    return row.attempts >= CHAT_MAX_ATTEMPTS
      ? { status: 'dead', code: res.code }
      : { status: 'failed', code: res.code };
  }

  /** Returns false when the lease was lost (another run took the row): nothing recorded. */
  private async finish(tx: Tx, row: Claimed, final: Final): Promise<boolean> {
    const now = this.clock.now();
    const deferred = final.status === 'deferred';
    const dbStatus = deferred ? (row.attempts - 1 === 0 ? 'pending' : 'failed') : final.status;
    const code = deferred ? null : final.code;
    const delayMin =
      CHAT_BACKOFF_MINUTES[Math.min(row.attempts, CHAT_BACKOFF_MINUTES.length) - 1] ?? 1;
    const r = await tx.query(
      `UPDATE outbox_message
          SET status = $3,
              attempts = CASE WHEN $7 THEN attempts - 1 ELSE attempts END,
              last_error = CASE WHEN $7 THEN last_error ELSE $4 END,
              next_attempt_at = CASE WHEN $7 THEN $6::timestamptz
                                     WHEN $3 = 'failed' THEN $5::timestamptz ELSE NULL END,
              dispatched_at = CASE WHEN $3 = 'done' THEN $6::timestamptz ELSE dispatched_at END
        WHERE id = $1 AND status = 'in_flight' AND attempts = $2`,
      [
        row.id,
        row.attempts,
        dbStatus,
        code,
        new Date(now.getTime() + delayMin * 60_000),
        now,
        deferred,
      ],
    );
    const extra = { outboxId: row.id, kind: row.chatKind, attempt: row.attempts };
    if ((r.rowCount ?? 0) === 0) {
      this.log('warn', 'chat lease lost', extra);
      return false;
    }
    if (final.status === 'dead') this.log('error', 'chat dead', { ...extra, code });
    else if (final.status === 'failed') this.log('warn', 'chat retry', { ...extra, code });
    else if (final.status === 'deferred') this.log('info', 'chat deferred', extra);
    return true;
  }
}
