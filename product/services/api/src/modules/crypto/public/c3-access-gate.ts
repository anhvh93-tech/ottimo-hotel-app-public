/**
 * C3 access gate for staff endpoints (SEC s3-checklist B3, E1; SR-C3-07/09, SR-RL-06; EP06 mục 0).
 *
 * Order of a C3 read (getGuestDocumentSensitive, getDocumentImage, getPortalData – and BE-B's
 * getRefundDestination): AuthGuard (session → trusted device → role) → `assertStepUp()` (401
 * REAUTH_REQUIRED when the sliding window `c3_stepup_minutes` has expired) → record/scope lookup (404) →
 * reason → `record()` (rate limit + c3_access_log BEFORE the data; a failed log write = 503, no data) →
 * response with `Cache-Control: no-store` (`noStore()`).
 *
 * Step-up window = user_session.stepup_until (erd 11), opened by POST /v1/me/step-up (stepUp) and moved
 * forward by every successful C3 operation (sliding – SR-C3-09).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type StaffPrincipal, tenantOf } from '../../../shared/http/auth.guard';
import { problem } from '../../../shared/problem';
import { localDate } from '../../../shared/time';
import { AuditService, type C3AccessEntry } from '../../audit/public/audit.service';
import { ParameterService } from '../../platform/public/parameter.service';

/** SR-RL-06: C3 reads per user and hour – warning (security event) and hard block. Technical constants. */
export const C3_RATE = { warnAt: 60, blockAt: 200, windowMs: 60 * 60_000 } as const;

export interface C3Reply {
  header(name: string, value: string): unknown;
}

/** SR-C3-03: C3 responses are never cached by the browser or a proxy. */
export function noStore(reply: C3Reply): void {
  reply.header('Cache-Control', 'no-store');
  reply.header('Pragma', 'no-cache');
}

@Injectable()
export class C3AccessGate {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Before the unit of work: is the step-up window of this session still open? */
  async assertStepUp(p: StaffPrincipal): Promise<void> {
    const until = await this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const { rows } = await tx.query<{ stepup_until: Date | null }>(
          'SELECT stepup_until FROM user_session WHERE id = $1',
          [p.sessionId],
        );
        return rows[0]?.stepup_until ?? null;
      },
      { readOnly: true },
    );
    if (!until || until.getTime() <= this.clock.now().getTime()) {
      throw problem('REAUTH_REQUIRED');
    }
  }

  /** Opens (or re-opens) the window after a successful re-authentication. Returns its end. */
  async openWindow(tx: Tx, p: StaffPrincipal): Promise<Date> {
    const minutes = await this.windowMinutes(tx);
    const until = new Date(this.clock.now().getTime() + minutes * 60_000);
    await tx.query('UPDATE user_session SET stepup_until = $2 WHERE id = $1', [p.sessionId, until]);
    return until;
  }

  /**
   * Inside the C3 transaction, BEFORE the value is returned: SR-RL-06 limit for reads, then the
   * c3_access_log row; with `stepUp` the sliding window moves forward. Any failure to write the log is a
   * 503 – the caller's transaction rolls back and no C3 value leaves the server (SR-C3-07).
   */
  async record(
    tx: Tx,
    p: StaffPrincipal,
    entry: Omit<C3AccessEntry, 'sessionId' | 'trustedDeviceId'>,
    opts: { stepUp?: boolean } = {},
  ): Promise<void> {
    if (entry.action === 'view' || entry.action === 'copy') await this.rateLimit(tx, p);
    try {
      await this.audit.recordC3Access(tx, {
        ...entry,
        sessionId: p.sessionId,
        ...(p.trustedDeviceId ? { trustedDeviceId: p.trustedDeviceId } : {}),
      });
    } catch {
      throw problem('SERVICE_UNAVAILABLE', { detail: 'access log unavailable' });
    }
    if (opts.stepUp) await this.openWindow(tx, p);
  }

  private async rateLimit(tx: Tx, p: StaffPrincipal): Promise<void> {
    const now = this.clock.now();
    const { rows } = await tx.query<{ n: number; oldest: Date | null }>(
      `SELECT count(*)::int AS n, min(occurred_at) AS oldest FROM c3_access_log
        WHERE user_id = $1 AND occurred_at > $2 AND action IN ('view', 'copy')`,
      [p.userId, new Date(now.getTime() - C3_RATE.windowMs)],
    );
    const n = rows[0]?.n ?? 0;
    if (n >= C3_RATE.blockAt) {
      const oldest = rows[0]?.oldest ?? now;
      const wait = Math.max(
        1,
        Math.ceil((oldest.getTime() + C3_RATE.windowMs - now.getTime()) / 1000),
      );
      throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(wait) } });
    }
    if (n + 1 === C3_RATE.warnAt) {
      await this.audit.record(tx, {
        category: 'security',
        action: 'c3.read_rate_warning',
        entityType: 'operation',
        entityId: p.userId,
        sessionId: p.sessionId,
      });
    }
  }

  private async windowMinutes(tx: Tx): Promise<number> {
    const tz = await this.timezone(tx);
    return this.params.get<number>(tx, 'c3_stepup_minutes', localDate(this.clock.now(), tz));
  }

  private async timezone(tx: Tx): Promise<string> {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    return rows[0]?.timezone ?? 'Asia/Ho_Chi_Minh';
  }
}
