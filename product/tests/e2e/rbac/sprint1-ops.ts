// Sprint 1 operations for the RBAC runner (plan R2 mục 4: EP00 identity/devices, platform rooms+params,
// guests, audit, approvals). Each definition says how to call the operation so that ONLY the role gate is
// observed (rbac-cases.json "$comment": kỳ vọng chỉ là CỔNG VAI) – without lasting side effects:
//   read     – plain GET/lookup, valid parameters
//   invalid  – non-idempotent write: the guard enforces x-roles before the handler, so a deliberately
//              invalid body is safe (403 for refused roles, 422/412 for allowed roles, nothing written)
//   valid    – idempotent write (Idempotency-Key): the role decision is applied by UnitOfWork AFTER the
//              replay lookup, i.e. after body validation may run → the body must be schema-valid. We use
//              throwaway data or a business-invalid reference (random id) so nothing durable is created
//              except throwaway users/guests.
//   logout   – kills the session → run last, in project rbac-logout
//   r3       – story Must R3 (2FA) → pending
import type { APIRequestContext } from '@playwright/test';
import {
  call,
  propertyIdOf,
  seedReauth,
  session,
  uniq,
  uniqName,
  uuid,
  type StaffSession,
} from '../support/api.js';
import type { Subject } from '../support/env.js';

export type Mode = 'read' | 'invalid' | 'valid' | 'logout' | 'r3';

export interface Prepared {
  params: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  idempotencyKey?: boolean;
  ifMatch?: string;
  /** Extra statuses that still prove "gate passed" for an allowed role (beyond 2xx). */
  accept?: number[];
  note?: string;
}

export interface Fixtures {
  propertyId: string;
  /** a real user id that rbac calls may point at with an invalid body (qa.hk) */
  victimUserId: string;
  roomId: string | null;
  /** guest visible to every role with scope "all" (created by qa.owner) */
  ownerGuestId: string | null;
  /** guests created by the scoped roles themselves (scope own) */
  ownGuestIds: Partial<Record<Subject, string>>;
}

export interface OpDef {
  mode: Mode;
  prepare: (
    ctx: APIRequestContext,
    s: StaffSession | null,
    subject: string,
    f: Fixtures,
  ) => Promise<Prepared>;
}

const P = (f: Fixtures, extra: Record<string, string> = {}) => ({
  propertyId: f.propertyId,
  ...extra,
});
const read = (q?: Prepared['query'], params?: (f: Fixtures) => Record<string, string>): OpDef => ({
  mode: 'read',
  prepare: async (_c, _s, _sub, f) => ({
    params: params ? params(f) : P(f),
    ...(q ? { query: q } : {}),
  }),
});

function guestFor(subject: string, f: Fixtures): { id: string; note?: string } {
  const own = f.ownGuestIds[subject as Subject];
  if (own) return { id: own };
  if (f.ownerGuestId) return { id: f.ownerGuestId };
  return { id: uuid(), note: 'chưa tạo được khách (createGuest chưa có) – id ngẫu nhiên' };
}

