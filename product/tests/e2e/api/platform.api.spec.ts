// E2E API – EP00 platform: tham số quy tắc (US-005, BR mục 13, erd 9.1a), tham số bảo mật (BUG-R1-SEC-02),
// căn – định mức/sức chứa (US-004, BR-110, ESC-014). TC: test-cases/r1-main-flows.md.
// Every parameter write in this file uses a random FUTURE effectiveFrom (2028–2030): it is recorded as a
// new version but never changes today's behaviour of the shared stack – no restore needed.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  type Problem,
  type StaffSession,
} from '../support/api.js';

const SET: [string, string, string] = [
  'PUT',
  '/v1/properties/{propertyId}/parameters/{key}',
  'setParameter',
];
const LIST: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/parameters',
  'listParameters',
];
const HIST: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/parameters/{key}',
  'getParameterHistory',
];
const ROOMS: [string, string, string] = ['GET', '/v1/properties/{propertyId}/rooms', 'listRooms'];
const GROUPS: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/room-groups',
  'listRoomGroups',
];
const CREATE_ROOM: [string, string, string] = [
  'POST',
  '/v1/properties/{propertyId}/rooms',
  'createRoom',
];
const UPDATE_ROOM: [string, string, string] = [
  'PATCH',
  '/v1/properties/{propertyId}/rooms/{roomId}',
  'updateRoom',
];

/** 8 security keys + hard bounds (openapi setParameter x-security-parameters). */
const SECURITY: Record<string, { min?: number; max?: number; def: unknown }> = {
  guest_verify_max_attempts: { min: 3, max: 5, def: 5 },
  guest_level2_idle_minutes: { min: 5, max: 30, def: 30 },
  guest_link_grace_hours: { min: 0, max: 24, def: 24 },
  guest_verify_code_channel_minutes: { min: 5, max: 30, def: 15 },
  guest_verify_code_channels: { def: [] },
  trusted_device_days: { min: 1, max: 180, def: 180 },
  trusted_device_mobile_days: { min: 1, max: 30, def: 30 },
  c3_stepup_minutes: { min: 1, max: 15, def: 15 },
};

