/**
 * J1 `hold.expire` notices (v1.0.4 P4-10 – BUG-R3-041, FB-R3-ARC-BEB-WA-04 context, DOM-on-PO-v1.0.0-docs A.5).
 *
 * Until v1.0.3 J1 only wrote a `staff.push` outbox row (no dispatcher – push is still a Mock), so nobody saw these
 * notices: no inbox row, no SSE. Now each notice goes through EventsService.notify (staff inbox + SSE
 * `notification.created` to each recipient) – exactly ONCE per dedupe key, although J1 re-reads a kept hold on every
 * tick: the `staff.push` outbox row (same payload and dedupe key as before, so ops queries and old tests still hold)
 * is the gate – `ON CONFLICT (dedupe_key) DO NOTHING RETURNING id`; no row returned = already told.
 * The outbox has no purge (no DELETE on outbox_message anywhere), so the gate is durable.
 *
 * Recipients (DOM A.5):
 * - `hold_overdue_with_deposit` – the creator and the closer (sale/CTV) + every active FD, FDL and MGR;
 * - `hold_overdue_cap` (12:00 of the arrival day, still `hold`) – MGR and OWN;
 * - `hold_expired` (no money, J1 cancelled it) – the creator and the closer + every active FD and FDL (v1.0.5 V5-1B,
 *   DOM rules-v1.0.5 mục 9, BR-303 v0.5.13, OpenAPI 0.3.13 bổ sung 1 mục 1.21): in v1.0.x a sale/CTV has nowhere to
 *   read it (no staff app, no Desk inbox), so the desk – who tells the guest (Tờ 2a) – is always told. The v1.0.4
 *   branch "FD/FDL only when the creator/closer resolve to nobody" (DOM P4-20 §0) is gone: FD/FDL get it anyway.
 * "Active" = account `active` and a live role at the property (EventsService.notify). Never HK, MT or accounting. Ids, kind and display code only in any payload (SEC A5) – no guest data.
 * Dedupe keys (DOM P4-20 §0): with_deposit = (reservation, hold_expires_at); cap and expired = reservation.
 * EventsService absent (a composition without it) → the push row alone, as before.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { EventsService } from '../../events/public/events.service';

export type HoldNoticeKind = 'hold_overdue_with_deposit' | 'hold_overdue_cap' | 'hold_expired';

/** DOM A.5 (+ V5-1B for `hold_expired`) – roles told besides the booking's creator/closer (`people`). */
export const HOLD_NOTICE_ROLES: Readonly<Record<HoldNoticeKind, readonly string[]>> = {
  hold_overdue_with_deposit: ['front_desk', 'front_desk_lead', 'manager'],
  hold_overdue_cap: ['manager', 'owner'],
  hold_expired: ['front_desk', 'front_desk_lead'],
};

/** Does the creator/closer get this notice too (DOM A.5)? */
export const HOLD_NOTICE_TO_PEOPLE: Readonly<Record<HoldNoticeKind, boolean>> = {
  hold_overdue_with_deposit: true,
  hold_overdue_cap: false,
  hold_expired: true,
};

export interface HoldNotice {
  kind: HoldNoticeKind;
  /** creator + closer of the booking (null-free) */
  people: readonly string[];
  reservationId: string;
  code: string;
  dedupeKey: string;
}

/** true = told now; false = already told for this dedupe key (or nobody to tell). */
export async function notifyHoldOnce(
  tx: Tx,
  events: EventsService | undefined,
  n: HoldNotice,
  now: Date,
): Promise<boolean> {
  const roles = [...HOLD_NOTICE_ROLES[n.kind]];
  const userIds = HOLD_NOTICE_TO_PEOPLE[n.kind] ? [...new Set(n.people)] : [];
  if (roles.length === 0 && userIds.length === 0) return false;
  const { rows } = await tx.query<{ id: string }>(
    `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
     VALUES ($1, $2, $3, 'staff.push', $4, $5) ON CONFLICT (dedupe_key) DO NOTHING RETURNING id`,
    [
      uuidv7(),
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      JSON.stringify({
        kind: n.kind,
        roles,
        ...(userIds.length ? { userIds } : {}),
        refType: 'reservation',
        refId: n.reservationId,
        refCode: n.code,
      }),
      n.dedupeKey,
    ],
  );
  if (rows.length === 0) return false;
  if (events) {
    const base = {
      kind: n.kind,
      refType: 'reservation' as const,
      refId: n.reservationId,
      refCode: n.code,
    };
    // push: false – the gate row above IS the push. One inbox row per person (DISTINCT in notify), even when the
    // creator is an FD/FDL too.
    await events.notify(tx, { ...base, roles, userIds }, now, { push: false });
  }
  return true;
}
