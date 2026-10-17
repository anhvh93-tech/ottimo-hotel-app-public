/**
 * Pure rules of the housekeeping / maintenance module (no database) – SM-03 (room status), SM-14 (task),
 * SM-04 (work order), BR-802…809, EP07-08 spec (BA v0.1) and OpenAPI 0.3.7 nhóm H.
 */
import type { RoomStatusCode } from '../../../db/schema/frontdesk';
import type {
  WorkOrderCategory,
  WorkOrderSeverity,
  WorkOrderStatus,
} from '../../../db/schema/housekeeping';
import type { HkTaskType } from '../../../db/schema/reservations';

export const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'] as const;
export const FDL_PLUS = ['owner', 'manager', 'front_desk_lead'] as const;
export const MGR_PLUS = ['owner', 'manager'] as const;
export const HK = 'housekeeping';
export const MT = 'maintenance';

export const has = (roles: readonly string[], allowed: readonly string[]): boolean =>
  roles.some((r) => allowed.includes(r));

/** Only HK (no desk role): row scope T applies (EP07 0 "Phạm vi T"). */
export const isHkOnly = (roles: readonly string[]): boolean =>
  roles.includes(HK) && !has(roles, FD_PLUS);
/** MT without a desk or HK role: read only. */
export const isMtOnly = (roles: readonly string[]): boolean =>
  roles.includes(MT) && !has(roles, FD_PLUS) && !roles.includes(HK);

/** BR-801 labels (admin-web shows code + name; the PWA uses its own `hk.status.*` sentences). */
export const STATUS_LABEL: Readonly<Record<RoomStatusCode, string>> = {
  VC: 'Trống · sạch',
  VI: 'Đã kiểm · sẵn sàng',
  VD: 'Trống · cần dọn',
  CL: 'Đang dọn',
  OC: 'Có khách · sạch',
  OD: 'Có khách · cần dọn',
  OOO: 'Hỏng · khóa phòng',
};

export type RoomEvent = 'start_cleaning' | 'finish_cleaning' | 'needs_cleaning';
export type RoomAction = RoomEvent | 'inspect';

/**
 * `allowedEvents` of a room (EP07 2.1 – computed by the server, never by the client): VD/OD → start; CL →
 * finish; OC → needs cleaning; VC → inspect (FDL+, or HK with `hk_self_inspection_enabled`). HK only inside
 * scope T; MT never (A80 ✖). VI and OOO have no manual event (R5 / SM-02 only).
 */
export function allowedEvents(
  status: RoomStatusCode,
  roles: readonly string[],
  opts: { inScope: boolean; selfInspection: boolean },
): RoomAction[] {
  const desk = has(roles, FD_PLUS);
  const hk = roles.includes(HK) && opts.inScope;
  if (!desk && !hk) return [];
  switch (status) {
    case 'VD':
    case 'OD':
      return ['start_cleaning'];
    case 'CL':
      return ['finish_cleaning'];
    case 'OC':
      return ['needs_cleaning'];
    case 'VC':
      return has(roles, FDL_PLUS) || (hk && opts.selfInspection) ? ['inspect'] : [];
    default:
      return [];
  }
}

/** SM-03 target of a manual event (R1, R2/R3, R8a); null = not allowed from `from`. */
export function roomTarget(
  from: RoomStatusCode,
  event: RoomEvent,
  inHouse: boolean,
): { to: RoomStatusCode; code: string } | null {
  if (event === 'start_cleaning' && (from === 'VD' || from === 'OD'))
    return { to: 'CL', code: 'R1' };
  if (event === 'finish_cleaning' && from === 'CL') {
    return inHouse ? { to: 'OC', code: 'R2' } : { to: 'VC', code: 'R3' };
  }
  if (event === 'needs_cleaning' && from === 'OC') return { to: 'OD', code: 'R8' };
  return null;
}

/** `filter` of listRoomStatuses (US-052 AC2, EP07 1.3). */
export function matchesFilter(
  filter: 'all' | 'needs_cleaning' | 'occupied' | 'ready',
  status: RoomStatusCode,
  inHouse: boolean,
): boolean {
  switch (filter) {
    case 'needs_cleaning':
      return status === 'VD' || status === 'OD' || status === 'CL';
    case 'occupied':
      return status === 'OC' || status === 'OD' || (status === 'CL' && inHouse);
    case 'ready':
      return status === 'VI' || status === 'VC';
    default:
      return true;
  }
}

/** Cleaning tasks a "Bắt đầu dọn" / "Dọn xong" moves along (US-053 AC2). */
export const CLEAN_TYPES: readonly HkTaskType[] = [
  'priority_clean',
  'checkout_clean',
  'after_repair_clean',
  'stayover_clean',
  'long_stay_clean',
  'adhoc_clean',
  'guest_request',
];

/** Types the desk may create by hand (EP07 3.6); the others are system-only. */
export const MANUAL_TASK_TYPES: readonly HkTaskType[] = [
  'adhoc_clean',
  'stayover_clean',
  'priority_clean',
  'minibar_refill',
];

/** HK may cancel only these, when the guest refused / hung the DND sign (rbac note 33). */
export const HK_CANCELLABLE: readonly HkTaskType[] = ['stayover_clean', 'long_stay_clean'];

