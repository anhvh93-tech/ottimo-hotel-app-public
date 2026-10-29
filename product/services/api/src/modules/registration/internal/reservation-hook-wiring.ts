/**
 * What the registration module listens to on ReservationHooks – ONE function for the api (RegistrationModule) and the
 * worker (public/worker-jobs.ts), so the two processes cannot drift: J1 `hold.expire` runs in the worker and a hold
 * that expires is cancelled there, so its registration must void itself there too (K11).
 * - `created` → K1 record; `cancelled` / `no_show` → K11 void + images now; restore of a no-show → K12;
 *   `stay_changed` → requiredCount (K9/K13);
 * - Reservation.registrationId/Status/DeadlineAt without reservations reading `registration` (BUG-R2-031).
 */
import type { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { registrationSummary } from '../public/stay-facts';
import type { RegistrationService } from './registration.service';

export function wireRegistrationReservationHooks(
  hooks: ReservationHooks,
  regs: RegistrationService,
): void {
  hooks.on('created', async (tx, e) => {
    await regs.ensure(tx, e.reservationId);
  });
  hooks.on('transitioned', async (tx, e) => {
    if (e.status === 'cancelled' || e.status === 'no_show') {
      await regs.onReservationVoided(tx, e.reservationId);
    } else if (e.previousStatus === 'no_show' && e.status === 'confirmed') {
      await regs.onReservationRestored(tx, e.reservationId);
    }
  });
  hooks.on('stay_changed', async (tx, e) => {
    await regs.onPartyChanged(tx, e.reservationId, e.personsTotal);
  });
  hooks.provideRegistrationSummary(registrationSummary);
}
