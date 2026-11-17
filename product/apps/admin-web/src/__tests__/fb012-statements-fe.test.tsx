// FB-INV-012 (R5) – monthly statements of long stays on the Desk (ARC contract §6, FE test criteria §8 1–4) with the
// INV decision of 17/11 (opening reading typed each period, previous closing shown as a reference, vacancy gap not
// billed, not printed). Numbers are the DOM examples: electricity 142 kWh × 4.000 + 8 % = 613.440, water 3,4 m³ ×
// 25.000 + 5 % = 89.250, total 9.502.690 → 9.502.000 with "Rounding −690". All guests and readings are made up.
import { encodeQr, qrSvgPath } from '@ottimo/ui';
import { translate } from '@ottimo/i18n';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { meterUsage } from '../app/statements';
import { mockControl } from '../mocks/handlers';
import { parseEmv } from '../mocks/statements';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exact = (s: string) => new RegExp(`^${esc(s)}$`);

/** Room 203 row of the S12 table. */
async function meterRow() {
  const th = await screen.findByRole('rowheader', { name: /^203 · N\. Minh/ });
  return th.closest('tr')!;
}

function typeReading(
  row: HTMLElement,
  meter: 'electricity' | 'water',
  opening: string,
  closing: string,
) {
  const name = tv(`stmt.meter.${meter}`);
  fireEvent.change(within(row).getByLabelText(`${name} – ${tv('meters.opening')} – 203`), {
    target: { value: opening },
  });
  fireEvent.change(within(row).getByLabelText(`${name} – ${tv('meters.closing')} – 203`), {
    target: { value: closing },
  });
}

function attachPhoto(row: HTMLElement) {
  const input = within(row).getByLabelText(new RegExp(`^${esc(tv('meters.photo'))}`));
  fireEvent.change(input, {
    target: { files: [new File(['x'], 'meter.jpg', { type: 'image/jpeg' })] },
  });
}

describe('FB-INV-012 S12 meter readings (INV 17/11: opening typed, gap not billed)', () => {
  it('usage = closing − opening, meter replaced and rollover formulas (BR-LS-12)', () => {
    expect(meterUsage({ opening: 1250, value: 1392, exception: null }, 'electricity')).toBe(142);
    expect(meterUsage({ opening: 35.2, value: 38.6, exception: null }, 'water')).toBe(3.4);
    expect(
      meterUsage(
        {
          opening: 1250,
          value: 82,
          exception: { type: 'replaced', oldFinal: 1310, newStart: 0, replacedOn: '2026-11-15' },
        },
        'electricity',
      ),
    ).toBe(142);
    expect(
      meterUsage(
        { opening: 99990, value: 20, exception: { type: 'rollover', maxValue: 99999 } },
        'electricity',
      ),
    ).toBe(30);
  });

  it('opening is an empty required input; last closing is shown beside it, a gap is "not billed", lower opening warns', async () => {
    pinDaytime();
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await meterRow();
    const opening = within(row).getByLabelText(
      `${tv('stmt.meter.electricity')} – ${tv('meters.opening')} – 203`,
    );
    // Not pre-filled with the previous closing (INV 17/11).
    expect(opening).toHaveValue('');
    expect(within(row).getByText(tv('meters.last_closing', { value: '1.250' }))).toBeVisible();
    // Opening above the last closing → vacancy use, not billed.
    fireEvent.change(opening, { target: { value: '1262' } });
    expect(within(row).getByText(tv('meters.gap', { gap: '12' }))).toBeVisible();
    // Opening below → warning (wrong entry / replaced meter).
    fireEvent.change(opening, { target: { value: '1200' } });
    expect(
      within(row).getByText(tv('meters.opening_below_last', { value: '1.250' })),
    ).toBeVisible();
    // Required: saving without it says so.
    fireEvent.change(opening, { target: { value: '' } });
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    expect(within(row).getAllByText(tv('common.required')).length).toBeGreaterThan(0);
  });

  it('records the opening and closing the desk typed; the gap is stored, billed usage excludes it', async () => {
    pinDaytime();
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await meterRow();
    typeReading(row, 'electricity', '1262', '1404');
    typeReading(row, 'water', '35.2', '38.67');
    attachPhoto(row);
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    await waitFor(() =>
      expect(
        mockControl.statements.readings.some(
          (r) =>
            r.roomNo === '203' &&
            r.kind === 'period_end' &&
            r.periodMonth === mockControl.statements.P,
        ),
      ).toBe(true),
    );
    const saved = mockControl.statements.readings.at(-1)!;
    expect(saved.electricity).toMatchObject({ opening: 1262, value: 1404 });
    // BR-LS-11: water keeps one decimal, the rest is dropped (38,67 → 38,6).
    expect(saved.water).toMatchObject({ opening: 35.2, value: 38.6 });
    const done = await meterRow();
    expect(await within(done).findByText(tv('meters.usage', { usage: '142' }))).toBeVisible();
    expect(within(done).getByText(tv('meters.gap_saved', { gap: '12' }))).toBeVisible();
  });

  it('FD: closing below opening offers Wrong entry only – replaced / rollover say "ask the lead" (A89)', async () => {
    pinDaytime();
    renderApp('/long-stay/meters', 'qa.fd');
    const row = await meterRow();
    typeReading(row, 'electricity', '1250', '82');
    typeReading(row, 'water', '35.2', '38.6');
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
    // No photo-waiver for FD either.
    expect(within(row).queryByLabelText(tv('meters.photo_waive'))).toBeNull();
  });

  it('FDL: meter replaced is saved with its exception (60 + 82 = 142)', async () => {
    pinDaytime();
    renderApp('/long-stay/meters', 'qa.fdl');
    const row = await meterRow();
    typeReading(row, 'electricity', '1250', '82');
    typeReading(row, 'water', '35.2', '38.6');
    attachPhoto(row);
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    const dlg = await screen.findByRole('alertdialog');
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.exception.replaced') }));
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${esc(tv('meters.old_final'))}`)), {
      target: { value: '1310' },
    });
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${esc(tv('meters.replaced_on'))}`)), {
      target: { value: `${mockControl.statements.P}-15` },
    });
    fireEvent.click(within(dlg).getByRole('button', { name: tv('meters.use_exception') }));
    expect(within(row).getByText(tv('meters.usage', { usage: '142' }))).toBeVisible();
    fireEvent.click(within(row).getByRole('button', { name: tv('meters.save') }));
    await waitFor(() =>
      expect(mockControl.statements.readings.at(-1)!.electricity.exception).toMatchObject({
        type: 'replaced',
        oldFinal: 1310,
      }),
    );
  });
});

