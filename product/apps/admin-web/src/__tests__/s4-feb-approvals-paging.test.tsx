import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import type { MockApproval } from '../mocks/stay';
import { server } from '../mocks/node';
import { OVERVIEW_APPROVAL_PAGES } from '../pages/dashboard/useDashboard';
import { renderApp, tv } from '../test/render';

/**
 * BUG-R2-107 (FE-B part): the refund queue (Tiền → Hoàn tiền) and H24 "Cần duyệt" read approval requests
 * filtered by status ON THE SERVER, page after page (`nextCursor`) – never "the newest 100 of every status,
 * then filter here". The mock pages in array order like the server's `requested_at DESC`: requests pushed
 * after the seed are older and sit past the first page of 100.
 */
const kim = () => mockControl.rsv.reservations.find((r) => r.guestName === 'Kim Seo-yeon')!;
const at = (i: number) => new Date(Date.UTC(2026, 8, 1, 0, 0, 0) - i * 60_000).toISOString();
function req(i: number, over: Partial<MockApproval>): MockApproval {
  const k = kim();
  return {
    id: `0192a1b0-0000-7000-8000-${String(400_000 + i).padStart(12, '0')}`,
    type: 'foc',
    status: 'pending',
    reservationCode: k.code,
    folioId: k.folioId,
    amountVnd: 20_000,
    reasonCode: 'regular_vip',
    requestedBy: 'Lan',
    requestedByUserId: 'someone-else',
    requestedAt: at(i),
    ...over,
  };
}

const urls: string[] = [];
const onStart = ({ request }: { request: Request }) => {
  if (request.method === 'GET' && /\/approval-requests(\?|$)/.test(request.url))
    urls.push(request.url);
};
function recordListReads() {
  urls.length = 0;
  server.events.on('request:start', onStart);
  return () => urls.map((u) => new URL(u).searchParams);
}
afterEach(() => {
  server.events.removeListener('request:start', onStart);
});

describe('BUG-R2-107 – refund queue reads every page of its statuses', () => {
  it('a pending refund behind 150 newer approved FOC requests is still in the queue', async () => {
    // 150 decided FOC requests (not refunds) come first, then an older refund still waiting.
    for (let i = 0; i < 150; i++)
      mockControl.stay.approvals.push(req(i, { status: 'approved', approverName: 'Quân' }));
    mockControl.stay.approvals.push(
      req(150, { type: 'refund', reasonCode: 'overpayment', amountVnd: 654_000 }),
    );
    const reads = recordListReads();
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const card = (
      await screen.findByText(new RegExp(`^${kim().code} · 654.000`), undefined, {
        timeout: 5000,
      })
    ).closest('li')!;
    expect(within(card).getByText(tv('approval.status.pending'))).toBeInTheDocument();
    // The seeded approved refunds are still there; the FOC requests are not refunds.
    const nga = mockControl.rsv.reservations.find((r) => r.guestName === 'Trần Thu Nga')!;
    expect(screen.getByText(new RegExp(`^${nga.code} · 500.000`))).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`^${kim().code} · 20.000`))).not.toBeInTheDocument();
    const qs = reads();
    expect(
      qs.every((q) => ['pending', 'escalated', 'approved'].includes(q.get('status') ?? '')),
    ).toBe(true);
    expect(qs.some((q) => q.get('status') === 'approved' && q.get('cursor') === '100')).toBe(true);
  });
});

describe('BUG-R2-107 – H24 "Cần duyệt" (owner / manager)', () => {
  it('120 pending requests behind 10 newer decided ones: all counted, the oldest is listed', async () => {
    for (let i = 0; i < 10; i++)
      mockControl.stay.approvals.push(req(i, { status: 'approved', amountVnd: 10_000 }));
    for (let i = 10; i < 129; i++) mockControl.stay.approvals.push(req(i, {}));
    mockControl.stay.approvals.push(req(129, { amountVnd: 777_000 }));
    const reads = recordListReads();
    renderApp('/overview', 'qa.mgr');
    // The seeded FOC (Hạnh) + 120 = 121.
    const head = await screen.findByRole(
      'heading',
      { name: tv('ov.approvals_n', { n: '121' }) },
      { timeout: 5000 },
    );
    const block = head.closest('section')!;
    expect(within(block).getByRole('link', { name: /777\.000/ })).toHaveAttribute(
      'href',
      '/approvals',
    );
    expect(within(block).queryByRole('link', { name: /10\.000/ })).not.toBeInTheDocument();
    const qs = reads();
    expect(qs.every((q) => ['pending', 'escalated'].includes(q.get('status') ?? ''))).toBe(true);
    expect(qs.some((q) => q.get('status') === 'pending' && q.get('cursor') === '100')).toBe(true);
  });

  it(`a summary: at most ${OVERVIEW_APPROVAL_PAGES} pages per status, then the count reads "n+" (H17 holds the rest)`, async () => {
    for (let i = 0; i < 320; i++) mockControl.stay.approvals.push(req(i, {}));
    const reads = recordListReads();
    renderApp('/overview', 'qa.owner');
    const cap = OVERVIEW_APPROVAL_PAGES * 100;
    expect(
      await screen.findByRole(
        'heading',
        { name: tv('ov.approvals_n', { n: `${cap}+` }) },
        { timeout: 8000 },
      ),
    ).toBeInTheDocument();
    const pending = reads().filter((q) => q.get('status') === 'pending');
    expect(pending).toHaveLength(OVERVIEW_APPROVAL_PAGES);
  }, 15_000);
});
