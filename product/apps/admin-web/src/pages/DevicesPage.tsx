import {
  isApiError,
  newIdempotencyKey,
  type StrongReauth,
  type TrustedDevice,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, Chip, Field, Seg } from '@ottimo/ui';
import { useId, useRef, useState, type FormEvent } from 'react';
import { api } from '../app/api';
import { fieldErrors, problemView } from '../app/problem';
import { useToast } from '../app/toast';
import { Page, Topbar } from '../components/AppShell';
import { SecondFactorField, secondFactor } from '../components/SecondFactorField';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { isStrongReauthError, StrongReauthDialog } from '../components/StrongReauthDialog';
import { useOnline } from '../hooks/useOnline';
import { useResource } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';

const CHECKS = ['disk', 'lock', 'ext', 'clip'] as const;
type Kind = 'desk' | 'facility_mobile';

export function deviceStatus(d: TrustedDevice, now = Date.now()): 'active' | 'expired' | 'revoked' {
  if (d.revokedAt) return 'revoked';
  return Date.parse(d.expiresAt) <= now ? 'expired' : 'active';
}

/** H07 7.2 – devices granted access to C3 data (US-142, owner only). Grant only from the device itself. */
export function DevicesPage() {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const toast = useToast();
  const { online } = useOnline();
  const ids = useId();
  const list = useResource(async () => {
    const [devices, params] = await Promise.all([
      api.listTrustedDevices({ propertyId }),
      api.listParameters({ propertyId }).catch(() => null),
    ]);
    const val = (k: string) => params?.data.data.find((p) => p.key === k)?.value;
    return {
      devices: devices.data.data,
      deskDays: (val('trusted_device_days') as number | undefined) ?? 180,
      mobileDays: (val('trusted_device_mobile_days') as number | undefined) ?? 30,
    };
  }, [propertyId]);

  const [name, setName] = useState('');
  const [kind, setKind] = useState<Kind>('desk');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [opsChecked, setOpsChecked] = useState(false);
  const [password, setPassword] = useState('');
  // S2 (0.3.8, SEC 06.27): + TOTP / recovery code once the owner has 2FA (BE-C 8712822).
  const hasMfa = session.me?.mfaEnabled === true;
  const [factor, setFactor] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idem = useRef(newIdempotencyKey());
  const [revoking, setRevoking] = useState<TrustedDevice | null>(null);
  const [reason, setReason] = useState('');

  // "Đội kỹ thuật đã kiểm" replaces the 4 individual checks (H07 7.2 behaviour).
  const missing = opsChecked ? 0 : CHECKS.filter((c) => !checks[c]).length;

  const grant = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('common.required');
    else if (name.trim().length > 80) errs.name = t('field_error.too_long', { max: 80 });
    if (!password) errs.currentPassword = t('common.required');
    const second = secondFactor(factor, useRecovery);
    if (hasMfa && !second.totpCode && !second.recoveryCode) errs.factor = t('common.required');
    if (missing > 0) errs.checklist = t('field_error.checklist_required');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setBanner(null);
    try {
      const { data } = await api.trustCurrentDevice(
        { propertyId },
        {
          name: name.trim(),
          deviceKind: kind,
          currentPassword: password,
          ...(hasMfa ? second : {}),
          hardeningChecklistConfirmed: true,
        },
        idem.current,
      );
      toast(t('device.granted', { device: data.name }));
      setPassword('');
      setFactor('');
      idem.current = newIdempotencyKey();
      await session.refresh();
      list.reload();
    } catch (err) {
      setPassword('');
      setFactor('');
      if (isApiError(err) && err.code === 'REAUTH_FAILED') {
        // With 2FA one sentence for both factors (SEC 06.20); without, the password field as before.
        if (hasMfa) setBanner(t('reauth.s2_failed'));
        else setErrors({ currentPassword: t('field_error.current_password_wrong') });
      } else if (isStrongReauthError(err)) {
        setErrors({ factor: t('common.required') });
      } else if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        setErrors(fieldErrors(t, err, { value: name.trim() }));
      } else {
        setBanner(problemView(t, err).text);
      }
    } finally {
      setBusy(false);
    }
  };

  /** S2 (CỔNG, SEC 06.27): a wrong/missing factor stays in the dialog; anything else closes it. */
  const revoke = async (reauth: StrongReauth) => {
    if (!revoking) return;
    try {
      await api.revokeTrustedDevice(
        { propertyId, deviceId: revoking.id },
        reason.trim() || undefined,
        reauth,
        newIdempotencyKey(),
      );
      toast(t('device.revoked', { device: revoking.name }));
      if (revoking.isCurrentDevice) await session.refresh();
      setRevoking(null);
      setReason('');
      list.reload();
    } catch (err) {
      if (isStrongReauthError(err)) throw err;
      setBanner(problemView(t, err).text);
      setRevoking(null);
    }
  };

  const data = list.state.data;
  const devices = [...(data?.devices ?? [])].sort((a, b) => {
    const sa = deviceStatus(a) === 'active' ? 0 : 1;
    const sb = deviceStatus(b) === 'active' ? 0 : 1;
    return sa - sb || a.expiresAt.localeCompare(b.expiresAt);
  });

  return (
    <>
      <Topbar title={t('device.title')} />
      <Page>
        {banner ? <Alert tone="bad">{banner}</Alert> : null}
        {!session.deviceTrusted ? (
          <form
            className="card"
            style={{ marginBottom: 16 }}
            onSubmit={grant}
            noValidate
            aria-labelledby={`${ids}-h`}
          >
            <Alert tone="warn" icon="monitor">
              <span id={`${ids}-h`}>{t('device.this_untrusted')}</span>
            </Alert>
            <div className="g-2">
              <Field label={t('device.grant_name')} required error={errors.name}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
              </Field>
              <div className="field">
                <span className="lbl" id={`${ids}-kind`}>
                  {t('device.kind')}
                </span>
                <Seg<Kind>
                  labelledBy={`${ids}-kind`}
                  value={kind}
                  onChange={setKind}
                  options={[
                    { value: 'desk', label: t('device.kind_desk') },
                    { value: 'facility_mobile', label: t('device.kind_mobile') },
                  ]}
                />
                <span className="help">
                  {t('device.kind_help', {
                    desk_days: data?.deskDays ?? 180,
                    mobile_days: data?.mobileDays ?? 30,
                  })}
                </span>
              </div>
            </div>
            <fieldset
              className={`field${errors.checklist ? ' invalid' : ''}`}
              style={{ border: 0, margin: '0 0 12px', padding: 0 }}
            >
              <legend
                className="lbl"
                style={{ fontWeight: 500, fontSize: '.8125rem', marginBottom: 4 }}
              >
                {t('device.check_legend')}{' '}
                <span className="req" aria-hidden="true">
                  *
                </span>
              </legend>
              <div className="g-2">
                {CHECKS.map((c) => (
                  <Checkbox
                    key={c}
                    checked={Boolean(checks[c])}
                    onChange={(on) => setChecks({ ...checks, [c]: on })}
                  >
                    {t(`device.check.${c}`)}
                  </Checkbox>
                ))}
              </div>
              <Checkbox checked={opsChecked} onChange={setOpsChecked}>
                {t('device.check.ops')}
              </Checkbox>
              {errors.checklist ? (
                <div className="err" role="alert">
                  {errors.checklist}
                </div>
              ) : null}
            </fieldset>
            <div className="g-2">
              <Field label={t('device.grant_confirm')} required error={errors.currentPassword}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Field>
              {hasMfa ? (
                <div>
                  <SecondFactorField
                    value={factor}
                    onChange={setFactor}
                    useRecovery={useRecovery}
                    error={errors.factor}
                    onToggle={() => {
                      setUseRecovery((v) => !v);
                      setFactor('');
                    }}
                  />
                </div>
              ) : null}
              <div style={{ alignSelf: 'end', marginBottom: 14 }}>
                <Button
                  type="submit"
                  variant="pri"
                  busy={busy}
                  busyLabel={t('common.saving')}
                  disabled={!online || missing > 0}
                >
                  {missing > 0 ? t('device.grant_locked', { n: missing }) : t('device.grant')}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <Alert tone="ok" icon="shield" role="status">
            {t('device.this_trusted')}
          </Alert>
        )}

        {list.state.status === 'error' && !data ? (
          <ErrorBlock
            titleKey="device.error_title"
            error={list.state.error}
            onRetry={list.reload}
          />
        ) : list.state.status === 'loading' && !data ? (
          <LoadingBlock />
        ) : devices.length === 0 ? (
          <p className="muted">{t('device.empty')}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">{t('device.title')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('device.col_device')}</th>
                  <th scope="col">{t('device.col_by')}</th>
                  <th scope="col">{t('device.col_last')}</th>
                  <th scope="col">{t('device.col_expires')}</th>
                  <th scope="col">{t('users.col_status')}</th>
                  <th scope="col">
                    <span className="sr-only">{t('rooms.col_action')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => {
                  const st = deviceStatus(d);
                  return (
                    <tr key={d.id}>
                      <td>
                        <b>{d.name}</b>{' '}
                        {d.isCurrentDevice ? <Chip tone="info">{t('device.this')}</Chip> : null}
                        <br />
                        <span className="li-s">
                          {d.deviceKind === 'desk'
                            ? t('device.kind_desk')
                            : t('device.kind_mobile')}
                        </span>
                      </td>
                      <td>
                        {d.createdByName ?? '–'}
                        <br />
                        <span className="li-s">{dateTime(d.createdAt)}</span>
                      </td>
                      <td>{d.lastSeenAt ? dateTime(d.lastSeenAt) : '–'}</td>
                      <td>{dateTime(d.expiresAt)}</td>
                      <td>
                        {st === 'active' ? (
                          <Chip tone="ok" icon="check">
                            {t('device.status_active')}
                          </Chip>
                        ) : st === 'expired' ? (
                          <Chip tone="warn" icon="clock">
                            {t('device.status_expired')}
                          </Chip>
                        ) : (
                          <Chip tone="neutral" icon="x">
                            {t('device.status_revoked')}
                          </Chip>
                        )}
                      </td>
                      <td>
                        {st === 'active' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!online}
                            aria-label={`${t('device.revoke')}: ${d.name}`}
                            onClick={() => setRevoking(d)}
                          >
                            {t('device.revoke')}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Page>
      {revoking ? (
        <StrongReauthDialog
          open
          title={t('device.revoke_title', { device: revoking.name })}
          confirmLabel={t('device.revoke')}
          danger
          onClose={() => {
            setRevoking(null);
            setReason('');
          }}
          onConfirm={revoke}
        >
          <p style={{ marginTop: 0 }}>{t('device.revoke_body', { device: revoking.name })}</p>
          <Field label={t('device.revoke_reason')}>
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={200}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </Field>
        </StrongReauthDialog>
      ) : null}
    </>
  );
}
