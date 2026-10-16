/**
 * DS-E seed loader (test-strategy 4.1; fixture owned by QA: tests/fixtures/seed/ds-e.json). FAKE data only.
 *
 * Loads the parts whose tables exist after the foundation migrations: organization, property, users +
 * roles (password from QA_SEED_PASSWORD, argon2id), trusted devices, parameters (+ lease_terms,
 * utility_estimate), document counters. Blocks whose tables belong to later migrations (rooms, channels,
 * minibar, fees, checklist) are reported as skipped – never silently dropped.
 *
 * Codes: every document counter is verified by allocating the first code through DocNumberService in a
 * rolled-back transaction and comparing with the code the fixture expects (prefix + nextValue). Entities
 * with `expectedCode` are compared the same way and the load STOPS on any mismatch (DS-0 rule
 * "so mã server trả với expectedCode và DỪNG nếu lệch"). `--allow-code-drift` downgrades a mismatch of
 * the counters to a warning so a dev DB can still be seeded while the fixture is being fixed.
 * A second run on the same DB fails on organization.code (unique) – DS-E is loaded into a fresh DB.
 *
 * Runs as the application role (DATABASE_URL = ottimo_app) through the same RLS context as the api.
 * Refuses APP_ENV=production. Everything is one transaction: a failure leaves the DB untouched.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { hash } from '@node-rs/argon2';
import { v7 as uuidv7 } from 'uuid';
import { type Clock, SystemClock } from '../../clock';
import { AuditService } from '../../modules/audit/public/audit.service';
import {
  type DocCodeFormat,
  type DocType,
  DOC_TYPES,
  DocNumberService,
  formatDocCode,
  resolvePeriod,
} from '../../modules/platform/public/doc-number.service';
import {
  ParameterService,
  checkBusinessBounds,
  checkValueSchema,
} from '../../modules/platform/public/parameter.service';
import { sha256Hex } from '../../shared/http/auth.guard';
import { localDate } from '../../shared/time';
import type { Database, TenantContext } from '../database';

interface DsE {
  id: string;
  fakeDataOnly: boolean;
  organization: { code: string; name: string };
  property: { code: string; name: string; timezone: string };
  parameters: Array<{ param: string; value: unknown; status?: string; effectiveFrom: string }>;
  leaseTerms?: unknown;
  utilityEstimate?: unknown;
  users: Array<{ username: string; roles: string[]; status: string; displayName: string }>;
  devices: Array<{ label: string; type: string; registeredBy: string; trusted: boolean }>;
  docSequences: Array<{
    docType: string;
    prefix: string;
    padWidth: number;
    scope: string;
    periodKey: string;
    nextValue: number;
  }>;
  [block: string]: unknown;
}

/** Fixture docType names that differ from erd 10 (reported, then mapped). */
const DOC_TYPE_ALIASES: Record<string, DocType> = {
  group: 'reservation_group',
  receipt: 'payment',
};
/** Fixture blocks loaded by later migrations (module that owns the table). */
const PENDING_BLOCKS: Record<string, string> = {
  roomGroups: 'platform (room_group) – BE-B',
  rooms: 'platform (room, room_list_price) – BE-B',
  channels: 'platform (channel, channel_commission_rate) – BE-B',
  minibarItems: 'inventory (item) – BE-B',
  feeCatalog: 'folio (fee catalogue) – BE-B',
  inspectionChecklist: 'housekeeping (checklist) – BE-B',
};
const DEVICE_KINDS: Record<string, 'desk' | 'facility_mobile'> = {
  desk: 'desk',
  property_tablet: 'facility_mobile',
};

export interface SeedReport {
  dataset: string;
  organizationId: string;
  propertyId: string;
  users: number;
  roles: number;
  devices: number;
  parameters: number;
  docSequences: Array<{ docType: string; expected: string; server: string; ok: boolean }>;
  aliases: string[];
  skippedBlocks: Array<{ block: string; owner: string }>;
  warnings: string[];
}

export class SeedCodeMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedCodeMismatchError';
  }
}

export function assertExpectedCode(label: string, server: string, expected: string): void {
  if (server !== expected) {
    throw new SeedCodeMismatchError(
      `${label}: server issued ${server}, fixture expects ${expected}`,
    );
  }
}

export interface SeedOptions {
  database: Database;
  clock?: Clock;
  fixture: DsE;
  password: string;
  allowCodeDrift?: boolean;
  /** Where device tokens/ids are written (gitignored tests/fixtures/seed/.out). */
  outDir?: string;
}

