/**
 * Role serializer (SR-AZ-04, rbac 6/8.1, coding-standards 7.7): snapshot per role on contract schemas.
 * A hidden field is ABSENT (not null); undeclared keys are dropped; writeOnly/C3 never leak.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPENAPI_SCHEMAS } from '../src/generated/openapi-schemas';
import { RBAC_FIELD_DENY, rbacFieldAllows } from '../src/shared/serialization/field-policy';
import {
  UndeclaredResponseError,
  responseShapeFor,
  serializeResponse,
  serializeSchema,
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
