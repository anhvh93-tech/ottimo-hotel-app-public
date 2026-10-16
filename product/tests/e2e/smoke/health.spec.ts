// TC-X-050a/b (test-cases/r1-main-flows.md): `pnpm dev` + GET /health on the api and through Caddy.
// Contract: docs/api/openapi.yaml getHealth. TC-X-050c (stop PostgreSQL) → outage/db-outage.spec.ts.
import { expect, test, type APIRequestContext } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://127.0.0.1:8081';
const TIME_VN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?\+07:00$/;

async function health(request: APIRequestContext, url: string) {
  const res = await request.get(url, { failOnStatusCode: false });
  return {
    status: res.status(),
    body: (await res.json()) as { status: string; db: string; time: string },
  };
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
  // TC-X-050c (stop PostgreSQL) lives in outage/db-outage.spec.ts – project "db-outage", run last.
});
