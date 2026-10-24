/**
 * Public side of US-155 (OpenAPI getPublicFormToken, createWebsiteBookingRequest; ADR-014 4.3–4.6; SEC ARC-02…23,
 * C-2, C-3; BR-911…914) – BE-D, R3 Sprint 1. The form is OFF until OWN sets `public_booking_requests_enabled`
 * (US-155 AC4): every public call then answers 404 like an unknown property.
 *
 * Order of `createWebsiteBookingRequest` (contract "Thứ tự kiểm"; steps 0–1 in the controller):
 *  B. property by slug (SECURITY DEFINER `public_resolve_property`) – unknown → 404;
 *  C. IP counters in their OWN transaction (they count even when the request is refused – ARC-13);
 *  D. one business transaction: Idempotency-Key (principal `public_site` + property) – completed → replay; switch
 *     off → 404; schema → 422; honeypot → identical 202 (nothing stored but the key); form token + one-time nonce
 *     → 422 FORM_TOKEN_INVALID; tầng 2 PoW switch on → 422 POW_INVALID (contract-ahead: no challenge issued yet);
 *     IP over limit → 429; text normalisation + business checks → 422; contact over 3/day → identical 202 (the
 *     newest request of that contact gets `duplicateCount + 1`, `repeat_contact`, the returned code as alias);
 *     property daily cap → 503 SITE_BUSY (one OWN notification per day, the key is released); INSERT + WR0 history
 *     + possible duplicates + notification `website_request_new` (FDL, FD, SAL – no name/phone) + SSE.
 * Nothing about existing guests, leads, bookings or availability is read before answering (ADR-014 4.3).
 * C2 never goes to logs: errors carry `field` + `code` only.
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx, pgCode } from '../../../db/database';
import { requestHash } from '../../../shared/http/unit-of-work';
import { ProblemError, problem } from '../../../shared/problem';
import { type LocalDate, type LocalTime, addDays, atLocal, localDate } from '../../../shared/time';
import { CryptoService } from '../../crypto/public/crypto.service';
import { EventsService } from '../../events/public/events.service';
import { normalizeEmail, normalizePhone } from '../../guests/public/normalize';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { issueFormToken, verifyFormToken, FORM_TOKEN_MIN_DELAY_SECONDS } from './form-token';
import { PUBLIC_SITE_OPTIONS, type PublicSiteOptions } from './public-site.options';
import {
  addMonths,
  containsUrl,
  deskHoursOf,
  hasUnexpectedScript,
  hmacHex,
  ipBuckets,
  looksLikeCard,
  looksLikeIdNumber,
  newRefCode,
  nightsBetween,
  normalizeFreeText,
  replyPlan,
  slugOf,
  subSourceOf,
} from './website-request-rules';
import { WebsiteRequestsService } from './website-requests.service';

/** SR-RL-11 DB limits (security constants – SEC section 5). */
export const PUBLIC_LIMITS = {
  ipPerHour: 5,
  ipPerDay: 20,
  range48PerDay: 40,
  contactPerDay: 3,
} as const;

/** Long stay from 28 nights (BR-108); window and max nights of a short stay come from BR-112 parameters. */
const LONG_STAY_NIGHTS = 28;
const FAR_FUTURE_DAYS = 180;

export interface ResolvedProperty {
  organizationId: string;
  propertyId: string;
  timezone: string;
}

export interface PublicResult {
  status: number;
  body: unknown;
  replayed: boolean;
}

const fe = (field: string, code: string) =>
  problem('VALIDATION_FAILED', { errors: [{ field, code }] });

