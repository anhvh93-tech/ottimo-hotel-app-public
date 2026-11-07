// v1.0.5 Gói 2 – Desk V5-20 (old tariff text out, copy-v1.0.5 mục 1) and V5-22 (H09 Đặt phòng mới, copy-v1.0.5 mục 3):
// - the long-stay sentences carry the threshold the server reads (`long_stay_required_from_nights`), never "28";
// - the quote groups nights by amount, not by weekday (no "thường" / "thứ Sáu, thứ Bảy" rows);
// - a guest change re-prices the total: the total table waits for the preview of the guests on screen;
// - an empty OTA box says what it means (OTA calendar), the "Đổi sang căn …" box never shows "0 đ" for it;
// - a Trực tiếp night outside the floor–ceiling on create gets the sentence with the real min / max (#103).
import { ApiError, isApiError, newIdempotencyKey } from '@ottimo/api-client';
import { allKeys, translate } from '@ottimo/i18n';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, setCsrfToken } from '../app/api';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth, rsvErrorText } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { rateRangeErrors } from '../pages/booking/BookingDialog';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];

const vi = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
const money = (n: number) => vi('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const digits = (s: string) => Number(s.replace(/\D/g, ''));

/** A parameter row like the seed's (the mock reads `params` for `getBookingRules`). */
function setParam(key: string, value: unknown) {
  const row = mockControl.db.params.find((p) => p.key === key);
  if (row) row.value = value;
  else {
    const like = mockControl.db.params.find((p) => p.key === 'checkout_time')!;
    mockControl.db.params.push({ ...like, key, value });
  }
}

/** The next Monday after today (today itself excluded). */
function nextMonday(): string {
  let d = addDays(todayLocal(), 1);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
}

const rateBox = (dlg: HTMLElement, date: string) =>
  within(dlg).getByLabelText(`${tv('rate.pre_tier')} ${dayMonth(date)}`) as HTMLInputElement;
const sourceOf = (dlg: HTMLElement, date: string) =>
  (rateBox(dlg, date).closest('tr') as HTMLTableRowElement).cells[2]!;
const totalTable = (dlg: HTMLElement) =>
  within(dlg).getByRole('table', { name: tv('booking.summary.total') });
const totalFigure = (dlg: HTMLElement) =>
  (within(totalTable(dlg)).getByText(tv('bk.total')).closest('tr') as HTMLTableRowElement)
    .cells[1]!;

async function openBooking(user: User) {
  await screen.findByRole('grid');
  await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
  return screen.findByRole('dialog', { name: /Đặt phòng mới/ });
}

async function pickRoom(user: User, dlg: HTMLElement, no: string) {
  const room = within(dlg).getByLabelText(/^Căn/);
  await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
  await user.selectOptions(room, within(room).getByRole('option', { name: new RegExp(`^${no} `) }));
}

function setDates(dlg: HTMLElement, from: number, to: number) {
  fireEvent.change(within(dlg).getByLabelText(tv('booking.field.arrival')), {
    target: { value: addDays(todayLocal(), from) },
  });
  fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
    target: { value: addDays(todayLocal(), to) },
  });
}

