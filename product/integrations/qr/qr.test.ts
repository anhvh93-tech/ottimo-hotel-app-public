import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { IntegrationError } from '../contracts/common.js';
import { encodeQr, qrByteCapacity, type QrMatrix } from './encoder.js';
import { renderQrPng } from './png.js';
import { renderQrSvg } from './svg.js';

// Same payload as payment/vietqr/vietqr.test.ts. The matrices produced by this encoder for this payload,
// every version 1–10 × ECC L/M/Q/H at full capacity, all 8 masks and a UTF-8 string were decoded with
// Apple CoreImage CIDetector (independent decoder) on 16/10/2026: 50/50 OK (s3-report section 3).
const VECTOR =
  '00020101021238540010A00000072701240006970436011001234567890208QRIBFTTA5303704540716000005802VN62120808OTM0017163046ABE';

const bits = (m: QrMatrix): string =>
  m.modules.map((r) => r.map((b) => (b ? 1 : 0)).join('')).join('\n');

function readFormat(m: QrMatrix): { ecc: number; mask: number } {
  // Copy 1 around the top-left finder (bits 14..0), then remove the 0x5412 mask.
  const g = (x: number, y: number): number => ((m.modules[y] as boolean[])[x] ? 1 : 0);
  const seq = [g(0, 8), g(1, 8), g(2, 8), g(3, 8), g(4, 8), g(5, 8), g(7, 8), g(8, 8), g(8, 7)];
  for (let y = 5; y >= 0; y--) seq.push(g(8, y));
  let v = 0;
  for (const b of seq) v = (v << 1) | b;
  v ^= 0x5412;
  return { ecc: v >>> 13, mask: (v >>> 10) & 7 };
}

describe('encodeQr', () => {
  it('known matrix for "HELLO" (version 1-M) has finder patterns and timing', () => {
    const m = encodeQr('HELLO', { ecc: 'M' });
    expect(m.version).toBe(1);
    expect(m.size).toBe(21);
    const rows = bits(m).split('\n');
    expect(rows[0]?.slice(0, 7)).toBe('1111111');
    expect(rows[6]?.slice(0, 7)).toBe('1111111');
    expect(rows[6]?.slice(8, 13)).toBe('10101'); // timing row
    expect(rows[13]?.[8]).toBe('1'); // dark module at (8, size-8)
  });

  it('writes the format bits of the chosen ECC level and mask', () => {
    for (const [ecc, code] of [
      ['L', 1],
      ['M', 0],
      ['Q', 3],
      ['H', 2],
    ] as const) {
      for (let mask = 0; mask < 8; mask++) {
        const m = encodeQr('OTTIMO', { ecc, mask });
        expect(readFormat(m)).toEqual({ ecc: code, mask });
      }
    }
  });

  it('picks the smallest version that fits and grows past capacity', () => {
    const cap = qrByteCapacity(3, 'M');
    expect(encodeQr('a'.repeat(cap), { ecc: 'M' }).version).toBe(3);
    expect(encodeQr('a'.repeat(cap + 1), { ecc: 'M' }).version).toBe(4);
  });

  it('byte capacities match ISO/IEC 18004 table 7 (byte mode)', () => {
    expect([1, 2, 5, 7, 10].map((v) => qrByteCapacity(v, 'M'))).toEqual([14, 26, 84, 122, 213]);
    expect([1, 10].map((v) => qrByteCapacity(v, 'L'))).toEqual([17, 271]);
    expect([1, 10].map((v) => qrByteCapacity(v, 'H'))).toEqual([7, 119]);
  });

  it('VietQR vector → version 7-M, regression fingerprint of the CoreImage-verified matrix', () => {
    const m = encodeQr(VECTOR);
    expect([m.version, m.size, m.ecc, m.mask]).toEqual([7, 45, 'M', 3]);
    expect(createHash('sha256').update(bits(m)).digest('hex')).toBe(
      'c4f054b5e32be5076cba03c06fd4fa4d051db8972d9a42bf26c146f6c3bd849a',
    );
  });

  it('is deterministic', () => {
    expect(bits(encodeQr(VECTOR))).toBe(bits(encodeQr(VECTOR)));
  });

  it('too long → INVALID_REQUEST; bad mask → INVALID_REQUEST', () => {
    expect(() => encodeQr('x'.repeat(qrByteCapacity(10, 'M') + 1))).toThrowError(IntegrationError);
    expect(() => encodeQr('x', { mask: 8 })).toThrowError(IntegrationError);
  });
});

describe('renderQrSvg', () => {
  it('produces a self-contained SVG with quiet zone, no external reference', () => {
    const svg = renderQrSvg(VECTOR, { title: 'VietQR <OTM00171> & "x"' });
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 53 53"/);
    expect(svg).toContain('<title>VietQR &lt;OTM00171&gt; &amp; &quot;x&quot;</title>');
    expect(svg).not.toMatch(/href|<script|<image/);
  });

  it('refuses non-hex colours (no attribute injection)', () => {
    expect(() => renderQrSvg('x', { dark: 'red" onload="alert(1)' })).toThrowError(
      IntegrationError,
    );
  });
});

describe('renderQrPng', () => {
  it('valid PNG whose pixels equal the matrix', () => {
    const m = encodeQr(VECTOR);
    const png = renderQrPng(m, { scale: 2, margin: 4 });
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(png.buffer, png.byteOffset);
    const width = view.getUint32(16);
    expect(width).toBe((45 + 8) * 2);
    const idatLen = view.getUint32(33);
    expect(String.fromCharCode(...png.subarray(37, 41))).toBe('IDAT');
    const raw = inflateSync(png.subarray(41, 41 + idatLen));
    const pixel = (x: number, y: number): number => raw[y * (width + 1) + 1 + x] as number;
    for (let y = 0; y < 45; y++) {
      for (let x = 0; x < 45; x++) {
        const dark = (m.modules[y] as boolean[])[x];
        expect(pixel((x + 4) * 2, (y + 4) * 2)).toBe(dark ? 0 : 255);
      }
    }
    expect(pixel(0, 0)).toBe(255); // quiet zone
  });
});
