// v1.0.5 FE-3 – V5-13 (refund pending on the folio and the booking drawer), V5-44 (409 FOLIO_LOCKED read by
// `lockReason`, never by `detail`). Contract 0.3.13 (`OpenRefund`, `Problem.lockReason`), server PR #112 (r5-b1).
// Copy: UXD copy-v1.0.5 2.1 section 9.12 (FB-R5-UXD-FE-112-01) – read from the string files through `tv`.
import type { CancelReasonCode } from '@ottimo/api-client';
import { ApiError } from '@ottimo/api-client';
import { formatNumber } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { openRefundGroups, refundReasonKey } from '../app/auditReason';
import { folioLockedKey, problemView } from '../app/problem';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import type { MockApproval } from '../mocks/stay';
import { renderApp, tv } from '../test/render';

const t = tv;
const num = (n: number) => formatNumber('vi', n);
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const cells = (tr: Element) => [...tr.querySelectorAll('td')].map((td) => td.textContent ?? '');

/** Every value of the contract's `CancelReasonCode` (the record fails the type check if the contract changes). */
const CANCEL_CODES: Record<CancelReasonCode, true> = {
  guest_cancelled: true,
  guest_changed_mind: true,
  found_other: true,
  price: true,
  date_change: true,
  unreachable: true,
  hold_expired: true,
  ota_cancelled: true,
  overbooking_relocated: true,
  group_partial: true,
  other: true,
};

