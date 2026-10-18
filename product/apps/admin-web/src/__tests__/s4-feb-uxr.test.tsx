import { roomLabel, translate } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { attentionLine } from '../app/attention';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth } from '../app/reservations';
import type { Role } from '@ottimo/api-client';
import { NARROW_QUERY } from '../hooks/useMedia';
import { NAV, isVisible, mobileBar } from '../session/nav';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/**
 * Round 2 tuần Ổn định – FE-B fixes from the UXR S4 walkthrough (`outputs/UXR/s4-pwa-walkthrough.md`):
 * P-02 phone menu, P-03 H17/H24 approval cards, P-06 registrations on a device not granted, P-20 header on a
 * phone, P-21 "hạn sớm nhất" without a time, P-22 parameters scheduled for a later day.
 */
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Every screen code of the menu – role cards (`NavItem.roles`) then decide what a role sees. */
const SCREENS_ALL = [...new Set(NAV.map((n) => n.screen))];

/** A phone: `matchMedia('(max-width: 860px)')` matches (jsdom has no matchMedia – the desk layout). */
function onPhone() {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: media === NARROW_QUERY,
    media,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}
afterEach(() => vi.unstubAllGlobals());

describe('P-02 – Desk on a phone has a menu (bottom bar + Thêm, back button)', () => {
  it('owner (UXD FE-S4-26): Tổng quan · Cần duyệt · Phòng · Nhật ký tiền · Thêm; Thêm has Hôm nay and Tham số; back returns', async () => {
    onPhone();
    const { user } = renderApp('/overview', 'qa.owner');
    await screen.findByRole('heading', { level: 1, name: new RegExp(esc(tv('nav.overview'))) });
    // One menu at a time: the sidebar is not rendered on a phone.
    const nav = screen.getByRole('navigation', { name: tv('shell.main_nav') });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual([tv('nav.overview'), tv('nav.approvals'), tv('nav.rooms_short'), tv('nav.moneylog')]);
    expect(within(nav).getByRole('link', { name: tv('nav.moneylog') })).toHaveAttribute(
      'href',
      '/audit',
    );
    expect(within(nav).getByRole('link', { name: tv('nav.overview') })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // A bottom-bar page has no back button.
    expect(screen.queryByRole('button', { name: tv('common.back') })).toBeNull();

    await user.click(within(nav).getByRole('button', { name: tv('nav.more') }));
    const more = await screen.findByRole('dialog', { name: tv('nav.more') });
    // "Hôm nay" repeats Tổng quan for the owner – it moved to "Thêm".
    expect(within(more).getByRole('link', { name: tv('nav.today') })).toHaveAttribute(
      'href',
      '/today',
    );
    expect(within(more).getByText(tv('nav.device_untrusted'))).toBeInTheDocument();
    // Items already on the bar are not repeated.
    expect(within(more).queryByRole('link', { name: tv('nav.overview') })).toBeNull();
    expect(within(more).queryByRole('link', { name: tv('nav.moneylog') })).toBeNull();
    await user.click(within(more).getByRole('link', { name: tv('nav.params') }));

    expect(
      await screen.findByRole('heading', { level: 1, name: new RegExp(esc(tv('config.params'))) }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    // "Thêm" is marked as the current section; the page has "Quay lại".
    expect(within(nav).getByRole('button', { name: tv('nav.more') })).toHaveClass('is-current');
    await user.click(screen.getByRole('button', { name: tv('common.back') }));
    expect(
      await screen.findByRole('heading', { level: 1, name: new RegExp(esc(tv('nav.overview'))) }),
    ).toBeInTheDocument();
  });

  it('a deep link on a phone (no app history): back goes to the home screen of the role', async () => {
    onPhone();
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: tv('common.back') }));
    expect(
      await screen.findByRole('heading', { level: 1, name: new RegExp(esc(tv('nav.overview'))) }),
    ).toBeInTheDocument();
  });

  it('front desk lead on a phone: own bar (Cần duyệt · Hôm nay · Phòng · Buồng phòng) + Thêm', async () => {
    onPhone();
    renderApp('/today', 'qa.fdl');
    const nav = await screen.findByRole('navigation', { name: tv('shell.main_nav') });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual([
      tv('nav.approvals'),
      tv('nav.today'),
      tv('nav.rooms_short'),
      tv('nav.housekeeping'),
    ]);
    expect(within(nav).getByRole('button', { name: tv('nav.more') })).toBeInTheDocument();
  });

  it('UXD FE-S4-26: bar order by role – OWN/MGR money on the bar, desk roles unchanged', () => {
    const all = (roles: Role[], screens = SCREENS_ALL) =>
      NAV.filter((n) => isVisible(n, { roles, screens, deviceTrusted: true }));
    const ids = (roles: Role[], screens?: string[]) =>
      mobileBar(all(roles, screens), roles).bar.map((n) => n.id);
    expect(ids(['owner'])).toEqual(['overview', 'approvals', 'rack', 'moneylog']);
    expect(ids(['manager'])).toEqual(['overview', 'approvals', 'rack', 'moneylog']);
    // A manager who is also desk lead: the first role (ROLE_ORDER) decides.
    expect(ids(['front_desk_lead', 'manager'])).toEqual([
      'overview',
      'approvals',
      'rack',
      'moneylog',
    ]);
    expect(ids(['front_desk_lead'])).toEqual(['approvals', 'today', 'rack', 'housekeeping']);
    expect(ids(['front_desk'])).toEqual(['today', 'rack', 'housekeeping', 'reservations']);
    // Sale (rbac S04, S14, S15): Đơn của tôi · Báo giá · Khách của tôi – fewer than 4, all on the bar.
    expect(ids(['sales_staff'], ['S04', 'S14', 'S15'])).toEqual([
      'reservations',
      'quotes',
      'guests',
    ]);
    // Whatever is not on the bar is in "Thêm".
    const own = mobileBar(all(['owner']), ['owner']);
    expect(own.more.map((n) => n.id)).toContain('today');
    expect(own.more.map((n) => n.id)).toContain('params');
  });

  it('on a desk (wide): the sidebar as before, no bottom bar, no back button', async () => {
    renderApp('/settings/parameters', 'qa.owner');
    await screen.findByRole('heading', { level: 1, name: new RegExp(esc(tv('config.params'))) });
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText(tv('nav.params'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('nav.more') })).toBeNull();
    expect(screen.queryByRole('button', { name: tv('common.back') })).toBeNull();
  });
});

