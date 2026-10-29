/**
 * US-136 AC2 / AC4 / AC5 (0.3.7 bổ sung D1 – ARC openapi-0.3.7.md 10.5; P-S4-11): what the desk and the
 * managers must know when a booking is marked no-show (B11) or restored (B12). Runs in the SAME transaction
 * as the transition (ReservationHooks 'transitioned' – the reservations module's event port), so a rolled-back
 * B11/B12 leaves nothing behind.
 *
 * - B11 → notification `no_show_marked` to OWN + MGR (AC4).
 * - B12 → notification `no_show_restored` to OWN + MGR, never to the person who restored (AC4/AC5).
 * - OTA booking (channel group `ota`) – "Cần chú ý" event `ota_no_show_report` (warning, FD+, closed by the desk
 *   with resolveAttentionEvent once done on the extranet – who/when kept on the row). What the CHANNEL was told
 *   is read from the lines a PERSON closed (`resolved_by` set): the last one `report` → the channel has the
 *   booking as no-show. Lines closed by the system (`resolved_by` NULL) never change that.
 *     B11: an open `revoke` line → closed by the system (nothing to tell any more); else, if the channel does
 *          not have it as no-show yet → open `params.action = report` ("Báo no-show trên kênh");
 *     B12: an open `report` line → closed by the system (the channel was never told); else, if the channel
 *          has it as no-show → open `params.action = revoke` ("Báo kênh hủy no-show").
 * Payloads carry ids, the booking code and the channel code only (SEC A5 / J).
 */
import type { Tx } from '../../../db/database';
import type { EventsService } from '../../events/public/events.service';
import { MGR_PLUS } from '../../events/public/events.service';
import type {
  ReservationEvent,
  ReservationHooks,
} from '../../reservations/public/reservation-hooks';
import type { Clock } from '../../../clock';

const KIND = 'ota_no_show_report' as const;

interface ReportState {
  /** The open line (at most one per booking by construction). */
  open: { id: string; action: string } | null;
  /** The channel has the booking as no-show (last line closed by a person is a `report`). */
  channelNoShow: boolean;
}

/** Through the events hub (ARC 11.4 C2 – reporting never writes `attention_event` itself); rows locked. */
async function reportState(
  tx: Tx,
  events: EventsService,
  reservationId: string,
): Promise<ReportState> {
  const rows = await events.attentionHistory(tx, {
    kind: KIND,
    refType: 'reservation',
    refId: reservationId,
  });
  const open = rows.find((r) => !r.resolvedAt);
  const lastByPerson = rows.find((r) => r.resolvedAt && r.resolvedBy);
  return {
    open: open ? { id: open.id, action: String(open.params.action ?? '') } : null,
    channelNoShow: lastByPerson?.params.action === 'report',
  };
}

async function channelCode(tx: Tx, reservationId: string): Promise<string> {
  const { rows } = await tx.query<{ code: string }>(
    'SELECT c.code FROM reservation r JOIN channel c ON c.id = r.channel_id WHERE r.id = $1',
    [reservationId],
  );
  const code = rows[0]?.code;
  if (!code) throw new Error('no-show notice: booking channel not found');
  return code;
}

async function openReport(
  tx: Tx,
  events: EventsService,
  e: ReservationEvent,
  action: 'report' | 'revoke',
  now: Date,
): Promise<void> {
  await events.openAttention(tx, {
    kind: KIND,
    severity: 'warning',
    dedupeKey: `${KIND}:${action}:${e.reservationId}`,
    refType: 'reservation',
    refId: e.reservationId,
    refCode: e.code,
    params: { action, channel: await channelCode(tx, e.reservationId) },
    now,
  });
}

export async function onNoShowTransition(
  tx: Tx,
  events: EventsService,
  e: ReservationEvent,
  now: Date,
): Promise<void> {
  if (e.kind !== 'transitioned') return;
  if (e.transition === 'B11' && e.status === 'no_show') {
    await events.notify(
      tx,
      {
        kind: 'no_show_marked',
        roles: MGR_PLUS,
        refType: 'reservation',
        refId: e.reservationId,
        refCode: e.code,
      },
      now,
    );
    if (e.channelGroup !== 'ota') return;
    const st = await reportState(tx, events, e.reservationId);
    if (st.open?.action === 'revoke') {
      await events.resolveAttentionById(
        tx,
        st.open.id,
        now,
        'auto: marked no-show again before the revoke',
      );
      return;
    }
    if (!st.open && !st.channelNoShow) await openReport(tx, events, e, 'report', now);
    return;
  }
  if (e.transition === 'B12' && e.previousStatus === 'no_show') {
    const actor = tx.ctx.actorType === 'user' && tx.ctx.userId ? [tx.ctx.userId] : [];
    await events.notify(
      tx,
      {
        kind: 'no_show_restored',
        roles: MGR_PLUS,
        excludeUserIds: actor,
        refType: 'reservation',
        refId: e.reservationId,
        refCode: e.code,
      },
      now,
    );
    if (e.channelGroup !== 'ota') return;
    const st = await reportState(tx, events, e.reservationId);
    if (st.open?.action === 'report') {
      await events.resolveAttentionById(
        tx,
        st.open.id,
        now,
        'auto: restored before the channel was told',
      );
      return;
    }
    if (!st.open && st.channelNoShow) await openReport(tx, events, e, 'revoke', now);
  }
}

/**
 * The no-show notices listener – ONE wiring for the api (ReportingModule) and the worker (public/worker-hooks.ts),
 * so a `transitioned` event emitted by a worker job reaches the same listeners as in the api.
 */
export function wireNoShowNotices(
  hooks: ReservationHooks,
  events: EventsService,
  clock: Clock,
): void {
  hooks.on('transitioned', (tx, e) => onNoShowTransition(tx, events, e, clock.now()));
}
