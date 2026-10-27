import { formatLocalDate } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { businessDayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/**
 * v1.0.1 BUG-R3-018 phần 1 (OpenAPI 0.3.9; UXD v1.0.1-early-departure-and-prices.md §3): the room drawer lists
 * `Room.scheduledListPrices` (OWN/MGR), cancels one with `cancelScheduledRoomListPrice` (If-Match = Room.version,
 * Idempotency-Key), and picking an effective date fills the prices from the row in force on that date.
 */

const today = () => businessDayLocal();
const roomOf = (no: string) => mockControl.db.rooms.find((r) => r.roomNo === no)!;
const M = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const D = (d: string) => formatLocalDate(d);

function schedule(
  no: string,
  effectiveFrom: string,
  monthly: number,
  nightly: number,
  reason = 'Giá mùa cao điểm',
) {
  mockControl.db.scheduledListPrices.push({
    roomId: roomOf(no).id,
    effectiveFrom,
    monthlyListPriceVnd: monthly,
    nightlyListPriceVnd: nightly,
    reason,
    changedBy: 'Chủ đầu tư',
    changedAt: '2026-10-26T09:00:00+07:00',
  });
}

interface Sent {
  method: string;
  path: string;
  body: Record<string, unknown>;
  ifMatch: string | null;
  key: string | null;
}
function captureRoomWrites() {
  const sent: Sent[] = [];
  const on = ({ request }: { request: Request }) => {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' || !/\/rooms\//.test(path)) return;
    const ifMatch = request.headers.get('if-match');
    const key = request.headers.get('idempotency-key');
    void request
      .clone()
      .json()
      .then((body: Record<string, unknown>) =>
        sent.push({ method: request.method, path, body, ifMatch, key }),
      );
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

async function openRoom(user: ReturnType<typeof renderApp>['user'], no: string) {
  await user.click(await screen.findByRole('button', { name: `Sửa ${no}` }));
  return screen.findByRole('dialog', { name: new RegExp(`Sửa căn ${no}`) });
}
const cancelBtn = (dlg: HTMLElement, d: string) =>
  within(dlg).getByRole('button', { name: tv('rooms.cancel_scheduled_label', { date: D(d) }) });
const list = (dlg: HTMLElement) =>
  within(dlg).getByRole('list', { name: tv('rooms.scheduled_title') });

async function askCancel(user: ReturnType<typeof renderApp>['user'], dlg: HTMLElement, d: string) {
  await user.click(cancelBtn(dlg, d));
  const ask = await screen.findByRole('alertdialog', {
    name: tv('rooms.cancel_sched_title', { date: D(d), room: '101' }),
  });
  return ask;
}
const reasonBox = (ask: HTMLElement) =>
  within(ask).getByLabelText(new RegExp(tv('rooms.cancel_sched_reason')));
const confirmCancel = (ask: HTMLElement) =>
  within(ask).getByRole('button', { name: tv('rooms.cancel_sched_confirm') });

describe('v1.0.1 giá đã lên lịch trên ngăn kéo căn (BUG-R3-018 phần 1, OpenAPI 0.3.9, UXD §3)', () => {
  it('owner sees "current since" and each scheduled row: date, both prices, why, who; empty → says so', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const ul = list(dlg);
    expect(within(ul).getByText(/^Đang dùng từ /)).toBeInTheDocument();
    expect(
      within(ul).getByText(
        tv('rooms.scheduled_prices', { night: M(667_000), month: M(8_000_000) }),
      ),
    ).toBeInTheDocument();
    expect(within(ul).getByText(tv('rooms.scheduled_from', { date: D(D1) }))).toBeInTheDocument();
    expect(
      within(ul).getByText(
        tv('rooms.scheduled_prices', { night: M(700_000), month: M(9_000_000) }),
      ),
    ).toBeInTheDocument();
    expect(
      within(ul).getByText(tv('rooms.scheduled_reason', { reason: 'Giá mùa cao điểm' })),
    ).toBeInTheDocument();
    expect(within(ul).getByText(/^Chủ đầu tư lên lịch lúc 26\/10 09:00$/)).toBeInTheDocument();
    // The current row has no cancel button; the scheduled one has its own named button.
    expect(within(ul).getAllByRole('button')).toHaveLength(1);
    expect(cancelBtn(dlg, D1)).toHaveTextContent(tv('rooms.cancel_scheduled'));
    await user.click(within(dlg).getByRole('button', { name: 'Hủy' }));
    const dlg2 = await openRoom(user, '102');
    expect(within(dlg2).getByText(tv('rooms.scheduled_empty'))).toBeInTheDocument();
  });

  it('manager sees the list too; the table shows the next scheduled price (UXD §3.6)', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    schedule('101', addDays(today(), 9), 9_500_000, 750_000);
    const { user } = renderApp('/settings/rooms', 'qa.mgr');
    const row = (await screen.findByText('The Amber')).closest('tr')!;
    expect(
      within(row).getByText(
        `${tv('rooms.next_price', { date: D(D1).slice(0, 5), amount: M(700_000) })} ${tv('rooms.next_price_more', { n: 1 })}`,
      ),
    ).toBeInTheDocument();
    const dlg = await openRoom(user, '101');
    expect(list(dlg)).toBeInTheDocument();
  });

  it('API: front desk lead / front desk / sales get no scheduledListPrices (x-visible-to owner, manager)', async () => {
    schedule('101', addDays(today(), 3), 9_000_000, 700_000);
    for (const who of ['qa.fdl', 'qa.fd', 'qa.sal']) {
      mockControl.signInAs(who);
      const body = (await (await fetch('http://localhost/v1/properties/p/rooms')).json()) as {
        data: Array<Record<string, unknown>>;
      };
      expect(body.data[0]).not.toHaveProperty('scheduledListPrices');
    }
  });

  it('field absent (other role / 0.3.8 server) → the whole section is hidden', async () => {
    server.use(
      http.get('*/v1/properties/:propertyId/rooms', () =>
        HttpResponse.json({ data: mockControl.db.rooms.map((r) => ({ ...r })) }),
      ),
    );
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    expect(within(dlg).queryByText(tv('rooms.scheduled_title'))).toBeNull();
    expect(within(dlg).queryByText(tv('rooms.scheduled_empty'))).toBeNull();
  });

  it('a room whose only price is scheduled: no cancel button, the note says how to change it (UXD D9)', async () => {
    const D1 = addDays(today(), 2);
    delete (roomOf('101') as { currentListPrice?: unknown }).currentListPrice;
    schedule('101', D1, 9_000_000, 700_000);
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    expect(within(dlg).getByText(tv('rooms.only_price_note', { date: D(D1) }))).toBeInTheDocument();
    expect(within(list(dlg)).queryAllByRole('button')).toHaveLength(0);
  });

  it('cancel: reason required, If-Match = Room.version + key; body says the price used again and the next date', async () => {
    const D1 = addDays(today(), 3);
    const D2 = addDays(today(), 10);
    schedule('101', D1, 9_000_000, 700_000);
    schedule('101', D2, 9_500_000, 750_000);
    const cap = captureRoomWrites();
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');

    // D2 is the last row → back to the D1 row.
    let ask = await askCancel(user, dlg, D2);
    expect(ask).toHaveTextContent(
      tv('rooms.cancel_sched_body', {
        date: D(D2),
        room: '101',
        night: M(700_000),
        month: M(9_000_000),
      }),
    );
    await user.click(within(ask).getByRole('button', { name: tv('rooms.cancel_sched_keep') }));

    // D1 → back to today's price until D2.
    ask = await askCancel(user, dlg, D1);
    expect(ask).toHaveTextContent(
      tv('rooms.cancel_sched_body_until', {
        date: D(D1),
        next: D(D2),
        room: '101',
        night: M(667_000),
        month: M(8_000_000),
      }),
    );
    expect(confirmCancel(ask)).toBeDisabled();
    expect(confirmCancel(ask)).toHaveAccessibleDescription(tv('rooms.cancel_sched_needs_reason'));
    await user.type(reasonBox(ask), 'Nhập nhầm');
    await user.click(confirmCancel(ask));
    expect(
      await screen.findByText(tv('rooms.cancel_sched_done', { date: D(D1), room: '101' })),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('rooms.scheduled_from', { date: D(D1) }))).toBeNull();
    expect(within(dlg).getByText(tv('rooms.scheduled_from', { date: D(D2) }))).toBeInTheDocument();
    expect(mockControl.db.scheduledListPrices.map((x) => x.effectiveFrom)).toEqual([D2]);
    // FB-R3-UXD-FE-A-09: focus goes to the next row's cancel button.
    await waitFor(() => expect(cancelBtn(dlg, D2)).toHaveFocus());

    // The drawer now writes with the new version (no 412 after its own cancel).
    await user.type(within(dlg).getByLabelText('Tên căn'), ' II');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByText(tv('rooms.saved', { room: '101' }))).toBeInTheDocument();
    await waitFor(() => expect(cap.sent).toHaveLength(2));
    cap.stop();
    expect(cap.sent[0]).toMatchObject({
      method: 'POST',
      path: expect.stringMatching(/\/rooms\/[^/]+\/list-prices\/actions\/cancel-scheduled$/),
      body: { effectiveFrom: D1, reason: 'Nhập nhầm' },
      ifMatch: '"1"',
    });
    expect(cap.sent[0]!.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(cap.sent[1]).toMatchObject({ method: 'PATCH', ifMatch: '"2"' });
  });

  it('404 (someone else cancelled it) → box closes, soft notice in the section, list read again', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const ask = await askCancel(user, dlg, D1);
    await user.type(reasonBox(ask), 'Nhập nhầm');
    mockControl.db.scheduledListPrices.length = 0;
    await user.click(confirmCancel(ask));
    expect(
      await within(dlg).findByText(tv('rooms.cancel_sched_gone', { date: D(D1) })),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(await within(dlg).findByText(tv('rooms.scheduled_empty'))).toBeInTheDocument();
  });

  it('409 effective → said in the box, which only offers "Đóng"; the room is read again', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    mockControl.failNext(/cancel-scheduled:POST/, 409, {
      code: 'INVALID_TRANSITION',
      currentState: 'effective',
    });
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const ask = await askCancel(user, dlg, D1);
    await user.type(reasonBox(ask), 'Nhập nhầm');
    await user.click(confirmCancel(ask));
    expect(
      await within(ask).findByText(tv('rooms.cancel_sched_effective', { date: D(D1) })),
    ).toBeInTheDocument();
    expect(confirmCancel(ask)).toBeDisabled();
    await user.click(within(ask).getByRole('button', { name: tv('common.close') }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('409 only_price → said in the box', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    mockControl.failNext(/cancel-scheduled:POST/, 409, {
      code: 'INVALID_TRANSITION',
      currentState: 'only_price',
    });
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const ask = await askCancel(user, dlg, D1);
    await user.type(reasonBox(ask), 'Nhập nhầm');
    await user.click(confirmCancel(ask));
    expect(
      await within(ask).findByText(tv('rooms.cancel_sched_only', { date: D(D1) })),
    ).toBeInTheDocument();
  });

  it('412 → said in the box, room read again, reason kept, the retry uses the new version', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    const cap = captureRoomWrites();
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    roomOf('101').version = 5; // another owner/manager saved the room
    const ask = await askCancel(user, dlg, D1);
    await user.type(reasonBox(ask), 'Nhập nhầm');
    await user.click(confirmCancel(ask));
    expect(await within(ask).findByText(tv('error.VERSION_CONFLICT'))).toBeInTheDocument();
    expect(reasonBox(ask)).toHaveValue('Nhập nhầm');
    await waitFor(() => expect(confirmCancel(ask)).toBeEnabled());
    await user.click(confirmCancel(ask));
    expect(await within(dlg).findByText(tv('rooms.scheduled_empty'))).toBeInTheDocument();
    cap.stop();
    expect(cap.sent.map((s) => s.ifMatch)).toEqual(['"1"', '"5"']);
  });

  it('picking a date fills BOTH prices from the row in force on it; a box typed in keeps its figure', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    const cap = captureRoomWrites();
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const monthly = within(dlg).getByLabelText('Giá tháng');
    const nightly = within(dlg).getByLabelText(/Giá đêm niêm yết/);
    await user.clear(nightly);
    await user.type(nightly, '650000');
    const from = within(dlg).getByLabelText(/Hiệu lực từ/);

    // After D1 (no row that day): the D1 row is in force → the untouched monthly box takes its price.
    await user.clear(from);
    await user.type(from, addDays(D1, 2));
    expect(monthly).toHaveValue('9.000.000');
    expect(nightly).toHaveValue('650.000');
    expect(from).toHaveAccessibleDescription(
      tv('rooms.price_for_date', { date: D(addDays(D1, 2)) }),
    );

    // Today again → today's monthly price.
    await user.clear(from);
    await user.type(from, today());
    expect(monthly).toHaveValue('8.000.000');

    // D1 itself: both prices of that row are replaced – said before saving.
    await user.clear(from);
    await user.type(from, D1);
    expect(monthly).toHaveValue('9.000.000');
    expect(from).toHaveAccessibleDescription(
      tv('rooms.price_replace_scheduled', { date: D(D1), night: M(700_000), month: M(9_000_000) }),
    );
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Giá đêm mùa thấp');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(
      await screen.findByText(tv('rooms.saved_scheduled', { room: '101', date: D(D1) })),
    ).toBeInTheDocument();
    await waitFor(() => expect(cap.sent).toHaveLength(1));
    cap.stop();
    expect(cap.sent[0]!.body.listPrice).toEqual({
      effectiveFrom: D1,
      monthlyListPriceVnd: 9_000_000,
      nightlyListPriceVnd: 650_000,
      reason: 'Giá đêm mùa thấp',
    });
  });

  it('prices equal to the row in force on the date → nothing to save, the reason sits by the button', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const nightly = within(dlg).getByLabelText(/Giá đêm niêm yết/);
    await user.clear(nightly);
    await user.type(nightly, '700000');
    const from = within(dlg).getByLabelText(/Hiệu lực từ/);
    await user.clear(from);
    await user.type(from, D1);
    expect(within(dlg).getByLabelText('Giá tháng')).toHaveValue('9.000.000');
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Thử');
    const save = within(dlg).getByRole('button', { name: 'Lưu' });
    expect(save).toBeDisabled();
    expect(save).toHaveAccessibleDescription(tv('rooms.price_unchanged', { date: D(D1) }));
  });

  it('cancelling the last scheduled row puts focus on the section title (FB-R3-UXD-FE-A-09)', async () => {
    const D1 = addDays(today(), 3);
    schedule('101', D1, 9_000_000, 700_000);
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const ask = await askCancel(user, dlg, D1);
    await user.type(reasonBox(ask), 'Nhập nhầm');
    await user.click(confirmCancel(ask));
    await within(dlg).findByText(tv('rooms.scheduled_empty'));
    await waitFor(() =>
      expect(within(dlg).getByRole('heading', { name: tv('rooms.scheduled_title') })).toHaveFocus(),
    );
  });
});
