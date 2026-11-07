import type { ApprovalRequest, Folio, Reservation, Role } from '@ottimo/api-client';

/**
 * V5-5B 5B-1 (contract 0.3.13 addendum 1, `recordPayment` (B); DOM 11.4; UXD copy-v1.0.5 9.1 v2.5): money that reaches
 * OTTIMO's account after a booking was closed (`cancelled` / `no_show`) is recorded on that booking by FD+ only.
 */

/** FD+ (OWN, MGR, FDL, FD) – the only roles that record money after closure and close "Không thấy tiền". */
export const FD_PLUS: readonly Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
export const isFdPlus = (roles: readonly Role[]) => roles.some((r) => FD_PLUS.includes(r));

/** The two booking states the API calls closed (0.3.13 addendum 1, V5-48). */
export const isClosedBooking = (status: Reservation['status'] | undefined) =>
  status === 'cancelled' || status === 'no_show';

/** Reason code of the refund request the server creates with such a receipt (copy 9.1, 9.12). */
export const PAYMENT_AFTER_CANCEL = 'payment_after_cancel';

export type CancelledFrom = 'hold' | 'confirmed';

/**
 * Contract 0.3.13 addendum 1j (#158): `Reservation.cancellation.cancelledFrom` – the state right before the cancel,
 * FD+ only, absent on a `no_show` booking. Typed here until the api-client is generated from a contract that has it.
 */
type CancellationWithFrom = NonNullable<Reservation['cancellation']> & {
  cancelledFrom?: CancelledFrom;
};

export function cancelledFromOf(r: Reservation): CancelledFrom | undefined {
  const from = (r.cancellation as CancellationWithFrom | undefined)?.cancelledFrom;
  return from === 'hold' || from === 'confirmed' ? from : undefined;
}

/**
 * 5B-1 `type` rule (server `afterClosureType`): `deposit` for a booking cancelled while still a hold, `charge` for
 * any other closed booking (a confirmed one cancelled, a no-show). The wrong one → 422 `type` NOT_ALLOWED.
 */
export function afterCancelType(r: Reservation): 'deposit' | 'charge' {
  return r.status === 'cancelled' && cancelledFromOf(r) === 'hold' ? 'deposit' : 'charge';
}

export type AfterCancelMethod = 'bank_transfer' | 'vietqr' | 'card_pos';

/** Bank transfer and VietQR always; the POS card only while the booking still owes a fee (N > 0, ARC 105-03). */
export function afterCancelMethods(dueVnd: number): AfterCancelMethod[] {
  return dueVnd > 0 ? ['bank_transfer', 'vietqr', 'card_pos'] : ['bank_transfer', 'vietqr'];
}

/** max(0, amount − N): what the server turns into a `payment_after_cancel` refund (server `afterClosureRefundVnd`). */
export function afterCancelRefundVnd(amountVnd: number, dueVnd: number): number {
  return Math.max(0, amountVnd - Math.max(0, dueVnd));
}

/** N = `getFolio.totals.balanceDueVnd` (absent on a folio without posted lines → 0). */
export const dueOf = (folio: Folio | null | undefined) =>
  Math.max(0, folio?.totals?.balanceDueVnd ?? 0);

/**
 * The open `payment_after_cancel` refunds of a folio (`Folio.totals.openRefunds`, V5-13). `undefined` when the server
 * does not send the list (absent ≠ none) – the caller then falls back to max(0, amount − N).
 */
export function afterCancelOpenVnd(folio: Folio | null | undefined): number | undefined {
  const rows = folio?.totals?.openRefunds;
  if (!Array.isArray(rows)) return undefined;
  return rows
    .filter((x) => x.reasonCode === PAYMENT_AFTER_CANCEL)
    .reduce((sum, x) => sum + (x.openVnd ?? 0), 0);
}

/**
 * `{refund}` of `rsv.after_cancel.done` (copy 9.1): the increase of the `payment_after_cancel` group between the read
 * when the box opened and the read after the receipt – never the amount typed. Without the list on either read, the
 * server rule on the N read last.
 */
export function refundCreatedVnd(
  before: Folio | null | undefined,
  after: Folio | null | undefined,
  amountVnd: number,
  dueVnd: number,
): number {
  const a = afterCancelOpenVnd(after);
  const b = afterCancelOpenVnd(before);
  if (a !== undefined && b !== undefined) return Math.max(0, a - b);
  return afterCancelRefundVnd(amountVnd, dueVnd);
}

/** A refund request created by a receipt after closure: destination fixed to `original_method` by the server. */
export const isAfterCancelRefund = (a: Pick<ApprovalRequest, 'type' | 'reasonCode'>) =>
  a.type === 'refund' && a.reasonCode === PAYMENT_AFTER_CANCEL;
