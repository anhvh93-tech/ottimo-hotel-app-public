// SMTP e-mail adapter – Google Workspace from info@ottimo.vn (INV decision 23/10/2026, replaces Amazon SES for
// v1.0). Owner: INT. Library: nodemailer (pinned exact in package.json). Two modes (`EMAIL_SMTP_MODE`):
// - `relay` (DEFAULT – SEC FB-R3-SEC-INT-EMAIL-01 option A): Google Workspace SMTP relay
//   `smtp-relay.gmail.com:587`, authenticated by the VPS IP address in the Admin console (allowed senders =
//   addresses in our domains, TLS required). NO password on the server; a leftover password file is refused.
// - `app_password` (fallback, warned at startup): `smtp.gmail.com` + the mailbox app password from the secret
//   file EMAIL_SMTP_PASSWORD_FILE. That password opens the WHOLE mailbox (IMAP) and bypasses 2-step verification.
// Settings come ONLY from the CredentialProvider (`env:EMAIL_SMTP` → MODE, HOST, PORT, USER, PASSWORD, HELO).
// TLS is mandatory in both modes: 465 = implicit TLS, 587 = STARTTLS with requireTLS; certificates verified,
// TLS >= 1.2. Nothing here logs: errors carry codes and SMTP status numbers only – never an address, the
// subject, the body or the server's reply text (it may echo the address).
import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import {
  IntegrationError,
  type HealthStatus,
  type IntegrationContext,
  type IsoInstant,
} from '../contracts/common.js';
import type {
  NotificationAdapter,
  NotificationMessage,
  NotificationResult,
} from '../contracts/notification.js';
import { renderStaffEmail, type RenderedEmail } from './email-templates.js';

export const SMTP_MODES = ['relay', 'app_password'] as const;
export type SmtpMode = (typeof SMTP_MODES)[number];
export const SMTP_DEFAULTS: Readonly<Record<SmtpMode, { host: string; port: 465 | 587 }>> = {
  relay: { host: 'smtp-relay.gmail.com', port: 587 },
  app_password: { host: 'smtp.gmail.com', port: 465 },
};
const ALLOWED_PORTS = [465, 587] as const;
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;
const HOST_RE = /^[a-z0-9.-]+$/i;

export interface SmtpConfig {
  mode: SmtpMode;
  host: string;
  port: 465 | 587;
  /** app_password only (the relay authenticates by IP). */
  auth: { user: string; pass: string } | null;
  /** Envelope + From. relay: an address of our domain; app_password: the mailbox or a verified alias. */
  from: string;
  fromName: string;
  /** EHLO name – Google asks relay clients for a real domain, not "localhost" (default: the From domain). */
  helo: string;
}

/** Minimal transport surface (nodemailer Transporter) – lets tests inject a transport to a local fake server. */
export interface MailTransport {
  sendMail(mail: {
    from: { name: string; address: string };
    to: string;
    subject: string;
    text: string;
    html: string;
    messageId: string;
    headers: Record<string, string>;
  }): Promise<{ messageId?: string; accepted?: unknown[]; rejected?: unknown[] }>;
  verify(): Promise<unknown>;
  close?(): void;
}

export function isEmailAddress(v: string): boolean {
  return v.length <= 254 && EMAIL_RE.test(v);
}

/** EMAIL_SMTP_MODE, default `relay` (SEC EMAIL-01 A). */
export function smtpModeOf(creds: Readonly<Record<string, string>>): SmtpMode {
  const raw = (creds.MODE ?? '').trim() || 'relay';
  if (!(SMTP_MODES as readonly string[]).includes(raw)) {
    throw new IntegrationError('CONFIG', `EMAIL_SMTP_MODE must be one of ${SMTP_MODES.join('|')}`);
  }
  return raw as SmtpMode;
}

/**
 * Settings map from `env:EMAIL_SMTP` (+ EMAIL_FROM passed separately). Error messages name variables only.
 */
