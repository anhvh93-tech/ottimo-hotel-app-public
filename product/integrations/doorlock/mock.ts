// DoorLockAdapter Mock (README 1.2) – behaves like a gateway-connected lock, no network. Owner: INT.
// Keeps only a salted hash of each code (to refuse duplicates), never the code itself.
import { createHash, randomBytes } from 'node:crypto';
import {
  errorForScenario,
  isoInstant,
  IntegrationError,
  type HealthStatus,
  type IntegrationContext,
  type IsoInstant,
  type MockScenario,
} from '../contracts/common.js';
import type {
  AddKeyCardRequest,
  CreateDoorCodeRequest,
  CreateDoorCodeResult,
  DoorAccessLogEntry,
  DoorLockAdapter,
  DoorLockCapabilities,
} from '../contracts/doorlock.js';
import {
  assertAddKeyCard,
  assertCreateDoorCode,
  assertValidityWindow,
  MAX_KEY_CARDS_PER_ROOM,
} from './access.js';

/** What a test may inspect – no code, no hash. */
export interface MockDoorCredentialView {
  credentialId: string;
  propertyId: string;
  lockRef: string;
  type: 'code' | 'card';
  kind: 'guest' | 'staff';
  validFrom: IsoInstant;
  validTo: IsoInstant;
  revoked: boolean;
  label: string;
}

interface Stored extends MockDoorCredentialView {
  secretHash?: string;
}

export interface MockDoorLockOptions {
  scenario?: MockScenario;
  now?: () => IsoInstant;
  capabilities?: Partial<DoorLockCapabilities>;
}

export class MockDoorLockAdapter implements DoorLockAdapter {
  private scenario: MockScenario;
  private readonly now: () => IsoInstant;
  private readonly caps: DoorLockCapabilities;
  private readonly salt = randomBytes(16);
  private readonly store = new Map<string, Stored>();
  private readonly log: (DoorAccessLogEntry & { lockRef: string; propertyId: string })[] = [];
  private seq = 0;

  constructor(opts: MockDoorLockOptions = {}) {
    this.scenario = opts.scenario ?? 'ok';
    this.now = opts.now ?? (() => isoInstant('2026-10-16T09:00:00+07:00'));
    this.caps = {
      remote: true,
      customCode: true,
      codeLength: { min: 6, max: 10 },
      card: true,
      fingerprint: false,
      logs: true,
      ...opts.capabilities,
    };
  }

  setScenario(scenario: MockScenario): void {
    this.scenario = scenario;
  }

  /** Test helper: current credentials without secrets. */
  inspect(): MockDoorCredentialView[] {
    return [...this.store.values()].map((c) => {
      const view: Stored = { ...c };
      delete view.secretHash;
      return view;
    });
  }

  /** Test helper: simulate the guest opening the door. */
  simulateOpen(ctx: IntegrationContext, credentialId: string, at: IsoInstant): void {
    const c = this.get(ctx, credentialId);
    this.log.push({
      at,
      method: c.type === 'card' ? 'card' : 'code',
      credentialId,
      lockRef: c.lockRef,
      propertyId: ctx.propertyId,
    });
  }

  private fail(): void {
    const err = errorForScenario(this.scenario);
    if (err) throw err;
  }

  private get(ctx: IntegrationContext, credentialId: string): Stored {
    const c = this.store.get(credentialId);
    if (!c || c.propertyId !== ctx.propertyId) {
      throw new IntegrationError('NOT_FOUND', 'Door credential not found');
    }
    return c;
  }

  private hash(lockRef: string, code: string): string {
    return createHash('sha256')
      .update(this.salt)
      .update(lockRef)
      .update('\0')
      .update(code)
      .digest('hex');
  }

  private overlaps(a: Stored, from: IsoInstant, to: IsoInstant): boolean {
    return Date.parse(a.validFrom) < Date.parse(to) && Date.parse(from) < Date.parse(a.validTo);
  }

