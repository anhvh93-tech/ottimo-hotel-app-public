/**
 * Role serializer (SR-AZ-04, rbac 6/8.1, coding-standards 7.7): snapshot per role on contract schemas.
 * A hidden field is ABSENT (not null); undeclared keys are dropped; writeOnly/C3 never leak.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPENAPI_SCHEMAS } from '../src/generated/openapi-schemas';
import { OPENAPI_META } from '../src/generated/openapi-meta';
import type { Shape } from '../src/shared/openapi-types';
import {
  RBAC_FIELD_DENY,
  SELF_DATA_FIELDS,
  rbacFieldAllows,
} from '../src/shared/serialization/field-policy';
import {
  UndeclaredResponseError,
  propertyAllowed,
  responseShapeFor,
  serializeResponse,
  serializeSchema,
  serializeShape,
} from '../src/shared/serialization/serializer';

const guest = {
  id: '01890000-0000-7000-8000-000000000001',
  code: 'KH-0012',
  fullName: 'Khách Mẫu',
  phone: '84905123456',
  email: 'khach@example.invalid',
  dateOfBirth: '1990-01-01',
  nationalityCode: 'VN',
  companyName: 'Cty Mẫu',
  taxCode: '0101234567',
  tags: ['vip'],
  version: 3,
  internalSecretColumn: 'never declared',
  documentNumberEnc: 'x',
};

const approval = {
  id: '01890000-0000-7000-8000-000000000002',
  type: 'foc',
  status: 'pending',
  amountVnd: 210000,
  reasonCode: 'regular_vip',
  requestedBy: 'Hạnh',
  requestedAt: '2026-10-16T09:00:00+07:00',
  requiredRole: 'front_desk_lead',
  approverRemainingMonthlyVnd: 1290000,
};

const ser = (schema: string, value: unknown, roles: string[], c3 = false) =>
  serializeSchema(schema, value, { roles, c3 }) as Record<string, unknown>;

describe('role serializer – x-visible-to', () => {
  it('collaborator (CTV): Guest keeps contact, loses DOB/company/tax/tags; absent, not null', () => {
    const out = ser('Guest', guest, ['collaborator']);
    expect(out).toMatchObject({
      id: guest.id,
      code: 'KH-0012',
      fullName: 'Khách Mẫu',
      phone: guest.phone,
    });
    for (const k of ['dateOfBirth', 'companyName', 'taxCode', 'tags']) {
      expect(k in out).toBe(false);
    }
  });

  it('sales_staff (SAL): keeps tags (D12a M), loses DOB/company/tax (D16 K)', () => {
    const out = ser('Guest', guest, ['sales_staff']);
    expect(out.tags).toEqual(['vip']);
    expect('companyName' in out).toBe(false);
    expect('taxCode' in out).toBe(false);
    expect('dateOfBirth' in out).toBe(false);
  });

  it('front desk sees everything declared; undeclared keys are dropped for every role', () => {
    const out = ser('Guest', guest, ['front_desk']);
    expect(out).toMatchObject({
      dateOfBirth: '1990-01-01',
      companyName: 'Cty Mẫu',
      taxCode: '0101234567',
    });
    expect('internalSecretColumn' in out).toBe(false);
    expect('documentNumberEnc' in out).toBe(false);
  });

  it('multi-role caller gets the union (FD+SAL = FD view)', () => {
    expect(ser('Guest', guest, ['front_desk', 'sales_staff'])).toEqual(
      ser('Guest', guest, ['front_desk']),
    );
  });

  it('ApprovalRequest.approverRemainingMonthlyVnd only for OWN/MGR/FDL', () => {
    expect(ser('ApprovalRequest', approval, ['front_desk_lead']).approverRemainingMonthlyVnd).toBe(
      1290000,
    );
    for (const r of ['front_desk', 'collaborator', 'sales_staff', 'housekeeping']) {
      expect('approverRemainingMonthlyVnd' in ser('ApprovalRequest', approval, [r])).toBe(false);
    }
  });
  it('SEC ARC-16 (0.3.13 bổ sung 1f): ApprovalRequest.possibleDuplicateCodes only for FD+, like Payment', () => {
    const refund = { ...approval, type: 'refund', possibleDuplicateCodes: ['OT-TEST-0001'] };
    for (const r of ['owner', 'manager', 'front_desk_lead', 'front_desk']) {
      expect(ser('ApprovalRequest', refund, [r]).possibleDuplicateCodes, r).toEqual([
        'OT-TEST-0001',
      ]);
    }
    for (const r of ['sales_staff', 'collaborator', 'housekeeping', 'maintenance']) {
      expect('possibleDuplicateCodes' in ser('ApprovalRequest', refund, [r]), r).toBe(false);
    }
    // union of roles: SAL + FD sees it
    expect(
      ser('ApprovalRequest', refund, ['sales_staff', 'front_desk']).possibleDuplicateCodes,
    ).toEqual(['OT-TEST-0001']);
    // the contract and the Payment field carry the same role list
    const prop = (schema: string) =>
      (OPENAPI_SCHEMAS.schemas as Record<string, { props?: Record<string, { v?: string[] }> }>)[
        schema
      ]?.props?.possibleDuplicateCodes?.v;
    expect(prop('ApprovalRequest')).toEqual(prop('Payment'));
  });
});

describe('role serializer – x-rbac-field (rbac-matrix 6, cells K)', () => {
  it('housekeeping (HK): GuestSummary keeps the name (T), loses phoneMasked (D02 K)', () => {
    const out = ser(
      'GuestSummary',
      { id: guest.id, code: 'KH-1', displayName: 'A', phoneMasked: '0905***456' },
      ['housekeeping'],
    );
    expect(out.displayName).toBe('A');
    expect('phoneMasked' in out).toBe(false);
  });

  it('maintenance (MT): D01 name removed even without x-visible-to', () => {
    const out = ser(
      'GuestSummary',
      { id: guest.id, code: 'KH-1', displayName: 'A', nationalityCode: 'VN' },
      ['maintenance'],
    );
    expect('displayName' in out).toBe(false);
    expect('nationalityCode' in out).toBe(false);
    expect(out.code).toBe('KH-1');
  });

  it('AuditEvent.actorName (D27): HK/MT/SAL/CTV never; FD (own log) yes', () => {
    const e = {
      occurredAt: '2026-10-16T09:00:00+07:00',
      actorType: 'user',
      category: 'money',
      action: 'x',
      actorName: 'Hạnh',
    };
    expect(ser('AuditEvent', e, ['front_desk']).actorName).toBe('Hạnh');
    for (const r of ['housekeeping', 'maintenance', 'sales_staff', 'collaborator']) {
      expect('actorName' in ser('AuditEvent', e, [r])).toBe(false);
    }
  });

  it('every x-rbac-field code used in openapi.yaml is reviewed in RBAC_FIELD_DENY', () => {
    const spec = readFileSync(
      join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.yaml'),
      'utf8',
    );
    const used = [
      ...new Set([...spec.matchAll(/x-rbac-field: (D\d+[a-c]?)/g)].map((m) => m[1] as string)),
    ];
    expect(used.filter((c) => !(c in RBAC_FIELD_DENY))).toEqual([]);
    expect(rbacFieldAllows('D99', ['owner'])).toBe(false); // unknown code: fail closed
  });

  it('public operations (no roles) never receive role-restricted or D-coded fields', () => {
    const out = ser('Guest', guest, []);
    expect(Object.keys(out).sort()).toEqual(['code', 'id', 'version']);
  });
});

describe("role serializer – the caller's own data (SELF_DATA_FIELDS, BUG-R4-018 / BUG-R4-022)", () => {
  const LOW = ['housekeeping', 'maintenance', 'sales_staff', 'collaborator'];
  const me = {
    id: '01890000-0000-7000-8000-000000000009',
    displayName: 'hk',
    csrfToken: 'c',
    properties: [],
    email: 'hk@example.test',
    securityEmailMissing: false,
  };

  it('Me.email (getMe / login / loginMfa) and the setMyEmail answer reach every role', () => {
    for (const r of [...LOW, 'front_desk', 'owner']) {
      for (const op of ['getMe', 'login', 'loginMfa']) {
        const out = serializeResponse(op, 200, me, { roles: [r] }) as Record<string, unknown>;
        expect({ r, op, email: out.email }).toEqual({ r, op, email: 'hk@example.test' });
        expect(out.securityEmailMissing).toBe(false);
      }
      expect(
        serializeResponse('setMyEmail', 200, { email: 'hk@example.test' }, { roles: [r] }),
      ).toEqual({
        email: 'hk@example.test',
      });
    }
  });

  it('V5-43 / SEC FB-R4-SEC-BE-C0312-02: serializeSchema (SSE/outbox path) never returns x-self-data – Me.email dropped for every role, OWN included', () => {
    for (const r of [...LOW, 'front_desk', 'front_desk_lead', 'manager', 'owner']) {
      const out = ser('Me', me, [r]);
      expect('email' in out, r).toBe(false);
      // the rest of Me is untouched (only the sd property goes)
      expect(out, r).toMatchObject({ id: me.id, displayName: 'hk', securityEmailMissing: false });
      // C3 does not reopen it either
      expect('email' in ser('Me', me, [r], true), r).toBe(false);
    }
    // the operation answers are unchanged: getMe still returns the caller's own e-mail
    expect(
      (serializeResponse('getMe', 200, me, { roles: ['housekeeping'] }) as Record<string, unknown>)
        .email,
    ).toBe('hk@example.test');
  });

  it('V5-43: serializeShape / serializeResponse / propertyAllowed are called only by the serializer and SerializeInterceptor (no hand-made owner in src/)', () => {
    const SRC = join(__dirname, '..', 'src');
    const walkDir = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walkDir(p) : p.endsWith('.ts') ? [p] : [];
      });
    const allowed = new Set([
      'shared/serialization/serializer.ts',
      'shared/serialization/serialize.interceptor.ts',
    ]);
    const offenders: string[] = [];
    for (const f of walkDir(SRC)) {
      const r = relative(SRC, f).split(sep).join('/');
      if (allowed.has(r) || r.startsWith('generated/')) continue;
      const code = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      for (const fn of ['serializeShape', 'serializeResponse', 'propertyAllowed']) {
        if (new RegExp(`\\b${fn}\\b`).test(code)) offenders.push(`${r}: ${fn}`);
      }
    }
    expect(offenders).toEqual([]);
    // the interceptor passes the operation id – the one owner the serializer trusts
    const interceptor = readFileSync(
      join(SRC, 'shared', 'serialization', 'serialize.interceptor.ts'),
      'utf8',
    );
    expect(interceptor).toMatch(/serializeResponse\(auth\.operationId,/);
  });

  it('own 2FA secrets reach every role (C3 rule unchanged: only in x-c3-log answers)', () => {
    const codes = Array.from({ length: 10 }, (_, i) => `AAAA-BBBB-CCCC-000${i}`);
    for (const r of LOW) {
      const setup = serializeResponse(
        'startMy2faSetup',
        200,
        { otpauthUri: 'otpauth://totp/OTTIMO:hk?secret=X', expiresAt: '2026-11-03T10:00:00+07:00' },
        { roles: [r], c3: OPENAPI_META.operations.startMy2faSetup!.c3Log },
      ) as Record<string, unknown>;
      expect(setup.otpauthUri).toBe('otpauth://totp/OTTIMO:hk?secret=X');
      for (const op of ['confirmMy2fa', 'regenerateMyRecoveryCodes']) {
        const out = serializeResponse(
          op,
          200,
          { recoveryCodes: codes },
          { roles: [r], c3: OPENAPI_META.operations[op]!.c3Log },
        ) as Record<string, unknown>;
        expect(out.recoveryCodes).toEqual(codes);
      }
      // C3 still gates: without x-c3-log the secret is dropped even for the caller
      const noC3 = serializeResponse(
        'startMy2faSetup',
        200,
        { otpauthUri: 'otpauth://x' },
        { roles: [r] },
      );
      expect(noC3).toEqual({});
    }
  });

  it('nothing else is relaxed: User.email stays OWN only, other D27 fields stay hidden, a nested `email` is not covered', () => {
    const user = {
      id: me.id,
      username: 'u',
      displayName: 'hk',
      status: 'active',
      roles: [],
      version: 1,
      email: 'hk@example.test',
    };
    for (const r of [...LOW, 'manager', 'front_desk']) {
      expect('email' in ser('User', user, [r])).toBe(false);
    }
    expect(ser('User', user, ['owner']).email).toBe('hk@example.test');
    // AuditEvent.actorName (D27) unchanged for HK even inside any operation
    const e = {
      occurredAt: '2026-10-16T09:00:00+07:00',
      actorType: 'user',
      category: 'money',
      action: 'x',
      actorName: 'Hạnh',
    };
    expect('actorName' in ser('AuditEvent', e, ['housekeeping'])).toBe(false);
  });

  /**
   * SEC FB-R4-SEC-BE-018-01 (a): the exact content of SELF_DATA_FIELDS. ADDING A KEY NEEDS SEC REVIEW – the list is
   * the only way an `x-self-data` property leaves the server. Change this array only in a PR that SEC approves.
   */
  const PINNED_SELF_DATA_FIELDS = [
    'schema:Me.email',
    'op:setMyEmail.email',
    'op:startMy2faSetup.otpauthUri',
    'op:confirmMy2fa.recoveryCodes',
    'op:regenerateMyRecoveryCodes.recoveryCodes',
  ];
  /** Operations whose answers are only ever about the caller (SEC condition 3 allow-list): these + `/v1/me*`. */
  const SELF_ONLY_OPS = new Set(['getMe', 'login', 'loginMfa']);
  const ME_PATH = /^\/v1\/me(\/|$)/;
  const isSelfOnlyOp = (opId: string) =>
    SELF_ONLY_OPS.has(opId) || ME_PATH.test(OPENAPI_META.operations[opId]?.path ?? '');
  const ALL_ROLES = [
    'owner',
    'manager',
    'front_desk_lead',
    'front_desk',
    'housekeeping',
    'maintenance',
    'sales_staff',
    'collaborator',
  ];

  /** Component schemas referenced (directly) by a shape. */
  const refsOf = (shape: Shape, out = new Set<string>()): Set<string> => {
    switch (shape.k) {
      case 'ref':
        out.add(shape.name);
        break;
      case 'array':
        refsOf(shape.items, out);
        break;
      case 'union':
        for (const b of shape.of) refsOf(b, out);
        break;
      case 'object':
        for (const p of Object.values(shape.props)) refsOf(p.s, out);
        if (shape.extra) refsOf(shape.extra, out);
        break;
    }
    return out;
  };
  /** Component schemas reachable (directly or through other schemas) from a shape. */
  const reachable = (shape: Shape): Set<string> => {
    const seen = new Set<string>();
    const todo = [...refsOf(shape)];
    while (todo.length) {
      const name = todo.pop() as string;
      if (seen.has(name)) continue;
      seen.add(name);
      const s = OPENAPI_SCHEMAS.schemas[name];
      if (s) todo.push(...refsOf(s));
    }
    return seen;
  };
  const hasSelfData = (s: Shape | undefined) =>
    !!s && s.k === 'object' && Object.values(s.props).some((p) => p.sd);

  it('SEC 018-01 (a): SELF_DATA_FIELDS is exactly the pinned list (adding a key needs SEC review)', () => {
    expect([...SELF_DATA_FIELDS].sort()).toEqual([...PINNED_SELF_DATA_FIELDS].sort());
  });

  it('SEC condition 2: SELF_DATA_FIELDS equals the generated OPENAPI_SCHEMAS.selfData (x-self-data in the contract)', () => {
    expect([...SELF_DATA_FIELDS].sort()).toEqual([...OPENAPI_SCHEMAS.selfData].sort());
  });

  it('SEC 018-02: keys carry the owner kind (schema: / op:) – a schema and an operation cannot share a key', () => {
    for (const key of SELF_DATA_FIELDS) {
      expect(key, key).toMatch(/^(schema|op):[A-Za-z0-9]+\.[A-Za-z0-9]+$/);
    }
    expect(SELF_DATA_FIELDS.has('Me.email')).toBe(false);
    expect(SELF_DATA_FIELDS.has('setMyEmail.email')).toBe(false);
  });

  it('every SELF_DATA_FIELDS key is a first-level x-self-data property (no D-code) of a self-only answer', () => {
    for (const key of SELF_DATA_FIELDS) {
      const m = /^(schema|op):([^.]+)\.(.+)$/.exec(key);
      expect(m, key).not.toBeNull();
      const [, kind, owner, prop] = m as unknown as [string, string, string, string];
      let shape: Shape | undefined;
      if (kind === 'schema') {
        shape = OPENAPI_SCHEMAS.schemas[owner];
      } else {
        expect(isSelfOnlyOp(owner), key).toBe(true);
        shape = OPENAPI_SCHEMAS.responses[owner]?.['200'];
      }
      expect(shape?.k, key).toBe('object');
      const p = shape && shape.k === 'object' ? shape.props[prop] : undefined;
      expect(p?.sd, key).toBe(true);
      expect(p?.f, key).toBeUndefined();
      expect(p?.v, key).toBeUndefined();
    }
  });

  it('SEC condition 3: a schema with x-self-data is referenced (directly or not) only from self-only answers', () => {
    const sdSchemas = Object.entries(OPENAPI_SCHEMAS.schemas)
      .filter(([, s]) => hasSelfData(s))
      .map(([n]) => n);
    expect(sdSchemas).toEqual(['Me']);
    const offenders: string[] = [];
    const users = new Map<string, Set<string>>(sdSchemas.map((n) => [n, new Set<string>()]));
    for (const [opId, byStatus] of Object.entries(OPENAPI_SCHEMAS.responses)) {
      for (const shape of Object.values(byStatus)) {
        for (const name of reachable(shape)) {
          if (!users.has(name)) continue;
          users.get(name)!.add(opId);
          if (!isSelfOnlyOp(opId)) offenders.push(`${opId} → ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
    // `Me` is returned by exactly these operations today (a new one must be reviewed here)
    expect([...users.get('Me')!].sort()).toEqual([...SELF_ONLY_OPS].sort());
    // and no other component schema embeds an x-self-data schema (serializeSchema of SSE/outbox payloads)
    const embedding = Object.entries(OPENAPI_SCHEMAS.schemas)
      .filter(([n, s]) => sdSchemas.some((sd) => sd !== n && reachable(s).has(sd)))
      .map(([n]) => n);
    expect(embedding).toEqual([]);
  });

  it('SEC condition 3 (guard works): an x-self-data schema reached through another schema is detected', () => {
    const outer: Shape = {
      k: 'object',
      open: false,
      props: { items: { s: { k: 'array', items: { k: 'ref', name: 'Me' } } } },
    };
    expect(reachable(outer).has('Me')).toBe(true);
  });

  it('SEC condition 4 / FB-R4-BEA-ARC-01: an sd property whose key is not listed is dropped for every role, OWN included', () => {
    const shape: Shape = {
      k: 'object',
      open: false,
      props: {
        id: { s: { k: 'scalar' } },
        email: { s: { k: 'scalar' }, sd: true },
      },
    };
    const value = { id: 'u1', email: 'someone@example.test' };
    for (const r of ALL_ROLES) {
      // unlisted owner (an op that is not on the list)
      expect(serializeShape(value, shape, { roles: [r] }, 'op:listUsers'), r).toEqual({ id: 'u1' });
      // a schema owner with the same property name but not listed
      expect(serializeShape(value, shape, { roles: [r] }, 'schema:User'), r).toEqual({ id: 'u1' });
      // no owner (below the first level / no context) → dropped
      expect(serializeShape(value, shape, { roles: [r] }), r).toEqual({ id: 'u1' });
      // the unprefixed v1.0.3 key form is not accepted either
      expect(propertyAllowed(shape.props.email!, { roles: [r] }, null, 'email'), r).toBe(false);
      // listed key → returned (the same shape, the reviewed owner)
      expect(serializeShape(value, shape, { roles: [r] }, 'op:setMyEmail'), r).toEqual(value);
    }
  });

  it('sd does not bypass w / c3 / g / v (they still run first)', () => {
    const roles = ['owner'];
    const listed = ['op:startMy2faSetup', 'otpauthUri'] as const;
    const base = { s: { k: 'scalar' }, sd: true } as const;
    expect(propertyAllowed({ ...base }, { roles, c3: true }, ...listed)).toBe(true);
    expect(propertyAllowed({ ...base, w: true }, { roles, c3: true }, ...listed)).toBe(false);
    expect(propertyAllowed({ ...base, c3: true }, { roles }, ...listed)).toBe(false);
    expect(propertyAllowed({ ...base, g: 2 }, { roles, guestLevel: 1 }, ...listed)).toBe(false);
    expect(propertyAllowed({ ...base, v: ['manager'] }, { roles }, ...listed)).toBe(false);
  });

  it('a nested Me.email (below the first level of another object) is not covered', () => {
    const nested: Shape = {
      k: 'object',
      open: false,
      props: { inner: { s: OPENAPI_SCHEMAS.schemas.Me! } },
    };
    const out = serializeShape(
      { inner: { email: 'hk@example.test', id: 'x' } },
      nested,
      {
        roles: ['owner'],
      },
      'op:getMe',
    ) as { inner: Record<string, unknown> };
    expect('email' in out.inner).toBe(false);
  });
});

describe('role serializer – writeOnly, C3, operations', () => {
  it('writeOnly properties never leave the server; C3 only for x-c3-log operations', () => {
    // GuestDocumentInput: docNumber is writeOnly + C3.
    const doc = { fullNameOnDoc: 'A', docNumber: '012345678901', gender: 'male' };
    expect('docNumber' in ser('GuestDocumentInput', doc, ['owner'], true)).toBe(false);
    const shapes = OPENAPI_SCHEMAS.schemas;
    const withC3 = Object.entries(shapes).find(
      ([, s]) => s.k === 'object' && Object.values(s.props).some((p) => p.c3 && !p.w),
    );
    expect(withC3).toBeDefined();
    const [name, shape] = withC3 as [
      string,
      { k: 'object'; props: Record<string, { c3?: boolean; w?: boolean }> },
    ];
    const key = Object.entries(shape.props).find(([, p]) => p.c3 && !p.w)?.[0] as string;
    expect(key in ser(name, { [key]: 'secret' }, ['owner'], false)).toBe(false);
    expect(ser(name, { [key]: 'secret' }, ['owner'], true)[key]).toBe('secret');
  });

  it('operation response: list envelope + array items filtered per role', () => {
    const body = { data: [approval, approval], page: { nextCursor: null, limit: 50 }, extra: 1 };
    const out = serializeResponse('listApprovalRequests', 200, body, {
      roles: ['collaborator'],
    }) as {
      data: Record<string, unknown>[];
      page: unknown;
    };
    expect(out.data).toHaveLength(2);
    expect(out.data.every((d) => !('approverRemainingMonthlyVnd' in d))).toBe(true);
    expect(out.page).toEqual({ nextCursor: null, limit: 50 });
    expect('extra' in out).toBe(false);
  });

  it('a handler returning JSON for an operation without a JSON 2xx schema is a programming error', () => {
    const op = 'logout'; // declares only 204 (no JSON body)
    expect(responseShapeFor(op, 204)).toBeNull();
    {
      expect(() => serializeResponse(op, 204, { leaked: true }, { roles: ['owner'] })).toThrow(
        UndeclaredResponseError,
      );
    }
    expect(serializeResponse(op, 204, undefined, { roles: ['owner'] })).toBeUndefined();
  });
});