export async function seedDsE(opts: SeedOptions): Promise<SeedReport> {
  const { database, fixture } = opts;
  const clock = opts.clock ?? new SystemClock();
  if (!fixture.fakeDataOnly)
    throw new Error('fixture is not marked fakeDataOnly – refusing to load');
  if (opts.password.length < 12) throw new Error('QA_SEED_PASSWORD must be at least 12 characters');

  const audit = new AuditService(clock, database);
  const parameters = new ParameterService(clock, audit);
  const docNumbers = new DocNumberService(clock, parameters);
  const organizationId = uuidv7();
  const propertyId = uuidv7();
  const ctx: TenantContext = { organizationId, propertyId, userId: null, actorType: 'system' };
  const now = clock.now();
  const report: SeedReport = {
    dataset: fixture.id,
    organizationId,
    propertyId,
    users: 0,
    roles: 0,
    devices: 0,
    parameters: 0,
    docSequences: [],
    aliases: [],
    skippedBlocks: Object.entries(PENDING_BLOCKS)
      .filter(([b]) => fixture[b] !== undefined)
      .map(([block, owner]) => ({ block, owner })),
    warnings: [],
  };

  // Password hashes outside the transaction (argon2id is deliberately slow).
  const hashes = new Map<string, string>();
  for (const u of fixture.users) hashes.set(u.username, await hash(opts.password));

  const deviceOut: Array<{ label: string; id: string; kind: string; token: string }> = [];
  await database.withContext(ctx, async (tx) => {
    await tx.query(
      `INSERT INTO organization (id, code, name, status, created_at, updated_at) VALUES ($1, $2, $3, 'active', $4, $4)`,
      [organizationId, fixture.organization.code, fixture.organization.name, now],
    );
    await tx.query(
      `INSERT INTO property (id, organization_id, code, name, timezone, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, $6)`,
      [
        propertyId,
        organizationId,
        fixture.property.code,
        fixture.property.name,
        fixture.property.timezone,
        now,
      ],
    );

    // Parameters: one row per key, effective from the fixture date, validated by the catalogue type.
    const rows: Array<{ key: string; value: unknown; from: string; status: string | null }> = [
      ...fixture.parameters.map((p) => ({
        key: p.param,
        value: p.value,
        from: p.effectiveFrom,
        status: p.status ?? null,
      })),
    ];
    const firstFrom =
      fixture.parameters[0]?.effectiveFrom ?? localDate(now, fixture.property.timezone);
    if (fixture.leaseTerms !== undefined) {
      rows.push({ key: 'lease_terms', value: fixture.leaseTerms, from: firstFrom, status: 'GD' });
    }
    if (fixture.utilityEstimate !== undefined) {
      rows.push({
        key: 'utility_estimate',
        value: fixture.utilityEstimate,
        from: firstFrom,
        status: 'GD',
      });
    }
    for (const r of rows) {
      const def = await tx.query<{
        value_schema: string;
        bounds: { min?: number; max?: number; allowed?: unknown[] } | null;
      }>('SELECT value_schema, bounds FROM config_parameter_def WHERE key = $1', [r.key]);
      const schema = def.rows[0]?.value_schema;
      if (!schema)
        throw new Error(`parameter ${r.key} is not in the catalogue (config_parameter_def)`);
      if (checkValueSchema(schema, r.value)) {
        throw new Error(`parameter ${r.key}: value does not match catalogue type ${schema}`);
      }
      // The fixture's defaults must sit inside the erd 9.1a bounds (PARAM_OUT_OF_RANGE otherwise).
      checkBusinessBounds(def.rows[0]?.bounds ?? null, r.value);
      await tx.query(
        `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from,
           status_label, reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
        [
          uuidv7(),
          organizationId,
          propertyId,
          r.key,
          JSON.stringify(r.value),
          r.from,
          r.status,
          `seed ${fixture.id}`,
          now,
        ],
      );
      report.parameters++;
    }

    // Users + roles.
    const userIds = new Map<string, string>();
    for (const u of fixture.users) {
      const id = uuidv7();
      userIds.set(u.username, id);
      await tx.query(
        `INSERT INTO app_user (id, organization_id, username, display_name, password_hash, status,
           created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
        [id, organizationId, u.username, u.displayName, hashes.get(u.username), u.status, now],
      );
      report.users++;
      for (const role of u.roles) {
        await tx.query(
          `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, propertyId, organizationId, role, now],
        );
        report.roles++;
      }
    }

    // Trusted devices: random 256-bit token, only its SHA-256 is stored; the token goes to .out for E2E.
    for (const d of fixture.devices.filter((x) => x.trusted)) {
      const kind = DEVICE_KINDS[d.type];
      if (!kind) throw new Error(`device ${d.label}: unknown type ${d.type}`);
      const days = await parameters.get<number>(
        tx,
        kind === 'desk' ? 'trusted_device_days' : 'trusted_device_mobile_days',
        localDate(now, fixture.property.timezone),
      );
      const token = randomBytes(32).toString('base64url');
      const id = uuidv7();
      await tx.query(
        `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash,
           created_by, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          organizationId,
          propertyId,
          d.label,
          kind,
          sha256Hex(token),
          userIds.get(d.registeredBy) ?? null,
          now,
          new Date(now.getTime() + days * 86_400_000),
        ],
      );
      deviceOut.push({ label: d.label, id, kind, token });
      report.devices++;
    }

    // Counters starting above 1 (none in DS-E today) are pre-created so the first code is nextValue.
    for (const s of fixture.docSequences) {
      const docType = mapDocType(s.docType, report);
      if (s.nextValue > 1) {
        const format = await parameters.get<DocCodeFormat>(
          tx,
          `doc_code_format.${docType}`,
          localDate(now, fixture.property.timezone),
        );
        const { prefix, periodKey } = resolvePeriod(
          format,
          localDate(now, fixture.property.timezone),
        );
        await tx.query(
          `INSERT INTO doc_sequence (id, organization_id, property_id, doc_type, period_key, prefix, pad_width, next_value)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuidv7(),
            organizationId,
            format.scope === 'organization' ? null : propertyId,
            docType,
            periodKey,
            prefix,
            format.padWidth,
            s.nextValue,
          ],
        );
      }
    }
    await audit.record(tx, {
      category: 'data',
      action: 'seed.loaded',
      entityType: 'dataset',
      entityId: fixture.id,
      after: { users: report.users, parameters: report.parameters, devices: report.devices },
    });

    // Verify every counter against the fixture: allocate the first code through DocNumberService inside a
    // savepoint, then roll the savepoint back (the counter stays untouched).
    const date = localDate(clock.now(), fixture.property.timezone);
    for (const s of fixture.docSequences) {
      const docType = mapDocType(s.docType, report);
      const expected = formatDocCode(
        s.prefix.replace('{yy}', date.slice(2, 4)),
        s.padWidth,
        s.nextValue,
      );
      await tx.query('SAVEPOINT code_probe');
      const server = await docNumbers.allocate(tx, docType);
      await tx.query('ROLLBACK TO SAVEPOINT code_probe');
      report.docSequences.push({ docType: s.docType, expected, server, ok: server === expected });
    }
    const bad = report.docSequences.filter((x) => !x.ok);
    if (bad.length > 0) {
      const msg = bad
        .map((b) => `${b.docType}: server ${b.server} ≠ fixture ${b.expected}`)
        .join('; ');
      // Codes are the contract between seed, test cases and E2E: stop and roll everything back.
      if (!opts.allowCodeDrift) {
        throw new SeedCodeMismatchError(`document codes differ from the fixture – ${msg}`);
      }
      report.warnings.push(`code drift accepted (--allow-code-drift): ${msg}`);
    }
  });

  if (opts.outDir) {
    mkdirSync(opts.outDir, { recursive: true });
    writeFileSync(
      join(opts.outDir, `${fixture.id.toLowerCase()}.map.json`),
      `${JSON.stringify({ organizationId, propertyId, devices: deviceOut }, null, 2)}\n`,
      { mode: 0o600 },
    );
  }
  return report;
}

function mapDocType(name: string, report: SeedReport): DocType {
  const alias = DOC_TYPE_ALIASES[name];
  if (alias) {
    const note = `${name} → ${alias}`;
    if (!report.aliases.includes(note)) report.aliases.push(note);
    return alias;
  }
  if ((DOC_TYPES as readonly string[]).includes(name)) return name as DocType;
  throw new Error(`unknown docType ${name} in fixture`);
}

export function readFixture(path: string): DsE {
  return JSON.parse(readFileSync(path, 'utf8')) as DsE;
}

export const DEFAULT_FIXTURE = resolve(process.cwd(), '../../tests/fixtures/seed/ds-e.json');
export const DEFAULT_OUT_DIR = (fixturePath: string): string => join(dirname(fixturePath), '.out');
