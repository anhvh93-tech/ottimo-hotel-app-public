/**
 * BUG-R3-037 (BE-B): the payments module's `refund` decision hooks for a worker composition (no Nest container).
 * J15 `folio.close` (folio/public/worker-jobs.ts) re-plans refund requests above the credit left (BUG-R3-012/013 –
 * ApprovalService.autoCancel / cancelApproved / submit): the decision hooks must be those of the api – the refund
 * account of a cancelled request is purged (SEC-BE-45) and the folio is locked first (preLock, ARC 16.19). Same
 * wiring function as PaymentsModule (internal/refund-decision-hooks.ts), same classes, caller's shared instances.
 */
import type { Clock } from '../../../clock';
import type { Database } from '../../../db/database';
import type { ApprovalService } from '../../approvals/public/approval.service';
import type { AuditService } from '../../audit/public/audit.service';
import { C3AccessGate } from '../../crypto/public/c3-access-gate';
import type { CryptoService } from '../../crypto/public/crypto.service';
import { RefundAccountCipherAdapter } from '../../crypto/public/port-adapters';
import type { EventsService } from '../../events/public/events.service';
import type { AttachmentService } from '../../files/public/attachment.service';
import type { FolioService } from '../../folio/public/folio.service';
import type { DocNumberService } from '../../platform/public/doc-number.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import { wireRefundDecisionHooks } from '../internal/refund-decision-hooks';
import { RefundsService } from '../internal/refunds.service';
import type { PaymentService } from './payment.service';

export function paymentsWorkerHooks(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  database: Database;
  events: EventsService;
  approvals: ApprovalService;
  folios: FolioService;
  payments: PaymentService;
  docNumbers: DocNumberService;
  attachments: AttachmentService;
  crypto: CryptoService;
}): void {
  const refunds = new RefundsService(
    deps.clock,
    deps.audit,
    deps.approvals,
    deps.folios,
    deps.payments,
    deps.docNumbers,
    deps.attachments,
    new RefundAccountCipherAdapter(deps.crypto),
    new C3AccessGate(deps.database, deps.clock, deps.parameters, deps.audit),
    deps.events,
  );
  wireRefundDecisionHooks(deps.approvals, refunds);
}
