import type { BookingRules, Parameter, Role } from '@ottimo/api-client';
import { useEffect, useState } from 'react';
import { api } from './api';
import { onClientDataClear } from './clientData';

/**
 * Business-rule parameters the booking screens need for hints (BR-108, BR-302, BR-311).
 * The server is the source of truth and re-checks everything; these only shape the UI before a call.
 * `listParameters` is OWN/MGR/FDL only (OpenAPI x-roles), so FD/SAL/CTV use the BR §13 defaults.
 */
export interface RuleParams {
  longStayFromNights: number;
  longStayCompareFromNights: number;
  holdHoursOptions: number[];
  holdHoursDefault: number;
  holdExtensionMaxHours: number;
  holdLatestTime: string;
  noShowMarkTime: string;
  holdWarnHours: number;
  /** BR-305 short-stay deposit % (labels next to the server amount – FB-R2-UXD-FE-S2-08). */
  depositPct: number;
  /** BR-304 quote validity in days. */
  quoteValidityDays: number;
}

export const RULE_DEFAULTS: RuleParams = {
  longStayFromNights: 28,
  longStayCompareFromNights: 15,
  holdHoursOptions: [12, 24, 48],
  holdHoursDefault: 24,
  holdExtensionMaxHours: 24,
  holdLatestTime: '12:00',
  noShowMarkTime: '23:00',
  holdWarnHours: 2,
  depositPct: 30,
  quoteValidityDays: 3,
};

const READERS: Role[] = ['owner', 'manager', 'front_desk_lead'];

export function rulesFrom(params: Parameter[]): RuleParams {
  const get = (key: string) => params.find((p) => p.key === key)?.value;
  const num = (key: string, d: number) => (typeof get(key) === 'number' ? (get(key) as number) : d);
  const str = (key: string, d: string) => (typeof get(key) === 'string' ? (get(key) as string) : d);
  const opts = get('hold_hours_options');
  return {
    longStayFromNights: num('long_stay_required_from_nights', RULE_DEFAULTS.longStayFromNights),
    longStayCompareFromNights: num(
      'long_stay_compare_from_nights',
      RULE_DEFAULTS.longStayCompareFromNights,
    ),
    holdHoursOptions:
      Array.isArray(opts) && opts.every((x) => typeof x === 'number')
        ? (opts as number[])
        : RULE_DEFAULTS.holdHoursOptions,
    holdHoursDefault: num('hold_hours_default', RULE_DEFAULTS.holdHoursDefault),
    holdExtensionMaxHours: num('hold_extension_max_hours', RULE_DEFAULTS.holdExtensionMaxHours),
    holdLatestTime: str('hold_latest_time_on_arrival', RULE_DEFAULTS.holdLatestTime),
    noShowMarkTime: str('no_show_mark_time', RULE_DEFAULTS.noShowMarkTime),
    holdWarnHours: RULE_DEFAULTS.holdWarnHours,
    depositPct: num('short_stay_deposit_pct', RULE_DEFAULTS.depositPct),
    quoteValidityDays: num('quote_validity_days', RULE_DEFAULTS.quoteValidityDays),
  };
}

/** 0.3.5 A-07 `getBookingRules` → the same shape (times as HH:mm). */
export function rulesFromBooking(b: BookingRules): RuleParams {
  const hhmm = (v: string) => v.slice(0, 5);
  return {
    longStayFromNights: b.longStayRequiredFromNights,
    longStayCompareFromNights: b.longStayCompareFromNights,
    holdHoursOptions: b.holdHoursOptions,
    holdHoursDefault: b.holdHoursDefault,
    holdExtensionMaxHours: b.holdExtensionMaxHours,
    holdLatestTime: hhmm(b.holdLatestTimeOnArrival),
    noShowMarkTime: hhmm(b.noShowMarkTime),
    holdWarnHours: RULE_DEFAULTS.holdWarnHours,
    depositPct: b.shortStayDepositPct,
    quoteValidityDays: b.quoteValidityDays,
  };
}

let cache: { propertyId: string; rules: RuleParams } | null = null;

/**
 * Reads the rules once per property: `getBookingRules` (0.3.5, every booking role); if the server does
 * not have it yet, OWN/MGR/FDL fall back to `listParameters`; everyone else keeps the BR §13 defaults.
 */
export function useRules(propertyId: string, roles: Role[]): RuleParams {
  const canReadParams = roles.some((r) => READERS.includes(r));
  const [rules, setRules] = useState<RuleParams>(
    cache?.propertyId === propertyId ? cache.rules : RULE_DEFAULTS,
  );
  useEffect(() => {
    if (cache?.propertyId === propertyId) return;
    let stale = false;
    const done = (r: RuleParams) => {
      cache = { propertyId, rules: r };
      if (!stale) setRules(r);
    };
    api.getBookingRules({ propertyId }).then(
      (r) => done(rulesFromBooking(r.data)),
      () => {
        if (!canReadParams) return;
        api.listParameters({ propertyId }, true).then(
          (p) => done(rulesFrom(p.data.data)),
          () => undefined,
        );
      },
    );
    return () => {
      stale = true;
    };
  }, [canReadParams, propertyId]);
  return rules;
}

export function resetRulesCache() {
  cache = null;
}
onClientDataClear(resetRulesCache);
