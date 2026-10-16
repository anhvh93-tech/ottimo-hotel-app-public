// E2E UI smoke – admin-web Sprint 2: Sơ đồ phòng (rack) + Đặt phòng mới (project desk-chromium, 1366×768).
// TC: TC-L2-001 (E), TC-L2-002 (E – phần chú giải), TC-L2-004 (E – mất mạng), TC-L2-016 (E), TC-L2-020 (E),
// TC-L2-021 (E – hai phiên lưu cùng lúc), TC-L2-076 (E – nhãn "Nhập tay").
// Nhãn lấy từ design/copy/strings-vi.json (nav.rack, rack.*, booking.*). Selector là dự kiến theo UXD hi-fi –
// QA chỉnh khi FE có màn. Bỏ qua tới khi FE xong: chạy với E2E_UI=1 (cần `playwright install chromium`);
// tự bỏ qua khi admin-web chưa có trang Sơ đồ phòng.
import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';

const UI = process.env.E2E_UI === '1';
const VI = JSON.parse(
  readFileSync(new URL('../../../design/copy/strings-vi.json', import.meta.url), 'utf8'),
) as Record<string, string>;
const t = (key: string) => {
  const v = VI[key];
  if (!v) throw new Error(`strings-vi.json thiếu ${key}`);
  return v;
};
/** Static part of a copy string with {placeholders} (for getByText regex). */
const stem = (key: string) => t(key).split('{')[0]!.trim();

async function signIn(page: Page, user: string): Promise<void> {
  await page.goto(WEB_URL);
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

async function openRack(page: Page): Promise<boolean> {
  await page
    .getByRole('link', { name: t('nav.rack') })
    .first()
    .click();
  return page
    .getByText(t('rack.col_room'), { exact: true })
    .first()
    .waitFor({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
}

async function newDesk(browser: Browser, user: string): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'vi-VN' });
  const page = await ctx.newPage();
  await signIn(page, user);
  return page;
}

test.describe(
  'admin-web smoke – Sơ đồ phòng & đặt phòng (Sprint 2)',
  { tag: ['@ui', '@sprint2'] },
  () => {
    test.skip(!UI, 'Chờ FE màn Sơ đồ phòng / Đặt phòng mới (Sprint 2) – chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L2-001 (E) qa.fd mở Sơ đồ phòng: 10 căn × 14 ngày, cột Hôm nay, 1 request getRack', async ({
      page,
    }) => {
      await signIn(page, 'qa.fd');
      const rackCalls: string[] = [];
      page.on('request', (r) => {
        if (/\/v1\/properties\/[^/]+\/rack/.test(r.url())) rackCalls.push(r.url());
      });
      test.skip(!(await openRack(page)), 'Chưa có màn Sơ đồ phòng trên admin-web');
      await expect(page.getByText(t('rack.by_room'))).toBeVisible();
      await expect(
        page.getByRole('row').filter({ hasText: /^(101|102|103|201|202|203|301|302|401|402)/ }),
      ).toHaveCount(10);
      await expect(page.getByRole('columnheader')).toHaveCount(15); // cột Căn + 14 ngày
      await expect(page.getByText(/Hôm nay/).first()).toBeVisible();
      expect(rackCalls.length).toBe(1);
    });

    test('TC-L2-002 (E) chú giải luôn hiện: giữ chỗ, chưa gán căn, bộ đồ dùng thêm, nhập tay', async ({
      page,
    }) => {
      await signIn(page, 'qa.fd');
      test.skip(!(await openRack(page)), 'Chưa có màn Sơ đồ phòng trên admin-web');
      for (const key of ['rack.legend_unassigned', 'rack.legend_kit', 'rack.manual_legend']) {
        await expect(page.getByText(t(key)).first(), key).toBeVisible();
      }
    });

    test('TC-L2-004 (E) mất mạng: chỉ xem, khóa tạo/sửa đơn, có banner', async ({
      page,
      context,
    }) => {
      await signIn(page, 'qa.fd');
      test.skip(!(await openRack(page)), 'Chưa có màn Sơ đồ phòng trên admin-web');
      await context.setOffline(true);
      await expect(page.getByText(stem('rack.offline')).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('button', { name: t('booking.new.title') })).toBeDisabled();
      await context.setOffline(false);
    });

    test('TC-L2-016 (E) SAL và CTV không có nút Đặt phòng mới', async ({ browser }) => {
      for (const user of ['qa.sal', 'qa.ctv1']) {
        const page = await newDesk(browser, user);
        await expect(page.getByRole('button', { name: t('booking.new.title') })).toHaveCount(0);
        await expect(page.getByRole('link', { name: t('booking.new.title') })).toHaveCount(0);
        await page.context().close();
      }
    });

    test('TC-L2-021 (E) hai lễ tân cùng lưu một căn – đêm: một bên "Đã tạo đơn", bên kia báo căn vừa được đặt, form còn nguyên', async ({
      browser,
    }) => {
      const a = await newDesk(browser, 'qa.fd');
      const b = await newDesk(browser, 'qa.fdl');
      for (const p of [a, b]) {
        test.skip(!(await openRack(p)), 'Chưa có màn Sơ đồ phòng trên admin-web');
        await p
          .getByRole('button', { name: t('booking.new.title') })
          .first()
          .click();
        await p.getByLabel(t('booking.field.room')).selectOption({ label: '203' });
        await p.getByLabel(t('booking.field.guest')).fill('Khach Etoe Giao Dien');
        await p.getByLabel(t('booking.field.phone')).fill('0939000021');
      }
      await Promise.all([
        a.getByRole('button', { name: t('booking.create') }).click(),
        b.getByRole('button', { name: t('booking.create') }).click(),
      ]);
      const created = stem('booking.toast.created');
      const conflict = t('booking.error.server_conflict');
      const outcomes = await Promise.all(
        [a, b].map(async (p) =>
          (await p
            .getByText(created)
            .first()
            .isVisible()
            .catch(() => false))
            ? 'created'
            : (await p
                  .getByText(conflict)
                  .first()
                  .isVisible()
                  .catch(() => false))
              ? 'conflict'
              : 'none',
        ),
      );
      expect(outcomes.sort()).toEqual(['conflict', 'created']);
      const loser = outcomes[0] === 'conflict' ? a : b;
      await expect(loser.getByLabel(t('booking.field.guest'))).toHaveValue('Khach Etoe Giao Dien');
      await a.context().close();
      await b.context().close();
    });

    test.fixme('TC-L2-020 (E) trùng đêm: thông báo nêu khoảng ngày + căn trống cùng nhóm', async () => {
      // Cần FE chốt luồng chọn ngày trên form; kỳ vọng chữ: booking.error.conflict / conflict_alt (strings-vi.json).
    });

    test.fixme('TC-L2-076 (E) đơn dài hạn nhập tay hiện nhãn "Nhập tay" trên rack', async () => {
      // Cần dữ liệu đơn AC5a (tạo qua API trong beforeAll) + selector thanh rack của FE; nhãn: rack.manual_badge.
    });
  },
);
