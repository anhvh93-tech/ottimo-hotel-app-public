// Sprint 4 – FE-A đợt 26 (ARC 16.30): FB-R2-ARC-FE-S4-01 – N-7: Desk không chặn trước (cửa sổ 24 giờ, BR-427 (d));
// 409 FOLIO_LOCKED trên folio đã chốt → câu giải thích + "Xóa công nợ"; FB-R2-ARC-FE-S4-02 – hộp xóa nợ theo `max` của 422,
// thông báo theo `effectiveAmountVnd`; QA 11.33 – H17 "Yêu cầu bạn đã gửi" cho MGR/OWN (câu áp một phần / tự đóng).
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD, PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fieldRe = (key: string) => new RegExp(`^${esc(tv(key))}`);
const submitName = new RegExp(
  `^${esc(tv('debt.write_off_submit', { amount: '§' })).replace('§', '.+')}$`,
);

/** Ngọc Anh (checked out, folio settled) owing exactly `debt` on a laundry line of 300.000. */
function settledWith(debt: number) {
  const r = res('Ngọc Anh');
  const f = mockControl.stay.folios.get(r.folioId)!;
  f.status = 'settled';
  f.lines.push({
    id: 'laundry-debt',
    category: 'laundry',
    description: 'laundry x3',
    labelKey: 'bill.line.laundry',
    labelParams: { qty: 3 },
    quantity: 3,
    unitPriceVnd: 100_000,
    amountVnd: 300_000,
    lineState: 'posted',
    postedAt: new Date().toISOString(),
  });
  const pays = mockControl.stay.payments.filter(
    (p) => p.folioId === f.id && p.status === 'succeeded',
  );
  const net =
    f.lines.filter((l) => l.lineState === 'posted').reduce((a, l) => a + l.amountVnd, 0) -
    pays.filter((p) => p.type !== 'refund').reduce((a, p) => a + p.amountVnd, 0) +
    pays.filter((p) => p.type === 'refund').reduce((a, p) => a + p.amountVnd, 0) -
    debt;
  if (net > 0)
    mockControl.stay.payments.push({
      ...(pays[0] ?? mockControl.stay.payments[0]!),
      id: 'pay-clear-26',
      folioId: f.id,
      type: 'charge',
      status: 'succeeded',
      method: 'cash',
      amountVnd: net,
    });
  r.balanceDueVnd = debt;
  return { r, f };
}

async function openAdjust(user: ReturnType<typeof renderApp>['user']) {
  const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
  await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
  const dlg = await screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
  const row = (await within(dlg).findByText(/Giặt|laundry/i)).closest('tr')!;
  await user.click(within(row).getByRole('button', { name: tv('folio.adjust') }));
  return { dlg, box: await screen.findByRole('dialog', { name: /^Điều chỉnh:/ }) };
}

