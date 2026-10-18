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
import {
  type FridgeItem,
  currentRoomOfStay,
  fridgeItems,
  isCurrentPeriod,
  lockFridge,
  lockFridgeParents,
  lockStayBookings,
  primaryOf,
  registerFridge,
  stayIsInRoom,
  stayRooms,
} from './fridge';
import { reconcileRefillTasks } from './refill-tasks';

interface CheckRow {
  id: string;
  mode: 'checkout' | 'stayover';
  checked_at: Date;
  created_at: Date;
  total_vnd: number;
  refill_task_id: string | null;
  replaces_check_id: string | null;
  replaced_by_check_id?: string | null;
  business_date?: string;
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
    roomId?: string,
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
      // BUG-R2-152 (R4MINI-02): the fridge of a room the stay has left (B14) is counted like a check-out – by
      // housekeeping too, on a day it has a task in that room (the B14 `checkout_clean`), not only on the
      // departure day of the booking.
      const oldFridgeToday =
        mode === 'checkout' &&
        !!roomId &&
        roomId !== info.roomId &&
        (await this.taskInRoomToday(tx, roomId, today));
      const inScope =
        info.status === 'in_house' &&
        (mode !== 'checkout' || info.departureDate === today || oldFridgeToday);
      if (!inScope) throw problem('NOT_FOUND');
    }
    return info;
  }

  /** A housekeeping task in the room due today (not cancelled) – HK's "today" scope for a left fridge. */
  private async taskInRoomToday(tx: Tx, roomId: string, today: LocalDate): Promise<boolean> {
    const { rows } = await tx.query<{ found: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM hk_task WHERE room_id = $1 AND due_date = $2 AND status <> 'cancelled')
         AS found`,
      [roomId, today],
    );
    return !!rows[0]?.found;
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

  /**
   * Kỳ nạp (ARC R1, BUG-R2-144): counts of the fridge's CURRENT period (`fill_id` = its latest fill). `live` = the
   * live one (not replaced) – "counted" for B18 / latestCheck; otherwise the latest one, live or not (a count made
   * stale when the stay went on in the fridge after a count without money) – the history of R6.
   */
  private async periodCount(
    tx: Tx,
    primaryId: string,
    roomId: string,
    fillId: string | null,
    opts: { live?: boolean; lock?: boolean } = {},
  ): Promise<CheckRow | null> {
    const { rows } = await tx.query<CheckRow>(
      `SELECT id, mode, checked_at, created_at, total_vnd, refill_task_id, replaces_check_id,
              replaced_by_check_id, business_date::text AS business_date FROM minibar_check
        WHERE reservation_id = $1 AND room_id = $2 AND mode = 'checkout'
          AND fill_id IS NOT DISTINCT FROM $3::uuid
          ${opts.live ? 'AND replaced_by_check_id IS NULL' : ''}
        ORDER BY created_at DESC, id DESC LIMIT 1${opts.lock ? ' FOR UPDATE' : ''}`,
      [primaryId, roomId, fillId],
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

  /**
   * R6 / DOM (e): per item, the previous count of the fridge IN THE CURRENT PERIOD and the live folio line it
   * wrote (R7: the first count of a new period has no history – the lines of earlier periods stay as they are).
   */
  private async history(
    tx: Tx,
    folioId: string,
    prev: CheckRow | null,
  ): Promise<Map<string, ItemHistory>> {
    const out = new Map<string, ItemHistory>();
    if (!prev) return out;
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
        lastCheckUsedQty: Number(r.used_qty),
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
    const fillId = fill?.id ?? null;
    const prev = await this.periodCount(tx, fr.primaryId, fr.roomId, fillId);
    const hist =
      desk && s.folioId ? await this.history(tx, s.folioId, prev) : new Map<string, ItemHistory>();
    // ARC R9: latestCheck = the live count after the latest mark of the fridge (its current period; a count
    // made stale when the stay went on is no longer "counted") – null = to count again. K11-09 (DOM BR-703 note 7,
    // ARC 16.19 bổ sung): for the fridge of the room the stay is in, only a count of today's business day.
    let latest = await this.periodCount(tx, fr.primaryId, fr.roomId, fillId, { live: true });
    if (
      latest &&
      latest.business_date !== today &&
      (await stayIsInRoom(tx, fr.primaryId, fr.roomId, today))
    ) {
      latest = null;
    }
    return {
      ...(fr.roomNo ? { roomNo: fr.roomNo } : {}),
      // ARC 16.19 K11-03: the fridge this standard describes (periodId belongs to it) – sent back as `roomId`.
      roomId: fr.roomId,
      // ARC 16.16 bổ sung 2 (ab): sent back in MinibarCheckInput.periodId (null = no fill yet).
      periodId: fillId,
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

  /** 422 rules of a count against the items of the fridge's period (BR-702: 0 ≤ left ≤ mark, every item once). */
  private assertCountLines(
    input: {
      mode: 'checkout' | 'stayover';
      lines: Array<{ itemId: string; remainingQty: number }>;
    },
    items: readonly FridgeItem[],
    at: Date,
    now: Date,
  ): void {
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
    if (at.getTime() > now.getTime()) errors.push({ field: 'performedAt', code: 'DATE_INVALID' });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
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
      /** ARC 16.16 bổ sung 2 (ab): MinibarStandard.periodId the count was prepared on; absent = not compared. */
      periodId?: string | null;
    },
  ): Promise<Record<string, unknown>> {
    // DOM BE-29: a mid-stay count (US-033, R3) would charge the same missing items again at checkout – no refill
    // task, no baseline after a refill (BR-702/703). Closed until US-033.
    if (input.mode === 'stayover') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'mode', code: 'NOT_IN_LIST' }] });
    }
    // ARC 16.19 K11-03: a count sent with `periodId` (an id or null) names its fridge – `roomId` is required.
    if (input.periodId !== undefined && !input.roomId) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'REQUIRED' }] });
    }
    const { today, tz, now } = await this.businessToday(tx);
    const s = await this.stay(tx, actor.roles, reservationId, input.mode, today, input.roomId);
    if (!s.folioId || !s.roomId)
      throw problem('INVALID_TRANSITION', { extras: { currentState: s.status } });
    // Read before the locks: only for an early 422/409 – everything is read again under the locks (16.19).
    const fr = await this.fridgeOf(tx, s, input.roomId, today);
    // ARC 16.16 bổ sung 2 (ab) / 16.19 (ac): a count prepared on another period of THAT fridge (a refill done, the
    // stay went on, a first fill written since) → 409, nothing written – the client reloads and counts again.
    const assertPeriod = async () => {
      if (input.periodId === undefined) return;
      if (!(await isCurrentPeriod(tx, fr.primaryId, fr.roomId, input.periodId))) {
        throw problem('MINIBAR_PERIOD_CHANGED');
      }
    };
    await assertPeriod();
    const at = input.performedAt ?? now;
    this.assertCountLines(input, (await fridgeItems(tx, fr.primaryId, fr.roomId)).items, at, now);

    // Lock order (ARC 16.19 – the one source; K11-04, K11-07): L1 the bookings of the folio KEY SHARE → L2 the
    // fridge's room KEY SHARE → L3 the folio (lockForPosting; B18 locks it right after its rooms, before any
    // balance or blocker read – K11-01) → L4 the open refill tasks of the fridge → L5 the fridge. The booking
    // lock of lockForDeposit is not used – it applies the desk scope and HK counts minibars outside it.
    await lockStayBookings(tx, s.folioId);
    await lockFridgeParents(tx, fr.primaryId, fr.roomId);
    await this.folios.lockForPosting(tx, s.folioId);
    // K11-05: the stay, the room it is in and the fridge are read again under L3 – a B14 committed while this
    // count waited moved the stay: without `roomId` the count was meant for the room it was in → 409 (reload).
    const fresh = await this.port().stayInfo(tx, s.id);
    if (fresh?.status !== 'in_house')
      throw problem('INVALID_TRANSITION', { extras: { currentState: fresh?.status ?? s.status } });
    if (!input.roomId && fresh.roomId !== fr.roomId) throw problem('MINIBAR_PERIOD_CHANGED');
    // BUG-R2-178: the room the STAY is in (a B13 / S4-09 child included), read under L3.
    const currentRoomId = (await currentRoomOfStay(tx, fr.primaryId, today)) ?? fresh.roomId;
    const lock = await lockFridge(tx, fr.primaryId, fr.roomId, { refillTasks: true });
    await assertPeriod();
    // Every count belongs to a period (ARC R1): a fridge never filled yet gets its `check_in` fill now.
    await registerFridge(tx, {
      primaryId: fr.primaryId,
      roomId: fr.roomId,
      now,
      userId: actor.userId,
    });
    const { fill, items } = await fridgeItems(tx, fr.primaryId, fr.roomId);
    this.assertCountLines(input, items, at, now);
    const byId = new Map(items.map((i) => [i.itemId, i]));

    const id = uuidv7();
    const fillId = fill?.id ?? null;
    // R1: this count replaces the latest count of the SAME period only (live, or made stale when the stay went
    // on); counts of earlier periods – and their folio lines – stay as they are (R7, BR-703-02).
    const prev = await this.periodCount(tx, fr.primaryId, fr.roomId, fillId, { lock: true });
    // ARC 16.17 1b: the period's live task is done (processed) → the fridge was refilled after that count: no
    // re-count of a refilled period (it would count against the old mark) – 409, nothing written.
    if (prev?.refill_task_id) {
      const { rows: t } = await tx.query<{ status: string }>(
        'SELECT status FROM hk_task WHERE id = $1',
        [prev.refill_task_id],
      );
      // DOM 18/10 (16.17): the hint of the 409 – fix the folio line with a reason, never re-count a refilled period.
      if (t[0]?.status === 'done') {
        throw problem('MINIBAR_PERIOD_CHANGED', {
          detail:
            'The fridge was refilled after this count – correct the minibar line on the folio with a reason ' +
            '(BR-702, BR-008) instead of counting it again',
        });
      }
    }
    const hist = await this.history(tx, s.folioId, prev);
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
         checked_by, checked_at, replaces_check_id, total_vnd, created_at, fill_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
        fillId,
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
    // ARC 16.17 1b (BUG-R2-159): the refill tasks of the fridge follow the count – a re-count in the period moves
    // the open task to this count (need = used − done), used 0 cancels it; a new task only for the fridge of a
    // room the stay has left (R9, BR-703-01 – counted like a check-out) or when the replaced count had one.
    await reconcileRefillTasks(tx, lock, {
      // K11-05: "a room the stay has left" judged on the room read under the locks.
      create: fr.roomId !== currentRoomId || !!prev?.refill_task_id,
      now,
      today,
      events: this.events,
    });
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
