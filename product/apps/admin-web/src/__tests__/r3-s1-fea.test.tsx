import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Providers } from '../app/Providers';
import { AppRoutes } from '../app/routes';
import { msUntilNextRollover, todayLocal } from '../app/dates';
import { formatRecoveryCode, recoveryCodesText } from '../components/RecoveryCodes';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD } from '../mocks/seed';
import { stepAt, totpAt, totpNow } from '../mocks/totp';
import { manualKey } from '../pages/Enroll2faPage';
import { afterLoginPath } from '../pages/LoginPage';
import { SCREENS } from '../mocks/seed';
import { safeInternalPath } from '../session/safePath';
import { renderApp, signIn, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
const userOf = (name: string) => mockControl.db.users.find((u) => u.username === name)!;

afterEach(() => vi.useRealTimers());

// ---------------------------------------------------------------------------------------------------------
// R3-Q31 / SEC E – useAfterLoginPath never leaves the app (GHSA-wrjc-x8rr-h8h6)
// ---------------------------------------------------------------------------------------------------------
describe('SEC E: after-login path stays inside the app', () => {
  const owner = { roles: ['owner' as const], screens: SCREENS.owner, deviceTrusted: true };
  const SEC_VECTORS = [
    '/\\evil.example',
    '//evil.example',
    '/%5Cevil.example',
    '/overview\\@evil.example',
    'https://evil.example',
  ];
  const MORE = [
    '/%5cevil.example',
    '/%2F%2Fevil.example',
    '/\t/evil.example',
    '/overview%5C@evil.example',
    'javascript:alert(1)',
    '/overviewx',
    ' /overview',
    '',
    null,
    42,
  ];

  it.each([...SEC_VECTORS, ...MORE])('from = %j → home', (from) => {
    expect(afterLoginPath(from, owner)).toBe('/overview');
    if (typeof from === 'string' && from !== '/overviewx')
      expect(safeInternalPath(from)).toBeNull();
  });

  it('plain in-app deep links still come back (US-001 AC2)', () => {
    expect(afterLoginPath('/settings/parameters', owner)).toBe('/settings/parameters');
    expect(afterLoginPath('/reservations/abc?tab=folio', owner)).toBe(
      '/reservations/abc?tab=folio',
    );
    expect(afterLoginPath('/overview', owner)).toBe('/overview');
  });

  it.each(SEC_VECTORS)(
    'sign-in with location.state.from = %j lands on the home screen',
    async (from) => {
      const user = userEvent.setup();
      render(
        <Providers>
          <MemoryRouter initialEntries={[{ pathname: '/login', state: { from } }]}>
            <AppRoutes />
          </MemoryRouter>
        </Providers>,
      );
      await signIn(user, 'qa.fd');
      expect(await screen.findByRole('heading', { level: 1, name: /Hôm nay/ })).toBeInTheDocument();
    },
  );
});

// ---------------------------------------------------------------------------------------------------------
// US-143 – sign-in step 2 (AC2, AC3 a; SEC 06.17–06.20)
// ---------------------------------------------------------------------------------------------------------
describe('US-143 sign-in step 2', () => {
  it('password OK → TOTP step; wrong code = one sentence; right code → the deep link', async () => {
    const { secret } = mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/settings/rooms');
    await signIn(user, 'qa.owner');
    expect(await screen.findByRole('heading', { name: tv('auth.totp.title') })).toBeInTheDocument();
    // No session yet: the step-2 token is not a session (SEC 06.17).
    expect(mockControl.db.sessionUserId).toBeNull();
    const now = stepAt();
    const wrong = (await totpAt(secret, now - 5)) === '000000' ? '111111' : '000000';
    await user.type(screen.getByLabelText(label('auth.code_label.totp')), wrong);
    await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
    expect(await screen.findByText(tv('error.MFA_INVALID'))).toBeInTheDocument();
    expect(screen.getByLabelText(label('auth.code_label.totp'))).toHaveValue('');
    const code = await totpNow(secret);
    await user.type(
      screen.getByLabelText(label('auth.code_label.totp')),
      `${code.slice(0, 3)} ${code.slice(3)}`,
    );
    await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
    expect(await screen.findByRole('heading', { name: /Danh mục căn/ })).toBeInTheDocument();
    expect(mockControl.db.amr).toBe('totp');
    // The token never reaches Web Storage (SEC 06.17).
    const dump = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(dump).not.toMatch(new RegExp(secret));
    expect(dump).not.toMatch(/mfaToken/i);
  });

  it('recovery code (any case, with dashes) → restricted session → re-enroll on the new phone (ARC 12.3, AC3 a)', async () => {
    const { recovery, secret: oldSecret } = mockControl.enableMfa('qa.mgr');
    const { user } = renderApp('/settings/rooms');
    await signIn(user, 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('auth.totp.recovery') }));
    expect(screen.getByRole('heading', { name: tv('mfa.recovery_title') })).toBeInTheDocument();
    await user.type(
      screen.getByLabelText(label('auth.code_label.recovery')),
      formatRecoveryCode(recovery[0]!).toLowerCase(),
    );
    await user.click(screen.getByRole('button', { name: tv('mfa.recovery_submit') }));
    // Same enrollment screen, re-enroll wording; the API refuses everything else meanwhile.
    expect(
      await screen.findByRole('heading', { name: tv('mfa.reenroll_title') }),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('mfa.reenroll_lead'))).toBeInTheDocument();
    expect(userOf('qa.mgr').mfa!.recovery).toHaveLength(9);
    const res = await fetch('http://localhost/v1/properties/x/rooms');
    expect((await res.json()).code).toBe('MFA_ENROLLMENT_REQUIRED');

    await user.click(screen.getByRole('button', { name: tv('mfa.installed') }));
    await user.type(screen.getByLabelText(label('auth.current_password')), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('mfa.enroll_start') }));
    await screen.findByRole('img', { name: tv('mfa.qr_label') });
    const secret = userOf('qa.mgr').mfa!.pending!.secret;
    expect(secret).not.toBe(oldSecret);
    await user.type(screen.getByLabelText(label('auth.enroll.confirm')), await totpNow(secret));
    await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
    await screen.findByRole('list', { name: tv('mfa.codes_list_label') });
    // New secret, a whole new code set; the old codes are gone.
    expect(userOf('qa.mgr').mfa!.secret).toBe(secret);
    expect(userOf('qa.mgr').mfa!.recovery).toHaveLength(10);
    expect(userOf('qa.mgr').mfa!.recovery).not.toContain(recovery[1]);
    expect(mockControl.db.amr).toBe('totp');
    await user.click(screen.getByRole('checkbox', { name: tv('mfa.codes_ack_apart') }));
    await user.click(screen.getByRole('button', { name: tv('mfa.finish') }));
    expect(await screen.findByRole('heading', { name: /Danh mục căn/ })).toBeInTheDocument();
    // A full (totp) session may not start a setup while 2FA is on (12.3 b).
    const again = await fetch('http://localhost/v1/me/2fa/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': mockControl.db.csrf },
      body: JSON.stringify({ currentPassword: MOCK_PASSWORD }),
    });
    expect(again.status).toBe(409);
  });

  it('5 wrong codes → the token is dead, back to the password step with a calm note', async () => {
    mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/login');
    await signIn(user, 'qa.owner');
    await screen.findByRole('heading', { name: tv('auth.totp.title') });
    for (let i = 0; i < 5; i++) {
      await user.type(screen.getByLabelText(label('auth.code_label.totp')), '999999');
      await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
      if (i < 4) await screen.findByText(tv('error.MFA_INVALID'));
    }
    expect(await screen.findByText(tv('mfa.step_expired'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(mockControl.db.mfaTokens.size).toBe(0);
  });

  it('"Quay lại đăng nhập" drops the step', async () => {
    mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/login');
    await signIn(user, 'qa.owner');
    await user.click(await screen.findByRole('button', { name: tv('mfa.back_to_password') }));
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------------------------------------
// US-143 AC1 – enforced enrollment (SEC 06.4, 06.7–06.13)
// ---------------------------------------------------------------------------------------------------------
describe('US-143 enrollment (MFA_ENFORCED = true)', () => {
  it('manager without 2FA → restricted session → QR + key → first code → 10 codes once → back to the deep link', async () => {
    mockControl.db.mfaEnforced = true;
    const { user } = renderApp('/settings/rooms');
    await signIn(user, 'qa.mgr');
    expect(await screen.findByText(tv('mfa.enroll_required'))).toBeInTheDocument();
    // The API refuses anything else in this session (SEC 06.4).
    const res = await fetch('http://localhost/v1/properties/x/rooms');
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('MFA_ENROLLMENT_REQUIRED');

    await user.click(screen.getByRole('button', { name: tv('mfa.installed') }));
    // Wrong password first → field error, nothing created.
    await user.type(screen.getByLabelText(label('auth.current_password')), 'sai-mat-khau');
    await user.click(screen.getByRole('button', { name: tv('mfa.enroll_start') }));
    expect(await screen.findByText(tv('field_error.current_password_wrong'))).toBeInTheDocument();
    await user.type(screen.getByLabelText(label('auth.current_password')), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('mfa.enroll_start') }));
    expect(await screen.findByRole('img', { name: tv('mfa.qr_label') })).toBeInTheDocument();
    const secret = userOf('qa.mgr').mfa!.pending!.secret;
    expect(screen.getByText(manualKey(`otpauth://totp/x?secret=${secret}`))).toHaveClass('mono');

    // Wrong first code → stays, says so.
    await user.type(screen.getByLabelText(label('auth.enroll.confirm')), '12345');
    await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
    expect(await screen.findByText(tv('auth.totp.error'))).toBeInTheDocument();
    // Wrong 6-digit code → the server's 422 → same sentence, field emptied.
    await user.clear(screen.getByLabelText(label('auth.enroll.confirm')));
    await user.type(screen.getByLabelText(label('auth.enroll.confirm')), '000000');
    await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
    await waitFor(() =>
      expect(screen.getByLabelText(label('auth.enroll.confirm'))).toHaveValue(''),
    );

    await user.type(screen.getByLabelText(label('auth.enroll.confirm')), await totpNow(secret));
    await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
    const list = await screen.findByRole('list', { name: tv('mfa.codes_list_label') });
    const shown = within(list)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(shown).toHaveLength(10);
    expect(
      shown.every((c) => /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(c ?? '')),
    ).toBe(true);
    expect(list).toHaveClass('mono');
    expect(mockControl.db.enrollmentOnly).toBe(false);
    // Nothing of it in Web Storage (SEC 06.13).
    const dump = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(dump).not.toContain(shown[0]!.replace(/-/g, ''));
    expect(dump).not.toContain(secret);

    const finish = screen.getByRole('button', { name: tv('mfa.finish_locked') });
    expect(finish).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: tv('mfa.codes_ack_apart') }));
    await user.click(screen.getByRole('button', { name: tv('mfa.finish') }));
    expect(await screen.findByRole('heading', { name: /Danh mục căn/ })).toBeInTheDocument();
  });

  it('a 403 MFA_ENROLLMENT_REQUIRED mid-session opens the enrollment screen', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    await screen.findByRole('heading', { name: /Danh mục căn/ });
    mockControl.db.enrollmentOnly = true;
    await user.click(screen.getAllByRole('button', { name: /Sửa 101/ })[0]!);
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByText(tv('mfa.enroll_required'))).toBeInTheDocument();
    // Only owner → sole-owner reminder later on the codes step; here: logout is offered.
    expect(screen.getByRole('button', { name: tv('shell.logout') })).toBeInTheDocument();
  });

  it('expired / replaced QR (409) → asks for a new one', async () => {
    mockControl.db.mfaEnforced = true;
    const { user } = renderApp('/login');
    await signIn(user, 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('mfa.installed') }));
    await user.type(screen.getByLabelText(label('auth.current_password')), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('mfa.enroll_start') }));
    await screen.findByRole('img', { name: tv('mfa.qr_label') });
    const secret = userOf('qa.mgr').mfa!.pending!.secret;
    userOf('qa.mgr').mfa!.pending!.expiresAt = Date.now() - 1;
    await user.type(screen.getByLabelText(label('auth.enroll.confirm')), await totpNow(secret));
    await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
    expect(await screen.findByText(tv('mfa.qr_expired'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: tv('mfa.enroll_start') })).toBeInTheDocument();
  });

  it('not enforced: owner without 2FA sees the nudge on every screen; "Để sau" hides it', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    await screen.findByRole('heading', { name: /Danh mục căn/ });
    expect(screen.getByText(tv('mfa.nudge'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('mfa.nudge_later') }));
    expect(screen.queryByText(tv('mfa.nudge'))).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------------------------------------
// S2 StrongReauth dialog (SEC A.5) + "Xác thực 2 bước" (SEC 06.13–06.16, 06.25, 06.35; AC3 c)
// ---------------------------------------------------------------------------------------------------------
describe('S2 dialog and "Xác thực 2 bước"', () => {
  it('new recovery codes need password + a NEW code; failure is one sentence; fields cleared', async () => {
    const { secret, recovery } = mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/security', 'qa.owner');
    expect(await screen.findByText(tv('mfa.codes_left', { n: 10 }))).toBeInTheDocument();
    expect(screen.getByText(tv('auth.enroll.single_owner'))).toBeInTheDocument(); // AC3 (c)
    expect(screen.queryByRole('button', { name: tv('mfa.disable') })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: tv('mfa.regen') }));
    const dlg = await screen.findByRole('dialog', { name: tv('mfa.regen') });
    expect(within(dlg).getByText(tv('reauth.s2_help'))).toBeInTheDocument();
    // Missing code → required, nothing sent.
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('mfa.regen') }));
    expect(within(dlg).getByText(tv('common.required'))).toBeInTheDocument();
    // Wrong code → the same sentence, both fields emptied.
    await user.type(within(dlg).getByLabelText(label('auth.code_label.totp')), '000001');
    await user.click(within(dlg).getByRole('button', { name: tv('mfa.regen') }));
    expect(await within(dlg).findByText(tv('reauth.s2_failed'))).toBeInTheDocument();
    expect(within(dlg).getByText(tv('reauth.s2_wait_code'))).toBeInTheDocument();
    expect(within(dlg).getByLabelText(label('reauth.s2_password_label'))).toHaveValue('');
    expect(within(dlg).getByLabelText(label('auth.code_label.totp'))).toHaveValue('');

    const sent: unknown[] = [];
    const on = ({ request }: { request: Request }) => {
      if (request.url.endsWith('/me/2fa/recovery-codes'))
        void request
          .clone()
          .json()
          .then((b) => sent.push(b));
    };
    server.events.on('request:start', on);
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.type(
      within(dlg).getByLabelText(label('auth.code_label.totp')),
      await totpNow(secret),
    );
    await user.click(within(dlg).getByRole('button', { name: tv('mfa.regen') }));
    const list = await screen.findByRole('list', { name: tv('mfa.codes_list_label') });
    server.events.removeListener('request:start', on);
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);
    // StrongReauth shape sent INSIDE the request (ARC 1.2), no Idempotency-Key.
    expect(sent[0]).toEqual({
      password: MOCK_PASSWORD,
      totpCode: expect.stringMatching(/^\d{6}$/),
    });
    expect(userOf('qa.owner').mfa!.recovery).not.toContain(recovery[0]);
  });

  it('≤ 3 codes left → reminder on the page and a banner on other screens', async () => {
    mockControl.enableMfa('qa.mgr', ['AAAABBBBCCCCDDDD', 'EEEEFFFFGGGGHHHH', 'JJJJKKKKMMMMNNNN']);
    renderApp('/settings/rooms', 'qa.mgr');
    expect(await screen.findByText(tv('mfa.codes_low_short'))).toBeInTheDocument();
    renderApp('/security');
    expect(await screen.findByText(tv('mfa.codes_low', { n: 3 }))).toBeInTheDocument();
  });

  it('voluntary role turns 2FA off with S2 → every session ends, back to sign-in', async () => {
    const { recovery } = mockControl.enableMfa('qa.fd');
    const { user } = renderApp('/security', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('mfa.disable') }));
    const dlg = await screen.findByRole('dialog', { name: tv('mfa.disable') });
    await user.click(within(dlg).getByRole('button', { name: tv('auth.totp.recovery') }));
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.type(within(dlg).getByLabelText(label('auth.code_label.recovery')), recovery[2]!);
    await user.click(within(dlg).getByRole('button', { name: tv('mfa.disable') }));
    expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(userOf('qa.fd').mfa).toBeUndefined();
  });

  it('account without 2FA: S2 is the password only', async () => {
    // FD without 2FA opening the security page – only "Bật ngay"; dialog shape checked through the menu link.
    const { user } = renderApp('/today', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: /Hạnh · Lễ tân/ }));
    await user.click(screen.getByRole('link', { name: tv('shell.security') }));
    expect(await screen.findByText(tv('mfa.status_off'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: tv('mfa.nudge_cta') })).toHaveAttribute(
      'href',
      '/enroll-2fa',
    );
  });

  it('recovery codes text file: title, note, 10 lines 4-4-4-4', () => {
    const txt = recoveryCodesText({ title: 'T', note: 'N' }, ['ABCDEFGHJKMNPQRS', 'x']);
    expect(txt.split('\n').slice(0, 4)).toEqual(['T', 'N', '', ' 1. ABCD-EFGH-JKMN-PQRS']);
  });
});

