/**
 * Per-request booking context: property time zone, business "today" (BR-010), Clock now, and the pricing
 * parameters in force today (read once – FB-R2-ARC-BE-06 "một lần mỗi request").
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import type { PropertyContextService } from '../../platform/public/property-context';
import type { PricingParams, PricingService } from '../public/pricing.service';
import type { Actor } from './reservation-store';

export interface BookingContext {
  propertyId: string;
  tz: string;
  now: Date;
  today: LocalDate;
  iso(instant: Date): string;
  params: PricingParams;
  actor: Actor;
  requestId?: string | undefined;
}

export async function bookingContext(
  tx: Tx,
  property: PropertyContextService,
  pricing: PricingService,
  actor: Actor,
  requestId?: string,
): Promise<BookingContext> {
  const p = await property.now(tx);
  const params = await pricing.load(tx, p.today);
  return {
    propertyId: p.propertyId,
    tz: p.timezone,
    now: p.now,
    today: p.today,
    iso: p.iso,
    params,
    actor,
    requestId,
  };
}
