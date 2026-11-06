import { isApiError, type AuditEvent, type PropertyWifi } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal } from '@ottimo/ui';
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { monoArgs } from '../app/mono';
import { problemView } from '../app/problem';
import { addDays } from '../app/reservations';
import { useToast } from '../app/toast';
import {
  WIFI_LOG_DAYS,
  WIFI_PASSWORD_MAX,
  WIFI_PASSWORD_MIN,
  WIFI_SSID_MAX_BYTES,
  wifiChangeOf,
  wifiErrorKey,
  wifiServerErrors,
  wifiShapeErrors,
  type WifiField,
  type WifiFieldError,
} from '../app/wifi';
import { Page, Topbar } from '../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { useOnline } from '../hooks/useOnline';
import { useResource } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';

/** Every argument a Wi-Fi sentence of this field may use – always passed (no `{x}` on screen). */
const ARGS: Record<WifiField, Record<string, number>> = {
  ssid: { max: WIFI_SSID_MAX_BYTES },
  password: { min: WIFI_PASSWORD_MIN, max: WIFI_PASSWORD_MAX },
};

/** A Wi-Fi value in JetBrains Mono, spaces kept visible (DOM FB-R5-DOM-UXD-120-03 ý 3: l/1, O/0, spaces). */
const VALUE: CSSProperties = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' };

/**
 * S36 – Wi-Fi of the property (V5-58, BUG-R3-021 Desk part; OpenAPI 0.3.13 `getPropertyWifi`, `setPropertyWifi`).
 * One shared network for the whole property (ESC-022 B, BR-012 (7)); the stay page reads the same column.
 * - OWN/MGR read and change it (A101). FDL/FD read it to tell guests at the desk (rbac note 47).
 * - The answer is `no-store` on the server; the Desk keeps no copy outside this page's state.
 * - Saving goes through a review step "Guests will see …" (contract, SEC ARC-04); an empty password says
 *   "open network" in words (DOM FB-R5-DOM-UXD-120-03 ý 1).
 * [CHỜ UXD] no hi-fi for this screen – built from DS card / dl / modal like H05 "Tài khoản nhận".
 */
export function WifiPage() {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const toast = useToast();
  const ids = useId();
  const canEdit = session.roles.some((r) => r === 'owner' || r === 'manager');
  const { state, reload } = useResource(
    async () => (await api.getPropertyWifi({ propertyId })).data,
    [propertyId],
  );
  const [editing, setEditing] = useState(false);
  const [saves, setSaves] = useState(0);
  const wifi = state.data;

  return (
    <>
      <Topbar title={t('nav.wifi')} sub={t('wifi.subtitle')} />
      <Page>
        {state.status === 'error' && !wifi ? (
          <ErrorBlock
            titleKey="wifi.error_title"
            error={state.error}
            onRetry={reload}
            autoRetrySeconds={state.autoRetrySeconds}
          />
        ) : state.status === 'loading' && !wifi ? (
          <LoadingBlock rows={2} />
        ) : wifi ? (
          <section className="card" aria-labelledby={`${ids}-h`}>
            <div className="row">
              <h2 id={`${ids}-h`} className="grow" style={{ margin: 0 }}>
                {t('wifi.current_title')}
              </h2>
              {canEdit ? (
                <Button size="sm" icon="wifi" onClick={() => setEditing(true)}>
                  {t(wifi.configured ? 'wifi.edit' : 'wifi.enter')}
                </Button>
              ) : null}
            </div>
            <WifiValue wifi={wifi} canEdit={canEdit} />
            <p className="li-s mt-8" style={{ marginBottom: 0 }}>
              {canEdit ? t('wifi.change_help') : t('wifi.read_help')}
            </p>
          </section>
        ) : null}
        {canEdit ? <WifiLog propertyId={propertyId} reloadKey={saves} /> : null}
      </Page>
      {editing ? (
        <WifiDialog
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            toast(t('wifi.saved'));
            setSaves((n) => n + 1);
            reload();
          }}
        />
      ) : null}
    </>
  );
}

