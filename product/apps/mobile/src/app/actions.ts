// Builders of queued writes (ADR-005 list): every tap gets its Idempotency-Key and `performedAt` NOW,
// then waits 10 s in the queue (undo) before it is sent – online or not.
import { useI18n } from '@ottimo/i18n';
import { useCallback } from 'react';
import { useQueue } from '../queue/QueueProvider';
import { ATT_REF, type NewQueueItem, type QueuedRequest } from '../queue/queue';
import {
  newIdempotencyKey,
  queuedOps,
  type HkTask,
  type InspectionInput,
  type RoomStatusCode,
  type RoomStatusEntry,
  type StaffRequest,
  type WorkOrderCreate,
} from './api';
import { roomLabel } from '@ottimo/i18n';
import { asRoom } from './rooms';
import type { StaffSession } from './session';
import { completeToast } from './tasks';

function queued(req: StaffRequest): QueuedRequest {
  return {
    method: 'POST',
    template: req.template,
    path: req.path,
    body: req.body,
    ...(req.acceptLanguage ? { acceptLanguage: req.acceptLanguage } : {}),
  };
}

export type RefuseReason = 'dnd' | 'guest_refused' | 'other';

export interface IncidentInput {
  roomId: string;
  roomNo: string;
  roomName?: string | null;
  title: string;
  description: string;
  severity: WorkOrderCreate['severity'];
  category: WorkOrderCreate['category'];
  blockRequested: boolean;
  photos: Blob[];
}

