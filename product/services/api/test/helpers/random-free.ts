/**
 * Leak checks on a whole response body (`expect(body).not.toContain('2018')`) must scan only what the test controls.
 * A random value in the body can hold a short needle by chance and turn the test red on an unrelated PR:
 * - a UUID (member / guest ids, `requestId`, `instance`) is 32 hex digits – "2018" was inside the guest id
 *   `01a1b28a-2018-776f-…` (US-022, CI run 42282981812), "4111" / "1111" can sit in a requestId the same way;
 * - the fixtures' guest codes `KH-<6 random hex>` (reservations-fixture, sales-fixture).
 * `withoutRandomIds` puts a fixed mark in place of each, so the scan still reads every other value (names, years,
 * amounts, free text) and a real leak stays red.
 */
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const FIXTURE_GUEST_CODE = /\bKH-[0-9a-f]{6}\b/g;

export function withoutRandomIds(text: string): string {
  return text.replace(UUID, '<uuid>').replace(FIXTURE_GUEST_CODE, 'KH-<code>');
}
