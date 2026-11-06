/**
 * v1.0.5 V5-5C (PO quyết định 27, plan 4a T10; DOM FB-R5-DOM-FE-121-01): Desk là nơi duy nhất OTTIMO đổi giá căn,
 * nên ngăn kéo căn kiểm cả hai biên của `NIGHTLY_PRICE_UNUSUAL` trước khi gửi và đọc `warnings[]` sau khi lưu
 * (UXD `copy-v1.0.5.md` 9.3; OpenAPI 0.3.13 bổ sung 1; máy chủ ở PR #121).
 * - thấp: giá đêm × 30 < giá tháng; cao: giá đêm × 5 > giá tháng; đúng bằng biên thì không báo; không chặn lưu;
 * - đang có cảnh báo VÀ ô giá đã sửa → nút "Vẫn lưu giá này" (một lần bấm là xác nhận);
 * - `warnings[]` có `NIGHTLY_PRICE_UNUSUAL` → toast lưu thêm dòng cảnh báo, tông cảnh báo, không tự tắt.
 * Ví dụ giá tháng 8.500.000 (DOM 1.2 ý 6): đêm 2.800.000 → cao; 1.700.000 → đúng biên, không báo; 280.000 → thấp.
 * ARC FB-R5-ARC-BE-C1-01: mock trả `VALUE_OUT_OF_RANGE` cho giá ≤ 0 như máy chủ.
 */
import { I18nProvider } from '@ottimo/i18n';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '../app/toast';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];

function capturePatches() {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'PATCH' || !/\/rooms\/[^/]+$/.test(new URL(request.url).pathname))
      return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

async function openRoom(user: User, no: string) {
  await user.click(await screen.findByRole('button', { name: `Sửa ${no}` }));
  return screen.findByRole('dialog', { name: new RegExp(`Sửa căn ${no}`) });
}

const box = (dlg: HTMLElement, key: string) =>
  within(dlg).getByLabelText(new RegExp(`^${tv(key)}`)) as HTMLInputElement;

async function typePrices(user: User, dlg: HTMLElement, monthly: string, nightly: string) {
  await user.clear(box(dlg, 'rooms.col_month'));
  await user.type(box(dlg, 'rooms.col_month'), monthly);
  await user.clear(box(dlg, 'rooms.col_night'));
  await user.type(box(dlg, 'rooms.col_night'), nightly);
}

const HIGH = tv('rooms.night_high', { month: '8.500.000' });
const LOW_STEM = tv('rooms.night_low', { perDay: '' }).split('(')[0]!;

describe('V5-5C ngăn kéo căn – hai biên trước khi gửi', () => {
  it('cao: 2.800.000 × 5 > 8.500.000 → câu biên trên, nút "Vẫn lưu giá này", lưu → toast thêm dòng cảnh báo', async () => {
    const cap = capturePatches();
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    await typePrices(user, dlg, '8500000', '2800000');
    const alert = within(dlg).getByText(HIGH);
    expect(alert.closest('.alert')).toHaveClass('warn');
    expect(within(dlg).queryByText(LOW_STEM, { exact: false })).toBeNull();
    expect(within(dlg).queryByRole('button', { name: tv('common.save') })).toBeNull();
    const save = within(dlg).getByRole('button', { name: tv('rooms.save_unusual_price') });
    // The warning is the description of the confirm button (screen readers hear why it changed).
    expect(save).toHaveAccessibleDescription(HIGH);
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Giá thử');
    await user.click(save);
    expect(await screen.findByText(tv('rooms.saved', { room: '101' }))).toBeInTheDocument();
    const line = await screen.findByText(tv('rooms.warn.nightly_price_unusual'));
    expect(line.closest('.toast')).toHaveClass('toast-warn');
    await waitFor(() => expect(cap.sent).toHaveLength(1));
    cap.stop();
    expect(cap.sent[0]!.listPrice).toMatchObject({
      monthlyListPriceVnd: 8_500_000,
      nightlyListPriceVnd: 2_800_000,
    });
  });

  it('đúng biên trên: 1.700.000 × 5 = 8.500.000 → không báo, nút "Lưu", toast thường', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    await typePrices(user, dlg, '8500000', '1700000');
    expect(within(dlg).queryByText(HIGH)).toBeNull();
    expect(within(dlg).queryByText(LOW_STEM, { exact: false })).toBeNull();
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Giá thử');
    await user.click(within(dlg).getByRole('button', { name: tv('common.save') }));
    const saved = await screen.findByText(tv('rooms.saved', { room: '101' }));
    expect(saved.closest('.toast')).not.toHaveClass('toast-warn');
    expect(screen.queryByText(tv('rooms.warn.nightly_price_unusual'))).toBeNull();
  });

  it('thấp: 280.000 × 30 < 8.500.000 → câu biên dưới ({perDay} = 283.000); 1 đồng trên biên dưới thì không báo', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    await typePrices(user, dlg, '8500000', '280000');
    expect(within(dlg).getByText(tv('rooms.night_low', { perDay: '283.000' }))).toBeInTheDocument();
    expect(within(dlg).queryByText(HIGH)).toBeNull();
    expect(
      within(dlg).getByRole('button', { name: tv('rooms.save_unusual_price') }),
    ).toBeInTheDocument();
    // 8.400.000 ÷ 30 = 280.000 exactly → on the bound, no warning.
    await typePrices(user, dlg, '8400000', '280000');
    expect(within(dlg).queryByText(LOW_STEM, { exact: false })).toBeNull();
    expect(within(dlg).getByRole('button', { name: tv('common.save') })).toBeInTheDocument();
  });

  it('giá cũ vốn khác thường, chỉ sửa tên căn → khung vẫn hiện, nút vẫn là "Lưu"', async () => {
    const r101 = mockControl.db.rooms.find((r) => r.roomNo === '101')!;
    r101.currentListPrice = {
      ...r101.currentListPrice!,
      monthlyListPriceVnd: 8_500_000,
      nightlyListPriceVnd: 2_800_000,
    };
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    expect(within(dlg).getByText(HIGH)).toBeInTheDocument();
    const name = within(dlg).getByLabelText(/^Tên căn/);
    await user.clear(name);
    await user.type(name, 'The Oak');
    expect(within(dlg).getByRole('button', { name: tv('common.save') })).toBeEnabled();
    expect(within(dlg).queryByRole('button', { name: tv('rooms.save_unusual_price') })).toBeNull();
  });
});

