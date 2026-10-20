import { hasKey, loadLocale } from '@ottimo/i18n';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { businessDayLocal, todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { MINIBAR } from '../mocks/stay';
import { OPS_LABEL_KEYS } from '../pages/ops/opsLabels';
import { renderApp, tv } from '../test/render';

/**
 * Sprint 4 – FE-B item 5 (Desk on MSW 0.3.7): S10 housekeeping board (US-054 AC1/AC3), S11 work orders + room
 * blocks (US-061, US-062, US-019, US-135), the guest request queue on H03 (US-110), minibar catalogue (US-066).
 */
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string, args?: Record<string, string | number>) =>
  new RegExp(`^${esc(tv(key, args))}`);
const photo = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], 'sau-sua.jpg', { type: 'image/jpeg' });
const T = () => todayLocal();
/** The API's `ctx.today` (BR-010) – what the desk now defaults a block start to (BUG-R2-211). */
const B = () => businessDayLocal();
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const room = (no: string) => mockControl.db.rooms.find((r) => r.roomNo === no)!;
const taskRow = (text: RegExp | string) => screen.getByText(text).closest('li') as HTMLElement;

describe('S10 Buồng phòng – Desk (US-054 AC1, AC3)', () => {
  it('the desk sees the same tasks and x/y counter; ticking one done updates both', async () => {
    const { user } = renderApp('/housekeeping', 'qa.fd');
    expect(await screen.findByText(tv('hk.progress', { done: 1, total: 5 }))).toBeInTheDocument();
    const row = taskRow(tv('hk.type.checkout_clean'));
    expect(within(row).getByText('203')).toHaveClass('roomno');
    expect(within(row).getByText('The Sage')).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: tv('hk.task.complete') }));
    expect(await screen.findByText(tv('hk.progress', { done: 2, total: 5 }))).toBeInTheDocument();
    expect(mockControl.ops.hkTasks.find((t) => t.roomNo === '203')!.status).toBe('done');
    // Guest request task: chip "App khách" + the guest's note (US-054 AC2).
    const req = taskRow(tv('hk.type.guest_request'));
    expect(within(req).getByText(tv('hk.source.guest_app'))).toBeInTheDocument();
    expect(
      within(req).getByText(tv('hk.req_note', { note: 'Thêm 2 khăn tắm' })),
    ).toBeInTheDocument();
  });

  it('a check-out today makes "Dọn trả phòng" appear for that room (US-054 AC1)', async () => {
    const huy = res('Phạm Huy');
    huy.status = 'checked_out';
    (huy as { actualCheckoutAt?: string }).actualCheckoutAt = new Date().toISOString();
    renderApp('/housekeeping', 'qa.fd');
    await screen.findByText(tv('hk.progress', { done: 1, total: 6 }));
    const rows = screen.getAllByText(tv('hk.type.checkout_clean')).map((x) => x.closest('li')!);
    expect(rows.some((r) => within(r).queryByText('201'))).toBe(true);
  });

  it('cancel needs a reason; "other" needs a note (SM-14, 0.3.7 B-05)', async () => {
    const { user } = renderApp('/housekeeping', 'qa.fd');
    await screen.findByText(tv('hk.progress', { done: 1, total: 5 }));
    const row = taskRow(tv('hk.type.stayover_clean'));
    await user.click(within(row).getByRole('button', { name: tv('hk.desk.cancel') }));
    const dlg = await screen.findByRole('dialog');
    await user.click(within(dlg).getByRole('radio', { name: tv('hk.refuse.other') }));
    const save = within(dlg).getByRole('button', { name: tv('hk.desk.cancel') });
    expect(save).toBeDisabled();
    await user.type(within(dlg).getByLabelText(label('stay.note')), 'Khách ra ngoài cả ngày');
    await user.click(save);
    await waitFor(() =>
      expect(mockControl.ops.hkTasks.find((t) => t.roomNo === '101')!.status).toBe('cancelled'),
    );
    expect(mockControl.ops.hkTasks.find((t) => t.roomNo === '101')!.cancelNote).toBe(
      'Khách ra ngoài cả ngày',
    );
  });

  it('the desk adds a task by hand (A83-create)', async () => {
    const { user } = renderApp('/housekeeping', 'qa.fd');
    await screen.findByText(tv('hk.progress', { done: 1, total: 5 }));
    await user.click(screen.getByRole('button', { name: tv('hk.desk.new_task') }));
    const dlg = await screen.findByRole('dialog', { name: tv('hk.desk.new_task_title') });
    await waitFor(() => expect(within(dlg).getAllByRole('option').length).toBeGreaterThan(5));
    await user.selectOptions(
      within(dlg).getByLabelText(label('booking.field.room')),
      room('102').id,
    );
    await user.click(within(dlg).getByRole('button', { name: tv('hk.desk.new_task') }));
    expect(await screen.findByText(tv('hk.progress', { done: 1, total: 6 }))).toBeInTheDocument();
    expect(mockControl.ops.hkTasks.some((t) => t.roomNo === '102' && t.source === 'manual')).toBe(
      true,
    );
  });
});

