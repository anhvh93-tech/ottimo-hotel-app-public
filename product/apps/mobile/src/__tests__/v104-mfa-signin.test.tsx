// v1.0.4 P4-50 – ARC-RN103-02 (sign-in step 2 on OTTIMO Staff) + BUG-R3-052 (temporary password / 2-step to set
// up: the right screen, never "the connection may be weak") + BUG-R4-021 check for the new notification kinds.
// Mock accounts only (src/mocks/handlers.ts – MOCK_USERS, MOCK_PASSWORD, MOCK_TOTP, MOCK_RECOVERY_CODE).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ApiError } from '@ottimo/api-client';
import { I18nProvider } from '@ottimo/i18n';
import { ICONS } from '@ottimo/ui';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import type { StaffNotification } from '../app/api';
import { deskUrl } from '../app/config';
import { notifRef, notifText } from '../app/notifications';
import { MemoryStore } from '../data/store';
import { mockControl, MOCK_PASSWORD, MOCK_RECOVERY_CODE, MOCK_TOTP } from '../mocks/handlers';
import { server } from '../mocks/node';
import { EnrollOnDeskPage } from '../pages/EnrollOnDeskPage';
import { MFA_STEP_MS } from '../pages/MfaStepPage';
import { classify } from '../queue/queue';
import { appSourceFiles } from '../../scripts/used-keys';
import { calls, setOnline, start, tv, wait } from './helpers';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setOnline(true);
});
afterEach(() => {
  vi.useRealTimers();
});

const TOTP_LABEL = () => tv('auth.code_label.totp');
const WEAK = /mạng yếu/;

async function toStep2(username: string) {
  const ui = await start(username);
  expect(await screen.findByRole('heading', { name: tv('auth.totp.title') })).toBeInTheDocument();
  return ui;
}

async function typeCode(user: Awaited<ReturnType<typeof start>>['user'], code: string) {
  const input = screen.getByLabelText(TOTP_LABEL());
  await user.clear(input);
  await user.type(input, code);
  await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
}

