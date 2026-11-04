import type { User } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Button, Icon } from '@ottimo/ui';
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

export type UserMoreAction = 'reset' | 'lock' | 'reset2fa';

/**
 * v1.0.4 BUG-R4-020 – "Khác…" of Người dùng & vai (hifi 07-users-devices, `users.more_help`): Đặt lại mật khẩu,
 * Khóa tài khoản, Đặt lại xác thực 2 bước. "Khóa" only for an active account (otherwise the row shows "Mở khóa"
 * as its own button, as in the hifi); "2 bước" only for a person who has 2FA on (the server answers
 * `409 INVALID_TRANSITION` otherwise). Every item opens the S2 dialog of the page; the menu itself changes nothing.
 *
 * Menu-button pattern (WAI-ARIA APG): the first item takes focus on open, ↑/↓/Home/End move, Esc or Tab closes
 * and focus goes back to the button. The popover is `position: fixed` under the button because the table sits in
 * a scrolling `.table-wrap` that would clip an absolute popover on the last rows.
 */
export function UserMoreMenu({
  user,
  disabled,
  onPick,
}: {
  user: User;
  disabled?: boolean;
  onPick: (action: UserMoreAction) => void;
}) {
  const { t } = useI18n();
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const open = pos !== null;
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items: { action: UserMoreAction; icon: 'key' | 'lock' | 'shield'; label: string }[] = [
    { action: 'reset', icon: 'key', label: t('users.reset_pw') },
    // A locked/disabled account shows "Mở khóa" beside the menu (hifi 07): the menu only offers "Khóa tài khoản".
    ...(user.status === 'active'
      ? [{ action: 'lock' as const, icon: 'lock' as const, label: t('users.lock') }]
      : []),
    ...(user.mfaEnabled
      ? [{ action: 'reset2fa' as const, icon: 'shield' as const, label: t('users.reset_2fa') }]
      : []),
  ];

  const close = (focusButton: boolean) => {
    setPos(null);
    if (focusButton) btnRef.current?.focus();
  };

  const toggle = () => {
    if (open) return close(false);
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) });
  };

  useLayoutEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close(false);
    };
    // The popover is fixed: a scroll or resize would leave it away from its button.
    const onMove = () => close(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const at = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(list.length - 1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') close(false);
  };

  return (
    <div className="menu-anchor" ref={ref}>
      <Button
        ref={btnRef}
        size="sm"
        variant="ghost"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${t('users.more')}: ${user.displayName}`}
        onClick={toggle}
      >
        {t('users.more')}
      </Button>
      {pos ? (
        <div
          ref={menuRef}
          className="card menu-pop"
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={`${t('users.more')}: ${user.displayName}`}
          style={{ position: 'fixed', top: pos.top, right: pos.right, left: 'auto' }}
          onKeyDown={onMenuKey}
        >
          {items.map((it) => (
            <button
              key={it.action}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="rowlink"
              onClick={() => {
                close(true);
                onPick(it.action);
              }}
            >
              <Icon name={it.icon} />
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
