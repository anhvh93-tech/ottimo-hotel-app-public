/**
 * V5-22 (OpenAPI 0.3.13 (h), Problem "Trường mở rộng"; contract-0.3.13 1.9 and 1.24 BE 12; BUG-R4-040): a 422 that
 * reports nightly prices outside the BR-105 floor–ceiling carries `dates[]` (the nights out of range) and `min`/`max`
 * = floor and ceiling (VND) of the FIRST night in `dates[]`, so the desk says "from 530.000 to 1.900.000" instead of
 * `{min}`/`{max}`. One builder for createReservation (block for direct/agent, `_WARNING` for OTA) and the quote with
 * typed prices (V5-14) – the reservations PricingService puts the bounds on every priced night.
 */
import { type ProblemError, problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';

export interface BoundedNight {
  date: LocalDate;
  floorVnd?: number | undefined;
  ceilingVnd?: number | undefined;
}

export function rateOutOfRange(
  dates: readonly LocalDate[],
  nights: readonly BoundedNight[],
  opts: { warning?: boolean } = {},
): ProblemError {
  const first = nights.find((n) => n.date === dates[0]);
  const extras = {
    dates: [...dates],
    ...(first?.floorVnd !== undefined ? { min: first.floorVnd } : {}),
    ...(first?.ceilingVnd !== undefined ? { max: first.ceilingVnd } : {}),
  };
  return opts.warning
    ? // OTA: a warning the desk acknowledges with `rateOverrideReason` (RATE_OUT_OF_RANGE_WARNING field code).
      problem('VALIDATION_FAILED', {
        errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE_WARNING' }],
        extras,
      })
    : problem('RATE_OUT_OF_RANGE', {
        errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }],
        extras,
      });
}
