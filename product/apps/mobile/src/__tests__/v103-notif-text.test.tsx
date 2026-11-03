// v1.0.3 BUG-R4-021 (P3): the inbox showed the internal `refCode` (`user.email_changed`, `mfa.reset_by_owner`)
// of account-security notices (refType `user`). The PWA now words them itself and never shows that code.
import { translate } from '@ottimo/i18n';
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StaffNotification } from '../app/api';
import { notifRef, notifText } from '../app/notifications';
import { mockControl, MOCK_USERS } from '../mocks/handlers';
import { setOnline, start, tv } from './helpers';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setOnline(true);
});
afterEach(() => {
  vi.useRealTimers();
});

const LAN = MOCK_USERS['hk.lan'].id;
const HANH = MOCK_USERS['fdl.hanh'].id;
const RAW = /user\.email_changed|mfa\.reset_by_owner|mfa\.disabled|stepup\.|mfa\./;

const n = (p: Partial<StaffNotification>): StaffNotification => ({
  id: '0192a1b0-0000-7000-8000-0000000ff001',
  kind: 'account_security_change',
  createdAt: '2026-11-03T10:00:00Z',
  ...p,
});

describe('BUG-R4-021 – account-security notices in the PWA inbox', () => {
  it('my notification email changed: a sentence, no internal code on screen', async () => {
    mockControl.notify({
      kind: 'account_security_change',
      refType: 'user',
      refId: LAN,
      refCode: 'user.email_changed',
    });
    const { user, container } = await start('hk.lan');
    await user.click(await screen.findByRole('link', { name: /Thông báo/ }));
    expect(
      await screen.findByText('Email nhận thông báo bảo mật của bạn đã thay đổi'),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(RAW);
    // The other notices keep their reference line (room number / work order code).
    expect(screen.getByText('Căn 302')).toBeInTheDocument();
  });

  it('an owner/lead told about someone else: "a staff member", 2FA reset worded, no code', async () => {
    mockControl.notify({
      kind: 'account_security_change',
      refType: 'user',
      refId: LAN,
      refCode: 'user.email_changed',
    });
    mockControl.notify({
      kind: 'account_security_change',
      refType: 'user',
      refId: LAN,
      refCode: 'mfa.reset_by_owner',
    });
    const { user, container } = await start('fdl.hanh');
    await user.click(await screen.findByRole('link', { name: /Thông báo/ }));
    expect(
      await screen.findByText('Email nhận thông báo bảo mật của một nhân viên đã thay đổi'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Xác thực 2 bước của một nhân viên đã được đặt lại'),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(RAW);
  });

  it('an account event the PWA has no sentence for gets the plain security sentence, never the code', async () => {
    mockControl.notify({
      kind: 'security_alert',
      refType: 'user',
      refId: LAN,
      refCode: 'mfa.locked',
    });
    mockControl.notify({
      kind: 'account_security_change',
      refType: 'user',
      refId: LAN,
      refCode: 'user.some_future_event',
    });
    const { user, container } = await start('hk.lan');
    await user.click(await screen.findByRole('link', { name: /Thông báo/ }));
    expect(await screen.findAllByText(tv('staff.notif.sec.other_self'))).toHaveLength(2);
    expect(container.textContent).not.toMatch(/mfa\.locked|user\.some_future_event/);
  });
});

describe('notifText / notifRef (unit)', () => {
  const vi_ = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);

  it('self vs other is decided by refId = the person signed in', () => {
    const e = n({ refType: 'user', refId: LAN, refCode: 'user.email_changed' });
    expect(notifText(e, vi_, LAN)).toBe(tv('staff.notif.sec.email_changed_self'));
    expect(notifText(e, vi_, HANH)).toBe(tv('staff.notif.sec.email_changed_other'));
    expect(notifText(e, vi_)).toBe(tv('staff.notif.sec.email_changed_other'));
    const op = n({ refType: 'user', refId: LAN, refCode: 'mfa.reset_by_operator' });
    expect(notifText(op, vi_, LAN)).toBe(tv('staff.notif.sec.mfa_reset_self'));
    // security_alert with refType user and no refCode (B18 lock, frontdesk.controller onLocked)
    const lock = n({ kind: 'security_alert', refType: 'user', refId: HANH });
    expect(notifText(lock, vi_, HANH)).toBe(tv('staff.notif.sec.other_self'));
  });

  it('every new key exists in VI and EN (EN = UXD terminology "Notification email")', async () => {
    const { loadLocale } = await import('@ottimo/i18n');
    await loadLocale('en');
    const en = (k: string) => translate('en', k);
    expect(en('staff.notif.sec.email_changed_self')).toBe('Your notification email was changed');
    for (const base of ['email_changed', 'mfa_reset', 'other']) {
      for (const who of ['self', 'other']) {
        const k = `staff.notif.sec.${base}_${who}`;
        expect(translate('vi', k)).not.toBe(k);
        expect(en(k)).not.toBe(k);
        expect(en(k)).not.toMatch(/[.!]$/); // same style as the other inbox lines
      }
    }
  });

  it('unknown kinds still fall back to the general sentence; references stay display codes only', () => {
    const unknown = n({
      kind: 'brand_new_kind' as StaffNotification['kind'],
      refType: 'reservation',
      refCode: 'OTM-00171',
    });
    expect(notifText(unknown, vi_, LAN)).toBe(tv('staff.notif.k.other'));
    expect(notifRef(unknown, vi_)).toBe('OTM-00171');
    expect(notifRef(n({ refType: 'work_order', refCode: 'WO-00034' }), vi_)).toBe('WO-00034');
    expect(notifRef(n({ refType: 'hk_task', refCode: '302' }), vi_)).toBe('Căn 302');
    expect(notifRef(n({ refType: 'user', refCode: 'user.email_changed' }), vi_)).toBeUndefined();
    // An internal-looking code under any other refType is not shown either.
    expect(
      notifRef(
        n({ refType: 'brand_new' as StaffNotification['refType'], refCode: 'x.internal_event' }),
        vi_,
      ),
    ).toBeUndefined();
    expect(notifRef(n({ refType: 'reservation' }), vi_)).toBeUndefined();
  });
});