export const SPRINT1_OPS: Record<string, OpDef> = {
  // ── auth / me ──
  getMe: read(undefined, () => ({})),
  logout: { mode: 'logout', prepare: async () => ({ params: {} }) },
  changeMyPassword: {
    mode: 'invalid',
    prepare: async () => ({
      params: {},
      body: { currentPassword: 'x'.repeat(8), newPassword: 'short' },
      // Server re-authenticates before validating newPassword (identity me.controller) → 401 REAUTH_FAILED
      // also proves the role gate let the call through.
      accept: [401, 422],
      note: 'mật khẩu hiện tại sai / newPassword < 10 ký tự → 401 REAUTH_FAILED hoặc 422 (không đổi mật khẩu)',
    }),
  },
  setMyApprovalPin: {
    mode: 'invalid',
    prepare: async () => ({ params: {}, body: { currentPassword: 'x', pin: '12' }, accept: [422] }),
  },
  stepUp: {
    mode: 'invalid',
    prepare: async () => ({ params: {}, body: { pin: 'ab' }, accept: [422] }),
  },
  getMy2fa: { mode: 'r3', prepare: async () => ({ params: {} }) },
  disableMy2fa: { mode: 'r3', prepare: async () => ({ params: {} }) },
  startMy2faSetup: { mode: 'r3', prepare: async () => ({ params: {} }) },
  confirmMy2fa: { mode: 'r3', prepare: async () => ({ params: {} }) },

  // ── users (A100, owner only) ──
  listUsers: read(undefined, () => ({})),
  createUser: {
    mode: 'valid',
    prepare: async (_c, _s, sub, f) => ({
      params: {},
      idempotencyKey: true,
      body: {
        username: `qa.e2e.rb${uniq(8)}`,
        displayName: 'Qa Rbac tạm',
        initialPassword: `E2e-${uniq(12)}-tmp`,
        roles: [{ propertyId: f.propertyId, role: 'housekeeping' }],
        // CỔNG S2 (SEC 06.26): only the caller's own password, and only for the allowed role – a refused role
        // gets 403 before S2 is looked at (and never carries another account's password).
        ...(sub === 'qa.owner' ? { reauth: seedReauth() } : {}),
      },
      note: 'owner tạo tài khoản tạm qa.e2e.rb* (kèm S2)',
    }),
  },
  updateUser: {
    mode: 'invalid',
    prepare: async (_c, _s, _sub, f) => ({
      params: { userId: f.victimUserId },
      ifMatch: '"0"',
      body: { status: 'not_a_status' },
      accept: [412, 422],
    }),
  },
  setUserRoles: {
    mode: 'invalid',
    prepare: async (_c, _s, _sub, f) => ({
      params: { userId: f.victimUserId },
      ifMatch: '"0"',
      body: { roles: 'not_an_array' },
      accept: [412, 422],
    }),
  },

  // ── trusted devices (owner only) ──
  listTrustedDevices: read(),
  trustCurrentDevice: {
    mode: 'valid',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f),
      idempotencyKey: true,
      body: {
        name: 'E2E RBAC',
        deviceKind: 'desk',
        currentPassword: 'wrong-password-e2e',
        hardeningChecklistConfirmed: false,
      },
      accept: [401, 422],
      note: 'mật khẩu xác nhận sai → owner nhận 401 REAUTH_FAILED/422, không cấp thiết bị',
    }),
  },
  revokeTrustedDevice: {
    mode: 'valid',
    prepare: async (_c, _s, sub, f) => ({
      params: P(f, { deviceId: uuid() }),
      idempotencyKey: true,
      // CỔNG S2 (SEC 06.27): S2 is verified before the device lookup – without it the owner gets 422.
      body: { reason: 'E2E RBAC', ...(sub === 'qa.owner' ? { reauth: seedReauth() } : {}) },
      accept: [404],
      note: 'deviceId ngẫu nhiên → owner 404 (kèm S2)',
    }),
  },

  // ── platform ──
  listRoomGroups: read(),
  listRooms: read(),
  listChannels: read(),
  createRoom: {
    mode: 'valid',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f),
      idempotencyKey: true,
      body: {
        roomNo: `Z${uniq(4).toUpperCase()}`,
        roomGroupId: uuid(),
        monthlyListPriceVnd: 9000000,
      },
      accept: [404, 409, 422],
      note: 'roomGroupId ngẫu nhiên → không tạo căn',
    }),
  },
  updateRoom: {
    mode: 'invalid',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f, { roomId: f.roomId ?? uuid() }),
      ifMatch: '"0"',
      body: { maxOccupancy: 99 },
      accept: f.roomId ? [412, 422] : [404, 412, 422],
      ...(f.roomId ? {} : { note: 'chưa có căn DS-E – roomId ngẫu nhiên' }),
    }),
  },
  listParameters: read(),
  getParameterHistory: read(undefined, (f) => P(f, { key: 'hold_hours_default' })),
  setParameter: {
    mode: 'invalid',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f, { key: 'hold_hours_default' }),
      body: { value: 24 },
      accept: [422],
      note: 'thiếu effectiveFrom/reason → 422',
    }),
  },

  // ── guests ──
  searchGuests: read({ q: 'qa' }),
  lookupGuestByContact: {
    mode: 'read',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f),
      body: { email: `nobody.${uniq()}@example.test` },
    }),
  },
  createGuest: {
    mode: 'valid',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f),
      idempotencyKey: true,
      body: { fullName: `Qa Rbac ${uniqName()}`, email: `e2e.rb.${uniq(8)}@example.test` },
    }),
  },
  getGuest: {
    mode: 'read',
    prepare: async (_c, _s, sub, f) => {
      const g = guestFor(sub, f);
      return {
        params: P(f, { guestId: g.id }),
        ...(g.note ? { note: g.note, accept: [404] } : {}),
      };
    },
  },
  updateGuest: {
    mode: 'invalid',
    prepare: async (_c, _s, sub, f) => {
      const g = guestFor(sub, f);
      return {
        params: P(f, { guestId: g.id }),
        ifMatch: '"0"',
        body: { fullName: '' },
        accept: g.note ? [404, 412, 422] : [412, 422],
        ...(g.note ? { note: g.note } : {}),
      };
    },
  },

  // ── audit ──
  listAuditEvents: read({ limit: 5 }),
  listC3AccessLog: read({ limit: 5 }),

  // ── approvals (no approval source before folio/FOC → random id) ──
  listApprovalRequests: read({ limit: 5 }),
  approveRequest: {
    mode: 'valid',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f, { approvalId: uuid() }),
      idempotencyKey: true,
      body: { authMethod: 'password', secret: 'wrong-secret-e2e' },
      accept: [401, 404],
      note: 'approvalId ngẫu nhiên → 404 (chưa có nguồn yêu cầu duyệt trước folio/FOC)',
    }),
  },
  rejectRequest: {
    mode: 'valid',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f, { approvalId: uuid() }),
      idempotencyKey: true,
      body: { authMethod: 'password', secret: 'wrong-secret-e2e', reason: 'E2E RBAC' },
      accept: [401, 404],
      note: 'approvalId ngẫu nhiên → 404',
    }),
  },
  cancelRequest: {
    mode: 'valid',
    prepare: async (_c, _s, _sub, f) => ({
      params: P(f, { approvalId: uuid() }),
      idempotencyKey: true,
      accept: [404],
      note: 'approvalId ngẫu nhiên → 404 (scope own)',
    }),
  },
};

