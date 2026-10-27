// BUG-R3-021 (QA 27/10, staging rc.3): the property has no Wi-Fi on file, so the server sends `wifi: null` on the arrival
// day too – the page still said "Hiện ở đây vào ngày nhận phòng (27/10)" ON 27/10. From the arrival day on (property
// time, Asia/Ho_Chi_Minh) or while in house, `null` now means "ask the front desk"; before it, the promise stays.
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GuestStay } from '../app/api';
import { GuestI18nProvider, translateGuest } from '../app/i18n';
import { WifiBlock } from '../pages/WifiBlock';

afterEach(() => vi.useRealTimers());

const stay = (patch: Partial<GuestStay>): GuestStay =>
  ({
    reservationCode: 'OTM-0359',
    status: 'confirmed',
    stayType: 'short',
    roomName: 'The Bloom',
    publicRoomType: null,
    arrivalDate: '2026-10-27',
    departureDate: '2026-10-29',
    checkinTime: '12:00',
    checkoutTime: '12:00',
    property: {},
    wifi: null,
    onlineCheckinAvailable: true,
    ...patch,
  }) as GuestStay;

function show(s: GuestStay, locale: 'vi' | 'en' = 'vi') {
  render(
    <GuestI18nProvider locale={locale}>
      <WifiBlock stay={s} />
    </GuestI18nProvider>,
  );
}
/** Device clock (UTC instant); the property is UTC+7 – e.g. 27/10 01:30Z = 08:30 in Đà Lạt. */
const at = (iso: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(iso));
};

describe('BUG-R3-021 – Wi-Fi block on the arrival day without Wi-Fi on file', () => {
  it('arrival day, wifi null → ask the front desk, no "shown on your arrival day"', () => {
    at('2026-10-27T01:30:00Z');
    show(stay({}));
    expect(screen.getByText(translateGuest('vi', 'gw.wifi_ask_desk'))).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Hiện ở đây vào ngày nhận phòng');
  });

  it('property date, not the device date: 27/10 00:30 in Đà Lạt is still 26/10 in UTC', () => {
    at('2026-10-26T17:30:00Z');
    show(stay({}), 'en');
    expect(
      screen.getByText('Please ask the front desk for the network name and password.'),
    ).toBeInTheDocument();
  });

  it('in house (even if the dates say otherwise) → ask the front desk', () => {
    at('2026-10-20T03:00:00Z');
    show(stay({ status: 'in_house' }));
    expect(screen.getByText(translateGuest('vi', 'gw.wifi_ask_desk'))).toBeInTheDocument();
  });

  it('before the arrival day → the promise stays (US-108 AC2)', () => {
    at('2026-10-26T10:00:00Z');
    show(stay({}));
    expect(screen.getByText('Hiện ở đây vào ngày nhận phòng (27/10).')).toBeInTheDocument();
  });

  it('Wi-Fi on file → network name and password as before', () => {
    at('2026-10-27T05:00:00Z');
    show(stay({ wifi: { ssid: 'OTTIMO-Guest', password: 'mock-wifi-pass' } }));
    expect(screen.getByText('OTTIMO-Guest')).toHaveClass('gw-code');
    expect(screen.queryByText(translateGuest('vi', 'gw.wifi_ask_desk'))).not.toBeInTheDocument();
  });
});
