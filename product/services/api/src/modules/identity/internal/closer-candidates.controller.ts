/**
 * listCloserCandidates (OpenAPI 0.3.5 A-06, rbac S05/D27): people FD+ may name as the closer of a booking –
 * ACTIVE users with a live role in this property (SEC-BE-26: revoked role or locked/disabled account never
 * listed): `collaborator` → kind `agent`; `sales_staff`, `front_desk`, `front_desk_lead`, `manager`, `owner` →
 * kind `staff`. Only id, display name, kind (no username, phone, e-mail, lock state). ≤ 200, no paging.
 */
import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { problem } from '../../../shared/problem';

const MAX = 200;

@Controller('v1/properties/:propertyId/closer-candidates')
export class CloserCandidatesController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  @Operation('listCloserCandidates')
  async list(@Req() req: GuardedRequest, @Query('kind') kind?: string) {
    const k = kind ?? 'all';
    if (k !== 'agent' && k !== 'staff' && k !== 'all') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'NOT_IN_LIST' }] });
    }
    const p = req.ottimoAuth?.principal;
    if (!p) throw new Error('handler reached without an authenticated principal');
    return this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const { rows } = await tx.query<{ id: string; display_name: string; agent: boolean }>(
          `SELECT u.id, u.display_name, bool_or(upr.role = 'collaborator') AND NOT bool_or(upr.role <> 'collaborator') AS agent
             FROM app_user u JOIN user_property_role upr ON upr.user_id = u.id
            WHERE upr.property_id = $1 AND upr.revoked_at IS NULL AND u.status = 'active'
              AND upr.role IN ('collaborator', 'sales_staff', 'front_desk', 'front_desk_lead', 'manager', 'owner')
            GROUP BY u.id, u.display_name
            ORDER BY u.display_name, u.id
            LIMIT $2`,
          [tx.ctx.propertyId, MAX],
        );
        const data = rows
          .map((r) => ({
            userId: r.id,
            displayName: r.display_name,
            kind: r.agent ? ('agent' as const) : ('staff' as const),
          }))
          .filter((c) => k === 'all' || c.kind === k);
        return { data };
      },
      { readOnly: true },
    );
  }
}
