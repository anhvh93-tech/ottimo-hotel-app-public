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
    expect(screen.getByText(tv('pay.qr_note', { ref: content }))).toBeInTheDocument();
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
    expect(screen.getByText(/^Phiếu F26-\d{6}/)).toBeInTheDocument();
  });

  it('blocked by the server: minibar not checked / VietQR not configured are explained in place', async () => {
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
    // The summary already shows the night (`bill.line.extra_night`).
    expect(
      await screen.findByText(new RegExp(`^${tv('bill.line.extra_night', { date: '.*' })}$`)),
    ).toBeInTheDocument();
    // Balance now includes the extra night – pay it in cash, then complete.
    await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
    await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
    await waitFor(() => expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument());
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
    // Back on step 3 the error sits at the note field on step 2 – go back and add it.
    await user.click(screen.getByRole('button', { name: tv('common.back') }));
    const note = await screen.findByLabelText(new RegExp(`^${esc(tv('checkout.time_note'))}`));
    expect(note).toHaveAccessibleDescription(new RegExp(esc(tv('field.TIME_NOTE_REQUIRED'))));
    await user.type(note, 'Khách đi lúc 12:00, ghi bù');
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
