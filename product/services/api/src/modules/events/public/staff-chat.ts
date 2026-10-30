/**
 * Outbox topic `staff.chat` – messages to the Google Chat room "OTTIMO – Yêu cầu đặt phòng" (ARC
 * gchat-booking-request-notify 1.3, 8.1; SEC ESC-041 ★6). The events module owns the staff outbox, so the other
 * modules enqueue through here and never write `outbox_message` themselves (module boundaries).
 *
 * - The payload holds ids only (`kind`, `refType`, `refId`): the text is built by the worker at send time
 *   (ChatDispatcher + the renderer of the owning module) and never stored.
 * - One row per (kind, request): `dedupe_key = staff.chat:<kind>:<refId>` + ON CONFLICT DO NOTHING, so a replay,
 *   a SAVEPOINT retry or a job running every tick never adds a second message.
 * - Written in the caller's business transaction: no request without its message, no message for a rolled-back
 *   request. Written even when Chat is off (the api does not know the worker's configuration): the worker closes
 *   such rows as SKIPPED_DISABLED.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';

export const STAFF_CHAT_TOPIC = 'staff.chat';

/** Closed list (a new kind needs a renderer AND a SEC data review – ARC 7). */
export const STAFF_CHAT_KINDS = [
  'web_request_new',
  'web_request_overdue',
  'web_request_morning',
  'web_request_erased',
] as const;
export type StaffChatKind = (typeof STAFF_CHAT_KINDS)[number];

export const STAFF_CHAT_REF_TYPES = ['website_booking_request'] as const;
export type StaffChatRefType = (typeof STAFF_CHAT_REF_TYPES)[number];

export interface StaffChatInput {
  kind: StaffChatKind;
  refType: StaffChatRefType;
  refId: string;
  /** Business clock (also `created_at`: the 12-hour staleness is measured on it). */
  now: Date;
}

export const isStaffChatKind = (v: unknown): v is StaffChatKind =>
  typeof v === 'string' && (STAFF_CHAT_KINDS as readonly string[]).includes(v);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const staffChatDedupeKey = (kind: StaffChatKind, refId: string) =>
  `${STAFF_CHAT_TOPIC}:${kind}:${refId}`;

/** Enqueues one `staff.chat` row (ids only). Returns false when that (kind, request) already has one. */
export async function enqueueStaffChat(tx: Tx, input: StaffChatInput): Promise<boolean> {
  if (!isStaffChatKind(input.kind)) throw new Error(`unknown staff chat kind ${input.kind}`);
  if (!(STAFF_CHAT_REF_TYPES as readonly string[]).includes(input.refType)) {
    throw new Error(`unknown staff chat refType ${input.refType}`);
  }
  if (!UUID.test(input.refId)) throw new Error('staff chat refId must be a uuid');
  const propertyId = tx.ctx.propertyId;
  if (!propertyId) throw new Error('enqueueStaffChat needs a property context');
  const r = await tx.query(
    `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (dedupe_key) DO NOTHING`,
    [
      uuidv7(),
      tx.ctx.organizationId,
      propertyId,
      STAFF_CHAT_TOPIC,
      JSON.stringify({ kind: input.kind, refType: input.refType, refId: input.refId }),
      staffChatDedupeKey(input.kind, input.refId),
      input.now,
    ],
  );
  return (r.rowCount ?? 0) > 0;
}

/**
 * Where the message of (kind, request) stands: `posted` = delivered to Chat (done, no skip code); `pending` = not
 * yet tried, waiting or being sent; `none` = never enqueued, skipped (SKIPPED_*) or dead.
 */
export async function staffChatState(
  tx: Tx,
  kind: StaffChatKind,
  refId: string,
): Promise<'posted' | 'pending' | 'none'> {
  const { rows } = await tx.query<{ status: string; last_error: string | null }>(
    `SELECT status, last_error FROM outbox_message WHERE dedupe_key = $1`,
    [staffChatDedupeKey(kind, refId)],
  );
  const r = rows[0];
  if (!r) return 'none';
  if (r.status === 'done') return r.last_error === null ? 'posted' : 'none';
  if (r.status === 'dead') return 'none';
  return 'pending';
}
