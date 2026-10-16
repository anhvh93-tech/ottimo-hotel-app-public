/**
 * US-004 – room catalogue: room groups (read), rooms (list/create/update), effective-dated list price.
 * - Nightly list price = monthly ÷ night_from_month_divisor, rounded to rounding.night_rate (BR-101,
 *   BR-005), stored rounded (erd 4.1 BE-ARC-15); an explicit nightly price may be given instead.
 * - Occupancy (BR-110 v0.3.1, ESC-014): baseOccupancy 1–10 per room (default from the group),
 *   maxOccupancy ∈ {base, base + 1} (default base + 1) → else 422 MAX_OCCUPANCY_RANGE.
 * - Lowering maxOccupancy below bookings → 409 CAPACITY_BELOW_BOOKINGS (ROOM_CAPACITY_CHECK port).
 * - Price changes never edit a past row: effectiveFrom ≥ business today (DATE_IN_PAST); a row with the same
 *   future/today date is replaced. Existing bookings keep their snapshot (BR-006).
 * - Bed setup / bed count / area (OpenAPI 0.3.4 Q6, erd 4.1 columns from 0004): visible to every role
 *   that may list rooms, edited by OWN/MGR like the other fields; `null` in a patch clears them.
 * - audit_event category config for every change (before/after allowlisted fields).
 */
