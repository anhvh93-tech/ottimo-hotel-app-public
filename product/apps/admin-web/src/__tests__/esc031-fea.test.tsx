// Round 3 – FE-A ESC-031 (INV 26/10, ESC-024 B; BE-B `esc031-be-b.md`, ARC OpenAPI 0.3.8 addendum 8, SEC-sprint1 8.6,
// DOM E31-02): when the night of departure cannot be sold, the desk records the one-night late fee the server computed
// ("Ghi phụ thu – quản lý xem lại") – read-only number, reason required, body EXACTLY {amountVnd, reason, postReview},
// no manager password and no waiver on that path; the old desk confirmation only while 2FA is not enforced. 409
// SURCHARGE_CHANGED / 422 NOT_ALLOWED said in place. OWN/MGR get a "Cần chú ý" item that opens the folio (A32) and
// closes with "Đã xem"; FD never sees it.
import { newIdempotencyKey, type AttentionItem } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { attentionLine } from '../app/attention';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD, PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const num = (s: string) => Number(s.replace(/\D/g, ''));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const REASON = 'Rời 19:30, căn có khách đến tối nay';
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

/** Every B18 call: body and Idempotency-Key, as the browser sent them. */
function captureCheckouts() {
  const sent: Array<{ body: Record<string, unknown>; key: string | null }> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'POST' || !/\/actions\/check-out$/.test(new URL(request.url).pathname))
      return;
    const key = request.headers.get('idempotency-key');
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push({ body: b, key }));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

/** Phạm Huy (201) leaves at 19:30 while "Gia đình anh Hưng" arrives in 201 tonight – the extra night cannot be sold. */
function soldTonight() {
  at('19:40');
  const r = res('Phạm Huy');
  const next = res('Gia đình anh Hưng');
  next.roomId = r.roomId;
  next.arrivalDate = r.departureDate;
  mockControl.stay.minibarChecks.set(r.id, []);
  return r;
}

async function feeOf(reservationId: string) {
  return (await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId }, '19:30')).data;
}

async function toBill(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
    target: { value: '19:30' },
  });
  await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
}

const reviewBox = async (fee: number) =>
  (
    await screen.findByRole('heading', { name: tv('co.late_fee_pr_title', { amount: money(fee) }) })
  ).closest('section')!;

async function payCash(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
  await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
  const balanceRow = screen.getByRole('row', {
    name: new RegExp(`^${tv('checkout.summary.balance')}\\s*\\d`),
  });
  await waitFor(() => expect(num(balanceRow.textContent ?? '')).toBe(0));
}

async function complete(user: ReturnType<typeof renderApp>['user']) {
  await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
  const dialog = await screen.findByRole('alertdialog');
  await user.click(within(dialog).getAllByRole('button')[1]!);
  return dialog;
}

