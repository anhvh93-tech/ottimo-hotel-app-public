/**
 * V5-46 server half (FB-R5-SEC-BE-V546-01 Major; OpenAPI 0.3.12 (i); ARC FB-R4-ARC-BE-PR24PM-01 guest-portal part;
 * SR-LOG-04) on the real PostgreSQL through the guest HTTP surface: the two fields a GUEST types in the guest
 * portal – `createGuestRequest.note` and `updateOnlineCheckin.arrivalNote` – refuse a text that looks like an
 * identity-document number (the ID half of shared/sensitive-number.ts) with 422 VALIDATION_FAILED
 * `errors[{ field, code: ID_NUMBER_DETECTED }]`, only `field` + `code`:
 * - nothing is stored: no guest_request, no housekeeping task, no work order, no audit, no notification, no outbox;
 *   the online check-in row is left as it was (no ETA either – the guest stays on the ETA step);
 * - the number never reaches the request log or the process output;
 * - card first: a text with a card number AND an ID-like number keeps `CARD_NUMBER_DETECTED` (unchanged);
 * - control: a clean note is stored and copied to the HK task / work order as before.
 * Fake clock (T0 = 15/10/2026 09:00 VN). FAKE numbers only (`079000000000` – the FE test constant – and a
 * made-up passport / MRZ line).
 */
import { randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { RATE_LIMITER, type RateLimiter } from '../../src/modules/identity/public/rate-limiter';
import { looksLikeCard } from '../../src/shared/sensitive-number';
import { containsCardNumber } from '../../src/shared/validation';
import { type FeatureApp, P, cookieValue, startFeatureApp } from '../helpers/feature-app';
import {
  GUEST_TEST_ORIGIN,
  guest,
  seedStay,
  setStayStatus,
  staff,
} from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const NOTICE = 'privacy-2026-10-v1';
/** FAKE identity numbers – each must be refused as an ID (never a real person's). */
const FAKE_CCCD = '079000000000';
const FAKE_PASSPORT = 'C1234567';
const ID_TEXTS = [
  `Số CCCD của tôi ${FAKE_CCCD}`,
  `CCCD 079 000 000 000, 2 người`,
  `Hộ chiếu ${FAKE_PASSPORT}`,
  `${FAKE_PASSPORT}<0VNM9001019M3001018<<<<<<<<<<<<<<00`,
];
/** A test card number (Luhn) next to an ID-like number → the card code wins (card first). */
const CARD_AND_ID = `Thẻ 4111 1111 1111 1111, CCCD ${FAKE_CCCD}`;
/**
 * ARC FB-R5-ARC-BE-V546-01 (1): a test card number only the ORIGINAL V-09 rule catches (a known miss of the
 * detector's card half, shared/validation.ts) – still `CARD_NUMBER_DETECTED`: the guest portal keeps
 * `containsCardNumber` first, never the narrower `sensitiveNumberKind` card half.
 */
const CARD_OLD_RULE_ONLY = 'Thẻ 4111 1111 11-11 1111';
/** ARC FB-R5-ARC-BE-V546-01: texts that must still go through (no card, no ID). */
const CLEAN_TEXTS = [
  'Phòng 202 và 203 cần thêm gối',
  'Chuyến bay VN 1234 hạ cánh 21:30',
  'Đến lúc 22h30 ngày 23.10.2026',
  'Đã chuyển 1.500.000 VND tiền cọc',
  'Gọi tôi số +84 905 111 222',
  'Mã đặt chỗ Agoda 482913',
];
/**
 * ARC FB-R5-ARC-BE-113-01: known over-blocks, accepted by SEC since PR #24 (G2) – three room numbers with no word
 * between them, and a bare 9-digit number. Refused as an ID on purpose: pinned so a change of the detector shows here.
 */
const KNOWN_OVERBLOCK = ['phòng 201 202 203 cần thêm khăn', 'Booking 123456789'];
/** Sample (fake) numbers that must never leave the request in any form – not secrets (SEC FB-R5-SEC-BE-113-01). */
const MUST_NOT_APPEAR = [FAKE_CCCD, '079 000 000 000', FAKE_PASSPORT, '9001019'];

const TABLES = [
  'guest_request',
  'hk_task',
  'work_order',
  'audit_event',
  'staff_notification',
  'outbox_message',
];

describe.skipIf(!HAS_DB)('V5-46 – ID numbers refused in guest-typed notes (BE-A1)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const lines: string[] = [];
  const tok = (u: string) => t.users[u]!.sessionToken;
  let inHouse: { reservationId: string; sid: string };
  let arriving: { reservationId: string; sid: string };

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: { fd: ['front_desk'], hk: ['housekeeping'] } });
    ids = await seedBooking(db, t);
    const sink = new Writable({
      write(chunk, _enc, cb) {
        lines.push(String(chunk));
        cb();
      },
    });
    fa = await startFeatureApp(db, {
      guestOrigins: [GUEST_TEST_ORIGIN],
      logStream: sink,
      logLevel: 'trace',
    });
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });
  beforeEach(() => fa.app.get<RateLimiter>(RATE_LIMITER).resetAll());

  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  /** Row count of every table a guest write may touch (tenant scope, RLS). */
  const counts = async () => {
    const out: Record<string, number> = {};
    for (const table of TABLES) {
      out[table] = (await q<{ n: number }>(`SELECT count(*)::int AS n FROM ${table}`))[0]!.n;
    }
    return out;
  };
  async function session(reservationId: string): Promise<string> {
    const link = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/reservations/${reservationId}/guest-link`,
    );
    expect(link.statusCode, link.body).toBe(201);
    const open = await guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token: new URL(link.json().url).pathname.slice(3) },
      headers: { 'x-forwarded-for': '9.9.9.9', 'accept-language': 'vi-VN' },
    });
    expect(open.statusCode, open.body).toBe(200);
    return cookieValue(open, 'ottimo_gsid') as string;
  }
  /** Runs `fn` with the process output captured too (Nest logger, console). */
  async function captured<T>(fn: () => Promise<T>): Promise<{ value: T; text: string }> {
    const out: string[] = [];
    const origOut = process.stdout.write.bind(process.stdout);
    const origErr = process.stderr.write.bind(process.stderr);
    process.stdout.write = ((s: string | Uint8Array, ...rest: unknown[]) => {
      out.push(String(s));
      return origOut(s as string, ...(rest as []));
    }) as typeof process.stdout.write;
    process.stderr.write = ((s: string | Uint8Array, ...rest: unknown[]) => {
      out.push(String(s));
      return origErr(s as string, ...(rest as []));
    }) as typeof process.stderr.write;
    const from = lines.length;
    try {
      const value = await fn();
      return { value, text: lines.slice(from).join('') + out.join('') };
    } finally {
      process.stdout.write = origOut;
      process.stderr.write = origErr;
    }
  }
  const refusedAsId = (
    r: { statusCode: number; body: string; json(): Record<string, unknown> },
    field: string,
  ) => {
    expect(r.statusCode, r.body).toBe(422);
    expect(r.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field, code: 'ID_NUMBER_DETECTED' }],
    });
    // Only `field` + `code`: no detail, no echo of what was typed.
    expect(r.json().detail).toBeUndefined();
    expect(
      (r.json().errors as Array<Record<string, unknown>>).map((e) => Object.keys(e).sort()),
    ).toEqual([['code', 'field']]);
    for (const s of MUST_NOT_APPEAR) expect(r.body).not.toContain(s);
  };

  it('setup 15/10 09:00: an in-house stay (requests) and a stay arriving today (online check-in)', async () => {
    await at('2026-10-15T09:00:00+07:00');
    const a = await seedStay(db, t, ids, {
      status: 'in_house',
      roomNo: '202',
      departure: '2026-10-18',
    });
    await setStayStatus(db, t, a.reservationId, 'in_house', {
      actualCheckinAt: new Date('2026-10-14T15:00:00+07:00'),
    });
    inHouse = { reservationId: a.reservationId, sid: await session(a.reservationId) };
    const b = await seedStay(db, t, ids, { roomNo: '203', adults: 1 });
    arriving = { reservationId: b.reservationId, sid: await session(b.reservationId) };
  });

  it('createGuestRequest.note: CCCD / passport / MRZ → 422 ID_NUMBER_DETECTED for HK, MT and FD types; nothing stored, nothing copied to HK or MT, nothing logged', async () => {
    const before = await counts();
    const { text } = await captured(async () => {
      for (const type of ['amenities', 'report_issue', 'other'] as const) {
        for (const note of ID_TEXTS) {
          const r = await guest(fa, inHouse.sid, 'POST', '/v1/guest/requests', {
            json: { type, note },
          });
          refusedAsId(r, 'note');
        }
      }
    });
    expect(await counts()).toEqual(before);
    const notes = await q<{ note: string | null }>(
      `SELECT note FROM guest_request WHERE note IS NOT NULL
       UNION ALL SELECT note FROM hk_task WHERE note IS NOT NULL
       UNION ALL SELECT description FROM work_order WHERE description IS NOT NULL`,
    );
    for (const s of MUST_NOT_APPEAR) {
      expect(notes.some((n) => (n.note ?? '').includes(s))).toBe(false);
      expect(text).not.toContain(s);
    }
    expect(lines.length).toBeGreaterThan(0); // the request log was captured
  });

  it('createGuestRequest.note: card first, shape unchanged – a card next to an ID-like number, and a card only the original V-09 rule catches → CARD_NUMBER_DETECTED', async () => {
    // The regression case is meaningful: the detector's card half misses it, the original rule does not.
    expect(looksLikeCard(CARD_OLD_RULE_ONLY)).toBe(false);
    expect(containsCardNumber(CARD_OLD_RULE_ONLY)).toBe(true);
    const before = await counts();
    for (const note of [CARD_AND_ID, CARD_OLD_RULE_ONLY]) {
      const r = await guest(fa, inHouse.sid, 'POST', '/v1/guest/requests', {
        json: { type: 'amenities', note },
      });
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json()).toMatchObject({
        code: 'CARD_NUMBER_DETECTED',
        errors: [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }],
      });
    }
    expect(await counts()).toEqual(before);
  });

  it('createGuestRequest.note: room numbers, a flight, a time, a date, an amount with its unit, a +84 phone, a booking code still go through', async () => {
    for (const note of CLEAN_TEXTS) {
      const r = await guest(fa, inHouse.sid, 'POST', '/v1/guest/requests', {
        json: { type: 'other', note },
      });
      expect(r.statusCode, `${note}: ${r.body}`).toBe(201);
    }
  });

  it('control: clean notes are stored and copied to the HK task and the work order as before', async () => {
    const hk = await guest(fa, inHouse.sid, 'POST', '/v1/guest/requests', {
      json: { type: 'amenities', note: 'Thêm 2 khăn tắm' },
    });
    expect(hk.statusCode, hk.body).toBe(201);
    const mt = await guest(fa, inHouse.sid, 'POST', '/v1/guest/requests', {
      json: { type: 'report_issue', note: 'Vòi sen phòng tắm bị rỉ nước' },
    });
    expect(mt.statusCode, mt.body).toBe(201);
    const [task] = await q<{ note: string | null }>(
      `SELECT t.note FROM guest_request g JOIN hk_task t ON t.id = g.hk_task_id WHERE g.id = $1`,
      [hk.json().id],
    );
    expect(task?.note).toBe('Thêm 2 khăn tắm');
    const [wo] = await q<{ description: string | null }>(
      `SELECT w.description FROM guest_request g JOIN work_order w ON w.id = g.work_order_id WHERE g.id = $1`,
      [mt.json().id],
    );
    expect(wo?.description).toBe('Vòi sen phòng tắm bị rỉ nước');
  });

  it('updateOnlineCheckin.arrivalNote: ID-like note → 422 ID_NUMBER_DETECTED, the whole write refused (ETA not saved), nothing logged; card first; a clean note is saved', async () => {
    const read = await guest(fa, arriving.sid, 'PUT', '/v1/guest/online-checkin', {
      json: { noticeVersion: NOTICE },
    });
    expect(read.statusCode, read.body).toBe(200);
    const row = () =>
      q(`SELECT * FROM online_checkin WHERE reservation_id = $1`, [arriving.reservationId]);
    const stored = await row();
    expect(stored).toHaveLength(1);
    // ARC FB-R5-ARC-BE-V546-01 (3): the SR-RL-05 write counter is part of the row – a refused write is not counted.
    const writes = () =>
      q<{ write_count: number; write_count_date: string | null }>(
        `SELECT write_count, write_count_date::text AS write_count_date FROM online_checkin
          WHERE reservation_id = $1`,
        [arriving.reservationId],
      );
    const counted = await writes();
    expect(counted[0]!.write_count).toBeGreaterThan(0);
    const before = await counts();
    const { text } = await captured(async () => {
      for (const arrivalNote of ID_TEXTS) {
        const r = await guest(fa, arriving.sid, 'PUT', '/v1/guest/online-checkin', {
          json: { etaTime: '21:30', arrivalNote, currentStep: 'consent' },
        });
        refusedAsId(r, 'arrivalNote');
      }
    });
    expect(await row()).toEqual(stored);
    expect(await writes()).toEqual(counted);
    expect(await counts()).toEqual(before);
    for (const s of MUST_NOT_APPEAR) expect(text).not.toContain(s);
    for (const arrivalNote of [CARD_AND_ID, CARD_OLD_RULE_ONLY]) {
      const card = await guest(fa, arriving.sid, 'PUT', '/v1/guest/online-checkin', {
        json: { etaTime: '21:30', arrivalNote },
      });
      expect(card.statusCode, card.body).toBe(422);
      expect(card.json()).toMatchObject({
        code: 'CARD_NUMBER_DETECTED',
        errors: [{ field: 'arrivalNote', code: 'CARD_NUMBER_DETECTED' }],
      });
    }
    expect(await row()).toEqual(stored);
    expect(await writes()).toEqual(counted);
    for (const arrivalNote of CLEAN_TEXTS) {
      const r = await guest(fa, arriving.sid, 'PUT', '/v1/guest/online-checkin', {
        json: { arrivalNote },
      });
      expect(r.statusCode, `${arrivalNote}: ${r.body}`).toBe(200);
    }
    const ok = await guest(fa, arriving.sid, 'PUT', '/v1/guest/online-checkin', {
      json: { etaTime: '21:30', arrivalNote: 'Đến bằng xe khách đêm, phòng 2 người' },
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().etaTime).toBe('21:30');
    const [saved] = await q<{ arrival_note: string | null }>(
      `SELECT arrival_note FROM online_checkin WHERE reservation_id = $1`,
      [arriving.reservationId],
    );
    expect(saved?.arrival_note).toBe('Đến bằng xe khách đêm, phòng 2 người');
  });

  it('ARC 113-01: known over-blocks (SEC PR24 G2 – chặn thừa đã chấp nhận) → 422 ID_NUMBER_DETECTED on both guest fields', async () => {
    for (const text of KNOWN_OVERBLOCK) {
      refusedAsId(
        await guest(fa, inHouse.sid, 'POST', '/v1/guest/requests', {
          json: { type: 'other', note: text },
        }),
        'note',
      );
      refusedAsId(
        await guest(fa, arriving.sid, 'PUT', '/v1/guest/online-checkin', {
          json: { arrivalNote: text },
        }),
        'arrivalNote',
      );
    }
  });

  it('SEC 113-01: a refused createGuestRequest leaves no idempotency_key row (no request hash of a body with an ID number); the same key with a clean text then goes through', async () => {
    // idempotency_key is per organization (RLS), not per property – read by the key the test sent. Only
    // createGuestRequest takes an Idempotency-Key; the online check-in PUT does not (its refusal is pinned by the
    // row comparison of the arrivalNote case above).
    const keys = async (key: string) =>
      (
        await q<{ n: number }>('SELECT count(*)::int AS n FROM idempotency_key WHERE key = $1', [
          key,
        ])
      )[0]!.n;
    const reqKey = randomUUID();
    refusedAsId(
      await guest(fa, inHouse.sid, 'POST', '/v1/guest/requests', {
        json: { type: 'other', note: ID_TEXTS[0] },
        idem: reqKey,
      }),
      'note',
    );
    expect(await keys(reqKey)).toBe(0);
    const reqOk = await guest(fa, inHouse.sid, 'POST', '/v1/guest/requests', {
      json: { type: 'other', note: CLEAN_TEXTS[0] },
      idem: reqKey,
    });
    expect(reqOk.statusCode, reqOk.body).toBe(201);
    expect(await keys(reqKey)).toBe(1);
    const stored = await q<{ request_hash: string; response_body: unknown }>(
      'SELECT request_hash, response_body FROM idempotency_key WHERE key = $1',
      [reqKey],
    );
    for (const s of MUST_NOT_APPEAR) expect(JSON.stringify(stored)).not.toContain(s);
  });
});
