/**
 * Fixtures of the BE-B Sprint 2 tests (sales, folio, payments): the DS-E parameters (all of them, read from
 * QA's tests/fixtures/seed/ds-e.json), a room catalogue subset (BL 4.1) and the DS-E channels for a test
 * tenant. The tests run the REAL feature modules – reservations (BE-A) included – through startFeatureApp:
 * quotes → holds → deposits → folio/stay_night are exercised end to end on PostgreSQL. FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import type { Database } from '../../src/db/database';
import { importChannels } from '../../src/modules/platform/public/channels';
import { divideRoundVnd } from '../../src/modules/platform/public/money';
import { T0, type TestTenant, setParam } from './tenant';

const DS_E = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/seed/ds-e.json'), 'utf8'),
) as {
  parameters: Array<{ param: string; value: unknown }>;
  leaseTerms: unknown;
  utilityEstimate: unknown;
};

/**
 * Every DS-E parameter (BR section 13) + lease_terms / utility_estimate, as the seed loader stores them.
 */
export const DS_E_PARAMS: Record<string, unknown> = {
  ...Object.fromEntries(DS_E.parameters.map((p) => [p.param, p.value])),
  lease_terms: DS_E.leaseTerms,
  utility_estimate: DS_E.utilityEstimate,
};

export interface SalesIds {
  groups: Record<'L12' | 'N' | 'NPLUS', string>;
  rooms: Record<'101' | '202' | '301' | '302', string>;
  channels: Record<string, string>;
}

/** Parameters + room catalogue (BL 4.1 subset) + DS-E channels of property `i`. */
export async function seedSales(db: Database, t: TestTenant, i = 0): Promise<SalesIds> {
  for (const [k, v] of Object.entries(DS_E_PARAMS)) await setParam(db, t, k, v, '2026-10-01', i);
  return db.withContext(t.ctx(i), async (tx) => {
    const groups = {} as SalesIds['groups'];
    for (const [code, name, base, max, fee, sort] of [
      ['L12', 'Lầu 1–2', 2, 3, 300000, 1],
      ['N', 'Căn N', 4, 5, 400000, 2],
      ['NPLUS', 'Căn N+', 3, 4, 350000, 3],
    ] as const) {
      const id = uuidv7();
      await tx.query(
        `INSERT INTO room_group (id, organization_id, property_id, code, name, sort_order, base_occupancy,
           max_occupancy, service_fee_monthly_vnd, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
        [id, t.organizationId, t.propertyIds[i], code, name, sort, base, max, fee, T0],
      );
      groups[code] = id;
    }
    const rooms = {} as SalesIds['rooms'];
    for (const [no, group, base, max, monthly] of [
      ['101', 'L12', 2, 3, 8_000_000],
      ['202', 'L12', 2, 3, 9_500_000],
      ['301', 'N', 4, 5, 11_500_000],
      ['302', 'NPLUS', 3, 4, 11_000_000],
    ] as const) {
      const id = uuidv7();
      await tx.query(
        `INSERT INTO room (id, organization_id, property_id, room_group_id, room_no, name, base_occupancy,
           max_occupancy, public_slug, active_from, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '2026-10-01', $10, $10)`,
        [
          id,
          t.organizationId,
          t.propertyIds[i],
          groups[group],
          no,
          `Studio ${no}`,
          base,
          max,
          randomBytes(9).toString('base64url'),
          T0,
        ],
      );
      await tx.query(
        `INSERT INTO room_list_price (id, organization_id, property_id, room_id, effective_from,
           monthly_list_price_vnd, nightly_list_price_vnd, reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, '2026-10-01', $5, $6, 'seed', $7, $7)`,
        [
          uuidv7(),
          t.organizationId,
          t.propertyIds[i],
          id,
          monthly,
          divideRoundVnd(monthly, 12, 1000),
          T0,
        ],
      );
      rooms[no] = id;
    }
    await importChannels(tx, {
      channels: [
        { code: 'direct', name: 'Trực tiếp', group: 'direct', commissionPct: '0' },
        { code: 'collaborator', name: 'CTV / môi giới', group: 'agent', commissionPct: '0' },
        {
          code: 'airbnb',
          name: 'Airbnb',
          group: 'ota',
          commissionPct: '15.5',
          requiresOtaRef: true,
        },
        { code: 'internal', name: 'Nội bộ', group: 'internal', commissionPct: '0' },
      ],
      from: '2026-10-01',
      now: T0,
    });
    const { rows } = await tx.query<{ id: string; code: string }>('SELECT id, code FROM channel');
    const channels = Object.fromEntries(rows.map((r) => [r.code, r.id]));
    return { groups, rooms, channels };
  });
}

/** Move every session of the tenant to `at` (idle/absolute expiry 12 h later) before the clock jumps. */
export async function refreshSessions(db: Database, t: TestTenant, at: Date): Promise<void> {
  await db.withContext(t.ctx(), (tx) =>
    tx.query(
      `UPDATE user_session SET last_active_at = $2, idle_expires_at = $3, expires_at = $3
        WHERE organization_id = $1`,
      [t.organizationId, at, new Date(at.getTime() + 12 * 3_600_000)],
    ),
  );
}

/** Guest with or without a phone, created by `createdBy` (scope M of SAL/CTV). */
export async function seedGuest(
  db: Database,
  t: TestTenant,
  createdBy: string | null,
  opts: { phone?: string | null; name?: string } = {},
): Promise<string> {
  const id = uuidv7();
  await db.withContext(t.ctx(), (tx) =>
    tx.query(
      `INSERT INTO guest (id, organization_id, code, full_name, name_search, phone_e164, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
      [
        id,
        t.organizationId,
        `KH-${randomBytes(3).toString('hex')}`,
        opts.name ?? 'Khách Thử',
        (opts.name ?? 'KHACH THU').toUpperCase(),
        opts.phone === undefined
          ? `849${Math.floor(10_000_000 + Math.random() * 89_999_999)}`
          : opts.phone,
        createdBy,
        T0,
      ],
    ),
  );
  return id;
}
