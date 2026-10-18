import type { AttentionItem, Role } from '@ottimo/api-client';
import type { IconName } from '@ottimo/ui';
import { timeHHmm } from './dates';
import { dayMonth } from './reservations';

type Translate = (key: string, args?: Record<string, string | number>) => string;

/**
 * One line of "Cần chú ý" (US-012, BR-907) for H03 Hôm nay and H24 Tổng quan – the SAME sentence on both
 * (hi-fi 24.3: one string per `AttentionItem.kind`, params from the API, never built from free text). Only
 * codes, room numbers, counts and times are shown (SR-RET-06: `visa_expiring` = booking code only).
 */
export interface AttentionLine {
  key: string;
  text: string;
  sub?: string;
  icon: IconName;
  /** DS `.task` tone: critical → urgent (red), warning → soon (amber), info. Always with text (A4). */
  tone: 'urgent' | 'soon' | 'info';
  /** Desk route that handles it; none → static row. */
  to?: string;
  /** `source=event` items closed by hand (`resolveAttentionEvent`) – label key of the button. */
  resolveLabel?: string;
  /** Note required to close (critical items – EP01 3.2). */
  noteRequired: boolean;
  ownerOnly: boolean;
  item: AttentionItem;
}

export interface AttentionContext {
  t: Translate;
  /** "401 · The Pine" for staff (BR-012). */
  room: (roomNo?: string | null) => string;
  /** Channel display name from its code. */
  channel: (code: string) => string;
  roles: Role[];
  timeZone?: string;
  /** Number with ≤ 1 decimal in the UI locale ("3,4" VI / "3.4" EN – content-guide 4, FE-S4-19). */
  num?: (n: number) => string;
}

const TONE = { critical: 'urgent', warning: 'soon', info: 'info' } as const;
const ICON: Partial<Record<AttentionItem['kind'], IconName>> = {
  vip_arrival: 'star',
  room_ooo: 'lock',
  rent_due_soon: 'calendar',
  lease_expiring: 'calendar',
  registration_due: 'id',
  registration_overdue: 'id',
  visa_expiring: 'globe',
  work_order_high_open: 'wrench',
  work_order_overdue: 'wrench',
  ooo_ending_work_open: 'wrench',
  hold_expiring: 'hourglass',
  meter_not_read: 'sliders',
  channel_sync_error: 'alert',
  foc_threshold: 'tag',
  overbooking: 'alert',
  unassigned_with_free_room: 'bed',
  capacity_conflict: 'users',
  data_quality: 'question',
  deposit_after_cancel: 'bill',
  closed_reservation_credit: 'bill',
  reconcile_overdue: 'bill',
  no_show_call: 'clock',
  no_show_mark: 'clock',
  ota_no_show_report: 'globe',
  security_alert: 'shield',
  extra_guest_kit_overdue: 'sofa',
  room_status_mismatch: 'broom',
  guest_request_overdue: 'chat',
};
/** Closed by the system when the business state changes (EP01 3.2) – no "Đã xử lý" button. */
const AUTO_CLOSE = new Set([
  'overbooking',
  'unassigned_with_free_room',
  'closed_reservation_credit',
]);
/** Only the owner closes these (EP01 3.2). */
const OWNER_CLOSE = new Set(['data_quality', 'security_alert']);

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const fmt = (ctx: AttentionContext, v: unknown) =>
  v === undefined || v === null || !ctx.num || Number.isNaN(Number(v))
    ? str(v)
    : ctx.num(Number(v));

