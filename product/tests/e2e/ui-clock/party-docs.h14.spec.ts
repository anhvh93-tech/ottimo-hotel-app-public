// E2E UI – H14: giấy tờ khách gửi qua link chờ gắn người → lễ tân gắn vào người còn ở trên Desk (FB-R2-SEC-FE-07,
// BUG-R2-083, SEC-G1 a; OpenAPI 0.3.7 S4-39). Project desk-clock (Chromium 1366×768, MutableClock, tuần tự sau clock):
// ngày ảo riêng; giờ đóng băng nên "24 giờ" và J16 kiểm được đúng mốc.
// 0.3.7 (S4-39): bỏ người khỏi đoàn (`removePartyMember`) nay bắt buộc chọn ô "Khách n" (`guestUploadPersonIndex`) – ô đó
// hủy ngay, không còn hẹn 24 giờ (ca của đường này: TC-L3-080 (a), ui-clock/stay-money.s4.spec.ts). Hẹn 24 giờ + "Cần chú ý"
// `registration_party_docs_unlinked` CHỈ còn cho đường giảm người không có lựa chọn của lễ tân (`updateReservation` giảm
// số khách, đơn OTA sửa) → ca này dùng đường đó (QA 17/10, CI b6153b7 đỏ: thiếu `guestUploadPersonIndex`).
//   - chuẩn bị bằng API (không phải đối tượng kiểm): đơn confirmed 3 người lớn, người đi cùng B, khách gửi ảnh giấy tờ
//     Khách 1–3 qua link, lễ tân đã nhập trường của Khách 3 (chưa gắn người), giảm còn 2 người lớn;
//   - bước đang kiểm bấm trên Desk: thấy "Cần chú ý" + nhãn "Chờ gắn người – tự xóa lúc …" (theo `unclaimedUntil`),
//     "Gắn người" → chọn B → Gắn; request trình duyệt gửi được ghi lại (ui/write-steps.ts), phải 200 và CHỈ mang
//     `partyMemberId` (thân `GuestDocumentLink`), không đọc C3 khi gắn;
//   - kết quả đọc lại bằng API; J16 sau hạn: giấy tờ đã gắn còn (ảnh đọc được – DEK sống), giấy tờ không ai nhận bị xóa.
// TC: product/tests/test-cases/r1-main-flows.md – TC-L3-077 (v0.3.19 theo 0.3.7).
import { expect, test, type APIRequestContext } from '@playwright/test';
import { call, session, stackToday, versionTag, type StaffSession } from '../support/api.js';
import { needClock, resetClock, runJob, setClock } from '../support/clock.js';
import { GUEST_ORIGIN, SEED_PASSWORD, WEB_URL } from '../support/env.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  minStayFor,
  s2Context,
  vnTime,
  type Room,
} from '../support/s2.js';
import { patchReservation } from '../support/s3-checkin.js';
import {
  EP3,
  PRIVACY_NOTICE,
  callMultipart,
  dev,
  fakeCccd,
  getRegistration,
  guestCall,
  guestLink,
  makeStay,
  namedGuest,
  openGuest,
  p3,
  png,
  stepUp,
  useVirtualDevice,
  virtualDay,
  vnDoc,
  type GuestDocument,
  type Registration,
} from '../support/s3.js';
import { scan, settle } from '../ui/axe.js';
import { UI, signIn, t } from '../ui/helpers.js';
import { recordWrites, trustedDesk, waitWrite } from '../ui/write-steps.js';

const J16 = 'retention.purge';
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
/** ISO instant → "dd/mm/yyyy HH:mm" giờ Đà Lạt (formatInstant của @ottimo/i18n, vi). */
const vnDateTime = (iso: string): string => {
  const d = new Date(new Date(iso).getTime() + 7 * 3_600_000).toISOString();
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} ${d.slice(11, 16)}`;
};

type Doc = GuestDocument & {
  captureMethod?: string;
  unclaimedUntil?: string | null;
  personIndex?: number | null;
};
type Reg = Registration;
const docs = (reg: Reg): Doc[] => reg.documents as Doc[];

async function regNow(request: APIRequestContext, s: StaffSession, regId: string): Promise<Reg> {
  const r = await getRegistration(request, s, regId);
  expect(r.status, `getRegistration: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body as Reg;
}

