// @vitest-environment node
// copy-v1.0.5 5.3 (FB-R5-CPY-UXD-V105-11): automatic check of every guest-facing string in design/copy – the guest
// page (`guest.*`, `gw.*`), message templates (`msg.*`), the quote text (`sale.quote_text*`) and bill lines
// (`bill.line.*`), the quote's counted phrases and the shared keys the guest page ships (CPY 167-01). Reads the
// full UXD files (not the filtered dictionary guest-web ships), because the quote,
// templates and bill lines reach the guest through other apps. Steps are switched on as the copy lands:
//   1. RU: no апартамент / квартир / посуточн (same list as landing-web/scripts/dist-checks.mjs) – V5-24, 5.1
//   2. RU: no "депозит" – CPY thẻ 01 ("Предоплата")
//   3. VI: no standalone "căn" – 4.20 (a), (b); 4.20 (c) keys wait for v1.0.6 (R5-B-03, with C6)
//   4. no "!" and no emoji, every language – 4.21, thẻ 06; RU keeps the greeting "Здравствуйте, {name}!"
//   5. VI: no "phụ thu" – after C6 (v1.0.6), not on yet
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectUsedKeys, isShipped } from '../../build/used-keys';

const PRODUCT = join(__dirname, '..', '..', '..', '..');
const COPY = join(PRODUCT, 'design', 'copy');
type Locale = 'vi' | 'en' | 'ru';

const GUEST_FACING = /^(guest\.|gw\.|msg\.|sale\.quote_text|bill\.line\.)/;
/**
 * CPY 167-01: plus every key the quote text is built from (the keys gen-quote-copy.mjs writes into quote-copy.ts:
 * `sale.quote_nights_*`, `_adults_*`, `_kids_*`, `_under6_*` …) and every key guest-web ships from the shared
 * families (`common.*`, `error.*`, `field.*`, `shell.skip` – build/used-keys.ts, the same filter as the bundle).
 */
const QUOTE_KEYS = new Set(
  [
    ...readFileSync(
      join(PRODUCT, 'services', 'api', 'src', 'generated', 'quote-copy.ts'),
      'utf8',
    ).matchAll(/'(sale\.[\w.]+)':/g),
  ].map((m) => m[1]!),
);
const USED = collectUsedKeys(join(__dirname, '..'));
const isGuestFacing = (k: string) =>
  GUEST_FACING.test(k) || QUOTE_KEYS.has(k) || isShipped(k, USED);

function guestStrings(locale: Locale): [string, string][] {
  const all = JSON.parse(readFileSync(join(COPY, `strings-${locale}.json`), 'utf8')) as Record<
    string,
    unknown
  >;
  return Object.entries(all).filter(
    (e): e is [string, string] => isGuestFacing(e[0]) && typeof e[1] === 'string',
  );
}

const offenders = (locale: Locale, bad: RegExp, skip: ReadonlySet<string> = new Set()) =>
  guestStrings(locale)
    .filter(([k, v]) => !skip.has(k) && bad.test(v))
    .map(([k, v]) => `${k}: ${v}`);

/** 4.20 (c): these still say "căn" until v1.0.6. Fix one → remove it here (the last case fails until then). */
const CAN_UNTIL_V106: ReadonlySet<string> = new Set([
  'bill.line.room_night_room',
  'bill.line.extra_night_room',
  'bill.line.room_change',
  'guest.stay.room',
  'guest.late.how_1',
  'gw.room',
]);
const CAN = /(?<!\p{L})căn(?!\p{L})/iu;

/** RU greeting with the guest's name keeps "!" (CPY mục 3 câu 2 – on the native-speaker list). */
const RU_GREETING = /^Здравствуйте, \{name\}!/u;
const EMOJI = /\p{Emoji_Presentation}|\u{FE0F}/u; // U+FE0F = emoji presentation selector

describe('guest-facing copy (copy-v1.0.5 5.3)', () => {
  it('covers the guest families in all three languages', () => {
    expect(guestStrings('vi').length).toBeGreaterThan(200);
    expect(guestStrings('en').length).toBeGreaterThan(200);
    expect(guestStrings('ru').length).toBeGreaterThan(100);
    expect(guestStrings('ru').map(([k]) => k)).toEqual(
      expect.arrayContaining([
        'sale.quote_text',
        'msg.booking_confirmed',
        'guest.stay.checkin_time',
      ]),
    );
    // CPY 167-01: the quote's counted phrases and the shared keys the guest page shows are in scope too
    expect(QUOTE_KEYS.size).toBeGreaterThanOrEqual(17);
    expect(guestStrings('en').map(([k]) => k)).toEqual(
      expect.arrayContaining([
        'sale.quote_nights_one',
        'sale.quote_adults_other',
        'sale.quote_kids_few',
        'sale.quote_under6_many',
        'error.CARD_NUMBER_DETECTED',
        'error.GUEST_LINK_INVALID',
        'field.TOO_MANY_FILES',
        'shell.skip',
      ]),
    );
  });

  it('step 1 – RU: no "апартаменты", "квартира", "посуточно" (V5-24)', () => {
    expect(offenders('ru', /апартамент|квартир|посуточн/iu)).toEqual([]);
  });

  it('step 2 – RU: no "депозит" – the quote says "Предоплата" (CPY thẻ 01)', () => {
    expect(offenders('ru', /депозит/iu)).toEqual([]);
  });

  it('step 3 – VI: the guest reads "phòng", never the internal "căn" (FB-INV-002)', () => {
    expect(offenders('vi', CAN, CAN_UNTIL_V106)).toEqual([]);
  });

  it('step 4 – no "!" and no emoji (brand voice); RU keeps only the greeting "Здравствуйте, {name}!"', () => {
    for (const locale of ['vi', 'en', 'ru'] as const) {
      const bad = guestStrings(locale)
        .filter(([, v]) => {
          const text = locale === 'ru' ? v.replace(RU_GREETING, '') : v;
          return text.includes('!') || EMOJI.test(text);
        })
        .map(([k, v]) => `${k}: ${v}`);
      expect(bad, locale).toEqual([]);
    }
  });

  it.todo('step 5 – VI: no "phụ thu" (after C6, v1.0.6)');

  it('the v1.0.6 "căn" list is still needed – remove a key once its text is fixed', () => {
    const vi = Object.fromEntries(guestStrings('vi'));
    const stale = [...CAN_UNTIL_V106].filter((k) => !(k in vi) || !CAN.test(vi[k]!));
    expect(stale).toEqual([]);
  });
});
