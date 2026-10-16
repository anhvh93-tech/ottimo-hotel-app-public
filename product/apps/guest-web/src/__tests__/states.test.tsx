import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl, MOCK_TOKENS } from '../mocks/handlers';
import { openLink } from './helpers';

describe('guest-web page states (EP06 8.4, EP14 2.3, H18 18.5)', () => {
  it('malformed link → expired page without any request (anti link-guessing)', async () => {
    openLink('/g/abc');
    expect(await screen.findByRole('heading', { name: 'Liên kết đã hết hạn' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    expect(mockControl.state.calls).toEqual([]);
  });

  it('expired / revoked link → 401 GUEST_LINK_INVALID page', async () => {
    openLink(`/g/${MOCK_TOKENS.expired}`);
    expect(await screen.findByRole('heading', { name: 'Liên kết đã hết hạn' })).toBeInTheDocument();
    expect(screen.getByText(/Nhắn OTTIMO để nhận liên kết mới/)).toBeInTheDocument();
  });

  it('no token and no session cookie → expired page', async () => {
    openLink('/');
    expect(await screen.findByRole('heading', { name: 'Liên kết đã hết hạn' })).toBeInTheDocument();
  });

  it('reload with a live session cookie still opens the stay (no name: booking code heading)', async () => {
    mockControl.openSession();
    openLink('/');
    expect(await screen.findByRole('heading', { name: 'OTM-0150' })).toBeInTheDocument();
  });

  it('checked-out stay → thank-you page without any bill wording (ĐK-6)', async () => {
    openLink(`/g/${MOCK_TOKENS.ended}`);
    expect(
      await screen.findByRole('heading', { name: 'Cảm ơn bạn đã lưu trú' }),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/thanh toán khoản phát sinh/);
  });

  it('online check-in closed → no CTA, "Lễ tân đã nhận giấy tờ"', async () => {
    openLink(`/g/${MOCK_TOKENS.closed}`);
    expect(await screen.findByText('Lễ tân đã nhận giấy tờ của bạn')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Làm thủ tục trước' })).not.toBeInTheDocument();
  });

  it('in-house: Wi-Fi shown with copy button, still no door code', async () => {
    openLink(`/g/${MOCK_TOKENS.inHouse}`);
    expect(await screen.findByText('OTTIMO-103')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sao chép mật khẩu' })).toBeInTheDocument();
  });

  it('level-2 keys leaked by the server are dropped before rendering (ĐK-2)', async () => {
    mockControl.reset({ leakLevel2: true });
    openLink();
    await screen.findByRole('heading', { name: 'Xin chào, Anna' });
    expect(document.body.textContent).not.toContain('582913');
    expect(document.body.textContent).not.toContain('Anna Martin');
  });

  it('switching language calls setGuestLocale and re-renders (EN, RU with EN fallback)', async () => {
    const { user } = openLink();
    await screen.findByRole('heading', { name: 'Xin chào, Anna' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ngôn ngữ' }), 'en');
    expect(await screen.findByRole('heading', { name: 'Hello, Anna' })).toBeInTheDocument();
    await waitFor(() => expect(mockControl.state.locale).toBe('en'));
    expect(document.documentElement.lang).toBe('en');
    await user.click(screen.getByRole('button', { name: 'Info' }));
    expect(await screen.findByText(/No smoking inside the unit/)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'ru');
    expect(await screen.findByText(/Русская версия скоро/)).toBeInTheDocument();
    await waitFor(() => expect(mockControl.state.locale).toBe('ru'));
    expect(localStorage.length).toBe(0);
  });

  it('directions link opens a vetted map host with noopener noreferrer', async () => {
    openLink();
    const link = await screen.findByRole('link', { name: 'Chỉ đường' });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.getAttribute('href')).toMatch(/^https:\/\/maps\.google\.com\//);
  });
});
