import { useI18n } from '@ottimo/i18n';
import { Button, Icon, StateView } from '@ottimo/ui';
import { Navigate, useNavigate } from 'react-router-dom';
import { homePath } from '../session/nav';
import { useSession } from '../session/SessionProvider';

/** H01 1.5 – only shown when the account has ≥ 2 properties (MVP has 1 → skipped) or none. */
export function SelectPropertyPage() {
  const { t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  if (session.status === 'loading') return null;
  if (session.status === 'anonymous') return <Navigate to="/login" replace />;
  if (session.mustChangePassword) return <Navigate to="/change-password" replace />;
  const props = session.me?.properties ?? [];

  return (
    <div className="center-page">
      <div className="card" style={{ maxWidth: 440 }}>
        <h2>{t('prop.title')}</h2>
        {props.length === 0 ? (
          <StateView
            icon="users"
            title={t('prop.none_title')}
            action={<Button onClick={() => void session.logout()}>{t('shell.logout')}</Button>}
          >
            {t('prop.none_body')}
          </StateView>
        ) : (
          <>
            <p className="muted">{t('prop.lead', { n: props.length })}</p>
            <ul className="list">
              {props.map((p) => (
                <li key={p.propertyId}>
                  <button
                    type="button"
                    className="rowlink"
                    onClick={() => {
                      session.selectProperty(p.propertyId);
                      navigate(homePath(p.roles), { replace: true });
                    }}
                  >
                    <span className="avatar" aria-hidden="true">
                      {p.name.charAt(0)}
                    </span>
                    <span className="grow">
                      <span className="li-t">{p.name}</span>
                      <br />
                      <span className="li-s">{p.roles.map((r) => t(`role.${r}`)).join(', ')}</span>
                    </span>
                    <Icon name="chevron" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
