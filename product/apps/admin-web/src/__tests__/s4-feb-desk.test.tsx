import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

/**
 * Sprint 4 – FE-B (Desk, operations + brand): S4-26 debt on check-out, S4-29 view the settled folio,
 * S4-30 receipt photo with "Báo đã chuyển cọc", S4-48 KB7 strings, S4-49 B1 (`.mono`) and B3 room labels.
 */
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string, args?: Record<string, string | number>) =>
  new RegExp(`^${esc(tv(key, args))}`);
const photo = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], 'bien-nhan.jpg', { type: 'image/jpeg' });
/** Pin the clock (only `Date`) – before the standard check-out time: no late surcharge in the way. */
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};

describe('S4-26 – "Ghi công nợ" on H16 step 3: OWN/MGR only (US-038 AC3, BR-525, A19)', () => {
  afterEach(() => vi.useRealTimers());

  async function toBill(as: string) {
    const r = res('Phạm Huy');
    const { user } = renderApp(`/reservations/${r.id}/check-out`, as);
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    // S4-48: before any fee, the hint names the standard time from BookingRules (not a fixed 12:00).
    expect(
      await screen.findByText(tv('co.late_switch_hint_time', { time: '12:00' })),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    await screen.findByText(new RegExp(`^${esc(tv('bill.total'))}:`));
    return { r, user };
  }

  it('manager: debt needs a due date (not in the past) and a reason, then completes with the balance left', async () => {
    at('11:30');
    const { r, user } = await toBill('qa.mgr');
    const toggle = screen.getByRole('switch', { name: tv('co.debt_toggle') });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Locked with the reason next to the button until both fields are valid.
    const complete = screen.getByRole('button', { name: /^Ghi công nợ .* – hoàn tất$/ });
    expect(complete).toHaveAttribute('aria-disabled', 'true');
    expect(complete).toHaveAccessibleDescription(tv('co.debt_needs'));
    const due = screen.getByLabelText(label('co.debt_due'));
    // R3-Q39 #11 (BR-525 (i) v0.4.0): default business day + 3, earliest business day + 1 (11:30 = calendar day).
    expect(due).toHaveValue(addDays(todayLocal(), 3));
    expect(due).toHaveAttribute('min', addDays(todayLocal(), 1));
    fireEvent.change(due, { target: { value: todayLocal() } });
    expect(await screen.findByText(tv('co.debt_due_min'))).toBeInTheDocument();
    const dueDate = addDays(todayLocal(), 7);
    fireEvent.change(due, { target: { value: dueDate } });
    await user.type(
      screen.getByLabelText(label('co.debt_reason')),
      'Công ty thanh toán cuối tháng',
    );
    expect(complete).not.toHaveAttribute('aria-disabled');

    await user.click(complete);
    const box = await screen.findByRole('alertdialog');
    expect(
      within(box).getByText(new RegExp(`hạn ${esc(dueDate.split('-').reverse().join('/'))}`)),
    ).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: /^Ghi công nợ .* – hoàn tất$/ }));
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    const entry = mockControl.stay.audit.find(
      (a) => a.action === 'reservation.debt_on_checkout' && a.entityCode === r.code,
    );
    expect(entry?.after).toMatchObject({ dueDate });
  });

  it('front desk: no debt option – the balance must be collected (FD → 403 on the server too)', async () => {
    at('11:30');
    await toBill('qa.fd');
    expect(screen.queryByRole('switch', { name: tv('co.debt_toggle') })).not.toBeInTheDocument();
  });
});

describe('S4-29 – "Xem Phiếu thanh toán" for a checked-out booking (US-020 AC2)', () => {
  it('the drawer opens the settled folio (number in mono, VI / VI–EN, print) – read only', async () => {
    const r = res('Hoàng Long');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Hoàng Long' });
    // S4-49 B1: the booking code in the drawer header is a code (JetBrains Mono).
    expect(within(drawer).getByText(r.code)).toHaveClass('mono');
    expect(
      within(drawer).queryByRole('button', { name: tv('drawer.action.check_out') }),
    ).not.toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: tv('co.preview_bill') }));
    const bill = await screen.findByRole('dialog', { name: tv('bill.title') });
    const no = mockControl.stay.folios.get(r.folioId)!.billNo!;
    expect(within(bill).getByText(no)).toHaveClass('mono');
    expect(within(bill).getByRole('button', { name: tv('co.print') })).toBeInTheDocument();
    expect(within(bill).getByRole('button', { name: tv('co.bill_vien') })).toBeInTheDocument();
  });

  it('is not offered before check-out', async () => {
    const r = res('Phạm Huy');
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    expect(
      within(drawer).queryByRole('button', { name: tv('co.preview_bill') }),
    ).not.toBeInTheDocument();
  });
});

