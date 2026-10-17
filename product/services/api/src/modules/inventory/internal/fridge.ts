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
  await tx.query(
    `INSERT INTO minibar_fill (id, organization_id, property_id, reservation_id, room_id, source, filled_at,
       created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
