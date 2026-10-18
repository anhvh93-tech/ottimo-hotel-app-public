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

/** SM-14 states of an hk_task (OpenAPI `HkTaskStatus`). */
export const HK_TASK_STATUSES = ['open', 'in_progress', 'done', 'cancelled'] as const;
export type HkTaskStatus = (typeof HK_TASK_STATUSES)[number];
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
  /**
   * BR-506 v0.3.8 / BR-506-03 (ARC FB-R2-ARC-BE-S4-09 – the money decision reads housekeeping through this port,
   * not the `hk_task` table): `done_at` of the LAST full clean of `roomId` done in [`since`, `until`], or null.
   * A full clean = a task of FULL_CLEAN_TASK_TYPES, or the `guest_request` task of one of `fullCleanRequestIds`
   * (the caller's own requests that count as a full clean – an earlier "Dọn thêm"; guest-portal owns that
   * table). Cancelled / open tasks never count.
   */
  lastFullCleanAt(
    tx: Tx,
    input: {
      roomId: string;
      since: Date;
      until: Date;
      fullCleanRequestIds?: readonly string[];
    },
  ): Promise<Date | null>;
  /**
   * ARC FB-R2-ARC-BE-S4-07, agreed in openapi-0.3.7.md 16.24 (s4) – implemented by BE-C in
   * GuestRequestWorkAdapter: the status of the linked task (HkTaskStatus), null when the task is not found. guest-portal calls it right AFTER `cancelTask` (which
   * holds the task row – 16.19 bổ sung 3), to accept `decline` of an `in_progress` request whose task was
   * cancelled. Optional: until it exists such a request can only be completed – without a fee (S4-07).
   */
  taskStatus?(tx: Tx, hkTaskId: string): Promise<HkTaskStatus | null>;
}

/**
 * BR-506 v0.3.8 (DOM-S4-09, oracle BR-506-03): task types that are a "full clean" FOR THE GUEST STAYING. Not
 * counted: `checkout_clean`, `priority_clean` (preparing the room at check-in – BR-402 (1)), `after_repair_clean`,
 * kits, minibar; a `guest_request` task counts only through `fullCleanRequestIds`. Owned by housekeeping (it owns
 * the task types – ARC S4-09); guest-portal reads it from here.
 */
export const FULL_CLEAN_TASK_TYPES: readonly string[] = [
  'stayover_clean',
  'long_stay_clean',
  'adhoc_clean',
];

export interface GuestRequestStatusPort {
  /**
   * 16.19 bổ sung 3 (ARC FB-R2-ARC-BE-S4-02/-08): lock the folio (L3) the BR-506 fee of the request would be
   * posted to – called by housekeeping BEFORE it locks the linked task (L4) on the way to `done`. No fee (or no
   * folio) → nothing. Optional until guest-portal implements it (the order is then the old one).
   */
  lockForFee?(tx: Tx, guestRequestId: string): Promise<void>;
  /** Linked task/work order started → request `in_progress` (+ `acknowledgedAt` when still `new`). */
  onLinkedWorkStarted(tx: Tx, guestRequestId: string, now: Date): Promise<void>;
  /** Linked task done / work order done → request `done` (+ BR-506 fee through BE-B, BE-D's side). */
  onLinkedWorkDone(tx: Tx, guestRequestId: string, now: Date): Promise<void>;
  /** Linked task / work order cancelled → no status change; the desk handles the request. */
  onLinkedWorkCancelled(tx: Tx, guestRequestId: string, now: Date): Promise<void>;
}
