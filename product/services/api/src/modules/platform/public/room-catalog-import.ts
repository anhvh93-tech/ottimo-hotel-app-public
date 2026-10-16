/**
 * Bulk import of the room catalogue (room groups + rooms + first list price) inside the caller's transaction
 * – used by the DS-E/DS-0 seed loader (QA TC-NT-040e) and the first-property setup. Same rules as the API:
 * maxOccupancy ∈ {base, base + 1} (ESC-014), nightly list price = monthly ÷ night_from_month_divisor rounded
 * to rounding.night_rate (BR-101/BR-005) computed by the server; an `expectedNightlyListPriceVnd` in the
 * input is checked against it (mismatch → error, nothing kept).
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import { divideRoundVnd } from './money';
import type { ParameterService } from './parameter.service';

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
  monthlyListPriceVnd: number;
  expectedNightlyListPriceVnd?: number;
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

export async function importRoomCatalog(
  tx: Tx,
  params: ParameterService,
  input: {
    groups: RoomGroupImport[];
    rooms: RoomImport[];
    activeFrom: LocalDate;
    now: Date;
  },
): Promise<{ groups: number; rooms: number }> {
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
  const divisor = await params.get<number>(tx, 'night_from_month_divisor', input.activeFrom);
  const unit = await params.get<number>(tx, 'rounding.night_rate', input.activeFrom);
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
    const nightly = divideRoundVnd(r.monthlyListPriceVnd, divisor, unit);
    if (r.expectedNightlyListPriceVnd !== undefined && r.expectedNightlyListPriceVnd !== nightly) {
      throw new RoomCatalogImportError(
        `room ${r.roomNo}: nightly list price ${nightly} ≠ expected ${r.expectedNightlyListPriceVnd} (BR-101)`,
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
        r.isSellable ?? true,
        input.activeFrom,
        input.now,
      ],
    );
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
        r.monthlyListPriceVnd,
        nightly,
        input.now,
      ],
    );
  }
  return { groups: input.groups.length, rooms: input.rooms.length };
}
