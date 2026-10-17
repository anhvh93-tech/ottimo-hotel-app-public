/**
 * Minibar catalogue (US-066, US-003 AC2; BR-701, BR-006; rbac S13, A91, M3, note 26) – BE-D Sprint 4 (moved from
 * BE-B, ORC 17/10). Operations listItems (OWN/MGR/FDL/FD/HK), createItem + updateItem (OWN/MGR only – A91, the
 * guard answers 403 to FD/FDL/HK before anything here).
 *
 * - `salePriceVnd = null` (or 0) = complimentary: a minibar count records the consumption but posts no money
 *   (BR-701 – MinibarService reads the price at count time).
 * - A new sale price applies to the NEXT counts only: posted folio lines are never rewritten (BR-006, BR-008).
 * - `costPriceVnd` is C2: only OWN/MGR receive it (role serializer, x-visible-to); HK never sees cost, stock value
 *   or amounts (US-003 AC2 – the minibar count/standard responses drop them too).
 * - updateItem: If-Match (version) – 412 VERSION_CONFLICT; the code never changes (422 NOT_EDITABLE – FB-R2-ARC-BE-S3-32,
 *   column grants of 0042/0061); createItem: duplicate code → 422 DUPLICATE (as the room catalogue).
 * - Audit `config` item.created / item.updated – prices as numbers, the cost price only as "changed" (C2).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import { type Tx, pgCode } from '../../../db/database';
import { assertVersion } from '../../../shared/http/precondition';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';

export interface ItemInput {
  code: string;
  name: { vi?: string | undefined; en?: string | undefined; ru?: string | undefined };
  unit: string;
  costPriceVnd?: number | undefined;
  salePriceVnd?: number | null | undefined;
  minibarStandardQty: number;
  minStockQty?: number | undefined;
  isActive?: boolean | undefined;
}

interface ItemRow {
  id: string;
  code: string;
  name: string;
  name_i18n: Record<string, string> | null;
  unit: string;
  cost_price_vnd: number | string | null;
  sale_price_vnd: number | string | null;
  minibar_standard_qty: number;
  min_stock_qty: number;
  is_active: boolean;
  version: number;
}

const num = (v: number | string | null): number | null => (v === null ? null : Number(v));

function constraintOf(err: unknown): string | undefined {
  return (err as { constraint?: string } | null)?.constraint;
}

/** OpenAPI `Item` (cost/sale prices filtered per role by the serializer). */
export function itemDto(r: ItemRow): Record<string, unknown> {
  const sale = num(r.sale_price_vnd);
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    unit: r.unit,
    isFree: sale === null || sale === 0,
    salePriceVnd: sale,
    ...(r.cost_price_vnd !== null ? { costPriceVnd: num(r.cost_price_vnd) } : {}),
    minibarStandardQty: r.minibar_standard_qty,
    minStockQty: r.min_stock_qty,
    isActive: r.is_active,
    version: r.version,
  };
}

/** Vietnamese name first (bill / folio label – BR-009), then English, then Russian. */
function primaryName(n: ItemInput['name']): string {
  const v = n.vi ?? n.en ?? n.ru;
  if (!v) throw problem('VALIDATION_FAILED', { errors: [{ field: 'name.vi', code: 'REQUIRED' }] });
  return v;
}

function names(n: ItemInput['name']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of ['vi', 'en', 'ru'] as const) if (n[k]) out[k] = n[k] as string;
  return out;
}

const COLUMNS = `id, code, name, name_i18n, unit, cost_price_vnd, sale_price_vnd, minibar_standard_qty,
  min_stock_qty, is_active, version`;