export interface RankInput {
  type: HkTaskType;
  /** The room has a guest arriving today (any task of that room – BR-807 rank 2). */
  arrivalToday: boolean;
  /** The task's booking is in house (kit tasks of a guest already in – rank 1, BR-812 (5)). */
  reservationInHouse: boolean;
  /** Stay-over of a VIP / returning guest (rank 4). */
  vip: boolean;
}

/** BR-807 / EP07 3.3 – 7 ranks (smaller = first). */
export function priorityRank(t: RankInput): number {
  if (t.type === 'priority_clean') return 1;
  if (t.type.startsWith('extra_guest_kit_') && t.type !== 'extra_guest_kit_collect') {
    if (t.reservationInHouse || t.type === 'extra_guest_kit_transfer') return 1;
    return 2;
  }
  if (t.arrivalToday && t.type !== 'extra_guest_kit_collect') return 2;
  if (t.type === 'guest_request') return 3;
  if ((t.type === 'stayover_clean' || t.type === 'long_stay_clean') && t.vip) return 4;
  if (t.type === 'checkout_clean' || t.type === 'after_repair_clean') return 5;
  if (t.type === 'stayover_clean' || t.type === 'long_stay_clean') return 6;
  return 7;
}

/** BR-809 (EP07 6.4): default severity – a suggestion, the creator may change it. */
const HIGH_WHEN_OCCUPIED: readonly WorkOrderCategory[] = [
  'hot_water',
  'power',
  'leak',
  'door_lock',
  'drain',
];
const UP: Record<WorkOrderSeverity, WorkOrderSeverity> = {
  low: 'medium',
  medium: 'high',
  high: 'high',
};

export function defaultSeverity(
  category: WorkOrderCategory,
  occupancy: 'none' | 'short' | 'long',
): WorkOrderSeverity {
  let s: WorkOrderSeverity;
  if (occupancy !== 'none') s = HIGH_WHEN_OCCUPIED.includes(category) ? 'high' : 'medium';
  else s = 'low';
  if (occupancy === 'long' && (category === 'wifi' || category === 'hot_water')) s = UP[s];
  return s;
}

/** `wo_sla` (BR-809): high → ack minutes + plan hours (never paused); medium/low → done hours. */
export interface WoSla {
  high?: { ackMinutes?: number; planHours?: number };
  medium?: { doneHours?: number };
  low?: { doneHours?: number };
}

export function deadlines(
  sla: WoSla,
  severity: WorkOrderSeverity,
  from: Date,
): { ackDueAt: Date | null; resolveDueAt: Date | null } {
  const at = (ms: number) => new Date(from.getTime() + ms);
  if (severity === 'high') {
    const ack = sla.high?.ackMinutes;
    const plan = sla.high?.planHours;
    return {
      ackDueAt: ack !== undefined ? at(ack * 60_000) : null,
      resolveDueAt: plan !== undefined ? at(plan * 3_600_000) : null,
    };
  }
  const hours = sla[severity]?.doneHours;
  return { ackDueAt: null, resolveDueAt: hours !== undefined ? at(hours * 3_600_000) : null };
}

/** SM-04 actions (W2…W6) and the statuses they leave from. */
export const WO_ACTIONS = [
  'accept',
  'wait-parts',
  'resume',
  'complete',
  'cancel',
  'reopen',
] as const;
export type WoAction = (typeof WO_ACTIONS)[number];

const FROM: Record<WoAction, readonly WorkOrderStatus[]> = {
  accept: ['new'],
  'wait-parts': ['in_progress'],
  resume: ['waiting_parts'],
  complete: ['in_progress'],
  cancel: ['new', 'waiting_parts'],
  reopen: ['done'],
};
const TO: Record<WoAction, WorkOrderStatus> = {
  accept: 'in_progress',
  'wait-parts': 'waiting_parts',
  resume: 'in_progress',
  complete: 'done',
  cancel: 'cancelled',
  reopen: 'in_progress',
};
export const WO_CODE: Record<WoAction, string> = {
  accept: 'W2',
  'wait-parts': 'W3',
  resume: 'W3',
  complete: 'W4',
  cancel: 'W5',
  reopen: 'W6',
};

export function woTarget(from: WorkOrderStatus, action: WoAction): WorkOrderStatus | null {
  return FROM[action].includes(from) ? TO[action] : null;
}

/** `allowedActions` of a work order for the caller (EP07 6.1): HK none; MT cancels only its own `new`. */
export function woAllowedActions(
  wo: { status: WorkOrderStatus; createdBy: string | null },
  roles: readonly string[],
  userId: string,
): WoAction[] {
  const desk = has(roles, FD_PLUS);
  const mt = roles.includes(MT);
  if (!desk && !mt) return [];
  return WO_ACTIONS.filter((a) => {
    if (!FROM[a].includes(wo.status)) return false;
    if (a === 'reopen') return desk;
    if (a === 'cancel' && !desk) return wo.status === 'new' && wo.createdBy === userId;
    return true;
  });
}

/** SR-PWA-05 / OpenAPI B-02: device time accepted in [now − 24 h, now + 5 min]. */
export function performedAtInRange(performedAt: Date, now: Date): boolean {
  const t = performedAt.getTime();
  return t >= now.getTime() - 24 * 3_600_000 && t <= now.getTime() + 5 * 60_000;
}
