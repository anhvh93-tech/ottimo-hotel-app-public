/** BE-A Sprint 4 units (no database): `UnitOfWork.completedReplay` (BUG-R2-150 step 0) never reads for a dry run. */
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/database';
import type { AuthGuard, GuardedRequest } from '../src/shared/http/auth.guard';
import { UnitOfWork } from '../src/shared/http/unit-of-work';

function request(body: unknown, dryRunOperation: boolean): GuardedRequest {
  return {
    method: 'POST',
    url: '/v1/properties/p/reservations/r/actions/check-out',
    headers: { 'idempotency-key': 'k-1' },
    body,
    ottimoAuth: {
      principal: { userId: 'u', organizationId: 'o', propertyId: 'p', roles: ['front_desk'] },
      operation: { idempotencyKey: true, dryRun: dryRunOperation },
    },
  } as unknown as GuardedRequest;
}

describe('UnitOfWork.completedReplay (BUG-R2-150, ARC review)', () => {
  const touched: string[] = [];
  const db = {
    withContext: async () => {
      touched.push('db');
      return undefined;
    },
  } as unknown as Database;
  const uow = new UnitOfWork(db, {} as AuthGuard);

  it('a dry run answers null without reading the key store (same rule as runInner)', async () => {
    touched.length = 0;
    expect(await uow.completedReplay(request({ dryRun: true }, true))).toBeNull();
    expect(touched).toEqual([]);
  });

  it('a real request reads the key store (no row → null)', async () => {
    touched.length = 0;
    expect(await uow.completedReplay(request({ dryRun: false }, true))).toBeNull();
    expect(touched).toEqual(['db']);
  });
});
