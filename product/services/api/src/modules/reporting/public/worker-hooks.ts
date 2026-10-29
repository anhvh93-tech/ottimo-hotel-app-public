/**
 * The reporting module's ReservationHooks listener (no-show notices) for a worker composition – the SAME function as
 * ReportingModule, so a `transitioned` event a worker job emits reaches the same listeners as in the api.
 */
import type { Clock } from '../../../clock';
import type { EventsService } from '../../events/public/events.service';
import type { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { wireNoShowNotices } from '../internal/no-show-notices';

export function reportingWorkerHooks(deps: {
  hooks: ReservationHooks;
  events: EventsService;
  clock: Clock;
}): void {
  wireNoShowNotices(deps.hooks, deps.events, deps.clock);
}
