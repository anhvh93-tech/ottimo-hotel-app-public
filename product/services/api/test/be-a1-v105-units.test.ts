/**
 * BE-A1 v1.0.5 – pure rules, no DB (OpenAPI 0.3.13; contract 0.3.13 1.1, 1.19, 1.21):
 * - shared/business-day.ts: W, "ngày lịch tối thiểu", the post-midnight window, B18's day (BR-010 v0.5.12).
 * - V5-10 `resolveCheckoutAt` (checkout-at.ts): one departure instant for the summary, the QR and B18 – T10-1…T10-4,
 *   T10-8, T10-9 at the rule level (BUG-R4-051; BE C0313-01, 07, 08).
 * - V5-10 `allowedActions.check_out` on the effective departure from 00:00 of the departure day (BUG-R4-036;
 *   BE C0313-09, T15-15) and the same rule as the "Hôm nay" row.
 * - `Fields.text` drops control / invisible formatting characters (SEC FB-R5-SEC-BE-A1B-01, D12c).
 * Fake dates only.
 */
import { describe, expect, it } from 'vitest';
import { resolveCheckoutAt } from '../src/modules/frontdesk/internal/checkout-at';
import { checkOutAction } from '../src/modules/reporting/internal/stay-actions';
import {
  type ActionContext,
  allowedActions,
} from '../src/modules/reservations/internal/allowed-actions';
import { Fields } from '../src/modules/reservations/internal/inputs';
import {
  dayClock,
  inEarlyHours,
  inPostMidnightWindow,
  isCheckoutDay,
  minCalendarDate,
} from '../src/shared/business-day';

const TZ = 'Asia/Ho_Chi_Minh';
const at = (local: string) => new Date(`${local}:00+07:00`);

describe('shared/business-day (BR-010 v0.5.12)', () => {
  it('W = 00:00 to before the rollover: business date D, calendar date D + 1', () => {
    expect(dayClock(at('2026-11-24T01:05'), TZ, '06:00')).toEqual({
      today: '2026-11-23',
      calendarDate: '2026-11-24',
    });
    expect(dayClock(at('2026-11-24T05:59'), TZ, '06:00').today).toBe('2026-11-23');
    expect(dayClock(at('2026-11-24T06:00'), TZ, '06:00')).toEqual({
      today: '2026-11-24',
      calendarDate: '2026-11-24',
    });
    expect(inEarlyHours(dayClock(at('2026-11-24T00:00'), TZ, '06:00'))).toBe(true);
    expect(inEarlyHours(dayClock(at('2026-11-23T23:59'), TZ, '06:00'))).toBe(false);
  });

  it('"ngày lịch tối thiểu": D + 1 in W, else the business date', () => {
    expect(minCalendarDate({ today: '2026-11-23', calendarDate: '2026-11-24' })).toBe('2026-11-24');
    expect(minCalendarDate({ today: '2026-11-24', calendarDate: '2026-11-24' })).toBe('2026-11-24');
  });

  it("B18's day: business date = departure, or the departure's post-midnight window", () => {
    const w = { today: '2026-11-23', calendarDate: '2026-11-24' };
    expect(inPostMidnightWindow(w, '2026-11-24')).toBe(true);
    expect(isCheckoutDay(w, '2026-11-24')).toBe(true);
    // A stay leaving 23/11 at 01:05 on 24/11 is still on its departure business day.
    expect(isCheckoutDay(w, '2026-11-23')).toBe(true);
    expect(isCheckoutDay(w, '2026-11-25')).toBe(false);
    const day = { today: '2026-11-24', calendarDate: '2026-11-24' };
    expect(inPostMidnightWindow(day, '2026-11-24')).toBe(false);
    expect(isCheckoutDay(day, '2026-11-24')).toBe(true);
    expect(isCheckoutDay(day, '2026-11-25')).toBe(false);
  });
});

