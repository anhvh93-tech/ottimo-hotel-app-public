/**
 * "Cần chú ý" items of the reporting module (US-012 AC7, AC8; BR-907, BR-435; EP01 3.1, 3.3), computed at read
 * time (never stored) and registered through EventsService.registerAttentionSource. The list is filtered per
 * role by the events module (attentionAudience): `foc_threshold` reaches OWN only (AC6/AC8, US-003 AC4).
 *
 * - `vip_arrival` (info, one line per booking – DOM D-14 b; BR-956 v0.3.8 (2), BR-907): a primary booking still
 *   `confirmed` arriving on the business date whose booker carries the group VIP or "Khách quen" (BR-956 (1)
 *   catalogue, compared without case/diacritics – aliases `returning`, `regular` kept) OR whose booker already
 *   has a checked-out stay at the property (returning guest, recognised without a tag – DOM-S4-11). A "maybe the
 *   same person" flag from documents (BR-952) does NOT count (BR-956 (3)). Checked in → the line goes.
 *   No params (no name – SEC J): `refCode` = booking code, `roomNos`, `dueAt` = ETA (else check-in time).
 * - `foc_threshold` (warning, BR-435 v0.3.8 – PO 16/10 AC8: computed when OWN opens the page, no job; J21 push is
 *   R3): period = 1st of the month of the business date → now, on the BUSINESS-day axis (rollover).
 *   (a) Reduction value K-18 = FOC **and special discount** (DOM-S4-08): −Σ posted `foc` + `discount` lines
 *       (their reversals included, so a reversed or cancelled one nets to 0; pending / rejected lines are not
 *       posted) by service date (else the business date of posting) in the period, compared with
 *       `foc_alert_pct_of_room_revenue` % of the room revenue K-06 (Σ `stay_night.room_revenue_vnd` of `sold`
 *       nights in the period). Revenue 0 with a reduction > 0 still alerts (no `pct` – shown "–", Q-15).
 *       params {check: foc_pct_of_room_revenue, pct?, threshold}.
 *   (b) per approver: foc + special_discount requests decided in the period and still ALIVE (`foc_state`
 *       applied / dormant – the BR-433 set; cancelled by rule, suspended, rejected, pending do not count). A
 *       self-applied minibar FOC counts for the person who applied it (approver_id = that person, BR-436).
 *       Above `foc_alert_count_per_approver` → one line per approver: params {check: foc_count_per_approver,
 *       count, max}; the approver is NOT named in params – `link` opens the approvals list filtered on that
 *       approver (an id, not a name).
 */
import type { Tx } from '../../../db/database';
import { type LocalTime, atLocal } from '../../../shared/time';
import type {
  AttentionItem,
  AttentionSource,
  AttentionSourceContext,
} from '../../events/public/events.service';

const VIP_TAGS = new Set(['vip', 'khach quen', 'returning', 'regular']);

