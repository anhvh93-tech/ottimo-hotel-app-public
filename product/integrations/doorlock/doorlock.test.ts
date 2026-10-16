import { describe, expect, it } from 'vitest';
import { IntegrationError, isoInstant, type IntegrationContext } from '../contracts/common.js';
import type { CreateDoorCodeRequest } from '../contracts/doorlock.js';
import {
  assertCardsIssued,
  computeDoorValidity,
  generateBirthdayDoorCode,
  generateDoorCode,
  MAX_KEY_CARDS_PER_ROOM,
} from './access.js';
import { createDoorLockAdapter } from './factory.js';
import { ManualDoorLockAdapter } from './manual.js';
import { MockDoorLockAdapter } from './mock.js';

const ctx: IntegrationContext = {
  propertyId: 'p1',
  credentialsRef: 'env:DOORLOCK_TTLOCK',
  requestId: 'r1',
};
const from = isoInstant('2026-10-19T14:00:00+07:00');
const to = isoInstant('2026-10-22T12:00:00+07:00');
const req = (over: Partial<CreateDoorCodeRequest> = {}): CreateDoorCodeRequest => ({
  lockRef: 'lock-202',
  code: '582913',
  kind: 'guest',
  validFrom: from,
  validTo: to,
  label: 'dc_7f3a9b',
  ...over,
});

describe('computeDoorValidity (BR-403)', () => {
  it('standard: arrival 14:00 → departure 12:00, +07:00', () => {
    expect(computeDoorValidity({ arrivalDate: '2026-10-19', departureDate: '2026-10-22' })).toEqual(
      {
        validFrom: '2026-10-19T14:00:00+07:00',
        validTo: '2026-10-22T12:00:00+07:00',
      },
    );
  });
  it('confirmed early check-in and approved late check-out widen the window', () => {
    expect(
      computeDoorValidity({
        arrivalDate: '2026-10-19',
        departureDate: '2026-10-22',
        earlyCheckInTime: '10:00',
        lateCheckOutTime: '18:00',
      }),
    ).toEqual({ validFrom: '2026-10-19T10:00:00+07:00', validTo: '2026-10-22T18:00:00+07:00' });
  });
  it.each([
    [{ arrivalDate: '2026-10-22', departureDate: '2026-10-22' }],
    [{ arrivalDate: '2026-10-19', departureDate: '2026-10-22', checkInTime: '2pm' }],
    [{ arrivalDate: '2026-19-10', departureDate: '2026-10-22' }],
  ])('refuses %j', (input) => {
    expect(() => computeDoorValidity(input)).toThrowError(IntegrationError);
  });
});

describe('code generation (SR-LOCK-01)', () => {
  it('6 digits by default, 6–10 allowed', () => {
    expect(generateDoorCode()).toMatch(/^\d{6}$/);
    expect(generateDoorCode(10)).toMatch(/^\d{10}$/);
    expect(() => generateDoorCode(5)).toThrowError(IntegrationError);
    expect(() => generateDoorCode(11)).toThrowError(IntegrationError);
  });
  it('is not constant (CSPRNG smoke test)', () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateDoorCode()));
    expect(seen.size).toBeGreaterThan(45);
  });
  it('birthday code = ddmm + 3 random digits (7 digits)', () => {
    expect(generateBirthdayDoorCode('2902')).toMatch(/^2902\d{3}$/);
    for (const bad of ['3102x', '3002', '0013', '00', '310']) {
      expect(() => generateBirthdayDoorCode(bad)).toThrowError(IntegrationError);
    }
  });
  it('cards issued 0–2 per room', () => {
    expect(MAX_KEY_CARDS_PER_ROOM).toBe(2);
    for (const n of [0, 1, 2]) expect(() => assertCardsIssued(n)).not.toThrow();
    for (const n of [-1, 3, 1.5]) expect(() => assertCardsIssued(n)).toThrowError(IntegrationError);
  });
});

describe('ManualDoorLockAdapter (R2 default)', () => {
  const a = new ManualDoorLockAdapter({ newId: () => 'x1' });

  it('createCode → installed=false (core creates "install code" task), no code returned', async () => {
    const r = await a.createCode(ctx, req());
    expect(r).toEqual({ credentialId: 'manual-x1', installed: false });
    expect(JSON.stringify(r)).not.toContain('582913');
  });

  it('revoke / updateValidity succeed without touching a lock', async () => {
    await expect(a.revoke(ctx, 'manual-x1')).resolves.toBeUndefined();
    await expect(a.updateValidity(ctx, 'manual-x1', from, to)).resolves.toBeUndefined();
    await expect(a.updateValidity(ctx, 'manual-x1', to, from)).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
  });

  it('refuses personal data in label and bad codes; error never echoes the code', async () => {
    await expect(
      a.createCode(ctx, req({ label: 'Nguyen Van A 0901234567' })),
    ).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    const err = await a.createCode(ctx, req({ code: '12ab56' })).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(IntegrationError);
    expect((err as Error).message).not.toContain('12ab56');
  });

  it('capabilities: no remote, keypad + card', async () => {
    expect(await a.capabilities(ctx, 'lock-202')).toMatchObject({
      remote: false,
      customCode: true,
      card: true,
    });
    expect((await a.healthCheck(ctx)).status).toBe('ok');
  });

  it('addCard returns a credential id', async () => {
    await expect(
      a.addCard(ctx, {
        lockRef: 'lock-202',
        keyCardUid: 'A1B2C3D4',
        validFrom: from,
        validTo: to,
        label: 'kc_1',
      }),
    ).resolves.toEqual({ credentialId: 'manual-card-x1' });
  });
});

