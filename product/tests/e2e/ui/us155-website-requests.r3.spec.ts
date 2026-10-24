// US-155 "Yêu cầu đặt phòng từ website" – E2E on a DISPOSABLE stack (QA R3, Kiểm thử v1.0; SEC s1-SEC-on-us155
// "Điều kiện còn lại" 1 + 7, Phụ lục B.2.1–B.2.3 of round-02/reviews/landing-booking-SEC.md).
//
// Needs (all three, else every case is skipped):
//   E2E_UI=1                 Chromium + admin-web (project desk-chromium)
//   E2E_LANDING_URL          origin of the LIVE landing build (LANDING_BOOKING_FORM=true, LANDING_PROPERTY_SLUG =
//                            E2E_LANDING_SLUG, default `dlt` = DS-E property DLT) served by a Caddy that proxies ONLY
//                            /v1/public/properties/{slug}/(form-token|booking-requests) to the api – the api's
//                            LANDING_BASE_URL must be this origin and PUBLIC_FORM_SIGNING_KEY must be set.
//   E2E_COMPOSE_CONTROL=1    psql on the stack (publish privacy_notice_version like the landing release does, reset the
//                            SR-RL-11 DB counters between cases, scan C2 copies) + `docker compose logs` (B.2.3).
//                            Also E2E_COMPOSE_PROJECT / E2E_COMPOSE_ENV_FILE when the stack is not the dev one.
// Stack: support/us155-stack/compose.us155.yml (overlay + landing Caddy; how to build/run is written there).
// The cases share one state (the switch, the requests made) → serial. The form switch is put back OFF at the end.
// The api's RAM limit (30 public calls/hour/IP – C-11 step 0) is NOT reset by anything: one full run makes ~22 calls;
// restart the api container before a second run within the hour.
// Test data is fake (example.invalid, fake VN mobiles, a made-up 12-digit number for the CCCD case).
import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import {
  call,
  fakeMobile,
  needSeedPassword,
  propertyIdOf,
  session,
  stackToday,
  type Problem,
  type StaffSession,
} from '../support/api.js';
import { PRODUCT_DIR } from '../support/env.js';
import { knownBug } from '../support/known-bugs.js';
import { stackSql } from '../support/s3.js';
import { UI, signIn, t } from './helpers.js';

const LANDING = (process.env.E2E_LANDING_URL ?? '').replace(/\/$/, '');
const SLUG = process.env.E2E_LANDING_SLUG ?? 'dlt';
const CONTROL = process.env.E2E_COMPOSE_CONTROL === '1';
const NOTICE_VERSION = process.env.E2E_NOTICE_VERSION ?? '2026-10-24';
const SWITCH = 'public_booking_requests_enabled';
/** Made-up 12-digit number shaped like a CCCD (B.2.3) – never a real one. */
const FAKE_CCCD = '079203012345';

test.skip(
  !UI || !LANDING || !CONTROL,
  'US-155 E2E: cần E2E_UI=1, E2E_LANDING_URL (bản landing có form thật) và E2E_COMPOSE_CONTROL=1 (stack dùng một lần)',
);
test.describe.configure({ mode: 'serial' });

// ───────────────────────── helpers ─────────────────────────

const sql1 = (q: string) => stackSql(q).trim();

/** Like the landing release (OPS data step): publish the notice version the build sends as consentVersion. */
function publishNotices(): void {
  stackSql(`INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
    SELECT p.organization_id, '${NOTICE_VERSION}', l.locale, repeat('a', 64), l.path, now()
      FROM property p CROSS JOIN (VALUES ('vi', '/vi/privacy/'), ('en', '/privacy/')) AS l(locale, path)
     WHERE lower(p.code) = '${SLUG}'
    ON CONFLICT (organization_id, version, locale) DO NOTHING;
    BEGIN; SET LOCAL session_replication_role = replica;
    UPDATE privacy_notice_version SET superseded_at = NULL WHERE version = '${NOTICE_VERSION}'; COMMIT;`);
}

/** Earlier runs referenced the rows (FK from requests): mark them superseded long ago instead of deleting them. */
function unpublishNotices(): void {
  stackSql(`BEGIN; SET LOCAL session_replication_role = replica;
    UPDATE privacy_notice_version SET superseded_at = now() - interval '30 days' WHERE version = '${NOTICE_VERSION}';
    COMMIT;`);
}

/**
 * Rows of the switch from today on. The parameter model is append-only by day (setParameter: a row already effective
 * cannot be changed – BUG-R3-007), so on a disposable stack the harness removes today's row (trigger bypassed as
 * superuser) before setting the switch again; production has no such way (that is the bug).
 */
function clearSwitchRows(): void {
  // The table's trigger (config_parameter_delete_future_only) refuses this on purpose – superuser, disposable stack only.
  stackSql(`BEGIN; SET LOCAL session_replication_role = replica;
    DELETE FROM config_parameter WHERE key = '${SWITCH}' AND effective_from >= '${today}'; COMMIT;`);
}

/** SR-RL-11 DB counters (per IP / contact / property day) – every case starts from zero, like a new visitor. */
function resetPublicCounters(): void {
  stackSql(`DELETE FROM rate_limit_counter WHERE bucket_key LIKE 'webreq:%';`);
}

