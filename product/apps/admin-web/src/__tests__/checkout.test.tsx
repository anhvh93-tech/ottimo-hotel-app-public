import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;

describe('H16 Trả phòng 3 bước + bill + VietQR (US-035…039, US-119, US-120; B18)', () => {
  it('minibar → extras → VietQR drawn locally → "Ghi nhận đã thu" → complete with the consequence box', async () => {
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
    await waitFor(() =>
      expect(
        screen.getByText(`${tv('bill.total')}: 2.485.000 ${tv('common.vnd_unit')}`),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /^Chuyển khoản VietQR · 2.485.000/ }));
    const content = r.code.replace('-', '');
    const qr = await screen.findByRole('img', { name: new RegExp(`2.485.000.*${content}`) });
    expect(qr.tagName.toLowerCase()).toBe('svg');
    expect(qr.querySelector('path')?.getAttribute('d')).toMatch(/^M4 4h1v1h-1z/);
    expect(screen.getByText(tv('pay.qr_note', { ref: content }))).toBeInTheDocument();
    // No third-party QR image anywhere (SEC F2).
    expect(document.querySelector('img[src*="vietqr"]')).toBeNull();

    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: '2.485.000' }) }),
    );
    await waitFor(() => expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument());
    const pay = mockControl.stay.payments.find(
      (p) => p.folioId === r.folioId && p.method === 'vietqr',
    )!;
    expect(pay.amountVnd).toBe(total);
    expect(pay.status).toBe('succeeded');
    expect(pay.reconciliation).toBe('pending'); // "chờ đối soát" until MGR matches the statement

    await user.click(
      screen.getByRole('button', { name: tv('co.complete_paid', { amount: '2.485.000' }) }),
    );
    const box = await screen.findByRole('alertdialog', {
      name: tv('checkout.complete_confirm_title', { room: '201' }),
    });
    expect(within(box).getByText(tv('co.effect_bill'))).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: tv('confirm.keep') })).toHaveFocus();
    await user.click(
      within(box).getByRole('button', { name: tv('co.complete_paid', { amount: '2.485.000' }) }),
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
    await user.click(await screen.findByRole('button', { name: /^Chuyển khoản VietQR · / }));
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
    expect(
      within(bill).getByText(/Giá đã gồm thuế GTGT \/ Prices include VAT/),
    ).toBeInTheDocument();
    expect(within(bill).getByText(/≈ [\d,.]+ USD/)).toBeInTheDocument();
    expect(within(bill).getByRole('button', { name: tv('co.print') })).toBeInTheDocument();
  });
});
