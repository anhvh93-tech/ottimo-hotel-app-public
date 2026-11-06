/**
 * PR-B3 (Round 5, v1.0.5, BE-D2) – the pure rules of 5B-1 (no DB): the `type` of a receipt after closure, the refund
 * amount max(0, amountVnd − N) (FB-R5-ARC-BE-105-03 step 6), the server-fixed refund destination (SEC S3), the bank
 * code as stored (SEC ARC-15), the weekly filter set and the audit allowlist of "Không thấy tiền" (SEC ARC-20).
 */
import { describe, expect, it } from 'vitest';
import '../src/audit-entities';
import { AFTER_CLOSURE_ACTIONS } from '../src/modules/audit/internal/audit-log.controller';
import { pickAuditFields } from '../src/modules/audit/public/audit-fields';
import { isMoneyAuditAction } from '../src/modules/audit/public/money-actions';
import {
  afterClosureRefundVnd,
  afterClosureType,
} from '../src/modules/payments/internal/payments.service';
import {
  PAYMENT_AFTER_CANCEL,
  serverFixedDestination,
} from '../src/modules/payments/internal/refunds.service';
import { normalizeBankReference } from '../src/modules/payments/public/payment.service';

describe('PR-B3 5B-1 rules', () => {
  it('type: deposit for a booking cancelled while a hold, charge for every other closed booking', () => {
    expect(afterClosureType('hold')).toBe('deposit');
    for (const s of ['confirmed', 'checked_in', null, undefined])
      expect(afterClosureType(s)).toBe('charge');
  });

  it('refund = max(0, amountVnd − N): N = 0 → everything, exactly N → none, a negative N counts as 0', () => {
    expect(afterClosureRefundVnd(300_000, 0)).toBe(300_000);
    expect(afterClosureRefundVnd(800_000, 500_000)).toBe(300_000);
    expect(afterClosureRefundVnd(500_000, 500_000)).toBe(0);
    expect(afterClosureRefundVnd(200_000, 500_000)).toBe(0);
    expect(afterClosureRefundVnd(100_000, -50_000)).toBe(100_000);
  });

  it('server-fixed destination: reason payment_after_cancel, or original_method that nobody set', () => {
    const base = {
      reason_code: 'overpayment',
      refund_method: null,
      refund_destination_set_by: null,
    };
    expect(serverFixedDestination({ ...base, reason_code: PAYMENT_AFTER_CANCEL })).toBe(true);
    expect(serverFixedDestination({ ...base, refund_method: 'original_method' })).toBe(true);
    expect(
      serverFixedDestination({
        ...base,
        refund_method: 'original_method',
        refund_destination_set_by: '00000000-0000-0000-0000-000000000001',
      }),
    ).toBe(false);
    expect(serverFixedDestination({ ...base, refund_method: 'cash' })).toBe(false);
    expect(serverFixedDestination(base)).toBe(false);
  });

  it('bankReference as stored and compared: trimmed, upper-case; blank → none', () => {
    expect(normalizeBankReference('  ft2611abc ')).toBe('FT2611ABC');
    expect(normalizeBankReference('Ft-26.11/ab_c')).toBe('FT-26.11/AB_C');
    expect(normalizeBankReference('   ')).toBeNull();
    expect(normalizeBankReference(null)).toBeNull();
    expect(normalizeBankReference(undefined)).toBeNull();
  });

  it('afterClosureOnly pins attention_event.resolved; it is a money action; its audit keeps kind + afterClosure only', () => {
    expect(AFTER_CLOSURE_ACTIONS).toEqual(
      expect.arrayContaining([
        'payment.recorded',
        'deposit_notice.created',
        'deposit_notice.updated',
        'attention_event.resolved',
      ]),
    );
    expect(isMoneyAuditAction('attention_event.resolved')).toBe(true);
    expect(
      pickAuditFields('attention_event', {
        kind: 'deposit_after_cancel',
        afterClosure: true,
        note: 'free text never kept',
      }),
    ).toEqual({ kind: 'deposit_after_cancel', afterClosure: true });
  });
});
