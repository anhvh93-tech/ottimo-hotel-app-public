/**
 * V5-16 (Round 5, v1.0.5, BE-B, PR-B1 filter part) – the weekly "Bỏ/giảm dòng" filters, on PostgreSQL. Contract 0.3.13
 * mục 1.5 (FB-R4-SEC-BE-A31-01) + bổ sung 1 mục 1.20 (BR-438 audit part; BE C0313-04, C0313-20):
 * - T16-1 `removalsOnly`: the lines voided or brought to 0 (an open folio's void included), never a partial
 *   reduction, never room money; `reductionsOnly`: every reduction, removals included, never an increase;
 * - T16-2 `action`: several exact codes; an unknown code → empty page; > 10, too long, bad pattern → 422;
 * - T16-3 FD / FDL: their own rows only, whatever the filter;
 * - T16-4 the audit keys READ BACK from `audit_event` (allowlist SR-AUD-03): `before.actorRole`, `postedByActor`,
 *   `sameBusinessDay`, `rootLineId`, `rootLineManual` in the 4 cases (mine / another's × same / another business day);
 * - C0313-04 ý 3 + T16-9 (audit part): a correction in two steps is measured on the ROOT of the `related_line_id`
 *   chain – the second step on another person's line reads `postedByActor = false`, on one's own `true`;
 * - the server pins `category = money` + `action = folio_line.adjusted` (`category=state` → empty page).
 * The corrections that PR-B2 (BR-438) will refuse to FD are made by MGR here, so the cases stay valid after it.
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, startFixture } from './s438-r8/fixture';

const FROM = '2026-11-09';
const TO = '2026-11-10';

describe.skipIf(!HAS_DB)('V5-16 – line removal / reduction filters and audit keys', () => {
  let x: Fx;
  let folioId: string;
  let roomLine: string;
  /** Line ids by name (the line each correction was made on). */
  const L: Record<string, string> = {};

  const post = async (who: string, name: string, unitPriceVnd: number, quantity = 1) => {
    const before = new Set(((await x.folio(folioId)).lines as any[]).map((l) => l.id));
    const r = await x.c[who]!.send('POST', x.url(`/folios/${folioId}/lines`), {
      category: 'fnb',
      description: `Đồ uống ${name}`,
      quantity,
      unitPriceVnd,
      // inside the stay (arrival 10/11) – the posting day is what the audit keys read
      serviceDate: '2026-11-10',
    });
    expect(r.statusCode, r.body).toBe(201);
    const fresh = (r.json().lines as any[]).filter((l) => !before.has(l.id));
    expect(fresh).toHaveLength(1);
    L[name] = fresh[0].id;
    return fresh[0].id as string;
  };
  const adjust = async (who: string, lineId: string, body: Record<string, unknown>) => {
    const r = await x.c[who]!.send(
      'POST',
      x.url(`/folios/${folioId}/lines/${lineId}/adjustments`),
      { reason: 'Khách đổi món', ...body },
      { 'if-match': await x.etagOf(folioId) },
    );
    expect(r.statusCode, r.body).toBe(201);
    return r.json();
  };
  /** The replacement adjustFolioLine posted for `lineId` (related_line_id = lineId). */
  const replacementOf = async (lineId: string) =>
    (
      await x.q(
        `SELECT id FROM folio_line WHERE related_line_id = $1 AND reversal_of_id IS NULL ORDER BY created_at DESC`,
        [lineId],
      )
    )[0].id as string;
  /** The `folio_line.adjusted` rows of a line, read back from the table (not the API). */
  const adjusted = (lineId: string) =>
    x.q(
      `SELECT actor_user_id, category, before, after FROM audit_event
        WHERE action = 'folio_line.adjusted' AND entity_id = $1 ORDER BY id`,
      [lineId],
    );
  const list = (who: string, query: string) =>
    x.c[who]!.get(x.url(`/audit-events?from=${FROM}&to=${TO}&limit=100&${query}`));
  const ids = async (who: string, query: string) => {
    const r = await list(who, query);
    expect(r.statusCode, r.body).toBe(200);
    return (r.json().data as any[]).map((e) => e.entityId as string).sort();
  };

  beforeAll(async () => {
    x = await startFixture();
    // Booking created the day before (business day 09/11, rollover 06:00 in the test parameters).
    await x.at('2026-11-09T10:00:00+07:00');
    const body = {
      roomId: x.ids.rooms['101'],
      channelId: x.ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: x.guest,
      paymentModel: 'direct',
      arrivalDate: '2026-11-10',
      departureDate: '2026-11-12',
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
    folioId = res.json().folioId;
    roomLine = (
      await x.q(
        `SELECT id FROM folio_line WHERE folio_id = $1 AND category = 'room' AND reversal_of_id IS NULL
          ORDER BY service_date LIMIT 1`,
        [folioId],
      )
    )[0].id;
    // 09/11: lines of "yesterday".
    await post('fd', 'fdYesterday', 120_000);
    await post('mgr', 'mgrYesterday', 130_000);
    // 10/11 – today.
    await x.at('2026-11-10T10:00:00+07:00');
    await post('fd', 'fdToday', 200_000);
    await post('fd', 'fdToday2', 90_000);
    await post('fd', 'fdPartial', 100_000, 3);
    await post('fd', 'fdTwoStep', 80_000);
    await post('fd', 'fdUp', 50_000);
    await post('fd', 'fdTwoStepOther', 70_000);
    await post('lead', 'leadToday', 60_000);

    // T16-4 – the 4 cases (MGR for the corrections PR-B2 keeps for MGR+ only).
    await adjust('fd', L.fdToday!, { voidLine: true }); // mine × same day
    await adjust('mgr', L.mgrYesterday!, { voidLine: true }); // mine × another day
    await adjust('mgr', L.fdToday2!, { voidLine: true }); // another's × same day
    await adjust('mgr', L.fdYesterday!, { newQuantity: 0 }); // another's × another day (quantity 0)
    // T16-1: a partial reduction (300.000 → 200.000) – a reduction, not a removal.
    await adjust('fd', L.fdPartial!, { newQuantity: 2 });
    // T16-9 audit part: FD lowers its own line, then voids the replacement → measured on its own root line.
    await adjust('fd', L.fdTwoStep!, { newUnitPriceVnd: 1_000 });
    L.fdTwoStepR = await replacementOf(L.fdTwoStep!);
    await adjust('fd', L.fdTwoStepR, { voidLine: true });
    // C0313-04 ý 3: MGR lowers FD's line to 1.000, then voids its OWN replacement → the root is FD's line.
    await adjust('mgr', L.fdTwoStepOther!, { newUnitPriceVnd: 1_000 });
    L.fdTwoStepOtherR = await replacementOf(L.fdTwoStepOther!);
    await adjust('mgr', L.fdTwoStepOtherR, { voidLine: true });
    // An increase – in neither filter.
    await adjust('fd', L.fdUp!, { newQuantity: 2 });
    // Room money lowered by MGR – a reduction of a night, left out of both filters.
    const night = ((await x.folio(folioId)).lines as any[]).find((l) => l.id === roomLine);
    await adjust('mgr', roomLine, { newUnitPriceVnd: night.unitPriceVnd - 100_000 });
    // FDL voids its own line (T16-3 scope).
    await adjust('lead', L.leadToday!, { voidLine: true });
  }, 120_000);
  afterAll(async () => {
    await x?.close();
  });

  it('T16-4 – audit keys read back from audit_event, 4 cases (allowlist keeps them)', async () => {
    const one = async (lineId: string) => {
      const rows = await adjusted(lineId);
      expect(rows, lineId).toHaveLength(1);
      expect(rows[0].category).toBe('money');
      return rows[0];
    };
    const mineToday = await one(L.fdToday!);
    expect(mineToday.actor_user_id).toBe(x.t.users.fd!.id);
    expect(mineToday.before).toEqual({
      category: 'fnb',
      amountVnd: 200_000,
      actorRole: 'front_desk',
      postedByActor: true,
      sameBusinessDay: true,
      rootLineId: L.fdToday,
      rootLineManual: true,
    });
    // A void on an OPEN folio writes the removal (before 0.3.13 only folio.line_reversed was written).
    expect(mineToday.after).toEqual({ category: 'fnb', amountVnd: 0 });

    expect((await one(L.mgrYesterday!)).before).toMatchObject({
      actorRole: 'manager',
      postedByActor: true,
      sameBusinessDay: false,
      rootLineId: L.mgrYesterday,
      rootLineManual: true,
    });
    expect((await one(L.fdToday2!)).before).toMatchObject({
      actorRole: 'manager',
      postedByActor: false,
      sameBusinessDay: true,
      rootLineId: L.fdToday2,
    });
    const otherDay = await one(L.fdYesterday!);
    expect(otherDay.before).toMatchObject({
      actorRole: 'manager',
      postedByActor: false,
      sameBusinessDay: false,
      rootLineId: L.fdYesterday,
    });
    expect(otherDay.after).toEqual({ category: 'fnb', amountVnd: 0 });
    // The reversal row stays as it was (folio.line_reversed, no new key).
    const reversed = await x.q(
      `SELECT before, after FROM audit_event WHERE action = 'folio.line_reversed' AND entity_id = $1`,
      [L.fdToday],
    );
    expect(reversed).toHaveLength(1);
    expect(reversed[0].before).toEqual({ category: 'fnb', amountVnd: 200_000 });
  });

  it('C0313-04 ý 3 / T16-9 – a two-step correction is measured on the root of the chain', async () => {
    // FD on its own line: step 1 and step 2 both read the root FD posted today.
    const [own1] = await adjusted(L.fdTwoStep!);
    const [own2] = await adjusted(L.fdTwoStepR!);
    for (const r of [own1, own2]) {
      expect(r.before).toMatchObject({
        actorRole: 'front_desk',
        postedByActor: true,
        sameBusinessDay: true,
        rootLineId: L.fdTwoStep,
        rootLineManual: true,
      });
    }
    expect(own1.after).toEqual({ category: 'fnb', amountVnd: 1_000 });
    expect(own2.after).toEqual({ category: 'fnb', amountVnd: 0 });
    // MGR voids the replacement IT posted: measured on FD's root line → postedByActor false (not "mine, today").
    const [step2] = await adjusted(L.fdTwoStepOtherR!);
    expect(step2.before).toMatchObject({
      actorRole: 'manager',
      postedByActor: false,
      sameBusinessDay: true,
      rootLineId: L.fdTwoStepOther,
      rootLineManual: true,
    });
    // The replacement itself is a manual line posted by MGR – the naive reading would have said true.
    const [repl] = await x.q(`SELECT posted_by, source FROM folio_line WHERE id = $1`, [
      L.fdTwoStepOtherR,
    ]);
    expect(repl).toEqual({ posted_by: x.t.users.mgr!.id, source: 'manual' });
  });

  it('T16-1 – removalsOnly: voids and quantity 0 only; reductionsOnly: every reduction; room money left out', async () => {
    const removals = [
      L.fdToday,
      L.mgrYesterday,
      L.fdToday2,
      L.fdYesterday,
      L.fdTwoStepR,
      L.fdTwoStepOtherR,
      L.leadToday,
    ].sort() as string[];
    expect(await ids('mgr', 'removalsOnly=true')).toEqual(removals);
    expect(await ids('owner', 'removalsOnly=true&category=money')).toEqual(removals);
    const reductions = [...removals, L.fdPartial, L.fdTwoStep, L.fdTwoStepOther].sort();
    expect(await ids('mgr', 'reductionsOnly=true')).toEqual(reductions);
    // Both at once: removals (a removal is a reduction).
    expect(await ids('mgr', 'removalsOnly=true&reductionsOnly=true')).toEqual(removals);
    // The room line was lowered (its audit is there) but is room money.
    expect((await adjusted(roomLine)).length).toBeGreaterThan(0);
    for (const q of ['removalsOnly=true', 'reductionsOnly=true']) {
      const got = await ids('mgr', q);
      expect(got).not.toContain(roomLine);
      expect(got).not.toContain(L.fdUp);
    }
    // Pinned by the server: another category or action gives an empty page, never another kind of row.
    expect(await ids('mgr', 'removalsOnly=true&category=state')).toEqual([]);
    expect(await ids('mgr', 'reductionsOnly=true&action=folio.line_reversed')).toEqual([]);
    const all = (await list('mgr', 'reductionsOnly=true')).json().data as any[];
    expect(new Set(all.map((e) => `${e.category} ${e.action}`))).toEqual(
      new Set(['money folio_line.adjusted']),
    );
    // Wrong type → 422.
    for (const q of ['removalsOnly=yes', 'reductionsOnly=1']) {
      const r = await list('mgr', q);
      expect(r.statusCode, q).toBe(422);
      expect(r.json().code).toBe('VALIDATION_FAILED');
    }
  });

  it('T16-2 – action: several exact codes, unknown → empty, > 10 / bad pattern / too long → 422', async () => {
    const r = await list('mgr', 'action=folio_line.adjusted&action=folio.line_reversed');
    expect(r.statusCode, r.body).toBe(200);
    const actions = new Set((r.json().data as any[]).map((e) => e.action));
    expect(actions).toEqual(new Set(['folio_line.adjusted', 'folio.line_reversed']));
    const one = await list('mgr', 'action=folio.line_reversed');
    expect(new Set((one.json().data as any[]).map((e) => e.action))).toEqual(
      new Set(['folio.line_reversed']),
    );
    // The same code twice counts once.
    expect(
      (await list('mgr', 'action=folio.line_reversed&action=folio.line_reversed')).json().data,
    ).toEqual(one.json().data);
    const unknown = await list('mgr', 'action=no_such.action');
    expect(unknown.statusCode).toBe(200);
    expect(unknown.json().data).toEqual([]);
    const eleven = Array.from({ length: 11 }, (_, i) => `action=a${i}.x`).join('&');
    const bad: Array<[string, string]> = [
      [eleven, 'VALUE_OUT_OF_RANGE'],
      ['action=Folio_line.adjusted', 'VALIDATION_FAILED'],
      ['action=folio-line', 'VALIDATION_FAILED'],
      ['action=', 'VALIDATION_FAILED'],
      [`action=a${'b'.repeat(60)}`, 'TOO_LONG'],
    ];
    for (const [q, code] of bad) {
      const e = await list('mgr', q);
      expect(e.statusCode, q).toBe(422);
      expect(e.json().errors, q).toEqual([{ field: 'action', code }]);
    }
    // Ten is the limit, not an error.
    const ten = Array.from({ length: 10 }, (_, i) => `action=a${i}.x`).join('&');
    expect((await list('mgr', ten)).statusCode).toBe(200);
  });

  it('T16-3 – FD / FDL see their own rows only, whatever the filter', async () => {
    const fdRemovals = [L.fdToday, L.fdTwoStepR].sort();
    expect(await ids('fd', 'removalsOnly=true')).toEqual(fdRemovals);
    // actorUserId is ignored for the own scope.
    expect(await ids('fd', `removalsOnly=true&actorUserId=${x.t.users.mgr!.id}`)).toEqual(
      fdRemovals,
    );
    expect(await ids('fd', 'reductionsOnly=true')).toEqual(
      [...fdRemovals, L.fdPartial, L.fdTwoStep].sort(),
    );
    expect(await ids('lead', 'removalsOnly=true')).toEqual([L.leadToday]);
    const fdAll = (await list('fd', 'action=folio_line.adjusted&action=folio.line_reversed')).json()
      .data as any[];
    expect(fdAll.length).toBeGreaterThan(0);
    const fdRows = await x.q(
      `SELECT count(*)::int AS n FROM audit_event
        WHERE action IN ('folio_line.adjusted', 'folio.line_reversed') AND actor_user_id = $1`,
      [x.t.users.fd!.id],
    );
    expect(fdAll).toHaveLength(fdRows[0].n);
    // MGR filters one person (the manager's weekly view by person).
    expect(await ids('mgr', `removalsOnly=true&actorUserId=${x.t.users.fd!.id}`)).toEqual(
      fdRemovals,
    );
  });
});
