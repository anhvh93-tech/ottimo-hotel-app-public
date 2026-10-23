import { useI18n, type Locale } from '@ottimo/i18n';
import { Icon, Seg } from '@ottimo/ui';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme, type ThemeChoice } from '../app/theme';
import { primaryRole } from '../session/nav';
import { useSession } from '../session/SessionProvider';

/** H02 2.1 user menu: name + role (US-001 AC1), change password, language, theme, sign out. */
export function UserMenu() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const session = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const role = primaryRole(session.roles);
  const name = session.me?.displayName ?? '';

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        ref={btnRef}
        className="userchip"
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar" aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </span>
        {/* UXR S4 P-20: on a phone only the initial shows; the name stays the button's accessible name. */}
        <span className="userchip-name">
          {name}
          {role ? ` · ${t(`role.${role}`)}` : ''}
        </span>
      </button>
      {open ? (
        <div className="card menu-pop" id={menuId} aria-label={t('shell.user_menu')} role="group">
          <div style={{ padding: '8px 10px' }}>
            <div className="li-t">{name}</div>
            <div className="li-s">
              {session.roles.map((r) => t(`role.${r}`)).join(', ')} · {session.property?.name}
            </div>
          </div>
          <hr className="hr" style={{ margin: '4px 0' }} />
          <Link className="rowlink" to="/change-password" onClick={() => setOpen(false)}>
            <Icon name="key" />
            <span>{t('shell.change_password')}</span>
          </Link>
          <Link className="rowlink" to="/security" onClick={() => setOpen(false)}>
            <Icon name="shield" />
            <span>{t('shell.security')}</span>
          </Link>
          <div className="rowlink" style={{ cursor: 'default' }}>
            <Icon name="globe" />
            <span className="grow" id={`${menuId}-lang`}>
              {t('shell.language')}
            </span>
            <Seg<Locale>
              labelledBy={`${menuId}-lang`}
              value={locale}
              onChange={setLocale}
              options={[
                { value: 'vi', label: 'VI' },
                { value: 'en', label: 'EN' },
              ]}
            />
          </div>
          {/* UXR S4 P-20: three choices do not fit beside the label on a phone – they wrap under it. */}
          <div className="rowlink menu-row-wrap" style={{ cursor: 'default' }}>
            <Icon name="sparkle" />
            <span className="grow" id={`${menuId}-theme`}>
              {t('shell.theme')}
            </span>
            <Seg<ThemeChoice>
              labelledBy={`${menuId}-theme`}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'auto', label: t('shell.theme_auto') },
                { value: 'light', label: t('shell.theme_light') },
                { value: 'dark', label: t('shell.theme_dark') },
              ]}
            />
          </div>
          <hr className="hr" style={{ margin: '4px 0' }} />
          <button
            type="button"
            className="rowlink"
            onClick={async () => {
              setOpen(false);
              await session.logout();
              navigate('/login', { replace: true });
            }}
          >
            <Icon name="out" />
            <span>{t('shell.logout')}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
