/**
 * Minibar counts (US-035, US-003; BR-701/702/703; EP03-05 mục 5.2; OpenAPI 0.3.3 E05-04) – mô hình minibar M-1
 * (ARC `openapi-0.3.7.md` mục 16, rules R1–R10; BUG-R2-135…138, 140; oracles BR-434-15/16, BR-702-02/03,
 * BR-703-01). See ./fridge.ts for the fridge (stay × room) and its fill.
 * - getMinibarStandard: the items of the fridge (its latest fill – mark and sale price), with DOM (e) fields for
 *   the desk (`lastCheckUsedQty`, live folio line and its quantity/amount, `adjustedAfterLastCheck`) and the latest
 *   live `checkout` count of the fridge of the business day (pre-fill from housekeeping).
 * - recordMinibarCheck: R1 a `checkout` count replaces the previous count of the SAME fridge only; R3 its items
 *   are the fridge's (an item added to the catalogue after the fill → NOT_IN_LIST; one deactivated / made free
 *   after it is still counted); R4 used = mark − remaining; R6 used equal to the previous count or to the live
 *   folio line → that line (or "no line" after a void) is KEPT with its FOC, whatever the catalogue says now; R7
 *   otherwise the live line is reversed and ONE line is posted = used × the fill's price, `charge_code` = the item
 *   code (FOC key `item:minibar:<code>` – R8); a free item only records consumption. Counting the fridge of a room
 *   the stay has left (B14) creates its refill task at once (R9).
 * Housekeeping enters quantities, never sees money (serializer, rbac note 26) – scope "today": an in-house
 * booking (checkout count: departing today). Lock order: folio → minibar_check.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { type FieldError, problem } from '../../../shared/problem';
import { type LocalDate, businessDate, localDate, toZonedIso } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';
import { FolioService, type FolioLineRow } from '../../folio/public/folio.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { publishEvent } from '../../platform/public/staff-notify';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import { MinibarCheckoutPort } from '../public/minibar-checkout.port';
import { type FridgeItem, fridgeItems, primaryOf, stayRooms } from './fridge';

interface CheckRow {
  id: string;
  mode: 'checkout' | 'stayover';
  checked_at: Date;
  created_at: Date;
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

/** What the previous count of the fridge and the folio say about one item (R6, DOM (e)). */
interface ItemHistory {
  /** Used at the previous count of the fridge in the same fill period – null = not counted yet. */
  lastCheckUsedQty: number | null;
  /** The folio line the previous count wrote (null = none: used 0, free). */
  countedLineId: string | null;
  /** Live end of that line's adjustFolioLine chain – null when reversed / voided since. */
  live: FolioLineRow | null;
}

const DESK = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

