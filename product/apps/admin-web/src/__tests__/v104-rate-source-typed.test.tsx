// UXD-on-v104-src-typed (QA on #75) + FB-R4-UXD-FE-PR70-02 – H09 Đặt phòng mới, column "Nguồn giá": the label was
// picked by weekday only, so a night the desk typed still read "Giá niêm yết (BR-101)" although the booking saves it
// as typed (B1 `edited:true` → `manual`). The label now says what the box holds:
// - a typed number (any channel, also while a preview is on its way) → `bk.src_typed`;
// - an empty box (emptied, preview on its way, OTA / Nội bộ not typed) → "–";
// - a box filled by the preview of the stay on screen → `bk.src_list`, every night – no "+15%" by weekday any more
//   (BR-104 v0.5.1, DOM lượt 8 §4.2; the server prices the nights, the figures do not change).
// While the preview of the stay on screen is on its way, the rate table and the total table are aria-busy and the
// total shows no figure of the previous stay.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];

const rateBox = (dlg: HTMLElement, date: string) =>
  within(dlg).getByLabelText(`${tv('rate.pre_tier')} ${dayMonth(date)}`) as HTMLInputElement;
/** The "Nguồn giá" cell of the night's row. */
const sourceOf = (dlg: HTMLElement, date: string) =>
  (rateBox(dlg, date).closest('tr') as HTMLTableRowElement).cells[2]!;
const rateTable = (dlg: HTMLElement, date: string) =>
  rateBox(dlg, date).closest('.rate-table') as HTMLElement;
/** The line of a night filled by the preview of the stay on screen (BR-101). */
const listLine = () => tv('bk.src_list');
const typedLine = () => tv('bk.src_typed');
const totalTable = (dlg: HTMLElement) =>
  within(dlg).getByRole('table', { name: tv('booking.summary.total') });
const totalFigure = (dlg: HTMLElement) =>
  (within(totalTable(dlg)).getByText(tv('bk.total')).closest('tr') as HTMLTableRowElement)
    .cells[1]!;

const today = () => todayLocal();
const night2 = () => addDays(todayLocal(), 1);

/** Đặt phòng mới, 2 nights from today (first room), both boxes filled by the preview. */
async function openTwoNights(user: User) {
  await screen.findByRole('grid');
  await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
  const dlg = await screen.findByRole('dialog', { name: /Đặt phòng mới/ });
  fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
    target: { value: addDays(today(), 2) },
  });
  await waitFor(
    () => {
      expect(rateBox(dlg, today()).value).not.toBe('');
      expect(rateBox(dlg, night2()).value).not.toBe('');
    },
    { timeout: 3000 },
  );
  return dlg;
}

/** The next Friday after today (today itself excluded). */
function nextFriday(): string {
  let d = addDays(todayLocal(), 1);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 5) d = addDays(d, 1);
  return d;
}

async function typeRate(user: User, dlg: HTMLElement, date: string, value: string) {
  const box = rateBox(dlg, date);
  await user.clear(box);
  if (value) await user.type(box, value);
}

async function pickRoom(user: User, dlg: HTMLElement, no: string) {
  const room = within(dlg).getByLabelText(/^Căn/);
  await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
  await user.selectOptions(room, within(room).getByRole('option', { name: new RegExp(`^${no} `) }));
}