import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { type Tx, pgCode } from '../../../db/database';
import { type FieldError, problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { divideRoundVnd } from '../public/money';
import { ParameterService } from '../public/parameter.service';
import { type PropertyNow, PropertyContextService } from '../public/property-context';
import { ROOM_CAPACITY_CHECK, type RoomCapacityCheck } from '../public/room-capacity';

export interface RoomGroupDto {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  baseOccupancy: number;
  maxOccupancy: number;
}

export interface RoomDto {
  id: string;
  roomNo: string;
  name?: string;
  roomGroupId: string;
  floor?: number;
  baseOccupancy: number;
  maxOccupancy: number;
  bedSetup?: string;
  bedCount?: number;
  areaM2?: number;
  isSellable: boolean;
  activeFrom: LocalDate;
  activeTo: LocalDate | null;
  currentListPrice?: {
    effectiveFrom: LocalDate;
    monthlyListPriceVnd: number;
    nightlyListPriceVnd: number;
  };
  version: number;
}

interface RoomRow {
  id: string;
  room_no: string;
  name: string | null;
  room_group_id: string;
  floor: number | null;
  base_occupancy: number;
  max_occupancy: number;
  bed_setup: string | null;
  bed_count: number | null;
  area_m2: number | null;
  is_sellable: boolean;
  active_from: string;
  active_to: string | null;
  version: number;
  price_from: string | null;
  monthly: number | null;
  nightly: number | null;
}

const ROOM_SELECT = `SELECT r.id, r.room_no, r.name, r.room_group_id, r.floor, r.base_occupancy, r.max_occupancy,
    r.bed_setup, r.bed_count, r.area_m2, r.is_sellable, r.active_from::text AS active_from, r.active_to::text AS active_to, r.version,
    lp.effective_from::text AS price_from, lp.monthly_list_price_vnd AS monthly, lp.nightly_list_price_vnd AS nightly
  FROM room r
  LEFT JOIN LATERAL (
    SELECT p.effective_from, p.monthly_list_price_vnd, p.nightly_list_price_vnd FROM room_list_price p
     WHERE p.room_id = r.id AND p.effective_from <= $1 ORDER BY p.effective_from DESC LIMIT 1
  ) lp ON true`;

export interface RoomCreateInput {
  roomNo: string;
  name?: string | undefined;
  roomGroupId: string;
  floor?: number | undefined;
  baseOccupancy?: number | undefined;
  maxOccupancy?: number | undefined;
  bedSetup?: string | undefined;
  bedCount?: number | undefined;
  areaM2?: number | undefined;
  monthlyListPriceVnd: number;
  activeFrom?: LocalDate | undefined;
}

export interface RoomPatchInput {
  name?: string | undefined;
  roomGroupId?: string | undefined;
  baseOccupancy?: number | undefined;
  maxOccupancy?: number | null | undefined;
  bedSetup?: string | null | undefined;
  bedCount?: number | null | undefined;
  areaM2?: number | null | undefined;
  isSellable?: boolean | undefined;
  activeTo?: LocalDate | null | undefined;
  listPrice?:
    | {
        effectiveFrom: LocalDate;
        monthlyListPriceVnd: number;
        nightlyListPriceVnd?: number | undefined;
        reason: string;
      }
    | undefined;
}

function toDto(r: RoomRow): RoomDto {
  return {
    id: r.id,
    roomNo: r.room_no,
    ...(r.name !== null ? { name: r.name } : {}),
    roomGroupId: r.room_group_id,
    ...(r.floor !== null ? { floor: r.floor } : {}),
    baseOccupancy: r.base_occupancy,
    maxOccupancy: r.max_occupancy,
    ...(r.bed_setup !== null ? { bedSetup: r.bed_setup } : {}),
    ...(r.bed_count !== null ? { bedCount: r.bed_count } : {}),
    ...(r.area_m2 !== null ? { areaM2: r.area_m2 } : {}),
    isSellable: r.is_sellable,
    activeFrom: r.active_from,
    activeTo: r.active_to,
    ...(r.price_from !== null && r.monthly !== null && r.nightly !== null
      ? {
          currentListPrice: {
            effectiveFrom: r.price_from,
            monthlyListPriceVnd: r.monthly,
            nightlyListPriceVnd: r.nightly,
          },
        }
      : {}),
    version: r.version,
  };
}

function constraintOf(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null && 'constraint' in err
    ? String((err as { constraint: unknown }).constraint)
    : undefined;
}

/** ESC-014: maxOccupancy must be base or base + 1. */
export function occupancyErrors(base: number, max: number): FieldError[] {
  return max === base || max === base + 1
    ? []
    : [{ field: 'maxOccupancy', code: 'MAX_OCCUPANCY_RANGE' }];
}

@Injectable()
export class RoomsService {
  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(ROOM_CAPACITY_CHECK) private readonly capacity: RoomCapacityCheck,
  ) {}

  async listGroups(tx: Tx): Promise<{ data: RoomGroupDto[] }> {
    const { rows } = await tx.query<{
      id: string;
      code: string;
      name: string;
      sort_order: number;
      base_occupancy: number;
      max_occupancy: number;
    }>(
      `SELECT id, code, name, sort_order, base_occupancy, max_occupancy FROM room_group ORDER BY sort_order, code`,
    );
    return {
      data: rows.map((g) => ({
        id: g.id,
        code: g.code,
        name: g.name,
        sortOrder: g.sort_order,
        baseOccupancy: g.base_occupancy,
        maxOccupancy: g.max_occupancy,
      })),
    };
  }

  async list(tx: Tx, includeInactive: boolean): Promise<{ data: RoomDto[] }> {
    const pc = await this.property.now(tx);
    const { rows } = await tx.query<RoomRow>(
      `${ROOM_SELECT}
       WHERE $2::boolean OR (r.active_from <= $1 AND (r.active_to IS NULL OR r.active_to >= $1))
       ORDER BY r.room_no`,
      [pc.today, includeInactive],
    );
    return { data: rows.map(toDto) };
  }

  private async loadRoom(tx: Tx, roomId: string, asOf: LocalDate, lock = false): Promise<RoomRow> {
    const { rows } = await tx.query<RoomRow>(
      `${ROOM_SELECT} WHERE r.id = $2 ${lock ? 'FOR UPDATE OF r' : ''}`,
      [asOf, roomId],
    );
    if (!rows[0]) throw problem('NOT_FOUND');
    return rows[0];
  }

  private async group(tx: Tx, groupId: string, field = 'roomGroupId') {
    const { rows } = await tx.query<{ id: string; base_occupancy: number; max_occupancy: number }>(
      'SELECT id, base_occupancy, max_occupancy FROM room_group WHERE id = $1',
      [groupId],
    );
    if (!rows[0]) throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'NOT_IN_LIST' }] });
    return rows[0];
  }

  /** BR-101: monthly ÷ divisor, rounded to rounding.night_rate (parameters at the effective date). */
  async nightlyFromMonthly(tx: Tx, monthly: number, asOf: LocalDate): Promise<number> {
    const divisor = await this.params.get<number>(tx, 'night_from_month_divisor', asOf);
    const unit = await this.params.get<number>(tx, 'rounding.night_rate', asOf);
    return divideRoundVnd(monthly, divisor, unit);
  }

  private async writePrice(
    tx: Tx,
    pc: PropertyNow,
    roomId: string,
    price: { effectiveFrom: LocalDate; monthly: number; nightly: number; reason: string | null },
    userId: string | null,
  ): Promise<void> {
    const r = await tx.query(
      `INSERT INTO room_list_price (id, organization_id, property_id, room_id, effective_from,
         monthly_list_price_vnd, nightly_list_price_vnd, changed_by, reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
       ON CONFLICT (room_id, effective_from) DO UPDATE
         SET monthly_list_price_vnd = EXCLUDED.monthly_list_price_vnd,
             nightly_list_price_vnd = EXCLUDED.nightly_list_price_vnd,
             changed_by = EXCLUDED.changed_by, reason = EXCLUDED.reason, updated_at = EXCLUDED.updated_at
       WHERE room_list_price.effective_from >= $11`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        pc.propertyId,
        roomId,
        price.effectiveFrom,
        price.monthly,
        price.nightly,
        userId,
        price.reason,
        pc.now,
        pc.today,
      ],
    );
    if ((r.rowCount ?? 0) === 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'listPrice.effectiveFrom', code: 'DATE_IN_PAST' }],
      });
    }
  }

  async create(tx: Tx, input: RoomCreateInput, requestId: string): Promise<RoomDto> {
    const pc = await this.property.now(tx);
    const g = await this.group(tx, input.roomGroupId);
    const base = input.baseOccupancy ?? g.base_occupancy;
    const max = input.maxOccupancy ?? base + 1;
    const errors = occupancyErrors(base, max);
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const activeFrom = input.activeFrom ?? pc.today;
    const nightly = await this.nightlyFromMonthly(tx, input.monthlyListPriceVnd, activeFrom);
    const id = uuidv7();
    try {
      await tx.query('SAVEPOINT create_room');
      await tx.query(
        `INSERT INTO room (id, organization_id, property_id, room_group_id, room_no, name, floor,
           base_occupancy, max_occupancy, public_slug, is_sellable, active_from, created_at, created_by, updated_at,
           bed_setup, bed_count, area_m2)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, $12, $14, $15, $16)`,
        [
          id,
          tx.ctx.organizationId,
          pc.propertyId,
          g.id,
          input.roomNo,
          input.name ?? null,
          input.floor ?? null,
          base,
          max,
          randomBytes(9).toString('base64url'),
          activeFrom,
          pc.now,
          tx.ctx.userId,
          input.bedSetup ?? null,
          input.bedCount ?? null,
          input.areaM2 ?? null,
        ],
      );
      await tx.query('RELEASE SAVEPOINT create_room');
    } catch (err) {
      // Only the room-number key is a user error; anything else (e.g. a public_slug collision) is a
      // server error, not "DUPLICATE roomNo" (FB-R2-ARC-BE-18).
      if (pgCode(err) === '23505' && constraintOf(err) === 'room_property_room_no_key') {
        await tx.query('ROLLBACK TO SAVEPOINT create_room');
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomNo', code: 'DUPLICATE' }] });
      }
      throw err;
    }
    await this.writePrice(
      tx,
      pc,
      id,
      { effectiveFrom: activeFrom, monthly: input.monthlyListPriceVnd, nightly, reason: null },
      tx.ctx.userId,
    );
    await this.audit.record(tx, {
      category: 'config',
      action: 'room.created',
      entityType: 'room',
      entityId: id,
      after: {
        roomNo: input.roomNo,
        roomGroupId: g.id,
        baseOccupancy: base,
        maxOccupancy: max,
        ...(input.bedSetup !== undefined ? { bedSetup: input.bedSetup } : {}),
        ...(input.bedCount !== undefined ? { bedCount: input.bedCount } : {}),
        ...(input.areaM2 !== undefined ? { areaM2: input.areaM2 } : {}),
        monthlyListPriceVnd: input.monthlyListPriceVnd,
        nightlyListPriceVnd: nightly,
        activeFrom,
      },
      requestId,
    });
    return toDto(await this.loadRoom(tx, id, activeFrom > pc.today ? activeFrom : pc.today));
  }

  async update(
    tx: Tx,
    roomId: string,
    expectedVersion: number,
    patch: RoomPatchInput,
    requestId: string,
  ): Promise<RoomDto> {
    const pc = await this.property.now(tx);
    const room = await this.loadRoom(tx, roomId, pc.today, true);
    if (room.version !== expectedVersion) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: room.version } });
    }
    const errors: FieldError[] = [];
    let groupId = room.room_group_id;
    if (patch.roomGroupId !== undefined && patch.roomGroupId !== groupId) {
      groupId = (await this.group(tx, patch.roomGroupId)).id;
    }
    const base = patch.baseOccupancy ?? room.base_occupancy;
    const max = patch.maxOccupancy === null ? base + 1 : (patch.maxOccupancy ?? room.max_occupancy);
    errors.push(...occupancyErrors(base, max));
    if (
      patch.activeTo !== undefined &&
      patch.activeTo !== null &&
      patch.activeTo < room.active_from
    ) {
      errors.push({ field: 'activeTo', code: 'DATE_ORDER' });
    }
    if (patch.listPrice && patch.listPrice.effectiveFrom < pc.today) {
      errors.push({ field: 'listPrice.effectiveFrom', code: 'DATE_IN_PAST' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });

    if (max < room.max_occupancy) {
      const conflicts = await this.capacity.overCapacity(tx, roomId, max, pc.today);
      if (conflicts.length) throw problem('CAPACITY_BELOW_BOOKINGS', { extras: { conflicts } });
    }

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const track = (k: string, oldV: unknown, newV: unknown) => {
      if (oldV !== newV) {
        before[k] = oldV;
        after[k] = newV;
      }
    };
    const name = patch.name !== undefined ? patch.name : room.name;
    const isSellable = patch.isSellable ?? room.is_sellable;
    const activeTo = patch.activeTo !== undefined ? patch.activeTo : room.active_to;
    track('name', room.name, name);
    track('roomGroupId', room.room_group_id, groupId);
    track('baseOccupancy', room.base_occupancy, base);
    track('maxOccupancy', room.max_occupancy, max);
    track('isSellable', room.is_sellable, isSellable);
    track('activeTo', room.active_to, activeTo);
    const bedSetup = patch.bedSetup !== undefined ? patch.bedSetup : room.bed_setup;
    const bedCount = patch.bedCount !== undefined ? patch.bedCount : room.bed_count;
    const areaM2 = patch.areaM2 !== undefined ? patch.areaM2 : room.area_m2;
    track('bedSetup', room.bed_setup, bedSetup);
    track('bedCount', room.bed_count, bedCount);
    track('areaM2', room.area_m2, areaM2);

    await tx.query(
      `UPDATE room SET name = $2, room_group_id = $3, base_occupancy = $4, max_occupancy = $5,
           is_sellable = $6, active_to = $7, updated_at = $8, version = version + 1,
           bed_setup = $9, bed_count = $10, area_m2 = $11
        WHERE id = $1`,
      [roomId, name, groupId, base, max, isSellable, activeTo, pc.now, bedSetup, bedCount, areaM2],
    );
    let reason: string | undefined;
    if (patch.listPrice) {
      const lp = patch.listPrice;
      const nightly =
        lp.nightlyListPriceVnd ??
        (await this.nightlyFromMonthly(tx, lp.monthlyListPriceVnd, lp.effectiveFrom));
      await this.writePrice(
        tx,
        pc,
        roomId,
        {
          effectiveFrom: lp.effectiveFrom,
          monthly: lp.monthlyListPriceVnd,
          nightly,
          reason: lp.reason,
        },
        tx.ctx.userId,
      );
      before.listPrice = room.price_from
        ? {
            effectiveFrom: room.price_from,
            monthlyListPriceVnd: room.monthly,
            nightlyListPriceVnd: room.nightly,
          }
        : null;
      after.listPrice = {
        effectiveFrom: lp.effectiveFrom,
        monthlyListPriceVnd: lp.monthlyListPriceVnd,
        nightlyListPriceVnd: nightly,
      };
      reason = lp.reason;
    }
    await this.audit.record(tx, {
      category: 'config',
      action: 'room.updated',
      entityType: 'room',
      entityId: roomId,
      before,
      after,
      ...(reason ? { reason } : {}),
      requestId,
    });
    return toDto(await this.loadRoom(tx, roomId, pc.today));
  }
}
