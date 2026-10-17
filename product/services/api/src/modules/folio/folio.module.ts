/**
 * folio module (architecture 5.1; erd 4.6, SM-13) – BE-B Sprint 2: folio per booking, room/extra-person lines
 * from the price snapshot, commission + channel fee allocation on stay_night (erd 8), FOC/discount lines tied
 * to approvals (SM-10 hooks, BR-434), getFolio. Global: reservations (BE-A) and payments call FolioService.
 */
import { Global, Inject, Module, type OnModuleInit } from '@nestjs/common';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ApprovalService } from '../approvals/public/approval.service';
import { FOLIO_STAY_SYNC } from '../reservations/public/folio-sync-port';
import { ReservationHooks } from '../reservations/public/reservation-hooks';
import { FolioController } from './internal/folio.controller';
import { BillService } from './internal/bill.service';
import { FolioFocService } from './internal/foc.service';
import { FolioLinesService } from './internal/folio-lines.service';
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
  'reversedVnd',
  'feeVnd',
  'billNo',
  'totalVnd',
  'balanceDueVnd',
  // 0.3.6 bổ sung 2: night sync logged as folio.line_posted / line_reversed – `confirmed` | `resynced`.
  'sync',
  // 0.3.7 D1 S4-08: services reversed / kept by a cancellation or no-show.
  'serviceReversedVnd',
  'serviceRetainedVnd',
]);
defineAuditEntity('channel_fee', [
  'channelCode',
  'baseVnd',
  'ratePct',
  'amountEstimatedVnd',
  'amountActualVnd',
  'source',
]);
defineAuditEntity('folio_line', [
  'category',
  'amountVnd',
  'lineState',
  'relatedCategory',
  'reversedVnd',
]);
defineAuditEntity('invoice_request', ['buyerType', 'einvoiceStatus']);
// 0.3.7 D1 (S4-02/S4-18/S4-22): folio.foc_dormant / foc_restored / foc_suspended / foc_cancelled on the request.
defineAuditEntity('approval_request', [
  'approvalRequestId',
  'focState',
  'focCancelReason',
  'effectiveAmountVnd',
  'serviceDate',
  'reason',
  'from',
]);
// 0.3.6 B-29 (payments.confirmDeposit): short deposit accepted by MGR+.
defineAuditEntity('reservation', ['shortfallVnd', 'depositRequiredVnd', 'depositPaidVnd']);
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
  // StayNightAllocationService (reservations/public, owner of stay_night) is provided by the global
  // ReservationsModule (ARC S2-07 – moved by BE-A in the Sprint 2 fix round).
  providers: [
    FolioService,
    FolioFocService,
    FolioLinesService,
    BillService,
    // reservations/public/folio-sync-port.ts (BE-A): reversal + resync after posted nights change.
    { provide: FOLIO_STAY_SYNC, useExisting: FolioService },
  ],
  exports: [FolioService, FOLIO_STAY_SYNC],
})
export class FolioModule implements OnModuleInit {
  constructor(
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(FolioFocService) private readonly foc: FolioFocService,
    @Inject(FolioLinesService) private readonly lineService: FolioLinesService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
  ) {}

  onModuleInit(): void {
    for (const type of ['foc', 'special_discount'] as const) {
      this.approvals.onDecided(type, (tx, row) => this.foc.onDecided(tx, row));
    }
    // S4-13: a decision on a foc / special_discount locks the bookings of the folio, then the folio, BEFORE the
    // request row – the same order as a night re-sync / cancellation (reservation → folio → approval_request), so
    // neither deadlocks and the later one reads what the earlier one wrote (BR-434).
    this.approvals.onBeforeDecide(async (tx, approvalId) => {
      const { rows } = await tx.query<{ folio_id: string }>(
        `SELECT l.folio_id FROM approval_request a JOIN folio_line l ON l.id = a.folio_line_id
          WHERE a.id = $1 AND a.type IN ('foc', 'special_discount')`,
        [approvalId],
      );
      if (rows[0]) await this.folios.lockStay(tx, rows[0].folio_id);
    });
    // 0.3.7 D1: ApprovalRequest.effectiveAmountVnd + current FOC line (same plan as the write).
    this.approvals.provideFocView((tx, rows) => this.folios.focViews(tx, rows));
    // US-032 AC4 / BR-512: damage outside the table, priced by MGR+.
    this.approvals.onDecided('damage_pricing', (tx, row) =>
      this.lineService.onDamageDecided(tx, row),
    );
  }
}
