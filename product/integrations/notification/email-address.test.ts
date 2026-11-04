// THE address rule (FB-R4-INT-BE-31-04). Fake addresses only (.test / example) – no real mailbox anywhere.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EMAIL_ADDRESS_MAX, isEmailAddress, normalizeEmailAddress } from './email-address.js';

// Same table as services/api/test/be-a-v103-email-units.test.ts (v1.0.3 `normalizeSecurityEmail`), so the move
// to one shared function changes nothing for stored or typed addresses.
const VALID: Array<[string, string]> = [
  ['owner@example.test', 'owner@example.test'],
  ['  Owner@Example.TEST ', 'owner@example.test'],
  ['fd.le+desk@mail.example.test', 'fd.le+desk@mail.example.test'],
  ['a_b-c%d@sub-1.example.test', 'a_b-c%d@sub-1.example.test'],
  [`${'a'.repeat(64)}@example.test`, `${'a'.repeat(64)}@example.test`],
  ['a@b.co', 'a@b.co'],
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
  'a@b',
  'owner@example.test\u0000',
  'own\ter@example.test',
  'owner@example.test\r\nBcc: x@example.test',
  `${'a'.repeat(65)}@example.test`,
  `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(57)}.test`, // 255 characters
  'a<b>@example.test',
  'a;b@example.test',
  'OTTIMO <info@example.test>',
  'x@y.test\r\nBcc: z@y.test',
];

describe('normalizeEmailAddress – the one rule (API stores what this returns)', () => {
  it.each(VALID)('accepts %j → %j', (raw, norm) => {
    expect(normalizeEmailAddress(raw)).toBe(norm);
  });

  it.each(INVALID)('refuses %j', (raw) => {
    expect(normalizeEmailAddress(raw)).toBeNull();
  });

  it('length limit is 254 (RFC 5321 path), the boundary itself passes', () => {
    const at254 = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(56)}.test`;
    expect(at254).toHaveLength(EMAIL_ADDRESS_MAX);
    expect(normalizeEmailAddress(at254)).toBe(at254);
  });

  it('is idempotent: a stored address normalises to itself', () => {
    for (const [, norm] of VALID) expect(normalizeEmailAddress(norm)).toBe(norm);
  });

  it('non-string input (bad JSON body, missing column) is refused, not thrown', () => {
    for (const v of [undefined, null, 42, {}, ['a@b.test']]) {
      expect(normalizeEmailAddress(v as unknown as string)).toBeNull();
      expect(isEmailAddress(v as unknown as string)).toBe(false);
    }
  });
});

describe('isEmailAddress – check only (SMTP adapter, EMAIL_FROM, EMAIL_SMTP_USER, mail-test.mjs)', () => {
  it('every address the API stores passes the adapter check (SEC EM-05: API set ⊆ adapter set)', () => {
    for (const [raw, norm] of VALID) {
      expect(isEmailAddress(norm), raw).toBe(true);
    }
  });

  it('the adapter set is the API set: anything the rule refuses, the adapter refuses (v1.0.4 tightening)', () => {
    for (const raw of INVALID) expect(isEmailAddress(raw), JSON.stringify(raw)).toBe(false);
  });

  it('letter case is not part of the rule; surrounding whitespace is refused, never trimmed', () => {
    expect(isEmailAddress('Info@Example.test')).toBe(true);
    expect(isEmailAddress(' owner@example.test')).toBe(false);
    expect(isEmailAddress('owner@example.test ')).toBe(false);
    expect(isEmailAddress('owner@example.test\n')).toBe(false);
    expect(isEmailAddress('owner@example.test\r\n')).toBe(false);
    expect(isEmailAddress('\towner@example.test')).toBe(false);
  });

  it('nothing that could split or add a header ever passes', () => {
    for (const bad of ['\r', '\n', ' ', '<', '>', '"', ',', ';', '\u0085', ' ']) {
      expect(isEmailAddress(`a${bad}b@example.test`), JSON.stringify(bad)).toBe(false);
      expect(isEmailAddress(`ab@exa${bad}mple.test`), JSON.stringify(bad)).toBe(false);
    }
  });
});

// `ops-check email_ascii` counts stored addresses outside this rule, in SQL (infra/server/bin/ops-check.sh). The
// adapter is strict since v1.0.4 because that count was 0 – the two must stay the same rule.
// The script is a declared input of this package's test task (integrations/turbo.json, BUG-R4-029): editing it
// re-runs this test instead of replaying a cached green.
const OPS_CHECK = new URL('../../infra/server/bin/ops-check.sh', import.meta.url);

// Since P4-04 the SQL writes `a.e ~ '$EMAIL_RULE_RE'` (one shell constant shared with email_rule / email_config).
// A captured `$NAME` / `${NAME}` is resolved to the single top-level `NAME='…'` of the script (BUG-R4-031); a
// literal pattern is used as is.
function shellValue(src: string, captured: string): string | undefined {
  const ref = /^\$\{?([A-Z_][A-Z0-9_]*)\}?$/.exec(captured);
  if (!ref) return captured;
  const defs = [...src.matchAll(new RegExp(`^${ref[1]}='([^']*)'$`, 'gm'))];
  expect(defs.length, `exactly one ${ref[1]}='…' in ops-check.sh`).toBe(1);
  return defs[0]![1];
}