const ALLOWED_KEYS = new Set([
  'formToken',
  'website',
  'stayType',
  'arrival',
  'departure',
  'months',
  'adults',
  'children',
  'infants',
  'roomType',
  'guestName',
  'phone',
  'email',
  'preferredChannel',
  'note',
  'locale',
  'consent',
  'consentVersion',
  'utm',
  'refHost',
  'landingPath',
  'pow',
  'offerSnapshot',
]);
const CHANNELS = ['zalo', 'whatsapp', 'telegram', 'viber', 'phone', 'email'];
const LOCALES = ['vi', 'en', 'ru'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isInt = (v: unknown) => typeof v === 'number' && Number.isInteger(v);

interface ParsedInput {
  formToken: string;
  honeypot: boolean;
  stayKind: 'short' | 'long';
  arrival: LocalDate;
  departure: LocalDate | null;
  months: number | null;
  adults: number;
  children: number;
  infants: number;
  roomType: string | null;
  guestName: string;
  phoneE164: string | null;
  email: string | null;
  channel: string;
  note: string | null;
  locale: string;
  consentVersion: string;
  utm: { source?: string; medium?: string; campaign?: string };
  refHost: string | null;
  landingPath: string | null;
  pow: unknown;
}

@Injectable()
export class PublicBookingService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(PUBLIC_SITE_OPTIONS) private readonly options: PublicSiteOptions,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(CryptoService) private readonly crypto: CryptoService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(WebsiteRequestsService) private readonly requests: WebsiteRequestsService,
  ) {}

  private readonly resolveCache = new Map<string, { at: number; value: ResolvedProperty | null }>();

  /** `public_resolve_property` (cached 60 s – contract step 3). */
  async resolve(slug: string): Promise<ResolvedProperty | null> {
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) return null;
    const hit = this.resolveCache.get(slug);
    const now = this.clock.now().getTime();
    if (hit && now - hit.at < 60_000 && now >= hit.at) return hit.value;
    const value = await this.db.entry(async (tx) => {
      const { rows } = await tx.query<{
        organization_id: string;
        property_id: string;
        timezone: string;
      }>('SELECT organization_id, property_id, timezone FROM public_resolve_property($1)', [slug]);
      const r = rows[0];
      return r
        ? { organizationId: r.organization_id, propertyId: r.property_id, timezone: r.timezone }
        : null;
    });
    this.resolveCache.set(slug, { at: now, value });
    return value;
  }

  /** Called by the parameter hook when the switch changes (cache "xóa khi đổi tham số"). */
  clearCache(): void {
    this.resolveCache.clear();
  }

  private ctxOf(p: ResolvedProperty): TenantContext {
    return {
      organizationId: p.organizationId,
      propertyId: p.propertyId,
      userId: null,
      actorType: 'system',
    };
  }

  private async enabled(tx: Tx): Promise<boolean> {
    const pc = await this.property.now(tx);
    return (
      (await this.params.get<boolean>(tx, 'public_booking_requests_enabled', pc.today)) === true
    );
  }

  /** True when the server can issue/verify form tokens (PUBLIC_FORM_NOT_READY check – SEC ARC-17). */
  get signingReady(): boolean {
    return !!this.options.signingKey;
  }

  // ───────────────────────── getPublicFormToken ─────────────────────────

  async formToken(slug: string): Promise<Record<string, unknown>> {
    const p = await this.resolve(slug);
    if (!p || !this.options.signingKey) throw problem('NOT_FOUND');
    return this.db.withContext(
      this.ctxOf(p),
      async (tx) => {
        if (!(await this.enabled(tx))) throw problem('NOT_FOUND');
        const pc = await this.property.now(tx);
        const t = issueFormToken(this.options.signingKey as string, p.propertyId, pc.now);
        return {
          token: t.token,
          notBefore: pc.iso(t.notBefore),
          expiresAt: pc.iso(t.expiresAt),
          minDelaySeconds: FORM_TOKEN_MIN_DELAY_SECONDS,
        };
      },
      { readOnly: true },
    );
  }

  // ───────────────────────── createWebsiteBookingRequest ─────────────────────────

  async create(input: {
    slug: string;
    ip: string;
    idempotencyKey: string;
    method: string;
    path: string;
    body: unknown;
  }): Promise<PublicResult> {
    const p = await this.resolve(input.slug);
    if (!p) throw problem('NOT_FOUND');
    const ip = this.ipKeys(input.ip);
    // C. IP counters in their own short transaction – committed even when the request is refused.
    const ipOver = await this.db.withContext(this.ctxOf(p), (tx) => this.countIp(tx, ip));
    const hash = requestHash(input.method, input.path, input.body ?? null);
    let failure: ProblemError | null = null;
    const out = await this.db.withContext(
      this.ctxOf(p),
      async (tx) => {
        await tx.query(`SET LOCAL statement_timeout = '2s'`);
        const replay = await this.claimKey(tx, p, input.idempotencyKey, {
          method: input.method,
          path: input.path,
          hash,
        });
        if (replay) return { ...replay, replayed: true };
        if (!(await this.enabled(tx))) throw problem('NOT_FOUND');
        const pc = await this.property.now(tx);
        const body = this.parse(input.body);
        const promise = async (arrival: LocalDate, channel: string) =>
          replyPlan(
            pc.now,
            pc.timezone,
            arrival,
            pc.today,
            channel,
            await this.replyParams(tx, pc.today),
          );
        const accepted = async (refCode: string, arrival: LocalDate, channel: string) => {
          const plan = await promise(arrival, channel);
          const res = { status: 202, body: { refCode, promise: plan.promise } };
          await this.completeKey(tx, p, input.idempotencyKey, res);
          return { ...res, replayed: false };
        };
        // 5. Honeypot: identical 202, nothing stored but the key (ARC-15).
        if (body.honeypot) {
          const arrival = DATE.test(String((input.body as Record<string, unknown>).arrival))
            ? (String((input.body as Record<string, unknown>).arrival) as LocalDate)
            : pc.today;
          return accepted(newRefCode(), arrival, body.channel);
        }
        // 6. Form token: signature, property, window, one time.
        const key = this.options.signingKey;
        const check = key ? verifyFormToken(key, p.propertyId, body.formToken, pc.now) : null;
        if (!check || !check.ok) throw problem('FORM_TOKEN_INVALID');
        const nonce = await tx.query(
          `INSERT INTO public_form_nonce (nonce_hash, property_id, used_at, expires_at)
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING nonce_hash`,
          [check.nonceHash, p.propertyId, pc.now, check.expiresAt],
        );
        if ((nonce.rowCount ?? 0) === 0) throw problem('FORM_TOKEN_INVALID');
        // 7. Tầng 2 (contract-ahead): when switched on, no challenge is issued yet → every request refused.
        if (
          (await this.params.get<boolean>(tx, 'public_booking_request_pow_enabled', pc.today)) ===
          true
        ) {
          throw fe('pow', 'POW_INVALID');
        }
        // 8. IP limits (counted in C).
        if (ipOver) {
          throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(ipOver) } });
        }
        // 9. Business checks.
        await this.validate(tx, body, pc.today);
        // 10. Contact limit – silent (ARC-04, ARC-15).
        const contactHmac = this.crypto.keyedHash(
          'web_request_contact',
          body.phoneE164 ? `phone:${body.phoneE164}` : `email:${body.email}`,
        );
        const dayStart = localDate(pc.now, pc.timezone);
        const contactCount = await this.bump(tx, `webreq:contact:${contactHmac}`, dayStart);
        if (contactCount > PUBLIC_LIMITS.contactPerDay) {
          const ref = newRefCode();
          const { rows: latest } = await tx.query<{ id: string }>(
            `SELECT id FROM website_booking_request WHERE contact_hmac = $1 ORDER BY created_at DESC LIMIT 1
               FOR UPDATE`,
            [contactHmac],
          );
          if (latest[0]) {
            await tx.query(
              `UPDATE website_booking_request
                  SET duplicate_count = duplicate_count + 1, last_duplicate_at = $2,
                      suspicious_flags = CASE WHEN 'repeat_contact' = ANY(suspicious_flags) THEN suspicious_flags
                                              ELSE array_append(suspicious_flags, 'repeat_contact') END,
                      alias_ref_codes = CASE WHEN cardinality(alias_ref_codes) >= 5 THEN alias_ref_codes
                                             ELSE array_append(alias_ref_codes, $3) END,
                      updated_at = $2, version = version + 1
                WHERE id = $1`,
              [latest[0].id, pc.now, ref],
            );
          }
          return accepted(ref, body.arrival, body.channel);
        }
        // 11. Property daily cap → 503 SITE_BUSY, one OWN notification per day (commit, key released).
        const cap = await this.params.get<number>(tx, 'public_booking_request_daily_cap', pc.today);
        const n = await this.bump(tx, `webreq:property:${p.propertyId}:day`, dayStart);
        if (n > cap) {
          const first = await this.bump(tx, `webreq:capnotice:${p.propertyId}`, dayStart);
          if (first === 1) {
            await this.events.notify(
              tx,
              {
                kind: 'website_request_cap_reached',
                roles: ['owner'],
                refType: 'property',
                refId: p.propertyId,
              },
              pc.now,
            );
          }
          const tomorrow = atLocal(addDays(dayStart, 1), '00:00', pc.timezone);
          failure = problem('SITE_BUSY', {
            headers: {
              'Retry-After': String(
                Math.max(60, Math.ceil((tomorrow.getTime() - pc.now.getTime()) / 1000)),
              ),
            },
          });
          await tx.query(
            `DELETE FROM idempotency_key WHERE principal_type = 'public_site' AND principal_id = $1 AND key = $2`,
            [p.propertyId, input.idempotencyKey],
          );
          return null;
        }
        // 12. Insert.
        const ref = await this.store(tx, p, body, contactHmac, ip.hostHmac, pc);
        return accepted(ref.refCode, body.arrival, body.channel);
      },
      { lockTimeoutMs: 2_000 },
    );
    if (failure) throw failure;
    return out as PublicResult;
  }

  private ipKeys(ip: string): { hostHmac: string; range48Hmac: string | null } {
    const b = ipBuckets(ip);
    const key = this.options.ipHmacKey;
    return {
      hostHmac: hmacHex(key, `ip:${b.host}`),
      range48Hmac: b.range48 ? hmacHex(key, `ip48:${b.range48}`) : null,
    };
  }

  /** Returns the Retry-After seconds when one IP limit is exceeded (after counting), else 0. */
  private async countIp(
    tx: Tx,
    ip: { hostHmac: string; range48Hmac: string | null },
  ): Promise<number> {
    const now = this.clock.now();
    const hourStart = new Date(Math.floor(now.getTime() / 3600_000) * 3600_000);
    const dayStart = new Date(Math.floor(now.getTime() / 86_400_000) * 86_400_000);
    const hour = await this.bumpAt(tx, `webreq:ip:${ip.hostHmac}:h`, hourStart, 3600_000);
    const day = await this.bumpAt(tx, `webreq:ip:${ip.hostHmac}:d`, dayStart, 86_400_000);
    const r48 = ip.range48Hmac
      ? await this.bumpAt(tx, `webreq:ip48:${ip.range48Hmac}:d`, dayStart, 86_400_000)
      : 0;
    if (hour > PUBLIC_LIMITS.ipPerHour) {
      return Math.max(1, Math.ceil((hourStart.getTime() + 3600_000 - now.getTime()) / 1000));
    }
    if (day > PUBLIC_LIMITS.ipPerDay || r48 > PUBLIC_LIMITS.range48PerDay) {
      return Math.max(1, Math.ceil((dayStart.getTime() + 86_400_000 - now.getTime()) / 1000));
    }
    return 0;
  }

  private async bumpAt(tx: Tx, bucket: string, start: Date, windowMs: number): Promise<number> {
    const { rows } = await tx.query<{ count: number }>(
      `INSERT INTO rate_limit_counter (bucket_key, window_start, count, expires_at) VALUES ($1, $2, 1, $3)
       ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = rate_limit_counter.count + 1
       RETURNING count`,
      [bucket, start, new Date(start.getTime() + windowMs)],
    );
    return Number(rows[0]?.count ?? 0);
  }

  /** Counter of a local day of the property (contact, daily cap). */
  private bump(tx: Tx, bucket: string, day: LocalDate): Promise<number> {
    const start = new Date(`${day}T00:00:00Z`);
    return this.bumpAt(tx, bucket, start, 2 * 86_400_000);
  }

  private async replyParams(tx: Tx, today: LocalDate) {
    const g = <T>(k: string) => this.params.get<T>(tx, k, today);
    return {
      hours: deskHoursOf(await g<unknown>('front_desk_hours')),
      responseMinutes: Number(await g<number>('web_request_response_minutes')),
      sameDayAfterHoursMinutes: Number(await g<number>('web_request_same_day_after_hours_minutes')),
      promiseMinutes: Number(await g<number>('web_request_public_promise_minutes')),
      promiseNextMorningBy: (await g<string>(
        'web_request_public_promise_next_morning_by',
      )) as LocalTime,
      promiseCallNowMinutes: Number(await g<number>('web_request_public_promise_call_now_minutes')),
    };
  }

  // ───────────────────────── input ─────────────────────────

  /** Schema of WebsiteBookingRequestInput (additionalProperties: false) → 422 with field codes only. */
  private parse(raw: unknown): ParsedInput {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw problem('VALIDATION_FAILED');
    }
    const b = raw as Record<string, unknown>;
    const errors: Array<{ field: string; code: string }> = [];
    const err = (field: string, code: string) => errors.push({ field, code });
    for (const k of Object.keys(b)) if (!ALLOWED_KEYS.has(k)) err(k, 'NOT_ALLOWED');
    const str = (k: string, max: number, min = 0) => {
      const v = b[k];
      if (v === undefined || v === null) return null;
      if (typeof v !== 'string') {
        err(k, 'VALIDATION_FAILED');
        return null;
      }
      if (v.length > max || v.length < min) err(k, v.length > max ? 'TOO_LONG' : 'REQUIRED');
      return v;
    };
    const honeypot = (str('website', 200) ?? '') !== '';
    const formToken = str('formToken', 300, 20) ?? '';
    if (!b.formToken) err('formToken', 'REQUIRED');
    const stayType = b.stayType ?? 'short';
    if (stayType !== 'short' && stayType !== 'long') err('stayType', 'NOT_IN_LIST');
    const arrival = b.arrival;
    if (arrival === undefined) err('arrival', 'REQUIRED');
    else if (
      typeof arrival !== 'string' ||
      !DATE.test(arrival) ||
      Number.isNaN(Date.parse(arrival))
    )
      err('arrival', 'VALIDATION_FAILED');
    const departure = b.departure;
    if (stayType === 'short') {
      if (departure === undefined || departure === null) err('departure', 'REQUIRED');
      else if (typeof departure !== 'string' || !DATE.test(departure))
        err('departure', 'VALIDATION_FAILED');
      if (b.months !== undefined && b.months !== null) err('months', 'NOT_ALLOWED');
    } else {
      if (departure !== undefined && departure !== null) err('departure', 'NOT_ALLOWED');
      if (
        b.months !== undefined &&
        b.months !== null &&
        (!isInt(b.months) || (b.months as number) < 1 || (b.months as number) > 24)
      ) {
        err('months', 'VALUE_OUT_OF_RANGE');
      }
    }
    const int = (k: string, min: number, max: number, dflt: number | null) => {
      const v = b[k];
      if (v === undefined || v === null) {
        if (dflt === null) err(k, 'REQUIRED');
        return dflt ?? 0;
      }
      if (!isInt(v) || (v as number) < min || (v as number) > max) err(k, 'VALUE_OUT_OF_RANGE');
      return v as number;
    };
    const adults = int('adults', 1, 12, null);
    const children = int('children', 0, 8, 0);
    const infants = int('infants', 0, 8, 0);
    const roomType = str('roomType', 60);
    if (roomType !== null && !/^[a-z0-9-]{2,60}$/.test(roomType))
      err('roomType', 'VALIDATION_FAILED');
    const channel = b.preferredChannel;
    if (channel === undefined) err('preferredChannel', 'REQUIRED');
    else if (typeof channel !== 'string' || !CHANNELS.includes(channel))
      err('preferredChannel', 'NOT_IN_LIST');
    const locale = b.locale;
    if (locale === undefined) err('locale', 'REQUIRED');
    else if (typeof locale !== 'string' || !LOCALES.includes(locale)) err('locale', 'NOT_IN_LIST');
    if (b.consent !== true) err('consent', 'CONSENT_REQUIRED');
    const consentVersion = str('consentVersion', 20);
    if (!consentVersion) err('consentVersion', 'REQUIRED');
    else if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}(\.[0-9]{1,2})?$/.test(consentVersion))
      err('consentVersion', 'NOTICE_VERSION_INVALID');
    // Free text: normalised BEFORE the length checks (ARC-21).
    const rawName = b.guestName;
    let guestName = '';
    if (rawName === undefined || rawName === null) err('guestName', 'REQUIRED');
    else if (typeof rawName !== 'string') err('guestName', 'VALIDATION_FAILED');
    else {
      guestName = normalizeFreeText(rawName).replace(/\s+/g, ' ');
      if (guestName.length < 1) err('guestName', 'REQUIRED');
      else if (guestName.length > 80) err('guestName', 'TOO_LONG');
      else if (looksLikeCard(guestName)) err('guestName', 'CARD_NUMBER_DETECTED');
      else if (looksLikeIdNumber(guestName)) err('guestName', 'ID_NUMBER_DETECTED');
    }
    let note: string | null = null;
    if (b.note !== undefined && b.note !== null) {
      if (typeof b.note !== 'string') err('note', 'VALIDATION_FAILED');
      else {
        note = normalizeFreeText(b.note);
        if (note.length > 500) err('note', 'TOO_LONG');
        else if (looksLikeCard(note)) err('note', 'CARD_NUMBER_DETECTED');
        else if (looksLikeIdNumber(note)) err('note', 'ID_NUMBER_DETECTED');
        if (note === '') note = null;
      }
    }
    // One way of contact by channel (ARC-14).
    let phoneE164: string | null = null;
    let email: string | null = null;
    const hasPhone = b.phone !== undefined && b.phone !== null && b.phone !== '';
    const hasEmail = b.email !== undefined && b.email !== null && b.email !== '';
    if (channel === 'email') {
      if (hasPhone) err('phone', 'NOT_ALLOWED');
      if (!hasEmail) err('email', 'REQUIRED');
      else if (typeof b.email !== 'string' || b.email.length > 254) err('email', 'EMAIL_INVALID');
      else {
        email = normalizeEmail(b.email);
        if (!email) err('email', 'EMAIL_INVALID');
      }
    } else if (typeof channel === 'string') {
      if (hasEmail) err('email', 'NOT_ALLOWED');
      if (!hasPhone) err('phone', 'REQUIRED');
      else if (typeof b.phone !== 'string' || b.phone.length < 6 || b.phone.length > 32)
        err('phone', 'PHONE_INVALID');
      else {
        const ph = normalizePhone(b.phone);
        if (ph.ok) phoneE164 = ph.e164;
        else err('phone', ph.code);
      }
    }
    const utmRaw = b.utm;
    const utm: ParsedInput['utm'] = {};
    if (utmRaw !== undefined && utmRaw !== null) {
      if (typeof utmRaw !== 'object' || Array.isArray(utmRaw)) err('utm', 'VALIDATION_FAILED');
      else
        for (const [k, v] of Object.entries(utmRaw as Record<string, unknown>)) {
          if (!['source', 'medium', 'campaign'].includes(k)) err(`utm.${k}`, 'NOT_ALLOWED');
          else if (typeof v !== 'string' || !/^[a-z0-9._-]{1,64}$/.test(v))
            err(`utm.${k}`, 'VALIDATION_FAILED');
          else utm[k as 'source'] = v;
        }
    }
    const refHost = str('refHost', 100);
    if (refHost !== null && !/^[a-z0-9.-]{1,100}$/.test(refHost))
      err('refHost', 'VALIDATION_FAILED');
    const landingPath = str('landingPath', 200);
    if (landingPath !== null && !/^\/[a-z0-9/_-]{0,199}$/.test(landingPath))
      err('landingPath', 'VALIDATION_FAILED');
    if (b.pow !== undefined && (typeof b.pow !== 'string' || b.pow.length > 2000))
      err('pow', 'VALIDATION_FAILED');
    // Contract order: the schema (step 4) is checked before the honeypot (step 5).
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
    return {
      formToken,
      honeypot,
      stayKind: stayType as 'short' | 'long',
      arrival: arrival as LocalDate,
      departure: stayType === 'short' ? (departure as LocalDate) : null,
      months: stayType === 'long' && isInt(b.months) ? (b.months as number) : null,
      adults,
      children,
      infants,
      roomType,
      guestName,
      phoneE164,
      email,
      channel: channel as string,
      note,
      locale: locale as string,
      consentVersion: consentVersion as string,
      utm,
      refHost,
      landingPath,
      pow: b.pow,
    };
  }

  /** Dates (BR-112, BR-108), notice version (C-3 – the current one, or the previous one 7 days after). */
  private async validate(tx: Tx, b: ParsedInput, today: LocalDate): Promise<void> {
    const errors: Array<{ field: string; code: string }> = [];
    const windowDays = Number(await this.params.get<number>(tx, 'booking_window_days', today));
    if (b.arrival < today) errors.push({ field: 'arrival', code: 'DATE_IN_PAST' });
    else if (b.arrival > addDays(today, windowDays))
      errors.push({ field: 'arrival', code: 'OUTSIDE_BOOKING_WINDOW' });
    if (b.departure !== null) {
      if (b.departure <= b.arrival) errors.push({ field: 'departure', code: 'DATE_ORDER' });
      else if (nightsBetween(b.arrival, b.departure) > 366)
        errors.push({ field: 'departure', code: 'OUTSIDE_BOOKING_WINDOW' });
    }
    const { rows } = await tx.query<{ ok: boolean }>(
      `SELECT (superseded_at IS NULL OR superseded_at > $4::timestamptz - interval '7 days') AS ok
         FROM privacy_notice_version WHERE organization_id = $1 AND version = $2 AND locale = $3`,
      [tx.ctx.organizationId, b.consentVersion, b.locale, this.clock.now()],
    );
    if (!rows[0]?.ok) errors.push({ field: 'consentVersion', code: 'NOTICE_VERSION_INVALID' });
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
  }

  // ───────────────────────── insert (WR0) ─────────────────────────

  private async store(
    tx: Tx,
    p: ResolvedProperty,
    b: ParsedInput,
    contactHmac: string,
    ipHmac: string,
    pc: { now: Date; today: LocalDate; timezone: string },
  ): Promise<{ id: string; refCode: string }> {
    const departure =
      b.stayKind === 'long' ? (b.months ? addMonths(b.arrival, b.months) : null) : b.departure;
    const stayKind =
      b.stayKind === 'long' ||
      (departure !== null && nightsBetween(b.arrival, departure) >= LONG_STAY_NIGHTS)
        ? 'long'
        : 'short';
    const flags: string[] = [];
    const text = `${b.guestName}\n${b.note ?? ''}`;
    if (containsUrl(text)) flags.push('contains_url');
    if (hasUnexpectedScript(text)) flags.push('unexpected_script');
    if (b.arrival > addDays(pc.today, FAR_FUTURE_DAYS)) flags.push('far_future');
    if (b.roomType) {
      const types = await this.requests.roomTypes(tx);
      if (!types.has(b.roomType)) flags.push('room_type_unmatched');
    }
    const ownHost = this.options.landingOrigin
      ? new URL(this.options.landingOrigin).hostname
      : null;
    const sub = subSourceOf(b.utm, b.refHost ?? undefined, ownHost);
    const plan = replyPlan(
      pc.now,
      pc.timezone,
      b.arrival,
      pc.today,
      b.channel,
      await this.replyParams(tx, pc.today),
    );
    // Possible duplicates (NÊN – DOM Q-W10, BR-914 (3)): same contact, still open, dates overlap or ≤ N hours apart.
    const windowHours = Number(
      await this.params.get<number>(tx, 'web_request_duplicate_window_hours', pc.today),
    );
    const { rows: dup } = await tx.query<{ id: string }>(
      `SELECT id FROM website_booking_request
        WHERE contact_hmac = $1 AND status IN ('new', 'in_progress')
          AND (created_at >= $2::timestamptz - make_interval(hours => $3::int)
               OR daterange(arrival_date, COALESCE(departure_date, arrival_date + 1))
                  && daterange($4::date, COALESCE($5::date, $4::date + 1)))
        ORDER BY created_at LIMIT 10 FOR UPDATE`,
      [contactHmac, pc.now, windowHours, b.arrival, departure],
    );
    if (dup.length > 0) flags.push('possible_duplicate');
    const id = uuidv7();
    let refCode = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      refCode = newRefCode();
      try {
        await tx.query('SAVEPOINT ref_code');
        await tx.query(
          `INSERT INTO website_booking_request (id, organization_id, property_id, ref_code, status, arrival_date,
             departure_date, stay_kind, stay_months, adults, children, infants, room_type_slug, locale,
             preferred_channel, guest_name, phone_e164, email, note, contact_hmac, related_request_ids,
             consent_version, consent_at, utm_source, utm_medium, utm_campaign, ref_host, landing_path, sub_source,
             suspicious_flags, ip_hmac, reply_by, last_activity_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'new', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
             $20::uuid[], $21, $22, $23, $24, $25, $26, $27, $28, $29::text[], decode($30, 'hex'), $31, $22, $22,
             $22)`,
          [
            id,
            p.organizationId,
            p.propertyId,
            refCode,
            b.arrival,
            departure,
            stayKind,
            b.months,
            b.adults,
            b.children,
            b.infants,
            b.roomType,
            b.locale,
            b.channel,
            b.guestName,
            b.phoneE164,
            b.email,
            b.note,
            contactHmac,
            dup.map((d) => d.id),
            b.consentVersion,
            pc.now,
            b.utm.source ?? null,
            b.utm.medium ?? null,
            b.utm.campaign ?? null,
            b.refHost,
            b.landingPath,
            sub,
            flags,
            ipHmac,
            plan.replyBy,
          ],
        );
        await tx.query('RELEASE SAVEPOINT ref_code');
        break;
      } catch (e) {
        await tx.query('ROLLBACK TO SAVEPOINT ref_code');
        if (pgCode(e) !== '23505' || attempt === 4) throw e;
      }
    }
    for (const d of dup) {
      await tx.query(
        `UPDATE website_booking_request
            SET related_request_ids = CASE WHEN $2 = ANY(related_request_ids) THEN related_request_ids
                                           ELSE array_append(related_request_ids, $2::uuid) END,
                suspicious_flags = CASE WHEN 'possible_duplicate' = ANY(suspicious_flags) THEN suspicious_flags
                                        ELSE array_append(suspicious_flags, 'possible_duplicate') END,
                updated_at = $3, version = version + 1
          WHERE id = $1`,
        [d.id, id, pc.now],
      );
    }
    await this.requests.history(
      tx,
      id,
      null,
      'new',
      'submit_website_request',
      pc.now,
      'guest',
      null,
    );
    await this.events.notify(
      tx,
      {
        kind: 'website_request_new',
        roles: ['front_desk_lead', 'front_desk', 'sales_staff'],
        refType: 'website_booking_request',
        refId: id,
        refCode,
      },
      pc.now,
    );
    const row = await this.requests.rowById(tx, id);
    if (row) await this.requests.publish(tx, null, row);
    return { id, refCode };
  }

  // ───────────────────────── idempotency (principal public_site – erd 4.12) ─────────────────────────

  private async claimKey(
    tx: Tx,
    p: ResolvedProperty,
    key: string,
    req: { method: string; path: string; hash: string },
  ): Promise<{ status: number; body: unknown } | null> {
    let inserted: boolean;
    try {
      const r = await tx.query(
        `INSERT INTO idempotency_key (principal_type, principal_id, key, organization_id, method, path,
           request_hash, state)
         VALUES ('public_site', $1, $2, $3, $4, $5, $6, 'in_progress')
         ON CONFLICT DO NOTHING RETURNING key`,
        [p.propertyId, key, p.organizationId, req.method, req.path, req.hash],
      );
      inserted = (r.rowCount ?? 0) === 1;
    } catch (err) {
      if (pgCode(err) === '55P03') throw problem('IDEMPOTENCY_IN_PROGRESS');
      throw err;
    }
    if (inserted) return null;
    const { rows } = await tx.query<{
      method: string;
      path: string;
      request_hash: string;
      state: string;
      response_status: number | null;
      response_body: unknown;
    }>(
      `SELECT method, path, request_hash, state, response_status, response_body FROM idempotency_key
        WHERE principal_type = 'public_site' AND principal_id = $1 AND key = $2`,
      [p.propertyId, key],
    );
    const row = rows[0];
    if (!row) throw problem('IDEMPOTENCY_IN_PROGRESS');
    if (row.method !== req.method || row.path !== req.path || row.request_hash !== req.hash) {
      throw problem('IDEMPOTENCY_KEY_REUSED');
    }
    if (row.state !== 'completed' || row.response_status === null) {
      throw problem('IDEMPOTENCY_IN_PROGRESS');
    }
    return { status: row.response_status, body: row.response_body };
  }

  private async completeKey(
    tx: Tx,
    p: ResolvedProperty,
    key: string,
    res: { status: number; body: unknown },
  ): Promise<void> {
    // Only refCode + promise are stored (no C2 – ARC-15).
    await tx.query(
      `UPDATE idempotency_key SET state = 'completed', response_status = $3, response_body = $4
        WHERE principal_type = 'public_site' AND principal_id = $1 AND key = $2`,
      [p.propertyId, key, res.status, JSON.stringify(res.body)],
    );
  }

  /** The OWN check when the switch goes ON (SEC ARC-17, C-3 (e)) – what is missing, or []. */
  async readiness(tx: Tx): Promise<string[]> {
    const missing: string[] = [];
    if (!this.options.signingKey) missing.push('form_signing_key');
    const { rows } = await tx.query<{ locale: string }>(
      `SELECT DISTINCT locale FROM privacy_notice_version
        WHERE organization_id = $1 AND superseded_at IS NULL`,
      [tx.ctx.organizationId],
    );
    const have = new Set(rows.map((r) => r.locale));
    for (const l of ['vi', 'en']) if (!have.has(l)) missing.push(`privacy_notice_version.${l}`);
    return missing;
  }

  /** Slug of a room type label – exported for tests. */
  static slug = slugOf;
}
