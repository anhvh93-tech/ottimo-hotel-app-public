import type { Role } from '@ottimo/api-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '../session/SessionProvider';
import { api } from './api';
import { onClientDataClear } from './clientData';
import {
  businessDayLocal,
  daysBetween,
  DEFAULT_ROLLOVER,
  msUntilNextRollover,
  shiftDay,
} from './dates';

/**
 * BUG-R2-211 (BR-010): "today" of a form or a request is the BUSINESS day (`ctx.today` of the API), not the
 * calendar day – from 00:00 to the rollover (06:00) it is still the day before.
 *
 * R3-Q36 / R3-Q38 (OpenAPI 0.3.8): the source is `Me.properties[].businessDate` + `businessDayRollover`
 * (every role). The day is ANCHORED on the server's answer and moves forward by the days the device clock
 * has crossed since that answer – so a wrong device clock never changes the day, only the rollover instant
 * does. A timer fires at the next rollover (no more "D-1 until the next render"), and when the tab becomes
 * visible again Me is re-read (at most once a minute) to re-anchor.
 *
 * Fallback while the server does not fill `businessDate` yet (BE-C): the R2 reads – `getBookingRules()
 * .businessDate` for booking roles, `getRack().today` for HK/MT – then the device estimate. The API
 * re-checks every date anyway (422).
 */
const BOOKING_ROLES: readonly Role[] = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'sales_staff',
  'collaborator',
];
/** Re-read Me on tab focus at most this often. */
export const FOCUS_REFRESH_MS = 60_000;

let cache: { propertyId: string; estimate: string; day: string } | null = null;
let lastFocusRefresh = 0;

export function resetBusinessDayCache() {
  cache = null;
  lastFocusRefresh = 0;
}
onClientDataClear(resetBusinessDayCache);

export function useBusinessDay(): string {
  const { me, property, roles, refresh } = useSession();
  const propertyId = property?.propertyId;
  const tz = property?.timezone;
  const rollover = property?.businessDayRollover ?? DEFAULT_ROLLOVER;
  const serverDay = property?.businessDate;
  // Bumped at each rollover and on tab focus → the estimate below is recomputed.
  const [tick, setTick] = useState(0);
  const estimate = businessDayLocal(tz, new Date(), rollover);
  // Device estimate at the moment this Me answer arrived (Me changes identity on every getMe).
  const anchor = useMemo(
    () => (serverDay ? { serverDay, estimate: businessDayLocal(tz, new Date(), rollover) } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me, serverDay, tz, rollover],
  );

  useEffect(() => {
    if (!propertyId) return;
    const id = setTimeout(() => setTick((x) => x + 1), msUntilNextRollover(tz, rollover) + 250);
    return () => clearTimeout(id);
  }, [propertyId, tz, rollover, tick]);

  useEffect(() => {
    if (!propertyId) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      setTick((x) => x + 1);
      if (Date.now() - lastFocusRefresh < FOCUS_REFRESH_MS) return;
      lastFocusRefresh = Date.now();
      refresh().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [propertyId, refresh]);

  // ---- R2 fallback (server without R3-Q38) ----
  const cached =
    cache && cache.propertyId === propertyId && cache.estimate === estimate ? cache.day : null;
  const [fallbackDay, setFallbackDay] = useState<string>(cached ?? estimate);
  const viaRules = roles.some((r) => BOOKING_ROLES.includes(r));
  useEffect(() => {
    if (!propertyId || anchor) return;
    if (cache && cache.propertyId === propertyId && cache.estimate === estimate) {
      setFallbackDay(cache.day);
      return;
    }
    let stale = false;
    const read = viaRules
      ? api.getBookingRules({ propertyId }).then((r) => r.data.businessDate)
      : api.getRack({ propertyId }, { from: estimate, days: 1 }).then((r) => r.data.today);
    read.then(
      (d) => {
        if (!d) return;
        cache = { propertyId, estimate, day: d };
        if (!stale) setFallbackDay(d);
      },
      () => {
        if (!stale) setFallbackDay(estimate);
      },
    );
    return () => {
      stale = true;
    };
  }, [propertyId, estimate, viaRules, anchor]);

  if (anchor) {
    const crossed = daysBetween(anchor.estimate, estimate);
    return crossed > 0 ? shiftDay(anchor.serverDay, crossed) : anchor.serverDay;
  }
  return fallbackDay;
}

/**
 * Calls `onChange(prev, next)` when the business day changes after the first render (the server's answer
 * differs from the device estimate, or the rollover passed) – a form moves a default it still shows.
 */
export function useBusinessDayChange(day: string, onChange: (prev: string, next: string) => void) {
  const prev = useRef(day);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    if (prev.current === day) return;
    const was = prev.current;
    prev.current = day;
    cb.current(was, day);
  }, [day]);
}
