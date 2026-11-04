// v1.0.4 (FE-A) – BUG-R4-042 (P1, money) on H16 step 1 (minibar), a stay with a B14 mid-stay: two cabinets to count.
// After the count of the first cabinet the page reloads the summary. When the desk counted the second cabinet before
// that read was in, `nextCabinet` looked for the next cabinet in the summary of the press (a closure) – it still
// listed the first cabinet – and the page went BACK to the cabinet just counted, on step 1, with no cabinet named once
// the summary came in (the title says the room of the stay). "Không dùng gì – tủ đủ" there, then "Tiếp tục", reversed
// the minibar line charged (35.000). From S4-38 (`feb75035`, v1.0.1).
// Now the cabinets counted on this page are never chosen or offered again, the next one is read from the latest
// summary, and the cabinet on screen is always named (K11-03).
import { newIdempotencyKey } from '@ottimo/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { api, setCsrfToken } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { MINIBAR } from '../mocks/stay';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const BIA = MINIBAR.find((m) => m.itemName === 'Bia Đà Lạt')!;

/** Kim: B14 402 → 202 today (both cabinets due), then the clock on the departure day of her stay at 11:00. */
async function kimTwoCabinets() {
  pinDaytime('11:00');
  const kim = res('Kim Seo-yeon');
  res('Nguyễn Văn An').status = 'cancelled'; // frees 202
  mockControl.stay.roomStatus['202'] = 'VC';
  const R = { propertyId: PROPERTY_ID, reservationId: kim.id };
  const r402 = mockControl.db.rooms.find((x) => x.roomNo === '402')!;
  const r202 = mockControl.db.rooms.find((x) => x.roomNo === '202')!;
  mockControl.signInAs('qa.fd');
  setCsrfToken(mockControl.db.csrf);
  await api.changeRoom(
    R,
    {
      newRoomId: r202.id,
      cause: 'property_fault',
      reason: 'Máy lạnh hỏng',
      effectiveDate: todayLocal(),
    },
    res('Kim Seo-yeon').version,
    newIdempotencyKey(),
  );
  // P4-32 / BUG-R3-024: H16 runs on the departure day of the whole stay (read as the page does).
  const r = (await api.getReservation(R)).data;
  vi.setSystemTime(new Date(`${r.stayDepartureDate ?? r.departureDate}T11:00:00+07:00`));
  return { kim, R, r402, r202 };
}

type Count = { roomId: string; lines: Array<{ itemId: string; remainingQty: number }> };
/**
 * The minibar traffic of the page: every count (body + status, in the order answered) and every standard read
 * (`roomId`). `readsSince(n)` = the cabinets read once n counts had been answered.
 */
function watchMinibar() {
  const bodies = new Map<string, Promise<Count>>();
  const counts: Array<Count & { status: number }> = [];
  const reads: Array<{ roomId: string | null; afterCounts: number }> = [];
  let answered = 0;
  const isCount = (r: Request) =>
    r.method === 'POST' && /\/minibar-checks$/.test(new URL(r.url).pathname);
  const onStart = ({ request, requestId }: { request: Request; requestId: string }) => {
    const url = new URL(request.url);
    if (request.method === 'GET' && /\/minibar-standard$/.test(url.pathname))
      reads.push({ roomId: url.searchParams.get('roomId'), afterCounts: answered });
    if (isCount(request)) bodies.set(requestId, request.clone().json() as Promise<Count>);
  };
  const onMocked = ({
    request,
    requestId,
    response,
  }: {
    request: Request;
    requestId: string;
    response: Response;
  }) => {
    if (!isCount(request)) return;
    answered += 1;
    const status = response.status;
    void bodies
      .get(requestId)!
      .then((b) => counts.push({ roomId: b.roomId, lines: b.lines, status }));
  };
  server.events.on('request:start', onStart);
  server.events.on('response:mocked', onMocked);
  return {
    counts,
    readsSince: (n: number) => reads.filter((r) => r.afterCounts >= n).map((r) => r.roomId),
    stop: () => {
      server.events.removeListener('request:start', onStart);
      server.events.removeListener('response:mocked', onMocked);
    },
  };
}

/** From `hold()` on, every `checkout-summary` read waits until `release()` (then the shared mock answers). */
function summaryGate() {
  let gate: Promise<void> | null = null;
  let open: (() => void) | undefined;
  let held = 0;
  let answered = 0;
  server.use(
    http.get('*/reservations/:reservationId/checkout-summary', async () => {
      if (!gate) return undefined;
      held += 1;
      await gate;
      answered += 1;
      return undefined;
    }),
  );
  return {
    hold: () => {
      gate = new Promise<void>((r) => (open = r));
    },
    release: () => open?.(),
    held: () => held,
    answered: () => answered,
  };
}

