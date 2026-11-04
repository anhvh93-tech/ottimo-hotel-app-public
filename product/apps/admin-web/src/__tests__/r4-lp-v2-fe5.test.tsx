import type { LandingLocale } from '@ottimo/api-client';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Providers } from '../app/Providers';
import { writeDraft } from '../app/clientData';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { GuestPicker } from '../components/GuestPicker';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { mockQuoteText } from '../mocks/reservations';
import { GuestFormDialog, messagingHandlesOf } from '../pages/GuestFormDialog';
import { guestPrefillOf } from '../pages/webreq/ContactMatches';
import { useSession } from '../session/SessionProvider';
import { renderApp, tv } from '../test/render';

/**
 * R4 LP-v2 – Kiểm thử, sửa lỗi FE lượt 5 (fake data only, phones in the +84 900 000 xxx test range).
 * - BUG-R4-011: a profile quick-created from a request whose guest chose Zalo saves at the first click – Desk sends
 *   `messagingHandles.zalo` = the phone (server rule CONTACT_CHANNEL_EMPTY); the error sentence names the channel.
 *   Paths: quote, "Tạo đơn" (H09), long stay (H10), and a profile made by hand.
 * - BUG-R4-012 / FB-R4-ARC-FE-LPV2-05: `nationalityCode: null` on create from a request (0.3.10 bổ sung 5).
 * - FB-R4-ARC-FE-LPV2-06: a request prefill beats an old draft.
 * - UXD FE-18 … FE-23.
 */
const req = (code: string) => mockControl.webRequests.requests.find((r) => r.refCode === code)!;
const W = 'W7K3QX9P';
const LONG = '7K3QX9MD';

/** POST /guests bodies sent while `run` runs. */
async function guestPosts(run: () => Promise<void>) {
  const bodies: Array<Promise<Record<string, unknown>>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && /\/guests$/.test(new URL(request.url).pathname))
      bodies.push(request.clone().json() as Promise<Record<string, unknown>>);
  };
  server.events.on('request:start', on);
  try {
    await run();
  } finally {
    server.events.removeListener('request:start', on);
  }
  return Promise.all(bodies);
}

function zaloRequest(code: string, locale: LandingLocale, phone: string) {
  Object.assign(req(code), {
    locale,
    phone,
    email: undefined,
    preferredChannel: 'zalo',
    arrival: addDays(todayLocal(), 40),
  });
  if (code === W) req(code).departure = addDays(todayLocal(), 42);
}

type User = ReturnType<typeof userEvent.setup>;

/** Type a name in "Khách đứng tên", "Tạo nhanh khách …", then save the new profile as it is prefilled. */
async function quickCreate(user: User, scope: HTMLElement, name: string) {
  await user.type(within(scope).getByRole('combobox', { name: /Khách đứng tên/ }), name);
  await user.click(
    await screen.findByRole('option', { name: tv('crm.quick_create', { q: name }) }),
  );
  const form = await screen.findByRole('dialog', { name: tv('crm.title_new') });
  expect(within(form).getByLabelText(tv('crm.f_pref'))).toHaveValue('zalo');
  expect(within(form).getByLabelText(tv('crm.f_nat'))).toHaveValue('');
  await user.click(within(form).getByRole('button', { name: tv('crm.save') }));
  // Saved at the first click (QA: 422 CONTACT_CHANNEL_EMPTY before).
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: tv('crm.title_new') })).toBeNull(),
  );
}

function expectZaloProfile(
  body: Record<string, unknown>,
  phone: string,
  locale: 'en' | 'ru' | 'vi',
) {
  expect(body).toMatchObject({
    phone,
    preferredContact: 'zalo',
    messagingHandles: { zalo: phone },
    preferredLocale: locale,
    nationalityCode: null,
  });
  const guest = mockControl.db.guests.at(-1)!;
  expect(guest).toMatchObject({ preferredContact: 'zalo', preferredLocale: locale });
  expect(guest.nationalityCode).toBeUndefined();
  expect(guest.isForeigner).toBe(false);
}

