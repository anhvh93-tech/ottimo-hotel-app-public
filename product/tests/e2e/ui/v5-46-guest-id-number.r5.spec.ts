// E2E UI – V5-46 (FB-R4-SEC-ARC-P104-03, OpenAPI 0.3.12 (i)): guest-web says it when the server refuses an ID number
// typed in a guest note (422 VALIDATION_FAILED, errors[{ field, code: ID_NUMBER_DETECTED }], SR-LOG-04), the way it
// does for a card number. Two notes: the arrival note of online check-in (updateOnlineCheckin.arrivalNote) and the
// note of a guest request (createGuestRequest.note). Sentence = `error.ID_NUMBER_DETECTED` from strings-vi.json.
//
// The guest-portal half of the server rule ships under the same tag as this page ("bật cùng tag máy chủ", contract
// 0.3.13 mục 1.12). Until the stack under test has it, the refused call is answered by `page.route` with the contract
// example (openapi.yaml `idInNote`) – the number never reaches the server. Everything else (link, session, steps,
// the call after the guest removes the number) runs against the real stack. axe on the refused state: 0
// critical/serious. Fake data only (`fakeCccd`, no real document).
// Project desk-chromium (testMatch ui/); each case makes its own phone-sized browser context.
import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page, type Route } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { GUEST_ORIGIN, SEED_PASSWORD } from '../support/env.js';
import { bookFree, cleanupTracked, room, s2Context } from '../support/s2.js';
import {
  EP3,
  PRIVACY_NOTICE,
  callMultipart,
  fakeCccd,
  guestCall,
  guestLink,
  namedGuest,
  openGuest,
  png,
} from '../support/s3.js';
import { scan } from './axe.js';
import { UI } from './helpers.js';

const VI = JSON.parse(
  readFileSync(new URL('../../../design/copy/strings-vi.json', import.meta.url), 'utf8'),
) as Record<string, string>;

/** openapi.yaml `idInNote` example – only `field` + `code`, never the guest's text. */
function idInNote(field: 'arrivalNote' | 'note') {
  return {
    status: 422,
    contentType: 'application/problem+json',
    body: JSON.stringify({
      type: '/problems/validation-failed',
      title: 'Dữ liệu chưa hợp lệ',
      status: 422,
      code: 'VALIDATION_FAILED',
      errors: [{ field, code: 'ID_NUMBER_DETECTED' }],
    }),
  };
}

/** Answer the write whose JSON body carries `field` with the contract 422; every other call goes to the stack. */
function refuseNote(field: 'arrivalNote' | 'note', seen: string[]) {
  return async (route: Route) => {
    const req = route.request();
    const body =
      req.method() === 'GET' ? null : (req.postDataJSON() as Record<string, unknown> | null);
    if (body && typeof body[field] === 'string' && /\d{12}/.test(body[field] as string)) {
      seen.push(`${req.method()} ${new URL(req.url()).pathname}`);
      return route.fulfill(idInNote(field));
    }
    return route.continue();
  };
}

async function guestPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  return ctx.newPage();
}

/** Confirmed booking (2 adults) + guest link (same set-up as ui/guest-web.h18.spec.ts). */
async function bookingWithLink(request: Page['request'], roomNo: string) {
  const fd = await session(request, 'qa.fd');
  const c = await s2Context(request);
  const g = await namedGuest(request, fd, {});
  const res = await bookFree(request, fd, c, {
    room: room(c, roomNo),
    nights: 2,
    today: await stackToday(request),
    guestId: g.id,
  });
  return guestLink(request, fd, res.id);
}