export function smtpConfigFromCredentials(
  creds: Readonly<Record<string, string>>,
  opts: { from?: string; fromName?: string } = {},
): SmtpConfig {
  const mode = smtpModeOf(creds);
  const def = SMTP_DEFAULTS[mode];
  const host = (creds.HOST ?? '').trim() || def.host;
  const portRaw = (creds.PORT ?? '').trim();
  const port = portRaw === '' ? def.port : Number(portRaw);
  if (!(ALLOWED_PORTS as readonly number[]).includes(port)) {
    throw new IntegrationError('CONFIG', 'EMAIL_SMTP_PORT must be 465 (TLS) or 587 (STARTTLS)');
  }
  if (!HOST_RE.test(host)) throw new IntegrationError('CONFIG', 'EMAIL_SMTP_HOST is invalid');
  const user = (creds.USER ?? '').trim();
  // Google shows app passwords in groups of 4 ("abcd efgh ijkl mnop"): spaces are not part of it.
  const password = (creds.PASSWORD ?? '').replace(/\s+/g, '');
  let auth: SmtpConfig['auth'] = null;
  if (mode === 'app_password') {
    if (!isEmailAddress(user)) {
      throw new IntegrationError('CONFIG', 'EMAIL_SMTP_USER must be the full mailbox address');
    }
    if (password === '') {
      throw new IntegrationError('CONFIG', 'EMAIL_SMTP_PASSWORD_FILE is missing or empty');
    }
    auth = { user, pass: password };
  } else if (password !== '') {
    // A mailbox password left on the server keeps exactly the risk relay mode removes (SEC EMAIL-01).
    throw new IntegrationError(
      'CONFIG',
      'EMAIL_SMTP_MODE=relay uses no password – empty EMAIL_SMTP_PASSWORD_FILE (init-secrets.sh --reset-email-password, then Enter)',
    );
  }
  const from = (opts.from ?? '').trim() || user;
  if (!isEmailAddress(from)) {
    throw new IntegrationError(
      'CONFIG',
      mode === 'relay'
        ? 'EMAIL_FROM is required in relay mode (an address of your domain)'
        : 'EMAIL_FROM is invalid',
    );
  }
  const helo = (creds.HELO ?? '').trim() || (from.split('@')[1] as string);
  if (!HOST_RE.test(helo) || !helo.includes('.')) {
    throw new IntegrationError('CONFIG', 'EMAIL_SMTP_HELO must be a domain name');
  }
  return {
    mode,
    host,
    port: port as 465 | 587,
    auth,
    from,
    fromName: (opts.fromName ?? '').trim() || 'OTTIMO',
    helo,
  };
}

