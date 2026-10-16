// Picks the DoorLockAdapter from DOORLOCK_PROVIDER (README 1.3, 4). Owner: INT.
// Production refuses 'mock' at startup (common/safe-config.ts) – this factory does not re-check APP_ENV.
import { IntegrationError, type IsoInstant } from '../contracts/common.js';
import type { DoorLockAdapter } from '../contracts/doorlock.js';
import { ManualDoorLockAdapter, type ManualDoorLockOptions } from './manual.js';
import { MockDoorLockAdapter, type MockDoorLockOptions } from './mock.js';

export const DOORLOCK_PROVIDERS = ['off', 'manual', 'mock', 'ttlock'] as const;
export type DoorLockProvider = (typeof DOORLOCK_PROVIDERS)[number];

export interface DoorLockFactoryOptions {
  manual?: ManualDoorLockOptions;
  mock?: MockDoorLockOptions;
  now?: () => IsoInstant;
}

/** 'off' → null (no door-code step in the UI). 'ttlock' is the R3 adapter: refused with CONFIG in R2. */
export function createDoorLockAdapter(
  provider: string,
  opts: DoorLockFactoryOptions = {},
): DoorLockAdapter | null {
  switch (provider) {
    case 'off':
      return null;
    case 'manual':
      return new ManualDoorLockAdapter({ ...opts.manual, ...(opts.now ? { now: opts.now } : {}) });
    case 'mock':
      return new MockDoorLockAdapter({ ...opts.mock, ...(opts.now ? { now: opts.now } : {}) });
    case 'ttlock':
      throw new IntegrationError(
        'CONFIG',
        'DOORLOCK_PROVIDER=ttlock is not available before Round 3 – use manual',
      );
    default:
      throw new IntegrationError('CONFIG', 'DOORLOCK_PROVIDER must be off|manual|mock|ttlock');
  }
}
