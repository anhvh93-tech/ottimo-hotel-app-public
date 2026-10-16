/**
 * Pure rules of the BE-B Sprint 2 code: allocation (Σ parts = total – coding-standards 4.4, property based),
 * folio totals, quote validity (BR-304 oracle), commission % (BR-903 oracle), reconciliation flag (BR-527),
 * deposit payment field rules (BA EP02 10.6), quote copy generated from UXD strings.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allocate } from '../src/modules/folio/public/allocate';
import {
  commissionPctFor,
  computeTotals,
  payeeTypeOf,
  revenueGroupOf,
} from '../src/modules/folio/public/folio.service';
import { depositPayment } from '../src/modules/payments/internal/deposits.controller';
import { reconciliationFor } from '../src/modules/payments/public/payment.service';
import { applyPct } from '../src/modules/reservations/public/pricing';
import { effectiveStatus, quoteExpiry } from '../src/modules/sales/internal/quotes.service';
import { ProblemError } from '../src/shared/problem';

const oracle = JSON.parse(
  readFileSync(join(__dirname, '../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  examples: Array<{
    id: string;
    input: Record<string, unknown>;
    expected: Record<string, unknown>;
    params?: Record<string, unknown>;
  }>;
};
const ex = (id: string) => oracle.examples.find((e) => e.id === id)!;

/** Small deterministic PRNG (property tests without flakiness). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('allocate (coding-standards 4.4)', () => {
  it('Σ parts = total for 2.000 random cases, parts ≥ 0, proportional within 1 VND except the last', () => {
    const r = rng(42);
    for (let k = 0; k < 2000; k++) {
      const n = 1 + Math.floor(r() * 30);
      const weights = Array.from({ length: n }, () => Math.floor(r() * 3_000_000));
      const total = Math.floor(r() * 50_000_000);
      const parts = allocate(total, weights);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      const sum = weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < n - 1; i++) {
        expect(parts[i]).toBeGreaterThanOrEqual(0);
        if (sum > 0)
          expect(
            Math.abs((parts[i] as number) - (total * (weights[i] as number)) / sum),
          ).toBeLessThan(1);
      }
    }
  });

  it('commission 416.400 over the 7 nights of BR-107-01: remainder on the last night', () => {
    const nights = [713000, 713000, 713000, 713000, 820000, 820000, 713000];
    const parts = allocate(416_400, nights);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(416_400);
    expect(parts.slice(0, 4)).toEqual([57040, 57040, 57040, 57040]);
    expect(parts[4]).toBe(65600);
  });

  it('edge cases: zero weights → all on the last part, empty parts only for 0, unsafe input refused', () => {
    expect(allocate(1000, [0, 0, 0])).toEqual([0, 0, 1000]);
    expect(allocate(0, [])).toEqual([]);
    expect(() => allocate(5, [])).toThrow(RangeError);
    expect(() => allocate(1.5, [1])).toThrow(RangeError);
    expect(() => allocate(10, [-1, 2])).toThrow(RangeError);
  });
});

describe('folio totals (erd 4.6: computed, never stored)', () => {
  it('room / other / FOC / paid / deposit held / balance', () => {
    const t = computeTotals(
      [
        { category: 'room', revenue_group: 'room', amount_vnd: 713_000, line_state: 'posted' },
        {
          category: 'extra_person',
          revenue_group: 'other',
          amount_vnd: 150_000,
          line_state: 'posted',
        },
        { category: 'foc', revenue_group: 'other', amount_vnd: -150_000, line_state: 'posted' },
        {
          category: 'foc',
          revenue_group: 'room',
          amount_vnd: -100_000,
          line_state: 'pending_approval',
        },
        { category: 'discount', revenue_group: 'room', amount_vnd: -1, line_state: 'rejected' },
      ],
      [
        { type: 'deposit', method: 'bank_transfer', amount_vnd: 300_000, status: 'succeeded' },
        { type: 'charge', method: 'ota_collect', amount_vnd: 100_000, status: 'succeeded' },
        { type: 'deposit', method: 'vietqr', amount_vnd: 999, status: 'pending' },
        { type: 'security_deposit', method: 'cash', amount_vnd: 5_000_000, status: 'succeeded' },
      ],
    );
    expect(t).toEqual({
      roomVnd: 713_000,
      otherVnd: 150_000,
      focVnd: 150_000,
      totalVnd: 713_000,
      paidVnd: 400_000,
      paidViaOtaVnd: 100_000,
      depositHeldVnd: 300_000,
      balanceDueVnd: 313_000,
      creditVnd: 0,
      unhandledCreditVnd: 0,
      otaExcessVnd: 0,
    });
  });

  it('revenue groups (BR-904): only room nights are room revenue', () => {
    expect(revenueGroupOf('room')).toBe('room');
    for (const c of [
      'extra_person',
      'late_checkout',
      'minibar',
      'penalty',
      'cancellation_fee',
    ] as const) {
      expect(revenueGroupOf(c)).toBe('other');
    }
  });
});

describe('commissions (BR-903, SM-11)', () => {
  it('BR-903-01 oracle: CTV 8 % of 5.205.000 = 416.400', () => {
    const e = ex('BR-903-01');
    const pct = commissionPctFor(
      e.params?.short_stay_commission_pct,
      payeeTypeOf(['collaborator'])!,
    );
    expect(applyPct(e.input.roomTotalVnd as number, pct!, 1)).toBe(e.expected.commissionVnd);
  });

  it('BR-903-02 oracle (v0.3.2): sale 3 % of 5.205.000 kept to the đồng = 156.150', () => {
    const e = ex('BR-903-02');
    const pct = commissionPctFor(
      e.params?.short_stay_commission_pct,
      payeeTypeOf(['sales_staff'])!,
    );
    expect(applyPct(e.input.roomTotalVnd as number, pct!, 1)).toBe(e.expected.commissionVnd);
  });

  it('payee by role: CTV → agent, sale → staff, others → none; malformed table → null', () => {
    expect(payeeTypeOf(['collaborator'])).toBe('agent');
    expect(payeeTypeOf(['sales_staff'])).toBe('staff');
    expect(payeeTypeOf(['front_desk', 'manager'])).toBeNull();
    expect(commissionPctFor({ collaborator: 8, staff: 3 }, 'staff')).toBe(3);
    expect(commissionPctFor(null, 'agent')).toBeNull();
    expect(commissionPctFor({ collaborator: '8' }, 'agent')).toBeNull();
  });
});

describe('quotes (BR-304)', () => {
  const tz = 'Asia/Ho_Chi_Minh';
  it('BR-304-01 oracle: created 15/10 10:00 → expired from 00:00 19/10', () => {
    const e = ex('BR-304-01');
    const exp = quoteExpiry(new Date(String(e.input.quoteCreatedAt)), 3, tz);
    expect(exp.toISOString()).toBe(new Date(String(e.expected.expiredFrom)).toISOString());
  });

  it('BR-304-02 oracle (v0.3.2): created 01:30 15/10 (business day 14/10) still counts the calendar day 15/10', () => {
    const e = ex('BR-304-02');
    const exp = quoteExpiry(new Date(String(e.input.quoteCreatedAt)), 3, tz);
    expect(exp.toISOString()).toBe(new Date(String(e.expected.expiredFrom)).toISOString());
    const still = new Date(String(e.expected.stillValidAt));
    expect(effectiveStatus({ status: 'active', expires_at: exp }, still)).toBe('active');
  });

  it('created 23:30 local still counts its own calendar day; lazy status flips exactly at expiry', () => {
    const exp = quoteExpiry(new Date('2026-10-15T16:30:00.000Z'), 3, tz); // 23:30 15/10 VN
    expect(exp.toISOString()).toBe('2026-10-18T17:00:00.000Z');
    const row = { status: 'active' as const, expires_at: exp };
    expect(effectiveStatus(row, new Date(exp.getTime() - 1))).toBe('active');
    expect(effectiveStatus(row, exp)).toBe('expired');
    expect(
      effectiveStatus({ status: 'converted', expires_at: exp }, new Date(exp.getTime() + 1)),
    ).toBe('converted');
  });

  it('quote copy is generated from design/copy (stale → fail)', () => {
    expect(() =>
      execFileSync(
        process.execPath,
        [join(__dirname, '..', 'scripts', 'gen-quote-copy.mjs'), '--check'],
        {
          stdio: 'pipe',
        },
      ),
    ).not.toThrow();
  });
});

describe('deposit payment rules (BA EP02 10.6, BR-527)', () => {
  const fieldCodes = (fn: () => unknown): string[] => {
    try {
      fn();
    } catch (e) {
      if (e instanceof ProblemError)
        return (e.options.errors ?? []).map((x) => `${x.field}:${x.code}`);
      throw e;
    }
    return [];
  };

  it('reconciliation: manual transfer / VietQR pending, cash / POS / OTA not required', () => {
    expect(reconciliationFor('bank_transfer')).toBe('pending');
    expect(reconciliationFor('vietqr')).toBe('pending');
    expect(reconciliationFor('cash')).toBe('not_required');
    expect(reconciliationFor('card_pos')).toBe('not_required');
    expect(reconciliationFor('ota_collect')).toBe('not_required');
  });

  it('all field errors at once; POS code alphanumeric ≤ 12; receivedAt ISO with offset', () => {
    expect(
      fieldCodes(() =>
        depositPayment({ type: 'charge', method: 'momo', amountVnd: 0, receivedAt: 'hôm qua' }),
      ),
    ).toEqual([
      'payment.type:NOT_IN_LIST',
      'payment.method:NOT_IN_LIST',
      'payment.amountVnd:AMOUNT_NOT_POSITIVE',
      'payment.receivedAt:DATE_INVALID',
    ]);
    expect(
      fieldCodes(() =>
        depositPayment({ type: 'deposit', method: 'card_pos', amountVnd: 1, posAuthCode: 'AB-12' }),
      ),
    ).toEqual(['payment.posAuthCode:VALIDATION_FAILED']);
    const ok = depositPayment({
      type: 'deposit',
      method: 'bank_transfer',
      amountVnd: 1_500_000,
      receivedAt: '2026-10-15T10:12:00+07:00',
      note: ' CK Vietcombank ',
    });
    expect(ok).toEqual({
      attachmentId: null,
      method: 'bank_transfer',
      amountVnd: 1_500_000,
      receivedAt: new Date('2026-10-15T03:12:00.000Z'),
      posAuthCode: null,
      note: 'CK Vietcombank',
    });
  });
});