describe('S11 Bảo trì – work orders + blocks (US-061, US-062, US-019, US-135)', () => {
  async function newOrder(user: ReturnType<typeof renderApp>['user'], no: string, title: string) {
    await user.click(await screen.findByRole('button', { name: tv('wo.new_title') }));
    const dlg = await screen.findByRole('dialog', { name: tv('wo.new_title') });
    await waitFor(() => expect(within(dlg).getAllByRole('option').length).toBeGreaterThan(8));
    await user.selectOptions(within(dlg).getByLabelText(label('hk.wo.room')), room(no).id);
    await user.type(within(dlg).getByLabelText(label('wo.title_label')), title);
    return dlg;
  }

  it('AC1: work order + block → the block closes the nights, the reopening date comes back', async () => {
    const { user } = renderApp('/maintenance', 'qa.fd');
    const dlg = await newOrder(user, '203', 'Thay vòi nước bếp');
    await user.type(within(dlg).getByLabelText(label('hk.wo.desc')), 'Vòi rỉ nước liên tục');
    await user.click(within(dlg).getByRole('switch', { name: tv('hk.lock_request') }));
    expect(within(dlg).getByText(tv('wo.block_reopen_note'))).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText(label('wo.block_done_planned')), {
      target: { value: addDays(B(), 1) },
    });
    await user.click(within(dlg).getByRole('button', { name: tv('wo.create_and_block') }));
    await waitFor(() =>
      expect(mockControl.rsv.blocks.some((b) => b.roomId === room('203').id)).toBe(true),
    );
    const b = mockControl.rsv.blocks.find((x) => x.roomId === room('203').id)!;
    expect([b.from, b.to]).toEqual([B(), addDays(B(), 2)]); // half-open: reopen = done + 1 day
    expect(mockControl.ops.workOrders[0]!.title).toBe('Thay vòi nước bếp');
  });

  it('AC4: no description → not saved, the field says why', async () => {
    const { user } = renderApp('/maintenance', 'qa.fd');
    const dlg = await newOrder(user, '203', 'Bóng đèn');
    const before = mockControl.ops.workOrders.length;
    await user.click(within(dlg).getByRole('button', { name: tv('wo.create') }));
    await waitFor(() =>
      expect(within(dlg).getByLabelText(label('hk.wo.desc'))).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
    expect(mockControl.ops.workOrders.length).toBe(before);
  });

  it('AC3: guest in house → no block, move the guest first; "Tạo phiếu không khóa" still creates the order', async () => {
    const { user } = renderApp('/maintenance', 'qa.fd');
    const dlg = await newOrder(user, '101', 'Vòi sen');
    await user.type(within(dlg).getByLabelText(label('hk.wo.desc')), 'Nước yếu');
    await user.click(within(dlg).getByRole('switch', { name: tv('hk.lock_request') }));
    await user.click(within(dlg).getByRole('button', { name: tv('wo.create_and_block') }));
    expect(await within(dlg).findByText(tv('wo.block_occupied_title'))).toBeInTheDocument();
    expect(within(dlg).getByText(res('Trần Thu Nga').code)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('wo.create_without_block') }));
    await waitFor(() => expect(mockControl.ops.workOrders[0]!.title).toBe('Vòi sen'));
    expect(mockControl.rsv.blocks.some((b) => b.roomId === room('101').id)).toBe(false);
  });

  it('AC2: future bookings in the range → listed with a link each, never saved', async () => {
    const { user } = renderApp('/maintenance', 'qa.fd');
    const dlg = await newOrder(user, '302', 'Sơn lại tường');
    await user.type(within(dlg).getByLabelText(label('hk.wo.desc')), 'Tường bong sơn');
    await user.click(within(dlg).getByRole('switch', { name: tv('hk.lock_request') }));
    await user.click(within(dlg).getByRole('button', { name: tv('wo.create_and_block') }));
    expect(
      await within(dlg).findByText(label('wo.block_conflict_title', { n: 1 })),
    ).toBeInTheDocument();
    const link = within(dlg).getByRole('link', { name: new RegExp(res('Gia đình anh Hưng').code) });
    expect(link).toHaveAttribute('href', `/reservations?q=${res('Gia đình anh Hưng').code}`);
  });

  it('US-062 AC1 + US-135: "Sửa xong" with a block shows the consequences, then reopens the room', async () => {
    const { user } = renderApp('/maintenance', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'WO-00034' }));
    const drawer = await screen.findByRole('dialog', { name: /WO-00034/ });
    expect(
      within(drawer).getByText(tv('wo.log.created', { who: 'Bích' }), { exact: false }),
    ).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: tv('wo.action.done') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('wo.done_title', { code: 'WO-00034' }),
    });
    await user.type(within(dlg).getByLabelText(label('wo.result')), 'Đã thay bình mới');
    const go = within(dlg).getByRole('button', { name: tv('wo.done_confirm') });
    expect(go).toBeDisabled(); // high severity → photo after the repair required (DOM D-15)
    await user.upload(within(dlg).getByLabelText(label('wo.photos_after')), photo());
    await user.click(go);
    const box = await screen.findByRole('alertdialog');
    expect(
      within(box).getByText(tv('wo.done_effect_unblock', { room: '401 · The Pine' })),
    ).toBeInTheDocument();
    expect(within(box).getByText(tv('wo.done_effect_task'))).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: tv('confirm.keep') })).toHaveFocus();
    await user.click(within(box).getByRole('button', { name: tv('wo.done_confirm') }));
    await waitFor(() =>
      expect(mockControl.ops.workOrders.find((w) => w.code === 'WO-00034')!.status).toBe('done'),
    );
    expect(mockControl.stay.roomStatus['401']).toBe('VD');
    expect(
      mockControl.ops.hkTasks.some((t) => t.roomNo === '401' && t.type === 'after_repair_clean'),
    ).toBe(true);
    const block = mockControl.rsv.blocks.find((b) => b.roomId === room('401').id)!;
    expect(block.to).toBe(addDays(T(), 1));
  });

  it('US-062 AC2: only SM-04 moves – accept, then waiting for parts needs the parts and a date (medium)', async () => {
    const { user } = renderApp('/maintenance', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'WO-00035' }));
    let drawer = await screen.findByRole('dialog', { name: /WO-00035/ });
    expect(
      within(drawer).queryByRole('button', { name: tv('wo.action.done') }),
    ).not.toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: tv('wo.action.start') }));
    await waitFor(() =>
      expect(mockControl.ops.workOrders.find((w) => w.code === 'WO-00035')!.status).toBe(
        'in_progress',
      ),
    );
    drawer = await screen.findByRole('dialog', { name: /WO-00035/ });
    await user.click(
      await within(drawer).findByRole('button', { name: tv('wo.action.wait_parts') }),
    );
    const dlg = await screen.findByRole('dialog', {
      name: tv('wo.wait_title', { code: 'WO-00035' }),
    });
    await user.type(within(dlg).getByLabelText(label('wo.parts_note')), 'Bộ trộn sen');
    const save = within(dlg).getByRole('button', { name: tv('wo.action.wait_parts_save') });
    expect(save).toBeDisabled();
    fireEvent.change(within(dlg).getByLabelText(label('wo.parts_date')), {
      target: { value: addDays(T(), 2) },
    });
    await user.click(save);
    await waitFor(() =>
      expect(mockControl.ops.workOrders.find((w) => w.code === 'WO-00035')!.status).toBe(
        'waiting_parts',
      ),
    );
  });

  it('HK block request → "Khóa phòng theo đề nghị" creates the block and clears the request', async () => {
    const { user } = renderApp('/maintenance', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'WO-00036' }));
    const drawer = await screen.findByRole('dialog', { name: /WO-00036/ });
    expect(within(drawer).getByText(tv('wo.chip.block_requested'))).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: tv('wo.block_by_request') }));
    const dlg = await screen.findByRole('dialog', { name: tv('wo.block_by_request') });
    // 202 has a booking from tomorrow (Nguyễn Văn An) – block tonight only: done today → reopen tomorrow.
    fireEvent.change(within(dlg).getByLabelText(label('wo.block_done_planned')), {
      target: { value: T() },
    });
    await user.click(within(dlg).getByRole('button', { name: tv('wo.block_by_request') }));
    await waitFor(() =>
      expect(mockControl.ops.workOrders.find((w) => w.code === 'WO-00036')!.blockRequested).toBe(
        false,
      ),
    );
    expect(mockControl.rsv.blocks.some((b) => b.roomId === room('202').id)).toBe(true);
  });

  it('US-019: planned block → listed with nights + reopening date → cancelled with a reason', async () => {
    const { user } = renderApp('/maintenance', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('ooo.new') }));
    const dlg = await screen.findByRole('dialog', { name: tv('ooo.new') });
    await waitFor(() => expect(within(dlg).getAllByRole('option').length).toBeGreaterThan(8));
    await user.selectOptions(within(dlg).getByLabelText(label('hk.wo.room')), room('102').id);
    fireEvent.change(within(dlg).getByLabelText(label('wo.block_from')), {
      target: { value: addDays(T(), 60) },
    });
    fireEvent.change(within(dlg).getByLabelText(label('wo.block_done_planned')), {
      target: { value: addDays(T(), 61) },
    });
    await user.type(within(dlg).getByLabelText(label('wo.block_reason')), 'Bảo dưỡng máy lạnh');
    // 102 is a long stay until +50 – start at +60 → no clash.
    await user.click(within(dlg).getByRole('button', { name: tv('ooo.new') }));
    await screen.findByRole('cell', { name: 'Bảo dưỡng máy lạnh' });
    const row = screen.getByRole('cell', { name: 'Bảo dưỡng máy lạnh' }).closest('tr')!;
    expect(within(row).getByText(tv('ooo.status.planned'))).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: tv('ooo.cancel') }));
    const box = await screen.findByRole('alertdialog');
    await user.type(within(box).getByLabelText(label('ci.reason')), 'Đổi lịch bảo dưỡng');
    await user.click(within(box).getByRole('button', { name: tv('ooo.cancel') }));
    await waitFor(() =>
      expect(within(row).getByText(tv('ooo.status.cancelled'))).toBeInTheDocument(),
    );
  });
});

