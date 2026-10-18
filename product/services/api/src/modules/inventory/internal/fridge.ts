/**
 * Mô hình minibar M-1 (ARC `openapi-0.3.7.md` mục 16; erd 4.6/4.10; BR-702-02, BR-703-01) – the FRIDGE of a stay:
 * - a fridge = (stay, room): the stay is the folio of the primary booking (children B9a/B13 share it), the room is
 *   every room the stay has been in (B14 mid-stay → two fridges) – R1;
 * - its FILL (`minibar_fill`) = the items, their mark (qty) and their sale price put in it; the latest fill wins.
 *   A fridge without a fill still holds what the catalogue holds now: the catalogue has not changed since the
 *   guest moved in (R2 – copy-on-write: every catalogue change first writes a `check_in` fill for those fridges).
 * Plain SQL helpers in the caller's transaction (RLS by property). The stay's rooms are read from
 * `reservation_segment` (reservations, read only – BE-A review).
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import type { FridgeLock } from './refill-tasks';

export interface FridgeItem {
  itemId: string;
  code: string;
  name: string;
  /** Mark of the item in the fridge (BR-702-02): qty of the latest fill / catalogue standard now. */
  mark: number;
  /** Sale price of the fill – null = complimentary (BR-701, R5). */
  priceVnd: number | null;
  costVnd: number | null;
}

export interface FridgeFill {
  id: string;
  source: 'check_in' | 'refill' | 'backfill' | 'carry';
  filledAt: Date;
}

/**
 * L5 of the lock order (ARC 16.19 – the one source): ONE lock per fridge (stay × room), a transaction-level
 * advisory lock. Every path that changes a fridge takes it, then reads the latest fill and the latest count.
 * Before it, by path: record() – L1 bookings KEY SHARE, L2 room KEY SHARE (lockFridgeParents), L3 folio, L4 the
 * open refill tasks of the fridge (`refillTasks` – here); B13/B14/B18 (onStayContinued/onCheckedOut) – L1, L2
 * FOR UPDATE, L3 already held, tasks written afterwards with NOWAIT only (E1); onRefillDone – the HK task (L4) held
 * by setTaskStatus, then L1/L2 KEY SHARE, then here (E2). Re-entrant in the same transaction.
 */
export async function lockFridge(
  tx: Tx,
  primaryId: string,
  roomId: string,
  opts: { refillTasks?: boolean } = {},
): Promise<FridgeLock> {
  if (opts.refillTasks) {
    await tx.query(
      `SELECT id FROM hk_task
        WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill'
          AND status IN ('open', 'in_progress')
        ORDER BY id FOR UPDATE`,
      [primaryId, roomId],
    );
  }
  await tx.query(
    `SELECT pg_advisory_xact_lock(hashtextextended('minibar:' || $1 || ':' || $2, 0))`,
    [primaryId, roomId],
  );
  // ARC 16.17 1b: the proof the lock is held – reconcileRefillTasks only takes this.
  return { primaryId, roomId } as FridgeLock;
}

/**
 * L1/L2 (ARC 16.19) for the paths that are not a booking change: the primary booking and the fridge's room
 * `FOR KEY SHARE` – the FK parents of the fridge's writes. record() takes them BEFORE the folio (K11-04: B13/B14/
 * B18 hold the room `FOR UPDATE` and then wait for the folio – a count holding the folio and asking for the room
 * afterwards was a 40P01); onRefillDone after its task (E2). No wait when the caller holds them.
 */
export async function lockFridgeParents(tx: Tx, primaryId: string, roomId: string): Promise<void> {
  await tx.query('SELECT id FROM reservation WHERE id = $1 FOR KEY SHARE', [primaryId]);
  await tx.query('SELECT id FROM room WHERE id = $1 FOR KEY SHARE', [roomId]);
}

/**
 * L1 of a count (ARC 16.19 – "giữ đơn đứng yên"): the bookings of the folio `FOR KEY SHARE` in id order, before the
 * room and the folio. Booking changes take them `FOR NO KEY UPDATE` (compatible): a count is serialised with
 * B13/B14/B18 at L2 (their room `FOR UPDATE` against the count's room `KEY SHARE`).
 */
