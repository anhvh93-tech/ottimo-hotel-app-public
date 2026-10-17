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

@Injectable()
export class ReservationHooks {
  private readonly hooks = new Map<ReservationEventKind, ReservationHook[]>();
  private partyCounter: PartyCounter | null = null;
  private registrationReader: RegistrationSummaryReader | null = null;
  private depositNoticeReader: DepositNoticeReader | null = null;
  private roomReturnHandler: RoomReturnHandler | null = null;
  private amountDueHandler: AmountDueHandler | null = null;

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
