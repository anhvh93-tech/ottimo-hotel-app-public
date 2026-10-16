import { ApiError, type FolioLine } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { lineLabel } from '../app/folio';
import { problemView } from '../app/problem';
import { Providers } from '../app/Providers';
import { useSubmit } from '../pages/stay/common';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

// Round 2 Sprint 3 – "Phản hồi & sửa": UXD FE-S3-*, SEC FE-06, DOM FE-03, ARC 0.3.6 add. 1 & 2.

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const userId = (username: string) => mockControl.db.users.find((u) => u.username === username)!.id;

describe('FE-S3-01 + FB-R2-SEC-FE-06 – portal data (H14 14.2)', () => {
  const setVisibility = (v: 'hidden' | 'visible') => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  };
  afterEach(() => setVisibility('visible'));

  it('labels from i18n keys, enum values translated, the copy sends the server value; empty → no copy; tab hidden → hidden + clipboard wiped', async () => {
    const r = res('Gia đình anh Hưng');
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.status = 'scanned';
    reg.documents.push({
      id: 'doc-portal-1',
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: 'Nguyễn Văn Hưng',
      nationalityCode: 'VNM',
      docNumber: '079123456789',
      dateOfBirth: '1985-04-02',
      gender: 'male',
      imageIds: [],
      imageConsent: 'refused',
      captureMethod: 'manual',
      checks: [],
    });
    mockControl.stay.stepUpUntil.set(userId('qa.fd'), Date.now() + 5 * 60_000);
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const write = vi.spyOn(navigator.clipboard, 'writeText');

    await user.click(await screen.findByRole('button', { name: tv('reg2.show_data') }));
    const table = await screen.findByRole('table', { name: tv('reg.step.copy') });
    // Label = the server's i18n key; enum value = `valueKey` text.
    const genderRow = within(table).getByText(tv('reg.field.gender')).closest('tr')!;
    expect(within(genderRow).getByText(tv('reg.value.gender.male'))).toBeInTheDocument();
    // Empty field: "Không có – để trống trên cổng", nothing to copy.
    const addrRow = within(table).getByText(tv('reg.field.address')).closest('tr')!;
    expect(within(addrRow).getByText(tv('reg.value.empty'))).toBeInTheDocument();
    expect(within(addrRow).queryByRole('button')).not.toBeInTheDocument();
    // Copy sends the Vietnamese server value (what the portal expects).
    await user.click(
      within(genderRow).getByRole('button', {
        name: `${tv('reg.copy_field')} ${tv('reg.field.gender')}`,
      }),
    );
    expect(write).toHaveBeenLastCalledWith('Nam');
    expect(within(genderRow).getByText(tv('reg.copied'))).toBeInTheDocument();
    expect(
      screen.getByText(tv('reg2.portal_autohide', { minutes: 1 }), { exact: false }),
    ).toBeInTheDocument();

    // Leaving the tab hides the data and overwrites the clipboard (SR-C3-11(4)).
    setVisibility('hidden');
    await waitFor(() =>
      expect(screen.queryByRole('table', { name: tv('reg.step.copy') })).not.toBeInTheDocument(),
    );
    expect(write).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('button', { name: tv('reg2.show_data') })).toBeInTheDocument();
    write.mockRestore();
  });
});

