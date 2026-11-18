// v1.0.5 Gói 2 – V5-21 (parameters on the Desk) and the Desk sentence of V5-25 (min_stay / weekend_nights /
// structured keys). Copy: rounds/round-05/outputs/UXD/copy-v1.0.5.md 2.1–2.4, 9.2, 9.4. Every expected sentence is
// read from the strings with tv() (content-guide 2), never typed again.
import { ApiError, type Parameter } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { paramProblemText, problemView } from '../app/problem';
import { mockControl } from '../mocks/handlers';
import { formatParamValue } from '../pages/ParamDialog';
import { paramLabel, paramMeta } from '../pages/paramCatalog';
import { renderApp, tv } from '../test/render';

const en = (k: string, a?: Record<string, string | number>) => translate('en', k, a);
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });

const outOfRange = (
  extras: Record<string, unknown>,
  field = 'value',
  code = 'PARAM_OUT_OF_RANGE',
) =>
  new ApiError(422, {
    type: 'about:blank',
    title: 'Unprocessable',
    status: 422,
    code: 'PARAM_OUT_OF_RANGE',
    errors: [{ field, code }],
    ...extras,
  });

const text = (key: string, e: ApiError, unit?: string) =>
  paramProblemText(tv, e, { key, unit: unit ?? paramMeta(key).unit });

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** The 29 keys of copy 2.1, parameter key → string key. */
const NAMED = [
  'weekend_uplift_pct',
  'weekend_nights',
  'weekend_uplift_channels',
  'special_uplift_pct',
  'special_dates',
  'special_uplift_channels',
  'los_discount',
  'long_stay_required_from_nights',
  'short_stay_max_nights',
  'ota_base_rate',
  'early_checkin_tiers',
  'long_stay_compare_from_nights',
  'rounding.monthly_rent',
  'rounding.night_rate',
  'rounding.deposit',
  'rounding.fee',
  'rounding.ota_rate',
  'late_checkout_tiers',
  'rate_floor_pct',
  'rate_ceiling_pct',
  'min_stay',
  'min_stay_orphan_night_exception',
  'booking_window_days',
  'return_guest_code',
  'return_guest_pct',
  'stackable',
  'prices_include_vat',
  'public_show_prices',
  'web_estimate.open_until',
];

describe('V5-21 – tên tiếng Việt và đơn vị cho tham số còn hiện mã (copy 2.1, 2.2)', () => {
  it('every key of the list has its params.k.* name (B2–B11, rounding.*, early_checkin_tiers first)', () => {
    expect(NAMED).toHaveLength(29);
    for (const key of NAMED) {
      const name = paramLabel(tv, key);
      expect(name, key).toBe(tv(`params.k.${key.replace(/\./g, '_')}`));
      expect(name, key).not.toBe(key);
      // Copy 2.1: the group stays "Khác" so the dictionary and the manual still say "tab Khác".
      expect(paramMeta(key).group, key).toBe('other');
    }
    expect(paramLabel(tv, 'rounding.night_rate')).toBe(tv('params.k.rounding_night_rate'));
    expect(paramLabel(en, 'long_stay_compare_from_nights')).toBe(
      en('params.k.long_stay_compare_from_nights'),
    );
  });

  it('values carry the Desk unit: nights (new), VND for rounding.*, % for the price percentages', () => {
    const p = (key: string, value: unknown) => ({ key, value }) as Pick<Parameter, 'key' | 'value'>;
    expect(formatParamValue(tv, p('long_stay_required_from_nights', 30))).toBe(
      `30 ${tv('params.unit_nights')}`,
    );
    expect(formatParamValue(tv, p('short_stay_max_nights', 27))).toBe(
      `27 ${tv('params.unit_nights')}`,
    );
    expect(formatParamValue(tv, p('rounding.deposit', 100_000))).toBe(
      `100.000 ${tv('common.vnd_unit')}`,
    );
    expect(formatParamValue(tv, p('rate_floor_pct', 70))).toBe('70%');
    expect(formatParamValue(tv, p('booking_window_days', 365))).toBe(
      `365 ${tv('params.unit_days')}`,
    );
  });
});

