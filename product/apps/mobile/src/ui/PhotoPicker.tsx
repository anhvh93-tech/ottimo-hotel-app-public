import { Icon } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import { useId, useRef, useState } from 'react';
import { compressPhoto } from '../app/image';

/**
 * "Chụp" + photo tiles (DS `.photo-row`). Photos are compressed on the phone (≤ 300 KB) and kept in memory
 * until the form is sent; tiles show "Ảnh n" (no preview – no object URL to leak, nothing on screen to
 * screenshot by a passer-by).
 */
export function PhotoPicker({
  photos,
  onChange,
  max = 4,
  label,
  describedBy,
}: {
  photos: Blob[];
  onChange: (next: Blob[]) => void;
  max?: number;
  label: string;
  describedBy?: string;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const id = useId();

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (input.current) input.current.value = '';
    if (!file) return;
    setBusy(true);
    setError(false);
    try {
      const small = await compressPhoto(file);
      onChange([...photos, small].slice(0, max));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field">
      <span className="lbl" id={`${id}-l`}>
        {label}
      </span>
      <div className="photo-row" role="group" aria-labelledby={`${id}-l`}>
        {photos.map((_, i) => (
          <div className="photo" key={i}>
            <Icon name="camera" />
            <span className="tag">{t('hk.photo_n', { n: i + 1 })}</span>
            <button
              type="button"
              className="btn icon-btn photo-x"
              aria-label={t('hk.photo_remove', { n: i + 1 })}
              onClick={() => onChange(photos.filter((__, j) => j !== i))}
            >
              <Icon name="x" />
            </button>
          </div>
        ))}
        {photos.length < max ? (
          <button
            type="button"
            className="photo add"
            aria-describedby={describedBy}
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <Icon name="camera" />
            <span>{busy ? t('hk.photo_processing') : t('hk.photo_add')}</span>
          </button>
        ) : null}
      </div>
      <input
        ref={input}
        className="hk-file"
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void pick(e.target.files)}
      />
      {error ? (
        <p className="help err" role="alert">
          {t('hk.photo_error')}
        </p>
      ) : null}
    </div>
  );
}