export async function lockStayBookings(tx: Tx, folioId: string): Promise<void> {
  await tx.query('SELECT id FROM reservation WHERE folio_id = $1 ORDER BY id FOR KEY SHARE', [
    folioId,
  ]);
}

/**
 * The folio of the stay `FOR UPDATE` (the lock FolioService.lock takes) – taken by the desk paths of the port before
 * the fridge lock (folio → fridge) when the caller posts to the folio only after the port (B13 resyncs the stay
 * after onStayContinued). Already held by the caller → no wait.
 */
export async function lockStayFolio(tx: Tx, primaryId: string): Promise<void> {
  await tx.query(
    `SELECT f.id FROM reservation r JOIN folio f ON f.id = r.folio_id WHERE r.id = $1 FOR UPDATE OF f`,
    [primaryId],
  );
}

/** The primary booking of the stay a booking belongs to (its folio). Null when not visible / no folio. */
export async function primaryOf(tx: Tx, reservationId: string): Promise<string | null> {
  const { rows } = await tx.query<{ primary_reservation_id: string }>(
    `SELECT f.primary_reservation_id FROM reservation r JOIN folio f ON f.id = r.folio_id WHERE r.id = $1`,
    [reservationId],
  );
  return rows[0]?.primary_reservation_id ?? null;
}

/**
 * Rooms the stay of `primaryId` has been in up to `today`: the rooms of its segments (every booking of its
 * folio) and every fridge it already has (a fill or a count – a B14 on the first night rewrites the segment in
 * place, the fridge of the old room stays known through registerFridge). Oldest first.
 */
export async function stayRooms(
  tx: Tx,
  primaryId: string,
  today: LocalDate,
): Promise<Array<{ roomId: string; roomNo: string }>> {
  const { rows } = await tx.query<{ room_id: string; room_no: string; first: Date }>(
    `SELECT x.room_id, rm.room_no, min(x.first) AS first
       FROM (
         SELECT s.room_id, (s.from_date::timestamp AT TIME ZONE 'UTC') AS first
           FROM reservation r
           JOIN folio f ON f.id = r.folio_id
           JOIN reservation_segment s ON s.reservation_id = r.id AND s.active AND s.room_id IS NOT NULL
          WHERE f.primary_reservation_id = $1 AND s.from_date <= $2
         UNION ALL
         SELECT room_id, filled_at FROM minibar_fill WHERE reservation_id = $1
         UNION ALL
         SELECT room_id, created_at FROM minibar_check WHERE reservation_id = $1
       ) x JOIN room rm ON rm.id = x.room_id
      GROUP BY x.room_id, rm.room_no
      ORDER BY first, rm.room_no`,
    [primaryId, today],
  );
  return rows.map((r) => ({ roomId: r.room_id, roomNo: r.room_no }));
}

/**
 * R1/R9: the fridge of a room the stay leaves (B14) or ends in (B18) is registered – a fridge without a fill
 * gets the catalogue as its `check_in` fill (its level since moving in: the catalogue did not change since,
 * else the copy-on-write would have written one). Lets a B14 on the first night keep the old room's fridge.
 */
export async function registerFridge(
  tx: Tx,
  input: { primaryId: string; roomId: string; now: Date; userId: string | null },
): Promise<void> {
  if (await latestFill(tx, input.primaryId, input.roomId)) return;
  const catalogue = await catalogueFridge(tx);
  if (catalogue.length === 0) return;
  const { rows } = await tx.query<{ first: Date | null }>(
    `SELECT min(created_at) AS first FROM minibar_check WHERE reservation_id = $1 AND room_id = $2`,
    [input.primaryId, input.roomId],
  );
  const first = rows[0]?.first ?? null;
  await writeFill(tx, {
    primaryId: input.primaryId,
    roomId: input.roomId,
    at: first && first.getTime() <= input.now.getTime() ? new Date(first.getTime() - 1) : input.now,
    now: input.now,
    userId: input.userId,
    items: catalogue,
  });
}

