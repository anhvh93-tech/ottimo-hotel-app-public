import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

/**
 * R3 Sprint 1 FE-B – S35 "Yêu cầu từ website" (US-155 AC2, AC6, AC8 Desk part; R3-Q06) on the MSW mock of
 * OpenAPI 0.3.7 bổ sung 2 / 0.3.8: queue, scope by role, contact rules (SEC ARC-19/21), SM-18 actions, decline
 * reasons, conflicts, and the form switch `public_booking_requests_enabled` (US-155 AC4).
 */
const req = (code: string) => mockControl.webRequests.requests.find((r) => r.refCode === code)!;
const rowOf = (code: string) => screen.getByRole('button', { name: code }).closest('tr')!;

describe('S35 queue', () => {
  it('FD sees open requests (new first), source "Website · Facebook", no name or phone in the list', async () => {
    renderApp('/website-requests', 'qa.fd');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    const codes = screen
      .getAllByRole('row')
      .slice(1)
      .map((tr) => within(tr).getAllByRole('button')[0]!.textContent);
    expect(codes).toEqual(['W7K3QX9P', '7K3QX9MD', 'M2PN4R8T']);
    expect(
      within(rowOf('W7K3QX9P')).getByText(
        tv('webreq.source_with', { label: tv('webreq.source.facebook') }),
      ),
    ).toBeInTheDocument();
    expect(within(rowOf('W7K3QX9P')).getByText(/^Quá hạn/)).toBeInTheDocument();
    expect(screen.queryByText('Trần Linh')).not.toBeInTheDocument();
    expect(screen.queryByText(/905/)).not.toBeInTheDocument();
    // FD cannot read parameters → no claim about the form switch.
    expect(screen.queryByText(tv('webreq.form_off_title'))).not.toBeInTheDocument();
  });

  it('owner sees that the website form is off (US-155 AC4)', async () => {
    renderApp('/website-requests', 'qa.owner');
    expect(await screen.findByText(tv('webreq.form_off_title'))).toBeInTheDocument();
    expect(screen.getByText(tv('webreq.form_off_owner'))).toBeInTheDocument();
  });

  it('no banner when the form is on', async () => {
    mockControl.webRequests.formEnabled = true;
    renderApp('/website-requests', 'qa.mgr');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    expect(screen.queryByText(tv('webreq.form_off_title'))).not.toBeInTheDocument();
  });

  it('empty queue while the form is off says why', async () => {
    mockControl.webRequests.requests.splice(0);
    renderApp('/website-requests', 'qa.fdl');
    expect(await screen.findByText(tv('webreq.empty_form_off'))).toBeInTheDocument();
  });

  it('search takes only a full request code; dashes and lower case are fine', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    const box = screen.getByLabelText(new RegExp(`^${tv('webreq.search_label')}`));
    await user.type(box, 'W7K3');
    await user.click(screen.getByRole('button', { name: tv('webreq.search_btn') }));
    expect(screen.getByText(tv('webreq.search_hint'))).toBeInTheDocument();
    await user.clear(box);
    await user.type(box, 'h8tv-3k2c');
    await user.click(screen.getByRole('button', { name: tv('webreq.search_btn') }));
    expect(await screen.findByRole('button', { name: 'H8TV3K2C' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'W7K3QX9P' })).not.toBeInTheDocument();
  });

  it('status chips: closed requests show on demand', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    await user.click(screen.getByRole('button', { name: tv('webreq.status.declined') }));
    expect(await screen.findByRole('button', { name: 'H8TV3K2C' })).toBeInTheDocument();
  });

  it("sale sees unassigned new requests without contact, not other people's requests (SEC ARC-12, ARC-19)", async () => {
    const { user } = renderApp('/website-requests', 'qa.sal');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    expect(screen.queryByRole('button', { name: 'M2PN4R8T' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'W7K3QX9P' }));
    const dlg = await screen.findByRole('dialog');
    expect(await within(dlg).findByText(tv('webreq.pii_hidden_sal'))).toBeInTheDocument();
    expect(within(dlg).queryByText('Trần Linh')).not.toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('webreq.claim') }));
    expect(await within(dlg).findByText('Trần Linh')).toBeInTheDocument();
    expect(req('W7K3QX9P').assignedUserName).toBe('Sơn');
  });

  it('roles without S35 get "no access"', async () => {
    renderApp('/website-requests', 'qa.hk');
    expect(await screen.findByText(tv('shell.no_access_title'))).toBeInTheDocument();
  });
});

