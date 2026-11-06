/**
 * v1.0.4 P4-10 `v104/be-holds` (BE-B) – unit, no database:
 * - BUG-R3-042 / BR-303 (1): overdueHoldAccepts (deposits.service) and the B4 button (allowed-actions) – same rule;
 * - BUG-R3-041 / DOM A.5: who is told by J1 (hold-notices.ts) – `hold_expired` also every FD/FDL from v1.0.5
 *   (V5-1B, DOM rules-v1.0.5 mục 9; the v1.0.4 "FD/FDL only as a fallback" branch is gone);
 * - ĐX-R3-QA-01: the computed "Cần chú ý" items hold_overdue / hold_overdue_cap (attention-sources.ts) on a
 *   MutableClock (the staging time-travel clock QA uses to make holds expire), audiences and params;
 * - FB-R4-SEC-BE-HOLDS-01: the recordPayment / confirm-received gate (payments.service) per role.
 */
import { describe, expect, it } from 'vitest';
import { type ClockState, type ClockStateStore, FixedClock, MutableClock } from '../src/clock';
import type { Tx } from '../src/db/database';
import { STAFF_NOTIFICATION_KINDS } from '../src/db/schema/frontdesk';
import { AuditService } from '../src/modules/audit/public/audit.service';
import {
  type AttentionSourceContext,
  assertAttentionParams,
  attentionAudience,
  attentionVisibleTo,
} from '../src/modules/events/public/events.service';
import { holdsOverdue } from '../src/modules/frontdesk/internal/attention-sources';
import { overdueHoldAccepts } from '../src/modules/payments/internal/deposits.service';
import { PaymentsService } from '../src/modules/payments/internal/payments.service';
import { ParameterService } from '../src/modules/platform/public/parameter.service';
import {
  type ActionContext,
  allowedActions,
} from '../src/modules/reservations/internal/allowed-actions';
import {
  HOLD_NOTICE_ROLES,
  HOLD_NOTICE_TO_PEOPLE,
  notifyHoldOnce,
} from '../src/modules/reservations/internal/hold-notices';
import { reservationWorkerComposition } from '../src/modules/reservations/public/worker-jobs';
import { toZonedIso } from '../src/shared/time';

const TZ = 'Asia/Ho_Chi_Minh';
const at = (iso: string) => new Date(iso);

class MemoryClockStore implements ClockStateStore {
  state: ClockState | null = null;
  async load() {
    return this.state;
  }
  async save(s: ClockState | null) {
    this.state = s;
  }
  async subscribe() {
    return async () => undefined;
  }
}

async function frozenClock(iso: string): Promise<MutableClock> {
  const clock = new MutableClock(new MemoryClockStore());
  await clock.set(at(iso));
  await clock.freeze();
  return clock;
}

describe('BUG-R3-042 – overdueHoldAccepts (BR-303 (1), US-085 AC4, SEC-BE-22 (2))', () => {
  const expiresAt = at('2026-11-03T10:00:00+07:00');
  const before = at('2026-11-03T09:50:00+07:00');
  const after = at('2026-11-03T10:30:00+07:00');

  it('a hold that already received money: FD+ confirms with money recorded after the deadline', () => {
    expect(
      overdueHoldAccepts({ desk: true, paidBeforeVnd: 300_000, receivedAt: after, expiresAt }),
    ).toBe(true);
    // Days later, still a hold (no 12:00 cap on the confirmation – "tới khi nhận phòng").
    expect(
      overdueHoldAccepts({
        desk: true,
        paidBeforeVnd: 1,
        receivedAt: at('2026-11-05T15:00:00+07:00'),
        expiresAt,
      }),
    ).toBe(true);
  });

  it('a hold with nothing received: only money that arrived BEFORE the deadline (US-085 AC4)', () => {
    expect(
      overdueHoldAccepts({ desk: true, paidBeforeVnd: 0, receivedAt: before, expiresAt }),
    ).toBe(true);
    expect(
      overdueHoldAccepts({ desk: true, paidBeforeVnd: 0, receivedAt: expiresAt, expiresAt }),
    ).toBe(false);
    expect(overdueHoldAccepts({ desk: true, paidBeforeVnd: 0, receivedAt: after, expiresAt })).toBe(
      false,
    );
  });

  it('SEC-BE-22 (2): a sale/CTV never confirms an overdue hold, paid or not', () => {
    for (const paidBeforeVnd of [0, 300_000]) {
      for (const receivedAt of [before, after]) {
        expect(overdueHoldAccepts({ desk: false, paidBeforeVnd, receivedAt, expiresAt })).toBe(
          false,
        );
      }
    }
  });
});

