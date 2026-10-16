import 'reflect-metadata';
import type { DynamicModule, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { createRuntime } from './bootstrap';
import { PgPinger } from './db/pinger';
import { createHttpAdapter } from './http';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuditModule } from './modules/audit/audit.module';
import { featureModules, originsFrom } from './modules/feature-modules';
import { CSRF_VERIFIER } from './shared/http/csrf';

const log = (msg: string): void => console.log(JSON.stringify({ level: 'info', msg }));

async function bootstrap(): Promise<void> {
  const rt = await createRuntime(log);
  const { config } = rt;
  const db = new PgPinger(config.databaseUrl);

  // Test-only endpoints: dynamic import, never in production (config refuses the flag there), and the
  // folder is absent from production images (Dockerfile.api) – openapi.test.yaml, SR-SECR-05.
  // Feature modules (BE-A Sprint 1): S27 activity log, S23 approvals.
  const imports: (DynamicModule | Type)[] = [AuditModule, ApprovalsModule];
  // Feature modules (BE-B Sprint 1): platform (US-004/005), identity (US-001/002/142), guests (US-071…073).
  imports.push(
    ...featureModules({
      sessionSecret: rt.env.SESSION_SECRET ?? '',
      cookieSecurePrefix: config.cookieSecurePrefix,
      adminOrigins: originsFrom(rt.env.ADMIN_BASE_URL || rt.env.APP_BASE_URL),
      pwaOrigins: originsFrom(rt.env.STAFF_BASE_URL),
      ipHmacKey: rt.env.LOG_IP_HMAC_KEY ?? '',
    }),
  );
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
  // Print only the message: ConfigError/StartupCheckError never contain secret values.
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
