// MSW mock of the housekeeping/maintenance API (OpenAPI 0.3.7, tags auth/housekeeping/maintenance) while
// BE-C builds the module. Rules follow the contract: SM-03 transitions with `expectedFrom` → 409
// INVALID_TRANSITION + `currentState`, `performedAt` window → 422 PERFORMED_AT_OUT_OF_RANGE, checklist
// version → 409 CHECKLIST_OUTDATED, If-Match on work orders → 412 VERSION_CONFLICT, Idempotency-Key replay.
// Room names = temporary BL 4.1 mapping (DS 11.3, P-S4-8). Dev-only data, never shipped (vite.config.ts).
import { delay, http, HttpResponse } from 'msw';
import type { components } from '@ottimo/api-client';

type S = components['schemas'];
type RoomCode = S['RoomStatusCode'];

/** Dev sign-in: any of these usernames with MOCK_PASSWORD (test fixture of the mock, not a real account). */
export const MOCK_USERS = {
  'hk.lan': { id: '0192a1b0-0000-7000-8000-00000000a001', name: 'Lan', roles: ['housekeeping'] },
  'mt.tung': { id: '0192a1b0-0000-7000-8000-00000000a002', name: 'Tùng', roles: ['maintenance'] },
  'fdl.hanh': {
    id: '0192a1b0-0000-7000-8000-00000000a003',
    name: 'Hạnh',
    roles: ['front_desk_lead'],
  },
  'sale.minh': { id: '0192a1b0-0000-7000-8000-00000000a004', name: 'Minh', roles: ['sales_staff'] },
} as const satisfies Record<string, { id: string; name: string; roles: S['Role'][] }>;
// Matches the reviewed gitleaks allowlist pattern for dev-only placeholders (.github/gitleaks.toml).
export const MOCK_PASSWORD = 'change_me_mock_dev_only';
export const PROPERTY_ID = '0192a1b0-0000-7000-8000-0000000000a1';

const NAMES: Record<string, string> = {
  '101': 'The Amber',
  '102': 'The Fern',
  '103': 'The Bloom',
  '201': 'The Mist',
  '202': 'The Valley',
  '203': 'The Sage',
  '301': 'The Velvet',
  '302': 'The Ivory',
  '401': 'The Pine',
  '402': 'The Ember',
};
const roomId = (no: string) => `0192a1b0-0000-7000-8000-0000000c0${no}`;
/** Work order photos of the seed: one readable, one already deleted by retention (404). */
export const PHOTO_OK = '0192a1b0-0000-7000-8000-0000000af010';
export const PHOTO_DELETED = '0192a1b0-0000-7000-8000-0000000af011';
/** A real 1×1 image so the dev page shows a tile (mock only – the server sends JPEG/WebP). */
const PIXEL = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);

function today(now = Date.now()) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
  return p; // YYYY-MM-DD
}
function plusDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function at(date: string, hhmm: string) {
  return `${date}T${hhmm}:00+07:00`;
}

interface Room {
  no: string;
  status: RoomCode;
  since: string;
  guest?: string;
  inHouse: boolean;
  next?: { date: string; etaTime?: string };
  version: number;
}

interface State {
  session?: keyof typeof MOCK_USERS;
  rooms: Room[];
  tasks: S['HkTask'][];
  workOrders: S['WorkOrder'][];
  checklistVersion: number;
  attachments: number;
  idem: Map<string, unknown>;
  calls: string[];
  bodies: { op: string; body: unknown }[];
  notifications: S['StaffNotification'][];
  /** Accept-Language seen per operation (PWA sends the app language – 0.3.7 bổ sung 1 #13). */
  languages: { op: string; lang: string | null }[];
}

const scenario = {
  latencyMs: 0,
  /** Next call of this op fails with this problem (then clears). */
  failNext: undefined as
    undefined | { op: string; status: number; code: string; extra?: Record<string, unknown> },
  /** Simulate a network drop for the next call of this op. */
  dropNext: undefined as undefined | string,
};

