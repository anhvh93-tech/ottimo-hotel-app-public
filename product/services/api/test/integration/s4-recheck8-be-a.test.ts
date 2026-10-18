/**
 * BE-A – kiểm lại tiền lần 8 (`reviews/s4-money-recheck8.md`, "Sửa trước cổng"):
 * - BUG-R2-207 (R8DEBT-01 + R8VER-01): `openDebtVnd` counted a `debt_write_off` FOC twice once an A32 raise of the
 *   line it reduces made syncReductions reverse the FOC line and post it again – the reversed original is still
 *   `posted`. Only live write-off lines count now (same rule as FolioFocService.afterWriteOff); a reversed RECEIPT
 *   still counts (its reversal records its own increase).
 * Numbers: the critic's table. Oracle: BR-525 (ii) – open debt + in-window post-checkout charges = balance due; the
 * write-off counted = −Σ live `debt_write_off` FOC lines. Fake clock and FAKE data only.
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
import { ReservationHooks } from '../../src/modules/reservations/public/reservation-hooks';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { addDays } from '../../src/shared/time';
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

/** A32 increase inside the post-checkout window. */
const UP = 10_000;
type Res = { statusCode: number; body: string; json(): any; headers: Record<string, any> };
const out = (r: Res) => {
  const j = (() => {
    try {
      return r.json();
    } catch {
      return {};
    }
  })();
  if (r.statusCode >= 400)
    return `${r.statusCode} ${j.code}${j.max !== undefined ? ` max ${j.max}` : ''}`;
  return `${r.statusCode} ${j.status ?? ''}${j.effectiveAmountVnd !== undefined ? ` eff ${j.effectiveAmountVnd}` : ''}`.trim();
};

