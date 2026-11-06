/**
 * Bulk import of the room catalogue (room groups + rooms + first list price) inside the caller's transaction
 * – used by the DS-E/DS-0 seed loader (QA TC-NT-040e) and the first-property setup. Same rules as the API:
 * maxOccupancy ∈ {base, base + 1} (ESC-014); list price (OpenAPI 0.3.13 V5-1A, BR-101 (1), (5)) = BOTH prices as
 * given – the tool never derives the nightly price from the monthly one (`night_from_month_divisor` is no longer
 * read):
 * - both prices → the first `room_list_price` row; a nightly price outside [monthly ÷ 30, monthly ÷ 5] is kept and
 *   reported in `nightlyPriceUnusual` (BR-101 (4) – warns, never blocks);
 * - neither → the room is created NOT for sale and without a row (contract 0.3.13 addendum 1: OWN enters the
 *   prices on Desk, then puts it on sale; ops-check `pricegap` counts sellable rooms without a price);
 * - only one of the two, a price that is not a positive safe integer, `isSellable: true` without prices, or the
 *   retired `expectedNightlyListPriceVnd` key → RoomCatalogImportError (the caller's transaction keeps nothing).
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import { nightlyPriceUnusual } from './list-price-check';

export interface RoomGroupImport {
  code: string;
  name: string;
  sortOrder: number;
  baseOccupancy: number;
  maxOccupancy: number;
  /** BR-204 fixed monthly service fee of the group (DS-E roomGroups.serviceFeeMonthlyVnd). */
  serviceFeeMonthlyVnd?: number;
}

export interface RoomImport {
  roomNo: string;
  name?: string;
  group: string;
  floor?: number;
  /** Both or neither (V5-1A): a room with neither is created not for sale. */
  monthlyListPriceVnd?: number;
  nightlyListPriceVnd?: number;
  baseOccupancy?: number;
  maxOccupancy?: number;
  isSellable?: boolean;
}

export class RoomCatalogImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomCatalogImportError';
  }
}

export interface RoomCatalogImportResult {
  groups: number;
  rooms: number;
  /** Room numbers created without a list price, hence not for sale. */
  unpriced: string[];
  /** Room numbers whose nightly price is outside [monthly ÷ 30, monthly ÷ 5] (BR-101 (4)) – saved anyway. */
  nightlyPriceUnusual: string[];
}

const isPrice = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0;

export async function importRoomCatalog(
  tx: Tx,
  input: {
    groups: RoomGroupImport[];
    rooms: RoomImport[];
    activeFrom: LocalDate;
    now: Date;
  },
): Promise<RoomCatalogImportResult> {
  const { organizationId, propertyId } = tx.ctx;
  if (!organizationId || !propertyId) throw new Error('importRoomCatalog needs a property context');
  const groupIds = new Map<string, { id: string; base: number }>();
  for (const g of input.groups) {
    const id = uuidv7();
    await tx.query(
      `INSERT INTO room_group (id, organization_id, property_id, code, name, sort_order, base_occupancy,
         max_occupancy, service_fee_monthly_vnd, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $10, $9, $9)`,
      [
        id,
        organizationId,
        propertyId,
        g.code,
        g.name,
        g.sortOrder,
        g.baseOccupancy,
        g.maxOccupancy,
        input.now,
        g.serviceFeeMonthlyVnd ?? null,
      ],
    );
    groupIds.set(g.code, { id, base: g.baseOccupancy });
  }
  const unpriced: string[] = [];
  const unusual: string[] = [];
  for (const r of input.rooms) {
    const g = groupIds.get(r.group);
    if (!g) throw new RoomCatalogImportError(`room ${r.roomNo}: unknown group ${r.group}`);
    const base = r.baseOccupancy ?? g.base;
    const max = r.maxOccupancy ?? base + 1;
    if (max !== base && max !== base + 1) {
      throw new RoomCatalogImportError(
        `room ${r.roomNo}: maxOccupancy ${max} ∉ {${base}, ${base + 1}}`,
      );
    }
    // The input usually comes from a JSON file cast to RoomImport: an old file keeps the retired key, which would
    // otherwise be ignored silently and the room created without its nightly price.
    if ('expectedNightlyListPriceVnd' in r) {
      throw new RoomCatalogImportError(
        `room ${r.roomNo}: expectedNightlyListPriceVnd is retired – give nightlyListPriceVnd (V5-1A, BR-101 (5))`,
      );
    }
    const { monthlyListPriceVnd: monthly, nightlyListPriceVnd: nightly } = r;
    const priced = monthly !== undefined || nightly !== undefined;
    if (priced && (!isPrice(monthly) || !isPrice(nightly))) {
      throw new RoomCatalogImportError(
        `room ${r.roomNo}: monthly and nightly list price are both required, positive integers (V5-1A, BR-101 (5))`,
      );
    }
    if (!priced && r.isSellable === true) {
      throw new RoomCatalogImportError(
        `room ${r.roomNo}: a room without a list price cannot be for sale (V5-1A)`,
      );
    }
    const id = uuidv7();
    await tx.query(
      `INSERT INTO room (id, organization_id, property_id, room_group_id, room_no, name, floor, base_occupancy,
         max_occupancy, public_slug, is_sellable, active_from, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)`,
      [
        id,
        organizationId,
        propertyId,
        g.id,
        r.roomNo,
        r.name ?? null,
        r.floor ?? (/^\d{3}$/.test(r.roomNo) ? Number(r.roomNo.slice(0, 1)) : null),
        base,
        max,
        randomBytes(9).toString('base64url'),
        priced ? (r.isSellable ?? true) : false,
        input.activeFrom,
        input.now,
      ],
    );
    if (!isPrice(monthly) || !isPrice(nightly)) {
      unpriced.push(r.roomNo);
      continue;
    }
    if (nightlyPriceUnusual(nightly, monthly)) unusual.push(r.roomNo);
    await tx.query(
      `INSERT INTO room_list_price (id, organization_id, property_id, room_id, effective_from,
         monthly_list_price_vnd, nightly_list_price_vnd, reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'seed', $8, $8)`,
      [
        uuidv7(),
        organizationId,
        propertyId,
        id,
        input.activeFrom,
        monthly,
        nightly,
        input.now,
      ],
    );
  }
  return {
    groups: input.groups.length,
    rooms: input.rooms.length,
    unpriced,
    nightlyPriceUnusual: unusual,
  };
}
