import { ApiError } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { problemView } from '../app/problem';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

/**
 * R3 v1.0 FE-B – S35 finished against the US-155 contract (OpenAPI 0.3.7 bổ sung 2 / 0.3.8) on MSW while BE-D
 * rebuilds the server: menu number, "Cần chú ý" `website_request_new`, "Tạo đơn" (createReservation +
 * websiteBookingRequestId → WR6), erase at the sender's request (WR8, SEC ARC-16) + lookup by contact, and the
 * PUBLIC_FORM_NOT_READY sentence when the owner turns the website form on too early (SEC ARC-17).
 */
const req = (code: string) => mockControl.webRequests.requests.find((r) => r.refCode === code)!;
const navLink = () =>
  screen.getByRole('link', { name: new RegExp(`^${tv('nav.website_requests')}`) });

describe('menu number (US-155 v1.0)', () => {
  it('FD sees how many requests nobody picked up; claiming one lowers it', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    await waitFor(() =>
      expect(
        within(navLink()).getByText(tv('nav.website_requests_new', { n: '2' })),
      ).toBeInTheDocument(),
    );
    expect(within(navLink()).getByText('2')).toHaveAttribute('aria-hidden', 'true');
    await user.click(screen.getByRole('button', { name: 'W7K3QX9P' }));
    const dlg = await screen.findByRole('dialog');
    await user.click(await within(dlg).findByRole('button', { name: tv('webreq.claim') }));
    await waitFor(() =>
      expect(
        within(navLink()).getByText(tv('nav.website_requests_new', { n: '1' })),
      ).toBeInTheDocument(),
    );
  });

  it('no number when nothing is new; housekeeping has no such menu (no request made)', async () => {
    for (const r of mockControl.webRequests.requests) if (r.status === 'new') r.status = 'spam';
    renderApp('/website-requests', 'qa.fdl');
    await screen
      .findByText(tv('webreq.empty_filtered'), undefined, { timeout: 3000 })
      .catch(() => null);
    await waitFor(() => expect(navLink()).toBeInTheDocument());
    expect(within(navLink()).queryByText(/yêu cầu mới chưa ai nhận/)).not.toBeInTheDocument();
  });
});

describe('"Cần chú ý" website_request_new (US-155, BR-912)', () => {
  it('FD Today: one line for the 2 new requests, overdue → warning, opens the queue', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    const line = await screen.findByText(tv('attn.website_request_new', { n: 2 }));
    const row = line.closest('li')!;
    // Oldest new request is past its reply-by time → amber (warning), with the time as a sentence.
    expect(row.matches('.soon') || !!row.querySelector('.soon')).toBe(true);
    expect(within(row).getByText(/^Trả lời trước \d\d:\d\d$/)).toBeInTheDocument();
    await user.click(within(row).getByRole('link', { name: tv('today.open') }));
    expect(await screen.findByRole('button', { name: 'W7K3QX9P' })).toBeInTheDocument();
  });

  it('one new request → its code, no name or phone', async () => {
    req('7K3QX9MD').status = 'declined';
    renderApp('/today', 'qa.fdl');
    expect(
      await screen.findByText(tv('attn.website_request_new_one', { code: 'W7K3QX9P' })),
    ).toBeInTheDocument();
    expect(screen.queryByText('Trần Linh')).not.toBeInTheDocument();
  });
});

