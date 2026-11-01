/**
 * `getPublicPriceEstimate` (OpenAPI 0.3.9-draft, R4 LP-v2 – FB-INV-009; ARC lp-v2-design 2; DOM BR-115/116;
 * SEC lp-v2-privacy-and-api 9.4 SR-PE-01…14) + the estimate stored with a website request (ARC 2.7, SEC SR-PE-06).
 *
 * Public route, after the controller's RAM limits and bulkhead:
 *   Sec-Fetch-Site → 403; property by slug (RAM 60 s) → 404; switches `public_booking_requests_enabled` AND
 *   `public_show_prices` (RAM 60 s, dropped on change) → 404; query (allowlist, no duplicates, ≤ 256 bytes) and
 *   dates (BR-112) → 422; result cache (LRU ≤ 1.000, 60 s, dropped on any parameter change of the property);
 *   miss → the fresh-computation cap (600/hour/property → 503) → READ ONLY transaction (statement_timeout 1 s)
 *   → PublicRatePort (the desk engine, channel direct). A cache hit touches no database.
 * The answer is built field by field (allowlist – SR-PE-01): never `toTotal`, room ids/numbers, OTA prices, the
 * floor, the parity mode or a readable parameter version. A room without a list price is skipped and logged ONCE
 * per room and business day for OWN (SR-PE-12) – the public cannot multiply that warning.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import { ProblemError, problem } from '../../../shared/problem';
import { type LocalDate, addDays, businessDate, localDate, toZonedIso } from '../../../shared/time';
import { CryptoService } from '../../crypto/public/crypto.service';
import { RateLimiter } from '../../identity/public/rate-limiter';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import type { PublicRateEstimate, PublicRateRequest } from '../../reservations/public/public-rate';
import { PublicRatePort } from '../../reservations/public/public-rate.port';
import {
  ESTIMATE_TOKEN_TTL_SECONDS,
  type EstimatePayload,
  issueEstimateToken,
  tokenMatches,
  verifyEstimateToken,
} from './estimate-token';
import { nightsBetween } from './website-request-rules';
import { WebsiteRequestsService } from './website-requests.service';

/** SEC SR-PE-03: query of the route at most this many bytes. */
export const ESTIMATE_MAX_QUERY_BYTES = 256;
/** SR-PE-09 / ARC 2.5: result cache. */
export const ESTIMATE_CACHE_TTL_MS = 60_000;
export const ESTIMATE_CACHE_MAX = 1_000;
/** ARC 2.5: fresh computations (cache misses) per property and hour → 503 beyond. */
export const ESTIMATE_FRESH_RULE = { limit: 600, windowMs: 3_600_000 } as const;
const SWITCH_TTL_MS = 60_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9-]{2,60}$/;
const QUERY_KEYS = new Set([
  'roomType',
  'stayType',
  'arrival',
  'departure',
  'months',
  'adults',
  'children',
  'infants',
]);

export interface EstimateQuery {
  roomType: string;
  stayType: 'short' | 'long';
  arrival: LocalDate;
  departure: LocalDate | null;
  months: number | null;
  adults: number;
  children: number;
  infants: number;
}

export interface ResolvedProperty {
  organizationId: string;
  propertyId: string;
  timezone: string;
}

interface Switches {
  at: number;
  open: boolean;
  rollover: string;
  windowDays: number;
  taxIncluded: boolean;
}

interface Computed {
  at: number;
  computedAt: Date;
  estimate: PublicRateEstimate;
  priceVersion: string;
}

type FieldError = { field: string; code: string };
const invalid = (errors: FieldError[]) => problem('VALIDATION_FAILED', { errors });

/**
 * SR-PE-02/03, contract parameters: allowlist of names, one value each, integers as plain digits. Unknown or
 * repeated parameter, or a query over 256 bytes → 422 (the code never names an internal rule).
 */
