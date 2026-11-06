/**
 * BE-A1 v1.0.5 – pure rules, no DB (OpenAPI 0.3.13; contract 0.3.13 1.1, 1.19, 1.21):
 * - shared/business-day.ts: W, "ngày lịch tối thiểu", the post-midnight window, B18's day (BR-010 v0.5.12).
 * - V5-10 `resolveCheckoutAt` (checkout-at.ts): one departure instant for the summary, the QR and B18 – T10-1…T10-4,
 *   T10-8, T10-9 at the rule level (BUG-R4-051; BE C0313-01, 07, 08).
 * - V5-10 `allowedActions.check_out` on the effective departure from 00:00 of the departure day (BUG-R4-036;
 *   BE C0313-09, T15-15) and the same rule as the "Hôm nay" row.
 * Fake dates only.
 */
import { describe, expect, it } from 'vitest';
import { resolveCheckoutAt } from '../src/modules/frontdesk/internal/checkout-at';
import { checkOutAction } from '../src/modules/reporting/internal/stay-actions';
import {
  type ActionContext,
  allowedActions,
} from '../src/modules/reservations/internal/allowed-actions';
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
    // BE C0313-01 example: agreed 17:00, guest gone at 01:00 on the departure day – the evening before, no surcharge.
    const dep24 = { ...base, departureDate: '2026-11-24' };
    const r = resolveCheckoutAt({ ...dep24, now: at('2026-11-24T01:00'), time: '17:00' });
    expect(iso(r?.at)).toBe(iso(at('2026-11-23T17:00')));
    expect(r?.postMidnight).toBe(true);
    // Before the standard time on the departure day → the standard time is ahead.
    expect(
      resolveCheckoutAt({ ...base, now: at('2026-11-23T10:00'), time: '12:00' })?.afterNow,
    ).toBe(true);
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

describe('V5-11 allowedActions.early_departure – minimum calendar date (DOM 2.1 (2)–(3))', () => {
  const base: ActionContext = {
    status: 'in_house',
    conflictState: 'none',
    channelGroup: 'direct',
    arrivalDate: '2026-10-20',
    departureDate: '2026-10-24',
    stayDepartureDate: '2026-10-24',
    today: '2026-10-20',
    calendarDate: '2026-10-20',
    holdExpired: false,
    holdExtendedCount: 0,
    own: false,
    noShowMarkable: false,
    restoreWithinRules: false,
    rescheduleCount: 0,
    rescheduleMaxTimes: 1,
  };
  const events = (over: Partial<ActionContext>) =>
    allowedActions(['front_desk'], { ...base, ...over }).map((a) => a.event);

  it('BR-428-17: a stay ending on the calendar date, at 03:00 → B18 only, no B16', () => {
    const w = { departureDate: '2026-10-21', stayDepartureDate: '2026-10-21' };
    const night = events({ ...w, today: '2026-10-20', calendarDate: '2026-10-21' });
    expect(night).toContain('check_out');
    expect(night).not.toContain('early_departure');
    // Evening of 20/10 (before 00:00): no valid B16 date either (min 21/10 = departure); no B18 yet.
    const evening = events({ ...w, today: '2026-10-20', calendarDate: '2026-10-20' });
    expect(evening).not.toContain('early_departure');
    expect(evening).not.toContain('check_out');
  });

  it('BR-428-14: stay 20–24/10 – 03:00 on 21/10 and 23/10 → B16; 03:00 on 24/10 → B18, no B16', () => {
    expect(events({ today: '2026-10-20', calendarDate: '2026-10-21' })).toContain(
      'early_departure',
    );
    expect(events({ today: '2026-10-22', calendarDate: '2026-10-23' })).toContain(
      'early_departure',
    );
    const last = events({ today: '2026-10-23', calendarDate: '2026-10-24' });
    expect(last).not.toContain('early_departure');
    expect(last).toContain('check_out');
  });

  it('the B16 window starts at minCalendarDate: business date by day, calendar date 00:00–rollover', () => {
    // Stay 20–22/10: by day on 21/10 the window is [21/10, 21/10] → open; at 03:00 on 22/10 → closed.
    const s = { departureDate: '2026-10-22', stayDepartureDate: '2026-10-22' };
    expect(events({ ...s, today: '2026-10-21', calendarDate: '2026-10-21' })).toContain(
      'early_departure',
    );
    expect(events({ ...s, today: '2026-10-21', calendarDate: '2026-10-22' })).not.toContain(
      'early_departure',
    );
    // Calendar date absent = no window (the former behaviour).
    expect(events({ ...s, today: '2026-10-21', calendarDate: undefined })).toContain(
      'early_departure',
    );
    // The arrival + 1 floor still applies.
    expect(events({ ...s, today: '2026-10-20' })).toContain('early_departure');
    const oneNight = { departureDate: '2026-10-21', stayDepartureDate: '2026-10-21' };
    expect(events({ ...oneNight, today: '2026-10-20' })).not.toContain('early_departure');
  });
});
