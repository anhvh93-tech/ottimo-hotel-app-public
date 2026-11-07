// v1.0.5 V5-5B 5B-1 + V5-51 (FE-A): "Ghi tiền về sau khi hủy" on a closed booking (contract 0.3.13 addendum 1
// `recordPayment` (B), #148; addendum 1j `cancellation.cancelledFrom`, #158), "Không thấy tiền" on "Cần chú ý",
// "Có thể trùng", and the optional bank transaction reference in every box that records a transfer. Copy: UXD
// copy-v1.0.5 9.1 v2.5 (48e7baf0). Test values only (no guest data, no card numbers – the reference values are bank
// codes).
import { ApiError, type AttentionItem, type Folio, type Reservation } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  afterCancelMethods,
  afterCancelRefundVnd,
  afterCancelType,
  refundCreatedVnd,
} from '../app/afterCancel';
import { attentionLine } from '../app/attention';
import { problemView } from '../app/problem';
import { Providers } from '../app/Providers';
import { addDays } from '../app/reservations';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import type { MockReservation } from '../mocks/reservations';
import type { MockPayment } from '../mocks/stay';
import { PaymentPanel } from '../pages/stay/PaymentPanel';
import { useSession } from '../session/SessionProvider';
import { renderApp, tv } from '../test/render';

const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = (key: string, args?: Record<string, string | number>) =>
  new RegExp(`^${esc(tv(key, args))}`);
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const photo = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], 'thong-bao-ngan-hang.jpg', { type: 'image/jpeg' });

function capture(method: string, path: RegExp) {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== method || !path.test(new URL(request.url).pathname)) return;
    if (!(request.headers.get('content-type') ?? '').includes('json')) return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

/** N of the booking's folio: one posted line of `vnd` (0 → no posted line, nothing owed). */
function setDue(r: Reservation, vnd: number) {
  const f = mockControl.stay.folios.get(r.folioId!)!;
  const first = f.lines[0]!;
  f.lines = vnd > 0 ? [{ ...first, id: `fee-${r.id}`, amountVnd: vnd, unitPriceVnd: vnd }] : [];
  for (const p of mockControl.stay.payments.filter((x) => x.folioId === r.folioId))
    p.status = 'reversed';
}

/** Vũ Thị Lan (202, direct) – `no_show` in the seed. */
function noShow(due: number) {
  const r = res('Vũ Thị Lan');
  expect(r.status).toBe('no_show');
  setDue(r, due);
  return r;
}

/** A seed booking turned `cancelled` from `from` (addendum 1j). */
function cancelled(guest: string, from: 'hold' | 'confirmed', due = 0) {
  const r = res(guest);
  r.status = 'cancelled';
  delete r.hold;
  r.cancellation = {
    cancelledAt: new Date().toISOString(),
    reasonCode: 'guest_changed_mind',
    cancelledFrom: from,
  };
  setDue(r, due);
  return r;
}

async function openBox(r: MockReservation, as = 'qa.fd') {
  const view = renderApp(`/reservations/${r.id}`, as);
  const drawer = await screen.findByRole('dialog', { name: r.guestName });
  await view.user.click(
    await within(drawer).findByRole('button', { name: tv('drawer.action.money_after_cancel') }),
  );
  const dlg = await screen.findByRole('dialog', {
    name: tv('rsv.after_cancel.title', { code: r.code }),
  });
  await within(dlg).findByLabelText(tv('pay.method'));
  return { ...view, dlg };
}

const field = (dlg: HTMLElement, key: string) => within(dlg).getByLabelText(re(key));
const submit = (dlg: HTMLElement) =>
  within(dlg).getByRole('button', { name: tv('rsv.after_cancel.submit') });
const afterCancelRefunds = (code: string) =>
  mockControl.stay.approvals.filter(
    (a) => a.reasonCode === 'payment_after_cancel' && a.reservationCode === code,
  );

