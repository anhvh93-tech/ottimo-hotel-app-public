import { translate } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { compareWithSeen, seenEstimate } from '../pages/webreq/labels';
import { renderApp, tv } from '../test/render';

/**
 * R4 LP-v2 – Kiểm thử, sửa lỗi FE-A:
 * - BUG-R4-001 (US-131 AC10): S35 shows the estimate the guest saw (`priceEstimate`, signed by the server) or "the
 *   guest saw no price"; a quote for the same stay whose total differs says "Changed: seen → now".
 * - BUG-R4-002 (US-175 AC3): ko / zh guest language labels, never a raw key.
 * - BUG-R4-004 (UI part): owner-only "Public room type" list in the unit drawer; sent only when changed.
 */
const req = (code: string) => mockControl.webRequests.requests.find((r) => r.refCode === code)!;

type Estimate = NonNullable<ReturnType<typeof req>['priceEstimate']>;
const estimate = (over: Partial<Estimate> = {}): Estimate => {
  const r = req('W7K3QX9P');
  return {
    roomType: 'standard-studio-garden-view',
    stayKind: 'short',
    arrival: r.arrival,
    departure: r.departure ?? null,
    months: null,
    adults: r.adults,
    children: r.children,
    infants: r.infants,
    nights: r.nights ?? null,
    totalVnd: 1_600_000,
    losDiscountPct: 0,
    extraPersonFeeVnd: 0,
    currency: 'VND',
    computedAt: '2026-11-01T08:09:00Z',
    priceVersion: 'pv-1',
    ...over,
  };
};

async function openRequest(code: string, as = 'qa.fd') {
  const { user } = renderApp('/website-requests', as);
  await user.click(await screen.findByRole('button', { name: code }));
  return { user, drawer: await screen.findByRole('dialog') };
}

describe('BUG-R4-001 – estimate the guest saw (US-131 AC10)', () => {
  it('shows the seen figure with its time; "no price" when the guest saw none', async () => {
    req('W7K3QX9P').priceEstimate = estimate();
    const { drawer } = await openRequest('W7K3QX9P');
    expect(await within(drawer).findByText(tv('webreq.estimate_seen'))).toBeInTheDocument();
    const dd = within(drawer).getByText(tv('webreq.estimate_seen')).nextElementSibling!;
    expect(dd).toHaveTextContent(/^1\.600\.000 đ – tính lúc .*\d\d:\d\d/);
    expect(dd).not.toHaveTextContent(tv('webreq.estimate_none'));
  });

  it('no estimate, or a monthly stay (never a figure – ESC-043) → "Khách chưa thấy giá"', async () => {
    req('7K3QX9MD').priceEstimate = estimate({ stayKind: 'long', totalVnd: null });
    const { drawer } = await openRequest('7K3QX9MD');
    const dd = (await within(drawer).findByText(tv('webreq.estimate_seen'))).nextElementSibling!;
    expect(dd).toHaveTextContent(tv('webreq.estimate_none'));
    expect(seenEstimate({ ...req('7K3QX9MD'), allowedActions: [] })).toBeNull();
  });

  it('the server recomputation at submit is shown only when the API sends it and it differs', async () => {
    Object.assign(req('W7K3QX9P'), {
      priceEstimate: { ...estimate(), atSubmit: { fromTotalVnd: 1_740_000 } },
    });
    const { drawer } = await openRequest('W7K3QX9P');
    expect(
      await within(drawer).findByText(tv('webreq.estimate_at_submit', { amount: '1.740.000 đ' })),
    ).toBeInTheDocument();
    const same = {
      ...req('W7K3QX9P'),
      priceEstimate: { ...estimate(), atSubmit: { fromTotalVnd: 1_600_000 } },
    };
    expect(seenEstimate(same as never)?.atSubmitVnd).toBeUndefined();
  });

  it('quote for the same stay with another total → "Đã đổi: seen → now" (QA step 4)', async () => {
    // Dates with no booking on 203 in the EP02 seed (as the US-155 quote test).
    Object.assign(req('W7K3QX9P'), {
      arrival: addDays(todayLocal(), 40),
      departure: addDays(todayLocal(), 42),
    });
    req('W7K3QX9P').priceEstimate = estimate({ totalVnd: 1_000 });
    const { user, drawer } = await openRequest('W7K3QX9P');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
    const dlg = await screen.findByRole('dialog', { name: /Báo giá cho yêu cầu W7K3QX9P/ });
    const room = mockControl.db.rooms.find((r) => r.roomNo === '203')!;
    await user.selectOptions(within(dlg).getByLabelText(/^Căn/), room.id);
    expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
    expect(await within(dlg).findByText(/^Đã đổi: 1\.000 đ → [\d.]+ đ$/)).toBeInTheDocument();
    expect(within(dlg).getByText(tv('webreq.estimate_changed_hint'))).toBeInTheDocument();
  });

  it('quote for another party → the seen figure for reference only, never "changed"', async () => {
    Object.assign(req('W7K3QX9P'), {
      arrival: addDays(todayLocal(), 40),
      departure: addDays(todayLocal(), 42),
    });
    req('W7K3QX9P').priceEstimate = estimate({ totalVnd: 1_000, adults: 1 });
    const { user, drawer } = await openRequest('W7K3QX9P');
    await user.click(await within(drawer).findByRole('button', { name: tv('webreq.quote') }));
    const dlg = await screen.findByRole('dialog', { name: /Báo giá cho yêu cầu W7K3QX9P/ });
    expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
    expect(
      within(dlg).getByText(tv('webreq.estimate_other', { amount: '1.000 đ' })),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(/^Đã đổi:/)).not.toBeInTheDocument();
  });

  it('compareWithSeen: same inputs → same/changed; other dates, party or public room type → other', () => {
    const seen = seenEstimate({ ...req('W7K3QX9P'), priceEstimate: estimate() } as never)!;
    const q = {
      arrival: seen.arrival,
      nights: seen.nights ?? 2,
      adults: seen.adults,
      children6to11: seen.children,
      childrenUnder6: seen.infants,
      totalVnd: 1_600_000,
    };
    expect(compareWithSeen(seen, q)).toBe('same');
    expect(compareWithSeen(seen, { ...q, totalVnd: 1_740_000 })).toBe('changed');
    expect(compareWithSeen(seen, { ...q, nights: 3 })).toBe('other');
    expect(compareWithSeen(seen, { ...q, childrenUnder6: seen.infants + 1 })).toBe('other');
    expect(
      compareWithSeen(seen, { ...q, publicRoomType: 'standard-studio-city-view', totalVnd: 1 }),
    ).toBe('other');
    // a room without a public type (not sent yet – BUG-R4-004) does not block the comparison
    expect(compareWithSeen(seen, { ...q, publicRoomType: null, totalVnd: 1 })).toBe('changed');
  });
});

