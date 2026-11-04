import type { LandingLocale } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { guestPrefillOf } from '../pages/webreq/ContactMatches';
import { sendLocaleOf } from '../pages/webreq/labels';
import { renderApp, tv } from '../test/render';

/**
 * R4 LP-v2 – Kiểm thử, sửa lỗi FE-A lượt 4 (PO lp-v2-stories mục 9.1 B3–B5; CPY lp-v2-copy 15.1). Fake data only.
 * - BUG-R4-007 (US-175 AC3, AC5): S35 column "Ngôn ngữ", language filter combined with the status chips, and the
 *   total matching the filters from the server (`total`, OpenAPI 0.3.10 bổ sung 4) – not the loaded pages.
 * - BUG-R4-008 (US-175 AC4 (2)): "Guest wrote in Korean – send messages in English." under "Language for the guest"
 *   and under the deposit card of the hold step, for ko / zh / ru requests.
 * - BUG-R4-008 profile + BUG-R3-050 (US-175 AC4 (3)): a profile quick-created from a request keeps the send language
 *   (en for ko/zh, ru for ru), the contact and channel, no "Viet Nam"; a reopened quote does not fall back to
 *   Vietnamese; an existing profile is never changed (PO P8).
 */
const req = (code: string) => mockControl.webRequests.requests.find((r) => r.refCode === code)!;
const W = 'W7K3QX9P';

/** n more fake requests in `locale` (status `new`), cloned from a seed request. */
function addRequests(locale: LandingLocale, n: number, status: 'new' | 'converted' = 'new') {
  const base = req(W);
  for (let i = 0; i < n; i += 1) {
    const k = mockControl.webRequests.requests.length + 1;
    mockControl.webRequests.requests.push({
      ...base,
      id: `0192a1b0-0000-7000-8000-${String(19000 + k).padStart(12, '0')}`,
      refCode: `K${String(k).padStart(7, '0')}`,
      locale,
      status,
      aliasRefCodes: [],
    });
  }
}

describe('BUG-R4-007 – S35 language column, filter and total (US-175 AC3, AC5)', () => {
  it('column "Ngôn ngữ" shows the Vietnamese label of each request', async () => {
    req(W).locale = 'ko';
    renderApp('/website-requests', 'qa.fd');
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Ngôn ngữ' })).toBeInTheDocument();
    const row = within(table).getByRole('button', { name: W }).closest('tr')!;
    expect(within(row).getByText('Tiếng Hàn')).toBeInTheDocument();
    expect(within(table).queryByText(/webreq\.locale\./)).not.toBeInTheDocument();
    expect(translate('en', 'webreq.col.locale')).toBe('Language');
  });

  it('filter by one language: only that language, with the number matching the filters', async () => {
    req(W).locale = 'zh';
    addRequests('zh', 2);
    const { user } = renderApp('/website-requests', 'qa.fd');
    await screen.findByRole('table');
    await user.selectOptions(screen.getByLabelText(tv('webreq.filter_locale')), 'zh');
    expect(await screen.findByText(tv('webreq.total', { n: 3 }))).toHaveAttribute('role', 'status');
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    for (const r of rows) expect(r).toHaveTextContent('Tiếng Trung (giản thể)');
    // Clear filters → every language again.
    await user.click(screen.getByRole('button', { name: tv('webreq.clear_filters') }));
    expect(screen.getByLabelText(tv('webreq.filter_locale'))).toHaveValue('');
  });

  it('combined with the status chips (converted included); the total does not depend on the loaded page', async () => {
    addRequests('ru', 55);
    addRequests('ru', 2, 'converted');
    const sent: string[] = [];
    const on = ({ request }: { request: Request }) => {
      if (/\/website-booking-requests\?/.test(request.url)) sent.push(request.url);
    };
    server.events.on('request:start', on);
    try {
      const { user } = renderApp('/website-requests', 'qa.owner');
      await screen.findByRole('table');
      await user.selectOptions(screen.getByLabelText(tv('webreq.filter_locale')), 'ru');
      // 55 new + the seed request M2PN4R8T (ru, in progress) – more than one page of 50.
      expect(await screen.findByText(tv('webreq.total', { n: 56 }))).toHaveAttribute(
        'role',
        'status',
      );
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(51);
      await user.click(screen.getByRole('button', { name: tv('webreq.status.converted') }));
      expect(await screen.findByText(tv('webreq.total', { n: 58 }))).toHaveAttribute(
        'role',
        'status',
      );
      const last = new URL(sent.at(-1)!);
      expect(last.searchParams.get('locale')).toBe('ru');
      expect(last.searchParams.get('status')).toBe('new,in_progress,converted');
    } finally {
      server.events.removeListener('request:start', on);
    }
  });

  it('"Only mine" filters the loaded rows here – no server total is shown for it', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await screen.findByRole('table');
    expect(await screen.findByText(tv('webreq.total', { n: 3 }))).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: tv('webreq.only_mine') }));
    expect(screen.queryByText(/yêu cầu khớp bộ lọc$/)).not.toBeInTheDocument();
  });
});

