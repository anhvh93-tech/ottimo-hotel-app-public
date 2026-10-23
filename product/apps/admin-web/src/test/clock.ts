import { onTestFinished, vi } from 'vitest';
import { todayLocal } from '../app/dates';

/**
 * Pin `Date` (only – timers stay real) to `hhmm` of the CALENDAR day the suite runs on (Asia/Ho_Chi_Minh), and let it
 * tick from there. For cases that are NOT about the BR-010 night hours but build their dates from `todayLocal()` or
 * from the MSW seed (anchored on the calendar day): from 00:00 to the rollover (06:00) the business day the Desk uses
 * (`useBusinessDay`, BUG-R2-211) is the day before, so those cases broke when CI ran at night (CI 39996013443, 00:36
 * on 24/10). Night behaviour is tested on purpose with its own pinned clock (`s4-211-fea.test.tsx`: 02:40, 05:59,
 * 06:00). Call it first in the case, after the setup has reset the mock (the seed uses the same calendar day).
 */
export function pinDaytime(hhmm = '12:00'): void {
  const day = todayLocal();
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(`${day}T${hhmm}:00+07:00`));
  onTestFinished(() => {
    vi.useRealTimers();
  });
}
