/**
 * V5-15 (OpenAPI 0.3.13 bổ sung 1/1d, contract 1.4 + 1.18, DOM rules-v1.0.5 7.1 (a)) – the pure rules of the overdue
 * check-out: overdue, `nightsNotBilled` (business day at the click − effective departure), the role gate (OWN always,
 * MGR ≤ 1 night, FDL/FD never; union of roles) and the exact 403 bodies (H-01, H-02, H-04). No database.
 */
import { describe, expect, it } from 'vitest';
import { countInWindow } from '../src/modules/inventory/internal/fridge';
import { checkOutAction } from '../src/modules/reporting/internal/stay-actions';
import {
  type ActionContext,
  allowedActions,
} from '../src/modules/reservations/internal/allowed-actions';
import {
  MGR_OVERDUE_MAX_NIGHTS,
  OVERDUE_CHECKOUT_DENIED,
  assertOverdueCheckoutRole,
  canCheckOutOverdue,
  isOverdue,
  nightsNotBilled,
} from '../src/modules/reservations/public/overdue-checkout';
import { ProblemError } from '../src/shared/problem';

function refusal(roles: string[], nights: number): ProblemError {
  try {
    assertOverdueCheckoutRole(roles, nights);
  } catch (err) {
    if (err instanceof ProblemError) return err;
    throw err;
  }
  throw new Error('expected a refusal');
}

describe('V5-15 overdue check-out rules', () => {
  it('overdue only after the effective departure business day (the departure day and the post-midnight window are not)', () => {
    expect(isOverdue('2026-11-10', '2026-11-10')).toBe(false);
    expect(isOverdue('2026-11-09', '2026-11-10')).toBe(false); // post-midnight window: business day = departure − 1
    expect(isOverdue('2026-11-11', '2026-11-10')).toBe(true);
  });

  it('nightsNotBilled = business day at the click − departure (DOM 7.1 examples; month and year ends)', () => {
    // Departure 10/11: 09:00 on 11/11 → business day 11/11 → 1; 06:30 on 12/11 → 12/11 → 2; 05:00 on 12/11 → 11/11 → 1.
    expect(nightsNotBilled('2026-11-11', '2026-11-10')).toBe(1);
    expect(nightsNotBilled('2026-11-12', '2026-11-10')).toBe(2);
    expect(nightsNotBilled('2026-12-01', '2026-11-30')).toBe(1);
    expect(nightsNotBilled('2027-01-02', '2026-12-31')).toBe(2);
    expect(nightsNotBilled('2026-11-10', '2026-11-10')).toBe(0);
    expect(nightsNotBilled('2026-11-09', '2026-11-10')).toBe(0);
  });

  it('roles: OWN always, MGR while ≤ 1 night, FDL/FD never; several roles = union', () => {
    expect(MGR_OVERDUE_MAX_NIGHTS).toBe(1);
    expect(canCheckOutOverdue(['owner'], 5)).toBe(true);
    expect(canCheckOutOverdue(['manager'], 1)).toBe(true);
    expect(canCheckOutOverdue(['manager'], 2)).toBe(false);
    expect(canCheckOutOverdue(['front_desk_lead'], 1)).toBe(false);
    expect(canCheckOutOverdue(['front_desk'], 1)).toBe(false);
    expect(canCheckOutOverdue(['front_desk', 'manager'], 1)).toBe(true);
    expect(canCheckOutOverdue(['front_desk', 'manager'], 2)).toBe(false);
    expect(canCheckOutOverdue(['manager', 'owner'], 3)).toBe(true);
    expect(canCheckOutOverdue(['sales_staff', 'housekeeping'], 1)).toBe(false);
  });

  it('H-04: MGR over the cap → 403 with ONLY requiredRole = owner and nightsNotBilled', () => {
    const e = refusal(['manager'], 2);
    expect(e.code).toBe('FORBIDDEN_ACTION');
    expect(e.status).toBe(403);
    expect(e.options.auditReason).toBe(OVERDUE_CHECKOUT_DENIED);
    const body = e.toBody('req-1');
    const { type, title, status, code, requestId, ...ext } = body as Record<string, unknown>;
    expect({ type, title, status, code, requestId }).toEqual({
      type: '/problems/forbidden-action',
      title: 'Forbidden action',
      status: 403,
      code: 'FORBIDDEN_ACTION',
      requestId: 'req-1',
    });
    expect(ext).toEqual({ requiredRole: 'owner', nightsNotBilled: 2 });
  });

  it('H-01/H-02: FD/FDL → 403 without any extension member (no detail, no errors)', () => {
    for (const roles of [['front_desk'], ['front_desk_lead'], ['front_desk', 'front_desk_lead']]) {
      const e = refusal(roles, 1);
      expect(e.code).toBe('FORBIDDEN_ACTION');
      expect(e.options.auditReason).toBe(OVERDUE_CHECKOUT_DENIED);
      expect(Object.keys(e.toBody()).sort()).toEqual(['code', 'status', 'title', 'type']);
    }
  });

  it('OWN, and MGR within the cap, pass the gate', () => {
    expect(() => assertOverdueCheckoutRole(['owner'], 9)).not.toThrow();
    expect(() => assertOverdueCheckoutRole(['manager'], 1)).not.toThrow();
  });
});

