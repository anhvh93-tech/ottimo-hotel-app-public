// v1.0.3 BUG-R3-032 (P1) – security email on the Desk (OpenAPI 0.3.10 `setMyEmail`, `updateUser.email`,
// `Me.email`, `Me.securityEmailMissing`; ARC v1.0.3-contract-email mục 7). Test addresses only: example.test.
import { hasKey, translate } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { isEmailShape, normalizeEmail, sameEmail } from '../app/email';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD, type MockUser } from '../mocks/seed';
import { totpNow } from '../mocks/totp';
import { renderApp, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
/** The email field only ("Email *") – not the block heading "Email nhận thư bảo mật". */
const fieldLabel = () => new RegExp(`^${esc(tv('secmail.field'))}\\s*\\*?$`);
const userOf = (name: string) => mockControl.db.users.find((u) => u.username === name)!;
type User = ReturnType<typeof renderApp>['user'];

/** Every request to `path` (method, headers, body) while a test runs. */
function capture(path: string) {
  const sent: Array<{ method: string; headers: Headers; body: unknown }> = [];
  const on = ({ request }: { request: Request }) => {
    if (new URL(request.url).pathname === path)
      void request
        .clone()
        .text()
        .then((b) =>
          sent.push({ method: request.method, headers: request.headers, body: b && JSON.parse(b) }),
        );
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}
let stops: Array<() => void> = [];
afterEach(() => {
  stops.forEach((s) => s());
  stops = [];
});
const watch = (path: string) => {
  const c = capture(path);
  stops.push(c.stop);
  return c.sent;
};

const emailInput = () => screen.getByLabelText(fieldLabel());
const section = () => screen.getByRole('region', { name: tv('secmail.title') });

/** Fill the S2 dialog: password, and the current TOTP code when 2FA is on. */
async function s2(
  user: User,
  title: string,
  confirm: string,
  secret?: string,
  password = MOCK_PASSWORD,
) {
  const dlg = await screen.findByRole('dialog', { name: title });
  await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), password);
  if (secret)
    await user.type(
      within(dlg).getByLabelText(label('auth.code_label.totp')),
      await totpNow(secret),
    );
  await user.click(within(dlg).getByRole('button', { name: confirm }));
  return dlg;
}

describe('email helpers (client check before S2)', () => {
  it('normalises like the server and stays as loose as local@domain', () => {
    expect(normalizeEmail('  Owner@Example.TEST ')).toBe('owner@example.test');
    expect(isEmailShape('owner@example.test')).toBe(true);
    expect(isEmailShape('owner')).toBe(false);
    expect(isEmailShape('a b@example.test')).toBe(false);
    expect(isEmailShape(`${'a'.repeat(250)}@x.vn`)).toBe(false);
    expect(isEmailShape('a\u0007@example.test')).toBe(false);
    expect(sameEmail('Owner@example.test', 'owner@EXAMPLE.test')).toBe(true);
    expect(sameEmail(null, undefined)).toBe(true);
  });
});

