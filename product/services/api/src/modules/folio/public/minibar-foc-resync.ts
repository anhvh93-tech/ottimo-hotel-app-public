/**
 * BUG-R2-147 (R4MINI-03, lối ra (a) – ORC 18/10; ARC `openapi-0.3.7.md` 16.3): migration 0065 moved the minibar FOC
 * key to the item (`item:minibar:<code>`, R8) but SQL cannot re-run the FOC allocation – an OPEN folio that
 * carried two FOC on one item before 0065 (BUG-R2-135 data) kept them both applied. This one-time data step
 * re-runs `FolioService.syncReductions` on every open folio with a live minibar FOC / discount request, once per
 * property: the `job_run` row (job_key DATA_FIX_KEY, fixed slot) is the "already done" flag, claimed in the same
 * transaction as the fix (an error rolls both back – retried at the next start).
 * Runs at application bootstrap (FolioModule) outside tests; tests call it directly.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { FolioService } from './folio.service';

export const DATA_FIX_KEY = 'data_fix.minibar_foc_0065';
/** The fixed slot of a one-time step (job_run_slot_key: job × property × date × slot). */
const ONCE_DATE = '2026-10-18';
const ONCE_SLOT = '00:00';

/**
 * Re-syncs the FOC of the open folios with a minibar FOC of the property in context. Returns null when the step
 * already ran for this property, else the number of folios re-synced.
 */
export async function resyncMinibarFocOnce(
  tx: Tx,
  folios: Pick<FolioService, 'syncReductions'>,
  now: Date,
): Promise<number | null> {
  const { rows: claimed } = await tx.query<{ id: string }>(
    `INSERT INTO job_run (id, organization_id, property_id, job_key, business_date, slot, run_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'done')
     ON CONFLICT (job_key, property_id, business_date, slot) DO NOTHING RETURNING id`,
    [uuidv7(), tx.ctx.organizationId, tx.ctx.propertyId, DATA_FIX_KEY, ONCE_DATE, ONCE_SLOT, now],
  );
  const runId = claimed[0]?.id;
  if (!runId) return null;
  const { rows } = await tx.query<{ folio_id: string }>(
    `SELECT DISTINCT c.folio_id
       FROM approval_request a
       JOIN folio_line f0 ON f0.id = a.folio_line_id
       JOIN folio_line c ON c.id = f0.related_line_id
       JOIN folio fo ON fo.id = c.folio_id
      WHERE c.category = 'minibar' AND fo.status = 'open'
        AND a.type IN ('foc', 'special_discount')
        AND (a.status IN ('pending', 'escalated')
             OR (a.status = 'approved' AND COALESCE(a.foc_state, 'applied') IN ('applied', 'dormant', 'suspended')))
      ORDER BY c.folio_id`,
  );
  for (const r of rows) {
    await folios.syncReductions(tx, r.folio_id, { userId: null, cause: 'manual_adjust' });
  }
  await tx.query('UPDATE job_run SET stats = $2 WHERE id = $1', [
    runId,
    JSON.stringify({ folios: rows.length }),
  ]);
  return rows.length;
}
