/**
 * "Cần chú ý" items of the reporting module (US-012 AC7, AC8; BR-907, BR-435; EP01 3.1, 3.3), computed at read
 * time (never stored) and registered through EventsService.registerAttentionSource. The list is filtered per
 * role by the events module (attentionAudience): `foc_threshold` reaches OWN only (AC6/AC8, US-003 AC4).
 *
 * - `vip_arrival` (info, one line per booking – DOM D-14 b): a primary booking still `confirmed` arriving on the
 *   business date whose booker carries the tag VIP or "Khách quen" (catalogue EP00 11.2 – [GIẢ ĐỊNH BE: tag
 *   names compared without case/diacritics: vip, khach quen, returning, regular – DOM E00-06 pending]).
 *   No params (no name – SEC J): `refCode` = booking code, `roomNos`, `dueAt` = ETA (else check-in time).
 * - `foc_threshold` (warning, BR-435 – PO 16/10 AC8: computed when OWN opens the page, no job; J21 push is R3):
 *   period = 1st of the business month → business date (lũy kế – DOM D-14 a).
 *   (a) FOC value K-18 = −Σ posted `foc` lines (their reversals included, so a reversed FOC nets to 0; pending
 *       / rejected lines are not posted) by service date (else posting date) in the period, compared with
 *       `foc_alert_pct_of_room_revenue` % of the room revenue K-06 (Σ `stay_night.room_revenue_vnd` of `sold`
 *       nights in the period). Revenue 0 with FOC > 0 still alerts (no `pct` – shown "–", Q-15).
 *       params {check: foc_pct_of_room_revenue, pct?, threshold}.
 *   (b) approved `foc` requests per approver in the period (self-applied minibar FOC counts for the person who
 *       applied it – approver_id = that person, BR-436) above `foc_alert_count_per_approver` → one line per
 *       approver: params {check: foc_count_per_approver, count, max}; the approver is NOT named in params –
 *       `link` opens the approvals list filtered on that approver (an id, not a name).
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
  }>(
    `SELECT r.id, r.code, to_char(r.eta_time, 'HH24:MI') AS eta_time, seg.room_no, g.tags
       FROM reservation r
       JOIN guest g ON g.id = r.booker_guest_id
       LEFT JOIN LATERAL (
         SELECT rm.room_no FROM reservation_segment s JOIN room rm ON rm.id = s.room_id
          WHERE s.reservation_id = r.id AND s.active ORDER BY s.from_date LIMIT 1) seg ON true
      WHERE r.arrival_date = $1 AND r.status = 'confirmed' AND r.parent_reservation_id IS NULL
        AND cardinality(g.tags) > 0
      ORDER BY r.eta_time NULLS LAST, r.code`,
    [ctx.today],
  );
  return rows
    .filter((r) => (r.tags ?? []).some((t) => VIP_TAGS.has(normalizeTag(t))))
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

export const focThreshold: AttentionSource = async (tx: Tx, ctx: AttentionSourceContext) => {
  const pctLimit = await ctx.param<number>('foc_alert_pct_of_room_revenue');
  const countLimit = await ctx.param<number>('foc_alert_count_per_approver');
  const monthStart = `${ctx.today.slice(0, 8)}01`;
  const items: AttentionItem[] = [];
  const month = ctx.today.slice(0, 7);
  if (pctLimit !== undefined) {
    const { rows } = await tx.query<{ foc_vnd: string | number; room_vnd: string | number }>(
      `SELECT
         (SELECT COALESCE(-SUM(l.amount_vnd), 0) FROM folio_line l
            LEFT JOIN folio_line o ON o.id = l.reversal_of_id
           WHERE l.line_state = 'posted' AND COALESCE(o.category, l.category) = 'foc'
             AND COALESCE(o.service_date, l.service_date, (l.posted_at AT TIME ZONE $3)::date)
                 BETWEEN $1 AND $2) AS foc_vnd,
         (SELECT COALESCE(SUM(room_revenue_vnd), 0) FROM stay_night
           WHERE night_state = 'sold' AND stay_date BETWEEN $1 AND $2) AS room_vnd`,
      [monthStart, ctx.today, ctx.tz],
    );
    const foc = Number(rows[0]?.foc_vnd ?? 0);
    const room = Number(rows[0]?.room_vnd ?? 0);
    // BR-435: FOC > pct % of room revenue (integer arithmetic – no float on money).
    if (foc > 0 && foc * 100 > pctLimit * room) {
      items.push({
        kind: 'foc_threshold',
        source: 'computed',
        severity: 'warning',
        count: 1,
        link: `/approvals?type=foc&month=${month}`,
        params: {
          check: 'foc_pct_of_room_revenue',
          ...(room > 0 ? { pct: pct1(foc, room) } : {}),
          threshold: pctLimit,
        },
      });
    }
  }
  if (countLimit !== undefined) {
    const { rows } = await tx.query<{ approver_id: string; n: number }>(
      `SELECT approver_id, count(*)::int AS n FROM approval_request
        WHERE type = 'foc' AND status = 'approved' AND approver_id IS NOT NULL
          AND decided_at >= $1 AND decided_at <= $2
        GROUP BY approver_id HAVING count(*) > $3
        ORDER BY count(*) DESC, approver_id`,
      [atLocal(monthStart, '00:00', ctx.tz), ctx.now, countLimit],
    );
    for (const r of rows) {
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
