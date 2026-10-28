/**
 * The `refund` decision hooks on ApprovalService – ONE wiring used by the api (PaymentsModule.onModuleInit) and by
 * the worker (public/worker-hooks.ts – J15 `folio.close` cancels refund requests above the credit left, BUG-R3-012
 * / BUG-R3-037), so a refund cancelled by the job purges its account (SEC-BE-45) like one cancelled in the api.
 */
import type { ApprovalService } from '../../approvals/public/approval.service';
import type { RefundsService } from './refunds.service';

export function wireRefundDecisionHooks(approvals: ApprovalService, refunds: RefundsService): void {
  approvals.onDecided('refund', (tx, row) => refunds.onDecided(tx, row));
  // ARC 16.19 bổ sung 4 (BUG-R2-198): a refund decision reads the folio's surplus – L3 folio before L4.
  approvals.onBeforeDecide('refund', (tx, approvalId) => refunds.lockFolioOf(tx, approvalId));
}