describe('V5-5C sau khi lưu – warnings[] của máy chủ', () => {
  it('máy chủ cảnh báo dù Desk không thấy → toast lưu thêm dòng cảnh báo', async () => {
    server.use(
      http.patch('*/v1/properties/:pid/rooms/:rid', async ({ request, params }) => {
        const room = mockControl.db.rooms.find((r) => r.id === params.rid)!;
        const body = (await request.json()) as { listPrice?: Record<string, number | string> };
        return HttpResponse.json(
          {
            ...room,
            version: room.version + 1,
            currentListPrice: body.listPrice ?? room.currentListPrice,
            warnings: [{ code: 'NIGHTLY_PRICE_UNUSUAL' }],
          },
          { headers: { etag: `"${room.version + 1}"` } },
        );
      }),
    );
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    await typePrices(user, dlg, '8500000', '900000');
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Giá thử');
    await user.click(within(dlg).getByRole('button', { name: tv('common.save') }));
    expect(await screen.findByText(tv('rooms.warn.nightly_price_unusual'))).toBeInTheDocument();
    expect(screen.getByText(tv('rooms.saved', { room: '101' }))).toBeInTheDocument();
  });

  it('ARC FB-R5-ARC-BE-C1-01: mock trả VALUE_OUT_OF_RANGE cho giá ≤ 0 (như máy chủ, T1A-3)', async () => {
    mockControl.signInAs('qa.owner');
    const room = mockControl.db.rooms.find((r) => r.roomNo === '101')!;
    const res = await fetch(`http://localhost/v1/properties/${PROPERTY_ID}/rooms/${room.id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': mockControl.db.csrf,
        'if-match': `"${room.version}"`,
      },
      body: JSON.stringify({
        listPrice: {
          effectiveFrom: '2099-01-01',
          monthlyListPriceVnd: 0,
          nightlyListPriceVnd: 0,
          reason: 'Giá thử',
        },
      }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { errors: Array<{ field: string; code: string }> };
    expect(body.errors).toEqual(
      expect.arrayContaining([
        { field: 'listPrice.monthlyListPriceVnd', code: 'VALUE_OUT_OF_RANGE' },
        { field: 'listPrice.nightlyListPriceVnd', code: 'VALUE_OUT_OF_RANGE' },
      ]),
    );
    expect(JSON.stringify(body)).not.toContain('AMOUNT_NOT_POSITIVE');
  });
});

describe('V5-5C toast có dòng cảnh báo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function Caller() {
    const toast = useToast();
    return (
      <>
        <button type="button" onClick={() => toast('Plain saved')}>
          plain
        </button>
        <button type="button" onClick={() => toast('Saved with check', { warn: 'Check this' })}>
          warn
        </button>
      </>
    );
  }

  it('toast thường tự tắt sau vài giây; toast có cảnh báo ở lại tới khi bấm đóng', () => {
    vi.useFakeTimers();
    render(
      <I18nProvider>
        <ToastProvider>
          <Caller />
        </ToastProvider>
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'plain' }));
    fireEvent.click(screen.getByRole('button', { name: 'warn' }));
    expect(screen.getByText('Plain saved')).toBeInTheDocument();
    expect(screen.getByText('Check this').closest('.toast')).toHaveClass('toast-warn');
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.queryByText('Plain saved')).toBeNull();
    const warn = screen.getByText('Check this').closest('.toast') as HTMLElement;
    expect(within(warn).getByText('Saved with check')).toBeInTheDocument();
    fireEvent.click(within(warn).getByRole('button', { name: tv('common.close') }));
    expect(screen.queryByText('Check this')).toBeNull();
  });
});
