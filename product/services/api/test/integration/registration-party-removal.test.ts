/**
 * BUG-R2-083 / FB-R2-SEC-BE-53 / BUG-R2-085 (S4-39) on PostgreSQL through the REAL endpoint
 * `DELETE …/reservations/{id}/party/{memberId}` (BE-A removePartyMember → registration hook, one transaction).
 *
 * 0.3.7 main approach (SEC-BE-53 proposals 2–5): a document the guest uploaded through the link carries a slot
 * NUMBER ("Khách n"), not a person, so the desk says which one was the removed person's –
 * `guestUploadPersonIndex` = n (≥ 2) or `none`, REQUIRED when the person has no linked document and an open slot
 * exists (422 + `personIndexes[]`). Slot n is destroyed at once (DEK, file, fields, purge_journal, c3 log), the
 * slots behind it move down, `required_count` follows the party; `none` destroys nothing; documents LINKED to
 * the removed person go at once (R5); under `legal_hold` nothing is destroyed until the hold is lifted
 * (SEC-BE-57). The 0.3.6 fallback (24 h deadline + "Cần chú ý", the desk links what it keeps, J16 removes the
 * rest) stays only for head-count cuts without a slot answer (PATCH people / OTA change → `stay_changed` →
 * onPartyChanged) – exercised here through that hook. Fake data only.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { BLOB_STORE, type BlobStore } from '../../src/modules/files/internal/blob-store';
import { EncryptedBlobService } from '../../src/modules/files/public/encrypted-blob.service';
import { normalizeImage } from '../../src/modules/files/public/image-pipeline';
import {
  RegistrationService,
  UNCLAIMED_DOCUMENTS_CHECK,
} from '../../src/modules/registration/internal/registration.service';
import { RetentionService } from '../../src/modules/registration/internal/retention.service';
import { type FeatureApp, P, setPassword, startFeatureApp } from '../helpers/feature-app';
import { sampleJpeg, seedStay, setStayStatus, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, seedGuestRow } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const HOUR = 3_600_000;
const DEADLINE = new Date(T0.getTime() + 24 * HOUR);
const CHECKED_IN = new Date('2026-10-15T01:30:00.000Z');

interface DocState {
  id: string;
  personIndex: number;
  member: string | null;
  removed: boolean;
  purged: boolean;
  liveImages: number;
  deleteReasons: string[];
  imageDekDestroyed: boolean;
  docDekDestroyed: boolean;
  blobPresent: boolean;
  deleteAfter: string | null;
  fieldsPurgeAfter: string | null;
}

describe.skipIf(!HAS_DB)('BUG-R2-083 – party removal and guest-link documents (SEC-BE-53)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let device: string;
  const tok = (u: string) => t.users[u]!.sessionToken;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, { users: { own: ['owner'], fd: ['front_desk'] } });
    ids = await seedBooking(db, t);
    for (const u of ['own', 'fd']) await setPassword(db, t, u);
    device = await t.deviceToken(0);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });
  afterEach(() => fa?.clock.set(T0));

  /** Moves the Clock and keeps the staff sessions and the trusted device alive for HTTP calls after it. */
  async function at(iso: Date): Promise<void> {
    fa.clock.set(iso);
    await db.withContext(t.ctx(), async (tx) => {
      const until = new Date(iso.getTime() + HOUR);
      await tx.query('UPDATE user_session SET idle_expires_at = $1, expires_at = $1', [until]);
      await tx.query('UPDATE trusted_device SET expires_at = GREATEST(expires_at, $1)', [until]);
    });
  }

  async function addMember(reservationId: string, name: string): Promise<string> {
    const guestId = await seedGuestRow(db, t, { name });
    const id = randomUUID();
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO reservation_guest (id, organization_id, property_id, reservation_id, guest_id, role,
           relationship, price_age_band, created_at)
         VALUES ($1, $2, $3, $4, $5, 'companion', 'friend', 'adult', $6)`,
        [id, t.organizationId, t.propertyIds[0], reservationId, guestId, T0],
      ),
    );
    return id;
  }

  /** The guest uploads one passport image per "Khách n" through the link (guest-web path). */
  async function guestUploads(
    reservationId: string,
    persons: number[],
    tint = '66aa',
  ): Promise<void> {
    const regs = fa.app.get(RegistrationService);
    for (const person of persons) {
      const image = await normalizeImage(await sampleJpeg(`#${person}${person}${tint}`), 'image');
      await db.withContext(t.ctx(), (tx) =>
        regs.guestUpload(tx, reservationId, person, 'passport', [image], randomUUID()),
      );
    }
  }

  async function removeMember(
    reservationId: string,
    memberId: string,
    guestUploadPersonIndex?: number | string,
  ) {
    const version = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ party_version: number }>(
            'SELECT party_version FROM reservation WHERE id = $1',
            [reservationId],
          )
        ).rows[0]!.party_version,
    );
    const r = await staff(
      fa,
      tok('fd'),
      device,
      'DELETE',
      `${P(t)}/reservations/${reservationId}/party/${memberId}` +
        (guestUploadPersonIndex === undefined
          ? ''
          : `?guestUploadPersonIndex=${guestUploadPersonIndex}`),
      { ifMatch: version },
    );
    await fa.app.get(EncryptedBlobService).sweepAfterCommit(t.ctx());
    return r;
  }

  /**
   * The 0.3.6 fallback path: the booking's head count is cut without a slot answer (PATCH people / OTA change
   * → ReservationHooks `stay_changed` → onPartyChanged with the new total), in one transaction.
   */
  async function cutHeadCount(reservationId: string, adults: number): Promise<void> {
    await db.withContext(t.ctx(), async (tx) => {
      await tx.query('UPDATE reservation SET adults = $2 WHERE id = $1', [reservationId, adults]);
      await fa.app.get(RegistrationService).onPartyChanged(tx, reservationId, adults);
    });
  }

  async function choices(reservationId: string) {
    const st = await regState(reservationId);
    return db.withContext(t.ctx(), async (tx) =>
      (
        await tx.query<{ after: Record<string, unknown> }>(
          `SELECT after FROM audit_event WHERE action = 'registration.unclaimed_choice' AND entity_id = $1
              ORDER BY occurred_at`,
          [st.registrationId],
        )
      ).rows.map((r) => r.after),
    );
  }

  async function runJ16(when: Date): Promise<void> {
    fa.clock.set(when);
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RetentionService).run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
    );
    await fa.app.get(EncryptedBlobService).sweepAfterCommit(t.ctx());
  }

  async function docs(reservationId: string): Promise<DocState[]> {
    const store = fa.app.get<BlobStore>(BLOB_STORE);
    const rows = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{
            id: string;
            person_index: number;
            member: string | null;
            removed: boolean;
            purged: boolean;
            live: number;
            reasons: string[] | null;
            image_dek: boolean;
            doc_dek: boolean;
            blob_key: string;
            delete_after: Date | null;
            fields_purge_after: Date | null;
          }>(
            `SELECT d.id, d.person_index, d.party_member_id AS member, d.removed_at IS NOT NULL AS removed,
                    d.purged_at IS NOT NULL AS purged, d.fields_purge_after,
                    (SELECT count(*)::int FROM document_image i
                      WHERE i.guest_document_id = d.id AND i.deleted_at IS NULL) AS live,
                    (SELECT array_agg(i.delete_reason ORDER BY i.uploaded_at) FROM document_image i
                      WHERE i.guest_document_id = d.id AND i.deleted_at IS NOT NULL) AS reasons,
                    (SELECT bool_and(k.destroyed_at IS NOT NULL) FROM document_image i
                       JOIN data_key k ON k.id = i.data_key_id
                      WHERE i.guest_document_id = d.id) AS image_dek,
                    (SELECT k.destroyed_at IS NOT NULL FROM data_key k WHERE k.id = d.data_key_id) AS doc_dek,
                    (SELECT i.blob_key FROM document_image i WHERE i.guest_document_id = d.id
                      ORDER BY i.uploaded_at DESC LIMIT 1) AS blob_key,
                    (SELECT min(i.delete_after) FROM document_image i
                      WHERE i.guest_document_id = d.id AND i.deleted_at IS NULL) AS delete_after
               FROM guest_document d WHERE d.reservation_id = $1
              ORDER BY d.person_index, d.created_at`,
            [reservationId],
          )
        ).rows,
    );
    const out: DocState[] = [];
    for (const r of rows) {
      out.push({
        id: r.id,
        personIndex: r.person_index,
        member: r.member,
        removed: r.removed,
        purged: r.purged,
        liveImages: r.live,
        deleteReasons: r.reasons ?? [],
        imageDekDestroyed: r.image_dek,
        docDekDestroyed: r.doc_dek,
        blobPresent: (await store.get(r.blob_key)) !== null,
        deleteAfter: r.delete_after?.toISOString() ?? null,
        fieldsPurgeAfter: r.fields_purge_after?.toISOString() ?? null,
      });
    }
    return out;
  }

  const person = (s: DocState[], n: number) => s.find((d) => d.personIndex === n)!;
  /** The live document of "Khách n" (a slot sent again after a removal has a retired one too). */
  const live = (s: DocState[], n: number) => s.find((d) => d.personIndex === n && !d.removed)!;

  /** Untouched: live, nothing destroyed, no deadline at all. */
  function expectUntouched(d: DocState): void {
    expect(d).toMatchObject({
      removed: false,
      purged: false,
      liveImages: 1,
      imageDekDestroyed: false,
      docDekDestroyed: false,
      blobPresent: true,
      deleteAfter: null,
      fieldsPurgeAfter: null,
    });
  }

  /** Waiting for the desk: nothing destroyed yet, removal deadline = removal + 24 h. */
  function expectPending(d: DocState, deadline = DEADLINE): void {
    expect(d).toMatchObject({
      removed: false,
      purged: false,
      liveImages: 1,
      imageDekDestroyed: false,
      docDekDestroyed: false,
      blobPresent: true,
      deleteAfter: deadline.toISOString(),
      fieldsPurgeAfter: deadline.toISOString(),
    });
  }

  /** Removed like a removed person's document: DEKs destroyed, file gone, fields NULL, `party_removed`. */
  function expectDestroyed(d: DocState): void {
    expect(d).toMatchObject({
      removed: true,
      purged: true,
      liveImages: 0,
      imageDekDestroyed: true,
      docDekDestroyed: true,
      blobPresent: false,
    });
    expect(d.deleteReasons).toEqual(['party_removed']);
  }

  async function regState(reservationId: string) {
    return db.withContext(t.ctx(), async (tx) => {
      const p = await fa.app.get(RegistrationService).guestProgress(tx, reservationId);
      const res = (
        await tx.query<{ adults: number }>('SELECT adults FROM reservation WHERE id = $1', [
          reservationId,
        ])
      ).rows[0]!;
      return {
        bookingAdults: res.adults,
        requiredCount: p.registration?.required_count ?? null,
        submittedCount: p.registration?.submitted_count ?? null,
        status: p.registration?.status ?? null,
        uploadedPeople: p.uploadedPeople,
        registrationId: p.registration?.id ?? '',
        version: p.registration?.version ?? 0,
      };
    });
  }

  async function journal(subjectIds: string[]) {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ subject_type: string; action: string; policy_key: string }>(
            `SELECT subject_type, action, policy_key FROM purge_journal WHERE subject_id = ANY($1::uuid[])
              ORDER BY subject_type, action`,
            [subjectIds],
          )
        ).rows,
    );
  }

  async function imageIdsOf(docId: string): Promise<string[]> {
    return db.withContext(t.ctx(), async (tx) =>
      (
        await tx.query<{ id: string }>(
          'SELECT id FROM document_image WHERE guest_document_id = $1',
          [docId],
        )
      ).rows.map((r) => r.id),
    );
  }

  async function c3Deletes(docIds: string[]): Promise<number> {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ n: number }>(
            `SELECT count(*)::int AS n FROM c3_access_log WHERE action = 'delete' AND subject_id = ANY($1::uuid[])`,
            [docIds],
          )
        ).rows[0]!.n,
    );
  }

  async function c3Updates(docId: string): Promise<number> {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ n: number }>(
            `SELECT count(*)::int AS n FROM c3_access_log WHERE action = 'update' AND subject_id = $1`,
            [docId],
          )
        ).rows[0]!.n,
    );
  }

  async function unclaimedAttention() {
    const r = await staff(fa, tok('fd'), device, 'GET', `${P(t)}/attention`);
    expect(r.statusCode, r.body).toBe(200);
    return (
      r.json().data as Array<{
        kind: string;
        severity: string;
        params?: { check?: string };
        reservationIds?: string[];
        dueAt?: string;
      }>
    ).find((i) => i.kind === 'data_quality' && i.params?.check === UNCLAIMED_DOCUMENTS_CHECK);
  }

  /** The desk enters the fields of a guest-link document and links it to a party member. */
  async function linkDocument(
    reservationId: string,
    documentId: string,
    partyMemberId: string,
    docNumber: string,
  ) {
    const s = await regState(reservationId);
    return staff(
      fa,
      tok('fd'),
      device,
      'PATCH',
      `${P(t)}/registrations/${s.registrationId}/documents/${documentId}`,
      {
        ifMatch: s.version,
        json: {
          docType: 'passport',
          fullNameOnDoc: 'MUELLER JONAS',
          docNumber,
          gender: 'male',
          dateOfBirth: '1991-05-06',
          nationalityCode: 'DEU',
          passportExpiryDate: '2031-01-01',
          visaKind: 'visa_exempt',
          visaValidUntil: '2026-12-01',
          entryDate: '2026-10-10',
          partyMemberId,
        },
      },
    );
  }

  /** 3 adults in house: booker + A (1st member) + B (2nd member); the guest uploaded Khách 1/2/3. */
  async function threeInHouse(opts: { departure?: string } = {}) {
    const { reservationId } = await seedStay(db, t, ids, {
      adults: 3,
      ...(opts.departure ? { arrival: '2026-10-15', departure: opts.departure } : {}),
    });
    const a = await addMember(reservationId, 'Trần Văn A');
    const b = await addMember(reservationId, 'Lê Thị B');
    await setStayStatus(db, t, reservationId, 'in_house', { actualCheckinAt: CHECKED_IN });
    await guestUploads(reservationId, [1, 2, 3]);
    return { reservationId, a, b };
  }

  it('R1 – S4-39: removing a member while open slots exist needs the slot answer (422 REQUIRED + personIndexes, nothing touched); choosing Khách 2 destroys it at once and Khách 3 becomes Khách 2', async () => {
    const { reservationId, a } = await threeInHouse();
    const missing = await removeMember(reservationId, a);
    expect(missing.statusCode, missing.body).toBe(422);
    expect(missing.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'guestUploadPersonIndex', code: 'REQUIRED' }],
      personIndexes: [2, 3],
    });
    expect(missing.body).not.toMatch(/Trần|Lê Thị|image/i);
    // Rolled back: A still in the party, nothing destroyed, no deadline.
    let s = await docs(reservationId);
    for (const n of [1, 2, 3]) expectUntouched(person(s, n));
    expect(await regState(reservationId)).toMatchObject({ bookingAdults: 3, requiredCount: 3 });
    // Not an open slot (1 is the link holder's, 4 does not exist) / not a slot number at all → 422 NOT_IN_LIST.
    for (const bad of ['1', '4', 'abc', '2.5', '21']) {
      const r = await removeMember(reservationId, a, bad);
      expect(r.statusCode, `${bad}: ${r.body}`).toBe(422);
      expect(r.json().errors).toEqual([{ field: 'guestUploadPersonIndex', code: 'NOT_IN_LIST' }]);
    }
    const k3 = person(s, 3);
    const r = await removeMember(reservationId, a, 2);
    expect(r.statusCode, r.body).toBe(204);
    s = await docs(reservationId);
    const gone = s.find((d) => d.removed)!;
    expectDestroyed(gone);
    expect(await journal([gone.id, ...(await imageIdsOf(gone.id))])).toEqual([
      { subject_type: 'document_image', action: 'delete_blob', policy_key: 'party_removed' },
      { subject_type: 'document_image', action: 'destroy_dek', policy_key: 'party_removed' },
      { subject_type: 'guest_document', action: 'destroy_dek', policy_key: 'party_removed' },
      { subject_type: 'guest_document', action: 'null_columns', policy_key: 'party_removed' },
    ]);
    expect(await c3Deletes([gone.id])).toBe(1);
    // Slots stay contiguous: the old Khách 3 is now Khách 2, untouched, no 24 h deadline.
    expectUntouched(live(s, 1));
    expect(live(s, 2).id).toBe(k3.id);
    expectUntouched(live(s, 2));
    expect(s.filter((d) => !d.removed).map((d) => d.personIndex)).toEqual([1, 2]);
    expect(await regState(reservationId)).toMatchObject({
      bookingAdults: 2,
      requiredCount: 2,
      uploadedPeople: [1, 2],
    });
    expect(await choices(reservationId)).toEqual([
      { guestUploadPersonIndex: 2, unclaimedDocuments: 1 },
    ]);
    expect((await unclaimedAttention())?.reservationIds ?? []).not.toContain(reservationId);
  });

  it('R2 – removing the LAST member and choosing Khách 3: only Khách 3 goes, Khách 1/2 untouched', async () => {
    const { reservationId, b } = await threeInHouse();
    const before = await docs(reservationId);
    const r = await removeMember(reservationId, b, 3);
    expect(r.statusCode, r.body).toBe(204);
    const s = await docs(reservationId);
    expectDestroyed(s.find((d) => d.id === person(before, 3).id)!);
    expectUntouched(live(s, 1));
    expectUntouched(live(s, 2));
    expect(live(s, 2).id).toBe(person(before, 2).id);
    expect(await regState(reservationId)).toMatchObject({
      requiredCount: 2,
      uploadedPeople: [1, 2],
    });
  });

  it("R3 – before arrival (confirmed): choosing the removed person's Khách 2 destroys it; the link asks for Khách 2 again and a new upload is a normal document", async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 2 });
    const c = await addMember(reservationId, 'Phạm Văn C');
    await guestUploads(reservationId, [1, 2]);
    expect((await regState(reservationId)).uploadedPeople).toEqual([1, 2]);
    const waiting = person(await docs(reservationId), 2);
    const r = await removeMember(reservationId, c, 2);
    expect(r.statusCode, r.body).toBe(204);
    let s = await docs(reservationId);
    expectUntouched(live(s, 1));
    expectDestroyed(s.find((d) => d.id === waiting.id)!);
    // The booking still declares 2 adults (BE-A: a person removed before arrival does not lower it): the link
    // asks for Khách 2 again.
    expect(await regState(reservationId)).toMatchObject({
      bookingAdults: 2,
      requiredCount: 2,
      uploadedPeople: [1],
    });
    await at(new Date(T0.getTime() + 2 * HOUR));
    await guestUploads(reservationId, [2], '99cc');
    s = await docs(reservationId);
    const k2 = live(s, 2);
    expect(k2.id).not.toBe(waiting.id);
    expect(k2).toMatchObject({ liveImages: 1, deleteAfter: null, fieldsPurgeAfter: null });
    expect(await regState(reservationId)).toMatchObject({ uploadedPeople: [1, 2] });
    await runJ16(new Date(DEADLINE.getTime() + 60_000));
    expect(live(await docs(reservationId), 2)).toMatchObject({ id: k2.id, liveImages: 1 });
  });

  it('R4 – 3 adults declared, ONE companion recorded who did not use the link: `none` destroys nothing, every slot stays as it was (no deadline), the answer is audited', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 3 });
    const d = await addMember(reservationId, 'Đỗ Văn D');
    await setStayStatus(db, t, reservationId, 'in_house', { actualCheckinAt: CHECKED_IN });
    await guestUploads(reservationId, [1, 2, 3]);
    const r = await removeMember(reservationId, d, 'none');
    expect(r.statusCode, r.body).toBe(204);
    const s = await docs(reservationId);
    for (const n of [1, 2, 3]) expectUntouched(person(s, n));
    expect(await c3Deletes(s.map((x) => x.id))).toBe(0);
    expect(await regState(reservationId)).toMatchObject({ bookingAdults: 2, requiredCount: 2 });
    expect(await choices(reservationId)).toEqual([
      { guestUploadPersonIndex: 'none', unclaimedDocuments: 0 },
    ]);
    expect((await unclaimedAttention())?.reservationIds ?? []).not.toContain(reservationId);
  });

  it("R5 – documents LINKED to members: removing A destroys A's document at once (DEK, file, fields, purge_journal, c3 log), B's stays, nothing waits; a slot number is then refused (SEC-BE-58 (2))", async () => {
    const { reservationId, a, b } = await threeInHouse();
    // A fourth upload nobody linked yet (an open slot) – A's own linked document already says which one is A's.
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE reservation SET adults = 4 WHERE id = $1', [reservationId]),
    );
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationService).onPartyChanged(tx, reservationId, 4),
    );
    await guestUploads(reservationId, [4]);
    await db.withContext(t.ctx(), async (tx) => {
      await tx.query(
        `UPDATE guest_document SET party_member_id = $2 WHERE reservation_id = $1 AND person_index = 2`,
        [reservationId, a],
      );
      await tx.query(
        `UPDATE guest_document SET party_member_id = $2 WHERE reservation_id = $1 AND person_index = 3`,
        [reservationId, b],
      );
    });
    const refused = await removeMember(reservationId, a, 4);
    expect(refused.statusCode, refused.body).toBe(422);
    expect(refused.json().errors).toEqual([
      { field: 'guestUploadPersonIndex', code: 'NOT_ALLOWED' },
    ]);
    const r = await removeMember(reservationId, a);
    expect(r.statusCode, r.body).toBe(204);
    const s = await docs(reservationId);
    expectUntouched(person(s, 1));
    expectDestroyed(person(s, 2));
    expectUntouched(person(s, 3));
    expectUntouched(person(s, 4));
    const k2 = person(s, 2);
    const k2Images = await imageIdsOf(k2.id);
    expect(await journal([k2.id, ...k2Images])).toEqual([
      { subject_type: 'document_image', action: 'delete_blob', policy_key: 'party_removed' },
      { subject_type: 'document_image', action: 'destroy_dek', policy_key: 'party_removed' },
      { subject_type: 'guest_document', action: 'destroy_dek', policy_key: 'party_removed' },
      { subject_type: 'guest_document', action: 'null_columns', policy_key: 'party_removed' },
    ]);
    expect(await c3Deletes([k2.id])).toBe(1);
    // Linked documents keep their slot numbers (no slot was chosen): nothing shifts.
    expect(s.filter((d) => !d.removed).map((d) => d.personIndex)).toEqual([1, 3, 4]);
    expect(await regState(reservationId)).toMatchObject({ requiredCount: 3 });
    expect((await unclaimedAttention())?.reservationIds ?? []).not.toContain(reservationId);
  });

  it('S4-39 – four slots: choosing Khách 2 shifts Khách 3/4 down and the guest\'s "add at reception" choices follow their person; `none` is accepted even without open slots, a number is not', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 4 });
    const e = await addMember(reservationId, 'Vũ Văn E');
    await guestUploads(reservationId, [1, 2, 4]);
    // The guest chose "add at reception" for Khách 3 on guest-web.
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO online_checkin (id, organization_id, property_id, reservation_id, current_step,
           deferred_people, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'documents', '{3}', $5, $5)`,
        [randomUUID(), t.organizationId, t.propertyIds[0], reservationId, T0],
      ),
    );
    const before = await docs(reservationId);
    const missing = await removeMember(reservationId, e);
    expect(missing.json().personIndexes).toEqual([2, 4]);
    expect((await removeMember(reservationId, e, 3)).json().errors).toEqual([
      { field: 'guestUploadPersonIndex', code: 'NOT_IN_LIST' },
    ]);
    expect((await removeMember(reservationId, e, 2)).statusCode).toBe(204);
    const s = await docs(reservationId);
    expect(s.filter((d) => !d.removed).map((d) => [d.personIndex, d.id])).toEqual([
      [1, person(before, 1).id],
      [3, person(before, 4).id],
    ]);
    const deferred = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ deferred_people: number[] }>(
            'SELECT deferred_people FROM online_checkin WHERE reservation_id = $1',
            [reservationId],
          )
        ).rows[0]!.deferred_people,
    );
    expect(deferred).toEqual([2]);
    // Booking still 4 adults (confirmed): the link now shows Khách 1 and 3 sent, Khách 2 at reception.
    expect(await regState(reservationId)).toMatchObject({
      requiredCount: 4,
      uploadedPeople: [1, 3],
    });
    // A member removed with no open slot left: `none` is fine, a number → NOT_ALLOWED.
    const f = await addMember(reservationId, 'Ngô Thị F');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `UPDATE guest_document SET party_member_id = $2 WHERE reservation_id = $1 AND person_index = 3
            AND removed_at IS NULL`,
        [reservationId, f],
      ),
    );
    const g = await addMember(reservationId, 'Ngô Văn G');
    expect((await removeMember(reservationId, g, 2)).json().errors).toEqual([
      { field: 'guestUploadPersonIndex', code: 'NOT_ALLOWED' },
    ]);
    expect((await removeMember(reservationId, g, 'none')).statusCode).toBe(204);
  });

  it('SEC-BE-57 – legal hold: removing a member destroys nothing and logs no c3 delete (documents only retired); once the hold is lifted J16 destroys them and logs the deletion', async () => {
    const { reservationId, a, b } = await threeInHouse();
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `UPDATE guest_document SET party_member_id = $2 WHERE reservation_id = $1 AND person_index = 2`,
        [reservationId, a],
      ),
    );
    const st = await regState(reservationId);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE registration SET legal_hold = true WHERE id = $1', [st.registrationId]),
    );
    const before = await docs(reservationId);
    // A's linked document (Khách 2) and B's slot (Khách 3, chosen) – both retired, nothing destroyed.
    expect((await removeMember(reservationId, a)).statusCode).toBe(204);
    expect((await removeMember(reservationId, b, 3)).statusCode).toBe(204);
    let s = await docs(reservationId);
    for (const n of [2, 3]) {
      expect(s.find((d) => d.id === person(before, n).id)).toMatchObject({
        removed: true,
        purged: false,
        liveImages: 1,
        imageDekDestroyed: false,
        docDekDestroyed: false,
        blobPresent: true,
      });
    }
    expect(await c3Deletes([person(before, 2).id, person(before, 3).id])).toBe(0);
    expect(await regState(reservationId)).toMatchObject({ requiredCount: 1, uploadedPeople: [1] });
    // Still held: J16 leaves them.
    await runJ16(new Date(T0.getTime() + 2 * HOUR));
    expect((await docs(reservationId)).filter((d) => d.removed && !d.purged)).toHaveLength(2);
    // Hold lifted → destroyed at the next tick, deletion logged then.
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE registration SET legal_hold = false WHERE id = $1', [st.registrationId]),
    );
    await runJ16(new Date(T0.getTime() + 3 * HOUR));
    s = await docs(reservationId);
    for (const n of [2, 3]) {
      const d = s.find((x) => x.id === person(before, n).id)!;
      expectDestroyed(d);
    }
    expect(await c3Deletes([person(before, 2).id, person(before, 3).id])).toBe(2);
    expectUntouched(live(s, 1));
  });

  it('R6 + 24 h (fallback – head count cut without a slot answer): Khách 2/3 wait, kept 23:59 h, removed by J16 at the deadline (party_removed, DEK, file, purge_journal); Khách 1 still follows the stay (departure + 7 days)', async () => {
    const { reservationId } = await threeInHouse({ departure: '2026-10-17' });
    await cutHeadCount(reservationId, 2);
    {
      const s0 = await docs(reservationId);
      expectUntouched(person(s0, 1));
      expectPending(person(s0, 2));
      expectPending(person(s0, 3));
      expect(await regState(reservationId)).toMatchObject({
        requiredCount: 2,
        uploadedPeople: [1],
      });
      const item = await unclaimedAttention();
      expect(item?.severity).toBe('warning');
      expect(item?.reservationIds).toContain(reservationId);
      expect(new Date(item?.dueAt ?? 0).toISOString()).toBe(DEADLINE.toISOString());
    }
    // 1 minute before the deadline: nothing removed.
    await runJ16(new Date(DEADLINE.getTime() - 60_000));
    let s = await docs(reservationId);
    expectPending(person(s, 2));
    expectPending(person(s, 3));
    // Deadline passed: removed exactly like a removed person's document.
    await runJ16(new Date(DEADLINE.getTime() + 60_000));
    s = await docs(reservationId);
    expectUntouched(person(s, 1));
    for (const n of [2, 3]) {
      const d = person(s, n);
      expectDestroyed(d);
      expect(await journal([d.id, ...(await imageIdsOf(d.id))])).toEqual([
        { subject_type: 'document_image', action: 'delete_blob', policy_key: 'party_removed' },
        { subject_type: 'document_image', action: 'destroy_dek', policy_key: 'party_removed' },
        { subject_type: 'guest_document', action: 'destroy_dek', policy_key: 'party_removed' },
        { subject_type: 'guest_document', action: 'null_columns', policy_key: 'party_removed' },
      ]);
    }
    expect(await c3Deletes([person(s, 2).id, person(s, 3).id])).toBe(2);
    const run = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ n: number }>(
            `SELECT coalesce(sum(items_count), 0)::int AS n FROM retention_run WHERE policy_key = 'party_removed'`,
          )
        ).rows[0]!.n,
    );
    expect(run).toBeGreaterThanOrEqual(2);
    await at(new Date(DEADLINE.getTime() + 2 * 60_000));
    expect((await unclaimedAttention())?.reservationIds ?? []).not.toContain(reservationId);
    // A late link attempt finds nothing (the document is gone).
    const late = await linkDocument(reservationId, person(s, 3).id, randomUUID(), 'C55X00L01');
    expect(late.statusCode, late.body).toBe(404);
    // Never closed by the desk (worst case): Khách 1 follows SEC BE-32 Major a – departure 17/10 + 7 days.
    await runJ16(new Date('2026-10-23T05:01:00.000Z'));
    expect(person(await docs(reservationId), 1)).toMatchObject({
      liveImages: 1,
      deleteAfter: null,
    });
    await runJ16(new Date('2026-10-24T05:01:00.000Z'));
    const k1 = person(await docs(reservationId), 1);
    expect(k1).toMatchObject({ liveImages: 0, imageDekDestroyed: true, blobPresent: false });
    expect(k1.deleteReasons).toEqual(['unconfirmed']);
  });

  it('BR-601 v0.3.8 (DOM-S4-16 b): a child\'s unlinked document is not removed by the "unclaimed" deadline before the stay is declared – it stays in "Cần chú ý" without a deadline', async () => {
    const { reservationId } = await threeInHouse();
    // Khách 3 is a child's document (minor data – kept by the declaration, BR-601/602).
    const before = await docs(reservationId);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE guest_document SET is_minor_data = true WHERE id = $1', [
        person(before, 3).id,
      ]),
    );
    await cutHeadCount(reservationId, 1);
    let s = await docs(reservationId);
    expectPending(person(s, 2));
    expectUntouched(person(s, 3)); // no deadline for the child
    const item = await unclaimedAttention();
    expect(item?.reservationIds).toContain(reservationId);
    // Past the deadline: the adult's slot goes, the child's stays (the stay is not declared).
    await runJ16(new Date(DEADLINE.getTime() + 60_000));
    s = await docs(reservationId);
    expectDestroyed(person(s, 2));
    expect(person(s, 3)).toMatchObject({ removed: false, purged: false, liveImages: 1 });
    await at(new Date(DEADLINE.getTime() + 2 * 60_000));
    const still = await unclaimedAttention();
    expect(still?.reservationIds).toContain(reservationId);
    expect(still).not.toHaveProperty('dueAt'); // nothing will be removed by itself
  });

  it('24 h (fallback) – the desk links Khách 3 to B within 24 h → kept; Khách 2 (not linked) removed at the deadline; a removed person cannot be used to keep one', async () => {
    const { reservationId, a, b } = await threeInHouse();
    await cutHeadCount(reservationId, 2);
    // A leaves too, the desk answers `none` (the waiting slots are open slots, so an answer is needed).
    expect((await removeMember(reservationId, a, 'none')).statusCode).toBe(204);
    const before = await docs(reservationId);
    await at(new Date(T0.getTime() + 2 * HOUR));
    // Linking to the person who left (or to anyone not in this party) is refused – it would keep the document.
    const toRemoved = await linkDocument(reservationId, person(before, 2).id, a, 'C55X00L02');
    expect(toRemoved.statusCode).toBe(422);
    expect(toRemoved.json().errors).toEqual([{ field: 'partyMemberId', code: 'NOT_IN_LIST' }]);
    expectPending(person(await docs(reservationId), 2));
    // Khách 3 is B's: the desk enters it and links it to B.
    const linked = await linkDocument(reservationId, person(before, 3).id, b, 'C55X00L03');
    expect(linked.statusCode, linked.body).toBe(200);
    let s = await docs(reservationId);
    expect(person(s, 3)).toMatchObject({
      member: b,
      removed: false,
      liveImages: 1,
      deleteAfter: null,
      fieldsPurgeAfter: null,
    });
    expectPending(person(s, 2));
    expect(await regState(reservationId)).toMatchObject({ submittedCount: 1, requiredCount: 2 });
    expect((await unclaimedAttention())?.reservationIds).toContain(reservationId);
    await runJ16(new Date(DEADLINE.getTime() + 60_000));
    s = await docs(reservationId);
    expectUntouched(person(s, 1));
    expectDestroyed(person(s, 2));
    expect(person(s, 3)).toMatchObject({
      member: b,
      removed: false,
      purged: false,
      liveImages: 1,
      imageDekDestroyed: false,
      docDekDestroyed: false,
      blobPresent: true,
    });
    // The linked document's fields are still readable for the declaration (DEK alive).
    await at(new Date(DEADLINE.getTime() + 2 * 60_000));
    expect((await unclaimedAttention())?.reservationIds ?? []).not.toContain(reservationId);
  });

  it('24 h (fallback) – after the stay ended, a document linked within 24 h gets back the deadline of the stay (not the 24 h one)', async () => {
    const { reservationId, a, b } = await threeInHouse({ departure: '2026-10-17' });
    // Checked out (not declared): images deadline = checkout + id_image_unconfirmed_max_days (7).
    const checkout = new Date('2026-10-15T03:00:00.000Z');
    await setStayStatus(db, t, reservationId, 'checked_out', { actualCheckoutAt: checkout });
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationService).onCheckedOut(tx, reservationId, checkout),
    );
    const stayDeadline = new Date(checkout.getTime() + 7 * 24 * HOUR).toISOString();
    expect(person(await docs(reservationId), 3).deleteAfter).toBe(stayDeadline);
    // A head-count cut after checkout (not possible in the product – done here through the hook directly).
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE reservation_guest SET removed_at = $2 WHERE id = $1', [a, T0]),
    );
    await cutHeadCount(reservationId, 2);
    expectPending(person(await docs(reservationId), 3));
    await at(new Date(T0.getTime() + HOUR));
    const linked = await linkDocument(
      reservationId,
      person(await docs(reservationId), 3).id,
      b,
      'C55X00L04',
    );
    expect(linked.statusCode, linked.body).toBe(200);
    expect(person(await docs(reservationId), 3)).toMatchObject({
      fieldsPurgeAfter: null,
      deleteAfter: stayDeadline,
    });
  });

  it('S4-39 – GuestDocumentLink (PATCH with only partyMemberId): links a waiting document without C3 fields, ends its deadline, one c3 update; refusals 409/422; the DTO shows personIndex + unclaimedUntil; addGuestDocument on a waiting number → 409 DOCUMENT_UNCLAIMED_EXISTS with its id', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 3 });
    const a = await addMember(reservationId, 'Trần Văn A');
    const b = await addMember(reservationId, 'Lê Thị B');
    await guestUploads(reservationId, [1, 2, 3]);
    // Khách 3's number is known to the desk (fields entered, not linked), then the head count is cut.
    const s0 = await docs(reservationId);
    const entered = await enterCccd(reservationId, person(s0, 3).id, 'Lê Thị B', '079300000033');
    expect(entered.statusCode, entered.body).toBe(200);
    await cutHeadCount(reservationId, 2);
    const st = await regState(reservationId);
    const view = async () =>
      (
        await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${st.registrationId}`)
      ).json() as {
        version: number;
        documents: Array<{ id: string; personIndex: number | null; unclaimedUntil: string | null }>;
      };
    let v = await view();
    expect(v.documents.find((d) => d.id === person(s0, 1).id)).toMatchObject({
      personIndex: 1,
      unclaimedUntil: null,
    });
    for (const n of [2, 3]) {
      const d = v.documents.find((x) => x.id === person(s0, n).id)!;
      expect(d.personIndex).toBe(n);
      expect(new Date(d.unclaimedUntil ?? 0).toISOString()).toBe(DEADLINE.toISOString());
    }
    // The desk types Khách 3's number again as a new document → the waiting one is pointed at instead.
    const dup = await staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/registrations/${st.registrationId}/documents`,
      {
        multipart: [
          {
            name: 'data',
            value: JSON.stringify({
              docType: 'cccd',
              fullNameOnDoc: 'Lê Thị B',
              docNumber: '079300000033',
              dateOfBirth: '1988-02-03',
            }),
            contentType: 'application/json',
          },
        ],
      },
    );
    expect(dup.statusCode, dup.body).toBe(409);
    expect(dup.json()).toMatchObject({
      code: 'DOCUMENT_UNCLAIMED_EXISTS',
      documentId: person(s0, 3).id,
      personIndex: 3,
    });
    const link = (documentId: string, body: unknown, version: number) =>
      staff(
        fa,
        tok('fd'),
        device,
        'PATCH',
        `${P(t)}/registrations/${st.registrationId}/documents/${documentId}`,
        { ifMatch: version, json: body },
      );
    v = await view();
    expect(
      (await link(person(s0, 3).id, { partyMemberId: 'nope' }, v.version)).json().errors,
    ).toEqual([{ field: 'partyMemberId', code: 'NOT_IN_LIST' }]);
    expect(
      (await link(person(s0, 3).id, { partyMemberId: randomUUID() }, v.version)).json().errors,
    ).toEqual([{ field: 'partyMemberId', code: 'NOT_IN_LIST' }]);
    const before = await c3Updates(person(s0, 3).id);
    const ok = await link(person(s0, 3).id, { partyMemberId: b }, v.version);
    expect(ok.statusCode, ok.body).toBe(200);
    expect(await c3Updates(person(s0, 3).id)).toBe(before + 1);
    let s = await docs(reservationId);
    expect(person(s, 3)).toMatchObject({
      member: b,
      removed: false,
      liveImages: 1,
      deleteAfter: null,
      fieldsPurgeAfter: null,
    });
    v = await view();
    expect(v.documents.find((d) => d.id === person(s0, 3).id)?.unclaimedUntil).toBeNull();
    // Already linked to B: linking it to A → 409 INVALID_TRANSITION; B already has a document → Khách 2 to B
    // is a PARTY_DUPLICATE.
    expect((await link(person(s0, 3).id, { partyMemberId: a }, v.version)).json().code).toBe(
      'INVALID_TRANSITION',
    );
    expect((await link(person(s0, 2).id, { partyMemberId: b }, v.version)).json().code).toBe(
      'PARTY_DUPLICATE',
    );
    const two = await link(person(s0, 2).id, { partyMemberId: a }, v.version);
    expect(two.statusCode, two.body).toBe(200);
    // No C3 field went through the link body: the document's fields are untouched (still no number).
    s = await docs(reservationId);
    expect(person(s, 2)).toMatchObject({ member: a, fieldsPurgeAfter: null, purged: false });
    await runJ16(new Date(DEADLINE.getTime() + 60_000));
    expect((await docs(reservationId)).filter((d) => d.removed)).toEqual([]);
  });

  /** Desk P02b decision for one document (values of Registration.consentNotice). */
  async function deskConsent(reservationId: string, documentId: string) {
    const s = await regState(reservationId);
    const view = (
      await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${s.registrationId}`)
    ).json() as { consentNotice: { currentNoticeVersion: string; imageRetentionDays: number } };
    return staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/registrations/${s.registrationId}/consents`,
      {
        json: {
          partyMemberId: documentId,
          purpose: 'P02B_ID_IMAGE_RETENTION',
          decision: 'granted',
          channel: 'desk',
          noticeVersion: view.consentNotice.currentNoticeVersion,
          retentionDays: view.consentNotice.imageRetentionDays,
          locale: 'vi',
        },
      },
    );
  }

  /** The desk enters a Vietnamese ID card for a guest-link document (optionally linked to a member). */
  async function enterCccd(
    reservationId: string,
    documentId: string,
    fullNameOnDoc: string,
    docNumber: string,
    partyMemberId?: string,
  ) {
    const s = await regState(reservationId);
    return staff(
      fa,
      tok('fd'),
      device,
      'PATCH',
      `${P(t)}/registrations/${s.registrationId}/documents/${documentId}`,
      {
        ifMatch: s.version,
        json: {
          docType: 'cccd',
          fullNameOnDoc,
          docNumber,
          dateOfBirth: '1988-02-03',
          ...(partyMemberId ? { partyMemberId } : {}),
        },
      },
    );
  }

  async function action(reservationId: string, name: string, json: unknown) {
    const s = await regState(reservationId);
    return staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/registrations/${s.registrationId}/actions/${name}`,
      { json, ifMatch: s.version },
    );
  }

  it('SEC-BE-54 – a scanned declaration whose counted documents drop below the party (head-count cut → waiting documents) cannot be sent (409 REGISTRATION_INCOMPLETE) until the desk links them', async () => {
    const { reservationId } = await seedStay(db, t, ids, {
      adults: 3,
      bookerName: 'Nguyễn Văn An',
    });
    await addMember(reservationId, 'Trần Văn A');
    const b = await addMember(reservationId, 'Lê Thị B');
    await setStayStatus(db, t, reservationId, 'in_house', { actualCheckinAt: CHECKED_IN });
    await guestUploads(reservationId, [1, 2, 3]);
    const s0 = await docs(reservationId);
    // The desk enters the three people – none of the link slots linked to a member yet.
    for (const [n, name, num] of [
      [1, 'Nguyễn Văn An', '079300000001'],
      [2, 'Trần Văn A', '079300000002'],
      [3, 'Lê Thị B', '079300000003'],
    ] as const) {
      const r = await enterCccd(reservationId, person(s0, n).id, name, num);
      expect(r.statusCode, r.body).toBe(200);
      expect((await deskConsent(reservationId, person(s0, n).id)).statusCode).toBe(201);
    }
    // Every warning handled with a note (US-044 AC4) – whatever the checks of these fake documents say.
    const reg = (
      await staff(
        fa,
        tok('fd'),
        device,
        'GET',
        `${P(t)}/registrations/${(await regState(reservationId)).registrationId}`,
      )
    ).json() as {
      documents: Array<{ id: string; checks: Array<{ code: string; result: string }> }>;
    };
    const warningNotes = reg.documents.flatMap((d) =>
      d.checks
        .filter((x) => x.result === 'fail' || x.result === 'unverified')
        .map((x) => ({
          documentId: d.id,
          checkCode: x.code,
          note: 'Đã đối chiếu với khách tại quầy',
          ...(x.result === 'unverified' ? { manualResult: 'pass' } : {}),
        })),
    );
    const review = await action(reservationId, 'complete-review', { warningNotes });
    expect(review.statusCode, review.body).toBe(200);
    expect(review.json().status).toBe('scanned');
    // The head count is cut to 2 without a slot answer: Khách 2 and 3 wait – 1 counted person for 2.
    await cutHeadCount(reservationId, 2);
    expect(await regState(reservationId)).toMatchObject({ requiredCount: 2, submittedCount: 1 });
    const sent = { portalReference: 'VN-0001', kind: 'vn_citizen_stay' };
    const blocked = await action(reservationId, 'mark-sent', sent);
    expect(blocked.statusCode, blocked.body).toBe(409);
    expect(blocked.json()).toMatchObject({
      code: 'REGISTRATION_INCOMPLETE',
      errors: [{ field: 'party_count', code: 'REGISTRATION_INCOMPLETE' }],
    });
    // The desk links Khách 3 to B → 2 counted → declared (A's Khách 2 goes at its deadline).
    const linked = await enterCccd(reservationId, person(s0, 3).id, 'Lê Thị B', '079300000003', b);
    expect(linked.statusCode, linked.body).toBe(200);
    const ok = await action(reservationId, 'mark-sent', sent);
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().status).toBe('sent');
  });

  it('SEC-BE-55/57 – legal hold: the guest sends a waiting Khách 2 again → a new document; the old one keeps its 24 h deadline, no c3 delete while held, and goes (logged) once the hold is lifted; no "Cần chú ý" while held', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 3 });
    await guestUploads(reservationId, [1, 2, 3]);
    const st = await regState(reservationId);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE registration SET legal_hold = true WHERE id = $1', [st.registrationId]),
    );
    await cutHeadCount(reservationId, 2);
    expect((await unclaimedAttention())?.reservationIds ?? []).not.toContain(reservationId);
    const waiting = person(await docs(reservationId), 2);
    expectPending(waiting);
    await at(new Date(T0.getTime() + HOUR));
    await guestUploads(reservationId, [2], '77ee');
    await fa.app.get(EncryptedBlobService).sweepAfterCommit(t.ctx());
    let s = await docs(reservationId);
    // Held: the old image is not deleted, but it keeps the removal deadline (never an unowned image without one).
    expect(s.find((d) => d.id === waiting.id)).toMatchObject({
      removed: true,
      liveImages: 1,
      imageDekDestroyed: false,
      blobPresent: true,
      deleteAfter: DEADLINE.toISOString(),
    });
    const k2 = live(s, 2);
    expect(k2.id).not.toBe(waiting.id);
    expect(k2).toMatchObject({ liveImages: 1, deleteAfter: null, fieldsPurgeAfter: null });
    expect((await regState(reservationId)).uploadedPeople).toEqual([1, 2]);
    expect(await c3Deletes([waiting.id])).toBe(0);
    // Past the deadline, still held: nothing is deleted.
    await runJ16(new Date(DEADLINE.getTime() + 60_000));
    expect((await docs(reservationId)).find((d) => d.id === waiting.id)).toMatchObject({
      liveImages: 1,
      purged: false,
      docDekDestroyed: false,
    });
    // Hold lifted → the old image goes at the next run; the new document stays.
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE registration SET legal_hold = false WHERE id = $1', [st.registrationId]),
    );
    await runJ16(new Date(DEADLINE.getTime() + 2 * 60_000));
    s = await docs(reservationId);
    expect(s.find((d) => d.id === waiting.id)).toMatchObject({
      liveImages: 0,
      imageDekDestroyed: true,
      blobPresent: false,
      purged: true,
      docDekDestroyed: true,
    });
    expect(await c3Deletes([waiting.id])).toBe(1);
    expect(live(s, 2)).toMatchObject({ id: k2.id, liveImages: 1, blobPresent: true });
  });

  it('SEC-BE-56 – the P02b decision recorded for a waiting Khách 2 does not follow the person who sends it again', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 3 });
    await guestUploads(reservationId, [1, 2, 3]);
    const waiting = person(await docs(reservationId), 2);
    expect((await deskConsent(reservationId, waiting.id)).statusCode).toBe(201);
    await cutHeadCount(reservationId, 2);
    await at(new Date(T0.getTime() + HOUR));
    await guestUploads(reservationId, [2], '55dd');
    const k2 = live(await docs(reservationId), 2);
    const st = await regState(reservationId);
    const view = (
      await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${st.registrationId}`)
    ).json() as { documents: Array<{ id: string; imageConsent: string }> };
    expect(view.documents.find((d) => d.id === k2.id)?.imageConsent).toBe('not_recorded');
    expect(view.documents.map((d) => d.id)).not.toContain(waiting.id);
    // The consent record itself stays (append-only), still pointing at the retired document only.
    const rows = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ guest_document_id: string | null }>(
            'SELECT guest_document_id FROM consent_record WHERE registration_id = $1',
            [st.registrationId],
          )
        ).rows,
    );
    expect(rows).toEqual([{ guest_document_id: waiting.id }]);
  });

  it('SEC-BE-58 (1) – a waiting document does not raise "visa_expiring"', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 3 });
    await guestUploads(reservationId, [1, 2, 3]);
    const k2 = person(await docs(reservationId), 2);
    const s = await regState(reservationId);
    // The desk enters Khách 2 (not linked): a visa ending 16/10, before the 20/10 departure.
    const entered = await staff(
      fa,
      tok('fd'),
      device,
      'PATCH',
      `${P(t)}/registrations/${s.registrationId}/documents/${k2.id}`,
      {
        ifMatch: s.version,
        json: {
          docType: 'passport',
          fullNameOnDoc: 'MUELLER JONAS',
          docNumber: 'C55X00V58',
          gender: 'male',
          dateOfBirth: '1991-05-06',
          nationalityCode: 'DEU',
          passportExpiryDate: '2031-01-01',
          visaKind: 'visa',
          visaNumber: 'V1234567',
          visaValidUntil: '2026-10-16',
          entryDate: '2026-10-10',
        },
      },
    );
    expect(entered.statusCode, entered.body).toBe(200);
    const expiring = () =>
      db.withContext(t.ctx(), async (tx) =>
        (await fa.app.get(RegistrationService).visaExpiringReservations(tx)).map(
          (x) => x.reservationId,
        ),
      );
    expect(await expiring()).toContain(reservationId);
    await cutHeadCount(reservationId, 2);
    expectPending({ ...person(await docs(reservationId), 2), purged: false });
    expect(await expiring()).not.toContain(reservationId);
  });
});