describe('ARC-RN103-02 – every role with 2-step signs in on the phone', () => {
  it.each([
    ['own.mfa', 'tasks'],
    ['mgr.mfa', 'tasks'],
    ['fdl.mfa', 'tasks'],
    ['fd.mfa', 'tasks'],
    ['hk.mfa', 'tasks'],
    ['mt.mfa', 'wo'],
    ['sale.mfa', 'none'],
    ['ctv.mfa', 'none'],
  ] as const)('%s: password → 6-digit code → %s', async (username, home) => {
    const { user, container } = await toStep2(username);
    expect(screen.getByText(tv('auth.totp.help'))).toBeInTheDocument();
    // The password step is gone and the old "comes in a later release" sentence is never shown.
    expect(screen.queryByLabelText('Mật khẩu')).toBeNull();
    expect(container.textContent).not.toMatch(/Đăng nhập 2 bước sẽ có ở bản sau/);
    await typeCode(user, MOCK_TOTP.slice(0, 3) + ' ' + MOCK_TOTP.slice(3)); // pasted "123 456" works
    if (home === 'tasks') {
      expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
    } else if (home === 'wo') {
      expect(await screen.findByRole('heading', { name: /Phiếu sửa/ })).toBeInTheDocument();
    } else {
      expect(
        await screen.findByRole('heading', { name: tv('shell.no_access_title') }),
      ).toBeInTheDocument();
    }
    expect(calls('loginMfa')).toBe(1);
    expect(mockControl.state.bodies.find((b) => b.op === 'loginMfa')?.body).toEqual({
      totpCode: MOCK_TOTP,
      recoveryCode: undefined,
    });
  });

  it('a wrong code: one sentence, the field is emptied; 5 wrong codes → back to the password step', async () => {
    const { user } = await toStep2('hk.mfa');
    for (let i = 1; i <= 4; i++) {
      await typeCode(user, '000000');
      expect(await screen.findByText(tv('error.MFA_INVALID'))).toBeInTheDocument();
      expect(screen.getByLabelText(TOTP_LABEL())).toHaveValue('');
    }
    await typeCode(user, '000000');
    expect(await screen.findByText(tv('mfa.step_expired'))).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu')).toHaveValue('');
    expect(screen.getByLabelText('Tên đăng nhập')).toHaveValue('hk.mfa'); // the name stays
    expect(calls('loginMfa')).toBe(5);
  });

  it('a code of the wrong shape is refused on the phone (not sent, not counted)', async () => {
    const { user } = await toStep2('hk.mfa');
    await typeCode(user, '12345');
    expect(await screen.findByText(tv('error.MFA_INVALID'))).toBeInTheDocument();
    expect(calls('loginMfa')).toBe(0);
  });

  it('after 5 minutes the step ends by itself with the note on the sign-in screen', async () => {
    await toStep2('fd.mfa');
    await wait(MFA_STEP_MS + 1_500);
    expect(await screen.findByText(tv('mfa.step_expired'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
  });

  it('"Back to sign-in" returns to the password step', async () => {
    const { user } = await toStep2('fd.mfa');
    await user.click(screen.getByRole('button', { name: tv('mfa.back_to_password') }));
    expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.queryByText(tv('mfa.step_expired'))).toBeNull();
  });

  it('recovery code (lost phone) → signed in, then only "set up 2-step on Desk" + sign out', async () => {
    const { user, container } = await toStep2('hk.mfa');
    expect(screen.getByLabelText(TOTP_LABEL())).toHaveAttribute('autocomplete', 'one-time-code');
    await user.click(screen.getByRole('button', { name: tv('auth.totp.recovery') }));
    expect(screen.getByRole('heading', { name: tv('mfa.recovery_title') })).toBeInTheDocument();
    expect(screen.getByText(tv('mfa.recovery_after'))).toBeInTheDocument();
    // FB-R4-SEC-MOB-P450-03: a recovery code stays out of the browser's form history.
    expect(screen.getByLabelText(tv('auth.code_label.recovery'))).toHaveAttribute(
      'autocomplete',
      'off',
    );
    await user.type(
      screen.getByLabelText(tv('auth.code_label.recovery')),
      MOCK_RECOVERY_CODE.toLowerCase(),
    );
    await user.click(screen.getByRole('button', { name: tv('mfa.recovery_submit') }));
    expect(
      await screen.findByRole('heading', { name: tv('auth.enroll.title') }),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('error.MFA_ENROLLMENT_REQUIRED'))).toBeInTheDocument();
    expect(screen.getByText(tv('staff.mfa_enroll_desk'))).toBeInTheDocument();
    expect(container.textContent).not.toMatch(WEAK);
    expect(calls('listHkTasks')).toBe(0); // no screen behind that would fail with 403
    await user.click(screen.getByRole('button', { name: tv('shell.logout') }));
    expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
  });
});

describe('ARC-RN103-02 – weak network on step 2 never loses the typed code', () => {
  it('no answer → network sentence, code kept, "Try again" sends the same code', async () => {
    const { user } = await toStep2('hk.mfa');
    mockControl.scenario.dropNext = 'loginMfa';
    await typeCode(user, MOCK_TOTP);
    expect(await screen.findByText(tv('common.error_network_body'))).toBeInTheDocument();
    expect(screen.getByLabelText(TOTP_LABEL())).toHaveValue(MOCK_TOTP);
    await user.click(screen.getByRole('button', { name: tv('common.retry') }));
    expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
    expect(calls('loginMfa')).toBe(2);
  });

  it('signed in but the answer was lost → "Try again" finds the session, the used code is not counted wrong', async () => {
    const { user } = await toStep2('hk.mfa');
    mockControl.scenario.dropAnswerOf = 'loginMfa';
    await typeCode(user, MOCK_TOTP);
    expect(await screen.findByText(tv('common.error_network_body'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('common.retry') }));
    expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
    expect(calls('loginMfa')).toBe(1);
    expect(screen.queryByText(tv('error.MFA_INVALID'))).toBeNull();
  });

  it('offline: nothing is sent, the code stays', async () => {
    const { user } = await toStep2('hk.mfa');
    setOnline(false);
    await typeCode(user, MOCK_TOTP);
    expect(await screen.findByText(tv('login.offline'))).toBeInTheDocument();
    expect(screen.getByLabelText(TOTP_LABEL())).toHaveValue(MOCK_TOTP);
    expect(calls('loginMfa')).toBe(0);
    // FB-R4-UXD-MOB-P450-02: one (warning) block, no red copy of the same sentence.
    expect(screen.getAllByText(tv('login.offline'))).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();
    setOnline(true);
    await user.click(screen.getByRole('button', { name: tv('auth.totp.submit') }));
    expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
  });

  it('429 on step 2 → the wait sentence, not "wrong code"', async () => {
    const { user } = await toStep2('hk.mfa');
    mockControl.scenario.failNext = { op: 'loginMfa', status: 429, code: 'RATE_LIMITED' };
    await typeCode(user, MOCK_TOTP);
    expect(await screen.findByText(/Bạn đã thử quá nhiều lần/)).toBeInTheDocument();
    expect(screen.queryByText(tv('error.MFA_INVALID'))).toBeNull();
  });
});

describe('BUG-R3-052 – temporary password / 2-step to set up: the right screen, never "mạng yếu"', () => {
  async function fillPassword(
    user: Awaited<ReturnType<typeof start>>['user'],
    next: string,
    repeat = next,
  ) {
    await user.type(screen.getByLabelText(tv('auth.current_password')), MOCK_PASSWORD);
    await user.type(screen.getByLabelText(tv('pw.new')), next);
    await user.type(screen.getByLabelText(tv('pw.repeat')), repeat);
    await user.click(screen.getByRole('button', { name: tv('pw.submit') }));
  }

  it('housekeeping with a temporary password → "Đặt mật khẩu của bạn" → Việc', async () => {
    const { user, container } = await start('hk.temp');
    expect(await screen.findByRole('heading', { name: tv('pw.title') })).toBeInTheDocument();
    expect(screen.getByText(tv('pw.lead'))).toBeInTheDocument();
    expect(container.textContent).not.toMatch(WEAK);
    expect(calls('listHkTasks')).toBe(0);
    await fillPassword(user, 'Doi-thong-xanh-26');
    expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
    expect(calls('changeMyPassword')).toBe(1);
  });

  it('checks on the phone: length, repeat; server reasons per field', async () => {
    const { user } = await start('hk.temp');
    await screen.findByRole('heading', { name: tv('pw.title') });
    await fillPassword(user, 'short', 'shorter');
    expect(
      await screen.findByText(tv('field_error.password_short', { min: 10 })),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('pw.mismatch'))).toBeInTheDocument();
    expect(calls('changeMyPassword')).toBe(0);

    await user.clear(screen.getByLabelText(tv('auth.current_password')));
    await user.clear(screen.getByLabelText(tv('pw.new')));
    await user.clear(screen.getByLabelText(tv('pw.repeat')));
    await fillPassword(user, 'ottimo-garden-house');
    expect(await screen.findByText(tv('field.PASSWORD_TOO_COMMON'))).toBeInTheDocument();
  });

  it('wrong current password → field sentence (not a sign-out, not "mạng yếu")', async () => {
    const { user, container } = await start('hk.temp');
    await screen.findByRole('heading', { name: tv('pw.title') });
    await user.type(screen.getByLabelText(tv('auth.current_password')), 'not-the-temp-one');
    await user.type(screen.getByLabelText(tv('pw.new')), 'Doi-thong-xanh-26');
    await user.type(screen.getByLabelText(tv('pw.repeat')), 'Doi-thong-xanh-26');
    await user.click(screen.getByRole('button', { name: tv('pw.submit') }));
    expect(await screen.findByText(tv('field_error.current_password_wrong'))).toBeInTheDocument();
    expect(container.textContent).not.toMatch(WEAK);
  });

  it('weak network while saving: fields kept, "Try again" saves', async () => {
    const { user } = await start('hk.temp');
    await screen.findByRole('heading', { name: tv('pw.title') });
    mockControl.scenario.dropNext = 'changeMyPassword';
    await fillPassword(user, 'Doi-thong-xanh-26');
    expect(await screen.findByText(tv('common.error_network_body'))).toBeInTheDocument();
    expect(screen.getByLabelText(tv('pw.new'))).toHaveValue('Doi-thong-xanh-26');
    expect(screen.getByLabelText(tv('auth.current_password'))).toHaveValue(MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('common.retry') }));
    expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
  });

  it('temporary password + 2-step: step 2, then the change needs the code too (S2)', async () => {
    const { user } = await toStep2('mt.temp.mfa');
    await typeCode(user, MOCK_TOTP);
    expect(await screen.findByRole('heading', { name: tv('pw.title') })).toBeInTheDocument();
    await fillPassword(user, 'Doi-thong-xanh-26');
    expect(await screen.findByText(tv('common.required'))).toBeInTheDocument();
    expect(calls('changeMyPassword')).toBe(0);
    await user.type(screen.getByLabelText(TOTP_LABEL()), MOCK_TOTP);
    await user.click(screen.getByRole('button', { name: tv('pw.submit') }));
    expect(await screen.findByRole('heading', { name: /Phiếu sửa/ })).toBeInTheDocument();
    expect(mockControl.state.bodies.find((b) => b.op === 'changeMyPassword')?.body).toEqual({
      totpCode: MOCK_TOTP,
    });
  });

  it('manager without 2-step (MFA_ENFORCED) → "set up on Desk", no screen that would fail', async () => {
    const { container } = await start('mgr.enroll');
    expect(
      await screen.findByRole('heading', { name: tv('auth.enroll.title') }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(WEAK);
    expect(calls('listHkTasks')).toBe(0);
    // FB-R4-UXD-MOB-P450-01: on localhost (no Desk link) the next step is still said – not only "Sign out".
    expect(screen.getByText(tv('staff.mfa_enroll_desk'))).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /OTTIMO Desk/ })).toBeNull();
    expect(screen.getByRole('button', { name: tv('shell.logout') })).toBeInTheDocument();
  });

  it('FB-R4-UXD-MOB-P450-01: on staff.<domain> the Desk link is the main action (btn pri, icon monitor)', () => {
    vi.stubGlobal('location', { ...window.location, hostname: 'staff.example.test' });
    try {
      render(
        <I18nProvider defaultLocale="vi">
          <EnrollOnDeskPage onLogout={() => {}} />
        </I18nProvider>,
      );
      const desk = screen.getByRole('link', { name: /OTTIMO Desk · desk\.example\.test/ });
      expect(desk).toHaveAttribute('href', 'https://desk.example.test/');
      expect(desk).toHaveClass('btn', 'pri', 'xl', 'block');
      const monitor = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      monitor.innerHTML = ICONS.monitor;
      expect(desk.querySelector('svg')?.innerHTML).toBe(monitor.innerHTML);
      expect(screen.getByText(tv('staff.mfa_enroll_desk'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: tv('shell.logout') })).not.toHaveClass('pri');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('FB-R4-SEC-MOB-P450-01: a restricted session drops the cached full profile – offline start opens no work screen', async () => {
    const store = new MemoryStore();
    const open = () =>
      render(
        <StrictMode>
          <App store={store} />
        </StrictMode>,
      );
    // 1. Full session first: temporary password changed → Việc, profile cached for offline start.
    const first = await start('hk.temp', undefined, store);
    await screen.findByRole('heading', { name: tv('pw.title') });
    await fillPassword(first.user, 'Doi-thong-xanh-26');
    expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
    expect(await store.get('snapshot', 'me')).toBeDefined();
    first.unmount();
    // 2. OWN sets a temporary password again: the next start is a restricted session.
    mockControl.state.newPasswords.delete('hk.temp');
    const second = open();
    expect(await screen.findByRole('heading', { name: tv('pw.title') })).toBeInTheDocument();
    await waitFor(async () => expect(await store.get('snapshot', 'me')).toBeUndefined());
    second.unmount();
    const reads = calls('listHkTasks');
    // 3. Opened again without network: no profile on the phone → sign-in screen, never "Việc".
    setOnline(false);
    server.use(http.get('/v1/me', () => HttpResponse.error()));
    open();
    expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Việc của tôi/ })).toBeNull();
    expect(calls('listHkTasks')).toBe(reads); // nothing read for the work screens
  });

  it('a read refused mid-session with 403 PASSWORD_CHANGE_REQUIRED opens the password screen', async () => {
    mockControl.scenario.failNext = {
      op: 'listHkTasks',
      status: 403,
      code: 'PASSWORD_CHANGE_REQUIRED',
    };
    const { container, store } = await start('hk.lan');
    expect(await screen.findByRole('heading', { name: tv('pw.title') })).toBeInTheDocument();
    await waitFor(() => expect(container.textContent).not.toMatch(WEAK));
    // FB-R4-SEC-MOB-P450-01: the profile cached at this sign-in is dropped too.
    await waitFor(async () => expect(await store.get('snapshot', 'me')).toBeUndefined());
  });

  it('the queue keeps (pauses) an item refused only because the session is restricted', () => {
    const e = (code: string) =>
      new ApiError(403, { type: '/x', title: code, status: 403, code, requestId: 'r' });
    expect(classify(e('PASSWORD_CHANGE_REQUIRED'), {}).kind).toBe('auth');
    expect(classify(e('MFA_ENROLLMENT_REQUIRED'), {}).kind).toBe('auth');
    expect(classify(e('FORBIDDEN_ACTION'), {}).kind).toBe('rejected');
  });
});