describe('V5-20 – long-stay threshold from the rules, not "28"', () => {
  it('copy: the sentences take {n}; the old tariff keys are gone; the quote row has every plural form', () => {
    for (const locale of ['vi', 'en'] as const) {
      const keys = allKeys(locale);
      for (const k of ['bk.src_weekend', 'sale.nights_weekday', 'sale.nights_weekend'])
        expect(keys.has(k), `${locale} ${k}`).toBe(false);
      for (const f of ['one', 'few', 'many', 'other'])
        expect(keys.has(`sale.nights_at_rate_${f}`), `${locale} ${f}`).toBe(true);
      for (const k of [
        'rate.calendar_short',
        'bk.src_ota_calendar',
        'bk.rate_help_ota',
        'bk.use_room_ota_calendar',
        'booking.error.rate_partial_ota',
        'booking.error.rate_missing',
      ])
        expect(keys.has(k), `${locale} ${k}`).toBe(true);
      const long = translate(locale, 'bk.long_body', { n: 30 });
      expect(long).toContain('30');
      expect(long).not.toMatch(/28|\{n\}/);
      expect(translate(locale, 'field.LONG_STAY_REQUIRES_CONTRACT', { n: 30 })).toMatch(
        /^30 |Từ 30 /,
      );
      expect(translate(locale, 'stay.long_hint')).not.toMatch(/\d/);
      expect(translate(locale, 'rate.pre_tier')).not.toMatch(/trước giảm|before/i);
    }
  });

  it('rsvErrorText: LONG_STAY_REQUIRES_CONTRACT takes the rules threshold; MIN_STAY_NOT_MET keeps minStayNights', () => {
    const long = new ApiError(422, {
      type: 'about:blank',
      title: 'Unprocessable',
      status: 422,
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'departureDate', code: 'LONG_STAY_REQUIRES_CONTRACT' }],
      minStayNights: 2,
    });
    expect(rsvErrorText(vi, long, { longStayFromNights: 30 })).toBe(
      vi('field.LONG_STAY_REQUIRES_CONTRACT', { n: 30 }),
    );
    const min = new ApiError(422, {
      type: 'about:blank',
      title: 'Unprocessable',
      status: 422,
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'nights', code: 'MIN_STAY_NOT_MET' }],
      minStayNights: 2,
    });
    expect(rsvErrorText(vi, min, { longStayFromNights: 30 })).toBe(
      vi('field.MIN_STAY_NOT_MET', { n: 2 }),
    );
  });

  it('Đặt phòng mới: the long-stay box names the threshold the server reads (21 here), the title the nights', async () => {
    pinDaytime();
    setParam('long_stay_required_from_nights', 21);
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    setDates(dlg, 1, 24);
    const box = (await within(dlg).findByText(tv('bk.long_body', { n: 21 }))).closest(
      '.alert',
    ) as HTMLElement;
    expect(box).toHaveTextContent(tv('bk.long_title', { n: 23 }));
    expect(box).not.toHaveTextContent(/28|\{n\}/);
  });

  it('Báo giá: a LONG_STAY_REQUIRES_CONTRACT preview says the threshold of the rules', async () => {
    pinDaytime();
    setParam('long_stay_required_from_nights', 21);
    server.use(
      http.post('*/quotes/calculate', () =>
        HttpResponse.json(
          {
            type: '/problems/validation-failed',
            title: 'VALIDATION_FAILED',
            status: 422,
            code: 'VALIDATION_FAILED',
            errors: [{ field: 'nights', code: 'LONG_STAY_REQUIRES_CONTRACT' }],
          },
          { status: 422, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp('/quotes', 'qa.sal');
    const dlg = await quoteFor(user, '203');
    expect(
      await within(dlg).findByText(tv('field.LONG_STAY_REQUIRES_CONTRACT', { n: 21 })),
    ).toBeInTheDocument();
    expect(dlg).not.toHaveTextContent(/Từ 28 đêm|\{n\}/);
  });
});

async function quoteFor(user: User, room: string) {
  const item = await waitFor(() => {
    const li = screen
      .getAllByRole('listitem')
      .find((x) => x.querySelector('.roomno')?.textContent === room);
    if (!li) throw new Error(`room ${room} not listed`);
    return li;
  });
  await user.click(within(item).getByRole('button', { name: 'Báo giá' }));
  return screen.findByRole('dialog', { name: 'Báo giá' });
}

describe('V5-20 – the quote groups nights by amount (copy-v1.0.5 mục 1.4)', () => {
  it('Mon + 7 nights: two rows "n đêm × rate" in the order of the first night, n × rate = the row, no weekday words', async () => {
    pinDaytime();
    const { user } = renderApp('/quotes', 'qa.sal');
    const dlg = await quoteFor(user, '203');
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${tv('sale.arrival')}`)), {
      target: { value: nextMonday() },
    });
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${tv('sale.nights')}`)), {
      target: { value: '7' },
    });
    const first = await within(dlg).findByText(/^5 đêm × [\d.]+$/, {}, { timeout: 3000 });
    const second = within(dlg).getByText(/^2 đêm × [\d.]+$/);
    const rows = [first, second].map((c) => c.closest('tr') as HTMLTableRowElement);
    // Mon–Thu + Sun first (the stay starts on Monday), Fri + Sat after
    expect(
      rows[0]!.compareDocumentPosition(rows[1]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    for (const [row, n] of [
      [rows[0]!, 5],
      [rows[1]!, 2],
    ] as const) {
      const rate = digits(row.cells[0]!.textContent!.split('×')[1]!);
      expect(digits(row.cells[1]!.textContent!)).toBe(n * rate);
    }
    expect(digits(rows[0]!.cells[0]!.textContent!.split('×')[1]!)).not.toBe(
      digits(rows[1]!.cells[0]!.textContent!.split('×')[1]!),
    );
    const sum = within(dlg).getByText(tv('bk.total')).closest('table') as HTMLElement;
    expect(sum).not.toHaveTextContent(/thường|thứ Sáu|thứ Bảy|cuối tuần|\+\s?15/);
    expect(within(sum).getByText(tv('sale.los_applied', { pct: 10 }))).toBeInTheDocument();
  });

  it('EN: one night → the singular form', () => {
    expect(translate('en', 'sale.nights_at_rate_one', { n: 1, rate: '820,000' })).toBe(
      '1 night × 820,000',
    );
    expect(translate('en', 'sale.nights_at_rate_other', { n: 3, rate: '820,000' })).toBe(
      '3 nights × 820,000',
    );
  });
});

describe('V5-20 – a guest change re-prices the total (copy-v1.0.5 mục 1.6, FB-R4-ARC-FE-PR82-02)', () => {
  it('room 201, + 1 adult, the preview on its way: totals "–" and aria-busy, no fee row, rate boxes kept, "Tạo đơn" free; then the fee row', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    const from = 3;
    setDates(dlg, from, from + 2);
    await pickRoom(user, dlg, '201');
    const d1 = addDays(todayLocal(), from);
    await waitFor(
      () => {
        expect(rateBox(dlg, d1).value).not.toBe('');
        expect(totalTable(dlg)).not.toHaveAttribute('aria-busy');
      },
      { timeout: 3000 },
    );
    const before = rateBox(dlg, d1).value;
    const totalBefore = digits(totalFigure(dlg).textContent!);
    expect(within(dlg).queryByText(/người vượt định mức/)).not.toBeInTheDocument();

    let release!: () => void;
    const gate = new Promise<void>((ok) => (release = ok));
    server.use(
      http.post('*/quotes/calculate', async ({ request }) => {
        const b = (await request.clone().json()) as { adults?: number };
        if (b.adults !== 3) return undefined;
        await gate;
        return undefined;
      }),
    );
    await user.click(within(dlg).getByRole('button', { name: /^Tăng Người lớn/ }));
    await waitFor(() => expect(totalTable(dlg)).toHaveAttribute('aria-busy', 'true'));
    expect(totalFigure(dlg)).toHaveTextContent(/^–$/);
    expect(within(totalTable(dlg)).queryByText(/người vượt định mức/)).not.toBeInTheDocument();
    expect(rateBox(dlg, d1).value).toBe(before);
    expect(sourceOf(dlg, d1)).toHaveTextContent(tv('bk.src_list'));
    expect(within(dlg).getByRole('button', { name: tv('booking.create') })).not.toHaveAttribute(
      'aria-busy',
    );

    release();
    await waitFor(() => expect(totalTable(dlg)).not.toHaveAttribute('aria-busy'), {
      timeout: 3000,
    });
    expect(
      within(totalTable(dlg)).getByText(tv('occ.fee_line', { n: 1, nights: 2 })),
    ).toBeInTheDocument();
    expect(digits(totalFigure(dlg).textContent!)).toBe(totalBefore + 2 * 150_000);
  });
});