describe('5B-1 rules (app/afterCancel)', () => {
  const r = (status: Reservation['status'], cancelledFrom?: 'hold' | 'confirmed') =>
    ({
      status,
      cancellation: cancelledFrom ? { cancelledFrom } : undefined,
    }) as Reservation;

  it('type: cancelled from a hold → deposit; from confirmed, no_show, or field absent → charge', () => {
    expect(afterCancelType(r('cancelled', 'hold'))).toBe('deposit');
    expect(afterCancelType(r('cancelled', 'confirmed'))).toBe('charge');
    expect(afterCancelType(r('no_show'))).toBe('charge');
    expect(afterCancelType(r('cancelled'))).toBe('charge');
  });

  it('methods: transfer and VietQR always; the POS card only while N > 0', () => {
    expect(afterCancelMethods(0)).toEqual(['bank_transfer', 'vietqr']);
    expect(afterCancelMethods(300_000)).toEqual(['bank_transfer', 'vietqr', 'card_pos']);
  });

  it('refund = max(0, amount − N)', () => {
    expect(afterCancelRefundVnd(1_000_000, 0)).toBe(1_000_000);
    expect(afterCancelRefundVnd(1_000_000, 300_000)).toBe(700_000);
    expect(afterCancelRefundVnd(300_000, 300_000)).toBe(0);
    expect(afterCancelRefundVnd(200_000, 300_000)).toBe(0);
  });

  it('{refund} of the toast = the increase of openRefunds payment_after_cancel; without the list → the rule', () => {
    const folio = (open?: Array<{ reasonCode: string; openVnd: number }>) =>
      ({ totals: { roomVnd: 0, openRefunds: open } }) as unknown as Folio;
    const before = folio([
      { reasonCode: 'payment_after_cancel', openVnd: 500_000 },
      { reasonCode: 'overpayment', openVnd: 90_000 },
    ]);
    const after = folio([
      { reasonCode: 'payment_after_cancel', openVnd: 1_200_000 },
      { reasonCode: 'overpayment', openVnd: 90_000 },
    ]);
    expect(refundCreatedVnd(before, after, 1_000_000, 300_000)).toBe(700_000);
    expect(refundCreatedVnd(folio([]), folio([]), 300_000, 300_000)).toBe(0);
    expect(refundCreatedVnd(folio(), folio(), 1_000_000, 300_000)).toBe(700_000);
    expect(refundCreatedVnd(before, null, 1_000_000, 0)).toBe(1_000_000);
  });
});

describe('409 DUPLICATE_BANK_REFERENCE – the sentence follows duplicateReservationCode', () => {
  const dup = (extra: Record<string, unknown>) =>
    new ApiError(409, {
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      code: 'DUPLICATE_BANK_REFERENCE',
      ...extra,
    });

  it('FD+ (code present) → names the booking; SAL/CTV (no code) → no booking code', () => {
    expect(problemView(t, dup({ duplicateReservationCode: 'OTM-0912' })).text).toBe(
      t('error.DUPLICATE_BANK_REFERENCE', { code: 'OTM-0912' }),
    );
    const none = problemView(t, dup({})).text;
    expect(none).toBe(t('error.DUPLICATE_BANK_REFERENCE_no_code'));
    expect(none).not.toMatch(/OTM-/);
  });
});