describe('V5-15 allowedActions check_out + overdue (T15-7, T15-15; BE C0313-09)', () => {
  const OWN = ['owner'];
  const MGR = ['manager'];
  const FDL = ['front_desk_lead'];
  const FD = ['front_desk'];
  const ctx = (today: string, over: Partial<ActionContext> = {}): ActionContext => ({
    status: 'in_house',
    conflictState: 'none',
    channelGroup: 'direct',
    arrivalDate: '2026-11-08',
    departureDate: '2026-11-10',
    stayDepartureDate: '2026-11-10',
    today,
    calendarDate: today,
    holdExpired: false,
    holdExtendedCount: 0,
    own: false,
    noShowMarkable: false,
    restoreWithinRules: true,
    rescheduleCount: 0,
    rescheduleMaxTimes: 1,
    ...over,
  });
  const co = (roles: string[], c: ActionContext) =>
    allowedActions(roles, c).filter((a) => a.event === 'check_out');
  const overdueAction = {
    event: 'check_out',
    transition: 'B18',
    action: 'check-out',
    overdue: true,
  };

  it('one night past: OWN and MGR get check_out + overdue, FDL/FD nothing; several roles = union', () => {
    const c = ctx('2026-11-11');
    expect(co(OWN, c)).toEqual([overdueAction]);
    expect(co(MGR, c)).toEqual([overdueAction]);
    expect(co(FDL, c)).toEqual([]);
    expect(co(FD, c)).toEqual([]);
    expect(co(['front_desk', 'manager'], c)).toEqual([overdueAction]);
  });

  it('two nights past: OWN only (MGR over the cap); the departure day itself never carries overdue', () => {
    expect(co(OWN, ctx('2026-11-12'))).toEqual([overdueAction]);
    expect(co(MGR, ctx('2026-11-12'))).toEqual([]);
    for (const roles of [OWN, MGR, FDL, FD]) {
      expect(co(roles, ctx('2026-11-10'))).toEqual([
        { event: 'check_out', transition: 'B18', action: 'check-out' },
      ]);
    }
    // 05:00 on 12/11: business date 11/11 – one night, MGR may (DOM 7.1 example)
    expect(co(MGR, ctx('2026-11-11', { calendarDate: '2026-11-12' }))).toEqual([overdueAction]);
  });

  it('T15-15: a primary with an extension child in force – on the primary departure (calendar date) no check_out, no overdue', () => {
    const c = ctx('2026-11-10', { stayDepartureDate: '2026-11-12' });
    for (const roles of [OWN, MGR, FDL, FD]) expect(co(roles, c)).toEqual([]);
    // the night after the primary's departure, still before the child's: nothing either
    expect(co(OWN, ctx('2026-11-11', { stayDepartureDate: '2026-11-12' }))).toEqual([]);
    // past the effective departure: counted from the child's departure
    expect(co(MGR, ctx('2026-11-13', { stayDepartureDate: '2026-11-12' }))).toEqual([
      overdueAction,
    ]);
    // a child booking (no stayDepartureDate): never
    expect(co(OWN, ctx('2026-11-11', { stayDepartureDate: undefined }))).toEqual([]);
  });

  it('the "Hôm nay" row offers the same check_out (and overdue) as Reservation.allowedActions', () => {
    for (const roles of [OWN, MGR, FDL, FD, ['housekeeping'], ['sales_staff']]) {
      for (const today of ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']) {
        for (const calendarDate of [today, addOne(today)]) {
          const c = ctx(today, { calendarDate });
          expect(
            checkOutAction(roles, {
              status: 'in_house',
              departureDate: '2026-11-10',
              today,
              calendarDate,
            }),
            `${roles.join('+')} ${today} ${calendarDate}`,
          ).toEqual(co(roles, c));
        }
      }
    }
  });
});

describe('FB-R5-ARC-BE-A2-01 – fridge.ts countInWindow (B18 blocker and MinibarStandard.latestCheck)', () => {
  it('no window = K11-09: only a count of today', () => {
    expect(countInWindow('2029-01-15', '2029-01-15')).toBe(true);
    expect(countInWindow('2029-01-14', '2029-01-15')).toBe(false);
    expect(countInWindow('', '2029-01-15')).toBe(false);
  });
  it('countFrom (overdue stay) = any business day from the effective departure on, never before', () => {
    const w = { countFrom: '2029-01-10' };
    expect(countInWindow('2029-01-10', '2029-01-12', w)).toBe(true);
    expect(countInWindow('2029-01-12', '2029-01-12', w)).toBe(true);
    expect(countInWindow('2029-01-09', '2029-01-12', w)).toBe(false);
  });
});

function addOne(d: string): string {
  return new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}
