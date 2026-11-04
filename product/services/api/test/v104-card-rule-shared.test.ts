/**
 * v1.0.4 P4-14 phase B core – ARC FB-R4-ARC-BE-PR24PM-01 (ARC-on-v104-p4-14 P414-01, ORC option A). Units, no database.
 * - `sensitive-number.ts` lives in `src/shared/` (pure functions); `public-site` imports it from there (one line);
 * - `containsCardNumber` (V-09 of every other module) = the card half of the shared detector OR the original rule:
 *   catches what only the detector reads (hidden characters, full-width digits, `_` `/` NBSP joins, `%20`), keeps
 *   every case the original rule caught, still never flags dates, phones, amounts or a 12-digit ID number (the ID half
 *   is NOT part of it – guest-portal waits for SEC, SEC-on-plan-v1.0.4 4.2 (6));
 * - error code unchanged: 422 `CARD_NUMBER_DETECTED`, `errors` = field + code only;
 * - architecture: outside `src/shared/` no source file writes its own Luhn loop or card-window regex.
 * Fake values only (4111 1111 1111 1111 and 5555 5555 5555 4444 are published test cards).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { looksLikeCardNumber } from '../src/modules/platform/public/validation';
import { ProblemError } from '../src/shared/problem';
import { looksLikeCard, looksLikeIdNumber } from '../src/shared/sensitive-number';
import { assertNoCardNumber, containsCardNumber } from '../src/shared/validation';

const SRC = join(__dirname, '..', 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

const ZWSP = '\u200B';
const NBSP = '\u00A0';
const fullWidth = (s: string) =>
  s.replace(/[0-9]/g, (d) => String.fromCharCode(0xff10 + d.charCodeAt(0) - 48));

describe('PR24PM-01 – the detector lives in src/shared/', () => {
  it('sensitive-number.ts is in shared/ and nowhere else', () => {
    expect(existsSync(join(SRC, 'shared', 'sensitive-number.ts'))).toBe(true);
    const copies = sourceFiles(SRC)
      .filter((p) => /sensitive-number/.test(p))
      .map((p) => relative(SRC, p));
    expect(copies).toEqual(['shared/sensitive-number.ts']);
  });

  it('it is pure: imports only from shared/ (no module, no framework)', () => {
    const text = readFileSync(join(SRC, 'shared', 'sensitive-number.ts'), 'utf8');
    const imports = [...text.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    expect(imports).toEqual(['./redact']);
  });

  it('public-site re-exports it from shared/ (the one import line of website-request-rules.ts)', () => {
    const text = readFileSync(
      join(SRC, 'modules', 'public-site', 'internal', 'website-request-rules.ts'),
      'utf8',
    );
    expect(text).toMatch(/\} from '\.\.\/\.\.\/\.\.\/shared\/sensitive-number';/);
    expect(text).not.toMatch(/from '\.\/sensitive-number'/);
  });

  it('platform/public/validation still re-exports the same containsCardNumber', () => {
    expect(looksLikeCardNumber).toBe(containsCardNumber);
  });
});

describe('PR24PM-01 – containsCardNumber = card half of the detector OR the original rule', () => {
  // Only the detector reads these (the original rule allowed one ASCII space or dash between digits).
  it.each([
    ['zero-width spaces', `4111${ZWSP}1111${ZWSP}1111${ZWSP}1111`],
    ['full-width digits', fullWidth('4111 1111 1111 1111')],
    ['no-break spaces', `5555${NBSP}5555${NBSP}5555${NBSP}4444`],
    ['underscores', '4111_1111_1111_1111'],
    ['slashes', 'the card 4111/1111/1111/1111 please'],
    ['two spaces', '4111  1111  1111  1111'],
    ['a line break', 'Thẻ 4111 1111\n1111 1111'],
    ['percent-encoded spaces', '4111%201111%201111%201111'],
    ['digit by digit with commas', '4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1'],
    ['pairs with dashes (PR24PM-02)', '41-11-11-11-11-11-11-11'],
  ])('catches a card written with %s', (_label, text) => {
    expect(containsCardNumber(text)).toBe(true);
  });

  // The original rule keeps these – including a known miss of the detector (SEC-on-v104-be-d 2.1).
  it.each([
    ['plain', '4111111111111111'],
    ['grouped, inside a sentence', 'Thẻ 4111 1111 1111 1111 trả giúp'],
    ['dashes', '5555-5555-5555-4444'],
    ['detector miss: a date-like group', '4111 1111 11-11 1111'],
  ])('still catches what the original rule caught: %s', (_label, text) => {
    expect(containsCardNumber(text)).toBe(true);
  });

  it('the OR matters: the detector alone misses `4111 1111 11-11 1111`, the original rule alone misses ZWSP', () => {
    expect(looksLikeCard('4111 1111 11-11 1111')).toBe(false);
    expect(looksLikeCard(`4111${ZWSP}1111${ZWSP}1111${ZWSP}1111`)).toBe(true);
    expect(/\d(?:[ -]?\d){12,18}/.test(`4111${ZWSP}1111${ZWSP}1111${ZWSP}1111`)).toBe(false);
  });

  it.each([
    ['empty', ''],
    ['a date and a time', 'Đến 12/11/2026 lúc 22:30, 2 người'],
    ['a list of dates', '12/11, 13/11, 14/11/2026'],
    ['a phone with +84', 'Gọi (+84) 905-111-222 nhé'],
    ['two VN phones', '0905 111 222, 0912 333 444'],
    ['an amount', 'Đã chuyển 1.500.000 VND'],
    ['room numbers', 'Phòng 202, 203 và 301'],
    ['a booking code', 'Mã OTM-00379'],
    ['a flight', 'Chuyến VN 1234 hạ cánh 21h15'],
    ['16 digits with no Luhn-valid window', '1234 5678 1234 5678'],
  ])('never flags %s', (_label, text) => {
    expect(containsCardNumber(text)).toBe(false);
  });

  it('the ID half is not part of it (a 12-digit ID number is not a card)', () => {
    const fakeCccd = 'CCCD 079203012345';
    expect(looksLikeIdNumber(fakeCccd)).toBe(true);
    expect(containsCardNumber(fakeCccd)).toBe(false);
  });
});

describe('PR24PM-01 – error code unchanged', () => {
  it('assertNoCardNumber: 422 CARD_NUMBER_DETECTED, errors = field + code, the text is not echoed', () => {
    const typed = `Trả giúp thẻ 4111${ZWSP}1111${ZWSP}1111${ZWSP}1111`;
    let caught: unknown;
    try {
      assertNoCardNumber('note', typed);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ProblemError);
    const p = caught as ProblemError;
    expect(p.code).toBe('CARD_NUMBER_DETECTED');
    expect(p.status).toBe(422);
    expect(p.options.errors).toEqual([{ field: 'note', code: 'CARD_NUMBER_DETECTED' }]);
    expect(JSON.stringify({ message: p.message, options: p.options })).not.toMatch(/1111/);
  });

  it('assertNoCardNumber: null, empty and ordinary text pass', () => {
    expect(() => assertNoCardNumber('note', null)).not.toThrow();
    expect(() => assertNoCardNumber('note', '')).not.toThrow();
    expect(() => assertNoCardNumber('note', 'Đến 12/11 lúc 22:30')).not.toThrow();
  });
});

describe('PR24PM-01 – architecture: no Luhn and no card rule of its own outside src/shared/', () => {
  /** Signs of a hand-written Luhn check or V-09 card window. */
  const SIGNS: Array<[string, RegExp]> = [
    ['a function or const named luhn', /\b(?:function\s+luhn\w*|(?:const|let|var)\s+luhn\w*\s*=)/i],
    ['the Luhn checksum test', /%\s*10\s*===?\s*0\b/],
    ['the Luhn doubling step', /\*=?\s*2\b[\s\S]{0,80}?-=?\s*9\b/],
    ['the 13–19 digit card window', /\{1[23],1[89]\}/],
  ];

  it('the signs find the one real copy (the scan has teeth)', () => {
    const redact = readFileSync(join(SRC, 'shared', 'redact.ts'), 'utf8');
    const validation = readFileSync(join(SRC, 'shared', 'validation.ts'), 'utf8');
    expect(SIGNS[1]![1].test(redact)).toBe(true);
    expect(SIGNS[2]![1].test(redact)).toBe(true);
    expect(SIGNS[3]![1].test(validation)).toBe(true);
    expect(SIGNS[0]![1].test('function luhn(digits: string): boolean {')).toBe(true);
  });

  it('no source file outside src/shared/ matches any sign', () => {
    const hits: string[] = [];
    for (const p of sourceFiles(SRC)) {
      const rel = relative(SRC, p).split('\\').join('/');
      if (rel.startsWith('shared/')) continue;
      const text = readFileSync(p, 'utf8');
      for (const [label, re] of SIGNS) if (re.test(text)) hits.push(`${rel}: ${label}`);
    }
    expect(hits).toEqual([]);
  });

  it('inside src/shared/ the Luhn loop is written once (redact.ts luhnValid)', () => {
    const owners = sourceFiles(join(SRC, 'shared'))
      .filter((p) => /%\s*10\s*===?\s*0\b/.test(readFileSync(p, 'utf8')))
      .map((p) => relative(SRC, p).split('\\').join('/'));
    expect(owners).toEqual(['shared/redact.ts']);
  });
});
