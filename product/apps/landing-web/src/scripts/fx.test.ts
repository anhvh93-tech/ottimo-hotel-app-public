// FB-INV-011 (contract rounds/round-05/fb-inv-011/contract.md): the page converts a VND figure with the optional `fx`
// block of getPublicMonthlyRates – VND ÷ rate, rounded UP (USD 1, KRW 1,000, CNY 1, RUB 100). No fx, a missing or
// odd rate, a stale date or the vi page → null (VND only).
import { describe, expect, it } from 'vitest';
import { BOOKING_STRINGS } from './booking-strings/all';
import { monthlyView } from './booking-logic';
import { convertVnd, formatFx, fxLines, fxQuote, type FxQuote } from './fx';

const FX = {
  base: 'VND',
  source: 'vietcombank',
  asOf: '2026-11-17',
  rates: { USD: 25450, KRW: 18.2, CNY: 3520, RUB: 290 },
};
const body = (fx: unknown = FX) => ({
  estimate: true,
  currency: 'VND',
  taxIncluded: true,
  roomTypes: [],
  computedAt: '2026-11-17T10:00:00+07:00',
  fx,
});
const TODAY = '2026-11-17';
const nbsp = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

describe('fxQuote – which rate the page uses', () => {
  it('en → USD, ko → KRW, zh → CNY, ru → RUB, vi → none', () => {
    expect(fxQuote(body(), 'en', TODAY)).toEqual({ currency: 'USD', rate: 25450, asOf: TODAY });
    expect(fxQuote(body(), 'ko', TODAY)?.currency).toBe('KRW');
    expect(fxQuote(body(), 'zh', TODAY)?.currency).toBe('CNY');
    expect(fxQuote(body(), 'ru', TODAY)?.currency).toBe('RUB');
    expect(fxQuote(body(), 'vi', TODAY)).toBeNull();
  });

  it('no fx block, null, not an object → VND only', () => {
    const noFx: Record<string, unknown> = body();
    delete noFx.fx;
    expect(fxQuote(noFx, 'en', TODAY)).toBeNull();
    expect(fxQuote(body(null), 'en', TODAY)).toBeNull();
    expect(fxQuote(body('25450'), 'en', TODAY)).toBeNull();
    expect(fxQuote(null, 'en', TODAY)).toBeNull();
  });

  it('missing code, odd numbers, wrong base → VND only for that page', () => {
    const r = (rates: Record<string, unknown>) => body({ ...FX, rates });
    expect(fxQuote(r({ KRW: 18.2 }), 'en', TODAY)).toBeNull();
    expect(fxQuote(r({ USD: '25450' }), 'en', TODAY)).toBeNull();
    expect(fxQuote(r({ USD: 0 }), 'en', TODAY)).toBeNull();
    expect(fxQuote(r({ USD: -25450 }), 'en', TODAY)).toBeNull();
    expect(fxQuote(r({ USD: Number.NaN }), 'en', TODAY)).toBeNull();
    expect(fxQuote(r({ USD: Number.POSITIVE_INFINITY }), 'en', TODAY)).toBeNull();
    // unit mix-ups: VND per 1,000 KRW, a missing zero on USD
    expect(fxQuote(r({ KRW: 18_200 }), 'ko', TODAY)).toBeNull();
    expect(fxQuote(r({ USD: 2545 }), 'en', TODAY)).toBeNull();
    expect(fxQuote(body({ ...FX, base: 'USD' }), 'en', TODAY)).toBeNull();
    expect(fxQuote(body({ ...FX, rates: null }), 'en', TODAY)).toBeNull();
  });

  it('date: up to 7 days old (and one day ahead) is used; older, malformed or impossible → VND only', () => {
    const d = (asOf: unknown) => fxQuote(body({ ...FX, asOf }), 'en', TODAY);
    expect(d('2026-11-10')).not.toBeNull(); // 7 days
    expect(d('2026-11-18')).not.toBeNull(); // next rate day published early
    expect(d('2026-11-09')).toBeNull(); // 8 days
    expect(d('2026-11-19')).toBeNull();
    expect(d('2026-02-30')).toBeNull();
    expect(d('17/11/2026')).toBeNull();
    expect(d(20261117)).toBeNull();
  });
});

