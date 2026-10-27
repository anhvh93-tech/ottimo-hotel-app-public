import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatLocalDate } from '@ottimo/i18n';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/**
 * v1.0.1 B16 Trả sớm on the Desk (US-137, US-135, OpenAPI 0.3.9 – ARC contract-v1.0.1 §4 FE-A, UXD
 * v1.0.1-early-departure-and-prices.md §2): ① preview runs by itself → ② server figures, "told the guest" tick, danger
 * button → write with `expectedRefundVnd`/`expectedFeeVnd` + If-Match of the preview → ③ result. 409 AMOUNT_CHANGED,
 * 412, 422, network failure (same key), server without preview; check-out next when the guest leaves today.
 */

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const vnd = (n: number) => n.toLocaleString('vi-VN');
const M = (n: number) => tv('common.currency_vnd', { amount: vnd(n) });
const NIGHT = 667_000; // room 101 nightly list price (seed)
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Pin the clock (only `Date`): 14:00 today = business day today, notice "now" needs no proof. */
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};

/** Trần Thu Nga (101, 4 nights from T−2) as a DIRECT stay paid `paid` (default: in full). */
function directStay(paid?: number) {
  const r = res('Trần Thu Nga');
  const direct = mockControl.rsv.channels.find((c) => c.code === 'direct')!;
  Object.assign(r, {
    channelCode: 'direct',
    channelId: direct.id,
    paymentModel: 'direct',
    otaGuestCount: null,
  });
  const pay = mockControl.stay.payments.find(
    (p) => p.folioId === r.folioId && p.method === 'ota_collect',
  )!;
  Object.assign(pay, { method: 'cash', amountVnd: paid ?? pay.amountVnd });
  return r;
}

interface Sent {
  body: Record<string, unknown>;
  ifMatch: string | null;
  key: string | null;
}
/** Every B16 request (previews and writes) as sent. */
function captureB16() {
  const sent: Sent[] = [];
  const on = ({ request }: { request: Request }) => {
    if (!new URL(request.url).pathname.endsWith('/actions/early-departure')) return;
    const ifMatch = request.headers.get('if-match');
    const key = request.headers.get('idempotency-key');
    void request
      .clone()
      .json()
      .then((body: Record<string, unknown>) => sent.push({ body, ifMatch, key }));
  };
  server.events.on('request:start', on);
  return {
    sent,
    writes: () => sent.filter((s) => s.body.dryRun === false),
    stop: () => server.events.removeListener('request:start', on),
  };
}

async function openDialog(guest: string, as = 'qa.fd') {
  const r = res(guest);
  const view = renderApp(`/reservations/${r.id}`, as);
  const drawer = await screen.findByRole('dialog', { name: guest });
  await view.user.click(
    await within(drawer).findByRole('button', { name: tv('drawer.action.early_departure') }),
  );
  const dlg = await screen.findByRole('dialog', {
    name: new RegExp(
      esc(tv('early_departure.title', { room: 'ROOM', guest })).replace('ROOM', '\\d+'),
    ),
  });
  return { ...view, r, dlg };
}

type User = ReturnType<typeof renderApp>['user'];
async function setDate(user: User, dlg: HTMLElement, d: string) {
  const box = within(dlg).getByLabelText(new RegExp(tv('early_departure.new_date')));
  await user.clear(box);
  await user.type(box, d);
}
const toPreview = (dlg: HTMLElement) =>
  within(dlg).getByRole('button', { name: tv('early_departure.to_preview') });
const confirmBtn = (dlg: HTMLElement) =>
  within(dlg).getByRole('button', { name: tv('early_departure.confirm') });
/** Step 1 → 2 once the server preview is in, tick "told the guest", confirm. */
async function previewAndConfirm(user: User, dlg: HTMLElement) {
  await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
  await user.click(toPreview(dlg));
  await user.click(
    await within(dlg).findByRole('checkbox', { name: tv('early_departure.told_guest') }),
  );
  await user.click(confirmBtn(dlg));
}
const row = (dlg: HTMLElement, key: string) => within(dlg).getByText(tv(key)).closest('tr')!;

