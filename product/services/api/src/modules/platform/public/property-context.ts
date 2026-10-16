/**
 * "Today" of the property in context (coding-standards 5.4): business date in property.timezone with the
 * rollover of parameter business_day_rollover (BR-010). Used by every use case that compares with today.
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { type LocalDate, businessDate, localDate, toZonedIso } from '../../../shared/time';
import { ParameterService } from './parameter.service';

export interface PropertyNow {
  propertyId: string;
  timezone: string;
  now: Date;
  /** Business date (BR-010). */
  today: LocalDate;
  /** Instant → ISO with the property offset (API format). */
  iso(instant: Date): string;
}

@Injectable()
export class PropertyContextService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
  ) {}

  async timezone(tx: Tx, propertyId: string): Promise<string> {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [propertyId],
    );
    if (!rows[0]) throw new Error('property not visible in this context');
    return rows[0].timezone;
  }

  /** Needs a transaction whose context carries the property (tx.ctx.propertyId). */
  async now(tx: Tx): Promise<PropertyNow> {
    const propertyId = tx.ctx.propertyId;
    if (!propertyId) throw new Error('PropertyContextService.now() needs a property context');
    const timezone = await this.timezone(tx, propertyId);
    const now = this.clock.now();
    const rollover = await this.params.get<string>(
      tx,
      'business_day_rollover',
      localDate(now, timezone),
    );
    return {
      propertyId,
      timezone,
      now,
      today: businessDate(now, timezone, rollover),
      iso: (instant: Date) => toZonedIso(instant, timezone),
    };
  }
}
