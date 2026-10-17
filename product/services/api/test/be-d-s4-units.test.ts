/**
 * BE-D Sprint 4 – rules without a database:
 * - K-03 rounding (US-010 AC1 6/9 = 66,7 %), null denominator (Q-15);
 * - "Cần chú ý" audience per role (US-012 AC6, US-003 AC4, S4-06, S4-39 registration checks) and sort (EP01 3.2);
 * - attention params allowlist of the 0.3.7 kinds (ota_no_show_report, ooo_ending_work_open, foc_threshold);
 * - SSE audience by role (OpenAPI 0.3.7 "người nhận theo vai"): the wire each type gets + the hub's match;
 * - Hôm nay row actions (B-20) – parity with Reservation.allowedActions + the post-midnight B18 window;
 * - BR-425 state of a departure row; tag normalisation of vip_arrival.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Tx } from '../src/db/database';
import { GUEST_REQUEST_COPY } from '../src/generated/guest-request-copy';
import { firstLanguage, pickGuestLocale } from '../src/modules/guest-portal/internal/guest-locale';
import { sortAttention } from '../src/modules/events/internal/attention.service';
import { matches } from '../src/modules/events/internal/sse-hub';
import {
  ATTENTION_SYSTEM_CLOSED,
  type AttentionItem,
  SSE_EVENT_TYPES,
  type SseEventType,
  type SseWireEvent,
  assertAttentionParams,
  attentionVisibleTo,
  publishSse,
} from '../src/modules/events/public/events.service';
import {
  ackDueOf,
  cleaningFee,
  countsAsFullClean,
  deskHoursOf,
  hasSensitiveDigits,
  needsInHouse,
  noteRequired,
  overdueRecipients,
  renderAutoReply,
  routeOf,
} from '../src/modules/guest-portal/internal/guest-request-rules';
import { isAllowedMapUrl } from '../src/modules/platform/internal/parameter-rules';
import {
  focCountAlert,
  focValueCheck,
  normalizeTag,
} from '../src/modules/reporting/internal/attention-sources';
import { reminderState } from '../src/modules/reporting/internal/dashboard.service';
import { checkInAction, checkOutAction } from '../src/modules/reporting/internal/stay-actions';
import { occupancyPct } from '../src/modules/reporting/internal/tonight-kpi';
import { allowedActions } from '../src/modules/reservations/internal/allowed-actions';

const OWN = ['owner'];
const MGR = ['manager'];
const FDL = ['front_desk_lead'];
const FD = ['front_desk'];
const HK = ['housekeeping'];
const MT = ['maintenance'];
const SAL = ['sales_staff'];
const CTV = ['collaborator'];

const item = (kind: AttentionItem['kind'], extra: Partial<AttentionItem> = {}): AttentionItem => ({
  kind,
  source: 'computed',
  severity: 'warning',
  ...extra,
});

describe('K-03 occupancy (US-010 AC1, Q-15)', () => {
  it('6 sold of 9 net available = 66,7 %; 0 available → null; never above 100 by construction', () => {
    expect(occupancyPct(6, 9)).toBe(66.7);
    expect(occupancyPct(6, 10)).toBe(60);
    expect(occupancyPct(7, 9)).toBe(77.8);
    expect(occupancyPct(1, 3)).toBe(33.3);
    expect(occupancyPct(2, 3)).toBe(66.7);
    expect(occupancyPct(0, 0)).toBeNull();
    expect(occupancyPct(9, 9)).toBe(100);
  });
});

describe('"Cần chú ý" audience (US-012 AC6, US-003 AC4, rbac S02 note 1)', () => {
  it('FOC alert and security alerts reach OWN only; reconcile_overdue MGR+', () => {
    for (const roles of [MGR, FDL, FD]) {
      expect(attentionVisibleTo(item('foc_threshold'), roles)).toBe(false);
      expect(attentionVisibleTo(item('security_alert'), roles)).toBe(false);
    }
    expect(attentionVisibleTo(item('foc_threshold'), OWN)).toBe(true);
    expect(attentionVisibleTo(item('reconcile_overdue'), MGR)).toBe(true);
    expect(attentionVisibleTo(item('reconcile_overdue'), FDL)).toBe(false);
    expect(attentionVisibleTo(item('reconcile_overdue'), FD)).toBe(false);
  });

  it('data_quality: registration checks (S4-39) are operational (FD+), DATA checks OWN only', () => {
    const party = item('data_quality', { params: { check: 'registration_party_docs_unlinked' } });
    const stay = item('data_quality', { params: { check: 'registration_stay_not_closed' } });
    const data = item('data_quality', { params: { check: 'r_05_ooo_and_sold' } });
    for (const roles of [OWN, MGR, FDL, FD]) {
      expect(attentionVisibleTo(party, roles)).toBe(true);
      expect(attentionVisibleTo(stay, roles)).toBe(true);
    }
    expect(attentionVisibleTo(data, OWN)).toBe(true);
    expect(attentionVisibleTo(data, MGR)).toBe(false);
    expect(attentionVisibleTo(data, FD)).toBe(false);
    expect(attentionVisibleTo(item('data_quality'), FD)).toBe(false);
  });

  it('operational kinds (0.3.7 incl. ota_no_show_report, closed_reservation_credit) reach OWN/MGR/FDL/FD, never HK/MT/SAL/CTV', () => {
    for (const kind of [
      'ota_no_show_report',
      'closed_reservation_credit',
      'no_show_call',
      'hold_expiring',
      'vip_arrival',
      'deposit_after_cancel',
      'room_ooo',
    ] as const) {
      for (const roles of [OWN, MGR, FDL, FD])
        expect(attentionVisibleTo(item(kind), roles)).toBe(true);
      for (const roles of [HK, MT, SAL, CTV])
        expect(attentionVisibleTo(item(kind), roles)).toBe(false);
    }
  });

  it('system-closed event kinds (EP01 3.2, S4-06)', () => {
    expect([...ATTENTION_SYSTEM_CLOSED].sort()).toEqual([
      'closed_reservation_credit',
      'overbooking',
      'unassigned_with_free_room',
    ]);
  });

  it('sort: critical → warning → info, then dueAt ascending (no due time last) – EP01 3.2', () => {
    const out = sortAttention([
      item('room_ooo', { severity: 'info' }),
      item('hold_expiring', { dueAt: '2026-10-15T12:00:00.000+07:00' }),
      item('vip_arrival', { severity: 'info', dueAt: '2026-10-15T14:00:00.000+07:00' }),
      item('capacity_conflict'),
      item('registration_due', { dueAt: '2026-10-15T11:00:00.000+07:00' }),
      item('no_show_mark', { severity: 'critical', dueAt: '2026-10-15T23:00:00.000+07:00' }),
    ]);
    expect(out.map((i) => i.kind)).toEqual([
      'no_show_mark',
      'registration_due',
      'hold_expiring',
      'capacity_conflict',
      'vip_arrival',
      'room_ooo',
    ]);
  });

  it('params allowlist of the 0.3.7 kinds (SEC J): codes and closed values only', () => {
    expect(() =>
      assertAttentionParams('ota_no_show_report', { action: 'report', channel: 'agoda' }),
    ).not.toThrow();
    expect(() =>
      assertAttentionParams('ota_no_show_report', { action: 'revoke', channel: 'booking_com' }),
    ).not.toThrow();
    expect(() => assertAttentionParams('ota_no_show_report', { action: 'cancel' })).toThrow();
    expect(() =>
      assertAttentionParams('ota_no_show_report', { action: 'report', channel: 'Nguyễn Văn A' }),
    ).toThrow();
    expect(() => assertAttentionParams('ota_no_show_report', { count: 1 })).toThrow(
      /not allow-listed/,
    );
    expect(() =>
      assertAttentionParams('ooo_ending_work_open', { roomNo: '401', endDate: '2026-10-18' }),
    ).not.toThrow();
    expect(() =>
      assertAttentionParams('ooo_ending_work_open', { roomNo: 'The Pine 401' }),
    ).toThrow();
    expect(() =>
      assertAttentionParams('foc_threshold', {
        check: 'foc_pct_of_room_revenue',
        pct: 3.6,
        threshold: 3,
      }),
    ).not.toThrow();
    expect(() =>
      assertAttentionParams('foc_threshold', {
        check: 'foc_count_per_approver',
        count: 11,
        max: 10,
      }),
    ).not.toThrow();
    expect(() => assertAttentionParams('foc_threshold', { name: 'Lan' })).toThrow();
    expect(() => assertAttentionParams('closed_reservation_credit', { amountVnd: 1 })).toThrow();
  });
});

/** Wire of publishSse captured from a fake transaction (no database). */
async function wireOf(
  type: SseEventType,
  audience?: { roles?: string[]; userIds?: string[] },
  booking: { created_by: string | null; closer_user_id: string | null } = {
    created_by: 'u-creator',
    closer_user_id: null,
  },
): Promise<SseWireEvent> {
  let payload = '';
  const tx = {
    ctx: { organizationId: 'o1', propertyId: 'p1', userId: null, actorType: 'system' },
    query: async (sql: string, params: unknown[]) => {
      if (sql.includes('pg_notify')) payload = String(params[1]);
      if (sql.includes('FROM reservation')) return { rows: [booking] };
      return { rows: [] };
    },
  } as unknown as Tx;
  await publishSse(tx, type, '0192a1b0-0000-7000-8000-00000000b171', audience);
  return JSON.parse(payload) as SseWireEvent;
}

