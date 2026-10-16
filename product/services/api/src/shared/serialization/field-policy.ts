/**
 * Field-level visibility for staff roles (rbac-matrix 6, SR-AZ-04).
 *
 * Two contract sources, both must allow a property:
 * - `x-visible-to` on the property (ARC) – the explicit role list;
 * - `x-rbac-field` (D01…D29) – the data code of rbac-matrix.md section 6. The table below lists, per
 *   code, the staff roles whose cell is **K** ("không thấy – trường không trả về từ API"). Cells with a
 *   scope (M = own, T = today, Q = trusted device, 4S = last 4) are NOT denied here: row scope is applied
 *   in SQL (x-scope) and masking by the endpoint. Defense in depth: a property tagged with a D-code is
 *   removed for a K role even when ARC forgot `x-visible-to`.
 *
 * Source: rbac-matrix.md v0.2.1 section 6 (BA, 16/10/2026). A D-code used in openapi.yaml that is
 * missing here fails test/serializer.test.ts, so a new code cannot slip through unreviewed.
 */

const HK = 'housekeeping';
const MT = 'maintenance';
const SAL = 'sales_staff';
const CTV = 'collaborator';
const FDL = 'front_desk_lead';
const FD = 'front_desk';
const ALL_STAFF = ['owner', 'manager', FDL, FD, HK, MT, SAL, CTV] as const;

/** D-code → staff roles that must never receive the property (cell K in rbac-matrix 6). */
export const RBAC_FIELD_DENY: Readonly<Record<string, readonly string[]>> = {
  D01: [MT], // name, DOB, gender, nationality – HK "Tên+căn (T)", SAL/CTV "Tên + quốc tịch (M)"
  D02: [HK, MT], // phone, chat, e-mail
  D03: [HK, MT, SAL, CTV], // ID number (C3)
  D04: [HK, MT, SAL, CTV], // passport (C3)
  D05: [HK, MT, SAL, CTV], // visa / entry (C3)
  D06: [HK, MT, SAL, CTV], // document images (C3)
  D07: [HK, MT, SAL, CTV], // address (C3)
  D09: [HK, MT, SAL, CTV], // children data (C3)
  D10: [HK, MT, SAL, CTV], // companions: name, relationship, contact (HK/SAL/CTV get the count only)
  D11: [MT], // stay history
  D12a: [MT, CTV], // service tags / notes
  D12b: [HK, MT, SAL, CTV], // health notes (HK sees a generic label, not the field)
  D12c: [HK, MT, SAL, CTV], // free notes
  D13: [...ALL_STAFF], // card data – never stored, never returned
  D14: [HK, MT, CTV], // payment result
  D15: [HK, MT, SAL, CTV], // guest refund bank account (C3)
  D16: [HK, MT, SAL, CTV], // invoice data
  D17: [HK, MT], // long-stay contract
  D18: [HK, SAL, CTV], // meter readings (MT: readings + room, no name)
  D19: [HK, MT, SAL, CTV], // OTA booking reference
  D20: [HK, MT, SAL, CTV], // consent records
  D21: [...ALL_STAFF], // fingerprints – never stored
  D22: [HK, MT, SAL, CTV], // door codes (C3)
  D23: [SAL, CTV], // guest-app requests / messages
  D25: [HK, MT, SAL, CTV], // guest link token
  D26: [FDL, FD, HK, MT], // CTV/Sale payee account (SAL/CTV: own)
  D27: [HK, MT, SAL, CTV], // staff accounts, activity log (FDL/FD: own log)
  D28: [HK, MT], // leads
  D29: [HK, MT, SAL, CTV], // guest warnings / blacklist
};

/** True when at least one of `roles` may receive a property tagged with `code`. Unknown code → hidden. */
export function rbacFieldAllows(code: string, roles: readonly string[]): boolean {
  const deny = RBAC_FIELD_DENY[code];
  if (!deny) return false; // fail closed: an unreviewed code is not returned
  return roles.some((r) => !deny.includes(r));
}

/** x-visible-to: at least one role listed. */
export function visibleToAllows(visibleTo: readonly string[], roles: readonly string[]): boolean {
  return roles.some((r) => visibleTo.includes(r));
}
