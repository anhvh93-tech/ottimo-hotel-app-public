// R-1.3 (PO `rounds/round-02/outputs/PO/s4-acceptance.md`, round-qc-gate mục 5 Đợt 1): ca UI cho các AC còn "Chờ ca UI"
// đóng được không cần VPS – bấm thật trên Desk với API thật, đồng hồ ảo (project desk-clock).
// - TC-L8-001 (E) + TC-L8-002 (E) US-010 AC1/AC2: KPI đêm nay trên H03 với bộ dữ liệu đúng AC1 (6 căn bán, 1 OOO, 1 giữ
//   chỗ → 6/9 kèm chú thích mẫu số), rồi dữ liệu đổi (hủy 1 đơn → 5/9, đặt 1 đơn → 6/9, nhận phòng → "Đang ở" +1).
// - TC-L8-005 (E) US-012 AC1: dòng "Khai báo lưu trú hôm nay" → bấm "Mở" → màn khai báo (không nhánh điều kiện).
// - TC-L8-007 (E) US-012 AC3: khách NN thị thực hết trước ngày đi → dòng nêu mã đơn, không nêu ngày; bấm mở đơn.
// - TC-L8-008 (E) US-012 AC4: giữ chỗ sắp hết hạn, căn khóa OOO, phiếu sửa Gấp – mỗi loại một dòng.
// - TC-L4-054 (E) US-038 AC2: folio `settled` – lễ tân không có nút sửa dòng; quản lý ghi điều chỉnh có lý do (A32).
// US-012 AC5 (trạng thái rỗng) KHÔNG ở đây: "Cần chú ý" đọc dữ liệu toàn cơ sở (phiếu Gấp, khai báo quá hạn… của ca
// khác), nên trên stack CI dùng chung không bao giờ rỗng – kiểm bằng lượt chạy tay có ảnh trên CSDL mới (qa/r1-3-ui-run.md).
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { call, needSeedPassword, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { WEB_URL } from '../support/env.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import {
  action,
  addDays,
  cleanupTracked,
  createRoomBlock,
  makeHold,
  room,
  s2Context,
  vnTime,
} from '../support/s2.js';
import { checkOutStay } from '../support/s3-checkin.js';
import {
  addDocument,
  addLine,
  checkIn,
  cleanRooms,
  foreignDoc,
  getFolio,
  inHouse,
  makeStay,
  namedGuest,
  payBalance,
  stackBusinessDate,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { scan } from '../ui/axe.js';
import { desk } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
const stem = (key: string): string => t(key).split('{')[0]!.trim();
const st4 = (): string => Date.now().toString(36).slice(-4);
/** Dòng "Giữ chỗ {code} hết hạn lúc {time}" bất kể có mã đơn hay không (BUG-R2-217). */
const holdLine = (time: string, code = '.*'): RegExp => {
  const [a, b] = t('attn.hold_expiring').split('{code}') as [string, string];
  return new RegExp(`${esc(a)}${code}${esc(b.replace('{time}', time))}`);
};

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

async function at(request: APIRequestContext, date: string, hhmm: string): Promise<void> {
  await useVirtualDevice(request, await setClock(request, vnTime(date, hhmm)));
}

/** Ô KPI trên H03 theo nhãn (`today.kpi_*`). */
const kpi = (page: Page, key: string): Locator =>
  page.locator('.kpis .kpi').filter({ has: page.getByText(t(key), { exact: true }) });

/** Số đêm nay của API (getTonightKpi) – để báo lệch giữa màn và server khi ca đỏ. */
async function tonight(request: APIRequestContext): Promise<Json> {
  const fd = await sessionOrSkip(request, 'qa.fd');
  const r = await call<Json>(
    request,
    'GET',
    `/v1/properties/${propertyIdOf(fd)}/dashboard/tonight`,
    {
      session: fd,
    },
  );
  expect(r.status, JSON.stringify(r.body).slice(0, 200)).toBe(200);
  return r.body;
}

test.describe(
  'R-1.3 – ca UI cho AC "Chờ ca UI": US-010 AC1/AC2, US-012 AC1/AC3/AC4, US-038 AC2',
  { tag: ['@ui', '@sprint4', '@clock'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');

    test('TC-L8-001 (E) + TC-L8-002 (E) + TC-L8-005 (E) + TC-L8-007 (E) + TC-L8-008 (E) US-010/AC1, US-010/AC2, US-012/AC1, US-012/AC3, US-012/AC4: H03 – đêm D có 6 căn bán (3 đang ở, 3 đến), 401 OOO, 301 chỉ giữ chỗ → "Công suất đêm nay" 6/9 kèm chú thích mẫu số; hủy 1 đơn → 5/9, đặt 1 đơn → 6/9, nhận phòng → "Đang ở" tăng; "Cần chú ý": khai báo hôm nay → Mở màn khai báo, thị thực hết trước ngày đi nêu mã đơn → Mở đơn; 10:30 giữ chỗ sắp hết hạn (12:00), căn khóa, phiếu Gấp – mỗi loại một dòng + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      test.setTimeout(6 * 60_000);
      needClock('TC-L8-001');
      const D = virtualDay(realToday, 4);
      const prev = addDays(D, -1);
      const c = await s2Context(request);
      // ── D−1 14:00: 101, 102, 103 nhận phòng 2 đêm (đang ở đêm D); 301 giữ chỗ cho đêm D (hết hạn D 12:00 – BR-302) ──
      await at(request, prev, '14:00');
      cleanRooms();
      let fd = await sessionOrSkip(request, 'qa.fd');
      const inHouseRooms = ['101', '102', '103'];
      for (const no of inHouseRooms)
        await inHouse(request, c, fd, { room: room(c, no), arrival: prev, nights: 2 });
      const { hold } = await makeHold(request, fd, c, {
        rooms: [room(c, '301')],
        arrival: D,
        nights: 1,
        holdHours: 24,
      });
      // ── D 07:00: 201, 202 (khách VN) và 203 (khách NN, thị thực đến D+1, ở 2 đêm) đến hôm nay; 401 OOO; phiếu Gấp ──
      await at(request, D, '07:00');
      fd = await sessionOrSkip(request, 'qa.fd');
      const s201 = await makeStay(request, c, fd, { room: room(c, '201'), arrival: D, nights: 1 });
      const s202 = await makeStay(request, c, fd, { room: room(c, '202'), arrival: D, nights: 1 });
      const visaGuest = await namedGuest(request, fd, { fullName: 'Daniel Weber' });
      const s203 = await makeStay(request, c, fd, {
        room: room(c, '203'),
        arrival: D,
        nights: 2,
        adults: 1,
        guestId: visaGuest.id,
        doc: false,
      });
      const visaDoc = await addDocument(
        request,
        fd,
        s203.regId,
        foreignDoc(
          'Daniel Weber',
          addDays(D, 2),
          { visaValidUntil: addDays(D, 1) },
          await stackBusinessDate(request),
        ),
      );
      expect(visaDoc.status, JSON.stringify(visaDoc.body).slice(0, 300)).toBe(201);
      const mt = await sessionOrSkip(request, 'qa.mt');
      const blk = await createRoomBlock(request, mt, {
        roomId: room(c, '401').id,
        startDate: D,
        endDatePlanned: addDays(D, 1),
        reason: 'E2E R-1.3 thay binh nong lanh',
      });
      expect(blk.status, JSON.stringify(blk.body).slice(0, 200)).toBe(201);
      const wo = await call<Json>(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(mt)}/work-orders`,
        {
          session: mt,
          idempotencyKey: true,
          body: {
            roomId: room(c, '401').id,
            title: `Ro nuoc tran ${st4()}`,
            description: 'Tran nha tam ro nuoc',
            severity: 'high',
            category: 'leak',
          },
        },
      );
      expect(wo.status, JSON.stringify(wo.body).slice(0, 200)).toBe(201);

      // ── D 08:00: H03 – KPI AC1 ──
      await at(request, D, '08:00');
      const api0 = await tonight(request);
      let page: Page = await desk(browser, 'qa.fd', vnTime(D, '08:00'));
      try {
        await page.goto(`${WEB_URL}/today`);
        const occ = kpi(page, 'today.kpi_occupancy');
        await expect(occ, `H03 công suất (API: ${JSON.stringify(api0)})`).toContainText(
          tf('today.kpi_occupancy_note', { sold: 6, sellable: 9, blocked: 1 }),
          { timeout: 20_000 },
        );
        await expect(occ, 'giữ chỗ không là đêm bán (BR-904)').toContainText(
          tf('today.kpi_holds', { n: 1 }),
        );
        await expect(occ.locator('.v'), '6/9 = 66,7 %').toHaveText(/66[,.]7\s?%/);
        await expect(kpi(page, 'today.kpi_in_house').locator('.v')).toHaveText('3');
        await expect(kpi(page, 'today.kpi_arrivals').locator('.v')).toHaveText('3');
        await scan(page, test.info(), 'H03-kpi-r13');

        // ── "Cần chú ý" AC3: thị thực – mã đơn, không có ngày hết hạn; bấm Mở → đơn ──
        const attn = page.locator('section[aria-labelledby="today-attn"]');
        const visaRow = attn
          .getByRole('listitem')
          .filter({ hasText: tf('attn.visa_expiring', { code: s203.res.code }) });
        await expect(visaRow, 'dòng thị thực nêu mã đơn').toBeVisible({ timeout: 20_000 });
        const ddmm = `${addDays(D, 1).slice(8, 10)}/${addDays(D, 1).slice(5, 7)}`;
        await expect(visaRow, 'không hiện ngày hết hạn thị thực (SR-RET-06)').not.toContainText(
          ddmm,
        );
        await visaRow.getByRole('link', { name: t('today.open') }).click();
        await expect(page).toHaveURL(new RegExp(`/reservations/${s203.res.id}`));
        await expect(page.getByText(s203.res.code).first()).toBeVisible({ timeout: 15_000 });

        // ── AC1: khai báo hôm nay → Mở → màn khai báo (H14) ──
        await page.goto(`${WEB_URL}/today`);
        const regRow = attn
          .getByRole('listitem')
          .filter({ hasText: stem('attn.registration_due') });
        await expect(regRow, 'dòng khai báo lưu trú hôm nay').toBeVisible({ timeout: 20_000 });
        await regRow.getByRole('link', { name: t('today.open') }).click();
        await expect(page, 'mở màn khai báo').toHaveURL(/\/registration/);
        await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

        // ── AC2: dữ liệu đổi → tải lại → KPI đổi theo ──
        const owner = await sessionOrSkip(request, 'qa.owner');
        const cx = await action(request, owner, s202.res.id, 'cancel', {
          reasonCode: 'other',
          note: 'E2E R-1.3 khach huy',
        });
        expect(cx.status, JSON.stringify(cx.body).slice(0, 300)).toBe(200);
        await page.goto(`${WEB_URL}/today`);
        await expect(kpi(page, 'today.kpi_occupancy')).toContainText(
          tf('today.kpi_occupancy_note', { sold: 5, sellable: 9, blocked: 1 }),
          { timeout: 20_000 },
        );
        fd = await sessionOrSkip(request, 'qa.fd');
        await makeStay(request, c, fd, { room: room(c, '302'), arrival: D, nights: 1 });
        await page.reload();
        await expect(kpi(page, 'today.kpi_occupancy')).toContainText(
          tf('today.kpi_occupancy_note', { sold: 6, sellable: 9, blocked: 1 }),
          { timeout: 20_000 },
        );
        const ci = await checkIn(request, fd, s201.res.id);
        expect(ci.status, JSON.stringify(ci.body).slice(0, 300)).toBe(200);
        await page.reload();
        await expect(kpi(page, 'today.kpi_in_house').locator('.v')).toHaveText('4', {
          timeout: 20_000,
        });
        await expect(kpi(page, 'today.kpi_arrivals')).toContainText(
          tf('today.kpi_arrivals_note', { done: 1 }),
        );
      } finally {
        await page.context().close();
      }

      // ── D 10:30: AC4 – giữ chỗ 301 hết hạn 12:00 (24 giờ nhưng không quá `hold_latest_time_on_arrival` 12:00 ngày
      // đến – BR-302), tức trong 2 giờ nhắc của BR-303; căn khóa 401; phiếu Gấp ──
      await at(request, D, '10:30');
      page = await desk(browser, 'qa.fd', vnTime(D, '10:30'));
      try {
        await page.goto(`${WEB_URL}/today`);
        const attn = page.locator('section[aria-labelledby="today-attn"]');
        // mã đơn trên dòng: BUG-R2-217 (server không gửi `refCode`) – ca riêng bên dưới; ở đây nhận dòng theo giờ + link
        const holdRow = attn
          .getByRole('listitem')
          .filter({ hasText: holdLine('12:00') })
          .filter({ has: page.locator(`a[href$="/reservations/${hold.id}"]`) });
        const oooRow = attn
          .getByRole('listitem')
          .filter({ hasText: stem('attn.room_ooo_rooms') })
          .filter({ hasText: /401/ });
        const woRow = attn
          .getByRole('listitem')
          .filter({ hasText: stem('attn.work_order_high_open') });
        await expect(holdRow, 'dòng giữ chỗ sắp hết hạn').toHaveCount(1, { timeout: 20_000 });
        await expect(oooRow, 'dòng căn khóa').toHaveCount(1);
        await expect(woRow.first(), 'dòng phiếu sửa Gấp').toBeVisible();
        await scan(page, test.info(), 'H03-attention-r13');
      } finally {
        await page.context().close();
      }
    });

    test('TC-L8-008 (E) US-012/AC4 BUG-R2-217: dòng "Cần chú ý" của giữ chỗ sắp hết hạn nêu mã đơn ("Giữ chỗ {code} hết hạn lúc 12:00") – server gửi `refCode` như các dòng một đơn khác', async ({
      browser,
      request,
    }) => {
      knownBug('BUG-R2-217');
      needClock('TC-L8-008');
      const D = virtualDay(realToday, 2);
      const hold = await precondition(
        'giữ chỗ 202 cho đêm D, tạo D−1 14:00 (hết hạn D 12:00)',
        async () => {
          await at(request, addDays(D, -1), '14:00');
          const c = await s2Context(request);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const { hold } = await makeHold(request, fd, c, {
            rooms: [room(c, '202'), room(c, '203')],
            arrival: D,
            nights: 1,
            holdHours: 24,
          });
          await at(request, D, '10:30');
          return hold;
        },
      );
      const page = await desk(browser, 'qa.fd', vnTime(D, '10:30'));
      try {
        await page.goto(`${WEB_URL}/today`);
        const row = page
          .locator('section[aria-labelledby="today-attn"]')
          .getByRole('listitem')
          .filter({ has: page.locator(`a[href$="/reservations/${hold.id}"]`) })
          .filter({ hasText: holdLine('12:00') });
        await expect(row).toBeVisible({ timeout: 20_000 });
        await expect(row).toContainText(
          tf('attn.hold_expiring', { code: hold.code, time: '12:00' }),
        );
      } finally {
        await page.context().close();
      }
    });

    test('TC-L4-054 (E) US-038/AC2: folio `settled` sau trả phòng – lễ tân mở Folio thấy "Folio đã chốt", không có nút Điều chỉnh; quản lý thấy câu sau chốt và ghi điều chỉnh dòng F&B 3 → 2 có lý do (đảo + dòng mới) + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L4-054');
      const D = virtualDay(realToday, 3);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const st = await inHouse(request, c, fd, {
        room: room(c, '203'),
        alternatives: c.rooms,
        arrival: D,
        nights: 1,
      });
      const add = await addLine(request, fd, st.res.folioId!, {
        category: 'fnb',
        description: 'Nuoc cam 3 ly',
        quantity: 3,
        unitPriceVnd: 25000,
        serviceDate: D,
      });
      expect(add.status, JSON.stringify(add.body).slice(0, 300)).toBe(201);
      await payBalance(request, fd, st.res.folioId!);
      const d1 = addDays(D, 1);
      await at(request, d1, '10:00');
      fd = await sessionOrSkip(request, 'qa.fd');
      const out = await checkOutStay(request, fd, st.res.id, '10:00');
      expect(out.status, JSON.stringify(out.body).slice(0, 300)).toBe(200);
      expect((await getFolio(request, fd, st.res.folioId!)).status).toBe('settled');

      const folioOf = async (page: Page): Promise<Locator> => {
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        await page
          .getByRole('button', { name: t('folio.open') })
          .first()
          .click();
        const dlg = page.getByRole('dialog', { name: new RegExp(`^Folio · ${esc(st.res.code)}`) });
        await expect(dlg).toBeVisible({ timeout: 15_000 });
        return dlg;
      };
      // lễ tân: chỉ xem
      let page = await desk(browser, 'qa.fd', vnTime(d1, '10:05'));
      try {
        const dlg = await folioOf(page);
        await expect(dlg.getByText(t('folio.settled_fd')).first()).toBeVisible();
        await expect(dlg.getByRole('row').filter({ hasText: /Nuoc cam/i })).toBeVisible();
        await expect(
          dlg.getByRole('button', { name: t('folio.adjust') }),
          'lễ tân không sửa được dòng của folio đã chốt',
        ).toHaveCount(0);
        await scan(page, test.info(), 'H15-folio-settled-fd');
      } finally {
        await page.context().close();
      }
      // quản lý: bút toán điều chỉnh có lý do
      page = await desk(browser, 'qa.mgr', vnTime(d1, '10:10'));
      try {
        const adj = recordWrites(page, 'POST', /\/lines\/[^/]+\/adjustments$/);
        const dlg = await folioOf(page);
        await expect(dlg.getByText(t('folio.settled_mgr')).first()).toBeVisible();
        const row = dlg.getByRole('row').filter({ hasText: /Nuoc cam/i });
        await row.getByRole('button', { name: t('folio.adjust') }).click();
        const box = page.getByRole('dialog', { name: /^Điều chỉnh:/ });
        await box.getByLabel(new RegExp(`^${esc(t('folio.adjust_qty'))}`)).fill('2');
        await box
          .getByLabel(new RegExp(`^${esc(t('folio.adjust_reason'))}`))
          .fill('Khach chi dung 2 ly, sua sau tra phong');
        await scan(page, test.info(), 'H15-folio-settled-mgr-adjust');
        await box.getByRole('button', { name: t('folio.adjust_submit') }).click();
        const w = await waitWrite(adj, 'adjustFolioLine sau chốt (MGR)', 201);
        expect(w.request).toMatchObject({
          newQuantity: 2,
          reason: 'Khach chi dung 2 ly, sua sau tra phong',
        });
        await expect(page.getByText(t('folio.adjusted_toast')).first()).toBeVisible();
      } finally {
        await page.context().close();
      }
      const f = await getFolio(request, await sessionOrSkip(request, 'qa.fd'), st.res.folioId!);
      expect(
        f.lines
          .filter((l) => l.category === 'fnb')
          .map((l) => l.amountVnd)
          .sort((a, b) => a - b),
        'giữ dòng gốc 75.000, thêm đảo −75.000 và dòng mới 50.000 (BR-008)',
      ).toEqual([-75000, 50000, 75000]);
    });
  },
);
