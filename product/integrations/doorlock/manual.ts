// DoorLockAdapter 'manual' (README 3.4) – default in R2 (DOORLOCK_PROVIDER=manual). Owner: INT.
// Nothing is sent to the lock: staff install/remove the code in the TTLock app. installed=false tells the
// core (BE-A) to create the task "Cài mã trên app khóa"; after revoke/updateValidity the core creates
// "Xóa mã căn X" / "Sửa hạn mã căn X" (SEC D3). The adapter keeps no state and never stores the code.
import { randomUUID } from 'node:crypto';
import {
  isoInstant,
  IntegrationError,
  type HealthStatus,
  type IntegrationContext,
  type IsoInstant,
} from '../contracts/common.js';
import type {
  AddKeyCardRequest,
  CreateDoorCodeRequest,
  CreateDoorCodeResult,
  DoorLockAdapter,
  DoorLockCapabilities,
} from '../contracts/doorlock.js';
import { assertAddKeyCard, assertCreateDoorCode, assertValidityWindow } from './access.js';

export interface ManualDoorLockOptions {
  /** What the physical lock supports (shown to staff). Default: TTLock keypad + card, no remote. */
  capabilities?: Partial<DoorLockCapabilities>;
  newId?: () => string;
  now?: () => IsoInstant;
}

export const MANUAL_DEFAULT_CAPABILITIES: DoorLockCapabilities = {
  remote: false,
  customCode: true,
  codeLength: { min: 6, max: 10 },
  card: true,
  fingerprint: false,
  logs: false,
};

export class ManualDoorLockAdapter implements DoorLockAdapter {
  private readonly caps: DoorLockCapabilities;
  private readonly newId: () => string;
  private readonly now: () => IsoInstant;

  constructor(opts: ManualDoorLockOptions = {}) {
    this.caps = { ...MANUAL_DEFAULT_CAPABILITIES, ...opts.capabilities };
    this.newId = opts.newId ?? (() => randomUUID());
    this.now = opts.now ?? (() => isoInstant('2026-10-16T09:00:00+07:00'));
  }

  async capabilities(ctx: IntegrationContext, lockRef: string): Promise<DoorLockCapabilities> {
    void ctx;
    void lockRef; // one capability profile per adapter instance
    return { ...this.caps, codeLength: { ...this.caps.codeLength } };
  }

  async createCode(
    _ctx: IntegrationContext,
    req: CreateDoorCodeRequest,
  ): Promise<CreateDoorCodeResult> {
    assertCreateDoorCode(req);
    const { min, max } = this.caps.codeLength;
    if (req.code.length < min || req.code.length > max) {
      throw new IntegrationError(
        'INVALID_REQUEST',
        `Door code length must be ${min}–${max} for this lock`,
      );
    }
    return { credentialId: `manual-${this.newId()}`, installed: false };
  }

  async updateValidity(
    _ctx: IntegrationContext,
    credentialId: string,
    validFrom: IsoInstant,
    validTo: IsoInstant,
  ): Promise<void> {
    if (!credentialId) throw new IntegrationError('INVALID_REQUEST', 'credentialId is required');
    assertValidityWindow(validFrom, validTo);
  }

  async revoke(_ctx: IntegrationContext, credentialId: string): Promise<void> {
    if (!credentialId) throw new IntegrationError('INVALID_REQUEST', 'credentialId is required');
  }

  async addCard(
    _ctx: IntegrationContext,
    req: AddKeyCardRequest,
  ): Promise<{ credentialId: string }> {
    if (!this.caps.card)
      throw new IntegrationError('INVALID_REQUEST', 'This lock has no card reader');
    assertAddKeyCard(req);
    return { credentialId: `manual-card-${this.newId()}` };
  }

  async healthCheck(ctx: IntegrationContext): Promise<HealthStatus> {
    void ctx;
    return { status: 'ok', checkedAt: this.now(), detail: 'manual' };
  }
}
