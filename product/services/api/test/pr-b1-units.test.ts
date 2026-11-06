/**
 * PR-B1 (Round 5, v1.0.5, BE-B) – units of contract 0.3.13 V5-44 (a), V5-13, V5-18 + bổ sung 1 (BE C0313-11, 13, 14):
 * - V5-44 architecture: no `problem('FOLIO_LOCKED'…)` under src/modules outside `folio/public/folio-locked.ts`, so every
 *   409 FOLIO_LOCKED carries `lockReason`; the reasons are exactly the OpenAPI `Problem.lockReason` enum;
 * - T13-4 / T18-3: the role serializer removes `Folio.totals.openRefunds` and `Reservation.depositUnverifiedVnd` for
 *   SAL/CTV (x-visible-to FD+); `CheckoutSummary` (its `openRefunds` too) is an FD+ operation;
 * - BE 14: creditVnd − unhandledCreditVnd = min(creditVnd, Σ openVnd); T18-4 (BE 13): the min cap.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import {
  FOLIO_LOCK_REASONS,
  folioLocked,
  lockReasonOfStatus,
} from '../src/modules/folio/public/folio-locked';
import { computeTotals, sumOpenRefunds } from '../src/modules/folio/public/folio.service';
import { depositUnverifiedVnd } from '../src/modules/payments/public/deposit-unverified';
import { serializeSchema } from '../src/shared/serialization/serializer';

const MODULES = join(__dirname, '..', 'src', 'modules');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });

describe('V5-44 (a) – one way to answer FOLIO_LOCKED', () => {
  it('no problem(FOLIO_LOCKED) outside folio-locked.ts', () => {
    const bad = files(MODULES)
      .filter((f) => !f.endsWith(`${sep}folio${sep}public${sep}folio-locked.ts`))
      .filter((f) => /problem\(\s*['"`]FOLIO_LOCKED['"`]/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(MODULES, f));
    expect(bad).toEqual([]);
  });

  it('the reasons are the OpenAPI Problem.lockReason enum', () => {
    const spec = parse(
      readFileSync(join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.yaml'), 'utf8'),
    );
    expect([...FOLIO_LOCK_REASONS]).toEqual(
      spec.components.schemas.Problem.properties.lockReason.enum,
    );
  });

  it('folioLocked: 409 FOLIO_LOCKED with lockReason, detail only when given', () => {
    const e = folioLocked('closed');
    expect(e.code).toBe('FOLIO_LOCKED');
    expect(e.status).toBe(409);
    expect(e.options).toEqual({ extras: { lockReason: 'closed' } });
    const d = folioLocked('post_checkout_window_over', 'post-checkout window over (BR-427 d)');
    expect(d.options).toEqual({
      detail: 'post-checkout window over (BR-427 d)',
      extras: { lockReason: 'post_checkout_window_over' },
    });
    expect(lockReasonOfStatus('closed')).toBe('closed');
    expect(lockReasonOfStatus('settled')).toBe('settled');
  });
});

describe('T13-4 / T18-3 – SAL and CTV never get the fields (x-visible-to FD+)', () => {
  const open = [{ reasonCode: 'early_departure', openVnd: 300_000 }];
  for (const role of ['sales_staff', 'collaborator']) {
    it(`${role}: no openRefunds, no depositUnverifiedVnd`, () => {
      const folio = serializeSchema(
        'Folio',
        { totals: { roomVnd: 1, openRefunds: open } },
        { roles: [role] },
      ) as { totals?: Record<string, unknown> };
      expect(folio.totals ?? {}).not.toHaveProperty('openRefunds');
      const res = serializeSchema(
        'Reservation',
        { depositPaidVnd: 500_000, depositUnverifiedVnd: 200_000 },
        { roles: [role] },
      ) as Record<string, unknown>;
      expect(res).not.toHaveProperty('depositUnverifiedVnd');
    });
  }
  it('CheckoutSummary.openRefunds: the operation itself is FD+ (getCheckoutSummary x-roles)', () => {
    const spec = parse(
      readFileSync(join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.yaml'), 'utf8'),
    );
    const op = Object.values(spec.paths as Record<string, Record<string, any>>)
      .flatMap((p) => Object.values(p))
      .find((o) => o?.operationId === 'getCheckoutSummary');
    expect(op['x-roles']).toEqual(['owner', 'manager', 'front_desk_lead', 'front_desk']);
  });
  for (const role of ['front_desk', 'front_desk_lead', 'manager', 'owner']) {
    it(`${role}: both fields kept`, () => {
      const folio = serializeSchema(
        'Folio',
        { totals: { roomVnd: 1, openRefunds: open } },
        { roles: [role] },
      ) as { totals: Record<string, unknown> };
      expect(folio.totals.openRefunds).toEqual(open);
      const res = serializeSchema(
        'Reservation',
        { depositPaidVnd: 500_000, depositUnverifiedVnd: 200_000 },
        { roles: [role] },
      ) as Record<string, unknown>;
      expect(res.depositUnverifiedVnd).toBe(200_000);
    });
  }
});

describe('BE 14 – openRefunds and unhandledCreditVnd from the same list', () => {
  const pay = (amount_vnd: number) => ({
    type: 'charge',
    method: 'cash',
    status: 'succeeded',
    amount_vnd,
    reversal_of_id: null,
  });
  it('credit 500.000, open 300.000 + 400.000 → unhandled 0, credit − unhandled = min(credit, Σ open)', () => {
    const open = [
      { reasonCode: 'early_departure', openVnd: 300_000 },
      { reasonCode: 'overpayment', openVnd: 400_000 },
    ];
    const t = computeTotals([], [pay(500_000) as never], open);
    expect(t.openRefunds).toEqual(open);
    expect(t.creditVnd).toBe(500_000);
    expect(t.unhandledCreditVnd).toBe(0);
    expect(t.creditVnd - t.unhandledCreditVnd).toBe(Math.min(t.creditVnd, sumOpenRefunds(open)));
  });
  it('nothing open → [] (present), unhandled = credit', () => {
    const t = computeTotals([], [pay(200_000) as never]);
    expect(t.openRefunds).toEqual([]);
    expect(t.unhandledCreditVnd).toBe(200_000);
  });
});

describe('T18-4 (BE 13) – depositUnverifiedVnd = min(depositPaidVnd, Σ pending deposits)', () => {
  const tx = (v: string | number | undefined) =>
    ({ query: async () => ({ rows: v === undefined ? [] : [{ v }] }) }) as never;
  it('capped by the deposit still held, never below 0', async () => {
    expect(await depositUnverifiedVnd(tx('500000'), 'f', 300_000)).toBe(300_000);
    expect(await depositUnverifiedVnd(tx(200_000), 'f', 300_000)).toBe(200_000);
    expect(await depositUnverifiedVnd(tx(0), 'f', 300_000)).toBe(0);
    expect(await depositUnverifiedVnd(tx(undefined), 'f', 300_000)).toBe(0);
    expect(await depositUnverifiedVnd(tx(100_000), 'f', 0)).toBe(0);
  });
});
