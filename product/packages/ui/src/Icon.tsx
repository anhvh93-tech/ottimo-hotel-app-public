import { ICONS, type IconName } from './icons';

export interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  /** Give a label only when the icon carries meaning on its own (rare – DS rule D4). */
  label?: string;
  className?: string;
}

export function Icon({ name, size = 'md', label, className }: IconProps) {
  const cls = ['ico', size === 'md' ? '' : size, className ?? ''].filter(Boolean).join(' ');
  return (
    <svg
      className={cls}
      viewBox="0 0 24 24"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
      // Static, trusted markup copied from the design system (no user input).
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