test.describe(
  'UI guest-web V5-46 – câu báo khi máy chủ chặn số giấy tờ (ID_NUMBER_DETECTED)',
  { tag: ['@ui', '@r5', '@guest'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('V5-46-1 (E) ghi chú lúc đến có số giấy tờ → câu báo dưới ô ghi chú, ở lại bước Giờ đến; xóa số → đi tiếp + axe', async ({
      browser,
      request,
    }, info) => {
      test.slow();
      const link = await bookingWithLink(request, '302');
      // Notice + both guests' documents through the guest API, so the page resumes at the arrival step.
      const g = await openGuest(request, link.token);
      expect(g.status, `openGuestSession: ${JSON.stringify(g.body)}`).toBe(200);
      const n = await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
        body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
      });
      expect(n.status, JSON.stringify(n.body)).toBe(200);
      for (const personIndex of [1, 2]) {
        const u = await callMultipart(request, 'POST', EP3.uploadGuestDocument[1], {
          cookie: g.cookie,
          origin: GUEST_ORIGIN,
          idempotencyKey: true,
          fields: { personIndex: String(personIndex), docType: 'cccd' },
          files: [['image', png()]],
        });
        expect(u.status, `upload khách ${personIndex}: ${JSON.stringify(u.body)}`).toBe(201);
      }
      // what the page itself sends after "Tiếp tục" on the documents step (CheckinFlow → currentStep 'eta')
      const e = await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
        body: { currentStep: 'eta' },
      });
      expect(e.status, JSON.stringify(e.body)).toBe(200);

      const page = await guestPage(browser);
      const refused: string[] = [];
      await page.route(/\/v1\/guest\/online-checkin(\?.*)?$/, refuseNote('arrivalNote', refused));
      await page.goto(link.url);
      await page
        .getByRole('button', { name: VI['guest.cta.checkin_short']! })
        .first()
        .click({ timeout: 15_000 });
      await expect(
        page.getByRole('heading', { name: VI['guest.oci.step2']!, level: 1 }),
      ).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('radio').first().check();
      const note = page.getByLabel(VI['guest.oci.note']!);
      await note.fill(`CCCD ${fakeCccd()}`);
      await page.getByRole('button', { name: VI['common.next']! }).last().click();

      const alert = page.getByRole('alert').filter({ hasText: VI['error.ID_NUMBER_DETECTED']! });
      await expect(alert).toBeVisible();
      await expect(note).toHaveAttribute('aria-invalid', 'true');
      await expect(note).toHaveAttribute('aria-describedby', 'gw-note-err');
      await expect(
        page.getByRole('heading', { name: VI['guest.oci.step2']!, level: 1 }),
      ).toBeVisible();
      expect(refused).toEqual(['PUT /v1/guest/online-checkin']);
      await scan(page, info, 'V5-46-eta-id-number');

      // The guest removes the number: the sentence goes, the real server takes the step.
      await note.fill('Đến muộn vì chuyến bay');
      await expect(alert).toHaveCount(0);
      await page.getByRole('button', { name: VI['common.next']! }).last().click();
      await expect(page.getByText(VI['guest.oci.consent_q']!)).toBeVisible({ timeout: 15_000 });
      expect(refused).toHaveLength(1);
      await page.context().close();
    });

    test('V5-46-2 (E) lời nhắn yêu cầu "Khác" có số giấy tờ → câu báo, không tạo yêu cầu + axe', async ({
      browser,
      request,
    }, info) => {
      const link = await bookingWithLink(request, '402');
      const page = await guestPage(browser);
      const refused: string[] = [];
      await page.route(/\/v1\/guest\/requests(\?.*)?$/, refuseNote('note', refused));
      await page.goto(link.url);
      await page
        .getByRole('button', { name: VI['guest.tab.requests']! })
        .first()
        .click({ timeout: 15_000 });
      await page.getByRole('button', { name: VI['gw.req.new']! }).click();
      await page.getByRole('button', { name: new RegExp(`^${VI['guest.req.other']!}`) }).click();
      await page.getByLabel(VI['gw.req.note_label']!).fill(`Số CCCD của tôi ${fakeCccd()}`);
      await page.getByRole('button', { name: VI['guest.req.send']! }).click();

      await expect(page.getByText(VI['error.ID_NUMBER_DETECTED']!)).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(VI['gw.req.note_required']!)).toHaveCount(0);
      expect(refused).toEqual(['POST /v1/guest/requests']);
      await scan(page, info, 'V5-46-request-id-number');
      await page.context().close();
    });
  },
);
