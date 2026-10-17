import { screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

// 0.3.6 bổ sung 4 (DOM OTA rules, s3-contract 7.8): guest count source before check-in.
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;

async function openFix() {
  const r = res('Anna Martin'); // booking.com, ota_prepaid, confirmed, 103, OTA priced 2 guests
  r.adults = 4;
  r.capacityConflict = true;
  const view = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
  await view.user.click(await screen.findByRole('button', { name: tv('checkin.fix_guest_count') }));
  const dlg = await screen.findByRole('dialog', { name: tv('checkin.fix_guest_count') });
  await view.user.click(within(dlg).getByRole('button', { name: /^Giảm Người lớn/ }));
  return { r, dlg, ...view };
}

describe('partyChangeSource – OTA guest count before check-in', () => {
  it('two equal choices, "Khách báo trực tiếp" by default → fee for people above the OTA count, shown as the server posts it', async () => {
    const { r, dlg, user } = await openFix();
    const group = within(dlg).getByRole('group', { name: tv('rsv.party_source.legend') });
    const direct = within(group).getByRole('radio', { name: tv('rsv.party_source.guest_direct') });
    const otaMod = within(group).getByRole('radio', {
      name: tv('rsv.party_source.ota_modification', { channel: 'Booking.com' }),
    });
    expect(direct).toBeChecked();
    expect(within(dlg).getByText(tv('rsv.ota_guest_count', { n: 2 }))).toBeInTheDocument();
    expect(otaMod).not.toBeChecked();
    expect(
      within(dlg).getByText(tv('rsv.party_source.guest_direct_help', { channel: 'Booking.com' })),
    ).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(res('Anna Martin').adults).toBe(3));
    expect(r.otaGuestCount).toBe(2);
    // 3 guests vs 2 priced by the OTA → one extra adult × 3 nights, collected at the desk.
    const lines = mockControl.stay.folios
      .get(r.folioId)!
      .lines.filter((l) => l.category === 'extra_person');
    const total = lines.reduce((a, l) => a + l.amountVnd, 0);
    expect(total).toBeGreaterThan(0);
    // H13 lists the folio lines the server posted (bill labels), not a client-made sum.
    const first = lines[0]!;
    expect(
      await screen.findAllByText(
        (_, el) =>
          el?.tagName === 'LI' &&
          !!el.textContent?.includes(
            tv('common.currency_vnd', {
              amount: new Intl.NumberFormat('vi-VN').format(first.amountVnd),
            }),
          ) &&
          !!el.textContent?.startsWith('Phụ thu'),
      ),
    ).toHaveLength(lines.length);
  });

  it('"OTA sửa đơn" needs the extranet reference, then moves the OTA count (no fee)', async () => {
    const { r, dlg, user } = await openFix();
    await user.click(
      within(dlg).getByRole('radio', {
        name: tv('rsv.party_source.ota_modification', { channel: 'Booking.com' }),
      }),
    );
    expect(within(dlg).getByText(tv('rsv.party_source.ota_modification_help'))).toBeInTheDocument();
    // Server: missing reference → 422 REQUIRED on otaModificationRef (shown at the field).
    await user.click(within(dlg).getByRole('button', { name: tv('common.save') }));
    const refInput = await within(dlg).findByLabelText(new RegExp(`^${tv('rsv.ota_mod_ref')}`));
    await waitFor(() =>
      expect(refInput).toHaveAccessibleDescription(new RegExp(tv('common.required'))),
    );
    await user.type(refInput, 'BDC-4455667');
    await user.click(within(dlg).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(res('Anna Martin').adults).toBe(3));
    expect(r.otaGuestCount).toBe(3);
    expect(
      mockControl.stay.folios.get(r.folioId)!.lines.some((l) => l.category === 'extra_person'),
    ).toBe(false);
  });
});

describe('otaPenaltyChannelFeeVnd – cancel an OTA booking with a penalty (BR-310/901)', () => {
  it('the optional channel fee appears only with a penalty and is sent with it', async () => {
    const r = res('Sophie Martin');
    const sent: Array<Record<string, unknown>> = [];
    server.use(
      http.post('*/v1/properties/:p/reservations/:r/actions/cancel', async ({ request }) => {
        const b = (await request.clone().json()) as Record<string, unknown>;
        if (!b.dryRun) sent.push(b);
        return undefined;
      }),
    );
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Sophie Martin' });
    await user.click(within(d).getByRole('button', { name: 'Hủy đơn' }));
    const box = await screen.findByRole('alertdialog');
    await user.selectOptions(within(box).getByLabelText(/Lý do hủy/), 'ota_cancelled');
    expect(
      within(box).queryByLabelText(
        new RegExp(`^${tv('cancel.ota_penalty_channel_fee').replace(/[()]/g, '\\$&')}`),
      ),
    ).not.toBeInTheDocument();
    await user.type(
      within(box).getByLabelText(new RegExp(`^${tv('cancel.ota_penalty')}`)),
      '200000',
    );
    const fee = await within(box).findByLabelText(
      new RegExp(`^${tv('cancel.ota_penalty_channel_fee').replace(/[()]/g, '\\$&')}`),
    );
    await user.type(fee, '30000');
    await waitFor(() =>
      expect(within(box).getByRole('button', { name: 'Hủy đơn' })).not.toBeDisabled(),
    );
    await user.click(within(box).getByRole('button', { name: 'Hủy đơn' }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ otaPenaltyVnd: 200_000, otaPenaltyChannelFeeVnd: 30_000 });
  });
});
