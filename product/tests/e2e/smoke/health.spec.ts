// TC-X-050 (test-cases/r1-main-flows.md): `pnpm dev` + GET /health on the api and through Caddy;
// stop PostgreSQL → 503, start again → 200. Contract: docs/api/openapi.yaml getHealth.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test, type APIRequestContext } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://127.0.0.1:8081';
// Stopping a container is opt-in: only on a disposable local/CI stack, never on staging.
const COMPOSE_CONTROL = process.env.E2E_COMPOSE_CONTROL === '1';
const PRODUCT_DIR = fileURLToPath(new URL('../../../', import.meta.url));
const TIME_VN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?\+07:00$/;

async function health(request: APIRequestContext, url: string) {
  const res = await request.get(url, { failOnStatusCode: false });
  return {
    status: res.status(),
    body: (await res.json()) as { status: string; db: string; time: string },
  };
}

function compose(...args: string[]) {
  execFileSync(
    'docker',
    ['compose', '--env-file', '.env', '-f', 'infra/docker-compose.yml', ...args],
    {
      cwd: PRODUCT_DIR,
      stdio: 'pipe',
    },
  );
}

async function waitForStatus(
  request: APIRequestContext,
  url: string,
  want: number,
  timeoutMs = 60_000,
) {
  await expect
    .poll(async () => (await health(request, url)).status, {
      timeout: timeoutMs,
      intervals: [500, 1000, 2000],
    })
    .toBe(want);
}

test.describe('TC-X-050 health', { tag: ['@smoke'] }, () => {
  test('TC-X-050a api /health → 200 {status: ok, db: ok, time +07:00}', async ({ request }) => {
    const { status, body } = await health(request, '/health');
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.time).toMatch(TIME_VN);
  });

  test('TC-X-050b /health qua Caddy (web) → 200 db ok', async ({ request }) => {
    const { status, body } = await health(request, `${WEB_URL}/health`);
    expect(status).toBe(200);
    expect(body).toMatchObject({ status: 'ok', db: 'ok' });
  });

  test('TC-X-050c dừng PostgreSQL → 503 db down; bật lại → 200', async ({ request }) => {
    test.skip(
      !COMPOSE_CONTROL,
      'Cần E2E_COMPOSE_CONTROL=1 (chỉ chạy trên stack compose dùng một lần)',
    );
    test.setTimeout(180_000);
    compose('stop', 'postgres');
    try {
      await waitForStatus(request, '/health', 503);
      const down = await health(request, '/health');
      expect(down.body).toMatchObject({ status: 'error', db: 'down' });
      expect((await health(request, `${WEB_URL}/health`)).status).toBe(503);
    } finally {
      compose('start', 'postgres');
    }
    await waitForStatus(request, '/health', 200, 120_000);
  });
});
