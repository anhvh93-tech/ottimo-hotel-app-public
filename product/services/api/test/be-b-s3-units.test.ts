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
  focDateMap,
  moneyPosition,
  refundedOf,
} from '../src/modules/folio/public/folio.service';
import { lineLabel, roomResolver } from '../src/modules/folio/public/line-labels';
import { PaymentsService } from '../src/modules/payments/internal/payments.service';
import {
  buildVietQrPayload,
  crc16Ccitt,
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
import { addDays } from '../src/shared/time';

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
    // ARC-BE-S3-29: one mask format (contract `9704••••1234`).
    expect(maskedAccountNo({ bankBin: '970407', accountNo: '1903123456789' })).toBe('9704••••6789');
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

describe('money position – review S3 (DOM BE-13/14, ARC 13, E15-05)', () => {
  const ln = (
    id: string,
    category: string,
    amount: number,
    extra: Record<string, unknown> = {},
  ) => ({
    id,
    category: category as FolioLineRow['category'],
    revenue_group: (category === 'room' ? 'room' : 'other') as FolioLineRow['revenue_group'],
    amount_vnd: amount,
    line_state: 'posted' as const,
    reservation_id: 'r1',
    related_line_id: null as string | null,
    ...extra,
  });
  it('ota_collect pays only the OTA-covered charges: Agoda 2 nights 1.800.000 + minibar 70.000 → 70.000 due, no credit', () => {
    const m = moneyPosition(
      [ln('n1', 'room', 900_000), ln('n2', 'room', 900_000), ln('mb', 'minibar', 70_000)],
      [
        {
          type: 'charge',
          method: 'ota_collect',
          amount_vnd: 1_800_000,
          status: 'succeeded',
          reservation_id: 'r1',
        },
      ],
    );
    expect(m).toMatchObject({
      paidOtaVnd: 1_800_000,
      otaCoveredVnd: 1_800_000,
      otaExcessVnd: 0,
      balanceDueVnd: 70_000,
      creditVnd: 0,
    });
  });
  it('OTA money above the covered charges is OTA excess – never OTTIMO credit, never pays desk charges', () => {
    // A night reversed (B16) before the system receipt was adjusted: OTA holds 900.000 too much.
    const m = moneyPosition(
      [
        ln('n1', 'room', 900_000),
        ln('n2', 'room', 900_000),
        ln('n2r', 'room', -900_000, { reversal_of_id: 'n2' }),
        ln('mb', 'minibar', 70_000),
      ],
      [
        {
          type: 'charge',
          method: 'ota_collect',
          amount_vnd: 1_800_000,
          status: 'succeeded',
          reservation_id: 'r1',
        },
      ],
    );
    // DOM 17/10 (BR-307): covered = the OTA room lines before any FOC (none allowed on an OTA prepaid night).
    expect(m).toMatchObject({ otaCoveredVnd: 900_000, otaExcessVnd: 900_000 });
    expect(m).toMatchObject({ balanceDueVnd: 70_000, creditVnd: 0 });
  });
  it('payable credit: pending transfers count for nothing, a short cash handover for what arrived', () => {
    const m = moneyPosition(
      [ln('n1', 'room', 1_000_000)],
      [
        {
          id: 'p1',
          code: 'PT-1',
          type: 'deposit',
          method: 'cash',
          amount_vnd: 600_000,
          status: 'succeeded',
          reconciliation: 'disputed',
          received_amount_vnd: 400_000,
        },
        {
          id: 'p2',
          code: 'PT-2',
          type: 'charge',
          method: 'bank_transfer',
          amount_vnd: 700_000,
          status: 'succeeded',
          reconciliation: 'pending',
        },
      ],
    );
    expect(m).toMatchObject({
      creditVnd: 300_000,
      payableCreditVnd: 0,
      unsettledPaymentIds: ['p1', 'p2'],
      unsettledPaymentCodes: ['PT-1', 'PT-2'],
    });
    const totals = computeTotals(
      [ln('n1', 'room', 1_000_000)],
      [{ type: 'charge', method: 'cash', amount_vnd: 1_300_000, status: 'succeeded' }],
      300_000,
    );
    expect(totals).toMatchObject({ creditVnd: 300_000, unhandledCreditVnd: 0, otaExcessVnd: 0 });
  });
});

describe('bill line labels (DOM BE-21) – keys and params, never a technical code', () => {
  const src = (category: string, description: string, extra: Record<string, unknown> = {}) => ({
    category,
    description,
    service_date: '2026-10-21',
    quantity: '1',
    ...extra,
  });
  it('maps every system description to bill.line.* with its params', () => {
    const roomOn = roomResolver([
      { roomNo: '203', fromDate: '2026-10-20', toDate: '2026-10-22' },
      { roomNo: '401', fromDate: '2026-10-22', toDate: '2026-10-25' },
    ]);
    expect(lineLabel(src('room', 'room_night'), { roomOn })).toEqual({
      labelKey: 'bill.line.room_night',
      labelParams: { date: '2026-10-21', room: '203' },
    });
    expect(
      lineLabel(src('room', 'extra_night', { charge_code: 'extra_night' }), { roomOn }),
    ).toEqual({
      labelKey: 'bill.line.extra_night',
      labelParams: { date: '2026-10-21', room: '203' },
    });
    expect(lineLabel(src('late_checkout', 'late_checkout 13:00 30%'))).toEqual({
      labelKey: 'bill.line.late_checkout',
      labelParams: { time: '13:00', pct: 30 },
    });
    expect(lineLabel(src('extra_person', 'extra_guest x2'))).toEqual({
      labelKey: 'bill.line.extra_person',
      labelParams: { date: '2026-10-21', count: 2 },
    });
    expect(lineLabel(src('deposit_forfeit', 'retain_with_guest_consent'))).toEqual({
      labelKey: 'bill.line.overpayment_retained',
    });
    expect(lineLabel(src('room_change_difference', 'room_change 203->401'))).toEqual({
      labelKey: 'bill.line.room_change',
      labelParams: { from: '203', to: '401' },
    });
    // Stored params win, but the quantity always follows the line (an adjusted minibar line).
    expect(
      lineLabel(src('minibar', 'Bia', { quantity: '1', label_params: { item: 'Bia', qty: 2 } })),
    ).toEqual({ labelKey: 'bill.line.minibar', labelParams: { item: 'Bia', qty: 1 } });
    expect(lineLabel(src('penalty', 'x', { charge_code: 'key_card_fee', quantity: '2' }))).toEqual({
      labelKey: 'bill.line.key_card_fee',
      labelParams: { qty: 2 },
    });
    expect(lineLabel(src('adjustment', 'anything')).labelKey).toBe('bill.line.adjustment');
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

describe('FOC when the nights change – by date (BR-434, DOM 17/10 S4-14)', () => {
  type Range = { arrivalDate: string; departureDate: string };
  const datesOf = (r: Range) => {
    const out: string[] = [];
    for (let d = r.arrivalDate; d < r.departureDate; d = addDays(d, 1)) out.push(d);
    return out;
  };
  for (const id of ['BR-434-02', 'BR-434-03', 'BR-434-04', 'BR-434-05']) {
    it(`${id} – kept dates keep their FOC, dropped[i] → added[i], no counterpart → cancelled`, () => {
      const o = oracle(id);
      const input = o.input as {
        from: Range;
        to: Range;
        nightRatesVnd: Record<string, number>;
        focApprovedByDateVnd: Record<string, number>;
      };
      const expected = o.expected as {
        keptDates: string[];
        droppedDates: string[];
        addedDates: string[];
        focByDateVnd: Record<string, number>;
        roomPayableVnd: number;
      };
      const before = datesOf(input.from);
      const after = datesOf(input.to);
      const map = focDateMap(before, after);
      expect(before.filter((d) => map.get(d) === d)).toEqual(expected.keptDates);
      expect(before.filter((d) => !after.includes(d))).toEqual(expected.droppedDates);
      expect(after.filter((d) => !before.includes(d))).toEqual(expected.addedDates);
      const focByDate: Record<string, number> = {};
      for (const [d, foc] of Object.entries(input.focApprovedByDateVnd)) {
        const to = map.get(d);
        if (to !== undefined) focByDate[to] = Math.min(foc, input.nightRatesVnd[to] as number);
      }
      expect(focByDate).toEqual(expected.focByDateVnd);
      const rooms = after.reduce((a, d) => a + (input.nightRatesVnd[d] as number), 0);
      const focs = Object.values(focByDate).reduce((a, v) => a + v, 0);
      expect(rooms - focs).toBe(expected.roomPayableVnd);
    });
  }

  it('same dates (room change) map every date to itself; a stay made longer adds nothing to carry', () => {
    const d = ['2026-11-23', '2026-11-24'];
    expect([...focDateMap(d, d)]).toEqual([
      ['2026-11-23', '2026-11-23'],
      ['2026-11-24', '2026-11-24'],
    ]);
    expect([...focDateMap(d, [...d, '2026-11-25'])]).toEqual([
      ['2026-11-23', '2026-11-23'],
      ['2026-11-24', '2026-11-24'],
    ]);
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