describe('V5-22 – Đặt phòng mới: an empty OTA box says what it means (FB-R4-UXD-FE-PR70-03/04)', () => {
  it('help line only for OTA; an untyped OTA night reads "Lịch giá OTA" in "Nguồn giá"', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    setDates(dlg, 3, 5);
    await pickRoom(user, dlg, '201');
    await waitFor(() => expect(rateBox(dlg, addDays(todayLocal(), 3)).value).not.toBe(''), {
      timeout: 3000,
    });
    expect(within(dlg).queryByText(tv('bk.rate_help_ota'))).not.toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    expect(within(dlg).getByText(tv('bk.rate_help_ota'))).toBeInTheDocument();
    expect(sourceOf(dlg, addDays(todayLocal(), 3))).toHaveTextContent(tv('bk.src_ota_calendar'));
    expect(rateBox(dlg, addDays(todayLocal(), 3)).value).toBe('');
  });

  it('OTA into a full room, nothing typed → "Dùng căn …" box: each night "Lịch giá OTA", the calendar line, never "0 đ"', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    setDates(dlg, 0, 2);
    await pickRoom(user, dlg, '101');
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Anna');
    await user.click(await screen.findByRole('option', { name: /Anna Martin/ }));
    await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), 'AG-552211');
    await user.click(within(dlg).getByRole('button', { name: tv('booking.create') }));
    expect(await within(dlg).findByText(/Căn 101 đã kín/)).toBeInTheDocument();
    const use = within(dlg).getAllByRole('button', { name: /^Dùng căn \d+/ })[0]!;
    const no = /^Dùng căn (\d+)/.exec(use.textContent ?? '')![1]!;
    await user.click(use);
    const box = (await within(dlg).findByText(tv('bk.use_room_check', { room: no }))).closest(
      '.alert',
    ) as HTMLElement;
    const table = within(box).getByRole('table');
    expect(within(table).getAllByText(tv('bk.src_ota_calendar'))).toHaveLength(2);
    expect(within(table).getByText(tv('bk.use_room_ota_calendar'))).toBeInTheDocument();
    expect(within(table).queryByText(tv('bk.total'))).not.toBeInTheDocument();
    expect(table).not.toHaveTextContent(/(^|\s)0\s?(đ|VND)?(\s|$)/);
  });

  it('OTA typed in part → the OTA sentence; each empty box is marked and read with it', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    setDates(dlg, 3, 5);
    await pickRoom(user, dlg, '201');
    const d1 = addDays(todayLocal(), 3);
    const d2 = addDays(todayLocal(), 4);
    await user.type(rateBox(dlg, d1), '900000');
    await user.click(within(dlg).getByRole('button', { name: tv('booking.create') }));
    const sentence = await within(dlg).findByText(tv('booking.error.rate_partial_ota'));
    expect(sentence).toHaveAttribute('id', 'bk-rates-err');
    expect(rateBox(dlg, d2)).toHaveAttribute('aria-invalid', 'true');
    expect(rateBox(dlg, d2)).toHaveAccessibleDescription(tv('booking.error.rate_partial_ota'));
    expect(rateBox(dlg, d1)).not.toHaveAttribute('aria-invalid');
  });
});