describe('Desk link and notification labels', () => {
  it('Desk is the sibling host of the staff app; no link elsewhere', () => {
    expect(deskUrl('staff.ottimo.vn')).toBe('https://desk.ottimo.vn/');
    expect(deskUrl('staff.staging.ottimo.vn')).toBe('https://desk.staging.ottimo.vn/');
    expect(deskUrl('localhost')).toBeUndefined();
    expect(deskUrl('evil.example.test')).toBeUndefined();
  });

  it('BUG-R4-021: new v1.0.4 kinds get a sentence, never their code; internal event codes never shown', () => {
    const t = (k: string, a?: Record<string, string | number>) => tv(k, a);
    for (const kind of ['hold_overdue_with_deposit', 'hold_overdue_cap']) {
      const n = {
        id: '0192a1b0-0000-7000-8000-0000000ff101',
        kind,
        refType: 'reservation',
        refCode: 'OTM-00171',
        createdAt: '2026-11-04T10:00:00Z',
      } as unknown as StaffNotification;
      expect(notifText(n, t)).toBe(tv('staff.notif.k.other'));
      expect(notifRef(n, t)).toBe('OTM-00171');
    }
    const locked = {
      id: '0192a1b0-0000-7000-8000-0000000ff102',
      kind: 'security_alert',
      refType: 'user',
      refId: '0192a1b0-0000-7000-8000-00000000b005',
      refCode: ['mfa', 'locked'].join('.'),
      createdAt: '2026-11-04T10:00:00Z',
    } as StaffNotification;
    expect(notifText(locked, t, '0192a1b0-0000-7000-8000-00000000b005')).toBe(
      tv('staff.notif.sec.other_self'),
    );
    expect(notifRef(locked, t)).toBeUndefined();
  });

  it('the source no longer uses "Đăng nhập 2 bước sẽ có ở bản sau"', () => {
    const src = appSourceFiles(join(__dirname, '..'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(src).not.toContain(['auth', 'mfa_later'].join('.'));
  });
});
