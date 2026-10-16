/**
 * BE-B Sprint 3 pure rules (no DB): VietQR payload (EMVCo + CRC-16/CCITT-FALSE, SEC F1/F2), transfer content
 * (BR-521), receiving account input + masking (SEC F3), folio totals with credit and refunds (A-34),
 * printable bill lines (G-12, BR-434), recorder role snapshot (A-40), reconciliation waiting flags (oracle
 * BR-527-01), secret fields of the idempotency hash (accountNo).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { billLines } from '../src/modules/folio/internal/bill.service';
import {
  type FolioLineRow,
  computeTotals,
  refundedOf,
} from '../src/modules/folio/public/folio.service';
import { PaymentsService } from '../src/modules/payments/internal/payments.service';
import {
  buildVietQrPayload,
  crc16Ccitt,
  maskAccount,
  transferContentOf,
} from '../src/modules/payments/internal/vietqr';
import { isDesk, primaryRole } from '../src/modules/payments/public/payment.service';
import {
  maskReceivingAccount,
  maskedAccountNo,
  parseReceivingAccount,
} from '../src/modules/platform/public/receiving-account';
import { ProblemError } from '../src/shared/problem';
import { withoutSecrets } from '../src/shared/secret-fields';

const BR = JSON.parse(
  readFileSync(join(__dirname, '../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  examples: Array<{
    id: string;
    input: Record<string, unknown>;
    expected: Record<string, unknown>;
    params?: Record<string, unknown>;
  }>;
};
const oracle = (id: string) => BR.examples.find((e) => e.id === id)!;

function fieldCodes(fn: () => unknown): string[] {
  try {
    fn();
  } catch (e) {
    if (e instanceof ProblemError) {
      return (e.options.errors ?? []).map((x) => `${x.field}:${x.code}`);
    }
    throw e;
  }
  return [];
}

describe('VietQR (US-120, BR-521, SEC F1/F2)', () => {
  it('CRC-16/CCITT-FALSE check value ("123456789" → 29B1)', () => {
    expect(crc16Ccitt('123456789')).toBe('29B1');
  });

  it('payload: dynamic QR, NAPAS AID, BIN + account, 704, amount, VN, purpose = code; CRC closes it', () => {
    const p = buildVietQrPayload({
      bankBin: '970407',
      accountNo: '1903123456789',
      amountVnd: 1_660_000,
      transferContent: 'OTM00171',
    });
    expect(p.startsWith('000201010212')).toBe(true);
    expect(p).toContain('38570010A00000072701270006970407011319031234567890208QRIBFTTA');
    expect(p).toContain('5303704');
    expect(p).toContain('54071660000');
    expect(p).toContain('5802VN');
    expect(p).toContain('62120808OTM00171');
    expect(p).toMatch(/6304[0-9A-F]{4}$/);
    expect(p.slice(-4)).toBe(crc16Ccitt(p.slice(0, -4)));
  });

  it('refuses amounts/content the server did not compute (no names, no free text)', () => {
    const base = {
      bankBin: '970407',
      accountNo: '1903123456789',
      amountVnd: 1,
      transferContent: 'OTM1',
    };
    expect(() => buildVietQrPayload({ ...base, amountVnd: 0 })).toThrow();
    expect(() => buildVietQrPayload({ ...base, amountVnd: 1.5 })).toThrow();
    expect(() => buildVietQrPayload({ ...base, transferContent: 'Nguyen Van A' })).toThrow();
    expect(() => buildVietQrPayload({ ...base, bankBin: '97040' })).toThrow();
  });

  it('BR-521: content = booking code / bill number without dashes', () => {
    expect(transferContentOf('OTM-00171')).toBe('OTM00171');
    expect(transferContentOf('F26-000123')).toBe('F26000123');
    expect(maskAccount('970407', '1903123456789')).toBe('9704••••6789');
  });
});

describe('receiving account (SEC F3)', () => {
  it('owner input: BIN 6 digits, account 6–19 digits, NAPAS name upper case; unknown keys refused', () => {
    expect(
      parseReceivingAccount({
        bankBin: '970407',
        accountNo: '1903 1234 5678',
        accountName: 'OTTIMO',
      }),
    ).toEqual({
      bankBin: '970407',
      accountNo: '190312345678',
      accountName: 'OTTIMO',
    });
    expect(
      fieldCodes(() =>
        parseReceivingAccount({ bankBin: '97', accountNo: 'x', accountName: 'ottimo', extra: 1 }),
      ),
    ).toEqual([
      'value.bankBin:VALIDATION_FAILED',
      'value.accountNo:VALIDATION_FAILED',
      'value.accountName:VALIDATION_FAILED',
      'value.extra:NOT_IN_LIST',
    ]);
    expect(fieldCodes(() => parseReceivingAccount({}))).toEqual([
      'value.bankBin:REQUIRED',
      'value.accountNo:REQUIRED',
      'value.accountName:REQUIRED',
    ]);
  });

  it('listings never carry the full number', () => {
    const v = { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO' };
    expect(maskedAccountNo(v)).toBe('9704••••6789');
    expect(JSON.stringify(maskReceivingAccount(v))).not.toContain('1903123456789');
    // The idempotency request hash and the log redactor never see it either.
    expect(JSON.stringify(withoutSecrets({ value: v, reauth: { secret: 'x' } }))).not.toContain(
      '1903123456789',
    );
    expect(
      JSON.stringify(withoutSecrets({ method: 'bank_transfer', accountNo: '0071000123457' })),
    ).not.toContain('0071000123457');
  });
});

describe('folio totals with credit and refunds (0.3.6 A-34)', () => {
  const line = (amount: number, extra: Partial<FolioLineRow> = {}) => ({
    category: 'room' as const,
    revenue_group: 'room' as const,
    amount_vnd: amount,
    line_state: 'posted' as const,
    ...extra,
  });
  it('overpayment → creditVnd, never a negative balance; refunds reduce the credit; reversal pairs ignored', () => {
    const t = computeTotals(
      [line(1_000_000)],
      [
        { type: 'charge', method: 'cash', amount_vnd: 1_350_000, status: 'succeeded' },
        { type: 'charge', method: 'cash', amount_vnd: 500_000, status: 'reversed' },
        {
          type: 'charge',
          method: 'cash',
          amount_vnd: -500_000,
          status: 'succeeded',
          reversal_of_id: 'x',
        },
      ],
    );
    expect(t).toMatchObject({ paidVnd: 1_350_000, balanceDueVnd: 0, creditVnd: 350_000 });
    // BR-522-01: 350.000 paid back in cash → balance 0.
    const payments = [
      { type: 'charge', method: 'cash', amount_vnd: 1_350_000, status: 'succeeded' },
      { type: 'refund', method: 'cash', amount_vnd: -350_000, status: 'succeeded' },
    ];
    const after = computeTotals([line(1_000_000)], payments);
    expect(after).toMatchObject({
      balanceDueVnd: (oracle('BR-522-01').expected as { balanceAfterVnd: number }).balanceAfterVnd,
      creditVnd: 0,
    });
    expect(refundedOf(payments)).toBe(350_000);
  });
});

describe('bill lines (G-12, BR-434)', () => {
  const at = (n: number) => new Date(Date.UTC(2026, 9, 20, n));
  const l = (id: string, extra: Partial<FolioLineRow>): FolioLineRow =>
    ({
      id,
      folio_id: 'f',
      reservation_id: 'r',
      category: 'room',
      revenue_group: 'room',
      description: id,
      service_date: '2026-10-20',
      quantity: '1',
      unit_price_vnd: 0,
      amount_vnd: 0,
      vat_rate_pct: null,
      line_state: 'posted',
      related_line_id: null,
      reversal_of_id: null,
      approval_request_id: null,
      stay_night_id: null,
      posted_at: at(1),
      posted_by: null,
      posted_by_name: null,
      ...extra,
    }) as FolioLineRow;

  it('a reversed line and its reversal are left out; FOC right under its line; pending not printed', () => {
    const o = oracle('BR-434-01');
    const late = l('late', {
      category: 'late_checkout',
      revenue_group: 'other',
      amount_vnd: 210_000,
      service_date: '2026-10-21',
    });
    const lines = [
      l('n2', { service_date: '2026-10-21', amount_vnd: 820_000 }),
      late,
      l('n1', { amount_vnd: 820_000 }),
      l('svc', {
        category: 'service_fee',
        revenue_group: 'other',
        amount_vnd: 300_000,
        posted_at: at(2),
      }),
      l('svc-rev', {
        category: 'service_fee',
        revenue_group: 'other',
        amount_vnd: -300_000,
        reversal_of_id: 'svc',
        posted_at: at(3),
      }),
      l('svc2', {
        category: 'service_fee',
        revenue_group: 'other',
        amount_vnd: 250_000,
        posted_at: at(3),
      }),
      l('foc', {
        category: 'foc',
        revenue_group: 'other',
        amount_vnd: -210_000,
        related_line_id: 'late',
        posted_at: at(4),
        service_date: '2026-10-21',
      }),
      l('pending', {
        category: 'damage',
        revenue_group: 'other',
        amount_vnd: 400_000,
        line_state: 'pending_approval',
      }),
    ];
    const out = billLines(lines).map((x) => x.id);
    expect(out).toEqual(['n1', 'svc2', 'late', 'foc', 'n2']);
    const net = billLines(lines)
      .filter((x) => x.id === 'late' || x.id === 'foc')
      .reduce((a, x) => a + x.amount_vnd, 0);
    expect(net).toBe((o.expected as { netVnd: number }).netVnd);
  });
});

describe('roles and reconciliation flags', () => {
  it('A-40 recorder role snapshot = highest role in the property; desk roles', () => {
    expect(primaryRole(['front_desk', 'sales_staff'])).toBe('front_desk');
    expect(primaryRole(['collaborator'])).toBe('collaborator');
    expect(isDesk(['sales_staff'])).toBe(false);
    expect(isDesk(['front_desk_lead'])).toBe(true);
  });

  it('oracle BR-527-01: "Cần chú ý" after bank_reconcile_alert_days × 24 h, pending business days', () => {
    const o = oracle('BR-527-01');
    const recordedAt = new Date(String(o.input.recordedAt));
    const attentionAt = new Date(String(o.expected.attentionAt));
    const ctx = (now: Date) => ({
      tz: 'Asia/Ho_Chi_Minh',
      now,
      alertDays: (o.params as { bank_reconcile_alert_days: number }).bank_reconcile_alert_days,
      rollover: '06:00',
    });
    const p = { reconciliation: 'pending', received_at: recordedAt };
    expect(PaymentsService.waiting(p, ctx(new Date(attentionAt.getTime() - 60_000)))).toMatchObject(
      {
        reconcileOverdue: false,
      },
    );
    expect(PaymentsService.waiting(p, ctx(attentionAt))).toEqual({
      pendingDays: 2,
      reconcileOverdue: true,
    });
    expect(
      PaymentsService.waiting(
        { reconciliation: 'reconciled', received_at: recordedAt },
        ctx(attentionAt),
      ),
    ).toEqual({
      reconcileOverdue: false,
    });
  });
});