export async function writeFill(
  tx: Tx,
  f: {
    primaryId: string;
    roomId: string;
    at: Date;
    now: Date;
    userId: string | null;
    items: readonly FridgeItem[];
    /** check_in (R2), refill (period opened by a done refill – R9), carry (period without refill – R1 (3)). */
    source?: 'check_in' | 'refill' | 'carry';
  },
): Promise<string> {
  const id = uuidv7();
  // K11-02 (0069 `minibar_fill_check_in_key`, ARC 16.19): ONE `check_in` fill per fridge. The copy-on-write of a
  // catalogue change does not take the fridge lock – two writers of the first fill (a first count ‖ OWN's item
  // change) meet on the unique index: the second waits for the first, writes nothing and reads the winner back.
  const { rows: inserted } = await tx.query<{ id: string }>(
    `INSERT INTO minibar_fill (id, organization_id, property_id, reservation_id, room_id, source, filled_at,
       created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (reservation_id, room_id) WHERE source = 'check_in' DO NOTHING
     RETURNING id`,
    [
      id,
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      f.primaryId,
      f.roomId,
      f.source ?? 'check_in',
      f.at,
      f.userId,
      f.now,
    ],
  );
  if (!inserted[0]) {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM minibar_fill WHERE reservation_id = $1 AND room_id = $2 AND source = 'check_in'`,
      [f.primaryId, f.roomId],
    );
    if (!rows[0]) throw new Error('minibar_fill check_in conflict without a visible row');
    return rows[0].id;
  }
  for (const it of f.items) {
    await tx.query(
      `INSERT INTO minibar_fill_line (id, organization_id, property_id, fill_id, item_id, qty,
         unit_price_vnd_snapshot, unit_cost_vnd_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        id,
        it.itemId,
        it.mark,
        it.priceVnd,
        it.costVnd,
      ],
    );
  }
  return id;
}

export async function latestFill(
  tx: Tx,
  primaryId: string,
  roomId: string,
): Promise<FridgeFill | null> {
  // ARC 16.16: the periods follow the order they were WRITTEN (created_at = when processed); `filled_at` is when
  // the fridge was filled (a refill done offline, R9 (s)) and may be earlier than the fill before it.
  const { rows } = await tx.query<{ id: string; source: FridgeFill['source']; filled_at: Date }>(
    `SELECT id, source, filled_at FROM minibar_fill WHERE reservation_id = $1 AND room_id = $2
      ORDER BY created_at DESC, id DESC LIMIT 1`,
    [primaryId, roomId],
  );
  const r = rows[0];
  return r ? { id: r.id, source: r.source, filledAt: r.filled_at } : null;
}

/**
 * BR-703-02 note 2 (ARC 16.16): the stay of `primaryId` is in house (its primary booking `in_house`) and is in
 * `roomId` now – the room of the latest active segment up to `today` of one of its bookings in house.
 */
