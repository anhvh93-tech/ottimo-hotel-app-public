/**
 * B-13 (SEC G4): every guest link/session of a booking dies with it – the ONLY place (guest-portal no longer hooks
 * itself, ORC 16/10); the registration voids itself (BE-C hook, K11). ONE function for the api (FrontdeskModule)
 * and the worker (public/worker-hooks.ts): J1 `hold.expire` cancels bookings in the worker process.
 */
import type { EventsService } from '../../events/public/events.service';
import type { ReservationHooks } from '../../reservations/public/reservation-hooks';
import type { FrontdeskGuestAccessPort } from '../public/ports';

export function wireCancelRevocation(
  hooks: ReservationHooks,
  guestAccess: FrontdeskGuestAccessPort,
  events: EventsService,
): void {
  hooks.on('transitioned', async (tx, e) => {
    if (e.status !== 'cancelled' && e.status !== 'no_show') return;
    const reason =
      e.status === 'no_show'
        ? 'no_show'
        : e.reasonCode === 'overbooking_relocated'
          ? 'relocated'
          : 'cancelled';
    await guestAccess.revokeAllForReservation(tx, e.reservationId, reason);
    await events.publish(tx, 'reservation.changed', e.reservationId);
  });
}
