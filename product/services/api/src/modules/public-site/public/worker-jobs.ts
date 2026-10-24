/**
 * Jobs of the website booking requests (erd 4.14, SM-18; US-155 AC3, AC8; BR-912 (2); SEC ARC-03, C-2) – BE-D
 * R3 Sprint 1. Registered by the public-site module (api + test-support job endpoint) and by the worker.
 * - `web_request.sla` (tick): a request still `new` at `reply_by` + (`web_request_escalate_minutes` −
 *   `web_request_response_minutes`) → ONE notification `website_request_overdue` to FDL + MGR (no name/phone),
 *   `overdue_notified_at` set in the same UPDATE that selects it (exactly once).
 * - `web_request.stale` (daily 06:05, after the business-day change): WR7 – `new`/`in_progress` without activity
 *   for `retention.web_request_stale_days` → `declined` (`stale`).
 * - `web_request.purge` (daily 03:10, T19 [GIẢ ĐỊNH – SEC đặt mã]): runs on time, never waits for a transition:
 *   declined → C2 NULL after `retention.web_request_declined_days` (from the last activity = the decline);
 *   spam → the whole row deleted after `retention.web_request_spam_days`; every status but `converted` → C2 NULL
 *   at `retention.web_request_max_age_days` from creation (still open → WR7 first, reason `stale`);
 *   `ip_hmac` NULL after `retention.web_request_ip_hmac_days`. One `purge_journal` row per request (ids only).
 * - `public_site.cleanup` (tick): expired `public_form_nonce` / `rate_limit_counter` rows (technical, batch).
 * "Cần chú ý" `website_request_new` is computed at read time (websiteRequestNewSource).
 */
import type { Tx } from '../../../db/database';
import type { JobDefinition } from '../../../jobs/job-runner';
import type { AttentionSource, EventsService } from '../../events/public/events.service';
import type { ParameterService } from '../../platform/public/parameter.service';

export const WEB_REQUEST_SLA_JOB_KEY = 'web_request.sla';
export const WEB_REQUEST_STALE_JOB_KEY = 'web_request.stale';
export const WEB_REQUEST_PURGE_JOB_KEY = 'web_request.purge';
export const PUBLIC_SITE_CLEANUP_JOB_KEY = 'public_site.cleanup';

const C2_NULLS =
  'guest_name = NULL, phone_e164 = NULL, email = NULL, note = NULL, decline_note = NULL, contact_hmac = NULL';
const BATCH = 500;

async function stateRow(tx: Tx, id: string, from: string, to: string, event: string, at: Date) {
  await tx.query(
    `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
       event_code, actor_type, actor_user_id, occurred_at)
     VALUES ($1, $2, 'SM-18', $3, $4, $5, $6, 'system', NULL, $7)`,
    [tx.ctx.organizationId, tx.ctx.propertyId, id, from, to, event, at],
  );
}

async function journal(tx: Tx, id: string, action: 'null_columns' | 'delete_row', at: Date) {
  await tx.query(
    `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key, action, purged_at)
     VALUES ($1, $2, 'website_booking_request', $3, 'T19', $4, $5)`,
    [tx.ctx.organizationId, tx.ctx.propertyId, id, action, at],
  );
}

/** FD+ floor + the assignee (a SAL never gets events of requests outside their scope – ARC-12). */
const sse = (events: EventsService, tx: Tx, id: string, assignee: string | null) =>
  events.publish(tx, 'website_request.changed', id, {
    roles: [],
    userIds: assignee ? [assignee] : [],
  });

