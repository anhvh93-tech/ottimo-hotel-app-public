// V5-15 (OpenAPI 0.3.13 `checkOut` bổ sung 1, contract 1.4 + 1.18; BE #99; DOM rules-v1.0.5 7.1, 15.3, 15.4, 15.7;
// UXD copy-v1.0.5 9.9, 9.15 + UXD-on-fe-prs-125-128 mục 3, UXD-on-fe-prs-145-146) – H16 "Trả phòng quá ngày đi". The SERVER says who may record it:
// `allowedActions` check_out `overdue` (OWN; MGR while ≤ 1 night) opens the box; otherwise the summary's
// `nightsNotBilled` says whom to call; a 403 `requiredRole: owner` on B18 says it too. B18 then carries the server's
// `checkoutAt` (a time on the departure day) and `overdueReason` – no time note, no extra night, no one-night fee.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { canCheckOutOverdue, overdueNights } from '../mocks/overdue';
import { containsCardNumber } from '../mocks/replyNote';
import { server } from '../mocks/node';
import { overdueEarlyAt, overdueGuidanceText } from '../pages/stay/overdue';
import { renderApp, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const iso = (hhmm: string, day = todayLocal()) => `${day}T${hhmm}:00+07:00`;
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(iso(hhmm)));
};
afterEach(() => vi.useRealTimers());

const huy = () => mockControl.rsv.reservations.find((r) => r.guestName === 'Phạm Huy')!;
const dmy = (d: string) => d.split('-').reverse().join('/');
/** DOM 145-03: the whom-to-call sentence, then the Gia hạn reminder – every FD+ viewer of an in-house stay has B13. */
const guidance = (need: string) => `${need} ${tv('checkout.overdue_extend_hint')}`;
/** DOM 145-04 then SEC 2.5 (D12c): one help line under the reason. */
const reasonHelp = () =>
  `${tv('checkout.overdue_reason_evidence')} ${tv('checkout.overdue_reason_help')}`;
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

