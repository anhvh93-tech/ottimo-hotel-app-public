// drizzle-kit is used ONLY to draft migrations (`pnpm db:generate`, `pnpm db:generate:custom`).
// The SQL files in src/db/migrations are the source of truth and may be edited by hand (erd 16).
// `drizzle-kit push` is forbidden in every environment (coding-standards 6) – there is no script for it
// and test/migrations.test.ts fails if one is added.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  strict: true,
  verbose: true,
});
