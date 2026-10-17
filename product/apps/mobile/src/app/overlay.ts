// Optimistic view (EP07-08 8.3): while an action waits in the queue (undo window or offline), cards show
// the state it will produce, with a "Chờ gửi" chip. A refused item stops counting → the card goes back to
// what the server says.
import type { QueueItem } from '../queue/queue';
import type { HkTask, RoomStatusCode, RoomStatusEntry } from './api';

export interface Effective<T> {
  value: T;
  queued: boolean;
}

function lastFor(items: readonly QueueItem[], match: (i: QueueItem) => boolean) {
  let found: QueueItem | undefined;
  for (const i of items) if (i.state !== 'rejected' && match(i)) found = i;
  return found;
}

export function effectiveRoomStatus(
  room: Pick<RoomStatusEntry, 'roomId' | 'status'>,
  items: readonly QueueItem[],
): Effective<RoomStatusCode> {
  const i = lastFor(items, (x) => x.roomId === room.roomId && Boolean(x.optimistic?.roomStatus));
  return i
    ? { value: i.optimistic!.roomStatus as RoomStatusCode, queued: true }
    : { value: room.status, queued: false };
}

export function effectiveTaskStatus(
  task: Pick<HkTask, 'id' | 'status'>,
  items: readonly QueueItem[],
): Effective<HkTask['status']> {
  const i = lastFor(
    items,
    (x) => x.optimistic?.taskId === task.id && Boolean(x.optimistic.taskStatus),
  );
  return i
    ? { value: i.optimistic!.taskStatus as HkTask['status'], queued: true }
    : { value: task.status, queued: false };
}

/** Room events while the room waits for a queued change: the next step only (SM-03 order). */
export function eventsFor(
  status: RoomStatusCode,
  serverEvents: RoomStatusEntry['allowedEvents'],
  queued: boolean,
) {
  if (!queued) return serverEvents;
  if (status === 'CL') return ['finish_cleaning'] as RoomStatusEntry['allowedEvents'];
  if (status === 'VC') return ['inspect'] as RoomStatusEntry['allowedEvents'];
  return [] as RoomStatusEntry['allowedEvents'];
}
