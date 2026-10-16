import type { Guest, GuestSummary } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Icon, StateView } from '@ottimo/ui';
import { useId, useState } from 'react';
import { api } from '../app/api';
import { findGuests } from '../app/guestSearch';
import { problemView } from '../app/problem';
import { Page, Topbar } from '../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { useDebounced } from '../hooks/useDebounced';
import { useOnline } from '../hooks/useOnline';
import { useResource } from '../hooks/useResource';
import { usePropertyId } from '../session/SessionProvider';
import { GuestFormDialog } from './GuestFormDialog';
import { GUEST_TAGS } from './guestCatalog';

/** H06 6.1 – guest search (accent-insensitive, US-073) + create/edit profile (US-071/072). */
export function GuestsPage() {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { online } = useOnline();
  const searchId = useId();
  const [q, setQ] = useState('');
  const query = useDebounced(q.trim(), 300);
  const [dialog, setDialog] = useState<{ mode: 'new' } | { mode: 'edit'; guest: Guest } | null>(
    null,
  );
  /** Opening a profile failed: one alert with Thử lại, gone when the search changes (FB-R2-UXD-FE-12). */
  const [openError, setOpenError] = useState<{ text: string; guestId: string } | null>(null);
  const active = query.length >= 2;
  const { state, reload } = useResource(
    async () => (active ? findGuests(propertyId, query, false) : ([] as GuestSummary[])),
    [propertyId, query, active],
  );

  const openGuest = async (id: string) => {
    setOpenError(null);
    try {
      const { data } = await api.getGuest({ propertyId, guestId: id });
      setDialog({ mode: 'edit', guest: data });
    } catch (err) {
      setOpenError({ text: problemView(t, err).text, guestId: id });
    }
  };

  const tagLabel = (v: string) => {
    const k = GUEST_TAGS.find((g) => g.value === v)?.label;
    return k ? t(k) : v;
  };
  const rows = state.data ?? [];

  return (
    <>
      <Topbar
        title={t('nav.guests')}
        actions={
          <Button
            variant="pri"
            icon="plus"
            disabled={!online}
            onClick={() => setDialog({ mode: 'new' })}
          >
            {t('crm.new_cta')}
          </Button>
        }
      />
      <Page>
        <div className="row" style={{ marginBottom: 12 }} role="search">
          <label className="search" style={{ width: 380 }} htmlFor={searchId}>
            <Icon name="search" />
            <span className="sr-only">{t('crm.search_label')}</span>
            <input
              id={searchId}
              type="search"
              placeholder={t('crm.search_ph')}
              value={q}
              autoComplete="off"
              onChange={(e) => {
                setQ(e.target.value);
                setOpenError(null);
              }}
            />
          </label>
          {active && state.status === 'ready' ? (
            <span className="li-s" role="status">
              {t('crm.results', { n: rows.length })}
            </span>
          ) : null}
        </div>
        {openError ? (
          <Alert
            tone="bad"
            title={t('crm.error_title')}
            actions={
              <>
                <Button size="sm" onClick={() => void openGuest(openError.guestId)}>
                  {t('common.retry')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpenError(null)}>
                  {t('common.close')}
                </Button>
              </>
            }
          >
            {openError.text}
          </Alert>
        ) : null}
        {!active ? (
          <StateView icon="search" title={t('crm.prompt_title')}>
            {t('crm.prompt_body')}
          </StateView>
        ) : state.status === 'error' ? (
          <ErrorBlock titleKey="crm.error_title" error={state.error} onRetry={reload} />
        ) : state.status === 'loading' ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <StateView
            icon="search"
            title={t('crm.empty_title', { q: query })}
            action={
              <Button disabled={!online} onClick={() => setDialog({ mode: 'new' })}>
                {t('crm.new_cta')}
              </Button>
            }
          >
            {t('crm.empty_body')}
          </StateView>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">{t('nav.guests')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('crm.col_code')}</th>
                  <th scope="col">{t('crm.col_name')}</th>
                  <th scope="col">{t('crm.col_contact')}</th>
                  <th scope="col">{t('crm.col_nat')}</th>
                  <th scope="col">{t('crm.col_tags')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td className="mono">{g.code}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => void openGuest(g.id)}
                      >
                        <b>{g.displayName}</b>
                      </button>
                      {/* 0.3.4 Q7: same name + date of birth as another profile (FD+ only). */}
                      {g.possibleDuplicate ? (
                        <>
                          {' '}
                          <Chip tone="warn" icon="alert">
                            {t('crm.suspect_dup')}
                          </Chip>
                        </>
                      ) : null}
                    </td>
                    <td className="num">{g.phoneMasked ?? '–'}</td>
                    <td>{g.nationalityCode ?? '–'}</td>
                    <td>
                      {g.tags?.length
                        ? g.tags.map((tag) => (
                            <Chip key={tag} tone="oak">
                              {tagLabel(tag)}
                            </Chip>
                          ))
                        : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page>
      {dialog ? (
        <GuestFormDialog
          key={dialog.mode === 'edit' ? dialog.guest.id : 'new'}
          guest={dialog.mode === 'edit' ? dialog.guest : undefined}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            reload();
          }}
          onOpenGuest={(id) => void openGuest(id)}
        />
      ) : null}
    </>
  );
}
