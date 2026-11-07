// v1.0.5 V5-23 – the Desk side of the "wrong text" pass (UXD copy-v1.0.5 mục 4). Every expected sentence is read with
// `tv(key)` (content-guide mục 2), never retyped.
import { ApiError } from '@ottimo/api-client';
import { hasKey, translate } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { quoteValidUntil } from '../app/dates';
import { problemView } from '../app/problem';
import { rsvErrorText } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD } from '../mocks/seed';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
const t = (key: string, args?: Record<string, string | number>) => translate('vi', key, args);
const problem = (status: number, body: Record<string, unknown>) =>
  new ApiError(status, { type: 't', title: 't', status, ...body } as never);

describe('copy (copy-v1.0.5 4.3, 4.4, 4.7, 4.15, 4.18)', () => {
  it('4.3: the default price sentence no longer says "fines" for every item', () => {
    expect(tv('stay.charge_default', { amount: '1 đ', rule: 'x' })).not.toMatch(/phạt/i);
  });

  it('4.4: neither step-up text names a fixed 15 minutes', () => {
    for (const key of ['ci.stepup_body', 'stepup.body_account']) {
      expect(tv(key)).not.toMatch(/15/);
      expect(translate('en', key)).not.toMatch(/15/);
    }
  });

  it('4.7 (a): no "Round" / "R2" left in the six lock-app and e-invoice sentences', () => {
    for (const key of [
      'co.invoice_r3',
      'ci.door_title',
      'ci.door_not_stored',
      'co.effect_door',
      'stay.door_manual',
      'stay.late_door_manual',
    ]) {
      for (const text of [tv(key, { room: '201' }), translate('en', key, { room: '201' })])
        expect(text).not.toMatch(/\bR(?:ound\s*)?[23]\b/);
    }
  });

  it('4.15: the EN of the 25 keys has no plain hyphen between a number and a word (U+2011)', () => {
    const keys = [
      'auth.enroll.title',
      'auth.enroll.done',
      'mfa.nudge',
      'mfa.recovery_help',
      'mfa.enroll_required',
      'mfa.already_on',
      'mfa.codes_file_title',
      'mfa.codes_low_short',
      'mfa.disable',
      'shell.security',
      'error.MFA_ENROLLMENT_REQUIRED',
      'users.more_help',
      'users.reset_2fa',
      'users.reset_2fa_title',
      'users.reset_2fa_done',
      'users.reset_2fa_stale',
      'co.late_fee_auth_try_review',
      'staff.mfa_enroll_desk',
      'secmail.lead',
      'secnudge.both',
      'staff.notif.sec.mfa_reset_self',
      'staff.notif.sec.mfa_reset_other',
      'sale.month_option',
      'sale.month_total',
      'stay.late_help',
    ];
    expect(keys).toHaveLength(25);
    for (const key of keys) {
      const en = translate('en', key, { name: 'Lan' });
      expect(en, key).not.toMatch(/\b\d+-[A-Za-z]+/);
      expect(en, key).toMatch(/\d‑[A-Za-z]/);
    }
  });

  it('4.1, 4.18: the old early-departure variant and fo.tabs.holds are gone', () => {
    expect(hasKey('bill.line.early_departure_fee_notice')).toBe(false);
    expect(hasKey('fo.tabs.holds')).toBe(false);
  });
});

