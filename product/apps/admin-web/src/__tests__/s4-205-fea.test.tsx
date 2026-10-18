// Sprint 4 – FE-A đợt 24 (ARC 16.29): BUG-R2-205 – H14 cảnh báo đoàn vượt số khách (`Registration.partyOverCount`) kèm
// lối sửa (gỡ người thừa / gắn lại giấy tờ); N-6 – 412 ở hộp ghi tiền: tải lại folio, giữ hộp đang mở, báo số vừa đổi.
// SEC BE-80 – yêu cầu xóa công nợ chờ duyệt tự đóng (`autoCancelReason = debt_cleared`) khi nợ đã thu đủ.
// Đợt 25: áp một phần (`effectiveAmountVnd` < `amountVnd` → `approval.applied_capped`), FE-S4-28 (nhật ký tiền / chip tự đóng).
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { approvalStatusText } from '../app/auditReason';
import { Providers } from '../app/Providers';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD } from '../mocks/seed';
import { OverviewPage } from '../pages/OverviewPage';
import { useSession } from '../session/SessionProvider';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const userId = (username: string) => mockControl.db.users.find((u) => u.username === username)!.id;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const fieldRe = (key: string) => new RegExp(`^${esc(tv(key))}`);

/** "Gia đình anh Hưng" (4 guests) whose party has one person more (added from an ID that matched nobody). */
function overParty() {
  const r = res('Gia đình anh Hưng');
  const reg = mockControl.stay.registrations.get(r.registrationId!)!;
  mockControl.stay.party.set(r.id, [
    { id: r.id, role: 'booker', displayName: 'Gia đình anh Hưng', priceAgeBand: 'adult' },
    { id: 'm-1', role: 'companion', displayName: 'Trần Thị Bích', priceAgeBand: 'adult' },
    { id: 'm-2', role: 'companion', displayName: 'Lê Văn Cường', priceAgeBand: 'adult' },
    { id: 'm-3', role: 'companion', displayName: 'Phạm Thu', priceAgeBand: 'adult' },
    { id: 'm-x', role: 'companion', displayName: 'Nguyen Van Hung', priceAgeBand: 'adult' },
  ]);
  reg.documents.push({
    id: 'doc-x',
    partyMemberId: 'm-x',
    docType: 'cccd',
    isMain: true,
    fullNameOnDoc: 'Nguyen Van Hung',
    nationalityCode: 'VNM',
    docNumber: '079123456789',
    imageIds: [],
    imageConsent: 'not_recorded',
    captureMethod: 'manual',
    checks: [],
  } as unknown as (typeof reg.documents)[number]);
  mockControl.stay.stepUpUntil.set(userId('qa.fd'), Date.now() + 5 * 60_000);
  return { r, reg };
}

describe('BUG-R2-205 – H14 cảnh báo vượt số khách sau khi nhập giấy tờ', () => {
  it('hiện cảnh báo với số người thừa; "Gỡ người thừa" mở hộp đoàn', async () => {
    const { reg } = overParty();
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const alert = (await screen.findByText(tv('checkin.docs.over_party', { n: 1 }))).closest(
      '[role="alert"], .alert',
    ) as HTMLElement;
    expect(alert).toBeTruthy();
    await user.click(within(alert).getByRole('button', { name: tv('reg.over_party_remove') }));
    expect(await screen.findByRole('dialog', { name: tv('rsv.party') })).toBeInTheDocument();
  });

  it('"Gắn lại giấy tờ": hộp sửa giấy tờ có ô người hiện người đang gắn; đổi người → gửi partyMemberId mới', async () => {
    const { reg } = overParty();
    const sent: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      if (request.method !== 'PATCH' || !/\/documents\/doc-x$/.test(new URL(request.url).pathname))
        return;
      void request
        .clone()
        .json()
        .then((b: Record<string, unknown>) => sent.push(b));
    };
    server.events.on('request:start', on);
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    await screen.findByText(tv('checkin.docs.over_party', { n: 1 }));
    const row = screen
      .getAllByRole('listitem')
      .find((x) => x.id.startsWith('doc-') && x.textContent?.includes('Nguyen Van Hung'))!;
    await user.click(within(row).getByRole('button', { name: tv('rooms.edit') }));
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    const pick = await within(dlg).findByLabelText(fieldRe('reg.link.member'));
    await waitFor(() => expect(pick).toHaveValue('m-x'));
    expect(pick).toHaveAccessibleDescription(tv('reg.relink_help'));
    // The booker himself is on this ID.
    await user.selectOptions(
      pick,
      within(dlg).getByRole('option', { name: new RegExp(` · ${tv('rsv.booker')}$`) }),
    );
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    await waitFor(() => expect(sent).toHaveLength(1));
    server.events.removeListener('request:start', on);
    expect(sent[0]).toMatchObject({ partyMemberId: res('Gia đình anh Hưng').id });
  });
});