async function setSwitch(ctx: APIRequestContext, s: StaffSession, value: boolean) {
  const today = await stackToday(ctx);
  return call<Problem & { missing?: string[] }>(
    ctx,
    'PUT',
    `/v1/properties/${propertyIdOf(s)}/parameters/${SWITCH}`,
    {
      session: s,
      body: { value, effectiveFrom: today, reason: 'E2E QA US-155 (stack dùng một lần)' },
    },
  );
}

function addDays(d: string, n: number): string {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

interface Sent {
  refCode: string;
  phone: string;
  name: string;
  arrival: string;
  departure: string;
}

interface FormInput {
  lang?: 'en' | 'vi';
  name: string;
  phone?: string;
  note?: string;
  arrival: string;
  departure: string;
  adults?: number;
}

/** Open the landing booking section and fill the short-stay form (does not submit). */
async function fillLanding(page: Page, i: FormInput): Promise<void> {
  await page.goto(`${LANDING}${i.lang === 'vi' ? '/vi/' : '/'}#book`);
  const form = page.locator('#bk-form');
  await expect(form).toBeVisible();
  await page.locator('#f-in').fill(i.arrival);
  await page.locator('#f-out').fill(i.departure);
  if (i.adults) await page.locator('#f-adults').selectOption(String(i.adults));
  await page.locator('#f-name').fill(i.name);
  if (i.phone) await page.locator('#f-phone').fill(i.phone);
  if (i.note) await page.locator('#f-note').fill(i.note);
  await page.locator('#f-consent').check();
}

/** Watch every request the landing page makes (C-1: nothing leaves the landing origin). */
function watchRequests(page: Page): { all: string[]; outside: () => string[] } {
  const all: string[] = [];
  page.on('request', (r) => all.push(`${r.method()} ${r.url()}`));
  return {
    all,
    outside: () =>
      all.filter((x) => {
        const url = x.split(' ')[1] ?? '';
        return !url.startsWith(LANDING) && !url.startsWith('data:');
      }),
  };
}

/** Fill, wait the form-token minimum (3 s), send; returns the ref code from the thank-you block. */
async function sendLanding(page: Page, i: FormInput): Promise<string> {
  await fillLanding(page, i);
  await page.waitForTimeout(3_500);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible({ timeout: 20_000 });
  const ref = (await page.locator('#bk-ref').innerText()).trim();
  expect(ref, 'mã yêu cầu trên trang cảm ơn').toMatch(/^[A-Z0-9-]{6,12}$/);
  return ref;
}

/**
 * A raw call to the public API from INSIDE the landing page (same origin – real Origin and Sec-Fetch-Site headers),
 * bypassing the form's own checks: token → wait ≥ 3 s → POST. For server-side cases (U+202E, CCCD).
 */
async function rawPublicPost(
  page: Page,
  body: Record<string, unknown>,
): Promise<{ status: number; text: string }> {
  await page.goto(`${LANDING}/`);
  return page.evaluate(
    async ({ slug, body }) => {
      const base = `/v1/public/properties/${slug}`;
      const tok = await fetch(`${base}/form-token`, { headers: { accept: 'application/json' } });
      if (tok.status !== 200) return { status: tok.status, text: await tok.text() };
      const { token } = (await tok.json()) as { token: string };
      await new Promise((r) => setTimeout(r, 3_500));
      const res = await fetch(`${base}/booking-requests`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ ...body, formToken: token }),
      });
      return { status: res.status, text: await res.text() };
    },
    { slug: SLUG, body },
  );
}

function rawBody(i: {
  name: string;
  phone: string;
  note?: string;
  arrival: string;
  departure: string;
}) {
  return {
    website: '',
    stayType: 'short',
    arrival: i.arrival,
    departure: i.departure,
    adults: 2,
    children: 0,
    infants: 0,
    guestName: i.name,
    phone: i.phone,
    preferredChannel: 'zalo',
    ...(i.note ? { note: i.note } : {}),
    locale: 'en',
    consent: true,
    consentVersion: NOTICE_VERSION,
  };
}

const intl = (phone: string) => `+84${phone.slice(1)}`;

async function openQueue(page: Page): Promise<void> {
  await page
    .getByRole('link', { name: new RegExp(t('nav.website_requests')) })
    .first()
    .click();
  await expect(page).toHaveURL(/\/website-requests/);
}

/** Open one request's drawer by its code (search box of S35). */
async function openRequest(page: Page, code: string) {
  await page.goto(new URL('/website-requests', page.url()).toString());
  await page.getByRole('textbox', { name: t('webreq.search_label') }).fill(code);
  await page.getByRole('button', { name: t('webreq.search_btn'), exact: true }).click();
  await page
    .getByRole('row')
    .filter({ hasText: code })
    .getByRole('button', { name: code })
    .first()
    .click();
  const drawer = page.getByRole('dialog').filter({ hasText: code }).first();
  await expect(drawer).toBeVisible();
  return drawer;
}

function requestRow(code: string): Record<string, string | null> {
  const out =
    sql1(`SELECT json_build_object('status', status, 'guest_name', guest_name, 'phone', phone_e164,
      'email', email, 'note', note, 'contact_hmac', contact_hmac, 'ip_hmac', ip_hmac,
      'decline_reason', decline_reason_code, 'reservation', reservation_id::text, 'pii_purged_at', pii_purged_at::text)
    FROM website_booking_request WHERE ref_code = '${code}'`);
  return JSON.parse(out) as Record<string, string | null>;
}