describe('4.12 – 409 INVALID_TRANSITION outside a booking (UXD-F1-01)', () => {
  it('problemView: the generic sentence, never a booking status (with or without currentState)', () => {
    for (const extra of [{}, { currentState: 'disabled' }]) {
      const err = problem(409, { code: 'INVALID_TRANSITION', ...extra });
      expect(problemView(t, err).text).toBe(tv('error.INVALID_TRANSITION_generic'));
    }
  });

  it('a booking still names its status through rsvErrorText', () => {
    const err = problem(409, { code: 'INVALID_TRANSITION', currentState: 'confirmed' });
    expect(rsvErrorText(t, err)).not.toBe(tv('error.INVALID_TRANSITION_generic'));
  });

  it('Users page (reloads itself): lock refused with 409 → "Danh sách đã tải lại"', async () => {
    server.use(
      http.patch('*/v1/users/:userId', () =>
        HttpResponse.json(
          { type: 't', title: 't', status: 409, code: 'INVALID_TRANSITION', requestId: 'r-409' },
          { status: 409, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp('/settings/users', 'qa.owner');
    await user.click(await screen.findByRole('button', { name: `${tv('users.more')}: Hạnh` }));
    const menu = await screen.findByRole('menu', { name: `${tv('users.more')}: Hạnh` });
    await user.click(within(menu).getByRole('menuitem', { name: tv('users.lock') }));
    const dlg = await screen.findByRole('dialog', { name: new RegExp(esc(tv('users.lock'))) });
    await user.type(within(dlg).getByLabelText(label('reauth.s2_password_label')), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('users.lock') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      await screen.findByText(tv('error.INVALID_TRANSITION_generic_reloaded')),
    ).toBeInTheDocument();
  });
});

describe('4.13 – DEPOSIT_INSUFFICIENT names money with the unit (UXD P440-06)', () => {
  it('rsvErrorText: "1.000.000 đ", not a bare number', () => {
    const err = problem(422, {
      code: 'DEPOSIT_INSUFFICIENT',
      depositRequiredVnd: 1_000_000,
      depositPaidVnd: 300_000,
    });
    const money = (n: string) => tv('common.currency_vnd', { amount: n });
    expect(rsvErrorText(t, err)).toBe(
      tv('error.DEPOSIT_INSUFFICIENT', { required: money('1.000.000'), paid: money('300.000') }),
    );
  });
});

describe('4.7 (e) – quote validity is the last valid minute', () => {
  it('expiresAt 00:00 of the next day → "23:59 dd/MM/yyyy" (as the text sent to the guest)', () => {
    expect(quoteValidUntil('2026-11-07T17:00:00Z')).toBe('23:59 07/11/2026');
    expect(quoteValidUntil('2026-12-31T17:00:00Z')).toBe('23:59 31/12/2026');
  });
});

describe('in-house booking dialogs (4.2, 4.3, 4.7 (c))', () => {
  const openDrawer = async (as = 'qa.fd') => {
    const r = res('Trần Thu Nga');
    const { user } = renderApp(`/reservations/${r.id}`, as);
    const d = await screen.findByRole('dialog', { name: 'Trần Thu Nga' });
    return { user, d };
  };

  it('4.3: the "not room revenue" note shows for fines and damage only', async () => {
    const { user, d } = await openDrawer();
    await user.click(within(d).getByRole('button', { name: tv('stay.add_charge') }));
    const dlg = await screen.findByRole('dialog', { name: tv('stay.add_charge') });
    const select = await within(dlg).findByLabelText(label('stay.charge_item'));
    const note = new RegExp(esc(tv('stay.charge_penalty_note')));
    for (const [code, shown] of [
      ['SMOKING', true],
      ['DAMAGE_TOWEL', true],
      ['LAUNDRY_KG', false],
      ['FNB', false],
    ] as const) {
      await user.selectOptions(select, code);
      if (shown) expect(within(dlg).getByText(note)).toBeInTheDocument();
      else expect(within(dlg).queryByText(note)).toBeNull();
    }
  });

  it('4.2: the companion search box says "Người đi cùng", not "Khách đứng tên"', async () => {
    const { user, d } = await openDrawer();
    await user.click(within(d).getByRole('button', { name: tv('rsv.add_person') }));
    const dlg = await screen.findByRole('dialog', { name: tv('rsv.party') });
    expect(
      within(dlg).getByRole('combobox', { name: new RegExp(esc(tv('stay.companion_field'))) }),
    ).toBeInTheDocument();
    expect(
      within(dlg).queryByRole('combobox', { name: new RegExp(esc(tv('booking.field.guest'))) }),
    ).toBeNull();
  });

  it('4.7 (c): the confirm-time box asks for the agreed time, not the actual departure time', async () => {
    const { user, d } = await openDrawer();
    await user.click(within(d).getByRole('button', { name: tv('today.confirm_time') }));
    const dlg = await screen.findByRole('dialog', { name: tv('today.confirm_time') });
    expect(within(dlg).getByLabelText(label('stay.agreed_time'))).toBeInTheDocument();
    expect(within(dlg).queryByLabelText(label('checkout.departure_time'))).toBeNull();
  });
});

describe('4.11 – night price of an Internal-channel booking', () => {
  const openNight = async (internal: boolean) => {
    const r = res('Nguyễn Văn An');
    if (internal) {
      const ch = mockControl.rsv.channels.find((c) => c.channelGroup === 'internal')!;
      r.channelId = ch.id;
      r.channelCode = ch.code;
    }
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    const d = await screen.findByRole('dialog', { name: 'Nguyễn Văn An' });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
    const folio = mockControl.stay.folios.get(r.folioId)!;
    const nightIdx = folio.lines
      .filter((l) => l.lineState !== 'rejected')
      .findIndex((l) => l.category === 'room');
    expect(nightIdx).toBeGreaterThanOrEqual(0);
    const rows = await within(dlg).findAllByRole('button', { name: tv('folio.adjust') });
    // The first adjustable line of this booking is a room night (S4-38 fixture).
    await user.click(rows[0]!);
    const box = await screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
    const price = within(box).getByLabelText(
      new RegExp(`^${tv('folio.adjust_night_price').replace(/[()]/g, '\\$&')}`),
    );
    return { user, box, price };
  };

  it('Internal: the help says no floor–ceiling and 0 = free; an empty box asks for the rate or 0', async () => {
    const { user, box, price } = await openNight(true);
    expect(
      within(box).getByText(new RegExp(esc(tv('folio.adjust_night_help_internal')))),
    ).toBeInTheDocument();
    expect(
      within(box).queryByText(new RegExp(`^${esc(tv('folio.adjust_night_help'))}`)),
    ).toBeNull();
    await user.clear(price);
    expect(
      await within(box).findByText(tv('folio.adjust_night_empty_internal')),
    ).toBeInTheDocument();
    expect(within(box).queryByText(tv('field_error.amount_not_positive'))).toBeNull();
  });

  it('other channels keep the usual help and the usual empty-box sentence', async () => {
    const { user, box, price } = await openNight(false);
    expect(
      within(box).getByText(new RegExp(`^${esc(tv('folio.adjust_night_help'))}`)),
    ).toBeInTheDocument();
    expect(
      within(box).queryByText(new RegExp(esc(tv('folio.adjust_night_help_internal')))),
    ).toBeNull();
    await user.clear(price);
    expect(await within(box).findByText(tv('field_error.amount_not_positive'))).toBeInTheDocument();
  });
});

describe('4.7 (f) – empty "Đơn của tôi" for sale / CTV', () => {
  it('sale: create from Quotes & holds; front desk keeps the New booking sentence', async () => {
    mockControl.rsv.reservations.length = 0;
    const sal = renderApp('/reservations', 'qa.sal');
    expect(await screen.findByText(tv('rsv.list_empty_body_sales'))).toBeInTheDocument();
    expect(screen.queryByText(tv('rsv.list_empty_body'))).toBeNull();
    sal.unmount();
    renderApp('/reservations', 'qa.fd');
    expect(await screen.findByText(tv('rsv.list_empty_body'))).toBeInTheDocument();
  });
});

describe('4.14 – the green hold box when there is no QR (GN-V104-QR-green-box)', () => {
  async function holdFromQuote(user: User) {
    const item = await waitFor(() => {
      const li = screen
        .getAllByRole('listitem')
        .find((x) => x.querySelector('.roomno')?.textContent === '203');
      if (!li) throw new Error('room 203 not listed');
      return li;
    });
    await user.click(within(item).getByRole('button', { name: 'Báo giá' }));
    const dlg = await screen.findByRole('dialog', { name: 'Báo giá' });
    await within(dlg).findByText('Tổng tiền đơn');
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Hoàng Gia');
    await user.click(await screen.findByRole('option', { name: /Hoàng Gia Bảo/ }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    const send = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    // 4.7 (e): the send step says "Hiệu lực đến 23:59 …".
    const quote = mockControl.rsv.quotes.at(-1)!;
    expect(
      within(send).getByText(tv('sale.quote_expires', { time: quoteValidUntil(quote.expiresAt) })),
    ).toBeInTheDocument();
    await user.click(within(send).getByRole('button', { name: 'Khách đồng ý – Giữ chỗ' }));
    const hold = await screen.findByRole('dialog', { name: 'Giữ chỗ' });
    await user.click(within(hold).getByRole('button', { name: 'Tạo giữ chỗ' }));
    await within(hold).findByText(/Đã giữ căn 203 – đơn OTM-0\d+/);
    return hold;
  }

  it('no receiving account: "Thu cọc của khách theo hướng dẫn bên dưới", not "Gửi mã QR"', async () => {
    pinDaytime();
    mockControl.stay.paymentNotConfigured = true;
    const { user } = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    const hold = await holdFromQuote(user);
    expect(await within(hold).findByText(tv('error.PAYMENT_NOT_CONFIGURED'))).toBeInTheDocument();
    const created = mockControl.rsv.reservations.at(-1)!;
    expect(created.hold?.expiresAt).toBeTruthy();
    const stem = (key: string) => tv(key, { time: '§' }).split('§')[0]!;
    expect(
      await within(hold).findByText(new RegExp(`^${esc(stem('sale.hold_next_no_qr'))}`)),
    ).toBeInTheDocument();
    expect(within(hold).queryByText(new RegExp(`^${esc(stem('sale.hold_next'))}`))).toBeNull();
  });
});

describe('4.10 – erased at the sender’s request (BUG-R3-055)', () => {
  it('the drawer says "đã xóa theo yêu cầu của người gửi", not "theo hạn lưu"', async () => {
    const { user } = renderApp('/website-requests', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: '7K3QX9MD' }));
    const drawer = await screen.findByRole('dialog');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.erase') }));
    const dlg = await screen.findByRole('dialog', { name: /Xóa dữ liệu của yêu cầu 7K3QX9MD/ });
    await user.click(within(dlg).getByLabelText(tv('webreq.erase.same_contact')));
    await user.type(
      within(dlg).getByLabelText(new RegExp(`^${tv('webreq.erase_contact')}`)),
      'Anna.Keller@example.com',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('webreq.erase_confirm') }));
    const stem = (key: string) => tv(key, { date: '§' }).split('§')[0]!;
    expect(
      await within(drawer).findByText(new RegExp(`^${esc(stem('webreq.pii_erased'))}`)),
    ).toBeInTheDocument();
    expect(within(drawer).queryByText(new RegExp(`^${esc(stem('webreq.pii_purged'))}`))).toBeNull();
  });
});

describe('4.16 – purpose sentence next to a staff email (FB-R4-SEC-ARC-EM-13)', () => {
  it("the owner's box names whose account the address is for", async () => {
    const { user } = renderApp('/settings/users', 'qa.owner');
    const row = (await screen.findByText('qa.fd')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: `${tv('users.edit_email')}: Hạnh` }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('users.email_title', { name: 'Hạnh' }),
    });
    expect(
      within(dlg).getByText(new RegExp(esc(tv('users.email_purpose', { name: 'Hạnh' })))),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(new RegExp(esc(tv('secmail.purpose'))))).toBeNull();
  });
});
