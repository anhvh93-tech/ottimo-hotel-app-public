/**
 * reservations module (architecture 5.1; EP02 + EP11 R2 + US-139; SM-01, SM-02; ADR-009) – BE-A Sprint 2.
 * Global exports for the other modules: OccupancyService (the only inventory writer), PricingService (one
 * price engine for bookings and quotes), ReservationHooks (same-transaction extension points),
 * RESERVATION_SALES_PORT (quotes/folio/payments – BE-B), ROOM_CAPACITY_CHECK (ReservationCapacityCheck – US-004/BR-110, QC-S2-01).
 * Jobs: J1 hold expiry + O2 block activation (jobs/reservation-jobs.ts). Approval hook: an approved
 * `no_show_restore` request (SM-10) performs B12 in the approver's transaction.
 */
import { Global, Inject, Module, type OnModuleInit } from '@nestjs/common';
import { JobRegistry } from '../../jobs/job-runner';
import { holdExpiryJob, leaseNightsJob, roomBlockActivationJob } from '../../jobs/reservation-jobs';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { ApprovalService } from '../approvals/public/approval.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ParameterService } from '../platform/public/parameter.service';
import { ROOM_CAPACITY_CHECK } from '../platform/public/room-capacity';
import { MoneyBridge } from './internal/money-bridge';
import { RackService } from './internal/rack.service';
import { ReservationsController } from './internal/reservations.controller';
import { ReservationsService, SYSTEM_ACTOR } from './internal/reservations.service';
import { RoomBlocksService } from './internal/room-blocks.service';
import { RoomBlockPort } from './public/room-block.port';
import { ReservationSalesAdapter } from './internal/sales-port.adapter';
import { OccupancyService } from './public/occupancy.service';
import { PricingService } from './public/pricing.service';
import { ReservationHooks } from './public/reservation-hooks';
import { ReservationCapacityCheck } from './public/room-capacity-check';
import { RESERVATION_SALES_PORT } from './public/sales-port';
import { StayNightAllocationService } from './public/stay-night-allocation';
import { StayNightPricingPort } from './public/stay-night-pricing';
import { ReservationStayPort } from './public/stay-port';
import { ReservationReadPort } from './public/read-port';

// Audit allowlists (SR-AUD-03): booking state/money facts only – no guest C2/C3 values.
defineAuditEntity('reservation', [
  'status',
  'roomNo',
  'arrivalDate',
  'departureDate',
  'channelCode',
  'conflictState',
  'externalContract',
  'totalRoomVnd',
  'depositRequiredVnd',
  'extraPersonFeeVnd',
  'nightlyRates',
  'rateSource',
  'monthlyRentVnd',
  'adults',
  'children6to11',
  'childrenUnder6',
  'reasonCode',
  'depositPaidVnd',
  'retainedVnd',
  'refundableVnd',
  'otaPenaltyVnd',
  'costVnd',
  // 0.3.7 bổ sung 4 (BR-416-06): `reservation.late_fee_instead_of_night` – the charge and both people.
  'amountVnd',
  'checkoutTime',
  'date',
  'confirmedBy',
  'channel',
  'authMethod',
  'approverRole',
  'focVnd',
]);
defineAuditEntity('room_block', ['status', 'startDate', 'endDatePlanned']);

@Global()
@Module({
  imports: [ApprovalsModule],
  controllers: [ReservationsController],
  providers: [
    OccupancyService,
    PricingService,
    ReservationHooks,
    MoneyBridge,
    ReservationsService,
    RackService,
    RoomBlocksService,
    ReservationSalesAdapter,
    StayNightAllocationService,
    { provide: RESERVATION_SALES_PORT, useExisting: ReservationSalesAdapter },
    ReservationCapacityCheck,
    { provide: ROOM_CAPACITY_CHECK, useExisting: ReservationCapacityCheck },
    // Sprint 3 (BE-A): what the front desk module uses (B9…B18, US-022).
    ReservationStayPort,
    // Review S3 (ARC-BE-S3-16): DB-only reads for modules that must not depend on ReservationsService.
    ReservationReadPort,
    // 0.3.7 D1 (S4-35 part A): the folio's adjustFolioLine re-prices a stay night through this port only.
    StayNightPricingPort,
    // 0.3.7 nhóm H (BE-C): OOO blocks of a work order (O1 with createWorkOrder, O4/O5 when it closes).
    RoomBlockPort,
  ],
  exports: [
    ReservationStayPort,
    ReservationReadPort,
    OccupancyService,
    PricingService,
    ReservationHooks,
    MoneyBridge,
    RESERVATION_SALES_PORT,
    StayNightAllocationService,
    StayNightPricingPort,
    ROOM_CAPACITY_CHECK,
    RoomBlockPort,
  ],
})
export class ReservationsModule implements OnModuleInit {
  constructor(
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
    @Inject(ReservationsService) private readonly reservations: ReservationsService,
    @Inject(RoomBlocksService) private readonly blocks: RoomBlocksService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(ParameterService) private readonly params: ParameterService,
  ) {}

  onModuleInit(): void {
    for (const job of [
      holdExpiryJob(this.reservations, this.params),
      roomBlockActivationJob(this.blocks, this.params),
      leaseNightsJob(this.reservations, this.params),
    ]) {
      if (!this.jobs.get(job.key)) this.jobs.register(job);
    }
    // SM-10 → B12: the manager approved a restore outside the BR-315 conditions (US-136 AC5).
    this.approvals.onDecided('no_show_restore', async (tx, request) => {
      if (request.status !== 'approved' || !request.target_id) return;
      const approver = request.approver_id ?? SYSTEM_ACTOR.userId;
      const ctx = await this.reservations.context(tx, { userId: approver, roles: ['manager'] });
      await this.reservations.restoreNoShow(
        tx,
        ctx,
        request.target_id,
        null,
        { reason: request.reason_note ?? 'approved' },
        { approved: true },
      );
    });
  }
}
