// Review of PR #122 (V5-14): UXD FB-R5-UXD-FE-PR122-01 (floor–ceiling sentence as money, dates fallback – copy-v1.0.5
// mục 3, 9.10) and FB-R5-ARC-FE-122-01 (the mock refuses in the server's order: `type` → body of the typed prices →
// channel; a price field on create-hold before every other check).
import { ApiError, isApiError, newIdempotencyKey } from '@ottimo/api-client';
import { loadLocale, translate } from '@ottimo/i18n';
import { describe, expect, it } from 'vitest';
import { api, setCsrfToken } from '../app/api';
import { todayLocal } from '../app/dates';
import { fieldErrors } from '../app/problem';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { PROPERTY_ID } from '../mocks/seed';
import { rateRangeErrors } from '../pages/booking/BookingDialog';

const vi = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
const money = (n: number) => vi('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });

const rangeProblem = (extra: Record<string, unknown>) =>
  new ApiError(422, {
    type: 'about:blank',
    title: 'Unprocessable',
    status: 422,
    code: 'RATE_OUT_OF_RANGE',
    errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }],
    ...extra,
  });

describe('FB-R5-UXD-FE-PR122-01 – câu sàn–trần có tiền, không ngoặc cụt', () => {
  const nights = ['2026-11-08', '2026-11-09'];

  it('min, max → "Giá phải từ 300.000 đ đến 3.000.000 đ (sàn–trần của nhóm căn)." on the nights of dates[]', () => {
    const out = rateRangeErrors(
      vi,
      money,
      rangeProblem({ dates: ['2026-11-09'], min: 300_000, max: 3_000_000 }),
      nights,
    );
    const sentence = vi('booking.error.rate_range', {
      min: money(300_000),
      max: money(3_000_000),
    });
    expect(out).toEqual({ 'nightlyRates[1].amountVnd': sentence });
    expect(sentence).toBe('Giá phải từ 300.000 đ đến 3.000.000 đ (sàn–trần của nhóm căn).');
  });

  it('no min or max → booking.error.rate_out_of_range_dates with the night dd/mm, never "{min}"', () => {
    const out = rateRangeErrors(vi, money, rangeProblem({ dates: nights, min: 300_000 }), nights);
    expect(out).toEqual({
      'nightlyRates[0].amountVnd': vi('booking.error.rate_out_of_range_dates', { dates: '08/11' }),
      'nightlyRates[1].amountVnd': vi('booking.error.rate_out_of_range_dates', { dates: '09/11' }),
    });
    // no dates of the stay matched → under the table, naming the nights of the stay
    expect(rateRangeErrors(vi, money, rangeProblem({}), nights)).toEqual({
      rates: vi('booking.error.rate_out_of_range_dates', { dates: '08/11, 09/11' }),
    });
    for (const s of Object.values(rateRangeErrors(vi, money, rangeProblem({}), nights)!))
      expect(s).not.toMatch(/[{}]/);
  });

  it('Desk EN: the same sentence with the English money format', async () => {
    await loadLocale('en');
    const en = (k: string, a?: Record<string, string | number>) => translate('en', k, a);
    const enMoney = (n: number) => en('common.currency_vnd', { amount: n.toLocaleString('en-US') });
    const out = rateRangeErrors(
      en,
      enMoney,
      rangeProblem({ dates: ['2026-11-08'], min: 300_000, max: 3_000_000 }),
      nights,
    );
    expect(out!['nightlyRates[0].amountVnd']).toMatch(
      /^Rate must be between 300,000 VND and 3,000,000 VND \(the room group's floor–ceiling\)\.$/,
    );
  });

  it('the generic sentence (extra night at check-out, folio night price) also shows money', () => {
    const e = new ApiError(422, {
      type: 'about:blank',
      title: 'Unprocessable',
      status: 422,
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'extraNight.rateVnd', code: 'RATE_OUT_OF_RANGE' }],
      min: 450_000,
      max: 1_800_000,
    });
    expect(fieldErrors(vi, e)).toEqual({
      'extraNight.rateVnd': vi('error.RATE_OUT_OF_RANGE', {
        min: money(450_000),
        max: money(1_800_000),
      }),
    });
  });
});

describe('FB-R5-ARC-FE-122-01 – mock theo thứ tự máy chủ', () => {
  const P = { propertyId: PROPERTY_ID };
  const arrival = () => addDays(todayLocal(), 3);
  const roomId = () => mockControl.db.rooms[0]!.id;
  const channel = (code: string) => mockControl.rsv.channels.find((c) => c.code === code)!.id;
  const codeOf = async (p: Promise<unknown>) => {
    try {
      await p;
      return 'ok';
    } catch (e) {
      if (!isApiError(e)) throw e;
      return `${e.code}:${e.fieldErrors.map((f) => `${f.field}/${f.code}`).join(',')}`;
    }
  };

  it('calculateQuote: a long stay with typed prices → NOT_ALLOWED; a bad night with an OTA channel → DATE_INVALID first', async () => {
    mockControl.signInAs('qa.fd');
    setCsrfToken(mockControl.db.csrf);
    const base = {
      roomId: roomId(),
      arrivalDate: arrival(),
      nights: 2,
      adults: 2,
      children6to11: 0,
      childrenUnder6: 0,
    };
    expect(
      await codeOf(
        api.calculateQuote(P, {
          ...base,
          type: 'long',
          channelId: channel('direct'),
          nightlyRates: [{ date: arrival(), amountVnd: 900_000, edited: true }],
        } as never),
      ),
    ).toBe('VALIDATION_FAILED:nightlyRates/NOT_ALLOWED');
    // body before channel (contract 1.17): a night outside the stay + an OTA channel → the body error
    expect(
      await codeOf(
        api.calculateQuote(P, {
          ...base,
          type: 'short',
          channelId: channel('booking'),
          nightlyRates: [
            { date: addDays(arrival(), 5), amountVnd: 900_000, edited: true },
            { date: addDays(arrival(), 1), amountVnd: 900_000, edited: false },
          ],
        }),
      ),
    ).toBe('VALIDATION_FAILED:nightlyRates[0].date/DATE_INVALID');
    // a clean body with an OTA channel → the channel error
    expect(
      await codeOf(
        api.calculateQuote(P, {
          ...base,
          type: 'short',
          channelId: channel('booking'),
          nightlyRates: [
            { date: arrival(), amountVnd: 900_000, edited: true },
            { date: addDays(arrival(), 1), amountVnd: 900_000, edited: false },
          ],
        }),
      ),
    ).toBe('VALIDATION_FAILED:channelId/NOT_IN_LIST');
  });

  it('createHoldFromQuote: a price field is refused before the quote is even looked up (no 404)', async () => {
    mockControl.signInAs('qa.fd');
    setCsrfToken(mockControl.db.csrf);
    expect(
      await codeOf(
        api.createHoldFromQuote(
          { propertyId: PROPERTY_ID, quoteId: '00000000-0000-4000-8000-000000000000' },
          { holdHours: 24, nightlyRates: [] } as never,
          newIdempotencyKey(),
        ),
      ),
    ).toBe('VALIDATION_FAILED:nightlyRates/NOT_ALLOWED');
  });
});
