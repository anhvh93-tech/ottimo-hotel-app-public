import { formatNumber } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/**
 * FE-B – ARC 0.3.7 add. 4 (16.6, DOM (f)): H11 confirms a deposit VietQR larger than the deposit still
 * missing NOW only with a note. Known before the press (`Payment.amountDueNowVnd` of the pending QR) or
 * told by the server (422 `REASON_REQUIRED` on `note`, `max`); the excess becomes the guest's credit.
 */
const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: formatNumber('vi', n) });
const qrOf = (folioId: string) =>
  mockControl.stay.payments.find((p) => p.folioId === folioId && p.method === 'vietqr')!;

const confirms: Array<Record<string, unknown>> = [];
const onStart = ({ request }: { request: Request }) => {
  if (request.method === 'POST' && /\/actions\/confirm-received$/.test(request.url))
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => confirms.push(b));
};
afterEach(() => {
  server.events.removeListener('request:start', onStart);
});

async function openDeposit(user: ReturnType<typeof renderApp>['user']) {
  const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
  await user.click(within(d).getByRole('button', { name: tv('rsv.deposit_submit') }));
  return screen.findByRole('dialog', {
    name: tv('rsv.deposit_title', { code: rsvOf('Lê Minh').code }),
  });
}

describe('DOM (f) – H11 deposit QR above the deposit still missing needs a note', () => {
  it('server says so (422 REASON_REQUIRED, max): warning + required note, then confirmed with it', async () => {
    confirms.length = 0;
    server.events.on('request:start', onStart);
    const r = rsvOf('Lê Minh');
    const need = r.depositRequiredVnd!;
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openDeposit(user);
    await user.click(await within(dlg).findByRole('button', { name: /^Tạo VietQR/ }));
    await within(dlg).findByRole('img', { name: /nội dung OTM0146$/ });
    // Meanwhile 100.000 of the deposit was paid another way: the QR now asks more than is missing.
    r.depositPaidVnd += 100_000;
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(
      await within(dlg).findByText(
        tv('pay.qr_over_note', { amount: money(need), max: money(need - 100_000) }),
      ),
    ).toBeInTheDocument();
    const note = within(dlg).getByRole('textbox', { name: new RegExp(tv('dep.qr_over_reason')) });
    expect(note).toBeRequired();
    expect(qrOf(r.folioId).status).toBe('pending');
    // Pressing again without a note: said at the field, nothing sent.
    const sent = confirms.length;
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(within(dlg).getByText(tv('field_error.reason_required'))).toBeInTheDocument();
    expect(confirms).toHaveLength(sent);
    await user.type(note, 'Khách chuyển đủ theo mã cũ');
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(
      await screen.findByText(tv('rsv.toast.confirmed', { code: r.code })),
    ).toBeInTheDocument();
    expect(confirms.at(-1)).toEqual({ note: 'Khách chuyển đủ theo mã cũ' });
    expect(qrOf(r.folioId)).toMatchObject({
      status: 'succeeded',
      note: 'Khách chuyển đủ theo mã cũ',
    });
    expect(rsvOf('Lê Minh').status).toBe('confirmed');
  });

  it('known before the press (pending QR amountDueNowVnd): warning at once, no call until the note is there', async () => {
    const r = rsvOf('Lê Minh');
    const need = r.depositRequiredVnd!;
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    let dlg = await openDeposit(user);
    await user.click(await within(dlg).findByRole('button', { name: /^Tạo VietQR/ }));
    await within(dlg).findByRole('img', { name: /nội dung OTM0146$/ });
    await user.click(within(dlg).getByRole('button', { name: tv('common.cancel') }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Xác nhận cọc/ })).toBeNull());
    r.depositPaidVnd += 100_000;
    confirms.length = 0;
    server.events.on('request:start', onStart);
    dlg = await openDeposit(user);
    expect(await within(dlg).findByText(/chờ khách chuyển/)).toBeInTheDocument();
    // The guest sent the whole QR amount.
    const amount = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(amount);
    await user.type(amount, String(need));
    expect(
      await within(dlg).findByText(
        tv('pay.qr_over_note', { amount: money(need), max: money(need - 100_000) }),
      ),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('field_error.reason_required'))).toBeNull();
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(within(dlg).getByText(tv('field_error.reason_required'))).toBeInTheDocument();
    expect(confirms).toHaveLength(0);
    await user.type(
      within(dlg).getByRole('textbox', { name: new RegExp(tv('dep.qr_over_reason')) }),
      'Đã trả 100.000 tiền mặt trước',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(
      await screen.findByText(tv('rsv.toast.confirmed', { code: r.code })),
    ).toBeInTheDocument();
    expect(confirms).toEqual([{ note: 'Đã trả 100.000 tiền mặt trước' }]);
  });

  it('QR not above what is missing: no warning, no note box, confirmed with no note', async () => {
    confirms.length = 0;
    server.events.on('request:start', onStart);
    const r = rsvOf('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openDeposit(user);
    await user.click(await within(dlg).findByRole('button', { name: /^Tạo VietQR/ }));
    await within(dlg).findByRole('img', { name: /nội dung OTM0146$/ });
    expect(
      within(dlg).queryByRole('textbox', { name: new RegExp(tv('dep.qr_over_reason')) }),
    ).toBeNull();
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(
      await screen.findByText(tv('rsv.toast.confirmed', { code: r.code })),
    ).toBeInTheDocument();
    expect(confirms).toEqual([{}]);
  });
});
