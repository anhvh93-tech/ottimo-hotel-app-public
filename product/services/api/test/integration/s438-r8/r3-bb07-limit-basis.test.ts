/**
 * R3 Sprint 1 – lượt kiểm tiền bước 4, Phản hồi & sửa (BE-B): BR-433 (d) v0.4.1 – the PROTECTED limit basis
 * (FB-R3-SEC-BE-B-07 Blocker, ARC FB-R3-ARC-BEB-S1-08). Oracle: DOM `round-03/outputs/DOM/s1-money-oracle.md` 5.4
 * (BB07-1…7). Plus ARC S1-11 (one open "Cần chú ý" item per stay, its count updated, a new one after "Đã xem") and the
 * database guards of migration 0082 (a night line without its reference → CHECK; every notification kind of
 * STAFF_NOTIFICATION_KINDS accepted by the CHECK – ARC S1-09).
 * Rates of the seed: 101 667.000 (Fri 767.000), 202 792.000 (Fri 911.000), 401 1.042.000. In-house stays are made here in
 * April 2027; checked-out stays come from the fixture (Nov 2026). Fake clock, FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STAFF_NOTIFICATION_KINDS } from '../../../src/db/schema/frontdesk';
import { FolioService } from '../../../src/modules/folio/public/folio.service';
import { TEST_PASSWORD } from '../../helpers/feature-app';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, addDays, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)(
  'BR-433 (d) v0.4.1 – protected limit basis (FB-R3-SEC-BE-B-07 / ARC S1-08), ARC S1-09, S1-11',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
    });
    afterAll(async () => {
      await x?.close();
    });

    type B = { id: string; code: string; folioId: string };

    const inHouse = async (room: string, arrival: string, departure: string): Promise<B> => {
      await x.at(`${addDays(arrival, -10)}T10:00:00+07:00`);
      const body = {
        roomId: x.ids.rooms[room],
        channelId: x.ids.channels.direct,
        directSource: 'zalo_phone',
        adults: 2,
        bookerGuestId: x.guest,
        paymentModel: 'direct',
        arrivalDate: arrival,
        departureDate: departure,
      };
      let res = await x.c.fd!.send('POST', x.url('/reservations'), body);
      if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
        res = await x.c.fd!.send('POST', x.url('/reservations'), {
          ...body,
          initialPayment: {
            type: 'deposit',
            method: 'cash',
            amountVnd: res.json().depositRequiredVnd,
          },
        });
      }
      expect(res.statusCode, res.body).toBe(201);
      const b = res.json() as B;
      await x.at(`${arrival}T15:00:00+07:00`);
      await x.q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [x.ids.rooms[room]]);
      const due = (await x.folio(b.folioId)).totals.balanceDueVnd as number;
      if (due > 0) {
        expect(
          (await x.pay(b.folioId, { type: 'charge', method: 'cash', amountVnd: due })).statusCode,
        ).toBe(201);
      }
      const ci = await x.act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '15:00',
      });
      expect(ci.statusCode, ci.body).toBe(200);
      await x.at(`${arrival}T16:00:00+07:00`);
      return b;
    };
    const charge = async (b: { folioId: string }, amountVnd: number, serviceDate: string) => {
      const r = await x.c.fd!.send('POST', x.url(`/folios/${b.folioId}/lines`), {
        category: 'fnb',
        description: 'Dịch vụ phát sinh',
        quantity: 1,
        unitPriceVnd: amountVnd,
        serviceDate,
      });
      expect(r.statusCode, r.body).toBe(201);
      return (r.json().lines as any[])
        .filter((l) => l.category === 'fnb' && l.amountVnd === amountVnd && !l.reversalOfId)
        .pop().id as string;
    };
    const waive = (b: { folioId: string }, lineId: string, amountVnd: number, who = 'mgr') =>
      x.c[who]!.send('POST', x.url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
        kind: 'foc',
        amountVnd,
        reasonCode: 'service_recovery',
        note: 'Bù cho khách',
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
    /** Live room lines of the folio, date order. */
    const nights = async (b: { folioId: string }) =>
      ((await x.liveLineIds(b as any, 'room')) as any[]).sort((p, q) =>
        p.serviceDate < q.serviceDate ? -1 : 1,
      );
    /** A31 / A32: the room line's new unit price (MGR). */
    const reprice = async (b: { folioId: string }, lineId: string, price: number, who = 'mgr') =>
      x.adjust(
        b as any,
        lineId,
        { newUnitPriceVnd: price, reason: 'Sửa giá đêm' },
        undefined,
        who,
      )();
    const basis = (folioId: string, lineId: string | null = null) =>
      x.db.withContext(x.t.ctx(), (tx) =>
        x.fa.app.get(FolioService).limitBasisVnd(tx, folioId, lineId),
      );
    const told = async (b: B) =>
      (
        await x.q(
          `SELECT count(*)::int AS n FROM staff_notification
            WHERE kind = 'foc_stay_total_exceeded' AND ref_id = $1 AND user_id = $2`,
          [b.id, x.t.users.owner!.id],
        )
      )[0].n as number;
    const items = async (b: B) =>
      ((await x.c.owner!.get(x.url('/attention'))).json().data as any[]).filter(
        (i) => i.kind === 'foc_stay_total_exceeded' && (i.reservationIds ?? []).includes(b.id),
      );
    const due = async (s: { folioId: string }) =>
      (await x.folio(s.folioId)).totals.balanceDueVnd as number;
    const open = async (s: any) => (await x.openDebtOf(s))?.openDebtVnd ?? 0;

    /** Debt 5.000.000 on a checked-out stay whose nights are all at `b` (one rate) – returns its first room line. */
    const debt5m = async () => {
      for (;;) {
        const s = await x.checkedOutStay({ big: 5_000_000 });
        const ns = await nights(s);
        const b = ns[0].unitPriceVnd as number;
        if (ns.some((n: any) => n.unitPriceVnd !== b) || b >= 1_000_000) continue;
        expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
        expect(await open(s)).toBe(5_000_000);
        return { s, b, room: ns[0].id as string, roomTotal: ns.length * b };
      }
    };

    it('BB07-1 (SEC Q1): debt 5.000.000 – MGR A32 raises a night to 5.000.000 (201, basis unchanged), asks a write-off of 4.000.000 → PENDING OWN (Σ > basis), lowers the night back (201) → B = O = 5.000.000, nothing written off, no stay alert', async () => {
      const { s, b, room } = await debt5m();
      const captured = (
        await x.q('SELECT limit_basis_checkout_vnd AS v FROM folio WHERE id = $1', [s.folioId])
      )[0].v;
      expect(Number(captured)).toBe(b);
      const up = await reprice(s, room, 5_000_000);
      expect(up.statusCode, up.body).toBe(201);
      expect(await due(s)).toBe(5_000_000 + (5_000_000 - b));
      expect(await open(s)).toBe(5_000_000);
      expect(await basis(s.folioId)).toBe(b);
      const w = await x.writeOff(s, s.bigLineId!, 4_000_000)();
      expect(outcome(w)).toBe('201 pending eff 4000000');
      const raised = (await nights(s)).find((n: any) => n.unitPriceVnd === 5_000_000);
      const down = await reprice(s, raised.id, b);
      expect(down.statusCode, down.body).toBe(201);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 5_000_000, O: 5_000_000 });
      expect((await x.state(s)).writeOffs).toEqual(['pending:4000000']);
      expect(
        await x.q('SELECT 1 FROM foc_stay_alert WHERE stay_root_reservation_id = $1', [s.id]),
      ).toEqual([]);
    }, 180_000);

    it('BB07-2: after the raise of BB07-1, a write-off of exactly the basis → self-applied (O 5.000.000 − basis); +1.000 → pending', async () => {
      const { s, b, room } = await debt5m();
      expect((await reprice(s, room, 5_000_000)).statusCode).toBe(201);
      expect(outcome(await x.writeOff(s, s.bigLineId!, b)())).toBe(`201 approved eff ${b}`);
      expect(await open(s)).toBe(5_000_000 - b);
      expect(outcome(await x.writeOff(s, s.bigLineId!, 1_000)())).toBe('201 pending eff 1000');
    }, 180_000);

    it('BB07-3 (in house, (b)): 101 at 667.000 – MGR re-prices the night to 1.900.000 (A31 ceiling of the seed – oracle 3.000.000 is above it), FOC 1.500.000 on a damage of 3.000.000 → basis min(1.900.000, 667.000) = 667.000 → PENDING OWN; the night lowered back → still pending, basis 667.000', async () => {
      const bk = await inHouse('101', '2027-04-05', '2027-04-07');
      const n0 = (await nights(bk))[0];
      expect(n0.unitPriceVnd).toBe(667_000);
      const up = await reprice(bk, n0.id, 1_900_000);
      expect(up.statusCode, up.body).toBe(201);
      const dmg = await charge(bk, 3_000_000, '2027-04-05');
      expect(await basis(bk.folioId, dmg)).toBe(667_000);
      const r = await waive(bk, dmg, 1_500_000);
      expect(outcome(r)).toBe('201 pending eff 1500000');
      const raised = (await nights(bk)).find((n: any) => n.unitPriceVnd === 1_900_000);
      expect((await reprice(bk, raised.id, 667_000)).statusCode).toBe(201);
      const [req] = await x.q('SELECT status FROM approval_request WHERE id = $1', [r.json().id]);
      expect(req.status).toBe('pending');
      expect(await basis(bk.folioId, dmg)).toBe(667_000);
    }, 180_000);

    it('BB07-4 (ESC-026 threshold): night raised to 1.900.000 as in BB07-3 – MGR waives 300.000, 250.000, 300.000 on three keys → all applied; threshold 667.000; Σ 550.000 nothing, Σ 850.000 → OWN told', async () => {
      const bk = await inHouse('101', '2027-04-12', '2027-04-14');
      const n0 = (await nights(bk))[0];
      expect((await reprice(bk, n0.id, 1_900_000)).statusCode).toBe(201);
      const l = [
        await charge(bk, 300_000, '2027-04-12'),
        await charge(bk, 250_000, '2027-04-12'),
        await charge(bk, 300_000, '2027-04-13'),
      ];
      expect(outcome(await waive(bk, l[0]!, 300_000))).toBe('201 approved eff 300000');
      expect(outcome(await waive(bk, l[1]!, 250_000))).toBe('201 approved eff 250000');
      expect(await told(bk)).toBe(0);
      expect(outcome(await waive(bk, l[2]!, 300_000))).toBe('201 approved eff 300000');
      expect(await told(bk)).toBe(1);
    }, 180_000);

    it('BB07-5 (a valid system change): the guest moves 101 → 401 (B14 guest request, reference 1.042.000) → basis 1.042.000; MGR FOC 1.000.000 on a damage → self-applied', async () => {
      const bk = await inHouse('101', '2027-04-19', '2027-04-21');
      await x.q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [x.ids.rooms['401']]);
      const body = {
        newRoomId: x.ids.rooms['401'],
        effectiveDate: '2027-04-19',
        cause: 'guest_request',
        reason: 'Khách muốn căn rộng hơn',
        oldRoomVacated: true,
      };
      const dry = await x.act(bk.id, 'change-room', { ...body, dryRun: true }, 'mgr');
      expect(dry.statusCode, dry.body).toBe(200);
      const mv = await x.act(
        bk.id,
        'change-room',
        { ...body, applyDifference: true, expectedDeltaVnd: dry.json().folioDeltaVnd },
        'mgr',
      );
      expect(mv.statusCode, mv.body).toBe(200);
      expect(await basis(bk.folioId)).toBe(1_042_000);
      const dmg = await charge(bk, 1_500_000, '2027-04-19');
      expect(outcome(await waive(bk, dmg, 1_000_000))).toBe('201 approved eff 1000000');
    }, 180_000);

    it('BB07-6 (hand edit DOWN counts): 202 at 792.000, the lead lowers the night to 540.000 → basis 540.000 (min); MGR FOC 600.000 → pending', async () => {
      const bk = await inHouse('202', '2027-04-26', '2027-04-28');
      const n0 = (await nights(bk))[0];
      expect(n0.unitPriceVnd).toBe(792_000);
      let low = await reprice(bk, n0.id, 540_000, 'lead');
      if (low.statusCode !== 201) low = await reprice(bk, n0.id, 540_000, 'mgr'); // BR-105 floor of the lead
      expect(low.statusCode, low.body).toBe(201);
      const dmg = await charge(bk, 1_000_000, '2027-04-26');
      expect(await basis(bk.folioId, dmg)).toBe(540_000);
      expect(outcome(await waive(bk, dmg, 600_000))).toBe('201 pending eff 600000');
    }, 180_000);

    it('BB07-7 (after B18 nothing raises it): the basis captured by settle stays the ceiling – a room line raised by A32 after check-out leaves limitBasisVnd = the captured basis; nothing writes the capture again', async () => {
      const { s, b, room } = await debt5m();
      expect((await reprice(s, room, 3_000_000)).statusCode).toBe(201);
      expect(await basis(s.folioId)).toBe(b);
      const [f] = await x.q('SELECT limit_basis_checkout_vnd AS v FROM folio WHERE id = $1', [
        s.folioId,
      ]);
      expect(Number(f.v)).toBe(b);
    }, 180_000);

    it('ARC S1-11: one OPEN item per stay – a later crossing updates its count; after OWN "Đã xem" a new crossing opens a new item', async () => {
      const bk = await inHouse('202', '2027-04-01', '2027-04-03'); // Thu–Fri: threshold 911.000
      const l = [
        await charge(bk, 600_000, '2027-04-01'),
        await charge(bk, 400_000, '2027-04-01'),
        await charge(bk, 50_000, '2027-04-02'),
        await charge(bk, 60_000, '2027-04-02'),
      ];
      expect(outcome(await waive(bk, l[0]!, 600_000))).toBe('201 approved eff 600000');
      expect(outcome(await waive(bk, l[1]!, 400_000))).toBe('201 approved eff 400000');
      let it1 = await items(bk);
      expect(it1).toHaveLength(1);
      expect(it1[0].params).toEqual({ count: 2 });
      expect(outcome(await waive(bk, l[2]!, 50_000))).toBe('201 approved eff 50000');
      it1 = await items(bk);
      expect(it1).toHaveLength(1);
      expect(it1[0].params).toEqual({ count: 3 });
      const ack = await x.c.owner!.send(
        'POST',
        x.url(`/attention-events/${it1[0].eventId}/actions/resolve`),
        {},
      );
      expect(ack.statusCode, ack.body).toBeLessThan(300);
      expect(await items(bk)).toEqual([]);
      expect(outcome(await waive(bk, l[3]!, 60_000))).toBe('201 approved eff 60000');
      const it2 = await items(bk);
      expect(it2).toHaveLength(1);
      expect(it2[0].eventId).not.toBe(it1[0].eventId);
      expect(it2[0].params).toEqual({ count: 4 });
      expect(await told(bk)).toBe(3);
    }, 180_000);

    it('0082 guards: a night line without its reference → CHECK folio_line_limit_ref_required_check; every kind of STAFF_NOTIFICATION_KINDS passes the staff_notification CHECK (ARC S1-09)', async () => {
      const { s } = await debt5m();
      await expect(
        x.q(
          `INSERT INTO folio_line (id, organization_id, property_id, folio_id, category, revenue_group, description,
             quantity, unit_price_vnd, amount_vnd, line_state, source, posted_at, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, 'room', 'room', 'room_night', 1, 100000, 100000, 'posted',
             'system', now(), now())`,
          [x.t.organizationId, x.t.propertyIds[0], s.folioId],
        ),
      ).rejects.toThrow(/folio_line_limit_ref_required_check/);
      const client = await x.db.pool.connect();
      try {
        for (const kind of STAFF_NOTIFICATION_KINDS) {
          await client.query('BEGIN');
          await client.query(
            `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
            [x.t.organizationId, x.t.propertyIds[0]],
          );
          await client.query(
            `INSERT INTO staff_notification (id, organization_id, property_id, user_id, kind, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, now())`,
            [x.t.organizationId, x.t.propertyIds[0], x.t.users.owner!.id, kind],
          );
          await client.query('ROLLBACK');
        }
      } finally {
        await client.query('ROLLBACK').catch(() => undefined);
        client.release();
      }
    }, 120_000);
  },
);