/** Kim's seeded FOC (75.000, Khách quen / VIP) points at its FOC line; the folio says what it waives. */
function focOnEarlyCheckIn() {
  const kim = mockControl.rsv.reservations.find((r) => r.guestName === 'Kim Seo-yeon')!;
  const foc = mockControl.stay.approvals.find(
    (a) => a.type === 'foc' && a.reservationCode === kim.code,
  )!;
  foc.folioLineId = '0192a1b0-0000-7000-8000-00000000f0c1';
  const base = {
    id: '0192a1b0-0000-7000-8000-00000000ba5e',
    category: 'early_checkin',
    amountVnd: 75_000,
    description: 'early check-in',
    labelKey: 'bill.line.early_checkin',
    labelParams: { time: '09:15' },
  };
  server.use(
    http.get('*/v1/properties/:propertyId/folios/:folioId', ({ params }) =>
      params.folioId === kim.folioId
        ? HttpResponse.json({
            id: kim.folioId,
            lines: [
              base,
              {
                id: foc.folioLineId,
                category: 'foc',
                amountVnd: -75_000,
                description: 'foc',
                relatedLineId: base.id,
              },
            ],
          })
        : undefined,
    ),
  );
  const roomNo = kim.segments![0]!.roomNo!;
  const room = roomLabel(
    mockControl.db.rooms.find((r) => r.roomNo === roomNo),
    'staff',
  );
  return { kim, room, line: tv('bill.line.early_checkin', { time: '09:15' }) };
}

