/**
 * Guest link + online check-in level 1 (US-106, US-107, US-112; EP06 8; SEC s3-checklist G, ĐK-1…6).
 *
 * - Link (Desk): 256-bit CSPRNG token, only SHA-256 stored, returned once; re-issue/revoke revokes every
 *   token AND session of the booking (SR-GST-01/04). Valid until departure checkout time +
 *   guest_link_grace_hours (SR-GST-05/11).
 * - Session: level 1 only in R2 (ĐK-1) – no OTP, no folio, no door code; JSON never contains
 *   guestFullName/doorCode (ĐK-2, also removed by the serializer via x-guest-level).
 * - OnlineCheckin JSON has exactly the allowed keys (ĐK-2); uploaded images are write-only (ĐK-3).
 * - P02b consent from guest-web: person 1 only, channel guest_app (ĐK-5).
 * - SR-RL-05: update + complete ≤ 20 writes/day/booking, ≤ 30 uploaded files/booking.
 */
import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { sha256Hex } from '../../../shared/http/auth.guard';
import type { GuestPrincipal } from '../../../shared/http/guest-session';
import { type FieldError, problem } from '../../../shared/problem';
import { type LocalDate, atLocal, businessDate, localDate, toZonedIso } from '../../../shared/time';
import { containsCardNumber } from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';
import { fileRejected, type NormalizedImage } from '../../files/public/image-pipeline';
import { ParameterService } from '../../platform/public/parameter.service';
import { setEta } from '../../reservations/public/stay-view';
import {
  RegistrationService,
  SYSTEM_ACTOR,
  type StayView,
  readStay,
} from '../../registration/public/registration.service';

/** SR-RL-05 (technical security constants). */
export const GUEST_WRITES_PER_DAY = 20;
export const GUEST_FILES_PER_BOOKING = 30;
const MAX_IMAGES_PER_PERSON = 4;
const LOCALES = ['vi', 'en', 'ru'] as const;
type Locale = (typeof LOCALES)[number];
const STEPS = ['notice', 'documents', 'eta', 'consent'] as const;
type Step = (typeof STEPS)[number] | 'done';
const ORDER: readonly Step[] = ['notice', 'documents', 'eta', 'consent', 'done'];
/** Locales with a privacy notice approved by UXD + SEC (content-guide HR-01). */
const APPROVED_NOTICE_LOCALES: readonly string[] = ['vi', 'en'];

/** SEC E14-08 / A-31: map links only to these exact hosts, https only. */
export function safeMapUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    if (
      ['maps.google.com', 'maps.app.goo.gl', 'maps.apple.com', 'www.openstreetmap.org'].includes(
        u.hostname,
      )
    ) {
      return u.toString();
    }
    if (u.hostname === 'www.google.com' && u.pathname.startsWith('/maps')) return u.toString();
    return null;
  } catch {
    return null;
  }
}

interface OciRow {
  id: string;
  current_step: Step;
  eta_time: string | null;
  late_arrival: boolean;
  deferred_people: number[];
  notice_version: string | null;
  notice_accepted_at: Date | null;
  completed_at: Date | null;
  write_count: number;
  write_count_date: string | null;
}

export interface IssuedLink {
  url: string;
  expiresAt: string;
}