/** Lower case, no diacritics (đ → d), single spaces – "Khách quen" ≡ "khach quen". */
export function normalizeTag(tag: string): string {
  return tag
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export const vipArrivals: AttentionSource = async (tx: Tx, ctx: AttentionSourceContext) => {
  const checkin = (await ctx.param<LocalTime>('checkin_time')) ?? '14:00';
  const { rows } = await tx.query<{
    id: string;
    code: string;
    eta_time: string | null;
    room_no: string | null;
    tags: string[] | null;
    returning: boolean;
  }>(
    `SELECT r.id, r.code, to_char(r.eta_time, 'HH24:MI') AS eta_time, seg.room_no, g.tags,
            EXISTS (SELECT 1 FROM reservation p
                     WHERE p.booker_guest_id = r.booker_guest_id AND p.id <> r.id
                       AND p.status = 'checked_out') AS returning
       FROM reservation r
       JOIN guest g ON g.id = r.booker_guest_id
       LEFT JOIN LATERAL (
         SELECT rm.room_no FROM reservation_segment s JOIN room rm ON rm.id = s.room_id
          WHERE s.reservation_id = r.id AND s.active ORDER BY s.from_date LIMIT 1) seg ON true
      WHERE r.arrival_date = $1 AND r.status = 'confirmed' AND r.parent_reservation_id IS NULL
      ORDER BY r.eta_time NULLS LAST, r.code`,
    [ctx.today],
  );
  return rows
    .filter((r) => r.returning || (r.tags ?? []).some((t) => VIP_TAGS.has(normalizeTag(t))))
    .map((r): AttentionItem => ({
      kind: 'vip_arrival',
      source: 'computed',
      severity: 'info',
      count: 1,
      dueAt: ctx.iso(atLocal(ctx.today, r.eta_time ?? checkin, ctx.tz)),
      reservationIds: [r.id],
      ...(r.room_no ? { roomNos: [r.room_no] } : {}),
      refCode: r.code,
    }));
};

/** K-03-style rounding of a percentage: one decimal, half up. */
function pct1(part: number, whole: number): number {
  return Math.round((part * 1000) / whole) / 10;
}

/** FOC / special-discount states that are ALIVE (BR-433 quota set – BR-435 v0.3.8 counts the same). */
export const LIVE_REDUCTION_STATES = ['applied', 'dormant'] as const;

/**
 * BR-435 (a) decision on integers (no float on money): threshold = pct % of the room revenue (VND, rounded down);
 * alert when the reduction value is above it. Revenue 0 with a reduction > 0 alerts.
 */
export function focValueCheck(
  reductionVnd: number,
  roomRevenueVnd: number,
  pctLimit: number,
): { thresholdVnd: number; valueAlert: boolean; pct?: number } {
  return {
    thresholdVnd: Math.floor((roomRevenueVnd * pctLimit) / 100),
    valueAlert: reductionVnd > 0 && reductionVnd * 100 > pctLimit * roomRevenueVnd,
    ...(roomRevenueVnd > 0 ? { pct: pct1(reductionVnd, roomRevenueVnd) } : {}),
  };
}

/** BR-435 (b): "một người duyệt > N lần/tháng". */
export const focCountAlert = (count: number, max: number): boolean => count > max;

export const focThreshold: AttentionSource = async (tx: Tx, ctx: AttentionSourceContext) => {
  const pctLimit = await ctx.param<number>('foc_alert_pct_of_room_revenue');
  const countLimit = await ctx.param<number>('foc_alert_count_per_approver');
  const rollover = (await ctx.param<LocalTime>('business_day_rollover')) ?? '06:00';
  const monthStart = `${ctx.today.slice(0, 8)}01`;
  const items: AttentionItem[] = [];
  const month = ctx.today.slice(0, 7);
  if (pctLimit !== undefined) {
    const { rows } = await tx.query<{ reduction_vnd: string | number; room_vnd: string | number }>(
      `SELECT
         (SELECT COALESCE(-SUM(l.amount_vnd), 0) FROM folio_line l
            LEFT JOIN folio_line o ON o.id = l.reversal_of_id
           WHERE l.line_state = 'posted' AND COALESCE(o.category, l.category) IN ('foc', 'discount')
             AND COALESCE(o.service_date, l.service_date,
                          ((l.posted_at AT TIME ZONE $3) - $4::interval)::date)
                 BETWEEN $1 AND $2) AS reduction_vnd,
         (SELECT COALESCE(SUM(room_revenue_vnd), 0) FROM stay_night
           WHERE night_state = 'sold' AND stay_date BETWEEN $1 AND $2) AS room_vnd`,
      [monthStart, ctx.today, ctx.tz, rollover],
    );
    const check = focValueCheck(
      Number(rows[0]?.reduction_vnd ?? 0),
      Number(rows[0]?.room_vnd ?? 0),
      pctLimit,
    );
    if (check.valueAlert) {
      items.push({
        kind: 'foc_threshold',
        source: 'computed',
        severity: 'warning',
        count: 1,
        link: `/approvals?type=foc&month=${month}`,
        params: {
          check: 'foc_pct_of_room_revenue',
          ...(check.pct !== undefined ? { pct: check.pct } : {}),
          threshold: pctLimit,
        },
      });
    }
  }
  if (countLimit !== undefined) {
    const { rows } = await tx.query<{ approver_id: string; n: number }>(
      `SELECT approver_id, count(*)::int AS n FROM approval_request
        WHERE type IN ('foc', 'special_discount') AND status = 'approved'
          AND foc_state = ANY($4::text[]) AND approver_id IS NOT NULL
          AND decided_at >= $1 AND decided_at <= $2
        GROUP BY approver_id HAVING count(*) > $3
        ORDER BY count(*) DESC, approver_id`,
      [atLocal(monthStart, rollover, ctx.tz), ctx.now, countLimit, [...LIVE_REDUCTION_STATES]],
    );
    for (const r of rows) {
      if (!focCountAlert(r.n, countLimit)) continue;
      items.push({
        kind: 'foc_threshold',
        source: 'computed',
        severity: 'warning',
        count: r.n,
        link: `/approvals?type=foc&month=${month}&approverId=${r.approver_id}`,
        params: { check: 'foc_count_per_approver', count: r.n, max: countLimit },
      });
    }
  }
  return items;
};

export const REPORTING_ATTENTION_SOURCES: AttentionSource[] = [vipArrivals, focThreshold];