describe('P-03 – approval cards say what is waived, where; H17 stacks on a phone', () => {
  it('H17: waived charge + room on the card; status and buttons in their own blocks (no squeezed column)', async () => {
    const { kim, room, line } = focOnEarlyCheckIn();
    renderApp('/approvals', 'qa.mgr');
    const title = await screen.findByText(
      (_, el) =>
        el?.tagName === 'B' && el.textContent === `${kim.code} · ${tv('foc.kind_foc')} · 75.000`,
    );
    const card = title.closest('li')!;
    expect(card).toHaveClass('appr-card');
    expect(await within(card).findByText(`${line} · ${room}`)).toBeInTheDocument();
    const acts = within(card).getByRole('button', { name: tv('approval.approve') }).parentElement!;
    expect(acts).toHaveClass('appr-acts');
    expect(within(acts).getByRole('button', { name: tv('approval.reject') })).toBeInTheDocument();
    // The status chip is not inside the buttons block (it never covers the amount).
    expect(within(acts).queryByText(tv('approval.status.pending'))).toBeNull();
    expect(within(card).getByText(tv('approval.status.pending'))).toBeInTheDocument();
  });

  it('H24 Tổng quan: the card adds charge · room · reason (J6 – no need to open H17 to know what it is)', async () => {
    const { room, line } = focOnEarlyCheckIn();
    renderApp('/overview', 'qa.owner');
    const block = (
      await screen.findByRole('heading', { name: tv('ov.approvals_n', { n: 1 }) })
    ).closest('section')!;
    expect(
      await within(block).findByText(`${line} · ${room} · ${tv('foc.r_regular')}`),
    ).toBeInTheDocument();
    expect(
      within(block).getByRole('link', { name: new RegExp(esc(tv('foc.kind_foc'))) }),
    ).toHaveAttribute('href', '/approvals');
  });

  it('the CSS stacks the card below 861 px and keeps one row on a desk', () => {
    const css = readFileSync(join(__dirname, '../../../../packages/ui/src/styles/app.css'), 'utf8');
    expect(css).toMatch(/\.appr-card \.appr-acts \{\s*grid-column: 1 \/ -1;/);
    expect(css).toMatch(/@media \(min-width: 861px\) \{\s*\.appr-card \{/);
  });
});

describe('P-06 – "Khai báo quá hạn" on a device not granted lists the bookings (no ID data)', () => {
  it('owner from H24: device message + the list, overdue first, rows not links', async () => {
    const T = todayLocal();
    const past = new Date(Date.now() - 3 * 3_600_000).toISOString();
    const later = new Date(Date.now() + 5 * 3_600_000).toISOString();
    const row = (n: number, over: Partial<Record<string, unknown>>) => ({
      id: `0192a1b0-0000-7000-8000-0000000a000${n}`,
      reservationId: `0192a1b0-0000-7000-8000-0000000b000${n}`,
      reservationCode: `OTM-0090${n}`,
      roomNo: '402',
      guestDisplayName: `Khách ${n}`,
      arrivalDate: T,
      kind: 'vn_citizen_stay',
      status: 'none',
      requiredCount: 2,
      submittedCount: 0,
      deadlineLabel: 'before_deadline_today',
      ...over,
    });
    server.use(
      http.get('*/v1/properties/:propertyId/registrations', () =>
        HttpResponse.json({
          data: [
            row(1, { deadlineAt: later }),
            row(2, { deadlineLabel: 'at_checkin' }),
            row(3, {
              deadlineAt: past,
              deadlineLabel: 'overdue',
              isOverdue: true,
              submittedCount: 1,
            }),
          ],
          page: { hasMore: false },
        }),
      ),
    );
    renderApp('/registration', 'qa.owner');
    expect(await screen.findByText(tv('device.blocked_title'))).toBeInTheDocument();
    expect(screen.getByText(tv('reg.untrusted_body'))).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: tv('nav.registration') });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((li) => within(li).getByText(/^OTM-/).textContent)).toEqual([
      'OTM-00903',
      'OTM-00901',
      'OTM-00902',
    ]);
    expect(items[0]).toHaveClass('urgent');
    expect(within(items[0]!).getByText(/^Đã quá hạn/)).toBeInTheDocument();
    expect(
      within(items[0]!).getByText(new RegExp(esc(tv('reg.untrusted_ids', { n: 1, total: 2 })))),
    ).toBeInTheDocument();
    expect(within(items[2]!).getByText(tv('reg2.at_checkin'))).toBeInTheDocument();
    expect(within(list).queryByRole('link')).toBeNull();
    expect(within(list).queryByRole('button')).toBeNull();
  });

  it('a granted desk still opens the full H14 list', async () => {
    renderApp('/registration', 'qa.fd');
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByText(tv('reg.untrusted_body'))).toBeNull();
  });
});