describe('V5-22 – Trực tiếp create outside the floor–ceiling: the sentence with the real numbers (#103)', () => {
  it('the mock answers like the server: top-level RATE_OUT_OF_RANGE, dates[] + min / max → the BR-105 sentence on that night', async () => {
    mockControl.signInAs('qa.fd');
    setCsrfToken(mockControl.db.csrf);
    const arrival = nextMonday();
    const nights = [arrival, addDays(arrival, 1)];
    const room = mockControl.db.rooms.find((r) => r.roomNo === '201')!;
    const direct = mockControl.rsv.channels.find((c) => c.code === 'direct')!;
    const guest = mockControl.db.guests[0]!;
    const before = mockControl.rsv.reservations.length;
    let err: unknown;
    try {
      await api.createReservation(
        { propertyId: PROPERTY_ID },
        {
          roomId: room.id,
          channelId: direct.id,
          arrivalDate: arrival,
          departureDate: addDays(arrival, 2),
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: guest.id,
          paymentModel: 'direct',
          directSource: 'zalo_phone',
          allowUnassigned: false,
          nightlyRates: [
            { date: nights[0]!, amountVnd: 900_000, edited: true },
            { date: nights[1]!, amountVnd: 100_000, edited: true },
          ],
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
        },
        newIdempotencyKey(),
      );
    } catch (e) {
      err = e;
    }
    expect(isApiError(err) && err.code).toBe('RATE_OUT_OF_RANGE');
    const p = (err as ApiError).problem as Record<string, unknown>;
    expect(p).toMatchObject({ dates: [nights[1]], min: 300_000, max: 3_000_000 });
    const out = rateRangeErrors(vi, money, err, nights)!;
    expect(out['nightlyRates[1].amountVnd']).toBe(
      vi('booking.error.rate_range', { min: money(300_000), max: money(3_000_000) }),
    );
    expect(out['nightlyRates[0].amountVnd']).toBeUndefined();
    expect(mockControl.rsv.reservations).toHaveLength(before);
  });
});

