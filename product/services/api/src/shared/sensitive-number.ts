/**
 * V-09 / SR-LOG-04 – the ONE detector of card and identity-document numbers in guest-typed text. Every caller uses it:
 * the website form (US-155 AC5: 422 `CARD_NUMBER_DETECTED` / `ID_NUMBER_DETECTED` on the name and the message), the
 * decline note, the Google Chat text (`chatSafeText`, SEC ★5), and – card half only – the shared V-09 check
 * `containsCardNumber` of every other module (`shared/validation.ts`, ARC FB-R4-ARC-BE-PR24PM-01: one module, pure
 * functions, in `shared/`; the Luhn step is `luhnValid` of `shared/redact.ts`, no other copy).
 * History: BUG-R3-009 (grouped digits), BUG-R3-057 (numbers joined by a cleaning step), BUG-R3-058 (form: hidden
 * characters, `_` `/` `,`, full-width digits), SEC FB-R3-SEC-BE-GCHAT-07, QA FB-R3-QA-BE-GCHAT-06,
 * SEC lp-v2-privacy-and-api 10 (Korean / Chinese / Russian IDs).
 *
 * The rules read a CHECK COPY of the text – never printed, stored or logged:
 *   1. `%XX` runs decoded (a number pasted from a link: `4111%201111…`, `079%E2%80%8B203…`). Every rule also runs on
 *      a copy WITHOUT this step and the results are OR-ed: decoding may only add findings (`%2B079203012345` is not a
 *      `+` phone – SEC FB-R4-SEC-BE-PR24-02);
 *   2. NFKD, every mark (`\p{M}`: combining accents on digits, keycaps, U+034F, variation selectors) and every
 *      Default_Ignorable code point (ZWSP, WJ, soft hyphen, bidi marks, U+3164 Hangul filler…) dropped, NFKC
 *      (full-width / circled / superscript / mathematical digits, NBSP and other spaces), control characters dropped,
 *      every `\p{Nd}` digit read as ASCII, U+2800 (Braille blank) read as a space;
 *   3. Unicode dashes (en dash, U+2010, U+2011, U+2212…) read as `-`, middle dots as `·`, typographic apostrophes as
 *      `'`, `。` `、` as `.` `,`; `(+84)` and `+84 (0)` read as `+84`; `№` / `номер` between digits read as a space;
 *   4. dates and times (`23.10.2026`, `12/11`, `22:30`, `22h30`) blanked, so dates side by side never read as a number.
 *      Never inside four or more two-digit groups joined by one same mark: a number read out in pairs
 *      (`41-11-11-11-11-11-11-11`, `07.92.03.01.23.45` – ARC FB-R4-ARC-BE-PR24PM-02).
 *
 * Digit groups are then joined into RUNS. A join is one of ` ` `.` `-` (BUG-R3-009 "tight" grouping), one of
 * `_` `/` `,` `'` `·`, any run of spaces / line breaks, a dash with spaces around it (`079 - 203`), or a run of two or
 * more of those marks (`079__203`, `079_/203`). A comma or dot FOLLOWED BY A SPACE ends a run: `0905 111 222,
 * 0905 333 444` stays two phone numbers.
 *
 * In a run:
 *   - card: a Luhn-valid 13–19 digit window inside a tight part (BUG-R3-009 rule, unchanged), or whole groups adding up
 *     to 13–19 Luhn-valid digits when the groups look like a card (all ≥ 4 digits, or all ≤ 2 – split digit by digit);
 *   - ID: whole consecutive groups adding up to 9 (CMND, Russian international passport) or 12 digits (CCCD), also
 *     next to another number (`CCCD 079203012345 2 người`); a Korean resident number `YYMMDD-NNNNNNN`; a Chinese
 *     resident ID (18 characters with a birth date, last one may be `X`); a Russian internal passport `NN NN NNNNNN`
 *     or `NNNN NNNNNN` (also `45 06 № 123456`);
 *   - not an ID: the phone part of a run after `+`, `00` + country code (`0084`, `00 84`) or starting with `84` (the
 *     first ≥ 11 digits after the prefix: `+84 905 111 222`, `(+84) 905-111-222`, `84 905 111 222`); an amount with
 *     thousands separators, not starting with 0, whose last two groups are `000` (`150,000,000`, `1.500.000.000` – BUG-R4-016); an amount
 *     ending in `000` next to its currency, before or after (`150 000 000 VND`, `VND 150,000,000`, `₫150.000.000`, also
 *     each side of a range `100 000 000 - 150 000 000 đ`). `đồng ý` and a bare `dong` are not currencies.
 * Passport: 1–2 Latin letters + 7–8 digits, capital or small (`c1234567`), one space allowed after capitals
 * (`C 1234567`) or after a passport keyword (`hộ chiếu c 1234567`); Korean new model `M123A4567`.
 *
 * Known over-masking, accepted by SEC (fails safe, Desk keeps the original): three room numbers `201,202,203`, a
 * 9-digit number without separators or currency, two phone numbers joined by one tight mark (`0905111222
 * 0912333444`), phones with a country code but no `+` other than 84 (`86 138 0013 8000`, `8 912 345 67 89`).
 */