/** SEC `s4-SEC.md` C.11 – the conditions of keeping the list on a device not granted. */
describe('P-06 – SEC C.11 conditions (rows not clickable, nothing stored, no ID fields)', () => {
  const CODE = 'OTM-00911';
  const GUEST = 'Khách C11';
  function oneRow(extra: Record<string, unknown> = {}) {
    server.use(
      http.get('*/v1/properties/:propertyId/registrations', () =>
        HttpResponse.json({
          data: [
            {
              id: '0192a1b0-0000-7000-8000-0000000c0011',
              reservationId: '0192a1b0-0000-7000-8000-0000000d0011',
              reservationCode: CODE,
              roomNo: '402',
              guestDisplayName: GUEST,
              arrivalDate: todayLocal(),
              kind: 'foreigner_temp_residence',
              status: 'partial',
              requiredCount: 2,
              submittedCount: 1,
              deadlineAt: new Date(Date.now() - 3_600_000).toISOString(),
              deadlineLabel: 'overdue',
              isOverdue: true,
              ...extra,
            },
          ],
          page: { hasMore: false },
        }),
      ),
    );
  }

  it('(2) a row is not clickable: no link, button, tab stop, role or handler – clicking it stays on the list', async () => {
    oneRow();
    const reads: string[] = [];
    const onStart = ({ request }: { request: Request }) => {
      if (/\/registrations\/[^/?]+/.test(new URL(request.url).pathname)) reads.push(request.url);
    };
    server.events.on('request:start', onStart);
    const { user } = renderApp('/registration', 'qa.owner');
    const list = await screen.findByRole('list', { name: tv('nav.registration') });
    const item = within(list).getByRole('listitem');
    expect(within(item).getByText(CODE)).toBeInTheDocument();
    for (const el of [item, ...item.querySelectorAll('*')]) {
      expect(el.tagName, el.outerHTML.slice(0, 60)).not.toMatch(/^(A|BUTTON|INPUT|SELECT)$/);
      expect(el.hasAttribute('tabindex'), el.outerHTML.slice(0, 60)).toBe(false);
      expect(el.getAttribute('role') ?? '').not.toMatch(/^(link|button|menuitem|option)$/);
      expect(el.hasAttribute('onclick')).toBe(false);
    }
    expect(item).not.toHaveClass('rowlink');
    await user.click(within(item).getByText(CODE));
    await user.click(item);
    expect(screen.getByRole('list', { name: tv('nav.registration') })).toBeInTheDocument();
    expect(screen.getByText(tv('reg.untrusted_body'))).toBeInTheDocument();
    server.events.removeListener('request:start', onStart);
    // No detail (getRegistration) is ever read on this device.
    expect(reads).toEqual([]);
  });

  it('(3) the list is never written to localStorage, sessionStorage or IndexedDB', async () => {
    oneRow();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const idbOpen = vi.fn(() => {
      throw new Error('IndexedDB must not be used');
    });
    vi.stubGlobal('indexedDB', { open: idbOpen, deleteDatabase: vi.fn() });
    renderApp('/registration', 'qa.owner');
    const list = await screen.findByRole('list', { name: tv('nav.registration') });
    expect(within(list).getByText(CODE)).toBeInTheDocument();
    const written = setItem.mock.calls.map(([k, v]) => `${k}=${v}`).join('\n');
    expect(written).not.toContain(CODE);
    expect(written).not.toContain(GUEST);
    expect(written).not.toMatch(/registration/i);
    for (const store of [localStorage, sessionStorage])
      for (let i = 0; i < store.length; i++) {
        const v = store.getItem(store.key(i)!) ?? '';
        expect(v).not.toContain(CODE);
        expect(v).not.toContain(GUEST);
      }
    expect(idbOpen).not.toHaveBeenCalled();
    setItem.mockRestore();
    // The page source has no storage call at all (a later change cannot slip one in unnoticed).
    const src = readFileSync(
      join(__dirname, '../pages/registration/RegistrationReadOnly.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(
      /localStorage|sessionStorage|indexedDB|writeLocal|writeSession|writeDraft|caches\./,
    );
  });

  it('(1) only the agreed fields are shown – an ID field added to the response is not displayed', async () => {
    oneRow({ documentNumberLast4: '6789', nationality: 'KOR', dateOfBirth: '1990-03-05' });
    renderApp('/registration', 'qa.owner');
    const list = await screen.findByRole('list', { name: tv('nav.registration') });
    const text = within(list).getByRole('listitem').textContent ?? '';
    expect(text).toContain(CODE);
    expect(text).toContain(GUEST);
    for (const leaked of ['6789', 'KOR', '1990', '05/03']) expect(text).not.toContain(leaked);
  });
});

describe('P-20 – header on a phone', () => {
  it('the name is kept as the accessible name of the user button; the theme choice wraps under its label', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    const btn = await screen.findByRole('button', { name: /Hạnh · Lễ tân/ });
    expect(btn.querySelector('.userchip-name')).toHaveTextContent('Hạnh · Lễ tân');
    await user.click(btn);
    const theme = screen.getByRole('group', { name: tv('shell.theme') });
    expect(theme.parentElement).toHaveClass('menu-row-wrap');
    const css = readFileSync(join(__dirname, '../../../../packages/ui/src/styles/app.css'), 'utf8');
    expect(css).toMatch(
      /\.menu-pop \.menu-row-wrap > \.grow \{\s*flex-basis: calc\(100% - 36px\);/,
    );
    expect(css).toMatch(/\.userchip \.userchip-name \{\s*position: absolute;/);
  });
});

describe('P-21 – "Khai báo lưu trú hôm nay" without a deadline yet', () => {
  const ctx = {
    t: (k: string, a?: Record<string, string | number>) => translate('vi', k, a),
    roles: ['owner' as const],
    room: (n?: string | null) => n ?? '',
    channel: (c: string) => c,
  };
  it('no dueAt → the sentence ends with the count; with dueAt → "hạn sớm nhất HH:mm"', () => {
    const base = {
      kind: 'registration_due' as const,
      source: 'computed' as const,
      severity: 'warning' as const,
      count: 4,
    };
    expect(attentionLine(base, ctx).text).toBe(tv('attn.registration_due_no_time', { n: 4 }));
    expect(attentionLine(base, ctx).text).not.toMatch(/hạn sớm nhất\s*$/);
    const at = attentionLine(
      { ...base, dueAt: `${todayLocal()}T16:00:00.000Z` },
      { ...ctx, timeZone: 'Asia/Ho_Chi_Minh' },
    );
    expect(at.text).toBe(tv('attn.registration_due', { n: 4, time: '23:00' }));
  });
});

describe('P-22 – Tham số: a value saved for a later day shows as scheduled', () => {
  it('35% from tomorrow: the row still reads 30% + chip "35% từ dd/MM"; history has "Hiệu lực từ" + "Chưa hiệu lực"', async () => {
    const tomorrow = addDays(todayLocal(), 1);
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: 'Sửa: Cọc ngắn ngày' }));
    const dlg = await screen.findByRole('dialog', { name: 'Sửa: Cọc ngắn ngày' });
    const value = within(dlg).getByLabelText(/Giá trị mới/);
    await user.clear(value);
    await user.type(value, '35');
    const from = within(dlg).getByLabelText(/Hiệu lực từ/);
    await user.clear(from);
    await user.type(from, tomorrow);
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Mùa cao điểm');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    const row = screen.getByText('Cọc ngắn ngày').closest('tr')!;
    expect(within(row).getByText('30%')).toBeInTheDocument();
    expect(
      await within(row).findByText(
        tv('params.pending', { value: '35%', date: dayMonth(tomorrow) }),
      ),
    ).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: 'Sửa: Cọc ngắn ngày' }));
    const again = await screen.findByRole('dialog', { name: 'Sửa: Cọc ngắn ngày' });
    expect(
      await within(again).findByRole('columnheader', { name: tv('config.effective_from') }),
    ).toBeInTheDocument();
    const newest = (await within(again).findByText(tv('params.not_yet'))).closest('tr')!;
    expect(within(newest).getByText('35%')).toBeInTheDocument();
    expect(within(newest).getByText('Mùa cao điểm')).toBeInTheDocument();
  });
});

