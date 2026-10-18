// Sprint 4 – FE-A vòng sửa 5 theo ARC 16.18 (BR-417 phụ lục 5A, nguồn đêm theo thao tác): máy chủ suy "giá nhập tay" hay
// "giá mặc định" từ việc Desk CÓ gửi giá hay không – Desk chỉ gửi giá khi lễ tân đã sửa ô (cờ của ô, không so số).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../app/api';
import { addDays, currentSegment } from '../app/reservations';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

/** Phạm Huy (201) leaves at 19:30 – after the last tier: one more night (the room is free tonight). */
async function extraNightStep() {
  at('19:40');
  const r = res('Phạm Huy');
  mockControl.stay.minibarChecks.set(r.id, []);
  const view = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
  await view.user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
    target: { value: '19:30' },
  });
  const rate = await screen.findByLabelText(
    new RegExp(`^${esc(tv('checkout.extra_night_rate_label'))}`),
  );
  return { r, rate, ...view };
}

async function payAndComplete(user: ReturnType<typeof renderApp>['user']) {
  await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
  await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
  await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
  await waitFor(() => expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
  const box = await screen.findByRole('alertdialog');
  await user.click(within(box).getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
  await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
}

describe('B18 đêm thêm – chỉ gửi `extraNight.rateVnd` khi lễ tân sửa ô (ARC 16.18)', () => {
  it('không sửa ô → `extraNight` không có giá (đêm mặc định của máy chủ)', async () => {
    const checkouts = capture('POST', /\/actions\/check-out$/);
    const { r, rate, user } = await extraNightStep();
    expect(rate).toHaveValue('708.000');
    await payAndComplete(user);
    checkouts.stop();
    const body = checkouts.sent.at(-1)!;
    expect(body.extraNight).toEqual({});
    const f = mockControl.stay.folios.get(r.folioId)!;
    expect(f.lines.find((l) => l.description === 'extra_night')!.amountVnd).toBe(708_000);
  });

  it('sửa ô – kể cả gõ lại đúng số gợi ý → có `rateVnd` (đêm nhập tay); QR check_out mang cùng giá', async () => {
    const checkouts = capture('POST', /\/actions\/check-out$/);
    const qrs = capture('POST', /\/vietqr$/);
    const { rate, user } = await extraNightStep();
    // The desk edits the box and ends on the suggested figure (an edit, not a number test).
    fireEvent.change(rate, { target: { value: '70.800' } });
    fireEvent.change(rate, { target: { value: '708.000' } });
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    await user.click(await screen.findByRole('button', { name: /^Tạo VietQR/ }));
    await waitFor(() => expect(qrs.sent.length).toBeGreaterThan(0));
    qrs.stop();
    expect(qrs.sent.at(-1)).toMatchObject({ purpose: 'check_out', extraNightRateVnd: 708_000 });
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
    await waitFor(() => expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
    const box = await screen.findByRole('alertdialog');
    await user.click(within(box).getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    checkouts.stop();
    expect(checkouts.sent.at(-1)!.extraNight).toEqual({ rateVnd: 708_000 });
  });

  it('khoảng nhập theo `extraNightFloorVnd`–`extraNightCeilingVnd`: gợi ý nêu khoảng, ngoài khoảng → báo ở ô và khóa "Tiếp tục"', async () => {
    const { r, rate } = await extraNightStep();
    const sum = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '19:30')
    ).data;
    const min = sum.extraNightFloorVnd!;
    const max = sum.extraNightCeilingVnd!;
    expect(min).toBeLessThan(max);
    const range = tv('checkout.extra_night_range', { min: money(min), max: money(max) });
    await waitFor(() => expect(rate).toHaveAccessibleDescription(new RegExp(`${esc(range)}$`)));
    fireEvent.change(rate, { target: { value: (min - 1_000).toLocaleString('vi-VN') } });
    const out = tv('field_error.value_out_of_range', { min: money(min), max: money(max) });
    expect((await screen.findAllByText(out)).length).toBeGreaterThan(0);
    const go = screen.getByRole('button', { name: tv('co.go_bill') });
    expect(go).toHaveAttribute('aria-disabled', 'true');
    expect(go).toHaveAccessibleDescription(out);
    fireEvent.change(rate, { target: { value: max.toLocaleString('vi-VN') } });
    await waitFor(() => expect(screen.queryAllByText(out)).toHaveLength(0));
  });
});

describe('B9a nhận phòng sớm – H13 không có ô giá đêm trước: không gửi `priorNightRateVnd` (ARC 16.18)', () => {
  it('05:00, đêm trước còn trống: QR check_in có addPriorNight nhưng không có giá', async () => {
    at('05:00');
    const r = res('Gia đình anh Hưng');
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.documents.push({
      id: 'doc-418',
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
    await user.click(await screen.findByRole('checkbox', { name: tv('ci.told_guest') }));
    await user.click(await screen.findByRole('button', { name: /^Tạo VietQR/ }));
    await waitFor(() => expect(qrs.sent.length).toBe(1));
    qrs.stop();
    expect(qrs.sent[0]).toMatchObject({ purpose: 'check_in', addPriorNight: true });
    expect(qrs.sent[0]).not.toHaveProperty('priorNightRateVnd');
  });
});

describe('S4-35 sửa giá đêm ở Folio – gõ lại đúng số vẫn là giá nhập tay (ARC 16.18, AN-22)', () => {
  it('chưa sửa ô → nút lưu khóa; gõ lại đúng giá lịch → lưu được và gửi `newUnitPriceVnd`', async () => {
    const r = res('Nguyễn Văn An');
    const folio = mockControl.stay.folios.get(r.folioId)!;
    const night = folio.lines.find((l) => l.category === 'room' && l.lineState === 'posted')!;
    const adjust = capture('POST', /\/lines\/[^/]+\/adjustments$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Nguyễn Văn An' });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
    await user.click((await within(dlg).findAllByRole('button', { name: tv('folio.adjust') }))[0]!);
    const box = await screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
    const save = within(box).getByRole('button', { name: tv('folio.adjust_submit') });
    expect(save).toBeDisabled();
    const price = within(box).getByLabelText(new RegExp(`^${esc(tv('folio.adjust_night_price'))}`));
    const same = (price as HTMLInputElement).value;
    // Typed over and back to the same calendar figure.
    fireEvent.change(price, { target: { value: '1' } });
    fireEvent.change(price, { target: { value: same } });
    expect(save).toBeEnabled();
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('folio.adjust_reason'))}`)),
      'Xác nhận giá thỏa thuận',
    );
    await user.click(save);
    await waitFor(() => expect(adjust.sent.length).toBe(1));
    adjust.stop();
    expect(adjust.sent[0]).toEqual({
      newUnitPriceVnd: Number(same.replace(/\D/g, '')),
      reason: 'Xác nhận giá thỏa thuận',
    });
    expect(night.id).toBeTruthy();
  });
});

describe('H09 (B1) – mỗi đêm kèm `edited` theo cờ "đã sửa" của ô (ARC 16.18 bổ sung)', () => {
  it('3 đêm, gõ lại đúng giá lịch ở đêm giữa → gửi đủ 3 đêm, chỉ đêm giữa `edited: true`', async () => {
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
      target: { value: addDays(todayLocal(), 43) },
    });
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Trần Minh');
    await user.click(await screen.findByRole('option', { name: /Trần Minh Khoa/ }));
    const label = new RegExp(`^${esc(tv('rate.pre_tier'))} `);
    const inputs = await within(dlg).findAllByLabelText(label);
    expect(inputs).toHaveLength(3);
    await waitFor(() => expect(inputs[1]).not.toHaveValue(''));
    const middle = (inputs[1] as HTMLInputElement).value;
    // The same calendar figure typed again – still an edit.
    await user.clear(inputs[1]!);
    await user.type(inputs[1]!, middle.replace(/\D/g, ''));
    const received = within(dlg).getByLabelText(new RegExp(`^${tv('rsv.amount_received')}`));
    await user.clear(received);
    await user.type(received, '5000000');
    const created = capture('POST', /\/reservations$/);
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    created.stop();
    const body = created.sent.find((b) => Array.isArray(b.nightlyRates))!;
    const sent = body.nightlyRates as Array<{ date: string; amountVnd: number; edited: boolean }>;
    expect(sent).toHaveLength(3);
    expect(sent.map((n) => n.edited)).toEqual([false, true, false]);
    expect(sent[1]!.amountVnd).toBe(Number(middle.replace(/\D/g, '')));
  });
});

/** Idempotency-Key of every POST to `re` (one per request actually sent). */
function keysOf(re: RegExp) {
  const keys: Array<string | null> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && re.test(new URL(request.url).pathname))
      keys.push(request.headers.get('idempotency-key'));
  };
  server.events.on('request:start', on);
  return { keys, stop: () => server.events.removeListener('request:start', on) };
}

describe('ARC 16.17 bổ sung (af) – B13/B14/B18 gặp 409 CONCURRENT_UPDATE: tự gửi lại MỘT lần, cùng khóa', () => {
  it('B18: 409 không có Retry-After → chờ ~1 giây, gửi lại cùng Idempotency-Key, trả phòng xong', async () => {
    const sent = keysOf(/\/actions\/check-out$/);
    const { user } = await extraNightStep();
    mockControl.failNext(/\/actions\/check-out:POST$/, 409, { code: 'CONCURRENT_UPDATE' });
    await payAndComplete(user);
    sent.stop();
    expect(sent.keys).toHaveLength(2);
    expect(sent.keys[0]).toBeTruthy();
    expect(sent.keys[1]).toBe(sent.keys[0]);
  });

  it('B14: 409 (Retry-After: 0) rồi thành công → hai lần gửi, cùng khóa, đã đổi căn', async () => {
    const kim = res('Kim Seo-yeon');
    res('Nguyễn Văn An').status = 'cancelled'; // frees 202
    const sent = keysOf(/\/actions\/change-room$/);
    const { user } = renderApp(`/reservations/${kim.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.change_room') }));
    const dlg = await screen.findByRole('dialog', { name: /^Đổi phòng · Căn 402/ });
    await user.click(await within(dlg).findByRole('radio', { name: /^202/ }));
    await within(dlg).findByRole('table', { name: tv('booking.field.rate') });
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Máy lạnh hỏng');
    mockControl.failNext(
      /\/actions\/change-room:POST$/,
      409,
      { code: 'CONCURRENT_UPDATE' },
      { 'retry-after': '0' },
    );
    const before = sent.keys.length;
    await user.click(
      within(dlg).getByRole('button', { name: tv('stay.change_submit', { room: '202' }) }),
    );
    await waitFor(() =>
      expect(currentSegment(res('Kim Seo-yeon').segments, todayLocal())?.roomNo).toBe('202'),
    );
    sent.stop();
    const writes = sent.keys.slice(before);
    expect(writes).toHaveLength(2);
    expect(writes[1]).toBe(writes[0]);
  });

  it('B13: 409 hai lần → chỉ gửi lại một lần (2 yêu cầu, cùng khóa) rồi mới hiện lỗi', async () => {
    const kim = res('Kim Seo-yeon');
    server.use(
      http.post('*/v1/properties/:p/reservations/:r/actions/extend', () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'CONCURRENT_UPDATE',
            status: 409,
            code: 'CONCURRENT_UPDATE',
          },
          { status: 409, headers: { 'retry-after': '0' } },
        ),
      ),
    );
    const sent = keysOf(/\/actions\/extend$/);
    const { user } = renderApp(`/reservations/${kim.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.extend') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('extend.title', { room: '402', guest: 'Kim Seo-yeon' }),
    });
    await user.click(await within(dlg).findByRole('button', { name: /^Gia hạn 1 đêm/ }));
    expect(await within(dlg).findByText(tv('retry.gave_up_concurrent'))).toBeInTheDocument();
    sent.stop();
    expect(sent.keys).toHaveLength(2);
    expect(sent.keys[1]).toBe(sent.keys[0]);
    expect(res('Kim Seo-yeon').departureDate).toBe(kim.departureDate);
  });
});
