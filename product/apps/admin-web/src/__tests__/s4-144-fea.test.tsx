// Sprint 4 – FE-A, phần Desk của BUG-R2-144 (DOM (b), BR-703-02; ARC 16.13): tủ khách quay lại hoặc gia hạn sau khi đã
// đếm là "chưa đếm" – H16 bước 1 cho đếm lại (kỳ mới hoặc tiếp kỳ cũ) mà không tính trùng; N-1 (NÊN): cảnh báo khi hủy
// dòng minibar đang có miễn/giảm.
import { newIdempotencyKey } from '@ottimo/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, setCsrfToken } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { MINIBAR } from '../mocks/stay';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

function capture(method: string, re: RegExp) {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== method || !re.test(new URL(request.url).pathname)) return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

const coke = MINIBAR[0]!;
/** A count where only Coca-Cola was used (`used` of 2). */
const countUsing = (used: number) =>
  MINIBAR.map((m) => ({
    itemId: m.itemId,
    remainingQty: m.itemId === coke.itemId ? m.standardQty - used : m.standardQty,
  }));
const cokeLines = (folioId: string) =>
  mockControl.stay.folios
    .get(folioId)!
    .lines.filter(
      (l) => l.category === 'minibar' && l.chargeCode === coke.itemId && l.lineState === 'posted',
    );

