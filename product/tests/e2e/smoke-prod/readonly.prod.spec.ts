// Production smoke – READ ONLY (QA-3; v1-gate-checklist G5-5; INV session B2 part 6). Project "smoke-prod".
// Run after a production deploy, from outside the server (the Internet path real users take):
//   E2E_PROD_SMOKE=1 E2E_API_URL=https://desk.ottimo.vn E2E_WEB_URL=https://desk.ottimo.vn \
//   E2E_STAFF_URL=https://staff.ottimo.vn E2E_GUEST_ORIGIN=https://g.ottimo.vn E2E_ORIGIN=https://desk.ottimo.vn \
//   E2E_COOKIE_SECURE_PREFIX=true playwright test -c e2e/playwright.config.ts --project=smoke-prod --no-deps
// What it does NOT do: no booking, no payment, no parameter, no qa.* account (global-setup skips), no /__test__ call
// beyond checking it is closed. Every request is GET/HEAD, except PS-06 (optional): ONE login (+ 2FA step) and its
// logout for a smoke account the person running it supplies – E2E_SMOKE_USER + E2E_SMOKE_PASSWORD (or
// E2E_SMOKE_PASSWORD_FILE, a file outside the repo) + E2E_TOTP_DIR for its TOTP. That writes only the session and the
// login audit lines, like any sign-in. Without E2E_SMOKE_USER, PS-06 skips.
// Expected headers = infra/caddy/expected-headers.sh (exact values; whoever changes Caddyfile.prod changes both).
// E2E_PROD_SMOKE_LOCAL=1 relaxes what a dev stack cannot have (HTTPS-only headers, /health and /__test__ closed) – only
// to try the spec itself on a disposable stack.
import { readFileSync } from 'node:fs';
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import {
  ORIGIN,
  SESSION_COOKIE,
  WEB_URL,
  GUEST_ORIGIN,
  STAFF_URL,
  API_URL,
} from '../support/env.js';
import { hasTotpSecret, nextTotpCode } from '../support/totp-store.js';

const ON = process.env.E2E_PROD_SMOKE === '1';
const LOCAL = process.env.E2E_PROD_SMOKE_LOCAL === '1';
const HTTPS = WEB_URL.startsWith('https://');

const CSP = (worker: string) =>
  `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src ${worker}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'`;
const SITES = [
  { name: 'desk', url: WEB_URL, referrer: 'same-origin', worker: "'none'", cache: 'no-cache' },
  { name: 'staff', url: STAFF_URL, referrer: 'same-origin', worker: "'self'", cache: 'no-cache' },
  {
    name: 'guest',
    url: GUEST_ORIGIN,
    referrer: 'no-referrer',
    worker: "'none'",
    cache: 'no-store',
  },
] as const;

async function get(request: APIRequestContext, url: string, cookie?: string): Promise<APIResponse> {
  return request.get(url, {
    failOnStatusCode: false,
    maxRedirects: 0,
    headers: cookie ? { cookie } : {},
  });
}

