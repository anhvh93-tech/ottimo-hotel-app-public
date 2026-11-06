/**
 * x-write-roles field gate (OpenAPI 0.3.13 bổ sung 1 (a), contract-0.3.13 1.16; SEC FB-R5-SEC-ARC-02; BA ghi chú 46b)
 * without a database:
 * - "sent" = key present, whatever the value (null, [], {}, 0, false); paths `a`, `a.b`, `a[].b`; fail-closed on a
 *   malformed body shape (the gate runs before body validation);
 * - multi-role accounts pass when one role is listed (union, like x-roles);
 * - the generated meta: every operation with writeRoles is a staff operation (the guard path that applies it), every
 *   listed role is in x-roles, every path parses;
 * - QA's fieldCases (product/tests/fixtures/rbac-cases.json, `RBF-<operationId>-<field>-<subject>`) agree with the
 *   gate decision for a body that sends the field.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPENAPI_META } from '../src/generated/openapi-meta';
import { bodySends, deniedWriteFields } from '../src/shared/http/write-roles';

interface FieldCase {
  id: string;
  operationId: string;
  field: string;
  subject: string;
  roles: string[];
  expected: 'pass' | '403';
  writeRoles: string[];
}

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { fieldCases: FieldCase[] };

/**
 * A body that sends `path` with an empty array as the value (the smallest thing a client could send):
 * `nightlyRates` → { nightlyRates: [] }, `rooms[].nightlyRates` → { rooms: [{ nightlyRates: [] }] }.
 */
function bodySending(path: string): Record<string, unknown> {
  const segs = path.split('.');
  const walk = (i: number): Record<string, unknown> => {
    const seg = segs[i] as string;
    const name = seg.endsWith('[]') ? seg.slice(0, -2) : seg;
    if (i === segs.length - 1) return { [name]: [] };
    const inner = walk(i + 1);
    return { [name]: seg.endsWith('[]') ? [inner] : inner };
  };
  return walk(0);
}

describe('bodySends – what "sent" means', () => {
  it('a root field is sent whatever its value (null, [], {}, 0, false, "")', () => {
    for (const v of [null, [], {}, 0, false, '', [{ date: '2026-11-09', amountVnd: 1 }]]) {
      expect(bodySends({ nightlyRates: v }, 'nightlyRates'), JSON.stringify(v)).toBe(true);
    }
    // `undefined` never arrives from JSON, but an own key is an own key.
    expect(bodySends({ nightlyRates: undefined }, 'nightlyRates')).toBe(true);
  });

  it('an absent field, a non-object body and a top-level array send nothing', () => {
    expect(bodySends({}, 'nightlyRates')).toBe(false);
    expect(bodySends({ nightlyrates: [] }, 'nightlyRates')).toBe(false);
    for (const b of [null, undefined, 'nightlyRates', 42, true]) {
      expect(bodySends(b, 'nightlyRates')).toBe(false);
    }
    expect(bodySends([{ nightlyRates: [] }], 'nightlyRates')).toBe(false);
  });

  it('an inherited key is not a sent field (own properties only)', () => {
    const body = Object.create({ nightlyRates: [] }) as Record<string, unknown>;
    expect(bodySends(body, 'nightlyRates')).toBe(false);
  });

  it('`a.b`: the child field of an object', () => {
    expect(bodySends({ listPrice: { reason: null } }, 'listPrice.reason')).toBe(true);
    expect(bodySends({ listPrice: {} }, 'listPrice.reason')).toBe(false);
    expect(bodySends({ listPrice: null }, 'listPrice.reason')).toBe(false);
    expect(bodySends({ reason: 'x' }, 'listPrice.reason')).toBe(false);
    // fail-closed: an array where an object is expected is searched element by element
    expect(bodySends({ listPrice: [{}, { reason: 1 }] }, 'listPrice.reason')).toBe(true);
  });

  it('`a[].b`: the field of any array element', () => {
    const p = 'rooms[].nightlyRates';
    expect(bodySends({ rooms: [{ roomId: 'a' }, { nightlyRates: [] }] }, p)).toBe(true);
    expect(bodySends({ rooms: [{ roomId: 'a' }, { roomId: 'b' }] }, p)).toBe(false);
    expect(bodySends({ rooms: [] }, p)).toBe(false);
    expect(bodySends({ rooms: [null, 1, 'x'] }, p)).toBe(false);
    // fail-closed: an object where an array is expected counts as its one element
    expect(bodySends({ rooms: { nightlyRates: null } }, p)).toBe(true);
    // nested arrays are searched too
    expect(bodySends({ rooms: [[{ nightlyRates: 0 }]] }, p)).toBe(true);
  });

  it('a malformed path is a programming error', () => {
    for (const p of ['', '.', 'a..b', 'a.']) expect(() => bodySends({}, p)).toThrow(/malformed/);
  });
});

