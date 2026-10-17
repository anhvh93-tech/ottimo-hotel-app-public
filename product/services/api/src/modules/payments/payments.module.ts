/**
 * payments module (architecture 5.1; SM-12) – BE-B.
 * Sprint 2: deposit confirmation of a hold (B4) and the "đã chuyển cọc" notice of SAL/CTV (A53).
 * Sprint 3 (OpenAPI 0.3.6): receipts (PaymentPort.recordInTx for BE-A), VietQR, listing/reconciliation, cash
 * handover of SAL/CTV (A46a), reversal, refunds (request, destination C3, cash A47a / transfer A47 pay-outs).
 *
 * Ports of BE-C (ARC s3-contract 4.3), bound globally by BE-C's modules: ATTACHMENT_USAGE (FilesModule →
 * AttachmentService), REFUND_ACCOUNT_CIPHER (CryptoModule → CryptoService); C3AccessGate (step-up window,
 * c3_access_log before data) for getRefundDestination.
 */
import { Global, Inject, Module, type OnModuleInit, Optional } from '@nestjs/common';
import { FolioService } from '../folio/public/folio.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ApprovalService } from '../approvals/public/approval.service';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { EventsService } from '../events/public/events.service';
import { ReservationHooks } from '../reservations/public/reservation-hooks';
import { DepositsController } from './internal/deposits.controller';
import { DepositsService } from './internal/deposits.service';
import { PaymentsController } from './internal/payments.controller';
import { PaymentsService } from './internal/payments.service';
import { RefundsController } from './internal/refunds.controller';
import { RefundsService } from './internal/refunds.service';
import { type DepositNoticesReader, readDepositNotices } from './public/deposit-notices';
import { PaymentService } from './public/payment.service';
import { reconcileOverdueSource } from './public/reconcile-attention';

defineAuditEntity('payment', [
  // 0.3.7 bổ sung 4 (DOM (f)): a VietQR confirmed above what was due for its purpose.
  'overVnd',
  'code',
  'type',
  'method',
  'amountVnd',
  'status',
  'reconciliation',
  'recordedByRole',
  'selfReconciled',
  'receivedAmountVnd',
  // PO 17/10 (SEC-37): an OWN approved and paid the same transfer refund ("OWN tự duyệt và chi").
  'ownSelfApprovedAndPaid',
]);
defineAuditEntity('deposit_notice', ['amountVnd', 'status']);
// Refund destination events (no C3: method and the last 4 digits only – D15 masked).
defineAuditEntity('approval_request', ['refundMethod', 'accountNoLast4']);

@Global()
@Module({
  imports: [ApprovalsModule],
  controllers: [DepositsController, PaymentsController, RefundsController],
  providers: [PaymentService, DepositsService, PaymentsService, RefundsService],
  exports: [PaymentService],
})
export class PaymentsModule implements OnModuleInit {
  constructor(
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(RefundsService) private readonly refunds: RefundsService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
    @Optional() @Inject(ReservationHooks) private readonly hooks?: ReservationHooks,
    @Optional() @Inject(FolioService) private readonly folios?: FolioService,
    @Optional() @Inject(PaymentsService) private readonly paymentsSvc?: PaymentsService,
  ) {}

  onModuleInit(): void {
    this.approvals.onDecided('refund', (tx, row) => this.refunds.onDecided(tx, row));
    // FB-R2-ARC-BE-S3-15 b: "Cần chú ý" reconcile_overdue is computed by this module.
    this.events?.registerAttentionSource(reconcileOverdueSource);
    // 0.3.7 bổ sung 1 (ARC 11.3 (2)): Reservation.depositNotices[] – reservations reads this module's table through
    // the port BE-A adds to ReservationHooks (provideDepositNotices, like provideRegistrationSummary).
    const port = this.hooks as
      | (ReservationHooks & { provideDepositNotices?: (reader: DepositNoticesReader) => void })
      | undefined;
    port?.provideDepositNotices?.(readDepositNotices);
    // 0.3.7 bổ sung 4 (DOM (f)): getFolio.payments[].amountDueNowVnd – the cap of the QR's purpose, now.
    const svc = this.paymentsSvc;
    if (svc) this.folios?.provideQrDueNow((tx, actor, p) => svc.amountDueNow(tx, actor, p));
  }
}
