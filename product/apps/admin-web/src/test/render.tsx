import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { translate } from '@ottimo/i18n';
import { MemoryRouter } from 'react-router-dom';
import { Providers } from '../app/Providers';
import { AppRoutes } from '../app/routes';
import { mockControl } from '../mocks/handlers';
import { MOCK_PASSWORD } from '../mocks/seed';

/** UXD string in Vietnamese – tests read copy from the string files, never hard-coded (FB-R2-UXD-FE-S2-16). */
export const tv = (key: string, args?: Record<string, string | number>) =>
  translate('vi', key, args);

/** Login field label read from the UXD strings (a copy change must not break tests – FB-R2-QA-FE-02). */
export const usernameLabel = () =>
  new RegExp(`^${translate('vi', 'auth.login.username').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

/** Render the whole app at `path`, optionally already signed in as a mock user (qa.*). */
export function renderApp(path = '/', as?: string) {
  if (as) mockControl.signInAs(as);
  const user = userEvent.setup();
  const utils = render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  );
  return { user, ...utils };
}

export async function signIn(
  user: ReturnType<typeof userEvent.setup>,
  username: string,
  password = MOCK_PASSWORD,
) {
  await user.type(await screen.findByLabelText(usernameLabel()), username);
  await user.type(screen.getByLabelText(/^Mật khẩu/), password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}