describe('BUG-R3-042 – allowedActions offers B4 exactly when the server accepts it', () => {
  const base: ActionContext = {
    status: 'hold',
    conflictState: 'none',
    channelGroup: 'direct',
    arrivalDate: '2026-11-05',
    departureDate: '2026-11-08',
    today: '2026-11-03',
    holdExpired: false,
    holdExtendedCount: 0,
    own: true,
    noShowMarkable: false,
    restoreWithinRules: false,
    rescheduleCount: 0,
    rescheduleMaxTimes: 1,
  };
  const b4 = (roles: string[], over: Partial<ActionContext>) =>
    allowedActions(roles, { ...base, ...over }).some((a) => a.action === 'confirm-deposit');

  it('before the deadline: FD+ and the sale in charge (unchanged)', () => {
    for (const r of ['owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff']) {
      expect(b4([r], {}), r).toBe(true);
    }
    expect(b4(['collaborator'], {})).toBe(false);
  });

  it('past the deadline with money received: FD+ only (SAL/CTV hidden – server says HOLD_EXPIRED)', () => {
    const paid = { holdExpired: true, depositPaidVnd: 300_000 };
    for (const r of ['owner', 'manager', 'front_desk_lead', 'front_desk'])
      expect(b4([r], paid), r).toBe(true);
    expect(b4(['sales_staff'], paid)).toBe(false);
    expect(b4(['collaborator'], paid)).toBe(false);
  });

  it('past the deadline with nothing received: hidden for everyone (J1 cancels it)', () => {
    for (const r of ['owner', 'manager', 'front_desk', 'sales_staff']) {
      expect(b4([r], { holdExpired: true, depositPaidVnd: 0 }), r).toBe(false);
      expect(b4([r], { holdExpired: true }), `${r} (absent = 0)`).toBe(false);
    }
  });

  it('extend-hold stays hidden past the deadline; cancel stays offered', () => {
    const acts = allowedActions(['front_desk'], { ...base, holdExpired: true, depositPaidVnd: 1 });
    expect(acts.map((a) => a.action)).toEqual(['confirm-deposit', 'cancel']);
  });
});

