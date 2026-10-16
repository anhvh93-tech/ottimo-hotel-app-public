// SVG rendering of a QrMatrix. Pure string output (no DOM) – safe for server and browser. Owner: INT.
import { IntegrationError } from '../contracts/common.js';
import { encodeQr, type EncodeQrOptions, type QrMatrix } from './encoder.js';

export interface RenderQrSvgOptions extends EncodeQrOptions {
  /** Quiet zone in modules (spec minimum 4). */
  margin?: number;
  /** Rendered width/height in px (viewBox stays in modules). Default: no width/height → scales with CSS. */
  sizePx?: number;
  dark?: string;
  light?: string;
  /** Accessible name, e.g. "Mã VietQR thanh toán OTM00171". XML-escaped. */
  title?: string;
}

const COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function color(value: string | undefined, fallback: string): string {
  const v = value ?? fallback;
  // Only hex colours: the SVG may be inlined into a page, so no attribute injection.
  if (!COLOR_RE.test(v)) throw new IntegrationError('INVALID_REQUEST', 'QR colour must be #hex');
  return v;
}

/** Renders a matrix (or encodes text first) to a self-contained SVG string. */
export function renderQrSvg(input: string | QrMatrix, opts: RenderQrSvgOptions = {}): string {
  const m = typeof input === 'string' ? encodeQr(input, opts) : input;
  const margin = opts.margin ?? 4;
  if (!Number.isInteger(margin) || margin < 0 || margin > 16) {
    throw new IntegrationError('INVALID_REQUEST', 'QR margin must be 0–16');
  }
  const dark = color(opts.dark, '#000000');
  const light = color(opts.light, '#ffffff');
  const dim = m.size + margin * 2;
  let path = '';
  for (let y = 0; y < m.size; y++) {
    const row = m.modules[y] as readonly boolean[];
    let x = 0;
    while (x < m.size) {
      if (!row[x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < m.size && row[x]) x++;
      path += `M${start + margin} ${y + margin}h${x - start}v1h-${x - start}z`;
    }
  }
  const sizeAttr =
    opts.sizePx !== undefined && Number.isInteger(opts.sizePx) && opts.sizePx > 0
      ? ` width="${opts.sizePx}" height="${opts.sizePx}"`
      : '';
  const title = opts.title !== undefined ? `<title>${escapeXml(opts.title)}</title>` : '';
  const aria = opts.title !== undefined ? ` role="img" aria-label="${escapeXml(opts.title)}"` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}"${sizeAttr}${aria} shape-rendering="crispEdges">` +
    title +
    `<rect width="${dim}" height="${dim}" fill="${light}"/>` +
    `<path d="${path}" fill="${dark}"/>` +
    `</svg>`
  );
}
