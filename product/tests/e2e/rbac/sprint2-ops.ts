// Sprint 2 operations for the RBAC runner (plan R2 mục 4 Sprint 2: EP02 rack/đơn/chống trùng/OOO/no-show,
// EP11 báo giá/giữ chỗ/cọc, US-139 xung đột OTA). Same modes as sprint1-ops.ts – only the ROLE GATE is observed:
//   read    – GET with valid parameters; item reads use a random id → an allowed role gets 404 (gate passed)
//   invalid – non-idempotent write (calculateQuote, updateReservation, updateRoomBlock): deliberately invalid
//             body / random id → refused role 403, allowed role 404/412/422; nothing written
//   valid   – idempotent write (Idempotency-Key): schema-valid body pointing at random ids (reservation, quote,
//             lead, room, guest, channel) → allowed role 404/409/422; nothing durable is created
// No case books a room-night: the business flows run in api/*.api.spec.ts with their own cleanup.
import type { APIRequestContext } from '@playwright/test';
import { propertyIdOf, session, uuid } from '../support/api.js';
import type { OpDef, Prepared } from './sprint1-ops.js';

export interface Fixtures2 {
  propertyId: string;
  /** far-future arrival inside the booking window (BR-112), never booked by the runner */
  arrival: string;
  departure: string;
}

let fx: Promise<Fixtures2> | null = null;

export function fixtures2(ctx: APIRequestContext): Promise<Fixtures2> {
  fx ??= (async () => {
    const owner = await session(ctx, 'qa.owner');
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 300);
    const arrival = d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 2);
    return { propertyId: propertyIdOf(owner), arrival, departure: d.toISOString().slice(0, 10) };
  })();
  return fx;
}

type Prep2 = (f: Fixtures2) => Prepared;
export interface OpDef2 {
  mode: OpDef['mode'];
  prepare: Prep2;
}

const P = (f: Fixtures2, extra: Record<string, string> = {}) => ({
  propertyId: f.propertyId,
  ...extra,
});
const NF = [404];
const read = (q?: (f: Fixtures2) => Prepared['query']): OpDef2 => ({
  mode: 'read',
  prepare: (f) => ({ params: P(f), ...(q ? { query: q(f) } : {}) }),
});
const readById = (key: string, q?: Prepared['query']): OpDef2 => ({
  mode: 'read',
  prepare: (f) => ({
    params: P(f, { [key]: uuid() }),
    ...(q ? { query: q } : {}),
    accept: NF,
    note: `${key} ngẫu nhiên → vai được phép nhận 404`,
  }),
});
/** reservation action with Idempotency-Key + If-Match on a random reservation */
const resAction = (body: (f: Fixtures2) => Record<string, unknown>): OpDef2 => ({
  mode: 'valid',
  prepare: (f) => ({
    params: P(f, { reservationId: uuid() }),
    idempotencyKey: true,
    ifMatch: '"0"',
    body: body(f),
    accept: [404, 412],
    note: 'reservationId ngẫu nhiên → 404',
  }),
});