export function attentionLine(item: AttentionItem, ctx: AttentionContext): AttentionLine {
  const { t } = ctx;
  const p = item.params ?? {};
  const n = item.count ?? item.reservationIds?.length ?? 1;
  const code = item.refCode ?? '';
  const time = item.dueAt ? timeHHmm(new Date(item.dueAt), ctx.timeZone) : '';
  const rooms = (item.roomNos ?? []).map((r) => ctx.room(r));
  const firstRoom = ctx.room(str(p.roomNo) || item.roomNos?.[0]);
  // `ooo_ending_work_open` carries `params.roomNo` + `params.endDate` (0.3.7); `room_ooo` has no date.
  const endDate = str(p.endDate);
  const rsv =
    item.reservationIds?.length === 1 ? `/reservations/${item.reservationIds[0]}` : undefined;
  let key = `attn.${item.kind}`;
  let args: Record<string, string | number> = { n };
  let sub: string | undefined;
  let to: string | undefined = rsv;

  switch (item.kind) {
    case 'room_ooo':
      // 0.3.7 add. 1: only `count` + `roomNos` – the reopening date is on the rack / Bảo trì › Khóa phòng.
      key = 'attn.room_ooo_rooms';
      args = { rooms: rooms.join(', ') };
      to = '/maintenance';
      break;
    case 'registration_due':
      // UXR S4 P-21: before any guest has checked in there is no deadline yet – no dangling "hạn sớm nhất".
      if (!time) key = 'attn.registration_due_no_time';
      args = time ? { n, time } : { n };
      sub = rooms.join(', ') || undefined;
      to = '/registration';
      break;
    case 'registration_overdue':
      to = '/registration';
      break;
    case 'visa_expiring':
    case 'capacity_conflict':
    case 'no_show_mark':
    case 'closed_reservation_credit':
      args = { code };
      break;
    case 'hold_expiring':
    case 'no_show_call':
      args = { code, time };
      break;
    case 'deposit_after_cancel':
      key = 'today.money_after_cancel';
      args = { code };
      sub = t('today.money_after_cancel_body');
      break;
    case 'work_order_high_open':
      args = { n, rooms: rooms.join(', ') };
      to = '/maintenance';
      break;
    case 'work_order_overdue':
      args = { code };
      to = '/maintenance';
      break;
    case 'ooo_ending_work_open':
      args = { room: firstRoom, date: endDate ? dayMonth(endDate) : '', code };
      to = '/maintenance';
      break;
    case 'extra_guest_kit_overdue':
      args = { room: firstRoom };
      to = '/housekeeping';
      break;
    case 'room_status_mismatch':
      args = { room: firstRoom };
      to = '/housekeeping';
      break;
    case 'overbooking':
      // An OTA booking without a room has no room number – say so and send to the rack lane.
      if (item.roomNos?.length) args = { room: firstRoom };
      else {
        key = 'today.unassigned_title';
        args = { n };
        sub = code || undefined;
      }
      to = '/rack';
      break;
    case 'unassigned_with_free_room':
      to = '/rack';
      break;
    case 'reconcile_overdue':
      args = { n: Number(p.count ?? n), days: str(p.oldestDays) };
      to = '/audit';
      break;
    case 'ota_no_show_report':
      key = p.action === 'revoke' ? 'attn.ota_no_show_revoke' : 'attn.ota_no_show_report';
      args = { code, channel: ctx.channel(str(p.channel)) };
      break;
    case 'data_quality':
      if (p.check === 'registration_stay_not_closed') {
        key = n === 1 && code ? 'attn.dq_stay_not_closed_one' : 'attn.dq_stay_not_closed';
        args = { n, code };
      } else if (p.check === 'registration_party_docs_unlinked') {
        key = n === 1 && code ? 'attn.dq_party_docs_unlinked_one' : 'attn.dq_party_docs_unlinked';
        args = { n, code, time };
        sub = t('attn.dq_party_docs_unlinked_body');
      }
      break;
    case 'foc_threshold':
      // 0.3.7 add. 1: two lines by `params.check` – ratio (no `pct` when room revenue = 0) / per approver.
      if (p.check === 'foc_pct_of_room_revenue' && p.pct !== undefined)
        [key, args] = ['attn.foc_pct', { pct: fmt(ctx, p.pct), threshold: fmt(ctx, p.threshold) }];
      else if (p.check === 'foc_count_per_approver')
        [key, args] = ['attn.foc_count', { count: str(p.count), max: str(p.max) }];
      else args = {};
      to = '/approvals';
      break;
    case 'security_alert':
      to = '/settings/users';
      break;
    case 'guest_request_overdue':
    case 'channel_sync_error':
    case 'vip_arrival':
    case 'rent_due_soon':
    case 'lease_expiring':
    case 'meter_not_read':
      break;
    default:
      // A kind added to the contract after this build: still shown (never dropped), generic sentence.
      key = 'attn.other';
      args = { n };
  }

  const event = item.source === 'event' && !!item.eventId && !AUTO_CLOSE.has(item.kind);
  const mayClose = event && (!OWNER_CLOSE.has(item.kind) || ctx.roles.includes('owner'));
  return {
    // Stable identity across reads (new-item detection): kind + ids + params (two `foc_threshold` lines –
    // ratio and per approver – differ only by `params.check`).
    key: [
      item.kind,
      item.eventId ?? '',
      code,
      (item.reservationIds ?? []).join(','),
      (item.roomNos ?? []).join(','),
      JSON.stringify(item.params ?? {}),
    ].join('|'),
    text: t(key, args),
    sub,
    icon: ICON[item.kind] ?? 'alert',
    tone: TONE[item.severity],
    to,
    resolveLabel: mayClose
      ? item.kind === 'ota_no_show_report'
        ? 'attn.reported_channel'
        : 'attn.resolve'
      : undefined,
    noteRequired: item.severity === 'critical',
    ownerOnly: item.kind === 'foc_threshold' || item.kind === 'security_alert',
    item,
  };
}
