/**
 * folio module (architecture 5.1; erd 4.6, SM-13) – BE-B Sprint 2: folio per booking, room/extra-person lines
 * from the price snapshot, commission + channel fee allocation on stay_night (erd 8), FOC/discount lines tied
 * to approvals (SM-10 hooks, BR-434), getFolio. Global: reservations (BE-A) and payments call FolioService.
 */
import {
  Global,
  Inject,
  Logger,
  Module,
  type OnApplicationBootstrap,
  type OnModuleInit,
} from '@nestjs/common';
import { CLOCK, type Clock } from '../../clock';
import { DATABASE, Database } from '../../db/database';
import { JobRegistry } from '../../jobs/job-runner';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ApprovalService } from '../approvals/public/approval.service';
import { FOLIO_STAY_SYNC } from '../reservations/public/folio-sync-port';
import { ReservationHooks } from '../reservations/public/reservation-hooks';
import { FolioController } from './internal/folio.controller';
import { BillService } from './internal/bill.service';
import { FolioFocService } from './internal/foc.service';
import { FolioLinesService } from './internal/folio-lines.service';
import { folioCloseJob } from './public/folio-close-job';
import { FolioService } from './public/folio.service';
import { resyncMinibarFocOnce } from './public/minibar-foc-resync';

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
  // FB-R2-SEC-BE-80 (approval.applied_capped): a debt write-off applied up to the open debt.
  'appliedVnd',
  'openDebtVnd',
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
export class FolioModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger('FolioModule');

  constructor(
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(FolioFocService) private readonly foc: FolioFocService,
    @Inject(FolioLinesService) private readonly lineService: FolioLinesService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
  ) {}

  /**
   * BUG-R2-147 (lối ra (a)): the one-time FOC re-sync of the open folios after 0065, once per property (job_run
   * flag), at start-up – never in tests (they call resyncMinibarFocOnce themselves) and never blocking the start.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'test' && process.env.RUN_DATA_FIXES !== '1') return;
    try {
      const props = await this.db.entry(async (tx) => {
        const { rows } = await tx.query<{ property_id: string; organization_id: string }>(
          'SELECT property_id, organization_id FROM worker_list_properties()',
        );
        return rows;
      });
      for (const p of props) {
        const n = await this.db.withContext(
          {
            organizationId: p.organization_id,
            propertyId: p.property_id,
            userId: null,
            actorType: 'system',
          },
          (tx) => resyncMinibarFocOnce(tx, this.folios, this.clock.now()),
        );
        if (n !== null)
          this.logger.log(`data_fix.minibar_foc_0065 property=${p.property_id} folios=${n}`);
      }
    } catch (err) {
      this.logger.error(
        `data_fix.minibar_foc_0065 failed: ${err instanceof Error ? err.name : 'error'}`,
      );
    }
  }

  onModuleInit(): void {
    for (const type of ['foc', 'special_discount'] as const) {
      this.approvals.onDecided(type, (tx, row) => this.foc.onDecided(tx, row));
    }
    // S4-13: a decision on a foc / special_discount locks the bookings of the folio, then the folio, BEFORE the
    // request row – the same order as a night re-sync / cancellation (reservation → folio → approval_request), so
    // neither deadlocks and the later one reads what the earlier one wrote (BR-434). ARC 16.19 (K11-01 review):
    // `damage_pricing` too – an approved damage line becomes a posted charge; without the folio lock it could slip
    // in after B18 read the balance under its folio lock.
    this.approvals.onBeforeDecide(
      ['foc', 'special_discount', 'damage_pricing'],
      async (tx, approvalId) => {
        const { rows } = await tx.query<{ folio_id: string }>(
          `SELECT l.folio_id FROM approval_request a JOIN folio_line l ON l.id = a.folio_line_id
          WHERE a.id = $1 AND a.type IN ('foc', 'special_discount', 'damage_pricing')`,
          [approvalId],
        );
        if (rows[0]) await this.folios.lockStay(tx, rows[0].folio_id);
      },
    );
    // 0.3.7 D1: ApprovalRequest.effectiveAmountVnd + current FOC line (same plan as the write).
    this.approvals.provideFocView((tx, rows) => this.folios.focViews(tx, rows));
    // US-032 AC4 / BR-512: damage outside the table, priced by MGR+.
    this.approvals.onDecided('damage_pricing', (tx, row) =>
      this.lineService.onDamageDecided(tx, row),
    );
    // J15 `folio.close` (ARC 16.27 (1)): window over → what is owed becomes one debt, the folio is closed.
    const j15 = folioCloseJob(this.db, this.folios, this.hooks);
    if (!this.jobs.get(j15.key)) this.jobs.register(j15);
  }
}
