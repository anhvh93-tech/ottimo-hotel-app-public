// Photos of incidents / inspections / repairs (ADR-005: compressed ≤ 300 KB on the phone before upload or
// queueing; SEC I1–I7 server pipeline re-encodes again). Decode → canvas → JPEG: re-encoding drops EXIF
// and GPS. No object URL outlives the call.

export const MAX_PHOTO_BYTES = 300 * 1024;
export const MAX_EDGE = 1600;
const STEPS: readonly { edge: number; q: number }[] = [
  { edge: 1600, q: 0.8 },
  { edge: 1600, q: 0.65 },
  { edge: 1280, q: 0.6 },
  { edge: 1024, q: 0.55 },
  { edge: 800, q: 0.5 },
];

export class PhotoRejected extends Error {
  readonly code = 'FILE_TYPE';
}

export function fitWithin(width: number, height: number, max = MAX_EDGE) {
  const long = Math.max(width, height);
  if (long <= max) return { width, height };
  const k = max / long;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

export function looksLikeImage(file: Blob): boolean {
  return file.type === '' || /^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type);
}

type Drawable = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decode(file: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() };
    } catch {
      /* older Safari → <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => {} };
  } catch {
    throw new PhotoRejected('FILE_TYPE');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/** JPEG ≤ 300 KB (smaller edge / quality until it fits; the last step is sent whatever its size). */
export async function compressPhoto(file: Blob): Promise<Blob> {
  if (!looksLikeImage(file)) throw new PhotoRejected('FILE_TYPE');
  const img = await decode(file);
  const canvas = document.createElement('canvas');
  try {
    let last: Blob | null = null;
    for (const step of STEPS) {
      const { width, height } = fitWithin(img.width, img.height, step.edge);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new PhotoRejected('FILE_TYPE');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img.source, 0, 0, width, height);
      last = await toBlob(canvas, step.q);
      if (!last) throw new PhotoRejected('FILE_TYPE');
      if (last.size <= MAX_PHOTO_BYTES) return last;
    }
    return last!;
  } finally {
    img.release();
    canvas.width = 0;
    canvas.height = 0;
  }
}
