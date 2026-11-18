/**
 * FB-INV-012 (contract mục 8 BE 1, 3, 4, 8) – pure functions of the monthly statement, with DOM's example numbers
 * (rounds/round-05/fb-inv-012/DOM-rules.md BR-LS-02/03/04/09/11/12) and INV 17/11 prices.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { divideRoundVnd } from '../src/modules/platform/public/money';
import {
  DEFAULT_RULES,
  contractRentVnd,
  fromScaled,
  overdueOf,
  rentFor,
  roundDownTotal,
  rulesIssue,
  shortGuestName,
  statementCode,
  statementPeriods,
  truncScaled,
  unitPriceIssue,
  usageScaled,
  utilityAmounts,
  vatRateIssue,
} from '../src/modules/billing/internal/statement-math';
import { windowOf } from '../src/modules/billing/internal/meter-readings.service';

describe('FB-INV-012 – consumption (criterion 1)', () => {
  it('normal: closing − opening', () => {
    expect(usageScaled('electricity', 1250, 1392, null)).toBe(142);
  });
  it('meter replaced on 15/11 (BR-LS-12): old 1.250 → 1.310, new 0 → 82 = 60 + 82 = 142 kWh', () => {
    expect(
      usageScaled('electricity', 1250, 82, {
        type: 'replaced',
        oldFinal: 1310,
        newStart: 0,
        replacedOn: '2026-11-15',
      }),
    ).toBe(142);
  });
  it('rollover: (max + 1 − opening) + closing', () => {
    expect(usageScaled('electricity', 99_990, 5, { type: 'rollover', maxValue: 99_999 })).toBe(15);
  });
  it('water: one decimal, the fraction DROPPED (38,67 → 38,6), 35,2 → 38,6 = 3,4 m³', () => {
    expect(truncScaled('water', 38.67)).toBe(386);
    expect(truncScaled('water', 38.6)).toBe(386);
    expect(truncScaled('electricity', 1392.9)).toBe(1392);
    const usage = usageScaled(
      'water',
      truncScaled('water', 35.2),
      truncScaled('water', 38.67),
      null,
    );
    expect(fromScaled('water', usage)).toBe(3.4);
  });
});

describe('FB-INV-012 – DOM numbers (criterion 3)', () => {
  it('electricity 142 × 4.000 + 8 % = 613.440 (net 568.000, VAT 45.440; unit incl. VAT 4.320)', () => {
    expect(utilityAmounts('electricity', 142, 4000, 8)).toEqual({
      quantity: 142,
      unitPriceNetVnd: 4000,
      unitPriceGrossVnd: 4320,
      netVnd: 568_000,
      vatVnd: 45_440,
      amountVnd: 613_440,
    });
  });
  it('water 3,4 × 25.000 + 5 % = 89.250 (folio: 3,4 × 26.250)', () => {
    const a = utilityAmounts('water', 34, 25_000, 5);
    expect(a).toMatchObject({
      quantity: 3.4,
      unitPriceGrossVnd: 26_250,
      netVnd: 85_000,
      vatVnd: 4_250,
    });
    expect(a.amountVnd).toBe(89_250);
    expect(Math.round(a.quantity * a.unitPriceGrossVnd)).toBe(a.amountVnd);
  });
  it('partial first month: 8.500.000, arrival 20/11 → 283.000 × 11 = 3.113.000', () => {
    const daily = divideRoundVnd(8_500_000, 30, 1000);
    expect(daily).toBe(283_000);
    const r = rentFor(
      { from: '2026-11-01', to: '2026-11-30' },
      { arrival: '2026-11-20', lastNight: '2027-02-19' },
      8_500_000,
      daily,
    );
    expect(r).toEqual({
      period: { from: '2026-11-20', to: '2026-11-30' },
      quantity: 11,
      unit: 'day',
      unitPriceVnd: 283_000,
      amountVnd: 3_113_000,
    });
  });
  it('final period: 3 months from 20/11, out 20/02 → 25.500.000 − 20.113.000 = 5.387.000', () => {
    const contract = contractRentVnd('2026-11-20', '2027-02-20', 8_500_000, 283_000);
    expect(contract).toBe(25_500_000);
    expect(contract - (3_113_000 + 8_500_000 + 8_500_000)).toBe(5_387_000);
  });
  it('rounding: 9.502.690 → 9.502.000 with a −690 line (always down)', () => {
    expect(roundDownTotal(9_502_690, 1000)).toEqual({ totalVnd: 9_502_000, roundingVnd: -690 });
    expect(roundDownTotal(9_502_000, 1000)).toEqual({ totalVnd: 9_502_000, roundingVnd: 0 });
    expect(roundDownTotal(9_502_690, 1)).toEqual({ totalVnd: 9_502_690, roundingVnd: 0 });
  });
});

describe('FB-INV-012 – periods follow the rules (criterion 4)', () => {
  it('advance: rent of M, utilities and services of M−1, due on dueDay of M', () => {
    expect(statementPeriods('2026-12-01', DEFAULT_RULES, '2026-11-20')).toEqual({
      rent: { from: '2026-12-01', to: '2026-12-31' },
      utility: { from: '2026-11-01', to: '2026-11-30' },
      service: { from: '2026-11-01', to: '2026-11-30' },
      dueDate: '2026-12-05',
    });
  });
  it('arrears + dueDay 10: everything of M−1, due 10/M; the arrival-month statement is due at arrival', () => {
    const rules = { ...DEFAULT_RULES, rentTiming: 'arrears' as const, dueDay: 10 };
    expect(statementPeriods('2026-12-01', rules, '2026-11-01')).toMatchObject({
      rent: { from: '2026-11-01', to: '2026-11-30' },
      dueDate: '2026-12-10',
    });
    expect(statementPeriods('2026-11-01', DEFAULT_RULES, '2026-11-20').dueDate).toBe('2026-11-20');
  });
  it('reading window (BR-LS-10): closing of 11 read 30/11 – 01/12; opening of 12 in the same window', () => {
    expect(windowOf('period_end', '2026-11-01', DEFAULT_RULES)).toEqual({
      from: '2026-11-30',
      to: '2026-12-01',
    });
    expect(windowOf('period_start', '2026-12-01', DEFAULT_RULES)).toEqual({
      from: '2026-11-30',
      to: '2026-12-01',
    });
  });
  it('code: TT-<yymm>-<room>[-R<n>]', () => {
    expect(statementCode('2026-12-01', '203', 0)).toBe('TT-2612-203');
    expect(statementCode('2026-12-01', '203', 1)).toBe('TT-2612-203-R1');
  });
  it('short guest name for lists', () => {
    expect(shortGuestName('Nguyễn Văn Minh')).toBe('N. Minh');
    expect(shortGuestName(null)).toBeNull();
  });
});

describe('FB-INV-012 – overdue derived on read (criterion 8, BR-LS-02)', () => {
  const at = (today: string) => overdueOf(today, '2026-12-05', true, 3, 10);
  it('05 due_today, 06 overdue, 08 alert, 15 escalate', () => {
    expect(at('2026-12-04')).toEqual({ overdueDays: 0, alertLevel: null });
    expect(at('2026-12-05')).toEqual({ overdueDays: 0, alertLevel: 'due_today' });
    expect(at('2026-12-06')).toEqual({ overdueDays: 1, alertLevel: 'overdue' });
    expect(at('2026-12-08')).toEqual({ overdueDays: 3, alertLevel: 'alert' });
    expect(at('2026-12-15')).toEqual({ overdueDays: 10, alertLevel: 'escalate' });
  });
  it('nothing owed → no alert', () => {
    expect(overdueOf('2026-12-15', '2026-12-05', false, 3, 10)).toEqual({
      overdueDays: 0,
      alertLevel: null,
    });
  });
});

describe('FB-INV-012 – parameter hooks (criterion 9: out of bounds → 422)', () => {
  it('utility_unit_price', () => {
    expect(unitPriceIssue({ electricityVndPerKwh: 4000, waterVndPerM3: 25_000 })).toBeNull();
    expect(unitPriceIssue({ electricityVndPerKwh: 30_000, waterVndPerM3: 25_000 })?.code).toBe(
      'PARAM_OUT_OF_RANGE',
    );
    expect(
      unitPriceIssue({ electricityVndPerKwh: 4000.5, waterVndPerM3: 25_000 })?.code,
    ).toBeDefined();
    expect(unitPriceIssue({ electricityVndPerKwh: 4000 })?.code).toBe('REQUIRED');
  });
  it('utility_vat_rate ∈ {0, 5, 8, 10}', () => {
    expect(vatRateIssue({ electricity: 10, water: 5 })).toBeNull();
    expect(vatRateIssue({ electricity: 7, water: 5 })).not.toBeNull();
  });
  it('monthly_statement_rules', () => {
    expect(rulesIssue(DEFAULT_RULES)).toBeNull();
    expect(rulesIssue({ ...DEFAULT_RULES, dueDay: 29 })?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(rulesIssue({ ...DEFAULT_RULES, rentTiming: 'weekly' })).not.toBeNull();
    expect(rulesIssue({ ...DEFAULT_RULES, totalRoundingVnd: 500 })).not.toBeNull();
    // ARC BE-190-03: lateMaxDays optional, 0–31 (default 10).
    const w = (lateMaxDays?: number) => ({
      ...DEFAULT_RULES,
      readingWindow: {
        daysBeforeMonthEnd: 0,
        daysAfter: 1,
        ...(lateMaxDays === undefined ? {} : { lateMaxDays }),
      },
    });
    expect(rulesIssue(w())).toBeNull();
    expect(rulesIssue(w(31))).toBeNull();
    expect(rulesIssue(w(32))?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(DEFAULT_RULES.readingWindow.lateMaxDays).toBe(10);
  });
});

describe('FB-INV-012 – migration 0099 is additive only (criterion 11, static part)', () => {
  const sql = readFileSync(
    join(__dirname, '../src/db/migrations/0099_monthly_statement_fb_inv_012.sql'),
    'utf8',
  )
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');
  it('no UPDATE / DELETE / DROP / TRUNCATE; ALTER on the new tables + one FK on payment', () => {
    expect(sql).not.toMatch(/^\s*(UPDATE|DELETE\s+FROM|DROP|TRUNCATE)\b/im);
    const altered = [...sql.matchAll(/ALTER TABLE\s+"?(\w+)"?/gi)].map((m) => m[1]);
    // ARC BE-190-05: the only ALTER of an existing table is a constraint (FK) on payment – no data change.
    expect(new Set(altered)).toEqual(
      new Set(['billing_period', 'billing_period_line', 'meter_reading', 'payment']),
    );
    const onPayment = [...sql.matchAll(/ALTER TABLE\s+"payment"\s+([^;]+);/gi)].map((m) => m[1]);
    expect(onPayment).toHaveLength(1);
    expect(onPayment[0]).toMatch(/^ADD CONSTRAINT "payment_billing_period_fk" FOREIGN KEY/);
    const created = [...sql.matchAll(/CREATE TABLE\s+"?(\w+)"?/gi)].map((m) => m[1]);
    expect(created.sort()).toEqual(['billing_period', 'billing_period_line', 'meter_reading']);
    expect(sql).toMatch(/INSERT INTO config_parameter_def[\s\S]*ON CONFLICT \(key\) DO NOTHING/);
  });
});
