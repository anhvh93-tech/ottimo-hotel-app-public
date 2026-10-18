// Sprint 4 – FE-A đợt 19: SEC FB-R2-SEC-BE-73 / ARC 16.22 – giấy tờ chính không phải "của người đặt". Đặt hộ: người
// đặt (X) ≠ người ở (Y). H14 nhập giấy tờ luôn chọn người (không mặc định người đặt); đồng ý gửi `partyMemberId` của
// đúng người. Giấy tờ và đồng ý của Y đi vào người ở Y, không vào X.
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);

describe('SEC BE-73 – đặt hộ: giấy tờ và đồng ý đi vào hồ sơ người ở, không vào người đặt', () => {
  it('H14: không chọn sẵn người đặt, phải chọn người; "Người ở chưa có trong đơn" → không gửi partyMemberId, giấy tờ thuộc người mới; đồng ý gửi partyMemberId của người ở', async () => {
    const r = res('Gia đình anh Hưng'); // booked by X for Y
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    const booker = mockControl.stay.party.get(r.id)![0]!;
    expect(booker.role).toBe('booker');
    const docsSent: Array<Record<string, unknown>> = [];
    const consentsSent: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      const path = new URL(request.url).pathname;
      if (request.method !== 'POST') return;
      if (/\/registrations\/[^/]+\/documents$/.test(path))
        void request
          .clone()
          .formData()
          .then((f) => docsSent.push(JSON.parse(String(f.get('data'))) as Record<string, unknown>));
      if (/\/registrations\/[^/]+\/consents$/.test(path))
        void request
          .clone()
          .json()
          .then((b: Record<string, unknown>) => consentsSent.push(b));
    };
    server.events.on('request:start', on);

    const { user, unmount } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await user.click(
      (await screen.findAllByRole('button', { name: tv('checkin.docs.manual') }))[0]!,
    );
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    const who = within(dlg).getByLabelText(label('reg.link.member'));
    // Nobody pre-selected, no booker's name typed for the desk.
    expect(who).toHaveValue('');
    expect(who).toBeRequired();
    expect(within(dlg).getByLabelText(label('checkin.docs.field.full_name'))).toHaveValue('');
    await user.type(within(dlg).getByLabelText(/^Số giấy tờ/), '079099887766');
    await user.type(
      within(dlg).getByLabelText(label('checkin.docs.field.full_name')),
      'Trần Văn Ý',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    expect(within(dlg).getByText(tv('reg.person_required'))).toBeInTheDocument();
    expect(docsSent).toHaveLength(0);
    await user.selectOptions(
      who,
      await within(dlg).findByRole('option', { name: tv('reg.person_not_in_party') }),
    );
    expect(within(dlg).getByRole('checkbox', { name: tv('reg.doc_is_main') })).toBeChecked();
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    await waitFor(() => expect(docsSent).toHaveLength(1));
    expect(docsSent[0]).not.toHaveProperty('partyMemberId');
    expect(docsSent[0]).toMatchObject({ isMain: true, fullNameOnDoc: 'Trần Văn Ý' });
    await waitFor(() => expect(reg.documents).toHaveLength(1));
    const doc = reg.documents[0]!;
    // The server made a person "from the ID": Y, not X.
    const guestY = mockControl.stay.party.get(r.id)!.find((m) => m.id === doc.partyMemberId)!;
    expect(guestY.displayName).toBe('Trần Văn Ý');
    expect(guestY.id).not.toBe(booker.id);
    unmount();

    // Image retention consent of Y's ID: Y's `partyMemberId`, never the booker's / the document's id.
    doc.imageIds = ['img-y'];
    reg.status = 'review';
    const view = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const notice = mockControl.stay.consentNotice!;
    const group = await screen.findByRole('group', {
      name: tv('reg2.consent_q', { days: notice.imageRetentionDays }),
    });
    await view.user.click(within(group).getByRole('radio', { name: tv('checkin.consent.no') }));
    await waitFor(() => expect(consentsSent).toHaveLength(1));
    server.events.removeListener('request:start', on);
    expect(consentsSent[0]).toMatchObject({ partyMemberId: guestY.id, decision: 'refused' });
    expect(doc.imageConsent).toBe('refused');
  });

  it('giấy tờ chưa gắn người: không ghi được đồng ý (partyMemberId bắt buộc) – nói rõ phải gắn người trước', async () => {
    const r = res('Gia đình anh Hưng');
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.status = 'review';
    reg.documents.push({
      id: 'doc-nobody',
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: 'Trần Văn Ý',
      nationalityCode: 'VNM',
      docNumber: '079099887766',
      imageIds: ['img-1'],
      imageConsent: 'not_recorded',
      captureMethod: 'scan',
      checks: [],
    });
    renderApp(`/registration/${reg.id}`, 'qa.fd');
    const notice = mockControl.stay.consentNotice!;
    const group = await screen.findByRole('group', {
      name: tv('reg2.consent_q', { days: notice.imageRetentionDays }),
    });
    expect(within(group).getByRole('radio', { name: tv('checkin.consent.yes') })).toBeDisabled();
    expect(within(group).getByText(tv('reg2.consent_needs_person'))).toBeInTheDocument();
  });
});

