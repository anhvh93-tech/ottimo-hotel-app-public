/**
 * Money allocation columns of `stay_night` (erd 8, DATA FB-01/02, Q-12) – the ONE writer of those columns
 * for the folio module (FB-R2-ARC-BE-S2-07: folio no longer writes the reservations table directly).
 * `stay_night` rows (state, dates, room, revenue) stay owned by the reservations module; this service only
 * sets the allocations the money side computes:
 *   agent/staff commission (BR-903), channel fee (BR-901), approved discount (BR-434 → discount_vnd,
 *   room_revenue_vnd = gross − discount, 100 % → is_complimentary).
 * Written by BE-B (Sprint 2 fix) in reservations/public; provided globally by FolioModule until BE-A moves the
 * registration into ReservationsModule (no behaviour change).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';

export interface NightCommission {
  stayNightId: string;
  agentVnd: number;
  staffVnd: number;
}

@Injectable()
export class StayNightAllocationService {
  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  /** Commission split of the nights (one row per night; other nights untouched). */
  async setCommissions(tx: Tx, parts: readonly NightCommission[]): Promise<void> {
    const now = this.clock.now();
    for (const p of parts) {
      await tx.query(
        `UPDATE stay_night SET agent_commission_vnd = $2, staff_commission_vnd = $3, updated_at = $4
          WHERE id = $1`,
        [p.stayNightId, p.agentVnd, p.staffVnd, now],
      );
    }
  }

  /** Channel fee split of the nights (Σ = the booking's fee, remainder on the last night). */
  async setChannelFees(
    tx: Tx,
    parts: ReadonlyArray<{ stayNightId: string; amountVnd: number }>,
    isEstimate: boolean,
  ): Promise<void> {
    const now = this.clock.now();
    for (const p of parts) {
      await tx.query(
        `UPDATE stay_night SET channel_fee_vnd = $2, channel_fee_is_estimate = $3, updated_at = $4
          WHERE id = $1`,
        [p.stayNightId, p.amountVnd, isEstimate, now],
      );
    }
  }

  /**
   * S4-02/S4-03 (BE-B): gross price and net revenue of nights – the folio posts the room line at the GROSS
   * (reductions are lines of their own, BR-434) and allocates commission / channel fee on the NET read after the
   * FOC key sync. Missing ids are absent from the map.
   */
  async revenueOf(
    tx: Tx,
    stayNightIds: readonly string[],
  ): Promise<Map<string, { grossVnd: number; netVnd: number }>> {
    if (stayNightIds.length === 0) return new Map();
    const { rows } = await tx.query<{ id: string; gross: string | number; net: string | number }>(
      `SELECT id, room_revenue_gross_vnd AS gross, room_revenue_vnd AS net
         FROM stay_night WHERE id = ANY($1::uuid[])`,
      [[...stayNightIds]],
    );
    return new Map(rows.map((r) => [r.id, { grossVnd: Number(r.gross), netVnd: Number(r.net) }]));
  }

  /**
   * S4-02 (BE-B): the discount of a night = what the FOC / special discounts apply on its room line NOW (the
   * folio's FOC key sync is the source – BR-434 v0.3.5/v0.3.6). Clamped to [0, gross]; 100 % → complimentary.
   */
  async setDiscount(tx: Tx, stayNightId: string, discountVnd: number): Promise<void> {
    await tx.query(
      `UPDATE stay_night
          SET discount_vnd = GREATEST(0, LEAST(room_revenue_gross_vnd, $2::bigint)),
              room_revenue_vnd = room_revenue_gross_vnd - GREATEST(0, LEAST(room_revenue_gross_vnd, $2::bigint)),
              is_complimentary = CASE WHEN room_revenue_gross_vnd = 0 THEN is_complimentary
                ELSE GREATEST(0, LEAST(room_revenue_gross_vnd, $2::bigint)) >= room_revenue_gross_vnd END,
              updated_at = $3
        WHERE id = $1
          AND (discount_vnd <> GREATEST(0, LEAST(room_revenue_gross_vnd, $2::bigint))
               OR room_revenue_vnd <> room_revenue_gross_vnd - GREATEST(0, LEAST(room_revenue_gross_vnd, $2::bigint)))`,
      [stayNightId, discountVnd, this.clock.now()],
    );
  }

  /**
   * Approved discount / FOC on a night (`deltaVnd` > 0), or its reversal (`deltaVnd` < 0). Clamped to
   * [0, gross]; 100 % discount → complimentary night (DATA Q-05).
   */
  async addDiscount(tx: Tx, stayNightId: string, deltaVnd: number): Promise<void> {
    await tx.query(
      `UPDATE stay_night
          SET discount_vnd = GREATEST(0, LEAST(room_revenue_gross_vnd, discount_vnd + $2)),
              room_revenue_vnd = room_revenue_gross_vnd
                                 - GREATEST(0, LEAST(room_revenue_gross_vnd, discount_vnd + $2)),
              is_complimentary = CASE WHEN room_revenue_gross_vnd = 0 THEN is_complimentary
                ELSE GREATEST(0, LEAST(room_revenue_gross_vnd, discount_vnd + $2)) >= room_revenue_gross_vnd END,
              updated_at = $3
        WHERE id = $1`,
      [stayNightId, deltaVnd, this.clock.now()],
    );
  }
}