/**
 * C-12 (c) / FB-R3-SEC-US155-01: tables where a copy of the REQUEST's C2 must never stay. The guest profile the desk
 * creates in H09 ("Hồ sơ khách mới" – POST /guests) legitimately holds name + phone (the guest's own record, kept by
 * the guest rules, not by the request's): its idempotency row is left out on purpose.
 */
function c2Copies(needles: string[]): string[] {
  const hits: string[] = [];
  for (const n of needles.filter((x) => x && x.length >= 4)) {
    const v = n.replace(/'/g, "''");
    const q = `SELECT 'idempotency_key:' || count(*) FROM idempotency_key WHERE response_body::text LIKE '%${v}%'
        AND path !~ '/guests$'
      UNION ALL SELECT 'audit_event:' || count(*) FROM audit_event WHERE row_to_json(audit_event)::text LIKE '%${v}%'
      UNION ALL SELECT 'staff_notification:' || count(*) FROM staff_notification WHERE row_to_json(staff_notification)::text LIKE '%${v}%'
      UNION ALL SELECT 'state_transition:' || count(*) FROM state_transition WHERE row_to_json(state_transition)::text LIKE '%${v}%'`;
    for (const line of sql1(q).split('\n')) {
      const [table, count] = line.split(':');
      if (Number(count) > 0) hits.push(`${table} có "${n}" (${count} dòng)`);
    }
  }
  return hits;
}

/** `docker compose logs` of the stack (api, worker, landing Caddy, web Caddy, postgres) – B.2.3. */
function stackLogs(): string {
  const args = [
    'compose',
    ...(process.env.E2E_COMPOSE_PROJECT ? ['-p', process.env.E2E_COMPOSE_PROJECT] : []),
    '--env-file',
    process.env.E2E_COMPOSE_ENV_FILE ?? '.env',
    '-f',
    process.env.E2E_COMPOSE_FILE ?? 'infra/docker-compose.yml',
    'logs',
    '--no-color',
  ];
  return execFileSync('docker', args, {
    cwd: PRODUCT_DIR,
    stdio: 'pipe',
    maxBuffer: 256 * 1024 * 1024,
  }).toString();
}

/**
 * Desk signed in as `user`. BUG-R3-007: the server's `Me.screens` has no S35 for any role, so the real Desk hides the
 * menu item and refuses /website-requests ("Bạn không có quyền mở trang này"). To test the rest of S35 the harness
 * adds S35 to `screens` of GET /v1/me IN THIS BROWSER ONLY (menu + route guard are presentation; every API call is
 * still checked by the server – x-roles, x-scope). Annotation `harness`. Off once BUG-R3-007 is closed (E2E_FIXED_BUGS
 * or removed from OPEN): then the real `Me` is used.
 */
async function desk(browser: Browser, user: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  const fixed = (process.env.E2E_FIXED_BUGS ?? '').split(',').includes('BUG-R3-007');
  if (!fixed) {
    test.info().annotations.push({
      type: 'harness',
      description:
        'BUG-R3-007: thêm S35 vào Me.screens trong trình duyệt để kiểm phần còn lại của S35',
    });
    await page.route(/\/v1\/me$/, async (route) => {
      const res = await route.fetch();
      const body = (await res.json()) as { properties?: { roles: string[]; screens: string[] }[] };
      const s35 = ['owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff'];
      for (const p of body.properties ?? []) {
        if (p.roles.some((r) => s35.includes(r)) && !p.screens.includes('S35'))
          p.screens.push('S35');
      }
      await route.fulfill({ response: res, json: body });
    });
  }
  await signIn(page, user);
  return page;
}

// ───────────────────────── cases ─────────────────────────

let today = '';
let sent: Sent | null = null;

test.beforeAll(async ({ request }) => {
  needSeedPassword();
  today = await stackToday(request);
  clearSwitchRows();
  unpublishNotices();
  resetPublicCounters();
});

test.afterAll(async ({ request }) => {
  clearSwitchRows();
  const own = await session(request, 'qa.owner');
  await setSwitch(request, own, false);
});

test('TC-WR-001 công tắc: chưa có thông báo xử lý dữ liệu → 422 PUBLIC_FORM_NOT_READY; tắt → landing chỉ Zalo/gọi', async ({
  page,
  request,
}) => {
  const own = await session(request, 'qa.owner');
  const r = await setSwitch(request, own, true);
  expect(r.status, JSON.stringify(r.body)).toBe(422);
  expect(r.body.code).toBe('PUBLIC_FORM_NOT_READY');
  expect([...(r.body.missing ?? [])].sort()).toEqual([
    'privacy_notice_version.en',
    'privacy_notice_version.vi',
  ]);
  const mgr = await session(request, 'qa.mgr');
  const m = await setSwitch(request, mgr, true);
  expect(m.status, 'MGR không bật được công tắc (chỉ OWN)').toBe(403);
  expect(
    sql1(`SELECT count(*) FROM config_parameter WHERE key = '${SWITCH}'`),
    '422/403 không ghi dòng tham số nào',
  ).toBe('0');

  // Form off: the first touch asks for a token → 404 → paused line with Zalo + tel links, no POST.
  const seen = watchRequests(page);
  await page.goto(`${LANDING}/#book`);
  await page.locator('#f-name').click();
  const status = page.locator('#bk-status');
  await expect(status).toContainText('Online requests are paused right now', { timeout: 10_000 });
  await expect(status.locator('a[href^="tel:"]')).toHaveCount(1);
  await expect(status.locator('a', { hasText: 'Zalo' })).toHaveCount(1);
  expect(seen.all.filter((x) => x.startsWith('POST'))).toEqual([]);
  expect(seen.outside(), 'không request ra ngoài origin landing').toEqual([]);

  // Public endpoints answer 404 like an unknown property.
  const tok = await page.evaluate(
    async (slug) => (await fetch(`/v1/public/properties/${slug}/form-token`)).status,
    SLUG,
  );
  expect(tok).toBe(404);

  publishNotices();
  const on = await setSwitch(request, own, true);
  expect(on.status, JSON.stringify(on.body)).toBeLessThan(300);
});

test('TC-WR-000 BUG-R3-007 Desk thật (Me.screens của server): OWN/FD/SAL thấy menu "Yêu cầu từ website" và mở được S35', async ({
  browser,
}) => {
  knownBug('BUG-R3-007');
  for (const user of ['qa.owner', 'qa.fd', 'qa.sal']) {
    const ctx = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      locale: 'vi-VN',
    });
    const p = await ctx.newPage();
    await signIn(p, user);
    await expect(
      p.getByRole('link', { name: new RegExp(t('nav.website_requests')) }).first(),
      `${user}: menu có "Yêu cầu từ website" (rbac S35)`,
    ).toBeVisible({ timeout: 10_000 });
    await p.goto(new URL('/website-requests', p.url()).toString());
    await expect(p.getByText('Bạn không có quyền mở trang này')).toHaveCount(0);
    await ctx.close();
  }
});

