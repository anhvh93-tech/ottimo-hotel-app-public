/**
 * Extension points of the reservations module for the modules built in parallel (folio, registration,
 * commissions, payments – BE-B). Everything runs in the SAME transaction as the booking change
 * (coding-standards 6 "Giao dịch"): a failing hook rolls the whole use case back.
 *
 * - ReservationHooks.on('created' | 'transitioned' | 'stay_changed', fn)
 *     created      – B1/B2 after the booking, its segment, occupancy, nights and folio exist: registration
 *                    creates its `none` record (BR-608, US-047).
 *     transitioned – every SM-01 transition (B3…B12, B7a): registration void/restore (K11/K12), commission
 *                    void/projected (SM-11), refunds…
 *     stay_changed – room/dates/people changed without a status change (B7, B7a, swap, PATCH people).
 * Money postings (folio, payments) are not hooks: internal/money-bridge.ts calls FolioService/PaymentService.
 */
import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { ChannelGroup, ReservationStatus } from '../../../db/schema';
import type { LocalDate } from '../../../shared/time';
import type { AmountDueQuery } from './sales-port';

export type ReservationEventKind = 'created' | 'transitioned' | 'stay_changed';

export interface ReservationEvent {
  kind: ReservationEventKind;
  reservationId: string;
  code: string;
  status: ReservationStatus;
  previousStatus: ReservationStatus | null;
  /** SM-01 transition code (B1, B2, B4, B10…), null for stay_changed without transition. */
  transition: string | null;
  channelGroup: ChannelGroup;
  roomId: string | null;
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  /** Persons to declare (BR-608: everyone, children under 6 included). */
  personsTotal: number;
  externalContract: boolean;
  reasonCode?: string | undefined;
}

export type ReservationHook = (tx: Tx, event: ReservationEvent) => Promise<void>;

/** Number of active party members recorded on a booking (US-022 – the frontdesk module owns them). */
export type PartyCounter = (tx: Tx, reservationId: string) => Promise<number>;

/** The booking's registration (EP06 – the registration module owns it); null = none yet. */
export type RegistrationSummaryReader = (
  tx: Tx,
  reservationId: string,
) => Promise<{ id: string; status: string; deadlineAt: Date | null } | null>;

/**
 * 0.3.7 bổ sung 1 (ARC 11.3 (2), BUG-R2-081): the booking's "khách đã chuyển cọc" notices, newest first – the
 * payments module owns `deposit_notice` and provides the reader (reservations never reads that table).
 */
export interface DepositNoticeView {
  id: string;
  amountVnd: number;
  note: string | null;
  attachmentId: string | null;
  /** Instants already formatted by the owner (`+07:00`, toZonedIso). */
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  status: 'open' | 'handled';
}
export type DepositNoticeReader = (tx: Tx, reservationId: string) => Promise<DepositNoticeView[]>;

/**
 * 0.3.7 D1 (S4-09, BR-424 v0.3.6): `updateReservation.roomReturnRecorded` – "khách đã chuyển về căn cũ" on the
 * return day of a `changeRoom stayScope = until_parent_departure`. The room statuses, cleaning and door access
 * belong to the front desk module, which provides the handler (it validates and throws the 409 itself).
 */
export type RoomReturnHandler = (
  tx: Tx,
  input: { reservationId: string; userId: string; roles: readonly string[]; requestId?: string },
) => Promise<void>;

/**
 * 0.3.7 (S4-10 – `createVietQr` `check_in` / `check_out`): the check-in / check-out amounts are the front desk's
 * (previewCheckIn / getCheckoutSummary) – it provides the calculation; ReservationSalesPort.amountDueFor calls it.
 */
export type AmountDueHandler = (
  tx: Tx,
  q: AmountDueQuery,
  opts?: { now?: boolean },
) => Promise<number>;