describe('V5-21 – câu lỗi khi lưu tham số, 6 bước (copy 2.3)', () => {
  it('a set of words: "không có trong danh sách", never "khoảng"; weekend_nights lists MON…SUN (BUG-R5-001)', () => {
    const e = outOfRange({ allowed: WEEKDAYS }, 'value[0]', 'NOT_IN_LIST');
    const s = text('weekend_nights', e);
    expect(s).toBe(tv('error.PARAM_OUT_OF_RANGE', { allowed: WEEKDAYS.join(', ') }));
    expect(s).not.toMatch(/khoảng/);
    expect(s).not.toMatch(/1, 2/);
  });

  it('a set of numbers of a VND key is money; min–max of a VND key is money', () => {
    expect(text('rounding.night_rate', outOfRange({ allowed: [1, 1000, 10000] }))).toBe(
      tv('error.PARAM_OUT_OF_RANGE', {
        allowed: [money(1), money(1000), money(10000)].join(', '),
      }),
    );
    expect(text('extra_adult_fee', outOfRange({ min: 0, max: 2_000_000 }), 'vnd')).toBe(
      tv('error.PARAM_OUT_OF_RANGE_MINMAX', { min: money(0), max: money(2_000_000) }),
    );
  });

  it('only max / only min / no extras: no raw {min} or {max} on screen', () => {
    const max = text('rate_floor_pct', outOfRange({ max: 250 }));
    expect(max).toBe(tv('error.PARAM_OUT_OF_RANGE_MAX', { max: '250' }));
    expect(text('rate_ceiling_pct', outOfRange({ min: 100 }))).toBe(
      tv('error.PARAM_OUT_OF_RANGE_MIN', { min: '100' }),
    );
    expect(text('hold_hours_options', outOfRange({}))).toBe(tv('error.PARAM_OUT_OF_RANGE_SHAPE'));
    for (const s of [max, text('hold_hours_options', outOfRange({}))]) {
      expect(s).not.toMatch(/\{(min|max|allowed)\}/);
    }
  });

  it('ota_base_rate (allowed + min + max): every room group, night rates as money', () => {
    const e = outOfRange({ allowed: ['STD', 'DLX'], min: 100_000, max: 20_000_000 });
    expect(text('ota_base_rate', e)).toBe(
      tv('error.PARAM_OUT_OF_RANGE_GROUPS', {
        allowed: 'STD, DLX',
        min: money(100_000),
        max: money(20_000_000),
      }),
    );
  });

  it('problemView (other callers, no key) follows the same six steps', () => {
    expect(problemView(tv, outOfRange({ allowed: ['privacy-2026-10-v2'] })).text).toBe(
      tv('error.PARAM_OUT_OF_RANGE', { allowed: 'privacy-2026-10-v2' }),
    );
    expect(problemView(tv, outOfRange({ max: 720 })).text).toBe(
      tv('error.PARAM_OUT_OF_RANGE_MAX', { max: '720' }),
    );
    expect(problemView(tv, outOfRange({})).text).toBe(tv('error.PARAM_OUT_OF_RANGE_SHAPE'));
  });
});

