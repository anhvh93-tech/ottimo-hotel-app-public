/**
 * SSE fan-out of one api process (architecture 12, ADR-003): ONE dedicated PostgreSQL connection LISTENs on
 * `ottimo_sse` (separate client, never a pooled slot held forever) and dispatches each committed event to the
 * open streams of the same property whose audience matches (roles ∩ or explicit user). Payloads are
 * `{id}` only – the client re-reads through the API with its own permissions.
 *
 * The listener is started lazily by the first subscriber and restarted after a connection error; a lost
 * NOTIFY is acceptable (SSE is a hint – clients also refresh on focus/reconnect).
 */
import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { Client, type ClientConfig } from 'pg';
import { DATABASE, Database } from '../../../db/database';
import { SSE_CHANNEL, SSE_EVENT_TYPES, type SseWireEvent } from '../public/events.service';

export interface SseSubscriber {
  propertyId: string;
  userId: string;
  roles: readonly string[];
  send(type: string, data: { id: string }): void;
}

/** Audience rule shared with tests: no audience = every staff member of the property. */
export function matches(ev: SseWireEvent, sub: SseSubscriber): boolean {
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
  private readonly subs = new Set<SseSubscriber>();
  private listener: Client | null = null;
  private starting: Promise<void> | null = null;

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async subscribe(sub: SseSubscriber): Promise<() => void> {
    this.subs.add(sub);
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
    for (const s of this.subs) {
      if (!matches(ev, s)) continue;
      try {
        s.send(ev.t, { id: ev.id });
        n += 1;
      } catch {
        this.subs.delete(s); // closed socket
      }
    }
    return n;
  }

  get subscriberCount(): number {
    return this.subs.size;
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
    const client = new Client({ ...options });
    client.on('notification', (msg) => {
      if (msg.channel !== SSE_CHANNEL) return;
      const ev = parseWire(msg.payload);
      if (ev) this.dispatch(ev);
    });
    client.on('error', (err) => {
      this.logger.error(`listener error ${err.name}`);
      if (this.listener === client) this.listener = null;
      client.end().catch(() => undefined);
    });
    await client.connect();
    await client.query(`LISTEN ${SSE_CHANNEL}`);
    this.listener = client;
  }

  async onModuleDestroy(): Promise<void> {
    this.subs.clear();
    const l = this.listener;
    this.listener = null;
    if (l) await l.end().catch(() => undefined);
  }
}