@Injectable()
export class MinibarService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(MinibarCheckoutPort) private readonly refills: MinibarCheckoutPort,
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

  /**
   * R1: the fridge a request is about – (primary booking of the stay, room). `roomId` absent = the room the
   * booking is in now; another room must be one the stay has been in (B14), else 422 NOT_IN_LIST.
   */
  private async fridgeOf(
    tx: Tx,
    s: StayInfo,
    roomId: string | undefined,
    today: LocalDate,
  ): Promise<{ primaryId: string; roomId: string; roomNo: string | null }> {
    const primaryId = (await primaryOf(tx, s.id)) ?? s.id;
    if (!roomId || roomId === s.roomId) {
      if (!s.roomId) throw problem('INVALID_TRANSITION', { extras: { currentState: s.status } });
      return { primaryId, roomId: s.roomId, roomNo: s.roomNo };
    }
    const rooms = await stayRooms(tx, primaryId, today);
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
    }
    return { primaryId, roomId: room.roomId, roomNo: room.roomNo };
  }

  /** The live `checkout` count of a fridge (R1). */
  private async liveCount(
    tx: Tx,
    primaryId: string,
    roomId: string,
    opts: { lock?: boolean; businessDate?: LocalDate } = {},
  ): Promise<CheckRow | null> {
    const { rows } = await tx.query<CheckRow>(
      `SELECT id, mode, checked_at, created_at, total_vnd, refill_task_id, replaces_check_id FROM minibar_check
        WHERE reservation_id = $1 AND room_id = $2 AND mode = 'checkout' AND replaced_by_check_id IS NULL
          AND ($3::date IS NULL OR business_date = $3)
        ORDER BY checked_at DESC LIMIT 1${opts.lock ? ' FOR UPDATE' : ''}`,
      [primaryId, roomId, opts.businessDate ?? null],
    );
    return rows[0] ?? null;
  }

  /** The live end of a folio line's adjustFolioLine chain (null = reversed / voided without replacement). */
  private liveEnd(lines: readonly FolioLineRow[], startId: string): FolioLineRow | null {
    const reversed = new Set(lines.filter((l) => l.reversal_of_id).map((l) => l.reversal_of_id));
    const byId = new Map(lines.map((l) => [l.id, l]));
    let cur = byId.get(startId) ?? null;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      if (cur.line_state === 'posted' && !cur.reversal_of_id && !reversed.has(cur.id)) return cur;
      const id = cur.id;
      cur =
        lines.find(
          (n) => n.related_line_id === id && n.category === 'minibar' && !n.reversal_of_id,
        ) ?? null;
    }
    return null;
  }

  /** R6 / DOM (e): per item, the previous count of the fridge and the live folio line it wrote. */
  private async history(
    tx: Tx,
    folioId: string,
    prev: CheckRow | null,
    fill: { source: string; filledAt: Date } | null,
  ): Promise<Map<string, ItemHistory>> {
    const out = new Map<string, ItemHistory>();
    if (!prev) return out;
    // R7: the first count after a mid-stay refill (R3) is a new count – the previous one is of another period.
    const samePeriod =
      !fill || fill.source !== 'refill' || prev.created_at.getTime() >= fill.filledAt.getTime();
    const { rows } = await tx.query<{
      item_id: string;
      used_qty: number;
      folio_line_id: string | null;
    }>(`SELECT item_id, used_qty, folio_line_id FROM minibar_check_line WHERE check_id = $1`, [
      prev.id,
    ]);
    const lines = await this.folios.lines(tx, folioId);
    for (const r of rows) {
      out.set(r.item_id, {
        lastCheckUsedQty: samePeriod ? Number(r.used_qty) : null,
        countedLineId: r.folio_line_id,
        live: r.folio_line_id ? this.liveEnd(lines, r.folio_line_id) : null,
      });
    }
    return out;
  }

  async standard(
    tx: Tx,
    roles: readonly string[],
    reservationId: string,
    roomId?: string,
  ): Promise<Record<string, unknown>> {
    const { today, tz } = await this.businessToday(tx);
    const s = await this.stay(tx, roles, reservationId, null, today);
    if (!s.roomId) {
      return { items: [], latestCheck: null };
    }
    const fr = await this.fridgeOf(tx, s, roomId, today);
    const { fill, items } = await fridgeItems(tx, fr.primaryId, fr.roomId);
    const desk = roles.some((r) => DESK.includes(r));
    const prev = await this.liveCount(tx, fr.primaryId, fr.roomId);
    const hist =
      desk && s.folioId
        ? await this.history(tx, s.folioId, prev, fill)
        : new Map<string, ItemHistory>();
    // Pre-fill (US-035 AC1): the count of the business day for the room the guest is in; for a room the stay
    // has left (B14) its live count whatever the day (R10 – what H16 step 1 shows for that fridge).
    const latest = await this.liveCount(
      tx,
      fr.primaryId,
      fr.roomId,
      fr.roomId === s.roomId ? { businessDate: today } : {},
    );
    return {
      ...(fr.roomNo ? { roomNo: fr.roomNo } : {}),
      items: items.map((i) => {
        const h = hist.get(i.itemId);
        return {
          itemId: i.itemId,
          itemName: i.name,
          standardQty: i.mark,
          isFree: i.priceVnd === null,
          ...(i.priceVnd !== null ? { unitPriceVnd: i.priceVnd } : {}),
          lastCheckUsedQty: h ? h.lastCheckUsedQty : null,
          ...(desk
            ? {
                folioLineId: h?.live?.id ?? null,
                // 0 when the counted line was voided / reversed since; null = never charged in this fridge
                folioUsedQty: h?.live ? Number(h.live.quantity) : h?.countedLineId ? 0 : null,
                ...(h?.live ? { folioAmountVnd: h.live.amount_vnd } : {}),
                adjustedAfterLastCheck: !!h?.countedLineId && h.live?.id !== h.countedLineId,
              }
            : {}),
        };
      }),
      latestCheck: latest && s.folioId ? await this.view(tx, latest, tz, s.folioId) : null,
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
      roomId?: string;
    },
  ): Promise<Record<string, unknown>> {
    // DOM BE-29: a mid-stay count (US-033, R3) would charge the same missing items again at checkout – no refill
    // task, no baseline after a refill (BR-702/703). Closed until US-033.
    if (input.mode === 'stayover') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'mode', code: 'NOT_IN_LIST' }] });
    }
    const { today, tz, now } = await this.businessToday(tx);
    const s = await this.stay(tx, actor.roles, reservationId, input.mode, today);
    if (!s.folioId || !s.roomId)
      throw problem('INVALID_TRANSITION', { extras: { currentState: s.status } });
    const fr = await this.fridgeOf(tx, s, input.roomId, today);
    const { fill, items } = await fridgeItems(tx, fr.primaryId, fr.roomId);
    const byId = new Map(items.map((i) => [i.itemId, i]));
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
      } else if (l.remainingQty > item.mark) {
        errors.push({ field: `lines[${i}].remainingQty`, code: 'MINIBAR_QTY_OVER_STANDARD' });
      }
    });
    if (input.mode === 'checkout' && items.some((i) => !seen.has(i.itemId))) {
      errors.push({ field: 'lines', code: 'MINIBAR_ITEMS_INCOMPLETE' });
    }
    const at = input.performedAt ?? now;
    if (at.getTime() > now.getTime()) errors.push({ field: 'performedAt', code: 'DATE_INVALID' });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });

    // ARC-BE-S3-25: lock first, then check the state. The folio lock serialises with B18 (check-out locks
    // the folio before settling); the booking lock of lockForDeposit is not used – it applies the desk scope
    // and HK counts minibars outside it.
    await this.folios.lockForPosting(tx, s.folioId);
    const fresh = await this.port().stayInfo(tx, s.id);
    if (fresh?.status !== 'in_house')
      throw problem('INVALID_TRANSITION', { extras: { currentState: fresh?.status ?? s.status } });

    const id = uuidv7();
    const prev = await this.liveCount(tx, fr.primaryId, fr.roomId, { lock: true });
    const hist = await this.history(tx, s.folioId, prev, fill);
    if (prev) {
      await tx.query('UPDATE minibar_check SET replaced_by_check_id = $2 WHERE id = $1', [
        prev.id,
        id,
      ]);
    }
    const folioActor = {
      userId: actor.userId,
      reservationCode: s.code,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    };
    let reversedOnly = false;
    const lineRows: Array<{
      itemId: string;
      standard: number;
      remaining: number;
      price: number | null;
      cost: number | null;
      amount: number;
      folioLineId: string | null;
    }> = [];
    for (const l of input.lines) {
      const item = byId.get(l.itemId) as FridgeItem;
      const used = item.mark - l.remainingQty;
      const h = hist.get(item.itemId);
      const folioQty = h?.live ? Number(h.live.quantity) : h?.countedLineId ? 0 : null;
      // R6 (DOM (e)): a re-count of what was counted, or of what the desk set on the folio → keep that line
      // (or keep "no line" after a void) with its FOC and its price – never re-priced by the catalogue now.
      const keep =
        (h?.lastCheckUsedQty !== null &&
          h?.lastCheckUsedQty !== undefined &&
          used === h.lastCheckUsedQty) ||
        (folioQty !== null && used === folioQty);
      if (keep) {
        lineRows.push({
          itemId: item.itemId,
          standard: item.mark,
          remaining: l.remainingQty,
          price: h?.live ? h.live.unit_price_vnd : item.priceVnd,
          cost: item.costVnd,
          amount: h?.live ? h.live.amount_vnd : 0,
          folioLineId: h?.live?.id ?? null,
        });
        continue;
      }
      // R7: a new count – the live line is reversed (BR-008) and ONE line posted at the fill's price.
      if (h?.live) {
        await this.folios.reverseLine(tx, h.live.id, 'minibar_recount', folioActor, {
          skipReductionSync: true,
        });
        reversedOnly = true;
      }
      let folioLineId: string | null = null;
      const amount = item.priceVnd !== null && used > 0 ? used * item.priceVnd : 0;
      if (amount > 0) {
        [folioLineId] = (await this.folios.postLines(
          tx,
          s.folioId,
          [
            {
              reservationId: s.id,
              category: 'minibar',
              description: item.name,
              quantity: used,
              unitPriceVnd: item.priceVnd as number,
              amountVnd: amount,
              serviceDate: today,
              source: 'minibar_check',
              chargeCode: item.code,
              labelParams: { item: item.name, qty: used },
            },
          ],
          folioActor,
          { cause: 'manual_adjust' },
        )) as [string];
        reversedOnly = false; // postLines re-synced the FOC of the folio (R8)
      }
      lineRows.push({
        itemId: item.itemId,
        standard: item.mark,
        remaining: l.remainingQty,
        price: item.priceVnd,
        cost: item.costVnd,
        amount,
        folioLineId,
      });
    }
    // An item gone to 0: its FOC goes dormant now (R8), not at some later sync.
    if (reversedOnly) {
      await this.folios.syncReductions(tx, s.folioId, {
        userId: actor.userId,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
        cause: 'manual_adjust',
      });
    }
    const total = lineRows.reduce((a, r) => a + r.amount, 0);
    await tx.query(
      `INSERT INTO minibar_check (id, organization_id, property_id, reservation_id, room_id, mode, business_date,
         checked_by, checked_at, replaces_check_id, total_vnd, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        fr.primaryId,
        fr.roomId,
        input.mode,
        today,
        actor.userId,
        at,
        prev?.id ?? null,
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
    // R9 (BR-703-01): the fridge of a room the stay has left is counted like a check-out – refill task now.
    if (fr.roomId !== s.roomId) await this.refills.onCheckedOut(tx, fr.primaryId, fr.roomId);
    await publishEvent(tx, this.events, 'reservation.changed', s.id);
    const { rows } = await tx.query<CheckRow>(
      `SELECT id, mode, checked_at, created_at, total_vnd, refill_task_id, replaces_check_id
         FROM minibar_check WHERE id = $1`,
      [id],
    );
    return this.view(tx, rows[0] as CheckRow, tz, s.folioId);
  }

  /** R10: a count as the desk sees it – amounts = the live folio lines of the fridge (desk edits included). */
  private async view(
    tx: Tx,
    c: CheckRow,
    tz: string,
    folioId: string,
  ): Promise<Record<string, unknown>> {
    const { rows } = await tx.query<{
      item_id: string;
      name: string;
      standard_qty: number;
      remaining_qty: number;
      used_qty: number;
      unit_price_vnd_snapshot: number | null;
      amount_vnd: number;
      folio_line_id: string | null;
    }>(
      `SELECT l.item_id, i.name, l.standard_qty, l.remaining_qty, l.used_qty, l.unit_price_vnd_snapshot,
              l.amount_vnd, l.folio_line_id
         FROM minibar_check_line l JOIN item i ON i.id = l.item_id
        WHERE l.check_id = $1 ORDER BY i.code`,
      [c.id],
    );
    const lines = rows.some((r) => r.folio_line_id) ? await this.folios.lines(tx, folioId) : [];
    const amountOf = (r: (typeof rows)[number]) =>
      r.folio_line_id ? (this.liveEnd(lines, r.folio_line_id)?.amount_vnd ?? 0) : 0;
    const out = rows.map((l) => ({
      itemId: l.item_id,
      itemName: l.name,
      standardQty: l.standard_qty,
      remainingQty: l.remaining_qty,
      usedQty: l.used_qty,
      isFree: l.unit_price_vnd_snapshot === null,
      amountVnd: amountOf(l),
    }));
    return {
      id: c.id,
      mode: c.mode,
      checkedAt: toZonedIso(c.checked_at, tz),
      lines: out,
      totalVnd: out.reduce((a, l) => a + l.amountVnd, 0),
      ...(c.refill_task_id ? { refillTaskId: c.refill_task_id } : {}),
      ...(c.replaces_check_id ? { replacesCheckId: c.replaces_check_id } : {}),
    };
  }
}
