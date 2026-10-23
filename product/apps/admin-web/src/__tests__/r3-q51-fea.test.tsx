import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD } from '../mocks/seed';
import { totpNow } from '../mocks/totp';
import { napasName } from '../pages/ReceivingAccount';
import { renderApp, tv } from '../test/render';

/**
 * R3-Q51 – "Tài khoản nhận chuyển khoản (VietQR)" (SEC mục C Q51-1…Q51-8, OpenAPI 0.3.8 R3-Q51) on the
 * MSW mock written to the contract (BE-B server not there yet).
 */
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
const NEW_NO = '0123456789123'; // test value
const D = todayLocal();

afterEach(() => vi.useRealTimers());

function capture(re: RegExp) {
  const bodies: unknown[] = [];
  const on = ({ request }: { request: Request }) => {
    if (re.test(new URL(request.url).pathname) && request.method !== 'GET')
      void request
        .clone()
        .json()
        .then((b) => bodies.push(b));
  };
  server.events.on('request:start', on);
  return { bodies, stop: () => server.events.removeListener('request:start', on) };
}

async function openForm(user: ReturnType<typeof renderApp>['user']) {
  const section = await screen.findByRole('region', { name: tv('rcv.title') });
  await user.click(within(section).getByRole('button', { name: tv('rcv.change') }));
  return screen.findByRole('dialog', { name: tv('rcv.form_title') });
}

async function fill(user: ReturnType<typeof renderApp>['user'], dlg: HTMLElement) {
  await user.type(within(dlg).getByLabelText(label('rcv.bank_bin')), '970436');
  await user.type(within(dlg).getByLabelText(label('rcv.account_no')), NEW_NO);
  await user.type(within(dlg).getByLabelText(label('rcv.account_no_repeat')), NEW_NO);
  await user.type(within(dlg).getByLabelText(label('rcv.account_name')), 'Công ty Ottimo Đà Lạt');
  await user.type(within(dlg).getByLabelText(label('rcv.reason')), 'Đổi sang tài khoản công ty');
}