/** Luhn check, written out here so the test does not lean on the mock's own helper. */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
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
    // copy 9.15 bảng A: no agreed late time → the standard time, no surcharge – one sentence
    expect(await timeBox()).toHaveAccessibleDescription(
      tv('checkout.overdue_time_help', { date: dmy(dep), time: '12:00' }),
    );
    // SEC 2.5: the D12c line always under the reason, read with the box (after DOM 145-04's line)
    expect(reasonBox()).toHaveAccessibleDescription(reasonHelp());
    expect(goBill()).toHaveAttribute('aria-disabled', 'true');
    expect(goBill()).toHaveAccessibleDescription(tv('field_error.reason_required'));
    // the usual "use Trả muộn" hint has no place here
    expect(screen.queryByText(/Trả muộn/)).toBeNull();

    await user.click(screen.getByRole('button', { name: tv('checkout.overdue_reason.no_notice') }));
    expect(reasonBox()).toHaveValue(tv('checkout.overdue_reason.no_notice'));
    expect(reasonBox()).toHaveAccessibleDescription(reasonHelp());
    // UXD 145-05: the cursor waits after the filled text, to add how the time is known – no comma added
    await waitFor(() => expect(reasonBox()).toHaveFocus());
    expect((reasonBox() as HTMLInputElement).selectionStart).toBe(
      tv('checkout.overdue_reason.no_notice').length,
    );

    const box = await completeNow(user);
    expect(
      within(box).getByText(
        tv('checkout.overdue_effect', {
          time: '12:00',
          date: dmy(dep),
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
          date: dmy(huy().departureDate),
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

  it('422 CARD_NUMBER_DETECTED on overdueReason (server shape) → back on the time step, said under the reason, the D12c line kept', async () => {
    at('09:00');
    overdueStay(1);
    // FB-R5-SEC-FE-145-02: the mock answers like `Fields.done()` – the card number is the problem code itself.
    const answers: Array<{ status: number; code?: unknown; errors?: unknown }> = [];
    const onResponse = ({ request, response }: { request: Request; response: Response }) => {
      if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/actions/check-out'))
        void response
          .clone()
          .json()
          .then((b: Record<string, unknown>) =>
            answers.push({ status: response.status, code: b.code, errors: b.errors }),
          );
    };
    server.events.on('response:mocked', onResponse);
    onTestFinished(() => {
      server.events.removeListener('response:mocked', onResponse);
    });
    const { user } = await toTimeStep('qa.mgr');
    await user.type(reasonBox(), 'Khách báo qua thẻ 4111 1111 1111 1111');
    const box = await completeNow(user);
    await user.click(within(box).getByRole('button', { name: /hoàn tất$/ }));
    await waitFor(() =>
      expect(reasonBox()).toHaveAccessibleDescription(
        new RegExp(`^${esc(tv('error.CARD_NUMBER_DETECTED'))}`),
      ),
    );
    // SEC 2.5: the error is added – the help (DOM 145-04 line + D12c line) is still read with the box
    expect(reasonBox()).toHaveAccessibleDescription(
      `${tv('error.CARD_NUMBER_DETECTED')} ${reasonHelp()}`,
    );
    expect(screen.getByText(reasonHelp())).toBeInTheDocument();
    await waitFor(() => expect(answers).toHaveLength(1));
    expect(answers[0]).toEqual({
      status: 422,
      code: 'CARD_NUMBER_DETECTED',
      errors: [{ field: 'overdueReason', code: 'CARD_NUMBER_DETECTED' }],
    });
    expect(huy().status).toBe('in_house');
  });

  it('the server reads the reason like V-09: times and dates in it are not a card number (ARC 145-01)', async () => {
    at('09:00');
    overdueStay(1);
    // FB-R5-ARC-FE-145-05: one fixed sentence, whatever the run date. Its digits joined (16) pass Luhn,
    // so the old mock rule (Luhn on every digit of the reason) would refuse it; no 13–19 digit run does.
    const why = 'Khách đi 11:40 ngày 05/11/2026, thấy trống 12:45';
    const joined = why.replace(/\D/g, '');
    expect(joined).toHaveLength(16);
    expect(passesLuhn(joined)).toBe(true);
    expect(containsCardNumber(why)).toBe(false);
    const { user } = await toTimeStep('qa.mgr');
    await user.type(reasonBox(), why);
    const box = await completeNow(user);
    await user.click(within(box).getByRole('button', { name: /hoàn tất$/ }));
    await waitFor(() => expect(huy().status).toBe('checked_out'));
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
    const said = await screen.findByText(guidance(tv('checkout.overdue_need_owner', { n: 2 })));
    // FB-R5-UXD-FE-145-03: the guidance takes the focus once (never `body` after the box closes)
    await waitFor(() => expect(said.closest('[tabindex="-1"]')).toHaveFocus());
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
    expect(
      await screen.findByText(guidance(tv('checkout.overdue_need_manager'))),
    ).toBeInTheDocument();
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
      await screen.findByText(guidance(tv('checkout.overdue_need_owner', { n: 2 }))),
    ).toBeInTheDocument();
  });

  it('MGR, 2 nights → no overdue action from the server → "the owner"', async () => {
    at('09:00');
    const r = overdueStay(2);
    renderApp(`/reservations/${r.id}/check-out`, 'qa.mgr');
    expect(
      await screen.findByText(guidance(tv('checkout.overdue_need_owner', { n: 2 }))),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('co.go_extras') })).toBeNull();
    // no focus moved when the page simply opens on the guidance (only after a refused "Hoàn tất")
    expect(document.activeElement).toBe(document.body);
  });

  it('drawer (FD, 1 night): "Trả phòng" locked, the reason next to it', async () => {
    at('09:00');
    const r = overdueStay(1);
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    const btn = await within(d).findByRole('button', { name: tv('drawer.action.check_out') });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    // DOM 145-03: the need, then the Gia hạn reminder, in the one span the button points to
    expect(btn).toHaveAccessibleDescription(guidance(tv('checkout.overdue_need_manager')));
    expect(within(d).getByRole('button', { name: tv('drawer.action.extend') })).not.toHaveAttribute(
      'aria-disabled',
    );
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
          date: dmy(r.departureDate),
          nights: tv('common.nights_one', { n: 1 }),
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(tv('checkout.overdue_need_owner', { n: 2 }))).toBeNull();
  });
});

