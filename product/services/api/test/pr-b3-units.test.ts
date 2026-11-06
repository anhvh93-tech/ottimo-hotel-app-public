/**
 * PR-B3 (Round 5, v1.0.5, BE-D2) – the pure rules of 5B-1 (no DB): the `type` of a receipt after closure, the refund
 * amount max(0, amountVnd − N) (FB-R5-ARC-BE-105-03 step 6), the server-fixed refund destination (SEC S3), the bank
 * code as stored (SEC ARC-15), the weekly filter set and the audit allowlist of "Không thấy tiền" (SEC ARC-20), the
 * one `PaymentCreate.bankReference` reader of every path (ARC 119-01, SEC 119-02).
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
import {
  checkPaymentShape,
  normalizeBankReference,
} from '../src/modules/payments/public/payment.service';
import { assertBankReferenceNotCardFirst, readBankReference } from '../src/shared/validation';

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

  it('readBankReference: blank = none; pattern → VALIDATION_FAILED; a card number → thrown 422 with the field, before the method; other methods → NOT_ALLOWED', () => {
    const F = 'payment.bankReference';
    expect(readBankReference(F, undefined, 'cash')).toEqual({ value: null, error: null });
    expect(readBankReference(F, null, 'cash')).toEqual({ value: null, error: null });
    expect(readBankReference(F, '   ', 'cash')).toEqual({ value: null, error: null });
    expect(readBankReference(F, 4111111111111111, 'bank_transfer')).toEqual({
      value: null,
      error: 'VALIDATION_FAILED',
    });
    expect(readBankReference(F, 'FT 2611', 'bank_transfer').error).toBe('VALIDATION_FAILED');
    expect(readBankReference(F, 'A'.repeat(65), 'vietqr').error).toBe('VALIDATION_FAILED');
    for (const method of ['bank_transfer', 'vietqr', 'cash'])
      expect(() => readBankReference(F, '4111-1111-1111-1111', method)).toThrow(
        expect.objectContaining({ code: 'CARD_NUMBER_DETECTED' }),
      );
    try {
      readBankReference(F, '4111111111111111/1228', 'bank_transfer');
      expect.unreachable();
    } catch (e) {
      expect(JSON.stringify(e)).not.toContain('4111111111111111');
      expect(e).toMatchObject({
        options: { errors: [{ field: F, code: 'CARD_NUMBER_DETECTED' }] },
      });
    }
    for (const method of ['cash', 'card_pos', 'ota_collect', undefined])
      expect(readBankReference(F, 'FT2611ABC', method)).toEqual({
        value: null,
        error: 'NOT_ALLOWED',
      });
    expect(readBankReference(F, '  ft2611abc ', 'vietqr')).toEqual({
      value: 'ft2611abc',
      error: null,
    });
    expect(readBankReference(F, '41111111111111111228', 'bank_transfer').value).toBe(
      '41111111111111111228',
    );
  });

  it('checkPaymentShape returns the code with its prefix rules (checkOut.finalPayment, checkIn.payment use it)', () => {
    const base = { type: 'charge', method: 'bank_transfer', amountVnd: 10_000 };
    expect(checkPaymentShape({ ...base, bankReference: ' ft1 ' }, {}).bankReference).toBe('ft1');
    expect(
      checkPaymentShape(
        { ...base, method: 'cash', bankReference: 'FT1' },
        { fieldPrefix: 'finalPayment.' },
      ).errors,
    ).toEqual([{ field: 'finalPayment.bankReference', code: 'NOT_ALLOWED' }]);
    expect(() =>
      checkPaymentShape(
        { ...base, bankReference: '4111111111111111' },
        { fieldPrefix: 'payment.' },
      ),
    ).toThrow(expect.objectContaining({ code: 'CARD_NUMBER_DETECTED' }));
  });

  it('1i (C0313-31 B): the early card check reads the raw body – a card number throws with the right field; anything else is left to the reader', () => {
    const card = '4111-1111-1111-1111';
    const field = (body: unknown, at: string | null) => {
      try {
        assertBankReferenceNotCardFirst(body, at);
        return null;
      } catch (e) {
        return (e as { options: { errors: Array<{ field: string }> } }).options.errors[0]!.field;
      }
    };
    expect(field({ bankReference: card, amountVnd: 'x' }, null)).toBe('bankReference');
    expect(field({ payment: { bankReference: ` ${card} `, method: 'cash' } }, 'payment')).toBe(
      'payment.bankReference',
    );
    expect(field({ initialPayment: { bankReference: card } }, 'initialPayment')).toBe(
      'initialPayment.bankReference',
    );
    for (const [body, at] of [
      [{ bankReference: 'FT2611ABC' }, null],
      [{ bankReference: '4111 1111 1111 1111' }, null], // fails the pattern → the reader answers VALIDATION_FAILED
      [{ bankReference: 4111111111111111 }, null],
      [{ payment: 'x' }, 'payment'],
      [null, 'finalPayment'],
      [[card], null],
    ] as const)
      expect(field(body, at)).toBeNull();
  });
});
