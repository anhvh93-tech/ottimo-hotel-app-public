/**
 * BE-C Sprint 3 "Phản hồi & sửa" units (no DB): guest-level cut of the serializer (SEC FB-R2-SEC-BE-50 b,
 * ARC FB-S3-28), OnlineCheckin allow-list of the contract (ĐK-2 – 11 keys), the process-wide upload gate
 * (ARC FB-S3-18, SEC BE-47), binary request bodies never hashed (ARC FB-S3-03).
 */
import { describe, expect, it } from 'vitest';
import { OPENAPI_META } from '../src/generated/openapi-meta';
import { OPENAPI_SCHEMAS } from '../src/generated/openapi-schemas';
import {
  MAX_UPLOADS_IN_FLIGHT,
  uploadsInFlight,
  withUploadGate,
} from '../src/modules/files/public/upload-gate';
import { requestHash } from '../src/shared/http/unit-of-work';
import { ProblemError } from '../src/shared/problem';
import type { Shape } from '../src/shared/openapi-types';
import { propertyAllowed, serializeResponse } from '../src/shared/serialization/serializer';

const stay = {
  reservationCode: 'OTM-ABC123',
  status: 'confirmed',
  stayType: 'short',
  roomNo: '202',
  arrivalDate: '2026-10-15',
  departureDate: '2026-10-20',
  checkinTime: '14:00',
  checkoutTime: '12:00',
  guestFullName: 'Emma Schmidt',
  doorCode: '482913',
};

describe('serializer – x-guest-level (ĐK-2)', () => {
  it('a level-1 guest session never receives level-2 fields (name, door code); level 2 does', () => {
    const l1 = serializeResponse('getGuestStay', 200, stay, {
      roles: ['guest'],
      guestLevel: 1,
    }) as Record<string, unknown>;
    expect(l1).not.toHaveProperty('guestFullName');
    expect(l1).not.toHaveProperty('doorCode');
    expect(l1).toMatchObject({ reservationCode: 'OTM-ABC123', checkinTime: '14:00' });
    const l2 = serializeResponse('getGuestStay', 200, stay, {
      roles: ['guest'],
      guestLevel: 2,
    }) as Record<string, unknown>;
    expect(l2).toHaveProperty('guestFullName', 'Emma Schmidt');
  });

  it('OnlineCheckin of the contract has exactly the 11 keys SEC approved for level 1', () => {
    const shape = (OPENAPI_SCHEMAS.schemas as Record<string, { props?: Record<string, unknown> }>)
      .OnlineCheckin;
    expect(Object.keys(shape?.props ?? {}).sort()).toEqual(
      [
        'currentStep',
        'requiredPeople',
        'uploadedPeople',
        'etaTime',
        'consentRecorded',
        'completedAt',
        'noticeAccepted',
        'lateArrival',
        'deferredPeople',
        'currentNoticeVersion',
        'imageRetentionDays',
      ].sort(),
    );
    // An undeclared key a handler might add is dropped for the guest.
    const out = serializeResponse(
      'getOnlineCheckin',
      200,
      { currentStep: 'notice', requiredPeople: 1, uploadedPeople: [], docNumberLast4: '6789' },
      { roles: ['guest'], guestLevel: 1 },
    );
    expect(out).not.toHaveProperty('docNumberLast4');
  });
});

describe('upload gate (ARC FB-S3-18)', () => {
  it(`at most ${MAX_UPLOADS_IN_FLIGHT} uploads in flight; the next one gets 503 + Retry-After at once`, async () => {
    const release: Array<() => void> = [];
    const held = Array.from({ length: MAX_UPLOADS_IN_FLIGHT }, () =>
      withUploadGate(() => new Promise<void>((r) => release.push(r))),
    );
    expect(uploadsInFlight()).toBe(MAX_UPLOADS_IN_FLIGHT);
    const refused = await withUploadGate(async () => 'ran').catch((e: unknown) => e);
    expect(refused).toBeInstanceOf(ProblemError);
    expect((refused as ProblemError).code).toBe('SERVICE_UNAVAILABLE');
    for (const r of release) r();
    await Promise.all(held);
    expect(uploadsInFlight()).toBe(0);
    await expect(withUploadGate(async () => 'ran')).resolves.toBe('ran');
  });

  it('a failing upload frees its slot', async () => {
    await expect(
      withUploadGate(async () => {
        throw new Error('decode failed');
      }),
    ).rejects.toThrow('decode failed');
    expect(uploadsInFlight()).toBe(0);
  });
});

describe('idempotency hash (ARC FB-S3-03)', () => {
  it('refuses binary bodies (Buffer, typed array, ArrayBuffer) – only semantic JSON is hashed', () => {
    for (const body of [Buffer.from('abc'), new Uint8Array([1, 2, 3]), new ArrayBuffer(4)]) {
      expect(() => requestHash('POST', '/x', body)).toThrow(ProblemError);
    }
    expect(requestHash('POST', '/x', { b: 1, a: 2 })).toBe(
      requestHash('POST', '/x', { a: 2, b: 1 }),
    );
  });
});

/** Property names of a response shape a caller with `roles` could receive (refs resolved, cycles cut). */
function reachableKeys(shape: Shape, roles: string[], seen = new Set<string>()): Set<string> {
  const out = new Set<string>();
  const visit = (sh: Shape): void => {
    switch (sh.k) {
      case 'ref':
        if (seen.has(sh.name)) return;
        seen.add(sh.name);
        if (OPENAPI_SCHEMAS.schemas[sh.name]) visit(OPENAPI_SCHEMAS.schemas[sh.name] as Shape);
        return;
      case 'array':
        visit(sh.items);
        return;
      case 'union':
        sh.of.forEach(visit);
        return;
      case 'object':
        for (const [k, p] of Object.entries(sh.props)) {
          if (!propertyAllowed(p, { roles })) continue;
          out.add(k);
          visit(p.s);
        }
        if (sh.extra) visit(sh.extra);
        return;
      default:
        return;
    }
  };
  visit(shape);
  return out;
}

describe('SEC B2 / FB-R2-SEC-BE-50 (d): HK, MT, SAL, CTV never receive document fields', () => {
  const roles = ['housekeeping', 'maintenance', 'sales_staff', 'collaborator'];

  it('no registration / guest-document operation is open to them (role gate answers 403 first)', () => {
    const open = Object.entries(OPENAPI_META.operations)
      .filter(([, m]) => m.path.includes('/registrations') || m.path.includes('/c3-access-log'))
      .filter(([, m]) => m.roles.some((r) => roles.includes(r)))
      .map(([op]) => op);
    expect(open).toEqual([]);
  });

  it('no response they can call carries docType / fullNameOnDoc / document numbers', () => {
    const leaks: string[] = [];
    for (const role of roles) {
      for (const [op, m] of Object.entries(OPENAPI_META.operations)) {
        if (!m.roles.includes(role)) continue;
        for (const shape of Object.values(OPENAPI_SCHEMAS.responses[op] ?? {})) {
          const keys = reachableKeys(shape, [role]);
          for (const k of ['docType', 'fullNameOnDoc', 'docNumber', 'docNumberLast4', 'imageIds']) {
            if (keys.has(k)) leaks.push(`${role} ${op} ${k}`);
          }
        }
      }
    }
    expect(leaks).toEqual([]);
  });
});