describe('S35 detail drawer', () => {
  it('contact: copy + call from the E.164 phone, no Zalo deep link, the note stays plain text', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const dlg = await screen.findByRole('dialog');
    expect(await within(dlg).findByText('Trần Linh')).toBeInTheDocument();
    expect(within(dlg).getByText('+84 905 123 456')).toBeInTheDocument();
    expect(within(dlg).getByRole('link', { name: tv('webreq.call') })).toHaveAttribute(
      'href',
      'tel:+84905123456',
    );
    const hrefs = within(dlg)
      .queryAllByRole('link')
      .map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.some((h) => /zalo/i.test(h))).toBe(false);
    expect(within(dlg).getByText(tv('webreq.own_account_hint'))).toBeInTheDocument();
  });

  it('a link in the message is never a link (SEC ARC-21)', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: '7K3QX9MD' }));
    const dlg = await screen.findByRole('dialog');
    const note = await within(dlg).findByText(/https:\/\/example\.com\/brief/);
    expect(note.tagName).toBe('P');
    expect(within(dlg).queryByRole('link', { name: /example\.com/ })).not.toBeInTheDocument();
    expect(within(dlg).getAllByText(tv('webreq.flag.contains_url')).length).toBeGreaterThan(0);
  });

  it('claim → in progress, assigned to me (WR1)', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const dlg = await screen.findByRole('dialog');
    await user.click(await within(dlg).findByRole('button', { name: tv('webreq.claim') }));
    await waitFor(() => expect(req('W7K3QX9P').status).toBe('in_progress'));
    expect(req('W7K3QX9P').assignedUserName).toBe('Hạnh');
    expect(
      await within(dlg).findByRole('button', { name: tv('webreq.release') }),
    ).toBeInTheDocument();
  });

  it('decline: reason required, "other" needs a note, suggested reply in the guest\'s language', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.decline') }));
    const dlg = (await screen.findAllByRole('dialog')).at(-1)!;
    const save = within(dlg).getByRole('button', { name: tv('webreq.decline_confirm') });
    expect(save).toBeDisabled();
    await user.click(
      within(dlg).getByRole('radio', { name: tv('webreq.decline.no_availability') }),
    );
    expect(within(dlg).getByText(/^Cảm ơn bạn đã gửi yêu cầu W7K3QX9P/)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('radio', { name: tv('webreq.decline.other') }));
    expect(save).toBeDisabled();
    await user.type(within(dlg).getByRole('textbox'), 'Khách hỏi chỗ cho thú cưng lớn');
    expect(save).toBeEnabled();
    await user.click(save);
    await waitFor(() => expect(req('W7K3QX9P').status).toBe('declined'));
    expect(req('W7K3QX9P').declineReasonCode).toBe('other');
    expect(req('W7K3QX9P').declineNote).toBe('Khách hỏi chỗ cho thú cưng lớn');
  });

  it('mark as spam asks first (US-135)', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: '7K3QX9MD' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.mark_spam') }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: tv('webreq.mark_spam') }));
    await waitFor(() => expect(req('7K3QX9MD').status).toBe('spam'));
  });

  it("releasing someone else's request asks first (FDL)", async () => {
    const { user } = renderApp('/website-requests', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: 'M2PN4R8T' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.release') }));
    const confirm = await screen.findByRole('alertdialog');
    expect(
      within(confirm).getByText(
        tv('webreq.release_other_title', { code: 'M2PN4R8T', name: 'Lan' }),
      ),
    ).toBeInTheDocument();
    await user.click(within(confirm).getByRole('button', { name: tv('webreq.release') }));
    await waitFor(() => expect(req('M2PN4R8T').status).toBe('new'));
  });

  it('someone else acted first → "already changed" and the drawer reloads (409/412)', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const dlg = await screen.findByRole('dialog');
    const claim = await within(dlg).findByRole('button', { name: tv('webreq.claim') });
    // Another desk picks it up meanwhile.
    const r = req('W7K3QX9P');
    r.status = 'in_progress';
    r.assignedUserId = mockControl.db.users.find((u) => u.username === 'qa.fdl')!.id;
    r.assignedUserName = 'Lan';
    r.version += 1;
    await user.click(claim);
    expect(await within(dlg).findByText(tv('webreq.already_changed'))).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(dlg).queryByRole('button', { name: tv('webreq.claim') }),
      ).not.toBeInTheDocument(),
    );
  });

  it('a converted request shows the booking and no contact', async () => {
    const r = req('W7K3QX9P');
    r.status = 'converted';
    r.reservationId = '0192a1b0-0000-7000-8000-000000000999';
    r.reservationCode = 'OTM-00212';
    r.piiPurgedAt = new Date().toISOString();
    delete r.guestName;
    delete r.phone;
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('webreq.status.converted') }));
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const dlg = await screen.findByRole('dialog');
    expect(await within(dlg).findByText('OTM-00212')).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('webreq.sec.contact'))).not.toBeInTheDocument();
    expect(within(dlg).queryByRole('button', { name: tv('webreq.claim') })).not.toBeInTheDocument();
  });

  it('quote from the request: same-contact profile suggested, linked quote, hold converts it (US-155 AC2)', async () => {
    // Dates with no booking on 203 in the EP02 seed.
    Object.assign(req('W7K3QX9P'), {
      arrival: addDays(todayLocal(), 40),
      departure: addDays(todayLocal(), 42),
    });
    const { user } = renderApp('/website-requests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
    const dlg = await screen.findByRole('dialog', { name: /Báo giá cho yêu cầu W7K3QX9P/ });
    // Seed guest KH-0012 has the same phone (0905 123 456) – suggested, never merged automatically.
    expect(await within(dlg).findByText(tv('webreq.contact_matches'))).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('webreq.pick') }));
    expect(within(dlg).getByText(tv('webreq.picked', { name: 'Đỗ Mai Anh' }))).toBeInTheDocument();
    const room = mockControl.db.rooms.find((r) => r.roomNo === '203')!;
    await user.selectOptions(within(dlg).getByLabelText(/^Căn/), room.id);
    expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    const send = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    const quote = mockControl.rsv.quotes.at(-1)!;
    expect((quote as unknown as { input: Record<string, unknown> }).input).toMatchObject({
      websiteBookingRequestId: req('W7K3QX9P').id,
      adults: 2,
      children6to11: 1,
    });
    expect(req('W7K3QX9P')).toMatchObject({ status: 'in_progress', quoteId: quote.id });
    await user.click(within(send).getByRole('button', { name: 'Khách đồng ý – Giữ chỗ' }));
    const hold = await screen.findByRole('dialog', { name: 'Giữ chỗ' });
    await user.click(within(hold).getByRole('button', { name: 'Tạo giữ chỗ' }));
    await waitFor(() => expect(req('W7K3QX9P').status).toBe('converted'));
    expect(req('W7K3QX9P').phone).toBeUndefined();
  });

  it('out of scope deep link → not found', async () => {
    renderApp(`/website-requests/${req('M2PN4R8T').id}`, 'qa.sal');
    expect(await screen.findByText(tv('webreq.not_found'))).toBeInTheDocument();
  });
});
