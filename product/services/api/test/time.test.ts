import { describe, expect, it } from 'vitest';
import { parseSafeBigint } from '../src/db/pool';
import { canonicalJson, requestHash } from '../src/shared/http/unit-of-work';
import {
  addDays,
  atLocal,
  businessDate,
  localDate,
  offsetMinutes,
  toZonedIso,
} from '../src/shared/time';

const TZ = 'Asia/Ho_Chi_Minh';

describe('time helpers (ADR-008, BR-010)', () => {
  it('local date and offset in the property zone', () => {
    expect(offsetMinutes(new Date('2026-10-15T00:00:00Z'), TZ)).toBe(420);
    expect(localDate(new Date('2026-10-15T16:59:59Z'), TZ)).toBe('2026-10-15');
    expect(localDate(new Date('2026-10-15T17:00:00Z'), TZ)).toBe('2026-10-16');
    expect(toZonedIso(new Date('2026-10-15T07:00:00Z'), TZ)).toBe('2026-10-15T14:00:00.000+07:00');
  });

  it('business date rolls over at 06:00 local time – 05:59 / 06:00 both sides', () => {
    expect(businessDate(new Date('2026-10-15T22:59:00Z'), TZ, '06:00')).toBe('2026-10-15'); // 05:59 16/10
    expect(businessDate(new Date('2026-10-15T23:00:00Z'), TZ, '06:00')).toBe('2026-10-16'); // 06:00 16/10
  });

  it('atLocal gives the instant of a local date + time (and handles a DST zone)', () => {
    expect(atLocal('2026-10-15', '12:00', TZ).toISOString()).toBe('2026-10-15T05:00:00.000Z');
    expect(atLocal('2026-07-01', '12:00', 'Europe/Berlin').toISOString()).toBe(
      '2026-07-01T10:00:00.000Z',
    );
    expect(atLocal('2026-01-01', '12:00', 'Europe/Berlin').toISOString()).toBe(
      '2026-01-01T11:00:00.000Z',
    );
  });

  it('addDays crosses months/years; bad inputs are refused', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(() => addDays('15/10/2026', 1)).toThrow(RangeError);
    expect(() => atLocal('2026-10-15', '24:00', TZ)).toThrow(RangeError);
  });
});

describe('int8 parser (coding-standards 4.2a)', () => {
  it('returns safe integers and refuses values beyond 2^53', () => {
    expect(parseSafeBigint('56339000')).toBe(56_339_000);
    expect(() => parseSafeBigint('9007199254740993')).toThrow(RangeError);
  });
});

describe('idempotency request hash', () => {
  it('ignores key order and undefined members, distinguishes method/path/body', () => {
    expect(canonicalJson({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: undefined } })).toBe(
      '{"a":{"d":[1,{"x":1,"y":2}]},"b":1}',
    );
    const h = requestHash('post', '/v1/x', { a: 1, b: 2 });
    expect(requestHash('POST', '/v1/x', { b: 2, a: 1 })).toBe(h);
    expect(requestHash('POST', '/v1/y', { a: 1, b: 2 })).not.toBe(h);
    expect(requestHash('POST', '/v1/x', { a: 1, b: 3 })).not.toBe(h);
  });
});
