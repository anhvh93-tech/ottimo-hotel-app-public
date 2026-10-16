/**
 * Sales channels (erd 4.1 channel / channel_commission_rate; BR-901, BR-112) – platform module (BE-B).
 * - ChannelsService.list(): `listChannels` (commissionRatePct removed for SAL/CTV by the role serializer).
 * - ChannelsService.byId(): resolve a channel + its group for quotes (sales) and bookings (reservations).
 * - importChannels(): DS-E/DS-0 `channels` block (seed), same transaction as the rest of the dataset.
 */
import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { CHANNEL_GROUPS, type ChannelGroup } from '../../../db/schema/channels';
import type { LocalDate } from '../../../shared/time';

export type { ChannelGroup };

export interface ChannelRow {
  id: string;
  code: string;
  name: string;
  channelGroup: ChannelGroup;
  isActive: boolean;
  requiresOtaRef: boolean;
  /** Effective rate on the asked date (BR-901), null when the channel has none. */
  commissionRatePct: number | null;
}

/** OpenAPI Channel. */
export interface ChannelDto {
  id: string;
  code: string;
  name: string;
  channelGroup: ChannelGroup;
  requiresOtaRef: boolean;
  isActive: boolean;
  commissionRatePct?: number;
}

const SELECT = `SELECT c.id, c.code, c.name, c.channel_group, c.is_active, c.requires_ota_ref,
    (SELECT r.rate_pct FROM channel_commission_rate r
      WHERE r.channel_id = c.id AND r.effective_from <= $1::date
      ORDER BY r.effective_from DESC LIMIT 1) AS rate_pct
  FROM channel c`;

interface Row {
  id: string;
  code: string;
  name: string;
  channel_group: ChannelGroup;
  is_active: boolean;
  requires_ota_ref: boolean;
  rate_pct: string | null;
}

function toRow(r: Row): ChannelRow {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    channelGroup: r.channel_group,
    isActive: r.is_active,
    requiresOtaRef: r.requires_ota_ref,
    commissionRatePct: r.rate_pct === null ? null : Number(r.rate_pct),
  };
}

export function channelDto(c: ChannelRow): ChannelDto {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    channelGroup: c.channelGroup,
    requiresOtaRef: c.requiresOtaRef,
    isActive: c.isActive,
    ...(c.commissionRatePct !== null ? { commissionRatePct: c.commissionRatePct } : {}),
  };
}

@Injectable()
export class ChannelsService {
  /** Channels of the property in context, in display order. */
  async list(tx: Tx, asOf: LocalDate): Promise<ChannelRow[]> {
    const { rows } = await tx.query<Row>(`${SELECT} ORDER BY c.sort_order, c.code`, [asOf]);
    return rows.map(toRow);
  }

  /** Channel of the property in context (RLS) or null. */
  async byId(tx: Tx, id: string, asOf: LocalDate): Promise<ChannelRow | null> {
    const { rows } = await tx.query<Row>(`${SELECT} WHERE c.id = $2`, [asOf, id]);
    return rows[0] ? toRow(rows[0]) : null;
  }
}

export interface ChannelImport {
  code: string;
  name: string;
  group: string;
  commissionPct?: string | number;
  requiresOtaRef?: boolean;
  isActive?: boolean;
}

export class ChannelImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChannelImportError';
  }
}

/** Seed import (DS-E `channels`): one channel row + its first commission rate effective `from`. */
export async function importChannels(
  tx: Tx,
  input: { channels: ChannelImport[]; from: LocalDate; now: Date },
): Promise<number> {
  const { organizationId, propertyId } = tx.ctx;
  if (!organizationId || !propertyId) throw new Error('importChannels needs a property context');
  for (const [i, c] of input.channels.entries()) {
    if (!(CHANNEL_GROUPS as readonly string[]).includes(c.group)) {
      throw new ChannelImportError(`channel ${c.code}: unknown group ${c.group}`);
    }
    const rate = Number(c.commissionPct ?? 0);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      throw new ChannelImportError(`channel ${c.code}: commissionPct out of range`);
    }
    const id = uuidv7();
    await tx.query(
      `INSERT INTO channel (id, organization_id, property_id, code, name, channel_group, is_active,
         requires_ota_ref, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
      [
        id,
        organizationId,
        propertyId,
        c.code,
        c.name,
        c.group,
        c.isActive ?? true,
        c.requiresOtaRef ?? false,
        i,
        input.now,
      ],
    );
    await tx.query(
      `INSERT INTO channel_commission_rate (id, organization_id, property_id, channel_id, effective_from,
         rate_pct, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [uuidv7(), organizationId, propertyId, id, input.from, String(rate), input.now],
    );
  }
  return input.channels.length;
}
