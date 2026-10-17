import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl, MOCK_TOKENS } from '../mocks/handlers';
import { GuestI18nProvider } from '../app/i18n';
import { TerminalPage } from '../pages/TerminalPage';
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

  it('reload with a live session cookie still opens the stay (no name: plain greeting)', async () => {
    mockControl.openSession();
    openLink('/');
    expect(await screen.findByRole('heading', { name: 'Welcome to OTTIMO.' })).toBeInTheDocument();
    expect(screen.getByText('OTM-0150')).toBeInTheDocument();
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
    // G5: Wi-Fi name and password in JetBrains Mono 16 px
    expect(await screen.findByText('OTTIMO-Guest')).toHaveClass('gw-code');
    expect(screen.getByText('mock-wifi-pass')).toHaveClass('gw-code');
    expect(screen.getByRole('button', { name: 'Sao chép mật khẩu' })).toBeInTheDocument();
  });

  it('level-2 keys leaked by the server are dropped before rendering (ĐK-2)', async () => {
    mockControl.reset({ leakLevel2: true });
    openLink();
    await screen.findByRole('heading', { name: 'Welcome to OTTIMO, Anna.' });
    expect(document.body.textContent).not.toContain('582913');
    expect(document.body.textContent).not.toContain('Anna Martin');
  });

  it('switching language calls setGuestLocale and re-renders (EN, RU with EN fallback)', async () => {
    const { user } = openLink();
    await screen.findByRole('heading', { name: 'Welcome to OTTIMO, Anna.' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ngôn ngữ' }), 'en');
    expect(await screen.findByRole('button', { name: 'My stay' })).toBeInTheDocument();
    // Brand greeting unchanged; on the English page the support line is the Vietnamese one (DS 11.2).
    expect(screen.getByRole('heading', { name: 'Welcome to OTTIMO, Anna.' })).toBeInTheDocument();
    expect(screen.getByText('Chúc bạn có một kỳ nghỉ an yên.')).toHaveAttribute('lang', 'vi');
    await waitFor(() => expect(mockControl.state.locale).toBe('en'));
    expect(document.documentElement.lang).toBe('en');
    await user.click(screen.getByRole('button', { name: 'Info' }));
    expect(await screen.findByText(/No smoking inside the unit/)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'ru');
    // decision-log 17/10: no "Russian version soon" banner anywhere (screens are in RU)
    await waitFor(() => expect(document.documentElement.lang).toBe('ru'));
    expect(document.body.textContent).not.toMatch(/Русская версия скоро/);
    await waitFor(() => expect(mockControl.state.locale).toBe('ru'));
    expect(localStorage.length).toBe(0);
  });

  it('directions link opens a vetted map host with noopener noreferrer', async () => {
    openLink();
    const link = await screen.findByRole('link', { name: 'Chỉ đường' });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // P-S4-7: the Google Maps pin INV sent 17/10, one source for every guest surface
    expect(link.getAttribute('href')).toBe('https://maps.app.goo.gl/oYos42G5YvUEcDCc6');
  });

  it('429 and checked-out pages keep a way to a real person (UXD S3-07, DS 6.11)', () => {
    const { unmount } = render(
      <GuestI18nProvider locale="vi">
        <TerminalPage which="rate_limited" minutes={3} phone="+84 263 000 000" />
      </GuestI18nProvider>,
    );
    expect(
      screen.getByRole('heading', { name: 'Bạn đã thử quá nhiều lần. Chờ 3 phút rồi thử lại.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gọi người trực' })).toHaveAttribute(
      'href',
      'tel:+84263000000',
    );
    unmount();
    render(
      <GuestI18nProvider locale="vi">
        <TerminalPage which="stay_ended" phone="+84 263 000 000" />
      </GuestI18nProvider>,
    );
    expect(screen.getByRole('link', { name: 'Gọi người trực' })).toBeInTheDocument();
  });
});
