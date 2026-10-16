import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './icons';

type Tone = 'ok' | 'warn' | 'bad' | 'info';
const TONE_ICON: Record<Tone, IconName> = {
  ok: 'check',
  warn: 'alert',
  bad: 'alert',
  info: 'info',
};

export interface AlertProps {
  tone: Tone;
  icon?: IconName;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  /** `alert` for errors the user must notice now; `status`/`note` otherwise. */
  role?: 'alert' | 'status' | 'note';
  id?: string;
}

export function Alert({ tone, icon, title, children, actions, role, id }: AlertProps) {
  return (
    <div className={`alert ${tone}`} role={role ?? (tone === 'bad' ? 'alert' : 'status')} id={id}>
      <Icon name={icon ?? TONE_ICON[tone]} />
      <div className="txt">
        {title ? <b>{title}</b> : null}
        {children}
        {actions ? <div className="act">{actions}</div> : null}
      </div>
    </div>
  );
}

export interface ChipProps {
  tone?: Tone | 'oak' | 'neutral';
  /** DS C7 "icon + chữ": ok/warn/bad/info get a default icon; `null` = no icon on purpose. */
  icon?: IconName | null;
  /** Extra DS variant class, e.g. `recon` ("chờ đối soát": dashed border + hourglass). */
  className?: string;
  children: ReactNode;
}

const CHIP_ICON: Partial<Record<NonNullable<ChipProps['tone']>, IconName>> = {
  ok: 'check',
  warn: 'alert',
  bad: 'x',
  info: 'info',
};

export function Chip({ tone = 'neutral', icon, className, children }: ChipProps) {
  const name = icon === null ? undefined : (icon ?? CHIP_ICON[tone]);
  return (
    <span className={['chip', tone, className].filter(Boolean).join(' ')}>
      {name ? <Icon name={name} size="sm" /> : null}
      <span>{children}</span>
    </span>
  );
}

export interface StateViewProps {
  kind?: 'empty' | 'error';
  icon?: IconName;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Problem.requestId for 5xx (shown so staff can quote it). */
  reference?: string;
}

/** C29 empty / error states – one positive sentence + one action. */
export function StateView({
  kind = 'empty',
  icon,
  title,
  children,
  action,
  reference,
}: StateViewProps) {
  return (
    <div
      className={`state${kind === 'error' ? ' err' : ''}`}
      role={kind === 'error' ? 'alert' : undefined}
    >
      <div className="ill">
        <Icon name={icon ?? (kind === 'error' ? 'alert' : 'sparkle')} />
      </div>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {reference ? <span className="ref">{reference}</span> : null}
      {action}
    </div>
  );
}

export function Skeleton({ height = 16, width }: { height?: number; width?: string }) {
  return <div className="sk" style={{ height, width }} aria-hidden="true" />;
}

export function OfflineBar({ children }: { children: ReactNode }) {
  return (
    <div className="offline-bar" role="status">
      <Icon name="offline" />
      <span>{children}</span>
    </div>
  );
}
