import { Icon } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import { useEffect, useState } from 'react';
import { staffApi } from '../app/api';

type Slot = { id: string; url?: string; failed?: boolean };

/**
 * "Ảnh lúc báo" (H22 22.2): photos of a work order through `getAttachment` (C2, B-01 – cookie fetch,
 * `no-store`, decrypted server-side). Online only, never cached: each photo becomes an object URL that is
 * revoked when the screen closes. A photo deleted by retention (404) shows a plain tile.
 */
export function AttachmentPhotos({
  propertyId,
  ids,
  title,
  online,
}: {
  propertyId: string;
  ids: readonly string[];
  title: string;
  online: boolean;
}) {
  const { t } = useI18n();
  const [slots, setSlots] = useState<Slot[]>(() => ids.map((id) => ({ id })));
  const key = ids.join(',');

  useEffect(() => {
    if (!online || !key) return;
    let alive = true;
    const urls: string[] = [];
    setSlots(key.split(',').map((id) => ({ id })));
    for (const id of key.split(',')) {
      staffApi.getAttachment(propertyId, id).then(
        (blob) => {
          if (!alive) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          setSlots((s) => s.map((x) => (x.id === id ? { id, url } : x)));
        },
        () => alive && setSlots((s) => s.map((x) => (x.id === id ? { id, failed: true } : x))),
      );
    }
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [propertyId, key, online]);

  if (!ids.length) return null;
  return (
    <section aria-labelledby="wo-photos-h">
      <h2 className="grp-h" id="wo-photos-h">
        {title}
      </h2>
      <div className="photo-row">
        {slots.map((s, i) =>
          s.url ? (
            <a
              key={s.id}
              className="photo hk-photo"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={s.url} alt={t('hk.photo_n', { n: i + 1 })} />
            </a>
          ) : (
            <div key={s.id} className="photo" role="img" aria-label={t('hk.photo_n', { n: i + 1 })}>
              <Icon name="camera" />
              <span className="tag">
                {s.failed
                  ? t('staff.photo_load_error')
                  : !online
                    ? t('hk.need_network')
                    : t('common.loading')}
              </span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
