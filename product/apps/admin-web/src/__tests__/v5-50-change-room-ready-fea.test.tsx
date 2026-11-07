// V5-50 (BUG-R3-023 phần lọc, P2) – hộp Đổi phòng (B14) chỉ liệt kê căn VI / VC. `searchAvailability` không có trạng
// thái buồng (ARC 0.3.13 mục 1.12): Desk đọc thêm `listRoomStatuses` (FD+) và bỏ căn VD / CL / OC / OD / OOO khỏi danh
// sách. Máy chủ vẫn chặn 409 ROOM_NOT_READY (BR-803) – MSW ở `mocks/stay.ts` giữ đúng luật đó. Không tải được trạng
// thái buồng thì danh sách giữ như cũ và câu dưới danh sách nói thật (`room_change.ready_unfiltered`).
// FB-R5-UXD-FE-PR98-01 (UXD 06/11, copy-v1.0.5 9.7): lọc xong không còn căn nào mà có căn trống VD / CL → câu
// `room_change.no_rooms_not_ready` nêu các căn đó (tăng dần) thay `room_change.no_rooms`.
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const roomId = (no: string) => mockControl.db.rooms.find((r) => r.roomNo === no)!.id;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listed = (dlg: HTMLElement) =>
  within(within(dlg).getByRole('group', { name: tv('stay.new_room') }))
    .queryAllByRole('radio')
    .map((x) => x.closest('label')!.textContent!.split(' · ')[0]!.trim());

async function openChangeRoom() {
  const kim = res('Kim Seo-yeon');
  const { user } = renderApp(`/reservations/${kim.id}`, 'qa.fd');
  const d = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
  await user.click(within(d).getByRole('button', { name: tv('drawer.action.change_room') }));
  const dlg = await screen.findByRole('dialog', { name: /^Đổi phòng · Căn 402/ });
  return { user, dlg };
}

/** searchAvailability answers exactly these rooms as free (it never looks at housekeeping); statuses set alongside. */
function freeAs(status: Record<string, string>) {
  Object.assign(mockControl.stay.roomStatus, status);
  server.use(
    http.get(/\/availability$/, ({ request }) => {
      const q = new URL(request.url).searchParams;
      return HttpResponse.json({
        arrival: q.get('arrival'),
        departure: q.get('departure'),
        alternatives: Object.keys(status).map((no) => ({
          roomId: roomId(no),
          roomNo: no,
          available: true,
          upgrade: false,
        })),
      });
    }),
  );
}

const NOT_READY_HEAD =
  /^Chưa có căn nào sẵn sàng\. Còn trống từ .+ đến .+ nhưng chưa dọn xong: căn /;

/** Rooms free for Kim's stay (today → departure, 402 excluded): every room VI first, read the list, unmount. */
async function freeRooms(): Promise<string[]> {
  for (const r of mockControl.db.rooms) mockControl.stay.roomStatus[r.roomNo] = 'VI';
  const { dlg } = await openChangeRoom();
  await waitFor(() => expect(listed(dlg).length).toBeGreaterThan(0));
  const free = listed(dlg);
  cleanup();
  return free;
}

