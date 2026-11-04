/**
 * v1.0.4 P4-16 (SEC-BA-104-09 a, ARC "v1.0.4 notice-version allowlist" mục 3): the Desk parameter
 * `privacy_notice_version` only takes a version that has a text on guest-web and on the desk sheet.
 * U1–U5: the rule in checkStructuredParameter. G1–G2: the server list is the same list as guest-web's.
 * G3 (SEC P416-01): one version only until SEC-BA-104-09 (b) ships.
 * HTTP cases I1–I6: test/integration/v104-notice-allowlist.test.ts.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkStructuredParameter } from '../src/modules/platform/internal/parameter-rules';
import { NOTICE_TEXT_VERSIONS } from '../src/modules/platform/public/notice-versions';

const KEY = 'privacy_notice_version';
const noOther = async (k: string): Promise<unknown> => {
  throw new Error(`unexpected read of ${k}`);
};
const outOfRange = {
  code: 'PARAM_OUT_OF_RANGE',
  options: {
    errors: [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }],
    extras: { allowed: ['privacy-2026-10-v2'] },
  },
};

describe('privacy_notice_version allowlist (P4-16, U1–U5)', () => {
  it('U1: privacy-2026-10-v2 passes', async () => {
    await expect(
      checkStructuredParameter(KEY, 'privacy-2026-10-v2', noOther),
    ).resolves.toBeUndefined();
  });

  it('U2: privacy-2026-10-v1 → PARAM_OUT_OF_RANGE with allowed = [v2] (no way back to v1)', async () => {
    await expect(
      checkStructuredParameter(KEY, 'privacy-2026-10-v1', noOther),
    ).rejects.toMatchObject(outOfRange);
  });

  it('U3: exact match only – trailing space, other case, unknown version, empty string', async () => {
    for (const v of [
      'privacy-2026-10-v2 ',
      ' privacy-2026-10-v2',
      'Privacy-2026-10-V2',
      'privacy-2026-10-v3',
      '',
    ]) {
      await expect(
        checkStructuredParameter(KEY, v, noOther),
        JSON.stringify(v),
      ).rejects.toMatchObject(outOfRange);
    }
  });

  it('U4: non-strings → PARAM_OUT_OF_RANGE at function level (HTTP answers VALIDATION_FAILED first)', async () => {
    for (const v of [2, null, undefined, ['privacy-2026-10-v2'], { v: 'privacy-2026-10-v2' }]) {
      await expect(
        checkStructuredParameter(KEY, v, noOther),
        JSON.stringify(v),
      ).rejects.toMatchObject(outOfRange);
    }
  });

  it('U5: other keys are not affected (checkout_time still runs the time-order rule)', async () => {
    const others = (m: Record<string, unknown>) => async (k: string) => m[k];
    await expect(
      checkStructuredParameter('checkout_time', '12:00', others({ late_grace_until: '12:30' })),
    ).resolves.toBeUndefined();
    await expect(
      checkStructuredParameter('checkout_time', '13:00', others({ late_grace_until: '12:30' })),
    ).rejects.toMatchObject({ code: 'PARAM_OUT_OF_RANGE', options: { extras: { max: '12:30' } } });
    // A version string on another text key is not checked against the notice list.
    await expect(
      checkStructuredParameter('some_other_text_key', 'privacy-2026-10-v1', others({})),
    ).resolves.toBeUndefined();
  });

  it('the error body never echoes the submitted value (only allowed + errors)', async () => {
    const err = await checkStructuredParameter(KEY, 'privacy-2026-10-SECRET', noOther).catch(
      (e: unknown) => e,
    );
    expect(JSON.stringify((err as { toBody(): unknown }).toBody())).not.toContain('SECRET');
  });
});

describe('privacy_notice_version allowlist – same list as guest-web (P4-16, G1–G2)', () => {
  // Resolved from this file, not from the directory the tests run in (SEC P416-02).
  const GUEST_CONFIG = resolve(__dirname, '../../../apps/guest-web/src/app/config.ts');

  it('G1: server NOTICE_TEXT_VERSIONS = guest-web NOTICE_TEXT_VERSIONS (apps/guest-web/src/app/config.ts)', () => {
    const src = readFileSync(GUEST_CONFIG, 'utf8');
    const m = /export const NOTICE_TEXT_VERSIONS[^=]*=\s*\[([^\]]*)\]/.exec(src);
    // No array found = red, never skipped: the guard must not silently stop guarding.
    expect(m, 'NOTICE_TEXT_VERSIONS array not found in guest-web config.ts').not.toBeNull();
    const inner = m?.[1] ?? '';
    const literal = /'([^'\\]*)'|"([^"\\]*)"/g;
    const guestList = [...inner.matchAll(literal)].map((x) => x[1] ?? x[2] ?? '');
    // Anything left once the literals, commas and whitespace are removed (a constant, a spread, a template…)
    // means the regex did not read the real list – red rather than a false green (SEC P416-02).
    expect(
      inner.replace(literal, '').replace(/[\s,]/g, ''),
      'NOTICE_TEXT_VERSIONS phải là mảng chuỗi literal',
    ).toBe('');
    expect(
      [...guestList].sort(),
      'guest-web and API notice versions differ – change BOTH (services/api/src/modules/platform/public/' +
        'notice-versions.ts and apps/guest-web/src/app/config.ts), with the notice text and the SEC sign-off',
    ).toEqual([...NOTICE_TEXT_VERSIONS].sort());
  });

  it('G3: exactly one version until SEC-BA-104-09 (b) ships (SEC P416-01)', () => {
    expect(
      NOTICE_TEXT_VERSIONS,
      'Thêm version thứ hai cần SEC-BA-104-09(b) (ghi đè cùng ngày có giới hạn) đã gộp và SEC duyệt – ' +
        'xem decision-log 04/11. Không sửa test này để qua.',
    ).toHaveLength(1);
  });

  it('the server list cannot be changed at run time (frozen)', () => {
    expect(Object.isFrozen(NOTICE_TEXT_VERSIONS)).toBe(true);
  });

  it('G2: list not empty, no duplicates, every version passes the ConsentInput.noticeVersion rule', () => {
    expect(NOTICE_TEXT_VERSIONS.length).toBeGreaterThan(0);
    expect(new Set(NOTICE_TEXT_VERSIONS).size).toBe(NOTICE_TEXT_VERSIONS.length);
    // Same rule as registration.controller.ts ConsentInput (a listed version can always be recorded).
    for (const v of NOTICE_TEXT_VERSIONS) expect(v).toMatch(/^[A-Za-z0-9._-]{1,64}$/);
  });
});