export function parseEstimateQuery(rawQuery: string): EstimateQuery {
  if (Buffer.byteLength(rawQuery, 'utf8') > ESTIMATE_MAX_QUERY_BYTES) {
    throw invalid([{ field: 'query', code: 'TOO_LONG' }]);
  }
  const errors: FieldError[] = [];
  const seen = new Map<string, string>();
  for (const [k, v] of new URLSearchParams(rawQuery)) {
    if (!QUERY_KEYS.has(k)) errors.push({ field: k.slice(0, 40), code: 'NOT_ALLOWED' });
    else if (seen.has(k)) errors.push({ field: k, code: 'NOT_ALLOWED' });
    else seen.set(k, v);
  }
  if (errors.length > 0) throw invalid(errors);
  const err = (field: string, code: string) => errors.push({ field, code });
  const int = (k: string, min: number, max: number, dflt: number | null): number => {
    const v = seen.get(k);
    if (v === undefined || v === '') {
      if (dflt === null) err(k, 'REQUIRED');
      return dflt ?? 0;
    }
    if (!/^\d{1,3}$/.test(v) || Number(v) < min || Number(v) > max) {
      err(k, 'VALUE_OUT_OF_RANGE');
      return 0;
    }
    return Number(v);
  };
  const date = (k: string): LocalDate | null => {
    const v = seen.get(k);
    if (v === undefined || v === '') return null;
    if (!DATE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) {
      err(k, 'VALIDATION_FAILED');
      return null;
    }
    return v;
  };
  const roomType = seen.get('roomType') ?? '';
  if (roomType === '') err('roomType', 'REQUIRED');
  else if (!SLUG.test(roomType)) err('roomType', 'VALIDATION_FAILED');
  const stayType = seen.get('stayType') ?? 'short';
  if (stayType !== 'short' && stayType !== 'long') err('stayType', 'NOT_IN_LIST');
  const arrival = date('arrival');
  if (!seen.has('arrival') || seen.get('arrival') === '') err('arrival', 'REQUIRED');
  const departure = date('departure');
  let months: number | null = null;
  if (stayType === 'long') {
    if (seen.has('departure')) err('departure', 'NOT_ALLOWED');
    if (seen.has('months') && seen.get('months') !== '') months = int('months', 1, 24, null);
  } else {
    if (!seen.has('departure') || seen.get('departure') === '') err('departure', 'REQUIRED');
    if (seen.has('months')) err('months', 'NOT_ALLOWED');
  }
  const adults = int('adults', 1, 12, null);
  const children = int('children', 0, 8, 0);
  const infants = int('infants', 0, 8, 0);
  if (errors.length > 0) throw invalid(errors);
  return {
    roomType,
    stayType: stayType as 'short' | 'long',
    arrival: arrival as LocalDate,
    departure: stayType === 'short' ? departure : null,
    months,
    adults,
    children,
    infants,
  };
}

/** BR-112 + the form's date rules (same codes as createWebsiteBookingRequest). */
export function checkEstimateDates(q: EstimateQuery, today: LocalDate, windowDays: number): void {
  const errors: FieldError[] = [];
  if (q.arrival < today) errors.push({ field: 'arrival', code: 'DATE_IN_PAST' });
  else if (q.arrival > addDays(today, windowDays)) {
    errors.push({ field: 'arrival', code: 'OUTSIDE_BOOKING_WINDOW' });
  }
  if (q.departure !== null) {
    if (q.departure <= q.arrival) errors.push({ field: 'departure', code: 'DATE_ORDER' });
    else if (nightsBetween(q.arrival, q.departure) > 366) {
      errors.push({ field: 'departure', code: 'OUTSIDE_BOOKING_WINDOW' });
    }
  }
  if (errors.length > 0) throw invalid(errors);
}

export const requestOf = (q: EstimateQuery): PublicRateRequest => ({
  stayType: q.stayType,
  arrival: q.arrival,
  departure: q.departure,
  months: q.months,
  party: { adults: q.adults, children6to11: q.children, childrenUnder6: q.infants },
});

/**
 * SR-PE-01: the public answer, field by field (OpenAPI PublicPriceEstimate, additionalProperties: false).
 * `toTotalVnd`, `lines`, `priceGapRoomIds` and the status names never leave. A monthly stay never has a number
 * (`monthly_offer` – ESC-043 câu 2).
 */