describe('V5-10 resolveCheckoutAt – one departure instant (checkOut "Quy đổi giờ trả")', () => {
  const base = {
    departureDate: '2026-11-23',
    tz: TZ,
    rollover: '06:00',
    toleranceMinutes: 30,
    checkedInAt: at('2026-11-21T15:00'),
    // A typed `checkoutTime` unless the case says otherwise (DOM PR106-01).
    typed: true,
  };
  const iso = (d: Date | undefined) => d?.toISOString();

  it('T10-1 (BUG-R4-051): 07:00 on the departure day typing 05:30 → that morning, no surcharge, note required', () => {
    const r = resolveCheckoutAt({ ...base, now: at('2026-11-23T07:00'), time: '05:30' });
    expect(iso(r?.at)).toBe(iso(at('2026-11-23T05:30')));
    expect(r).toMatchObject({
      sent: false,
      postMidnight: true,
      afterNow: false,
      noteRequired: true,
    });
    // Within the tolerance → no note.
    const close = resolveCheckoutAt({ ...base, now: at('2026-11-23T06:10'), time: '05:50' });
    expect(close).toMatchObject({ postMidnight: true, noteRequired: false });
  });

  it('T10-2: 01:05 on departure + 1 typing 01:00 → departure + 1 01:00 (after the last tier – extra night)', () => {
    const r = resolveCheckoutAt({ ...base, now: at('2026-11-24T01:05'), time: '01:00' });
    expect(iso(r?.at)).toBe(iso(at('2026-11-24T01:00')));
    expect(r).toMatchObject({ postMidnight: false, afterNow: false, noteRequired: false });
  });

  it('T10-3: 00:30 on the departure calendar day typing 00:20 → the post-midnight window', () => {
    const r = resolveCheckoutAt({ ...base, now: at('2026-11-23T00:30'), time: '00:20' });
    expect(iso(r?.at)).toBe(iso(at('2026-11-23T00:20')));
    expect(r).toMatchObject({ postMidnight: true, afterNow: false });
  });

  it('T10-4: a typed time in the future beyond the tolerance → the earliest candidate, afterNow', () => {
    const r = resolveCheckoutAt({ ...base, now: at('2026-11-23T10:00'), time: '11:00' });
    expect(iso(r?.at)).toBe(iso(at('2026-11-23T11:00')));
    expect(r).toMatchObject({ afterNow: true, noteRequired: false });
    // Within the tolerance: not after now.
    expect(
      resolveCheckoutAt({ ...base, now: at('2026-11-23T10:00'), time: '10:30' })?.afterNow,
    ).toBe(false);
    // 01:05 on the departure calendar day typing 05:30: both candidates are ahead → the earliest.
    const w = resolveCheckoutAt({ ...base, now: at('2026-11-23T01:05'), time: '05:30' });
    expect(iso(w?.at)).toBe(iso(at('2026-11-23T05:30')));
    expect(w?.afterNow).toBe(true);
  });

  it('T10-8 (C0313-07): departure 24/11, 01:05 on 24/11 typing 23:50 → 23/11 23:50, no surcharge', () => {
    const dep24 = { ...base, departureDate: '2026-11-24' };
    const r = resolveCheckoutAt({ ...dep24, now: at('2026-11-24T01:05'), time: '23:50' });
    expect(iso(r?.at)).toBe(iso(at('2026-11-23T23:50')));
    expect(r).toMatchObject({ postMidnight: true, noteRequired: true, afterNow: false });
    // The same instant sent as `checkoutAt` is accepted (was 422 DATE_INVALID – C0313-07).
    const sent = resolveCheckoutAt({
      ...dep24,
      now: at('2026-11-24T01:05'),
      time: '12:00',
      sent: at('2026-11-23T23:50'),
    });
    expect(iso(sent?.at)).toBe(iso(at('2026-11-23T23:50')));
    expect(sent).toMatchObject({ sent: true, postMidnight: true });
    // Outside the departure's post-midnight window the evening before stays refused.
    expect(
      resolveCheckoutAt({
        ...dep24,
        now: at('2026-11-24T07:00'),
        time: '12:00',
        sent: at('2026-11-23T23:50'),
      }),
    ).toBeNull();
    // Never before the actual check-in: typed → that candidate is dropped (the next one is ahead → afterNow).
    const late = { ...dep24, checkedInAt: at('2026-11-23T20:00') };
    const typed = resolveCheckoutAt({ ...late, now: at('2026-11-24T01:05'), time: '14:00' });
    expect(iso(typed?.at)).toBe(iso(at('2026-11-24T14:00')));
    expect(typed?.afterNow).toBe(true);
    expect(
      resolveCheckoutAt({
        ...late,
        now: at('2026-11-24T01:05'),
        time: '12:00',
        sent: at('2026-11-23T14:00'),
      }),
    ).toBeNull();
  });

  it('T10-9 (C0313-01): a sent instant one hour ahead → afterNow (QR and B18 refuse it)', () => {
    const r = resolveCheckoutAt({
      ...base,
      now: at('2026-11-23T10:00'),
      time: '12:00',
      sent: at('2026-11-23T11:00'),
    });
    expect(r).toMatchObject({ sent: true, afterNow: true, postMidnight: false });
  });

  it('C0313-08: nothing typed → the agreed / standard time, not the server clock', () => {
    // Before the standard time on the departure day → the standard time is ahead.
    expect(
      resolveCheckoutAt({ ...base, typed: false, now: at('2026-11-23T10:00'), time: '12:00' })
        ?.afterNow,
    ).toBe(true);
  });

  it('DOM PR106-01: the evening before only from a TYPED time – never from the agreed or the standard time', () => {
    const dep24 = { ...base, departureDate: '2026-11-24' };
    // Agreed 17:00, 01:00 on 24/11, nothing typed → 24/11 17:00 (ahead → the desk asks for the time), not 23/11 17:00.
    const agreed = resolveCheckoutAt({
      ...dep24,
      typed: false,
      now: at('2026-11-24T01:00'),
      time: '17:00',
    });
    expect(iso(agreed?.at)).toBe(iso(at('2026-11-24T17:00')));
    expect(agreed).toMatchObject({ afterNow: true, postMidnight: false });
    // Standard 12:00, 01:05 on 24/11, nothing typed → 24/11 12:00 ahead (was 23/11 12:00 + note required).
    const standard = resolveCheckoutAt({
      ...dep24,
      typed: false,
      now: at('2026-11-24T01:05'),
      time: '12:00',
    });
    expect(iso(standard?.at)).toBe(iso(at('2026-11-24T12:00')));
    expect(standard).toMatchObject({ afterNow: true, noteRequired: false });
    // Typed 01:00 at 01:00 on 24/11 → 24/11 01:00, the post-midnight window (no surcharge).
    const typed = resolveCheckoutAt({ ...dep24, now: at('2026-11-24T01:00'), time: '01:00' });
    expect(iso(typed?.at)).toBe(iso(at('2026-11-24T01:00')));
    expect(typed).toMatchObject({ postMidnight: true, afterNow: false });
    // Typed 17:00 at 01:00 on 24/11 → still the evening before (T10-8 rule kept for typed times).
    const eve = resolveCheckoutAt({ ...dep24, now: at('2026-11-24T01:00'), time: '17:00' });
    expect(iso(eve?.at)).toBe(iso(at('2026-11-23T17:00')));
    expect(eve?.postMidnight).toBe(true);
  });

  it('SEC A1A-01 (PU1): never before the actual check-in, on every path', () => {
    // One night 23/11 → 24/11, checked in at 01:00 on 24/11 (business date 23/11).
    const pu1 = { ...base, departureDate: '2026-11-24', checkedInAt: at('2026-11-24T01:00') };
    const now = at('2026-11-24T01:20');
    // Sent 00:30 (the departure's post-midnight window, before the check-in) → refused (422 DATE_INVALID).
    expect(
      resolveCheckoutAt({ ...pu1, now, time: '12:00', sent: at('2026-11-24T00:30') }),
    ).toBeNull();
    // Sent at or after the check-in → accepted.
    expect(
      resolveCheckoutAt({ ...pu1, now, time: '12:00', sent: at('2026-11-24T01:00') }),
    ).toMatchObject({ sent: true, postMidnight: true });
    expect(
      resolveCheckoutAt({ ...pu1, now, time: '12:00', sent: at('2026-11-24T01:10') }),
    ).toMatchObject({ sent: true, postMidnight: true, afterNow: false });
    // Typed 00:30: the 24/11 00:30 candidate is dropped; 25/11 00:30 is ahead → afterNow (B18 422 TIME_AFTER_ACTION).
    const typed = resolveCheckoutAt({ ...pu1, now, time: '00:30' });
    expect(iso(typed?.at)).toBe(iso(at('2026-11-25T00:30')));
    expect(typed?.afterNow).toBe(true);
    // The bound holds on a sent instant of the departure business day too (no check-in recorded = no bound).
    const day = { ...base, checkedInAt: at('2026-11-23T08:00') };
    expect(
      resolveCheckoutAt({
        ...day,
        now: at('2026-11-23T10:00'),
        time: '12:00',
        sent: at('2026-11-23T07:30'),
      }),
    ).toBeNull();
    expect(
      resolveCheckoutAt({
        ...day,
        checkedInAt: null,
        now: at('2026-11-23T10:00'),
        time: '12:00',
        sent: at('2026-11-23T07:30'),
      }),
    ).toMatchObject({ sent: true });
  });

  it('a sent instant keeps the old day rule: departure business day or its post-midnight window', () => {
    const s = (local: string, now = '2026-11-23T12:00') =>
      resolveCheckoutAt({ ...base, now: at(now), time: '12:00', sent: at(local) });
    expect(s('2026-11-23T11:00')).toMatchObject({ postMidnight: false });
    expect(s('2026-11-24T01:00')).toMatchObject({ postMidnight: false });
    expect(s('2026-11-23T03:00')).toMatchObject({ postMidnight: true });
    expect(s('2026-11-24T06:30')).toBeNull();
    expect(s('2026-11-22T20:00')).toBeNull();
  });

  it('only previously refused cases change: outside W a time ≥ rollover keeps one candidate', () => {
    for (const time of ['06:00', '09:00', '12:00', '15:00', '18:00', '23:59']) {
      const r = resolveCheckoutAt({ ...base, now: at('2026-11-23T20:00'), time });
      expect(iso(r?.at), time).toBe(iso(at(`2026-11-23T${time}`)));
    }
  });
});

