/**
 * PublicRatePort (ARC lp-v2-design 2.3, D2; ADR-001: another module reaches reservations only through `public`) –
 * the BR-115 / BR-116 price estimate of a PUBLIC room type for the website form (`getPublicPriceEstimate`) and the
 * server recomputation stored with a website request (SEC SR-PE-06).
 *
 * Reads, in the caller's transaction (read only on the public route): the pricing parameters ONCE as of the
 * business date (`PricingService.load` – the same engine as `calculateQuote` / `createReservation`, channel DIRECT;
 * INV 01/11 "one price for every channel" – no OTA floor, no parity mode), `web_estimate.open_until`, the sellable
 * rooms
 * of the type with their list prices, and the OOO blocks overlapping the stay. NEVER reads reservations, holds,
 * occupancy or room statuses (SEC SR-PE-04: the estimate does not depend on bookings).
 *
 * The answer is the internal `PublicRateEstimate` + `priceVersion` (first 16 hex of the SHA-256 of the canonical
 * inputs – parameters read and list prices of the rooms considered). Room ids leave only in `priceGapRoomIds`
 * (OWN warning); nothing here is ever serialised as is to the public.
 */
import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import { PricingService } from './pricing.service';
import {
  type PublicRateEstimate,
  type PublicRateParams,
  type PublicRateRequest,
  type PublicRateRoom,
  estimatePublicRate,
  stayRangeOf,
} from './public-rate';

export interface PublicRateResult {
  estimate: PublicRateEstimate;
  priceVersion: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Canonical JSON (sorted keys) – stable input of `priceVersion`. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

@Injectable()
export class PublicRatePort {
  constructor(
    @Inject(PricingService) private readonly pricing: PricingService,
    @Inject(ParameterService) private readonly params: ParameterService,
  ) {}

  private async optional<T>(tx: Tx, key: string, asOf: LocalDate, fallback: T): Promise<T> {
    try {
      return await this.params.get<T>(tx, key, asOf);
    } catch (err) {
      if (err instanceof ParameterMissingError) return fallback;
      throw err;
    }
  }

  /** Parameters of the estimate as of the business date `asOf` (read once per call). */
  async loadParams(tx: Tx, asOf: LocalDate): Promise<PublicRateParams> {
    const pricing = await this.pricing.load(tx, asOf);
    const openUntil = await this.optional<string | null>(tx, 'web_estimate.open_until', asOf, null);
    return {
      pricing,
      openUntil: typeof openUntil === 'string' && DATE.test(openUntil) ? openUntil : null,
    };
  }

  /** Sellable rooms of the public type `label` (Room.publicRoomType), active over the stay, with prices + OOO. */
  async rooms(tx: Tx, label: string, range: { from: LocalDate; to: LocalDate }) {
    const { rows } = await tx.query<{
      id: string;
      base_occupancy: number;
      max_occupancy: number;
      blocked: boolean;
    }>(
      `SELECT rm.id, rm.base_occupancy, rm.max_occupancy,
              EXISTS (SELECT 1 FROM room_block b
                       WHERE b.room_id = rm.id AND b.status IN ('planned', 'active')
                         AND daterange(b.start_date, COALESCE(b.end_date_actual, b.end_date_planned))
                             && daterange($2::date, $3::date)) AS blocked
         FROM room rm
        WHERE rm.public_room_type = $1 AND rm.is_sellable
          AND rm.active_from <= $2::date AND (rm.active_to IS NULL OR rm.active_to >= ($3::date - 1))
        ORDER BY rm.id`,
      [label, range.from, range.to],
    );
    if (rows.length === 0) return [] as PublicRateRoom[];
    const { rows: prices } = await tx.query<{
      room_id: string;
      effective_from: string;
      nightly: string | number;
    }>(
      // Nightly prices only: the web never shows a monthly price (ESC-043 câu 2).
      `SELECT room_id, effective_from::text AS effective_from, nightly_list_price_vnd AS nightly
         FROM room_list_price WHERE room_id = ANY($1::uuid[]) ORDER BY room_id, effective_from`,
      [rows.map((r) => r.id)],
    );
    return rows.map((r): PublicRateRoom => ({
      roomId: r.id,
      baseOccupancy: Number(r.base_occupancy),
      maxOccupancy: Number(r.max_occupancy),
      blocked: r.blocked,
      listPrices: prices
        .filter((x) => x.room_id === r.id)
        .map((x) => ({
          effectiveFrom: x.effective_from,
          nightlyVnd: Number(x.nightly),
        })),
    }));
  }

  /**
   * The estimate of the public type `label` for `request`, priced as of `asOf` (the property's business date).
   * Throws only on a configuration error (missing pricing parameter) – the caller answers 503.
   */
  async estimate(
    tx: Tx,
    label: string,
    request: PublicRateRequest,
    asOf: LocalDate,
  ): Promise<PublicRateResult> {
    const p = await this.loadParams(tx, asOf);
    const rooms = await this.rooms(tx, label, stayRangeOf(request));
    const estimate = estimatePublicRate(p, rooms, request);
    const priceVersion = createHash('sha256')
      .update(
        canonical({
          pricing: p.pricing,
          openUntil: p.openUntil,
          rooms: rooms.map((r) => ({
            b: r.baseOccupancy,
            m: r.maxOccupancy,
            x: r.blocked,
            l: r.listPrices,
          })),
        }),
      )
      .digest('hex')
      .slice(0, 16);
    return { estimate, priceVersion };
  }
}
