import { formatNumber } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { api } from '../app/api';
import { mockControl } from '../mocks/handlers';
import { PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

/**
 * V5-18 (FB-R4-SEC-FE-HOLDS-03, OpenAPI 0.3.13 1.6, C0313-13): when OWN/MGR accept a short deposit, the deposit box
 * says how much of the money received is still awaiting reconciliation – `Reservation.depositUnverifiedVnd`
 * (min(deposit held, Σ deposits `succeeded` still `reconciliation = pending`), FD+ only). Nothing said at 0.
 */
const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: formatNumber('vi', n) });
const hint = (n: number) => tv('deposit.accept_shortfall_unverified', { amount: money(n) });

function deposit(
  folioId: string,
  code: string,
  n: number,
  method: string,
  reconciliation: string,
  id: string,
) {
  mockControl.stay.payments.push({
    id,
    code: `PT-${id.slice(-3)}`,
    folioId,
    reservationCode: code,
    type: 'deposit',
    method,
    amountVnd: n,
    status: 'succeeded',
    reconciliation,
    receivedAt: new Date().toISOString(),
    recordedBy: 'Hạnh',
    version: 1,
  } as never);
}

async function openDeposit(as: string) {
  const r = rsvOf('Lê Minh');
  const view = renderApp(`/reservations/${r.id}`, as);
  const drawer = await screen.findByRole('dialog', { name: 'Lê Minh' });
  await view.user.click(
    await within(drawer).findByRole('button', { name: tv('drawer.action.confirm_deposit') }),
  );
  const dlg = await screen.findByRole('dialog', {
    name: tv('rsv.deposit_title', { code: r.code }),
  });
  return { ...view, r, dlg };
}

describe('V5-18 – the unreconciled part of the deposit when a manager accepts the shortfall', () => {
  it('a transfer still waiting for the statement and a reconciled cash deposit: only the transfer is named, once the box is ticked', async () => {
    const r = rsvOf('Lê Minh');
    r.hold!.expiresAt = new Date(Date.now() - 30 * 60_000).toISOString();
    r.depositPaidVnd = 300_000;
    deposit(
      r.folioId,
      r.code,
      200_000,
      'bank_transfer',
      'pending',
      '00000000-0000-4000-8000-0000000c5181',
    );
    deposit(
      r.folioId,
      r.code,
      100_000,
      'cash',
      'not_required',
      '00000000-0000-4000-8000-0000000c5182',
    );
    const { user, dlg } = await openDeposit('qa.mgr');
    await user.clear(within(dlg).getByLabelText(/Số tiền đã nhận/));
    const box = within(dlg).getByRole('checkbox', { name: tv('deposit.accept_shortfall') });
    expect(within(dlg).queryByText(hint(200_000))).toBeNull();
    await user.click(box);
    expect(within(dlg).getByText(hint(200_000))).toBeInTheDocument();
    await user.click(box);
    expect(within(dlg).queryByText(hint(200_000))).toBeNull();
  });

  it('everything reconciled (0) → nothing said', async () => {
    const r = rsvOf('Lê Minh');
    r.depositPaidVnd = 300_000;
    deposit(
      r.folioId,
      r.code,
      300_000,
      'bank_transfer',
      'reconciled',
      '00000000-0000-4000-8000-0000000c5183',
    );
    const { user, dlg } = await openDeposit('qa.mgr');
    await user.clear(within(dlg).getByLabelText(/Số tiền đã nhận/));
    await user.click(within(dlg).getByRole('checkbox', { name: tv('deposit.accept_shortfall') }));
    expect(within(dlg).queryByText(/còn chờ đối soát/)).toBeNull();
  });

  it('a part payment by transfer typed in this box counts after it is recorded (fresh read)', async () => {
    const r = rsvOf('Lê Minh');
    r.depositPaidVnd = 100_000; // cash, reconciliation not required
    const { user, dlg } = await openDeposit('qa.mgr');
    await user.selectOptions(within(dlg).getByLabelText(tv('pay.method')), 'bank_transfer');
    const amount = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(amount);
    await user.type(amount, '200000');
    await user.click(
      within(dlg).getByRole('button', { name: tv('rsv.record_partial', { amount: '200.000' }) }),
    );
    // A-13: still a hold – the box stays open with the new balance
    await waitFor(() => expect(r.depositPaidVnd).toBe(300_000));
    await user.clear(within(dlg).getByLabelText(/Số tiền đã nhận/));
    await user.click(
      await within(dlg).findByRole('checkbox', { name: tv('deposit.accept_shortfall') }),
    );
    expect(await within(dlg).findByText(hint(200_000))).toBeInTheDocument();
  });

  it('server scope: the field is for FD+ only (a sale never receives it)', async () => {
    const r = rsvOf('Lê Minh');
    r.depositPaidVnd = 300_000;
    deposit(
      r.folioId,
      r.code,
      300_000,
      'vietqr',
      'pending',
      '00000000-0000-4000-8000-0000000c5184',
    );
    const sal = mockControl.db.users.find((u) => u.username === 'qa.sal')!;
    r.createdBy = sal.id;
    const read = async (as: string) => {
      mockControl.signInAs(as);
      return (await api.getReservation({ propertyId: PROPERTY_ID, reservationId: r.id }))
        .data as unknown as Record<string, unknown>;
    };
    expect((await read('qa.fd')).depositUnverifiedVnd).toBe(300_000);
    expect(await read('qa.sal')).not.toHaveProperty('depositUnverifiedVnd');
  });
});
