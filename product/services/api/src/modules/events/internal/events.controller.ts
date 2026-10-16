/**
 * Events endpoints (OpenAPI tag events / notifications / attention):
 * - streamEvents        GET  /v1/properties/{propertyId}/events   SSE `{id}` hints (any staff of the property)
 * - listMyNotifications GET  /v1/me/notifications                 own inbox of the active property
 * - listAttentionItems  GET  /v1/properties/{propertyId}/attention "Cần chú ý" (FD+, S02)
 * Reads run in a read-only transaction with the tenant context (RLS); the inbox is filtered by user in SQL.
 */
import { Controller, Get, Inject, Query, Req, Res } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { decodeCursor, page, parseLimit } from '../../../shared/http/pagination';
import { problem } from '../../../shared/problem';
import { toZonedIso } from '../../../shared/time';
import { AttentionService } from './attention.service';
import { SseHub } from './sse-hub';

/** Technical limits of one stream: heartbeat keeps proxies open; the client reconnects after maxAge. */
const SSE_HEARTBEAT_MS = 25_000;
const SSE_MAX_AGE_MS = 15 * 60_000;
const SSE_RETRY_MS = 3_000;

interface RawReply {
  hijack(): void;
  raw: {
    writeHead(status: number, headers: Record<string, string>): void;
    write(chunk: string): boolean;
    end(): void;
    on(event: 'close', fn: () => void): void;
    destroyed?: boolean;
  };
}

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw problem('UNAUTHENTICATED');
  return p;
}

interface NotificationRow {
  id: string;
  kind: string;
  ref_type: string | null;
  ref_id: string | null;
  ref_code: string | null;
  created_at: Date;
  read_at: Date | null;
  unread_rank: number;
}

