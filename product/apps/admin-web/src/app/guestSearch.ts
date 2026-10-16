import type { GuestSummary } from '@ottimo/api-client';
import { looksLikeContact } from './validation';
import { api } from './api';

/**
 * US-073 search rule: names / KH- codes / OTA codes go to `searchGuests?q=`; anything that looks like a
 * phone (≥ 8 digits) or an email is sent with POST `lookupGuestByContact` so C2 data never lands in a URL (SEC).
 */
export async function findGuests(
  propertyId: string,
  q: string,
  picker: boolean,
): Promise<GuestSummary[]> {
  const kind = looksLikeContact(q);
  if (kind) {
    const { data } = await api.lookupGuestByContact(
      { propertyId },
      kind === 'email' ? { email: q } : { phone: q },
    );
    return data.matches;
  }
  const { data } = await api.searchGuests({ propertyId }, q, picker);
  return data.data;
}
