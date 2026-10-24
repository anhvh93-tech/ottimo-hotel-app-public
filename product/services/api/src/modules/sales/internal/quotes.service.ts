/**
 * Quotes – SM-08 (US-080…084, US-087): saveQuote (Q1), listQuotes, getQuote, getQuoteText, withdrawQuote (Q5),
 * createHoldFromQuote (Q2 + B1 through the reservations port).
 * - Validity (BR-304): last valid day = creation day (property calendar) + quote_validity_days; expired from
 *   00:00 the day after. Q3 has no job in R2: an `active` quote past expiresAt is SHOWN and TREATED as
 *   `expired` everywhere (lazy expiry).
 * - Snapshot (BR-006): prices, parameters and the calculation are stored on save; hold and text read the
 *   snapshot, never today's parameters.
 * - Scope M: SAL/CTV only reach quotes they created or close (404 otherwise, US-087 AC2).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { QuoteStatus } from '../../../db/schema/sales';
import { QUOTE_COPY } from '../../../generated/quote-copy';
import { type PageInfo, decodeCursor, page } from '../../../shared/http/pagination';
import { problem } from '../../../shared/problem';
import {
  type LocalDate,
  addDays,
  atLocal,
  localDate,
  toZonedIso,
  zonedParts,
} from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { type ApprovalRow, ApprovalService } from '../../approvals/public/approval.service';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { countedPersons, holdDeadline } from '../../reservations/public/pricing';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import {
  WEBSITE_REQUEST_PORT,
  type WebsiteRequestPortContract,
} from '../../public-site/public/website-request.port';
import { LeadsService } from '../public/leads.service';
import {
  type Caller,
  type QuoteCalculation,
  type QuoteInput,
  QuotePricingService,
  isOwnScope,
} from './quote-pricing';

export interface QuoteRow {
  id: string;
  code: string;
  type: 'short' | 'long';
  status: QuoteStatus;
  lead_id: string | null;
  guest_id: string;
  room_id: string | null;
  room_group_id: string | null;
  channel_id: string;
  closer_user_id: string | null;
  arrival_date: string;
  nights: number | null;
  adults: number;
  children_bands: { children6to11?: number; childrenUnder6?: number };
  pricing_snapshot: Record<string, unknown> & { calc: QuoteCalculation };
  total_vnd: number;
  deposit_vnd: number;
  created_at: Date;
  created_by: string | null;
  expires_at: Date;
  converted_reservation_id: string | null;
  /** US-155 (0086): the website request this quote answers. */
  website_booking_request_id?: string | null;
  version: number;
}

const COLUMNS = `q.id, q.code, q.type, q.status, q.lead_id, q.guest_id, q.room_id, q.room_group_id, q.channel_id,
  q.closer_user_id, q.arrival_date::text AS arrival_date, q.nights, q.adults, q.children_bands, q.pricing_snapshot,
  q.total_vnd, q.deposit_vnd, q.created_at, q.created_by, q.expires_at, q.converted_reservation_id, q.version,
  q.website_booking_request_id`;

export type Locale = 'vi' | 'en' | 'ru';

/** "active but past expiresAt" is expired (lazy Q3). */
export function effectiveStatus(
  row: Pick<QuoteRow, 'status' | 'expires_at'>,
  now: Date,
): QuoteStatus {
  return row.status === 'active' && row.expires_at.getTime() <= now.getTime()
    ? 'expired'
    : row.status;
}

/** BR-304: expired from 00:00 of (creation day + validity + 1) in the property calendar. */
export function quoteExpiry(createdAt: Date, validityDays: number, tz: string): Date {
  return atLocal(addDays(localDate(createdAt, tz), validityDays + 1), '00:00', tz);
}

function money(v: number, locale: Locale): string {
  const n = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(v);
  return locale === 'vi' ? `${n} đ` : `${n} VND`;
}

function dmy(date: LocalDate): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-z_]+)\}/g, (m, k: string) => values[k] ?? m);
}