describe('BUG-R4-011 / BUG-R4-012 – quick-created profile from a Zalo request', () => {
  it.each([
    ['ko', 'en'],
    ['en', 'en'],
    ['ru', 'ru'],
  ] as const)(
    'quote (%s request): saves at once with Zalo, send language %s, nationality null',
    async (locale, send) => {
      zaloRequest(W, locale, '+84900000121');
      const bodies = await guestPosts(async () => {
        const { user } = renderApp('/website-requests', 'qa.fd');
        await user.click(await screen.findByRole('button', { name: W }));
        const drawer = await screen.findByRole('dialog');
        await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
        const dlg = await screen.findByRole('dialog', {
          name: new RegExp(`Báo giá cho yêu cầu ${W}`),
        });
        await quickCreate(user, dlg, 'QA Kim Ko');
        expect(within(dlg).getByRole('combobox', { name: /Khách đứng tên/ })).toHaveValue(
          'QA Kim Ko',
        );
      });
      expect(bodies).toHaveLength(1);
      expectZaloProfile(bodies[0]!, '+84900000121', send);
    },
  );

  it('"Tạo đơn" (H09) from a Zalo request: same – saved, Zalo kept', async () => {
    zaloRequest(W, 'zh', '+84900000122');
    const bodies = await guestPosts(async () => {
      const { user } = renderApp('/website-requests', 'qa.fd');
      await user.click(await screen.findByRole('button', { name: W }));
      const drawer = await screen.findByRole('dialog');
      await user.click(
        await within(drawer).findByRole('button', { name: tv('webreq.create_booking') }),
      );
      const dlg = await screen.findByRole('dialog', {
        name: new RegExp(`Đặt phòng cho yêu cầu ${W}`),
      });
      await quickCreate(user, dlg, 'QA Zhang');
    });
    expectZaloProfile(bodies[0]!, '+84900000122', 'en');
  });

  it('long stay (H10) from a Zalo request: same – saved, Zalo kept', async () => {
    zaloRequest(LONG, 'ru', '+84900000123');
    const bodies = await guestPosts(async () => {
      const { user } = renderApp('/website-requests', 'qa.fd');
      await user.click(await screen.findByRole('button', { name: LONG }));
      const drawer = await screen.findByRole('dialog');
      await user.click(
        await within(drawer).findByRole('button', { name: tv('webreq.create_booking') }),
      );
      const dlg = await screen.findByRole('dialog', {
        name: new RegExp(`Đặt phòng cho yêu cầu ${LONG}`),
      });
      expect(within(dlg).getByText(tv('lsm.flag'))).toBeInTheDocument();
      await quickCreate(user, dlg, 'QA Ivanova');
    });
    expectZaloProfile(bodies[0]!, '+84900000123', 'ru');
  });

  it('a 422 CONTACT_CHANNEL_EMPTY from the server names the channel – never "{channel}"', async () => {
    zaloRequest(W, 'ko', '+84900000124');
    server.use(
      http.post('*/v1/properties/:p/guests', () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Validation failed',
            status: 422,
            code: 'VALIDATION_FAILED',
            errors: [{ field: 'preferredContact', code: 'CONTACT_CHANNEL_EMPTY' }],
          },
          { status: 422, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: W }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
    const dlg = await screen.findByRole('dialog', { name: /Báo giá cho yêu cầu/ });
    await user.type(within(dlg).getByRole('combobox', { name: /Khách đứng tên/ }), 'QA Kim Ko');
    await user.click(
      await screen.findByRole('option', { name: tv('crm.quick_create', { q: 'QA Kim Ko' }) }),
    );
    const form = await screen.findByRole('dialog', { name: tv('crm.title_new') });
    await user.click(within(form).getByRole('button', { name: tv('crm.save') }));
    const sentence = tv('field_error.contact_channel_empty', { channel: tv('crm.pref_zalo') });
    expect(await within(form).findByText(sentence)).toBeInTheDocument();
    expect(form).not.toHaveTextContent('{channel}');
  });
});

function PickerHarness() {
  const s = useSession();
  if (s.status !== 'authenticated') return null;
  return <GuestPicker label="Khách đứng tên" onSelect={() => undefined} />;
}

describe('BUG-R4-011 – a profile made by hand', () => {
  it('Zalo with only "Số điện thoại / Zalo" saves; nationality VN sent as before', async () => {
    mockControl.signInAs('qa.fd');
    const user = userEvent.setup();
    const bodies = await guestPosts(async () => {
      render(
        <Providers>
          <MemoryRouter>
            <PickerHarness />
          </MemoryRouter>
        </Providers>,
      );
      await user.type(await screen.findByRole('combobox', { name: 'Khách đứng tên' }), 'QA Hand');
      await user.click(
        await screen.findByRole('option', { name: tv('crm.quick_create', { q: 'QA Hand' }) }),
      );
      const form = await screen.findByRole('dialog', { name: tv('crm.title_new') });
      await user.type(within(form).getByLabelText(/Số điện thoại/), '0900 000 125');
      await user.selectOptions(within(form).getByLabelText(tv('crm.f_pref')), 'zalo');
      await user.click(within(form).getByRole('button', { name: tv('crm.save') }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: tv('crm.title_new') })).toBeNull(),
      );
    });
    expect(bodies[0]).toMatchObject({
      phone: '0900 000 125',
      preferredContact: 'zalo',
      messagingHandles: { zalo: '0900 000 125' },
      nationalityCode: 'VN',
    });
    expect(mockControl.db.guests.at(-1)).toMatchObject({
      nationalityCode: 'VN',
      isForeigner: false,
    });
  });

  it('messagingHandlesOf: Zalo follows the phone, KakaoTalk uses the shared box, other handles kept', () => {
    const form = (over: Partial<Parameters<typeof messagingHandlesOf>[0]>) => ({
      phone: '',
      whatsapp: '',
      preferredContact: '' as const,
      ...over,
    });
    expect(messagingHandlesOf(form({ phone: '+84900000126', preferredContact: 'zalo' }))).toEqual({
      zalo: '+84900000126',
    });
    expect(
      messagingHandlesOf(form({ whatsapp: 'kim.test', preferredContact: 'kakaotalk' })),
    ).toEqual({ kakaotalk: 'kim.test' });
    expect(
      messagingHandlesOf(form({ whatsapp: '+84900000127', preferredContact: 'whatsapp' })),
    ).toEqual({ whatsapp: '+84900000127' });
    // Edit: a Zalo account that is not the phone stays; one that mirrored the old phone follows the new phone.
    const original = {
      phone: '+84900000128',
      messagingHandles: { zalo: '84900000128', kakaotalk: 'kim.test' },
    };
    expect(
      messagingHandlesOf(form({ phone: '+84900000129', preferredContact: 'zalo' }), original),
    ).toEqual({ zalo: '+84900000129', kakaotalk: 'kim.test' });
    expect(
      messagingHandlesOf(form({ phone: '+84900000129' }), {
        phone: '+84900000128',
        messagingHandles: { zalo: 'other.zalo' },
      }),
    ).toEqual({ zalo: 'other.zalo' });
  });
});

