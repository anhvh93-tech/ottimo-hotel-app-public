// Local QR Code encoder (ISO/IEC 18004), byte mode, versions 1–10. Owner: INT.
// Pure TypeScript – no Node or DOM APIs – so the api (PNG/SVG) and admin-web (SVG in the bundle) share one
// implementation. SEC F2: QR images are drawn locally, never by a third-party image service.
import { IntegrationError } from '../contracts/common.js';

export type QrEcc = 'L' | 'M' | 'Q' | 'H';

export interface QrMatrix {
  readonly version: number;
  readonly size: number;
  readonly ecc: QrEcc;
  readonly mask: number;
  /** true = dark module. Row-major: modules[y][x]. */
  readonly modules: readonly (readonly boolean[])[];
}

export interface EncodeQrOptions {
  /** Default 'M' (≈15 % damage tolerance – enough for a phone screen or a printed bill). */
  ecc?: QrEcc;
  /** Force a mask 0–7 (tests only). Default: lowest penalty. */
  mask?: number;
  /** Force a minimum version (tests only). */
  minVersion?: number;
}

export const QR_MAX_VERSION = 10;

const FORMAT_BITS: Readonly<Record<QrEcc, number>> = { L: 1, M: 0, Q: 3, H: 2 };
const ECC_INDEX: Readonly<Record<QrEcc, number>> = { L: 0, M: 1, Q: 2, H: 3 };

// Index 0 unused; versions 1..10 (ISO/IEC 18004 table 9).
const ECC_CODEWORDS_PER_BLOCK: readonly (readonly number[])[] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
];
const NUM_ECC_BLOCKS: readonly (readonly number[])[] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8],
];

function at(table: readonly (readonly number[])[], ecc: QrEcc, version: number): number {
  const v = table[ECC_INDEX[ecc]]?.[version];
  if (v === undefined || v < 0)
    throw new IntegrationError('INVALID_REQUEST', 'QR version out of range');
  return v;
}

function numRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function numDataCodewords(version: number, ecc: QrEcc): number {
  return (
    Math.floor(numRawDataModules(version) / 8) -
    at(ECC_CODEWORDS_PER_BLOCK, ecc, version) * at(NUM_ECC_BLOCKS, ecc, version)
  );
}

/** Byte-mode capacity in bytes for a version / ECC level. */
export function qrByteCapacity(version: number, ecc: QrEcc): number {
  const countBits = version <= 9 ? 8 : 16;
  return Math.floor((numDataCodewords(version, ecc) * 8 - 4 - countBits) / 8);
}

// ── GF(256) Reed–Solomon (primitive polynomial 0x11D) ──
function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j] as number, root);
      if (j + 1 < degree) result[j] = (result[j] as number) ^ (result[j + 1] as number);
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    for (let i = 0; i < divisor.length; i++) {
      result[i] = (result[i] as number) ^ gfMul(divisor[i] as number, factor);
    }
  }
  return result;
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const size = version * 4 + 17;
  const numAlign = Math.floor(version / 7) + 2;
  const step = Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

function encodeDataCodewords(bytes: Uint8Array, version: number, ecc: QrEcc): number[] {
  const bits: number[] = [];
  const push = (value: number, len: number): void => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  const capacityBits = numDataCodewords(version, ecc) * 8;
  push(0, Math.min(4, capacityBits - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | (bits[i + j] as number);
    codewords.push(v);
  }
  for (let pad = 0xec; codewords.length < capacityBits / 8; pad ^= 0xec ^ 0x11) codewords.push(pad);
  return codewords;
}

function addEccAndInterleave(data: readonly number[], version: number, ecc: QrEcc): number[] {
  const numBlocks = at(NUM_ECC_BLOCKS, ecc, version);
  const eccLen = at(ECC_CODEWORDS_PER_BLOCK, ecc, version);
  const rawCodewords = Math.floor(numRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  const divisor = rsDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dataLen = shortBlockLen - eccLen + (i < numShortBlocks ? 0 : 1);
    const dat = data.slice(k, k + dataLen);
    k += dataLen;
    const block = [...dat];
    if (i < numShortBlocks) block.push(-1); // placeholder so all blocks interleave by column
    block.push(...rsRemainder(dat, divisor));
    blocks.push(block);
  }
  const result: number[] = [];
  const blockLen = (blocks[0] as number[]).length;
  for (let i = 0; i < blockLen; i++) {
    for (const block of blocks) {
      const v = block[i] as number;
      if (v !== -1) result.push(v);
    }
  }
  return result;
}

class Grid {
  readonly modules: boolean[][];
  readonly isFunction: boolean[][];
  constructor(readonly size: number) {
    this.modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.isFunction = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }
  setFn(x: number, y: number, dark: boolean): void {
    (this.modules[y] as boolean[])[x] = dark;
    (this.isFunction[y] as boolean[])[x] = true;
  }
  get(x: number, y: number): boolean {
    return (this.modules[y] as boolean[])[x] as boolean;
  }
}

function drawFinder(g: Grid, cx: number, cy: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= g.size || y >= g.size) continue;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      g.setFn(x, y, dist !== 2 && dist !== 4);
    }
  }
}

