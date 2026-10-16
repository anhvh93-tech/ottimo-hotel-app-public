/** SR-LOG-04 free-text redaction (FB-R2-SEC-BE-13) and secret-free idempotency hash (FB-R2-SEC-BE-06). */
import { describe, expect, it } from 'vitest';
import { describeError, redactText } from '../src/shared/redact';
import { SECRET_PLACEHOLDER, withoutSecrets } from '../src/shared/secret-fields';
import { requestHash } from '../src/shared/http/unit-of-work';

describe('redactText', () => {
  it('masks test card numbers (Luhn), CCCD/CMND, passport, MRZ, e-mail and VN phone', () => {
    const text =
      'card 4111 1111 1111 1111, cccd 001099012345, cmnd 012345678, passport B1234567, ' +
      'mrz P<VNMNGUYEN<<VAN<A<<<<<<<<<<<<<<<<<<<<<<<, mail a.b@example.com, phone +84 905 123 456 / 0905123456';
    const out = redactText(text);
    for (const leaked of [
      '4111',
      '001099012345',
      '012345678',
      'B1234567',
      'NGUYEN',
      'a.b@example.com',
      '905',
    ]) {
      expect(out).not.toContain(leaked);
    }
    expect(out).toContain('[card]');
    expect(out).toContain('[email]');
  });

  it('keeps ordinary text and non-Luhn digit runs', () => {
    expect(redactText('invalid input syntax for type uuid')).toBe(
      'invalid input syntax for type uuid',
    );
    expect(redactText('order 1234567890123 failed')).toBe('order 1234567890123 failed');
  });

  it('describeError: PostgreSQL errors keep code/constraint/routine only; others are redacted', () => {
    const pg = Object.assign(new Error('Key (phone)=(+84905123456) already exists'), {
      code: '23505',
      severity: 'ERROR',
      constraint: 'guest_phone_key',
      routine: '_bt_check_unique',
      detail: 'Key (phone)=(+84905123456)',
    });
    const d = describeError(pg);
    expect(d).toBe('PostgresError code=23505 constraint=guest_phone_key routine=_bt_check_unique');
    expect(describeError(new SyntaxError('Unexpected token in JSON: a.b@example.com'))).toBe(
      'SyntaxError: Unexpected token in JSON: [email]',
    );
  });
});

describe('withoutSecrets / requestHash', () => {
  it('replaces secret fields at any depth and keeps the rest', () => {
    expect(
      withoutSecrets({ secret: 'x', note: 'n', nested: [{ currentPassword: 'y', name: 'd' }] }),
    ).toEqual({
      secret: SECRET_PLACEHOLDER,
      note: 'n',
      nested: [{ currentPassword: SECRET_PLACEHOLDER, name: 'd' }],
    });
  });

  it('same request with another password hashes the same; another field does not', () => {
    const a = requestHash('POST', '/v1/x', { secret: 'one', note: 'n' });
    expect(requestHash('POST', '/v1/x', { secret: 'two', note: 'n' })).toBe(a);
    expect(requestHash('POST', '/v1/x', { secret: 'one', note: 'm' })).not.toBe(a);
  });
});
