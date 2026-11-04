import { describe, expect, it } from 'vitest';
import { ApiError } from '@ottimo/api-client';
import { problemText } from '../app/problem';
import { pickCheckin, pickStayLevel1, type GuestStayRaw, type OnlineCheckin } from '../app/api';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ru from '../../../../design/copy/strings-ru.json';
import {
  browserLocale,
  LEGAL_KEYS,
  legalLocale,
  shownLocale,
  shortDate,
  supportLocale,
  translateGuest,
} from '../app/i18n';
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
  it('RU falls back to EN per key (non-legal keys without RU) and records the shown locale', () => {
    expect(translateGuest('ru', 'common.back')).toBe('Назад');
    expect(translateGuest('ru', 'gw.doc_type')).toBe('Тип документа');
    expect(shownLocale('vi', 'guest.oci.consent')).toBe('vi');
    expect(shownLocale('en', 'guest.oci.consent')).toBe('en');
  });

  // P4-42 (SEC-on-privacy-v2-ru 4.3–4.4): the 11 legal keys of privacy-2026-10-v2 are reviewed RU – none falls
  // back to EN, and the consent evidence (`shownLocale`) is `ru` for every one of them.
  const LEGAL_V2 = [
    'gw.notice_body',
    'gw.notice_retention',
    'gw.notice_translation',
    'gw.notice_rights',
    'guest.oci.why',
    'guest.oci.consent_q',
    'guest.oci.consent',
    'guest.oci.consent_no',
    'guest.oci.consent_optional',
    'guest.oci.withdraw_hint',
    'gw.notice_read',
  ];
  it.each(LEGAL_V2)('RU legal key %s: shown in RU, evidence ru', (key) => {
    expect(shownLocale('ru', key)).toBe('ru');
    expect(translateGuest('ru', key, { days: 30 })).not.toBe(
      translateGuest('en', key, { days: 30 }),
    );
  });
  it('FB-R4-SEC-MOB-P442-02: LEGAL_KEYS is exactly the gen_strings group privacy-2026-10-v2', () => {
    const py = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'design', 'tools', 'gen_strings.py'),
      'utf8',
    );
    const start = py.indexOf('g("v1.0.4 P4-42 privacy-2026-10-v2", [');
    expect(start).toBeGreaterThan(0);
    const block = py.slice(start, py.indexOf('\n])', start));
    const keys = [...block.matchAll(/^ {4}\("([a-z_.]+)",/gm)].map((m) => m[1]);
    expect([...LEGAL_KEYS].sort()).toEqual(keys.sort());
    expect([...LEGAL_KEYS].sort()).toEqual([...LEGAL_V2].sort());
  });
  it('FB-R4-SEC-MOB-P442-02: the legal block is one language – shown, marked and recorded', () => {
    for (const loc of ['vi', 'en', 'ru'] as const) expect(legalLocale(loc)).toBe(loc);
    // A later version missing ONE RU paragraph: the whole block (and the evidence) is EN, never half RU.
    const dict = ru as Record<string, unknown>;
    const saved = dict['gw.notice_rights'];
    delete dict['gw.notice_rights'];
    try {
      expect(legalLocale('ru')).toBe('en');
      for (const key of LEGAL_KEYS) {
        expect(shownLocale('ru', key), key).toBe('en');
        expect(translateGuest('ru', key, { days: 30 }), key).toBe(
          translateGuest('en', key, { days: 30 }),
        );
      }
      // Copy outside the legal group keeps the page language.
      expect(translateGuest('ru', 'common.back')).toBe('Назад');
      expect(legalLocale('vi')).toBe('vi');
    } finally {
      dict['gw.notice_rights'] = saved;
    }
    expect(legalLocale('ru')).toBe('ru');
  });
  it('the RU legal text is exactly the reviewed wording (U+00A0 kept, UXD-on-privacy-v2-ru §2 = SEC §2–3)', () => {
    expect(translateGuest('ru', 'guest.oci.consent', { days: 30 })).toContain(
      'до 30 дн. после выезда',
    );
    expect(translateGuest('ru', 'gw.notice_retention')).toContain('не более 35\u00a0дней');
    expect(translateGuest('ru', 'gw.notice_retention')).toContain('в течение 3\u00a0месяцев');
    expect(translateGuest('ru', 'gw.notice_body')).toContain(
      'Если вы не разрешите, это не повлияет на ваше проживание.',
    );
    expect(translateGuest('ru', 'guest.oci.why')).toBe(
      'Зачем? По закону Вьетнама мы обязаны регистрировать проживание каждого гостя.',
    );
    expect(translateGuest('ru', 'gw.notice_read')).toBe('Прочитано');
  });
  it('browser default (P-S4-10): vi* → VI, ru* → RU, anything else → EN', () => {
    expect(browserLocale(['vi-VN'])).toBe('vi');
    expect(browserLocale(['vi'])).toBe('vi');
    expect(browserLocale(['ru-RU'])).toBe('ru');
    expect(browserLocale(['en-US'])).toBe('en');
    expect(browserLocale(['fr-FR'])).toBe('en');
    expect(browserLocale(['ko-KR', 'vi-VN'])).toBe('en'); // first preference only
    expect(browserLocale([])).toBe('en');
  });
  it('support line language under an English brand moment (DS 11.2)', () => {
    expect(supportLocale('en')).toBe('vi');
    expect(supportLocale('vi')).toBe('vi');
    expect(supportLocale('ru')).toBe('ru');
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
    // FB-INV-004 (DOM F4): check-in from 12:00 → four windows, the evening one 18–22.
    expect(etaSlots('12:00').map((s) => s.label)).toEqual([
      '12:00 – 14:00',
      '14:00 – 16:00',
      '16:00 – 18:00',
      '18:00 – 22:00',
      '22:00+',
    ]);
    // Never more than four windows before "22:00+", even for an early standard time.
    expect(etaSlots('08:00').filter((s) => !s.late)).toHaveLength(4);
    expect(etaSlots('08:00').at(-2)!.label).toBe('14:00 – 22:00');
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
