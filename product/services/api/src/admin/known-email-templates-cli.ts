/**
 * Admin command (v1.0.4 P4-06, ARC FB-R4-ARC-OPS-PR32-06): which staff e-mail templates does THIS image render?
 * Used by `infra/server/bin/requeue-email-changed.sh` (R9) instead of importing a package path and a function name
 * that a refactor may move. No database, no network, no environment read:
 *   node dist/admin/known-email-templates-cli.js email_changed   → exit 0 known, 1 unknown (no output)
 *   node dist/admin/known-email-templates-cli.js --list          → one JSON line {"templates":[…]}, exit 0
 *   anything else                                                → exit 2 (usage on stderr)
 * The list is INT's STAFF_EMAIL_TEMPLATES (the one the dispatcher checks with isStaffEmailTemplate), so the answer
 * is exactly what the worker in the same image accepts. Template names are not personal data.
 */
import { STAFF_EMAIL_TEMPLATES, isStaffEmailTemplate } from '@ottimo/integrations/notification';

export const KNOWN_TEMPLATES_EXIT = { known: 0, unknown: 1, usage: 2 } as const;

export function knownEmailTemplates(argv: readonly string[]): { code: number; stdout?: string } {
  if (argv.length !== 1 || !argv[0]) return { code: KNOWN_TEMPLATES_EXIT.usage };
  const a = argv[0];
  if (a === '--list') {
    return {
      code: KNOWN_TEMPLATES_EXIT.known,
      stdout: JSON.stringify({ templates: [...STAFF_EMAIL_TEMPLATES] }),
    };
  }
  return {
    code: isStaffEmailTemplate(a) ? KNOWN_TEMPLATES_EXIT.known : KNOWN_TEMPLATES_EXIT.unknown,
  };
}

if (require.main === module) {
  const out = knownEmailTemplates(process.argv.slice(2));
  if (out.stdout) console.log(out.stdout);
  if (out.code === KNOWN_TEMPLATES_EXIT.usage) {
    console.error('usage: known-email-templates-cli.js <template> | --list');
  }
  process.exitCode = out.code;
}
