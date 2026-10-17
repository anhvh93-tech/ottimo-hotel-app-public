// H22 – work order wording and order (BR-809): the next deadline as a sentence, overdue → urgent →
// nearest deadline first. All times in the property time zone.
import type { WorkOrder } from './api';
import { ddmm, hhmm, minutesUntil, shortLocalDate } from './time';

type T = (key: string, args?: Record<string, string | number>) => string;

export const OPEN: readonly WorkOrder['status'][] = ['new', 'in_progress', 'waiting_parts'];

export interface Due {
  text: string;
  tone: 'bad' | 'warn' | 'neutral';
}

export function nextDue(wo: WorkOrder, t: T, now = Date.now()): Due | undefined {
  if (!OPEN.includes(wo.status)) return undefined;
  if (wo.status === 'waiting_parts' && wo.severity !== 'high' && wo.partsExpectedDate) {
    return {
      text: t('wo.due.paused', { date: shortLocalDate(wo.partsExpectedDate) }),
      tone: 'neutral',
    };
  }
  if (wo.status === 'new' && wo.ackDueAt) {
    const m = minutesUntil(wo.ackDueAt, now) ?? 0;
    if (m < 0) return { text: t('wo.due.overdue', { m: -m }), tone: 'bad' };
    return {
      text: t('wo.due.ack', { time: hhmm(wo.ackDueAt), m }),
      tone: m <= 15 ? 'bad' : 'warn',
    };
  }
  if (wo.resolveDueAt) {
    const m = minutesUntil(wo.resolveDueAt, now) ?? 0;
    if (m < 0) return { text: t('wo.due.overdue', { m: -m }), tone: 'bad' };
    if (wo.severity === 'high') {
      return { text: t('wo.due.plan', { time: hhmm(wo.resolveDueAt) }), tone: 'warn' };
    }
    return {
      text: t('wo.due.resolve', { when: `${ddmm(wo.resolveDueAt)} ${hhmm(wo.resolveDueAt)}` }),
      tone: 'neutral',
    };
  }
  return undefined;
}

const SEV_RANK: Record<WorkOrder['severity'], number> = { high: 0, medium: 1, low: 2 };

function dueAt(wo: WorkOrder): number {
  const iso = wo.status === 'new' ? (wo.ackDueAt ?? wo.resolveDueAt) : wo.resolveDueAt;
  const v = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(v) ? Number.MAX_SAFE_INTEGER : v;
}

/** Overdue → urgent → nearest deadline (hi-fi 22.1). */
export function sortWorkOrders(list: readonly WorkOrder[], now = Date.now()): WorkOrder[] {
  return [...list].sort((a, b) => {
    const oa = a.isOverdue || dueAt(a) < now ? 0 : 1;
    const ob = b.isOverdue || dueAt(b) < now ? 0 : 1;
    if (oa !== ob) return oa - ob;
    if (SEV_RANK[a.severity] !== SEV_RANK[b.severity])
      return SEV_RANK[a.severity] - SEV_RANK[b.severity];
    return dueAt(a) - dueAt(b);
  });
}

/** BR-804: the block occupies [startDate, endDatePlanned) – "mở bán lại" = endDatePlanned. */
export function reopenDate(wo: WorkOrder): string | undefined {
  const b = wo.roomBlock;
  if (!b || (b.status !== 'active' && b.status !== 'planned')) return undefined;
  return shortLocalDate(b.endDatePlanned);
}

export type WoFilter = 'open' | 'high' | 'parts';

export function inWoFilter(wo: WorkOrder, f: WoFilter): boolean {
  if (!OPEN.includes(wo.status)) return false;
  if (f === 'high') return wo.severity === 'high';
  if (f === 'parts') return wo.status === 'waiting_parts';
  return true;
}

/** Photos after a fix are required for these severities (`wo_done_photo_required_severities`, DOM D-15). */
export const DONE_PHOTO_REQUIRED: readonly WorkOrder['severity'][] = ['high', 'medium'];