describe('convertVnd – VND ÷ rate, rounded up', () => {
  const q = (currency: FxQuote['currency'], rate: number): FxQuote => ({
    currency,
    rate,
    asOf: TODAY,
  });
  it('steps of the contract', () => {
    expect(convertVnd(8_500_000, q('USD', 25450))).toBe(334); // 333.99
    expect(convertVnd(8_500_000, q('KRW', 18.2))).toBe(468_000); // 467,033
    expect(convertVnd(8_500_000, q('CNY', 3520))).toBe(2415); // 2,414.77
    expect(convertVnd(8_500_000, q('RUB', 290))).toBe(29_400); // 29,310
  });
  it('an exact quotient is not pushed up by floating-point noise', () => {
    expect(convertVnd(8_144_000, q('USD', 25450))).toBe(320);
    expect(convertVnd(9_100_000, q('KRW', 18.2))).toBe(500_000);
  });
  it('rounds up, never down: 1 dong over → the next step', () => {
    expect(convertVnd(25_451, q('USD', 25450))).toBe(2);
  });
  it('no positive VND → null', () => {
    expect(convertVnd(0, q('USD', 25450))).toBeNull();
    expect(convertVnd(-1, q('USD', 25450))).toBeNull();
    expect(convertVnd(Number.NaN, q('USD', 25450))).toBeNull();
  });
});

describe('lines shown under the VND figure (Intl by the page locale)', () => {
  it('five languages', () => {
    const line = (lang: 'en' | 'ko' | 'zh' | 'ru') => {
      const f = fxLines(
        8_500_000,
        fxQuote(body(), lang, TODAY),
        BOOKING_STRINGS[lang].estimate.fx,
        lang,
      );
      return f && { month: nbsp(f.month), note: nbsp(f.note), value: f.value };
    };
    expect(line('en')).toEqual({
      month: '≈ US$334 / month',
      note: 'Estimate at the 17 Nov 2026 rate. Payment in VND.',
      value: 334,
    });
    expect(line('ko')).toEqual({
      month: '≈ 월 ₩468,000',
      note: '2026년 11월 17일 환율 기준 예상 금액입니다. 결제는 VND로 진행됩니다.',
      value: 468_000,
    });
    expect(line('zh')).toEqual({
      month: '≈ 每月 ¥2,415',
      note: '按2026年11月17日汇率估算。以越南盾（VND）付款。',
      value: 2415,
    });
    expect(line('ru')).toEqual({
      month: '≈ 29 400 ₽ в месяц',
      note: 'Оценка по курсу на 17.11.2026. Оплата в VND.',
      value: 29_400,
    });
    expect(
      fxLines(8_500_000, fxQuote(body(), 'vi', TODAY), BOOKING_STRINGS.vi.estimate.fx, 'vi'),
    ).toBeNull();
  });

  it('strings: calm, no emoji, no exclamation mark', () => {
    for (const [lang, S] of Object.entries(BOOKING_STRINGS)) {
      const text = `${S.estimate.fx.month('X')} ${S.estimate.fx.note('D')}`;
      expect(text, lang).not.toMatch(/[!！]|\p{Extended_Pictographic}/u);
      expect(text, lang).toMatch(/VND|X/);
    }
  });

  it('formatFx follows the locale', () => {
    const q = fxQuote(body(), 'ru', TODAY)!;
    expect(nbsp(formatFx(1_234_500, q, 'ru'))).toBe('1 234 500 ₽');
  });

  it('the form box view carries the fx lines; without a quote it is the VND view unchanged', () => {
    const S = BOOKING_STRINGS.en;
    const plain = monthlyView(8_500_000, true, S, 'en');
    const withFx = monthlyView(8_500_000, true, S, 'en', undefined, fxQuote(body(), 'en', TODAY));
    expect(plain.fx).toBeUndefined();
    expect(withFx.fx?.month).toBe('≈ US$334 / month');
    expect({ ...withFx, fx: undefined }).toEqual({ ...plain, fx: undefined });
    expect(monthlyView(8_500_000, true, S, 'en', undefined, null)).toEqual(plain);
  });
});
