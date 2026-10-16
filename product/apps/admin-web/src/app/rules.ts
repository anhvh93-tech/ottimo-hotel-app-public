import type { Parameter, Role } from '@ottimo/api-client';
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
  };
}

let cache: { propertyId: string; rules: RuleParams } | null = null;

/** Reads the parameters once per property for roles allowed to; others get the defaults (no 403 noise). */
export function useRules(propertyId: string, roles: Role[]): RuleParams {
  const allowed = roles.some((r) => READERS.includes(r));
  const [rules, setRules] = useState<RuleParams>(
    cache?.propertyId === propertyId ? cache.rules : RULE_DEFAULTS,
  );
  useEffect(() => {
    if (!allowed || cache?.propertyId === propertyId) return;
    let stale = false;
    api.listParameters({ propertyId }, true).then(
      (r) => {
        cache = { propertyId, rules: rulesFrom(r.data.data) };
        if (!stale) setRules(cache.rules);
      },
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [allowed, propertyId]);
  return rules;
}

export function resetRulesCache() {
  cache = null;
}
onClientDataClear(resetRulesCache);