export function publicEstimateDto(
  q: EstimateQuery,
  c: { estimate: PublicRateEstimate; computedAt: string; taxIncluded: boolean },
  token: { estimateToken: string; expiresAt: string } | null,
): Record<string, unknown> {
  const e = c.estimate;
  const ok = e.status === 'ok';
  const notes: Array<Record<string, unknown>> = [];
  if (e.status === 'min_stay' && e.minNights) {
    notes.push({ code: 'min_stay', minNights: e.minNights });
  }
  if (e.longStayRequired) notes.push({ code: 'long_stay_required' });
  const s = e.shortStay;
  return {
    estimate: true,
    currency: 'VND',
    taxIncluded: c.taxIncluded,
    roomType: q.roomType,
    stayKind: e.stayKind,
    arrival: q.arrival,
    ...(q.departure !== null ? { departure: q.departure } : {}),
    priceAvailable: ok,
    ...(!ok
      ? {
          unavailableReason:
            e.status === 'over_capacity'
              ? 'party_exceeds_room'
              : e.status === 'monthly_offer'
                ? 'monthly_offer'
                : 'on_request',
        }
      : {}),
    ...(ok && e.stayKind === 'short' && s
      ? {
          shortStay: {
            nights: s.nights,
            roomSubtotalVnd: s.roomSubtotalVnd,
            upliftNights: s.upliftNights,
            losDiscountPct: s.losDiscountPct,
            losDiscountVnd: s.losDiscountVnd,
            extraPersonFeeVnd: s.extraPersonFeeVnd,
            totalVnd: s.totalVnd,
            nightlyAvgVnd: s.nightlyAvgVnd,
          },
        }
      : {}),
    notes,
    computedAt: c.computedAt,
    ...(ok && token ? { estimateToken: token.estimateToken, expiresAt: token.expiresAt } : {}),
  };
}

/** What `website_booking_request.price_estimate` stores (jsonb) – `seen` = the Desk record of the contract. */
export interface StoredPriceEstimate {
  v: 1;
  seen: Record<string, unknown>;
  /** Server recomputation inside the request transaction (SEC SR-PE-06; DOM 9 snapshot) – null when it failed. */
  atSubmit: Record<string, unknown> | null;
}

