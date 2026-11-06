// V5-16 / US-177 AC7 (i) (BR-438 (4)(ii); contract 0.3.13 bổ sung 1 `listAuditEvents.reductionsOnly`, BE PR #108) –
// Nhật ký tiền: "Sửa giảm dòng – 7 ngày" (`mlog.filter_reductions`) for MGR/OWN, by person (`actorUserId`). FD/FDL do
// not get it. The API takes calendar dates `from`/`to` (the Desk used to send `dateFrom`/`dateTo`, which the server
// never read – the date range was not applied); the "Cần chú ý" link `/audit?reductionsOnly=true&month=…&actorUserId=…`
// opens the same filter, the month turned into its days up to today. Mock data only.
import { translate } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished } from 'vitest';
import { attentionLine } from '../app/attention';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

/** Seed accounts (`mocks/seed.ts`): qa.fd (Hạnh), qa.fdl (Lan). */
const HANH = '0192a1b0-0000-7000-8000-000000000004';
const LAN = '0192a1b0-0000-7000-8000-000000000003';

function adjusted(
  code: string,
  who: { id: string; name: string },
  day: string,
  category: string,
  before: number,
  after: number,
) {
  return {
    occurredAt: `${day}T10:00:00+07:00`,
    actorType: 'user',
    actorName: who.name,
    actorUserId: who.id,
    category: 'money',
    action: 'folio_line.adjusted',
    entityType: 'folio',
    entityCode: code,
    before: { amountVnd: before, category },
    after: { amountVnd: after },
    reason: 'Ghi nham so luong',
  };
}

/** Reductions and other money rows around today; the audit-events URLs the page asked for. */
function seed() {
  pinDaytime();
  const today = todayLocal();
  const hanh = { id: HANH, name: 'Hạnh' };
  const lan = { id: LAN, name: 'Lan' };
  mockControl.stay.audit.unshift(
    adjusted('OTM-T01', hanh, today, 'laundry', 75_000, 0),
    adjusted('OTM-T02', hanh, today, 'room', 800_000, 700_000),
    adjusted('OTM-T03', lan, addDays(today, -3), 'minibar', 60_000, 30_000),
    adjusted('OTM-T04', lan, addDays(today, -10), 'minibar', 60_000, 0),
    adjusted('OTM-T05', lan, addDays(today, -1), 'laundry', 30_000, 45_000),
  );
  const asked: URLSearchParams[] = [];
  const on = ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/audit-events')) asked.push(url.searchParams);
  };
  server.events.on('request:start', on);
  onTestFinished(() => {
    server.events.removeListener('request:start', on);
  });
  return { today, asked };
}

const codesShown = () => {
  const table = screen.getByRole('table', { name: tv('moneylog.title') });
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((r) => r.querySelector('td.mono')?.textContent ?? '');
};
const reductionsSwitch = () => screen.findByRole('switch', { name: tv('mlog.filter_reductions') });

describe('Nhật ký tiền – "Sửa giảm dòng – 7 ngày" (US-177 AC7 (i))', () => {
  it('MGR: dates go as `from`/`to`; the switch → reductionsOnly over the last 7 days (no night lines, no raise, nothing older); by person → actorUserId', async () => {
    const { today, asked } = seed();
    const { user } = renderApp('/audit', 'qa.mgr');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    const first = asked[0]!;
    expect(first.get('from')).toBe(addDays(today, -7));
    expect(first.get('to')).toBe(today);
    expect(first.has('dateFrom')).toBe(false);
    expect(first.has('reductionsOnly')).toBe(false);

    const sw = await reductionsSwitch();
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await user.click(sw);
    await waitFor(() => expect(asked.at(-1)!.get('reductionsOnly')).toBe('true'));
    expect(asked.at(-1)!.get('from')).toBe(addDays(today, -6));
    expect(asked.at(-1)!.get('to')).toBe(today);
    await waitFor(() => expect(codesShown().sort()).toEqual(['OTM-T01', 'OTM-T03']));

    const who = screen.getByLabelText(tv('mlog.who'));
    expect(within(who).getByRole('option', { name: tv('mlog.all_people') })).toBeInTheDocument();
    await user.selectOptions(who, within(who).getByRole('option', { name: /^Lan/ }));
    await waitFor(() => expect(asked.at(-1)!.get('actorUserId')).toBe(LAN));
    expect(asked.at(-1)!.get('reductionsOnly')).toBe('true');
    await waitFor(() => expect(codesShown()).toEqual(['OTM-T03']));
  });

  it('FD: no switch, no person filter (the server keeps FD to their own rows)', async () => {
    seed();
    renderApp('/audit', 'qa.fd');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    expect(screen.queryByRole('switch', { name: tv('mlog.filter_reductions') })).toBeNull();
    expect(screen.queryByLabelText(tv('mlog.who'))).toBeNull();
  });

  it('"Cần chú ý" link (reductionsOnly, month, actorUserId) → the same filter, the month as its days up to today', async () => {
    const { today, asked } = seed();
    const month = today.slice(0, 7);
    renderApp(`/audit?reductionsOnly=true&month=${month}&actorUserId=${LAN}`, 'qa.mgr');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    expect(await reductionsSwitch()).toHaveAttribute('aria-checked', 'true');
    expect(asked[0]!.get('reductionsOnly')).toBe('true');
    expect(asked[0]!.get('actorUserId')).toBe(LAN);
    expect(asked[0]!.get('from')).toBe(`${month}-01`);
    expect(asked[0]!.get('to')).toBe(today);
    await waitFor(() => expect(screen.getByLabelText(tv('mlog.who'))).toHaveValue(LAN));
  });

  it('"Cần chú ý" foc_threshold line_reduction_count → its sentence (no name) and the server link to the filter', () => {
    const ctx = {
      t: (k: string, a?: Record<string, string | number>) => translate('vi', k, a),
      roles: ['owner' as const],
      room: (n?: string | null) => n ?? '',
      channel: (c: string) => c,
      num: (n: number) => String(n),
    };
    const link = `/audit?reductionsOnly=true&month=2026-11&actorUserId=${LAN}`;
    const line = attentionLine(
      {
        kind: 'foc_threshold',
        source: 'computed',
        severity: 'warning',
        params: { check: 'line_reduction_count', count: 3, max: 2 },
        link,
      },
      ctx,
    );
    expect(line.text).toBe(tv('attn.line_reduction_count', { count: '3', max: '2' }));
    expect(line.to).toBe(link);
    // a link that is not the money log is never followed
    expect(
      attentionLine(
        {
          kind: 'foc_threshold',
          source: 'computed',
          severity: 'warning',
          params: { check: 'line_reduction_count', count: 3, max: 2 },
          link: 'https://example.test/x',
        },
        ctx,
      ).to,
    ).toBe('/audit?reductionsOnly=true');
  });
});

