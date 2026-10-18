// Sentences for a queued action the server refused ("Cần xem lại" – EP07-08 8.3, hi-fi 21.3).
// UXR P-08: plain words per reason – the server code is never part of the sentence, only a small reference.
import { roomLabel } from '@ottimo/i18n';
import { asRoom } from '../app/rooms';
import { hhmm } from '../app/time';
import type { QueueItem } from './queue';

type T = (key: string, args?: Record<string, string | number>) => string;

const ROOM_CODES = new Set(['VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO']);

export function actionText(item: QueueItem, t: T): string {
  return t(item.actionKey, item.actionArgs);
}

export interface RejectionText {
  title: string;
  body: string;
  /** Server code for the desk / support, shown as small text under the sentence (never inside it). */
  reference?: string;
}

export function rejectionText(item: QueueItem, t: T): RejectionText {
  const room = roomLabel(asRoom(item), 'staff');
  const code = item.rejection?.code ?? '';
  const current = item.rejection?.currentState;
  const time = hhmm(item.tappedAt);
  if (item.kind === 'hk_task' && current === 'cancelled') {
    return {
      title: t('hk.queue.task_cancelled', { room }),
      body: t('hk.queue.task_cancelled_body'),
    };
  }
  const title = t('hk.queue.rejected_title', { room, action: actionText(item, t) });
  if (code === 'INVALID_TRANSITION' && current && ROOM_CODES.has(current)) {
    return {
      title,
      body: t('hk.queue.rejected_body', { time, status: t(`hk.status.${current}`) }),
    };
  }
  if (code === 'PERFORMED_AT_OUT_OF_RANGE') {
    // Room / task actions can be sent again with the time of a new tap ("Gửi lại" – P-01, P-08).
    return item.kind === 'room_status' || item.kind === 'hk_task'
      ? { title, body: t('hk.queue.r.time', { time }) }
      : { title, body: t('hk.queue.too_old', { time }) };
  }
  if (code === 'CHECKLIST_OUTDATED')
    return { title, body: t('hk.queue.checklist_outdated', { room }) };
  if (item.kind === 'attachment') return { title, body: t('hk.queue.r.photo'), reference: code };
  if (code === 'FORBIDDEN') return { title, body: t('hk.queue.r.forbidden'), reference: code };
  if (code === 'NOT_FOUND') return { title, body: t('hk.queue.r.not_found'), reference: code };
  return { title, body: t('hk.queue.r.other'), reference: code || undefined };
}