describe('"Tạo đơn" from a website request (US-155 AC2, WR6)', () => {
  it('FD: H09 prefilled with the dates, guests and source Website; the request becomes Booked', async () => {
    // Dates far enough ahead that room 201 is free in the seed.
    Object.assign(req('W7K3QX9P'), {
      arrival: addDays(todayLocal(), 40),
      departure: addDays(todayLocal(), 42),
    });
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(
      await within(drawer).findByRole('button', { name: tv('webreq.create_booking') }),
    );
    const dlg = await screen.findByRole('dialog', { name: /Đặt phòng cho yêu cầu W7K3QX9P/ });
    expect(within(dlg).getByText(tv('webreq.booking_hint'))).toBeInTheDocument();
    const r = req('W7K3QX9P');
    expect(within(dlg).getByLabelText('Ngày đến')).toHaveValue(r.arrival);
    expect(within(dlg).getByLabelText('Ngày đi')).toHaveValue(r.departure);
    // Same-contact profiles are only suggested (BR-951): staff check it is the same person, then choose.
    expect(await within(dlg).findByText(tv('webreq.contact_matches'))).toBeInTheDocument();
    const room = within(dlg).getByLabelText(/^Căn/);
    await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
    const option = within(room)
      .getAllByRole<HTMLOptionElement>('option')
      .find((o) => /^201 /.test(o.textContent ?? ''))!;
    await user.selectOptions(room, option);
    await user.click(within(dlg).getByRole('button', { name: tv('webreq.pick') }));
    expect(within(dlg).getByText(tv('webreq.picked', { name: 'Đỗ Mai Anh' }))).toBeInTheDocument();
    await waitFor(() => expect(within(dlg).getByText('Tổng tiền đơn')).toBeInTheDocument());
    await waitFor(() => expect(within(dlg).getByLabelText(/Số tiền đã nhận/)).not.toHaveValue(''));
    const before = mockControl.rsv.reservations.length;
    await user.click(within(dlg).getByRole('button', { name: tv('booking.create') }));
    await waitFor(() => expect(mockControl.rsv.reservations.length).toBe(before + 1));
    const created = mockControl.rsv.reservations.at(-1)!;
    expect(created.directSource).toBe('website');
    await waitFor(() => expect(req('W7K3QX9P').status).toBe('converted'));
    expect(req('W7K3QX9P').reservationId).toBe(created.id);
    expect(req('W7K3QX9P').guestName).toBeUndefined();
    expect(
      await screen.findByText(tv('webreq.converted_toast', { code: 'W7K3QX9P' })),
    ).toBeInTheDocument();
  });

  it('a long stay opens H10 (paper contract) for the request; sale has no "Tạo đơn"', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: '7K3QX9MD' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(
      await within(drawer).findByRole('button', { name: tv('webreq.create_booking') }),
    );
    expect(
      await screen.findByRole('dialog', { name: /Đặt phòng cho yêu cầu 7K3QX9MD/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('lsm.flag'))).toBeInTheDocument();
  });

  it('sale sees "Báo giá" but not "Tạo đơn" (createReservation is FD+)', async () => {
    const { user } = renderApp('/website-requests', 'qa.sal');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const dlg = await screen.findByRole('dialog');
    await user.click(await within(dlg).findByRole('button', { name: tv('webreq.claim') }));
    expect(
      await within(dlg).findByRole('button', { name: tv('webreq.quote') }),
    ).toBeInTheDocument();
    expect(
      within(dlg).queryByRole('button', { name: tv('webreq.create_booking') }),
    ).not.toBeInTheDocument();
  });
});

