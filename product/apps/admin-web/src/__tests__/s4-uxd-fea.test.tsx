// Sprint 4 – FE-A sửa theo review UXD giữa sprint (rounds/round-02/reviews/s4-UXD.md, thẻ FE-S4-03…16):
// bố cục hộp tính thử đổi căn, dòng dịch vụ khi hủy / no-show, mục Thu tiền ở H13.
import type { MovePreview } from '@ottimo/api-client';
import { I18nProvider } from '@ottimo/i18n';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MovePreviewBox } from '../pages/reservations/MovePreviewBox';
import { ServiceLinesPicker, type KeepState } from '../pages/reservations/ServiceLines';
import { renderApp, tv } from '../test/render';

const vndText = (n: number) => n.toLocaleString('vi-VN');
const moneyText = (n: number) => `${vndText(n)} đ`;

function preview(over: Partial<MovePreview> = {}): MovePreview {
  return {
    pricingBasis: 'new_room_rate',
    arrivalDate: '2026-10-22',
    departureDate: '2026-10-24',
    nights: [
      { date: '2026-10-22', oldRateVnd: 1_000_000, newRateVnd: 807_000 },
      { date: '2026-10-23', oldRateVnd: 1_000_000, newRateVnd: 807_000, pendingFocVnd: 100_000 },
    ],
    roomTotalOldVnd: 2_000_000,
    roomTotalNewVnd: 1_614_000,
    folioDeltaVnd: -386_000,
    depositPaidVnd: 600_000,
    balanceDueAfterVnd: 1_014_000,
    warnings: [{ code: 'MANUAL_RATE_REPRICED', field: 'nights[0]' }],
    ...over,
  } as MovePreview;
}
const box = (p: MovePreview, props: { ota?: boolean; stale?: boolean } = {}) =>
  render(
    <I18nProvider>
      <MovePreviewBox preview={p} ota={props.ota ?? false} stale={props.stale} />
    </I18nProvider>,
  );