test.describe('Smoke production – chỉ đọc (G5-5)', { tag: ['@smoke-prod'] }, () => {
  test.skip(!ON, 'Chỉ chạy khi E2E_PROD_SMOKE=1 (sau deploy production)');

  for (const site of SITES) {
    test(`PS-01 ${site.name}: trang mở được (200) và đủ header bảo mật đúng giá trị (SR-HDR-01/02)`, async ({
      request,
    }) => {
      const r = await get(request, `${site.url}/`);
      expect(r.status(), `${site.name} /`).toBe(200);
      expect(r.headers()['content-type'] ?? '').toContain('text/html');
      const h = r.headers();
      if (!HTTPS) {
        test
          .info()
          .annotations.push({ type: 'local', description: 'HTTP – bỏ qua header chỉ có ở HTTPS' });
        return;
      }
      expect(h['content-security-policy'], `${site.name} CSP`).toBe(CSP(site.worker));
      expect(h['strict-transport-security'], `${site.name} HSTS`).toBe(
        'max-age=31536000; includeSubDomains',
      );
      expect(h['referrer-policy'], `${site.name} Referrer-Policy`).toBe(site.referrer);
      expect(h['x-content-type-options']).toBe('nosniff');
      expect(h['x-frame-options']).toBe('DENY');
      expect(h['permissions-policy']).toBe(
        'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()',
      );
      expect(h['cross-origin-opener-policy']).toBe('same-origin');
      expect(h['cache-control'] ?? '', `${site.name} Cache-Control index`).toContain(site.cache);
      expect(h['server'] ?? '', 'không lộ phiên bản máy chủ').not.toMatch(/\d+\.\d+/);
    });
  }

  test('PS-02 /health và /__test__ đóng từ Internet (FB-R1-SEC-OPS-12, ADR-008)', async ({
    request,
  }) => {
    const health = await get(request, `${WEB_URL}/health`);
    const testSurface = await get(request, `${WEB_URL}/__test__/clock`);
    if (LOCAL) {
      test.info().annotations.push({
        type: 'local',
        description: `stack dev: /health ${health.status()}, /__test__/clock ${testSurface.status()} – không kiểm`,
      });
      return;
    }
    expect(health.status(), '/health từ Internet').toBe(404);
    expect(testSurface.status(), '/__test__/* từ Internet').toBe(404);
  });

  test('PS-03 API không phiên → 401, không lộ dữ liệu', async ({ request }) => {
    for (const path of ['/v1/me', '/v1/users']) {
      const r = await get(request, `${API_URL}${path}`);
      expect(r.status(), path).toBe(401);
      expect(await r.text(), path).not.toMatch(/"(username|phone|email)"\s*:/);
    }
  });

  test('PS-04 Desk: màn đăng nhập OTTIMO hiện, tải trang không gửi request ghi nào', async ({
    page,
  }) => {
    const writes: string[] = [];
    page.on('request', (q) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(q.method()))
        writes.push(`${q.method()} ${new URL(q.url()).pathname}`);
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(WEB_URL);
    await expect(page.getByRole('button', { name: /Đăng nhập|Sign in/ })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/OTTIMO/).first()).toBeVisible();
    expect(writes, 'không request ghi khi chỉ mở trang').toEqual([]);
    expect(errors, 'không lỗi JS').toEqual([]);
  });

  test('PS-05 PWA nhân viên và trang khách mở được trong trình duyệt', async ({ page }) => {
    for (const url of [STAFF_URL, GUEST_ORIGIN]) {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const r = await page.goto(url);
      expect(r?.status(), url).toBeLessThan(400);
      await expect(page.locator('body')).not.toBeEmpty();
      expect(errors, `${url}: không lỗi JS`).toEqual([]);
    }
  });

  test('PS-06 (tùy chọn) đăng nhập tài khoản smoke (+ bước 2FA) → đọc /v1/me, danh mục căn → đăng xuất', async ({
    request,
  }) => {
    const user = process.env.E2E_SMOKE_USER;
    test.skip(!user, 'Không có E2E_SMOKE_USER – bỏ qua phần đăng nhập');
    const password =
      process.env.E2E_SMOKE_PASSWORD ??
      (process.env.E2E_SMOKE_PASSWORD_FILE
        ? readFileSync(process.env.E2E_SMOKE_PASSWORD_FILE, 'utf8').trim()
        : '');
    expect(password, 'E2E_SMOKE_PASSWORD hoặc E2E_SMOKE_PASSWORD_FILE').toBeTruthy();
    let r = await request.post(`${API_URL}/v1/auth/login`, {
      failOnStatusCode: false,
      headers: { origin: ORIGIN },
      data: { username: user, password },
    });
    let body = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (r.status() === 401 && body.code === 'MFA_REQUIRED') {
      expect(hasTotpSecret(user!), `${user} có 2FA – cần ${user}.secret trong E2E_TOTP_DIR`).toBe(
        true,
      );
      r = await request.post(`${API_URL}/v1/auth/login/mfa`, {
        failOnStatusCode: false,
        headers: { origin: ORIGIN },
        data: { mfaToken: body.mfaToken, totpCode: await nextTotpCode(user!) },
      });
      body = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    }
    expect(r.status(), `đăng nhập ${user}: ${String(body.code ?? '')}`).toBe(200);
    const setCookie = r
      .headersArray()
      .filter((x) => x.name.toLowerCase() === 'set-cookie')
      .map((x) => x.value)
      .find((v) => v.startsWith(`${SESSION_COOKIE}=`));
    expect(setCookie, `cookie ${SESSION_COOKIE}`).toBeTruthy();
    if (HTTPS) {
      expect(SESSION_COOKIE.startsWith('__Host-'), 'cookie tiền tố __Host-').toBe(true);
      expect(setCookie!).toMatch(/;\s*Secure/i);
    }
    expect(setCookie!).toMatch(/;\s*HttpOnly/i);
    expect(setCookie!).toMatch(/;\s*SameSite=(Lax|Strict)/i);
    const cookie = setCookie!.split(';')[0]!;
    const me = await get(request, `${API_URL}/v1/me`, cookie);
    expect(me.status()).toBe(200);
    const m = (await me.json()) as {
      mfaEnrollmentRequired?: boolean;
      mfaEnabled?: boolean;
      csrfToken?: string;
      activePropertyId?: string;
      properties: Array<{ propertyId: string; roles?: string[]; role?: string }>;
    };
    expect(m.mfaEnrollmentRequired ?? false, 'phiên đầy đủ, không phải phiên chỉ-đăng-ký').toBe(
      false,
    );
    const roles = m.properties.flatMap((p) => p.roles ?? (p.role ? [p.role] : []));
    if (roles.some((x) => x === 'owner' || x === 'manager'))
      expect(m.mfaEnabled, 'OWN/MGR trên production phải có 2FA (MFA_ENFORCED=true)').toBe(true);
    const pid = m.activePropertyId ?? m.properties[0]!.propertyId;
    const rooms = await get(request, `${API_URL}/v1/properties/${pid}/rooms`, cookie);
    test.info().annotations.push({ type: 'rooms', description: `GET rooms → ${rooms.status()}` });
    expect([200, 403], 'danh mục căn: đọc được hoặc bị chặn theo vai (không 5xx)').toContain(
      rooms.status(),
    );
    const out = await request.post(`${API_URL}/v1/auth/logout`, {
      failOnStatusCode: false,
      headers: { origin: ORIGIN, cookie, 'x-csrf-token': m.csrfToken ?? '' },
    });
    expect(out.status(), 'đăng xuất').toBeLessThan(300);
    expect((await get(request, `${API_URL}/v1/me`, cookie)).status(), 'phiên đã thu hồi').toBe(401);
  });
});
