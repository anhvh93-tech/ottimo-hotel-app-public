// Keys the staff PWA already names whose copy is not on `main` yet (plan v1.0.4 2.4: UXD writes them in the
// P4-01 strings batch; the app uses the exact key name meanwhile). `guard.test.ts` lets these – and only these –
// be missing from strings-*.json. Drop an entry once the UXD batch is merged and this branch is rebased on it.
export const PENDING_KEYS: Readonly<Record<string, string>> = {
  // FB-R4-UXD-MOB-P450-01 – wording approved in UXD-on-v104-p4-50; in UXD P4-01 (`v104/uxd-strings`).
  'staff.mfa_enroll_desk': 'UXD P4-01 (v1.0.4 P4-50)',
};
