// Sprint 4 – FE-A đợt 20: UXR `s4-pwa-walkthrough.md` P-17, P-18, P-19, P-23, P-32 (+ P-26, P-34 câu chữ) và S4-13 hướng B
// (ARC 16.23 – không nhận ảnh biên nhận lúc tạo đơn, mã giao dịch vào ghi chú).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
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

describe('P-19 – Nhật ký thao tác tiền: lý do bằng lời, không mã / câu lập trình', () => {
  it('câu hệ thống, mã hủy và lý do lễ tân chọn khi gửi duyệt đều hiện bằng tiếng Việt', async () => {
    const base = {
      occurredAt: new Date().toISOString(),
      actorType: 'user',
      actorName: 'Hạnh',
      category: 'money',
      entityCode: 'OTM-0999',
    };
    mockControl.stay.audit.unshift(
      {
        ...base,
        action: 'folio.foc_posted',
        reason: 'FOC on the current line of its key (BR-434)',
      },
      { ...base, action: 'reservation.cancellation_fee', reason: 'guest_changed_mind' },
      {
        ...base,
        action: 'approval.requested',
        after: { reasonCode: 'regular_vip', reasonNote: 'Khách quen lâu năm' },
      },
    );
    renderApp('/audit', 'qa.mgr');
    expect(await screen.findByText(tv('mlog.reason.foc_current_line'))).toBeInTheDocument();
    expect(screen.getByText(tv('cancel.reason.changed_mind'))).toBeInTheDocument();
    expect(screen.getByText(`${tv('foc.r_regular')} · "Khách quen lâu năm"`)).toBeInTheDocument();
    expect(screen.queryByText(/FOC on the current line/)).toBeNull();
    expect(screen.queryByText('guest_changed_mind')).toBeNull();
  });
});

describe('P-23 – Chờ đối soát: câu đầu trang đúng, "Đã khớp sao kê" hỏi xác nhận', () => {
  it('đầu trang nói chuyển khoản/VietQR và tiền mặt sale; bấm "Đã khớp sao kê" → hộp xác nhận; Hủy không ghi, xác nhận mới ghi', async () => {
    const recon = capture('POST', /\/payments\/[^/]+\/actions\/reconcile$/);
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('co.recon_title') }));
    expect(await screen.findByText(new RegExp(`^${esc(tv('recon.intro'))}`))).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(esc(tv('pay.cash_hand_in'))))).toBeNull();
    const ok = (await screen.findAllByRole('button', { name: tv('co.recon_ok') }))[0]!;
    await user.click(ok);
    const titleRe = new RegExp(
      `^${esc(tv('recon.confirm_title', { amount: '§', code: '§' })).replace(/§/g, '.+')}$`,
    );
    const box = await screen.findByRole('alertdialog', { name: titleRe });
    expect(within(box).getByText(tv('recon.confirm_body'))).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: tv('common.cancel') }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(recon.sent).toHaveLength(0);
    await user.click((await screen.findAllByRole('button', { name: tv('co.recon_ok') }))[0]!);
    const box2 = await screen.findByRole('alertdialog', { name: titleRe });
    await user.click(within(box2).getByRole('button', { name: tv('co.recon_ok') }));
    await waitFor(() => expect(recon.sent).toHaveLength(1));
    recon.stop();
    expect(recon.sent[0]).toMatchObject({ result: 'reconciled' });
  });
});

describe('P-18 – bước Minibar: một cột ít hơn (chuẩn đứng cạnh "còn lại")', () => {
  it('không còn cột "Chuẩn"; ô còn lại ghi "/ chuẩn"; món miễn phí cột tiền là 0', async () => {
    at('11:00');
    const r = res('Phạm Huy');
    renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    const table = (
      await screen.findByRole('columnheader', {
        name: tv('checkout.minibar.left_of_std'),
      })
    ).closest('table')!;
    expect(within(table).getAllByRole('columnheader')).toHaveLength(4);
    expect(within(table).queryByRole('columnheader', { name: tv('co.std') })).toBeNull();
    const row = within(table)
      .getByRole('rowheader', { name: /^Coca-Cola/ })
      .closest('tr')!;
    expect(row).toHaveTextContent('/ 2');
  });
});

describe('P-32 – một kiểu dấu trừ cho tiền', () => {
  it('dòng miễn phí trên folio dùng "−" như dòng Đã thu, không dùng gạch nối', async () => {
    const r = res('Phạm Huy');
    const folio = mockControl.stay.folios.get(r.folioId)!;
    folio.lines.push({
      id: 'foc-p32',
      category: 'foc',
      description: 'foc x',
      labelKey: 'bill.line.foc',
      labelParams: { reason: 'service_recovery' },
      quantity: 1,
      unitPriceVnd: -375_000,
      amountVnd: -375_000,
      lineState: 'posted',
      postedAt: new Date().toISOString(),
    });
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    expect(await within(d).findByText('−375.000')).toBeInTheDocument();
    expect(within(d).queryByText('-375.000')).toBeNull();
  });
});

describe('P-34 – không còn chữ "drawer" trên màn lễ tân', () => {
  it('câu gợi ý "Trả muộn" nói "khung chi tiết đơn"', () => {
    expect(tv('co.late_switch_hint_time', { time: '12:00' })).not.toMatch(/drawer/i);
    expect(tv('co.late_switch_hint_time', { time: '12:00' })).toMatch(/khung chi tiết đơn/);
    expect(tv('ci.time_default_help')).not.toMatch(/bước 4/);
  });
});

describe('S4-13 hướng B (ARC 16.23) – H09: mã giao dịch vào ghi chú, ảnh gắn sau khi tạo đơn', () => {
  it('FD: có ô mã giao dịch (gửi trong initialPayment.note), câu nhắc cách gắn ảnh sau; không có ô tải ảnh', async () => {
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
      target: { value: addDays(todayLocal(), 42) },
    });
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Trần Minh');
    await user.click(await screen.findByRole('option', { name: /Trần Minh Khoa/ }));
    const received = await within(dlg).findByLabelText(new RegExp(`^${tv('rsv.amount_received')}`));
    await user.clear(received);
    await user.type(received, '1000000');
    expect(within(dlg).getByText(tv('bk.receipt_later_fd'))).toBeInTheDocument();
    expect(within(dlg).queryByLabelText(/ảnh|Ảnh/)).toBeNull();
    const txn = within(dlg).getByLabelText(new RegExp(`^${esc(tv('co.txn_ref'))}`));
    expect(txn).toHaveAccessibleDescription(tv('bk.txn_ref_help'));
    await user.type(txn, 'FT26291188');
    const created = capture('POST', /\/reservations$/);
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    created.stop();
    const body = created.sent.find((b) => b.initialPayment)!;
    expect(body.initialPayment).toMatchObject({ type: 'deposit', note: 'FT26291188' });
    expect(body.initialPayment).not.toHaveProperty('attachmentId');
  });
});
