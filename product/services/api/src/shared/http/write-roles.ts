/**
 * `x-write-roles` (OpenAPI 0.3.13 bổ sung 1 (a), contract-0.3.13 mục 1.16; SEC FB-R5-SEC-ARC-02; BA ghi chú 46b):
 * per body field, the roles allowed to SEND it. Read from the generated `OperationMeta.writeRoles` by AuthGuard –
 * never a hand-written list in a service.
 *
 * - Path syntax: `a` (root field), `a.b` (child field), `a[].b` (field of every array element).
 * - "Sent" = the key is present, whatever its value: `null`, `[]`, `{}` and `0` count (contract: "kể cả `null`,
 *   mảng rỗng"). A body that is not an object sends nothing.
 * - Fail-closed on malformed bodies: an array met where the path expects an object is searched element by element,
 *   and an object met where the path expects an array (`a[]`) is searched as that one element. A wrong shape would
 *   be refused by body validation anyway, but the field gate runs BEFORE body validation and must not depend on it.
 * - Multi-role accounts: the field passes when ONE of the caller's roles is listed (union, like `x-roles`).
 */

const hasOwn = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k);

/** Path segments without the `[]` markers (an array is searched wherever it is met). */
function segments(path: string): string[] {
  return path.split('.').map((s) => (s.endsWith('[]') ? s.slice(0, -2) : s));
}

function sentAt(value: unknown, segs: readonly string[], i: number): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((el) => sentAt(el, segs, i));
  const key = segs[i] as string;
  if (!hasOwn(value, key)) return false;
  if (i === segs.length - 1) return true;
  return sentAt((value as Record<string, unknown>)[key], segs, i + 1);
}

/** True when the request body sends the field at `path` (see the file header for "sent"). */
export function bodySends(body: unknown, path: string): boolean {
  const segs = segments(path);
  if (segs.length === 0 || segs.some((s) => s === '')) {
    throw new Error(`x-write-roles: malformed field path "${path}"`);
  }
  // The root of a request body is an object: a top-level array never "sends" a named field.
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return false;
  return sentAt(body, segs, 0);
}

/**
 * Field paths of `writeRoles` the body sends while none of `roles` is listed for them – empty = the field gate
 * passes. Sorted, so the audit entry and tests are stable.
 */
export function deniedWriteFields(
  writeRoles: Readonly<Record<string, readonly string[]>> | undefined,
  roles: readonly string[],
  body: unknown,
): string[] {
  if (!writeRoles) return [];
  const denied: string[] = [];
  for (const [path, allowed] of Object.entries(writeRoles)) {
    if (roles.some((r) => allowed.includes(r))) continue;
    if (bodySends(body, path)) denied.push(path);
  }
  return denied.sort();
}
