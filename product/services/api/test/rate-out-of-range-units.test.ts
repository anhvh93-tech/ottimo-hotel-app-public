/**
 * FB-R5-ARC-BE-S1-01 (2) – the `rateOutOfRange` builder (V5-22; contract 0.3.13 1.9 + 1.24 BE 12; ARC decision-log
 * 07/11: `dates[]` in date order, `min`/`max` = floor / ceiling of `dates[0]`, no bound → no key), without a database:
 * nights with DIFFERENT bounds (a list price changing inside the stay, no `ota_base_rate`) tell "the first night of
 * `dates[]`" from "any night"; the OTA warning; B13's `date` (FB-R5-ARC-BE-S1-03). FAKE numbers only.
 */
import { describe, expect, it } from 'vitest';
import {
  type BoundedNight,
  rateOutOfRange,
} from '../src/modules/reservations/public/rate-out-of-range';

/** 11–12/01 on a list price of 792.000 (bounds 554.000–1.980.000), 13/01 on 1.000.000 (700.000–2.500.000). */
const NIGHTS: BoundedNight[] = [
  { date: '2027-01-11', floorVnd: 554_000, ceilingVnd: 1_980_000 },
  { date: '2027-01-12', floorVnd: 554_000, ceilingVnd: 1_980_000 },
  { date: '2027-01-13', floorVnd: 700_000, ceilingVnd: 2_500_000 },
];

describe('rateOutOfRange (V5-22 builder)', () => {
  it('two nights with different bounds → min/max of dates[0], whatever the order of `nights`', () => {
    const e = rateOutOfRange(['2027-01-12', '2027-01-13'], NIGHTS);
    expect(e.code).toBe('RATE_OUT_OF_RANGE');
    expect(e.status).toBe(422);
    const body = e.toBody();
    expect(body).toMatchObject({
      code: 'RATE_OUT_OF_RANGE',
      errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }],
      dates: ['2027-01-12', '2027-01-13'],
      min: 554_000,
      max: 1_980_000,
    });
    // dates[0] = the night with the other bounds → its numbers, not the first element of `nights`
    expect(rateOutOfRange(['2027-01-13'], NIGHTS).toBody()).toMatchObject({
      dates: ['2027-01-13'],
      min: 700_000,
      max: 2_500_000,
    });
    expect(rateOutOfRange(['2027-01-13'], [...NIGHTS].reverse()).toBody()).toMatchObject({
      min: 700_000,
      max: 2_500_000,
    });
  });

  it('no bound for the first night → no min/max key (never a stand-in number)', () => {
    const none = rateOutOfRange(['2027-01-14'], NIGHTS).toBody();
    expect(none.dates).toEqual(['2027-01-14']);
    expect('min' in none).toBe(false);
    expect('max' in none).toBe(false);
    const floorOnly = rateOutOfRange(
      ['2027-01-11'],
      [{ date: '2027-01-11', floorVnd: 554_000 }],
    ).toBody();
    expect(floorOnly.min).toBe(554_000);
    expect('max' in floorOnly).toBe(false);
    const ceilingOnly = rateOutOfRange(
      ['2027-01-11'],
      [{ date: '2027-01-11', ceilingVnd: 1_980_000, floorVnd: undefined }],
    ).toBody();
    expect('min' in ceilingOnly).toBe(false);
    expect(ceilingOnly.max).toBe(1_980_000);
  });

  it('warning (OTA) → 422 VALIDATION_FAILED + field code RATE_OUT_OF_RANGE_WARNING, same numbers', () => {
    const e = rateOutOfRange(['2027-01-13', '2027-01-11'], NIGHTS, { warning: true });
    expect(e.code).toBe('VALIDATION_FAILED');
    expect(e.status).toBe(422);
    expect(e.toBody()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE_WARNING' }],
      dates: ['2027-01-13', '2027-01-11'],
      min: 700_000,
      max: 2_500_000,
    });
  });

  it('`dates` is copied (a later change of the caller array does not reach the answer)', () => {
    const dates = ['2027-01-11'];
    const e = rateOutOfRange(dates, NIGHTS);
    dates.push('2027-01-12');
    expect(e.toBody().dates).toEqual(['2027-01-11']);
  });

  it('B13 (FB-R5-ARC-BE-S1-03): `legacyDate` adds `date` = dates[0]; absent by default', () => {
    const b13 = rateOutOfRange(['2027-01-12', '2027-01-13'], NIGHTS, { legacyDate: true });
    expect(b13.toBody()).toMatchObject({
      dates: ['2027-01-12', '2027-01-13'],
      date: '2027-01-12',
      min: 554_000,
      max: 1_980_000,
    });
    expect('date' in rateOutOfRange(['2027-01-12'], NIGHTS).toBody()).toBe(false);
  });
});
