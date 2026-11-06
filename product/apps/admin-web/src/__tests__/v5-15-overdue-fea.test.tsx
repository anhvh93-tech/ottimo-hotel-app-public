// V5-15 (OpenAPI 0.3.13 `checkOut` bổ sung 1, contract 1.4 + 1.18; BE #99; DOM rules-v1.0.5 7.1, 15.3, 15.4, 15.7;
// UXD copy-v1.0.5 9.9 + UXD-on-fe-prs-125-128 mục 3) – H16 "Trả phòng quá ngày đi". The SERVER says who may record it:
// `allowedActions` check_out `overdue` (OWN; MGR while ≤ 1 night) opens the box; otherwise the summary's
// `nightsNotBilled` says whom to call; a 403 `requiredRole: owner` on B18 says it too. B18 then carries the server's
// `checkoutAt` (a time on the departure day) and `overdueReason` – no time note, no extra night, no one-night fee.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { canCheckOutOverdue, overdueNights } from '../mocks/overdue';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const iso = (hhmm: string, day = todayLocal()) => `${day}T${hhmm}:00+07:00`;
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(iso(hhmm)));
};
afterEach(() => vi.useRealTimers());

const huy = () => mockControl.rsv.reservations.find((r) => r.guestName === 'Phạm Huy')!;
/** Phạm Huy (201) was due out `nights` days ago and is still in house; minibar counted, room nights paid. */
function overdueStay(nights: number) {
  const r = huy();
  r.departureDate = addDays(todayLocal(), -nights);
  for (const s of r.segments ?? []) s.toDate = r.departureDate;
  mockControl.stay.minibarChecks.set(r.id, []);
  mockControl.stay.payments.push({
    id: 'p-v515',
    code: 'PT-V515',
    folioId: r.folioId,
    type: 'charge',
    method: 'cash',
    amountVnd: 2_460_000,
    status: 'succeeded',
    reconciliation: 'not_required',
    version: 1,
  });
  return r;
}

/** Every POST the page sends (path, body, Idempotency-Key) and the summary reads. */
function traffic() {
  const writes: Array<{ path: string; body: Record<string, unknown>; key: string | null }> = [];
  const reads: string[] = [];
  const onRequest = ({ request }: { request: Request }) => {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path.endsWith('/checkout-summary'))
      reads.push(new URL(request.url).searchParams.get('checkoutTime') ?? '');
    if (request.method === 'POST')
      void request
        .clone()
        .json()
        .then((body: Record<string, unknown>) =>
          writes.push({ path, body, key: request.headers.get('idempotency-key') }),
        )
        .catch(() => writes.push({ path, body: {}, key: request.headers.get('idempotency-key') }));
  };
  server.events.on('request:start', onRequest);
  onTestFinished(() => {
    server.events.removeListener('request:start', onRequest);
  });
  return { writes, reads, b18: () => writes.filter((w) => w.path.endsWith('/actions/check-out')) };
}

const timeBox = () => screen.findByLabelText(new RegExp(esc(tv('checkout.departure_time'))));
const reasonBox = () =>
  screen.getByLabelText(new RegExp(`^${esc(tv('checkout.overdue_reason_label'))}`));
const goBill = () => screen.getByRole('button', { name: tv('co.go_bill') });

async function toTimeStep(as: string) {
  const r = huy();
  const view = renderApp(`/reservations/${r.id}/check-out`, as);
  await view.user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  await timeBox();
  return view;
}

async function completeNow(user: ReturnType<typeof renderApp>['user']) {
  await waitFor(() => expect(goBill()).not.toHaveAttribute('aria-disabled'));
  await user.click(goBill());
  const done = await screen.findByRole('button', { name: /hoàn tất$/ });
  await user.click(done);
  const box = await screen.findByRole('alertdialog');
  return box;
}

