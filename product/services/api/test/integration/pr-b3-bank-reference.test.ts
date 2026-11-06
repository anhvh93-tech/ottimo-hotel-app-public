/**
 * PR-B3 (Round 5, v1.0.5, BE-D2) – `PaymentCreate.bankReference` over HTTP, on PostgreSQL. Contract 0.3.13 bổ sung 1
 * mục 1.21 ý 3 + 1e (SEC ARC-15) + 1f (C0313-25); FB-R5-ARC-BE-119-01, FB-R5-SEC-BE-119-02, SEC ARC-21 / ARC-24:
 * - every PaymentCreate reader declares the field (zod strips unknown keys): recordPayment, confirmDeposit (`payment.`),
 *   createReservation (`initialPayment.`), checkIn (`payment.`), checkOut (`finalPayment.`) – a card number → 422
 *   CARD_NUMBER_DETECTED with the right field, a usual code → stored upper-case;
 * - the SEC 4.3 cases on recordPayment (the reference card rule, not V-09 of free text; the note keeps V-09);
 * - pattern → VALIDATION_FAILED; another method than bank_transfer / vietqr → NOT_ALLOWED;
 * - one code, one receipt of the property: 409 DUPLICATE_BANK_REFERENCE (any case), `duplicateReservationCode` for FD+
 *   only – a sale gets the 409 without it; nothing written; a reversed receipt frees its code; two requests with the
 *   same code in another case, forced to race on the advisory lock → one 201, one 409;
 * - `Payment.bankReference` for FD+ only (x-visible-to);
 * - SEC 119-02 (2): `recordManual` (the one receipt INSERT) refuses a card number / a bad code / another method by itself;
 * - FB-R5-BE-ARC-C0313-32: on EACH path a card number → 422 with the prefix and nothing written, a lower-case code →
 *   stored upper-case, a duplicate → 409; a sale's `confirmDeposit` → 409 without the booking code; C0313-31 error
 *   order as the server has it today (a card number in `bankReference` answers first – option (B), ARC to confirm).
 * Fake clock and FAKE data only; the card numbers are the public test numbers.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { PaymentService } from '../../src/modules/payments/public/payment.service';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, type Res, startFixture } from './s438-r8/fixture';

const CARDS = [
  '4111111111111111',
  '4111-1111-1111-1111',
  '4111.1111.1111.1111',
  '4111_1111_1111_1111',
];
const NOTE = 'Thu theo sao kê';

describe.skipIf(!HAS_DB)(
  'PR-B3 – bankReference on every PaymentCreate path (ARC 119-01, SEC 119-02, ARC-15)',
  () => {
    let x: Fx;
    beforeAll(async () => {
      process.env.BLOBSTORE_PROVIDER = 'memory';
      x = await startFixture();
    });
    afterAll(async () => {
      await x?.close();
    });

    type B = { id: string; code: string; folioId: string };
    const directBody = (room: string, arrival: string, departure: string) => ({
      roomId: x.ids.rooms[room],
      channelId: x.ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: x.guest,
      paymentModel: 'direct',
      arrivalDate: arrival,
      departureDate: departure,
    });
    const direct = async (room: string, arrival: string, departure: string): Promise<B> => {
      const body = directBody(room, arrival, departure);
      let res = await x.c.fd!.send('POST', x.url('/reservations'), body);
      if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
        res = await x.c.fd!.send('POST', x.url('/reservations'), {
          ...body,
          initialPayment: {
            type: 'deposit',
            method: 'cash',
            amountVnd: res.json().depositRequiredVnd,
          },
        });
      }
      expect(res.statusCode, res.body).toBe(201);
      const j = res.json();
      return { id: j.id, code: j.code, folioId: j.folioId };
    };
    const hold = async (room: string, who: 'fd' | 'sal'): Promise<B> => {
      const svc = x.fa.app.get(ReservationsService);
      const role = { fd: 'front_desk', sal: 'sales_staff' }[who];
      const user = x.t.users[who]!.id;
      const row = await x.db.withContext(
        { ...x.t.ctx(), userId: user, actorType: 'user' },
        async (tx) => {
          const ctx = await svc.context(tx, { userId: user, roles: [role] });
          return svc.createHold(tx, ctx, {
            roomId: x.ids.rooms[room]!,
            channelId: x.ids.channels.direct!,
            arrivalDate: '2026-12-20',
            departureDate: '2026-12-22',
            adults: 2,
            children6to11: 0,
            childrenUnder6: 0,
            bookerGuestId: x.guest,
            holdHours: 24,
          });
        },
      );
      return { id: row.id, code: row.code, folioId: (await x.get(row.id)).folioId as string };
    };
    const upload = (who: string, reservationId: string) =>
      x.db.withContext(
        { ...x.t.ctx(), userId: x.t.users[who]!.id, actorType: 'user' },
        async (tx) => {
          const u = x.t.users[who]!;
          return (
            await x.fa.app
              .get(AttachmentService)
              .upload(
                tx,
                { userId: u.id, roles: u.roles },
                { purpose: 'deposit_receipt', reservationId },
                { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
              )
          ).id as string;
        },
      );
    const pay = (b: B, bankReference: unknown, extra: Record<string, unknown> = {}, who = 'fd') =>
      x.c[who]!.send('POST', x.url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'bank_transfer',
        amountVnd: 10_000,
        note: NOTE,
        bankReference,
        ...extra,
      });
    const stored = async (paymentId: string) =>
      (await x.q(`SELECT bank_reference FROM payment WHERE id = $1`, [paymentId]))[0]
        ?.bank_reference as string | undefined;
    const count = async (b: B) =>
      (await x.q(`SELECT count(*)::int AS n FROM payment WHERE folio_id = $1`, [b.folioId]))[0]
        .n as number;
    const cardRefused = (res: Res, field: string, value: string) => {
      expect(res.statusCode, res.body).toBe(422);
      expect(res.json()).toMatchObject({
        code: 'CARD_NUMBER_DETECTED',
        errors: [{ field, code: 'CARD_NUMBER_DETECTED' }],
      });
      // Never repeated in the answer (SEC 4.1).
      expect(res.body).not.toContain(value.replace(/[._-]/g, ''));
      expect(res.body).not.toContain(value);
    };
    /** Steps queued behind the advisory lock of (property, code), released once all of them wait. */
    const behindBankRefLock = async (code: string, steps: Array<() => Promise<Res>>) => {
      await Promise.all(
        Array.from({ length: steps.length + 1 }, () =>
          x.db.withContext(x.t.ctx(), (tx) => tx.query('SELECT 1')),
        ),
      );
      const holder = await x.db.pool.connect();
      const pending: Array<Promise<Res>> = [];
      try {
        await holder.query('BEGIN');
        await holder.query(
          `SELECT pg_advisory_xact_lock(hashtextextended('bank-ref:' || $1::text || ':' || $2::text, 0))`,
          [x.t.propertyIds[0], code],
        );
        const pid = (await holder.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!
          .pid;
        for (const step of steps) {
          pending.push(step());
          const until = performance.now() + 4_000;
          for (;;) {
            const { rows } = await holder.query<{ n: number }>(
              `SELECT count(*)::int AS n FROM pg_stat_activity a WHERE $1 = ANY (pg_blocking_pids(a.pid))`,
              [pid],
            );
            if (rows[0]!.n >= pending.length) break;
            if (performance.now() > until) throw new Error(`step ${pending.length} never waited`);
            await new Promise((r) => setTimeout(r, 15));
          }
        }
      } finally {
        await holder.query('ROLLBACK');
        holder.release();
      }
      return Promise.all(pending);
    };

    let d1: B;
    let d2: B;
    let hSal: B;
    it('setup', async () => {
      await x.at('2026-11-20T10:00:00+07:00');
      d1 = await direct('101', '2026-12-10', '2026-12-12');
      d2 = await direct('102', '2026-12-10', '2026-12-12');
      hSal = await hold('103', 'sal');
    }, 120_000);

    it('recordPayment – SEC 4.3: a whole card number (with or without . / _ -) → 422 CARD_NUMBER_DETECTED, never stored; letters + a Luhn window, 16 digits failing Luhn, 12 digits, the last 8 → 201 stored upper-case', async () => {
      const before = await count(d1);
      for (const card of CARDS) cardRefused(await pay(d1, card), 'bankReference', card);
      expect(await count(d1)).toBe(before);
      for (const [sent, kept] of [
        ['FT42222222222227', 'FT42222222222227'],
        ['4111111111111112', '4111111111111112'],
        ['411111111111', '411111111111'],
        ['11111111', '11111111'],
        ['  ft2611abc ', 'FT2611ABC'],
      ] as const) {
        const res = await pay(d1, sent);
        expect(res.statusCode, `${sent} ${res.body}`).toBe(201);
        expect(res.json().bankReference, sent).toBe(kept);
        expect(await stored(res.json().id), sent).toBe(kept);
      }
      // Free text keeps V-09 (every 13–19 digit window).
      const note = await pay(d1, 'FT2611NOTE', { note: 'Khách gửi 4111 1111 1111 1111' });
      expect(note.statusCode, note.body).toBe(422);
      expect(note.json().errors).toEqual([{ field: 'note', code: 'CARD_NUMBER_DETECTED' }]);
    }, 120_000);

    it('pattern → VALIDATION_FAILED, longer than 64 → TOO_LONG, another method → NOT_ALLOWED; blank = none', async () => {
      const before = await count(d1);
      const space = await pay(d1, 'FT 2611');
      expect(space.json().errors).toEqual([{ field: 'bankReference', code: 'VALIDATION_FAILED' }]);
      const long = await pay(d1, 'A'.repeat(65));
      expect(long.json().errors).toEqual([{ field: 'bankReference', code: 'TOO_LONG' }]);
      for (const method of ['cash', 'card_pos']) {
        const res = await pay(d1, 'FT2611CASH', {
          method,
          ...(method === 'card_pos' ? { posAuthCode: 'A1B2C3' } : {}),
        });
        expect(res.statusCode, res.body).toBe(422);
        expect(res.json().errors, method).toEqual([
          { field: 'bankReference', code: 'NOT_ALLOWED' },
        ]);
      }
      expect(await count(d1)).toBe(before);
      const blank = await pay(d1, '   ');
      expect(blank.statusCode, blank.body).toBe(201);
      expect(await stored(blank.json().id)).toBeNull();
    }, 60_000);

    it('S4 / ARC-15 / ARC-21 – one code one receipt (any case): 409, the other booking code for FD+ only, a sale gets none; nothing written; a reversed receipt frees the code', async () => {
      const first = await pay(d1, 'ft2611dup01');
      expect(first.statusCode, first.body).toBe(201);
      const before = await count(d2);
      for (const who of ['fd', 'lead', 'mgr', 'owner']) {
        const dup = await pay(d2, 'FT2611DUP01', {}, who);
        expect(dup.statusCode, `${who} ${dup.body}`).toBe(409);
        expect(dup.json()).toMatchObject({
          code: 'DUPLICATE_BANK_REFERENCE',
          duplicateReservationCode: d1.code,
        });
      }
      // Same booking too: one bank line is one receipt.
      expect((await pay(d1, 'Ft2611Dup01')).statusCode).toBe(409);
      // A sale on its own hold: 409 with no booking code (SR-AZ-02 – the other booking may be outside its scope).
      const img = await upload('sal', hSal.id);
      const sal = await x.c.sal!.send('POST', x.url(`/folios/${hSal.folioId}/payments`), {
        type: 'deposit',
        method: 'bank_transfer',
        amountVnd: 100_000,
        attachmentId: img,
        bankReference: 'FT2611DUP01',
      });
      expect(sal.statusCode, sal.body).toBe(409);
      expect(sal.json().code).toBe('DUPLICATE_BANK_REFERENCE');
      expect(sal.json().duplicateReservationCode).toBeUndefined();
      expect(sal.body).not.toContain(d1.code);
      expect(await count(d2)).toBe(before);
      expect(await count(hSal)).toBe(0);
      // Reversed → the code is free again.
      const rev = await x.reverse(first.json().id, 'Ghi nhầm đơn')();
      expect(rev.statusCode, rev.body).toBe(200);
      const again = await pay(d2, 'FT2611DUP01');
      expect(again.statusCode, again.body).toBe(201);
      // The sale's own receipt: stored, but `bankReference` is FD+ only on read.
      const salOk = await x.c.sal!.send('POST', x.url(`/folios/${hSal.folioId}/payments`), {
        type: 'deposit',
        method: 'bank_transfer',
        amountVnd: 100_000,
        attachmentId: img,
        bankReference: 'FT2611SAL01',
      });
      expect(salOk.statusCode, salOk.body).toBe(201);
      expect(await stored(salOk.json().id)).toBe('FT2611SAL01');
      expect(salOk.json().bankReference).toBeUndefined();
      const asSal = (await x.c.sal!.get(x.url(`/folios/${hSal.folioId}`))).json();
      expect(
        (asSal.payments as any[]).find((p) => p.id === salOk.json().id).bankReference,
      ).toBeUndefined();
      const asFd = (await x.c.fd!.get(x.url(`/folios/${hSal.folioId}`))).json();
      expect((asFd.payments as any[]).find((p) => p.id === salOk.json().id).bankReference).toBe(
        'FT2611SAL01',
      );
    }, 120_000);

    it('ARC-15 – two requests with the same code in another case, forced to race on the advisory lock: one 201, one 409', async () => {
      const results = await behindBankRefLock('PAR-0001', [
        () => pay(d1, 'par-0001', {}, 'fd'),
        () => pay(d2, 'PAR-0001', {}, 'lead'),
      ]);
      expect(
        results.map((r) => r.statusCode).sort(),
        results.map((r) => r.body).join(' | '),
      ).toEqual([201, 409]);
      expect(
        await x.q(`SELECT 1 FROM payment WHERE upper(bank_reference) = 'PAR-0001'`),
      ).toHaveLength(1);
    }, 60_000);

    it('confirmDeposit (`payment.`), createReservation (`initialPayment.`): a card number → 422 with the prefix; a usual code stored; another method → NOT_ALLOWED', async () => {
      const h = await hold('201', 'fd');
      const confirm = (bankReference: string, method = 'bank_transfer') =>
        x.act(h.id, 'confirm-deposit', {
          payment: { type: 'deposit', method, amountVnd: 100_000, bankReference },
        });
      cardRefused(await confirm('4111111111111111'), 'payment.bankReference', '4111111111111111');
      const cash = await confirm('CD-0001', 'cash');
      expect(cash.statusCode, cash.body).toBe(422);
      expect(cash.json().errors).toEqual([{ field: 'payment.bankReference', code: 'NOT_ALLOWED' }]);
      expect(await count(h)).toBe(0);
      const ok = await confirm('cd-0001');
      expect(ok.statusCode, ok.body).toBe(200);
      expect(
        (await x.q(`SELECT bank_reference FROM payment WHERE folio_id = $1`, [h.folioId])).map(
          (r) => r.bank_reference,
        ),
      ).toEqual(['CD-0001']);
      // The duplicate rule on this path too.
      const h2 = await hold('202', 'fd');
      const dup = await x.act(h2.id, 'confirm-deposit', {
        payment: {
          type: 'deposit',
          method: 'bank_transfer',
          amountVnd: 100_000,
          bankReference: 'CD-0001',
        },
      });
      expect(dup.statusCode, dup.body).toBe(409);
      expect(dup.json()).toMatchObject({
        code: 'DUPLICATE_BANK_REFERENCE',
        duplicateReservationCode: h.code,
      });
      expect(await count(h2)).toBe(0);
      // C0313-32 (i): a sale confirming its own hold with a code already used → 409 with no booking code (SEC ARC-21).
      const hs = await hold('401', 'sal');
      const salDup = await x.act(
        hs.id,
        'confirm-deposit',
        {
          payment: {
            type: 'deposit',
            method: 'bank_transfer',
            amountVnd: 100_000,
            bankReference: 'cd-0001',
          },
        },
        'sal',
      );
      expect(salDup.statusCode, salDup.body).toBe(409);
      expect(salDup.json().code).toBe('DUPLICATE_BANK_REFERENCE');
      expect(salDup.json().duplicateReservationCode).toBeUndefined();
      expect(salDup.body).not.toContain(h.code);
      expect(await count(hs)).toBe(0);
      expect((await x.get(hs.id)).status).toBe('hold');

      const reservations = async () =>
        (await x.q(`SELECT count(*)::int AS n FROM reservation`))[0].n as number;
      const create = (bankReference: string, method = 'bank_transfer') =>
        x.c.fd!.send('POST', x.url('/reservations'), {
          ...directBody('203', '2026-12-15', '2026-12-17'),
          initialPayment: { type: 'deposit', method, amountVnd: 2_000_000, bankReference },
        });
      const bookings = await reservations();
      cardRefused(
        await create('4111-1111-1111-1111'),
        'initialPayment.bankReference',
        '4111-1111-1111-1111',
      );
      expect(await reservations()).toBe(bookings);
      // A duplicate refuses the whole booking (one transaction): nothing created.
      const dupIp = await create('Cd-0001');
      expect(dupIp.statusCode, dupIp.body).toBe(409);
      expect(dupIp.json()).toMatchObject({
        code: 'DUPLICATE_BANK_REFERENCE',
        duplicateReservationCode: h.code,
      });
      expect(await reservations()).toBe(bookings);
      const cashIp = await create('IP-0001', 'cash');
      expect(cashIp.statusCode, cashIp.body).toBe(422);
      expect(cashIp.json().errors).toContainEqual({
        field: 'initialPayment.bankReference',
        code: 'NOT_ALLOWED',
      });
      const created = await create('ip-0001');
      expect(created.statusCode, created.body).toBe(201);
      expect(
        (
          await x.q(`SELECT bank_reference FROM payment WHERE folio_id = $1`, [
            created.json().folioId,
          ])
        ).map((r) => r.bank_reference),
      ).toEqual(['IP-0001']);
    }, 120_000);

    it('checkIn (`payment.`) and checkOut (`finalPayment.`): a card number → 422 with the prefix, nothing done; a usual code stored', async () => {
      await x.at('2026-11-20T10:00:00+07:00');
      const s = await direct('301', '2026-11-22', '2026-11-24');
      await x.at('2026-11-22T15:00:00+07:00');
      await x.q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [x.ids.rooms['301']]);
      const due = (await x.folio(s.folioId)).totals.balanceDueVnd as number;
      expect(due).toBeGreaterThan(0);
      const checkIn = (bankReference: string) =>
        x.act(s.id, 'check-in', {
          cardsIssued: 1,
          houseRulesSent: true,
          checkinTime: '15:00',
          payment: { type: 'charge', method: 'bank_transfer', amountVnd: due, bankReference },
        });
      const before = await count(s);
      cardRefused(
        await checkIn('4111.1111.1111.1111'),
        'payment.bankReference',
        '4111.1111.1111.1111',
      );
      expect((await x.get(s.id)).status).toBe('confirmed');
      expect(await count(s)).toBe(before);
      // A duplicate (the code of d1's receipt, another case) → 409, still not checked in, nothing written.
      const dupCi = await checkIn('Ft2611Abc');
      expect(dupCi.statusCode, dupCi.body).toBe(409);
      expect(dupCi.json()).toMatchObject({
        code: 'DUPLICATE_BANK_REFERENCE',
        duplicateReservationCode: d1.code,
      });
      expect((await x.get(s.id)).status).toBe('confirmed');
      expect(await count(s)).toBe(before);
      const ci = await checkIn('ci-0001');
      expect(ci.statusCode, ci.body).toBe(200);
      expect(
        (
          await x.q(
            `SELECT bank_reference FROM payment WHERE folio_id = $1 AND bank_reference IS NOT NULL`,
            [s.folioId],
          )
        ).map((r) => r.bank_reference),
      ).toEqual(['CI-0001']);
      // Something to pay at departure.
      await x.at('2026-11-24T10:00:00+07:00');
      const line = await x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/lines`), {
        category: 'fnb',
        description: 'Bữa sáng thêm',
        quantity: 1,
        unitPriceVnd: 150_000,
        serviceDate: '2026-11-23',
      });
      expect(line.statusCode, line.body).toBe(201);
      await x.at('2026-11-24T11:00:00+07:00');
      const checkOut = (bankReference: string) =>
        x.act(s.id, 'check-out', {
          checkoutTime: '11:00',
          finalPayment: {
            type: 'charge',
            method: 'bank_transfer',
            amountVnd: 150_000,
            bankReference,
          },
        });
      cardRefused(
        await checkOut('4111_1111_1111_1111'),
        'finalPayment.bankReference',
        '4111_1111_1111_1111',
      );
      expect((await x.get(s.id)).status).toBe('in_house');
      const atDeparture = await count(s);
      const dupCo = await checkOut('ft2611abc');
      expect(dupCo.statusCode, dupCo.body).toBe(409);
      expect(dupCo.json()).toMatchObject({
        code: 'DUPLICATE_BANK_REFERENCE',
        duplicateReservationCode: d1.code,
      });
      expect((await x.get(s.id)).status).toBe('in_house');
      expect(await count(s)).toBe(atDeparture);
      const co = await checkOut('co-0001');
      expect(co.statusCode, co.body).toBe(200);
      expect(
        (
          await x.q(
            `SELECT bank_reference FROM payment WHERE folio_id = $1 AND bank_reference IS NOT NULL
            ORDER BY created_at`,
            [s.folioId],
          )
        ).map((r) => r.bank_reference),
      ).toEqual(['CI-0001', 'CO-0001']);
    }, 120_000);

    it('SEC 119-02 (2) – recordManual itself (a path that skips the readers): a card number → 422 CARD_NUMBER_DETECTED, a bad pattern / another method → 422, nothing stored', async () => {
      const before = await count(d1);
      const direct = (bankReference: string, method: 'bank_transfer' | 'cash' = 'bank_transfer') =>
        x.db
          .withContext({ ...x.t.ctx(), userId: x.t.users.fd!.id, actorType: 'user' }, (tx) =>
            x.fa.app.get(PaymentService).recordManual(tx, {
              folioId: d1.folioId,
              reservationId: d1.id,
              reservationCode: d1.code,
              type: 'charge',
              method,
              amountVnd: 10_000,
              receivedAt: null,
              posAuthCode: null,
              note: null,
              recordedBy: x.t.users.fd!.id,
              recordedByRole: 'front_desk',
              bankReference,
            }),
          )
          .then(
            () => ({ code: 'STORED', errors: [] as unknown[] }),
            (e: { code: string; options?: { errors?: unknown[] } }) => ({
              code: e.code,
              errors: e.options?.errors ?? [],
            }),
          );
      for (const card of ['4111111111111111', '4111-1111-1111-1111/1228'])
        expect(await direct(card)).toEqual({
          code: 'CARD_NUMBER_DETECTED',
          errors: [{ field: 'bankReference', code: 'CARD_NUMBER_DETECTED' }],
        });
      expect(await direct('FT 2611')).toEqual({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'bankReference', code: 'VALIDATION_FAILED' }],
      });
      expect(await direct('FT2611RM01', 'cash')).toEqual({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'bankReference', code: 'NOT_ALLOWED' }],
      });
      expect(await count(d1)).toBe(before);
      expect(
        await x.q(
          `SELECT 1 FROM payment WHERE bank_reference IN ('4111111111111111', '4111-1111-1111-1111/1228')`,
        ),
      ).toHaveLength(0);
    }, 60_000);

    it('C0313-31 error order (option (B), as on main since #119 and BUG-R2-043): another field wrong AND a card number in bankReference → 422 CARD_NUMBER_DETECTED on bankReference only, nothing written', async () => {
      const card = '4111111111111111';
      const before = await count(d1);
      // recordPayment (checkPaymentShape): amount 0, unknown type, bad receivedAt + a card number. (`type: refund` is
      // answered before the body checks – `PaymentsService.record`, refunds only via 2.6 – and is not used here.)
      const rp = await pay(d1, card, { type: 'tip', amountVnd: 0, receivedAt: 'yesterday' });
      cardRefused(rp, 'bankReference', card);
      expect(await count(d1)).toBe(before);
      // confirmDeposit (depositPayment): wrong type and method + a card number.
      const h = await hold('402', 'fd');
      const cd = await x.act(h.id, 'confirm-deposit', {
        payment: { type: 'charge', method: 'bank_transfer', amountVnd: -5, bankReference: card },
      });
      cardRefused(cd, 'payment.bankReference', card);
      expect(await count(h)).toBe(0);
      // createReservation (parseInitialPayment): a missing amount + a card number.
      const ip = await x.c.fd!.send('POST', x.url('/reservations'), {
        ...directBody('302', '2026-12-26', '2026-12-28'),
        initialPayment: { type: 'deposit', method: 'bank_transfer', bankReference: card },
      });
      cardRefused(ip, 'initialPayment.bankReference', card);
      // The card number of posAuthCode still answers before bankReference (BUG-R2-043, the shape checks' order).
      const both = await pay(d1, card, { method: 'card_pos', posAuthCode: card });
      expect(both.statusCode, both.body).toBe(422);
      expect(both.json().errors).toEqual([{ field: 'posAuthCode', code: 'CARD_NUMBER_DETECTED' }]);
      expect(await count(d1)).toBe(before);
    }, 60_000);
  },
);
