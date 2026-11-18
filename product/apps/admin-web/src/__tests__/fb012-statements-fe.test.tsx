// FB-INV-012 (R5, after the review) – monthly statements of long stays on the Desk (ARC contract §6, FE test criteria
// §8 1–4; UXD-189-01..11). Numbers are the DOM example: electricity 142 kWh × 4.000 = 568.000 net, water 3,4 m³ ×
// 25.000 = 85.000 net, one line "VAT on electricity and water" 49.690, subtotal 9.453.000, total 9.502.690 →
// 9.502.000 with "Rounding −690". S12 (meter readings) is covered by fb012-meters-fe.test.tsx. All data is made up.
import { encodeQr, qrSvgPath } from '@ottimo/ui';
import { translate } from '@ottimo/i18n';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { parseEmv } from '../mocks/statements';
import { warningText } from '../pages/longstay/labels';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exact = (s: string) => new RegExp(`^${esc(s)}$`);
const P_ID = '0192a1b0-0000-7000-8000-0000000000a1';

/**
 * The DOM example for room 203: the seed opens month P at 1.262 / 35,2 (`period_start`); the closing of P is
 * 1.404 / 38,6 → 142 kWh and 3,4 m³. Pass `kwh` to change the usage (e.g. above the anomaly threshold).
 */
