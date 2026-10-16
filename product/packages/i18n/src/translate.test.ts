import { beforeAll, describe, expect, it } from 'vitest';
import {
  allKeys,
  formatInstant,
  formatLocalDate,
  formatNumber,
  isLocaleLoaded,
  loadLocale,
  translate,
} from './translate';

describe('lazy EN chunk', () => {
  it('shows VI text until EN is loaded, then English', async () => {
    expect(isLocaleLoaded('en')).toBe(false);
    expect(translate('en', 'login.submit')).toBe(translate('vi', 'login.submit'));
    expect(() => allKeys('en')).toThrow();
    await loadLocale('en');
    expect(isLocaleLoaded('en')).toBe(true);
    expect(translate('en', 'login.submit')).toBe('Sign in');
  });
});

describe('translate', () => {
  beforeAll(() => loadLocale('en'));

  it('interpolates {args} and falls back to the key', () => {
    expect(translate('vi', 'error.RATE_LIMITED', { minutes: 15 })).toContain('15 phút');
    expect(translate('en', 'login.submit')).toBe('Sign in');
    expect(translate('vi', 'no.such.key')).toBe('no.such.key');
  });

  it('VI and EN have the same keys', () => {
    expect([...allKeys('en')].filter((k) => !allKeys('vi').has(k))).toEqual([]);
  });

  it('formats money and dates the Vietnamese way', () => {
    expect(formatNumber('vi', 11500000)).toBe('11.500.000');
    expect(formatLocalDate('2026-10-16')).toBe('16/10/2026');
    expect(formatInstant('vi', '2026-10-15T02:30:00Z')).toBe('15/10/2026 09:30');
  });
});
