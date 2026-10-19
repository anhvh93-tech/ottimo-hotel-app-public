/**
 * SEC FB-R2-SEC-BE-65 (ARC s4-ARC.md E.1 a6) – retention anchor of work-order / inspection / penalty-evidence
 * photos and J16 (`purgeDue`) on PostgreSQL through the real endpoints:
 * (1) work order `done` (report photo + repair photo) → kept at anchor + months − 1 day, purged at + 1 day (DEK
 *     destroyed); (2) `done` → `reopen` clears the anchor, closing again sets a new one; (3) `cancelled` like (1);
 * (4) inspection → anchor = `performedAt` (offline, earlier than received); (5) penalty evidence uploaded after
 * `checked_out` (BR-427 c) → anchored at upload, while `in_house` → NULL until the checkout anchors it;
 * (6) migration 0078 back-fills old-shape rows; (7) J16 safety net `anchorMissing` (counted, never purged).
 * Fake data only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client as PgClient } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { RegistrationService } from '../../src/modules/registration/internal/registration.service';
import { RetentionService } from '../../src/modules/registration/internal/retention.service';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { sampleJpeg, seedStay, setStayStatus, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const TZ = 'Asia/Ho_Chi_Minh';
const DAY = 86_400_000;
const MONTHS = 12; // attachment_ops_retention_months (0050 default)
const plusMonths = (d: Date, m: number) => {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + m);
  return x;
};

describe.skipIf(!HAS_DB)('SEC BE-65 – retention anchor of operational photos (J16)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const tok = (u: string) => t.users[u]!.sessionToken;

  beforeAll(async () => {
    db = appDatabase(10);
    fa = await startFeatureApp(db);
  });
  beforeEach(async () => {
    t = await createTenant(db, {
      users: {
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        hk: ['housekeeping'],
        mt: ['maintenance'],
      },
    });
    ids = await seedBooking(db, t);
  });
  afterEach(() => fa.clock.set(T0));
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const svc = () => fa.app.get(AttachmentService);
  const call = (
    u: string,
    method: 'GET' | 'POST',
    path: string,
    opts: { json?: unknown; ifMatch?: number } = {},
  ) => staff(fa, tok(u), null, method, `${P(t)}${path}`, opts);
  const room = (no: string) => ids.rooms[no] as string;

  /** Moves the Clock and keeps the staff sessions alive after it. */
  async function at(d: Date): Promise<void> {
    fa.clock.set(d);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE user_session SET idle_expires_at = $1, expires_at = $1', [
        new Date(d.getTime() + 3_600_000),
      ]),
    );
  }

  async function upload(user: string, purpose: string, reservationId?: string): Promise<string> {
    const r = await staff(fa, tok(user), null, 'POST', `${P(t)}/attachments`, {
      multipart: [
        { name: 'purpose', value: purpose },
        ...(reservationId ? [{ name: 'reservationId', value: reservationId }] : []),
        {
          name: 'file',
          value: await sampleJpeg('#556677'),
          filename: 'p.jpg',
          contentType: 'image/jpeg',
        },
      ],
    });
    expect(r.statusCode, r.body).toBe(201);
    return r.json().id as string;
  }

  async function rows(...idList: string[]) {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{
            id: string;
            retention_anchor_at: Date | null;
            purged_at: Date | null;
            purge_reason: string | null;
            destroyed_at: Date | null;
          }>(
            `SELECT a.id, a.retention_anchor_at, a.purged_at, a.purge_reason, k.destroyed_at
             FROM attachment a JOIN data_key k ON k.id = a.data_key_id
            WHERE a.id = ANY($1::uuid[]) ORDER BY array_position($1::uuid[], a.id)`,
            [idList],
          )
        ).rows,
    );
  }
  const anchors = async (...idList: string[]) =>
    (await rows(...idList)).map((r) => r.retention_anchor_at?.toISOString() ?? null);

  const purge = (now: Date) => db.withContext(t.ctx(), (tx) => svc().purgeDue(tx, now, TZ));

  /** A low work order by FD with a report photo, accepted by MT. */
  async function openOrder(roomNo: string) {
    const photo = await upload('fd', 'work_order');
    const created = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room(roomNo),
        title: `Vòi rỉ nước – căn ${roomNo}`,
        description: 'Vòi lavabo rỉ nước',
        category: 'leak',
        severity: 'low',
        photoAttachmentIds: [photo],
      },
    });
    expect(created.statusCode, created.body).toBe(201);
    return { wo: created.json() as { id: string; version: number }, photo };
  }
  const act = (
    u: string,
    id: string,
    action: string,
    version: number,
    body: Record<string, unknown> = {},
  ) => call(u, 'POST', `/work-orders/${id}/actions/${action}`, { json: body, ifMatch: version });

  async function completeOrder(id: string, version: number) {
    const acc = await act('mt', id, 'accept', version);
    expect(acc.statusCode, acc.body).toBe(200);
    const after = await upload('mt', 'work_order');
    const done = await act('mt', id, 'complete', acc.json().version, {
      resultNote: 'Đã thay vòi',
      photoAttachmentIds: [after],
    });
    expect(done.statusCode, done.body).toBe(200);
    return { after, version: done.json().version as number };
  }

  it('(1) work order done: report + repair photos anchored at done_at; J16 keeps them at + months − 1 day, purges at + 1 day (DEK destroyed)', async () => {
    const { wo, photo } = await openOrder('301');
    // While open: no anchor (J16 cannot run the clock on an open order).
    expect(await anchors(photo)).toEqual([null]);
    const closedAt = new Date(T0.getTime() + 2 * 3_600_000);
    await at(closedAt);
    const { after } = await completeOrder(wo.id, wo.version);
    const doneAt = (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ done_at: Date }>('SELECT done_at FROM work_order WHERE id = $1', [wo.id]),
      )
    ).rows[0]!.done_at;
    expect(doneAt.toISOString()).toBe(closedAt.toISOString());
    expect(await anchors(photo, after)).toEqual([doneAt.toISOString(), doneAt.toISOString()]);

    const due = plusMonths(doneAt, MONTHS);
    const early = await purge(new Date(due.getTime() - DAY));
    expect(early.failed).toBe(0);
    expect((await rows(photo, after)).map((r) => r.purged_at)).toEqual([null, null]);
    const late = await purge(new Date(due.getTime() + DAY));
    expect(late).toMatchObject({ failed: 0, anchorMissing: 0 });
    expect(late.purged).toBeGreaterThanOrEqual(2);
    for (const r of await rows(photo, after)) {
      expect(r.purged_at).not.toBeNull();
      expect(r.purge_reason).toBe('retention');
      expect(r.destroyed_at).not.toBeNull();
    }
    expect((await call('fd', 'GET', `/attachments/${photo}`)).statusCode).toBe(404);
  });

  it('(2) done → reopen clears the anchor of every photo; closing again sets the new close time', async () => {
    const { wo, photo } = await openOrder('302');
    const first = new Date(T0.getTime() + 3_600_000);
    await at(first);
    const { after, version } = await completeOrder(wo.id, wo.version);
    expect(await anchors(photo, after)).toEqual([first.toISOString(), first.toISOString()]);
    await at(new Date(T0.getTime() + 2 * DAY));
    const re = await act('fd', wo.id, 'reopen', version, { note: 'Lại rỉ nước' });
    expect(re.statusCode, re.body).toBe(200);
    expect(await anchors(photo, after)).toEqual([null, null]);
    // J16 long after the first close: nothing purged while the order is open again.
    await purge(plusMonths(first, MONTHS + 1));
    expect((await rows(photo, after)).map((r) => r.purged_at)).toEqual([null, null]);
    const second = new Date(T0.getTime() + 3 * DAY);
    await at(second);
    const again = await act('mt', wo.id, 'complete', re.json().version, {
      resultNote: 'Thay ron',
    });
    expect(again.statusCode, again.body).toBe(200);
    expect(await anchors(photo, after)).toEqual([second.toISOString(), second.toISOString()]);
  });

  it('(3) work order cancelled: the report photo is anchored at the cancel time and purged after the retention', async () => {
    const { wo, photo } = await openOrder('402');
    const cancelAt = new Date(T0.getTime() + 30 * 60_000);
    await at(cancelAt);
    const c = await act('fd', wo.id, 'cancel', wo.version, { cancelReason: 'Báo nhầm căn' });
    expect(c.statusCode, c.body).toBe(200);
    expect(c.json().status).toBe('cancelled');
    expect(await anchors(photo)).toEqual([cancelAt.toISOString()]);
    const due = plusMonths(cancelAt, MONTHS);
    await purge(new Date(due.getTime() - DAY));
    expect((await rows(photo))[0]!.purged_at).toBeNull();
    await purge(new Date(due.getTime() + DAY));
    expect((await rows(photo))[0]).toMatchObject({ purge_reason: 'retention' });
    expect((await rows(photo))[0]!.destroyed_at).not.toBeNull();
  });

  it('(4) inspection: photos anchored at performedAt (offline, 2 h before the server received it)', async () => {
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since)
         VALUES ($1, $2, $3, 'VC', $4)
         ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, since = EXCLUDED.since`,
        [room('401'), t.organizationId, t.propertyIds[0], new Date(T0.getTime() - DAY)],
      ),
    );
    const cl = (await call('fdl', 'GET', `/inspection-checklist?roomId=${room('401')}`)).json() as {
      version: number;
      items: Array<{ code: string; required: boolean }>;
    };
    const photo = await upload('fdl', 'inspection');
    const performedAt = new Date(T0.getTime() - 2 * 3_600_000);
    const r = await call('fdl', 'POST', `/rooms/${room('401')}/inspections`, {
      json: {
        checklistVersion: cl.version,
        items: cl.items.map((i) => ({ code: i.code, passed: true })),
        photoAttachmentIds: [photo],
        performedAt: performedAt.toISOString(),
      },
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(await anchors(photo)).toEqual([performedAt.toISOString()]);
    const due = plusMonths(performedAt, MONTHS);
    await purge(new Date(due.getTime() - DAY));
    expect((await rows(photo))[0]!.purged_at).toBeNull();
    await purge(new Date(due.getTime() + DAY));
    expect((await rows(photo))[0]).toMatchObject({ purge_reason: 'retention' });
  });

  it('(5) penalty evidence: uploaded after checked_out / cancelled / no_show → anchored at the upload; in_house → NULL until the checkout anchors it', async () => {
    const out = await seedStay(db, t, ids, { roomNo: '201', status: 'in_house' });
    await setStayStatus(db, t, out.reservationId, 'checked_out', {
      actualCheckoutAt: new Date(T0.getTime() - DAY),
    });
    const cancelled = await seedStay(db, t, ids, { roomNo: '202', status: 'cancelled' });
    const noShow = await seedStay(db, t, ids, { roomNo: '203', status: 'no_show' });
    const inHouse = await seedStay(db, t, ids, { roomNo: '101', status: 'in_house' });
    const upAt = new Date(T0.getTime() + 3_600_000);
    await at(upAt);
    const pOut = await upload('fd', 'penalty_evidence', out.reservationId);
    const pCancel = await upload('fd', 'penalty_evidence', cancelled.reservationId);
    const pNoShow = await upload('fd', 'penalty_evidence', noShow.reservationId);
    const pIn = await upload('fd', 'penalty_evidence', inHouse.reservationId);
    // Other purposes are never anchored at upload.
    const receipt = await upload('fd', 'deposit_receipt', out.reservationId);
    expect(await anchors(pOut, pCancel, pNoShow, pIn, receipt)).toEqual([
      upAt.toISOString(),
      upAt.toISOString(),
      upAt.toISOString(),
      null,
      null,
    ]);
    // A later bind (folio line of BR-427 c) keeps the upload anchor (bindTo: COALESCE).
    await db.withContext(t.ctx(), (tx) =>
      svc().bindTo(tx, pOut, { type: 'folio_line', id: '00000000-0000-7000-8000-000000000001' }),
    );
    expect(await anchors(pOut)).toEqual([upAt.toISOString()]);
    // The checkout of the in-house stay anchors its evidence (registration onCheckedOut → this call).
    const coAt = new Date(T0.getTime() + 2 * DAY);
    await db.withContext(t.ctx(), (tx) =>
      svc().setRetentionAnchor(
        tx,
        { reservationId: inHouse.reservationId, purpose: 'penalty_evidence' },
        coAt,
      ),
    );
    expect(await anchors(pIn)).toEqual([coAt.toISOString()]);
  });

  it('(5b) penalty evidence uploaded BEFORE a cancellation / no-show: anchored when the booking is cancelled / marked no-show (registration `transitioned` hook → onReservationVoided); a restored no-show is raised again at its checkout', async () => {
    const regs = fa.app.get(RegistrationService);
    const c = await seedStay(db, t, ids, { roomNo: '201', status: 'confirmed' });
    const n = await seedStay(db, t, ids, { roomNo: '202', status: 'confirmed' });
    const pC = await upload('fd', 'penalty_evidence', c.reservationId);
    const pN = await upload('fd', 'penalty_evidence', n.reservationId);
    expect(await anchors(pC, pN)).toEqual([null, null]);
    const endAt = new Date(T0.getTime() + 6 * 3_600_000);
    await at(endAt);
    await setStayStatus(db, t, c.reservationId, 'cancelled');
    await setStayStatus(db, t, n.reservationId, 'no_show');
    for (const r of [c, n]) {
      await db.withContext(t.ctx(), (tx) => regs.onReservationVoided(tx, r.reservationId));
    }
    expect(await anchors(pC, pN)).toEqual([endAt.toISOString(), endAt.toISOString()]);
    // Restored no-show, later checked out: the checkout anchor is later → it wins (only later).
    const coAt = new Date(T0.getTime() + 3 * DAY);
    await db.withContext(t.ctx(), (tx) =>
      svc().setRetentionAnchor(
        tx,
        { reservationId: n.reservationId, purpose: 'penalty_evidence' },
        coAt,
      ),
    );
    expect(await anchors(pN)).toEqual([coAt.toISOString()]);
  });

  /** Statements run as ottimo_owner (FORCE RLS: the tenant's property only), like the migrator would. */
  const asOwner = async (statements: Array<{ sql: string; params?: unknown[] }>) => {
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('SET ROLE ottimo_owner');
      await pg.query('BEGIN');
      await pg.query(
        `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
        [t.organizationId, t.propertyIds[0]],
      );
      for (const st of statements) await pg.query(st.sql, st.params ?? []);
      await pg.query('COMMIT');
    } catch (e) {
      await pg.query('ROLLBACK').catch(() => undefined);
      throw e;
    } finally {
      await pg.end();
    }
  };
  /** The data statements of a migration as shipped (its ALTER TABLE … RLS toggles left out – RLS stays on). */
  const migrationData = (file: string) =>
    readFileSync(join(__dirname, '../../src/db/migrations', file), 'utf8')
      .split('--> statement-breakpoint')
      .map((x) => x.replace(/^\s*--.*$/gm, '').trim())
      .filter((x) => x.length > 0 && !/^ALTER TABLE/i.test(x))
      .map((sql) => ({ sql }));

  it('(6) migration 0078: old-shape rows (anchor NULL) get done_at / updated_at / inspected_at / actual_checkout_at; open orders, in-house evidence and existing anchors untouched', async () => {
    // work orders: done, cancelled, still open
    const done = await openOrder('301');
    await at(new Date(T0.getTime() + 3_600_000));
    const { after } = await completeOrder(done.wo.id, done.wo.version);
    const cancelled = await openOrder('302');
    await act('fd', cancelled.wo.id, 'cancel', cancelled.wo.version, { cancelReason: 'Trùng' });
    const open = await openOrder('402');
    // inspection
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since)
         VALUES ($1, $2, $3, 'VC', $4)
         ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, since = EXCLUDED.since`,
        [room('401'), t.organizationId, t.propertyIds[0], new Date(T0.getTime() - DAY)],
      ),
    );
    const cl = (await call('fdl', 'GET', `/inspection-checklist?roomId=${room('401')}`)).json();
    const insPhoto = await upload('fdl', 'inspection');
    const ins = await call('fdl', 'POST', `/rooms/${room('401')}/inspections`, {
      json: {
        checklistVersion: cl.version,
        items: (cl.items as Array<{ code: string }>).map((i) => ({ code: i.code, passed: true })),
        photoAttachmentIds: [insPhoto],
        performedAt: new Date(T0.getTime() + 30 * 60_000).toISOString(),
      },
    });
    expect(ins.statusCode, ins.body).toBe(201);
    // penalty evidence: checked out (bound), no-show without checkout time (bound), in house (bound),
    // checked out but never bound (J16 'unbound' handles it)
    const out = await seedStay(db, t, ids, { roomNo: '201', status: 'in_house' });
    const ns = await seedStay(db, t, ids, { roomNo: '202', status: 'no_show' });
    const inH = await seedStay(db, t, ids, { roomNo: '203', status: 'in_house' });
    const pOut = await upload('fd', 'penalty_evidence', out.reservationId);
    const pNs = await upload('fd', 'penalty_evidence', ns.reservationId);
    const pIn = await upload('fd', 'penalty_evidence', inH.reservationId);
    const pUnbound = await upload('fd', 'penalty_evidence', out.reservationId);
    const checkoutAt = new Date(T0.getTime() + 5 * 3_600_000);
    await setStayStatus(db, t, out.reservationId, 'checked_out', { actualCheckoutAt: checkoutAt });
    for (const [i, p] of [pOut, pNs, pIn].entries()) {
      await db.withContext(t.ctx(), (tx) =>
        svc().bindTo(tx, p, { type: 'folio_line', id: `00000000-0000-7000-8000-00000000000${i}` }),
      );
    }
    // An inspection photo with an anchor already (must not move).
    const kept = new Date('2026-01-01T00:00:00.000Z');
    const all = [
      done.photo,
      after,
      cancelled.photo,
      open.photo,
      insPhoto,
      pOut,
      pNs,
      pIn,
      pUnbound,
    ];
    // The shape before the fix: every anchor NULL; one more inspection photo already anchored (must not move).
    await asOwner([
      {
        sql: 'UPDATE attachment SET retention_anchor_at = NULL WHERE id = ANY($1::uuid[])',
        params: [all],
      },
    ]);
    const extra = await upload('fdl', 'inspection');
    await db.withContext(t.ctx(), (tx) =>
      svc().bindTo(
        tx,
        extra,
        { type: 'inspection', id: ins.json().id },
        { retentionAnchorAt: kept },
      ),
    );
    expect(await anchors(...all)).toEqual(all.map(() => null));

    const data = migrationData('0078_attachment_retention_anchor_backfill.sql');
    expect(data).toHaveLength(3);
    await asOwner(data);

    const wo = async (id: string) =>
      (
        await db.withContext(t.ctx(), (tx) =>
          tx.query<{ done_at: Date | null; updated_at: Date }>(
            'SELECT done_at, updated_at FROM work_order WHERE id = $1',
            [id],
          ),
        )
      ).rows[0]!;
    const insAt = (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ inspected_at: Date }>('SELECT inspected_at FROM inspection WHERE id = $1', [
          ins.json().id,
        ]),
      )
    ).rows[0]!.inspected_at;
    const uploadedAt = (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ uploaded_at: Date }>('SELECT uploaded_at FROM attachment WHERE id = $1', [pNs]),
      )
    ).rows[0]!.uploaded_at;
    const doneAt = (await wo(done.wo.id)).done_at!.toISOString();
    expect(await anchors(...all, extra)).toEqual([
      doneAt,
      doneAt,
      (await wo(cancelled.wo.id)).updated_at.toISOString(),
      null, // open order
      insAt.toISOString(),
      checkoutAt.toISOString(),
      uploadedAt.toISOString(), // no_show: no checkout time → upload time
      null, // in house: the checkout will anchor it
      null, // never bound: J16 'unbound'
      kept.toISOString(), // existing anchor not moved
    ]);
    // Idempotent.
    await asOwner(data);
    expect((await anchors(...all, extra))[9]).toBe(kept.toISOString());
  });

  /**
   * The whole 0078 file as the migrator runs it: ottimo_owner, NO tenant context (`app_current_property()`
   * unset). Inside a transaction that is rolled back (the shared test DB keeps its rows). The four tables are
   * locked first with NOWAIT (retried) so this test never waits while holding a lock – no deadlock with the
   * other test files.
   */
  async function asMigrator<T>(fn: (pg: PgClient) => Promise<T>): Promise<T> {
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('SET ROLE ottimo_owner');
      for (let i = 0; ; i++) {
        await pg.query('BEGIN');
        try {
          await pg.query(
            'LOCK TABLE attachment, work_order, inspection, reservation IN ACCESS EXCLUSIVE MODE NOWAIT',
          );
          break;
        } catch (e) {
          await pg.query('ROLLBACK');
          if (i >= 400) throw e;
          await new Promise((r) => setTimeout(r, 25));
        }
      }
      try {
        return await fn(pg);
      } finally {
        await pg.query('ROLLBACK');
      }
    } finally {
      await pg.end();
    }
  }

  it('(6b) ARC S4-22: 0078 must turn RLS off while it back-fills – the shipped file (RLS toggles included) updates the rows as the migrator (no tenant context); the same UPDATEs with FORCE RLS on update none', async () => {
    const { wo, photo } = await openOrder('301');
    await at(new Date(T0.getTime() + 3_600_000));
    const { after } = await completeOrder(wo.id, wo.version);
    const out = await seedStay(db, t, ids, { roomNo: '201', status: 'in_house' });
    const p = await upload('fd', 'penalty_evidence', out.reservationId);
    await db.withContext(t.ctx(), (tx) =>
      svc().bindTo(tx, p, { type: 'folio_line', id: '00000000-0000-7000-8000-0000000000b1' }),
    );
    const checkoutAt = new Date(T0.getTime() + 4 * 3_600_000);
    await setStayStatus(db, t, out.reservationId, 'checked_out', { actualCheckoutAt: checkoutAt });
    const mine = [photo, after, p];
    await asOwner([
      {
        sql: 'UPDATE attachment SET retention_anchor_at = NULL WHERE id = ANY($1::uuid[])',
        params: [mine],
      },
    ]);
    const file = readFileSync(
      join(__dirname, '../../src/db/migrations/0078_attachment_retention_anchor_backfill.sql'),
      'utf8',
    )
      .split('--> statement-breakpoint')
      .map((x) => x.replace(/^\s*--.*$/gm, '').trim())
      .filter((x) => x.length > 0);
    const updates = file.filter((x) => /^UPDATE/i.test(x));
    expect(updates).toHaveLength(3);
    expect(file.filter((x) => /DISABLE ROW LEVEL SECURITY/.test(x))).toHaveLength(4);
    const anchorsSql = 'SELECT id, retention_anchor_at FROM attachment WHERE id = ANY($1::uuid[])';

    // Control: RLS left on (FORCE binds the owner) and no tenant context → 0 rows, nothing anchored.
    const control = await asMigrator(async (pg) => {
      const counts: number[] = [];
      for (const sql of updates) counts.push((await pg.query(sql)).rowCount ?? 0);
      const seen = (await pg.query(anchorsSql, [mine])).rows;
      return { counts, seen };
    });
    expect(control.counts).toEqual([0, 0, 0]);
    expect(control.seen).toEqual([]); // the owner cannot even read them with RLS on

    // The file as shipped: RLS off → this tenant's rows are back-filled (other tenants may add more).
    const shipped = await asMigrator(async (pg) => {
      const counts: number[] = [];
      for (const sql of file) {
        const r = await pg.query(sql);
        if (/^UPDATE/i.test(sql)) counts.push(r.rowCount ?? 0);
      }
      await pg.query('ALTER TABLE attachment NO FORCE ROW LEVEL SECURITY');
      await pg.query('ALTER TABLE attachment DISABLE ROW LEVEL SECURITY');
      const seen = (
        await pg.query<{ id: string; retention_anchor_at: Date | null }>(anchorsSql, [mine])
      ).rows;
      return { counts, seen };
    });
    expect(shipped.counts[0]).toBeGreaterThanOrEqual(2); // work-order photos
    expect(shipped.counts[2]).toBeGreaterThanOrEqual(1); // penalty evidence
    const byId = new Map(shipped.seen.map((r) => [r.id, r.retention_anchor_at?.toISOString()]));
    const doneAt = new Date(T0.getTime() + 3_600_000).toISOString();
    expect([byId.get(photo), byId.get(after), byId.get(p)]).toEqual([
      doneAt,
      doneAt,
      checkoutAt.toISOString(),
    ]);
    // Rolled back: the shared DB is unchanged.
    expect(await anchors(...mine)).toEqual([null, null, null]);
  });

  it('(7) J16 safety net: a bound photo without anchor after the retention since upload is counted (anchorMissing) and journalled, never purged', async () => {
    const { wo, photo } = await openOrder('102'); // open order: bound, no anchor
    const inH = await seedStay(db, t, ids, { roomNo: '101', status: 'in_house' });
    const p = await upload('fd', 'penalty_evidence', inH.reservationId);
    await db.withContext(t.ctx(), (tx) =>
      svc().bindTo(tx, p, { type: 'folio_line', id: '00000000-0000-7000-8000-00000000000a' }),
    );
    const due = plusMonths(T0, MONTHS);
    expect((await purge(new Date(due.getTime() - DAY))).anchorMissing).toBe(0);
    const r = await purge(new Date(due.getTime() + DAY));
    expect(r.anchorMissing).toBe(2);
    expect((await rows(photo, p)).map((x) => x.purged_at)).toEqual([null, null]);
    // Through the J16 job: journalled as `anchor_missing` (count only).
    const now = new Date(due.getTime() + 2 * DAY);
    fa.clock.set(now);
    const stats = await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RetentionService).run(tx, TZ, { force: true }),
    );
    expect(stats.attachmentAnchorMissing).toBe(2);
    const journal = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ items_count: number; status: string; error: string | null }>(
        `SELECT items_count, status, error FROM retention_run WHERE policy_key = 'anchor_missing' AND run_at = $1`,
        [now],
      ),
    );
    expect(journal.rows).toEqual([{ items_count: 2, status: 'done', error: null }]);
    // Closing the order anchors it: no longer counted.
    await at(new Date(T0.getTime() + 3_600_000));
    await act('fd', wo.id, 'cancel', wo.version, { cancelReason: 'Không còn rỉ' });
    expect((await purge(new Date(due.getTime() + DAY))).anchorMissing).toBe(1);
  });
});
