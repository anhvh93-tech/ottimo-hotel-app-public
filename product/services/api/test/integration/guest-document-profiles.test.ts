/**
 * Guest profiles "from documents" over HTTP on PostgreSQL (OpenAPI 0.3.7 nhóm D mục A – S4-11, S4-32; SEC s3
 * mục 7; erd 4.4; BR-951/952/955): P05_CRM at the desk writes / clears the v1 document key + last 4 of the
 * profile (SEC F03), the key brings the same person back on another booking, an unmatched adult gets a minimal
 * profile `source = document` (no contact, no date of birth), a name + date of birth match outside the booking
 * is only flagged (`possibleReturningGuest`), SAL/CTV never see a document profile without P05, the locked
 * fields of such a profile (422 NOT_ALLOWED), and J25 `guest.document_profile_anonymize` (T05).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { JobRegistry } from '../../src/jobs/job-runner';
import { RegistrationService } from '../../src/modules/registration/internal/registration.service';
import { J25_KEY } from '../../src/modules/guests/public/worker-jobs';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { sampleJpeg, seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, seedGuestRow } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const KEY = /^v1:[0-9a-f]{64}$/;

describe.skipIf(!HAS_DB)(
  'guest profiles from documents – P05 key, matching, J25 (0.3.7 nhóm D A)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let device: string;
    const tok = (u: string) => t.users[u]!.sessionToken;

    beforeAll(async () => {
      db = appDatabase(6);
      t = await createTenant(db, {
        users: { own: ['owner'], fd: ['front_desk'], sal: ['sales_staff'] },
      });
      ids = await seedBooking(db, t);
      device = await t.deviceToken(0);
      fa = await startFeatureApp(db);
    });
    afterAll(async () => {
      await fa?.close();
      await db.close();
    });
    afterEach(() => fa?.clock.set(T0));

    const q = <R extends Record<string, unknown>>(sql: string, params: unknown[] = []) =>
      db.withContext(t.ctx(), async (tx) => (await tx.query<R>(sql, params)).rows);

    async function registrationOf(reservationId: string): Promise<string> {
      await db.withContext(t.ctx(), (tx) => fa.app.get(RegistrationService).backfill(tx));
      const list = await staff(
        fa,
        tok('fd'),
        device,
        'GET',
        `${P(t)}/registrations?view=all&limit=100`,
      );
      expect(list.statusCode).toBe(200);
      return list
        .json()
        .data.find((r: { reservationId: string }) => r.reservationId === reservationId)
        .id as string;
    }

    async function addDoc(regId: string, data: Record<string, unknown>) {
      return staff(fa, tok('fd'), device, 'POST', `${P(t)}/registrations/${regId}/documents`, {
        multipart: [
          { name: 'data', value: JSON.stringify(data), contentType: 'application/json' },
          {
            name: 'image',
            value: (await sampleJpeg('#30a0b0')) as never,
            filename: 'scan.jpg',
            contentType: 'image/jpeg',
          } as never,
        ],
      });
    }

    const crm = (regId: string, person: string, decision: 'granted' | 'refused') =>
      staff(fa, tok('fd'), device, 'POST', `${P(t)}/registrations/${regId}/consents`, {
        json: {
          partyMemberId: person,
          purpose: 'P05_CRM',
          decision,
          channel: 'desk',
          noticeVersion: 'privacy-2026-10-v1',
          locale: 'vi',
        },
      });

    const guestRow = async (id: string) =>
      (
        await q<{
          source: string;
          crm_consent: string;
          id_doc_hmac: string | null;
          id_doc_last4: string | null;
          phone_e164: string | null;
          date_of_birth: string | null;
          full_name: string;
          nationality_code: string | null;
          anonymized_at: Date | null;
          version: number;
        }>(
          `SELECT source, crm_consent, id_doc_hmac, id_doc_last4, phone_e164, date_of_birth::text AS date_of_birth,
                full_name, nationality_code, anonymized_at, version
           FROM guest WHERE id = $1`,
          [id],
        )
      )[0]!;

    const emma = {
      docType: 'passport',
      fullNameOnDoc: 'SCHMIDT EMMA',
      docNumber: 'C01X00T47',
      gender: 'female',
      dateOfBirth: '1990-04-12',
      nationalityCode: 'DEU',
      passportExpiryDate: '2031-01-01',
      visaKind: 'visa_exempt',
      visaValidUntil: '2026-12-01',
      entryDate: '2026-10-10',
    };
    const binh = {
      docType: 'cccd',
      fullNameOnDoc: 'Trần Thị Bình',
      docNumber: '079185000111',
      dateOfBirth: '1985-01-01',
    };
    const an = {
      docType: 'cccd',
      fullNameOnDoc: 'Nguyễn Văn An',
      docNumber: '079188006789',
      dateOfBirth: '1988-02-03',
    };

    let emmaGuest: string;
    let documentGuest: string;
    let stay2: string;

    it('P05_CRM granted at the desk keeps the v1 document key + last 4 on the profile; the key brings the person back on another booking; nothing matched → a profile "from the document"; a name + date of birth match outside the booking is only flagged', async () => {
      // booking 1: Emma is the booker (profile `desk`, no P05 yet → no document key).
      const s1 = await seedStay(db, t, ids, { adults: 1, bookerName: 'Emma Schmidt' });
      const reg1 = await registrationOf(s1.reservationId);
      const main = await addDoc(reg1, emma);
      expect(main.statusCode, main.body).toBe(201);
      const d1 = main.json().documents[0] as {
        id: string;
        isMain: boolean;
        possibleReturningGuest: boolean;
      };
      expect(d1).toMatchObject({ isMain: true, possibleReturningGuest: false });
      emmaGuest = (
        await q<{ booker_guest_id: string }>(
          'SELECT booker_guest_id FROM reservation WHERE id = $1',
          [s1.reservationId],
        )
      )[0]!.booker_guest_id;
      expect(await guestRow(emmaGuest)).toMatchObject({ id_doc_hmac: null, id_doc_last4: null });

      const granted = await crm(reg1, d1.id, 'granted');
      expect(granted.statusCode, granted.body).toBe(201);
      expect(JSON.stringify(granted.json())).not.toContain('C01X00T47');
      const g = await guestRow(emmaGuest);
      expect(g).toMatchObject({ crm_consent: 'granted', id_doc_last4: '0T47' });
      expect(g.id_doc_hmac).toMatch(KEY);
      const consent = await q<{ purpose: string; decision: string; guest_document_id: string }>(
        `SELECT purpose, decision, guest_document_id FROM consent_record WHERE registration_id = $1
          AND purpose = 'P05_CRM'`,
        [reg1],
      );
      expect(consent).toEqual([
        { purpose: 'P05_CRM', decision: 'granted', guest_document_id: d1.id },
      ]);
      const shown = (await staff(fa, tok('fd'), null, 'GET', `${P(t)}/guests/${emmaGuest}`)).json();
      expect(shown).toMatchObject({ idDocLast4: '0T47', crmConsent: 'granted', source: 'desk' });

      // booking 2 (another booker): Emma's passport without partyMemberId → her P05 profile joins as companion.
      const s2 = await seedStay(db, t, ids, {
        adults: 2,
        bookerName: 'Trần Thị Bình',
        roomNo: '101',
        arrival: '2026-11-02',
        departure: '2026-11-04',
      });
      stay2 = s2.reservationId;
      const reg2 = await registrationOf(s2.reservationId);
      expect((await addDoc(reg2, { ...binh, isMain: true })).statusCode).toBe(201);
      const back = await addDoc(reg2, { ...emma, isMain: false });
      expect(back.statusCode, back.body).toBe(201);
      const emmaDoc = (back.json().documents as Array<Record<string, unknown>>).find(
        (d) => d.docNumberLast4 === '0T47',
      )!;
      expect(emmaDoc.possibleReturningGuest).toBe(false);
      const linked = await q<{ guest_id: string; role: string; relationship: string }>(
        `SELECT m.guest_id, m.role, m.relationship FROM guest_document d
         JOIN reservation_guest m ON m.id = d.party_member_id WHERE d.id = $1`,
        [emmaDoc.id],
      );
      expect(linked).toEqual([{ guest_id: emmaGuest, role: 'companion', relationship: 'unknown' }]);

      // a known profile OUTSIDE the booking with An's name + date of birth (another document) → not linked.
      const lookAlike = await seedGuestRow(db, t, { name: 'Nguyễn Văn An' });
      await q(
        `UPDATE guest SET name_search = 'NGUYEN VAN AN', date_of_birth = '1988-02-03' WHERE id = $1`,
        [lookAlike],
      );
      const anRes = await addDoc(reg2, { ...an, isMain: false });
      expect(anRes.statusCode, anRes.body).toBe(201);
      const anDoc = (anRes.json().documents as Array<Record<string, unknown>>).find(
        (d) => d.docNumberLast4 === '6789',
      )!;
      expect(anDoc.possibleReturningGuest).toBe(true);
      const [member] = await q<{ guest_id: string }>(
        `SELECT m.guest_id FROM guest_document d JOIN reservation_guest m ON m.id = d.party_member_id
        WHERE d.id = $1`,
        [anDoc.id],
      );
      documentGuest = member!.guest_id;
      expect(documentGuest).not.toBe(lookAlike);
      // SEC s3 7.1: name as printed + nationality only – no contact, date of birth or document key.
      expect(await guestRow(documentGuest)).toMatchObject({
        source: 'document',
        crm_consent: 'not_asked',
        phone_e164: null,
        date_of_birth: null,
        id_doc_hmac: null,
        id_doc_last4: null,
        full_name: 'Nguyễn Văn An',
        nationality_code: 'VN',
      });
      // the flag stays on the registration read (FD+).
      const reread = (
        await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${reg2}`)
      ).json();
      expect(
        (reread.documents as Array<Record<string, unknown>>).find((d) => d.id === anDoc.id)
          ?.possibleReturningGuest,
      ).toBe(true);

      // P05 withdrawn (SEC F03): key and last 4 go in the same transaction; the API shows no last 4.
      const refused = await crm(reg1, d1.id, 'refused');
      expect(refused.statusCode, refused.body).toBe(201);
      expect(await guestRow(emmaGuest)).toMatchObject({
        crm_consent: 'refused',
        id_doc_hmac: null,
        id_doc_last4: null,
      });
      const after = (await staff(fa, tok('fd'), null, 'GET', `${P(t)}/guests/${emmaGuest}`)).json();
      expect(after).not.toHaveProperty('idDocLast4');
    });

    it('a document profile without P05: hidden from SAL/CTV even when they created it (rbac D10), locked fields → 422 NOT_ALLOWED, no contact required for other edits', async () => {
      expect(documentGuest).toBeDefined();
      await q('UPDATE guest SET created_by = $2 WHERE id = $1', [documentGuest, t.users.sal!.id]);
      const sal = await staff(fa, tok('sal'), null, 'GET', `${P(t)}/guests/${documentGuest}`);
      expect(sal.statusCode).toBe(404);
      const fd = await staff(fa, tok('fd'), null, 'GET', `${P(t)}/guests/${documentGuest}`);
      expect(fd.statusCode).toBe(200);
      expect(fd.json()).toMatchObject({ source: 'document', crmConsent: 'not_asked' });
      const version = fd.json().version as number;

      const locked = await staff(fa, tok('fd'), null, 'PATCH', `${P(t)}/guests/${documentGuest}`, {
        json: { tags: ['vip'], freeNote: 'x' },
        ifMatch: version,
      });
      expect(locked.statusCode, locked.body).toBe(422);
      expect(locked.json().errors).toEqual([
        { field: 'tags', code: 'NOT_ALLOWED' },
        { field: 'freeNote', code: 'NOT_ALLOWED' },
      ]);
      const renamed = await staff(fa, tok('fd'), null, 'PATCH', `${P(t)}/guests/${documentGuest}`, {
        json: { fullName: 'Nguyễn Văn An' },
        ifMatch: version,
      });
      expect(renamed.statusCode, renamed.body).toBe(200);

      // with P05 the profile is an ordinary CRM profile for its creator again.
      await q(`UPDATE guest SET crm_consent = 'granted' WHERE id = $1`, [documentGuest]);
      expect(
        (await staff(fa, tok('sal'), null, 'GET', `${P(t)}/guests/${documentGuest}`)).statusCode,
      ).toBe(200);
      await q(`UPDATE guest SET crm_consent = 'not_asked' WHERE id = $1`, [documentGuest]);
    });

    it('J25 guest.document_profile_anonymize (T05): document profiles without P05 whose last check-out is older than document_profile_retention_months → anonymous code, purge_journal; recent / P05 / other sources untouched', async () => {
      expect(documentGuest).toBeDefined();
      const now = fa.clock.now();
      const monthsAgo = (m: number) => new Date(now.getTime() - m * 31 * 86_400_000);
      const recent = await seedGuestRow(db, t, { name: 'Lê Gần Đây', phone: null });
      const withP05 = await seedGuestRow(db, t, { name: 'Phạm Đồng Ý', phone: null });
      await q(
        `UPDATE guest SET source = 'document', crm_consent = 'not_asked', last_stay_checkout_at = $2
              WHERE id = $1`,
        [recent, monthsAgo(2)],
      );
      await q(
        `UPDATE guest SET source = 'document', crm_consent = 'granted', last_stay_checkout_at = $2
              WHERE id = $1`,
        [withP05, monthsAgo(14)],
      );
      await q('UPDATE guest SET last_stay_checkout_at = $2 WHERE id = $1', [
        emmaGuest,
        monthsAgo(20),
      ]);
      const job = fa.app.get(JobRegistry).get(J25_KEY);
      expect(job).toBeDefined();
      const run = () =>
        db.withContext(t.ctx(), (tx) =>
          job!.handler(tx, {
            now,
            organizationId: t.organizationId,
            propertyId: t.propertyIds[0]!,
            timezone: 'Asia/Ho_Chi_Minh',
            date: '2026-10-15',
            slot: 'daily',
          }),
        );
      // the stay of the document profile is still open (confirmed) → kept.
      expect(await run()).toEqual({ anonymized: 0 });
      // checked out 13 months ago (no touchLastStay call): J25 catches the last check-out up from the stay.
      await q(
        `UPDATE reservation SET status = 'checked_out', actual_checkin_at = $2, actual_checkout_at = $2
        WHERE id = $1`,
        [stay2, monthsAgo(13)],
      );

      expect(await run()).toEqual({ anonymized: 1 });
      const [code] = await q<{ code: string }>('SELECT code FROM guest WHERE id = $1', [
        documentGuest,
      ]);
      const anon = await guestRow(documentGuest);
      expect(anon.full_name).toBe(`ANON ${code!.code}`);
      expect(anon.anonymized_at).not.toBeNull();
      expect(anon).toMatchObject({ source: 'document', nationality_code: 'VN' });
      const journal = await q<{ policy_key: string; action: string }>(
        `SELECT policy_key, action FROM purge_journal WHERE subject_type = 'guest' AND subject_id = $1`,
        [documentGuest],
      );
      expect(journal).toEqual([{ policy_key: 'T05', action: 'anonymize' }]);
      for (const id of [recent, withP05, emmaGuest]) {
        expect((await guestRow(id)).anonymized_at).toBeNull();
      }
    });
  },
);