import { luhnValid } from './redact';

export type SensitiveNumberKind = 'card' | 'id';

// ───────────────────────── check copy ─────────────────────────

const PERCENT_RUN = /(?:%[0-9A-Fa-f]{2})+/g;
const IGNORABLE = /\p{Default_Ignorable_Code_Point}/gu;
const MARK = /\p{M}/gu;
/** Control characters except the whitespace ones (U+0085 NEL is turned into a line break before). */
const CONTROL = /[^\P{Cc}\t\n\v\f\r]/gu;
const NON_ASCII_DIGIT = /(?![0-9])\p{Nd}/gu;
const IS_DIGIT = /^\p{Nd}$/u;
const BRAILLE_BLANK = /\u2800/g;
const DASH = /[\p{Pd}−⁃]/gu;
const MIDDLE_DOT = /[·•‧∙⋅・]/g;
const APOSTROPHE = /[’ʼ′]/g;
const PHONE_CC_IN_PARENS = /\(\s*\+\s*(\d{1,4})\s*\)/g;
const PHONE_TRUNK_ZERO = /(\+\s?\d{1,4})\s*\(\s*0\s*\)/g;
/**
 * A number sign between series and number of a Russian passport (`45 06 № 123456`, `4506 номер 123456` – SEC
 * FB-R4-SEC-BE-PR24-01): NFKC has made `№` into `No`; any case, a `:` after it (`45 06 Номер: 123456`); read as a
 * space so the groups stay one run.
 */
const NUMBER_SIGN = /(?<=\d)\s*(?:No\.?|N[o°º]|номер|nr\.?)\s*:?\s*(?=\d)/giu;
const DATE = /(?<!\d)\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?(?!\d)/g;
/**
 * Four or more groups of exactly two digits joined by the SAME `.` `-` `/` (`41-11-11-11-11-11-11-11`,
 * `07.92.03.01.23.45`): a number read out in pairs, never a date (ARC FB-R4-ARC-BE-PR24PM-02).
 */
const PAIR_CHAIN = /(?<!\d)\d{2}([./-])\d{2}(?:\1\d{2}){2,}(?!\d)/g;
const TIME = /(?<!\d)\d{1,2}[:h]\d{2}(?!\d)/g;
/** What a blanked date or time becomes: `|` is not a join, so it ends a run. */
const BREAK = ' | ';

/** `%XX` runs decoded; an invalid UTF-8 sequence becomes a space. */
function decodePercent(s: string): string {
  return s.replace(PERCENT_RUN, (run) => {
    try {
      return decodeURIComponent(run);
    } catch {
      return ' ';
    }
  });
}

