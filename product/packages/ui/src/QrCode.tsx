import { useMemo } from 'react';
import { encodeQr, qrSvgPath } from './qr';

export interface QrCodeProps {
  /** Raw payload (EMVCo/NAPAS VietQR string from the server). */
  value: string;
  /** Accessible name – say what the code pays (amount + transfer content), never the payload itself. */
  label: string;
  size?: number;
}

/**
 * QR drawn locally as inline SVG (SEC F2: no third-party image service; works under CSP
 * `img-src 'self' blob: data:`). Always dark on white, whatever the theme, so phone cameras read it.
 */
export function QrCode({ value, label, size = 200 }: QrCodeProps) {
  const { path, dim } = useMemo(() => {
    const m = encodeQr(value);
    return { path: qrSvgPath(m), dim: m.size + 8 };
  }, [value]);
  return (
    <svg
      className="qr"
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      shapeRendering="crispEdges"
    >
      <rect width={dim} height={dim} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
