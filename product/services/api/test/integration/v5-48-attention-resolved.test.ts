/**
 * V5-48 / 5B-1 – contract 0.3.13 bổ sung 1e mục 1.25 (BE C0313-22 ý 3; SEC 1.2 – S8) on PostgreSQL:
 * closing a `deposit_after_cancel` "Cần chú ý" item by hand ("Không thấy tiền") needs a note and writes the money audit
 * `attention_event.resolved` (`after = { kind, afterClosure: true }`, who and when) – read back from `audit_event` and
 * returned by `listAuditEvents.afterClosureOnly` with the actor and the time; any other item writes no money audit.
 * The item itself is opened as 5B-1 will (`createDepositNotice` on a closed booking – PR-B3). Fake clock, FAKE data.
 *
 * Chờ PR ARC-16 (SEC ARC-20): `attention_event.resolved` enters the closed `money` set (MONEY_AUDIT_ACTIONS) with
 * ARC's contract PR. Until it is merged, the audit read-back case is skipped by name (`waitsForArc16`) – it runs by
 * itself once main has the constant; the note rule and the "other kinds" case run now.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isMoneyAuditAction } from '../../src/modules/audit/public/money-actions';
import { EventsService } from '../../src/modules/events/public/events.service';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, startFixture } from './s438-r8/fixture';

const NOTE = 'Không thấy tiền trong sao kê';
/** Chờ PR ARC-16 (SEC ARC-20): the action is not in the closed money set of this tree yet. */
const waitsForArc16 = !isMoneyAuditAction('attention_event.resolved');

describe.skipIf(!HAS_DB)('V5-48 S8 – "Không thấy tiền" on deposit_after_cancel', () => {
  let x: Fx;
  beforeAll(async () => {
    x = await startFixture();
  });
  afterAll(async () => {
    await x?.close();
  });

  const open = (kind: any, b: { id: string; code: string }, params?: Record<string, string>) =>
    x.db.withContext({ ...x.t.ctx(), userId: null, actorType: 'system' } as any, (tx) =>
      x.fa.app.get(EventsService).openAttention(tx, {
        kind,
        severity: 'warning',
        dedupeKey: `${kind}:${b.id}`,
        refType: 'reservation',
        refId: b.id,
        refCode: b.code,
        ...(params ? { params } : {}),
        now: x.fa.clock.now(),
      }),
    );
  const resolve = (eventId: string, body: Record<string, unknown>, who = 'fd') =>
    x.c[who]!.send('POST', x.url(`/attention-events/${eventId}/actions/resolve`), body);
  const audits = (eventId: string) =>
    x.q(
      `SELECT category, action, entity_type, entity_code, actor_user_id, occurred_at, before, after, reason
         FROM audit_event WHERE entity_id = $1`,
      [eventId],
    );
  /** A booking cancelled by FD (B10) and the `deposit_after_cancel` item 5B-1 will open on it (at 21/11 09:30). */
  const closedWithItem = async (room: string, arrivalDate: string, departureDate: string) => {
    await x.at('2026-11-20T10:00:00+07:00');
    const body = {
      roomId: x.ids.rooms[room],
      channelId: x.ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: x.guest,
      paymentModel: 'direct',
      arrivalDate,
      departureDate,
    };
    let created = await x.c.fd!.send('POST', x.url('/reservations'), body);
    if (created.statusCode === 422 && created.json().code === 'DEPOSIT_INSUFFICIENT') {
      created = await x.c.fd!.send('POST', x.url('/reservations'), {
        ...body,
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: created.json().depositRequiredVnd,
        },
      });
    }
    expect(created.statusCode, created.body).toBe(201);
    const b = created.json();
    const cancel = await x.c.fd!.send(
      'POST',
      x.url(`/reservations/${b.id}/actions/cancel`),
      { reasonCode: 'found_other', note: 'Khách báo qua Zalo' },
      { 'if-match': `"${b.version}"` },
    );
    expect(cancel.statusCode, cancel.body).toBe(200);
    await x.at('2026-11-21T09:30:00+07:00');
    const eventId = (await open('deposit_after_cancel', b, { code: b.code }))!;
    expect(eventId).toEqual(expect.any(String));
    return { b: b as { id: string; code: string }, eventId };
  };

  it('FD without a note → 422 REASON_REQUIRED (a money item), nothing written, the item stays open', async () => {
    const { eventId } = await closedWithItem('301', '2026-12-01', '2026-12-03');
    const missing = await resolve(eventId, {});
    expect(missing.statusCode, missing.body).toBe(422);
    expect(missing.json().errors).toEqual([{ field: 'note', code: 'REASON_REQUIRED' }]);
    expect(await audits(eventId)).toEqual([]);
    const [still] = await x.q('SELECT resolved_at FROM attention_event WHERE id = $1', [eventId]);
    expect(still.resolved_at).toBeNull();
  });

  it.skipIf(waitsForArc16)(
    'chờ PR ARC-16 – FD with a note → 204, one money audit attention_event.resolved read back; afterClosureOnly returns it with who and when',
    async () => {
      const { b, eventId } = await closedWithItem('302', '2026-12-05', '2026-12-07');
      const ok = await resolve(eventId, { note: NOTE });
      expect(ok.statusCode, ok.body).toBe(204);
      expect(await audits(eventId)).toEqual([
        {
          category: 'money',
          action: 'attention_event.resolved',
          entity_type: 'attention_event',
          entity_code: b.code,
          actor_user_id: x.t.users.fd!.id,
          occurred_at: new Date('2026-11-21T09:30:00+07:00'),
          before: null,
          after: { kind: 'deposit_after_cancel', afterClosure: true },
          reason: NOTE,
        },
      ]);
      for (const who of ['mgr', 'fd']) {
        const res = await x.c[who]!.get(
          x.url('/audit-events?afterClosureOnly=true&from=2026-11-20&to=2026-11-22&limit=100'),
        );
        expect(res.statusCode, res.body).toBe(200);
        const rows = (res.json().data as any[]).filter(
          (r) => r.action === 'attention_event.resolved',
        );
        expect(rows, who).toEqual([
          expect.objectContaining({
            category: 'money',
            entityType: 'attention_event',
            entityId: eventId,
            entityCode: b.code,
            occurredAt: '2026-11-21T09:30:00.000+07:00',
            actorType: 'user',
            actorName: expect.any(String),
            after: { kind: 'deposit_after_cancel', afterClosure: true },
          }),
        ]);
      }
    },
  );

  it('another item (ota_no_show_report) closed by hand writes no money audit', async () => {
    await x.at('2026-11-21T10:00:00+07:00');
    const b = { id: '01970000-0000-7000-8000-000000000001', code: 'OTM-99001' };
    const eventId = (await open('ota_no_show_report', b, { action: 'report' }))!;
    const ok = await resolve(eventId, {});
    expect(ok.statusCode, ok.body).toBe(204);
    expect(await audits(eventId)).toEqual([]);
  });
});