function FormHarness({ prefillName }: { prefillName: string }) {
  const s = useSession();
  if (s.status !== 'authenticated') return null;
  return (
    <GuestFormDialog
      prefillName={prefillName}
      prefill={guestPrefillOf({
        id: 'x',
        code: W,
        contact: { phone: '+84900000130' },
        locale: 'ko',
        channel: 'zalo',
      })}
      onClose={() => undefined}
      onSaved={() => undefined}
      onOpenGuest={() => undefined}
    />
  );
}

describe('FB-R4-ARC-FE-LPV2-06 – a request prefill beats an old draft', () => {
  it('empty name + prefill: the form shows the request (en, Zalo, no nationality), not the draft (vi, VN)', async () => {
    mockControl.signInAs('qa.fd');
    const me = mockControl.db.users.find((u) => u.username === 'qa.fd')!;
    writeDraft(
      `ottimo.draft.guest.${me.id}`,
      JSON.stringify({ fullName: 'Old Draft', phone: '+84900000131', preferredLocale: 'vi' }),
    );
    render(
      <Providers>
        <MemoryRouter>
          <FormHarness prefillName="" />
        </MemoryRouter>
      </Providers>,
    );
    const form = await screen.findByRole('dialog', { name: tv('crm.title_new') });
    expect(within(form).getByLabelText(/Số điện thoại/)).toHaveValue('+84900000130');
    expect(within(form).getByLabelText(tv('crm.f_lang'))).toHaveValue('en');
    expect(within(form).getByLabelText(tv('crm.f_pref'))).toHaveValue('zalo');
    expect(within(form).getByLabelText(tv('crm.f_nat'))).toHaveValue('');
  });
});

