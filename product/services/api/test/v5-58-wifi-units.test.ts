/**
 * V5-58 (OpenAPI 0.3.13 1.13, 1.23, bổ sung 1e) – pure rules of the property Wi-Fi and of the caller-password
 * comparison limit (`CALLER_PASSWORD_COMPARE_RULE`). The HTTP + PostgreSQL cases are in
 * test/integration/v5-58-property-wifi.test.ts. Placeholder values only (`<wifi-password>`).
 */
import { describe, expect, it } from 'vitest';
import {
  CALLER_PASSWORD_COMPARE_LIMIT,
  CALLER_PASSWORD_COMPARE_RULE,
  CALLER_PASSWORD_COMPARE_WINDOW_MS,
  callerPasswordBucket,
  callerPasswordWindowStart,
} from '../src/modules/identity/public/caller-password-match';
import {
  WIFI_PASSWORD_COMPARE_BUCKET,
  WIFI_SSID_MAX_BYTES,
  ssidHasRoomNumber,
  ssidShapeOk,
  ssidWords,
  wifiPasswordShapeOk,
  wifiShapeErrors,
  wifiView,
} from '../src/modules/platform/internal/property-wifi';
import { wifiOf } from '../src/modules/platform/public/property-wifi';

describe('V5-58 ssid shape (SEC ARC-05: 1–32 bytes UTF-8, no control character)', () => {
  it('counts bytes, not characters', () => {
    expect(WIFI_SSID_MAX_BYTES).toBe(32);
    expect(ssidShapeOk('OTTIMO BOUTIQUE STAY')).toBe(true);
    expect(ssidShapeOk('A'.repeat(32))).toBe(true);
    expect(ssidShapeOk('A'.repeat(33))).toBe(false);
    // "Đà Lạt" letters take 2–3 bytes: 11 × "ạ" (3 bytes) = 33 bytes although only 11 characters.
    expect(ssidShapeOk('ạ'.repeat(10))).toBe(true);
    expect(ssidShapeOk('ạ'.repeat(11))).toBe(false);
    expect(ssidShapeOk('OTTIMO Đà Lạt')).toBe(true);
  });
  it('refuses an empty name and control characters', () => {
    expect(ssidShapeOk('')).toBe(false);
    expect(ssidShapeOk('OTTIMO\tSTAY')).toBe(false);
    expect(ssidShapeOk('OTTIMO\u0000')).toBe(false);
    expect(ssidShapeOk('OTTIMO\u007f')).toBe(false);
  });
});

describe('V5-58 password shape (BE C0313-16: empty or 8–63 printable ASCII)', () => {
  it('open network or WPA2-PSK length', () => {
    expect(wifiPasswordShapeOk('')).toBe(true);
    expect(wifiPasswordShapeOk('<wifi-p')).toBe(false); // 7
    expect(wifiPasswordShapeOk('<wifi-pa')).toBe(true); // 8
    expect(wifiPasswordShapeOk('x'.repeat(63))).toBe(true);
    expect(wifiPasswordShapeOk('x'.repeat(64))).toBe(false);
    expect(wifiPasswordShapeOk(' <wifi-password> ')).toBe(true); // space is printable (0x20)
  });
  it('refuses non-ASCII and control characters', () => {
    expect(wifiPasswordShapeOk('mật-khẩu-wifi')).toBe(false);
    expect(wifiPasswordShapeOk('<wifi-password>\t')).toBe(false);
    expect(wifiPasswordShapeOk('<wifi-password>\u007f')).toBe(false);
  });
  it('errors carry field and code only, in field order', () => {
    expect(wifiShapeErrors({ ssid: '', password: 'short' })).toEqual({
      errors: [
        { field: 'ssid', code: 'VALUE_OUT_OF_RANGE' },
        { field: 'password', code: 'VALUE_OUT_OF_RANGE' },
      ],
      ssidOk: false,
      passwordOk: false,
    });
    expect(wifiShapeErrors({ ssid: 'OTTIMO', password: '' }).errors).toEqual([]);
  });
});

