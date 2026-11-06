#!/usr/bin/env node
// QA fixture validator (R2 W6/W7/W8). No dependencies – runs with plain Node 22.
//
//  1. fixtures/br-examples.json – structure, coverage against the "Mặc định & ví dụ số"
//     column of docs/business-rules.md, and an independent re-computation of every row
//     that names a `calc` (catches arithmetic slips in BR examples and in this file).
//  2. fixtures/seed/ds-e.json, ds-0.json – internal consistency (codes, references,
//     no double booking, capacity, deposits per BR-305, room status at T0).
//  3. e2e/smoke-manifest.json – exactly the (S) test cases of test-cases/r1-main-flows.md.
//
// Usage: node tools/validate-fixtures.mjs [--verbose]   (exit 1 on any error)

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TESTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCT = join(TESTS, '..');
const verbose = process.argv.includes('--verbose');
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ---------------------------------------------------------------- integer money helpers
// Round n/d to the nearest multiple of `step`, half-up (BR-005 example 4.750.000 → 4.800.000).
const roundTo = (n, d, step) => {
  if (n < 0) return -roundTo(-n, d, step);
  return Math.floor((2 * n + d * step) / (2 * d * step)) * step;
};
const roundDiv = (n, d) => roundTo(n, d, 1);
const ratio = (s) => {
  // "1.5" → [15, 10]; "8.3" → [83, 10]; "2" → [2, 1]
  const [i, f = ''] = String(s).split('.');
  const den = 10 ** f.length;
  return [Number(i) * den + Number(f || 0), den];
};

// ---------------------------------------------------------------- Asia/Ho_Chi_Minh time helpers (fixed +07:00, BR-001)
const OFF = 7 * 3600e3;
const ISO_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ms = (iso) => Date.parse(iso);
const fmt = (t) => new Date(t + OFF).toISOString().slice(0, 19) + '+07:00';
const localDate = (t) => new Date(t + OFF).toISOString().slice(0, 10);
const localHM = (t) => new Date(t + OFF).toISOString().slice(11, 16);
const at = (date, hm) => ms(`${date}T${hm}:00+07:00`);
const dayNum = (date) => Date.parse(`${date}T00:00:00Z`) / 864e5;
const addDays = (date, n) => new Date((dayNum(date) + n) * 864e5).toISOString().slice(0, 10);
const diffDays = (a, b) => dayNum(a) - dayNum(b);
const weekday = (date) =>
  ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(`${date}T00:00:00Z`).getUTCDay()];