/** Every Nd digit as its ASCII value: Unicode puts each Nd digit in a contiguous 0–9 run, so the run start is zero. */
function asciiDigits(s: string): string {
  return s.replace(NON_ASCII_DIGIT, (d) => {
    const cp = d.codePointAt(0) ?? 0;
    let zero = cp;
    while (zero > 0 && IS_DIGIT.test(String.fromCodePoint(zero - 1))) zero -= 1;
    return String((cp - zero) % 10);
  });
}

/** Copy for the passport rule: letters keep their accents (`ở 1234567` is Vietnamese, not a passport). */
function lettersCopy(text: string, decode = true): string {
  return asciiDigits(
    (decode ? decodePercent(text) : text)
      .replace(/\u0085/g, '\n')
      .normalize('NFKC')
      .replace(IGNORABLE, '')
      .replace(CONTROL, ''),
  );
}

/**
 * Copy for the digit rules (steps 1–4 of the header). `decode = false` keeps `%XX` as typed: every rule runs on both
 * copies and the results are OR-ed, so decoding can only ADD findings – a `%2B` never becomes the `+` of a phone
 * exception (SEC FB-R4-SEC-BE-PR24-02).
 */
function digitsCopy(text: string, decode = true): string {
  const k = (decode ? decodePercent(text) : text)
    .replace(/\u0085/g, '\n')
    .normalize('NFKD')
    .replace(MARK, '')
    .replace(IGNORABLE, '')
    .replace(CONTROL, '')
    .normalize('NFKC');
  return blankDates(
    asciiDigits(k)
      .replace(BRAILLE_BLANK, ' ')
      .replace(DASH, '-')
      .replace(MIDDLE_DOT, '·')
      .replace(APOSTROPHE, "'")
      .replace(/。/g, '.')
      .replace(/、/g, ',')
      .replace(PHONE_CC_IN_PARENS, '+$1')
      .replace(PHONE_TRUNK_ZERO, '$1')
      .replace(NUMBER_SIGN, ' '),
  ).replace(TIME, BREAK);
}

/**
 * Step 4 for dates: every date cluster is blanked, except inside a pair chain (ARC FB-R4-ARC-BE-PR24PM-02), whose
 * digits go to the rules. ARC also proposed "only a real day and month"; not applied: `8 912 345-67-89` (Russian phone)
 * would then read `8 912 345 67 89` as a 9-digit ID (a "must stay" case), and the pair chain alone closes both holes.
 */
function blankDates(t: string): string {
  const chains = [...t.matchAll(PAIR_CHAIN)].map((m) => [m.index, m.index + m[0].length] as const);
  return t.replace(DATE, (m: string, at: number) =>
    chains.some(([s, e]) => at < e && at + m.length > s) ? m : BREAK,
  );
}

// ───────────────────────── runs of digit groups ─────────────────────────

const TIGHT_JOIN = /^[ .-]$/;
const JOIN = /^(?:[_/,'·]|\s+|\s*-[\s-]*|[._/,'·-]{2,})$/;

interface Run {
  /** Digit groups, in order. */
  g: string[];
  /** tight[i]: the join between g[i] and g[i+1] is one ` ` `.` `-`. */
  tight: boolean[];
  /** dash[i]: that join has a dash (a range `100 - 150`). */
  dash: boolean[];
  /** gap[i]: the join itself (thousands separators of an amount). */
  gap: string[];
  /** The last group is followed by `X` (Chinese resident ID check character). */
  x: boolean;
  before: string;
  after: string;
}

const NOT_ALNUM = /^[^\p{L}\p{N}]?$/u;

