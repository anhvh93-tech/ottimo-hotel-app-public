/**
 * Language of the guest session on the real PostgreSQL (P-S4-10; OpenAPI 0.3.7 bổ sung 1 – `GuestSession.locale`,
 * `localeChosenByGuest`, `setGuestLocale`; openapi-0.3.7.md 11.5 #12) – BE-D Sprint 4:
 * (1) the guest's own choice on an earlier session of the same booking → kept (+ flag), even after the desk
 *     re-issues the link; (2) the booker's profile (vi/en/ru); (3) the first Accept-Language tag: vi* → vi,
 *     ru* → ru, anything else or none → en. The choice never writes the guest profile.
 * FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { type FeatureApp, P, cookieValue, startFeatureApp } from '../helpers/feature-app';
import { GUEST_TEST_ORIGIN, guest, seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('P-S4-10 guest session language (BE-D Sprint 4)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let stay: { reservationId: string; code: string };

  beforeAll(async () => {
    db = appDatabase(5);
    t = await createTenant(db, { users: { fd: ['front_desk'] } });
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db, { guestOrigins: [GUEST_TEST_ORIGIN] });
    const now = new Date('2026-10-15T09:00:00+07:00');
    fa.clock.set(now);
    await touchSessions(db, t, now);
    stay = await seedStay(db, t, ids, {
      roomNo: '203',
      arrival: '2026-10-20',
      departure: '2026-10-22',
    });
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;

  /** The desk (re-)issues the link – every older token and session of the booking is revoked – and the guest opens it. */
  async function open(lang?: string) {
    const link = await staff(
      fa,
      t.users.fd!.sessionToken,
      null,
      'POST',
      `${P(t)}/reservations/${stay.reservationId}/guest-link`,
    );
    expect(link.statusCode, link.body).toBe(201);
    const token = new URL(link.json().url).pathname.slice(3);
    const r = await guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token },
      headers: { 'x-forwarded-for': '9.9.9.9', ...(lang ? { 'accept-language': lang } : {}) },
    });
    expect(r.statusCode, r.body).toBe(200);
    return {
      locale: r.json().locale as string,
      chosen: r.json().localeChosenByGuest as boolean,
      sid: cookieValue(r, 'ottimo_gsid') as string,
    };
  }

  it('no profile language: fr-FR → en, ru-RU → ru, vi-VN → vi, no header → en (P-S4-10 default EN)', async () => {
    expect(
      (
        await q<{ preferred_locale: string | null }>(
          `SELECT g.preferred_locale FROM reservation r JOIN guest g ON g.id = r.booker_guest_id WHERE r.id = $1`,
          [stay.reservationId],
        )
      )[0]!.preferred_locale,
    ).toBeNull();
    expect(await open('fr-FR,fr;q=0.9,vi;q=0.8')).toMatchObject({ locale: 'en', chosen: false });
    expect(await open('ru-RU,ru;q=0.9,en;q=0.8')).toMatchObject({ locale: 'ru', chosen: false });
    expect(await open('vi-VN,vi;q=0.9')).toMatchObject({ locale: 'vi', chosen: false });
    expect(await open()).toMatchObject({ locale: 'en', chosen: false });
  });

  it("the booker's profile language comes before the browser (ru accepted)", async () => {
    await q(
      `UPDATE guest SET preferred_locale = 'ru'
        WHERE id = (SELECT booker_guest_id FROM reservation WHERE id = $1)`,
      [stay.reservationId],
    );
    expect(await open('vi-VN')).toMatchObject({ locale: 'ru', chosen: false });
  });

  it('chosen by the guest (setGuestLocale) → kept on the next session of the booking, flag true; profile untouched', async () => {
    const first = await open('en-US');
    expect(first.locale).toBe('ru');
    fa.clock.set(new Date('2026-10-15T09:05:00+07:00'));
    const put = await guest(fa, first.sid, 'PUT', '/v1/guest/locale', { json: { locale: 'vi' } });
    expect(put.statusCode, put.body).toBe(204);
    const again = await open('en-US'); // link re-issued: the old session is revoked, the choice still holds
    expect(again).toMatchObject({ locale: 'vi', chosen: true });
    const rows = await q<{ locale: string; locale_chosen_at: Date | null; revoked: boolean }>(
      `SELECT locale, locale_chosen_at, revoked_at IS NOT NULL AS revoked FROM guest_session
        WHERE reservation_id = $1 AND locale_chosen_at IS NOT NULL ORDER BY created_at`,
      [stay.reservationId],
    );
    expect(rows).toEqual([
      { locale: 'vi', locale_chosen_at: new Date('2026-10-15T09:05:00+07:00'), revoked: true },
      { locale: 'vi', locale_chosen_at: new Date('2026-10-15T09:05:00+07:00'), revoked: false },
    ]);
    expect(
      (
        await q<{ preferred_locale: string | null }>(
          `SELECT g.preferred_locale FROM reservation r JOIN guest g ON g.id = r.booker_guest_id WHERE r.id = $1`,
          [stay.reservationId],
        )
      )[0]!.preferred_locale,
    ).toBe('ru');
    const bad = await guest(fa, again.sid, 'PUT', '/v1/guest/locale', { json: { locale: 'fr' } });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors).toEqual([{ field: 'locale', code: 'NOT_IN_LIST' }]);
  });
});