describe('V5-25 – câu Desk cho min_stay (copy 9.2) và khóa có cấu trúc (copy 9.4)', () => {
  it('min_stay: a set → where + "Chọn một trong" (BR-113-23 example)', () => {
    const e = outOfRange(
      { allowed: ['all', 'direct', 'agent', 'ota'] },
      'value[0].channels',
      'REQUIRED',
    );
    expect(text('min_stay', e)).toBe(
      tv('params.err_structured', {
        where: tv('params.where_item_field', { n: 1, field: 'channels' }),
        detail: tv('error.PARAM_OUT_OF_RANGE', { allowed: 'all, direct, agent, ota' }),
        key: 'min_stay',
      }),
    );
    // The arrival days of a rule list the weekday codes the engine reads.
    expect(
      text(
        'min_stay',
        outOfRange({ allowed: WEEKDAYS }, 'value[1].arrivalWeekdays[0]', 'NOT_IN_LIST'),
      ),
    ).toContain(tv('params.where_item_field', { n: 2, field: 'arrivalWeekdays' }));
  });

  it('min_stay: nights out of range, over 20 rules, and a value that is not a list of rules', () => {
    expect(
      text('min_stay', outOfRange({ min: 1, max: 7 }, 'value[0].nights', 'VALUE_OUT_OF_RANGE')),
    ).toBe(tv('params.err_min_stay_nights', { min: '1', max: '7' }));
    expect(text('min_stay', outOfRange({ max: 20 }, 'value', 'VALUE_OUT_OF_RANGE'))).toBe(
      tv('params.err_structured_whole', {
        detail: tv('error.PARAM_OUT_OF_RANGE_MAX', { max: '20' }),
        key: 'min_stay',
      }),
    );
    expect(text('min_stay', outOfRange({}, 'value', 'VALIDATION_FAILED'))).toBe(
      tv('params.err_min_stay_shape'),
    );
    expect(text('min_stay', outOfRange({}, 'value[0]', 'REQUIRED'))).toBe(
      tv('params.err_min_stay_shape'),
    );
  });

  it('short_stay_max_nights below the largest min_stay rule (reverse check, DOM 12.2)', () => {
    expect(
      text('short_stay_max_nights', outOfRange({ min: 3 }, 'value', 'VALUE_OUT_OF_RANGE')),
    ).toBe(tv('params.err_short_stay_below_min_stay', { min: '3' }));
  });

  it('the four examples of copy 9.4', () => {
    expect(
      text('los_discount', outOfRange({ min: 0, max: 100 }, 'value[1].pct', 'VALUE_OUT_OF_RANGE')),
    ).toBe(
      'Chỗ cần sửa: mục 2, pct. Giá trị phải từ 0 đến 100. Xem dạng đúng trong từ điển tham số, mục los_discount.',
    );
    expect(text('special_dates', outOfRange({}, 'value[0].from', 'DATE_INVALID'))).toBe(
      'Chỗ cần sửa: mục 1, from. Giá trị này chưa đúng dạng, hoặc chưa khớp với tham số đi kèm. Xem dạng đúng trong từ điển tham số, mục special_dates.',
    );
    expect(
      text(
        'early_departure_refund',
        outOfRange({ min: 0, max: 100 }, 'value.refundPct', 'VALUE_OUT_OF_RANGE'),
      ),
    ).toBe(
      'Chỗ cần sửa: refundPct. Giá trị phải từ 0 đến 100. Xem dạng đúng trong từ điển tham số, mục early_departure_refund.',
    );
    expect(text('lease_terms', outOfRange({ max: 12 }, 'value', 'VALUE_OUT_OF_RANGE'))).toBe(
      'Giá trị này vượt mức cho phép (12). Xem dạng đúng trong từ điển tham số, mục lease_terms.',
    );
  });

  it('REQUIRED: empty cancellation policy, a missing role, a missing part', () => {
    expect(text('cancel_policy_direct', outOfRange({}, 'value', 'REQUIRED'))).toBe(
      tv('params.err_structured_whole', {
        detail: tv('params.err_cancel_policy_empty'),
        key: 'cancel_policy_direct',
      }),
    );
    expect(
      text(
        'max_open_holds_per_user',
        outOfRange({ min: 0, max: 50 }, 'value.sales_staff', 'REQUIRED'),
      ),
    ).toBe(
      tv('params.err_structured', {
        where: 'sales_staff',
        detail: tv('params.err_hold_limit_roles'),
        key: 'max_open_holds_per_user',
      }),
    );
    expect(text('cancel_policy_direct', outOfRange({}, 'value[1].refundPct', 'REQUIRED'))).toBe(
      'Chỗ cần sửa: mục 2, refundPct. Đang thiếu giá trị bắt buộc. Xem dạng đúng trong từ điển tham số, mục cancel_policy_direct.',
    );
  });

  it('where: "{field}, mục {n}" for value.<key>[j]; channels of the uplift keys list the allowed set', () => {
    expect(
      text(
        'checkout_reminders',
        outOfRange({ min: 1, max: 24 }, 'value.before[3]', 'VALUE_OUT_OF_RANGE'),
      ),
    ).toContain(tv('params.where_field_item', { field: 'before', n: 4 }));
    expect(
      text(
        'weekend_uplift_channels',
        outOfRange({ allowed: ['all', 'direct', 'agent', 'ota'] }, 'value', 'NOT_IN_LIST'),
      ),
    ).toBe(
      tv('params.err_structured_whole', {
        detail: tv('error.PARAM_OUT_OF_RANGE', { allowed: 'all, direct, agent, ota' }),
        key: 'weekend_uplift_channels',
      }),
    );
  });

  it('English Desk uses the EN strings', () => {
    const e = outOfRange({ min: 0, max: 100 }, 'value[1].pct', 'VALUE_OUT_OF_RANGE');
    expect(paramProblemText(en, e, { key: 'los_discount' }, 'en')).toBe(
      en('params.err_structured', {
        where: en('params.where_item_field', { n: 2, field: 'pct' }),
        detail: en('error.PARAM_OUT_OF_RANGE_MINMAX', { min: '0', max: '100' }),
        key: 'los_discount',
      }),
    );
  });
});

