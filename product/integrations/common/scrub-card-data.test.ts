import { describe, expect, it } from 'vitest';
import { IntegrationError } from '../contracts/common.js';
import {
  cardBrand,
  containsPan,
  isCardKey,
  isRecentEpochMs,
  isRecentTimestamp14,
  keyTokens,
  looksLikeCardNumber,
  luhnValid,
  scrubCardData,
  type FieldKind,
} from './scrub-card-data.js';

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
    expect(containsPan('4111111111111')).toBe(false); // 13 digits, fails Luhn (single window)
    // a 16-digit non-Luhn run may still contain a Luhn-valid 13–15 digit window (Tier A is strict)
    expect(containsPan('411111111111')).toBe(false); // 12 digits
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
    expect(scrubCardData(q, { allowKeys: ['vnp_CardType'] })).toMatchObject({
      value: q,
      dropped: 0,
    });
    expect(scrubCardData(q).dropped).toBe(1);
    const leaky = scrubCardData({ vnp_CardType: VISA }, { allowKeys: ['vnp_CardType'] });
    expect(leaky).toMatchObject({ value: {}, dropped: 1 });
  });

  it('does not mutate the input and returns a clean payload unchanged', () => {
    const input = { a: { b: [1, 'x', null, true] }, c: 'PT-000123' };
    const copy = structuredClone(input);
    const r = scrubCardData(input);
    expect(r).toEqual({
      value: copy,
      dropped: 0,
      droppedByRule: { name: 0, value_text: 0, value_id: 0 },
      attention: [],
    });
    expect(r.value).not.toBe(input);
    expect(input).toEqual(copy);
  });

  it('drops a top-level primitive that is a PAN', () => {
    expect(scrubCardData(VISA)).toMatchObject({ value: undefined, dropped: 1 });
    expect(scrubCardData('hello')).toMatchObject({ value: 'hello', dropped: 0 });
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

// ---------------------------------------------------------------------------------------------------
// FB-R2-SEC-INT-01/02/03 – two tiers (SEC decision 16/10/2026)
// Published test numbers only: Visa/Mastercard/Amex (card-brand test numbers), JCB 3530111333300000
// (JCB test number used by Stripe/Adyen docs), NAPAS 9704198526191432198 (VNPay sandbox NCB test card).
const JCB = '3530111333300000';
const NAPAS19 = '9704198526191432198';
const DINERS14 = '36227206271667';
const TEST_PANS = [VISA, MC, AMEX, JCB, NAPAS19, VISA19, DINERS14];

/** Deterministic PRNG (mulberry32) so the sampled tests are reproducible. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Appends the Luhn check digit → a Luhn-VALID number (worst case for the scrubber). */
function withLuhn(body: string): string {
  for (let d = 0; d <= 9; d++) if (luhnValid(body + d)) return body + d;
  throw new Error('unreachable');
}

const NOW = Date.UTC(2026, 9, 16, 5, 0, 0); // 16/10/2026 12:00 +07:00
const VNPAY_KINDS: Record<string, FieldKind> = {
  vnp_PayDate: 'timestamp14',
  vnp_TransactionNo: 'numericId',
  vnp_Amount: 'numericId',
  transId: 'numericId',
  responseTime: 'epochMs',
  orderInfo: 'text',
};

describe('Tier A – free text and undeclared fields (FB-R2-SEC-INT-02: glued card + CVV/expiry)', () => {
  it('finds a card glued to a CVV, an expiry or a phone number (SEC red cases)', () => {
    expect(containsPan(`${VISA} 123`)).toBe(true);
    expect(containsPan('4111 1111 1111 1111 12-28')).toBe(true);
    expect(containsPan(`${VISA}-0901234567`)).toBe(true);
    expect(containsPan(`${VISA}123`)).toBe(true); // no separator at all
    expect(containsPan(`the ${MC}1228987 nhe`)).toBe(true);
    expect(containsPan(`0901234567 ${JCB}`)).toBe(true); // card not at the start of the run
    expect(containsPan(`${VISA} cvv 123`)).toBe(true); // already caught before
  });

  it('every published test PAN is dropped from a note, alone or glued to CVV/expiry', () => {
    for (const pan of TEST_PANS) {
      for (const note of [pan, `the ${pan}`, `${pan} 123`, `${pan} 12/28 cvv 999`, `${pan}-1228`]) {
        const r = scrubCardData({ notes: note, ok: 'x' });
        expect(r.value, note).toEqual({ ok: 'x' });
        expect(r.droppedByRule.value_text, note).toBe(1);
      }
    }
  });

  it('undeclared digit-only keys stay strict (why adapters must declare fieldKinds)', () => {
    // Values measured by SEC as false positives of the old rule – still dropped when NOT declared.
    expect(scrubCardData({ vnp_PayDate: '20261016000006' }).droppedByRule.value_text).toBe(1);
    expect(scrubCardData({ responseTime: 1792130015838 }).droppedByRule.value_text).toBe(1);
    // fieldKinds 'text' = explicit Tier A
    expect(
      scrubCardData({ orderInfo: `PT-000123 ${VISA}` }, { fieldKinds: VNPAY_KINDS }).dropped,
    ).toBe(1);
  });

  it('FB-R2-SEC-INT-03: integers above MAX_SAFE_INTEGER are dropped as suspect in both tiers', () => {
    const big = Number('4111111111111111111'); // rounded by JSON.parse – real digits unknown
    expect(Number.isSafeInteger(big)).toBe(false);
    const parsed = JSON.parse('{"a":4111111111111111111,"transId":98765432109876543,"n":12}');
    const r = scrubCardData(parsed, { fieldKinds: VNPAY_KINDS });
    expect(r.value).toEqual({ n: 12 });
    expect(r.droppedByRule).toEqual({ name: 0, value_text: 1, value_id: 1 });
    // bigint (lossless parser) is checked on its real digits
    expect(scrubCardData({ a: 4111111111111111n }).dropped).toBe(1);
    expect(
      scrubCardData({ transId: 98765432109876543n }, { fieldKinds: VNPAY_KINDS }).dropped,
    ).toBe(0);
  });
});

describe('Tier B – declared numeric fields: Luhn + IIN + brand length (FB-R2-SEC-INT-01)', () => {
  it('IIN table: brand and length', () => {
    expect(cardBrand(VISA)).toBe('visa');
    expect(cardBrand(MC)).toBe('mastercard');
    expect(cardBrand('2223003122003222')).toBe('mastercard');
    expect(cardBrand(AMEX)).toBe('amex');
    expect(cardBrand(JCB)).toBe('jcb');
    expect(cardBrand(NAPAS19)).toBe('napas');
    expect(cardBrand(DINERS14)).toBe('diners');
    expect(cardBrand('411111111111111')).toBeUndefined(); // Visa prefix, 15 digits
    expect(cardBrand('37828224631000')).toBeUndefined(); // Amex prefix, 14 digits
    expect(cardBrand('20261016000006')).toBeUndefined();
    expect(cardBrand('1792130015838')).toBeUndefined();
    for (const pan of TEST_PANS) expect(looksLikeCardNumber(pan), pan).toBe(true);
    expect(looksLikeCardNumber('4111111111111112')).toBe(false); // Luhn fails
  });

  it('86,400 vnp_PayDate values of one day declared timestamp14 → 0 dropped', () => {
    let dropped = 0;
    let luhnHits = 0;
    const pad = (n: number) => String(n).padStart(2, '0');
    for (let sec = 0; sec < 86_400; sec++) {
      const v = `20261016${pad(Math.floor(sec / 3600))}${pad(Math.floor(sec / 60) % 60)}${pad(sec % 60)}`;
      if (luhnValid(v)) luhnHits++;
      dropped += scrubCardData(
        { vnp_PayDate: v },
        { fieldKinds: VNPAY_KINDS, requiredKeys: ['vnp_PayDate'], nowMs: NOW },
      ).dropped;
    }
    expect(luhnHits).toBeGreaterThan(8000); // ≈10 % were false positives under the old rule
    expect(dropped).toBe(0);
  });

  it('10,000 epochMs samples (±2 years) → 0 dropped', () => {
    const r = rng(42);
    let dropped = 0;
    for (let i = 0; i < 10_000; i++) {
      const v = Math.round(NOW + (r() * 2 - 1) * 700 * 24 * 3600 * 1000);
      expect(isRecentEpochMs(String(v), NOW)).toBe(true);
      dropped += scrubCardData(
        { responseTime: v },
        { fieldKinds: VNPAY_KINDS, nowMs: NOW },
      ).dropped;
      dropped += scrubCardData(
        { responseTime: String(v) },
        { fieldKinds: VNPAY_KINDS, nowMs: NOW },
      ).dropped;
    }
    expect(dropped).toBe(0);
  });

  it('long Luhn-valid transaction ids (13–19 digits) without a card IIN are kept', () => {
    const r = rng(7);
    let checked = 0;
    for (const lead of ['1', '7', '8']) {
      for (let len = 13; len <= 19; len++) {
        for (let i = 0; i < 200; i++) {
          let body = lead;
          while (body.length < len - 1) body += String(Math.floor(r() * 10));
          const id = withLuhn(body);
          const res = scrubCardData(
            { vnp_TransactionNo: id, transId: Number.isSafeInteger(Number(id)) ? Number(id) : id },
            { fieldKinds: VNPAY_KINDS, nowMs: NOW },
          );
          expect(res.dropped, id).toBe(0);
          checked++;
        }
      }
    }
    expect(checked).toBe(3 * 7 * 200);
    // SEC's measured examples, declared → kept
    const ok = scrubCardData(
      { vnp_PayDate: '20261016000006', responseTime: 1792130015838, vnp_TransactionNo: '14567890' },
      { fieldKinds: VNPAY_KINDS, nowMs: NOW },
    );
    expect(ok.dropped).toBe(0);
    // without a clock the date window is skipped – timestamps still match no IIN+length → kept
    expect(
      scrubCardData(
        { vnp_PayDate: '20261016000006', responseTime: 1792130015838 },
        { fieldKinds: VNPAY_KINDS },
      ).dropped,
    ).toBe(0);
  });

  it('a real-looking card in a declared id/date field is STILL dropped (no absolute exemption)', () => {
    for (const pan of TEST_PANS) {
      for (const key of ['vnp_TransactionNo', 'transId', 'vnp_PayDate', 'responseTime']) {
        const r = scrubCardData(
          { [key]: pan, keep: 1 },
          { fieldKinds: VNPAY_KINDS, allowKeys: [key], nowMs: NOW },
        );
        expect(r.value, `${key}=${pan}`).toEqual({ keep: 1 });
        expect(r.droppedByRule.value_id, `${key}=${pan}`).toBe(1);
      }
    }
    // a Visa/Mastercard sent as a JSON number into a declared field
    expect(scrubCardData({ transId: 4111111111111111 }, { fieldKinds: VNPAY_KINDS }).dropped).toBe(
      1,
    );
    // timestamp14 outside ±2 years falls back to the card check: a 14-digit Diners test card
    expect(isRecentTimestamp14(DINERS14, NOW)).toBe(false);
    expect(isRecentTimestamp14('20990101000000', NOW)).toBe(false);
    expect(isRecentTimestamp14('20260231120000', NOW)).toBe(false); // 31 Feb
    expect(isRecentTimestamp14('20261016120000', NOW)).toBe(true);
  });

  it('a declared field whose value has non-digit characters is checked by Tier A', () => {
    const r = scrubCardData(
      { vnp_TransactionNo: `TX ${VISA}` },
      { fieldKinds: VNPAY_KINDS, nowMs: NOW },
    );
    expect(r.droppedByRule.value_text).toBe(1);
  });
});

describe('required keys dropped → "Cần chú ý" (card_suspect), never silent', () => {
  it('lists required keys dropped by any rule, without values, deduplicated', () => {
    const r = scrubCardData(
      {
        vnp_TxnRef: 'PT-000123',
        vnp_TransactionNo: VISA,
        vnp_PayDate: MC,
        vnp_OrderInfo: `Thanh toan ${AMEX}`,
        cardNumber: VISA,
        rows: [{ vnp_TransactionNo: JCB }],
      },
      {
        fieldKinds: VNPAY_KINDS,
        requiredKeys: ['vnp_TxnRef', 'vnp_TransactionNo', 'vnp_PayDate', 'vnp_OrderInfo'],
        nowMs: NOW,
      },
    );
    expect(r.value).toEqual({ vnp_TxnRef: 'PT-000123', rows: [{}] });
    expect(r.attention).toEqual([
      { reason: 'card_suspect', field: 'vnp_TransactionNo', rule: 'value_id' },
      { reason: 'card_suspect', field: 'vnp_PayDate', rule: 'value_id' },
      { reason: 'card_suspect', field: 'vnp_OrderInfo', rule: 'value_text' },
    ]);
    expect(r.droppedByRule).toEqual({ name: 1, value_text: 1, value_id: 3 });
    expect(r.dropped).toBe(5);
    expect(JSON.stringify(r.attention)).not.toMatch(/\d{12,}/);
  });

  it('a clean IPN has no attention items', () => {
    const r = scrubCardData(
      { vnp_TxnRef: 'PT-000123', vnp_PayDate: '20261016120000', vnp_TransactionNo: '14567890' },
      { fieldKinds: VNPAY_KINDS, requiredKeys: ['vnp_TxnRef', 'vnp_PayDate'], nowMs: NOW },
    );
    expect(r.attention).toEqual([]);
    expect(r.dropped).toBe(0);
  });
});
