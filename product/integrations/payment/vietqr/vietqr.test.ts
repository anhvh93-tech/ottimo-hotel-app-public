import { describe, expect, it } from 'vitest';
import { IntegrationError, isoInstant, type IntegrationContext } from '../../contracts/common.js';
import { encodeQr } from '../../qr/encoder.js';
import { VietQrPaymentAdapter } from './adapter.js';
import {
  buildVietQrPayload,
  crc16Ccitt,
  normalizeTransferContent,
  parseEmvTlv,
  toBankName,
  verifyEmvCrc,
} from './emvco.js';

const ctx: IntegrationContext = {
  propertyId: 'p-ottimo',
  credentialsRef: 'param:payment_receiving_account', // VietQR has no secret
  requestId: 'req-1',
};

// Test-only account (not a real account).
const ACC = {
  bankBin: '970436',
  accountNo: '0123456789',
  accountName: 'Công ty TNHH Ottimo Đà Lạt',
};

/** Reference built by hand and CRC computed independently with Python binascii.crc_hqx(…, 0xFFFF). */
const VECTOR =
  '00020101021238540010A00000072701240006970436011001234567890208QRIBFTTA5303704540716000005802VN62120808OTM0017163046ABE';

describe('crc16Ccitt (CRC-16/CCITT-FALSE)', () => {
  it('standard check value "123456789" → 29B1', () => {
    expect(crc16Ccitt('123456789')).toBe('29B1');
  });

  it('EMVCo QRCPS-MPM v1.1 appendix example (UTF-8 multi-language payload) → A13A', () => {
    const emvExample =
      '00020101021229300012D156000000000510A93FO3230Q31280012D15600000001030812345678520441115802CN5914BEST TRANSPORT6007BEIJING64200002ZH0104最佳运输0202北京540523.7253031565502016233030412340603***0708A60086670902ME91320016A0112233449988770708123456786304';
    expect(crc16Ccitt(emvExample)).toBe('A13A');
  });
});

describe('buildVietQrPayload', () => {
  it('matches the reference vector byte for byte', () => {
    expect(
      buildVietQrPayload({
        bankBin: ACC.bankBin,
        accountNo: ACC.accountNo,
        amountVnd: 1_600_000,
        transferContent: 'OTM00171',
      }),
    ).toBe(VECTOR);
  });

  it('has the NAPAS structure and a valid CRC', () => {
    expect(verifyEmvCrc(VECTOR)).toBe(true);
    const top = parseEmvTlv(VECTOR);
    expect(top.get('00')).toBe('01');
    expect(top.get('01')).toBe('12');
    expect(top.get('53')).toBe('704');
    expect(top.get('54')).toBe('1600000');
    expect(top.get('58')).toBe('VN');
    expect(top.has('59')).toBe(false); // no name in the payload
    const merchant = parseEmvTlv(top.get('38') as string);
    expect(merchant.get('00')).toBe('A000000727');
    expect(merchant.get('02')).toBe('QRIBFTTA');
    const ben = parseEmvTlv(merchant.get('01') as string);
    expect(ben.get('00')).toBe('970436');
    expect(ben.get('01')).toBe('0123456789');
    expect(parseEmvTlv(top.get('62') as string).get('08')).toBe('OTM00171');
  });

  it('a tampered payload fails the CRC check', () => {
    expect(verifyEmvCrc(VECTOR.replace('1600000', '9600000'))).toBe(false);
  });

  it.each([0, -1, 1.5, 12_345_678_901_234, Number.NaN])('refuses amount %s', (amountVnd) => {
    expect(() =>
      buildVietQrPayload({ ...ACC, amountVnd, transferContent: 'OTM00171' }),
    ).toThrowError(IntegrationError);
  });

  it('refuses non-normalised content', () => {
    expect(() =>
      buildVietQrPayload({ ...ACC, amountVnd: 1000, transferContent: 'OTM-00171' }),
    ).toThrow(/normalised/);
  });

  it('fits a version ≤ 10 QR even at the longest content/account/amount', () => {
    const p = buildVietQrPayload({
      bankBin: '970436',
      accountNo: 'A'.repeat(19),
      amountVnd: 9_999_999_999_999,
      transferContent: 'X'.repeat(25),
    });
    expect(encodeQr(p, { ecc: 'M' }).version).toBeLessThanOrEqual(10);
  });
});

