// E2E UI Sprint 4 – các bước GHI TIỀN của FE-A được BẤM THẬT tới API thật (QC-S3-09; sprint-4-plan mục 4).
// Viết bởi FE-A (17/10), QA rà và đưa vào bộ chạy. Project desk-chromium (Chromium 1366×768, đồng hồ thật): dữ liệu
// chuẩn bị bằng API (không phải đối tượng kiểm), bước đang kiểm bấm trên giao diện; request trình duyệt gửi được ghi
// lại (ui/write-steps.ts) và phải 2xx; kết quả đọc lại bằng API; tiền so với oracle br-examples.json.
// Phần BE chưa gộp → knownBug(...) ở DÒNG ĐẦU ca (support/known-bugs.ts), dựng dữ liệu trong precondition().
//   - S4-28 / TC-L5-025 (a): chuyển sang ui-clock/deposit-qr.s4.spec.ts (cần tài khoản nhận VietQR – chỉ ngày ảo).
//   - S4-21 / TC-L2-097 (a)–(d): hộp đổi căn – bản tính thử BR-429-03, ô "Đã báo khách", 409 SURCHARGE_CHANGED.
//   - S4-08 / TC-L2-102 (a): hộp Hủy đơn – giữ dòng dịch vụ kèm lý do, retainLines giống hệt ở tính thử và lần lưu.
//   - #6 / TC-NT-052: Cần duyệt – duyệt hoàn với expectedVersion; nơi nhận đổi sau khi mở → 412 → "Tải lại" → duyệt lại.
// Ca cần đồng hồ (S4-10 nhận phòng, S4-08 no-show, S4-39 giấy tờ): ui-clock/stay-money.s4.spec.ts.
import { expect, test } from '@playwright/test';
import { call, session, stackToday } from '../support/api.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import { cleanupTracked, getReservation, oracle, room, s2Context, weekday } from '../support/s2.js';
import { EP3, addLine, dev, getFolio, liveLines, p3, recordPayment } from '../support/s3.js';
import { approvalById, bookMoney, totalOf } from '../support/s4-money.js';
import { scan, settle } from './axe.js';
import { UI, signIn, t } from './helpers.js';
import { dialogs, recordWrites, vnd, waitWrite } from './write-steps.js';

const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

type Json = Record<string, unknown>;
const num = (x: unknown) => x as number;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** "1.125.000 đ" – số tiền như Desk in (common.currency_vnd). */
const money = (n: number): string => tf('common.currency_vnd', { amount: vnd(n) });

/** Đơn Trực tiếp đã cọc `depositVnd` (tiền mặt) – ví dụ BR (support/s4-money.ts bookMoney). */
const deposit = (amountVnd: number) => ({
  initialPayment: { type: 'deposit', method: 'cash', amountVnd },
});

