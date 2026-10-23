/**
 * R3-Q17 – SEC mandatory cases before real data (rounds/round-03/outputs/SEC/s1-security-requirements.md B.2–B.4):
 * - FB-R2-SEC-BE-74: J25 leaves nothing that identifies the person on an anonymised `document` profile (option (b)),
 *   a returning guest with the same phone gets ONE live profile, the 0080 back-fill is idempotent;
 * - FB-R2-SEC-BE-75: the J25 anchor also comes from cancelled / no-show bookings and removed members, else the
 *   profile's creation; an open booking in ANOTHER property of the organisation keeps the profile;
 *   `guest_stay_retention` is a narrow SECURITY DEFINER function (boolean + instant, current organisation only);
 * - FB-R2-SEC-BE-79: a document moved from person A to B takes its key / last 4 / P05 off A in the same
 *   transaction; B gets the key only with its own P05; A → B → A ends as "only A".
 * FAKE data only.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/db/database';
import { DocumentProfileService } from '../../src/modules/guests/public/document-profile.service';
import { RegistrationService } from '../../src/modules/registration/internal/registration.service';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { sampleJpeg, seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, seedGuestRow } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const MONTHS = 12;
const monthsBefore = (m: number) => new Date(T0.getTime() - m * 31 * 86_400_000);
const KEY = /^v1:[0-9a-f]{64}$/;

describe.skipIf(!HAS_DB)('R3-Q17 – SEC BE-74, BE-75, BE-79', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let ids1: BookingIds;
  let device: string;
  const tok = (u: string) => t.users[u]!.sessionToken;

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, {
      properties: 2,
      users: { own: ['owner'], fd: ['front_desk'] },
    });
    ids = await seedBooking(db, t);
    ids1 = await seedBooking(db, t, 1);
    device = await t.deviceToken(0);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });
  afterEach(() => {
    fa?.clock.set(T0);
    vi.restoreAllMocks();
  });

  const q = <R extends Record<string, unknown>>(sql: string, params: unknown[] = [], i = 0) =>
    db.withContext(t.ctx(i), async (tx) => (await tx.query<R>(sql, params)).rows);

  const anonymize = (i = 0) =>
    db.withContext(t.ctx(i), (tx) =>
      fa.app.get(DocumentProfileService).anonymizeDue(tx, T0, MONTHS, 1000),
    );

  /** A minimal `document` profile (as createDocumentProfile writes it), created at `createdAt`. */
  async function docProfile(name: string, createdAt: Date): Promise<string> {
    const id = randomUUID();
    await q(
      `INSERT INTO guest (id, organization_id, code, full_name, name_search, nationality_code, is_foreigner,
         source, crm_consent, created_at, updated_at)
       VALUES ($1, $2, $3, $4, upper($4), 'VN', false, 'document', 'not_asked', $5, $5)`,
      [id, t.organizationId, `G-${id.slice(0, 8)}`, name, createdAt],
    );
    return id;
  }

  async function member(reservationId: string, guestId: string, i = 0): Promise<string> {
    const id = randomUUID();
    await q(
      `INSERT INTO reservation_guest (id, organization_id, property_id, reservation_id, guest_id, role,
         relationship, price_age_band, created_at)
       VALUES ($1, $2, $3, $4, $5, 'companion', 'friend', 'adult', $6)`,
      [id, t.organizationId, t.propertyIds[i], reservationId, guestId, T0],
      i,
    );
    return id;
  }

  const anonymizedAt = async (id: string) =>
    (await q<{ a: Date | null }>('SELECT anonymized_at AS a FROM guest WHERE id = $1', [id]))[0]!.a;

  describe('FB-R2-SEC-BE-74 – nothing identifying left after J25', () => {
    it('(1)(2)(5) contact, company, notes… of a document profile are NULL after J25; only code / nationality / foreigner flag stay; journal counts only', async () => {
      const g = await docProfile('Võ Văn Liên Lạc', monthsBefore(20));
      await q(
        `UPDATE guest SET phone_e164 = '84901234111', email_norm = 'lien.lac@example.test',
                company_name = 'Cty Giả', tax_code = '0101010101', preferred_contact = 'zalo',
                preferred_locale = 'vi', messaging_handles = '{"zalo":"84901234111"}'
          WHERE id = $1`,
        [g],
      );
      const st = await seedStay(db, t, ids, { status: 'checked_out' });
      await q(`UPDATE reservation SET actual_checkout_at = $2 WHERE id = $1`, [
        st.reservationId,
        monthsBefore(14),
      ]);
      await member(st.reservationId, g);
      const r = await anonymize();
      expect(r.anonymized).toBeGreaterThanOrEqual(1);
      const [row] = await q<Record<string, unknown>>('SELECT * FROM guest WHERE id = $1', [g]);
      const keep = new Set([
        'id',
        'organization_id',
        'code',
        'full_name',
        'name_search',
        'nationality_code',
        'is_foreigner',
        'crm_consent',
        'source',
        'anonymized_at',
        'last_stay_checkout_at',
        'created_at',
        'created_by',
        'updated_at',
        'version',
        'merged_into_id',
        'possible_duplicate_at',
      ]);
      const leftover = Object.entries(row!).filter(([k, v]) => !keep.has(k) && v !== null);
      expect(leftover).toEqual([]);
      expect(row!.full_name).toBe(`ANON ${row!.code as string}`);
      expect(JSON.stringify(row)).not.toMatch(/Liên|84901234111|lien\.lac|Cty/);
      const journal = await q<{ policy_key: string; action: string }>(
        `SELECT policy_key, action FROM purge_journal WHERE subject_id = $1`,
        [g],
      );
      expect(journal).toEqual([{ policy_key: 'T05', action: 'anonymize' }]);
    });

    it('(3) the same phone comes back → one live profile with that phone, the anonymised one holds none', async () => {
      const g = await docProfile('Đỗ Quay Lại', monthsBefore(20));
      await q(`UPDATE guest SET phone_e164 = '84907770001' WHERE id = $1`, [g]);
      await anonymize();
      expect(await anonymizedAt(g)).not.toBeNull();
      const back = await seedGuestRow(db, t, { name: 'Đỗ Quay Lại', phone: '84907770001' });
      const live = await q<{ id: string; anonymized_at: Date | null }>(
        `SELECT id, anonymized_at FROM guest WHERE phone_e164 = '84907770001'`,
      );
      expect(live).toEqual([{ id: back, anonymized_at: null }]);
    });

    it('(4) the 0080 back-fill clears profiles anonymised before the fix and is idempotent', async () => {
      const g = await docProfile('Cũ Đã Ẩn', monthsBefore(30));
      await q(
        `UPDATE guest SET full_name = 'ANON X', anonymized_at = $2, phone_e164 = '84907770002',
                email_norm = 'old@example.test', company_name = 'Cty Cũ'
          WHERE id = $1`,
        [g, monthsBefore(1)],
      );
      const sql = readFileSync(
        join(__dirname, '..', '..', 'src', 'db', 'migrations', '0080_sec_retention_be_c.sql'),
        'utf8',
      );
      const update = sql.slice(
        sql.indexOf('UPDATE guest'),
        sql.indexOf(';', sql.indexOf('UPDATE guest')),
      );
      const first = await db.withContext(t.ctx(), (tx) => tx.query(update));
      expect(first.rowCount).toBeGreaterThanOrEqual(1);
      const second = await db.withContext(t.ctx(), (tx) => tx.query(update));
      expect(second.rowCount).toBe(0);
      const [row] = await q<{ p: string | null; e: string | null; c: string | null }>(
        'SELECT phone_e164 AS p, email_norm AS e, company_name AS c FROM guest WHERE id = $1',
        [g],
      );
      expect(row).toEqual({ p: null, e: null, c: null });
    });
  });

  describe('FB-R2-SEC-BE-75 – anchor of profiles without a check-out', () => {
    it('(1) cancelled 14 months ago → anonymised; (2) no-show and a removed member likewise; (3) no booking → created_at', async () => {
      const cancelled = await docProfile('Hủy Mười Bốn', monthsBefore(15));
      const s1 = await seedStay(db, t, ids, { status: 'cancelled' });
      await q('UPDATE reservation SET cancelled_at = $2 WHERE id = $1', [
        s1.reservationId,
        monthsBefore(14),
      ]);
      await member(s1.reservationId, cancelled);

      const noShow = await docProfile('Không Đến', monthsBefore(15));
      const s2 = await seedStay(db, t, ids, { status: 'no_show' });
      await q('UPDATE reservation SET no_show_marked_at = $2 WHERE id = $1', [
        s2.reservationId,
        monthsBefore(14),
      ]);
      await member(s2.reservationId, noShow);

      const removed = await docProfile('Bị Bỏ', monthsBefore(15));
      const s3 = await seedStay(db, t, ids, { status: 'in_house', roomNo: '101' });
      const m = await member(s3.reservationId, removed);
      await q('UPDATE reservation_guest SET removed_at = $2 WHERE id = $1', [m, monthsBefore(14)]);

      const lonely = await docProfile('Không Đơn', monthsBefore(14));
      const young = await docProfile('Mới Tạo', monthsBefore(2));

      await anonymize();
      for (const g of [cancelled, noShow, removed, lonely]) {
        expect(await anonymizedAt(g), g).not.toBeNull();
      }
      expect(await anonymizedAt(young)).toBeNull();
    });

    it('(4) an OPEN booking in another property keeps the profile; once it ends (long ago) the next run anonymises', async () => {
      const g = await docProfile('Hai Cơ Sở', monthsBefore(20));
      const old = await seedStay(db, t, ids, { status: 'cancelled' });
      await q('UPDATE reservation SET cancelled_at = $2 WHERE id = $1', [
        old.reservationId,
        monthsBefore(18),
      ]);
      await member(old.reservationId, g);
      const other = await seedStay(db, t, ids1, { status: 'confirmed', propertyIndex: 1 });
      await member(other.reservationId, g, 1);
      // J25 of property 0 cannot see property 1 under RLS – the definer function does.
      const visible = await q<{ n: number }>(
        'SELECT count(*)::int AS n FROM reservation WHERE id = $1',
        [other.reservationId],
      );
      expect(visible[0]!.n).toBe(0);
      await anonymize(0);
      expect(await anonymizedAt(g)).toBeNull();
      await q(
        `UPDATE reservation SET status = 'checked_out', actual_checkin_at = $2, actual_checkout_at = $2
          WHERE id = $1`,
        [other.reservationId, monthsBefore(13)],
        1,
      );
      await anonymize(0);
      expect(await anonymizedAt(g)).not.toBeNull();
    });

    it('(5) a recent check-out (< retention) keeps the profile (regression)', async () => {
      const g = await docProfile('Vừa Trả', monthsBefore(20));
      const st = await seedStay(db, t, ids, { status: 'checked_out' });
      await q('UPDATE reservation SET actual_checkout_at = $2 WHERE id = $1', [
        st.reservationId,
        monthsBefore(3),
      ]);
      await member(st.reservationId, g);
      await anonymize();
      expect(await anonymizedAt(g)).toBeNull();
    });

    it('guest_stay_retention is narrow: SECURITY DEFINER, fixed search_path, PUBLIC cannot run it, another organisation sees nothing', async () => {
      const [fn] = await q<{
        secdef: boolean;
        config: string[];
        pub: boolean;
        app: boolean;
        ret: string;
      }>(
        `SELECT p.prosecdef AS secdef, p.proconfig AS config,
                has_function_privilege('public', p.oid, 'EXECUTE') AS pub,
                has_function_privilege('ottimo_app', p.oid, 'EXECUTE') AS app,
                pg_get_function_result(p.oid) AS ret
           FROM pg_proc p WHERE p.proname = 'guest_stay_retention'`,
      );
      expect(fn).toMatchObject({ secdef: true, pub: false, app: true });
      expect(fn!.config).toContain('search_path=pg_catalog, public, pg_temp');
      expect(fn!.ret).toBe('TABLE(has_open boolean, last_end timestamp with time zone)');
      const g = await docProfile('Khác Tổ Chức', monthsBefore(5));
      const st = await seedStay(db, t, ids, { status: 'confirmed' });
      await member(st.reservationId, g);
      const other = await createTenant(db, { users: { o: ['owner'] } });
      const [seen] = await db.withContext(
        other.ctx(),
        async (tx) => (await tx.query('SELECT * FROM guest_stay_retention($1)', [g])).rows,
      );
      expect(seen).toEqual({ has_open: false, last_end: null });
      const [mine] = await q('SELECT * FROM guest_stay_retention($1)', [g]);
      expect(mine).toEqual({ has_open: true, last_end: null });
    });
  });

  describe('FB-R2-SEC-BE-79 – a document moved to another person', () => {
    async function registrationOf(reservationId: string): Promise<{ id: string; version: number }> {
      await db.withContext(t.ctx(), (tx) => fa.app.get(RegistrationService).backfill(tx));
      const list = await staff(
        fa,
        tok('fd'),
        device,
        'GET',
        `${P(t)}/registrations?view=all&limit=100`,
      );
      const r = list
        .json()
        .data.find((x: { reservationId: string }) => x.reservationId === reservationId);
      return { id: r.id as string, version: r.version as number };
    }
    const version = async (regId: string) =>
      (await q<{ version: number }>('SELECT version FROM registration WHERE id = $1', [regId]))[0]!
        .version;

    const doc = (number: string, partyMemberId?: string) => ({
      docType: 'cccd',
      fullNameOnDoc: 'Nguyễn Văn Nhầm',
      docNumber: number,
      dateOfBirth: '1980-01-01',
      ...(partyMemberId ? { partyMemberId } : {}),
    });

    async function addDoc(regId: string, data: Record<string, unknown>) {
      const r = await staff(
        fa,
        tok('fd'),
        device,
        'POST',
        `${P(t)}/registrations/${regId}/documents`,
        {
          multipart: [
            { name: 'data', value: JSON.stringify(data), contentType: 'application/json' },
            {
              name: 'image',
              value: (await sampleJpeg('#3060a0')) as never,
              filename: 'scan.jpg',
              contentType: 'image/jpeg',
            } as never,
          ],
        },
      );
      expect(r.statusCode, r.body).toBe(201);
      return r;
    }
    const crm = async (regId: string, person: string, decision: 'granted' | 'refused') => {
      const r = await staff(
        fa,
        tok('fd'),
        device,
        'POST',
        `${P(t)}/registrations/${regId}/consents`,
        {
          json: {
            partyMemberId: person,
            purpose: 'P05_CRM',
            decision,
            channel: 'desk',
            noticeVersion: 'privacy-2026-10-v1',
            locale: 'vi',
          },
        },
      );
      expect(r.statusCode, r.body).toBe(201);
    };
    const move = (regId: string, docId: string, number: string, to: string, ifMatch: number) =>
      staff(fa, tok('fd'), device, 'PATCH', `${P(t)}/registrations/${regId}/documents/${docId}`, {
        ifMatch,
        json: doc(number, to),
      });
    const prof = async (id: string) =>
      (
        await q<{ k: string | null; l4: string | null; c: string }>(
          'SELECT id_doc_hmac AS k, id_doc_last4 AS l4, crm_consent AS c FROM guest WHERE id = $1',
          [id],
        )
      )[0]!;

    /** A stay with two companions A and B (desk profiles, no P05), its registration, a document on A with P05. */
    async function setup(number: string) {
      const st = await seedStay(db, t, ids, { adults: 3, roomNo: '101' });
      const gA = await seedGuestRow(db, t, { name: 'Người A' });
      const gB = await seedGuestRow(db, t, { name: 'Người B' });
      const mA = await member(st.reservationId, gA);
      const mB = await member(st.reservationId, gB);
      const reg = await registrationOf(st.reservationId);
      const added = await addDoc(reg.id, doc(number, mA));
      const d = (added.json().documents as Array<{ id: string; partyMemberId?: string }>).find(
        (x) => x.partyMemberId === mA,
      )!;
      await crm(reg.id, mA, 'granted');
      return { st, gA, gB, mA, mB, reg, docId: d.id };
    }

    it('(1)(2)(3)(4) A with P05 → moved to B: A loses key/last4 and P05 (audit, no number); B gets a key only with its own P05; B back later is linked to B', async () => {
      const s = await setup('079080001234');
      const a0 = await prof(s.gA);
      expect(a0).toMatchObject({ c: 'granted', l4: '1234' });
      expect(a0.k).toMatch(KEY);
      const moved = await move(s.reg.id, s.docId, '079080001234', s.mB, await version(s.reg.id));
      expect(moved.statusCode, moved.body).toBe(200);
      expect(await prof(s.gA)).toEqual({ k: null, l4: null, c: 'not_asked' });
      expect(await prof(s.gB)).toEqual({ k: null, l4: null, c: 'not_asked' });
      const audit = await q<{ after: Record<string, unknown> }>(
        `SELECT after FROM audit_event WHERE action = 'consent.reverted' AND entity_id = $1`,
        [s.reg.id],
      );
      expect(audit).toEqual([{ after: { purpose: 'P05_CRM', decision: 'not_asked' } }]);
      expect(JSON.stringify(audit)).not.toContain('1234');
      // B has P05 → B holds the key; B comes back on another booking → linked to B, not A.
      await crm(s.reg.id, s.mB, 'granted');
      const b = await prof(s.gB);
      expect(b).toMatchObject({ c: 'granted', l4: '1234' });
      expect(b.k).toMatch(KEY);
      const st2 = await seedStay(db, t, ids, {
        adults: 2,
        roomNo: '102',
        arrival: '2026-11-10',
        departure: '2026-11-12',
      });
      const reg2 = await registrationOf(st2.reservationId);
      const back = await addDoc(reg2.id, doc('079080001234'));
      const backDoc = (
        back.json().documents as Array<{ docNumberLast4: string; partyMemberId: string }>
      ).find((x) => x.docNumberLast4 === '1234')!;
      const [linked] = await q<{ guest_id: string }>(
        'SELECT guest_id FROM reservation_guest WHERE id = $1',
        [backDoc.partyMemberId],
      );
      expect(linked!.guest_id).toBe(s.gB);
    });

    it('A keeps its OWN earlier P05 decision when a wrong document is moved off it', async () => {
      const s = await setup('079080005555');
      // A had refused P05 earlier on another document of the stay? Simulate an older decision of A's own:
      await q(
        `INSERT INTO consent_record (id, organization_id, property_id, registration_id, guest_document_id,
           party_member_id, person_index, purpose, decision, notice_version, locale, channel, recorded_by_type,
           recorded_by, recorded_at)
         SELECT $1, organization_id, property_id, registration_id, NULL, $2, NULL, 'P05_CRM', 'refused',
                notice_version, locale, channel, recorded_by_type, recorded_by, $3
           FROM consent_record WHERE guest_document_id = $4 LIMIT 1`,
        [randomUUID(), s.mA, monthsBefore(1), s.docId],
      );
      const moved = await move(s.reg.id, s.docId, '079080005555', s.mB, await version(s.reg.id));
      expect(moved.statusCode, moved.body).toBe(200);
      expect(await prof(s.gA)).toEqual({ k: null, l4: null, c: 'refused' });
    });

    it('(5) A → B → A in the same stay ends exactly as "only A"', async () => {
      const s = await setup('079080006666');
      const only = await prof(s.gA);
      expect(
        (await move(s.reg.id, s.docId, '079080006666', s.mB, await version(s.reg.id))).statusCode,
      ).toBe(200);
      expect(
        (await move(s.reg.id, s.docId, '079080006666', s.mA, await version(s.reg.id))).statusCode,
      ).toBe(200);
      expect(await prof(s.gA)).toEqual(only);
      expect(await prof(s.gB)).toEqual({ k: null, l4: null, c: 'not_asked' });
    });

    it('(6) one transaction: an error after the move leaves no half state', async () => {
      const s = await setup('079080007777');
      const before = await prof(s.gA);
      const svc = fa.app.get(RegistrationService);
      vi.spyOn(
        svc as never as { requireUpdate: () => Promise<unknown> },
        'requireUpdate',
      ).mockRejectedValueOnce(new Error('forced failure'));
      const r = await move(s.reg.id, s.docId, '079080007777', s.mB, await version(s.reg.id));
      expect(r.statusCode).toBe(500);
      expect(await prof(s.gA)).toEqual(before);
      expect(await prof(s.gB)).toEqual({ k: null, l4: null, c: 'not_asked' });
      const [d] = await q<{ m: string }>(
        'SELECT party_member_id AS m FROM guest_document WHERE id = $1',
        [s.docId],
      );
      expect(d!.m).toBe(s.mA);
    });

    it('(7) the BE-78 CHECK stays validated', async () => {
      const [c] = await q<{ v: boolean }>(
        `SELECT convalidated AS v FROM pg_constraint WHERE conname = 'guest_id_doc_last4_consent_check'`,
      );
      expect(c!.v).toBe(true);
    });
  });
});
