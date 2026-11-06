/**
 * V5-16 – BR-438 guard of adjustFolioLine on Nest/Fastify + PostgreSQL (contract 0.3.13 1.20, H-08, H-09; DOM
 * rules-v1.0.5 3.1–3.5, 7.2; US-177 AC1–AC8, AC10). Oracles BR-438-01…06 (numbers of DOM 3.3; the minibar line of
 * the oracle is typed here as an A30 F&B line – see the root rule in folio/public/line-reduction.ts).
 * - T16-6 / BR-438-01: Hạnh (FD) reduces her own hand-typed line of today → 201; audit with the root facts; no FOC.
 * - T16-7 / BR-438-02, T-16-7: Lan (FD) / the FDL reduce Hạnh's line (quantity or price) → 403 requiredFlow
 *   foc_request, nothing written, ONE access.denied each.
 * - T16-9 / BR-438-05, T-16-8: increase of someone else's line → 201; voiding that replacement → 403 (root = Lan);
 *   Lan reduces the twice-adjusted line → 201.
 * - T16-8 / BR-438-03: posted 23:50 → void 00:20 next day 201, 06:10 → 403.
 * - T16-10 / BR-438-04 / H-08: the B15 late check-out line (source manual, posted by Hạnh herself) – FD, FDL 403;
 *   T16-11: MGR 201.
 * - T16-12 / BR-438-06: three direct reductions by Hạnh with the test threshold 2 → "Cần chú ý" foc_threshold
 *   `check = line_reduction_count`, count 3, max 2, no name – OWN only.
 * - AC8 / AC10: FOC reason `entered_in_error` – the Desk folio keeps the reason, the guest bill prints only "Miễn phí".
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
const USERS = ['own', 'mgr', 'fdl', 'hanh', 'lan'] as const;
const ARRIVAL = '2026-11-11';
const DEPARTURE = '2026-11-14';

describe.skipIf(!HAS_DB)('V5-16 – BR-438 guard (contract 0.3.13 1.20)', () => {
  let db: Database;
  let t: TestTenant;
  let ids: BookingIds;
  let fa: FeatureApp;
  let guest: string;
  const c: Record<string, Client> = {};
  let b: { id: string; code: string; folioId: string };

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

    // 202, 11/11 → 14/11, checked in 11/11 15:00 (paid in full).
    await at('2026-11-01T10:00:00+07:00');
    const body = {
      roomId: ids.rooms['202'],
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
    b = res.json();
    await at(`${ARRIVAL}T15:00:00+07:00`);
    await q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms['202'], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
    const due = (await folio()).totals.balanceDueVnd as number;
    if (due > 0) {
      const p = await c.hanh!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    const ci = await act('check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
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
  const folio = async () => (await c.mgr!.get(url(`/folios/${b.folioId}`))).json();
  async function act(verb: string, body: unknown) {
    const v = (await c.hanh!.get(url(`/reservations/${b.id}`))).json().version;
    return c.hanh!.send('POST', url(`/reservations/${b.id}/actions/${verb}`), body, {
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
  async function adjust(who: string, lineId: string, body: Record<string, unknown>) {
    const etag = (await c.mgr!.get(url(`/folios/${b.folioId}`))).headers.etag as string;
    return c[who]!.send(
      'POST',
      url(`/folios/${b.folioId}/lines/${lineId}/adjustments`),
      { reason: 'Khách báo lại số lượng', ...body },
      { 'if-match': etag },
    ) as Promise<Res>;
  }
  /** Live line replacing `lineId` (adjustFolioLine posts it with relatedLineId = the old line). */
  async function replacement(lineId: string) {
    const lines = (await folio()).lines as any[];
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
  async function refused(who: string, lineId: string, body: Record<string, unknown>) {
    const before = await folio();
    const n = await denials(who);
    const r = await adjust(who, lineId, body);
    expect(r.statusCode, r.body).toBe(403);
    expect(r.json()).toMatchObject({ code: 'FORBIDDEN_ACTION', requiredFlow: 'foc_request' });
    expect(r.json()).not.toHaveProperty('auditReason');
    const after = await folio();
    expect(after.version).toBe(before.version);
    expect(after.lines).toEqual(before.lines);
    expect(await denials(who)).toBe(n + 1);
  }

  let hanhCola = '';

  it('T16-6 / BR-438-01: Hạnh reduces her own hand-typed line of today 105.000 → 70.000; audit root facts; no FOC', async () => {
    await at('2026-11-12T10:15:00+07:00');
    hanhCola = await add('hanh', 'fnb', 'Nước ngọt lon', 3, 35_000);
    await at('2026-11-12T10:20:00+07:00');
    const r = await adjust('hanh', hanhCola, { newQuantity: 2 });
    expect(r.statusCode, r.body).toBe(201);
    const next = await replacement(hanhCola);
    expect(next).toMatchObject({ amountVnd: 70_000, quantity: 2 });
    expect(await adjustedAudit(hanhCola)).toEqual({
      before: {
        category: 'fnb',
        amountVnd: 105_000,
        actorRole: 'front_desk',
        rootLineId: hanhCola,
        rootLineManual: true,
        postedByActor: true,
        sameBusinessDay: true,
      },
      after: { category: 'fnb', amountVnd: 70_000 },
    });
    // A correction, not a waiver: no FOC / discount line on the folio (FOC month unchanged).
    expect(
      ((await folio()).lines as any[]).filter((l) => ['foc', 'discount'].includes(l.category)),
    ).toEqual([]);
  });

  it('T16-7 / BR-438-02, T-16-7: Lan and the FDL reduce Hạnh’s line (quantity, price) → 403 foc_request, nothing written', async () => {
    await at('2026-11-12T15:00:00+07:00');
    const live = (await replacement(hanhCola)).id as string;
    await refused('lan', live, { newQuantity: 1 });
    await refused('lan', live, { newUnitPriceVnd: 20_000 });
    await refused('lan', live, { voidLine: true });
    await refused('fdl', live, { newQuantity: 0 });
  });

  let lanLine = '';

  it('T16-9 / BR-438-05, T-16-8: increase of Lan’s line → 201; Hạnh voids the replacement → 403; Lan reduces → 201', async () => {
    await at('2026-11-12T15:05:00+07:00');
    lanLine = await add('lan', 'fnb', 'Bánh ngọt', 1, 35_000);
    const up = await adjust('hanh', lanLine, { newQuantity: 2 });
    expect(up.statusCode, up.body).toBe(201);
    const raised = await replacement(lanLine);
    expect(raised.amountVnd).toBe(70_000);
    // The increase is audited with the root facts of Lan's line (not Hạnh's).
    expect((await adjustedAudit(lanLine)).before).toMatchObject({
      rootLineId: lanLine,
      postedByActor: false,
      rootLineManual: true,
    });
    await refused('hanh', raised.id, { voidLine: true });
    // Lan: the root is hers, today – the line adjusted once is still hers to reduce (T16-9).
    const down = await adjust('lan', raised.id, { newQuantity: 1 });
    expect(down.statusCode, down.body).toBe(201);
    expect((await adjustedAudit(raised.id)).before).toMatchObject({
      rootLineId: lanLine,
      rootLineManual: true,
      postedByActor: true,
      sameBusinessDay: true,
    });
  });

  it('T16-8 / BR-438-03: posted 23:50 → void at 00:20 next day 201 (same business day), at 06:10 → 403', async () => {
    await at('2026-11-12T23:50:00+07:00');
    const x = await add('hanh', 'service_fee', 'Gọi taxi đêm', 1, 120_000);
    const y = await add('hanh', 'service_fee', 'Giữ hành lý đêm', 1, 50_000);
    await at('2026-11-13T00:20:00+07:00');
    const ok = await adjust('hanh', x, { voidLine: true });
    expect(ok.statusCode, ok.body).toBe(201);
    // Contract 1.5: a removal is ONE folio_line.adjusted with after.amountVnd = 0.
    expect(await adjustedAudit(x)).toMatchObject({
      before: { amountVnd: 120_000, sameBusinessDay: true },
      after: { amountVnd: 0 },
    });
    await at('2026-11-13T06:10:00+07:00');
    await refused('hanh', y, { voidLine: true });
  });

  it('T16-10 / BR-438-04 / H-08 + T16-11: the B15 late check-out line Hạnh caused – FD, FDL 403; MGR 201', async () => {
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
    // Lan made one reduction, the manager's void is not a front-desk reduction, increases do not count.
    expect(JSON.stringify(cut)).not.toContain('Khách Thử');
    const mgr = (await c.mgr!.get(url('/attention'))).json().data as any[];
    expect(mgr.filter((i) => i.kind === 'foc_threshold')).toEqual([]);
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
