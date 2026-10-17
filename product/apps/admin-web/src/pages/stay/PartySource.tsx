import type { Reservation } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Field } from '@ottimo/ui';
import { useId, useState } from 'react';
import { useCatalog } from '../../app/catalog';
import { channelName } from '../../app/reservations';
import { usePropertyId } from '../../session/SessionProvider';

export type PartyChangeSource = 'ota_modification' | 'guest_direct';

/**
 * 0.3.6 bổ sung 4 (DOM OTA rule, BR-110/307): changing the guest count of an OTA booking before
 * check-in needs its source. `otaGuestCount` is only set on OTA bookings.
 */
export const needsPartySource = (r: Reservation) =>
  r.otaGuestCount !== null &&
  r.otaGuestCount !== undefined &&
  (r.status === 'hold' || r.status === 'confirmed');

export function usePartySource() {
  // Default "Khách báo trực tiếp" (no proof) – the OTA option needs the extranet reference.
  const [source, setSource] = useState<PartyChangeSource>('guest_direct');
  const [ref, setRef] = useState('');
  return {
    source,
    setSource,
    ref,
    setRef,
    body: () =>
      source === 'ota_modification'
        ? { partyChangeSource: source, otaModificationRef: ref.trim() }
        : { partyChangeSource: source },
  };
}

/**
 * UXD s3 H: two radios in a fieldset with a visible legend, "Khách báo trực tiếp" pre-selected; the
 * help says the money consequence of each; the extranet reference only for "Khách đã sửa đơn trên …".
 */
export function PartySourceField({
  reservation: r,
  state,
  fields,
}: {
  reservation: Reservation;
  state: ReturnType<typeof usePartySource>;
  fields: Record<string, string>;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const catalog = useCatalog(propertyId);
  const channel = channelName(catalog.channels, r.channelCode, r.channelId);
  const ids = useId();
  return (
    <fieldset className="fieldset-plain" aria-describedby={`${ids}-help`}>
      <legend className="label-h">{t('rsv.party_source.legend')}</legend>
      <p className="li-s">{t('rsv.ota_guest_count', { n: r.otaGuestCount ?? 0 })}</p>
      <label className="check">
        <input
          type="radio"
          name={`${ids}-source`}
          checked={state.source === 'guest_direct'}
          onChange={() => state.setSource('guest_direct')}
        />
        {t('rsv.party_source.guest_direct')}
      </label>
      <label className="check">
        <input
          type="radio"
          name={`${ids}-source`}
          checked={state.source === 'ota_modification'}
          onChange={() => state.setSource('ota_modification')}
        />
        {t('rsv.party_source.ota_modification', { channel })}
      </label>
      <p className="li-s" id={`${ids}-help`}>
        {state.source === 'ota_modification'
          ? t('rsv.party_source.ota_modification_help')
          : t('rsv.party_source.guest_direct_help', { channel })}
      </p>
      {fields.partyChangeSource ? (
        <div className="field invalid">
          <div className="err" role="alert">
            {fields.partyChangeSource}
          </div>
        </div>
      ) : null}
      {state.source === 'ota_modification' ? (
        <Field
          label={t('rsv.ota_mod_ref')}
          help={t('rsv.ota_mod_ref_help')}
          required
          error={fields.otaModificationRef}
        >
          {(p) => (
            <input
              {...p}
              className="input mono"
              maxLength={64}
              autoComplete="off"
              value={state.ref}
              onChange={(e) => state.setRef(e.target.value)}
            />
          )}
        </Field>
      ) : null}
    </fieldset>
  );
}
