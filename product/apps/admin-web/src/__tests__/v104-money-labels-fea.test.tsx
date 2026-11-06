// v1.0.4 P4-41 (FE-A): BUG-R4-026 refund reason labels (Nhật ký thao tác tiền, Cần duyệt, Hoàn tiền), GN-R4-QA-01
// "may go down at approval" note, BUG-R2-097 refund sentence without a minus, BUG-R3-045 locked folio.
// New keys of plan-v1.0.4 3.1 may still be missing before UXD strings round 1: `tv` then returns the key itself.
import type { AuditEvent } from '@ottimo/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { auditReasonText, requestReasonText } from '../app/auditReason';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const t = tv;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A reason code on screen as is – not inside its own string key `audit.reason.<code>`. */
const RAW_CODE = /(?<!audit\.reason\.)\b(overpayment|early_departure)\b/;
const ev = (e: Partial<AuditEvent>) =>
  ({ action: 'approval.requested', category: 'money', ...e }) as AuditEvent;
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const photo = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], 'bien-nhan.jpg', { type: 'image/jpeg' });

describe('BUG-R4-026 – reason codes in words', () => {
  it('money log: a refund request with `overpayment` / `early_departure` never shows the code', () => {
    expect(auditReasonText(t, ev({ after: { type: 'refund', reasonCode: 'overpayment' } }))).toBe(
      tv('audit.reason.overpayment'),
    );
    expect(
      auditReasonText(t, ev({ after: { type: 'refund', reasonCode: 'early_departure' } })),
    ).toBe(tv('audit.reason.early_departure'));
    // The note the sender typed still follows the label.
    expect(
      auditReasonText(
        t,
        ev({ after: { type: 'refund', reasonCode: 'overpayment', reasonNote: 'Đêm FOC đã thu' } }),
      ),
    ).toBe(`${tv('audit.reason.overpayment')} · "Đêm FOC đã thu"`);
    // `overpayment` alone (any event) is the same label, never the raw code.
    expect(auditReasonText(t, ev({ action: 'refund.requested', reason: 'overpayment' }))).toBe(
      tv('audit.reason.overpayment'),
    );
  });

  it('`early_departure` outside a refund request keeps the folio-line sentence ("Trả phòng sớm")', () => {
    expect(auditReasonText(t, ev({ action: 'folio.line_posted', reason: 'early_departure' }))).toBe(
      tv('mlog.reason.early_departure'),
    );
  });

  it('requestReasonText: refund codes, FOC codes, unknown → null (no code on screen)', () => {
    expect(requestReasonText(t, { type: 'refund', reasonCode: 'overpayment' })).toBe(
      tv('audit.reason.overpayment'),
    );
    expect(requestReasonText(t, { type: 'refund', reasonCode: 'early_departure' })).toBe(
      tv('audit.reason.early_departure'),
    );
    expect(requestReasonText(t, { type: 'foc', reasonCode: 'regular_vip' })).toBe(
      tv('foc.r_regular'),
    );
    expect(requestReasonText(t, { type: 'foc', reasonCode: 'early_departure' })).toBeNull();
    expect(requestReasonText(t, { type: 'refund', reasonCode: 'something_new' })).toBeNull();
    expect(requestReasonText(t, { type: 'refund' })).toBeNull();
  });

  it('Hoàn tiền: each card names its reason', async () => {
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const nga = res('Trần Thu Nga');
    const kim = res('Kim Seo-yeon');
    const ngaCard = (await screen.findByText(new RegExp(`^${nga.code} · 500\\.000`))).closest(
      'li',
    )!;
    expect(ngaCard).toHaveTextContent(
      `${tv('audit.reason.overpayment')} · "Khách trả dư tiền cọc"`,
    );
    const kimCard = screen.getByText(new RegExp(`^${kim.code} · 1\\.200\\.000`)).closest('li')!;
    expect(kimCard).toHaveTextContent(tv('audit.reason.early_departure'));
    // The raw code never shows (before P4-01 the label is its key `audit.reason.…`, which is not the code).
    for (const card of [ngaCard, kimCard]) expect(card.textContent).not.toMatch(RAW_CODE);
  });

  it('FB-R4-UXD-FE-P441-01: Hoàn tiền – a refund waiting for a decision says its amount may go down; an approved one does not', async () => {
    const kim = res('Kim Seo-yeon');
    mockControl.stay.approvals.push({
      id: '0192a1b0-0000-7000-8000-000000085998',
      type: 'refund',
      status: 'pending',
      reservationCode: kim.code,
      folioId: kim.folioId,
      amountVnd: 1_017_000,
      reasonCode: 'overpayment',
      requestedBy: 'Hạnh',
      requestedByUserId: mockControl.db.users.find((u) => u.username === 'qa.fd')!.id,
      requestedAt: new Date().toISOString(),
    });
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const pending = (await screen.findByText(new RegExp(`^${kim.code} · 1\\.017\\.000`))).closest(
      'li',
    )!;
    expect(within(pending).getByText(tv('approvals.refund_may_decrease'))).toBeVisible();
    const nga = res('Trần Thu Nga');
    const approved = screen.getByText(new RegExp(`^${nga.code} · 500\\.000`)).closest('li')!;
    expect(within(approved).queryByText(tv('approvals.refund_may_decrease'))).toBeNull();
  });
});