describe('Bảo mật tài khoản – security email block (setMyEmail)', () => {
  it('owner without an email: reminder, add with S2 (password + TOTP), one Idempotency-Key, sentence after save', async () => {
    const { secret } = mockControl.enableMfa('qa.owner');
    const sent = watch('/v1/me/email');
    const { user } = renderApp('/security', 'qa.owner');
    expect(await screen.findByText(tv('secmail.missing'))).toBeInTheDocument();
    expect(within(section()).getByText(tv('secmail.none'))).toBeInTheDocument();
    // ND13 Đ.13 (FB-R4-SEC-ARC-EM-13): purpose of processing under the field.
    expect(within(section()).getByText(new RegExp(esc(tv('secmail.purpose'))))).toBeInTheDocument();
    expect(emailInput()).toHaveClass('mono');

    await user.type(emailInput(), '  Owner@Example.test ');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.add') }));
    const dlg = await screen.findByRole('dialog', { name: tv('secmail.s2_save_title') });
    // The dialog repeats the address to check (normalised) and carries the second factor field.
    expect(within(dlg).getByText('owner@example.test')).toHaveClass('mono');
    expect(within(dlg).getByLabelText(label('auth.code_label.totp'))).toBeInTheDocument();
    await s2(user, tv('secmail.s2_save_title'), tv('secmail.save'), secret);

    expect(await screen.findByText(tv('secmail.saved_first'))).toBeInTheDocument();
    expect(screen.getByTestId('security-email-current')).toHaveTextContent('owner@example.test');
    expect(screen.queryByText(tv('secmail.missing'))).not.toBeInTheDocument();
    expect(userOf('qa.owner').email).toBe('owner@example.test');
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]!.method).toBe('PUT');
    expect(sent[0]!.headers.get('idempotency-key')).toMatch(/^[0-9a-f-]{36}$/);
    expect(sent[0]!.body).toEqual({
      email: 'owner@example.test',
      reauth: { password: MOCK_PASSWORD, totpCode: expect.stringMatching(/^\d{6}$/) },
    });
  });

  it('change: "sent to the new and the old address"; each Save gets a NEW key', async () => {
    userOf('qa.fd').email = 'fd@example.test';
    const sent = watch('/v1/me/email');
    const { user } = renderApp('/security', 'qa.fd');
    // FD is not owner/manager: no reminder line.
    expect(await screen.findByTestId('security-email-current')).toHaveTextContent(
      'fd@example.test',
    );
    expect(screen.queryByText(tv('secmail.missing'))).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: tv('secmail.change') }));
    await user.clear(emailInput());
    await user.type(emailInput(), 'fd2@example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.save') }));
    await s2(user, tv('secmail.s2_save_title'), tv('secmail.save'));
    expect(await screen.findByText(tv('secmail.saved'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: tv('secmail.change') }));
    await user.clear(emailInput());
    await user.type(emailInput(), 'fd3@example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.save') }));
    await s2(user, tv('secmail.s2_save_title'), tv('secmail.save'));
    expect(await screen.findByTestId('security-email-current')).toHaveTextContent(
      'fd3@example.test',
    );
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[0]!.headers.get('idempotency-key')).not.toBe(
      sent[1]!.headers.get('idempotency-key'),
    );
    expect(mockControl.db.emailChanges.map((c) => c.oldEmail)).toEqual([
      'fd@example.test',
      'fd2@example.test',
    ]);
  });

  it('same address (any case): nothing is sent, no code spent', async () => {
    userOf('qa.fd').email = 'fd@example.test';
    const sent = watch('/v1/me/email');
    const { user } = renderApp('/security', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('secmail.change') }));
    await user.clear(emailInput());
    await user.type(emailInput(), 'FD@example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.save') }));
    expect(await screen.findByText(tv('secmail.unchanged'))).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('connection drops: the SAME key and body are sent once more and the saved answer is shown', async () => {
    const sent = watch('/v1/me/email');
    server.use(http.put('*/v1/me/email', () => HttpResponse.error(), { once: true }));
    const { user } = renderApp('/security', 'qa.mgr');
    await user.type(await screen.findByLabelText(fieldLabel()), 'mgr@example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.add') }));
    await s2(user, tv('secmail.s2_save_title'), tv('secmail.save'));
    expect(await screen.findByText(tv('secmail.saved_first'))).toBeInTheDocument();
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]!.headers.get('idempotency-key')).toBe(sent[0]!.headers.get('idempotency-key'));
    expect(sent[1]!.body).toEqual(sent[0]!.body);
  });

  it('format checked before S2: no request; server EMAIL_INVALID comes back to the field', async () => {
    const sent = watch('/v1/me/email');
    const { user } = renderApp('/security', 'qa.owner');
    await user.type(await screen.findByLabelText(fieldLabel()), 'owner.example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.add') }));
    expect(await within(section()).findByText(tv('secmail.invalid'))).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sent).toHaveLength(0);

    mockControl.failNext(/\/v1\/me\/email:PUT/, 422, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'email', code: 'EMAIL_INVALID' }],
    });
    await user.clear(emailInput());
    await user.type(emailInput(), 'owner@example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.add') }));
    await s2(user, tv('secmail.s2_save_title'), tv('secmail.save'));
    expect(await within(section()).findByText(tv('secmail.invalid'))).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(emailInput()).toHaveValue('owner@example.test');
  });

  it('shared mailbox (info@): EMAIL_SHARED_MAILBOX under the field, TOTP not spent', async () => {
    const { secret } = mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/security', 'qa.owner');
    await user.type(await screen.findByLabelText(fieldLabel()), 'INFO@example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.add') }));
    await s2(user, tv('secmail.s2_save_title'), tv('secmail.save'), secret);
    expect(
      await within(section()).findByText(tv('field.EMAIL_SHARED_MAILBOX')),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Checked before S2 on the server: the code was not consumed.
    expect(userOf('qa.owner').mfa!.lastStep).toBeUndefined();
    expect(userOf('qa.owner').email).toBeUndefined();
  });

  it('401 REAUTH_FAILED and 422 STRONG_REAUTH_REQUIRED stay in the dialog with one sentence', async () => {
    const { user } = renderApp('/security', 'qa.owner');
    await user.type(await screen.findByLabelText(fieldLabel()), 'owner@example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.add') }));
    const dlg = await s2(
      user,
      tv('secmail.s2_save_title'),
      tv('secmail.save'),
      undefined,
      'wrong-pass',
    );
    expect(await within(dlg).findByText(tv('reauth.s2_failed'))).toBeInTheDocument();
    expect(within(dlg).getByLabelText(label('reauth.s2_password_label'))).toHaveValue('');

    mockControl.failNext(/\/v1\/me\/email:PUT/, 422, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'reauth', code: 'STRONG_REAUTH_REQUIRED' }],
    });
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('secmail.save') }));
    await waitFor(() =>
      expect(within(dlg).getByLabelText(label('reauth.s2_password_label'))).toHaveValue(''),
    );
    expect(within(dlg).getByText(tv('reauth.s2_failed'))).toBeInTheDocument();
    expect(userOf('qa.owner').email).toBeUndefined();
  });

  it('429: the wait sentence inside the dialog, nothing saved', async () => {
    mockControl.failNext(
      /\/v1\/me\/email:PUT/,
      429,
      { code: 'RATE_LIMITED' },
      { 'retry-after': '900' },
    );
    const { user } = renderApp('/security', 'qa.owner');
    await user.type(await screen.findByLabelText(fieldLabel()), 'owner@example.test');
    await user.click(within(section()).getByRole('button', { name: tv('secmail.add') }));
    const dlg = await s2(user, tv('secmail.s2_save_title'), tv('secmail.save'));
    expect(
      await within(dlg).findByText(tv('error.RATE_LIMITED', { minutes: 15 })),
    ).toBeInTheDocument();
    expect(userOf('qa.owner').email).toBeUndefined();
  });

  it('remove: S2 (danger), email: null, "sent to the old address", reminder back for the owner', async () => {
    userOf('qa.owner').email = 'owner@example.test';
    const sent = watch('/v1/me/email');
    const { user } = renderApp('/security', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: tv('secmail.remove') }));
    await s2(user, tv('secmail.s2_remove_title'), tv('secmail.remove'));
    expect(await screen.findByText(tv('secmail.removed'))).toBeInTheDocument();
    expect(await screen.findByText(tv('secmail.missing'))).toBeInTheDocument();
    await waitFor(() => expect(sent).toHaveLength(1));
    expect((sent[0]!.body as { email: unknown }).email).toBeNull();
    expect(userOf('qa.owner').email).toBeNull();
  });
});

