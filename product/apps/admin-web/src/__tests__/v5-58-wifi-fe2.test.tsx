/**
 * v1.0.5 V5-58 (BUG-R3-021 phần Desk) – S36 "Wi-Fi cơ sở": OWN/MGR nhập và sửa tên mạng + mật khẩu Wi-Fi
 * (`setPropertyWifi`, A101), FDL/FD chỉ đọc để báo khách (`getPropertyWifi`, rbac ghi chú 47).
 * - SEC ARC-04 (hợp đồng 1.23): hai ô trống khi mở, ô chữ thường (không `type="password"`), `autocomplete="off"`,
 *   tên ô không có user/login/pass – trình duyệt không tự điền mật khẩu đăng nhập Desk (T58-10 phần Vitest).
 * - DOM FB-R5-DOM-UXD-120-03: mật khẩu rỗng → "Mạng mở, không có mật khẩu" ở bước xem lại; dòng nhật ký khi
 *   không đổi gì → "Lưu lại Wi-Fi, không đổi".
 * - 422 của máy chủ (mock theo PR #120): số căn trong tên mạng, mật khẩu trùng mật khẩu đăng nhập (SR-RL-15).
 * Giá trị Wi-Fi trong file này là giá trị thử, không phải mạng thật.
 */
import type { Role } from '@ottimo/api-client';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { wifiChangeOf, wifiShapeErrors, utf8Bytes } from '../app/wifi';
import { mockControl } from '../mocks/handlers';
import { MOCK_PASSWORD, SCREENS } from '../mocks/seed';
import type { MockWifiAudit } from '../mocks/wifi';
import { NAV, isVisible } from '../session/nav';
import { renderApp, tv } from '../test/render';

const NETWORK = 'OTTIMO Test';
const PHRASE = 'test-wifi-0000';
const PHRASE_2 = 'test-wifi-1111';
const PATH = '/settings/wifi';
const ssidBox = () => screen.getByLabelText(new RegExp(`^${tv('wifi.ssid')}`));
const phraseBox = () => screen.getByLabelText(new RegExp(`^${tv('wifi.password')}`));
const ARGS = { min: 8, max: 63 };

function seedWifi(ssid = NETWORK, password = PHRASE) {
  mockControl.wifi.wifi = { ssid, password };
}

function row(
  before: string | null,
  after: string,
  passwordChanged: boolean,
  at = '2026-11-05T03:00:00Z',
): MockWifiAudit {
  return {
    occurredAt: at,
    actorType: 'user',
    actorUserId: 'u-1',
    actorName: 'Chủ đầu tư',
    category: 'config',
    action: 'property.wifi_changed',
    entityType: 'property',
    before: { ssid: before },
    after: { ssid: after, passwordChanged },
  };
}

/** The `<b>` line of a log row (mono spans inside) by its full text. */
const logLine = (text: string) =>
  screen.findByText((_, el) => el?.tagName === 'B' && el.textContent === text);

async function openDialog(user: ReturnType<typeof renderApp>['user'], label: string) {
  await user.click(await screen.findByRole('button', { name: label }));
  return screen.findByRole('dialog');
}

describe('V5-58 nav + quyền (S36)', () => {
  const item = NAV.find((n) => n.id === 'wifi')!;
  const access = (role: Role) => ({
    roles: [role],
    screens: SCREENS[role] ?? [],
    deviceTrusted: true,
  });

  it('OWN, MGR, FDL, FD thấy mục "Wi-Fi cơ sở"; HK, MT, SAL, CTV không thấy', () => {
    expect(item).toMatchObject({ path: PATH, screen: 'S36', label: 'nav.wifi' });
    for (const r of ['owner', 'manager', 'front_desk_lead', 'front_desk'] as Role[])
      expect(isVisible(item, access(r)), r).toBe(true);
    for (const r of ['housekeeping', 'maintenance', 'sales_staff', 'collaborator'] as Role[])
      expect(isVisible(item, access(r)), r).toBe(false);
  });

  it('HK mở thẳng đường dẫn → "không có quyền", không gọi Wi-Fi', async () => {
    renderApp(PATH, 'qa.hk');
    expect(await screen.findByText(tv('shell.no_access_title'))).toBeInTheDocument();
    expect(screen.queryByText(tv('wifi.current_title'))).not.toBeInTheDocument();
  });
});