@Injectable()
export class GuestPortalService {
  constructor(
    @Inject(RegistrationService) private readonly regs: RegistrationService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  private async tz(tx: Tx): Promise<{ tz: string; today: LocalDate; now: Date }> {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = rows[0]?.timezone ?? 'Asia/Ho_Chi_Minh';
    const now = this.clock.now();
    return { tz, now, today: localDate(now, tz) };
  }

  // ───────────────────────── Desk: link ─────────────────────────

  async issueLink(
    tx: Tx,
    actor: { userId: string; requestId: string },
    reservationId: string,
    guestBaseUrl: string,
  ): Promise<IssuedLink> {
    const stay = await readStay(tx, reservationId, SYSTEM_ACTOR);
    if (!stay) throw problem('NOT_FOUND');
    // EP06 8.2 [GIẢ ĐỊNH BA]: links from `confirmed` (also in-house guests); never hold/cancelled/no-show/out.
    if (stay.status !== 'confirmed' && stay.status !== 'in_house') {
      throw problem('INVALID_TRANSITION');
    }
    const c = await this.tz(tx);
    await this.revokeAll(tx, reservationId, 'reissued');
    const checkout = await this.params.get<string>(tx, 'checkout_time', c.today);
    const grace = await this.params.get<number>(tx, 'guest_link_grace_hours', c.today);
    const expiresAt = new Date(
      atLocal(stay.departureDate, checkout, c.tz).getTime() + grace * 3_600_000,
    );
    const token = randomBytes(32).toString('base64url'); // 256 bits (SR-GST-01)
    const id = uuidv7();
    await tx.query(
      `INSERT INTO guest_access_token (id, organization_id, property_id, reservation_id, token_hash, created_at,
         created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        reservationId,
        sha256Hex(token),
        c.now,
        actor.userId,
        expiresAt,
      ],
    );
    await this.audit.record(tx, {
      category: 'security',
      action: 'guest_link.issued',
      entityType: 'guest_access_token',
      entityId: id,
      entityCode: stay.code,
      requestId: actor.requestId,
    });
    await this.regs.registrationOfReservation(tx, reservationId);
    return {
      url: `${guestBaseUrl.replace(/\/+$/, '')}/g/${token}`,
      expiresAt: toZonedIso(expiresAt, c.tz),
    };
  }

  async bookingVisible(tx: Tx, reservationId: string): Promise<boolean> {
    return (await readStay(tx, reservationId, SYSTEM_ACTOR)) !== null;
  }

  /** SR-GST-04 / B-13: every token and session of the booking, same transaction. Returns tokens revoked. */
  async revokeAll(
    tx: Tx,
    reservationId: string,
    reason: 'reissued' | 'revoked' | 'cancelled' | 'no_show' | 'relocated',
  ): Promise<number> {
    const now = this.clock.now();
    const r = await tx.query(
      `UPDATE guest_access_token SET revoked_at = $2, revoked_reason = $3
        WHERE reservation_id = $1 AND revoked_at IS NULL`,
      [reservationId, now, reason],
    );
    await tx.query(
      `UPDATE guest_session SET revoked_at = $2 WHERE reservation_id = $1 AND revoked_at IS NULL`,
      [reservationId, now],
    );
    return r.rowCount ?? 0;
  }

  // ───────────────────────── Guest: session ─────────────────────────

  /**
   * openGuestSession – the token row was resolved by guest_resolve_token (no context); `tx` runs in the
   * booking's property with actor `guest`. Returns the cookie value (only its hash is stored).
   */
  async openSession(
    tx: Tx,
    token: { id: string; reservationId: string; expiresAt: Date },
    acceptLanguage: string | undefined,
  ): Promise<{ sid: string; expiresAt: Date; body: Record<string, unknown> }> {
    const stay = await readStay(tx, token.reservationId, SYSTEM_ACTOR);
    if (!stay || stay.status === 'cancelled' || stay.status === 'no_show') {
      throw problem('GUEST_LINK_INVALID');
    }
    const c = await this.tz(tx);
    const locale = pickLocale(stay.preferredLocale, acceptLanguage);
    const sid = randomBytes(32).toString('base64url');
    const id = uuidv7();
    await tx.query(
      `INSERT INTO guest_session (id, organization_id, property_id, sid_hash, token_id, reservation_id, level,
         locale, created_at, last_active_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $8, $9)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        sha256Hex(sid),
        token.id,
        token.reservationId,
        locale,
        c.now,
        token.expiresAt,
      ],
    );
    await this.audit.record(tx, {
      category: 'security',
      action: 'guest_session.opened',
      entityType: 'guest_access_token',
      entityId: token.id,
      entityCode: stay.code,
    });
    return {
      sid,
      expiresAt: token.expiresAt,
      body: {
        // ĐK-1: level 1 only, no e-mail OTP, no level-2 expiry.
        level: 1,
        reservationCode: stay.code,
        stayEnded: stay.status === 'checked_out',
        verification: { emailOtpAvailable: false, locked: false },
        // SEC BE-51 (6): after checkout the page only says thank you – no name, no room.
        ...(stay.status === 'checked_out'
          ? {}
          : { guestFirstName: stay.bookerFirstName, roomNo: stay.roomNo }),
        locale,
        expiresAt: toZonedIso(token.expiresAt, c.tz),
        level2ExpiresAt: null,
      },
    };
  }

