// v1.0.4 P4-32 (FE-B) – H16 Trả phòng:
// - GN-R4-QA-03 (QA v1.0.2 ĐK10 5.3): step 3 Bill and the result show "Đang chờ hoàn cho khách … (yêu cầu từ Trả
//   sớm)" – the open `refund` requests with reason `early_departure` of the booking (amount − refunded), read from
//   `listApprovalRequests` (no new contract field in v1.0.4).
// - BUG-R3-024 (QA 27/10, P3): opened before the departure day, the page points to Trả sớm on the booking – no
//   3 steps, no `minibar-checks` written, no B18 (which can only answer 409 "early departure first – B16").
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
import { earlyDepartureRefundPendingVnd } from '../pages/stay/CheckOutPage';
import { renderApp, tv } from '../test/render';

const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: formatNumber('vi', n) });
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pendingLine = (n: number) => tv('checkout.pending_refund_line', { amount: money(n) });
/** The "đang chờ hoàn" sentence whatever the amount. */
const anyPendingLine = new RegExp(
  `^${esc(tv('checkout.pending_refund_line', { amount: '§' })).replace('§', '.+')}$`,
);
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

type User = ReturnType<typeof renderApp>['user'];

/** The H16 Folio card (`section` under the "Folio" heading). */
const folioCard = () =>
  screen.getByRole('heading', { name: tv('drawer.folio.title') }).closest('section')!;

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
    requestedBy: 'Hạnh',
    // made by another desk account – the mock lists every refund to FD+ (see the report: the server's FD scope)
    requestedByUserId: '00000000-0000-4000-8000-000000000003',
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
function afterEarlyDeparture({ edPaidOut = false } = {}) {
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
      ...(edPaidOut ? { status: 'approved', refundedVnd: 732_000 } : {}),
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
    expect(earlyDepartureRefundPendingVnd(list, 'OTM-00378')).toBe(732_000 + 300_000 + 10_000);
    expect(earlyDepartureRefundPendingVnd(list, 'OTM-09999')).toBe(0);
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
    expect(await within(card).findByText(pendingLine(732_000))).toBeInTheDocument();
  });

  it('no open early-departure refund (paid out) → no line', async () => {
    at('11:00');
    const r = afterEarlyDeparture({ edPaidOut: true });
    const reads = approvalReads();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    // pending, escalated, approved – each status read on the server, then nothing left to hand back
    await waitFor(() => expect(reads.count).toBe(3));
    await settle();
    expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument();
    expect(screen.queryByText(anyPendingLine)).toBeNull();
  });

  it('the refund list cannot be read → no line, "Hoàn tất" not blocked', async () => {
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
    await settle();
    expect(screen.queryByText(anyPendingLine)).toBeNull();
    expect(screen.getByRole('button', { name: /hoàn tất/i })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
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
