/**
 * frontdesk module (BE-A Sprint 3, ARC s3-contract 4.1): check-in B9/B9a/B17, stay B13/B14/B15/B16 + departure
 * reminders, check-out B18, party US-022 (EP03-05). RoomStatusService (SM-03 store) is the housekeeping
 * module's since 0.3.7 B-14 – injected from there (one instance).
 *
 * Ports of other zones (public/ports.ts) are resolved here: an owner binds its implementation as a GLOBAL
 * provider under the token (e.g. BE-C `{ provide: FD_REGISTRATION_PORT, useExisting: RegistrationPortImpl }`);
 * until then the fail-closed defaults apply. Same-transaction hooks:
 * - ReservationHooks 'transitioned' → cancelled / no_show (B5, B6, B10, B11, relocation): guest links and
 *   sessions revoked (B-13, SEC G4); the registration module voids its record in its own hook (K11);
 * - approvals 'late_checkout_conflict' → the requested time becomes the agreed check-out time.
 * Job J24 `payment.expire` is registered here (api / test-support) and in worker.ts.
 */
import { Inject, Module, type OnModuleInit, Optional } from '@nestjs/common';
import { JobRegistry } from '../../jobs/job-runner';
import { problem } from '../../shared/problem';
import { paymentExpiryJob } from '../../jobs/payment-jobs';
import { AuditService } from '../audit/public/audit.service';
import { ApprovalService } from '../approvals/public/approval.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { EventsService } from '../events/public/events.service';
import { ReservationHooks } from '../reservations/public/reservation-hooks';
import { FRONTDESK_ATTENTION_SOURCES, checkoutDebtSource } from './internal/attention-sources';
import { CheckinService } from './internal/checkin.service';
import { CheckoutService } from './internal/checkout.service';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
  UnwiredRegistrationPort,
} from './internal/default-ports';
import { DocumentPartyPort } from './internal/document-party.port';
import { FrontdeskController } from './internal/frontdesk.controller';
import { PartyService } from './internal/party.service';
import { StayService } from './internal/stay.service';
import { FrontdeskPorts, StaySupport } from './internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  FD_GUEST_ACCESS_PORT,
  FD_MINIBAR_PORT,
  FD_REGISTRATION_PORT,
  type FrontdeskChildDataPort,
  type FrontdeskGuestAccessPort,
  type FrontdeskMinibarPort,
  type FrontdeskRegistrationPort,
} from './public/ports';
import { RegistrationPartyLink } from '../registration/public/party-port';

// Audit allowlist of the front desk facts (SR-AUD-03): no guest C2/C3, no door code (SEC D2).
defineAuditEntity('reservation', [
  'cardsIssued',
  'doorAccessHandedOver',
  'roomStatusBefore',
  'agreedCheckoutTime',
  'lateSurchargeVnd',
  'tierPct',
  'checkoutMode',
  'debtVnd',
  'debtOutcome',
  'balanceDueVnd',
  'dueDate',
  'replyType',
  'channel',
  'confirmedTime',
  'partyRole',
  'priceAgeBand',
]);

@Module({
  imports: [ApprovalsModule],
  controllers: [FrontdeskController],
  // RoomStatusService: one instance, provided and exported by the (global) housekeeping module – B-14.
  providers: [
    {
      provide: FrontdeskPorts,
      useFactory: (
        registration?: FrontdeskRegistrationPort,
        guestAccess?: FrontdeskGuestAccessPort,
        childData?: FrontdeskChildDataPort,
        minibar?: FrontdeskMinibarPort,
      ) =>
        new FrontdeskPorts(
          registration ?? new UnwiredRegistrationPort(),
          guestAccess ?? new NoGuestAccessPort(),
          childData ?? new UnwiredChildDataPort(),
          minibar ?? new NoMinibarPort(),
        ),
      inject: [
        { token: FD_REGISTRATION_PORT, optional: true },
        { token: FD_GUEST_ACCESS_PORT, optional: true },
        { token: FD_CHILD_DATA_PORT, optional: true },
        { token: FD_MINIBAR_PORT, optional: true },
      ],
    },
    StaySupport,
    CheckinService,
    StayService,
    CheckoutService,
    PartyService,
    // BUG-R2-033: the party member of a document entered without `partyMemberId` (BE-C consumer port).
    DocumentPartyPort,
  ],
  exports: [FrontdeskPorts],
})
export class FrontdeskModule implements OnModuleInit {
  constructor(
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(FrontdeskPorts) private readonly ports: FrontdeskPorts,
    @Inject(StayService) private readonly stays: StayService,
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(DocumentPartyPort) private readonly documentParty: DocumentPartyPort,
    @Inject(StaySupport) private readonly support: StaySupport,
    @Inject(CheckinService) private readonly checkin: CheckinService,
    @Inject(CheckoutService) private readonly checkout: CheckoutService,
    @Optional() @Inject(RegistrationPartyLink) private readonly partyLink?: RegistrationPartyLink,
  ) {}