describe('V5-58 room number as a word of its own (BR-012 (7))', () => {
  const rooms = ['101', '202', '401', 'A1'];
  it('splits on anything that is not a letter or a digit', () => {
    expect(ssidWords('OTTIMO 401')).toEqual(['OTTIMO', '401']);
    expect(ssidWords('ottimo-401_guest')).toEqual(['OTTIMO', '401', 'GUEST']);
    expect(ssidWords('OTTIMO Đà Lạt')).toEqual(['OTTIMO', 'ĐÀ', 'LẠT']);
  });
  it('refuses a room number as a word, keeps it inside a longer word', () => {
    expect(ssidHasRoomNumber('OTTIMO 401', rooms)).toBe(true);
    expect(ssidHasRoomNumber('401', rooms)).toBe(true);
    expect(ssidHasRoomNumber('OTTIMO-202', rooms)).toBe(true);
    expect(ssidHasRoomNumber('ottimo a1', rooms)).toBe(true);
    expect(ssidHasRoomNumber('OTTIMO401', rooms)).toBe(false);
    expect(ssidHasRoomNumber('OTTIMO 2026', rooms)).toBe(false);
    expect(ssidHasRoomNumber('OTTIMO BOUTIQUE STAY', rooms)).toBe(false);
  });
});

describe('V5-58 one reading rule with the guest page (wifiOf, T58-8)', () => {
  it('flat form first, then the language, then vi', () => {
    expect(wifiOf(null, 'vi')).toBeNull();
    expect(wifiOf({ ssid: 'OTTIMO', password: '<wifi-password>' }, 'en')).toEqual({
      ssid: 'OTTIMO',
      password: '<wifi-password>',
    });
    const legacy = {
      vi: { ssid: 'OTTIMO-VI', password: '<wifi-password-vi>' },
      en: { ssid: 'OTTIMO-EN', password: '<wifi-password-en>' },
    };
    expect(wifiOf(legacy, 'vi')?.ssid).toBe('OTTIMO-VI');
    expect(wifiOf(legacy, 'en')?.ssid).toBe('OTTIMO-EN');
    expect(wifiOf(legacy, 'ko')?.ssid).toBe('OTTIMO-VI');
    expect(wifiOf({ ssid: 'OPEN' }, 'vi')).toEqual({ ssid: 'OPEN', password: '' });
  });
  it('getPropertyWifi view: configured, passwordSet', () => {
    expect(wifiView(null)).toEqual({ configured: false });
    expect(wifiView({ ssid: 'OPEN', password: '' })).toEqual({
      configured: true,
      ssid: 'OPEN',
      password: '',
      passwordSet: false,
    });
  });
});

describe('caller-password comparison limit (rule id in one constant)', () => {
  it('rule id, 5 per user, fixed 24 h window', () => {
    expect(CALLER_PASSWORD_COMPARE_RULE).toBe('SR-RL-10');
    expect(CALLER_PASSWORD_COMPARE_LIMIT).toBe(5);
    expect(CALLER_PASSWORD_COMPARE_WINDOW_MS).toBe(86_400_000);
  });
  it('bucket = wifi_pw_cmp:<user_id> (ORC on BE C0313-24), ids only', () => {
    const userId = '0190a7e2-0000-7000-8000-000000000001';
    expect(callerPasswordBucket(WIFI_PASSWORD_COMPARE_BUCKET, userId)).toBe(
      `wifi_pw_cmp:${userId}`,
    );
    expect(callerPasswordBucket(WIFI_PASSWORD_COMPARE_BUCKET, userId).length).toBeLessThanOrEqual(
      200,
    );
  });
  it('the window holding a time starts on the 24 h boundary', () => {
    expect(callerPasswordWindowStart(new Date('2026-10-15T02:00:00Z')).toISOString()).toBe(
      '2026-10-15T00:00:00.000Z',
    );
    expect(callerPasswordWindowStart(new Date('2026-10-15T23:59:59Z')).toISOString()).toBe(
      '2026-10-15T00:00:00.000Z',
    );
    expect(callerPasswordWindowStart(new Date('2026-10-16T00:00:00Z')).toISOString()).toBe(
      '2026-10-16T00:00:00.000Z',
    );
  });
});
