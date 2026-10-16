// E2E UI smoke – admin-web Sprint 2: Sơ đồ phòng (rack) + Đặt phòng mới (project desk-chromium, 1366×768).
// TC: TC-L2-001 (E), TC-L2-002 (E – phần chú giải), TC-L2-004 (E – mất mạng), TC-L2-016 (E), TC-L2-020 (E),
// TC-L2-021 (E – hai phiên lưu cùng lúc), TC-L2-076 (E – nhãn "Nhập tay").
// Nhãn lấy từ design/copy/strings-vi.json (nav.rack, rack.*, booking.*). Selector đã chỉnh theo màn thật của FE
// (Sprint 3 kickoff, chạy với web + API thật trên stack compose): rack là `role=grid` (rowheader "Căn 101, …"),
// form đặt phòng là `role=dialog`. Chạy với E2E_UI=1 (cần `playwright install chromium`; CI job docker-build bật).
import { expect, test, type Page } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { cleanupTracked, freeWindow, room, s2Context, track } from '../support/s2.js';
import { SEED_PASSWORD } from '../support/env.js';
import { UI, fakePhone, lettersOnly, newDesk, openRack, signIn, stem, t } from './helpers.js';

/**
 * Fill "Đặt phòng mới" (H09) for a direct booking: dates first (the room list only shows rooms free in the
 * range), room by number, guest via quick-create (Hồ sơ khách mới), phone again if the form still asks for it
 * (BUG-R2-027). Leaves the dialog open, ready for "Tạo đơn".
 */
async function fillBooking(
  p: Page,
  i: { roomNo: string; arrival: string; departure: string; guest: string; phone: string },
): Promise<void> {
  await p
    .getByRole('button', { name: t('booking.new.title') })
    .first()
    .click();
  const d = p.getByRole('dialog', { name: t('booking.new.title') });
  await d.getByRole('textbox', { name: 'Ngày đến' }).fill(i.arrival);
  await d.getByRole('textbox', { name: 'Ngày đi' }).fill(i.departure);
  const roomSel = d.getByRole('combobox', { name: t('booking.field.room'), exact: true });
  const label = (await roomSel.locator('option').allTextContents()).find((o) =>
    o.startsWith(`${i.roomNo} `),
  );
  expect(
    label,
    `căn ${i.roomNo} có trong danh sách căn trống ${i.arrival}→${i.departure}`,
  ).toBeTruthy();
  await roomSel.selectOption({ label: label! });
  await d.getByRole('combobox', { name: t('booking.field.guest') }).fill(i.guest);
  await p.getByRole('option', { name: /Tạo nhanh/ }).click();
  const g = p.getByRole('dialog', { name: 'Hồ sơ khách mới' });
  await g.getByRole('textbox', { name: 'Số điện thoại / Zalo' }).fill(i.phone);
  await g.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(g).toBeHidden();
  const phone = d.getByRole('textbox', { name: t('booking.field.phone') });
  if (await phone.isVisible().catch(() => false)) await phone.fill(i.phone);
}

