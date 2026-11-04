// v1.0.4 P4-32 (FE-B) – H16 Trả phòng:
// - GN-R4-QA-03 (QA v1.0.2 ĐK10 5.3): step 3 Bill and the result show "Đang chờ hoàn cho khách … (yêu cầu từ Trả
//   sớm)" – the open `refund` requests with reason `early_departure` of the booking (amount − refunded), read from
//   `listApprovalRequests` (no new contract field in v1.0.4).
// - BUG-R3-024 (QA 27/10, P3): opened before the departure day, the page points to Trả sớm on the booking – no
//   3 steps, no `minibar-checks` written, no B18 (which can only answer 409 "early departure first – B16").
// - UXD P432-01..03: a request still awaiting a decision adds `approvals.refund_may_decrease` in the same cell; with
//   money pending refund "Hoàn tất" is the plain `checkout.complete`; a failed read says so (`pending_refund_unavailable`).
// - ARC P432-03: the approval list mock follows the server's scope – a `pending` refund someone else asked is not in an
//   FD list (known limit v1.0.4, ARC A1 – TC-V104-CO-01b). ARC P432-04: the day before the departure, a summary that
//   cannot be read is an error with Retry, never the pointer to Trả sớm.
// The shared mock files are frozen in v1.0.4: data is set through `mockControl`, a server answer through `server.use`.
// Copy comes from the string files (UXD P4-01) through `tv`.
import type { ApprovalRequest } from '@ottimo/api-client';
import { formatLocalDate, formatNumber } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import type { MockApproval } from '../mocks/stay';
import { earlyDepartureRefundPending } from '../pages/stay/CheckOutPage';
import { renderApp, tv } from '../test/render';

const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: formatNumber('vi', n) });
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pendingLine = (n: number) => tv('checkout.pending_refund_line', { amount: money(n) });
/** The "đang chờ hoàn" sentence whatever the amount. */
const anyPendingLine = new RegExp(
  `^${esc(tv('checkout.pending_refund_line', { amount: '§' })).replace('§', '.+')}$`,
);
/** "Đã thu {amount} – hoàn tất" whatever the amount. */
const paidLabel = new RegExp(
  `^${esc(tv('co.complete_paid', { amount: '§' })).replace('§', '.+')}$`,
);
const at = (hhmm: string, day = todayLocal()) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${day}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

type User = ReturnType<typeof renderApp>['user'];

/** The H16 Folio card (`section` under the "Folio" heading). */
const folioCard = () =>
  screen.getByRole('heading', { name: tv('drawer.folio.title') }).closest('section')!;

/** Seed accounts (`mocks/seed.ts`): qa.fd (Hạnh) works this check-out, qa.fdl (Lan) is another desk account. */
const QA_FD = { id: '0192a1b0-0000-7000-8000-000000000004', name: 'Hạnh' };
const QA_FDL = { id: '0192a1b0-0000-7000-8000-000000000003', name: 'Lan' };

