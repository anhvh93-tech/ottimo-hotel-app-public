import type { Parameter, Role } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip } from '@ottimo/ui';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../app/api';
import { Page, Topbar } from '../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { useResource } from '../hooks/useResource';
import { NAV, isVisible } from '../session/nav';
import { usePropertyId, useSession } from '../session/SessionProvider';
import { ParamDialog, formatParamValue } from './ParamDialog';
import {
  GROUP_LABEL,
  GROUP_ORDER,
  SECURITY_BOUNDS,
  paramLabel,
  paramMeta,
  type ParamGroup,
} from './paramCatalog';

/** Who may edit a key: the API's `editableBy`; fallback mirrors rbac 5.3 (security keys → owner only). */
export function editorsOf(p: Parameter): Role[] {
  if (p.editableBy?.length) return p.editableBy;
  return p.key in SECURITY_BOUNDS ? ['owner'] : ['owner', 'manager'];
}

/** H05 – rule parameters by group; each save adds a new effective-dated value (US-005). */
export function ParamsPage() {
  const { t, date, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const tabsId = useId();
  const [active, setActive] = useState<ParamGroup>('booking');
  const [editing, setEditing] = useState<Parameter | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { state, reload } = useResource(
    async () => (await api.listParameters({ propertyId })).data.data,
    [propertyId],
  );

  const params = state.data ?? [];
  const groups = GROUP_ORDER.filter(
    (g) => g === 'occupancy' || params.some((p) => paramMeta(p.key).group === g),
  );
  const current = groups.includes(active) ? active : (groups[0] ?? 'booking');
  const rows = params.filter((p) => paramMeta(p.key).group === current);
  const canEditAny = session.roles.some((r) => r === 'owner' || r === 'manager');
  const roomsItem = NAV.find((n) => n.id === 'rooms')!;
  const canRooms = isVisible(roomsItem, {
    roles: session.roles,
    screens: session.screens,
    deviceTrusted: session.deviceTrusted,
  });

  // APG tabs: arrow keys move between tabs.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = groups[(idx + delta + groups.length) % groups.length]!;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <Topbar title={t('config.params')} sub={t('params.subtitle')} />
      <Page>
        {!canEditAny ? (
          <Alert tone="info" role="note">
            {t('params.view_only_banner')}
          </Alert>
        ) : null}
        {state.status === 'error' && !state.data ? (
          <ErrorBlock titleKey="params.error_title" error={state.error} onRetry={reload} />
        ) : state.status === 'loading' && !state.data ? (
          <LoadingBlock />
        ) : (
          <>
            <div className="tabs" role="tablist" aria-label={t('config.params')}>
              {groups.map((g, i) => (
                <button
                  key={g}
                  ref={(el) => {
                    tabRefs.current[g] = el;
                  }}
                  role="tab"
                  type="button"
                  id={`${tabsId}-t-${g}`}
                  aria-controls={`${tabsId}-p-${g}`}
                  aria-selected={g === current}
                  tabIndex={g === current ? 0 : -1}
                  onClick={() => setActive(g)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  {t(GROUP_LABEL[g])}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id={`${tabsId}-p-${current}`}
              aria-labelledby={`${tabsId}-t-${current}`}
            >
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">{t('params.col_name')}</th>
                      <th scope="col" className="r">
                        {t('params.col_value')}
                      </th>
                      <th scope="col">{t('params.col_rule')}</th>
                      <th scope="col">{t('config.effective_from')}</th>
                      <th scope="col">{t('params.col_changed')}</th>
                      <th scope="col">
                        <span className="sr-only">{t('rooms.col_action')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const mayEdit = editorsOf(p).some((r) => session.roles.includes(r));
                      const label = paramLabel(t, p.key);
                      return (
                        <tr key={p.key}>
                          <td>
                            <b>{label}</b>
                            {label !== p.key ? (
                              <>
                                <br />
                                <code className="muted">{p.key}</code>
                              </>
                            ) : null}
                            {p.statusLabel?.includes('GD') ? (
                              <>
                                {' '}
                                <Chip tone="warn">{t('params.status_gd')}</Chip>
                              </>
                            ) : null}
                            {p.statusLabel?.includes('PL') ? (
                              <>
                                {' '}
                                <Chip tone="warn">{t('params.status_pl')}</Chip>
                              </>
                            ) : null}
                          </td>
                          <td className="r num">{formatParamValue(t, p)}</td>
                          <td>{p.brRef ?? '–'}</td>
                          <td>{date(p.effectiveFrom)}</td>
                          <td className="li-s">
                            {[p.changedBy, dateTime(p.changedAt)].filter(Boolean).join(' · ')}
                          </td>
                          <td>
                            {mayEdit ? (
                              <Button
                                size="sm"
                                onClick={() => setEditing(p)}
                                aria-label={`${t('rooms.edit')}: ${label}`}
                              >
                                {t('rooms.edit')}
                              </Button>
                            ) : canEditAny ? (
                              <Chip tone="neutral" icon="lock">
                                {t('config.view_only')}
                              </Chip>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                    {current === 'occupancy' ? (
                      <tr>
                        <td>
                          <b>{t('params.room_capacity')}</b>
                        </td>
                        <td className="r">{t('params.room_capacity_value')}</td>
                        <td>BR-110</td>
                        <td />
                        <td />
                        <td>
                          {canRooms ? (
                            <Link className="btn sm" to={roomsItem.path}>
                              {t('params.open_rooms')}
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Page>
      {editing ? (
        <ParamDialog
          param={editing}
          options={params.find((p) => p.key === 'hold_hours_options')?.value}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </>
  );
}
