import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../mocks/node';
import { mockControl } from '../mocks/handlers';
import { MOCK_PASSWORD } from '../mocks/seed';
import { renderApp, signIn, usernameLabel } from '../test/render';

const usernameField = () => screen.findByLabelText(usernameLabel());

describe('H01 sign-in (US-001)', () => {
  it('deep link while signed out → login, then back to the page if the role may open it (AC2)', async () => {
    const { user } = renderApp('/settings/parameters');
    expect(await usernameField()).toBeInTheDocument();
    await signIn(user, 'qa.fdl');
    expect(await screen.findByRole('heading', { name: /Tham số quy tắc/ })).toBeInTheDocument();
  });

  it('wrong password → one generic sentence, password cleared (SR-AUTH-04)', async () => {
    const { user } = renderApp('/login');
    await signIn(user, 'qa.fd', 'not-the-password');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tên đăng nhập hoặc mật khẩu không đúng',
    );
    expect(screen.getByLabelText(/^Mật khẩu/)).toHaveValue('');
  });

  it('429 RATE_LIMITED → minutes from Retry-After and the button locks', async () => {
    mockControl.db.loginFailures = 5;
    const { user } = renderApp('/login');
    await signIn(user, 'qa.fd');
    expect(await screen.findByRole('alert')).toHaveTextContent('Chờ 15 phút');
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeDisabled();
  });

  it('500 → error.server with the request reference (never the raw detail)', async () => {
    server.use(
      http.post('*/v1/auth/login', () =>
        HttpResponse.json(
          {
            type: 't',
            title: 't',
            status: 500,
            code: 'INTERNAL_ERROR',
            detail: 'SQL boom',
            requestId: 'req-500',
          },
          { status: 500, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp('/login');
    await signIn(user, 'qa.fd');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('req-500');
    expect(alert).not.toHaveTextContent('SQL boom');
  });

  it('temporary password → forced change screen; mismatch is caught; success lands on Hôm nay (AC4)', async () => {
    const { user } = renderApp('/');
    await signIn(user, 'qa.temp');
    expect(
      await screen.findByRole('heading', { name: 'Đặt mật khẩu của bạn' }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Mật khẩu hiện tại/), MOCK_PASSWORD);
    await user.type(screen.getByLabelText(/^Mật khẩu mới/), 'mat-khau-moi-123');
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu mới/), 'khac-han');
    await user.tab();
    expect(await screen.findByText('Hai mật khẩu chưa giống nhau.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Nhập lại mật khẩu mới/));
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu mới/), 'mat-khau-moi-123');
    await user.click(screen.getByRole('button', { name: 'Lưu và vào ứng dụng' }));
    expect(await screen.findByRole('heading', { level: 1, name: /Hôm nay/ })).toBeInTheDocument();
  });

  it('wrong current password → error under that field', async () => {
    const { user } = renderApp('/');
    await signIn(user, 'qa.temp');
    await screen.findByRole('heading', { name: 'Đặt mật khẩu của bạn' });
    await user.type(screen.getByLabelText(/Mật khẩu hiện tại/), 'sai-mat-khau');
    await user.type(screen.getByLabelText(/^Mật khẩu mới/), 'mat-khau-moi-123');
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu mới/), 'mat-khau-moi-123');
    await user.click(screen.getByRole('button', { name: 'Lưu và vào ứng dụng' }));
    expect(await screen.findByText('Mật khẩu hiện tại chưa đúng.')).toBeInTheDocument();
  });

  it('MFA_REQUIRED keeps the user on the login page with the R3 note', async () => {
    server.use(
      http.post('*/v1/auth/login', () =>
        HttpResponse.json(
          { type: 't', title: 't', status: 401, code: 'MFA_REQUIRED' },
          { status: 401, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp('/login');
    await signIn(user, 'qa.owner');
    expect(await screen.findByText(/Nhập mã trong ứng dụng xác thực/)).toBeInTheDocument();
  });

  it('DEVICE_NOT_TRUSTED on login → device message', async () => {
    server.use(
      http.post('*/v1/auth/login', () =>
        HttpResponse.json(
          { type: 't', title: 't', status: 403, code: 'DEVICE_NOT_TRUSTED' },
          { status: 403, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp('/login');
    await signIn(user, 'qa.fd');
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Máy này chưa được cấp quyền')).toBeInTheDocument();
  });

  it('session expiring mid-work → login with the "phiên đã hết" note, then back to the page', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    expect(await screen.findByRole('heading', { name: /Danh mục căn/ })).toBeInTheDocument();
    mockControl.signInAs('nobody'); // server forgot the session
    await user.click(screen.getAllByRole('button', { name: /Sửa 101/ })[0]!);
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByText(/Phiên đăng nhập đã hết/)).toBeInTheDocument();
    await signIn(user, 'qa.owner');
    expect(await screen.findByRole('heading', { name: /Danh mục căn/ })).toBeInTheDocument();
  });

  it('logout from the user menu returns to the login page', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: /Hạnh · Lễ tân/ }));
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    expect(await usernameField()).toBeInTheDocument();
    await waitFor(() => expect(mockControl.db.sessionUserId).toBeNull());
  });

  it('never stores session or CSRF tokens in Web Storage (TC-SEC-020)', async () => {
    const { user } = renderApp('/login');
    await signIn(user, 'qa.fd');
    await screen.findByRole('heading', { level: 1, name: /Hôm nay/ });
    const dump = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(dump).not.toMatch(/csrf|ottimo_sid/i);
  });
});