describe('V5-15 mock rules (server overdue-checkout.ts)', () => {
  it('nights = business day − effective departure; OWN always, MGR ≤ 1, FDL/FD never', () => {
    expect(overdueNights('2026-11-11', '2026-11-10')).toBe(1);
    expect(overdueNights('2026-11-12', '2026-11-10')).toBe(2);
    expect(overdueNights('2026-11-10', '2026-11-10')).toBe(0);
    expect(canCheckOutOverdue(['owner'], 5)).toBe(true);
    expect(canCheckOutOverdue(['manager'], 1)).toBe(true);
    expect(canCheckOutOverdue(['manager'], 2)).toBe(false);
    expect(canCheckOutOverdue(['front_desk_lead'], 1)).toBe(false);
    expect(canCheckOutOverdue(['front_desk'], 1)).toBe(false);
  });
});

describe('V5-15 – H16 overdue box (OWN, MGR ≤ 1 night)', () => {
  it('MGR, 1 night: the box on every step, the standard time on the departure day, a reason – B18 carries the server checkoutAt and overdueReason, no note', async () => {
    at('09:00');
    const r = overdueStay(1);
    const dep = r.departureDate;
    const { writes, b18 } = traffic();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.mgr');
    // said from step 1 (minibar) on
    expect(await screen.findByText(tv('checkout.overdue_title'))).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    // DOM 15.3: the standard time, not the desk's clock (09:00 today means nothing for a stay left yesterday)
    expect(await timeBox()).toHaveValue('12:00');
    expect(await timeBox()).not.toHaveAttribute('data-prefilled');
    // SEC 2.5: the D12c line always under the reason, read with the box
    expect(reasonBox()).toHaveAccessibleDescription(tv('checkout.overdue_reason_help'));
    expect(goBill()).toHaveAttribute('aria-disabled', 'true');
    expect(goBill()).toHaveAccessibleDescription(tv('field_error.reason_required'));
    // the usual "use Trả muộn" hint has no place here
    expect(screen.queryByText(/Trả muộn/)).toBeNull();

    await user.click(screen.getByRole('button', { name: tv('checkout.overdue_reason.no_notice') }));
    expect(reasonBox()).toHaveValue(tv('checkout.overdue_reason.no_notice'));
    expect(reasonBox()).toHaveAccessibleDescription(tv('checkout.overdue_reason_help'));

    const box = await completeNow(user);
    expect(
      within(box).getByText(
        tv('checkout.overdue_effect', {
          time: '12:00',
          date: dep.split('-').reverse().join('/'),
        }),
      ),
    ).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: /hoàn tất$/ }));
    await waitFor(() => expect(huy().status).toBe('checked_out'));
    const body = b18().at(-1)!.body;
    expect(body.checkoutAt).toBe(iso('12:00', dep));
    expect(body.checkoutTime).toBe('12:00');
    expect(body.overdueReason).toBe(tv('checkout.overdue_reason.no_notice'));
    expect(body).not.toHaveProperty('checkoutTimeNote');
    expect(body).not.toHaveProperty('extraNight');
    expect(body).not.toHaveProperty('lateFeeInsteadOfNight');
    // the time the guest left is recorded, not the click
    expect(huy().actualCheckoutAt).toBe(new Date(iso('12:00', dep)).toISOString());
    expect(writes.filter((w) => w.path.endsWith('/actions/late-checkout'))).toHaveLength(0);
  });

  it('"Khác (ghi rõ)" empties the box and puts the cursor in it; 2 characters are not enough', async () => {
    at('09:00');
    overdueStay(1);
    const { user } = await toTimeStep('qa.mgr');
    await user.click(
      screen.getByRole('button', { name: tv('checkout.overdue_reason.desk_forgot') }),
    );
    expect(reasonBox()).toHaveValue(tv('checkout.overdue_reason.desk_forgot'));
    await user.click(screen.getByRole('button', { name: tv('checkout.overdue_reason.other') }));
    expect(reasonBox()).toHaveValue('');
    await waitFor(() => expect(reasonBox()).toHaveFocus());
    await user.type(reasonBox(), 'ab');
    expect(goBill()).toHaveAttribute('aria-disabled', 'true');
    await user.type(reasonBox(), 'c');
    await waitFor(() => expect(goBill()).not.toHaveAttribute('aria-disabled'));
  });

  it('a time after the last tier → "extend first" under the time, no extra-night rate, "Tiếp tục" locked', async () => {
    at('09:00');
    overdueStay(1);
    const { user } = await toTimeStep('qa.owner');
    fireEvent.change(await timeBox(), { target: { value: '19:00' } });
    await user.click(screen.getByRole('button', { name: tv('checkout.overdue_reason.no_notice') }));
    await waitFor(() =>
      expect(screen.getAllByText(tv('checkout.overdue_after_limit')).length).toBeGreaterThan(0),
    );
    expect(await timeBox()).toHaveAccessibleDescription(
      new RegExp(`^${esc(tv('checkout.overdue_after_limit'))}`),
    );
    expect(screen.queryByLabelText(new RegExp(tv('checkout.extra_night_rate_label')))).toBeNull();
    // nothing priced at that time: no "on time" line, no extra night in what is due
    expect(screen.queryByText(tv('checkout.late_none'))).toBeNull();
    expect(goBill()).toHaveAttribute('aria-disabled', 'true');
  });

  it('the time box is required: emptied → "Bắt buộc", "Tiếp tục" says which box', async () => {
    at('09:00');
    overdueStay(1);
    await toTimeStep('qa.mgr');
    fireEvent.change(await timeBox(), { target: { value: '' } });
    expect(await timeBox()).toHaveAccessibleDescription(
      new RegExp(`^${esc(tv('common.required'))}`),
    );
    expect(goBill()).toHaveAccessibleDescription(
      tv('error.field_named', {
        label: tv('checkout.departure_time'),
        message: tv('common.required'),
      }),
    );
  });

  it('OWN, 2 nights: the box too (no cap for the owner); the summary takes no time note', async () => {
    at('09:00');
    overdueStay(2);
    await toTimeStep('qa.owner');
    expect(
      screen.getByText(
        tv('checkout.overdue_body', {
          date: huy().departureDate.split('-').reverse().join('/'),
          nights: tv('common.nights_other', { n: 2 }),
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(new RegExp(`^${esc(tv('checkout.time_note'))}`))).toBeNull();
  });

  it('409 CONCURRENT_UPDATE (Retry-After: 1) → B18 sent once more with the same Idempotency-Key and body', async () => {
    at('09:00');
    overdueStay(1);
    const { b18 } = traffic();
    const { user } = await toTimeStep('qa.mgr');
    await user.type(reasonBox(), 'Buồng phòng thấy căn trống lúc 11:00');
    const box = await completeNow(user);
    mockControl.failNext(
      /actions\/check-out:POST$/,
      409,
      { code: 'CONCURRENT_UPDATE' },
      { 'retry-after': '1' },
    );
    await user.click(within(box).getByRole('button', { name: /hoàn tất$/ }));
    await waitFor(() => expect(huy().status).toBe('checked_out'), { timeout: 4000 });
    const sent = b18();
    expect(sent).toHaveLength(2);
    expect(sent[0]!.key).toBeTruthy();
    expect(sent[1]!.key).toBe(sent[0]!.key);
    expect(sent[1]!.body).toEqual(sent[0]!.body);
    expect(sent[1]!.body.overdueReason).toBe('Buồng phòng thấy căn trống lúc 11:00');
  });

  it('422 CARD_NUMBER_DETECTED on overdueReason → back on the time step, said under the reason', async () => {
    at('09:00');
    overdueStay(1);
    const { user } = await toTimeStep('qa.mgr');
    await user.type(reasonBox(), 'Khách báo qua thẻ 4111 1111 1111 1111');
    const box = await completeNow(user);
    await user.click(within(box).getByRole('button', { name: /hoàn tất$/ }));
    await waitFor(() =>
      expect(reasonBox()).toHaveAccessibleDescription(
        new RegExp(`^${esc(tv('error.CARD_NUMBER_DETECTED'))}`),
      ),
    );
    expect(huy().status).toBe('in_house');
  });

  it('B18 403 with requiredRole owner (the stay crossed into a 2nd night) → "the owner", from the 403, nothing written', async () => {
    at('09:00');
    overdueStay(1);
    const { user } = await toTimeStep('qa.mgr');
    await user.click(screen.getByRole('button', { name: tv('checkout.overdue_reason.no_notice') }));
    const box = await completeNow(user);
    mockControl.failNext(/actions\/check-out:POST$/, 403, {
      code: 'FORBIDDEN_ACTION',
      requiredRole: 'owner',
      nightsNotBilled: 2,
    });
    await user.click(within(box).getByRole('button', { name: /hoàn tất$/ }));
    expect(
      await screen.findByText(tv('checkout.overdue_need_owner', { n: 2 })),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('co.go_bill') })).toBeNull();
    expect(screen.getByRole('link', { name: tv('ci.back_to_booking') })).toBeInTheDocument();
    expect(huy().status).toBe('in_house');
  });
});