describe('deniedWriteFields – the decision', () => {
  const wr = { nightlyRates: ['owner', 'manager', 'front_desk_lead', 'front_desk'] };

  it('no writeRoles, or the field not sent → nothing denied', () => {
    expect(deniedWriteFields(undefined, ['sales_staff'], { nightlyRates: [] })).toEqual([]);
    expect(deniedWriteFields(wr, ['sales_staff'], { adults: 2 })).toEqual([]);
  });

  it('SAL / CTV sending the field → denied; FD+ → passes', () => {
    expect(deniedWriteFields(wr, ['sales_staff'], { nightlyRates: null })).toEqual([
      'nightlyRates',
    ]);
    expect(deniedWriteFields(wr, ['collaborator'], { nightlyRates: [] })).toEqual(['nightlyRates']);
    for (const r of wr.nightlyRates) {
      expect(deniedWriteFields(wr, [r], { nightlyRates: [] }), r).toEqual([]);
    }
  });

  it('multi-role account: union – FD ∪ SAL may send it (BA 46b, T14-12)', () => {
    expect(deniedWriteFields(wr, ['front_desk', 'sales_staff'], { nightlyRates: [] })).toEqual([]);
    expect(deniedWriteFields(wr, ['collaborator', 'sales_staff'], { nightlyRates: [] })).toEqual([
      'nightlyRates',
    ]);
  });

  it('several refused fields are all named, sorted', () => {
    const two = { zeta: ['owner'], alpha: ['owner'], 'rooms[].x': ['manager'] };
    expect(
      deniedWriteFields(two, ['front_desk'], { zeta: 1, alpha: 1, rooms: [{ x: 1 }] }),
    ).toEqual(['alpha', 'rooms[].x', 'zeta']);
  });
});

describe('generated meta – x-write-roles', () => {
  const ops = Object.entries(OPENAPI_META.operations).filter(([, m]) => m.writeRoles);

  it('the 0.3.13 operations carry it (calculateQuote, saveQuote, createReservationGroup)', () => {
    expect(ops.map(([id]) => id).sort()).toEqual(
      expect.arrayContaining(['calculateQuote', 'createReservationGroup', 'saveQuote']),
    );
  });

  it('every one is a staff operation, its roles ⊆ x-roles, its paths parse', () => {
    for (const [id, m] of ops) {
      expect(m.public, id).toBe(false);
      for (const r of ['guest', 'system', 'any_staff']) expect(m.roles, id).not.toContain(r);
      for (const [path, roles] of Object.entries(m.writeRoles!)) {
        expect(roles.length, `${id} ${path}`).toBeGreaterThan(0);
        for (const r of roles) expect(m.roles, `${id} ${path} ${r}`).toContain(r);
        expect(() => bodySends({}, path), `${id} ${path}`).not.toThrow();
        expect(bodySends(bodySending(path), path), `${id} ${path}`).toBe(true);
      }
    }
  });
});

describe('rbac-cases.json fieldCases agree with the gate', () => {
  it('the fixture has field cases for every operation with writeRoles', () => {
    const withMeta = Object.entries(OPENAPI_META.operations)
      .filter(([, m]) => m.writeRoles)
      .map(([id]) => id)
      .sort();
    expect([...new Set(fixture.fieldCases.map((c) => c.operationId))].sort()).toEqual(withMeta);
  });

  it.each(fixture.fieldCases.map((c) => [`${c.id} → ${c.expected}`, c] as const))(
    '%s',
    (_name, c) => {
      expect(c.id).toBe(`RBF-${c.operationId}-${c.field}-${c.subject}`);
      const meta = OPENAPI_META.operations[c.operationId]!;
      expect(meta.writeRoles?.[c.field]).toEqual(c.writeRoles);
      const denied = deniedWriteFields(meta.writeRoles, c.roles, bodySending(c.field));
      expect(denied.includes(c.field)).toBe(c.expected === '403');
    },
  );
});
