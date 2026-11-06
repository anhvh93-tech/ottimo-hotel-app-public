/**
 * V5-25 – the shape cases of the structured parameters, shared by the unit test of the save rules
 * (`test/v5-25-parameter-shapes.test.ts`) and the test of the read-only SQL check
 * (`scripts/v5-25-parameter-shape-check.sql`, in `test/integration/v5-25-parameter-save.test.ts`), so the SQL and the
 * TypeScript rules can never drift apart. Context of every case: short_stay_max_nights ≥ 7 (DS-E 27, production
 * 29) and business_day_rollover 06:00.
 */

/** Production 06/11 (ORC read-only check, DOM 12.4). */
export const PROD_MIN_STAY = [
  { nights: 2, channels: 'all', arrivalWeekdays: ['FRI', 'SAT'] },
  { nights: 2, channels: 'all', arrivalOnSpecialDates: true },
];

/** BUG-R5-003 (a): QA's list of min_stay values the Desk must refuse. */
export const MIN_STAY_BAD: unknown[] = [
  2,
  { nights: 2 },
  [{ nights: 0, channels: 'all', arrivalWeekdays: ['FRI'] }],
  [{ nights: 2, channels: 'all', arrivalWeekdays: ['FRX'] }],
  [{ nights: 2, channels: 'all', arrivalWeekdays: ['FRI', 'FRI'] }],
  [{ nights: 2, channels: ['website'], arrivalWeekdays: ['FRI'] }],
  [{ nights: 2, arrivalWeekdays: ['FRI'] }],
  [{ nights: 2, channels: ['direct', 'internal'], arrivalWeekdays: ['FRI'] }],
  [{ nights: 2, channels: ['direct', 'direct'], arrivalWeekdays: ['FRI'] }],
  [{ nights: 2, channels: [], arrivalWeekdays: ['FRI'] }],
  [null],
  [[2]],
];

/** [key, a refused value, field of the first problem] – BUG-R5-001 (a) and BUG-R5-003 (f). */
export const BAD_SHAPES: Array<[string, unknown, string]> = [
  ['weekend_nights', [5, 6], 'value[0]'],
  ['weekend_nights', [], 'value'],
  ['weekend_nights', 'FRI', 'value'],
  ['weekend_nights', ['FRI', 'FRI'], 'value[1]'],
  ['weekend_nights', ['Fri', 'SAT'], 'value[0]'],
  ['min_stay', [{ nights: 8, channels: 'all', arrivalWeekdays: ['FRI'] }], 'value[0].nights'],
  ['min_stay', [{ nights: 2.5, channels: 'all', arrivalWeekdays: ['FRI'] }], 'value[0].nights'],
  ['min_stay', [{ nights: 2, channels: 'direct', arrivalWeekdays: ['FRI'] }], 'value[0].channels'],
  [
    'min_stay',
    [{ nights: 2, channels: 'all', arrivalWeekday: ['FRI'] }],
    'value[0].arrivalWeekday',
  ],
  ['min_stay', [{ nights: 2, channels: 'all', arrivalWeekdays: [] }], 'value[0]'],
  [
    'min_stay',
    [{ nights: 2, channels: 'all', arrivalOnSpecialDates: 'yes' }],
    'value[0].arrivalOnSpecialDates',
  ],
  ['min_stay', [{ nights: 2, channels: 'all', arrivalOnSpecialDates: false }], 'value[0]'],
  ['special_dates', { from: '2026-12-24', to: '2027-01-02' }, 'value'],
  ['special_dates', [{ from: '2026-12-24' }], 'value[0].to'],
  ['special_dates', [{ from: '2026-12-24', to: '2026-12-24' }], 'value[0].to'],
  ['special_dates', [{ from: '2026-02-30', to: '2026-03-02' }], 'value[0].from'],
  ['special_dates', [{ from: '2027-02-05', to: '2028-02-11' }], 'value[0].to'],
  [
    'special_dates',
    [{ name: 'Tết', from: '2027-02-05', to: '2027-02-11', pct: 30 }],
    'value[0].pct',
  ],
  ['special_dates', [null], 'value[0]'],
  ['los_discount', 10, 'value'],
  ['los_discount', [{ minNights: 7 }], 'value[0].pct'],
  ['los_discount', [{ minNights: 7, pct: 110 }], 'value[0].pct'],
  ['los_discount', [{ minNights: 7, pct: -5 }], 'value[0].pct'],
  ['los_discount', [{ minNights: '7', pct: 10 }], 'value[0].minNights'],
  [
    'los_discount',
    [
      { minNights: 7, pct: 10 },
      { minNights: 7, pct: 15 },
    ],
    'value[1].minNights',
  ],
  ['cancel_policy_direct', { minDays: 7, refundPct: 100 }, 'value'],
  ['cancel_policy_direct', [{ minDays: 7, refundPct: 150 }], 'value[0].refundPct'],
  ['cancel_policy_direct', [{ minDays: -1, refundPct: 0 }], 'value[0].minDays'],
  ['early_checkin_tiers', [{ from: '10:00', to: '12:00' }], 'value[0].pct'],
  ['early_checkin_tiers', [{ from: '12:00', to: '10:00', pct: 30 }], 'value[0].to'],
  ['early_checkin_tiers', [{ from: '10:00', to: '12:00', pct: -30 }], 'value[0].pct'],
  ['early_checkin_tiers', [{ from: '10h', to: '12:00', pct: 30 }], 'value[0].from'],
  [
    'early_checkin_tiers',
    [
      { from: '08:00', to: '11:00', pct: 30 },
      { from: '06:00', to: '10:00', pct: 50 },
    ],
    'value[1]',
  ],
  ['late_checkout_tiers', 30, 'value'],
  ['late_checkout_tiers', [{ after: '15:00', until: '12:00', pct: 30 }], 'value[0].until'],
  ['late_checkout_tiers', [{ after: '12:00', pct: 30 }], 'value[0].until'],
  ['early_departure_refund', 50, 'value'],
  ['early_departure_refund', { minNoticeDays: 1, refundPct: -50 }, 'value.refundPct'],
  ['early_departure_refund', { minNoticeDays: 1, refundPct: 50, extra: 1 }, 'value.extra'],
  ['checkout_reminders', ['09:00'], 'value'],
  [
    'checkout_reminders',
    { before: ['9:00'], overdueWithSameDayArrival: '12:00', overdueOtherwise: '12:31' },
    'value.before[0]',
  ],
  [
    'checkout_reminders',
    { before: [], overdueWithSameDayArrival: '12:00' },
    'value.overdueOtherwise',
  ],
  ['weekend_uplift_channels', 'al', 'value'],
  ['special_uplift_channels', 'internal', 'value'],
  ['max_open_holds_per_user', null, 'value'],
  ['max_open_holds_per_user', { collaborator: -1 }, 'value.collaborator'],
  ['max_open_holds_per_user', { front_desk: 3 }, 'value.front_desk'],
  ['lease_terms', {}, 'value'],
  ['lease_terms', [], 'value'],
  ['lease_terms', [{ months: 1, discountPct: 120 }], 'value[0].discountPct'],
  ['lease_terms', [{ months: 1 }, { months: 1 }], 'value[1].months'],
  // DOM rules-v1.0.5 13.1 (FB-R5-DOM-BE-PR96-01, QA T-13-2…4): percents ≤ 2 decimals, both hold roles, a cancel tier.
  ['los_discount', [{ minNights: 7, pct: 12.345 }], 'value[0].pct'],
  ['cancel_policy_direct', [{ minDays: 7, refundPct: 33.333 }], 'value[0].refundPct'],
  ['early_checkin_tiers', [{ from: '10:00', to: '12:00', pct: 30.001 }], 'value[0].pct'],
  ['late_checkout_tiers', [{ after: '12:00', until: '15:00', pct: 0.125 }], 'value[0].pct'],
  ['early_departure_refund', { minNoticeDays: 1, refundPct: 50.005 }, 'value.refundPct'],
  ['lease_terms', [{ months: 1, discountPct: 2.125 }], 'value[0].discountPct'],
  ['cancel_policy_direct', [], 'value'],
  ['max_open_holds_per_user', {}, 'value.collaborator'],
  ['max_open_holds_per_user', { collaborator: 3 }, 'value.sales_staff'],
];