describe('V5-15 – whom to call (FD/FDL, MGR past 1 night): no steps, nothing written', () => {
  it('FD, 1 night → "a manager or the owner"', async () => {
    at('09:00');
    const r = overdueStay(1);
    const { writes } = traffic();
    renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    expect(await screen.findByText(tv('checkout.overdue_need_manager'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('co.go_extras') })).toBeNull();
    expect(screen.getByRole('link', { name: tv('ci.back_to_booking') })).toHaveAttribute(
      'href',
      `/reservations/${r.id}`,
    );
    expect(writes).toHaveLength(0);
  });

  it('FDL, 2 nights → "the owner", {n} from the summary', async () => {
    at('09:00');
    const r = overdueStay(2);
    renderApp(`/reservations/${r.id}/check-out`, 'qa.fdl');
    expect(
      await screen.findByText(tv('checkout.overdue_need_owner', { n: 2 })),
    ).toBeInTheDocument();
  });

  it('MGR, 2 nights → no overdue action from the server → "the owner"', async () => {
    at('09:00');
    const r = overdueStay(2);
    renderApp(`/reservations/${r.id}/check-out`, 'qa.mgr');
    expect(
      await screen.findByText(tv('checkout.overdue_need_owner', { n: 2 })),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('co.go_extras') })).toBeNull();
  });

  it('drawer (FD, 1 night): "Trả phòng" locked, the reason next to it', async () => {
    at('09:00');
    const r = overdueStay(1);
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    const btn = await within(d).findByRole('button', { name: tv('drawer.action.check_out') });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).toHaveAccessibleDescription(tv('checkout.overdue_need_manager'));
  });

  it('drawer (MGR, 1 night): the usual "Trả phòng" (the server offers it, flagged overdue)', async () => {
    at('09:00');
    const r = overdueStay(1);
    renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    const btn = await within(d).findByRole('button', { name: tv('drawer.action.check_out') });
    expect(btn).not.toHaveAttribute('aria-disabled');
    expect(within(d).queryByText(tv('checkout.overdue_need_manager'))).toBeNull();
  });

  it('DOM 7.1: 05:00 two calendar days after the departure is still the 1st night (business day) – the manager records it', async () => {
    at('05:00');
    const r = huy();
    r.departureDate = addDays(todayLocal(), -2);
    for (const s of r.segments ?? []) s.toDate = r.departureDate;
    renderApp(`/reservations/${r.id}/check-out`, 'qa.mgr');
    expect(
      await screen.findByText(
        tv('checkout.overdue_body', {
          date: r.departureDate.split('-').reverse().join('/'),
          nights: tv('common.nights_one', { n: 1 }),
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(tv('checkout.overdue_need_owner', { n: 2 }))).toBeNull();
  });
});
