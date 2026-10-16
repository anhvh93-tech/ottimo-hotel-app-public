import { isApiError } from '@ottimo/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { api } from '../app/api';
import { mockControl } from '../mocks/handlers';
import { PROPERTY_ID, MOCK_PASSWORD } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const refundTab = async (user: ReturnType<typeof renderApp>['user']) => {
  await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
};
const cardOf = async (code: string, amount: string) =>
  (await screen.findByText(new RegExp(`^${code} · ${amount}`))).closest('li')!;
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const photo = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], 'bien-nhan.jpg', { type: 'image/jpeg' });

describe('Hoàn tiền tách quyền theo phương thức (PO 16/10 – A47a tiền mặt FD+, A47 chuyển khoản MGR+)', () => {
  it('FD pays a cash refund created by someone else, with the signed receipt photo', async () => {
    const { user } = renderApp('/audit', 'qa.fd');
    await refundTab(user);
    const nga = res('Trần Thu Nga');
    const card = await cardOf(nga.code, '500.000');
    await user.click(within(card).getByRole('button', { name: tv('refund.execute_cash') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_cash') });
    // Receipt photo is required for cash (EP03-05 2.6.3).
    const submit = within(dlg).getByRole('button', { name: tv('refund.execute_cash') });
    expect(submit).toBeDisabled();
    await user.upload(
      within(dlg).getByLabelText(new RegExp(tv('refund.proof').replace(/[()]/g, '.'))),
      photo(),
    );
    await user.click(submit);
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: tv('refund.execute_cash') }),
      ).not.toBeInTheDocument(),
    );
    const paid = mockControl.stay.payments.find(
      (p) => p.type === 'refund' && p.folioId === nga.folioId,
    )!;
    expect(paid).toMatchObject({
      method: 'cash',
      amountVnd: 500_000,
      reconciliation: 'not_required',
    });
    expect(paid.attachmentId).toBeTruthy();
  });

  it('FD: own cash refund → 403 SELF_APPROVAL_FORBIDDEN; bank transfer → no pay button, waits for the manager', async () => {
    const { user } = renderApp('/audit', 'qa.fd');
    await refundTab(user);
    const kim = res('Kim Seo-yeon');
    const transfer = await cardOf(kim.code, '1.200.000');
    expect(
      within(transfer).queryByRole('button', { name: tv('refund.execute_transfer') }),
    ).not.toBeInTheDocument();
    expect(within(transfer).getByText(tv('refund.transfer_waits_manager'))).toBeInTheDocument();

    const own = await cardOf(kim.code, '200.000');
    await user.click(within(own).getByRole('button', { name: tv('refund.execute_cash') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_cash') });
    await user.upload(
      within(dlg).getByLabelText(new RegExp(tv('refund.proof').replace(/[()]/g, '.'))),
      photo(),
    );
    await user.click(within(dlg).getByRole('button', { name: tv('refund.execute_cash') }));
    expect(await within(dlg).findByText(tv('refund.self_execute_forbidden'))).toBeInTheDocument();
    expect(mockControl.stay.payments.some((p) => p.type === 'refund')).toBe(false);

    // The API refuses the transfer operation to FD as well (server-side check, not just a hidden button).
    const err = await api
      .executeRefund(
        { propertyId: PROPERTY_ID, approvalId: mockControl.stay.approvals[1]!.id },
        { amountVnd: 1_200_000, paidAt: new Date().toISOString() },
        'k-1',
      )
      .catch((e: unknown) => e);
    expect(isApiError(err) && err.code).toBe('FORBIDDEN_ACTION');
  });

  it('MGR pays the bank transfer: full account only after step-up, bank reference + proof', async () => {
    const { user } = renderApp('/audit', 'qa.mgr');
    await refundTab(user);
    const kim = res('Kim Seo-yeon');
    const card = await cardOf(kim.code, '1.200.000');
    expect(within(card).getByText(/••6777/)).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: tv('refund.execute_transfer') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_transfer') });
    await user.click(within(dlg).getByRole('button', { name: tv('refund.show_account') }));
    const step = await screen.findByRole('dialog', { name: tv('ci.stepup_title') });
    await user.type(within(step).getByLabelText(/^Mật khẩu của bạn/), MOCK_PASSWORD);
    await user.click(within(step).getByRole('button', { name: tv('ci.stepup_submit') }));
    expect(await within(dlg).findByText('19036666777')).toBeInTheDocument();

    await user.type(
      within(dlg).getByLabelText(new RegExp(tv('refund.bank_reference').replace(/[()]/g, '.'))),
      'FT26999',
    );
    await user.upload(
      within(dlg).getByLabelText(new RegExp(tv('refund.proof').replace(/[()]/g, '.'))),
      photo(),
    );
    await user.click(within(dlg).getByRole('button', { name: tv('refund.execute_transfer') }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: tv('refund.execute_transfer') }),
      ).not.toBeInTheDocument(),
    );
    const paid = mockControl.stay.payments.find(
      (p) => p.type === 'refund' && p.folioId === kim.folioId,
    )!;
    // Transfers are reconciled later by someone other than the payer (A46).
    expect(paid).toMatchObject({
      method: 'bank_transfer',
      reconciliation: 'pending',
      note: 'FT26999',
    });
  });
});