function futureDate(): string {
  const y = 2028 + Math.floor(Math.random() * 3);
  const d = new Date(Date.UTC(y, 0, 1) + Math.floor(Math.random() * 360) * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** First array found in a list/history body ({data: [...]}, {history: [...]}, [...] …). */
function firstArray(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    for (const v of Object.values(body as Record<string, unknown>)) if (Array.isArray(v)) return v;
  }
  return [];
}

function paramValue(list: unknown, key: string): unknown {
  const item = firstArray(list).find((x) => (x as { key?: string }).key === key) as
    { value?: unknown } | undefined;
  return item?.value;
}

async function setParam(
  ctx: APIRequestContext,
  s: StaffSession,
  key: string,
  value: unknown,
  reason = 'E2E QA – kiểm quyền/biên tham số',
) {
  return call<Problem>(
    ctx,
    'PUT',
    `/v1/properties/${propertyIdOf(s)}/parameters/${encodeURIComponent(key)}`,
    {
      session: s,
      body: { value, effectiveFrom: futureDate(), reason },
    },
  );
}

async function history(ctx: APIRequestContext, s: StaffSession, key: string) {
  return call(
    ctx,
    'GET',
    `/v1/properties/${propertyIdOf(s)}/parameters/${encodeURIComponent(key)}`,
    { session: s },
  );
}

test.describe('L1 – tham số quy tắc (US-005)', { tag: ['@api', '@sprint1'] }, () => {
  test.beforeEach(() => needSeedPassword());

  test('TC-NT-012 hold_hours_default = 36 (ngoài danh sách 12/24/48) → 422, giá trị giữ nguyên', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-012', [SET, HIST]);
    const owner = await sessionOrSkip(request, 'qa.owner');
    const before = firstArray((await history(request, owner, 'hold_hours_default')).body).length;
    const r = await setParam(request, owner, 'hold_hours_default', 36);
    const p = expectProblem(r, 422);
    expect(['VALIDATION_FAILED', 'PARAM_OUT_OF_RANGE']).toContain(p.code);
    test.info().annotations.push({ type: 'actual-code', description: String(p.code) });
    expect(p.errors?.[0]?.field).toBe('value');
    expect(firstArray((await history(request, owner, 'hold_hours_default')).body).length).toBe(
      before,
    );
  });

  test('TC-NT-013 qa.mgr: checkin_time sửa được; foc_limits, short_stay_commission_pct → 403 (chỉ owner)', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-013', [SET, LIST]);
    const owner = await sessionOrSkip(request, 'qa.owner');
    const mgr = await sessionOrSkip(request, 'qa.mgr');
    const list = await call(request, 'GET', `/v1/properties/${propertyIdOf(owner)}/parameters`, {
      session: owner,
    });
    expect(list.status).toBe(200);
    const ok = await setParam(request, mgr, 'checkin_time', '14:30');
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    for (const key of ['foc_limits', 'short_stay_commission_pct']) {
      const current = paramValue(list.body, key);
      test.skip(current === undefined, `DS-E chưa có giá trị ${key} trong listParameters`);
      expectProblem(await setParam(request, mgr, key, current), 403, 'FORBIDDEN_ACTION');
    }
    test.info().annotations.push({
      type: 'note',
      description:
        'bước (4) channel_commission_pct.agoda: không phải khóa config_parameter (phí kênh ở channel) – kiểm khi có API kênh',
    });
  });

  test('TC-NT-014 qa.fdl xem được nhưng không sửa; FD/HK/SAL/CTV không xem được tham số', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-014', [SET, LIST]);
    const fdl = await sessionOrSkip(request, 'qa.fdl');
    const pid = propertyIdOf(fdl);
    expect(
      (await call(request, 'GET', `/v1/properties/${pid}/parameters`, { session: fdl })).status,
    ).toBe(200);
    expectProblem(await setParam(request, fdl, 'checkin_time', '14:00'), 403, 'FORBIDDEN_ACTION');
    for (const u of ['qa.fd', 'qa.hk', 'qa.sal', 'qa.ctv1']) {
      const s = await sessionOrSkip(request, u);
      expectProblem(
        await call(request, 'GET', `/v1/properties/${pid}/parameters`, { session: s }),
        403,
        'FORBIDDEN_ACTION',
      );
    }
  });

  test('TC-NT-015 lịch sử tham số có giá trị mới, người sửa, ngày hiệu lực', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-015', [SET, HIST]);
    const mgr = await sessionOrSkip(request, 'qa.mgr');
    const owner = await sessionOrSkip(request, 'qa.owner');
    const r = await setParam(request, mgr, 'checkin_time', '14:30', 'E2E TC-NT-015');
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const h = await history(request, owner, 'checkin_time');
    expect(h.status).toBe(200);
    const text = JSON.stringify(h.body);
    expect(text).toContain('14:30');
    expect(text).toContain('E2E TC-NT-015');
    expect(text, 'người sửa = qa.mgr').toMatch(
      new RegExp(`${mgr.me.id}|qa\\.mgr|${mgr.me.displayName}`),
    );
    expect(text).toMatch(/effectiveFrom/);
  });

  test('TC-NT-041 (a)(b)(c)(d) tham số bảo mật: đúng biên 200; ngoài biên 422 PARAM_OUT_OF_RANGE kèm min/max; không tạo phiên bản', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-041', [SET, HIST]);
    const owner = await sessionOrSkip(request, 'qa.owner');
    const edges: Array<[string, unknown]> = [
      ['guest_verify_max_attempts', 3],
      ['guest_verify_max_attempts', 5],
      ['guest_level2_idle_minutes', 5],
      ['guest_level2_idle_minutes', 30],
      ['guest_link_grace_hours', 0],
      ['guest_link_grace_hours', 24],
      ['trusted_device_mobile_days', 1],
      ['trusted_device_mobile_days', 30],
      ['c3_stepup_minutes', 1],
      ['c3_stepup_minutes', 15],
      ['guest_verify_code_channels', []],
      ['guest_verify_code_channels', ['airbnb_inbox', 'booking_inbox', 'agoda_inbox', 'zalo']],
    ];
    for (const [k, v] of edges) {
      const r = await setParam(request, owner, k, v);
      expect(r.status, `(a) ${k}=${JSON.stringify(v)}: ${JSON.stringify(r.body)}`).toBe(200);
    }
    const before = firstArray(
      (await history(request, owner, 'guest_verify_max_attempts')).body,
    ).length;
    const b = expectProblem(
      await setParam(request, owner, 'guest_verify_max_attempts', 6),
      422,
      'PARAM_OUT_OF_RANGE',
    );
    expect(b.type).toBe('/problems/param-out-of-range');
    expect(b.min).toBe(3);
    expect(b.max).toBe(5);
    expect(b.errors?.[0]).toMatchObject({ field: 'value', code: 'PARAM_OUT_OF_RANGE' });
    const c = await setParam(request, owner, 'guest_verify_code_channels', ['zalo', 'zalo']);
    const pc = expectProblem(c, 422);
    expect(['PARAM_OUT_OF_RANGE', 'VALIDATION_FAILED']).toContain(pc.code);
    test.info().annotations.push({ type: 'actual-code (c)', description: String(pc.code) });
    expect(
      firstArray((await history(request, owner, 'guest_verify_max_attempts')).body).length,
      '(d) lần bị từ chối không tạo phiên bản',
    ).toBe(before);
  });

  test('TC-SEC-028 tham số bảo mật: MGR/FDL → 403; owner ngoài biên → 422; sai kiểu → VALIDATION_FAILED; trong biên → 200', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-SEC-028', [SET]);
    const owner = await sessionOrSkip(request, 'qa.owner');
    for (const u of ['qa.mgr', 'qa.fdl']) {
      const s = await sessionOrSkip(request, u);
      for (const [k, spec] of Object.entries(SECURITY)) {
        expectProblem(await setParam(request, s, k, spec.def), 403, 'FORBIDDEN_ACTION');
      }
    }
    const out: Array<[string, unknown]> = [
      ['guest_verify_max_attempts', 2],
      ['guest_verify_max_attempts', 6],
      ['guest_level2_idle_minutes', 31],
      ['guest_link_grace_hours', 25],
      ['guest_verify_code_channel_minutes', 4],
      ['trusted_device_days', 181],
      ['trusted_device_mobile_days', 31],
      ['c3_stepup_minutes', 16],
      ['guest_verify_code_channels', ['sms']],
    ];
    for (const [k, v] of out) {
      const p = expectProblem(await setParam(request, owner, k, v), 422, 'PARAM_OUT_OF_RANGE');
      if (Array.isArray(v)) expect(Array.isArray(p.allowed), `${k}: allowed[]`).toBe(true);
      else
        expect(typeof p.min === 'number' && typeof p.max === 'number', `${k}: min/max`).toBe(true);
    }
    expectProblem(
      await setParam(request, owner, 'c3_stepup_minutes', 'mười'),
      422,
      'VALIDATION_FAILED',
    );
    const ok = await setParam(request, owner, 'c3_stepup_minutes', 10);
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
  });

  test('TC-NT-042 khóa nghiệp vụ ngoài khoảng erd 9.1a → 422 PARAM_OUT_OF_RANGE (min/max)', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-042', [SET]);
    const owner = await sessionOrSkip(request, 'qa.owner');
    // bounds from migration 0003 (erd 9.1a): short_stay_deposit_pct 0..100, booking_window_days 30..730
    const a = expectProblem(
      await setParam(request, owner, 'short_stay_deposit_pct', 101),
      422,
      'PARAM_OUT_OF_RANGE',
    );
    expect([a.min, a.max]).toEqual([0, 100]);
    const b = expectProblem(
      await setParam(request, owner, 'booking_window_days', 0),
      422,
      'PARAM_OUT_OF_RANGE',
    );
    expect([b.min, b.max]).toEqual([30, 730]);
    for (const [k, v] of [
      ['late_grace_until', '25:00'],
      ['min_stay', { nights: 0 }],
    ] as Array<[string, unknown]>) {
      const p = expectProblem(await setParam(request, owner, k, v), 422);
      expect(['PARAM_OUT_OF_RANGE', 'VALIDATION_FAILED']).toContain(p.code);
      test.info().annotations.push({ type: `actual-code ${k}`, description: String(p.code) });
    }
  });

  test('TC-NT-011 đổi hold_hours_default chỉ áp cho giữ chỗ mới (snapshot BR-006)', async () => {
    test.skip(true, 'TC-NT-011: chờ createHoldFromQuote/getReservation (Sprint 2)');
  });
});