/** WR7 for the rows matched by `where` (alias-free SQL on website_booking_request, params from $2). */
async function staleClose(
  tx: Tx,
  events: EventsService,
  now: Date,
  where: string,
  params: unknown[],
): Promise<number> {
  const { rows } = await tx.query<{ id: string; from: string; assigned_user_id: string | null }>(
    `UPDATE website_booking_request w SET status = 'declined', decline_reason_code = 'stale',
            last_activity_at = $1, updated_at = $1, version = w.version + 1
       FROM (SELECT id, status FROM website_booking_request
              WHERE status IN ('new', 'in_progress') AND ${where}
              ORDER BY created_at LIMIT ${BATCH} FOR UPDATE SKIP LOCKED) due
      WHERE w.id = due.id
     RETURNING w.id, due.status AS from, w.assigned_user_id`,
    [now, ...params],
  );
  for (const r of rows) {
    await stateRow(tx, r.id, r.from, 'declined', 'expire_website_request', now);
    await sse(events, tx, r.id, r.assigned_user_id);
  }
  return rows.length;
}

export function publicSiteWorkerJobs(deps: {
  events: EventsService;
  params: ParameterService;
}): JobDefinition[] {
  const { events, params } = deps;
  const int = async (tx: Tx, key: string, date: string) =>
    Number(await params.get<number>(tx, key, date));
  return [
    {
      key: WEB_REQUEST_SLA_JOB_KEY,
      schedule: { kind: 'tick' },
      async handler(tx, ctx) {
        const gap =
          (await int(tx, 'web_request_escalate_minutes', ctx.date)) -
          (await int(tx, 'web_request_response_minutes', ctx.date));
        const { rows } = await tx.query<{ id: string; ref_code: string }>(
          `UPDATE website_booking_request w SET overdue_notified_at = $1
             FROM (SELECT id FROM website_booking_request
                    WHERE status = 'new' AND overdue_notified_at IS NULL
                      AND reply_by + make_interval(mins => $2::int) <= $1
                    ORDER BY reply_by FOR UPDATE SKIP LOCKED) due
            WHERE w.id = due.id
           RETURNING w.id, w.ref_code`,
          [ctx.now, Math.max(0, gap)],
        );
        for (const r of rows) {
          await events.notify(
            tx,
            {
              kind: 'website_request_overdue',
              roles: ['front_desk_lead', 'manager'],
              refType: 'website_booking_request',
              refId: r.id,
              refCode: r.ref_code,
            },
            ctx.now,
          );
        }
        return { escalated: rows.length };
      },
    },
    {
      key: WEB_REQUEST_STALE_JOB_KEY,
      schedule: { kind: 'daily', at: '06:05', catchUp: 'always' },
      async handler(tx, ctx) {
        const days = await int(tx, 'retention.web_request_stale_days', ctx.date);
        const closed = await staleClose(
          tx,
          events,
          ctx.now,
          `last_activity_at <= $1::timestamptz - make_interval(days => $2::int)`,
          [days],
        );
        return { closed };
      },
    },
    {
      key: WEB_REQUEST_PURGE_JOB_KEY,
      schedule: { kind: 'daily', at: '03:10', catchUp: 'always' },
      async handler(tx, ctx) {
        const declinedDays = await int(tx, 'retention.web_request_declined_days', ctx.date);
        const spamDays = await int(tx, 'retention.web_request_spam_days', ctx.date);
        const maxAge = await int(tx, 'retention.web_request_max_age_days', ctx.date);
        const ipDays = await int(tx, 'retention.web_request_ip_hmac_days', ctx.date);
        // Absolute ceiling first: still open at max age → WR7 (then purged below with the other declined).
        const aged = await staleClose(
          tx,
          events,
          ctx.now,
          `created_at <= $1::timestamptz - make_interval(days => $2::int)`,
          [maxAge],
        );
        const { rows: purged } = await tx.query<{ id: string; assigned_user_id: string | null }>(
          `UPDATE website_booking_request w SET ${C2_NULLS}, ip_hmac = NULL, pii_purged_at = $1, updated_at = $1,
                  version = w.version + 1
             FROM (SELECT id FROM website_booking_request
                    WHERE pii_purged_at IS NULL AND status <> 'converted'
                      AND ((status = 'declined' AND last_activity_at <= $1::timestamptz - make_interval(days => $2::int))
                           OR created_at <= $1::timestamptz - make_interval(days => $3::int)
                           -- a spam request a quote points to cannot be deleted (FK): its C2 goes instead
                           OR (status = 'spam' AND quote_id IS NOT NULL
                               AND last_activity_at <= $1::timestamptz - make_interval(days => $4::int)))
                    LIMIT ${BATCH} FOR UPDATE SKIP LOCKED) due
            WHERE w.id = due.id
           RETURNING w.id, w.assigned_user_id`,
          [ctx.now, declinedDays, maxAge, spamDays],
        );
        for (const r of purged) {
          await journal(tx, r.id, 'null_columns', ctx.now);
          await sse(events, tx, r.id, r.assigned_user_id);
        }
        // Spam rows go entirely (quote / reservation never point to a spam request).
        const { rows: spam } = await tx.query<{ id: string }>(
          `DELETE FROM website_booking_request
            WHERE id IN (SELECT id FROM website_booking_request
                          WHERE status = 'spam' AND quote_id IS NULL
                            AND last_activity_at <= $1::timestamptz - make_interval(days => $2::int)
                          LIMIT ${BATCH} FOR UPDATE SKIP LOCKED)
           RETURNING id`,
          [ctx.now, spamDays],
        );
        for (const r of spam) await journal(tx, r.id, 'delete_row', ctx.now);
        const ip = await tx.query(
          `UPDATE website_booking_request SET ip_hmac = NULL
            WHERE ip_hmac IS NOT NULL AND created_at <= $1::timestamptz - make_interval(days => $2::int)`,
          [ctx.now, ipDays],
        );
        return {
          aged,
          purged: purged.length,
          spamDeleted: spam.length,
          ipCleared: ip.rowCount ?? 0,
        };
      },
    },
    {
      key: PUBLIC_SITE_CLEANUP_JOB_KEY,
      schedule: { kind: 'tick' },
      async handler(tx, ctx) {
        const n = await tx.query(
          `DELETE FROM public_form_nonce WHERE ctid IN (
             SELECT ctid FROM public_form_nonce WHERE expires_at < $1 LIMIT 5000)`,
          [ctx.now],
        );
        const c = await tx.query(
          `DELETE FROM rate_limit_counter WHERE ctid IN (
             SELECT ctid FROM rate_limit_counter WHERE expires_at < $1 LIMIT 5000)`,
          [ctx.now],
        );
        return { nonces: n.rowCount ?? 0, counters: c.rowCount ?? 0 };
      },
    },
  ];
}

