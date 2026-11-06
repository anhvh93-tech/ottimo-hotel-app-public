// V5-11 (OpenAPI 0.3.13 bổ sung 1 `earlyDeparture`, `Problem.minNewDepartureDate` / `useCheckout`; BE PR #114; DOM
// rules-v1.0.5 2.1–2.4 and DOM-on-be-a1-prs-127-114 2.2, 4; UXD copy-v1.0.5 9.13) – Trả sớm from 00:00 to the
// rollover ("W", calendar day D, business day D − 1). The Desk fills in the CALENDAR day, follows the server's
// 409 hints (useCheckout → minNewDepartureDate → generic) on the preview and on the write, shows the server's fee
// with the business day it is posted on, and offers "Trả phòng ngay" when the server opens B18 (UXD 9.13 bug).
import { formatLocalDate } from '@ottimo/i18n';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { getResponse, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { ApiError } from '@ottimo/api-client';
import { minCalendarDay, todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { handlers, mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { nightHint } from '../pages/stay/EarlyDepartureDialog';
import { renderApp, tv } from '../test/render';

const D = todayLocal(); // the calendar day the seed is anchored on
const Y = addDays(D, -1); // its business day from 00:00 to 06:00
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const vnd = (n: number) => n.toLocaleString('vi-VN');
const M = (n: number) => tv('common.currency_vnd', { amount: vnd(n) });
const fmt = (d: string) => formatLocalDate(d);
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ED_PATH = '*/v1/properties/:propertyId/reservations/:reservationId/actions/early-departure';

/** Pin `Date` only (timers stay real) to `hhmm` on `day` (default the calendar day D). */
const at = (hhmm: string, day = D) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${day}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

/** Trần Thu Nga (101, D−2 → D+2) – or another seed stay – as a direct stay paid in full. */
function directStay(guest = 'Trần Thu Nga') {
  const r = res(guest);
  const direct = mockControl.rsv.channels.find((c) => c.code === 'direct')!;
  Object.assign(r, {
    channelCode: 'direct',
    channelId: direct.id,
    paymentModel: 'direct',
    otaGuestCount: null,
  });
  const pay = mockControl.stay.payments.find(
    (p) => p.folioId === r.folioId && p.method === 'ota_collect',
  );
  if (pay) Object.assign(pay, { method: 'cash' });
  return r;
}

interface Sent {
  body: Record<string, unknown>;
}
/** Every B16 request (previews and writes) as sent. */
function captureB16() {
  const sent: Sent[] = [];
  const on = ({ request }: { request: Request }) => {
    if (!new URL(request.url).pathname.endsWith('/actions/early-departure')) return;
    void request
      .clone()
      .json()
      .then((body: Record<string, unknown>) => sent.push({ body }));
  };
  server.events.on('request:start', on);
  onTestFinished(() => {
    server.events.removeListener('request:start', on);
  });
  return { sent, writes: () => sent.filter((s) => s.body.dryRun === false) };
}

async function openDrawer(guest: string) {
  const r = res(guest);
  const view = renderApp(`/reservations/${r.id}`, 'qa.fd');
  const drawer = await screen.findByRole('dialog', { name: guest });
  const button = await within(drawer).findByRole('button', {
    name: tv('drawer.action.early_departure'),
  });
  return { ...view, r, drawer, button };
}
const findDialog = (guest: string) =>
  screen.findByRole('dialog', {
    name: new RegExp(
      esc(tv('early_departure.title', { room: 'ROOM', guest })).replace('ROOM', '\\d+'),
    ),
  });
async function openDialog(guest: string) {
  const v = await openDrawer(guest);
  await v.user.click(v.button);
  return { ...v, dlg: await findDialog(guest) };
}

type User = ReturnType<typeof renderApp>['user'];
const dateBox = (dlg: HTMLElement) =>
  within(dlg).getByLabelText(new RegExp(tv('early_departure.new_date')));
const toPreview = (dlg: HTMLElement) =>
  within(dlg).getByRole('button', { name: tv('early_departure.to_preview') });
const confirmBtn = (dlg: HTMLElement) =>
  within(dlg).getByRole('button', { name: tv('early_departure.confirm') });
const row = (dlg: HTMLElement, key: string) => within(dlg).getByText(tv(key)).closest('tr')!;
async function toStep2(user: User, dlg: HTMLElement) {
  await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
  await user.click(toPreview(dlg));
  await user.click(
    await within(dlg).findByRole('checkbox', { name: tv('early_departure.told_guest') }),
  );
}
const generic = () => tv('error.INVALID_TRANSITION', { status: '§' }).split('§')[0]!;

describe('V5-11 – minCalendarDay and the 409 hint order', () => {
  it('the floor is the calendar day from 00:00 to the rollover, the business day after it', () => {
    const t = (iso: string) => new Date(iso);
    expect(minCalendarDay('2026-10-20', undefined, t('2026-10-21T03:00:00+07:00'))).toBe(
      '2026-10-21',
    );
    expect(minCalendarDay('2026-10-20', undefined, t('2026-10-21T05:59:00+07:00'))).toBe(
      '2026-10-21',
    );
    expect(minCalendarDay('2026-10-21', undefined, t('2026-10-21T06:00:00+07:00'))).toBe(
      '2026-10-21',
    );
    expect(minCalendarDay('2026-10-20', undefined, t('2026-10-20T23:59:00+07:00'))).toBe(
      '2026-10-20',
    );
    // another property rollover (Me.businessDayRollover)
    expect(minCalendarDay('2026-10-20', undefined, t('2026-10-21T04:30:00+07:00'), '04:00')).toBe(
      '2026-10-20',
    );
  });

  it('useCheckout before minNewDepartureDate; any other 409 is not a hint', () => {
    const p = (extra: Record<string, unknown>, code = 'INVALID_TRANSITION') =>
      new ApiError(409, { type: 'about:blank', title: '', status: 409, code, ...extra });
    expect(nightHint(p({ useCheckout: true, minNewDepartureDate: '2026-10-21' }))).toEqual({
      useCheckout: true,
    });
    expect(nightHint(p({ minNewDepartureDate: '2026-10-21' }))).toEqual({
      minDate: '2026-10-21',
    });
    expect(nightHint(p({ currentState: 'checked_out' }))).toBeNull();
    expect(nightHint(p({ minNewDepartureDate: '2026-10-21' }, 'AMOUNT_CHANGED'))).toBeNull();
    expect(nightHint(new Error('x'))).toBeNull();
  });
});

describe('V5-11 – Trả sớm from 00:00 to 06:00 (Desk)', () => {
  it('T-11-6: at 02:00 the new departure date is the calendar day, the preview asks for it; an earlier date is refused on the Desk', async () => {
    at('02:00');
    directStay();
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    const box = dateBox(dlg);
    expect(box).toHaveValue(D);
    expect(box).toHaveAttribute('min', D);
    expect(
      within(dlg).getByText(
        tv('early_departure.new_date_help', { min: fmt(D), max: fmt(addDays(D, 1)) }),
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(cap.sent.some((s) => s.body.newDepartureDate === D)).toBe(true));
    // last night (the business day) is never offered: typed, it is a client error and no request goes out
    fireEvent.change(box, { target: { value: Y } });
    await waitFor(() => expect(box).toHaveAttribute('aria-invalid', 'true'));
    expect(
      within(dlg).getByText(
        tv('early_departure.err.date_range', { min: fmt(D), max: fmt(addDays(D, 1)) }),
      ),
    ).toBeInTheDocument();
    await new Promise((x) => setTimeout(x, 600));
    expect(cap.sent.some((s) => s.body.newDepartureDate === Y)).toBe(false);
    expect(toPreview(dlg)).toHaveAttribute('aria-disabled', 'true');
    await user.click(toPreview(dlg));
    expect(cap.writes()).toHaveLength(0);
  });

  it('T-11-1/T-11-3 + UXD 9.13 bug: 03:00, B16 to the calendar day → fee with its business day, then "Trả phòng ngay" (not later_hint)', async () => {
    at('03:00');
    const r = directStay();
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    expect(dateBox(dlg)).toHaveValue(D);
    await toStep2(user, dlg);
    // step ②: the server's fee, posted on the business day (UXD fee_business_date)
    const feeRow = row(dlg, 'early_departure.row_fee');
    const preview = cap.sent.filter((s) => s.body.dryRun === true).at(-1)!;
    expect(preview.body.newDepartureDate).toBe(D);
    expect(feeRow).toHaveTextContent(tv('early_departure.fee_business_date', { date: fmt(Y) }));
    // notice told at 03:00 on D = business day Y → 1 day before D (BR-428-12/14): a refund is asked
    expect(row(dlg, 'early_departure.row_notice')).toHaveTextContent(
      tv('early_departure.notice_value', { n: 1 }),
    );
    await user.click(confirmBtn(dlg));
    // step ③
    expect(
      await within(dlg).findByText(tv('early_departure.done_title', { date: fmt(D) })),
    ).toBeInTheDocument();
    // dropped D and D + 1 at 667.000 (seed), 1 day notice: the mock keeps half – shown as the server says
    const feeLine = within(dlg).getByText(tv('early_departure.done_fee', { amount: M(667_000) }), {
      exact: false,
    });
    expect(feeLine).toHaveTextContent(tv('early_departure.fee_business_date', { date: fmt(Y) }));
    expect(within(dlg).getByText(tv('early_departure.checkout_now_hint'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('early_departure.later_hint', { date: fmt(D) }))).toBeNull();
    // mock = #114: night Y kept, the fee line dated the business day of the action (BR-428-16)
    const lines = mockControl.stay.folios.get(r.folioId)!.lines;
    const feeLines = lines.filter((l) => l.category === 'early_departure_fee');
    expect(feeLines.length).toBeGreaterThan(0);
    for (const l of feeLines) expect(l.serviceDate).toBe(Y);
    expect(
      lines.some((l) => l.category === 'room' && l.serviceDate === Y && l.lineState === 'posted'),
    ).toBe(true);
    expect(r.departureDate).toBe(D);
    await user.click(within(dlg).getByRole('button', { name: tv('early_departure.checkout_now') }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(esc(tv('checkout.title', { room: '101', guest: 'Trần Thu Nga' }))),
      }),
    ).toBeInTheDocument();
  });

  it('the Desk shows and sends the server figures only: an odd fee / refund from the preview is what step ② shows and the write carries', async () => {
    at('03:00');
    directStay();
    const ODD = { fee: 1_234_000, refund: 456_000 };
    server.use(
      http.post(ED_PATH, async ({ request }) => {
        const body = (await request.clone().json()) as Record<string, unknown>;
        if (body.dryRun !== true) return undefined; // the write goes to the mock
        const real = await getResponse(handlers, request);
        if (!real || real.status !== 200) return real;
        const json = (await real.json()) as Record<string, unknown>;
        return HttpResponse.json({
          ...json,
          earlyDepartureFeeVnd: ODD.fee,
          refundVnd: ODD.refund,
          refundablePaidVnd: ODD.refund,
          refundCapped: false,
        });
      }),
    );
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    await toStep2(user, dlg);
    expect(row(dlg, 'early_departure.row_fee')).toHaveTextContent(M(ODD.fee));
    expect(row(dlg, 'early_departure.row_refund')).toHaveTextContent(M(ODD.refund));
    expect(
      within(dlg).getByText(tv('early_departure.effect_fee', { amount: M(ODD.fee) })),
    ).toBeInTheDocument();
    await user.click(confirmBtn(dlg));
    await waitFor(() => expect(cap.writes()).toHaveLength(1));
    expect(cap.writes()[0]!.body).toMatchObject({
      newDepartureDate: D,
      expectedFeeVnd: ODD.fee,
      expectedRefundVnd: ODD.refund,
      dryRun: false,
    });
  });

  it('409 minNewDepartureDate on the preview: the server date (not the Desk estimate) under the box, "Dùng {date}" fills it, focus stays, the preview runs again', async () => {
    at('03:00');
    directStay();
    const serverDate = addDays(D, 1); // a date the Desk would not work out itself (its estimate is D)
    mockControl.failNext(/early-departure:POST/, 409, {
      code: 'INVALID_TRANSITION',
      currentState: 'in_house',
      minNewDepartureDate: serverDate,
    });
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    const box = dateBox(dlg);
    await waitFor(() => expect(box).toHaveAttribute('aria-invalid', 'true'));
    const err = tv('early_departure.err.min_date', { date: fmt(serverDate) });
    expect(within(dlg).getByText(err)).toBeInTheDocument();
    expect(box).toHaveAccessibleDescription(expect.stringContaining(err));
    // help line and client check raised to the server's date; the box is not changed by itself
    expect(
      within(dlg).getByText(
        tv('early_departure.new_date_help', { min: fmt(serverDate), max: fmt(serverDate) }),
      ),
    ).toBeInTheDocument();
    expect(box).toHaveValue(D);
    expect(within(dlg).queryByText(new RegExp(`^${esc(generic())}`))).toBeNull();
    const use = within(dlg).getByRole('button', {
      name: tv('early_departure.use_min_date', { date: fmt(serverDate) }),
    });
    await user.click(use);
    expect(box).toHaveValue(serverDate);
    expect(box).toHaveFocus();
    await waitFor(() => expect(box).not.toHaveAttribute('aria-invalid'));
    expect(within(dlg).queryByText(err)).toBeNull();
    await waitFor(() =>
      expect(cap.sent.some((s) => s.body.newDepartureDate === serverDate)).toBe(true),
    );
    expect(cap.writes()).toHaveLength(0);
  });

  it('409 minNewDepartureDate on the write (00:00 passed after the preview): back to step ① like 412, focus on the date, then done', async () => {
    at('23:58', Y);
    const r = directStay();
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    expect(dateBox(dlg)).toHaveValue(Y); // before midnight: the business day
    await toStep2(user, dlg);
    at('03:00'); // the desk confirms after midnight
    fireEvent.click(confirmBtn(dlg));
    const box = await waitFor(() => {
      const b = dateBox(dlg);
      expect(b).toHaveAttribute('aria-invalid', 'true');
      return b;
    });
    expect(
      within(dlg).getByText(tv('early_departure.err.min_date', { date: fmt(D) })),
    ).toBeInTheDocument();
    await waitFor(() => expect(box).toHaveFocus());
    expect(within(dlg).queryByText(new RegExp(`^${esc(generic())}`))).toBeNull();
    expect(r.departureDate).toBe(addDays(D, 2)); // nothing written
    expect(cap.writes()).toHaveLength(1);
    await user.click(
      within(dlg).getByRole('button', {
        name: tv('early_departure.use_min_date', { date: fmt(D) }),
      }),
    );
    // told at 23:58, now 03:00: the server asks for proof of the notice time
    const note = await within(dlg).findByLabelText(new RegExp(tv('early_departure.evidence_note')));
    await user.type(note, 'Khach bao luc 23:58 tai quay');
    await toStep2(user, dlg);
    await user.click(confirmBtn(dlg));
    expect(
      await within(dlg).findByText(tv('early_departure.done_title', { date: fmt(D) })),
    ).toBeInTheDocument();
    expect(cap.writes().at(-1)!.body.newDepartureDate).toBe(D);
    expect(r.departureDate).toBe(D);
  });

  it('409 useCheckout on the preview: the info alert replaces the step, takes the focus; no preview / confirm button; only Đóng without check_out', async () => {
    at('03:00');
    const r = directStay();
    mockControl.failNext(/early-departure:POST/, 409, {
      code: 'INVALID_TRANSITION',
      currentState: 'in_house',
      useCheckout: true,
      minNewDepartureDate: D, // useCheckout wins
    });
    const { dlg } = await openDialog('Trần Thu Nga');
    const alert = await within(dlg).findByText(tv('early_departure.use_checkout'));
    expect(alert.closest('[role="alert"]')).toHaveClass('info');
    await waitFor(() => expect(alert.closest('[tabindex="-1"]')).toHaveFocus());
    expect(
      within(dlg).queryByRole('button', { name: tv('early_departure.to_preview') }),
    ).toBeNull();
    expect(within(dlg).queryByRole('button', { name: tv('early_departure.confirm') })).toBeNull();
    expect(within(dlg).queryByLabelText(new RegExp(tv('early_departure.new_date')))).toBeNull();
    expect(
      within(dlg).queryByText(tv('early_departure.err.min_date', { date: fmt(D) })),
    ).toBeNull();
    // Trần Thu Nga leaves D+2: the server has no check_out for her → only Đóng
    expect(
      within(dlg).queryByRole('button', { name: tv('early_departure.checkout_now') }),
    ).toBeNull();
    expect(within(dlg).getAllByRole('button', { name: tv('common.close') }).length).toBeGreaterThan(
      0,
    );
    expect(r.departureDate).toBe(addDays(D, 2));
  });

  it('opened in W with no date left (the stay leaves on the calendar day): use_checkout without any B16 call; after the re-read, "Trả phòng ngay"', async () => {
    at('23:58', Y);
    const cap = captureB16();
    const { user, button } = await openDrawer('Phạm Huy'); // leaves D: B16 still offered at 23:58
    at('03:00');
    await user.click(button);
    const dlg = await findDialog('Phạm Huy');
    expect(await within(dlg).findByText(tv('early_departure.use_checkout'))).toBeInTheDocument();
    const go = await within(dlg).findByRole('button', { name: tv('early_departure.checkout_now') });
    await new Promise((x) => setTimeout(x, 600));
    expect(cap.sent).toHaveLength(0);
    await user.click(go);
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(esc(tv('checkout.title', { room: '201', guest: 'Phạm Huy' }))),
      }),
    ).toBeInTheDocument();
  });

  it('409 useCheckout on the write (00:00 passed after the preview): nothing written, the alert, then "Trả phòng ngay" from the re-read booking', async () => {
    at('23:58', Y);
    const r = directStay('Phạm Huy'); // 201, D−3 → D
    const cap = captureB16();
    const { user, dlg } = await openDialog('Phạm Huy');
    await toStep2(user, dlg);
    at('03:00');
    fireEvent.click(confirmBtn(dlg));
    expect(await within(dlg).findByText(tv('early_departure.use_checkout'))).toBeInTheDocument();
    expect(r.departureDate).toBe(D);
    expect(r.status).toBe('in_house');
    expect(cap.writes().length).toBeLessThanOrEqual(1);
    expect(
      await within(dlg).findByRole('button', { name: tv('early_departure.checkout_now') }),
    ).toBeInTheDocument();
  });
});