export const SPRINT2_OPS: Record<string, OpDef2> = {
  // ── rack, tìm phòng, đơn (EP02) ──
  getRack: read((f) => ({ from: f.arrival, days: 14 })),
  searchAvailability: read((f) => ({ arrival: f.arrival, departure: f.departure })),
  listReservations: read(() => ({ limit: 5 })),
  getReservation: readById('reservationId'),
  getReservationHistory: readById('reservationId'),
  listParty: readById('reservationId'),
  listOverbookingIncidents: read(),
  createReservation: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f),
      idempotencyKey: true,
      body: {
        roomId: uuid(),
        channelId: uuid(),
        arrivalDate: f.arrival,
        departureDate: f.departure,
        adults: 2,
        bookerGuestId: uuid(),
        paymentModel: 'direct',
      },
      accept: [404, 409, 422],
      note: 'roomId/channelId/bookerGuestId ngẫu nhiên → không tạo đơn',
    }),
  },
  updateReservation: {
    mode: 'invalid',
    prepare: (f) => ({
      params: P(f, { reservationId: uuid() }),
      ifMatch: '"0"',
      body: { adults: 0 },
      accept: [404, 412, 422],
    }),
  },
  extendHold: resAction(() => ({ extraHours: 1 })),
  confirmDeposit: resAction(() => ({
    payment: { type: 'deposit', method: 'cash', amountVnd: 100000 },
  })),
  cancelReservation: resAction(() => ({ reasonCode: 'other', note: 'E2E RBAC' })),
  moveReservation: resAction((f) => ({ arrivalDate: f.arrival, reasonCode: 'other' })),
  markNoShow: resAction(() => ({ contactAttemptNote: 'E2E RBAC' })),
  restoreNoShow: resAction(() => ({ reason: 'E2E RBAC' })),
  changeRoom: resAction((f) => ({
    newRoomId: uuid(),
    effectiveDate: f.arrival,
    cause: 'guest_request',
    reason: 'E2E RBAC',
  })),
  assignRoom: resAction(() => ({ roomId: uuid(), resolution: 'reassigned_same_group' })),
  swapRoom: resAction(() => ({ otherReservationId: uuid(), otherVersion: 0, reason: 'E2E RBAC' })),
  addPartyMember: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f, { reservationId: uuid() }),
      idempotencyKey: true,
      body: { role: 'child', childName: 'Be Etoe', childBirthYear: 2020 },
      accept: [404, 422],
      note: 'reservationId ngẫu nhiên → 404',
    }),
  },
  createDepositNotice: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f, { reservationId: uuid() }),
      idempotencyKey: true,
      body: { amountVnd: 100000, note: 'E2E RBAC' },
      accept: NF,
      note: 'reservationId ngẫu nhiên → 404',
    }),
  },

  // ── báo giá, giữ chỗ, lead, hoa hồng (EP11) ──
  calculateQuote: {
    mode: 'invalid',
    prepare: (f) => ({
      params: P(f),
      body: { type: 'short', arrivalDate: f.arrival, adults: 2, channelId: uuid() },
      accept: [404, 422],
      note: 'thiếu nights + channelId ngẫu nhiên → 422/404',
    }),
  },
  listQuotes: read(() => ({ limit: 5 })),
  getQuote: readById('quoteId'),
  getQuoteText: readById('quoteId', { locale: 'en' }),
  saveQuote: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f),
      idempotencyKey: true,
      body: {
        type: 'short',
        roomId: uuid(),
        arrivalDate: f.arrival,
        nights: 2,
        adults: 2,
        channelId: uuid(),
        guestId: uuid(),
      },
      accept: [404, 422],
      note: 'roomId/channelId/guestId ngẫu nhiên → không lưu',
    }),
  },
  withdrawQuote: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f, { quoteId: uuid() }),
      idempotencyKey: true,
      accept: NF,
      note: 'quoteId ngẫu nhiên → 404',
    }),
  },
  createHoldFromQuote: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f, { quoteId: uuid() }),
      idempotencyKey: true,
      body: { holdHours: 24 },
      accept: NF,
      note: 'quoteId ngẫu nhiên → 404',
    }),
  },
  listLeads: read(() => ({ limit: 5 })),
  changeLeadStage: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f, { leadId: uuid() }),
      idempotencyKey: true,
      ifMatch: '"0"',
      body: { toStage: 'lost', lostReasonCode: 'other', note: 'E2E RBAC' },
      accept: [404, 412],
      note: 'leadId ngẫu nhiên → 404',
    }),
  },
  listCommissions: read(() => ({ limit: 5 })),

  // ── khóa phòng OOO (US-019, US-061 phần khối) ──
  listRoomBlocks: read((f) => ({ from: f.arrival, to: f.departure })),
  createRoomBlock: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f),
      idempotencyKey: true,
      body: {
        roomId: uuid(),
        startDate: f.arrival,
        endDatePlanned: f.departure,
        reason: 'E2E RBAC',
      },
      accept: [404, 422],
      note: 'roomId ngẫu nhiên → không tạo khối',
    }),
  },
  updateRoomBlock: {
    mode: 'invalid',
    prepare: (f) => ({
      params: P(f, { roomBlockId: uuid() }),
      ifMatch: '"0"',
      body: { endDatePlanned: f.departure },
      accept: [404, 412],
      note: 'roomBlockId ngẫu nhiên → 404',
    }),
  },

  // ── nhắc giữ chỗ sắp hết hạn (US-085 AC2) ──
  listAttentionItems: read(),
  listMyNotifications: {
    mode: 'read',
    prepare: () => ({ params: {}, query: { limit: 5 } }),
  },
};
