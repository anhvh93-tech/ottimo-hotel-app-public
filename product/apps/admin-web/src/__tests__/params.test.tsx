import { translate } from '@ottimo/i18n';
import { paramLabel } from '../pages/paramCatalog';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

async function edit(user: ReturnType<typeof renderApp>['user'], label: string) {
  await user.click(await screen.findByRole('button', { name: `Sửa: ${label}` }));
  return screen.findByRole('dialog', { name: `Sửa: ${label}` });
}

describe('H05 Tham số quy tắc (US-005)', () => {
  it('groups parameters in tabs; hold hours uses the allowed options', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    expect(
      await screen.findByRole('tab', { name: 'Giữ chỗ, cọc, hủy', selected: true }),
    ).toBeInTheDocument();
    const dlg = await edit(user, 'Hạn giữ chỗ mặc định');
    await user.click(within(dlg).getByRole('button', { name: '48 giờ' }));
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Mùa cao điểm');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByText(/Đã lưu Hạn giữ chỗ mặc định/)).toBeInTheDocument();
    const row = screen.getByText('Hạn giữ chỗ mặc định').closest('tr')!;
    expect(within(row).getByText('48 giờ')).toBeInTheDocument();
  });

  it('PARAM_OUT_OF_RANGE from the server shows the bounds under the value', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const dlg = await edit(user, 'Hiệu lực báo giá');
    const value = within(dlg).getByLabelText(/Giá trị mới/);
    await user.clear(value);
    await user.type(value, '40');
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Thử biên');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await within(dlg).findByText('Giá trị phải từ 1 đến 30.')).toBeInTheDocument();
  });

  it('security parameters: owner edits within hard bounds (client check first)', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await user.click(await screen.findByRole('tab', { name: 'Bảo mật' }));
    // FB-R2-UXD-FE-03: human label from params.k.* instead of the technical key.
    const dlg = await edit(user, 'Thời gian xem giấy tờ sau khi nhập lại mật khẩu');
    const value = within(dlg).getByLabelText(/Giá trị mới/);
    await user.clear(value);
    await user.type(value, '60');
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Thử');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(within(dlg).getAllByText('Giá trị phải từ 1 đến 15.').length).toBeGreaterThan(0);
  });

  it('reason is required and the effective date cannot be in the past', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const dlg = await edit(user, 'Cọc ngắn ngày');
    const d = within(dlg).getByLabelText(/Hiệu lực từ/);
    await user.clear(d);
    await user.type(d, '2020-01-01');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await within(dlg).findByText('Ghi lý do (ít nhất 3 ký tự).')).toBeInTheDocument();
    expect(within(dlg).getByLabelText(/Hiệu lực từ/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('manager: owner-only rows (security, FOC) are view-only', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.mgr');
    await user.click(await screen.findByRole('tab', { name: 'Bảo mật' }));
    expect(screen.queryByRole('button', { name: /^Sửa: / })).toBeNull();
    expect(screen.getAllByText('Chỉ xem – chủ đầu tư sửa').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('tab', { name: 'Giữ chỗ, cọc, hủy' }));
    expect(screen.getByRole('button', { name: 'Sửa: Hạn giữ chỗ mặc định' })).toBeInTheDocument();
  });

  it('front desk lead: whole screen read-only', async () => {
    renderApp('/settings/parameters', 'qa.fdl');
    expect(
      await screen.findByText('Bạn đang xem tham số. Chỉ chủ đầu tư và quản lý sửa được.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Sửa: / })).toBeNull();
  });

  it('tabs follow the APG keyboard pattern', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const first = await screen.findByRole('tab', { name: 'Giữ chỗ, cọc, hủy' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Số người & phụ thu' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Số người & phụ thu' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Mở danh mục căn' })).toBeInTheDocument();
  });
});

describe('paramLabel (FB-R2-UXD-FE-03)', () => {
  it('uses params.k.<key> (dots → _), the channel template, and the key only as last resort', () => {
    const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
    expect(paramLabel(t, 'checkin_time')).toBe('Giờ nhận phòng chuẩn');
    expect(paramLabel(t, 'foc_self_apply.front_desk.per_time')).toBe(
      'Lễ tân tự áp miễn phí (FOC) – mỗi lần',
    );
    expect(paramLabel(t, 'channel_commission_pct.agoda')).toBe('Phí kênh agoda');
    expect(paramLabel(t, 'brand_new_key')).toBe('brand_new_key');
  });
});
