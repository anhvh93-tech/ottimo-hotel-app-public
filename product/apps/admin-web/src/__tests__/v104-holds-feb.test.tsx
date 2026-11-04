// v1.0.4 P4-40 (FE-B) – Desk for holds: BUG-R3-042 (receipt time, no deposit button on an unpaid overdue hold),
// BUG-R3-043 (OWN/MGR accept a short deposit), BUG-R3-044 (a hold WITH money is not presented as cancelled),
// BUG-R3-046 (cancel with "Khác (ghi rõ)"), BUG-R3-047 (no online check-in link on a hold), ĐX-R3-QA-01 ("Cần chú
// ý" `hold_overdue` / `hold_overdue_cap`, "Giữ chỗ chờ cọc (n)").
// The API side (P4-10, BE-B) is built in parallel: the contract of plan-v1.0.4 P4-00 (a) is mocked here with
// `server.use` (the shared mock files are frozen in v1.0.4). Copy comes from the string files through `tv` – before
// P4-01 (strings round 1) the new keys read as the key itself on both sides, so these tests stay valid after it.
import type { AttentionItem } from '@ottimo/api-client';
import { formatNumber, hasKey, translate } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { attentionLine } from '../app/attention';
import { HOLD_KEYS, fromLocalInput, toLocalInput } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: formatNumber('vi', n) });
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const named = (key: string, args?: Record<string, string | number>) =>
  new RegExp(`^${esc(tv(key, args))}`);
/** "– đơn đã tự hủy": the part of the unpaid-overdue sentence after its time. */
const expiredUnpaidTail = tv('drawer.hold.expired', { time: '§' }).split('§')[1]!;

/** Bodies of the writes this file watches (confirm-deposit, cancel – dry runs included). */
const sent: Array<{ url: string; body: Record<string, unknown> }> = [];
const onStart = ({ request }: { request: Request }) => {
  if (request.method !== 'POST' || !/\/actions\/(confirm-deposit|cancel)$/.test(request.url))
    return;
  void request
    .clone()
    .json()
    .then((b: Record<string, unknown>) => sent.push({ url: request.url, body: b }));
};
function watch() {
  sent.length = 0;
  server.events.on('request:start', onStart);
}
afterEach(() => {
  server.events.removeListener('request:start', onStart);
});
const deposits = () => sent.filter((s) => s.url.endsWith('/confirm-deposit')).map((s) => s.body);
const cancels = () => sent.filter((s) => s.url.endsWith('/cancel')).map((s) => s.body);

/** Lê Minh (hold on 103, 24 h, created by a CTV): past its deadline. */
function overdue(paid: number) {
  const r = rsvOf('Lê Minh');
  r.hold!.expiresAt = new Date(Date.now() - 30 * 60_000).toISOString();
  r.depositPaidVnd = paid;
  return r;
}

async function openDrawer(as: string) {
  const r = rsvOf('Lê Minh');
  const view = renderApp(`/reservations/${r.id}`, as);
  const drawer = await screen.findByRole('dialog', { name: 'Lê Minh' });
  return { ...view, r, drawer };
}

async function openDeposit(as: string) {
  const v = await openDrawer(as);
  await v.user.click(
    await within(v.drawer).findByRole('button', { name: tv('drawer.action.confirm_deposit') }),
  );
  const dlg = await screen.findByRole('dialog', {
    name: tv('rsv.deposit_title', { code: v.r.code }),
  });
  return { ...v, dlg };
}