test.describe(
  'UI Sprint 4 – FE-A: đổi căn có tính thử (S4-21), hủy giữ dòng dịch vụ (S4-08), duyệt hoàn theo phiên bản (#6)',
  { tag: ['@ui', '@sprint4', '@write', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));

    /** Đơn 101 → 401 của BR-429-03: 3 đêm thường, cọc 600.000; 401 trống cùng khoảng. */
    async function br42903(request: Parameters<typeof s2Context>[0]) {
      const ex = oracle('BR-429-03');
      const c = await s2Context(request);
      const fd = await session(request, 'qa.fd');
      const to = room(c, String(ex.input.toRoomNo));
      const b = await bookMoney(request, c, fd, {
        room: room(c, String(ex.input.fromRoomNo)),
        alsoFree: [to],
        today: await stackToday(request),
        dow: weekday(String(ex.input.arrivalDate)),
        nights: 3,
        extra: deposit(num(ex.input.depositPaidVnd)),
      });
      expect(totalOf(await getFolio(request, fd, b.folioId), 'room')).toBe(
        num(ex.expected.bookedRoomTotalVnd),
      );
      return { ex, c, fd, b, to };
    }

    async function openMove(page: import('@playwright/test').Page, id: string, code: string) {
      await page.goto(`${WEB_URL}/reservations/${id}`);
      await page.getByRole('button', { name: t('drawer.action.move'), exact: true }).click();
      const dlg = page.getByRole('dialog', { name: tf('move.title', { code }) });
      await expect(dlg).toBeVisible({ timeout: 15_000 });
      return dlg;
    }

    test('TC-L2-097 (E) (a)(b)(c) US-024/AC5 H11 khách xin 101 → 401: bản tính thử từng đêm 667.000 → 1.042.000, khách trả thêm 1.125.000, cọc giữ 600.000, còn thu 2.526.000; Lưu khóa tới khi tick "Đã báo khách"; khách không đồng ý → không ghi; tick → lưu đúng expectedDeltaVnd (S4-21)', async ({
      page,
      request,
    }) => {
      knownBug('S4-21');
      test.slow();
      const { ex, fd, b, to } = await precondition(
        'đơn 101 3 đêm thường, cọc 600.000; 401 trống',
        () => br42903(request),
      );
      await signIn(page, 'qa.fd');
      const previews = recordWrites(page, 'GET', /\/reservations\/[^/]+\/move-preview$/);
      const moves = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/move$/);
      let dlg = await openMove(page, b.id, b.code);
      // ESC-019: lý do chia nhóm "khách xin" / "OTTIMO đổi"; mặc định khách xin
      await expect(dlg.getByLabel(t('move.reason'))).toHaveValue('guest_request');
      await dlg.getByLabel(t('booking.field.room')).selectOption(to.id);
      const box = dlg.getByRole('region', { name: t('move.preview_title') });
      await expect(box).toBeVisible({ timeout: 15_000 });
      await waitWrite(previews, 'previewMoveReservation (khách xin 101 → 401)', 200);
      await expect(box).toContainText(t('move.basis.new_room_rate'));
      // từng đêm: giá cũ (đã chốt) → giá hiện hành căn mới
      const oldRates = Object.values(ex.input.bookedNightRatesVnd as Record<string, number>);
      const newRates = Object.values(ex.expected.newNightRatesVnd as Record<string, number>);
      const nightRows = box.getByRole('table').first().getByRole('row');
      await expect(nightRows).toHaveCount(1 + newRates.length);
      // FE-S4-03: số trần ở dòng (cột ghi "(đ)"), đơn vị ở dòng tổng; chênh lệch có dấu (FE-S4-04)
      for (let i = 0; i < newRates.length; i++) {
        await expect(nightRows.nth(i + 1)).toContainText(vnd(oldRates[i]!));
        await expect(nightRows.nth(i + 1)).toContainText(vnd(newRates[i]!));
      }
      await expect(
        box.getByRole('row', { name: new RegExp(esc(t('move.delta_up'))) }),
      ).toContainText(`+${money(num(ex.expected.differenceVnd))}`);
      await expect(
        box.getByRole('row', { name: new RegExp(esc(t('move.deposit_paid'))) }),
      ).toContainText(vnd(num(ex.expected.depositAfterMoveVnd)));
      await expect(
        box.getByRole('row', { name: new RegExp(esc(t('move.balance_after'))) }),
      ).toContainText(vnd(num(ex.expected.balanceDueAtCheckInVnd)));
      await settle(page);
      await scan(page, test.info(), 'H11-move-preview');

      // (a) chưa tick "Đã báo khách số tiền mới" → nút Lưu khóa, nói lý do, không ghi
      const save = dlg.getByRole('button', { name: t('rsv.move_submit'), exact: true });
      await expect(save).toHaveAttribute('aria-disabled', 'true');
      await expect(dlg.getByText(t('move.save_needs_told'))).toBeVisible();
      // aria-disabled: Playwright coi là "không bấm được" và chờ tới hết giờ – bấm cưỡng bức như người dùng bấm thử
      await save.click({ force: true });
      expect(moves, 'chưa tick → không gửi lệnh ghi').toHaveLength(0);
      // (b) khách không đồng ý → Hủy: không ghi, đơn giữ 101
      await dlg.getByRole('button', { name: t('common.cancel'), exact: true }).click();
      await expect(dlg).toBeHidden();
      expect(moves).toHaveLength(0);
      expect((await getReservation(request, fd, b.id)).body.segments?.at(-1)?.roomId).not.toBe(
        to.id,
      );

      // (c) mở lại, báo khách, tick → Lưu: applyDifference + expectedDeltaVnd = số đang hiển thị
      dlg = await openMove(page, b.id, b.code);
      await dlg.getByLabel(t('booking.field.room')).selectOption(to.id);
      await expect(dlg.getByRole('region', { name: t('move.preview_title') })).toBeVisible({
        timeout: 15_000,
      });
      await dlg.getByRole('checkbox', { name: new RegExp(esc(t('move.told_guest'))) }).check();
      await expect(save).not.toHaveAttribute('aria-disabled', 'true');
      await save.click();
      const w = await waitWrite(moves, 'moveReservation khách xin đổi căn', 200);
      expect(w.request).toMatchObject({
        roomId: to.id,
        reasonCode: 'guest_request',
        applyDifference: true,
        expectedDeltaVnd: num(ex.expected.differenceVnd),
      });
      await expect(dlg).toBeHidden({ timeout: 10_000 });
      const f = await getFolio(request, fd, b.folioId);
      expect(totalOf(f, 'room'), 'tổng tiền phòng mới (BR-429-03)').toBe(
        num(ex.expected.newRoomTotalVnd),
      );
      expect(f.totals.balanceDueVnd, 'còn phải thu khi nhận phòng').toBe(
        num(ex.expected.balanceDueAtCheckInVnd),
      );
    });

    test('TC-L2-097 (E) (d) US-024/AC5 số tiền đổi giữa lúc báo khách và lúc lưu → 409 SURCHARGE_CHANGED: Desk báo số mới, tính thử lại, bỏ tick; tick lại → lưu (S4-21)', async ({
      page,
      request,
    }) => {
      knownBug('S4-21');
      test.slow();
      const { ex, fd, b, to } = await precondition('đơn 101 3 đêm thường; 401 trống', () =>
        br42903(request),
      );
      await signIn(page, 'qa.fd');
      const moves = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/move$/);
      // Bản tính thử đầu tiên lệch 125.000 so với server (như giá đổi ở máy khác) – lệnh ghi thật trả 409.
      await page.route(
        /\/move-preview\?/,
        async (route) => {
          const res = await route.fetch();
          const body = (await res.json()) as Json;
          body.folioDeltaVnd = num(body.folioDeltaVnd) - 125000;
          await route.fulfill({ response: res, json: body });
        },
        { times: 1 },
      );
      const dlg = await openMove(page, b.id, b.code);
      await dlg.getByLabel(t('booking.field.room')).selectOption(to.id);
      await expect(dlg.getByRole('region', { name: t('move.preview_title') })).toBeVisible({
        timeout: 15_000,
      });
      const told = dlg.getByRole('checkbox', { name: new RegExp(esc(t('move.told_guest'))) });
      await told.check();
      const save = dlg.getByRole('button', { name: t('rsv.move_submit'), exact: true });
      await save.click();
      await waitWrite(moves, 'moveReservation với số cũ', 409);
      await expect(
        dlg.getByText(tf('move.delta_changed', { amount: money(num(ex.expected.differenceVnd)) })),
      ).toBeVisible();
      await expect(told).not.toBeChecked({ timeout: 10_000 });
      await told.check();
      await save.click();
      const ok = await waitWrite(moves, 'moveReservation sau khi báo lại khách', 200);
      expect(ok.request).toMatchObject({
        applyDifference: true,
        expectedDeltaVnd: num(ex.expected.differenceVnd),
      });
      expect(totalOf(await getFolio(request, fd, b.folioId), 'room')).toBe(
        num(ex.expected.newRoomTotalVnd),
      );
    });

    test('TC-L2-102 (E) (a) US-021/AC2, AC4 H11 hủy đơn có dòng dịch vụ: hộp liệt kê dòng, giữ một dòng phải có lý do, retainLines giống hệt ở tính thử và lần lưu; dòng không giữ bị đảo (S4-08)', async ({
      page,
      request,
    }) => {
      // S4-08 đã xanh trên cây làm việc 17/10 (QA chạy lại) – ca phải đạt
      test.slow();
      const { fd, b, kept, other } = await precondition(
        'đơn Trực tiếp ngày xa đã cọc + 2 dòng dịch vụ',
        async () => {
          const c = await s2Context(request);
          const fd = await session(request, 'qa.fd');
          const b = await bookMoney(request, c, fd, {
            room: room(c, '202'),
            today: await stackToday(request),
            dow: 2,
            nights: 2,
            extra: deposit(500000),
          });
          const cat = await call<{ data: Array<Json> }>(
            request,
            'GET',
            p3(EP3.getChargeCatalog, fd),
            { session: fd },
          );
          expect(cat.status, JSON.stringify(cat.body).slice(0, 300)).toBe(200);
          const svc = cat.body.data.filter(
            (x) =>
              ['service_fee', 'fnb', 'laundry', 'cleaning'].includes(String(x.category)) &&
              x.evidenceRequired !== true,
          );
          expect(svc.length, 'danh mục có dòng dịch vụ không cần bằng chứng').toBeGreaterThan(0);
          for (const [i, item] of [svc[0]!, svc[1] ?? svc[0]!].entries()) {
            const l = await addLine(request, fd, b.folioId, {
              chargeCode: item.code,
              quantity: 1,
              // đơn chưa đến: ngày dịch vụ phải trong khoảng lưu trú (mặc định hôm nay → 422 DATE_INVALID – QA rà 17/10)
              serviceDate: b.arrivalDate,
              note: i === 0 ? 'Dua don san bay' : 'Bua sang dat truoc',
            });
            expect(l.status, `addFolioLine: ${JSON.stringify(l.body)}`).toBe(201);
          }
          const f = await getFolio(request, fd, b.folioId);
          const lines = f.lines.filter((l) => l.category !== 'room' && l.lineState === 'posted');
          expect(lines.length).toBeGreaterThanOrEqual(2);
          return { fd, b, kept: lines[0]!, other: lines[1]! };
        },
      );
      await signIn(page, 'qa.fd');
      const cancels = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/cancel$/);
      await page.goto(`${WEB_URL}/reservations/${b.id}`);
      await page
        .getByRole('button', { name: t('drawer.action.cancel_booking'), exact: true })
        .click();
      const box = page.getByRole('alertdialog').filter({ hasText: b.code });
      const group = box.getByRole('group', { name: t('svc.title') });
      await expect(group).toBeVisible({ timeout: 15_000 });
      await expect(group).toContainText(t('svc.help'));
      await settle(page);
      await scan(page, test.info(), 'H11-cancel-service-lines');
      const keep = group.getByRole('checkbox').first();
      await keep.check();
      await box.getByLabel(t('cancel.reason')).selectOption('found_other');
      const confirm = box.getByRole('button', {
        name: t('drawer.action.cancel_booking'),
        exact: true,
      });
      await expect(confirm).toBeEnabled({ timeout: 10_000 });
      await confirm.click();
      // FE-S4-14: dòng tóm tắt nhường chỗ cho điều còn thiếu (ô lý do cũng có câu này làm gợi ý)
      await expect(group.getByRole('status')).toHaveText(t('svc.reason_needed'));
      expect(cancels.filter((x) => x.request?.dryRun === false)).toHaveLength(0);
      const reason = 'Xe da don khach';
      await group.getByLabel(t('svc.reason')).fill(reason);
      await expect(confirm).toBeEnabled({ timeout: 10_000 });
      await confirm.click();
      const saved = await waitWrite(
        cancels,
        'cancelReservation kèm retainLines',
        200,
        (x) => x.request?.dryRun === false,
      );
      const retain = saved.request?.retainLines as Array<{ lineId: string; reason: string }>;
      expect(retain).toHaveLength(1);
      expect(retain[0]!.reason).toBe(reason);
      const lastDry = cancels.filter((x) => x.request?.dryRun === true && x.status === 200).at(-1)!;
      expect(lastDry.request?.retainLines, 'tính thử và lần lưu cùng retainLines').toEqual(retain);
      const keptId = retain[0]!.lineId;
      expect([kept.id, other.id]).toContain(keptId);
      const f = await getFolio(request, fd, b.folioId);
      const live = liveLines(f).map((l) => l.id);
      expect(live, 'dòng giữ không bị đảo').toContain(keptId);
      expect(live, 'dòng không giữ bị đảo (BR-309)').not.toContain(
        keptId === kept.id ? other.id : kept.id,
      );
    });

    test('TC-NT-052 (E) US-007/– H17 Cần duyệt: duyệt hoàn gửi expectedVersion đang xem; nơi nhận đổi sau khi mở → 412 → "Tải lại" → mở lại, duyệt với phiên bản mới (#6, B-6)', async ({
      page,
      request,
    }) => {
      knownBug('B-6');
      test.slow();
      const { fd, req, code } = await precondition(
        'yêu cầu hoàn 200.000 chờ duyệt do qa.fd tạo',
        async () => {
          const c = await s2Context(request);
          const fd = await session(request, 'qa.fd');
          const b = await bookMoney(request, c, fd, {
            room: room(c, '102'),
            today: await stackToday(request),
            dow: 2,
            nights: 1,
          });
          const f = await getFolio(request, fd, b.folioId);
          const pay = await recordPayment(request, fd, b.folioId, {
            type: 'charge',
            method: 'cash',
            amountVnd: f.totals.balanceDueVnd + 200000,
            note: 'Khach tra du – E2E UI B-6',
          });
          expect(pay.status, JSON.stringify(pay.body)).toBe(201);
          const r = await call<{ id: string }>(
            request,
            'POST',
            p3(EP3.createRefundRequest, fd, { folioId: b.folioId }),
            {
              session: fd,
              idempotencyKey: true,
              body: { amountVnd: 200000, reason: 'Hoan tien tra du E2E UI' },
            },
          );
          expect(r.status, `createRefundRequest: ${JSON.stringify(r.body)}`).toBe(201);
          return { fd, req: r.body, code: b.code };
        },
      );
      const mgr = await session(request, 'qa.mgr');
      const v0 = (await approvalById(request, mgr, req.id)).version;
      await signIn(page, 'qa.mgr');
      const decisions = recordWrites(page, 'POST', /\/approval-requests\/[^/]+\/actions\/approve$/);
      await page.goto(`${WEB_URL}/approvals`);
      const card = page.getByRole('listitem').filter({ hasText: code });
      await expect(card).toBeVisible({ timeout: 15_000 });
      await card.getByRole('button', { name: t('approval.approve'), exact: true }).click();
      const title = tf('approval.approve_title.refund', { amount: money(200000), code });
      let dlg = dialogs(page).filter({ hasText: title });
      await expect(dlg).toBeVisible();
      // Lễ tân đổi nơi nhận trong lúc quản lý đang mở yêu cầu → phiên bản tăng (SEC F8).
      const dest = await call(
        request,
        'PUT',
        p3(EP3.setRefundDestination, fd, { approvalId: req.id }),
        { ...dev(fd), idempotencyKey: true, body: { method: 'cash' } },
      );
      expect(dest.status, `setRefundDestination: ${JSON.stringify(dest.body)}`).toBe(200);
      const v1 = (await approvalById(request, mgr, req.id)).version;
      await dlg.getByLabel(t('approval.pin_label')).fill(SEED_PASSWORD!);
      await dlg.getByRole('button', { name: t('approval.approve'), exact: true }).click();
      const stale = await waitWrite(decisions, 'approveRequest với phiên bản cũ', 412);
      expect(stale.request).toMatchObject({ expectedVersion: v0 });
      await expect(dlg.getByText(t('approval.changed_since_open'))).toBeVisible();
      await settle(page);
      await scan(page, test.info(), 'H17-approve-stale');
      expect((await approvalById(request, mgr, req.id)).status, 'không duyệt khi lệch').toBe(
        'pending',
      );
      await dlg.getByRole('button', { name: t('common.reload'), exact: true }).click();
      await expect(dlg).toBeHidden();
      // "Tải lại" đọc lại hàng chờ: chờ danh sách vẽ lại xong rồi mới mở lại – bấm giữa lúc vẽ lại thì hộp duyệt mở
      // trên thẻ cũ rồi bị gỡ, không gửi lệnh (QA rà 17/10: 1/2 lượt đỏ)
      await page.waitForLoadState('networkidle');
      await expect(card).toBeVisible();
      await card.getByRole('button', { name: t('approval.approve'), exact: true }).click();
      dlg = dialogs(page).filter({ hasText: title });
      await expect(dlg).toBeVisible();
      const sentBefore = decisions.length;
      await dlg.getByLabel(t('approval.pin_label')).fill(SEED_PASSWORD!);
      await dlg.getByRole('button', { name: t('approval.approve'), exact: true }).click();
      // chỉ xét lệnh gửi SAU "Tải lại": lần thứ hai còn 412 thì báo nguyên câu trả lời (BUG-R2-106)
      const ok = await waitWrite(
        decisions,
        'approveRequest với phiên bản mới (sau "Tải lại")',
        200,
        (x) => decisions.indexOf(x) >= sentBefore,
      );
      expect(ok.request).toMatchObject({ expectedVersion: v1 });
      expect((await approvalById(request, mgr, req.id)).status).toBe('approved');
    });
  },
);
