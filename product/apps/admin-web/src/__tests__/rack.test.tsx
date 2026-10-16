import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { layoutRow, packLanes } from '../pages/rack/rackModel';
import { renderApp, tv } from '../test/render';

const grid = () => screen.findByRole('grid', { name: /Sơ đồ phòng/ });
const cellNamed = (re: RegExp) =>
  screen.getAllByRole('gridcell').find((c) => re.test(c.getAttribute('aria-label') ?? ''))!;

describe('rack layout model', () => {
  it('bars span [from, to) clipped to the range; free nights are 1-day slots', () => {
    const from = '2026-10-13';
    const slots = layoutRow(
      [
        { kind: 'in_house', from: '2026-10-10', to: '2026-10-15' },
        { kind: 'confirmed', from: '2026-10-15', to: '2026-10-17' },
      ],
      from,
      5,
    );
    expect(slots.map((s) => [s.col, s.span, s.bar?.kind ?? '-', !!s.clippedStart])).toEqual([
      [0, 2, 'in_house', true],
      [2, 2, 'confirmed', false],
      [4, 1, '-', false],
    ]);
  });

  it('unassigned OTA bookings are packed into lanes without overlap', () => {
    const lanes = packLanes([
      { kind: 'confirmed', from: '2026-10-21', to: '2026-10-23' },
      { kind: 'confirmed', from: '2026-10-22', to: '2026-10-24' },
      { kind: 'confirmed', from: '2026-10-23', to: '2026-10-25' },
    ]);
    expect(lanes.map((l) => l.length)).toEqual([2, 1]);
  });
});

describe('H08 Sơ đồ phòng (US-016, US-019, US-139, US-017 AC5a)', () => {
  it('front desk: 10 rooms + "Chưa gán căn" lane, every bar has a full text label', async () => {
    renderApp('/rack', 'qa.fd');
    const g = await grid();
    // header row + 1 unassigned lane + 10 rooms
    expect(within(g).getAllByRole('row')).toHaveLength(12);
    expect(
      within(g).getByRole('rowheader', { name: /Chưa gán căn – xung đột OTA \(1\)/ }),
    ).toBeInTheDocument();
    expect(cellNamed(/Trần Thu Nga, Đang ở/)).toBeTruthy();
    expect(cellNamed(/Emma Laurent, Hợp đồng dài hạn.*Nhập tay/)).toBeTruthy();
    expect(cellNamed(/Gia đình anh Hưng.*Vượt định mức 1/)).toBeTruthy();
    expect(cellNamed(/Lê Minh, Giữ chỗ · chờ cọc.*còn \d+ giờ/)).toBeTruthy();
    expect(cellNamed(/Khóa · hỏng bình nóng lạnh/)).toBeTruthy();
    // Today column marked by the business date from the API (not computed by the client).
    expect(within(g).getByRole('columnheader', { name: /Hôm nay/ })).toBeInTheDocument();
    // US-139 AC1: red alert above the rack.
    expect(
      screen.getByText(
        tv('rack.conflict_title', { channel: 'Agoda', code: 'OTM-0160', guest: 'Hannah Schmidt' }),
      ),
    ).toBeInTheDocument();
  });

  it('keyboard: roving focus with arrows, Enter on a bar opens the booking drawer (AC3)', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    await grid();
    const bar = cellNamed(/Trần Thu Nga/);
    bar.focus();
    expect(bar).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).not.toBe(bar);
    expect(document.activeElement).toHaveAttribute('role', 'gridcell');
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(bar);
    await user.keyboard('{Enter}');
    const drawer = await screen.findByRole('dialog', { name: 'Trần Thu Nga' });
    expect(within(drawer).getByText('Đang ở')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(bar));
  });

  it('empty night from today → new booking form with room and arrival prefilled', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    await grid();
    const date = addDays(todayLocal(), 6);
    const cell = screen
      .getAllByRole('gridcell')
      .find(
        (c) =>
          /Bấm ô trống để đặt căn 201/.test(c.getAttribute('aria-label') ?? '') &&
          c.dataset.date === date,
      )!;
    await user.click(cell);
    const dlg = await screen.findByRole('dialog', { name: /Đặt phòng mới/ });
    await waitFor(() =>
      expect(within(dlg).getByLabelText(/^Căn/)).toHaveDisplayValue(/^201 · The Mist/),
    );
    expect(within(dlg).getByLabelText('Ngày đến')).toHaveValue(date);
  });

  it('table view = screen-reader alternative of the grid (and phone layout)', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    await grid();
    await user.click(screen.getByRole('button', { name: 'Danh sách' }));
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('rowheader')).toHaveLength(11);
    expect(
      within(table).getByRole('button', { name: /Sophie Martin · Đã xác nhận/ }),
    ).toBeInTheDocument();
  });

  it('housekeeping: masked list – room status, arrivals and kit, no guest names (AC4)', async () => {
    renderApp('/rack', 'qa.hk');
    const list = await screen.findByRole('list', { name: 'Các căn' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);
    expect(within(list).getAllByText('Có khách đến hôm nay').length).toBeGreaterThan(0);
    expect(within(list).getByText('Chuẩn bị 1 bộ đồ dùng thêm')).toBeInTheDocument();
    expect(screen.queryByText(/Trần Thu Nga|Gia đình anh Hưng/)).not.toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('OTA conflict lane → assign a free room (US-139 AC2), lane disappears after save', async () => {
    const { user } = renderApp('/rack', 'qa.fdl');
    await grid();
    await user.click(screen.getAllByRole('button', { name: 'Gán căn' })[0]!);
    const drawer = await screen.findByRole('dialog', { name: 'Hannah Schmidt' });
    expect(within(drawer).getByText('Xung đột OTA')).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Gán căn' }));
    const dlg = await screen.findByRole('dialog', { name: /Gán căn cho OTM-0160/ });
    const first = await within(dlg).findAllByRole('radio');
    expect(first[0]).toBeChecked();
    await user.click(within(dlg).getByRole('button', { name: /^Gán vào căn/ }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Gán căn cho/ })).not.toBeInTheDocument(),
    );
    expect(
      mockControl.rsv.reservations.find((r) => r.guestName === 'Hannah Schmidt')!.conflictState,
    ).toBe('resolved');
    await user.click(within(drawer).getByRole('button', { name: 'Đóng' }));
    await waitFor(() =>
      expect(screen.queryByRole('rowheader', { name: /Chưa gán căn/ })).not.toBeInTheDocument(),
    );
  });

  it('error state with Thử lại; offline locks empty nights (BR-906)', async () => {
    mockControl.failNext(/rack:GET/, 500, { code: 'INTERNAL_ERROR' });
    const { user } = renderApp('/rack', 'qa.fd');
    expect(await screen.findByText('Chưa tải được sơ đồ phòng')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await grid();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    fireEvent(window, new Event('offline'));
    await waitFor(() =>
      expect(
        screen
          .queryAllByRole('gridcell')
          .some((c) => /Bấm ô trống/.test(c.getAttribute('aria-label') ?? '')),
      ).toBe(false),
    );
    expect(screen.getByRole('button', { name: 'Đặt phòng mới' })).toBeDisabled();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    fireEvent(window, new Event('online'));
  });
});
