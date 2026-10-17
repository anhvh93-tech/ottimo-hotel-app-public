// Social share image (US-154 AC1, ADR-014 5): JPEG 1200×630 at public/og/ottimo-1200x630.jpg, cropped from the
// hero photo UXD optimised (src/assets/photos/hero-facade-dusk-1600.webp – metadata already stripped).
// Run by hand when the hero changes (`pnpm --filter @ottimo/landing-web og`); the JPEG is committed, CI never
// runs this. sharp comes with astro (optional dependency) – no extra package.
// Photo only for now: text on the image needs Lora rendered into the bitmap – UXD to design (concept 8.3).
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Resolve sharp from astro's own dependencies (astro → sharp).
const astroPkg = createRequire(path.join(app, 'package.json')).resolve('astro/package.json');
const sharp = createRequire(astroPkg)('sharp');

const SRC = path.join(app, 'src/assets/photos/hero-facade-dusk-1600.webp');
const OUT = path.join(app, 'public/og/ottimo-1200x630.jpg');
const W = 1200;
const H = 630;
const FOCUS_Y = 0.58; // same vertical focus as the hero on the page (object-position 50% 58%)

const resized = sharp(SRC).resize({ width: W });
const { height } = await resized
  .clone()
  .toBuffer({ resolveWithObject: true })
  .then((r) => r.info);
const top = Math.max(0, Math.min(height - H, Math.round(height * FOCUS_Y - H / 2)));
const info = await resized
  .extract({ left: 0, top, width: W, height: H })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT);
console.log(
  `og image written: ${path.relative(app, OUT)} ${info.width}×${info.height} ${info.size} bytes`,
);
