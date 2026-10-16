// TC-RB-018 (tầng A) – runner kiểm quyền từ fixtures/rbac-cases.json, phần operation Sprint 3 (sprint3-ops.ts):
// EP03–EP05 nhận phòng/lưu trú/trả phòng, EP15 tiền/VietQR/hoàn/minibar, EP06 giấy tờ C3/khai báo, US-106/107.
//   expected 2xx → cổng vai cho qua: không 401 UNAUTHENTICATED / 403 FORBIDDEN_ACTION / 5xx; 2xx hoặc `accept`
//   expected 403 → 403 FORBIDDEN_ACTION (thao tác cần thiết bị được cấp gửi kèm cookie thiết bị – vẫn phải 403 vai)
//   expected 401 → sai loại phiên: cookie khách trên operation nhân viên, cookie nhân viên trên operation khách
//                  (gửi từ Origin guest-web để câu trả lời là kiểm phiên, không phải kiểm Origin)
// Operation không đăng ký ở R2 theo quyết định (ĐK-1, mã cửa US-128 dời R3) → mọi chủ thể 404.
// Endpoint chưa có trên build (ngoài danh sách trên) → skipped "pending".
import { request as httpRequest } from 'node:http';
import { expect, test } from '@playwright/test';
import {
  call,
  fakeGuestCookie,
  fillPath,
  isAvailable,
  needSeedPassword,
  sessionOrSkip,
  type Problem,
  type StaffSession,
} from '../support/api.js';
import { API_URL, GUEST_ORIGIN, SESSION_COOKIE } from '../support/env.js';
import { dev, deviceToken } from '../support/s3.js';
import { SPRINT3_CASES } from './cases.js';
import { cleanupFixtures3, fixtures3, SPRINT3_OPS } from './sprint3-ops.js';

test.describe.configure({ mode: 'parallel' });
test.afterAll(async ({ request }) => cleanupFixtures3(request));

/** Status code of an SSE GET without reading the (open-ended) body. */
function sseStatus(path: string, cookie: string): Promise<{ status: number; type: string }> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      `${API_URL}${path}`,
      { method: 'GET', headers: { cookie, accept: 'text/event-stream' } },
      (res) => {
        resolve({ status: res.statusCode ?? 0, type: String(res.headers['content-type'] ?? '') });
        req.destroy();
      },
    );
    req.on('error', (e) => {
      if ((e as NodeJS.ErrnoException).code !== 'ECONNRESET') reject(e);
    });
    req.setTimeout(10_000, () =>
      req.destroy(new Error('SSE: không có dòng trạng thái sau 10 giây')),
    );
    req.end();
  });
}

