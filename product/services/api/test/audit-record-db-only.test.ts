/**
 * SEC-on-BE-A-v1.0.1 lượt 2 (deviation of card 03, Minor condition): `AuditService.record` / `recordMoney` are called
 * inside the B16 dry-run transaction (ADR-015), which always rolls back. They are accepted there only because they are
 * database-only: one `tx.query` INSERT, no logger, no events, no `db.withContext`, no other connection. These tests
 * fail if an audit writer ever gets a side effect outside the caller's transaction. No database needed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Clock } from '../src/clock';
import type { Database, TenantContext, Tx } from '../src/db/database';
import '../src/audit-entities';
import { AuditService } from '../src/modules/audit/public/audit.service';

const ORG = '00000000-0000-4000-8000-000000000001';
const PROP = '00000000-0000-4000-8000-000000000002';
const USER = '00000000-0000-4000-8000-000000000003';

/** A Database that throws on ANY use: the audit writers of a transaction must never reach it. */
function forbiddenDatabase(): Database {
  return new Proxy({} as Database, {
    get(_t, prop) {
      throw new Error(
        `AuditService touched Database.${String(prop)} (ADR-015: database-only via tx.query)`,
      );
    },
  });
}

/** A simulation Tx that records every member read; only `ctx` and `query` are allowed. */
function simulationTx() {
  const ctx = {
    organizationId: ORG,
    propertyId: PROP,
    actorType: 'user',
    userId: USER,
    simulation: true,
  } as unknown as TenantContext;
  const queries: { text: string; params: readonly unknown[] }[] = [];
  const touched: string[] = [];
  const base = {
    ctx,
    query: async (text: string, params: readonly unknown[] = []) => {
      queries.push({ text, params });
      return { rows: [], rowCount: 1 };
    },
  };
  const tx = new Proxy(base, {
    get(t, prop) {
      if (typeof prop === 'string') touched.push(prop);
      if (prop === 'ctx' || prop === 'query') return t[prop];
      if (prop === 'then') return undefined;
      throw new Error(
        `AuditService touched tx.${String(prop)} (only tx.ctx and tx.query are allowed)`,
      );
    },
  }) as unknown as Tx;
  return { tx, queries, touched };
}

const clock: Clock = { now: () => new Date('2026-10-22T03:00:00.000Z') };

describe('AuditService.record / recordMoney are database-only (ADR-015, SEC BE-A v1.0.1 card 03)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('recordMoney inside a simulation tx: exactly one tx.query INSERT INTO audit_event, nothing else', async () => {
    const log = vi.spyOn(console, 'log');
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    const info = vi.spyOn(console, 'info');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const audit = new AuditService(clock, forbiddenDatabase());
    const { tx, queries, touched } = simulationTx();

    await audit.recordMoney(tx, {
      action: 'reservation.early_departure',
      entityType: 'reservation',
      entityId: '00000000-0000-4000-8000-000000000004',
      entityCode: 'OTM-00001',
      before: { expectedRefundVnd: 0 },
      after: { expectedRefundVnd: 400000, refundablePaidVnd: 100000 },
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]!.text).toMatch(/^\s*INSERT INTO audit_event\b/);
    expect(queries[0]!.params[5]).toBe('money');
    expect(queries[0]!.params[6]).toBe('reservation.early_departure');
    expect(new Set(touched)).toEqual(new Set(['ctx', 'query']));
    for (const spy of [log, warn, error, info, fetchSpy]) expect(spy).not.toHaveBeenCalled();
  });

  it('record (any category) inside a simulation tx: only tx.query', async () => {
    const audit = new AuditService(clock, forbiddenDatabase());
    const { tx, queries, touched } = simulationTx();
    await audit.record(tx, {
      category: 'state',
      action: 'reservation.early_departure_preview',
      entityType: 'reservation',
      entityId: '00000000-0000-4000-8000-000000000004',
    });
    expect(queries).toHaveLength(1);
    expect(queries[0]!.text).toMatch(/^\s*INSERT INTO audit_event\b/);
    expect(new Set(touched)).toEqual(new Set(['ctx', 'query']));
  });

  it('source guard: record/recordMoney use tx.query only, and audit.service.ts imports nothing with side effects', () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'modules', 'audit', 'public', 'audit.service.ts'),
      'utf8',
    );
    const body = (name: string, next: string) => {
      const start = src.indexOf(`async ${name}(`);
      const end = src.indexOf(next, start + 1);
      expect(start, name).toBeGreaterThan(0);
      expect(end, `${name} → ${next}`).toBeGreaterThan(start);
      // code only: the doc comments name what is forbidden
      return src
        .slice(start, end)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
    };
    const writers = [
      body('record', 'async recordMoney('),
      body('recordMoney', 'async recordC3Access('),
    ];
    for (const b of writers) {
      expect(b).not.toMatch(
        /this\.db\b|withContext|logger|console\.|events?\.|emit\(|notify|fetch\(|setTimeout|setImmediate|process\.nextTick/,
      );
      // tx is used for ctx and query only
      for (const m of b.matchAll(/\btx\.(\w+)/g)) expect(['ctx', 'query']).toContain(m[1]);
    }
    expect(writers[0]).toMatch(/tx\.query\(\s*`INSERT INTO audit_event/);
    expect(writers[1]).toMatch(/this\.record\(tx,/);

    // A new import (logger, events, http client…) must be reviewed against ADR-015 before this list changes.
    const imports = [...src.matchAll(/^import [^;]*? from '([^']+)';/gms)].map((m) => m[1]).sort();
    expect(imports).toEqual(
      [
        '../../../clock',
        '../../../db/database',
        '../../../db/schema',
        '../../../shared/http/auth.guard',
        './audit-fields',
        './money-actions',
        '@nestjs/common',
      ].sort(),
    );
  });
});