@Controller('v1')
export class EventsController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(SseHub) private readonly hub: SseHub,
    @Inject(AttentionService) private readonly attention: AttentionService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  private read<T>(req: GuardedRequest, fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.withContext(tenantOf(principal(req)), fn, { readOnly: true });
  }

  @Get('properties/:propertyId/events')
  @Operation('streamEvents')
  async stream(@Req() req: GuardedRequest, @Res() reply: RawReply): Promise<void> {
    const p = principal(req);
    if (!p.propertyId) throw problem('NOT_FOUND');
    const propertyId = p.propertyId;
    const raw = reply.raw;
    let closed = false;
    const timers: { heartbeat?: NodeJS.Timeout; maxAge?: NodeJS.Timeout } = {};
    let unsubscribe: () => void = () => undefined;
    const close = () => {
      if (closed) return;
      closed = true;
      if (timers.heartbeat) clearInterval(timers.heartbeat);
      if (timers.maxAge) clearTimeout(timers.maxAge);
      unsubscribe();
    };
    const end = () => {
      close();
      try {
        raw.end();
      } catch {
        // socket already gone
      }
    };
    // ARC-BE-S3-23.6: attach `close` first – a socket closed while subscribing must not keep timers alive.
    raw.on('close', close);
    unsubscribe = await this.hub.subscribe({
      propertyId,
      userId: p.userId,
      roles: p.roles,
      send: (type, data) => {
        if (raw.destroyed) throw new Error('closed');
        return raw.write(`event: ${type}\ndata: ${JSON.stringify({ id: data.id })}\n\n`);
      },
      close: end,
    });
    if (closed || raw.destroyed) {
      close();
      return;
    }
    reply.hijack();
    raw.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    raw.write(`retry: ${SSE_RETRY_MS}\n: connected\n\n`);
    // FB-R2-SEC-BE-40: the session and roles are re-checked at every heartbeat – a revoked session, a
    // disabled account or a changed role ends the stream at once (the client reconnects and re-authenticates).
    const heartbeat = setInterval(() => {
      void this.stillValid(p.sessionId, p.userId, propertyId, p.roles, tenantOf(p))
        .then((ok) => {
          if (!ok) end();
          else if (!raw.destroyed) raw.write(': ping\n\n');
        })
        .catch(() => end());
    }, SSE_HEARTBEAT_MS);
    const maxAge = setTimeout(end, SSE_MAX_AGE_MS);
    heartbeat.unref();
    maxAge.unref();
    timers.heartbeat = heartbeat;
    timers.maxAge = maxAge;
  }

  /** Session alive (not revoked/expired/idle, account not disabled) and the same roles at the property. */
  private async stillValid(
    sessionId: string,
    userId: string,
    propertyId: string,
    roles: readonly string[],
    tenant: ReturnType<typeof tenantOf>,
  ): Promise<boolean> {
    const now = this.clock.now();
    return this.db.withContext(
      tenant,
      async (tx) => {
        const { rows } = await tx.query<{ ok: boolean; roles: string[] | null }>(
          `SELECT (s.revoked_at IS NULL AND s.expires_at > $3 AND s.idle_expires_at > $3
                   AND u.status <> 'disabled') AS ok,
                  (SELECT array_agg(r.role ORDER BY r.role) FROM user_property_role r
                    WHERE r.user_id = s.user_id AND r.property_id = $4 AND r.revoked_at IS NULL) AS roles
             FROM user_session s JOIN app_user u ON u.id = s.user_id
            WHERE s.id = $1 AND s.user_id = $2`,
          [sessionId, userId, now, propertyId],
        );
        const r = rows[0];
        if (!r?.ok) return false;
        const current = [...(r.roles ?? [])].sort().join(',');
        return current === [...roles].sort().join(',');
      },
      { readOnly: true },
    );
  }

  @Get('me/notifications')
  @Operation('listMyNotifications')
  async listMine(
    @Req() req: GuardedRequest,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const p = principal(req);
    const n = parseLimit(limit, 50);
    if (unreadOnly !== undefined && unreadOnly !== 'true' && unreadOnly !== 'false') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'unreadOnly', code: 'VALIDATION_FAILED' }],
      });
    }
    const onlyUnread = unreadOnly === 'true';
    const after = decodeCursor(cursor, 3);
    if (!p.propertyId) {
      return { data: [], page: { nextCursor: null, limit: n }, unreadCount: 0 };
    }
    return this.read(req, async (tx) => {
      const tz = await this.timezone(tx);
      // Unread first (read_at NULLS FIRST), newest first – the index order (staff_notification_inbox_idx).
      const { rows } = await tx.query<NotificationRow>(
        `SELECT id, kind, ref_type, ref_id, ref_code, created_at, read_at,
                CASE WHEN read_at IS NULL THEN 0 ELSE 1 END AS unread_rank
           FROM staff_notification
          WHERE user_id = $1 AND ($2::boolean IS FALSE OR read_at IS NULL)
            AND ($3::int IS NULL
                 OR (CASE WHEN read_at IS NULL THEN 0 ELSE 1 END) > $3::int
                 OR ((CASE WHEN read_at IS NULL THEN 0 ELSE 1 END) = $3::int
                     AND (created_at, id) < ($4::timestamptz, $5::uuid)))
          ORDER BY unread_rank, created_at DESC, id DESC
          LIMIT $6`,
        [
          p.userId,
          onlyUnread,
          after ? Number(after[0]) : null,
          after ? new Date(String(after[1])) : null,
          after ? String(after[2]) : null,
          n + 1,
        ],
      );
      const count = await tx.query<{ n: number }>(
        'SELECT count(*)::int AS n FROM staff_notification WHERE user_id = $1 AND read_at IS NULL',
        [p.userId],
      );
      const result = page(rows, n, (r) => [r.unread_rank, r.created_at.toISOString(), r.id]);
      return {
        data: result.data.map((r) => ({
          id: r.id,
          kind: r.kind,
          ...(r.ref_type ? { refType: r.ref_type } : {}),
          ...(r.ref_id ? { refId: r.ref_id } : {}),
          ...(r.ref_code ? { refCode: r.ref_code } : {}),
          createdAt: toZonedIso(r.created_at, tz),
          ...(r.read_at ? { readAt: toZonedIso(r.read_at, tz) } : {}),
        })),
        page: result.page,
        unreadCount: count.rows[0]?.n ?? 0,
      };
    });
  }

  @Get('properties/:propertyId/attention')
  @Operation('listAttentionItems')
  listAttention(@Req() req: GuardedRequest) {
    return this.read(req, async (tx) => ({ data: await this.attention.list(tx) }));
  }

  private async timezone(tx: Tx): Promise<string> {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = rows[0]?.timezone;
    if (!tz) throw problem('NOT_FOUND');
    return tz;
  }
}
