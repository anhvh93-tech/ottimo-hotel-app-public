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
import { http, HttpResponse } from 'msw';
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

type Count = {
  roomId: string;
  periodId?: string | null;
  lines: Array<{ itemId: string; remainingQty: number }>;
};
/**
 * The minibar traffic of the page: every count (body + status, in the order answered) and every standard read
 * (`roomId`). `readsSince(n)` = the cabinets read once n counts had been answered; `summariesSince(n)` = the summary
 * reads answered after that (`timed`: only those priced for a departure time – the debounced default one, first).
 */
function watchMinibar() {
  const bodies = new Map<string, Promise<Count>>();
  const counts: Array<Count & { status: number }> = [];
  const reads: Array<{ roomId: string | null; afterCounts: number }> = [];
  const summaries: Array<{ after: number; timed: boolean }> = [];
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
    if (request.method === 'GET' && /\/checkout-summary$/.test(new URL(request.url).pathname))
      summaries.push({
        after: answered,
        timed: new URL(request.url).searchParams.has('checkoutTime'),
      });
    if (!isCount(request)) return;
    answered += 1;
    const status = response.status;
    void bodies
      .get(requestId)!
      .then((b) => counts.push({ roomId: b.roomId, periodId: b.periodId, lines: b.lines, status }));
  };
  server.events.on('request:start', onStart);
  server.events.on('response:mocked', onMocked);
  return {
    counts,
    readsSince: (n: number) => reads.filter((r) => r.afterCounts >= n).map((r) => r.roomId),
    summariesSince: (n: number, timed = false) =>
      summaries.filter((a) => a.after >= n && (a.timed || !timed)).length,
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
/** FB-R4-UXD-FE-PR81-01 (a): the main button of step 1 while another cabinet is left after the one on screen. */
const goNext = (room: string) => tv('co.go_next_cabinet', { room });

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
        await user.click(screen.getByRole('button', { name: goNext('202') }));
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
      await user.click(screen.getByRole('button', { name: goNext('202') }));
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
      const go202 = await screen.findByRole('button', { name: goNext('402') });
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

const folioMinibar = (folioId: string) =>
  mockControl.stay.folios
    .get(folioId)!
    .lines.filter((l) => l.category === 'minibar' && l.lineState === 'posted')
    .map((l) => [l.cabinetRoomId, l.amountVnd]);
const backButton = () => screen.getByRole('button', { name: tv('common.back') });
const decOf = (row: HTMLElement) => within(row).getByRole('button', { name: tv('rooms.dec') });
const HERE = tv('co.minibar_cabinet_room', { room: '202' });
const OLD = tv('co.minibar_cabinet_old', { room: '402' });
const num = (x: string) => Number(x.replace(/\D/g, ''));
const balanceRow = () =>
  screen.getByRole('row', { name: new RegExp(`^${tv('checkout.summary.balance')}\\s*\\d`) });
/** Step 3: whatever is due is paid in cash, then "Hoàn tất" and its confirmation (B18). */
async function payAndComplete(user: ReturnType<typeof renderApp>['user']) {
  await screen.findByRole('button', { name: tv('pay.cash') });
  await waitFor(() => expect(balanceRow()).toBeInTheDocument());
  if (num(balanceRow().textContent ?? '') > 0) {
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
    await waitFor(() => expect(num(balanceRow().textContent ?? '')).toBe(0));
  }
  await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
  const dialog = await screen.findByRole('alertdialog');
  await user.click(within(dialog).getAllByRole('button')[1]!);
}

describe('FB-R4-ARC-FE-PR81-02 – Back to step 1, and a cabinet with nothing chargeable', () => {
  it('G-FE-042-1: 202, then 402 (1 beer), step 2, Back – 402 named with its count; "Tiếp tục" sends the same figures, the 35.000 stays', async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    const mb = watchMinibar();
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
      await waitFor(() => expect(cabinetNamed().on).toBe(OLD));
      await user.click(within(group).getByRole('button', { name: HERE }));
      await waitFor(() => expect(mb.readsSince(0)).toContain(r202.id));
      await user.click(await screen.findByRole('button', { name: goNext('402') }));
      await waitFor(() => expect(mb.counts).toHaveLength(1));
      await waitFor(() => expect(mb.readsSince(1)).toContain(r402.id));
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      await user.click(decOf(row));
      await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(2));
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      expect(folioMinibar(kim.folioId)).toEqual([[r402.id, BIA.unitPriceVnd]]);

      await user.click(backButton());
      await waitFor(() => expect(departureTime()).toBeNull());
      const row2 = await biaRow();
      await waitFor(() => expect(usedOf(row2)).toBe('1'));
      // The cabinet on screen is named, 202 is not offered again.
      expect(cabinetNamed()).toEqual({ offered: [], on: OLD });
      await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(3));
      expect(mb.counts[2]).toMatchObject({ roomId: r402.id, status: 201 });
      expect(mb.counts[2]!.lines).toEqual(mb.counts[1]!.lines);
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      // R6: the same figures keep the line – never reversed, never twice.
      expect(folioMinibar(kim.folioId)).toEqual([[r402.id, BIA.unitPriceVnd]]);
    } finally {
      mb.stop();
    }
  });

  it('nothing chargeable in 202 (counted before): passed with no count, on to 402 – 202 is not offered again', async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    // 202 was counted earlier today (the summary lists 402 only) and its standard has nothing chargeable.
    mockControl.stay.minibarChecks.set(
      kim.id,
      MINIBAR.map((m) => ({ itemId: m.itemId, remainingQty: m.standardQty })),
    );
    server.use(
      http.get('*/reservations/:reservationId/minibar-standard', ({ request }) =>
        new URL(request.url).searchParams.get('roomId') === r202.id
          ? HttpResponse.json({
              roomId: r202.id,
              roomNo: '202',
              periodId: null,
              items: [],
              latestCheck: null,
            })
          : undefined,
      ),
    );
    const mb = watchMinibar();
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
      await waitFor(() => expect(cabinetNamed()).toEqual({ offered: [OLD, HERE], on: OLD }));
      await user.click(within(group).getByRole('button', { name: HERE }));
      expect(await screen.findByText(tv('checkout.minibar.empty'))).toBeInTheDocument();
      await user.click(await screen.findByRole('button', { name: goNext('402') }));
      // Passed: no count sent; on to 402, named – 202 no longer offered.
      await waitFor(() => expect(cabinetNamed()).toEqual({ offered: [], on: OLD }));
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      expect(mb.counts).toEqual([]);
      // No toast: nothing was saved for 202.
      expect(screen.queryByText(tv('co.minibar_cabinet_saved', { room: '202' }))).toBeNull();
      await user.click(decOf(row));
      await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(1));
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([[r402.id, 201]]);
      expect(folioMinibar(kim.folioId)).toEqual([[r402.id, BIA.unitPriceVnd]]);
    } finally {
      mb.stop();
    }
  });
});

