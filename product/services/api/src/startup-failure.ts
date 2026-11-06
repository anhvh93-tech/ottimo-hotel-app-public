/**
 * The api's last stderr line when start-up fails (SEC FB-R5-SEC-BE-D1-01). Plain text for the operator reading
 * `docker logs`, but a message is printed only for the errors whose messages this codebase writes without values:
 * - ConfigError (config.ts: variable names, APP_ENV, the allowed values),
 * - StartupCheckError (db/startup-checks.ts: role and grant checks),
 * - KeyringError (crypto keyring: variable names, sizes, versions).
 * Any other Error (a `pg` connection error, a Nest module failing to build, a third-party library – whose message may
 * hold a connection string or a key path) prints its class name and safe code only (`errorTag`, like the worker –
 * SEC S-1); a thrown non-Error prints `startup failed`.
 */
import { ConfigError } from './config';
import { StartupCheckError } from './db/startup-checks';
import { KeyringError } from './modules/crypto/public/keyring-error';
import { errorTag } from './shared/log-line';

export function startupFailureText(err: unknown): string {
  if (!(err instanceof Error)) return 'startup failed';
  if (
    err instanceof ConfigError ||
    err instanceof StartupCheckError ||
    err instanceof KeyringError
  ) {
    return `${err.name}: ${err.message}`;
  }
  const tag = errorTag(err);
  return tag.code ? `${tag.err} (${tag.code})` : tag.err;
}