describe('BUG-R3-041 – J1 recipients (DOM A.5) and the new inbox kinds', () => {
  it('hold_overdue_with_deposit → creator/closer + FD/FDL/MGR; cap → MGR/OWN; hold_expired → creator/closer + FD/FDL (V5-1B)', () => {
    expect(HOLD_NOTICE_ROLES.hold_overdue_with_deposit).toEqual([
      'front_desk',
      'front_desk_lead',
      'manager',
    ]);
    expect(HOLD_NOTICE_TO_PEOPLE.hold_overdue_with_deposit).toBe(true);
    expect([...HOLD_NOTICE_ROLES.hold_overdue_cap].sort()).toEqual(['manager', 'owner']);
    expect(HOLD_NOTICE_TO_PEOPLE.hold_overdue_cap).toBe(false);
    expect(HOLD_NOTICE_ROLES.hold_expired).toEqual(['front_desk', 'front_desk_lead']);
    expect(HOLD_NOTICE_TO_PEOPLE.hold_expired).toBe(true);
  });

  it('the three kinds are inbox kinds (0093 widens the CHECK)', () => {
    for (const k of ['hold_expired', 'hold_overdue_with_deposit', 'hold_overdue_cap']) {
      expect(STAFF_NOTIFICATION_KINDS as readonly string[]).toContain(k);
    }
  });

  /** Fake Tx: records SQL; the outbox INSERT answers "inserted" once per dedupe key. */
  function fakeTx() {
    const keys = new Set<string>();
    const sql: string[] = [];
    const tx = {
      ctx: { organizationId: 'o', propertyId: 'p' },
      async query(text: string, params: unknown[]) {
        sql.push(text);
        if (text.includes('INSERT INTO outbox_message')) {
          const key = params[4] as string;
          if (keys.has(key)) return { rows: [] };
          keys.add(key);
          return { rows: [{ id: 'x' }] };
        }
        return { rows: [] };
      },
    } as unknown as Tx;
    return { tx, sql };
  }

  it('notifyHoldOnce: one inbox notify per dedupe key (J1 re-reads a kept hold every tick), push row is the gate', async () => {
    const { tx } = fakeTx();
    const calls: unknown[] = [];
    const events = {
      notify: async (_tx: Tx, input: unknown, _now: Date, opts: unknown) => {
        calls.push({ input, opts });
        return [];
      },
    } as never;
    const n = {
      kind: 'hold_overdue_with_deposit' as const,
      people: ['u-sale', 'u-sale'],
      reservationId: 'r1',
      code: 'OTM-00368',
      dedupeKey: 'hold_overdue_partial:r1:2026-11-03T03:00:00.000Z',
    };
    const now = at('2026-11-03T10:01:00+07:00');
    expect(await notifyHoldOnce(tx, events, n, now)).toBe(true);
    expect(await notifyHoldOnce(tx, events, n, now)).toBe(false);
    expect(calls).toEqual([
      {
        input: {
          kind: 'hold_overdue_with_deposit',
          roles: ['front_desk', 'front_desk_lead', 'manager'],
          userIds: ['u-sale'],
          refType: 'reservation',
          refId: 'r1',
          refCode: 'OTM-00368',
        },
        opts: { push: false },
      },
    ]);
  });

  it('V5-1B notifyHoldOnce: hold_expired → ONE notify to creator/closer + FD/FDL, push row as gate; next tick nothing', async () => {
    const { tx, sql } = fakeTx();
    const calls: Array<{ roles: string[]; userIds: string[] }> = [];
    const events = {
      notify: async (_tx: Tx, input: { roles: string[]; userIds: string[] }) => {
        calls.push({ roles: input.roles, userIds: input.userIds });
        return ['u-sale', 'u-fd'];
      },
    } as never;
    const n = {
      kind: 'hold_expired' as const,
      people: ['u-sale', 'u-sale'],
      reservationId: 'r2',
      code: 'OTM-1',
      dedupeKey: 'hold_expired:r2',
    };
    expect(await notifyHoldOnce(tx, events, n, at('2026-11-03T10:01:00+07:00'))).toBe(true);
    expect(await notifyHoldOnce(tx, events, n, at('2026-11-03T10:02:00+07:00'))).toBe(false);
    expect(sql.filter((q) => q.includes('outbox_message'))).toHaveLength(2); // second = conflict, nothing
    expect(calls).toEqual([{ roles: ['front_desk', 'front_desk_lead'], userIds: ['u-sale'] }]);
  });

  it('V5-1B notifyHoldOnce: hold_expired without creator/closer, or whose creator is gone → still the same single notify to FD/FDL (no second call)', async () => {
    for (const people of [[], ['u-gone']]) {
      const { tx } = fakeTx();
      const calls: Array<{ roles: string[]; userIds: string[] }> = [];
      const events = {
        notify: async (_tx: Tx, input: { roles: string[]; userIds: string[] }) => {
          calls.push({ roles: input.roles, userIds: input.userIds });
          return [];
        },
      } as never;
      const n = {
        kind: 'hold_expired' as const,
        people,
        reservationId: 'r3',
        code: 'OTM-2',
        dedupeKey: 'hold_expired:r3',
      };
      expect(await notifyHoldOnce(tx, events, n, at('2026-11-03T10:01:00+07:00'))).toBe(true);
      await notifyHoldOnce(tx, events, n, at('2026-11-03T10:02:00+07:00')); // next tick: nothing
      expect(calls).toEqual([{ roles: ['front_desk', 'front_desk_lead'], userIds: people }]);
    }
  });

  it('never HK / MT / accounting; OWN only for the cap', () => {
    const all = Object.values(HOLD_NOTICE_ROLES).flat();
    for (const r of ['housekeeping', 'maintenance', 'accountant']) expect(all).not.toContain(r);
    expect(HOLD_NOTICE_ROLES.hold_expired).not.toContain('owner');
    expect(HOLD_NOTICE_ROLES.hold_expired).not.toContain('manager');
  });
});