describe('BUG-R2-144 – tủ đã đếm phải đếm lại (BR-703-02)', () => {
  it('gia hạn sau khi đã đếm (DOM (b)): tủ vào lại minibarUncheckedRooms, H16 báo đếm lại, điền sẵn theo lần đếm trước, không tính trùng', async () => {
    at('11:00');
    const r = res('Phạm Huy');
    const R = { propertyId: PROPERTY_ID, reservationId: r.id };
    mockControl.signInAs('qa.fd');
    setCsrfToken(mockControl.db.csrf);
    // ARC 16.14: never counted in the stay yet.
    expect((await api.getCheckoutSummary(R)).data.minibarUncheckedRooms).toEqual([
      { roomId: r.segments![0]!.roomId, roomNo: '201', reason: 'never_counted' },
    ]);
    await api.recordMinibarCheck(
      R,
      { mode: 'checkout', lines: countUsing(2) },
      newIdempotencyKey(),
    );
    expect(cokeLines(r.folioId)).toHaveLength(1);
    expect((await api.getCheckoutSummary(R)).data.minibarUncheckedRooms).toBeUndefined();
    // B13 after the count – the cabinet is due again before B18.
    await api.extendStay(R, { nights: 1 }, res('Phạm Huy').version, newIdempotencyKey());
    const sum = (await api.getCheckoutSummary(R)).data;
    expect(sum.minibarUncheckedRooms).toEqual([
      { roomId: r.segments![0]!.roomId, roomNo: '201', reason: 'stay_continued' },
    ]);
    expect(sum.blockers).toContain('minibar_not_checked');

    const counts = capture('POST', /\/minibar-checks$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    expect(
      await screen.findByText(tv('co.minibar_recount_title', { room: '201' })),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('co.minibar_recount_body'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
    await waitFor(() => expect(counts.sent.length).toBe(1));
    counts.stop();
    // Prefilled from the last count (2 used) – not a full cabinet ("nothing used" would reverse the 2).
    const lines = counts.sent[0]!.lines as Array<{ itemId: string; remainingQty: number }>;
    expect(lines.find((l) => l.itemId === coke.itemId)!.remainingQty).toBe(0);
    // Same number confirmed → the line stays, nothing charged twice; the cabinet is counted again.
    expect(cokeLines(r.folioId)).toHaveLength(1);
    expect(cokeLines(r.folioId)[0]!.amountVnd).toBe(2 * coke.unitPriceVnd);
    expect(
      await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
    ).toBeInTheDocument();
    expect((await api.getCheckoutSummary(R)).data.minibarUncheckedRooms).toBeUndefined();
  });

  it('B14 về lại căn đã đếm (đã bổ sung): kỳ mới – đếm lại tủ 201, dòng kỳ trước giữ nguyên, kỳ mới ghi dòng riêng', async () => {
    at('11:00');
    const r = res('Phạm Huy');
    const R = { propertyId: PROPERTY_ID, reservationId: r.id };
    const rooms = mockControl.db.rooms;
    const r201 = rooms.find((x) => x.roomNo === '201')!;
    const r203 = rooms.find((x) => x.roomNo === '203')!;
    mockControl.stay.roomStatus['203'] = 'VC';
    mockControl.signInAs('qa.fd');
    setCsrfToken(mockControl.db.csrf);
    await api.recordMinibarCheck(
      R,
      { mode: 'checkout', lines: countUsing(2) },
      newIdempotencyKey(),
    );
    await api.changeRoom(
      R,
      {
        newRoomId: r203.id,
        cause: 'property_fault',
        reason: 'Điều hòa hỏng',
        effectiveDate: todayLocal(),
      },
      res('Phạm Huy').version,
      newIdempotencyKey(),
    );
    await api.recordMinibarCheck(
      R,
      { mode: 'checkout', lines: countUsing(0) },
      newIdempotencyKey(),
    );
    mockControl.stay.roomStatus['201'] = 'VC';
    await api.changeRoom(
      R,
      {
        newRoomId: r201.id,
        cause: 'property_fault',
        reason: 'Điều hòa đã sửa',
        effectiveDate: todayLocal(),
      },
      res('Phạm Huy').version,
      newIdempotencyKey(),
    );
    const sum = (await api.getCheckoutSummary(R)).data;
    expect(sum.minibarUncheckedRooms).toEqual([
      { roomId: r201.id, roomNo: '201', reason: 'stay_continued' },
    ]);

    const counts = capture('POST', /\/minibar-checks$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    // `stay_continued` with nothing of this period yet: the sentence comes from `reason` alone.
    expect(
      await screen.findByText(tv('co.minibar_recount_title', { room: '201' })),
    ).toBeInTheDocument();
    // A new refill period: a full cabinet; the guest used one more Coca-Cola.
    const row = (
      await screen.findByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) })
    ).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: tv('rooms.dec') }));
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
    await waitFor(() => expect(counts.sent.length).toBe(1));
    counts.stop();
    expect(counts.sent[0]!.roomId).toBeUndefined();
    const lines = counts.sent[0]!.lines as Array<{ itemId: string; remainingQty: number }>;
    expect(lines.find((l) => l.itemId === coke.itemId)!.remainingQty).toBe(coke.standardQty - 1);
    // The 2 of the first period stay; the new period adds 1 – never reversed, never counted twice.
    expect(cokeLines(r.folioId).map((l) => l.amountVnd)).toEqual([
      2 * coke.unitPriceVnd,
      coke.unitPriceVnd,
    ]);
    expect(
      await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
    ).toBeInTheDocument();
  });

  it('`new_fill` (kỳ mới sau lần nạp, R3) → câu "cần đếm lại", tủ đủ; `never_counted` → không có câu đó', async () => {
    at('11:00');
    const r = res('Phạm Huy');
    const key = `${r.id}:${r.segments![0]!.roomId}`;
    // Counted (2 used), then refilled mid-stay with no stay event: a new period to count.
    mockControl.stay.minibarChecks.set(r.id, countUsing(2));
    mockControl.stay.minibarPeriods.set(key, 1);
    mockControl.stay.minibarChecks.delete(r.id);
    mockControl.stay.minibarNewFill.add(key);
    const counts = capture('POST', /\/minibar-checks$/);
    const { user, unmount } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    expect(
      await screen.findByText(tv('co.minibar_recount_title', { room: '201' })),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
    await waitFor(() => expect(counts.sent.length).toBe(1));
    counts.stop();
    const lines = counts.sent[0]!.lines as Array<{ itemId: string; remainingQty: number }>;
    expect(lines.find((l) => l.itemId === coke.itemId)!.remainingQty).toBe(coke.standardQty);
    expect(mockControl.stay.minibarNewFill.has(key)).toBe(false);
    unmount();

    // Another stay, never counted: the usual first count, no "count again" sentence.
    const other = res('Phạm Huy');
    mockControl.stay.minibarPeriods.delete(key);
    mockControl.stay.minibarChecks.delete(other.id);
    renderApp(`/reservations/${other.id}/check-out`, 'qa.fd');
    await screen.findByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) });
    // The summary (with `reason`) is in too before looking for the sentence.
    await screen.findByRole('row', {
      name: new RegExp(`^${tv('checkout.summary.balance')}\\s*\\d`),
    });
    expect(screen.queryByText(tv('co.minibar_recount_title', { room: '201' }))).toBeNull();
  });
});