/** [key, an accepted value]: empty lists that mean "none", the DOM dictionary proposals, the business-day axis. */
export const GOOD_SHAPES: Array<[string, unknown]> = [
  ['weekend_nights', ['FRI', 'SAT']],
  ['weekend_nights', ['SAT']],
  ['min_stay', []],
  ['min_stay', PROD_MIN_STAY],
  [
    'min_stay',
    [
      {
        nights: 3,
        channels: ['direct', 'agent'],
        arrivalWeekdays: ['FRI'],
        arrivalOnSpecialDates: true,
      },
    ],
  ],
  ['special_dates', []],
  ['special_dates', [{ from: '2027-04-16', to: '2027-04-17' }]],
  ['special_dates', [{ name: 'Tết Nguyên đán 2027', from: '2027-02-05', to: '2027-02-11' }]],
  ['los_discount', []],
  ['los_discount', [{ minNights: 7, pct: 15.5 }]],
  ['los_discount', [{ minNights: 7, pct: 12.34 }]],
  ['cancel_policy_direct', [{ minDays: 0, refundPct: 0 }]],
  [
    'cancel_policy_direct',
    [
      { minDays: 7, refundPct: 100 },
      { minDays: 0, refundPct: 0 },
    ],
  ],
  ['early_checkin_tiers', []],
  [
    'early_checkin_tiers',
    [
      { from: '10:00', to: '11:00', pct: 30 },
      { from: '06:00', to: '10:00', pct: 50 },
    ],
  ],
  ['late_checkout_tiers', []],
  // After midnight on the business-day axis (rollover 06:00): 22:00 → 02:00 is a valid tier.
  ['late_checkout_tiers', [{ after: '22:00', until: '02:00', pct: 50 }]],
  ['early_departure_refund', { minNoticeDays: 1, refundPct: 50 }],
  [
    'checkout_reminders',
    {
      before: ['20:00-1d', '10:00'],
      overdueWithSameDayArrival: '12:00',
      overdueOtherwise: '12:30',
    },
  ],
  ['weekend_uplift_channels', 'direct'],
  ['special_uplift_channels', 'all'],
  ['max_open_holds_per_user', { collaborator: 0, sales_staff: 5 }],
  ['max_open_holds_per_user', { collaborator: 3, sales_staff: 10 }],
  ['lease_terms', [{ months: 1 }, { months: 6, discountPct: 5, billingCycle: 'monthly' }]],
];