describe('ĐX-R3-QA-01 – "Cần chú ý" hold_overdue / hold_overdue_cap (computed, MutableClock)', () => {
  /** Rows as PostgreSQL returns them for the source's query; the WHERE (status hold, deadline ≤ now) is the DB's. */
  const rows = [
    {
      id: 'far',
      code: 'OTM-00401',
      hold_expires_at: at('2026-11-02T20:00:00+07:00'),
      cap_at: at('2026-11-25T12:00:00+07:00'), // arrival +22 days (AC1)
    },
    {
      id: 'today',
      code: 'OTM-00402',
      hold_expires_at: at('2026-11-03T10:00:00+07:00'),
      cap_at: at('2026-11-05T12:00:00+07:00'),
    },
  ];
  const tx = (list: typeof rows, seen: unknown[][] = []) =>
    ({
      async query(_sql: string, params: unknown[]) {
        seen.push(params);
        return { rows: list };
      },
    }) as unknown as Tx;
  const ctxAt = (clock: MutableClock): AttentionSourceContext => ({
    tz: TZ,
    now: clock.now(),
    today: '2026-11-05',
    iso: (d) => toZonedIso(d, TZ),
    param: async <T>(key: string) =>
      (key === 'hold_latest_time_on_arrival' ? '12:00' : undefined) as T,
  });

  it('every overdue hold, any arrival date → one critical hold_overdue (FD+), no cap before 12:00', async () => {
    const clock = await frozenClock('2026-11-05T11:59:00+07:00');
    const seen: unknown[][] = [];
    const items = await holdsOverdue(tx(rows, seen), ctxAt(clock));
    expect(seen[0]).toEqual([clock.now(), '12:00', TZ]);
    expect(items).toEqual([
      {
        kind: 'hold_overdue',
        source: 'computed',
        severity: 'critical',
        count: 2,
        dueAt: '2026-11-02T20:00:00.000+07:00',
        reservationIds: ['far', 'today'],
        params: { count: 2 },
      },
    ]);
  });

  it('from 12:00 of the arrival day → also hold_overdue_cap for MGR/OWN (one hold → refCode)', async () => {
    const clock = await frozenClock('2026-11-05T11:59:00+07:00');
    await clock.advance(60_000);
    const items = await holdsOverdue(tx(rows), ctxAt(clock));
    expect(items.map((i) => i.kind)).toEqual(['hold_overdue', 'hold_overdue_cap']);
    expect(items[1]).toMatchObject({
      severity: 'critical',
      count: 1,
      reservationIds: ['today'],
      refCode: 'OTM-00402',
      dueAt: '2026-11-05T12:00:00.000+07:00',
    });
  });

  it('nothing overdue (confirmed / cancelled holds are gone from the query) → no item', async () => {
    const clock = await frozenClock('2026-11-05T13:00:00+07:00');
    expect(await holdsOverdue(tx([]), ctxAt(clock))).toEqual([]);
  });

  it('audiences and params: hold_overdue FD+, hold_overdue_cap MGR/OWN; `count` only', () => {
    expect([...attentionAudience({ kind: 'hold_overdue' })].sort()).toEqual(
      ['front_desk', 'front_desk_lead', 'manager', 'owner'].sort(),
    );
    expect([...attentionAudience({ kind: 'hold_overdue_cap' })].sort()).toEqual([
      'manager',
      'owner',
    ]);
    expect(attentionVisibleTo({ kind: 'hold_overdue_cap' }, ['front_desk_lead'])).toBe(false);
    expect(attentionVisibleTo({ kind: 'hold_overdue' }, ['sales_staff'])).toBe(false);
    expect(() => assertAttentionParams('hold_overdue', { count: 2 })).not.toThrow();
    expect(() => assertAttentionParams('hold_overdue_cap', { code: 'OTM-00402' })).toThrow(
      /allow-listed/,
    );
  });
});