describe('FB-R2-ARC-FE-S4-01 – N-7: Desk không chặn trước; 409 FOLIO_LOCKED chỉ sang "Xóa công nợ"', () => {
  it('MGR: folio đã chốt còn phải thu – không câu khóa, hủy / giảm vẫn gửi được (máy chủ mới biết có công nợ mở hay không)', async () => {
    const { r } = settledWith(300_000);
    const sent: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      if (request.method !== 'POST' || !/\/adjustments$/.test(new URL(request.url).pathname))
        return;
      void request
        .clone()
        .json()
        .then((b: Record<string, unknown>) => sent.push(b));
    };
    server.events.on('request:start', on);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const { dlg, box } = await openAdjust(user);
    // Within 24 h of check-out (BR-427 (d)) there may be no open debt yet – a manager may still fix a line.
    expect(within(dlg).queryByText(tv('folio.adjust_debt_locked'))).toBeNull();
    expect(within(dlg).getByText(tv('folio.settled_mgr'))).toBeInTheDocument();
    expect(within(box).queryByText(tv('folio.adjust_debt_locked'))).toBeNull();
    expect(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') })).toBeEnabled();
    const qty = within(box).getByLabelText(fieldRe('folio.adjust_qty'));
    await user.clear(qty);
    await user.type(qty, '2');
    await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Khách nhờ sửa');
    const save = within(box).getByRole('button', { name: tv('folio.adjust_submit') });
    expect(save).toBeEnabled();
    // This booking does have an open debt: the server refuses the cut (mock: settled + still owed → 409).
    await user.click(save);
    expect(await within(box).findByText(tv('folio.adjust_debt_locked'))).toBeInTheDocument();
    server.events.removeListener('request:start', on);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ newQuantity: 2 });
    expect(within(box).queryByText(tv('error.FOLIO_LOCKED'))).toBeNull();
    // The way out: "Xóa công nợ" closes this box and opens the write-off.
    await user.click(within(box).getByRole('button', { name: tv('debt.write_off') }));
    expect(
      await screen.findByRole('dialog', { name: tv('debt.write_off_title', { code: r.code }) }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /^Điều chỉnh:/ })).toBeNull();
  });

  it('409 FOLIO_LOCKED lúc đua (công nợ vừa mở) → cùng câu và nút "Xóa công nợ", không câu "folio đã khóa" chung', async () => {
    const { r } = settledWith(0);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const { box } = await openAdjust(user);
    expect(within(box).queryByText(tv('folio.adjust_debt_locked'))).toBeNull();
    await user.click(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') }));
    await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Ghi nhầm');
    mockControl.failNext(/\/adjustments:POST$/, 409, {
      code: 'FOLIO_LOCKED',
      detail: 'open debt – reduce what is owed through a FOC debt_write_off (BR-525)',
    });
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(await within(box).findByText(tv('folio.adjust_debt_locked'))).toBeInTheDocument();
    expect(within(box).queryByText(tv('error.FOLIO_LOCKED'))).toBeNull();
    expect(within(box).getByRole('button', { name: tv('debt.write_off') })).toBeInTheDocument();
  });

  it('không có công nợ mở: hủy dòng trên folio đã chốt ghi bình thường (A32)', async () => {
    const { r } = settledWith(0);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const { box } = await openAdjust(user);
    await user.click(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') }));
    await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Ghi nhầm');
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(await screen.findByText(tv('folio.adjusted_toast'))).toBeInTheDocument();
  });

  it('FD: folio đã chốt còn phải thu – câu "đã chốt" như cũ, không câu công nợ đoán trước, không nút', async () => {
    const { r } = settledWith(300_000);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
    expect(await within(dlg).findByText(tv('folio.settled_fd'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('folio.debt_fd'))).toBeNull();
    expect(within(dlg).queryByRole('button', { name: tv('debt.write_off') })).toBeNull();
    expect(within(dlg).queryByRole('button', { name: tv('folio.adjust') })).toBeNull();
  });
});

describe('FB-R2-ARC-FE-S4-02 – trần xóa nợ của máy chủ, số đã áp', () => {
  /** A write-off of `amount` already waiting for the owner on this folio. */
  function waiting(folioId: string, code: string, amount: number) {
    mockControl.stay.approvals.push({
      id: `wait-${amount}`,
      type: 'foc',
      status: 'pending',
      reservationCode: code,
      folioId,
      amountVnd: amount,
      reasonCode: 'debt_write_off',
      requestedBy: 'Chủ đầu tư',
      requestedByUserId: mockControl.db.users.find((u) => u.username === 'qa.owner')!.id,
      requestedAt: new Date().toISOString(),
      version: 1,
    });
  }
  async function openWriteOff(r: { id: string; code: string }) {
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('debt.write_off') }));
    const box = await screen.findByRole('dialog', {
      name: tv('debt.write_off_title', { code: r.code }),
    });
    await user.click(await within(box).findByRole('radio', { name: /Giặt|laundry/i }));
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('debt.write_off_note'))}`)),
      'Khách khiếu nại dịch vụ',
    );
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('ci.stepup_label'))}`)),
      MOCK_PASSWORD,
    );
    return { user, box };
  }
  const amountOf = (box: HTMLElement) =>
    within(box).getByLabelText(new RegExp(`^${esc(tv('co.amount'))}\\s*\\*?$`));

  it('422 max > 0 → báo số tối đa còn xin được, điền sẵn; gửi lại → áp', async () => {
    const { r, f } = settledWith(300_000);
    waiting(f.id, r.code, 200_000);
    const { user, box } = await openWriteOff(r);
    expect(amountOf(box)).toHaveValue('300.000');
    await user.click(within(box).getByRole('button', { name: submitName }));
    expect(
      await within(box).findByText(tv('debt.write_off_server_max', { amount: money(100_000) })),
    ).toBeInTheDocument();
    await waitFor(() => expect(amountOf(box)).toHaveValue('100.000'));
    expect(within(box).getByText(tv('debt.collect_max', { amount: money(100_000) }))).toBeTruthy();
    // The password is never kept after an attempt – typed again.
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('ci.stepup_label'))}`)),
      MOCK_PASSWORD,
    );
    await user.click(within(box).getByRole('button', { name: submitName }));
    expect(
      await screen.findByText(tv('debt.write_off_done', { amount: money(100_000), code: r.code })),
    ).toBeInTheDocument();
  });

  it('422 max = 0 (yêu cầu khác đang chờ phủ hết nợ) → giải thích, không gửi được', async () => {
    const { r, f } = settledWith(300_000);
    waiting(f.id, r.code, 300_000);
    const { user, box } = await openWriteOff(r);
    await user.click(within(box).getByRole('button', { name: submitName }));
    expect(await within(box).findByText(tv('debt.write_off_none_left'))).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: submitName })).toBeDisabled();
  });

  it('áp ngay: thông báo theo effectiveAmountVnd của phản hồi, không theo số gõ', async () => {
    const { r } = settledWith(300_000);
    server.use(
      http.post(
        `*/v1/properties/${PROPERTY_ID}/folios/:folioId/lines/:lineId/foc`,
        () =>
          HttpResponse.json(
            {
              id: 'eff-1',
              type: 'foc',
              status: 'approved',
              amountVnd: 300_000,
              effectiveAmountVnd: 250_000,
              reasonCode: 'debt_write_off',
              requestedBy: 'Quân',
              requestedAt: new Date().toISOString(),
              version: 1,
            },
            { status: 201 },
          ),
        { once: true },
      ),
    );
    const { user, box } = await openWriteOff(r);
    await user.click(within(box).getByRole('button', { name: submitName }));
    expect(
      await screen.findByText(tv('debt.write_off_done', { amount: money(250_000), code: r.code })),
    ).toBeInTheDocument();
  });
});

describe('QA 11.33 – H17 "Yêu cầu bạn đã gửi" cho người xin xóa nợ (MGR/OWN)', () => {
  it('MGR thấy yêu cầu mình gửi đã xong: áp một phần (câu số) và tự đóng (chip + câu)', async () => {
    const mgr = mockControl.db.users.find((u) => u.username === 'qa.mgr')!;
    const now = Date.now();
    const base = {
      type: 'foc',
      reasonCode: 'debt_write_off',
      requestedBy: mgr.displayName,
      requestedByUserId: mgr.id,
      version: 2,
    };
    mockControl.stay.approvals.push(
      {
        ...base,
        id: 'sent-capped',
        reservationCode: 'OTM-0990',
        status: 'approved',
        amountVnd: 5_000_000,
        effectiveAmountVnd: 3_000_000,
        requestedAt: new Date(now).toISOString(),
      },
      {
        ...base,
        id: 'sent-closed',
        reservationCode: 'OTM-0991',
        status: 'cancelled',
        autoCancelReason: 'debt_cleared',
        amountVnd: 1_000_000,
        requestedAt: new Date(now - 1000).toISOString(),
      },
    );
    renderApp('/approvals', 'qa.mgr');
    const head = await screen.findByRole('heading', {
      name: tv('approval.sent_recent'),
    });
    const block = head.closest('section')!;
    const capped = within(block).getByText(
      tv('approval.applied_capped', { amount: money(3_000_000), requested: money(5_000_000) }),
    );
    expect(within(capped.closest('li')!).getByText(tv('approval.status.approved'))).toBeTruthy();
    const closed = within(block).getByText(tv('approval.auto_cancel.debt_cleared'));
    const closedItem = closed.closest('li')!;
    expect(within(closedItem).getByText(tv('approval.status.auto_closed'))).toBeInTheDocument();
    expect(within(closedItem).queryByText(tv('approval.status.cancelled'))).toBeNull();
    // Someone else's decided request is not "mine".
    expect(within(block).queryByText(/OTM-0158/)).toBeNull();
  });
});
