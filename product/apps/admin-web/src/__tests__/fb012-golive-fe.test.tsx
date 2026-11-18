// FB-INV-012 go-live fix (ARC contract §12, OpenAPI 0.3.15-draft on the MSW mock until BE `r5-fb012-golive-be`):
// FE-1/2 backdated booking + check-in (A127), FE-3 "Paid outside Desk" (A128, SEC 12-02/03), FE-4 property contact
// (A129, SEC 12-04) and the cleaning table, FE-6 catch-up warning, FE-7 unknown codes ignored. All data is made up.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { businessDayLocal } from '../app/dates';
import { backdateBounds, contactFooter, contactIssues } from '../app/goLive';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { warningText } from '../pages/longstay/labels';
import { formatLscf, parseLscfDraft } from '../pages/cleaningFeeParams';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
const P = '0192a1b0-0000-7000-8000-0000000000a1';

/** Room 203 kept free from T − 20 on, so a stay already in house can be entered there. */
function freeRoom203() {
  const st = mockControl.rsv;
  st.reservations = st.reservations.filter(
    (r) => !(r.segments ?? []).some((s) => s.roomNo === '203'),
  );
  return mockControl.db.rooms.find((r) => r.roomNo === '203')!;
}

async function createBackdated(arrivalOffset = -10) {
  const room = freeRoom203();
  const T = businessDayLocal();
  const guest = mockControl.db.guests.find((g) => g.phone)!;
  const direct = mockControl.rsv.channels.find((c) => c.channelGroup === 'direct')!;
  const res = await fetch(`http://localhost/v1/properties/${P}/reservations`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': mockControl.db.csrf,
      'idempotency-key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      roomId: room.id,
      channelId: direct.id,
      arrivalDate: addDays(T, arrivalOffset),
      departureDate: addDays(T, 170),
      adults: 1,
      bookerGuestId: guest.id,
      paymentModel: 'direct',
      directSource: 'zalo_phone',
      allowUnassigned: false,
      manualLongStay: { monthlyRentVnd: 8_500_000 },
      backdatedArrival: { reason: 'Paper contract before Desk' },
    }),
  });
  return { status: res.status, body: (await res.json()) as { id: string; code: string } };
}

describe('FE-1/FE-2 backdated long stay (A127)', () => {
  it('bounds are [T − 45, T − 1]; FD gets 403 and MGR 201 from the server shape', async () => {
    const b = backdateBounds('2026-11-18');
    expect(b).toEqual({ earliest: '2026-10-04', latest: '2026-11-17' });
    renderApp('/rack', 'qa.fd');
    await screen.findByRole('grid');
    expect((await createBackdated()).status).toBe(403);
    mockControl.signInAs('qa.mgr');
    const ok = await createBackdated();
    expect(ok.status).toBe(201);
    const far = await createBackdated(-46);
    expect(far.status).toBe(422);
  });

  it('the H10 toggle shows for MGR only; FD never sees it', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: tv('lsm.title') }));
    const dlg = await screen.findByRole('dialog', { name: new RegExp(esc(tv('lsm.title'))) });
    expect(within(dlg).queryByLabelText(new RegExp(esc(tv('bd.in_house_toggle'))))).toBeNull();
  });

  it('MGR: H10 "Guest already in house" opens a past arrival and asks for a reason', async () => {
    const { user } = renderApp('/rack', 'qa.mgr');
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: tv('lsm.title') }));
    const dlg = await screen.findByRole('dialog', { name: new RegExp(esc(tv('lsm.title'))) });
    const toggle = within(dlg).getByRole('checkbox', {
      name: new RegExp(esc(tv('bd.in_house_toggle'))),
    });
    fireEvent.click(toggle);
    const T = businessDayLocal();
    const moveIn = within(dlg).getByLabelText(label('lsm.move_in'));
    expect(moveIn).toHaveAttribute('max', addDays(T, -1));
    expect(moveIn).toHaveAttribute('min', addDays(T, -45));
    expect(within(dlg).getByLabelText(label('bd.reason'))).toBeVisible();
    // No closer field on this form (SEC 12-01).
    expect(within(dlg).queryByLabelText(/người chốt/i)).toBeNull();
  });

  it('drawer: MGR sees "Backdated check-in" from allowedActions; saving sets in_house and shows next steps', async () => {
    pinDaytime();
    renderApp('/rack', 'qa.mgr');
    await screen.findByRole('grid');
    const { body } = await createBackdated();
    mockControl.signInAs('qa.fd');
    const { unmount } = renderApp(`/reservations/${body.id}`, 'qa.fd');
    await screen.findAllByText(body.code);
    expect(screen.queryByRole('button', { name: tv('bd.checkin_action') })).toBeNull();
    unmount();
    renderApp(`/reservations/${body.id}`, 'qa.mgr');
    fireEvent.click(await screen.findByRole('button', { name: tv('bd.checkin_action') }));
    const dlg = await screen.findByRole('dialog', {
      name: new RegExp(esc(tv('bd.checkin_title', { room: '203' }))),
    });
    // No time, surcharge or payment fields.
    expect(within(dlg).queryByLabelText(/giờ/i)).toBeNull();
    fireEvent.change(within(dlg).getByLabelText(label('bd.reason')), {
      target: { value: 'Paper contract before Desk' },
    });
    fireEvent.click(within(dlg).getByRole('button', { name: tv('bd.checkin_action') }));
    expect(await screen.findByRole('link', { name: tv('bd.next_meter') })).toHaveAttribute(
      'href',
      '/long-stay/meters',
    );
    const r = mockControl.rsv.reservations.find((x) => x.id === body.id)!;
    expect(r.status).toBe('in_house');
    expect(r.checkinBackdatedOn).toBe(businessDayLocal());
  });
});

