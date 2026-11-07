// FB-R5-DOM-FE-155-04 – Nhật ký tiền, "Đổi người chốt: {from} → {to}". The server writes the closer's user id
// (`reservation.closer_changed`: `before.closerUserId`, `after.closerUserId`; contract 0.3.13 bổ sung 1h), never a
// name, and nothing at all on rows written before #154. The Desk used to read a `closer` key the server never writes,
// so both names were blank. Names now come from the people list the page loads (`closer-candidates`, kind all): staff
// and CTVs; an id not in it (locked, left) → "Someone not on the list"; no id → "—". Mock data only.
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/** Seed accounts (`mocks/seed.ts`). */
const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const QUAN = uid(2); // qa.mgr, Quân
const LAN = uid(3); // qa.fdl, Lan
const HANH = uid(4); // qa.fd, Hạnh
const SON = uid(7); // qa.sal, Sơn (sale)
const MAI = uid(8); // qa.ctv1, Mai (CTV)
const LOCKED = uid(10); // qa.locked – disabled, not in the list

function closerChanged(
  code: string,
  actor: { id: string; name: string },
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) {
  return {
    occurredAt: new Date().toISOString(),
    actorType: 'user',
    actorName: actor.name,
    actorUserId: actor.id,
    category: 'money',
    action: 'reservation.closer_changed',
    entityType: 'reservation',
    entityCode: code,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    reason: 'Khach do CTV gioi thieu',
  };
}

const said = (from: string, to: string) => tv('mlog.a_closer_changed', { from, to });

/** The "Việc" cell of the row of booking `code`. */
function actionOf(code: string) {
  const table = screen.getByRole('table', { name: tv('moneylog.title') });
  const row = within(table)
    .getAllByRole('row')
    .find((r) => r.querySelector('td.mono')?.textContent === code);
  return row?.querySelectorAll('td')[2]?.textContent ?? null;
}

describe('Nhật ký tiền – "Đổi người chốt" names the closers from closerUserId (FB-R5-DOM-FE-155-04)', () => {
  it('MGR: staff and CTV by name; a locked account → "Someone not on the list"; no closer before / a row before #154 → "—"', async () => {
    const quan = { id: QUAN, name: 'Quân · Quản lý' };
    mockControl.stay.audit.unshift(
      closerChanged('OTM-C01', quan, { closerUserId: SON }, { closerUserId: MAI }),
      closerChanged('OTM-C02', quan, { closerUserId: LOCKED }, { closerUserId: LAN }),
      closerChanged('OTM-C03', quan, { closerUserId: null }, { closerUserId: SON }),
      closerChanged('OTM-C04', quan, null, null),
    );
    renderApp('/audit', 'qa.mgr');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    await waitFor(() => expect(actionOf('OTM-C01')).toBe(said('Sơn', 'Mai')));
    expect(actionOf('OTM-C02')).toBe(said(tv('mlog.who_unlisted'), 'Lan'));
    expect(actionOf('OTM-C03')).toBe(said('—', 'Sơn'));
    expect(actionOf('OTM-C04')).toBe(said('—', '—'));
    // never an id on screen
    expect(screen.queryByText(new RegExp(SON))).toBeNull();
    // the "Người làm" filter still lists the staff only – the CTV names a row, she is not an option
    const who = screen.getByLabelText(tv('mlog.who'));
    expect(within(who).getByRole('option', { name: 'Sơn' })).toBeInTheDocument();
    expect(within(who).queryByRole('option', { name: 'Mai' })).toBeNull();
  });

  it('FD sees own "Đổi người chốt" rows by name too (no filter, the list is still read)', async () => {
    mockControl.stay.audit.unshift(
      closerChanged(
        'OTM-C05',
        { id: HANH, name: 'Hạnh' },
        { closerUserId: SON },
        { closerUserId: MAI },
      ),
    );
    renderApp('/audit', 'qa.fd');
    await screen.findByRole('table', { name: tv('moneylog.title') });
    await waitFor(() => expect(actionOf('OTM-C05')).toBe(said('Sơn', 'Mai')));
    expect(screen.queryByLabelText(tv('mlog.who'))).toBeNull();
  });

  it('the list cannot be read → "Someone not on the list" for each id, never "Loading…" for ever; no id stays "—"', async () => {
    mockControl.stay.audit.unshift(
      closerChanged(
        'OTM-C06',
        { id: QUAN, name: 'Quân · Quản lý' },
        { closerUserId: null },
        { closerUserId: MAI },
      ),
    );
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
    await waitFor(() => expect(actionOf('OTM-C06')).toBe(said('—', tv('mlog.who_unlisted'))));
    expect(actionOf('OTM-C06')).not.toContain(tv('common.loading'));
  });
});
