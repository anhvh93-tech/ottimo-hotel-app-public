/**
 * The one slug rule for a public room type (OpenAPI 0.3.10 bổ sung 3, BR-012): `Room.publicRoomType` holds the
 * label ("Standard Studio · Garden View"), the website and its requests carry the slug of that label
 * (`standard-studio-garden-view`, landing `rooms.items[].slug`). The api (`slugOf`, public-site) and the Desk
 * (US-131 AC10 seen-estimate compare, BUG-R4-001) both call this function – never a second copy of the rule.
 * A slug is its own slug, so a value already in slug form passes through unchanged.
 */
export function publicRoomTypeSlug(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
