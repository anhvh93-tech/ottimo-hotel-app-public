/**
 * The ONE upload pipeline for images (SEC s3-checklist C1, I2; SR-FILE-01…04; ADR-013 point 1) – identity
 * documents (registration, guest-portal) and operational attachments use the same code:
 *
 * 1. type by MAGIC BYTES only (never the file name / declared Content-Type): JPEG, PNG, WebP. HEIC/HEIF,
 *    PDF, HTML, executables… → 422 FILE_REJECTED `FILE_TYPE`;
 * 2. ≤ 10 MB per file (`FILE_TOO_LARGE`), ≤ 40 MP decoded (`limitInputPixels`, decompression bombs);
 * 3. decode → re-encode with sharp (JPEG q85, WebP stays WebP): EXIF/GPS/XMP/ICC are not copied (sharp
 *    drops metadata unless asked), orientation is applied first so the picture stays upright;
 * 4. everything in memory – no temporary file in clear (encryption happens right after, by the caller);
 * 5. at most 2 images decoded at the same time per process (memory on the 1-replica VPS), 10 s each,
 *    libvips cache off, only the JPEG/PNG/WebP loaders unblocked; uploads in flight capped by upload-gate.ts.
 * Limits are technical security constants (SR-FILE-02), not business parameters.
 */
import sharp from 'sharp';
import { type FieldError, problem } from '../../../shared/problem';

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_MAX_PIXELS = 40_000_000;
const CONCURRENCY = 2;

export type SourceImageType = 'jpeg' | 'png' | 'webp';

export interface NormalizedImage {
  data: Buffer;
  mime: 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}

/** Image type from the first bytes; null = not an accepted image (HEIC, PDF, HTML, text…). */
export function sniffImageType(buf: Buffer): SourceImageType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buf.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

export function fileRejected(
  field: string,
  code: 'FILE_TYPE' | 'FILE_TOO_LARGE' | 'TOO_MANY_FILES',
) {
  const errors: FieldError[] = [{ field, code }];
  return problem('FILE_REJECTED', { errors });
}

// libvips hardening (SEC FB-R2-SEC-BE-47, ARC FB-R2-ARC-BE-S3-18): no pixel cache (decoded document
// pixels never linger in RAM), and only the three accepted decoders are callable – the HEIF/SVG/GIF/TIFF/PDF
// loaders of the 2026 advisories are blocked even if magic-byte sniffing were bypassed.
sharp.cache(false);
sharp.block({ operation: ['VipsForeignLoad'] });
sharp.unblock({
  operation: ['VipsForeignLoadJpegBuffer', 'VipsForeignLoadPngBuffer', 'VipsForeignLoadWebpBuffer'],
});

/** Seconds one decode/encode may take (SR-FILE-03). */
const DECODE_TIMEOUT_S = 10;

let active = 0;
const waiting: Array<() => void> = [];

/** At most CONCURRENCY decodes; a released slot is handed to the next waiter (no slot stealing). */
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= CONCURRENCY) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    active++;
  }
  try {
    return await fn();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

/** Validate + re-encode one uploaded image. `field` is used in errors[] (image, file…). */
export async function normalizeImage(input: Buffer, field = 'image'): Promise<NormalizedImage> {
  if (input.length === 0) throw fileRejected(field, 'FILE_TYPE');
  if (input.length > IMAGE_MAX_BYTES) throw fileRejected(field, 'FILE_TOO_LARGE');
  const type = sniffImageType(input);
  if (!type) throw fileRejected(field, 'FILE_TYPE');
  return withSlot(async () => {
    let meta: sharp.Metadata;
    try {
      // Header only (no pixel decode): the dimensions are checked below, before any decode.
      meta = await sharp(input, { limitInputPixels: false, failOn: 'warning' }).metadata();
    } catch {
      throw fileRejected(field, 'FILE_TYPE');
    }
    // The decoder must agree with the magic bytes (a PNG header on a HEIF body is still refused).
    if (meta.format !== type) throw fileRejected(field, 'FILE_TYPE');
    if ((meta.width ?? 0) * (meta.height ?? 0) > IMAGE_MAX_PIXELS) {
      throw fileRejected(field, 'FILE_TOO_LARGE');
    }
    try {
      const pipeline = sharp(input, {
        limitInputPixels: IMAGE_MAX_PIXELS,
        failOn: 'warning',
        sequentialRead: true,
      })
        .rotate()
        .timeout({ seconds: DECODE_TIMEOUT_S });
      const out =
        type === 'webp'
          ? await pipeline.webp({ quality: 85 }).toBuffer({ resolveWithObject: true })
          : await pipeline
              .flatten({ background: '#ffffff' })
              .jpeg({ quality: 85 })
              .toBuffer({ resolveWithObject: true });
      return {
        data: out.data,
        mime: type === 'webp' ? 'image/webp' : 'image/jpeg',
        width: out.info.width,
        height: out.info.height,
      };
    } catch (err) {
      if (err instanceof Error && /pixel limit/i.test(err.message)) {
        throw fileRejected(field, 'FILE_TOO_LARGE');
      }
      throw fileRejected(field, 'FILE_TYPE');
    }
  });
}
