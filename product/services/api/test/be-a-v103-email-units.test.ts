/**
 * R4 v1.0.3 (BUG-R3-032) – staff security e-mail helpers, no database.
 * SEC FB-R4-SEC-ARC-EM-05: ONE rule for the API; every address it accepts must also be accepted by the SMTP adapter
 * (`isEmailAddress`) and fully masked by the log redactor (`redactText`). Fake addresses only (.test / example).
 */
import { STAFF_EMAIL_TEMPLATES, isEmailAddress } from '@ottimo/integrations/notification';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STRONG_REAUTH_OPERATIONS } from '../src/modules/identity/public/strong-reauth';
import {
  EMAIL_CHANGED_TEMPLATE,
  mailboxAddress,
  maskEmail,
  normalizeSecurityEmail,
} from '../src/shared/email';
import { redactText } from '../src/shared/redact';

const VALID: Array<[string, string]> = [
  ['owner@example.test', 'owner@example.test'],
  ['  Owner@Example.TEST ', 'owner@example.test'],
  ['fd.le+desk@mail.example.test', 'fd.le+desk@mail.example.test'],
  ['a_b-c%d@sub-1.example.test', 'a_b-c%d@sub-1.example.test'],
  [`${'a'.repeat(64)}@example.test`, `${'a'.repeat(64)}@example.test`],
];

const INVALID = [
  '',
  '   ',
  'nope',
  '@example.test',
  'owner@',
  'owner@@example.test',
  'a@b.c,d@e.f',
  '"x"@example.test',
  'nguyễn@example.test',
  'owner@exämple.test',
  'a@localhost',
  'a b@example.test',
  'a@example.t',
  'a@example.123',
  'a@-',
  'owner@example.test\u0000',
  'own\ter@example.test',
  'owner@example.test\r\nBcc: x@example.test',
  `${'a'.repeat(65)}@example.test`,
  `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(57)}.test`, // 255 characters
  'a<b>@example.test',
  'a;b@example.test',
];

describe('normalizeSecurityEmail (V-03 for staff security e-mail, SEC EM-05)', () => {
  it.each(VALID)('accepts %j → %j', (raw, norm) => {
    expect(normalizeSecurityEmail(raw)).toBe(norm);
  });

  it.each(INVALID)('refuses %j', (raw) => {
    expect(normalizeSecurityEmail(raw)).toBeNull();
  });

  it('255 characters is refused, 254 accepted', () => {
    const at254 = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(56)}.test`;
    expect(at254).toHaveLength(254);
    expect(normalizeSecurityEmail(at254)).toBe(at254);
    expect(INVALID[19]).toHaveLength(255);
  });

  it('every accepted address is accepted by the SMTP adapter and fully masked by the log redactor', () => {
    const accepted = [...VALID.map(([raw]) => raw), ...INVALID]
      .map((raw) => normalizeSecurityEmail(raw))
      .filter((v): v is string => v !== null);
    expect(accepted.length).toBe(VALID.length);
    for (const email of accepted) {
      expect(isEmailAddress(email), email).toBe(true);
      expect(redactText(`to=${email} next`), email).toBe('to=[email] next');
    }
  });
});

describe('maskEmail / mailboxAddress', () => {
  it('masks to the first letter of each part + the last suffix only', () => {
    expect(maskEmail('owner@example.test')).toBe('o***@e***.test');
    expect(maskEmail('a@mail.example.test')).toBe('a***@m***.test');
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail('')).toBeNull();
    expect(maskEmail('owner@example.test')).not.toContain('owner');
  });

  it('EMAIL_FROM: display-name form, bare form, unset', () => {
    expect(mailboxAddress('OTTIMO Desk <Info@Example.TEST>')).toBe('info@example.test');
    expect(mailboxAddress(' info@example.test ')).toBe('info@example.test');
    expect(mailboxAddress('')).toBeNull();
    expect(mailboxAddress(undefined)).toBeNull();
  });
});

describe('EMAIL_CHANGED_TEMPLATE (ARC FB-R4-ARC-BE-31-05)', () => {
  it('is one of the templates INT can render, and is declared once in src', () => {
    expect(STAFF_EMAIL_TEMPLATES).toContain(EMAIL_CHANGED_TEMPLATE);
    const src = join(__dirname, '..', 'src');
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
      });
    const declared = walk(src).filter((f) =>
      /export const EMAIL_CHANGED_TEMPLATE\b/.test(readFileSync(f, 'utf8')),
    );
    expect(declared.map((f) => f.slice(src.length + 1))).toEqual(['shared/email.ts']);
  });
});

describe('T17 – S2 list', () => {
  it('setMyEmail is an S2 operation (the spec comparison lives in be-c-r3-s1-units)', () => {
    expect(STRONG_REAUTH_OPERATIONS).toContain('setMyEmail');
  });
});
