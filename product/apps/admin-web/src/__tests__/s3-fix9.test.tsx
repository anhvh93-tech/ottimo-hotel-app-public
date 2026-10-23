import { isIdempotencyKey } from '@ottimo/api-client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import type { MockLine, MockPayment } from '../mocks/stay';
import { renderApp, tv } from '../test/render';
import { pinDaytime } from '../test/clock';

/**
 * Vòng sửa 9 (QC gate S3 v2, UXR đi demo): each write step is clicked through the real Desk screens and
 * the request the API would receive is checked – CI used to call these steps through the API only.
 */
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const photo = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], 'anh.jpg', { type: 'image/jpeg' });
const label = (key: string, args?: Record<string, string | number>) =>
  new RegExp(`^${tv(key, args).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
const vnd = (amount: string) => tv('common.currency_vnd', { amount });

interface Sent {
  method: string;
  path: string;
  key: string | null;
  body?: unknown;
  form?: Array<{ name: string; isText: boolean; text?: string }>;
}
/** Every write the screens send, with its Idempotency-Key and (JSON or multipart) body. */
function recordWrites() {
  const sent: Sent[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'GET') return;
    const entry: Sent = {
      method: request.method,
      path: new URL(request.url).pathname,
      key: request.headers.get('idempotency-key'),
    };
    sent.push(entry);
    const type = request.headers.get('content-type') ?? '';
    const copy = request.clone();
    if (type.includes('multipart/form-data'))
      void copy.formData().then((f) => {
        entry.form = [...f.entries()].map(([name, v]) => ({
          name,
          isText: typeof v === 'string',
          text: typeof v === 'string' ? v : undefined,
        }));
      });
    else if (type.includes('json')) void copy.json().then((b: unknown) => (entry.body = b));
  });
  return sent;
}

describe('UXR #2 – ảnh đính kèm từ Desk dùng Idempotency-Key là UUID', () => {
  it('penalty with a photo: the upload key is a UUID of its own, the line carries the attachment', async () => {
    const sent = recordWrites();
    const r = res('Trần Thu Nga');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Trần Thu Nga' });
    await user.click(within(d).getByRole('button', { name: tv('stay.add_charge') }));
    const dlg = await screen.findByRole('dialog', { name: tv('stay.add_charge') });
    await user.selectOptions(
      await within(dlg).findByLabelText(label('stay.charge_item')),
      'SMOKING',
    );
    await user.upload(within(dlg).getByLabelText(label('stay.add_photo')), photo());
    await user.click(within(dlg).getByRole('button', { name: tv('stay.add_charge_submit') }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: tv('stay.add_charge') })).not.toBeInTheDocument(),
    );
    const upload = sent.find((s) => s.path.endsWith('/attachments'))!;
    const line = sent.find((s) => s.path.endsWith(`/folios/${r.folioId}/lines`))!;
    expect(isIdempotencyKey(upload.key!)).toBe(true);
    expect(isIdempotencyKey(line.key!)).toBe(true);
    expect(upload.key).not.toBe(line.key);
    await waitFor(() => expect(upload.form).toBeDefined());
    expect(upload.form).toEqual(
      expect.arrayContaining([
        { name: 'purpose', isText: true, text: 'penalty_evidence' },
        { name: 'reservationId', isText: true, text: r.id },
        expect.objectContaining({ name: 'file', isText: false }),
      ]),
    );
    expect((line.body as { evidenceAttachmentIds?: string[] }).evidenceAttachmentIds).toHaveLength(
      1,
    );
    expect(
      mockControl.stay.folios.get(r.folioId)!.lines.some((l) => l.category === 'penalty'),
    ).toBe(true);
  });

  it('bank-transfer refund: proof photo required, upload + payout both go through', async () => {
    const sent = recordWrites();
    const kim = res('Kim Seo-yeon');
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const card = (await screen.findByText(new RegExp(`^${kim.code} · 1.200.000`))).closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('refund.execute_transfer') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_transfer') });
    await user.type(within(dlg).getByLabelText(label('refund.bank_reference')), 'FT26001');
    const submit = within(dlg).getByRole('button', { name: tv('refund.execute_transfer') });
    // The API answers EVIDENCE_REQUIRED without the photo – the button says so before sending.
    expect(submit).toBeDisabled();
    await user.upload(within(dlg).getByLabelText(label('refund.proof')), photo());
    await user.click(submit);
    await waitFor(() =>
      expect(
        mockControl.stay.payments.some((p) => p.type === 'refund' && p.folioId === kim.folioId),
      ).toBe(true),
    );
    const keys = sent.filter((s) => s.key !== null).map((s) => s.key!);
    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(keys.every(isIdempotencyKey)).toBe(true);
  });
});

describe('UXR #3 – nhập tay giấy tờ: phần "data" là chuỗi, không phải tệp', () => {
  it('manual entry with a scan: data is a text part, images are files → saved', async () => {
    const sent = recordWrites();
    const r = res('Gia đình anh Hưng');
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await user.click(
      (await screen.findAllByRole('button', { name: tv('checkin.docs.manual') }))[0]!,
    );
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    // ARC 16.22 (SEC BE-73): a new ID always names its person – here the booker.
    await user.selectOptions(
      within(dlg).getByLabelText(new RegExp(`^${tv('reg.link.member')}`)),
      await within(dlg).findByRole('option', { name: new RegExp(` · ${tv('rsv.booker')}$`) }),
    );
    await user.type(within(dlg).getByLabelText(/^Số giấy tờ/), '079123456789');
    await user.upload(within(dlg).getByLabelText(label('checkin.docs.scan')), photo());
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    expect(
      await screen.findByText(tv('checkin.docs.progress', { have: 1, need: 4 })),
    ).toBeInTheDocument();
    const doc = sent.find((s) => s.path.endsWith('/documents'))!;
    await waitFor(() => expect(doc.form).toBeDefined());
    const data = doc.form!.find((p) => p.name === 'data')!;
    expect(data.isText).toBe(true);
    expect(JSON.parse(data.text!)).toMatchObject({ docType: 'cccd', docNumber: '079123456789' });
    expect(doc.form!.filter((p) => p.name === 'image').map((p) => p.isText)).toEqual([false]);
  });
});

describe('UXR #5 – hủy đơn được hoàn 100 % cọc', () => {
  it('≥ 7 days before arrival: the box says the full deposit is refunded, not "no money taken"', async () => {
    const r = res('Trần Quốc Bảo');
    r.arrivalDate = addDays(todayLocal(), 8);
    r.departureDate = addDays(todayLocal(), 11);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Trần Quốc Bảo' });
    await user.click(within(d).getByRole('button', { name: 'Hủy đơn' }));
    const box = await screen.findByRole('alertdialog');
    const fmt = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/');
    expect(
      await within(box).findByText(
        tv('confirm.cancel_booking.body_full_refund', {
          room: '402',
          from: fmt(r.arrivalDate),
          to: fmt(r.departureDate),
          refund: '900.000',
        }),
      ),
    ).toBeInTheDocument();
    expect(
      within(box).queryByText(/Đơn chưa thu tiền nên không có phí hủy hay khoản hoàn/),
    ).not.toBeInTheDocument();
  });
});

describe('UXR #6 – "Đã thu" trên chi tiết đơn là số tiền thật đã thu', () => {
  const paidRow = (d: HTMLElement) =>
    within(d).getByText(tv('drawer.folio.paid')).closest('tr') as HTMLElement;

  it('hold without a deposit → never "room − balance"; ARC 16.20: no "Đã thu"/"Còn phải thu" before a posted line, the deposit due instead', async () => {
    const r = res('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    void user;
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await within(d).findByText(tv('booking.summary.deposit'));
    expect(within(d).queryByText(tv('drawer.folio.paid'))).toBeNull();
    expect(within(d).queryByText(tv('drawer.folio.balance'))).toBeNull();
  });

  it('in house with an extra line and a payment → the folio paid amount (1.000.000)', async () => {
    const r = res('Phạm Huy');
    const folio = mockControl.stay.folios.get(r.folioId)!;
    folio.lines.push({
      id: '0192a1b0-0000-7000-8000-000000099001',
      category: 'early_checkin',
      description: 'early_checkin',
      quantity: 1,
      unitPriceVnd: 259_000,
      amountVnd: 259_000,
      lineState: 'posted',
      postedAt: new Date().toISOString(),
    } satisfies MockLine);
    mockControl.stay.payments.push({
      id: '0192a1b0-0000-7000-8000-000000099002',
      code: 'PT-0999',
      folioId: r.folioId,
      reservationCode: r.code,
      type: 'charge',
      method: 'cash',
      amountVnd: 1_000_000,
      status: 'succeeded',
      reconciliation: 'not_required',
      receivedAt: new Date().toISOString(),
      version: 1,
    } satisfies MockPayment);
    const room = folio.lines
      .filter((l) => l.category === 'room')
      .reduce((a, l) => a + l.amountVnd, 0);
    r.balanceDueVnd = room + 259_000 - 1_000_000;
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Phạm Huy' });
    await waitFor(() => expect(paidRow(d)).toHaveTextContent(/^Đã thu−1\.000\.000$/));
  });
});

describe('UXR #7 – thêm người vượt định mức khi khách đang ở', () => {
  const openParty = async (guest: string) => {
    const r = res(guest);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: guest });
    await user.click(within(d).getByRole('button', { name: tv('rsv.add_person') }));
    const dlg = await screen.findByRole('dialog', { name: tv('rsv.party') });
    const pick = async (q: string, name: RegExp) => {
      const box = within(dlg).getByRole('combobox', { name: /Khách đứng tên/ });
      // The picker closes its list 150 ms after a blur (the click on "Thêm vào đơn") – a person never
      // types that fast; let that timer pass first.
      await new Promise((done) => setTimeout(done, 200));
      await user.clear(box);
      await user.type(box, q);
      await user.click(await screen.findByRole('option', { name }));
    };
    return { r, user, dlg, pick };
  };

  it('within the standard occupancy → "no surcharge"; above it → the amount from the API, tick to add', async () => {
    pinDaytime(); // not a BR-010 night case – see test/clock.ts
    const sent = recordWrites();
    const { r, user, dlg, pick } = await openParty('Trần Thu Nga');
    const add = within(dlg).getByRole('button', { name: tv('rsv.add_submit') });

    await pick('Trần Thu', /Trần Thu Hà/);
    expect(await within(dlg).findByText(tv('party.surcharge_zero'))).toBeInTheDocument();
    await waitFor(() => expect(add).toBeEnabled());
    await user.click(add);
    expect(await screen.findByText(tv('common.saved'))).toBeInTheDocument();
    // The list reloads with the new person before the next one is picked.
    expect(await within(dlg).findByText('Khách đi cùng')).toBeInTheDocument();

    // Room 101: standard 2, the OTA priced 2 guests, 2 nights left → 150.000 × 2.
    await pick('do mai', /Đỗ Mai Anh/);
    expect(
      await within(dlg).findByText(
        tv('party.surcharge_line', { amount: vnd('300.000'), nights: 2 }),
      ),
    ).toBeInTheDocument();
    expect(add).toBeDisabled();
    expect(within(dlg).getByText(tv('party.surcharge_needs_confirm'))).toBeInTheDocument();
    await user.click(
      within(dlg).getByRole('checkbox', {
        name: tv('party.surcharge_confirm', { amount: vnd('300.000') }),
      }),
    );
    // S4-25 / BUG-R2-093: once the fee is confirmed the desk may also ask a waiver (off by default).
    expect(within(dlg).getByRole('switch', { name: tv('ci.ask_foc') })).not.toBeChecked();
    expect(add).toBeEnabled();
    await user.click(add);
    await waitFor(() =>
      expect(
        mockControl.stay.folios
          .get(r.folioId)!
          .lines.filter((l) => l.category === 'extra_person')
          .map((l) => l.amountVnd),
      ).toEqual([150_000, 150_000]),
    );
    const writes = sent.filter(
      (s) => s.path.endsWith('/party') && (s.body as { dryRun?: boolean })?.dryRun === false,
    );
    expect(writes.at(-1)!.body).toMatchObject({
      role: 'companion',
      effectiveFrom: todayLocal(),
      applyExtraPersonSurcharge: true,
      expectedSurchargeVnd: 300_000,
    });
  });

  it('422 SURCHARGE_DECISION_REQUIRED → this dialog’s sentence with the amount, then the box to tick', async () => {
    pinDaytime(); // not a BR-010 night case – see test/clock.ts
    const r = res('Trần Thu Nga');
    mockControl.stay.party.get(r.id)!.push({
      id: '0192a1b0-0000-7000-8000-000000099003',
      role: 'companion',
      displayName: 'Người Đi Cùng Một',
      priceAgeBand: 'adult',
    });
    // The preview misses the surcharge once (e.g. a rate changed in between) – the write still refuses.
    server.use(
      http.post(
        '*/v1/properties/:p/reservations/:r/party',
        () => HttpResponse.json({ requiredCount: 2, presentCount: 2, missingCount: 0, version: 1 }),
        { once: true },
      ),
    );
    const { user, dlg, pick } = await openParty('Trần Thu Nga');
    await pick('do mai', /Đỗ Mai Anh/);
    await within(dlg).findByText(tv('party.surcharge_zero'));
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.add_submit') }));
    expect(
      await within(dlg).findByText(tv('party.surcharge_required', { amount: vnd('300.000') })),
    ).toBeInTheDocument();
    expect(
      within(dlg).queryByText(tv('field.SURCHARGE_DECISION_REQUIRED')),
    ).not.toBeInTheDocument();
    const tick = await within(dlg).findByRole('checkbox', {
      name: tv('party.surcharge_confirm', { amount: vnd('300.000') }),
    });
    await user.click(tick);
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.add_submit') }));
    await waitFor(() =>
      expect(
        mockControl.stay.folios.get(r.folioId)!.lines.some((l) => l.category === 'extra_person'),
      ).toBe(true),
    );
  });
});

describe('UXR #8 – quản lý chi khoản hoàn chính mình đã duyệt', () => {
  it('403 SELF_REFUND_FORBIDDEN → says why and who can pay, not "Máy chủ đang gặp sự cố"', async () => {
    const kim = res('Kim Seo-yeon');
    const mgr = mockControl.db.users.find((u) => u.username === 'qa.mgr')!;
    mockControl.stay.approvals.find((a) => a.amountVnd === 1_200_000)!.approverUserId = mgr.id;
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const card = (await screen.findByText(new RegExp(`^${kim.code} · 1.200.000`))).closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('refund.execute_transfer') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_transfer') });
    await user.type(within(dlg).getByLabelText(label('refund.bank_reference')), 'FT26002');
    await user.upload(within(dlg).getByLabelText(label('refund.proof')), photo());
    await user.click(within(dlg).getByRole('button', { name: tv('refund.execute_transfer') }));
    expect(
      await within(dlg).findByText(tv('refund.self_execute_forbidden_transfer')),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(/Máy chủ đang gặp sự cố/)).not.toBeInTheDocument();
    expect(mockControl.stay.payments.some((p) => p.type === 'refund')).toBe(false);
  });
});

describe('UXR #9 – không còn ký hiệu thô trong câu báo', () => {
  it('new booking on a room under repair: the banner names the room and the dates', async () => {
    server.use(
      http.post('*/v1/properties/:p/reservations', () =>
        HttpResponse.json(
          {
            type: '/problems/room-blocked',
            title: 'ROOM_BLOCKED',
            status: 409,
            code: 'ROOM_BLOCKED',
            requestId: 'req-ooo',
            conflicts: [
              {
                roomNo: '201',
                nights: [addDays(todayLocal(), 2), addDays(todayLocal(), 3)],
                kind: 'ooo',
              },
            ],
          },
          { status: 409, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp('/rack', 'qa.fd');
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
    const dlg = await screen.findByRole('dialog', { name: /Đặt phòng mới/ });
    const room = within(dlg).getByLabelText(/^Căn/);
    await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
    await user.selectOptions(room, within(room).getByRole('option', { name: /^201 / }));
    fireEvent.change(within(dlg).getByLabelText('Ngày đến'), {
      target: { value: addDays(todayLocal(), 2) },
    });
    fireEvent.change(within(dlg).getByLabelText('Ngày đi'), {
      target: { value: addDays(todayLocal(), 4) },
    });
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Trần Minh');
    await user.click(await screen.findByRole('option', { name: /Trần Minh Khoa/ }));
    await waitFor(() => expect(within(dlg).getByText('Tổng tiền đơn')).toBeInTheDocument());
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    const fmt = (n: number) => addDays(todayLocal(), n).split('-').reverse().join('/');
    expect(
      await within(dlg).findByText(
        tv('error.ROOM_BLOCKED', { room: '201', from: fmt(2), to: fmt(4) }),
      ),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(/\{(room|from|to)\}/)).not.toBeInTheDocument();
  });
});
