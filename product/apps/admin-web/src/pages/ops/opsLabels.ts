import type {
  GuestRequest,
  HkTask,
  RoomBlock,
  Severity,
  WorkOrder,
  WorkOrderCategory,
} from '@ottimo/api-client';
import { roomLabel } from '@ottimo/i18n';
import type { IconName } from '@ottimo/ui';

type Translate = (key: string, args?: Record<string, string | number>) => string;

/** Staff label from the fields the HK/MT/request DTOs carry (`roomNo` + `roomName` – BR-012). */
export const staffRoom = (x: { roomNo?: string | null; roomName?: string | null }) =>
  roomLabel({ roomNo: x.roomNo, name: x.roomName }, 'staff');
type Tone = 'ok' | 'warn' | 'bad' | 'ink' | 'neutral' | 'oak';

/**
 * Desk labels of EP07/EP08/EP14/EP09 (S10, S11, S30, S13). Staff texts reuse the UXD keys of the PWA and
 * guest-web (`hk.*`, `wo.*`, `guest.req.*`) – one wording for one thing; only Desk-specific sentences are new.
 */
export const TASK_TYPE_KEY: Record<HkTask['type'], string> = {
  checkout_clean: 'hk.type.checkout_clean',
  stayover_clean: 'hk.type.stayover_clean',
  long_stay_clean: 'hk.type.long_stay_clean',
  minibar_refill: 'hk.type.minibar_refill',
  guest_request: 'hk.type.guest_request',
  after_repair_clean: 'hk.type.after_repair_clean',
  adhoc_clean: 'hk.type.adhoc_clean',
  priority_clean: 'hk.type.priority_clean',
  extra_guest_kit_prepare: 'hk.task.extra_kit',
  extra_guest_kit_collect: 'hk.kit.collect',
  extra_guest_kit_transfer: 'hk.desk.type.extra_guest_kit_transfer',
};
/** Types the desk may create by hand (createHkTask – others are system only). */
export const MANUAL_TASK_TYPES: HkTask['type'][] = [
  'adhoc_clean',
  'stayover_clean',
  'priority_clean',
  'minibar_refill',
];
export const TASK_STATUS: Record<HkTask['status'], { key: string; tone: Tone; icon: IconName }> = {
  open: { key: 'hk.desk.status.open', tone: 'neutral', icon: 'clock' },
  in_progress: { key: 'hk.desk.status.in_progress', tone: 'ink', icon: 'broom' },
  done: { key: 'hk.task.complete', tone: 'ok', icon: 'check' },
  cancelled: { key: 'hk.desk.status.cancelled', tone: 'neutral', icon: 'x' },
};
export const TASK_CANCEL_KEY: Record<NonNullable<HkTask['cancelReasonCode']>, string> = {
  guest_refused: 'hk.refuse.said_no',
  dnd: 'hk.refuse.dnd',
  other: 'hk.refuse.other',
  day_ended: 'hk.desk.cancel_by.day_ended',
  reservation_changed: 'hk.desk.cancel_by.reservation_changed',
  room_blocked: 'hk.desk.cancel_by.room_blocked',
};

/** "Dọn trả phòng" / "Chuẩn bị 1 bộ đồ dùng thêm – căn 302 · The Ivory, trước 15:30". */
export function taskTitle(t: Translate, task: HkTask, room: string, time?: string): string {
  const n = task.quantity ?? 1;
  switch (task.type) {
    case 'extra_guest_kit_prepare':
      return t('hk.task.extra_kit', { n, room, time: time ?? '' });
    case 'extra_guest_kit_collect':
      return t('hk.kit.collect', { n, room });
    default:
      return t(TASK_TYPE_KEY[task.type]);
  }
}

export const STATUS_ROOM_KEY = (code: string) => `status.room.${code}`;
/** Room groups of the S10 filter (EP07-08 1.3). */
export const ROOM_FILTERS = {
  all: { key: 'hk.filter.all', codes: ['VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO'] },
  dirty: { key: 'hk.filter.dirty', codes: ['VD', 'OD', 'CL'] },
  occupied: { key: 'hk.filter.occupied', codes: ['OC', 'OD'] },
  ready: { key: 'hk.filter.ready', codes: ['VI', 'VC'] },
  ooo: { key: 'hk.filter.ooo', codes: ['OOO'] },
} as const;
export const ROOM_TONE: Record<string, Tone> = {
  VC: 'oak',
  VI: 'ok',
  VD: 'warn',
  CL: 'warn',
  OC: 'ink',
  OD: 'warn',
  OOO: 'bad',
};

