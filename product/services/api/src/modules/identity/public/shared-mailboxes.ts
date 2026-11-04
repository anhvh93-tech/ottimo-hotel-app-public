/**
 * Shared-mailbox rule for staff security e-mail (R4 v1.0.4 P4-06 – ARC FB-R4-ARC-BA-M18-01 code part,
 * SEC FB-R4-SEC-BE-SENT-02 / BE-1 of SEC-on-info-sent-copies 4).
 *
 * A security notice must reach ONE person; a mailbox several people read (`info@`, `booking@`…) is refused as a
 * staff security e-mail (422 EMAIL_SHARED_MAILBOX). v1.0.3 compared with the EMAIL_FROM address only, so:
 * (a) `info+x@…` passed (Google Workspace still delivers it to `info@`), and (b) moving EMAIL_FROM to a send-only
 * address would have let `info@` through. The rule is now:
 *
 *   shared(address) ⇔ canonical(address) ∈ { canonical(e) | e ∈ list }
 *     list = EMAIL_SHARED_MAILBOXES (configured, comma or space separated full addresses)
 *          ∪ { `<local>@<d>` | local ∈ DEFAULT_SHARED_LOCAL_PARTS, d ∈ mail domains }
 *          ∪ { EMAIL_FROM address }            (the sending mailbox – unchanged from v1.0.3)
 *     mail domains = domains of the configured list ∪ domain of EMAIL_FROM
 *     canonical(a) = lower case, `+…` removed from the local part (`info+x@d` → `info@d`)
 *
 * The configured list does not depend on EMAIL_FROM: changing EMAIL_FROM never removes `info@` from the list.
 * The defaults are a safety net for an environment that has not set the list yet (same domain as the sender).
 * An unreadable entry in EMAIL_SHARED_MAILBOXES stops the API at start (fail loud – a typo must not silently
 * disable the rule). No address is ever logged: the error names the entry position only.
 */
import { mailboxAddress, normalizeSecurityEmail } from '../../../shared/email';

/** Local parts that are always shared at the property's mail domains (DOM M18-02: `info@`, `booking@`). */
export const DEFAULT_SHARED_LOCAL_PARTS = ['info', 'booking'] as const;

/** `Info+Desk@Example.test` → `info@example.test`. Input must already be a normalised address. */
export function canonicalMailbox(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return email.toLowerCase();
  const local = email.slice(0, at).toLowerCase();
  const plus = local.indexOf('+');
  return `${plus > 0 ? local.slice(0, plus) : local}@${email.slice(at + 1).toLowerCase()}`;
}

/**
 * EMAIL_SHARED_MAILBOXES → normalised addresses. Empty / unset → []. Throws on an entry that is not an address
 * (message carries the 1-based position only, never the value).
 */
export function parseSharedMailboxes(raw: string | undefined | null): string[] {
  const parts = (raw ?? '')
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.map((p, i) => {
    const email = normalizeSecurityEmail(p);
    if (!email) {
      throw new Error(`EMAIL_SHARED_MAILBOXES entry #${i + 1} is not a valid e-mail address`);
    }
    return email;
  });
}

export interface SharedMailboxConfig {
  /** EMAIL_SHARED_MAILBOXES (raw). */
  sharedMailboxes?: string | undefined;
  /** EMAIL_FROM (raw, `Name <addr>` or bare). */
  emailFrom?: string | undefined;
}

export class SharedMailboxRule {
  private readonly blocked: ReadonlySet<string>;
  /** True when the operator configured EMAIL_SHARED_MAILBOXES (startup warning otherwise – OPS K5b). */
  readonly configured: boolean;

  constructor(cfg: SharedMailboxConfig) {
    const listed = parseSharedMailboxes(cfg.sharedMailboxes);
    this.configured = listed.length > 0;
    const from = mailboxAddress(cfg.emailFrom);
    const fromNorm = from ? normalizeSecurityEmail(from) : null;
    const domains = new Set<string>();
    for (const e of [...listed, ...(fromNorm ? [fromNorm] : [])]) {
      domains.add(e.slice(e.lastIndexOf('@') + 1));
    }
    const all = new Set<string>();
    for (const e of listed) all.add(canonicalMailbox(e));
    for (const d of domains) {
      for (const local of DEFAULT_SHARED_LOCAL_PARTS) all.add(`${local}@${d}`);
    }
    if (from) all.add(canonicalMailbox(from));
    this.blocked = all;
  }

  /** Is this (normalised) address a shared mailbox? */
  isShared(email: string): boolean {
    return this.blocked.has(canonicalMailbox(email));
  }

  /** Number of blocked canonical addresses (ops/test only – never the addresses themselves). */
  get size(): number {
    return this.blocked.size;
  }
}