const sub = (roles: string[], userId = 'u-x') => ({ propertyId: 'p1', userId, roles });

describe('SSE audience by role (OpenAPI 0.3.7, SEC review – streamEvents)', () => {
  it('every event carries roles; nothing is broadcast to "everyone"', async () => {
    for (const type of SSE_EVENT_TYPES) {
      const w =
        type === 'notification.created'
          ? await wireOf(type, { roles: [], userIds: ['u-1'] })
          : await wireOf(type);
      expect(Array.isArray(w.r), type).toBe(true);
    }
  });

  it('HK: room status + HK tasks; MT: room status + work orders; FD+: all except payment (MGR+)', async () => {
    const expected: Record<SseEventType, string[][]> = {
      'reservation.changed': [OWN, MGR, FDL, FD],
      'room.status_changed': [OWN, MGR, FDL, FD, HK, MT],
      'attention.changed': [OWN, MGR, FDL, FD],
      'hk_task.changed': [OWN, MGR, FDL, FD, HK],
      'work_order.changed': [OWN, MGR, FDL, FD, MT],
      'guest_request.changed': [OWN, MGR, FDL, FD],
      'notification.created': [],
      'registration.changed': [OWN, MGR, FDL, FD],
      'payment.changed': [OWN, MGR],
    };
    for (const type of SSE_EVENT_TYPES) {
      if (type === 'notification.created') continue;
      const w = await wireOf(type);
      for (const roles of [OWN, MGR, FDL, FD, HK, MT, SAL, CTV]) {
        const want = expected[type].some((r) => r[0] === roles[0]);
        expect(matches(w, sub(roles)), `${type} → ${roles[0]}`).toBe(want);
      }
    }
  });

  it('guest_request.changed adds the routed department; reservation.changed adds the creator/closer (SAL/CTV own)', async () => {
    const routed = await wireOf('guest_request.changed', { roles: ['housekeeping'] });
    expect(matches(routed, sub(HK))).toBe(true);
    expect(matches(routed, sub(MT))).toBe(false);
    expect(matches(routed, sub(FD))).toBe(true);
    const own = await wireOf('reservation.changed', undefined, {
      created_by: 'u-sal',
      closer_user_id: 'u-ctv',
    });
    expect(matches(own, sub(SAL, 'u-sal'))).toBe(true);
    expect(matches(own, sub(CTV, 'u-ctv'))).toBe(true);
    expect(matches(own, sub(SAL, 'u-other'))).toBe(false);
    expect(matches(own, sub(HK))).toBe(false);
    const note = await wireOf('notification.created', { roles: [], userIds: ['u-hk'] });
    expect(matches(note, sub(HK, 'u-hk'))).toBe(true);
    expect(matches(note, sub(FD, 'u-fd'))).toBe(false);
  });

  it('a payload without any audience is FD+ only (fail closed); another property never matches', () => {
    const bare = { p: 'p1', t: 'room.status_changed', id: 'x' } as SseWireEvent;
    expect(matches(bare, sub(FD))).toBe(true);
    expect(matches(bare, sub(HK))).toBe(false);
    expect(matches(bare, sub(SAL))).toBe(false);
    expect(matches({ ...bare, p: 'p2' }, sub(OWN))).toBe(false);
  });

  it('notification.created without a recipient is a programming error', async () => {
    await expect(wireOf('notification.created', { roles: [] })).rejects.toThrow(/no recipient/);
  });
});