describe('V5-10 allowedActions.check_out (BUG-R4-036; BE C0313-09)', () => {
  const base: ActionContext = {
    status: 'in_house',
    conflictState: 'none',
    channelGroup: 'direct',
    arrivalDate: '2026-11-21',
    departureDate: '2026-11-24',
    stayDepartureDate: '2026-11-24',
    today: '2026-11-24',
    calendarDate: '2026-11-24',
    holdExpired: false,
    holdExtendedCount: 0,
    own: false,
    noShowMarkable: false,
    restoreWithinRules: false,
    rescheduleCount: 0,
    rescheduleMaxTimes: 1,
  };
  const has = (roles: string[], over: Partial<ActionContext>) =>
    allowedActions(roles, { ...base, ...over }).some((a) => a.event === 'check_out');

  it('T10-3: 00:30 on the departure calendar day (business date = departure − 1) → check_out for FD', () => {
    expect(has(['front_desk'], { today: '2026-11-23', calendarDate: '2026-11-24' })).toBe(true);
    // Before 00:00 of the departure day: none.
    expect(has(['front_desk'], { today: '2026-11-23', calendarDate: '2026-11-23' })).toBe(false);
    // Calendar date absent = no window (the former behaviour).
    expect(has(['front_desk'], { today: '2026-11-23', calendarDate: undefined })).toBe(false);
    expect(has(['front_desk'], {})).toBe(true);
    expect(has(['housekeeping'], { today: '2026-11-23', calendarDate: '2026-11-24' })).toBe(false);
  });

  it('T15-15: a primary booking with an extension child in force → no check_out on the primary departure', () => {
    expect(
      has(['front_desk'], {
        departureDate: '2026-11-23',
        stayDepartureDate: '2026-11-25',
        today: '2026-11-23',
        calendarDate: '2026-11-23',
      }),
    ).toBe(false);
    expect(
      has(['front_desk'], {
        departureDate: '2026-11-23',
        stayDepartureDate: '2026-11-25',
        today: '2026-11-25',
        calendarDate: '2026-11-25',
      }),
    ).toBe(true);
    // A child booking (no stayDepartureDate) never offers B18 – the server checks out the primary only.
    expect(has(['front_desk'], { stayDepartureDate: undefined })).toBe(false);
  });

  it('the "Hôm nay" row and the reservation agree on every clock around the departure', () => {
    const clocks: Array<[string, string]> = [
      ['2026-11-22', '2026-11-23'],
      ['2026-11-23', '2026-11-23'],
      ['2026-11-23', '2026-11-24'],
      ['2026-11-24', '2026-11-24'],
      ['2026-11-24', '2026-11-25'],
      ['2026-11-25', '2026-11-25'],
    ];
    for (const roles of [['owner'], ['front_desk'], ['housekeeping'], ['sales_staff']]) {
      for (const [today, calendarDate] of clocks) {
        const ref = allowedActions(roles, { ...base, today, calendarDate }).filter(
          (a) => a.event === 'check_out',
        );
        const row = checkOutAction(roles, {
          status: 'in_house',
          departureDate: '2026-11-24',
          today,
          calendarDate,
        });
        expect(row, `${roles[0]} ${today} ${calendarDate}`).toEqual(ref);
      }
    }
  });
});

