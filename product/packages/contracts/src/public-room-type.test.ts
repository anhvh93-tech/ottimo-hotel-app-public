import { describe, expect, it } from 'vitest';
import { publicRoomTypeSlug } from './public-room-type.js';

describe('publicRoomTypeSlug', () => {
  it('the 4 e-brochure labels → the landing slugs (apps/landing-web/src/content/en.ts)', () => {
    expect(publicRoomTypeSlug('Standard Studio · City View')).toBe('standard-studio-city-view');
    expect(publicRoomTypeSlug('Standard Studio · Garden View')).toBe('standard-studio-garden-view');
    expect(publicRoomTypeSlug('Premium · One Bedroom + 1')).toBe('premium-one-bedroom-1');
    expect(publicRoomTypeSlug('Signature · Two Bedrooms')).toBe('signature-two-bedrooms');
  });
  it('Vietnamese accents and đ; a slug stays as it is', () => {
    expect(publicRoomTypeSlug('Phòng Đôi')).toBe('phong-doi');
    expect(publicRoomTypeSlug('standard-studio-garden-view')).toBe('standard-studio-garden-view');
    expect(publicRoomTypeSlug('  ')).toBe('');
  });
});
