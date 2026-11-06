// E2E UI – V5-46 (FB-R4-SEC-ARC-P104-03, OpenAPI 0.3.12 (i)): guest-web says it when the server refuses an ID number
// typed in a guest note (422 VALIDATION_FAILED, errors[{ field, code: ID_NUMBER_DETECTED }], SR-LOG-04), the way it
// does for a card number. Two notes: the arrival note of online check-in (updateOnlineCheckin.arrivalNote) and the
// note of a guest request (createGuestRequest.note). Sentence = `error.ID_NUMBER_DETECTED` from strings-vi.json.
//
// The guest-portal half of the server rule (BE-A1 `r5-v5-46-server`, FB-R5-SEC-BE-V546-01) is on the stack under
// test, so the whole case runs against the REAL server – no `page.route` any more (ARC FB-R5-ARC-FE-107-02): the
// server's own 422 is read back (only `field` + `code`, never the number), the refused write stores nothing (read
// back through the guest API), and the call after the guest removes the number goes through. axe on the refused
// state: 0 critical/serious. Fake data only: the constant `079000000000` (six trailing zeros – plainly a sample,
// SEC FB-R5-SEC-FE-V546-03), never a random number that could match a real CCCD.
// Project desk-chromium (testMatch ui/); each case makes its own phone-sized browser context.
import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page, type Response } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { GUEST_ORIGIN, SEED_PASSWORD } from '../support/env.js';
import { bookFree, cleanupTracked, room, s2Context } from '../support/s2.js';
import {
  EP3,
  PRIVACY_NOTICE,
  callMultipart,
  guestCall,
  guestLink,
  namedGuest,
  openGuest,
  png,
} from '../support/s3.js';
import { scan } from './axe.js';
import { UI } from './helpers.js';
// own line, not merged into the api.js import above: keeps PR #113 (same file) free of a merge conflict
import { resetRateLimits } from '../support/api.js';

const VI = JSON.parse(
  readFileSync(new URL('../../../design/copy/strings-vi.json', import.meta.url), 'utf8'),
) as Record<string, string>;

/** SEC FB-R5-SEC-FE-V546-03: the same sample number as the guest-web vitest (`FAKE_ID`). */
const FAKE_ID = '079000000000';

/** Every write of the page that carries the sample number (`METHOD /path`) – the page must send it once only. */
function writesWithNumber(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET' && (req.postData() ?? '').includes(FAKE_ID)) {
      seen.push(`${req.method()} ${new URL(req.url()).pathname}`);
    }
  });
  return seen;
}

/** The server's answer to the write carrying the number (contract `idInNote`): 422, only `field` + `code`. */
function refusedWrite(page: Page, method: 'PUT' | 'POST', path: string): Promise<Response> {
  return page.waitForResponse(
    (r) =>
      r.request().method() === method &&
      new URL(r.url()).pathname === path &&
      (r.request().postData() ?? '').includes(FAKE_ID),
    { timeout: 15_000 },
  );
}
async function expectRefusedAsId(res: Response, field: 'arrivalNote' | 'note') {
  expect(res.status(), `${field}: ${await res.text()}`).toBe(422);
  const body = (await res.json()) as Record<string, unknown>;
  expect(body).toMatchObject({
    code: 'VALIDATION_FAILED',
    errors: [{ field, code: 'ID_NUMBER_DETECTED' }],
  });
  expect(body.detail).toBeUndefined();
  expect(JSON.stringify(body)).not.toContain(FAKE_ID);
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

/**
 * Confirmed booking (2 adults) + guest link (same set-up as ui/guest-web.h18.spec.ts).
 *
 * Then a fresh guest-open window: the page itself opens the session (POST /v1/guest/sessions) on `page.goto`, and
 * guest-open is 10/min + 100/day per IP – every E2E call comes from one IP, so the parallel guest cases can fill
 * the minute before this page opens (CI #112 run 42274686717 / #126 run 42274569391: 429 "Bạn đã thử quá nhiều
 * lần" page in both attempts, Retry-After 4 s, the retry inside the same window). The API helper `openGuest`
 * resets on a 429; the page cannot, so the limiter is cleared here, just before the page opens (no-op on a
 * stack without test support). A 429 the product sends for the guest's own retries is not what these cases check.
 */
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
  const link = await guestLink(request, fd, res.id);
  await resetRateLimits(request, 'V5-46: trang khách tự mở phiên (guest-open 10/phút/IP)');
  return link;
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
      const refused = writesWithNumber(page);
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
      await note.fill(`CCCD ${FAKE_ID}`);
      const answer = refusedWrite(page, 'PUT', '/v1/guest/online-checkin');
      await page.getByRole('button', { name: VI['common.next']! }).last().click();
      await expectRefusedAsId(await answer, 'arrivalNote');

      const alert = page.getByRole('alert').filter({ hasText: VI['error.ID_NUMBER_DETECTED']! });
      await expect(alert).toBeVisible();
      await expect(note).toHaveAttribute('aria-invalid', 'true');
      await expect(note).toHaveAttribute('aria-describedby', 'gw-note-err');
      await expect(
        page.getByRole('heading', { name: VI['guest.oci.step2']!, level: 1 }),
      ).toBeVisible();
      expect(refused).toEqual(['PUT /v1/guest/online-checkin']);
      // Nothing stored: the whole write was refused – still on the ETA step, no arrival time.
      const after = await guestCall(request, 'GET', EP3.getOnlineCheckin[1], g.cookie);
      expect(after.status, JSON.stringify(after.body)).toBe(200);
      expect(after.body).toMatchObject({ currentStep: 'eta' });
      expect(after.body.etaTime ?? null).toBeNull();
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
      const refused = writesWithNumber(page);
      await page.goto(link.url);
      await page
        .getByRole('button', { name: VI['guest.tab.requests']!, exact: true })
        .first()
        .click({ timeout: 15_000 });
      await page.getByRole('button', { name: VI['gw.req.new']!, exact: true }).click();
      await page.getByRole('button', { name: new RegExp(`^${VI['guest.req.other']!}`) }).click();
      await page.getByLabel(VI['gw.req.note_label']!).fill(`Số CCCD của tôi ${FAKE_ID}`);
      const answer = refusedWrite(page, 'POST', '/v1/guest/requests');
      await page.getByRole('button', { name: VI['guest.req.send']!, exact: true }).click();
      await expectRefusedAsId(await answer, 'note');

      await expect(page.getByText(VI['error.ID_NUMBER_DETECTED']!)).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(VI['gw.req.note_required']!)).toHaveCount(0);
      expect(refused).toEqual(['POST /v1/guest/requests']);
      // Nothing stored: the booking still has no request (own list through the guest API).
      const g = await openGuest(request, link.token);
      expect(g.status, `openGuestSession: ${JSON.stringify(g.body)}`).toBe(200);
      const mine = await guestCall(request, 'GET', '/v1/guest/requests', g.cookie);
      expect(mine.status, JSON.stringify(mine.body)).toBe(200);
      expect((mine.body as { data?: unknown[] }).data ?? []).toEqual([]);
      await scan(page, info, 'V5-46-request-id-number');
      await page.context().close();
    });
  },
);