  onModuleInit(): void {
    // SEC-BE-52 (3): the api never runs without the guest-link revocation (a cancelled booking would keep a
    // live guest link). Test containers may leave it unwired on purpose.
    if (this.ports.guestAccess instanceof NoGuestAccessPort && process.env.NODE_ENV !== 'test') {
      throw new Error('FD_GUEST_ACCESS_PORT is not bound (guest-portal module missing)');
    }
    // BUG-R2-033: registration asks the party which member a document belongs to (BE-C link, BR-951).
    this.partyLink?.provide(this.documentParty);
    // 0.3.7 D1 (S4-09): `updateReservation.roomReturnRecorded` – room statuses / cleaning / door access live here.
    this.hooks.provideRoomReturn((tx, input) => this.stays.recordRoomReturn(tx, input));
    // 0.3.7 (S4-10): the cap of a check-in / check-out VietQR = previewCheckIn / getCheckoutSummary amounts
    // (ReservationSalesPort.amountDueFor – payments, BE-B). FD+ only (SAL/CTV → 403, as the contract).
    this.hooks.provideAmountDue(async (tx, q, opts = {}) => {
      const desk = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
      if (!q.actor.roles.some((r) => desk.includes(r))) throw problem('FORBIDDEN_ACTION');
      const ctx = await this.support.stay.context(
        tx,
        { userId: q.actor.userId, roles: q.actor.roles },
        q.actor.requestId,
      );
      const checkIn = {
        checkinTime: q.checkinTime,
        addPriorNight: q.addPriorNight,
        priorNightRateVnd: q.priorNightRateVnd,
      };
      const checkOut = {
        checkoutAt: q.checkoutAt,
        extraNightRateVnd: q.extraNightRateVnd,
        lateFeeAsNight: q.lateFeeAsNight,
      };
      // ARC 16.6 (f) D7: `now` = at `confirmPaymentReceived` (amountDueNowFor) – never refused.
      if (opts.now) {
        return q.purpose === 'check_in'
          ? this.checkin.amountDueNow(tx, ctx, q.reservationId, checkIn)
          : this.checkout.amountDueNow(tx, ctx, q.reservationId, checkOut);
      }
      return q.purpose === 'check_in'
        ? this.checkin.amountDueForQr(tx, ctx, q.reservationId, checkIn)
        : this.checkout.amountDueForQr(tx, ctx, q.reservationId, checkOut);
    });
    // ARC-BE-S3-15 g: reservations shows the party size without reading reservation_guest itself.
    this.hooks.providePartyCount(async (tx, reservationId) => {
      const { rows } = await tx.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM reservation_guest WHERE reservation_id = $1 AND removed_at IS NULL`,
        [reservationId],
      );
      return rows[0]?.n ?? 0;
    });
    this.hooks.on('transitioned', async (tx, e) => {
      if (e.status !== 'cancelled' && e.status !== 'no_show') return;
      // B-13 (SEC G4): every guest link/session of the booking dies with it – the ONLY place (guest-portal no
      // longer hooks itself, ORC 16/10). The registration voids itself (BE-C hook, K11).
      const reason =
        e.status === 'no_show'
          ? 'no_show'
          : e.reasonCode === 'overbooking_relocated'
            ? 'relocated'
            : 'cancelled';
      await this.ports.guestAccess.revokeAllForReservation(tx, e.reservationId, reason);
      await this.events.publish(tx, 'reservation.changed', e.reservationId);
    });
    // BUG-R2-198 (ARC 16.19 bổ sung 4 – L1 before L4): a decision on `late_checkout_conflict` locks the booking
    // BEFORE the request row (StayService.lockForLateCheckoutDecision).
    this.approvals.onBeforeDecide('late_checkout_conflict', (tx, approvalId) =>
      this.stays.lockForLateCheckoutDecision(tx, approvalId),
    );
    this.approvals.onDecided('late_checkout_conflict', (tx, request) =>
      this.stays.onLateCheckoutDecided(tx, request),
    );
    for (const source of FRONTDESK_ATTENTION_SOURCES) this.events.registerAttentionSource(source);
    // BR-525 (18/10 – G-4): open guest debts (MGR+), and the debt a receipt reversed after B18 leaves – payments
    // (BE-B `reversePayment`) calls the port in the reversal's transaction.
    this.events.registerAttentionSource(checkoutDebtSource(this.support.folios));
    this.hooks.provideDebtAfterReversal((tx, input) => this.checkout.debtAfterReversal(tx, input));
    // ARC 16.26: collecting the debt after check-out – payments `recordPayment` (debt branch) asks for the open debt
    // and closes it when the folio owes nothing.
    this.hooks.provideOpenDebt((tx, folioId) => this.checkout.openDebt(tx, folioId));
    this.hooks.provideDebtSettled((tx, input) => this.checkout.debtSettled(tx, input));
    // ARC 16.27: J15 `folio.close` turns what is still owed after the window into one debt.
    this.hooks.provideDebtOnCheckout((tx, input) => this.checkout.debtOnCheckout(tx, input));
    // J24 payment.expire (VietQR shown at check-in/check-out – jobs are BE-A's, s3-contract 4.1).
    const j24 = paymentExpiryJob(this.audit);
    if (!this.jobs.get(j24.key)) this.jobs.register(j24);
  }
}
