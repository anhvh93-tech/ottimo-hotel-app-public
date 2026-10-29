/**
 * The guest portal's GuestAccessPort for a worker composition (no Nest container – worker-jobs.ts): J1 `hold.expire`
 * cancels bookings in the worker, and the front desk's cancel listener (B-13, SEC G4) revokes every guest link and
 * session of the booking through this port, as in the api (GuestPortalModule binds the same class).
 */
import type { Clock } from '../../../clock';
import type { AuditService } from '../../audit/public/audit.service';
import type { EventsService } from '../../events/public/events.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import type { RegistrationService } from '../../registration/public/registration.service';
import { GuestPortalService } from '../internal/guest-portal.service';
import { GuestAccessPort } from './guest-access.port';

export function guestAccessPortForWorker(deps: {
  regs: RegistrationService;
  parameters: ParameterService;
  audit: AuditService;
  clock: Clock;
  events: EventsService;
}): GuestAccessPort {
  return new GuestAccessPort(
    new GuestPortalService(deps.regs, deps.parameters, deps.audit, deps.clock, deps.events),
  );
}
