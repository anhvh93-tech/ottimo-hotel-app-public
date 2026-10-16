/**
 * listC3AccessLog (S28, A76, US-048 AC1): who touched which C3 data, when, with which reason – OWN/MGR.
 * Never returns a document number: `subjectLabel` = document type + last 4 (C2), `sessionRef` = 8 chars.
 * Dates are local dates of the property; keyset pagination on (occurred_at DESC, id DESC).
 */
import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { encodeCursor } from '../../../shared/http/pagination';
import { addDays, atLocal, toZonedIso } from '../../../shared/time';
import { SYSTEM_ACTOR, readStays } from './stay-reader';

interface Row {
  id: number;
  occurred_at: Date;
  actor_type: string;
  display_name: string | null;
  session_id: string | null;
  device_name: string | null;
  request_id: string | null;
  subject_type: string;
  action: string;
  reservation_id: string | null;
  reason_code: string | null;
  doc_type: string | null;
  doc_last4: string | null;
}

@Injectable()
export class C3LogService {
  async list(
    tx: Tx,
    q: {
      dateFrom: string | null;
      dateTo: string | null;
      reservationId: string | null;
      cursor: [string, number] | null;
      limit: number;
    },
  ) {
    const { rows: tzRows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = tzRows[0]?.timezone ?? 'Asia/Ho_Chi_Minh';
    const from = q.dateFrom ? atLocal(q.dateFrom, '00:00', tz) : null;
    const to = q.dateTo ? atLocal(addDays(q.dateTo, 1), '00:00', tz) : null;
    const { rows } = await tx.query<Row>(
      `SELECT l.id::int AS id, l.occurred_at, l.actor_type, u.display_name, l.session_id, d.name AS device_name,
              l.request_id, l.subject_type, l.action, l.reservation_id, l.reason_code,
              gd.doc_type, gd.doc_number_last4 AS doc_last4
         FROM c3_access_log l
         LEFT JOIN app_user u ON u.id = l.user_id
         LEFT JOIN trusted_device d ON d.id = l.trusted_device_id
         LEFT JOIN document_image di ON l.subject_type = 'document_image' AND di.id = l.subject_id
         LEFT JOIN guest_document gd ON gd.id = CASE WHEN l.subject_type = 'guest_document' THEN l.subject_id
                                                     ELSE di.guest_document_id END
        WHERE ($1::timestamptz IS NULL OR l.occurred_at >= $1)
          AND ($2::timestamptz IS NULL OR l.occurred_at < $2)
          AND ($3::uuid IS NULL OR l.reservation_id = $3)
          AND ($4::timestamptz IS NULL OR (l.occurred_at, l.id) < ($4, $5::bigint))
          AND l.subject_type <> 'mfa_secret'
        ORDER BY l.occurred_at DESC, l.id DESC
        LIMIT $6`,
      [from, to, q.reservationId, q.cursor?.[0] ?? null, q.cursor?.[1] ?? 0, q.limit + 1],
    );
    const more = rows.length > q.limit;
    const pageRows = more ? rows.slice(0, q.limit) : rows;
    // Booking codes through BE-A's stay-view port, not a JOIN on reservation (ARC FB-S3-15 (e)).
    const stays = await readStays(
      tx,
      [...new Set(pageRows.map((r) => r.reservation_id).filter((x): x is string => !!x))],
      SYSTEM_ACTOR,
    );
    const data = pageRows.map((r) => ({
      occurredAt: toZonedIso(r.occurred_at, tz),
      actorType: r.actor_type,
      ...(r.actor_type === 'user' && r.display_name ? { userName: r.display_name } : {}),
      ...(r.session_id ? { sessionRef: r.session_id.slice(0, 8) } : {}),
      ...(r.device_name ? { trustedDeviceName: r.device_name } : {}),
      ...(r.request_id ? { requestId: r.request_id } : {}),
      subjectType: r.subject_type,
      action: r.action,
      ...(r.reservation_id && stays.get(r.reservation_id)
        ? { reservationCode: stays.get(r.reservation_id)?.code }
        : {}),
      ...(r.doc_type ? { subjectLabel: `${r.doc_type} ••${r.doc_last4 ?? ''}` } : {}),
      ...(r.reason_code ? { reasonCode: r.reason_code } : {}),
    }));
    const last = more ? rows[q.limit - 1] : undefined;
    return {
      data,
      page: {
        nextCursor: last ? encodeCursor([last.occurred_at.toISOString(), last.id]) : null,
        limit: q.limit,
      },
    };
  }
}
