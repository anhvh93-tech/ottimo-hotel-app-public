/**
 * audit module tables (erd 4.3). Both are append-only (K8: ottimo_app has no UPDATE/DELETE) and
 * PARTITION BY RANGE (occurred_at) monthly from the first migration (BE-ARC-18) – the partitioning
 * itself is hand-written in the migration (drizzle-kit does not know it).
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { instant } from './common';

export const AUDIT_CATEGORIES = ['money', 'state', 'config', 'access', 'security', 'data'] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];
export const ACTOR_TYPES = ['user', 'guest', 'system'] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const auditEvent = pgTable(
  'audit_event',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().notNull(),
    organizationId: uuid('organization_id').notNull(),
    // NULL = organisation-level event (user management…), same RLS shape as doc_sequence.
    propertyId: uuid('property_id'),
    occurredAt: instant('occurred_at').notNull(),
    actorType: text('actor_type').notNull(),
    actorUserId: uuid('actor_user_id'),
    category: text('category').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    // text, not uuid: some audited entities are keyed by text (parameter key, session hash).
    entityId: text('entity_id'),
    // Display code of the entity (OTM-00171, F26-000123, parameter key) for the S27 log (US-006). R2 S1.
    entityCode: text('entity_code'),
    before: jsonb('before'),
    after: jsonb('after'),
    reason: text('reason'),
    requestId: text('request_id'),
    ipHmac: text('ip_hmac'),
    // user_session.id is a SHA-256 hex string, not a uuid (erd 4.2).
    sessionId: text('session_id'),
    trustedDeviceId: uuid('trusted_device_id'),
  },
  (t) => [
    primaryKey({ name: 'audit_event_pkey', columns: [t.id, t.occurredAt] }),
    check('audit_event_actor_type_check', sql`${t.actorType} IN ('user', 'guest', 'system')`),
    check(
      'audit_event_category_check',
      sql`${t.category} IN ('money', 'state', 'config', 'access', 'security', 'data')`,
    ),
    index('audit_event_property_category_idx').on(t.propertyId, t.category, t.occurredAt.desc()),
    index('audit_event_entity_idx').on(t.entityType, t.entityId),
    // listAuditEvents scope `own` (FDL/FD) and the actor filter of OWN/MGR (US-006 AC2).
    index('audit_event_property_actor_idx').on(t.propertyId, t.actorUserId, t.occurredAt.desc()),
  ],
);

export const C3_SUBJECT_TYPES = [
  'guest_document',
  'document_image',
  'door_credential',
  'payee_account',
  'portal_data',
  'mfa_secret',
] as const;
export const C3_ACTIONS = ['view', 'create', 'update', 'copy', 'delete', 'purge'] as const;

export const c3AccessLog = pgTable(
  'c3_access_log',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().notNull(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    occurredAt: instant('occurred_at').notNull(),
    actorType: text('actor_type').notNull(),
    userId: uuid('user_id'),
    sessionId: text('session_id'),
    trustedDeviceId: uuid('trusted_device_id'),
    ipHmac: text('ip_hmac'),
    subjectType: text('subject_type').notNull(),
    subjectId: uuid('subject_id').notNull(),
    reservationId: uuid('reservation_id'),
    action: text('action').notNull(),
    reasonCode: text('reason_code'),
    requestId: text('request_id'),
  },
  (t) => [
    primaryKey({ name: 'c3_access_log_pkey', columns: [t.id, t.occurredAt] }),
    check('c3_access_log_actor_type_check', sql`${t.actorType} IN ('user', 'guest', 'system')`),
    check(
      'c3_access_log_subject_type_check',
      sql`${t.subjectType} IN ('guest_document', 'document_image', 'door_credential', 'payee_account', 'portal_data', 'mfa_secret', 'refund_account')`,
    ),
    check(
      'c3_access_log_action_check',
      sql`${t.action} IN ('view', 'create', 'update', 'copy', 'delete', 'purge')`,
    ),
    index('c3_access_log_property_occurred_idx').on(t.propertyId, t.occurredAt.desc()),
    index('c3_access_log_subject_idx').on(t.subjectType, t.subjectId),
  ],
);

/**
 * State history of every state machine (erd 4.3 `state_transition`, state-machines 0.2.2). Append-only
 * (K8) and partitioned monthly like the other logs (BE-ARC-18 – partitioning in the custom migration).
 * `rejected = true` records refused transitions (US-002 AC2). Metrics read reservation_change instead.
 */
export const stateTransition = pgTable(
  'state_transition',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().notNull(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    machine: text('machine').notNull(),
    entityId: uuid('entity_id').notNull(),
    fromState: text('from_state'),
    toState: text('to_state').notNull(),
    eventCode: text('event_code').notNull(),
    actorType: text('actor_type').notNull(),
    actorUserId: uuid('actor_user_id'),
    reasonCode: text('reason_code'),
    reasonNote: text('reason_note'),
    occurredAt: instant('occurred_at').notNull(),
    performedAt: instant('performed_at'),
    rejected: boolean('rejected').notNull().default(false),
    requestId: text('request_id'),
  },
  (t) => [
    primaryKey({ name: 'state_transition_pkey', columns: [t.id, t.occurredAt] }),
    check('state_transition_actor_type_check', sql`${t.actorType} IN ('user', 'guest', 'system')`),
    check('state_transition_machine_check', sql`${t.machine} ~ '^SM-[0-9]{2}$'`),
    index('state_transition_entity_idx').on(t.entityId, t.occurredAt),
    index('state_transition_property_idx').on(t.propertyId, t.machine, t.occurredAt.desc()),
  ],
);
