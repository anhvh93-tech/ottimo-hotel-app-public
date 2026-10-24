#!/usr/bin/env node
// Landing mock v1 – image pipeline (UXD).
// Reads the original PNGs (outside git) and writes web-ready WebP + AVIF at
// 480 / 960 / 1600 px wide to product/design/landing/mock/img/, plus CREDITS.md
// and manifest.json. Metadata (EXIF/XMP/ICC) is stripped; output is sRGB.
//
// Usage (from repo root):
//   node product/design/landing/tools/optimize-images.mjs [--no-avif] [--raw <dir>]
//   node product/design/landing/tools/optimize-images.mjs --only <id,id> --out product/apps/landing-web/src/assets/photos
//
// --only re-encodes just those ids and merges them into the manifest.json already in the output folder (other
// entries and files untouched) – used by FE-LP to add or swap a landing photo (round 3, hero photos 24/10).
// --out writes somewhere else than the mock (e.g. the landing app's src/assets/photos).
//
// sharp is resolved from the repo (services/api or the pnpm store) – no new deps.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const args = process.argv.slice(2);
const argVal = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const RAW = path.resolve(argVal('--raw') ?? path.join(REPO, '00-brief/context/landing/raw'));
const OUT = path.resolve(argVal('--out') ?? path.join(REPO, 'product/design/landing/mock/img'));
const ONLY = argVal('--only')?.split(',').map((s) => s.trim()).filter(Boolean);
const WITH_AVIF = !args.includes('--no-avif');

const WIDTHS = [480, 960, 1600];
const WEBP = { quality: 72, effort: 5 };
const AVIF = { quality: 50, effort: 4 };
const FLATTEN_BG = '#F4F0E8'; // Ivory – a few PNGs carry an alpha channel

function loadSharp() {
  const candidates = [
    path.join(REPO, 'product/services/api/package.json'),
    path.join(REPO, 'product/package.json'),
  ];
  for (const c of candidates) {
    try {
      return createRequire(c)('sharp');
    } catch {
      /* try next */
    }
  }
  const store = path.join(REPO, 'product/node_modules/.pnpm');
  const dir = fs.existsSync(store)
    ? fs.readdirSync(store).filter((d) => d.startsWith('sharp@')).sort().pop()
    : undefined;
  if (dir) return createRequire(path.join(store, dir, 'node_modules/sharp/package.json'))('sharp');
  throw new Error('sharp not found – run pnpm install in product/ first');
}