// ───────────────────────── per-worker fixtures ─────────────────────────

let fixturesPromise: Promise<Fixtures> | null = null;

const SCOPED_GUEST_SUBJECTS: Subject[] = ['qa.sal', 'qa.ctv1'];

async function createGuestAs(
  ctx: APIRequestContext,
  s: StaffSession,
  propertyId: string,
): Promise<string | null> {
  const r = await call<{ id?: string }>(ctx, 'POST', `/v1/properties/${propertyId}/guests`, {
    session: s,
    idempotencyKey: true,
    body: { fullName: `Qa Rbac ${uniqName()}`, email: `e2e.rbfx.${uniq(8)}@example.test` },
  });
  return r.status === 201 && r.body?.id ? r.body.id : null;
}

export function fixtures(ctx: APIRequestContext): Promise<Fixtures> {
  fixturesPromise ??= (async () => {
    const owner = await session(ctx, 'qa.owner');
    const propertyId = propertyIdOf(owner);
    const hk = await session(ctx, 'qa.hk');
    const rooms = await call<Array<{ id: string }> | { data?: Array<{ id: string }> }>(
      ctx,
      'GET',
      `/v1/properties/${propertyId}/rooms`,
      { session: owner },
    );
    const list = Array.isArray(rooms.body) ? rooms.body : (rooms.body?.data ?? []);
    const roomId = rooms.status === 200 && list[0]?.id ? list[0].id : null;
    const ownerGuestId = await createGuestAs(ctx, owner, propertyId);
    const ownGuestIds: Fixtures['ownGuestIds'] = {};
    if (ownerGuestId) {
      for (const sub of SCOPED_GUEST_SUBJECTS) {
        const id = await createGuestAs(ctx, await session(ctx, sub), propertyId);
        if (id) ownGuestIds[sub] = id;
      }
    }
    return { propertyId, victimUserId: hk.me.id, roomId, ownerGuestId, ownGuestIds };
  })();
  return fixturesPromise;
}
