/**
 * Writes to a guest profile requested by other modules (FB-R2-ARC-BE-S2-05): the guests module owns the
 * `guest` table, so a booking form that carries an e-mail attaches it through here – optimistic `version`
 * bumped (an open profile form gets 412, no lost update), audit written, only a unique-violation (another
 * profile already owns that e-mail, BR-951) is tolerated.
 */
import type { Tx } from '../../../db/database';
import { pgCode } from '../../../db/database';
import type { AuditService } from '../../audit/public/audit.service';

/** Sets `email_norm` when the profile has none. Returns true when attached. */
export async function attachEmailIfEmpty(
  tx: Tx,
  audit: AuditService,
  input: { guestId: string; email: string; now: Date; requestId?: string },
): Promise<boolean> {
  await tx.query('SAVEPOINT guest_email');
  let attached = false;
  try {
    const r = await tx.query<{ code: string }>(
      `UPDATE guest SET email_norm = $2, updated_at = $3, version = version + 1
        WHERE id = $1 AND email_norm IS NULL RETURNING code`,
      [input.guestId, input.email, input.now],
    );
    await tx.query('RELEASE SAVEPOINT guest_email');
    const code = r.rows[0]?.code;
    if (code) {
      attached = true;
      await audit.record(tx, {
        category: 'data',
        action: 'guest.updated',
        entityType: 'guest',
        entityId: input.guestId,
        entityCode: code,
        after: { code, fields: ['email'], by: 'reservation' },
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
    }
  } catch (err) {
    await tx.query('ROLLBACK TO SAVEPOINT guest_email');
    if (pgCode(err) !== '23505') throw err;
  }
  return attached;
}

/**
 * US-039 AC2 / EP03-05 5.4 (D16, BUG-R2-041): the company invoice details given at the desk are kept on the
 * booker's profile, so the next stay starts pre-filled. Only a live profile (not merged, not anonymised);
 * nothing written when the values are already there. Audit `guest.updated` with field NAMES only (C2).
 * Returns the fields changed.
 */
export async function setInvoiceCompany(
  tx: Tx,
  audit: AuditService,
  input: { guestId: string; companyName: string; taxCode: string; now: Date; requestId?: string },
): Promise<string[]> {
  const { rows } = await tx.query<{
    code: string;
    company_name: string | null;
    tax_code: string | null;
  }>(
    `SELECT code, company_name, tax_code FROM guest
      WHERE id = $1 AND merged_into_id IS NULL AND anonymized_at IS NULL FOR UPDATE`,
    [input.guestId],
  );
  const g = rows[0];
  if (!g) return [];
  const fields: string[] = [];
  if (g.company_name !== input.companyName) fields.push('companyName');
  if (g.tax_code !== input.taxCode) fields.push('taxCode');
  if (fields.length === 0) return [];
  await tx.query(
    `UPDATE guest SET company_name = $2, tax_code = $3, updated_at = $4, version = version + 1 WHERE id = $1`,
    [input.guestId, input.companyName, input.taxCode, input.now],
  );
  await audit.record(tx, {
    category: 'data',
    action: 'guest.updated',
    entityType: 'guest',
    entityId: input.guestId,
    entityCode: g.code,
    after: { code: g.code, fields, by: 'invoice_request' },
    ...(input.requestId ? { requestId: input.requestId } : {}),
  });
  return fields;
}
