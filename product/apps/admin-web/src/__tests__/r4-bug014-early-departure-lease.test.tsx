import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

/**
 * BUG-R4-014 (QA PR #22, ORC phương án b): B16 "Trả sớm" stays open for a monthly lease so the Desk can end the
 * stay, but the box must not show the BR-428 short-stay policy ("Không có khoản hoàn", fee 0 đ, notice days). It
 * says BR-313 v0.5.1 instead (ESC-045 câu 4): breaking the lease forfeits the whole deposit, no clawback of the
 * lease-term discount; unpaid utilities / damage are still collected. Short stays keep BR-428 unchanged.
 * DOM review (FB-R4-DOM-FE-A-01..03) + INV ESC-048 = B (03/11): only a date before the lease end shows BR-313; the
 * Desk cannot see the signing date nor the rent periods, so the box lists the branches (not paid / paid / older
 * lease) under a "check and ask the manager" line instead of stating one outcome.
 */

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const vnd = (n: number) => n.toLocaleString('vi-VN');
const M = (n: number) => tv('common.currency_vnd', { amount: vnd(n) });
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};

/** Trần Thu Nga (101) as a DIRECT stay paid in full – the BR-428 shape of the v1.0.1 tests. */
function directStay() {
  const r = res('Trần Thu Nga');
  const direct = mockControl.rsv.channels.find((c) => c.code === 'direct')!;
  Object.assign(r, {
    channelCode: 'direct',
    channelId: direct.id,
    paymentModel: 'direct',
    otaGuestCount: null,
  });
  const pay = mockControl.stay.payments.find(
    (p) => p.folioId === r.folioId && p.method === 'ota_collect',
  )!;
  Object.assign(pay, { method: 'cash' });
}

async function openDialog(guest: string) {
  const r = res(guest);
  const view = renderApp(`/reservations/${r.id}`, 'qa.fd');
  const drawer = await screen.findByRole('dialog', { name: guest });
  await view.user.click(
    await within(drawer).findByRole('button', { name: tv('drawer.action.early_departure') }),
  );
  const dlg = await screen.findByRole('dialog', {
    name: new RegExp(
      esc(tv('early_departure.title', { room: 'ROOM', guest })).replace('ROOM', '\\d+'),
    ),
  });
  return { ...view, r, dlg };
}
type User = ReturnType<typeof renderApp>['user'];
const toPreview = (dlg: HTMLElement) =>
  within(dlg).getByRole('button', { name: tv('early_departure.to_preview') });
async function goPreview(user: User, dlg: HTMLElement) {
  await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
  await user.click(toPreview(dlg));
}
async function setDate(user: User, dlg: HTMLElement, d: string) {
  const box = within(dlg).getByLabelText(new RegExp(tv('early_departure.new_date')));
  await user.clear(box);
  await user.type(box, d);
}
/** Every BR-428 row / word the lease box must not show. */
const BR428 = [
  'early_departure.calc_title',
  'early_departure.row_base',
  'early_departure.row_notice',
  'early_departure.row_refundable',
  'early_departure.row_refund',
  'early_departure.row_fee',
  'early_departure.no_refund',
  'early_departure.no_refund_notice',
] as const;

/** The lines a lease box always shows besides the amount line (FB-R4-DOM-FE-A-02, INV ESC-048 = B). */
const LEASE_BRANCHES = [
  'early_departure.lease_check',
  'early_departure.lease_rule_paid',
  'early_departure.lease_rule_old',
] as const;

/**
 * Emma Laurent's lease (T−40 → T+50, ends T+50) + extension nights T+50 → T+53 held by a short child booking – the
 * shape the dialog reads through `stayDepartureDate` (BR-422). The real server's B13 on a manual lease moves the
 * lease's own departure instead (no lease end in the DTO yet – gap reported to ARC); this pins the dialog rule.
 */