describe('parity with ops-check email_ascii (SQL copy of the rule)', () => {
  it('the SQL pattern accepts and refuses exactly what normalizeEmailAddress does on the case table', () => {
    // No silent skip: if ops-check.sh moves, this fails and the new path goes here and in integrations/turbo.json.
    const src = readFileSync(OPS_CHECK, 'utf8');
    const fn = /check_email_ascii\(\)[\s\S]*?\n}\n/.exec(src)?.[0] ?? '';
    expect(fn, 'check_email_ascii() not found in ops-check.sh').not.toBe('');
    const captured = /a\.e ~ '([^']+)'/.exec(fn)?.[1];
    const len = /char_length\(a\.e\) BETWEEN (\d+) AND (\d+)/.exec(fn);
    expect(captured, 'regex of email_ascii not found').toBeDefined();
    expect(len, 'length bounds of email_ascii not found').not.toBeNull();
    const pattern = shellValue(src, captured as string);
    expect(pattern, 'value of the email_ascii regex').toMatch(/^\^.*\$$/);
    const re = new RegExp(pattern as string);
    const [min, max] = [Number(len![1]), Number(len![2])];
    // SQL: lower(btrim(email)) – btrim strips spaces only; blank values are not counted (email_missing).
    const sqlAccepts = (raw: string) => {
      const e = raw.replace(/^ +| +$/g, '').toLowerCase();
      return e === '' || (e.length >= min && e.length <= max && re.test(e));
    };
    for (const [raw] of VALID) expect(sqlAccepts(raw), raw).toBe(true);
    for (const raw of INVALID) {
      if (raw.trim() === '') continue; // blank = no address: email_missing, not email_ascii
      expect(sqlAccepts(raw), JSON.stringify(raw)).toBe(normalizeEmailAddress(raw) !== null);
    }
  });

  it('email_rule (bash, email_config) uses the same constant and the same length bounds as the SQL', () => {
    const src = readFileSync(OPS_CHECK, 'utf8');
    const sql = /check_email_ascii\(\)[\s\S]*?\n}\n/.exec(src)?.[0] ?? '';
    const bash = /^email_rule\(\) \{[\s\S]*?\n}\n/m.exec(src)?.[0] ?? '';
    expect(bash, 'email_rule() not found in ops-check.sh').not.toBe('');
    expect(bash).toContain('"$EMAIL_RULE_RE"');
    expect(sql).toContain("a.e ~ '$EMAIL_RULE_RE'");
    const sqlLen = /char_length\(a\.e\) BETWEEN (\d+) AND (\d+)/.exec(sql);
    const bashLen = /"\$\{#1\}" -ge (\d+) \] && \[ "\$\{#1\}" -le (\d+)/.exec(bash);
    expect(bashLen, 'length bounds of email_rule not found').not.toBeNull();
    expect([bashLen![1], bashLen![2]]).toEqual([sqlLen![1], sqlLen![2]]);
    expect(Number(bashLen![2])).toBe(EMAIL_ADDRESS_MAX);
  });
});
