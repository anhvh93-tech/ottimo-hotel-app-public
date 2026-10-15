import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { clockFromEnv } from './clock';
import { loadConfig, resolveFileSecrets } from './config';
import { PgPinger } from './db';
import { createHttpAdapter } from './http';

async function bootstrap(): Promise<void> {
  // Fails fast (exit 1) on weak/missing secrets, bad APP_ENV, or clock/mock overrides in production.
  const env = resolveFileSecrets(process.env);
  const config = loadConfig(env);
  const db = new PgPinger(config.databaseUrl);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({ clock: clockFromEnv(env), db }),
    createHttpAdapter({ logLevel: config.logLevel, trustProxy: config.trustProxy }),
  );
  app.enableShutdownHooks();

  await app.listen(config.port, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  // Print only the message: a ConfigError never contains secret values.
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
