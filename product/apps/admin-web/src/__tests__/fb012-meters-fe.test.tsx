// FB-INV-012 (R5) – S12 end-of-month meter readings after the review (ARC-FE-189-01/02/08, BE-190-01/03, UXD-189-09):
// for month M the desk enters Closing M (`period_end`) and Opening M+1 (`period_start`) – two readings, two POSTs,
// two photo uploads. The opening is typed (never pre-filled); the closing just typed is its reference; a higher
// opening is vacancy use (not billed), a lower one is saved only after "Save anyway". All data is made up.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { meterUsage, monthOf, parseMeter, readingMonthOn, shiftMonth } from '../app/statements';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Pin `Date` to noon of `day` and re-seed the mock around it (the seed is relative to the business day). */
export function pinDay(day: string) {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(`${day}T12:00:00+07:00`));
  onTestFinished(() => {
    vi.useRealTimers();
  });
  mockControl.reset();
}
/** Day 01 of next month: inside the window that closes this month (BR-LS-10). */
export const windowDay = () => `${shiftMonth(monthOf(todayLocal()), 1)}-01`;
/** Day 05 of next month: 4 days after the window – late, allowed to FDL+ with a reason (BE-190-03). */
const lateDay = () => `${shiftMonth(monthOf(todayLocal()), 1)}-05`;

async function row203() {
  const th = await screen.findByRole('rowheader', { name: /^203 · N\. Minh/ });
  return th.closest('tr')!;
}
const label = (meter: 'electricity' | 'water', which: 'opening' | 'closing') =>
  `${tv(`stmt.meter.${meter}`)} – ${tv(`meters.${which}`)} – 203`;
function type(row: HTMLElement, meter: 'electricity' | 'water', closing: string, opening: string) {
  fireEvent.change(within(row).getByLabelText(label(meter, 'closing')), {
    target: { value: closing },
  });
  fireEvent.change(within(row).getByLabelText(label(meter, 'opening')), {
    target: { value: opening },
  });
}
function attachPhoto(row: HTMLElement) {
  const input = row.querySelector<HTMLInputElement>('input[type=file]')!;
  fireEvent.change(input, {
    target: { files: [new File(['x'], 'meter.jpg', { type: 'image/jpeg' })] },
  });
}
const saved = (kind: string, periodMonth: string) =>
  mockControl.statements.readings.find(
    (r) => r.roomNo === '203' && r.kind === kind && r.periodMonth === periodMonth && !r.voidedAt,
  );

describe('FB-INV-012 meter maths (BR-LS-11/12)', () => {
  it('parseMeter drops extra digits on the typed text; usage formulas; reading month', () => {
    expect(parseMeter('38.67', 'water')).toBe(38.6);
    expect(parseMeter('38,6', 'water')).toBe(38.6);
    expect(parseMeter('1404.9', 'electricity')).toBe(1404);
    expect(parseMeter('12a', 'electricity')).toBeNull();
    expect(meterUsage(1262, { value: 1404 }, 'electricity')).toBe(142);
    expect(meterUsage(35.2, { value: 38.6 }, 'water')).toBe(3.4);
    expect(
      meterUsage(
        1250,
        {
          value: 82,
          exception: { type: 'replaced', oldFinal: 1310, newStart: 0, replacedOn: '2026-11-15' },
        },
        'electricity',
      ),
    ).toBe(142);
    expect(
      meterUsage(
        99990,
        { value: 20, exception: { type: 'rollover', maxValue: 99999 } },
        'electricity',
      ),
    ).toBe(30);
    expect(readingMonthOn('2026-12-01')).toBe('2026-11');
    expect(readingMonthOn('2026-11-30')).toBe('2026-11');
    expect(readingMonthOn('2026-11-17')).toBe('2026-10');
  });
});