// id → source. Room type mapping is UXD's reading of the e-brochure pages
// (see concept.md section 6); "check" = SEC photo checklist (FB-R2-SEC-UXD-02).
// Round 3 (INV/CPY 24/10, concept B): hero = picker photo 4 (`03.png`, front facade at blue hour) instead of 04.1;
// the id stays `hero-facade-dusk` (LCP preload, OG image, tests). Two photos added for the hero slideshow.
const PHOTOS = [
  // avifQuality 42: this photo carries more detail than 04.1 – at q50 the 960 px AVIF is 58 KB, over the 50 KB hero
  // budget of concept 11.2 (budget.landing.spec.ts). q42 keeps it at ~41 KB with no visible loss at that size.
  { id: 'hero-facade-dusk', src: 'mat-tien-sanh/03.png', use: 'Hero (LCP)', type: 'Exterior', brochure: '–', avifQuality: 42,
    alt: { en: 'OTTIMO at dusk, with warm lights on every balcony', vi: 'OTTIMO lúc chạng vạng, ban công sáng đèn ấm' } },
  { id: 'lobby', src: 'mat-tien-sanh/01b.png', use: 'About · Lobby', type: 'Lobby', brochure: 'p31',
    alt: { en: 'Ground-floor lobby with an oak reception desk and a coffee counter', vi: 'Sảnh tầng trệt với quầy lễ tân gỗ sồi và quầy cà phê' } },
  { id: 'aerial-hillside', src: 'mat-tien-sanh/05.2.png', use: 'Location', type: 'Exterior', brochure: '–',
    alt: { en: 'Aerial view of OTTIMO on a quiet hillside, with Da Lat and the mountains behind', vi: 'OTTIMO nhìn từ trên cao, trên triền đồi yên tĩnh, phía sau là Đà Lạt và núi' } },
  { id: 'city-living', src: 'phong-3/03.png', use: 'Room 01 cover', type: 'Standard Studio · City View', brochure: 'p8',
    alt: { en: 'Cream-and-grey studio: sofa, TV wall and kitchen', vi: 'Studio tông kem – xám: sofa, tường TV và bếp' } },
  { id: 'city-bed', src: 'phong-3/06.png', use: 'Room 01', type: 'Standard Studio · City View', brochure: 'p10',
    alt: { en: 'Double bed beside a curtained window', vi: 'Giường đôi cạnh cửa sổ có rèm' } },
  { id: 'city-view', src: 'phong-3/08.png', use: 'Room 01', type: 'Standard Studio · City View', brochure: 'p12',
    alt: { en: 'Sofa by floor-to-ceiling windows looking over the city', vi: 'Sofa cạnh cửa kính lớn nhìn ra thành phố' } },
  { id: 'garden-oak', src: 'phong-1/1.png', use: 'Room 02 cover', type: 'Standard Studio · Garden View (light oak)', brochure: 'p14',
    alt: { en: 'Light-oak studio with a bed, sofa and balcony door', vi: 'Studio gỗ sáng với giường, sofa và cửa ra ban công' } },
  { id: 'garden-navy', src: 'phong-2/05.png', use: 'Room 02', type: 'Standard Studio · Garden View (navy)', brochure: 'p19',
    alt: { en: 'Navy studio: bed, sofa and a glass door to the balcony', vi: 'Studio tông navy: giường, sofa và cửa kính ra ban công' } },
  { id: 'garden-balcony', src: 'phong-1/7.png', use: 'Room 02', type: 'Standard Studio · Garden View', brochure: 'p13',
    alt: { en: 'Private balcony looking over green slopes at sunset', vi: 'Ban công riêng nhìn ra triền cỏ xanh lúc hoàng hôn' } },
  { id: 'premium-kitchen', src: 'phong-5/5.png', use: 'Room 03 cover', type: 'Premium · One Bedroom + 1', brochure: 'p23',
    alt: { en: 'Long navy kitchen opening onto the living room and balcony', vi: 'Bếp navy dài mở ra phòng khách và ban công' } },
  { id: 'premium-bed', src: 'phong-5/2.png', use: 'Room 03', type: 'Premium · One Bedroom + 1', brochure: 'p21',
    alt: { en: 'Separate bedroom with a double bed and a desk by the window', vi: 'Phòng ngủ riêng với giường đôi và bàn cạnh cửa sổ' } },
  { id: 'premium-living', src: 'phong-5/4.png', use: 'Room 03', type: 'Premium · One Bedroom + 1', brochure: 'p23',
    alt: { en: 'Living room with a sofa beside the balcony', vi: 'Phòng khách với sofa cạnh ban công' } },
  { id: 'signature-dining', src: 'phong-4/3.png', use: 'Room 04 cover', type: 'Signature · Two Bedrooms', brochure: 'p25',
    alt: { en: 'Open living, kitchen and dining space with a table for four', vi: 'Không gian khách – bếp – bàn ăn bốn người' } },
  { id: 'signature-bed', src: 'phong-4/6.png', use: 'Room 04', type: 'Signature · Two Bedrooms', brochure: 'p28',
    alt: { en: 'One of two bedrooms, with a double bed on an oak platform', vi: 'Một trong hai phòng ngủ, giường đôi trên bệ gỗ sồi' } },
  { id: 'signature-bath', src: 'phong-4/5.png', use: 'Room 04', type: 'Signature · Two Bedrooms', brochure: 'p27',
    alt: { en: 'Glass shower and green-tiled vanity', vi: 'Phòng tắm kính, tường gạch xanh' } },
  { id: 'detail-laundry-desk', src: 'phong-2/02.png', use: 'Why OTTIMO', type: 'Standard Studio · Garden View (navy)', brochure: 'p17',
    alt: { en: 'In-room washer and dryer next to a wardrobe and a work desk', vi: 'Máy giặt và máy sấy trong căn, cạnh tủ áo và bàn làm việc' } },
  { id: 'detail-kitchen', src: 'phong-1/3.png', use: 'Amenities', type: 'Standard Studio · Garden View (light oak)', brochure: 'p15',
    alt: { en: 'Oak kitchen with an induction hob, full-size fridge and washer-dryer', vi: 'Bếp gỗ sồi với bếp từ, tủ lạnh lớn và máy giặt sấy' } },
  { id: 'detail-balcony-sunset', src: 'phong-2/06.png', use: 'Location quote', type: 'Standard Studio · Garden View (navy)', brochure: 'p30',
    alt: { en: 'Balcony at sunset over the hills of Da Lat', vi: 'Ban công lúc hoàng hôn nhìn ra đồi Đà Lạt' } },
  { id: 'signature-bedroom-desk', src: 'phong-4/8.png', use: 'Hero slide (picker 37)', type: 'Signature Two-Bedroom', brochure: '–',
    alt: { en: 'Bedroom with a white bed on an oak platform, a wardrobe and a desk by the window', vi: 'Phòng ngủ với giường trắng trên bệ gỗ, tủ áo và bàn làm việc cạnh cửa sổ' } },
  { id: 'garden-navy-kitchen', src: 'phong-2/03.png', use: 'Hero slide (picker 16)', type: 'Garden Studio (navy)', brochure: '–',
    alt: { en: 'Long navy kitchen open to a sofa corner by tall glass doors', vi: 'Bếp navy dài liền góc sofa bên cửa kính lớn' } },
  { id: 'signature-living-oak', src: 'phong-4/4.png', use: 'Hero slide (picker 33)', type: 'Signature Two-Bedroom', brochure: '–',
    alt: { en: 'Living room with an oak shelf wall, a TV and a cream sofa by the window', vi: 'Phòng khách với vách kệ gỗ sồi, TV và sofa màu kem cạnh cửa sổ' } },
];

