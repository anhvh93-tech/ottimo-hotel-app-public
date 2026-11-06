/**
 * V5-48 (Round 5, v1.0.5) – units without a database:
 * - BE C0313-22 ý 3 / SEC-responses 1.2: the audit allowlists keep `afterClosure` + `reservationStatus` (`payment`) and
 *   `afterClosure` (`deposit_notice`) – a key missing there is dropped silently (SR-AUD-03) and afterClosureOnly
 *   would answer an empty list while the API tests stay green;
 * - the closed statuses (`cancelled`, `no_show`) and nothing else.
 */
import { describe, expect, it } from 'vitest';
import { auditFieldsOf, pickAuditFields } from '../src/modules/audit/public/audit-fields';
import { AFTER_CLOSURE_ACTIONS } from '../src/modules/audit/internal/audit-log.controller';
import '../src/modules/payments/audit-entities';
import { closedStatusOf } from '../src/modules/payments/public/payment.service';

describe('V5-48 units', () => {
  it('payment / deposit_notice allowlists keep the after-closure keys', () => {
    expect([...(auditFieldsOf('payment') ?? [])]).toEqual(
      expect.arrayContaining(['afterClosure', 'reservationStatus']),
    );
    expect([...(auditFieldsOf('deposit_notice') ?? [])]).toEqual(
      expect.arrayContaining(['afterClosure']),
    );
    expect(
      pickAuditFields('payment', {
        code: 'PT-000001',
        afterClosure: true,
        reservationStatus: 'no_show',
        guestName: 'never logged',
      }),
    ).toEqual({ code: 'PT-000001', afterClosure: true, reservationStatus: 'no_show' });
    expect(pickAuditFields('deposit_notice', { amountVnd: 1, afterClosure: true })).toEqual({
      amountVnd: 1,
      afterClosure: true,
    });
  });

  it('afterClosureOnly reads the receipt and notice actions', () => {
    expect(AFTER_CLOSURE_ACTIONS).toEqual(
      expect.arrayContaining(['payment.recorded', 'deposit_notice.created']),
    );
  });

  it('closed statuses are cancelled and no_show only', () => {
    expect(closedStatusOf('cancelled')).toBe('cancelled');
    expect(closedStatusOf('no_show')).toBe('no_show');
    for (const s of ['hold', 'confirmed', 'in_house', 'checked_out', 'void', '']) {
      expect(closedStatusOf(s), s).toBeNull();
    }
  });
});
