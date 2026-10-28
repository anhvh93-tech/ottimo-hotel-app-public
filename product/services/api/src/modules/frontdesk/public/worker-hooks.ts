/**
 * BUG-R3-037 (BE-B): the front desk's ports for a worker composition (no Nest container – worker.ts composes plain
 * objects). J15 `folio.close` (folio/public/worker-jobs.ts) records what is still owed after the post-checkout
 * window as ONE debt through `ReservationHooks.debtOnCheckout` and reads `openDebt`; both are the front desk's
 * CheckoutService, wired by the SAME function as FrontdeskModule (internal/checkout-debt-ports.ts). Same classes
 * as the api module, built on the caller's shared instances; the ports of other zones keep their fail-closed
 * defaults (no check-in / guest link / minibar runs in the worker).
 */
import type { Clock } from '../../../clock';
import type { ApprovalService } from '../../approvals/public/approval.service';
import type { AuditService } from '../../audit/public/audit.service';
import type { EventsService } from '../../events/public/events.service';
import type { AttachmentService } from '../../files/public/attachment.service';
import type { FolioService } from '../../folio/public/folio.service';
import { DocumentProfileService } from '../../guests/public/document-profile.service';
import type { PaymentService } from '../../payments/public/payment.service';
import { ChannelsService } from '../../platform/public/channels';
import type { DocNumberService } from '../../platform/public/doc-number.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import { OccupancyService } from '../../reservations/public/occupancy.service';
import { PricingService } from '../../reservations/public/pricing.service';
import type { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { reservationStayPortForWorker } from '../../reservations/public/worker-jobs';
import { CheckinService } from '../internal/checkin.service';
import { provideCheckoutDebtPorts } from '../internal/checkout-debt-ports';
import { CheckoutService } from '../internal/checkout.service';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
  UnwiredRegistrationPort,
} from '../internal/default-ports';
import { StayService } from '../internal/stay.service';
import { FrontdeskPorts, StaySupport } from '../internal/stay-support';
import { RoomStatusService } from './room-status.service';

export function frontdeskWorkerHooks(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  events: EventsService;
  approvals: ApprovalService;
  hooks: ReservationHooks;
  folios: FolioService;
  payments: PaymentService;
  docNumbers: DocNumberService;
  attachments: AttachmentService;
}): void {
  const occupancy = new OccupancyService();
  const pricing = new PricingService(deps.parameters);
  const support = new StaySupport(
    reservationStayPortForWorker({ ...deps, occupancy, pricing }),
    deps.parameters,
    occupancy,
    pricing,
    new RoomStatusService(deps.events, deps.parameters),
    deps.events,
    deps.folios,
    deps.approvals,
    new FrontdeskPorts(
      new UnwiredRegistrationPort(),
      new NoGuestAccessPort(),
      new UnwiredChildDataPort(),
      new NoMinibarPort(),
    ),
  );
  const checkin = new CheckinService(support, deps.audit, deps.payments);
  const stays = new StayService(
    support,
    deps.audit,
    new ChannelsService(),
    checkin,
    deps.attachments,
  );
  const checkout = new CheckoutService(
    deps.clock,
    support,
    stays,
    deps.audit,
    deps.payments,
    new DocumentProfileService(deps.docNumbers, deps.audit),
  );
  provideCheckoutDebtPorts(deps.hooks, checkout);
}
