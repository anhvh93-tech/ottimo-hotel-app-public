/**
 * V5-16 – BR-438 guard of adjustFolioLine on Nest/Fastify + PostgreSQL (contract 0.3.13 1.20, H-08, H-09; DOM
 * rules-v1.0.5 3.1–3.5, 7.2; US-177 AC1–AC8, AC10). Oracles BR-438-01…03, 05…07 (product/tests/fixtures/br-examples.json,
 * QA 07/11; numbers of DOM 3.3). The lines of BR-438-01/02/05 are minibar count lines (`recordMinibarCheck`, source
 * `minibar_check`, posted by the person who counted) – "typed by hand" goes by who typed the number, not by `source`.
 * - T16-6 / BR-438-01: Hạnh (FD) counts the minibar (3 × 35.000) and reduces her own count line of today → 201; audit
 *   with the root facts; no FOC.
 * - T16-7 / BR-438-02, T-16-7: Lan (FD) / the FDL reduce Hạnh's line (quantity or price) → 403 requiredFlow
 *   foc_request, nothing written, ONE access.denied each.
 * - T16-9 / BR-438-05, T-16-8: Lan's count line (another stay): Hạnh's increase → 201; Hạnh voids that replacement →
 *   403 (root = Lan); Lan reduces the twice-adjusted line → 201.
 * - T16-8 / BR-438-03 (+ ARC FB-R5-ARC-BE-B1F-01, rollover 06:00): posted 23:50 → void at 00:20 and at 05:59 the
 *   next calendar day 201 (same business day), at 06:00 → 403.
 * - T16-10 / BR-438-07 / H-08: the B15 late check-out line (source manual, posted by Hạnh herself) is a system line –
 *   FD, FDL 403; T16-11: MGR 201. (BR-438-04 – the B18 `checkout` line on a settled folio, A32 – waits for DOM's
 *   choice of set-up, FB-R5-QA-DOM-BR438-01.)
 * - T16-12 / BR-438-06: three direct reductions by Hạnh with the test threshold 2 → "Cần chú ý" foc_threshold
 *   `check = line_reduction_count`, count 3, max 2, no name – OWN only. ARC FB-R5-ARC-BE-B2-01: the count per person
 *   (audit/public/line-reductions) = the rows of `listAuditEvents?reductionsOnly=true&actorUserId=…` whose role at
 *   the time is FD/FDL.
 * - AC8 / AC10: FOC reason `entered_in_error` – the Desk folio keeps the reason, the guest bill prints only "Miễn phí".
 * Fake clock and FAKE data only (no real guest).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { countLineReductionsByActor } from '../../src/modules/audit/public/line-reductions';
import { FRONT_DESK_ROLES } from '../../src/modules/folio/public/line-reduction';
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
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

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
const USERS = ['own', 'mgr', 'fdl', 'hanh', 'lan'] as const;
const ARRIVAL = '2026-11-11';
const DEPARTURE = '2026-11-14';
/** The one fridge item of the test (the minibar example of DOM 3.3: 35.000 a can, 3 in the fridge). */
const BEER = { code: 'bia-thu', name: 'Bia thử', unitPriceVnd: 35_000, standardQty: 3 };