describe('N-6 – 412 ở hộp ghi tiền: tải lại folio, giữ hộp', () => {
  it('Điều chỉnh dòng: 412 → báo số vừa đổi, hộp vẫn mở, folio được đọc lại; lưu lại → thành công với version mới', async () => {
    const r = res('Nguyễn Văn An');
    const folio = mockControl.stay.folios.get(r.folioId)!;
    folio.lines.push({
      id: 'laundry-n6',
      category: 'laundry',
      description: 'laundry x3',
      labelKey: 'bill.line.laundry',
      labelParams: { qty: 3 },
      quantity: 3,
      unitPriceVnd: 25_000,
      amountVnd: 75_000,
      lineState: 'posted',
      postedAt: new Date().toISOString(),
    });
    let folioReads = 0;
    const onRead = ({ request }: { request: Request }) => {
      if (
        request.method === 'GET' &&
        new URL(request.url).pathname.endsWith(`/folios/${r.folioId}`)
      )
        folioReads += 1;
    };
    server.events.on('request:start', onRead);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Nguyễn Văn An' });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
    const row = (await within(dlg).findByText(/Giặt|laundry/i)).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: tv('folio.adjust') }));
    const box = await screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
    const qty = within(box).getByLabelText(fieldRe('folio.adjust_qty'));
    await user.clear(qty);
    await user.type(qty, '2');
    await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Cân lại còn 2 kg');
    // Someone collected a payment meanwhile: the folio version moved (N-6).
    folio.version += 1;
    const before = folioReads;
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(await within(box).findByText(tv('folio.changed_reload'))).toBeInTheDocument();
    await waitFor(() => expect(folioReads).toBeGreaterThan(before));
    // Still open, what was typed is kept.
    expect(within(box).getByLabelText(fieldRe('folio.adjust_qty'))).toHaveValue('2');
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(await screen.findByText(tv('folio.adjusted_toast'))).toBeInTheDocument();
    server.events.removeListener('request:start', onRead);
  });
});

/** Ngọc Anh (checked out, settled) with an OWN-level debt write-off waiting; `debt` = what is still owed. */
function pendingWriteOff(debt: number, asked = 100_000) {
  const r = res('Ngọc Anh');
  const f = mockControl.stay.folios.get(r.folioId)!;
  f.status = 'settled';
  if (debt > 0)
    f.lines.push({
      id: 'debt-line',
      category: 'service_fee',
      description: 'service_fee',
      quantity: 1,
      unitPriceVnd: debt,
      amountVnd: debt,
      lineState: 'posted',
      postedAt: new Date().toISOString(),
    });
  // Whatever else is owed is paid: what is left is exactly `debt`.
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
      id: 'pay-clear',
      folioId: f.id,
      type: 'charge',
      status: 'succeeded',
      method: 'cash',
      amountVnd: net,
    });
  const charge = f.lines.find((l) => l.lineState === 'posted' && l.amountVnd > 0)!;
  mockControl.stay.approvals.push({
    id: 'wo-1',
    type: 'foc',
    status: 'pending',
    reservationCode: r.code,
    folioId: f.id,
    folioLineId: charge.id,
    amountVnd: asked,
    reasonCode: 'debt_write_off',
    reasonNote: 'Khách không liên lạc được',
    requestedBy: 'Chủ đầu tư',
    requestedByUserId: userId('qa.owner'),
    requestedAt: new Date().toISOString(),
    version: 1,
  });
  f.lines.push({
    id: 'wo-line',
    category: 'foc',
    description: `foc ${charge.id}`,
    labelParams: { reason: 'debt_write_off' },
    quantity: 1,
    unitPriceVnd: -asked,
    amountVnd: -asked,
    lineState: 'pending_approval',
    relatedLineId: charge.id,
    approvalRequestId: 'wo-1',
    postedAt: new Date().toISOString(),
  });
  return { r, f };
}
const wo = () => mockControl.stay.approvals.find((a) => a.id === 'wo-1')!;