describe('FB-INV-012 S12: Closing M + Opening M+1 (ARC-FE-189-01, INV 17/11)', () => {
  it('opening of M is read-only; the next opening is empty, required, referenced to the closing typed', async () => {
    pinDay(windowDay());
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await row203();
    const { P, M } = mockControl.statements;
    // Group titles name the months; the opening of M (1.262) is shown, not editable.
    expect(row.textContent).toContain(tv('meters.opening_of', { value: '1.262' }));
    expect(row.textContent).toContain(tv('meters.opening_of', { value: '35,2' }));
    const next = within(row).getByLabelText(label('electricity', 'opening'));
    expect(next).toHaveValue('');
    expect(row.textContent).toContain(tv('meters.last_closing_pending'));
    fireEvent.change(within(row).getByLabelText(label('electricity', 'closing')), {
      target: { value: '1404' },
    });
    expect(within(row).getByText(tv('meters.usage_preview', { usage: '142' }))).toBeVisible();
    expect(row.textContent).toContain(tv('meters.last_closing', { value: '1.404' }));
    // Higher opening → vacancy use, not billed; lower → warning.
    fireEvent.change(next, { target: { value: '1410' } });
    expect(within(row).getByText(tv('meters.gap', { gap: '6' }))).toBeVisible();
    fireEvent.change(next, { target: { value: '1400' } });
    expect(
      within(row).getByText(tv('meters.below_inline', { opening: '1.400', previous: '1.404' })),
    ).toBeVisible();
    // Required: saving without the next opening says so; nothing is written.
    fireEvent.change(next, { target: { value: '' } });
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    expect(within(row).getAllByText(tv('common.required')).length).toBeGreaterThan(0);
    expect(saved('period_end', P)).toBeUndefined();
    expect(saved('period_start', M)).toBeUndefined();
  });

  it('Save = two readings (period_end M, period_start M+1), two photos; the server usage is shown', async () => {
    pinDay(windowDay());
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await row203();
    type(row, 'electricity', '1404', '1410');
    type(row, 'water', '38.67', '38.6');
    attachPhoto(row);
    expect(within(row).getByText('meter.jpg')).toBeVisible();
    expect(within(row).getByRole('button', { name: tv('meters.photo_change') })).toBeVisible();
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    const { P, M } = mockControl.statements;
    await waitFor(() => expect(saved('period_start', M)).toBeDefined());
    const close = saved('period_end', P)!;
    const open = saved('period_start', M)!;
    expect(close.electricity.value).toBe(1404);
    // BR-LS-11: 38,67 → 38,6 (the extra digit is dropped).
    expect(close.water.value).toBe(38.6);
    expect(open.electricity.value).toBe(1410);
    expect(close.photoAttachmentId).toBeTruthy();
    expect(open.photoAttachmentId).toBeTruthy();
    expect(open.photoAttachmentId).not.toBe(close.photoAttachmentId);
    const done = await row203();
    expect(await within(done).findByText(tv('meters.usage', { usage: '142' }))).toBeVisible();
    expect(within(done).getByText(tv('meters.gap_saved', { gap: '6' }))).toBeVisible();
  });

  it('opening below the last closing: FD can "Save anyway" – sent with acknowledgeLowerThanPrevious (BE-190-01)', async () => {
    pinDay(windowDay());
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await row203();
    type(row, 'electricity', '1404', '1402');
    type(row, 'water', '38.6', '38.6');
    attachPhoto(row);
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    const dlg = await screen.findByRole('alertdialog');
    expect(
      within(dlg).getByRole('button', { name: tv('meters.exception.replaced') }),
    ).toBeDisabled();
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.save_anyway') }));
    const { M } = mockControl.statements;
    await waitFor(() => expect(saved('period_start', M)).toBeDefined());
    expect(saved('period_start', M)!.acknowledgedLower).toBe(true);
    const done = await row203();
    expect(await within(done).findByText(tv('meters.below_saved', { gap: '2' }))).toBeVisible();
  });

  it('the server two-step: 422 OPENING_BELOW_PREVIOUS_CLOSING opens the dialog; "Save anyway" resends with the flag', async () => {
    pinDay(windowDay());
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await row203();
    // The last closing changed elsewhere (another tab): the server knows better than the screen.
    const sent: Array<Record<string, unknown>> = [];
    server.use(
      http.post('*/reservations/:reservationId/meter-readings', async ({ request }) => {
        const b = (await request.clone().json()) as Record<string, unknown>;
        if (b.kind !== 'period_start') return undefined;
        sent.push({ ...b, key: request.headers.get('idempotency-key') });
        if (b.acknowledgeLowerThanPrevious) return undefined;
        return HttpResponse.json(
          {
            type: '/problems/opening-below-previous-closing',
            title: 'OPENING_BELOW_PREVIOUS_CLOSING',
            status: 422,
            code: 'OPENING_BELOW_PREVIOUS_CLOSING',
            meter: 'electricity',
            previousValue: 1420,
          },
          { status: 422, headers: { 'content-type': 'application/problem+json' } },
        );
      }),
    );
    type(row, 'electricity', '1404', '1404');
    type(row, 'water', '38.6', '38.6');
    attachPhoto(row);
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    const dlg = await screen.findByRole('alertdialog');
    expect(dlg.textContent).toContain(
      tv('meters.below_body', { opening: '1.404', previous: '1.420' }),
    );
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.save_anyway') }));
    const { M } = mockControl.statements;
    await waitFor(() => expect(saved('period_start', M)).toBeDefined());
    expect(sent).toHaveLength(2);
    expect(sent[1]!.acknowledgeLowerThanPrevious).toBe(true);
    // A new Idempotency-Key after the 4xx (the same key would replay the 422).
    expect(sent[1]!.key).not.toBe(sent[0]!.key);
  });

  it('FD: closing below the opening offers Wrong entry only (A89); no photo waiver', async () => {
    pinDay(windowDay());
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await row203();
    type(row, 'electricity', '82', '82');
    type(row, 'water', '38.6', '38.6');
    attachPhoto(row);
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    const dlg = await screen.findByRole('alertdialog');
    expect(within(dlg).getByRole('button', { name: tv('meters.wrong_entry') })).toBeEnabled();
    expect(
      within(dlg).getByRole('button', { name: tv('meters.exception.replaced') }),
    ).toBeDisabled();
    expect(
      within(dlg).getByRole('button', { name: tv('meters.exception.rollover') }),
    ).toBeDisabled();
    expect(within(dlg).getByText(tv('meters.ask_lead'))).toBeVisible();
    expect(within(row).queryByLabelText(tv('meters.photo_waive'))).toBeNull();
  });

  it('FDL: meter replaced on the closing (60 + 82 = 142)', async () => {
    pinDay(windowDay());
    renderApp('/long-stay/meters', 'qa.fdl');
    const row = await row203();
    type(row, 'electricity', '82', '82');
    type(row, 'water', '38.6', '38.6');
    attachPhoto(row);
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    const dlg = await screen.findByRole('alertdialog');
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.exception.replaced') }));
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${esc(tv('meters.old_final'))}`)), {
      target: { value: '1322' },
    });
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${esc(tv('meters.replaced_on'))}`)), {
      target: { value: `${mockControl.statements.P}-15` },
    });
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.use_exception') }));
    expect(within(row).getByText(tv('meters.usage_preview', { usage: '142' }))).toBeVisible();
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    await waitFor(() =>
      expect(saved('period_end', mockControl.statements.P)?.electricity.exception).toMatchObject({
        type: 'replaced',
        oldFinal: 1322,
      }),
    );
  });
});

