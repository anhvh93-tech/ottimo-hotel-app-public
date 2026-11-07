// v1.0.5 V5-24 (copy-v1.0.5 5.1, CPY C1 + thẻ 09) and V5-23 4.20 (a): the Russian guest page says "номер" (a hotel
// room), never the banned "апартаменты" (lp-v2-copy 16.2), and the long-stay cleaning line drops "аренда" (a lease).
// The Vietnamese page says "phòng", never the internal "căn" (FB-INV-002). Against the MSW mock (OpenAPI 0.3.7).
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { translateGuest } from '../app/i18n';
import { mockControl, MOCK_TOKENS } from '../mocks/handlers';
import { openLink } from './helpers';

const ru = (k: string, a?: Record<string, string | number>) => translateGuest('ru', k, a);
const BANNED_RU = /апартамент|квартир|посуточн/iu;

describe('V5-24 – Russian guest page', () => {
  it('home and info tabs: check-in line says "номер … готов", nothing says "апартаменты"', async () => {
    mockControl.state.locale = 'ru';
    mockControl.state.localeChosen = true;
    const { user } = openLink();
    expect(
      await screen.findAllByText('Заезд с 12:00 (номер всегда готов к 14:00)'),
    ).not.toHaveLength(0);
    expect(document.body.textContent).not.toMatch(BANNED_RU);
    await user.click(screen.getByRole('button', { name: ru('guest.tab.info') }));
    expect(
      await screen.findByText('Заезд с 12:00 (номер всегда готов к 14:00)'),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(BANNED_RU);
  });

  it('long-stay extra clean: "При долгом проживании…", no "аренда"', async () => {
    mockControl.reset({ inHouse: true, cleaningFeeReason: 'long_stay_adhoc' });
    mockControl.state.locale = 'ru';
    mockControl.state.localeChosen = true;
    const { user } = openLink(`/g/${MOCK_TOKENS.inHouse}`);
    await user.click(await screen.findByRole('button', { name: ru('guest.tab.requests') }));
    await user.click(await screen.findByRole('button', { name: ru('gw.req.new') }));
    await user.click(
      await screen.findByRole('button', { name: new RegExp(ru('guest.req.clean')) }),
    );
    expect(
      screen.getByText(
        /^При долгом проживании уборка не входит в стоимость\. Каждая уборка стоит /,
      ),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/аренд/iu);
    expect(document.body.textContent).not.toMatch(BANNED_RU);
  });
});

describe('V5-23 4.20 (a) – Vietnamese cleaning lines say "phòng"', () => {
  it('make-up clean (free): "Hôm nay phòng chưa được dọn…"', async () => {
    mockControl.reset({ inHouse: true, cleaningFee: 0, cleaningFeeReason: null });
    mockControl.state.locale = 'vi';
    mockControl.state.localeChosen = true;
    const { user } = openLink(`/g/${MOCK_TOKENS.inHouse}`);
    await user.click(await screen.findByRole('button', { name: 'Yêu cầu' }));
    await user.click(await screen.findByRole('button', { name: 'Gửi yêu cầu mới' }));
    await user.click(await screen.findByRole('button', { name: /Dọn phòng thêm/ }));
    expect(
      screen.getByText('Hôm nay phòng chưa được dọn – lần dọn này miễn phí.'),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/(?<!\p{L})căn(?!\p{L})/iu);
  });
});