describe('FE-S3-02 – manual passport entry keeps "no entry record" (BR-613 c)', () => {
  it('unticking "Có dấu / chứng nhận nhập cảnh" hides the entry date and saves noEntryRecord', async () => {
    const r = res('Anna Martin');
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await user.click(
      (await screen.findAllByRole('button', { name: tv('checkin.docs.manual') }))[0]!,
    );
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    await user.selectOptions(
      within(dlg).getByLabelText(new RegExp(`^${tv('checkin.docs.field.doc_type')}`)),
      'passport',
    );
    // FE-S3-04: saving with an empty number says so at the field (no silent locked button).
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    expect(
      within(dlg).getByLabelText(new RegExp(`^${tv('checkin.docs.field.doc_no')}`)),
    ).toHaveAccessibleDescription(new RegExp(tv('common.required')));
    await user.type(
      within(dlg).getByLabelText(new RegExp(`^${tv('checkin.docs.field.doc_no')}`)),
      'C01234567',
    );
    expect(
      within(dlg).getByLabelText(new RegExp(`^${tv('checkin.docs.field.entry_date')}`)),
    ).toBeInTheDocument();
    await user.click(
      within(dlg).getByRole('checkbox', { name: tv('checkin.verify.entry_record') }),
    );
    expect(
      within(dlg).queryByLabelText(new RegExp(`^${tv('checkin.docs.field.entry_date')}`)),
    ).not.toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    await waitFor(() =>
      expect(
        mockControl.stay.registrations
          .get(r.registrationId!)!
          .documents.find((d) => d.docNumber === 'C01234567')?.noEntryRecord,
      ).toBe(true),
    );
  });
});

describe('FE-S3-05 – FD + room not ready: the button sends a request to the lead', () => {
  it('with a reason typed the main button reads "Gửi lễ tân trưởng xác nhận"', async () => {
    mockControl.stay.roomStatus['302'] = 'VD';
    const r = res('Gia đình anh Hưng');
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    const roomCond = (await screen.findByText(tv('checkin.cond.room_ready'))).closest('li')!;
    await user.type(
      within(roomCond).getByLabelText(new RegExp(`^${tv('ci.reason')}`)),
      'Khách đến sớm, chờ dọn',
    );
    await user.click(screen.getByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    // BUG-R2-032: step 3 → 4 is "Tiếp tục: Giao mã & hoàn tất", never "Nhận phòng căn {room}".
    expect(await screen.findByRole('button', { name: tv('ci.go_handover') })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\{room\}/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
    const btn = await screen.findByRole('button', { name: tv('ci.send_lead') });
    // FE-S3-04: still locked, with the first missing thing said next to it.
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).toHaveAccessibleDescription(tv('ci.submit_needs_rules'));
    expect(
      screen.queryByRole('button', { name: tv('ci.submit', { room: '302' }) }),
    ).not.toBeInTheDocument();
  });
});

describe('FE-S3-03 – extension shows what the guest pays extra (BR-107 repricing)', () => {
  it('2 added nights crossing 7 → button = deltaVnd, the whole-booking total in the info line', async () => {
    const kim = res('Kim Seo-yeon');
    server.use(
      http.get('*/v1/properties/:p/reservations/:r/extension-options', () =>
        HttpResponse.json({
          maxNights: 2,
          exceedsShortStayLimit: false,
          createsChildReservation: false,
          currentBookingRateVnd: 620_000,
          nights: [
            { date: '2026-12-01', available: true, defaultRateVnd: 620_000 },
            { date: '2026-12-02', available: true, defaultRateVnd: 620_000 },
          ],
          repricing: [
            { nights: 1, repricedTotalVnd: 3_720_000, deltaVnd: 620_000, losDiscountPct: 0 },
            { nights: 2, repricedTotalVnd: 3_906_000, deltaVnd: 1_126_000, losDiscountPct: 10 },
          ],
        }),
      ),
    );
    const { user } = renderApp(`/reservations/${kim.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.extend') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('extend.title', { room: '402', guest: 'Kim Seo-yeon' }),
    });
    const boxes = await within(dlg).findAllByRole('checkbox');
    await user.click(boxes[1]!);
    expect(
      within(dlg).getByRole('button', {
        name: tv('extend.submit', {
          n: 2,
          amount: tv('common.currency_vnd', { amount: '1.126.000' }),
        }),
      }),
    ).toBeInTheDocument();
    expect(
      within(dlg).getByText(tv('common.currency_vnd', { amount: '3.906.000' }), { exact: false }),
    ).toBeInTheDocument();
  });
});

describe('E04-07 – "Giữ giá đơn" (currentBookingRateVnd, UXD s3 E.1)', () => {
  it('the booking rate replaces the calendar rate for the new nights and is sent as nightlyRates', async () => {
    const kim = res('Kim Seo-yeon');
    const dep = kim.departureDate;
    const sent: Array<Record<string, unknown>> = [];
    server.use(
      http.get('*/v1/properties/:p/reservations/:r/extension-options', () =>
        HttpResponse.json({
          maxNights: 2,
          createsChildReservation: false,
          currentBookingRateVnd: 700_000,
          nights: [
            { date: addDays(dep, 0), available: true, defaultRateVnd: 620_000 },
            { date: addDays(dep, 1), available: true, defaultRateVnd: 620_000 },
          ],
          repricing: [
            { nights: 1, repricedTotalVnd: 3_720_000, deltaVnd: 620_000, losDiscountPct: 0 },
            { nights: 2, repricedTotalVnd: 4_340_000, deltaVnd: 1_240_000, losDiscountPct: 0 },
          ],
        }),
      ),
      http.post('*/v1/properties/:p/reservations/:r/actions/extend', async ({ request }) => {
        sent.push((await request.clone().json()) as Record<string, unknown>);
        return undefined;
      }),
    );
    const { user } = renderApp(`/reservations/${kim.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.extend') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('extend.title', { room: '402', guest: 'Kim Seo-yeon' }),
    });
    await user.click((await within(dlg).findAllByRole('checkbox'))[1]!);
    const keep = within(dlg).getByRole('button', {
      name: tv('extend.keep_rate', { amount: tv('common.currency_vnd', { amount: '700.000' }) }),
    });
    expect(keep).toHaveAttribute('aria-pressed', 'false');
    expect(within(dlg).getByText(tv('extend.keep_rate_help'))).toBeInTheDocument();
    await user.click(keep);
    expect(keep).toHaveAttribute('aria-pressed', 'true');
    const submit = within(dlg).getByRole('button', {
      name: tv('extend.submit', {
        n: 2,
        amount: tv('common.currency_vnd', { amount: '1.400.000' }),
      }),
    });
    await user.click(submit);
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]!.nightlyRates).toEqual([
      { date: addDays(dep, 0), amountVnd: 700_000 },
      { date: addDays(dep, 1), amountVnd: 700_000 },
    ]);
  });
});

