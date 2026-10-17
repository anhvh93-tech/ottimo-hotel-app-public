/**
 * BR-012 (5) – room names on the folio (OpenAPI 0.3.7 D1, S4-52 folio side – BE-A, ORC 17/10 decision 3).
 * Guests see the ROOM NAME (The Pine…), never the number; the folio lines keep room numbers and the name is read
 * when shown – except a SETTLED folio (the bill handed over), which keeps the names it had when it was settled:
 * `folio.settled_room_names` {roomNo: name} is written in the settlement transaction (never an UPDATE of
 * `folio_line` – the lines stay append-only, ARC D1 #9). A room without a name shows its number.
 */
import type { Tx } from '../../../db/database';

/** Freeze the names of every room the stay used (primary + children of the folio) – called right after settle. */
export async function snapshotSettledRoomNames(tx: Tx, folioId: string): Promise<void> {
  await tx.query(
    `UPDATE folio f
        SET settled_room_names = COALESCE(
              (SELECT jsonb_object_agg(x.room_no, x.name)
                 FROM (SELECT DISTINCT rm.room_no, COALESCE(rm.name, rm.room_no) AS name
                         FROM reservation r
                         JOIN reservation_segment s ON s.reservation_id = r.id
                         JOIN room rm ON rm.id = s.room_id
                        WHERE r.folio_id = f.id) x),
              '{}'::jsonb)
      WHERE f.id = $1 AND f.status <> 'open'`,
    [folioId],
  );
}

/** Name of a room number for this folio: frozen names once settled, else the current room table. */
export async function roomNamesOf(
  tx: Tx,
  folioId: string,
): Promise<(roomNo: string) => string | null> {
  const { rows: f } = await tx.query<{ status: string; names: Record<string, string> | null }>(
    'SELECT status, settled_room_names AS names FROM folio WHERE id = $1',
    [folioId],
  );
  const frozen = f[0] && f[0].status !== 'open' ? f[0].names : null;
  const { rows } = await tx.query<{ room_no: string; name: string | null }>(
    'SELECT room_no, name FROM room WHERE property_id = $1',
    [tx.ctx.propertyId],
  );
  const current = new Map(rows.map((r) => [r.room_no, r.name]));
  return (roomNo) => frozen?.[roomNo] ?? current.get(roomNo) ?? null;
}