describe('R3-Q51 receiving account', () => {
  it('owner sees bank name + •••• 1234 only; managers and leads never get the block (Q51-1, Q51-2)', async () => {
    renderApp('/settings/parameters', 'qa.owner');
    const section = await screen.findByRole('region', { name: tv('rcv.title') });
    expect(await within(section).findByText('Techcombank')).toBeInTheDocument();
    expect(within(section).getByText('•••• 7777')).toHaveClass('mono');
    expect(document.body.textContent).not.toContain(mockControl.db.receiving[0]!.accountNo);
  });

  it.each(['qa.mgr', 'qa.fdl'])('%s: no block, and the API answers 403', async (who) => {
    renderApp('/settings/parameters', who);
    await screen.findByRole('tablist');
    expect(screen.queryByRole('region', { name: tv('rcv.title') })).not.toBeInTheDocument();
    mockControl.signInAs(who);
    const res = await fetch(
      `http://localhost/v1/properties/${mockControl.db.users[0]!.roles[0]!.propertyId}/parameters/payment_receiving_account`,
    );
    expect(res.status).toBe(403);
  });

  it('typed twice, NAPAS name, review with •••• last 4, S2 (password) → scheduled from tomorrow; no full number shown or stored', async () => {
    const cap = capture(/parameters\/payment_receiving_account$/);
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const dlg = await openForm(user);
    // Q51-3: never pre-filled.
    expect(within(dlg).getByLabelText(label('rcv.account_no'))).toHaveValue('');
    expect(within(dlg).getByLabelText(label('rcv.account_no'))).toHaveAttribute(
      'autocomplete',
      'off',
    );
    const from = within(dlg).getByLabelText(label('config.effective_from'));
    expect(from).toHaveValue(addDays(D, 1));
    expect(from).toHaveAttribute('min', addDays(D, 1));
    await fill(user, dlg);
    expect(within(dlg).getByLabelText(label('rcv.account_name'))).toHaveValue(
      'CONG TY OTTIMO DA LAT',
    );
    expect(
      within(dlg).getByText(tv('rcv.bank_found', { bank: 'Vietcombank' })),
    ).toBeInTheDocument();
    // Mismatch blocks.
    await user.type(within(dlg).getByLabelText(label('rcv.account_no_repeat')), '9');
    await user.click(within(dlg).getByRole('button', { name: tv('rcv.review') }));
    expect(within(dlg).getByText(tv('rcv.account_no_mismatch'))).toBeInTheDocument();
    await user.type(within(dlg).getByLabelText(label('rcv.account_no_repeat')), '{Backspace}');
    await user.click(within(dlg).getByRole('button', { name: tv('rcv.review') }));

    const review = await screen.findByRole('dialog', { name: tv('rcv.review_title') });
    expect(within(review).getByText('•••• 9123')).toBeInTheDocument();
    expect(review.textContent).not.toContain(NEW_NO);
    await user.click(within(review).getByRole('button', { name: tv('rcv.save') }));
    const s2 = await screen.findByRole('dialog', { name: tv('rcv.save') });
    expect(within(s2).getByText(tv('reauth.s2_help_password'))).toBeInTheDocument();
    await user.type(within(s2).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.click(within(s2).getByRole('button', { name: tv('rcv.save') }));

    const section = screen.getByRole('region', { name: tv('rcv.title') });
    expect(await within(section).findByText(tv('rcv.scheduled'))).toBeInTheDocument();
    expect(within(section).getByText('Vietcombank')).toBeInTheDocument();
    cap.stop();
    expect(cap.bodies[0]).toMatchObject({
      value: { bankBin: '970436', accountNo: NEW_NO, accountName: 'CONG TY OTTIMO DA LAT' },
      effectiveFrom: addDays(D, 1),
      reauth: { authMethod: 'password', secret: MOCK_PASSWORD },
    });
    // Nothing kept: page text, Web Storage, mock audit.
    expect(document.body.textContent).not.toContain(NEW_NO);
    const dump = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(dump).not.toContain(NEW_NO);
    expect(JSON.stringify(mockControl.db.receivingAudit)).not.toContain(NEW_NO);
    // Re-opening starts empty (Q51-3).
    const again = await openForm(user);
    expect(within(again).getByLabelText(label('rcv.account_no'))).toHaveValue('');
  });

  it('owner with 2FA: wrong code → one sentence, nothing saved; right code → saved', async () => {
    const { secret } = mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const dlg = await openForm(user);
    await fill(user, dlg);
    await user.click(within(dlg).getByRole('button', { name: tv('rcv.review') }));
    await user.click(
      within(await screen.findByRole('dialog', { name: tv('rcv.review_title') })).getByRole(
        'button',
        { name: tv('rcv.save') },
      ),
    );
    const s2 = await screen.findByRole('dialog', { name: tv('rcv.save') });
    await user.type(within(s2).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.type(within(s2).getByLabelText(label('auth.code_label.totp')), '000001');
    await user.click(within(s2).getByRole('button', { name: tv('rcv.save') }));
    expect(await within(s2).findByText(tv('reauth.s2_failed'))).toBeInTheDocument();
    expect(mockControl.db.receiving).toHaveLength(1);
    await user.type(within(s2).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.type(
      within(s2).getByLabelText(label('auth.code_label.totp')),
      await totpNow(secret),
    );
    await user.click(within(s2).getByRole('button', { name: tv('rcv.save') }));
    await waitFor(() => expect(mockControl.db.receiving).toHaveLength(2));
  });

  it('effective today is refused on the client; the server says EFFECTIVE_FROM_TOMORROW too', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const dlg = await openForm(user);
    await fill(user, dlg);
    const from = within(dlg).getByLabelText(label('config.effective_from'));
    await user.clear(from);
    await user.type(from, D);
    await user.click(within(dlg).getByRole('button', { name: tv('rcv.review') }));
    expect(
      within(dlg).getByText(
        tv('rcv.effective_min', { date: addDays(D, 1).split('-').reverse().join('/') }),
      ),
    ).toBeInTheDocument();
    mockControl.signInAs('qa.owner');
    const res = await fetch(
      `http://localhost/v1/properties/${mockControl.db.users[0]!.roles[0]!.propertyId}/parameters/payment_receiving_account`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': mockControl.db.csrf },
        body: JSON.stringify({
          value: { bankBin: '970436', accountNo: NEW_NO, accountName: 'A' },
          effectiveFrom: D,
          reason: 'abc',
          reauth: { authMethod: 'password', secret: MOCK_PASSWORD },
        }),
      },
    );
    expect((await res.json()).errors[0].code).toBe('EFFECTIVE_FROM_TOMORROW');
  });

  it('02:40 (business day D-1): earliest = D, accepted', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${D}T02:40:00+07:00`));
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const dlg = await openForm(user);
    const from = within(dlg).getByLabelText(label('config.effective_from'));
    await waitFor(() => expect(from).toHaveAttribute('min', D));
    expect(from).toHaveValue(D);
  });

  it('cancel a scheduled row: reason + S2, the row goes, the one in use stays', async () => {
    mockControl.db.receiving.push({
      bankBin: '970418',
      accountNo: '5550001234',
      accountName: 'OTTIMO SCHEDULED',
      effectiveFrom: addDays(D, 5),
      changedBy: 'Chủ đầu tư',
      changedAt: new Date().toISOString(),
      reason: 'test',
    });
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const section = await screen.findByRole('region', { name: tv('rcv.title') });
    await user.click(
      await within(section).findByRole('button', {
        name: new RegExp(`^${esc(tv('rcv.cancel_scheduled'))}`),
      }),
    );
    const dlg = await screen.findByRole('dialog', { name: tv('rcv.cancel_title') });
    expect(within(dlg).getByText('•••• 1234')).toBeInTheDocument();
    await user.type(within(dlg).getByLabelText(label('rcv.reason')), 'Nhầm ngân hàng');
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('rcv.cancel_scheduled') }));
    expect(await screen.findByText(tv('rcv.cancelled'))).toBeInTheDocument();
    expect(mockControl.db.receiving).toHaveLength(1);
    expect(mockControl.db.receiving[0]!.accountName).toBe('OTTIMO TEST');
  });

  it('napasName strips Vietnamese marks and Đ, uppercases', () => {
    expect(napasName('nguyễn  thị đào')).toBe('NGUYEN THI DAO');
  });
});
