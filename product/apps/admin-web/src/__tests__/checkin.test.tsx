import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const openCheckIn = (guest: string, as: string) =>
  renderApp(`/reservations/${res(guest).id}/check-in`, as);

describe('H13 Nhận phòng (US-025, US-043, US-119; B9)', () => {
  it('docs → checks → register later → collect the balance → house rules → check in', async () => {
    const { user } = openCheckIn('Gia đình anh Hưng', 'qa.fd');
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(tv('checkin.title', { room: '302', guest: 'Gia đình anh Hưng' })),
      }),
    ).toBeInTheDocument();
    // Conditions from previewCheckIn: unpaid balance and no main document are "Còn thiếu".
    const docCond = (await screen.findByText(tv('checkin.cond.main_guest_document'))).closest(
      'li',
    )!;
    expect(within(docCond).getByText(tv('ci.unmet'))).toBeInTheDocument();
    const payCond = screen.getByText(tv('checkin.cond.balance_paid')).closest('li')!;
    expect(within(payCond).getByText(tv('ci.unmet'))).toBeInTheDocument();

    // Step 1 – manual document entry (C3, trusted device).
    expect(
      await screen.findByText(tv('checkin.docs.progress', { have: 0, need: 4 })),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: tv('checkin.docs.manual') })[0]!);
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    await user.type(within(dlg).getByLabelText(/^Số giấy tờ/), '079123456789');
    expect(within(dlg).getByLabelText(/^Họ tên \(như trên giấy tờ\)/)).toHaveValue(
      'Gia đình anh Hưng',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    expect(
      await screen.findByText(tv('checkin.docs.progress', { have: 1, need: 4 })),
    ).toBeInTheDocument();
    // Only the last 4 digits are shown after saving (BR-610).
    expect(
      screen.getByText(tv('ci.doc_masked', { type: tv('ci.doc.cccd'), last4: '6789' })),
    ).toBeInTheDocument();
    expect(screen.queryByText('079123456789')).not.toBeInTheDocument();
    await waitFor(() => expect(within(docCond).getByText(tv('ci.met'))).toBeInTheDocument());

    // Step 2 – checks: missing companions do not block (BR-402 (3)).
    await user.click(screen.getByRole('button', { name: tv('ci.go_verify') }));
    expect(await screen.findByText(tv('checkin.verify.name'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('ci.go_register') }));
    // Step 3 – register later.
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));

    // Step 4 – the button stays locked until "house rules sent" is ticked.
    const submit = await screen.findByRole('button', { name: tv('ci.submit', { room: '302' }) });
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(tv('ci.submit_needs_rules'))).toBeInTheDocument();

    // Collect the balance in cash (US-119) – "chờ đối soát" does not apply to cash.
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
    await waitFor(() => expect(within(payCond).getByText(tv('ci.met'))).toBeInTheDocument());
    const cash = mockControl.stay.payments.filter(
      (p) => p.folioId === res('Gia đình anh Hưng').folioId && p.method === 'cash',
    );
    expect(cash).toHaveLength(1);
    expect(cash[0]!.reconciliation).toBe('not_required');

    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    expect(submit).not.toHaveAttribute('aria-disabled');
    await user.click(submit);
    const box = await screen.findByRole('alertdialog', {
      name: tv('ci.confirm_title', { room: '302', guest: 'Gia đình anh Hưng' }),
    });
    await user.click(within(box).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));

    // Done → back to the booking drawer, status "Đang ở".
    const drawer = await screen.findByRole('dialog', { name: 'Gia đình anh Hưng' });
    expect(await within(drawer).findByText(tv('status.booking.in_house'))).toBeInTheDocument();
    const r = res('Gia đình anh Hưng');
    expect(r.status).toBe('in_house');
    expect(r.cardsIssued).toBe(1);
    expect(r.houseRulesSentAt).toBeTruthy();
    // Door box not ticked → still allowed, the drawer offers the late tick (US-025 AC7).
    expect(r.doorAccessHandedOverAt).toBeNull();
    expect(within(drawer).getByText(tv('rsv.door_not_handed'))).toBeInTheDocument();
  });

  it('checks: an unverified passport item needs a handling note before continuing (US-044 AC2)', async () => {
    const r = res('Anna Martin');
    mockControl.stay.payments.length = 0; // OTA prepaid – nothing to collect
    const { user } = openCheckIn('Anna Martin', 'qa.fd');
    // Give the main guest a document first so only the time matters.
    await user.click(
      (await screen.findAllByRole('button', { name: tv('checkin.docs.manual') }))[0]!,
    );
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    await user.selectOptions(within(dlg).getByLabelText(/^Loại giấy tờ/), 'passport');
    await user.type(within(dlg).getByLabelText(/^Số giấy tờ/), 'X1234567');
    await user.type(within(dlg).getByLabelText(/^Quốc tịch/), 'FRA');
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    await screen.findByText(tv('checkin.docs.progress', { have: 1, need: 2 }));

    // Jump to step 4 through the steps (checks unverified → note required first).
    await user.click(screen.getByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    expect(await screen.findByText(tv('checkin.verify.note_required'))).toBeInTheDocument();
    expect(r.status).toBe('confirmed');
  });

  it('untrusted device: documents hidden, no check-in button (rbac 8.7)', async () => {
    renderApp(`/reservations/${res('Anna Martin').id}/check-in`, 'qa.owner');
    expect(await screen.findByText(tv('device.blocked_title'))).toBeInTheDocument();
    expect(screen.getByText(tv('ci.untrusted_note'))).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: tv('ci.submit', { room: '103' }) }),
    ).not.toBeInTheDocument();
    // Conditions stay visible.
    expect(await screen.findByText(tv('checkin.cond.title'))).toBeInTheDocument();
  });
});