describe('FB-R4-UXD-FE-PR81-01 – the main button names the next cabinet; a toast says the one counted is saved', () => {
  it('402 with 202 left: "Tiếp tục: Tủ căn 202"; after 201 the toast for 402 and "Tiếp tục: Phụ phí"; none on to step 2', async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    const mb = watchMinibar();
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
      await waitFor(() => expect(cabinetNamed().on).toBe(OLD));
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      const go = screen.getByRole('button', { name: goNext('202') });
      expect(screen.queryByRole('button', { name: tv('co.go_extras') })).toBeNull();
      await user.click(decOf(row));
      await user.click(go);
      await waitFor(() => expect(mb.counts.map((c) => c.roomId)).toEqual([r402.id]));
      expect(
        await screen.findByText(tv('co.minibar_cabinet_saved', { room: '402' })),
      ).toBeInTheDocument();
      await waitFor(() => expect(cabinetNamed()).toEqual({ offered: [], on: HERE }));
      await screen.findByRole('button', { name: tv('co.go_extras') });
      expect(screen.queryByRole('button', { name: goNext('202') })).toBeNull();
      await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts.map((c) => c.roomId)).toEqual([r402.id, r202.id]));
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      // Straight to step 2: the screen says it – no toast for 202.
      expect(screen.queryByText(tv('co.minibar_cabinet_saved', { room: '202' }))).toBeNull();
    } finally {
      mb.stop();
    }
  });
});

