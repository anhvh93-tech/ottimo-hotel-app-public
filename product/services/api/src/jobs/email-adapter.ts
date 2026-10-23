/**
 * Builds the e-mail adapter of the worker from the resolved environment (INT R3, INV 23/10/2026: Google Workspace
 * SMTP). EMAIL_PROVIDER: off (nothing leaves, rows stay pending) | mock (dev/staging) | smtp.
 * smtp: EMAIL_SMTP_MODE=relay (default – smtp-relay.gmail.com, authenticated by the VPS IP, no password; SEC
 * FB-R3-SEC-INT-EMAIL-01 A) | app_password (fallback: smtp.gmail.com + EMAIL_SMTP_PASSWORD_FILE, warned).
 * production accepts smtp only (assertSafeConfig already refused anything else; checked again here so the worker can
 * never run a mock in production). A bad smtp configuration (app_password without its file, relay with a leftover
 * password, no EMAIL_FROM…) → IntegrationError CONFIG → the worker refuses to start.
 */
import { EnvCredentialProvider } from '@ottimo/integrations/common';
import type { NotificationAdapter } from '@ottimo/integrations/contracts';
import { IntegrationError, isoInstant } from '@ottimo/integrations/contracts';
import {
  createSmtpNotificationAdapter,
  MockNotificationAdapter,
  type SmtpMode,
} from '@ottimo/integrations/notification';
import type { Clock } from '../clock';

export type EmailProvider = 'off' | 'mock' | 'smtp';

export async function createEmailAdapter(
  env: NodeJS.ProcessEnv,
  appEnv: string,
  clock: Clock,
): Promise<{
  provider: EmailProvider;
  adapter: NotificationAdapter | null;
  /** smtp only: `relay` (default, by VPS IP) or `app_password` (fallback – the worker warns). */
  smtpMode?: SmtpMode;
}> {
  const provider = (env.EMAIL_PROVIDER ?? '').trim() || 'off';
  if (appEnv === 'production' && provider !== 'smtp') {
    throw new IntegrationError('CONFIG', 'EMAIL_PROVIDER must be smtp in production');
  }
  const now = () => isoInstant(clock.now().toISOString());
  switch (provider) {
    case 'off':
      return { provider, adapter: null };
    case 'mock':
      return { provider, adapter: new MockNotificationAdapter({ now }) };
    case 'smtp': {
      // Relay with every default needs no EMAIL_SMTP_* variable (the provider refuses an empty group).
      const hasSmtpVars = Object.entries(env).some(
        ([k, v]) => k.startsWith('EMAIL_SMTP_') && (v ?? '').trim() !== '',
      );
      const creds = hasSmtpVars ? await new EnvCredentialProvider(env).get('env:EMAIL_SMTP') : {};
      const adapter = createSmtpNotificationAdapter(creds, {
        ...(env.EMAIL_FROM ? { from: env.EMAIL_FROM } : {}),
        now,
      });
      return { provider, adapter, smtpMode: adapter.mode };
    }
    default:
      throw new IntegrationError('CONFIG', 'EMAIL_PROVIDER must be one of off|mock|smtp');
  }
}
