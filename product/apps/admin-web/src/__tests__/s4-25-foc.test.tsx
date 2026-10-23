// Sprint 4 – FE-A S4-25 (US-007 AC1, AC6; US-036; US-022 AC4; BUG-R2-093; BR-414, BR-432…436, S4-23 (6)):
// the desk asks a FOC outside check-in – late surcharge (H15, H16 step 2), a folio line, the front desk's own
// minibar waiver, a person added while in house.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD } from '../mocks/seed';
import { renderApp, tv } from '../test/render';
import { pinDaytime } from '../test/clock';

type User = ReturnType<typeof renderApp>['user'];
type Line =
  ReturnType<typeof mockControl.stay.folios.get> extends infer F
    ? F extends { lines: Array<infer L> }
      ? L
      : never
    : never;

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};

/** Every write body sent to a URL matching `re` while the screen is used. */
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
const focLines = (folioId: string) =>
  mockControl.stay.folios.get(folioId)!.lines.filter((l) => l.category === 'foc');

afterEach(() => vi.useRealTimers());

describe('S4-25 – phụ thu trả muộn kèm đề nghị miễn phí (H16 bước 2, H15)', () => {
  /** Phạm Huy (201): minibar checked, room nights paid – only the late surcharge is left. */
  const prepaid = () => {
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    mockControl.stay.payments.push({
      id: 'p-s425',
      code: 'PT-S425',
      folioId: r.folioId,
      type: 'charge',
      method: 'cash',
      amountVnd: 2_460_000,
      status: 'succeeded',
      reconciliation: 'not_required',
      version: 1,
    });
    return r;
  };

  it('H16 bước 2: tick + "Xin miễn phụ thu" + lý do → phụ thu và yêu cầu FOC đi cùng một lệnh; bill báo đang chờ duyệt', async () => {
    at('14:05');
    const r = prepaid();
    const late = capture(/\/actions\/late-checkout$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const fee = await screen.findByText(
      new RegExp(
        `^${esc(tv('checkout.late_fee', { amount: '§', pct: 30 })).replace('§', '(.+)')}$`,
      ),
    );
    const amount = Number(/(\d[\d.]*)/.exec(fee.textContent ?? '')![1]!.replace(/\./g, ''));
    await user.click(screen.getByRole('checkbox', { name: `${tv('ci.told_guest')} *` }));
    await user.click(screen.getByRole('switch', { name: tv('ci.ask_foc') }));
    const go = screen.getByRole('button', { name: tv('co.go_bill') });
    // Switched on without a reason → not sent, the button says why (BR-432).
    await user.click(go);
    expect(go).toHaveAccessibleDescription(tv('foc.needs_reason'));
    expect(late.sent.filter((b) => b.dryRun === false)).toHaveLength(0);
    await user.click(screen.getByRole('radio', { name: tv('foc.r_regular') }));
    await user.click(go);
    // Step 3 says the waiver waits for a decision (BR-426: it blocks "Hoàn tất").
    expect(
      await screen.findByText(
        new RegExp(`^${esc(tv('co.foc_pending', { amount: money(amount) }))}`),
      ),
    ).toBeInTheDocument();
    late.stop();
    const write = late.sent.find((b) => b.dryRun === false)!;
    expect(write).toMatchObject({
      applySurcharge: true,
      expectedSurchargeVnd: amount,
      requestFocForSurcharge: { kind: 'foc', amountVnd: amount, reasonCode: 'regular_vip' },
    });
    const pending = focLines(r.folioId);
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ amountVnd: -amount, lineState: 'pending_approval' });
    const a = mockControl.stay.approvals.find((x) => x.id === pending[0]!.approvalRequestId)!;
    expect(a).toMatchObject({ type: 'foc', status: 'pending', reasonCode: 'regular_vip' });
  });

  it('H15 Trả muộn: lưu giờ 15:00 kèm đề nghị miễn phí (Khác + ghi chú) → requestFocForSurcharge', async () => {
    const r = res('Phạm Huy');
    const late = capture(/\/actions\/late-checkout$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    await user.click(within(d).getByRole('button', { name: tv('drawer.action.late_checkout') }));
    const dlg = await screen.findByRole('dialog', { name: /^Trả muộn/ });
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${tv('late.time')}`)), {
      target: { value: '15:00' },
    });
    const fee = await within(dlg).findByText(/^Phụ thu đề xuất:/);
    const amount = Number(/(\d[\d.]*)/.exec(fee.textContent ?? '')![1]!.replace(/\./g, ''));
    await user.click(within(dlg).getByRole('checkbox', { name: tv('ci.told_guest') }));
    await user.click(within(dlg).getByRole('switch', { name: tv('ci.ask_foc') }));
    await user.click(within(dlg).getByRole('radio', { name: tv('foc.r_other') }));
    const save = within(dlg).getByRole('button', { name: tv('late.submit', { time: '15:00' }) });
    expect(save).toHaveAccessibleDescription(tv('field_error.reason_required'));
    await user.type(
      within(dlg).getByLabelText(new RegExp(`^${tv('stay.note')}`)),
      'Khách quen lâu năm',
    );
    expect(save).not.toHaveAttribute('aria-disabled');
    await user.click(save);
    expect(await screen.findByText(tv('foc.sent', { amount: money(amount) }))).toBeInTheDocument();
    late.stop();
    expect(late.sent.find((b) => b.dryRun === false)).toMatchObject({
      requestFocForSurcharge: {
        kind: 'foc',
        amountVnd: amount,
        reasonCode: 'other',
        note: 'Khách quen lâu năm',
      },
    });
    expect(focLines(r.folioId).map((l) => l.lineState)).toEqual(['pending_approval']);
  });
});

describe('S4-25 – xin miễn phí trên một dòng folio (H17 17.1) và tự áp FOC minibar (BR-436)', () => {
  function addLine(
    guest: string,
    line: Partial<Line> & { id: string; category: string; amountVnd: number },
  ) {
    const r = res(guest);
    const folio = mockControl.stay.folios.get(r.folioId)!;
    folio.lines.push({
      description: line.category,
      serviceDate: r.arrivalDate,
      quantity: 1,
      unitPriceVnd: line.amountVnd,
      lineState: 'posted',
      postedAt: new Date().toISOString(),
      ...line,
    } as Line);
    return { r, folio };
  }
  async function openFolio(user: User, guest: string) {
    const d = await screen.findByRole('dialog', { name: guest });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    return screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
  }
  const rowOf = async (dlg: HTMLElement, text: RegExp) =>
    (await within(dlg).findByText(text)).closest('tr')!;

  it('dòng phát sinh: số tối đa = phần còn lại sau FOC đã áp; vượt → báo ở ô, không gửi; đúng → chờ duyệt', async () => {
    const { r, folio } = addLine('Nguyễn Văn An', {
      id: 'laundry-s425',
      category: 'laundry',
      labelKey: 'bill.line.laundry',
      labelParams: { qty: 2 },
      amountVnd: 200_000,
    });
    // 50.000 already waived on it (applied) → 150.000 left to ask (S4-23 (6)).
    folio.lines.push({
      id: 'foc-old',
      category: 'foc',
      description: 'foc',
      quantity: 1,
      unitPriceVnd: -50_000,
      amountVnd: -50_000,
      lineState: 'posted',
      relatedLineId: 'laundry-s425',
      postedAt: new Date().toISOString(),
    } as Line);
    const req = capture(/\/lines\/laundry-s425\/foc$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openFolio(user, 'Nguyễn Văn An');
    // The waiver already applied says so (BR-434).
    const old = (await within(dlg).findAllByText(tv('foc.state_applied')))[0]!;
    expect(old).toBeInTheDocument();
    const row = await rowOf(dlg, /Giặt|laundry/i);
    await user.click(within(row).getByRole('button', { name: tv('foc.open_form') }));
    const box = await screen.findByRole('dialog', { name: /^Miễn phí ·/ });
    const amount = within(box).getByLabelText(new RegExp(`^${tv('foc.amount')}`));
    expect(amount).toHaveValue('150.000');
    expect(within(box).getByText(tv('foc.max', { amount: money(150_000) }))).toBeInTheDocument();
    // Not a room night → no "giảm giá đặc biệt" choice.
    expect(within(box).queryByText(tv('foc.kind_discount'))).not.toBeInTheDocument();
    await user.clear(amount);
    await user.type(amount, '160000');
    await user.click(within(box).getByRole('radio', { name: tv('foc.r_recovery') }));
    await user.click(within(box).getByRole('button', { name: tv('foc.send') }));
    expect(
      within(box).getByText(tv('foc.over_max', { amount: money(150_000) })),
    ).toBeInTheDocument();
    expect(req.sent).toHaveLength(0);
    await user.clear(amount);
    await user.type(amount, '150000');
    await user.click(within(box).getByRole('button', { name: tv('foc.send') }));
    expect(await screen.findByText(tv('foc.sent', { amount: money(150_000) }))).toBeInTheDocument();
    req.stop();
    expect(req.sent).toEqual([{ kind: 'foc', amountVnd: 150_000, reasonCode: 'service_recovery' }]);
    // Nothing left to ask → no more button on that line; the new request shows "Chờ duyệt".
    await waitFor(async () =>
      expect(
        within(await rowOf(dlg, /Giặt|laundry/i)).queryByRole('button', {
          name: tv('foc.open_form'),
        }),
      ).not.toBeInTheDocument(),
    );
    expect(within(dlg).getAllByText(tv('approval.status.pending')).length).toBeGreaterThan(0);
  });

  it('lễ tân tự áp FOC minibar 35.000 bằng mật khẩu (BR-436): sai mật khẩu → báo; đúng → "Đã áp", không vào hàng chờ', async () => {
    const { r } = addLine('Nguyễn Văn An', {
      id: 'minibar-s425',
      category: 'minibar',
      labelKey: 'bill.line.minibar',
      labelParams: { item: 'Bia', qty: 1 },
      amountVnd: 35_000,
    });
    const req = capture(/\/lines\/minibar-s425\/foc$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openFolio(user, 'Nguyễn Văn An');
    const row = (await within(dlg).findByText(/minibar|Bia/i)).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: tv('foc.open_form') }));
    const box = await screen.findByRole('dialog', { name: /^Miễn phí ·/ });
    await user.click(within(box).getByRole('radio', { name: tv('foc.r_regular') }));
    expect(
      within(box).getByText(
        tv('foc.self_apply_short', { amount: money(35_000), limit: money(100_000) }),
      ),
    ).toBeInTheDocument();
    const pw = within(box).getByLabelText(new RegExp(`^${tv('ci.stepup_label')}`));
    await user.type(pw, 'wrong-password');
    await user.click(within(box).getByRole('button', { name: tv('foc.self_apply_submit') }));
    expect(
      await within(box).findByText(tv('field_error.current_password_wrong')),
    ).toBeInTheDocument();
    await user.type(pw, MOCK_PASSWORD);
    await user.click(within(box).getByRole('button', { name: tv('foc.self_apply_submit') }));
    expect(
      await screen.findByText(tv('foc.applied', { amount: money(35_000) })),
    ).toBeInTheDocument();
    req.stop();
    expect(req.sent.at(-1)).toMatchObject({
      kind: 'foc',
      amountVnd: 35_000,
      reasonCode: 'regular_vip',
      authMethod: 'password',
    });
    const a = mockControl.stay.approvals.at(-1)!;
    expect(a).toMatchObject({ status: 'approved', selfApplied: true, amountVnd: 35_000 });
    expect(focLines(r.folioId).at(-1)).toMatchObject({ lineState: 'posted', amountVnd: -35_000 });
    expect(await within(dlg).findByText(tv('foc.state_applied'))).toBeInTheDocument();
  });
});

describe('S4-25 / BUG-R2-093 – thêm người khi đang ở: ghi phụ thu kèm đề nghị miễn phí (US-022 AC4, BR-414)', () => {
  it('tick phụ thu + "Xin miễn phụ thu" + lý do → thêm người, rồi mỗi đêm một yêu cầu đúng phần của người mới', async () => {
    pinDaytime(); // not a BR-010 night case – see test/clock.ts
    const r = res('Trần Thu Nga');
    const foc = capture(/\/folios\/[^/]+\/lines\/[^/]+\/foc$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Trần Thu Nga' });
    await user.click(within(d).getByRole('button', { name: tv('rsv.add_person') }));
    const dlg = await screen.findByRole('dialog', { name: tv('rsv.party') });
    const pick = async (q: string, name: RegExp) => {
      const box = within(dlg).getByRole('combobox', { name: /Khách đứng tên/ });
      // The picker closes its list 150 ms after a blur – let that timer pass first (as s3-fix9).
      await new Promise((done) => setTimeout(done, 200));
      await user.clear(box);
      await user.type(box, q);
      await user.click(await screen.findByRole('option', { name }));
    };
    const add = within(dlg).getByRole('button', { name: tv('rsv.add_submit') });
    // First person within the standard occupancy (no surcharge), then the one above it.
    await pick('Trần Thu', /Trần Thu Hà/);
    await within(dlg).findByText(tv('party.surcharge_zero'));
    await waitFor(() => expect(add).toBeEnabled());
    await user.click(add);
    expect(await within(dlg).findByText('Khách đi cùng')).toBeInTheDocument();
    await pick('do mai', /Đỗ Mai Anh/);
    // Room 101: standard 2 → 150.000 × 2 nights (UXR #7 example).
    await within(dlg).findByText(tv('party.surcharge_line', { amount: money(300_000), nights: 2 }));
    await user.click(
      within(dlg).getByRole('checkbox', {
        name: tv('party.surcharge_confirm', { amount: money(300_000) }),
      }),
    );
    await user.click(within(dlg).getByRole('switch', { name: tv('ci.ask_foc') }));
    expect(add).toBeDisabled();
    expect(within(dlg).getByText(tv('foc.needs_reason'))).toBeInTheDocument();
    await user.click(within(dlg).getByRole('radio', { name: tv('foc.r_long') }));
    expect(add).toBeEnabled();
    await user.click(add);
    expect(await screen.findByText(tv('party.foc_sent', { n: 2 }))).toBeInTheDocument();
    foc.stop();
    expect(foc.sent).toEqual([
      { kind: 'foc', amountVnd: 150_000, reasonCode: 'long_stay_guest' },
      { kind: 'foc', amountVnd: 150_000, reasonCode: 'long_stay_guest' },
    ]);
    const lines = mockControl.stay.folios.get(r.folioId)!.lines;
    const nights = lines.filter((l) => l.category === 'extra_person' && l.lineState === 'posted');
    expect(
      focLines(r.folioId)
        .map((l) => l.relatedLineId)
        .sort(),
    ).toEqual(nights.map((l) => l.id).sort());
  });
});
