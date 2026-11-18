import { isApiError, type PropertyContact } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { api } from '../app/api';
import { contactFooter, contactIssues } from '../app/goLive';
import { problemView } from '../app/problem';
import { useToast } from '../app/toast';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { useOnline } from '../hooks/useOnline';
import { useResource } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';

/**
 * FB-INV-012 §12.3 (S24, FE-4): the address and hotline printed at the foot of the monthly statement and on the public
 * room page. OWN edits (A129); MGR and FDL read. Values are plain text everywhere – rendered by React as text, never
 * as HTML (SEC 12-04 (c)); a 422 never repeats the value sent.
 */
export function PropertyContactSection() {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const { online } = useOnline();
  const toast = useToast();
  const ids = useId();
  const owner = roles.includes('owner');
  const { state, mutate, reload } = useResource(
    async () => (await api.getPropertyContact({ propertyId })).data,
    [propertyId],
  );
  const c = state.data;
  const [address, setAddress] = useState('');
  const [hotline, setHotline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!c) return;
    setAddress(c.addressLine ?? '');
    setHotline(c.hotline ?? '');
  }, [c]);

  const dirty = !!c && (address !== (c.addressLine ?? '') || hotline !== (c.hotline ?? ''));
  const preview = contactFooter({ addressLine: address, hotline });

  const save = async () => {
    const issues = contactIssues(address, hotline);
    const e: Record<string, string> = {};
    if (issues.address) e.addressLine = t('pc.address_invalid');
    if (issues.hotline) e.hotline = t('pc.hotline_invalid');
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setBanner(null);
    try {
      const body: PropertyContact = {
        addressLine: address.trim() || null,
        hotline: hotline.trim() || null,
      };
      const out = (await api.setPropertyContact({ propertyId }, body)).data;
      mutate(() => out);
      toast(t('pc.saved'));
    } catch (err) {
      if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        const out: Record<string, string> = {};
        for (const fe of err.fieldErrors) {
          const f = fe.field.replace(/^body\./, '');
          out[f] = t(f === 'hotline' ? 'pc.hotline_invalid' : 'pc.address_invalid');
        }
        setErrors(out);
      } else setBanner(problemView(t, err).text);
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card stack mb-12" aria-labelledby={`${ids}-h`}>
      <h2 className="label-h" id={`${ids}-h`}>
        {t('pc.title')}
      </h2>
      <p className="li-s">{t('pc.help')}</p>
      {state.status === 'error' && !c ? (
        <ErrorBlock titleKey="pc.load_error" error={state.error} onRetry={reload} />
      ) : !c ? (
        <LoadingBlock />
      ) : owner ? (
        <>
          {banner ? <Alert tone="bad">{banner}</Alert> : null}
          <div className="g-2">
            <Field label={t('pc.address')} error={errors.addressLine} help={t('pc.address_help')}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  maxLength={200}
                  value={address}
                  onChange={(e) => setAddress(e.target.value.replace(/[\r\n]+/g, ' '))}
                />
              )}
            </Field>
            <Field label={t('pc.hotline')} error={errors.hotline} help={t('pc.hotline_help')}>
              {(p) => (
                <input
                  {...p}
                  className="input mono"
                  inputMode="tel"
                  maxLength={21}
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                />
              )}
            </Field>
          </div>
          <div>
            <span className="label-h">{t('pc.preview')}</span>
            <p className="pc-preview">{preview || t('pc.not_set')}</p>
          </div>
          <div className="row">
            <Button
              variant="pri"
              size="sm"
              busy={busy}
              busyLabel={t('common.saving')}
              disabled={!dirty || !online}
              onClick={() => void save()}
            >
              {t('common.save')}
            </Button>
          </div>
        </>
      ) : (
        <dl className="kv">
          <dt>{t('pc.address')}</dt>
          <dd>{c.addressLine ?? t('pc.not_set')}</dd>
          <dt>{t('pc.hotline')}</dt>
          <dd className="mono">{c.hotline ?? t('pc.not_set')}</dd>
        </dl>
      )}
    </section>
  );
}
