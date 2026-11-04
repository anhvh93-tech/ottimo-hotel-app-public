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
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    try {
      renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
      expect(
        await screen.findByText(tv('co.minibar_recount_title', { room: '201' })),
      ).toBeInTheDocument();
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${todayLocal()}T11:00:00+07:00`));
    const kim = res('Kim Seo-yeon');
    res('Nguyễn Văn An').status = 'cancelled'; // frees 202
    mockControl.stay.roomStatus['202'] = 'VC';
    const R = { propertyId: PROPERTY_ID, reservationId: kim.id };
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