describe('BUG-R4-045 / FB-R4-ARC-FE-PR81-01 – a cabinet the server asks to count (again) always comes back to step 1', () => {
  it('402 due again right after its count (QA case D): offered next to 202, named on the button, then counted again with "Cần đếm lại"', async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    const gate = summaryGate();
    const mb = watchMinibar();
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
      await waitFor(() => expect(cabinetNamed().on).toBe(OLD));
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      await user.click(decOf(row));
      gate.hold();
      await user.click(screen.getByRole('button', { name: goNext('202') }));
      await waitFor(() =>
        expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([[r402.id, 201]]),
      );
      // Right after that count the server asks for 402 again (`stay_continued` – e.g. a B14 back to 402 elsewhere).
      mockControl.stay.minibarRecount.add(`${kim.id}:${r402.id}`);
      gate.release();
      await waitFor(() => expect(gate.answered()).toBe(gate.held()));
      // The summary read after the count lists 402: offered again, next to 202 (on screen); the button goes there.
      await waitFor(() => expect(cabinetNamed()).toEqual({ offered: [OLD, HERE], on: HERE }));
      await user.click(await screen.findByRole('button', { name: goNext('402') }));
      await waitFor(() => expect(mb.counts).toHaveLength(2));
      expect(mb.counts[1]).toMatchObject({ roomId: r202.id, status: 201 });
      // On to 402: named, said why (BR-703-02), its last count as the start.
      await waitFor(() => expect(cabinetNamed()).toEqual({ offered: [], on: OLD }));
      expect(
        await screen.findByText(tv('co.minibar_recount_title', { room: '402' })),
      ).toBeInTheDocument();
      const row2 = await biaRow();
      await waitFor(() => expect(usedOf(row2)).toBe('1'));
      await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(3));
      expect(mb.counts[2]).toMatchObject({ roomId: r402.id, status: 201 });
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      expect(folioMinibar(kim.folioId)).toEqual([[r402.id, BIA.unitPriceVnd]]);
      expect(
        (await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: kim.id })).data
          .minibarUncheckedRooms,
      ).toBeUndefined();
    } finally {
      gate.release();
      mb.stop();
    }
  });

  it('G-FE-042-2: a refill of 202 (counted here) once the page is on step 2 – Back offers 202 again with "Cần đếm lại"', async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    const mb = watchMinibar();
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
      await waitFor(() => expect(cabinetNamed().on).toBe(OLD));
      // The summary priced for the default departure time (debounced) is in: from here on only the page's own steps
      // read it.
      await waitFor(() => expect(mb.summariesSince(0, true)).toBeGreaterThan(0));
      await user.click(within(group).getByRole('button', { name: HERE }));
      await waitFor(() => expect(mb.readsSince(0)).toContain(r202.id));
      await user.click(await screen.findByRole('button', { name: goNext('402') }));
      await waitFor(() => expect(mb.counts).toHaveLength(1));
      await waitFor(() => expect(mb.readsSince(1)).toContain(r402.id));
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      await user.click(decOf(row));
      await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(2));
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      // The summary read after that count is in (it lists nothing) – then HK finishes a refill of 202 in another
      // session: a new period to count (`new_fill`). Nothing on the page reads the summary again by itself.
      await waitFor(() => expect(mb.summariesSince(2)).toBeGreaterThan(0));
      const key = `${kim.id}:${r202.id}`;
      mockControl.stay.minibarPeriods.set(key, 1);
      mockControl.stay.minibarChecks.delete(kim.id);
      mockControl.stay.minibarNewFill.add(key);
      await user.click(backButton());
      // Step 1 reads the summary again: 202 is offered next to 402 (on screen), named on the button.
      await waitFor(() => expect(cabinetNamed()).toEqual({ offered: [HERE, OLD], on: OLD }));
      await screen.findByRole('button', { name: goNext('202') });
      await user.click(
        within(screen.getByRole('group', { name: tv('co.minibar_cabinet') })).getByRole('button', {
          name: HERE,
        }),
      );
      expect(
        await screen.findByText(tv('co.minibar_recount_title', { room: '202' })),
      ).toBeInTheDocument();
      expect(screen.getByText(tv('co.minibar_recount_body_new_fill'))).toBeInTheDocument();
      await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(3));
      expect(mb.counts[2]).toMatchObject({ roomId: r202.id, status: 201 });
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      expect(folioMinibar(kim.folioId)).toEqual([[r402.id, BIA.unitPriceVnd]]);
      expect(
        (await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: kim.id })).data
          .minibarUncheckedRooms,
      ).toBeUndefined();
    } finally {
      mb.stop();
    }
  });

  it('D2: no summary in when the page left step 1 – "Hoàn tất" answered MINIBAR_NOT_CHECKED goes back to step 1 on 402; then it completes', async () => {
    const { kim, r402, r202 } = await kimTwoCabinets();
    const gate = summaryGate();
    gate.hold(); // the first summary too
    const mb = watchMinibar();
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      // No summary: the page knows the cabinet of today only – counted, nothing used, step 2.
      await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() =>
        expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([[r202.id, 201]]),
      );
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      gate.release();
      await waitFor(() => expect(gate.answered()).toBe(gate.held()));
      await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
      await payAndComplete(user);
      // B18: 409 MINIBAR_NOT_CHECKED (402). Back on step 1, on 402, named; the server's sentence says why.
      await waitFor(() => expect(mb.readsSince(1)).toContain(r402.id));
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      expect(cabinetNamed()).toEqual({ offered: [], on: OLD });
      expect(screen.getByText(tv('error.MINIBAR_NOT_CHECKED'))).toBeInTheDocument();
      expect(res('Kim Seo-yeon').status).not.toBe('checked_out');
      await user.click(decOf(row));
      await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(2));
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      // Done: the sentence is not carried to step 2.
      expect(screen.queryByText(tv('error.MINIBAR_NOT_CHECKED'))).toBeNull();
      await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
      await payAndComplete(user);
      await waitFor(() => expect(res('Kim Seo-yeon').status).toBe('checked_out'));
      expect(mb.counts.map((c) => [c.roomId, c.status])).toEqual([
        [r202.id, 201],
        [r402.id, 201],
      ]);
      expect(folioMinibar(kim.folioId)).toEqual([[r402.id, BIA.unitPriceVnd]]);
    } finally {
      gate.release();
      mb.stop();
    }
  });
});

