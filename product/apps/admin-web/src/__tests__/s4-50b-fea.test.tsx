// Sprint 4 – FE-A đợt 18 (NÊN-ÔĐ): S4-45 năm sinh trẻ em bắt buộc (BA EP02 mục 8, khớp server); khung tiền drawer
// (BUG-R2-101, 102, 103) và H16 (BUG-R2-087); giấy tờ chỉ có ảnh không tính là "đã có" (BUG-R2-089); cột "Còn phải
// thu" của danh sách đơn (BUG-R2-078).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const vnd = (n: number) => n.toLocaleString('vi-VN');
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

describe('S4-45 – năm sinh trẻ em bắt buộc', () => {
  it('ô Năm sinh có dấu bắt buộc; trống → nút Thêm khóa kèm lý do; ngoài khoảng → báo ở ô; đúng → gửi `childBirthYear`', async () => {
    const r = res('Gia đình anh Hưng');
    const added = capture('POST', /\/party$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Gia đình anh Hưng' });
    await user.click(await within(d).findByRole('button', { name: tv('rsv.add_person') }));
    const dlg = await screen.findByRole('dialog', { name: tv('rsv.party') });
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.child') }));
    await user.type(
      within(dlg).getByLabelText(new RegExp(`^${esc(tv('checkin.docs.field.full_name'))}`)),
      'NGUYEN AN NHI',
    );
    const year = within(dlg).getByLabelText(new RegExp(`^${esc(tv('party.child_birth_year'))}`));
    expect(year).toBeRequired();
    const addBtn = within(dlg).getByRole('button', { name: tv('rsv.add_submit') });
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAccessibleDescription(tv('party.child_birth_year_required'));
    await user.type(year, '1999');
    const maxYear = Number(todayLocal().slice(0, 4));
    expect(
      within(dlg).getByText(tv('field_error.value_out_of_range', { min: 2000, max: maxYear })),
    ).toBeInTheDocument();
    expect(addBtn).toBeDisabled();
    await user.clear(year);
    await user.type(year, '2019');
    expect(addBtn).toBeEnabled();
    await user.click(addBtn);
    await waitFor(() => expect(added.sent.length).toBeGreaterThan(0));
    added.stop();
    expect(added.sent.at(-1)).toMatchObject({
      role: 'child',
      childName: 'NGUYEN AN NHI',
      childBirthYear: 2019,
    });
  });
});

describe('Drawer – khung tiền (BUG-R2-101, 102, 103)', () => {
  it('103: đơn đang ở có danh sách dòng → "Còn phải thu" chỉ một dòng (sau các dòng, Đã thu)', async () => {
    const r = res('Phạm Huy');
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    await within(d).findByRole('button', { name: tv('folio.open') });
    await waitFor(() => expect(within(d).getAllByText(tv('drawer.folio.balance'))).toHaveLength(1));
  });

  it('101 (ARC 16.20): đơn giữ chỗ chưa có dòng → không có `balanceDueVnd`: "Cọc cần thu" = cọc còn thiếu, "Tiền phòng", "Chưa có khoản nào trên folio" – không "Còn phải thu 0 đ"', async () => {
    const r = res('Lê Minh');
    expect(r.status).toBe('hold');
    r.depositPaidVnd = 200_000;
    const f = mockControl.stay.folios.get(r.folioId);
    if (f) f.lines = [];
    mockControl.stay.payments = mockControl.stay.payments.filter((p) => p.folioId !== r.folioId);
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    expect(await within(d).findByText(tv('drawer.folio.nothing_posted'))).toBeInTheDocument();
    expect(within(d).queryByText(tv('drawer.folio.balance'))).toBeNull();
    const deposit = within(d).getByText(tv('booking.summary.deposit')).closest('tr')!;
    expect(deposit).toHaveTextContent(vnd(r.depositRequiredVnd! - 200_000));
    const room = within(d)
      .getByText(tv('drawer.folio.room', { n: r.nights ?? 0 }))
      .closest('tr')!;
    expect(room).toHaveTextContent(vnd(r.totalRoomVnd!));
  });

  it('102: đơn đã hủy và đã hoàn → có dòng "Đã hoàn", không còn hiểu là khách sạn giữ tiền', async () => {
    const r = res('Sophie Martin');
    r.status = 'cancelled';
    r.balanceDueVnd = 0;
    mockControl.stay.payments.push(
      {
        id: 'p-102-in',
        code: 'PT-102A',
        folioId: r.folioId,
        type: 'deposit',
        method: 'bank_transfer',
        amountVnd: 500_000,
        status: 'succeeded',
        reconciliation: 'reconciled',
        version: 1,
      },
      {
        id: 'p-102-out',
        code: 'PT-102B',
        folioId: r.folioId,
        type: 'refund',
        method: 'bank_transfer',
        amountVnd: 500_000,
        status: 'succeeded',
        reconciliation: 'not_required',
        version: 1,
      },
    );
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Sophie Martin' });
    // "Đã thu" = `paidVnd` (refunds not taken off), "Đã hoàn" = `Folio.totals.refundedVnd` (ARC 16.20).
    const refunded = (await within(d).findByText(tv('drawer.folio.refunded'))).closest('tr')!;
    expect(refunded).toHaveTextContent(`+${vnd(500_000)}`);
    const paid = within(d).getByText(tv('drawer.folio.paid')).closest('tr')!;
    expect(paid).toHaveTextContent(`−${vnd(500_000)}`);
    const folio = (await api.getFolio({ propertyId: PROPERTY_ID, folioId: r.folioId })).data;
    expect(folio.totals).toMatchObject({ paidVnd: 500_000, refundedVnd: 500_000 });
  });
});

describe('H16 khung Folio – phụ thu trả muộn dự tính có dòng riêng (BUG-R2-087)', () => {
  it('14:00 (bậc 30 %): có dòng "Phụ thu trả muộn 14:00 · 30% (dự tính)" bằng số máy chủ tính', async () => {
    at('14:05');
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
      target: { value: '14:00' },
    });
    const sum = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '14:00')
    ).data;
    const late = sum.lateCheckoutSurcharge?.amountVnd ?? 0;
    expect(late).toBeGreaterThan(0);
    const row = (
      await screen.findByText(
        tv('co.late_row_new', { time: '14:00', pct: sum.lateCheckoutSurcharge!.tierPct ?? 30 }),
      )
    ).closest('tr')!;
    expect(row).toHaveTextContent(vnd(late));
  });
});

