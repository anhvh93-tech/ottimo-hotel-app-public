/**
 * V5-25 (BUG-R5-003; DOM rules-v1.0.5 12.3; ARC 0.3.13 bổ sung 1, 1.24) – defensive read of `min_stay` in the three
 * places that apply it: the quote (`QuotePricingService.calculate`), `createReservation` and the web estimate (both
 * through `PricingService.load`).
 *
 * The save rules make a broken value impossible through the API; a value that still got into the database another way
 * never stops sales: not a list → no rule; a broken rule → that rule is left out, the good ones apply. No default
 * number is invented (DOM 12.3). One warning per value and property (so OPS sees it), without the value itself and
 * without any guest data – only the key, the property, how many rules were left out and the first problem.
 */
import { createHash } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { minStayNightsCap, readMinStayRules } from '../../platform/public/parameter-shapes';
import type { MinStayRule } from './pricing';

const log = new Logger('ParameterRead');
/** Fingerprints already logged (bounded: a long-running process never grows it without end). */
const logged = new Set<string>();
const LOGGED_MAX = 500;

/** Test hook: forget what was logged. */
export function resetMinStayReadLog(): void {
  logged.clear();
}

export function readMinStay(
  value: unknown,
  shortStayMaxNights: unknown,
  where: { propertyId?: string | null } = {},
): MinStayRule[] {
  const read = readMinStayRules<MinStayRule>(value, minStayNightsCap(shortStayMaxNights));
  if (!read.notAList && read.dropped.length === 0) return read.rules;
  let json: string;
  try {
    json = JSON.stringify(value) ?? 'undefined';
  } catch {
    json = 'unserializable';
  }
  const fingerprint = createHash('sha256')
    .update(`${where.propertyId ?? '-'}\u0000${json}`)
    .digest('hex')
    .slice(0, 16);
  if (!logged.has(fingerprint)) {
    if (logged.size >= LOGGED_MAX) logged.clear();
    logged.add(fingerprint);
    const first = read.dropped[0];
    log.warn(
      read.notAList
        ? `parameter min_stay is not a list – read as no minimum stay (DOM 12.3) property=${where.propertyId ?? '-'} fingerprint=${fingerprint}`
        : `parameter min_stay: ${read.dropped.length} of ${read.dropped.length + read.rules.length} rules left out, first ${first?.field} ${first?.code} – the other rules apply (DOM 12.3) property=${where.propertyId ?? '-'} fingerprint=${fingerprint}`,
    );
  }
  return read.rules;
}