export const WO_CATEGORIES: WorkOrderCategory[] = [
  'hot_water',
  'power',
  'leak',
  'door_lock',
  'drain',
  'wifi',
  'broken_item',
  'other',
];
export const WO_CATEGORY_KEY: Record<WorkOrderCategory, string> = {
  hot_water: 'hk.wo.k.hot_water',
  power: 'hk.wo.k.power',
  leak: 'hk.wo.k.leak',
  door_lock: 'hk.wo.k.lock',
  drain: 'wo.cat.drain',
  wifi: 'wo.cat.wifi',
  broken_item: 'hk.wo.k.broken',
  other: 'hk.wo.k.other',
};
/** BR-809 default (a suggestion – the creator may change it): high-group issue in an occupied room → high. */
export const HIGH_GROUP: WorkOrderCategory[] = ['hot_water', 'power', 'leak', 'door_lock', 'drain'];
export function suggestedSeverity(category: WorkOrderCategory, occupied: boolean): Severity {
  if (HIGH_GROUP.includes(category) && occupied) return 'high';
  return occupied ? 'medium' : 'low';
}
export const SEVERITIES: Severity[] = ['high', 'medium', 'low'];
export const SEV_TONE: Record<Severity, Tone> = { high: 'bad', medium: 'warn', low: 'neutral' };
export const WO_STATUS: Record<WorkOrder['status'], { key: string; tone: Tone; icon: IconName }> = {
  new: { key: 'wo.status.new', tone: 'warn', icon: 'bell' },
  in_progress: { key: 'wo.status.in_progress', tone: 'ink', icon: 'wrench' },
  waiting_parts: { key: 'wo.status.waiting_parts', tone: 'warn', icon: 'hourglass' },
  done: { key: 'wo.status.done', tone: 'ok', icon: 'check' },
  cancelled: { key: 'wo.status.cancelled', tone: 'neutral', icon: 'x' },
};
/** SM-04 action → button label. */
export const WO_ACTION_KEY: Record<string, string> = {
  accept: 'wo.action.start',
  'wait-parts': 'wo.action.wait_parts',
  resume: 'wo.action.resume',
  complete: 'wo.action.done',
  cancel: 'wo.action.cancel',
  reopen: 'wo.action.reopen',
};

export const BLOCK_STATUS: Record<RoomBlock['status'], { key: string; tone: Tone }> = {
  planned: { key: 'ooo.status.planned', tone: 'warn' },
  active: { key: 'ooo.status.active', tone: 'bad' },
  released: { key: 'ooo.status.released', tone: 'ok' },
  cancelled: { key: 'ooo.status.cancelled', tone: 'neutral' },
};

export const REQ_TYPE_KEY: Record<GuestRequest['type'], string> = {
  extra_cleaning: 'guest.req.clean',
  amenities: 'guest.req.towels',
  report_issue: 'guest.req.repair',
  transport_tour: 'guest.req.transport',
  late_checkout: 'guest.req.late',
  other: 'guest.req.other',
};
export const REQ_STATUS: Record<
  GuestRequest['status'],
  { key: string; tone: Tone; icon: IconName }
> = {
  new: { key: 'wo.status.new', tone: 'warn', icon: 'bell' },
  acknowledged: { key: 'guest.req.status.acknowledged', tone: 'ink', icon: 'check' },
  in_progress: { key: 'guest.req.status.in_progress', tone: 'ink', icon: 'clock' },
  done: { key: 'guest.req.status.done', tone: 'ok', icon: 'check' },
  declined: { key: 'guest.req.status.declined', tone: 'neutral', icon: 'x' },
};
export const DEPT_KEY: Record<GuestRequest['routedTo'], string> = {
  housekeeping: 'nav.housekeeping',
  maintenance: 'nav.maintenance',
  front_desk: 'role.front_desk',
};
export const DECLINE_REASONS: NonNullable<GuestRequest['declinedReasonCode']>[] = [
  'not_available_now',
  'outside_service_hours',
  'needs_front_desk',
  'duplicate',
  'other',
];
/** FB-R2-UXD-FE-S4-18: one key per 0.3.7 enum code – the same sentence the guest reads on guest-web. */
export const declineKey = (code: NonNullable<GuestRequest['declinedReasonCode']>) =>
  `guest.req.decline.${code}`;

/** Every key the maps above can produce – checked against the UXD strings in a test. */
export const OPS_LABEL_KEYS: string[] = [
  ...Object.values(TASK_TYPE_KEY),
  ...Object.values(TASK_STATUS).map((x) => x.key),
  ...Object.values(TASK_CANCEL_KEY),
  ...Object.values(ROOM_FILTERS).map((x) => x.key),
  ...['VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO'].map(STATUS_ROOM_KEY),
  ...Object.values(WO_CATEGORY_KEY),
  ...SEVERITIES.map((s) => `wo.sev.${s}`),
  ...SEVERITIES.map((s) => `wo.sev.${s}_help`),
  ...Object.values(WO_STATUS).map((x) => x.key),
  ...Object.values(WO_ACTION_KEY),
  ...Object.values(BLOCK_STATUS).map((x) => x.key),
  ...Object.values(REQ_TYPE_KEY),
  ...Object.values(REQ_STATUS).map((x) => x.key),
  ...Object.values(DEPT_KEY),
  ...DECLINE_REASONS.map(declineKey),
];
