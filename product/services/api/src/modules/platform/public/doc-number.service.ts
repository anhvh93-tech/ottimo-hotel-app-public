/**
 * Server-issued document numbers (BR-007, erd 10, architecture 9a, US-023).
 * One statement in the SAME transaction as the record that gets the number:
 *   INSERT … VALUES (…, next_value = 2) ON CONFLICT (scope, doc_type, period) DO UPDATE next_value + 1
 *   RETURNING next_value - 1
 * The row lock serialises concurrent allocations; a rollback rolls the counter back too → no gaps from
 * failures, no duplicates, no time or randomness in the number. Never a PostgreSQL SEQUENCE.
 * Format (prefix, padding, yearly reset, property/organisation scope) comes from the parameter
 * doc_code_format.<docType> (catalogue default = BR-007). Numbers wider than the padding just grow.
 * Allocate as late as possible in the transaction (after availability/permission checks).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { localDate } from '../../../shared/time';
import { ParameterService } from './parameter.service';

export const DOC_TYPES = [
  'reservation',
  'quote',
  'work_order',
  'lease_contract',
  'bill',
  'reservation_group',
  'payment',
  'guest',
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export interface DocCodeFormat {
  prefix: string;
  padWidth: number;
  period: 'none' | 'year';
  scope: 'property' | 'organization';
}

export function formatDocCode(prefix: string, padWidth: number, n: number): string {
  return `${prefix}${String(n).padStart(padWidth, '0')}`;
}

/** Prefix and period key for a format at a local date (bill: F{yy}- → F26-, period '26'). */
export function resolvePeriod(
  format: DocCodeFormat,
  date: string,
): { prefix: string; periodKey: string } {
  if (format.period === 'year') {
    const yy = date.slice(2, 4);
    return { prefix: format.prefix.replace('{yy}', yy), periodKey: yy };
  }
  return { prefix: format.prefix, periodKey: '-' };
}

@Injectable()
export class DocNumberService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly parameters: ParameterService,
  ) {}

  async allocate(tx: Tx, docType: DocType): Promise<string> {
    const { ctx } = tx;
    if (!ctx.organizationId) throw new Error('allocate() needs an organization context');
    const tz = await this.timezone(tx);
    // Calendar date in the property zone: the bill year resets on 1 January VN time (BR-007),
    // not at the 06:00 business-day rollover.
    const today = localDate(this.clock.now(), tz);
    const format = await this.parameters.get<DocCodeFormat>(
      tx,
      `doc_code_format.${docType}`,
      today,
    );
    const { prefix, periodKey } = resolvePeriod(format, today);

    let sql: string;
    let params: unknown[];
    if (format.scope === 'organization') {
      sql = `INSERT INTO doc_sequence (id, organization_id, property_id, doc_type, period_key, prefix, pad_width, next_value)
             VALUES ($1, $2, NULL, $3, $4, $5, $6, 2)
             ON CONFLICT (organization_id, doc_type, period_key) WHERE property_id IS NULL
             DO UPDATE SET next_value = doc_sequence.next_value + 1
             RETURNING next_value - 1 AS allocated, prefix, pad_width`;
      params = [uuidv7(), ctx.organizationId, docType, periodKey, prefix, format.padWidth];
    } else {
      if (!ctx.propertyId) throw new Error(`allocate(${docType}) needs a property context`);
      sql = `INSERT INTO doc_sequence (id, organization_id, property_id, doc_type, period_key, prefix, pad_width, next_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 2)
             ON CONFLICT (property_id, doc_type, period_key) WHERE property_id IS NOT NULL
             DO UPDATE SET next_value = doc_sequence.next_value + 1
             RETURNING next_value - 1 AS allocated, prefix, pad_width`;
      params = [
        uuidv7(),
        ctx.organizationId,
        ctx.propertyId,
        docType,
        periodKey,
        prefix,
        format.padWidth,
      ];
    }
    const { rows } = await tx.query<{ allocated: number; prefix: string; pad_width: number }>(
      sql,
      params,
    );
    const row = rows[0];
    if (!row) throw new Error('doc_sequence allocation returned no row');
    // The stored prefix/padding of an existing counter win: a later format change starts a new period
    // only when the period key changes (no silent renumbering inside a period).
    return formatDocCode(row.prefix, row.pad_width, row.allocated);
  }

  private async timezone(tx: Tx): Promise<string> {
    const { ctx } = tx;
    if (ctx.propertyId) {
      const { rows } = await tx.query<{ timezone: string }>(
        'SELECT timezone FROM property WHERE id = $1',
        [ctx.propertyId],
      );
      if (rows[0]) return rows[0].timezone;
    }
    return this.parameters.get<string>(tx, 'timezone', localDate(this.clock.now(), 'UTC'));
  }
}
