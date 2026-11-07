/**
 * PR-B3c (Round 5, v1.0.5, BE-D2) – contract 0.3.13 bổ sung 1j, DOM FB-R5-DOM-ARC-148-02 (ARC review #148 mục 5) on
 * PostgreSQL: `getReservation` → `cancellation.cancelledFrom`, read from `reservation.status_before_cancel`:
 * - an OTA booking cancelled by the OTA → `confirmed` for OWN, MGR, FDL, FD;
 * - a sale's hold expired by J1 → `hold` for FD; the sale reading its own booking keeps `cancellation` without the
 *   field (x-visible-to FD+);
 * - a no-show (status_before_cancel `confirmed` in the DB) has no `cancellation`; an open booking neither.
 * The Desk picks the receipt `type` on a closed booking from this field (5B-1: `hold` → `deposit`, else `charge`).
 * Fake clock and FAKE data only (fixture guest).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JobRunner } from '../../src/jobs/job-runner';
import { HOLD_EXPIRY_JOB_KEY } from '../../src/jobs/reservation-jobs';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, startFixture } from './s438-r8/fixture';

describe.skipIf(!HAS_DB)('PR-B3c – Reservation.cancellation.cancelledFrom (1j, DOM 148-02)', () => {
  let x: Fx;
  beforeAll(async () => {
    process.env.BLOBSTORE_PROVIDER = 'memory';
    x = await startFixture();
  });
  afterAll(async () => {
    await x?.close();
  });

  type B = { id: string; code: string };
  let seq = 0;
  /** OTA "pay at hotel" booking (Booking.com channel). */
  const otaBooking = async (room: string, arrivalDate: string, departureDate: string) => {
    const res = await x.c.fd!.send('POST', x.url('/reservations'), {
      roomId: x.ids.rooms[room],
      channelId: x.ids.channels.booking,
      adults: 2,
      bookerGuestId: x.guest,
      paymentModel: 'ota_pay_at_property',
      otaRef: `BK-PRB3C-${seq++}`,
      otaRoomAmountVnd: 1_800_000,
      arrivalDate,
      departureDate,
    });
    expect(res.statusCode, res.body).toBe(201);
    const b = res.json();
    return { id: b.id as string, code: b.code as string };
  };
  /** A hold created by the sale (own booking for SAL). */
  const salHold = async (room: string): Promise<B> => {
    const svc = x.fa.app.get(ReservationsService);
    const user = x.t.users.sal!.id;
    const row = await x.db.withContext(
      { ...x.t.ctx(), userId: user, actorType: 'user' },
      async (tx) => {
        const ctx = await svc.context(tx, { userId: user, roles: ['sales_staff'] });
        return svc.createHold(tx, ctx, {
          roomId: x.ids.rooms[room]!,
          channelId: x.ids.channels.direct!,
          arrivalDate: '2026-12-20',
          departureDate: '2026-12-22',
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: x.guest,
          holdHours: 24,
        });
      },
    );
    return { id: row.id, code: row.code };
  };
  const j1 = () =>
    x.fa.app.get(JobRunner).runOnce(HOLD_EXPIRY_JOB_KEY, {
      propertyId: x.t.propertyIds[0]!,
      organizationId: x.t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    });
  const read = async (b: B, who = 'fd') => {
    const res = await x.c[who]!.get(x.url(`/reservations/${b.id}`));
    expect(res.statusCode, res.body).toBe(200);
    return res.json();
  };

  let ota: B; // confirmed, cancelled by the OTA
  let open: B; // confirmed, still open
  let hS: B; // the sale's hold, expired by J1
  let ns: B; // confirmed, marked no-show

  it('setup: an OTA booking cancelled, an open one, a sale hold expired by J1, a no-show', async () => {
    await x.at('2026-11-20T10:00:00+07:00');
    ota = await otaBooking('101', '2026-12-10', '2026-12-12');
    open = await otaBooking('102', '2026-12-10', '2026-12-12');
    ns = await otaBooking('103', '2026-11-21', '2026-11-23');
    hS = await salHold('201');
    const cancel = await x.act(ota.id, 'cancel', {
      reasonCode: 'ota_cancelled',
      otaPenaltyVnd: 500_000,
    });
    expect(cancel.statusCode, cancel.body).toBe(200);
    await x.at('2026-11-21T10:01:00+07:00');
    expect((await j1()).stats).toMatchObject({ expired: 1, failed: 0 });
    await x.at('2026-11-21T23:30:00+07:00');
    const mark = await x.act(ns.id, 'mark-no-show', {
      contactAttemptNote: 'Gọi 3 lần không nghe máy',
    });
    expect(mark.statusCode, mark.body).toBe(200);
    const st = await x.q(
      `SELECT id, status, status_before_cancel FROM reservation WHERE id = ANY($1)`,
      [[ota.id, open.id, hS.id, ns.id]],
    );
    expect(Object.fromEntries(st.map((r) => [r.id, [r.status, r.status_before_cancel]]))).toEqual({
      [ota.id]: ['cancelled', 'confirmed'],
      [open.id]: ['confirmed', null],
      [hS.id]: ['cancelled', 'hold'],
      [ns.id]: ['no_show', 'confirmed'],
    });
  }, 180_000);

  it('a confirmed booking cancelled → cancelledFrom confirmed for OWN, MGR, FDL and FD', async () => {
    for (const who of ['owner', 'mgr', 'lead', 'fd']) {
      expect((await read(ota, who)).cancellation, who).toMatchObject({
        reasonCode: 'ota_cancelled',
        cancelledFrom: 'confirmed',
      });
    }
  });

  it('a hold expired by J1 → cancelledFrom hold for FD; the sale reads its own booking without the field', async () => {
    expect((await read(hS)).cancellation).toMatchObject({
      reasonCode: 'hold_expired',
      cancelledFrom: 'hold',
    });
    const sal = await read(hS, 'sal');
    expect(sal.status).toBe('cancelled');
    expect(sal.cancellation).toMatchObject({ reasonCode: 'hold_expired' });
    expect(sal.cancellation).toHaveProperty('cancelledAt');
    expect(sal.cancellation).not.toHaveProperty('cancelledFrom');
  });

  it('a no-show and an open booking have no cancellation', async () => {
    const n = await read(ns);
    expect(n.status).toBe('no_show');
    expect(n).not.toHaveProperty('cancellation');
    expect(JSON.stringify(n)).not.toContain('cancelledFrom');
    const o = await read(open);
    expect(o.status).toBe('confirmed');
    expect(o).not.toHaveProperty('cancellation');
  });
});
