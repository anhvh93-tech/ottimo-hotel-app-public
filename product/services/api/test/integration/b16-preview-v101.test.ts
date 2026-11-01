/**
 * BE-A v1.0.1 (OpenAPI 0.3.9, ADR-015) – B16 `earlyDeparture` preview on the real PostgreSQL through HTTP:
 * - oracle BR-428-01…06 (`tests/fixtures/br-examples.json`) through the dry run AND the write, same numbers
 *   (field names: oracle `refundVnd` = contract `refundableVnd`, `refundBaseVnd` = `droppedNetVnd`);
 * - FB-R3-SEC-ARC-03: a dry run leaves NOTHING – every row of the tenant (all tables with organization_id /
 *   property_id, md5 of the rows) is the same before and after, with the real registration / guest-access / child-data
 *   ports and a stay that has a foreign document, an extension child booking cancelled whole, a late checkout charge
 *   of the old departure day; no SSE notification is delivered. Gaps in `audit_event` / `state_transition` /
 *   `purge_journal` ids (sequences are not transactional) are normal and not compared;
 * - FB-R3-SEC-ARC-02: the preview answers the STORED booking (`version`, ETag, departure) – a change between preview
 *   and write → 412;
 * - 409 AMOUNT_CHANGED writes nothing (the same Idempotency-Key then succeeds); refundCapped; back-dated notice →
 *   `evidenceRequired` in the preview, 422 on the write without evidence;
 * - FB-R3-SEC-ARC-01: Database.simulate – no dry run outside it, nothing kept when its handler returns normally, the
 *   database refuses to commit a `simulation_guard` row, transaction control refused, a failed ROLLBACK destroys the
 *   connection; FB-R3-SEC-ARC-06: `dryRun: "true"` still needs the headers, a forbidden role gets 403.
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client as PgClient, type Notification } from 'pg';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { ApprovalService } from '../../src/modules/approvals/public/approval.service';
import { SSE_CHANNEL } from '../../src/modules/events/public/events.service';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { ReservationHooks } from '../../src/modules/reservations/public/reservation-hooks';
import { NoMinibarPort } from '../../src/modules/frontdesk/internal/default-ports';
import { StaySupport, FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import { StayService } from '../../src/modules/frontdesk/internal/stay.service';
import {
  FD_CHILD_DATA_PORT,
  FD_GUEST_ACCESS_PORT,
  FD_REGISTRATION_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskGuestAccessPort,
  type FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { sampleJpeg, staff } from '../helpers/registration-fixture';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

/** The real registration port, except that check-in does not wait for the documents (not under test here). */
function docsOkOver(real: FrontdeskRegistrationPort): FrontdeskRegistrationPort {
  return new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === 'checkinDocumentStatus') {
        return async (): Promise<CheckinDocumentStatus> => ({
          mainGuestDocument: true,
          documentCheckBlock: false,
          pendingOnlineCheckin: false,
          visaExpiresBeforeDeparture: false,
          passportExpiresDuringStay: false,
        });
      }
      const v = Reflect.get(target, prop, receiver) as unknown;
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
  });
}

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fd: ['front_desk'],
  hk: ['housekeeping'],
};

const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  examples: Array<{
    id: string;
    input: Record<string, unknown>;
    expected: Record<string, unknown>;
  }>;
};
const oracle = (id: string) => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

type Booking = { id: string; code: string; version: number; folioId: string };
type Res = Awaited<ReturnType<Client['get']>>;