/**
 * BR-525 (18/10 – G-4, `reviews/s4-money-recheck6.md`): a receipt of a CHECKED-OUT stay reversed by MGR+
 * (`reversePayment` on a `settled` folio – a wrong entry, a transfer that never arrived) leaves money to collect →
 * in the SAME transaction the guest's debt is recorded for what the reversal added (the B18 debt structure: the
 * stay's bookings `checkoutMode = debt`, due date, reason = the reversal reason), OWN + MGR are told
 * (`debt_recorded`) and "Cần chú ý" `checkout_debt` stays until the money is in or MGR FOCs / writes it off
 * (BR-433). No `post_checkout` line: the bill does not change, only the receipt was reversed.
 *
 * The front desk module (owner of the B18 debt) provides it; payments (BE-B) calls it right after writing the
 * reversal. Lock order (ARC 16.19): the caller already holds the folio's bookings FOR NO KEY UPDATE (L1 –
 * `FolioService.lockStay`) and the folio (L3), then the payment (L4); the handler writes those bookings only. The
 * balance after the reversal is read by the handler under those locks; the caller passes the one before. Nothing
 * happens (`recorded: false`) when the stay is not checked out or the reversal added nothing to collect.
 */
export interface DebtAfterReversalInput {
  folioId: string;
  /** The receipt that was reversed (`payment.id` of the original row). */
  paymentId: string;
  /** The reversal reason (V-08, already checked by the caller) – becomes the debt reason. */
  reason: string;
  /**
   * DOM 18/10 (BR-525 G-4, amount): "còn phải thu" of the folio read by the caller under L3 BEFORE writing the
   * reversal (`FolioService.balance().balanceDueVnd`, ≥ 0). The debt is ONLY what the reversal added:
   * max(0, due after) − max(0, due before) – a post-checkout charge still in its window or a credit already on the
   * folio is not part of it.
   */
  dueBeforeVnd: number;
  actor: { userId: string; roles: readonly string[] };
  requestId?: string;
}
/**
 * ARC 16.27 (R7LOCK-01, BR-427 (d)): J15 `folio.close` (BE-B) – the post-checkout window is over, the folio still
 * owes money and the stay has no open debt → everything owed becomes one debt (B18 structure), then the job closes
 * the folio. Lock order: the caller holds L1 (every booking of the folio) → L3 (folio).
 */
export interface DebtOnCheckoutInput {
  folioId: string;
  /** The debt reason – the job's code (`post_checkout_unpaid`). */
  reason: string;
  /** Days to the due date from the business date; absent → parameter `debt_default_due_days` (default 3). */
  dueDays?: number;
  /** The job's system actor (excluded from nobody: a system user receives no inbox row). */
  actor: { userId: string; roles: readonly string[] };
  requestId?: string;
}
export type DebtOnCheckoutHandler = (
  tx: Tx,
  input: DebtOnCheckoutInput,
) => Promise<DebtRecordedResult>;

export interface DebtAfterReversalResult {
  recorded: boolean;
  /** The primary booking of the stay carrying the debt (null = no debt recorded). */
  reservationId: string | null;
  /** The debt recorded by this reversal (0 = none): max(0, due after) − max(0, `dueBeforeVnd`). */
  debtVnd: number;
  /** "Còn phải thu" of the folio after the reversal (read under the locks). */
  balanceDueVnd: number;
  dueDate: LocalDate | null;
}
/** What a debt port wrote (G-4 reversal, J15): the same shape. */
export type DebtRecordedResult = DebtAfterReversalResult;

export type DebtAfterReversalHandler = (
  tx: Tx,
  input: DebtAfterReversalInput,
) => Promise<DebtAfterReversalResult>;

/**
 * ARC 16.26 (BR-525 G-4 – collecting a debt after check-out): the stay's OPEN debt as payments needs it to accept a
 * `charge` on a `settled`/`closed` folio – the primary booking is checked out with `checkout_mode = debt`, the debt
 * is not settled and the folio still owes money. Read under the caller's locks (L1 bookings of the folio →
 * L3 folio, like `reversePayment`). null = no open debt (payments answers 409 FOLIO_LOCKED as before).
 */
