// Sprint 4 – FE-A theo DOM S4-38 (BR-107 v0.3.8) và ARC 0.3.7 bổ sung 4: giá đêm lễ tân gõ là GIÁ LỊCH (trước giảm
// dài ngày), giá sau bậc lấy từ máy chủ; số cần thu ở H16 là số của máy chủ (kể cả giá đêm thêm gõ tay); "cọc" chỉ là
// tiền phải thu khi đơn giữ chỗ.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const num = (s: string) => Number(s.replace(/\D/g, ''));
const step10 = (v: number) => Math.round((v * 90) / 100 / 1000) * 1000;
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

function capture(method: string, re: RegExp) {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== method || !re.test(new URL(request.url).pathname)) return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

describe('H09 – giá đêm gõ tay là giá lịch, bậc BR-107 do máy chủ áp (DOM S4-38)', () => {
  it('7 đêm: ô giá = giá lịch, cạnh đó giá sau giảm của máy chủ; sửa một đêm → giảm áp khi lưu, không giảm hai lần', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
    const dlg = await screen.findByRole('dialog', { name: /Đặt phòng mới/ });
    const room = within(dlg).getByLabelText(/^Căn/);
    await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
    await user.selectOptions(room, within(room).getByRole('option', { name: /^201 / }));
    fireEvent.change(within(dlg).getByLabelText('Ngày đến'), {
      target: { value: addDays(todayLocal(), 40) },
    });
    fireEvent.change(within(dlg).getByLabelText('Ngày đi'), {
      target: { value: addDays(todayLocal(), 47) },
    });
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Trần Minh');
    await user.click(await screen.findByRole('option', { name: /Trần Minh Khoa/ }));
    const label = new RegExp(`^${tv('rate.pre_tier').replace(/[()]/g, '\\$&')} `);
    const inputs = await within(dlg).findAllByLabelText(label);
    expect(inputs).toHaveLength(7);
    await waitFor(() => expect(inputs[0]).not.toHaveValue(''));
    const calendar = num((inputs[0] as HTMLInputElement).value);
    // The server's stepped price next to the untouched calendar price (mock: 10 % from 7 nights).
    const row0 = inputs[0]!.closest('tr')!;
    expect(
      within(row0).getByText(tv('rate.after_tier', { pct: 10, amount: money(step10(calendar)) })),
    ).toBeInTheDocument();
    expect(within(dlg).getByText(tv('rate.tier_note', { n: 7, pct: 10 }))).toBeInTheDocument();
    // A typed rate: no client arithmetic – the step is applied on save.
    await user.clear(inputs[0]!);
    await user.type(inputs[0]!, '900000');
    expect(within(dlg).getByText(tv('rate.tier_on_save', { n: 7, pct: 10 }))).toBeInTheDocument();
    expect(within(row0).queryByText(/^Sau giảm/)).not.toBeInTheDocument();
    const received = within(dlg).getByLabelText(new RegExp(`^${tv('rsv.amount_received')}`));
    await user.clear(received);
    await user.type(received, '5000000');
    const created = capture('POST', /\/reservations$/);
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    created.stop();
    const body = created.sent.find((b) => Array.isArray(b.nightlyRates))!;
    const sent = body.nightlyRates as Array<{ amountVnd: number }>;
    // Every night is sent at its CALENDAR rate (the untouched ones too) – never a stepped figure.
    expect(sent[0]!.amountVnd).toBe(900_000);
    expect(sent.slice(1).every((n) => n.amountVnd > step10(n.amountVnd))).toBe(true);
    const r = mockControl.rsv.reservations.at(-1)!;
    expect(r.nightlyRates![0]).toMatchObject({ amountVnd: 810_000 });
  });
});

describe('H16 – số cần thu là số của máy chủ (S4-47, ARC 0.3.7 bổ sung 4)', () => {
  it('bảng tóm tắt dùng amountDueAtCheckoutVnd, không tự cộng phụ thu / đêm thêm ở máy quầy', async () => {
    at('11:30');
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    // The server's figure (123.000) differs from anything the client could add up (balance 0, no late fee).
    server.use(
      http.get('*/reservations/:id/checkout-summary', () =>
        HttpResponse.json({
          checkoutTime: '11:30',
          standardCheckoutTime: '12:00',
          lateCheckoutSurcharge: { tierPct: 0, amountVnd: 0 },
          lines: [],
          totalVnd: 2_460_000,
          paidVnd: 2_460_000,
          balanceDueVnd: 0,
          creditVnd: 0,
          amountDueAtCheckoutVnd: 123_000,
          extraNightRequired: false,
          pendingApprovals: 0,
          blockers: [],
        }),
      ),
    );
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const total = await screen.findByRole('row', {
      name: new RegExp(`^${tv('checkout.summary.balance')}`),
    });
    expect(num(total.textContent ?? '')).toBe(123_000);
  });

  it('đêm thêm gõ giá khác mặc định → hỏi máy chủ (trần VietQR check_out, 422 max, không ghi gì) rồi hiện số đó', async () => {
    at('19:40');
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    const probe = capture('POST', /\/folios\/[^/]+\/vietqr$/);
    const qrBefore = mockControl.stay.payments.filter((p) => p.method === 'vietqr').length;
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const time = await screen.findByLabelText(new RegExp(tv('checkout.departure_time')));
    fireEvent.change(time, { target: { value: '19:30' } });
    const rate = await screen.findByLabelText(
      new RegExp(`^${tv('checkout.extra_night_rate_label')}`),
    );
    expect(rate).toHaveAccessibleDescription(tv('checkout.extra_night_rate_help_tier'));
    const balanceRow = () =>
      screen.getByRole('row', { name: new RegExp(`^${tv('checkout.summary.balance')}`) });
    await waitFor(() => expect(num(balanceRow().textContent ?? '')).toBeGreaterThan(0));
    const atDefault = num(balanceRow().textContent ?? '');
    fireEvent.change(rate, { target: { value: '800.000' } });
    // The server answers with its cap at that rate (mock: 3 + 1 nights, no step → +92.000).
    await waitFor(() => expect(num(balanceRow().textContent ?? '')).toBe(atDefault + 92_000));
    probe.stop();
    expect(probe.sent.at(-1)).toMatchObject({
      purpose: 'check_out',
      extraNightRateVnd: 800_000,
    });
    expect(Number(probe.sent.at(-1)!.amountVnd)).toBeGreaterThan(1_000_000_000);
    // Nothing written: no QR was created by asking.
    expect(mockControl.stay.payments.filter((p) => p.method === 'vietqr')).toHaveLength(qrBefore);
  });
});