function recordDomClosing(kwh = 142) {
  const st = mockControl.statements;
  const open = st.readings.find(
    (r) => r.roomNo === '203' && r.kind === 'period_start' && r.periodMonth === st.P,
  )!;
  st.seq += 1;
  st.readings.push({
    ...open,
    id: '0192a1b0-0000-7000-8000-000000839999',
    seq: st.seq,
    kind: 'period_end',
    readOn: `${st.M}-01`,
    electricity: { value: open.electricity.value + kwh, exception: null },
    water: { value: 38.6, exception: null },
    photoAttachmentId: '0192a1b0-0000-7000-8000-000000849999',
    lateReason: null,
    acknowledgedLower: false,
    createdAt: new Date().toISOString(),
    version: 1,
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

describe('FB-INV-012 S16 statements – lines, totals, flow', () => {
  it('draft: utilities net + one VAT line, rent/services "incl.", subtotal adds up, rounding −690 (UXD-189-01)', async () => {
    pinDaytime();
    recordDomClosing();
    renderApp('/long-stay/statements', 'qa.fd');
    const dlg = await openDraftFor203();
    expect(await within(dlg).findByText('568.000')).toBeVisible();
    expect(within(dlg).getByText('85.000')).toBeVisible();
    // The gross utility amounts are not on the lines any more.
    expect(within(dlg).queryByText('613.440')).toBeNull();
    expect(within(dlg).queryByText('89.250')).toBeNull();
    expect(within(dlg).getByText(tv('stmt.vat_total'))).toBeVisible();
    expect(within(dlg).getByText('49.690')).toBeVisible();
    expect(within(dlg).getByText(tv('stmt.subtotal'))).toBeVisible();
    expect(within(dlg).getByText('9.453.000')).toBeVisible();
    expect(within(dlg).getByText('−690')).toBeVisible();
    expect(within(dlg).getAllByText('9.502.000').length).toBeGreaterThan(0);
    // Rent and the two services: VAT already in the price.
    expect(within(dlg).getAllByText(tv('stmt.vat_incl')).length).toBe(3);
    // The status chip says Draft; the title does not repeat it (UXD-189-10).
    const title = within(dlg).getByRole('heading', { level: 2 });
    expect(title.textContent).not.toContain(tv('stmt.status.draft'));
    // The amount column never wraps; the move button sits on its own row (UXD-189-04).
    for (const td of dlg.querySelectorAll('td.stmt-amt'))
      expect(td.closest('table')).toHaveClass('stmt-lines');
    expect(dlg.querySelectorAll('tr.stmt-move-row').length).toBe(2);
    // Three columns (description with qty × price under it, VAT, amount): the money fits the drawer at 390 px.
    expect(dlg.querySelectorAll('table.stmt-lines thead th')).toHaveLength(3);
    expect(within(dlg).getByText('142 kWh × 4.000')).toBeVisible();
    // FD on a draft: update/issue/void, not the prior-period adjustment (A122).
    expect(within(dlg).getByRole('button', { name: tv('stmt.issue') })).toBeVisible();
    expect(within(dlg).queryByText(tv('stmt.prior_title'))).toBeNull();
  });

  it('flow: draft → acknowledge warning → issue → print link → VietQR payment → Paid', async () => {
    pinDaytime();
    // 360 kWh: above the 300 kWh no-history threshold → METER_ANOMALY to confirm before issuing.
    recordDomClosing(360);
    renderApp('/long-stay/statements', 'qa.fd');
    const dlg = await openDraftFor203();
    const issue = await within(dlg).findByRole('button', { name: tv('stmt.issue') });
    expect(issue).toBeDisabled();
    fireEvent.click(within(dlg).getByRole('checkbox'));
    expect(issue).toBeEnabled();
    fireEvent.click(issue);
    const { M } = mockControl.statements;
    const code = `TT-${M.slice(2, 4)}${M.slice(5, 7)}-203`;
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
    renderApp('/long-stay/statements?tab=overdue', 'qa.fdl');
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

  it('Today: overdue statements are a row of the same "Cần chú ý" list, counted in its badge (UXD-189-08)', async () => {
    pinDaytime();
    renderApp('/today', 'qa.fd');
    const st = mockControl.statements;
    const overdue = st.periods.filter((p) => p.status === 'issued');
    const balance = overdue.reduce((s, p) => s + p.snapshot!.totals.totalVnd - p.paidVnd, 0);
    const text = tv('stmt.attention_overdue_amount', {
      n: overdue.length,
      amount: new Intl.NumberFormat('vi-VN').format(balance),
    });
    const row = await screen.findByText(text);
    const task = row.closest('.task')!;
    expect(task).toHaveClass('stmt-attn-late');
    const heading = screen.getByRole('heading', {
      name: new RegExp(`^${esc(tv('today.attention'))}`),
    });
    const list = heading.closest('section')!.querySelector('ul')!;
    expect(list).toContainElement(task as HTMLElement);
    const link = (task.closest('a') ??
      within(task as HTMLElement).getByRole('link')) as HTMLElement;
    expect(link.getAttribute('href')).toBe('/long-stay/statements?tab=overdue');
    const badge = heading.querySelector('.badge')!;
    expect(Number(badge.textContent)).toBe(list.querySelectorAll(':scope > li').length);
  });
});

describe('FB-INV-012 print sheet (A5/A4, brand, VietQR, no personal data)', () => {
  async function issuedSheet() {
    pinDaytime();
    renderApp('/long-stay/statements', 'qa.fd');
    await screen.findByRole('heading', { level: 1 });
    return mockControl.statements.periods.find((x) => x.status === 'issued')!;
  }
  async function sheet() {
    return waitFor(() => {
      const el = document.querySelector('.stmt-preview .stmt-sheet');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
  }
  const root = () => document.querySelector('body > .print-root');

  it('A5 by default up to 6 lines, A4 on request – the class on .print-root picks the named @page', async () => {
    const p = await issuedSheet();
    expect(p.snapshot!.lines.filter((l) => l.kind !== 'rounding').length).toBeLessThanOrEqual(6);
    renderApp(`/print/statements/${p.id}`, 'qa.fd');
    await waitFor(() => expect(root()).not.toBeNull());
    expect(root()).toHaveClass('stmt-paper-a5');
    fireEvent.click(screen.getAllByRole('button', { name: 'A4' }).at(-1)!);
    await waitFor(() => expect(root()).toHaveClass('stmt-paper-a4'));
    const css = readFileSync(join(__dirname, '..', 'statements.css'), 'utf8');
    expect(css).toMatch(/@page stmt-a5 \{\s*size: A5 portrait;/);
    expect(css).toMatch(/@page stmt-a4 \{\s*size: A4 portrait;/);
    expect(css).toMatch(/\.print-root\.stmt-paper-a5 \.stmt-sheet \{\s*page: stmt-a5;/);
    // UXD-189-03: body 9pt, the VI line never under 7pt.
    expect(css).toMatch(/\.stmt-sheet \{[^}]*font-size: 9pt;/);
    expect(css).toMatch(/max\(7pt, 0\.8em\)/);
  });

  it('7 printed lines → A4 by default (UXD-189-03)', async () => {
    const p = await issuedSheet();
    const snap = p.snapshot!;
    const extra = snap.lines.filter((l) => l.kind !== 'rounding').length;
    const svc = { ...snap.lines.find((l) => l.kind === 'rent')!, kind: 'service' as const };
    for (let i = extra; i < 7; i += 1)
      snap.lines.push({ ...svc, labelParams: { n: i }, amountVnd: 0 });
    renderApp(`/print/statements/${p.id}`, 'qa.fd');
    await waitFor(() => expect(root()).toHaveClass('stmt-paper-a4'));
    // UXD-189-16: the toolbar says why, also when the line count chose A4.
    expect(screen.getByText(tv('stmt.paper_switched'))).toHaveAttribute('role', 'status');
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

  it('EN leads, VI under it; periods and months on the sheet; QR = balance + code; no gap, no guest contact', async () => {
    const p = await issuedSheet();
    renderApp(`/print/statements/${p.id}`, 'qa.fd');
    const s = await sheet();
    const title = within(s).getByRole('heading', { level: 1 });
    expect(title.querySelector('[lang="en"]')).toHaveTextContent('Monthly statement');
    expect(title.querySelector('[lang="vi"]')).toHaveTextContent('Phiếu thanh toán tháng');
    const text = s.textContent ?? '';
    // UXD-189-02: rent period and utilities & services period; the month on the utility lines.
    expect(text).toContain(translate('en', 'stmt.print.rent_period'));
    expect(text).toContain(translate('en', 'stmt.print.utility_period'));
    expect(text).toMatch(/Electricity · [A-Z][a-z]{2} \d{4}/);
    expect(text).toMatch(/Điện tháng \d{2}\/\d{4}/);
    // UXD-189-01: one VAT line for electricity and water; "incl." on rent.
    expect(text).toContain(translate('en', 'stmt.print.vat'));
    expect(text).toContain(translate('en', 'stmt.print.vat_incl'));
    // Statement code in the header and as the transfer reference – both JetBrains Mono.
    const codes = within(s).getAllByText(exact(p.code!));
    expect(codes).toHaveLength(2);
    for (const c of codes) expect(c).toHaveClass('mono');
    expect(within(s).getByText(translate('en', 'stmt.print.rounding'))).toBeVisible();
    expect(text).toContain('Please pay by 05 ');
    expect(text).toMatch(/Vui lòng thanh toán đến hết ngày 05\//);
    expect(text).toContain(translate('en', 'stmt.print.qr_title'));
    expect(text).toContain(translate('en', 'stmt.print.qr_keep_ref'));
    const emoji = /\p{Extended_Pictographic}/u;
    expect(text).not.toMatch(emoji);
    for (const lang of ['en', 'vi'] as const)
      for (const k of ['title', 'pay_by', 'vat_note', 'paid_stamp', 'balance', 'qr_title'])
        expect(translate(lang, `stmt.print.${k}`)).not.toMatch(emoji);
    // Personal data: full name and room only (contract §9.1); the property sends no e-mail (BE print schema).
    expect(text).toContain('Trần Lan');
    // UXD-189-11 / BE-190-12: `roomNames` beside `roomNos` – the name in Lora, the number in Mono.
    const roomName = within(s).getByText(/^The Ivory/);
    expect(roomName).toHaveClass('stmt-room-name');
    expect(roomName.nextElementSibling).toHaveTextContent('302');
    expect(roomName.nextElementSibling).toHaveClass('mono');
    expect(text).not.toContain('@');
    expect([...text.matchAll(/(?:\+84|\b0)\d{2,3} \d{3} \d{3,4}/g)].map((m) => m[0])).toEqual([
      '0900 000 000',
    ]);
    expect(text).not.toMatch(/quốc tịch|nationality|passport|CCCD/i);
    // The vacancy gap stays off paper (INV 17/11).
    expect(text).not.toContain(translate('en', 'meters.gap_saved', { gap: '' }).split(':')[0]!);
    // VietQR: the payload the server built, drawn as is; it carries the balance and the statement code.
    const svg = s.querySelector('svg.qr')!;
    expect(svg.getAttribute('aria-label')!).toContain(p.code!);
    const res = await fetch(`http://localhost/v1/properties/${P_ID}/billing-periods/${p.id}/print`);
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
    expect(text).toMatch(/•••• \d{4}/);
    expect(text).not.toMatch(/\d{8,}/);
  });

  it('Subtotal = sum of the Amount column on the sheet (UXD-189-01 invariant)', async () => {
    const p = await issuedSheet();
    renderApp(`/print/statements/${p.id}`, 'qa.fd');
    const s = await sheet();
    const n = (x: string) =>
      Number(
        x
          .replace(/\./g, '')
          .replace('−', '-')
          .replace(/[^\d-]/g, ''),
      );
    const rows = [...s.querySelectorAll('table.stmt-table-print tbody tr')];
    expect(rows.length).toBeGreaterThan(2);
    const amounts = rows.map((tr) => n(tr.querySelector('td:last-child')!.textContent ?? ''));
    const sub = s.querySelector('table.stmt-totals tr td')!;
    expect(n(sub.textContent ?? '')).toBe(amounts.reduce((a, b) => a + b, 0));
  });

  it('a warning code the desk does not know reads generically, with its code (ARC-FE-189-07, UXD-189-14)', () => {
    expect(warningText((k, a) => translate('en', k, a), { code: 'NEW_RULE_X' })).toBe(
      'Unrecognised warning (NEW_RULE_X). Check the statement before issuing.',
    );
  });

  it('issued after the due day → "Payment due on receipt", never a date already past (UXD-189-06)', async () => {
    const p = await issuedSheet();
    const late = `${p.snapshot!.dueDate!}T00:00:00+07:00`.replace(
      /-(\d{2})T/,
      (_, d: string) => `-${String(Number(d) + 1).padStart(2, '0')}T`,
    );
    p.issuedAt = late;
    p.snapshot!.issuedAt = late;
    renderApp(`/print/statements/${p.id}`, 'qa.fd');
    const s = await sheet();
    expect(s.textContent).toContain(translate('en', 'stmt.print.due_on_receipt'));
    expect(s.textContent).not.toContain('Please pay by');
  });
});
