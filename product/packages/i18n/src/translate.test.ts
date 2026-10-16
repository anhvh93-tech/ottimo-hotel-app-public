import { describe, expect, it } from 'vitest';
import {
  allKeys,
  formatInstant,
  formatLocalDate,
  formatNumber,
  pendingKeys,
  translate,
  uxdKeys,
} from './translate';

describe('translate', () => {
  it('interpolates {args} and falls back to the key', () => {
    expect(translate('vi', 'error.RATE_LIMITED', { minutes: 15 })).toContain('15 phút');
    expect(translate('en', 'login.submit')).toBe('Sign in');
    expect(translate('vi', 'no.such.key')).toBe('no.such.key');
  });

  it('pending keys exist in VI and EN and are not yet in the UXD files', () => {
    expect([...pendingKeys('vi')].sort()).toEqual([...pendingKeys('en')].sort());
    for (const key of pendingKeys('vi')) {
      expect(uxdKeys('vi').has(key), `${key} now in strings-vi.json – remove from pending`).toBe(
        false,
      );
    }
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
