/**
 * Builds the e-mail adapter of the worker from the resolved environment (INT R3, INV 23/10/2026: Google Workspace
 * SMTP). EMAIL_PROVIDER: off (nothing leaves, rows stay pending) | mock (dev/staging) | smtp.
 * production accepts smtp only (assertSafeConfig already refused anything else; checked again here so the worker can
 * never run a mock in production). smtp credentials: `env:EMAIL_SMTP` → EMAIL_SMTP_HOST/_PORT/_USER and the app
 * password from EMAIL_SMTP_PASSWORD_FILE; missing/empty → IntegrationError CONFIG → the worker refuses to start.
 */
import { EnvCredentialProvider } from '@ottimo/integrations/common';
import type { NotificationAdapter } from '@ottimo/integrations/contracts';
import { IntegrationError, isoInstant } from '@ottimo/integrations/contracts';
import {
  createSmtpNotificationAdapter,
  MockNotificationAdapter,
} from '@ottimo/integrations/notification';
import type { Clock } from '../clock';

export type EmailProvider = 'off' | 'mock' | 'smtp';

export async function createEmailAdapter(
  env: NodeJS.ProcessEnv,
  appEnv: string,
  clock: Clock,
): Promise<{ provider: EmailProvider; adapter: NotificationAdapter | null }> {
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
      const creds = await new EnvCredentialProvider(env).get('env:EMAIL_SMTP');
      const adapter = createSmtpNotificationAdapter(creds, {
        ...(env.EMAIL_FROM ? { from: env.EMAIL_FROM } : {}),
        now,
      });
      return { provider, adapter };
    }
    default:
      throw new IntegrationError('CONFIG', 'EMAIL_PROVIDER must be one of off|mock|smtp');
  }
}
