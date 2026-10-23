// INT R3 – worker e-mail adapter selection (no network, no DB). Fake values only.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  MockNotificationAdapter,
  SmtpNotificationAdapter,
} from '@ottimo/integrations/notification';
import { describe, expect, it } from 'vitest';
import { resolveFileSecrets } from '../src/config';
import { createEmailAdapter } from '../src/jobs/email-adapter';

const clock = { now: () => new Date('2026-10-23T02:00:00Z') };

function secretFile(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'int-email-'));
  const f = join(dir, 'email_smtp_password');
  writeFileSync(f, content, { mode: 0o400 });
  return f;
}

describe('createEmailAdapter (worker)', () => {
  it('off → no adapter; mock → mock (outside production)', async () => {
    expect((await createEmailAdapter({}, 'dev', clock)).adapter).toBeNull();
    expect(
      (await createEmailAdapter({ EMAIL_PROVIDER: 'off' }, 'staging', clock)).adapter,
    ).toBeNull();
    const m = await createEmailAdapter({ EMAIL_PROVIDER: 'mock' }, 'staging', clock);
    expect(m.adapter).toBeInstanceOf(MockNotificationAdapter);
  });

  it('production refuses mock / off / unset – the worker does not start', async () => {
    for (const v of ['mock', 'off', '']) {
      await expect(createEmailAdapter({ EMAIL_PROVIDER: v }, 'production', clock)).rejects.toThrow(
        /EMAIL_PROVIDER must be smtp in production/,
      );
    }
  });

  it('smtp reads the app password from EMAIL_SMTP_PASSWORD_FILE (as resolved by the bootstrap)', async () => {
    const env = resolveFileSecrets({
      EMAIL_PROVIDER: 'smtp',
      EMAIL_SMTP_USER: 'desk-test@ottimo.test',
      EMAIL_SMTP_PASSWORD_FILE: secretFile('abcd efgh ijkl mnop\n'),
    });
    const r = await createEmailAdapter(env, 'production', clock);
    expect(r.provider).toBe('smtp');
    expect(r.adapter).toBeInstanceOf(SmtpNotificationAdapter);
    (r.adapter as SmtpNotificationAdapter).close();
  });

  it('smtp with an empty secret file or no user → CONFIG error naming variables only', async () => {
    const empty = resolveFileSecrets({
      EMAIL_PROVIDER: 'smtp',
      EMAIL_SMTP_USER: 'desk-test@ottimo.test',
      EMAIL_SMTP_PASSWORD_FILE: secretFile(''),
    });
    await expect(createEmailAdapter(empty, 'production', clock)).rejects.toThrow(
      /EMAIL_SMTP_PASSWORD_FILE is missing or empty/,
    );
    const noUser = resolveFileSecrets({
      EMAIL_PROVIDER: 'smtp',
      EMAIL_SMTP_PASSWORD_FILE: secretFile('abcdefghijklmnop'),
    });
    const err = await createEmailAdapter(noUser, 'production', clock).catch((e: unknown) => e);
    expect(String(err)).toMatch(/EMAIL_SMTP_USER/);
    expect(String(err)).not.toContain('abcdefghijklmnop');
  });
});
