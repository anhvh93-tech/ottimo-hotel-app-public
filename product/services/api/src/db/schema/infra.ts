/** Application infrastructure tables (erd 4.12): jobs, outbox/inbox, idempotency keys. */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { instant } from './common';
import { organization, property } from './platform';

/** Exactly-once marker for scheduled jobs (architecture 9.1). No `started` state on purpose. */
export const jobRun = pgTable(
  'job_run',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    jobKey: text('job_key').notNull(),
    businessDate: date('business_date', { mode: 'string' }).notNull(),
    slot: text('slot').notNull(),
    runAt: instant('run_at').notNull(),
    status: text('status').notNull(),
    stats: jsonb('stats'),
  },
  (t) => [
    unique('job_run_slot_key').on(t.jobKey, t.propertyId, t.businessDate, t.slot),
    foreignKey({
      name: 'job_run_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('job_run_status_check', sql`${t.status} IN ('done', 'skipped_catchup')`),
    index('job_run_property_run_at_idx').on(t.propertyId, t.runAt),
  ],
);

/**
 * Outbox (erd 4.12): written in the business transaction, dispatched by the worker (J18).
 * payload holds IDs only – never C3. created_at/dispatched_at are technical (DEFAULT now() allowed).
 */
export const outboxMessage = pgTable(
  'outbox_message',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    propertyId: uuid('property_id'),
    topic: text('topic').notNull(),
    payload: jsonb('payload').notNull(),
    dedupeKey: text('dedupe_key').notNull().unique(),
    status: text('status').notNull().default('pending'),
    attempts: smallint('attempts').notNull().default(0),
    nextAttemptAt: instant('next_attempt_at'),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    dispatchedAt: instant('dispatched_at'),
  },
  (t) => [
    foreignKey({
      name: 'outbox_message_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check(
      'outbox_message_status_check',
      sql`${t.status} IN ('pending', 'in_flight', 'done', 'failed', 'dead')`,
    ),
    index('outbox_message_pending_idx')
      .on(t.status, t.nextAttemptAt)
      .where(sql`${t.status} IN ('pending', 'failed')`),
  ],
);

/** Inbox (erd 4.12): webhook/IPN de-duplication; filtered_payload is allowlist-only (SR-PAY-09). */
export const inboxMessage = pgTable(
  'inbox_message',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    propertyId: uuid('property_id'),
    provider: text('provider').notNull(),
    externalEventId: text('external_event_id').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    signatureValid: boolean('signature_valid').notNull(),
    filteredPayload: jsonb('filtered_payload'),
    cardFieldsDropped: integer('card_fields_dropped').notNull().default(0),
    status: text('status').notNull().default('received'),
    processedAt: instant('processed_at'),
    error: text('error'),
  },
  (t) => [
    unique('inbox_message_provider_event_key').on(t.provider, t.externalEventId),
    foreignKey({
      name: 'inbox_message_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check(
      'inbox_message_status_check',
      sql`${t.status} IN ('received', 'processed', 'ignored', 'failed')`,
    ),
  ],
);

/** Idempotency-Key store (ADR-009 point 8, BE-ARC-11). Inserted in the business transaction. */
export const idempotencyKey = pgTable(
  'idempotency_key',
  {
    principalType: text('principal_type').notNull(),
    principalId: uuid('principal_id').notNull(),
    key: text('key').notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    method: text('method').notNull(),
    path: text('path').notNull(),
    requestHash: text('request_hash').notNull(),
    state: text('state').notNull(),
    responseStatus: smallint('response_status'),
    responseBody: jsonb('response_body'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      name: 'idempotency_key_pkey',
      columns: [t.principalType, t.principalId, t.key],
    }),
    check(
      'idempotency_key_principal_type_check',
      sql`${t.principalType} IN ('user', 'guest_session', 'public_site')`,
    ),
    check('idempotency_key_state_check', sql`${t.state} IN ('in_progress', 'completed')`),
    index('idempotency_key_created_idx').on(t.createdAt),
  ],
);
