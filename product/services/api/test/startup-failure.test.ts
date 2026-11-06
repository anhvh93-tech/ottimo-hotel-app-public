/**
 * SEC FB-R5-SEC-BE-D1-01: the api's start-up failure line prints a message only for ConfigError, StartupCheckError,
 * KeyringError; any other error prints its class name and safe code, a non-Error `startup failed`; main.ts uses it.
 * Fake values only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigError } from '../src/config';
import { StartupCheckError } from '../src/db/startup-checks';
import { KeyringError } from '../src/modules/crypto/public/keyring-error';
import { startupFailureText } from '../src/startup-failure';

// What a library message may echo (a host, a key file path) – fake.
const FAKE_URL = 'db.example.test:5432 /run/secrets/fake_key_0000';

describe('startupFailureText (SEC D1-01)', () => {
  it('our own start-up errors keep their message (written without values)', () => {
    expect(startupFailureText(new ConfigError('DATABASE_URL is required'))).toBe(
      'ConfigError: Invalid configuration: DATABASE_URL is required',
    );
    expect(startupFailureText(new StartupCheckError('ottimo_app must not own tables'))).toBe(
      'StartupCheckError: ottimo_app must not own tables',
    );
    expect(startupFailureText(new KeyringError('ID_HASH_KEY is too short'))).toBe(
      'KeyringError: Invalid crypto configuration: ID_HASH_KEY is too short',
    );
  });

  it('any other error: class name and safe code only, never the message', () => {
    const pg = Object.assign(new Error(`connect ECONNREFUSED ${FAKE_URL}`), {
      code: 'ECONNREFUSED',
    });
    expect(startupFailureText(pg)).toBe('Error (ECONNREFUSED)');
    expect(startupFailureText(new TypeError(`cannot read ${FAKE_URL}`))).toBe('TypeError');
    // A code that is not a short token is dropped (errorTag).
    const odd = Object.assign(new Error('x'), { code: `bad code ${FAKE_URL}` });
    expect(startupFailureText(odd)).toBe('Error');
    class NestInitError extends Error {
      constructor() {
        super(`module failed with ${FAKE_URL}`);
        this.name = 'NestInitError';
      }
    }
    expect(startupFailureText(new NestInitError())).toBe('NestInitError');
    for (const e of [pg, odd, new NestInitError()]) {
      expect(startupFailureText(e)).not.toContain('fake_key_0000');
    }
  });

  it('a thrown non-Error prints a fixed text', () => {
    expect(startupFailureText(FAKE_URL)).toBe('startup failed');
    expect(startupFailureText({ message: FAKE_URL })).toBe('startup failed');
    expect(startupFailureText(undefined)).toBe('startup failed');
  });

  it('main.ts prints the start-up failure through it (the one console call of the file)', () => {
    const main = readFileSync(join(__dirname, '../src/main.ts'), 'utf8');
    expect(main).toMatch(/console\.error\(startupFailureText\(err\)\);/);
    expect(main.match(/console\./g)).toHaveLength(1);
    expect(main).not.toMatch(/err\.message/);
  });
});
