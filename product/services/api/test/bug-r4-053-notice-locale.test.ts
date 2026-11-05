/**
 * BUG-R4-053 – SEC rule `rounds/round-04/reviews/SEC-on-ru-notice-locale-drill.md` mục 4 (no DB):
 * `notice_locale` = the session language when the notice version has a reviewed text in it, otherwise `en`.
 * U-a…U-d: the four required cases on the pure rule. T1–T3: the table. G-RU: the server table agrees with
 * guest-web (a version is `ru` on the server exactly when guest-web shows its legal block in RU) – the drift that
 * caused this bug (client unlocked RU in P4-42, server kept the vi/en list of 17/10).
 * HTTP cases on the real PostgreSQL: test/integration/bug-r4-053-ru-notice-locale.test.ts.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUEST_LOCALES } from '../src/modules/guest-portal/internal/guest-locale';
import {
  NOTICE_LOCALES_BY_VERSION,
  NOTICE_LOCALES_OF_UNKNOWN_VERSION,
  noticeLocaleShown,
} from '../src/modules/guest-portal/internal/guest-portal.service';
import { NOTICE_TEXT_VERSIONS } from '../src/modules/platform/public/notice-versions';

const V1 = 'privacy-2026-10-v1';
const V2 = 'privacy-2026-10-v2';

describe('BUG-R4-053 – noticeLocaleShown (SEC mục 4.5 a–d)', () => {
  it('U-a: ru + privacy-2026-10-v2 → ru (RU signed for v2, P4-42)', () => {
    expect(noticeLocaleShown(V2, 'ru')).toBe('ru');
  });

  it('U-b: vi → vi and en → en, on v1, v2 and an unknown version', () => {
    for (const v of [V1, V2, 'privacy-2027-01-v9']) {
      expect(noticeLocaleShown(v, 'vi'), v).toBe('vi');
      expect(noticeLocaleShown(v, 'en'), v).toBe('en');
    }
  });

  it('U-c: ru + privacy-2026-10-v1 → en (decision (a) 17/10 kept for v1)', () => {
    expect(noticeLocaleShown(V1, 'ru')).toBe('en');
  });

  it('U-d: ru + a version not in the table → en; exact match only; prototype keys are unknown', () => {
    for (const v of [
      'privacy-2027-01-v9',
      'privacy-2026-10-v2 ',
      'Privacy-2026-10-V2',
      '',
      'constructor',
      '__proto__',
      'toString',
      'hasOwnProperty',
    ]) {
      expect(noticeLocaleShown(v, 'ru'), JSON.stringify(v)).toBe('en');
    }
  });

  it('a session language outside the reviewed list is always en (never echoed)', () => {
    for (const l of ['ko', 'zh', 'fr', '', 'RU', 'ru-RU']) {
      expect(noticeLocaleShown(V2, l), JSON.stringify(l)).toBe('en');
    }
  });
});

describe('BUG-R4-053 – the table of reviewed notice languages', () => {
  it('T1: exactly the SEC list – v1: vi, en; v2: vi, en, ru; unknown: vi, en', () => {
    expect(
      Object.fromEntries(Object.entries(NOTICE_LOCALES_BY_VERSION).map(([k, v]) => [k, [...v]])),
    ).toEqual({ [V1]: ['vi', 'en'], [V2]: ['vi', 'en', 'ru'] });
    expect([...NOTICE_LOCALES_OF_UNKNOWN_VERSION]).toEqual(['vi', 'en']);
  });

  it('T2: cannot be changed at run time (table and every list frozen)', () => {
    expect(Object.isFrozen(NOTICE_LOCALES_BY_VERSION)).toBe(true);
    expect(Object.isFrozen(NOTICE_LOCALES_OF_UNKNOWN_VERSION)).toBe(true);
    for (const list of Object.values(NOTICE_LOCALES_BY_VERSION)) {
      expect(Object.isFrozen(list)).toBe(true);
    }
  });

  it('T3: every version has the EN lead + VI; only guest locales; every desk-settable version has a row', () => {
    for (const [v, list] of Object.entries(NOTICE_LOCALES_BY_VERSION)) {
      expect(list, v).toEqual(expect.arrayContaining(['vi', 'en']));
      expect(new Set(list).size, v).toBe(list.length);
      for (const l of list) expect(GUEST_LOCALES as readonly string[], `${v} ${l}`).toContain(l);
    }
    // A version the desk may set (P4-16 allowlist) gets a deliberate row, not the "unknown" fallback.
    for (const v of NOTICE_TEXT_VERSIONS) {
      expect(Object.hasOwn(NOTICE_LOCALES_BY_VERSION, v), v).toBe(true);
    }
  });
});

describe('BUG-R4-053 – server table = what guest-web shows (G-RU)', () => {
  // Resolved from this file, not from the directory the tests run in (same as P4-16 G1).
  const GUEST_APP = resolve(__dirname, '../../../apps/guest-web/src/app');
  const literal = /'([^'\\]*)'|"([^"\\]*)"/g;

  /** The string literals of the ONE array declared as `<head> … [ … ]`; red (never skipped) if not found once. */
  function literalArray(file: string, head: RegExp, what: string): string[] {
    const src = readFileSync(resolve(GUEST_APP, file), 'utf8');
    const matches = [...src.matchAll(head)];
    expect(matches.length, `${what} not found exactly once in guest-web ${file}`).toBe(1);
    const inner = (matches[0]?.[1] ?? '').replace(/\/\/[^\n]*/g, '');
    expect(
      inner.replace(literal, '').replace(/[\s,]/g, ''),
      `${what} must be an array of string literals`,
    ).toBe('');
    return [...inner.matchAll(literal)].map((x) => x[1] ?? x[2] ?? '');
  }

  it('G-RU: for every guest-web notice version, ru is reviewed on the server ⇔ guest-web RU_UNREVIEWED_LEGAL is empty', () => {
    const versions = literalArray(
      'config.ts',
      /^export const NOTICE_TEXT_VERSIONS[^=]*=\s*\[([^\]]*)\]/gm,
      'NOTICE_TEXT_VERSIONS',
    );
    const unreviewed = literalArray(
      'i18n.tsx',
      /^const RU_UNREVIEWED_LEGAL\b[^=]*=\s*new Set(?:<[^>]*>)?\(\s*\[([^\]]*)\]\s*\)/gm,
      'RU_UNREVIEWED_LEGAL',
    );
    expect(versions.length).toBeGreaterThan(0);
    const guestShowsRu = unreviewed.length === 0;
    for (const v of versions) {
      expect(
        noticeLocaleShown(v, 'ru') === 'ru',
        guestShowsRu
          ? `guest-web shows the RU legal text of ${v} but the server would record en – add ru to ` +
              'NOTICE_LOCALES_BY_VERSION (guest-portal.service.ts) only with the SEC + UXD sign-off of that version'
          : `guest-web shows the EN legal text on the RU page (RU_UNREVIEWED_LEGAL not empty) but the server ` +
              `would record ru for ${v} – remove ru from NOTICE_LOCALES_BY_VERSION for that version`,
      ).toBe(guestShowsRu);
    }
  });
});