describe('Hôm nay row actions (OpenAPI 0.3.7 B-20)', () => {
  const base = {
    channelGroup: 'direct' as const,
    holdExpired: false,
    holdExtendedCount: 0,
    own: false,
    noShowMarkable: false,
    restoreWithinRules: true,
    rescheduleCount: 0,
    rescheduleMaxTimes: 1,
  };
  it('same check_in / check_out as Reservation.allowedActions for every role and state', () => {
    const roleSets = [OWN, MGR, FDL, FD, HK, MT, SAL, CTV];
    for (const roles of roleSets) {
      for (const status of ['confirmed', 'in_house'] as const) {
        for (const conflictState of ['none', 'open'] as const) {
          for (const capacityConflict of [false, true]) {
            for (const today of ['2026-10-15', '2026-10-16', '2026-10-17']) {
              const ref = allowedActions(roles, {
                ...base,
                status,
                conflictState,
                capacityConflict,
                arrivalDate: '2026-10-15',
                departureDate: '2026-10-17',
                today,
              }).filter((a) => a.event === 'check_in' || a.event === 'check_out');
              const mine = [
                ...checkInAction(roles, {
                  status,
                  conflictState,
                  capacityConflict,
                  arrivalDate: '2026-10-15',
                  today,
                }),
                ...checkOutAction(roles, {
                  status,
                  departureDate: '2026-10-17',
                  today,
                  calendarDate: today,
                }),
              ];
              expect(
                mine,
                `${roles[0]} ${status} ${conflictState} ${capacityConflict} ${today}`,
              ).toEqual(ref);
            }
          }
        }
      }
    }
  });

  it('check_in carries requiresTrustedDevice; B18 post-midnight window (business 16/10, calendar 17/10)', () => {
    expect(
      checkInAction(FD, {
        status: 'confirmed',
        conflictState: 'none',
        capacityConflict: false,
        arrivalDate: '2026-10-20',
        today: '2026-10-20',
      }),
    ).toEqual([
      { event: 'check_in', transition: 'B9', action: 'check-in', requiresTrustedDevice: true },
    ]);
    const out = (calendarDate: string) =>
      checkOutAction(FD, {
        status: 'in_house',
        departureDate: '2026-10-17',
        today: '2026-10-16',
        calendarDate,
      });
    expect(out('2026-10-17')).toEqual([
      { event: 'check_out', transition: 'B18', action: 'check-out' },
    ]);
    expect(out('2026-10-16')).toEqual([]);
    expect(
      checkOutAction(HK, {
        status: 'in_house',
        departureDate: '2026-10-17',
        today: '2026-10-17',
        calendarDate: '2026-10-17',
      }),
    ).toEqual([]);
  });
});

