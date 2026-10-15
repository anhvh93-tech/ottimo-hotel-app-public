import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { clockFromEnv } from './clock';
import { PgPinger } from './db';

async function bootstrap(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required (see product/.env.example)');
  }
  const db = new PgPinger(databaseUrl);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({ clock: clockFromEnv(process.env), db }),
    new FastifyAdapter({
      logger: {
        level: process.env.LOG_LEVEL ?? 'info',
        // Never log credentials or guest tokens (SEC, architecture.md section 10).
        redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      },
      trustProxy: true,
    }),
  );
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
