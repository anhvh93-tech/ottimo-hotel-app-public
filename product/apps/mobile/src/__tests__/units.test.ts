import { describe, expect, it } from 'vitest';
import type { HkTask, RoomStatusEntry, WorkOrder } from '../app/api';
import { effectiveRoomStatus, eventsFor } from '../app/overlay';
import { roomLabel } from '@ottimo/i18n';
import { asRoom } from '../app/rooms';
import { parseRoute, href } from '../app/router';
import { staffMode, sessionFromMe } from '../app/session';
import { arrivalText, inFilter, sortByPriority, taskGroup } from '../app/tasks';
import { localDate, hhmm } from '../app/time';
import { nextDue, sortWorkOrders } from '../app/workOrders';
import type { QueueItem } from '../queue/queue';

const t = (k: string, a?: Record<string, string | number>) => (a ? `${k}${JSON.stringify(a)}` : k);

describe('room labels for staff use the shared helper (BR-012, DS 11.3 – @ottimo/i18n roomLabel)', () => {
  it('"401 · The Pine" from API shapes (`roomName`); number alone when the name is not entered yet', () => {
    expect(roomLabel(asRoom({ roomNo: '401', roomName: 'The Pine' }), 'staff')).toBe(
      '401 · The Pine',
    );
    expect(roomLabel(asRoom({ roomNo: '401', roomName: null }), 'staff')).toBe('401');
    expect(
      roomLabel(asRoom({ roomNo: '401', roomName: 'The Pine' }), 'staff', { separator: ', ' }),
    ).toBe('401, The Pine');
  });
});

describe('roles → app (ADR-005)', () => {
  it('HK → housekeeping screens, MT → work orders, FD+ → housekeeping, sales → nothing', () => {
    expect(staffMode(['housekeeping'])).toBe('hk');
    expect(staffMode(['maintenance'])).toBe('mt');
    expect(staffMode(['front_desk_lead'])).toBe('hk');
    expect(staffMode(['sales_staff'])).toBeNull();
    expect(staffMode(['collaborator'])).toBeNull();
  });
  it('uses the active property', () => {
    const s = sessionFromMe({
      id: 'u',
      displayName: 'Lan',
      csrfToken: 'c',
      activePropertyId: 'p2',
      properties: [
        {
          propertyId: 'p1',
          name: 'A',
          timezone: 'Asia/Ho_Chi_Minh',
          roles: ['maintenance'],
          screens: [],
        },
        {
          propertyId: 'p2',
          name: 'B',
          timezone: 'Asia/Ho_Chi_Minh',
          roles: ['housekeeping'],
          screens: [],
        },
      ],
    });
    expect(s).toMatchObject({ propertyId: 'p2', mode: 'hk' });
  });
});

