/**
 * Per-key hooks of `setParameter` for keys whose rules live in another module (ADR-001: platform never imports
 * the feature module) – BE-D R3 Sprint 1, first user US-155 `public_booking_requests_enabled`
 * (SEC ARC-17, C-3 (e): turning the form ON needs the published privacy notices + the form signing key →
 * 422 PUBLIC_FORM_NOT_READY with `missing[]`; a change → `public_booking_toggled` to OWN + MGR).
 * Both hooks run in the setParameter transaction: `before` may throw (nothing is written), `after` runs once
 * the new value is stored.
 */
import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';

export interface ParameterHook {
  /** `roles` of the caller: a hook must not answer for a caller the key refuses anyway (403 comes first). */
  before?(tx: Tx, value: unknown, roles: readonly string[]): Promise<void>;
  after?(tx: Tx, value: unknown): Promise<void>;
}

@Injectable()
export class ParameterHooks {
  private readonly hooks = new Map<string, ParameterHook>();

  register(key: string, hook: ParameterHook): void {
    if (this.hooks.has(key)) throw new Error(`parameter hook for ${key} registered twice`);
    this.hooks.set(key, hook);
  }

  get(key: string): ParameterHook | undefined {
    return this.hooks.get(key);
  }
}
