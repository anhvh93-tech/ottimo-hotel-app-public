/**
 * The front desk's debt ports on ReservationHooks (BR-525 G-4, ARC 16.26 / 16.27) – ONE wiring used by the api
 * (FrontdeskModule.onModuleInit) and by the worker (public/worker-hooks.ts, J15 `folio.close` – BUG-R3-037), so
 * the two processes never differ in what a debt does.
 */
import type { ReservationHooks } from '../../reservations/public/reservation-hooks';
import type { CheckoutService } from './checkout.service';

export function provideCheckoutDebtPorts(hooks: ReservationHooks, checkout: CheckoutService): void {
  // BR-525 (18/10 – G-4): the debt a receipt reversed after B18 leaves – payments (BE-B `reversePayment`) calls the
  // port in the reversal's transaction.
  hooks.provideDebtAfterReversal((tx, input) => checkout.debtAfterReversal(tx, input));
  // ARC 16.26: collecting the debt after check-out – payments `recordPayment` (debt branch) asks for the open debt
  // and closes it when the folio owes nothing.
  hooks.provideOpenDebt((tx, folioId) => checkout.openDebt(tx, folioId));
  hooks.provideDebtSettled((tx, input) => checkout.debtSettled(tx, input));
  // ARC 16.27: J15 `folio.close` turns what is still owed after the window into one debt.
  hooks.provideDebtOnCheckout((tx, input) => checkout.debtOnCheckout(tx, input));
}
