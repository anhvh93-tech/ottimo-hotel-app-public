/**
 * StayNightPricingPort (OpenAPI 0.3.7 D1 – `adjustFolioLine`, S4-35 part A, BE-A; ARC decision D1 #14): the ONE
 * way to change the price of a stay night from the folio. `adjustFolioLine` on a `room` / `extra_person` line of a
 * `hold` / `confirmed` / `in_house` booking (BE-B, part B) calls `setNightRate` in the SAME transaction, BEFORE it
 * locks the folio (lock order reservation → folio), then reverses the line and posts the returned amount (and
 * re-syncs the reductions of the key – BR-434, S4-23).
 *
 * - `room`: the price typed is the night's CALENDAR price (BR-429 (g) v0.3.6: "giá sửa tay là giá lịch của đêm,
 *   bậc BR-107 áp trên đó") → `stay_night.calendar_rate_vnd`; gross = round(price × (1 − the booking's BR-107 %))
 *   (direct/agent; OTA/internal: the price itself); the snapshot marks the night `manual`, so every later sync
 *   (dates kept, OTTIMO move, BR-107 re-tier, people change, extension) KEEPS it – only a guest-requested move
 *   to another room re-prices it (BR-429 (a), (g); MovePreview `MANUAL_RATE_REPRICED`). Outside the BR-105
 *   floor–ceiling of the room group → 422 RATE_OUT_OF_RANGE (below the floor = special discount with approval).
 * - `extra_person`: the night's own BR-110 fee (count kept).
 * No dependency on the folio / reservations services (no DI cycle: FolioService → this port).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { applyNightDiscount, rateBounds } from './pricing';
import { PricingService } from './pricing.service';

export interface SetNightRateInput {
  reservationId: string;
  serviceDate: LocalDate;
  category: 'room' | 'extra_person';
  /** room: calendar price of the night (before BR-107); extra_person: the fee of the night. */
  unitPriceVnd: number;
  userId: string | null;
  reason?: string;
  requestId?: string;
}

export interface SetNightRateResult {
  reservationId: string;
  reservationCode: string;
  serviceDate: LocalDate;
  /** Amount of the new folio line (room: gross after the BR-107 %; extra_person: the fee). */
  lineAmountVnd: number;
  /** room only: what `calendar_rate_vnd` now holds. */
  calendarVnd?: number;
}

