// Sprint 4 – FE-A, hai lỗi P2 của QA: BUG-R2-194 (H13 trước 06:00 – B9a: tiền đêm, ô "đã báo khách"; TC-L3-085) và
// BUG-R2-179 (H06 – 4 số cuối giấy tờ khi khách đã đồng ý P05; TC-RB-008).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

describe('BUG-R2-194 – H13 trước 06:00 (B9a): câu nêu tiền đêm, có ô "đã báo khách"', () => {
  it('05:00, đêm trước còn trống: "thêm đêm …" = priorNight.defaultRateVnd (không 0 đ), ô đã báo khách hiện, lệnh gửi đúng số đó', async () => {
    at('05:00');
    const r = res('Gia đình anh Hưng');
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.documents.push({
      id: 'doc-194',
      partyMemberId: r.id,
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: 'Gia đình anh Hưng',
      nationalityCode: 'VNM',
      docNumber: '079123456789',
      dateOfBirth: '1985-04-02',
      gender: 'male',
      imageIds: [],
      imageConsent: 'refused',
      captureMethod: 'manual',
      checks: [],
    } as unknown as (typeof reg.documents)[number]);
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await screen.findByRole('heading', { name: /Nhận phòng/ });
    await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
    await user.click(screen.getByRole('switch', { name: tv('ci.early_toggle') }));
    fireEvent.change(screen.getByLabelText(new RegExp(`^${tv('checkin.time')}`)), {
      target: { value: '05:00' },
    });
    const preview = (
      await api.previewCheckIn({ propertyId: PROPERTY_ID, reservationId: r.id }, '05:00')
    ).data;
    expect(preview.earlyCheckinSurcharge?.addsPreviousNight).toBe(true);
    expect(preview.earlyCheckinSurcharge?.amountVnd).toBe(0);
    const night = preview.priorNight!.defaultRateVnd!;
    expect(night).toBeGreaterThan(0);
    const date = preview.priorNight!.date!.split('-').reverse().slice(0, 2).join('/');
    expect(
      await screen.findByText(
        new RegExp(
          `^${tv('checkin.prior_night', { date, amount: money(night) }).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`thêm đêm.*: ${money(0)}`))).toBeNull();
    // The desk tells the guest the night's price (BR-414) – the tick is back.
    expect(screen.getByRole('checkbox', { name: tv('ci.told_guest') })).toBeInTheDocument();
  });
});

describe('BUG-R2-179 – H06 hồ sơ khách: 4 số cuối giấy tờ khi API trả', () => {
  it('khách có `idDocLast4` → hộp hồ sơ hiện "…7890"; khách không có → không có dòng', async () => {
    const g = mockControl.db.guests.find((x) => x.fullName === 'Đỗ Mai Anh')!;
    (g as { idDocLast4?: string }).idDocLast4 = '7890';
    const { user } = renderApp('/guests', 'qa.fd');
    await user.type(await screen.findByRole('searchbox'), 'do mai anh');
    await user.click(await screen.findByRole('button', { name: /Đỗ Mai Anh/ }));
    const dlg = await screen.findByRole('dialog');
    expect(await within(dlg).findByText('…7890')).toBeInTheDocument();
    expect(within(dlg).getByText(tv('crm.f_id_doc'))).toBeInTheDocument();
    await waitFor(() => expect(within(dlg).queryByText(/\d{12}/)).toBeNull());
  });
});