describe('BUG-R3-042 – receipt time on the deposit dialog (FD+), no deposit offer on an unpaid overdue hold', () => {
  it('FD sees "Giờ nhận tiền" set to now; untouched → no receivedAt sent (the server takes now)', async () => {
    watch();
    const { user, dlg } = await openDeposit('qa.fd');
    const field = within(dlg).getByLabelText(named(HOLD_KEYS.receivedAt));
    expect(field).toHaveAttribute('type', 'datetime-local');
    // Default = the hotel's wall clock now (to the minute; a minute may tick while rendering).
    const now = Date.now();
    expect([toLocalInput(new Date(now)), toLocalInput(new Date(now - 60_000))]).toContain(
      (field as HTMLInputElement).value,
    );
    expect(field).toHaveAttribute('max');
    await user.selectOptions(within(dlg).getByLabelText(tv('pay.method')), 'cash');
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    await waitFor(() => expect(deposits()).toHaveLength(1));
    expect(deposits()[0]!.payment).not.toHaveProperty('receivedAt');
  });

  it('a time typed in the past is sent as the zoned instant (+07:00); a future time is refused before sending', async () => {
    watch();
    const { user, dlg } = await openDeposit('qa.fd');
    await user.selectOptions(within(dlg).getByLabelText(tv('pay.method')), 'cash');
    const field = within(dlg).getByLabelText(named(HOLD_KEYS.receivedAt)) as HTMLInputElement;
    const future = toLocalInput(new Date(Date.now() + 3 * 3_600_000));
    await user.clear(field);
    await user.type(field, future);
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(await within(dlg).findByText(tv('field.DATE_INVALID'))).toBeInTheDocument();
    expect(deposits()).toHaveLength(0);
    const earlier = toLocalInput(new Date(Date.now() - 2 * 3_600_000));
    await user.clear(field);
    await user.type(field, earlier);
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    await waitFor(() => expect(deposits()).toHaveLength(1));
    expect(deposits()[0]!.payment).toMatchObject({ receivedAt: `${earlier}:00+07:00` });
  });

  it('a sale (no back-dating right) does not get the field', async () => {
    const r = rsvOf('Lê Minh');
    r.createdBy = mockControl.db.users.find((u) => u.username === 'qa.sal')!.id;
    const { dlg } = await openDeposit('qa.sal');
    expect(within(dlg).queryByLabelText(named(HOLD_KEYS.receivedAt))).toBeNull();
  });

  it('unpaid hold past its deadline: no "Xác nhận đã nhận cọc", the "cancelled" sentence stays', async () => {
    overdue(0);
    const { drawer } = await openDrawer('qa.fd');
    expect(
      within(drawer).queryByRole('button', { name: tv('drawer.action.confirm_deposit') }),
    ).toBeNull();
    expect(drawer.textContent).toContain(expiredUnpaidTail);
  });

  it('paid hold past its deadline: the deposit can still be completed (button kept)', async () => {
    overdue(200_000);
    const { drawer } = await openDrawer('qa.fd');
    expect(
      within(drawer).getByRole('button', { name: tv('drawer.action.confirm_deposit') }),
    ).toBeInTheDocument();
  });
});

