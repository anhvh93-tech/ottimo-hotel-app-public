import type { AttentionItem } from '@ottimo/api-client';
import { hasKey, translate } from '@ottimo/i18n';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { attentionLine } from '../app/attention';
import { todayLocal } from '../app/dates';
import { notifyChanged } from '../app/live';
import { dayMonth } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';
import { MemoryRouter } from 'react-router-dom';
import { Providers } from '../app/Providers';
import { OverviewPage } from '../pages/OverviewPage';
import { useSession } from '../session/SessionProvider';

/**
 * Sprint 4 – FE-B: H03 Hôm nay + H24 Tổng quan + "Cần chú ý" + live updates on the MSW mock of OpenAPI 0.3.7
 * (BE-D builds the API). Numbers come from the mock state, so a write elsewhere changes them (US-010 AC2).
 */
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string, args?: Record<string, string | number>) =>
  new RegExp(`^${esc(tv(key, args))}`);
const kpiCard = (key: string) => screen.getByText(tv(key)).closest('.kpi') as HTMLElement;

describe('H03 Hôm nay (US-010, US-011, US-012, US-031 – S4-31)', () => {
  it('KPIs of tonight: occupancy 6/9 = 66,7% (OOO 401 out of the denominator, holds not sold – K-03)', async () => {
    renderApp('/today', 'qa.fd');
    await screen.findByText('66,7%');
    expect(within(kpiCard('today.kpi_occupancy')).getByText('66,7%')).toBeInTheDocument();
    expect(
      within(kpiCard('today.kpi_occupancy')).getByText(
        tv('today.kpi_occupancy_note', { sold: 6, sellable: 9, blocked: 1 }),
      ),
    ).toBeInTheDocument();
    expect(within(kpiCard('today.kpi_arrivals')).getByText('2')).toBeInTheDocument();
    expect(
      within(kpiCard('today.kpi_arrivals')).getByText(tv('today.kpi_arrivals_note', { done: 0 })),
    ).toBeInTheDocument();
    expect(within(kpiCard('today.kpi_departures')).getByText('1')).toBeInTheDocument();
    expect(within(kpiCard('today.kpi_in_house')).getByText('5')).toBeInTheDocument();
  });

  it('arrivals and departures with the buttons the server allows; codes in mono, room number · name', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    const arr = await screen.findByRole('region', { name: tv('today.arrivals', { n: 2 }) });
    const anna = res('Anna Martin');
    const annaRow = within(arr)
      .getByRole('link', { name: 'Anna Martin' })
      .closest('.li') as HTMLElement;
    expect(within(annaRow).getByText('103')).toHaveClass('roomno');
    expect(within(annaRow).getByText('The Bloom')).toBeInTheDocument();
    expect(within(annaRow).getByText(anna.code)).toHaveClass('mono');
    expect(within(annaRow).getByText(tv('today.no_docs'))).toBeInTheDocument();
    expect(
      within(annaRow).getByRole('link', { name: tv('drawer.action.check_in') }),
    ).toHaveAttribute('href', `/reservations/${anna.id}/check-in`);

    const dep = screen.getByRole('region', { name: tv('today.departures', { n: 1 }) });
    const huy = res('Phạm Huy');
    expect(within(dep).getByRole('link', { name: tv('drawer.action.check_out') })).toHaveAttribute(
      'href',
      `/reservations/${huy.id}/check-out`,
    );
    // Reminder state chip always has words (US-031, BR-425).
    expect(
      within(dep).getByText(
        new RegExp(
          [tv('stay.card_overdue'), tv('stay.card_call'), tv('stay.card_waiting')]
            .map(esc)
            .join('|'),
        ),
      ),
    ).toBeInTheDocument();
    await user.click(within(arr).getByRole('link', { name: 'Anna Martin' }));
    expect(await screen.findByRole('dialog', { name: 'Anna Martin' })).toBeInTheDocument();
  });

  it('"Cần chú ý": one line per kind, room as "401 · The Pine", FD gets no owner/money items (US-012 AC4, AC6)', async () => {
    renderApp('/today', 'qa.fd');
    const attn = await screen.findByRole('region', { name: new RegExp(tv('today.attention')) });
    // 0.3.7 add. 1: `room_ooo` = count + roomNos only (no date).
    expect(
      await within(attn).findByText(tv('attn.room_ooo_rooms', { rooms: '401 · The Pine' })),
    ).toBeInTheDocument();
    const regDue = new RegExp(
      `^${esc(tv('attn.registration_due', { n: '§', time: '23:00' })).replace('§', '\\d+')}$`,
    );
    expect(within(attn).getByText(regDue)).toBeInTheDocument();
    expect(
      within(attn).getByText(
        tv('attn.hold_expiring', { code: res('Lê Minh').code, time: '' }).replace(/ $/, ''),
        {
          exact: false,
        },
      ),
    ).toBeInTheDocument();
    expect(within(attn).getByText(tv('today.unassigned_title', { n: 1 }))).toBeInTheDocument();
    expect(within(attn).queryByText(tv('attn.foc_threshold'))).not.toBeInTheDocument();
    // computed items have no "Đã xử lý" (they end when the business state changes – EP01 3.2).
    expect(
      within(attn).queryByRole('button', { name: tv('attn.resolve') }),
    ).not.toBeInTheDocument();
  });

  it('a critical event item is closed with a note (resolveAttentionEvent) and leaves the list', async () => {
    mockControl.dashboard.addEvent({
      kind: 'channel_sync_error',
      severity: 'critical',
      count: 2,
    });
    const { user } = renderApp('/today', 'qa.fd');
    const line = await screen.findByText(tv('attn.channel_sync_error', { n: 2 }));
    const row = line.closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: tv('attn.resolve') }));
    const dlg = await screen.findByRole('dialog', {
      name: label('attn.resolve_title', { what: '' }),
    });
    const save = within(dlg).getByRole('button', { name: tv('attn.resolve') });
    expect(save).toBeDisabled(); // critical → note required
    await user.type(
      within(dlg).getByLabelText(label('attn.resolve_note')),
      'Đã đóng bán tay trên Agoda',
    );
    await user.click(save);
    await waitFor(() =>
      expect(screen.queryByText(tv('attn.channel_sync_error', { n: 2 }))).not.toBeInTheDocument(),
    );
    expect(mockControl.dashboard.state.events[0]!.resolvedNote).toBe('Đã đóng bán tay trên Agoda');
  });

  it('US-136 AC2: OTA no-show → "Báo no-show cho Agoda" with "Đã báo kênh" (note optional)', async () => {
    const huy = res('Phạm Huy');
    const r = res('Ji-woo Park');
    r.status = 'no_show';
    const { user } = renderApp('/today', 'qa.fd');
    const line = await screen.findByText(
      tv('attn.ota_no_show_report', { channel: 'Booking.com', code: r.code }),
    );
    await user.click(
      within(line.closest('li')!).getByRole('button', { name: tv('attn.reported_channel') }),
    );
    const dlg = await screen.findByRole('dialog');
    await user.click(within(dlg).getByRole('button', { name: tv('attn.reported_channel') }));
    await waitFor(() => expect(screen.queryByText(line.textContent!)).not.toBeInTheDocument());
    expect(huy.status).toBe('in_house');
  });

  it('a failing KPI block does not hide the others (H24 24.1 – blocks are independent)', async () => {
    mockControl.failNext(/dashboard\/tonight/, 500, { code: 'INTERNAL_ERROR' });
    renderApp('/today', 'qa.fd');
    expect(await screen.findByText(tv('ov.kpi_error'))).toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: tv('today.arrivals', { n: 2 }) }),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('today.unassigned_title', { n: 1 }))).toBeInTheDocument();
  });
});