// ---------- H05 screen (mock API) ----------

const MGMT = ['owner', 'manager'] as Parameter['editableBy'];
const row = (key: string, value: unknown): Parameter => ({
  key,
  value,
  effectiveFrom: '2026-10-15',
  brRef: 'BR-103',
  editableBy: MGMT,
  changedBy: 'Chủ đầu tư',
  changedAt: '2026-10-15T09:30:00+07:00',
});

function seedPriceKeys() {
  mockControl.db.params.push(
    row('ota_base_rate', { STD: 900_000 }),
    row('weekend_nights', ['FRI', 'SAT']),
    row('min_stay', [{ nights: 2, channels: 'all', arrivalWeekdays: ['FRI'] }]),
    row('long_stay_required_from_nights', 30),
    row('rounding.night_rate', 1000),
  );
}

async function openOther(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('tab', { name: tv('params.grp_other') }));
}

async function edit(user: ReturnType<typeof renderApp>['user'], label: string) {
  await user.click(screen.getByRole('button', { name: `${tv('rooms.edit')}: ${label}` }));
  const dlg = await screen.findByRole('dialog', { name: tv('params.edit_title', { name: label }) });
  // History loaded (GET parameters/:key answered) before a test arms failNext for the PUT.
  await within(dlg).findByText(tv('params.history'));
  return dlg;
}