describe('FB-INV-012 S12 late reading (BE-190-03)', () => {
  it('FD after the window: "ask the lead", Save disabled', async () => {
    pinDay(lateDay());
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await row203();
    expect(row.textContent).toContain(
      tv('meters.late_fd', { date: expect.anything() as never })
        .split('(')[0]!
        .trim(),
    );
    expect(within(row).getByRole('button', { name: tv('meters.save') })).toBeDisabled();
  });

  it('FDL after the window: a reason is required, then both readings carry it', async () => {
    pinDay(lateDay());
    renderApp('/long-stay/meters', 'qa.fdl');
    const row = await row203();
    type(row, 'electricity', '1404', '1410');
    type(row, 'water', '38.6', '38.6');
    attachPhoto(row);
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    expect(await within(row).findByText(tv('meters.void_reason_required'))).toBeVisible();
    fireEvent.change(within(row).getByLabelText(new RegExp(`^${esc(tv('meters.late_reason'))}`)), {
      target: { value: 'Khách vắng ngày 01' },
    });
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    const { P, M } = mockControl.statements;
    await waitFor(() => expect(saved('period_start', M)).toBeDefined());
    expect(saved('period_end', P)!.lateReason).toBe('Khách vắng ngày 01');
    expect(saved('period_start', M)!.lateReason).toBe('Khách vắng ngày 01');
  });
});

/**
 * Room 203 as a stay that came in on day 10 of the reading month P with no reading yet. With `previousClosing`, the
 * room's last closing (an earlier stay's checkout on day 05) is left on record.
 */
function midMonthArrival(previousClosing?: number) {
  const st = mockControl.statements;
  const stay = st.stays.find((s) => s.roomNo === '203')!;
  const keep = st.readings.filter((r) => r.reservationId !== stay.reservationId);
  st.readings.splice(0, st.readings.length, ...keep);
  stay.arrivalDate = `${st.P}-10`;
  if (previousClosing !== undefined) {
    const model = keep[0]!;
    st.seq += 1;
    st.readings.push({
      ...model,
      id: '0192a1b0-0000-7000-8000-000000839997',
      seq: st.seq,
      reservationId: '0192a1b0-0000-7000-8000-000000819999',
      roomId: stay.roomId,
      roomNo: '203',
      kind: 'checkout',
      periodMonth: null,
      readOn: `${st.P}-05`,
      electricity: { value: previousClosing, exception: null },
      water: { value: 35.2, exception: null },
    });
  }
}

