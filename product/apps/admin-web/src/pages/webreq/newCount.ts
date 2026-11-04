import { api } from '../../app/api';

/** The menu badge shows "50+" from this many (one page). */
export const WEBREQ_COUNT_PAGE = 50;

/**
 * Website requests still `new` that the caller can pick up (US-155): the server scopes SAL to unassigned `new` +
 * own, so `status=new` is exactly that. One source for the menu badge and the S35 title line (FB-R4-UXD-FE-20):
 * `total` (0.3.10 bổ sung 4) when the server sends it, else the first page (50 or more → 50).
 */
export async function loadWebreqNewCount(propertyId: string): Promise<number> {
  const out = await api.listWebsiteBookingRequests(
    { propertyId },
    { status: ['new'], limit: WEBREQ_COUNT_PAGE },
  );
  if (typeof out.data.total === 'number') return out.data.total;
  return out.data.page.nextCursor ? WEBREQ_COUNT_PAGE : out.data.data.length;
}
