/**
 * GuestRequestStatusPort (guest-portal provides under GUEST_REQUEST_STATUS_PORT – BE-C's contract in
 * housekeeping/public/guest-request-work.port.ts, from s4-be-d.md 2.3):
 * BE-C calls it in ITS transaction when the hk_task / work_order linked to a guest request changes state
 * (SM-15 W2/W4): started → `in_progress` (acknowledged at the same time when still `new`); done → `done`
 * (+ the accepted BR-506 fee posted once to the folio – also when the desk closed the request first, ARC S4-07);
 * cancelled → no change (the desk answers the guest). `lockForFee` (16.19 bổ sung 3): housekeeping calls it BEFORE
 * it locks a task on the way to `done`, so the folio (L3) is taken before the task (L4) and the request (L4b).
 * Unknown id → 404 NOT_FOUND (programming error on the caller's side); `lockForFee` ignores it.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { GuestRequestLifecycle } from '../internal/guest-request-lifecycle';
import type { GuestRequestStatusContract } from './guest-request-ports';

@Injectable()
export class GuestRequestStatusPort implements GuestRequestStatusContract {
  constructor(@Inject(GuestRequestLifecycle) private readonly requests: GuestRequestLifecycle) {}

  lockForFee(tx: Tx, guestRequestId: string): Promise<void> {
    return this.requests.lockForFee(tx, guestRequestId);
  }

  onLinkedWorkStarted(tx: Tx, guestRequestId: string, now: Date): Promise<void> {
    return this.requests.linkedStarted(tx, guestRequestId, now);
  }

  onLinkedWorkDone(tx: Tx, guestRequestId: string, now: Date): Promise<void> {
    return this.requests.linkedDone(tx, guestRequestId, now);
  }

  /** No state change, so the time BE-C passes is not needed. */
  onLinkedWorkCancelled(tx: Tx, guestRequestId: string): Promise<void> {
    return this.requests.linkedCancelled(tx, guestRequestId);
  }
}