const addMonths = (date, n) => {
  // calendar months, clamped to month end (BR-209)
  const [y, m, d] = date.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${String(nm).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
};
const businessDate = (t, rollover = '06:00') =>
  localHM(t) < rollover ? addDays(localDate(t), -1) : localDate(t);
const nightsBetween = (a, b) => Array.from({ length: diffDays(b, a) }, (_, i) => addDays(a, i));
const minT = (...xs) => Math.min(...xs);

// ---------------------------------------------------------------- reference calculators (one per `calc` name)
// staff / collaborator (bp): ví dụ theo tỷ lệ cũ ESC-005 (trước 01/11 – hết hiệu lực), chỉ để kiểm các dòng oracle cũ.
// Tỷ lệ hoa hồng từ 01/11 theo bảng nội bộ INV, không ghi ở kho mã (FB-R4-SEC-BE-01).
const LEASE_TIERS = [
  {
    months: 1,
    discountBp: 0,
    dep: { vn: '0.5', foreign: '1' },
    cycle: 1,
    staff: 300,
    collaborator: 500,
  },
  {
    months: 3,
    discountBp: 500,
    dep: { vn: '1', foreign: '1' },
    cycle: 3,
    staff: 400,
    collaborator: 600,
  },
  {
    months: 6,
    discountBp: 800,
    dep: { vn: '1', foreign: '1.5' },
    cycle: 3,
    staff: 500,
    collaborator: 700,
  },
  {
    months: 12,
    discountBp: 1200,
    dep: { vn: '1', foreign: '2' },
    cycle: 3,
    staff: 600,
    collaborator: 830,
  },
  {
    months: 24,
    discountBp: 1500,
    dep: { vn: '2', foreign: '2' },
    cycle: 3,
    staff: 400,
    collaborator: 600,
  },
];
// BR-201 v0.5.0+: dòng oracle mang bảng mới trong params.lease_terms (cùng cấu trúc, `months` = tháng đầu của khoảng);
// không có params → bảng cũ trước 01/11 (DS-E). Ký quỹ bảng mới = n tháng tiền thuê, không làm tròn thêm (BR-206, mục 13).
const tierFor = (months, tiers = LEASE_TIERS) =>
  [...tiers].reverse().find((t) => t.months <= months);
const pctOfRate = (rate, pct) => roundTo(rate * pct, 100, 1000);
const earlyPct = (hm) => (hm >= '12:00' ? 0 : hm >= '10:00' ? 30 : hm >= '06:00' ? 50 : null);
let MINIBAR = {};
let SPECIAL_DATES = []; // DS-E special_dates (half-open [from, to)), loaded by validateSeeds
let SEED_PARAMS = {};

// BR-103/104 v0.3: rate calendar applies to every channel (direct included). Special date and weekend do
// not stack – special (+30%) wins. Direct rates round to 1.000, OTA rates to 10.000 (BR-005).
const isSpecial = (date, list = SPECIAL_DATES) => list.some((s) => s.from <= date && date < s.to);
const calendarRateFor = (baseVnd, date, channel = 'direct', p = {}) => {
  const step = channel === 'ota' ? 10000 : 1000;
  const weekend = p.weekend_nights ?? ['FRI', 'SAT'];
  if (isSpecial(date, p.special_dates ?? SPECIAL_DATES))
    return roundTo(baseVnd * (100 + (p.special_uplift_pct ?? 30)), 100, step);
  if (weekend.includes(weekday(date)))
    return roundTo(baseVnd * (100 + (p.weekend_uplift_pct ?? 15)), 100, step);
  return baseVnd;
};
const nightlyRates = (baseVnd, arrivalDate, nights, channel, p) =>
  nightsBetween(arrivalDate, addDays(arrivalDate, nights)).map((d) =>
    calendarRateFor(baseVnd, d, channel, p),
  );
const ageAt = (dob, date) => {
  const [y, m, d] = dob.split('-').map(Number);
  const [Y, M, D] = date.split('-').map(Number);
  return Y - y - (M < m || (M === m && D < d) ? 1 : 0);
};
// BR-110 v0.3.1: persons counted = adults + children >= child_free_under_age. Adults fill the base first,
// so the persons over base are the cheapest ones. Returns null when over max occupancy.
const occupancy = ({ adults, childrenAges }, p) => {
  const freeUnder = p.child_free_under_age ?? 6;
  const adultFrom = p.adult_from_age ?? 12;
  const fees = [
    ...Array(adults).fill(p.extra_adult_fee ?? 150000),
    ...childrenAges
      .filter((a) => a >= freeUnder)
      .map((a) => (a >= adultFrom ? (p.extra_adult_fee ?? 150000) : (p.child_fee_6_11 ?? 100000))),
  ].sort((a, b) => b - a);
  return { counted: fees.length, fees };
};

const CALC = {
  holdDeadline: ({ createdAt, holdHours, arrivalDate }) => {
    const c = ms(createdAt);
    if (localDate(c) === arrivalDate) return { holdAllowed: false };
    return { expiresAt: fmt(minT(c + holdHours * 3600e3, at(arrivalDate, '12:00'))) };
  },
  holdExtension: ({ arrivalDate, currentExpiresAt, extendHours }) => ({
    newExpiresAt: fmt(minT(ms(currentExpiresAt) + extendHours * 3600e3, at(arrivalDate, '12:00'))),
  }),
  nights: ({ arrivalDate, departureDate }) => ({
    nights: diffDays(departureDate, arrivalDate),
    nightDates: nightsBetween(arrivalDate, departureDate),
  }),
  rangesOverlap: (i) => {
    const [a0, a1] = i.a ? [i.a.arrivalDate, i.a.departureDate] : i.block;
    const [b0, b1] = i.b ? [i.b.arrivalDate, i.b.departureDate] : i.booking;
    return { overlap: a0 < b1 && b0 < a1, blockedNights: diffDays(a1, a0) };
  },
  usdDisplay: ({ amountVnd }, p) => ({
    usdDisplay: (Math.round((amountVnd * 10) / p.fx_usd_vnd) / 10).toFixed(1),
  }),
  roundNearest: ({ valueVnd, stepVnd }) => ({ roundedVnd: roundTo(valueVnd, 1, stepVnd) }),
  docCode: ({ docType, sequence, year }) => {
    const spec = {
      reservation: ['OTM-', 5],
      quote: ['BG-', 5],
      work_order: ['WO-', 5],
      guest: ['KH-', 4],
      bill: [`F${String(year).slice(2)}-`, 6],
    }[docType];
    return { code: spec[0] + String(sequence).padStart(spec[1], '0') };
  },
  businessDate: ({ at: a }, p) => ({ businessDate: businessDate(ms(a), p?.business_day_rollover) }),
  noticeDays: ({ anchorDate, notifiedAt }) => ({
    noticeDays: diffDays(anchorDate, businessDate(ms(notifiedAt))),
  }),
  longStayNightRate: ({ leaseMonthlyRentVnd }) => ({
    longStayNightRateVnd: roundTo(leaseMonthlyRentVnd, 30, 1000),
  }),
  // v0.5.2 (P4-20): mức tăng và đêm cuối tuần lấy từ params của dòng (bảng giá 01/11: 0 %); thiếu → DS-E cũ (+15 %).
  otaWeekendRate: ({ otaBaseRateVnd, nightDate }, p = {}) => ({
    otaRateVnd: (p.weekend_nights ?? ['FRI', 'SAT']).includes(weekday(nightDate))
      ? roundTo(otaBaseRateVnd * (100 + (p.weekend_uplift_pct ?? 15)), 100, 10000)
      : otaBaseRateVnd,
  }),
  rateFloorCeiling: ({ otaBaseRateVnd }) => ({
    floorVnd: roundTo(otaBaseRateVnd * 70, 100, 10000),
    ceilingVnd: roundTo(otaBaseRateVnd * 250, 100, 10000),
  }),
  // BR-113 (min stay, mặc định ESC-004 M-A): ngày đến T6/T7 hoặc ngày đặc biệt (special_dates seed) → 2 đêm, còn lại 1.
  // Chỉ phần "chặn hay không"; ngoại lệ đêm lẻ / kênh nội bộ (BR-113-02…04) chưa tính ở đây (calc null).
  minStay: ({ arrivalDate, nights }, p) => {
    const special = isSpecial(arrivalDate, p.special_dates ?? SPECIAL_DATES);
    const minStayNights = special || ['FRI', 'SAT'].includes(weekday(arrivalDate)) ? 2 : 1;
    return { minStayNights, accepted: nights >= minStayNights };
  },
  calendarRate: ({ baseRateVnd, nightDate, channel }, p) => ({
    rateVnd: calendarRateFor(baseRateVnd, nightDate, channel, p),
  }),
  losDiscount: (i, p) => {
    const { nights, channel } = i;
    // v0.5.2 (P4-20): bậc lấy từ params.los_discount của dòng (bảng giá 01/11: []); thiếu → DS-E cũ (7 đêm 10 %, 14 đêm 15 %).
    const tiers = p.los_discount ?? [
      { minNights: 7, pct: 10 },
      { minNights: 14, pct: 15 },
    ];
    const bp =
      channel === 'ota'
        ? 0
        : Math.max(0, ...tiers.filter((x) => nights >= x.minNights).map((x) => x.pct * 100));
    const disc = (r) => roundTo(r * (10000 - bp), 10000, 1000);
    if (i.nightlyRatesVnd) {
      // v0.3: discount applies to each night after the rate calendar (BR-107)
      const cal = nightlyRates(i.nightlyListPriceVnd, i.arrivalDate, nights, 'direct', p);
      const out = i.nightlyRatesVnd.map(disc);
      return {
        discountBp: bp,
        nightlyRatesVnd: cal,
        inputNightlyRatesMatchCalendar: deepEq(cal, i.nightlyRatesVnd),
        discountedNightlyRatesVnd: out,
        roomTotalVnd: out.reduce((a, b) => a + b, 0),
      };
    }
    const r = disc(i.nightlyRateVnd);
    return { discountBp: bp, discountedNightlyRateVnd: r, roomTotalVnd: r * nights };
  },
  extraPersonFee: (i, p) => {
    const base = p[`room.${i.roomNo}.base_occupancy`] ?? p.base_occupancy;
    const max = p[`room.${i.roomNo}.max_occupancy`];
    const { counted, fees } = occupancy(i, p);
    if (max !== undefined && counted > max)
      return { accepted: false, countedPersons: counted, extraPersonFeeVnd: 0, extraGuestKits: 0 };
    const over = Math.max(0, counted - base);
    // OTA (BR-110): no fee for persons already included in the OTA guest count; kit still issued (BR-812)
    const charged = Math.max(0, counted - Math.max(base, i.otaGuestCount ?? 0));
    const perNight = fees.slice(fees.length - charged).reduce((a, b) => a + b, 0);
    return {
      accepted: true,
      countedPersons: counted,
      extraPersonFeeVnd: charged ? perNight * i.nights : 0,
      extraGuestKits: over,
    };
  },
  extraGuestKitDue: (i, p) => {
    if (i.midStayConfirmedAt)
      return {
        dueAt: fmt(ms(i.midStayConfirmedAt) + (p.extra_guest_kit_midstay_due_minutes ?? 60) * 60e3),
      };
    // BR-812 (2) v0.3.2: hạn = giờ nhận phòng của đơn (14:00 hoặc nhận sớm đã xác nhận), nhưng không sớm hơn
    // lúc xác nhận + extra_guest_kit_midstay_due_minutes (đơn xác nhận sát/sau giờ nhận phòng – BR-812-10)
    const checkin = at(i.arrivalDate, i.confirmedEarlyCheckinTime ?? p.checkin_time ?? '14:00');
    const floor = i.confirmedAt
      ? ms(i.confirmedAt) + (p.extra_guest_kit_midstay_due_minutes ?? 60) * 60e3
      : -Infinity;
    return { dueAt: fmt(Math.max(checkin, floor)) };
  },
  forceMajeureReschedule: ({ arrivalDate, depositVnd }, p) => ({
    refundVnd: 0,
    rescheduleAllowed: true,
    latestNewArrivalDate: addMonths(arrivalDate, p.force_majeure_reschedule_months ?? 3),
    depositKeptVnd: depositVnd,
  }),
  noDepositBooking: ({ bookedAt, arrivalDate }, p) => {
    const lead = diffDays(arrivalDate, businessDate(ms(bookedAt)));
    return lead <= (p.no_deposit_max_lead_days ?? 2)
      ? {
          leadDays: lead,
          accepted: true,
          approverRole: 'manager',
          holdUntil: fmt(at(arrivalDate, p.no_deposit_hold_until ?? '18:00')),
        }
      : { leadDays: lead, accepted: false };
  },
  bookingWindow: ({ today }, p) => ({
    lastBookableArrivalDate: addDays(today, p.booking_window_days - 1),
  }),
  leaseTier: ({ termMonths }, p) => {
    const t = tierFor(termMonths, p?.lease_terms);
    return { tierMonths: t.months, discountBp: t.discountBp };
  },
  leaseRent: ({ monthlyListPriceVnd, guestClass, termMonths }, p) => {
    const sur = guestClass === 'foreign' ? 110 : 100;
    return {
      monthlyRentVnd: roundTo(
        monthlyListPriceVnd * sur * (10000 - tierFor(termMonths, p?.lease_terms).discountBp),
        1000000,
        p?.['rounding.monthly_rent'] ?? 10000,
      ),
    };
  },
  leaseServiceFee: ({ cleaningsPerWeek, cleaningPriceVnd, serviceFeeFixedVnd }) => {
    const c = roundTo(cleaningsPerWeek * 52 * cleaningPriceVnd, 12, 1000);
    return { cleaningFeeMonthlyVnd: c, serviceFeeMonthlyVnd: serviceFeeFixedVnd + c };
  },
  utilityEstimate: ({ guestClass, persons }, p) => {
    const [kwh, m3x10] = guestClass === 'foreign' ? [170, 40] : [120, 35];
    return {
      estimateMonthlyVnd:
        persons * (kwh * p.electricity_price) + roundDiv(persons * m3x10 * p.water_price, 10),
    };
  },
  leaseDeposit: ({ monthlyRentVnd, guestClass, termMonths }, p) => {
    const t = tierFor(termMonths, p?.lease_terms);
    const [n, d] = ratio(t.dep[guestClass === 'foreign' ? 'foreign' : 'vn']);
    return { depositVnd: roundTo(monthlyRentVnd * n, d, p?.lease_terms ? 1 : 100000) };
  },
  dueAtSigning: ({ depositVnd, monthlyRentVnd, serviceFeeMonthlyVnd, billingCycleMonths }) => ({
    dueAtSigningVnd: depositVnd + (monthlyRentVnd + serviceFeeMonthlyVnd) * billingCycleMonths,
  }),
  leaseCommission: ({ monthlyRentVnd, termMonths, closer, guestClass }) => {
    const t = tierFor(termMonths);
    const bp =
      (closer === 'staff' ? t.staff : t.collaborator) + (guestClass === 'foreign' ? 100 : 0);
    const total = roundDiv(monthlyRentVnd * termMonths * bp, 10000);
    const first = roundDiv(total, 2);
    return { commissionBp: bp, commissionVnd: total, tranchesVnd: [first, total - first] };
  },
  commissionPayable: ({ trancheEarnedDate }, p) => {
    const first = addMonths(trancheEarnedDate.slice(0, 8) + '01', 1);
    return {
      payableDate: first.slice(0, 8) + String(p.commission_payable_day).padStart(2, '0'),
      payByDate: first.slice(0, 8) + String(p.commission_pay_by_day).padStart(2, '0'),
    };
  },
  leaseEndDate: ({ leaseStart, termMonths }) => ({
    checkoutDate: addMonths(leaseStart, termMonths),
    checkoutTime: '12:00',
  }),
  maintenanceNextDue: ({ completedDate, cycleMonths }) => ({
    nextDueDate: addMonths(completedDate, cycleMonths),
  }),
  oddDays: ({ longStayNightRateVnd, days, serviceFeeMonthlyVnd }) => ({
    rentVnd: longStayNightRateVnd * days,
    serviceFeeProratedVnd: roundTo(serviceFeeMonthlyVnd * days, 30, 1000),
  }),
  leaseRevenueAllocation: ({ leaseStart, monthlyRentVnd }) => {
    const end = addMonths(leaseStart, 1);
    const total = diffDays(end, leaseStart);
    const byMonth = {};
    for (const n of nightsBetween(leaseStart, end))
      byMonth[n.slice(0, 7)] = (byMonth[n.slice(0, 7)] ?? 0) + 1;
    // Q-10 (DATA A7-01, 18/10): mỗi đêm lấy phần nguyên, phần dư dồn vào đêm cuối tháng HĐ; Q-02: không chia lại
    // theo tỷ lệ tháng báo cáo → tháng báo cáo = số đêm × giá đêm, tháng chứa đêm cuối nhận thêm phần dư.
    const perNight = Math.floor(monthlyRentVnd / total);
    const rest = monthlyRentVnd - perNight * total;
    const keys = Object.keys(byMonth);
    const alloc = {};
    keys.forEach((k, i) => {
      alloc[k] = byMonth[k] * perNight + (i === keys.length - 1 ? rest : 0);
    });
    return {
      contractMonthNights: total,
      perNightVnd: perNight,
      reportMonthAllocationVnd: alloc,
    };
  },
  shortDeposit: ({ roomTotalVnd, extraPersonFeeVnd }) => {
    // BR-305 v0.3: deposit base = room total only (no extra-person fee, early/late fees, services)
    const dep = roundTo(roomTotalVnd * 30, 100, 100000);
    return {
      depositVnd: dep,
      remainingAtCheckinVnd: roomTotalVnd - dep,
      ...(extraPersonFeeVnd !== undefined
        ? { dueAtCheckinVnd: roomTotalVnd - dep + extraPersonFeeVnd }
        : {}),
    };
  },
  directCancelRefund: ({ depositVnd, arrivalDate, notifiedAt, peakNight }) => {
    const days = diffDays(arrivalDate, businessDate(ms(notifiedAt)));
    const pct = peakNight ? 0 : days >= 7 ? 100 : days >= 3 ? 50 : 0;
    const refund = roundDiv(depositVnd * pct, 100);
    return { noticeDays: days, refundVnd: refund, cancelFeeVnd: depositVnd - refund };
  },
  groupDeposit: ({ roomTotalsVnd }) => {
    const total = roomTotalsVnd.reduce((a, b) => a + b, 0);
    const dep = roundTo(total * 30, 100, 100000);
    const alloc = roomTotalsVnd.slice(0, -1).map((t) => roundTo(dep * t, total, 1000));
    alloc.push(dep - alloc.reduce((a, b) => a + b, 0));
    return { groupTotalVnd: total, groupDepositVnd: dep, allocationVnd: alloc };
  },
  shortCommission: (i, p) => {
    const base = i.roomTotalVnd ?? i.groupRoomTotalVnd;
    const pct = p.short_stay_commission_pct[i.closer];
    return { commissionVnd: roundDiv(base * pct, 100), commissionRecords: 1 };
  },
  earlyCheckin: ({ firstNightRateVnd, checkinTime, previousNightVacant }) => {
    const pct = earlyPct(checkinTime);
    if (pct === null)
      return {
        surchargeVnd: 0,
        extraNight: true,
        ...(previousNightVacant ? { extraNightRateVnd: firstNightRateVnd } : {}),
      };
    return { surchargeVnd: pctOfRate(firstNightRateVnd, pct), extraNight: false };
  },
  otaEarlyCheckin: ({ directCurrentRateVnd, checkinTime }) => ({
    surchargeBaseVnd: directCurrentRateVnd,
    surchargeVnd: pctOfRate(directCurrentRateVnd, earlyPct(checkinTime)),
  }),
  lateCheckout: (
    { lastNightRateVnd, checkoutTime, sameDayArrival, channel, departureNightSellable },
    p,
  ) => {
    // BR-421 v0.5.3 (c), (d) – BUG-R4-038: an Internal stay's surcharge is % × its own last night (0 → 0, no line);
    // after 18:00 its added night – or the late charge of one night when that night is sold – is 0 ₫ by (a).
    const internal = channel === 'internal';
    const graceApplies = !(p.late_grace_requires_no_same_day_arrival && sameDayArrival);
    const freeUntil = graceApplies && p.late_grace_until > '12:00' ? p.late_grace_until : '12:00';
    if (checkoutTime <= freeUntil)
      return { surchargeVnd: 0, convertToExtension: false, surchargeLineWritten: false };
    if (checkoutTime > '18:00') {
      if (internal && departureNightSellable === false)
        return {
          surchargeVnd: 0,
          convertToExtension: false,
          lateFeeAsNightVnd: 0,
          surchargeLineWritten: false,
        };
      return {
        surchargeVnd: 0,
        convertToExtension: true,
        extensionNights: 1,
        extensionVnd: internal ? 0 : lastNightRateVnd,
        ...(internal ? { extraNightSource: 'complimentary' } : {}),
      };
    }
    const pct = checkoutTime > '15:00' ? 50 : 30;
    const surchargeVnd = pctOfRate(lastNightRateVnd, pct);
    return { surchargeVnd, convertToExtension: false, surchargeLineWritten: surchargeVnd > 0 };
  },
  longStayLateCheckout: ({ leaseMonthlyRentVnd, checkoutTime }) => {
    const base = roundTo(leaseMonthlyRentVnd, 30, 1000);
    const pct = checkoutTime > '15:00' ? 50 : checkoutTime > '12:00' ? 30 : 0;
    return { baseNightRateVnd: base, surchargeVnd: pctOfRate(base, pct) };
  },
  extension: (i, p) => {
    const { channel, nightRateVnd, directCurrentRateVnd, extraNights } = i;
    if (channel === 'internal') {
      // BR-421 v0.5.3 (a), (b) – BUG-R4-038: an Internal added night is 0 ₫ `complimentary` (also typed 0), a typed
      // price > 0 is `manual`; no BR-105 floor–ceiling, no BR-107 tier.
      const nightsVnd = Array.from({ length: extraNights }, (_, k) => i.typedRatesVnd?.[k] ?? 0);
      const extensionVnd = nightsVnd.reduce((a, b) => a + b, 0);
      return {
        accepted: nightsVnd.every((v) => v >= 0),
        nightsVnd,
        nightSources: nightsVnd.map((v) => (v > 0 ? 'manual' : 'complimentary')),
        floorCeilingApplies: false,
        extensionVnd,
        amountDueAfterVnd: (i.folioDueBeforeVnd ?? 0) + extensionVnd,
      };
    }
    if (i.extraNightDates && i.directListPriceVnd && !['direct', 'collaborator'].includes(channel))
      // BR-421 v0.3: OTA extension = current direct rate per night, rate calendar included (BR-104)
      return {
        extensionVnd: i.extraNightDates
          .map((d) => calendarRateFor(i.directListPriceVnd, d, 'direct', p))
          .reduce((a, b) => a + b, 0),
      };
    return {
      extensionVnd:
        (['direct', 'collaborator'].includes(channel) ? nightRateVnd : directCurrentRateVnd) *
        extraNights,
    };
  },
  channelSaving: ({ extensionVnd }, p) => {
    const [n, d] = ratio(p['channel_commission_pct.airbnb']);
    return { savingBp: (n * 100) / d, savingVnd: roundTo(extensionVnd * n, d * 100, 1000) };
  },
  earlyDeparture: ({ departureDate, nightRateVnd, notifiedAt, newDepartureDate }) => {
    const days = diffDays(newDepartureDate, businessDate(ms(notifiedAt)));
    const cancelled = nightsBetween(newDepartureDate, departureDate);
    return {
      noticeDays: days,
      cancelledNights: cancelled,
      refundVnd: days >= 1 ? roundDiv(nightRateVnd * cancelled.length * 50, 100) : 0,
    };
  },
  focLimit: ({ amountVnd, approverRole }, p) =>
    amountVnd <= p.foc_limits[approverRole].perTime
      ? { withinLimit: true }
      : { withinLimit: false, escalateTo: 'manager' },
  focAlertThreshold: ({ roomRevenueMonthVnd }, p) => ({
    focAlertThresholdVnd: roundDiv(roomRevenueMonthVnd * p.foc_alert_pct_of_room_revenue, 100),
  }),
  focSelfApply: ({ category, amountVnd, monthToDateVnd }, p) => {
    const ok =
      category === 'minibar' &&
      amountVnd <= p['foc_self_apply.front_desk.per_time'] &&
      monthToDateVnd + amountVnd <= p['foc_self_apply.front_desk.per_month'];
    return ok
      ? { selfApplyAllowed: true, monthToDateAfterVnd: monthToDateVnd + amountVnd }
      : { selfApplyAllowed: false, routeTo: 'front_desk_lead' };
  },
  utilityBill: ({ kwh, m3 }, p) => {
    const e = kwh * p.electricity_price;
    const w = m3 * p.water_price;
    return { electricityVnd: e, waterVnd: w, totalVnd: e + w };
  },
  meterAnomaly: ({ previousKwh, currentKwh }, p) => ({
    anomalyWarning:
      currentKwh * previousKwh.length >
      p.meter_anomaly_factor * previousKwh.reduce((a, b) => a + b, 0),
  }),
  penalty: ({ cardsIssued, cardsReturned, smoking }, p) => ({
    penaltyVnd: (cardsIssued - cardsReturned) * p.key_card_fee + (smoking ? p.smoking_fee : 0),
  }),
  vatSplit: ({ grossVnd }, p) => {
    const net = roundDiv(grossVnd * 100, 100 + p.vat_rate);
    return { netVnd: net, vatVnd: grossVnd - net };
  },
  cashVariance: ({ systemCashVnd, countedCashVnd }) => {
    const v = countedCashVnd - systemCashVnd;
    return { varianceVnd: v, reasonRequired: v !== 0, notifyManager: v !== 0 };
  },
  registrationDeadline: (i, p) => {
    const a = ms(i.arrivedAt ?? i.actualCheckinAt);
    const d = localDate(a);
    const out = {};
    if (i.guestClass === 'vn') {
      out.deadline = fmt(localHM(a) >= '23:00' ? at(addDays(d, 1), '08:00') : at(d, '23:00'));
    } else {
      const plus = a + (p.registration_deadline_foreigner_hours ?? 12) * 3600e3;
      const cut = at(d, '23:00');
      out.deadline = fmt(
        p.registration_deadline_foreigner_mode === 'earlier_of' && a < cut
          ? Math.min(plus, cut)
          : plus,
      );
    }
    if (p.registration_digest_times) {
      const cands = [0, 1].flatMap((k) =>
        p.registration_digest_times.map((hm) => at(addDays(d, k), hm)),
      );
      out.digestAt = fmt(Math.min(...cands.filter((c) => c > a)));
    }
    return out;
  },
  visaReminder: ({ stayType, visaExpiry, departureDate }, p) => ({
    declareUntil: visaExpiry < departureDate ? visaExpiry : departureDate,
    remindFrom: addDays(
      visaExpiry,
      -p[`visa_expiry_warning_days.${stayType === 'long' ? 'long_stay' : 'short_stay'}`],
    ),
    redAlert: visaExpiry < departureDate,
  }),
  minibarCharge: ({ used }) => ({
    amountVnd: Object.entries(used).reduce((s, [code, q]) => s + q * MINIBAR[code].salePriceVnd, 0),
  }),
  weightedAvgCost: ({ onHandQty, onHandUnitCostVnd, receivedQty, receivedUnitCostVnd }) => ({
    avgUnitCostVnd: roundDiv(
      onHandQty * onHandUnitCostVnd + receivedQty * receivedUnitCostVnd,
      onHandQty + receivedQty,
    ),
  }),
  oooBlock: ({ startDate, expectedDoneDate }, p) => {
    const reopen = addDays(expectedDoneDate, p.ooo_reopen_buffer_days);
    const nights = nightsBetween(startDate, reopen);
    return {
      block: [startDate, reopen],
      blockedNights: nights,
      reopenDate: reopen,
      availableRoomNightsOct: 10 * 31 - nights.filter((n) => n.startsWith('2026-10')).length,
    };
  },
  vacantReinspect: ({ inspectedAt, now }, p) => ({
    status: ms(now) - ms(inspectedAt) >= p.vacant_reinspect_days * 864e5 ? 'VC' : 'VI',
  }),
  guestRequestSla: ({ sentAt }, p) => {
    const t = ms(sentAt);
    const [open, close] = p.front_desk_hours;
    const inHours = localHM(t) >= open && localHM(t) < close;
    return inHours
      ? { inHours: true, replyBy: fmt(t + p.guest_request_response_minutes * 60e3) }
      : { inHours: false, autoReply: true };
  },
  channelFee: ({ grossVnd }, p) => {
    const [n, d] = ratio(p['channel_commission_pct.agoda']);
    const fee = roundDiv(grossVnd * n, d * 100);
    return { channelFeeVnd: fee, netVnd: grossVnd - fee };
  },
  availableNights: ({ rooms, daysInMonth, oooNights }) => ({
    availableRoomNights: rooms * daysInMonth - oooNights,
  }),
  normalizePhone: ({ phone }) => {
    const d = phone.replace(/\D/g, '').replace(/^0/, '84');
    return { normalized: d, display: `+${d}` };
  },

  // ---- v0.5.2 (P4-20, FB-R4-QA-DOM-PR25-01): bảng giá 01/11, tính bằng params của dòng.
  // BR-108: ngắn ngày hay thuê tháng theo số đêm (`long_stay_required_from_nights`); một mức giá mọi đêm.
  stayKindByNights: (i, p) => {
    const one = (n) => {
      if (n >= p.long_stay_required_from_nights) {
        const out = { stayKind: 'long' };
        if (i.monthlyListPriceVnd !== undefined) {
          out.monthlyRentVnd = i.monthlyListPriceVnd; // HĐ 1 tháng: khoảng 1–3 tháng giảm 0 % (BR-201)
          out.serviceFeeMonthlyVnd = p.service_fee_monthly;
          out.depositVnd = i.monthlyListPriceVnd * (p.lease_deposit_months ?? 1); // BR-206
        }
        return out;
      }
      // Tổng ngắn ngày = giá đêm × số đêm chỉ đúng với lịch giá 01/11 (không tăng cuối tuần/lễ, không giảm theo
      // số đêm – BR-104, BR-107). Dòng phải tự khai lịch đó trong params để BE (byCalc gộp params lên DS-E) ra cùng số
      // (FB-R4-BE-C-DOM BR-108-03, 04/11).
      const flat =
        p.weekend_uplift_pct === 0 &&
        p.special_uplift_pct === 0 &&
        Array.isArray(p.los_discount) &&
        p.los_discount.length === 0;
      if (!flat)
        throw new Error(
          'tổng ngắn ngày cần params lịch 01/11: weekend_uplift_pct 0, special_uplift_pct 0, los_discount []',
        );
      return {
        stayKind: 'short',
        showLongStayOption: n >= (p.long_stay_compare_from_nights ?? Infinity),
        shortStayTotalVnd: i.nightlyListPriceVnd * n,
      };
    };
    if (i.nightsCases) return Object.fromEntries(i.nightsCases.map((n) => [String(n), one(n)]));
    return one(i.nights);
  },
  // BR-110 (v0.3.4, tính theo đêm): thêm người giữa kỳ ở – người vượt định mức là người rẻ nhất.
  extraPersonFeeChange: (i, p) => {
    const ch = i.change;
    const after = { adults: i.adults + (ch.addAdults ?? 0), childrenAges: i.childrenAges };
    const base = p[`room.${i.roomNo}.base_occupancy`];
    const { counted, fees } = occupancy(after, p);
    const charged = Math.max(0, counted - base);
    const perNight = fees.slice(fees.length - charged).reduce((a, b) => a + b, 0);
    const n = diffDays(i.departureDate, ch.effectiveFrom);
    return { extraPersonFeePerNightVnd: perNight, extraPersonFeeVnd: perNight * n };
  },
  // BR-114: giá "từ" = giá đêm thấp nhất của các căn đang bán (định mức, kênh Trực tiếp).
  fromPrice: ({ nightlyListPriceVnd }) => {
    const min = Math.min(...Object.values(nightlyListPriceVnd));
    return {
      fromPriceVnd: min,
      fromRoomNos: Object.entries(nightlyListPriceVnd)
        .filter(([, v]) => v === min)
        .map(([k]) => k)
        .sort(),
    };
  },
  // BR-104/114: giá của từng đêm theo lịch giá (params của dòng).
  nightRates: ({ nightlyListPriceVnd, nights, channel }, p) => ({
    ratesVnd: nights.map((d) => calendarRateFor(nightlyListPriceVnd, d, channel ?? 'direct', p)),
  }),
  // BR-115: giá ước tính trên web theo hạng công khai (params.public_types: căn, giá đêm, định mức, tối đa).
  // Thứ tự lý do không hiện số: từ 30 đêm → vượt sức chứa → dưới ở tối thiểu → có đêm sau open_until.
  webEstimate: (i, p) => {
    const t = p.public_types[i.publicRoomType];
    const one = (arrival, departure) => {
      const n = diffDays(departure, arrival);
      const noPrice = (reason, extra = {}) => ({
        priceShown: false,
        noPriceReason: reason,
        ...extra,
        inquiryAllowed: true,
      });
      if (n >= p.long_stay_required_from_nights)
        return { priceShown: false, noPriceReason: 'monthly_offer', monthlyFigureShown: false };
      const { counted, fees } = occupancy(i, p);
      if (counted > t.max) return noPrice('over_max_occupancy', { maxGuests: t.max });
      const stay = CALC.minStay({ arrivalDate: arrival, nights: n }, p);
      if (!stay.accepted) return noPrice('below_min_stay', { minStayNights: stay.minStayNights });
      const dates = nightsBetween(arrival, departure);
      if (dates.some((d) => d > p['web_estimate.open_until'])) return noPrice('after_open_until');
      const room = dates
        .map((d) => calendarRateFor(t.nightlyVnd, d, 'direct', p))
        .reduce((a, b) => a + b, 0);
      const charged = Math.max(0, counted - t.base);
      const extra = fees.slice(fees.length - charged).reduce((a, b) => a + b, 0) * n;
      return {
        priceShown: true,
        fromTotalVnd: room + extra,
        toTotalVnd: room + extra,
        roomTotalVnd: room,
        extraPersonFeeVnd: extra,
        participatingRoomNos: [...t.roomNos].sort(),
      };
    };
    if (i.nightsCases)
      return Object.fromEntries(
        i.nightsCases.map((n) => [String(n), one(i.arrivalDate, addDays(i.arrivalDate, n))]),
      );
    return one(i.arrivalDate, i.departureDate);
  },
  // BR-116: tổng Trực tiếp và tổng sàn OTA của cùng chuyến (một mức giá → sàn thừa).
  parityFloor: (i, p) => {
    const dates = nightsBetween(i.arrivalDate, i.departureDate);
    const sum = (base, ch) =>
      dates.map((d) => calendarRateFor(base, d, ch, p)).reduce((a, b) => a + b, 0);
    const direct = sum(i.nightlyListPriceVnd, 'direct');
    const floor = sum(i.otaBaseRateVnd[i.roomGroup], 'ota');
    return { directTotalVnd: direct, otaFloorTotalVnd: floor, floorChangesFigure: floor > direct };
  },
  // BR-428 (v0.4.8): chia số dư thừa theo thứ tự phụ thu người → chênh lệch đổi phòng → phần hoàn BR-428.
  earlyDepartureCap: (i) => {
    let left = i.unhandledCreditAfterVnd;
    const take = (x) => {
      const got = Math.max(0, Math.min(left, x));
      left -= got;
      return got;
    };
    const ep = take(i.extraPersonDroppedVnd);
    const rc = take(i.roomChangeDifferenceDroppedVnd);
    const br = take(i.refundableVnd);
    const total = i.extraPersonDroppedVnd + i.roomChangeDifferenceDroppedVnd + i.refundableVnd;
    return {
      extraPersonRefundVnd: ep,
      extraPersonReversedVnd: i.extraPersonDroppedVnd - ep,
      roomChangeDifferenceVnd: rc,
      roomChangeDifferenceReversedVnd: i.roomChangeDifferenceDroppedVnd - rc,
      refundablePaidVnd: br,
      refundVnd: ep + rc + br,
      refundCapped: ep + rc + br < total,
    };
  },
};

const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// v0.5.2: expected là object thường (ca nhiều nhánh, ví dụ nightsCases) → so đúng các khóa oracle ghi,
// mỗi khóa phải có trong kết quả tính lại. Mảng và giá trị đơn vẫn so nguyên.
const isPlain = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const subsetEq = (got, exp) =>
  isPlain(exp) && isPlain(got)
    ? Object.keys(exp).every((k) => k in got && subsetEq(got[k], exp[k]))
    : deepEq(got, exp);
const INV_RE = /^INV-\d{3}$/;
// ESC files whose status line says "Đã quyết" → INV-0xx label allowed
const ESC_DECIDED = new Set(
  readdirSync(join(PRODUCT, '..', '02-escalations'))
    .filter((f) => /^ESC-\d{3}\.md$/.test(f))
    .filter((f) =>
      /Trạng thái:\s*\**\s*Đã quyết/.test(
        readFileSync(join(PRODUCT, '..', '02-escalations', f), 'utf8'),
      ),
    )
    .map((f) => `INV-${f.slice(4, 7)}`),
);

// ---------------------------------------------------------------- 1. br-examples.json
function brRowsFromMarkdown() {
  const md = readFileSync(join(PRODUCT, 'docs/business-rules.md'), 'utf8');
  const map = new Map();
  for (const line of md.split('\n')) {
    if (line.startsWith('## 13.')) break; // rule tables end here; later tables (history, ESC) reuse BR codes
    const m = line.match(/^\| (BR-\d{3}) \|/);
    if (!m) continue;
    const cols = line.split('|').map((c) => c.trim());
    // | Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
    map.set(m[1], { example: cols[3], label: cols[4] });
  }
  return map;
}

function validateBrExamples() {
  const where = 'br-examples.json';
  const doc = readJson(join(TESTS, 'fixtures/br-examples.json'));
  const brMd = brRowsFromMarkdown();
  // v0.5.2 (FB-R4-QA-DOM-PR25-02, PO-05, BA-S1): id đã nghỉ không dùng lại; `reused: true` chỉ cho ca lịch sử.
  const RETIRED = new Map((doc.retiredIds ?? []).map((r) => [r.id, r]));
  const ids = new Set();
  const covered = new Set();
  let recomputed = 0;
  const LABELS = new Set(['NGÀNH', 'GIẢ ĐỊNH', 'PHÁP LÝ']);
  const ORIGINS = new Set(['example', 'rule-boundary', 'derived-table']);
  for (const row of doc.examples) {
    const w = `${where} ${row.id}`;
    for (const k of ['id', 'br', 'case', 'origin', 'labels', 'input', 'expected'])
      if (!(k in row)) err(w, `thiếu khóa '${k}'`);
    if (ids.has(row.id)) err(w, 'id trùng');
    ids.add(row.id);
    if (!row.id.startsWith(`${row.br}-`)) err(w, `id không khớp br ${row.br}`);
    const md = brMd.get(row.br);
    if (!md) err(w, `${row.br} không có trong business-rules.md`);
    else {
      covered.add(row.br);
      // label consistency with the BR table
      if (row.labels.includes('GIẢ ĐỊNH') && !md.label.includes('GIẢ ĐỊNH'))
        err(w, `nhãn GIẢ ĐỊNH nhưng BR ghi "${md.label.slice(0, 40)}"`);
      if (!row.labels.includes('GIẢ ĐỊNH') && md.label.startsWith('[GIẢ ĐỊNH'))
        err(w, 'BR mang nhãn GIẢ ĐỊNH nhưng dòng oracle thiếu nhãn');
      // v0.3: INV-0xx = "INV quyết ESC-0xx 16/10" (BR mục 0.1 / mục 13)
      const invInMd = new Set([...md.label.matchAll(/ESC-(\d{3})/g)].map((m) => `INV-${m[1]}`));
      for (const l of row.labels.filter((x) => INV_RE.test(x))) {
        if (!invInMd.has(l)) err(w, `nhãn ${l} nhưng BR ghi "${md.label.slice(0, 50)}"`);
        if (!ESC_DECIDED.has(l)) err(w, `nhãn ${l} nhưng ESC-${l.slice(4)} chưa "Đã quyết"`);
      }
      if (md.label.startsWith('INV quyết') && !row.labels.some((x) => INV_RE.test(x)))
        err(w, `BR ghi "${md.label.slice(0, 30)}" nhưng dòng oracle thiếu nhãn INV-0xx`);
      // v0.5.2 (FB-R4-QA-DOM-PR25-03 (4)): ô Nhãn ghi "thay ESC-0xx" → dòng chỉ mang INV-0xx đó
      // (không kèm nhãn của quyết định thay) phải ghi rõ là chính sách cũ (supersededBy + validUntil).
      const replaced = [...md.label.matchAll(/thay ESC-(\d{3})/g)].map((m) => `INV-${m[1]}`);
      const invs = row.labels.filter((x) => INV_RE.test(x));
      if (invs.length && invs.every((l) => replaced.includes(l)) && !row.supersededBy)
        err(
          w,
          `nhãn ${invs.join(', ')} là chính sách đã bị thay ("thay ESC-…") – cần supersededBy + validUntil`,
        );
    }
    // v0.5.2: dòng chính sách cũ / số hoa hồng cũ (BR mục 0.1 "Trước 01/11 – hết hiệu lực")
    if ((row.supersededBy === undefined) !== (row.validUntil === undefined))
      err(w, 'supersededBy và validUntil phải đi cùng nhau');
    if (row.validUntil !== undefined && !ISO_DATE.test(row.validUntil))
      err(w, 'validUntil phải là YYYY-MM-DD');
    if (row.oldCommissionFigures) {
      const o = row.oldCommissionFigures;
      if (!ISO_DATE.test(o.validUntil ?? '') || !o.replacedBy)
        err(w, 'oldCommissionFigures cần validUntil (YYYY-MM-DD) và replacedBy');
    }
    if (RETIRED.has(row.id) && !RETIRED.get(row.id).reused)
      err(w, 'id đã nghỉ (retiredIds) – không dùng lại, đánh số tiếp');
    // v0.5.2 (P4-20): calcPending = hàm tính lại có ngay ở validator (params của dòng), test BE chỉ đọc khi
    // đóng pendingFix (byCalc gộp params của dòng lên DS-E – P4-11). Dòng có calcPending luôn calc null + pendingFix.
    if (row.calcPending && (row.calc || !row.pendingFix))
      err(w, 'calcPending chỉ đi với calc null và pendingFix');
    for (const l of row.labels) if (!LABELS.has(l) && !INV_RE.test(l)) err(w, `nhãn lạ '${l}'`);
    if (!ORIGINS.has(row.origin)) err(w, `origin lạ '${row.origin}'`);
    // money / time conventions
    const walk = (o, path) => {
      if (o && typeof o === 'object') {
        for (const [k, v] of Object.entries(o)) {
          if (/Vnd$/.test(k)) {
            const vals = Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [v];
            for (const x of vals)
              if (!Number.isInteger(x)) err(w, `${path}.${k} phải là số nguyên VND`);
          }
          if (/Bp$/.test(k) && !Number.isInteger(v))
            err(w, `${path}.${k} phải là basis point nguyên`);
          if (typeof v === 'string' && /T\d{2}:\d{2}/.test(v) && !ISO_TZ.test(v))
            err(w, `${path}.${k} phải có dạng ISO +07:00`);
          walk(v, `${path}.${k}`);
        }
      }
    };
    walk(row.input, 'input');
    walk(row.expected, 'expected');
    // recompute
    const calcName = row.calc ?? row.calcPending;
    if (calcName) {
      const fn = CALC[calcName];
      if (!fn) {
        err(w, `calc '${calcName}' không có trong validator`);
        continue;
      }
      let got;
      try {
        got = fn(row.input, row.params ?? {});
      } catch (e) {
        err(w, `calc ${calcName} lỗi: ${e.message}`);
        continue;
      }
      const keys = Object.keys(row.expected).filter((k) => k in got);
      if (!keys.length) err(w, `calc ${calcName} không so được khóa nào của expected`);
      for (const k of keys)
        if (!subsetEq(got[k], row.expected[k]))
          err(
            w,
            `${k}: oracle ${JSON.stringify(row.expected[k])} ≠ tính lại ${JSON.stringify(got[k])}`,
          );
      recomputed++;
    }
  }
  const notCovered = new Set((doc.notCovered ?? []).map((x) => x.br));
  const withExample = [...brMd].filter(([, v]) => v.example && v.example !== '–').map(([k]) => k);
  for (const br of withExample)
    if (!covered.has(br) && !notCovered.has(br))
      err(where, `${br} có ví dụ số trong BR nhưng chưa có dòng oracle hay lý do notCovered`);
  for (const br of notCovered)
    if (covered.has(br)) warn(where, `${br} vừa có dòng oracle vừa nằm trong notCovered`);
  const brWithRows = covered.size;
  return {
    rows: doc.examples.length,
    recomputed,
    brWithExample: withExample.length,
    brCovered: brWithRows,
    notCovered: notCovered.size,
    assumptions: doc.examples.filter((r) => r.qaAssumption).length,
  };
}

// ---------------------------------------------------------------- 2. seeds
function validateSeeds() {
  const dse = readJson(join(TESTS, 'fixtures/seed/ds-e.json'));
  const ds0 = readJson(join(TESTS, 'fixtures/seed/ds-0.json'));
  const W = 'ds-e.json';
  const groups = new Map(dse.roomGroups.map((g) => [g.code, g]));
  const rooms = new Map(dse.rooms.map((r) => [r.roomNo, r]));
  if (rooms.size !== 10) err(W, `cần 10 căn, có ${rooms.size}`);
  // v1.0.5 V5-1A (BR-101 (1), (5)): giá đêm nhập cùng giá tháng, không suy từ giá tháng (bỏ phép ÷ 12).
  const isPrice = (v) => Number.isInteger(v) && v > 0 && v % 1000 === 0;
  for (const r of rooms.values()) {
    if (!groups.has(r.group)) err(W, `căn ${r.roomNo}: nhóm ${r.group} không tồn tại`);
    if ('expectedNightlyListPriceVnd' in r)
      err(W, `căn ${r.roomNo}: expectedNightlyListPriceVnd đã bỏ – dùng nightlyListPriceVnd (V5-1A)`);
    for (const k of ['monthlyListPriceVnd', 'nightlyListPriceVnd'])
      if (!isPrice(r[k])) err(W, `căn ${r.roomNo}: ${k} phải là số nguyên > 0, bội 1.000 (BR-101)`);
  }
  for (const r of rooms.values()) {
    // BR-110 v0.3.1 (ESC-014): max = base + 1 for every room
    if (!Number.isInteger(r.baseOccupancy)) err(W, `căn ${r.roomNo}: thiếu baseOccupancy (BR-110)`);
    else if (r.maxOccupancy !== r.baseOccupancy + 1)
      err(W, `căn ${r.roomNo}: maxOccupancy ${r.maxOccupancy} ≠ định mức + 1 (ESC-014)`);
  }
  const pkeys = new Set();
  const STATUS = /^(GD|NGANH|PL|INV-\d{3}|INV-TT)(\+(GD|NGANH|PL|INV-\d{3}|INV-TT|SEC))*$/;
  for (const p of dse.parameters) {
    if (pkeys.has(p.param)) err(W, `tham số trùng ${p.param}`);
    pkeys.add(p.param);
    if (!/^BR-\d{3}$/.test(p.br)) err(W, `tham số ${p.param}: br '${p.br}'`);
    if (!STATUS.test(p.status)) err(W, `tham số ${p.param}: status lạ '${p.status}'`);
    for (const inv of p.status.match(/INV-\d{3}/g) ?? [])
      if (!ESC_DECIDED.has(inv)) err(W, `tham số ${p.param}: ${inv} nhưng ESC chưa quyết`);
    SEED_PARAMS[p.param] = p.value;
  }
  SPECIAL_DATES = SEED_PARAMS.special_dates ?? [];
  if (pkeys.has('base_occupancy'))
    err(W, 'base_occupancy chung đã bỏ ở BR v0.3 – dùng rooms[].baseOccupancy');
  const channels = new Map(dse.channels.map((c) => [c.code, c]));
  if (channels.size !== dse.channels.length) err(W, 'mã kênh trùng');
  const stdTotal = dse.minibarItems.reduce((s, i) => s + i.standardQtyPerRoom, 0);
  if (stdTotal !== 17) err(W, `tổng chuẩn minibar ${stdTotal} ≠ 17 (BR-701)`);
  MINIBAR = Object.fromEntries(dse.minibarItems.map((i) => [i.code, i]));
  if (dse.inspectionChecklist.length !== 12) err(W, 'checklist BR-808 phải 12 điểm');
  const users = new Set(dse.users.map((u) => u.username));
  if (JSON.stringify(dse).match(/"password"\s*:/i)) err(W, 'không được ghi mật khẩu trong seed');

  // erd mục 10 / BR-007 (FB-R2-BE-QA-01): tên docType, tiền tố, độ dài, periodKey
  const ERD10 = {
    reservation: ['OTM-', 5, '-'],
    quote: ['BG-', 5, '-'],
    work_order: ['WO-', 5, '-'],
    reservation_group: ['NH-', 5, '-'],
    payment: ['PT-', 6, '-'],
    bill: ['F{yy}-', 6, 'year'],
    guest: ['KH-', 4, '-'],
  };
  for (const s of dse.docSequences) {
    const spec = ERD10[s.docType];
    if (!spec) err(W, `docSequences: docType '${s.docType}' không có trong erd mục 10`);
    else if (s.prefix !== spec[0] || s.padWidth !== spec[1] || s.periodKey !== spec[2])
      err(
        W,
        `docSequences ${s.docType}: ${s.prefix}/${s.padWidth}/${s.periodKey} ≠ erd 10 ${spec.join('/')}`,
      );
  }
  for (const g of dse.roomGroups) {
    if ('defaultBaseOccupancy' in g || 'defaultMaxOccupancy' in g)
      err(W, `nhóm ${g.code}: dùng baseOccupancy/maxOccupancy (OpenAPI 0.3.1 RoomGroup)`);
    if (!Number.isInteger(g.baseOccupancy) || g.maxOccupancy !== g.baseOccupancy + 1)
      err(W, `nhóm ${g.code}: baseOccupancy/maxOccupancy mặc định sai (BR-110, ESC-014)`);
  }

  const Z = 'ds-0.json';
  if (ds0.extends !== 'DS-E') err(Z, 'extends phải là DS-E');
  for (const k of ['baseOccupancy', 'maxOccupancy']) {
    const tbl = ds0.roomOccupancy?.[k];
    if (!tbl) err(Z, `thiếu roomOccupancy.${k}`);
    else {
      if (Object.keys(tbl).length !== rooms.size)
        err(Z, `roomOccupancy.${k}: cần ${rooms.size} căn`);
      for (const [no, v] of Object.entries(tbl))
        if (rooms.get(no)?.[k] !== v)
          err(Z, `roomOccupancy.${k} căn ${no} = ${v} ≠ DS-E ${rooms.get(no)?.[k]}`);
    }
  }
  const guests = new Map();
  ds0.guests.forEach((g, i) => {
    const code = `KH-${String(i + 1).padStart(4, '0')}`;
    if (g.expectedCode !== code)
      err(Z, `khách ${g.seedLabel}: expectedCode ${g.expectedCode} ≠ ${code} (thứ tự tạo)`);
    if (g.email && !g.email.endsWith('.test'))
      err(Z, `khách ${g.seedLabel}: email phải thuộc miền .test`);
    if (g.document && !g.document.number.startsWith('TEST'))
      err(Z, `khách ${g.seedLabel}: số giấy tờ phải có tiền tố TEST`);
    if (g.phone && !/^0000 /.test(g.phone))
      err(Z, `khách ${g.seedLabel}: SĐT giả phải bắt đầu '0000 '`);
    guests.set(g.seedLabel, g);
  });
  const occ = []; // [room, from, to, label]
  const labels = new Set();
  ds0.reservations.forEach((r, i) => {
    const w = `${Z} ${r.seedLabel}`;
    if (!/^OTM-\d{4}$/.test(r.seedLabel)) err(w, 'nhãn seed phải dạng OTM- + 4 số (BUG-R1-016)');
    if (labels.has(r.seedLabel)) err(w, 'nhãn trùng');
    labels.add(r.seedLabel);
    if (r.loadOrder !== i + 1) err(w, 'loadOrder phải tăng liên tục theo thứ tự mảng');
    const code = `OTM-${String(r.loadOrder).padStart(5, '0')}`;
    if (r.expectedCode !== code) err(w, `expectedCode ${r.expectedCode} ≠ ${code}`);
    if (!rooms.has(r.room)) err(w, `căn ${r.room} không có`);
    if (!channels.has(r.channel)) err(w, `kênh ${r.channel} không có trong DS-E`);
    for (const g of [r.booker, ...r.party]) if (!guests.has(g)) err(w, `khách ${g} không có`);
    for (const k of ['arrivalDate', 'departureDate'])
      if (!ISO_DATE.test(r[k])) err(w, `${k} phải dạng YYYY-MM-DD`);
    if (r.nights !== diffDays(r.departureDate, r.arrivalDate)) err(w, 'số đêm sai (BR-002)');
    if (!['api', 'direct'].includes(r.seedPath)) err(w, 'seedPath phải api|direct');
    if (r.seedPath === 'api' && r.arrivalDate < '2026-10-02')
      err(w, 'đơn nạp qua API phải đến sau đồng hồ nạp 01/10');
    if (r.status === 'checked_out' && r.seedPath !== 'direct')
      err(w, 'đơn checked_out nạp trực tiếp (test-strategy 4.2)');
    const room = rooms.get(r.room);
    const ages = r.childrenDob.map((d) => ageAt(d, r.arrivalDate));
    const occP = {
      ...SEED_PARAMS,
      [`room.${r.room}.base_occupancy`]: room?.baseOccupancy,
      [`room.${r.room}.max_occupancy`]: room?.maxOccupancy,
    };
    const pax = CALC.extraPersonFee(
      { roomNo: r.room, adults: r.adults, childrenAges: ages, nights: r.nights },
      occP,
    );
    if (!pax.accepted)
      err(
        w,
        `${pax.countedPersons} khách (không tính trẻ < 6) vượt sức chứa căn ${r.room} (BR-110)`,
      );
    else if (r.expected && pax.extraGuestKits !== (r.expected.extraGuestKits ?? 0))
      err(w, `bộ đồ dùng thêm ${r.expected.extraGuestKits ?? 0} ≠ BR-812 ${pax.extraGuestKits}`);
    if (r.stayType === 'short' && r.paymentModel === 'direct_pay' && r.seedPath === 'api') {
      const nr = room.nightlyListPriceVnd;
      if (r.expected.nightRateVnd !== nr)
        err(w, `giá niêm yết ${r.expected.nightRateVnd} ≠ giá đêm DS-E ${nr} (BR-101)`);
      const cal = nightlyRates(nr, r.arrivalDate, r.nights, 'direct', SEED_PARAMS);
      if (!deepEq(r.expected.nightlyRatesVnd, cal))
        err(
          w,
          `giá từng đêm ${JSON.stringify(r.expected.nightlyRatesVnd)} ≠ lịch giá BR-104 ${JSON.stringify(cal)}`,
        );
      const total = cal.reduce((a, b) => a + b, 0);
      if (r.expected.roomTotalVnd !== total)
        err(w, `tiền phòng ${r.expected.roomTotalVnd} ≠ ${total} (BR-104)`);
      const dep = roundTo(total * 30, 100, 100000);
      if (r.expected.depositRequiredVnd !== dep)
        err(w, `cọc ${r.expected.depositRequiredVnd} ≠ BR-305 ${dep}`);
      if (r.depositPaidVnd < dep)
        err(w, 'cọc đã thu nhỏ hơn mức BR-305 nhưng trạng thái confirmed');
      if ((r.expected.extraPersonFeeVnd ?? 0) !== pax.extraPersonFeeVnd)
        err(
          w,
          `phụ thu người ${r.expected.extraPersonFeeVnd ?? 0} ≠ BR-110 ${pax.extraPersonFeeVnd}`,
        );
    }
    if (!['cancelled', 'no_show'].includes(r.status))
      occ.push([r.room, r.arrivalDate, r.departureDate, r.seedLabel]);
  });
  for (const b of ds0.roomBlocks) occ.push([b.room, b.range[0], b.range[1], b.seedLabel]);
  for (let i = 0; i < occ.length; i++)
    for (let j = i + 1; j < occ.length; j++) {
      const [ra, a0, a1, la] = occ[i];
      const [rb, b0, b1, lb] = occ[j];
      if (ra === rb && a0 < b1 && b0 < a1)
        err(Z, `ĐẶT TRÙNG căn ${ra}: ${la} [${a0}, ${a1}) và ${lb} [${b0}, ${b1})`);
    }
  // room status at T0 vs bookings (BR-806 reconcile)
  const t0 = ds0.t0;
  for (const [room, st] of Object.entries(ds0.roomStatusAtT0)) {
    const inHouse = ds0.reservations.find(
      (r) =>
        r.room === room && r.status === 'in_house' && r.arrivalDate <= t0 && t0 < r.departureDate,
    );
    const departing = ds0.reservations.find(
      (r) => r.room === room && r.status === 'in_house' && r.departureDate === t0,
    );
    const blocked = ds0.roomBlocks.find(
      (b) => b.room === room && b.range[0] <= t0 && t0 < b.range[1],
    );
    if (blocked && st !== 'OOO') err(Z, `căn ${room} có khối OOO ở T0 nhưng trạng thái ${st}`);
    if ((inHouse || departing) && !['OC', 'OD'].includes(st))
      err(Z, `căn ${room} có khách in_house nhưng trạng thái ${st} (BR-806)`);
    if (!inHouse && !departing && ['OC', 'OD'].includes(st))
      err(Z, `căn ${room} trạng thái ${st} nhưng không có đơn in_house (BR-806)`);
  }
  ds0.workOrders.forEach((wo, i) => {
    if (wo.expectedCode !== `WO-${String(i + 1).padStart(5, '0')}`)
      err(Z, `${wo.seedLabel}: expectedCode sai`);
    if (wo.assignee && !users.has(wo.assignee))
      err(Z, `${wo.seedLabel}: người nhận ${wo.assignee} không có trong DS-E`);
  });
  for (const l of ds0.leases) {
    const r = ds0.reservations.find((x) => x.seedLabel === l.reservation);
    if (!r || r.stayType !== 'long') err(Z, `HĐ ${l.reservation} không khớp đơn dài hạn`);
    if (l.closer.user && !users.has(l.closer.user))
      err(Z, `HĐ ${l.reservation}: người chốt ${l.closer.user} không có`);
    const exp = CALC.leaseDeposit({
      monthlyRentVnd: l.monthlyRentVnd,
      guestClass: l.guestClass,
      termMonths: l.termMonths,
    });
    if (exp.depositVnd !== l.depositVnd)
      err(Z, `HĐ ${l.reservation}: ký quỹ ${l.depositVnd} ≠ BR-206 ${exp.depositVnd}`);
    const room = rooms.get(l.room);
    const rent = CALC.leaseRent({
      monthlyListPriceVnd: room.monthlyListPriceVnd,
      guestClass: l.guestClass,
      termMonths: l.termMonths,
    });
    if (rent.monthlyRentVnd !== l.monthlyRentVnd)
      err(Z, `HĐ ${l.reservation}: thuê ${l.monthlyRentVnd} ≠ BR-203 ${rent.monthlyRentVnd}`);
    const com = CALC.leaseCommission({
      monthlyRentVnd: l.monthlyRentVnd,
      termMonths: l.termMonths,
      closer: l.closer.type,
      guestClass: l.guestClass,
    });
    if (com.commissionVnd !== l.commission.totalVnd)
      err(
        Z,
        `HĐ ${l.reservation}: hoa hồng ${l.commission.totalVnd} ≠ BR-212 ${com.commissionVnd}`,
      );
    if (addMonths(l.start, l.termMonths) !== l.end)
      warn(
        Z,
        `HĐ ${l.reservation}: ngày kết thúc ${l.end} khác BR-209 ${addMonths(l.start, l.termMonths)} (snapshot BL, đã ghi chú)`,
      );
  }
  for (const reg of ds0.registrations)
    if (!labels.has(reg.reservation)) err(Z, `khai báo ${reg.reservation} không có đơn`);
  return {
    rooms: rooms.size,
    parameters: pkeys.size,
    channels: channels.size,
    users: users.size,
    guests: guests.size,
    reservations: ds0.reservations.length,
    blocks: ds0.roomBlocks.length,
  };
}

// ---------------------------------------------------------------- 3. smoke manifest
function validateSmokeManifest() {
  const md = readFileSync(join(TESTS, 'test-cases/r1-main-flows.md'), 'utf8');
  const smoke = new Set();
  for (const line of md.split('\n')) {
    const m = line.match(/^\| (TC-[A-Z0-9]+-\d{3}) \|/);
    if (!m) continue;
    const prio = line.split('|')[5]?.trim() ?? '';
    if (prio.includes('(S)')) smoke.add(m[1]);
  }
  const man = readJson(join(TESTS, 'e2e/smoke-manifest.json'));
  const inMan = new Set(man.cases.map((c) => c.tc));
  for (const tc of smoke)
    if (!inMan.has(tc))
      err('smoke-manifest.json', `${tc} có nhãn (S) trong test case nhưng thiếu trong manifest`);
  for (const c of man.cases) {
    if (!smoke.has(c.tc) && !c.extra)
      err(
        'smoke-manifest.json',
        `${c.tc} không còn nhãn (S) – bỏ khỏi manifest hoặc đánh dấu extra`,
      );
    if (!['implemented', 'pending'].includes(c.status))
      err('smoke-manifest.json', `${c.tc}: status lạ`);
    if (c.status === 'pending' && !c.waitingFor)
      err('smoke-manifest.json', `${c.tc}: pending phải ghi waitingFor`);
  }
  return {
    smokeInTestCases: smoke.size,
    implemented: man.cases.filter((c) => c.status === 'implemented').length,
    pending: man.cases.filter((c) => c.status === 'pending').length,
  };
}

const seeds = validateSeeds(); // loads MINIBAR used by br-examples calc
const br = validateBrExamples();
const smoke = validateSmokeManifest();

console.log('br-examples:', JSON.stringify(br));
console.log('seeds:', JSON.stringify(seeds));
console.log('smoke-manifest:', JSON.stringify(smoke));
if (verbose || errors.length) for (const w of warnings) console.log('WARN', w);
for (const e of errors) console.error('ERROR', e);
if (errors.length) {
  console.error(`\n${errors.length} lỗi`);
  process.exit(1);
}
console.log(`OK – 0 lỗi, ${warnings.length} cảnh báo`);