describe('BUG-R4-002 – guest language labels (US-175 AC3)', () => {
  it.each([
    ['ko', 'Tiếng Hàn', 'Korean'],
    ['zh', 'Tiếng Trung (giản thể)', 'Chinese (Simplified)'],
    ['ru', 'Tiếng Nga', 'Russian'],
  ] as const)('%s → "%s" / "%s", never the raw key', async (locale, vi, en) => {
    expect(translate('vi', `webreq.locale.${locale}`)).toBe(vi);
    expect(translate('en', `webreq.locale.${locale}`)).toBe(en);
    req('W7K3QX9P').locale = locale;
    const { drawer } = await openRequest('W7K3QX9P');
    const dd = (await within(drawer).findByText(tv('webreq.locale'))).nextElementSibling!;
    expect(dd).toHaveTextContent(vi);
    expect(within(drawer).queryByText(/webreq\.locale\./)).not.toBeInTheDocument();
  });

  it('every landing locale has a Desk label in vi and en', () => {
    for (const l of ['vi', 'en', 'ko', 'zh', 'ru'])
      for (const lang of ['vi', 'en'] as const)
        expect(translate(lang, `webreq.locale.${l}`)).not.toMatch(/^webreq\./);
  });
});

/** Every PATCH /rooms/{id} body, as the browser sent it. */
function capturePatches() {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'PATCH' || !/\/rooms\/[^/]+$/.test(new URL(request.url).pathname))
      return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

async function openRoom(as: string, no: string) {
  const { user } = renderApp('/settings/rooms', as);
  await user.click(await screen.findByRole('button', { name: `Sửa ${no}` }));
  return { user, dlg: await screen.findByRole('dialog', { name: new RegExp(`Sửa căn ${no}`) }) };
}

describe('BUG-R4-004 – public room type in the unit drawer (owner only)', () => {
  it('owner picks one of the 4 e-brochure types; saved and sent only when changed', async () => {
    const cap = capturePatches();
    const { user, dlg } = await openRoom('qa.owner', '101');
    const select = within(dlg).getByLabelText(new RegExp(`^${tv('rooms.public_type')}`));
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([
      tv('rooms.public_type_none'),
      'Standard Studio · City View',
      'Standard Studio · Garden View',
      'Premium · One Bedroom + 1',
      'Signature · Two Bedrooms',
    ]);
    await user.selectOptions(select, 'Standard Studio · City View');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(cap.sent).toHaveLength(1));
    expect(cap.sent[0]).toEqual({ publicRoomType: 'Standard Studio · City View' });
    expect(mockControl.db.rooms.find((r) => r.roomNo === '101')!.publicRoomType).toBe(
      'Standard Studio · City View',
    );
    cap.stop();
  });

  it('owner: "Not assigned" sends null; another change alone does not send the field', async () => {
    mockControl.db.rooms.find((r) => r.roomNo === '102')!.publicRoomType =
      'Standard Studio · Garden View';
    const cap = capturePatches();
    const { user, dlg: first } = await openRoom('qa.owner', '102');
    await user.click(within(first).getByRole('switch'));
    await user.click(within(first).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(cap.sent).toHaveLength(1));
    expect(cap.sent[0]).not.toHaveProperty('publicRoomType');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(await screen.findByRole('button', { name: 'Sửa 102' }));
    const dlg = await screen.findByRole('dialog', { name: /Sửa căn 102/ });
    await user.selectOptions(
      within(dlg).getByLabelText(new RegExp(`^${tv('rooms.public_type')}`)),
      '',
    );
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(cap.sent).toHaveLength(2));
    expect(cap.sent[1]).toEqual({ publicRoomType: null });
    cap.stop();
  });

  it('manager sees the type read-only and never sends it (the server answers 403 to a manager)', async () => {
    mockControl.db.rooms.find((r) => r.roomNo === '101')!.publicRoomType =
      'Standard Studio · City View';
    const cap = capturePatches();
    const { user, dlg } = await openRoom('qa.mgr', '101');
    expect(
      within(dlg).queryByLabelText(new RegExp(`^${tv('rooms.public_type')}`)),
    ).not.toBeInTheDocument();
    expect(within(dlg).getByText('Standard Studio · City View')).toBeInTheDocument();
    expect(within(dlg).getByText(tv('rooms.public_type_owner_only'))).toBeInTheDocument();
    await user.click(within(dlg).getByRole('switch'));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(cap.sent).toHaveLength(1));
    expect(cap.sent[0]).not.toHaveProperty('publicRoomType');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    cap.stop();
  });
});
