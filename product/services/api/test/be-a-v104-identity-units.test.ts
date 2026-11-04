/**
 * R4 v1.0.4 P4-06 (BE-A) – no database: shared-mailbox rule (SEC SENT-02, ARC M18-01), EM-09 constants,
 * dispatcher params (G-BE-4), known-templates command (ARC PR32-06), ProblemError.auditReason (ARC-BE-31-04),
 * bootstrap --owner-email flag (V3-04), noStore on 2FA C3 answers (SEC 018-04). Fake addresses only (.test).
 */
import { STAFF_EMAIL_TEMPLATES } from '@ottimo/integrations/notification';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ownerEmailFlag } from '../src/admin/production-bootstrap-cli';
import { KNOWN_TEMPLATES_EXIT, knownEmailTemplates } from '../src/admin/known-email-templates-cli';
import { paramsFor } from '../src/jobs/email-dispatch';
import { EMAIL_CHANGE_LIMIT } from '../src/modules/identity/internal/security-email.service';
import {
  DEFAULT_SHARED_LOCAL_PARTS,
  SharedMailboxRule,
  canonicalMailbox,
  parseSharedMailboxes,
} from '../src/modules/identity/public/shared-mailboxes';
import { problem } from '../src/shared/problem';

describe('shared-mailbox rule (SEC SENT-02 / ARC M18-01)', () => {
  it('canonical form: lower case, `+…` removed from the local part only', () => {
    expect(canonicalMailbox('Info+Desk@Example.TEST')).toBe('info@example.test');
    expect(canonicalMailbox('info@example.test')).toBe('info@example.test');
    expect(canonicalMailbox('a.b+c+d@x.example.test')).toBe('a.b@x.example.test');
    // a leading `+` is not a tag
    expect(canonicalMailbox('+x@example.test')).toBe('+x@example.test');
  });

  it('EMAIL_SHARED_MAILBOXES: comma / space / semicolon separated; a bad entry stops start-up without echoing it', () => {
    expect(parseSharedMailboxes(undefined)).toEqual([]);
    expect(parseSharedMailboxes('  ')).toEqual([]);
    expect(
      parseSharedMailboxes(' Info@Example.test, booking@example.test;desk@example.test '),
    ).toEqual(['info@example.test', 'booking@example.test', 'desk@example.test']);
    let msg = '';
    try {
      parseSharedMailboxes('info@example.test, secret-typo@@example.test');
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain('#2');
    expect(msg).not.toContain('secret-typo');
  });

  it('changing EMAIL_FROM still refuses info@ (configured list is independent of EMAIL_FROM)', () => {
    const list = 'info@example.test,booking@example.test';
    for (const from of [
      'OTTIMO <info@example.test>',
      'noreply@example.test',
      'alerts@other.example.test',
    ]) {
      const r = new SharedMailboxRule({ sharedMailboxes: list, emailFrom: from });
      expect({ from, info: r.isShared('info@example.test') }).toEqual({ from, info: true });
      expect(r.isShared('info+x@example.test')).toBe(true);
      expect(r.isShared('booking@example.test')).toBe(true);
    }
  });

  it('EMAIL_FROM is always in the list (+ its `+…` forms)', () => {
    const r = new SharedMailboxRule({
      sharedMailboxes: 'desk@example.test',
      emailFrom: 'OTTIMO <noreply@example.test>',
    });
    expect(r.isShared('noreply@example.test')).toBe(true);
    expect(r.isShared('noreply+a@example.test')).toBe(true);
    expect(r.isShared('desk+1@example.test')).toBe(true);
  });

  it('defaults info@ / booking@ at every mail domain (list domains + EMAIL_FROM domain) when nothing more is configured', () => {
    expect(DEFAULT_SHARED_LOCAL_PARTS).toEqual(['info', 'booking']);
    const onlyFrom = new SharedMailboxRule({ emailFrom: 'noreply@example.test' });
    expect(onlyFrom.configured).toBe(false);
    expect(onlyFrom.isShared('info@example.test')).toBe(true);
    expect(onlyFrom.isShared('Booking+OTA@example.test'.toLowerCase())).toBe(true);
    const listOtherDomain = new SharedMailboxRule({ sharedMailboxes: 'desk@hotel.example.test' });
    expect(listOtherDomain.configured).toBe(true);
    expect(listOtherDomain.isShared('info@hotel.example.test')).toBe(true);
  });

  it("personal addresses pass; another domain's info@ passes; nothing configured = nothing checked (dev/CI)", () => {
    const r = new SharedMailboxRule({
      sharedMailboxes: 'info@example.test',
      emailFrom: 'info@example.test',
    });
    for (const ok of [
      'fd.le@example.test',
      'information@example.test',
      'info@personal.example.test',
      'infox@example.test',
    ]) {
      expect({ ok, shared: r.isShared(ok) }).toEqual({ ok, shared: false });
    }
    const none = new SharedMailboxRule({});
    expect(none.size).toBe(0);
    expect(none.isShared('info@example.test')).toBe(false);
  });
});

describe('EM-09 constant (SEC FB-R4-SEC-ARC-EM-09)', () => {
  it('5 real changes per person per sliding 24 h', () => {
    expect(EMAIL_CHANGE_LIMIT).toEqual({ max: 5, windowMs: 86_400_000 });
  });
});

describe('dispatcher params per audience (G-BE-4 / INT FB-R4-INT-BE-31-05)', () => {
  const base = { occurredAt: '03/11/2026 09:00 (GMT+7)', staffName: 'Lễ tân A', via: 'self' };
  it('owner keeps staffName; self and previous never carry it', () => {
    expect(paramsFor(base, 'owner')).toEqual({ ...base, audience: 'owner' });
    for (const a of ['self', 'previous'] as const) {
      const out = paramsFor(base, a);
      expect('staffName' in out).toBe(false);
      expect(out).toEqual({ occurredAt: base.occurredAt, via: 'self', audience: a });
    }
    // input not mutated (one params object serves every copy of the row)
    expect(base.staffName).toBe('Lễ tân A');
  });
});

describe('known-email-templates command (ARC FB-R4-ARC-OPS-PR32-06)', () => {
  it('email_changed is known; an unknown name → 1; --list → the INT list; bad usage → 2', () => {
    expect(knownEmailTemplates(['email_changed'])).toEqual({ code: KNOWN_TEMPLATES_EXIT.known });
    expect(knownEmailTemplates(['no_such_template'])).toEqual({
      code: KNOWN_TEMPLATES_EXIT.unknown,
    });
    const list = knownEmailTemplates(['--list']);
    expect(list.code).toBe(0);
    expect(JSON.parse(list.stdout!)).toEqual({ templates: [...STAFF_EMAIL_TEMPLATES] });
    expect(knownEmailTemplates([]).code).toBe(KNOWN_TEMPLATES_EXIT.usage);
    expect(knownEmailTemplates(['a', 'b']).code).toBe(KNOWN_TEMPLATES_EXIT.usage);
  });

  it('is built to dist/admin/known-email-templates-cli.js (the path requeue-email-changed.sh will call)', () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'admin', 'known-email-templates-cli.ts'),
      'utf8',
    );
    expect(src).toContain('require.main === module');
    // no database, no environment: safe to run in the worker container at any time
    expect(src).not.toMatch(/process\.env|DATABASE_URL|createPool/);
  });
});

