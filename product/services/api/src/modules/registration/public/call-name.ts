/**
 * BR-614 (DOM 18/10, UXR P-33; rbac D01 "Tên + căn"): the name the housekeeping screens show – the guest's CALL
 * name, never the full name (data minimisation, NĐ 13/2023). Rule: a call name the guest gave (none in R2); else a
 * foreign guest's SURNAME as printed on their document (passport name = "SURNAME GIVEN": "KIM MIN JUN" → "Kim"),
 * else the last word of the name (Vietnamese order: "Phạm Gia Huy" → "Huy"; a name that cannot be split the same).
 * No name → null (the screen shows the room number only).
 *
 * Only ONE word per booking leaves the registration module (`bookerDocSurnames`), and only from the document the
 * desk linked to the booker (`guest_document.guest_id`, SEC BE-73 / ARC 16.22) – never from a document of another
 * person of the party.
 */
import type { Tx } from '../../../db/database';

/** "KIM" → "Kim", "o'NEIL" → "O'neil": first letter upper case, the rest lower case (any script). */
function titleCase(word: string): string {
  const lower = word.toLocaleLowerCase('vi');
  return lower.charAt(0).toLocaleUpperCase('vi') + lower.slice(1);
}

/** BR-614 call name from the profile name and, for a foreign guest, the surname on their document. */
export function callName(
  fullName: string | null | undefined,
  surnameOnDoc?: string | null,
): string | null {
  if (surnameOnDoc && surnameOnDoc.trim()) return surnameOnDoc.trim();
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return words.at(-1) ?? null;
}

/**
 * Surname (first word, title case) on the FOREIGN document linked to the booker of each root booking – the
 * registration of a booking is kept on its root (`registration.reservation_id`). Live documents only.
 */
export async function bookerDocSurnames(
  tx: Tx,
  rootReservationIds: readonly string[],
): Promise<Map<string, string>> {
  if (rootReservationIds.length === 0) return new Map();
  const { rows } = await tx.query<{ reservation_id: string; name: string }>(
    `SELECT x.reservation_id, d.full_name_on_doc AS name
       FROM guest_document d JOIN registration x ON x.id = d.registration_id
      WHERE x.reservation_id = ANY($1::uuid[]) AND d.guest_id IS NOT NULL AND d.is_foreigner
        AND d.removed_at IS NULL AND d.purged_at IS NULL AND d.full_name_on_doc IS NOT NULL`,
    [[...rootReservationIds]],
  );
  const out = new Map<string, string>();
  for (const r of rows) {
    const first = r.name.trim().split(/\s+/)[0];
    if (first) out.set(r.reservation_id, titleCase(first));
  }
  return out;
}