function leaseWithExtension() {
  const r = res('Emma Laurent');
  const T = todayLocal();
  const end = r.departureDate;
  const NIGHT = 300_000;
  const child = {
    ...r,
    id: '0192a1b0-0000-7000-8000-000000099981',
    code: 'OTM-09981',
    parentReservationId: r.id,
    stayType: 'short' as const,
    externalContract: false,
    manualLongStay: undefined,
    status: 'confirmed' as const,
    arrivalDate: end,
    departureDate: addDays(end, 3),
    nights: 3,
    nightlyRates: [0, 1, 2].map((i) => ({ date: addDays(end, i), amountVnd: NIGHT })),
    totalRoomVnd: 3 * NIGHT,
    folioId: '0192a1b0-0000-7000-8000-000000099982',
    segments: (r.segments ?? []).map((sg) => ({ ...sg, fromDate: end, toDate: addDays(end, 3) })),
    allowedActions: [],
    version: 1,
  };
  mockControl.rsv.reservations.push(child);
  return { r, child, T, end };
}

describe('BUG-R4-014 – B16 on a monthly lease shows BR-313, not BR-428', () => {
  beforeEach(() => at('14:00'));
  afterEach(() => vi.useRealTimers());

  it('short stay: the BR-428 calculation is unchanged and no lease text appears', async () => {
    directStay();
    const { user, dlg } = await openDialog('Trần Thu Nga');
    const T = todayLocal();
    await setDate(user, dlg, addDays(T, 1));
    expect(
      await within(dlg).findByText(
        tv('early_departure.notice_days', { n: 1, date: '§' }).split('§')[0]!,
        {
          exact: false,
        },
      ),
    ).toBeInTheDocument();
    await goPreview(user, dlg);
    expect(within(dlg).getByText(tv('early_departure.row_refundable'))).toBeInTheDocument();
    expect(within(dlg).getByText(tv('early_departure.row_fee'))).toBeInTheDocument();
    expect(within(dlg).getByText(tv('early_departure.row_notice'))).toBeInTheDocument();
    expect(
      within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('early_departure.lease_title'))).toBeNull();
    expect(within(dlg).queryByText(tv('early_departure.lease_still_due'))).toBeNull();
  });

  it('lease: the drawer offers B16; the preview says BR-313 (deposit forfeited) with no refund / fee / notice rows', async () => {
    const { user, dlg, r } = await openDialog('Emma Laurent');
    expect(r.stayType).toBe('long');
    const deposit = r.manualLongStay!.depositHeldVnd!;
    // Step 1: no "Báo trước N ngày" (BR-428 notice means nothing for a lease).
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    expect(within(dlg).queryByText(/^Báo trước \d+ ngày/)).toBeNull();
    await goPreview(user, dlg);

    const note = within(dlg).getByRole('note');
    expect(within(note).getByText(tv('early_departure.lease_title'))).toBeInTheDocument();
    expect(
      within(note).getByText(tv('early_departure.lease_rule', { amount: M(deposit) })),
    ).toBeInTheDocument();
    expect(within(note).getByText(tv('early_departure.lease_still_due'))).toBeInTheDocument();
    // ESC-048 B + FB-R4-DOM-FE-A-02: the Desk cannot see the rent periods nor the signing date – a check line and
    // the three branches, never one outcome for every lease.
    for (const k of LEASE_BRANCHES) expect(within(note).getByText(tv(k))).toBeInTheDocument();
    for (const k of BR428) expect(within(dlg).queryByText(tv(k))).toBeNull();
    expect(within(dlg).queryByText(tv('early_departure.row_fee'))).toBeNull();
    expect(
      within(dlg).queryByRole('checkbox', { name: tv('early_departure.told_guest') }),
    ).toBeNull();

    // Tick the BR-313 line, confirm: the result keeps BR-313 and no "Không có khoản hoàn" / "Xem cách tính".
    await user.click(
      within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest_lease') }),
    );
    await user.click(within(dlg).getByRole('button', { name: tv('early_departure.confirm') }));
    expect(
      await within(dlg).findByText(tv('early_departure.done_title', { date: '§' }).split('§')[0]!, {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(
      within(dlg).getByText(tv('early_departure.lease_rule', { amount: M(deposit) })),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('early_departure.no_refund'))).toBeNull();
    expect(within(dlg).queryByText(tv('early_departure.show_calc'))).toBeNull();
  });

  it('lease without a recorded deposit: the BR-313 line has no amount', async () => {
    const r = res('Emma Laurent');
    r.manualLongStay = { ...r.manualLongStay!, depositHeldVnd: undefined };
    const { user, dlg } = await openDialog('Emma Laurent');
    await goPreview(user, dlg);
    expect(within(dlg).getByText(tv('early_departure.lease_rule_no_amount'))).toBeInTheDocument();
  });

  it('lease the server puts money on (not in v1.0): its figures stay visible next to BR-313 – never unseen money', async () => {
    const { user, dlg, r } = await openDialog('Emma Laurent');
    const T = todayLocal();
    await waitFor(() => expect(toPreview(dlg)).not.toHaveAttribute('aria-disabled'));
    // The first preview created the folio; a posted night tomorrow makes the next preview carry a fee.
    mockControl.stay.folios.get(r.folioId)!.lines.push({
      id: 'r4-014-night',
      category: 'room',
      description: 'room_night',
      labelKey: 'bill.line.room_night',
      labelParams: {},
      serviceDate: addDays(T, 1),
      quantity: 1,
      unitPriceVnd: 400_000,
      amountVnd: 400_000,
      lineState: 'posted',
      postedAt: new Date().toISOString(),
      postedBy: 'Hạnh',
    } as never);
    await setDate(user, dlg, addDays(T, 1));
    await goPreview(user, dlg);
    expect(within(dlg).getByText(tv('early_departure.row_fee'))).toBeInTheDocument();
    expect(within(dlg).getByText(tv('early_departure.lease_title'))).toBeInTheDocument();
    expect(
      within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }),
    ).toBeInTheDocument();
  });
  describe('FB-R4-DOM-FE-A-01 – only a date before the lease end breaks the lease', () => {
    it('lease with a B13 extension, leaving inside the extension: no BR-313 line, the normal BR-428 box', async () => {
      const { end } = leaseWithExtension();
      const { user, dlg } = await openDialog('Emma Laurent');
      await setDate(user, dlg, addDays(end, 1));
      await goPreview(user, dlg);
      expect(within(dlg).queryByText(tv('early_departure.lease_title'))).toBeNull();
      expect(
        within(dlg).queryByText(tv('early_departure.lease_rule', { amount: M(18_000_000) })),
      ).toBeNull();
      expect(within(dlg).getByText(tv('early_departure.row_fee'))).toBeInTheDocument();
      await user.click(
        within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest') }),
      );
      await user.click(within(dlg).getByRole('button', { name: tv('early_departure.confirm') }));
      expect(
        await within(dlg).findByText(
          tv('early_departure.done_title', { date: '§' }).split('§')[0]!,
          { exact: false },
        ),
      ).toBeInTheDocument();
      expect(within(dlg).queryByText(tv('early_departure.lease_title'))).toBeNull();
    });

    it('lease with a B13 extension, leaving before the lease end: BR-313 line, the extension is cancelled', async () => {
      const { child, T } = leaseWithExtension();
      const { user, dlg } = await openDialog('Emma Laurent');
      await setDate(user, dlg, addDays(T, 1));
      await goPreview(user, dlg);
      expect(
        within(dlg).getByText(tv('early_departure.lease_rule', { amount: M(18_000_000) })),
      ).toBeInTheDocument();
      expect(
        within(dlg).getByText(
          tv('early_departure.effect_child_cancelled', { code: child.code, n: 3 }),
        ),
      ).toBeInTheDocument();
    });
  });

  it('ESC-048 B – rent paid up to the lease end, leaving a few days early: the Desk does not guess, it shows the check line and the "paid" branch', async () => {
    const { user, dlg, r } = await openDialog('Emma Laurent');
    await setDate(user, dlg, addDays(r.departureDate, -3));
    await goPreview(user, dlg);
    const note = within(dlg).getByRole('note');
    expect(within(note).getByText(tv('early_departure.lease_check'))).toBeInTheDocument();
    expect(within(note).getByText(tv('early_departure.lease_rule_paid'))).toBeInTheDocument();
    for (const k of BR428) expect(within(dlg).queryByText(tv(k))).toBeNull();
    // The tick records what was explained, not a forfeiture the Desk cannot confirm.
    expect(
      within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest_lease') }),
    ).toBeInTheDocument();
  });
});
