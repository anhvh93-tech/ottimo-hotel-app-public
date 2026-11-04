// Keys the staff PWA already names whose copy is not on `main` yet (plan v1.0.4 2.4: UXD writes them in the
// P4-01 strings batch; the app uses the exact key name meanwhile). `guard.test.ts` lets these – and only these –
// be missing from strings-*.json. Drop an entry once the UXD batch is merged and this branch is rebased on it.
// `staff.mfa_enroll_desk` (P4-50) landed with UXD P4-01 (PR #47) – nothing pending now.
export const PENDING_KEYS: Readonly<Record<string, string>> = {};
