// E2E UI Sprint 4 – màn vận hành của FE-B không cần đồng hồ ảo (s4-test-plan mục 5.3). Project desk-chromium.
//   - S13 /settings/minibar (US-066, US-003 AC2): lễ tân, lễ tân trưởng chỉ đọc – không có cột giá vốn, không nút
//     Thêm/Sửa, có câu "Chỉ quản lý và chủ đầu tư sửa…"; quản lý thấy giá vốn và nút Sửa (mở được hộp sửa, KHÔNG lưu:
//     giá minibar DS-E là dữ liệu chung của oracle BR-702 – đổi giá thuộc project `serial`, chưa viết).
// Chưa viết ở tệp này (bước tiếp theo, s4-test-plan 5.3): H03 hàng yêu cầu khách (US-110), khóa có kế hoạch (US-019).
// TC: r1-main-flows.md – TC-RB-017 (E), TC-RB-003 (E).
import { expect, test } from '@playwright/test';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { scan, settle } from './axe.js';
import { UI, signIn, t } from './helpers.js';
import { dialogs } from './write-steps.js';

test.describe(
  'UI S13 /settings/minibar – quyền xem/sửa danh mục minibar (FE-B, US-066, US-003)',
  { tag: ['@ui', '@sprint4'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    for (const user of ['qa.fd', 'qa.fdl']) {
      test(`TC-RB-017 (E) + TC-RB-003 (E) US-066/AC3; US-003/AC2 S13 ${user}: chỉ đọc – không cột giá vốn, không nút Thêm/Sửa, có câu chỉ quản lý sửa`, async ({
        page,
      }) => {
        await signIn(page, user);
        await page.goto(`${WEB_URL}/settings/minibar`);
        const table = page.getByRole('table');
        await expect(table).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('note')).toContainText(t('mb.readonly'));
        await expect(table.getByRole('columnheader', { name: t('mb.col.sale') })).toBeVisible();
        await expect(table.getByRole('columnheader', { name: t('mb.col.cost') })).toHaveCount(0);
        await expect(page.getByRole('button', { name: t('mb.add') })).toHaveCount(0);
        await expect(table.getByRole('button', { name: t('rooms.edit'), exact: true })).toHaveCount(
          0,
        );
        await settle(page);
        await scan(page, test.info(), `S13-readonly-${user}`);
      });
    }

    test('TC-RB-003 (E) US-066/AC1 S13 qa.mgr: thấy cột giá vốn và nút Sửa; hộp sửa mở đúng mặt hàng (không lưu)', async ({
      page,
    }) => {
      await signIn(page, 'qa.mgr');
      await page.goto(`${WEB_URL}/settings/minibar`);
      const table = page.getByRole('table');
      await expect(table).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('note').filter({ hasText: t('mb.readonly') })).toHaveCount(0);
      await expect(table.getByRole('columnheader', { name: t('mb.col.cost') })).toBeVisible();
      await expect(page.getByRole('button', { name: t('mb.add') })).toBeVisible();
      const row = table.getByRole('row').filter({ hasText: /Bia/ }).first();
      const name = (await row.getByRole('cell').nth(1).innerText()).trim();
      await row.getByRole('button', { name: t('rooms.edit'), exact: true }).click();
      const dlg = dialogs(page).filter({
        hasText: t('mb.edit_title').replace('{name}', name),
      });
      await expect(dlg).toBeVisible();
      await settle(page);
      await scan(page, test.info(), 'S13-edit-mgr');
      await dlg.getByRole('button', { name: t('common.cancel'), exact: true }).click();
      await expect(dlg).toBeHidden();
    });
  },
);
