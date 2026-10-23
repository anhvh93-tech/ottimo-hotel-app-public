// Sprint 4 – FE-A đợt 22: "Thu công nợ" sau trả phòng (ARC 16.26, BR-525 G-4) – drawer đơn đã trả phòng còn nợ và mục
// "Cần chú ý" `checkout_debt`; `recordPayment` type `charge` trên folio đã khóa, tối đa số còn phải thu, thu từng phần.
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { MOCK_PASSWORD, PROPERTY_ID } from '../mocks/seed';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ngọc Anh (203) checked out with 300.000 đ left as a debt on her settled folio. */
function withDebt() {
  const r = res('Ngọc Anh');
  expect(r.status).toBe('checked_out');
  const f = mockControl.stay.folios.get(r.folioId)!;
  f.status = 'settled';
  f.lines.push({
    id: 'debt-line',
    category: 'service_fee',
    description: 'service_fee',
    quantity: 1,
    unitPriceVnd: 300_000,
    amountVnd: 300_000,
    lineState: 'posted',
    postedAt: new Date().toISOString(),
  });
  const paidBefore = mockControl.stay.payments
    .filter((p) => p.folioId === r.folioId && p.status === 'succeeded')
    .reduce((a, p) => a + p.amountVnd, 0);
  const total = f.lines
    .filter((l) => l.lineState === 'posted')
    .reduce((a, l) => a + l.amountVnd, 0);
  const due = total - paidBefore;
  r.balanceDueVnd = due;
  return { r, due };
}

function capture(re: RegExp) {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'POST' || !re.test(new URL(request.url).pathname)) return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

describe('ARC 16.26 – Thu công nợ sau trả phòng', () => {
  it('drawer (FD): nút "Thu công nợ" → hộp, tối đa số còn phải thu, thu một phần → recordPayment charge, còn lại vẫn nợ', async () => {
    const { r, due } = withDebt();
    expect(due).toBeGreaterThan(0);
    const sent = capture(/\/folios\/[^/]+\/payments$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('debt.collect') }));
    const box = await screen.findByRole('dialog', {
      name: tv('debt.collect_title', { code: r.code }),
    });
    expect(
      await within(box).findByText(tv('debt.collect_help', { amount: money(due) })),
    ).toBeInTheDocument();
    const amount = within(box).getByLabelText(new RegExp(`^${esc(tv('co.amount'))}`));
    expect(amount).toHaveValue(due.toLocaleString('vi-VN'));
    // Above what is due → said at the box, nothing sent.
    await user.clear(amount);
    await user.type(amount, String(due + 1000));
    expect(
      within(box).getByText(
        tv('field_error.value_out_of_range', { min: money(1), max: money(due) }),
      ),
    ).toBeInTheDocument();
    const part = 100_000;
    await user.clear(amount);
    await user.type(amount, String(part));
    await user.click(
      within(box).getByRole('button', { name: tv('debt.collect_submit', { amount: money(part) }) }),
    );
    expect(
      await screen.findByText(tv('debt.collected_toast', { amount: money(part), code: r.code })),
    ).toBeInTheDocument();
    sent.stop();
    expect(sent.sent[0]).toMatchObject({ type: 'charge', method: 'cash', amountVnd: part });
    // A part collected: still a debt, the button is still there.
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: tv('debt.collect_title', { code: r.code }) }),
      ).toBeNull(),
    );
    expect(await within(d).findByRole('button', { name: tv('debt.collect') })).toBeInTheDocument();
  });

  it('mục "Cần chú ý" checkout_debt của một đơn (MGR): nút "Thu công nợ" mở cùng hộp; thu đủ', async () => {
    const { r, due } = withDebt();
    mockControl.dashboard.addEvent({
      kind: 'checkout_debt',
      severity: 'warning',
      count: 1,
      refCode: r.code,
      reservationIds: [r.id],
      audience: ['owner', 'manager'],
    });
    const sent = capture(/\/folios\/[^/]+\/payments$/);
    const { user } = renderApp('/today', 'qa.mgr');
    const line = await screen.findByText(tv('attn.checkout_debt', { n: 1 }));
    const row = line.closest('li') as HTMLElement;
    expect(within(row).queryByRole('button', { name: tv('attn.resolve') })).toBeNull();
    await user.click(within(row).getByRole('button', { name: tv('debt.collect') }));
    const box = await screen.findByRole('dialog', {
      name: tv('debt.collect_title', { code: r.code }),
    });
    await user.click(
      await within(box).findByRole('button', {
        name: tv('debt.collect_submit', { amount: money(due) }),
      }),
    );
    await waitFor(() => expect(sent.sent).toHaveLength(1));
    sent.stop();
    expect(sent.sent[0]).toMatchObject({ type: 'charge', amountVnd: due });
    const f = mockControl.stay.folios.get(r.folioId)!;
    expect(f.status).toBe('settled');
  });

  it('nhân viên bán (SAL) không thấy nút "Thu công nợ" ở drawer', async () => {
    const { r } = withDebt();
    r.createdBy = mockControl.db.users.find((u) => u.username === 'qa.sal')!.id;
    renderApp(`/reservations/${r.id}`, 'qa.sal');
    await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    expect(screen.queryByRole('button', { name: tv('debt.collect') })).toBeNull();
  });
});