describe('ProblemError.auditReason (ARC FB-R4-ARC-BE-31-04)', () => {
  it('is kept on the error and never serialised into the body', () => {
    const err = problem('FORBIDDEN_ACTION', {
      detail: 'other property',
      auditReason: 'TARGET_OWNER',
    });
    expect(err.options.auditReason).toBe('TARGET_OWNER');
    const body = JSON.stringify(err.toBody('req-1'));
    expect(body).not.toContain('TARGET_OWNER');
    expect(body).not.toContain('auditReason');
  });

  it('users.service no longer keeps a WeakSet of denials', () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'modules', 'identity', 'internal', 'users.service.ts'),
      'utf8',
    );
    expect(src).not.toContain('WeakSet');
  });
});

describe('production-bootstrap --owner-email (V3-04)', () => {
  it('is a flag without a value (the address is asked at a hidden prompt, never on the command line)', () => {
    expect(ownerEmailFlag(['node', 'cli', '--owner-username', 'own'])).toBe(false);
    expect(ownerEmailFlag(['node', 'cli', '--owner-email'])).toBe(true);
    expect(ownerEmailFlag(['node', 'cli', '--owner-email', '--operator', 'ops'])).toBe(true);
    expect(() => ownerEmailFlag(['node', 'cli', '--owner-email', 'own@example.test'])).toThrow(
      /no value/,
    );
  });
});

describe('2FA C3 answers use noStore() (SEC FB-R4-SEC-BE-018-04)', () => {
  it('startSetup / confirm / regenerate call noStore (Cache-Control + Pragma)', () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'modules', 'identity', 'internal', 'mfa.controller.ts'),
      'utf8',
    );
    for (const op of ['startMy2faSetup', 'confirmMy2fa', 'regenerateMyRecoveryCodes']) {
      const at = src.indexOf(`@Operation('${op}')`);
      expect(at, op).toBeGreaterThan(0);
      const next = src.indexOf('@Operation(', at + 1);
      const body = src.slice(at, next < 0 ? undefined : next);
      expect({ op, noStore: body.includes('noStore(reply)') }).toEqual({ op, noStore: true });
    }
  });
});