const departureTime = () => screen.queryByLabelText(new RegExp(tv('checkout.departure_time')));
const biaRow = async () =>
  (await screen.findByRole('rowheader', { name: new RegExp(`^${BIA.itemName}`) })).closest('tr')!;
const usedOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1]!.textContent;

describe('BUG-R4-042 – after B14, the second count never takes the page back to the cabinet just counted', () => {
  it.each([
    ['still held when the second cabinet is counted (the race)', true],
    ['in before the second cabinet is counted', false],
  ])(
    'summary read after the first count %s: step 2, one count per cabinet, the 35.000 stays',
    async (_label, heldOverSecondCount) => {
      const { kim, r402, r202 } = await kimTwoCabinets();
      const gate = summaryGate();
      const mb = watchMinibar();
      try {
        const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
        const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
        const old = within(group).getByRole('button', {
          name: tv('co.minibar_cabinet_old', { room: '402' }),
        });
        // BR-703-01: the old room's cabinet is offered first. The guest drank one beer in 402.
        await waitFor(() => expect(old).toHaveAttribute('aria-pressed', 'true'));
        const row402 = await biaRow();
        await waitFor(() => expect(usedOf(row402)).toBe('0'));
        await user.click(within(row402).getByRole('button', { name: tv('rooms.dec') }));
        expect(usedOf(row402)).toBe('1');

        // From the first count on, the summary read after it is held.
        gate.hold();
        await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
        await waitFor(() =>
          expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([[r402.id, 201]]),
        );
        await waitFor(() => expect(gate.held()).toBeGreaterThan(0));

        // The page moves to the cabinet of today (202): read for 202, nothing used, "Tiếp tục" open.
        await waitFor(() => expect(mb.readsSince(1)).toContain(r202.id));
        const go = await screen.findByRole('button', { name: tv('co.go_extras') });
        const row202 = await biaRow();
        await waitFor(() => expect(usedOf(row202)).toBe('0'));
        if (!heldOverSecondCount) {
          gate.release();
          await waitFor(() => expect(gate.answered()).toBe(gate.held()));
        }
        await user.click(go);
        await waitFor(() => expect(mb.counts).toHaveLength(2));
        expect(mb.counts[1]).toMatchObject({ roomId: r202.id, status: 201 });

        // Step 2 – the old code went back to 402 here (read again, step 1) while the summary was held.
        await waitFor(() =>
          expect(departureTime() !== null || mb.readsSince(2).length > 0).toBe(true),
        );
        expect(mb.readsSince(2), 'no cabinet read again after the last count').toEqual([]);
        expect(departureTime()).toBeInTheDocument();
        // Nothing left on screen to count a cabinet again ("Không dùng gì – tủ đủ" reversed the 35.000).
        expect(screen.queryByRole('button', { name: tv('checkout.minibar.all_full') })).toBeNull();
        if (heldOverSecondCount) {
          expect(gate.answered(), 'the summary is still held').toBe(0);
          gate.release();
          await waitFor(() => expect(gate.answered()).toBe(gate.held()));
        }
        // Still step 2 once every read is in; exactly one count per cabinet.
        expect(departureTime()).toBeInTheDocument();
        expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([
          [r402.id, 201],
          [r202.id, 201],
        ]);
        // Folio: the one beer of 402, never reversed; 202 nothing.
        const lines = mockControl.stay.folios
          .get(kim.folioId)!
          .lines.filter((l) => l.category === 'minibar' && l.lineState === 'posted');
        expect(lines.map((l) => [l.cabinetRoomId, l.amountVnd])).toEqual([
          [r402.id, BIA.unitPriceVnd],
        ]);
        expect(
          (await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: kim.id })).data
            .minibarUncheckedRooms,
        ).toBeUndefined();
      } finally {
        gate.release();
        mb.stop();
      }
    },
  );
});

/** K11-03: the cabinet named on screen – by the choice while two are left, else by the line under it. */
function cabinetNamed() {
  const group = screen.queryByRole('group', { name: tv('co.minibar_cabinet') });
  if (group) {
    const on = within(group)
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    return {
      offered: within(group)
        .getAllByRole('button')
        .map((b) => b.textContent),
      on: on[0]?.textContent,
    };
  }
  const term = screen.queryByText(tv('co.minibar_cabinet_counting'));
  return { offered: [], on: term?.nextElementSibling?.textContent ?? undefined };
}