describe('BUG-R3-043 – "Chấp nhận cọc thiếu – lý do" (OWN/MGR only)', () => {
  it('manager: box shown when something is received and still short; reason ≥ 3 required; sent with the receipt', async () => {
    watch();
    const r = rsvOf('Lê Minh');
    const need = r.depositRequiredVnd!;
    r.depositPaidVnd = 100_000;
    const { user, dlg } = await openDeposit('qa.mgr');
    await user.selectOptions(within(dlg).getByLabelText(tv('pay.method')), 'cash');
    const amount = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(amount);
    await user.type(amount, '200000');
    const box = within(dlg).getByRole('checkbox', { name: tv(HOLD_KEYS.acceptShortfall) });
    await user.click(box);
    // The main button no longer says "record part" – it confirms.
    const submit = within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') });
    await user.click(submit);
    expect(within(dlg).getByText(tv('field_error.reason_required'))).toBeInTheDocument();
    expect(deposits()).toHaveLength(0);
    await user.type(
      within(dlg).getByRole('textbox', { name: named(HOLD_KEYS.acceptShortfallReason) }),
      'Khách quen, trả nốt khi đến',
    );
    await user.click(submit);
    await waitFor(() => expect(deposits()).toHaveLength(1));
    expect(deposits()[0]).toMatchObject({
      payment: { type: 'deposit', method: 'cash', amountVnd: 200_000 },
      acceptShortfallReason: 'Khách quen, trả nốt khi đến',
    });
    expect(need).toBeGreaterThan(300_000);
  });

  it('manager, no new money: confirms on the deposit already received (existingPaymentId) with the reason', async () => {
    watch();
    const r = rsvOf('Lê Minh');
    r.depositPaidVnd = 300_000;
    mockControl.stay.payments.push({
      id: '00000000-0000-4000-8000-0000000c0043',
      code: 'PT-043',
      folioId: r.folioId,
      reservationCode: r.code,
      type: 'deposit',
      method: 'cash',
      amountVnd: 300_000,
      status: 'succeeded',
      reconciliation: 'not_required',
      receivedAt: new Date().toISOString(),
      recordedBy: 'Hạnh',
      version: 1,
    } as never);
    const { user, dlg } = await openDeposit('qa.mgr');
    await user.clear(within(dlg).getByLabelText(/Số tiền đã nhận/));
    await user.click(within(dlg).getByRole('checkbox', { name: tv(HOLD_KEYS.acceptShortfall) }));
    await user.type(
      within(dlg).getByRole('textbox', { name: named(HOLD_KEYS.acceptShortfallReason) }),
      'Chấp nhận 300.000',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    await waitFor(() => expect(deposits()).toHaveLength(1));
    expect(deposits()[0]).toEqual({
      existingPaymentId: '00000000-0000-4000-8000-0000000c0043',
      acceptShortfallReason: 'Chấp nhận 300.000',
    });
  });

  it('front desk never sees the box (the server answers 403 to them)', async () => {
    rsvOf('Lê Minh').depositPaidVnd = 100_000;
    const { dlg } = await openDeposit('qa.fd');
    expect(within(dlg).queryByRole('checkbox', { name: tv(HOLD_KEYS.acceptShortfall) })).toBeNull();
  });

  it('nothing received and the receipt still short → no box (B-29 needs money on the hold)', async () => {
    const { user, dlg } = await openDeposit('qa.mgr');
    const amount = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(amount);
    expect(within(dlg).queryByRole('checkbox', { name: tv(HOLD_KEYS.acceptShortfall) })).toBeNull();
    await user.type(amount, '100000');
    expect(
      within(dlg).getByRole('checkbox', { name: tv(HOLD_KEYS.acceptShortfall) }),
    ).toBeInTheDocument();
  });
});

describe('BUG-R3-044 – a hold WITH money is not presented as cancelled', () => {
  it('drawer past the deadline: the paid-overdue banner with paid / required / arrival, never "đơn đã tự hủy"', async () => {
    const r = overdue(200_000);
    const { drawer } = await openDrawer('qa.fd');
    // Prefix of the sentence before its first argument (before P4-01: the key itself).
    const prefix = tv(HOLD_KEYS.paidOverdueBanner, {
      time: '§',
      paid: '§',
      required: '§',
      date: '§',
    }).split('§')[0]!;
    const banner = within(drawer)
      .getAllByRole('status')
      .find((el) => el.classList.contains('bad') && el.textContent!.includes(prefix))!;
    expect(banner).toBeTruthy();
    if (hasKey(HOLD_KEYS.paidOverdueBanner)) expect(banner.textContent).toContain(money(200_000));
    expect(drawer.textContent).not.toContain(expiredUnpaidTail);
    expect(r.depositRequiredVnd).toBeGreaterThan(200_000);
  });

  it('HOLD_EXPIRED from the server on a paid hold → the paid sentence in the deposit dialog', async () => {
    overdue(200_000);
    server.use(
      http.post(
        '*/v1/properties/:propertyId/reservations/:reservationId/actions/confirm-deposit',
        () =>
          HttpResponse.json(
            {
              type: '/problems/hold-expired',
              title: 'HOLD_EXPIRED',
              status: 409,
              code: 'HOLD_EXPIRED',
              expiredAt: '2026-11-04T10:00:00+07:00',
            },
            { status: 409, headers: { 'content-type': 'application/problem+json' } },
          ),
        { once: true },
      ),
    );
    const { user, dlg } = await openDeposit('qa.fd');
    await user.selectOptions(within(dlg).getByLabelText(tv('pay.method')), 'cash');
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    const alert = await within(dlg).findByText(
      new RegExp(esc(tv(HOLD_KEYS.expiredPaid, { time: '§' }).split('§')[0]!)),
    );
    expect(alert).toBeInTheDocument();
    expect(within(dlg).queryByText(new RegExp(esc('mở bán lại')))).toBeNull();
  });

  it('cancel dialog of a hold with money: no "(giữ chỗ chưa cọc)", says the refund request of what was received', async () => {
    rsvOf('Lê Minh').depositPaidVnd = 200_000;
    const { user, drawer } = await openDrawer('qa.fd');
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.cancel_hold') }));
    const dlg = await screen.findByRole('alertdialog');
    expect(
      await within(dlg).findByText(tv(HOLD_KEYS.cancelRefundPreview, { amount: money(200_000) })),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('cancel.fee_none'))).toBeNull();
  });

  it('cancel dialog of a hold with nothing received keeps "no fee"', async () => {
    const { user, drawer } = await openDrawer('qa.fd');
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.cancel_hold') }));
    const dlg = await screen.findByRole('alertdialog');
    expect(within(dlg).getByText(tv('cancel.fee_none'))).toBeInTheDocument();
  });
});

