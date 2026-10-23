// SMTP adapter against a LOCAL fake SMTP server (127.0.0.1, no Internet, no real mailbox).
// Fake test values only: the mailbox, the app password and the recipients below do not exist.
import nodemailer from 'nodemailer';
import { afterEach, describe, expect, it } from 'vitest';
import { IntegrationError, isoInstant, type IntegrationContext } from '../contracts/common.js';
import type { NotificationMessage } from '../contracts/notification.js';
import { FakeSmtpServer } from './fake-smtp.test-support.js';
import {
  buildSmtpTransportOptions,
  createSmtpNotificationAdapter,
  mapSmtpError,
  smtpConfigFromCredentials,
  SmtpNotificationAdapter,
  type MailTransport,
} from './smtp.js';

const USER = 'desk-test@ottimo.test';
const PASS = 'fakeapppasswordx'; // 16 letters, test only
const ctx: IntegrationContext = {
  propertyId: 'p-1',
  credentialsRef: 'env:EMAIL_SMTP',
  requestId: 'r-1',
};
const now = () => isoInstant('2026-10-23T09:00:00+07:00');
const msg = (over: Partial<NotificationMessage> = {}): NotificationMessage => ({
  channel: 'email',
  purpose: 'security_alert',
  to: 'owner-test@example.test',
  templateId: 'mfa_recovery_code_used',
  locale: 'en',
  params: { audience: 'owner', staffName: 'Lan', occurredAt: '23/10/2026 09:00 (GMT+7)' },
  idempotencyKey: 'outbox-1:user-1',
  ...over,
});

let server: FakeSmtpServer | null = null;
afterEach(async () => {
  await server?.stop();
  server = null;
});

/** Plain-TCP transport to the fake server – the TLS rules of the real transport are tested separately. */
function localTransport(port: number, pass = PASS): MailTransport {
  return nodemailer.createTransport({
    host: '127.0.0.1',
    port,
    secure: false,
    ignoreTLS: true,
    auth: { user: USER, pass },
    logger: false,
    connectionTimeout: 3_000,
    greetingTimeout: 3_000,
    socketTimeout: 3_000,
  }) as unknown as MailTransport;
}

async function start(opts: Partial<ConstructorParameters<typeof FakeSmtpServer>[0]> = {}) {
  server = new FakeSmtpServer({ user: USER, pass: PASS, ...opts });
  return server.start();
}

function decodeQp(s: string): string {
  return Buffer.from(
    s.replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h: string) => `%${h}`),
    'latin1',
  ).toString('latin1');
}