describe.skipIf(!HAS_DB)('kiểm lại tiền lần 8 – BE-A (BUG-R2-207)', () => {
  let db: Database;
  let t: TestTenant;
  let ids: BookingIds;
  let fa: FeatureApp;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, {
      users: { mgr: ['manager'], fd: ['front_desk'], owner: ['owner'] },
    });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Kiểm Lần Tám' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
    for (const u of ['mgr', 'fd', 'owner']) c[u] = Client.of(fa, t, u);
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
    for (const u of ['mgr', 'fd', 'owner']) {
      c[u]!.deviceToken = token;
      await setPassword(db, t, u);
    }
  }, 120_000);
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (p = '') => `${P(t)}${p}`;
  const q = (sql: string, a: unknown[] = []) =>
    db.withContext(t.ctx(), async (tx) => (await tx.query(sql, a)).rows as any[]);
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const folio = async (id: string) => (await c.mgr!.get(url(`/folios/${id}`))).json();
  const pay = (folioId: string, body: Record<string, unknown>) =>
    c.fd!.send('POST', url(`/folios/${folioId}/payments`), body) as Promise<Res>;
  const act = async (id: string, verb: string, body: unknown) => {
    const v = (await c.fd!.get(url(`/reservations/${id}`))).json().version;
    return c.fd!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${v}"`,
    });
  };
  const writeOff = (folioId: string, lineId: string, amountVnd: number, who = 'mgr') =>
    c[who]!.send('POST', url(`/folios/${folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode: 'debt_write_off',
      note: 'Khách không liên lạc được',
      authMethod: 'password',
      secret: TEST_PASSWORD,
    }) as Promise<Res>;
  const approve = (id: string) =>
    c.owner!.send('POST', url(`/approval-requests/${id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    }) as Promise<Res>;
  /** A32: MGR raises the line (inside the window) – syncReductions reverses the write-off FOC and posts it again. */
  const raise = async (folioId: string, lineId: string, newUnitPriceVnd: number) => {
    const etag = (await c.mgr!.get(url(`/folios/${folioId}`))).headers.etag as string;
    const r = (await c.mgr!.send(
      'POST',
      url(`/folios/${folioId}/lines/${lineId}/adjustments`),
      { reason: 'Sửa giá theo hóa đơn bếp', newUnitPriceVnd },
      { 'if-match': etag },
    )) as Res;
    expect(r.statusCode, r.body).toBe(201);
    return liveFnb(folioId, newUnitPriceVnd);
  };
  const liveFnb = async (folioId: string, amount: number) => {
    const lines = (await folio(folioId)).lines as any[];
    const rev = new Set(lines.map((l) => l.reversalOfId).filter(Boolean));
    return lines.find(
      (l) =>
        l.category === 'fnb' &&
        l.lineState === 'posted' &&
        !l.reversalOfId &&
        !rev.has(l.id) &&
        l.amountVnd === amount,
    )?.id as string;
  };
  const openDebt = (folioId: string) =>
    db.withContext(t.ctx(), (tx) => fa.app.get(ReservationHooks).openDebt(tx, folioId));
  /** The state + the independent oracle: written off = −Σ LIVE `debt_write_off` FOC lines (not reversed). */
  const snap = async (folioId: string) => {
    const f = await folio(folioId);
    const od = await openDebt(folioId);
    const [w] = await q(
      `SELECT COALESCE(-sum(l.amount_vnd), 0)::bigint::int AS live_off,
              count(*) FILTER (WHERE EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = l.id))::int
                AS reversed
         FROM folio_line l JOIN approval_request a ON a.id = l.approval_request_id
        WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND a.reason_code = 'debt_write_off'
          AND NOT EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = l.id)`,
      [folioId],
    );
    return {
      due: f.totals.balanceDueVnd as number,
      credit: f.totals.creditVnd as number,
      openDebtVnd: od ? od.openDebtVnd : null,
      liveOff: w.live_off as number,
    };
  };

  let k = 0;
  /**
   * 202, 2 nights Tue → Thu (792.000 a night – MGR's write-off limit), paid at check-in; on departure 10:00 an fnb
   * line X paid by ONE bank transfer; B18 11:00 (settled, due 0); 15:00 MGR reverses the transfer (G-4) → debt X.
   */
  const stay = async (X: number) => {
    const arrival = addDays('2026-12-01', 7 * k++);
    const departure = addDays(arrival, 2);
    await at('2026-10-20T10:00:00+07:00');
    const body = {
      roomId: ids.rooms['202'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: arrival,
      departureDate: departure,
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
    const b = res.json();
    await at(`${arrival}T15:00:00+07:00`);
    await q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms['202'], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
    const due0 = (await folio(b.folioId)).totals.balanceDueVnd as number;
    if (due0 > 0) {
      expect(
        (await pay(b.folioId, { type: 'charge', method: 'cash', amountVnd: due0 })).statusCode,
      ).toBe(201);
    }
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at(`${departure}T10:00:00+07:00`);
    const l = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
      category: 'fnb',
      description: 'Tiệc nhóm',
      quantity: 1,
      unitPriceVnd: X,
      serviceDate: arrival,
    });
    expect(l.statusCode, l.body).toBe(201);
    const lineId = (l.json().lines as any[]).find((x) => x.category === 'fnb' && x.amountVnd === X)
      .id as string;
    const tr = await pay(b.folioId, { type: 'charge', method: 'bank_transfer', amountVnd: X });
    expect(tr.statusCode, tr.body).toBe(201);
    await at(`${departure}T11:00:00+07:00`);
    const co = await act(b.id, 'check-out', { checkoutTime: '11:00' });
    expect(co.statusCode, co.body).toBe(200);
    expect((await folio(b.folioId)).totals).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    await at(`${departure}T15:00:00+07:00`);
    const rv = await c.mgr!.send('POST', url(`/payments/${tr.json().id}/actions/reverse`), {
      reason: 'Chuyển khoản không về',
    });
    expect(rv.statusCode, rv.body).toBe(200);
    expect(await openDebt(b.folioId)).toMatchObject({ openDebtVnd: X, balanceDueVnd: X });
    return { id: b.id as string, folioId: b.folioId as string, lineId, departure };
  };

  it('BUG-R2-207 submit: G-4 5.000.000 in the window; MGR self-applies 749.000 on the fnb line; A32 +10.000 → open 4.251.000, due 4.261.000; MGR asks 4.251.000 → 201 pending (control: no A32, 666.000 → 4.334.000)', async () => {
    const X = 5_000_000;
    const ctl = await stay(X);
    expect(out(await writeOff(ctl.folioId, ctl.lineId, 666_000))).toBe('201 approved eff 666000');
    expect(await snap(ctl.folioId)).toMatchObject({ due: 4_334_000, openDebtVnd: 4_334_000 });

    const s = await stay(X);
    expect(out(await writeOff(s.folioId, s.lineId, 749_000))).toBe('201 approved eff 749000');
    const line = await raise(s.folioId, s.lineId, X + UP);
    const mid = await snap(s.folioId);
    expect(mid).toEqual({ due: 4_261_000, credit: 0, openDebtVnd: 4_251_000, liveOff: 749_000 });
    // BR-525 (ii): open debt + in-window charges (the +10.000) = due.
    expect(mid.openDebtVnd! + UP).toBe(mid.due);
    expect(out(await writeOff(s.folioId, line, 4_251_000))).toBe('201 pending eff 4251000');
  }, 180_000);

  it('BUG-R2-207 approval: self-applied 707.000, 4.293.000 asked (pending), A32 +10.000, nobody pays → OWN approves 200 approved eff 4.293.000, no applied_capped audit, due 10.000', async () => {
    const s = await stay(5_000_000);
    expect(out(await writeOff(s.folioId, s.lineId, 707_000))).toBe('201 approved eff 707000');
    const w = await writeOff(s.folioId, s.lineId, 4_293_000);
    expect(out(w)).toBe('201 pending eff 4293000');
    await raise(s.folioId, s.lineId, 5_000_000 + UP);
    expect(await snap(s.folioId)).toMatchObject({ due: 4_303_000, openDebtVnd: 4_293_000 });
    expect(out(await approve(w.json().id))).toBe('200 approved eff 4293000');
    const capped = await q(
      `SELECT 1 FROM audit_event WHERE action = 'approval.applied_capped' AND entity_id = $1`,
      [w.json().id],
    );
    expect(capped).toEqual([]);
    expect(await snap(s.folioId)).toMatchObject({ due: UP, credit: 0, liveOff: 5_000_000 });
  }, 180_000);

  it('BUG-R2-207 auto-cancel: 4 × 791.000 self-applied, 1.836.000 asked (pending), A32 +10.000 → OWN approves approved eff 1.836.000 (not cancelled debt_cleared), due 10.000', async () => {
    const s = await stay(5_000_000);
    for (let i = 0; i < 4; i += 1) {
      expect(out(await writeOff(s.folioId, s.lineId, 791_000))).toBe('201 approved eff 791000');
    }
    const w = await writeOff(s.folioId, s.lineId, 1_836_000);
    expect(out(w)).toBe('201 pending eff 1836000');
    await raise(s.folioId, s.lineId, 5_000_000 + UP);
    expect(await snap(s.folioId)).toMatchObject({
      due: 1_846_000,
      openDebtVnd: 1_836_000,
      liveOff: 3_164_000,
    });
    expect(out(await approve(w.json().id))).toBe('200 approved eff 1836000');
    const [req] = await q('SELECT status FROM approval_request WHERE id = $1', [w.json().id]);
    expect(req.status).toBe('approved');
    expect(await snap(s.folioId)).toMatchObject({ due: UP, credit: 0 });
  }, 180_000);

  it('BUG-R2-207 cumulative: debt 100.000, 30.000 written off, A32 +50.000 then +20.000 → the open debt stays 70.000 (the write-off counted once per live line)', async () => {
    const X = 100_000;
    const s = await stay(X);
    expect(out(await writeOff(s.folioId, s.lineId, 30_000))).toBe('201 approved eff 30000');
    expect(await snap(s.folioId)).toMatchObject({ due: 70_000, openDebtVnd: 70_000 });
    const l1 = await raise(s.folioId, s.lineId, X + 50_000);
    expect(await snap(s.folioId)).toMatchObject({
      due: 120_000,
      openDebtVnd: 70_000,
      liveOff: 30_000,
    });
    await raise(s.folioId, l1, X + 70_000);
    expect(await snap(s.folioId)).toMatchObject({
      due: 140_000,
      openDebtVnd: 70_000,
      liveOff: 30_000,
    });
    // After the window everything owed is the debt (open = due).
    await at(`${addDays(s.departure, 1)}T11:01:00+07:00`);
    expect(await openDebt(s.folioId)).toMatchObject({
      openDebtVnd: 140_000,
      balanceDueVnd: 140_000,
    });
  }, 180_000);
});
