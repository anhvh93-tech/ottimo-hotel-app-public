import { describe, expect, it } from 'vitest';
import { ApiError } from '@ottimo/api-client';
import { problemText } from '../app/problem';
import { pickCheckin, pickStayLevel1, type GuestStayRaw, type OnlineCheckin } from '../app/api';
import { browserLocale, shownLocale, shortDate, translateGuest } from '../app/i18n';
import { readLink, safeMapUrl, telHref } from '../app/link';
import { cleanNote, containsCardNumber } from '../app/validation';
import { etaSlots, slotOf } from '../checkin/eta';

describe('link (SR-GST-01/02)', () => {
  it('accepts only well-formed tokens', () => {
    expect(readLink('/g/AbCdEfGhIjKlMnOpQrStUv')).toEqual({
      kind: 'token',
      token: 'AbCdEfGhIjKlMnOpQrStUv',
    });
    expect(readLink('/g/short')).toEqual({ kind: 'malformed' });
    expect(readLink('/g/' + 'a'.repeat(65))).toEqual({ kind: 'malformed' });
    expect(readLink('/g/abc$def/../x')).toEqual({ kind: 'malformed' });
    expect(readLink('/')).toEqual({ kind: 'none' });
  });
  it('map links only on the SEC E14-08 host list', () => {
    expect(safeMapUrl('https://maps.google.com/?q=x')).toBeTruthy();
    expect(safeMapUrl('https://www.google.com/maps/place/x')).toBeTruthy();
    expect(safeMapUrl('https://www.google.com/search?q=x')).toBeUndefined();
    expect(safeMapUrl('http://maps.google.com/')).toBeUndefined();
    expect(safeMapUrl('https://maps.google.com.evil.io/')).toBeUndefined();
    expect(safeMapUrl('javascript:alert(1)')).toBeUndefined();
  });
  it('tel links keep digits only', () => {
    expect(telHref('+84 263 000 000')).toBe('tel:+84263000000');
    expect(telHref('call me')).toBeUndefined();
  });
});

describe('level-1 whitelists (SEC ĐK-2, s3-checklist G2)', () => {
  it('GuestStay drops guestFullName / doorCode', () => {
    const raw = {
      reservationCode: 'OTM-1',
      status: 'confirmed',
      arrivalDate: '2026-10-19',
      departureDate: '2026-10-20',
      checkinTime: '14:00',
      checkoutTime: '12:00',
      property: { name: 'X' },
      guestFullName: 'Full Name',
      doorCode: { code: '123456' },
      doorCodeAvailableFrom: '2026-10-19T14:00:00+07:00',
    } as unknown as GuestStayRaw;
    const out = pickStayLevel1(raw);
    expect(Object.keys(out)).not.toContain('guestFullName');
    expect(Object.keys(out)).not.toContain('doorCode');
    expect(JSON.stringify(out)).not.toContain('123456');
  });
  it('OnlineCheckin keeps only the 9 allowed keys', () => {
    const raw = {
      currentStep: 'eta',
      requiredPeople: 2,
      uploadedPeople: [1],
      arrivalNote: 'secret',
      documents: [{ number: 'B123' }],
    } as unknown as OnlineCheckin;
    expect(pickCheckin(raw)).toEqual({
      currentStep: 'eta',
      requiredPeople: 2,
      uploadedPeople: [1],
    });
  });
});

describe('i18n VI/EN/RU', () => {
  it('RU falls back to EN per key and records the shown locale for consent', () => {
    expect(translateGuest('ru', 'common.back')).toBe('Назад');
    expect(translateGuest('ru', 'gw.doc_type')).toBe('Тип документа');
    // legal text: approved EN until the RU draft is reviewed (HR-01)
    expect(translateGuest('ru', 'gw.notice_body')).toBe(translateGuest('en', 'gw.notice_body'));
    expect(translateGuest('ru', 'guest.oci.consent_no')).toBe(
      translateGuest('en', 'guest.oci.consent_no'),
    );
    expect(shownLocale('ru', 'guest.oci.consent')).toBe('en');
    expect(shownLocale('vi', 'guest.oci.consent')).toBe('vi');
  });
  it('browser default: en* → EN, ru* → RU, else VI', () => {
    expect(browserLocale(['en-US'])).toBe('en');
    expect(browserLocale(['ru'])).toBe('ru');
    expect(browserLocale(['fr-FR'])).toBe('vi');
  });
  it('short dates', () => {
    expect(shortDate('vi', '2026-10-19')).toBe('19/10');
    expect(shortDate('en', '2026-10-19')).toBe('19 Oct');
  });
});

describe('arrival note (V-09)', () => {
  it('detects Luhn card numbers, not phone numbers', () => {
    expect(containsCardNumber('4111 1111 1111 1111')).toBe(true);
    expect(containsCardNumber('call 0909 123 456')).toBe(false);
    expect(containsCardNumber('1234 5678 9012 3456')).toBe(false);
  });
  it('strips control characters', () => {
    expect(cleanNote(' a\u0007b\n ')).toBe('a\u0007b'.replace('\u0007', ''));
  });
});

describe('arrival windows (H18 18.3)', () => {
  it('2-hour windows from check-in time, one to 22:00, then late', () => {
    expect(etaSlots('14:00').map((s) => s.label)).toEqual([
      '14:00 – 16:00',
      '16:00 – 18:00',
      '18:00 – 22:00',
      '22:00+',
    ]);
    expect(etaSlots('20:00').map((s) => s.label)).toEqual(['20:00 – 22:00', '22:00+']);
    const late = etaSlots('14:00').at(-1)!;
    expect(late).toMatchObject({ etaTime: '22:00', late: true });
  });
  it('re-selects the saved window', () => {
    const slots = etaSlots('14:00');
    expect(slotOf(slots, '17:30', false)).toBe('16:00');
    expect(slotOf(slots, '22:00', true)).toBe('late');
    expect(slotOf(slots, undefined, false)).toBeUndefined();
  });
});

describe('problemText (guest wording)', () => {
  it('5xx with a reference → gw.error_server, never the staff "báo quản lý" sentence', () => {
    const t = (k: string, a?: Record<string, string | number>) => translateGuest('vi', k, a);
    const e = new ApiError(500, {
      type: 'about:blank',
      title: '500',
      status: 500,
      code: 'INTERNAL_ERROR',
      requestId: 'req-42',
    });
    const text = problemText(t, e);
    expect(text).toBe(translateGuest('vi', 'gw.error_server', { request_id: 'req-42' }));
    expect(text).not.toMatch(/quản lý/);
  });
});