/** Seed + the DOM example readings for room 203 (closing month M−1). */
function recordDomExample() {
  const st = mockControl.statements;
  const stay = st.stays[0]!;
  st.readings.push({
    id: '0192a1b0-0000-7000-8000-000000839999',
    reservationId: stay.reservationId,
    roomId: stay.roomId,
    roomNo: stay.roomNo,
    kind: 'period_end',
    periodMonth: st.P,
    readOn: `${st.M}-01`,
    electricity: { opening: 1250, value: 1392, exception: null },
    water: { opening: 35.2, value: 38.6, exception: null },
    photoAttachmentId: '0192a1b0-0000-7000-8000-000000849999',
    photoWaived: false,
    note: null,
    readAt: new Date().toISOString(),
    readByInitials: 'H',
    voidedAt: null,
    voidReason: null,
  });
}

async function openDraftFor203() {
  const ready = await screen.findByRole('heading', {
    name: new RegExp(esc(tv('stmt.ready_title', { month: '' }).trim())),
  });
  const section = ready.closest('section')!;
  const item = (await within(section).findByText('203')).closest('li')!;
  fireEvent.click(within(item).getByRole('button', { name: tv('stmt.create_draft') }));
  return screen.findByRole('dialog');
}

describe('FB-INV-012 S16 statements – availableActions, flow, totals', () => {
  it('draft shows the DOM numbers: 613.440 + 89.250, rounding −690, total 9.502.000', async () => {
    pinDaytime();
    recordDomExample();
    renderApp('/long-stay/statements', 'qa.fd');
    const dlg = await openDraftFor203();
    expect(await within(dlg).findByText('613.440')).toBeVisible();
    expect(within(dlg).getByText('89.250')).toBeVisible();
    expect(within(dlg).getByText('−690')).toBeVisible();
    expect(within(dlg).getAllByText('9.502.000').length).toBeGreaterThan(0);
    // FD on a draft: update/issue/void, not the prior-period adjustment (A122).
    expect(within(dlg).getByRole('button', { name: tv('stmt.issue') })).toBeVisible();
    expect(within(dlg).queryByText(tv('stmt.prior_title'))).toBeNull();
  });

  it('flow: readings → draft → acknowledge warning → issue → print link → VietQR payment → Paid', async () => {
    pinDaytime();
    // 360 kWh: above the 300 kWh no-history threshold → METER_ANOMALY to confirm before issuing.
    recordDomExample();
    mockControl.statements.readings.at(-1)!.electricity.value = 1610;
    renderApp('/long-stay/statements', 'qa.fd');
    const dlg = await openDraftFor203();
    const issue = await within(dlg).findByRole('button', { name: tv('stmt.issue') });
    expect(issue).toBeDisabled();
    fireEvent.click(within(dlg).getByRole('checkbox'));
    expect(issue).toBeEnabled();
    fireEvent.click(issue);
    const code = `TT-${mockControl.statements.M.slice(2, 4)}${mockControl.statements.M.slice(5, 7)}-203`;
    expect(await within(dlg).findByText(code)).toBeVisible();
    // Print opens /print/statements/:id – the id only in the URL (criterion 4).
    const print = within(dlg).getByRole('link', { name: tv('stmt.print') });
    const id = mockControl.statements.periods.find((p) => p.code === code)!.id;
    expect(print).toHaveAttribute('href', `/print/statements/${id}`);
    // FD cannot void an issued statement (A122).
    expect(within(dlg).queryByRole('button', { name: tv('stmt.void') })).toBeNull();
    fireEvent.click(within(dlg).getByRole('button', { name: tv('stmt.record_payment') }));
    const amount = within(dlg).getByLabelText(new RegExp(`^${esc(tv('stmt.pay_amount'))}`));
    const total = mockControl.statements.periods.find((p) => p.id === id)!.snapshot!.totals
      .totalVnd;
    expect(amount).toHaveValue(String(total));
    fireEvent.click(within(dlg).getByRole('button', { name: tv('stmt.pay_save') }));
    await waitFor(() =>
      expect(mockControl.statements.periods.find((p) => p.id === id)!.status).toBe('paid'),
    );
    expect(mockControl.statements.periods.find((p) => p.id === id)!.payments[0]).toMatchObject({
      method: 'vietqr',
      reconciliation: 'pending',
    });
    expect(await within(dlg).findByText(tv('stmt.status.paid'))).toBeVisible();
  });

  it('FDL sees Void on an issued unpaid statement and can create the replacement (-R1)', async () => {
    pinDaytime();
    renderApp('/long-stay/statements', 'qa.fdl');
    fireEvent.click(await screen.findByRole('button', { name: tv('stmt.tab.overdue') }));
    const code = `TT-${mockControl.statements.P.slice(2, 4)}${mockControl.statements.P.slice(5, 7)}-302`;
    fireEvent.click(await screen.findByRole('button', { name: code }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(await within(dlg).findByRole('button', { name: tv('stmt.void') }));
    fireEvent.change(within(dlg).getByLabelText(new RegExp(`^${esc(tv('stmt.void_reason'))}`)), {
      target: { value: 'Sai chỉ số' },
    });
    fireEvent.click(within(dlg).getByRole('button', { name: tv('stmt.void_confirm') }));
    fireEvent.click(
      await within(dlg).findByRole('button', { name: tv('stmt.create_replacement') }),
    );
    await waitFor(() =>
      expect(mockControl.statements.periods.filter((p) => p.status === 'draft')).toHaveLength(1),
    );
  });

  it('Today "Cần chú ý" counts overdue statements (BR-LS-02)', async () => {
    pinDaytime();
    renderApp('/today', 'qa.fd');
    expect(await screen.findByText(tv('stmt.attention_overdue', { n: 1 }))).toBeVisible();
  });
});

describe('FB-INV-012 print sheet (A5/A4, brand, VietQR, no personal data)', () => {
  async function issuedSheet() {
    pinDaytime();
    renderApp('/long-stay/statements', 'qa.fd');
    await screen.findByRole('heading', { level: 1 });
    const p = mockControl.statements.periods.find((x) => x.status === 'issued')!;
    return p;
  }

  it('A5 by default, A4 on request – the class on .print-root picks the named @page', async () => {
    const p = await issuedSheet();
    renderApp(`/print/statements/${p.id}`, 'qa.fd');
    await waitFor(() => expect(document.querySelector('body > .print-root')).not.toBeNull());
    const root = document.querySelector('body > .print-root')!;
    expect(root).toHaveClass('stmt-paper-a5');
    fireEvent.click(screen.getAllByRole('button', { name: 'A4' }).at(-1)!);
    await waitFor(() =>
      expect(document.querySelector('body > .print-root')).toHaveClass('stmt-paper-a4'),
    );
    const css = readFileSync(join(__dirname, '..', 'statements.css'), 'utf8');
    expect(css).toMatch(/@page stmt-a5 \{\s*size: A5 portrait;/);
    expect(css).toMatch(/@page stmt-a4 \{\s*size: A4 portrait;/);
    expect(css).toMatch(/\.print-root\.stmt-paper-a5 \.stmt-sheet \{\s*page: stmt-a5;/);
  });

  it('statements.css uses only the 80/15/5 brand palette and the three brand fonts', () => {
    const css = readFileSync(join(__dirname, '..', 'statements.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\b(rgb|rgba|hsl|hsla)\(/i);
    const vars = [...css.matchAll(/var\((--[a-z0-9-]+)\)/gi)].map((m) => m[1]);
    const allowed = new Set([
      '--brand-ivory',
      '--brand-cream',
      '--brand-stone',
      '--brand-ink',
      '--brand-oak',
      '--brand-earth',
      '--brand-sage',
      '--brand-white',
      '--serif',
      '--sans',
      '--mono',
    ]);
    expect(vars.filter((v) => !allowed.has(v!))).toEqual([]);
    const fonts = [...css.matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(fonts.length).toBeGreaterThan(3);
    expect(fonts.filter((f) => !/^var\(--(serif|sans|mono)\)$/.test(f))).toEqual([]);
    // The tokens behind the brand variables are the guideline values.
    const tokens = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'design', 'wireframes', 'assets', 'tokens.css'),
      'utf8',
    );
    for (const [k, v] of Object.entries({
      ivory: '#F4F0E8',
      cream: '#EDE6D8',
      stone: '#6B6760',
      ink: '#2B2B28',
      oak: '#B08D57',
      earth: '#7A5C44',
      sage: '#8A9079',
    }))
      expect(tokens).toContain(`--brand-${k}:${v};`);
  });

  it('EN leads, VI under it; no emoji; QR = balance + statement code; the vacancy gap and guest contact are not printed', async () => {
    const p = await issuedSheet();
    // A gap on the reading behind this statement must not reach the paper (INV 17/11).
    renderApp(`/print/statements/${p.id}`, 'qa.fd');
    const sheet = await waitFor(() => {
      const el = document.querySelector('.stmt-preview .stmt-sheet');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    const title = within(sheet).getByRole('heading', { level: 1 });
    expect(title.querySelector('[lang="en"]')).toHaveTextContent('Monthly statement');
    expect(title.querySelector('[lang="vi"]')).toHaveTextContent('Phiếu thanh toán tháng');
    // Statement code in the header and as the transfer reference – both JetBrains Mono.
    const codes = within(sheet).getAllByText(exact(p.code!));
    expect(codes).toHaveLength(2);
    for (const c of codes) expect(c).toHaveClass('mono');
    expect(within(sheet).getByText(translate('en', 'stmt.print.rounding'))).toBeVisible();
    expect(sheet.textContent).toContain('Please pay by 05 ');
    expect(sheet.textContent).toMatch(/Vui lòng thanh toán trước hết ngày 05\//);
    // No emoji anywhere on the sheet or in the guest strings.
    const emoji = /\p{Extended_Pictographic}/u;
    expect(sheet.textContent).not.toMatch(emoji);
    for (const lang of ['en', 'vi'] as const)
      for (const k of ['title', 'pay_by', 'vat_note', 'paid_stamp', 'balance'])
        expect(translate(lang, `stmt.print.${k}`)).not.toMatch(emoji);
    // Personal data: full name and room only (contract §9.1).
    expect(sheet.textContent).toContain('Trần Lan');
    // The only phone number and e-mail on paper are the property's own (hotline, mailbox).
    const text = sheet.textContent ?? '';
    expect(text.split('@')).toHaveLength(2);
    expect(text).toContain('stay@example.test');
    expect([...text.matchAll(/(?:\+84|\b0)\d{2,3} \d{3} \d{3,4}/g)].map((m) => m[0])).toEqual([
      '0900 000 000',
    ]);
    expect(sheet.textContent).not.toMatch(/quốc tịch|nationality|passport|CCCD/i);
    expect(sheet.textContent).not.toMatch(
      new RegExp(esc(translate('en', 'meters.gap_saved', { gap: '' }).split(':')[0]!)),
    );
    // VietQR: the payload the server built, drawn as is; it carries the balance and the statement code.
    const svg = sheet.querySelector('svg.qr')!;
    const label = svg.getAttribute('aria-label')!;
    expect(label).toContain(p.code!);
    const res = await fetch(
      `http://localhost/v1/properties/0192a1b0-0000-7000-8000-0000000000a1/billing-periods/${p.id}/print`,
    );
    const body = (await res.json()) as {
      vietqr: { payload: string };
      totals: { balanceVnd: number };
    };
    const tags = parseEmv(body.vietqr.payload);
    expect(Number(tags['54'])).toBe(body.totals.balanceVnd);
    expect(tags['62.08']).toBe(p.code);
    expect(svg.querySelector('path')!.getAttribute('d')).toBe(
      qrSvgPath(encodeQr(body.vietqr.payload)),
    );
    // The receiving account shows its last 4 digits only.
    expect(sheet.textContent).toMatch(/•••• \d{4}/);
    expect(sheet.textContent).not.toMatch(/\d{8,}/);
  });
});