describe('Ghi tiền về sau khi hủy – the box (FD+, cancelled / no_show)', () => {
  it('FD+ only: the desk sees the button on a closed booking; a sale sees "Báo đã chuyển cọc" instead', async () => {
    const r = cancelled('Lê Thu Trang', 'confirmed');
    const { unmount } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Lê Thu Trang' });
    expect(
      await within(drawer).findByRole('button', { name: tv('drawer.action.money_after_cancel') }),
    ).toBeInTheDocument();
    unmount();
    renderApp(`/reservations/${r.id}`, 'qa.sal');
    const own = await screen.findByRole('dialog', { name: 'Lê Thu Trang' });
    expect(
      await within(own).findByRole('button', { name: tv('drawer.action.deposit_notice') }),
    ).toBeInTheDocument();
    expect(
      within(own).queryByRole('button', { name: tv('drawer.action.money_after_cancel') }),
    ).toBeNull();
  });

  it('N = 0: refunded in full; transfer / VietQR only; proof + reference; charge on a no-show; refund request = amount', async () => {
    const r = noShow(0);
    const sent = capture('POST', /\/folios\/[^/]+\/payments$/);
    const { user, dlg } = await openBox(r);
    expect(within(dlg).getByText(tv('rsv.after_cancel.intro'))).toBeInTheDocument();
    expect(
      within(dlg).getByText(tv('rsv.after_cancel.rebook', { code: r.code })),
    ).toBeInTheDocument();
    expect(within(dlg).getByText(tv('rsv.after_cancel.find_new'))).toBeInTheDocument();
    const method = within(dlg).getByLabelText(tv('pay.method'));
    expect(
      within(method)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([tv('pay.bank_transfer'), tv('pay.vietqr')]);
    expect(method).toHaveAccessibleDescription(tv('rsv.after_cancel.methods_hint'));
    expect(within(dlg).queryByLabelText(re('co.pos_code'))).toBeNull();
    // Nothing typed: the desk is told what is missing, nothing is sent.
    await user.click(submit(dlg));
    expect(field(dlg, 'rsv.after_cancel.proof')).toHaveAccessibleDescription(
      new RegExp(esc(tv('field_error.after_cancel_proof'))),
    );
    expect(sent.sent).toHaveLength(0);

    await user.type(field(dlg, 'rsv.amount_received'), '1000000');
    await user.upload(field(dlg, 'rsv.after_cancel.proof'), photo());
    await user.type(field(dlg, 'pay.bank_reference_optional'), 'FT26311 001');
    expect(field(dlg, 'pay.bank_reference_optional')).toHaveValue('FT26311001');
    await user.type(field(dlg, 'stay.note'), 'tiền về 14:05 theo mã đơn');
    await user.click(submit(dlg));
    expect(
      await screen.findByText(
        tv('rsv.after_cancel.done', {
          amount: money(1_000_000),
          code: r.code,
          refund: money(1_000_000),
        }),
      ),
    ).toBeInTheDocument();
    sent.stop();
    expect(sent.sent).toHaveLength(1);
    expect(sent.sent[0]).toMatchObject({
      type: 'charge',
      method: 'bank_transfer',
      amountVnd: 1_000_000,
      bankReference: 'FT26311001',
      note: 'tiền về 14:05 theo mã đơn',
    });
    expect(sent.sent[0]!.attachmentId).toEqual(expect.any(String));
    expect(sent.sent[0]).not.toHaveProperty('posAuthCode');
    const p = mockControl.stay.payments.at(-1)!;
    expect(p).toMatchObject({ folioId: r.folioId, reconciliation: 'pending' });
    expect(afterCancelRefunds(r.code)).toEqual([
      expect.objectContaining({
        amountVnd: 1_000_000,
        status: 'pending',
        refundDestination: expect.objectContaining({ method: 'original_method' }),
      }),
    ]);
  });

  it('N > 0: the fee first – card up to N, prefilled, approval code only (no photo, no reference) → done_fee, no refund', async () => {
    const r = noShow(300_000);
    const sent = capture('POST', /\/folios\/[^/]+\/payments$/);
    const { user, dlg } = await openBox(r);
    expect(
      within(dlg).getByText(tv('rsv.after_cancel.intro_due', { due: money(300_000) })),
    ).toBeInTheDocument();
    const method = within(dlg).getByLabelText(tv('pay.method'));
    expect(method).toHaveAccessibleDescription(
      tv('rsv.after_cancel.methods_hint_due', { due: money(300_000) }),
    );
    await user.selectOptions(method, 'card_pos');
    expect(field(dlg, 'rsv.amount_received')).toHaveValue('300.000');
    expect(within(dlg).queryByLabelText(re('rsv.after_cancel.proof'))).toBeNull();
    expect(within(dlg).queryByLabelText(re('pay.bank_reference_optional'))).toBeNull();
    expect(field(dlg, 'co.pos_code')).toHaveAccessibleDescription(tv('co.pos_no_card'));
    expect(field(dlg, 'stay.note')).toHaveAttribute(
      'placeholder',
      tv('rsv.after_cancel.note_hint_card'),
    );
    await user.type(field(dlg, 'co.pos_code'), 'A12345');
    await user.type(field(dlg, 'stay.note'), 'phí không đến, quẹt thẻ 14:05');
    await user.click(submit(dlg));
    expect(
      await screen.findByText(
        tv('rsv.after_cancel.done_fee', { amount: money(300_000), code: r.code }),
      ),
    ).toBeInTheDocument();
    sent.stop();
    expect(sent.sent[0]).toMatchObject({
      type: 'charge',
      method: 'card_pos',
      amountVnd: 300_000,
      posAuthCode: 'A12345',
    });
    expect(sent.sent[0]).not.toHaveProperty('attachmentId');
    expect(sent.sent[0]).not.toHaveProperty('bankReference');
    expect(afterCancelRefunds(r.code)).toEqual([]);
  });

  it('N > 0, a transfer above N: the refund request is the part above N (amount − N)', async () => {
    const r = noShow(300_000);
    const { user, dlg } = await openBox(r);
    await user.type(field(dlg, 'rsv.amount_received'), '1000000');
    await user.upload(field(dlg, 'rsv.after_cancel.proof'), photo());
    await user.type(field(dlg, 'stay.note'), 'tiền về 09:10 theo mã đơn');
    await user.click(submit(dlg));
    expect(
      await screen.findByText(
        tv('rsv.after_cancel.done', {
          amount: money(1_000_000),
          code: r.code,
          refund: money(700_000),
        }),
      ),
    ).toBeInTheDocument();
    expect(afterCancelRefunds(r.code).map((a) => a.amountVnd)).toEqual([700_000]);
  });

  it('card cap: 422 AMOUNT_EXCEEDS_BALANCE → the cap sentence with the server max under the amount; nothing written', async () => {
    const r = noShow(300_000);
    const before = mockControl.stay.payments.length;
    const { user, dlg } = await openBox(r);
    await user.selectOptions(within(dlg).getByLabelText(tv('pay.method')), 'card_pos');
    const amount = field(dlg, 'rsv.amount_received');
    await user.clear(amount);
    await user.type(amount, '500000');
    await user.type(field(dlg, 'co.pos_code'), 'A12345');
    await user.type(field(dlg, 'stay.note'), 'phí còn nợ');
    await user.click(submit(dlg));
    await waitFor(() =>
      expect(amount).toHaveAccessibleDescription(
        tv('field_error.after_cancel_card_max', { max: money(300_000) }),
      ),
    );
    // Desk never lowers the number itself.
    expect(amount).toHaveValue('500000');
    expect(mockControl.stay.payments).toHaveLength(before);
    expect(afterCancelRefunds(r.code)).toEqual([]);
  });

  it('N read again after a 422: someone collected the fee meanwhile → the card goes, after_cancel_method, intro of N = 0', async () => {
    const r = noShow(300_000);
    const { user, dlg } = await openBox(r);
    const method = within(dlg).getByLabelText(tv('pay.method'));
    await user.selectOptions(method, 'card_pos');
    await user.type(field(dlg, 'co.pos_code'), 'A12345');
    await user.type(field(dlg, 'stay.note'), 'phí còn nợ');
    setDue(r, 0);
    await user.click(submit(dlg));
    await waitFor(() =>
      expect(method).toHaveAccessibleDescription(
        new RegExp(esc(tv('field_error.after_cancel_method'))),
      ),
    );
    expect(method).toHaveValue('bank_transfer');
    expect(within(method).queryByRole('option', { name: tv('pay.card') })).toBeNull();
    expect(within(dlg).getByText(tv('rsv.after_cancel.intro'))).toBeInTheDocument();
  });

  it('a photo a sale sent is refused (422 attachmentId NOT_IN_LIST) → proof_from_notice', async () => {
    const r = noShow(0);
    const { user, dlg } = await openBox(r);
    // The next upload is labelled as a sale's (FB-R5-SEC-BE-105-01).
    const add = mockControl.stay.attachments.add.bind(mockControl.stay.attachments);
    mockControl.stay.attachments.add = (id: string) => {
      mockControl.stay.salesAttachments.add(id);
      return add(id);
    };
    await user.type(field(dlg, 'rsv.amount_received'), '500000');
    await user.upload(field(dlg, 'rsv.after_cancel.proof'), photo());
    await user.type(field(dlg, 'stay.note'), 'ảnh do sale gửi');
    await user.click(submit(dlg));
    await waitFor(() =>
      expect(field(dlg, 'rsv.after_cancel.proof')).toHaveAccessibleDescription(
        new RegExp(esc(tv('field_error.after_cancel_proof_from_notice'))),
      ),
    );
  });

  it('type from cancelledFrom: a hold cancelled → deposit; a confirmed booking cancelled → charge', async () => {
    const hold = cancelled('Lê Minh', 'hold');
    const sent = capture('POST', /\/folios\/[^/]+\/payments$/);
    const one = await openBox(hold);
    await one.user.type(field(one.dlg, 'rsv.amount_received'), '600000');
    await one.user.upload(field(one.dlg, 'rsv.after_cancel.proof'), photo());
    await one.user.selectOptions(within(one.dlg).getByLabelText(tv('pay.method')), 'vietqr');
    await one.user.type(field(one.dlg, 'stay.note'), 'tiền về theo mã QR cũ');
    await one.user.click(submit(one.dlg));
    expect(
      await screen.findByText(
        tv('rsv.after_cancel.done', {
          amount: money(600_000),
          code: hold.code,
          refund: money(600_000),
        }),
      ),
    ).toBeInTheDocument();
    one.unmount();
    const conf = cancelled('Lê Thu Trang', 'confirmed');
    const two = await openBox(conf);
    await two.user.type(field(two.dlg, 'rsv.amount_received'), '400000');
    await two.user.upload(field(two.dlg, 'rsv.after_cancel.proof'), photo());
    await two.user.type(field(two.dlg, 'stay.note'), 'tiền về sau khi hủy');
    await two.user.click(submit(two.dlg));
    await screen.findByText(
      tv('rsv.after_cancel.done', {
        amount: money(400_000),
        code: conf.code,
        refund: money(400_000),
      }),
    );
    sent.stop();
    expect(sent.sent.map((b) => [b.method, b.type])).toEqual([
      ['vietqr', 'deposit'],
      ['bank_transfer', 'charge'],
    ]);
  });

  it('409 DUPLICATE_BANK_REFERENCE for FD+ names the other booking; nothing written', async () => {
    const r = noShow(0);
    const other = res('Nguyễn Văn An');
    mockControl.stay.payments.push({
      id: 'dup-1',
      code: 'PT-0990',
      folioId: other.folioId,
      reservationCode: other.code,
      type: 'deposit',
      method: 'bank_transfer',
      amountVnd: 1_000_000,
      status: 'succeeded',
      reconciliation: 'pending',
      bankReference: 'FT26311001',
      version: 1,
    } satisfies MockPayment);
    const before = mockControl.stay.payments.length;
    const { user, dlg } = await openBox(r);
    await user.type(field(dlg, 'rsv.amount_received'), '1000000');
    await user.upload(field(dlg, 'rsv.after_cancel.proof'), photo());
    await user.type(field(dlg, 'pay.bank_reference_optional'), 'ft26311001');
    await user.type(field(dlg, 'stay.note'), 'tiền về 14:05');
    await user.click(submit(dlg));
    expect(
      await within(dlg).findByText(tv('error.DUPLICATE_BANK_REFERENCE', { code: other.code })),
    ).toBeInTheDocument();
    expect(mockControl.stay.payments).toHaveLength(before);
    expect(afterCancelRefunds(r.code)).toEqual([]);
  });

  it('a sale reports money on a closed booking → 202 and the after-cancel toast', async () => {
    const r = cancelled('Lê Thu Trang', 'confirmed');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.sal');
    const own = await screen.findByRole('dialog', { name: 'Lê Thu Trang' });
    await user.click(
      await within(own).findByRole('button', { name: tv('drawer.action.deposit_notice') }),
    );
    const box = await screen.findByRole('dialog', { name: tv('drawer.action.deposit_notice') });
    const amount = within(box).getByLabelText(re('rsv.amount_sent'));
    await user.clear(amount);
    await user.type(amount, '500000');
    await user.click(within(box).getByRole('button', { name: tv('drawer.action.deposit_notice') }));
    expect(await screen.findByText(tv('rsv.notice.after_cancel_sent'))).toBeInTheDocument();
    expect(
      mockControl.dashboard.state.events.filter(
        (e) => e.kind === 'deposit_after_cancel' && !e.resolvedAt,
      ),
    ).toHaveLength(1);
  });
});

describe('Không thấy tiền – "Cần chú ý" deposit_after_cancel', () => {
  const item = (r: Reservation): AttentionItem =>
    ({
      kind: 'deposit_after_cancel',
      severity: 'warning',
      source: 'event',
      eventId: 'e-1',
      count: 1,
      reservationIds: [r.id],
      refCode: r.code,
    }) as AttentionItem;
  const ctx = (roles: string[]) => ({
    t,
    room: (n?: string | null) => n ?? '',
    channel: (c: string) => c,
    roles: roles as never,
  });

  it('FD+ only, note required with its own help line', () => {
    const r = res('Vũ Thị Lan');
    for (const roles of [['front_desk'], ['front_desk_lead'], ['manager'], ['owner']]) {
      const line = attentionLine(item(r), ctx(roles));
      expect(line.resolveLabel).toBe('today.money_after_cancel_not_found');
      expect(line.noteRequired).toBe(true);
      expect(line.noteHelp).toBe('today.money_after_cancel_not_found_note');
    }
    for (const roles of [['sales_staff'], ['collaborator'], ['housekeeping']])
      expect(attentionLine(item(r), ctx(roles)).resolveLabel).toBeUndefined();
  });

  it('desk: "Không thấy tiền" → note (≥ 3) with the help line → resolved, the item leaves the list', async () => {
    const r = res('Vũ Thị Lan');
    mockControl.dashboard.addEvent({
      kind: 'deposit_after_cancel',
      severity: 'warning',
      count: 1,
      reservationIds: [r.id],
      refCode: r.code,
    });
    const { user } = renderApp('/today', 'qa.fd');
    const text = tv('today.money_after_cancel', { code: r.code });
    const row = (await screen.findByText(text)).closest('li') as HTMLElement;
    await user.click(
      within(row).getByRole('button', { name: tv('today.money_after_cancel_not_found') }),
    );
    const dlg = await screen.findByRole('dialog', { name: re('attn.resolve_title', { what: '' }) });
    const note = within(dlg).getByLabelText(re('attn.resolve_note'));
    expect(note).toHaveAccessibleDescription(tv('today.money_after_cancel_not_found_note'));
    const save = within(dlg).getByRole('button', {
      name: tv('today.money_after_cancel_not_found'),
    });
    expect(save).toBeDisabled();
    await user.type(note, 'Đã kiểm sao kê 15:00, không có');
    await user.click(save);
    await waitFor(() => expect(screen.queryByText(text)).not.toBeInTheDocument());
    expect(mockControl.dashboard.state.events.at(-1)!.resolvedNote).toBe(
      'Đã kiểm sao kê 15:00, không có',
    );
  });

  it('a receipt recorded after closure closes the item (no "Không thấy tiền" left)', async () => {
    const r = noShow(0);
    mockControl.dashboard.addEvent({
      kind: 'deposit_after_cancel',
      severity: 'warning',
      count: 1,
      reservationIds: [r.id],
      refCode: r.code,
    });
    const { user, dlg } = await openBox(r);
    await user.type(field(dlg, 'rsv.amount_received'), '200000');
    await user.upload(field(dlg, 'rsv.after_cancel.proof'), photo());
    await user.type(field(dlg, 'stay.note'), 'tiền về 10:00');
    await user.click(submit(dlg));
    await screen.findByText(
      tv('rsv.after_cancel.done', { amount: money(200_000), code: r.code, refund: money(200_000) }),
    );
    expect(mockControl.dashboard.state.events.at(-1)!.resolvedAt).toEqual(expect.any(String));
  });
});

describe('Có thể trùng + after-cancel refund lines (Đối soát, Hoàn tiền, Cần duyệt)', () => {
  async function twoTransfers() {
    const r = noShow(0);
    const other = res('Nguyễn Văn An');
    mockControl.stay.payments.push({
      id: 'dup-2',
      code: 'PT-0991',
      folioId: other.folioId,
      reservationCode: other.code,
      type: 'deposit',
      method: 'bank_transfer',
      amountVnd: 800_000,
      status: 'succeeded',
      reconciliation: 'pending',
      receivedAt: new Date().toISOString(),
      recordedByUserId: 'someone-else',
      version: 1,
    } satisfies MockPayment);
    const { user, dlg, unmount } = await openBox(r);
    await user.type(field(dlg, 'rsv.amount_received'), '800000');
    await user.upload(field(dlg, 'rsv.after_cancel.proof'), photo());
    await user.type(field(dlg, 'pay.bank_reference_optional'), 'FT26311009');
    await user.type(field(dlg, 'stay.note'), 'tiền về 11:00');
    await user.click(submit(dlg));
    await screen.findByText(
      tv('rsv.after_cancel.done', { amount: money(800_000), code: r.code, refund: money(800_000) }),
    );
    unmount();
    return { r, other };
  }

  it('Hoàn tiền (MGR): why + fixed destination, no "Nhập nơi nhận hoàn", the chip with the other code', async () => {
    const { r, other } = await twoTransfers();
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const card = (await screen.findByText(new RegExp(`^${r.code} · 800.000`))).closest('li')!;
    expect(within(card).getByText(tv('refund.after_cancel_note'))).toBeInTheDocument();
    expect(within(card).getByText(tv('refund.after_cancel_destination'))).toBeInTheDocument();
    expect(within(card).getByText(tv('refund.after_cancel_guest_line'))).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: tv('refund.set_destination') })).toBeNull();
    expect(within(card).getByText(tv('pay.possible_duplicate'))).toBeInTheDocument();
    expect(
      within(card).getByText(tv('pay.possible_duplicate_note', { codes: other.code })),
    ).toBeInTheDocument();
  });

  it('Cần duyệt (MGR): the same lines and the chip on the request', async () => {
    const { r } = await twoTransfers();
    renderApp('/approvals', 'qa.mgr');
    const card = (await screen.findByText(new RegExp(`^${r.code} · `))).closest('li')!;
    expect(within(card).getByText(tv('refund.after_cancel_destination'))).toBeInTheDocument();
    expect(within(card).getByText(tv('pay.possible_duplicate'))).toBeInTheDocument();
  });

  it('Đối soát: the reference column shows bankReference, and the chip on both transfers', async () => {
    const { r, other } = await twoTransfers();
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('co.recon_title') }));
    // V5-51: the reference the desk typed is the number in the column.
    const row = (await screen.findByText('FT26311009')).closest('tr')!;
    expect(within(row).getByText(r.code)).toBeInTheDocument();
    expect(within(row).getByText(tv('pay.possible_duplicate'))).toBeInTheDocument();
    expect(
      within(row).getByText(tv('pay.possible_duplicate_note', { codes: other.code })),
    ).toBeInTheDocument();
    const otherRows = screen
      .getAllByText(other.code, { selector: 'td' })
      .map((td) => td.closest('tr')!)
      .filter((tr) => within(tr).queryByText(tv('pay.possible_duplicate')));
    expect(otherRows).toHaveLength(1);
    expect(otherRows[0]).toHaveTextContent(tv('pay.possible_duplicate_note', { codes: r.code }));
  });

  it('executeRefund 409 with no transfer left (currentState cash) → refund_no_transfer_left, never a cash button', async () => {
    const r = noShow(0);
    const now = new Date().toISOString();
    mockControl.stay.approvals.push({
      id: 'ac-1',
      type: 'refund',
      status: 'approved',
      reservationCode: r.code,
      folioId: r.folioId,
      amountVnd: 500_000,
      reasonCode: 'payment_after_cancel',
      requestedBy: 'Hạnh',
      requestedByUserId: 'fd-user',
      requestedAt: now,
      approverName: 'Chủ đầu tư',
      approverUserId: 'owner-user',
      decidedAt: now,
      refundDestination: { method: 'original_method', setAt: now },
      version: 1,
    });
    mockControl.failNext(/\/approval-requests\/ac-1\/actions\/execute-refund:POST$/, 409, {
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      code: 'INVALID_TRANSITION',
      currentState: 'cash',
    });
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const card = (await screen.findByText(new RegExp(`^${r.code} · 500.000`))).closest('li')!;
    expect(within(card).queryByRole('button', { name: tv('refund.execute_cash') })).toBeNull();
    await user.click(within(card).getByRole('button', { name: tv('refund.execute_transfer') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_transfer') });
    expect(within(dlg).getByText(tv('refund.after_cancel_destination'))).toBeInTheDocument();
    expect(within(dlg).queryByRole('button', { name: tv('refund.show_account') })).toBeNull();
    await user.type(
      within(dlg).getByLabelText(new RegExp(esc(tv('refund.bank_reference')))),
      'FT26311777',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('refund.execute_transfer') }));
    expect(await within(dlg).findByText(tv('error.refund_no_transfer_left'))).toBeInTheDocument();
  });
});

