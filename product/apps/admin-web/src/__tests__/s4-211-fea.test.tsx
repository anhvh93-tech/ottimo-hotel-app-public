import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { businessDayLocal, onBusinessDay, todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/**
 * BUG-R2-211 on the Desk (ORC 20/10, FE-A đợt 27): "today" of a form / a request is the BUSINESS day
 * (BR-010, API `ctx.today`) – from 00:00 to 05:59 it is still the day before. Clock pinned (only `Date`) at
 * 02:40, 05:59 and 06:00 of the calendar day D; the mock answers like the API (businessDate / Rack.today).
 */
const D = todayLocal();
const Y = addDays(D, -1);
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${D}T${hhmm}:00+07:00`));
};
const CLOCKS: Array<[string, string]> = [
  ['02:40', Y],
  ['05:59', Y],
  ['06:00', D],
];
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const room = (no: string) => mockControl.db.rooms.find((r) => r.roomNo === no)!;

/** Bodies (and paths) of the requests whose URL matches `re`, from now on. */
function capture(re: RegExp) {
  const bodies: Array<Record<string, unknown>> = [];
  const paths: string[] = [];
  const on = ({ request }: { request: Request }) => {
    if (!re.test(request.url)) return;
    paths.push(new URL(request.url).pathname);
    if (request.method !== 'GET')
      void request
        .clone()
        .json()
        .then((b: Record<string, unknown>) => bodies.push(b));
  };
  server.events.on('request:start', on);
  return { bodies, paths, stop: () => server.events.removeListener('request:start', on) };
}

afterEach(() => vi.useRealTimers());

describe('BR-010 business day on the device (helpers)', () => {
  it.each(CLOCKS)('%s → business day', (hhmm, day) => {
    at(hhmm);
    expect(businessDayLocal()).toBe(day);
  });

  it('#4 approval "of today" = business day of the decision', () => {
    // Decided 23:00 on Y: still today at 02:40 / 05:59 (business Y); not after 06:00 (business D).
    const late = `${Y}T23:00:00+07:00`;
    expect(onBusinessDay(late, Y)).toBe(true);
    expect(onBusinessDay(late, D)).toBe(false);
    // Decided 05:00 on D: business Y – no longer "today" at 10:00 (the calendar day was the same).
    const early = `${D}T05:00:00+07:00`;
    expect(onBusinessDay(early, Y)).toBe(true);
    expect(onBusinessDay(early, D)).toBe(false);
    expect(onBusinessDay(`${D}T06:00:00+07:00`, D)).toBe(true);
  });
});

describe('#1 H15 Đổi phòng – effectiveDate = business day', () => {
  async function open(user: ReturnType<typeof renderApp>['user']) {
    const kim = res('Kim Seo-yeon');
    const drawer = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.change_room') }));
    const dlg = await screen.findByRole('dialog', { name: /^Đổi phòng · Căn 402/ });
    return { kim, dlg };
  }

  it.each(CLOCKS)('%s → preview and change carry %s', async (hhmm, day) => {
    at(hhmm);
    res('Nguyễn Văn An').status = 'cancelled'; // frees 202
    const cap = capture(/\/actions\/change-room/);
    const avail = capture(/\/availability/);
    const { user } = renderApp(`/reservations/${res('Kim Seo-yeon').id}`, 'qa.fd');
    const { kim, dlg } = await open(user);
    await user.click(await within(dlg).findByRole('radio', { name: /^202/ }));
    await waitFor(() => expect(cap.bodies.length).toBeGreaterThan(0));
    expect(cap.bodies.at(-1)).toMatchObject({ effectiveDate: day });
    // Free rooms are searched from the business day too.
    expect(avail.paths.length).toBeGreaterThan(0);
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Máy nước nóng hỏng');
    await user.click(
      within(dlg).getByRole('button', { name: tv('stay.change_submit', { room: '202' }) }),
    );
    await waitFor(() => expect(cap.bodies.length).toBeGreaterThan(1));
    cap.stop();
    avail.stop();
    expect(cap.bodies.at(-1)).toMatchObject({ effectiveDate: day });
    // Accepted (the mock checks `=== ctx.today` like the API): the stay is in 202 from the business day.
    await waitFor(() =>
      expect(res('Kim Seo-yeon').segments?.find((s) => s.fromDate === day)?.roomNo).toBe('202'),
    );
    expect(kim.id).toBeTruthy();
  });
});

describe('#2 #3 H09 Đặt phòng mới – arrival = business day', () => {
  async function openForm(user: ReturnType<typeof renderApp>['user']) {
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
    return screen.findByRole('dialog', { name: /Đặt phòng mới/ });
  }

  it.each(CLOCKS)('%s → default arrival and the earliest date are %s', async (hhmm, day) => {
    at(hhmm);
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    const arrival = within(dlg).getByLabelText('Ngày đến');
    await waitFor(() => expect(arrival).toHaveValue(day));
    expect(arrival).toHaveAttribute('min', day);
    expect(within(dlg).getByLabelText('Ngày đi')).toHaveValue(addDays(day, 1));
  });

  it('02:40: a walk-in books the night before (D-1 → D), the server accepts it', async () => {
    at('02:40');
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    await waitFor(() => expect(within(dlg).getByLabelText('Ngày đến')).toHaveValue(Y));
    const roomSel = within(dlg).getByLabelText(/^Căn/);
    await waitFor(() => expect(within(roomSel).getAllByRole('option').length).toBeGreaterThan(5));
    const option = within(roomSel)
      .getAllByRole<HTMLOptionElement>('option')
      .find((o) => /^103 /.test(o.textContent ?? ''))!; // free on the night before
    await user.selectOptions(roomSel, option);
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Trần Minh');
    await user.click(await screen.findByRole('option', { name: /Trần Minh Khoa/ }));
    await waitFor(() => expect(within(dlg).getByText('Tổng tiền đơn')).toBeInTheDocument());
    expect(within(dlg).queryByText(tv('booking.error.past_date'))).toBeNull();
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    const r = mockControl.rsv.reservations.at(-1)!;
    expect([r.arrivalDate, r.departureDate]).toEqual([Y, D]);
  });

  it('#3 02:40: long stay from the business day is not "in the past"', async () => {
    at('02:40');
    // 203 free for the 40 nights (the seed has a later short stay there).
    for (const r of mockControl.rsv.reservations)
      if (r.roomId === room('203').id && r.arrivalDate >= D) r.status = 'cancelled';
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    await waitFor(() => expect(within(dlg).getByLabelText('Ngày đến')).toHaveValue(Y));
    fireEvent.change(within(dlg).getByLabelText('Ngày đi'), {
      target: { value: addDays(Y, 40) },
    });
    await user.click(await within(dlg).findByRole('button', { name: 'Tạo đơn dài hạn nhập tay' }));
    const ls = await screen.findByRole('dialog', { name: /Đơn dài hạn nhập tay/ });
    expect(within(ls).getByLabelText(label('lsm.move_in'))).toHaveAttribute('min', Y);
    await user.selectOptions(
      within(ls).getByLabelText(label('booking.field.room')),
      room('203').id,
    );
    await user.type(within(ls).getByRole('combobox', { name: 'Khách đứng tên' }), 'Hoàng Gia');
    await user.click(await screen.findByRole('option', { name: /Hoàng Gia Bảo/ }));
    await user.type(within(ls).getByLabelText(/Tiền thuê mỗi tháng/), '9800000');
    await user.click(within(ls).getByRole('button', { name: 'Tạo đơn dài hạn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(within(ls).queryByText(tv('booking.error.past_date'))).toBeNull();
    expect(mockControl.rsv.reservations.at(-1)!.arrivalDate).toBe(Y);
  });
});

describe('#5 S11 khóa căn / phiếu sửa – start = business day', () => {
  async function newOrder(user: ReturnType<typeof renderApp>['user']) {
    await user.click(await screen.findByRole('button', { name: tv('wo.new_title') }));
    const dlg = await screen.findByRole('dialog', { name: tv('wo.new_title') });
    await user.click(within(dlg).getByRole('switch', { name: tv('hk.lock_request') }));
    return { dlg, start: within(dlg).getByLabelText(label('wo.block_from')) };
  }

  it.each(CLOCKS)('%s, desk: block from %s, accepted', async (hhmm, day) => {
    at(hhmm);
    const { user } = renderApp('/maintenance', 'qa.fd');
    const { dlg, start } = await newOrder(user);
    await waitFor(() => expect(start).toHaveValue(day));
    expect(start).toHaveAttribute('min', day);
    await waitFor(() => expect(within(dlg).getAllByRole('option').length).toBeGreaterThan(8));
    await user.selectOptions(within(dlg).getByLabelText(label('hk.wo.room')), room('203').id);
    await user.type(within(dlg).getByLabelText(label('wo.title_label')), 'Vòi nước rỉ');
    await user.type(within(dlg).getByLabelText(label('hk.wo.desc')), 'Rỉ nước liên tục');
    await user.click(within(dlg).getByRole('button', { name: tv('wo.create_and_block') }));
    await waitFor(() =>
      expect(mockControl.rsv.blocks.some((b) => b.roomId === room('203').id)).toBe(true),
    );
    // A room broken at 02:40 is closed from tonight (business day), not from the next one.
    expect(mockControl.rsv.blocks.find((b) => b.roomId === room('203').id)!.from).toBe(day);
  });

  it.each(CLOCKS)(
    '%s, maintenance, server before R3-Q38 (no BookingRules in the contract) → Rack.today %s',
    async (hhmm, day) => {
      at(hhmm);
      mockControl.db.meBusinessDate = false;
      const reads = capture(/\/(booking-rules|rack)(\?|$)/);
      const { user } = renderApp('/maintenance', 'qa.mt');
      const { start } = await newOrder(user);
      await waitFor(() => expect(start).toHaveValue(day));
      expect(start).toHaveAttribute('min', day);
      reads.stop();
      expect(reads.paths.some((p) => p.endsWith('/rack'))).toBe(true);
      expect(reads.paths.some((p) => p.endsWith('/booking-rules'))).toBe(false);
    },
  );

  it.each(CLOCKS)(
    '%s, maintenance, R3-Q38 → Me.businessDate %s, no rack / booking-rules read',
    async (hhmm, day) => {
      at(hhmm);
      const reads = capture(/\/(booking-rules|rack)(\?|$)/);
      const { user } = renderApp('/maintenance', 'qa.mt');
      const { start } = await newOrder(user);
      await waitFor(() => expect(start).toHaveValue(day));
      expect(start).toHaveAttribute('min', day);
      reads.stop();
      expect(reads.paths).toEqual([]);
    },
  );
});

describe('#6 A83 việc buồng phòng tạo tay – due = business day', () => {
  it.each(CLOCKS)('%s → due date %s', async (hhmm, day) => {
    at(hhmm);
    const { user } = renderApp('/housekeeping', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('hk.desk.new_task') }));
    const dlg = await screen.findByRole('dialog', { name: tv('hk.desk.new_task_title') });
    await waitFor(() => expect(within(dlg).getAllByRole('option').length).toBeGreaterThan(5));
    const due = within(dlg).getByLabelText(label('hk.desk.due_date'));
    await waitFor(() => expect(due).toHaveValue(day));
    expect(due).toHaveAttribute('min', day);
    await user.selectOptions(
      within(dlg).getByLabelText(label('booking.field.room')),
      room('102').id,
    );
    await user.click(within(dlg).getByRole('button', { name: tv('hk.desk.new_task') }));
    await waitFor(() =>
      expect(
        mockControl.ops.hkTasks.find((t) => t.roomNo === '102' && t.source === 'manual')?.dueDate,
      ).toBe(day),
    );
  });
});

describe('CI 39358556872 – no state update after unmount (jsdom teardown: "window is not defined")', () => {
  /** After unmount, run every pending timer with `window` gone, as after the Vitest jsdom teardown. */
  function flushWithoutWindow() {
    vi.stubGlobal('window', undefined);
    try {
      vi.runOnlyPendingTimers();
    } finally {
      vi.unstubAllGlobals();
    }
  }

  it('GuestPicker: the 150 ms blur timer dies with the picker', async () => {
    const { user, unmount } = renderApp('/rack', 'qa.fd');
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
    const dlg = await screen.findByRole('dialog', { name: /Đặt phòng mới/ });
    const picker = within(dlg).getByRole('combobox', { name: 'Khách đứng tên' });
    vi.useFakeTimers();
    fireEvent.focus(picker);
    fireEvent.blur(picker);
    unmount();
    expect(flushWithoutWindow).not.toThrow();
  });

  it('Toasts: the auto-hide timers die with the provider', async () => {
    // Fake timers from the start (the toast timer must be one of them); time still runs for the UI.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const r = res('Kim Seo-yeon');
    res('Nguyễn Văn An').status = 'cancelled';
    const { user, unmount } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.change_room') }));
    const dlg = await screen.findByRole('dialog', { name: /^Đổi phòng · Căn 402/ });
    await user.click(await within(dlg).findByRole('radio', { name: /^202/ }));
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Máy nước nóng hỏng');
    await user.click(
      within(dlg).getByRole('button', { name: tv('stay.change_submit', { room: '202' }) }),
    );
    expect(await screen.findByText(tv('stay.toast.moved', { room: '202' }))).toBeInTheDocument();
    unmount();
    expect(flushWithoutWindow).not.toThrow();
  });
});
