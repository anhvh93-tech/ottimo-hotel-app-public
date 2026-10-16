/**
 * Notifications / SSE of the BE-B modules through BE-A's EventsService (events/public, ARC s3-contract 4.3).
 * EventsService is injected @Optional: while the events module is not in feature-modules yet, a notification
 * still reaches the push outbox (`staff.push`, same payload shape: kind, userIds, refType, refId, refCode) and
 * SSE is skipped (the client refreshes on its own). No C2/C3 in any payload (SEC A5).
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type {
  EventsService,
  NotifyInput,
  SseAudience,
  SseEventType,
} from '../../events/public/events.service';

export async function notifyStaff(
  tx: Tx,
  events: EventsService | undefined,
  input: NotifyInput,
  now: Date,
): Promise<string[]> {
  if (events) return events.notify(tx, input, now);
  const { rows } = await tx.query<{ id: string }>(
    `SELECT DISTINCT u.id FROM app_user u
       JOIN user_property_role upr ON upr.user_id = u.id AND upr.property_id = $1 AND upr.revoked_at IS NULL
      WHERE u.status = 'active' AND (upr.role = ANY($2::text[]) OR u.id = ANY($3::uuid[]))
        AND NOT (u.id = ANY($4::uuid[]))
      ORDER BY u.id`,
    [
      tx.ctx.propertyId,
      [...(input.roles ?? [])],
      [...(input.userIds ?? [])],
      [...(input.excludeUserIds ?? [])],
    ],
  );
  const userIds = rows.map((r) => r.id);
  if (userIds.length === 0) return userIds;
  await tx.query(
    `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
     VALUES ($1, $2, $3, 'staff.push', $4, $5) ON CONFLICT (dedupe_key) DO NOTHING`,
    [
      uuidv7(),
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      JSON.stringify({
        kind: input.kind,
        roles: [...(input.roles ?? [])],
        userIds,
        refType: input.refType,
        refId: input.refId,
        ...(input.refCode ? { refCode: input.refCode } : {}),
      }),
      `notify:${input.kind}:${input.refId}:${uuidv7()}`,
    ],
  );
  return userIds;
}

export async function publishEvent(
  tx: Tx,
  events: EventsService | undefined,
  type: SseEventType,
  id: string,
  audience?: SseAudience,
): Promise<void> {
  if (events) await events.publish(tx, type, id, audience);
}
