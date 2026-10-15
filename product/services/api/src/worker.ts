/**
 * Worker entrypoint (same image as api, ADR-001/003).
 * R1 skeleton: only proves the process starts and stops cleanly.
 * R2: pg-boss scheduler, outbox dispatcher, inbox processor (architecture.md section 9).
 */
import { PgPinger } from './db';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const db = new PgPinger(databaseUrl);
  const ok = await db.ping();
  console.log(
    JSON.stringify({ level: 'info', msg: 'worker started (skeleton)', db: ok ? 'ok' : 'down' }),
  );

  const heartbeat = setInterval(() => undefined, 60_000);
  const stop = async (signal: string): Promise<void> => {
    clearInterval(heartbeat);
    await db.close();
    console.log(JSON.stringify({ level: 'info', msg: 'worker stopped', signal }));
    process.exit(0);
  };
  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('SIGINT', () => void stop('SIGINT'));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