function runsOf(t: string): Run[] {
  const runs: Run[] = [];
  let cur: Run | null = null;
  let lastEnd = 0;
  const close = () => {
    if (cur) {
      cur.after = t.slice(lastEnd, lastEnd + 10);
      runs.push(cur);
    }
  };
  for (const m of t.matchAll(/\d+/g)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    const gap = t.slice(lastEnd, start);
    if (cur && !cur.x && (TIGHT_JOIN.test(gap) || JOIN.test(gap))) {
      cur.g.push(m[0]);
      cur.tight.push(TIGHT_JOIN.test(gap));
      cur.dash.push(gap.includes('-'));
      cur.gap.push(gap);
    } else {
      close();
      cur = {
        g: [m[0]],
        tight: [],
        dash: [],
        gap: [],
        x: false,
        before: t.slice(Math.max(0, start - 6), start),
        after: '',
      };
    }
    lastEnd = end;
    if ((t[end] === 'X' || t[end] === 'x') && NOT_ALNUM.test(t[end + 1] ?? '')) {
      cur.x = true;
      lastEnd = end + 1;
    }
  }
  close();
  return runs;
}

// ───────────────────────── card (Luhn) ─────────────────────────

function cardIn(r: Run): boolean {
  // BUG-R3-009 rule: any Luhn-valid 13–19 window of a part joined by single ` ` `.` `-`.
  for (let i = 0; i < r.g.length;) {
    let k = i;
    while (k < r.g.length - 1 && r.tight[k]) k += 1;
    const d = r.g.slice(i, k + 1).join('');
    for (let len = 13; len <= Math.min(19, d.length); len += 1) {
      for (let s = 0; s + len <= d.length; s += 1) if (luhnValid(d.slice(s, s + len))) return true;
    }
    i = k + 1;
  }
  // Whole groups (any join) that look like a card: all ≥ 4 digits, or split digit by digit.
  for (let i = 0; i < r.g.length; i += 1) {
    let sum = 0;
    for (let k = i; k < r.g.length; k += 1) {
      sum += r.g[k]!.length;
      if (sum > 19) break;
      if (sum < 13 || k === i) continue;
      const lens = r.g.slice(i, k + 1).map((s) => s.length);
      if (!lens.every((l) => l >= 4) && !lens.every((l) => l <= 2)) continue;
      if (luhnValid(r.g.slice(i, k + 1).join(''))) return true;
    }
  }
  return false;
}

// ───────────────────────── identity documents ─────────────────────────

const PLUS_BEFORE = /\+\s?$/;
/** Currency right before a run: a symbol, or `đ` / `VND` / `VNĐ` / `USD` / `EUR` as a word (BUG-R4-016). */
const MONEY_BEFORE = /(?:[$€£¥₩₫]|(?<!\p{L})(?:đ|vn[dđ]|usd|eur))\s?$/iu;
/**
 * Currency right after a run (check copy: accents dropped – `đồng` is `đong`, `triệu` is `trieu`). `đồng ý` (agree)
 * and a bare `dong` are not currencies (SEC FB-R4-SEC-BE-PR24-02).
 */
const MONEY_AFTER =
  /^\s?(?:₫|€|\$|원|元|块|₽|руб|đong(?!\p{L})(?!\s*y(?!\p{L}))|(?:đ|vn[dđ]|usd|eur|k|tr|trieu|nghin|ngan|won|rub)(?!\p{L}))/iu;

/**
 * Groups `[i..k]` of an amount written with thousands separators: the first group 1–3 digits, then ≥ 2 groups of 3,
 * one same separator (`.` `,` or a space), the last two groups `000` (`150,000,000`, `1.500.000.000` – BUG-R4-016).
 * Missed ID: one ending in `000000` (≈ 1 in a million).
 */