@Injectable()
export class PriceEstimateService {
  private readonly log = new Logger('PublicPriceEstimate');
  private readonly limiter: RateLimiter;
  private readonly switches = new Map<string, Switches>();
  private readonly cache = new Map<string, Computed>();
  private readonly warned = new Set<string>();

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(CryptoService) private readonly crypto: CryptoService,
    @Inject(PublicRatePort) private readonly rates: PublicRatePort,
    @Inject(WebsiteRequestsService) private readonly requests: WebsiteRequestsService,
  ) {
    this.limiter = new RateLimiter(clock);
  }

  /** Any parameter change of the property (setParameter / cancel – ParameterHooks listener) drops its caches. */
  invalidate(propertyId?: string): void {
    if (!propertyId) {
      this.switches.clear();
      this.cache.clear();
      return;
    }
    this.switches.delete(propertyId);
    for (const k of [...this.cache.keys()])
      if (k.startsWith(`${propertyId}|`)) this.cache.delete(k);
  }

  private ctxOf(p: ResolvedProperty): TenantContext {
    return {
      organizationId: p.organizationId,
      propertyId: p.propertyId,
      userId: null,
      actorType: 'system',
    };
  }

  private sign = (message: string) => this.crypto.keyedHash('public_estimate', message);

  private async optional<T>(tx: Tx, key: string, asOf: LocalDate, fallback: T): Promise<T> {
    try {
      return await this.params.get<T>(tx, key, asOf);
    } catch (err) {
      if (err instanceof ParameterMissingError) return fallback;
      throw err;
    }
  }

  /** Switches + business-date inputs of the property, read in one READ ONLY transaction, kept 60 s. */
  private async switchesOf(p: ResolvedProperty): Promise<Switches> {
    const now = this.clock.now().getTime();
    const hit = this.switches.get(p.propertyId);
    if (hit && now - hit.at < SWITCH_TTL_MS && now >= hit.at) return hit;
    const value = await this.db.withContext(
      this.ctxOf(p),
      async (tx) => {
        await tx.query(`SET LOCAL statement_timeout = '1s'`);
        const day = localDate(this.clock.now(), p.timezone);
        const rollover = await this.params.get<string>(tx, 'business_day_rollover', day);
        const today = businessDate(this.clock.now(), p.timezone, rollover);
        const form = await this.optional<boolean>(
          tx,
          'public_booking_requests_enabled',
          today,
          false,
        );
        const prices = await this.optional<boolean>(tx, 'public_show_prices', today, false);
        return {
          at: now,
          open: form === true && prices === true,
          rollover,
          windowDays: Number(await this.params.get<number>(tx, 'booking_window_days', today)),
          taxIncluded:
            (await this.optional<boolean>(tx, 'prices_include_vat', today, true)) !== false,
        };
      },
      { readOnly: true },
    );
    this.switches.set(p.propertyId, value);
    return value;
  }

  private cacheKey(p: ResolvedProperty, today: LocalDate, q: EstimateQuery): string {
    return [
      p.propertyId,
      today,
      q.roomType,
      q.stayType,
      q.arrival,
      q.departure ?? '',
      q.months ?? '',
      q.adults,
      q.children,
      q.infants,
    ].join('|');
  }

  private remember(key: string, value: Computed): void {
    this.cache.delete(key);
    this.cache.set(key, value);
    while (this.cache.size > ESTIMATE_CACHE_MAX) {
      const oldest = this.cache.keys().next().value as string;
      this.cache.delete(oldest);
    }
  }

  /** SR-PE-12: one log line per room and business day, whatever the number of calls. */
  private warnGaps(p: ResolvedProperty, today: LocalDate, roomIds: readonly string[]): void {
    for (const id of roomIds) {
      const k = `${p.propertyId}|${id}|${today}`;
      if (this.warned.has(k)) continue;
      if (this.warned.size > 5_000) this.warned.clear();
      this.warned.add(k);
      this.log.warn(
        `public_price_missing property=${p.propertyId} room=${id} day=${today} – no list price for a night; the room is left out of the website estimate`,
      );
    }
  }

  /** The estimate of a request (shared by the public route and the server recomputation). */
  async compute(
    tx: Tx,
    p: ResolvedProperty,
    today: LocalDate,
    q: EstimateQuery,
  ): Promise<{ estimate: PublicRateEstimate; priceVersion: string; parityMode: string }> {
    const label = (await this.requests.roomTypes(tx)).get(q.roomType);
    // Unknown slug and a type without a sellable room answer the same (on_request – ARC 2.4).
    if (!label) {
      return {
        estimate: {
          status: 'unavailable',
          stayKind:
            q.stayType === 'long' ||
            (q.departure !== null && nightsBetween(q.arrival, q.departure) >= 28)
              ? 'long'
              : 'short',
          priceGapRoomIds: [],
        },
        priceVersion: '0000000000000000',
        parityMode: 'n/a',
      };
    }
    const r = await this.rates.estimate(tx, label, requestOf(q), today);
    if (r.estimate.priceGapRoomIds.length > 0) {
      this.warnGaps(p, today, r.estimate.priceGapRoomIds);
    }
    return r;
  }

  /** GET …/price-estimate after the controller's RAM limits. */
  async publicEstimate(
    p: ResolvedProperty | null,
    rawQuery: string,
  ): Promise<Record<string, unknown>> {
    if (!p) throw problem('NOT_FOUND');
    const sw = await this.switchesOf(p);
    if (!sw.open) throw problem('NOT_FOUND');
    const q = parseEstimateQuery(rawQuery);
    const now = this.clock.now();
    const today = businessDate(now, p.timezone, sw.rollover);
    checkEstimateDates(q, today, sw.windowDays);
    const key = this.cacheKey(p, today, q);
    let c = this.cache.get(key);
    if (!c || now.getTime() - c.at >= ESTIMATE_CACHE_TTL_MS || now.getTime() < c.at) {
      // A fresh computation: property cap (ARC 2.5) → 503, never queued.
      const fresh = `pubest:fresh:${p.propertyId}`;
      const wait = this.limiter.retryAfter(fresh, ESTIMATE_FRESH_RULE);
      if (wait > 0) throw problem('SERVICE_UNAVAILABLE', { headers: { 'Retry-After': '60' } });
      this.limiter.hit(fresh, ESTIMATE_FRESH_RULE);
      let r: Awaited<ReturnType<PriceEstimateService['compute']>>;
      try {
        r = await this.db.withContext(
          this.ctxOf(p),
          async (tx) => {
            await tx.query(`SET LOCAL statement_timeout = '1s'`);
            return this.compute(tx, p, today, q);
          },
          { readOnly: true },
        );
      } catch (err) {
        if (err instanceof ProblemError) throw err;
        // Missing pricing parameter / engine error: the page hides the price, the form still works.
        this.log.warn(`public price estimate failed: ${(err as Error).name}`);
        throw problem('SERVICE_UNAVAILABLE', { headers: { 'Retry-After': '60' } });
      }
      // Whole seconds: the token carries `iat` in seconds and the Desk shows it as the same `computedAt`.
      const computedAt = new Date(Math.floor(now.getTime() / 1000) * 1000);
      c = { at: now.getTime(), computedAt, estimate: r.estimate, priceVersion: r.priceVersion };
      this.remember(key, c);
    }
    const iso = (d: Date) => toZonedIso(d, p.timezone);
    let token: { estimateToken: string; expiresAt: string } | null = null;
    if (c.estimate.status === 'ok') {
      const iat = Math.floor(c.computedAt.getTime() / 1000);
      const exp = iat + ESTIMATE_TOKEN_TTL_SECONDS;
      const s = c.estimate.shortStay;
      const payload: EstimatePayload = {
        rt: q.roomType,
        st: q.stayType,
        a: q.arrival,
        d: q.departure,
        m: q.months,
        ad: q.adults,
        c: q.children,
        i: q.infants,
        ...(s
          ? { tot: s.totalVnd, n: s.nights, los: s.losDiscountPct, xp: s.extraPersonFeeVnd }
          : {}),
        pv: c.priceVersion,
        iat,
        exp,
      };
      token = {
        estimateToken: issueEstimateToken(this.sign, p.propertyId, payload),
        expiresAt: iso(new Date(exp * 1000)),
      };
    }
    return publicEstimateDto(
      q,
      { estimate: c.estimate, computedAt: iso(c.computedAt), taxIncluded: sw.taxIncluded },
      token,
    );
  }

  /**
   * createWebsiteBookingRequest (0.3.9 (b)): `priceEstimateToken` given → signature, expiry, property and every input
   * of the request must match; then the server recomputes the estimate in the request transaction (SEC SR-PE-06) and
   * stores both. Not verified → nothing stored, flag `offer_unverified`. Never refuses the request.
   */
  async forRequest(
    tx: Tx,
    p: ResolvedProperty,
    pc: { now: Date; today: LocalDate; iso(d: Date): string },
    token: unknown,
    r: Omit<EstimateQuery, 'roomType'> & { roomType: string | null },
  ): Promise<{ stored: StoredPriceEstimate | null; unverified: boolean }> {
    if (token === undefined || token === null) return { stored: null, unverified: false };
    const check = verifyEstimateToken(this.sign, p.propertyId, token, pc.now);
    if (!check.ok || !tokenMatches(check.payload, r)) return { stored: null, unverified: true };
    const t = check.payload;
    const nights = r.departure ? nightsBetween(r.arrival, r.departure) : null;
    const stayKind = r.stayType === 'long' || (nights !== null && nights >= 28) ? 'long' : 'short';
    const seen: Record<string, unknown> = {
      roomType: t.rt,
      stayKind,
      arrival: t.a,
      departure: t.d,
      months: t.m,
      adults: t.ad,
      children: t.c,
      infants: t.i,
      nights: t.n ?? null,
      totalVnd: t.tot ?? null,
      losDiscountPct: t.los ?? null,
      extraPersonFeeVnd: t.xp ?? null,
      currency: 'VND',
      computedAt: pc.iso(new Date(t.iat * 1000)),
      priceVersion: t.pv,
    };
    let atSubmit: Record<string, unknown> | null = null;
    try {
      await tx.query('SAVEPOINT price_estimate');
      const x = await this.compute(tx, p, pc.today, { ...r, roomType: t.rt });
      await tx.query('RELEASE SAVEPOINT price_estimate');
      const s = x.estimate.shortStay;
      atSubmit = {
        status: x.estimate.status,
        stayKind: x.estimate.stayKind,
        ...(s
          ? {
              nights: s.nights,
              fromTotalVnd: s.totalVnd,
              toTotalVnd: s.toTotalVnd,
              roomSubtotalVnd: s.roomSubtotalVnd,
              losDiscountPct: s.losDiscountPct,
              losDiscountVnd: s.losDiscountVnd,
              extraPersonFeeVnd: s.extraPersonFeeVnd,
              lines: s.lines,
            }
          : {}),
        ...(x.estimate.minNights ? { minNights: x.estimate.minNights } : {}),
        parityMode: x.parityMode,
        priceVersion: x.priceVersion,
        computedAt: pc.iso(pc.now),
      };
    } catch {
      // The request never fails because of the estimate: keep what the guest saw (signed), no recomputation.
      await tx.query('ROLLBACK TO SAVEPOINT price_estimate').catch(() => undefined);
      atSubmit = null;
    }
    return { stored: { v: 1, seen, atSubmit }, unverified: false };
  }
}
