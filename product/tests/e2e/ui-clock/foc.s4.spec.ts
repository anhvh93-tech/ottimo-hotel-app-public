// E2E UI Sprint 4 – S4-25 (CỔNG): Desk xin miễn phí (FOC) ngoài bước nhận phòng, BẤM THẬT tới API thật.
// Viết bởi FE-A (17/10), QA rà. Project desk-clock (Chromium 1366×768, MutableClock): mỗi ca một ngày ảo riêng,
// máy quầy ảo được cấp; nhận phòng làm bằng API (không phải đối tượng kiểm); bước đang kiểm bấm trên Desk, request
// trình duyệt gửi được ghi lại và phải 2xx; kết quả đọc lại bằng API.
//   - TC-L4-099: H15 "Trả muộn" ghi phụ thu kèm đề nghị FOC (setLateCheckout.requestFocForSurcharge) → chờ duyệt;
//     lễ tân trưởng duyệt → Folio hiện "Đã áp" (US-007 AC1, US-029 AC1; BR-414, BR-432, BR-434).
//   - TC-L3-083: thêm người lớn vượt định mức khi đang ở, ghi phụ thu KÈM đề nghị FOC – mỗi đêm một yêu cầu đúng phần
//     của người mới (BUG-R2-093, US-022 AC4; BR-110, BR-414).
//   - TC-NT-053: H16 – lễ tân tự áp FOC minibar trong hạn mức bằng mật khẩu (US-007 AC6, BR-436); số tối đa được
//     xin trên dòng (S4-23 (6)).
// H16 bước 2 (trả muộn kèm FOC lúc trả phòng): TC-X-071 ở ui-clock/flow-a1.s4.spec.ts.
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { call, session, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  oracle,
  oracleNum,
  s2Context,
  vnTime,
  type Room,
} from '../support/s2.js';
import { approvalsOf } from '../support/s3-stay.js';
import {
  EP3,
  approve,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  namedGuest,
  p3,
  useVirtualDevice,
  virtualDay,
  type FolioLine,
} from '../support/s3.js';
import { scan, settle } from '../ui/axe.js';
import { UI, signIn, t } from '../ui/helpers.js';
import { amountRe, dialogs, recordWrites, trustedDesk, vnd, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
const money = (n: number): string => tf('common.currency_vnd', { amount: vnd(n) });
/** FOC / special-discount lines reducing `line` (posted = applied, pending_approval = waiting). */
const focOn = (lines: FolioLine[], line: FolioLine) =>
  lines.filter((l) => l.relatedLineId === line.id && ['foc', 'discount'].includes(l.category));

let realToday = '';
test.describe.configure({ mode: 'default' });
test.beforeAll(async ({ request }) => {
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

/** Ngày ảo D lúc hh:mm (đồng hồ server + máy quầy ảo + buồng sạch), khách đang ở `nights` đêm từ D. */
async function stayFrom(
  request: APIRequestContext,
  days: number,
  hhmm: string,
  nights: number,
  adults = 2,
) {
  const D = virtualDay(realToday, days);
  await useVirtualDevice(request, await setClock(request, vnTime(D, hhmm)));
  cleanRooms();
  const c = await s2Context(request);
  const fd = await session(request, 'qa.fd');
  // căn định mức 2, sức chứa 3: người thứ 3 vượt định mức (BR-110)
  const l12: Room[] = c.rooms.filter(
    (r) => (r.baseOccupancy ?? 0) === 2 && (r.maxOccupancy ?? 0) >= 3,
  );
  expect(l12.length, 'DS-E có căn định mức 2 / sức chứa 3').toBeGreaterThan(0);
  const st = await inHouse(request, c, fd, {
    room: l12[0]!,
    alternatives: l12,
    arrival: D,
    nights,
    adults,
  });
  return { D, c, fd, st };
}
async function desk(page: Page, D: string, hhmm: string, user = 'qa.fd'): Promise<void> {
  await page.clock.setFixedTime(new Date(vnTime(D, hhmm)));
  await trustedDesk(page);
  await signIn(page, user);
}

test.describe(
  'UI S4-25 – Desk xin miễn phí ngoài bước nhận phòng (US-007 AC1, AC6; US-022 AC4; US-029)',
  { tag: ['@ui', '@sprint4', '@clock', '@write', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L4-099 (E) US-007/AC1, US-029/AC1 H15 Trả muộn 15:00 + "Xin miễn phụ thu" (Khách quen) → phụ thu và yêu cầu FOC đi cùng một lệnh, chờ duyệt; lễ tân trưởng duyệt → Folio "Đã áp" (S4-25)', async ({
      page,
      request,
    }) => {
      needClock('TC-L4-099');
      test.slow();
      const { D, fd, st } = await precondition('khách đang ở 1 đêm từ hôm nay (ngày ảo)', () =>
        stayFrom(request, 3, '14:30', 1),
      );
      await desk(page, D, '14:40');
      const lates = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/late-checkout$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
      await page
        .getByRole('button', { name: t('drawer.action.late_checkout'), exact: true })
        .click();
      const dlg = dialogs(page).filter({ hasText: t('late.time') });
      await expect(dlg).toBeVisible({ timeout: 15_000 });
      await dlg.getByLabel(t('late.time')).fill('15:00');
      // BR-412: 15:00 → bậc 30 % giá đêm cuối (số do server tính, hiện trước khi lưu – BR-414)
      const fee = dlg.getByText(new RegExp(`^${esc(t('late.fee').split('{')[0]!)}`));
      await expect(fee).toBeVisible({ timeout: 15_000 });
      await dlg.getByRole('checkbox', { name: t('ci.told_guest') }).check();
      await dlg.getByRole('switch', { name: t('ci.ask_foc') }).click();
      await dlg.getByRole('radio', { name: t('foc.r_regular') }).check();
      await settle(page);
      await scan(page, test.info(), 'H15-late-foc');
      await dlg.getByRole('button', { name: tf('late.submit', { time: '15:00' }) }).click();
      const w = await waitWrite(
        lates,
        'setLateCheckout kèm requestFocForSurcharge',
        200,
        (s) => s.request?.dryRun === false,
      );
      const amount = Number(w.request?.expectedSurchargeVnd);
      expect(amount).toBeGreaterThan(0);
      expect(w.request).toMatchObject({
        checkoutTime: '15:00',
        applySurcharge: true,
        requestFocForSurcharge: { kind: 'foc', amountVnd: amount, reasonCode: 'regular_vip' },
      });
      await expect(page.getByText(tf('foc.sent', { amount: money(amount) }))).toBeVisible();
      // folio: dòng phụ thu trả muộn + dòng miễn "chờ duyệt" trên nó; yêu cầu FOC vào hàng chờ
      const f = await getFolio(request, fd, st.res.folioId!);
      const late = liveLines(f, 'late_checkout');
      expect(late.map((l) => l.amountVnd)).toEqual([amount]);
      const pending = focOn(f.lines, late[0]!);
      expect(pending.map((l) => [l.amountVnd, l.lineState])).toEqual([
        [-amount, 'pending_approval'],
      ]);
      const fdl = await session(request, 'qa.fdl');
      const req = (await approvalsOf(request, fdl, st.res.code, 'foc')).find(
        (a) => a.status === 'pending',
      );
      expect(req, 'yêu cầu FOC chờ duyệt ở hàng chờ lễ tân trưởng').toMatchObject({
        amountVnd: amount,
      });
      // lễ tân trưởng duyệt (màn Cần duyệt – không phải đối tượng kiểm) → Folio hiện "Đã áp" (BR-434)
      const ok = await approve(request, fdl, String(req!.id));
      expect(ok.status, JSON.stringify(ok.body)).toBe(200);
      await page.reload();
      await page.getByRole('button', { name: t('folio.open') }).click();
      const folio = page.getByRole('dialog', {
        name: new RegExp(`^${esc(tf('folio.dialog_title', { code: st.res.code }))}`),
      });
      await expect(folio.getByText(t('foc.state_applied'), { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      expect((await getReservation(request, fd, st.res.id)).body.agreedCheckoutTime).toBe('15:00');
    });

    test('TC-L3-083 (E) US-022/AC4 H15 thêm người lớn thứ 3 khi đang ở: tick phụ thu + "Xin miễn phụ thu" (Khách dài hạn) → ghi phụ thu 3 đêm và gửi 3 yêu cầu FOC, mỗi đêm đúng phần của người mới (BUG-R2-093, S4-25)', async ({
      page,
      request,
    }) => {
      needClock('TC-L3-083');
      test.slow();
      const { D, fd, st, g2, perNight } = await precondition(
        'khách đang ở 3 đêm, căn định mức 2, đã có 2 người lớn',
        async () => {
          const x = await stayFrom(request, 4, '14:30', 3);
          const g1 = await namedGuest(request, x.fd);
          const a1 = await call(
            request,
            'POST',
            p3(EP3.addPartyMember, x.fd, { reservationId: x.st.res.id }),
            {
              session: x.fd,
              idempotencyKey: true,
              body: {
                role: 'companion',
                guestId: g1.id,
                relationship: 'friend',
                effectiveFrom: x.D,
              },
            },
          );
          expect(a1.status, JSON.stringify(a1.body)).toBe(201);
          const g2 = await namedGuest(request, x.fd);
          // oracle BR-110-06: phụ thu 1 người vượt định mức / đêm
          const perNight =
            oracleNum('BR-110-06', 'extraPersonFeeVnd') / Number(oracle('BR-110-06').input.nights);
          return { ...x, g2, perNight };
        },
      );
      const want = perNight * 3;
      await desk(page, D, '14:40');
      const party = recordWrites(page, 'POST', /\/reservations\/[^/]+\/party$/);
      const focs = recordWrites(page, 'POST', /\/folios\/[^/]+\/lines\/[^/]+\/foc$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
      await expect(page.getByText(st.res.code).first()).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: t('rsv.add_person'), exact: true }).click();
      const dlg = page.getByRole('dialog', { name: t('rsv.party') });
      await expect(dlg).toBeVisible();
      await dlg.getByRole('combobox', { name: t('booking.field.guest') }).fill(g2.fullName);
      await page
        .getByRole('option', { name: new RegExp(`^${esc(g2.fullName)}`) })
        .first()
        .click();
      await expect(dlg.getByText(amountRe(want)).first()).toBeVisible({ timeout: 15_000 });
      await dlg
        .getByRole('checkbox', { name: tf('party.surcharge_confirm', { amount: money(want) }) })
        .check();
      await dlg.getByRole('switch', { name: t('ci.ask_foc') }).click();
      const add = dlg.getByRole('button', { name: t('rsv.add_submit') });
      // bật xin miễn mà chưa chọn lý do → nút khóa, nói vì sao (BR-432)
      await expect(add).toBeDisabled();
      await expect(dlg.getByText(t('foc.needs_reason'))).toBeVisible();
      await dlg.getByRole('radio', { name: t('foc.r_long') }).check();
      await settle(page);
      await scan(page, test.info(), 'H15-party-foc');
      await add.click();
      const added = await waitWrite(
        party,
        'addPartyMember kèm phụ thu',
        201,
        (s) => s.request?.dryRun !== true,
      );
      expect(added.request).toMatchObject({
        guestId: g2.id,
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: want,
        effectiveFrom: D,
      });
      await expect(page.getByText(tf('party.foc_sent', { n: 3 }))).toBeVisible({ timeout: 15_000 });
      expect(focs.filter((s) => s.status === 201)).toHaveLength(3);
      for (const s of focs)
        expect(s.request).toEqual({
          kind: 'foc',
          amountVnd: perNight,
          reasonCode: 'long_stay_guest',
        });
      const f = await getFolio(request, fd, st.res.folioId!);
      const nights = liveLines(f, 'extra_person');
      expect(nights.reduce((a, l) => a + l.amountVnd, 0)).toBe(want);
      for (const n of nights)
        expect(
          focOn(f.lines, n).map((l) => [l.amountVnd, l.lineState]),
          `đêm ${n.serviceDate}: một yêu cầu đúng phần người mới`,
        ).toEqual([[-perNight, 'pending_approval']]);
      expect(nights.map((n) => n.serviceDate).sort()).toEqual([D, addDays(D, 1), addDays(D, 2)]);
    });

    test('TC-NT-053 (E) US-007/AC6, US-035 H16 trả phòng: đếm minibar (1 bia) → trên dòng minibar "Mở form miễn phí / giảm giá" → lễ tân tự áp FOC trong hạn mức bằng mật khẩu (BR-436): số tối đa = cả dòng, áp ngay "Đã áp", không vào hàng chờ (S4-25)', async ({
      page,
      request,
    }) => {
      needClock('TC-NT-053');
      test.slow();
      const { departure, st } = await precondition(
        'khách đang ở 1 đêm, hôm nay là ngày đi 10:00 (chưa trả muộn)',
        async () => {
          const x = await stayFrom(request, 5, '14:30', 1);
          const departure = addDays(x.D, 1);
          await setClock(request, vnTime(departure, '10:00'));
          return { ...x, departure };
        },
      );
      await desk(page, departure, '10:10');
      const minibar = recordWrites(page, 'POST', /\/reservations\/[^/]+\/minibar-checks$/);
      const focs = recordWrites(page, 'POST', /\/folios\/[^/]+\/lines\/[^/]+\/foc$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}/check-out`);
      // bước 1: khách dùng 1 bia (còn 1/2)
      const beer = page
        .getByRole('row')
        .filter({ has: page.getByRole('rowheader', { name: /Bia/ }) });
      await beer.getByRole('button', { name: /^Giảm/ }).click({ timeout: 15_000 });
      await page.getByRole('button', { name: t('co.go_extras') }).click();
      await waitWrite(minibar, 'recordMinibarCheck (1 bia)', 201);
      // bảng folio của màn trả phòng: dòng minibar có nút xin miễn
      const row = page
        .getByRole('row')
        .filter({ hasText: /Bia/ })
        .filter({ has: page.getByRole('button', { name: t('foc.open_form') }) });
      await row
        .first()
        .getByRole('button', { name: t('foc.open_form') })
        .click({ timeout: 15_000 });
      const box = dialogs(page).filter({ hasText: t('foc.self_apply_submit') });
      await expect(box).toBeVisible({ timeout: 10_000 });
      const amount = Number(
        (await box.getByLabel(t('foc.amount')).inputValue()).replace(/\D/g, ''),
      );
      expect(amount, 'số tối đa = cả dòng minibar').toBeGreaterThan(0);
      expect(amount).toBeLessThanOrEqual(100_000);
      await expect(box.getByText(tf('foc.max', { amount: money(amount) }))).toBeVisible();
      await box.getByRole('radio', { name: t('foc.r_regular') }).check();
      await box.getByLabel(t('ci.stepup_label')).fill(SEED_PASSWORD!);
      await settle(page);
      await scan(page, test.info(), 'H16-foc-self-apply');
      await box.getByRole('button', { name: t('foc.self_apply_submit') }).click();
      const w = await waitWrite(focs, 'requestFoc tự áp minibar', 201);
      expect(w.request).toMatchObject({
        kind: 'foc',
        amountVnd: amount,
        reasonCode: 'regular_vip',
        authMethod: 'password',
      });
      expect(JSON.parse(w.body) as Json, 'tự áp trong hạn mức → đã duyệt ngay').toMatchObject({
        status: 'approved',
      });
      await expect(page.getByText(tf('foc.applied', { amount: money(amount) }))).toBeVisible();
      await expect(page.getByText(t('foc.state_applied'), { exact: true }).first()).toBeVisible();
      const fd = await session(request, 'qa.fd');
      const f = await getFolio(request, fd, st.res.folioId!);
      const line = liveLines(f, 'minibar')[0]!;
      expect(line.amountVnd).toBe(amount);
      expect(focOn(f.lines, line).map((l) => [l.amountVnd, l.lineState])).toEqual([
        [-amount, 'posted'],
      ]);
      const fdl = await session(request, 'qa.fdl');
      expect(
        (await approvalsOf(request, fdl, st.res.code, 'foc')).filter((x) => x.status === 'pending'),
        'không vào hàng chờ duyệt',
      ).toHaveLength(0);
    });
  },
);