describe.skipIf(!HAS_DB)('B16 early departure – dry run preview (OpenAPI 0.3.9, ADR-015)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  let owner: PgClient;
  const companions: string[] = [];
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Schmidt Emma' });
    companions.push(await seedGuestRow(db, t, { name: 'Lê Bạn Một' }));
    companions.push(await seedGuestRow(db, t, { name: 'Lê Bạn Hai' }));
    companions.push(await seedGuestRow(db, t, { name: 'Lê Bạn Ba' }));
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (
            reg: FrontdeskRegistrationPort,
            access: FrontdeskGuestAccessPort,
            child: FrontdeskChildDataPort,
          ) => new FrontdeskPorts(docsOkOver(reg), access, child, new NoMinibarPort()),
          inject: [FD_REGISTRATION_PORT, FD_GUEST_ACCESS_PORT, FD_CHILD_DATA_PORT],
        }),
    });
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
    const token = randomBytes(32).toString('base64url');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash, created_at, expires_at)
         VALUES ($1, $2, $3, 'desk', 'desk', $4, $5, $6)`,
        [
          uuidv7(),
          t.organizationId,
          t.propertyIds[0],
          sha256Hex(token),
          new Date('2026-10-01T00:00:00Z'),
          new Date('2027-06-30T00:00:00Z'),
        ],
      ),
    );
    c.fd!.deviceToken = token;
    c.mgr!.deviceToken = token;
    c.hk!.deviceToken = token;
    await setPassword(db, t, 'mgr');
    // FB-R3-SEC-ARC-03 (1): the owner role reads every row of the tenant (RLS forced – context set per snapshot).
    owner = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await owner.connect();
    await owner.query('SET ROLE ottimo_owner');
  });
  afterAll(async () => {
    await owner?.end();
    await fa?.close();
    await db?.close();
  });

  const url = (path = '') => `${P(t)}${path}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const version = async (id: string) =>
    (await c.fd!.get(url(`/reservations/${id}`))).json().version as number;
  const act = async (
    id: string,
    verb: string,
    body: unknown,
    who = 'fd',
    headers: Record<string, string> = {},
  ) =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${await version(id)}"`,
      ...headers,
    });
  /** The desk's dry run: NO Idempotency-Key, NO If-Match (only the session, device and CSRF). */
  const preview = (id: string, body: Record<string, unknown>, who = 'fd'): Promise<Res> =>
    fa.app.inject({
      method: 'POST',
      url: url(`/reservations/${id}/actions/early-departure`),
      headers: c[who]!.headers({}, true),
      payload: { ...body, dryRun: true },
    });
  const create = async (body: Record<string, unknown>) => {
    const res = await c.fd!.send('POST', url('/reservations'), body);
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const vacant = (room: string) =>
    q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms[room]]);
  const dates = (from: string, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const d = new Date(`${from}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
  const direct = (room: string, from: string, to: string, paid: number, rate?: number) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      ...(rate
        ? {
            nightlyRates: dates(
              from,
              Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000),
            ).map((date) => ({ date, amountVnd: rate })),
          }
        : {}),
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: paid },
    });
  const ota = (room: string, from: string, to: string, amount: number, adults = 2) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.agoda,
      adults,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: amount,
      arrivalDate: from,
      departureDate: to,
    });
  const checkIn = async (b: Booking) => {
    const r = await act(b.id, 'check-in', { cardsIssued: 1, houseRulesSent: true });
    expect(r.statusCode, r.body).toBe(200);
  };
  const folio = async (b: Booking) => (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
  const pay = async (b: Booking, amountVnd: number) => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
      type: 'charge',
      method: 'cash',
      amountVnd,
    });
    expect(r.statusCode, r.body).toBe(201);
  };
  const refunds = (id: string) =>
    q<{ amount_vnd: number }>(
      `SELECT amount_vnd FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY created_at`,
      [id],
    );

  /**
   * FB-R3-SEC-ARC-03 (1): every row of the tenant – each table with organization_id (else property_id), plus the
   * organization row – as count + md5 of the rows in text form. Sequences are not part of it (gaps are normal).
   */
  const snapshot = async (): Promise<Record<string, string>> => {
    await owner.query('BEGIN READ ONLY');
    try {
      await owner.query(
        `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
        [t.organizationId, t.propertyIds[0]],
      );
      const { rows: tables } = await owner.query<{ name: string; col: string }>(
        `SELECT c.relname AS name,
                CASE WHEN EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid
                                   AND a.attname = 'organization_id' AND NOT a.attisdropped)
                     THEN 'organization_id' ELSE 'property_id' END AS col
           FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
            AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid
                         AND a.attname IN ('organization_id', 'property_id') AND NOT a.attisdropped)
          ORDER BY 1`,
      );
      expect(tables.length).toBeGreaterThan(60);
      const out: Record<string, string> = {};
      for (const tb of tables) {
        const tenant = tb.col === 'organization_id' ? t.organizationId : t.propertyIds[0];
        const { rows } = await owner.query<{ n: number; h: string }>(
          `SELECT count(*)::int AS n, md5(coalesce(string_agg(x::text, '|' ORDER BY x::text), '')) AS h
             FROM "${tb.name}" x WHERE x.${tb.col} = $1`,
          [tenant],
        );
        out[tb.name] = `${rows[0]!.n}:${rows[0]!.h}`;
      }
      const org = await owner.query<{ h: string }>(
        `SELECT md5(x::text) AS h FROM organization x WHERE x.id = $1`,
        [t.organizationId],
      );
      out.organization = org.rows[0]!.h;
      return out;
    } finally {
      await owner.query('ROLLBACK');
    }
  };
  /**
   * BR-428 v0.4.8 / OpenAPI 0.3.9 add 2 – invariants of EVERY B16 answer (preview and write):
   * (a) the three refunded parts add up to `refundVnd`; (b) per item refunded + reversed-only = reversed (both ≥ 0,
   * split in the order extra-person → room change → BR-428 part); `refundablePaidVnd` ≤ `refundableVnd`;
   * `refundCapped` ⇔ refundVnd < everything that could have been refunded.
   */
  const invariants = (r: Res) => {
    if (r.statusCode !== 200) return;
    const j = r.json() as Record<string, number | boolean>;
    const n = (k: string) => j[k] as number;
    for (const k of [
      'extraPersonRefundVnd',
      'extraPersonReversedVnd',
      'roomChangeDifferenceVnd',
      'roomChangeDifferenceReversedVnd',
      'refundablePaidVnd',
    ]) {
      expect(n(k), k).toBeGreaterThanOrEqual(0);
    }
    expect(n('extraPersonRefundVnd') + n('roomChangeDifferenceVnd') + n('refundablePaidVnd')).toBe(
      n('refundVnd'),
    );
    expect(n('refundablePaidVnd')).toBeLessThanOrEqual(n('refundableVnd'));
    const wanted =
      n('refundableVnd') +
      n('extraPersonRefundVnd') +
      n('extraPersonReversedVnd') +
      n('roomChangeDifferenceVnd') +
      n('roomChangeDifferenceReversedVnd');
    expect(j.refundCapped).toBe(n('refundVnd') < wanted);
    // order: a later item gets money only when every earlier one is refunded in full
    if (n('roomChangeDifferenceVnd') > 0) expect(n('extraPersonReversedVnd')).toBe(0);
    if (n('refundablePaidVnd') > 0) {
      expect(n('extraPersonReversedVnd')).toBe(0);
      expect(n('roomChangeDifferenceReversedVnd')).toBe(0);
    }
  };
  /** Dry run that must leave every row of the tenant as it was. */
  const cleanPreview = async (id: string, body: Record<string, unknown>, who = 'fd') => {
    const before = await snapshot();
    const res = await preview(id, body, who);
    expect(res.statusCode, res.body).toBe(200);
    expect(await snapshot()).toEqual(before);
    invariants(res);
    return res;
  };
  /** Write with the numbers of the preview (the desk's flow). */
  const commit = async (id: string, body: Record<string, unknown>, shown: Res) => {
    const res = await act(id, 'early-departure', {
      ...body,
      expectedRefundVnd: shown.json().refundVnd,
      expectedFeeVnd: shown.json().earlyDepartureFeeVnd,
    });
    invariants(res);
    return res;
  };
  /** The early departure fee lines written by B16 (description + labelParams – oracle BR-428-09). */
  const feeLines = (b: Booking) =>
    q<{ description: string; label_params: Record<string, unknown>; charge_code: string | null }>(
      `SELECT description, label_params, charge_code FROM folio_line
        WHERE folio_id = $1 AND category = 'early_departure_fee' AND reversal_of_id IS NULL
        ORDER BY charge_code NULLS FIRST`,
      [b.folioId],
    );
  /** Preview and write give the same numbers (ADR-015 test (2)). */
  const NUMBERS = [
    'earlyDepartureFeeVnd',
    'refundVnd',
    'extraPersonRefundVnd',
    'extraPersonReversedVnd',
    'noticeDays',
    'noticeBusinessDate',
    'droppedNights',
    'droppedNetVnd',
    'refundableVnd',
    'roomChangeDifferenceVnd',
    'roomChangeDifferenceReversedVnd',
    'refundablePaidVnd',
    'refundCapped',
    'otaRetainedMaxVnd',
    'otaRetainedRequired',
    'evidenceRequired',
    'childBookings',
    'registrationNeedsUpdate',
  ];
  const numbers = (r: Res) =>
    Object.fromEntries(NUMBERS.map((k) => [k, (r.json() as Record<string, unknown>)[k]]));

  it('BR-428-01…04: 4 nights × 700.000 (paid in full) – preview = write, the preview leaves nothing', async () => {
    const o1 = oracle('BR-428-01');
    const rate = o1.input.nightRateVnd as number;
    await at('2026-10-20T15:00:00+07:00');
    const rooms = { '01': '101', '02': '102', '03': '103', '04': '201' } as const;
    const b: Record<string, Booking> = {};
    for (const [k, room] of Object.entries(rooms)) {
      await vacant(room);
      b[k] = await direct(room, '2026-10-20', '2026-10-24', 4 * rate, rate);
      await checkIn(b[k]!);
    }
    // BR-428-04: night 23/10 given away in full (FOC 100 %, approved).
    const lines = (await folio(b['04']!)).lines as Array<{
      id: string;
      category: string;
      serviceDate?: string;
    }>;
    const n23 = lines.find((l) => l.category === 'room' && l.serviceDate === '2026-10-23')!;
    const foc = await c.fd!.send('POST', url(`/folios/${b['04']!.folioId}/lines/${n23.id}/foc`), {
      kind: 'foc',
      amountVnd: rate,
      reasonCode: 'service_recovery',
    });
    expect(foc.statusCode, foc.body).toBe(201);
    const ap = await c.mgr!.send(
      'POST',
      url(`/approval-requests/${foc.json().id}/actions/approve`),
      {
        authMethod: 'password',
        secret: TEST_PASSWORD,
      },
    );
    expect(ap.statusCode, ap.body).toBe(200);

    const run = async (k: '01' | '02' | '03' | '04') => {
      const o = oracle(`BR-428-${k}`);
      const body = {
        newDepartureDate: o.input.newDepartureDate as string,
        noticeGivenAt: o.input.notifiedAt as string,
      };
      const id = b[k]!.id;
      const v0 = await version(id);
      const dry = await cleanPreview(id, body);
      const stored = (await c.fd!.get(url(`/reservations/${id}`))).json();
      // FB-R3-SEC-ARC-02: the stored booking (version, ETag, old departure), never the changed one.
      expect(dry.json().reservation).toMatchObject({ version: v0, departureDate: '2026-10-24' });
      expect(dry.headers.etag).toBe(`"${v0}"`);
      expect(stored.version).toBe(v0);
      expect(dry.json().refundRequestId).toBeNull();
      const exp = o.expected;
      const refundable = exp.refundVnd as number;
      const base = (exp.refundBaseVnd as number | undefined) ?? 2 * rate;
      expect(dry.json()).toMatchObject({
        noticeDays: exp.noticeDays,
        droppedNetVnd: base,
        refundableVnd: refundable,
        earlyDepartureFeeVnd: (exp.earlyDepartureFeeVnd as number | undefined) ?? base - refundable,
        refundVnd: refundable,
        refundCapped: false,
        otaRetainedRequired: false,
        evidenceRequired: false,
        childBookings: [],
        roomChangeDifferenceVnd: 0,
        registrationNeedsUpdate: false,
      });
      expect(dry.json().otaRetainedMaxVnd).toBeUndefined();
      expect((dry.json().droppedNights as Array<{ date: string }>).map((n) => n.date)).toEqual(
        (exp.cancelledNights as string[] | undefined) ?? ['2026-10-22', '2026-10-23'],
      );
      expect(dry.json().droppedNights[0]).toMatchObject({
        reservationCode: b[k]!.code,
        roomNo: rooms[k],
        ota: false,
      });
      const wr = await commit(id, body, dry);
      expect(wr.statusCode, wr.body).toBe(200);
      expect(numbers(wr)).toEqual(numbers(dry));
      expect(wr.json().reservation).toMatchObject({ departureDate: o.input.newDepartureDate });
      expect(await refunds(id)).toEqual(refundable > 0 ? [{ amount_vnd: refundable }] : []);
      return dry;
    };
    await at('2026-10-21T10:00:00+07:00');
    expect((await run('01')).json().droppedNights.map((n: { netVnd: number }) => n.netVnd)).toEqual(
      [rate, rate],
    );
    const d4 = await run('04');
    expect(d4.json().droppedNights.map((n: { netVnd: number }) => n.netVnd)).toEqual([rate, 0]);
    // BR-428-03: reported at 01:00 on 22/10 – business date 21/10 → 1 day (BR-010/011).
    await at('2026-10-22T01:00:00+07:00');
    expect((await run('03')).json().noticeBusinessDate).toBe('2026-10-21');
    await at('2026-10-22T08:00:00+07:00');
    expect((await run('02')).json()).toMatchObject({
      noticeBusinessDate: '2026-10-22',
      refundRequestId: null,
    });
  });

  it('BR-428-05: 7 nights with the 10 % tier – no re-tiering, 767.000 / 766.000 through preview and write', async () => {
    const o = oracle('BR-428-05');
    await at('2026-11-09T15:00:00+07:00');
    await vacant('203');
    const b = await direct('203', '2026-11-09', '2026-11-16', 5_205_000);
    await checkIn(b);
    await at(o.input.notifiedAt as string);
    const body = {
      newDepartureDate: o.input.newDepartureDate as string,
      noticeGivenAt: o.input.notifiedAt as string,
    };
    const dry = await cleanPreview(b.id, body);
    expect(dry.json()).toMatchObject({
      noticeDays: o.expected.noticeDays,
      droppedNetVnd: o.expected.refundBaseVnd,
      refundableVnd: o.expected.refundVnd,
      earlyDepartureFeeVnd: o.expected.earlyDepartureFeeVnd,
      refundVnd: o.expected.refundVnd,
      refundCapped: false,
    });
    expect(
      dry.json().droppedNights.map((n: { date: string; netVnd: number }) => [n.date, n.netVnd]),
    ).toEqual([
      ['2026-11-14', 820_000],
      ['2026-11-15', 713_000],
    ]);
    const beforeWrite = await snapshot();
    const wr = await commit(b.id, body, dry);
    expect(wr.statusCode, wr.body).toBe(200);
    expect(numbers(wr)).toEqual(numbers(dry));
    expect(wr.json().reservation.totalRoomVnd).toBe(o.expected.stayedRoomVnd);
    // The snapshot does see a write (it is not blind): these tables change on the real B16.
    const afterWrite = await snapshot();
    for (const tb of [
      'reservation',
      'stay_night',
      'folio_line',
      'approval_request',
      'audit_event',
      'room_occupancy',
    ]) {
      expect(afterWrite[tb], tb).not.toBe(beforeWrite[tb]);
    }
  });

  it('BR-428-06: Agoda, extra-person fee collected – first preview flags otaRetainedRequired; one refund 300.000', async () => {
    const o = oracle('BR-428-06');
    await at('2026-10-20T15:00:00+07:00');
    await vacant('302');
    const b = await ota('302', '2026-10-20', '2026-10-24', 3_600_000, 3);
    await checkIn(b);
    const add = (guestId: string, more: Record<string, unknown> = {}) =>
      c.fd!.send('POST', url(`/reservations/${b.id}/party`), {
        role: 'companion',
        guestId,
        effectiveFrom: '2026-10-20',
        ...more,
      });
    expect((await add(companions[0]!)).statusCode).toBe(201);
    expect((await add(companions[1]!)).statusCode).toBe(201);
    const fourth = await add(companions[2]!, {
      applyExtraPersonSurcharge: true,
      expectedSurchargeVnd: o.input.extraPersonCollectedVnd,
    });
    expect(fourth.statusCode, fourth.body).toBe(201);
    await pay(b, o.input.extraPersonCollectedVnd as number);
    await at('2026-10-22T10:00:00+07:00');
    const body = { newDepartureDate: '2026-10-22', noticeGivenAt: '2026-10-22T10:00:00+07:00' };
    // First preview: no OTA amount yet → not 422 but the flag; the OTA part counts 0.
    const first = await cleanPreview(b.id, body);
    const otaNights = first.json().droppedNights as Array<{ ota: boolean; netVnd: number }>;
    expect(otaNights.every((n) => n.ota)).toBe(true);
    expect(first.json()).toMatchObject({
      otaRetainedRequired: true,
      otaRetainedMaxVnd: otaNights.reduce((a, n) => a + n.netVnd, 0),
      droppedNetVnd: 0,
      refundableVnd: 0,
      earlyDepartureFeeVnd: 0,
      extraPersonRefundVnd: o.expected.refundRequestAtEarlyDepartureVnd,
      refundVnd: o.expected.refundRequestAtEarlyDepartureVnd,
    });
    expect(first.json().otaRetainedMaxVnd).toBeGreaterThan(0);
    // The write without the OTA amount is still 422 REQUIRED.
    const noAmount = await act(b.id, 'early-departure', body);
    expect(noAmount.statusCode).toBe(422);
    expect(noAmount.json().errors).toContainEqual({ field: 'otaRetainedVnd', code: 'REQUIRED' });
    // Above the cap → 422 with `max` in the preview too.
    const tooMuch = await preview(b.id, {
      ...body,
      otaRetainedVnd: first.json().otaRetainedMaxVnd + 1,
    });
    expect(tooMuch.statusCode).toBe(422);
    expect(tooMuch.json()).toMatchObject({ max: first.json().otaRetainedMaxVnd });
    const full = { ...body, otaRetainedVnd: 0 };
    const dry = await cleanPreview(b.id, full);
    expect(dry.json()).toMatchObject({ otaRetainedRequired: false, refundVnd: 300_000 });
    const wr = await commit(b.id, full, dry);
    expect(wr.statusCode, wr.body).toBe(200);
    expect(numbers(wr)).toEqual(numbers(dry));
    expect(await refunds(b.id)).toEqual([
      { amount_vnd: o.expected.refundRequestAtEarlyDepartureVnd },
    ]);
  });

  it('409 AMOUNT_CHANGED writes nothing (same key then succeeds); stale If-Match → 412; refundCapped; bad expected → 422', async () => {
    await at('2026-11-23T15:00:00+07:00');
    await vacant('202');
    const b = await direct('202', '2026-11-23', '2026-11-27', 1_000_000);
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) await pay(b, due);
    await checkIn(b);
    // An unpaid F&B charge of 500.000: after dropping 2 nights (and the fee line) the overpayment is smaller than
    // the 50 % part → capped.
    const f = await c.fd!.get(url(`/folios/${b.folioId}`));
    const fnb = await c.fd!.send(
      'POST',
      url(`/folios/${b.folioId}/lines`),
      { category: 'fnb', description: 'Tiệc nhỏ', quantity: 1, unitPriceVnd: 500_000 },
      { 'if-match': f.headers.etag as string },
    );
    expect(fnb.statusCode, fnb.body).toBe(201);
    await at('2026-11-24T10:00:00+07:00');
    const body = { newDepartureDate: '2026-11-25', noticeGivenAt: '2026-11-24T10:00:00+07:00' };
    const dry = await cleanPreview(b.id, body);
    expect(dry.json().refundableVnd).toBeGreaterThan(0);
    expect(dry.json().refundCapped).toBe(true);
    expect(dry.json().refundVnd).toBe(
      dry.json().droppedNetVnd - dry.json().earlyDepartureFeeVnd - 500_000,
    );
    expect(dry.json().refundVnd).toBeGreaterThan(0);
    expect(dry.json().refundVnd).toBeLessThan(dry.json().refundableVnd);
    const v0 = await version(b.id);
    // One đồng off → 409 with the server's numbers, nothing written.
    const key = randomUUID();
    const before = await snapshot();
    const off = await act(
      b.id,
      'early-departure',
      { ...body, expectedRefundVnd: 1, expectedFeeVnd: dry.json().earlyDepartureFeeVnd },
      'fd',
      { 'idempotency-key': key },
    );
    expect(off.statusCode, off.body).toBe(409);
    expect(off.json()).toMatchObject({
      code: 'AMOUNT_CHANGED',
      refundVnd: dry.json().refundVnd,
      earlyDepartureFeeVnd: dry.json().earlyDepartureFeeVnd,
    });
    expect(await snapshot()).toEqual(before);
    // Negative / non-integer expected amounts → 422 (MoneyVnd).
    const bad = await act(b.id, 'early-departure', { ...body, expectedRefundVnd: -1 });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors[0].field).toBe('expectedRefundVnd');
    // A change between the preview and the write (a payment raises the folio version, not the booking's) → the
    // numbers change → 409; a change of the booking → 412 with the preview's If-Match.
    await pay(b, 500_000); // the F&B charge paid
    const moved = await act(
      b.id,
      'early-departure',
      {
        ...body,
        expectedRefundVnd: dry.json().refundVnd,
        expectedFeeVnd: dry.json().earlyDepartureFeeVnd,
      },
      'fd',
    );
    expect(moved.statusCode, moved.body).toBe(409);
    expect(moved.json().code).toBe('AMOUNT_CHANGED');
    const patched = await c.fd!.send(
      'PATCH',
      url(`/reservations/${b.id}`),
      { internalNote: 'Khách xin hóa đơn' },
      { 'if-match': `"${v0}"` },
    );
    expect(patched.statusCode, patched.body).toBe(200);
    const again = await preview(b.id, body);
    const stale = await c.fd!.send(
      'POST',
      url(`/reservations/${b.id}/actions/early-departure`),
      {
        ...body,
        expectedRefundVnd: again.json().refundVnd,
        expectedFeeVnd: again.json().earlyDepartureFeeVnd,
      },
      { 'if-match': `"${v0}"` },
    );
    expect(stale.statusCode, stale.body).toBe(412);
    // The 409 rolled the key back with everything else: the same key now succeeds with the right numbers.
    const ok = await c.fd!.send(
      'POST',
      url(`/reservations/${b.id}/actions/early-departure`),
      {
        ...body,
        expectedRefundVnd: again.json().refundVnd,
        expectedFeeVnd: again.json().earlyDepartureFeeVnd,
      },
      { 'if-match': `"${again.json().reservation.version}"`, 'idempotency-key': key },
    );
    expect(ok.statusCode, ok.body).toBe(200);
    expect(numbers(ok)).toEqual(numbers(again));
    // Replay of the same key after success → the stored result.
    const replay = await c.fd!.send(
      'POST',
      url(`/reservations/${b.id}/actions/early-departure`),
      {
        ...body,
        expectedRefundVnd: again.json().refundVnd,
        expectedFeeVnd: again.json().earlyDepartureFeeVnd,
      },
      { 'if-match': `"${again.json().reservation.version}"`, 'idempotency-key': key },
    );
    expect(replay.statusCode).toBe(200);
    expect(replay.headers['idempotent-replayed']).toBe('true');
    const audit = await q<{ after: Record<string, unknown> }>(
      `SELECT after FROM audit_event WHERE entity_id = $1 AND action = 'reservation.early_departure'`,
      [b.id],
    );
    expect(audit).toHaveLength(1);
    expect(audit[0]!.after).toMatchObject({
      previewConfirmed: true,
      expectedRefundVnd: again.json().refundVnd,
    });
  });

  it('back-dated notice: the preview flags evidenceRequired (no 422); the write without evidence is 422', async () => {
    await at('2026-11-30T15:00:00+07:00');
    await vacant('301');
    const b = await direct('301', '2026-11-30', '2026-12-04', 4_000_000);
    await checkIn(b);
    await at('2026-12-01T20:00:00+07:00');
    const body = { newDepartureDate: '2026-12-03', noticeGivenAt: '2026-11-30T20:00:00+07:00' };
    const dry = await cleanPreview(b.id, body);
    expect(dry.json()).toMatchObject({ evidenceRequired: true, noticeBusinessDate: '2026-11-30' });
    const without = await commit(b.id, body, dry);
    expect(without.statusCode).toBe(422);
    expect(without.json().errors).toContainEqual({
      field: 'noticeEvidence',
      code: 'EVIDENCE_REQUIRED',
    });
    const proved = { ...body, noticeEvidence: { note: 'Tin nhắn Zalo tối 30/11' } };
    const dry2 = await cleanPreview(b.id, proved);
    expect(dry2.json().evidenceRequired).toBe(true); // the desk keeps the field shown
    const wr = await commit(b.id, proved, dry2);
    expect(wr.statusCode, wr.body).toBe(200);
    expect(numbers(wr)).toEqual(numbers(dry2));
  });

  it('FB-R3-SEC-ARC-03: OTA stay + foreign document + extension child cancelled whole + late charge – the preview leaves no row, no SSE', async () => {
    await at('2026-12-07T15:00:00+07:00');
    await vacant('401');
    const b = await ota('401', '2026-12-07', '2026-12-09', 1_800_000);
    await checkIn(b);
    // A foreign guest's passport on the stay's registration (real registration module, C3 encrypted).
    const [reg] = await q<{ id: string }>('SELECT id FROM registration WHERE reservation_id = $1', [
      b.id,
    ]);
    expect(reg).toBeDefined();
    const device = c.fd!.deviceToken!;
    const doc = await staff(
      fa,
      t.users.fd!.sessionToken,
      device,
      'POST',
      url(`/registrations/${reg!.id}/documents`),
      {
        multipart: [
          {
            name: 'data',
            value: JSON.stringify({
              docType: 'passport',
              fullNameOnDoc: 'SCHMIDT EMMA',
              docNumber: 'C01X00T47',
              gender: 'female',
              dateOfBirth: '1990-04-12',
              nationalityCode: 'DEU',
              passportExpiryDate: '2031-01-01',
              visaKind: 'visa_exempt',
              visaValidUntil: '2026-12-31',
              entryDate: '2026-12-01',
            }),
            contentType: 'application/json',
          },
          {
            name: 'image',
            value: (await sampleJpeg('#30a0b0')) as never,
            filename: 'scan.jpg',
            contentType: 'image/jpeg',
          } as never,
        ],
      },
    );
    expect(doc.statusCode, doc.body).toBe(201);
    await at('2026-12-08T09:00:00+07:00');
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    const childId = ext.json().childReservation.id as string;
    // A late checkout on the (old) departure day 10/12 – B16 voids it with the departure.
    const lateDry = await act(b.id, 'late-checkout', { checkoutTime: '15:00', dryRun: true });
    expect(lateDry.statusCode, lateDry.body).toBe(200);
    const surcharge = (lateDry.json().surchargeVnd ?? 0) as number;
    const late = await act(b.id, 'late-checkout', {
      checkoutTime: '15:00',
      ...(surcharge > 0 ? { applySurcharge: true, expectedSurchargeVnd: surcharge } : {}),
    });
    expect(late.statusCode, late.body).toBe(200);
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) await pay(b, due);

    // SSE: nothing may be delivered for a preview (pg_notify is transactional).
    const listener = new PgClient({ connectionString: process.env.DATABASE_URL });
    await listener.connect();
    const heard: Notification[] = [];
    // Only this tenant's property (other test files publish on the same channel in parallel).
    listener.on('notification', (n) => {
      if ((JSON.parse(n.payload ?? '{}') as { p?: string }).p === t.propertyIds[0]) heard.push(n);
    });
    await listener.query(`LISTEN ${SSE_CHANNEL}`);
    try {
      const body = { newDepartureDate: '2026-12-09', noticeGivenAt: '2026-12-08T09:00:00+07:00' };
      const dry = await cleanPreview(b.id, body);
      await new Promise((r) => setTimeout(r, 500));
      expect(heard).toEqual([]);
      expect(dry.json()).toMatchObject({
        reservation: { id: b.id, departureDate: '2026-12-09' },
        childBookings: [{ reservationId: childId, droppedNightCount: 1, cancelled: true }],
        otaRetainedRequired: false,
        registrationNeedsUpdate: true,
      });
      expect(dry.json().otaRetainedMaxVnd).toBeUndefined();
      expect(dry.json().droppedNights).toEqual([
        expect.objectContaining({ date: '2026-12-09', roomNo: '401', ota: false }),
      ]);
      const [child] = await q<{ status: string }>('SELECT status FROM reservation WHERE id = $1', [
        childId,
      ]);
      expect(child!.status).toBe('in_house');
      const wr = await commit(b.id, body, dry);
      expect(wr.statusCode, wr.body).toBe(200);
      expect(numbers(wr)).toEqual(numbers(dry));
      await new Promise((r) => setTimeout(r, 300));
      expect(heard.length).toBeGreaterThan(0); // the write's events do arrive (the listener works)
      const [after] = await q<{ status: string }>('SELECT status FROM reservation WHERE id = $1', [
        childId,
      ]);
      expect(after!.status).toBe('cancelled');
      const [r] = await q<{ status: string }>('SELECT status FROM registration WHERE id = $1', [
        reg!.id,
      ]);
      expect(r).toBeDefined();
    } finally {
      await listener.end();
    }
  });

  it('FB-R3-SEC-ARC-06: dryRun "true" (string) still needs both headers; HK gets 403 on a dry run', async () => {
    await at('2026-12-14T15:00:00+07:00');
    await vacant('402');
    const b = await direct('402', '2026-12-14', '2026-12-17', 3_000_000);
    await checkIn(b);
    await at('2026-12-15T10:00:00+07:00');
    const body = { newDepartureDate: '2026-12-16', noticeGivenAt: '2026-12-15T10:00:00+07:00' };
    const before = await snapshot();
    const str = await fa.app.inject({
      method: 'POST',
      url: url(`/reservations/${b.id}/actions/early-departure`),
      headers: c.fd!.headers({}, true),
      payload: { ...body, dryRun: 'true' },
    });
    expect([400, 422, 428]).toContain(str.statusCode);
    expect(str.statusCode).not.toBe(200);
    const hk = await preview(b.id, body, 'hk');
    expect(hk.statusCode).toBe(403);
    // no header at all is fine for a real dry run
    const fd = await preview(b.id, body);
    expect(fd.statusCode, fd.body).toBe(200);
    // the 403 writes access.denied (outside the preview) – compare everything else
    const after = await snapshot();
    delete before.audit_event;
    delete after.audit_event;
    expect(after).toEqual(before);
  });

  /** Two companions: the first fills the booked 2nd adult, the second pays BR-110 from `from` (amount from the dry run). */
  const thirdAdult = async (b: Booking, from: string) => {
    const g1 = await seedGuestRow(db, t, { name: `Bạn Đi Cùng ${randomUUID().slice(0, 4)}` });
    const g2 = await seedGuestRow(db, t, { name: `Người Thứ Ba ${randomUUID().slice(0, 4)}` });
    const add = (guestId: string, more: Record<string, unknown> = {}) =>
      c.fd!.send('POST', url(`/reservations/${b.id}/party`), {
        role: 'companion',
        guestId,
        effectiveFrom: from,
        ...more,
      });
    expect((await add(g1)).statusCode).toBe(201);
    const dry = await add(g2, { dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const fee = dry.json().occupancyChange.surchargeVnd as number;
    const ok = await add(g2, { applyExtraPersonSurcharge: true, expectedSurchargeVnd: fee });
    expect(ok.statusCode, ok.body).toBe(201);
    return fee;
  };

  it('BR-428-07: direct, extra-person fee posted but not collected, capped – 400.000 = 300.000 extra + 100.000 BR-428', async () => {
    const o = oracle('BR-428-07');
    const i = o.input as Record<string, unknown>;
    await at('2026-10-20T15:00:00+07:00');
    await vacant('203');
    const b = await direct(
      '203',
      i.arrivalDate as string,
      i.departureDate as string,
      i.paidVnd as number,
      i.nightRateVnd as number,
    );
    await checkIn(b);
    expect(await thirdAdult(b, '2026-10-20')).toBe(4 * (i.extraPersonPerNightVnd as number));
    await at(i.notifiedAt as string);
    const body = {
      newDepartureDate: i.newDepartureDate as string,
      noticeGivenAt: i.notifiedAt as string,
    };
    const dry = await cleanPreview(b.id, body);
    const exp = { ...o.expected } as Record<string, unknown>;
    delete exp.unhandledCreditAfterVnd;
    expect(dry.json()).toMatchObject(exp);
    const wr = await commit(b.id, body, dry);
    expect(wr.statusCode, wr.body).toBe(200);
    expect(numbers(wr)).toEqual(numbers(dry));
    expect(await refunds(b.id)).toEqual([{ amount_vnd: exp.refundVnd }]);
    // BR-428 v0.4.8 (e): the money log line carries the same three pairs.
    const [audit] = await q<{ after: Record<string, unknown>; reason: string }>(
      `SELECT after, reason FROM audit_event WHERE entity_id = $1 AND action = 'reservation.early_departure'`,
      [b.id],
    );
    expect(audit!.after).toMatchObject({
      refundableVnd: exp.refundableVnd,
      extraPersonRefundVnd: exp.extraPersonRefundVnd,
      extraPersonReversedVnd: exp.extraPersonReversedVnd,
      roomChangeDifferenceVnd: 0,
      roomChangeDifferenceReversedVnd: 0,
      refundablePaidVnd: exp.refundablePaidVnd,
      refundRequestedVnd: exp.refundVnd,
    });
    expect(audit!.reason).toMatch(/^BR-428 notice 1d/);
    // BR-428-09 line 1: the direct part says the notice days.
    expect(await feeLines(b)).toEqual([
      {
        description: 'early_departure 1d',
        label_params: { noticeDays: 1, nights: 2 },
        charge_code: null,
      },
    ]);
  });

  it('BR-428-08: Agoda moved 202 → 401 (difference collected in part), capped – 50.000 refunded, the rest only reversed', async () => {
    const o = oracle('BR-428-08');
    const i = o.input as Record<string, unknown> & {
      roomChange: { from: string; to: string; fromNight: string; differencePerNightVnd: number };
    };
    // Oracle input: 250.000 per night on all three nights (21–23/10). The B14 difference uses the direct calendar and
    // DS-E uplifts Friday 23/10 by 15 % (287.000), so from 20/10 to 23/10 the weekend uplift is limited to agents
    // (BR-103 parameter, effective-dated), then back to 'all'. The earlier cases of this file on those dates are
    // already finished (typed rates); the later ones are in November/December.
    await setParam(db, t, 'weekend_uplift_channels', ['agent'], '2026-10-20');
    await setParam(db, t, 'weekend_uplift_channels', 'all', '2026-10-24');
    await at('2026-10-20T15:00:00+07:00');
    await vacant('202');
    await vacant('401');
    const b = await ota('202', i.arrivalDate as string, i.departureDate as string, 3_200_000);
    await checkIn(b);
    await at(`${i.roomChange.fromNight}T10:00:00+07:00`);
    const move = {
      newRoomId: ids.rooms[i.roomChange.to],
      effectiveDate: i.roomChange.fromNight,
      cause: 'guest_request',
      reason: 'Khách muốn căn rộng hơn',
    };
    const mdry = await act(b.id, 'change-room', { ...move, dryRun: true });
    expect(mdry.statusCode, mdry.body).toBe(200);
    const moved = await act(b.id, 'change-room', {
      ...move,
      applyDifference: true,
      expectedDeltaVnd: mdry.json().folioDeltaVnd,
    });
    expect(moved.statusCode, moved.body).toBe(200);
    const diffs = await q<{ d: string; a: number }>(
      `SELECT service_date::text AS d, amount_vnd AS a FROM folio_line
        WHERE folio_id = $1 AND category = 'room_change_difference' AND reversal_of_id IS NULL ORDER BY 1`,
      [b.folioId],
    );
    expect(diffs.map((x) => x.d)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23']);
    // Collected 300.000 of the difference (oracle) – the folio's other charges are covered by the OTA.
    await pay(b, i.roomChangeDifferenceCollectedVnd as number);
    await at(`${i.newDepartureDate as string}T10:00:00+07:00`);
    const body = {
      newDepartureDate: i.newDepartureDate as string,
      noticeGivenAt: `${i.newDepartureDate as string}T10:00:00+07:00`,
      otaRetainedVnd: i.otaRetainedVnd as number,
    };
    const dry = await cleanPreview(b.id, body);
    const droppedDiff = diffs
      .filter((x) => x.d >= (i.newDepartureDate as string))
      .reduce((a, x) => a + x.a, 0);
    const credit = (i.roomChangeDifferenceCollectedVnd as number) - diffs[0]!.a;
    expect(dry.json()).toMatchObject({
      refundVnd: credit,
      roomChangeDifferenceVnd: credit,
      roomChangeDifferenceReversedVnd: droppedDiff - credit,
      extraPersonRefundVnd: 0,
      earlyDepartureFeeVnd: 0,
      refundablePaidVnd: 0,
      refundCapped: true,
    });
    expect(dry.json().droppedNights.map((n: { date: string }) => n.date)).toEqual(
      o.expected.droppedNights,
    );
    // 202 → 401 at the plain list prices = the oracle's 250.000 on every night → the exact oracle numbers.
    expect(diffs.map((x) => x.a)).toEqual(
      [250_000, 250_000, 250_000].map(() => i.roomChange.differencePerNightVnd),
    );
    expect(droppedDiff).toBe(o.expected.roomChangeDifferenceDroppedVnd);
    expect(dry.json()).toMatchObject({
      refundVnd: o.expected.refundVnd,
      roomChangeDifferenceVnd: o.expected.roomChangeDifferenceVnd,
      roomChangeDifferenceReversedVnd: o.expected.roomChangeDifferenceReversedVnd,
      extraPersonRefundVnd: o.expected.extraPersonRefundVnd,
      earlyDepartureFeeVnd: o.expected.earlyDepartureFeeVnd,
      refundCapped: o.expected.refundCapped,
    });
    const wr = await commit(b.id, body, dry);
    expect(wr.statusCode, wr.body).toBe(200);
    expect(numbers(wr)).toEqual(numbers(dry));
    expect(await refunds(b.id)).toEqual([{ amount_vnd: credit }]);
  });

  it('BR-428-09 + BE-B 04: OTA stay + direct child, extra person + room change difference + 50 %, OTA keeps a part – all three parts, then capped; fee lines', async () => {
    await at('2026-12-21T15:00:00+07:00');
    await vacant('102');
    await vacant('202');
    const b = await ota('102', '2026-12-21', '2026-12-24', 2_400_000);
    await checkIn(b);
    await thirdAdult(b, '2026-12-21');
    await at('2026-12-22T10:00:00+07:00');
    const move = {
      newRoomId: ids.rooms['202'],
      effectiveDate: '2026-12-22',
      cause: 'guest_request',
      reason: 'Khách muốn đổi căn',
    };
    const mdry = await act(b.id, 'change-room', { ...move, dryRun: true });
    expect(mdry.statusCode, mdry.body).toBe(200);
    const moved = await act(b.id, 'change-room', {
      ...move,
      applyDifference: true,
      expectedDeltaVnd: mdry.json().folioDeltaVnd,
    });
    expect(moved.statusCode, moved.body).toBe(200);
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    const childId = ext.json().childReservation.id as string;
    // ARC 0.3.9 add 1: the stay departs with the child booking.
    const primary = (await c.fd!.get(url(`/reservations/${b.id}`))).json();
    expect(primary).toMatchObject({ departureDate: '2026-12-24', stayDepartureDate: '2026-12-25' });
    const child = (await c.fd!.get(url(`/reservations/${childId}`))).json();
    expect(child.stayDepartureDate).toBeUndefined();
    expect(child.allowedActions.map((a: { event: string }) => a.event)).not.toContain(
      'early_departure',
    );
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) await pay(b, due);
    const body = { newDepartureDate: '2026-12-23', noticeGivenAt: '2026-12-22T10:00:00+07:00' };
    const first = await cleanPreview(b.id, body);
    const half = Math.floor((first.json().otaRetainedMaxVnd as number) / 2 / 1000) * 1000;
    const full = { ...body, otaRetainedVnd: half };
    const open = await cleanPreview(b.id, full);
    // Not capped: the three parts are all there, each refunded in full.
    expect(open.json()).toMatchObject({
      refundCapped: false,
      extraPersonReversedVnd: 0,
      roomChangeDifferenceReversedVnd: 0,
    });
    for (const k of ['extraPersonRefundVnd', 'roomChangeDifferenceVnd', 'refundablePaidVnd']) {
      expect(open.json()[k], k).toBeGreaterThan(0);
    }
    expect(open.json().refundablePaidVnd).toBe(open.json().refundableVnd);
    expect(open.json().childBookings).toEqual([
      { reservationId: childId, code: expect.any(String), droppedNightCount: 1, cancelled: true },
    ]);
    // An unpaid charge eats the BR-428 part and half the difference → capped in the BR-428 order.
    const rcd = open.json().roomChangeDifferenceVnd as number;
    const eaten = (open.json().refundableVnd as number) + Math.floor(rcd / 2);
    const f = await c.fd!.get(url(`/folios/${b.folioId}`));
    const fnb = await c.fd!.send(
      'POST',
      url(`/folios/${b.folioId}/lines`),
      { category: 'fnb', description: 'Tiệc tối', quantity: 1, unitPriceVnd: eaten },
      { 'if-match': f.headers.etag as string },
    );
    expect(fnb.statusCode, fnb.body).toBe(201);
    const capped = await cleanPreview(b.id, full);
    expect(capped.json()).toMatchObject({
      refundCapped: true,
      refundVnd: (open.json().refundVnd as number) - eaten,
      extraPersonRefundVnd: open.json().extraPersonRefundVnd,
      extraPersonReversedVnd: 0,
      roomChangeDifferenceVnd: rcd - Math.floor(rcd / 2),
      roomChangeDifferenceReversedVnd: Math.floor(rcd / 2),
      refundablePaidVnd: 0,
      refundableVnd: open.json().refundableVnd,
    });
    const wr = await commit(b.id, full, capped);
    expect(wr.statusCode, wr.body).toBe(200);
    expect(numbers(wr)).toEqual(numbers(capped));
    expect(await refunds(b.id)).toEqual([{ amount_vnd: capped.json().refundVnd }]);
    // BR-428-09: the direct part says its notice days, the OTA part does not.
    const days = capped.json().noticeDays as number;
    expect(await feeLines(b)).toEqual([
      {
        description: `early_departure ${days}d`,
        label_params: { noticeDays: days, nights: 1 },
        charge_code: null,
      },
      { description: 'early_departure', label_params: { nights: 1 }, charge_code: 'ota_retained' },
    ]);
  });

  it('ARC 0.3.9 add 1: early_departure only while a new departure exists (child extends the window; departure day; 1 night)', async () => {
    const events = async (id: string) =>
      (
        (await c.fd!.get(url(`/reservations/${id}`))).json().allowedActions as Array<{
          event: string;
        }>
      ).map((a) => a.event);
    await at('2026-12-14T15:00:00+07:00');
    await vacant('401');
    const b = await ota('401', '2026-12-14', '2026-12-16', 1_800_000);
    await checkIn(b);
    // arrival day of a 2-night stay: 15/12 is a valid new departure
    expect(await events(b.id)).toContain('early_departure');
    await at('2026-12-15T10:00:00+07:00');
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    expect((await c.fd!.get(url(`/reservations/${b.id}`))).json().stayDepartureDate).toBe(
      '2026-12-17',
    );
    // the primary's own departure day, the stay goes on with the child: still offered (16/12 < 17/12)
    await at('2026-12-16T09:00:00+07:00');
    expect(await events(b.id)).toContain('early_departure');
    // 1-night stay arriving today: no valid new departure
    await vacant('103');
    const one = await direct('103', '2026-12-16', '2026-12-17', 1_000_000);
    const due = (await folio(one)).totals.balanceDueVnd as number;
    if (due > 0) await pay(one, due);
    await at('2026-12-16T15:00:00+07:00');
    await checkIn(one);
    const oneEvents = await events(one.id);
    expect(oneEvents).not.toContain('early_departure');
    expect((await c.fd!.get(url(`/reservations/${one.id}`))).json().stayDepartureDate).toBe(
      '2026-12-17',
    );
    // the day the whole stay departs: not offered any more, check-out is
    await at('2026-12-17T09:00:00+07:00');
    expect(await events(b.id)).not.toContain('early_departure');
    expect(await events(one.id)).toEqual(expect.arrayContaining(['check_out']));
    expect(await events(one.id)).not.toContain('early_departure');
  });

  describe('Database.simulate (FB-R3-SEC-ARC-01)', () => {
    const someReservation = async () =>
      (
        await q<{ id: string; version: number; internal_note: string | null }>(
          'SELECT id, version, internal_note FROM reservation ORDER BY created_at LIMIT 1',
        )
      )[0]!;

    it('(i) a dry-run body outside a simulation (and a write body inside one) is refused before anything is read', async () => {
      const stays = fa.app.get(StayService);
      const support = fa.app.get(StaySupport);
      const r = await someReservation();
      const body = { newDepartureDate: '2026-12-31', noticeGivenAt: '2026-12-01T10:00:00+07:00' };
      const ctxOf = (tx: Tx) =>
        support.context(tx, { userId: t.users.fd!.id, roles: ['front_desk'] }, 'req-test');
      await expect(
        db.withContext(t.ctx(), async (tx) =>
          stays.earlyDeparture(tx, await ctxOf(tx), r.id, r.version, { ...body, dryRun: true }),
        ),
      ).rejects.toThrow(/dryRun=true in a write transaction/);
      await expect(
        db.simulate(
          t.ctx(),
          async (tx) => stays.earlyDeparture(tx, await ctxOf(tx), r.id, null, body),
          { lockTimeoutMs: 1000, statementTimeoutMs: 5000 },
        ),
      ).rejects.toThrow(/in a simulation transaction/);
    });

    it('(ii) a handler that writes and returns normally keeps nothing; ctx.simulation is set', async () => {
      const r = await someReservation();
      const before = await snapshot();
      const seen = await db.simulate(
        t.ctx(),
        async (tx) => {
          await tx.query(
            `UPDATE reservation SET internal_note = 'simulated', version = version + 1 WHERE id = $1`,
            [r.id],
          );
          await tx.query('SAVEPOINT sp1');
          await tx.query('RELEASE SAVEPOINT sp1');
          await tx.query(`SELECT set_config('lock_timeout', '500ms', true)`);
          await tx.query(`SET LOCAL statement_timeout = '4s'`);
          return tx.ctx.simulation;
        },
        { lockTimeoutMs: 1000, statementTimeoutMs: 5000 },
      );
      expect(seen).toBe(true);
      expect(await snapshot()).toEqual(before);
      expect((await someReservation()).internal_note).toBe(r.internal_note);
    });

    it('(iii) transaction control is refused inside; the database refuses to commit a simulation_guard row', async () => {
      for (const sql of [
        'COMMIT',
        'commit;',
        'END',
        'ROLLBACK',
        'SELECT 1; COMMIT',
        'BEGIN',
        "SET statement_timeout = '0'",
        'RESET ALL',
        'DISCARD ALL',
        "PREPARE TRANSACTION 'x'",
      ]) {
        await expect(
          db.simulate(t.ctx(), (tx) => tx.query(sql), {
            lockTimeoutMs: 1000,
            statementTimeoutMs: 5000,
          }),
          sql,
        ).rejects.toThrow(/transaction control is not allowed/);
      }
      // Even a plain transaction that inserts a guard row cannot commit (deferred constraint trigger).
      await expect(
        db.withContext(t.ctx(), (tx) =>
          tx.query('INSERT INTO simulation_guard (organization_id, property_id) VALUES ($1, $2)', [
            t.organizationId,
            t.propertyIds[0],
          ]),
        ),
      ).rejects.toThrow(/must never be committed/);
      const guard = await owner.query<{ n: number }>(
        'SELECT count(*)::int AS n FROM simulation_guard',
      );
      expect(guard.rows[0]!.n).toBe(0);
    });

    it('SEC-BE-A-01: a savepoint rolled back after the guard row cannot remove it – the commit is still refused', async () => {
      await expect(
        db.withContext(t.ctx(), async (tx) => {
          await tx.query(
            'INSERT INTO simulation_guard (organization_id, property_id) VALUES ($1, $2)',
            [t.organizationId, t.propertyIds[0]],
          );
          await tx.query('SAVEPOINT a');
          await tx.query(`SELECT set_config('lock_timeout', '900ms', true)`);
          await tx.query('ROLLBACK TO SAVEPOINT a');
          await tx.query('RELEASE SAVEPOINT a');
        }),
      ).rejects.toThrow(/must never be committed/);
    });

    it('SEC-BE-A-02: tx.db (drizzle) throws; a transaction ended by the raw connection is reported, never answered', async () => {
      const opts = { lockTimeoutMs: 1000, statementTimeoutMs: 5000 };
      await expect(
        db.simulate(
          t.ctx(),
          async (tx) => (tx.db as unknown as { select(): unknown }).select(),
          opts,
        ),
      ).rejects.toThrow(/drizzle \(tx\.db\) is not available inside a simulation/);
      let raw: { query(sql: string): Promise<unknown> } | null = null;
      const grab = (client: { query(sql: string): Promise<unknown> }) => {
        raw = client;
      };
      db.pool.on('acquire', grab as never);
      try {
        await expect(
          db.simulate(
            t.ctx(),
            async () => {
              await raw!.query('ROLLBACK'); // past the statement filter (it only sees tx.query)
              return 'answer';
            },
            opts,
          ),
        ).rejects.toThrow(/ended inside the handler/);
      } finally {
        db.pool.off('acquire', grab as never);
      }
    });

    it('SEC-BE-A-03: reservation hooks, approval requests and attachment binding refuse a simulation tx at the source', async () => {
      const opts = { lockTimeoutMs: 1000, statementTimeoutMs: 5000 };
      const hooks = fa.app.get(ReservationHooks);
      const approvals = fa.app.get(ApprovalService);
      const attachments = fa.app.get(AttachmentService);
      await expect(
        db.simulate(t.ctx(), (tx) => hooks.emit(tx, { kind: 'transitioned' } as never), opts),
      ).rejects.toThrow(/reservation hooks cannot run inside a simulation/);
      await expect(
        db.simulate(
          t.ctx(),
          (tx) =>
            approvals.submit(
              tx,
              { userId: t.users.fd!.id, roles: ['front_desk'] } as never,
              {} as never,
            ),
          opts,
        ),
      ).rejects.toThrow(/cannot be submitted inside a simulation/);
      await expect(
        db.simulate(
          t.ctx(),
          (tx) => attachments.bindTo(tx, randomUUID(), { type: 'reservation', id: randomUUID() }),
          opts,
        ),
      ).rejects.toThrow(/cannot be bound inside a simulation/);
    });

    it('(iv) a failed ROLLBACK destroys the connection (never back to the pool)', async () => {
      let removed = 0;
      const onRemove = () => {
        removed += 1;
      };
      // The terminated backend also emits 'error' on its client – expected here.
      const quiet = (client: { on(e: 'error', f: () => void): unknown }) => {
        client.on('error', () => undefined);
      };
      db.pool.on('acquire', quiet as never);
      db.pool.on('remove', onRemove);
      try {
        await expect(
          db.simulate(t.ctx(), (tx) => tx.query('SELECT pg_terminate_backend(pg_backend_pid())'), {
            lockTimeoutMs: 1000,
            statementTimeoutMs: 5000,
          }),
        ).rejects.toThrow();
        await new Promise((r) => setTimeout(r, 100));
        expect(removed).toBeGreaterThanOrEqual(1);
      } finally {
        db.pool.off('remove', onRemove);
        db.pool.off('acquire', quiet as never);
      }
      // the pool still works
      expect((await q<{ one: number }>('SELECT 1 AS one'))[0]!.one).toBe(1);
    });
  });
});
