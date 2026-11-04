// v1.0.4 (FE-B) – H12 "Giữ chỗ" dialog: BUG-R2-216 (deposit amount and transfer content printed twice after the hold:
// summary + VietQR card) and BUG-R2-219 (same-day arrival still shows the 12/24/48 h picker and a past deadline).
// QA v1.0.4 TC-V104-HD-01 / HD-02. Copy comes from the string files through `tv`.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];

/** "Nội dung chuyển khoản:" – the part of `pay.qr_note` before the booking code. */
const refStem = tv('pay.qr_note', { ref: '§' }).split('§')[0]!.trim();
const count = (el: HTMLElement, s: string) => el.textContent!.split(s).length - 1;

async function openHold(user: User, guestQuery: string, guestName: RegExp) {
  const item = await waitFor(() => {
    const li = screen
      .getAllByRole('listitem')
      .find((x) => x.querySelector('.roomno')?.textContent === '203');
    if (!li) throw new Error('room 203 not listed');
    return li;
  });
  await user.click(within(item).getByRole('button', { name: tv('sale.quote_title') }));
  const dlg = await screen.findByRole('dialog', { name: tv('sale.quote_title') });
  await within(dlg).findByText('Tổng tiền đơn');
  await user.type(
    within(dlg).getByRole('combobox', { name: tv('booking.field.guest') }),
    guestQuery,
  );
  await user.click(await screen.findByRole('option', { name: guestName }));
  await user.click(within(dlg).getByRole('button', { name: tv('sale.save_quote') }));
  const send = await screen.findByRole('dialog', { name: /BG-000\d+/ });
  await user.click(within(send).getByRole('button', { name: tv('sale.to_hold') }));
  return screen.findByRole('dialog', { name: tv('sale.hold_title') });
}

async function createHold(user: User, hold: HTMLElement) {
  await user.click(within(hold).getByRole('button', { name: tv('sale.create_hold') }));
  await within(hold).findByText(/Đã giữ căn 203 – đơn OTM-0\d+/);
  return mockControl.rsv.reservations.at(-1)!;
}

describe('BUG-R2-216 – after the hold, the deposit and the transfer content are printed once', () => {
  it('sale: the VietQR card alone says the amount and the content (no summary above it)', async () => {
    pinDaytime();
    const { user } = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    const hold = await openHold(user, 'Hoàng Gia', /Hoàng Gia Bảo/);
    const created = await createHold(user, hold);
    const ref = created.code.replace('-', '');
    await within(hold).findByRole('img', { name: new RegExp(`nội dung ${ref}$`) });
    expect(hold.querySelectorAll('.price-big')).toHaveLength(1);
    expect(count(hold, refStem)).toBe(1);
    expect(within(hold).queryByText(tv('sale.deposit_due_short'))).toBeNull();
    expect(within(hold).getByRole('button', { name: tv('pay.copy_ref') })).toBeInTheDocument();
  });

  it('collaborator (no QR): the summary says the amount and the content, once', async () => {
    pinDaytime();
    const { user } = renderApp('/quotes', 'qa.ctv1');
    await screen.findByText(/căn trống/);
    const hold = await openHold(user, 'Lý Minh', /Lý Minh Châu/);
    await createHold(user, hold);
    expect(within(hold).getByText(tv('sale.deposit_due_short'))).toBeInTheDocument();
    expect(hold.querySelectorAll('.price-big')).toHaveLength(1);
    expect(count(hold, refStem)).toBe(1);
    expect(within(hold).getByText(tv('sale.qr_after_ctv'))).toBeInTheDocument();
  });

  it('sale, no receiving account (no QR): the summary stays, once, with the reason', async () => {
    pinDaytime();
    mockControl.stay.paymentNotConfigured = true;
    const { user } = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    const hold = await openHold(user, 'Hoàng Gia', /Hoàng Gia Bảo/);
    await createHold(user, hold);
    expect(await within(hold).findByText(tv('error.PAYMENT_NOT_CONFIGURED'))).toBeInTheDocument();
    expect(hold.querySelectorAll('.price-big')).toHaveLength(1);
    expect(count(hold, refStem)).toBe(1);
  });
});

describe('BUG-R2-219 – same-day arrival: only the hand-over, no hold length and no deadline', () => {
  it('no 12/24/48 h picker, no "Hết hạn … tự hủy", no "QR after the hold"; the button stays locked', async () => {
    pinDaytime();
    const { user } = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    fireEvent.change(screen.getByLabelText(tv('sale.arrival')), {
      target: { value: todayLocal() },
    });
    await user.click(screen.getByRole('button', { name: tv('shell.search_label') }));
    await waitFor(() =>
      expect(screen.getByText(/căn trống/).textContent).toMatch(
        new RegExp(todayLocal().slice(8, 10)),
      ),
    );
    const hold = await openHold(user, 'Hoàng Gia', /Hoàng Gia Bảo/);
    expect(within(hold).getByText(tv('error.HOLD_NOT_ALLOWED_TODAY'))).toBeInTheDocument();
    expect(within(hold).getByText(tv('sale.today_handoff'))).toBeInTheDocument();
    expect(within(hold).queryByText(tv('sale.hold_for'))).toBeNull();
    expect(within(hold).queryByRole('button', { name: '24 h' })).toBeNull();
    const untilStem = tv('sale.hold_until', { time: '§' }).split('§')[0]!.trim();
    expect(hold.textContent).not.toContain(untilStem);
    expect(within(hold).queryByText(tv('sale.qr_after'))).toBeNull();
    expect(within(hold).queryByText(tv('sale.deposit_due_short'))).toBeNull();
    expect(within(hold).getByRole('button', { name: tv('sale.create_hold') })).toBeDisabled();
  });
});
