// v1.0.4 (FE-A) – s4-144 race on H16 step 1 (minibar). The figures a cabinet count starts from used to be copied
// into state by an effect one render AFTER the standard arrived: "Tiếp tục" pressed in that frame sent a full
// cabinet ("nothing used") and the server reversed the minibar already charged. Before the standard arrived the
// button skipped the count (no items yet = "nothing chargeable"). Now the prefill is derived in render and the
// button waits (DS busy) while the standard is read.
import { newIdempotencyKey, type MinibarStandard } from '@ottimo/api-client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, setCsrfToken } from '../app/api';
import { todayLocal } from '../app/dates';
import { currentSegment } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { MINIBAR } from '../mocks/stay';
import { minibarPrefill } from '../pages/stay/CheckOutPage';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
afterEach(() => vi.useRealTimers());
/**
 * Moves the clock (faked at the start of the case) to a calendar day (`YYYY-MM-DD`): H16 runs on the departure day
 * of the whole stay (P4-32 / BUG-R3-024) – always read as the page does, `stayDepartureDate` from the API.
 */
const onDay = (day: string, hhmm: string) => vi.setSystemTime(new Date(`${day}T${hhmm}:00+07:00`));
const onDepartureDay = async (R: { propertyId: string; reservationId: string }) => {
  const r = (await api.getReservation(R)).data;
  onDay(r.stayDepartureDate ?? r.departureDate, '11:00');
};

/** Kim: B14 402 → 202 today (both cabinets due), then the clock on her departure day at 11:00. */
async function kimAfterB14() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T11:00:00+07:00`));
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
  // P4-32 / BUG-R3-024: H16 runs on the departure day (before it the page points to Trả sớm).
  await onDepartureDay(R);
  return { kim, R, r402, r202 };
}

const coke = MINIBAR[0]!;
const countUsing = (used: number) =>
  MINIBAR.map((m) => ({
    itemId: m.itemId,
    remainingQty: m.itemId === coke.itemId ? m.standardQty - used : m.standardQty,
  }));

function capture() {
  const sent: Array<{ lines: Array<{ itemId: string; remainingQty: number }> }> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'POST' || !/\/minibar-checks$/.test(new URL(request.url).pathname))
      return;
    void request
      .clone()
      .json()
      .then((b: (typeof sent)[number]) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

/** Holds every `minibar-standard` read until `release()` (then the shared mock answers). */
function holdStandard() {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  server.use(
    http.get('*/reservations/:reservationId/minibar-standard', async () => {
      await gate;
      return undefined;
    }),
  );
  return () => release();
}

/** Phạm Huy: 2 Coca-Cola counted and charged, then B13 – the cabinet is due again, starting from that count. */
async function countedThenExtended() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T11:00:00+07:00`));
  const r = res('Phạm Huy');
  const R = { propertyId: PROPERTY_ID, reservationId: r.id };
  mockControl.signInAs('qa.fd');
  setCsrfToken(mockControl.db.csrf);
  const roomId = currentSegment(r.segments, todayLocal())!.roomId!;
  const std = (await api.getMinibarStandard(R, roomId)).data;
  await api.recordMinibarCheck(
    R,
    {
      mode: 'checkout',
      roomId: std.roomId ?? roomId,
      periodId: std.periodId ?? null,
      lines: countUsing(2),
    },
    newIdempotencyKey(),
  );
  await api.extendStay(R, { nights: 1 }, res('Phạm Huy').version, newIdempotencyKey());
  // P4-32 / BUG-R3-024: H16 runs on the new departure day of the stay (before it the page points to Trả sớm).
  await onDepartureDay(R);
  return r;
}

