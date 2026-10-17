/**
 * BE-C Sprint 4 unit tests (no database): BUG-R2-108 – `WorkOrder.allowedActions` is OpenAPI `AllowedAction[]`
 * (event of state-machines.md mục 19, SM-04 transition, action path segment) for every role × status, and the
 * response serializer keeps those objects (plain strings – the old shape – are dropped, which is why Desk S11
 * showed no buttons).
 */
import { describe, expect, it } from 'vitest';
import type { WorkOrderStatus } from '../src/db/schema/housekeeping';
import { woAllowedActions } from '../src/modules/housekeeping/internal/rules';
import { serializeResponse } from '../src/shared/serialization/serializer';

const ME = '0192a1b0-0000-7000-8000-00000000c501';
const OTHER = '0192a1b0-0000-7000-8000-00000000c502';
const actions = (
  status: WorkOrderStatus,
  roles: string[],
  opts: { createdBy?: string; reopenable?: boolean } = {},
) =>
  woAllowedActions(
    {
      status,
      createdBy: opts.createdBy ?? OTHER,
      ...(opts.reopenable !== undefined ? { reopenable: opts.reopenable } : {}),
    },
    roles,
    ME,
  );

describe('BUG-R2-108 – WorkOrder.allowedActions (SM-04, A85)', () => {
  it('returns AllowedAction objects: event (mục 19), transition (W2…W6), action (path segment)', () => {
    expect(actions('new', ['front_desk'])).toEqual([
      { event: 'accept_work_order', transition: 'W2', action: 'accept' },
      { event: 'cancel_work_order', transition: 'W5', action: 'cancel' },
    ]);
    expect(actions('in_progress', ['manager'])).toEqual([
      { event: 'wait_parts', transition: 'W3', action: 'wait-parts' },
      { event: 'complete_work_order', transition: 'W4', action: 'complete' },
    ]);
    expect(actions('waiting_parts', ['front_desk_lead'])).toEqual([
      { event: 'resume_work_order', transition: 'W3', action: 'resume' },
      { event: 'cancel_work_order', transition: 'W5', action: 'cancel' },
    ]);
    expect(actions('done', ['owner'], { reopenable: true })).toEqual([
      { event: 'reopen_work_order', transition: 'W6', action: 'reopen' },
    ]);
    expect(actions('cancelled', ['owner'])).toEqual([]);
  });

  it('by role: HK none; MT no reopen and cancels only its own `new`; FD+ reopen only while reopenable', () => {
    for (const s of ['new', 'in_progress', 'waiting_parts', 'done'] as const) {
      expect(actions(s, ['housekeeping'])).toEqual([]);
      expect(actions(s, ['sales_staff'])).toEqual([]);
    }
    expect(actions('new', ['maintenance']).map((a) => a.action)).toEqual(['accept']);
    expect(actions('new', ['maintenance'], { createdBy: ME }).map((a) => a.action)).toEqual([
      'accept',
      'cancel',
    ]);
    expect(actions('waiting_parts', ['maintenance']).map((a) => a.action)).toEqual(['resume']);
    expect(actions('done', ['maintenance'], { reopenable: true })).toEqual([]);
    expect(actions('done', ['front_desk'], { reopenable: false })).toEqual([]);
    // a desk role combined with HK keeps the desk actions
    expect(actions('new', ['housekeeping', 'front_desk']).map((a) => a.action)).toEqual([
      'accept',
      'cancel',
    ]);
  });

  it('the response serializer keeps AllowedAction objects (getWorkOrder) – plain strings are dropped', () => {
    const body = {
      id: '0192a1b0-0000-7000-8000-0000000000a1',
      code: 'WO-00001',
      roomId: '0192a1b0-0000-7000-8000-0000000000b1',
      roomNo: '201',
      title: 'Thay vòi sen',
      description: 'Vòi sen rò nước',
      category: 'other',
      severity: 'medium',
      status: 'new',
      source: 'front_desk',
      createdAt: '2026-10-15T09:00:00.000+07:00',
      version: 1,
    };
    const out = serializeResponse(
      'getWorkOrder',
      200,
      { ...body, allowedActions: actions('new', ['front_desk']) },
      { roles: ['front_desk'] },
    ) as { allowedActions: unknown[] };
    expect(out.allowedActions).toEqual([
      { event: 'accept_work_order', transition: 'W2', action: 'accept' },
      { event: 'cancel_work_order', transition: 'W5', action: 'cancel' },
    ]);
    const old = serializeResponse(
      'getWorkOrder',
      200,
      { ...body, allowedActions: ['accept', 'cancel'] },
      { roles: ['front_desk'] },
    ) as { allowedActions?: unknown[] };
    expect(old.allowedActions ?? []).toEqual([]);
  });
});
