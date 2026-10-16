import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Providers } from '../app/Providers';
import { AppRoutes } from '../app/routes';
import { mockControl } from '../mocks/handlers';
import { MOCK_PASSWORD } from '../mocks/seed';

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
  await user.type(await screen.findByLabelText(/Số điện thoại hoặc email|Tên đăng nhập/), username);
  await user.type(screen.getByLabelText(/^Mật khẩu/), password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}