describe('smtpConfigFromCredentials / buildSmtpTransportOptions', () => {
  it('defaults to smtp.gmail.com:465 implicit TLS; 587 = STARTTLS required; certificates verified', () => {
    const c = smtpConfigFromCredentials({ USER, PASSWORD: 'abcd efgh ijkl mnop' });
    expect(c).toMatchObject({ host: 'smtp.gmail.com', port: 465, from: USER, fromName: 'OTTIMO' });
    expect(c.password).toBe('abcdefghijklmnop'); // Google shows it in groups of 4
    const o465 = buildSmtpTransportOptions(c);
    expect(o465).toMatchObject({
      secure: true,
      requireTLS: false,
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2', servername: 'smtp.gmail.com' },
      logger: false,
      debug: false,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const o587 = buildSmtpTransportOptions(
      smtpConfigFromCredentials({ USER, PASSWORD: PASS, PORT: '587' }),
    );
    expect(o587).toMatchObject({ secure: false, requireTLS: true });
    expect(o587.tls.rejectUnauthorized).toBe(true);
  });

  it('refuses plaintext ports, a missing password, a bad user or From – naming variables only', () => {
    const bad: [Record<string, string>, RegExp][] = [
      [{ USER, PASSWORD: PASS, PORT: '25' }, /EMAIL_SMTP_PORT/],
      [{ USER, PASSWORD: PASS, PORT: '2525' }, /EMAIL_SMTP_PORT/],
      [{ USER, PASSWORD: '   ' }, /EMAIL_SMTP_PASSWORD_FILE/],
      [{ USER }, /EMAIL_SMTP_PASSWORD_FILE/],
      [{ USER: 'info', PASSWORD: PASS }, /EMAIL_SMTP_USER/],
      [{ USER, PASSWORD: PASS, HOST: 'smtp.gmail.com/evil' }, /EMAIL_SMTP_HOST/],
    ];
    for (const [creds, re] of bad) {
      const err = (() => {
        try {
          smtpConfigFromCredentials(creds);
        } catch (e) {
          return e as IntegrationError;
        }
        return null;
      })();
      expect(err).toBeInstanceOf(IntegrationError);
      expect(err?.code).toBe('CONFIG');
      expect(err?.message).toMatch(re);
      expect(err?.message).not.toContain(PASS);
    }
    expect(() => smtpConfigFromCredentials({ USER, PASSWORD: PASS }, { from: 'x' })).toThrow(
      /EMAIL_FROM/,
    );
  });
});

describe('SmtpNotificationAdapter over a local fake SMTP server', () => {
  it('authenticates and sends one bilingual, branded message with a deterministic Message-ID', async () => {
    const port = await start();
    const a = new SmtpNotificationAdapter({ transport: localTransport(port), from: USER, now });
    const r1 = await a.send(ctx, msg());
    expect(r1.status).toBe('sent');
    expect(server!.mails).toHaveLength(1);
    const m = server!.mails[0]!;
    expect(m.authUser).toBe(USER);
    expect(m.from).toBe(USER);
    expect(m.to).toEqual(['owner-test@example.test']);
    expect(m.data).toMatch(/^From: OTTIMO <desk-test@ottimo\.test>$/m);
    expect(m.data).toMatch(/^Auto-Submitted: auto-generated$/m);
    expect(m.data).toMatch(/multipart\/alternative/);
    expect(m.data).toMatch(/text\/plain/);
    expect(m.data).toMatch(/text\/html/);
    const body = decodeQp(m.data);
    expect(body).toContain('signed in to OTTIMO Desk with a recovery code');
    // Same idempotency key → same Message-ID (a retry is recognisable as the same notice).
    const r2 = await a.send(ctx, msg());
    expect(r2.providerMsgId).toBe(r1.providerMsgId);
    expect(r1.providerMsgId).toMatch(/^<[0-9a-f]{32}@ottimo\.test>$/);
    expect(server!.mails[1]!.data).toContain(`Message-ID: ${r1.providerMsgId}`);
    a.close();
  });

  it('wrong app password → AUTH, not retryable, no address or password in the error', async () => {
    const port = await start();
    const a = new SmtpNotificationAdapter({
      transport: localTransport(port, 'wrongwrongwrongx'),
      from: USER,
      now,
    });
    const err = (await a.send(ctx, msg()).catch((e: unknown) => e)) as IntegrationError;
    expect(err).toBeInstanceOf(IntegrationError);
    expect(err.code).toBe('AUTH');
    expect(err.retryable).toBe(false);
    expect(JSON.stringify({ m: err.message, p: err.providerMessage })).not.toMatch(
      /owner-test|wrongwrong|desk-test/,
    );
    expect(server!.mails).toHaveLength(0);
  });

  it('recipient refused (550) → INVALID_REQUEST, not retryable; the server text (with the address) is dropped', async () => {
    const port = await start({ rejectRcpt: ['owner-test@example.test'] });
    const a = new SmtpNotificationAdapter({ transport: localTransport(port), from: USER, now });
    const err = (await a.send(ctx, msg()).catch((e: unknown) => e)) as IntegrationError;
    expect(err.code).toBe('INVALID_REQUEST');
    expect(err.retryable).toBe(false);
    expect(`${err.message} ${err.providerMessage}`).not.toContain('owner-test');
  });

  it('temporary refusal (421) → RATE_LIMITED, retryable', async () => {
    const port = await start({ mailFromCode: 421 });
    const a = new SmtpNotificationAdapter({ transport: localTransport(port), from: USER, now });
    const err = (await a.send(ctx, msg()).catch((e: unknown) => e)) as IntegrationError;
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.retryable).toBe(true);
  });

  it('server down → retryable error; healthCheck reports down', async () => {
    const port = await start();
    await server!.stop();
    server = null;
    const a = new SmtpNotificationAdapter({ transport: localTransport(port), from: USER, now });
    const err = (await a.send(ctx, msg()).catch((e: unknown) => e)) as IntegrationError;
    expect(err).toBeInstanceOf(IntegrationError);
    expect(err.retryable).toBe(true);
    expect((await a.healthCheck(ctx)).status).toBe('down');
  });

  it('healthCheck ok against a live server', async () => {
    const port = await start();
    const a = new SmtpNotificationAdapter({ transport: localTransport(port), from: USER, now });
    expect(await a.healthCheck(ctx)).toEqual({ status: 'ok', checkedAt: now() });
  });

  it('STARTTLS required: a server without working TLS never sees AUTH or the message', async () => {
    const port = await start({ advertiseStartTls: true });
    const cfg = smtpConfigFromCredentials({ USER, PASSWORD: PASS, PORT: '587', HOST: 'localhost' });
    const opts = { ...buildSmtpTransportOptions(cfg), host: '127.0.0.1', port };
    const a = new SmtpNotificationAdapter({
      transport: nodemailer.createTransport(opts) as unknown as MailTransport,
      from: USER,
      now,
    });
    await expect(a.send(ctx, msg())).rejects.toBeInstanceOf(IntegrationError);
    expect(server!.commands).not.toContain('AUTH');
    expect(server!.mails).toHaveLength(0);
  });

  it('refuses other channels, bad recipients, attachments and unknown templates before connecting', async () => {
    const sent: unknown[] = [];
    const t: MailTransport = {
      sendMail: async (m) => {
        sent.push(m);
        return {};
      },
      verify: async () => true,
    };
    const a = new SmtpNotificationAdapter({ transport: t, from: USER, now });
    await expect(a.send(ctx, msg({ channel: 'zalo_zns' }))).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    await expect(a.send(ctx, msg({ to: 'a@b' }))).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    await expect(a.send(ctx, msg({ to: 'x@y.test\r\nBcc: z@y.test' }))).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    await expect(
      a.send(
        ctx,
        msg({ attachments: [{ name: 'a', mime: 'text/plain', data: new Uint8Array(1) }] }),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    await expect(a.send(ctx, msg({ templateId: 'booking_confirmed' }))).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(sent).toHaveLength(0);
  });

  it('factory builds the real TLS transport from credentials (no connection made)', () => {
    const a = createSmtpNotificationAdapter({ USER, PASSWORD: PASS }, { now });
    expect(a).toBeInstanceOf(SmtpNotificationAdapter);
    a.close();
  });

  it('mapSmtpError keeps only code and status number', () => {
    const e = mapSmtpError({
      code: 'EENVELOPE',
      responseCode: 550,
      response: '550 x@y.test unknown',
    });
    expect(e.code).toBe('INVALID_REQUEST');
    expect(e.providerMessage).toBe('EENVELOPE:550');
    expect(mapSmtpError({ code: 'ETIMEDOUT' }).code).toBe('TIMEOUT');
    expect(mapSmtpError({ code: 'ECONNECTION' }).retryable).toBe(true);
    expect(mapSmtpError({ code: 'ETLS' }).code).toBe('CONFIG');
  });
});