describe('FE-3 Paid outside Desk (A128)', () => {
  const issued = () => mockControl.statements.periods.find((p) => p.status === 'issued')!;
  async function openIssued(as: string) {
    renderApp('/long-stay/statements?tab=overdue', as);
    const code = issued().code!;
    fireEvent.click(await screen.findByRole('button', { name: code }));
    return screen.findByRole('dialog');
  }

  it('FDL has no button; the record-payment picker never offers outside_desk (SEC 12-03)', async () => {
    pinDaytime();
    const dlg = await openIssued('qa.fdl');
    await within(dlg).findByRole('button', { name: tv('stmt.record_payment') });
    expect(within(dlg).queryByRole('button', { name: tv('od.action') })).toBeNull();
    fireEvent.click(within(dlg).getByRole('button', { name: tv('stmt.record_payment') }));
    expect(within(dlg).queryByText(tv('payment.method.outside_desk'))).toBeNull();
  });

  it('MGR: defaults to the unpaid rent with the cap shown; above it → 403 shown as "owner only"', async () => {
    pinDaytime();
    const p = issued();
    const rent = p
      .snapshot!.lines.filter((l) => l.kind === 'rent')
      .reduce((a, l) => a + l.amountVnd, 0);
    const balance = p.snapshot!.totals.totalVnd - p.paidVnd;
    const cap = Math.max(0, Math.min(balance, rent - p.paidVnd));
    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
    const dlg = await openIssued('qa.mgr');
    fireEvent.click(await within(dlg).findByRole('button', { name: tv('od.action') }));
    // UXD-196-08: rent only, said before confirming; UXD-196-07: grouped in thousands.
    expect(within(dlg).getByText(tv('od.manager_cap', { amount: fmt(cap) }))).toBeVisible();
    const amount = within(dlg).getByLabelText(label('stmt.pay_amount'));
    expect(amount).toHaveValue(fmt(cap));
    fireEvent.change(amount, { target: { value: String(balance) } });
    fireEvent.blur(amount);
    expect(amount).toHaveValue(fmt(balance));
    fireEvent.change(within(dlg).getByLabelText(label('od.reason')), {
      target: { value: 'Rent paid on the old platform' },
    });
    fireEvent.click(within(dlg).getByRole('button', { name: tv('od.confirm') }));
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm).toHaveTextContent(tv('od.confirm_body'));
    fireEvent.click(within(confirm).getByRole('button', { name: tv('od.confirm') }));
    expect(await within(dlg).findByText(tv('od.owner_only'))).toBeVisible();
    expect(issued().payments).toHaveLength(0);
  });

  it('OWN on a trusted device records the balance as outside_desk', async () => {
    pinDaytime();
    mockControl.db.currentDeviceTrusted = true;
    const id = issued().id;
    const dlg = await openIssued('qa.owner');
    fireEvent.click(await within(dlg).findByRole('button', { name: tv('od.action') }));
    fireEvent.change(within(dlg).getByLabelText(label('od.reason')), {
      target: { value: 'Rent paid on the old platform' },
    });
    fireEvent.change(within(dlg).getByLabelText(label('od.reference')), {
      target: { value: 'acct 1234/5678' },
    });
    fireEvent.click(within(dlg).getByRole('button', { name: tv('od.confirm') }));
    // The reference accepts letters, digits, spaces and . / - only.
    fireEvent.change(within(dlg).getByLabelText(label('od.reference')), {
      target: { value: 'OLD-2026-11' },
    });
    fireEvent.click(within(dlg).getByRole('button', { name: tv('od.confirm') }));
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(within(confirm).getByRole('button', { name: tv('od.confirm') }));
    await waitFor(() =>
      expect(mockControl.statements.periods.find((p) => p.id === id)!.status).toBe('paid'),
    );
    expect(mockControl.statements.periods.find((p) => p.id === id)!.payments[0]).toMatchObject({
      method: 'outside_desk',
      reconciliation: 'not_required',
    });
  });
});

