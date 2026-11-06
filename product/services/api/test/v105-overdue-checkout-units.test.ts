/**
 * V5-15 (OpenAPI 0.3.13 bổ sung 1/1d, contract 1.4 + 1.18, DOM rules-v1.0.5 7.1 (a)) – the pure rules of the overdue
 * check-out: overdue, `nightsNotBilled` (business day at the click − effective departure), the role gate (OWN always,
 * MGR ≤ 1 night, FDL/FD never; union of roles) and the exact 403 bodies (H-01, H-02, H-04). No database.
 */
import { describe, expect, it } from 'vitest';
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
