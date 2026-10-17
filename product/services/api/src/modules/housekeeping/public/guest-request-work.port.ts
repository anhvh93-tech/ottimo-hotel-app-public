/**
 * EP14 ↔ housekeeping / maintenance (BE-D proposal s4-be-d.md 2.3, accepted by BE-C with the changes noted
 * in s4-be-c.md): BE-D's guest requests create the work through GUEST_REQUEST_WORK_PORT (implemented here,
 * called in the createGuestRequest / transitionGuestRequest transaction); the work reports back through
 * GUEST_REQUEST_STATUS_PORT (implemented by BE-D in guest-portal/public, optional here – no-op until bound).
 * Ids, codes and the guest's note only – the note is D23 (shown to HK in scope T, never cached offline).
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';

export const GUEST_REQUEST_WORK_PORT = Symbol('GUEST_REQUEST_WORK_PORT');
export const GUEST_REQUEST_STATUS_PORT = Symbol('GUEST_REQUEST_STATUS_PORT');

export interface GuestRequestWorkPort {
  /**
   * `extra_cleaning` / `amenities` → hk_task `guest_request`, source `guest_app`, BR-807 rank 3 (computed when
   * read), `due_date` = `dueDate` (the business day). HK of the shift is notified (`hk_task_urgent` is NOT
   * used – a guest request is not "dọn gấp"; the PWA sees it through SSE `hk_task.changed`).
   */
  createTask(
    tx: Tx,
    input: {
      guestRequestId: string;
      reservationId: string;
      roomId: string;
      note: string | null;
      dueDate: LocalDate;
      now: Date;
    },
  ): Promise<{ hkTaskId: string }>;
  /**
   * `report_issue` → work order `new`, source `guest_app`, severity `medium` (BR-809/811: the desk raises it),
   * category `other`, title "Khách báo hỏng – căn {roomNo}", description = the guest's note (or a fixed text);
   * notifications `work_order_new` (MT) – sent at once, also outside the desk hours (BR-811).
   */
  createWorkOrder(
    tx: Tx,
    input: {
      guestRequestId: string;
      reservationId: string;
      roomId: string;
      description: string | null;
      now: Date;
    },
  ): Promise<{ workOrderId: string; code: string }>;
  /**
   * Request declined: the linked task still `open` → `cancelled` (`cancel_reason_code = other`, note
   * "Yêu cầu khách bị từ chối"); `in_progress`/`done` stay (HK already working). A work order is never
   * cancelled automatically (the desk decides).
   */
  cancelTask(tx: Tx, hkTaskId: string, now: Date): Promise<void>;
}

export interface GuestRequestStatusPort {
  /** Linked task/work order started → request `in_progress` (+ `acknowledgedAt` when still `new`). */
  onLinkedWorkStarted(tx: Tx, guestRequestId: string, now: Date): Promise<void>;
  /** Linked task done / work order done → request `done` (+ BR-506 fee through BE-B, BE-D's side). */
  onLinkedWorkDone(tx: Tx, guestRequestId: string, now: Date): Promise<void>;
  /** Linked task / work order cancelled → no status change; the desk handles the request. */
  onLinkedWorkCancelled(tx: Tx, guestRequestId: string, now: Date): Promise<void>;
}