describe('erase at the sender’s request (WR8, SEC ARC-16)', () => {
  it('owner: same contact is checked – a different number is refused, the right one erases at once', async () => {
    const { user } = renderApp('/website-requests', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.erase') }));
    const dlg = await screen.findByRole('dialog', { name: /Xóa dữ liệu của yêu cầu W7K3QX9P/ });
    const go = within(dlg).getByRole('button', { name: tv('webreq.erase_confirm') });
    expect(go).toBeDisabled();
    await user.click(within(dlg).getByLabelText(tv('webreq.erase.same_contact')));
    const box = within(dlg).getByLabelText(new RegExp(`^${tv('webreq.erase_contact')}`));
    await user.type(box, '0912 000 000');
    await user.click(go);
    expect(await within(dlg).findByText(tv('field.CONTACT_MISMATCH'))).toBeInTheDocument();
    expect(req('W7K3QX9P').guestName).toBe('Trần Linh');
    await user.clear(box);
    await user.type(box, '0905 123 456');
    await user.click(go);
    expect(
      await screen.findByText(tv('webreq.erased_toast', { code: 'W7K3QX9P' })),
    ).toBeInTheDocument();
    const r = req('W7K3QX9P');
    expect(r.status).toBe('declined');
    expect(r.declineReasonCode).toBe('erased_on_request');
    expect(r.guestName).toBeUndefined();
    expect(r.phone).toBeUndefined();
    expect(within(drawer).queryByText('Trần Linh')).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole('button', { name: tv('webreq.reopen') }),
    ).not.toBeInTheDocument();
  });

  it('called back: only offered when the request has a phone; email request → contact check only', async () => {
    const { user } = renderApp('/website-requests', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: '7K3QX9MD' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.erase') }));
    const dlg = await screen.findByRole('dialog', { name: /Xóa dữ liệu của yêu cầu 7K3QX9MD/ });
    expect(within(dlg).queryByLabelText(tv('webreq.erase.called_back'))).not.toBeInTheDocument();
    await user.click(within(dlg).getByLabelText(tv('webreq.erase.same_contact')));
    await user.type(
      within(dlg).getByLabelText(new RegExp(`^${tv('webreq.erase_contact')}`)),
      'Anna.Keller@example.com',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('webreq.erase_confirm') }));
    await waitFor(() => expect(req('7K3QX9MD').piiPurgedAt).toBeTruthy());
  });

  it('FD and sale have no erase button (OWN/MGR/FDL only)', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const drawer = await screen.findByRole('dialog');
    await within(drawer).findByText('Trần Linh');
    expect(
      within(drawer).queryByRole('button', { name: tv('webreq.erase') }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('webreq.lookup') })).not.toBeInTheDocument();
  });

  it('lookup by contact (no code): the phone goes in the body, results open the drawer', async () => {
    const { user } = renderApp('/website-requests', 'qa.fdl');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    await user.click(screen.getByRole('button', { name: tv('webreq.lookup') }));
    const dlg = await screen.findByRole('dialog', { name: tv('webreq.lookup_title') });
    const box = within(dlg).getByLabelText(new RegExp(`^${tv('webreq.lookup_field')}`));
    await user.type(box, 'abc');
    await user.click(within(dlg).getByRole('button', { name: tv('webreq.lookup_btn') }));
    expect(within(dlg).getByText(tv('webreq.lookup_invalid'))).toBeInTheDocument();
    await user.clear(box);
    await user.type(box, '+84 905 123 456');
    await user.click(within(dlg).getByRole('button', { name: tv('webreq.lookup_btn') }));
    expect(await within(dlg).findByText(tv('webreq.lookup_found', { n: 1 }))).toBeInTheDocument();
    expect(window.location.search).not.toMatch(/905/);
    await user.click(within(dlg).getByRole('button', { name: 'W7K3QX9P' }));
    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByText('Trần Linh')).toBeInTheDocument();
  });

  it('lookup finds nothing for an unknown contact', async () => {
    const { user } = renderApp('/website-requests', 'qa.owner');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    await user.click(screen.getByRole('button', { name: tv('webreq.lookup') }));
    const dlg = await screen.findByRole('dialog', { name: tv('webreq.lookup_title') });
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${tv('webreq.lookup_field')}`)), {
      target: { value: 'nobody@example.com' },
    });
    await user.click(within(dlg).getByRole('button', { name: tv('webreq.lookup_btn') }));
    expect(await within(dlg).findByText(tv('webreq.lookup_none'))).toBeInTheDocument();
  });
});

describe('PUBLIC_FORM_NOT_READY (setParameter public_booking_requests_enabled – SEC ARC-17)', () => {
  it('names what is missing', () => {
    const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
    const e = new ApiError(422, {
      type: '/problems/public-form-not-ready',
      title: 'x',
      status: 422,
      code: 'PUBLIC_FORM_NOT_READY',
      missing: ['privacy_notice_en', 'form_signing_key'],
    } as never);
    const v = problemView(t, e);
    expect(v.text).toBe(
      t('error.PUBLIC_FORM_NOT_READY', {
        missing: `${t('webreq.missing.privacy_notice_en')}, ${t('webreq.missing.form_signing_key')}`,
      }),
    );
  });
});
