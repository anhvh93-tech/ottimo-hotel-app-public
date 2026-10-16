import { ApiError, type GuestSummary } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { fieldErrorText, fieldErrors, problemView } from '../app/problem';
import { Providers } from '../app/Providers';
import { GuestPicker } from '../components/GuestPicker';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { useSession } from '../session/SessionProvider';
import { renderApp, tv } from '../test/render';

const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
const problem = (status: number, code: string, requestId = 'req-1') =>
  new ApiError(status, { type: 'about:blank', title: code, status, code, requestId }, 4);

describe('ĐK-S2-3 / BUG-R2-026 – CONCURRENT_UPDATE, SERVICE_UNAVAILABLE (DS 6.21)', () => {
  it('both codes have their own sentence – never "Máy chủ đang gặp sự cố", no reference', () => {
    const busy = problemView(t, problem(503, 'SERVICE_UNAVAILABLE'));
    expect(busy.text).toBe(t('error.SERVICE_UNAVAILABLE'));
    expect(busy.reference).toBeUndefined();
    expect(problemView(t, problem(409, 'CONCURRENT_UPDATE')).text).toBe(
      t('error.CONCURRENT_UPDATE'),
    );
  });

  it('unknown field codes fall back to field_error.generic, NOT_IN_LIST keeps its own text', () => {
    expect(fieldErrorText(t, { field: 'x', code: 'SOMETHING_NEW' })).toBe(t('field_error.generic'));
    expect(fieldErrorText(t, { field: 'x', code: 'NOT_IN_LIST' })).toBe(
      t('field_error.not_in_list'),
    );
    expect(fieldErrorText(t, { field: 'x', code: 'EVIDENCE_REQUIRED' })).toBe(
      t('field_error.evidence_required'),
    );
  });

  it('Sprint 3 money codes have their own sentences (UXD đợt 2)', () => {
    expect(problemView(t, problem(409, 'REFUND_DESTINATION_REQUIRED')).text).toBe(
      t('error.REFUND_DESTINATION_REQUIRED'),
    );
    const exceeds = new ApiError(422, {
      type: 'about:blank',
      title: 'v',
      status: 422,
      code: 'VALIDATION_FAILED',
      max: 1_200_000,
      errors: [
        { field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' },
        { field: 'overpaymentHandling', code: 'OVERPAYMENT_HANDLING_REQUIRED' },
      ],
    });
    expect(fieldErrors(t, exceeds)).toEqual({
      amountVnd: t('error.REFUND_EXCEEDS_APPROVED', {
        max: t('common.currency_vnd', { amount: '1.200.000' }),
      }),
      overpaymentHandling: t('error.OVERPAYMENT_HANDLING_REQUIRED'),
    });
  });

  const kim = () => mockControl.rsv.reservations.find((r) => r.guestName === 'Kim Seo-yeon')!;
  async function openExtend() {
    const seen: Array<{ key: string | null; ifMatch: string | null }> = [];
    server.use(
      http.post('*/v1/properties/:p/reservations/:r/actions/extend', ({ request }) => {
        seen.push({
          key: request.headers.get('idempotency-key'),
          ifMatch: request.headers.get('if-match'),
        });
        return undefined; // fall through to the mock handler
      }),
    );
    const { user } = renderApp(`/reservations/${kim().id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.extend') }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('extend.title', { room: '402', guest: 'Kim Seo-yeon' }),
    });
    const submit = await within(dlg).findByRole('button', { name: /^Gia hạn 1 đêm/ });
    return { user, dlg, submit, seen };
  }

  it('409 CONCURRENT_UPDATE: form kept, automatic resend with the SAME Idempotency-Key and If-Match', async () => {
    mockControl.failNext(
      /actions\/extend:POST$/,
      409,
      { code: 'CONCURRENT_UPDATE' },
      { 'retry-after': '0' },
    );
    const before = kim().departureDate;
    const { user, submit, seen } = await openExtend();
    await user.click(submit);
    await waitFor(() => expect(kim().departureDate).not.toBe(before));
    expect(seen).toHaveLength(2);
    expect(seen[0]!.key).toBeTruthy();
    expect(seen[1]).toEqual(seen[0]);
    expect(screen.queryByText(/Máy chủ đang gặp sự cố/)).toBeNull();
  });

  it('countdown on the button ("Tự thử lại sau {seconds} giây…"), "Thử lại ngay" sends at once', async () => {
    mockControl.failNext(
      /actions\/extend:POST$/,
      409,
      { code: 'CONCURRENT_UPDATE' },
      { 'retry-after': '8' },
    );
    const { user, dlg, submit, seen } = await openExtend();
    await user.click(submit);
    const notice = await within(dlg).findByRole('status');
    expect(notice).toHaveTextContent(t('error.CONCURRENT_UPDATE'));
    expect(within(dlg).getByRole('button', { name: /Tự thử lại sau [78] giây…/ })).toBeDisabled();
    await user.click(within(dlg).getByRole('button', { name: t('retry.now') }));
    await waitFor(() => expect(seen).toHaveLength(2));
    expect(seen[1]!.key).toBe(seen[0]!.key);
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Gia hạn ·/ })).not.toBeInTheDocument(),
    );
  });

  it('503 twice → gives up after one automatic retry with the reference; button becomes "Thử lại"', async () => {
    let n = 0;
    server.use(
      http.post('*/v1/properties/:p/reservations/:r/actions/extend', () => {
        n += 1;
        return HttpResponse.json(
          {
            type: 'about:blank',
            title: 'busy',
            status: 503,
            code: 'SERVICE_UNAVAILABLE',
            requestId: 'req-503',
          },
          {
            status: 503,
            headers: { 'content-type': 'application/problem+json', 'retry-after': '0' },
          },
        );
      }),
    );
    const { user, dlg, submit } = await openExtend();
    await user.click(submit);
    expect(
      await within(dlg).findByText(t('retry.gave_up_unavailable', { request_id: 'req-503' })),
    ).toBeInTheDocument();
    expect(n).toBe(2);
    expect(within(dlg).getByRole('button', { name: t('common.retry') })).toBeEnabled();
    expect(within(dlg).queryByText(/Máy chủ đang gặp sự cố/)).toBeNull();
  });

  it('GET 503 → error state with "Đang tải lại sau {seconds} giây…", then reloads itself once', async () => {
    mockControl.failNext(
      /registrations:GET$/,
      503,
      { code: 'SERVICE_UNAVAILABLE' },
      { 'retry-after': '1' },
    );
    renderApp('/registration', 'qa.fd');
    expect(
      await screen.findByText(new RegExp(t('retry.load_countdown', { seconds: 1 }))),
    ).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});

describe('DS 6.21 on H12 (báo giá) – same key on the automatic resend', () => {
  it('saveQuote 409 CONCURRENT_UPDATE → resent once with the same Idempotency-Key, quote saved', async () => {
    const keys: Array<string | null> = [];
    server.use(
      http.post('*/v1/properties/:p/quotes', ({ request }) => {
        keys.push(request.headers.get('idempotency-key'));
        return undefined;
      }),
    );
    mockControl.failNext(
      /\/quotes:POST$/,
      409,
      { code: 'CONCURRENT_UPDATE' },
      { 'retry-after': '0' },
    );
    const { user } = renderApp('/quotes', 'qa.sal');
    const item = await waitFor(() => {
      const li = screen
        .getAllByRole('listitem')
        .find((x) => x.querySelector('.roomno')?.textContent === '203');
      if (!li) throw new Error('203 not listed');
      return li;
    });
    await user.click(within(item).getByRole('button', { name: 'Báo giá' }));
    const dlg = await screen.findByRole('dialog', { name: 'Báo giá' });
    await within(dlg).findByText('Tổng tiền đơn');
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Hoàng Gia');
    await user.click(await screen.findByRole('option', { name: /Hoàng Gia Bảo/ }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    expect(await screen.findByRole('dialog', { name: /BG-000\d+/ })).toBeInTheDocument();
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
  });
});

describe('H04 – updateRoom warnings[] (0.3.6 A-39, ĐK-S2-2)', () => {
  it('stop-sale with future bookings is saved and warns with their count (not blocked)', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: 'Sửa 402' }));
    const dlg = await screen.findByRole('dialog', { name: /Sửa căn 402/ });
    await user.click(within(dlg).getByRole('switch'));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Sửa căn 402/ })).not.toBeInTheDocument(),
    );
    const warn = (await screen.findByText(t('rooms.future_keep', { n: 2 }))).closest('.alert')!;
    expect(warn).toHaveTextContent(t('rooms.saved', { room: '402' }));
  });
});

function PickerHarness({ onSelect }: { onSelect: (g: GuestSummary) => void }) {
  const s = useSession();
  if (s.status !== 'authenticated') return null;
  return <GuestPicker label="Khách đứng tên" onSelect={onSelect} />;
}

describe('BUG-R2-028 – quick-created guest keeps the phone', () => {
  it('the picked summary carries phoneMasked, so the booking form does not ask again', async () => {
    mockControl.signInAs('qa.fd');
    const picked: GuestSummary[] = [];
    const user = userEvent.setup();
    render(
      <Providers>
        <MemoryRouter>
          <PickerHarness onSelect={(g) => picked.push(g)} />
        </MemoryRouter>
      </Providers>,
    );
    await user.type(
      await screen.findByRole('combobox', { name: 'Khách đứng tên' }),
      'Khach Moi Tinh',
    );
    await user.click(await screen.findByRole('option', { name: /Tạo nhanh khách/ }));
    const dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    await user.type(within(dlg).getByLabelText(/Số điện thoại/), '0938 222 333');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu hồ sơ' }));
    await waitFor(() => expect(picked).toHaveLength(1));
    expect(picked[0]!.phoneMasked).toBe('0938***333');
  });
});