const SEC_CHECK =
  'không người; không cận khóa cửa/bàn phím; không số căn; không màn hình/giấy tờ/Wi-Fi';

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function main() {
  const sharp = loadSharp();
  sharp.cache(false);
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = [];
  let total = 0;
  const todo = ONLY ? PHOTOS.filter((p) => ONLY.includes(p.id)) : PHOTOS;
  if (ONLY) {
    const unknown = ONLY.filter((id) => !PHOTOS.some((p) => p.id === id));
    if (unknown.length) throw new Error(`--only: unknown id(s) ${unknown.join(', ')} – add them to PHOTOS first`);
  }

  for (const p of todo) {
    const src = path.join(RAW, p.src);
    if (!fs.existsSync(src)) throw new Error(`missing source: ${src}`);
    const meta = await sharp(src, { limitInputPixels: false }).metadata();
    const entry = { ...p, original: { width: meta.width, height: meta.height, bytes: fs.statSync(src).size }, files: [] };

    for (const w of WIDTHS) {
      const width = Math.min(w, meta.width);
      const base = sharp(src, { limitInputPixels: false })
        .rotate()
        .flatten({ background: FLATTEN_BG })
        .resize({ width, withoutEnlargement: true })
        .toColourspace('srgb');
      const outs = [['webp', base.clone().webp(WEBP)]];
      if (WITH_AVIF) outs.push(['avif', base.clone().avif({ ...AVIF, ...(p.avifQuality ? { quality: p.avifQuality } : {}) })]);
      for (const [fmt, pipe] of outs) {
        const name = `${p.id}-${w}.${fmt}`;
        const info = await pipe.toFile(path.join(OUT, name));
        total += info.size;
        entry.files.push({ name, width: info.width, height: info.height, bytes: info.size });
      }
    }
    manifest.push(entry);
    const largest = entry.files.filter((f) => f.name.endsWith('-1600.webp'))[0];
    console.log(`${p.id.padEnd(24)} ← ${p.src.padEnd(26)} ${largest.width}×${largest.height}  webp1600 ${kb(largest.bytes)}`);
  }

  let photos = manifest;
  if (ONLY) {
    // Merge: replace the re-encoded entries in place, append new ones, keep every other entry as it is.
    const prev = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')).photos;
    const fresh = new Map(manifest.map((e) => [e.id, e]));
    photos = prev.map((e) => fresh.get(e.id) ?? e);
    for (const e of manifest) if (!prev.some((x) => x.id === e.id)) photos.push(e);
    total = photos.reduce((n, e) => n + e.files.reduce((m, f) => m + f.bytes, 0), 0);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ widths: WIDTHS, webp: WEBP, avif: WITH_AVIF ? AVIF : null, totalBytes: total, photos }, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'CREDITS.md'), credits(photos, total));
  console.log(`\n${photos.length} photos · ${photos.reduce((n, e) => n + e.files.length, 0)} files · total ${(total / 1024 / 1024).toFixed(2)} MB`);
}

