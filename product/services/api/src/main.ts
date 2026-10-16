import 'reflect-metadata';
import type { DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { createRuntime } from './bootstrap';
import { PgPinger } from './db/pinger';
import { createHttpAdapter } from './http';

const log = (msg: string): void => console.log(JSON.stringify({ level: 'info', msg }));

async function bootstrap(): Promise<void> {
  const rt = await createRuntime(log);
  const { config } = rt;
  const db = new PgPinger(config.databaseUrl);

  // Test-only endpoints: dynamic import, never in production (config refuses the flag there), and the
  // folder is absent from production images (Dockerfile.api) – openapi.test.yaml, SR-SECR-05.
  const imports: DynamicModule[] = [];
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
      auth: { cookieSecurePrefix: config.cookieSecurePrefix },
      imports,
    }),
    createHttpAdapter({ logLevel: config.logLevel, trustProxy: config.trustProxy }),
  );
  app.enableShutdownHooks();
  process.once('beforeExit', () => void rt.shutdown());

  await app.listen(config.port, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  // Print only the message: ConfigError/StartupCheckError never contain secret values.
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