function amountSpans(r: Run): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  const n = r.g.length;
  for (let i = 0; i < n - 2; i += 1) {
    // An amount never starts with 0 (QA PR #24 lượt 2: `079 203 012 345 000 000` stays an ID).
    if (r.g[i]!.length > 3 || r.g[i]![0] === '0') continue;
    const sep = r.gap[i];
    if (sep !== '.' && sep !== ',' && sep !== ' ') continue;
    let k = i + 1;
    while (k < n && r.g[k]!.length === 3 && (k === i + 1 || r.gap[k - 1] === sep)) k += 1;
    for (let end = k - 1; end >= i + 2; end -= 1) {
      if (r.g[end] === '000' && r.g[end - 1] === '000') {
        spans.push([i, end]);
        break;
      }
    }
  }
  return spans;
}

/**
 * An international phone prefix: `+` before the run, a first group `84` (or `84…` of 11 digits), or `00` then the
 * country code – `00 84 …`, `0084 …`, `0084905111222`. Only 84 after `0084`: a CCCD of province 008 can start
 * `0082`/`0086` but never `0084` (4 = born in the 2100s).
 */
function phonePrefixDigits(r: Run): number | null {
  const g0 = r.g[0]!;
  if (PLUS_BEFORE.test(r.before) || g0 === '84' || (g0.startsWith('84') && g0.length === 11)) {
    return 0;
  }
  // After `00` the country code never starts with 0 (`00 079203012345` stays an ID – QA PR #24 lượt 2).
  const g1 = r.g[1] ?? '';
  if (
    (g0 === '00' && g1 !== '' && g1[0] !== '0') ||
    g0 === '0084' ||
    (g0.startsWith('0084') && g0.length === 13)
  ) {
    return 2; // the `00` itself
  }
  return null;
}

const between = (n: number, lo: number, hi: number) => n >= lo && n <= hi;

/** Korean resident registration number YYMMDD-SNNNNNN (one group of 13, or 6 + 7). */
function koreanId(d: string, lens: number[]): boolean {
  if (!(lens.length === 1 || (lens.length === 2 && lens[0] === 6))) return false;
  return (
    between(Number(d.slice(2, 4)), 1, 12) &&
    between(Number(d.slice(4, 6)), 1, 31) &&
    between(Number(d[6]), 1, 8)
  );
}

/** Chinese resident ID: 6 region + YYYYMMDD + 3 + check digit or X. */
function chineseId(d18: string): boolean {
  return (
    between(Number(d18.slice(6, 10)), 1900, 2099) &&
    between(Number(d18.slice(10, 12)), 1, 12) &&
    between(Number(d18.slice(12, 14)), 1, 31)
  );
}

/** Russian internal passport: series NN NN (or NNNN) + number NNNNNN. Not a VN phone (0…) or a 1800/1900 line. */
function russianPassport(d: string, lens: number[]): boolean {
  const shape =
    (lens.length === 3 && lens[0] === 2 && lens[1] === 2 && lens[2] === 6) ||
    (lens.length === 2 && lens[0] === 4 && lens[1] === 6);
  return shape && d[0] !== '0' && !/^1[89]00/.test(d);
}