describe('SEC BE-80 – yêu cầu xóa công nợ tự đóng khi nợ đã thu đủ (debt_cleared)', () => {
  it('Cần duyệt: duyệt khi nợ đã thu hết → máy chủ đóng yêu cầu; Desk báo câu riêng, không phải "Đã duyệt"/"Đã rút"', async () => {
    const { r } = pendingWriteOff(0);
    const { user } = renderApp('/approvals', 'qa.mgr');
    const card = (
      await screen.findByText(
        (_, el) => el?.tagName === 'B' && !!el.textContent?.startsWith(`${r.code} · `),
      )
    ).closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('approval.approve') }));
    const dlg = await screen.findByRole('dialog', { name: new RegExp(esc(r.code)) });
    await user.type(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('approval.approve') }));
    expect(await screen.findByText(tv('approval.auto_cancel.debt_cleared'))).toBeInTheDocument();
    expect(screen.queryByText(tv('approval.status.approved'))).toBeNull();
    expect(wo()).toMatchObject({ status: 'cancelled', autoCancelReason: 'debt_cleared' });
  });

  it('R2: thu đủ công nợ khi yêu cầu xóa nợ đang chờ → yêu cầu VẪN chờ; duyệt → tự đóng; nhật ký tiền ghi câu riêng (không "auto: debt_cleared")', async () => {
    const { r } = pendingWriteOff(300_000);
    const { user, unmount } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('debt.collect') }));
    const box = await screen.findByRole('dialog', {
      name: tv('debt.collect_title', { code: r.code }),
    });
    const submit = new RegExp(
      `^${esc(tv('debt.collect_submit', { amount: '§' })).replace('§', '.+')}$`,
    );
    await user.click(await within(box).findByRole('button', { name: submit }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: tv('debt.collect_title', { code: r.code }) }),
      ).toBeNull(),
    );
    // ARC 16.30.3 / SM-10 A7: R2 closes it only when someone approves it (closing at once = BE-S4-17, R3).
    expect(wo().status).toBe('pending');
    unmount();
    const appr = renderApp('/approvals', 'qa.mgr');
    const card = (
      await screen.findByText(
        (_, el) => el?.tagName === 'B' && !!el.textContent?.startsWith(`${r.code} · `),
      )
    ).closest('li')!;
    await appr.user.click(within(card).getByRole('button', { name: tv('approval.approve') }));
    const dlg = await screen.findByRole('dialog', { name: new RegExp(esc(r.code)) });
    await appr.user.type(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/), MOCK_PASSWORD);
    await appr.user.click(within(dlg).getByRole('button', { name: tv('approval.approve') }));
    expect(await screen.findByText(tv('approval.auto_cancel.debt_cleared'))).toBeInTheDocument();
    expect(wo()).toMatchObject({ status: 'cancelled', autoCancelReason: 'debt_cleared' });
    appr.unmount();
    renderApp('/audit', 'qa.mgr');
    const why = await screen.findByText(tv('approval.auto_cancel.debt_cleared'));
    expect(screen.queryByText(/auto: debt_cleared/)).toBeNull();
    // FE-S4-28: the action says "closed automatically", never "withdrawn" (nobody withdrew it).
    const row = why.closest('tr')!;
    expect(within(row).getByText(tv('approval.status.auto_closed'))).toBeInTheDocument();
    expect(within(row).queryByText(tv('mlog.a_approval_cancelled'))).toBeNull();
  });

  it('nhật ký tiền: lý do tự đóng chưa có câu riêng → câu chung; mã đã có câu (đơn hủy) → câu đó', async () => {
    const base = {
      occurredAt: new Date().toISOString(),
      actorType: 'system',
      category: 'money',
      action: 'approval.cancelled',
      entityCode: 'OTM-0998',
    };
    mockControl.stay.audit.unshift(
      { ...base, reason: 'auto: some_new_reason' },
      { ...base, reason: 'auto: reservation_cancelled' },
    );
    renderApp('/audit', 'qa.mgr');
    expect(await screen.findByText(tv('approval.auto_cancel.other'))).toBeInTheDocument();
    expect(screen.getByText(tv('mlog.reason.reservation_cancelled'))).toBeInTheDocument();
    expect(screen.queryByText(/auto: /)).toBeNull();
  });
});