function credits(manifest, total) {
  const rows = manifest
    .map((e, i) => {
      const w = e.files.find((f) => f.name.endsWith('-1600.webp'));
      return `| ${i + 1} | \`${e.id}\` | \`raw/${e.src}\` | ${e.original.width}×${e.original.height} | ${e.type} | ${e.brochure} | ${e.use} | ${w.width}×${w.height} |`;
    })
    .join('\n');
  return `# Ảnh landing mock v1 – nguồn và giấy phép

- Chủ sở hữu ảnh: OTTIMO Boutique Stay (INV gửi qua Google Drive "OTTIMO BOUTIQUE STAY", 17/10/2026). Quyền dùng ảnh cho website/quảng cáo: **chờ INV xác nhận** (ESC-020 L6).
- Ảnh gốc PNG nằm ở \`00-brief/context/landing/raw/\` (ngoài git). Thư mục này chỉ chứa bản đã tối ưu.
- Sinh bằng \`product/design/landing/tools/optimize-images.mjs\` (sharp): WebP q${WEBP.quality} + AVIF q${AVIF.quality}, rộng ${WIDTHS.join(' / ')} px, sRGB, **đã xóa metadata** (EXIF/XMP/ICC). Ảnh có kênh alpha được trải nền Ivory.
- Tên tệp: \`<id>-<rộng>.<webp|avif>\`. Tổng dung lượng: ${(total / 1024 / 1024).toFixed(2)} MB (${manifest.length} ảnh × ${WIDTHS.length} cỡ × ${manifest[0].files.length / WIDTHS.length} định dạng).
- Kiểm theo SEC (FB-R2-SEC-UXD-02) cho cả ${manifest.length} ảnh: ${SEC_CHECK}. Ảnh \`detail-laundry-desk\` có tay nắm khóa điện tử ở xa (không cận, không đọc được hãng) – chấp nhận; \`city-living\` có khóa cửa nhỏ ở nền – chấp nhận. TV trong phòng chỉ hiện logo OTTIMO – chấp nhận. Tạp chí trên bàn (Kinfolk, Vogue) là đạo cụ, không phải logo đối tác.
- Hạng phòng ghi theo đối chiếu ảnh với trang e-brochure (cột "Trang brochure") – xem \`concept.md\` mục 6.

| # | ID | Nguồn (thư mục/tệp) | Gốc (px) | Hạng phòng / khu | Trang brochure | Dùng ở | Cỡ lớn nhất |
|---|---|---|---|---|---|---|---|
${rows}
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
