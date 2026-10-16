/**
 * What the reservations module needs from the folio module when a booking's nights change AFTER they were
 * posted (FB-R2-DOM-BE-01 Blocker, FB-R2-DOM-BE-02). Implemented by the folio module (BE-B) and provided under
 * FOLIO_STAY_SYNC; called by reservations (MoneyBridge) in the SAME transaction, lock order reservation →
 * room → folio. Amounts are never edited – corrections are reversal lines (BR-008).
 *
 * - voidStay()   B10 cancel, B11 no-show, BR-312 relocation (B5/B6 holds have no posted lines – still called,
 *                must be a no-op then): reverse every live `room` / `extra_person` line of the stay nights that
 *                are now `void`, and post ONE retained line (`cancellation_fee` | `no_show_fee`, revenue group
 *                "other", BR-904) of `retainedVnd` when > 0. The refund part stays in the `refund` approval flow.
 * - resyncStay() B7/B8 move, PATCH guests, B12 restore: make the folio match the sold nights of `stay`
 *                (reverse lines of nights no longer sold or whose price changed – BR-107 re-tiering, D-8 –,
 *                post lines for sold nights without a live line, re-post extra-person lines for the new guest
 *                count, reverse a previous `no_show_fee` on B12, re-project commission on the snapshot %).
 */
import type { Tx } from '../../../db/database';
import type { ConfirmedStay } from './sales-port';

export const FOLIO_STAY_SYNC = Symbol('FOLIO_STAY_SYNC');

export interface VoidStayInput {
  reservationId: string;
  reservationCode: string;
  folioId: string;
  /** stay_night ids made `void` by this transition. */
  voidedStayNightIds: string[];
  /** Deposit kept by OTTIMO (BR-309 cancellation fee / BR-311 no-show); 0 = nothing. */
  retainedVnd: number;
  retainedKind: 'cancellation_fee' | 'no_show_fee' | null;
  /** BR-308 reason code / `no_show` / `overbooking_relocated`. */
  reason: string;
  requestId?: string;
}

export interface FolioStaySync {
  voidStay(tx: Tx, input: VoidStayInput, actor: { userId: string | null }): Promise<void>;
  resyncStay(
    tx: Tx,
    stay: ConfirmedStay,
    actor: { userId: string | null; requestId?: string },
  ): Promise<void>;
}
