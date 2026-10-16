/**
 * "Cần chú ý" list (S02, OpenAPI listAttentionItems; erd BE-ARC-06): open `attention_event` rows (source
 * `event`) + items computed at read time by the owning modules (EventsService.registerAttentionSource –
 * `reconcile_overdue` is the payments module's since FB-R2-ARC-BE-S3-15 b). Items carry codes, counts and room numbers only (SEC J) – `params` go
 * through the per-kind allowlist again before leaving the server.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger('AttentionService');

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
}