test.describe(
  'L1 – danh mục căn: định mức / sức chứa (US-004)',
  { tag: ['@api', '@sprint1'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    interface Room {
      id: string;
      roomNo?: string;
      baseOccupancy?: number;
      maxOccupancy?: number;
      version?: number;
    }

    test('TC-NT-040(e) sửa maxOccupancy ngoài {định mức, định mức+1} → 422 MAX_OCCUPANCY_RANGE, căn không đổi', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-NT-040', [ROOMS, UPDATE_ROOM]);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const pid = propertyIdOf(owner);
      const list = await call(request, 'GET', `/v1/properties/${pid}/rooms`, { session: owner });
      expect(list.status).toBe(200);
      const rooms = firstArray(list.body) as Room[];
      const room =
        rooms.find((r) => r.roomNo === '202') ??
        rooms.find((r) => typeof r.baseOccupancy === 'number');
      test.skip(
        !room || typeof room.baseOccupancy !== 'number',
        'TC-NT-040: DS-E chưa nạp căn (platform seed – BE-B)',
      );
      for (const bad of [room!.baseOccupancy! - 1, room!.baseOccupancy! + 2]) {
        if (bad < 1) continue;
        const r = await call<Problem>(request, 'PATCH', `/v1/properties/${pid}/rooms/${room!.id}`, {
          session: owner,
          ifMatch: `"${room!.version ?? 0}"`,
          body: { maxOccupancy: bad },
        });
        const p = expectProblem(r, 422, 'VALIDATION_FAILED');
        expect(JSON.stringify(p.errors)).toContain('MAX_OCCUPANCY_RANGE');
      }
      const after = firstArray(
        (await call(request, 'GET', `/v1/properties/${pid}/rooms`, { session: owner })).body,
      ) as Room[];
      expect(after.find((r) => r.id === room!.id)?.maxOccupancy).toBe(room!.maxOccupancy);
    });

    test('TC-NT-040(e′) tạo căn với maxOccupancy ngoài {định mức, định mức+1} → 422 MAX_OCCUPANCY_RANGE, không tạo căn', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-NT-040', [GROUPS, CREATE_ROOM]);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const pid = propertyIdOf(owner);
      const groups = firstArray(
        (await call(request, 'GET', `/v1/properties/${pid}/room-groups`, { session: owner })).body,
      ) as Array<{ id: string }>;
      test.skip(!groups[0], 'TC-NT-040: DS-E chưa nạp nhóm căn');
      const r = await call<Problem>(request, 'POST', `/v1/properties/${pid}/rooms`, {
        session: owner,
        idempotencyKey: true,
        body: {
          roomNo: 'Z9E2E',
          roomGroupId: groups[0]!.id,
          baseOccupancy: 2,
          maxOccupancy: 4,
          monthlyListPriceVnd: 9000000,
        },
      });
      const p = expectProblem(r, 422, 'VALIDATION_FAILED');
      expect(JSON.stringify(p.errors)).toContain('MAX_OCCUPANCY_RANGE');
    });

    test('TC-NT-039 giảm sức chứa dưới số khách của đơn → 409 CAPACITY_BELOW_BOOKINGS', async () => {
      test.skip(true, 'TC-NT-039: chờ DS-0 + createReservation/cancelReservation (Sprint 2)');
    });
    test('TC-NT-040(a–d) biên CAPACITY_BELOW_BOOKINGS với đơn tương lai/đang ở', async () => {
      test.skip(true, 'TC-NT-040(a–d): chờ DS-0 + createReservation (Sprint 2)');
    });
    test('TC-NT-020 sức chứa ở form đặt/giữ chỗ/báo giá → 422 CAPACITY_EXCEEDED', async () => {
      test.skip(
        true,
        'TC-NT-020: chờ createReservation/createHoldFromQuote/calculateQuote (Sprint 2)',
      );
    });
    test('TC-NT-018 đổi giá niêm yết không đổi báo giá/đơn đã lưu', async () => {
      test.skip(true, 'TC-NT-018: chờ calculateQuote/getQuote/getReservation (Sprint 2)');
    });
    test('TC-NT-019 căn ngừng bán → 409 ROOM_NOT_SELLABLE', async () => {
      test.skip(true, 'TC-NT-019: chờ createReservation/getRack (Sprint 2)');
    });
  },
);