describe('N-1 (NÊN) – hủy dòng minibar đang có miễn/giảm', () => {
  it('tick "Hủy dòng" trên dòng bia có FOC 35.000 → cảnh báo miễn/giảm tạm ngưng và bị hủy khi chốt; dòng khác không cảnh báo', async () => {
    const r = res('Phạm Huy');
    const folio = mockControl.stay.folios.get(r.folioId)!;
    const now = new Date().toISOString();
    folio.lines.push(
      {
        id: 'mb-beer',
        category: 'minibar',
        description: 'minibar Bia Đà Lạt x2',
        labelKey: 'bill.line.minibar',
        labelParams: { item: 'Bia Đà Lạt', qty: 2 },
        quantity: 2,
        unitPriceVnd: 35_000,
        amountVnd: 70_000,
        lineState: 'posted',
        chargeCode: 'MB-BEER',
        postedAt: now,
      },
      {
        id: 'foc-beer',
        category: 'foc',
        description: 'foc mb-beer',
        labelKey: 'bill.line.foc',
        labelParams: { reason: 'service_recovery' },
        quantity: 1,
        unitPriceVnd: -35_000,
        amountVnd: -35_000,
        lineState: 'posted',
        relatedLineId: 'mb-beer',
        postedAt: now,
      },
    );
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', { name: /^Folio · / });
    const row = (await within(dlg).findByText(/Bia Đà Lạt/)).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: tv('folio.adjust') }));
    const box = await screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
    const warn = tv('folio.void_minibar_foc', { amount: money(35_000) });
    expect(within(box).queryByText(warn)).not.toBeInTheDocument();
    await user.click(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') }));
    expect(within(box).getByText(warn)).toBeInTheDocument();
    await user.click(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') }));
    expect(within(box).queryByText(warn)).not.toBeInTheDocument();
  });

  it('hai món trùng tên trên bill nhưng khác mã: chỉ dòng cùng `chargeCode` với dòng có FOC mới cảnh báo', async () => {
    const r = res('Phạm Huy');
    const folio = mockControl.stay.folios.get(r.folioId)!;
    const now = new Date().toISOString();
    const beer = (id: string, chargeCode: string, qty: number) => ({
      id,
      category: 'minibar',
      description: `minibar Bia x${qty}`,
      labelKey: 'bill.line.minibar',
      labelParams: { item: 'Bia', qty },
      quantity: qty,
      unitPriceVnd: 35_000,
      amountVnd: 35_000 * qty,
      lineState: 'posted' as const,
      chargeCode,
      postedAt: now,
    });
    folio.lines.push(
      // Same name "Bia", two items: the bottle (with a waiver on its first line) and the can.
      beer('bottle-1', 'MB-BEER-BOTTLE', 1),
      beer('bottle-2', 'MB-BEER-BOTTLE', 2),
      beer('can-1', 'MB-BEER-CAN', 3),
      {
        id: 'foc-bottle',
        category: 'foc',
        description: 'foc bottle-1',
        labelKey: 'bill.line.foc',
        labelParams: { reason: 'service_recovery' },
        quantity: 1,
        unitPriceVnd: -35_000,
        amountVnd: -35_000,
        lineState: 'posted',
        relatedLineId: 'bottle-1',
        postedAt: now,
      },
    );
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', { name: /^Folio · / });
    const warn = tv('folio.void_minibar_foc', { amount: money(35_000) });
    const voidAndCheck = async (qtyText: RegExp, expected: boolean) => {
      const row = (await within(dlg).findByText(qtyText)).closest('tr')!;
      await user.click(within(row).getByRole('button', { name: tv('folio.adjust') }));
      const box = await screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
      await user.click(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') }));
      if (expected) expect(within(box).getByText(warn)).toBeInTheDocument();
      else expect(within(box).queryByText(warn)).toBeNull();
      await user.click(within(box).getByRole('button', { name: tv('common.cancel') }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: /^Điều chỉnh:/ })).toBeNull(),
      );
    };
    // The can shares the name, not the code → no warning; the second bottle line shares the code → warning.
    await voidAndCheck(/Bia × 3/, false);
    await voidAndCheck(/Bia × 2/, true);
  });
});