/** H24 24.2 variants are not reachable from the menu in R2 (H02 2.2, UXD s4-UXD D) – render the page itself. */
function Gate() {
  const s = useSession();
  return s.property ? <OverviewPage /> : null;
}
function renderOverviewAs(user: string) {
  mockControl.signInAs(user);
  return render(
    <Providers>
      <MemoryRouter>
        <Gate />
      </MemoryRouter>
    </Providers>,
  );
}

describe('H24 Tổng quan (US-010, US-012 AC6/AC8, BR-907) – owner / manager', () => {
  it('R2 (H02 2.2): front desk cannot open Tổng quan from the menu or by URL', async () => {
    renderApp('/overview', 'qa.fd');
    expect(await screen.findByText('Bạn không có quyền mở trang này')).toBeInTheDocument();
  });

  it('owner: Cần duyệt → Cần chú ý (with the owner-only FOC alert) → Đêm nay; live badge with words', async () => {
    renderApp('/overview', 'qa.owner');
    expect(
      await screen.findByRole('heading', { name: tv('ov.approvals_n', { n: 1 }) }),
    ).toBeInTheDocument();
    const appr = screen.getByRole('region', { name: tv('ov.approvals_n', { n: 1 }) });
    expect(
      within(appr).getByRole('link', { name: new RegExp(esc(tv('foc.kind_foc'))) }),
    ).toHaveAttribute('href', '/approvals');
    const foc = await screen.findByText(tv('attn.foc_threshold'));
    expect(within(foc.closest('a')!).getByText(tv('ov.owner_only'))).toBeInTheDocument();
    expect(foc.closest('a')).toHaveAttribute('href', '/approvals');
    expect(await screen.findByText('66,7%')).toBeInTheDocument();
    expect(screen.getByText('2 / 1')).toBeInTheDocument();
    expect(screen.getByText(tv('ov.live'))).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: new RegExp(esc(tv('nav.overview'))) }),
    ).toHaveTextContent(tv('ov.subtitle', { date: dayMonth(todayLocal()) }));
  });

  it('manager: same page without the owner-only FOC alert (AC6)', async () => {
    renderApp('/overview', 'qa.mgr');
    await screen.findByText('66,7%');
    await screen.findByText(tv('today.unassigned_title', { n: 1 }));
    expect(screen.queryByText(tv('attn.foc_threshold'))).not.toBeInTheDocument();
  });

  it('a new item after a live event: "Mới", highlighted, announced once (no focus move)', async () => {
    renderApp('/overview', 'qa.owner');
    await screen.findByText(tv('attn.foc_threshold'));
    const before = document.activeElement;
    mockControl.dashboard.addEvent({ kind: 'channel_sync_error', severity: 'critical', count: 2 });
    act(() => notifyChanged('attention.changed'));
    const line = await screen.findByText(
      tv('attn.channel_sync_error', { n: 2 }),
      {},
      { timeout: 4000 },
    );
    // channel_sync_error has no Desk screen yet (S18) → a static row, not a link.
    const row = line.closest('li') as HTMLElement;
    expect(row).toHaveClass('is-new');
    expect(within(row).getByText(tv('ov.new'))).toBeInTheDocument();
    expect(screen.getByText(tv('ov.sse_new_announce'))).toBeInTheDocument();
    expect(document.activeElement).toBe(before);
    // The old items are not "new".
    expect(screen.getByText(tv('attn.foc_threshold')).closest('a')).not.toHaveClass('is-new');
  });

  it('H24 24.2 front desk (variant ready, menu off in R2): instead of "Cần duyệt" the status of the requests they sent', async () => {
    renderOverviewAs('qa.fd');
    const head = await screen.findByRole('heading', { name: tv('ov.my_requests_n', { n: 3 }) });
    const block = head.closest('section')!;
    // Hạnh's own requests only (a FOC waiting, two refunds approved) – with words, and not links (no H17 for FD).
    expect(within(block).getByText(tv('approval.status.pending'))).toBeInTheDocument();
    expect(within(block).getAllByText(tv('approval.status.approved'))).toHaveLength(2);
    expect(within(block).queryByRole('link')).not.toBeInTheDocument();
    const approvalsHead = new RegExp(`^${esc(tv('ov.approvals_n', { n: '§' }).split('§')[0]!)}`);
    expect(screen.queryByRole('heading', { name: approvalsHead })).toBeNull();
    expect(await screen.findByText('66,7%')).toBeInTheDocument();
    await screen.findByText(tv('today.unassigned_title', { n: 1 }));
    expect(screen.queryByText(tv('attn.foc_threshold'))).not.toBeInTheDocument();
  });

  it('H24 24.2 desk lead (variant ready, menu off in R2): "Cần duyệt" = requests they may decide (not their own) → H17', async () => {
    renderOverviewAs('qa.fdl');
    const head = await screen.findByRole('heading', { name: tv('ov.approvals_n', { n: 1 }) });
    const block = head.closest('section')!;
    expect(
      within(block).getByRole('link', { name: new RegExp(esc(tv('foc.kind_foc'))) }),
    ).toHaveAttribute('href', '/approvals');
    await screen.findByText(tv('today.unassigned_title', { n: 1 }));
    expect(screen.queryByText(tv('attn.foc_threshold'))).not.toBeInTheDocument();
  });
});

