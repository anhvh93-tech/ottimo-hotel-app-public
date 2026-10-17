/**
 * MINIBAR_REFILL_DONE_PORT (ARC `openapi-0.3.7.md` 16.16, DOM BR-703-02 note 2 – 18/10): a `minibar_refill` task
 * went `done`. Same pattern as GUEST_REQUEST_STATUS_PORT: the interface lives here (housekeeping calls it), the
 * inventory module (BE-B) implements and binds it; HousekeepingService takes it `@Optional()` and calls it in
 * setTaskStatus, in the SAME transaction. Housekeeping never imports inventory (no provider cycle).
 */
import type { Tx } from '../../../db/database';

export const MINIBAR_REFILL_DONE_PORT = Symbol('MINIBAR_REFILL_DONE_PORT');

export interface MinibarRefillDonePort {
  /**
   * A `minibar_refill` task went `done` (setTaskStatus, same transaction). Inventory decides (BR-703-02 note 2):
   * the task's stay (primary booking) is `in_house` AND its current room = `roomId` → write a `refill` fill now
   * (mark = left after the latest count of the current period + `refillItems`, price = catalogue now; items at 0
   * dropped); otherwise (stay gone, manual task without reservation/items) → no-op. Never throws for a no-op.
   * `now` = when it is processed (catalogue price, order of the periods); `performedAt` = when HK did it (offline
   * queue) – kept as `minibar_fill.filled_at`.
   */
  onRefillDone(
    tx: Tx,
    task: {
      id: string;
      reservationId: string | null;
      roomId: string;
      refillItems: ReadonlyArray<{ itemId: string; qty: number }> | null;
    },
    at: { now: Date; performedAt: Date },
  ): Promise<void>;
}