/**
 * "Cần chú ý" `website_request_new` (OpenAPI AttentionItem 0.3.7 bổ sung 2; US-155 AC8; FD+ – SAL gets the
 * notification instead): count of `new` requests nobody holds; `critical` when one arrives today (BR-912 (3) –
 * "mức cao nhất", AC8), `warning` when the oldest is past `replyBy`, else `info`; `dueAt` = earliest `replyBy`;
 * `refCode` when there is exactly one; params only `count` – no name, no phone.
 */
export const websiteRequestNewSource: AttentionSource = async (tx, ctx) => {
  const { rows } = await tx.query<{ ref_code: string; reply_by: Date; arrival_date: string }>(
    `SELECT ref_code, reply_by, arrival_date::text AS arrival_date FROM website_booking_request
      WHERE status = 'new' AND assigned_user_id IS NULL ORDER BY reply_by LIMIT 200`,
  );
  const first = rows[0];
  if (!first) return [];
  const today = rows.some((r) => r.arrival_date === ctx.today);
  const overdue = first.reply_by.getTime() <= ctx.now.getTime();
  return [
    {
      kind: 'website_request_new',
      source: 'computed',
      severity: today ? 'critical' : overdue ? 'warning' : 'info',
      count: rows.length,
      dueAt: ctx.iso(first.reply_by),
      ...(rows.length === 1 ? { refCode: first.ref_code } : {}),
      link: '/website-requests?status=new',
      params: { count: rows.length },
    },
  ];
};
