/**
 * sales module (architecture 5.1; EP11 R2 – BE-B Sprint 2): short-stay quotes (SM-08), holds from quotes
 * (B1 via the reservations port), leads (SM-09 minimal), commission list (US-087 AC2).
 * Global: LeadsService is called by payments (B4 → won) and reservations (B5/B6 → quoted).
 */
import { Global, Inject, Module, type OnModuleInit } from '@nestjs/common';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ApprovalService } from '../approvals/public/approval.service';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { CommissionsService } from './internal/commissions.service';
import { QuotePricingService } from './internal/quote-pricing';
import { QuotesController } from './internal/quotes.controller';
import { QuotesService } from './internal/quotes.service';
import { LeadsService } from './public/leads.service';

defineAuditEntity('quote', [
  'status',
  'totalVnd',
  'depositVnd',
  'nights',
  'reservationCode',
  'expiresAt',
]);
defineAuditEntity('lead', ['status', 'source', 'lostReasonCode']);

@Global()
@Module({
  imports: [ApprovalsModule],
  controllers: [QuotesController],
  providers: [QuotePricingService, QuotesService, LeadsService, CommissionsService],
  exports: [LeadsService],
})
export class SalesModule implements OnModuleInit {
  constructor(
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(QuotesService) private readonly quotes: QuotesService,
  ) {}

  /** Q4 when a `quote_extension` request is approved (A51 = D, OpenAPI 0.3.5 A-18). */
  onModuleInit(): void {
    this.approvals.onDecided('quote_extension', (tx, row) =>
      this.quotes.onExtensionDecided(tx, row),
    );
    // BUG-R2-198 (ARC 16.19 bổ sung 4): the quote before the request row, on every decision path.
    this.approvals.onBeforeDecide('quote_extension', (tx, approvalId) =>
      this.quotes.lockForExtensionDecision(tx, approvalId),
    );
  }
}
