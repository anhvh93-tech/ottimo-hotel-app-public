// Photo sets of R3-Q52 (INV 22/10 + 23/10): the hero slideshow and one OTA-style gallery per room type. Language
// independent – the alt text of every id lives in the page copy (`photoAlt`), checked in copy.test.ts.
// Hero slides: content/hero.ts (by INV's picker numbers). Photos = the files UXD's tool optimised
// (src/assets/photos/CREDITS.md). Room types with fewer than
// GALLERY_TARGET photos are listed in the FE report so INV can send more (bathroom, balcony, the 1.4 m extra bed…).
import type { RoomSlug } from './types';

/**
 * Fixed photo of the Amenities section: picker 30 since 24/10 (UXD FB-R3-UXD-FE-02). Editorial photos (The Stay,
 * Amenities, Location) never repeat a hero slide; room covers and galleries may (copy.test.ts).
 */
export const AMENITIES_PHOTO = 'signature-laundry-dining';

/**
 * Portrait facade at dusk (picker 4) in #book since 25/10 – INV: the hero shows landscape photos only. Id kept from
 * its hero days (OG image `pnpm og` and the optimiser use it).
 */
export const BOOK_PHOTO = 'hero-facade-dusk';

/** Seconds between two hero photos (INV 22/10: "mỗi 3 giây"). */
export const HERO_INTERVAL_MS = 3000;

/** Photos per room type; the first one is the cover of the room card. */
export const ROOM_GALLERIES: Readonly<Record<RoomSlug, readonly string[]>> = {
  // INV 25/10: at least GALLERY_TARGET photos per room type (copy.test.ts).
  'standard-studio-city-view': [
    'city-living',
    'city-studio',
    'city-kitchen',
    'city-bed',
    'city-laundry',
    'city-view',
  ],
  'standard-studio-garden-view': [
    'garden-oak',
    'garden-navy',
    'garden-navy-kitchen',
    'garden-balcony',
    'detail-kitchen',
    'detail-laundry-desk',
    'detail-balcony-sunset',
  ],
  'premium-one-bedroom-1': [
    'premium-kitchen',
    'premium-living-tv',
    'premium-living',
    'premium-bed',
    'premium-extra-bed',
    'premium-bath',
  ],
  // UXD FB-R3-UXD-FE-05 (pending INV): Signature 3 → 6, Garden + photo 16. Separate commit – drop it to go back.
  'signature-two-bedrooms': [
    'signature-dining',
    'signature-living-oak',
    'signature-bedroom-desk',
    'signature-bed',
    'signature-laundry-dining',
    'signature-bath',
  ],
};

/** Minimum photos per room type – INV rule 25/10 (was a target, now enforced by copy.test.ts). */
export const GALLERY_TARGET = 6;
