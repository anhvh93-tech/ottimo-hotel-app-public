import type { Role } from '@ottimo/api-client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '../session/SessionProvider';
import { api } from './api';
import { onClientDataClear } from './clientData';
import { businessDayLocal } from './dates';

/**
 * BUG-R2-211 (BR-010): "today" of a form or a request is the BUSINESS day (`ctx.today` of the API), not the
 * calendar day – from 00:00 to the rollover (06:00) it is still the day before. Read from the server:
 * - booking roles: `getBookingRules().businessDate` (0.3.5 A-07 – OWN/MGR/FDL/FD/SAL/CTV);
 * - housekeeping / maintenance (no BookingRules in the contract): `getRack().today` (every role) – the same
 *   `ctx.today` (rack.service). No contract change (ORC 20/10; `businessDayRollover` is an R3 proposal).
 * Until the answer (or if it fails) the device estimate `businessDayLocal` (rollover 06:00) is used; the API
 * re-checks every date anyway. Read once per property and per estimated business day.
 */
const BOOKING_ROLES: readonly Role[] = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'sales_staff',
  'collaborator',
];

let cache: { propertyId: string; estimate: string; day: string } | null = null;

export function resetBusinessDayCache() {
  cache = null;
}
onClientDataClear(resetBusinessDayCache);

export function useBusinessDay(): string {
  const { property, roles } = useSession();
  const propertyId = property?.propertyId;
  const tz = property?.timezone;
  const estimate = businessDayLocal(tz);
  const cached =
    cache && cache.propertyId === propertyId && cache.estimate === estimate ? cache.day : null;
  const [day, setDay] = useState<string>(cached ?? estimate);
  const viaRules = roles.some((r) => BOOKING_ROLES.includes(r));
  useEffect(() => {
    if (!propertyId) return;
    if (cache && cache.propertyId === propertyId && cache.estimate === estimate) {
      setDay(cache.day);
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
        if (!stale) setDay(d);
      },
      () => {
        if (!stale) setDay(estimate);
      },
    );
    return () => {
      stale = true;
    };
  }, [propertyId, estimate, viaRules]);
  return day;
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
