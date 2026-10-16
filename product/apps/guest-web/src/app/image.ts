// Client-side normalisation of ID photos before upload (SEC s3-checklist G6, SR-FILE, EP06 8.3):
// decode → draw on a canvas → re-encode JPEG. Re-encoding drops EXIF/GPS and every other metadata
// block; the long edge is capped at 2 500 px. The result stays in memory only and is handed straight
// to the upload (ĐK-3) – no object URL, no preview, no storage.

export const MAX_EDGE = 2500;
export const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES_PER_PERSON = 4;
const QUALITIES = [0.85, 0.75, 0.6];

export class ImageRejected extends Error {
  /** Same codes as the server's `errors[].code` so the UI shows one sentence set (`field.*`). */
  readonly code: 'FILE_TYPE' | 'FILE_TOO_LARGE';
  constructor(code: 'FILE_TYPE' | 'FILE_TOO_LARGE') {
    super(code);
    this.code = code;
  }
}

/** Target size keeping the aspect ratio, long edge ≤ `max` (never upscales). */
export function fitWithin(width: number, height: number, max = MAX_EDGE) {
  const long = Math.max(width, height);
  if (long <= max) return { width, height };
  const k = max / long;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

/** HEIC/PDF etc. are refused up front; iOS normally hands a JPEG to `<input type=file>` anyway. */
export function looksLikeImage(file: Blob): boolean {
  return file.type === '' || /^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type);
}

type Drawable = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decode(file: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      // `from-image` applies the EXIF orientation before the metadata is thrown away.
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() };
    } catch {
      /* fall back to <img> (older Safari) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => {} };
  } catch {
    throw new ImageRejected('FILE_TYPE');
  } finally {
    // Revoke as soon as the pixels are decoded (ĐK-3: no object URL outlives the step).
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function normalizeImage(file: Blob): Promise<Blob> {
  if (!looksLikeImage(file)) throw new ImageRejected('FILE_TYPE');
  const img = await decode(file);
  const canvas = document.createElement('canvas');
  try {
    const { width, height } = fitWithin(img.width, img.height);
    if (!width || !height) throw new ImageRejected('FILE_TYPE');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageRejected('FILE_TYPE');
    ctx.fillStyle = '#fff'; // PNG transparency → white, not black, in the JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img.source, 0, 0, width, height);
    for (const q of QUALITIES) {
      const blob = await toBlob(canvas, q);
      if (!blob) throw new ImageRejected('FILE_TYPE');
      if (blob.size <= MAX_BYTES) return blob;
    }
    throw new ImageRejected('FILE_TOO_LARGE');
  } finally {
    img.release();
    // Free the pixel buffer right away (large phone photos are 30–50 MB decoded).
    canvas.width = 0;
    canvas.height = 0;
  }
}
