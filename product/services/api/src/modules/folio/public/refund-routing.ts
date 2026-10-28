/**
 * BR-433 (e) / ADD3-01: ONE routing for every refund request (A32 makers never approve; owner when due) – the
 * folio module provides it to ApprovalService. One wiring for the api (FolioModule.onModuleInit) and the worker
 * (worker-jobs.ts – J15 `folio.close` submits the replacement refund request, BUG-R3-012/013, BUG-R3-037).
 */
import type { ApprovalService } from '../../approvals/public/approval.service';
import type { FolioService } from './folio.service';

export function provideFolioRefundRouting(approvals: ApprovalService, folios: FolioService): void {
  approvals.provideRefundRouting(
    (tx, input) => folios.refundRouting(tx, input),
    (tx, row, userId) =>
      folios.isA32Maker(tx, row.target_type ?? null, row.target_id ?? null, userId),
    (tx, row) => folios.refundAboveFreeCredit(tx, row),
  );
}