describe('reminder banner (Me.securityEmailMissing)', () => {
  it('owner without an email sees it on other screens; the button opens the block with the field focused', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const text = await screen.findByText(tv('secmail.nudge'));
    const alert = text.closest('.alert') as HTMLElement;
    await user.click(within(alert).getByRole('button', { name: tv('secmail.add') }));
    expect(await screen.findByLabelText(fieldLabel())).toHaveFocus();
    // Not on /security itself (the block has its own line).
    expect(screen.queryByText(tv('secmail.nudge'))).not.toBeInTheDocument();
  });

  it('"Để sau" hides it for this tab session; staff roles and owners with an email never see it', async () => {
    const { user, unmount } = renderApp('/settings/rooms', 'qa.owner');
    const alert = (await screen.findByText(tv('secmail.nudge'))).closest('.alert') as HTMLElement;
    await user.click(within(alert).getByRole('button', { name: tv('mfa.nudge_later') }));
    expect(screen.queryByText(tv('secmail.nudge'))).not.toBeInTheDocument();
    unmount();
    sessionStorage.clear();

    renderApp('/today', 'qa.fd');
    await screen.findByRole('button', { name: /Hạnh · Lễ tân/ });
    expect(screen.queryByText(tv('secmail.nudge'))).not.toBeInTheDocument();
  });

  it('manager with an email: no reminder', async () => {
    userOf('qa.mgr').email = 'mgr@example.test';
    renderApp('/settings/rooms', 'qa.mgr');
    await screen.findByRole('heading', { name: /Danh mục căn/ });
    expect(screen.queryByText(tv('secmail.nudge'))).not.toBeInTheDocument();
  });
});