describe('ARC 16.27 – Xóa nợ (OWN/MGR, FOC debt_write_off)', () => {
  /** The main button of the box, whatever amount it shows (by its string key – UXD may reword it). */
  const submitName = new RegExp(
    `^${esc(tv('debt.write_off_submit', { amount: '§' })).replace('§', '.+')}$`,
  );
  it('MGR: chọn dòng, số mặc định = min(dòng, còn nợ), ghi chú bắt buộc → requestFoc debt_write_off; trong giá 1 đêm áp ngay', async () => {
    const { r, due } = withDebt();
    const sent = capture(/\/lines\/[^/]+\/foc$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('debt.write_off') }));
    const box = await screen.findByRole('dialog', {
      name: tv('debt.write_off_title', { code: r.code }),
    });
    expect(await within(box).findByText(tv('debt.write_off_limit'))).toBeInTheDocument();
    await user.click(within(box).getByRole('radio', { name: /300\.000/ }));
    const amount = within(box).getByLabelText(new RegExp(`^${esc(tv('co.amount'))}\\s*\\*?$`));
    expect(amount).toHaveValue(Math.min(300_000, due).toLocaleString('vi-VN'));
    const submit = within(box).getByRole('button', { name: submitName });
    expect(submit).toBeDisabled(); // note required
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('debt.write_off_note'))}`)),
      'Khách khiếu nại dịch vụ',
    );
    // BUG-R3-001 (R3-Q25): still locked until the requester's password is typed.
    expect(submit).toBeDisabled();
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('ci.stepup_label'))}`)),
      MOCK_PASSWORD,
    );
    expect(submit).toBeEnabled();
    await user.click(submit);
    const value = Math.min(300_000, due);
    expect(
      await screen.findByText(tv('debt.write_off_done', { amount: money(value), code: r.code })),
    ).toBeInTheDocument();
    sent.stop();
    expect(sent.sent[0]).toMatchObject({
      kind: 'foc',
      amountVnd: value,
      reasonCode: 'debt_write_off',
      note: 'Khách khiếu nại dịch vụ',
      authMethod: 'password',
      secret: MOCK_PASSWORD,
    });
  });

  it('MGR vượt giá 1 đêm → "chờ chủ đầu tư duyệt"; FD không thấy nút', async () => {
    const { r } = withDebt();
    const f = mockControl.stay.folios.get(r.folioId)!;
    // A bigger unpaid charge than one night's price.
    f.lines.push({
      id: 'debt-big',
      category: 'damage',
      description: 'damage',
      quantity: 1,
      unitPriceVnd: 2_000_000,
      amountVnd: 2_000_000,
      lineState: 'posted',
      postedAt: new Date().toISOString(),
    });
    r.balanceDueVnd = (r.balanceDueVnd ?? 0) + 2_000_000;
    const { user, unmount } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('debt.write_off') }));
    const box = await screen.findByRole('dialog', {
      name: tv('debt.write_off_title', { code: r.code }),
    });
    await user.click(await within(box).findByRole('radio', { name: /2\.000\.000/ }));
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('debt.write_off_note'))}`)),
      'Xóa theo chỉ đạo',
    );
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('ci.stepup_label'))}`)),
      MOCK_PASSWORD,
    );
    await user.click(within(box).getByRole('button', { name: submitName }));
    expect(
      await screen.findByText(
        tv('debt.write_off_pending', { amount: money(2_000_000), code: r.code }),
      ),
    ).toBeInTheDocument();
    unmount();
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await screen.findByRole('button', { name: tv('debt.collect') });
    expect(screen.queryByRole('button', { name: tv('debt.write_off') })).toBeNull();
  });
});

describe('BUG-R3-001 – Xóa công nợ: người xin nhập lại mật khẩu (R3-Q25, S1)', () => {
  const submitName = new RegExp(
    `^${esc(tv('debt.write_off_submit', { amount: '§' })).replace('§', '.+')}$`,
  );
  it('sai mật khẩu → lỗi dưới ô mật khẩu, không ghi gì, ô được xóa; đúng → áp', async () => {
    const { r } = withDebt();
    const before = mockControl.stay.approvals.length;
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('debt.write_off') }));
    const box = await screen.findByRole('dialog', {
      name: tv('debt.write_off_title', { code: r.code }),
    });
    expect(within(box).getByText(tv('debt.write_off_reauth_help'))).toBeInTheDocument();
    await user.click(within(box).getByRole('radio', { name: /300\.000/ }));
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('debt.write_off_note'))}`)),
      'Khach khong lien lac duoc',
    );
    const pw = within(box).getByLabelText(new RegExp(`^${esc(tv('ci.stepup_label'))}`));
    expect(pw).toHaveAttribute('type', 'password');
    await user.type(pw, 'sai-mat-khau');
    await user.click(within(box).getByRole('button', { name: submitName }));
    expect(
      await within(box).findByText(tv('field_error.current_password_wrong')),
    ).toBeInTheDocument();
    expect(pw).toHaveValue('');
    expect(pw).toHaveAttribute('aria-invalid', 'true');
    expect(mockControl.stay.approvals.length).toBe(before);
    await user.type(pw, MOCK_PASSWORD);
    await user.click(within(box).getByRole('button', { name: submitName }));
    expect(
      await screen.findByText(
        new RegExp(
          esc(tv('debt.write_off_done', { amount: '§', code: r.code })).replace('§', '.+'),
        ),
      ),
    ).toBeInTheDocument();
  });

  it('MSW như server: debt_write_off không kèm mật khẩu → 422 `secret` REQUIRED', async () => {
    const { r } = withDebt();
    mockControl.signInAs('qa.mgr');
    const res = await fetch(
      `http://localhost/v1/properties/${PROPERTY_ID}/folios/${r.folioId}/lines/debt-line/foc`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': mockControl.db.csrf,
          'idempotency-key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          kind: 'foc',
          amountVnd: 100_000,
          reasonCode: 'debt_write_off',
          note: 'Khach khong lien lac duoc',
        }),
      },
    );
    expect(res.status).toBe(422);
    expect((await res.json()).errors[0]).toEqual({ field: 'secret', code: 'REQUIRED' });
  });
});
