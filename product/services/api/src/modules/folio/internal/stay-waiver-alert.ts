/**
 * BR-433 (c) v0.4.0 – ESC-026 A (INV 22/10), US-007 AC7: waivers of DIFFERENT keys on one stay add up → the owner
 * is told; nothing is blocked. After every waiver APPLIED (approved or self-applied) by someone below the owner, in
 * the same transaction and under the folio lock (ARC 16.19 – the decision hook runs under preLock / lockStay):
 * - Σ stay = what the live FOC / special-discount / `debt_write_off` lines of the stay apply NOW, counting only the
 *   ones decided by front desk, lead or manager (OWN's own decisions are not counted – the owner is the reader);
 * - threshold = the per-time limit of the HIGHEST role below the owner with a waiver applied on the stay: manager →
 *   the stay's highest night (the same basis as BR-433 (a)); lead → `foc_limits.front_desk_lead.perTimeVnd`
 *   (300.000); front desk self-waivers only → `foc_self_apply.front_desk.per_time` (100.000);
 * - Σ > threshold → notification `foc_stay_total_exceeded` to every OWN (one per waiver applied while above), ONE
 *   "Cần chú ý" item per stay open (`foc_stay_alert` – count updated at each crossing; a new one after OWN reviewed it, ARC S1-11), a state
 *   audit `folio.foc_stay_alerted` with the numbers (no guest data).
 * The stay = the folio of the primary booking (its child bookings share it – BR-422). A waiver cancelled later by the
 * rules (BR-434) leaves Σ but nothing is re-evaluated (no "below the threshold" message – E26-9). The owner's
 * revocation of a waiver (E26-6…8) is Sprint 2 (ARC s1-contracts 5.4); the "hold" mode (ESC-026 B) is not built.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { localDate } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import type { ApprovalRow } from '../../approvals/public/approval.service';
import { EventsService } from '../../events/public/events.service';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import { FolioService } from '../public/folio.service';

const BELOW_OWNER = ['front_desk', 'front_desk_lead', 'manager'] as const;
const KIND = 'foc_stay_total_exceeded';

export interface StayWaiverCheck {
  alerted: boolean;
  stayTotalVnd: number;
  thresholdVnd: number;
  items: number;
}

@Injectable()
export class StayWaiverAlertService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /** Called by the FOC decision hook for every APPLIED waiver (approved / self-applied). */
  async afterApplied(
    tx: Tx,
    request: ApprovalRow,
    folioId: string,
  ): Promise<StayWaiverCheck | null> {
    if (request.status !== 'approved') return null;
    if (!(BELOW_OWNER as readonly string[]).includes(request.approver_role_snapshot ?? ''))
      return null;
    const folio = await this.folios.get(tx, folioId);
    if (!folio) return null;
    const { rows } = await tx.query<{ role: string; total: string | number; n: number }>(
      `SELECT a.approver_role_snapshot AS role, COALESCE(-sum(l.amount_vnd), 0) AS total,
              count(DISTINCT a.id)::int AS n
         FROM folio_line l JOIN approval_request a ON a.id = l.approval_request_id
        WHERE l.folio_id = $1 AND l.category IN ('foc', 'discount') AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
          AND a.status = 'approved' AND a.approver_role_snapshot = ANY($2::text[])
        GROUP BY a.approver_role_snapshot`,
      [folioId, [...BELOW_OWNER]],
    );
    const live = rows.filter((r) => Number(r.total) > 0);
    if (live.length === 0) return null;
    const stayTotalVnd = live.reduce((s, r) => s + Number(r.total), 0);
    const items = live.reduce((s, r) => s + r.n, 0);
    const roles = new Set(live.map((r) => r.role));
    const thresholdVnd = await this.threshold(tx, folioId, roles);
    const out = { alerted: false, stayTotalVnd, thresholdVnd, items };
    if (stayTotalVnd <= thresholdVnd) return out;

    const now = this.clock.now();
    const rootId = folio.primary_reservation_id;
    const { rows: code } = await tx.query<{ code: string }>(
      'SELECT code FROM reservation WHERE id = $1',
      [rootId],
    );
    const refCode = code[0]?.code ?? request.target_code ?? null;
    if (this.events) {
      await this.events.notify(
        tx,
        { kind: KIND, roles: ['owner'], refType: 'reservation', refId: rootId, refCode },
        now,
      );
    }
    // At most ONE open attention item per stay (erd 4.15 `foc_stay_alert`; ARC S1-11): each later crossing updates
    // the open item's count; once OWN has reviewed it ("Đã xem"), a crossing with new waivers opens a new one.
    const { rows: alert } = await tx.query<{
      alert_count: number;
      attention_event_id: string | null;
    }>(
      `INSERT INTO foc_stay_alert (organization_id, property_id, stay_root_reservation_id, first_alerted_at,
         last_alerted_at, alert_count)
       VALUES ($1, $2, $3, $4, $4, 1)
       ON CONFLICT (stay_root_reservation_id) DO UPDATE
         SET last_alerted_at = EXCLUDED.last_alerted_at, alert_count = foc_stay_alert.alert_count + 1
       RETURNING alert_count, attention_event_id`,
      [tx.ctx.organizationId, folio.property_id, rootId, now],
    );
    if (this.events) {
      const current = alert[0]?.attention_event_id ?? null;
      const updated = current
        ? await this.events.updateAttentionParams(tx, current, KIND, { count: items })
        : false;
      if (!updated) {
        const eventId = await this.events.openAttention(tx, {
          kind: KIND,
          severity: 'warning',
          dedupeKey: `${KIND}:${rootId}`,
          refType: 'reservation',
          refId: rootId,
          ...(refCode ? { refCode } : {}),
          params: { count: items },
          now,
        });
        if (eventId) {
          await tx.query(
            'UPDATE foc_stay_alert SET attention_event_id = $2 WHERE stay_root_reservation_id = $1',
            [rootId, eventId],
          );
        }
      }
    }
    await this.audit.record(tx, {
      category: 'state',
      action: 'folio.foc_stay_alerted',
      entityType: 'reservation',
      entityId: rootId,
      ...(refCode ? { entityCode: refCode } : {}),
      after: {
        stayWaiverVnd: stayTotalVnd,
        thresholdVnd,
        itemCount: items,
        alertCount: alert[0]?.alert_count ?? 1,
      },
      reason: `approval ${request.id}`,
    });
    return { ...out, alerted: true };
  }

  private async threshold(tx: Tx, folioId: string, roles: Set<string>): Promise<number> {
    // BR-433 (d) v0.4.1: the protected basis (FolioService.limitBasisVnd – never a hand-raised night).
    if (roles.has('manager')) return (await this.folios.limitBasisVnd(tx, folioId, null)) ?? 0;
    const today = localDate(this.clock.now(), await this.folios.timezone(tx));
    if (roles.has('front_desk_lead')) {
      const limits = await this.param<Record<string, { perTimeVnd?: unknown }>>(
        tx,
        'foc_limits',
        today,
      );
      const v = limits?.front_desk_lead?.perTimeVnd;
      return typeof v === 'number' ? v : 0;
    }
    return (await this.param<number>(tx, 'foc_self_apply.front_desk.per_time', today)) ?? 0;
  }

  private async param<T>(tx: Tx, key: string, day: string): Promise<T | null> {
    try {
      return await this.params.get<T>(tx, key, day);
    } catch (e) {
      if (e instanceof ParameterMissingError) return null;
      throw e;
    }
  }
}
