/**
 * Implementation of RESERVATION_SALES_PORT (public/sales-port.ts) for sales, folio and payments (BE-B).
 * The caller owns the transaction; the actor is the user of the transaction context (its roles are read
 * from user_property_role so allowedActions in reservationView match the caller).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type {
  AmountDueQuery,
  AvailabilityAnswer,
  AvailabilityQuery,
  ConfirmedStay,
  DepositTarget,
  HoldFromQuoteInput,
  ReservationOwnership,
  ReservationSalesPort,
  StayInfo,
} from '../public/sales-port';
import { nightDates } from '../public/pricing';
import { PricingService, type PricedNight } from '../public/pricing.service';
import { readOwnership, readStayInfo } from '../public/read-port';
import { ReservationHooks } from '../public/reservation-hooks';
import { type BookingContext } from './booking-context';
import { RackService } from './rack.service';
import { loadReservation } from './reservation-store';
import { ReservationsService, SYSTEM_ACTOR } from './reservations.service';

@Injectable()
export class ReservationSalesAdapter implements ReservationSalesPort {
  constructor(
    @Inject(ReservationsService) private readonly reservations: ReservationsService,
    @Inject(RackService) private readonly rack: RackService,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
  ) {}

  /** 0.3.7 (S4-10): the front desk's calculation (previewCheckIn / getCheckoutSummary) – one source. */
  amountDueFor(tx: Tx, q: AmountDueQuery): Promise<number> {
    return this.hooks.amountDue(tx, q);
  }

  private async ctx(tx: Tx, requestId?: string): Promise<BookingContext> {
    const userId = tx.ctx.userId ?? SYSTEM_ACTOR.userId;
    const { rows } = await tx.query<{ role: string }>(
      `SELECT role FROM user_property_role WHERE user_id = $1 AND property_id = $2 AND revoked_at IS NULL`,
      [userId, tx.ctx.propertyId],
    );
    const roles = tx.ctx.userId ? rows.map((r) => r.role) : SYSTEM_ACTOR.roles;
    return this.reservations.context(tx, { userId, roles }, requestId);
  }

  async availability(tx: Tx, q: AvailabilityQuery): Promise<AvailabilityAnswer> {
    const ctx = await this.ctx(tx);
    const a = await this.rack.availability(tx, ctx.today, {
      roomId: q.roomId,
      roomGroupId: q.roomGroupId,
      fromDate: q.fromDate,
      toDate: q.toDate,
      persons: q.countedPersons,
    });
    return {
      available: a.available,
      ...(a.reason ? { reason: a.reason } : {}),
      alternatives: a.alternatives,
      ...(a.orphanGap !== undefined ? { orphanGap: a.orphanGap } : {}),
    };
  }

  async createHoldFromQuote(
    tx: Tx,
    input: HoldFromQuoteInput,
  ): Promise<{ reservationId: string; code: string }> {
    const ctx = await this.ctx(tx, input.requestId);
    const p = ctx.params;
    // BR-429 (a1) v0.3.8 (DOM-S4-04): the quote's calendar price of each night and the % it applied (BR-107 tier
    // or BR-111 return code – `calc.losDiscountPct`) are kept, so a later change re-tiers from the calendar and
    // never discounts a discounted price a second time.
    const quote = input.pricingSnapshot as {
      calendarRatesVnd?: unknown;
      calc?: { losDiscountPct?: unknown };
    };
    const calendar = Array.isArray(quote.calendarRatesVnd)
      ? (quote.calendarRatesVnd as unknown[])
      : [];
    const quoteDates = nightDates(input.arrivalDate, input.departureDate);
    const nights: PricedNight[] = input.nightlyRates.map((n) => {
      const c = calendar[quoteDates.indexOf(n.date)];
      return {
        date: n.date,
        amountVnd: n.amountVnd,
        source: 'calendar',
        ...(typeof c === 'number' && c > 0 ? { calendarVnd: c } : {}),
      };
    });
    const appliedPct =
      typeof quote.calc?.losDiscountPct === 'number' ? quote.calc.losDiscountPct : 0;
    const hasPeakNight = nights.some((n) =>
      p.calendar.specialDates.some((s) => n.date >= s.from && n.date < s.to),
    );
    const result = {
      nights,
      totalRoomVnd: input.totalRoomVnd,
      losDiscountPct: appliedPct,
      extraCount: input.extraGuestCount,
      extraPersonFeePerNightVnd: input.extraPersonPerNightVnd,
      extraPersonFeeVnd: input.extraPersonPerNightVnd * nights.length,
      depositRequiredVnd: input.depositRequiredVnd,
      hasPeakNight,
      outOfRange: [],
    };
    const snapshot = PricingService.snapshot(p, result, {
      quoteId: input.quoteId,
      quoteCode: input.quoteCode,
      quote: input.pricingSnapshot,
    });
    const row = await this.reservations.createHold(tx, ctx, {
      roomId: input.roomId,
      channelId: input.channelId,
      arrivalDate: input.arrivalDate,
      departureDate: input.departureDate,
      adults: input.adults,
      children6to11: input.children6to11,
      childrenUnder6: input.childrenUnder6,
      bookerGuestId: input.bookerGuestId,
      closerUserId: input.closerUserId ?? undefined,
      holdHours: input.holdHours,
      quoteId: input.quoteId,
      priced: { result, snapshot },
    });
    return { reservationId: row.id, code: row.code };
  }

  /** DB-only read – shared with ReservationReadPort (ARC-BE-S3-16). */
  stayInfo(tx: Tx, reservationId: string): Promise<StayInfo | null> {
    return readStayInfo(tx, reservationId);
  }

  async reservationView(tx: Tx, reservationId: string): Promise<Record<string, unknown>> {
    const ctx = await this.ctx(tx);
    // SEC H2 (SEC-BE-31): read with the SESSION actor – out of a SAL/CTV scope → 404, never another's data.
    const row = await loadReservation(tx, reservationId, ctx.actor);
    return this.reservations.dtoOf(tx, ctx, row);
  }

  /** DB-only read – shared with ReservationReadPort (ARC-BE-S3-16). */
  ownership(tx: Tx, reservationId: string): Promise<ReservationOwnership | null> {
    return readOwnership(tx, reservationId);
  }

  async lockForDeposit(tx: Tx, reservationId: string): Promise<DepositTarget | null> {
    const ctx = await this.ctx(tx);
    try {
      const r = await loadReservation(tx, reservationId, ctx.actor, { forUpdate: true });
      return {
        id: r.id,
        code: r.code,
        status: r.status,
        version: r.version,
        folioId: r.folio_id ?? '',
        quoteId: r.quote_id,
        createdBy: r.created_by,
        closerUserId: r.closer_user_id,
        holdCreatedAt: r.hold_created_at,
        holdExpiresAt: r.hold_expires_at,
        depositRequiredVnd: r.deposit_required_vnd,
      };
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'NOT_FOUND')
        return null;
      throw err;
    }
  }

  async confirmFromHold(
    tx: Tx,
    reservationId: string,
    actor: { userId: string; requestId?: string },
  ): Promise<ConfirmedStay> {
    const ctx = await this.ctx(tx, actor.requestId);
    const row = await loadReservation(tx, reservationId, ctx.actor, { forUpdate: true });
    if (row.status !== 'hold')
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    return this.reservations.confirmFromHold(tx, ctx, row);
  }
}