describe('Nhật ký tiền – UXD review #128 (FB-R5-UXD-FE-PR128-01…03)', () => {
  /** Not a seed account: someone who left (or lost the role) since the "Cần chú ý" line was computed. */
  const GONE = '0192a1b0-0000-7000-8000-0000000000ff';

  it('PR128-01 + PR128-03 (a): a link to someone not on the list → "Someone not on the list" stays the filter; no reduction → the reductions empty title, MGR body', async () => {
    const { today } = seed();
    renderApp(
      `/audit?reductionsOnly=true&month=${today.slice(0, 7)}&actorUserId=${GONE}`,
      'qa.mgr',
    );
    const who = await screen.findByLabelText(tv('mlog.who'));
    await waitFor(() =>
      expect(
        within(who).getByRole('option', { name: tv('mlog.who_unlisted') }),
      ).toBeInTheDocument(),
    );
    expect(who).toHaveValue(GONE);
    expect(within(who).queryByRole('option', { name: '–' })).toBeNull();
    expect(await screen.findByText(tv('mlog.empty_reductions_title'))).toBeInTheDocument();
    expect(screen.getByText(tv('mlog.empty_body'))).toBeInTheDocument();
    expect(screen.queryByText(tv('mlog.empty_title'))).toBeNull();
  });

  it('PR128-02: the list of people cannot be read → the help line under "Người làm", tied to the box; the table still loads', async () => {
    seed();
    server.use(
      http.get('*/v1/properties/:propertyId/closer-candidates', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Service unavailable', status: 500, code: 'INTERNAL' },
          { status: 500 },
        ),
      ),
    );
    renderApp('/audit', 'qa.mgr');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    const who = screen.getByLabelText(tv('mlog.who'));
    await waitFor(() => expect(who).toHaveAccessibleDescription(tv('mlog.who_error')));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('ARC FE-140-03: the list cannot be read and the link names someone → "Someone not on the list", never "Loading…" for ever', async () => {
    const { today } = seed();
    server.use(
      http.get('*/v1/properties/:propertyId/closer-candidates', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Service unavailable', status: 500, code: 'INTERNAL' },
          { status: 500 },
        ),
      ),
    );
    renderApp(`/audit?reductionsOnly=true&month=${today.slice(0, 7)}&actorUserId=${LAN}`, 'qa.mgr');
    const who = await screen.findByLabelText(tv('mlog.who'));
    await waitFor(() => expect(who).toHaveAccessibleDescription(tv('mlog.who_error')));
    expect(within(who).getByRole('option', { name: tv('mlog.who_unlisted') })).toBeInTheDocument();
    expect(within(who).queryByRole('option', { name: tv('common.loading') })).toBeNull();
    expect(who).toHaveValue(LAN);
  });

  it('PR128-02: the list loads → no help line', async () => {
    seed();
    renderApp('/audit', 'qa.mgr');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    const who = screen.getByLabelText(tv('mlog.who'));
    await waitFor(() =>
      expect(within(who).getByRole('option', { name: /^Lan/ })).toBeInTheDocument(),
    );
    expect(screen.queryByText(tv('mlog.who_error'))).toBeNull();
  });

  it('PR128-03 (b): FD with nothing in the range → the usual title, the body that only speaks of dates (no person filter to clear)', async () => {
    seed();
    renderApp('/audit?month=2020-01', 'qa.fd');
    expect(await screen.findByText(tv('mlog.empty_title'))).toBeInTheDocument();
    expect(screen.getByText(tv('mlog.empty_body_dates'))).toBeInTheDocument();
    expect(screen.queryByText(tv('mlog.empty_body'))).toBeNull();
  });
});