describe('V5-58 FDL/FD chỉ đọc', () => {
  it('chưa có Wi-Fi: báo chưa nhập + nhờ chủ đầu tư/quản lý; không có nút nhập, không có nhật ký', async () => {
    renderApp(PATH, 'qa.fd');
    expect(await screen.findByText(new RegExp(tv('wifi.none').slice(0, 20)))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(tv('wifi.none_ask')))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('wifi.enter') })).not.toBeInTheDocument();
    expect(screen.queryByText(tv('wifi.log_title'))).not.toBeInTheDocument();
  });

  it('có Wi-Fi: tên mạng + mật khẩu hiện bằng JetBrains Mono (.mono), kèm câu đọc đúng từng ký tự', async () => {
    seedWifi();
    renderApp(PATH, 'qa.fdl');
    const name = await screen.findByText(NETWORK);
    expect(name).toHaveClass('mono');
    expect(screen.getByText(PHRASE)).toHaveClass('mono');
    expect(screen.getByText(tv('wifi.read_help'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('wifi.edit') })).not.toBeInTheDocument();
  });

  it('mạng mở (mật khẩu rỗng): ghi bằng chữ "Mạng mở, không có mật khẩu"', async () => {
    seedWifi(NETWORK, '');
    renderApp(PATH, 'qa.fd');
    expect(await screen.findByText(tv('wifi.open_network'))).toBeInTheDocument();
  });
});