@Injectable()
export class ItemsService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(tx: Tx): Promise<Array<Record<string, unknown>>> {
    const { rows } = await tx.query<ItemRow>(
      `SELECT ${COLUMNS} FROM item WHERE kind = 'minibar' ORDER BY is_active DESC, code`,
    );
    return rows.map(itemDto);
  }

  async create(tx: Tx, input: ItemInput, requestId: string): Promise<Record<string, unknown>> {
    const id = uuidv7();
    const now = this.clock.now();
    await this.insertUnique(tx, 'create_item', () =>
      tx.query(
        `INSERT INTO item (id, organization_id, property_id, code, kind, name, name_i18n, unit, cost_price_vnd,
           sale_price_vnd, minibar_standard_qty, min_stock_qty, is_active, created_at, created_by, updated_at)
         VALUES ($1, $2, $3, $4, 'minibar', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $13)`,
        [
          id,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          input.code,
          primaryName(input.name),
          JSON.stringify(names(input.name)),
          input.unit,
          input.costPriceVnd ?? null,
          input.salePriceVnd ?? null,
          input.minibarStandardQty,
          input.minStockQty ?? 0,
          input.isActive ?? true,
          now,
          tx.ctx.userId,
        ],
      ),
    );
    const row = await this.row(tx, id);
    await this.audit.record(tx, {
      category: 'config',
      action: 'item.created',
      entityType: 'item',
      entityId: id,
      entityCode: row.code,
      after: this.auditView(row),
      requestId,
    });
    return itemDto(row);
  }

  async update(
    tx: Tx,
    id: string,
    expected: number,
    input: ItemInput,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const before = await this.row(tx, id, true);
    assertVersion(before.version, expected);
    // FB-R2-ARC-BE-S3-32: the code is the item's key (minibar counts, stock moves, reports) – it never moves.
    if (input.code !== before.code) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'code', code: 'NOT_EDITABLE' }] });
    }
    await tx.query(
      `UPDATE item SET name = $2, name_i18n = $3, unit = $4, cost_price_vnd = $5, sale_price_vnd = $6,
                minibar_standard_qty = $7, min_stock_qty = $8, is_active = $9, updated_at = $10,
                version = version + 1
          WHERE id = $1`,
      [
        id,
        primaryName(input.name),
        JSON.stringify(names(input.name)),
        input.unit,
        input.costPriceVnd === undefined ? before.cost_price_vnd : input.costPriceVnd,
        input.salePriceVnd === undefined ? before.sale_price_vnd : input.salePriceVnd,
        input.minibarStandardQty,
        input.minStockQty ?? before.min_stock_qty,
        input.isActive ?? before.is_active,
        this.clock.now(),
      ],
    );
    const after = await this.row(tx, id);
    await this.audit.record(tx, {
      category: 'config',
      action: 'item.updated',
      entityType: 'item',
      entityId: id,
      entityCode: after.code,
      before: this.auditView(before),
      after: {
        ...this.auditView(after),
        costChanged: num(before.cost_price_vnd) !== num(after.cost_price_vnd),
      },
      requestId,
    });
    return itemDto(after);
  }

  /** Audit view: never the cost price itself (C2 – only "changed"). */
  private auditView(r: ItemRow): Record<string, unknown> {
    const sale = num(r.sale_price_vnd);
    return {
      code: r.code,
      unit: r.unit,
      salePriceVnd: sale,
      isFree: sale === null || sale === 0,
      minibarStandardQty: r.minibar_standard_qty,
      minStockQty: r.min_stock_qty,
      isActive: r.is_active,
    };
  }

  private async row(tx: Tx, id: string, lock = false): Promise<ItemRow> {
    const { rows } = await tx.query<ItemRow>(
      `SELECT ${COLUMNS} FROM item WHERE id = $1 AND kind = 'minibar'${lock ? ' FOR UPDATE' : ''}`,
      [id],
    );
    const r = rows[0];
    if (!r) throw problem('NOT_FOUND');
    return r;
  }

  /** The code is unique per property: a clash is the user's error (422 DUPLICATE), anything else is not. */
  private async insertUnique(tx: Tx, savepoint: string, fn: () => Promise<unknown>) {
    await tx.query(`SAVEPOINT ${savepoint}`);
    try {
      await fn();
      await tx.query(`RELEASE SAVEPOINT ${savepoint}`);
    } catch (err) {
      if (pgCode(err) === '23505' && constraintOf(err) === 'item_property_code_key') {
        await tx.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'code', code: 'DUPLICATE' }] });
      }
      throw err;
    }
  }
}