export async function stayIsInRoom(
  tx: Tx,
  primaryId: string,
  roomId: string,
  today: LocalDate,
): Promise<boolean> {
  const { rows } = await tx.query<{ found: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM reservation p
         JOIN folio f ON f.primary_reservation_id = p.id
         JOIN reservation r ON r.folio_id = f.id AND r.status = 'in_house'
         CROSS JOIN LATERAL (
           SELECT s.room_id FROM reservation_segment s
            WHERE s.reservation_id = r.id AND s.active AND s.room_id IS NOT NULL AND s.from_date <= $3
            ORDER BY s.from_date DESC LIMIT 1) cur
        WHERE p.id = $1 AND p.status = 'in_house' AND cur.room_id = $2) AS found`,
    [primaryId, roomId, today],
  );
  return !!rows[0]?.found;
}

/**
 * ARC 16.16 bổ sung 2 (ab), 16.19 K11-03 ((ac) rewritten) – optimistic check of a count on the fridge
 * (stay, `roomId`): is `periodId` (MinibarStandard.periodId the client prepared it on) the period of THAT fridge
 * now? `null` = that fridge had no fill when the count was prepared: true only while it still has none (any fill
 * since – the first count of another device, the copy-on-write of a catalogue change, a `carry`/`refill` – → false,
 * 409). Never "the period of the room the stay is in now" (K11-03 (a)).
 */
export async function isCurrentPeriod(
  tx: Tx,
  primaryId: string,
  roomId: string,
  periodId: string | null,
): Promise<boolean> {
  const fill = await latestFill(tx, primaryId, roomId);
  return periodId === null ? !fill : fill?.id === periodId;
}

/**
 * The items of a `refill` fill opening a new period (DOM BR-703-02 note 2, ARC 16.17 mục 2): mark per item = what
 * the system knows is left – the lines of `baseCountId` (an item without a line → the period's own mark), or the
 * period's mark when null – + `refill`; items at 0 dropped; price/cost = the catalogue now, an item off the
 * catalogue keeps the period's, an item of `refill` in neither takes its goods row as it is now (16.16 (z)).
 */
export async function refillFillItems(
  tx: Tx,
  fillId: string | null,
  baseCountId: string | null,
  refill: ReadonlyMap<string, number>,
): Promise<FridgeItem[]> {
  const num = (v: string | number | null) => (v === null ? null : Number(v));
  // The period's own lines (a `carry` keeps its zeros) – the mark when nothing was counted in it.
  const { rows: period } = fillId
    ? await tx.query<{
        item_id: string;
        code: string;
        name: string;
        qty: number;
        unit_price_vnd_snapshot: string | number | null;
        unit_cost_vnd_snapshot: string | number | null;
      }>(
        `SELECT l.item_id, i.code, i.name, l.qty, l.unit_price_vnd_snapshot, l.unit_cost_vnd_snapshot
           FROM minibar_fill_line l JOIN item i ON i.id = l.item_id
          WHERE l.fill_id = $1`,
        [fillId],
      )
    : { rows: [] };
  const left = new Map<string, number>();
  if (baseCountId) {
    const { rows } = await tx.query<{ item_id: string; remaining_qty: number }>(
      'SELECT item_id, remaining_qty FROM minibar_check_line WHERE check_id = $1',
      [baseCountId],
    );
    for (const r of rows) left.set(r.item_id, Number(r.remaining_qty));
  }
  const catalogue = new Map((await catalogueFridge(tx)).map((i) => [i.itemId, i]));
  const kept = new Map<string, FridgeItem>(
    period.map((r) => [
      r.item_id,
      {
        itemId: r.item_id,
        code: r.code,
        name: r.name,
        mark: Number(r.qty),
        priceVnd: (num(r.unit_price_vnd_snapshot) ?? 0) > 0 ? num(r.unit_price_vnd_snapshot) : null,
        costVnd: num(r.unit_cost_vnd_snapshot),
      },
    ]),
  );
  const missing = [...refill.keys()].filter((id) => !kept.has(id) && !catalogue.has(id));
  if (missing.length > 0) {
    const { rows } = await tx.query<{
      id: string;
      code: string;
      name: string;
      sale_price_vnd: string | number | null;
      cost_price_vnd: string | number | null;
    }>(
      `SELECT id, code, name, sale_price_vnd, cost_price_vnd FROM item WHERE id = ANY($1::uuid[])`,
      [missing],
    );
    for (const r of rows) {
      kept.set(r.id, {
        itemId: r.id,
        code: r.code,
        name: r.name,
        mark: 0,
        priceVnd: (num(r.sale_price_vnd) ?? 0) > 0 ? num(r.sale_price_vnd) : null,
        costVnd: num(r.cost_price_vnd),
      });
    }
  }
  const items: FridgeItem[] = [];
  for (const id of new Set([...kept.keys(), ...refill.keys()])) {
    const base = kept.get(id) ?? catalogue.get(id);
    if (!base) continue;
    const before = baseCountId
      ? (left.get(id) ?? kept.get(id)?.mark ?? 0)
      : (kept.get(id)?.mark ?? 0);
    const mark = before + (refill.get(id) ?? 0);
    if (mark <= 0) continue;
    const cat = catalogue.get(id);
    items.push({
      ...base,
      mark,
      priceVnd: cat ? cat.priceVnd : base.priceVnd,
      costVnd: cat ? cat.costVnd : base.costVnd,
    });
  }
  return items.sort((a, b) => a.code.localeCompare(b.code));
}

/** The catalogue's standard fridge now (active minibar items with a standard quantity). */
export async function catalogueFridge(tx: Tx): Promise<FridgeItem[]> {
  const { rows } = await tx.query<{
    id: string;
    code: string;
    name: string;
    minibar_standard_qty: number;
    sale_price_vnd: string | number | null;
    cost_price_vnd: string | number | null;
  }>(
    `SELECT id, code, name, minibar_standard_qty, sale_price_vnd, cost_price_vnd FROM item
      WHERE kind = 'minibar' AND is_active AND minibar_standard_qty > 0
      ORDER BY code`,
  );
  return rows.map((r) => ({
    itemId: r.id,
    code: r.code,
    name: r.name,
    mark: r.minibar_standard_qty,
    priceVnd:
      r.sale_price_vnd !== null && Number(r.sale_price_vnd) > 0 ? Number(r.sale_price_vnd) : null,
    costVnd: r.cost_price_vnd === null ? null : Number(r.cost_price_vnd),
  }));
}

/** R3: the items of a fridge = its latest fill (qty > 0), else the catalogue now. */
export async function fridgeItems(
  tx: Tx,
  primaryId: string,
  roomId: string,
): Promise<{ fill: FridgeFill | null; items: FridgeItem[] }> {
  const fill = await latestFill(tx, primaryId, roomId);
  if (!fill) return { fill, items: await catalogueFridge(tx) };
  const { rows } = await tx.query<{
    item_id: string;
    code: string;
    name: string;
    qty: number;
    unit_price_vnd_snapshot: string | number | null;
    unit_cost_vnd_snapshot: string | number | null;
  }>(
    `SELECT l.item_id, i.code, i.name, l.qty, l.unit_price_vnd_snapshot, l.unit_cost_vnd_snapshot
       FROM minibar_fill_line l JOIN item i ON i.id = l.item_id
      WHERE l.fill_id = $1 AND l.qty > 0
      ORDER BY i.code`,
    [fill.id],
  );
  return {
    fill,
    items: rows.map((r) => ({
      itemId: r.item_id,
      code: r.code,
      name: r.name,
      mark: r.qty,
      priceVnd:
        r.unit_price_vnd_snapshot !== null && Number(r.unit_price_vnd_snapshot) > 0
          ? Number(r.unit_price_vnd_snapshot)
          : null,
      costVnd: r.unit_cost_vnd_snapshot === null ? null : Number(r.unit_cost_vnd_snapshot),
    })),
  };
}

/**
 * R2 / ARC D1 – copy-on-write: BEFORE a catalogue change of minibar goods, every fridge of a stay in house that
 * has no fill yet gets a `check_in` fill = the catalogue as it is now (= its level since the guest moved in). Its
 * date is the move-in level: never after the first count of the fridge (a re-count of the same level stays a
 * re-count, R6). Returns the number of fills written.
 */
export async function snapshotFridgesBeforeCatalogueChange(
  tx: Tx,
  input: { today: LocalDate; now: Date; userId: string | null },
): Promise<number> {
  const { rows: fridges } = await tx.query<{
    reservation_id: string;
    room_id: string;
    first_count: Date | null;
  }>(
    `SELECT DISTINCT f.primary_reservation_id AS reservation_id, s.room_id,
            (SELECT min(k.created_at) FROM minibar_check k
              WHERE k.reservation_id = f.primary_reservation_id AND k.room_id = s.room_id) AS first_count
       FROM reservation r
       JOIN folio f ON f.id = r.folio_id
       JOIN reservation_segment s ON s.reservation_id = r.id AND s.active AND s.room_id IS NOT NULL
      WHERE r.status = 'in_house' AND s.from_date <= $1
        AND NOT EXISTS (SELECT 1 FROM minibar_fill m
                         WHERE m.reservation_id = f.primary_reservation_id AND m.room_id = s.room_id)`,
    [input.today],
  );
  if (fridges.length === 0) return 0;
  const catalogue = await catalogueFridge(tx);
  // [GIẢ ĐỊNH BE-B – ARC] No minibar goods in the catalogue yet (setting up while guests are in house): nothing is
  // kept – the fridges follow the catalogue until it holds something (no empty fridge for the rest of the stay).
  if (catalogue.length === 0) return 0;
  for (const fr of fridges) {
    await writeFill(tx, {
      primaryId: fr.reservation_id,
      roomId: fr.room_id,
      at:
        fr.first_count && fr.first_count.getTime() <= input.now.getTime()
          ? new Date(fr.first_count.getTime() - 1)
          : input.now,
      now: input.now,
      userId: input.userId,
      items: catalogue,
    });
  }
  return fridges.length;
}