describe('H19 grouping (client groups, server orders – US-054 AC4)', () => {
  const today = '2026-10-19';
  const base = (over: Partial<HkTask>): HkTask => ({
    id: 'x',
    roomId: 'r',
    roomNo: '202',
    type: 'checkout_clean',
    status: 'open',
    dueDate: today,
    quantity: 1,
    source: 'system',
    version: 1,
    ...over,
  });
  const room = (over: Partial<RoomStatusEntry>): RoomStatusEntry => ({
    roomId: 'r',
    roomNo: '202',
    status: 'VD',
    since: 'x',
    allowedEvents: [],
    version: 1,
    ...over,
  });
  it('kits / arrivals today first; checkout of a room still occupied after; stay-overs in "Khách đang ở"', () => {
    expect(
      taskGroup(base({ type: 'extra_guest_kit_prepare' }), 'open', 'VC', room({}), today),
    ).toBe('first');
    expect(
      taskGroup(
        base({}),
        'open',
        'VD',
        room({ nextArrival: { date: today, etaTime: '15:30' } }),
        today,
      ),
    ).toBe('first');
    expect(taskGroup(base({}), 'open', 'OD', room({ status: 'OD' }), today)).toBe('later');
    expect(
      taskGroup(base({ type: 'stayover_clean' }), 'open', 'OD', room({ status: 'OD' }), today),
    ).toBe('stay');
    expect(taskGroup(base({}), 'done', 'VC', room({}), today)).toBe('done');
  });
  it('keeps the server priority', () => {
    const list = sortByPriority([
      base({ id: 'b', priorityRank: 2 }),
      base({ id: 'a', priorityRank: 1 }),
      base({ id: 'c' }),
    ]);
    expect(list.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });
  it('arrival sentence: today with time, tomorrow, later date', () => {
    expect(
      arrivalText(room({ nextArrival: { date: today, etaTime: '14:00' } }), t, today),
    ).toContain('hk.arriving_today');
    expect(arrivalText(room({ nextArrival: { date: '2026-10-20' } }), t, today)).toBe(
      'hk.arriving_tomorrow',
    );
    expect(
      arrivalText(room({ nextArrival: { date: '2026-10-23', etaTime: '14:00' } }), t, today),
    ).toBe('hk.next_arrival{"when":"23/10 14:00"}');
  });
  it('filters of US-052 AC2: "Cần dọn" = VD, OD, CL', () => {
    expect(
      (['VD', 'OD', 'CL', 'VC', 'VI', 'OC', 'OOO'] as const).filter((s) => inFilter(s, 'dirty')),
    ).toEqual(['VD', 'OD', 'CL']);
    expect(inFilter('OOO', 'ooo')).toBe(true);
  });
});

describe('optimistic overlay (EP07-08 8.3)', () => {
  const held = {
    id: 'k',
    seq: 1,
    kind: 'room_status',
    state: 'held',
    roomId: 'r',
    optimistic: { roomStatus: 'VC' },
  } as unknown as QueueItem;
  it('a waiting change shows its result with the "Chờ gửi" flag; a refused one does not count', () => {
    expect(effectiveRoomStatus({ roomId: 'r', status: 'CL' }, [held])).toEqual({
      value: 'VC',
      queued: true,
    });
    expect(
      effectiveRoomStatus({ roomId: 'r', status: 'CL' }, [
        { ...held, state: 'rejected' } as QueueItem,
      ]),
    ).toEqual({ value: 'CL', queued: false });
  });
  it('next step while queued follows SM-03 (CL → Dọn xong, VC → Kiểm phòng)', () => {
    expect(eventsFor('CL', ['start_cleaning'], true)).toEqual(['finish_cleaning']);
    expect(eventsFor('VC', [], true)).toEqual(['inspect']);
    expect(eventsFor('VD', ['start_cleaning'], false)).toEqual(['start_cleaning']);
  });
});

describe('work orders (BR-809, hi-fi 22.1)', () => {
  const now = Date.parse('2026-10-19T10:42:00+07:00');
  const wo = (over: Partial<WorkOrder>): WorkOrder => ({
    id: 'w',
    code: 'WO-1',
    roomId: 'r',
    title: 'x',
    severity: 'medium',
    status: 'new',
    source: 'housekeeping',
    version: 1,
    ...over,
  });
  it('"Nhận việc trước 10:47 – còn 5 phút"; overdue; paused while waiting for parts (not for urgent)', () => {
    expect(
      nextDue(wo({ severity: 'high', ackDueAt: '2026-10-19T10:47:00+07:00' }), t, now)?.text,
    ).toBe('wo.due.ack{"time":"10:47","m":5}');
    expect(nextDue(wo({ ackDueAt: '2026-10-19T10:30:00+07:00' }), t, now)).toEqual({
      text: 'wo.due.overdue{"m":12}',
      tone: 'bad',
    });
    expect(
      nextDue(
        wo({
          status: 'waiting_parts',
          partsExpectedDate: '2026-10-21',
          resolveDueAt: '2026-10-20T08:00:00+07:00',
        }),
        t,
        now,
      )?.text,
    ).toBe('wo.due.paused{"date":"21/10"}');
    expect(
      nextDue(
        wo({
          severity: 'high',
          status: 'waiting_parts',
          partsExpectedDate: '2026-10-21',
          resolveDueAt: '2026-10-19T12:32:00+07:00',
        }),
        t,
        now,
      )?.text,
    ).toBe('wo.due.plan{"time":"12:32"}');
  });
  it('order: overdue → urgent → nearest deadline', () => {
    const list = sortWorkOrders(
      [
        wo({ id: 'low', severity: 'low', resolveDueAt: '2026-10-22T08:00:00+07:00' }),
        wo({ id: 'high', severity: 'high', ackDueAt: '2026-10-19T10:50:00+07:00' }),
        wo({ id: 'late', severity: 'medium', isOverdue: true }),
      ],
      now,
    );
    expect(list.map((x) => x.id)).toEqual(['late', 'high', 'low']);
  });
});

describe('routes and time', () => {
  it('parses and builds hash routes', () => {
    expect(parseRoute('#/room/abc-1')).toEqual({ name: 'room', roomId: 'abc-1' });
    expect(parseRoute('#/room/abc-1/refuse')).toEqual({
      name: 'room',
      roomId: 'abc-1',
      refuse: true,
    });
    expect(parseRoute('#/wo/w-1')).toEqual({ name: 'wo_detail', id: 'w-1' });
    expect(parseRoute('#/nope')).toBeUndefined();
    expect(href({ name: 'report', roomId: 'r1' })).toBe('#/report/r1');
  });
  it('shows times in the property time zone (BR-001)', () => {
    expect(hhmm('2026-10-19T03:42:00Z')).toBe('10:42');
    expect(localDate(Date.parse('2026-10-19T18:30:00Z'))).toBe('2026-10-20');
  });
});
