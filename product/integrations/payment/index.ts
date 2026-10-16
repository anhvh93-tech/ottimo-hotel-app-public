// '@ottimo/integrations/payment' – PaymentAdapter implementations (R2: VietQR). Node only (PNG uses node:zlib).
export * from './vietqr/emvco.js';
export * from './vietqr/adapter.js';
export { renderQrPng, type RenderQrPngOptions } from '../qr/png.js';
export { renderQrSvg, type RenderQrSvgOptions } from '../qr/svg.js';