  private async activeStay(tx: Tx, g: GuestPrincipal): Promise<StayView> {
    const stay = await readStay(tx, g.reservationId, SYSTEM_ACTOR);
    if (!stay || stay.status === 'cancelled' || stay.status === 'no_show') {
      throw problem('GUEST_LINK_INVALID');
    }
    // SR-GST-11: after checkout only the "thank you" page (no operation with x-after-checkout: blocked).
    if (stay.status === 'checked_out') throw problem('GUEST_STAY_ENDED');
    return stay;
  }

  async stay(tx: Tx, g: GuestPrincipal): Promise<Record<string, unknown>> {
    const stay = await this.activeStay(tx, g);
    const c = await this.tz(tx);
    const { rows } = await tx.query<{
      name: string;
      address: string | null;
      map_url: string | null;
      phone_public: string | null;
      house_rules_i18n: Record<string, unknown> | null;
      wifi_info_i18n: Record<string, unknown> | null;
    }>(
      `SELECT name, address, map_url, phone_public, house_rules_i18n, wifi_info_i18n FROM property WHERE id = $1`,
      [tx.ctx.propertyId],
    );
    const p = rows[0];
    const checkinTime = await this.params.get<string>(tx, 'checkin_time', c.today);
    const checkoutTime = await this.params.get<string>(tx, 'checkout_time', c.today);
    const rules = p?.house_rules_i18n ?? null;
    const houseRules = rules ? (rules[g.locale] ?? rules.vi) : undefined;
    const map = safeMapUrl(p?.map_url ?? null);
    return {
      reservationCode: stay.code,
      status: stay.status,
      stayType: stay.stayType,
      roomNo: stay.roomNo,
      arrivalDate: stay.arrivalDate,
      departureDate: stay.departureDate,
      checkinTime,
      checkoutTime,
      property: {
        ...(p?.name ? { name: p.name } : {}),
        ...(p?.address ? { address: p.address } : {}),
        ...(map ? { mapUrl: map } : {}),
        ...(p?.phone_public ? { phone: p.phone_public } : {}),
      },
      ...(typeof houseRules === 'string' ? { houseRules } : {}),
      // US-108 AC2: Wi-Fi only from the arrival date. Never guestFullName / doorCode at level 1 (ĐK-2).
      wifi: c.today >= stay.arrivalDate ? wifiOf(p?.wifi_info_i18n ?? null, g.locale) : null,
      onlineCheckinAvailable: await this.available(tx, stay),
    };
  }