describe('ESC-031 – H16 "Ghi phụ thu – quản lý xem lại" (postReview)', () => {
  it('2FA bắt buộc (production): chỉ một cách, số chỉ đọc, lý do bắt buộc, KHÔNG ô mật khẩu/ô miễn; body đúng {amountVnd, reason, postReview}', async () => {
    mockControl.db.mfaEnforced = true;
    const r = soldTonight();
    const checkouts = captureCheckouts();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (await feeOf(r.id)).lateFeeAsNightVnd!;
    expect(fee).toBeGreaterThan(0);
    const box = await reviewBox(fee);

    // The name on the staff sheet (staff-one-pager step 3, DOM E31-02); the desk path is not offered at all.
    const group = within(box).getByRole('group', { name: tv('co.late_fee_mode') });
    const only = within(group).getAllByRole('button');
    expect(only).toHaveLength(1);
    expect(only[0]).toHaveTextContent(tv('co.late_fee_mode_review'));
    expect(only[0]).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.queryByRole('button', { name: tv('co.late_fee_mode_desk') }),
    ).not.toBeInTheDocument();
    // SEC 8.6: no manager-password panel, no waiver.
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(
      screen.queryByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`)),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(new RegExp(`^${esc(tv('co.late_fee_approver'))}`)),
    ).not.toBeInTheDocument();
    expect(
      within(box).queryByRole('switch', { name: tv('co.late_fee_foc') }),
    ).not.toBeInTheDocument();
    // The server's number, read-only (no input carries it), with "call the manager first".
    expect(within(box).getByText(tv('co.late_fee_pr_help'))).toBeInTheDocument();
    const sum = within(box).getByLabelText(tv('co.late_fee_pr_sum'));
    expect(sum).toHaveTextContent(money(fee));
    expect(within(box).getAllByRole('textbox')).toHaveLength(1); // the reason only

    const locked = screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ });
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(locked).toHaveAccessibleDescription(tv('co.late_fee_pr_needs'));
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
      REASON,
    );
    await payCash(user);

    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText(tv('co.late_fee_pr_effect', { amount: money(fee) })),
    ).toBeInTheDocument();
    await user.click(within(dialog).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    checkouts.stop();

    // SEC 8.6: exactly these three fields – no credential key at all, not even empty.
    const lf = checkouts.sent.at(-1)!.body.lateFeeInsteadOfNight as Record<string, unknown>;
    expect(lf).toStrictEqual({ amountVnd: fee, reason: REASON, postReview: true });
    for (const k of [
      'approverUsername',
      'authMethod',
      'secret',
      'totpCode',
      'confirmationId',
      'requestFoc',
    ])
      expect(Object.keys(lf)).not.toContain(k);
    expect(checkouts.sent.at(-1)!.body.extraNight).toBeUndefined();

    const f = mockControl.stay.folios.get(r.folioId)!;
    expect(f.lines.find((l) => l.chargeCode === 'late_fee_as_night')).toMatchObject({
      category: 'late_checkout',
      amountVnd: fee,
    });
    expect(f.lines.some((l) => l.category === 'foc')).toBe(false);
    expect(
      mockControl.stay.audit.some((a) => a.action === 'reservation.late_fee_instead_of_night'),
    ).toBe(true);
    // One "Cần chú ý" item for OWN/MGR.
    const items = mockControl.dashboard.state.events.filter(
      (e) => e.kind === 'late_fee_post_review',
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ refCode: r.code, audience: ['owner', 'manager'] });
  });

  it('2FA chưa bắt buộc (dev/CI): có cả cách cũ; gõ mật khẩu ở panel cũ rồi đổi về "Ghi phụ thu" → mật khẩu bị xóa, body không mang trường xác nhận nào', async () => {
    mockControl.db.mfaEnforced = false;
    const r = soldTonight();
    const checkouts = captureCheckouts();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (await feeOf(r.id)).lateFeeAsNightVnd!;
    await reviewBox(fee);
    // Default = review; the desk confirmation is the second choice.
    expect(screen.getByRole('button', { name: tv('co.late_fee_mode_review') })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(await screen.findByRole('button', { name: tv('co.late_fee_mode_desk') }));
    const deskBox = (
      await screen.findByRole('heading', {
        name: tv('co.late_fee_confirm_title', { amount: money(fee) }),
      })
    ).closest('section')!;
    await user.type(
      within(deskBox).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_approver'))}`)),
      'qa.mgr',
    );
    await user.type(
      within(deskBox).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`)),
      'typed-secret',
    );
    await user.click(within(deskBox).getByRole('switch', { name: tv('co.late_fee_foc') }));

    await user.click(screen.getByRole('button', { name: tv('co.late_fee_mode_review') }));
    const box = await reviewBox(fee);
    expect(document.querySelector('input[type="password"]')).toBeNull();
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
      REASON,
    );
    await payCash(user);
    await complete(user);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    checkouts.stop();
    const lf = checkouts.sent.at(-1)!.body.lateFeeInsteadOfNight as Record<string, unknown>;
    expect(lf).toStrictEqual({ amountVnd: fee, reason: REASON, postReview: true });
    expect(JSON.stringify(checkouts.sent.at(-1)!.body)).not.toContain('typed-secret');
  });

  it('đổi lại sang cách cũ sau khi đã gõ mật khẩu → ô mật khẩu trống (không giữ trong state)', async () => {
    mockControl.db.mfaEnforced = false;
    const r = soldTonight();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (await feeOf(r.id)).lateFeeAsNightVnd!;
    await reviewBox(fee);
    await user.click(await screen.findByRole('button', { name: tv('co.late_fee_mode_desk') }));
    const secret = () => screen.getByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`));
    await user.type(secret(), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: tv('co.late_fee_mode_review') }));
    await reviewBox(fee);
    await user.click(screen.getByRole('button', { name: tv('co.late_fee_mode_desk') }));
    expect(secret()).toHaveValue('');
  });

  it('409 SURCHARGE_CHANGED → câu riêng với số mới, chưa ghi gì, số tải lại; lần bấm sau là lệnh mới (Idempotency-Key khác)', async () => {
    mockControl.db.mfaEnforced = true;
    const r = soldTonight();
    const checkouts = captureCheckouts();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (await feeOf(r.id)).lateFeeAsNightVnd!;
    const box = await reviewBox(fee);
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
      REASON,
    );
    await payCash(user);
    mockControl.failNext(/\/actions\/check-out:POST$/, 409, {
      code: 'SURCHARGE_CHANGED',
      surchargeVnd: fee + 100_000,
      tierPct: 100,
    });
    await complete(user);
    expect(
      (await screen.findAllByText(tv('co.late_fee_pr_changed', { amount: money(fee + 100_000) })))
        .length,
    ).toBeGreaterThan(0);
    expect(res('Phạm Huy').status).toBe('in_house');
    await complete(user);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    checkouts.stop();
    await waitFor(() => expect(checkouts.sent.length).toBe(2));
    expect(checkouts.sent[0]!.key).toBeTruthy();
    expect(checkouts.sent[1]!.key).not.toBe(checkouts.sent[0]!.key);
    expect(checkouts.sent[1]!.body.lateFeeInsteadOfNight).toStrictEqual({
      amountVnd: fee,
      reason: REASON,
      postReview: true,
    });
  });

  it('422 NOT_ALLOWED (đêm bán được lại) → câu riêng, về bước Phụ phí, đơn vẫn đang ở', async () => {
    mockControl.db.mfaEnforced = true;
    const r = soldTonight();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (await feeOf(r.id)).lateFeeAsNightVnd!;
    const box = await reviewBox(fee);
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
      REASON,
    );
    await payCash(user);
    mockControl.failNext(/\/actions\/check-out:POST$/, 422, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'lateFeeInsteadOfNight', code: 'NOT_ALLOWED' }],
    });
    await complete(user);
    expect(await screen.findByText(tv('co.late_fee_pr_not_allowed'))).toBeInTheDocument();
    // Back on step 2 (Extras) – its "continue" button is the one shown.
    expect(await screen.findByRole('button', { name: tv('co.go_bill') })).toBeInTheDocument();
    expect(res('Phạm Huy').status).toBe('in_house');
  });

  it('đường quầy cũ bị 401 → câu chung + chỉ sang "Ghi phụ thu – quản lý xem lại"', async () => {
    mockControl.db.mfaEnforced = false;
    const r = soldTonight();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (await feeOf(r.id)).lateFeeAsNightVnd!;
    await reviewBox(fee);
    await user.click(await screen.findByRole('button', { name: tv('co.late_fee_mode_desk') }));
    await user.type(screen.getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)), REASON);
    await user.type(
      screen.getByLabelText(new RegExp(`^${esc(tv('co.late_fee_approver'))}`)),
      'qa.mgr',
    );
    await user.type(
      screen.getByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`)),
      'not-the-password',
    );
    await payCash(user);
    await complete(user);
    expect(
      (await screen.findAllByText(new RegExp(esc(tv('co.late_fee_auth_try_review'))))).length,
    ).toBeGreaterThan(0);
  });
});

describe('ESC-031 – "Cần chú ý" late_fee_post_review (OWN/MGR)', () => {
  const ctx = {
    t: (k: string, a?: Record<string, string | number>) => translate('vi', k, a),
    roles: ['manager' as const],
    room: (n?: string | null) => n ?? '',
    channel: (c: string) => c,
  };
  const item: AttentionItem = {
    kind: 'late_fee_post_review',
    source: 'event',
    eventId: 'e-31',
    severity: 'warning',
    count: 1,
    refCode: 'OTM-0203',
    reservationIds: ['r-203'],
    dueAt: '2026-11-03T19:30:00+07:00',
  };

  it('một câu theo mã đơn, hạn xem lại, "Mở folio" tới đơn + folio, nút "Đã xem"', () => {
    const line = attentionLine(item, ctx);
    expect(line.text).toBe(tv('attn.late_fee_post_review_one', { code: 'OTM-0203' }));
    expect(line.sub).toBe(tv('attn.late_fee_post_review_sub', { time: '19:30', date: '03/11' }));
    expect(line.to).toBe('/reservations/r-203?open=folio');
    expect(line.openLabel).toBe('attn.late_fee_open_folio');
    expect(line.resolveLabel).toBe('attn.reviewed');
    expect(line.tone).toBe('soon');
    expect(attentionLine({ ...item, count: 2, refCode: undefined }, ctx).text).toBe(
      tv('attn.late_fee_post_review', { n: 2 }),
    );
  });

  it('OWN thấy mục, "Mở folio" mở folio của đơn (Điều chỉnh – A32), "Đã xem" đóng mục; FD không thấy, FD đóng → 404', async () => {
    const r = res('Phạm Huy');
    const e = mockControl.dashboard.addEvent({
      kind: 'late_fee_post_review',
      severity: 'warning',
      count: 1,
      refCode: r.code,
      reservationIds: [r.id],
      dueAt: new Date(Date.now() + 24 * 3_600_000).toISOString(),
      audience: ['owner', 'manager'],
    });

    // FD: nothing on "Hôm nay", and closing it by id is a 404 (server filter).
    const fd = renderApp('/today', 'qa.fd');
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() =>
      expect(
        screen.queryByText(tv('attn.late_fee_post_review_one', { code: r.code })),
      ).not.toBeInTheDocument(),
    );
    await expect(
      api.resolveAttentionEvent(
        { propertyId: PROPERTY_ID, eventId: e.eventId },
        {},
        newIdempotencyKey(),
      ),
    ).rejects.toMatchObject({ status: 404 });
    fd.unmount();

    const { user } = renderApp('/today', 'qa.owner');
    const text = await screen.findByText(tv('attn.late_fee_post_review_one', { code: r.code }));
    const row = text.closest('li')!;
    const open = within(row).getByRole('link', { name: tv('attn.late_fee_open_folio') });
    expect(open).toHaveAttribute('href', `/reservations/${r.id}?open=folio`);
    await user.click(within(row).getByRole('button', { name: tv('attn.reviewed') }));
    const dlg = await screen.findByRole('dialog');
    await user.click(within(dlg).getAllByRole('button').at(-1)!);
    await waitFor(() =>
      expect(
        screen.queryByText(tv('attn.late_fee_post_review_one', { code: r.code })),
      ).not.toBeInTheDocument(),
    );
    expect(
      mockControl.dashboard.state.events.find((x) => x.eventId === e.eventId)?.resolvedAt,
    ).toBeTruthy();
  });

  it('`?open=folio` mở folio của đơn ngay khi đọc xong đơn', async () => {
    const r = res('Phạm Huy');
    renderApp(`/reservations/${r.id}?open=folio`, 'qa.mgr');
    expect(
      await screen.findByRole('dialog', { name: tv('folio.dialog_title', { code: r.code }) }),
    ).toBeInTheDocument();
  });
});
