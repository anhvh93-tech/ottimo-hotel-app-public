/**
 * BUG-R2-083 / FB-R2-SEC-BE-53 (SEC s3 9.3, cases R1–R6) on PostgreSQL through the REAL endpoint
 * `DELETE …/reservations/{id}/party/{memberId}` (BE-A removePartyMember → registration hook, one transaction).
 *
 * SEC fallback (no API change): a document the guest uploaded through the link carries a person NUMBER
 * ("Khách n"), not a person – removing someone never destroys an unlinked one by position any more. Every
 * unlinked "Khách 2…" gets a 24 h deadline (`fields_purge_after` + image `delete_after`), stops counting for
 * "enough people", shows in "Cần chú ý"; the desk links the ones of people still staying (updateGuestDocument +
 * partyMemberId) to keep them; J16 removes the rest at the deadline (DEK + file + fields + purge_journal).
 * Documents LINKED to the removed person go at once (R5). `required_count` follows the booking. Fake data only.
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

  async function removeMember(reservationId: string, memberId: string) {
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
      `${P(t)}/reservations/${reservationId}/party/${memberId}`,
      { ifMatch: version },
    );
    await fa.app.get(EncryptedBlobService).sweepAfterCommit(t.ctx());
    return r;
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

  it('R1 – removing the MIDDLE member destroys nothing by position: Khách 2/3 wait 24 h, Khách 1 untouched, required_count 3 → 2, "Cần chú ý"', async () => {
    const { reservationId, a } = await threeInHouse();
    const r = await removeMember(reservationId, a);
    expect(r.statusCode, r.body).toBe(204);
    const s = await docs(reservationId);
    expect(s.map((d) => d.personIndex)).toEqual([1, 2, 3]);
    expectUntouched(person(s, 1));
    expectPending(person(s, 2));
    expectPending(person(s, 3));
    expect(await c3Deletes(s.map((d) => d.id))).toBe(0);
    const st = await regState(reservationId);
    expect(st).toMatchObject({ bookingAdults: 2, requiredCount: 2, uploadedPeople: [1] });
    const item = await unclaimedAttention();
    expect(item?.severity).toBe('warning');
    expect(item?.reservationIds).toContain(reservationId);
    expect(new Date(item?.dueAt ?? 0).toISOString()).toBe(DEADLINE.toISOString());
    // The desk DTO shows the deadline of each waiting document; the guest-link count excludes them.
    const view = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations/${st.registrationId}`,
    );
    const body = view.json() as {
      requiredCount: number;
      documents: Array<{ id: string; imagePurgeAt?: string }>;
      onlineCheckin: { uploadedCount: number; requiredCount: number } | null;
    };
    expect(body.requiredCount).toBe(2);
    const purgeAt = body.documents.find((d) => d.id === person(s, 2).id)?.imagePurgeAt;
    expect(new Date(purgeAt ?? 0).toISOString()).toBe(DEADLINE.toISOString());
    expect(body.documents.find((d) => d.id === person(s, 1).id)?.imagePurgeAt).toBeUndefined();
  });

  it('R2 – removing the LAST member gives exactly the same result as R1 (never by position)', async () => {
    const { reservationId, b } = await threeInHouse();
    const r = await removeMember(reservationId, b);
    expect(r.statusCode, r.body).toBe(204);
    const s = await docs(reservationId);
    expectUntouched(person(s, 1));
    expectPending(person(s, 2));
    expectPending(person(s, 3));
    expect(await regState(reservationId)).toMatchObject({ requiredCount: 2, uploadedPeople: [1] });
  });

  it('R3 – before arrival (confirmed): the removed person\'s upload no longer makes the link "enough people" and has a deadline; a new upload for that Khách replaces it at once', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 2 });
    const c = await addMember(reservationId, 'Phạm Văn C');
    await guestUploads(reservationId, [1, 2]);
    expect((await regState(reservationId)).uploadedPeople).toEqual([1, 2]);
    const r = await removeMember(reservationId, c);
    expect(r.statusCode, r.body).toBe(204);
    const s = await docs(reservationId);
    expectUntouched(person(s, 1));
    expectPending(person(s, 2));
    // The booking still declares 2 adults (BE-A: a person removed before arrival does not lower it): the link
    // asks for Khách 2 again – the removed person's passport does not count.
    expect(await regState(reservationId)).toMatchObject({
      bookingAdults: 2,
      requiredCount: 2,
      uploadedPeople: [1],
    });
    const oldBlob = person(s, 2);
    // The guest sends Khách 2 again (the person who really comes): the old image goes now ("replaced"), the
    // new one is the guest's – it counts and has no removal deadline.
    await at(new Date(T0.getTime() + 2 * HOUR));
    await guestUploads(reservationId, [2], '99cc');
    await fa.app.get(EncryptedBlobService).sweepAfterCommit(t.ctx());
    const after = await docs(reservationId);
    const k2 = person(after, 2);
    expect(k2.id).toBe(oldBlob.id);
    expect(k2).toMatchObject({ liveImages: 1, deleteAfter: null, fieldsPurgeAfter: null });
    expect(k2.deleteReasons).toEqual(['replaced']);
    expect(await regState(reservationId)).toMatchObject({ uploadedPeople: [1, 2] });
    await runJ16(new Date(DEADLINE.getTime() + 60_000));
    expect(person(await docs(reservationId), 2)).toMatchObject({ removed: false, liveImages: 1 });
  });

  it("R4 – 3 adults declared, ONE companion recorded: removing it does not destroy the unrecorded third person's upload", async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 3 });
    const d = await addMember(reservationId, 'Đỗ Văn D');
    await setStayStatus(db, t, reservationId, 'in_house', { actualCheckinAt: CHECKED_IN });
    await guestUploads(reservationId, [1, 2, 3]);
    const r = await removeMember(reservationId, d);
    expect(r.statusCode, r.body).toBe(204);
    const s = await docs(reservationId);
    expectUntouched(person(s, 1));
    expectPending(person(s, 2));
    expectPending(person(s, 3));
    expect(await regState(reservationId)).toMatchObject({ bookingAdults: 2, requiredCount: 2 });
  });

  it("R5 – documents LINKED to members: removing A destroys A's document at once (DEK, file, fields, purge_journal, c3 log), B's stays, nothing waits", async () => {
    const { reservationId, a, b } = await threeInHouse();
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
    const r = await removeMember(reservationId, a);
    expect(r.statusCode, r.body).toBe(204);
    const s = await docs(reservationId);
    expectUntouched(person(s, 1));
    expectDestroyed(person(s, 2));
    expectUntouched(person(s, 3));
    const k2 = person(s, 2);
    const k2Images = await imageIdsOf(k2.id);
    expect(await journal([k2.id, ...k2Images])).toEqual([
      { subject_type: 'document_image', action: 'delete_blob', policy_key: 'party_removed' },
      { subject_type: 'document_image', action: 'destroy_dek', policy_key: 'party_removed' },
      { subject_type: 'guest_document', action: 'destroy_dek', policy_key: 'party_removed' },
      { subject_type: 'guest_document', action: 'null_columns', policy_key: 'party_removed' },
    ]);
    expect(await c3Deletes([k2.id])).toBe(1);
    expect(await regState(reservationId)).toMatchObject({ requiredCount: 2 });
    expect((await unclaimedAttention())?.reservationIds ?? []).not.toContain(reservationId);
  });

  it('R6 + 24 h – not linked: kept 23:59 h, removed by J16 at the deadline (party_removed, DEK, file, purge_journal); Khách 1 still follows the stay (departure + 7 days)', async () => {
    const { reservationId, a } = await threeInHouse({ departure: '2026-10-17' });
    expect((await removeMember(reservationId, a)).statusCode).toBe(204);
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

  it('24 h – the desk links Khách 3 to B within 24 h → kept; Khách 2 (not linked) removed at the deadline; a removed person cannot be used to keep one', async () => {
    const { reservationId, a, b } = await threeInHouse();
    expect((await removeMember(reservationId, a)).statusCode).toBe(204);
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

  it('24 h – after the stay ended, a document linked within 24 h gets back the deadline of the stay (not the 24 h one)', async () => {
    const { reservationId, a, b } = await threeInHouse({ departure: '2026-10-17' });
    // Checked out (not declared): images deadline = checkout + id_image_unconfirmed_max_days (7).
    const checkout = new Date('2026-10-15T03:00:00.000Z');
    await setStayStatus(db, t, reservationId, 'checked_out', { actualCheckoutAt: checkout });
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationService).onCheckedOut(tx, reservationId, checkout),
    );
    const stayDeadline = new Date(checkout.getTime() + 7 * 24 * HOUR).toISOString();
    expect(person(await docs(reservationId), 3).deleteAfter).toBe(stayDeadline);
    // The removal (allowed only before checkout in the product – done here through the hook directly).
    await db.withContext(t.ctx(), async (tx) => {
      await tx.query('UPDATE reservation_guest SET removed_at = $2 WHERE id = $1', [a, T0]);
      await fa.app.get(RegistrationService).onPartyMemberRemoved(tx, reservationId, a);
    });
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
});
