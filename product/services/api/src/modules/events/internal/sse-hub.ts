/**
 * SSE fan-out of one api process (architecture 12, ADR-003): ONE dedicated PostgreSQL connection LISTENs on
 * `ottimo_sse` (separate client with TCP keep-alive, never a pooled slot held forever) and dispatches each
 * committed event to the open streams of the same property whose audience matches (roles ∩ or explicit
 * user). Payloads are `{id}` only – the client re-reads through the API with its own permissions.
 *
 * FB-R2-ARC-BE-S3-09: the listener is started by the first subscriber; when it is lost (`error` or `end` –
 * PostgreSQL restart, network, idle timeout) it reconnects with back-off (1 s → 30 s) while streams are open,
 * and after RECONNECT_MAX_FAILURES failed attempts every stream is closed so the clients reconnect (and
 * refresh) instead of staying deaf behind a live heartbeat. A lost NOTIFY between two connections is
 * acceptable (SSE is a hint – clients also refresh on focus/reconnect).
 * FB-R2-SEC-BE-40 / SR-RL-09: at most SSE_MAX_STREAMS_PER_USER open streams per user (→ 429); a stream whose
 * socket keeps refusing writes (back-pressure) is closed.
 */
import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { Client, type ClientConfig } from 'pg';
import { DATABASE, Database } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { SSE_CHANNEL, SSE_EVENT_TYPES, type SseWireEvent } from '../public/events.service';

export interface SseSubscriber {
  propertyId: string;
  userId: string;
  roles: readonly string[];
  /** Writes one event; `false` = the socket buffer is full (back-pressure). Throws when closed. */
  send(type: string, data: { id: string }): boolean;
  /** Ends the stream (the client reconnects). */
  close(): void;
}

/** SR-RL-09 (SEC-BE-35/40): open SSE streams per user (one per browser tab). */
export const SSE_MAX_STREAMS_PER_USER = 5;
/** Technical limits of the listener / streams (not business parameters). */
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
export const RECONNECT_MAX_FAILURES = 5;
const BACKPRESSURE_MAX_REFUSALS = 20;

/** Audience rule shared with tests: no audience = every staff member of the property. */
export function matches(
  ev: SseWireEvent,
  sub: Pick<SseSubscriber, 'propertyId' | 'userId' | 'roles'>,
): boolean {
  if (ev.p !== sub.propertyId) return false;
  if (!ev.r && !ev.u) return true;
  if (ev.u?.includes(sub.userId)) return true;
  return !!ev.r && sub.roles.some((r) => ev.r?.includes(r));
}

export function parseWire(payload: string | undefined): SseWireEvent | null {
  if (!payload) return null;
  try {
    const v = JSON.parse(payload) as Partial<SseWireEvent>;
    if (
      typeof v.p !== 'string' ||
      typeof v.id !== 'string' ||
      !(SSE_EVENT_TYPES as readonly string[]).includes(String(v.t))
    ) {
      return null;
    }
    return v as SseWireEvent;
  } catch {
    return null;
  }
}

@Injectable()
export class SseHub implements OnModuleDestroy {
  private readonly logger = new Logger('SseHub');
  /** subscriber → consecutive refused writes */
  private readonly subs = new Map<SseSubscriber, number>();
  private listener: Client | null = null;
  private starting: Promise<void> | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private failures = 0;
  private destroyed = false;

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async subscribe(sub: SseSubscriber): Promise<() => void> {
    let open = 0;
    for (const s of this.subs.keys()) if (s.userId === sub.userId) open += 1;
    if (open >= SSE_MAX_STREAMS_PER_USER) {
      throw problem('RATE_LIMITED', {
        headers: { 'Retry-After': String(RECONNECT_MAX_MS / 1000) },
      });
    }
    this.subs.set(sub, 0);
    try {
      await this.ensureListening();
    } catch (err) {
      this.subs.delete(sub);
      throw err;
    }
    return () => {
      this.subs.delete(sub);
    };
  }

  /** Test/diagnostic: deliver a wire event as if it came from PostgreSQL. */
  dispatch(ev: SseWireEvent): number {
    let n = 0;
    for (const [s, refused] of [...this.subs]) {
      if (!matches(ev, s)) continue;
      try {
        if (s.send(ev.t, { id: ev.id })) this.subs.set(s, 0);
        else if (refused + 1 > BACKPRESSURE_MAX_REFUSALS) this.drop(s);
        else this.subs.set(s, refused + 1);
        n += 1;
      } catch {
        this.drop(s); // closed socket
      }
    }
    return n;
  }

  get subscriberCount(): number {
    return this.subs.size;
  }

  /** Test/diagnostic: backend pid of the LISTEN connection (null when not listening). */
  get listenerPid(): number | null {
    const c = this.listener as (Client & { processID?: number }) | null;
    return c?.processID ?? null;
  }

  private drop(s: SseSubscriber): void {
    this.subs.delete(s);
    try {
      s.close();
    } catch {
      // already closed
    }
  }

  private ensureListening(): Promise<void> {
    if (this.listener) return Promise.resolve();
    if (!this.starting) {
      this.starting = this.start().finally(() => {
        this.starting = null;
      });
    }
    return this.starting;
  }

  private async start(): Promise<void> {
    const options = this.db.pool.options as ClientConfig;
    const client = new Client({ ...options, keepAlive: true });
    client.on('notification', (msg) => {
      if (msg.channel !== SSE_CHANNEL) return;
      const ev = parseWire(msg.payload);
      if (ev) this.dispatch(ev);
    });
    client.on('error', (err) => this.lost(client, `error ${err.name}`));
    client.on('end', () => this.lost(client, 'end'));
    try {
      await client.connect();
      await client.query(`LISTEN ${SSE_CHANNEL}`);
    } catch (err) {
      client.removeAllListeners('end');
      await client.end().catch(() => undefined);
      throw err;
    }
    this.listener = client;
    this.failures = 0;
  }

  /** The LISTEN connection is gone: forget it and reconnect while streams are open. */
  private lost(client: Client, why: string): void {
    if (this.listener !== client) return;
    this.logger.warn(`listener lost (${why})`);
    this.listener = null;
    client.removeAllListeners('end');
    client.end().catch(() => undefined);
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectTimer || this.subs.size === 0) return;
    const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** this.failures);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.destroyed || this.subs.size === 0) return;
      this.ensureListening().catch(() => {
        this.failures += 1;
        if (this.failures >= RECONNECT_MAX_FAILURES) {
          // Give up for now: end every stream – the clients reconnect (and re-read) on their own.
          this.logger.error('listener down – closing all streams');
          this.failures = 0;
          for (const s of [...this.subs.keys()]) this.drop(s);
          return;
        }
        this.scheduleReconnect();
      });
    }, delay);
    this.reconnectTimer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.subs.clear();
    const l = this.listener;
    this.listener = null;
    if (l) {
      l.removeAllListeners('end');
      await l.end().catch(() => undefined);
    }
  }
}