function seed(): State {
  const d = today();
  const rooms: Room[] = [
    { no: '101', status: 'OD', since: at(d, '07:00'), guest: 'Khoa', inHouse: true, version: 1 },
    { no: '102', status: 'OD', since: at(d, '07:00'), guest: 'Emma', inHouse: true, version: 1 },
    {
      no: '103',
      status: 'VI',
      since: at(plusDays(d, -1), '16:00'),
      inHouse: false,
      next: { date: d, etaTime: '14:00' },
      version: 1,
    },
    { no: '201', status: 'OD', since: at(d, '07:00'), guest: 'Sarah', inHouse: true, version: 1 },
    {
      no: '202',
      status: 'VD',
      since: at(d, '09:10'),
      inHouse: false,
      next: { date: plusDays(d, 1), etaTime: '14:00' },
      version: 1,
    },
    {
      no: '203',
      status: 'VC',
      since: at(d, '09:40'),
      inHouse: false,
      next: { date: plusDays(d, 4), etaTime: '14:00' },
      version: 1,
    },
    { no: '301', status: 'OC', since: at(d, '08:30'), inHouse: true, version: 1 },
    {
      no: '302',
      status: 'VC',
      since: at(d, '10:05'),
      inHouse: false,
      next: { date: d, etaTime: '15:30' },
      version: 1,
    },
    { no: '401', status: 'OOO', since: at(plusDays(d, -1), '21:40'), inHouse: false, version: 1 },
    { no: '402', status: 'OD', since: at(d, '07:00'), guest: 'Lucas', inHouse: true, version: 1 },
  ];
  const task = (
    n: number,
    no: string,
    type: S['HkTaskType'],
    extra: Partial<S['HkTask']> = {},
  ): S['HkTask'] => ({
    id: `0192a1b0-0000-7000-8000-0000000d00${String(n).padStart(2, '0')}`,
    roomId: roomId(no),
    roomNo: no,
    roomName: NAMES[no] ?? null,
    type,
    status: 'open',
    dueDate: d,
    quantity: 1,
    source: 'system',
    priorityRank: n,
    version: 1,
    ...extra,
  });
  const tasks = [
    task(1, '302', 'extra_guest_kit_prepare', {
      dueAt: at(d, '14:00'),
      reservationId: '0192a1b0-0000-7000-8000-0000000e0302',
    }),
    task(2, '202', 'checkout_clean', { linenChange: true }),
    task(3, '102', 'long_stay_clean', { windowStart: '09:00', windowEnd: '11:00' }),
    task(4, '101', 'stayover_clean', {
      source: 'guest_app',
      note: 'Thêm 2 khăn tắm',
      refillItems: [{ itemName: 'bia', quantity: 2 }],
    }),
    task(5, '201', 'checkout_clean', { notBeforeTime: '12:00' }),
    task(6, '203', 'checkout_clean', { status: 'done', doneAt: at(d, '09:40') }),
  ];
  const wo = (
    n: number,
    no: string,
    extra: Partial<S['WorkOrder']> &
      Pick<S['WorkOrder'], 'title' | 'severity' | 'status' | 'source'>,
  ): S['WorkOrder'] => ({
    id: `0192a1b0-0000-7000-8000-0000000f00${String(n).padStart(2, '0')}`,
    code: `WO-0000${n}`,
    roomId: roomId(no),
    roomNo: no,
    roomName: NAMES[no] ?? null,
    version: 1,
    history: [{ at: at(d, '08:00'), actorName: 'Hạnh', change: 'created' }],
    ...extra,
  });
  const now = Date.now();
  const workOrders = [
    wo(5, '101', {
      title: 'Không có nước nóng',
      description: 'Vòi sen phòng tắm',
      severity: 'high',
      status: 'new',
      source: 'guest_app',
      category: 'hot_water',
      photoAttachmentIds: [PHOTO_OK, PHOTO_DELETED],
      ackDueAt: new Date(now + 5 * 60_000).toISOString(),
      resolveDueAt: new Date(now + 110 * 60_000).toISOString(),
    }),
    wo(1, '401', {
      title: 'Bình nóng lạnh rò nước, khóa phòng',
      severity: 'high',
      status: 'in_progress',
      source: 'housekeeping',
      category: 'leak',
      assigneeName: 'Tùng',
      resolveDueAt: new Date(now + 60 * 60_000).toISOString(),
      roomBlock: {
        id: '0192a1b0-0000-7000-8000-0000000b0401',
        roomId: roomId('401'),
        status: 'active',
        startDate: plusDays(d, -1),
        endDatePlanned: plusDays(d, 2),
        reason: 'Thay bình nóng lạnh',
        version: 1,
      },
    }),
    wo(3, '102', {
      title: 'Wi-Fi yếu ở góc bàn làm việc',
      severity: 'medium',
      status: 'waiting_parts',
      source: 'front_desk',
      category: 'wifi',
      partsExpectedDate: plusDays(d, 2),
    }),
    wo(2, '203', {
      title: 'Bóng đèn ban công chập chờn',
      severity: 'low',
      status: 'new',
      source: 'housekeeping',
      category: 'power',
      resolveDueAt: new Date(now + 3 * 24 * 60 * 60_000).toISOString(),
    }),
  ];
  return {
    rooms,
    tasks,
    workOrders,
    checklistVersion: 3,
    attachments: 0,
    idem: new Map(),
    calls: [],
    bodies: [],
    notifications: [
      {
        id: '0192a1b0-0000-7000-8000-0000000aa001',
        kind: 'work_order_high_new',
        refType: 'work_order',
        refId: workOrders[0]!.id,
        refCode: 'WO-00005',
        createdAt: at(d, '10:32'),
      },
      {
        id: '0192a1b0-0000-7000-8000-0000000aa002',
        kind: 'hk_task_urgent',
        refType: 'hk_task',
        refId: tasks[0]!.id,
        refCode: '302',
        createdAt: at(d, '10:05'),
      },
      {
        id: '0192a1b0-0000-7000-8000-0000000aa003',
        kind: 'room_awaiting_inspection',
        refType: 'hk_task',
        refCode: '203',
        createdAt: at(d, '09:41'),
        readAt: at(d, '09:50'),
      },
    ],
    languages: [],
  };
}

