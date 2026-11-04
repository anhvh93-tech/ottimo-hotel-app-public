// v1.0.4 P4-30 (FE-A): BUG-R4-020 "Khác…" + Đặt lại xác thực 2 bước, BUG-R4-023 email column, BUG-R4-024 S2
// sentence without a code field, UXD EM-07 regression. Test addresses only: example.test.
// Keys of plan-v1.0.4 3.1 may still be missing before UXD strings round 1: `tv` then returns the key itself, so the
// assertions hold before and after P4-01.
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD } from '../mocks/seed';
import { EmailText } from '../pages/UsersPage';
import { renderApp, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
const userOf = (name: string) => mockControl.db.users.find((u) => u.username === name)!;
type UserEv = ReturnType<typeof renderApp>['user'];

/** The list mock passes extra fields through; `mfaEnabled` is what `listUsers` carries on the server (0.3.8). */
function markMfa(username: string) {
  (userOf(username) as unknown as { mfaEnabled: boolean }).mfaEnabled = true;
}

async function openMore(user: UserEv, name: string) {
  await user.click(await screen.findByRole('button', { name: `${tv('users.more')}: ${name}` }));
  return screen.findByRole('menu', { name: `${tv('users.more')}: ${name}` });
}

let stops: Array<() => void> = [];
afterEach(() => {
  stops.forEach((s) => s());
  stops = [];
});

/** Captures `resetUser2fa` calls and answers 204 (the shared mock has no handler for it – plan 4.1). */
function mockReset2fa(answer?: () => Response) {
  const sent: Array<{ path: string; key: string | null; body: unknown }> = [];
  server.use(
    http.post('*/v1/users/:userId/2fa/actions/reset', async ({ request }) => {
      sent.push({
        path: new URL(request.url).pathname,
        key: request.headers.get('idempotency-key'),
        body: await request.json(),
      });
      return answer ? answer() : new HttpResponse(null, { status: 204 });
    }),
  );
  return sent;
}

describe('BUG-R4-020 – Người dùng & vai: "Khác…" menu', () => {
  it('each other person has "Sửa vai" + "Khác…"; the menu holds reset password and lock; no row-level reset buttons', async () => {
    renderApp('/settings/users', 'qa.owner');
    const row = (await screen.findByText('qa.fd')).closest('tr')!;
    expect(
      within(row).getByRole('button', { name: `${tv('users.edit_roles')}: Hạnh` }),
    ).toBeVisible();
    expect(within(row).queryByRole('button', { name: tv('users.reset_pw') })).toBeNull();
    expect(within(row).queryByRole('button', { name: tv('users.lock') })).toBeNull();
    // The page names the third action too (hifi 07 `users.more_help`).
    expect(screen.getByText(tv('users.more_help'))).toBeInTheDocument();
    // Never on one's own row.
    const own = screen.getByText('qa.owner').closest('tr')!;
    expect(
      within(own).queryByRole('button', { name: new RegExp(esc(tv('users.more'))) }),
    ).toBeNull();
  });

  it('"Đặt lại xác thực 2 bước" only for a person with 2FA on', async () => {
    markMfa('qa.fd');
    const { user } = renderApp('/settings/users', 'qa.owner');
    let menu = await openMore(user, 'Hạnh');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((m) => m.textContent),
    ).toEqual([tv('users.reset_pw'), tv('users.lock'), tv('users.reset_2fa')]);
    await user.keyboard('{Escape}');
    menu = await openMore(user, userOf('qa.sal').displayName);
    expect(within(menu).queryByRole('menuitem', { name: tv('users.reset_2fa') })).toBeNull();
  });

  it('keyboard: first item focused on open, ↑/↓ wrap, Esc closes and gives focus back to the button', async () => {
    markMfa('qa.fd');
    const { user } = renderApp('/settings/users', 'qa.owner');
    const menu = await openMore(user, 'Hạnh');
    const items = within(menu).getAllByRole('menuitem');
    await waitFor(() => expect(items[0]).toHaveFocus());
    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(items[2]).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: `${tv('users.more')}: Hạnh` })).toHaveFocus();
  });

  it('reset password from the menu still shows the one-time temporary password', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const menu = await openMore(user, 'Hạnh');
    await user.click(within(menu).getByRole('menuitem', { name: tv('users.reset_pw') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('users.reset_pw_title', { name: 'Hạnh' }),
    });
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('users.reset_pw') }));
    expect(
      await screen.findByRole('dialog', { name: tv('users.temp_pw_title', { name: 'Hạnh' }) }),
    ).toBeInTheDocument();
    expect(userOf('qa.fd').mustChangePassword).toBe(true);
  });

  it('a locked account shows "Mở khóa" on the row; "Khác…" then offers no lock', async () => {
    userOf('qa.sal').status = 'disabled';
    const { user } = renderApp('/settings/users', 'qa.owner');
    const name = userOf('qa.sal').displayName;
    expect(
      await screen.findByRole('button', { name: `${tv('users.unlock')}: ${name}` }),
    ).toBeEnabled();
    const menu = await openMore(user, name);
    expect(within(menu).queryByRole('menuitem', { name: tv('users.lock') })).toBeNull();
    expect(within(menu).getByRole('menuitem', { name: tv('users.reset_pw') })).toBeInTheDocument();
  });

  it('reset 2FA: reason (≥ 3 characters) and S2 in one dialog, one Idempotency-Key, 204 → sentence, dialog closed', async () => {
    markMfa('qa.fd');
    const sent = mockReset2fa();
    const { user } = renderApp('/settings/users', 'qa.owner');
    const menu = await openMore(user, 'Hạnh');
    await user.click(within(menu).getByRole('menuitem', { name: tv('users.reset_2fa') }));
    const dlg = await screen.findByRole('dialog', { name: `${tv('users.reset_2fa')} – Hạnh` });
    expect(within(dlg).getByText(tv('users.reset_2fa_confirm', { name: 'Hạnh' }))).toBeVisible();
    const reason = within(dlg).getByLabelText(label('users.reset_2fa_reason'));
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.type(reason, ' a ');
    const confirm = within(dlg).getByRole('button', { name: tv('users.reset_2fa') });
    expect(confirm).toHaveClass('danger');
    await user.click(confirm);
    // Too short: nothing sent, the reason says why.
    expect(within(dlg).getByText(tv('field_error.reason_required'))).toBeInTheDocument();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(sent).toHaveLength(0);

    // Nothing was sent, so the password typed is kept (factors are cleared only after an attempt).
    expect(within(dlg).getByLabelText(label('reauth.s2_password_label'))).toHaveValue(
      MOCK_PASSWORD,
    );
    await user.clear(reason);
    await user.type(reason, 'Mất điện thoại');
    await user.click(confirm);
    expect(
      await screen.findByText(tv('users.reset_2fa_done', { name: 'Hạnh' })),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.path).toBe(`/v1/users/${userOf('qa.fd').id}/2fa/actions/reset`);
    expect(sent[0]!.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(sent[0]!.body).toEqual({
      reauth: { password: MOCK_PASSWORD },
      reason: 'Mất điện thoại',
    });
  });

  it('reset 2FA: wrong password stays in the dialog with one sentence; 409 INVALID_TRANSITION closes and reloads', async () => {
    markMfa('qa.fd');
    const sent = mockReset2fa(() =>
      HttpResponse.json(
        { type: 't', title: 't', status: 409, code: 'INVALID_TRANSITION', requestId: 'r-409' },
        { status: 409, headers: { 'content-type': 'application/problem+json' } },
      ),
    );
    server.use(
      http.post('*/v1/users/:userId/2fa/actions/reset', async ({ request }) => {
        const body = (await request.clone().json()) as { reauth: { password: string } };
        if (body.reauth.password !== MOCK_PASSWORD)
          return HttpResponse.json(
            {
              type: 't',
              title: 't',
              status: 401,
              code: 'REAUTH_FAILED',
              errors: [{ field: 'reauth', code: 'REAUTH_FAILED' }],
            },
            { status: 401, headers: { 'content-type': 'application/problem+json' } },
          );
        return undefined;
      }),
    );
    const { user } = renderApp('/settings/users', 'qa.owner');
    const menu = await openMore(user, 'Hạnh');
    await user.click(within(menu).getByRole('menuitem', { name: tv('users.reset_2fa') }));
    const dlg = await screen.findByRole('dialog', { name: `${tv('users.reset_2fa')} – Hạnh` });
    await user.type(within(dlg).getByLabelText(label('users.reset_2fa_reason')), 'Mất điện thoại');
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), 'sai-mat-khau');
    await user.click(within(dlg).getByRole('button', { name: tv('users.reset_2fa') }));
    // BUG-R4-024: the owner has no 2FA in this seed → the password-only sentence.
    expect(await within(dlg).findByText(tv('reauth.s2_failed_password'))).toBeInTheDocument();
    expect(within(dlg).getByLabelText(label('users.reset_2fa_reason'))).toHaveValue(
      'Mất điện thoại',
    );
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('users.reset_2fa') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sent).toHaveLength(1);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('offline (read-only Desk): "Khác…" is disabled', async () => {
    renderApp('/settings/users', 'qa.owner');
    const btn = await screen.findByRole('button', { name: `${tv('users.more')}: Hạnh` });
    expect(btn).toBeEnabled();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    try {
      await waitFor(() => expect(btn).toBeDisabled());
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
    }
  });
});