test.describe('RBAC Sprint 3 – cổng vai (rbac-cases.json)', { tag: ['@rbac', '@sprint3'] }, () => {
  for (const c of SPRINT3_CASES) {
    const def = SPRINT3_OPS[c.operationId]!;
    const title = `${c.id} ${c.operationId} ${c.subject} → ${def.mode === 'absent' ? '404 (không có ở R2)' : c.expected}${c.scope ? ` [${c.scope}]` : ''}`;
    test(
      title,
      { annotation: [{ type: 'rbac', description: c.rbac.join(',') }] },
      async ({ request }) => {
        test.skip(c.sprint === 'R3', `R3: ${c.operationId} thuộc story Must R3 – pending`);
        needSeedPassword();
        const f = await fixtures3(request);
        const p = def.prepare(f);
        const path = fillPath(c.path, p.params);

        if (def.mode === 'absent') {
          // ĐK-1 / US-128: the route must NOT exist in R2, whoever calls it
          const s = c.subject === 'guest-session' ? null : await sessionOrSkip(request, c.subject);
          const r = await call(request, c.method, path, {
            ...(s ? { session: s } : { cookie: f.guestCookie ?? fakeGuestCookie() }),
            ...(c.method !== 'GET' ? { body: p.body ?? {} } : {}),
            idempotencyKey: c.method !== 'GET',
          });
          test.info().annotations.push({ type: 'note', description: p.note ?? '' });
          expect(r.status, `${c.method} ${c.path} (${p.note}): HTTP ${r.status}`).toBe(404);
          return;
        }

        test.skip(
          !(await isAvailable(request, c.method, c.path)),
          `pending: ${c.operationId} chưa có trên build`,
        );
        const isGuestOp = def.mode === 'guest'; // x-roles [guest] (c.roles = roles of the SUBJECT)
        const guestSubject = c.subject === 'guest-session';
        let s: StaffSession | null = null;
        if (!guestSubject) s = await sessionOrSkip(request, c.subject);

        if (def.mode === 'sse') {
          const cookie = s ? `${SESSION_COOKIE}=${s.token}` : fakeGuestCookie();
          const r = await sseStatus(path, cookie);
          test.info().annotations.push({ type: 'actual', description: `${r.status} ${r.type}` });
          if (c.expected === '401') expect(r.status).toBe(401);
          else if (c.expected === '403') expect(r.status).toBe(403);
          else {
            expect(r.status, `SSE ${c.subject}`).toBe(200);
            expect(r.type).toContain('text/event-stream');
          }
          return;
        }

        let cookie: string | undefined;
        let headers: Record<string, string> | undefined;
        let csrf: boolean | undefined;
        if (isGuestOp) {
          if (guestSubject) {
            test.skip(
              !f.guestCookie,
              `môi trường: không mở được phiên khách cho fixture (${f.why})`,
            );
            cookie = f.guestCookie!;
          } else {
            cookie = `${SESSION_COOKIE}=${s!.token}`; // staff cookie on a guest operation
          }
          if (c.method !== 'GET') headers = { origin: GUEST_ORIGIN };
          csrf = false;
        } else if (guestSubject) {
          cookie = f.guestCookie ?? fakeGuestCookie(); // guest cookie on a staff operation
        } else if (def.device) {
          test.skip(!deviceToken(), 'môi trường: thiếu token thiết bị được cấp (seed .out)');
          cookie = dev(s!).cookie;
        }
        const r = await call<Problem>(request, c.method, path, {
          ...(s && !isGuestOp ? { session: s } : {}),
          ...(cookie ? { cookie } : {}),
          ...(headers ? { headers } : {}),
          ...(csrf === false ? { csrf } : {}),
          ...(p.body !== undefined ? { body: p.body } : {}),
          ...(p.query ? { query: p.query } : {}),
          ...(p.idempotencyKey ? { idempotencyKey: true } : {}),
          ...(p.ifMatch !== undefined ? { ifMatch: p.ifMatch } : {}),
        });
        const code = (r.body as Problem | undefined)?.code;
        test.info().annotations.push({
          type: 'actual',
          description: `${r.status}${code ? ` ${code}` : ''}`,
        });
        if (p.note) test.info().annotations.push({ type: 'note', description: p.note });
        const evidence = `${c.method} ${c.path} as ${c.subject}: HTTP ${r.status} ${JSON.stringify(r.body)?.slice(0, 300)}`;

        if (c.expected === '401') {
          expect(r.status, evidence).toBe(401);
          return;
        }
        if (c.expected === '403') {
          expect(r.status, evidence).toBe(403);
          expect(code, evidence).toBe('FORBIDDEN_ACTION');
          return;
        }
        expect(r.status >= 500, evidence).toBe(false);
        expect(r.status === 401 && code === 'UNAUTHENTICATED', evidence).toBe(false);
        expect(r.status === 403 && code === 'FORBIDDEN_ACTION', evidence).toBe(false);
        expect(r.status === 403 && code === 'DEVICE_NOT_TRUSTED', evidence).toBe(false);
        const ok = (r.status >= 200 && r.status < 300) || (p.accept ?? []).includes(r.status);
        expect(
          ok,
          `${evidence} (chấp nhận: 2xx${p.accept?.length ? `, ${p.accept.join(', ')}` : ''})`,
        ).toBe(true);
      },
    );
  }
});
