import { NAV, canOpen } from '../session/nav';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp, signIn } from '../test/render';

/** Same expectations as QA smoke tests/e2e/ui/admin-web.smoke.spec.ts (TC-NT-006) + hi-fi H02 2.2. */
const ROLES: Array<{ user: string; landing: RegExp; sees: string[]; hides: string[] }> = [
  {
    user: 'qa.owner',
    landing: /Tổng quan/,
    sees: ['Tổng quan', 'Người dùng & vai', 'Thiết bị được cấp', 'Tham số quy tắc', 'Danh mục căn'],
    hides: ['Giấy tờ & khai báo'],
  },
  {
    user: 'qa.mgr',
    landing: /Tổng quan/,
    sees: ['Tổng quan', 'Tham số quy tắc', 'Danh mục căn', 'Giấy tờ & khai báo'],
    hides: ['Người dùng & vai', 'Thiết bị được cấp'],
  },
  {
    user: 'qa.fdl',
    landing: /Hôm nay/,
    sees: ['Hôm nay', 'Sơ đồ phòng', 'Tham số quy tắc', 'Cần duyệt'],
    hides: ['Người dùng & vai', 'Tổng quan'],
  },
  {
    user: 'qa.fd',
    landing: /Hôm nay/,
    sees: ['Hôm nay', 'Sơ đồ phòng', 'Khách hàng', 'Giấy tờ & khai báo'],
    hides: ['Người dùng & vai', 'Tham số quy tắc', 'Tổng quan'],
  },
  {
    user: 'qa.hk',
    landing: /Buồng phòng/,
    sees: ['Buồng phòng'],
    hides: ['Người dùng & vai', 'Tham số quy tắc', 'Khách hàng', 'Danh mục căn'],
  },
  {
    user: 'qa.mt',
    landing: /Bảo trì|Phiếu sửa/,
    sees: ['Phiếu sửa'],
    hides: ['Người dùng & vai', 'Tham số quy tắc', 'Khách hàng'],
  },
  {
    user: 'qa.sal',
    landing: /Báo giá/,
    sees: ['Báo giá & giữ chỗ', 'Khách của tôi'],
    hides: ['Người dùng & vai', 'Tham số quy tắc', 'Sơ đồ phòng', 'Hôm nay'],
  },
  {
    user: 'qa.ctv1',
    landing: /Báo giá/,
    sees: ['Báo giá & giữ chỗ'],
    hides: ['Người dùng & vai', 'Tham số quy tắc', 'Sơ đồ phòng'],
  },
];

describe('H02 navigation by role (US-001 AC1, US-002, rbac §3)', () => {
  for (const r of ROLES) {
    it(`${r.user}: home screen + menu`, async () => {
      const { user } = renderApp('/');
      await signIn(user, r.user);
      expect(await screen.findByRole('heading', { level: 1, name: r.landing })).toBeInTheDocument();
      const nav = screen.getByRole('navigation');
      for (const label of r.sees)
        expect(within(nav).getByText(label, { exact: true })).toBeInTheDocument();
      for (const label of r.hides)
        expect(within(nav).queryByText(label, { exact: true })).toBeNull();
    });
  }

  it('shows the signed-in name and role in the header (AC1)', async () => {
    renderApp('/today', 'qa.fd');
    expect(await screen.findByRole('button', { name: /Hạnh · Lễ tân/ })).toBeInTheDocument();
  });

  it('manager opening Người dùng & vai by URL → "không có quyền" page (US-002 AC4, TC-NT-010)', async () => {
    renderApp('/settings/users', 'qa.mgr');
    expect(
      await screen.findByRole('heading', { name: 'Bạn không có quyền mở trang này' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về trang chủ của tôi' })).toHaveAttribute(
      'href',
      '/overview',
    );
  });

  it('sale opening P&L-like admin pages by URL is refused too (US-003 AC3)', async () => {
    renderApp('/settings/parameters', 'qa.sal');
    expect(await screen.findByText('Bạn không có quyền mở trang này')).toBeInTheDocument();
  });

  it('device not granted: C3 menu hidden, chip in sidebar, URL shows device message (US-142 AC2)', async () => {
    renderApp('/registration', 'qa.owner');
    expect(await screen.findByText('Máy này chưa được cấp quyền')).toBeInTheDocument();
    expect(screen.getByText('Máy chưa cấp quyền giấy tờ')).toBeInTheDocument();
  });

  it('granted desk shows the green device chip', async () => {
    renderApp('/today', 'qa.fd');
    expect(await screen.findByText('Máy quầy đã cấp quyền')).toBeInTheDocument();
  });

  it('skip link and landmarks exist (WCAG 2.4.1)', async () => {
    renderApp('/today', 'qa.fd');
    expect(await screen.findByRole('link', { name: 'Bỏ qua tới nội dung' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('switches UI language to English from the user menu', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: /Hạnh/ }));
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByRole('heading', { level: 1, name: /Today/ })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches theme (light/dark) on <html data-theme>', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: /Hạnh/ }));
    await user.click(screen.getByRole('button', { name: 'Tối' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.click(screen.getByRole('button', { name: 'Theo máy' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('later-sprint screens render the "coming later" state, not a blank page', async () => {
    renderApp('/rack', 'qa.fd');
    expect(await screen.findByText('Màn này đang được làm')).toBeInTheDocument();
  });

  it('Hôm nay shows "being built", never the "no guests today" empty state (FB-R2-UXD-FE-02)', async () => {
    renderApp('/today', 'qa.fdl');
    expect(await screen.findByText('Màn này đang được làm')).toBeInTheDocument();
    expect(screen.queryByText('Hôm nay không có việc theo giờ')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mở sơ đồ phòng' })).toHaveAttribute('href', '/rack');
  });

  it('offline → read-only bar under the header', async () => {
    renderApp('/today', 'qa.fd');
    await screen.findByRole('heading', { level: 1, name: /Hôm nay/ });
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    window.dispatchEvent(new Event('offline'));
    expect(await screen.findByText(/Mất kết nối\. Dữ liệu lúc/)).toBeInTheDocument();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    window.dispatchEvent(new Event('online'));
  });
});

describe('route guard = menu rule (BUG-R2-010)', () => {
  it('a manager whose screens include S26 still cannot open Người dùng & vai (owner-only card)', () => {
    const users = NAV.find((n) => n.id === 'users')!;
    expect(
      canOpen(users, { roles: ['manager'], screens: ['S24', 'S26'], deviceTrusted: true }),
    ).toBe(false);
    expect(canOpen(users, { roles: ['owner'], screens: ['S26'], deviceTrusted: false })).toBe(true);
  });
});