export interface OpenDebt {
  /** The primary booking of the stay carrying the debt. */
  reservationId: string;
  reservationCode: string;
  /** Every checked-out booking of the folio in debt (primary + children). */
  reservationIds: string[];
  dueDate: LocalDate;
  /** "Còn phải thu" of the folio – the cap of a debt receipt (422 AMOUNT_EXCEEDS_BALANCE + `max`). */
  balanceDueVnd: number;
  /**
   * DOM 18/10 (BR-525): the OPEN debt – from the debt records of the open cycle (B18 = what was owed, G-4 = each
   * increase, J15 = everything owed) minus what was collected or written off since; capped by `balanceDueVnd`.
   * After the post-checkout window everything owed is debt (= `balanceDueVnd`). The cap of a `debt_write_off` FOC.
   * Always > 0 (ARC 16.31.1 – BUG-R2-208: 0 → the reader returns null).
   */
  openDebtVnd: number;
  /**
   * FB-R3-SEC-BE-B-01 (b): the debt has its 0076 cycle (`debt_opened_at`). false = a debt written before 0076 whose
   * number is derived back from the lines (W_old) – A32 reductions stay blocked (R2 N-7) until a debt record opens
   * the cycle.
   */
  cycleOpened: boolean;
}
export type OpenDebtReader = (tx: Tx, folioId: string) => Promise<OpenDebt | null>;

/**
 * ARC 16.26: after a debt receipt is written (same transaction, same locks), payments calls it; when the folio
 * owes nothing any more the debt is closed (`debt_settled_at`, state audit `reservation.debt_settled`, SSE) and
 * "Cần chú ý" `checkout_debt` drops it. Still owing (partial payment) → `settled: false`, the debt stays open.
 */
export interface DebtSettledInput {
  folioId: string;
  /** The receipt that paid the debt, or the FOC line that wrote it off (audit reference). */
  paymentId: string;
  /** ARC 16.27 (R7LOCK-02): `written_off` when an OWN/MGR FOC `debt_write_off` brought it to 0 (default `paid`). */
  outcome?: 'paid' | 'written_off';
  actor: { userId: string; roles: readonly string[] };
  requestId?: string;
}
export interface DebtSettledResult {
  settled: boolean;
  /** The bookings whose debt was closed (empty when not settled). */
  reservationIds: string[];
  balanceDueVnd: number;
  /** How it was closed (null when not settled). */
  outcome: 'paid' | 'written_off' | null;
}
export type DebtSettledHandler = (tx: Tx, input: DebtSettledInput) => Promise<DebtSettledResult>;

@Injectable()
export class ReservationHooks {
  private readonly hooks = new Map<ReservationEventKind, ReservationHook[]>();
  private partyCounter: PartyCounter | null = null;
  private registrationReader: RegistrationSummaryReader | null = null;
  private depositNoticeReader: DepositNoticeReader | null = null;
  private roomReturnHandler: RoomReturnHandler | null = null;
  private amountDueHandler: AmountDueHandler | null = null;
  private debtAfterReversalHandler: DebtAfterReversalHandler | null = null;
  private openDebtReader: OpenDebtReader | null = null;
  private debtOnCheckoutHandler: DebtOnCheckoutHandler | null = null;
  private debtSettledHandler: DebtSettledHandler | null = null;

  on(kind: ReservationEventKind, hook: ReservationHook): void {
    this.hooks.set(kind, [...(this.hooks.get(kind) ?? []), hook]);
  }

  /**
   * ARC-BE-S3-15 g: `reservation_guest` belongs to the frontdesk module, which provides the count here (the
   * Reservation DTO's `partyPresentCount`) – reservations never reads that table.
   */
  providePartyCount(counter: PartyCounter): void {
    this.partyCounter = counter;
  }

  partyCount(tx: Tx, reservationId: string): Promise<number> {
    return this.partyCounter ? this.partyCounter(tx, reservationId) : Promise.resolve(0);
  }

  /**
   * BUG-R2-031 (OpenAPI 0.3.6 `Reservation.registrationId/Status/DeadlineAt`): provided by the registration
   * module – reservations never reads `registration`.
   */
  provideRegistrationSummary(reader: RegistrationSummaryReader): void {
    this.registrationReader = reader;
  }

  registrationSummary(
    tx: Tx,
    reservationId: string,
  ): Promise<{ id: string; status: string; deadlineAt: Date | null } | null> {
    return this.registrationReader
      ? this.registrationReader(tx, reservationId)
      : Promise.resolve(null);
  }