describe('attentionLine – one sentence for every AttentionItem.kind of 0.3.7 (never a raw key)', () => {
  const KINDS = [
    'vip_arrival',
    'room_ooo',
    'rent_due_soon',
    'lease_expiring',
    'registration_due',
    'registration_overdue',
    'visa_expiring',
    'work_order_high_open',
    'hold_expiring',
    'meter_not_read',
    'channel_sync_error',
    'foc_threshold',
    'overbooking',
    'unassigned_with_free_room',
    'data_quality',
    'deposit_after_cancel',
    'no_show_call',
    'no_show_mark',
    'security_alert',
    'capacity_conflict',
    'work_order_overdue',
    'extra_guest_kit_overdue',
    'room_status_mismatch',
    'reconcile_overdue',
    'ooo_ending_work_open',
    'guest_request_overdue',
    'ota_no_show_report',
    'closed_reservation_credit',
  ] as const;
  it.each(KINDS)('%s', (kind) => {
    const used: string[] = [];
    const line = attentionLine(
      {
        kind,
        source: 'event',
        eventId: 'e1',
        severity: 'warning',
        count: 2,
        refCode: 'OTM-0150',
        roomNos: ['401'],
        dueAt: `${todayLocal()}T23:00:00+07:00`,
        reservationIds: ['r1'],
        params: { roomNo: '401', endDate: todayLocal(), count: 2, oldestDays: 3, channel: 'agoda' },
      } as AttentionItem,
      {
        t: (k, a) => {
          used.push(k);
          return translate('vi', k, a);
        },
        roles: ['owner'],
        room: (no) => (no ? `${no} · The Pine` : ''),
        channel: (c) => (c === 'agoda' ? 'Agoda' : c),
      },
    );
    for (const k of used) expect(hasKey(k), k).toBe(true);
    expect(line.text).not.toMatch(/\{\w+\}/);
    expect(line.text).not.toMatch(/^attn\./);
  });

  it('0.3.7 add. 1: room_ooo has no date; foc_threshold says ratio or per-approver by params.check', () => {
    const ctx = {
      t: (k: string, a?: Record<string, string | number>) => translate('vi', k, a),
      roles: ['owner' as const],
      room: (n?: string | null) => (n === '401' ? '401 · The Pine' : (n ?? '')),
      channel: (c: string) => c,
      num: (n: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n),
    };
    expect(
      attentionLine(
        { kind: 'room_ooo', source: 'computed', severity: 'info', count: 1, roomNos: ['401'] },
        ctx,
      ).text,
    ).toBe(tv('attn.room_ooo_rooms', { rooms: '401 · The Pine' }));
    const pct = attentionLine(
      {
        kind: 'foc_threshold',
        source: 'computed',
        severity: 'warning',
        params: { check: 'foc_pct_of_room_revenue', pct: 4.2, threshold: 3 },
      },
      ctx,
    );
    const per = attentionLine(
      {
        kind: 'foc_threshold',
        source: 'computed',
        severity: 'warning',
        params: { check: 'foc_count_per_approver', count: 12, max: 10 },
      },
      ctx,
    );
    // FE-S4-19: decimal comma in Vietnamese, like the occupancy tile.
    expect(pct.text).toBe(tv('attn.foc_pct', { pct: '4,2', threshold: '3' }));
    expect(per.text).toBe(tv('attn.foc_count', { count: '12', max: '10' }));
    expect(pct.key).not.toBe(per.key);
    // No pct (room revenue = 0) → the general sentence.
    expect(
      attentionLine(
        {
          kind: 'foc_threshold',
          source: 'computed',
          severity: 'warning',
          params: { check: 'foc_pct_of_room_revenue', threshold: 3 },
        },
        ctx,
      ).text,
    ).toBe(tv('attn.foc_threshold'));
  });

  it('SR-RET-06: the visa line carries the booking code only', () => {
    const line = attentionLine(
      { kind: 'visa_expiring', source: 'computed', severity: 'warning', refCode: 'OTM-0146' },
      {
        t: (k, a) => translate('vi', k, a),
        roles: ['front_desk'],
        room: (n) => n ?? '',
        channel: (c) => c,
      },
    );
    expect(line.text).toBe(tv('attn.visa_expiring', { code: 'OTM-0146' }));
  });

  it('auto-closing and owner-only items have no close button for others', () => {
    const ctx = {
      t: (k: string) => k,
      roles: ['front_desk' as const],
      room: (n?: string | null) => n ?? '',
      channel: (c: string) => c,
    };
    expect(
      attentionLine(
        { kind: 'overbooking', source: 'event', eventId: 'e', severity: 'critical' },
        ctx,
      ).resolveLabel,
    ).toBeUndefined();
    expect(
      attentionLine(
        { kind: 'data_quality', source: 'event', eventId: 'e', severity: 'warning' },
        ctx,
      ).resolveLabel,
    ).toBeUndefined();
    expect(
      attentionLine(
        { kind: 'channel_sync_error', source: 'event', eventId: 'e', severity: 'critical' },
        ctx,
      ),
    ).toMatchObject({ resolveLabel: 'attn.resolve', noteRequired: true, tone: 'urgent' });
  });
});