describe('Drawer – "cọc" chỉ đòi khi đơn giữ chỗ (ARC 0.3.7 bổ sung 4 #2, BR-309-11)', () => {
  it('đơn đã xác nhận: dòng là cơ sở phí hủy, không phải "cọc cần thu"', async () => {
    const r = res('Sophie Martin');
    r.depositRequiredVnd = 500_000;
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Sophie Martin' });
    expect(await within(d).findByText(tv('drawer.deposit_fee_base'))).toBeInTheDocument();
    expect(within(d).queryByText(tv('booking.summary.deposit'))).not.toBeInTheDocument();
  });
});

describe('S4-35 sửa giá đêm ở Folio – ô giá là giá lịch của đêm (DOM S4-38)', () => {
  it('đêm có bậc giảm: ô điền giá lịch (không phải số sau giảm), gợi ý nói đêm đang tính bao nhiêu', async () => {
    const r = res('Nguyễn Văn An');
    const folio = mockControl.stay.folios.get(r.folioId)!;
    const night = folio.lines.find((l) => l.category === 'room' && l.lineState === 'posted')!;
    const calendar = night.amountVnd + 100_000;
    r.nightlyRates = (r.nightlyRates ?? []).map((n) =>
      n.date === night.serviceDate ? { ...n, calendarRateVnd: calendar } : n,
    );
    if (!r.nightlyRates.some((n) => n.date === night.serviceDate))
      r.nightlyRates.push({
        date: night.serviceDate!,
        amountVnd: night.amountVnd,
        calendarRateVnd: calendar,
      } as (typeof r.nightlyRates)[number]);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Nguyễn Văn An' });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
    const rows = await within(dlg).findAllByRole('button', { name: tv('folio.adjust') });
    await user.click(rows[0]!);
    const box = await screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
    const price = within(box).getByLabelText(
      new RegExp(`^${tv('folio.adjust_night_price').replace(/[()]/g, '\\$&')}`),
    );
    expect(price).toHaveValue(calendar.toLocaleString('vi-VN'));
    expect(
      within(box).getByText(
        new RegExp(
          tv('rate.night_now', {
            amount: money(night.amountVnd),
            calendar: money(calendar),
          }).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      ),
    ).toBeInTheDocument();
  });
});

describe('BUG-R2-127 – đêm trước ngày đến đã có khách: không thêm đêm B9a, không thu đêm đó', () => {
  it('05:00, đêm trước của căn 302 đã có đơn → báo, không có ô báo khách, số cần thu = số dư, nút Nhận phòng khóa, không gửi addPriorNight', async () => {
    at('05:00');
    const r = res('Gia đình anh Hưng');
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.documents.push({
      id: 'doc-127',
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
    });
    // Another stay holds room 302 the night before arrival.
    mockControl.rsv.reservations.push({
      ...r,
      id: 'prev-302',
      code: 'OTM-0999',
      guestName: 'Khách đêm trước',
      status: 'in_house',
      arrivalDate: addDays(r.arrivalDate, -2),
      departureDate: r.arrivalDate,
      folioId: 'folio-prev-302',
      registrationId: undefined,
    } as typeof r);
    const checkins = capture('POST', /\/actions\/check-in$/);
    const qrs = capture('POST', /\/vietqr$/);
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await screen.findByRole('heading', { name: /Nhận phòng/ });
    await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
    await user.click(screen.getByRole('switch', { name: tv('ci.early_toggle') }));
    fireEvent.change(screen.getByLabelText(new RegExp(`^${tv('checkin.time')}`)), {
      target: { value: '05:00' },
    });
    const date = addDays(r.arrivalDate, -1).split('-').reverse().slice(0, 2).join('/');
    const taken = tv('checkin.prior_night_taken', { date });
    expect((await screen.findAllByText(taken)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('checkbox', { name: tv('ci.told_guest') })).not.toBeInTheDocument();
    // Due = what the folio owes now (no night of the day before).
    const dueRow = screen.getByText(tv('ci.due_title')).closest('tr')!;
    expect(within(dueRow).getByText(money(r.balanceDueVnd!))).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    const submit = screen.getByRole('button', { name: tv('ci.submit', { room: '302' }) });
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(submit).toHaveAccessibleDescription(taken);
    await user.click(submit);
    // A QR asked here is for the balance only, without the B9a night.
    await user.click(screen.getByRole('button', { name: /^Tạo VietQR/ }));
    await waitFor(() => expect(qrs.sent.length).toBe(1));
    checkins.stop();
    qrs.stop();
    expect(checkins.sent).toHaveLength(0);
    expect(qrs.sent[0]).toMatchObject({ purpose: 'check_in', amountVnd: r.balanceDueVnd });
    expect(qrs.sent[0]).not.toHaveProperty('addPriorNight', true);
  });
});
