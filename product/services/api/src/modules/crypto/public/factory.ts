/**
 * Plain-object composition of the crypto module for the worker process (no Nest container there –
 * worker.ts). Same classes as CryptoModule; key material read once from the resolved environment.
 */
import type { Clock } from '../../../clock';
import { EnvelopeCryptoService } from '../internal/envelope-crypto.service';
import { keyringFromEnv } from '../internal/keyring';
import type { CryptoService } from './crypto.service';

export function cryptoServiceFromEnv(env: NodeJS.ProcessEnv, clock: Clock): CryptoService {
  return new EnvelopeCryptoService(keyringFromEnv(env), clock);
}