describe('useLiveEvents – SSE kinds per burst, re-read all after a reconnect (EP01 §4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.doUnmock('../app/config');
  });

  it('collects the kinds of a burst into one call; a reconnect after a drop asks for everything', async () => {
    vi.resetModules();
    vi.doMock('../app/config', () => ({ apiMode: () => 'server' }));
    const { useLiveEvents, ALL_EVENTS } = await import('../app/live');
    class FakeES {
      static OPEN = 1;
      static CLOSED = 2;
      static last: FakeES;
      readyState = 0;
      onopen: (() => void) | null = null;
      onerror: (() => void) | null = null;
      handlers = new Map<string, () => void>();
      constructor() {
        FakeES.last = this;
      }
      addEventListener(type: string, fn: () => void) {
        this.handlers.set(type, fn);
      }
      close() {}
    }
    vi.stubGlobal('EventSource', FakeES);
    vi.useFakeTimers();
    const calls: string[][] = [];
    function Probe() {
      useLiveEvents('p1', (k) => calls.push([...k].sort()), {
        events: ['reservation.changed', 'attention.changed'],
        debounceMs: 1000,
      });
      return null;
    }
    render(<Probe />);
    const es = FakeES.last;
    act(() => {
      es.readyState = 1;
      es.onopen?.();
      es.handlers.get('attention.changed')!();
      es.handlers.get('reservation.changed')!();
      es.handlers.get('attention.changed')!();
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(calls).toEqual([['attention.changed', 'reservation.changed']]);
    act(() => {
      es.readyState = 0;
      es.onerror?.();
    });
    act(() => {
      es.readyState = 1;
      es.onopen?.();
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(calls[1]).toEqual([ALL_EVENTS]);
  });
});
