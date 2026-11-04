import type { GuestSummary, LandingLocale, WebsiteBookingRequest } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Button } from '@ottimo/ui';
import { useEffect, useState } from 'react';
import { api } from '../../app/api';
import type { GuestCreatePrefill } from '../GuestFormDialog';
import { usePropertyId } from '../../session/SessionProvider';
import { sendLocaleOf } from './labels';

/** A website request opened in H09/H10/H12 (US-155 AC2): linked by id; its contact only feeds `lookupGuestByContact`. */
export interface WebRequestLink {
  id: string;
  code: string;
  contact?: { phone?: string; email?: string };
  /** The landing language the guest wrote in (US-175 AC4) and the channel they asked for a reply on. */
  locale?: LandingLocale;
  channel?: WebsiteBookingRequest['preferredChannel'];
}

/**
 * US-175 AC4 (3), BUG-R3-050: a profile quick-created from a website request keeps the request's contact, its reply
 * channel (when the profile has that channel) and the language Desk sends messages in (`en` for ko/zh, `ru` for ru);
 * nationality stays empty. An existing profile is never changed (PO P8) – this only fills the "new profile" form.
 */
export function guestPrefillOf(link: WebRequestLink | undefined): GuestCreatePrefill | undefined {
  if (!link) return undefined;
  const out: GuestCreatePrefill = { nationalityCode: '' };
  if (link.locale) out.preferredLocale = sendLocaleOf(link.locale);
  const phone = link.contact?.phone;
  const email = link.contact?.email;
  if (phone) out.phone = phone;
  if (email) out.email = email;
  const ch = link.channel;
  if ((ch === 'zalo' || ch === 'phone') && phone) out.preferredContact = ch;
  else if (ch === 'whatsapp' && phone) {
    out.preferredContact = 'whatsapp';
    out.whatsapp = phone;
  } else if (ch === 'email' && email) out.preferredContact = 'email';
  return out;
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
