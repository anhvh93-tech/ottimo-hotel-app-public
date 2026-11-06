import 'reflect-metadata';
import type { DynamicModule, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { createRuntime } from './bootstrap';
import { PgPinger } from './db/pinger';
import { createHttpAdapter } from './http';
import { featureModules } from './modules/feature-modules';
import { CSRF_VERIFIER } from './shared/http/csrf';
import { writeLogLine } from './shared/log-line';
import { startupFailureText } from './startup-failure';

// SEC FB-R4-SEC-BE-V104-07 (V5-43): every line of THIS file goes through log-line.ts (same JSON as before:
// {"level":…,"msg":…}), except the start-up failure line below; ESLint `no-console` covers this file too.
const log = (msg: string): void => writeLogLine('info', msg);

async function bootstrap(): Promise<void> {
  const rt = await createRuntime(log);
  const { config } = rt;
  const db = new PgPinger(config.databaseUrl);
  // v1.0.4 P4-06 (SEC SENT-02): without EMAIL_SHARED_MAILBOXES only info@/booking@ at the EMAIL_FROM domain (and
  // EMAIL_FROM itself) are refused as staff security e-mail. Say so once; never print an address.
  if (
    (config.appEnv === 'staging' || config.appEnv === 'production') &&
    rt.env.EMAIL_FROM &&
    !rt.env.EMAIL_SHARED_MAILBOXES?.trim()
  ) {
    writeLogLine(
      'warn',
      'EMAIL_SHARED_MAILBOXES unset – shared-mailbox rule uses the defaults at the EMAIL_FROM domain only',
    );
  }

  // Test-only endpoints: dynamic import, never in production (config refuses the flag there), and the
  // folder is absent from production images (Dockerfile.api) – openapi.test.yaml, SR-SECR-05.
  // Feature modules: the single list in modules/feature-modules.ts (platform, identity, guests, audit,
  // approvals).
  const imports: (DynamicModule | Type)[] = [
    ...featureModules(
      {
        sessionSecret: rt.env.SESSION_SECRET ?? '',
        cookieSecurePrefix: config.cookieSecurePrefix,
        // Same validated origins as the guard (config.ts: https in staging/production) – ARC-BE-12 (b).
        adminOrigins: config.allowedOrigins.admin ?? [],
        pwaOrigins: config.allowedOrigins.staffPwa ?? [],
        ipHmacKey: rt.env.LOG_IP_HMAC_KEY ?? '',
        appEnv: config.appEnv,
        mfaEnforced: config.mfaEnforced,
        // 0.3.10 (BUG-R3-032): EMAIL_SHARED_MAILBOX check (same variable as the worker's sender).
        ...(rt.env.EMAIL_FROM ? { emailFrom: rt.env.EMAIL_FROM } : {}),
        // v1.0.4 P4-06 (SEC SENT-02): the shared-mailbox list, independent of EMAIL_FROM.
        ...(rt.env.EMAIL_SHARED_MAILBOXES
          ? { sharedMailboxes: rt.env.EMAIL_SHARED_MAILBOXES }
          : {}),
      },
      rt.env,
    ),
  ];
  if (config.testSupport.enabled && config.appEnv !== 'production') {
    // CommonJS build: a synchronous require of the folder (dist/test-support) – it only exists in images
    // built with INCLUDE_TEST_SUPPORT=1; a missing folder fails startup loudly.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./test-support') as {
      default: { register(o: { token: string }): DynamicModule };
    };
    imports.push(mod.default.register({ token: config.testSupport.token }));
    log('test-support endpoints enabled');
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({
      clock: rt.clock,
      db,
      database: rt.database,
      auth: {
        cookieSecurePrefix: config.cookieSecurePrefix,
        allowedOrigins: config.allowedOrigins,
        staffRequestsPerMinute: config.staffRequestsPerMinute,
        mfaEnforced: config.mfaEnforced,
      },
      imports,
    }),
    createHttpAdapter({ logLevel: config.logLevel, trustProxy: config.trustProxy }),
  );
  // SR-SES-04: outside dev/test the CSRF token check must be active (identity module registers it).
  if (config.appEnv === 'staging' || config.appEnv === 'production') {
    try {
      app.get(CSRF_VERIFIER, { strict: false });
    } catch {
      throw new Error('CSRF verifier (identity module) is not registered – refusing to start');
    }
  }
  app.enableShutdownHooks();
  process.once('beforeExit', () => void rt.shutdown());

  await app.listen(config.port, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  // SEC FB-R5-SEC-BE-D1-01: a message only for ConfigError, StartupCheckError, KeyringError (written without values);
  // any other error prints its name and safe code (startup-failure.ts). Plain text on stderr (operators read it as is
  // when the container refuses to start) – the one console call of this file.
  // eslint-disable-next-line no-console
  console.error(startupFailureText(err));
  process.exit(1);
});