// ---------------------------------------------------------------------------------------------------------
// FB-R3-SEC-FEA-01 – CỔNG S2 on the operations already built (BE-C 8712822 + ae836f7)
// ---------------------------------------------------------------------------------------------------------
describe('FEA-01: S2 on users, devices, password', () => {
  const s2Label = () => label('reauth.s2_password_label');
  const write = (method: string, path: string, body: unknown, extra: Record<string, string> = {}) =>
    fetch(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': mockControl.db.csrf,
        'idempotency-key': crypto.randomUUID(),
        ...extra,
      },
      body: JSON.stringify(body),
    });

  it('MSW like the server: missing reauth → 422 STRONG_REAUTH_REQUIRED on the 6 operations', async () => {
    mockControl.enableMfa('qa.owner');
    mockControl.signInAs('qa.owner');
    const fd = userOf('qa.fd');
    const prop = fd.roles[0]!.propertyId;
    const ifm = { 'if-match': `"${fd.version}"` };
    const calls: Array<[string, string, unknown, Record<string, string>?]> = [
      [
        'POST',
        '/v1/users',
        {
          username: 'x.new',
          displayName: 'X',
          initialPassword: 'a'.repeat(12),
          roles: [{ propertyId: prop, role: 'front_desk' }],
        },
      ],
      ['PATCH', `/v1/users/${fd.id}`, { status: 'disabled' }, ifm],
      ['PATCH', `/v1/users/${fd.id}`, { resetPassword: 'b'.repeat(12) }, ifm],
      ['PUT', `/v1/users/${fd.id}/roles`, { roles: [{ propertyId: prop, role: 'manager' }] }, ifm],
      [
        'POST',
        `/v1/properties/${prop}/trusted-devices/${mockControl.db.devices[0]!.id}/actions/revoke`,
        {},
      ],
      [
        'POST',
        `/v1/properties/${prop}/trusted-devices`,
        {
          name: 'M',
          deviceKind: 'desk',
          currentPassword: MOCK_PASSWORD,
          hardeningChecklistConfirmed: true,
        },
      ],
      [
        'POST',
        '/v1/me/password',
        { currentPassword: MOCK_PASSWORD, newPassword: 'mat-khau-moi-123' },
      ],
    ];
    for (const [method, path, body, extra] of calls) {
      const res = await write(method, path, body, extra);
      expect(res.status, `${method} ${path}`).toBe(422);
      const p = await res.json();
      expect(p.errors[0].code, path).toBe('STRONG_REAUTH_REQUIRED');
    }
    // Display name alone needs no S2.
    const ok = await write('PATCH', `/v1/users/${fd.id}`, { displayName: 'Hạnh B' }, ifm);
    expect(ok.status).toBe(200);
  });

  it('owner with 2FA adds "Quản lý" → S2 dialog (password + code), roles sent with reauth', async () => {
    const { secret } = mockControl.enableMfa('qa.owner');
    const sent: unknown[] = [];
    const on = ({ request }: { request: Request }) => {
      if (/\/users\/[^/]+\/roles$/.test(request.url))
        void request
          .clone()
          .json()
          .then((b) => sent.push(b));
    };
    server.events.on('request:start', on);
    const { user } = renderApp('/settings/users', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: 'Sửa vai: Hạnh' }));
    const dlg = await screen.findByRole('dialog', { name: 'Vai của Hạnh' });
    await user.click(within(dlg).getByRole('checkbox', { name: /^Quản lý/ }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu vai' }));
    const s2 = await screen.findByRole('dialog', { name: 'Đổi vai của Hạnh?' });
    expect(within(s2).getByText(tv('reauth.s2_help'))).toBeInTheDocument();
    await user.type(within(s2).getByLabelText(s2Label()), MOCK_PASSWORD);
    await user.type(
      within(s2).getByLabelText(label('auth.code_label.totp')),
      await totpNow(secret),
    );
    await user.click(within(s2).getByRole('button', { name: 'Lưu vai' }));
    expect(await screen.findByText('Đã lưu thay đổi cho Hạnh.')).toBeInTheDocument();
    server.events.removeListener('request:start', on);
    expect(sent[0]).toMatchObject({
      reauth: { password: MOCK_PASSWORD, totpCode: expect.any(String) },
    });
    expect(userOf('qa.fd').roles.map((r) => r.role)).toContain('manager');
  });

  it('wrong code on lock → one sentence, dialog stays, nothing changed', async () => {
    mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/settings/users', 'qa.owner');
    const row = (await screen.findByText('qa.sal')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Khóa tài khoản' }));
    const s2 = await screen.findByRole('dialog', { name: /Khóa tài khoản/ });
    await user.type(within(s2).getByLabelText(s2Label()), MOCK_PASSWORD);
    await user.type(within(s2).getByLabelText(label('auth.code_label.totp')), '000001');
    await user.click(within(s2).getByRole('button', { name: 'Khóa tài khoản' }));
    expect(await within(s2).findByText(tv('reauth.s2_failed'))).toBeInTheDocument();
    expect(userOf('qa.sal').status).toBe('active');
  });

  it('change password with 2FA: code field, wrong code → one sentence, right code → saved', async () => {
    const { secret } = mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/change-password', 'qa.owner');
    const code = await screen.findByLabelText(label('auth.code_label.totp'));
    await user.type(screen.getByLabelText(/Mật khẩu hiện tại/), MOCK_PASSWORD);
    await user.type(screen.getByLabelText(/^Mật khẩu mới/), 'mat-khau-moi-123');
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu mới/), 'mat-khau-moi-123');
    await user.type(code, '000001');
    await user.click(screen.getByRole('button', { name: tv('pw.submit') }));
    expect(await screen.findByText(tv('reauth.s2_failed'))).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu hiện tại/)).toHaveValue('');
    await user.type(screen.getByLabelText(/Mật khẩu hiện tại/), MOCK_PASSWORD);
    await user.type(screen.getByLabelText(label('auth.code_label.totp')), await totpNow(secret));
    await user.click(screen.getByRole('button', { name: tv('pw.submit') }));
    expect(await screen.findByText(tv('common.saved'))).toBeInTheDocument();
  });

  it('device grant with 2FA: recovery code accepted as the second factor', async () => {
    const { recovery } = mockControl.enableMfa('qa.owner');
    const { user } = renderApp('/settings/devices', 'qa.owner');
    await user.type(await screen.findByLabelText(/Tên máy/), 'Máy quầy 2');
    await user.click(screen.getByRole('checkbox', { name: 'Đội kỹ thuật đã kiểm máy này' }));
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu/), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('auth.totp.recovery') }));
    await user.type(screen.getByLabelText(label('auth.code_label.recovery')), recovery[3]!);
    await user.click(screen.getByRole('button', { name: 'Cấp quyền thiết bị này' }));
    expect(await screen.findByText('Máy này đã được cấp quyền.')).toBeInTheDocument();
    expect(userOf('qa.owner').mfa!.recovery).not.toContain(recovery[3]);
  });

  it('password change keeps its place before enrollment (SEC BEC-01 order)', async () => {
    mockControl.db.mfaEnforced = true;
    userOf('qa.mgr').mustChangePassword = true;
    const { user } = renderApp('/login');
    await signIn(user, 'qa.mgr');
    expect(
      await screen.findByRole('heading', { name: 'Đặt mật khẩu của bạn' }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------------------------------------
// R3-Q36 / R3-Q38 – business day moves at the rollover without a reload
// ---------------------------------------------------------------------------------------------------------
describe('R3-Q36 business day follows the 06:00 rollover', () => {
  const D = todayLocal();
  const at = (iso: string) => vi.setSystemTime(new Date(iso));

  it('msUntilNextRollover', () => {
    expect(msUntilNextRollover('Asia/Ho_Chi_Minh', '06:00', new Date(`${D}T05:59:00+07:00`))).toBe(
      60_000,
    );
    expect(msUntilNextRollover('Asia/Ho_Chi_Minh', '06:00', new Date(`${D}T06:00:00+07:00`))).toBe(
      24 * 3600_000,
    );
    expect(msUntilNextRollover('Asia/Ho_Chi_Minh', '06:00', new Date(`${D}T02:40:00+07:00`))).toBe(
      (3 * 60 + 20) * 60_000,
    );
  });

  async function openOrder(user: ReturnType<typeof renderApp>['user']) {
    await user.click(await screen.findByRole('button', { name: tv('wo.new_title') }));
    const dlg = await screen.findByRole('dialog', { name: tv('wo.new_title') });
    await user.click(within(dlg).getByRole('switch', { name: tv('hk.lock_request') }));
    return within(dlg).getByLabelText(label('wo.block_from'));
  }

  it('form open at 05:59:58 moves its earliest date to D when 06:00 passes (timer)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    at(`${D}T05:59:58+07:00`);
    const Y = new Date(Date.parse(`${D}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    const { user } = renderApp('/maintenance', 'qa.mt');
    const start = await openOrder(user);
    await waitFor(() => expect(start).toHaveAttribute('min', Y));
    at(`${D}T06:00:01+07:00`); // the real timer (~2.25 s) fires after this
    await waitFor(() => expect(start).toHaveAttribute('min', D), { timeout: 6_000 });
  }, 15_000);

  it('tab back in view after the rollover → day moves and Me is re-read', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    at(`${D}T03:00:00+07:00`);
    const Y = new Date(Date.parse(`${D}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    const { user } = renderApp('/maintenance', 'qa.mt');
    const start = await openOrder(user);
    await waitFor(() => expect(start).toHaveAttribute('min', Y));
    const meReads: string[] = [];
    const on = ({ request }: { request: Request }) => {
      if (new URL(request.url).pathname === '/v1/me') meReads.push(request.url);
    };
    server.events.on('request:start', on);
    at(`${D}T07:30:00+07:00`); // laptop slept through 06:00
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => expect(start).toHaveAttribute('min', D));
    await waitFor(() => expect(meReads.length).toBeGreaterThan(0));
    server.events.removeListener('request:start', on);
  });
});
