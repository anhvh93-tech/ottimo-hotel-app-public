// E2E UI smoke – admin-web (project desk-chromium, 1366×768): đăng nhập + điều hướng theo vai.
// TC-NT-001 (E), TC-NT-002 (E), TC-NT-006, TC-NT-010 (E). Labels/menus from design/copy/strings-vi.json
// (auth.login.username, nav.*) and rbac-matrix mục 1/3 (decision-log 15/10 PO: màn mặc định theo vai).
// Skipped until FE ships the login screen: run with E2E_UI=1 (needs `playwright install chromium`);
// the suite also skips by itself when the login form is not on E2E_WEB_URL yet.
import { expect, test, type Page } from '@playwright/test';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';

const UI = process.env.E2E_UI === '1';

/** Default screen (heading/nav item that must be active after login) and menu expectations per role. */
const ROLES: Array<{ user: string; landing: RegExp; sees: string[]; hides: string[] }> = [
  {
    user: 'qa.owner',
    landing: /Tổng quan/,
    sees: ['Tổng quan', 'Người dùng & vai', 'Tham số quy tắc', 'Danh mục căn'],
    hides: [],
  },
  {
    user: 'qa.mgr',
    landing: /Tổng quan/,
    sees: ['Tổng quan', 'Tham số quy tắc', 'Danh mục căn'],
    hides: ['Người dùng & vai'],
  },
  {
    user: 'qa.fdl',
    landing: /Hôm nay/,
    sees: ['Hôm nay', 'Sơ đồ phòng', 'Tham số quy tắc'],
    hides: ['Người dùng & vai'],
  },
  {
    user: 'qa.fd',
    landing: /Hôm nay/,
    sees: ['Hôm nay', 'Sơ đồ phòng', 'Khách hàng'],
    hides: ['Người dùng & vai', 'Tham số quy tắc'],
  },
  {
    user: 'qa.hk',
    landing: /Buồng phòng/,
    sees: ['Buồng phòng'],
    hides: ['Người dùng & vai', 'Tham số quy tắc', 'Khách hàng'],
  },
  {
    user: 'qa.mt',
    landing: /Bảo trì|Phiếu sửa/,
    sees: ['Phiếu sửa'],
    hides: ['Người dùng & vai', 'Tham số quy tắc'],
  },
  {
    user: 'qa.sal',
    landing: /Báo giá/,
    sees: ['Báo giá & giữ chỗ'],
    hides: ['Người dùng & vai', 'Tham số quy tắc'],
  },
  {
    user: 'qa.ctv1',
    landing: /Báo giá/,
    sees: [],
    hides: ['Người dùng & vai', 'Tham số quy tắc', 'Sơ đồ phòng'],
  },
];

async function loginForm(page: Page): Promise<boolean> {
  await page.goto(WEB_URL);
  return page
    .getByLabel(/Số điện thoại hoặc email|Tên đăng nhập/)
    .first()
    .waitFor({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
}

async function signIn(page: Page, user: string) {
  await page
    .getByLabel(/Số điện thoại hoặc email|Tên đăng nhập/)
    .first()
    .fill(user);
  await page
    .getByLabel(/Mật khẩu/)
    .first()
    .fill(SEED_PASSWORD ?? '');
  await page.getByRole('button', { name: /Đăng nhập/ }).click();
}

test.describe(
  'admin-web smoke – đăng nhập & điều hướng theo vai',
  { tag: ['@ui', '@sprint1'] },
  () => {
    test.skip(!UI, 'Chờ FE màn đăng nhập/điều hướng (Sprint 1) – chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test.beforeEach(async ({ page }) => {
      test.skip(!(await loginForm(page)), 'Chưa có form đăng nhập trên admin-web');
    });

    test('TC-NT-002 (E) chưa đăng nhập mở URL sâu → về trang đăng nhập, không chớp dữ liệu', async ({
      page,
    }) => {
      for (const path of [
        '/rack',
        '/reservations/00000000-0000-7000-8000-000000000000',
        '/settings/parameters',
      ]) {
        await page.goto(`${WEB_URL}${path}`);
        await expect(
          page.getByLabel(/Số điện thoại hoặc email|Tên đăng nhập/).first(),
        ).toBeVisible();
        await expect(page.getByText(/OTM-\d+/)).toHaveCount(0);
      }
    });

    test('TC-NT-001 (E) qa.fd đăng nhập → màn Hôm nay, tên người dùng ở đầu trang, Sơ đồ phòng 1 lần bấm', async ({
      page,
    }) => {
      await signIn(page, 'qa.fd');
      await expect(page.getByRole('heading', { name: /Hôm nay/ }).first()).toBeVisible();
      await page.getByRole('link', { name: 'Sơ đồ phòng' }).first().click();
      await expect(page).toHaveURL(/rack/);
      expect(await page.evaluate(() => document.cookie)).not.toMatch(/ottimo_sid/); // HttpOnly
      const stored = await page.evaluate(
        () => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }),
      );
      expect(stored, 'TC-SEC-020: không lưu token ở storage').not.toMatch(/ottimo_sid|csrf/i);
    });

    for (const r of ROLES) {
      test(`TC-NT-006 ${r.user}: màn mặc định + menu theo vai`, async ({ page }) => {
        await signIn(page, r.user);
        await expect(page.getByRole('heading', { name: r.landing }).first()).toBeVisible();
        const nav = page.getByRole('navigation').first();
        for (const label of r.sees)
          await expect(nav.getByText(label, { exact: true }).first()).toBeVisible();
        for (const label of r.hides)
          await expect(nav.getByText(label, { exact: true })).toHaveCount(0);
      });
    }

    test('TC-NT-010 (E) qa.mgr mở thẳng URL Người dùng & vai → bị từ chối', async ({ page }) => {
      await signIn(page, 'qa.mgr');
      await expect(page.getByRole('heading', { name: /Tổng quan/ }).first()).toBeVisible();
      await page.goto(`${WEB_URL}/settings/users`);
      await expect(
        page.getByText(/không làm được thao tác này|Không có quyền/).first(),
      ).toBeVisible();
    });
  },
);