describe('s4-144 – H16 minibar prefill race', () => {
  it('"Tiếp tục" pressed in the very commit that shows the cabinet sends the prefilled count, never a full cabinet', async () => {
    const r = await countedThenExtended();
    const release = holdStandard();
    const counts = capture();
    // What CI hit (1 in 30 under load): React's scheduler ran out of its 5 ms slice right after committing the
    // cabinet table, so the click came before the next task (the effect that filled the old prefill). Here every
    // clock read moves 10 ms, so the scheduler yields after each task, and a MutationObserver presses the button
    // in the microtask right after that commit.
    let pressed = false;
    const mo = new MutationObserver(() => {
      if (pressed) return;
      const row = screen.queryByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) });
      const btn = screen.queryByRole('button', { name: tv('co.go_extras') });
      if (!row || !btn) return;
      pressed = true;
      fireEvent.click(btn);
    });
    try {
      renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
      expect(
        await screen.findByText(tv('co.minibar_recount_title', { room: '201' })),
      ).toBeInTheDocument();
      // Watch from here: the standard is still held, so the cabinet cannot show before `release()`. Watching the
      // first page load too ran two role queries over the page on every mutation, which starved that load past the
      // wait under machine load (1 in 120 at 12 processes).
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
      let now = performance.now();
      const clock = vi.spyOn(performance, 'now').mockImplementation(() => (now += 10));
      try {
        release();
        await waitFor(() => expect(pressed).toBe(true));
      } finally {
        clock.mockRestore();
      }
      await waitFor(() => expect(counts.sent.length).toBe(1));
    } finally {
      mo.disconnect();
      counts.stop();
    }
    expect(pressed).toBe(true);
    const coca = counts.sent[0]!.lines.find((l) => l.itemId === coke.itemId)!;
    expect(coca.remainingQty).toBe(coke.standardQty - 2);
    // Nothing reversed, nothing charged twice.
    const lines = mockControl.stay.folios
      .get(r.folioId)!
      .lines.filter(
        (l) => l.category === 'minibar' && l.chargeCode === coke.itemId && l.lineState === 'posted',
      );
    expect(lines.map((l) => l.amountVnd)).toEqual([2 * coke.unitPriceVnd]);
  });

  it('while the standard is read, "Tiếp tục" waits (DS busy): pressing it neither skips the count nor sends one', async () => {
    const r = await countedThenExtended();
    const release = holdStandard();
    const counts = capture();
    renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    expect(
      await screen.findByText(tv('co.minibar_recount_title', { room: '201' })),
    ).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: tv('common.loading') });
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(tv('common.loading'));
    expect(screen.queryByRole('button', { name: tv('co.go_extras') })).toBeNull();
    fireEvent.click(btn);
    // Still on the count step (the old code went on to step 2 without a count), nothing sent.
    expect(screen.queryByLabelText(new RegExp(tv('checkout.departure_time')))).toBeNull();
    expect(counts.sent).toHaveLength(0);

    release();
    const ready = await screen.findByRole('button', { name: tv('co.go_extras') });
    expect(ready).toBeEnabled();
    expect(ready).not.toHaveAttribute('aria-busy');
    // The first frame with the cabinet already shows the prefilled count (2 used).
    const row = screen
      .getByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) })
      .closest('tr')!;
    expect(within(row).getAllByRole('cell')[1]!.textContent).toBe('2');
    expect(counts.sent).toHaveLength(0);
    counts.stop();
  });
});