  /** 0.3.7 bổ sung 1: provided by the payments module (BE-B) – `Reservation.depositNotices` of getReservation. */
  provideDepositNotices(reader: DepositNoticeReader): void {
    this.depositNoticeReader = reader;
  }

  depositNotices(tx: Tx, reservationId: string): Promise<DepositNoticeView[]> {
    return this.depositNoticeReader
      ? this.depositNoticeReader(tx, reservationId)
      : Promise.resolve([]);
  }

  /** 0.3.7 D1 (S4-09): provided by the front desk module. */
  provideRoomReturn(handler: RoomReturnHandler): void {
    this.roomReturnHandler = handler;
  }

  async roomReturn(tx: Tx, input: Parameters<RoomReturnHandler>[1]): Promise<void> {
    if (!this.roomReturnHandler)
      throw new Error('room return handler not wired (frontdesk module)');
    await this.roomReturnHandler(tx, input);
  }

  /** 0.3.7 (S4-10): provided by the front desk module. */
  provideAmountDue(handler: AmountDueHandler): void {
    this.amountDueHandler = handler;
  }

  async amountDue(tx: Tx, q: AmountDueQuery, opts: { now?: boolean } = {}): Promise<number> {
    if (!this.amountDueHandler) throw new Error('amount due handler not wired (frontdesk module)');
    return this.amountDueHandler(tx, q, opts);
  }

  /** BR-525 G-4: provided by the front desk module (see DebtAfterReversalInput). */
  provideDebtAfterReversal(handler: DebtAfterReversalHandler): void {
    this.debtAfterReversalHandler = handler;
  }

  /** BR-525 G-4: called by payments (`reversePayment`) in the reversal's transaction, under L1 → L3 → L4. */
  async debtAfterReversal(tx: Tx, input: DebtAfterReversalInput): Promise<DebtAfterReversalResult> {
    if (!this.debtAfterReversalHandler) {
      throw new Error('debt-after-reversal handler not wired (frontdesk module)');
    }
    return this.debtAfterReversalHandler(tx, input);
  }

  /** ARC 16.27: provided by the front desk module (see DebtOnCheckoutInput). */
  provideDebtOnCheckout(handler: DebtOnCheckoutHandler): void {
    this.debtOnCheckoutHandler = handler;
  }

  /** ARC 16.27: J15 `folio.close` – what is still owed after the window becomes one debt. */
  async debtOnCheckout(tx: Tx, input: DebtOnCheckoutInput): Promise<DebtRecordedResult> {
    if (!this.debtOnCheckoutHandler) {
      throw new Error('debt-on-checkout handler not wired (frontdesk module)');
    }
    return this.debtOnCheckoutHandler(tx, input);
  }

  /** ARC 16.26: provided by the front desk module (see OpenDebt). */
  provideOpenDebt(reader: OpenDebtReader): void {
    this.openDebtReader = reader;
  }

  /** ARC 16.26: the open debt of the folio's stay (payments `recordPayment`, debt-collection branch). */
  async openDebt(tx: Tx, folioId: string): Promise<OpenDebt | null> {
    if (!this.openDebtReader) throw new Error('open-debt reader not wired (frontdesk module)');
    return this.openDebtReader(tx, folioId);
  }

  /** ARC 16.26: provided by the front desk module (see DebtSettledInput). */
  provideDebtSettled(handler: DebtSettledHandler): void {
    this.debtSettledHandler = handler;
  }

  /** ARC 16.26: called by payments after a debt receipt, in its transaction (L1 → L3 → L4 held). */
  async debtSettled(tx: Tx, input: DebtSettledInput): Promise<DebtSettledResult> {
    if (!this.debtSettledHandler)
      throw new Error('debt-settled handler not wired (frontdesk module)');
    return this.debtSettledHandler(tx, input);
  }

  async emit(tx: Tx, event: ReservationEvent): Promise<void> {
    for (const hook of this.hooks.get(event.kind) ?? []) await hook(tx, event);
  }
}

export interface InitialPayment {
  type: 'deposit' | 'charge';
  method: string;
  amountVnd: number;
  receivedAt?: string | undefined;
  posAuthCode?: string | undefined;
  note?: string | undefined;
  attachmentId?: string | undefined;
}
