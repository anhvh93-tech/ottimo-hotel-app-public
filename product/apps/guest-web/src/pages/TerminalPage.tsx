import type { ReactNode } from 'react';
import { Button, Icon, Skeleton, StateView } from '@ottimo/ui';
import { fallbackDeskPhone } from '../app/config';
import { useT } from '../app/i18n';
import { telHref } from '../app/link';
import type { Terminal } from '../app/problem';

export type TerminalKind = Terminal | 'rate_limited' | 'load_error';

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="m-top">
      <h1>OTTIMO</h1>
      {children}
    </header>
  );
}

export function SkipLink() {
  const { t } = useT();
  return (
    <a className="skip" href="#main">
      {t('shell.skip')}
    </a>
  );
}

export function LoadingPage() {
  const { t } = useT();
  return (
    <div className="guest-app touch">
      <TopBar />
      <main id="main" className="m-body gw-stack" aria-busy="true">
        <p className="sr-only" role="status">
          {t('common.loading')}
        </p>
        <Skeleton height={32} width="60%" />
        <Skeleton height={120} />
        <Skeleton height={96} />
      </main>
    </div>
  );
}

/** Whole-page states: link expired/revoked, stay ended (R2: no bill), online check-in closed, 429, load error. */
export function TerminalPage({
  which,
  minutes,
  phone,
  onRetry,
}: {
  which: TerminalKind;
  minutes?: number;
  phone?: string;
  onRetry?: () => void;
}) {
  const { t } = useT();
  const tel = telHref(phone ?? fallbackDeskPhone());
  // DS 6.11: every dead end keeps a way to a real person.
  const call = tel ? (
    <a className="btn" href={tel}>
      {t('guest.contact.call')}
    </a>
  ) : undefined;
  let body: ReactNode;
  switch (which) {
    case 'link_invalid':
      body = (
        <StateView kind="error" icon="lock" title={t('guest.link_expired_title')} action={call}>
          {t('error.GUEST_LINK_INVALID')}
        </StateView>
      );
      break;
    case 'stay_ended':
      // ĐK-6: never the after-checkout body string (it promises a bill) in R2.
      body = (
        <StateView icon="star" title={t('guest.after_checkout.title')} action={call}>
          {t('gw.ended_body')}
        </StateView>
      );
      break;
    case 'checkin_closed':
      body = (
        <StateView icon="check" title={t('guest.oci.closed_desk')} action={call}>
          {t('gw.closed_body')}
        </StateView>
      );
      break;
    case 'rate_limited':
      body = (
        <StateView
          kind="error"
          icon="clock"
          title={t('error.RATE_LIMITED', { minutes: minutes ?? 10 })}
          action={call}
        />
      );
      break;
    default:
      body = (
        <StateView
          kind="error"
          title={t('guest.error_title')}
          action={
            onRetry ? (
              <Button onClick={onRetry}>
                <Icon name="undo" />
                {t('common.retry')}
              </Button>
            ) : undefined
          }
        >
          {t('guest.error_body')}
        </StateView>
      );
  }
  return (
    <div className="guest-app touch">
      <TopBar />
      <main id="main" className="m-body">
        {body}
      </main>
    </div>
  );
}