describe('BR-425 departure state (US-031 AC1/AC2)', () => {
  const reminders = {
    before: ['20:00-1d', '09:00', '11:00'],
    overdueWithSameDayArrival: '12:00',
    overdueOtherwise: '12:31',
  };
  const at = (nowTime: string, over: Partial<Parameters<typeof reminderState>[0]> = {}) =>
    reminderState({
      status: 'in_house',
      departure: '2026-10-17',
      today: '2026-10-17',
      replied: false,
      sameDayArrival: false,
      nowTime,
      rollover: '06:00',
      reminders,
      ...over,
    });
  it('just before / just after each mark (giờ VN)', () => {
    expect(at('10:59')).toBe('reminded_waiting');
    expect(at('11:00')).toBe('call_needed');
    expect(at('11:59', { sameDayArrival: true })).toBe('call_needed');
    expect(at('12:00', { sameDayArrival: true })).toBe('overdue');
    expect(at('12:30')).toBe('call_needed');
    expect(at('12:31')).toBe('overdue');
    expect(at('11:30', { replied: true })).toBe('replied');
    expect(at('12:40', { replied: true })).toBe('overdue');
  });
  it('other dates and checked-out rows', () => {
    expect(at('09:00', { today: '2026-10-15' })).toBe('reminded_waiting');
    expect(at('09:00', { today: '2026-10-15', replied: true })).toBe('replied');
    expect(at('09:00', { today: '2026-10-18' })).toBe('overdue');
    expect(at('09:00', { status: 'checked_out' })).toBe('checked_out');
  });
});