describe('BUG-R4-035 – after B14, figures changed on cabinet A are never sent for cabinet B', () => {
  it("edit 402 (A), switch to 202 (B) before B is read, press at the commit that shows B → B's own prefill", async () => {
    const { kim, R, r202 } = await kimAfterB14();
    // B as the server reads it, with a housekeeping count of 2 Coca-Cola: B starts from 0 left, A was edited to 1.
    const b = (await api.getMinibarStandard(R, r202.id)).data;
    const who = 'HK Test';
    const served = {
      ...b,
      latestCheck: {
        id: 'hk-check-1',
        mode: 'checkout',
        checkedAt: new Date().toISOString(),
        checkedByName: who,
        lines: countUsing(2),
      },
    };
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    server.use(
      http.get('*/reservations/:reservationId/minibar-standard', async ({ request }) => {
        if (new URL(request.url).searchParams.get('roomId') !== r202.id) return undefined;
        await gate;
        return HttpResponse.json(served);
      }),
    );
    const counts = capture();
    const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
    const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
    const a = within(group).getByRole('button', {
      name: tv('co.minibar_cabinet_old', { room: '402' }),
    });
    await waitFor(() => expect(a).toHaveAttribute('aria-pressed', 'true'));
    const row = (
      await screen.findByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) })
    ).closest('tr')!;
    await waitFor(() => expect(within(row).getAllByRole('cell')[1]!.textContent).toBe('0'));
    // The guest drank one Coca-Cola in 402 – typed, not saved.
    await user.click(within(row).getByRole('button', { name: tv('rooms.dec') }));
    expect(within(row).getAllByRole('cell')[1]!.textContent).toBe('1');

    // Press "Tiếp tục" in the microtask right after the commit that shows B (its housekeeping line appears), with
    // the scheduler yielding after every task – the frame where the old code still held A's figures.
    let pressed = false;
    const mo = new MutationObserver(() => {
      if (pressed || !screen.queryByText(new RegExp(who))) return;
      const btn = screen.queryByRole('button', { name: tv('co.go_extras') });
      if (!btn) return;
      pressed = true;
      fireEvent.click(btn);
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    try {
      await user.click(
        within(group).getByRole('button', { name: tv('co.minibar_cabinet_room', { room: '202' }) }),
      );
      let now = performance.now();
      const clock = vi.spyOn(performance, 'now').mockImplementation(() => (now += 10));
      try {
        release();
        await waitFor(() => expect(pressed).toBe(true));
      } finally {
        clock.mockRestore();
      }
      await waitFor(() => expect(counts.sent.length).toBe(1));
    } finally {
      mo.disconnect();
      counts.stop();
    }
    const sent = counts.sent[0] as unknown as {
      roomId: string;
      lines: Array<{ itemId: string; remainingQty: number }>;
    };
    expect(sent.roomId).toBe(r202.id);
    // B's own figures (2 used → 0 left) – never A's typed 1.
    expect(sent.lines.find((l) => l.itemId === coke.itemId)!.remainingQty).toBe(
      coke.standardQty - 2,
    );
  });
});

describe('UXD FB-R4-UXD-FE-PR67-01 – the previous list is locked while another cabinet is read', () => {
  it('after B14, switching cabinet: steppers and "Tất cả còn đủ" locked, list `aria-busy`; unlocked on B\'s prefill', async () => {
    const { kim, r202 } = await kimAfterB14();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    server.use(
      http.get('*/reservations/:reservationId/minibar-standard', async ({ request }) => {
        if (new URL(request.url).searchParams.get('roomId') !== r202.id) return undefined;
        await gate;
        return undefined;
      }),
    );
    const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
    const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
    const row = (
      await screen.findByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) })
    ).closest('tr')!;
    const used = () => within(row).getAllByRole('cell')[1]!.textContent;
    const dec = () => within(row).getByRole('button', { name: tv('rooms.dec') });
    const list = () => row.closest('.table-wrap')!;
    const allFull = () => screen.getByRole('button', { name: tv('checkout.minibar.all_full') });
    await waitFor(() => expect(dec()).toBeEnabled());
    expect(list()).not.toHaveAttribute('aria-busy');
    await user.click(dec());
    expect(used()).toBe('1');

    await user.click(
      within(group).getByRole('button', { name: tv('co.minibar_cabinet_room', { room: '202' }) }),
    );
    // 202 is being read: the list on screen is still 402's – nothing on it can be changed.
    await waitFor(() => expect(list()).toHaveAttribute('aria-busy', 'true'));
    expect(dec()).toBeDisabled();
    expect(within(row).getByRole('button', { name: tv('rooms.inc') })).toBeDisabled();
    expect(allFull()).toBeDisabled();
    expect(screen.getByRole('button', { name: tv('common.loading') })).toBeDisabled();

    release();
    // 202's own figures (a full cabinet, never counted) – unlocked.
    await waitFor(() => expect(list()).not.toHaveAttribute('aria-busy'));
    const row202 = screen
      .getByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) })
      .closest('tr')!;
    expect(within(row202).getAllByRole('cell')[1]!.textContent).toBe('0');
    expect(within(row202).getByRole('button', { name: tv('rooms.dec') })).toBeEnabled();
    expect(allFull()).toBeEnabled();
    expect(screen.getByRole('button', { name: tv('co.go_extras') })).toBeEnabled();
  });
});