describe('V5-58 OWN/MGR nhập và sửa', () => {
  it('T58-10: hai ô trống khi mở, ô chữ thường, autocomplete off, tên ô không gợi đăng nhập', async () => {
    seedWifi();
    const { user } = renderApp(PATH, 'qa.owner');
    const dialog = await openDialog(user, tv('wifi.edit'));
    expect(dialog.querySelector('input[type="password"]')).toBeNull();
    const form = dialog.querySelector('form')!;
    expect(form).toHaveAttribute('autocomplete', 'off');
    for (const box of [ssidBox(), phraseBox()]) {
      // Never prefilled – not even with the stored value (the owner types what the router shows).
      expect(box).toHaveValue('');
      expect(box).toHaveAttribute('type', 'text');
      expect(box).toHaveAttribute('autocomplete', 'off');
      expect(box.getAttribute('name') ?? '').not.toMatch(/user|login|pass|email/i);
      expect(box.id).not.toMatch(/user|login|pass|email/i);
      expect(box).toHaveClass('mono');
    }
  });

  it('kiểm dạng trước bước xem lại: tên rỗng, mật khẩu ngắn, tên quá 32 byte (chữ có dấu)', async () => {
    const { user } = renderApp(PATH, 'qa.owner');
    await openDialog(user, tv('wifi.enter'));
    await user.type(phraseBox(), 'short');
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    expect(await screen.findByText(tv('wifi.err_ssid_required'))).toBeInTheDocument();
    expect(screen.getByText(tv('wifi.err_password_range', ARGS))).toBeInTheDocument();
    // 25 letters but 36 bytes in UTF-8 – the Wi-Fi limit is bytes.
    const accented = 'Khách sạn Đà Lạt tầng trệt';
    expect(utf8Bytes(accented)).toBeGreaterThan(32);
    await user.type(ssidBox(), accented);
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    expect(await screen.findByText(tv('wifi.err_ssid_long', { max: 32 }))).toBeInTheDocument();
    expect(screen.queryByText(tv('wifi.review_title'))).not.toBeInTheDocument();
    expect(mockControl.wifi.wifi).toBeNull();
  });

  it('mạng mở: bước xem lại ghi "Mạng mở, không có mật khẩu" + lưu ý bộ phát; lưu → toast, thẻ, nhật ký lần đầu', async () => {
    const { user } = renderApp(PATH, 'qa.owner');
    expect(await screen.findByText(tv('wifi.log_empty', { days: 92 }))).toBeInTheDocument();
    await openDialog(user, tv('wifi.enter'));
    await user.type(ssidBox(), `  ${NETWORK} `);
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    const dialog = await screen.findByRole('dialog', { name: tv('wifi.review_title') });
    expect(within(dialog).getByText(tv('wifi.review_lead'))).toBeInTheDocument();
    expect(within(dialog).getByText(NETWORK)).toHaveClass('mono');
    expect(within(dialog).getByText(tv('wifi.open_network'))).toBeInTheDocument();
    expect(within(dialog).getByText(tv('wifi.review_open_note'))).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: tv('wifi.save') }));
    expect(await screen.findByText(tv('wifi.saved'))).toBeInTheDocument();
    // Name trimmed by the Desk (server trims too); the empty password goes as "" (open network).
    expect(mockControl.wifi.wifi).toEqual({ ssid: NETWORK, password: '' });
    expect(await screen.findByRole('button', { name: tv('wifi.edit') })).toBeInTheDocument();
    expect(screen.getByText(tv('wifi.open_network'))).toBeInTheDocument();
    expect(await logLine(tv('wifi.log_first', { to: NETWORK }))).toBeInTheDocument();
  });

  it('mật khẩu giữ nguyên khoảng trắng (không cắt) và hiện ở bước xem lại; Ẩn chỉ che ký tự', async () => {
    seedWifi();
    const { user } = renderApp(PATH, 'qa.mgr');
    await openDialog(user, tv('wifi.edit'));
    await user.type(ssidBox(), NETWORK);
    await user.type(phraseBox(), ` ${PHRASE_2} `);
    const hide = screen.getByRole('button', { name: tv('login.hide_password') });
    expect(hide).toHaveAttribute('aria-pressed', 'true');
    await user.click(hide);
    expect(phraseBox()).toHaveClass('wifi-masked');
    expect(phraseBox()).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: tv('login.show_password') })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    const dialog = await screen.findByRole('dialog', { name: tv('wifi.review_title') });
    expect(
      within(dialog).getByText(
        (_, el) => el?.textContent === ` ${PHRASE_2} ` && el.tagName === 'SPAN',
      ),
    ).toHaveClass('mono');
    expect(within(dialog).queryByText(tv('wifi.review_open_note'))).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: tv('wifi.save') }));
    await screen.findByText(tv('wifi.saved'));
    expect(mockControl.wifi.wifi).toEqual({ ssid: NETWORK, password: ` ${PHRASE_2} ` });
    expect(await logLine(tv('wifi.log_password'))).toBeInTheDocument();
  });

  it('422 NOT_ALLOWED: số căn trong tên mạng → quay lại ô tên, chưa lưu', async () => {
    const { user } = renderApp(PATH, 'qa.owner');
    await openDialog(user, tv('wifi.enter'));
    await user.type(ssidBox(), 'OTTIMO 401');
    await user.type(phraseBox(), PHRASE);
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    await user.click(await screen.findByRole('button', { name: tv('wifi.save') }));
    expect(await screen.findByText(tv('wifi.err_ssid_not_allowed'))).toBeInTheDocument();
    expect(ssidBox()).toHaveValue('OTTIMO 401');
    expect(mockControl.wifi.wifi).toBeNull();
  });

  it('PR #120 ce81ba5c: tên mạng bị chặn thì máy chủ không so mật khẩu – chỉ báo lỗi tên', async () => {
    const { user } = renderApp(PATH, 'qa.owner');
    await openDialog(user, tv('wifi.enter'));
    await user.type(ssidBox(), 'qa.fd');
    await user.type(phraseBox(), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    await user.click(await screen.findByRole('button', { name: tv('wifi.save') }));
    expect(await screen.findByText(tv('wifi.err_ssid_not_allowed'))).toBeInTheDocument();
    expect(screen.queryByText(tv('wifi.err_password_login'))).not.toBeInTheDocument();
    expect(mockControl.wifi.compares.size).toBe(0);
    expect(mockControl.wifi.security).toEqual([]);
  });

  it('422 NOT_ALLOWED (SR-RL-15): mật khẩu Wi-Fi trùng mật khẩu đăng nhập Desk của chính mình', async () => {
    const { user } = renderApp(PATH, 'qa.owner');
    await openDialog(user, tv('wifi.enter'));
    await user.type(ssidBox(), NETWORK);
    await user.type(phraseBox(), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    await user.click(await screen.findByRole('button', { name: tv('wifi.save') }));
    expect(await screen.findByText(tv('wifi.err_password_login'))).toBeInTheDocument();
    expect(screen.queryByText(tv('wifi.err_ssid_not_allowed'))).not.toBeInTheDocument();
    expect(mockControl.wifi.wifi).toBeNull();
    expect(mockControl.wifi.security.map((s) => s.action)).toEqual([
      'property.wifi_password_matches_login',
    ]);
  });

  it('lưu lại y nguyên → dòng nhật ký "Lưu lại Wi-Fi, không đổi" (DOM 120-03 ý 2)', async () => {
    seedWifi();
    const { user } = renderApp(PATH, 'qa.owner');
    await openDialog(user, tv('wifi.edit'));
    await user.type(ssidBox(), NETWORK);
    await user.type(phraseBox(), PHRASE);
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    await user.click(await screen.findByRole('button', { name: tv('wifi.save') }));
    expect(await logLine(tv('wifi.log_unchanged'))).toBeInTheDocument();
    expect(screen.queryByText(tv('wifi.log_password'))).not.toBeInTheDocument();
  });

  it('nhật ký đọc các dòng có sẵn: đổi tên + mật khẩu, chỉ đổi tên; người lưu và giờ; không bao giờ có mật khẩu', async () => {
    seedWifi('OTTIMO New', PHRASE_2);
    mockControl.wifi.audit.push(
      row(NETWORK, 'OTTIMO New', true, '2026-11-06T03:00:00Z'),
      row('OTTIMO Old', NETWORK, false, '2026-11-05T03:00:00Z'),
    );
    renderApp(PATH, 'qa.mgr');
    const both = `${tv('wifi.log_ssid', { from: NETWORK, to: 'OTTIMO New' })} · ${tv('wifi.log_password')}`;
    expect(await logLine(both)).toBeInTheDocument();
    expect(
      await logLine(tv('wifi.log_ssid', { from: 'OTTIMO Old', to: NETWORK })),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Chủ đầu tư ·/)).toHaveLength(2);
    // The log card itself never prints a password (the value shows only once, in the card above).
    expect(screen.getAllByText(PHRASE_2)).toHaveLength(1);
  });
});