describe('UXD-on-v104-src-typed – "Nguồn giá" says what the box holds', () => {
  it('Trực tiếp: typed night → "Giá đã gõ", the other night keeps its list line; emptied → "–"', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openTwoNights(user);
    expect(sourceOf(dlg, today())).toHaveTextContent(listLine());

    await typeRate(user, dlg, today(), '880000');
    expect(sourceOf(dlg, today())).toHaveTextContent(typedLine());
    expect(sourceOf(dlg, today())).not.toHaveTextContent(listLine());
    expect(sourceOf(dlg, night2())).toHaveTextContent(listLine());

    await typeRate(user, dlg, today(), '');
    expect(sourceOf(dlg, today())).toHaveTextContent(/^–$/);
  });

  it('PR70-02 – another room, its preview on its way: typed night stays "Giá đã gõ", the others "–", tables aria-busy, no total of the old room', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openTwoNights(user);
    await typeRate(user, dlg, today(), '880000');
    expect(rateTable(dlg, today())).not.toHaveAttribute('aria-busy');
    expect(totalFigure(dlg)).not.toHaveTextContent(/^–$/);
    // the preview of 203 (same room group as the first room – the typed rate is kept, DOM) is held until release()
    const r203 = mockControl.db.rooms.find((x) => x.roomNo === '203')!;
    let release!: () => void;
    const gate = new Promise<void>((ok) => (release = ok));
    server.use(
      http.post('*/quotes/calculate', async ({ request }) => {
        const b = (await request.clone().json()) as { roomId?: string };
        if (b.roomId !== r203.id) return undefined;
        await gate;
        return undefined;
      }),
    );
    await pickRoom(user, dlg, '203');
    expect(sourceOf(dlg, today())).toHaveTextContent(typedLine());
    expect(sourceOf(dlg, night2())).toHaveTextContent(/^–$/);
    expect(rateTable(dlg, today())).toHaveAttribute('aria-busy', 'true');
    expect(totalTable(dlg)).toHaveAttribute('aria-busy', 'true');
    expect(totalFigure(dlg)).toHaveTextContent(/^–$/);

    release();
    await waitFor(() => expect(rateTable(dlg, today())).not.toHaveAttribute('aria-busy'), {
      timeout: 3000,
    });
    expect(sourceOf(dlg, today())).toHaveTextContent(typedLine());
    expect(sourceOf(dlg, night2())).toHaveTextContent(listLine());
    expect(totalTable(dlg)).not.toHaveAttribute('aria-busy');
    expect(totalFigure(dlg)).not.toHaveTextContent(/^–$/);
  });

  it('PR82-01 – 7 nights → 3, the 3-night preview on its way: no BR-107 sentence of the 7-night preview; then "không áp dụng"', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openTwoNights(user);
    const departure = within(dlg).getByLabelText(tv('booking.field.departure'));
    fireEvent.change(departure, { target: { value: addDays(today(), 7) } });
    // the 7-night stay is stepped (BR-107): both sentences are there
    expect(await within(dlg).findByText(tv('sale.los_applied', { pct: 10 }))).toBeInTheDocument();
    expect(within(dlg).getByText(tv('rate.tier_note', { n: 7, pct: 10 }))).toBeInTheDocument();
    // the preview of the 3-night stay is held until release()
    let release!: () => void;
    const gate = new Promise<void>((ok) => (release = ok));
    server.use(
      http.post('*/quotes/calculate', async ({ request }) => {
        const b = (await request.clone().json()) as { nights?: number };
        if (b.nights !== 3) return undefined;
        await gate;
        return undefined;
      }),
    );
    fireEvent.change(departure, { target: { value: addDays(today(), 3) } });
    expect(totalTable(dlg)).toHaveAttribute('aria-busy', 'true');
    expect(dlg.textContent).not.toContain(tv('rate.tier_note', { n: 3, pct: 10 }));
    expect(dlg.textContent).not.toContain(tv('sale.los_applied', { pct: 10 }));
    expect(dlg.textContent).not.toContain(tv('bk.los_none'));

    release();
    expect(await within(dlg).findByText(tv('bk.los_none'))).toBeInTheDocument();
    expect(dlg.textContent).not.toContain(tv('sale.los_applied', { pct: 10 }));
  });

  it('Friday and Saturday filled by the preview → "Giá niêm yết (BR-101)", never the "+15%" weekday line', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openTwoNights(user);
    const fri = nextFriday();
    const sat = addDays(fri, 1);
    fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
      target: { value: addDays(fri, 2) },
    });
    fireEvent.change(within(dlg).getByLabelText(tv('booking.field.arrival')), {
      target: { value: fri },
    });
    await waitFor(
      () => {
        expect(rateBox(dlg, fri).value).not.toBe('');
        expect(rateBox(dlg, sat).value).not.toBe('');
      },
      { timeout: 3000 },
    );
    for (const d of [fri, sat]) {
      expect(sourceOf(dlg, d)).toHaveTextContent(tv('bk.src_list'));
      expect(sourceOf(dlg, d)).not.toHaveTextContent(tv('bk.src_weekend'));
    }
  });

  it('OTA: the typed night → "Giá đã gõ", the night not typed → "–"', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openTwoNights(user);
    await user.click(within(dlg).getByRole('button', { name: tv('bk.ch_ota') }));
    await typeRate(user, dlg, today(), '880000');
    expect(sourceOf(dlg, today())).toHaveTextContent(typedLine());
    expect(sourceOf(dlg, night2())).toHaveTextContent(/^–$/);
  });
});
