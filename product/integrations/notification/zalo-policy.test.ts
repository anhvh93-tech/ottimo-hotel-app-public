import { describe, expect, it } from 'vitest';
import {
  ZALO_TEMPLATE_KEYS,
  allowedTemplateVars,
  checkTemplateVariables,
  toZaloIntegrationLog,
} from './zalo-policy.js';

describe('Zalo template variable policy (FB-R2-SEC-INT-10, C-7)', () => {
  it('snapshot: allowed keys of the 8 templates', () => {
    const table = Object.fromEntries(
      ZALO_TEMPLATE_KEYS.map((k) => [k, allowedTemplateVars(k, 'zalo_zns')]),
    );
    expect(table).toMatchInlineSnapshot(`
      {
        "zns.arrival_reminder": [
          "customer_name",
          "booking_code",
          "checkin_date",
          "checkin_time",
          "address",
          "parking_note",
        ],
        "zns.booking_confirmed": [
          "customer_name",
          "booking_code",
          "room_type_name",
          "checkin_date",
          "checkout_date",
          "nights",
        ],
        "zns.checkout_reminder": [
          "customer_name",
          "booking_code",
          "checkout_date",
          "checkout_time",
        ],
        "zns.direct_voucher": [
          "customer_name",
          "voucher_code",
          "discount",
          "expiry_date",
        ],
        "zns.payment_confirmed": [
          "customer_name",
          "bill_no",
          "amount",
          "paid",
          "balance",
        ],
        "zns.payment_request": [
          "customer_name",
          "contract_code",
          "period",
          "amount",
          "due_date",
        ],
        "zns.stay_feedback": [
          "customer_name",
          "booking_code",
          "checkout_date",
        ],
        "zns.utility_bill": [
          "customer_name",
          "contract_code",
          "period",
          "kwh",
          "m3",
          "amount",
          "due_date",
        ],
      }
    `);
  });

  it('no allowed list contains a forbidden name or a unit number', () => {
    for (const k of ZALO_TEMPLATE_KEYS) {
      for (const ch of ['zalo_zns', 'zalo_oa'] as const) {
        const vars = allowedTemplateVars(k, ch);
        expect(vars).not.toContain('room_name');
        expect(vars).not.toContain('room_no');
        expect(
          vars.some(
            (v) =>
              /code$/.test(v) && !['booking_code', 'contract_code', 'voucher_code'].includes(v),
          ),
        ).toBe(false);
      }
    }
  });

  it('accepts a clean booking confirmation', () => {
    expect(
      checkTemplateVariables('zns.booking_confirmed', 'zalo_zns', {
        customer_name: 'A',
        booking_code: 'OTM-00001',
        room_type_name: 'Deluxe',
        checkin_date: '23/10/2026',
        checkout_date: '25/10/2026',
        nights: '2',
      }),
    ).toEqual({ ok: true });
  });

  it.each([
    ['door_code'],
    ['verification_code'],
    ['passport_no'],
    ['id_number'],
    ['date_of_birth'],
    ['room_name'],
    ['room_no'],
    ['wifi_password'],
    ['guest_token'],
    ['Door_Code'],
  ])('rejects forbidden variable %s on both Zalo channels', (key) => {
    for (const ch of ['zalo_zns', 'zalo_oa'] as const) {
      const r = checkTemplateVariables('zns.arrival_reminder', ch, {
        customer_name: 'A',
        [key]: 'x',
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.code).toBe('TEMPLATE_VAR_REJECTED');
        expect(r.violations).toContainEqual({ kind: 'forbidden', key });
      }
    }
  });

  it('rejects money on a non-bill template and unknown variables', () => {
    const r = checkTemplateVariables('zns.checkout_reminder', 'zalo_zns', {
      amount: '1',
      note: 'x',
    });
    expect(r).toEqual({
      ok: false,
      code: 'TEMPLATE_VAR_REJECTED',
      violations: [
        { kind: 'money_outside_bill', key: 'amount' },
        { kind: 'not_allowed', key: 'note' },
      ],
    });
  });

  it('rejects an unknown template', () => {
    expect(checkTemplateVariables('zns.auth_code', 'zalo_zns', {})).toEqual({
      ok: false,
      code: 'TEMPLATE_VAR_REJECTED',
      violations: [{ kind: 'unknown_template', templateKey: 'zns.auth_code' }],
    });
  });

  it('never echoes parameter values in the result', () => {
    const r = checkTemplateVariables('zns.booking_confirmed', 'zalo_oa', {
      door_code: '483920',
      room_name: 'Căn 301',
    });
    expect(JSON.stringify(r)).not.toContain('483920');
    expect(JSON.stringify(r)).not.toContain('301');
  });
});

describe('toZaloIntegrationLog (FB-R2-SEC-INT-14, C-9)', () => {
  it('keeps only allowlisted fields; drops phone, template_data, tokens, bodies', () => {
    const row = toZaloIntegrationLog({
      channel: 'zalo_zns',
      templateKey: 'zns.booking_confirmed',
      errorCode: '-141',
      providerMsgId: 'm-1',
      at: '2026-10-21T09:00:00+07:00',
      costUnits: 400,
      phone: '84901234567',
      template_data: { customer_name: 'Nguyen Van A' },
      access_token: 'secret-at',
      url: 'https://g.example.test/g/abcdef',
      body: '{"phone":"84901234567"}',
    });
    expect(row).toEqual({
      templateKey: 'zns.booking_confirmed',
      channel: 'zalo_zns',
      errorCode: '-141',
      providerMsgId: 'm-1',
      at: '2026-10-21T09:00:00+07:00',
      costUnits: 400,
    });
    const s = JSON.stringify(row);
    for (const leak of ['84901234567', 'Nguyen', 'secret-at', 'abcdef'])
      expect(s).not.toContain(leak);
  });

  it('nulls out malformed values', () => {
    const row = toZaloIntegrationLog({
      channel: 'zalo_oa',
      costUnits: -1,
      errorCode: 42,
      providerMsgId: 'x'.repeat(200),
    });
    expect(row).toEqual({
      templateKey: 'unknown',
      channel: 'zalo_oa',
      errorCode: null,
      providerMsgId: null,
      at: 'unknown',
      costUnits: null,
    });
  });
});
