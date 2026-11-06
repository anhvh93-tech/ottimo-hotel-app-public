/**
 * V5-16 – the late check-out line around B18 (oracle product/tests/fixtures/br-examples.json v0.5.16, BR-438-04 and
 * BR-438-07 `carryToCheckout`; QA rounds/round-05/qa/v1.0.5-test-cases.md 2.3, TC-V105-B438-04 / -19; DOM option A of
 * FB-R5-QA-DOM-BR438-01; BR-433 (e), BR-434-07, BR-412-15/16), on the real modules + PostgreSQL. Last night typed at
 * 700.000, so the late charge is 210.000 at 15:00 (30 %) and 350.000 at 17:00 (50 %).
 * - BR-438-04 / T-16-4: B18 writes the late line (`source checkout`) and settles the folio in the same transaction, so
 *   the line is on a SETTLED folio: A32 is checked before BR-438. FD / FDL void it → 403 FORBIDDEN_ACTION WITHOUT
 *   `requiredFlow`, no `access.denied` with reason BR-438, folio unchanged; MGR → 201, one `folio_settled_reduction`
 *   (role manager), `after.reducedVnd`, the refund made by itself ("Tự sinh từ A32", requested by the MGR, who cannot
 *   approve it).
 * - BR-438-07 carryToCheckout (the waiver path of the desk: FOC BEFORE Trả phòng): an approved FOC on the B15 line
 *   follows to the B18 line, at most the new line, without a second approval:
 *   (1) B15 15:00 + FOC 210.000 (FDL) → B18 17:00 → line 350.000 `checkout`, FOC 210.000, the guest pays 140.000;
 *   (2) B15 17:00 + FOC 350.000 (MGR) → B18 15:00 → line 210.000 `checkout`, FOC 210.000, the guest pays 0;
 *   (3) B15 15:00 + FOC 210.000 (FDL) → B18 15:00 → the B15 line stays (`manual`), FOC 210.000, the guest pays 0.
 * Fake clock and FAKE data only (no real guest).
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

type Res = { statusCode: number; body: string; json(): any; headers: Record<string, any> };
type Stay = { id: string; code: string; folioId: string };
const USERS = ['own', 'mgr', 'fdl', 'hanh'] as const;
/** The last night of every stay here (BR-412-15: 30 % at 15:00, 50 % at 17:00). */
const LAST_NIGHT_VND = 700_000;