function drawFormatBits(g: Grid, ecc: QrEcc, mask: number): void {
  const data = (FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i: number): boolean => ((bits >>> i) & 1) !== 0;
  const s = g.size;
  for (let i = 0; i <= 5; i++) g.setFn(8, i, bit(i));
  g.setFn(8, 7, bit(6));
  g.setFn(8, 8, bit(7));
  g.setFn(7, 8, bit(8));
  for (let i = 9; i < 15; i++) g.setFn(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) g.setFn(s - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) g.setFn(8, s - 15 + i, bit(i));
  g.setFn(8, s - 8, true); // dark module
}

function drawVersionBits(g: Grid, version: number): void {
  if (version < 7) return;
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = (version << 12) | rem;
  for (let i = 0; i < 18; i++) {
    const dark = ((bits >>> i) & 1) !== 0;
    const a = g.size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    g.setFn(a, b, dark);
    g.setFn(b, a, dark);
  }
}

function drawFunctionPatterns(g: Grid, version: number, ecc: QrEcc): void {
  for (let i = 0; i < g.size; i++) {
    g.setFn(6, i, i % 2 === 0);
    g.setFn(i, 6, i % 2 === 0);
  }
  drawFinder(g, 3, 3);
  drawFinder(g, g.size - 4, 3);
  drawFinder(g, 3, g.size - 4);
  const pos = alignmentPositions(version);
  const n = pos.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          g.setFn(
            (pos[i] as number) + dx,
            (pos[j] as number) + dy,
            Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
          );
        }
      }
    }
  }
  drawFormatBits(g, ecc, 0); // reserve; real bits drawn after masking
  drawVersionBits(g, version);
}

function drawCodewords(g: Grid, data: readonly number[]): void {
  let i = 0;
  for (let right = g.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < g.size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? g.size - 1 - vert : vert;
        if (!(g.isFunction[y] as boolean[])[x] && i < data.length * 8) {
          (g.modules[y] as boolean[])[x] =
            (((data[i >>> 3] as number) >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function applyMask(g: Grid, mask: number): void {
  for (let y = 0; y < g.size; y++) {
    for (let x = 0; x < g.size; x++) {
      if (!(g.isFunction[y] as boolean[])[x] && maskBit(mask, x, y)) {
        (g.modules[y] as boolean[])[x] = !g.get(x, y);
      }
    }
  }
}

const FINDER_LIKE = [
  [true, false, true, true, true, false, true, false, false, false, false],
  [false, false, false, false, true, false, true, true, true, false, true],
];

function penalty(g: Grid): number {
  const s = g.size;
  let score = 0;
  const line = (getter: (i: number) => boolean): void => {
    let runColor = getter(0);
    let run = 1;
    for (let i = 1; i <= s; i++) {
      const c = i < s ? getter(i) : !runColor;
      if (i < s && c === runColor) {
        run++;
      } else {
        if (run >= 5) score += 3 + (run - 5);
        runColor = c;
        run = 1;
      }
    }
    for (let i = 0; i + 11 <= s; i++) {
      for (const pat of FINDER_LIKE) {
        let match = true;
        for (let k = 0; k < 11 && match; k++) if (getter(i + k) !== pat[k]) match = false;
        if (match) score += 40;
      }
    }
  };
  for (let y = 0; y < s; y++) line((x) => g.get(x, y));
  for (let x = 0; x < s; x++) line((y) => g.get(x, y));
  let dark = 0;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const c = g.get(x, y);
      if (c) dark++;
      if (
        x + 1 < s &&
        y + 1 < s &&
        c === g.get(x + 1, y) &&
        c === g.get(x, y + 1) &&
        c === g.get(x + 1, y + 1)
      ) {
        score += 3;
      }
    }
  }
  const total = s * s;
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  score += Math.max(0, k) * 10;
  return score;
}

/** Encodes text (UTF-8, byte mode) into a QR matrix. Too long for version 10 → INVALID_REQUEST. */
export function encodeQr(text: string, opts: EncodeQrOptions = {}): QrMatrix {
  const ecc = opts.ecc ?? 'M';
  if (
    opts.mask !== undefined &&
    !(Number.isInteger(opts.mask) && opts.mask >= 0 && opts.mask <= 7)
  ) {
    throw new IntegrationError('INVALID_REQUEST', 'QR mask must be 0–7');
  }
  const bytes = new TextEncoder().encode(text);
  let version = Math.max(1, opts.minVersion ?? 1);
  while (version <= QR_MAX_VERSION && bytes.length > qrByteCapacity(version, ecc)) version++;
  if (version > QR_MAX_VERSION) {
    throw new IntegrationError('INVALID_REQUEST', 'QR content too long');
  }
  const codewords = addEccAndInterleave(encodeDataCodewords(bytes, version, ecc), version, ecc);

  const build = (mask: number): Grid => {
    const g = new Grid(version * 4 + 17);
    drawFunctionPatterns(g, version, ecc);
    drawCodewords(g, codewords);
    applyMask(g, mask);
    drawFormatBits(g, ecc, mask);
    return g;
  };

  let best: { grid: Grid; mask: number } | undefined;
  if (opts.mask !== undefined) {
    best = { grid: build(opts.mask), mask: opts.mask };
  } else {
    let bestScore = Infinity;
    for (let m = 0; m < 8; m++) {
      const g = build(m);
      const p = penalty(g);
      if (p < bestScore) {
        bestScore = p;
        best = { grid: g, mask: m };
      }
    }
  }
  const chosen = best as { grid: Grid; mask: number };
  return {
    version,
    size: chosen.grid.size,
    ecc,
    mask: chosen.mask,
    modules: chosen.grid.modules,
  };
}
