import { describe, expect, it } from 'vitest';
import { IntegrationError } from '../contracts/common.js';
import { containsPan, isCardKey, keyTokens, luhnValid, scrubCardData } from './scrub-card-data.js';

// Published test PANs (Visa/Mastercard/Amex/JCB test numbers) – not real cards.
const VISA = '4111111111111111';
const MC = '5555555555554444';
const AMEX = '378282246310005'; // 15 digits
const VISA19 = '4000000000000000006'; // 19 digits, Luhn-valid

describe('luhnValid / containsPan', () => {
  it('validates Luhn', () => {
    for (const pan of [VISA, MC, AMEX, VISA19]) expect(luhnValid(pan)).toBe(true);
    expect(luhnValid('4111111111111112')).toBe(false);
  });

  it('finds 13–19 digit Luhn sequences with spaces or dashes', () => {
    expect(containsPan(`card ${VISA}`)).toBe(true);
    expect(containsPan('Khach dua the 4111 1111 1111 1111 de dam bao')).toBe(true);
    expect(containsPan('5555-5555-5555-4444')).toBe(true);
    expect(containsPan(AMEX)).toBe(true);
    expect(containsPan(VISA19)).toBe(true);
  });

  it('ignores short, long or non-Luhn digit runs', () => {
    expect(containsPan('PT-123456 chuyen khoan 2500000')).toBe(false);
    expect(containsPan('4111111111111112')).toBe(false); // fails Luhn
    expect(containsPan('411111111111')).toBe(false); // 12 digits
    expect(containsPan('41111111111111111110')).toBe(false); // 20 digits (Luhn-valid, too long)
    expect(containsPan('SDT 0901234567')).toBe(false);
    expect(containsPan('2026-10-20')).toBe(false);
  });
});

describe('isCardKey (README 1.8 name rule, per token)', () => {
  it('splits keys into tokens', () => {
    expect(keyTokens('vnp_CardType')).toEqual(['vnp', 'card', 'type']);
    expect(keyTokens('PANNumber')).toEqual(['pan', 'number']);
    expect(keyTokens('guest.credit-card')).toEqual(['guest', 'credit', 'card']);
  });

  it('flags card-like keys in snake, camel and kebab case', () => {
    for (const k of [
      'card',
      'cardNumber',
      'card_number',
      'creditCard',
      'CardHolderName',
      'cardholder',
      'cc',
      'ccNumber',
      'cc_exp',
      'cvv',
      'CVV2',
      'cvc',
      'vcc',
      'vcc_details',
      'pan',
      'PAN',
      'expiry',
      'card_expiry',
      'expirationDate',
      'exp_month',
      'expYear',
      'track2',
      'guest-card-no',
    ]) {
      expect(isCardKey(k), k).toBe(true);
    }
  });

  it('keeps ordinary fields that only look similar', () => {
    for (const k of [
      'expiresAt',
      'vnp_ExpireDate',
      'expired',
      'ccy',
      'currency',
      'panel',
      'panorama',
      'capacity',
      'accountNo',
      'discount',
      'scope',
      'export',
      'experience',
      'occupancy',
      'checkIn',
    ]) {
      expect(isCardKey(k), k).toBe(false);
    }
  });
});

describe('scrubCardData', () => {
  it('drops card fields by name and by value, keeps the rest (scenario card_data_in_payload)', () => {
    const payload = {
      bookId: 123456,
      status: 'new',
      guest: { name: 'Nguyen Van A', phone: '0901234567', notes: `the ${VISA} het han 12/28` },
      cardNumber: VISA,
      card: { holder: 'NGUYEN VAN A', expiry: '12/28', cvv: '987' },
      vcc: { number: MC },
      price: 2500000,
      rooms: [{ roomId: 7 }, MC],
      expiresAt: '2026-10-20T14:00:00+07:00',
    };
    const { value, dropped } = scrubCardData(payload);
    expect(value).toEqual({
      bookId: 123456,
      status: 'new',
      guest: { name: 'Nguyen Van A', phone: '0901234567' },
      price: 2500000,
      rooms: [{ roomId: 7 }],
      expiresAt: '2026-10-20T14:00:00+07:00',
    });
    // cardNumber, card, vcc, guest.notes, rooms[1]
    expect(dropped).toBe(5);
    const text = JSON.stringify(value);
    for (const secret of [VISA, MC, '987', '12/28', 'NGUYEN VAN A'])
      expect(text).not.toContain(secret);
  });

  it('checks integer number values too', () => {
    const { value, dropped } = scrubCardData({ ref: 4111111111111111, amount: 1500000 });
    expect(value).toEqual({ amount: 1500000 });
    expect(dropped).toBe(1);
  });

  it('allowKeys exempts only the name rule, never the value rule', () => {
    const q = { vnp_CardType: 'ATM', vnp_BankCode: 'NCB', vnp_Amount: '150000000' };
    expect(scrubCardData(q, { allowKeys: ['vnp_CardType'] })).toEqual({ value: q, dropped: 0 });
    expect(scrubCardData(q).dropped).toBe(1);
    const leaky = scrubCardData({ vnp_CardType: VISA }, { allowKeys: ['vnp_CardType'] });
    expect(leaky).toEqual({ value: {}, dropped: 1 });
  });

  it('does not mutate the input and returns a clean payload unchanged', () => {
    const input = { a: { b: [1, 'x', null, true] }, c: 'PT-000123' };
    const copy = structuredClone(input);
    const r = scrubCardData(input);
    expect(r).toEqual({ value: copy, dropped: 0 });
    expect(r.value).not.toBe(input);
    expect(input).toEqual(copy);
  });

  it('drops a top-level primitive that is a PAN', () => {
    expect(scrubCardData(VISA)).toEqual({ value: undefined, dropped: 1 });
    expect(scrubCardData('hello')).toEqual({ value: 'hello', dropped: 0 });
  });

  it('allows shared (non-cyclic) references but rejects cycles and deep nesting without detail', () => {
    const shared = { x: 1 };
    expect(scrubCardData({ a: shared, b: shared }).value).toEqual({ a: { x: 1 }, b: { x: 1 } });

    const cyclic: Record<string, unknown> = { cardNumber: VISA };
    cyclic.self = cyclic;
    expect(() => scrubCardData({ ok: 1, nested: { cyclic } })).toThrow(IntegrationError);

    let deep: Record<string, unknown> = { v: 1 };
    for (let i = 0; i < 40; i++) deep = { d: deep };
    try {
      scrubCardData(deep);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(IntegrationError);
      expect((e as IntegrationError).code).toBe('INVALID_REQUEST');
    }
  });
});