describe('vip_arrival tag catalogue', () => {
  it('compares without case and diacritics', () => {
    expect(normalizeTag(' Khách  quen ')).toBe('khach quen');
    expect(normalizeTag('VIP')).toBe('vip');
    expect(normalizeTag('Đoàn')).toBe('doan');
  });
});

describe('EP14 guest requests – rules (BR-811, BR-506, SEC B-15, E14-08)', () => {
  const tz = 'Asia/Ho_Chi_Minh';
  const hours = { from: '07:00', to: '22:00' };
  const at = (iso: string) => new Date(iso);

  it('routing and note rules (BR-811, EP14 3.1/3.2)', () => {
    expect(routeOf('extra_cleaning')).toBe('housekeeping');
    expect(routeOf('amenities')).toBe('housekeeping');
    expect(routeOf('report_issue')).toBe('maintenance');
    for (const t of ['transport_tour', 'late_checkout', 'other'] as const) {
      expect(routeOf(t)).toBe('front_desk');
      expect(needsInHouse(t)).toBe(false);
    }
    expect(needsInHouse('amenities')).toBe(true);
    expect(['report_issue', 'transport_tour', 'other'].every((t) => noteRequired(t as never))).toBe(
      true,
    );
    expect(noteRequired('amenities')).toBe(false);
  });

  it('BR-811 examples: 21:59 → 22:09 in hours; 22:00 → auto reply, due 07:10 next day; 06:30 → 07:10', () => {
    const a = ackDueOf(at('2026-10-15T21:59:00+07:00'), tz, hours, 10);
    expect(a.inHours).toBe(true);
    expect(a.ackDueAt).toEqual(at('2026-10-15T22:09:00+07:00'));
    const b = ackDueOf(at('2026-10-15T22:00:00+07:00'), tz, hours, 10);
    expect(b.inHours).toBe(false);
    expect(b.ackDueAt).toEqual(at('2026-10-16T07:10:00+07:00'));
    const c = ackDueOf(at('2026-10-16T06:30:00+07:00'), tz, hours, 10);
    expect(c).toMatchObject({ inHours: false, ackDueAt: at('2026-10-16T07:10:00+07:00') });
    const d = ackDueOf(at('2026-10-16T07:00:00+07:00'), tz, hours, 10);
    expect(d).toMatchObject({ inHours: true, ackDueAt: at('2026-10-16T07:10:00+07:00') });
    expect(deskHoursOf(['07:00', '22:00'])).toEqual(hours);
    expect(deskHoursOf({ from: '07:00', to: '22:00' })).toEqual(hours);
    expect(() => deskHoursOf('07-22')).toThrow();
  });

  it('BR-506 (ESC-016 A): long stay always charged; short stay only the second full clean of the day', () => {
    expect(cleaningFee({ stayType: 'long', feeVnd: 100_000, lastFullCleanTime: null })).toEqual({
      feeVnd: 100_000,
      feeReason: 'long_stay_adhoc',
      lastFullCleanTime: null,
    });
    expect(cleaningFee({ stayType: 'short', feeVnd: 100_000, lastFullCleanTime: null })).toEqual({
      feeVnd: null,
      feeReason: null,
      lastFullCleanTime: null,
    });
    expect(cleaningFee({ stayType: 'short', feeVnd: 100_000, lastFullCleanTime: '10:00' })).toEqual(
      { feeVnd: 100_000, feeReason: 'second_full_clean', lastFullCleanTime: '10:00' },
    );
  });

  it('SEC B-15 replyNote digits: ≥ 6 digits blocked unless it is the public hotline', () => {
    const hotline = '0263 3 822 822';
    expect(hasSensitiveDigits('Mã cửa 482913', hotline)).toBe(true);
    expect(hasSensitiveDigits('Gọi khách 0912.345.678', hotline)).toBe(true);
    expect(hasSensitiveDigits('Cần gấp gọi 0263-3822-822', hotline)).toBe(false);
    expect(hasSensitiveDigits('Hotline +84 263 3822 822', hotline)).toBe(false);
    expect(hasSensitiveDigits('Xe đón lúc 15:30, giá 350.000', hotline)).toBe(true);
    expect(hasSensitiveDigits('Xe đón lúc 15:30, phòng 202', hotline)).toBe(false);
    expect(hasSensitiveDigits('12345', null)).toBe(false);
  });

  it('US-112 auto reply (UXD guest.req.auto_reply VI/EN/RU): with the public phone; without it the call sentence goes', () => {
    const v = { time: '22:00', openTime: '07:00' };
    const vi = GUEST_REQUEST_COPY.vi!['guest.req.auto_reply']!;
    expect(renderAutoReply(vi, { ...v, phone: '0263 3 822 822' })).toBe(
      'OTTIMO đã nhận yêu cầu của bạn lúc 22:00. Lễ tân sẽ xử lý từ 07:00. Nếu cần gấp, bạn vui lòng gọi 0263 3 822 822.',
    );
    expect(renderAutoReply(vi, { ...v, phone: null })).toBe(
      'OTTIMO đã nhận yêu cầu của bạn lúc 22:00. Lễ tân sẽ xử lý từ 07:00.',
    );
    for (const l of ['en', 'ru'] as const) {
      const t = GUEST_REQUEST_COPY[l]!['guest.req.auto_reply']!;
      const out = renderAutoReply(t, { ...v, phone: '  ' });
      expect(out, l).not.toMatch(/[{}]/);
      expect(out, l).toContain('07:00');
      expect(out.endsWith('.'), l).toBe(true);
    }
    expect(
      renderAutoReply(GUEST_REQUEST_COPY.en!['guest.req.auto_reply']!, { ...v, phone: '' }),
    ).toBe('We received your request at 22:00. Our front desk will take care of it from 07:00.');
  });

  it('P-S4-10 session language: chosen → profile → first Accept-Language tag (vi*/ru*, else en)', () => {
    const pick = (
      acceptLanguage: string | undefined,
      bookerPreferred: string | null = null,
      chosen: string | null = null,
    ) => pickGuestLocale({ chosenByGuest: chosen, bookerPreferred, acceptLanguage });
    expect(pick('fr-FR,fr;q=0.9,vi;q=0.8')).toEqual({ locale: 'en', chosenByGuest: false });
    expect(pick('ru-RU,ru;q=0.9')).toEqual({ locale: 'ru', chosenByGuest: false });
    expect(pick('vi-VN')).toEqual({ locale: 'vi', chosenByGuest: false });
    expect(pick('VI')).toEqual({ locale: 'vi', chosenByGuest: false });
    expect(pick(undefined)).toEqual({ locale: 'en', chosenByGuest: false });
    expect(pick('*')).toEqual({ locale: 'en', chosenByGuest: false });
    expect(pick('en-US', 'ru')).toEqual({ locale: 'ru', chosenByGuest: false });
    expect(pick('ru-RU', 'de')).toEqual({ locale: 'ru', chosenByGuest: false }); // unknown profile value ignored
    expect(pick('en-US', 'ru', 'vi')).toEqual({ locale: 'vi', chosenByGuest: true });
    expect(firstLanguage(' ru;q=0.9 , en')).toBe('ru');
    expect(firstLanguage('')).toBeNull();
  });

  it('SEC E14-08 map pin hosts (setParameter property_map_url)', () => {
    expect(isAllowedMapUrl('https://maps.app.goo.gl/oYos42G5YvUEcDCc6')).toBe(true);
    expect(isAllowedMapUrl('https://www.google.com/maps/place/Da+Lat')).toBe(true);
    expect(isAllowedMapUrl('https://www.google.com/search?q=x')).toBe(false);
    expect(isAllowedMapUrl('http://maps.app.goo.gl/x')).toBe(false);
    expect(isAllowedMapUrl('https://maps.app.goo.gl.evil.example/x')).toBe(false);
    expect(isAllowedMapUrl('https://user:pw@maps.google.com/x')).toBe(false);
    expect(isAllowedMapUrl(42)).toBe(false);
  });

  it('guest-request copy is generated from the UXD strings (statusLabel; auto reply reported missing)', () => {
    expect(() =>
      execFileSync(
        process.execPath,
        [join(__dirname, '..', 'scripts', 'gen-guest-request-copy.mjs'), '--check'],
        { stdio: 'pipe' },
      ),
    ).not.toThrow();
    expect(GUEST_REQUEST_COPY.vi?.['guest.req.status.new']).toBe('Đã gửi');
    expect(GUEST_REQUEST_COPY.en?.['guest.req.status.declined']).toBeDefined();
  });
});