@Injectable()
export class QuotesService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(DocNumberService) private readonly docNumbers: DocNumberService,
    @Inject(QuotePricingService) private readonly pricing: QuotePricingService,
    @Inject(LeadsService) private readonly leads: LeadsService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
    // US-155 (BE-D R3 S1): website booking requests – WR1 at save, WR6 at hold (public-site module).
    @Optional()
    @Inject(WEBSITE_REQUEST_PORT)
    private readonly websiteRequests?: WebsiteRequestPortContract,
  ) {}

  dto(row: QuoteRow, tz: string, now: Date): Record<string, unknown> {
    return {
      ...row.pricing_snapshot.calc,
      id: row.id,
      code: row.code,
      status: effectiveStatus(row, now),
      guestId: row.guest_id,
      ...(row.lead_id ? { leadId: row.lead_id } : {}),
      ...(row.room_id ? { roomId: row.room_id } : {}),
      arrivalDate: row.arrival_date,
      createdAt: toZonedIso(row.created_at, tz),
      expiresAt: toZonedIso(row.expires_at, tz),
      ...(row.converted_reservation_id
        ? { convertedReservationId: row.converted_reservation_id }
        : {}),
      ...(row.website_booking_request_id
        ? { websiteBookingRequestId: row.website_booking_request_id }
        : {}),
      version: row.version,
    };
  }

  async save(
    tx: Tx,
    c: Caller,
    input: QuoteInput & {
      guestId: string;
      leadId?: string | undefined;
      websiteBookingRequestId?: string | undefined;
    },
    requestId?: string,
  ): Promise<Record<string, unknown>> {
    await this.leads.assertGuestInScope(tx, c, input.guestId);
    if (input.leadId) await this.leads.assertLeadForQuote(tx, c, input.leadId, input.guestId);
    const result = await this.pricing.calculate(tx, c, input);
    const webRequest = input.websiteBookingRequestId ?? null;
    if (webRequest) {
      // 0.3.7 bổ sung 2: only a `direct` quote answers a website request (422 NOT_ALLOWED).
      if (result.snapshot.channelGroup !== 'direct') {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'websiteBookingRequestId', code: 'NOT_ALLOWED' }],
        });
      }
      if (!this.websiteRequests) throw problem('NOT_FOUND');
    }
    const { timezone: tz, now, today } = await this.property.now(tx);
    const validity = await this.params.get<number>(tx, 'quote_validity_days', today);
    const leadId = input.leadId ?? (await this.leads.openLeadFor(tx, c.userId, input.guestId));
    const code = await this.docNumbers.allocate(tx, 'quote');
    const id = uuidv7();
    const expiresAt = quoteExpiry(now, validity, tz);
    const commissionVnd = result.calc.commission?.amountVnd ?? null;
    await tx.query(
      `INSERT INTO quote (id, organization_id, property_id, code, type, status, lead_id, guest_id, room_id,
         room_group_id, channel_id, closer_user_id, arrival_date, nights, adults, children_bands,
         guest_category, pricing_snapshot, total_vnd, deposit_vnd, commission_vnd, ottimo_remaining_vnd,
         started_at, expires_at, created_at, created_by, updated_at, website_booking_request_id)
       VALUES ($1, $2, $3, $4, 'short', 'active', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
         $18, $19, $20, $21, $22, $21, $23, $21, $24)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        leadId,
        input.guestId,
        result.roomId,
        result.roomGroupId,
        input.channelId,
        result.closerUserId,
        input.arrivalDate,
        result.calc.nights,
        input.adults,
        JSON.stringify({
          children6to11: input.children6to11 ?? 0,
          childrenUnder6: input.childrenUnder6 ?? 0,
        }),
        input.guestCategory ?? null,
        JSON.stringify({
          ...result.snapshot,
          closerUserId: result.closerUserId,
          payeeType: result.payeeType,
          commissionRatePct: result.commissionRatePct,
          departureDate: result.departureDate,
          extraPersonPerNightVnd: result.extraPersonPerNightVnd,
          extraGuestCount: result.extraGuestCount,
        }),
        result.calc.totalVnd,
        result.calc.depositVnd,
        commissionVnd,
        result.calc.ottimoRemainingVnd,
        now,
        expiresAt,
        c.userId,
        webRequest,
      ],
    );
    if (webRequest && this.websiteRequests) {
      // Scope (SAL: unassigned or own → else 404), state (declined/spam/converted → 409), WR1 when `new`.
      await this.websiteRequests.attachQuote(tx, {
        requestId: webRequest,
        quoteId: id,
        actor: { userId: c.userId, roles: c.roles },
        now,
      });
    }
    await this.leads.onQuoteSaved(tx, leadId);
    await this.audit.record(tx, {
      category: 'state',
      action: 'quote.saved',
      entityType: 'quote',
      entityId: id,
      entityCode: code,
      after: {
        status: 'active',
        totalVnd: result.calc.totalVnd,
        depositVnd: result.calc.depositVnd,
        nights: result.calc.nights,
      },
      ...(requestId ? { requestId } : {}),
    });
    return this.dto((await this.row(tx, c, id)) as QuoteRow, tz, now);
  }

  async row(tx: Tx, c: Caller, id: string, forUpdate = false): Promise<QuoteRow | null> {
    const own = isOwnScope(c) ? c.userId : null;
    const { rows } = await tx.query<QuoteRow>(
      `SELECT ${COLUMNS} FROM quote q
        WHERE q.id = $1 AND ($2::uuid IS NULL OR q.created_by = $2 OR q.closer_user_id = $2)
        ${forUpdate ? 'FOR UPDATE' : ''}`,
      [id, own],
    );
    return rows[0] ?? null;
  }

  async get(tx: Tx, c: Caller, id: string): Promise<Record<string, unknown>> {
    const row = await this.row(tx, c, id);
    if (!row) throw problem('NOT_FOUND');
    const { timezone, now } = await this.property.now(tx);
    return this.dto(row, timezone, now);
  }

  async list(
    tx: Tx,
    c: Caller,
    q: { status?: QuoteStatus | undefined; cursor?: string | undefined; limit: number },
  ): Promise<{ data: Record<string, unknown>[]; page: PageInfo }> {
    const { timezone, now } = await this.property.now(tx);
    const cur = decodeCursor(q.cursor, 1);
    const own = isOwnScope(c) ? c.userId : null;
    // Lazy expiry in SQL too: `active` = still valid, `expired` = expired or active past expiresAt.
    const { rows } = await tx.query<QuoteRow>(
      `SELECT ${COLUMNS} FROM quote q
        WHERE ($1::uuid IS NULL OR q.created_by = $1 OR q.closer_user_id = $1)
          AND ($2::uuid IS NULL OR q.id < $2)
          AND ($3::text IS NULL
               OR ($3 = 'active' AND q.status = 'active' AND q.expires_at > $4)
               OR ($3 = 'expired' AND (q.status = 'expired' OR (q.status = 'active' AND q.expires_at <= $4)))
               OR ($3 IN ('converted', 'withdrawn') AND q.status = $3))
        ORDER BY q.id DESC LIMIT $5`,
      [own, cur ? String(cur[0]) : null, q.status ?? null, now, q.limit + 1],
    );
    const p = page(rows, q.limit, (r) => [r.id]);
    return { data: p.data.map((r) => this.dto(r, timezone, now)), page: p.page };
  }

  async text(
    tx: Tx,
    c: Caller,
    id: string,
    locale: Locale,
  ): Promise<{ locale: Locale; text: string }> {
    const row = await this.row(tx, c, id);
    if (!row) throw problem('NOT_FOUND');
    const { timezone } = await this.property.now(tx);
    const copy = QUOTE_COPY[locale];
    const s = row.pricing_snapshot as Record<string, unknown> & { calc: QuoteCalculation };
    const calc = s.calc;
    const bands = row.children_bands ?? {};
    const guests = [`${row.adults} ${copy['occ.adults_short']}`];
    if (bands.children6to11) guests.push(`${bands.children6to11} ${copy['occ.children_short']}`);
    if (bands.childrenUnder6) guests.push(`${bands.childrenUnder6} ${copy['occ.under6_short']}`);
    const roomTotal = Number(s.roomTotalVnd ?? calc.totalVnd);
    const expires = zonedParts(new Date(row.expires_at.getTime() - 60_000), timezone);
    const pad = (n: number) => String(n).padStart(2, '0');
    let text = fill(copy['sale.quote_text'], {
      code: row.code,
      room: String(s.roomNo ?? ''),
      room_name: String(s.roomName ?? '').trim(),
      from: dmy(row.arrival_date),
      to: dmy(String(s.departureDate ?? row.arrival_date)),
      nights: String(calc.nights),
      guests: guests.join(', '),
      room_total: money(roomTotal, locale),
      discount_note: calc.losDiscountPct > 0 ? ` (−${calc.losDiscountPct}%)` : '',
      deposit: money(calc.depositVnd, locale),
      // Last valid minute (BR-304 "23:59 18/10").
      expires: `${pad(expires.hour)}:${pad(expires.minute)} ${pad(expires.day)}/${pad(expires.month)}/${expires.year}`,
    }).replace(/ {2,}/g, ' ');
    const extraGuests = Number(s.extraGuestCount ?? 0);
    const extraVnd = calc.totalVnd - roomTotal;
    if (extraGuests > 0 && extraVnd > 0) {
      text += `\n${fill(copy['sale.quote_text_extra_guest'], { n: String(extraGuests), amount: money(extraVnd, locale) })}`;
    }
    return { locale, text };
  }

  /**
   * extendQuote – Q4 (US-083 AC3, BR-304, OpenAPI 0.3.5 A-18). Only an expired quote (lazy expiry counts).
   * OWN/MGR → 200, new expiresAt as on save (BR-304-01) from today, prices kept (BR-006).
   * SAL/CTV (own) → 202 + approval `quote_extension` (A51 = D, reason required); an open request of the
   * same quote is returned instead of a second one; the approver's decision runs Q4 (onExtensionDecided).
   */
  async extend(
    tx: Tx,
    c: Caller,
    id: string,
    version: number,
    reason: string | null,
    requestId?: string,
  ): Promise<{ status: 200; body: Record<string, unknown> } | { status: 202; body: ApprovalRow }> {
    const row = await this.row(tx, c, id, true);
    if (!row) throw problem('NOT_FOUND');
    if (row.version !== version) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: row.version } });
    }
    const { timezone, now } = await this.property.now(tx);
    const status = effectiveStatus(row, now);
    if (status !== 'expired') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: status } });
    }
    if (isOwnScope(c)) {
      if (!reason) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'reason', code: 'REASON_REQUIRED' }],
        });
      }
      const open = await this.approvals.pendingFor(tx, 'quote', row.id);
      const existing = open.find((a) => a.type === 'quote_extension');
      if (existing) return { status: 202, body: existing };
      const req = await this.approvals.submit(tx, c, {
        type: 'quote_extension',
        amountVnd: 0,
        reasonCode: 'other',
        reasonNote: reason,
        targetType: 'quote',
        targetId: row.id,
        targetCode: row.code,
        ...(requestId ? { requestId } : {}),
      });
      return { status: 202, body: req };
    }
    await this.applyExtension(tx, row, now, timezone, reason, requestId);
    return { status: 200, body: this.dto((await this.row(tx, c, id)) as QuoteRow, timezone, now) };
  }

  /**
   * BUG-R2-198 (ARC 16.19 bổ sung 4) – preLock of `quote_extension`: the quote its onDecided may extend, locked
   * BEFORE the request row on every decision path (approve, reject, cancel, autoCancel). The quote paths (Q2
   * create-hold, Q3 withdraw, Q4 extend) take the quote first too, so no path holds the request then waits for
   * the quote. The hook touches nothing else (no booking, no folio – a converted quote is not extended).
   */
  async lockForExtensionDecision(tx: Tx, approvalId: string): Promise<void> {
    const { rows } = await tx.query<{ target_id: string | null }>(
      `SELECT target_id FROM approval_request
        WHERE id = $1 AND type = 'quote_extension' AND target_type = 'quote'`,
      [approvalId],
    );
    const quoteId = rows[0]?.target_id;
    if (quoteId) await tx.query('SELECT id FROM quote WHERE id = $1 FOR UPDATE', [quoteId]);
  }

  /** SM-10 hook for `quote_extension`: approved → Q4 on the quote (if still expired). */
  async onExtensionDecided(tx: Tx, request: ApprovalRow): Promise<void> {
    if (request.status !== 'approved' || request.target_type !== 'quote' || !request.target_id)
      return;
    const { rows } = await tx.query<QuoteRow>(
      `SELECT ${COLUMNS} FROM quote q WHERE q.id = $1 FOR UPDATE`,
      [request.target_id],
    );
    const row = rows[0];
    if (!row) return;
    const { timezone, now } = await this.property.now(tx);
    if (effectiveStatus(row, now) !== 'expired') return;
    await this.applyExtension(tx, row, now, timezone, request.reason_note, undefined);
  }

  private async applyExtension(
    tx: Tx,
    row: QuoteRow,
    now: Date,
    tz: string,
    reason: string | null,
    requestId: string | undefined,
  ): Promise<void> {
    const validity = await this.params.get<number>(tx, 'quote_validity_days', localDate(now, tz));
    const expiresAt = quoteExpiry(now, validity, tz);
    await tx.query(
      `UPDATE quote SET status = 'active', expires_at = $2, updated_at = $3, version = version + 1
        WHERE id = $1`,
      [row.id, expiresAt, now],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'quote.extended',
      entityType: 'quote',
      entityId: row.id,
      entityCode: row.code,
      before: { status: 'expired', expiresAt: toZonedIso(row.expires_at, tz) },
      after: { status: 'active', expiresAt: toZonedIso(expiresAt, tz) },
      ...(reason ? { reason } : {}),
      ...(requestId ? { requestId } : {}),
    });
  }

  async withdraw(
    tx: Tx,
    c: Caller,
    id: string,
    requestId?: string,
  ): Promise<Record<string, unknown>> {
    const row = await this.row(tx, c, id, true);
    if (!row) throw problem('NOT_FOUND');
    const { timezone, now } = await this.property.now(tx);
    const status = effectiveStatus(row, now);
    if (status !== 'active' && status !== 'expired') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: status } });
    }
    await tx.query(
      `UPDATE quote SET status = 'withdrawn', withdrawn_at = $2, updated_at = $2, version = version + 1
        WHERE id = $1`,
      [id, now],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'quote.withdrawn',
      entityType: 'quote',
      entityId: id,
      entityCode: row.code,
      before: { status },
      after: { status: 'withdrawn' },
      ...(requestId ? { requestId } : {}),
    });
    return this.dto((await this.row(tx, c, id)) as QuoteRow, timezone, now);
  }

  /** The Reservation JSON of a hold for the caller (replay of an id-only idempotent answer – US-155). */
  async reservationView(tx: Tx, reservationId: string): Promise<Record<string, unknown>> {
    if (!this.reservations)
      throw problem('INTERNAL_ERROR', { detail: 'reservations module not wired' });
    return this.reservations.reservationView(tx, reservationId);
  }

  /** Q2 + B1 (US-084): hold on the quote's room with the quote's snapshot prices. */
  async createHold(
    tx: Tx,
    c: Caller,
    id: string,
    input: { holdHours: number; depositMethod: 'vietqr' | 'bank_transfer' | 'cash' },
    requestId?: string,
  ): Promise<Record<string, unknown>> {
    const port = this.reservations;
    if (!port) throw problem('INTERNAL_ERROR', { detail: 'reservations module not wired' });
    const row = await this.row(tx, c, id, true);
    if (!row) throw problem('NOT_FOUND');
    const { timezone: tz, now, today } = await this.property.now(tx);
    const status = effectiveStatus(row, now);
    if (status === 'expired') {
      throw problem('QUOTE_EXPIRED', { extras: { expiredAt: toZonedIso(row.expires_at, tz) } });
    }
    if (status !== 'active') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: status } });
    }
    if (row.type !== 'short' || !row.room_id || row.nights === null) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'REQUIRED' }] });
    }
    const options = await this.params.get<number[]>(tx, 'hold_hours_options', today);
    if (!Array.isArray(options) || !options.includes(input.holdHours)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'holdHours', code: 'NOT_IN_LIST' }] });
    }
    if (row.arrival_date < today) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'arrivalDate', code: 'DATE_IN_PAST' }],
      });
    }
    const latest = await this.params.get<string>(tx, 'hold_latest_time_on_arrival', today);
    const deadline = holdDeadline(now, input.holdHours, row.arrival_date, today, latest, tz);
    if (!deadline.allowed) throw problem('HOLD_NOT_ALLOWED_TODAY');
    const { rows: guest } = await tx.query<{ phone_e164: string | null }>(
      'SELECT phone_e164 FROM guest WHERE id = $1',
      [row.guest_id],
    );
    if (!guest[0]?.phone_e164) {
      throw problem('PHONE_REQUIRED', { errors: [{ field: 'guestId', code: 'PHONE_REQUIRED' }] });
    }
    const { rows: room } = await tx.query<{ max_occupancy: number }>(
      'SELECT max_occupancy FROM room WHERE id = $1',
      [row.room_id],
    );
    const bands = row.children_bands ?? {};
    const party = {
      adults: row.adults,
      children6to11: bands.children6to11 ?? 0,
      childrenUnder6: bands.childrenUnder6 ?? 0,
    };
    if (!room[0] || countedPersons(party) > room[0].max_occupancy) {
      throw problem('CAPACITY_EXCEEDED', {
        errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED' }],
      });
    }

    const s = row.pricing_snapshot as Record<string, unknown> & { calc: QuoteCalculation };
    const departureDate = String(s.departureDate ?? addDays(row.arrival_date, row.nights));
    // US-155 AC2 / BR-112 (a): a quote answering a website request makes a `website` hold with its sub-source.
    const web =
      row.website_booking_request_id && this.websiteRequests
        ? await this.websiteRequests.linkInfo(tx, row.website_booking_request_id)
        : null;
    const created = await port.createHoldFromQuote(tx, {
      quoteId: row.id,
      quoteCode: row.code,
      roomId: row.room_id,
      channelId: row.channel_id,
      arrivalDate: row.arrival_date,
      departureDate,
      ...party,
      bookerGuestId: row.guest_id,
      closerUserId: row.closer_user_id,
      holdHours: input.holdHours,
      holdCreatedAt: now,
      holdExpiresAt: deadline.expiresAt,
      nightlyRates: s.calc.nightlyRates,
      extraPersonPerNightVnd: Number(s.extraPersonPerNightVnd ?? 0),
      extraGuestCount: Number(s.extraGuestCount ?? 0),
      totalRoomVnd: Number(s.roomTotalVnd ?? s.calc.totalVnd),
      depositRequiredVnd: s.calc.depositVnd,
      depositMethod: input.depositMethod,
      pricingSnapshot: { ...s, quoteId: row.id, quoteCode: row.code },
      createdBy: c.userId,
      ...(requestId ? { requestId } : {}),
      ...(web ? { website: { subSource: web.subSource } } : {}),
    });
    if (web && this.websiteRequests) {
      // WR6 in this transaction (FD+ or the holder; otherwise the holder is told – SEC ARC-19 (3)).
      await this.websiteRequests.markConverted(tx, {
        requestId: web.requestId,
        reservationId: created.reservationId,
        actor: { userId: c.userId, roles: c.roles },
        now,
      });
    }
    await tx.query(
      `UPDATE quote SET status = 'converted', converted_reservation_id = $2, updated_at = $3,
          version = version + 1
        WHERE id = $1`,
      [row.id, created.reservationId, now],
    );
    if (row.lead_id) await this.leads.onHoldCreated(tx, row.lead_id);
    await this.audit.record(tx, {
      category: 'state',
      action: 'quote.converted',
      entityType: 'quote',
      entityId: row.id,
      entityCode: row.code,
      before: { status: 'active' },
      after: { status: 'converted', reservationCode: created.code },
      ...(requestId ? { requestId } : {}),
    });
    return port.reservationView(tx, created.reservationId);
  }
}