test('TC-WR-002 khách gửi yêu cầu (EN) → trang cảm ơn có mã; Desk: hàng chờ, số trên menu, "Cần chú ý"', async ({
  page,
  browser,
}) => {
  resetPublicCounters();
  const seen = watchRequests(page);
  const phone = fakeMobile();
  const arrival = addDays(today, 120 + Math.floor(Math.random() * 40));
  const departure = addDays(arrival, 2);
  const name = 'Qa Guest Alpha';
  const refCode = await sendLanding(page, {
    name,
    phone: intl(phone),
    arrival,
    departure,
    note: 'Late arrival around 21:00, two adults.',
  });
  sent = { refCode, phone, name, arrival, departure };
  const done = page.locator('#bk-done');
  await expect(done).toContainText(/not (yet )?(a )?(booking|hold|reserv)/i);
  const posts = seen.all.filter((x) => x.startsWith('POST'));
  expect(posts).toHaveLength(1);
  expect(posts[0]).toContain(`/v1/public/properties/${SLUG}/booking-requests`);
  expect(seen.all.filter((x) => x.includes('/form-token'))).toHaveLength(1);
  expect(seen.outside(), 'không request ra ngoài origin landing').toEqual([]);

  // DB: the request is `new`, nothing else of the guest is linked.
  const row = requestRow(refCode);
  expect(row.status).toBe('new');
  expect(row.guest_name).toBe(name);

  // Desk – front desk (FD): menu number, queue row, "Cần chú ý".
  const fd = await desk(browser, 'qa.fd');
  const navLink = fd.getByRole('link', { name: new RegExp(t('nav.website_requests')) }).first();
  await expect(navLink).toBeVisible();
  await expect(navLink).toContainText(/\d+/, { timeout: 15_000 });
  const navText = await navLink.innerText();
  expect(Number(/(\d+)/.exec(navText)?.[1] ?? 0)).toBeGreaterThanOrEqual(1);

  const attnText = t('attn.website_request_new_one').replace('{code}', refCode);
  const attnMany = t('attn.website_request_new').split('{')[0]!.trim();
  await expect(
    fd.getByText(attnText).or(fd.getByText(attnMany)).first(),
    '"Cần chú ý" có mục yêu cầu website chưa ai nhận',
  ).toBeVisible({ timeout: 15_000 });

  await openQueue(fd);
  const listRow = fd.getByRole('row').filter({ hasText: refCode }).first();
  await expect(listRow).toBeVisible();
  // The list never shows the name / phone (EP19 3.3).
  await expect(listRow).not.toContainText(name);
  await expect(listRow).not.toContainText(phone.slice(-6));
  await fd.context().close();
});

