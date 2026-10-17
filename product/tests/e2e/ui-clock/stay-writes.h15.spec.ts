// E2E UI – H15 lưu trú: bước GHI bấm thật trên Desk cho đơn ĐANG Ở (QC-S3-09, ĐK-S3-9, vòng sửa 9 Sprint 3).
// Project desk-clock (Chromium 1366×768, MutableClock, tuần tự sau project clock): mỗi ca một ngày ảo riêng
// (virtualDay > hôm nay + 800) → không chiếm căn của hôm nay, không cần hoàn tác nhận phòng sau khi đã ghi folio.
// Nhận phòng làm bằng API (không phải đối tượng kiểm); bước đang kiểm bấm trên giao diện, request trình duyệt gửi
// được ghi lại (ui/write-steps.ts) và phải 2xx; kết quả đọc lại bằng API; tiền so với oracle br-examples.json.
// Đồng hồ trình duyệt = đồng hồ ảo (page.clock): Desk lấy "hôm nay" của trình duyệt cho effectiveFrom.
// TC: r1-main-flows.md v0.3.10 – TC-L3-076, TC-L4-095. Lỗi: BUG-R2-071 (UXR #7), BUG-R2-066 (UXR #2), BUG-R2-070 (UXR #6).
import { expect, test } from '@playwright/test';
import { call, session, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import {
  cleanupTracked,
  getReservation,
  oracle,
  oracleNum,
  s2Context,
  vnTime,
  type Room,
} from '../support/s2.js';
import {
  EP3,
  PNG_16X16,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  namedGuest,
  p3,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { UI, signIn, t } from '../ui/helpers.js';
import {
  amountRe,
  dialogs,
  drawerBalance,
  drawerPaid,
  photo,
  recordWrites,
  trustedDesk,
  vnd,
  waitWrite,
} from '../ui/write-steps.js';

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (key: string): string => t(key).split('{')[0]!.trim();

interface CatalogItem {
  code: string;
  category: string;
  name: string;
  defaultUnitPriceVnd: number;
  evidenceRequired?: boolean;
  priceEditable?: boolean;
}

// Mỗi ca chạy trên ngày ảo riêng, độc lập (không mode 'serial' – xem ui-clock/checkout.h16.spec.ts).
test.describe.configure({ mode: 'default' });
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'UI H15 – bước ghi khi khách đang ở: thêm người có phụ thu, phát sinh có ảnh (MutableClock, QC-S3-09)',
  { tag: ['@ui', '@sprint3', '@clock', '@write'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L3-076 (E) US-022/AC4 H15 thêm người lớn vượt định mức khi khách đang ở: Desk hiện phụ thu, lễ tân xác nhận đã báo khách → ghi đúng 150.000 × 3 đêm; "Đã thu" không đổi (BUG-R2-071, BUG-R2-070)', async ({
      page,
      request,
    }) => {
      test.slow();
      needClock('TC-L3-076 (E)');
      const D = virtualDay(await stackToday(request), 4);
      await useVirtualDevice(request, await setClock(request, vnTime(D, '14:30')));
      cleanRooms();
      const c = await s2Context(request);
      const fd = await session(request, 'qa.fd');
      // căn định mức 2, sức chứa 3 (Lầu 1–2): 2 người lớn trong đơn, người thứ 3 vượt định mức (BR-110)
      const l12: Room[] = c.rooms.filter(
        (r) => (r.baseOccupancy ?? 0) === 2 && (r.maxOccupancy ?? 0) >= 3,
      );
      expect(l12.length, 'DS-E có căn định mức 2 / sức chứa 3').toBeGreaterThan(0);
      const st = await inHouse(request, c, fd, {
        room: l12[0]!,
        alternatives: l12,
        arrival: D,
        nights: 3,
        adults: 2,
      });
      // người lớn thứ 2 (trong số khách của đơn – không phụ thu): API
      const g1 = await namedGuest(request, fd);
      const a1 = await call<{ occupancyChange?: unknown }>(
        request,
        'POST',
        p3(EP3.addPartyMember, fd, { reservationId: st.res.id }),
        {
          session: fd,
          idempotencyKey: true,
          body: { role: 'companion', guestId: g1.id, relationship: 'friend', effectiveFrom: D },
        },
      );
      expect(a1.status, JSON.stringify(a1.body)).toBe(201);
      expect(a1.body.occupancyChange ?? null).toBeNull();
      // oracle BR-110-06: phụ thu 1 người vượt định mức / đêm; người thứ 3 ở từ đêm D tới hết đơn = 3 đêm
      const perNight =
        oracleNum('BR-110-06', 'extraPersonFeeVnd') / Number(oracle('BR-110-06').input.nights);
      const want = perNight * 3;
      const f0 = await getFolio(request, fd, String(st.res.folioId));

      // ── lễ tân thêm người lớn thứ 3 trên Desk ──
      const g2 = await namedGuest(request, fd);
      await page.clock.setFixedTime(new Date(vnTime(D, '14:40')));
      await trustedDesk(page);
      await signIn(page, 'qa.fd');
      const party = recordWrites(page, 'POST', /\/reservations\/[^/]+\/party$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
      await expect(page.getByText(st.res.code).first()).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: t('rsv.add_person'), exact: true }).click();
      const dlg = page.getByRole('dialog', { name: t('rsv.party') });
      await expect(dlg).toBeVisible();
      await expect(dlg.getByText(g1.fullName)).toBeVisible({ timeout: 10_000 });
      await dlg.getByRole('combobox', { name: t('booking.field.guest') }).fill(g2.fullName);
      // CI 39010774166: tên option khách BẮT ĐẦU bằng tên (avatar aria-hidden); "Tạo nhanh khách "<tên>"" cũng chứa
      // tên – neo ^ để không bao giờ bấm nhầm ô tạo nhanh (trước đây nó là option đầu tiên khi tìm kiếm chưa trả lời).
      await page
        .getByRole('option', { name: new RegExp(`^${esc(g2.fullName)}`) })
        .first()
        .click();
      // DOM S3-12 / BR-414: phụ thu > 0 không bao giờ bị bỏ qua im lặng – lễ tân phải THẤY số tiền và xác nhận đã
      // báo khách trước khi ghi (UXR #7: Desk luôn gửi applyExtraPersonSurcharge=false, không có ô xác nhận →
      // 422 SURCHARGE_DECISION_REQUIRED và câu báo của màn nhận phòng). Số tiền có thể hiện ngay khi chọn khách
      // (thử trước – dryRun) hoặc sau lần bấm "Thêm vào đơn" đầu tiên.
      const shown = dialogs(page).getByText(amountRe(want)).first();
      const early = await shown.waitFor({ timeout: 3_000 }).then(
        () => true,
        () => false,
      );
      if (!early) await dlg.getByRole('button', { name: t('rsv.add_submit') }).click();
      await expect(shown, `Desk hiện phụ thu ${vnd(want)} trước khi ghi`).toBeVisible({
        timeout: 10_000,
      });
      const told = dialogs(page)
        .getByRole('checkbox', { name: /báo khách/i })
        .or(dialogs(page).getByRole('switch', { name: /báo khách|phụ thu/i }))
        .first();
      await expect(told, 'ô "Tôi đã báo khách khoản phụ thu này"').toBeVisible();
      await told.check();
      const confirm = page.getByRole('alertdialog');
      if (await confirm.isVisible().catch(() => false)) {
        await confirm.getByRole('button').last().click();
      } else {
        await dlg.getByRole('button', { name: t('rsv.add_submit') }).click();
      }
      const added = await waitWrite(
        party,
        'addPartyMember người lớn thứ 3 (có phụ thu)',
        201,
        (s) => s.request?.dryRun !== true,
      );
      expect(added.request, 'quyết định phụ thu gửi kèm số lễ tân đã thấy').toMatchObject({
        role: 'companion',
        guestId: g2.id,
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: want,
        effectiveFrom: D,
      });
      await expect(dlg.getByText(g2.fullName)).toBeVisible({ timeout: 10_000 });

      // ── kết quả: số người, folio (BR-110), drawer "Đã thu" / "Còn phải thu" ──
      expect((await getReservation(request, fd, st.res.id)).body.adults).toBe(3);
      const f = await getFolio(request, fd, String(st.res.folioId));
      const extra = liveLines(f, 'extra_person');
      expect(
        extra.reduce((s, l) => s + l.amountVnd, 0),
        'phụ thu người BR-110 × 3 đêm',
      ).toBe(want);
      expect(f.totals.paidVnd, 'thêm người không đổi số đã thu').toBe(f0.totals.paidVnd);
      expect(f.totals.balanceDueVnd).toBe(f0.totals.balanceDueVnd + want);
      await dlg
        .getByRole('button', { name: t('common.close') })
        .last()
        .click();
      await expect(dlg).toBeHidden();
      // UXR #6: "Đã thu" = tiền phòng − còn phải thu → sau phụ thu sẽ hụt đúng số phụ thu
      await expect
        .poll(() => drawerBalance(page), { timeout: 10_000, message: '"Còn phải thu" sau phụ thu' })
        .toBe(f.totals.balanceDueVnd);
      await expect
        .poll(() => drawerPaid(page), {
          timeout: 10_000,
          message: `"Đã thu" = ${vnd(f.totals.paidVnd)} (folio), không phải tiền phòng − còn phải thu`,
        })
        .toBe(f.totals.paidVnd);
    });

    test('TC-L4-095 (E) US-032/AC2 H15 thêm phát sinh phải có bằng chứng, đính ẢNH từ buồng phòng → ghi được, dòng folio mang đúng ảnh (BUG-R2-066)', async ({
      page,
      request,
    }) => {
      test.slow();
      needClock('TC-L4-095 (E)');
      const D = virtualDay(await stackToday(request), 2);
      await useVirtualDevice(request, await setClock(request, vnTime(D, '14:30')));
      cleanRooms();
      const c = await s2Context(request);
      const fd = await session(request, 'qa.fd');
      const st = await inHouse(request, c, fd, {
        room: c.rooms[0]!,
        alternatives: c.rooms,
        arrival: D,
        nights: 1,
      });
      // khoản phạt/hư hỏng theo bảng (giá không sửa, bắt buộc ảnh hoặc ghi chú – BR-511/512)
      const cat = await call<{ data: CatalogItem[] }>(
        request,
        'GET',
        p3(EP3.getChargeCatalog, fd),
        {
          session: fd,
        },
      );
      expect(cat.status, JSON.stringify(cat.body).slice(0, 300)).toBe(200);
      const evidence = cat.body.data.filter((x) => x.evidenceRequired && !x.priceEditable);
      const item = evidence.find((x) => x.code === 'bath_towel') ?? evidence[0];
      expect(item, 'danh mục có khoản cần bằng chứng (BR-511/512)').toBeTruthy();

      await page.clock.setFixedTime(new Date(vnTime(D, '15:00')));
      await trustedDesk(page);
      await signIn(page, 'qa.fd');
      const uploads = recordWrites(page, 'POST', /\/attachments$/);
      const lines = recordWrites(page, 'POST', /\/folios\/[^/]+\/lines$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
      await expect(page.getByText(st.res.code).first()).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: t('stay.add_charge'), exact: true }).click();
      const dlg = page.getByRole('dialog', { name: t('stay.add_charge') });
      await expect(dlg).toBeVisible();
      await dlg
        .getByRole('combobox', { name: t('stay.charge_item') })
        .selectOption({ label: item!.name });
      await dlg.getByLabel(t('stay.add_photo')).setInputFiles(photo(PNG_16X16, 'khan-tam.png'));
      await dlg.getByRole('button', { name: t('stay.add_charge_submit') }).click();
      // UXR #2: Idempotency-Key "<key>-a" của lần tải ảnh không phải UUID → 422, không thêm được phát sinh
      const up = await waitWrite(uploads, 'uploadAttachment penalty_evidence (ảnh)', 201);
      const line = await waitWrite(lines, 'addFolioLine (phát sinh có ảnh)', 201);
      const attachmentId = (JSON.parse(up.body) as { id: string }).id;
      expect(line.request).toMatchObject({
        chargeCode: item!.code,
        evidenceAttachmentIds: [attachmentId],
      });
      await expect(dlg).toBeHidden({ timeout: 10_000 });
      await expect(
        page.getByText(new RegExp(esc(stem('stay.toast.charge_added')))).first(),
      ).toBeVisible();
      const f = await getFolio(request, fd, String(st.res.folioId));
      expect(
        liveLines(f).some(
          (l) => l.category === item!.category && l.amountVnd === item!.defaultUnitPriceVnd,
        ),
        `dòng "${item!.name}" ${vnd(item!.defaultUnitPriceVnd)} trong folio`,
      ).toBe(true);
    });
  },
);
