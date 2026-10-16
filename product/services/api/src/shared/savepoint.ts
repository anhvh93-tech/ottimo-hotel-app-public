/**
 * Run one item of a batch inside a SAVEPOINT (ARC FB-R2-ARC-BE-S3-27, SEC FB-R2-SEC-BE-46): a failing item
 * is rolled back alone and reported, the batch transaction goes on – one "poison" row never blocks a job.
 * Returns the error (never rethrown) or null.
 */
import type { Tx } from '../db/database';

let seq = 0;

export async function inSavepoint(tx: Tx, fn: () => Promise<void>): Promise<Error | null> {
  seq = (seq + 1) % 1_000_000;
  const name = `sp_item_${seq}`;
  await tx.query(`SAVEPOINT ${name}`);
  try {
    await fn();
    await tx.query(`RELEASE SAVEPOINT ${name}`);
    return null;
  } catch (err) {
    await tx.query(`ROLLBACK TO SAVEPOINT ${name}`);
    return err instanceof Error ? err : new Error('item failed');
  }
}