/** DOM v0.3.8 oracles (product/tests/fixtures/br-examples.json) – BE-D fixes DOM-S4-08…10. */
describe('BR v0.3.8 oracles (DOM-S4-08, DOM-S4-09, DOM-S4-10)', () => {
  interface Oracle {
    id: string;
    pendingFix?: string;
    params?: Record<string, unknown>;
    input: Record<string, unknown>;
    expected: Record<string, unknown>;
  }
  const examples = (
    JSON.parse(
      readFileSync(join(__dirname, '../../../tests/fixtures/br-examples.json'), 'utf8'),
    ) as { examples: Oracle[] }
  ).examples;
  const oracle = (id: string): Oracle => {
    const o = examples.find((x) => x.id === id);
    if (!o) throw new Error(`oracle ${id} missing`);
    return o;
  };

  it('BR-435-02: FOC + special discount 2.900.000 > 2.700.000 alerts; 10 live approvals do not (> 10)', () => {
    const o = oracle('BR-435-02');
    const i = o.input as {
      roomRevenueVnd: number;
      focAppliedVnd: number;
      specialDiscountAppliedVnd: number;
      approverDecisions: { foc: number; special_discount: number; cancelledByRule: number };
    };
    const p = o.params as {
      foc_alert_pct_of_room_revenue: number;
      foc_alert_count_per_approver: number;
    };
    const reduction = i.focAppliedVnd + i.specialDiscountAppliedVnd;
    const v = focValueCheck(reduction, i.roomRevenueVnd, p.foc_alert_pct_of_room_revenue);
    // Live approvals: every foc + special discount the approver decided, minus those cancelled by rule.
    const count =
      i.approverDecisions.foc +
      i.approverDecisions.special_discount -
      i.approverDecisions.cancelledByRule;
    expect({
      thresholdVnd: v.thresholdVnd,
      reductionValueVnd: reduction,
      valueAlert: v.valueAlert,
      approverCount: count,
      countAlert: focCountAlert(count, p.foc_alert_count_per_approver),
    }).toEqual(o.expected);
    // FOC alone (the HEAD behaviour) would not alert – the special discount matters.
    expect(focValueCheck(i.focAppliedVnd, i.roomRevenueVnd, 3).valueAlert).toBe(false);
    expect(focValueCheck(500_000, 0, 3)).toEqual({ thresholdVnd: 0, valueAlert: true });
  });

  it('BR-506-03: a priority clean preparing the room is not a full clean → the evening clean is free', () => {
    const o = oracle('BR-506-03');
    const e = o.expected as { feeVnd: number; countsAsFullClean: Record<string, boolean> };
    for (const [type, counts] of Object.entries(e.countsAsFullClean)) {
      expect(countsAsFullClean(type), type).toBe(counts);
    }
    const tasks = (o.input.tasksDone as Array<{ type: string; doneAt: string }>).filter((t) =>
      countsAsFullClean(t.type),
    );
    const fee = cleaningFee({
      stayType: 'short',
      feeVnd: (o.params as { adhoc_cleaning_fee: number }).adhoc_cleaning_fee,
      lastFullCleanTime: tasks.length > 0 ? tasks.at(-1)!.doneAt.slice(11, 16) : null,
    });
    expect(fee.feeVnd ?? 0).toBe(e.feeVnd);
  });

  it('BR-811-04: overdue → department + FD + FDL + manager, never the owner; deadline 15:10', () => {
    const o = oracle('BR-811-04');
    const e = o.expected as {
      ackDueAt: string;
      overdueRecipients: string[];
      ownerNotified: boolean;
    };
    const p = o.params as { guest_request_response_minutes: number; front_desk_hours: string[] };
    const sent = new Date(o.input.sentAt as string);
    const due = ackDueOf(
      sent,
      'Asia/Ho_Chi_Minh',
      deskHoursOf(p.front_desk_hours),
      p.guest_request_response_minutes,
    );
    expect(due.ackDueAt).toEqual(new Date(e.ackDueAt));
    expect(new Date(o.input.checkAt as string).getTime()).toBeGreaterThan(due.ackDueAt.getTime());
    const to = overdueRecipients(routeOf(o.input.type as never));
    expect([...to].sort()).toEqual([...e.overdueRecipients].sort());
    expect(to.includes('owner')).toBe(e.ownerNotified);
    expect(overdueRecipients('front_desk')).toEqual(['front_desk', 'front_desk_lead', 'manager']);
  });
});