describe('Nhật ký tiền – "Xem thêm" (BA: a month from "Cần chú ý" was cut at the first page)', () => {
  it('more rows than a page → "Xem thêm" reads the next page with the same filter; the last page → no button', async () => {
    const { today, asked } = seed();
    const lan = { id: LAN, name: 'Lan' };
    for (let i = 0; i < 105; i += 1)
      mockControl.stay.audit.unshift(
        adjusted(`OTM-P${String(i).padStart(3, '0')}`, lan, today, 'laundry', 50_000, 20_000),
      );
    const { user } = renderApp(
      `/audit?reductionsOnly=true&month=${today.slice(0, 7)}&actorUserId=${LAN}`,
      'qa.mgr',
    );
    await screen.findByRole('table', { name: tv('moneylog.title') });
    const shown = () =>
      within(screen.getByRole('table', { name: tv('moneylog.title') })).getAllByRole('row').length -
      1;
    await waitFor(() => expect(shown()).toBe(100));
    expect(asked[0]!.has('cursor')).toBe(false);
    await user.click(screen.getByRole('button', { name: tv('common.load_more') }));
    // Lan's 105 + her 2 seeded reductions of this month (OTM-T03 three days ago only when still this month)
    await waitFor(() => expect(shown()).toBeGreaterThan(100));
    const second = asked.at(-1)!;
    expect(second.get('cursor')).toBe('100');
    expect(second.get('reductionsOnly')).toBe('true');
    expect(second.get('actorUserId')).toBe(LAN);
    expect(second.get('from')).toBe(asked[0]!.get('from'));
    expect(second.get('to')).toBe(asked[0]!.get('to'));
    expect(screen.queryByRole('button', { name: tv('common.load_more') })).toBeNull();
    // no row twice
    const codes = codesShown();
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('a filter change starts again from the first page', async () => {
    const { today, asked } = seed();
    const lan = { id: LAN, name: 'Lan' };
    for (let i = 0; i < 101; i += 1)
      mockControl.stay.audit.unshift(
        adjusted(`OTM-Q${String(i).padStart(3, '0')}`, lan, today, 'laundry', 50_000, 20_000),
      );
    const { user } = renderApp('/audit', 'qa.mgr');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    await user.click(await screen.findByRole('button', { name: tv('common.load_more') }));
    await waitFor(() => expect(asked.at(-1)!.get('cursor')).toBe('100'));
    await user.click(await reductionsSwitch());
    await waitFor(() => expect(asked.at(-1)!.get('reductionsOnly')).toBe('true'));
    expect(asked.at(-1)!.has('cursor')).toBe(false);
    // ARC FE-140-02: the rows of the old filter's next page are gone – one page at most
    await waitFor(() =>
      expect(
        within(screen.getByRole('table', { name: tv('moneylog.title') })).getAllByRole('row')
          .length - 1,
      ).toBeLessThanOrEqual(100),
    );
  });

  it('FB-R5-UXD-FE-PR140-03: the next page cannot be read → the sentence under the button, the rows kept; again → more rows, no sentence', async () => {
    const { today } = seed();
    const lan = { id: LAN, name: 'Lan' };
    for (let i = 0; i < 101; i += 1)
      mockControl.stay.audit.unshift(
        adjusted(`OTM-R${String(i).padStart(3, '0')}`, lan, today, 'laundry', 50_000, 20_000),
      );
    let failed = 0;
    server.use(
      http.get('*/v1/properties/:propertyId/audit-events', ({ request }) => {
        if (!new URL(request.url).searchParams.has('cursor') || failed > 0) return undefined;
        failed += 1;
        return HttpResponse.json(
          { type: 'about:blank', title: 'Service unavailable', status: 500, code: 'INTERNAL' },
          { status: 500 },
        );
      }),
    );
    const { user } = renderApp('/audit', 'qa.mgr');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    const shown = () =>
      within(screen.getByRole('table', { name: tv('moneylog.title') })).getAllByRole('row').length -
      1;
    await waitFor(() => expect(shown()).toBe(100));
    const more = screen.getByRole('button', { name: tv('common.load_more') });
    await user.click(more);
    expect(await screen.findByRole('alert')).toHaveTextContent(tv('common.error_generic_title'));
    expect(shown()).toBe(100);
    await user.click(screen.getByRole('button', { name: tv('common.load_more') }));
    await waitFor(() => expect(shown()).toBeGreaterThan(100));
    expect(screen.queryByText(tv('common.error_generic_title'))).toBeNull();
  });
});