test('TC-WR-003 FD nhận xử lý → thấy tên/SĐT, số trên menu giảm; "Tạo đơn" (B2) → đơn nguồn Website, yêu cầu converted, C2 xóa', async ({
  browser,
}) => {
  test.skip(!sent, 'cần yêu cầu của TC-WR-002');
  const s = sent!;
  const fd = await desk(browser, 'qa.fd');
  const navLink = fd.getByRole('link', { name: new RegExp(t('nav.website_requests')) }).first();
  await expect(navLink).toContainText(/\d+/, { timeout: 15_000 });
  const before = Number(/(\d+)/.exec(await navLink.innerText())?.[1] ?? 0);

  const drawer = await openRequest(fd, s.refCode);
  await expect(drawer).toContainText(s.name);
  await drawer.getByRole('button', { name: t('webreq.claim') }).click();
  await expect(drawer).toContainText(t('webreq.you'), { timeout: 10_000 });
  await expect
    .poll(async () => Number(/(\d+)/.exec(await navLink.innerText())?.[1] ?? 0), {
      message: 'số trên menu giảm sau khi nhận',
      timeout: 15_000,
    })
    .toBe(before - 1);
  expect(requestRow(s.refCode).status).toBe('in_progress');

  // "Tạo đơn": H09 with the request's dates/guests, source Website.
  await drawer.getByRole('button', { name: t('webreq.create_booking') }).click();
  const d = fd
    .getByRole('dialog')
    .filter({ hasText: t('webreq.booking_hint').slice(0, 30) })
    .first();
  await expect(d).toBeVisible();
  await expect(d.getByRole('textbox', { name: 'Ngày đến' })).toHaveValue(s.arrival);
  await expect(d.getByRole('textbox', { name: 'Ngày đi' })).toHaveValue(s.departure);
  await expect(d.getByRole('combobox', { name: t('bk.source') })).toHaveValue('website');

  const roomSel = d.getByRole('combobox', { name: t('booking.field.room'), exact: true });
  const roomOptions = async () =>
    (await roomSel.locator('option').allTextContents()).filter((o) => /^\d{3}\b/.test(o.trim()));
  await expect
    .poll(async () => (await roomOptions()).length, {
      message: 'có căn trống cho ngày của yêu cầu',
      timeout: 15_000,
    })
    .toBeGreaterThan(0);
  const options = await roomOptions();
  console.log('[QA] room options', (await roomSel.locator('option').allTextContents()).slice(0, 5));
  await roomSel.selectOption({ label: options[0]! });
  await d.getByRole('combobox', { name: t('booking.field.guest') }).fill(s.name);
  await fd.getByRole('option', { name: /Tạo nhanh/ }).click();
  const g = fd.getByRole('dialog', { name: 'Hồ sơ khách mới' });
  const gPhone = g.getByRole('textbox', { name: 'Số điện thoại / Zalo' });
  if (!(await gPhone.inputValue())) await gPhone.fill(s.phone);
  await g.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(g).toBeHidden();
  const phoneField = d.getByRole('textbox', { name: t('booking.field.phone') });
  if (await phoneField.isVisible().catch(() => false)) await phoneField.fill(s.phone);

  const createReq = fd.waitForRequest(
    (r) => r.method() === 'POST' && /\/reservations$/.test(new URL(r.url()).pathname),
  );
  await d.getByRole('button', { name: t('booking.create'), exact: true }).click();
  const req = await createReq;
  const sentBody = req.postDataJSON() as Record<string, unknown>;
  expect(
    sentBody.websiteBookingRequestId,
    'gửi createReservation.websiteBookingRequestId',
  ).toBeTruthy();
  await expect(fd).toHaveURL(/\/reservations\//, { timeout: 15_000 });
  await expect(
    fd.getByText(t('webreq.converted_toast').replace('{code}', s.refCode)).first(),
  ).toBeVisible();

  const row = requestRow(s.refCode);
  expect(row.status).toBe('converted');
  expect(row.reservation).toBeTruthy();
  expect(row.guest_name, 'C2 xóa khi converted').toBeNull();
  expect(row.phone).toBeNull();
  expect(row.note).toBeNull();
  expect(row.contact_hmac).toBeNull();
  const src = sql1(
    `SELECT c.channel_group || '/' || coalesce(r.direct_source, '') FROM reservation r JOIN channel c ON c.id = r.channel_id
      WHERE r.id = '${row.reservation}'`,
  );
  expect(src).toBe('direct/website');
  expect(c2Copies([s.name, s.phone.slice(1), 'Late arrival around 21:00'])).toEqual([]);
  await fd.context().close();
});

test('TC-WR-012 "Tạo đơn" từ yêu cầu: đổi Nguồn khác Website → server từ chối, không tạo đơn, yêu cầu giữ nguyên (AC2 – BR-112 (a))', async ({
  page,
  browser,
}) => {
  resetPublicCounters();
  const phone = fakeMobile();
  const arrival = addDays(today, 80 + Math.floor(Math.random() * 15));
  const refCode = await sendLanding(page, {
    name: 'Qa Eta',
    phone: intl(phone),
    arrival,
    // 3 nights: a 1-night stay can hit a minimum-stay date (H09 blocks it before sending – not this case's subject).
    departure: addDays(arrival, 3),
  });
  const fd = await desk(browser, 'qa.fd');
  const drawer = await openRequest(fd, refCode);
  await drawer.getByRole('button', { name: t('webreq.claim') }).click();
  await expect(drawer).toContainText(t('webreq.you'), { timeout: 10_000 });
  await drawer.getByRole('button', { name: t('webreq.create_booking') }).click();
  const d = fd
    .getByRole('dialog')
    .filter({ hasText: t('webreq.booking_hint').slice(0, 30) })
    .first();
  const source = d.getByRole('combobox', { name: t('bk.source') });
  await expect(source).toHaveValue('website');
  const editable = await source.isEnabled();
  test.info().annotations.push({
    type: 'observation',
    description: `Ô Nguồn trong H09 từ yêu cầu website: ${editable ? 'SỬA ĐƯỢC (BUG-R3-011)' : 'khóa'}`,
  });
  test.skip(!editable, 'ô Nguồn đã khóa – không còn đường đổi nguồn');
  await source.selectOption('zalo_phone');
  const roomSel = d.getByRole('combobox', { name: t('booking.field.room'), exact: true });
  await expect
    .poll(async () =>
      (await roomSel.locator('option').allTextContents()).some((o) => /^\d{3}\b/.test(o.trim())),
    )
    .toBe(true);
  const label = (await roomSel.locator('option').allTextContents()).find((o) =>
    /^\d{3}\b/.test(o.trim()),
  )!;
  await roomSel.selectOption({ label });
  await d.getByRole('combobox', { name: t('booking.field.guest') }).fill('Qa Eta');
  await fd.getByRole('option', { name: /Tạo nhanh/ }).click();
  const g = fd.getByRole('dialog', { name: 'Hồ sơ khách mới' });
  const gPhone = g.getByRole('textbox', { name: 'Số điện thoại / Zalo' });
  if (!(await gPhone.inputValue())) await gPhone.fill(phone);
  await g.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(g).toBeHidden();
  const answer = fd.waitForResponse(
    (r) => r.request().method() === 'POST' && /\/reservations$/.test(new URL(r.url()).pathname),
  );
  await d.getByRole('button', { name: t('booking.create'), exact: true }).click();
  const res = await answer;
  expect(res.status(), 'server không nhận nguồn khác website cho đơn từ yêu cầu').toBe(422);
  expect(await res.text()).toContain('directSource');
  await expect(d).toBeVisible();
  await fd.waitForTimeout(500);
  const shown = (await d.locator('.field-error, [role="alert"], .alert').allInnerTexts())
    .map((x) => x.trim())
    .filter(Boolean);
  test.info().annotations.push({
    type: 'observation',
    description: `H09 sau 422: ${JSON.stringify(shown)}`,
  });
  console.log('[QA] H09 after 422:', JSON.stringify(shown));
  await d.getByRole('combobox', { name: t('bk.source') }).scrollIntoViewIfNeeded();
  await fd.screenshot({ path: test.info().outputPath('h09-source-changed.png') });
  const row = requestRow(refCode);
  expect(row.status).toBe('in_progress');
  expect(row.reservation).toBeNull();
  await fd.context().close();
});

test('TC-WR-004 xóa theo yêu cầu người gửi (WR8): SAL không thấy liên hệ; FD không có nút; FDL sai liên hệ → CONTACT_MISMATCH, đúng → xóa ngay, không mở lại', async ({
  page,
  browser,
}) => {
  resetPublicCounters();
  const phone = fakeMobile();
  const name = 'Qa Khach Beta';
  const note = 'Cho minh hoi phong gia dinh qa-beta-note';
  const arrival = addDays(today, 100 + Math.floor(Math.random() * 20));
  const refCode = await sendLanding(page, {
    lang: 'vi',
    name,
    phone: intl(phone),
    note,
    arrival,
    departure: addDays(arrival, 3),
  });

  // SAL: a new, unassigned request is listed without name / phone (SEC ARC-12, rbac note 42).
  const sal = await desk(browser, 'qa.sal');
  const salDrawer = await openRequest(sal, refCode);
  await expect(salDrawer).toContainText(t('webreq.pii_hidden_sal'));
  await expect(salDrawer).not.toContainText(name);
  await expect(salDrawer).not.toContainText(note);
  await expect(salDrawer.getByRole('button', { name: t('webreq.erase') })).toHaveCount(0);
  await sal.context().close();

  // FD: sees the contact, but no erase (OWN/MGR/FDL only – ARC-16).
  const fd = await desk(browser, 'qa.fd');
  const fdDrawer = await openRequest(fd, refCode);
  await expect(fdDrawer).toContainText(name);
  await expect(fdDrawer.getByRole('button', { name: t('webreq.erase') })).toHaveCount(0);
  await fd.context().close();

  const fdl = await desk(browser, 'qa.fdl');
  const drawer = await openRequest(fdl, refCode);
  await drawer.getByRole('button', { name: t('webreq.erase') }).click();
  const dlg = fdl
    .getByRole('dialog')
    .filter({ hasText: t('webreq.erase_how') })
    .first();
  await dlg.getByLabel(t('webreq.erase.same_contact')).check();
  await dlg.getByRole('textbox', { name: t('webreq.erase_contact') }).fill('0900000001');
  await dlg.getByRole('button', { name: t('webreq.erase_confirm') }).click();
  await expect(dlg).toContainText(t('field.CONTACT_MISMATCH'), { timeout: 10_000 });
  expect(requestRow(refCode).guest_name, 'sai liên hệ → chưa xóa').toBe(name);

  await dlg.getByRole('textbox', { name: t('webreq.erase_contact') }).fill(phone);
  await dlg.getByRole('button', { name: t('webreq.erase_confirm') }).click();
  await expect(
    fdl.getByText(t('webreq.erased_toast').replace('{code}', refCode)).first(),
  ).toBeVisible({ timeout: 10_000 });
  const row = requestRow(refCode);
  expect(row.status).toBe('declined');
  expect(row.decline_reason).toBe('erased_on_request');
  for (const k of ['guest_name', 'phone', 'email', 'note', 'contact_hmac', 'ip_hmac'])
    expect(row[k], `${k} rỗng ngay sau WR8`).toBeNull();
  await expect(drawer.getByRole('button', { name: t('webreq.reopen') })).toHaveCount(0);
  expect(c2Copies([name, phone.slice(1), note])).toEqual([]);
  await fdl.context().close();
});

test('TC-WR-005 SEC B.2.1 tên/lời nhắn độc hại hiển thị nguyên chữ, không tạo link, không chạy script; nhãn cảnh báo URL', async ({
  page,
  browser,
  request,
}) => {
  resetPublicCounters();
  const evilName = '<img src=x onerror=alert(1)>';
  const evilNote = 'Click https://evil.example/login';
  const phone = fakeMobile();
  const arrival = addDays(today, 60 + Math.floor(Math.random() * 20));
  const res = await rawPublicPost(
    page,
    rawBody({
      name: evilName,
      phone: intl(phone),
      note: evilNote,
      arrival,
      departure: addDays(arrival, 1),
    }),
  );
  expect(res.status, res.text).toBe(202);
  const refCode = (JSON.parse(res.text) as { refCode: string }).refCode;
  expect(res.text, 'phản hồi công khai không lặp dữ liệu khách').not.toContain('evil.example');
  const row = requestRow(refCode);
  expect(row.guest_name).toBe(evilName);

  const fd = await desk(browser, 'qa.fd');
  const dialogs: string[] = [];
  fd.on('dialog', (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  await openQueue(fd);
  const listRow = fd.getByRole('row').filter({ hasText: refCode }).first();
  await expect(listRow).toContainText(t('webreq.flag.contains_url'));
  const drawer = await openRequest(fd, refCode);
  await expect(drawer).toContainText(evilName);
  await expect(drawer).toContainText(evilNote);
  await expect(drawer.getByText(t('webreq.flag.contains_url')).first()).toBeVisible();
  // Never markup, never a link.
  expect(await fd.locator('img[src="x"]').count(), 'không có thẻ <img> từ tên khách').toBe(0);
  expect(
    await fd.locator('a[href*="evil.example"]').count(),
    'không có link tới URL trong lời nhắn',
  ).toBe(0);
  await drawer.getByRole('button', { name: t('webreq.claim') }).click();
  await expect(drawer).toContainText(t('webreq.you'), { timeout: 10_000 });
  await fd.waitForTimeout(1_000);
  expect(dialogs, 'không có alert() chạy').toEqual([]);

  // Notifications + "Cần chú ý" never carry the name / note (C-12 c).
  const s = await session(request, 'qa.fd');
  const notif = await call(request, 'GET', '/v1/me/notifications', { session: s });
  expect(notif.status).toBe(200);
  expect(JSON.stringify(notif.body)).not.toContain('evil.example');
  expect(JSON.stringify(notif.body)).not.toContain('onerror');
  const attn = await call(request, 'GET', `/v1/properties/${propertyIdOf(s)}/attention-items`, {
    session: s,
  });
  expect(JSON.stringify(attn.body)).not.toContain('onerror');
  await fd.context().close();
});

test('TC-WR-006 SEC B.2.2 U+202E trong tên bị bỏ trước khi lưu và không hiện trên Desk', async ({
  page,
  browser,
}) => {
  resetPublicCounters();
  const phone = fakeMobile();
  const arrival = addDays(today, 40 + Math.floor(Math.random() * 15));
  const res = await rawPublicPost(
    page,
    rawBody({
      name: 'Qa ‮atled Gamma',
      phone: intl(phone),
      arrival,
      departure: addDays(arrival, 2),
    }),
  );
  expect(res.status, res.text).toBe(202);
  const refCode = (JSON.parse(res.text) as { refCode: string }).refCode;
  const stored = sql1(
    `SELECT position(E'\\u202E' in guest_name) || '|' || guest_name FROM website_booking_request WHERE ref_code = '${refCode}'`,
  );
  expect(stored.split('|')[0], `guest_name đã lưu: ${JSON.stringify(stored)}`).toBe('0');
  const fd = await desk(browser, 'qa.fd');
  const drawer = await openRequest(fd, refCode);
  const text = await drawer.innerText();
  expect(text.includes('‮'), 'Desk không hiện U+202E').toBe(false);
  await fd.context().close();
});

test('TC-WR-007 SEC B.2.3 số CCCD trong lời nhắn → 422 ID_NUMBER_DETECTED tại ô, không lưu, không lặp số, không lọt log', async ({
  page,
}) => {
  resetPublicCounters();
  const before = sql1(`SELECT count(*) FROM website_booking_request`);
  const arrival = addDays(today, 30 + Math.floor(Math.random() * 10));
  const note = `My ID is ${FAKE_CCCD}, please check`;
  await fillLanding(page, {
    name: 'Qa Delta',
    phone: intl(fakeMobile()),
    note,
    arrival,
    departure: addDays(arrival, 1),
  });
  await page.waitForTimeout(3_500);
  const answer = page.waitForResponse((r) => r.url().includes('/booking-requests'));
  await page.locator('#bk-submit').click();
  const res = await answer;
  expect(res.status()).toBe(422);
  const body = await res.text();
  expect(body).toContain('ID_NUMBER_DETECTED');
  expect(body, 'lỗi không lặp lại giá trị').not.toContain(FAKE_CCCD);
  await expect(page.locator('#f-note-err')).toContainText('No need to send ID numbers');
  await expect(page.locator('#bk-done')).toBeHidden();
  // AC11: the guest's text stays in the form.
  await expect(page.locator('#f-note')).toHaveValue(note);
  expect(sql1(`SELECT count(*) FROM website_booking_request`), 'không lưu yêu cầu').toBe(before);

  const logs = stackLogs();
  expect(logs.includes(FAKE_CCCD), 'log api/worker/postgres/Caddy không có số CCCD').toBe(false);
  expect(
    sql1(`SELECT count(*) FROM idempotency_key WHERE response_body::text LIKE '%${FAKE_CCCD}%'`),
  ).toBe('0');
});

test('TC-WR-010 BUG-R3-009 số CCCD viết có dấu cách / gạch / chấm trong lời nhắn cũng bị từ chối (US-155 AC5)', async ({
  page,
}) => {
  knownBug('BUG-R3-009');
  const arrival = addDays(today, 25);
  for (const shown of [
    FAKE_CCCD.replace(/(\d{3})(?=\d)/g, '$1 '),
    FAKE_CCCD.replace(/(\d{3})(?=\d)/g, '$1-'),
    FAKE_CCCD.replace(/(\d{3})(?=\d)/g, '$1.'),
  ]) {
    resetPublicCounters();
    const res = await rawPublicPost(
      page,
      rawBody({
        name: 'Qa Zeta',
        phone: intl(fakeMobile()),
        note: `CCCD cua toi ${shown}`,
        arrival,
        departure: addDays(arrival, 1),
      }),
    );
    expect(res.status, `"${shown}": ${res.text}`).toBe(422);
    expect(res.text).toContain('ID_NUMBER_DETECTED');
  }
});

test('TC-WR-008 BUG-R3-008 OWN tắt form ngay trong ngày đã bật → công tắc tắt, form token 404', async ({
  request,
  page,
}) => {
  knownBug('BUG-R3-008');
  const own = await session(request, 'qa.owner');
  const off = await setSwitch(request, own, false);
  expect(off.status, JSON.stringify(off.body)).toBeLessThan(300);
  await page.goto(`${LANDING}/`);
  const tok = await page.evaluate(
    async (slug) => (await fetch(`/v1/public/properties/${slug}/form-token`)).status,
    SLUG,
  );
  expect(tok).toBe(404);
});

test('TC-WR-009 công tắc tắt (ngày sau) → 404, landing hiện Zalo/gọi điện; Desk báo form tắt, yêu cầu cũ vẫn xem được', async ({
  page,
  browser,
  request,
}) => {
  // Harness: today's ON row removed (BUG-R3-008 – emulates "the next business day"), then OWN turns it off.
  clearSwitchRows();
  const own = await session(request, 'qa.owner');
  const off = await setSwitch(request, own, false);
  expect(off.status, JSON.stringify(off.body)).toBeLessThan(300);

  const seen = watchRequests(page);
  await fillLanding(page, {
    name: 'Qa Epsilon',
    phone: intl(fakeMobile()),
    arrival: addDays(today, 20),
    departure: addDays(today, 22),
  });
  const status = page.locator('#bk-status');
  await expect(status).toContainText('Online requests are paused right now', { timeout: 10_000 });
  await expect(status.locator('a[href^="tel:"]')).toHaveCount(1);
  await expect(status.locator('a', { hasText: 'Zalo' })).toHaveCount(1);
  await page.locator('#bk-submit').click();
  await expect(status).toContainText('Online requests are paused right now');
  await expect(page.locator('#bk-done')).toBeHidden();
  expect(
    seen.all.filter((x) => x.startsWith('POST')),
    'không POST khi form tắt',
  ).toEqual([]);

  // A POST with any token → 404 like an unknown property.
  const post = await page.evaluate(async (slug) => {
    const r = await fetch(`/v1/public/properties/${slug}/booking-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
      body: JSON.stringify({ formToken: 'x' }),
    });
    return r.status;
  }, SLUG);
  expect(post).toBe(404);

  const mgr = await desk(browser, 'qa.mgr');
  await openQueue(mgr);
  await expect(mgr.getByText(t('webreq.form_off_title')).first()).toBeVisible({ timeout: 10_000 });
  if (sent) {
    await mgr.getByRole('button', { name: t('webreq.status.converted') }).click();
    await expect(mgr.getByRole('row').filter({ hasText: sent.refCode }).first()).toBeVisible();
  }
  await mgr.context().close();
});

test('TC-WR-011 BUG-R3-010 lễ tân trưởng (FDL) cũng thấy dòng "Form đặt phòng trên website đang tắt" ở S35', async ({
  browser,
}) => {
  knownBug('BUG-R3-010');
  const fdl = await desk(browser, 'qa.fdl');
  await openQueue(fdl);
  await expect(fdl.getByText(t('webreq.form_off_title')).first()).toBeVisible({ timeout: 10_000 });
  await fdl.context().close();
});
