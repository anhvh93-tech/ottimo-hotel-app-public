/**
 * Front desk pure rules (BE-A Sprint 3) against the BR oracle tests/fixtures/br-examples.json:
 * BR-411 early check-in tiers + BR-417 prior night, BR-412 late check-out tiers / grace / extension,
 * BR-413 long stay, BR-415 OTA base, BR-428 early departure refund, BR-425 departure reminder states,
 * G-10 (actual time recomputation) and the business-day axis (00:00–05:59 = after midnight, DOM G-16).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  businessMinutes,
  departureReminderState,
  earlyCheckinSurcharge,
  earlyDepartureRefund,
  lateCheckoutSurcharge,
  nightlyEquivalent,
} from '../src/modules/frontdesk/public/stay-rules';
import { assertAttentionParams } from '../src/modules/events/public/events.service';
import { matches, parseWire } from '../src/modules/events/internal/sse-hub';

interface Example {
  id: string;
  br: string;
  calc: string | null;
  params?: Record<string, unknown>;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}

const ORACLE = JSON.parse(
  readFileSync(join(__dirname, '../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Example[] };
const ex = (br: string, calc: string) =>
  ORACLE.examples.filter((e) => e.br === br && e.calc === calc);

const EARLY = [
  { from: '10:00', to: '14:00', pct: 30 },
  { from: '06:00', to: '10:00', pct: 50 },
];
const LATE = [
  { after: '12:00', until: '15:00', pct: 30 },
  { after: '15:00', until: '18:00', pct: 50 },
];
const FEE_UNIT = 1000;

describe('BR-411 / BR-417 early check-in (oracle)', () => {
  const cases = ex('BR-411', 'earlyCheckin');
  it('has the oracle rows', () => expect(cases.length).toBeGreaterThanOrEqual(7));
  it.each(cases.map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const tiers = (c.params?.early_checkin_tiers as typeof EARLY | undefined) ?? EARLY;
    const r = earlyCheckinSurcharge({
      checkinTime: c.input.checkinTime as string,
      standardCheckinTime: '14:00',
      rollover: '06:00',
      tiers,
      baseNightVnd: c.input.firstNightRateVnd as number,
      unit: FEE_UNIT,
    });
    expect(r.amountVnd).toBe(c.expected.surchargeVnd);
    expect(r.addsPreviousNight).toBe(c.expected.extraNight);
  });
  it('form opened at 11:05 still defaults to 14:00 → 0 (BR-414)', () => {
    const r = earlyCheckinSurcharge({
      checkinTime: '14:00',
      standardCheckinTime: '14:00',
      rollover: '06:00',
      tiers: EARLY,
      baseNightVnd: 700_000,
      unit: FEE_UNIT,
    });
    expect(r).toMatchObject({ amountVnd: 0, addsPreviousNight: false });
  });
  it('one minute each side of every mark (05:59/06:00, 09:59/10:00, 13:59/14:00)', () => {
    const at = (t: string) =>
      earlyCheckinSurcharge({
        checkinTime: t,
        standardCheckinTime: '14:00',
        rollover: '06:00',
        tiers: EARLY,
        baseNightVnd: 700_000,
        unit: FEE_UNIT,
      });
    expect(at('05:59').addsPreviousNight).toBe(true);
    expect(at('06:00').tierPct).toBe(50);
    expect(at('09:59').tierPct).toBe(50);
    expect(at('10:00').tierPct).toBe(30);
    expect(at('13:59').tierPct).toBe(30);
    expect(at('14:00').tierPct).toBe(0);
  });
});

describe('BR-415 OTA surcharge base = direct current rate (oracle)', () => {
  it.each(ex('BR-415', 'otaEarlyCheckin').map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const r = earlyCheckinSurcharge({
      checkinTime: c.input.checkinTime as string,
      standardCheckinTime: '14:00',
      rollover: '06:00',
      tiers: EARLY,
      baseNightVnd: c.input.directCurrentRateVnd as number,
      unit: FEE_UNIT,
    });
    expect(r.baseNightVnd).toBe(c.expected.surchargeBaseVnd);
    expect(r.amountVnd).toBe(c.expected.surchargeVnd);
  });
});

describe('BR-412 late check-out (oracle)', () => {
  const cases = ex('BR-412', 'lateCheckout');
  it('has the oracle rows', () => expect(cases.length).toBeGreaterThanOrEqual(11));
  it.each(cases.map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const p = c.params ?? {};
    const r = lateCheckoutSurcharge({
      checkoutTime: c.input.checkoutTime as string,
      standardCheckoutTime: '12:00',
      rollover: '06:00',
      tiers: (p.late_checkout_tiers as typeof LATE | undefined) ?? LATE,
      graceUntil: (p.late_grace_until as string | undefined) ?? '12:30',
      graceRequiresNoArrival: (p.late_grace_requires_no_same_day_arrival as boolean) ?? true,
      sameDayArrival: c.input.sameDayArrival as boolean,
      baseNightVnd: c.input.lastNightRateVnd as number,
      unit: FEE_UNIT,
    });
    expect(r.amountVnd).toBe(c.expected.surchargeVnd);
    expect(r.treatAsExtension).toBe(c.expected.convertToExtension);
  });

  it('G-10: agreed 17:00 (50 %) but actually left at 13:00 → 30 %', () => {
    const at = (t: string) =>
      lateCheckoutSurcharge({
        checkoutTime: t,
        standardCheckoutTime: '12:00',
        rollover: '06:00',
        tiers: LATE,
        graceUntil: '12:30',
        graceRequiresNoArrival: true,
        sameDayArrival: false,
        baseNightVnd: 700_000,
        unit: FEE_UNIT,
      });
    expect(at('17:00').amountVnd).toBe(350_000);
    expect(at('13:00').amountVnd).toBe(210_000);
    expect(at('12:25').amountVnd).toBe(0);
  });

  it('G-16: 01:00 after midnight (same business day) is after the last tier → extension', () => {
    const r = lateCheckoutSurcharge({
      checkoutTime: '01:00',
      standardCheckoutTime: '12:00',
      rollover: '06:00',
      tiers: LATE,
      graceUntil: '12:30',
      graceRequiresNoArrival: true,
      sameDayArrival: false,
      baseNightVnd: 700_000,
      unit: FEE_UNIT,
    });
    expect(r.treatAsExtension).toBe(true);
    expect(businessMinutes('05:59', '06:00')).toBeGreaterThan(businessMinutes('23:59', '06:00'));
    expect(businessMinutes('06:00', '06:00')).toBe(360);
  });
});

describe('BR-413 / BR-102 long stay (oracle)', () => {
  it.each(ex('BR-413', 'longStayLateCheckout').map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const base = nightlyEquivalent(c.input.leaseMonthlyRentVnd as number, 30, 1000);
    expect(base).toBe(c.expected.baseNightRateVnd);
    const r = lateCheckoutSurcharge({
      checkoutTime: c.input.checkoutTime as string,
      standardCheckoutTime: '12:00',
      rollover: '06:00',
      tiers: LATE,
      graceUntil: '12:30',
      graceRequiresNoArrival: true,
      // "nếu phải thu" = someone arrives the same day (otherwise free until 15:00)
      sameDayArrival: c.input.chargeable as boolean,
      baseNightVnd: base,
      unit: FEE_UNIT,
      longStay: { freeUntil: '15:00' },
    });
    expect(r.amountVnd).toBe(c.expected.surchargeVnd);
  });

  it('US-027 AC1: 371.000 nightly, 08:00 – vacant previous night → 0; departure same day → 186.000', () => {
    const base = nightlyEquivalent(11_130_000, 30, 1000);
    const at = (vacant: boolean) =>
      earlyCheckinSurcharge({
        checkinTime: '08:00',
        standardCheckinTime: '14:00',
        rollover: '06:00',
        tiers: EARLY,
        baseNightVnd: base,
        unit: FEE_UNIT,
        longStay: { vacantPreviousNight: vacant },
      });
    expect(at(true)).toMatchObject({ amountVnd: 0, ruleRef: 'BR-413' });
    expect(at(false).amountVnd).toBe(186_000);
  });

  it('long stay late: free until 15:00 without arrival, 15:01 → 50 %', () => {
    const at = (t: string, arrival: boolean) =>
      lateCheckoutSurcharge({
        checkoutTime: t,
        standardCheckoutTime: '12:00',
        rollover: '06:00',
        tiers: LATE,
        graceUntil: '12:30',
        graceRequiresNoArrival: true,
        sameDayArrival: arrival,
        baseNightVnd: 371_000,
        unit: FEE_UNIT,
        longStay: { freeUntil: '15:00' },
      }).amountVnd;
    expect(at('15:00', false)).toBe(0);
    expect(at('15:01', false)).toBe(186_000);
    expect(at('14:00', true)).toBe(111_000);
  });
});

describe('BR-428 early departure (oracle)', () => {
  it.each(ex('BR-428', 'earlyDeparture').map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const notified = new Date(c.input.notifiedAt as string);
    // business date at notice (BR-010 rollover 06:00, +07:00)
    const local = new Date(notified.getTime() + 7 * 3_600_000 - 6 * 3_600_000);
    const businessDateAtNotice = local.toISOString().slice(0, 10);
    const droppedNights = (c.expected.cancelledNights as string[]).length;
    const r = earlyDepartureRefund({
      newDeparture: c.input.newDepartureDate as string,
      businessDateAtNotice,
      droppedNightsVnd: droppedNights * (c.input.nightRateVnd as number),
      policy: { minNoticeDays: 1, refundPct: 50 },
      unit: FEE_UNIT,
    });
    expect(r.noticeDays).toBe(c.expected.noticeDays);
    expect(r.refundVnd).toBe(c.expected.refundVnd);
  });
});

describe('BR-425 / US-031 departure reminder state', () => {
  const reminders = {
    before: ['20:00-1d', '09:00', '11:00'],
    overdueWithSameDayArrival: '12:00',
    overdueOtherwise: '12:31',
  };
  const state = (
    nowTime: string,
    o: { replied?: boolean; arrival?: boolean; out?: boolean } = {},
  ) =>
    departureReminderState({
      nowTime,
      rollover: '06:00',
      checkedOut: !!o.out,
      replied: !!o.replied,
      sameDayArrival: !!o.arrival,
      reminders,
    });
  it('each side of 11:00 / 12:00 / 12:31', () => {
    expect(state('10:59')).toBe('reminded_waiting');
    expect(state('11:00')).toBe('call_needed');
    expect(state('11:59', { arrival: true })).toBe('call_needed');
    expect(state('12:00', { arrival: true })).toBe('overdue');
    expect(state('12:30')).toBe('call_needed');
    expect(state('12:31')).toBe('overdue');
    expect(state('10:00', { replied: true })).toBe('replied');
    expect(state('12:31', { replied: true })).toBe('overdue');
    expect(state('13:00', { out: true })).toBe('checked_out');
  });
});

describe('events: attention params allowlist (B-21) and SSE audience', () => {
  it('rejects a key that is not allow-listed for the kind', () => {
    expect(() =>
      assertAttentionParams('reconcile_overdue', { count: 2, oldestDays: 3 }),
    ).not.toThrow();
    expect(() => assertAttentionParams('reconcile_overdue', { guestName: 'x' })).toThrow(
      /not allow-listed/,
    );
    expect(() => assertAttentionParams('vip_arrival', { count: 1 })).toThrow();
    expect(() =>
      assertAttentionParams('overbooking', { count: 'x'.repeat(41) as unknown as number }),
    ).toThrow();
  });

  it('SSE audience: property + roles/users, payload id only', () => {
    const sub = { propertyId: 'p1', userId: 'u1', roles: ['front_desk'], send: () => undefined };
    expect(matches({ p: 'p1', t: 'reservation.changed', id: 'x' }, sub)).toBe(true);
    expect(matches({ p: 'p2', t: 'reservation.changed', id: 'x' }, sub)).toBe(false);
    expect(matches({ p: 'p1', t: 'payment.changed', id: 'x', r: ['owner', 'manager'] }, sub)).toBe(
      false,
    );
    expect(
      matches({ p: 'p1', t: 'payment.changed', id: 'x', r: ['manager'], u: ['u1'] }, sub),
    ).toBe(true);
    expect(matches({ p: 'p1', t: 'notification.created', id: 'x', r: [], u: ['u2'] }, sub)).toBe(
      false,
    );
    expect(parseWire('{"p":"p1","t":"evil","id":"x"}')).toBeNull();
    expect(parseWire('not json')).toBeNull();
  });
});
