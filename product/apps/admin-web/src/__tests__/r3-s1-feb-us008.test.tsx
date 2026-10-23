import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { MOCK_PASSWORD } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

/**
 * R3 Sprint 1 FE-B – US-008 S26 "Thêm người dùng" (owner only, A100) with the shared S2 dialog (FE-A
 * `StrongReauthDialog`, SEC 06.26 – `createUser.reauth` in the same request). Mock follows the server order:
 * schema → S2 → password policy → 409 USERNAME_TAKEN.
 */
type U = ReturnType<typeof renderApp>['user'];
const label = (key: string) => new RegExp(`^${tv(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

async function openForm(user: U) {
  await user.click(await screen.findByRole('button', { name: tv('users.new_cta') }));
  return screen.findByRole('dialog', { name: tv('users.add_title') });
}

async function fill(user: U, dlg: HTMLElement, name: string, username: string, pw?: string) {
  await user.type(within(dlg).getByLabelText(label('users.f_display')), name);
  await user.type(within(dlg).getByLabelText(label('users.f_username')), username);
  if (pw !== undefined) {
    const box = within(dlg).getByLabelText(label('users.f_temp_pw'));
    await user.clear(box);
    await user.type(box, pw);
  }
}

async function s2(user: U, name: string, password = MOCK_PASSWORD) {
  const dlg = await screen.findByRole('dialog', { name: tv('users.add_s2_title', { name }) });
  await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), password);
  await user.click(within(dlg).getByRole('button', { name: tv('users.create') }));
  return dlg;
}

describe('US-008 Thêm người dùng (S26)', () => {
  it('owner adds a user with S2: temp password shown once, account must change it (AC1)', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const dlg = await openForm(user);
    await fill(user, dlg, 'Chị Lan', 'Lan.HK', 'Tam-thoi-2026x');
    await user.click(within(dlg).getByRole('checkbox', { name: /^Buồng phòng/ }));
    await user.click(within(dlg).getByRole('button', { name: tv('users.create') }));
    await s2(user, 'Chị Lan');
    const pw = await screen.findByRole('dialog', {
      name: tv('users.temp_pw_title', { name: 'Chị Lan' }),
    });
    expect(within(pw).getByText('Tam-thoi-2026x')).toBeInTheDocument();
    const created = mockControl.db.users.find((u) => u.username === 'lan.hk')!;
    expect(created).toMatchObject({ displayName: 'Chị Lan', mustChangePassword: true });
    expect(created.roles.map((r) => r.role)).toEqual(['housekeeping']);
    await user.click(
      within(pw)
        .getAllByRole('button', { name: tv('common.close') })
        .at(-1)!,
    );
    expect(await screen.findByText('lan.hk')).toBeInTheDocument();
  });

  it('the generated temporary password is pre-filled and works', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const dlg = await openForm(user);
    const box = within(dlg).getByLabelText(label('users.f_temp_pw')) as HTMLInputElement;
    expect(box.value).toHaveLength(14);
    await fill(user, dlg, 'Minh', 'minh.fd');
    await user.click(within(dlg).getByRole('checkbox', { name: /^Lễ tân Đặt phòng/ }));
    await user.click(within(dlg).getByRole('button', { name: tv('users.create') }));
    await s2(user, 'Minh');
    const pw = await screen.findByRole('dialog', {
      name: tv('users.temp_pw_title', { name: 'Minh' }),
    });
    expect(within(pw).getByText(box.value)).toBeInTheDocument();
  });

  it('form errors stay at the inputs and do not spend an S2 attempt', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const dlg = await openForm(user);
    await fill(user, dlg, 'Bảo', 'bảo trì', 'short');
    await user.click(within(dlg).getByRole('button', { name: tv('users.create') }));
    expect(within(dlg).getByText(tv('users.f_username_invalid'))).toBeInTheDocument();
    expect(
      within(dlg).getByText(tv('field_error.password_short', { min: 10 })),
    ).toBeInTheDocument();
    expect(within(dlg).getByText(tv('users.roles_min'))).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /Xác nhận thêm/ })).not.toBeInTheDocument();
    const name = within(dlg).getByLabelText(label('users.f_username'));
    await user.clear(name);
    await user.type(name, 'bao.mt');
    const box = within(dlg).getByLabelText(label('users.f_temp_pw'));
    await user.clear(box);
    await user.type(box, 'xxbao.mtxx99');
    await user.click(within(dlg).getByRole('button', { name: tv('users.create') }));
    expect(within(dlg).getByText(tv('field.PASSWORD_SAME_AS_USERNAME'))).toBeInTheDocument();
  });

  it('username already in use → message at the username input after S2 (AC2, 409 USERNAME_TAKEN)', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const dlg = await openForm(user);
    await fill(user, dlg, 'Hạnh 2', 'QA.FD', 'Tam-thoi-2026x');
    await user.click(within(dlg).getByRole('checkbox', { name: /^Lễ tân Đặt phòng/ }));
    await user.click(within(dlg).getByRole('button', { name: tv('users.create') }));
    await s2(user, 'Hạnh 2');
    expect(await within(dlg).findByText(tv('field.USERNAME_TAKEN'))).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Xác nhận thêm/ })).not.toBeInTheDocument(),
    );
    expect(mockControl.db.users.filter((u) => u.username === 'qa.fd')).toHaveLength(1);
  });

  it('wrong S2 password keeps the dialog open and creates nothing', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const dlg = await openForm(user);
    await fill(user, dlg, 'Tú', 'tu.sale', 'Tam-thoi-2026x');
    await user.click(within(dlg).getByRole('checkbox', { name: /^Sale nội bộ/ }));
    await user.click(within(dlg).getByRole('button', { name: tv('users.create') }));
    const s2dlg = await s2(user, 'Tú', 'sai-mat-khau');
    expect(await within(s2dlg).findByText(tv('reauth.s2_failed'))).toBeInTheDocument();
    expect(mockControl.db.users.some((u) => u.username === 'tu.sale')).toBe(false);
  });

  it('not owner → no add button, and the API answers 403 (AC3)', async () => {
    renderApp('/settings/users', 'qa.mgr');
    expect(await screen.findByText(tv('shell.no_access_title'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('users.new_cta') })).not.toBeInTheDocument();
    const res = await fetch('http://localhost/v1/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': 'mock-csrf' },
      body: JSON.stringify({
        username: 'x.y',
        displayName: 'X',
        initialPassword: 'a'.repeat(12),
        roles: [],
      }),
    });
    expect(res.status).toBe(403);
  });
});