describe('H03 – guest request queue (US-110, S30)', () => {
  it('not picked up in time first; acknowledge; decline "other" needs a message; digits are refused', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    const card = await screen.findByRole('region', { name: `${tv('today.requests')} (3)` });
    const first = within(card).getAllByRole('listitem')[0]!;
    expect(within(first).getByText(tv('req.desk.overdue'))).toBeInTheDocument();
    expect(within(first).getByText(tv('guest.req.transport'))).toBeInTheDocument();
    expect(
      within(first).getByText(
        new RegExp(esc(tv('req.desk.routed', { dept: tv('role.front_desk') }))),
      ),
    ).toBeInTheDocument();
    await user.click(within(first).getByRole('button', { name: tv('today.req_ack') }));
    await waitFor(() =>
      expect(mockControl.ops.requests.find((r) => r.roomNo === '201')!.status).toBe('acknowledged'),
    );
    const row = (await within(card).findByText(tv('guest.req.transport'))).closest('li')!;
    await user.click(within(row).getByRole('button', { name: tv('guest.req.status.declined') }));
    const dlg = await screen.findByRole('dialog');
    await user.click(within(dlg).getByRole('radio', { name: tv('guest.req.decline.other') }));
    const save = within(dlg).getByRole('button', { name: tv('guest.req.status.declined') });
    expect(save).toBeDisabled();
    await user.type(within(dlg).getByLabelText(label('req.desk.reply')), 'Gọi 0905123456 nhé');
    await user.click(save);
    expect(await within(dlg).findByRole('alert')).toBeInTheDocument();
    expect(mockControl.ops.requests.find((r) => r.roomNo === '201')!.status).toBe('acknowledged');
    await user.clear(within(dlg).getByLabelText(label('req.desk.reply')));
    await user.type(
      within(dlg).getByLabelText(label('req.desk.reply')),
      'Xe kín chỗ, lễ tân gọi lại cho bạn',
    );
    await user.click(save);
    await waitFor(() =>
      expect(mockControl.ops.requests.find((r) => r.roomNo === '201')!.status).toBe('declined'),
    );
  });
});