describe('BUG-R4-042 / K11-03 – the cabinet on screen is always named; a cabinet counted here is not offered again', () => {
  it('old cabinet first: once 402 is counted (summary held) it is not offered again, and 202 is named on screen', async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    const gate = summaryGate();
    const mb = watchMinibar();
    const here = tv('co.minibar_cabinet_room', { room: '202' });
    const old = tv('co.minibar_cabinet_old', { room: '402' });
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
      await waitFor(() => expect(cabinetNamed().on).toBe(old));
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      await user.click(within(row).getByRole('button', { name: tv('rooms.dec') }));
      gate.hold();
      await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts.map((c) => c.roomId)).toEqual([r402.id]));
      await waitFor(() => expect(mb.readsSince(1)).toContain(r202.id));
      await screen.findByRole('button', { name: tv('co.go_extras') });
      // The summary read after the count is still held (it lists 402 until then): 402 is not offered any more,
      // and the cabinet on screen is named.
      expect(gate.answered()).toBe(0);
      expect(cabinetNamed()).toEqual({ offered: [], on: here });
      gate.release();
      await waitFor(() => expect(gate.answered()).toBe(gate.held()));
      // Once it is in: the same.
      expect(cabinetNamed()).toEqual({ offered: [], on: here });
    } finally {
      gate.release();
      mb.stop();
    }
  });

  it("this room's cabinet first (picked by the desk): then 402, named; 202 never offered again; step 2 after 402", async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    const gate = summaryGate();
    const mb = watchMinibar();
    const old = tv('co.minibar_cabinet_old', { room: '402' });
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
      await waitFor(() => expect(cabinetNamed().on).toBe(old));
      // ARC PR67-03: the desk may count this room's cabinet first.
      await user.click(
        within(group).getByRole('button', { name: tv('co.minibar_cabinet_room', { room: '202' }) }),
      );
      await waitFor(() => expect(mb.readsSince(0)).toContain(r202.id));
      const go202 = await screen.findByRole('button', { name: tv('co.go_extras') });
      gate.hold();
      await user.click(go202); // nothing used in 202
      await waitFor(() => expect(mb.counts.map((c) => c.roomId)).toEqual([r202.id]));
      // Next: the old cabinet, named – 202 is not offered again (the summary still lists it).
      await waitFor(() => expect(mb.readsSince(1)).toContain(r402.id));
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      await screen.findByRole('button', { name: tv('co.go_extras') });
      expect(gate.answered()).toBe(0);
      expect(cabinetNamed()).toEqual({ offered: [], on: old });
      await user.click(within(row).getByRole('button', { name: tv('rooms.dec') }));
      await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(2));
      await waitFor(() =>
        expect(departureTime() !== null || mb.readsSince(2).length > 0).toBe(true),
      );
      expect(mb.readsSince(2), 'no cabinet read again after the last count').toEqual([]);
      expect(departureTime()).toBeInTheDocument();
      gate.release();
      await waitFor(() => expect(gate.answered()).toBe(gate.held()));
      expect(departureTime()).toBeInTheDocument();
      expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([
        [r202.id, 201],
        [r402.id, 201],
      ]);
      const lines = mockControl.stay.folios
        .get(kim.folioId)!
        .lines.filter((l) => l.category === 'minibar' && l.lineState === 'posted');
      expect(lines.map((l) => [l.cabinetRoomId, l.amountVnd])).toEqual([
        [r402.id, BIA.unitPriceVnd],
      ]);
    } finally {
      gate.release();
      mb.stop();
    }
  });
});

describe('BUG-R4-042 – the next cabinet is chosen from the latest summary read, not the one of the press', () => {
  it('first summary still on its way when 202 is counted: it comes in during the count – then 402, never step 2 first', async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    const gate = summaryGate();
    gate.hold(); // the very first summary too
    let sendCount!: () => void;
    const countGate = new Promise<void>((r) => (sendCount = r));
    server.use(
      http.post('*/reservations/:reservationId/minibar-checks', async () => {
        await countGate;
        return undefined;
      }),
    );
    const mb = watchMinibar();
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      // No summary yet: the page knows one cabinet, the room of today (202).
      const go = await screen.findByRole('button', { name: tv('co.go_extras') });
      expect(mb.readsSince(0)).toEqual([r202.id]);
      expect(screen.queryByRole('group', { name: tv('co.minibar_cabinet') })).toBeNull();
      await user.click(go); // nothing used in 202
      // While the count is on its way, the first summary comes in (both cabinets due).
      gate.release();
      await waitFor(() => expect(gate.answered()).toBe(gate.held()));
      sendCount();
      await waitFor(() =>
        expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([[r202.id, 201]]),
      );
      // Next: 402, named – the summary of the press listed no cabinet (the old code went on to step 2).
      await waitFor(() => expect(mb.readsSince(1)).toContain(r402.id));
      const row = await biaRow();
      await screen.findByRole('button', { name: tv('co.go_extras') });
      expect(departureTime()).toBeNull();
      expect(cabinetNamed()).toEqual({
        offered: [],
        on: tv('co.minibar_cabinet_old', { room: '402' }),
      });
      await user.click(within(row).getByRole('button', { name: tv('rooms.dec') }));
      await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(2));
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([
        [r202.id, 201],
        [r402.id, 201],
      ]);
      expect(mb.readsSince(2)).toEqual([]);
    } finally {
      gate.release();
      sendCount();
      mb.stop();
    }
  });
});
