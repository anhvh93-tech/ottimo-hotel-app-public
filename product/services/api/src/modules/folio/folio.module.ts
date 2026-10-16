/**
 * folio module (architecture 5.1; erd 4.6, SM-13) – BE-B Sprint 2: folio per booking, room/extra-person lines
 * from the price snapshot, commission + channel fee allocation on stay_night (erd 8), FOC/discount lines tied
 * to approvals (SM-10 hooks, BR-434), getFolio. Global: reservations (BE-A) and payments call FolioService.
 */
import { Global, Inject, Module, type OnModuleInit } from '@nestjs/common';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ApprovalService } from '../approvals/public/approval.service';
import { FolioController } from './internal/folio.controller';
import { FolioFocService } from './internal/foc.service';
import { FolioService } from './public/folio.service';

// Audit allowlists (SR-AUD-03) for money events written by this module (category money).
defineAuditEntity('folio', [
  'roomVnd',
  'extraPersonVnd',
  'nights',
  'commissionVnd',
  'depositPaidVnd',
  'depositRequiredVnd',
  'status',
]);
defineAuditEntity('folio_line', ['category', 'amountVnd', 'lineState', 'relatedCategory']);
defineAuditEntity('commission', [
  'status',
  'payeeType',
  'ratePct',
  'baseVnd',
  'amountVnd',
  'voidReason',
]);

@Global()
@Module({
  imports: [ApprovalsModule],
  controllers: [FolioController],
  providers: [FolioService, FolioFocService],
  exports: [FolioService],
})
export class FolioModule implements OnModuleInit {
  constructor(
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(FolioFocService) private readonly foc: FolioFocService,
  ) {}

  onModuleInit(): void {
    for (const type of ['foc', 'special_discount'] as const) {
      this.approvals.onDecided(type, (tx, row) => this.foc.onDecided(tx, row));
    }
  }
}
