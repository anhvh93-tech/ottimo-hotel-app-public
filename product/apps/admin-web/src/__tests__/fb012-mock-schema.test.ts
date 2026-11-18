// FB-INV-012 (ARC-FE-189-03): the MSW mock of monthly statements answers in the shapes of the OpenAPI schemas, so FE
// tests cannot go green on shapes the server never sends. Reads `docs/api/openapi.yaml` (or `FB012_OPENAPI`, e.g. the
// spec of the BE branch before #190 merges). Undeclared fields fail, except those ARC asked BE to add (BE-190-02/04)
// while they are not in the spec yet. Skips while the spec has no billing schemas (main before #190).
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';

const repo = join(__dirname, '..', '..', '..', '..');
const specPath = process.env.FB012_OPENAPI ?? join(repo, 'docs', 'api', 'openapi.yaml');
// `yaml` is a dependency of the API package; the Desk does not need its own copy for one test.
const { parse } = createRequire(join(repo, 'services', 'api', 'package.json'))('yaml') as {
  parse: (s: string) => Spec;
};

type Schema = Record<string, unknown>;
interface Spec {
  components: { schemas: Record<string, Schema> };
}
const spec: Spec | null = existsSync(specPath) ? parse(readFileSync(specPath, 'utf8')) : null;
const schemas = spec?.components.schemas ?? {};
const ready = !!schemas.BillingPeriod && !!schemas.MeterReading;

/** Fields ARC asked BE to ADD (review §1) – accepted while the spec does not list them yet. */
const PENDING: Record<string, string[]> = {
  BillingPeriod: ['excludedLines', 'replacesCode'],
  MeterReading: ['readByInitials', 'onIssuedStatement'],
  candidate: ['rooms'],
  rooms: ['openingKind', 'arrivalDate'],
};

function resolve(s: Schema): Schema {
  let cur = s;
  while (typeof cur.$ref === 'string') cur = schemas[cur.$ref.split('/').pop()!]!;
  return cur;
}

/** Errors of `v` against `s` (a subset of JSON Schema: type, enum, required, properties, items, allOf/oneOf/anyOf). */
function check(v: unknown, s0: Schema, at: string, ctx: string): string[] {
  const s = resolve(s0);
  const name = typeof s0.$ref === 'string' ? s0.$ref.split('/').pop()! : ctx;
  if (Array.isArray(s.allOf)) {
    const merged: Schema = { type: 'object', properties: {}, required: [] };
    for (const part of s.allOf as Schema[]) {
      const r = resolve(part);
      Object.assign(merged.properties as Schema, r.properties ?? {});
      (merged.required as string[]).push(...((r.required as string[]) ?? []));
    }
    return check(v, merged, at, name);
  }
  for (const k of ['oneOf', 'anyOf'] as const)
    if (Array.isArray(s[k])) {
      const all = (s[k] as Schema[]).map((x) => check(v, x, at, name));
      return all.some((e) => !e.length) ? [] : (all.sort((a, b) => a.length - b.length)[0] ?? []);
    }
  const types = s.type === undefined ? [] : Array.isArray(s.type) ? s.type : [s.type];
  const typeOf = (x: unknown) =>
    x === null
      ? 'null'
      : Array.isArray(x)
        ? 'array'
        : typeof x === 'number'
          ? Number.isInteger(x)
            ? 'integer'
            : 'number'
          : typeof x;
  const t = typeOf(v);
  if (types.length && !types.includes(t) && !(t === 'integer' && types.includes('number')))
    return [`${at}: ${t} is not ${types.join('|')}`];
  if (Array.isArray(s.enum) && !s.enum.includes(v)) return [`${at}: ${String(v)} not in enum`];
  const errs: string[] = [];
  if (t === 'array' && s.items)
    (v as unknown[]).forEach((x, i) =>
      errs.push(...check(x, s.items as Schema, `${at}[${i}]`, name)),
    );
  if (t === 'object' && (s.properties || s.required)) {
    const o = v as Record<string, unknown>;
    const props = (s.properties ?? {}) as Record<string, Schema>;
    for (const r of (s.required as string[]) ?? [])
      if (!(r in o)) errs.push(`${at}.${r}: required`);
    for (const [k, x] of Object.entries(o)) {
      if (props[k]) errs.push(...check(x, props[k]!, `${at}.${k}`, k));
      else if (s.additionalProperties !== true && !(PENDING[name] ?? []).includes(k))
        errs.push(`${at}.${k}: not in ${name}`);
    }
  }
  return errs;
}