describe('normalizeTransferContent (SEC F1)', () => {
  it.each([
    ['OTM-00171', 'OTM00171'],
    ['f26-000123', 'F26000123'],
    [' OTM 00171 ', 'OTM00171'],
    ['PT_000045', 'PT000045'],
  ])('%s → %s', (input, out) => {
    expect(normalizeTransferContent(input)).toBe(out);
  });

  it.each([
    '',
    'Nguyễn Văn A',
    '+84901234567',
    'OTM00171 tien coc phong 202 khach',
    '4111111111111111',
  ])('refuses %j', (input) => {
    expect(() => normalizeTransferContent(input)).toThrowError(IntegrationError);
  });
});

describe('helpers', () => {
  it('toBankName strips Vietnamese marks', () => {
    expect(toBankName(ACC.accountName)).toBe('CONG TY TNHH OTTIMO DA LAT');
  });
  it('no second account mask in INT (one mask = BE-B maskedAccountNo, FB-R2-ARC-BE-S3-29)', async () => {
    expect(Object.keys(await import('./emvco.js'))).not.toContain('maskAccountNo');
  });
});

describe('VietQrPaymentAdapter', () => {
  const now = () => isoInstant('2026-10-17T08:30:00+07:00');

  it('uses payment_receiving_account (the only source)', async () => {
    const a = new VietQrPaymentAdapter({ receivingAccount: async () => ACC, now });
    const r = await a.prepare(ctx, { amountVnd: 1_600_000, transferContent: 'OTM-00171' });
    expect(r.qrPayload).toBe(VECTOR);
    expect(r.accountName).toBe('CONG TY TNHH OTTIMO DA LAT');
    expect(r.transferContent).toBe('OTM00171');
    expect(r.qrSvg.startsWith('<svg')).toBe(true);
    expect(r.qrSvg).not.toContain('http://img'); // drawn locally (F2)
    expect(JSON.stringify(r)).not.toMatch(/accountNoMasked|accountSource/);
  });

  it('FB-R2-SEC-INT-06: parameter not set → CONFIG even when PAYMENT_VIETQR_* exist in the environment', async () => {
    const env = {
      PAYMENT_VIETQR_BANK_BIN: '970436',
      PAYMENT_VIETQR_ACCOUNT_NO: '9876543210',
      PAYMENT_VIETQR_ACCOUNT_NAME: 'OTTIMO TEST',
    };
    // The adapter has no access to env at all; options only take the parameter source.
    const a = new VietQrPaymentAdapter({ receivingAccount: async () => null, now });
    await expect(
      a.prepare(ctx, { amountVnd: 1000, transferContent: 'OTM1' }),
    ).rejects.toMatchObject({ code: 'CONFIG' });
    const health = await a.healthCheck(ctx);
    expect(health).toEqual({
      status: 'down',
      checkedAt: '2026-10-17T08:30:00+07:00',
      detail: 'not_configured',
    });
    expect(JSON.stringify(health)).not.toContain(env.PAYMENT_VIETQR_ACCOUNT_NO);
  });

  it('error messages never contain the account number', async () => {
    const bad = { ...ACC, accountNo: '0123-456789' };
    const a = new VietQrPaymentAdapter({ receivingAccount: async () => bad, now });
    const err = await a.prepare(ctx, { amountVnd: 1000, transferContent: 'OTM1' }).catch((e) => e);
    expect(err).toBeInstanceOf(IntegrationError);
    expect(String(err.message)).not.toContain('456789');
  });

  it('createPayment uses description as content; callbacks are refused (not fail-open)', async () => {
    const a = new VietQrPaymentAdapter({ receivingAccount: async () => ACC, now });
    const r = await a.createPayment(ctx, {
      paymentCode: 'PT-000001',
      amountVnd: 1_600_000,
      description: 'OTM-00171',
      expiresAt: isoInstant('2026-10-20T14:00:00+07:00'),
      locale: 'vi',
    });
    expect(r.qrPayload).toBe(VECTOR);
    const cb = await a.verifyCallback(ctx, {
      method: 'POST',
      headers: {},
      query: {},
      rawBody: '{"amount":1600000}',
      sourceIp: '203.0.113.1',
    });
    expect(cb).toEqual({ ok: false, reason: 'source_not_allowed' });
    expect(a.callbackAck('ok').status).toBe(404);
    expect(await a.queryStatus(ctx, 'PT-000001')).toEqual({ status: 'pending' });
    expect(await a.healthCheck(ctx)).toEqual({
      status: 'ok',
      checkedAt: '2026-10-17T08:30:00+07:00',
    });
  });
});
