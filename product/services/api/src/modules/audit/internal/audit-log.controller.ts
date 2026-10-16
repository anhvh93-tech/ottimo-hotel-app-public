/**
 * S27 – activity log (US-006; OpenAPI listAuditEvents).
 * - OWN/MGR: every event of the property (+ organisation-level events for the owner), filters actor/category.
 * - FDL/FD (`x-scope: own`): always locked to their own events, the actor filter is ignored (AC2) – in SQL.
 * - Dates `from`/`to` are calendar dates in the property time zone, inclusive; default = last 7 days;
 *   range ≤ 92 days (BA EP00 6.2, technical limit) → 422 errors[{field: to, code: DATE_RANGE_TOO_LONG}].
 * - Cursor pagination on (occurred_at, id) DESC; index audit_event_property_category_idx /
 *   audit_event_property_actor_idx; the table is partitioned by month so the date range prunes partitions.
 * - before/after were reduced to the entity allowlist when written (SR-AUD-03); actorName passes the role
 *   serializer (x-rbac-field D27).
 */
import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database } from '../../../db/database';
import { AUDIT_CATEGORIES, type AuditCategory } from '../../../db/schema';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { decodeCursor, page, parseLimit } from '../../../shared/http/pagination';
import { problem } from '../../../shared/problem';
import { addDays, atLocal, localDate, toZonedIso } from '../../../shared/time';

/** Longest date range of one query (BA EP00 6.2 – performance limit, not a business rule). */
export const AUDIT_MAX_RANGE_DAYS = 92;
const DEFAULT_RANGE_DAYS = 7;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Row {
  id: number;
  occurred_at: Date;
  actor_type: 'user' | 'guest' | 'system';
  actor_name: string | null;
  category: AuditCategory;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_code: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
}

function validDate(field: string, v: string): string {
  const d = new Date(`${v}T00:00:00Z`);
  if (!DATE.test(v) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
    throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'DATE_INVALID' }] });
  }
  return v;
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000,
  );
}

@Controller('v1/properties/:propertyId/audit-events')
export class AuditLogController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Get()
  @Operation('listAuditEvents')
  async list(
    @Req() req: GuardedRequest,
    @Query('category') category?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const p = req.ottimoAuth?.principal;
    if (!p?.propertyId) throw problem('UNAUTHENTICATED');
    if (category !== undefined && !AUDIT_CATEGORIES.includes(category as AuditCategory)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'category', code: 'NOT_IN_LIST' }] });
    }
    if (actorUserId !== undefined && !UUID.test(actorUserId)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'actorUserId', code: 'VALIDATION_FAILED' }],
      });
    }
    const n = parseLimit(limit, 50);
    const c = decodeCursor(cursor, 2);
    const full = p.roles.includes('owner') || p.roles.includes('manager');
    const propertyId = p.propertyId;

    return this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const tzRow = await tx.query<{ timezone: string }>(
          'SELECT timezone FROM property WHERE id = $1',
          [propertyId],
        );
        const tz = tzRow.rows[0]?.timezone;
        if (!tz) throw problem('NOT_FOUND');
        const today = localDate(this.clock.now(), tz);
        const dateTo = to !== undefined ? validDate('to', to) : today;
        const dateFrom =
          from !== undefined ? validDate('from', from) : addDays(dateTo, -(DEFAULT_RANGE_DAYS - 1));
        if (dateFrom > dateTo) {
          throw problem('VALIDATION_FAILED', { errors: [{ field: 'from', code: 'DATE_ORDER' }] });
        }
        if (daysBetween(dateFrom, dateTo) + 1 > AUDIT_MAX_RANGE_DAYS) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'to', code: 'DATE_RANGE_TOO_LONG' }],
            extras: { max: AUDIT_MAX_RANGE_DAYS },
          });
        }

        const params: unknown[] = [];
        const ph = (v: unknown) => {
          params.push(v);
          return `$${params.length}`;
        };
        const where = [
          `e.occurred_at >= ${ph(atLocal(dateFrom, '00:00', tz))}`,
          `e.occurred_at < ${ph(atLocal(addDays(dateTo, 1), '00:00', tz))}`,
        ];
        const prop = ph(propertyId);
        // Organisation-level events (property_id NULL: user management…) only for the owner.
        where.push(
          p.roles.includes('owner')
            ? `(e.property_id = ${prop} OR e.property_id IS NULL)`
            : `e.property_id = ${prop}`,
        );
        if (!full)
          where.push(`e.actor_user_id = ${ph(p.userId)}`); // x-scope own (AC2)
        else if (actorUserId) where.push(`e.actor_user_id = ${ph(actorUserId)}`);
        if (category) where.push(`e.category = ${ph(category)}`);
        if (c) {
          where.push(
            `(e.occurred_at, e.id) < (${ph(String(c[0]))}::timestamptz, ${ph(Number(c[1]))}::bigint)`,
          );
        }
        const { rows } = await tx.query<Row>(
          `SELECT e.id, e.occurred_at, e.actor_type, u.display_name AS actor_name, e.category, e.action,
                  e.entity_type, e.entity_id, e.entity_code, e.before, e.after, e.reason
             FROM audit_event e
             LEFT JOIN app_user u ON u.id = e.actor_user_id
            WHERE ${where.join(' AND ')}
            ORDER BY e.occurred_at DESC, e.id DESC
            LIMIT ${ph(n + 1)}`,
          params,
        );
        const paged = page(rows, n, (r) => [r.occurred_at.toISOString(), r.id]);
        return {
          data: paged.data.map((r) => {
            const uuidId = r.entity_id && UUID.test(r.entity_id) ? r.entity_id : null;
            const code = r.entity_code ?? (r.entity_id && !uuidId ? r.entity_id : null);
            return {
              occurredAt: toZonedIso(r.occurred_at, tz),
              actorType: r.actor_type,
              ...(r.actor_name ? { actorName: r.actor_name } : {}),
              category: r.category,
              action: r.action,
              ...(r.entity_type ? { entityType: r.entity_type } : {}),
              ...(uuidId ? { entityId: uuidId } : {}),
              ...(code ? { entityCode: code } : {}),
              ...(r.before ? { before: r.before } : {}),
              ...(r.after ? { after: r.after } : {}),
              ...(r.reason ? { reason: r.reason } : {}),
            };
          }),
          page: paged.page,
        };
      },
      { readOnly: true },
    );
  }
}