/**
 * UXD FE-S4-27 (s4-UXD-brand H): no horizontal scroll at 360 / 390 px. jsdom has no layout, so these check the
 * structure + the CSS rules; the pixel check (scrollWidth ≤ innerWidth on Hôm nay, Đơn đặt phòng, Tổng quan,
 * Cần duyệt, Nhật ký tiền, Buồng phòng, Sơ đồ phòng, Khai báo, Tham số at 360 and 390) was run in Chromium on
 * the same DOM with the real CSS and fonts – see the FE report.
 */
describe('FE-S4-27 – no horizontal scroll on a phone', () => {
  const css = () =>
    readFileSync(join(__dirname, '../../../../packages/ui/src/styles/app.css'), 'utf8');

  it('Hôm nay on a phone: "Cần chú ý" rows are whole-row links with an arrow (H24 pattern), no "Mở" button beside the text', async () => {
    onPhone();
    renderApp('/today', 'qa.fd');
    const section = (
      await screen.findByRole('heading', { name: new RegExp(`^${esc(tv('today.attention'))}`) })
    ).closest('section')!;
    const links = await within(section).findAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) expect(a).toHaveClass('rowlink');
    expect(within(section).queryByRole('link', { name: tv('today.open') })).toBeNull();
  });

  it('Hôm nay on a desk keeps the "Mở" buttons', async () => {
    renderApp('/today', 'qa.fd');
    const section = (
      await screen.findByRole('heading', { name: new RegExp(`^${esc(tv('today.attention'))}`) })
    ).closest('section')!;
    expect((await within(section).findAllByRole('link', { name: tv('today.open') })).length).toBe(
      within(section).getAllByRole('link').length,
    );
  });

  it('guest request rows put their buttons in their own block (under the text at ≤ 520 px)', async () => {
    onPhone();
    renderApp('/today', 'qa.fd');
    const card = await screen.findByRole('region', { name: `${tv('today.requests')} (3)` });
    const decline = within(card).getAllByRole('button', {
      name: tv('guest.req.status.declined'),
    })[0]!;
    expect(decline.closest('.req-acts')).not.toBeNull();
    expect(decline.closest('.req-row')).not.toBeNull();
  });

  it('Đơn đặt phòng: the header actions sit in their own block, the user chip outside it', async () => {
    onPhone();
    renderApp('/reservations', 'qa.fd');
    const create = await screen.findByRole('button', { name: tv('bk.new_cta') });
    const acts = create.closest('.topbar-acts')!;
    expect(acts).not.toBeNull();
    expect(within(acts as HTMLElement).queryByRole('button', { name: /Hạnh/ })).toBeNull();
    expect(acts.closest('header')!.querySelector('.menu-anchor')).not.toBeNull();
  });

  it('CSS: single-column grid can shrink, header actions and request buttons wrap, table headers stay in their box, long chips wrap', () => {
    const c = css();
    expect(c).toMatch(
      /@media \(max-width: 860px\) \{\s*\.cols-2 \{\s*grid-template-columns: minmax\(0, 1fr\);/,
    );
    expect(c).toMatch(/\.topbar-acts:has\(\.btn\) \{\s*order: 3;\s*flex-basis: 100%;/);
    expect(c).toMatch(/\.topbar \.menu-anchor \{\s*order: 2;/);
    expect(c).toMatch(/\.req-row > \.req-acts \{\s*flex-basis: 100%;/);
    expect(c).toMatch(/\.task > \.grow,\s*\.req-row > \.grow \{\s*min-width: 0;/);
    expect(c).toMatch(/\.table-wrap \{\s*position: relative;/);
    expect(c).toMatch(
      /\.rack-list \.chip,\s*\.task \.chip \{\s*max-width: 100%;\s*white-space: normal;/,
    );
  });
});