describe('V5-51 – Mã giao dịch in every box that records a transfer', () => {
  const ref = (scope: HTMLElement) =>
    within(scope).getByLabelText(re('pay.bank_reference_optional'));

  it('Xác nhận cọc (hold): transfer → payment.bankReference; cash → no field, nothing sent', async () => {
    const r = res('Lê Minh');
    const sent = capture('POST', /\/actions\/confirm-deposit$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await user.click(
      await within(drawer).findByRole('button', { name: tv('drawer.action.confirm_deposit') }),
    );
    const dlg = await screen.findByRole('dialog', {
      name: tv('rsv.deposit_title', { code: r.code }),
    });
    const method = within(dlg).getByLabelText(tv('pay.method'));
    await user.selectOptions(method, 'cash');
    expect(within(dlg).queryByLabelText(re('pay.bank_reference_optional'))).toBeNull();
    await user.selectOptions(method, 'bank_transfer');
    expect(ref(dlg)).toHaveAccessibleDescription(tv('pay.bank_reference_help'));
    await user.type(ref(dlg), 'FT26311002');
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    await waitFor(() => expect(sent.sent).toHaveLength(1));
    sent.stop();
    expect((sent.sent[0]!.payment as Record<string, unknown>).bankReference).toBe('FT26311002');
  });

  it('Thu công nợ: transfer → bankReference on recordPayment', async () => {
    const r = res('Ngọc Anh');
    const f = mockControl.stay.folios.get(r.folioId)!;
    f.status = 'settled';
    f.lines.push({ ...f.lines[0]!, id: 'debt-line', amountVnd: 300_000, unitPriceVnd: 300_000 });
    r.balanceDueVnd = 300_000;
    const sent = capture('POST', /\/folios\/[^/]+\/payments$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(drawer).findByRole('button', { name: tv('debt.collect') }));
    const box = await screen.findByRole('dialog', {
      name: tv('debt.collect_title', { code: r.code }),
    });
    await user.click(await within(box).findByRole('button', { name: tv('pay.bank_transfer') }));
    await user.type(ref(box), 'FT26311003');
    await user.click(
      within(box).getByRole('button', {
        name: re('debt.collect_submit', { amount: '' }),
      }),
    );
    await waitFor(() => expect(sent.sent).toHaveLength(1));
    sent.stop();
    expect(sent.sent[0]).toMatchObject({ method: 'bank_transfer', bankReference: 'FT26311003' });
  });

  it('Thu tiền (PaymentPanel): transfer → bankReference; cash sends none', async () => {
    const r = res('Nguyễn Văn An');
    const sent = capture('POST', /\/folios\/[^/]+\/payments$/);
    mockControl.signInAs('qa.fd');
    const user = userEvent.setup();
    const Ready = ({ children }: { children: ReactNode }) =>
      useSession().property ? <>{children}</> : null;
    render(
      <Providers>
        <MemoryRouter>
          <Ready>
            <PaymentPanel reservation={r} balanceVnd={200_000} onPaid={() => undefined} />
          </Ready>
        </MemoryRouter>
      </Providers>,
    );
    await user.click(await screen.findByRole('button', { name: tv('pay.bank_transfer') }));
    await user.type(ref(document.body), 'FT26311004');
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(200_000) }) }),
    );
    await waitFor(() => expect(sent.sent).toHaveLength(1));
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    expect(screen.queryByLabelText(re('pay.bank_reference_optional'))).toBeNull();
    sent.stop();
    expect(sent.sent[0]).toMatchObject({ method: 'bank_transfer', bankReference: 'FT26311004' });
  });

  it('Nhận phòng (payment with B9): transfer → payment.bankReference', async () => {
    const r = res('Gia đình anh Hưng');
    const due = r.balanceDueVnd!;
    mockControl.stay.registrations.get(r.registrationId!)!.documents.push({
      id: `doc-${r.id}`,
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: 'Khách thử',
      nationalityCode: 'VNM',
      docNumber: '079000000001',
      dateOfBirth: '1985-04-02',
      gender: 'male',
      imageIds: [],
      imageConsent: 'refused',
      captureMethod: 'manual',
      checks: [],
    });
    const sent = capture('POST', /\/actions\/check-in$/);
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await screen.findByRole('heading', { name: /Nhận phòng/ });
    await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
    const go = await screen.findByRole('button', { name: tv('ci.submit', { room: '302' }) });
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    await user.click(screen.getByRole('button', { name: tv('pay.bank_transfer') }));
    await user.type(screen.getByLabelText(re('ci.pay_received')), String(due));
    await user.type(ref(document.body), 'FT26311006');
    await user.click(go);
    const box = await screen.findByRole('alertdialog', { name: /Nhận phòng căn 302/ });
    await user.click(within(box).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    await waitFor(() => expect(sent.sent).toHaveLength(1));
    sent.stop();
    expect(sent.sent[0]!.payment).toMatchObject({
      method: 'bank_transfer',
      amountVnd: due,
      bankReference: 'FT26311006',
    });
    await waitFor(() =>
      expect(mockControl.stay.payments.at(-1)).toMatchObject({ bankReference: 'FT26311006' }),
    );
  });

  it('Đặt phòng mới (deposit by transfer) → initialPayment.bankReference', async () => {
    const sent = capture('POST', /\/reservations$/);
    const { user } = renderApp('/rack', 'qa.fd');
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
    const dlg = await screen.findByRole('dialog', { name: /Đặt phòng mới/ });
    const room = within(dlg).getByLabelText(/^Căn/);
    await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
    await user.selectOptions(room, within(room).getByRole('option', { name: /^201 / }));
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(within(dlg).getByLabelText('Ngày đến'), {
      target: { value: addDays(todayLocal(), 40) },
    });
    fireEvent.change(within(dlg).getByLabelText('Ngày đi'), {
      target: { value: addDays(todayLocal(), 42) },
    });
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Trần Minh');
    await user.click(await screen.findByRole('option', { name: /Trần Minh Khoa/ }));
    const received = await within(dlg).findByLabelText(re('rsv.amount_received'));
    await user.clear(received);
    await user.type(received, '1000000');
    const methods = within(dlg)
      .getAllByLabelText(tv('pay.method'))
      .find((x) => x.tagName === 'SELECT')!;
    await user.selectOptions(methods, 'bank_transfer');
    await user.type(ref(dlg), 'FT26311005');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    sent.stop();
    const body = sent.sent.find((b) => b.initialPayment)!;
    expect(body.initialPayment).toMatchObject({
      method: 'bank_transfer',
      bankReference: 'FT26311005',
    });
  });
});
