/**
 * Fixtures of the BE-A Sprint 2 reservation tests: DS-E parameters (QA's tests/fixtures/seed/ds-e.json), the
 * 10 rooms of DS-E (BL 4.1 – groups, base/max occupancy, list prices) and the DS-E channels for a test tenant.
 * FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import type { Database } from '../../src/db/database';
import { importChannels } from '../../src/modules/platform/public/channels';
import { divideRoundVnd } from '../../src/modules/platform/public/money';
import { T0, type TestTenant, setParam } from './tenant';

interface DsE {
  parameters: Array<{ param: string; value: unknown }>;
  leaseTerms: unknown;
  utilityEstimate: unknown;
  roomGroups: Array<{
    code: string;
    name: string;
    sortOrder: number;
    baseOccupancy: number;
    maxOccupancy: number;
  }>;
  rooms: Array<{
    roomNo: string;
    group: string;
    monthlyListPriceVnd: number;
    baseOccupancy: number;
    maxOccupancy: number;
  }>;
  channels: Array<{
    code: string;
    name: string;
    group: string;
    commissionPct: string;
    requiresOtaRef: boolean;
  }>;
}

export const DS_E = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/seed/ds-e.json'), 'utf8'),
) as DsE;

export interface BookingIds {
  groups: Record<string, string>;
  rooms: Record<string, string>;
  channels: Record<string, string>;
}

export async function seedBooking(db: Database, t: TestTenant, i = 0): Promise<BookingIds> {
  for (const p of DS_E.parameters) await setParam(db, t, p.param, p.value, '2026-10-01', i);
  // ARC s2-contract 8.1 (migration 0018) – until QA's DS-E carries them.
  const have = new Set(DS_E.parameters.map((p) => p.param));
  if (!have.has('ota_base_rate')) {
    await setParam(
      db,
      t,
      'ota_base_rate',
      { L12: 760_000, N: 1_050_000, NPLUS: 980_000 },
      '2026-10-01',
      i,
    );
  }
  if (!have.has('rounding.ota_rate'))
    await setParam(db, t, 'rounding.ota_rate', 10_000, '2026-10-01', i);
  await setParam(db, t, 'lease_terms', DS_E.leaseTerms, '2026-10-01', i);
  await setParam(db, t, 'utility_estimate', DS_E.utilityEstimate, '2026-10-01', i);
  return db.withContext(t.ctx(i), async (tx) => {
    const groups: Record<string, string> = {};
    for (const g of DS_E.roomGroups) {
      const id = uuidv7();
      await tx.query(
        `INSERT INTO room_group (id, organization_id, property_id, code, name, sort_order, base_occupancy,
           max_occupancy, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
        [
          id,
          t.organizationId,
          t.propertyIds[i],
          g.code,
          g.name,
          g.sortOrder,
          g.baseOccupancy,
          g.maxOccupancy,
          T0,
        ],
      );
      groups[g.code] = id;
    }
    const rooms: Record<string, string> = {};
    for (const r of DS_E.rooms) {
      const id = uuidv7();
      await tx.query(
        `INSERT INTO room (id, organization_id, property_id, room_group_id, room_no, base_occupancy, max_occupancy,
           public_slug, active_from, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '2026-10-01', $9, $9)`,
        [
          id,
          t.organizationId,
          t.propertyIds[i],
          groups[r.group],
          r.roomNo,
          r.baseOccupancy,
          r.maxOccupancy,
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
          r.monthlyListPriceVnd,
          divideRoundVnd(r.monthlyListPriceVnd, 12, 1000),
          T0,
        ],
      );
      rooms[r.roomNo] = id;
    }
    await importChannels(tx, {
      channels: DS_E.channels.map((c) => ({
        code: c.code,
        name: c.name,
        group: c.group,
        commissionPct: c.commissionPct,
        requiresOtaRef: c.requiresOtaRef,
      })),
      from: '2026-10-01',
      now: T0,
    } as never);
    const { rows } = await tx.query<{ id: string; code: string }>('SELECT id, code FROM channel');
    return { groups, rooms, channels: Object.fromEntries(rows.map((r) => [r.code, r.id])) };
  });
}

export async function seedGuestRow(
  db: Database,
  t: TestTenant,
  opts: { phone?: string | null; name?: string; createdBy?: string | null } = {},
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
        opts.createdBy ?? null,
        T0,
      ],
    ),
  );
  return id;
}

/** Move every session of the tenant to `at` before the fake clock jumps (idle/absolute expiry). */
export async function touchSessions(db: Database, t: TestTenant, at: Date): Promise<void> {
  await db.withContext(t.ctx(), (tx) =>
    tx.query(
      `UPDATE user_session SET last_active_at = $2, idle_expires_at = $3, expires_at = $3
        WHERE organization_id = $1`,
      [t.organizationId, at, new Date(at.getTime() + 12 * 3_600_000)],
    ),
  );
}