describe('Cần duyệt – refund rows (BUG-R4-026, GN-R4-QA-01)', () => {
  it('a pending refund shows its reason and "the amount may go down at approval"; a FOC row does not', async () => {
    const kim = res('Kim Seo-yeon');
    mockControl.stay.approvals.push({
      id: '0192a1b0-0000-7000-8000-000000085999',
      type: 'refund',
      status: 'pending',
      reservationCode: kim.code,
      folioId: kim.folioId,
      amountVnd: 1_017_000,
      reasonCode: 'overpayment',
      requestedBy: 'Hạnh',
      requestedByUserId: mockControl.db.users.find((u) => u.username === 'qa.fd')!.id,
      requestedAt: new Date().toISOString(),
    });
    renderApp('/approvals', 'qa.mgr');
    const refund = (
      await screen.findByText(new RegExp(`^${kim.code} · ${esc(tv('refund.title'))}`))
    ).closest('li')!;
    expect(
      within(refund).getByText(new RegExp(`^${esc(tv('audit.reason.overpayment'))} · `)),
    ).toBeVisible();
    expect(within(refund).getByText(tv('approvals.refund_may_decrease'))).toBeVisible();
    expect(refund.textContent).not.toMatch(RAW_CODE);
    const foc = screen
      .getByText(new RegExp(`^${kim.code} · ${esc(tv('foc.kind_foc'))}`))
      .closest('li')!;
    expect(within(foc).queryByText(tv('approvals.refund_may_decrease'))).toBeNull();
    expect(foc).toHaveTextContent(`${tv('foc.r_regular')} · "Khách ở lần thứ 4"`);
  });
});

