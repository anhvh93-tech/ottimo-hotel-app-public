// Photos of the landing: the 18 files UXD optimised for mock v1.1 (WebP q72 + AVIF q50 at 480/960/1600 px,
// metadata stripped, SEC photo checklist done – src/assets/photos/CREDITS.md). Used as they are: no re-encoding at
// build time (passthrough image service). Alt text EN/VI comes from the same manifest UXD's tool writes.
import type { ImageMetadata } from 'astro';
import type { Lang } from '../lib/i18n';
import manifest from '../assets/photos/manifest.json';

const files = import.meta.glob<ImageMetadata>('../assets/photos/*.{avif,webp}', {
  eager: true,
  import: 'default',
});

export type PhotoFormat = 'avif' | 'webp';

export interface Photo {
  id: string;
  alt: Record<Lang, string>;
  /** Intrinsic size of the largest file (width/height attributes – no layout shift). */
  width: number;
  height: number;
  widths: number[];
  url: (width: number, format: PhotoFormat) => string;
}

function fileUrl(name: string): string {
  const meta = files[`../assets/photos/${name}`];
  if (!meta) throw new Error(`photo file missing: ${name} (src/assets/photos)`);
  return meta.src;
}

const byId = new Map<string, Photo>(
  manifest.photos.map((p) => {
    const webp = p.files.filter((f) => f.name.endsWith('.webp'));
    const largest = webp.reduce((a, b) => (b.width > a.width ? b : a));
    const photo: Photo = {
      id: p.id,
      alt: { en: p.alt.en, vi: p.alt.vi },
      width: largest.width,
      height: largest.height,
      widths: webp.map((f) => f.width).sort((a, b) => a - b),
      url: (width, format) => fileUrl(`${p.id}-${width}.${format}`),
    };
    return [p.id, photo];
  }),
);

export function photo(id: string): Photo {
  const p = byId.get(id);
  if (!p) throw new Error(`unknown photo id: ${id} (src/assets/photos/manifest.json)`);
  return p;
}

export function srcset(p: Photo, format: PhotoFormat, widths: readonly number[]): string {
  return widths.map((w) => `${p.url(w, format)} ${w}w`).join(', ');
}