const P = '0192a1b0-0000-7000-8000-0000000000a1';
const api = (path: string, init?: RequestInit) =>
  fetch(`http://localhost/v1/properties/${P}${path}`, init).then(async (r) => ({
    status: r.status,
    body: (await r.json()) as Record<string, unknown>,
  }));

describe.skipIf(!ready)('FB-INV-012 mock answers match the OpenAPI schemas (ARC-FE-189-03)', () => {
  it('the checker itself flags a missing field, a wrong type and an undeclared field', () => {
    const errs = check(
      { status: 'draft', kind: 7, bogus: true },
      { $ref: '#/components/schemas/BillingPeriodSummary' },
      's',
      'BillingPeriodSummary',
    );
    expect(errs).toEqual(
      expect.arrayContaining([
        's.id: required',
        's.kind: integer is not string',
        's.bogus: not in BillingPeriodSummary',
      ]),
    );
  });

  it('readings, candidates, statement, list, print, void and payment results', async () => {
    const { renderApp } = await import('../test/render');
    renderApp('/long-stay/statements', 'qa.fdl');
    const st = mockControl.statements;
    const stay = st.stays[1]!;
    const errs: string[] = [];
    const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });
    // Signed in once the page has rendered (the mock session is then active).
    await screen.findByRole('heading', { level: 1 });

    const readings = await api(`/reservations/${stay.reservationId}/meter-readings`);
    expect(readings.status).toBe(200);
    for (const [i, x] of (readings.body.items as unknown[]).entries())
      errs.push(...check(x, ref('MeterReading'), `readings[${i}]`, 'MeterReading'));

    const cands = await api(`/billing-periods/candidates?month=${st.M}`);
    const item = resolve(schemas.BillingCandidateList!).properties as Record<string, Schema>;
    for (const [i, x] of (cands.body.items as unknown[]).entries())
      errs.push(
        ...check(x, (item.items as Schema).items as Schema, `candidates[${i}]`, 'candidate'),
      );

    const list = await api('/billing-periods');
    for (const [i, x] of (list.body.items as unknown[]).entries())
      errs.push(...check(x, ref('BillingPeriodSummary'), `list[${i}]`, 'BillingPeriodSummary'));

    const issued = st.periods.find((p) => p.status === 'issued')!;
    const one = await api(`/billing-periods/${issued.id}`);
    errs.push(...check(one.body, ref('BillingPeriod'), 'statement', 'BillingPeriod'));
    const print = await api(`/billing-periods/${issued.id}/print`);
    errs.push(...check(print.body, ref('BillingPeriodPrint'), 'print', 'BillingPeriod'));

    const pay = await api(`/billing-periods/${issued.id}/payments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': mockControl.db.csrf,
        'idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify({ method: 'cash', amountVnd: 1000 }),
    });
    expect(pay.status).toBe(201);
    errs.push(...check(pay.body, ref('BillingPeriodPaymentResult'), 'payment', 'BillingPeriod'));

    const draft = await api(`/reservations/${st.stays[0]!.reservationId}/billing-periods`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': mockControl.db.csrf,
        'idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify({ month: st.M, kind: 'regular' }),
    });
    expect(draft.status).toBe(201);
    errs.push(...check(draft.body, ref('BillingPeriod'), 'draft', 'BillingPeriod'));
    const voided = await api(`/billing-periods/${draft.body.id as string}/void`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': mockControl.db.csrf },
      body: JSON.stringify({ reason: 'Schema check' }),
    });
    expect(voided.status).toBe(200);
    errs.push(...check(voided.body, ref('BillingPeriodVoided'), 'void', 'BillingPeriod'));

    expect(errs).toEqual([]);
  });
});
