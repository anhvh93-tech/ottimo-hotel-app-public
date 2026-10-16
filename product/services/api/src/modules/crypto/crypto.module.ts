/**
 * crypto module (BE-C Sprint 3; ADR-013, SEC s3-checklist B1): CryptoService (envelope encryption with
 * DEK per record, KEK from the environment, blind index), C3AccessGate (step-up window, SR-RL-06, c3 log)
 * and the stepUp route. Global: registration, guest-portal, files and BE-B's refund account use the same
 * single instance – nobody else may read `data_key` or the KEK (test/crypto-boundary.test.ts).
 * Also binds BE-A's FD_CHILD_DATA_PORT and BE-B's REFUND_ACCOUNT_CIPHER to CryptoService.
 */
import { type DynamicModule, Global, Module } from '@nestjs/common';
import { EnvelopeCryptoService, KEYRING } from './internal/envelope-crypto.service';
import { type Keyring, keyringFromEnv } from './internal/keyring';
import { StepUpController } from './internal/step-up.controller';
import { FD_CHILD_DATA_PORT } from '../frontdesk/public/ports';
import { REFUND_ACCOUNT_CIPHER } from '../payments/public/refund-account-cipher';
import { C3AccessGate } from './public/c3-access-gate';
import { CryptoService } from './public/crypto.service';
import { ChildDataCipher, RefundAccountCipherAdapter } from './public/port-adapters';

export interface CryptoModuleOptions {
  /** Resolved environment (bootstrap: `X_FILE` secrets already read). Default: process.env. */
  env?: NodeJS.ProcessEnv;
  /** Explicit key material (tests, rotation drills). Takes precedence over `env`. */
  keyring?: Keyring;
}

@Global()
@Module({})
export class CryptoModule {
  static register(options: CryptoModuleOptions = {}): DynamicModule {
    const keyring = options.keyring ?? keyringFromEnv(options.env ?? process.env);
    return {
      module: CryptoModule,
      controllers: [StepUpController],
      providers: [
        { provide: KEYRING, useValue: keyring },
        EnvelopeCryptoService,
        { provide: CryptoService, useExisting: EnvelopeCryptoService },
        C3AccessGate,
        // Consumer ports of BE-A (child data, D09) and BE-B (refund account, D15) – ARC 4.3.
        ChildDataCipher,
        { provide: FD_CHILD_DATA_PORT, useExisting: ChildDataCipher },
        RefundAccountCipherAdapter,
        { provide: REFUND_ACCOUNT_CIPHER, useExisting: RefundAccountCipherAdapter },
      ],
      exports: [CryptoService, C3AccessGate, FD_CHILD_DATA_PORT, REFUND_ACCOUNT_CIPHER],
    };
  }
}