describe('v1.0.1 B16 Trả sớm (US-137, US-135 – OpenAPI 0.3.9, UXD v1.0.1 §2)', () => {
  beforeEach(() => at('14:00'));
  afterEach(() => vi.useRealTimers());

  it('front desk sees the button on an in-house stay with nights left (allowedActions early_departure)', async () => {
    renderApp(`/reservations/${res('Trần Thu Nga').id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Trần Thu Nga' });
    expect(
      await within(d).findByRole('button', { name: tv('drawer.action.early_departure') }),
    ).toBeInTheDocument();
  });

  it('no button on the departure day (nothing to drop – the server does not offer B16)', async () => {
    expect(res('Phạm Huy').departureDate).toBe(todayLocal());
    renderApp(`/reservations/${res('Phạm Huy').id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    await within(d).findByRole('button', { name: tv('drawer.action.check_out') });
    expect(
      within(d).queryByRole('button', { name: tv('drawer.action.early_departure') }),
    ).toBeNull();
  });

  it('confirmed booking (not in house) has no button', async () => {
    renderApp(`/reservations/${res('Sophie Martin').id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Sophie Martin' });
    await within(d).findByRole('button', { name: tv('drawer.action.move') });
    expect(
      within(d).queryByRole('button', { name: tv('drawer.action.early_departure') }),
    ).toBeNull();
  });

  it('BR-428-01 shape: preview runs by itself, step 2 shows the server figures, tick + confirm writes them', async () => {
    directStay();
    const cap = captureB16();
    const { user, dlg, r } = await openDialog('Trần Thu Nga');
    const T = todayLocal();
    await setDate(user, dlg, addDays(T, 1));
    // Step 1 – one summary line, no money yet; the notice line comes from the server.
    expect(
      await within(dlg).findByText(
        tv('move.removed_nights', { n: 1, dates: dayMonth(addDays(T, 1)) }),
      ),
    ).toBeInTheDocument();
    expect(
      within(dlg).getByText(tv('early_departure.notice_days', { n: 1, date: dayMonth(T) })),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('early_departure.row_refund'))).toBeNull();
    expect(within(dlg).queryByLabelText(new RegExp(tv('early_departure.ota_retained')))).toBeNull();
    expect(within(dlg).queryByText(tv('early_departure.evidence_title'))).toBeNull();
    // Previews carry neither Idempotency-Key nor If-Match.
    for (const s of cap.sent) {
      expect(s.body.dryRun).toBe(true);
      expect(s.ifMatch).toBeNull();
      expect(s.key).toBeNull();
    }

    // Step 2 – the server's figures (half of 667.000 → 334.000 after its rounding; fee 333.000).
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    await user.click(toPreview(dlg));
    expect(
      within(dlg).getByRole('heading', {
        name: tv('early_departure.preview_question', {
          guest: 'Trần Thu Nga',
          date: formatLocalDate(addDays(T, 1)),
        }),
      }),
    ).toHaveFocus();
    const nights = within(dlg).getByRole('table', { name: tv('early_departure.nights_title') });
    expect(within(nights).getByText(r.code)).toBeInTheDocument();
    expect(within(nights).getByText(tv('early_departure.basis_policy'))).toBeInTheDocument();
    expect(row(dlg, 'early_departure.row_base')).toHaveTextContent(vnd(NIGHT));
    expect(row(dlg, 'early_departure.row_refundable')).toHaveTextContent(vnd(334_000));
    expect(row(dlg, 'early_departure.row_refund')).toHaveTextContent(M(334_000));
    expect(row(dlg, 'early_departure.row_fee')).toHaveTextContent(M(333_000));
    expect(within(dlg).getByText(tv('early_departure.effect_door'))).toBeInTheDocument();
    // The danger button waits for the tick, saying why.
    expect(confirmBtn(dlg)).toHaveAttribute('aria-disabled', 'true');
    expect(confirmBtn(dlg)).toHaveAccessibleDescription(tv('early_departure.confirm_needs_told'));
    await user.click(confirmBtn(dlg));
    expect(cap.writes()).toHaveLength(0);
    await user.click(within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }));
    await user.click(confirmBtn(dlg));

    // Step 3 – result; the write sent the same body + the amounts the desk saw.
    const ok = await within(dlg).findByText(
      tv('early_departure.done_title', { date: formatLocalDate(addDays(T, 1)) }),
    );
    expect(ok).toBeInTheDocument();
    expect(
      within(dlg).getByText(
        tv('early_departure.done_nights', { n: 1, dates: dayMonth(addDays(T, 1)) }),
      ),
    ).toBeInTheDocument();
    expect(
      within(dlg).getByText(tv('early_departure.done_refund', { amount: M(334_000) }), {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(within(dlg).getByText(tv('approval.status.pending'))).toBeInTheDocument();
    expect(
      within(dlg).getByText(tv('early_departure.done_fee', { amount: M(333_000) })),
    ).toBeInTheDocument();
    expect(
      within(dlg).getByText(
        tv('early_departure.later_hint', { date: formatLocalDate(addDays(T, 1)) }),
      ),
    ).toBeInTheDocument();
    expect(
      within(dlg).queryByRole('button', { name: tv('early_departure.checkout_now') }),
    ).toBeNull();
    await waitFor(() => expect(cap.writes()).toHaveLength(1));
    cap.stop();
    const w = cap.writes()[0]!;
    expect(w.body).toMatchObject({
      newDepartureDate: addDays(T, 1),
      expectedRefundVnd: 334_000,
      expectedFeeVnd: 333_000,
      dryRun: false,
    });
    expect(String(w.body.noticeGivenAt)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+07:00$/);
    expect(w.ifMatch).toBe('"1"');
    expect(w.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.departureDate).toBe(addDays(T, 1));
    expect(
      mockControl.stay.approvals.some((a) => a.type === 'refund' && a.amountVnd === 334_000),
    ).toBe(true);
  });

  it('BR-428-02 shape: same-day notice → no refund, then "Trả phòng ngay" opens check-out', async () => {
    directStay();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    expect(within(dlg).getByLabelText(new RegExp(tv('early_departure.new_date')))).toHaveValue(
      todayLocal(),
    );
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    await user.click(toPreview(dlg));
    expect(within(dlg).getByText(tv('early_departure.no_refund_notice'))).toBeInTheDocument();
    expect(row(dlg, 'early_departure.row_fee')).toHaveTextContent(M(2 * NIGHT));
    await user.click(within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }));
    await user.click(confirmBtn(dlg));
    expect(
      await within(dlg).findByText(tv('early_departure.checkout_now_hint')),
    ).toBeInTheDocument();
    expect(within(dlg).getAllByText(tv('early_departure.no_refund'))[0]).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('early_departure.checkout_now') }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(tv('checkout.title', { room: '101', guest: 'Trần Thu Nga' })),
      }),
    ).toBeInTheDocument();
  });

  it('BR-428-06 shape (OTA): amount kept by the OTA asked first, checked against the max, then sent; foreign-guest reminder', async () => {
    const r = res('Kim Seo-yeon'); // 402, Airbnb prepaid, foreign guest
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.status = 'sent';
    const cap = captureB16();
    const { user, dlg } = await openDialog('Kim Seo-yeon');
    const T = todayLocal();
    await setDate(user, dlg, addDays(T, 1)); // drops T+1, T+2
    const nightly = r.nightlyRates![0]!.amountVnd;
    const ota = await within(dlg).findByLabelText(new RegExp(tv('early_departure.ota_retained')));
    expect(
      await within(dlg).findByText(new RegExp(esc(`${M(2 * nightly)} – `))),
    ).toBeInTheDocument();
    // Step 1 says what is missing and the button says why it waits.
    expect(
      await within(dlg).findByText(tv('early_departure.ota_needed', { channel: 'Airbnb' })),
    ).toBeInTheDocument();
    expect(toPreview(dlg)).toHaveAttribute('aria-disabled', 'true');
    expect(toPreview(dlg)).toHaveAccessibleDescription(tv('early_departure.to_preview_needs'));
    // Over the max → said at the field before any call (and the server says the same).
    await user.type(ota, String(2 * nightly + 1000));
    expect(
      within(dlg).getByText(tv('early_departure.err.ota_over_max', { max: M(2 * nightly) })),
    ).toBeInTheDocument();
    await user.clear(ota);
    await user.type(ota, '500000');
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    await user.click(toPreview(dlg));
    expect(within(dlg).getAllByText(tv('early_departure.basis_ota'))).toHaveLength(2);
    expect(row(dlg, 'early_departure.row_ota_retained')).toHaveTextContent(vnd(500_000));
    expect(within(dlg).queryByText(tv('early_departure.row_base'))).toBeNull();
    expect(row(dlg, 'early_departure.row_fee')).toHaveTextContent(M(500_000));
    expect(within(dlg).getByText(tv('early_departure.effect_registration'))).toBeInTheDocument();
    await user.click(within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }));
    await user.click(confirmBtn(dlg));
    // HR-09: a lasting reminder with the link to the "needs update" list.
    expect(
      await within(dlg).findByText(
        tv('early_departure.reg_reminder', { date: formatLocalDate(addDays(T, 1)) }),
      ),
    ).toBeInTheDocument();
    expect(within(dlg).getByRole('link', { name: tv('early_departure.reg_open') })).toHaveAttribute(
      'href',
      '/registration?view=needs_update',
    );
    expect(reg.status).toBe('needs_update');
    await waitFor(() => expect(cap.writes()).toHaveLength(1));
    cap.stop();
    expect(cap.writes()[0]!.body).toMatchObject({
      otaRetainedVnd: 500_000,
      expectedFeeVnd: 500_000,
      expectedRefundVnd: 0,
    });
  });

  it('BR-428-03 shape: notice entered back in time → proof box (note required), the note is sent', async () => {
    directStay();
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    const T = todayLocal();
    await setDate(user, dlg, addDays(T, 1));
    fireEvent.change(within(dlg).getByLabelText(new RegExp(tv('early_departure.notice_date'))), {
      target: { value: addDays(T, -1) },
    });
    fireEvent.change(
      within(dlg).getByLabelText(new RegExp(esc(tv('early_departure.notice_time')))),
      {
        target: { value: '21:40' },
      },
    );
    // Back-dated → the proof box shows at once; the server then requires it.
    expect(within(dlg).getByText(tv('early_departure.evidence_title'))).toBeInTheDocument();
    expect(await within(dlg).findByText(tv('early_departure.evidence_needed'))).toBeInTheDocument();
    expect(
      within(dlg).getByText(
        tv('early_departure.notice_days', { n: 2, date: dayMonth(addDays(T, -1)) }),
      ),
    ).toBeInTheDocument();
    expect(toPreview(dlg)).toHaveAttribute('aria-disabled', 'true');
    await user.type(
      within(dlg).getByLabelText(new RegExp(tv('early_departure.evidence_note'))),
      'Zalo 21:40, khach xin roi som',
    );
    await previewAndConfirm(user, dlg);
    await within(dlg).findByText(
      tv('early_departure.done_title', { date: formatLocalDate(addDays(T, 1)) }),
    );
    await waitFor(() => expect(cap.writes()).toHaveLength(1));
    cap.stop();
    expect(cap.writes()[0]!.body).toMatchObject({
      noticeGivenAt: `${addDays(T, -1)}T21:40:00+07:00`,
      noticeEvidence: { note: 'Zalo 21:40, khach xin roi som' },
    });
  });

  it('409 AMOUNT_CHANGED: nothing written, new preview with "Vừa đổi", tick cleared, confirm again', async () => {
    // Paid 2.000.000 of 2.668.000: the refund is capped at the credit left (0 now).
    const r = directStay(2_000_000);
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    await setDate(user, dlg, addDays(todayLocal(), 1));
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    await user.click(toPreview(dlg));
    expect(within(dlg).getByText(tv('early_departure.refund_capped_zero'))).toBeInTheDocument();
    await user.click(within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }));
    // Someone takes 668.000 more at the desk in between.
    const pay = mockControl.stay.payments.find((p) => p.folioId === r.folioId)!;
    mockControl.stay.payments.push({ ...pay, id: `${pay.id.slice(0, -3)}999`, amountVnd: 668_000 });
    await user.click(confirmBtn(dlg));
    expect(
      await within(dlg).findByText(
        tv('early_departure.amount_changed', { refund: M(334_000), fee: M(333_000) }),
      ),
    ).toBeInTheDocument();
    expect(r.departureDate).not.toBe(addDays(todayLocal(), 1));
    expect(
      within(row(dlg, 'early_departure.row_refund')).getByText(tv('early_departure.changed_chip')),
    ).toBeInTheDocument();
    expect(within(dlg).getByText(tv('early_departure.was', { amount: M(0) }))).toBeInTheDocument();
    expect(
      within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }),
    ).not.toBeChecked();
    expect(confirmBtn(dlg)).toHaveAttribute('aria-disabled', 'true');
    await user.click(within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }));
    await user.click(confirmBtn(dlg));
    await within(dlg).findByText(tv('early_departure.done_refund', { amount: M(334_000) }), {
      exact: false,
    });
    await waitFor(() => expect(cap.writes()).toHaveLength(2));
    cap.stop();
    const [first, second] = cap.writes();
    expect(first!.body.expectedRefundVnd).toBe(0);
    expect(second!.body.expectedRefundVnd).toBe(334_000);
    expect(second!.key).not.toBe(first!.key);
  });

  it('412: back to step 1 with the inputs kept, preview again, If-Match of the new version', async () => {
    const r = directStay();
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    await setDate(user, dlg, addDays(todayLocal(), 1));
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    await user.click(toPreview(dlg));
    await user.click(within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }));
    r.version += 1; // someone else saved the booking
    await user.click(confirmBtn(dlg));
    expect(
      await within(dlg).findByText(tv('early_departure.err.version_conflict')),
    ).toBeInTheDocument();
    expect(within(dlg).getByLabelText(new RegExp(tv('early_departure.new_date')))).toHaveValue(
      addDays(todayLocal(), 1),
    );
    await previewAndConfirm(user, dlg);
    await within(dlg).findByText(
      tv('early_departure.done_nights', { n: 1, dates: dayMonth(addDays(todayLocal(), 1)) }),
    );
    await waitFor(() => expect(cap.writes()).toHaveLength(2));
    cap.stop();
    expect(cap.writes().map((w) => w.ifMatch)).toEqual(['"1"', '"2"']);
  });

  it('422 on the write goes back to step 1, said under the field', async () => {
    directStay();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    const T = todayLocal();
    await setDate(user, dlg, addDays(T, 1));
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    await user.click(toPreview(dlg));
    await user.click(within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }));
    mockControl.failNext(/early-departure:POST/, 422, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'newDepartureDate', code: 'DATE_INVALID' }],
    });
    await user.click(confirmBtn(dlg));
    const box = await within(dlg).findByLabelText(new RegExp(tv('early_departure.new_date')));
    await waitFor(() => expect(box).toHaveAttribute('aria-invalid', 'true'));
    expect(
      within(dlg).getByText(
        tv('early_departure.err.date_range', {
          min: formatLocalDate(T),
          max: formatLocalDate(addDays(T, 1)),
        }),
      ),
    ).toBeInTheDocument();
    expect(within(dlg).getByText(tv('error.VALIDATION_FAILED', { n: 1 }))).toBeInTheDocument();
  });

  it('network failure on the write: "Thử lại" resends with the SAME Idempotency-Key', async () => {
    directStay();
    const cap = captureB16();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    await setDate(user, dlg, addDays(todayLocal(), 1));
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    await user.click(toPreview(dlg));
    await user.click(within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }));
    mockControl.failNext(/early-departure:POST/, 500, { code: 'INTERNAL_ERROR' });
    await user.click(confirmBtn(dlg));
    expect(await within(dlg).findByText(tv('early_departure.commit_failed'))).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('common.retry') }));
    await within(dlg).findByText(
      tv('early_departure.done_nights', { n: 1, dates: dayMonth(addDays(todayLocal(), 1)) }),
    );
    cap.stop();
    const keys = cap.sent.filter((s) => s.key).map((s) => s.key);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
  });

  it('a server that cannot preview yet (422 dryRun NOT_ALLOWED) → "preview_unavailable", no write path', async () => {
    directStay();
    mockControl.failNext(/early-departure:POST/, 422, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'dryRun', code: 'NOT_ALLOWED' }],
    });
    const { user, dlg } = await openDialog('Trần Thu Nga');
    expect(
      await within(dlg).findByText(tv('early_departure.preview_unavailable')),
    ).toBeInTheDocument();
    expect(toPreview(dlg)).toHaveAttribute('aria-disabled', 'true');
    await user.click(toPreview(dlg));
    expect(within(dlg).queryByRole('checkbox')).toBeNull();
  });
});
