/**
 * Language of a guest session – P-S4-10, OpenAPI 0.3.7 bổ sung 1 (`GuestSession.locale`, `localeChosenByGuest`;
 * openapi-0.3.7.md 11.3 (8)). The server decides once, when the session opens:
 *   (1) the guest's own choice (`setGuestLocale`) on an earlier session of the SAME booking – newest wins;
 *   (2) the booker's profile language (`guest.preferred_locale`: vi / en / ru);
 *   (3) the first `Accept-Language` tag: vi* → vi, ru* → ru, anything else or none → en.
 * The guest's choice never writes the profile (`guest.preferred_locale` belongs to the desk – module guests).
 */
export const GUEST_LOCALES = ['vi', 'en', 'ru'] as const;
export type GuestLocale = (typeof GUEST_LOCALES)[number];

const isLocale = (v: string | null | undefined): v is GuestLocale =>
  !!v && (GUEST_LOCALES as readonly string[]).includes(v);

/** Primary subtag of the FIRST language range (`ru-RU,ru;q=0.9,en;q=0.8` → `ru`); `*` / empty → null. */
export function firstLanguage(acceptLanguage: string | undefined): string | null {
  const range = (acceptLanguage ?? '').split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? '';
  const primary = range.split('-')[0] ?? '';
  return primary && primary !== '*' ? primary : null;
}

export function pickGuestLocale(i: {
  chosenByGuest: string | null;
  bookerPreferred: string | null;
  acceptLanguage: string | undefined;
}): { locale: GuestLocale; chosenByGuest: boolean } {
  if (isLocale(i.chosenByGuest)) return { locale: i.chosenByGuest, chosenByGuest: true };
  if (isLocale(i.bookerPreferred)) return { locale: i.bookerPreferred, chosenByGuest: false };
  const first = firstLanguage(i.acceptLanguage);
  return { locale: first === 'vi' || first === 'ru' ? first : 'en', chosenByGuest: false };
}