describe('V5-50 – Đổi phòng lists only rooms ready for a guest (VI / VC)', () => {
  it('a free room that is VD, CL, OC, OD or OOO is not offered; VI and VC are, with the "filtered" sentence', async () => {
    // searchAvailability says six rooms are free (it never looks at housekeeping) – only two are ready.
    const status: Record<string, string> = {
      '103': 'VI',
      '202': 'VC',
      '203': 'VD',
      '301': 'CL',
      '302': 'OC',
      '101': 'OD',
      // OOO: defensive only – the server never answers a blocked room as free (room_occupancy kind ooo, ARC 98-03).
      '401': 'OOO',
    };
    freeAs(status);
    const { dlg } = await openChangeRoom();
    await waitFor(() => expect(listed(dlg)).toHaveLength(2));
    expect(listed(dlg).sort()).toEqual(['103', '202']);
    expect(within(dlg).getByText(tv('room_change.ready_only'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('room_change.ready_unfiltered'))).toBeNull();
  });

  it('every free room still dirty (VD) → names them in ascending order (PR98-01), no radio', async () => {
    const free = await freeRooms();
    for (const no of free) mockControl.stay.roomStatus[no] = 'VD';
    const { dlg } = await openChangeRoom();
    const group = within(dlg).getByRole('group', { name: tv('stay.new_room') });
    const msg = await within(group).findByText(NOT_READY_HEAD);
    const sorted = [...free].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    expect(msg.textContent).toContain(`căn ${sorted.join(', ')}.`);
    expect(msg.textContent).toContain('Nhờ buồng phòng dọn trước một căn');
    expect(within(group).queryByText(/^Không còn căn sẵn sàng đủ chỗ/)).toBeNull();
    expect(within(group).queryAllByRole('radio')).toHaveLength(0);
  });

  it('PR98-01: free rooms VD 203 + CL 202 (+ OC, OOO), none VI/VC → "202, 203" only', async () => {
    freeAs({ '203': 'VD', '202': 'CL', '302': 'OC', '401': 'OOO' });
    const { dlg } = await openChangeRoom();
    const group = within(dlg).getByRole('group', { name: tv('stay.new_room') });
    const msg = await within(group).findByText(NOT_READY_HEAD);
    expect(msg.textContent).toMatch(/: căn 202, 203\. /);
    expect(within(group).queryAllByRole('radio')).toHaveLength(0);
  });

  it('PR98-01: free rooms only OC / OD / OOO (nothing waits for cleaning) → the plain "no ready room" message', async () => {
    freeAs({ '302': 'OC', '101': 'OD', '401': 'OOO' });
    const { dlg } = await openChangeRoom();
    const group = within(dlg).getByRole('group', { name: tv('stay.new_room') });
    expect(await within(group).findByText(/^Không còn căn sẵn sàng đủ chỗ/)).toBeInTheDocument();
    expect(within(group).queryByText(NOT_READY_HEAD)).toBeNull();
  });

  it('a VC room picked from the filtered list is moved to (B14 sends its id)', async () => {
    const free = await freeRooms();
    const [vc] = free as [string];
    for (const no of free) mockControl.stay.roomStatus[no] = no === vc ? 'VC' : 'VD';
    const sent: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      if (
        request.method !== 'POST' ||
        !/\/actions\/change-room$/.test(new URL(request.url).pathname)
      )
        return;
      void request
        .clone()
        .json()
        .then((b: Record<string, unknown>) => sent.push(b));
    };
    server.events.on('request:start', on);
    try {
      const { user, dlg } = await openChangeRoom();
      await user.type(
        within(dlg).getByLabelText(new RegExp(`^${esc(tv('move.reason'))}`)),
        'Vòi sen hỏng',
      );
      await user.click(await within(dlg).findByRole('radio', { name: new RegExp(`^${vc}\\b`) }));
      await user.click(
        within(dlg).getByRole('button', { name: tv('stay.change_submit', { room: vc }) }),
      );
      await waitFor(() => expect(sent.some((b) => b.newRoomId === roomId(vc))).toBe(true));
      expect(sent.every((b) => b.newRoomId === roomId(vc))).toBe(true);
    } finally {
      server.events.removeListener('request:start', on);
    }
  });

  it('ARC 98-02: 409 ROOM_UNAVAILABLE suggestions go through the same ready set – a VD room is not offered as "Dùng căn"', async () => {
    freeAs({ '103': 'VI', '202': 'VC', '203': 'VD' });
    // The server picks its suggestion without housekeeping status (occupancy.suggest).
    server.use(
      http.post(/\/actions\/change-room$/, () =>
        HttpResponse.json(
          {
            type: '/problems/room-unavailable',
            title: 'Căn không trống',
            status: 409,
            code: 'ROOM_UNAVAILABLE',
            roomNo: '103',
            conflicts: [],
            suggestions: [
              { roomId: roomId('203'), roomNo: '203', upgrade: false },
              { roomId: roomId('202'), roomNo: '202', upgrade: false },
            ],
          },
          { status: 409 },
        ),
      ),
    );
    const { user, dlg } = await openChangeRoom();
    await user.click(await within(dlg).findByRole('radio', { name: /^103\b/ }));
    expect(
      await within(dlg).findByRole('button', { name: tv('bk.use_room', { room: '202' }) }),
    ).toBeInTheDocument();
    expect(
      within(dlg).queryByRole('button', { name: tv('bk.use_room', { room: '203' }) }),
    ).toBeNull();
  });

  it('ARC 98-02: 409 ROOM_NOT_READY (the room got dirty after the list loaded) → statuses read again, the room leaves the list', async () => {
    freeAs({ '103': 'VI', '202': 'VC' });
    let statusReads = 0;
    const on = ({ request }: { request: Request }) => {
      if (request.method === 'GET' && /\/room-statuses$/.test(new URL(request.url).pathname))
        statusReads += 1;
    };
    server.events.on('request:start', on);
    try {
      const { user, dlg } = await openChangeRoom();
      await waitFor(() => expect(listed(dlg).sort()).toEqual(['103', '202']));
      const before = statusReads;
      // Housekeeping marks 103 dirty while the dialog is open: B14 preview answers 409 ROOM_NOT_READY (BR-803).
      mockControl.stay.roomStatus['103'] = 'VD';
      await user.click(within(dlg).getByRole('radio', { name: /^103\b/ }));
      await waitFor(() => expect(statusReads).toBeGreaterThan(before));
      await waitFor(() => expect(listed(dlg)).toEqual(['202']));
      expect(
        within(dlg).queryByRole('button', { name: tv('stay.change_submit', { room: '103' }) }),
      ).toBeNull();
    } finally {
      server.events.removeListener('request:start', on);
    }
  });

  it('room statuses fail to load → the list stays unfiltered and the sentence says so', async () => {
    const free = await freeRooms();
    const [vd] = free as [string];
    mockControl.stay.roomStatus[vd] = 'VD';
    server.use(
      http.get(/\/room-statuses$/, () =>
        HttpResponse.json(
          { type: '/problems/internal', title: 'Lỗi', status: 500, code: 'INTERNAL' },
          { status: 500 },
        ),
      ),
    );
    const { dlg } = await openChangeRoom();
    await waitFor(() => expect(listed(dlg)).toContain(vd));
    expect(within(dlg).getByText(tv('room_change.ready_unfiltered'))).toBeInTheDocument();
    expect(within(dlg).queryByText(NOT_READY_HEAD)).toBeNull();
    expect(within(dlg).queryByText(tv('room_change.ready_only'))).toBeNull();
  });
});
