/**
 * BR-433 (e) / ADD3-01: ONE routing for every refund request (A32 makers never approve; owner when due) – the
 * folio module provides it to ApprovalService. One wiring for the api (FolioModule.onModuleInit) and the worker
 * (worker-jobs.ts – J15 `folio.close` submits the replacement refund request, BUG-R3-012/013, BUG-R3-037).
 */
import type { Tx } from '../../../db/database';
import type { ApprovalService } from '../../approvals/public/approval.service';
import type { FolioService } from './folio.service';

/**
 * P4-12 (FB-R4-DOM-BA-025-02, ARC plan v1.0.4 6.3, SEC-on-plan-v1.0.4 1.2): a `superseded` replacement keeps the refund
 * destination of what it replaces. The payments module provides it (RefundsService, wired with the refund decision
 * hooks – api and worker). Two steps, both in the caller's transaction under its folio lock:
 * - `peek` BEFORE the replaced requests are closed (their `cancelled` hook destroys the account DEK – SEC-BE-45): the
 *   one destination they share (same booking, same method / bank / account / holder, same person who entered it), else
 *   null. The account stays inside the payments module (closure) – never returned, logged or put in an error;
 * - `apply` AFTER the replacement is made: sealed again under a new DEK bound to the NEW request id. Any decrypt /
 *   encrypt failure throws: the whole transaction is rolled back.
 */
export interface RefundDestinationCarry {
  apply(tx: Tx, toApprovalId: string, requestId?: string): Promise<void>;
}

export interface RefundDestinationCarrier {
  peek(
    tx: Tx,
    fromApprovalIds: readonly string[],
    targetReservationId: string,
  ): Promise<RefundDestinationCarry | null>;
}

export function provideFolioRefundRouting(approvals: ApprovalService, folios: FolioService): void {
  approvals.provideRefundRouting(
    (tx, input) => folios.refundRouting(tx, input),
    (tx, row, userId) =>
      folios.isA32Maker(tx, row.target_type ?? null, row.target_id ?? null, userId),
    (tx, row) => folios.refundAboveFreeCredit(tx, row),
  );
}
