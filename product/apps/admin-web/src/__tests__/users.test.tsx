import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { MOCK_PASSWORD } from '../mocks/seed';
import { renderApp } from '../test/render';

describe('H07 Người dùng & vai (US-002)', () => {
  it('owner changes roles with a consequence confirm (US-135); focus starts on the safe button', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: 'Sửa vai: Hạnh' }));
    const dlg = await screen.findByRole('dialog', { name: 'Vai của Hạnh' });
    expect(within(dlg).queryByText('Chủ đầu tư')).toBeNull();
    await user.click(within(dlg).getByRole('checkbox', { name: /Sale nội bộ/ }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu vai' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Đổi vai của Hạnh?' });
    expect(within(confirm).getByRole('button', { name: 'Không, quay lại' })).toHaveFocus();
    await user.click(within(confirm).getByRole('button', { name: 'Lưu vai' }));
    expect(await screen.findByText('Đã lưu thay đổi cho Hạnh.')).toBeInTheDocument();
    const row = screen.getByText('qa.fd').closest('tr')!;
    expect(within(row).getByText('Sale nội bộ')).toBeInTheDocument();
  });

  it('cannot save with no role', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: 'Sửa vai: Hạnh' }));
    const dlg = await screen.findByRole('dialog', { name: 'Vai của Hạnh' });
    await user.click(within(dlg).getByRole('checkbox', { name: /^Lễ tân Đặt phòng/ }));
    expect(within(dlg).getByRole('button', { name: 'Chọn ít nhất 1 vai' })).toBeDisabled();
  });

  it('reset password shows a one-time temporary password', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const row = (await screen.findByText('qa.fd')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Đặt lại mật khẩu' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Đặt lại mật khẩu',
      }),
    );
    const dlg = await screen.findByRole('dialog', { name: 'Mật khẩu tạm của Hạnh' });
    expect(within(dlg).getByText(/^[A-Za-z0-9]{14}$/)).toBeInTheDocument();
    expect(mockControl.db.users.find((u) => u.username === 'qa.fd')?.mustChangePassword).toBe(true);
  });

  it('lock account asks first, then shows "Đã khóa"', async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const row = (await screen.findByText('qa.sal')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Khóa tài khoản' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Khóa tài khoản',
      }),
    );
    expect(await within(row).findByText('Đã khóa')).toBeInTheDocument();
  });
});

describe('H07 Thiết bị được cấp (US-142)', () => {
  it('grant is locked until the checklist is done; then grants this device', async () => {
    const { user } = renderApp('/settings/devices', 'qa.owner');
    const btn = await screen.findByRole('button', {
      name: 'Cấp quyền thiết bị này (còn 4 mục kiểm)',
    });
    expect(btn).toBeDisabled();
    await user.type(screen.getByLabelText(/Tên máy/), 'Máy quầy 2');
    await user.click(screen.getByRole('checkbox', { name: 'Đội kỹ thuật đã kiểm máy này' }));
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu/), 'sai-mat-khau');
    await user.click(screen.getByRole('button', { name: 'Cấp quyền thiết bị này' }));
    expect(await screen.findByText('Mật khẩu hiện tại chưa đúng.')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu/), MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Cấp quyền thiết bị này' }));
    expect(await screen.findByText('Máy này đã được cấp quyền.')).toBeInTheDocument();
    expect(screen.getByText('Máy quầy đã cấp quyền')).toBeInTheDocument();
    expect(screen.getByText('Máy này')).toBeInTheDocument();
  });

  it('revoke asks with the consequence and focuses "Không, quay lại"', async () => {
    const { user } = renderApp('/settings/devices', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: 'Thu hồi: Laptop quản lý' }));
    const dlg = await screen.findByRole('alertdialog', {
      name: 'Thu hồi quyền của Laptop quản lý?',
    });
    expect(dlg).toHaveAccessibleDescription(/không xem được giấy tờ/);
    expect(within(dlg).getByRole('button', { name: 'Không, quay lại' })).toHaveFocus();
    await user.click(within(dlg).getByRole('button', { name: 'Thu hồi' }));
    expect(await screen.findByText('Đã thu hồi Laptop quản lý.')).toBeInTheDocument();
    const row = screen.getByText('Laptop quản lý').closest('tr')!;
    expect(within(row).getByText('Đã thu hồi')).toBeInTheDocument();
  });
});
