// v1.0.5 V5-1B, FB-R5-ARC-MOB-V51B-01 (Major): the J1 hold notices (contract 0.3.12, `hold_expired` to every
// active FD / FDL since 0.3.13 bổ sung 1) are worded in the PWA inbox with the UXD sentences – not the general
// "Thông báo mới – xem chi tiết trên OTTIMO Desk". refType `reservation`: booking code as the reference line,
// tapping opens no screen (a Desk topic).
import { loadLocale, translate } from '@ottimo/i18n';
import { screen, within } from '@testing-library/react';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectUsedKeys, isShipped } from '../../scripts/used-keys';
import type { StaffNotification } from '../app/api';
import { notifRef, notifText } from '../app/notifications';
import { mockControl } from '../mocks/handlers';
import { setOnline, start, tv } from './helpers';

const HOLD_KINDS = ['hold_expired', 'hold_overdue_with_deposit', 'hold_overdue_cap'] as const;
const key = (k: string) => `staff.notif.k.${k}`;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setOnline(true);
});
afterEach(() => {
  vi.useRealTimers();
});

const n = (kind: StaffNotification['kind'], code = 'OTM-00901'): StaffNotification => ({
  id: '0192a1b0-0000-7000-8000-0000000ff101',
  kind,
  refType: 'reservation',
  refId: '0192a1b0-0000-7000-8000-0000000e0901',
  refCode: code,
  createdAt: '2026-11-10T14:05:00+07:00',
});

describe('V5-1B – hold notices in the staff inbox (unit)', () => {
  it('each hold kind has its own VI / EN sentence, never the general Desk sentence', async () => {
    await loadLocale('en');
    for (const lang of ['vi', 'en'] as const) {
      const t = (k: string) => translate(lang, k);
      for (const kind of HOLD_KINDS) {
        const text = notifText(n(kind), t);
        expect(text).toBe(t(key(kind)));
        expect(text).not.toBe(key(kind)); // the string exists
        expect(text).not.toBe(t('staff.notif.k.other'));
      }
    }
  });

  it('reference line = the booking code (SR-PWA-06), no guest name in the notice', () => {
    const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
    for (const kind of HOLD_KINDS) expect(notifRef(n(kind, 'OTM-00902'), t)).toBe('OTM-00902');
  });

  it('the three keys ship in the PWA bundle (scripts/used-keys.ts)', () => {
    const used = collectUsedKeys(join(__dirname, '..'));
    for (const kind of HOLD_KINDS) expect(isShipped(key(kind), used)).toBe(true);
  });
});

describe('V5-1B – front desk lead opens the inbox', () => {
  it('hold expired / overdue: UXD sentence + booking code; tapping stays in the inbox', async () => {
    mockControl.notify({
      kind: 'hold_expired',
      refType: 'reservation',
      refId: '0192a1b0-0000-7000-8000-0000000e0903',
      refCode: 'OTM-00903',
    });
    mockControl.notify({
      kind: 'hold_overdue_with_deposit',
      refType: 'reservation',
      refId: '0192a1b0-0000-7000-8000-0000000e0904',
      refCode: 'OTM-00904',
    });
    const { user, container } = await start('fdl.hanh');
    await user.click(await screen.findByRole('link', { name: /Thông báo/ }));
    const expired = await screen.findByText(tv('staff.notif.k.hold_expired'));
    expect(screen.getByText(tv('staff.notif.k.hold_overdue_with_deposit'))).toBeInTheDocument();
    expect(screen.getByText('OTM-00903')).toBeInTheDocument();
    expect(screen.getByText('OTM-00904')).toBeInTheDocument();
    expect(container.textContent).not.toContain(tv('staff.notif.k.other'));
    const hashBefore = window.location.hash;
    const row = expired.closest('button')!;
    expect(within(row).getByText('OTM-00903')).toBeInTheDocument();
    await user.click(row);
    expect(window.location.hash).toBe(hashBefore);
  });
});
