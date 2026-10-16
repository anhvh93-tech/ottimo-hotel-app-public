// TC-X-050c (test-cases/r1-main-flows.md): stop PostgreSQL → /health 503 db down (api and through Caddy);
// start again → 200. Project "db-outage" (playwright.config.ts) runs it LAST, after every project that talks
// to the database: stopping PostgreSQL while rbac/api cases run would turn them into 5xx reds.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test, type APIRequestContext } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://127.0.0.1:8081';
// Stopping a container is opt-in: only on a disposable local/CI stack, never on staging.
const COMPOSE_CONTROL = process.env.E2E_COMPOSE_CONTROL === '1';
const PRODUCT_DIR = fileURLToPath(new URL('../../../', import.meta.url));

async function health(request: APIRequestContext, url: string) {
  const res = await request.get(url, { failOnStatusCode: false });
  return {
    status: res.status(),
    body: (await res.json()) as { status: string; db: string; time: string },
  };
}

// Which stack to stop: default = the dev compose (CI's disposable stack). A disposable stack on other ports
// (QA, BUG-R2-013) MUST point these at its own files/project, or the dev PostgreSQL would be stopped.
const COMPOSE_FILE = process.env.E2E_COMPOSE_FILE ?? 'infra/docker-compose.yml';
const COMPOSE_ENV_FILE = process.env.E2E_COMPOSE_ENV_FILE ?? '.env';
const COMPOSE_PROJECT = process.env.E2E_COMPOSE_PROJECT;

function compose(...args: string[]) {
  execFileSync(
    'docker',
    [
      'compose',
      ...(COMPOSE_PROJECT ? ['-p', COMPOSE_PROJECT] : []),
      '--env-file',
      COMPOSE_ENV_FILE,
      '-f',
      COMPOSE_FILE,
      ...args,
    ],
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

test.describe('TC-X-050 health – mất cơ sở dữ liệu', { tag: ['@smoke'] }, () => {
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
