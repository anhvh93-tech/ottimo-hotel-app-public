/**
 * Ports between guest requests (guest-portal, BE-D – US-109/US-110, BR-811, SM-15) and the housekeeping /
 * maintenance zone (BE-C). The CONTRACT lives with BE-C (`housekeeping/public/guest-request-work.port.ts` –
 * BE-D proposal s4-be-d.md 2.3 as accepted by BE-C): this file re-exports it and adds what guest-portal needs.
 *
 * - GUEST_REQUEST_WORK_PORT – BE-C binds its implementation; guest-portal calls it in the SAME transaction as
 *   createGuestRequest (task for `extra_cleaning`/`amenities`, work order for `report_issue`) and
 *   transitionGuestRequest `decline` (open task cancelled). Optional: until it is bound, the default below
 *   creates nothing and the request is handled from the request list (HK/MT see it – routed_to_me).
 * - GUEST_REQUEST_STATUS_PORT – guest-portal binds GuestRequestStatusPort (guest-request-status.port.ts); BE-C
 *   calls it when the linked task / work order starts, is done or is cancelled, and (`lockForFee`, 16.19
 *   bổ sung 3) before it locks a task whose request carries a BR-506 fee.
 * - BR-506 "lần dọn đầy đủ" (ARC FB-R2-ARC-BE-S4-09): the fee decision reads housekeeping through
 *   `lastFullCleanAt` of the work port – guest-portal never reads `hk_task` (test/guest-portal-boundaries.test.ts).
 */
import type { Tx } from '../../../db/database';
import type {
  GuestRequestWorkPort,
  HkTaskStatus,
} from '../../housekeeping/public/guest-request-work.port';

export {
  GUEST_REQUEST_STATUS_PORT,
  GUEST_REQUEST_WORK_PORT,
} from '../../housekeeping/public/guest-request-work.port';
export type {
  GuestRequestStatusPort as GuestRequestStatusContract,
  GuestRequestWorkPort,
} from '../../housekeeping/public/guest-request-work.port';

export type GuestRequestTaskInput = Parameters<GuestRequestWorkPort['createTask']>[1];
export type GuestRequestWorkOrderInput = Parameters<GuestRequestWorkPort['createWorkOrder']>[1];
export type LastFullCleanInput = Parameters<GuestRequestWorkPort['lastFullCleanAt']>[1];

/** What guest-portal calls: BE-C's port, or the unwired default (nothing created → null). */
export interface GuestRequestWork {
  createTask(tx: Tx, input: GuestRequestTaskInput): Promise<{ hkTaskId: string } | null>;
  createWorkOrder(
    tx: Tx,
    input: GuestRequestWorkOrderInput,
  ): Promise<{ workOrderId: string; code: string } | null>;
  cancelTask(tx: Tx, hkTaskId: string, now: Date): Promise<void>;
  lastFullCleanAt(tx: Tx, input: LastFullCleanInput): Promise<Date | null>;
  /** Optional (ARC 16.24 (s4) – see the port): the linked task's status, read after `cancelTask`. */
  taskStatus?(tx: Tx, hkTaskId: string): Promise<HkTaskStatus | null>;
}

/** Default until BE-C binds GUEST_REQUEST_WORK_PORT (ORC 17/10: stub while waiting). */
export class UnwiredGuestRequestWorkPort implements GuestRequestWork {
  async createTask(): Promise<null> {
    return null;
  }
  async createWorkOrder(): Promise<null> {
    return null;
  }
  async cancelTask(): Promise<void> {
    return undefined;
  }
  /** No housekeeping bound → no clean known → no "second clean" fee (never charges on a guess). */
  async lastFullCleanAt(): Promise<null> {
    return null;
  }
}
