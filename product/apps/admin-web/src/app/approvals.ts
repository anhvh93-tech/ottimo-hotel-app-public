import type { ApprovalRequest, ApprovalStatus } from '@ottimo/api-client';
import { api } from './api';

/** Safety stop: 50 pages × 100 = 5 000 requests per status. */
const MAX_PAGES = 50;

/**
 * BUG-R2-107: a queue is read whole – filtered by status ON THE SERVER, page after page with
 * `page.nextCursor` – never "the newest 100 of every status, then filter here" (an older pending request
 * would fall off and could not be decided on the Desk). `find` stops at the first match.
 */
export async function listApprovals(
  propertyId: string,
  statuses: readonly ApprovalStatus[],
  opts: { find?: (a: ApprovalRequest) => boolean; maxPages?: number } = {},
): Promise<ApprovalRequest[]> {
  const seen = new Map<string, ApprovalRequest>();
  for (const status of statuses) {
    let cursor: string | undefined;
    for (let page = 0; page < (opts.maxPages ?? MAX_PAGES); page++) {
      const res = (await api.listApprovalRequests({ propertyId }, status, cursor)).data;
      for (const a of res.data) {
        seen.set(a.id, a);
        if (opts.find?.(a)) return [a];
      }
      cursor = res.page?.nextCursor ?? undefined;
      if (!cursor) break;
    }
  }
  if (opts.find) return [];
  // Newest first, as the server sorts each status.
  return [...seen.values()].sort((x, y) => y.requestedAt.localeCompare(x.requestedAt));
}