describe('BUG-R4-047 – Back to step 1 after the first count of a cabinet never refilled', () => {
  it('the server opened its period at that count: Back reads the cabinet again, the same figures are saved (no 409), the 35.000 stays', async () => {
    pinDaytime('11:00');
    const kim = res('Kim Seo-yeon');
    const R = { propertyId: PROPERTY_ID, reservationId: kim.id };
    mockControl.signInAs('qa.fd');
    setCsrfToken(mockControl.db.csrf);
    const r = (await api.getReservation(R)).data;
    vi.setSystemTime(new Date(`${r.stayDepartureDate ?? r.departureDate}T11:00:00+07:00`));
    // Kim is in 402, its cabinet never refilled. The real server opens its first period (`check_in`) at the first
    // count (`registerFridge` in `record()`); the mock does not – done here, on the first 201.
    const r402 = mockControl.db.rooms.find((x) => x.roomNo === '402')!;
    const key = `${kim.id}:${r402.id}`;
    const opened: string[] = [];
    const onCount = ({ request, response }: { request: Request; response: Response }) => {
      if (request.method !== 'POST' || !/\/minibar-checks$/.test(new URL(request.url).pathname))
        return;
      if (response.status !== 201 || mockControl.stay.minibarPeriods.get(key)) return;
      mockControl.stay.minibarPeriods.set(key, 1);
      opened.push(key);
    };
    server.events.on('response:mocked', onCount);
    const mb = watchMinibar();
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      const row = await biaRow();
      await waitFor(() => expect(usedOf(row)).toBe('0'));
      await user.click(decOf(row));
      await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(1));
      expect(mb.counts[0]).toMatchObject({ roomId: r402.id, status: 201, periodId: null });
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      expect(opened).toHaveLength(1);

      await user.click(backButton());
      const row2 = await biaRow();
      await waitFor(() => expect(usedOf(row2)).toBe('1'));
      await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
      await waitFor(() => expect(mb.counts).toHaveLength(2));
      // Counted on the period the server opened – not refused as "refilled meanwhile".
      expect(mb.counts[1]).toMatchObject({ status: 201 });
      expect(mb.counts[1]!.periodId).toEqual(expect.any(String));
      expect(mb.counts[1]!.lines).toEqual(mb.counts[0]!.lines);
      expect(screen.queryByText(tv('co.minibar_period_changed_title'))).toBeNull();
      expect(
        await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
      ).toBeInTheDocument();
      expect(folioMinibar(kim.folioId)).toEqual([[r402.id, BIA.unitPriceVnd]]);
    } finally {
      server.events.removeListener('response:mocked', onCount);
      mb.stop();
    }
  });
});