describe('Đợt 25 – xóa công nợ áp một phần (effectiveAmountVnd) và FE-S4-28', () => {
  it('H17: xin 5.000.000, khách trả 2.000.000 trong lúc chờ, duyệt → báo "Đã xóa công nợ 3.000.000 (yêu cầu 5.000.000)"; nhật ký tiền ghi cùng câu', async () => {
    const { r } = pendingWriteOff(3_000_000, 5_000_000);
    const { user, unmount } = renderApp('/approvals', 'qa.mgr');
    const card = (
      await screen.findByText(
        (_, el) => el?.tagName === 'B' && !!el.textContent?.startsWith(`${r.code} · `),
      )
    ).closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('approval.approve') }));
    const dlg = await screen.findByRole('dialog', { name: new RegExp(esc(r.code)) });
    await user.type(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('approval.approve') }));
    const capped = tv('approval.applied_capped', {
      amount: money(3_000_000),
      requested: money(5_000_000),
    });
    expect(capped).toContain('3.000.000');
    expect(capped).toContain('5.000.000');
    expect(await screen.findByText(capped)).toBeInTheDocument();
    expect(wo()).toMatchObject({ status: 'approved', effectiveAmountVnd: 3_000_000 });
    unmount();
    renderApp('/audit', 'qa.mgr');
    const row = (await screen.findByText(capped)).closest('tr')!;
    // The reason (code `debt_collected_before_approval`) in words; no "other action" + raw code.
    expect(within(row).getByText(tv('foc.r_debt_write_off'))).toBeInTheDocument();
    expect(within(row).queryByText(/debt_collected_before_approval/)).toBeNull();
    expect(within(row).queryByText(tv('mlog.a_other'))).toBeNull();
    expect(within(row).getByText(/5\.000\.000 → 3\.000\.000/)).toBeInTheDocument();
  });

  it('H24 "Yêu cầu của tôi": tự đóng → chip "Đã tự đóng" + câu chung; áp một phần → chip "Đã duyệt" + câu số đã xóa', async () => {
    const fd = mockControl.db.users.find((u) => u.username === 'qa.fd')!;
    const now = Date.now();
    const base = {
      type: 'foc',
      reservationCode: 'OTM-0997',
      requestedBy: fd.displayName,
      requestedByUserId: fd.id,
      version: 1,
    };
    mockControl.stay.approvals.push(
      {
        ...base,
        id: 'auto-1',
        status: 'cancelled',
        autoCancelReason: 'superseded',
        amountVnd: 75_000,
        reasonCode: 'service_recovery',
        requestedAt: new Date(now).toISOString(),
      },
      {
        ...base,
        id: 'capped-1',
        status: 'approved',
        amountVnd: 500_000,
        effectiveAmountVnd: 200_000,
        reasonCode: 'debt_write_off',
        requestedAt: new Date(now - 1000).toISOString(),
      },
    );
    function Gate() {
      return useSession().property ? <OverviewPage /> : null;
    }
    mockControl.signInAs('qa.fd');
    render(
      <Providers>
        <MemoryRouter>
          <Gate />
        </MemoryRouter>
      </Providers>,
    );
    const auto = await screen.findByText(tv('approval.auto_cancel.other'));
    const autoItem = auto.closest('li')!;
    expect(within(autoItem).getByText(tv('approval.status.auto_closed'))).toBeInTheDocument();
    expect(within(autoItem).queryByText(tv('approval.status.cancelled'))).toBeNull();
    const capped = await screen.findByText(
      tv('approval.applied_capped', { amount: money(200_000), requested: money(500_000) }),
    );
    expect(
      within(capped.closest('li')!).getByText(tv('approval.status.approved')),
    ).toBeInTheDocument();
  });

  it('FE-S4-28: chip trạng thái (tab Hoàn tiền dùng chung) – tự đóng ≠ "Đã rút"; người gửi rút vẫn "Đã rút"; nhật ký rút tay vẫn "Rút yêu cầu"', async () => {
    expect(approvalStatusText(tv, { status: 'cancelled', autoCancelReason: 'superseded' })).toBe(
      tv('approval.status.auto_closed'),
    );
    expect(approvalStatusText(tv, { status: 'cancelled' })).toBe(tv('approval.status.cancelled'));
    expect(approvalStatusText(tv, { status: 'approved' })).toBe(tv('approval.status.approved'));
    mockControl.stay.audit.unshift({
      occurredAt: new Date().toISOString(),
      actorType: 'user',
      actorName: 'Hạnh',
      category: 'money',
      action: 'approval.cancelled',
      entityCode: 'OTM-0996',
    });
    // A row written before BE-B sent a code: the old English sentence still reads as words.
    mockControl.stay.audit.unshift({
      occurredAt: new Date().toISOString(),
      actorType: 'system',
      category: 'money',
      action: 'approval.applied_capped',
      entityCode: 'OTM-0995',
      before: { amountVnd: 500_000 },
      after: { appliedVnd: 200_000 },
      reason: 'debt write-off applied up to the open debt (BR-525)',
    });
    renderApp('/audit', 'qa.mgr');
    const row = (await screen.findByText('OTM-0996')).closest('tr')!;
    expect(within(row).getByText(tv('mlog.a_approval_cancelled'))).toBeInTheDocument();
    const old = screen.getByText('OTM-0995').closest('tr')!;
    expect(within(old).getByText(tv('foc.r_debt_write_off'))).toBeInTheDocument();
    expect(within(old).queryByText(/open debt/)).toBeNull();
  });
});