describe('FE-S3-10 – approvals: per-type text, no "· 0" for operational requests', () => {
  it('late check-out conflict: own label, no amount, own approve title', async () => {
    const kim = res('Kim Seo-yeon');
    mockControl.stay.approvals.push({
      id: 'apr-late-1',
      type: 'late_checkout_conflict',
      status: 'pending',
      reservationCode: kim.code,
      folioId: kim.folioId,
      amountVnd: 0,
      reasonCode: 'other',
      reasonNote: 'Khách bay chiều',
      requestedBy: 'Hạnh',
      requestedByUserId: userId('qa.fd'),
      requestedAt: new Date().toISOString(),
    });
    const { user } = renderApp('/approvals', 'qa.fdl');
    const title = await screen.findByText(
      (_, el) =>
        el?.tagName === 'B' &&
        el.textContent === `${kim.code} · ${tv('approval.type.late_checkout')}`,
    );
    const card = title.closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('approval.approve') }));
    expect(
      await screen.findByRole('dialog', {
        name: tv('approval.approve_title.late_checkout', { code: kim.code }),
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('common.cancel') }));
    await user.click(within(card).getByRole('button', { name: tv('approval.reject') }));
    expect(
      await screen.findByRole('dialog', {
        name: tv('approval.reject_title_generic', { code: kim.code }),
      }),
    ).toBeInTheDocument();
  });
});

