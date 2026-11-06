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
 * - ensureCommission() FB-R5-DOM-BE-101-01 (Major; ARC FB-R5-ARC-BE-H1-03 (1)): the commission sync ALONE (no folio
 *                line, no folio lock, the folio may be settled) for a short stay with a closer that has no commission
 *                row in a live status yet (a booking confirmed while its payee had no rate – `rate_missing`). Same rate
 *                order as resyncStay (snapshot, then the first row of the payee type, then the table in force today).
 *                Still no rate → still no row. Run again → no change. Folio's `tryEarnCommissions` runs it before
 *                deciding "earned" (B18, reconciliation, a debt paid or written off); a later job or PR-M may call it
 *                for confirmed bookings once OWN typed the table (DOM 101-01 (3) – never from `setParameter`).
 *                ARC FB-R5-ARC-BE-131-02 (3): skipped only when the booking has an `earned`/`payable`/`paid` row or a
 *                `projected` row of the CURRENT closer; a `projected` row of an earlier closer is voided and replaced.
 * - syncCommissionOnly() contract 0.3.13 bổ sung 1h (DOM FB-R5-DOM-BE-131-01, ARC FB-R5-ARC-BE-131-02 (1)–(2)): PATCH
 *                changed the closer → the commission alone follows in the same transaction: the earlier closer's
 *                live row → `void` (`voidReason`), the new closer's row at the booking's pinned rate (`earned` on a
 *                checked-out booking by the B18 rule). A row `payable` / `paid` → 409 INVALID_TRANSITION.
 */
import type { Tx } from '../../../db/database';
import type { ConfirmedStay } from './sales-port';

export const FOLIO_STAY_SYNC = Symbol('FOLIO_STAY_SYNC');

/**
 * `commission.void_reason` written by a sync (SM-11): `resync` – nights / price / people changed; `closer_changed` – the
 * closer changed before check-in (MGR+); `closer_corrected` – OWN corrected the closer after check-in (BR-903 (3)).
 */
export type CommissionVoidReason = 'resync' | 'closer_changed' | 'closer_corrected';

export interface VoidStayInput {
  reservationId: string;
  reservationCode: string;
  folioId: string;
  /** stay_night ids made `void` by this transition. */
  voidedStayNightIds: string[];
  /** Deposit kept by OTTIMO (BR-309 cancellation fee / BR-311 no-show); 0 = nothing. */
  retainedVnd: number;
  retainedKind: 'cancellation_fee' | 'no_show_fee' | null;
  /**
   * 0.3.6 bổ sung 4 (BR-310/901): the OTA's actual channel fee on the cancellation penalty
   * (`cancelReservation.otaPenaltyChannelFeeVnd`); absent → the channel rate snapshot × base.
   */
  channelFeeActualVnd?: number;
  /** BR-308 reason code / `no_show` / `overbooking_relocated`. */
  reason: string;
  requestId?: string;
  /**
   * 0.3.7 D1 S4-08 (BR-309 v0.3.4, BE-B): cancellation / no-show reverse the booking's service lines (with their
   * FOC) except `retainLines` (validated by FolioService.closeStayPreview). Absent = no service reversal
   * (relocation, holds).
   */
  services?: { retainLines: ReadonlyArray<{ lineId: string; reason: string }> };
}

export interface FolioStaySync {
  voidStay(tx: Tx, input: VoidStayInput, actor: { userId: string | null }): Promise<void>;
  resyncStay(
    tx: Tx,
    stay: ConfirmedStay,
    actor: { userId: string | null; requestId?: string },
  ): Promise<void>;
  /** Returns the amount of the row created (0 = nothing done). */
  ensureCommission(
    tx: Tx,
    stay: ConfirmedStay,
    actor: { userId: string | null; requestId?: string },
  ): Promise<number>;
  /** Returns the amount of the live row after the sync (0 = none). The caller holds the booking and the folio. */
  syncCommissionOnly(
    tx: Tx,
    stay: ConfirmedStay,
    actor: { userId: string | null; requestId?: string },
    opts: { voidReason: CommissionVoidReason; reservationStatus: string },
  ): Promise<number>;
}