/** Opens the request, quotes it on room 203 for a NEW profile made with "Tạo nhanh khách". */
async function quoteWithNewGuest(code: string, name: string) {
  const { user } = renderApp('/website-requests', 'qa.fd');
  await user.click(await screen.findByRole('button', { name: code }));
  const drawer = await screen.findByRole('dialog');
  await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
  const dlg = await screen.findByRole('dialog', {
    name: new RegExp(`Báo giá cho yêu cầu ${code}`),
  });
  await user.type(within(dlg).getByRole('combobox', { name: /Khách đứng tên/ }), name);
  await user.click(
    await screen.findByRole('option', { name: tv('crm.quick_create', { q: name }) }),
  );
  const form = await screen.findByRole('dialog', { name: tv('crm.title_new') });
  return { user, dlg, form };
}

function webRequestFor(locale: LandingLocale, phone: string) {
  Object.assign(req(W), {
    locale,
    phone,
    preferredChannel: 'zalo',
    arrival: addDays(todayLocal(), 40),
    departure: addDays(todayLocal(), 42),
  });
}

describe('BUG-R4-008 / BUG-R3-050 – send language on the quote, hold and new profile (US-175 AC4)', () => {
  it.each([
    ['ko', 'en', 'English'],
    ['zh', 'en', 'English'],
    ['ru', 'ru', 'Русский'],
  ] as const)(
    '%s request: new profile keeps "%s"; note under the language box and under the deposit card',
    async (locale, send, button) => {
      webRequestFor(locale, '+84905999111');
      const { user, dlg, form } = await quoteWithNewGuest(W, 'Test Guest');
      // The quick-create form starts from the request: contact, channel, send language; no "Viet Nam".
      expect(within(form).getByLabelText(/Số điện thoại/)).toHaveValue('+84905999111');
      expect(within(form).getByLabelText(tv('crm.f_pref'))).toHaveValue('zalo');
      expect(within(form).getByLabelText(tv('crm.f_lang'))).toHaveValue(send);
      expect(within(form).getByLabelText(tv('crm.f_nat'))).toHaveValue('');
      await user.click(within(form).getByRole('button', { name: 'Lưu hồ sơ' }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: tv('crm.title_new') })).toBeNull(),
      );
      const guest = mockControl.db.guests.at(-1)!;
      expect(guest).toMatchObject({ fullName: 'Test Guest', preferredLocale: send });
      expect(guest.nationalityCode).toBeUndefined();

      const room = mockControl.db.rooms.find((r) => r.roomNo === '203')!;
      await user.selectOptions(within(dlg).getByLabelText(/^Căn/), room.id);
      expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
      await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
      const sendStep = await screen.findByRole('dialog', { name: /BG-000\d+/ });
      expect(within(sendStep).getByRole('button', { name: button })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      const note = tv(`sale.text_lang_note.${locale}`);
      expect(within(sendStep).getByText(note)).toBeInTheDocument();
      // Still true after staff switch the box (a reminder, not a statement of the box).
      await user.click(within(sendStep).getByRole('button', { name: 'Tiếng Việt' }));
      expect(within(sendStep).getByText(note)).toBeInTheDocument();
      await user.click(within(sendStep).getByRole('button', { name: 'Khách đồng ý – Giữ chỗ' }));
      const hold = await screen.findByRole('dialog', { name: 'Giữ chỗ' });
      expect(within(hold).getByText(note)).toBeInTheDocument();
      await user.click(within(hold).getByRole('button', { name: 'Tạo giữ chỗ' }));
      expect(await within(hold).findByText(/Đã giữ căn 203 – đơn OTM-0\d+/)).toBeInTheDocument();
      expect(within(hold).getByText(note)).toBeInTheDocument();
    },
  );

  it('EN/VI request: no note; the new profile keeps en (BUG-R3-050 – English request)', async () => {
    webRequestFor('en', '+84905999222');
    const { user, dlg, form } = await quoteWithNewGuest(W, 'Test Guest');
    expect(within(form).getByLabelText(tv('crm.f_lang'))).toHaveValue('en');
    await user.click(within(form).getByRole('button', { name: 'Lưu hồ sơ' }));
    await waitFor(() => expect(mockControl.db.guests.at(-1)!.preferredLocale).toBe('en'));
    const room = mockControl.db.rooms.find((r) => r.roomNo === '203')!;
    await user.selectOptions(within(dlg).getByLabelText(/^Căn/), room.id);
    expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    const sendStep = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    expect(within(sendStep).getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(sendStep).queryByText(/^Khách viết bằng/)).not.toBeInTheDocument();
  });

  it('reopened quote (Báo giá & giữ chỗ → Báo giá) keeps the request language and the note – not Vietnamese', async () => {
    webRequestFor('ko', '+84905999333');
    const { user, dlg, form } = await quoteWithNewGuest(W, 'Test Guest');
    await user.click(within(form).getByRole('button', { name: 'Lưu hồ sơ' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: tv('crm.title_new') })).toBeNull(),
    );
    const room = mockControl.db.rooms.find((r) => r.roomNo === '203')!;
    await user.selectOptions(within(dlg).getByLabelText(/^Căn/), room.id);
    expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    await screen.findByRole('dialog', { name: /BG-000\d+/ });
    const code = mockControl.rsv.quotes.at(-1)!.code;
    cleanup();

    const again = renderApp('/quotes', 'qa.fd');
    await again.user.click(await screen.findByRole('tab', { name: tv('nav.my_quotes') }));
    await again.user.click(await screen.findByRole('button', { name: code }));
    const reopened = await screen.findByRole('dialog', { name: new RegExp(code) });
    await waitFor(() =>
      expect(within(reopened).getByRole('button', { name: 'English' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(
      await within(reopened).findByText(/OTTIMO Boutique Stay – Quote BG-/),
    ).toBeInTheDocument();
    expect(within(reopened).getByText(tv('sale.text_lang_note.ko'))).toBeInTheDocument();
  });

  it('reopened quote with no website request: the guest profile language (ru)', async () => {
    const guest = mockControl.db.guests.find((g) => g.code === 'KH-0012')!;
    guest.preferredLocale = 'ru';
    // A quote made in the quotes screen (no request): reopen it from the list.
    webRequestFor('vi', '+84905999444');
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: W }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
    const dlg = await screen.findByRole('dialog', { name: /Báo giá cho yêu cầu/ });
    await user.type(within(dlg).getByRole('combobox', { name: /Khách đứng tên/ }), 'Đỗ Mai');
    await user.click(await screen.findByRole('option', { name: /Đỗ Mai Anh/ }));
    const room = mockControl.db.rooms.find((r) => r.roomNo === '203')!;
    await user.selectOptions(within(dlg).getByLabelText(/^Căn/), room.id);
    expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    await screen.findByRole('dialog', { name: /BG-000\d+/ });
    const q = mockControl.rsv.quotes.at(-1)!;
    delete (q as { websiteBookingRequestId?: string }).websiteBookingRequestId;
    cleanup();

    const again = renderApp('/quotes', 'qa.fd');
    await again.user.click(await screen.findByRole('tab', { name: tv('nav.my_quotes') }));
    await again.user.click(await screen.findByRole('button', { name: q.code }));
    const reopened = await screen.findByRole('dialog', { name: new RegExp(q.code) });
    await waitFor(() =>
      expect(within(reopened).getByRole('button', { name: 'Русский' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(within(reopened).queryByText(/^Khách viết bằng/)).not.toBeInTheDocument();
  });

  it('an existing profile chosen for a ko request is never changed (PO P8)', async () => {
    webRequestFor('ko', '+84905123456'); // the phone of seed guest KH-0012 → suggested
    const guest = mockControl.db.guests.find((g) => g.code === 'KH-0012')!;
    guest.preferredLocale = 'vi';
    const before = guest.version;
    const patches: string[] = [];
    const on = ({ request }: { request: Request }) => {
      if (request.method === 'PATCH' && /\/guests\//.test(request.url)) patches.push(request.url);
    };
    server.events.on('request:start', on);
    try {
      const { user } = renderApp('/website-requests', 'qa.fd');
      await user.click(await screen.findByRole('button', { name: W }));
      const drawer = await screen.findByRole('dialog');
      await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
      const dlg = await screen.findByRole('dialog', { name: /Báo giá cho yêu cầu/ });
      await user.click(await within(dlg).findByRole('button', { name: tv('webreq.pick') }));
      const room = mockControl.db.rooms.find((r) => r.roomNo === '203')!;
      await user.selectOptions(within(dlg).getByLabelText(/^Căn/), room.id);
      expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
      await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
      const sendStep = await screen.findByRole('dialog', { name: /BG-000\d+/ });
      // The quote itself still goes out in English (request language); the profile keeps vi.
      expect(within(sendStep).getByRole('button', { name: 'English' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(patches).toEqual([]);
      expect(guest).toMatchObject({ preferredLocale: 'vi', version: before });
    } finally {
      server.events.removeListener('request:start', on);
    }
  });
});

describe('helpers', () => {
  it('sendLocaleOf: ko/zh → en, others unchanged', () => {
    expect(['en', 'vi', 'ko', 'zh', 'ru'].map((l) => sendLocaleOf(l as LandingLocale))).toEqual([
      'en',
      'vi',
      'en',
      'en',
      'ru',
    ]);
  });

  it('guestPrefillOf: channel only when the profile has that contact; WhatsApp gets the number', () => {
    expect(
      guestPrefillOf({
        id: 'x',
        code: 'C',
        contact: { phone: '+84905000111' },
        locale: 'zh',
        channel: 'whatsapp',
      }),
    ).toEqual({
      nationalityCode: '',
      preferredLocale: 'en',
      phone: '+84905000111',
      preferredContact: 'whatsapp',
      whatsapp: '+84905000111',
    });
    expect(
      guestPrefillOf({
        id: 'x',
        code: 'C',
        contact: { phone: '+79000000000' },
        channel: 'telegram',
      }),
    ).toEqual({ nationalityCode: '', phone: '+79000000000' });
    expect(guestPrefillOf(undefined)).toBeUndefined();
  });

  it('the Desk note exists in vi and en for ko, zh, ru (CPY 15.1)', () => {
    for (const l of ['ko', 'zh', 'ru'])
      for (const lang of ['vi', 'en'] as const)
        expect(translate(lang, `sale.text_lang_note.${l}`)).not.toMatch(/^sale\./);
  });
});
