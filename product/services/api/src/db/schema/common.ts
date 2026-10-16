/**
 * Shared column helpers for the Drizzle schema (erd.md section 1).
 * The SQL migrations in src/db/migrations are the source of truth for the real schema (erd 16);
 * these definitions give the queries their types and let drizzle-kit draft the next migration.
 */
import { customType, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

/** citext (case-insensitive text) – usernames and e-mails (erd 4.2). */
export const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

/** bytea – encrypted C3 columns (`*_enc`, ADR-013). */
export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/** Instant column: timestamptz, UTC in the database (ADR-008). */
export const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * created_at / updated_at / version / created_by (erd 1 "Cột chung").
 * No DEFAULT now(): business timestamps come from the injected Clock (coding-standards 6).
 */
export const auditColumns = () => ({
  createdAt: instant('created_at').notNull(),
  createdBy: uuid('created_by'),
  updatedAt: instant('updated_at').notNull(),
  version: integer('version').notNull().default(1),
});