export function useHkActions(session: StaffSession) {
  const { t, locale } = useI18n();
  const q = useQueue();
  const pid = session.propertyId;

  const roomStatus = useCallback(
    async (
      room: Pick<RoomStatusEntry, 'roomId' | 'roomNo' | 'roomName'>,
      event: 'start_cleaning' | 'finish_cleaning',
      from: RoomStatusCode,
      task?: Pick<HkTask, 'id'>,
      occupied?: boolean,
    ) => {
      const now = Date.now();
      const target: RoomStatusCode = event === 'start_cleaning' ? 'CL' : occupied ? 'OC' : 'VC';
      const label = roomLabel(asRoom(room), 'staff');
      const item: NewQueueItem = {
        id: newIdempotencyKey(),
        tappedAt: now,
        kind: 'room_status',
        request: queued(
          queuedOps.transitionRoomStatus(pid, room.roomId, {
            event,
            expectedFrom: from,
            performedAt: new Date(now).toISOString(),
            ...(task ? { taskId: task.id } : {}),
          }),
        ),
        roomId: room.roomId,
        roomNo: room.roomNo,
        roomName: room.roomName,
        actionKey:
          event === 'start_cleaning' ? 'hk.action.start_cleaning' : 'hk.action.finish_cleaning',
        // Someone else already did it (two HK on one room, EP07-08 8.4) → "Đã áp dụng".
        targets: event === 'start_cleaning' ? ['CL'] : ['VC', 'OC', 'VI'],
        // "Dọn xong" also closes the room's first open cleaning task on the server (US-053 AC2).
        optimistic: {
          roomStatus: target,
          ...(task && event === 'finish_cleaning' ? { taskId: task.id, taskStatus: 'done' } : {}),
        },
      };
      return q.enqueueUndoable(
        item,
        t('hk.toast.room_status', { room: label, status: t(`hk.status.${target}`) }),
        t('hk.undone_room', { room: label, status: t(`hk.status.${from}`) }),
      );
    },
    [pid, q, t],
  );

  const completeTask = useCallback(
    async (task: HkTask) => {
      const now = Date.now();
      return q.enqueueUndoable(
        {
          id: newIdempotencyKey(),
          tappedAt: now,
          kind: 'hk_task',
          request: queued(
            queuedOps.transitionHkTask(pid, task.id, 'complete', {
              performedAt: new Date(now).toISOString(),
            }),
          ),
          roomId: task.roomId,
          roomNo: task.roomNo,
          roomName: task.roomName,
          actionKey: 'hk.task.complete',
          targets: ['done'],
          optimistic: { taskId: task.id, taskStatus: 'done' },
        },
        completeToast(task, t),
        t('hk.undone'),
      );
    },
    [pid, q, t],
  );

  const refuseTask = useCallback(
    async (task: HkTask, reason: RefuseReason, note?: string) => {
      const now = Date.now();
      return q.enqueueUndoable(
        {
          id: newIdempotencyKey(),
          tappedAt: now,
          kind: 'hk_task',
          request: queued(
            queuedOps.transitionHkTask(pid, task.id, 'cancel', {
              performedAt: new Date(now).toISOString(),
              cancelReasonCode: reason,
              ...(reason === 'other' && note ? { cancelNote: note } : {}),
            }),
          ),
          roomId: task.roomId,
          roomNo: task.roomNo,
          roomName: task.roomName,
          actionKey: 'hk.refuse_save',
          targets: ['cancelled'],
          optimistic: { taskId: task.id, taskStatus: 'cancelled' },
        },
        t('hk.refuse_save'),
        t('hk.undone'),
      );
    },
    [pid, q, t],
  );

  const recordInspection = useCallback(
    async (
      room: Pick<RoomStatusEntry, 'roomId' | 'roomNo' | 'roomName'>,
      input: InspectionInput,
      passed: boolean,
    ) => {
      const label = roomLabel(asRoom(room), 'staff');
      return q.enqueueUndoable(
        {
          id: newIdempotencyKey(),
          tappedAt: Date.parse(input.performedAt),
          kind: 'inspection',
          request: queued(queuedOps.recordInspection(pid, room.roomId, input, locale)),
          roomId: room.roomId,
          roomNo: room.roomNo,
          roomName: room.roomName,
          actionKey: passed ? 'hk.insp.pass' : 'hk.insp.fail_save',
          targets: passed ? ['VI'] : [],
          ...(passed ? { optimistic: { roomStatus: 'VI' } } : {}),
        },
        passed
          ? t('hk.toast.room_status', { room: label, status: t('hk.status.VI') })
          : t('hk.toast.insp_failed', { room: label }),
        t('hk.undone_room', { room: label, status: t('hk.status.VC') }),
      );
    },
    [pid, q, t, locale],
  );

  /** Offline incident report: photos first (queue `blobs`), then the work order that refers to them. */
  const queueIncident = useCallback(
    async (input: IncidentInput) => {
      const now = Date.now();
      const photoItems: NewQueueItem[] = [];
      for (const photo of input.photos) {
        const id = newIdempotencyKey();
        await q.queue.putBlob(id, photo);
        const req = queuedOps.uploadAttachment(pid, photo, 'work_order');
        photoItems.push({
          id,
          tappedAt: now,
          kind: 'attachment',
          request: {
            method: 'POST',
            template: req.template,
            path: req.path,
            upload: { blobKey: id, purpose: 'work_order' },
          },
          roomId: input.roomId,
          roomNo: input.roomNo,
          roomName: input.roomName,
          actionKey: 'hk.photo_n',
          actionArgs: { n: photoItems.length + 1 },
        });
      }
      const body: WorkOrderCreate = {
        roomId: input.roomId,
        title: input.title,
        description: input.description,
        severity: input.severity,
        category: input.category,
        blockRequested: input.blockRequested,
        ...(photoItems.length
          ? { photoAttachmentIds: photoItems.map((p) => `${ATT_REF}${p.id}`) }
          : {}),
      };
      await q.enqueueNow([
        ...photoItems,
        {
          id: newIdempotencyKey(),
          tappedAt: now,
          kind: 'work_order',
          request: queued(queuedOps.createWorkOrder(pid, body)),
          roomId: input.roomId,
          roomNo: input.roomNo,
          roomName: input.roomName,
          actionKey: 'hk.queue.wo_with_photo',
          actionArgs: { n: photoItems.length },
          dependsOn: photoItems.map((p) => p.id),
        },
      ]);
    },
    [pid, q],
  );

  return { roomStatus, completeTask, refuseTask, recordInspection, queueIncident };
}