describe.skipIf(!HAS_DB)('V5-16 – BR-438 guard (contract 0.3.13 1.20)', () => {
  let db: Database;
  let t: TestTenant;
  let ids: BookingIds;
  let fa: FeatureApp;
  let guest: string;
  let beerItem = '';
  const c: Record<string, Client> = {};
  /** 202 – Hạnh's stay; 203 – the stay Lan counts (T16-9). */
  let b: Stay;
  let b2: Stay;

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, {
      users: {
        own: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        hanh: ['front_desk'],
        lan: ['front_desk'],
      },
    });
    ids = await seedBooking(db, t);
    // T16-12: a test threshold (the shared BR-435 count key), so three reductions alert.
    await setParam(db, t, 'foc_alert_count_per_approver', 2, '2026-10-02');
    guest = await seedGuestRow(db, t, { name: 'Khách Thử BR438' });
    beerItem = uuidv7();
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO item (id, organization_id, property_id, code, kind, name, unit, cost_price_vnd,
           sale_price_vnd, minibar_standard_qty, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'minibar', $5, 'lon', 12000, $6, $7, $8, $8)`,
        [
          beerItem,
          t.organizationId,
          t.propertyIds[0],
          BEER.code,
          BEER.name,
          BEER.unitPriceVnd,
          BEER.standardQty,
          new Date('2026-10-01T00:00:00Z'),
        ],
      ),
    );
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

    // 202 and 203, 11/11 → 14/11, checked in 11/11 15:00 (paid in full).
    await at('2026-11-01T10:00:00+07:00');
    b = await book('202');
    b2 = await book('203');
    await at(`${ARRIVAL}T15:00:00+07:00`);
    for (const [s, room] of [
      [b, '202'],
      [b2, '203'],
    ] as const) {
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
      const ci = await act(
        'check-in',
        { cardsIssued: 1, houseRulesSent: true, checkinTime: '15:00' },
        s,
      );
      expect(ci.statusCode, ci.body).toBe(200);
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
  async function book(room: string): Promise<Stay> {
    const body = {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: ARRIVAL,
      departureDate: DEPARTURE,
    };
    let res = await c.hanh!.send('POST', url('/reservations'), body);
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c.hanh!.send('POST', url('/reservations'), {
        ...body,
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: res.json().depositRequiredVnd,
        },
      });
    }
    expect(res.statusCode, res.body).toBe(201);
    return res.json();
  }
  const folio = async (s: Stay = b) => (await c.mgr!.get(url(`/folios/${s.folioId}`))).json();
  async function act(verb: string, body: unknown, s: Stay = b) {
    const v = (await c.hanh!.get(url(`/reservations/${s.id}`))).json().version;
    return c.hanh!.send('POST', url(`/reservations/${s.id}/actions/${verb}`), body, {
      'if-match': `"${v}"`,
    }) as Promise<Res>;
  }
  /** A30 typed-in line → its id. */
  async function add(who: string, category: string, text: string, qty: number, unit: number) {
    const r = (await c[who]!.send('POST', url(`/folios/${b.folioId}/lines`), {
      category,
      description: text,
      quantity: qty,
      unitPriceVnd: unit,
    })) as Res;
    expect(r.statusCode, r.body).toBe(201);
    const lines = r.json().lines as any[];
    return lines.filter((l) => l.description === text && !l.reversalOfId).at(-1).id as string;
  }
  /** recordMinibarCheck by `who`: `used` cans gone from the fridge → the id of the live minibar line it posted. */
  async function count(who: string, s: Stay, used: number) {
    const std = await c[who]!.get(url(`/reservations/${s.id}/minibar-standard`));
    expect(std.statusCode, std.body).toBe(200);
    const r = (await c[who]!.send('POST', url(`/reservations/${s.id}/minibar-checks`), {
      mode: 'checkout',
      roomId: std.json().roomId,
      periodId: std.json().periodId ?? null,
      lines: [{ itemId: beerItem, remainingQty: BEER.standardQty - used }],
    })) as Res;
    expect(r.statusCode, r.body).toBe(201);
    const [line] = await q(
      `SELECT l.id, l.source, l.category, l.posted_by, l.quantity, l.amount_vnd FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'minibar' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.posted_at DESC, l.id DESC LIMIT 1`,
      [s.folioId],
    );
    // The count line: source minibar_check, posted by the person who counted (BR-438 (1)(a), typedByHand).
    expect(line).toMatchObject({
      source: 'minibar_check',
      category: 'minibar',
      posted_by: t.users[who]!.id,
    });
    expect(Number(line.amount_vnd)).toBe(used * BEER.unitPriceVnd);
    return line.id as string;
  }
  async function adjust(who: string, lineId: string, body: Record<string, unknown>, s: Stay = b) {
    const etag = (await c.mgr!.get(url(`/folios/${s.folioId}`))).headers.etag as string;
    return c[who]!.send(
      'POST',
      url(`/folios/${s.folioId}/lines/${lineId}/adjustments`),
      { reason: 'Khách báo lại số lượng', ...body },
      { 'if-match': etag },
    ) as Promise<Res>;
  }
  /** Live line replacing `lineId` (adjustFolioLine posts it with relatedLineId = the old line). */
  async function replacement(lineId: string, s: Stay = b) {
    const lines = (await folio(s)).lines as any[];
    return lines.find((l) => l.relatedLineId === lineId && !l.reversalOfId) as any;
  }
  const denials = async (who: string) =>
    (
      await q(
        `SELECT count(*)::int AS n FROM audit_event
          WHERE action = 'access.denied' AND actor_user_id = $1 AND reason = 'BR-438'
            AND entity_id = 'adjustFolioLine'`,
        [t.users[who]!.id],
      )
    )[0].n as number;
  const adjustedAudit = async (lineId: string) =>
    (
      await q(
        `SELECT before, after FROM audit_event
          WHERE action = 'folio_line.adjusted' AND category = 'money' AND entity_id = $1
          ORDER BY occurred_at DESC, id DESC LIMIT 1`,
        [lineId],
      )
    )[0];
  /** Expect a BR-438 refusal: 403 + requiredFlow, nothing written, exactly one more access.denied (H-09). */
  async function refused(who: string, lineId: string, body: Record<string, unknown>, s: Stay = b) {
    const before = await folio(s);
    const n = await denials(who);
    const r = await adjust(who, lineId, body, s);
    expect(r.statusCode, r.body).toBe(403);
    expect(r.json()).toMatchObject({ code: 'FORBIDDEN_ACTION', requiredFlow: 'foc_request' });
    expect(r.json()).not.toHaveProperty('auditReason');
    const after = await folio(s);
    expect(after.version).toBe(before.version);
    expect(after.lines).toEqual(before.lines);
    expect(await denials(who)).toBe(n + 1);
  }

  let hanhBeer = '';

  it('T16-6 / BR-438-01: Hạnh reduces her own minibar count line of today 105.000 → 70.000; audit root facts; no FOC', async () => {
    await at('2026-11-12T10:15:00+07:00');
    hanhBeer = await count('hanh', b, 3);
    await at('2026-11-12T10:20:00+07:00');
    const r = await adjust('hanh', hanhBeer, { newQuantity: 2 });
    expect(r.statusCode, r.body).toBe(201);
    const next = await replacement(hanhBeer);
    expect(next).toMatchObject({ amountVnd: 70_000, quantity: 2 });
    expect(await adjustedAudit(hanhBeer)).toEqual({
      before: {
        category: 'minibar',
        amountVnd: 105_000,
        actorRole: 'front_desk',
        rootLineId: hanhBeer,
        rootLineManual: true,
        postedByActor: true,
        sameBusinessDay: true,
      },
      after: { category: 'minibar', amountVnd: 70_000 },
    });
    // A correction, not a waiver: no FOC / discount line on the folio (FOC month unchanged).
    expect(
      ((await folio()).lines as any[]).filter((l) => ['foc', 'discount'].includes(l.category)),
    ).toEqual([]);
  });

  it('T16-7 / BR-438-02, T-16-7: Lan and the FDL reduce Hạnh’s count line (quantity, price) → 403 foc_request, nothing written', async () => {
    await at('2026-11-12T15:00:00+07:00');
    const live = (await replacement(hanhBeer)).id as string;
    await refused('lan', live, { newQuantity: 1 });
    await refused('lan', live, { newUnitPriceVnd: 20_000 });
    await refused('lan', live, { voidLine: true });
    await refused('fdl', live, { newQuantity: 0 });
  });

  let lanBeer = '';

  it('T16-9 / BR-438-05, T-16-8: increase of Lan’s count line → 201; Hạnh voids the replacement → 403; Lan reduces → 201', async () => {
    await at('2026-11-12T15:05:00+07:00');
    lanBeer = await count('lan', b2, 1);
    const up = await adjust('hanh', lanBeer, { newQuantity: 2 }, b2);
    expect(up.statusCode, up.body).toBe(201);
    const raised = await replacement(lanBeer, b2);
    expect(raised.amountVnd).toBe(70_000);
    // The increase is audited with the root facts of Lan's line (not Hạnh's).
    expect((await adjustedAudit(lanBeer)).before).toMatchObject({
      rootLineId: lanBeer,
      postedByActor: false,
      rootLineManual: true,
    });
    await refused('hanh', raised.id, { voidLine: true }, b2);
    // Lan: the root is hers, today – the line adjusted once is still hers to reduce (T16-9).
    const down = await adjust('lan', raised.id, { newQuantity: 1 }, b2);
    expect(down.statusCode, down.body).toBe(201);
    expect((await adjustedAudit(raised.id)).before).toMatchObject({
      rootLineId: lanBeer,
      rootLineManual: true,
      postedByActor: true,
      sameBusinessDay: true,
    });
  });

  it('T16-8 / BR-438-03, B1F-01: posted 23:50 → void at 00:20 and 05:59 next day 201 (same business day), at 06:00 → 403', async () => {
    await at('2026-11-12T23:50:00+07:00');
    const x = await add('hanh', 'service_fee', 'Gọi taxi đêm', 1, 120_000);
    const y = await add('hanh', 'service_fee', 'Giữ hành lý đêm', 1, 50_000);
    // Lan's own night line – her 05:59 void keeps Hạnh's count at 3 for T16-12 (Lan stays at the threshold, 2).
    const w = await add('lan', 'fnb', 'Mì ly đêm', 1, 25_000);
    await at('2026-11-13T00:20:00+07:00');
    const ok = await adjust('hanh', x, { voidLine: true });
    expect(ok.statusCode, ok.body).toBe(201);
    // Contract 1.5: a removal is ONE folio_line.adjusted with after.amountVnd = 0.
    expect(await adjustedAudit(x)).toMatchObject({
      before: { amountVnd: 120_000, sameBusinessDay: true },
      after: { amountVnd: 0 },
    });
    // ARC FB-R5-ARC-BE-B1F-01: the last minute before the rollover (06:00) is still the business day of 23:50.
    await at('2026-11-13T05:59:00+07:00');
    const last = await adjust('lan', w, { voidLine: true });
    expect(last.statusCode, last.body).toBe(201);
    expect((await adjustedAudit(w)).before).toMatchObject({
      postedByActor: true,
      sameBusinessDay: true,
    });
    await at('2026-11-13T06:00:00+07:00');
    await refused('hanh', y, { voidLine: true });
  });

  it('T16-10 / BR-438-07 / H-08 + T16-11: the B15 late check-out line Hạnh caused – FD, FDL 403; MGR 201', async () => {
    await at(`${DEPARTURE}T09:00:00+07:00`);
    const dry = await act('late-checkout', { checkoutTime: '13:00', dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const surcharge = dry.json().surchargeVnd as number;
    expect(surcharge).toBeGreaterThan(0);
    const late = await act('late-checkout', {
      checkoutTime: '13:00',
      applySurcharge: true,
      expectedSurchargeVnd: surcharge,
    });
    expect(late.statusCode, late.body).toBe(200);
    const [line] = await q(
      `SELECT l.id, l.source, l.posted_by FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'late_checkout' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
      [b.folioId],
    );
    // The case DOM 7.2 (3) is about: a Desk flow line stored with source manual, posted by the same front desk.
    expect(line).toMatchObject({ source: 'manual', posted_by: t.users.hanh!.id });
    await refused('hanh', line.id, { voidLine: true });
    await refused('fdl', line.id, { voidLine: true });
    const mgr = await adjust('mgr', line.id, { voidLine: true });
    expect(mgr.statusCode, mgr.body).toBe(201);
    expect((await adjustedAudit(line.id)).before).toMatchObject({
      actorRole: 'manager',
      rootLineManual: false,
      postedByActor: false,
    });
  });

  it('T16-12 / BR-438-06: 3 direct reductions by Hạnh, test threshold 2 → foc_threshold line_reduction_count, no name, OWN only', async () => {
    // Third direct reduction of Hạnh this month (10:20 12/11 and 00:20 13/11 above).
    const z = await add('hanh', 'fnb', 'Cà phê', 2, 30_000);
    const r = await adjust('hanh', z, { newUnitPriceVnd: 25_000 });
    expect(r.statusCode, r.body).toBe(201);
    const own = await c.own!.get(url('/attention'));
    expect(own.statusCode, own.body).toBe(200);
    const cut = (own.json().data as any[]).filter(
      (i) => i.kind === 'foc_threshold' && i.params?.check === 'line_reduction_count',
    );
    expect(cut).toEqual([
      expect.objectContaining({
        severity: 'warning',
        count: 3,
        params: { check: 'line_reduction_count', count: 3, max: 2 },
        link: `/audit?reductionsOnly=true&month=2026-11&actorUserId=${t.users.hanh!.id}`,
      }),
    ]);
    // Lan made two reductions (= the threshold), the manager's void is not a front-desk reduction, increases do
    // not count.
    expect(JSON.stringify(cut)).not.toContain('Khách Thử');
    const mgr = (await c.mgr!.get(url('/attention'))).json().data as any[];
    expect(mgr.filter((i) => i.kind === 'foc_threshold')).toEqual([]);
  });

  it('B2-01: the count per person (audit/public/line-reductions) = the reductionsOnly rows of that person with an FD/FDL role at the time', async () => {
    const counted = await db.withContext(t.ctx(), (tx) =>
      countLineReductionsByActor(tx, {
        propertyId: t.propertyIds[0]!,
        from: new Date('2026-11-01T06:00:00+07:00'),
        to: new Date('2026-11-30T23:59:59+07:00'),
        actorRoles: FRONT_DESK_ROLES,
        above: 0,
      }),
    );
    const byUser = new Map(counted.map((x) => [x.actorUserId, x.n]));
    const seen: Record<string, number> = {};
    for (const u of USERS) {
      const res = await c.own!.get(
        url(
          `/audit-events?reductionsOnly=true&actorUserId=${t.users[u]!.id}&from=2026-11-01&to=2026-11-30&limit=100`,
        ),
      );
      expect(res.statusCode, res.body).toBe(200);
      const rows = res.json().data as any[];
      expect(res.json().page.nextCursor ?? null).toBeNull();
      const frontDesk = rows.filter((e) =>
        (FRONT_DESK_ROLES as readonly string[]).includes(e.before?.actorRole),
      );
      seen[u] = frontDesk.length;
      expect(frontDesk.length, u).toBe(byUser.get(t.users[u]!.id) ?? 0);
      if (u === 'mgr') {
        // The manager's void of the B15 line is in the filter but not in the count (role at the time).
        expect(rows.map((e) => e.before?.actorRole)).toContain('manager');
      }
    }
    // Hạnh: the minibar count line, the 00:20 void, the price cut; Lan: her 05:59 void and the reduction of her
    // count line; the FDL was refused every time.
    expect(seen).toEqual({ own: 0, mgr: 0, fdl: 0, hanh: 3, lan: 2 });
  });

  it('AC8 / AC10: FOC reason entered_in_error – the Desk folio keeps it, the guest bill prints only "Miễn phí"', async () => {
    const tea = await add('lan', 'fnb', 'Trà đá', 1, 15_000);
    const foc = await c.mgr!.send('POST', url(`/folios/${b.folioId}/lines/${tea}/foc`), {
      kind: 'foc',
      amountVnd: 15_000,
      reasonCode: 'entered_in_error',
      note: 'Ghi nhầm căn',
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(foc.statusCode, foc.body).toBe(201);
    expect(foc.json().status).toBe('approved');
    const desk = ((await folio()).lines as any[]).find(
      (l) => l.category === 'foc' && l.relatedLineId === tea && !l.reversalOfId,
    );
    expect(desk).toMatchObject({
      labelKey: 'bill.line.foc',
      labelParams: { reason: 'entered_in_error' },
    });
    const bill = await c.hanh!.get(url(`/folios/${b.folioId}/bill`));
    expect(bill.statusCode, bill.body).toBe(200);
    const printed = (bill.json().lines as any[]).find((l) => l.id === desk.id);
    expect(printed.labelKey).toBe('bill.line.foc');
    expect(printed).not.toHaveProperty('labelParams');
    expect(printed.amountVnd).toBe(-15_000);
  });
});
