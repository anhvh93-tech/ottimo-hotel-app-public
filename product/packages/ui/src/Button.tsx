import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './icons';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'pri' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  block?: boolean;
  icon?: IconName;
  /** Request in flight: button is locked (no double submit – EP00 0.2.5) and shows busyLabel. */
  busy?: boolean;
  busyLabel?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'default',
    size = 'md',
    block,
    icon,
    busy,
    busyLabel,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  }: ButtonProps,
  ref,
) {
  const cls = [
    'btn',
    variant === 'default' ? '' : variant,
    size === 'sm' ? 'sm' : '',
    block ? 'block' : '',
    busy ? 'busy' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      ref={ref}
      type={type}
      className={cls}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy ? <span className="spin" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
});