describe('ARC 0.3.6 add. 2 – money log: closed action list, unknown → "Thao tác tiền khác"', () => {
  it('known actions use their own label, a future action shows the generic label + its code', async () => {
    const mgr = userId('qa.mgr');
    const base = {
      occurredAt: new Date().toISOString(),
      actorType: 'user',
      actorName: 'Quân',
      actorUserId: mgr,
      category: 'money',
      entityType: 'folio',
      entityCode: 'R-TEST',
    };
    mockControl.stay.audit.unshift(
      { ...base, action: 'folio_line.adjusted', after: { amountVnd: 50_000 } },
      { ...base, action: 'folio.foc_posted', after: { amountVnd: 50_000 } },
      { ...base, action: 'config.changed', after: {} },
      { ...base, action: 'reservation.extra_night_on_checkout', after: { amountVnd: 708_000 } },
      { ...base, action: 'approval.approved', after: { type: 'refund', amountVnd: 200_000 } },
      { ...base, action: 'approval.approved', after: { type: 'foc', amountVnd: 75_000 } },
      { ...base, action: 'folio.something_new', after: {} },
    );
    renderApp('/audit', 'qa.mgr');
    expect(await screen.findByText(tv('mlog.a_adjusted'))).toBeInTheDocument();
    expect(screen.getByText(tv('mlog.a_foc_posted'))).toBeInTheDocument();
    expect(screen.getByText(tv('mlog.a_receiving_account_changed'))).toBeInTheDocument();
    expect(screen.getByText(tv('mlog.a_extra_night_on_checkout'))).toBeInTheDocument();
    // approval.approved: FOC keeps "Duyệt miễn phí", other money requests say which request.
    expect(
      screen.getByText(`${tv('mlog.a_approval_approved')} · ${tv('refund.title')}`),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('mlog.a_foc_approved'))).toBeInTheDocument();
    const other = screen.getByText('folio.something_new');
    expect(other.closest('td')!.textContent).toContain(tv('mlog.a_other'));
  });
});