describe('H05 – tab Khác with the V5-21 names and the ota_base_rate note (mock API)', () => {
  it('rows show the Vietnamese name, the key in small code, values with units; ota_base_rate says "Không cần nhập"', async () => {
    seedPriceKeys();
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await openOther(user);
    const name = tv('params.k.long_stay_required_from_nights');
    const r = screen.getByText(name).closest('tr')!;
    expect(within(r).getByText('long_stay_required_from_nights')).toBeInTheDocument();
    expect(within(r).getByText(`30 ${tv('params.unit_nights')}`)).toBeInTheDocument();
    const rr = screen.getByText(tv('params.k.rounding_night_rate')).closest('tr')!;
    expect(within(rr).getByText(`1.000 ${tv('common.vnd_unit')}`)).toBeInTheDocument();
    const ota = screen.getByText(tv('params.k.ota_base_rate')).closest('tr')!;
    expect(within(ota).getByText(tv('params.ota_base_rate_note'))).toBeInTheDocument();
    // Only that row carries the note.
    expect(screen.getAllByText(tv('params.ota_base_rate_note'))).toHaveLength(1);

    const dlg = await edit(user, tv('params.k.ota_base_rate'));
    expect(within(dlg).getByRole('note')).toHaveTextContent(tv('params.ota_base_rate_note'));
  });

  it('JSON typed wrong → params.err_json; a number box with letters → params.err_number', async () => {
    seedPriceKeys();
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await openOther(user);
    let dlg = await edit(user, tv('params.k.weekend_nights'));
    const box = within(dlg).getByLabelText(
      new RegExp(tv('params.value_json').replace(/[()]/g, '\\$&')),
    );
    await user.clear(box);
    await user.type(box, '[[FRI, SAT]'); // "[FRI, SAT]": words without quotes
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Thử dạng');
    await user.click(within(dlg).getByRole('button', { name: tv('params.save') }));
    expect(await within(dlg).findByText(tv('params.err_json'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('field_error.not_in_list'))).toBeNull();
    await user.click(within(dlg).getByRole('button', { name: tv('common.cancel') }));
    const discard = screen.queryByRole('button', { name: tv('common.unsaved_discard') });
    if (discard) await user.click(discard);

    dlg = await edit(user, tv('params.k.long_stay_required_from_nights'));
    const value = within(dlg).getByLabelText(new RegExp(tv('params.new_value')));
    await user.clear(value);
    await user.type(value, '30 đêm');
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Thử dạng');
    await user.click(within(dlg).getByRole('button', { name: tv('params.save') }));
    expect(await within(dlg).findByText(tv('params.err_number'))).toBeInTheDocument();
  });

  it('weekend_nights saved as numbers → the server 422 lists MON…SUN under the box (BUG-R5-001)', async () => {
    seedPriceKeys();
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await openOther(user);
    const dlg = await edit(user, tv('params.k.weekend_nights'));
    mockControl.failNext(/parameters\/weekend_nights:PUT$/, 422, {
      code: 'PARAM_OUT_OF_RANGE',
      errors: [{ field: 'value[0]', code: 'NOT_IN_LIST' }],
      allowed: WEEKDAYS,
    });
    const box = within(dlg).getByLabelText(
      new RegExp(tv('params.value_json').replace(/[()]/g, '\\$&')),
    );
    await user.clear(box);
    await user.type(box, '[[5,6]'); // user-event: "[[" types one "["
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Thử dạng');
    await user.click(within(dlg).getByRole('button', { name: tv('params.save') }));
    const err = await within(dlg).findByText(
      tv('error.PARAM_OUT_OF_RANGE', { allowed: WEEKDAYS.join(', ') }),
    );
    expect(err).toBeInTheDocument();
    expect(box).toHaveAttribute('aria-invalid', 'true');
  });

  it('min_stay refused by the server → the min_stay sentence, not "Giá trị phải từ 1 đến 7."', async () => {
    seedPriceKeys();
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await openOther(user);
    const dlg = await edit(user, tv('params.k.min_stay'));
    mockControl.failNext(/parameters\/min_stay:PUT$/, 422, {
      code: 'PARAM_OUT_OF_RANGE',
      errors: [{ field: 'value[0].nights', code: 'VALUE_OUT_OF_RANGE' }],
      min: 1,
      max: 7,
    });
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Thử dạng');
    await user.click(within(dlg).getByRole('button', { name: tv('params.save') }));
    expect(
      await within(dlg).findByText(tv('params.err_min_stay_nights', { min: '1', max: '7' })),
    ).toBeInTheDocument();
    expect(
      within(dlg).queryByText(tv('error.PARAM_OUT_OF_RANGE_MINMAX', { min: '1', max: '7' })),
    ).toBeNull();
  });
});
