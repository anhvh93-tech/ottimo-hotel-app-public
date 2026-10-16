import { afterEach, describe, expect, it, vi } from 'vitest';
import { fitWithin, ImageRejected, looksLikeImage, MAX_EDGE, normalizeImage } from '../app/image';

describe('fitWithin', () => {
  it('caps the long edge at 2500 px and keeps the ratio', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: MAX_EDGE, height: 1875 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 1875, height: MAX_EDGE });
    expect(fitWithin(1200, 800)).toEqual({ width: 1200, height: 800 });
  });
});

describe('normalizeImage (SEC G6: canvas re-encode, no EXIF, memory only)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('re-encodes to JPEG ≤ 2500 px through a canvas and frees the bitmap', async () => {
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4032, height: 3024, close })),
    );
    const drawImage = vi.fn();
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage, fillRect: vi.fn(), fillStyle: '' } as never);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      cb,
      type,
    ) {
      cb(new Blob([new Uint8Array(10)], { type: type ?? 'image/png' }));
    });
    const createUrl = vi.spyOn(URL, 'createObjectURL');

    const out = await normalizeImage(
      new File([new Uint8Array(50)], 'a.jpg', { type: 'image/jpeg' }),
    );
    expect(out.type).toBe('image/jpeg');
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2500, 1875);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.85);
    expect(close).toHaveBeenCalled();
    expect(createUrl).not.toHaveBeenCalled(); // no object URL on the main path
    getContext.mockRestore();
    toBlob.mockRestore();
  });

  it('refuses PDFs / unknown types before decoding', async () => {
    expect(looksLikeImage(new Blob([], { type: 'application/pdf' }))).toBe(false);
    await expect(
      normalizeImage(new Blob(['%PDF'], { type: 'application/pdf' })),
    ).rejects.toBeInstanceOf(ImageRejected);
  });
});