describe('BUG-R2-097 – refund paid sentence', () => {
  it('the refund transaction is negative on the server: the toast says the amount without a minus', async () => {
    server.use(
      http.post('*/actions/execute-cash-refund', () =>
        HttpResponse.json({
          id: '0192a1b0-0000-7000-8000-000000086001',
          type: 'refund',
          method: 'cash',
          status: 'succeeded',
          amountVnd: -500_000,
        }),
      ),
    );
    const { user } = renderApp('/audit', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const nga = res('Trần Thu Nga');
    const card = (await screen.findByText(new RegExp(`^${nga.code} · 500\\.000`))).closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('refund.execute_cash') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_cash') });
    await user.upload(
      within(dlg).getByLabelText(new RegExp(tv('refund.proof').replace(/[()]/g, '.'))),
      photo(),
    );
    await user.click(within(dlg).getByRole('button', { name: tv('refund.execute_cash') }));
    const toast = await screen.findByText(
      new RegExp(tv('refund.paid', { amount: '§' }).split('§')[0]!),
    );
    expect(toast.textContent).toContain('500.000');
    expect(toast.textContent).not.toMatch(/[-−]\s*500\.000/);
  });
});

describe('BUG-R3-045 – a locked folio offers no adjustment', () => {
  /** Hoàng Long (103) checked out: its folio as `closed` (J15 ran). */
  function closedFolio() {
    const r = res('Hoàng Long');
    const f = mockControl.stay.folios.get(r.folioId);
    if (f) f.status = 'closed';
    return r;
  }

  it('closed folio: the manager sees no "Điều chỉnh", and the FOLIO_LOCKED sentence instead of "chỉ quản lý"', async () => {
    const r = closedFolio();
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const drawer = await screen.findByRole('dialog', { name: r.guestName });
    await user.click(await within(drawer).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('folio.dialog_title', { code: r.code }),
    });
    await waitFor(() => expect(within(dlg).getByText(tv('error.FOLIO_LOCKED'))).toBeVisible());
    expect(within(dlg).queryByRole('button', { name: tv('folio.adjust') })).toBeNull();
    expect(within(dlg).queryByText(tv('folio.settled_mgr'))).toBeNull();
  });
  it('settled folio past its window: 409 FOLIO_LOCKED on a raise → the sentence, then no "Điều chỉnh" for anyone', async () => {
    const r = res('Hoàng Long');
    const f = mockControl.stay.folios.get(r.folioId)!;
    f.status = 'settled';
    server.use(
      http.post('*/lines/:lineId/adjustments', () =>
        HttpResponse.json(
          {
            type: 't',
            title: 't',
            status: 409,
            code: 'FOLIO_LOCKED',
            detail: 'post-checkout window over (BR-427 d)',
            requestId: 'r-409',
          },
          { status: 409, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const drawer = await screen.findByRole('dialog', { name: r.guestName });
    await user.click(await within(drawer).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('folio.dialog_title', { code: r.code }),
    });
    const adjust = (await within(dlg).findAllByRole('button', { name: tv('folio.adjust') }))[0]!;
    await user.click(adjust);
    const box = await screen.findByRole('dialog', {
      name: new RegExp(esc(tv('folio.adjust_title', { label: '§' })).split('§')[0]!),
    });
    const price = within(box).getByLabelText(
      new RegExp(`^(${esc(tv('folio.adjust_night_price'))}|${esc(tv('folio.adjust_price'))})`),
    );
    await user.clear(price);
    await user.type(price, '9.999.000');
    await user.type(
      within(box).getByLabelText(new RegExp(esc(tv('folio.adjust_reason')))),
      'Sửa giá',
    );
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(await within(box).findByText(tv('error.FOLIO_LOCKED'))).toBeVisible();
    // Not the debt sentence: this is the window, for every role.
    expect(within(box).queryByText(tv('folio.adjust_debt_locked'))).toBeNull();
    await user.click(within(box).getByRole('button', { name: tv('common.cancel') }));
    await waitFor(() =>
      expect(within(dlg).queryByRole('button', { name: tv('folio.adjust') })).toBeNull(),
    );
    expect(within(dlg).getByText(tv('error.FOLIO_LOCKED'))).toBeVisible();
  });
});

describe('ORC 04/11 – money log: `refund.destination_carried` (BE-D, OpenAPI 0.3.12)', () => {
  it('is drawn with its own sentence, not "Thao tác tiền khác" + the raw code', async () => {
    const mgr = mockControl.db.users.find((u) => u.username === 'qa.mgr')!.id;
    mockControl.stay.audit.unshift({
      occurredAt: new Date().toISOString(),
      actorType: 'user',
      actorName: 'Quân',
      actorUserId: mgr,
      category: 'money',
      entityType: 'folio',
      entityCode: 'R-TEST',
      action: 'refund.destination_carried',
      after: {},
    });
    renderApp('/audit', 'qa.mgr');
    const cell = (await screen.findByText(tv('mlog.a_refund_destination_carried'))).closest('td')!;
    expect(cell.textContent).not.toContain(tv('mlog.a_other'));
    expect(within(cell).queryByText('refund.destination_carried')).toBeNull();
  });
});

describe('OpenAPI 0.3.13 bổ sung 1f – money log: `attention_event.resolved` (SEC ARC-20)', () => {
  it('"Không thấy tiền" on a deposit_after_cancel item has its own sentence, not "Thao tác tiền khác"', async () => {
    const mgr = mockControl.db.users.find((u) => u.username === 'qa.mgr')!.id;
    mockControl.stay.audit.unshift({
      occurredAt: new Date().toISOString(),
      actorType: 'user',
      actorName: 'Quân',
      actorUserId: mgr,
      category: 'money',
      entityType: 'attention_event',
      entityCode: 'R-TEST',
      action: 'attention_event.resolved',
      after: { kind: 'deposit_after_cancel', afterClosure: true },
    });
    renderApp('/audit', 'qa.mgr');
    const cell = (await screen.findByText(tv('mlog.a_money_not_found'))).closest('td')!;
    expect(cell.textContent).not.toContain(tv('mlog.a_other'));
    expect(within(cell).queryByText('attention_event.resolved')).toBeNull();
  });
});
