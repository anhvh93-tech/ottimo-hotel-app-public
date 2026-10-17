// Structured data of the home page (ADR-014 5, US-154 AC2): LodgingBusiness + WebSite, built from site.json and
// the page copy so the schema always matches what the page shows. No rating, no price, no VacationRental,
// no room count (FB-INV-002 point 1).
import { addressLine, site } from '../content/site';
import type { Copy } from '../content/types';
import { LANGS, OG_IMAGE, SITE_URL, absoluteUrl } from './i18n';

export function homeJsonLd(t: Copy, pageUrl: string): Record<string, unknown> {
  const lodgingId = `${SITE_URL}/#lodging`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LodgingBusiness',
        '@id': lodgingId,
        name: site.name,
        slogan: site.tagline,
        description: t.meta.description,
        url: pageUrl,
        image: [absoluteUrl(OG_IMAGE.path)],
        telephone: site.phone.e164,
        ...(site.contact.email ? { email: site.contact.email } : {}),
        address: {
          '@type': 'PostalAddress',
          streetAddress: `${site.address.street}, ${site.address.ward}`,
          addressLocality: site.address.city,
          addressRegion: site.address.region,
          addressCountry: site.address.country,
        },
        hasMap: site.mapUrl,
        ...(site.facebookUrl ? { sameAs: [site.facebookUrl] } : {}),
        checkinTime: site.checkinTime,
        checkoutTime: site.checkoutTime,
        availableLanguage: [...LANGS],
        amenityFeature: t.amenities.items.map((a) => ({
          '@type': 'LocationFeatureSpecification',
          name: a.title,
          value: true,
        })),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: site.name,
        inLanguage: t.lang,
        publisher: { '@id': lodgingId },
      },
    ],
  };
}

/** JSON for a <script type="application/ld+json"> block: `<` escaped so the text can never close the tag. */
export function jsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export { addressLine };