let state: State = seed();

export const mockControl = {
  get state() {
    return state;
  },
  scenario,
  reset(patch: Partial<typeof scenario> = {}) {
    state = seed();
    Object.assign(scenario, { latencyMs: 0, failNext: undefined, dropNext: undefined, ...patch });
  },
  signIn(user: keyof typeof MOCK_USERS) {
    state.session = user;
  },
  notify(n: Omit<S['StaffNotification'], 'id' | 'createdAt'>) {
    state.notifications.unshift({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...n,
    });
  },
  setRoom(no: string, status: RoomCode) {
    const r = state.rooms.find((x) => x.no === no)!;
    r.status = status;
    r.version++;
  },
};

const problem = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  HttpResponse.json(
    {
      type: `/problems/${code.toLowerCase()}`,
      title: code,
      status,
      code,
      requestId: 'req-mock',
      ...extra,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );

async function guard(op: string, request: Request): Promise<Response | undefined> {
  state.calls.push(op);
  if (scenario.latencyMs) await delay(scenario.latencyMs);
  if (scenario.dropNext === op) {
    scenario.dropNext = undefined;
    return HttpResponse.error();
  }
  if (!state.session) return problem(401, 'UNAUTHENTICATED');
  if (request.method !== 'GET' && request.headers.get('x-csrf-token') !== 'csrf-mock') {
    return problem(403, 'CSRF_INVALID');
  }
  const f = scenario.failNext;
  if (f && f.op === op) {
    scenario.failNext = undefined;
    const r = problem(f.status, f.code, f.extra);
    if (f.status === 503) r.headers.set('Retry-After', '1');
    return r;
  }
  return undefined;
}

function user() {
  return state.session ? MOCK_USERS[state.session] : undefined;
}

function me() {
  const u = user()!;
  return {
    id: u.id,
    displayName: u.name,
    csrfToken: 'csrf-mock',
    activePropertyId: PROPERTY_ID,
    properties: [
      {
        propertyId: PROPERTY_ID,
        name: 'OTTIMO Boutique Stay – Đà Lạt',
        timezone: 'Asia/Ho_Chi_Minh',
        roles: [...u.roles],
        screens: [],
        deviceTrusted: false, // PWA is never a trusted device (SR-DEV-09)
      },
    ],
    mustChangePassword: false,
  } satisfies S['Me'];
}

function allowedEvents(r: Room): S['RoomStatusEntry']['allowedEvents'] {
  switch (r.status) {
    case 'VD':
    case 'OD':
      return ['start_cleaning'];
    case 'CL':
      return ['finish_cleaning'];
    case 'VC':
      return ['inspect'];
    default:
      return [];
  }
}

function entry(r: Room): S['RoomStatusEntry'] {
  const isHk = user()?.roles.includes('housekeeping' as never);
  const hasTask = state.tasks.some((t) => t.roomNo === r.no && t.status !== 'cancelled');
  return {
    roomId: roomId(r.no),
    roomNo: r.no,
    roomName: NAMES[r.no] ?? null,
    floor: Number(r.no[0]),
    status: r.status,
    since: r.since,
    // rbac D01: HK sees the guest's first name only for rooms with a task today.
    ...(r.guest && (!isHk || hasTask) ? { currentGuest: r.guest } : {}),
    ...(r.next ? { nextArrival: { date: r.next.date, etaTime: r.next.etaTime } } : {}),
    allowedEvents: user()?.roles.includes('maintenance' as never) ? [] : allowedEvents(r),
    openTaskIds: state.tasks
      .filter((t) => t.roomNo === r.no && t.status === 'open')
      .map((t) => t.id),
    version: r.version,
  };
}

function checkPerformedAt(value: unknown): Response | undefined {
  const t = typeof value === 'string' ? Date.parse(value) : NaN;
  const now = Date.now();
  if (Number.isNaN(t) || t < now - 24 * 3600_000 || t > now + 5 * 60_000) {
    return problem(422, 'PERFORMED_AT_OUT_OF_RANGE', {
      errors: [{ field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' }],
    });
  }
  return undefined;
}

/** Idempotency-Key replay: same key → same answer, no second write (ADR-009). */
function replay(request: Request): { key?: string; hit?: Response } {
  const key = request.headers.get('idempotency-key') ?? undefined;
  if (key && state.idem.has(key)) {
    const v = state.idem.get(key) as { status: number; body: unknown };
    return { key, hit: HttpResponse.json(v.body as never, { status: v.status }) };
  }
  return { key };
}
function remember(key: string | undefined, status: number, body: unknown) {
  if (key) state.idem.set(key, { status, body });
  return HttpResponse.json(body as never, { status });
}

const P = '/v1/properties/:pid';

export const handlers = [
  http.post('/v1/auth/login', async ({ request }) => {
    state.calls.push('login');
    if (scenario.latencyMs) await delay(scenario.latencyMs);
    const { username, password } = (await request.json()) as { username: string; password: string };
    if (!(username in MOCK_USERS) || password !== MOCK_PASSWORD) {
      return problem(401, 'UNAUTHENTICATED');
    }
    state.session = username as keyof typeof MOCK_USERS;
    return HttpResponse.json(me());
  }),
  http.post('/v1/auth/logout', () => {
    state.calls.push('logout');
    state.session = undefined;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('/v1/me', async ({ request }) => {
    const g = await guard('getMe', request);
    if (g) return g;
    return HttpResponse.json(me());
  }),

  http.get('/v1/me/notifications', async ({ request }) => {
    const g = await guard('listMyNotifications', request);
    if (g) return g;
    return HttpResponse.json({
      data: state.notifications,
      page: { nextCursor: null },
      unreadCount: state.notifications.filter((n) => !n.readAt).length,
    });
  }),
  http.post('/v1/me/notifications/:id/read', async ({ request, params }) => {
    const g = await guard('markNotificationRead', request);
    if (g) return g;
    const n = state.notifications.find((x) => x.id === params.id);
    if (!n) return problem(404, 'NOT_FOUND');
    n.readAt = n.readAt ?? new Date().toISOString();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${P}/room-statuses`, async ({ request }) => {
    const g = await guard('listRoomStatuses', request);
    if (g) return g;
    return HttpResponse.json({ asOf: new Date().toISOString(), data: state.rooms.map(entry) });
  }),

  http.post(`${P}/rooms/:roomId/status-transitions`, async ({ request, params }) => {
    const g = await guard('transitionRoomStatus', request);
    if (g) return g;
    const { key, hit } = replay(request);
    if (hit) return hit;
    const body = (await request.json()) as {
      event: string;
      expectedFrom: RoomCode;
      performedAt: string;
      taskId?: string;
    };
    state.bodies.push({ op: 'transitionRoomStatus', body });
    const bad = checkPerformedAt(body.performedAt);
    if (bad) return bad;
    const r = state.rooms.find((x) => roomId(x.no) === params.roomId);
    if (!r) return problem(404, 'NOT_FOUND');
    if (r.status !== body.expectedFrom) {
      return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
    }
    if (body.event === 'start_cleaning' && (r.status === 'VD' || r.status === 'OD'))
      r.status = 'CL';
    else if (body.event === 'finish_cleaning' && r.status === 'CL') {
      r.status = r.inHouse ? 'OC' : 'VC';
      const t = state.tasks.find(
        (x) => x.roomNo === r.no && x.status === 'open' && /_clean$/.test(x.type),
      );
      if (t) {
        t.status = 'done';
        t.doneAt = new Date().toISOString();
        t.version++;
      }
    } else return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
    r.since = new Date().toISOString();
    r.version++;
    return remember(key, 200, entry(r));
  }),

  http.get(`${P}/hk-tasks`, async ({ request }) => {
    const g = await guard('listHkTasks', request);
    if (g) return g;
    const live = state.tasks.filter((t) => t.status !== 'cancelled');
    return HttpResponse.json({
      summary: { done: live.filter((t) => t.status === 'done').length, total: live.length },
      data: state.tasks,
    });
  }),

  http.post(`${P}/hk-tasks/:taskId/actions/:action`, async ({ request, params }) => {
    const g = await guard('transitionHkTask', request);
    if (g) return g;
    const { key, hit } = replay(request);
    if (hit) return hit;
    const body = (await request.json()) as {
      performedAt: string;
      cancelReasonCode?: string;
      cancelNote?: string;
    };
    state.bodies.push({ op: 'transitionHkTask', body: { ...body, action: params.action } });
    const bad = checkPerformedAt(body.performedAt);
    if (bad) return bad;
    const t = state.tasks.find((x) => x.id === params.taskId);
    if (!t) return problem(404, 'NOT_FOUND');
    if (t.status === 'done' || t.status === 'cancelled') {
      return problem(409, 'INVALID_TRANSITION', { currentState: t.status });
    }
    if (params.action === 'cancel') {
      if (!body.cancelReasonCode) {
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'cancelReasonCode', code: 'REQUIRED' }],
        });
      }
      t.status = 'cancelled';
      t.cancelReasonCode = body.cancelReasonCode as S['HkTask']['cancelReasonCode'];
    } else if (params.action === 'complete') {
      t.status = 'done';
      t.doneAt = new Date().toISOString();
    } else t.status = 'in_progress';
    t.version++;
    return remember(key, 200, t);
  }),

  http.get(`${P}/inspection-checklist`, async ({ request }) => {
    const g = await guard('getInspectionChecklist', request);
    if (g) return g;
    state.languages.push({
      op: 'getInspectionChecklist',
      lang: request.headers.get('accept-language'),
    });
    const url = new URL(request.url);
    const rid = url.searchParams.get('roomId');
    const isHk = user()?.roles.includes('housekeeping' as never);
    const labels = [
      'Ga gối phẳng, sạch',
      'Phòng tắm khô, không tóc',
      'Khăn: 2 tắm, 2 mặt, 1 chân',
      'Đồ dùng đủ, quay nhãn ra',
      'Bếp sạch, tủ lạnh có nước suối',
      'Bàn làm việc, đèn, ổ cắm',
      'Wi-Fi từ 50 Mbps',
      'Rèm, cửa sổ kín',
      'Không mùi, đã thông gió',
      'Remote, điều hòa / sưởi chạy',
      'Thẻ chào + thông tin Wi-Fi',
    ];
    const items: {
      code: string;
      label: string;
      required: boolean;
      photoRequired?: boolean;
      dynamic?: boolean;
    }[] = labels.map((label, i) => ({
      code: `i${String(i + 1).padStart(2, '0')}`,
      label,
      required: true,
    }));
    items.push({ code: 'i12', label: 'Ảnh phòng', required: true, photoRequired: Boolean(isHk) });
    let version = state.checklistVersion;
    const kit = state.tasks.find(
      (t) => t.roomId === rid && t.type === 'extra_guest_kit_prepare' && t.status !== 'cancelled',
    );
    if (kit) {
      items.push({
        code: 'extra_guest_kit',
        label: 'Có đủ 1 bộ đồ dùng thêm (sofa)',
        required: true,
        dynamic: true,
      });
      version += 100;
    }
    return HttpResponse.json({ version, items });
  }),

  http.post(`${P}/rooms/:roomId/inspections`, async ({ request, params }) => {
    const g = await guard('recordInspection', request);
    if (g) return g;
    state.languages.push({ op: 'recordInspection', lang: request.headers.get('accept-language') });
    const { key, hit } = replay(request);
    if (hit) return hit;
    const body = (await request.json()) as S['InspectionInput'];
    state.bodies.push({ op: 'recordInspection', body });
    const bad = checkPerformedAt(body.performedAt);
    if (bad) return bad;
    const r = state.rooms.find((x) => roomId(x.no) === params.roomId);
    if (!r) return problem(404, 'NOT_FOUND');
    const kit = state.tasks.some(
      (t) =>
        t.roomId === params.roomId &&
        t.type === 'extra_guest_kit_prepare' &&
        t.status !== 'cancelled',
    );
    const current = state.checklistVersion + (kit ? 100 : 0);
    if (body.checklistVersion !== current) {
      return problem(409, 'CHECKLIST_OUTDATED', { currentVersion: current });
    }
    if (r.status !== 'VC') return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
    for (const i of body.items) {
      if (!i.passed && (!i.note || i.note.length < 3)) {
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'items.note', code: 'REQUIRED' }],
        });
      }
    }
    const pass = body.items.every((i) => i.passed);
    if (pass) {
      r.status = 'VI';
      r.since = new Date().toISOString();
      r.version++;
    }
    return remember(key, 201, {
      id: crypto.randomUUID(),
      roomId: params.roomId,
      result: pass ? 'pass' : 'fail',
      inspectedAt: body.performedAt,
      inspectedBy: user()!.name,
      roomStatusAfter: r.status,
      checklistVersion: body.checklistVersion,
    });
  }),

  http.post(`${P}/attachments`, async ({ request }) => {
    const g = await guard('uploadAttachment', request);
    if (g) return g;
    const { key, hit } = replay(request);
    if (hit) return hit;
    const form = await request.formData();
    const file = form.get('file');
    const purpose = String(form.get('purpose') ?? '');
    if (!file || typeof file === 'string') {
      return problem(422, 'FILE_REJECTED', { errors: [{ field: 'file', code: 'FILE_TYPE' }] });
    }
    state.attachments++;
    state.bodies.push({ op: 'uploadAttachment', body: { purpose, size: file.size } });
    return remember(key, 201, {
      id: `0192a1b0-0000-7000-8000-0000000a${String(state.attachments).padStart(4, '0')}`,
      purpose,
      sizeBytes: file.size,
    });
  }),

  http.get(`${P}/attachments/:attachmentId`, async ({ request, params }) => {
    const g = await guard('getAttachment', request);
    if (g) return g;
    if (params.attachmentId === PHOTO_DELETED) return problem(404, 'NOT_FOUND');
    return new HttpResponse(PIXEL, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' },
    });
  }),

  http.get(`${P}/work-orders`, async ({ request }) => {
    const g = await guard('listWorkOrders', request);
    if (g) return g;
    return HttpResponse.json({ data: state.workOrders, page: { nextCursor: null } });
  }),

  http.post(`${P}/work-orders`, async ({ request }) => {
    const g = await guard('createWorkOrder', request);
    if (g) return g;
    const { key, hit } = replay(request);
    if (hit) return hit;
    const body = (await request.json()) as S['WorkOrderCreate'];
    state.bodies.push({ op: 'createWorkOrder', body });
    if (body.block && user()?.roles.includes('housekeeping' as never)) {
      return problem(403, 'FORBIDDEN_ACTION');
    }
    if (!body.description || body.description.trim().length < 3) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'description', code: 'REQUIRED' }],
      });
    }
    const r = state.rooms.find((x) => roomId(x.no) === body.roomId);
    if (!r)
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }],
      });
    let roomBlock: S['RoomBlock'] | undefined;
    if (body.block) {
      const b = body.block;
      if (!b.expectedDoneDate || !b.startDate || b.expectedDoneDate < b.startDate) {
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'block.expectedDoneDate', code: 'DATE_ORDER' }],
        });
      }
      // ooo_reopen_buffer_days = 1 (BR-804) – the server works it out, MT/FD never read it.
      const reopen = plusDays(b.expectedDoneDate, 1);
      if (r.inHouse && b.startDate <= today()) {
        return problem(409, 'ROOM_OCCUPIED', {
          conflicts: [{ kind: 'reservation', reservationCode: 'OTM-0150', roomNo: r.no }],
        });
      }
      if (r.status === 'OOO') {
        return problem(409, 'ROOM_BLOCKED', { conflicts: [{ kind: 'ooo', roomNo: r.no }] });
      }
      if (r.next && r.next.date >= b.startDate && r.next.date < reopen) {
        return problem(409, 'ROOM_UNAVAILABLE', {
          conflicts: [
            {
              kind: 'reservation',
              reservationCode: 'OTM-0154',
              roomNo: r.no,
              stayFrom: r.next.date,
              stayTo: plusDays(r.next.date, 3),
              guestDisplayName: 'Must not be shown to maintenance',
            },
          ],
        });
      }
      roomBlock = {
        id: crypto.randomUUID(),
        roomId: body.roomId,
        roomNo: r.no,
        status: b.startDate <= today() ? 'active' : 'planned',
        startDate: b.startDate,
        expectedDoneDate: b.expectedDoneDate,
        endDatePlanned: reopen,
        reason: b.reason,
        version: 1,
      };
      if (roomBlock.status === 'active') {
        r.status = 'OOO';
        r.version++;
      }
    }
    const n = state.workOrders.length + 6;
    const wo: S['WorkOrder'] = {
      ...(roomBlock ? { roomBlock } : {}),
      id: crypto.randomUUID(),
      code: `WO-${String(n).padStart(5, '0')}`,
      roomId: body.roomId,
      roomNo: r.no,
      roomName: NAMES[r.no] ?? null,
      title: body.title,
      description: body.description,
      severity: body.severity ?? 'medium',
      status: 'new',
      source: user()?.roles.includes('maintenance' as never) ? 'maintenance' : 'housekeeping',
      category: body.category,
      blockRequested: body.blockRequested,
      photoAttachmentIds: body.photoAttachmentIds ?? [],
      ackDueAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      history: [{ at: new Date().toISOString(), actorName: user()!.name, change: 'created' }],
      version: 1,
    };
    state.workOrders.unshift(wo);
    return remember(key, 201, wo);
  }),

  http.get(`${P}/work-orders/:id`, async ({ request, params }) => {
    const g = await guard('getWorkOrder', request);
    if (g) return g;
    const wo = state.workOrders.find((w) => w.id === params.id);
    return wo ? HttpResponse.json(wo) : problem(404, 'NOT_FOUND');
  }),

  http.post(`${P}/work-orders/:id/actions/:action`, async ({ request, params }) => {
    const g = await guard('transitionWorkOrder', request);
    if (g) return g;
    const { key, hit } = replay(request);
    if (hit) return hit;
    const wo = state.workOrders.find((w) => w.id === params.id);
    if (!wo) return problem(404, 'NOT_FOUND');
    const ifMatch = request.headers.get('if-match');
    if (ifMatch !== `"${wo.version}"`) return problem(412, 'VERSION_CONFLICT');
    const text = await request.text();
    const body = (text ? JSON.parse(text) : {}) as {
      note?: string;
      partsExpectedDate?: string;
      resultNote?: string;
      photoAttachmentIds?: string[];
    };
    state.bodies.push({ op: 'transitionWorkOrder', body: { ...body, action: params.action } });
    const from = wo.status;
    const who = user()!.name;
    switch (params.action) {
      case 'accept':
        if (wo.status !== 'new')
          return problem(409, 'INVALID_TRANSITION', { currentState: wo.status });
        wo.status = 'in_progress';
        wo.acceptedAt = new Date().toISOString();
        wo.assigneeName = wo.assigneeName ?? who;
        break;
      case 'wait-parts':
        if (wo.status !== 'in_progress')
          return problem(409, 'INVALID_TRANSITION', { currentState: wo.status });
        if (
          !body.note ||
          body.note.length < 3 ||
          (wo.severity !== 'high' && !body.partsExpectedDate)
        ) {
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'note', code: 'REQUIRED' }],
          });
        }
        wo.status = 'waiting_parts';
        wo.partsNote = body.note;
        wo.partsExpectedDate = body.partsExpectedDate;
        break;
      case 'resume':
        if (wo.status !== 'waiting_parts')
          return problem(409, 'INVALID_TRANSITION', { currentState: wo.status });
        wo.status = 'in_progress';
        break;
      case 'complete': {
        if (wo.status !== 'in_progress' && wo.status !== 'waiting_parts') {
          return problem(409, 'INVALID_TRANSITION', { currentState: wo.status });
        }
        if (!body.resultNote || body.resultNote.length < 3) {
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'resultNote', code: 'REQUIRED' }],
          });
        }
        if (wo.severity !== 'low' && !body.photoAttachmentIds?.length) {
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'photoAttachmentIds', code: 'EVIDENCE_REQUIRED' }],
          });
        }
        wo.status = 'done';
        wo.doneAt = new Date().toISOString();
        wo.resultNote = body.resultNote;
        if (wo.roomBlock) {
          wo.roomBlock = {
            ...wo.roomBlock,
            status: 'released',
            endDateActual: plusDays(today(), 1),
          };
          const r = state.rooms.find((x) => x.no === wo.roomNo);
          if (r && r.status === 'OOO') {
            r.status = 'VD';
            r.version++;
          }
        }
        break;
      }
      default:
        return problem(409, 'INVALID_TRANSITION', { currentState: wo.status });
    }
    wo.version++;
    wo.history = [
      ...(wo.history ?? []),
      { at: new Date().toISOString(), actorName: who, change: 'status', from, to: wo.status },
    ];
    return remember(key, 200, wo);
  }),
];
