import 'reflect-metadata';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { FixedClock } from '../src/clock';
import { type DbPinger, PgPinger } from '../src/db/pinger';

const fixedClock = new FixedClock(new Date('2026-10-15T02:30:00.000Z'));
const fakeDb = (up: boolean): DbPinger => ({ ping: async () => up, close: async () => undefined });

async function createApp(db: DbPinger): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.register({ clock: fixedClock, db })],
  }).compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

describe('GET /health', () => {
  let app: NestFastifyApplication | undefined;
  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('returns 200 ok when the database answers', async () => {
    app = await createApp(fakeDb(true));
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', db: 'ok', time: '2026-10-15T09:30:00.000+07:00' });
  });

  it('returns 503 when the database is down', async () => {
    app = await createApp(fakeDb(false));
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'error', db: 'down' });
  });

  // Runs against a real PostgreSQL when DATABASE_URL is set (CI service container / docker compose).
  it.skipIf(!process.env.DATABASE_URL)('reports db ok against a real PostgreSQL', async () => {
    const db = new PgPinger(process.env.DATABASE_URL as string);
    try {
      app = await createApp(db);
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ status: 'ok', db: 'ok' });
    } finally {
      await app?.close();
      app = undefined;
      await db.close();
    }
  });
});