  async capabilities(ctx: IntegrationContext, lockRef: string): Promise<DoorLockCapabilities> {
    void ctx;
    void lockRef; // one capability profile per adapter instance
    this.fail();
    return { ...this.caps, codeLength: { ...this.caps.codeLength } };
  }

  async createCode(
    ctx: IntegrationContext,
    req: CreateDoorCodeRequest,
  ): Promise<CreateDoorCodeResult> {
    this.fail();
    assertCreateDoorCode(req);
    const secretHash = this.hash(req.lockRef, req.code);
    for (const c of this.store.values()) {
      if (
        c.propertyId === ctx.propertyId &&
        c.lockRef === req.lockRef &&
        !c.revoked &&
        c.secretHash === secretHash &&
        this.overlaps(c, req.validFrom, req.validTo)
      ) {
        throw new IntegrationError('CONFLICT', 'Code already active on this lock');
      }
    }
    const credentialId = `mock-lock-${++this.seq}`;
    this.store.set(credentialId, {
      credentialId,
      propertyId: ctx.propertyId,
      lockRef: req.lockRef,
      type: 'code',
      kind: req.kind,
      validFrom: req.validFrom,
      validTo: req.validTo,
      revoked: false,
      label: req.label,
      secretHash,
    });
    return { credentialId, installed: true };
  }

  async updateValidity(
    ctx: IntegrationContext,
    credentialId: string,
    validFrom: IsoInstant,
    validTo: IsoInstant,
  ): Promise<void> {
    this.fail();
    assertValidityWindow(validFrom, validTo);
    const c = this.get(ctx, credentialId);
    if (c.revoked) throw new IntegrationError('CONFLICT', 'Door credential already revoked');
    c.validFrom = validFrom;
    c.validTo = validTo;
  }

  /** Idempotent: revoking twice is fine (worker retries). */
  async revoke(ctx: IntegrationContext, credentialId: string): Promise<void> {
    this.fail();
    const c = this.get(ctx, credentialId);
    c.revoked = true;
    delete c.secretHash;
  }

  async addCard(
    ctx: IntegrationContext,
    req: AddKeyCardRequest,
  ): Promise<{ credentialId: string }> {
    this.fail();
    assertAddKeyCard(req);
    let active = 0;
    for (const c of this.store.values()) {
      if (
        c.propertyId === ctx.propertyId &&
        c.lockRef === req.lockRef &&
        c.type === 'card' &&
        !c.revoked &&
        this.overlaps(c, req.validFrom, req.validTo)
      ) {
        active++;
      }
    }
    if (active >= MAX_KEY_CARDS_PER_ROOM) {
      throw new IntegrationError(
        'CONFLICT',
        `At most ${MAX_KEY_CARDS_PER_ROOM} key cards per room`,
      );
    }
    const credentialId = `mock-card-${++this.seq}`;
    this.store.set(credentialId, {
      credentialId,
      propertyId: ctx.propertyId,
      lockRef: req.lockRef,
      type: 'card',
      kind: 'guest',
      validFrom: req.validFrom,
      validTo: req.validTo,
      revoked: false,
      label: req.label,
    });
    return { credentialId };
  }

  async accessLog(
    ctx: IntegrationContext,
    lockRef: string,
    since: IsoInstant,
  ): Promise<DoorAccessLogEntry[]> {
    this.fail();
    const t = Date.parse(isoInstant(since));
    return this.log
      .filter(
        (e) => e.propertyId === ctx.propertyId && e.lockRef === lockRef && Date.parse(e.at) >= t,
      )
      .map(({ at, method, credentialId }) =>
        credentialId === undefined ? { at, method } : { at, method, credentialId },
      );
  }

  async healthCheck(ctx: IntegrationContext): Promise<HealthStatus> {
    void ctx;
    const err = errorForScenario(this.scenario);
    return err
      ? { status: 'down', checkedAt: this.now(), detail: err.code }
      : { status: 'ok', checkedAt: this.now(), detail: 'mock' };
  }
}