@Injectable()
export class StayNightPricingPort {
  constructor(
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(PricingService) private readonly pricing: PricingService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async setNightRate(tx: Tx, input: SetNightRateInput): Promise<SetNightRateResult> {
    const price = input.unitPriceVnd;
    if (!Number.isSafeInteger(price) || price < 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'newUnitPriceVnd', code: 'AMOUNT_INVALID' }],
      });
    }
    const { rows: res } = await tx.query<{
      id: string;
      code: string;
      status: string;
      channel_group: string;
      external_contract: boolean;
      pricing_snapshot: Record<string, unknown>;
    }>(
      `SELECT r.id, r.code, r.status, c.channel_group, r.external_contract, r.pricing_snapshot
         FROM reservation r JOIN channel c ON c.id = r.channel_id WHERE r.id = $1 FOR UPDATE OF r`,
      [input.reservationId],
    );
    const row = res[0];
    if (!row) throw problem('NOT_FOUND');
    if (!['hold', 'confirmed', 'in_house'].includes(row.status)) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    }
    const { rows: nights } = await tx.query<{
      id: string;
      room_id: string | null;
      gross: number;
      discount: number;
      calendar: number | null;
      fee: number | null;
      cnt: number | null;
    }>(
      `SELECT id, room_id, room_revenue_gross_vnd AS gross, discount_vnd AS discount, calendar_rate_vnd AS calendar,
              extra_person_fee_vnd AS fee, extra_person_count AS cnt
         FROM stay_night WHERE reservation_id = $1 AND stay_date = $2 AND night_state <> 'void'`,
      [row.id, input.serviceDate],
    );
    const night = nights[0];
    if (!night) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'lineId', code: 'NOT_IN_LIST' }],
        detail: 'no live stay night on the line date',
      });
    }
    const now = (await this.property.now(tx)).now;
    const snap = row.pricing_snapshot as {
      extraCount?: number;
      losDiscountPct?: number;
      nightRateUnit?: number;
      nights?: Array<Record<string, unknown> & { date: string }>;
    };

    if (input.category === 'extra_person') {
      await tx.query(
        `UPDATE stay_night SET extra_person_fee_vnd = $2::bigint,
                extra_person_count = COALESCE(extra_person_count, $3::smallint), updated_at = $4
          WHERE id = $1`,
        [night.id, price, snap.extraCount ?? 0, now],
      );
      await this.bump(tx, row.id, now);
      await this.audit.recordMoney(tx, {
        action: 'reservation.repriced',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        before: { extraPersonFeeVnd: night.fee },
        after: { extraPersonFeeVnd: price },
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
      return {
        reservationId: row.id,
        reservationCode: row.code,
        serviceDate: input.serviceDate,
        lineAmountVnd: price,
      };
    }

    // room night: BR-105 floor–ceiling of the room group (the bounds the booking form uses – PricingService).
    const p = await this.pricing.load(tx, (await this.property.now(tx)).today);
    const tiered =
      (row.channel_group === 'direct' || row.channel_group === 'agent') && !row.external_contract;
    if (night.room_id && row.channel_group !== 'internal') {
      const { rows: rm } = await tx.query<{ code: string; nightly: number | null }>(
        `SELECT rg.code,
                (SELECT lp.nightly_list_price_vnd FROM room_list_price lp
                  WHERE lp.room_id = rm.id AND lp.effective_from <= $2
                  ORDER BY lp.effective_from DESC LIMIT 1) AS nightly
           FROM room rm JOIN room_group rg ON rg.id = rm.room_group_id WHERE rm.id = $1`,
        [night.room_id, input.serviceDate],
      );
      const groupBase = rm[0] ? p.otaBaseRates[rm[0].code] : undefined;
      const b =
        groupBase !== undefined
          ? rateBounds(groupBase, p.rateFloorPct, p.rateCeilingPct, p.otaRateUnit)
          : rm[0]?.nightly
            ? rateBounds(Number(rm[0].nightly), p.rateFloorPct, p.rateCeilingPct, p.nightRateUnit)
            : null;
      if (b && (price < b.floorVnd || price > b.ceilingVnd)) {
        throw problem('RATE_OUT_OF_RANGE', {
          errors: [{ field: 'newUnitPriceVnd', code: 'RATE_OUT_OF_RANGE' }],
          extras: { min: b.floorVnd, max: b.ceilingVnd },
        });
      }
    }
    const unit = snap.nightRateUnit ?? p.nightRateUnit;
    const gross = tiered
      ? (applyNightDiscount([price], snap.losDiscountPct ?? 0, unit)[0] as number)
      : price;
    await tx.query(
      `UPDATE stay_night SET calendar_rate_vnd = $2::bigint, room_revenue_gross_vnd = $3::bigint,
              room_revenue_vnd = $3::bigint - discount_vnd, updated_at = $4
        WHERE id = $1`,
      [night.id, tiered ? price : night.calendar, gross, now],
    );
    // The snapshot remembers the typed price: later syncs keep it (BR-429 (g)).
    const nightsSnap = (snap.nights ?? []).map((n) =>
      n.date === input.serviceDate
        ? { ...n, amountVnd: gross, source: 'manual', ...(tiered ? { calendarVnd: price } : {}) }
        : n,
    );
    if (!nightsSnap.some((n) => n.date === input.serviceDate)) {
      nightsSnap.push({
        date: input.serviceDate,
        amountVnd: gross,
        source: 'manual',
        ...(tiered ? { calendarVnd: price } : {}),
      });
    }
    await tx.query(
      `UPDATE reservation SET pricing_snapshot = pricing_snapshot || $2::jsonb,
              total_room_vnd = (SELECT COALESCE(SUM(room_revenue_gross_vnd), 0) FROM stay_night
                                 WHERE reservation_id = $1 AND night_state <> 'void')
        WHERE id = $1`,
      [row.id, JSON.stringify({ nights: nightsSnap })],
    );
    await this.bump(tx, row.id, now);
    await this.audit.recordMoney(tx, {
      action: 'reservation.repriced',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { nightlyRates: [{ date: input.serviceDate, amountVnd: night.gross }] },
      after: {
        nightlyRates: [{ date: input.serviceDate, amountVnd: gross }],
        rateSource: 'manual',
      },
      ...(input.reason ? { reason: input.reason } : {}),
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    return {
      reservationId: row.id,
      reservationCode: row.code,
      serviceDate: input.serviceDate,
      lineAmountVnd: gross,
      ...(tiered ? { calendarVnd: price } : {}),
    };
  }

  private async bump(tx: Tx, reservationId: string, now: Date): Promise<void> {
    await tx.query('UPDATE reservation SET updated_at = $2, version = version + 1 WHERE id = $1', [
      reservationId,
      now,
    ]);
  }
}