/** nodemailer options – exported so the TLS rules are unit-tested (no network). */
export function buildSmtpTransportOptions(cfg: SmtpConfig) {
  return {
    host: cfg.host,
    port: cfg.port,
    name: cfg.helo,
    secure: cfg.port === 465, // implicit TLS
    requireTLS: cfg.port === 587, // STARTTLS or fail – never plaintext AUTH or mail
    ...(cfg.auth ? { auth: { user: cfg.auth.user, pass: cfg.auth.pass } } : {}),
    tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' as const, servername: cfg.host },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    // No logging of SMTP traffic (addresses, message data); no file/URL reads from message fields.
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

/** Real transport (production/staging). */
export function createSmtpTransport(cfg: SmtpConfig): MailTransport {
  return nodemailer.createTransport(buildSmtpTransportOptions(cfg)) as unknown as MailTransport;
}

interface SmtpLikeError {
  code?: unknown;
  responseCode?: unknown;
  response?: unknown;
}

/** nodemailer error → IntegrationError without any provider text (it may contain the address). */
export function mapSmtpError(err: unknown): IntegrationError {
  const e = (err ?? {}) as SmtpLikeError;
  const code = typeof e.code === 'string' ? e.code : 'UNKNOWN';
  const status = typeof e.responseCode === 'number' ? e.responseCode : undefined;
  // Only the enhanced status code (e.g. 5.7.0) is taken from the reply text – never the text itself.
  const enhanced =
    typeof e.response === 'string'
      ? (/\b([245]\.\d{1,3}\.\d{1,3})\b/.exec(e.response)?.[1] ?? '')
      : '';
  const tag = [code, status === undefined ? '' : String(status), enhanced]
    .filter((x) => x !== '')
    .join(':');
  // 5.7.x = policy / authentication: wrong app password, or the relay refused us (VPS IP not in the Admin console
  // list, sender outside our domain, no TLS). A configuration problem, not a bad recipient → the row retries.
  if (
    code === 'EAUTH' ||
    code === 'ENOAUTH' ||
    status === 535 ||
    status === 534 ||
    enhanced.startsWith('5.7.')
  ) {
    return new IntegrationError('AUTH', `SMTP authentication/policy refusal (${tag})`, {
      providerMessage: tag,
    });
  }
  if (code === 'ETIMEDOUT')
    return new IntegrationError('TIMEOUT', `SMTP timeout (${tag})`, { providerMessage: tag });
  if (status === 421 || status === 450 || status === 451 || status === 452 || status === 454) {
    return new IntegrationError('RATE_LIMITED', `SMTP temporary refusal (${tag})`, {
      providerMessage: tag,
      retryAfterMs: 15 * 60_000,
    });
  }
  if (code === 'EENVELOPE' || (status !== undefined && status >= 550 && status < 560)) {
    // Recipient refused for good: retrying will not help.
    return new IntegrationError('INVALID_REQUEST', `SMTP refused the envelope (${tag})`, {
      providerMessage: tag,
    });
  }
  if (code === 'ETLS' || code === 'ECONFIG') {
    return new IntegrationError('CONFIG', `SMTP TLS/configuration error (${tag})`, {
      providerMessage: tag,
    });
  }
  return new IntegrationError('UNAVAILABLE', `SMTP unavailable (${tag})`, { providerMessage: tag });
}

export interface SmtpAdapterOptions {
  transport: MailTransport;
  from: string;
  fromName?: string;
  mode?: SmtpMode;
  /** Injected clock (ADR-008: no new Date() in integrations). */
  now: () => IsoInstant;
  render?: (templateId: string, params: Readonly<Record<string, string>>) => RenderedEmail;
}

export class SmtpNotificationAdapter implements NotificationAdapter {
  /** `app_password` = wider-scoped credential on the server (SEC EMAIL-01) – the worker warns at startup. */
  readonly mode: SmtpMode;
  private readonly transport: MailTransport;
  private readonly from: { name: string; address: string };
  private readonly domain: string;
  private readonly now: () => IsoInstant;
  private readonly render: SmtpAdapterOptions['render'] & {};

  constructor(opts: SmtpAdapterOptions) {
    if (!isEmailAddress(opts.from)) throw new IntegrationError('CONFIG', 'EMAIL_FROM is invalid');
    this.mode = opts.mode ?? 'relay';
    this.transport = opts.transport;
    this.from = { name: opts.fromName ?? 'OTTIMO', address: opts.from };
    this.domain = opts.from.split('@')[1] as string;
    this.now = opts.now;
    this.render = opts.render ?? renderStaffEmail;
  }

  async send(ctx: IntegrationContext, msg: NotificationMessage): Promise<NotificationResult> {
    void ctx;
    if (msg.channel !== 'email') {
      throw new IntegrationError('INVALID_REQUEST', 'SMTP adapter only sends the email channel');
    }
    if (!isEmailAddress(msg.to)) throw new IntegrationError('INVALID_REQUEST', 'Invalid recipient');
    if (msg.attachments && msg.attachments.length > 0) {
      throw new IntegrationError('INVALID_REQUEST', 'Attachments are not supported');
    }
    const mail = this.render(msg.templateId, msg.params);
    // Deterministic Message-ID per idempotency key: a retry after an unclear failure carries the same id, so
    // mail clients thread or drop the duplicate instead of showing two different notices.
    const hash = createHash('sha256').update(msg.idempotencyKey).digest('hex').slice(0, 32);
    const messageId = `<${hash}@${this.domain}>`;
    try {
      const info = await this.transport.sendMail({
        from: this.from,
        to: msg.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        messageId,
        headers: { 'Auto-Submitted': 'auto-generated', 'X-Auto-Response-Suppress': 'All' },
      });
      if (Array.isArray(info.rejected) && info.rejected.length > 0) {
        throw new IntegrationError('INVALID_REQUEST', 'SMTP refused the recipient');
      }
      return { providerMsgId: messageId, status: 'sent' };
    } catch (err) {
      if (err instanceof IntegrationError) throw err;
      throw mapSmtpError(err);
    }
  }

  async healthCheck(ctx: IntegrationContext): Promise<HealthStatus> {
    void ctx;
    try {
      await this.transport.verify();
      return { status: 'ok', checkedAt: this.now() };
    } catch (err) {
      const e = mapSmtpError(err);
      return { status: 'down', checkedAt: this.now(), detail: e.providerMessage ?? e.code };
    }
  }

  close(): void {
    this.transport.close?.();
  }
}

/** Production factory: settings from the provider, real TLS transport. */
export function createSmtpNotificationAdapter(
  creds: Readonly<Record<string, string>>,
  opts: { from?: string; fromName?: string; now: () => IsoInstant },
): SmtpNotificationAdapter {
  const cfg = smtpConfigFromCredentials(creds, opts);
  return new SmtpNotificationAdapter({
    transport: createSmtpTransport(cfg),
    from: cfg.from,
    fromName: cfg.fromName,
    mode: cfg.mode,
    now: opts.now,
  });
}
