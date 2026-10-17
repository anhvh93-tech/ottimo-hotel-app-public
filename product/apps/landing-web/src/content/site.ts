// Facts the landing publishes, validated at build time (ADR-014 4.2, 5). One source for the page, JSON-LD and
// every contact link. A wrong value fails `astro build` instead of reaching the public site.
import { z } from 'astro/zod';
import { SITE_URL } from '../lib/i18n';
import raw from './site.json';

const SITE_HOST = new URL(SITE_URL).hostname.replace(/^www\./, '');

/** The public email must be a shared mailbox on the OTTIMO domain (never a personal address – ADR-014 4.2). */
export function isOttimoMailbox(email: string, host: string = SITE_HOST): boolean {
  const at = email.lastIndexOf('@');
  return at > 0 && email.slice(at + 1).toLowerCase() === host.toLowerCase();
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const siteSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  checkinTime: time,
  checkoutTime: time,
  phone: z.object({
    e164: z.string().regex(/^\+84\d{9}$/),
    local: z.string().min(1),
    international: z.string().regex(/^\+84[\d ]+$/),
  }),
  contact: z.object({
    zaloUrl: z.string().regex(/^https:\/\/(zalo\.me|oa\.zalo\.me)\//),
    whatsappNumber: z.string().regex(/^\d{8,15}$/),
    telegramUrl: z.string().regex(/^https:\/\/t\.me\//),
    viberUrl: z.string().regex(/^viber:\/\/chat\?number=/),
    // Empty = no public mailbox yet: every email link is hidden (ADR-014 4.2).
    email: z.union([
      z.literal(''),
      z.email().refine((e) => isOttimoMailbox(e), 'not an OTTIMO mailbox'),
    ]),
  }),
  address: z.object({
    street: z.string().min(1),
    ward: z.string().min(1),
    city: z.string().min(1),
    region: z.string().min(1),
    country: z.literal('VN'),
  }),
  mapUrl: z.string().regex(/^https:\/\/maps\.app\.goo\.gl\//),
  // Fanpage (FB-INV-002 point 4): a plain link and JSON-LD sameAs – never a Facebook plugin or SDK (SEC C-1).
  facebookUrl: z.union([
    z.literal(''),
    z.string().regex(/^https:\/\/(www\.)?facebook\.com\/[^\s]+$/),
  ]),
  features: z.object({
    // "Yêu cầu đặt phòng" form → Desk, source website (FB-INV-002 point 3, ESC-020 L7, US-155).
    // Off until the endpoint (ARC/BE) and US-155 AC4 (SEC C-2/C-3, ESC-001) are done – see lib/booking-request.ts.
    bookingRequest: z.boolean(),
  }),
});

export type Site = z.infer<typeof siteSchema>;

// zod drops unknown keys such as the "$comment" note of site.json.
export const site: Site = siteSchema.parse(raw);

export const addressLine = [
  site.address.street,
  site.address.ward,
  site.address.city,
  site.address.region,
].join(', ');

export const links = {
  tel: `tel:${site.phone.e164}`,
  zalo: site.contact.zaloUrl,
  telegram: site.contact.telegramUrl,
  viber: site.contact.viberUrl,
  whatsapp: (text?: string) =>
    `https://wa.me/${site.contact.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`,
  mail: (subject?: string) =>
    site.contact.email
      ? `mailto:${site.contact.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`
      : '',
};