describe('BUG-R3-046 – cancel with "Khác (ghi rõ)"', () => {
  it('the dry run waits for the note, then carries it; the hold is cancelled with reasonCode other + note', async () => {
    watch();
    const r = rsvOf('Lê Minh');
    const { user, drawer } = await openDrawer('qa.fd');
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.cancel_hold') }));
    const dlg = await screen.findByRole('alertdialog');
    await waitFor(() => expect(cancels().length).toBeGreaterThan(0));
    await user.selectOptions(within(dlg).getByLabelText(named('cancel.reason')), 'other');
    // No note yet: no 422 dry run, the dialog says the note is needed (never "Chưa tính được phí hủy").
    expect(within(dlg).getByText(tv('field_error.reason_required'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('cancel.preview_failed'))).toBeNull();
    const confirm = within(dlg).getByRole('button', { name: tv('cancel.confirm') });
    expect(confirm).toBeDisabled();
    await user.type(
      within(dlg).getByRole('textbox', { name: named('stay.note') }),
      'Hết hạn giữ chỗ – tạo lại khi khách đến',
    );
    await waitFor(() => expect(confirm).toBeEnabled());
    const dry = cancels().filter((b) => b.dryRun);
    expect(dry.at(-1)).toMatchObject({
      reasonCode: 'other',
      note: 'Hết hạn giữ chỗ – tạo lại khi khách đến',
      dryRun: true,
    });
    expect(within(dlg).queryByText(tv('cancel.preview_failed'))).toBeNull();
    await user.click(confirm);
    await waitFor(() => expect(r.status).toBe('cancelled'));
    expect(cancels().filter((b) => !b.dryRun)).toEqual([
      { reasonCode: 'other', note: 'Hết hạn giữ chỗ – tạo lại khi khách đến', dryRun: false },
    ]);
  });
});

describe('BUG-R3-047 – no online check-in link on a hold', () => {
  it('hold: no "Tạo link check-in online" (the server issues it for confirmed / in_house only)', async () => {
    const { drawer } = await openDrawer('qa.fd');
    expect(
      within(drawer).queryByRole('button', { name: named('rsv.guest_link.create') }),
    ).toBeNull();
  });
});

describe('ĐX-R3-QA-01 – "Cần chú ý" hold_overdue / hold_overdue_cap, "Giữ chỗ chờ cọc (n)"', () => {
  const ctx = {
    t: (k: string, a?: Record<string, string | number>) => translate('vi', k, a),
    roles: ['manager' as const],
    room: (n?: string | null) => n ?? '',
    channel: (c: string) => c,
  };
  const item = (over: Omit<Partial<AttentionItem>, 'kind'> & { kind: string }) =>
    ({
      source: 'computed',
      severity: 'critical',
      count: 1,
      refCode: 'OTM-0146',
      reservationIds: ['r-146'],
      dueAt: '2026-11-04T10:00:00+07:00',
      ...over,
    }) as unknown as AttentionItem;

  it('hold_overdue: red, opens the booking, never closed by "Đã xử lý" (even when sent as an event)', () => {
    const used: string[] = [];
    const line = attentionLine(item({ kind: 'hold_overdue', source: 'event', eventId: 'e1' }), {
      ...ctx,
      t: (k, a) => {
        used.push(k);
        return translate('vi', k, a);
      },
    });
    expect(used).toContain(HOLD_KEYS.attnHoldOverdue);
    expect(line.tone).toBe('urgent');
    expect(line.icon).toBe('hourglass');
    expect(line.to).toBe('/reservations/r-146');
    expect(line.resolveLabel).toBeUndefined();
  });

  it('hold_overdue with several bookings → the bookings list; hold_overdue_cap → its own sentence', () => {
    const many = attentionLine(
      item({ kind: 'hold_overdue', count: 3, refCode: undefined, reservationIds: ['a', 'b', 'c'] }),
      ctx,
    );
    expect(many.to).toBe('/reservations');
    const used: string[] = [];
    const cap = attentionLine(item({ kind: 'hold_overdue_cap' }), {
      ...ctx,
      t: (k, a) => {
        used.push(k);
        return translate('vi', k, a);
      },
    });
    expect(used).toContain(HOLD_KEYS.attnHoldOverdueCap);
    expect(cap.resolveLabel).toBeUndefined();
    expect(cap.to).toBe('/reservations/r-146');
  });

  it('H03 shows the server items (AC1: arrival +20 days) with "Mở" to the booking', async () => {
    const r = overdue(200_000);
    server.use(
      http.get('*/v1/properties/:propertyId/attention', () =>
        HttpResponse.json({
          data: [
            {
              kind: 'hold_overdue',
              source: 'computed',
              severity: 'critical',
              count: 1,
              refCode: r.code,
              reservationIds: [r.id],
              dueAt: r.hold!.expiresAt,
            },
          ],
        }),
      ),
    );
    renderApp('/today', 'qa.fd');
    const attn = await screen.findByRole('region', { name: new RegExp(tv('today.attention')) });
    const text = translate('vi', HOLD_KEYS.attnHoldOverdue).split('{')[0]!.trim();
    await waitFor(() => expect(attn.textContent).toContain(text.slice(0, 10)));
    expect(within(attn).queryByRole('button', { name: tv('attn.resolve') })).toBeNull();
  });

  it('Hôm nay: the holds block is "Giữ chỗ chờ cọc (n)" (part-paid holds too)', async () => {
    const r = rsvOf('Lê Minh');
    r.arrivalDate = new Date().toISOString().slice(0, 10);
    renderApp('/today', 'qa.fd');
    expect(
      await screen.findByRole('heading', { name: tv(HOLD_KEYS.todayHoldsWaiting, { n: 1 }) }),
    ).toBeInTheDocument();
  });
});

describe('helpers', () => {
  it('datetime-local ↔ zoned instant in the hotel zone (+07:00)', () => {
    expect(toLocalInput(new Date('2026-11-04T03:05:00Z'))).toBe('2026-11-04T10:05');
    expect(fromLocalInput('2026-11-04T10:05')).toBe('2026-11-04T10:05:00+07:00');
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('2026-11-04')).toBeNull();
  });

  // P4-01 (strings round 1, UXD) adds these keys after `main@L`; then inline them as literals in the code so the
  // "every literal key exists" test covers them, and turn this on.
  it.todo('P4-01: every HOLD_KEYS key exists in VI and EN');
});