describe('MockDoorLockAdapter', () => {
  it('issues, extends, revokes; inspect() never exposes the code', async () => {
    const m = new MockDoorLockAdapter();
    const { credentialId, installed } = await m.createCode(ctx, req());
    expect(installed).toBe(true);
    await m.updateValidity(ctx, credentialId, from, isoInstant('2026-10-23T12:00:00+07:00'));
    await m.revoke(ctx, credentialId);
    await m.revoke(ctx, credentialId); // idempotent
    const view = m.inspect();
    expect(view[0]).toMatchObject({ revoked: true, validTo: '2026-10-23T12:00:00+07:00' });
    expect(JSON.stringify(view)).not.toContain('582913');
    await expect(m.updateValidity(ctx, credentialId, from, to)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  it('same code active on the same lock with overlapping window → CONFLICT; other lock or after revoke ok', async () => {
    const m = new MockDoorLockAdapter();
    const first = await m.createCode(ctx, req());
    await expect(m.createCode(ctx, req())).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(m.createCode(ctx, req({ lockRef: 'lock-203' }))).resolves.toBeTruthy();
    await m.revoke(ctx, first.credentialId);
    await expect(m.createCode(ctx, req())).resolves.toBeTruthy();
  });

  it('at most 2 active key cards per room', async () => {
    const m = new MockDoorLockAdapter();
    const card = (uid: string) => ({
      lockRef: 'lock-202',
      keyCardUid: uid,
      validFrom: from,
      validTo: to,
      label: 'kc',
    });
    const c1 = await m.addCard(ctx, card('AAAA0001'));
    await m.addCard(ctx, card('AAAA0002'));
    await expect(m.addCard(ctx, card('AAAA0003'))).rejects.toMatchObject({ code: 'CONFLICT' });
    await m.revoke(ctx, c1.credentialId); // lost card revoked → a replacement may be issued
    await expect(m.addCard(ctx, card('AAAA0003'))).resolves.toBeTruthy();
  });

  it('other property cannot see or revoke the credential', async () => {
    const m = new MockDoorLockAdapter();
    const { credentialId } = await m.createCode(ctx, req());
    await expect(m.revoke({ ...ctx, propertyId: 'p2' }, credentialId)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('access log filtered by lock and time', async () => {
    const m = new MockDoorLockAdapter();
    const { credentialId } = await m.createCode(ctx, req());
    m.simulateOpen(ctx, credentialId, isoInstant('2026-10-19T15:02:00+07:00'));
    expect(await m.accessLog(ctx, 'lock-202', isoInstant('2026-10-19T15:00:00+07:00'))).toEqual([
      { at: '2026-10-19T15:02:00+07:00', method: 'code', credentialId },
    ]);
    expect(await m.accessLog(ctx, 'lock-202', isoInstant('2026-10-19T16:00:00+07:00'))).toEqual([]);
  });

  it.each([
    ['timeout', 'TIMEOUT', true],
    ['unavailable', 'UNAVAILABLE', true],
    ['auth_error', 'AUTH', false],
  ] as const)('scenario %s → %s (retryable=%s), health down', async (scenario, code, retryable) => {
    const m = new MockDoorLockAdapter({ scenario });
    await expect(m.createCode(ctx, req())).rejects.toMatchObject({ code, retryable });
    expect((await m.healthCheck(ctx)).status).toBe('down');
  });
});

describe('createDoorLockAdapter', () => {
  it('off → null, manual/mock → instances, ttlock → CONFIG until R3, unknown → CONFIG', () => {
    expect(createDoorLockAdapter('off')).toBeNull();
    expect(createDoorLockAdapter('manual')).toBeInstanceOf(ManualDoorLockAdapter);
    expect(createDoorLockAdapter('mock')).toBeInstanceOf(MockDoorLockAdapter);
    expect(() => createDoorLockAdapter('ttlock')).toThrow(/Round 3/);
    expect(() => createDoorLockAdapter('Mock')).toThrowError(IntegrationError);
  });
});