describe('BUG-R4-024 – S2 dialog sentence when there is no code field', () => {
  it('owner without 2FA, wrong password on lock → "password" sentence, never the "code" one', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const name = userOf('qa.sal').displayName;
    const menu = await openMore(user, name);
    await user.click(within(menu).getByRole('menuitem', { name: tv('users.lock') }));
    const dlg = await screen.findByRole('dialog', { name: new RegExp(esc(tv('users.lock'))) });
    expect(within(dlg).queryByLabelText(label('auth.code_label.totp'))).toBeNull();
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), 'sai-mat-khau');
    await user.click(within(dlg).getByRole('button', { name: tv('users.lock') }));
    expect(await within(dlg).findByText(tv('reauth.s2_failed_password'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('reauth.s2_failed'))).toBeNull();
    expect(within(dlg).getByLabelText(label('reauth.s2_password_label'))).toHaveFocus();
    expect(userOf('qa.sal').status).toBe('active');
  });

  it('UXD EM-07: the factor line keeps the 12 px `.stack` gap (no inline margin)', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const menu = await openMore(user, 'Hạnh');
    await user.click(within(menu).getByRole('menuitem', { name: tv('users.lock') }));
    const dlg = await screen.findByRole('dialog', { name: new RegExp(esc(tv('users.lock'))) });
    const help = within(dlg).getByText(tv('reauth.s2_help_password'));
    expect(help.closest('form')).toHaveClass('stack');
    expect(help.getAttribute('style')).toBeNull();
  });
});

describe('BUG-R4-023 – email column breaks only after "@"', () => {
  it('EmailText: two unbreakable halves joined by one <wbr>', () => {
    const { container } = render(<EmailText value="qa.fd.v103d7@example.test" />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('mono');
    const halves = root.querySelectorAll('.nowrap');
    expect([...halves].map((h) => h.textContent)).toEqual(['qa.fd.v103d7@', 'example.test']);
    expect(root.querySelectorAll('wbr')).toHaveLength(1);
    expect(root.textContent).toBe('qa.fd.v103d7@example.test');
  });

  it('the users table uses it', async () => {
    userOf('qa.fd').email = 'qa.fd2@example.test';
    renderApp('/settings/users', 'qa.owner');
    const row = (await screen.findByText('qa.fd')).closest('tr')!;
    await waitFor(() => expect(row.querySelector('.users-email wbr')).not.toBeNull());
    expect(row.querySelector('.users-email .mono')).toHaveTextContent('qa.fd2@example.test');
  });
});