describe('S13 Danh mục minibar (US-066, US-003 AC2)', () => {
  it('owner edits a price – the next minibar check uses it (AC2); free items are not charged (AC1)', async () => {
    const { user } = renderApp('/settings/minibar', 'qa.owner');
    const beer = (await screen.findByRole('cell', { name: 'Bia Đà Lạt' })).closest('tr')!;
    expect(within(beer).getByText('14.000')).toBeInTheDocument(); // cost price – OWN/MGR only
    await user.click(within(beer).getByRole('button', { name: tv('rooms.edit') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('mb.edit_title', { name: 'Bia Đà Lạt' }),
    });
    expect(within(dlg).getByText(tv('mb.price_note'))).toBeInTheDocument();
    const price = within(dlg).getByLabelText(label('mb.col.sale'));
    await user.clear(price);
    await user.type(price, '40000');
    await user.click(within(dlg).getByRole('button', { name: tv('common.save') }));
    await waitFor(() =>
      expect(MINIBAR.find((m) => m.itemName === 'Bia Đà Lạt')!.unitPriceVnd).toBe(40_000),
    );
    await user.click(screen.getByRole('button', { name: tv('mb.add') }));
    const add = await screen.findByRole('dialog', { name: tv('mb.add_title') });
    await user.type(within(add).getByLabelText(label('mb.col.code')), 'tra-xanh');
    await user.type(within(add).getByLabelText(label('mb.col.unit')), 'chai');
    await user.type(within(add).getByLabelText(label('mb.name_vi')), 'Trà xanh');
    await user.click(within(add).getByRole('switch', { name: tv('mb.free_toggle') }));
    await user.click(within(add).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(MINIBAR.find((m) => m.itemName === 'Trà xanh')?.isFree).toBe(true));
  });

  it('front desk reads only – no cost price, no edit (AC3, US-003 AC2)', async () => {
    renderApp('/settings/minibar', 'qa.fd');
    await screen.findByRole('cell', { name: 'Bia Đà Lạt' });
    expect(screen.getByText(tv('mb.readonly'))).toBeInTheDocument();
    expect(screen.queryByText(tv('mb.col.cost'))).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('rooms.edit') })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('mb.add') })).not.toBeInTheDocument();
  });
});

describe('ops labels', () => {
  it('every key the Desk maps can produce exists in VI and EN', async () => {
    await loadLocale('en');
    for (const k of OPS_LABEL_KEYS) {
      expect(hasKey(k, 'vi'), k).toBe(true);
      expect(hasKey(k, 'en'), k).toBe(true);
    }
  });
});
