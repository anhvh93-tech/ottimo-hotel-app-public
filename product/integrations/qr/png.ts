// PNG rendering of a QrMatrix – Node only (node:zlib). Not exported from './qr' so the browser bundle stays
// free of Node built-ins; exported from './payment' and the package root. Owner: INT.
import { crc32, deflateSync } from 'node:zlib';
import { IntegrationError } from '../contracts/common.js';
import { encodeQr, type EncodeQrOptions, type QrMatrix } from './encoder.js';

export interface RenderQrPngOptions extends EncodeQrOptions {
  /** Pixels per module (1–32). Default 8. */
  scale?: number;
  /** Quiet zone in modules (0–16). Default 4. */
  margin?: number;
}

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  const typeBytes = new TextEncoder().encode(type);
  out.set(typeBytes, 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)) >>> 0);
  return out;
}

/** 8-bit greyscale PNG, black on white, deterministic bytes for the same input. */
export function renderQrPng(input: string | QrMatrix, opts: RenderQrPngOptions = {}): Uint8Array {
  const m = typeof input === 'string' ? encodeQr(input, opts) : input;
  const scale = opts.scale ?? 8;
  const margin = opts.margin ?? 4;
  if (!Number.isInteger(scale) || scale < 1 || scale > 32) {
    throw new IntegrationError('INVALID_REQUEST', 'QR scale must be 1–32');
  }
  if (!Number.isInteger(margin) || margin < 0 || margin > 16) {
    throw new IntegrationError('INVALID_REQUEST', 'QR margin must be 0–16');
  }
  const px = (m.size + margin * 2) * scale;
  const raw = new Uint8Array((px + 1) * px).fill(0xff);
  for (let y = 0; y < px; y++) {
    raw[y * (px + 1)] = 0; // filter: none
    const my = Math.floor(y / scale) - margin;
    if (my < 0 || my >= m.size) continue;
    const row = m.modules[my] as readonly boolean[];
    for (let x = 0; x < px; x++) {
      const mx = Math.floor(x / scale) - margin;
      if (mx >= 0 && mx < m.size && row[mx]) raw[y * (px + 1) + 1 + x] = 0;
    }
  }
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, px);
  v.setUint32(4, px);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  const parts = [
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', new Uint8Array(deflateSync(raw))),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