  async setLocale(tx: Tx, g: GuestPrincipal, locale: string): Promise<void> {
    if (!(LOCALES as readonly string[]).includes(locale)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'locale', code: 'NOT_IN_LIST' }] });
    }
    await tx.query('UPDATE guest_session SET locale = $2, last_active_at = $3 WHERE id = $1', [
      g.sessionId,
      locale,
      this.clock.now(),
    ]);
  }

  // ───────────────────────── Guest: online check-in ─────────────────────────

  /** EP06 8.4: closed once the desk entered documents (≥ partial), the guest is in-house, or not confirmed. */
  private async available(tx: Tx, stay: StayView): Promise<boolean> {
    if (stay.status !== 'confirmed') return false;
    // Read-only (no K1 record created on a GET – ARC FB-S3-27 (6)); no record yet = nothing entered.
    const { registration: reg } = await this.regs.guestProgress(tx, stay.reservationId);
    return !reg || reg.status === 'none' || reg.status === 'pre';
  }

  private async row(tx: Tx, reservationId: string, lock = false): Promise<OciRow | null> {
    const { rows } = await tx.query<OciRow>(
      `SELECT id, current_step, to_char(eta_time, 'HH24:MI') AS eta_time, late_arrival, deferred_people,
              notice_version, notice_accepted_at, completed_at, write_count, write_count_date::text
         FROM online_checkin WHERE reservation_id = $1${lock ? ' FOR UPDATE' : ''}`,
      [reservationId],
    );
    return rows[0] ?? null;
  }

  private async ensureRow(tx: Tx, reservationId: string): Promise<OciRow> {
    const now = this.clock.now();
    await tx.query(
      `INSERT INTO online_checkin (id, organization_id, property_id, reservation_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT (reservation_id) DO NOTHING`,
      [uuidv7(), tx.ctx.organizationId, tx.ctx.propertyId, reservationId, now],
    );
    return (await this.row(tx, reservationId, true)) as OciRow;
  }

  private async noticeVersion(tx: Tx, today: LocalDate): Promise<string> {
    return this.params.get<string>(tx, 'privacy_notice_version', today);
  }

  /** Business date of the property (BR-010) – the parameters of the notice/consent are read for it. */
  private async businessToday(tx: Tx): Promise<LocalDate> {
    const c = await this.tz(tx);
    const rollover = await this.params.get<string>(tx, 'business_day_rollover', c.today);
    return businessDate(c.now, c.tz, rollover);
  }

  /**
   * ĐK-2 (SEC 16/10 + 17/10): exactly the 11 allowed keys of OnlineCheckin – nothing about images, numbers
   * or names. `currentNoticeVersion` / `imageRetentionDays` = property parameters of the business date
   * (privacy_notice_version, id_image_retention_days_after_checkout) the client must show and send back.
   * Read-only (registration data through registration/public – ARC FB-S3-15 (f)).
   */
  async view(tx: Tx, g: GuestPrincipal): Promise<Record<string, unknown>> {
    const c = await this.tz(tx);
    const bizToday = await this.businessToday(tx);
    const progress = await this.regs.guestProgress(tx, g.reservationId);
    const stay = await readStay(tx, g.reservationId, SYSTEM_ACTOR);
    const row = await this.row(tx, g.reservationId);
    const current = await this.noticeVersion(tx, bizToday);
    const retentionDays = await this.params.get<number>(
      tx,
      'id_image_retention_days_after_checkout',
      bizToday,
    );
    const accepted = !!row?.notice_accepted_at && row.notice_version === current;
    const step: Step = row?.completed_at
      ? 'done'
      : accepted
        ? (row?.current_step ?? 'documents')
        : 'notice';
    return {
      currentStep: step === 'notice' && accepted ? 'documents' : step,
      requiredPeople: progress.registration?.required_count ?? stay?.personsTotal ?? 0,
      uploadedPeople: progress.uploadedPeople,
      ...(row?.eta_time ? { etaTime: row.eta_time } : {}),
      consentRecorded: progress.consentPeople.some((p) => p.personIndex === 1),
      ...(row?.completed_at ? { completedAt: toZonedIso(row.completed_at, c.tz) } : {}),
      noticeAccepted: accepted,
      lateArrival: row?.late_arrival ?? false,
      deferredPeople: row?.deferred_people ?? [],
      currentNoticeVersion: current,
      imageRetentionDays: retentionDays,
    };
  }

  async get(tx: Tx, g: GuestPrincipal): Promise<Record<string, unknown>> {
    await this.activeStay(tx, g);
    return this.view(tx, g);
  }

  /** Common guard of every online check-in write: stay active, flow open. */
  private async openFlow(tx: Tx, g: GuestPrincipal): Promise<StayView> {
    const stay = await this.activeStay(tx, g);
    if (!(await this.available(tx, stay))) throw problem('ONLINE_CHECKIN_CLOSED');
    return stay;
  }

  /** SR-RL-05: count one update/complete write of the booking for the local day. */
  private async countWrite(tx: Tx, row: OciRow, today: LocalDate): Promise<void> {
    const n = row.write_count_date === today ? row.write_count : 0;
    if (n >= GUEST_WRITES_PER_DAY) {
      throw problem('RATE_LIMITED', { headers: { 'Retry-After': '3600' } });
    }
    await tx.query(
      'UPDATE online_checkin SET write_count = $2, write_count_date = $3 WHERE id = $1',
      [row.id, n + 1, today],
    );
  }

  private async noticeOk(tx: Tx, row: OciRow): Promise<boolean> {
    const current = await this.noticeVersion(tx, await this.businessToday(tx));
    return !!row.notice_accepted_at && row.notice_version === current;
  }

  async update(
    tx: Tx,
    g: GuestPrincipal,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    await this.openFlow(tx, g);
    const c = await this.tz(tx);
    const row = await this.ensureRow(tx, g.reservationId);
    await this.countWrite(tx, row, c.today);
    const errors: FieldError[] = [];
    const current = await this.noticeVersion(tx, await this.businessToday(tx));
    let noticeNow = await this.noticeOk(tx, row);
    const sets: string[] = [];
    const params: unknown[] = [];
    const set = (col: string, v: unknown) => {
      params.push(v);
      sets.push(`${col} = $${params.length + 1}`);
    };
    if (body.noticeVersion !== undefined) {
      if (body.noticeVersion !== current) {
        errors.push({ field: 'noticeVersion', code: 'NOT_IN_LIST' });
      } else {
        set('notice_version', current);
        // SEC decision (a) 17/10: the evidence names the language really SHOWN – approved notice texts
        // exist in vi/en only; a `ru` session reads the EN text (MOB RU_UNREVIEWED_LEGAL).
        set('notice_locale', APPROVED_NOTICE_LOCALES.includes(g.locale) ? g.locale : 'en');
        set('notice_accepted_at', c.now);
        noticeNow = true;
      }
    }
    const others = ['etaTime', 'currentStep', 'arrivalNote', 'lateArrival'].filter(
      (k) => body[k] !== undefined,
    );
    if (others.length > 0 && !noticeNow && errors.length === 0) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: 'notice' } });
    }
    if (body.lateArrival !== undefined && typeof body.lateArrival !== 'boolean') {
      errors.push({ field: 'lateArrival', code: 'VALIDATION_FAILED' });
    }
    if (body.lateArrival === true) {
      // "Sau 22:00" → 22:00 + late flag [GIẢ ĐỊNH BA].
      set('eta_time', '22:00');
      set('late_arrival', true);
    } else if (body.etaTime !== undefined) {
      if (typeof body.etaTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.etaTime)) {
        errors.push({ field: 'etaTime', code: 'VALIDATION_FAILED' });
      } else {
        set('eta_time', body.etaTime);
        if (body.lateArrival === false) set('late_arrival', false);
      }
    } else if (body.lateArrival === false) set('late_arrival', false);
    let hasNote = false;
    if (body.arrivalNote !== undefined) {
      if (typeof body.arrivalNote !== 'string') {
        errors.push({ field: 'arrivalNote', code: 'VALIDATION_FAILED' });
      } else {
        // Control characters removed (ĐK-2), ≤ 300, V-09 card numbers refused.
        const note = stripControl(body.arrivalNote).trim();
        if (note.length > 300) errors.push({ field: 'arrivalNote', code: 'TOO_LONG' });
        else if (containsCardNumber(note)) {
          throw problem('CARD_NUMBER_DETECTED', {
            errors: [{ field: 'arrivalNote', code: 'CARD_NUMBER_DETECTED' }],
          });
        } else {
          set('arrival_note', note === '' ? null : note);
          hasNote = note !== '';
        }
      }
    }
    if (body.currentStep !== undefined) {
      if (!(STEPS as readonly unknown[]).includes(body.currentStep)) {
        errors.push({ field: 'currentStep', code: 'NOT_IN_LIST' });
      } else set('current_step', body.currentStep);
    } else if (noticeNow && row.current_step === 'notice') {
      set('current_step', 'documents');
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    set('updated_at', c.now);
    await tx.query(`UPDATE online_checkin SET ${sets.join(', ')} WHERE id = $1`, [
      row.id,
      ...params,
    ]);
    // Audit: never the note text (ĐK-2) – only whether there is one.
    await this.audit.record(tx, {
      category: 'state',
      action: 'online_checkin.updated',
      entityType: 'online_checkin',
      entityId: row.id,
      after: {
        hasNote,
        fields: Object.keys(body)
          .filter((k) => k !== 'arrivalNote')
          .sort(),
      },
    });
    return this.view(tx, g);
  }

  /**
   * Cheap checks BEFORE any image is decoded (ARC FB-S3-18, SEC BE-47) – read-only transaction: stay
   * active, flow open, notice read, person number, 30 files per booking.
   */
  async precheckUpload(
    tx: Tx,
    g: GuestPrincipal,
    personIndex: number,
    files: number,
  ): Promise<void> {
    const stay = await this.openFlow(tx, g);
    const row = await this.row(tx, g.reservationId);
    if (!row || !(await this.noticeOk(tx, row))) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: 'notice' } });
    }
    const progress = await this.regs.guestProgress(tx, g.reservationId);
    const required = progress.registration?.required_count ?? stay.personsTotal;
    if (personIndex > required) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'personIndex', code: 'NOT_IN_LIST' }],
      });
    }
    if (files > MAX_IMAGES_PER_PERSON) throw fileRejected('image', 'TOO_MANY_FILES');
    if (progress.guestUploads + files > GUEST_FILES_PER_BOOKING) {
      throw fileRejected('image', 'TOO_MANY_FILES');
    }
  }

  async upload(
    tx: Tx,
    g: GuestPrincipal,
    input: { personIndex: number; docType: 'cccd' | 'passport' | 'child_personal_id' | 'other' },
    images: readonly NormalizedImage[],
    requestId: string,
  ): Promise<Record<string, unknown>> {
    await this.openFlow(tx, g);
    const c = await this.tz(tx);
    const row = await this.ensureRow(tx, g.reservationId);
    if (!(await this.noticeOk(tx, row))) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: 'notice' } });
    }
    const reg = await this.regs.registrationOfReservation(tx, g.reservationId);
    if (!reg) throw problem('NOT_FOUND');
    if (input.personIndex > reg.required_count) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'personIndex', code: 'NOT_IN_LIST' }],
      });
    }
    if (images.length > MAX_IMAGES_PER_PERSON) throw fileRejected('image', 'TOO_MANY_FILES');
    // Re-checked in the write transaction under the registration lock (the precheck was read-only).
    await this.regs.lockForGuest(tx, reg.id);
    const { guestUploads } = await this.regs.guestProgress(tx, g.reservationId);
    if (guestUploads + images.length > GUEST_FILES_PER_BOOKING) {
      throw fileRejected('image', 'TOO_MANY_FILES');
    }
    await this.regs.guestUpload(
      tx,
      g.reservationId,
      input.personIndex,
      input.docType,
      images,
      requestId,
    );
    if (ORDER.indexOf(row.current_step) < ORDER.indexOf('documents')) {
      await tx.query(
        `UPDATE online_checkin SET current_step = 'documents', updated_at = $2 WHERE id = $1`,
        [row.id, c.now],
      );
    }
    return this.view(tx, g);
  }

  async consent(
    tx: Tx,
    g: GuestPrincipal,
    body: Record<string, unknown>,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    await this.openFlow(tx, g);
    const c = await this.tz(tx);
    const errors: FieldError[] = [];
    if (body.purpose !== 'P02B_ID_IMAGE_RETENTION') {
      errors.push({
        field: 'purpose',
        code: body.purpose === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    }
    if (body.decision !== 'granted' && body.decision !== 'refused') {
      errors.push({
        field: 'decision',
        code: body.decision === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    }
    // ĐK-5: only guest 1 (the person who received the link) answers on guest-web.
    if (body.personIndex !== 1) {
      errors.push({
        field: 'personIndex',
        code: body.personIndex === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    }
    if (body.channel !== undefined && body.channel !== 'guest_app') {
      errors.push({ field: 'channel', code: 'NOT_IN_LIST' });
    }
    if (body.partyMemberId !== undefined)
      errors.push({ field: 'partyMemberId', code: 'NOT_IN_LIST' });
    const bizToday = await this.businessToday(tx);
    const current = await this.noticeVersion(tx, bizToday);
    const retentionDays = await this.params.get<number>(
      tx,
      'id_image_retention_days_after_checkout',
      bizToday,
    );
    // SEC ĐK-2 17/10: the days the guest read in the sentence = the parameter in force.
    if (body.retentionDays !== retentionDays) {
      errors.push({
        field: 'retentionDays',
        code: body.retentionDays === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    }
    if (body.noticeVersion !== current) {
      errors.push({
        field: 'noticeVersion',
        code: body.noticeVersion === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    }
    if (!(LOCALES as readonly unknown[]).includes(body.locale)) {
      errors.push({
        field: 'locale',
        code: body.locale === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const row = await this.ensureRow(tx, g.reservationId);
    if (!(await this.noticeOk(tx, row))) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: 'notice' } });
    }
    // SEC BE-49: consent writes count in the 20 writes/day of the booking (SR-RL-05).
    await this.countWrite(tx, row, c.today);
    const reg = await this.regs.registrationOfReservation(tx, g.reservationId);
    if (!reg) throw problem('NOT_FOUND');
    const progress = await this.regs.guestProgress(tx, g.reservationId);
    const last = progress.consentPeople.find((p) => p.personIndex === 1);
    const same =
      !!last &&
      last.decision === body.decision &&
      last.noticeVersion === current &&
      last.retentionDays === retentionDays;
    if (!same) {
      // A repeated identical answer (same notice, same days) is not a new consent record.
      const locked = await this.regs.lockForGuest(tx, reg.id);
      const doc = await this.regs.documentOfPerson(tx, reg.id, 1);
      await this.regs.recordConsent(tx, { type: 'guest', requestId }, locked, doc, {
        decision: body.decision as 'granted' | 'refused',
        noticeVersion: current,
        locale: body.locale as Locale,
        channel: 'guest_app',
        personIndex: 1,
        retentionDays,
      });
    }
    if (ORDER.indexOf(row.current_step) < ORDER.indexOf('consent')) {
      await tx.query(
        `UPDATE online_checkin SET current_step = 'consent', updated_at = $2 WHERE id = $1`,
        [row.id, c.now],
      );
    }
    return this.view(tx, g);
  }

  async complete(
    tx: Tx,
    g: GuestPrincipal,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const stay = await this.openFlow(tx, g);
    const c = await this.tz(tx);
    const row = await this.ensureRow(tx, g.reservationId);
    await this.countWrite(tx, row, c.today);
    const reg = await this.regs.registrationOfReservation(tx, g.reservationId);
    if (!reg) throw problem('NOT_FOUND');
    const deferredRaw = body.deferredPeople ?? [];
    if (
      !Array.isArray(deferredRaw) ||
      deferredRaw.length > 20 ||
      deferredRaw.some((x) => !Number.isInteger(x) || x < 1 || x > reg.required_count) ||
      new Set(deferredRaw).size !== deferredRaw.length
    ) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'deferredPeople', code: 'NOT_IN_LIST' }],
      });
    }
    const missing = (step: Step) =>
      problem('INVALID_TRANSITION', { extras: { currentState: step } });
    if (!(await this.noticeOk(tx, row))) throw missing('notice');
    const view = await this.view(tx, g);
    const uploaded = new Set(view.uploadedPeople as number[]);
    // ĐK-2: server drops deferred indexes that already have documents.
    const deferred = (deferredRaw as number[])
      .filter((x) => !uploaded.has(x))
      .sort((a, b) => a - b);
    for (let i = 1; i <= reg.required_count; i++) {
      if (!uploaded.has(i) && !deferred.includes(i)) throw missing('documents');
    }
    if (!row.eta_time) throw missing('eta');
    if (!view.consentRecorded) throw missing('consent');
    await tx.query(
      `UPDATE online_checkin SET completed_at = $2, current_step = 'done', deferred_people = $3, updated_at = $2
        WHERE id = $1`,
      [row.id, c.now, deferred],
    );
    // EP06 8: the arrival time the guest gave becomes Reservation.etaTime (BE-A port – reservations/public).
    await setEta(tx, g.reservationId, row.eta_time, row.late_arrival, c.now);
    await this.audit.record(tx, {
      category: 'state',
      action: 'online_checkin.completed',
      entityType: 'online_checkin',
      entityId: row.id,
      entityCode: stay.code,
    });
    // FD sees "Khách {code} đã làm thủ tục trước" (EP06 8.3) – IDs/codes only, no guest data (A5).
    await this.events?.notify(
      tx,
      {
        kind: 'online_checkin_completed',
        roles: ['owner', 'manager', 'front_desk_lead', 'front_desk'],
        refType: 'reservation',
        refId: g.reservationId,
        refCode: stay.code,
      },
      c.now,
    );
    await this.events?.publish(tx, 'registration.changed', reg.id);
    return this.view(tx, g);
  }
}

/** Control characters out (ĐK-2: plain text only); tab/newline kept. */
function stripControl(text: string): string {
  let out = '';
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0;
    if ((c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) || c === 0x7f) continue;
    out += ch;
  }
  return out;
}

function pickLocale(preferred: string | null, acceptLanguage: string | undefined): Locale {
  if (preferred === 'vi' || preferred === 'en') return preferred;
  // US-112 / EP06 8.5: browser en* → EN, otherwise VI (RU is R3 – shows EN).
  const first = (acceptLanguage ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('en') || first.startsWith('ru') ? 'en' : 'vi';
}

function wifiOf(
  raw: Record<string, unknown> | null,
  locale: string,
): { ssid: string; password: string } | null {
  if (!raw) return null;
  const pick = (o: unknown) =>
    o && typeof o === 'object' && typeof (o as { ssid?: unknown }).ssid === 'string'
      ? {
          ssid: (o as { ssid: string }).ssid,
          password: String((o as { password?: unknown }).password ?? ''),
        }
      : null;
  return pick(raw) ?? pick(raw[locale]) ?? pick(raw.vi);
}
