/**
 * CallerPasswordMatch (rule `CALLER_PASSWORD_COMPARE_RULE`, SEC `SEC-responses.md` 3.1): the order of the steps with
 * a fake database – the count is COMMITTED before the argon2 comparison, the match audit is committed in its own
 * transaction after it, an attempt over the limit never compares, and the skipped audit is written once (count =
 * limit + 1). The real PostgreSQL path: test/integration/v5-58-property-wifi.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FixedClock } from '../src/clock';
import type { Database, TenantContext, Tx } from '../src/db/database';
import type { AuditService } from '../src/modules/audit/public/audit.service';

import {
  CALLER_PASSWORD_COMPARE_LIMIT,
  CALLER_PASSWORD_COMPARE_RULE,
  CallerPasswordMatch,
} from '../src/modules/identity/public/caller-password-match';

const state = vi.hoisted(() => ({ events: [] as string[], verifyAnswer: false }));
const events = state.events;

vi.mock('../src/modules/identity/public/passwords', () => ({
  verifyPassword: vi.fn(async () => {
    state.events.push('verify');
    return state.verifyAnswer;
  }),
}));

const CTX: TenantContext = {
  organizationId: '0190a7e2-0000-7000-8000-00000000000a',
  propertyId: '0190a7e2-0000-7000-8000-00000000000b',
  userId: '0190a7e2-0000-7000-8000-00000000000c',
  actorType: 'user',
};
const OPTS = {
  bucket: 'wifi_pw_cmp',
  entityType: 'property',
  entityId: CTX.propertyId as string,
  matchAction: 'property.wifi_password_matches_login',
  skippedAction: 'property.wifi_password_check_skipped',
};

function setup(count: number) {
  let tx = 0;
  const audited: Array<{ action: string; after: unknown }> = [];
  const db = {
    async withContext<T>(_ctx: TenantContext, fn: (t: Tx) => Promise<T>): Promise<T> {
      const n = ++tx;
      events.push(`begin${n}`);
      const fake = {
        ctx: CTX,
        async query(sql: string, params: unknown[]) {
          if (sql.includes('INSERT INTO rate_limit_counter')) {
            events.push(`count${n}`);
            expect(params[0]).toBe(`wifi_pw_cmp:${CTX.userId}`);
            return { rows: [{ count }] };
          }
          if (sql.includes('SELECT password_hash')) {
            events.push(`hash${n}`);
            return { rows: [{ password_hash: '$argon2id$fake' }] };
          }
          throw new Error(`unexpected SQL ${sql}`);
        },
      } as unknown as Tx;
      const out = await fn(fake);
      events.push(`commit${n}`);
      return out;
    },
  } as unknown as Database;
  const audit = {
    async record(_tx: Tx, e: { action: string; after: unknown }) {
      events.push(`audit:${e.action}`);
      audited.push({ action: e.action, after: e.after });
    },
  } as unknown as AuditService;
  return {
    svc: new CallerPasswordMatch(db, new FixedClock(new Date('2026-10-15T02:00:00Z')), audit),
    audited,
  };
}

describe(`CallerPasswordMatch – ${CALLER_PASSWORD_COMPARE_RULE} step order`, () => {
  beforeEach(() => {
    events.length = 0;
    state.verifyAnswer = false;
  });

  it('match: count committed BEFORE the comparison, the audit in its own committed transaction after it', async () => {
    state.verifyAnswer = true;
    const { svc, audited } = setup(1);
    expect(await svc.check(CTX, '<candidate>', OPTS)).toBe('match');
    expect(events).toEqual([
      'begin1',
      'count1',
      'hash1',
      'commit1',
      'verify',
      'begin2',
      'audit:property.wifi_password_matches_login',
      'commit2',
    ]);
    expect(audited).toEqual([
      { action: 'property.wifi_password_matches_login', after: { rule: 'SR-RL-15' } },
    ]);
  });

  it('no match: counted and committed, compared once, no audit', async () => {
    const { svc, audited } = setup(CALLER_PASSWORD_COMPARE_LIMIT);
    expect(await svc.check(CTX, '<candidate>', OPTS)).toBe('no_match');
    expect(events).toEqual(['begin1', 'count1', 'hash1', 'commit1', 'verify']);
    expect(audited).toEqual([]);
  });

  it('first attempt over the limit: skipped audit in the counting transaction, never compared', async () => {
    const { svc, audited } = setup(CALLER_PASSWORD_COMPARE_LIMIT + 1);
    expect(await svc.check(CTX, '<candidate>', OPTS)).toBe('skipped');
    expect(events).toEqual([
      'begin1',
      'count1',
      'audit:property.wifi_password_check_skipped',
      'commit1',
    ]);
    expect(audited).toEqual([
      { action: 'property.wifi_password_check_skipped', after: { rule: 'SR-RL-15' } },
    ]);
  });

  it('later attempts in the window: skipped, no second audit, never compared', async () => {
    const { svc, audited } = setup(CALLER_PASSWORD_COMPARE_LIMIT + 2);
    expect(await svc.check(CTX, '<candidate>', OPTS)).toBe('skipped');
    expect(events).toEqual(['begin1', 'count1', 'commit1']);
    expect(audited).toEqual([]);
  });
});
