// V5-15 – nút "Cần dọn" trên Desk (S10 Buồng phòng → Trạng thái buồng). Không đổi hợp đồng (ARC 0.3.13 mục 1.4):
// `transitionRoomStatus` `event = needs_cleaning` (R8, OC → OD, FD+ và HK). Nút chỉ hiện khi máy chủ trả
// `needs_cleaning` trong `RoomStatusEntry.allowedEvents`; `expectedFrom` = trạng thái đang hiện; 409
// INVALID_TRANSITION (căn đã đổi) → Desk tải lại danh sách và báo bằng câu UXD `error.INVALID_TRANSITION_generic_reloaded`
// (copy-v1.0.5 mục 4.12). MSW `mocks/ops.ts` giữ đúng luật máy chủ (`rules.ts` allowedEvents / roomTarget, R8a tạo việc
// dọn ở lại).
import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const room = (no: string) => mockControl.db.rooms.find((r) => r.roomNo === no)!;

/** The row of room `no` on the "Trạng thái buồng" board. */
async function roomRow(no: string): Promise<HTMLElement> {
  const board = await screen.findByRole('region', { name: tv('hk.desk.rooms') });
  const cell = await within(board).findByText(no, { selector: '.roomno' });
  return cell.closest('li') as HTMLElement;
}

function captureTransitions() {
  const sent: Array<{ url: string; body: Record<string, unknown>; key: string | null }> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'POST' || !/\/status-transitions$/.test(new URL(request.url).pathname))
      return;
    const key = request.headers.get('idempotency-key');
    void request
      .clone()
      .json()
      .then((body: Record<string, unknown>) => sent.push({ url: request.url, body, key }));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

describe('V5-15 – "Cần dọn" on the Desk room board (R8, OC → OD)', () => {
  it('only an OC room has the button (server allowedEvents); a click sends R8 with expectedFrom, the room turns OD and gets a cleaning task', async () => {
    mockControl.stay.roomStatus['301'] = 'OC';
    mockControl.ops.hkTasks = mockControl.ops.hkTasks.filter((t) => t.roomNo !== '301');
    const cap = captureTransitions();
    try {
      const { user } = renderApp('/housekeeping', 'qa.fd');
      const row = await roomRow('301');
      expect(within(row).getByText(tv('status.room.OC'))).toBeInTheDocument();
      const btn = within(row).getByRole('button', { name: tv('hk.action.needs_cleaning') });
      expect(btn).toHaveAccessibleDescription('301');
      // Not OC → no button: VI, VD, OD, OOO rooms.
      for (const no of ['302', '203', '402', '401'])
        expect(
          within(await roomRow(no)).queryByRole('button', { name: tv('hk.action.needs_cleaning') }),
        ).toBeNull();
      await user.click(btn);
      expect(
        await screen.findByText(tv('hk.desk.needs_cleaning_toast', { room: '301' })),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(
          within(screen.getByRole('region', { name: tv('hk.desk.rooms') })).getAllByText(
            tv('status.room.OD'),
          ).length,
        ).toBeGreaterThan(0),
      );
      const after = await roomRow('301');
      await waitFor(() =>
        expect(within(after).getByText(tv('status.room.OD'))).toBeInTheDocument(),
      );
      expect(
        within(after).queryByRole('button', { name: tv('hk.action.needs_cleaning') }),
      ).toBeNull();
      expect(cap.sent).toHaveLength(1);
      expect(cap.sent[0]!.url).toContain(`/rooms/${room('301').id}/status-transitions`);
      expect(cap.sent[0]!.body).toMatchObject({ event: 'needs_cleaning', expectedFrom: 'OC' });
      expect(Number.isNaN(Date.parse(String(cap.sent[0]!.body.performedAt)))).toBe(false);
      expect(cap.sent[0]!.key).toMatch(/^[0-9a-f-]{36}$/);
      expect(mockControl.stay.roomStatus['301']).toBe('OD');
      // R8a: the stay-over cleaning task shows in the task list of the same page.
      const tasks = screen.getByRole('region', { name: tv('hk.desk.tasks') });
      await waitFor(() =>
        expect(
          within(tasks)
            .getAllByText('301', { selector: '.roomno' })
            .some((x) => within(x.closest('li')!).queryByText(tv('hk.type.stayover_clean'))),
        ).toBe(true),
      );
    } finally {
      cap.stop();
    }
  });

  it('the room changed meanwhile → 409 INVALID_TRANSITION: the board reloads and says so; nothing else is sent', async () => {
    mockControl.stay.roomStatus['301'] = 'OC';
    const cap = captureTransitions();
    try {
      const { user } = renderApp('/housekeeping', 'qa.fd');
      const row = await roomRow('301');
      const btn = within(row).getByRole('button', { name: tv('hk.action.needs_cleaning') });
      // Housekeeping already marked it from the PWA.
      mockControl.stay.roomStatus['301'] = 'OD';
      await user.click(btn);
      const after = await roomRow('301');
      expect(
        await within(after).findByText(tv('error.INVALID_TRANSITION_generic_reloaded')),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(within(after).getByText(tv('status.room.OD'))).toBeInTheDocument(),
      );
      expect(
        within(after).queryByRole('button', { name: tv('hk.action.needs_cleaning') }),
      ).toBeNull();
      expect(within(after).queryByText(/^Đơn vừa chuyển/)).toBeNull();
      expect(cap.sent).toHaveLength(1);
      expect(cap.sent[0]!.body).toMatchObject({ event: 'needs_cleaning', expectedFrom: 'OC' });
    } finally {
      cap.stop();
    }
  });

  it('offline (read-only Desk): the button is disabled', async () => {
    mockControl.stay.roomStatus['301'] = 'OC';
    renderApp('/housekeeping', 'qa.fd');
    const btn = within(await roomRow('301')).getByRole('button', {
      name: tv('hk.action.needs_cleaning'),
    });
    expect(btn).toBeEnabled();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    try {
      await waitFor(() => expect(btn).toBeDisabled());
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
    }
  });

  it('a role the server gives no room event (maintenance) sees no button', async () => {
    mockControl.stay.roomStatus['301'] = 'OC';
    renderApp('/housekeeping', 'qa.mt');
    const row = await roomRow('301').catch(() => null);
    if (row)
      expect(
        within(row).queryByRole('button', { name: tv('hk.action.needs_cleaning') }),
      ).toBeNull();
    expect(screen.queryByRole('button', { name: tv('hk.action.needs_cleaning') })).toBeNull();
  });
});