describe('SEC BE-73 – chọn người đặt (người đặt tự ở): gửi id đơn, không thêm người đi cùng', () => {
  it('chọn "· Người đứng tên" → partyMemberId = id đơn; danh sách đoàn không thừa người; đồng ý gửi id đơn', async () => {
    const r = res('Gia đình anh Hưng');
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    const before = mockControl.stay.party.get(r.id)!.length;
    const docsSent: Array<Record<string, unknown>> = [];
    const consentsSent: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      const path = new URL(request.url).pathname;
      if (request.method !== 'POST') return;
      if (/\/registrations\/[^/]+\/documents$/.test(path))
        void request
          .clone()
          .formData()
          .then((f) => docsSent.push(JSON.parse(String(f.get('data'))) as Record<string, unknown>));
      if (/\/registrations\/[^/]+\/consents$/.test(path))
        void request
          .clone()
          .json()
          .then((b: Record<string, unknown>) => consentsSent.push(b));
    };
    server.events.on('request:start', on);
    const { user, unmount } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await user.click(
      (await screen.findAllByRole('button', { name: tv('checkin.docs.manual') }))[0]!,
    );
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    await user.selectOptions(
      within(dlg).getByLabelText(label('reg.link.member')),
      await within(dlg).findByRole('option', { name: new RegExp(` · ${tv('rsv.booker')}$`) }),
    );
    // Picking the booker fills their name (the desk checks it against the ID).
    expect(within(dlg).getByLabelText(label('checkin.docs.field.full_name'))).toHaveValue(
      'Gia đình anh Hưng',
    );
    await user.type(within(dlg).getByLabelText(/^Số giấy tờ/), '079123456789');
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    await waitFor(() => expect(docsSent).toHaveLength(1));
    expect(docsSent[0]).toMatchObject({ partyMemberId: r.id });
    await waitFor(() => expect(reg.documents).toHaveLength(1));
    expect(reg.documents[0]!.partyMemberId).toBe(r.id);
    expect(mockControl.stay.party.get(r.id)!).toHaveLength(before);
    unmount();

    reg.documents[0]!.imageIds = ['img-booker'];
    reg.status = 'review';
    const view = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const notice = mockControl.stay.consentNotice!;
    const group = await screen.findByRole('group', {
      name: tv('reg2.consent_q', { days: notice.imageRetentionDays }),
    });
    await view.user.click(within(group).getByRole('radio', { name: tv('checkin.consent.yes') }));
    await waitFor(() => expect(consentsSent).toHaveLength(1));
    server.events.removeListener('request:start', on);
    expect(consentsSent[0]).toMatchObject({ partyMemberId: r.id, decision: 'granted' });
  });
});
