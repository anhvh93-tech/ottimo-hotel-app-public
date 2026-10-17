// Language suggestion logic (ADR-014 3.2): preferred = stored choice, else browser language, else English.
import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  preferredLang,
  primaryLang,
  readChoice,
  saveChoice,
  suggestion,
} from './lang';

const PUBLISHED = ['en', 'vi'];

describe('language suggestion', () => {
  it('reads the primary subtag', () => {
    expect(primaryLang('vi-VN')).toBe('vi');
    expect(primaryLang('EN_us')).toBe('en');
    expect(primaryLang(undefined)).toBe('');
  });

  it('prefers the stored choice over the browser language', () => {
    expect(preferredLang('en', ['vi-VN'], PUBLISHED)).toBe('en');
    expect(preferredLang('vi', ['en-US'], PUBLISHED)).toBe('vi');
  });

  it('falls back to the browser language, then English (= x-default)', () => {
    expect(preferredLang(null, ['vi-VN', 'en'], PUBLISHED)).toBe('vi');
    expect(preferredLang(null, ['ru-RU'], PUBLISHED)).toBe('en');
    expect(preferredLang(null, [], PUBLISHED)).toBe('en');
    expect(preferredLang('ru', ['vi'], PUBLISHED)).toBe('vi'); // stored language not published yet
  });

  it('suggests only another language the page exists in', () => {
    expect(suggestion('en', 'vi', PUBLISHED)).toBe('vi');
    expect(suggestion('vi', 'vi', PUBLISHED)).toBeNull();
    expect(suggestion('en', 'vi', ['en'])).toBeNull();
  });

  it('survives blocked storage', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
    };
    expect(readChoice(blocked)).toBeNull();
    expect(() => saveChoice(blocked, 'vi')).not.toThrow();
    const store = new Map<string, string>();
    const ok = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    saveChoice(ok, 'vi');
    expect(store.get(STORAGE_KEY)).toBe('vi');
    expect(readChoice(ok)).toBe('vi');
  });
});
