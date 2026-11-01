// BUG-R4-009 (B6, CPY lp-v2-copy 15.2): counted phrases of the guest quote text in the right plural form.
import { describe, expect, it } from 'vitest';
import { QUOTE_COPY, QUOTE_COPY_MISSING } from '../src/generated/quote-copy';
import { pluralForm, quoteCount } from '../src/modules/sales/internal/quotes.service';

const FORMS = ['one', 'few', 'many', 'other'] as const;
const COUNTED = [
  'sale.quote_nights',
  'sale.quote_adults',
  'sale.quote_kids',
  'sale.quote_under6',
  'sale.quote_text_extra_guest',
] as const;

describe('BUG-R4-009 quote plurals', () => {
  it('every locale carries all four forms of every counted key – nothing falls back to en', () => {
    expect(QUOTE_COPY_MISSING).toEqual({});
    for (const locale of ['vi', 'en', 'ru'] as const) {
      const copy = QUOTE_COPY[locale] as Record<string, string>;
      for (const k of COUNTED) for (const f of FORMS) expect(copy[`${k}_${f}`]).toContain('{n}');
      expect(copy['sale.quote_text']).toContain('{nights_text}');
      expect(copy['sale.quote_text']).not.toContain('{nights}');
    }
  });

  it('ru nights: 1/2/4/5/11/12/14/21/22/25/111 → ночь/ночи/ночей by CLDR', () => {
    const want: Record<number, string> = {
      1: '1 ночь',
      2: '2 ночи',
      4: '4 ночи',
      5: '5 ночей',
      11: '11 ночей',
      12: '12 ночей',
      14: '14 ночей',
      21: '21 ночь',
      22: '22 ночи',
      25: '25 ночей',
      111: '111 ночей',
    };
    for (const [n, text] of Object.entries(want)) {
      expect(quoteCount('ru', 'sale.quote_nights', Number(n))).toBe(text);
    }
  });

  it('ru guests and children: взрослый/взрослых, ребёнок/ребёнка/детей, гостя/гостей', () => {
    expect(quoteCount('ru', 'sale.quote_adults', 1)).toBe('1 взрослый');
    expect(quoteCount('ru', 'sale.quote_adults', 2)).toBe('2 взрослых');
    expect(quoteCount('ru', 'sale.quote_adults', 5)).toBe('5 взрослых');
    expect(quoteCount('ru', 'sale.quote_adults', 21)).toBe('21 взрослый');
    expect(quoteCount('ru', 'sale.quote_kids', 1)).toBe('1 ребёнок 6–11 лет');
    expect(quoteCount('ru', 'sale.quote_kids', 2)).toBe('2 ребёнка 6–11 лет');
    expect(quoteCount('ru', 'sale.quote_kids', 5)).toBe('5 детей 6–11 лет');
    expect(quoteCount('ru', 'sale.quote_under6', 1)).toBe('1 ребёнок до 6 лет');
    expect(quoteCount('ru', 'sale.quote_under6', 3)).toBe('3 ребёнка до 6 лет');
    expect(quoteCount('ru', 'sale.quote_text_extra_guest', 1, { amount: '250,000 VND' })).toBe(
      'Включена доплата за 1 гостя на диване: 250,000 VND.',
    );
    expect(quoteCount('ru', 'sale.quote_text_extra_guest', 2, { amount: 'X' })).toBe(
      'Включена доплата за 2 гостей на диване: X.',
    );
  });

  it('en 1/2: "1 night", "2 nights", "1 adult", "2 adults", lower case, no "(s)"', () => {
    expect(quoteCount('en', 'sale.quote_nights', 1)).toBe('1 night');
    expect(quoteCount('en', 'sale.quote_nights', 2)).toBe('2 nights');
    expect(quoteCount('en', 'sale.quote_adults', 1)).toBe('1 adult');
    expect(quoteCount('en', 'sale.quote_adults', 2)).toBe('2 adults');
    expect(quoteCount('en', 'sale.quote_kids', 1)).toBe('1 child aged 6–11');
    expect(quoteCount('en', 'sale.quote_kids', 2)).toBe('2 children aged 6–11');
    expect(quoteCount('en', 'sale.quote_under6', 1)).toBe('1 child under 6');
    expect(quoteCount('en', 'sale.quote_under6', 2)).toBe('2 children under 6');
    expect(quoteCount('en', 'sale.quote_text_extra_guest', 1, { amount: 'X' })).toBe(
      'Includes the extra-guest charge for 1 guest on the sofa: X.',
    );
    expect(quoteCount('en', 'sale.quote_text_extra_guest', 2, { amount: 'X' })).toBe(
      'Includes the extra-guest charge for 2 guests on the sofa: X.',
    );
  });

  it('vi keeps one form, lower case mid-sentence', () => {
    expect(pluralForm('vi', 1)).toBe('other');
    expect(quoteCount('vi', 'sale.quote_nights', 1)).toBe('1 đêm');
    expect(quoteCount('vi', 'sale.quote_nights', 2)).toBe('2 đêm');
    expect(quoteCount('vi', 'sale.quote_adults', 1)).toBe('1 người lớn');
    expect(quoteCount('vi', 'sale.quote_adults', 2)).toBe('2 người lớn');
    expect(quoteCount('vi', 'sale.quote_under6', 1)).toBe('1 trẻ dưới 6 tuổi');
  });

  it('pluralForm maps CLDR categories the copy has (en one/other, ru one/few/many)', () => {
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
  });
});
