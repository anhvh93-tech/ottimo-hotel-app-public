/**
 * listCommissions (US-087 AC2 narrowed to R2: SAL/CTV see only their own, `projected` rows created at B4;
 * earned/payable/paid and payouts are R3 – US-089). Scope M in SQL (payee_user_id = caller).
 * Date filter: creation day in the property calendar, [dateFrom, dateTo] inclusive.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { type PageInfo, decodeCursor, page } from '../../../shared/http/pagination';
import { type LocalDate, addDays, atLocal, toZonedIso } from '../../../shared/time';
import { PropertyContextService } from '../../platform/public/property-context';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import { type Caller, isOwnScope } from './quote-pricing';

interface Row {
  id: string;
  reservation_id: string | null;
  payee_type: 'agent' | 'staff';
  payee_name: string | null;
  rate_pct_snapshot: string;
  base_amount_vnd: number;
  amount_vnd: number;
  status: string;
  recognized_at: Date | null;
  version: number;
}

@Injectable()
export class CommissionsService {
  constructor(
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
  ) {}

  async list(
    tx: Tx,
    c: Caller,
    q: {
      statuses: string[];
      dateFrom?: LocalDate | undefined;
      dateTo?: LocalDate | undefined;
      cursor?: string | undefined;
      limit: number;
    },
  ): Promise<{
    data: Record<string, unknown>[];
    page: PageInfo;
    totals: { projectedVnd: number; earnedVnd: number; paidVnd: number };
  }> {
    const { timezone } = await this.property.now(tx);
    const own = isOwnScope(c) ? c.userId : null;
    const from = q.dateFrom ? atLocal(q.dateFrom, '00:00', timezone) : null;
    const to = q.dateTo ? atLocal(addDays(q.dateTo, 1), '00:00', timezone) : null;
    const filter = `($1::uuid IS NULL OR c.payee_user_id = $1)
        AND (cardinality($2::text[]) = 0 OR c.status = ANY($2::text[]))
        AND ($3::timestamptz IS NULL OR c.created_at >= $3)
        AND ($4::timestamptz IS NULL OR c.created_at < $4)`;
    const cur = decodeCursor(q.cursor, 1);
    const { rows } = await tx.query<Row>(
      `SELECT c.id, c.reservation_id, c.payee_type, u.display_name AS payee_name, c.rate_pct_snapshot,
              c.base_amount_vnd, c.amount_vnd, c.status, c.recognized_at, c.version
         FROM commission c LEFT JOIN app_user u ON u.id = c.payee_user_id
        WHERE ${filter} AND ($5::uuid IS NULL OR c.id < $5)
        ORDER BY c.id DESC LIMIT $6`,
      [own, q.statuses, from, to, cur ? String(cur[0]) : null, q.limit + 1],
    );
    const { rows: sums } = await tx.query<{ projected: string; earned: string; paid: string }>(
      `SELECT COALESCE(SUM(amount_vnd) FILTER (WHERE status = 'projected'), 0) AS projected,
              COALESCE(SUM(amount_vnd) FILTER (WHERE status IN ('earned', 'payable')), 0) AS earned,
              COALESCE(SUM(amount_vnd) FILTER (WHERE status = 'paid'), 0) AS paid
         FROM commission c WHERE ${filter}`,
      [own, q.statuses, from, to],
    );
    const p = page(rows, q.limit, (r) => [r.id]);
    const data: Record<string, unknown>[] = [];
    for (const r of p.data) {
      const res =
        r.reservation_id && this.reservations
          ? await this.reservations.ownership(tx, r.reservation_id)
          : null;
      data.push({
        id: r.id,
        ...(res ? { reservationCode: res.code } : {}),
        payeeType: r.payee_type,
        ...(r.payee_name ? { payeeName: r.payee_name } : {}),
        ratePctSnapshot: Number(r.rate_pct_snapshot),
        baseAmountVnd: r.base_amount_vnd,
        amountVnd: r.amount_vnd,
        status: r.status,
        ...(r.recognized_at ? { recognizedAt: toZonedIso(r.recognized_at, timezone) } : {}),
        payouts: [],
        version: r.version,
      });
    }
    const s = sums[0];
    return {
      data,
      page: p.page,
      totals: {
        projectedVnd: Number(s?.projected ?? 0),
        earnedVnd: Number(s?.earned ?? 0),
        paidVnd: Number(s?.paid ?? 0),
      },
    };
  }
}
