import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { translate } from '@ottimo/i18n';
import { renderApp, tv } from '../test/render';

/** `{amount}` = number WITH the unit (content-guide 4, FE-S3-16). */
const M = tv('common.currency_vnd', { amount: '2.485.000' });

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Pin the clock (only `Date`, timers stay real) – typed times are checked against it (E03-07). */
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};

describe('H16 Trả phòng 3 bước + bill + VietQR (US-035…039, US-119, US-120; B18)', () => {
  afterEach(() => vi.useRealTimers());

  it('minibar → extras → VietQR drawn locally → "Ghi nhận đã thu" → complete with the consequence box', async () => {
    at('11:30');
    const r = res('Phạm Huy');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.check_out') }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(tv('checkout.title', { room: '201', guest: 'Phạm Huy' })),
      }),
    ).toBeInTheDocument();

    // Step 1 – Coca-Cola: 1 of 2 left → 25.000 (US-035 AC1); counts limited to 0…standard (AC3).
    const coke = (await screen.findByRole('rowheader', { name: /Coca-Cola/ })).closest('tr')!;
    await user.click(within(coke).getByRole('button', { name: /^Giảm/ }));
    expect(within(coke).getByText('25.000')).toBeInTheDocument();
    expect(within(coke).getByRole('button', { name: /^Tăng/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));

    // Step 2 – departure at the standard time → no late surcharge.
    expect(await screen.findByText(tv('checkout.late_none'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));

    // Step 3 – VietQR: the server gives payload + transfer content; the QR is an inline SVG.
    const total = 3 * 820_000 + 25_000; // 2.485.000 (US-037 AC1 example)
    await waitFor(() => expect(screen.getByText(`${tv('bill.total')}: ${M}`)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: tv('pay.vietqr_create', { amount: M }) }));
    const content = r.code.replace('-', '');
    const qr = await screen.findByRole('img', {
      name: tv('pay.qr_label', { amount: M, ref: content }),
    });
    // FE-S3-07: "copy content" copies only the transfer content (what the guest pastes).
    await user.click(screen.getByRole('button', { name: tv('pay.copy_ref') }));
    expect(await navigator.clipboard.readText()).toBe(content);
    expect(qr.tagName.toLowerCase()).toBe('svg');
    expect(qr.querySelector('path')?.getAttribute('d')).toMatch(/^M4 4h1v1h-1z/);
    // DS 11.6 B1: the sentence stays in the UI font, only the transfer content is mono (VietQrCard).
    const ref = screen.getByText(content, { selector: '.mono' });
    expect(ref.parentElement?.textContent).toBe(tv('pay.qr_note', { ref: content }));
    // No third-party QR image anywhere (SEC F2).
    expect(document.querySelector('img[src*="vietqr"]')).toBeNull();

    await user.click(screen.getByRole('button', { name: tv('pay.record', { amount: M }) }));
    await waitFor(() => expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument());
    const pay = mockControl.stay.payments.find(
      (p) => p.folioId === r.folioId && p.method === 'vietqr',
    )!;
    expect(pay.amountVnd).toBe(total);
    expect(pay.status).toBe('succeeded');
    expect(pay.reconciliation).toBe('pending'); // "chờ đối soát" until MGR matches the statement

    await user.click(screen.getByRole('button', { name: tv('co.complete_paid', { amount: M }) }));
    const box = await screen.findByRole('alertdialog', {
      name: tv('checkout.complete_confirm_title', { room: '201' }),
    });
    expect(within(box).getByText(tv('co.effect_bill'))).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: tv('confirm.keep') })).toHaveFocus();
    await user.click(
      within(box).getByRole('button', { name: tv('co.complete_paid', { amount: M }) }),
    );

    expect((await screen.findAllByText(tv('checkout.done'))).length).toBeGreaterThan(0);
    expect(res('Phạm Huy').status).toBe('checked_out');
    // S4-49 B1: the folio number is set in JetBrains Mono (`.mono`) inside the sentence.
    const doneLine = screen.getByText(
      (_, el) => el?.tagName === 'P' && /^Phiếu F26-\d{6}/.test(el.textContent ?? ''),
    );
    expect(within(doneLine).getByText(/^F26-\d{6}$/)).toHaveClass('mono');
  });

  it('blocked by the server: minibar not checked / VietQR not configured are explained in place', async () => {
    // Departure time defaults to "now" (KB7) – before the standard time, no late surcharge in the way.
    at('11:30');
    const r = res('Phạm Huy');
    mockControl.stay.paymentNotConfigured = true;
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    // Skip ahead without recording the minibar.
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    await user.click(await screen.findByRole('button', { name: /^Tạo VietQR · / }));
    expect(await screen.findByText(tv('error.PAYMENT_NOT_CONFIGURED'))).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /VietQR/ })).not.toBeInTheDocument();
  });

  it('bill: bilingual for a foreign guest with the USD reference, VAT note, print (no download)', async () => {
    at('11:30');
    const r = res('Kim Seo-yeon');
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    await user.click(await screen.findByRole('button', { name: tv('co.preview_bill') }));
    const bill = await screen.findByRole('dialog', { name: tv('bill.title') });
    expect(within(bill).getByText(tv('bill.vat_note'))).toBeInTheDocument();
    // Bilingual by default for a foreign guest (Bill.locale = vi_en): EN under each VI label.
    expect(within(bill).getByText(translate('en', 'bill.vat_note'))).toHaveAttribute('lang', 'en');
    expect(within(bill).getByText(/≈ [\d,.]+ USD/)).toBeInTheDocument();
    expect(within(bill).getByRole('button', { name: tv('co.bill_vien') })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(bill).getByRole('button', { name: tv('co.print') })).toBeInTheDocument();
  });

  it('after the last tier (18:00) the check-out adds one more night instead of a late surcharge (E05-11)', async () => {
    at('19:40');
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    // Guest actually leaves at 19:30 → after 18:00 → the check-out adds one night (no late surcharge).
    const time = await screen.findByLabelText(new RegExp(tv('checkout.departure_time')));
    fireEvent.change(time, { target: { value: '19:30' } });
    const rate = await screen.findByLabelText(
      new RegExp(`^${tv('checkout.extra_night_rate_label')}`),
    );
    // Default = the room's current list price, editable; the box says it replaces the surcharge.
    expect(rate).toHaveValue('708.000');
    expect(screen.getByText(tv('checkout.extra_night_title'))).toBeInTheDocument();
    expect(
      screen.getByText(
        tv('checkout.extra_night_body', {
          amount: tv('common.currency_vnd', { amount: '708.000' }),
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(tv('checkout.late_none'))).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    // The summary already shows the night (`bill.line.extra_night`) – its calendar price (DOM S4-38).
    expect(
      await screen.findByText(
        new RegExp(
          `^${tv('bill.line.extra_night', { date: '.*' })} · ${tv('rate.pre_tier_short')}$`,
        ),
      ),
    ).toBeInTheDocument();
    // Balance now includes the extra night – pay it in cash, then complete.
    await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
    await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
    // BUG-R3-017: the extra night is posted by B18 – the cash goes with "Hoàn tất" (`finalPayment`), not recorded now.
    await screen.findByText(
      new RegExp(
        `^${esc(tv('co.pay_at_complete', { method: tv('pay.cash'), amount: '§' }).split('§')[0]!)}`,
      ),
    );
    await user.click(screen.getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
    const box = await screen.findByRole('alertdialog');
    await user.click(within(box).getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    const f = mockControl.stay.folios.get(r.folioId)!;
    expect(f.lines.some((l) => l.description === 'extra_night' && l.amountVnd === 708_000)).toBe(
      true,
    );
    expect(f.lines.some((l) => l.category === 'late_checkout')).toBe(false);
  });

  it('checkout recorded long after the guest left asks for a note (TIME_NOTE_REQUIRED)', async () => {
    at('16:00');
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    mockControl.stay.payments.push({
      id: 'p-x',
      code: 'PT-X',
      folioId: r.folioId,
      type: 'charge',
      method: 'cash',
      amountVnd: 2_460_000,
      status: 'succeeded',
      reconciliation: 'not_required',
      version: 1,
    });
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const time = await screen.findByLabelText(new RegExp(tv('checkout.departure_time')));
    fireEvent.change(time, { target: { value: '12:00' } });
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    await user.click(await screen.findByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    const box = await screen.findByRole('alertdialog');
    await user.click(within(box).getAllByRole('button')[1]!);
    // KB7 (3): the error brings the desk back to step 2, where the note field is – focused, with the reason.
    const note = await screen.findByLabelText(new RegExp(`^${esc(tv('checkout.time_note'))}`));
    await waitFor(() => expect(note).toHaveFocus());
    expect(note).toHaveAccessibleDescription(new RegExp(esc(tv('field.TIME_NOTE_REQUIRED'))));
    expect(screen.getByRole('button', { name: tv('co.go_bill') })).toBeInTheDocument();
    await user.type(note, 'Khách đi lúc 12:00, ghi bù');
    // Typing the note clears the red line (KB7 (4)).
    expect(screen.queryByText(tv('field.TIME_NOTE_REQUIRED'))).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    await user.click(await screen.findByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    const box2 = await screen.findByRole('alertdialog');
    await user.click(within(box2).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
  });

  it('post-midnight window on the departure day: default time = now, no surcharge, no extra night', async () => {
    at('02:10');
    const r = res('Phạm Huy');
    r.departureDate = todayLocal();
    mockControl.stay.minibarChecks.set(r.id, []);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    expect(await screen.findByLabelText(new RegExp(tv('checkout.departure_time')))).toHaveValue(
      '02:10',
    );
    expect(await screen.findByText(tv('checkout.late_none'))).toBeInTheDocument();
    expect(screen.getByText(tv('checkout.post_midnight'))).toBeInTheDocument();
    expect(
      screen.queryByLabelText(new RegExp(`^${tv('checkout.extra_night_rate_label')}`)),
    ).not.toBeInTheDocument();
  });

  it('extra night impossible (room sold tonight) → says so and "Hoàn tất" stays locked', async () => {
    at('19:40');
    const r = res('Phạm Huy');
    const next = res('Gia đình anh Hưng');
    next.roomId = r.roomId;
    next.arrivalDate = r.departureDate;
    mockControl.stay.minibarChecks.set(r.id, []);
    // A server before 0.3.7 bổ sung 4 (no `lateFeeAsNightVnd`) – BR-416-06 is covered in s4-416-fea.test.tsx.
    mockControl.stay.legacyNoLateFeeAsNight = true;
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
      target: { value: '19:30' },
    });
    expect(await screen.findByText(tv('checkout.extra_night_unavailable'))).toBeInTheDocument();
    expect(
      screen.queryByLabelText(new RegExp(`^${tv('checkout.extra_night_rate_label')}`)),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    const done = await screen.findByRole('button', { name: /hoàn tất|Hoàn tất/ });
    expect(done).toHaveAttribute('aria-disabled', 'true');
    expect(done).toHaveAccessibleDescription(tv('checkout.extra_night_unavailable'));
  });
});

/**
 * KB7 (UXR 17/10, đề xuất P1): after the 12:30 grace, going straight to H16 showed 12:00 / "Trả đúng giờ",
 * step 3 said "Đã thanh toán đủ" without the late surcharge, and "Hoàn tất" ended on 409 BALANCE_DUE.
 */
describe('KB7 – trả phòng sau giờ ân hạn, vào thẳng H16', () => {
  afterEach(() => vi.useRealTimers());

  /** Phạm Huy (201): minibar checked, room nights fully paid – only the late surcharge is left to collect. */
  const prepaid = () => {
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    mockControl.stay.payments.push({
      id: 'p-kb7',
      code: 'PT-KB7',
      folioId: r.folioId,
      type: 'charge',
      method: 'cash',
      amountVnd: 2_460_000,
      status: 'succeeded',
      reconciliation: 'not_required',
      version: 1,
    });
    return r;
  };
  const liveLate = (folioId: string) =>
    mockControl.stay.folios
      .get(folioId)!
      .lines.filter((l) => l.category === 'late_checkout' && l.lineState === 'posted')
      .map((l) => l.amountVnd);
  /** "Phụ thu trả muộn: 246.000 đ (30% giá đêm cuối)" → the amount the desk saw (string with unit). */
  const lateShown = async (pct: number) => {
    const re = new RegExp(
      `^${esc(tv('checkout.late_fee', { amount: '§', pct })).replace('§', '(.+)')}$`,
    );
    const el = await screen.findByText(re);
    return re.exec(el.textContent ?? '')![1]!;
  };

  it('default time = now (14:05), amount on step 2, tick → written before the bill → collected → done', async () => {
    at('14:05');
    const r = prepaid();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    // (2) not 12:00 / "Trả đúng giờ" – the time the guest leaves, with the surcharge of that time.
    expect(await screen.findByLabelText(new RegExp(tv('checkout.departure_time')))).toHaveValue(
      '14:05',
    );
    const amount = await lateShown(30);
    expect(screen.queryByText(tv('checkout.late_none'))).not.toBeInTheDocument();
    // The "use Trả muộn in the drawer" hint is gone: amount and tick are right here.
    expect(
      screen.queryByText(tv('co.late_switch_hint_time', { time: '12:00' })),
    ).not.toBeInTheDocument();
    // Not ticked → "Tiếp tục" says why and stays (no bill step, nothing written).
    const go = screen.getByRole('button', { name: tv('co.go_bill') });
    await user.click(go);
    // S4-48 / BUG-R2-088: the reason says to tick the box (not the box's own label again).
    expect(go).toHaveAccessibleDescription(tv('co.go_bill_needs_told'));
    expect(liveLate(r.folioId)).toEqual([]);
    await user.click(screen.getByRole('checkbox', { name: `${tv('ci.told_guest')} *` }));
    await user.click(go);
    // (1) step 3: the surcharge is on the folio and in the amount to collect – the payment box is open.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: tv('pay.vietqr_create', { amount }) }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(tv('drawer.folio.settled'))).not.toBeInTheDocument();
    const fee = Number(amount.replace(/\D/g, ''));
    expect(fee).toBeGreaterThan(0);
    expect(liveLate(r.folioId)).toEqual([fee]);
    expect(res('Phạm Huy').agreedCheckoutTime).toBe('14:05');
    // Collect it in cash, then complete – no BALANCE_DUE, the surcharge charged once.
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.click(screen.getByRole('button', { name: tv('pay.record', { amount }) }));
    await waitFor(() => expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
    const box = await screen.findByRole('alertdialog');
    await user.click(within(box).getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    expect(screen.queryByText(/chưa ghi nhận thanh toán/)).not.toBeInTheDocument();
    expect(liveLate(r.folioId)).toEqual([fee]);
  });

  it('late surcharge already agreed in the drawer (B15) for this time → no second tick, collected on step 3', async () => {
    at('14:05');
    const r = prepaid();
    r.agreedCheckoutTime = '14:05';
    // Agoda "trả tại chỗ": base = the room's list price 708.000 → 30 % = 212.000 (mock BR-412).
    const f = mockControl.stay.folios.get(r.folioId)!;
    f.lines.push({
      ...f.lines[0]!,
      id: 'late-kb7',
      category: 'late_checkout',
      description: 'late_checkout 14:05 30%',
      labelKey: undefined,
      labelParams: undefined,
      amountVnd: 212_000,
      unitPriceVnd: 212_000,
    } as (typeof f.lines)[number]);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    expect(await lateShown(30)).toBe(tv('common.currency_vnd', { amount: '212.000' }));
    expect(
      screen.queryByRole('checkbox', { name: `${tv('ci.told_guest')} *` }),
    ).not.toBeInTheDocument();
    // Same amount as on the folio → no "đã ghi → theo giờ thực tế" line either.
    expect(screen.queryByText(/theo giờ trả thực tế/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    const amount = tv('common.currency_vnd', { amount: '212.000' });
    expect(
      await screen.findByRole('button', { name: tv('pay.vietqr_create', { amount }) }),
    ).toBeInTheDocument();
    expect(liveLate(r.folioId)).toEqual([212_000]);
  });

  it('(3)(4) note missing → back on step 2 at the note; a corrected time clears the red line → done', async () => {
    at('12:25');
    const r = prepaid();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const time = await screen.findByLabelText(new RegExp(tv('checkout.departure_time')));
    expect(time).toHaveValue('12:25');
    fireEvent.change(time, { target: { value: '11:00' } });
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    await user.click(await screen.findByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    const note = await screen.findByLabelText(new RegExp(`^${esc(tv('checkout.time_note'))}`));
    await waitFor(() => expect(note).toHaveFocus());
    expect(screen.getAllByText(tv('field.TIME_NOTE_REQUIRED')).length).toBeGreaterThan(0);
    // The time was wrong, not the note: the real time clears every red line and the note request.
    fireEvent.change(screen.getByLabelText(new RegExp(tv('checkout.departure_time'))), {
      target: { value: '12:25' },
    });
    expect(screen.queryAllByText(tv('field.TIME_NOTE_REQUIRED'))).toHaveLength(0);
    expect(
      screen.queryByLabelText(new RegExp(`^${esc(tv('checkout.time_note'))}`)),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    await user.click(await screen.findByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
  });
});