describe("FE-S3-04 / S3-12 – check-out: a late surcharge needs the desk's decision", () => {
  afterEach(() => vi.useRealTimers());

  it('"Hoàn tất" is locked and says why until "đã báo khách" is ticked', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${todayLocal()}T14:05:00+07:00`));
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const time = await screen.findByLabelText(new RegExp(tv('checkout.departure_time')));
    fireEvent.change(time, { target: { value: '14:00' } });
    expect(
      await screen.findByRole('checkbox', { name: `${tv('ci.told_guest')} *` }),
    ).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    const done = await screen.findByRole('button', { name: /hoàn tất|Hoàn tất/ });
    expect(done).toHaveAttribute('aria-disabled', 'true');
    expect(done).toHaveAccessibleDescription(tv('ci.told_guest'));
    await user.click(screen.getByRole('button', { name: tv('common.back') }));
    await user.click(await screen.findByRole('checkbox', { name: `${tv('ci.told_guest')} *` }));
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    expect(await screen.findByRole('button', { name: /hoàn tất|Hoàn tất/ })).not.toHaveAttribute(
      'aria-disabled',
    );
  });
});

describe('UXD s3 E.1 – bill line labels (closed `bill.line.*`, variants) and new error codes', () => {
  const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
  const en = (k: string, a?: Record<string, string | number>) => translate('en', k, a);
  const line = (labelKey: string, labelParams?: Record<string, string | number>) =>
    ({
      id: 'l1',
      category: 'room',
      description: 'room_night',
      quantity: 1,
      unitPriceVnd: 1,
      amountVnd: 1,
      lineState: 'posted',
      labelKey,
      labelParams,
    }) as unknown as FolioLine;

  it('optional param present → variant key; absent → base key (never a bare {room})', () => {
    expect(lineLabel(t, line('bill.line.room_night', { date: '2026-10-20', room: '302' }))).toBe(
      t('bill.line.room_night_room', { date: '20/10', room: '302' }),
    );
    expect(lineLabel(t, line('bill.line.room_night', { date: '2026-10-20' }))).toBe(
      t('bill.line.room_night', { date: '20/10' }),
    );
    expect(lineLabel(t, line('bill.line.extra_person', { date: '2026-10-20', count: 2 }))).toBe(
      t('bill.line.extra_person_count', { date: '20/10', count: 2 }),
    );
    expect(lineLabel(t, line('bill.line.early_departure_fee', { noticeDays: 3 }))).toBe(
      t('bill.line.early_departure_fee_notice', { noticeDays: 3 }),
    );
  });

  it('{reason} is a code translated through foc.r_*; unknown code → base key; EN for the bill', () => {
    expect(lineLabel(t, line('bill.line.foc', { reason: 'regular_vip' }))).toBe(
      t('bill.line.foc_reason', { reason: t('foc.r_regular') }),
    );
    expect(lineLabel(t, line('bill.line.discount', { reason: 'nope' }))).toBe(
      t('bill.line.discount'),
    );
    expect(lineLabel(en, line('bill.line.room_change', { from: '101', to: '201' }))).toBe(
      en('bill.line.room_change', { from: '101', to: '201' }),
    );
  });

  it('the mock no longer emits keys outside the contract', () => {
    const keys = new Set<string>();
    for (const f of mockControl.stay.folios.values())
      for (const l of f.lines) if (l.labelKey) keys.add(l.labelKey);
    for (const k of keys) expect(k).toMatch(/^bill\.line\./);
    for (const k of keys)
      expect([
        'bill.line.charge',
        'bill.line.room_change_difference',
        'bill.line.deposit_forfeit',
      ]).not.toContain(k);
  });

  it('REFUND_SOURCE_NOT_RECONCILED: own sentence, {amount} = unreconciledVnd with unit', () => {
    const e = new ApiError(
      409,
      {
        type: 'about:blank',
        title: 'x',
        status: 409,
        code: 'REFUND_SOURCE_NOT_RECONCILED',
        requestId: 'r1',
        unreconciledVnd: 300_000,
        paymentIds: ['p1'],
      } as never,
      4,
    );
    expect(problemView(t, e).text).toBe(
      t('error.REFUND_SOURCE_NOT_RECONCILED', {
        amount: t('common.currency_vnd', { amount: '300.000' }),
      }),
    );
  });
});

describe('BUG-R2-052 (FE) – a 422 on a field without an input is named, not a bare "Bắt buộc"', () => {
  const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
  const v422 = (errors: Array<{ field: string; code: string }>) =>
    new ApiError(
      422,
      {
        type: 'about:blank',
        title: 'x',
        status: 422,
        code: 'VALIDATION_FAILED',
        requestId: 'r1',
        errors,
      } as never,
      4,
    );
  function Probe({ err }: { err: ApiError }) {
    const act = useSubmit({
      bound: ['checkinTimeNote'],
      labels: { addPriorNight: t('checkin.prior_night_submit') },
    });
    return (
      <>
        <button type="button" onClick={() => void act.submit(() => Promise.reject(err))}>
          go
        </button>
        {act.view()}
      </>
    );
  }
  const run = async (err: ApiError) => {
    const user = userEvent.setup();
    const view = render(
      <Providers>
        <Probe err={err} />
      </Providers>,
    );
    await user.click(screen.getByRole('button', { name: 'go' }));
    const text = (await screen.findByRole('alert')).textContent;
    view.unmount();
    return text;
  };

  it('unbound field → error.field_named; bound field → "Còn {n} ô cần sửa"; own sentence kept', async () => {
    expect(await run(v422([{ field: 'addPriorNight', code: 'REQUIRED' }]))).toContain(
      t('error.field_named', {
        label: t('checkin.prior_night_submit'),
        message: t('common.required'),
      }),
    );
    expect(await run(v422([{ field: 'checkinTimeNote', code: 'TIME_NOTE_REQUIRED' }]))).toContain(
      t('error.VALIDATION_FAILED', { n: 1 }),
    );
    expect(
      await run(v422([{ field: 'applyEarlySurcharge', code: 'SURCHARGE_DECISION_REQUIRED' }])),
    ).toContain(t('field.SURCHARGE_DECISION_REQUIRED'));
  });
});
