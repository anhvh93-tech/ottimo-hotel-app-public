/**
 * S4-25 (BE-B – PATCH, gộp sau khi QA đóng 056/059/061): Desk xin FOC ngoài bước nhận phòng trên API có sẵn –
 * trả muộn (H15 `setLateCheckout.requestFocForSurcharge`, H16 bước 2 = cùng lệnh khi giờ trả cao hơn), dòng phát
 * sinh (`requestFoc`, khóa = chính dòng, đi theo bản thay của `adjustFolioLine`), lễ tân tự áp FOC minibar
 * (BR-436), phụ thu người khi thêm người (BUG-R2-093 – một yêu cầu cho mỗi đêm, khóa theo ngày). Trần số xin
 * theo khóa (S4-23 (6)) ở cả hai đường xin FOC.
 * Fake clock and FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import { FolioService } from '../../src/modules/folio/public/folio.service';
import type {
  CheckinDocumentStatus,
  FrontdeskRegistrationPort,
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
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

class DocsOk implements FrontdeskRegistrationPort {
  async checkinDocumentStatus(): Promise<CheckinDocumentStatus> {
    return {
      mainGuestDocument: true,
      documentCheckBlock: false,
      pendingOnlineCheckin: false,
      visaExpiresBeforeDeparture: false,
      passportExpiresDuringStay: false,
    };
  }
  async deadlinePreview(): Promise<Date | null> {
    return null;
  }
  async onCheckedIn(): Promise<Date | null> {
    return null;
  }
  async onCheckInUndone() {}
  async onDepartureChanged() {}
  async onRoomChanged() {}
  async onPartyChanged() {}
  async onPartyMemberRemoved() {}
  async onCheckedOut() {}
  async onReservationVoided() {}
  async earliestVisaValidUntil(): Promise<string | null> {
    return null;
  }
}

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  sal: ['sales_staff'],
};

type Booking = { id: string; code: string; version: number; folioId: string };
type Line = {
  id: string;
  category: string;
  amountVnd: number;
  serviceDate?: string;
  relatedLineId?: string;
  reversalOfId?: string;
  approvalRequestId?: string;
  lineState: string;
};
type Approval = {
  id: string;
  type: string;
  status: string;
  amountVnd: number;
  folioLineId?: string;
  effectiveAmountVnd?: number;
  focState?: string;
  focCancelReason?: string;
  lineChangedNote?: {
    oldLineVnd: number;
    newLineVnd: number;
    fromServiceDate?: string;
    toServiceDate?: string;
    cause: string;
  } | null;
  autoCancelReason?: string;
  approverRemainingMonthlyVnd?: number;
  version?: number;
};

describe.skipIf(!HAS_DB)('S4-25 FOC outside check-in (BE-B patch)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const companions: string[] = [];
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Lý Thử Khách' });
    companions.push(await seedGuestRow(db, t, { name: 'Đỗ Bạn Một' }));
    companions.push(await seedGuestRow(db, t, { name: 'Đỗ Bạn Hai' }));
    fa = await startFeatureApp(db, {
      override: (b) =>
        b
          .overrideProvider(FrontdeskPorts)
          .useValue(
            new FrontdeskPorts(
              new DocsOk(),
              new NoGuestAccessPort(),
              new UnwiredChildDataPort(),
              new NoMinibarPort(),
            ),
          ),
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
    c.fdl!.deviceToken = token;
    await setPassword(db, t, 'mgr');
    await setPassword(db, t, 'fdl');
    await setPassword(db, t, 'own');
    await setPassword(db, t, 'fd');
  });
  afterAll(async () => {
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
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${await version(id)}"`,
    });
  const direct = async (
    room: string,
    from: string,
    to: string,
    more: Record<string, unknown> = {},
  ): Promise<Booking> => {
    const body = (amountVnd: number) => ({
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd },
      ...more,
    });
    let res = await c.fd!.send('POST', url('/reservations'), body(100_000));
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c.fd!.send('POST', url('/reservations'), body(res.json().depositRequiredVnd));
    }
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const folio = async (b: Booking) => (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
  /** Live posted lines (not reversals, not reversed). */
  const liveLines = async (b: Booking) => {
    const all = (await folio(b)).lines as Line[];
    const reversed = new Set(all.map((l) => l.reversalOfId).filter(Boolean));
    return all.filter((l) => l.lineState === 'posted' && !l.reversalOfId && !reversed.has(l.id));
  };
  const liveBy = async (b: Booking, category: string) =>
    (await liveLines(b))
      .filter((l) => l.category === category)
      .sort((x, y) => String(x.serviceDate).localeCompare(String(y.serviceDate)));
  /** Live reductions as [date of the reduced line, category of the reduced line, kind, amount]. */
  const reductions = async (b: Booking) => {
    const all = (await folio(b)).lines as Line[];
    const byId = new Map(all.map((l) => [l.id, l]));
    return (await liveLines(b))
      .filter((l) => l.category === 'foc' || l.category === 'discount')
      .map((r) => {
        const rel = byId.get(r.relatedLineId ?? '');
        return [rel?.serviceDate, rel?.category, r.category, -r.amountVnd] as const;
      })
      .sort((x, y) => `${x[0]}${x[1]}${x[2]}`.localeCompare(`${y[0]}${y[1]}${y[2]}`));
  };
  const totalOf = async (b: Booking) => (await folio(b)).totals.totalVnd as number;
  const requestReduction = async (
    b: Booking,
    lineId: string,
    amountVnd: number,
    kind: 'foc' | 'special_discount' = 'foc',
    who = 'fd',
  ) => {
    const r = await c[who]!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
      kind,
      amountVnd,
      reasonCode: kind === 'foc' ? 'service_recovery' : 'regular_vip',
    });
    expect(r.statusCode, r.body).toBe(201);
    return r.json() as Approval;
  };
  const decide = (who: string, id: string, verb: 'approve' | 'reject' = 'approve') =>
    c[who]!.send('POST', url(`/approval-requests/${id}/actions/${verb}`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
      ...(verb === 'reject' ? { reason: 'Không đủ lý do' } : {}),
    });
  /** One request as OWN sees it in the queue (S23 – the list carries the 0.3.7 FOC fields). */
  const approval = async (id: string, who = 'own'): Promise<Approval> => {
    const res = await c[who]!.get(url('/approval-requests?limit=100'));
    expect(res.statusCode, res.body).toBe(200);
    const row = (res.json().data as Approval[]).find((a) => a.id === id);
    expect(row, `approval ${id} visible to ${who}`).toBeDefined();
    return row as Approval;
  };

  const vacant = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  const checkIn = async (b: Booking, time = '15:00') => {
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) {
      const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    const r = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: time,
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  /** B15 at `time` (the amount the desk saw – dryRun first); optional FOC request on the new charge. */
  const lateAt = async (b: Booking, time: string, focVnd?: number | 'all') => {
    const dry = await act(b.id, 'late-checkout', { checkoutTime: time, dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const s = dry.json().surchargeVnd as number;
    const r = await act(b.id, 'late-checkout', {
      checkoutTime: time,
      ...(s > 0 ? { applySurcharge: true, expectedSurchargeVnd: s } : {}),
      ...(focVnd !== undefined
        ? {
            requestFocForSurcharge: {
              amountVnd: focVnd === 'all' ? s : focVnd,
              reasonCode: 'regular_vip',
            },
          }
        : {}),
    });
    expect(r.statusCode, r.body).toBe(200);
    return s;
  };
  const lateFoc = async (b: Booking) => {
    const late = await liveBy(b, 'late_checkout');
    const focs = (await liveLines(b)).filter(
      (l) =>
        (l.category === 'foc' || l.category === 'discount') &&
        late.some((x) => x.id === l.relatedLineId),
    );
    return {
      lateVnd: late.reduce((a, l) => a + l.amountVnd, 0),
      focVnd: focs.reduce((a, l) => a - l.amountVnd, 0),
    };
  };
  const lateRequest = async (b: Booking) =>
    (
      await q<{ id: string }>(
        `SELECT id FROM approval_request WHERE target_id = $1 AND type = 'foc' ORDER BY requested_at DESC LIMIT 1`,
        [b.id],
      )
    )[0]!.id;

  it('S4-25 H15/H16: a second FOC request on the late check-out key is capped by what is left (S4-23 (6)); both apply in approval order', async () => {
    await at('2026-11-30T15:00:00+07:00');
    await vacant('201');
    const b = await direct('201', '2026-11-30', '2026-12-01');
    await checkIn(b);
    await at('2026-12-01T09:00:00+07:00');
    const s15 = await lateAt(b, '15:00', 'all');
    expect((await decide('fdl', await lateRequest(b))).statusCode).toBe(200);
    // H16 step 2: the guest leaves later → 17:00, asks a FOC for the whole new charge – only s17 − s15 is left.
    const dry = await act(b.id, 'late-checkout', { checkoutTime: '17:00', dryRun: true });
    const s17 = dry.json().surchargeVnd as number;
    const tooMuch = await act(b.id, 'late-checkout', {
      checkoutTime: '17:00',
      applySurcharge: true,
      expectedSurchargeVnd: s17,
      requestFocForSurcharge: { amountVnd: s17, reasonCode: 'regular_vip' },
    });
    expect(tooMuch.statusCode).toBe(422);
    expect(tooMuch.json()).toMatchObject({ max: s17 - s15 });
    expect(await lateFoc(b)).toEqual({ lateVnd: s15, focVnd: s15 }); // nothing written
    expect(await lateAt(b, '17:00', s17 - s15)).toBe(s17);
    const [second] = await q<{ id: string }>(
      `SELECT id FROM approval_request WHERE target_id = $1 AND type = 'foc' AND status = 'pending'`,
      [b.id],
    );
    expect((await decide('mgr', second!.id)).statusCode).toBe(200);
    expect(await lateFoc(b)).toEqual({ lateVnd: s17, focVnd: s17 });
  });

  it('S4-25 incidental line: FOC on an F&B line follows the line adjusted at the folio (line key, min(approved, new)), back up → the approved amount', async () => {
    await at('2026-12-07T15:00:00+07:00');
    await vacant('202');
    const b = await direct('202', '2026-12-07', '2026-12-09');
    await checkIn(b);
    const add = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
      category: 'fnb',
      description: 'Bữa tối',
      quantity: 1,
      unitPriceVnd: 300_000,
      serviceDate: '2026-12-07',
    });
    expect(add.statusCode, add.body).toBe(201);
    const fnb = (await liveBy(b, 'fnb'))[0]!;
    const r = await requestReduction(b, fnb.id, 300_000);
    expect((await decide('fdl', r.id)).statusCode).toBe(200);
    const adjust = async (lineId: string, price: number) => {
      const f = await folio(b);
      const res = await c.mgr!.send(
        'POST',
        url(`/folios/${b.folioId}/lines/${lineId}/adjustments`),
        { newUnitPriceVnd: price, reason: 'Sửa giá món' },
        { 'if-match': `"${f.version}"` },
      );
      expect(res.statusCode, res.body).toBe(201);
    };
    await adjust(fnb.id, 200_000);
    const after = (await liveBy(b, 'fnb'))[0]!;
    expect(after.amountVnd).toBe(200_000);
    expect((await reductions(b)).filter((x) => x[1] === 'fnb')).toEqual([
      ['2026-12-07', 'fnb', 'foc', 200_000],
    ]);
    expect((await approval(r.id)).effectiveAmountVnd).toBe(200_000);
    await adjust(after.id, 350_000);
    expect((await reductions(b)).filter((x) => x[1] === 'fnb')).toEqual([
      ['2026-12-07', 'fnb', 'foc', 300_000],
    ]);
  });

  it('S4-25 minibar: the desk self-applies a FOC within BR-436 (password) – approved at once, applied, in its own monthly budget', async () => {
    await at('2026-12-14T15:00:00+07:00');
    await vacant('203');
    const b = await direct('203', '2026-12-14', '2026-12-15');
    await checkIn(b);
    await db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, (tx) =>
      fa.app.get(FolioService).postLines(
        tx,
        b.folioId,
        [
          {
            reservationId: b.id,
            category: 'minibar',
            description: 'Bia',
            quantity: 2,
            unitPriceVnd: 30_000,
            amountVnd: 60_000,
            serviceDate: '2026-12-14',
            source: 'minibar_check',
            labelParams: { item: 'Bia', qty: 2 },
          },
        ],
        { userId: t.users.fd!.id, reservationCode: b.code },
      ),
    );
    const line = (await liveBy(b, 'minibar'))[0]!;
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${line.id}/foc`), {
      kind: 'foc',
      amountVnd: 60_000,
      reasonCode: 'regular_vip',
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json()).toMatchObject({
      status: 'approved',
      selfApplied: true,
      focState: 'applied',
      effectiveAmountVnd: 60_000,
    });
    expect(await reductions(b)).toEqual([['2026-12-14', 'minibar', 'foc', 60_000]]);
  });

  it('S4-25 / BUG-R2-093: a person added in house with the surcharge, then one FOC request per night (key = date); approved → applied per night, the nights are free of surcharge', async () => {
    await at('2027-01-04T15:00:00+07:00');
    await vacant('102');
    const b = await direct('102', '2027-01-04', '2027-01-07');
    await checkIn(b);
    await at('2027-01-05T10:00:00+07:00');
    // The 2nd booked adult first (no surcharge), then a 3rd adult above the standard occupancy.
    const first = await c.fd!.send('POST', url(`/reservations/${b.id}/party`), {
      role: 'companion',
      guestId: companions[0],
      effectiveFrom: '2027-01-05',
    });
    expect(first.statusCode, first.body).toBe(201);
    const addBody = {
      role: 'companion',
      guestId: companions[1],
      effectiveFrom: '2027-01-05',
    };
    const dry = await c.fd!.send('POST', url(`/reservations/${b.id}/party`), {
      ...addBody,
      dryRun: true,
    });
    expect(dry.statusCode, dry.body).toBe(200);
    const surcharge = dry.json().occupancyChange.surchargeVnd as number;
    const added = await c.fd!.send('POST', url(`/reservations/${b.id}/party`), {
      ...addBody,
      applyExtraPersonSurcharge: true,
      expectedSurchargeVnd: surcharge,
    });
    expect(added.statusCode, added.body).toBe(201);
    const fees = await liveBy(b, 'extra_person');
    expect(fees.map((l) => l.serviceDate)).toEqual(['2027-01-05', '2027-01-06']);
    const ids0 = [];
    for (const l of fees) ids0.push((await requestReduction(b, l.id, l.amountVnd)).id);
    for (const id of ids0) expect((await decide('fdl', id)).statusCode).toBe(200);
    expect((await reductions(b)).filter((x) => x[1] === 'extra_person')).toEqual(
      fees.map((l) => [l.serviceDate, 'extra_person', 'foc', l.amountVnd]),
    );
    expect(await totalOf(b)).toBe((await liveBy(b, 'room')).reduce((a, l) => a + l.amountVnd, 0));
  });
});
