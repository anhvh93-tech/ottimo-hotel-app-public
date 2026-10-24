// Build switches of the booking request (US-155 v1.0): the production build stays as today unless
// LANDING_BOOKING_FORM=true; the API base is the same origin unless an https origin is given.
import { describe, expect, it } from 'vitest';
import { PRIVACY_NOTICE } from '../content/privacy';
import {
  BOOKING_REQUEST_ENABLED,
  PRIVACY_NOTICE_VERSION,
  PUBLIC_FORM_API_BASE,
  parseApiBase,
} from './booking-request';

describe('booking request build switches', () => {
  it('off by default (ottimo.vn unchanged); same origin by default', () => {
    if (process.env.LANDING_BOOKING_FORM !== 'true') expect(BOOKING_REQUEST_ENABLED).toBe(false);
    if (!process.env.PUBLIC_FORM_API_BASE) expect(PUBLIC_FORM_API_BASE).toBe('');
  });
  it('consentVersion comes from the published notice file, never typed by hand', () => {
    expect(PRIVACY_NOTICE_VERSION).toBe(PRIVACY_NOTICE.version);
    expect(PRIVACY_NOTICE_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('PUBLIC_FORM_API_BASE: empty → same origin; https origin kept; path, http or junk refused', () => {
    expect(parseApiBase(undefined)).toBe('');
    expect(parseApiBase('  ')).toBe('');
    expect(parseApiBase('https://desk.ottimo.vn')).toBe('https://desk.ottimo.vn');
    expect(parseApiBase('https://desk.ottimo.vn/')).toBe('https://desk.ottimo.vn');
    expect(parseApiBase('http://127.0.0.1:5190')).toBe('http://127.0.0.1:5190');
    expect(() => parseApiBase('https://desk.ottimo.vn/v1')).toThrow();
    expect(() => parseApiBase('http://desk.ottimo.vn')).toThrow();
    expect(() => parseApiBase('https://desk.ottimo.vn/?x=1')).toThrow();
    expect(() => parseApiBase('desk.ottimo.vn')).toThrow();
  });
  it('the privacy notice: EN and VI have the same topics, titles fit, calm voice', () => {
    expect(PRIVACY_NOTICE.en.sections).toHaveLength(PRIVACY_NOTICE.vi.sections.length);
    for (const lang of ['en', 'vi'] as const) {
      const p = PRIVACY_NOTICE[lang];
      expect(p.title.length).toBeLessThanOrEqual(60);
      expect(p.description.length).toBeLessThanOrEqual(160);
      const all = [p.intro, ...p.sections.flatMap((s) => [s.h, ...s.p]), p.version].join(' ');
      expect(all).not.toMatch(/!|\p{Extended_Pictographic}/u);
      // upper bounds of the SEC retention ranges (erd 4.14) – true whatever the owner sets inside them
      expect(all).toMatch(/180/);
      expect(all).toMatch(/60/);
      expect(all).toContain(PRIVACY_NOTICE.version);
    }
  });
});
