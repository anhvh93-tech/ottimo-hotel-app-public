/**
 * Minibar counts (US-035, US-003; BR-701/702/703; EP03-05 mục 5.2; OpenAPI 0.3.3 E05-04).
 * - getMinibarStandard: active minibar items with a standard quantity (the room's standard fridge) + the latest
 *   live `checkout` count of the business day (pre-fill from housekeeping).
 * - recordMinibarCheck: `checkout` needs every standard item (MINIBAR_ITEMS_INCOMPLETE); remaining ≤ standard
 *   (MINIBAR_QTY_OVER_STANDARD); items outside the fridge → NOT_IN_LIST. used = standard − remaining; each
 *   charged item with used > 0 → one folio line `minibar` (source minibar_check) at the sale price snapshot;
 *   free items only record consumption. A second `checkout` count replaces the first: its folio lines are
 *   reversed (BR-008) and `replacesCheckId` points at it. Housekeeping enters quantities, never sees money
 *   (serializer, rbac note 26) – scope "today": an in-house booking (checkout count: departing today).
 * Lock order: reservation (port) → folio.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { type FieldError, problem } from '../../../shared/problem';
import { type LocalDate, businessDate, localDate, toZonedIso } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';
import { FolioService } from '../../folio/public/folio.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { publishEvent } from '../../platform/public/staff-notify';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';

interface StandardItem {
  id: string;
  name: string;
  minibar_standard_qty: number;
  sale_price_vnd: number | null;
  cost_price_vnd: number | null;
}

interface CheckRow {
  id: string;
  mode: 'checkout' | 'stayover';
  checked_at: Date;
  total_vnd: number;
  refill_task_id: string | null;
  replaces_check_id: string | null;
}

interface StayInfo {
  id: string;
  code: string;
  status: string;
  folioId: string | null;
  roomId: string | null;
  roomNo: string | null;
  departureDate: LocalDate;
}

const DESK = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

@Injectable()
export class MinibarService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
  ) {}

  private port(): ReservationSalesPort {
    if (!this.reservations) throw new Error('reservations module not wired');
    return this.reservations;
  }

  private async businessToday(tx: Tx): Promise<{ today: LocalDate; tz: string; now: Date }> {
    const tz = await this.folios.timezone(tx);
    const now = this.clock.now();
    const rollover = await this.params.get<string>(tx, 'business_day_rollover', localDate(now, tz));
    return { today: businessDate(now, tz, rollover), tz, now };
  }

  /** Booking inside the caller's scope (HK "today": in house; checkout count only on the departure day). */
  private async stay(
    tx: Tx,
    roles: readonly string[],
    reservationId: string,
    mode: 'checkout' | 'stayover' | null,
    today: LocalDate,
  ): Promise<StayInfo> {
    // reservations port stayInfo (BE-A, ARC 4.3): booking facts without personal data, RLS only – the
    // operation scope (HK "today") is applied here.
    const v = await this.port().stayInfo(tx, reservationId);
    if (!v) throw problem('NOT_FOUND');
    const info: StayInfo = {
      id: v.id,
      code: v.code,
      status: v.status,
      folioId: v.folioId,
      roomId: v.roomId,
      roomNo: v.roomNo,
      departureDate: v.departureDate,
    };
    const desk = roles.some((r) => DESK.includes(r));
    if (!desk) {
      const inScope =
        info.status === 'in_house' && (mode !== 'checkout' || info.departureDate === today);
      if (!inScope) throw problem('NOT_FOUND');
    }
    return info;
  }

  private async standardItems(tx: Tx): Promise<StandardItem[]> {
    const { rows } = await tx.query<StandardItem>(
      `SELECT id, name, minibar_standard_qty, sale_price_vnd, cost_price_vnd FROM item
        WHERE kind = 'minibar' AND is_active AND minibar_standard_qty > 0
        ORDER BY code`,
    );
    return rows;
  }

  async standard(
    tx: Tx,
    roles: readonly string[],
    reservationId: string,
  ): Promise<Record<string, unknown>> {
    const { today, tz } = await this.businessToday(tx);
    const s = await this.stay(tx, roles, reservationId, null, today);
    const items = await this.standardItems(tx);
    const { rows } = await tx.query<CheckRow>(
      `SELECT id, mode, checked_at, total_vnd, refill_task_id, replaces_check_id FROM minibar_check
        WHERE reservation_id = $1 AND mode = 'checkout' AND business_date = $2 AND replaced_by_check_id IS NULL
        ORDER BY checked_at DESC LIMIT 1`,
      [s.id, today],
    );
    return {
      ...(s.roomNo ? { roomNo: s.roomNo } : {}),
      items: items.map((i) => ({
        itemId: i.id,
        itemName: i.name,
        standardQty: i.minibar_standard_qty,
        isFree: !i.sale_price_vnd,
        ...(i.sale_price_vnd ? { unitPriceVnd: i.sale_price_vnd } : {}),
      })),
      latestCheck: rows[0] ? await this.view(tx, rows[0], tz) : null,
    };
  }

  async record(
    tx: Tx,
    actor: { userId: string; roles: readonly string[]; requestId?: string },
    reservationId: string,
    input: {
      mode: 'checkout' | 'stayover';
      lines: Array<{ itemId: string; remainingQty: number }>;
      performedAt: Date | null;
    },
  ): Promise<Record<string, unknown>> {
    const { today, tz, now } = await this.businessToday(tx);
    const s = await this.stay(tx, actor.roles, reservationId, input.mode, today);
    const items = await this.standardItems(tx);
    const byId = new Map(items.map((i) => [i.id, i]));
    const errors: FieldError[] = [];
    const seen = new Set<string>();
    input.lines.forEach((l, i) => {
      const item = byId.get(l.itemId);
      if (!item || seen.has(l.itemId)) {
        errors.push({ field: `lines[${i}].itemId`, code: 'NOT_IN_LIST' });
        return;
      }
      seen.add(l.itemId);
      if (!Number.isInteger(l.remainingQty) || l.remainingQty < 0) {
        errors.push({ field: `lines[${i}].remainingQty`, code: 'VALUE_OUT_OF_RANGE' });
      } else if (l.remainingQty > item.minibar_standard_qty) {
        errors.push({ field: `lines[${i}].remainingQty`, code: 'MINIBAR_QTY_OVER_STANDARD' });
      }
    });
    if (input.mode === 'checkout' && items.some((i) => !seen.has(i.id))) {
      errors.push({ field: 'lines', code: 'MINIBAR_ITEMS_INCOMPLETE' });
    }
    const at = input.performedAt ?? now;
    if (at.getTime() > now.getTime()) errors.push({ field: 'performedAt', code: 'DATE_INVALID' });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });

    await this.port().lockForDeposit(tx, s.id);
    if (s.status !== 'in_house')
      throw problem('INVALID_TRANSITION', { extras: { currentState: s.status } });
    if (!s.folioId || !s.roomId)
      throw problem('INVALID_TRANSITION', { extras: { currentState: s.status } });
    await this.folios.lockForPosting(tx, s.folioId);

    const id = uuidv7();
    let replaces: string | null = null;
    if (input.mode === 'checkout') {
      const { rows: old } = await tx.query<{ id: string }>(
        `SELECT id FROM minibar_check WHERE reservation_id = $1 AND mode = 'checkout'
            AND replaced_by_check_id IS NULL FOR UPDATE`,
        [s.id],
      );
      if (old[0]) {
        replaces = old[0].id;
        const { rows: oldLines } = await tx.query<{ folio_line_id: string }>(
          `SELECT l.folio_line_id FROM minibar_check_line l
             JOIN folio_line f ON f.id = l.folio_line_id
            WHERE l.check_id = $1 AND l.folio_line_id IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = f.id)`,
          [replaces],
        );
        for (const l of oldLines) {
          await this.folios.reverseLine(tx, l.folio_line_id, 'minibar_recount', {
            userId: actor.userId,
            reservationCode: s.code,
            ...(actor.requestId ? { requestId: actor.requestId } : {}),
          });
        }
        await tx.query('UPDATE minibar_check SET replaced_by_check_id = $2 WHERE id = $1', [
          replaces,
          id,
        ]);
      }
    }
    // Lines: one folio line per charged item used (BR-702); prices snapshotted.
    const lineRows: Array<{
      itemId: string;
      standard: number;
      remaining: number;
      price: number | null;
      cost: number | null;
      amount: number;
      folioLineId: string | null;
    }> = [];
    let total = 0;
    for (const l of input.lines) {
      const item = byId.get(l.itemId) as StandardItem;
      const used = item.minibar_standard_qty - l.remainingQty;
      const price = item.sale_price_vnd && item.sale_price_vnd > 0 ? item.sale_price_vnd : null;
      const amount = price ? used * price : 0;
      let folioLineId: string | null = null;
      if (price && used > 0) {
        [folioLineId] = (await this.folios.postLines(
          tx,
          s.folioId,
          [
            {
              reservationId: s.id,
              category: 'minibar',
              description: item.name,
              quantity: used,
              unitPriceVnd: price,
              amountVnd: amount,
              serviceDate: today,
              source: 'minibar_check',
            },
          ],
          {
            userId: actor.userId,
            reservationCode: s.code,
            ...(actor.requestId ? { requestId: actor.requestId } : {}),
          },
        )) as [string];
      }
      total += amount;
      lineRows.push({
        itemId: item.id,
        standard: item.minibar_standard_qty,
        remaining: l.remainingQty,
        price,
        cost: item.cost_price_vnd,
        amount,
        folioLineId,
      });
    }
    await tx.query(
      `INSERT INTO minibar_check (id, organization_id, property_id, reservation_id, room_id, mode, business_date,
         checked_by, checked_at, replaces_check_id, total_vnd, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        s.id,
        s.roomId,
        input.mode,
        today,
        actor.userId,
        at,
        replaces,
        total,
        now,
      ],
    );
    for (const r of lineRows) {
      await tx.query(
        `INSERT INTO minibar_check_line (id, organization_id, property_id, check_id, item_id, standard_qty,
           remaining_qty, unit_price_vnd_snapshot, unit_cost_vnd_snapshot, amount_vnd, folio_line_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          uuidv7(),
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          id,
          r.itemId,
          r.standard,
          r.remaining,
          r.price,
          r.cost,
          r.amount,
          r.folioLineId,
        ],
      );
    }
    await publishEvent(tx, this.events, 'reservation.changed', s.id);
    const { rows } = await tx.query<CheckRow>(
      `SELECT id, mode, checked_at, total_vnd, refill_task_id, replaces_check_id FROM minibar_check WHERE id = $1`,
      [id],
    );
    return this.view(tx, rows[0] as CheckRow, tz);
  }

  private async view(tx: Tx, c: CheckRow, tz: string): Promise<Record<string, unknown>> {
    const { rows } = await tx.query<{
      item_id: string;
      name: string;
      standard_qty: number;
      remaining_qty: number;
      used_qty: number;
      unit_price_vnd_snapshot: number | null;
      amount_vnd: number;
    }>(
      `SELECT l.item_id, i.name, l.standard_qty, l.remaining_qty, l.used_qty, l.unit_price_vnd_snapshot,
              l.amount_vnd
         FROM minibar_check_line l JOIN item i ON i.id = l.item_id
        WHERE l.check_id = $1 ORDER BY i.code`,
      [c.id],
    );
    return {
      id: c.id,
      mode: c.mode,
      checkedAt: toZonedIso(c.checked_at, tz),
      lines: rows.map((l) => ({
        itemId: l.item_id,
        itemName: l.name,
        standardQty: l.standard_qty,
        remainingQty: l.remaining_qty,
        usedQty: l.used_qty,
        isFree: l.unit_price_vnd_snapshot === null,
        amountVnd: l.amount_vnd,
      })),
      totalVnd: c.total_vnd,
      ...(c.refill_task_id ? { refillTaskId: c.refill_task_id } : {}),
      ...(c.replaces_check_id ? { replacesCheckId: c.replaces_check_id } : {}),
    };
  }
}
