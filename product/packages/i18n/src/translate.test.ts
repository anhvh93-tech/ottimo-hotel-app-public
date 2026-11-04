import { beforeAll, describe, expect, it } from 'vitest';
import {
  allKeys,
  formatInstant,
  formatLocalDate,
  formatNumber,
  isLocaleLoaded,
  loadLocale,
  pluralForm,
  translate,
} from './translate';
import pluralCases from './plural-forms.cases.json';

describe('lazy EN chunk', () => {
  it('shows VI text until EN is loaded, then English', async () => {
    expect(isLocaleLoaded('en')).toBe(false);
    expect(translate('en', 'login.submit')).toBe(translate('vi', 'login.submit'));
    expect(() => allKeys('en')).toThrow();
    await loadLocale('en');
    expect(isLocaleLoaded('en')).toBe(true);
    expect(translate('en', 'login.submit')).toBe('Sign in');
  });
});

describe('translate', () => {
  beforeAll(() => loadLocale('en'));

  it('interpolates {args} and falls back to the key', () => {
    expect(translate('vi', 'error.RATE_LIMITED', { minutes: 15 })).toContain('15 phút');
    expect(translate('en', 'login.submit')).toBe('Sign in');
    expect(translate('vi', 'no.such.key')).toBe('no.such.key');
  });

  it('VI and EN have the same keys', () => {
    const vi = allKeys('vi');
    expect([...allKeys('en')].filter((k) => !vi.has(k))).toEqual([]);
  });

  it('formats money and dates the Vietnamese way', () => {
    expect(formatNumber('vi', 11500000)).toBe('11.500.000');
    expect(formatLocalDate('2026-10-16')).toBe('16/10/2026');
    expect(formatInstant('vi', '2026-10-15T02:30:00Z')).toBe('15/10/2026 09:30');
  });
});

describe('pluralForm (BUG-R4-009)', () => {
  beforeAll(() => loadLocale('en'));

  it('picks the CLDR form the copy carries: en one/other, ru one/few/many, vi other', () => {
    expect([1, 2].map((n) => pluralForm('en', n))).toEqual(['one', 'other']);
    expect([1, 2, 5, 11, 21, 22, 111].map((n) => pluralForm('ru', n))).toEqual([
      'one',
      'few',
      'many',
      'many',
      'one',
      'few',
      'many',
    ]);
    expect([1, 2].map((n) => pluralForm('vi', n))).toEqual(['other', 'other']);
  });

  it('matches the table the api copy is checked against too (FB-R4-ARC-BE-LPV2-10)', () => {
    for (const [l, byN] of Object.entries(pluralCases.cases))
      for (const [n, form] of Object.entries(byN))
        expect([l, n, pluralForm(l, Number(n))]).toEqual([l, n, form]);
  });

  it('guest-facing counted strings read right for 1 and 2 (no "1 nights", no "guest(s)")', () => {
    const p = (l: 'vi' | 'en', key: string, n: number, args: Record<string, string | number>) =>
      translate(l, `${key}_${pluralForm(l, n)}`, args);
    expect(p('en', 'bill.ota_prepaid', 1, { n: 1, channel: 'Agoda' })).toBe(
      'Room charge, 1 night – paid via Agoda',
    );
    expect(p('en', 'bill.ota_prepaid', 2, { n: 2, channel: 'Agoda' })).toBe(
      'Room charge, 2 nights – paid via Agoda',
    );
    expect(p('vi', 'bill.ota_prepaid', 1, { n: 1, channel: 'Agoda' })).toBe(
      'Tiền phòng 1 đêm – đã thanh toán qua Agoda',
    );
    expect(p('en', 'common.nights', 1, { n: 1 })).toBe('1 night');
    expect(p('en', 'common.nights', 3, { n: 3 })).toBe('3 nights');
    expect(p('en', 'guest.bill.line.room', 1, { nights: 1, rate: 'X' })).toBe(
      'Room charge, 1 night × X',
    );
    expect(p('en', 'gw.oci_done_card_deferred', 1, { k: 1 })).toBe(
      '1 guest will show ID at reception.',
    );
    const counted = [
      'bill.ota_prepaid',
      'common.nights',
      'guest.stay.dates',
      'guest.bill.line.room',
      'gw.oci_done_card_deferred',
    ];
    for (const l of ['vi', 'en'] as const) {
      const keys = allKeys(l);
      for (const k of counted) {
        for (const f of ['one', 'few', 'many', 'other'])
          expect(keys.has(`${k}_${f}`), `${l} ${k}_${f}`).toBe(true);
      }
    }
  });
});