describe('Người dùng & vai – email column (owner, updateUser.email)', () => {
  const secondOwner = (): MockUser => ({
    id: '0192a1b0-0000-7000-8000-000000000950',
    username: 'qa.owner2',
    displayName: 'Đồng sở hữu',
    status: 'active',
    roles: [{ propertyId: userOf('qa.owner').roles[0]!.propertyId, role: 'owner' }],
    email: 'owner2@example.test',
    version: 1,
  });

  it('owner sets an employee email with S2 + If-Match; toast; the column shows it in mono', async () => {
    const sent = watch(`/v1/users/${userOf('qa.fd').id}`);
    const { user } = renderApp('/settings/users', 'qa.owner');
    expect(
      await screen.findByRole('columnheader', { name: tv('users.col_email') }),
    ).toBeInTheDocument();
    const row = screen.getByText('qa.fd').closest('tr')!;
    expect(within(row).getByText(tv('users.email_none'))).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: `${tv('users.edit_email')}: Hạnh` }));
    const title = tv('users.email_title', { name: 'Hạnh' });
    const dlg = await screen.findByRole('dialog', { name: title });
    await user.type(within(dlg).getByLabelText(fieldLabel()), 'fd@example.test');
    await user.click(within(dlg).getByRole('button', { name: tv('secmail.save') }));
    await s2(user, title, tv('secmail.save'));
    expect(await screen.findByText(tv('users.email_saved', { name: 'Hạnh' }))).toBeInTheDocument();
    expect(
      within(screen.getByText('qa.fd').closest('tr')!).getByText('fd@example.test'),
    ).toHaveClass('mono');
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]!.method).toBe('PATCH');
    expect(sent[0]!.headers.get('if-match')).toBe('"1"');
    expect(sent[0]!.body).toEqual({
      email: 'fd@example.test',
      reauth: { password: MOCK_PASSWORD },
    });
    expect(userOf('qa.fd').version).toBe(2);
  });

  it('remove an employee email: email null, toast; shared mailbox comes back to the field', async () => {
    userOf('qa.mgr').email = 'mgr@example.test';
    const { user } = renderApp('/settings/users', 'qa.owner');
    const row = (await screen.findByText('qa.mgr')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: `${tv('users.edit_email')}: Quân` }));
    const title = tv('users.email_title', { name: 'Quân' });
    let dlg = await screen.findByRole('dialog', { name: title });
    await user.clear(within(dlg).getByLabelText(fieldLabel()));
    await user.type(within(dlg).getByLabelText(fieldLabel()), 'info@example.test');
    await user.click(within(dlg).getByRole('button', { name: tv('secmail.save') }));
    await s2(user, title, tv('secmail.save'));
    dlg = await screen.findByRole('dialog', { name: title });
    expect(await within(dlg).findByText(tv('field.EMAIL_SHARED_MAILBOX'))).toBeInTheDocument();

    await user.click(within(dlg).getByRole('button', { name: tv('secmail.remove') }));
    await s2(user, title, tv('secmail.remove'));
    expect(
      await screen.findByText(tv('users.email_removed', { name: 'Quân' })),
    ).toBeInTheDocument();
    expect(userOf('qa.mgr').email).toBeNull();
  });

  it('own row and another owner row: button off with the reason; own row links to Bảo mật tài khoản', async () => {
    mockControl.db.users.push(secondOwner());
    userOf('qa.owner').email = 'owner@example.test';
    const { user } = renderApp('/settings/users', 'qa.owner');
    const selfRow = (await screen.findByText('qa.owner')).closest('tr')!;
    const selfBtn = within(selfRow).getByRole('button', {
      name: `${tv('users.edit_email')}: Chủ đầu tư`,
    });
    expect(selfBtn).toBeDisabled();
    expect(selfBtn).toHaveAccessibleDescription(tv('users.email_self'));
    expect(within(selfRow).getByText('owner@example.test')).toHaveClass('mono');

    const otherRow = screen.getByText('qa.owner2').closest('tr')!;
    const otherBtn = within(otherRow).getByRole('button', {
      name: `${tv('users.edit_email')}: Đồng sở hữu`,
    });
    expect(otherBtn).toBeDisabled();
    expect(otherBtn).toHaveAccessibleDescription(tv('users.email_other_owner'));

    await user.click(within(selfRow).getByRole('link', { name: tv('users.email_self') }));
    expect(await screen.findByRole('region', { name: tv('secmail.title') })).toBeInTheDocument();
  });

  it('the server still refuses: another owner → 403, own account → 422 NOT_ALLOWED_FOR_SELF', async () => {
    mockControl.db.users.push(secondOwner());
    mockControl.signInAs('qa.owner');
    const me = await fetch(`${location.origin}/v1/me`).then(
      (r) => r.json() as Promise<{ csrfToken: string }>,
    );
    const patch = (id: string) =>
      fetch(`${location.origin}/v1/users/${id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': me.csrfToken,
          'if-match': '"1"',
        },
        body: JSON.stringify({ email: 'x@example.test', reauth: { password: MOCK_PASSWORD } }),
      });
    expect((await patch('0192a1b0-0000-7000-8000-000000000950')).status).toBe(403);
    const self = await patch(userOf('qa.owner').id);
    expect(self.status).toBe(422);
    expect(((await self.json()) as { errors: unknown[] }).errors).toEqual([
      { field: 'email', code: 'NOT_ALLOWED_FOR_SELF' },
    ]);
  });
});

describe('strings (VI + EN, brand voice)', () => {
  const KEYS = [
    'shell.account_security',
    'secmail.title',
    'secmail.lead',
    'secmail.purpose',
    'secmail.missing',
    'secmail.nudge',
    'secmail.saved',
    'secmail.saved_first',
    'secmail.removed',
    'secmail.invalid',
    'field.EMAIL_SHARED_MAILBOX',
    'field.NOT_ALLOWED_FOR_SELF',
    'users.email_saved',
    'users.email_self',
    'users.email_other_owner',
  ];
  it.each(KEYS)('%s has VI and EN, no emoji, no "thư xác nhận"', (key) => {
    expect(hasKey(key)).toBe(true);
    const vi = translate('vi', key, { name: 'X' });
    const en = translate('en', key, { name: 'X' });
    expect(en).not.toBe(key);
    expect(en).not.toBe(vi);
    for (const s of [vi, en]) expect(s).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(vi.toLowerCase()).not.toContain('thư xác nhận');
  });
});