test.describe(
  'admin-web smoke – Sơ đồ phòng & đặt phòng (Sprint 2)',
  { tag: ['@ui', '@sprint2'] },
  () => {
    test.skip(!UI, 'Chờ FE màn Sơ đồ phòng / Đặt phòng mới (Sprint 2) – chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L2-001 (E) qa.fd mở Sơ đồ phòng: 10 căn × 14 ngày, cột Hôm nay, 1 request getRack', async ({
      page,
    }) => {
      await signIn(page, 'qa.fd');
      const rackCalls: string[] = [];
      page.on('request', (r) => {
        if (/\/v1\/properties\/[^/]+\/rack/.test(r.url())) rackCalls.push(r.url());
      });
      test.skip(!(await openRack(page)), 'Chưa có màn Sơ đồ phòng trên admin-web');
      const grid = page.getByRole('grid').first();
      // 10 căn của BL 4.1, mỗi căn một rowheader "Căn <số>, <tên>, <trạng thái buồng>"
      await expect(
        grid.getByRole('rowheader', { name: /^Căn (101|102|103|201|202|203|301|302|401|402),/ }),
      ).toHaveCount(10);
      await expect(grid.getByRole('columnheader')).toHaveCount(15); // cột Căn + 14 ngày
      await expect(grid.getByRole('columnheader', { name: /Hôm nay/ })).toHaveCount(1);
      // 14 ngày liên tục trong tiêu đề lưới "Sơ đồ phòng dd/mm – dd/mm"
      await expect(grid).toHaveAccessibleName(/\d{2}\/\d{2} – \d{2}\/\d{2}/);
      expect(rackCalls.length, 'một request getRack cho cả lưới (không gọi theo từng căn)').toBe(1);
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
      request,
    }) => {
      // 2 đêm từ thứ Hai, căn 203 trống thật (searchAvailability) – stack dùng lại nhiều lần vẫn không vướng đơn cũ
      const fd = await session(request, 'qa.fd');
      const c = await s2Context(request);
      const { arrival, departure } = await freeWindow(request, fd, room(c, '203'), 2, {
        today: await stackToday(request),
        dow: 1,
      });
      const a = await newDesk(browser, 'qa.fd');
      const b = await newDesk(browser, 'qa.fdl');
      const guests = new Map<Page, string>([
        [a, `Khach Etoe ${lettersOnly()}`],
        [b, `Khach Etoe ${lettersOnly()}`],
      ]);
      for (const p of [a, b]) {
        test.skip(!(await openRack(p)), 'Chưa có màn Sơ đồ phòng trên admin-web');
        await fillBooking(p, {
          roomNo: '203',
          arrival,
          departure,
          guest: guests.get(p)!,
          phone: fakePhone(),
        });
      }
      const writes = new Map<Page, string[]>([
        [a, []],
        [b, []],
      ]);
      for (const p of [a, b])
        p.on('response', (r) => {
          const m = r.request().method();
          if (m === 'POST' && /\/reservations$/.test(r.url()) && r.status() === 201)
            void r
              .json()
              .then((j: { id?: string }) => j.id && track('reservation', j.id))
              .catch(() => undefined);
          if (m !== 'GET' && /\/v1\/properties\//.test(r.url()))
            writes
              .get(p)!
              .push(
                `${m} ${new URL(r.url()).pathname.split('/').slice(4).join('/')} ${r.status()}`,
              );
        });
      await Promise.all(
        [a, b].map((p) =>
          p
            .getByRole('dialog', { name: t('booking.new.title') })
            .getByRole('button', { name: t('booking.create'), exact: true })
            .click(),
        ),
      );
      const created = stem('booking.toast.created');
      // Bên thua: 409 ROOM_UNAVAILABLE (không chi tiết) → booking.error.server_conflict; 409 CONCURRENT_UPDATE (0.3.5) →
      // error.CONCURRENT_UPDATE (ĐK-S2-3). Câu error.server "Máy chủ đang gặp sự cố" là SAI (BUG-R2-026).
      // 409 ROOM_UNAVAILABLE có `conflicts[]` (bên kia đã commit trước) → booking.error.conflict nêu căn/khách/ngày.
      const loserTexts: Array<string | RegExp> = [
        t('booking.error.server_conflict'),
        stem('error.CONCURRENT_UPDATE'),
        new RegExp(
          t('booking.error.conflict')
            .split(/\{[a-z_]+\}/)
            .map((x) => x.replace(/[.*+?^$()|[\]\\]/g, '\\$&'))
            .join('.+')
            .slice(0, 80),
        ),
      ];
      const conflictText = new Map<Page, string>();
      const outcome = async (p: Page): Promise<string> => {
        const deadline = Date.now() + 15_000;
        while (Date.now() < deadline) {
          if (
            await p
              .getByText(created)
              .first()
              .isVisible()
              .catch(() => false)
          )
            return 'created';
          for (const txt of loserTexts)
            if (
              await p
                .getByText(txt)
                .first()
                .isVisible()
                .catch(() => false)
            ) {
              conflictText.set(p, await p.getByText(txt).first().innerText());
              return 'conflict';
            }
          if (
            await p
              .getByText(stem('error.server'))
              .first()
              .isVisible()
              .catch(() => false)
          )
            return 'error.server (BUG-R2-026)';
          await p.waitForTimeout(250);
        }
        const alerts = await p.getByRole('alert').allInnerTexts();
        const status = await p.getByRole('status').allInnerTexts();
        return `none [alert: ${alerts.join(' / ')}] [status: ${status.join(' / ')}]`;
      };
      const outcomes = await Promise.all([a, b].map(outcome));
      expect(
        [...outcomes].sort(),
        `qa.fd=${outcomes[0]} ${conflictText.get(a) ?? ''} [${writes.get(a)!.join(', ')}] | qa.fdl=${outcomes[1]} ${conflictText.get(b) ?? ''} [${writes.get(b)!.join(', ')}]`,
      ).toEqual(['conflict', 'created']);
      const loser = outcomes[0] === 'conflict' ? a : b;
      // form của bên thua còn nguyên (khách đã chọn vẫn ở ô Khách đứng tên)
      await expect(
        loser
          .getByRole('dialog', { name: t('booking.new.title') })
          .getByRole('combobox', { name: t('booking.field.guest') }),
      ).toHaveValue(guests.get(loser)!);
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