function idIn(r: Run): boolean {
  const len = r.g.map((s) => s.length);
  const n = len.length;
  // The phone part of an international number: its first ≥ 11 digits after the prefix (`+`, 84, 00).
  let from = 0;
  const prefix = phonePrefixDigits(r);
  if (prefix !== null) {
    for (let sum = -prefix; from < n && sum < 11; from += 1) sum += len[from]!;
  }
  const moneyBefore = MONEY_BEFORE.test(r.before);
  const moneyAfter = MONEY_AFTER.test(r.after);
  const amounts = amountSpans(r);
  const amountGroup = r.g.map((_, j) => amounts.some(([a, b]) => a <= j && j <= b));
  // Every group inside an amount (also across the dash of a range `100,000,000-150,000,000`).
  const inAmount = (i: number, k: number) => amountGroup.slice(i, k + 1).every(Boolean);
  const segmentStart = (i: number) => i === from || r.dash[i - 1] === true;
  const segmentEnd = (k: number) => k === n - 1 || r.dash[k] === true;
  for (let i = from; i < n; i += 1) {
    let sum = 0;
    for (let k = i; k < n; k += 1) {
      sum += len[k]!;
      if (sum > 18) break;
      // An amount: each side of a range is its own amount (never read across the dash).
      if ((moneyBefore || moneyAfter) && k > i && r.dash[k - 1] === true) break;
      const d = r.g.slice(i, k + 1).join('');
      // Currency next to it only excuses what looks like money: ending in 000 (SEC PR24-02: `ID - 500k`, `ID dong`).
      const money = d.endsWith('000') && d[0] !== '0';
      if (moneyBefore && segmentStart(i) && money) continue;
      if (moneyAfter && segmentEnd(k) && money) continue;
      if (inAmount(i, k)) continue;
      if (sum === 9 || sum === 12) return true;
      const lens = len.slice(i, k + 1);
      if (sum === 13 && koreanId(d, lens)) return true;
      if (sum === 10 && russianPassport(d, lens)) return true;
      const xEnd = r.x && k === n - 1;
      if ((sum === 18 && !xEnd) || (sum === 17 && xEnd)) {
        if (chineseId(xEnd ? `${d}X` : d)) return true;
      }
    }
  }
  return false;
}

/** BUG-R3-009 rule as it was, and the widened one (small letters; one space after capitals or after a keyword). */
const PASSPORT_RULES = [
  /\b[A-Z]{1,2}\d{7,8}\b/,
  /(?<![\p{L}\p{N}])(?:[A-Za-z]{1,2}|[A-Z]{1,2} )\d{7,8}(?![\p{L}\p{N}])/u,
  /(?:passport|hộ\s?chiếu|ho\s?chieu|паспорт|여권|护照|護照)[^\p{L}\p{N}]{0,3}[a-z]{1,2}\s?\d{7,8}(?!\p{N})/iu,
  // Russian internal passport written in one group after the keyword (`паспорт 4506123456`, `серия 4506123456`).
  /(?:passport|hộ\s?chiếu|ho\s?chieu|паспорт|серия)[^\p{L}\p{N}]{0,3}\d{2}\s?\d{2}\s?\d{6}(?!\p{N})/iu,
  // Korean passport, new model since 2021: letter + 3 digits + letter + 4 digits (`M123A4567` – SEC PR24-01).
  /(?<![\p{L}\p{N}])[A-Z]\d{3}[A-Z]\d{4}(?![\p{L}\p{N}])/u,
  /(?:passport|여권|hộ\s?chiếu|ho\s?chieu)[^\p{L}\p{N}]{0,3}[a-z]\d{3}[a-z]\d{4}(?![\p{L}\p{N}])/iu,
];

function passportIn(text: string): boolean {
  return [lettersCopy(text), lettersCopy(text, false)].some((t) =>
    PASSPORT_RULES.some((re) => re.test(t)),
  );
}

/** The runs of both check copies (decoded and as typed – SEC PR24-02). */
function runsOfBoth(text: string): Run[] {
  return [...runsOf(digitsCopy(text)), ...runsOf(digitsCopy(text, false))];
}

// ───────────────────────── API ─────────────────────────

/** Card first (the form's order: `CARD_NUMBER_DETECTED` before `ID_NUMBER_DETECTED`), then ID, else null. */
export function sensitiveNumberKind(text: string): SensitiveNumberKind | null {
  const runs = runsOfBoth(text);
  if (runs.some(cardIn)) return 'card';
  if (runs.some(idIn) || passportIn(text)) return 'id';
  return null;
}

export function looksLikeSensitiveNumber(text: string): boolean {
  return sensitiveNumberKind(text) !== null;
}

/** The card half of the same detector (kept for the existing unit tests and callers). */
export function looksLikeCard(text: string): boolean {
  return runsOfBoth(text).some(cardIn);
}

/** The ID half of the same detector. */
export function looksLikeIdNumber(text: string): boolean {
  return runsOfBoth(text).some(idIn) || passportIn(text);
}
