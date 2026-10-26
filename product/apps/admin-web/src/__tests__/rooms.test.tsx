import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp } from '../test/render';

/** Every PATCH /rooms/{id} body, as the browser sent it. */
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

async function openRoom(user: ReturnType<typeof renderApp>['user'], no: string) {
  await user.click(await screen.findByRole('button', { name: `Sửa ${no}` }));
  return screen.findByRole('dialog', { name: new RegExp(`Sửa căn ${no}`) });
}

describe('H04 Danh mục căn (US-004, ESC-014)', () => {
  it('lists 10 units with standard / maximum occupancy and prices', async () => {
    renderApp('/settings/rooms', 'qa.owner');
    const row = (await screen.findByText('The Ivory')).closest('tr')!;
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(within(row).getByText('4')).toBeInTheDocument();
    expect(within(row).getByText('11.000.000')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(11);
  });

  it('maximum stepper only allows standard or standard + 1', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '302');
    expect(within(dlg).getByRole('button', { name: 'Tăng Tối đa' })).toBeDisabled();
    await user.click(within(dlg).getByRole('button', { name: 'Giảm Tối đa' }));
    expect(within(dlg).getByRole('button', { name: 'Giảm Tối đa' })).toBeDisabled();
    // Raising the standard moves the maximum to standard + 1.
    await user.click(within(dlg).getByRole('button', { name: 'Tăng Định mức' }));
    expect(
      within(within(dlg).getByRole('group', { name: 'Tối đa' })).getByText('5'),
    ).toBeInTheDocument();
  });

  it('CAPACITY_BELOW_BOOKINGS lists the bookings that block the change (409)', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '302');
    await user.click(within(dlg).getByRole('button', { name: 'Giảm Tối đa' }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    const alert = await within(dlg).findByRole('alert');
    expect(alert).toHaveTextContent('Chưa giảm tối đa xuống 3 được');
    expect(alert).toHaveTextContent('OTM-0152 · 15/10/2026 → 19/10/2026 · 4 khách');
  });

  it('MAX_OCCUPANCY_RANGE from the server is shown under the maximum', async () => {
    mockControl.failNext(/rooms\/.*:PATCH/, 422, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'maxOccupancy', code: 'MAX_OCCUPANCY_RANGE' }],
    });
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    await user.click(within(dlg).getByRole('switch'));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(
      await within(dlg).findByText('Tối đa chỉ được bằng định mức hoặc định mức + 1.'),
    ).toBeInTheDocument();
  });

  it('price change needs a reason; monthly change sends both prices, nightly untouched (FB-INV-005)', async () => {
    const cap = capturePatches();
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const monthly = within(dlg).getByLabelText('Giá tháng');
    const nightly = within(dlg).getByLabelText(/Giá đêm niêm yết/);
    expect(nightly).not.toHaveAttribute('readonly');
    expect(nightly).toHaveValue('667.000');
    await user.clear(monthly);
    await user.type(monthly, '9600000');
    // No ÷ 12: typing a monthly price never rewrites the nightly one (was 800.000).
    expect(nightly).toHaveValue('667.000');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await within(dlg).findByText('Ghi lý do (ít nhất 3 ký tự).')).toBeInTheDocument();
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Điều chỉnh mùa cao điểm');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByText('Đã lưu căn 101.')).toBeInTheDocument();
    await waitFor(() => expect(cap.sent).toHaveLength(1));
    cap.stop();
    expect(cap.sent[0]!.listPrice).toEqual({
      effectiveFrom: expect.any(String),
      monthlyListPriceVnd: 9_600_000,
      nightlyListPriceVnd: 667_000,
      reason: 'Điều chỉnh mùa cao điểm',
    });
    const row = screen.getByText('The Amber').closest('tr')!;
    expect(within(row).getByText('9.600.000')).toBeInTheDocument();
    expect(within(row).getByText('667.000')).toBeInTheDocument();
  });

  it('nightly price is entered on its own and saved as typed (FB-INV-005, BR-101 v0.4.7)', async () => {
    const cap = capturePatches();
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const nightly = within(dlg).getByLabelText(/Giá đêm niêm yết/);
    await user.clear(nightly);
    await user.type(nightly, '650000');
    await user.tab();
    expect(nightly).toHaveValue('650.000');
    expect(within(dlg).getByLabelText('Giá tháng')).toHaveValue('8.000.000');
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Giá chủ đầu tư nhập B2');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByText('Đã lưu căn 101.')).toBeInTheDocument();
    await waitFor(() => expect(cap.sent).toHaveLength(1));
    cap.stop();
    const lp = cap.sent[0]!.listPrice as Record<string, unknown>;
    expect(lp.monthlyListPriceVnd).toBe(8_000_000);
    expect(lp.nightlyListPriceVnd).toBe(650_000);
    expect(mockControl.db.rooms[0]!.currentListPrice?.nightlyListPriceVnd).toBe(650_000);
    const row = screen.getByText('The Amber').closest('tr')!;
    expect(within(row).getByText('650.000')).toBeInTheDocument();
  });

  it('nightly price errors stay at the field: empty, 0, not a whole thousand (BR-005)', async () => {
    const cap = capturePatches();
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const nightly = within(dlg).getByLabelText(/Giá đêm niêm yết/);
    await user.clear(nightly);
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Giá B2');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await within(dlg).findByText('Nhập số tiền lớn hơn 0.')).toBeInTheDocument();
    expect(nightly).toHaveAttribute('aria-invalid', 'true');

    await user.type(nightly, '0');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await within(dlg).findByText('Nhập số tiền lớn hơn 0.')).toBeInTheDocument();

    await user.clear(nightly);
    await user.type(nightly, '650500');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await within(dlg).findByText('Nhập số tròn nghìn, ví dụ 650.000.')).toBeInTheDocument();
    expect(cap.sent).toHaveLength(0);
    cap.stop();
  });

  it('nightly below monthly ÷ 30 shows a soft warning but still saves', async () => {
    const cap = capturePatches();
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const nightly = within(dlg).getByLabelText(/Giá đêm niêm yết/);
    await user.clear(nightly);
    // BR-101 v0.4.7 example: 260.000 < 8.000.000 ÷ 30 = 266.667 (shown rounded: 267.000)
    await user.type(nightly, '260000');
    expect(
      within(dlg).getByText('Giá đêm đang thấp hơn giá tháng chia 30 ngày (267.000 đ).', {
        exact: false,
      }),
    ).toBeInTheDocument();
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Giá thử');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByText('Đã lưu căn 101.')).toBeInTheDocument();
    await waitFor(() => expect(cap.sent).toHaveLength(1));
    cap.stop();
    expect((cap.sent[0]!.listPrice as Record<string, unknown>).nightlyListPriceVnd).toBe(260_000);
  });

  it('no soft warning at or above monthly ÷ 30 (267.000 for 8.000.000)', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const nightly = within(dlg).getByLabelText(/Giá đêm niêm yết/);
    await user.clear(nightly);
    await user.type(nightly, '267000');
    expect(within(dlg).queryByText(/thấp hơn giá tháng chia 30/)).toBeNull();
    await user.clear(nightly);
    await user.type(nightly, '266000');
    expect(within(dlg).getByText(/thấp hơn giá tháng chia 30/)).toBeInTheDocument();
  });

  it('server 422 on listPrice.nightlyListPriceVnd is shown under the nightly price', async () => {
    mockControl.failNext(/rooms\/.*:PATCH/, 422, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'listPrice.nightlyListPriceVnd', code: 'AMOUNT_NOT_POSITIVE' }],
    });
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const nightly = within(dlg).getByLabelText(/Giá đêm niêm yết/);
    await user.clear(nightly);
    await user.type(nightly, '700000');
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Giá B2');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(nightly).toHaveAttribute('aria-invalid', 'true'));
  });

  it('412 VERSION_CONFLICT keeps the input and offers reload', async () => {
    mockControl.db.rooms[0]!.version = 7; // someone else saved in between
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    mockControl.db.rooms[0]!.version = 1;
    const dlg = await openRoom(user, '101');
    mockControl.db.rooms[0]!.version = 2;
    await user.click(within(dlg).getByRole('switch'));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await within(dlg).findByText(/vừa được người khác thay đổi/)).toBeInTheDocument();
    expect(within(dlg).getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('front desk sees the catalog read-only (rbac 25a)', async () => {
    renderApp('/settings/rooms', 'qa.fd');
    expect(await screen.findByText('The Ivory')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Sửa/ })).toBeNull();
    expect(screen.getByText(/Chỉ chủ đầu tư và quản lý sửa được/)).toBeInTheDocument();
  });

  it('500 on load → error state with Thử lại and the reference code', async () => {
    mockControl.failNext(/rooms:GET/, 500, { code: 'INTERNAL_ERROR', requestId: 'req-abc' });
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    expect(await screen.findByText('Chưa tải được danh mục căn')).toBeInTheDocument();
    expect(screen.getByText(/req-abc/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('The Ivory')).toBeInTheDocument();
  });
});