let seq = 0;
function request(
  r: { code: string; folioId?: string | null },
  x: Partial<MockApproval> & Pick<MockApproval, 'amountVnd' | 'reasonCode'>,
): MockApproval {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-0000003${String(seq).padStart(5, '0')}`,
    type: 'refund',
    status: 'pending',
    reservationCode: r.code,
    folioId: r.folioId ?? undefined,
    // TC-V104-CO-01 (ARC P432-01): asked by the account that runs this check-out – the server lists it to them
    requestedBy: QA_FD.name,
    requestedByUserId: QA_FD.id,
    requestedAt: new Date().toISOString(),
    refundedVnd: 0,
    requiredRole: 'manager',
    ...x,
  };
}

/**
 * Phạm Huy (201) leaves today. The nights are paid and B16 the day before left 732.000 to hand back (one pending
 * request `early_departure`). Also on the folio: an approved overpayment refund (100.000 – another reason), a rejected
 * early-departure request (closed), and an early-departure request of ANOTHER booking – none of them is counted.
 */
function afterEarlyDeparture({
  ed = 'pending',
  by = QA_FD,
}: {
  /** The early-departure request: awaiting a decision, approved (amount fixed, not paid) or paid out. */
  ed?: 'pending' | 'approved' | 'paid_out';
  by?: { id: string; name: string };
} = {}) {
  const r = rsvOf('Phạm Huy');
  const other = rsvOf('Kim Seo-yeon');
  mockControl.stay.minibarChecks.set(r.id, []);
  mockControl.stay.payments.push({
    id: 'p-room-p432',
    code: 'PT-P432',
    folioId: r.folioId,
    type: 'charge',
    method: 'cash',
    amountVnd: 2_460_000 + 832_000,
    status: 'succeeded',
    reconciliation: 'not_required',
    version: 1,
  });
  mockControl.stay.approvals.push(
    request(r, {
      amountVnd: 732_000,
      reasonCode: 'early_departure',
      requestedBy: by.name,
      requestedByUserId: by.id,
      ...(ed === 'approved' ? { status: 'approved' } : {}),
      ...(ed === 'paid_out' ? { status: 'approved', refundedVnd: 732_000 } : {}),
    }),
    request(r, { amountVnd: 100_000, reasonCode: 'overpayment', status: 'approved' }),
    request(r, { amountVnd: 900_000, reasonCode: 'early_departure', status: 'rejected' }),
    request(other, { amountVnd: 450_000, reasonCode: 'early_departure' }),
  );
  return r;
}

/** Answers of `listApprovalRequests` in this case (one per status read by `listApprovals`). */
function approvalReads() {
  const n = { count: 0 };
  const on = ({ request }: { request: Request }) => {
    if (request.method === 'GET' && /\/approval-requests$/.test(new URL(request.url).pathname))
      n.count += 1;
  };
  server.events.on('response:mocked', on);
  onTestFinished(() => {
    server.events.removeListener('response:mocked', on);
  });
  return n;
}
/** A few macrotasks for React to apply an answer that already came back. */
const settle = () => new Promise((ok) => setTimeout(ok, 30));

async function toBill(user: User) {
  await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
  await screen.findByRole('button', { name: /hoàn tất/i });
}

async function complete(user: User) {
  await user.click(await screen.findByRole('button', { name: /hoàn tất/i }));
  await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
  expect(await screen.findByText(tv('checkout.done'), { selector: 'b' })).toBeInTheDocument();
}

describe('GN-R4-QA-03 – refund still due from Trả sớm on step 3 and on the result', () => {
  it('sums the open early-departure refunds of this booking only (amount − refunded)', () => {
    const base = {
      type: 'refund',
      requestedBy: 'x',
      requestedAt: '2026-11-04T10:00:00+07:00',
      reservationCode: 'OTM-00378',
      reasonCode: 'early_departure',
    };
    const list = [
      { ...base, id: 'a', status: 'pending', amountVnd: 732_000 },
      { ...base, id: 'b', status: 'approved', amountVnd: 500_000, refundedVnd: 200_000 },
      { ...base, id: 'c', status: 'escalated', amountVnd: 10_000 },
      { ...base, id: 'd', status: 'approved', amountVnd: 300_000, refundedVnd: 300_000 },
      { ...base, id: 'e', status: 'rejected', amountVnd: 1_000_000 },
      { ...base, id: 'f', status: 'cancelled', amountVnd: 1_000_000 },
      { ...base, id: 'g', status: 'pending', amountVnd: 99_000, reasonCode: 'overpayment' },
      { ...base, id: 'h', status: 'pending', amountVnd: 77_000, reservationCode: 'OTM-00379' },
      { ...base, id: 'i', status: 'pending', amountVnd: 55_000, type: 'foc' },
    ] as ApprovalRequest[];
    expect(earlyDepartureRefundPending(list, 'OTM-00378')).toEqual({
      vnd: 732_000 + 300_000 + 10_000,
      awaitingDecision: true,
    });
    // UXD P432-01: only approved amounts (fixed) → no "may go down"; a pending request of another reason or
    // booking does not count either
    const decided = list.filter((a) => !['a', 'c'].includes(a.id));
    expect(earlyDepartureRefundPending(decided, 'OTM-00378')).toEqual({
      vnd: 300_000,
      awaitingDecision: false,
    });
    expect(earlyDepartureRefundPending(list, 'OTM-09999')).toEqual({
      vnd: 0,
      awaitingDecision: false,
    });
  });

  it('step 3 Bill: one line under "Còn phải thu" with the B16 amount; not on steps 1–2', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await screen.findByRole('button', { name: tv('co.go_extras') });
    expect(screen.queryByText(anyPendingLine)).toBeNull();
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
    await screen.findByRole('button', { name: tv('co.go_bill') });
    expect(screen.queryByText(anyPendingLine)).toBeNull();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));

    const card = folioCard();
    const line = await within(card).findByText(pendingLine(732_000));
    // under the "Còn phải thu" row of the same table, nothing paid back counted twice
    const rows = within(card).getAllByRole('row');
    const total = rows.findIndex((x) => x.textContent?.startsWith(tv('checkout.summary.balance')));
    expect(total).toBeGreaterThanOrEqual(0);
    expect(rows.indexOf(line.closest('tr')!)).toBeGreaterThan(total);
    expect(within(card).getAllByText(anyPendingLine)).toHaveLength(1);
    // UXD P432-01: still awaiting a decision → "may go down" in the SAME cell (one dashed row, not two)
    expect(within(line).getByText(tv('approvals.refund_may_decrease'))).toBeInTheDocument();
    expect(within(card).getAllByText(tv('approvals.refund_may_decrease'))).toHaveLength(1);
    // the folio owes nothing – "Đã thanh toán đủ" stays, the line only informs
    expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument();
  });

  it('result screen: the line stays under "Còn phải thu" of the settled folio', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await complete(user);
    await waitFor(() => expect(rsvOf('Phạm Huy').status).toBe('checked_out'));
    const card = folioCard();
    await waitFor(() =>
      expect(
        within(card)
          .getAllByRole('row')
          .some((x) => x.textContent?.startsWith(tv('checkout.summary.balance'))),
      ).toBe(true),
    );
    const line = await within(card).findByText(pendingLine(732_000));
    expect(within(line).getByText(tv('approvals.refund_may_decrease'))).toBeInTheDocument();
  });

  it('approved by a manager (amount fixed, not paid yet) → the line without "may go down", step 3 and result', async () => {
    at('11:00');
    // asked by another desk account: an approved refund not fully paid is in the FD payout queue (server scope)
    const r = afterEarlyDeparture({ ed: 'approved', by: QA_FDL });
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    expect(await within(folioCard()).findByText(pendingLine(732_000))).toBeInTheDocument();
    expect(screen.queryByText(tv('approvals.refund_may_decrease'))).toBeNull();
    await complete(user);
    await waitFor(() => expect(rsvOf('Phạm Huy').status).toBe('checked_out'));
    expect(await within(folioCard()).findByText(pendingLine(732_000))).toBeInTheDocument();
    await settle();
    expect(screen.queryByText(tv('approvals.refund_may_decrease'))).toBeNull();
  });

  it('TC-V104-CO-01b – known limit v1.0.4 (ARC A1): asked by another desk account, still pending → no line for FD', async () => {
    at('11:00');
    const r = afterEarlyDeparture({ by: QA_FDL });
    const reads = approvalReads();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await waitFor(() => expect(reads.count).toBe(3));
    await settle();
    // the server does not list another account's pending refund to FD/FDL (BR-522) – the mock no longer does either
    expect(screen.queryByText(anyPendingLine)).toBeNull();
    expect(screen.queryByText(tv('checkout.pending_refund_unavailable'))).toBeNull();
  });

  it('UXD P432-02: money pending refund → "Hoàn tất trả phòng" on the button and in the confirmation', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await within(folioCard()).findByText(pendingLine(732_000));
    const main = await screen.findByRole('button', { name: tv('checkout.complete') });
    expect(screen.queryByRole('button', { name: paidLabel })).toBeNull();
    await user.click(main);
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByRole('button', { name: tv('checkout.complete') }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: paidLabel })).toBeNull();
  });

  it('UXD P432-02: nothing pending refund → the paid label stays ("Đã thu … – hoàn tất")', async () => {
    at('11:00');
    const r = afterEarlyDeparture({ ed: 'paid_out' });
    const reads = approvalReads();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await waitFor(() => expect(reads.count).toBe(3));
    await settle();
    // (this folio still holds the credit the mock never paid out, so "Hoàn tất" waits for the overpayment reason –
    // only the label is checked here; the confirmation follows the same rule, see the case above)
    expect(screen.getByRole('button', { name: paidLabel })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('checkout.complete') })).toBeNull();
  });

  it('no open early-departure refund (paid out) → no line', async () => {
    at('11:00');
    const r = afterEarlyDeparture({ ed: 'paid_out' });
    const reads = approvalReads();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    // pending, escalated, approved – each status read on the server, then nothing left to hand back
    await waitFor(() => expect(reads.count).toBe(3));
    await settle();
    expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument();
    expect(screen.queryByText(anyPendingLine)).toBeNull();
  });

  it('the refund list cannot be read → the "cannot load" sentence (UXD P432-03), "Hoàn tất" not blocked', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    server.use(
      http.get('*/v1/properties/:propertyId/approval-requests', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Service unavailable', status: 500, code: 'INTERNAL' },
          { status: 500 },
        ),
      ),
    );
    const reads = approvalReads();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await waitFor(() => expect(reads.count).toBeGreaterThan(0));
    const card = folioCard();
    const note = await within(card).findByText(tv('checkout.pending_refund_unavailable'));
    // in the dashed sub row of the totals – not an alert, no retry of its own
    expect(note.closest('tr')).toHaveClass('sub');
    expect(note.closest('[role="alert"]')).toBeNull();
    expect(within(card).queryByRole('button', { name: tv('common.retry') })).toBeNull();
    expect(screen.queryByText(anyPendingLine)).toBeNull();
    // a refund may be pending – the plain label, not "Đã thu {all received}" (UXD P432-02)
    const done = screen.getByRole('button', { name: tv('checkout.complete') });
    expect(done).not.toHaveAttribute('aria-disabled', 'true');
    expect(done).toBeEnabled();
    // read again on the result – still unreadable, still said
    await complete(user);
    expect(
      await within(folioCard()).findByText(tv('checkout.pending_refund_unavailable')),
    ).toBeInTheDocument();
  });
});

describe('BUG-R3-024 – check-out page before the departure day points to Trả sớm', () => {
  /** POSTs this file watches: a minibar count or a check-out must never be sent from the pointer page. */
  const writes: string[] = [];
  const onStart = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && /\/(minibar-checks|actions\/check-out)$/.test(request.url))
      writes.push(new URL(request.url).pathname);
  };
  afterEach(() => {
    server.events.removeListener('request:start', onStart);
    writes.length = 0;
  });

  it('in house, leaving in 3 days: the sentence with the date and a link to the booking – no steps', async () => {
    server.events.on('request:start', onStart);
    const r = rsvOf('Kim Seo-yeon');
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    const dep = r.stayDepartureDate ?? r.departureDate;
    expect(dep > todayLocal()).toBe(true);
    expect(
      await screen.findByText(tv('checkout.use_early_departure', { date: formatLocalDate(dep) })),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('co.go_extras') })).toBeNull();
    expect(screen.queryByRole('list', { name: tv('checkout.steps_label') })).toBeNull();
    expect(screen.queryByRole('button', { name: /hoàn tất/i })).toBeNull();
    const back = screen.getByRole('link', { name: tv('ci.back_to_booking') });
    expect(back).toHaveAttribute('href', `/reservations/${r.id}`);
    await user.click(back);
    expect(writes).toEqual([]);
  });

  it('the post-midnight window (business day = departure − 1, calendar day = departure) keeps the 3 steps', async () => {
    at('03:00');
    const r = rsvOf('Phạm Huy');
    expect(r.departureDate).toBe(todayLocal());
    renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    expect(await screen.findByRole('button', { name: tv('co.go_extras') })).toBeInTheDocument();
    expect(screen.queryByText(/^Hôm nay chưa tới ngày đi/)).toBeNull();
  });

  it('ARC P432-04: the day before the departure, summary unreadable → error with Retry, never the pointer', async () => {
    server.events.on('request:start', onStart);
    // 03:00 on the departure date: business day = departure − 1 – only the summary can say "post-midnight window"
    at('03:00');
    const r = rsvOf('Phạm Huy');
    expect(r.departureDate).toBe(todayLocal());
    server.use(
      http.get(
        '*/v1/properties/:propertyId/reservations/:reservationId/checkout-summary',
        () =>
          HttpResponse.json(
            { type: 'about:blank', title: 'Internal error', status: 500, code: 'INTERNAL' },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    expect(await screen.findByText(tv('co.error_title'))).toBeInTheDocument();
    expect(screen.queryByText(/^Hôm nay chưa tới ngày đi/)).toBeNull();
    expect(screen.queryByRole('link', { name: tv('ci.back_to_booking') })).toBeNull();
    // Retry reads the summary again: it says post-midnight window → the 3 steps
    await user.click(screen.getByRole('button', { name: tv('common.retry') }));
    expect(await screen.findByRole('button', { name: tv('co.go_extras') })).toBeInTheDocument();
    expect(screen.queryByText(/^Hôm nay chưa tới ngày đi/)).toBeNull();
    expect(writes).toEqual([]);
  });

  it('ARC P432-04: the day before the departure, summary read and not post-midnight → the pointer', async () => {
    const r = rsvOf('Phạm Huy');
    const dep = r.stayDepartureDate ?? r.departureDate;
    at('15:00', addDays(dep, -1));
    renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    expect(
      await screen.findByText(tv('checkout.use_early_departure', { date: formatLocalDate(dep) })),
    ).toBeInTheDocument();
    expect(screen.queryByText(tv('co.error_title'))).toBeNull();
  });

  it('B18 answers 409 INVALID_TRANSITION (stay extended meanwhile) → the page turns into the pointer', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    // another desk extended the stay by one night while this page was open
    const later = addDays(r.departureDate, 1);
    r.departureDate = later;
    server.use(
      http.post('*/v1/properties/:propertyId/reservations/:reservationId/actions/check-out', () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Invalid transition',
            status: 409,
            code: 'INVALID_TRANSITION',
            currentState: 'in_house',
            detail: 'check-out on the departure business day (early departure first – B16)',
          },
          { status: 409 },
        ),
      ),
    );
    await user.click(screen.getByRole('button', { name: /hoàn tất/i }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    const dep = rsvOf('Phạm Huy').stayDepartureDate ?? later;
    expect(
      await screen.findByText(tv('checkout.use_early_departure', { date: formatLocalDate(dep) })),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hoàn tất/i })).toBeNull();
  });
});