describe('SEC A1B-01 Fields.text – control and invisible formatting characters removed (D12c)', () => {
  const escape = (s: string) =>
    [...s].map((ch) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase()}`).join(' ');
  const read = (v: unknown, opts: { required?: boolean; min?: number } = {}) => {
    const f = new Fields({ x: v });
    return { value: f.text('x', 500, opts), errors: f.errors };
  };

  it('NUL, U+202E…U+202C (bidi override), U+200B (zero width), BEL are dropped; the text is kept', () => {
    expect(read('Khách\u0000 đi\u200B sớm \u202Egnirts\u202C\u0007')).toEqual({
      value: 'Khách đi sớm gnirts',
      errors: [],
    });
    // Tabs and line breaks stay whitespace (collapsed as before).
    expect(read('a\tb\nc').value).toBe('a b c');
  });

  it('nothing left after removal = absent: REASON_REQUIRED / REQUIRED when required, undefined otherwise', () => {
    const hidden = '\u0000\u200B\u202E\u202C\u0007';
    expect(read(hidden, { required: true, min: 3 })).toEqual({
      value: undefined,
      errors: [{ field: 'x', code: 'REASON_REQUIRED' }],
    });
    expect(read(hidden, { required: true }).errors).toEqual([{ field: 'x', code: 'REQUIRED' }]);
    expect(read(hidden)).toEqual({ value: undefined, errors: [] });
    // The minimum length counts the visible text only.
    expect(read('a\u200Bb', { min: 3 }).errors).toEqual([{ field: 'x', code: 'REASON_REQUIRED' }]);
  });

  it('SEC 127-01: every Cf / default-ignorable character and lone surrogates too; scripts and tone marks kept', () => {
    // A required reason of invisible characters only = absent.
    for (const hidden of [
      '\u2060\u2060\u2060',
      '\u{E0001}\u{E0054}\u{E0045}\u{E0058}\u{E0054}',
      '\u00AD\u00AD\u00AD',
      '\u061C\u061C\u061C',
      '\uFE0F\uFE0F\uFE0F',
      '\u3164\u115F\uFFA0',
      '\u2062\u206A\u180E',
      '\uFFF9\u034F\u{1D173}',
      '\uDC00\uDC00\uD800',
    ]) {
      expect(read(hidden, { required: true, min: 3 }), escape(hidden)).toEqual({
        value: undefined,
        errors: [{ field: 'x', code: 'REASON_REQUIRED' }],
      });
    }
    // "ok" + a sentence in tag characters no longer passes min 3.
    expect(read('ok\u{E0068}\u{E0069}\u{E0064}\u{E0065}', { min: 3 }).errors).toEqual([
      { field: 'x', code: 'REASON_REQUIRED' },
    ]);
    // A lone surrogate inside text is dropped (PostgreSQL refuses it in jsonb – 22P02).
    expect(read('Khách đi\uD800 sớm\uDC00').value).toBe('Khách đi sớm');
    // Kept: Vietnamese in NFC and NFD (combining tone marks), Korean, Chinese, Russian, Arabic, a plain emoji.
    for (const text of [
      'Nguy\u1EC5n',
      'Nguye\u0302\u0303n',
      '\uC548\uB155\uD558\uC138\uC694',
      '\u4F60\u597D',
      '\u041F\u0440\u0438\u0432\u0435\u0442',
      '\u0645\u0631\u062D\u0628\u0627',
      '\u{1F600}',
    ]) {
      expect(read(text).value, escape(text)).toBe(text);
    }
    // VS16 after a symbol is a variation selector – dropped, the symbol stays.
    expect(read('\u2764\uFE0F').value).toBe('\u2764');
  });

  it('unchanged otherwise: non-string → VALIDATION_FAILED, a card number → CARD_NUMBER_DETECTED (also behind a zero-width join)', () => {
    expect(read(42).errors).toEqual([{ field: 'x', code: 'VALIDATION_FAILED' }]);
    expect(read('Thẻ 4111 1111 1111 1111').errors).toEqual([
      { field: 'x', code: 'CARD_NUMBER_DETECTED' },
    ]);
    expect(read('Thẻ 4111\u200B1111\u200B1111\u200B1111').errors).toEqual([
      { field: 'x', code: 'CARD_NUMBER_DETECTED' },
    ]);
    expect(read(null)).toEqual({ value: undefined, errors: [] });
  });
});
