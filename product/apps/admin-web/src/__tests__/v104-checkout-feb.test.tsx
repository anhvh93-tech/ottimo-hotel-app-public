// v1.0.4 P4-32 (FE-B) – H16 Trả phòng, v1.0.5 V5-13 (FE-3):
// - GN-R4-QA-03 → V5-13 (ARC A1 (b), contract 0.3.13 `openRefunds`; UXD copy-v1.0.5 9.12): step 3 Bill and the result
//   show under "Còn phải thu" what OTTIMO still owes the guest back – the total ("Đang chờ hoàn cho khách"), one row per
//   reason group, then "may go down at approval". Every reason and every request of the stay, whoever asked it – read
//   from the server's field (check-out summary on step 3, settled folio on the result), no `listApprovalRequests`.
// - BUG-R3-024 (QA 27/10, P3): opened before the departure day, the page points to Trả sớm on the booking – no
//   3 steps, no `minibar-checks` written, no B18 (which can only answer 409 "early departure first – B16").
// - UXD P432-02: with money pending refund "Hoàn tất" is the plain `checkout.complete`; U5: no field (older server)
//   says so (`pending_refund_unavailable`), never "nothing pending".
// - ARC P432-03 / T13-6: the mock follows the server – a pending refund someone else asked IS in `openRefunds` (it
//   was the known limit TC-V104-CO-01b of v1.0.4). ARC P432-04: the day before the departure, a summary that cannot
//   be read is an error with Retry, never the pointer to Trả sớm.
// Data is set through `mockControl`, a server answer through `server.use`. Copy comes from the string files through `tv`.
import { formatLocalDate, formatNumber } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { getResponse, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { handlers, mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import type { MockApproval } from '../mocks/stay';
import { renderApp, tv } from '../test/render';

const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const num = (n: number) => formatNumber('vi', n);
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

/** The cells of a table row, as text. */
const cells = (tr: Element) => [...tr.querySelectorAll('td')].map((td) => td.textContent ?? '');

/**
 * The refund rows of the card: the "Đang chờ hoàn cho khách" row and the rows after it, as [label, amount] – the
 * one-cell "may go down" row as [text].
 */
function refundRows(card: HTMLElement) {
  const rows = within(card).getAllByRole('row');
  const total = rows.findIndex((x) => x.textContent?.startsWith(tv('checkout.summary.balance')));
  const head = rows.findIndex((x) => cells(x)[0] === tv('folio.open_refunds_total'));
  return { total, head, rows: head < 0 ? [] : rows.slice(head).map(cells) };
}

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
 * request `early_departure`). With `others`, also on the folio: an approved overpayment refund (100.000 – another
 * reason, counted since V5-13), a rejected early-departure request (closed) – and an early-departure request of
 * ANOTHER booking (another folio). Neither of the last two is counted.
 */
function afterEarlyDeparture({
  ed = 'pending',
  by = QA_FD,
  others = true,
}: {
  /** The early-departure request: awaiting a decision, approved (amount fixed, not paid) or paid out. */
  ed?: 'pending' | 'approved' | 'paid_out';
  by?: { id: string; name: string };
  others?: boolean;
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
    ...(others
      ? [
          request(r, { amountVnd: 100_000, reasonCode: 'overpayment', status: 'approved' }),
          request(r, { amountVnd: 900_000, reasonCode: 'early_departure', status: 'rejected' }),
          request(other, { amountVnd: 450_000, reasonCode: 'early_departure' }),
        ]
      : []),
  );
  return r;
}

/** Answers of `listApprovalRequests` while this case runs – the page no longer reads it (ARC A1 (b)). */
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

/** An older server (before 0.3.13): the mock's answer without `openRefunds` (summary, or the folio totals). */
function withoutOpenRefunds() {
  server.use(
    http.get(
      '*/v1/properties/:propertyId/reservations/:reservationId/checkout-summary',
      async ({ request }) => {
        const res = await getResponse(handlers, request);
        const body = (await res!.json()) as Record<string, unknown>;
        delete body.openRefunds;
        return HttpResponse.json(body, { status: res!.status });
      },
    ),
    http.get('*/v1/properties/:propertyId/folios/:folioId', async ({ request }) => {
      const res = await getResponse(handlers, request);
      const body = (await res!.json()) as { totals?: Record<string, unknown> };
      delete body.totals?.openRefunds;
      return HttpResponse.json(body, { status: res!.status, headers: res!.headers });
    }),
  );
}

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

/** The rows V5-13 expects for `afterEarlyDeparture()` (732.000 early departure + 100.000 overpayment). */
const BOTH = [
  [tv('folio.open_refunds_total'), num(832_000)],
  [tv('audit.reason.early_departure'), num(732_000)],
  [tv('audit.reason.overpayment'), num(100_000)],
  [tv('folio.open_refunds_may_decrease')],
];

describe('GN-R4-QA-03, V5-13 – refund still due on step 3 and on the result (server `openRefunds`)', () => {
  it('step 3 Bill: the total and one row per reason under "Còn phải thu" – every reason, this stay only; not on steps 1–2', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    const reads = approvalReads();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await screen.findByRole('button', { name: tv('co.go_extras') });
    expect(screen.queryByText(tv('folio.open_refunds_total'))).toBeNull();
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
    await screen.findByRole('button', { name: tv('co.go_bill') });
    expect(screen.queryByText(tv('folio.open_refunds_total'))).toBeNull();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));

    const card = folioCard();
    await within(card).findByText(tv('folio.open_refunds_total'));
    const { total, head, rows } = refundRows(card);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(head).toBeGreaterThan(total);
    // the rejected request and the other booking's request are not counted; groups in the fixed order (UXD 9.12)
    expect(rows).toEqual(BOTH);
    // the group rows and the note are dashed sub rows; the note is said once
    const trs = within(card).getAllByRole('row').slice(head);
    expect(trs.slice(1).every((x) => x.classList.contains('sub'))).toBe(true);
    expect(within(card).getAllByText(tv('folio.open_refunds_may_decrease'))).toHaveLength(1);
    // UXD-134-01: not the approval queue's per-request line ("yêu cầu này") under a total of several requests
    expect(within(card).queryByText(tv('approvals.refund_may_decrease'))).toBeNull();
    // the folio owes nothing – "Đã thanh toán đủ" stays, the rows only inform; the queue is never read for this
    expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument();
    await settle();
    expect(reads.count).toBe(0);
  });

  it('result screen: the same rows under "Còn phải thu" of the settled folio (`Folio.totals.openRefunds`)', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await complete(user);
    await waitFor(() => expect(rsvOf('Phạm Huy').status).toBe('checked_out'));
    const card = folioCard();
    await within(card).findByText(tv('folio.open_refunds_total'));
    const { total, head, rows } = refundRows(card);
    expect(head).toBeGreaterThan(total);
    expect(rows).toEqual(BOTH);
  });

  it('V5-13 / T13-1 (was the known limit TC-V104-CO-01b): asked by another desk account and still pending → FD sees it', async () => {
    at('11:00');
    const r = afterEarlyDeparture({ by: QA_FDL, others: false });
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const card = folioCard();
    await within(card).findByText(tv('folio.open_refunds_total'));
    expect(refundRows(card).rows).toEqual([
      [tv('folio.open_refunds_total'), num(732_000)],
      [tv('audit.reason.early_departure'), num(732_000)],
      [tv('folio.open_refunds_may_decrease')],
    ]);
    expect(screen.queryByText(tv('checkout.pending_refund_unavailable'))).toBeNull();
  });

  it('UXD P432-02: money pending refund → "Hoàn tất trả phòng" on the button and in the confirmation', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await within(folioCard()).findByText(tv('folio.open_refunds_total'));
    const main = await screen.findByRole('button', { name: tv('checkout.complete') });
    expect(screen.queryByRole('button', { name: paidLabel })).toBeNull();
    await user.click(main);
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByRole('button', { name: tv('checkout.complete') }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: paidLabel })).toBeNull();
  });

  it('UXD P432-02: nothing pending refund (paid out) → no rows, the paid label stays ("Đã thu … – hoàn tất")', async () => {
    at('11:00');
    const r = afterEarlyDeparture({ ed: 'paid_out', others: false });
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await settle();
    expect(screen.queryByText(tv('folio.open_refunds_total'))).toBeNull();
    expect(screen.queryByText(tv('folio.open_refunds_may_decrease'))).toBeNull();
    expect(screen.queryByText(tv('checkout.pending_refund_unavailable'))).toBeNull();
    // (this folio still holds the credit the mock never paid out, so "Hoàn tất" waits for the overpayment reason –
    // only the label is checked here; the confirmation follows the same rule, see the case above)
    expect(screen.getByRole('button', { name: paidLabel })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('checkout.complete') })).toBeNull();
  });

  it('UXD U5: an older server without `openRefunds` → the "cannot load" sentence, never "nothing pending"; "Hoàn tất" not blocked', async () => {
    at('11:00');
    const r = afterEarlyDeparture();
    withoutOpenRefunds();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const card = folioCard();
    const note = await within(card).findByText(tv('checkout.pending_refund_unavailable'));
    // in the dashed sub row of the totals – not an alert, no retry of its own
    expect(note.closest('tr')).toHaveClass('sub');
    expect(note.closest('[role="alert"]')).toBeNull();
    expect(within(card).queryByRole('button', { name: tv('common.retry') })).toBeNull();
    expect(screen.queryByText(tv('folio.open_refunds_total'))).toBeNull();
    // a refund may be pending – the plain label, not "Đã thu {all received}" (UXD P432-02)
    const done = screen.getByRole('button', { name: tv('checkout.complete') });
    expect(done).not.toHaveAttribute('aria-disabled', 'true');
    expect(done).toBeEnabled();
    // the result reads the folio – no field there either: still said
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