describe('Xác nhận tiền mặt sale nộp quầy (A46a) + đối soát (A46)', () => {
  it('FD confirms the cash a sale handed in; MGR sees "Đã khớp sao kê" for transfers', async () => {
    const { user } = renderApp('/audit', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.recon_title') }));
    const target = (
      await screen.findByText(tv('pay.recorded_by_staff', { role: tv('role.sales_staff') }))
    ).closest('tr')!;
    // FD has no statement buttons (MGR+ only).
    expect(screen.queryByRole('button', { name: tv('co.recon_ok') })).not.toBeInTheDocument();
    await user.click(within(target).getByRole('button', { name: tv('pay.confirm_cash_handover') }));
    await waitFor(() =>
      expect(mockControl.stay.payments.find((p) => p.code === 'PT-0166')!.reconciliation).toBe(
        'reconciled',
      ),
    );
  });

  it('the recorder cannot confirm their own cash (403 SELF_RECONCILE_FORBIDDEN, even the owner)', async () => {
    const own = mockControl.stay.payments.find((p) => p.code === 'PT-0166')!;
    own.recordedByUserId = mockControl.db.users.find((u) => u.username === 'qa.fd')!.id;
    const { user } = renderApp('/audit', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.recon_title') }));
    await user.click(await screen.findByRole('button', { name: tv('pay.confirm_cash_handover') }));
    expect(await screen.findByText(tv('error.SELF_RECONCILE_FORBIDDEN'))).toBeInTheDocument();
    expect(own.reconciliation).toBe('pending');
  });

  it('approvals: approve a FOC with the login password; a wrong password is a field error', async () => {
    const { user } = renderApp('/approvals', 'qa.fdl');
    const kim = res('Kim Seo-yeon');
    const card = (
      await screen.findByText(
        (_, el) =>
          el?.tagName === 'B' && el.textContent === `${kim.code} · ${tv('foc.kind_foc')} · 75.000`,
      )
    ).closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('approval.approve') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('approval.approve_title', {
        amount: tv('common.currency_vnd', { amount: '75.000' }),
        code: kim.code,
      }),
    });
    await user.type(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/), 'wrong-pass');
    await user.click(within(dlg).getByRole('button', { name: tv('approval.approve') }));
    expect(
      await within(dlg).findByText(tv('field_error.current_password_wrong')),
    ).toBeInTheDocument();
    await user.clear(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/));
    await user.type(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('approval.approve') }));
    await waitFor(() => expect(mockControl.stay.approvals[3]!.status).toBe('approved'));
  });
});