describe('WA-04 – the worker composition of J1 has the FOC decision hooks of FolioModule', () => {
  it('ApprovalService: foc + special_discount with preLock; FolioService gets approvals/events; ReservationsService gets events', () => {
    const clock = new FixedClock(at('2026-11-04T00:00:00Z'));
    const audit = new AuditService(clock, {} as never);
    const c = reservationWorkerComposition({
      clock,
      audit,
      parameters: new ParameterService(clock, audit),
    });
    expect(c.jobs.map((j) => j.key)).toEqual(['hold.expire', 'ooo.activate', 'lease.nights']);
    expect(c.approvals.decisionHooks()).toEqual([
      { type: 'foc', preLock: true },
      { type: 'special_discount', preLock: true },
    ]);
    const folios = c.folios as unknown as Record<string, unknown>;
    for (const p of ['approvals', 'events', 'docNumbers']) expect(folios[p], p).toBeDefined();
    const approvals = c.approvals as unknown as Record<string, unknown>;
    for (const p of ['focView', 'refundRouting']) expect(typeof approvals[p], p).toBe('function');
    expect((c.reservations as unknown as Record<string, unknown>).events).toBeDefined();
  });
});

describe('FB-R4-SEC-BE-HOLDS-01 – no sale/CTV money on an overdue hold (recordPayment, confirm-received)', () => {
  const deadline = at('2026-11-12T12:00:00+07:00');
  const gate = async (
    roles: string[],
    nowIso: string,
    r: { status: string; holdExpiresAt?: Date | null },
  ) => {
    const svc = Object.create(PaymentsService.prototype) as Record<string, unknown>;
    svc.clock = await frozenClock(nowIso);
    svc.folios = { timezone: async () => TZ };
    const fn = svc.assertHoldOpenForSales as (
      this: unknown,
      tx: Tx,
      a: { roles: readonly string[] },
      row: typeof r,
    ) => Promise<void>;
    return fn.call(svc, {} as Tx, { roles }, r);
  };
  const hold = { status: 'hold', holdExpiresAt: deadline };

  it('SAL and CTV past the deadline (J1 not run yet) → 409 HOLD_EXPIRED with expiredAt', async () => {
    for (const role of ['sales_staff', 'collaborator']) {
      await expect(gate([role], '2026-11-12T12:01:00+07:00', hold), role).rejects.toMatchObject({
        code: 'HOLD_EXPIRED',
      });
    }
    await expect(gate(['sales_staff'], '2026-11-12T12:00:00+07:00', hold)).rejects.toMatchObject({
      code: 'HOLD_EXPIRED',
    });
  });

  it('FD+ unchanged past the deadline; SAL before the deadline unchanged; not a hold → no gate', async () => {
    for (const role of ['front_desk', 'front_desk_lead', 'manager', 'owner']) {
      await expect(gate([role], '2026-11-12T12:01:00+07:00', hold), role).resolves.toBeUndefined();
    }
    await expect(gate(['sales_staff'], '2026-11-12T11:59:00+07:00', hold)).resolves.toBeUndefined();
    await expect(
      gate(['sales_staff'], '2026-11-12T12:01:00+07:00', {
        status: 'confirmed',
        holdExpiresAt: deadline,
      }),
    ).resolves.toBeUndefined();
    await expect(
      gate(['sales_staff'], '2026-11-12T12:01:00+07:00', { status: 'hold', holdExpiresAt: null }),
    ).resolves.toBeUndefined();
  });
});