describe('MovePreviewBox – bố cục hộp tính thử (FE-S4-03…08)', () => {
  it('h3 names the region; rows are bare numbers, the signed difference is the total with the unit', () => {
    box(preview());
    const region = screen.getByRole('region', { name: tv('move.preview_title') });
    expect(within(region).getByRole('heading', { level: 3 })).toHaveTextContent(
      tv('move.preview_title'),
    );
    // FE-S4-03: "807.000" in a row (the column says "(đ)"), never "807.000 đ".
    const night = within(region).getAllByRole('row')[1]!;
    expect(night).toHaveTextContent(vndText(807_000));
    expect(night).not.toHaveTextContent(moneyText(807_000));
    expect(within(region).getByRole('row', { name: /^Tiền phòng/ })).toHaveTextContent(
      `${vndText(2_000_000)} → ${vndText(1_614_000)}`,
    );
    // FE-S4-04: signed total "−386.000 đ" labelled "Khách được giảm".
    const total = within(region).getByRole('row', {
      name: new RegExp(`^${tv('move.delta_down')}`),
    });
    expect(total).toHaveTextContent(`−${moneyText(386_000)}`);
  });

  it('order: warning before the nights, pending FOC right under the difference (FE-S4-04)', () => {
    const { container } = box(preview());
    const text = container.textContent ?? '';
    const warn = text.indexOf(tv('move.warn.MANUAL_RATE_REPRICED'));
    const nights = text.indexOf(tv('move.col_night'));
    const delta = text.indexOf(tv('move.delta_down'));
    const foc = text.indexOf(tv('move.pending_foc', { amount: moneyText(100_000) }));
    const deposit = text.indexOf(tv('move.deposit_paid'));
    expect(warn).toBeGreaterThan(-1);
    expect(warn).toBeLessThan(nights);
    expect(delta).toBeLessThan(foc);
    expect(foc).toBeLessThan(deposit);
  });

  it('night column carries the weekday; an OTA difference is its own labelled line (FE-S4-05)', () => {
    box(
      preview({
        nights: [
          {
            date: '2026-10-22',
            oldRateVnd: 792_000,
            newRateVnd: 792_000,
            roomChangeDifferenceVnd: 300_000,
          },
        ],
        roomChangeDifferenceVnd: 300_000,
        folioDeltaVnd: 300_000,
        warnings: [],
      }),
      { ota: true },
    );
    // 22/10/2026 is a Thursday → "T5 22/10".
    expect(screen.getByRole('cell', { name: /^T5 22\/10$/ })).toBeInTheDocument();
    expect(
      screen.getByText(tv('move.night_ota_diff', { amount: moneyText(300_000) })),
    ).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`\\+ ${moneyText(300_000)}`))).not.toBeInTheDocument();
    expect(
      screen.getByRole('row', { name: new RegExp(`^${tv('move.delta_up')}`) }),
    ).toHaveTextContent(`+${moneyText(300_000)}`);
  });

  it('more than 7 nights → folded under "Xem giá từng đêm (n đêm)"; totals stay visible (FE-S4-06)', async () => {
    const nights = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-11-${String(i + 1).padStart(2, '0')}`,
      oldRateVnd: 500_000,
      newRateVnd: 450_000,
    }));
    box(preview({ nights, folioDeltaVnd: -500_000, warnings: [] }));
    const toggle = screen.getByText(tv('move.nights_toggle', { n: 10 }));
    expect(toggle.closest('details')).not.toHaveAttribute('open');
    expect(
      screen.getByRole('row', { name: new RegExp(`^${tv('move.delta_down')}`) }),
    ).toBeVisible();
    await userEvent.setup().click(toggle);
    expect(toggle.closest('details')).toHaveAttribute('open');
  });

  it('stale result: kept dimmed with aria-busy and "Đang tính thử…" on top (FE-S4-08)', () => {
    box(preview(), { stale: true });
    const region = screen.getByRole('region', { name: tv('move.preview_title') });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(within(region).getByText(tv('move.preview_loading'))).toHaveAttribute('role', 'status');
    expect(region.querySelector('.stale')).not.toBeNull();
  });
});

describe('ServiceLinesPicker – 3 cột, lý do thiếu (FE-S4-14, FE-S4-16)', () => {
  function Host() {
    const [keep, setKeep] = useState<KeepState>({});
    return (
      <I18nProvider>
        <ServiceLinesPicker
          lines={[
            {
              lineId: 'l1',
              category: 'laundry',
              amountVnd: 75_000,
              performed: true,
              labelKey: 'bill.line.laundry',
              labelParams: { text: 'Giặt ủi', qty: 1 },
            },
          ]}
          keep={keep}
          onChange={setKeep}
          showErrors={false}
          summary={{ reversedVnd: 75_000, retainedVnd: 0 }}
        />
      </I18nProvider>
    );
  }

  it('row = [tick + line] [chip] [amount]; name of the tick unchanged; ticked w/o reason → status, help', async () => {
    const user = userEvent.setup();
    render(<Host />);
    const tick = screen.getByRole('checkbox', { name: new RegExp(`${moneyText(75_000)}$`) });
    // The accessible name is still the whole `svc.keep` sentence ("Giữ … · 75.000 đ").
    expect(tick).toHaveAccessibleName(
      new RegExp(`^${tv('svc.keep', { label: 'X', amount: 'Y' }).split('X')[0]!}`),
    );
    const row = tick.closest('.svc-line')!;
    expect(row.children).toHaveLength(3);
    expect(row.children[1]).toHaveTextContent(tv('svc.performed'));
    expect(row.children[2]).toHaveTextContent(vndText(75_000));
    expect(screen.getByText(/^Đảo 75\.000 đ · giữ 0 đ$/)).toBeInTheDocument();
    await user.click(tick);
    expect(screen.getByRole('status')).toHaveTextContent(tv('svc.reason_needed'));
    expect(screen.queryByText(/^Đảo /)).not.toBeInTheDocument();
    const reason = screen.getByLabelText(new RegExp(`^${tv('svc.reason')}`));
    expect(reason).toHaveAccessibleDescription(tv('svc.reason_needed'));
    await user.type(reason, 'Đã giặt');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('NoShowDialog – đang đọc dòng dịch vụ (FE-S4-13)', () => {
  it('while the folio loads: "Đang tải dịch vụ trong đơn…" and the locked button points to it', async () => {
    mockControl.db.params.push({
      key: 'no_show_mark_time',
      value: '00:00',
      effectiveFrom: '2026-10-01',
      brRef: 'BR-311',
      editableBy: ['owner', 'manager'],
    });
    const r = mockControl.rsv.reservations.find((x) => x.guestName === 'Gia đình anh Hưng')!;
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fdl');
    const d = await screen.findByRole('dialog', { name: 'Gia đình anh Hưng' });
    const open = await within(d).findByRole('button', { name: 'Đánh dấu không đến' });
    // From here on the folio never answers (slow network).
    server.use(
      http.get('*/folios/:folioId', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    await user.click(open);
    const dlg = await screen.findByRole('alertdialog', { name: /không đến\?/ });
    const loading = await within(dlg).findByText(tv('svc.loading'));
    expect(loading).toHaveAttribute('role', 'status');
    await user.selectOptions(
      within(dlg).getByLabelText(/Kết quả liên lạc/),
      'rsv.contact_noanswer',
    );
    const confirm = within(dlg).getByRole('button', { name: 'Đánh dấu không đến' });
    await waitFor(() => expect(confirm).toHaveAccessibleDescription(tv('svc.loading')));
  });
});