describe('V5-58 app/wifi.ts', () => {
  it('wifiShapeErrors: biên 8/63 ký tự, ASCII in được, tên 32 byte', () => {
    expect(wifiShapeErrors('a', '')).toEqual({});
    expect(wifiShapeErrors('a', 'x'.repeat(8))).toEqual({});
    expect(wifiShapeErrors('a', 'x'.repeat(7))).toEqual({ password: 'range' });
    expect(wifiShapeErrors('a', 'x'.repeat(63))).toEqual({});
    expect(wifiShapeErrors('a', 'x'.repeat(64))).toEqual({ password: 'range' });
    expect(wifiShapeErrors('a', 'mật-khẩu-wifi')).toEqual({ password: 'range' });
    expect(wifiShapeErrors('x'.repeat(32), '')).toEqual({});
    expect(wifiShapeErrors('x'.repeat(33), '')).toEqual({ ssid: 'range' });
    expect(wifiShapeErrors('   ', '')).toEqual({ ssid: 'required' });
    expect(wifiShapeErrors('a\tb', '')).toEqual({ ssid: 'range' });
  });

  it('wifiChangeOf: lần đầu / không đổi / đổi tên / đổi mật khẩu', () => {
    const ev = (r: MockWifiAudit) => ({ ...r, id: 'e' }) as never;
    expect(wifiChangeOf(ev(row(null, NETWORK, true)))).toEqual({ kind: 'first', to: NETWORK });
    expect(wifiChangeOf(ev(row(NETWORK, NETWORK, false)))).toEqual({ kind: 'unchanged' });
    expect(wifiChangeOf(ev(row(NETWORK, NETWORK, true)))).toEqual({
      kind: 'changed',
      password: true,
    });
    expect(wifiChangeOf(ev(row('A', 'B', false)))).toEqual({
      kind: 'changed',
      ssid: { from: 'A', to: 'B' },
      password: false,
    });
  });
});

describe('V5-58 mock theo PR #120', () => {
  it('SR-RL-15: từ lần so thứ 6 trong cửa sổ, máy chủ bỏ qua phép so và vẫn lưu (không 429)', async () => {
    const owner = mockControl.db.users.find((u) => u.username === 'qa.owner')!;
    mockControl.wifi.compares.set(owner.id, 5);
    const { user } = renderApp(PATH, 'qa.owner');
    await openDialog(user, tv('wifi.enter'));
    await user.type(ssidBox(), NETWORK);
    await user.type(phraseBox(), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('wifi.review') }));
    await user.click(await screen.findByRole('button', { name: tv('wifi.save') }));
    expect(await screen.findByText(tv('wifi.saved'))).toBeInTheDocument();
    expect(mockControl.wifi.security.map((s) => s.action)).toEqual([
      'property.wifi_password_check_skipped',
    ]);
  });
});