describe('V5-15 – copy 9.15 (UXD-on-fe-prs-145-146; DOM 145-01 … 145-03, ARC 3.4)', () => {
  /** DOM 4 example: last night 700.000 (list price of 201, OTA stay), late check-out agreed at 17:00 → 50 % = 350.000. */
  function agreedLate() {
    const r = overdueStay(1);
    const room = mockControl.db.rooms.find((x) => x.id === r.roomId)!;
    room.currentListPrice = { ...room.currentListPrice!, nightlyListPriceVnd: 700_000 };
    r.agreedCheckoutTime = '17:00';
    const f = mockControl.stay.folios.get(r.folioId)!;
    f.lines.push({
      ...f.lines[0]!,
      id: 'late-v515',
      category: 'late_checkout',
      description: 'late_checkout 17:00 50%',
      labelKey: undefined,
      labelParams: undefined,
      amountVnd: 350_000,
      unitPriceVnd: 350_000,
    } as (typeof f.lines)[number]);
    return r;
  }

  it('DOM 145-01 (rules 15.3 ý 2a): agreed late 17:00 → keep 17:00 and the agreed charge – never "12:00, no surcharge"; 14:00 with proof lowers it, no tick', async () => {
    at('09:00');
    const r = agreedLate();
    const dep = r.departureDate;
    const { b18 } = traffic();
    await toTimeStep('qa.mgr');
    const box = await timeBox();
    expect(box).toHaveValue('17:00');
    // one sentence: the agreed time and its charge
    expect(box).toHaveAccessibleDescription(
      tv('checkout.overdue_time_help_agreed', { date: dmy(dep), time: '17:00' }),
    );
    const said = box.getAttribute('aria-describedby') ?? '';
    const help = said
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ');
    expect(help).toContain('giữ 17:00 (giờ trả muộn đã hẹn)');
    expect(help).not.toContain('(giờ trả chuẩn)');
    expect(help).not.toContain('12:00');
    expect(help).not.toContain('không phụ thu');
    // no separate co.time_from_late on the overdue path
    expect(screen.queryByText(/Theo giờ trả muộn đã hẹn/)).toBeNull();
    expect(
      screen.queryByText(tv('checkout.overdue_time_help', { date: dmy(dep), time: '12:00' })),
    ).toBeNull();
    // the agreed charge as recorded: no recalculation, no tick
    expect(
      await screen.findByText(
        tv('checkout.late_fee', {
          amount: tv('common.currency_vnd', { amount: '350.000' }),
          pct: 50,
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: `${tv('ci.told_guest')} *` })).toBeNull();

    // proof the guest left at 14:00 (housekeeping found the room empty) → the charge goes down by itself, no tick
    fireEvent.change(box, { target: { value: '14:00' } });
    expect(
      await screen.findByText(
        tv('checkout.late_recalc', {
          old: tv('common.currency_vnd', { amount: '350.000' }),
          new: tv('common.currency_vnd', { amount: '210.000' }),
        }),
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: `${tv('ci.told_guest')} *` })).toBeNull();
    // the help line stays the agreed one (the agreed time is still what "no proof" means)
    expect(await timeBox()).toHaveAccessibleDescription(
      tv('checkout.overdue_time_help_agreed', { date: dmy(dep), time: '17:00' }),
    );
    expect(b18()).toHaveLength(0);
  });

  it('DOM 145-02 / ARC 3.4: 03:00 typed – the server puts it on the next day → how Desk read it, not "extend first"; 06:00 → recorded on the departure day', async () => {
    at('09:00');
    const r = overdueStay(1);
    const dep = r.departureDate;
    const { b18 } = traffic();
    const { user } = await toTimeStep('qa.mgr');
    fireEvent.change(await timeBox(), { target: { value: '03:00' } });
    const early = tv('checkout.overdue_time_early', {
      time: '03:00',
      next: dmy(todayLocal()),
      date: dmy(dep),
      rollover: '06:00',
    });
    await waitFor(
      () =>
        expect(
          screen.getByLabelText(new RegExp(esc(tv('checkout.departure_time')))),
        ).toHaveAccessibleDescription(new RegExp(`^${esc(early)}`)),
      { timeout: 3000 },
    );
    expect(screen.queryAllByText(tv('checkout.overdue_after_limit'))).toHaveLength(0);
    expect(screen.queryByText(tv('checkout.post_midnight'))).toBeNull();
    await user.click(screen.getByRole('button', { name: tv('checkout.overdue_reason.no_notice') }));
    // the reason is kept where it is typed: the cursor is after the filled text
    await user.keyboard(', khách nhắn đi lúc 03:00');
    expect(reasonBox()).toHaveValue(
      `${tv('checkout.overdue_reason.no_notice')}, khách nhắn đi lúc 03:00`,
    );
    expect(goBill()).toHaveAttribute('aria-disabled', 'true');
    expect(goBill()).toHaveAccessibleDescription(early);

    // DOM 3.3: the departure day's rollover, the real time in the reason – no extension
    fireEvent.change(await timeBox(), { target: { value: '06:00' } });
    await waitFor(() => expect(screen.queryByText(early)).toBeNull(), { timeout: 3000 });
    const box = await completeNow(user);
    expect(
      within(box).getByText(tv('checkout.overdue_effect', { time: '06:00', date: dmy(dep) })),
    ).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: /hoàn tất$/ }));
    await waitFor(() => expect(huy().status).toBe('checked_out'));
    const body = b18().at(-1)!.body;
    expect(body.checkoutAt).toBe(iso('06:00', dep));
    expect(body.overdueReason).toContain('03:00');
    expect(mockControl.rsv.reservations.filter((x) => x.parentReservationId === r.id)).toHaveLength(
      0,
    );
  });

  /** Phạm Huy due out T−2, extended by B13 for the night T−2 → T−1 (child booking); nobody checked it out on T−1. */
  function extendedOverdue() {
    const r = huy();
    const T = todayLocal();
    r.departureDate = addDays(T, -2);
    for (const s of r.segments ?? []) s.toDate = r.departureDate;
    mockControl.stay.minibarChecks.set(r.id, []);
    mockControl.rsv.reservations.push({
      ...r,
      id: '0192a1b0-0000-7000-8000-000000095151',
      code: 'OTM-95151',
      parentReservationId: r.id,
      status: 'in_house' as const,
      arrivalDate: addDays(T, -2),
      departureDate: addDays(T, -1),
      nights: 1,
      nightlyRates: [{ date: addDays(T, -2), amountVnd: 700_000 }],
      totalRoomVnd: 700_000,
      folioId: '0192a1b0-0000-7000-8000-000000095152',
      segments: (r.segments ?? []).map((sg) => ({
        ...sg,
        fromDate: addDays(T, -2),
        toDate: addDays(T, -1),
      })),
      allowedActions: [],
      version: 1,
    });
    return { r, T };
  }

  it('ARC 3.4: an extended stay still overdue – {date} is the departure after Gia hạn, {next} the server day', async () => {
    at('09:00');
    const { T } = extendedOverdue();
    await toTimeStep('qa.mgr');
    fireEvent.change(await timeBox(), { target: { value: '03:00' } });
    const early = tv('checkout.overdue_time_early', {
      time: '03:00',
      next: dmy(T),
      date: dmy(addDays(T, -1)),
      rollover: '06:00',
    });
    await waitFor(() => expect(goBill()).toHaveAccessibleDescription(early), { timeout: 3000 });
    expect(screen.queryAllByText(tv('checkout.overdue_after_limit'))).toHaveLength(0);
  });

  it('FB-R5-ARC-FE-145-04: an extended stay still overdue, 18:30 typed → "extend first" (the server day = the departure AFTER Gia hạn, not the first one)', async () => {
    at('09:00');
    extendedOverdue();
    await toTimeStep('qa.mgr');
    fireEvent.change(await timeBox(), { target: { value: '18:30' } });
    // on T−1 (the effective departure) after its last tier: a night the guest stayed – extend first, never "enter 06:00"
    await waitFor(
      () => expect(goBill()).toHaveAccessibleDescription(tv('checkout.overdue_after_limit')),
      { timeout: 3000 },
    );
    expect(goBill()).toHaveAttribute('aria-disabled', 'true');
    expect(await timeBox()).toHaveAccessibleDescription(
      new RegExp(`^${esc(tv('checkout.overdue_after_limit'))}`),
    );
    expect(screen.queryByText(/rạng sáng/)).toBeNull();
  });

  it('a time after the last tier ON the departure day stays "extend first" (the server day = the departure)', async () => {
    at('09:00');
    overdueStay(1);
    await toTimeStep('qa.mgr');
    fireEvent.change(await timeBox(), { target: { value: '18:30' } });
    await waitFor(
      () => expect(goBill()).toHaveAccessibleDescription(tv('checkout.overdue_after_limit')),
      {
        timeout: 3000,
      },
    );
    expect(screen.queryByText(/rạng sáng/)).toBeNull();
  });

  it('pure helpers: the Gia hạn reminder only with B13; the early-hours sentence only off the departure day', () => {
    const need = tv('checkout.overdue_need_manager');
    expect(overdueGuidanceText(tv, need, false)).toBe(need);
    expect(overdueGuidanceText(tv, need, true)).toBe(guidance(need));
    const dep = '2026-11-10';
    expect(overdueEarlyAt(true, '2026-11-11T03:00:00+07:00', dep)).toEqual({
      day: '2026-11-11',
      time: '03:00',
    });
    // v1.0.6 (0.3.14): the server reads 03:00 on the departure day → nothing, no Desk change
    expect(overdueEarlyAt(true, '2026-11-10T03:00:00+07:00', dep)).toBeNull();
    expect(overdueEarlyAt(true, '2026-11-10T18:30:00+07:00', dep)).toBeNull();
    // not past the last tier, or no instant from the server → nothing
    expect(overdueEarlyAt(false, '2026-11-11T03:00:00+07:00', dep)).toBeNull();
    expect(overdueEarlyAt(true, undefined, dep)).toBeNull();
  });
});
