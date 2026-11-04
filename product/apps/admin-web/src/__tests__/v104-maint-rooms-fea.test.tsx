// v1.0.4 P4-33 (FE-A): BUG-R3-053 – an account with only the Bảo trì role picks the room on the Desk for "Phiếu sửa
// mới" and "Khóa phòng có kế hoạch". ARC plan-v1.0.4 6.5: the rooms come from `room-statuses` (as in the staff app);
// `listRooms` stays closed to `maintenance`, no contract change, no `rbac-cases.json` change.
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
const room = (no: string) => mockControl.db.rooms.find((r) => r.roomNo === no)!;

/** Paths asked while a test runs. */
function watch() {
  const seen: string[] = [];
  const on = ({ request }: { request: Request }) => seen.push(new URL(request.url).pathname);
  server.events.on('request:start', on);
  stops.push(() => server.events.removeListener('request:start', on));
  return seen;
}
let stops: Array<() => void> = [];
afterEach(() => {
  stops.forEach((s) => s());
  stops = [];
});

describe('BUG-R3-053 – maintenance-only account on the Desk', () => {
  it('"Phiếu sửa mới": the room list is full (from room-statuses) and a work order is created; no listRooms call', async () => {
    const seen = watch();
    const { user } = renderApp('/maintenance', 'qa.mt');
    await user.click(await screen.findByRole('button', { name: tv('wo.new_title') }));
    const dlg = await screen.findByRole('dialog', { name: tv('wo.new_title') });
    const select = within(dlg).getByLabelText(label('hk.wo.room'));
    await waitFor(() =>
      expect(within(select).getAllByRole('option').length).toBe(mockControl.db.rooms.length + 1),
    );
    // Staff label "101 · name" like everywhere else on the Desk, sorted by room number.
    const options = within(select)
      .getAllByRole('option')
      .slice(1)
      .map((o) => o.textContent ?? '');
    expect(options).toEqual([...options].sort((a, b) => a.localeCompare(b)));
    expect(options[0]).toMatch(/^\d{3}/);

    await user.selectOptions(select, room('203').id);
    await user.type(within(dlg).getByLabelText(label('wo.title_label')), 'Thay bóng đèn');
    await user.type(within(dlg).getByLabelText(label('hk.wo.desc')), 'Đèn trần chập chờn');
    const before = mockControl.ops.workOrders.length;
    await user.click(within(dlg).getByRole('button', { name: tv('wo.create') }));
    await waitFor(() => expect(mockControl.ops.workOrders.length).toBe(before + 1));
    expect(mockControl.ops.workOrders.some((w) => w.roomId === room('203').id)).toBe(true);
    expect(seen.some((p) => p.endsWith('/rooms'))).toBe(false);
    expect(seen.some((p) => p.endsWith('/room-statuses'))).toBe(true);
  });

  it('"Khóa phòng có kế hoạch": the room list is full and the block is saved', async () => {
    const { user } = renderApp('/maintenance', 'qa.mt');
    await user.click(await screen.findByRole('button', { name: tv('ooo.new') }));
    const dlg = await screen.findByRole('dialog', { name: tv('ooo.new') });
    const select = within(dlg).getByLabelText(label('hk.wo.room'));
    await waitFor(() =>
      expect(within(select).getAllByRole('option').length).toBe(mockControl.db.rooms.length + 1),
    );
    await user.selectOptions(select, room('203').id);
    const reason = within(dlg).queryByLabelText(label('wo.block_reason'));
    if (reason) await user.type(reason, 'Sơn lại tường');
    await user.click(within(dlg).getByRole('button', { name: tv('ooo.new') }));
    await waitFor(() =>
      expect(mockControl.rsv.blocks.some((b) => b.roomId === room('203').id)).toBe(true),
    );
  });

  it('front desk keeps reading listRooms (catalog path unchanged)', async () => {
    const seen = watch();
    const { user } = renderApp('/maintenance', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('wo.new_title') }));
    const dlg = await screen.findByRole('dialog', { name: tv('wo.new_title') });
    const select = within(dlg).getByLabelText(label('hk.wo.room'));
    await waitFor(() =>
      expect(within(select).getAllByRole('option').length).toBe(mockControl.db.rooms.length + 1),
    );
    expect(seen.some((p) => p.endsWith('/rooms'))).toBe(true);
  });
});
