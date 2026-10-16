/**
 * "Cần chú ý" list (S02, OpenAPI listAttentionItems; erd BE-ARC-06): open `attention_event` rows (source
 * `event`) + items computed at read time by the owning modules (EventsService.registerAttentionSource) + the
 * built-in `reconcile_overdue` (B-21). Items carry codes, counts and room numbers only (SEC J) – `params` go
 * through the per-kind allowlist again before leaving the server.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import {
  type AttentionItem,
  type AttentionKind,
  type AttentionSourceContext,
  EventsService,
  assertAttentionParams,
} from '../public/events.service';

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 } as const;
/** Technical cap of event rows read per request (the UI shows a summary). */
const MAX_EVENT_ROWS = 200;

@Injectable()
export class AttentionService {
  constructor(
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(ParameterService) private readonly params: ParameterService,
  ) {}

  async list(tx: Tx): Promise<AttentionItem[]> {
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
    items.push(...(await this.eventItems(tx, ctx)));
    for (const source of this.events.attentionSources()) items.push(...(await source(tx, ctx)));
    items.push(...(await this.reconcileOverdue(tx, ctx)));
    for (const i of items) assertAttentionParams(i.kind, i.params);
    return items.sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.kind.localeCompare(b.kind),
    );
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
    return rows.map((r) => {
      const params = r.details && Object.keys(r.details).length > 0 ? r.details : undefined;
      return {
        kind: r.kind,
        source: 'event',
        severity: r.severity,
        eventId: r.id,
        count: 1,
        dueAt: ctx.iso(r.created_at),
        ...(r.ref_type === 'reservation' && r.ref_id ? { reservationIds: [r.ref_id] } : {}),
        ...(r.ref_code ? { refCode: r.ref_code } : {}),
        ...(params ? { params } : {}),
      };
    });
  }

  /**
   * B-21 `reconcile_overdue` (BR-527, `bank_reconcile_alert_days`): transfers/VietQR still `pending` after the
   * alert window. Read-only aggregate over the payments table (count + age only – no payer, no amount).
   */
  private async reconcileOverdue(tx: Tx, ctx: AttentionSourceContext): Promise<AttentionItem[]> {
    const days = await ctx.param<number>('bank_reconcile_alert_days');
    if (days === undefined) return [];
    const { rows } = await tx.query<{ n: number; oldest: Date | null }>(
      `SELECT count(*)::int AS n, min(received_at) AS oldest FROM payment
        WHERE reconciliation = 'pending' AND status = 'succeeded'
          AND received_at < $1::timestamptz - make_interval(days => $2::int)`,
      [ctx.now, days],
    );
    const r = rows[0];
    if (!r || r.n === 0 || !r.oldest) return [];
    const oldestDays = Math.floor((ctx.now.getTime() - r.oldest.getTime()) / 86_400_000);
    return [
      {
        kind: 'reconcile_overdue',
        source: 'computed',
        severity: 'warning',
        count: r.n,
        link: '/payments?reconciliation=pending',
        params: { count: r.n, oldestDays },
      },
    ];
  }
}
