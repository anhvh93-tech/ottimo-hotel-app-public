/**
 * BUG-R5-006 (P2) / C0313-25 (SEC-responses 4.1 option (a), 4.3) + FB-R5-SEC-BE-119-01 + FB-R5-ARC-BE-119-03 – V-09
 * for a bank transfer reference field: a value whose groups, joined from the start, reach 13–19 digits passing Luhn at
 * a group boundary → 422 CARD_NUMBER_DETECTED (a whole card number, or one followed by expiry / CVV groups, digits or
 * letters); a letter spoils every boundary after it; bank
 * codes with a long digit run, short / long digit runs and digits failing Luhn are references. Free text keeps the
 * general rule. Every card number here is a public test number (4111…, 4222…, 5555…, 4012…, 3782…, 6011…).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkPaymentShape } from '../src/modules/payments/public/payment.service';
import { ProblemError } from '../src/shared/problem';
import {
  assertNotCardNumberReference,
  containsCardNumber,
  isCardNumberReference,
} from '../src/shared/validation';

/** Refused: a whole card number, whatever separator the field pattern allows. */
const CARDS = [
  '4111111111111111',
  '4111-1111-1111-1111',
  '4111.1111.1111.1111',
  '4111_1111_1111_1111',
  '4111/1111/1111/1111',
  '4111-1111.1111_1111',
  '4222222222222', // 13 digits
  '4111111111111111110', // 19 digits
  // FB-R5-SEC-BE-119-01 (SEC script): a card followed by expiry / CVV groups – v1.0.4 refused these.
  '4111111111111111/1228',
  '4111.1111.1111.1111.12.28',
  '4111-1111-1111-1111-123',
  '5555555555554444-123',
  // FB-R5-ARC-BE-119-03 (SEC 1.1): the card first, then a group with letters.
  '4111111111111111-EXP1228',
  '4111-1111-1111-1111-CVV123',
  '4111111111111111-FT',
  // Deliberate false hit (SEC 119-01): two groups → 14 digits passing Luhn; the way out is the last 8 characters.
  '20261107-000105',
];
/** Public test card numbers (15 and 16 digits) for the "card + expiry / CVV" sweep (119-01). */
const TEST_CARDS = [
  '4111111111111111',
  '5555555555554444',
  '4012888888881881',
  '378282246310005',
  '6011111111111117',
];
const CARD_SUFFIXES = ['-123', '/1228', '.12.28', '_0000', '-12-28-123'];
/** BUG-R5-006 regression (QA table): refused before by a Luhn window inside, accepted now. */
const BUG_R5_006 = ['2026110700000000', '26110700000004', 'FT26110700000000'];
/** Accepted: references. */
const REFERENCES = [
  ...BUG_R5_006,
  '2026110700000100', // QA: 16 digits, no window passes Luhn
  '202611070001', // QA: 12 digits
  '00000000', // QA: the last 8 characters
  'FT26290012345671', // letters + a 14-digit window that passes Luhn (the false hit of C0313-25)
  'FT26290001',
  '4111111111111112', // 16 digits, not Luhn
  '1234567890123', // 13 digits, not Luhn
  '411111111117', // 12 digits, Luhn
  '41111111111111111115', // 20 digits, Luhn
  '11111111', // the last 8 characters of a refused one (SEC 4.2)
  'REF4111111111111111', // SEC accepted residual risk: a card behind letters
  '20261107-000123', // 119-01: two groups, 14 digits, not Luhn
  'FT2629-0012345671', // 119-01 / 119-03: starts with letters – every boundary after them fails
  'FT-4111111111111111', // 119-03: a card behind a letter group (SEC accepted residual risk)
  '4111111111111111EXP1228', // 119-03: a card glued to letters, no separator (SEC accepted residual risk, SR-PAY-10)
];

