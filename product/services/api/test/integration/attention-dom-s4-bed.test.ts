/**
 * "Cần chú ý" – DOM v0.3.8 fixes of BE-D (Round 2 Sprint 4, Phản hồi & sửa) on the real PostgreSQL, run against the
 * oracles of product/tests/fixtures/br-examples.json:
 * - BR-311-02 (DOM-S4-07): a booking past its arrival business date and still `confirmed` stays in the mark line –
 *   it no longer drops out at the 06:00 rollover; an ETA still ahead keeps it out of the lines until it passes.
 * - BR-956-01 (DOM-S4-11): `vip_arrival` = booker tagged VIP / Khách quen OR booker with a checked-out stay
 *   (returning guest, no tag needed); checked in → no line; no name in params (SEC J).
 * FAKE data only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { seedStay, setStayStatus, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

interface Oracle {
  id: string;
  pendingFix?: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}
const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Oracle[] };
const oracle = (id: string): Oracle => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

interface Item {
  kind: string;
  severity: string;
  reservationIds?: string[];
  refCode?: string;
  params?: Record<string, unknown>;
}

describe.skipIf(!HAS_DB)('"Cần chú ý" – DOM v0.3.8 oracles (BE-D Sprint 4)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;

  beforeAll(async () => {
    db = appDatabase(5);
    t = await createTenant(db, { users: { fd: ['front_desk'], mgr: ['manager'] } });
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const attention = async (): Promise<Item[]> => {
    const r = await staff(fa, t.users.fd!.sessionToken, null, 'GET', `${P(t)}/attention`);
    expect(r.statusCode, r.body).toBe(200);
    return r.json().data as Item[];
  };
  const businessDate = async (): Promise<string> => {
    const r = await staff(fa, t.users.mgr!.sessionToken, null, 'GET', `${P(t)}/dashboard/tonight`);
    expect(r.statusCode, r.body).toBe(200);
    return r.json().businessDate as string;
  };
  const booking = async (code: string, roomNo: string, arrival: string, departure: string) => {
    const s = await seedStay(db, t, ids, { roomNo, arrival, departure });
    await q('UPDATE reservation SET code = $2 WHERE id = $1', [s.reservationId, code]);
    const [{ booker }] = (await q<{ booker: string }>(
      'SELECT booker_guest_id AS booker FROM reservation WHERE id = $1',
      [s.reservationId],
    )) as [{ booker: string }];
    return { id: s.reservationId, booker };
  };

  it('BR-956-01: VIP tag or a booker who already stayed (checked out) → one line each; in house → none; no names', async () => {
    const o = oracle('BR-956-01');
    await at('2026-10-20T09:00:00+07:00');
    const day = o.input.businessDate as string;
    const vip = await booking('OTM-00180', '101', day, '2026-10-22');
    const back = await booking('OTM-00181', '102', day, '2026-10-22');
    await booking('OTM-00182', '103', day, '2026-10-22'); // "maybe returning" from documents – not counted
    const inHouse = await booking('OTM-00183', '201', day, '2026-10-22');
    await q(`UPDATE guest SET tags = ARRAY['VIP'] WHERE id = $1`, [vip.booker]);
    await q(`UPDATE guest SET tags = ARRAY['Khách quen'] WHERE id = $1`, [inHouse.booker]);
    await setStayStatus(db, t, inHouse.id, 'in_house', {
      actualCheckinAt: new Date('2026-10-20T08:30:00+07:00'),
    });
    // OTM-00181's booker stayed 05–07/10 (checked out) – no tag.
    const past = await seedStay(db, t, ids, {
      roomNo: '101',
      arrival: '2026-10-05',
      departure: '2026-10-07',
    });
    await q('UPDATE reservation SET booker_guest_id = $2 WHERE id = $1', [
      past.reservationId,
      back.booker,
    ]);
    await setStayStatus(db, t, past.reservationId, 'checked_out', {
      actualCheckinAt: new Date('2026-10-05T14:00:00+07:00'),
      actualCheckoutAt: new Date('2026-10-07T11:00:00+07:00'),
    });
    const lines = (await attention()).filter((i) => i.kind === 'vip_arrival');
    expect(lines.map((l) => l.refCode).sort()).toEqual(
      [...(o.expected.vipArrivalRefCodes as string[])].sort(),
    );
    expect(lines.some((l) => l.params !== undefined)).toBe(o.expected.namesInParams);
    // The past stay of the IN-HOUSE booker does not matter: checked in → no line.
    expect(lines.some((l) => l.reservationIds?.includes(inHouse.id))).toBe(false);
  });

  it('BR-311-02: ETA 01:30 – not in the lines at 23:00, "cần đánh dấu" after 01:31, still there after the 06:00 rollover', async () => {
    const o = oracle('BR-311-02');
    const input = o.input as {
      arrivalDate: string;
      etaTime: string;
      checks: Array<{ key: string; at: string }>;
    };
    const expected = o.expected as {
      attentionKind: Record<string, string | null>;
      businessDate: Record<string, string>;
    };
    await at('2026-10-20T10:00:00+07:00');
    const late = await booking('OTM-00190', '202', input.arrivalDate, '2026-10-22');
    await q(`UPDATE reservation SET eta_time = $2 WHERE id = $1`, [late.id, input.etaTime]);
    for (const c of input.checks) {
      await at(c.at);
      const kinds = (await attention())
        .filter((i) => i.kind === 'no_show_call' || i.kind === 'no_show_mark')
        .filter((i) => i.reservationIds?.includes(late.id))
        .map((i) => i.kind);
      const want = expected.attentionKind[c.key];
      expect(kinds, c.key).toEqual(want ? [want] : []);
      if (expected.businessDate[c.key]) {
        expect(await businessDate(), c.key).toBe(expected.businessDate[c.key]);
      }
    }
    // Past its arrival day, the mark line is critical and comes before tonight's call time (06:00 < 18:00).
    const mark = (await attention()).find((i) => i.kind === 'no_show_mark')!;
    expect(mark.severity).toBe('critical');
    // Marked as no-show → the line goes.
    await setStayStatus(db, t, late.id, 'no_show');
    expect(
      (await attention()).some(
        (i) => i.kind === 'no_show_mark' && i.reservationIds?.includes(late.id),
      ),
    ).toBe(false);
  });
});
