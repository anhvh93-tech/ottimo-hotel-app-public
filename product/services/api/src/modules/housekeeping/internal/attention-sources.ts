/**
 * "Cần chú ý" sources of the housekeeping / maintenance tables (US-012, BR-907; OpenAPI 0.3.7 B-12; BE-D's
 * list s4-be-d.md 2.3) – computed when the list is read, FD+ only (default audience), ids / codes / room
 * numbers only (SEC J):
 * - `work_order_high_open` (US-012 AC4, BR-809): one item per open high work order;
 * - `work_order_overdue`: one item per open work order past a running deadline (or past its parts date);
 * - `ooo_ending_work_open` (DOM D-12 h, EP07 6.6): from 12:00 of the last blocked day (`endDatePlanned − 1`) an
 *   active block whose work order is not done – extend it before the room re-opens for sale;
 * - `room_status_mismatch` (BR-806): OC/OD without a guest in house, or a guest in house in a VC/VD/VI room –
 *   reported, never corrected automatically (a BR-424-05 return room is waited for until the next morning).
 * `params` keys are kept only when the events allow-list knows them (ATTENTION_PARAM_KEYS – BE-D).
 */
import type { Tx } from '../../../db/database';
import { addDays } from '../../../shared/time';
import { roomReturnsOn } from '../../reservations/public/room-return';
import {
  ATTENTION_PARAM_KEYS,
  type AttentionItem,
  type AttentionKind,
  type AttentionSource,
} from '../../events/public/events.service';
import { isOverdue } from './work-orders.service';

function allowedParams(
  kind: AttentionKind,
  params: Record<string, string | number>,
): Record<string, string | number> | undefined {
  const keys = ATTENTION_PARAM_KEYS[kind] ?? [];
  const out = Object.fromEntries(Object.entries(params).filter(([k]) => keys.includes(k)));
  return Object.keys(out).length > 0 ? out : undefined;
}

interface OpenWo {
  id: string;
  code: string;
  room_no: string;
  severity: 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'waiting_parts';
  accepted_at: Date | null;
  ack_due_at: Date | null;
  resolve_due_at: Date | null;
  paused_at: Date | null;
  parts_expected_date: string | null;
}

export function housekeepingAttentionSources(): AttentionSource[] {
  const openWorkOrders = async (tx: Tx): Promise<OpenWo[]> =>
    (
      await tx.query<OpenWo>(
        `SELECT w.id, w.code, rm.room_no, w.severity, w.status, w.accepted_at, w.ack_due_at, w.resolve_due_at,
                w.paused_at, w.parts_expected_date::text AS parts_expected_date
           FROM work_order w JOIN room rm ON rm.id = w.room_id
          WHERE w.status IN ('new', 'in_progress', 'waiting_parts')
          ORDER BY w.created_at, w.id LIMIT 200`,
      )
    ).rows;

  const highOpen: AttentionSource = async (tx, ctx) =>
    (await openWorkOrders(tx))
      .filter((w) => w.severity === 'high')
      .map((w): AttentionItem => ({
        kind: 'work_order_high_open',
        source: 'computed',
        severity: 'critical',
        roomNos: [w.room_no],
        refCode: w.code,
        ...(w.resolve_due_at ? { dueAt: ctx.iso(w.resolve_due_at) } : {}),
        link: `/work-orders/${w.id}`,
      }));

  const overdue: AttentionSource = async (tx, ctx) =>
    (await openWorkOrders(tx))
      .filter(
        (w) =>
          isOverdue(w, ctx.now) ||
          (w.status === 'waiting_parts' &&
            !!w.parts_expected_date &&
            w.parts_expected_date < ctx.today),
      )
      .map((w): AttentionItem => ({
        kind: 'work_order_overdue',
        source: 'computed',
        severity: w.severity === 'high' ? 'critical' : 'warning',
        roomNos: [w.room_no],
        refCode: w.code,
        link: `/work-orders/${w.id}`,
      }));

  const oooEnding: AttentionSource = async (tx, ctx) => {
    // From 12:00 local of the last blocked day (DOM D-12 h – before the 14:00 check-in, time to extend).
    const hhmm = ctx.iso(ctx.now).slice(11, 16);
    if (hhmm < '12:00') return [];
    const { rows } = await tx.query<{
      room_no: string;
      end_date_planned: string;
      code: string;
      work_order_id: string;
    }>(
      `SELECT rm.room_no, b.end_date_planned::text AS end_date_planned, w.code, w.id AS work_order_id
         FROM room_block b JOIN room rm ON rm.id = b.room_id JOIN work_order w ON w.id = b.work_order_id
        WHERE b.status = 'active' AND b.end_date_actual IS NULL AND b.end_date_planned = $1::date
          AND w.status IN ('new', 'in_progress', 'waiting_parts')`,
      [addDays(ctx.today, 1)],
    );
    return rows.map((r) => {
      const params = allowedParams('ooo_ending_work_open', {
        roomNo: r.room_no,
        endDate: r.end_date_planned,
      });
      return {
        kind: 'ooo_ending_work_open' as const,
        source: 'computed' as const,
        severity: 'warning' as const,
        roomNos: [r.room_no],
        refCode: r.code,
        link: `/work-orders/${r.work_order_id}`,
        ...(params ? { params } : {}),
      };
    });
  };

  const mismatch: AttentionSource = async (tx, ctx) => {
    // BR-424-05: on the return day the room the guest comes back to is empty until the desk records the move
    // back – not a mismatch that day; still unrecorded the next morning → reported (the stay is in house).
    const waiting = (await roomReturnsOn(tx, ctx.today))
      .filter((r) => !r.recorded)
      .map((r) => r.returnRoomId);
    const { rows } = await tx.query<{ room_no: string }>(
      `WITH stay AS (
         SELECT DISTINCT s.room_id FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
          WHERE s.active AND r.status = 'in_house' AND s.from_date <= $1::date AND s.to_date >= $1::date)
       SELECT rm.room_no FROM room_status rs JOIN room rm ON rm.id = rs.room_id
         LEFT JOIN stay ON stay.room_id = rs.room_id
        WHERE (rs.status IN ('OC', 'OD') AND stay.room_id IS NULL)
           OR (rs.status IN ('VC', 'VD', 'VI') AND stay.room_id IS NOT NULL
               AND NOT (rs.room_id = ANY($2::uuid[])))
        ORDER BY rm.room_no`,
      [ctx.today, waiting],
    );
    if (rows.length === 0) return [];
    return [
      {
        kind: 'room_status_mismatch',
        source: 'computed',
        severity: 'warning',
        count: rows.length,
        roomNos: rows.map((r) => r.room_no),
        link: '/rack',
      },
    ];
  };

  return [highOpen, overdue, oooEnding, mismatch];
}