describe('isCardNumberReference (C0313-25)', () => {
  it.each(CARDS)('%s → card', (v) => expect(isCardNumberReference(v)).toBe(true));
  it.each(REFERENCES)('%s → reference', (v) => expect(isCardNumberReference(v)).toBe(false));

  it('119-01: every public test card followed by an expiry / CVV group is refused', () => {
    for (const card of TEST_CARDS) {
      expect(isCardNumberReference(card), card).toBe(true);
      for (const suffix of CARD_SUFFIXES) {
        expect(isCardNumberReference(card + suffix), card + suffix).toBe(true);
      }
    }
  });

  it.each(BUG_R5_006)(
    'BUG-R5-006: %s was a card for the free-text rule (the bug), is a reference now',
    (v) => {
      expect(containsCardNumber(v)).toBe(true);
      expect(isCardNumberReference(v)).toBe(false);
    },
  );

  it('the free-text rule is unchanged: it still flags a long digit run inside text', () => {
    expect(containsCardNumber('FT26290012345671')).toBe(true);
    expect(containsCardNumber('Khách đọc số 4111 1111 1111 1111')).toBe(true);
  });

  it('assertNotCardNumberReference: 422 CARD_NUMBER_DETECTED on the field, the value never repeated', () => {
    let err: unknown;
    try {
      assertNotCardNumberReference('bankReference', '4111-1111-1111-1111');
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ProblemError);
    expect((err as ProblemError).code).toBe('CARD_NUMBER_DETECTED');
    expect((err as ProblemError).options.errors).toEqual([
      { field: 'bankReference', code: 'CARD_NUMBER_DETECTED' },
    ]);
    expect(JSON.stringify((err as ProblemError).options)).not.toContain('4111');
    expect(() => assertNotCardNumberReference('bankReference', null)).not.toThrow();
    expect(() => assertNotCardNumberReference('bankReference', 'FT26290012345671')).not.toThrow();
  });
});

describe('PaymentCreate.bankReference – the shared receipt shape check (every recordInTx path)', () => {
  const body = (bankReference: string) => ({
    type: 'deposit',
    method: 'bank_transfer',
    amountVnd: 100_000,
    bankReference,
  });
  it.each(CARDS)('%s → 422 CARD_NUMBER_DETECTED (field with prefix)', (v) => {
    let err: unknown;
    try {
      checkPaymentShape(body(v), { fieldPrefix: 'payment.' });
    } catch (e) {
      err = e;
    }
    expect((err as ProblemError)?.code).toBe('CARD_NUMBER_DETECTED');
    expect((err as ProblemError).options.errors).toEqual([
      { field: 'payment.bankReference', code: 'CARD_NUMBER_DETECTED' },
    ]);
  });
  it.each(REFERENCES)('%s → accepted', (v) => {
    expect(checkPaymentShape(body(v), {}).errors).toEqual([]);
  });
  it('outside the field pattern → 422 VALIDATION_FAILED (blanks trimmed first)', () => {
    expect(checkPaymentShape(body('FT 2629'), {}).errors).toEqual([
      { field: 'bankReference', code: 'VALIDATION_FAILED' },
    ]);
    expect(checkPaymentShape(body('  FT2629  '), {}).errors).toEqual([]);
    expect(checkPaymentShape(body('x'.repeat(65)), {}).errors).toEqual([
      { field: 'bankReference', code: 'VALIDATION_FAILED' },
    ]);
  });
});

describe('every bank reference goes through the reference rule (architecture)', () => {
  it('no containsCardNumber / assertNoCardNumber on a *Reference value under src/modules', () => {
    const root = join(__dirname, '..', 'src', 'modules');
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
      });
    const bad = files(root).filter((f) =>
      /(containsCardNumber|looksLikeCard\w*|assertNoCardNumber)\([^)]*[Rr]eference/.test(
        readFileSync(f, 'utf8'),
      ),
    );
    expect(bad.map((f) => relative(root, f))).toEqual([]);
  });
});
