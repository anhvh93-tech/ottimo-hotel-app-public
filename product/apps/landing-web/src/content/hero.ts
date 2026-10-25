// Hero slideshow by INV's picker numbers (R3-Q52, FB-INV-003, INV 24/10). Build-time only: imports the photo
// manifest, so client scripts must never import this file (scripts/main.ts takes HERO_INTERVAL_MS from gallery.ts).
import manifest from '../assets/photos/manifest.json';

/**
 * Number of each photo in the 45-photo picker INV chooses from (rounds/round-03/outputs/UXD/landing-photo-picker.html)
 * → original file under 00-brief/context/landing/raw/ (= `src` in manifest.json). Matched by content, not by name
 * (FE-LP 24/10: every picker image compared with every original on a 24 × 24 thumbnail – one clear match each).
 */
export const PICKER_SOURCES: Readonly<Record<number, string>> = {
  1: 'mat-tien-sanh/01a.png',
  2: 'mat-tien-sanh/01b.png',
  3: 'mat-tien-sanh/02.png',
  4: 'mat-tien-sanh/03.png',
  5: 'mat-tien-sanh/04.1.png',
  6: 'mat-tien-sanh/05.2.png',
  7: 'phong-1/1.png',
  8: 'phong-1/2.png',
  9: 'phong-1/3.png',
  10: 'phong-1/4.png',
  11: 'phong-1/5.png',
  12: 'phong-1/6.png',
  13: 'phong-1/7.png',
  14: 'phong-2/01.png',
  15: 'phong-2/02.png',
  16: 'phong-2/03.png',
  17: 'phong-2/04.png',
  18: 'phong-2/05.png',
  19: 'phong-2/06.png',
  20: 'phong-3/01.1.png',
  21: 'phong-3/02.png',
  22: 'phong-3/03.png',
  23: 'phong-3/04.png',
  24: 'phong-3/05.png',
  25: 'phong-3/06.png',
  26: 'phong-3/07.png',
  27: 'phong-3/08.png',
  28: 'phong-3/09.png',
  29: 'phong-3/10.png',
  30: 'phong-4/1.png',
  31: 'phong-4/2.png',
  32: 'phong-4/3.png',
  33: 'phong-4/4.png',
  34: 'phong-4/5.png',
  35: 'phong-4/6.png',
  36: 'phong-4/7.png',
  37: 'phong-4/8.png',
  38: 'phong-4/9.png',
  39: 'phong-5/1.png',
  40: 'phong-5/2.png',
  41: 'phong-5/3.png',
  42: 'phong-5/4.png',
  43: 'phong-5/5.png',
  44: 'phong-5/6.png',
  45: 'phong-5/7.png',
};

/**
 * THE ONE PLACE TO CHANGE THE HERO: INV's picker numbers, in order. INV 25/10: **landscape photos only, one photo per
 * slide** – the portrait facade (picker 4) moved to #book. The first one is the LCP image (preload in Base.astro).
 * A number whose photo is not optimised yet, or a portrait photo, stops the build (README "Đổi ảnh đầu trang").
 */
export const HERO_PICKS: readonly number[] = [32, 9, 37, 16, 33];

/** Smallest width/height of a hero photo (INV 25/10: landscape only; the desktop frame is 4/3). */
export const HERO_MIN_RATIO = 4 / 3;

/** Picker numbers INV/CPY ruled out of the hero (FB-INV-003: plants, neighbours' roofs) – copy.test.ts checks. */
export const HERO_EXCLUDED: readonly number[] = [13, 42, 6, 19, 38];

/** Photo id (manifest.json) of a picker number. Throws when the photo has not been optimised for the site yet. */
export function photoIdForPick(n: number): string {
  const src = PICKER_SOURCES[n];
  if (!src) throw new Error(`hero photo ${n}: not a picker number (1–45)`);
  const entry = manifest.photos.find((p) => p.src === src);
  if (!entry)
    throw new Error(
      `hero photo ${n} (raw/${src}) is not on the site yet: add it to PHOTOS in ` +
        'product/design/landing/tools/optimize-images.mjs, run it with --only <id> --out ' +
        'product/apps/landing-web/src/assets/photos, and add its alt to photoAlt in en.ts + vi.ts',
    );
  return entry.id;
}

/** Width / height of a photo's largest optimised file (manifest.json). */
export function photoRatio(id: string): number {
  const entry = manifest.photos.find((p) => p.id === id);
  if (!entry) throw new Error(`unknown photo id: ${id}`);
  const largest = entry.files.reduce((a, b) => (b.width > a.width ? b : a));
  return largest.width / largest.height;
}

/** Photo id of a hero pick; throws (= build fails) for a photo that is not landscape ≥ 4/3 (INV 25/10). */
export function heroPhotoForPick(n: number): string {
  const id = photoIdForPick(n);
  // 1600×1067 = 1.4995: compare with a small tolerance for rounding of the encoded height
  if (photoRatio(id) < HERO_MIN_RATIO - 0.01)
    throw new Error(
      `hero photo ${n} (${id}) is not landscape (${photoRatio(id).toFixed(2)} < 4/3): INV 25/10 – landscape only, ` +
        'use it in another section',
    );
  return id;
}

/** Hero slideshow, in order. The first one is the LCP image (preloaded in layouts/Base.astro). */
export const HERO_SLIDES: readonly string[] = HERO_PICKS.map(heroPhotoForPick);
