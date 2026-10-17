// H19 grouping and wording of today's tasks. Order inside a group = the server's `priorityRank` (BR-807 –
// the client never re-sorts by its own rules, US-054 AC4); the client only groups (hi-fi 19.1 spec).
import type { HkTask, RoomStatusCode, RoomStatusEntry } from './api';
import { roomLabel } from '@ottimo/i18n';
import { asRoom } from './rooms';
import { hhmm, localDate } from './time';

export type TaskGroup = 'first' | 'stay' | 'later' | 'done';

type T = (key: string, args?: Record<string, string | number>) => string;

export const KIT_TYPES: readonly HkTask['type'][] = [
  'extra_guest_kit_prepare',
  'extra_guest_kit_collect',
  'extra_guest_kit_transfer',
];
const STAY_TYPES: readonly HkTask['type'][] = [
  'stayover_clean',
  'long_stay_clean',
  'guest_request',
  'minibar_refill',
];
export const CLEAN_TYPES: readonly HkTask['type'][] = [
  'checkout_clean',
  'stayover_clean',
  'long_stay_clean',
  'after_repair_clean',
  'adhoc_clean',
  'priority_clean',
];
const OCCUPIED: readonly RoomStatusCode[] = ['OC', 'OD'];

export function isKit(t: Pick<HkTask, 'type'>) {
  return KIT_TYPES.includes(t.type);
}

export function sortByPriority(tasks: readonly HkTask[]): HkTask[] {
  return [...tasks].sort(
    (a, b) =>
      (a.priorityRank ?? Number.MAX_SAFE_INTEGER) - (b.priorityRank ?? Number.MAX_SAFE_INTEGER),
  );
}

export function arrivingToday(room: RoomStatusEntry | undefined, today = localDate()): boolean {
  return room?.nextArrival?.date === today;
}

export function taskGroup(
  task: HkTask,
  status: HkTask['status'],
  roomStatus: RoomStatusCode | undefined,
  room: RoomStatusEntry | undefined,
  today = localDate(),
): TaskGroup {
  if (status === 'done') return 'done';
  if (isKit(task) || task.type === 'priority_clean' || task.dueAt || arrivingToday(room, today)) {
    return 'first';
  }
  if (task.type === 'checkout_clean' && roomStatus && OCCUPIED.includes(roomStatus)) return 'later';
  if (STAY_TYPES.includes(task.type)) return 'stay';
  return 'first';
}

/** Title line of a task card (H19 19.1 / 19.3). */
export function taskTitle(task: HkTask, t: T): string {
  const room = roomLabel(asRoom(task), 'staff');
  const n = task.quantity ?? 1;
  switch (task.type) {
    case 'extra_guest_kit_prepare':
      return t('hk.task.extra_kit', { n, room, time: hhmm(task.dueAt) || '–' });
    case 'extra_guest_kit_collect':
      return t('hk.kit.collect', { n, room });
    case 'extra_guest_kit_transfer':
      return t('hk.kit.transfer_to', { n, room });
    default:
      return t(`hk.type.${task.type}`);
  }
}

/** Label of the one-tap completion button of a non-cleaning task. */
export function completeLabel(task: HkTask, t: T): string {
  switch (task.type) {
    case 'extra_guest_kit_prepare':
      return t('hk.kit.prepared');
    case 'extra_guest_kit_collect':
      return t('hk.kit.collected');
    case 'extra_guest_kit_transfer':
      return t('hk.kit.transferred');
    default:
      return t('hk.task.complete');
  }
}

/** Toast after completing a task (H19 undo toast). */
export function completeToast(task: HkTask, t: T): string {
  const room = roomLabel(asRoom(task), 'staff');
  return task.type === 'extra_guest_kit_prepare'
    ? t('hk.kit.prepared_toast', { room })
    : t('hk.toast.task_done', { room });
}

/** Next arrival sentence of a room card (H19.2). */
export function arrivalText(room: RoomStatusEntry, t: T, today = localDate()): string | undefined {
  const a = room.nextArrival;
  if (!a?.date) return undefined;
  if (a.date === today) return t('hk.arriving_today', { time: a.etaTime ?? '' }).trim();
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  if (a.date === d.toISOString().slice(0, 10)) return t('hk.arriving_tomorrow');
  const [, m, day] = a.date.split('-');
  return t('hk.next_arrival', { when: `${day}/${m}${a.etaTime ? ` ${a.etaTime}` : ''}` });
}

export type RoomFilter = 'all' | 'dirty' | 'occupied' | 'ready' | 'ooo';

/** US-052 AC2 + hi-fi 19.2: Cần dọn = VD/OD/CL · Có khách = OC/OD · Sạch = VC/VI/OC · Đang sửa = OOO. */
export const FILTERS: Record<Exclude<RoomFilter, 'all'>, readonly RoomStatusCode[]> = {
  dirty: ['VD', 'OD', 'CL'],
  occupied: ['OC', 'OD'],
  ready: ['VC', 'VI', 'OC'],
  ooo: ['OOO'],
};

export function inFilter(status: RoomStatusCode, f: RoomFilter): boolean {
  return f === 'all' || FILTERS[f].includes(status);
}