async function openCheckin() {
  const row = await row203();
  expect(row.textContent).toContain(tv('meters.opening_missing'));
  fireEvent.click(within(row).getByRole('button', { name: tv('meters.checkin_enter') }));
  return screen.findByRole('dialog', { name: tv('meters.checkin_title', { room: '203' }) });
}
function fillCheckin(dlg: HTMLElement, day: string, kwh: string, m3: string) {
  fireEvent.change(dlg.querySelector('input[type=date]')!, { target: { value: day } });
  fireEvent.change(
    within(dlg).getByLabelText(new RegExp(`^${esc(tv('stmt.meter.electricity'))}`)),
    { target: { value: kwh } },
  );
  fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${esc(tv('stmt.meter.water'))}`)), {
    target: { value: m3 },
  });
  fireEvent.change(dlg.querySelector('input[type=file]')!, {
    target: { files: [new File(['x'], 'meter.jpg', { type: 'image/jpeg' })] },
  });
}
const checkinOf203 = () =>
  mockControl.statements.readings.find(
    (r) => r.roomNo === '203' && r.kind === 'checkin' && !r.voidedAt,
  );

describe('FB-INV-012 S12 check-in reading for a mid-month arrival (INV 17/11, ARC-FE-189-01)', () => {
  it('"missing opening" row → Enter check-in reading → saved as kind=checkin; the row then shows the opening', async () => {
    pinDay(windowDay());
    midMonthArrival();
    renderApp('/long-stay/meters', 'qa.fd');
    const dlg = await openCheckin();
    // Required: date, both meters, photo.
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.save') }));
    expect(within(dlg).getAllByText(tv('common.required')).length).toBe(3);
    expect(within(dlg).getByText(tv('meters.photo_required'))).toBeVisible();
    // A day outside the reading month is refused on the desk.
    const { P } = mockControl.statements;
    fillCheckin(dlg, `${shiftMonth(P, -1)}-28`, '1300', '36.07');
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.save') }));
    expect(within(dlg).getByText(tv('meters.checkin_date_range'))).toBeVisible();
    fillCheckin(dlg, `${P}-10`, '1300', '36.07');
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.save') }));
    await waitFor(() => expect(checkinOf203()).toBeDefined());
    const r = checkinOf203()!;
    expect(r).toMatchObject({ readOn: `${P}-10`, periodMonth: null, acknowledgedLower: false });
    expect(r.electricity.value).toBe(1300);
    expect(r.water.value).toBe(36);
    expect(r.photoAttachmentId).toBeTruthy();
    await waitFor(async () =>
      expect((await row203()).textContent).toContain(tv('meters.opening_of', { value: '1.300' })),
    );
    expect(
      within(await row203()).queryByRole('button', { name: tv('meters.checkin_enter') }),
    ).toBeNull();
  });

  it('below the room\'s last closing: 422 → same warning; "Save anyway" resends with the flag and a new key', async () => {
    pinDay(windowDay());
    midMonthArrival(1320);
    const sent: Array<{ ack: unknown; key: string | null }> = [];
    server.use(
      http.post('*/reservations/:reservationId/meter-readings', async ({ request }) => {
        const b = (await request.clone().json()) as Record<string, unknown>;
        sent.push({
          ack: b.acknowledgeLowerThanPrevious,
          key: request.headers.get('idempotency-key'),
        });
        return undefined;
      }),
    );
    renderApp('/long-stay/meters', 'qa.fd');
    const dlg = await openCheckin();
    fillCheckin(dlg, `${mockControl.statements.P}-10`, '1300', '36');
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.save') }));
    const warn = await screen.findByRole('alertdialog');
    expect(warn.textContent).toContain(
      tv('meters.below_body', { opening: '1.300', previous: '1.320' }),
    );
    // FD: Meter replaced is for the lead.
    expect(
      within(warn).getByRole('button', { name: tv('meters.exception.replaced') }),
    ).toBeDisabled();
    fireEvent.click(within(warn).getByRole('button', { name: tv('meters.save_anyway') }));
    await waitFor(() => expect(checkinOf203()).toBeDefined());
    expect(checkinOf203()!.acknowledgedLower).toBe(true);
    expect(sent).toHaveLength(2);
    expect(sent[0]!.ack).toBeUndefined();
    expect(sent[1]!.ack).toBe(true);
    expect(sent[1]!.key).not.toBe(sent[0]!.key);
  });
});
