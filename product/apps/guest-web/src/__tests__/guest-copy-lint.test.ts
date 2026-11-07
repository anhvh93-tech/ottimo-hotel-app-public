// @vitest-environment node
// copy-v1.0.5 5.3 (FB-R5-CPY-UXD-V105-11): automatic check of every guest-facing string in design/copy – the guest
// page (`guest.*`, `gw.*`), message templates (`msg.*`), the quote text (`sale.quote_text*`) and bill lines
// (`bill.line.*`). Reads the full UXD files (not the filtered dictionary guest-web ships), because the quote,
// templates and bill lines reach the guest through other apps. Steps are switched on as the copy lands:
//   1. RU: no апартамент / квартир / посуточн (same list as landing-web/scripts/dist-checks.mjs) – V5-24, 5.1
//   2. RU: no "депозит" – CPY thẻ 01 ("Предоплата")
//   3. VI: no standalone "căn" – 4.20 (a), (b); 4.20 (c) keys wait for v1.0.6 (R5-B-03, with C6)
//   4. no "!" and no emoji, every language – 4.21, thẻ 06; RU keeps the greeting "Здравствуйте, {name}!"
//   5. VI: no "phụ thu" – after C6 (v1.0.6), not on yet
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const COPY = join(__dirname, '..', '..', '..', '..', 'design', 'copy');
type Locale = 'vi' | 'en' | 'ru';

const GUEST_FACING = /^(guest\.|gw\.|msg\.|sale\.quote_text|bill\.line\.)/;

function guestStrings(locale: Locale): [string, string][] {
  const all = JSON.parse(readFileSync(join(COPY, `strings-${locale}.json`), 'utf8')) as Record<
    string,
    unknown
  >;
  return Object.entries(all).filter(
    (e): e is [string, string] => GUEST_FACING.test(e[0]) && typeof e[1] === 'string',
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
const EMOJI = /\p{Emoji_Presentation}|️/u;

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
