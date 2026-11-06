/**
 * FB-R5-DOM-BE-PR99-01 (Major, DOM rules-v1.0.5 15.5; BR-903, BR-527): the "money after check-out" anchor of
 * FolioService.tryEarnCommissions is when B18 was RECORDED (`folio.settled_at`), not `reservation.actual_checkout_at`
 * – since 0.3.13 (BE C0313-03, PR #99) that is the guest's departure (`checkoutAt`), earlier than the press.
 * Real B18 on Nest/Fastify + PostgreSQL; a sale (`closerUserId`) closed every stay (staff commission). Fake clock,
 * FAKE data only.
 * - DOM case 1 / ORC: summary 11:58 (`checkoutAt` 11:58), check_out VietQR created 12:00 and confirmed 12:01
 *   (reconciliation `pending`), B18 12:03 → `earned` at 12:03.
 * - The B18 `finalPayment` by transfer (reconciliation `pending`) with `checkoutAt` 20 minutes earlier → `earned`.
 * - Overdue stay (V5-15): left 22/11 11:00, the desk records a transfer 22/11 15:00, the manager records B18 23/11
 *   09:00 → `earned` at 23/11 09:00.
 * Money collected by transfer AFTER B18 still waits for its reconciliation: reversal-debt-g4.test.ts ("DOM 18/10 …
 * commission earned only when the transfer is reconciled"); the payee's own receipt: payments-s3.test.ts BR-527-05.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  NoGuestAccessPort,
  NoMinibarPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
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
  fd: ['front_desk'],
  sal: ['sales_staff'],
};
const DESK = ['own', 'mgr', 'fd'];
/** Fake receiving account (same test values as vietqr-stay-step.test.ts). */
const ACCOUNT = { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO TEST' };
const ARRIVAL = '2026-11-20';
const DEPARTURE = '2026-11-22';
const iso = (s: string) => new Date(s).toISOString();

type Booking = { id: string; code: string; folioId: string };

describe.skipIf(!HAS_DB)('PR99-01 – commission anchor = B18 recording time (BE-A2)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử Hoa Hồng' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
          inject: [FD_CHILD_DATA_PORT],
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
          new Date('2036-12-31T00:00:00Z'),
        ],
      ),
    );
    for (const u of DESK) c[u]!.deviceToken = token;
    for (const u of Object.keys(ROLES)) await setPassword(db, t, u);
    // 0.3.8 (R3-Q51): the receiving account takes effect from the next business day.
    await at('2026-11-01T09:00:00+07:00');
    const put = await c.own!.send('PUT', url('/parameters/payment_receiving_account'), {
      value: ACCOUNT,
      effectiveFrom: '2026-11-02',
      reason: 'Tài khoản nhận thử nghiệm',
      reauth: { authMethod: 'password', secret: TEST_PASSWORD },
    });
    expect(put.statusCode, put.body).toBe(200);
  }, 180_000);
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (path = '') => `${P(t)}${path}`;
  async function at(when: string) {
    const d = new Date(when);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  }
  const q = (sql: string, a: unknown[] = []) =>
    db.withContext(t.ctx(), async (tx) => (await tx.query(sql, a)).rows as any[]);
  const folio = async (b: Booking) => (await c.mgr!.get(url(`/folios/${b.folioId}`))).json();
  async function act(b: Booking, verb: string, body: unknown, who = 'fd') {
    const v = (await c[who]!.get(url(`/reservations/${b.id}`))).json().version;
    return c[who]!.send('POST', url(`/reservations/${b.id}/actions/${verb}`), body, {
      'if-match': `"${v}"`,
    });
  }
  const commissions = (b: Booking) =>
    q(
      `SELECT status, recognized_at, payee_user_id FROM commission
        WHERE reservation_id = $1 AND status <> 'void'`,
      [b.id],
    );
  const stamps = async (b: Booking) =>
    (
      await q(
        `SELECT r.actual_checkout_at, f.settled_at FROM reservation r JOIN folio f ON f.id = r.folio_id
          WHERE r.id = $1`,
        [b.id],
      )
    )[0];

  /** A sale's booking (staff commission), paid in full at check-in; an F&B line of `extraVnd` left to pay. */
  async function stay(room: string, extraVnd: number): Promise<Booking> {
    await at('2026-11-10T10:00:00+07:00');
    const body = {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'sales_staff',
      closerUserId: t.users.sal!.id,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: ARRIVAL,
      departureDate: DEPARTURE,
    };
    let res = await c.fd!.send('POST', url('/reservations'), body);
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c.fd!.send('POST', url('/reservations'), {
        ...body,
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: res.json().depositRequiredVnd,
        },
      });
    }
    expect(res.statusCode, res.body).toBe(201);
    const b = res.json() as Booking;
    await at(`${ARRIVAL}T15:00:00+07:00`);
    await q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) {
      const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    const ci = await act(b, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at(`${ARRIVAL}T20:00:00+07:00`);
    const line = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
      category: 'fnb',
      description: 'Bữa tối',
      quantity: 1,
      unitPriceVnd: extraVnd,
    });
    expect(line.statusCode, line.body).toBe(201);
    expect((await commissions(b)).map((x) => x.status)).toEqual(['projected']);
    return b;
  }

  it('DOM case 1: summary 11:58, check_out VietQR 12:00 confirmed 12:01 (pending reconciliation), B18 12:03 → earned at 12:03', async () => {
    const b = await stay('201', 200_000);
    await at(`${DEPARTURE}T11:58:00+07:00`);
    const s = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=11%3A58`));
    expect(s.statusCode, s.body).toBe(200);
    const checkoutAt = s.json().checkoutAt as string;
    expect(iso(checkoutAt)).toBe(iso(`${DEPARTURE}T11:58:00+07:00`));
    expect(s.json().amountDueAtCheckoutVnd).toBe(200_000);

    await at(`${DEPARTURE}T12:00:00+07:00`);
    const qr = await c.fd!.send('POST', url(`/folios/${b.folioId}/vietqr`), {
      purpose: 'check_out',
      amountVnd: 200_000,
      checkoutAt,
    });
    expect(qr.statusCode, qr.body).toBe(201);
    const pid = qr.json().payment.id as string;
    await at(`${DEPARTURE}T12:01:00+07:00`);
    const got = await c.fd!.send('POST', url(`/payments/${pid}/actions/confirm-received`), {
      note: 'FT2611220001 – khách quét VietQR',
    });
    expect(got.statusCode, got.body).toBe(200);
    expect(got.json()).toMatchObject({ status: 'succeeded', reconciliation: 'pending' });

    await at(`${DEPARTURE}T12:03:00+07:00`);
    const out = await act(b, 'check-out', { checkoutAt });
    expect(out.statusCode, out.body).toBe(200);
    const st = await stamps(b);
    // the receipt (12:00) is after the guest's departure (11:58) but before B18 was recorded (12:03)
    expect(iso(st.actual_checkout_at)).toBe(iso(`${DEPARTURE}T11:58:00+07:00`));
    expect(iso(st.settled_at)).toBe(iso(`${DEPARTURE}T12:03:00+07:00`));
    const cm = await commissions(b);
    expect(cm).toHaveLength(1);
    expect(cm[0]).toMatchObject({ status: 'earned', payee_user_id: t.users.sal!.id });
    expect(iso(cm[0].recognized_at)).toBe(iso(`${DEPARTURE}T12:03:00+07:00`));
  });

  it('B18 finalPayment by transfer (pending reconciliation), checkoutAt 20 minutes before the press → earned at B18', async () => {
    const b = await stay('202', 150_000);
    await at(`${DEPARTURE}T12:10:00+07:00`);
    const out = await act(b, 'check-out', {
      checkoutAt: `${DEPARTURE}T11:50:00+07:00`,
      finalPayment: { type: 'charge', method: 'bank_transfer', amountVnd: 150_000 },
    });
    expect(out.statusCode, out.body).toBe(200);
    const [p] = await q(
      `SELECT reconciliation FROM payment WHERE folio_id = $1 AND method = 'bank_transfer'`,
      [b.folioId],
    );
    expect(p.reconciliation).toBe('pending');
    expect(iso((await stamps(b)).actual_checkout_at)).toBe(iso(`${DEPARTURE}T11:50:00+07:00`));
    const cm = await commissions(b);
    expect(cm[0]).toMatchObject({ status: 'earned' });
    expect(iso(cm[0].recognized_at)).toBe(iso(`${DEPARTURE}T12:10:00+07:00`));
  });

  it('overdue stay: left 22/11 11:00, the desk records a transfer 22/11 15:00, the manager records B18 23/11 09:00 → earned at 23/11 09:00', async () => {
    const b = await stay('203', 120_000);
    await at(`${DEPARTURE}T15:00:00+07:00`);
    const tr = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
      type: 'charge',
      method: 'bank_transfer',
      amountVnd: 120_000,
    });
    expect(tr.statusCode, tr.body).toBe(201);
    expect(tr.json().reconciliation).toBe('pending');
    await at('2026-11-23T09:00:00+07:00');
    const out = await act(
      b,
      'check-out',
      {
        checkoutAt: `${DEPARTURE}T11:00:00+07:00`,
        overdueReason: 'Khách đã đi trưa 22/11, quầy ghi sáng nay',
      },
      'mgr',
    );
    expect(out.statusCode, out.body).toBe(200);
    expect(iso((await stamps(b)).actual_checkout_at)).toBe(iso(`${DEPARTURE}T11:00:00+07:00`));
    const cm = await commissions(b);
    expect(cm[0]).toMatchObject({ status: 'earned' });
    expect(iso(cm[0].recognized_at)).toBe(iso('2026-11-23T09:00:00+07:00'));
  });
});
