import { isApiError } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal } from '@ottimo/ui';
import { useEffect, useId, useRef, useState } from 'react';
import { problemView } from '../../app/problem';
import {
  lastDayOf,
  parseMeter,
  statementsApi,
  type MeterException,
  type MeterType,
  type RecordMeterReadingBody,
} from '../../app/statements';
import { useToast } from '../../app/toast';
import { useWrite } from '../../app/useWrite';
import { usePropertyId } from '../../session/SessionProvider';
import { BelowDialog, TYPES } from './MeterDialogs';

/**
 * S12 – the check-in reading of a stay that came in during month M and has no opening yet (INV 17/11: the opening is
 * always entered; ARC-FE-189-01: the first opening is the `checkin` reading, not a `period_start`). Date, both meters
 * and a photo; one POST. Below the room's last closing → the same two-step warning as the monthly opening
 * (422 `OPENING_BELOW_PREVIOUS_CLOSING` → Wrong entry / Meter replaced (FDL+) / Save anyway with a new key).
 */
export function MeterCheckinDialog({
  reservationId,
  roomId,
  roomNo,
  month,
  today,
  lead,
  onClose,
  onSaved,
}: {
  reservationId: string;
  roomId: string;
  roomNo: string;
  month: string;
  today: string;
  lead: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const maxDay = today < lastDayOf(month) ? today : lastDayOf(month);
  const [readOn, setReadOn] = useState('');
  const [values, setValues] = useState<Record<MeterType, string>>({ electricity: '', water: '' });
  const [ex, setEx] = useState<Record<MeterType, MeterException | null>>({
    electricity: null,
    water: null,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [below, setBelow] = useState<{ type: MeterType; previous: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const up = useWrite();
  const rec = useWrite();

  useEffect(() => {
    if (!photo || typeof URL.createObjectURL !== 'function') return setPreview(null);
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const save = async (ack = false) => {
    setBanner(null);
    const errs: Record<string, string> = {};
    const parsed = {} as Record<MeterType, number>;
    if (!readOn) errs.readOn = t('common.required');
    else if (readOn < `${month}-01` || readOn > maxDay)
      errs.readOn = t('meters.checkin_date_range');
    for (const type of TYPES) {
      const v = parseMeter(values[type], type);
      if (v === null) errs[type] = t('common.required');
      else parsed[type] = v;
    }
    if (!photo) errs.photo = t('meters.photo_required');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      // One file binds to one record: a photo uploaded for a refused POST is reused for the next try.
      let id = photoId;
      if (!id) {
        id = (
          await up.run((key) =>
            statementsApi.uploadMeterPhoto(propertyId, reservationId, photo!, key),
          )
        ).data.id;
        setPhotoId(id);
      }
      const body: RecordMeterReadingBody = {
        roomId,
        kind: 'checkin',
        readOn,
        electricity: { value: parsed.electricity, exception: ex.electricity },
        water: { value: parsed.water, exception: ex.water },
        photoAttachmentId: id,
        note: null,
        ...(ack ? { acknowledgeLowerThanPrevious: true } : {}),
      };
      await rec.run((key) =>
        statementsApi.recordMeterReading(propertyId, reservationId, body, key),
      );
      toast(t('meters.checkin_saved', { room: roomNo }));
      onSaved();
    } catch (err) {
      if (isApiError(err) && err.status >= 400 && err.status < 500) rec.renewKey();
      if (isApiError(err) && err.code === 'OPENING_BELOW_PREVIOUS_CLOSING') {
        const type = (err.problem.meter as MeterType | undefined) ?? 'electricity';
        setBelow({ type, previous: Number(err.problem.previousValue ?? 0) });
        return;
      }
      setBanner(problemView(t, err).text);
    }
  };

  const busy = up.busy || rec.busy;
  return (
    <>
      <Modal
        open
        title={t('meters.checkin_title', { room: roomNo })}
        onClose={onClose}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button variant="pri" disabled={busy} onClick={() => void save()}>
              {t('meters.save')}
            </Button>
          </>
        }
      >
        <div className="stack">
          <p className="li-s">{t('meters.checkin_help')}</p>
          {banner ? <Alert tone="bad">{banner}</Alert> : null}
          <Field label={t('meters.checkin_date')} required error={errors.readOn}>
            {(p) => (
              <input
                {...p}
                className="input"
                type="date"
                min={`${month}-01`}
                max={maxDay}
                value={readOn}
                onChange={(e) => setReadOn(e.target.value)}
              />
            )}
          </Field>
          {TYPES.map((type) => (
            <Field
              key={type}
              label={`${t(`stmt.meter.${type}`)} (${type === 'water' ? 'm³' : 'kWh'})`}
              required
              error={errors[type]}
            >
              {(p) => (
                <input
                  {...p}
                  className="input num mono"
                  inputMode="decimal"
                  autoComplete="off"
                  value={values[type]}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [type]: e.target.value }));
                    setEx((x) => ({ ...x, [type]: null }));
                  }}
                />
              )}
            </Field>
          ))}
          <Field
            label={t('meters.photo')}
            required
            error={errors.photo}
            help={t('meters.photo_help')}
          >
            {(p) => (
              <div className="stack">
                <input
                  {...p}
                  id={`${ids}-photo`}
                  ref={fileRef}
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  tabIndex={-1}
                  onChange={(e) => {
                    setPhoto(e.target.files?.[0] ?? null);
                    setPhotoId(null);
                  }}
                />
                {photo ? (
                  <div className="row meter-photo">
                    {preview ? <img src={preview} alt="" width={48} height={48} /> : null}
                    <span className="li-s grow">{photo.name}</span>
                  </div>
                ) : null}
                <Button size="sm" icon="camera" onClick={() => fileRef.current?.click()}>
                  {photo ? t('meters.photo_change') : t('meters.photo_pick')}
                </Button>
              </div>
            )}
          </Field>
        </div>
      </Modal>
      {below ? (
        <BelowDialog
          type={below.type}
          lead={lead}
          opening={parseMeter(values[below.type], below.type) ?? 0}
          previous={below.previous}
          onWrongEntry={() => setBelow(null)}
          onException={(e) => {
            setEx((x) => ({ ...x, [below.type]: e }));
            setBelow(null);
          }}
          onSaveAnyway={() => {
            setBelow(null);
            void save(true);
          }}
          onClose={() => setBelow(null)}
        />
      ) : null}
    </>
  );
}
