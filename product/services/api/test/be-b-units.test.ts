/**
 * Unit tests (no DB) for BE-B Sprint 1 helpers: VND rounding (BR-005/BR-101 golden numbers), BR-951
 * normalisation, BR-952 name similarity, password policy (V-10, SR-AUTH-02), screens per role (rbac 3),
 * structured parameter rules (erd 9.1a), card-number detector (V-09), role field stripping (US-003).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FixedClock } from '../src/clock';
import { serializeSchema } from '../src/shared/serialization/serializer';
import { dropEmpty, summaryDto } from '../src/modules/guests/internal/guest-mapper';
import {
  maskPhone,
  nameSearchKey,
  namesLookAlike,
  normalizeEmail,
  normalizePhone,
  normalizeTaxCode,
} from '../src/modules/guests/public/normalize';
import { screensFor } from '../src/modules/identity/internal/screens';
import {
  COMMON_PASSWORDS_MIN,
  assertCommonPasswordList,
  commonPasswordCount,
  passwordPolicyErrors,
} from '../src/modules/identity/public/passwords';
import { RateLimiter } from '../src/modules/identity/public/rate-limiter';
import { checkStructuredParameter } from '../src/modules/platform/internal/parameter-rules';
import { occupancyErrors } from '../src/modules/platform/internal/rooms.service';
import { divideRoundVnd, roundVnd } from '../src/modules/platform/public/money';
import { looksLikeCardNumber } from '../src/modules/platform/public/validation';

describe('money (BR-005, BR-101)', () => {
  it('golden numbers: 8.000.000 ÷ 12 → 667.000; 12.500.000 ÷ 12 → 1.042.000; 9.500.000 ÷ 12 → 792.000', () => {
    expect(divideRoundVnd(8_000_000, 12, 1000)).toBe(667_000);
    expect(divideRoundVnd(12_500_000, 12, 1000)).toBe(1_042_000);
    expect(divideRoundVnd(9_500_000, 12, 1000)).toBe(792_000);
    expect(divideRoundVnd(12_000_000, 12, 1000)).toBe(1_000_000);
  });
  it('midpoint rounds up in absolute value (712.500 → 713.000, −712.500 → −713.000)', () => {
    expect(roundVnd(712_500, 1000)).toBe(713_000);
    expect(roundVnd(-712_500, 1000)).toBe(-713_000);
    expect(roundVnd(712_499, 1000)).toBe(712_000);
    expect(roundVnd(11_132_000, 10_000)).toBe(11_130_000);
    expect(roundVnd(4_750_000, 100_000)).toBe(4_800_000);
  });
  it('rejects non-integers', () => {
    expect(() => roundVnd(1.5, 1000)).toThrow(RangeError);
    expect(() => divideRoundVnd(100, 0, 1000)).toThrow(RangeError);
  });
});

describe('BR-951 normalisation', () => {
  it('phone: 0905 123 456 = +84 905 123 456 = 84905123456', () => {
    expect(normalizePhone('0905 123 456')).toEqual({ ok: true, e164: '84905123456' });
    expect(normalizePhone('+84 905 123 456')).toEqual({ ok: true, e164: '84905123456' });
    expect(normalizePhone('84905123456')).toEqual({ ok: true, e164: '84905123456' });
    expect(normalizePhone('0236 3812 345')).toEqual({ ok: true, e164: '842363812345' });
    expect(normalizePhone('+7 912 345 6789')).toEqual({ ok: true, e164: '79123456789' });
    expect(normalizePhone('912345678')).toEqual({ ok: false, code: 'PHONE_COUNTRY_CODE_REQUIRED' });
    expect(normalizePhone('0012345')).toEqual({ ok: false, code: 'PHONE_INVALID' });
    expect(maskPhone('84905123456')).toBe('0905***456');
  });
  it('email trim + lower case; bad forms refused', () => {
    expect(normalizeEmail('  Mai.Anh@Example.COM ')).toBe('mai.anh@example.com');
    for (const bad of ['a@b', 'a b@c.com', 'a@@b.com', '@b.com', 'a@b.c1'])
      expect(normalizeEmail(bad)).toBeNull();
  });
  it('name search key without accents (US-073 AC1)', () => {
    expect(nameSearchKey('  Đỗ   Mai Anh ')).toBe('DO MAI ANH');
    expect(nameSearchKey('Nguyễn Thị Hồng Nhung')).toBe('NGUYEN THI HONG NHUNG');
  });
  it('tax code V-04', () => {
    expect(normalizeTaxCode('0101 234 567')).toBe('0101234567');
    expect(normalizeTaxCode('0101234567-001')).toBe('0101234567-001');
    expect(normalizeTaxCode('12345')).toBeNull();
  });
  it('BR-952: word order ignored, small typos accepted', () => {
    expect(namesLookAlike('WEBER DANIEL', 'DANIEL WEBER')).toBe(true);
    expect(namesLookAlike('NGUYEN VAN AN', 'NGUYEN VAN ANH')).toBe(true);
    expect(namesLookAlike('NGUYEN VAN AN', 'TRAN THI BICH')).toBe(false);
  });
});

describe('passwords (V-10, SR-AUTH-02)', () => {
  it('length, username, reuse, common', () => {
    expect(passwordPolicyErrors('p', 'short', 'lan.hk')).toEqual([
      { field: 'p', code: 'PASSWORD_TOO_SHORT' },
    ]);
    expect(passwordPolicyErrors('p', 'xxlan.hkxx12', 'lan.hk')[0]!.code).toBe(
      'PASSWORD_SAME_AS_USERNAME',
    );
    expect(passwordPolicyErrors('p', 'Same-pass-123', 'u', 'Same-pass-123')[0]!.code).toBe(
      'PASSWORD_REUSED',
    );
    expect(passwordPolicyErrors('p', 'ottimo2026!', 'u')[0]!.code).toBe('PASSWORD_TOO_COMMON');
    expect(passwordPolicyErrors('p', '1234567890', 'u')[0]!.code).toBe('PASSWORD_TOO_COMMON');
  });

  it('SR-AUTH-02 offline list (SEC s1-decisions 2): examples, normalisation, stripped suffix', () => {
    const common = (pw: string) => passwordPolicyErrors('p', pw, 'zz.user')[0]?.code;
    for (const pw of [
      '12345678abc', // letters alone = a base word
      'ottimo2026', // brand
      'Dalat123456!', // base word + digits/symbols at the end
      'Khachsan@2026', // source-B combination
      'MATKHAU1234', // case-insensitive
      'ｍａｔｋｈａｕ１２３４', // full-width → NFKC
      ' matkhau2026 ', // trimmed
      'qwertyuiop',
    ]) {
      expect({ pw, code: common(pw) }).toEqual({ pw, code: 'PASSWORD_TOO_COMMON' });
    }
    for (const pw of ['Xq7#mP2vLk9!', 'cay-thong-xanh-tren-doi', 'tR0ng.Hoa.N4m']) {
      expect({ pw, errors: passwordPolicyErrors('p', pw, 'zz.user') }).toEqual({ pw, errors: [] });
    }
  });

  it('common-passwords.txt matches SOURCE.md (count + SHA-256 of the latest import row)', () => {
    const dir = join(__dirname, '..', 'src', 'modules', 'identity', 'public');
    const text = readFileSync(join(dir, 'common-passwords.txt'), 'utf8');
    const lines = text.split('\n').filter(Boolean);
    expect(commonPasswordCount()).toBe(lines.length);
    expect(new Set(lines).size).toBe(lines.length);
    expect([...lines].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))).toEqual(lines);
    for (const l of lines) {
      expect(l).toBe(l.normalize('NFKC').toLowerCase().trim());
      expect(l.length).toBeGreaterThanOrEqual(10);
    }
    const source = readFileSync(join(dir, 'common-passwords.SOURCE.md'), 'utf8');
    const rows = source.split('\n').filter((r) => /^\| \d{2}\/\d{2}\/\d{4} \|/.test(r));
    const last = rows[rows.length - 1]!.split('|').map((c) => c.trim());
    expect(Number(last[4])).toBe(lines.length);
    expect(last[5]).toBe(createHash('sha256').update(text, 'utf8').digest('hex'));
  });

  it('staging/production refuse to start below 10.000 entries; dev/test do not', () => {
    expect(() => assertCommonPasswordList('dev')).not.toThrow();
    expect(() => assertCommonPasswordList('test')).not.toThrow();
    const check = () => assertCommonPasswordList('production');
    if (commonPasswordCount() < COMMON_PASSWORDS_MIN) expect(check).toThrow(/SR-AUTH-02/);
    else expect(check).not.toThrow();
  });
});

describe('screens per role (rbac 3)', () => {
  it('union of roles; HK has no S02/S05; owner has S26', () => {
    expect(screensFor(['housekeeping'])).toEqual(['S01', 'S03', 'S10', 'S11', 'S13', 'S23', 'S30']);
    expect(screensFor(['owner'])).toContain('S26');
    expect(screensFor(['front_desk'])).not.toContain('S24');
    const union = screensFor(['front_desk', 'sales_staff']);
    expect(union).toContain('S17');
    expect(union).toContain('S05');
  });

  it('OpenAPI 0.3.4 Me.screens (ARC Q8): R2 manager has no S26 – users/devices are owner only', () => {
    expect(screensFor(['manager'])).not.toContain('S26');
    expect(screensFor(['manager'])).toContain('S24');
    expect(screensFor(['owner', 'manager'])).toContain('S26');
  });
});

describe('ESC-014 occupancy', () => {
  it('max ∈ {base, base + 1}', () => {
    expect(occupancyErrors(2, 2)).toEqual([]);
    expect(occupancyErrors(2, 3)).toEqual([]);
    expect(occupancyErrors(2, 4)).toEqual([{ field: 'maxOccupancy', code: 'MAX_OCCUPANCY_RANGE' }]);
    expect(occupancyErrors(3, 2)).toHaveLength(1);
  });
});

describe('erd 9.1a structured parameter rules', () => {
  const others = (m: Record<string, unknown>) => async (k: string) => {
    if (k in m) return m[k];
    throw new Error('missing');
  };
  it('cross rules: floor ≤ ceiling, checkout < late grace', async () => {
    await expect(
      checkStructuredParameter('rate_floor_pct', 90, others({ rate_ceiling_pct: 250 })),
    ).resolves.toBeUndefined();
    await expect(
      checkStructuredParameter('rate_ceiling_pct', 95, others({})),
    ).rejects.toMatchObject({ code: 'PARAM_OUT_OF_RANGE' });
    await expect(
      checkStructuredParameter('checkout_time', '13:00', others({ late_grace_until: '12:30' })),
    ).rejects.toMatchObject({ code: 'PARAM_OUT_OF_RANGE' });
    await expect(
      checkStructuredParameter('checkout_time', '12:00', others({ late_grace_until: '12:30' })),
    ).resolves.toBeUndefined();
  });
  it('lists: weekend_nights, hold_hours_options', async () => {
    await expect(
      checkStructuredParameter('weekend_nights', [5, 6], others({})),
    ).resolves.toBeUndefined();
    await expect(checkStructuredParameter('weekend_nights', [], others({}))).rejects.toMatchObject({
      code: 'PARAM_OUT_OF_RANGE',
    });
    await expect(
      checkStructuredParameter('hold_hours_options', [2, 6, 24, 48, 72, 96], others({})),
    ).rejects.toMatchObject({
      code: 'PARAM_OUT_OF_RANGE',
    });
  });
});

describe('V-09 card numbers', () => {
  it('Luhn 13–19 digits with spaces/dashes', () => {
    expect(looksLikeCardNumber('thẻ 4111 1111 1111 1111')).toBe(true);
    expect(looksLikeCardNumber('4111-1111-1111-1111')).toBe(true);
    expect(looksLikeCardNumber('SĐT 0901234567')).toBe(false);
    expect(looksLikeCardNumber('đơn OTM-00012 ngày 2026-10-15')).toBe(false);
  });
});

describe('guest JSON by role through the shared serializer (US-003)', () => {
  it('absent, never null; collaborator gets no tags', () => {
    expect(dropEmpty({ a: 1, n: null })).toEqual({ a: 1 });
    const row = {
      id: 'i',
      code: 'KH-0001',
      full_name: 'A',
      nationality_code: 'VN',
      phone_e164: '84905123456',
      tags: ['VIP'],
    } as unknown as Parameters<typeof summaryDto>[0];
    expect(serializeSchema('GuestSummary', summaryDto(row), { roles: ['collaborator'] })).toEqual({
      id: 'i',
      code: 'KH-0001',
      displayName: 'A',
      nationalityCode: 'VN',
      phoneMasked: '0905***456',
    });
    expect(
      serializeSchema('GuestSummary', summaryDto(row), { roles: ['sales_staff'] }),
    ).toHaveProperty('tags');
  });
});

describe('RateLimiter', () => {
  it('fixed window with Retry-After', () => {
    const clock = new FixedClock(new Date('2026-10-15T02:00:00Z'));
    const rl = new RateLimiter(clock);
    const rule = { limit: 2, windowMs: 60_000 };
    rl.consume('k', rule);
    rl.consume('k', rule);
    expect(() => rl.consume('k', rule)).toThrow();
    clock.advance(61_000);
    expect(() => rl.consume('k', rule)).not.toThrow();
  });
});