describe('FE-4 property contact and cleaning table', () => {
  it('OWN edits address + hotline (plain text preview); a bad hotline is refused before saving', async () => {
    mockControl.db.currentDeviceTrusted = true;
    renderApp('/settings/parameters', 'qa.owner');
    const hotline = await screen.findByLabelText(label('pc.hotline'));
    fireEvent.change(hotline, { target: { value: 'call me' } });
    fireEvent.click(screen.getByRole('button', { name: tv('common.save') }));
    expect(await screen.findByText(tv('pc.hotline_invalid'))).toBeVisible();
    fireEvent.change(hotline, { target: { value: '+84 000 000 111' } });
    fireEvent.change(screen.getByLabelText(label('pc.address')), {
      target: { value: '<b>2 Example Road</b>, Da Lat' },
    });
    // React renders it as text – the tag is shown, never parsed (SEC 12-04 (c)).
    expect(screen.getByText('<b>2 Example Road</b>, Da Lat · +84 000 000 111')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(mockControl.goLive.contact.hotline).toBe('+84000000111'));
  });

  it('cleaning table: help and blank rooms show the standard price; the rule badge is BR-LS-07 (UXD-196-06)', async () => {
    renderApp('/settings/parameters', 'qa.owner');
    fireEvent.click(await screen.findByRole('tab', { name: tv('params.grp_statement') }));
    const name = tv('params.k.long_stay_cleaning_fee_by_room');
    const edit = await screen.findByRole('button', { name: `${tv('rooms.edit')}: ${name}` });
    expect(edit.closest('tr')).toHaveTextContent('BR-LS-07');
    expect(edit.closest('tr')).not.toHaveTextContent(/\bH3\b/);
    fireEvent.click(edit);
    const dlg = await screen.findByRole('dialog');
    expect(
      within(dlg).getByText(tv('params.lscf.help', { price: `100.000 ${tv('common.vnd_unit')}` })),
    ).toBeVisible();
    expect(within(dlg).getAllByPlaceholderText('100.000').length).toBeGreaterThan(0);
  });

  it('MGR reads the contact, no inputs', async () => {
    renderApp('/settings/parameters', 'qa.mgr');
    expect(await screen.findByText('1 Example Street, Ward 1, Da Lat')).toBeVisible();
    expect(screen.queryByLabelText(label('pc.hotline'))).toBeNull();
  });

  it('helpers: contact checks, footer, cleaning table parse/format', () => {
    expect(contactIssues('abc', '')).toEqual({ address: true, hotline: false });
    expect(contactIssues('1 Road‮', '+84 1234 5678').address).toBe(true);
    expect(contactFooter({ addressLine: 'A road', hotline: null })).toBe('A road');
    const t = (k: string, a?: Record<string, string | number>) => tv(k, a);
    expect(parseLscfDraft(t, { '101': '150.000', '102': '' })).toEqual({
      ok: true,
      value: { '101': 150000 },
    });
    expect(parseLscfDraft(t, { '101': '150500' }).ok).toBe(false);
    expect(formatLscf(t, {})).toBe(tv('params.lscf.empty'));
    expect(formatLscf(t, {}, true)).toBe(tv('params.lscf.empty_short'));
  });
});

describe('FE-6/FE-7 catch-up warning and unknown codes', () => {
  it('READING_CATCH_UP reads with room and day', () => {
    const t = (k: string, a?: Record<string, string | number>) => tv(k, a);
    expect(warningText(t, { code: 'READING_CATCH_UP', roomNo: '302', readOn: '2026-12-15' })).toBe(
      tv('stmt.warning.READING_CATCH_UP', { room: '302', date: '15/12' }),
    );
  });

  it('mock: a reading past lateUntil answers catchUpNeedsRole; FDL cannot send catchUp', async () => {
    pinDaytime();
    renderApp('/long-stay/meters', 'qa.fdl');
    await screen.findByRole('heading', { level: 1 });
    const stay = mockControl.statements.stays[1]!;
    const send = (extra: Record<string, unknown>) =>
      fetch(
        `http://localhost/v1/properties/${P}/reservations/${stay.reservationId}/meter-readings`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-csrf-token': mockControl.db.csrf,
            'idempotency-key': crypto.randomUUID(),
          },
          body: JSON.stringify({
            roomId: stay.roomId,
            kind: 'period_end',
            periodMonth: '2020-01',
            readOn: businessDayLocal(),
            electricity: { value: 1 },
            water: { value: 1 },
            photoAttachmentId: '0192a1b0-0000-7000-8000-000000849999',
            photoWaived: false,
            ...extra,
          }),
        },
      ).then(async (r) => ({
        status: r.status,
        body: (await r.json()) as Record<string, unknown>,
      }));
    const late = await send({});
    expect(late.status).toBe(422);
    expect(late.body.catchUpNeedsRole).toBe('manager');
    expect((await send({ catchUp: true, lateReason: 'Missed' })).status).toBe(403);
  });
});
