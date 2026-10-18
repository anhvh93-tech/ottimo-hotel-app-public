import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { hasSensitiveDigits, replyNoteErrors } from '../mocks/replyNote';
import { renderApp, tv } from '../test/render';

/**
 * Luật B-15 cho `replyNote` (EP14 v0.3 mục 4.4 – SEC C.6 V2 + bổ sung 18/10, BE-D FB-R2-SEC-BE-77): the MSW mock
 * refuses exactly what the server refuses, and the Desk shows the UXD hint (E14-13) under the reply box.
 */
const YEAR = 2026;
const check = (text: string, phone: string | null = null) =>
  replyNoteErrors(text, { publicPhone: phone, currentYear: YEAR }).map((e) => e.code);

describe('B-15 – mock rule = EP14 v0.3 table (accepted / blocked)', () => {
  const ACCEPTED = [
    'Xe đón lúc 15:30, giá 350.000 đ',
    '350.000đ',
    '350,000 VND',
    '350 000 ₫',
    '350000đ',
    'Tour 1.500.000 đồng/người',
    'Tổng 12.000.000 VNĐ',
    'Xe 4 chỗ 350.000đ, 7 chỗ 450.000đ',
    'Ngày 18-10-2026 xe đón 15:30',
    'Đón 18.10.2026 lúc 07:00',
    'Đón 18/10/2026',
    'Phòng 202, 2 khách',
    // SEC s7 (18/10): a list – comma / semicolon followed by a space.
    'Phòng 202, 203, 204',
    'Phòng 202; 203',
  ];
  const BLOCKED = [
    'Mã cửa 482913',
    '482 913',
    '482-913',
    '482.913',
    '482,913',
    'Mã cửa 482,913',
    '482913đ',
    '482.913 đ',
    'Mã ４８２９１３',
    '0912.345.678',
    '(+84) 912 345 678',
    'Gọi 0912 345 678 giá 350.000đ',
    '0912345678đ',
    // SEC s6 (18/10): `345.000đ` is the tail of a longer number – stays blocked.
    '0912.345.000đ',
    // SEC s7: no space after the comma, or spaces only – not a list.
    '202,203,204',
    'Phòng 202,203,204',
    '202 203 204',
    'Phòng 202 203 204',
    'CCCD 079123456789',
    '079 123 456 789 đ',
    'Ngày sinh 05-03-1990',
    '05.03.1990',
    '31-02-2026',
    'Mã 18.10.26',
    'giá 350.000',
    '12.345.678.901đ',
  ];
  it.each(ACCEPTED)('accepted: %s', (text) => expect(check(text)).toEqual([]));
  it.each(BLOCKED)('blocked: %s', (text) =>
    expect(check(text)).toEqual(['SENSITIVE_DATA_DETECTED']),
  );

  it('card numbers are checked first on the original text (V-09)', () => {
    expect(check('Thẻ 4111 1111 1111 1111')).toEqual(['CARD_NUMBER_DETECTED']);
  });

  it("the property's public hotline passes in any spelling (last 9 digits), another number does not", () => {
    const hotline = '0263 3 888 999';
    for (const text of ['Gọi 0263 3888 999', 'Gọi +84 263 3888 999', 'Gọi 842633888999'])
      expect(hasSensitiveDigits(text, hotline, YEAR), text).toBe(false);
    expect(hasSensitiveDigits('Gọi 0263 3888 998', hotline, YEAR)).toBe(true);
  });
});

describe('B-15 – Desk reply box (H03 "Không thực hiện được")', () => {
  const declineDialog = async (user: ReturnType<typeof renderApp>['user']) => {
    const card = await screen.findByRole('region', { name: `${tv('today.requests')} (3)` });
    const row = (await within(card).findByText(tv('guest.req.transport'))).closest('li')!;
    await user.click(within(row).getByRole('button', { name: tv('guest.req.status.declined') }));
    const dlg = await screen.findByRole('dialog');
    await user.click(within(dlg).getByRole('radio', { name: tv('guest.req.decline.other') }));
    return dlg;
  };
  const transport = () => mockControl.ops.requests.find((r) => r.roomNo === '201')!;

  it('the UXD hint (E14-13) sits under the box; a blocked list is refused under the box, text kept; a spaced list goes through', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    const dlg = await declineDialog(user);
    const box = within(dlg).getByRole('textbox');
    expect(box).toHaveAccessibleDescription(tv('req.desk.reply_help'));
    const save = within(dlg).getByRole('button', { name: tv('guest.req.status.declined') });

    await user.type(box, 'Phòng 202,203,204 đã kín xe');
    await user.click(save);
    expect(await within(dlg).findByText(tv('field.SENSITIVE_DATA_DETECTED'))).toBeInTheDocument();
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveValue('Phòng 202,203,204 đã kín xe');
    expect(transport().status).not.toBe('declined');

    await user.clear(box);
    await user.type(box, 'Giá 0912.345.000đ');
    await user.click(save);
    await waitFor(() => expect(box).toHaveValue('Giá 0912.345.000đ'));
    expect(within(dlg).getByText(tv('field.SENSITIVE_DATA_DETECTED'))).toBeInTheDocument();
    expect(transport().status).not.toBe('declined');

    await user.clear(box);
    await user.type(box, 'Phòng 202, 203, 204 đã kín xe, giá 350.000 đ');
    await user.click(save);
    await waitFor(() => expect(transport().status).toBe('declined'));
    expect(transport().replyNote).toBe('Phòng 202, 203, 204 đã kín xe, giá 350.000 đ');
  });

  it('a list with semicolons passes', async () => {
    const { user } = renderApp('/today', 'qa.fd');
    const dlg = await declineDialog(user);
    await user.type(within(dlg).getByRole('textbox'), 'Phòng 202; 203 đã kín xe');
    await user.click(within(dlg).getByRole('button', { name: tv('guest.req.status.declined') }));
    await waitFor(() => expect(transport().status).toBe('declined'));
  });

  it("the guest's own note is never checked by B-15 (6+ digits shown and the request still closes)", async () => {
    transport().note = 'Gọi tôi 0912345678 khi xe tới';
    const { user } = renderApp('/today', 'qa.fd');
    const dlg = await declineDialog(user);
    expect(
      screen.getByText(tv('hk.req_note', { note: 'Gọi tôi 0912345678 khi xe tới' })),
    ).toBeInTheDocument();
    await user.type(within(dlg).getByRole('textbox'), 'Xe kín chỗ, lễ tân gọi lại cho bạn');
    await user.click(within(dlg).getByRole('button', { name: tv('guest.req.status.declined') }));
    await waitFor(() => expect(transport().status).toBe('declined'));
    expect(transport().note).toBe('Gọi tôi 0912345678 khi xe tới');
  });
});
