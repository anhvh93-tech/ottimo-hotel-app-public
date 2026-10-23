/**
 * "Cần chú ý" list (S02, OpenAPI listAttentionItems / resolveAttentionEvent; erd BE-ARC-06): open
 * `attention_event` rows (source `event`) + items computed at read time by the owning modules
 * (EventsService.registerAttentionSource – `reconcile_overdue` is the payments module's since FB-R2-ARC-BE-S3-15 b).
 * Items carry codes, counts and room numbers only (SEC J) – `params` go through the per-kind allowlist again
 * before leaving the server.
 *
 * BE-D Sprint 4 (US-012, EP01 3.1–3.2):
 * - the list is filtered by the CALLER's roles on the server (attentionAudience – AC6, US-003 AC4: FD never
 *   receives FOC / money items; DATA checks are OWN's);
 * - order: critical → warning → info, then `dueAt` ascending (items without a due time last), then kind;
 * - resolve: only an open event item the caller can see (else 404 – no existence leak); items closed by the
 *   system only (ATTENTION_SYSTEM_CLOSED) → 409 INVALID_TRANSITION; `note` V-08/V-09, required for a critical
 *   item (EP01 3.2 – channel_sync_error, security_alert). Who/when is kept on the row (resolved_by/at).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { optionalText, requireReason } from '../../../shared/validation';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import {
  ATTENTION_SYSTEM_CLOSED,
  type AttentionItem,
  type AttentionKind,
  type AttentionSourceContext,
  EventsService,
  FD_PLUS,
  assertAttentionParams,
  attentionVisibleTo,
} from '../public/events.service';

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 } as const;
/** Technical cap of event rows read per request (the UI shows a summary). */
const MAX_EVENT_ROWS = 200;

/** Sort key of `dueAt` (ISO with offset): epoch ms; no due time → after every dated item. */
function dueMs(i: AttentionItem): number {
  if (!i.dueAt) return Number.MAX_SAFE_INTEGER;
  const t = Date.parse(i.dueAt);
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

export function sortAttention(items: AttentionItem[]): AttentionItem[] {
  return items.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      dueMs(a) - dueMs(b) ||
      a.kind.localeCompare(b.kind) ||
      (a.refCode ?? '').localeCompare(b.refCode ?? ''),
  );
}

@Injectable()
export class AttentionService {
  private readonly logger = new Logger('AttentionService');

  constructor(
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(ParameterService) private readonly params: ParameterService,
  ) {}

  /** Items the caller (`roles` at the property) may see, sorted (EP01 3.2). */
  async list(tx: Tx, roles: readonly string[]): Promise<AttentionItem[]> {
    const p = await this.property.now(tx);
    const ctx: AttentionSourceContext = {
      tz: p.timezone,
      now: p.now,
      today: p.today,
      iso: p.iso,
      param: async <T>(key: string) => {
        try {
          return await this.params.get<T>(tx, key, p.today);
        } catch (err) {
          if (err instanceof ParameterMissingError) return undefined;
          throw err;
        }
      },
    };
    const items: AttentionItem[] = [];
    // SEC-BE-52 (1): a stored row whose params no longer pass the allowlist is left out (logged), never a 500
    // for the whole list; computed items are code – a bad one stays a programming error.
    for (const i of await this.eventItems(tx, ctx)) {
      try {
        assertAttentionParams(i.kind, i.params);
        items.push(i);
      } catch {
        this.logger.error(`attention event ${i.eventId ?? '?'} (${i.kind}) skipped: params`);
      }
    }
    const computed: AttentionItem[] = [];
    for (const source of this.events.attentionSources()) computed.push(...(await source(tx, ctx)));
    for (const i of computed) assertAttentionParams(i.kind, i.params);
    items.push(...computed);
    return sortAttention(items.filter((i) => attentionVisibleTo(i, roles)));
  }

  /** resolveAttentionEvent – in the caller's write transaction (UnitOfWork). */
  async resolve(
    tx: Tx,
    input: { eventId: string; roles: readonly string[]; userId: string; note: unknown; now: Date },
  ): Promise<void> {
    const { rows } = await tx.query<{
      id: string;
      kind: AttentionKind;
      severity: AttentionItem['severity'];
      details: Record<string, string | number> | null;
      resolved_at: Date | null;
    }>(
      'SELECT id, kind, severity, details, resolved_at FROM attention_event WHERE id = $1 FOR UPDATE',
      [input.eventId],
    );
    const row = rows[0];
    const params = row?.details && Object.keys(row.details).length > 0 ? row.details : undefined;
    if (
      !row ||
      row.resolved_at ||
      !attentionVisibleTo({ kind: row.kind, ...(params ? { params } : {}) }, input.roles)
    ) {
      throw problem('NOT_FOUND');
    }
    if (ATTENTION_SYSTEM_CLOSED.includes(row.kind)) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: 'open' },
        detail: 'closed by the system when the underlying case is handled',
      });
    }
    const note =
      row.severity === 'critical'
        ? requireReason('note', input.note)
        : input.note === undefined || input.note === null
          ? null
          : optionalText('note', input.note, 500);
    await tx.query(
      `UPDATE attention_event SET resolved_at = $2, resolved_by = $3, resolution_note = $4
        WHERE id = $1 AND resolved_at IS NULL`,
      [row.id, input.now, input.userId, note],
    );
    await this.events.publish(tx, 'attention.changed', row.id, { roles: FD_PLUS });
  }

  /**
   * Due time of an event item: when it was raised, except `foc_stay_total_exceeded` (0.3.8 – BR-433 (c) v0.4.0): the
   * owner reviews it within `stay_waiver_review_hours` (24).
   */
  private async dueOf(
    kind: AttentionKind,
    createdAt: Date,
    ctx: AttentionSourceContext,
  ): Promise<Date> {
    if (kind !== 'foc_stay_total_exceeded') return createdAt;
    const hours = (await ctx.param<number>('stay_waiver_review_hours')) ?? 0;
    return new Date(createdAt.getTime() + hours * 3_600_000);
  }

  private async eventItems(tx: Tx, ctx: AttentionSourceContext): Promise<AttentionItem[]> {
    const { rows } = await tx.query<{
      id: string;
      kind: AttentionKind;
      severity: AttentionItem['severity'];
      ref_type: string | null;
      ref_id: string | null;
      ref_code: string | null;
      details: Record<string, string | number> | null;
      created_at: Date;
    }>(
      `SELECT id, kind, severity, ref_type, ref_id, ref_code, details, created_at FROM attention_event
        WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT $1`,
      [MAX_EVENT_ROWS],
    );
    const out: AttentionItem[] = [];
    for (const r of rows) {
      const params = r.details && Object.keys(r.details).length > 0 ? r.details : undefined;
      out.push({
        kind: r.kind,
        source: 'event',
        severity: r.severity,
        eventId: r.id,
        count: 1,
        dueAt: ctx.iso(await this.dueOf(r.kind, r.created_at, ctx)),
        ...(r.ref_type === 'reservation' && r.ref_id ? { reservationIds: [r.ref_id] } : {}),
        ...(r.ref_code ? { refCode: r.ref_code } : {}),
        ...(params ? { params } : {}),
      });
    }
    return out;
  }
}
