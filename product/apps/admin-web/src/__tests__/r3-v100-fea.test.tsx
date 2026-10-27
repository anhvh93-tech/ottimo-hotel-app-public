// v1.0.0 fixes from the QA manual check on staging rc.3 (27/10, `rounds/round-03/qa/bug-list.md`):
// BUG-R3-019 (P1) long-stay booking without a source, BUG-R3-022 charges after check-out, BUG-R3-023 change-room
// group labels, BUG-R3-020 printing the bill. MSW mirrors the server rules these depend on (US-155 `directSource`
// REQUIRED – `reservations.service.ts`; BR-427 (c) window – `folio.service.ts` `lockForPosting`).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeDraft } from '../app/clientData';
import { businessDayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);

afterEach(() => vi.restoreAllMocks());
const here = dirname(new URL(import.meta.url).pathname);

function capture(method: string, re: RegExp) {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== method || !re.test(new URL(request.url).pathname)) return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

describe('BUG-R3-019 – Đơn dài hạn nhập tay sends a source (US-155)', () => {
  async function openLongStay(user: ReturnType<typeof renderApp>['user']) {
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: tv('lsm.title') }));
    return screen.findByRole('dialog', { name: new RegExp(esc(tv('lsm.title'))) });
  }
  async function fillAndCreate(user: ReturnType<typeof renderApp>['user'], dlg: HTMLElement) {
    // Dates when every room is free (the seed fills the coming days).
    fireEvent.change(within(dlg).getByLabelText(label('lsm.move_in')), {
      target: { value: addDays(businessDayLocal(), 60) },
    });
    fireEvent.change(within(dlg).getByLabelText(label('lsm.move_out')), {
      target: { value: addDays(businessDayLocal(), 152) },
    });
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Hoàng Gia');
    await user.click(await screen.findByRole('option', { name: /Hoàng Gia Bảo/ }));
    await user.type(within(dlg).getByLabelText(label('lsm.rent')), '12000000');
    await user.click(within(dlg).getByRole('button', { name: tv('lsm.create') }));
  }

  it('the H09 "Nguồn" field (same options, no Sales staff) – the chosen source is sent and saved', async () => {
    const cap = capture('POST', /\/reservations$/);
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openLongStay(user);
    const source = within(dlg).getByLabelText(label('bk.source'));
    expect(source).toHaveValue('zalo_phone');
    const options = within(source)
      .getAllByRole<HTMLOptionElement>('option')
      .map((o) => o.textContent);
    expect(options).toEqual(
      ['bk.src_zalo', 'bk.src_web', 'bk.src_walkin', 'bk.src_return'].map((k) => tv(k)),
    );
    expect(options).not.toContain(tv('bk.src_sales'));
    await user.selectOptions(source, 'walk_in');
    await fillAndCreate(user, dlg);
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    cap.stop();
    expect(cap.sent.at(-1)).toMatchObject({ directSource: 'walk_in', manualLongStay: {} });
    const r = mockControl.rsv.reservations.at(-1)!;
    expect(r.externalContract).toBe(true);
    expect(r.directSource).toBe('walk_in');
  });

  it('default source (Zalo / phone) is enough – no 422 directSource REQUIRED any more', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openLongStay(user);
    await fillAndCreate(user, dlg);
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(mockControl.rsv.reservations.at(-1)!.directSource).toBe('zalo_phone');
  });

  it('a draft saved before the fix (no source) opens with the default source', async () => {
    mockControl.signInAs('qa.fd');
    const me = mockControl.db.users.find((u) => u.username === 'qa.fd')!;
    writeDraft(
      `booking.longStay.${me.id}`,
      JSON.stringify({
        roomId: '',
        arrivalDate: '2027-03-01',
        departureDate: '2027-06-01',
        occ: { adults: 1, children6to11: 0, childrenUnder6: 0 },
        guest: null,
        phone: '',
        rent: '',
        deposit: '',
        contractRef: 'HD-MAU-2027-01',
        note: '',
      }),
    );
    const { user } = renderApp('/rack');
    const dlg = await openLongStay(user);
    expect(within(dlg).getByLabelText(label('lsm.contract_ref'))).toHaveValue('HD-MAU-2027-01');
    expect(within(dlg).getByLabelText(label('bk.source'))).toHaveValue('zalo_phone');
  });
});

