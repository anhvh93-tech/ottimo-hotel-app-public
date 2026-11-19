// FB-INV-012 go-live fix (ARC contract `rounds/round-05/fb-inv-012/contract.md` §12, OpenAPI 0.3.15-draft).
// Since BE #197 the shapes come from the generated spec – the compiler shows any drift.
import type { components } from './generated/openapi';

type Schemas = components['schemas'];

/** §12.1.1 – only with `manualLongStay`; OWN/MGR on a trusted device (SEC 12-07). No `closerUserId` (SEC 12-01). */
export type BackdatedArrival = NonNullable<Schemas['ReservationCreate']['backdatedArrival']>;

/** §12.1.2 `checkInBackdated` body. No time, surcharge, B9a, payment or house rules. */
export type CheckInBackdatedBody = Schemas['CheckInBackdatedInput'];

/** §12.2 `settleBillingPeriodOutsideDesk` body (`amountVnd` absent = the balance). */
export type SettleOutsideDeskBody = Schemas['BillingPeriodOutsideDeskCreate'];

/** §12.3 – plain text both ways (`null` = cleared). */
export type PropertyContact = Schemas['PropertyContact'];

/** §12.4 (BE #200) – where the catalog price came from; only present when asked with `folioId`. */
export type ChargePriceSource = NonNullable<Schemas['ChargeCatalogItem']['priceSource']>;

/** Enum values of §12 (now in the generated unions; kept as named constants for readability). */
export const GO_LIVE_RESERVATION_ACTION = 'check_in_backdated';
export const GO_LIVE_STATEMENT_ACTION = 'settle_outside_desk';
export const OUTSIDE_DESK_METHOD = 'outside_desk';
export const READING_CATCH_UP = 'READING_CATCH_UP';