let seq = 0;
function refund(
  r: { code: string; folioId?: string | null },
  x: Partial<MockApproval> & Pick<MockApproval, 'amountVnd' | 'reasonCode'>,
): MockApproval {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-0000005${String(seq).padStart(5, '0')}`,
    type: 'refund',
    status: 'pending',
    reservationCode: r.code,
    folioId: r.folioId ?? undefined,
    requestedBy: 'Lan',
    requestedByUserId: '0192a1b0-0000-7000-8000-000000000003',
    requestedAt: new Date().toISOString(),
    refundedVnd: 0,
    requiredRole: 'manager',
    ...x,
  };
}

const problem409 = (extras: Record<string, unknown>) =>
  new ApiError(409, {
    type: 'about:blank',
    title: 'Folio locked',
    status: 409,
    code: 'FOLIO_LOCKED',
    ...extras,
  } as never);

describe('V5-13 – refund reason labels (UXD 9.12, DOM 112-01): one code, one label, never the code', () => {
  it('three steps: own label (overbooking_relocated before the cancellation group) → cancellation or no-show → "Hoàn tiền"', () => {
    expect(refundReasonKey('early_departure')).toBe('audit.reason.early_departure');
    expect(refundReasonKey('overpayment')).toBe('audit.reason.overpayment');
    expect(refundReasonKey('payment_after_cancel')).toBe('audit.reason.payment_after_cancel');
    // also a CancelReasonCode – its own label wins
    expect(refundReasonKey('overbooking_relocated')).toBe('audit.reason.overbooking_relocated');
    for (const code of Object.keys(CANCEL_CODES).filter((c) => c !== 'overbooking_relocated'))
      expect(refundReasonKey(code), code).toBe('audit.reason.cancellation');
    expect(refundReasonKey('no_show')).toBe('audit.reason.cancellation');
    for (const code of ['manual_fix', '', null, undefined, 'toString', '__proto__'])
      expect(refundReasonKey(code as string | undefined), String(code)).toBe(
        'audit.reason.refund_other',
      );
  });

  it('every label is a sentence of the string files (no key shown as is)', () => {
    for (const key of [
      'audit.reason.early_departure',
      'audit.reason.overpayment',
      'audit.reason.overbooking_relocated',
      'audit.reason.payment_after_cancel',
      'audit.reason.cancellation',
      'audit.reason.refund_other',
    ])
      expect(t(key), key).not.toBe(key);
  });

  it('openRefunds summed per label, in the fixed order of the table; groups at 0 left out', () => {
    // the server sorts by code – the Desk re-orders by label group
    const groups = openRefundGroups([
      { reasonCode: 'found_other', openVnd: 300_000 },
      { reasonCode: 'manual_fix', openVnd: 10_000 },
      { reasonCode: 'no_show', openVnd: 50_000 },
      { reasonCode: 'overbooking_relocated', openVnd: 400_000 },
      { reasonCode: 'overpayment', openVnd: 100_000 },
      { reasonCode: 'payment_after_cancel', openVnd: 0 },
      { reasonCode: 'price', openVnd: 200_000 },
      { reasonCode: 'early_departure', openVnd: 732_000 },
    ]);
    expect(groups).toEqual([
      { key: 'audit.reason.early_departure', vnd: 732_000 },
      { key: 'audit.reason.overpayment', vnd: 100_000 },
      { key: 'audit.reason.overbooking_relocated', vnd: 400_000 },
      // found_other + price + no_show → ONE row
      { key: 'audit.reason.cancellation', vnd: 550_000 },
      { key: 'audit.reason.refund_other', vnd: 10_000 },
    ]);
    expect(openRefundGroups([])).toEqual([]);
  });

  it('Cần duyệt / Hoàn tiền: a refund of a cancellation shows the cancellation label, not the cancel reason', async () => {
    const r = rsvOf('Phạm Huy');
    mockControl.stay.approvals.push(refund(r, { amountVnd: 640_000, reasonCode: 'found_other' }));
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const card = (await screen.findByText(new RegExp(`^${r.code} · 640\\.000`))).closest('li')!;
    expect(card).toHaveTextContent(tv('audit.reason.cancellation'));
    expect(card.textContent).not.toContain(tv('cancel.reason.found_other'));
    expect(card.textContent).not.toMatch(/\bfound_other\b/);
  });
});

describe('V5-13 – Folio (U4): pending refund of the stay, every request whoever asked it', () => {
  /** Phạm Huy (in house): 300.000 of a cancellation-style refund and 732.000 early departure, asked by Lan (FDL). */
  function withPending() {
    const r = rsvOf('Phạm Huy');
    mockControl.stay.approvals.push(
      refund(r, { amountVnd: 732_000, reasonCode: 'early_departure' }),
      refund(r, {
        amountVnd: 500_000,
        reasonCode: 'price',
        status: 'approved',
        refundedVnd: 200_000,
      }),
      refund(r, { amountVnd: 999_000, reasonCode: 'overpayment', status: 'rejected' }),
    );
    return r;
  }

  async function openDrawer(r: { guestName: string; id: string }, as: string) {
    const v = renderApp(`/reservations/${r.id}`, as);
    const drawer = await screen.findByRole('dialog', { name: r.guestName });
    return { ...v, drawer };
  }

  it('booking drawer, FD: one "Đang chờ hoàn" row with the total under "Còn phải thu" – no groups', async () => {
    const r = withPending();
    const { drawer } = await openDrawer(r, 'qa.fd');
    const label = await within(drawer).findByText(tv('drawer.folio.open_refunds'));
    const row = label.closest('tr')!;
    expect(cells(row)).toEqual([tv('drawer.folio.open_refunds'), num(732_000 + 300_000)]);
    expect(row).toHaveClass('sub');
    // under the balance row of the same table
    const rows = within(row.closest('table')!).getAllByRole('row');
    const balance = rows.findIndex((x) => cells(x)[0] === tv('drawer.folio.balance'));
    expect(balance).toBeGreaterThanOrEqual(0);
    expect(rows.indexOf(row)).toBe(balance + 1);
    expect(within(drawer).queryByText(tv('audit.reason.early_departure'))).toBeNull();
    expect(within(drawer).queryByText(tv('folio.open_refunds_may_decrease'))).toBeNull();
  });

  it('booking drawer: nothing pending → no row; SAL (field not sent) → no row', async () => {
    const r = rsvOf('Phạm Huy');
    const first = await openDrawer(r, 'qa.fd');
    await within(first.drawer).findByText(tv('drawer.folio.balance'));
    expect(within(first.drawer).queryByText(tv('drawer.folio.open_refunds'))).toBeNull();
    expect(within(first.drawer).queryByText(tv('checkout.pending_refund_unavailable'))).toBeNull();
    first.unmount();

    withPending();
    r.createdBy = mockControl.db.users.find((u) => u.username === 'qa.sal')!.id;
    const sal = await openDrawer(r, 'qa.sal');
    await within(sal.drawer).findByText(tv('drawer.folio.title'));
    await new Promise((ok) => setTimeout(ok, 50));
    expect(within(sal.drawer).queryByText(tv('drawer.folio.open_refunds'))).toBeNull();
    expect(within(sal.drawer).queryByText(tv('checkout.pending_refund_unavailable'))).toBeNull();
  });

  it('booking drawer, FD: the folio cannot be read → "cannot load" in a dashed row, never "nothing pending"', async () => {
    const r = withPending();
    server.use(
      http.get('*/v1/properties/:propertyId/folios/:folioId', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Internal', status: 500, code: 'INTERNAL_ERROR' },
          { status: 500 },
        ),
      ),
    );
    const { drawer } = await openDrawer(r, 'qa.fd');
    const note = await within(drawer).findByText(tv('checkout.pending_refund_unavailable'));
    expect(note.closest('tr')).toHaveClass('sub');
    expect(within(drawer).queryByText(tv('drawer.folio.open_refunds'))).toBeNull();
  });

  it('booking drawer, FD: read once, then the re-read after a save fails → "cannot load", not the old total (ARC-134-01)', async () => {
    const r = withPending();
    r.doorAccessHandedOverAt = null; // a one-click save on the drawer that gives the booking a new version
    const { drawer, user } = await openDrawer(r, 'qa.fd');
    await within(drawer).findByText(tv('drawer.folio.open_refunds'));
    server.use(
      http.get('*/v1/properties/:propertyId/folios/:folioId', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Internal', status: 500, code: 'INTERNAL_ERROR' },
          { status: 500 },
        ),
      ),
    );
    const version = r.version;
    await user.click(
      within(drawer).getByRole('button', { name: tv('drawer.action.door_handed_over') }),
    );
    const confirm = (await screen.findByText(tv('ci.door_late_body'))).closest('[role]')!;
    await user.click(
      within(confirm as HTMLElement).getByRole('button', {
        name: tv('drawer.action.door_handed_over'),
      }),
    );
    await waitFor(() => expect(r.version).toBeGreaterThan(version));
    const note = await within(drawer).findByText(tv('checkout.pending_refund_unavailable'));
    expect(note.closest('tr')).toHaveClass('sub');
    expect(within(drawer).queryByText(tv('drawer.folio.open_refunds'))).toBeNull();
  });

  it('folio box: the total, one row per group and the note under "Còn phải thu"', async () => {
    const r = withPending();
    const { user, drawer } = await openDrawer(r, 'qa.mgr');
    await user.click(await within(drawer).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('folio.dialog_title', { code: r.code }),
    });
    const head = (await within(dlg).findByText(tv('folio.open_refunds_total'))).closest('tr')!;
    const rows = within(head.closest('table')!).getAllByRole('row');
    const at = rows.indexOf(head);
    expect(cells(rows[at - 1]!)[0]).toBe(tv('drawer.folio.balance'));
    expect(rows.slice(at).map(cells)).toEqual([
      [tv('folio.open_refunds_total'), num(1_032_000)],
      [tv('audit.reason.early_departure'), num(732_000)],
      [tv('audit.reason.cancellation'), num(300_000)],
      [tv('folio.open_refunds_may_decrease')],
    ]);
  });
});

describe('V5-44 – 409 FOLIO_LOCKED: the sentence follows `lockReason` (UXD 9.12), never `detail`', () => {
  it('problemView: each reason × role; unknown or absent → the general sentence', () => {
    const mgr = { manager: true };
    const fd = { manager: false };
    const v = (extras: Record<string, unknown>, o: { manager: boolean }) =>
      problemView(t, problem409(extras), 'vi', o).text;
    expect(v({ lockReason: 'closed' }, fd)).toBe(tv('error.FOLIO_LOCKED_closed'));
    expect(v({ lockReason: 'closed' }, mgr)).toBe(tv('error.FOLIO_LOCKED_closed'));
    // settled: the manager may still adjust (A32) – never "managers included"
    expect(v({ lockReason: 'settled' }, fd)).toBe(tv('error.FOLIO_LOCKED_settled'));
    expect(v({ lockReason: 'settled' }, mgr)).toBe(tv('error.FOLIO_LOCKED_settled_mgr'));
    expect(v({ lockReason: 'post_checkout_window_over' }, mgr)).toBe(
      tv('error.FOLIO_LOCKED_window_over'),
    );
    expect(v({ lockReason: 'debt_reduction_requires_write_off' }, mgr)).toBe(
      tv('folio.adjust_debt_locked'),
    );
    expect(v({ lockReason: 'debt_reduction_requires_write_off' }, fd)).toBe(tv('folio.debt_fd'));
    expect(v({ lockReason: 'invoice_issued' }, fd)).toBe(tv('error.FOLIO_LOCKED_invoice_issued'));
    // older server, a new value, or only a log sentence naming the debt rule → general sentence
    expect(v({}, mgr)).toBe(tv('error.FOLIO_LOCKED'));
    expect(v({ lockReason: 'something_new' }, mgr)).toBe(tv('error.FOLIO_LOCKED'));
    expect(v({ detail: 'open debt – FOC debt_write_off (BR-525)' }, mgr)).toBe(
      tv('error.FOLIO_LOCKED'),
    );
    // default (no role given) = the front-desk sentence
    expect(problemView(t, problem409({ lockReason: 'settled' })).text).toBe(
      tv('error.FOLIO_LOCKED_settled'),
    );
    expect(folioLockedKey('toString', true)).toBe('error.FOLIO_LOCKED');
  });

  it('the general sentence says "Folio", not "Phiếu thanh toán" (content guide 3); EN keeps U+2011', () => {
    expect(tv('error.FOLIO_LOCKED')).toMatch(/^Folio đã khóa\./);
    for (const key of [
      'error.FOLIO_LOCKED_closed',
      'error.FOLIO_LOCKED_settled',
      'error.FOLIO_LOCKED_settled_mgr',
      'error.FOLIO_LOCKED_window_over',
      'error.FOLIO_LOCKED_invoice_issued',
    ])
      expect(tv(key), key).not.toBe(key);
  });

  /** Phạm Huy (in house, open folio): the adjust box of its first adjustable line. */
  async function adjustBox(as: string) {
    const r = rsvOf('Phạm Huy');
    const v = renderApp(`/reservations/${r.id}`, as);
    const drawer = await screen.findByRole('dialog', { name: r.guestName });
    await v.user.click(await within(drawer).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('folio.dialog_title', { code: r.code }),
    });
    const adjust = (await within(dlg).findAllByRole('button', { name: tv('folio.adjust') }))[0]!;
    await v.user.click(adjust);
    const box = await screen.findByRole('dialog', {
      name: new RegExp(esc(tv('folio.adjust_title', { label: '§' })).split('§')[0]!),
    });
    const price = within(box).getByLabelText(
      new RegExp(`^(${esc(tv('folio.adjust_night_price'))}|${esc(tv('folio.adjust_price'))})`),
    );
    await v.user.clear(price);
    await v.user.type(price, '900.000');
    await v.user.type(
      within(box).getByLabelText(new RegExp(esc(tv('folio.adjust_reason')))),
      'Sửa giá',
    );
    return { ...v, dlg, box };
  }

  it.each([
    ['qa.fd', 'error.FOLIO_LOCKED_settled'],
    ['qa.mgr', 'error.FOLIO_LOCKED_settled_mgr'],
  ])(
    '`settled` (folio settled meanwhile) – %s reads the sentence of their role; the folio is not marked final',
    async (as, key) => {
      const { user, dlg, box } = await adjustBox(as);
      mockControl.failNext(/\/adjustments:POST$/, 409, {
        code: 'FOLIO_LOCKED',
        lockReason: 'settled',
        detail: 'post-checkout window over (BR-427 d)',
      });
      await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
      expect(await within(box).findByText(tv(key))).toBeInTheDocument();
      expect(within(box).queryByText(tv('error.FOLIO_LOCKED'))).toBeNull();
      expect(within(box).queryByRole('button', { name: tv('debt.write_off') })).toBeNull();
      await user.click(within(box).getByRole('button', { name: tv('common.cancel') }));
      await waitFor(() => expect(screen.queryAllByRole('dialog')).toHaveLength(2));
      // not a final folio: no locked frame, "Điều chỉnh" still offered
      expect(within(dlg).queryByText(tv('error.FOLIO_LOCKED_window_over'))).toBeNull();
      expect(
        within(dlg).getAllByRole('button', { name: tv('folio.adjust') }).length,
      ).toBeGreaterThan(0);
    },
  );

  it('`closed` from the server while the box is open → the closed sentence, then the folio frame says it', async () => {
    const { user, dlg, box } = await adjustBox('qa.mgr');
    mockControl.failNext(/\/adjustments:POST$/, 409, {
      code: 'FOLIO_LOCKED',
      lockReason: 'closed',
    });
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(await within(box).findByText(tv('error.FOLIO_LOCKED_closed'))).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: tv('common.cancel') }));
    expect(await within(dlg).findByText(tv('error.FOLIO_LOCKED_closed'))).toBeVisible();
    expect(within(dlg).queryByRole('button', { name: tv('folio.adjust') })).toBeNull();
  });

  it.each([
    ['qa.mgr', 'error.FOLIO_LOCKED_settled_mgr'],
    ['qa.fd', 'error.FOLIO_LOCKED_settled'],
  ])(
    'booking boxes outside useSubmit follow the role too (ARC-134-02): B4 `settled` for %s → %s',
    async (as, key) => {
      const r = rsvOf('Lê Minh');
      const { user } = renderApp(`/reservations/${r.id}`, as);
      const drawer = await screen.findByRole('dialog', { name: 'Lê Minh' });
      await user.click(
        await within(drawer).findByRole('button', { name: tv('drawer.action.confirm_deposit') }),
      );
      const dlg = await screen.findByRole('dialog', {
        name: tv('rsv.deposit_title', { code: r.code }),
      });
      await user.selectOptions(within(dlg).getByLabelText(tv('pay.method')), 'cash');
      mockControl.failNext(/\/actions\/confirm-deposit:POST$/, 409, {
        code: 'FOLIO_LOCKED',
        lockReason: 'settled',
      });
      await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
      expect(await within(dlg).findByText(tv(key))).toBeInTheDocument();
    },
  );
});