describe('Giấy tờ chỉ có ảnh (BUG-R2-089)', () => {
  it('H13: tiến độ theo số của máy chủ (giấy tờ đã nhập trường), dòng chưa nhập mang chip "Cần nhập thông tin"', async () => {
    const r = res('Gia đình anh Hưng');
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.documents.push({
      id: 'doc-089',
      docType: 'cccd',
      isMain: false,
      fullNameOnDoc: '',
      nationalityCode: 'VNM',
      docNumber: '',
      imageIds: ['img-089'],
      imageConsent: 'granted',
      captureMethod: 'guest_upload',
      personIndex: 1,
      checks: [],
    } as unknown as (typeof reg.documents)[number]);
    renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await screen.findByRole('heading', { name: /Nhận phòng/ });
    expect(
      await screen.findByText(tv('checkin.docs.progress', { have: 0, need: 4 })),
    ).toBeInTheDocument();
    const row = screen.getByText(new RegExp(`^${esc(tv('reg.link.no_fields'))}`)).closest('li')!;
    expect(within(row).getByText(tv('reg.chip.needs_details'))).toBeInTheDocument();
    expect(within(row).queryByText(tv('guest.chip.doc_ok'))).toBeNull();
  });
});

describe('Danh sách đơn – cột "Còn phải thu" (BUG-R2-078)', () => {
  it('đọc `balanceDueVnd` của danh sách (máy chủ đã thêm trường)', async () => {
    const r = res('Gia đình anh Hưng');
    renderApp('/reservations', 'qa.fd');
    const cell = await screen.findByRole('button', { name: r.code });
    const row = cell.closest('tr')!;
    await waitFor(() => expect(row).toHaveTextContent(vnd(r.balanceDueVnd!)));
  });
});

describe('FE-S4-22 (BR-012) – phiếu thanh toán in tên phòng, không in số căn', () => {
  it('tờ phiếu trên màn và bản in: "The Mist", không có số căn 201', async () => {
    at('11:30');
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    await user.click(await screen.findByRole('button', { name: tv('co.preview_bill') }));
    const bill = await screen.findByRole('dialog', { name: tv('bill.title') });
    const sheet = await within(bill).findByText(/^Phạm Huy · /);
    expect(sheet).toHaveTextContent(/^Phạm Huy · The Mist · /);
    await waitFor(() => expect(within(bill).getAllByText(/The Mist/).length).toBeGreaterThan(1));
    expect(bill.textContent).not.toMatch(/(^|\D)201(\D|$)/);
    let printed = '';
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      printed = document.querySelector('.print-root')?.textContent ?? '';
    });
    await user.click(within(bill).getByRole('button', { name: tv('co.print') }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    print.mockRestore();
    expect(printed).toContain('The Mist');
    expect(printed).not.toMatch(/(^|\D)201(\D|$)/);
  });
});