describe('ARC FB-R4-ARC-FE-PR67-01 – "Tiếp tục" only on the standard read for the cabinet on screen', () => {
  it('(a) the standard cannot be read: ErrorBlock + retry, "Tiếp tục" locked – no skipped count, no POST', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${todayLocal()}T11:00:00+07:00`));
    const r = res('Phạm Huy');
    server.use(
      http.get(
        '*/reservations/:reservationId/minibar-standard',
        () =>
          HttpResponse.json(
            { type: 't', title: 't', status: 500, code: 'INTERNAL_ERROR', requestId: 'r-500' },
            { status: 500, headers: { 'content-type': 'application/problem+json' } },
          ),
        { once: true },
      ),
    );
    const counts = capture();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    const retry = await screen.findByRole('button', { name: tv('common.retry') });
    const go = screen.getByRole('button', { name: tv('co.go_extras') });
    expect(go).toBeDisabled();
    expect(go).not.toHaveAttribute('aria-busy');
    fireEvent.click(go);
    // Still on step 1 (the old code went on without a count), nothing sent.
    expect(screen.queryByLabelText(new RegExp(tv('checkout.departure_time')))).toBeNull();
    expect(counts.sent).toHaveLength(0);
    // "Thử lại" reads it again: the list and the way on come back.
    await user.click(retry);
    expect(
      await screen.findByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: tv('co.go_extras') })).toBeEnabled();
    counts.stop();
  });

  it("(b) next cabinet set after `await`: the frame with cabinet B and A's read sends nothing", async () => {
    const { kim, r402 } = await kimAfterB14();
    const counts = capture();
    renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
    const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
    const a = within(group).getByRole('button', {
      name: tv('co.minibar_cabinet_old', { room: '402' }),
    });
    await waitFor(() => expect(a).toHaveAttribute('aria-pressed', 'true'));
    const go = await screen.findByRole('button', { name: tv('co.go_extras') });
    // Press again in the microtask right after the commit that names cabinet B (scheduler yielding after each
    // task) – before `useResource` has even started reading B. BUG-R4-042: 402 counted is not offered again, so B
    // is named by its own line (K11-03), in that same commit.
    const namesB = () =>
      screen.queryByText(tv('co.minibar_cabinet_counting'))?.nextElementSibling?.textContent ===
      tv('co.minibar_cabinet_room', { room: '202' });
    let pressed = false;
    const mo = new MutationObserver(() => {
      if (pressed || !namesB()) return;
      pressed = true;
      fireEvent.click(go);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });
    try {
      let now = performance.now();
      const clock = vi.spyOn(performance, 'now').mockImplementation(() => (now += 10));
      try {
        fireEvent.click(go); // count 402
        await waitFor(() => expect(pressed).toBe(true));
      } finally {
        clock.mockRestore();
      }
      // B's own read is in: the button is back.
      await screen.findByRole('button', { name: tv('co.go_extras') });
    } finally {
      mo.disconnect();
      counts.stop();
    }
    // Only the count of 402 – the press in that frame did not count 402 again (nor as "202").
    const sent = counts.sent as unknown as Array<{ roomId: string }>;
    expect(sent.map((x) => x.roomId)).toEqual([r402.id]);
  });
});

describe('ARC FB-R4-ARC-FE-PR67-03 – a later summary read never takes the page back to the old cabinet', () => {
  it('the summary priced for the time arrives after the desk picked 202 and typed: 202 and its figures stay', async () => {
    const { kim, r202 } = await kimAfterB14();
    type Due = { roomId: string; roomNo?: string; reason?: string };
    // The first summary (no time yet) is kept to answer the late one with.
    let first: { minibarUncheckedRooms?: Due[] } | undefined;
    const onMocked = ({ request, response }: { request: Request; response: Response }) => {
      const url = new URL(request.url);
      if (/\/checkout-summary$/.test(url.pathname) && !url.searchParams.get('checkoutTime'))
        void response
          .clone()
          .json()
          .then((x: typeof first) => (first ??= x));
    };
    server.events.on('response:mocked', onMocked);
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let held = false;
    server.use(
      http.get('*/reservations/:reservationId/checkout-summary', async ({ request }) => {
        if (!new URL(request.url).searchParams.get('checkoutTime')) return undefined;
        held = true;
        await gate;
        // Still lists 402 as due. 202 now says "stay_continued": the screen shows when this read is in.
        const rooms = (first!.minibarUncheckedRooms ?? []).filter((c) => c.roomId !== r202.id);
        return HttpResponse.json({
          ...first,
          minibarUncheckedRooms: [
            ...rooms,
            { roomId: r202.id, roomNo: '202', reason: 'stay_continued' },
          ],
        });
      }),
    );
    try {
      const { user } = renderApp(`/reservations/${kim.id}/check-out`, 'qa.fd');
      const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
      const a = within(group).getByRole('button', {
        name: tv('co.minibar_cabinet_old', { room: '402' }),
      });
      const b = within(group).getByRole('button', {
        name: tv('co.minibar_cabinet_room', { room: '202' }),
      });
      // BR-703-01: the old room's cabinet is offered first; the summary priced for the time is on its way.
      await waitFor(() => expect(a).toHaveAttribute('aria-pressed', 'true'));
      await waitFor(() => expect(held).toBe(true));

      // The desk counts this room's cabinet first (allowed) and types one Coca-Cola.
      await user.click(b);
      const row = (
        await screen.findByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) })
      ).closest('tr')!;
      const used = () => within(row).getAllByRole('cell')[1]!.textContent;
      const dec = () => within(row).getByRole('button', { name: tv('rooms.dec') });
      await waitFor(() => expect(row.closest('.table-wrap')).not.toHaveAttribute('aria-busy'));
      await waitFor(() => expect(dec()).toBeEnabled());
      await user.click(dec());
      expect(used()).toBe('1');

      release();
      // The late read is in (202's sentence) – or, on the old code, the page went back to 402.
      const stayContinued = tv('co.minibar_recount_body_stay_continued');
      await waitFor(() =>
        expect(
          screen.queryByText(stayContinued) !== null || a.getAttribute('aria-pressed') === 'true',
        ).toBe(true),
      );
      expect(b).toHaveAttribute('aria-pressed', 'true');
      expect(a).not.toHaveAttribute('aria-pressed', 'true');
      expect(used()).toBe('1');
      expect(screen.getByRole('button', { name: tv('co.go_extras') })).toBeEnabled();
    } finally {
      server.events.removeListener('response:mocked', onMocked);
    }
  });
});

describe('minibarPrefill', () => {
  const item = (over: Partial<MinibarStandard['items'][number]>) =>
    ({
      itemId: 'x',
      itemName: 'X',
      standardQty: 4,
      unitPriceVnd: 10_000,
      isFree: false,
      ...over,
    }) as MinibarStandard['items'][number];
  const std = (
    items: MinibarStandard['items'],
    latest?: Array<{ itemId: string; remainingQty: number }>,
  ) =>
    ({ items, latestCheck: latest ? { lines: latest } : undefined }) as unknown as MinibarStandard;

  it('folio correction > last count of the period > last count used (BUG-R2-144) > full cabinet', () => {
    expect(minibarPrefill(undefined)).toEqual({});
    expect(
      minibarPrefill(
        std(
          [
            item({ itemId: 'a', adjustedAfterLastCheck: true, folioUsedQty: 1 }),
            item({ itemId: 'b' }),
            item({ itemId: 'c', lastCheckUsedQty: 3 }),
            item({ itemId: 'd', lastCheckUsedQty: 9 }),
            item({ itemId: 'e' }),
          ],
          [
            { itemId: 'a', remainingQty: 0 },
            { itemId: 'b', remainingQty: 2 },
          ],
        ),
      ),
    ).toEqual({ a: 3, b: 2, c: 1, d: 0, e: 4 });
  });
});
