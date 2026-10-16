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