describe('V5-20 – "after {time}" in Xác nhận giờ trả follows checkout_time (copy-v1.0.5 mục 1.5)', () => {
  it('checkout_time 11:00: 11:30 → the hint with 11:00; 10:30 → none', async () => {
    pinDaytime();
    setParam('checkout_time', '11:00');
    const r = mockControl.rsv.reservations.find((x) => x.guestName === 'Trần Thu Nga')!;
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Trần Thu Nga' });
    await user.click(within(d).getByRole('button', { name: tv('today.confirm_time') }));
    const dlg = await screen.findByRole('dialog', { name: tv('today.confirm_time') });
    const time = within(dlg).getByLabelText(new RegExp(`^${tv('checkout.departure_time')}`));
    await waitFor(() => {
      fireEvent.change(time, { target: { value: '11:30' } });
      expect(
        within(dlg).getByText(tv('stay.after_noon_hint', { time: '11:00' })),
      ).toBeInTheDocument();
    });
    fireEvent.change(time, { target: { value: '10:30' } });
    expect(within(dlg).queryByText(/Trả muộn/)).not.toBeInTheDocument();
  });
});

describe('FB-R5-DOM-FE-171-01 – "Tạo đơn ở căn …" with OTA / Nội bộ typed in part', () => {
  /** Room 101 today → +3 is taken tonight (Trần Thu Nga): the 409 offers another room; nothing typed yet. */
  async function useOtherRoom(user: User, group: 'ota' | 'internal') {
    const dlg = await openBooking(user);
    await user.click(
      within(dlg).getByRole('button', { name: group === 'ota' ? 'OTA' : tv('bk.ch_internal') }),
    );
    setDates(dlg, 0, 3);
    await pickRoom(user, dlg, '101');
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Anna');
    await user.click(await screen.findByRole('option', { name: /Anna Martin/ }));
    if (group === 'ota')
      await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), 'AG-171010');
    else await user.type(within(dlg).getByLabelText(/^Ghi chú nội bộ/), 'Kiểm tra phòng');
    await user.click(within(dlg).getByRole('button', { name: tv('booking.create') }));
    const use = (await within(dlg).findAllByRole('button', { name: /^Dùng căn \d+/ }))[0]!;
    const no = /^Dùng căn (\d+)/.exec(use.textContent ?? '')![1]!;
    await user.click(use);
    const box = (await within(dlg).findByText(tv('bk.use_room_check', { room: no }))).closest(
      '.alert',
    ) as HTMLElement;
    return { dlg, box, no };
  }

  for (const [group, key] of [
    ['ota', 'booking.error.rate_partial_ota'],
    ['internal', 'booking.error.rate_empty_internal'],
  ] as const) {
    it(`${group}: 2 of 3 nights typed → no total in the box, the sentence next to the button; the click sends nothing and keeps the figures`, async () => {
      pinDaytime();
      const { user } = renderApp('/rack', 'qa.fd');
      const { dlg, box, no } = await useOtherRoom(user, group);
      const d0 = todayLocal();
      const d1 = addDays(d0, 1);
      await user.type(rateBox(dlg, d0), '300000');
      await user.type(rateBox(dlg, d1), '300000');
      const sentence = tv(key);
      expect(within(box).getByText(sentence)).toBeInTheDocument();
      expect(within(box).queryByText(tv('bk.total'))).not.toBeInTheDocument();
      expect(box).not.toHaveTextContent('600.000');
      const confirm = within(box).getByRole('button', {
        name: tv('bk.use_room_confirm', { room: no }),
      });
      expect(confirm).toHaveAccessibleDescription(sentence);

      const before = mockControl.rsv.reservations.length;
      let posted = 0;
      const count = ({ request }: { request: Request }) => {
        if (request.method === 'POST' && /\/reservations$/.test(new URL(request.url).pathname))
          posted += 1;
      };
      server.events.on('request:start', count);
      await user.click(confirm);
      expect(
        await within(dlg).findByText(sentence, { selector: '#bk-rates-err' }),
      ).toBeInTheDocument();
      server.events.removeListener('request:start', count);
      expect(posted).toBe(0);
      expect(mockControl.rsv.reservations).toHaveLength(before);
      expect(rateBox(dlg, d0).value).toMatch(/^300[.,]000$|^300000$/);
      expect(rateBox(dlg, d1).value).toMatch(/^300[.,]000$|^300000$/);
      expect(rateBox(dlg, addDays(d0, 2)).value).toBe('');
    });
  }
});
