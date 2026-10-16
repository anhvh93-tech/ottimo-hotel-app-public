// E2E API – nhật ký (US-006, US-002 AC2) và phê duyệt (US-007, SM-10). TC: r1-main-flows.md mục 1.
// Sprint 1 has no source of approval requests yet (FOC comes with folio – Sprint 2–3): the self-approval
// cases are written against the contract and skip until requestFoc exists.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  isAvailable,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  uuid,
  type StaffSession,
} from '../support/api.js';
import { SEED_PASSWORD } from '../support/env.js';

const AUDIT: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/audit-events',
  'listAuditEvents',
];
const USERS: [string, string, string] = ['GET', '/v1/users', 'listUsers'];
const APPROVALS: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/approval-requests',
  'listApprovalRequests',
];
const APPROVE: [string, string, string] = [
  'POST',
  '/v1/properties/{propertyId}/approval-requests/{approvalId}/actions/approve',
  'approveRequest',
];
const REJECT: [string, string, string] = [
  'POST',
  '/v1/properties/{propertyId}/approval-requests/{approvalId}/actions/reject',
  'rejectRequest',
];
const FOC: [string, string, string] = [
  'POST',
  '/v1/properties/{propertyId}/folios/{folioId}/lines/{lineId}/foc',
  'requestFoc',
];

type Row = Record<string, unknown>;

function rows(body: unknown): Row[] {
  if (Array.isArray(body)) return body as Row[];
  return ((body as { data?: Row[] })?.data ?? []) as Row[];
}

function actorOf(e: Row): unknown {
  return (
    e.actorUserId ??
    e.actorId ??
    e.userId ??
    (e.actor as Row | undefined)?.id ??
    (e.actor as Row | undefined)?.userId
  );
}

async function audit(
  ctx: APIRequestContext,
  s: StaffSession,
  query: Record<string, string | number>,
) {
  return call(ctx, 'GET', `/v1/properties/${propertyIdOf(s)}/audit-events`, {
    session: s,
    query: { limit: 100, ...query },
  });
}

test.describe('L1 – nhật ký thao tác (US-006, US-002 AC2)', { tag: ['@api', '@sprint1'] }, () => {
  test.beforeEach(() => needSeedPassword());

  test('TC-NT-008 (biến thể Sprint 1) lần bị từ chối quyền có audit access.denied, owner xem được', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-008', [USERS, AUDIT]);
    test.info().annotations.push({
      type: 'note',
      description:
        'Sprint 1 dùng listUsers thay createReservation (chờ Sprint 2) – phần đơn đặt phòng vẫn pending ở smoke-manifest',
    });
    const hk = await sessionOrSkip(request, 'qa.hk');
    const owner = await sessionOrSkip(request, 'qa.owner');
    expectProblem(
      await call(request, 'GET', '/v1/users', { session: hk }),
      403,
      'FORBIDDEN_ACTION',
    );
    const r = await audit(request, owner, { category: 'access', actorUserId: hk.me.id });
    expect(r.status).toBe(200);
    const hit = rows(r.body).find((e) => JSON.stringify(e).includes('listUsers'));
    expect(hit, 'có dòng access.denied cho listUsers của qa.hk').toBeTruthy();
    expect(JSON.stringify(hit)).toContain('access.denied');
  });

  test('TC-NT-017 (2)(3) FD/FDL chỉ xem nhật ký của chính mình (phạm vi own)', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-017', [AUDIT]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const fdl = await sessionOrSkip(request, 'qa.fdl');
    const mine = await audit(request, fd, {});
    expect(mine.status).toBe(200);
    // AuditEvent (openapi 0.3.3) carries actorName only – no actor id field
    const isFd = (e: Row) =>
      actorOf(e) !== undefined ? actorOf(e) === fd.me.id : e.actorName === fd.me.displayName;
    for (const e of rows(mine.body)) expect(isFd(e), JSON.stringify(e)).toBe(true);
    const other = await audit(request, fd, { actorUserId: fdl.me.id });
    expect([200, 404]).toContain(other.status);
    for (const e of rows(other.body))
      expect(isFd(e), `không lộ nhật ký người khác: ${JSON.stringify(e)}`).toBe(true);
  });

  test('TC-NT-016 điều chỉnh dòng folio có nhật ký trước/sau, không xóa được', async () => {
    test.skip(true, 'TC-NT-016: chờ addFolioLine/adjustFolioLine (folio – Sprint 2–3)');
  });
  test('TC-NT-017 (1) nhật ký tiền lọc theo ngày + người đúng, đủ', async () => {
    test.skip(true, 'TC-NT-017(1): chờ thao tác tiền (folio/thu/hoàn – Sprint 2–3)');
  });
});

test.describe('L1 – phê duyệt (US-007, SM-10)', { tag: ['@api', '@sprint1'] }, () => {
  test.beforeEach(() => needSeedPassword());

  test('TC-NT-027 (phần hợp đồng) yêu cầu duyệt: FD chỉ thấy yêu cầu của mình; id không có → 404', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-027', [APPROVALS, APPROVE]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const fdl = await sessionOrSkip(request, 'qa.fdl');
    const pid = propertyIdOf(fd);
    const mine = await call(request, 'GET', `/v1/properties/${pid}/approval-requests`, {
      session: fd,
    });
    expect(mine.status).toBe(200);
    for (const a of rows(mine.body)) {
      const by = a.requestedBy ?? a.requestedByUserId ?? (a.requester as Row | undefined)?.id;
      if (by !== undefined) expect(by).toBe(fd.me.id);
    }
    const r = await call(
      request,
      'POST',
      `/v1/properties/${pid}/approval-requests/${uuid()}/actions/approve`,
      {
        session: fdl,
        idempotencyKey: true,
        body: { authMethod: 'password', secret: SEED_PASSWORD },
      },
    );
    expectProblem(r, 404, 'NOT_FOUND');
  });

  test('TC-NT-030 (a) FDL tự duyệt → 403 SELF_APPROVAL_FORBIDDEN; (b) MGR tự duyệt được; (c) sai mật khẩu → 401 REAUTH_FAILED', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-030', [APPROVALS, APPROVE, REJECT, FOC]);
    // Needs an in-house reservation with a folio line to raise FOC (requestFoc). Implement the fixture
    // (createReservation → checkIn → addFolioLine → requestFoc) when those endpoints land.
    test.skip(
      !(await isAvailable(request, 'POST', '/v1/properties/{propertyId}/reservations')),
      'TC-NT-030: chờ nguồn yêu cầu duyệt (đơn in_house + folio + requestFoc)',
    );
    test.fixme(true, 'TC-NT-030: fixture FOC chưa viết – viết khi Sprint 2–3 có folio');
  });

  // When written (Sprint 2–3): TC-NT-029 (d) – an approver BELOW the routed level gets 403
  // APPROVAL_LIMIT_EXCEEDED and the request status does NOT change (no `escalated`); only the routed
  // approver exceeding a limit escalates (BE-A responses round-02 "Thay đổi hành vi" 2).
  test('TC-NT-028/029/031/033…036 duyệt/từ chối/rút, hạn mức, chặn trả phòng', async () => {
    test.skip(true, 'TC-NT-028…036: chờ requestFoc + folio + checkOut (Sprint 2–3)');
  });
});
