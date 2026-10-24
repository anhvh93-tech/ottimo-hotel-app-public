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

/** Seconds between two hero photos (INV 22/10: "mỗi 3 giây"). */
export const HERO_INTERVAL_MS = 3000;

/** Photos per room type; the first one is the cover of the room card. */
export const ROOM_GALLERIES: Readonly<Record<RoomSlug, readonly string[]>> = {
  'standard-studio-city-view': ['city-living', 'city-bed', 'city-view'],
  'standard-studio-garden-view': [
    'garden-oak',
    'garden-navy',
    'garden-balcony',
    'detail-kitchen',
    'detail-laundry-desk',
    'detail-balcony-sunset',
  ],
  'premium-one-bedroom-1': ['premium-kitchen', 'premium-bed', 'premium-living'],
  'signature-two-bedrooms': ['signature-dining', 'signature-bed', 'signature-bath'],
};

/** What an OTA listing usually shows at least; fewer = ask INV for more photos of that room type. */
export const GALLERY_TARGET = 6;
