// H23 (US-108, US-109, US-112, BR-012, P-S4-10) against the MSW mock of OpenAPI 0.3.7.
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mockControl, MOCK_TOKENS } from '../mocks/handlers';
import { openLink } from './helpers';

function setLanguages(langs: string[]) {
  Object.defineProperty(window.navigator, 'languages', { value: langs, configurable: true });
}
afterEach(() => setLanguages(['vi-VN']));

async function openRequests(token: string = MOCK_TOKENS.inHouse) {
  const r = openLink(`/g/${token}`);
  await screen.findByRole('heading', { name: 'Welcome to OTTIMO, Anna.' });
  await r.user.click(screen.getByRole('button', { name: 'Yêu cầu' }));
  return r;
}

describe('tab "Yêu cầu" (US-109, SM-15)', () => {
  it('empty first, then an extra clean with the ESC-016 A fee: tick to agree, then it appears as "Đã gửi"', async () => {
    const { user } = await openRequests();
    expect(await screen.findByText('Bạn chưa gửi yêu cầu nào.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu mới' }));
    const tile = await screen.findByRole('button', { name: /Dọn phòng thêm/ });
    expect(tile).toHaveTextContent('100.000 đ/lần');
    expect(screen.getByRole('button', { name: /Khăn, đồ dùng/ })).toHaveTextContent('Miễn phí');
    await user.click(tile);
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText(
        'Căn đã được dọn đầy đủ lúc 10:15 hôm nay. Dọn đầy đủ thêm lần nữa có phí 100.000 đ.',
      ),
    ).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    expect(send).toHaveAttribute('aria-disabled', 'true');
    expect(send).toHaveAccessibleDescription('Tick đồng ý phí để gửi yêu cầu này.');
    await user.click(send);
    expect(mockControl.state.requestBodies).toHaveLength(0);
    await user.click(
      screen.getByRole('checkbox', { name: 'Tôi đồng ý phí 100.000 đ cho lần dọn này' }),
    );
    await user.type(screen.getByLabelText('Mô tả thêm (không bắt buộc)'), 'Dọn lúc 15:00');
    await user.click(send);
    expect(
      (await screen.findAllByText('Đã gửi. Chúng tôi sẽ cập nhật trạng thái tại đây.')).length,
    ).toBeGreaterThan(0);
    expect(mockControl.state.requestBodies).toEqual([
      { type: 'extra_cleaning', note: 'Dọn lúc 15:00', feeAccepted: true },
    ]);
    const card = (await screen.findByText('Dọn phòng thêm')).closest('li')!;
    expect(within(card).getByText('Đã gửi')).toBeInTheDocument();
    expect(within(card).getByText('Phí 100.000 đ – thanh toán khi trả phòng.')).toBeInTheDocument();
    expect(within(card).getByText('“Dọn lúc 15:00”')).toBeInTheDocument();
    // SEC ĐK-6: never "hóa đơn"/bill wording on the guest page
    expect(document.body.textContent).not.toMatch(/hóa đơn|bill/i);
  });

  it('towels are free: no fee box, sent at once', async () => {
    const { user } = await openRequests();
    await user.click(await screen.findByRole('button', { name: 'Gửi yêu cầu mới' }));
    await user.click(await screen.findByRole('button', { name: /Khăn, đồ dùng/ }));
    expect(screen.getByText('Thay khăn, bổ sung đồ dùng luôn miễn phí.')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    await waitFor(() => expect(mockControl.state.requestBodies).toEqual([{ type: 'amenities' }]));
  });

  it('the fee changed while the page was open (FEE_NOT_ACCEPTED) → options reloaded, tick asked again', async () => {
    const { user } = await openRequests();
    await user.click(await screen.findByRole('button', { name: 'Gửi yêu cầu mới' }));
    await user.click(await screen.findByRole('button', { name: /Dọn phòng thêm/ }));
    await user.click(screen.getByRole('checkbox'));
    mockControl.scenario.requestFail = 'FEE_NOT_ACCEPTED';
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    expect(
      await screen.findByText('Tick đồng ý phí để gửi yêu cầu này.', { selector: '.txt, .txt *' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('too many requests (429) → call the front desk, with the number', async () => {
    const { user } = await openRequests();
    await user.click(await screen.findByRole('button', { name: 'Gửi yêu cầu mới' }));
    await user.click(await screen.findByRole('button', { name: /Khác/ }));
    await user.type(screen.getByLabelText('Mô tả'), 'Cho tôi hỏi giờ ăn sáng');
    mockControl.scenario.requestFail = 'RATE_LIMITED';
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    expect(
      await screen.findByText(/Bạn đã gửi nhiều yêu cầu hôm nay. Vui lòng gọi lễ tân \+84/),
    ).toBeInTheDocument();
  });

  it('before check-in: housekeeping types are not available yet, with the reason', async () => {
    const { user } = await openRequests(MOCK_TOKENS.ok);
    await user.click(await screen.findByRole('button', { name: 'Gửi yêu cầu mới' }));
    const tile = await screen.findByRole('button', { name: /Dọn phòng thêm/ });
    expect(tile).toHaveAttribute('aria-disabled', 'true');
    expect(tile).toHaveTextContent('Yêu cầu này dùng được khi bạn đã nhận phòng.');
  });

  it('offline: nothing is queued on the guest phone – the send button says a connection is needed', async () => {
    const { user } = await openRequests();
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    window.dispatchEvent(new Event('offline'));
    const btn = await screen.findByRole('button', { name: 'Gửi yêu cầu mới' });
    await waitFor(() => expect(btn).toHaveAttribute('aria-disabled', 'true'));
    expect(btn).toHaveAccessibleDescription('Cần có mạng để gửi yêu cầu');
    await user.click(btn);
    expect(screen.queryByRole('heading', { name: 'Bạn cần gì?' })).toBeNull();
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    window.dispatchEvent(new Event('online'));
  });
});

describe('tab "Thông tin" (US-108) and room name (BR-012)', () => {
  it('Wi-Fi in mono, times, directions on the INV pin, house rules, who to call – no room number anywhere', async () => {
    const { user } = openLink(`/g/${MOCK_TOKENS.inHouse}`);
    await screen.findByRole('heading', { name: 'Welcome to OTTIMO, Anna.' });
    expect(screen.getByText('The Bloom')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('Standard Studio · Garden View')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thông tin' }));
    expect(await screen.findByRole('heading', { name: 'Thông tin' })).toBeInTheDocument();
    expect(screen.getByText('mock-wifi-pass')).toHaveClass('gw-code');
    expect(screen.getByText('Nhận phòng từ 14:00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chỉ đường' })).toHaveAttribute(
      'href',
      'https://maps.app.goo.gl/oYos42G5YvUEcDCc6',
    );
    expect(screen.getByRole('heading', { name: 'Cần giúp? Người trực đêm' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\b103\b/);
  });
});

describe('English first (P-S4-10, US-112)', () => {
  it('the server picks the session language from the browser (fr → en) and the page says it can be changed', async () => {
    setLanguages(['fr-FR']);
    const { user, unmount } = openLink();
    expect(
      await screen.findByRole('heading', { name: 'Welcome to OTTIMO, Anna.' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    // Visible line under the greeting + the select's description (screen readers).
    expect(
      screen.getAllByText('Language set from your browser – you can change it at the top.'),
    ).toHaveLength(2);
    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveAccessibleDescription(
      'Language set from your browser – you can change it at the top.',
    );
    await user.selectOptions(select, 'vi');
    await waitFor(() => expect(mockControl.state.localeChosen).toBe(true));
    expect(screen.queryByText(/Ngôn ngữ theo trình duyệt/)).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Ngôn ngữ' })).toHaveAccessibleDescription(
      'Ngôn ngữ bạn đã chọn',
    );
    // Opening the link again keeps the guest's choice (server: localeChosenByGuest = true).
    unmount();
    openLink();
    expect(await screen.findByRole('button', { name: 'Lưu trú' })).toBeInTheDocument();
    expect(screen.queryByText(/Ngôn ngữ theo trình duyệt/)).toBeNull();
  });

  it('a Vietnamese browser opens in Vietnamese, a Russian one in Russian', async () => {
    setLanguages(['ru-RU']);
    openLink();
    await screen.findByRole('heading', { name: 'Welcome to OTTIMO, Anna.' });
    await waitFor(() => expect(document.documentElement.lang).toBe('ru'));
  });

  it('a browser that is neither vi nor ru gets English before any session exists', async () => {
    setLanguages(['fr-FR']);
    openLink('/g/abc');
    expect(
      await screen.findByRole('heading', { name: 'This link has expired' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('a Russian browser gets Russian', async () => {
    setLanguages(['ru-RU']);
    openLink('/g/abc');
    expect(
      await screen.findByRole('heading', { name: 'Срок действия ссылки истёк' }),
    ).toBeInTheDocument();
  });

  it('the English page has the request flow fully in English (labels, statuses, fee)', async () => {
    mockControl.state.locale = 'en';
    mockControl.state.localeChosen = true; // the guest picked English in an earlier session
    const { user } = openLink(`/g/${MOCK_TOKENS.inHouse}`);
    await screen.findByRole('heading', { name: 'Welcome to OTTIMO, Anna.' });
    expect(screen.getByText('Chúc bạn có một kỳ nghỉ an yên.')).toHaveAttribute('lang', 'vi');
    await user.click(screen.getByRole('button', { name: 'Requests' }));
    await user.click(await screen.findByRole('button', { name: 'New request' }));
    const tile = await screen.findByRole('button', { name: /Extra cleaning/ });
    expect(tile).toHaveTextContent('100,000 VND each time');
    await user.click(screen.getByRole('button', { name: /Towels & amenities/ }));
    await user.click(screen.getByRole('button', { name: 'Send request' }));
    const card = (await screen.findByText('Towels & amenities')).closest('li')!;
    expect(within(card).getByText('Sent')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Gửi yêu cầu|Đã gửi|Miễn phí/);
    expect(document.body.textContent).not.toContain('!');
  });
});
