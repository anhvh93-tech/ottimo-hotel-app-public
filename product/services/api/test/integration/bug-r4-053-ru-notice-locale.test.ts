/**
 * BUG-R4-053 (staging drill 5.0, S16 – 05/11): on v1.0.4 the RU guest page shows the signed RU notice of
 * `privacy-2026-10-v2` (P4-42), but `updateOnlineCheckin` still wrote `online_checkin.notice_locale = 'en'` for a
 * `ru` session. SEC rule (rounds/round-04/reviews/SEC-on-ru-notice-locale-drill.md mục 4): `notice_locale` = the
 * session language when the CURRENT notice version has a reviewed text in it, otherwise `en`
 * (v1: vi, en; v2: vi, en, ru; unknown version: vi, en). API contract unchanged.
 * Required cases (mục 4.5): (a) ru + v2 → ru; (b) vi → vi, en → en; (c) ru + v1 → en; (d) ru + unknown → en.
 * Real PostgreSQL over HTTP, as guest-web calls it. One tenant per notice version (parameter of the property).
 * Fake clock T0, FAKE data only (no guest data, no real link values).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { RATE_LIMITER, type RateLimiter } from '../../src/modules/identity/public/rate-limiter';
import { type FeatureApp, P, cookieValue, startFeatureApp } from '../helpers/feature-app';
import { GUEST_TEST_ORIGIN, guest, seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

const V1 = 'privacy-2026-10-v1';
const V2 = 'privacy-2026-10-v2';
/** A version with no row in NOTICE_LOCALES_BY_VERSION (set as a seed row – the desk allowlist P4-16 refuses it). */
const UNKNOWN = 'privacy-2027-01-v9';
/** id_image_retention_days_after_checkout of DS-E (BR-610). */
const RETENTION_DAYS = 30;

describe.skipIf(!HAS_DB)('BUG-R4-053 – notice_locale = the notice language really shown', () => {
  let db: Database;
  let fa: FeatureApp;
  const tenants: Record<string, { t: TestTenant; ids: BookingIds }> = {};
  let ip = 10;

  beforeAll(async () => {
    db = appDatabase(10);
    fa = await startFeatureApp(db, { guestOrigins: [GUEST_TEST_ORIGIN] });
    for (const version of [V1, V2, UNKNOWN]) {
      const t = await createTenant(db, { users: { fd: ['front_desk'] } });
      // V1 is the migration default (0050); V2 / UNKNOWN are property rows in force before T0.
      if (version !== V1) await setParam(db, t, 'privacy_notice_version', version);
      tenants[version] = { t, ids: await seedBooking(db, t) };
    }
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });
  beforeEach(() => fa.app.get<RateLimiter>(RATE_LIMITER).resetAll());

  /** A guest session of a fresh stay of the tenant of `version`, in `locale`; returns the cookie + ids. */
  async function sessionIn(version: string, locale: 'vi' | 'en' | 'ru') {
    const { t, ids } = tenants[version]!;
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const issued = await staff(
      fa,
      t.users.fd!.sessionToken,
      null,
      'POST',
      `${P(t)}/reservations/${reservationId}/guest-link`,
    );
    expect(issued.statusCode, issued.body).toBe(201);
    const token = new URL(issued.json().url).pathname.slice(3);
    const opened = await guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token },
      headers: { 'x-forwarded-for': `10.53.0.${ip++}` },
    });
    expect(opened.statusCode, opened.body).toBe(200);
    const sid = cookieValue(opened, 'ottimo_gsid') as string;
    const set = await guest(fa, sid, 'PUT', '/v1/guest/locale', { json: { locale } });
    expect(set.statusCode, set.body).toBe(204);
    return { t, sid, reservationId };
  }

  /** The guest presses "I have read this" (guest-web NoticeStep: noticeVersion + currentStep). */
  async function readNotice(version: string, locale: 'vi' | 'en' | 'ru') {
    const s = await sessionIn(version, locale);
    const r = await guest(fa, s.sid, 'PUT', '/v1/guest/online-checkin', {
      json: { noticeVersion: version, currentStep: 'documents' },
    });
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json()).toMatchObject({ noticeAccepted: true, currentNoticeVersion: version });
    const row = await db.withContext(
      s.t.ctx(),
      async (tx) =>
        (
          await tx.query<{ notice_version: string; notice_locale: string; accepted: boolean }>(
            `SELECT notice_version, notice_locale, notice_accepted_at IS NOT NULL AS accepted
               FROM online_checkin WHERE reservation_id = $1`,
            [s.reservationId],
          )
        ).rows,
    );
    return { ...s, row };
  }

  it('(a) ru + privacy-2026-10-v2 → ru, and the P02B consent of the same visit says ru too (S16)', async () => {
    const s = await readNotice(V2, 'ru');
    expect(s.row).toEqual([{ notice_version: V2, notice_locale: 'ru', accepted: true }]);
    // guest-web v1.0.4 sends legalLocale('ru') = 'ru' with the consent (P4-42) – both evidences now agree.
    const c = await guest(fa, s.sid, 'POST', '/v1/guest/consents', {
      json: {
        purpose: 'P02B_ID_IMAGE_RETENTION',
        decision: 'refused',
        noticeVersion: V2,
        retentionDays: RETENTION_DAYS,
        locale: 'ru',
        channel: 'guest_app',
        personIndex: 1,
      },
    });
    expect(c.statusCode, c.body).toBe(201);
    const consent = await db.withContext(
      s.t.ctx(),
      async (tx) =>
        (
          await tx.query<{ notice_version: string; locale: string; channel: string }>(
            `SELECT c.notice_version, c.locale, c.channel FROM consent_record c
               JOIN registration x ON x.id = c.registration_id WHERE x.reservation_id = $1`,
            [s.reservationId],
          )
        ).rows,
    );
    expect(consent).toEqual([{ notice_version: V2, locale: 'ru', channel: 'guest_app' }]);
  });

  it('(b) vi → vi and en → en, on v2 and on v1 (unchanged)', async () => {
    for (const version of [V2, V1]) {
      for (const locale of ['vi', 'en'] as const) {
        const s = await readNotice(version, locale);
        expect(s.row, `${version} ${locale}`).toEqual([
          { notice_version: version, notice_locale: locale, accepted: true },
        ]);
      }
    }
  });

  it('(c) ru + privacy-2026-10-v1 → en (the RU page of v1 showed the EN text – decision (a) 17/10 kept for v1)', async () => {
    const s = await readNotice(V1, 'ru');
    expect(s.row).toEqual([{ notice_version: V1, notice_locale: 'en', accepted: true }]);
  });

  it('(d) ru + a version with no reviewed-language row → en (never `ru` for a text not signed in RU)', async () => {
    const s = await readNotice(UNKNOWN, 'ru');
    expect(s.row).toEqual([{ notice_version: UNKNOWN, notice_locale: 'en', accepted: true }]);
    // vi / en of an unknown version are still recorded as themselves (EN lead + VI read by the lawyer).
    const vi = await readNotice(UNKNOWN, 'vi');
    expect(vi.row).toEqual([{ notice_version: UNKNOWN, notice_locale: 'vi', accepted: true }]);
  });
});