describe('S4-30 – CTV "Báo đã chuyển cọc" with the receipt photo (US-086 AC4)', () => {
  it('uploads the photo as deposit_receipt for this booking, then sends its id with the notice', async () => {
    const r = res('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.ctv1');
    const drawer = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await user.click(
      within(drawer).getByRole('button', { name: tv('drawer.action.deposit_notice') }),
    );
    const dlg = await screen.findByRole('dialog', { name: tv('drawer.action.deposit_notice') });
    expect(within(dlg).getByText(tv('rsv.receipt_help'))).toBeInTheDocument();
    await user.upload(within(dlg).getByLabelText(label('rsv.attach_receipt')), photo());
    expect(within(dlg).getByText('bien-nhan.jpg')).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('drawer.action.deposit_notice') }));
    await waitFor(() =>
      expect(mockControl.rsv.notices.some((n) => n.reservationId === r.id)).toBe(true),
    );
    const notice = mockControl.rsv.notices.find((n) => n.reservationId === r.id)!;
    expect(notice.attachmentId).toBeTruthy();
    expect(mockControl.stay.attachments.has(notice.attachmentId!)).toBe(true);
  });

  it('the photo stays optional (API) – the notice goes without it', async () => {
    const r = res('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.ctv1');
    const drawer = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await user.click(
      within(drawer).getByRole('button', { name: tv('drawer.action.deposit_notice') }),
    );
    const dlg = await screen.findByRole('dialog', { name: tv('drawer.action.deposit_notice') });
    await user.click(within(dlg).getByRole('button', { name: tv('drawer.action.deposit_notice') }));
    await waitFor(() =>
      expect(mockControl.rsv.notices.find((n) => n.reservationId === r.id)).toBeTruthy(),
    );
    expect(mockControl.rsv.notices.find((n) => n.reservationId === r.id)!.attachmentId).toBe(
      undefined,
    );
  });
});

describe('S4-49 B3 – staff room label "401 · The Pine" (BR-012, DS 11.3)', () => {
  it('the booking list shows number · name from the room catalogue', async () => {
    renderApp('/reservations', 'qa.fd');
    expect((await screen.findAllByText('401 · The Pine')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('302 · The Ivory').length).toBeGreaterThan(0);
  });
});

describe('0.3.7 add. 1 – BUG-R2-081 and Bill.settledAt', () => {
  afterEach(() => vi.restoreAllMocks());

  it('"Xác nhận cọc" shows what the CTV reported – amount, time, note, who, receipt photo on demand', async () => {
    const r = res('Lê Minh');
    // The CTV reports first (S4-30) …
    const ctv = renderApp(`/reservations/${r.id}`, 'qa.ctv1');
    const d1 = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await ctv.user.click(
      within(d1).getByRole('button', { name: tv('drawer.action.deposit_notice') }),
    );
    const dlg = await screen.findByRole('dialog', { name: tv('drawer.action.deposit_notice') });
    const amount = within(dlg).getByLabelText(label('rsv.amount_sent'));
    await ctv.user.clear(amount);
    await ctv.user.type(amount, '500000');
    await ctv.user.type(within(dlg).getByLabelText(label('stay.note')), 'FT2610 – LE MINH');
    await ctv.user.upload(within(dlg).getByLabelText(label('rsv.attach_receipt')), photo());
    await ctv.user.click(
      within(dlg).getByRole('button', { name: tv('drawer.action.deposit_notice') }),
    );
    await waitFor(() => expect(mockControl.rsv.notices.length).toBe(1));
    ctv.unmount();

    // … then the desk confirms the deposit with the report in front of it.
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:receipt');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d2 = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await user.click(within(d2).getByRole('button', { name: tv('drawer.action.confirm_deposit') }));
    const box = await screen.findByRole('note', { name: undefined });
    expect(within(box).getByText(tv('rsv.notice.heading'))).toBeInTheDocument();
    expect(
      within(box).getByText(
        new RegExp(
          `^${esc(tv('rsv.notice.line', { who: 'Mai', amount: '§', time: '' }).split('§')[0]!)}`,
        ),
      ),
    ).toBeInTheDocument();
    expect(within(box).getByText(new RegExp(esc('500.000')))).toBeInTheDocument();
    expect(
      within(box).getByText(tv('rsv.notice.note', { note: 'FT2610 – LE MINH' })),
    ).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: tv('rsv.notice.photo') }));
    expect(
      await within(box).findByRole('img', { name: tv('rsv.notice.photo_alt', { code: r.code }) }),
    ).toHaveAttribute('src', 'blob:receipt');
  });

  it('a reprinted folio shows when it was settled, not the print time', async () => {
    const r = res('Hoàng Long');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Hoàng Long' });
    await user.click(within(drawer).getByRole('button', { name: tv('co.preview_bill') }));
    const bill = await screen.findByRole('dialog', { name: tv('bill.title') });
    const settled = r.departureDate.split('-').reverse().join('/');
    const issued = within(bill).getByText(
      new RegExp(`^${esc(tv('bill.issued_at', { time: '§' }).split('§')[0]!)}`),
    );
    expect(issued).toHaveTextContent(settled);
    expect(issued).toHaveTextContent('11:00');
  });
});

describe('FB-R2-UXD-FE-S4-17 – receipt upload fails', () => {
  it('says the photo was not sent, keeps amount + photo, and nothing is reported', async () => {
    const r = res('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.ctv1');
    const drawer = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await user.click(
      within(drawer).getByRole('button', { name: tv('drawer.action.deposit_notice') }),
    );
    const dlg = await screen.findByRole('dialog', { name: tv('drawer.action.deposit_notice') });
    await user.upload(within(dlg).getByLabelText(label('rsv.attach_receipt')), photo());
    mockControl.failNext(/\/attachments:POST$/, 500, { code: 'INTERNAL_ERROR' });
    await user.click(within(dlg).getByRole('button', { name: tv('drawer.action.deposit_notice') }));
    expect(await within(dlg).findByText(tv('rsv.receipt_upload_failed'))).toBeInTheDocument();
    expect(within(dlg).getByText('bien-nhan.jpg')).toBeInTheDocument();
    expect(mockControl.rsv.notices).toHaveLength(0);
  });
});