describe('BUG-R3-022 – Thêm phát sinh after check-out while the server takes it (BR-427 (c))', () => {
  /** Ngọc Anh: checked out, folio settled `hoursAgo` hours ago (window = post_checkout_charge_hours 24). */
  function checkedOut(status: 'settled' | 'closed', hoursAgo = 2) {
    const r = res('Ngọc Anh');
    const f = mockControl.stay.folios.get(r.folioId!)!;
    f.status = status;
    f.settledAt = new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
    return { r, f };
  }

  it('FD, settled folio inside the window: the button is there and the line is posted', async () => {
    const { r, f } = checkedOut('settled');
    const before = f.lines.length;
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('stay.add_charge') }));
    const dlg = await screen.findByRole('dialog', { name: tv('stay.add_charge') });
    await user.selectOptions(
      await within(dlg).findByLabelText(label('stay.charge_item')),
      'LAUNDRY_KG',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('stay.add_charge_submit') }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: tv('stay.add_charge') })).not.toBeInTheDocument(),
    );
    expect(f.lines.length).toBe(before + 1);
    expect(f.lines.at(-1)!.category).toBe('laundry');
  });

  it('closed folio (window over, J15 done): no button', async () => {
    const { r } = checkedOut('closed', 30);
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await within(d).findByRole('button', { name: tv('co.preview_bill') });
    expect(within(d).queryByRole('button', { name: tv('stay.add_charge') })).toBeNull();
  });

  it('settled but past the window before J15 closes it: the server refuses (409), the desk says so', async () => {
    const { r, f } = checkedOut('settled', 25);
    const before = f.lines.length;
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('stay.add_charge') }));
    const dlg = await screen.findByRole('dialog', { name: tv('stay.add_charge') });
    await user.selectOptions(
      await within(dlg).findByLabelText(label('stay.charge_item')),
      'LAUNDRY_KG',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('stay.add_charge_submit') }));
    expect(await within(dlg).findByRole('alert')).toBeInTheDocument();
    expect(f.lines.length).toBe(before);
  });
});

describe('BUG-R3-023 – Đổi phòng lists room groups by name, not L12 / N / NPLUS', () => {
  it('every option shows the group name from listRoomGroups', async () => {
    const kim = res('Kim Seo-yeon');
    const { user } = renderApp(`/reservations/${kim.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(within(d).getByRole('button', { name: tv('drawer.action.change_room') }));
    const dlg = await screen.findByRole('dialog', { name: /^Đổi phòng · Căn 402/ });
    const names = mockControl.db.groups.map((g) => g.name);
    await waitFor(() =>
      expect(
        within(dlg)
          .getAllByRole('radio')
          .some((x) => names.some((n) => x.closest('label')!.textContent!.includes(n))),
      ).toBe(true),
    );
    for (const radio of within(dlg).getAllByRole('radio'))
      expect(radio.closest('label')!.textContent).not.toMatch(/·\s*(L12|N|NPLUS)(\s|$)/);
  });
});

describe('BUG-R3-020 – In phiếu prints the bill only', () => {
  it('the print copy (body > .print-root) is there for as long as the bill is open – Ctrl+P too', async () => {
    const r = res('Ngọc Anh');
    mockControl.stay.folios.get(r.folioId!)!.status = 'settled';
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Ngọc Anh' });
    await user.click(await within(d).findByRole('button', { name: tv('co.preview_bill') }));
    const bill = await screen.findByRole('dialog', { name: tv('bill.title') });
    // Before any click on "In phiếu": a browser print (Ctrl+P) already finds the sheet.
    const root = document.querySelector('body > .print-root');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root!.querySelector('.bill-paper')).not.toBeNull();
    expect(root!.textContent).toContain(tv('bill.title'));
    // The button prints synchronously with the sheet in place (iPad Safari returns from print() at once).
    let atPrint: Element | null = null;
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      atPrint = document.querySelector('body > .print-root');
    });
    await user.click(within(bill).getByRole('button', { name: tv('co.print') }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(atPrint).not.toBeNull();
    expect(document.querySelector('body > .print-root')).not.toBeNull();
    await user.click(within(bill).getByRole('button', { name: tv('common.close') }));
    await waitFor(() => expect(document.querySelector('.print-root')).toBeNull());
  });

  it('print.css: A4, brand fonts, only brand colour tokens (80/15/5)', () => {
    const css = readFileSync(join(here, '../print.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/@media print\s*{/);
    expect(css).toMatch(/@page\s*{[^}]*size:\s*A4/);
    // UXD FB-R3-UXD-FE-A-18: body 11 pt, column labels 9 pt (guideline print scale).
    expect(css).toMatch(/\.print-root \.bill-paper\s*{[^}]*font-size:\s*11pt/);
    expect(css).toMatch(/\.print-root \.bill-paper th\s*{[^}]*font-size:\s*9pt/);
    expect(css).toMatch(/font-family:\s*var\(--serif\)/);
    expect(css).toMatch(/font-family:\s*var\(--sans\)/);
    expect(css).toMatch(/font-family:\s*var\(--mono\)/);
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    const colours = [...css.matchAll(/var\(--brand-([a-z]+)\)/g)].map((m) => m[1]);
    expect(new Set(colours)).toEqual(new Set(['white', 'ink', 'stone', 'sage', 'earth', 'oak']));
    const main = readFileSync(join(here, '../main.tsx'), 'utf8');
    expect(main.indexOf("import './print.css'")).toBeGreaterThan(
      main.indexOf("import '@ottimo/ui/styles.css'"),
    );
  });
});
