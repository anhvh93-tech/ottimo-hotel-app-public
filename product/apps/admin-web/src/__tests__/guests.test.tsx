import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../mocks/node';
import { renderApp } from '../test/render';
import { GuestPicker } from '../components/GuestPicker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Providers } from '../app/Providers';
import { mockControl } from '../mocks/handlers';
import { useSession } from '../session/SessionProvider';

function trackUrls() {
  const urls: string[] = [];
  server.events.on('request:start', ({ request }) => {
    urls.push(`${request.method} ${request.url}`);
  });
  return urls;
}

describe('H06 Khách hàng (US-071…073)', () => {
  it('accent-insensitive search: "do mai anh" finds Đỗ Mai Anh and Do Mai Anh (US-073 AC1)', async () => {
    const { user } = renderApp('/guests', 'qa.fd');
    expect(await screen.findByText('Tìm khách để bắt đầu')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'do mai anh');
    expect(await screen.findByText('Đỗ Mai Anh')).toBeInTheDocument();
    expect(screen.getByText('Do Mai Anh')).toBeInTheDocument();
    expect(screen.getByText('2 kết quả')).toBeInTheDocument();
  });

  it('a phone typed in search goes by POST lookup, never in the URL (SEC)', async () => {
    const urls = trackUrls();
    const { user } = renderApp('/guests', 'qa.fd');
    await user.type(await screen.findByRole('searchbox'), '0901 234 567');
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(urls.some((u) => u.startsWith('POST') && u.includes('/guests/lookup'))).toBe(true);
    expect(urls.some((u) => u.includes('0901'))).toBe(false);
  });

  it('empty result → empty state with create action', async () => {
    const { user } = renderApp('/guests', 'qa.fd');
    await user.type(await screen.findByRole('searchbox'), 'zzzz');
    expect(await screen.findByText('Chưa có khách nào khớp "zzzz"')).toBeInTheDocument();
  });

  it('create: name + one contact are required (US-071 AC1)', async () => {
    const { user } = renderApp('/guests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'Thêm khách' }));
    const dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    await user.click(within(dlg).getByRole('button', { name: 'Lưu hồ sơ' }));
    expect(within(dlg).getByText('Còn 2 ô cần sửa – xem dòng đỏ dưới từng ô.')).toBeInTheDocument();
    expect(within(dlg).getByText('Cần ít nhất SĐT hoặc email.')).toBeInTheDocument();
    await waitFor(() => expect(within(dlg).getByLabelText(/Họ và tên/)).toHaveFocus());
  });

  it('phone duplicate after normalisation is blocked on blur (US-072 AC1: +84 901234567 = 0901 234 567)', async () => {
    const { user } = renderApp('/guests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'Thêm khách' }));
    const dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    await user.type(within(dlg).getByLabelText(/Họ và tên/), 'Nguyen Van An');
    await user.type(within(dlg).getByLabelText(/Số điện thoại/), '+84 901234567');
    await user.tab();
    expect(await within(dlg).findByText(/Nguyễn Văn An \(KH-0003\)/)).toBeInTheDocument();
    expect(within(dlg).getByRole('button', { name: 'Lưu hồ sơ (đang trùng SĐT)' })).toBeDisabled();
    expect(within(dlg).getByRole('button', { name: 'Mở hồ sơ đã có' })).toBeInTheDocument();
  });

  it('server 409 DUPLICATE_GUEST (email) → alert + open existing profile', async () => {
    const { user } = renderApp('/guests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'Thêm khách' }));
    const dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    await user.type(within(dlg).getByLabelText(/Họ và tên/), 'Khách Mới');
    // Early lookup misses (e.g. race with another desk) – the server still blocks on save.
    server.use(
      http.post('*/v1/properties/:p/guests/lookup', () => HttpResponse.json({ matches: [] })),
    );
    await user.type(within(dlg).getByLabelText(/^Email/), 'AN.NGUYEN@example.com');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu hồ sơ' }));
    const alert = await within(dlg).findByText(/SĐT\/email này đã thuộc hồ sơ KH-0003/);
    expect(alert).toBeInTheDocument();
    await user.click(within(dlg).getAllByRole('button', { name: 'Mở hồ sơ đã có' })[0]!);
    expect(await screen.findByRole('dialog', { name: 'Hồ sơ KH-0003' })).toBeInTheDocument();
  });

  it('creates a profile and keeps no ID-number field (US-071 AC3)', async () => {
    const { user } = renderApp('/guests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'Thêm khách' }));
    const dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    expect(within(dlg).queryByLabelText(/CCCD|hộ chiếu|giấy tờ/i)).toBeNull();
    await user.type(within(dlg).getByLabelText(/Họ và tên/), 'Lê Thị Bình');
    await user.type(within(dlg).getByLabelText(/Số điện thoại/), '0938 111 222');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu hồ sơ' }));
    expect(await screen.findByText('Đã lưu hồ sơ KH-0022.')).toBeInTheDocument();
  });

  it('client validation: invalid phone, email and tax code are flagged before sending', async () => {
    const { user } = renderApp('/guests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'Thêm khách' }));
    const dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    await user.type(within(dlg).getByLabelText(/Họ và tên/), 'An 2');
    await user.type(within(dlg).getByLabelText(/Số điện thoại/), '912345678');
    await user.type(within(dlg).getByLabelText(/^Email/), 'abc@x');
    await user.type(within(dlg).getByLabelText(/Mã số thuế/), '123');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu hồ sơ' }));
    expect(
      within(dlg).getByText('Họ tên chỉ gồm chữ cái, dấu cách, dấu gạch ngang.'),
    ).toBeInTheDocument();
    expect(within(dlg).getByText(/Số nước ngoài cần bắt đầu bằng \+/)).toBeInTheDocument();
    expect(within(dlg).getByText('Email chưa đúng dạng, ví dụ ten@gmail.com.')).toBeInTheDocument();
    expect(within(dlg).getByText('Mã số thuế gồm 10 hoặc 13 chữ số.')).toBeInTheDocument();
  });

  it('sale sees a reduced form (no birth date, company, tax code, internal note – x-visible-to)', async () => {
    const { user } = renderApp('/guests', 'qa.sal');
    await user.click(await screen.findByRole('button', { name: 'Thêm khách' }));
    const dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    expect(within(dlg).queryByLabelText(/Ngày sinh/)).toBeNull();
    expect(within(dlg).queryByLabelText(/Mã số thuế/)).toBeNull();
    expect(within(dlg).queryByLabelText(/Ghi chú nội bộ/)).toBeNull();
    expect(within(dlg).getByLabelText(/Nhóm khách/)).toBeInTheDocument();
  });

  it('sale meeting another seller\'s customer gets "possible duplicate" without names (exists_only_or_own)', async () => {
    const { user } = renderApp('/guests', 'qa.sal');
    await user.click(await screen.findByRole('button', { name: 'Thêm khách' }));
    const dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    await user.type(within(dlg).getByLabelText(/Số điện thoại/), '0905 123 456');
    await user.tab();
    expect(
      await within(dlg).findByText('SĐT/email này đã có hồ sơ. Nhờ lễ tân kiểm tra trước khi tạo.'),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(/Đỗ Mai Anh/)).toBeNull();
  });

  it('draft survives closing with "Đóng (giữ nháp)" (DS D5)', async () => {
    const { user } = renderApp('/guests', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: 'Thêm khách' }));
    let dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    await user.type(within(dlg).getByLabelText(/Họ và tên/), 'Phạm Nháp');
    await user.click(within(dlg).getByRole('button', { name: 'Đóng (giữ nháp)' }));
    await user.click(screen.getByRole('button', { name: 'Thêm khách' }));
    dlg = await screen.findByRole('dialog', { name: 'Hồ sơ khách mới' });
    expect(within(dlg).getByLabelText(/Họ và tên/)).toHaveValue('Phạm Nháp');
  });
});

function PickerHarness({ onSelect }: { onSelect: (name: string) => void }) {
  const s = useSession();
  if (s.status !== 'authenticated') return null;
  return <GuestPicker label="Khách đứng tên" onSelect={(g) => onSelect(g.displayName)} />;
}

describe('GuestPicker (US-073, shared)', () => {
  it('combobox: type, arrow, Enter selects; last option is quick create', async () => {
    mockControl.signInAs('qa.fd');
    const picked: string[] = [];
    const user = userEvent.setup();
    render(
      <Providers>
        <MemoryRouter>
          <PickerHarness onSelect={(n) => picked.push(n)} />
        </MemoryRouter>
      </Providers>,
    );
    const box = await screen.findByRole('combobox', { name: 'Khách đứng tên' });
    await user.type(box, 'do mai');
    const list = await screen.findByRole('listbox');
    expect(within(list).getAllByRole('option')).toHaveLength(3);
    expect(within(list).getByText('Tạo nhanh khách "do mai"')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(picked).toEqual(['Do Mai Anh']);
  });
});
