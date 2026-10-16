// TC-RB-018 (tầng A) – runner kiểm quyền tự động từ fixtures/rbac-cases.json (sinh bởi tools/gen_rbac_cases.py
// từ OpenAPI x-roles/x-scope × tài khoản DS-E). Phạm vi lượt này: operation Sprint 1 (sprint1-ops.ts).
//   expected 2xx → cổng vai cho qua: không 401 UNAUTHENTICATED / 403 FORBIDDEN_ACTION / 5xx; trạng thái
//                  là 2xx hoặc nằm trong `accept` của operation (body cố ý sai / id ngẫu nhiên)
//   expected 403 → 403 FORBIDDEN_ACTION
//   expected 401 → cookie khách (giả, đúng định dạng) trên operation nhân viên → 401 (SR-SES-09)
// Endpoint chưa có trên build → test skipped "pending" (không đỏ). Story R3 (2FA) → skipped "R3".
// Biến thể ngoài phạm vi (scope own → 404) chạy ở api/guests.api.spec.ts, không ở đây.
import { expect, test } from '@playwright/test';
import {
  call,
  fakeGuestCookie,
  fillPath,
  isAvailable,
  needSeedPassword,
  sessionOrSkip,
  type Problem,
} from '../support/api.js';
import { SPRINT1_CASES } from './cases.js';
import { fixtures, SPRINT1_OPS } from './sprint1-ops.js';

test.describe.configure({ mode: 'parallel' });

test.describe('RBAC Sprint 1 – cổng vai (rbac-cases.json)', { tag: ['@rbac'] }, () => {
  for (const c of SPRINT1_CASES.filter((x) => SPRINT1_OPS[x.operationId]!.mode !== 'logout')) {
    const def = SPRINT1_OPS[c.operationId]!;
    const title = `${c.id} ${c.operationId} ${c.subject} → ${c.expected}${c.scope ? ` [${c.scope}]` : ''}`;
    test(
      title,
      { annotation: [{ type: 'rbac', description: c.rbac.join(',') }] },
      async ({ request }) => {
        test.skip(def.mode === 'r3', `R3: ${c.operationId} thuộc story Must R3 (2FA) – pending`);
        test.skip(
          !(await isAvailable(request, c.method, c.path)),
          `pending: ${c.operationId} chưa có trên build`,
        );
        needSeedPassword();
        const f = await fixtures(request);
        const s = c.expected === '401' ? null : await sessionOrSkip(request, c.subject);
        const p = await def.prepare(request, s, c.subject, f);
        const r = await call<Problem>(request, c.method, fillPath(c.path, p.params), {
          ...(s ? { session: s } : { cookie: fakeGuestCookie() }),
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
        // expected 2xx: the role gate must let the call through
        expect(r.status >= 500, evidence).toBe(false);
        expect(r.status === 401 && code === 'UNAUTHENTICATED', evidence).toBe(false);
        expect(r.status === 403 && code === 'FORBIDDEN_ACTION', evidence).toBe(false);
        const ok = (r.status >= 200 && r.status < 300) || (p.accept ?? []).includes(r.status);
        expect(
          ok,
          `${evidence} (chấp nhận: 2xx${p.accept?.length ? `, ${p.accept.join(', ')}` : ''})`,
        ).toBe(true);
      },
    );
  }
});
