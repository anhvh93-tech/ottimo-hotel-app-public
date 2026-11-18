// FB-INV-012 go-live fix (ARC contract `rounds/round-05/fb-inv-012/contract.md` §12, OpenAPI 0.3.15-draft).
// TEMPORARY hand-written shapes: BE writes the spec + `generated/openapi.ts` in PR `r5-fb012-golive-be`, in
// parallel. Field names copy §12 exactly. Once that PR is on main, each alias below points at the generated schema
// (`Schemas['PropertyContact']`, `BodyOf<'checkInBackdated'>`…) and the compiler shows any drift.

/** §12.1.1 – only with `manualLongStay`; OWN/MGR on a trusted device (SEC 12-07). No `closerUserId` (SEC 12-01). */
export interface BackdatedArrival {
  reason: string;
}

/** §12.1.2 `checkInBackdated` body. No time, surcharge, B9a, payment or house rules. */
export interface CheckInBackdatedBody {
  arrivalDate: string;
  reason: string;
  cardsIssued?: number;
  documentBlockOverride?: { reason: string };
}

/** §12.2 `settleBillingPeriodOutsideDesk` body (`amountVnd` absent = the balance). */
export interface SettleOutsideDeskBody {
  amountVnd?: number;
  receivedOn: string;
  reason: string;
  reference?: string | null;
}

/** §12.3 – plain text both ways (`null` = cleared). */
export interface PropertyContact {
  addressLine: string | null;
  hotline: string | null;
}

/** §12.4 – where the price of `adhoc_cleaning_fee` comes from when the catalog is read with `folioId`. */
export type ChargePriceSource = 'long_stay_room' | 'default';

/** New enum values of §12 the generated unions do not hold yet. */
export const GO_LIVE_RESERVATION_ACTION = 'check_in_backdated';
export const GO_LIVE_STATEMENT_ACTION = 'settle_outside_desk';
export const OUTSIDE_DESK_METHOD = 'outside_desk';
export const READING_CATCH_UP = 'READING_CATCH_UP';