describe.skipIf(!HAS_DB)(
  'V5-16 – the B18 late check-out line: BR-438-04 (A32) and BR-438-07 carryToCheckout',
  () => {
    let db: Database;
    let t: TestTenant;
    let ids: BookingIds;
    let fa: FeatureApp;
    let guest: string;
    const c: Record<string, Client> = {};

    beforeAll(async () => {
      db = appDatabase(6);
      t = await createTenant(db, {
        users: {
          own: ['owner'],
          mgr: ['manager'],
          fdl: ['front_desk_lead'],
          hanh: ['front_desk'],
        },
      });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Khách Thử B18' });
      fa = await startFeatureApp(db, {
        override: (x) =>
          x.overrideProvider(FrontdeskPorts).useFactory({
            factory: (child: FrontdeskChildDataPort) =>
              new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
            inject: [FD_CHILD_DATA_PORT],
          }),
      });
      for (const u of USERS) c[u] = Client.of(fa, t, u);
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
      for (const u of USERS) {
        c[u]!.deviceToken = token;
        await setPassword(db, t, u);
      }
    }, 180_000);
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    const url = (p = '') => `${P(t)}${p}`;
    const q = (sql: string, a: unknown[] = []) =>
      db.withContext(t.ctx(), async (tx) => (await tx.query(sql, a)).rows as any[]);
    async function at(iso: string) {
      const d = new Date(iso);
      fa.clock.set(d);
      await touchSessions(db, t, d);
    }
    const nextDay = (d: string) => {
      const x = new Date(`${d}T00:00:00Z`);
      x.setUTCDate(x.getUTCDate() + 1);
      return x.toISOString().slice(0, 10);
    };
    const folio = async (s: Stay) => (await c.mgr!.get(url(`/folios/${s.folioId}`))).json();
    async function act(s: Stay, verb: string, body: unknown) {
      const v = (await c.hanh!.get(url(`/reservations/${s.id}`))).json().version;
      return c.hanh!.send('POST', url(`/reservations/${s.id}/actions/${verb}`), body, {
        'if-match': `"${v}"`,
      }) as Promise<Res>;
    }
    /** One night `arrival` → +1 in `room`, the night typed at 700.000, paid in full, checked in 15:00. */
    async function inHouse(room: string, arrival: string): Promise<Stay> {
      await at(`${arrival}T10:00:00+07:00`);
      const body = {
        roomId: ids.rooms[room],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        arrivalDate: arrival,
        departureDate: nextDay(arrival),
        nightlyRates: [{ date: arrival, amountVnd: LAST_NIGHT_VND, edited: true }],
      };
      let res = (await c.hanh!.send('POST', url('/reservations'), body)) as Res;
      if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
        res = (await c.hanh!.send('POST', url('/reservations'), {
          ...body,
          initialPayment: {
            type: 'deposit',
            method: 'cash',
            amountVnd: res.json().depositRequiredVnd,
          },
        })) as Res;
      }
      expect(res.statusCode, res.body).toBe(201);
      const s = res.json() as Stay;
      await at(`${arrival}T15:00:00+07:00`);
      await q(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
        [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
      );
      const due = (await folio(s)).totals.balanceDueVnd as number;
      if (due > 0) {
        const p = await c.hanh!.send('POST', url(`/folios/${s.folioId}/payments`), {
          type: 'charge',
          method: 'cash',
          amountVnd: due,
        });
        expect(p.statusCode, p.body).toBe(201);
      }
      const ci = await act(s, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '15:00',
      });
      expect(ci.statusCode, ci.body).toBe(200);
      return s;
    }
    /** B15 by Hạnh with a FOC request on the whole new charge → the charge. */
    async function lateWithFoc(s: Stay, time: string) {
      const dry = await act(s, 'late-checkout', { checkoutTime: time, dryRun: true });
      expect(dry.statusCode, dry.body).toBe(200);
      const surcharge = dry.json().surchargeVnd as number;
      const r = await act(s, 'late-checkout', {
        checkoutTime: time,
        applySurcharge: true,
        expectedSurchargeVnd: surcharge,
        requestFocForSurcharge: { amountVnd: surcharge, reasonCode: 'regular_vip' },
      });
      expect(r.statusCode, r.body).toBe(200);
      return surcharge;
    }
    const focRequests = (s: Stay) =>
      q(
        `SELECT id, status FROM approval_request WHERE target_id = $1 AND type = 'foc' ORDER BY requested_at, id`,
        [s.id],
      );
    const decide = (who: string, id: string) =>
      c[who]!.send('POST', url(`/approval-requests/${id}/actions/approve`), {
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
    /** B18 by Hạnh at `time` (the clock is there): pays what is due, the late decision when the charge goes up. */
    async function checkOut(s: Stay, time: string) {
      const sum = await c.hanh!.get(
        url(`/reservations/${s.id}/checkout-summary?checkoutTime=${time}`),
      );
      expect(sum.statusCode, sum.body).toBe(200);
      const due = sum.json().amountDueAtCheckoutVnd as number;
      const late = sum.json().lateCheckoutSurcharge?.amountVnd as number | undefined;
      const out = await act(s, 'check-out', {
        checkoutTime: time,
        ...(late !== undefined ? { applyLateSurcharge: true, expectedSurchargeVnd: late } : {}),
        ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(out.statusCode, out.body).toBe(200);
      return { due };
    }
    /** Every late check-out line of the folio (live or reversed), oldest first, with its live FOC. */
    async function lateLines(s: Stay) {
      const lines = (await folio(s)).lines as any[];
      const reversed = new Set(lines.map((l) => l.reversalOfId).filter(Boolean));
      const live = (l: any) => !l.reversalOfId && !reversed.has(l.id);
      const late = lines.filter((l) => l.category === 'late_checkout' && !l.reversalOfId);
      const sources = new Map(
        (
          await q(
            `SELECT id, source FROM folio_line WHERE folio_id = $1 AND category = 'late_checkout'`,
            [s.folioId],
          )
        ).map((r) => [r.id as string, r.source as string]),
      );
      return late.map((l) => ({
        id: l.id as string,
        amountVnd: l.amountVnd as number,
        source: sources.get(l.id),
        reversed: !live(l),
        focVnd: lines
          .filter((f) => f.category === 'foc' && f.relatedLineId === l.id && live(f))
          .reduce((a, f) => a - (f.amountVnd as number), 0),
      }));
    }
    const effectiveOf = async (id: string) => {
      const res = await c.own!.get(url('/approval-requests?limit=100'));
      expect(res.statusCode, res.body).toBe(200);
      return (res.json().data as any[]).find((a) => a.id === id)?.effectiveAmountVnd as number;
    };
    const folioStatus = async (s: Stay) =>
      (await q('SELECT status FROM folio WHERE id = $1', [s.folioId]))[0].status as string;

    // ───────────── BR-438-07 carryToCheckout (TC-V105-B438-19) ─────────────
    for (const run of [
      {
        n: 1,
        room: '101',
        arrival: '2026-11-16',
        b15: '15:00',
        approver: 'fdl',
        b18: '17:00',
        expected: {
          b15: 210_000,
          live: 350_000,
          source: 'checkout',
          b15Reversed: true,
          foc: 210_000,
          pays: 140_000,
        },
      },
      {
        n: 2,
        room: '102',
        arrival: '2026-11-18',
        b15: '17:00',
        approver: 'mgr',
        b18: '15:00',
        expected: {
          b15: 350_000,
          live: 210_000,
          source: 'checkout',
          b15Reversed: true,
          foc: 210_000,
          pays: 0,
        },
      },
      {
        n: 3,
        room: '103',
        arrival: '2026-11-25',
        b15: '15:00',
        approver: 'fdl',
        b18: '15:00',
        expected: {
          b15: 210_000,
          live: 210_000,
          source: 'manual',
          b15Reversed: false,
          foc: 210_000,
          pays: 0,
        },
      },
    ] as const) {
      it(`BR-438-07 carryToCheckout (${run.n}): B15 ${run.b15} + FOC approved by ${run.approver.toUpperCase()} → B18 ${run.b18}: late line ${run.expected.live}, FOC ${run.expected.foc}, the guest pays ${run.expected.pays}`, async () => {
        const s = await inHouse(run.room, run.arrival);
        const departure = nextDay(run.arrival);
        await at(`${departure}T09:00:00+07:00`);
        expect(await lateWithFoc(s, run.b15)).toBe(run.expected.b15);
        const [request] = await focRequests(s);
        expect(request).toMatchObject({ status: 'pending' });
        const ok = await decide(run.approver, request.id);
        expect(ok.statusCode, ok.body).toBe(200);
        expect(await lateLines(s)).toEqual([
          expect.objectContaining({
            amountVnd: run.expected.b15,
            focVnd: run.expected.b15,
            reversed: false,
          }),
        ]);

        await at(`${departure}T${run.b18}:00+07:00`);
        await checkOut(s, run.b18);
        const lines = await lateLines(s);
        const b15 = lines[0]!;
        expect(b15).toMatchObject({
          amountVnd: run.expected.b15,
          source: 'manual',
          reversed: run.expected.b15Reversed,
        });
        const live = lines.filter((l) => !l.reversed);
        expect(live).toHaveLength(1);
        expect(live[0]).toMatchObject({
          amountVnd: run.expected.live,
          source: run.expected.source,
          focVnd: run.expected.foc,
        });
        // What the guest pays for the late check-out = the live line less the FOC that followed it.
        expect(live[0]!.amountVnd - live[0]!.focVnd).toBe(run.expected.pays);
        // One request, no second approval; its effect = min(approved, new line).
        expect(await focRequests(s)).toEqual([
          expect.objectContaining({ id: request.id, status: 'approved' }),
        ]);
        expect(await effectiveOf(request.id)).toBe(run.expected.foc);
        expect(await folioStatus(s)).toBe('settled');
        expect((await folio(s)).totals.balanceDueVnd).toBe(0);
      });
    }

    // ───────────── BR-438-04 / T-16-4 (TC-V105-B438-04) ─────────────
    it('BR-438-04: the B18 late line is on a settled folio – FD, FDL 403 without requiredFlow (A32 before BR-438); MGR 201 as an A32 waiver', async () => {
      const s = await inHouse('201', '2026-11-30');
      await at('2026-12-01T15:00:00+07:00');
      await checkOut(s, '15:00');
      expect(await folioStatus(s)).toBe('settled');
      const [line] = await q(
        `SELECT id, source, posted_by, amount_vnd::int AS amount FROM folio_line
        WHERE folio_id = $1 AND category = 'late_checkout' AND reversal_of_id IS NULL`,
        [s.folioId],
      );
      expect(line).toMatchObject({
        source: 'checkout',
        posted_by: t.users.hanh!.id,
        amount: 210_000,
      });

      const br438Denials = async () =>
        (
          await q(
            `SELECT count(*)::int AS n FROM audit_event WHERE action = 'access.denied' AND reason = 'BR-438'`,
          )
        )[0].n as number;
      const adjust = async (who: string) => {
        const etag = (await c.mgr!.get(url(`/folios/${s.folioId}`))).headers.etag as string;
        return c[who]!.send(
          'POST',
          url(`/folios/${s.folioId}/lines/${line.id}/adjustments`),
          { reason: 'Khách phàn nàn', voidLine: true },
          { 'if-match': etag },
        ) as Promise<Res>;
      };
      for (const who of ['hanh', 'fdl']) {
        const before = await folio(s);
        const n = await br438Denials();
        const r = await adjust(who);
        expect(r.statusCode, r.body).toBe(403);
        expect(r.json().code).toBe('FORBIDDEN_ACTION');
        // A32 refuses first: no FOC hint on a settled folio, and it is not a BR-438 refusal.
        expect(r.json()).not.toHaveProperty('requiredFlow');
        expect(await br438Denials()).toBe(n);
        const after = await folio(s);
        expect(after.version).toBe(before.version);
        expect(after.lines).toEqual(before.lines);
      }

      const mgr = await adjust('mgr');
      expect(mgr.statusCode, mgr.body).toBe(201);
      expect(
        await q(
          `SELECT reduced_vnd::int AS vnd, actor_role AS role FROM folio_settled_reduction WHERE folio_id = $1`,
          [s.folioId],
        ),
      ).toEqual([{ vnd: 210_000, role: 'manager' }]);
      const [audit] = await q(
        `SELECT after FROM audit_event WHERE action = 'folio_line.adjusted' AND entity_id = $1
        ORDER BY occurred_at DESC, id DESC LIMIT 1`,
        [line.id],
      );
      expect(audit.after).toMatchObject({ reducedVnd: 210_000 });
      // BR-433 (e): the guest paid in full – a refund made by itself, requested by the MGR, who cannot approve it.
      const [refund] = await q(
        `SELECT id, amount_vnd::int AS amount, requested_by, reason_note, version FROM approval_request
        WHERE type = 'refund' AND target_id = $1`,
        [s.id],
      );
      expect(refund).toMatchObject({ amount: 210_000, requested_by: t.users.mgr!.id });
      expect(refund.reason_note).toMatch(/^Tự sinh từ A32/);
      const self = await c.mgr!.send(
        'POST',
        url(`/approval-requests/${refund.id}/actions/approve`),
        {
          authMethod: 'password',
          secret: TEST_PASSWORD,
          expectedVersion: Number(refund.version),
        },
      );
      expect(self.statusCode, self.body).toBe(403);
    });
  },
);
