/**
 * R3 Sprint 1 – lượt kiểm tiền bước 4 (BE-B): BE-83 (R3-Q22, FB-R2-SEC-BE-83) + ESC-026 A + R3-Q25.
 * Oracle: DOM `round-03/outputs/DOM/s1-money-oracle.md` mục 5 (BR-525-21…27, BR-433-04/05, E26-1…5, 9) = fixture rows
 * `pendingFix R3-SEC-BE-83` / `R3-ESC-026`; BR-433 (a)(b)(c) v0.4.0; SEC `s1-security-requirements.md` B.5.
 * - (a) a write-off is routed by Σ of the folio (applied + pending + this one, every cycle) vs the folio's highest night;
 * - (b) a FOC by Σ of its key (applied + asked + this one) vs the per-time limit of the role;
 * - (c) Σ of the waivers applied on a stay by FD/FDL/MGR above the threshold → OWN told at every waiver applied while
 *   above, ONE "Cần chú ý" item (OWN only), nothing blocked;
 * - R3-Q25: a write-off request needs the requester's re-authentication (S1).
 * Stays of (b)/(c) are created here in March 2027 (rates of the seed: 101 667.000 / Fri 767.000; 202, 203 792.000 /
 * Fri 911.000); write-off stays use the fixture's checked-out stays (Nov 2026). Fake clock, FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TEST_PASSWORD } from '../../helpers/feature-app';
import { HAS_DB, setParam } from '../../helpers/tenant';
import { type Fx, addDays, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)(
  'R3-Q22 BE-83 + ESC-026 A + R3-Q25 – cumulative waiver limits and the stay alert (BR-433 (a)(b)(c) v0.4.0)',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
      // FD self-waivers on F&B lines too in this tenant only (BR-436 is minibar – the fixture has no minibar count);
      // the rule under test is the same per-time limit (100.000).
      await setParam(
        x.db,
        x.t,
        'foc_self_apply.front_desk.categories',
        ['minibar', 'fnb'],
        '2026-10-02',
      );
    });
    afterAll(async () => {
      await x?.close();
    });

    type B = { id: string; code: string; folioId: string };
    type S = Awaited<ReturnType<Fx['checkedOutStay']>>;

    /** A direct stay in `room` [arrival, departure), checked in at 15:00 with everything due paid in cash. */
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
        const p = await x.pay(b.folioId, { type: 'charge', method: 'cash', amountVnd: due });
        expect(p.statusCode, p.body).toBe(201);
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
    const charge = async (b: B, amountVnd: number, serviceDate: string) => {
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
    const waive = (
      b: { folioId: string },
      lineId: string,
      amountVnd: number,
      who = 'mgr',
      kind: 'foc' | 'special_discount' = 'foc',
    ) =>
      x.c[who]!.send('POST', x.url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
        kind,
        amountVnd,
        reasonCode: 'service_recovery',
        note: 'Bù cho khách',
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
    const told = async (b: B) =>
      (
        await x.q(
          `SELECT count(*)::int AS n FROM staff_notification
            WHERE kind = 'foc_stay_total_exceeded' AND ref_id = $1 AND user_id = $2`,
          [b.id, x.t.users.owner!.id],
        )
      )[0].n as number;
    const items = async (b: B, who = 'owner') =>
      ((await x.c[who]!.get(x.url('/attention'))).json().data as any[]).filter(
        (i) => i.kind === 'foc_stay_total_exceeded' && (i.reservationIds ?? []).includes(b.id),
      );
    const requiredRole = async (approvalId: string) =>
      (await x.q('SELECT required_role FROM approval_request WHERE id = $1', [approvalId]))[0]
        .required_role as string;
    const basisOf = async (s: { folioId: string }) =>
      Number(
        (
          await x.q(
            `SELECT max(unit_price_vnd) AS b FROM folio_line WHERE folio_id = $1 AND category = 'room'
              AND line_state = 'posted' AND reversal_of_id IS NULL`,
            [s.folioId],
          )
        )[0].b,
      );

    // ─────────────────────────── (a) write-offs: Σ of the folio (BR-525-21…27) ───────────────────────────

    /** Debt 5.000.000 on a stay whose highest night is in [450.000, 900.000) (the fixture rotates rooms; 301/302 skipped). */
    const debt5m = async () => {
      for (;;) {
        const s = await x.checkedOutStay({ big: 5_000_000 });
        const basis = await basisOf(s);
        if (basis < 450_000 || basis >= 900_000) continue;
        expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
        return { s, basis };
      }
    };

    it('BR-525-21 + 22: debt 5.000.000 – MGR 12 × 450.000 → #1 self-applied, #2–#11 pending OWN, #12 → 422 max 50.000; OWN rejects the 10 → MGR basis − 450.000 → Σ = basis → self-applied; +1.000 → pending', async () => {
      const { s, basis } = await debt5m();
      const seq: string[] = [];
      const ids: string[] = [];
      for (let i = 0; i < 12; i++) {
        const r = await x.writeOff(s, s.bigLineId!, 450_000)();
        seq.push(outcome(r));
        if (r.statusCode === 201) ids.push(r.json().id);
      }
      expect(seq[0]).toBe('201 approved eff 450000');
      for (let i = 1; i <= 10; i++) expect(seq[i], `#${i + 1}`).toBe('201 pending eff 450000');
      expect(seq[11]).toBe('422 VALIDATION_FAILED/AMOUNT_EXCEEDS_BALANCE max 50000');
      for (const id of ids.slice(1)) {
        expect(await requiredRole(id)).toBe('owner');
        expect((await x.decide(id, 'reject')()).statusCode).toBe(200);
      }
      expect(outcome(await x.writeOff(s, s.bigLineId!, basis - 450_000)())).toBe(
        `201 approved eff ${basis - 450_000}`,
      );
      expect(outcome(await x.writeOff(s, s.bigLineId!, 1_000)())).toBe('201 pending eff 1000');
    }, 180_000);

    it('BR-525-23: (a) MGR 2.000.000 (pending OWN) then 100.000 → Σ 2.100.000 → pending; (b) OWN approved 3.000.000 (self) → MGR 100.000 → Σ 3.100.000 → pending', async () => {
      const a = await debt5m();
      expect(outcome(await x.writeOff(a.s, a.s.bigLineId!, 2_000_000)())).toBe(
        '201 pending eff 2000000',
      );
      expect(outcome(await x.writeOff(a.s, a.s.bigLineId!, 100_000)())).toBe(
        '201 pending eff 100000',
      );
      const b = await debt5m();
      expect(outcome(await x.writeOff(b.s, b.s.bigLineId!, 3_000_000, { who: 'owner' })())).toBe(
        '201 approved eff 3000000',
      );
      expect(outcome(await x.writeOff(b.s, b.s.bigLineId!, 100_000)())).toBe(
        '201 pending eff 100000',
      );
    }, 180_000);

    it('BR-525-24: the basis is the FOLIO’s highest night, not the line chosen – 101 Thu 667.000 + Fri 767.000, debt 1.000.000: 400.000 on the Thursday night then 367.000 on the Friday night → both self-applied (Σ 767.000); 1.000 more → pending OWN', async () => {
      const b = await inHouse('101', '2027-03-25', '2027-03-27');
      const unpaid = await charge(b, 1_000_000, '2027-03-25');
      await x.at('2027-03-27T11:00:00+07:00');
      const out = await x.act(
        b.id,
        'check-out',
        {
          checkoutTime: '11:00',
          debt: { dueDate: '2027-03-30', reason: 'Khách hẹn chuyển khoản' },
        },
        'mgr',
      );
      expect(out.statusCode, out.body).toBe(200);
      const nights = ((await x.folio(b.folioId)).lines as any[])
        .filter((l) => l.category === 'room' && l.lineState === 'posted' && !l.reversalOfId)
        .sort((p, q) => (p.serviceDate < q.serviceDate ? -1 : 1));
      expect(nights.map((n) => n.amountVnd)).toEqual([667_000, 767_000]);
      expect(outcome(await x.writeOff(b as any, nights[0].id, 400_000)())).toBe(
        '201 approved eff 400000',
      );
      expect(outcome(await x.writeOff(b as any, nights[1].id, 367_000)())).toBe(
        '201 approved eff 367000',
      );
      expect(outcome(await x.writeOff(b as any, unpaid, 1_000)())).toBe('201 pending eff 1000');
    }, 180_000);

    it('BR-525-25: two debt cycles of one folio add up – B18 debt 1.000.000, MGR writes off basis − 50.000 (self), guest pays the rest; J15 opens a new debt 70.000; MGR 70.000 → Σ basis + 20.000 → pending OWN', async () => {
      const s: S = await x.checkedOutStay({ b18Debt: { unpaid: 1_000_000, finalPay: 0 } });
      const basis = await basisOf(s);
      const w1 = basis - 50_000;
      expect(outcome(await x.writeOff(s, s.bigLineId!, w1)())).toBe(`201 approved eff ${w1}`);
      const rest = (await x.folio(s.folioId)).totals.balanceDueVnd as number;
      expect((await x.collect(s, rest)()).statusCode).toBe(201);
      await x.lateCharge(s, 70_000, s.departure);
      await x.at(`${addDays(s.departure, 1)}T11:00:00+07:00`);
      expect((await x.j15Unit(s)()).json().status).toBe('closed_with_debt');
      const r = await x.writeOff(s, s.bigLineId!, 70_000)();
      expect(outcome(r)).toBe('201 pending eff 70000');
      expect(await requiredRole(r.json().id)).toBe('owner');
    }, 180_000);

    it('BR-525-26: a pending write-off cancelled `debt_cleared` (the guest paid while it waited) counts nothing – a later debt is written off by MGR alone', async () => {
      const { s } = await debt5m();
      const w = await x.writeOff(s, s.bigLineId!, 4_900_000)();
      expect(outcome(w)).toBe('201 pending eff 4900000');
      expect((await x.collect(s, 5_000_000)()).statusCode).toBe(201);
      expect((await x.decide(w.json().id, 'approve')()).statusCode).toBe(200);
      const [st] = await x.q(
        'SELECT status, auto_cancel_reason FROM approval_request WHERE id = $1',
        [w.json().id],
      );
      expect(st).toMatchObject({ status: 'cancelled', auto_cancel_reason: 'debt_cleared' });
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200); // a new debt of 100.000
      expect(outcome(await x.writeOff(s, s.bigLineId!, 100_000)())).toBe('201 approved eff 100000');
    }, 180_000);

    it('BR-525-27 (race, SEC B.5 #4): two MGR write-offs of 450.000 at the same time (basis < 900.000) → exactly one self-applied, the other pending OWN – forced behind the folio lock, both orders = the sequence, deadlocks +0', async () => {
      await x.race(
        'BE-83 write-off ‖ write-off',
        async () => {
          const { s } = await debt5m();
          return {
            s,
            a: x.writeOff(s, s.bigLineId!, 450_000),
            b: x.writeOff(s, s.bigLineId!, 450_000, { who: 'mgr2' }),
          };
        },
        (order, seq) => {
          expect([...seq].sort(), order).toEqual([
            '201 approved eff 450000',
            '201 pending eff 450000',
          ]);
        },
        2,
      );
    }, 300_000);

    it('R3-Q25 (FB-R2-SEC-BE-82 b): a write-off without the requester re-authentication → 422 secret REQUIRED, nothing written', async () => {
      const { s } = await debt5m();
      const r = await x.c.mgr!.send(
        'POST',
        x.url(`/folios/${s.folioId}/lines/${s.bigLineId}/foc`),
        {
          kind: 'foc',
          amountVnd: 100_000,
          reasonCode: 'debt_write_off',
          note: 'Khách không liên lạc được',
        },
      );
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json().errors).toEqual([{ field: 'secret', code: 'REQUIRED' }]);
      expect((await x.state(s)).writeOffs).toEqual([]);
    }, 120_000);

    // ─────────────────────────── (b) FOC: Σ of the key (BR-433-04, 05) ───────────────────────────

    it('BR-433-04: damage 3.000.000 on a stay of 101 (night 667.000) – MGR 600.000 → self-applied; 600.000 more on the same key → Σ 1.200.000 → pending OWN', async () => {
      const b = await inHouse('101', '2027-03-08', '2027-03-10');
      const line = await charge(b, 3_000_000, '2027-03-08');
      expect(outcome(await waive(b, line, 600_000))).toBe('201 approved eff 600000');
      const r = await waive(b, line, 600_000);
      expect(outcome(r)).toBe('201 pending eff 600000');
      expect(await requiredRole(r.json().id)).toBe('owner');
    }, 120_000);

    it('BR-433-05: 6 beers 210.000 (one key) – FD self-waives 100.000; 100.000 more → Σ 200.000 > 100.000 → pending, routed to the lead', async () => {
      const b = await inHouse('102', '2027-03-01', '2027-03-03');
      const line = await charge(b, 210_000, '2027-03-01');
      expect(outcome(await waive(b, line, 100_000, 'fd'))).toBe('201 approved eff 100000');
      const r = await waive(b, line, 100_000, 'fd');
      expect(outcome(r)).toBe('201 pending eff 100000');
      expect(await requiredRole(r.json().id)).toBe('front_desk_lead');
    }, 120_000);

    // ─────────────────────────── (c) ESC-026 A: Σ of the stay (E26-1…5, 9) ───────────────────────────

    it('E26-1 (BR-433-06): 202 with a Friday night (threshold 911.000) – MGR waives 300.000, 250.000, 600.000 on three keys: all applied; Σ 550.000 → nothing; Σ 1.150.000 → 1 notification to OWN, 1 "Cần chú ý" (OWN only, count 3)', async () => {
      const b = await inHouse('202', '2027-03-04', '2027-03-06');
      expect(await basisOf(b)).toBe(911_000);
      const lines = [
        await charge(b, 300_000, '2027-03-04'),
        await charge(b, 250_000, '2027-03-04'),
        await charge(b, 600_000, '2027-03-05'),
      ];
      expect(outcome(await waive(b, lines[0]!, 300_000))).toBe('201 approved eff 300000');
      expect(outcome(await waive(b, lines[1]!, 250_000))).toBe('201 approved eff 250000');
      expect(await told(b)).toBe(0);
      expect(await items(b)).toEqual([]);
      expect(outcome(await waive(b, lines[2]!, 600_000))).toBe('201 approved eff 600000');
      expect(await told(b)).toBe(1);
      const it1 = await items(b);
      expect(it1).toHaveLength(1);
      expect(it1[0]).toMatchObject({ source: 'event', severity: 'warning', params: { count: 3 } });
      expect(await items(b, 'mgr')).toEqual([]);
      expect(await items(b, 'fd')).toEqual([]);
      // the guest pays the charges minus the waivers – nothing was blocked
      expect((await x.folio(b.folioId)).totals.balanceDueVnd).toBe(0);
      const [audit] = await x.q(
        `SELECT after FROM audit_event WHERE action = 'folio.foc_stay_alerted' AND entity_id = $1`,
        [b.id],
      );
      expect(audit.after).toMatchObject({
        stayWaiverVnd: 1_150_000,
        thresholdVnd: 911_000,
        itemCount: 3,
      });

      // E26-9 (BR-433-14): the 600.000 waiver is cancelled by the rules (its line removed) → out of Σ, no message;
      // a new 10.000 waiver → Σ 560.000 ≤ 911.000 → no notification, the item stays as it is
      const etag = (await x.c.mgr!.get(x.url(`/folios/${b.folioId}`))).headers.etag as string;
      const v = await x.c.mgr!.send(
        'POST',
        x.url(`/folios/${b.folioId}/lines/${lines[2]}/adjustments`),
        { voidLine: true, reason: 'Ghi nhầm' },
        { 'if-match': etag },
      );
      expect(v.statusCode, v.body).toBe(201);
      expect(await told(b)).toBe(1);
      const small = await charge(b, 10_000, '2027-03-05');
      expect(outcome(await waive(b, small, 10_000))).toBe('201 approved eff 10000');
      expect(await told(b)).toBe(1);
      expect(await items(b)).toHaveLength(1);
    }, 180_000);

    it('E26-2 (BR-433-07): 101 Mon–Fri (threshold 767.000) – MGR special discount 100% night by night → no message after night 1, then one per night (4), still ONE item; the guest pays 0 for the room', async () => {
      const b = await inHouse('101', '2027-03-01', '2027-03-06');
      const nights = ((await x.folio(b.folioId)).lines as any[])
        .filter((l) => l.category === 'room' && l.lineState === 'posted' && !l.reversalOfId)
        .sort((p, q) => (p.serviceDate < q.serviceDate ? -1 : 1));
      expect(nights.map((n) => n.amountVnd)).toEqual([667_000, 667_000, 667_000, 667_000, 767_000]);
      const after: number[] = [];
      for (const n of nights) {
        expect(outcome(await waive(b, n.id, n.amountVnd, 'mgr', 'special_discount'))).toBe(
          `201 approved eff ${n.amountVnd}`,
        );
        after.push(await told(b));
      }
      expect(after).toEqual([0, 1, 2, 3, 4]);
      expect(await items(b)).toHaveLength(1);
      const [alert] = await x.q(
        'SELECT alert_count, attention_event_id IS NOT NULL AS opened FROM foc_stay_alert WHERE stay_root_reservation_id = $1',
        [b.id],
      );
      expect(alert).toEqual({ alert_count: 4, opened: true });
    }, 180_000);

    it('E26-3 (BR-433-08): 203 weekdays (792.000) – FD self 70.000, lead 210.000 → Σ 280.000 ≤ 300.000 nothing; 50.000 more → Σ 330.000 > 300.000 → told; MGR 200.000 → threshold 792.000, Σ 530.000 → nothing more', async () => {
      const b = await inHouse('203', '2027-03-08', '2027-03-10');
      const l = [
        await charge(b, 70_000, '2027-03-08'),
        await charge(b, 210_000, '2027-03-08'),
        await charge(b, 50_000, '2027-03-09'),
        await charge(b, 200_000, '2027-03-09'),
      ];
      expect(outcome(await waive(b, l[0]!, 70_000, 'fd'))).toBe('201 approved eff 70000');
      const r2 = await waive(b, l[1]!, 210_000, 'fd');
      expect(outcome(r2)).toBe('201 pending eff 210000');
      expect((await x.decide(r2.json().id, 'approve', 'lead')()).statusCode).toBe(200);
      expect(await told(b)).toBe(0);
      // 50.000 fits the desk's own limit on its key → self-applied by FD (still a waiver below OWN): Σ 330.000 > 300.000
      expect(outcome(await waive(b, l[2]!, 50_000, 'fd'))).toBe('201 approved eff 50000');
      expect(await told(b)).toBe(1);
      const r4 = await waive(b, l[3]!, 200_000, 'fd');
      expect((await x.decide(r4.json().id, 'approve', 'mgr')()).statusCode).toBe(200);
      expect(await told(b)).toBe(1);
    }, 180_000);

    it('E26-4 (BR-433-09): as E26-1 but the 600.000 is the OWNER’s own → not in Σ (550.000) → nothing', async () => {
      const b = await inHouse('202', '2027-03-11', '2027-03-13');
      expect(outcome(await waive(b, await charge(b, 300_000, '2027-03-11'), 300_000))).toBe(
        '201 approved eff 300000',
      );
      expect(outcome(await waive(b, await charge(b, 250_000, '2027-03-11'), 250_000))).toBe(
        '201 approved eff 250000',
      );
      expect(
        outcome(await waive(b, await charge(b, 600_000, '2027-03-12'), 600_000, 'owner')),
      ).toBe('201 approved eff 600000');
      expect(await told(b)).toBe(0);
      expect(await items(b)).toEqual([]);
    }, 180_000);

    it('E26-5 (BR-433-13): 202 Thu–Fri (threshold = write-off basis 911.000) – MGR waives minibar 400.000 in house; after check-out with a debt of 600.000, MGR writes it off (self) → Σ 1.000.000 → told', async () => {
      const b = await inHouse('202', '2027-03-18', '2027-03-20');
      expect(outcome(await waive(b, await charge(b, 400_000, '2027-03-18'), 400_000))).toBe(
        '201 approved eff 400000',
      );
      const unpaid = await charge(b, 600_000, '2027-03-19');
      expect(await told(b)).toBe(0);
      await x.at('2027-03-20T11:00:00+07:00');
      const out = await x.act(
        b.id,
        'check-out',
        {
          checkoutTime: '11:00',
          debt: { dueDate: '2027-03-25', reason: 'Khách hẹn chuyển khoản' },
        },
        'mgr',
      );
      expect(out.statusCode, out.body).toBe(200);
      expect(outcome(await x.writeOff(b as any, unpaid, 600_000)())).toBe(
        '201 approved eff 600000',
      );
      expect(await told(b)).toBe(1);
      expect(await items(b)).toHaveLength(1);
    }, 180_000);
  },
);
