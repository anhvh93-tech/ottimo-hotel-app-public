// TC-RB-018 (tầng A) – runner kiểm quyền từ fixtures/rbac-cases.json, phần operation Sprint 2 (sprint2-ops.ts):
// EP02 rack/đơn/chống trùng/OOO/no-show, EP11 báo giá/giữ chỗ/cọc/lead/hoa hồng, US-139 gán căn.
//   expected 2xx → cổng vai cho qua: không 401 UNAUTHENTICATED / 403 FORBIDDEN_ACTION / 5xx; trạng thái 2xx hoặc
//                  thuộc `accept` (id ngẫu nhiên → 404, body cố ý sai → 422/412)
//   expected 403 → 403 FORBIDDEN_ACTION
//   expected 401 → cookie khách giả trên operation nhân viên → 401 (SR-SES-09)
// Endpoint chưa có trên build → skipped "pending" (không đỏ). Biến thể phạm vi `own` (SAL/CTV xem đơn/báo giá người
// khác → 404) chạy ở api/quotes-holds.api.spec.ts (TC-L2-040, TC-L5-036).
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
import { SPRINT2_CASES } from './cases.js';
import { fixtures2, SPRINT2_OPS } from './sprint2-ops.js';

test.describe.configure({ mode: 'parallel' });

test.describe('RBAC Sprint 2 – cổng vai (rbac-cases.json)', { tag: ['@rbac', '@sprint2'] }, () => {
  for (const c of SPRINT2_CASES) {
    const def = SPRINT2_OPS[c.operationId]!;
    const title = `${c.id} ${c.operationId} ${c.subject} → ${c.expected}${c.scope ? ` [${c.scope}]` : ''}`;
    test(
      title,
      { annotation: [{ type: 'rbac', description: c.rbac.join(',') }] },
      async ({ request }) => {
        test.skip(c.sprint === 'R3', `R3: ${c.operationId} thuộc story Must R3 – pending`);
        test.skip(
          !(await isAvailable(request, c.method, c.path)),
          `pending: ${c.operationId} chưa có trên build`,
        );
        needSeedPassword();
        const f = await fixtures2(request);
        const s = c.expected === '401' ? null : await sessionOrSkip(request, c.subject);
        const p = def.prepare(f);
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