async function companion(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
): Promise<{ guestId: string; name: string; memberId: string }> {
  const g = await namedGuest(request, s);
  const r = await call<{ members?: Array<{ id: string; guest?: { id: string } }> }>(
    request,
    'POST',
    p3(EP3.addPartyMember, s, { reservationId }),
    {
      session: s,
      idempotencyKey: true,
      body: { role: 'companion', guestId: g.id, relationship: 'friend' },
    },
  );
  expect(r.status, `addPartyMember: ${JSON.stringify(r.body)}`).toBe(201);
  const m = r.body.members?.find((x) => x.guest?.id === g.id);
  expect(m, JSON.stringify(r.body)).toBeTruthy();
  return { guestId: g.id, name: g.fullName, memberId: m!.id };
}

test.describe.configure({ mode: 'default' });
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'UI H14 – giấy tờ khách gửi qua link chờ gắn người sau khi giảm số khách (MutableClock, FB-R2-SEC-FE-07, S4-39)',
  { tag: ['@ui', '@sprint3', '@clock', '@write', '@c3'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L3-077 (E) US-022/– H14 giảm số khách khi khách đã gửi giấy tờ qua link (đường không có lựa chọn của lễ tân): Desk hiện "Chờ gắn người – tự xóa lúc …", lễ tân gắn giấy tờ vào người còn ở chỉ bằng partyMemberId → nhãn hết, giấy tờ còn sau J16; giấy tờ không ai nhận bị xóa (BUG-R2-083, S4-39)', async ({
      page,
      request,
    }) => {
      test.slow();
      needClock('TC-L3-077 (E)');
      const D = virtualDay(await stackToday(request), 4);
      const t0 = vnTime(D, '09:00');
      await useVirtualDevice(request, await setClock(request, t0));
      const c = await s2Context(request);
      const fd = await session(request, 'qa.fd');
      // 3 người lớn trong định mức (không phụ thu – không phải chủ đề); đơn đến D+2: trong 24 giờ chờ không có
      // nhận phòng / không đến. Số đêm theo ở tối thiểu của ngày đến (BR-113: đến thứ Sáu/thứ Bảy → 2 đêm – CI b6153b7
      // lượt 1: 422 MIN_STAY_NOT_MET khi D+2 rơi vào thứ Sáu).
      const big: Room[] = c.rooms.filter((r) => (r.baseOccupancy ?? 0) >= 3);
      const rooms = big.length ? big : c.rooms.filter((r) => (r.maxOccupancy ?? 0) >= 3);
      expect(rooms.length, 'DS-E có căn cho 3 người lớn').toBeGreaterThan(0);
      const arrival = addDays(D, 2);
      const st = await makeStay(request, c, fd, {
        room: rooms[0]!,
        alternatives: rooms,
        arrival,
        nights: minStayFor(arrival),
        adults: 3,
        doc: false,
      });
      const B = await companion(request, fd, st.res.id);

      // ── khách gửi ảnh giấy tờ qua link: Khách 1 (1 ảnh), Khách 2 (1 ảnh), Khách 3 (2 ảnh – để nhận ra) ──
      const link = await guestLink(request, fd, st.res.id);
      const g = await openGuest(request, link.token);
      expect(g.status, `openGuestSession: ${JSON.stringify(g.body)}`).toBe(200);
      const notice = await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
        body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
      });
      expect(notice.status, JSON.stringify(notice.body)).toBe(200);
      for (const [personIndex, images] of [
        [1, 1],
        [2, 1],
        [3, 2],
      ] as const) {
        const up = await callMultipart(request, 'POST', EP3.uploadGuestDocument[1], {
          cookie: g.cookie,
          origin: GUEST_ORIGIN,
          idempotencyKey: true,
          fields: { personIndex: String(personIndex), docType: 'cccd' },
          files: Array.from({ length: images }, (_, i) => [
            'image',
            png(`khach-${personIndex}-${i + 1}.png`),
          ]),
        });
        expect(up.status, `upload Khách ${personIndex}: ${JSON.stringify(up.body)}`).toBe(201);
      }
      let reg = await regNow(request, fd, st.regId);
      const links = docs(reg).filter((d) => !d.isMain && d.captureMethod === 'guest_upload');
      expect(links, JSON.stringify(docs(reg))).toHaveLength(2);
      const k3 = links.find((d) => (d.imageIds ?? []).length === 2)!;
      const k2 = links.find((d) => (d.imageIds ?? []).length === 1)!;
      expect(k3 && k2, JSON.stringify(links)).toBeTruthy();

      // ── lễ tân đã nhập trường Khách 3 (của B) như admin-web cũ: PATCH không có partyMemberId ──
      const bNumber = fakeCccd();
      const filled = await call(
        request,
        'PATCH',
        p3(EP3.updateGuestDocument, fd, { registrationId: st.regId, documentId: k3.id }),
        {
          ...dev(fd),
          ifMatch: versionTag(reg.version),
          body: vnDoc(B.name, { isMain: false, docNumber: bNumber }),
        },
      );
      expect(filled.status, `updateGuestDocument Khách 3: ${JSON.stringify(filled.body)}`).toBe(
        200,
      );

      // ── giảm còn 2 người lớn (đường không có lựa chọn của lễ tân) → Khách 2/3 chờ gắn người 24 giờ ──
      const cur = (await getReservation(request, fd, st.res.id)).body;
      const fewer = await patchReservation(request, fd, st.res.id, cur.version, { adults: 2 });
      expect(fewer.status, `updateReservation adults 3 → 2: ${JSON.stringify(fewer.body)}`).toBe(
        200,
      );
      reg = await regNow(request, fd, st.regId);
      const due = new Date(new Date(t0).getTime() + 24 * 3_600_000).getTime();
      for (const id of [k2.id, k3.id]) {
        const d = docs(reg).find((x) => x.id === id);
        expect(d?.unclaimedUntil, `giấy tờ ${id} chờ gắn người (unclaimedUntil)`).toBeTruthy();
        expect(Math.abs(new Date(d!.unclaimedUntil!).getTime() - due)).toBeLessThanOrEqual(60_000);
      }
      const label = tf('reg.link.pending_chip', {
        time: vnDateTime(docs(reg).find((x) => x.id === k3.id)!.unclaimedUntil!),
      });

      // ── Desk: "Cần chú ý" trên H14 → mở đơn, tới giấy tờ chờ ──
      await trustedDesk(page);
      await signIn(page, 'qa.fd');
      await page.goto(`${WEB_URL}/registration`);
      const attention = page
        .locator('.alert')
        .filter({ hasText: t('attn.dq_party_docs_unlinked_body') });
      await expect(attention, '"Cần chú ý" giấy tờ chờ gắn người trên H14').toBeVisible({
        timeout: 15_000,
      });
      await settle(page);
      await scan(page, test.info(), 'H14-list-attention-unlinked');
      const open = attention.getByRole('button', {
        name: tf('reg.link.open_booking', { code: st.res.code }),
      });
      // Nút mở tối đa 5 đơn đầu (hạn sớm nhất): đơn cũ còn sót trên stack có thể đứng trước – khi đó mở thẳng.
      if (await open.isVisible({ timeout: 5_000 }).catch(() => false)) await open.click();
      else {
        test.info().annotations.push({
          type: 'stack',
          description: 'đơn không nằm trong 5 nút đầu của "Cần chú ý" – mở thẳng H14 của đơn',
        });
        await page.goto(`${WEB_URL}/registration/${st.regId}?focus=pending`);
      }
      await expect(page.getByText(label, { exact: true })).toHaveCount(2, { timeout: 15_000 });
      await expect(
        page.getByText(
          tf('reg.link.banner', {
            n: 2,
            time: vnDateTime(docs(reg).find((x) => x.id === k2.id)!.unclaimedUntil!),
          }),
        ),
      ).toBeVisible();
      const row = page.locator(`li#doc-${k3.id}`);
      await expect(row).toContainText(B.name.toUpperCase());
      await expect(row.getByText(label, { exact: true })).toBeVisible();
      await scan(page, test.info(), 'H14-docs-pending-link');

      // ── đối chiếu: "Xem đủ số / ảnh" mở cả ảnh (UXR P2 ảnh 020 – step-up, reason, no-store; step-up của phiên
      //    này làm bằng API, không phải đối tượng kiểm) ──
      await stepUp(request, fd);
      const photos: Array<{ url: string; status: number; cache: string }> = [];
      page.on('response', (r) => {
        if (/\/documents\/[^/]+\/images\/[^/?]+/.test(r.url()))
          photos.push({
            url: r.url(),
            status: r.status(),
            cache: r.headers()['cache-control'] ?? '',
          });
      });
      await row.getByRole('button', { name: t('ci.view_full'), exact: true }).click();
      const imgs = row.getByRole('img');
      await expect(imgs).toHaveCount(2, { timeout: 10_000 });
      await expect(row.getByText(bNumber, { exact: true })).toBeVisible();
      // ảnh hiện thật (blob: được CSP img-src cho phép), không phải khung vỡ
      await expect
        .poll(
          () =>
            imgs.evaluateAll((els) =>
              els.every(
                (e) =>
                  (e as HTMLImageElement).naturalWidth > 0 &&
                  e.getAttribute('src')!.startsWith('blob:'),
              ),
            ),
          { message: 'ảnh giấy tờ giải mã và hiện được (blob:)' },
        )
        .toBe(true);
      expect(photos.map((x) => [x.status, new URL(x.url).searchParams.get('reason')])).toEqual([
        [200, 'registration'],
        [200, 'registration'],
      ]);
      expect(
        photos.every((x) => /no-store/.test(x.cache)),
        JSON.stringify(photos),
      ).toBe(true);
      await row.getByRole('button', { name: t('ci.view_hide'), exact: true }).click();
      await expect(imgs).toHaveCount(0);

      // ── lễ tân gắn Khách 3 vào B: hộp "Gắn người" chỉ chọn người (0.3.7 `GuestDocumentLink`), không đọc C3 ──
      const writes = recordWrites(page, 'PATCH', /\/registrations\/[^/]+\/documents\/[^/]+$/);
      const c3reads: string[] = [];
      page.on('request', (r) => {
        if (/\/sensitive|\/images\//.test(r.url())) c3reads.push(r.url());
      });
      await row.getByRole('button', { name: t('reg.link.action'), exact: true }).click();
      const dlg = page.getByRole('dialog', { name: t('reg.link.action') });
      await expect(dlg).toBeVisible({ timeout: 10_000 });
      await expect(dlg).toContainText(tf('guest.oci.person_n', { n: 3 }));
      const pick = dlg.getByLabel(t('reg.link.member'));
      await expect(pick).toBeEnabled({ timeout: 10_000 });
      await expect(pick, 'không chọn sẵn').toHaveValue('');
      await scan(page, test.info(), 'H14-link-dialog');
      await pick.selectOption({ label: B.name });
      await dlg.getByRole('button', { name: t('reg.link.action'), exact: true }).click();
      const sent = await waitWrite(writes, 'updateGuestDocument gắn Khách 3 vào B', 200);
      expect(sent.path).toMatch(new RegExp(`/documents/${esc(k3.id)}$`));
      expect(
        sent.request,
        'gắn người chỉ gửi partyMemberId (OpenAPI 0.3.7 GuestDocumentLink)',
      ).toEqual({
        partyMemberId: B.memberId,
      });
      expect(c3reads, 'gắn người không đọc dữ liệu C3').toEqual([]);
      await expect(dlg).toBeHidden({ timeout: 10_000 });
      await expect(row.getByText(t('guest.chip.doc_ok'))).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(label, { exact: true })).toHaveCount(1);

      // ── API: Khách 3 gắn B, hết hạn chờ; Khách 2 vẫn chờ ──
      reg = await regNow(request, fd, st.regId);
      const k3now = docs(reg).find((x) => x.id === k3.id);
      expect(k3now?.partyMemberId).toBe(B.memberId);
      expect(k3now?.unclaimedUntil ?? null, 'giấy tờ đã gắn không còn hạn chờ').toBeNull();
      expect(docs(reg).find((x) => x.id === k2.id)?.unclaimedUntil).toBeTruthy();

      // ── J16 sau hạn: giấy tờ đã gắn còn (ảnh đọc được), giấy tờ không ai nhận bị xóa ──
      await useVirtualDevice(request, await setClock(request, vnTime(addDays(D, 1), '09:01')));
      const run = await runJob(request, J16);
      expect(run.status).toBe('done');
      const fd2 = await session(request, 'qa.fd');
      reg = await regNow(request, fd2, st.regId);
      const ids = docs(reg).map((x) => x.id);
      expect(ids, 'giấy tờ đã gắn vẫn còn sau J16').toContain(k3.id);
      expect(ids, 'giấy tờ không ai nhận bị J16 xóa').not.toContain(k2.id);
      const kept = docs(reg).find((x) => x.id === k3.id)!;
      expect(kept.imageIds ?? []).toHaveLength(2);
      expect(kept.docNumberLast4).toBe(bNumber.slice(-4));
      await stepUp(request, fd2);
      const img = await call(
        request,
        'GET',
        p3(EP3.getDocumentImage, fd2, {
          registrationId: st.regId,
          documentId: k3.id,
          imageId: kept.imageIds![0]!,
        }),
        { ...dev(fd2), query: { reason: 'registration' } },
      );
      expect(img.status, 'ảnh của người còn ở đọc được (DEK còn)').toBe(200);
    });
  },
);