function WifiValue({ wifi, canEdit }: { wifi: PropertyWifi; canEdit: boolean }) {
  const { t } = useI18n();
  if (!wifi.configured) {
    return (
      <Alert tone="warn">
        {t('wifi.none')}
        {canEdit ? null : <> {t('wifi.none_ask')}</>}
      </Alert>
    );
  }
  // `passwordSet` (0.3.13 bổ sung 1) – an older answer without it: an empty / absent password is an open network.
  const open = wifi.passwordSet === false || !wifi.password;
  return (
    <dl className="dl mt-8">
      <dt>{t('wifi.ssid')}</dt>
      <dd>
        <span className="mono" style={VALUE}>
          {wifi.ssid}
        </span>
      </dd>
      <dt>{t('wifi.password')}</dt>
      <dd>
        {open ? (
          t('wifi.open_network')
        ) : (
          <span className="mono" style={VALUE}>
            {wifi.password}
          </span>
        )}
      </dd>
    </dl>
  );
}

/** DOM FB-R5-DOM-UXD-120-03 ý 2: the last saves, said in words – "saved again, no change" is never "changed". */
function WifiLog({ propertyId, reloadKey }: { propertyId: string; reloadKey: number }) {
  const { t, dateTime } = useI18n();
  const session = useSession();
  const ids = useId();
  const to = todayLocal(session.property?.timezone);
  const from = addDays(to, -(WIFI_LOG_DAYS - 1));
  const { state } = useResource(
    async () => (await api.listPropertyWifiChanges({ propertyId }, from, to)).data.data,
    [propertyId, from, to, reloadKey],
  );
  const rows = state.data ?? [];
  return (
    <section className="card mt-8" aria-labelledby={`${ids}-log`}>
      <h3 id={`${ids}-log`} style={{ marginTop: 0 }}>
        {t('wifi.log_title')}
      </h3>
      {state.status === 'error' && !state.data ? (
        <p className="li-s">{problemView(t, state.error).text}</p>
      ) : state.status === 'loading' && !state.data ? (
        <p className="muted">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="muted" style={{ marginBottom: 0 }}>
          {t('wifi.log_empty', { days: WIFI_LOG_DAYS })}
        </p>
      ) : (
        <ul className="list">
          {rows.map((e, i) => (
            <li key={`${e.occurredAt}-${i}`}>
              <div className="grow">
                <WifiChangeLine e={e} />
                <div className="caption">
                  {[e.actorName, dateTime(e.occurredAt)].filter(Boolean).join(' · ')}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WifiChangeLine({ e }: { e: AuditEvent }) {
  const { t } = useI18n();
  const c = wifiChangeOf(e);
  if (c.kind === 'first') return <b>{monoArgs(t, 'wifi.log_first', { to: c.to }, ['to'])}</b>;
  if (c.kind === 'unchanged') return <b>{t('wifi.log_unchanged')}</b>;
  return (
    <b>
      {c.ssid ? monoArgs(t, 'wifi.log_ssid', c.ssid, ['from', 'to']) : null}
      {c.ssid && c.password ? ' · ' : null}
      {c.password ? t('wifi.log_password') : null}
    </b>
  );
}

type Errors = Partial<Record<WifiField, WifiFieldError>>;

/**
 * Enter / change the Wi-Fi (A101). SEC ARC-04 (contract 1.23): both boxes start empty and are never filled by
 * the browser – plain text boxes (never `type="password"`), `autocomplete="off"` on the form and both boxes,
 * `name`/`id` without user/login/pass; the values live only in this dialog's state (gone when it closes).
 */
function WifiDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { online } = useOnline();
  const ids = useId();
  const formId = `${ids}-form`;
  const [ssid, setSsid] = useState('');
  const [key, setKey] = useState('');
  const [masked, setMasked] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const name = ssid.trim();
  const open = key === '';

  const errorText = (f: WifiField) => {
    const kind = errors[f];
    return kind ? t(wifiErrorKey(f, kind), ARGS[f]) : undefined;
  };

  const toReview = (ev: FormEvent) => {
    ev.preventDefault();
    const e = wifiShapeErrors(ssid, key);
    setErrors(e);
    setBanner(null);
    if (Object.keys(e).length === 0) setStep('review');
  };

  const save = async () => {
    setBusy(true);
    setBanner(null);
    try {
      await api.setPropertyWifi({ propertyId }, { ssid: name, password: key });
      onSaved();
    } catch (err) {
      if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        const e = wifiServerErrors(err.fieldErrors);
        if (Object.keys(e).length) {
          // Room number / staff sign-in name in the name, or the caller's own sign-in password (SR-RL-15).
          setErrors(e);
          setStep('form');
          return;
        }
      }
      setBanner(problemView(t, err).text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={step === 'form' ? t('wifi.form_title') : t('wifi.review_title')}
      closeLabel={t('common.close')}
      onClose={onClose}
      dirty={ssid !== '' || key !== ''}
      unsavedLabels={{
        title: t('common.unsaved_title'),
        body: t('common.unsaved_body'),
        keep: t('common.unsaved_keep'),
        discard: t('common.unsaved_discard'),
      }}
      footer={
        step === 'form' ? (
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" form={formId} variant="pri">
              {t('wifi.review')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setStep('form')} disabled={busy}>
              {t('common.edit_back')}
            </Button>
            <Button
              variant="pri"
              busy={busy}
              busyLabel={t('common.saving')}
              disabled={!online}
              onClick={() => void save()}
            >
              {t('wifi.save')}
            </Button>
          </>
        )
      }
    >
      {banner ? <Alert tone="bad">{banner}</Alert> : null}
      {step === 'form' ? (
        <form id={formId} onSubmit={toReview} noValidate autoComplete="off">
          <p className="muted" style={{ marginTop: 0 }}>
            {t('wifi.form_lead')}
          </p>
          <Field
            label={t('wifi.ssid')}
            required
            help={t('wifi.ssid_help', ARGS.ssid)}
            error={errorText('ssid')}
          >
            {(p) => (
              <input
                {...p}
                className="input mono"
                name="wifiNetworkName"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore=""
                data-lpignore="true"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
              />
            )}
          </Field>
          <Field
            label={t('wifi.password')}
            help={t('wifi.password_help', ARGS.password)}
            error={errorText('password')}
          >
            {(p) => (
              <div className="input-affix">
                <input
                  {...p}
                  className={`input mono${masked ? ' wifi-masked' : ''}`}
                  name="wifiKey"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  data-1p-ignore=""
                  data-lpignore="true"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <button
                  type="button"
                  className="btn ghost sm"
                  style={{ borderRadius: 0 }}
                  aria-pressed={!masked}
                  aria-controls={p.id}
                  onClick={() => setMasked((v) => !v)}
                >
                  {t(masked ? 'login.show_password' : 'login.hide_password')}
                </button>
              </div>
            )}
          </Field>
        </form>
      ) : (
        <div className="stack">
          <p className="muted" style={{ margin: 0 }}>
            {t('wifi.review_lead')}
          </p>
          <dl className="dl">
            <dt>{t('wifi.ssid')}</dt>
            <dd>
              <span className="mono" style={VALUE}>
                {name}
              </span>
            </dd>
            <dt>{t('wifi.password')}</dt>
            <dd>
              {open ? (
                t('wifi.open_network')
              ) : (
                <span className="mono" style={VALUE}>
                  {key}
                </span>
              )}
            </dd>
          </dl>
          {open ? <Alert tone="warn">{t('wifi.review_open_note')}</Alert> : null}
          <p className="li-s" style={{ margin: 0 }}>
            {t('wifi.review_applies')}
          </p>
        </div>
      )}
    </Modal>
  );
}
