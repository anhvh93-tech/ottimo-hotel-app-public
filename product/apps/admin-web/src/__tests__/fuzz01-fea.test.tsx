// FB-R3-ARC-FUZZ-01 (OpenAPI 0.3.8 bổ sung 3, BR-522 K11-06): money left on a SETTLED folio after check-out can
// be asked back with `createRefundRequest` (also while J15 waits – `waiting_refund`); a `closed` folio has none
// (I4) → no button, 409 on the server. "Cần chú ý" `closed_reservation_credit` leads to that booking.
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ngọc Anh (checked out) – settled folio paid 250.000 over its total (a QR that came back late). */
function withCredit(extra = 250_000) {
  const r = res('Ngọc Anh');
  expect(r.status).toBe('checked_out');
  const f = mockControl.stay.folios.get(r.folioId)!;
  f.status = 'settled';
  const total = f.lines
    .filter((l) => l.lineState === 'posted')
    .reduce((a, l) => a + l.amountVnd, 0);
  const paid = mockControl.stay.payments
    .filter((p) => p.folioId === r.folioId && p.status === 'succeeded' && p.type === 'charge')
    .reduce((a, p) => a + p.amountVnd, 0);
  mockControl.stay.payments.push({
    id: 'p-late-qr',
    code: 'PT-LATE',
    folioId: r.folioId,
    type: 'charge',
    method: 'bank_transfer',
    amountVnd: total - paid + extra,
    status: 'succeeded',
    reconciliation: 'not_required',
    version: 1,
  });
  r.balanceDueVnd = 0;
  return { r, f };
}

function capture(re: RegExp) {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'POST' || !re.test(new URL(request.url).pathname)) return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

const requestButton = () =>
  new RegExp(`^${esc(tv('refund.request_overpayment', { amount: '§' })).replace('§', '.+')}$`);

describe('FUZZ-01 – đề nghị hoàn trên folio đã chốt', () => {
  it('settled folio with money left → note + "Đề nghị hoàn" for the part not asked yet → request sent, item gone', async () => {
    const { r } = withCredit(250_000);
    const sent = capture(/\/folios\/[^/]+\/refund-requests$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    expect(
      await within(d).findByText(tv('refund.settled_credit', { amount: money(250_000) })),
    ).toBeInTheDocument();
    await user.click(within(d).getByRole('button', { name: requestButton() }));
    const box = await screen.findByRole('dialog', {
      name: tv('refund.request_overpayment', { amount: money(250_000) }),
    });
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('ci.reason'))}`)),
      'QR về sau khi trả phòng',
    );
    await user.click(within(box).getByRole('button', { name: requestButton() }));
    expect(await screen.findByText(tv('refund.requested'))).toBeInTheDocument();
    sent.stop();
    expect(sent.sent[0]).toMatchObject({ amountVnd: 250_000 });
    const a = mockControl.stay.approvals.find(
      (x) => x.type === 'refund' && x.folioId === r.folioId,
    );
    expect(a).toMatchObject({ amountVnd: 250_000, reasonCode: 'overpayment', status: 'pending' });
  });

  it('above the cap → 422 REFUND_EXCEEDS_APPROVED, the maximum shown under the amount', async () => {
    const { r } = withCredit(250_000);
    // Part of the credit already has an open request → only 100.000 left to ask.
    mockControl.stay.approvals.push({
      id: 'rf-open',
      type: 'refund',
      status: 'pending',
      reservationCode: r.code,
      folioId: r.folioId,
      amountVnd: 150_000,
      reasonCode: 'overpayment',
      requestedBy: 'Hạnh',
      requestedByUserId: mockControl.db.users.find((u) => u.username === 'qa.fd')!.id,
      requestedAt: new Date().toISOString(),
      refundedVnd: 0,
      version: 1,
    });
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: requestButton() }));
    const box = await screen.findByRole('dialog', {
      name: tv('refund.request_overpayment', { amount: money(100_000) }),
    });
    const amount = within(box).getByLabelText(new RegExp(`^${esc(tv('co.amount'))}`));
    await user.clear(amount);
    await user.type(amount, '200000');
    await user.type(within(box).getByLabelText(new RegExp(`^${esc(tv('ci.reason'))}`)), 'Hoàn dư');
    await user.click(within(box).getByRole('button', { name: requestButton() }));
    expect(
      await within(box).findByText(tv('error.REFUND_EXCEEDS_APPROVED', { max: money(100_000) })),
    ).toBeInTheDocument();
    expect(amount).toHaveAttribute('aria-invalid', 'true');
  });

  it('closed folio → no button; the server answers 409 FOLIO_LOCKED', async () => {
    const { r, f } = withCredit(250_000);
    f.status = 'closed';
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await within(d).findByText(tv('drawer.folio.balance'));
    expect(within(d).queryByRole('button', { name: requestButton() })).toBeNull();
    expect(
      within(d).queryByText(tv('refund.settled_credit', { amount: money(250_000) })),
    ).toBeNull();
    mockControl.signInAs('qa.fd');
    const out = await fetch(
      `http://localhost/v1/properties/${PROPERTY_ID}/folios/${r.folioId}/refund-requests`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': mockControl.db.csrf,
          'idempotency-key': crypto.randomUUID(),
        },
        body: JSON.stringify({ amountVnd: 1_000, reason: 'test' }),
      },
    );
    expect(out.status).toBe(409);
    expect((await out.json()).code).toBe('FOLIO_LOCKED');
  });

  it('"Cần chú ý" closed_reservation_credit leads to that booking, where the request is made', async () => {
    const { r } = withCredit(250_000);
    const { user } = renderApp('/today', 'qa.fd');
    const line = await screen.findByText(tv('attn.closed_reservation_credit', { code: r.code }));
    const row = line.closest('li') as HTMLElement;
    await user.click(within(row).getByRole('link'));
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    expect(await within(d).findByRole('button', { name: requestButton() })).toBeInTheDocument();
  });
});
