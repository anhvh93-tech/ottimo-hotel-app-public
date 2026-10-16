import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { renderApp } from '../test/render';

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

  it('price change needs a reason; nightly price is computed (BR-101) and saved', async () => {
    const { user } = renderApp('/settings/rooms', 'qa.owner');
    const dlg = await openRoom(user, '101');
    const monthly = within(dlg).getByLabelText('Giá tháng');
    await user.clear(monthly);
    await user.type(monthly, '9600000');
    expect(within(dlg).getByLabelText(/Giá đêm niêm yết/)).toHaveValue('800.000');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await within(dlg).findByText('Ghi lý do (ít nhất 3 ký tự).')).toBeInTheDocument();
    await user.type(within(dlg).getByLabelText(/Lý do đổi giá/), 'Điều chỉnh mùa cao điểm');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByText('Đã lưu căn 101.')).toBeInTheDocument();
    const row = screen.getByText('The Amber').closest('tr')!;
    expect(within(row).getByText('9.600.000')).toBeInTheDocument();
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