describe('UXD FE-18, FE-20, FE-22, FE-23', () => {
  it('FE-18: "Tiếng Trung (giản thể)" wraps only before the bracket', async () => {
    req(W).locale = 'zh';
    renderApp('/website-requests', 'qa.fd');
    const table = await screen.findByRole('table');
    const row = within(table).getByRole('button', { name: W }).closest('tr')!;
    const groups = [...row.querySelectorAll('.nowrap')].map((n) => n.textContent);
    expect(groups).toEqual(['Tiếng Trung', '(giản thể)']);
    expect(row).toHaveTextContent('Tiếng Trung (giản thể)');
  });

  it('FE-20: "n yêu cầu mới" under the title = the menu badge, whatever the language filter', async () => {
    const newOnes = mockControl.webRequests.requests.filter((r) => r.status === 'new').length;
    const { user } = renderApp('/website-requests', 'qa.fd');
    await screen.findByRole('table');
    const sub = tv('webreq.count_new', { n: newOnes });
    expect(await screen.findByText(sub)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(tv('webreq.filter_locale')), 'ru');
    await screen.findByText(/yêu cầu khớp bộ lọc/);
    expect(screen.getByText(sub)).toBeInTheDocument();
    expect(
      screen.getByText(tv('nav.website_requests_new', { n: String(newOnes) })),
    ).toBeInTheDocument();
  });

  it('FE-22: the "Guest wrote in…" note is the help line of the language box (aria-describedby), same style on hold', async () => {
    zaloRequest(W, 'ko', '+84900000132');
    const guest = mockControl.db.guests.find((g) => g.code === 'KH-0012')!;
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: W }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
    const dlg = await screen.findByRole('dialog', { name: /Báo giá cho yêu cầu/ });
    await user.type(within(dlg).getByRole('combobox', { name: /Khách đứng tên/ }), 'Đỗ Mai');
    await user.click(await screen.findByRole('option', { name: new RegExp(guest.fullName) }));
    const room = mockControl.db.rooms.find((r) => r.roomNo === '203')!;
    await user.selectOptions(within(dlg).getByLabelText(/^Căn/), room.id);
    expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    const sendStep = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    const note = within(sendStep).getByText(tv('sale.text_lang_note.ko'));
    expect(note).toHaveClass('help');
    const group = within(sendStep).getByRole('group', { name: tv('sale.text_lang') });
    expect(group).toHaveAccessibleDescription(tv('sale.text_lang_note.ko'));
    await user.click(within(sendStep).getByRole('button', { name: 'Khách đồng ý – Giữ chỗ' }));
    const hold = await screen.findByRole('dialog', { name: 'Giữ chỗ' });
    expect(within(hold).getByText(tv('sale.text_lang_note.ko'))).toHaveClass('help');
  });

  it('FE-23: the mock quote text is built like the server – children, plural forms, extra-guest line', () => {
    const q = {
      code: 'BG-00099',
      arrivalDate: '2026-12-10',
      nights: 2,
      input: { adults: 2, children6to11: 1, childrenUnder6: 0 } as never,
      totalVnd: 2_022_000,
      roomTotalVnd: 1_800_000,
      depositVnd: 540_000,
      losDiscountPct: 0,
      extraGuestCount: 1,
      expiresAt: '2026-12-01T16:59:00.000Z',
    };
    const room = { roomNo: '203', name: 'The Fern' };
    const en = mockQuoteText(q, 'en', room);
    expect(en).toContain(
      'Room 203 The Fern, 10/12/2026 → 12/12/2026 (2 nights), 2 adults, 1 child aged 6–11.',
    );
    expect(en).toContain('Room total: 1,800,000 VND.');
    expect(en).toContain('Includes the extra-guest charge for 1 guest on the sofa: 222,000 VND.');
    const one = mockQuoteText(
      {
        ...q,
        nights: 1,
        extraGuestCount: 0,
        totalVnd: 900_000,
        roomTotalVnd: 900_000,
        input: { adults: 1 } as never,
      },
      'en',
      room,
    );
    expect(one).toContain('(1 night), 1 adult.');
    expect(one).not.toContain('extra-guest');
    expect(mockQuoteText(q, 'ru', room)).toContain('(2 ночи), 2 взрослых');
    expect(mockQuoteText(q, 'vi', room)).toContain('(2 đêm), 2 người lớn');
  });
});
