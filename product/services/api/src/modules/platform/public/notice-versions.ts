/**
 * Versions of the guest data-processing notice that have a text on every surface: guest-web
 * (`apps/guest-web/src/app/config.ts` NOTICE_TEXT_VERSIONS + `gen_strings.py` group "v1.0.4 P4-42") and
 * the printed desk sheet. setParameter accepts only these for `privacy_notice_version` (SEC-BA-104-09 a).
 * Must equal guest-web's list (guard test `test/v104-notice-allowlist.test.ts` G1). Adding a version =
 * text + SEC sign-off + release, never config. `privacy-2026-10-v1` is deliberately absent: guest-web
 * v1.0.4 no longer carries its text, so accepting it would let the desk record consent against a notice
 * the guest page cannot show (ARC v1.0.4 notice-version allowlist 2.3).
 * Exactly one version until SEC-BA-104-09 (b) – a bounded same-day override – is merged and SEC-approved
 * (guard test G3, SEC P416-01, decision-log 04/11): with two listed versions, a wrong save today could not
 * be corrected the same day.
 */
export const NOTICE_TEXT_VERSIONS: readonly string[] = Object.freeze(['privacy-2026-10-v2']);
