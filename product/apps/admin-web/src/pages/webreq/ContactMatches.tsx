import type { GuestSummary } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Button } from '@ottimo/ui';
import { useEffect, useState } from 'react';
import { api } from '../../app/api';
import { usePropertyId } from '../../session/SessionProvider';

/** A website request opened in H09/H10/H12 (US-155 AC2): linked by id; its contact only feeds `lookupGuestByContact`. */
export interface WebRequestLink {
  id: string;
  code: string;
  contact?: { phone?: string; email?: string };
}

/**
 * US-155 AC2: profiles that already have the request's phone / email (`lookupGuestByContact`, POST – the contact stays
 * out of the URL). Staff check it is the same person before choosing; no automatic merge (BR-951).
 */
export function ContactMatches({
  contact,
  chosen,
  onPick,
}: {
  contact: { phone?: string; email?: string };
  chosen: GuestSummary | null;
  onPick: (g: GuestSummary) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const [matches, setMatches] = useState<GuestSummary[] | null>(null);
  useEffect(() => {
    let live = true;
    const body = contact.phone ? { phone: contact.phone } : { email: contact.email };
    api.lookupGuestByContact({ propertyId }, body).then(
      (out) => {
        if (live) setMatches(out.data.matches ?? []);
      },
      () => {
        if (live) setMatches([]);
      },
    );
    return () => {
      live = false;
    };
  }, [propertyId, contact.phone, contact.email]);
  if (!matches) return null;
  return (
    <div className="stack">
      <p className="li-s">{t(matches.length ? 'webreq.contact_matches' : 'webreq.contact_none')}</p>
      {matches.length ? (
        <ul className="list-plain">
          {matches.map((m) => (
            <li key={m.id} className="row wrap">
              <span>
                {m.displayName} · <span className="mono">{m.code}</span>
                {m.phoneMasked ? ` · ${m.phoneMasked}` : ''}
              </span>
              <Button size="sm" onClick={() => onPick(m)} disabled={chosen?.id === m.id}>
                {t('webreq.pick')}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {chosen ? (
        <p className="li-s" role="status">
          {t('webreq.picked', { name: chosen.displayName })}
        </p>
      ) : null}
    </div>
  );
}
